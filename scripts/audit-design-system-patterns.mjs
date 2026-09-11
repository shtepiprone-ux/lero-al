#!/usr/bin/env node
/**
 * audit-design-system-patterns.mjs — design-system pattern census and allowlist-premise audit
 * (Task 816).
 *
 * Owner decision 1 (2026-09-11) classified 11 shared `src/design-system/mantine/patterns/*` files
 * as tier 3 ("shared design-system components WITH CANONICAL STORIES") and assigned this task to
 * own the allowlist and "re-measure it whenever a listed pattern changes." This script is that
 * re-measure command. It censuses EVERY `.tsx` file in the patterns directory — not only the 11 —
 * into exactly one governance state (enrolled / tier-3 allowlisted / neither), and, for each of the
 * allowlisted 11, verifies decision 1's own premise: is the pattern genuinely SHARED (>=2 distinct
 * consumers), and does a canonical Mantine Story import IT (not merely its parent)?
 *
 * Measurement sources — real tools, never an ad-hoc grep (`orchestrator-procedures.md`'s 710-714
 * corollary):
 *   - Governance state: `scripts/mantine-migration-scope.json` (enrolled) and
 *     `scripts/rendered-scope-allowlist.json` (tier-3), read directly.
 *   - Rendered-edge / consumer counts: the WHOLE-src reverse render graph from
 *     `map-changed-surfaces.mjs`'s `buildRenderGraph()` (Task 819) — every file under `src/` that
 *     actually renders the pattern as a JSX tag, not only enrolled roots. This is a superset of what
 *     `check:rendered-scope:report`'s `allowlisted` block can see (that walk starts only from
 *     manifest roots); filtering the whole-graph consumers to those that are THEMSELVES manifest
 *     entries reconstructs the exact same enrolled-only edge set that report prints, which is the
 *     cross-check this script prints alongside the whole-tree count (R1's own reconciliation
 *     requirement). **Cannot see:** a consumer reached only through dynamic `import()`/
 *     `React.lazy()`, or one living under a directory the render graph never walks into
 *     (`node_modules`/`.next`/`storybook-static`/`__tests__`/`stories`) — same blind spot
 *     `check-rendered-scope.mjs` and `map-changed-surfaces.mjs` already state.
 *   - Own-Story verdict: a duplicated (not imported — `check-surface-census.mjs` is out of scope for
 *     this task, per its own "never edited by a sibling task" convention) canonical-story import
 *     scan, keeping WHICH story file(s) import each pattern (directly or through the design system's
 *     own single-hop `index.ts(x)` barrel), not merely a yes/no Set.
 *
 * The audit FAILS (non-zero exit) only when an ALLOWLISTED entry's premise no longer holds: its path
 * is gone, it has fewer than 2 distinct whole-tree consumers, it has no own canonical Story, its
 * `reason`/`owner` is missing, or it is (invalidly) present in BOTH the manifest and the allowlist.
 * An UNGOVERNED pattern (in neither mechanism) is reported in the census as a finding, never as a
 * failure — until the owner picks a governance model (this task's own §5 STOP), "ungoverned" is not
 * yet a violation (§10 requirement 3).
 *
 * This command is an AUDIT, not a CI gate — decision 1 asks Task 816 to own and re-measure, not to
 * block. It is deliberately not wired into any GitHub Actions workflow by this task.
 *
 * Usage:
 *   node scripts/audit-design-system-patterns.mjs             # human census + premise verdicts
 *   node scripts/audit-design-system-patterns.mjs --json       # one JSON object, same exit code
 *   npm run audit:design-system-patterns
 *
 * Docs: docs/design-system-pattern-ownership.md, docs/golden-rules.md GR-1/GR-2.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { buildRenderGraph } from './map-changed-surfaces.mjs';
import { resolveImportSpecifier as resolveImportSpecifierShared } from './lib/import-resolver.mjs';
import { isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PATTERNS_DIR = join(ROOT, 'src', 'design-system', 'mantine', 'patterns');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'rendered-scope-allowlist.json');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');

function parseSourceFile(absPath) {
  const text = readFileSync(absPath, 'utf8');
  return ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
}

function resolveImportSpecifier(fromFile, spec) {
  return resolveImportSpecifierShared(ROOT, fromFile, spec);
}

// ── Duplicated verbatim-semantics from check-surface-census.mjs (that file is out of scope) ──

function extractImportBindings(sourceFile) {
  const bindings = [];
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (!clause) continue;
    const declTypeOnly = !!clause.isTypeOnly;
    if (clause.name) {
      bindings.push({ localName: clause.name.text, importedExportName: 'default', spec, typeOnly: declTypeOnly });
    }
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        bindings.push({ localName: clause.namedBindings.name.text, importedExportName: '*', spec, typeOnly: declTypeOnly });
      } else if (ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          const importedExportName = el.propertyName ? el.propertyName.text : el.name.text;
          bindings.push({
            localName: el.name.text,
            importedExportName,
            spec,
            typeOnly: declTypeOnly || !!el.isTypeOnly,
          });
        }
      }
    }
  }
  return bindings;
}

const BARREL_BASENAMES = new Set(['index.ts', 'index.tsx']);

function unwrapBarrel(resolvedPath, importedExportName) {
  if (!BARREL_BASENAMES.has(basename(resolvedPath))) {
    return { path: resolvedPath };
  }
  const absBarrel = join(ROOT, resolvedPath);
  let sourceFile;
  try {
    sourceFile = parseSourceFile(absBarrel);
  } catch {
    return { path: resolvedPath };
  }
  for (const stmt of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      stmt.isTypeOnly ||
      !stmt.moduleSpecifier ||
      !ts.isStringLiteral(stmt.moduleSpecifier) ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) continue;
    for (const el of stmt.exportClause.elements) {
      if (el.isTypeOnly) continue;
      const exportedName = el.name.text;
      if (exportedName !== importedExportName) continue;
      const target = resolveImportSpecifier(absBarrel, stmt.moduleSpecifier.text);
      if (target) return { path: target };
    }
  }
  return { path: resolvedPath };
}

const SKIP_DIRS = new Set(['node_modules', '.next', 'storybook-static']);

function collectStoryFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) results.push(...collectStoryFiles(full));
    else if (entry.endsWith('.stories.tsx') || entry.endsWith('.stories.ts')) results.push(full);
  }
  return results;
}

function findObjectTitle(objLiteral) {
  for (const prop of objLiteral.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ((ts.isIdentifier(prop.name) && prop.name.text === 'title') ||
        (ts.isStringLiteral(prop.name) && prop.name.text === 'title')) &&
      ts.isStringLiteralLike(prop.initializer)
    ) {
      return prop.initializer.text;
    }
  }
  return null;
}

function extractTitle(sourceFile) {
  let defaultExportExpr = null;
  for (const stmt of sourceFile.statements) {
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      defaultExportExpr = stmt.expression;
    }
  }
  if (defaultExportExpr) {
    if (ts.isObjectLiteralExpression(defaultExportExpr)) {
      const title = findObjectTitle(defaultExportExpr);
      if (title) return title;
    }
    if (ts.isIdentifier(defaultExportExpr)) {
      const name = defaultExportExpr.text;
      for (const stmt of sourceFile.statements) {
        if (ts.isVariableStatement(stmt)) {
          for (const decl of stmt.declarationList.declarations) {
            if (
              ts.isIdentifier(decl.name) &&
              decl.name.text === name &&
              decl.initializer &&
              ts.isObjectLiteralExpression(decl.initializer)
            ) {
              const title = findObjectTitle(decl.initializer);
              if (title) return title;
            }
          }
        }
      }
    }
  }
  let found = null;
  function visit(node) {
    if (found) return;
    if (ts.isObjectLiteralExpression(node)) {
      const title = findObjectTitle(node);
      if (title) { found = title; return; }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

/**
 * Builds resolvedPatternPath -> [storyFilePath, ...] for every canonical Mantine story that imports
 * a pattern directly or through a single-hop `index.ts(x)` barrel — the same resolution
 * `check-surface-census.mjs` Revision 1 uses (R14 there), kept as a Map of story files (not a Set
 * of booleans) so this script can name which story proves each pattern (AC3).
 */
function buildStoryImportIndex() {
  const storyFiles = collectStoryFiles(join(ROOT, 'src'));
  const importedBy = new Map(); // resolvedPath -> Set<storyRelPath>
  function addStory(path, storyRelPath) {
    if (!importedBy.has(path)) importedBy.set(path, new Set());
    importedBy.get(path).add(storyRelPath);
  }
  for (const file of storyFiles) {
    let sourceFile;
    try {
      sourceFile = parseSourceFile(file);
    } catch {
      continue;
    }
    const title = extractTitle(sourceFile);
    if (!isCanonicalMantineTitle(title)) continue;
    const storyRelPath = relative(ROOT, file).replace(/\\/g, '/');
    for (const b of extractImportBindings(sourceFile)) {
      const resolved = resolveImportSpecifier(file, b.spec);
      if (!resolved) continue;
      addStory(resolved, storyRelPath);
      const unwrap = unwrapBarrel(resolved, b.importedExportName);
      if (unwrap.path) addStory(unwrap.path, storyRelPath);
    }
  }
  return importedBy;
}

// ── Load manifest and allowlist ──────────────────────────────────────────────

function loadJsonArray(path) {
  if (!existsSync(path)) return { value: [], error: null };
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(value)) throw new Error('must be a JSON array');
    return { value, error: null };
  } catch (err) {
    return { value: [], error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const { value: manifest, error: manifestError } = loadJsonArray(MANIFEST_PATH);
  if (manifestError) {
    console.error(`FAIL  Cannot read/parse ${relative(ROOT, MANIFEST_PATH)}: ${manifestError}`);
    process.exit(1);
  }
  const manifestSet = new Set(manifest);

  const { value: allowlist, error: allowlistError } = loadJsonArray(ALLOWLIST_PATH);
  if (allowlistError) {
    console.error(`FAIL  Cannot read/parse ${relative(ROOT, ALLOWLIST_PATH)}: ${allowlistError}`);
    process.exit(1);
  }
  const allowlistByPath = new Map(allowlist.map((e) => [e && e.path, e]));

  if (!existsSync(PATTERNS_DIR)) {
    console.error(`FAIL  Patterns directory missing: ${relative(ROOT, PATTERNS_DIR)}`);
    process.exit(1);
  }
  const patternFiles = readdirSync(PATTERNS_DIR)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => relative(ROOT, join(PATTERNS_DIR, f)).replace(/\\/g, '/'))
    .sort();

  const { renderedBy } = buildRenderGraph();
  const storyIndex = buildStoryImportIndex();

  const rows = patternFiles.map((path) => {
    const inManifest = manifestSet.has(path);
    const allowEntry = allowlistByPath.get(path);
    const inAllowlist = !!allowEntry;
    const allowlistValid = inAllowlist && !!allowEntry.reason && !!allowEntry.owner;

    let state;
    if (inManifest && inAllowlist) state = 'both-invalid';
    else if (inManifest) state = 'enrolled';
    else if (inAllowlist) state = 'tier3-allowlisted';
    else state = 'ungoverned';

    const wholeTreeConsumers = renderedBy.get(path) || [];
    const distinctConsumers = [...new Set(wholeTreeConsumers)].sort();
    const enrolledConsumers = distinctConsumers.filter((c) => manifestSet.has(c));

    const storyFiles = [...(storyIndex.get(path) || [])].sort();

    return {
      path,
      state,
      allowlistOwner: allowEntry ? allowEntry.owner ?? null : null,
      allowlistReason: allowEntry ? allowEntry.reason ?? null : null,
      allowlistValid: inAllowlist ? allowlistValid : null,
      rawEdgeCount: wholeTreeConsumers.length,
      distinctConsumerCount: distinctConsumers.length,
      distinctConsumers,
      enrolledOnlyConsumerCount: enrolledConsumers.length,
      enrolledOnlyConsumers: enrolledConsumers,
      ownStory: storyFiles.length > 0,
      storyFiles,
    };
  });

  const totals = {
    enrolled: rows.filter((r) => r.state === 'enrolled').length,
    tier3: rows.filter((r) => r.state === 'tier3-allowlisted').length,
    ungoverned: rows.filter((r) => r.state === 'ungoverned').length,
    bothInvalid: rows.filter((r) => r.state === 'both-invalid').length,
  };

  // ── Premise verdicts for owner-816 allowlisted patterns ──
  const premiseFailures = [];
  for (const r of rows) {
    if (r.state !== 'tier3-allowlisted') continue;
    if (!r.allowlistValid) {
      premiseFailures.push({ path: r.path, reason: 'missing-reason-or-owner' });
      continue;
    }
    if (r.distinctConsumerCount < 2) {
      premiseFailures.push({ path: r.path, reason: 'not-shared', detail: `${r.distinctConsumerCount} distinct consumer(s)` });
    }
    if (!r.ownStory) {
      premiseFailures.push({ path: r.path, reason: 'no-own-story' });
    }
  }
  for (const r of rows) {
    if (r.state === 'both-invalid') {
      premiseFailures.push({ path: r.path, reason: 'in-both-manifest-and-allowlist' });
    }
  }
  // Stale/malformed allowlist entries whose path does not even exist as a pattern file are not
  // caught by the loop above (it only iterates existing pattern files) — check the allowlist itself
  // for any entry pointing at a design-system pattern path that no longer exists on disk.
  for (const entry of allowlist) {
    if (!entry || !entry.path) continue;
    if (!entry.path.startsWith('src/design-system/mantine/patterns/')) continue;
    if (!patternFiles.includes(entry.path)) {
      premiseFailures.push({ path: entry.path, reason: 'path-does-not-exist' });
    }
  }

  const exitCode = premiseFailures.length > 0 ? 1 : 0;

  if (JSON_MODE) {
    console.log(JSON.stringify({ rows, totals, premiseFailures, exitCode }));
    process.exit(exitCode);
  }

  console.log('audit:design-system-patterns — design-system pattern census (Task 816)');
  console.log(`    Patterns directory: ${relative(ROOT, PATTERNS_DIR)}`);
  console.log(`    Pattern files (derived from the directory at execution): ${patternFiles.length}`);
  console.log(`    Enrolled: ${totals.enrolled}  Tier-3 allowlisted: ${totals.tier3}  Ungoverned (neither): ${totals.ungoverned}` +
    (totals.bothInvalid ? `  In BOTH (invalid): ${totals.bothInvalid}` : ''));
  console.log('    Consumer counts are whole-src (every file under src/ that renders it), not only enrolled roots;');
  console.log('    "enrolled-only" reconstructs check:rendered-scope:report\'s narrower, enrolled-root-scoped view.');
  console.log('    Cannot see: a consumer reached only through dynamic import()/React.lazy(), or one under a');
  console.log('    directory the render graph never walks into (node_modules/.next/storybook-static/__tests__/stories).');
  console.log('');

  console.log(`CENSUS (${rows.length}):`);
  for (const r of rows) {
    console.log(
      `    ${r.path}  state:${r.state}  edges:${r.rawEdgeCount}  consumers:${r.distinctConsumerCount}` +
      `  (enrolled-only:${r.enrolledOnlyConsumerCount})  story:${r.ownStory ? 'yes' : 'no'}` +
      (r.ownStory ? `  story-file:${r.storyFiles[0]}${r.storyFiles.length > 1 ? ` (+${r.storyFiles.length - 1} more)` : ''}` : '')
    );
  }
  console.log('');

  if (premiseFailures.length > 0) {
    for (const f of premiseFailures) {
      console.error(`FAIL  ${f.path}  [${f.reason}]${f.detail ? `  ${f.detail}` : ''}`);
    }
    console.error('');
    console.error(`AUDIT FAILED — ${premiseFailures.length} allowlist entr(ies) no longer satisfy decision 1's premise.`);
    process.exit(1);
  }

  console.log('PASS  audit:design-system-patterns — every allowlisted pattern is shared, has its own canonical Story, and is not double-governed.');
  process.exit(0);
}

main();
