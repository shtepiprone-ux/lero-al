#!/usr/bin/env node
/**
 * check-story-coverage.mjs — Mantine migration-scope coverage gate (Task Q0R rewrite).
 *
 * Runs PRE-BUILD in the `governance` job of `.github/workflows/governance-pr.yml`, before
 * `build-storybook` — there is NO `storybook-static/index.json` at this point. Everything below
 * is derived from SOURCE, never a built index:
 *
 *   1. Parse every `src/stories/**\/*.stories.tsx` file's AST, read its `meta.title` string
 *      literal (handles both `export default {...}` and `const meta = {...}; export default meta`).
 *   2. A story is canonical Mantine iff `isCanonicalMantineTitle(title)`
 *      (scripts/lib/mantine-story-scope.mjs) — the SAME criterion check-stories-rendered.mjs and
 *      check-locale-leak.mjs enforce. This gate never re-derives or widens that definition.
 *   3. For each canonical story, parse its `import` declarations and resolve `@/*` + relative
 *      specifiers to repo-relative component paths.
 *   4. `scripts/mantine-migration-scope.json` is the hand-maintained enrolment list of real
 *      production components currently in Mantine migration scope (owner decision, Task Q0R,
 *      explicit manifest design "A" — never derived from the story set itself, which would
 *      reintroduce the tautology the manifest exists to avoid).
 *
 * Coverage logic:
 *   - component IN manifest AND statically imported by ≥1 canonical Mantine story → covered.
 *   - component IN manifest AND NO canonical Mantine story imports it → FAIL (enrolled, unproven).
 *   - component NOT in manifest → out of scope, never checked, never blocking. This is what
 *     removes the entire legacy (non-Mantine) surface from this gate — legacy components are
 *     deprecated code awaiting migration or replacement, not exempted by hand.
 *
 * Governance obligation: every future component migration to Mantine adds that component to
 * `scripts/mantine-migration-scope.json` in the SAME PR as the migration.
 *
 * `scripts/story-coverage-exempt.json` (the old colocated-*.stories.tsx-or-exempt mechanism) is
 * NOT consulted by this gate — the manifest supersedes it (owner ruling, Task 623R reaffirmed at
 * Task Q0R). The file itself is left untouched; it is simply orphaned for this gate's purposes.
 *
 * Usage:
 *   node scripts/check-story-coverage.mjs
 *   npm run check:story-coverage
 *   npm run check:story-coverage:report
 *
 * Docs: docs/storybook-governance.md §15.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { MANTINE_STORY_TITLE_PREFIXES, isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const REPORT_ONLY = args.includes('--report');

if (args.includes('--update-exempt')) {
  console.log('ℹ️  --update-exempt is retired (Task Q0R). This gate no longer checks colocated');
  console.log('    *.stories.tsx presence or a per-component exemption allowlist. Coverage is now');
  console.log(`    scripts/mantine-migration-scope.json — add newly migrated components there`);
  console.log('    in the same PR as their migration. See docs/storybook-governance.md §15.');
  process.exit(0);
}

// ── Story-file discovery (src/stories/** only — colocated *.stories.tsx are legacy-surface) ──
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

const STORY_FILES = collectStoryFiles(join(ROOT, 'src'));

// ── AST parsing (real parser, not regex — this gate has no built index to fall back on) ──

function parseSourceFile(filePath) {
  const text = readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
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

/**
 * Extracts a story file's `meta.title` string literal via AST.
 * Handles both `export default { title: '...' }` and the codebase's common
 * `const meta: Meta = { title: '...' }; export default meta` pattern. Falls back to scanning the
 * whole file for the first object literal carrying a string `title` property (still AST-based,
 * never a text regex) if the export-default identifier cannot be resolved.
 */
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

/** Every `import ... from '<spec>'` module specifier in the file (AST, not regex). */
function extractImportSpecifiers(sourceFile) {
  const specs = [];
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specs.push(stmt.moduleSpecifier.text);
    }
  }
  return specs;
}

/** Resolves an `@/*` or relative import specifier to a repo-relative file path, or null (external). */
function resolveImportSpecifier(storyFilePath, spec) {
  let candidate;
  if (spec.startsWith('@/')) {
    candidate = join(ROOT, 'src', spec.slice(2));
  } else if (spec.startsWith('.')) {
    candidate = resolve(dirname(storyFilePath), spec);
  } else {
    return null; // external package — not a local component
  }
  for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
    const p = candidate + ext;
    try {
      if (existsSync(p) && statSync(p).isFile()) {
        return relative(ROOT, p).replace(/\\/g, '/');
      }
    } catch { /* candidate not a file — keep trying extensions */ }
  }
  return null;
}

// ── Parse every story file; classify canonical Mantine; collect import edges ──

let canonicalStoryCount = 0;
const importedByAny = new Set(); // union of every path imported by ANY canonical Mantine story
const importsByComponent = new Map(); // resolved component path -> [canonical story files importing it]

for (const file of STORY_FILES) {
  let sourceFile;
  try {
    sourceFile = parseSourceFile(file);
  } catch {
    continue; // unparseable story file — not this gate's concern (check:stories/tsc catch that)
  }
  const title = extractTitle(sourceFile);
  if (!isCanonicalMantineTitle(title)) continue;
  canonicalStoryCount++;

  const relStory = relative(ROOT, file).replace(/\\/g, '/');
  for (const spec of extractImportSpecifiers(sourceFile)) {
    const resolved = resolveImportSpecifier(file, spec);
    if (!resolved) continue;
    importedByAny.add(resolved);
    if (!importsByComponent.has(resolved)) importsByComponent.set(resolved, []);
    importsByComponent.get(resolved).push(relStory);
  }
}

// ── Load the manifest (source of truth for migration scope) ──────────────────

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`❌  Cannot read/parse ${relative(ROOT, MANIFEST_PATH)}: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(manifest)) {
  console.error(`❌  ${relative(ROOT, MANIFEST_PATH)} must be a JSON array of component source paths.`);
  process.exit(1);
}

const covered = manifest.filter((p) => importedByAny.has(p));
const missing = manifest.filter((p) => !importedByAny.has(p));

// ── Report ─────────────────────────────────────────────────────────────────────

console.log('📖  check:story-coverage — pre-build, source-parsed (Task Q0R manifest gate)');
console.log(`    Canonical Mantine story files: ${canonicalStoryCount} (of ${STORY_FILES.length} total *.stories.tsx; prefixes: ${MANTINE_STORY_TITLE_PREFIXES.join(', ')})`);
console.log(`    Manifest entries (migration scope): ${manifest.length}`);
console.log(`    ✅ ${covered.length} covered (statically imported by ≥1 canonical Mantine story)`);
console.log(`    ❌ ${missing.length} enrolled but unproven (no canonical Mantine story imports them)`);
console.log('');

if (REPORT_ONLY) {
  for (const p of manifest) {
    const isCovered = importedByAny.has(p);
    const via = isCovered ? ` — via ${importsByComponent.get(p).join(', ')}` : '';
    console.log(`  ${isCovered ? '✅ covered' : '❌ missing'}  ${p}${via}`);
  }
  process.exit(0);
}

if (missing.length === 0) {
  console.log('✅  check:story-coverage PASSED — every manifest-enrolled component has a canonical Mantine story import.');
  process.exit(0);
}

console.error(`❌  check:story-coverage FAILED — ${missing.length} manifest-enrolled component(s) have no canonical Mantine story importing them:\n`);
for (const p of missing) {
  console.error(`    ${p}`);
}
console.error('');
console.error('  Fix: add (or restore) a canonical Mantine story — title starting with one of');
console.error(`  [${MANTINE_STORY_TITLE_PREFIXES.join(', ')}] — that statically imports this exact component path.`);
console.error('  A component NOT in scripts/mantine-migration-scope.json is out of scope and never blocks this gate.');
console.error('  Docs: docs/storybook-governance.md §15.');
process.exit(1);
