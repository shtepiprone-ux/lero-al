#!/usr/bin/env node
/**
 * check-surface-census.mjs — per-surface GR-1 census command (Task 817).
 *
 * `docs/golden-rules.md` GR-1 names this exact command and receipt. `check:rendered-scope`
 * (Task 812) walks the ENROLLED subgraph only — every root is a `scripts/mantine-migration-scope.json`
 * entry, so an UNENROLLED surface is never a root and nothing it renders is ever examined. That is
 * the exact pre-enrolment state Task 809 was in when `/favorites` shipped with `CollectionsSection`,
 * `SaveToCollectionButton` and `FavoritesTypeFilter` rendered, unmigrated, unenrolled and unstoried,
 * while `check:story-coverage` printed 34/34 green.
 *
 * This command censuses ONE named surface, enrolled or not, starting at that surface (node #1) and
 * walking TRANSITIVELY through tier-1 nodes only (agent-contract 16d: the census is transitive, the
 * scope is not — a tier-2 or tier-3 node is never recursed into).
 *
 * Explicitly NOT modified: check-rendered-scope.mjs's and check-story-coverage.mjs's behavior
 * (Task 817 R9) — both scripts are out of scope for this task. This file DUPLICATES (does not
 * extract) their JSX-tag-root extraction, barrel unwrap, TIER2_PREFIX rule, and story-title/import
 * discovery — copying the semantics exactly, per the kickoff's requirement 1, without editing either
 * source file. The two ALREADY-EXTRACTED shared helpers (`scripts/lib/import-resolver.mjs`,
 * `scripts/lib/mantine-story-scope.mjs`) are imported, never re-implemented.
 *
 * Usage:
 *   node scripts/check-surface-census.mjs --surface <repo-relative-or-absolute path>
 *   npm run check:surface-census -- --surface <path>
 *   node scripts/check-surface-census.mjs --surface <path> --report   # full table, always exit 0
 *   node scripts/check-surface-census.mjs --surface <path> --json     # ONE JSON object on stdout (Task 819 R2)
 *
 * Exit codes:
 *   0 — census complete, GR-1 receipt printed (or --report, always 0).
 *   1 — at least one blocking node/entry; `GR-1 CENSUS BLOCKED` printed naming every offender.
 *   2 — the invocation itself is unusable (missing/absent/non-.ts(x)/out-of-repo --surface path).
 *
 * `--json` (Task 819, additive only): when the gate would otherwise print human text, it instead
 * prints exactly one JSON object to stdout — `{ surface, scope, nodes, blocking }` — and nothing else,
 * with the SAME exit code (0/1) the non-`--json` run would produce for the same surface. It exists so
 * `check-surface-census-changed.mjs` (Task 819) consumes structure rather than regexing prose. The
 * `--surface`-argument validation errors (exit 2, before any node is walked) are unchanged by `--json`
 * — they still print to stderr as before, on every run. `--report` mode and the ordinary human output
 * are byte-unchanged for an unchanged tree; nothing else in this file changes.
 *
 * Docs: docs/golden-rules.md GR-1, docs/agent-contract.md 16d, docs/storybook-governance.md §15.6/§15.7.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative, basename, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { resolveImportSpecifier as resolveImportSpecifierShared } from './lib/import-resolver.mjs';
import { isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'rendered-scope-allowlist.json');
const TIER2_PREFIX = 'src/components/ui/';

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const REPORT_ONLY = args.includes('--report');
const JSON_MODE = args.includes('--json');

function readSurfaceArg() {
  const idx = args.indexOf('--surface');
  if (idx === -1) return { error: 'missing required flag --surface <path>' };
  const raw = args[idx + 1];
  if (!raw || raw.startsWith('--')) return { error: 'missing required flag --surface <path>' };
  return { raw };
}

function resolveSurface(raw) {
  const abs = isAbsolute(raw) ? resolve(raw) : resolve(ROOT, raw);
  const rel = relative(ROOT, abs).replace(/\\/g, '/');
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { error: `--surface path is outside the repo root: ${raw}` };
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return { error: `--surface path does not exist or is not a file: ${raw}` };
  }
  if (!/\.(tsx|ts)$/.test(abs)) {
    return { error: `--surface path is not a .ts or .tsx file: ${raw}` };
  }
  return { relPath: rel, absPath: abs };
}

function resolveImportSpecifier(fromFile, spec) {
  return resolveImportSpecifierShared(ROOT, fromFile, spec);
}

function parseSourceFile(absPath) {
  const text = readFileSync(absPath, 'utf8');
  return ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
}

/**
 * R16 (Revision 1): a census node (the surface root or any child) is "unparseable" when the file
 * cannot be read at all, OR when `ts.createSourceFile` records real parse diagnostics — `SourceFile
 * .parseDiagnostics` is populated by the TS parser for genuinely malformed syntax (unbalanced JSX,
 * unterminated blocks, etc.) even though `ts.createSourceFile` itself does not throw for a merely
 * malformed file. `parseSourceFile` above stays the permissive parser used for barrel/story
 * auxiliary lookups, which are not census nodes and are not in R16's scope; this stricter check is
 * used only for the surface root and its transitively-walked nodes.
 */
function parseCensusNode(absPath) {
  let text;
  try {
    text = readFileSync(absPath, 'utf8');
  } catch (err) {
    return { error: err.message };
  }
  let sourceFile;
  try {
    sourceFile = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
  } catch (err) {
    return { error: err.message };
  }
  const diagnostics = sourceFile.parseDiagnostics;
  if (Array.isArray(diagnostics) && diagnostics.length > 0) {
    const first = diagnostics[0];
    const msg = typeof first.messageText === 'string' ? first.messageText : JSON.stringify(first.messageText);
    return { error: `${diagnostics.length} parse diagnostic(s), e.g. "${msg}"` };
  }
  return { sourceFile };
}

// ── Duplicated verbatim-semantics from check-rendered-scope.mjs (that file is out of scope) ──

/** Every local (non-type-only) and type-only import binding in the file, with its module specifier. */
function extractImportBindings(sourceFile) {
  const bindings = [];
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (!clause) continue; // side-effect import: `import './x.css'`
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

/** Every identifier used as a JSX opening/self-closing tag name's root (handles `<Foo>` and `<NS.Foo>`). */
function extractJsxTagRootIdentifiers(sourceFile) {
  const rendered = new Set();
  function rootIdentifier(tagNameNode) {
    let node = tagNameNode;
    while (ts.isPropertyAccessExpression(node)) node = node.expression;
    if (ts.isIdentifier(node)) return node.text;
    return null;
  }
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = rootIdentifier(node.tagName);
      if (name) rendered.add(name);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return rendered;
}

/** Count of `JsxAttribute` nodes named `className`, whole-file AST walk (R5/§10.3). */
function countClassNameAttributes(sourceFile) {
  let count = 0;
  function visit(node) {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === 'className') count++;
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return count;
}

/**
 * Count of RENDERED, non-type-only import bindings whose resolved specifier begins with the tier-2
 * prefix (§10.3 ui-imports / GR-1's "whether it imports from `@/components/ui/*`" fact). Filtering
 * to rendered bindings — the same filter the tier-2/edge walk already applies — matters: an
 * unfiltered resolve would also match a node's own co-located `.module.css` or local hook file
 * (e.g. `AppImage.tsx`'s own `./AppImage.module.css` and `./useAdaptiveImageConfig`, both of which
 * mechanically resolve under `src/components/ui/` because that is where `AppImage.tsx` itself
 * lives), which is not "imports a legacy UI primitive" in GR-1's sense and would not survive an
 * independent check (AC18).
 */
function countUiImports(bindings, renderedTagRoots, absPath) {
  let count = 0;
  for (const b of bindings) {
    if (b.typeOnly || !renderedTagRoots.has(b.localName)) continue;
    const resolved = resolveImportSpecifier(absPath, b.spec);
    if (resolved && resolved.startsWith(TIER2_PREFIX)) count++;
  }
  return count;
}

const BARREL_BASENAMES = new Set(['index.ts', 'index.tsx']);

/** Single-hop barrel unwrap — identical semantics to check-rendered-scope.mjs. */
function unwrapBarrel(resolvedPath, importedExportName) {
  if (!BARREL_BASENAMES.has(basename(resolvedPath))) {
    return { path: resolvedPath, barrelHop: false, barrelUnresolved: false };
  }
  const absBarrel = join(ROOT, resolvedPath);
  let sourceFile;
  try {
    sourceFile = parseSourceFile(absBarrel);
  } catch {
    return { path: resolvedPath, barrelHop: false, barrelUnresolved: true };
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
      if (target) return { path: target, barrelHop: true, barrelUnresolved: false };
    }
  }
  return { path: resolvedPath, barrelHop: false, barrelUnresolved: true };
}

// ── Duplicated verbatim-semantics from check-story-coverage.mjs (that file is out of scope) ──

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
 * R14 (Revision 1): a canonical story's import is resolved the SAME way the render-side walk
 * resolves a rendered edge — per binding, with a single-hop barrel unwrap — not merely at the
 * declaration's raw module-specifier path. Without this, a story that imports a component through
 * `@/design-system/mantine/patterns`'s barrel (the design system's own convention) reads `story:no`
 * for that component even though the story genuinely proves it, while a story importing the same
 * kind of component by its direct path reads `story:yes` — an inconsistency with no basis in GR-3,
 * which asks only "does a canonical story import this component", not "by which path form".
 */
function buildCanonicalStoryImportIndex() {
  const importedByAny = new Set();
  let canonicalStoryCount = 0;
  const storyFiles = collectStoryFiles(join(ROOT, 'src'));
  for (const file of storyFiles) {
    let sourceFile;
    try {
      sourceFile = parseSourceFile(file);
    } catch {
      continue;
    }
    const title = extractTitle(sourceFile);
    if (!isCanonicalMantineTitle(title)) continue;
    canonicalStoryCount++;
    for (const b of extractImportBindings(sourceFile)) {
      const resolved = resolveImportSpecifier(file, b.spec);
      if (!resolved) continue;
      importedByAny.add(resolved); // direct path — unchanged behavior for a direct import
      const unwrap = unwrapBarrel(resolved, b.importedExportName);
      if (unwrap.path) importedByAny.add(unwrap.path); // barrel-unwrapped path — R14
    }
  }
  return { importedByAny, canonicalStoryCount, storyFileCount: storyFiles.length };
}

// ── Load manifest and allowlist ────────────────────────────────────────────────

function loadJsonArray(path, label) {
  if (!existsSync(path)) return { value: [], error: null };
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(value)) throw new Error(`${label} must be a JSON array`);
    return { value, error: null };
  } catch (err) {
    return { value: [], error: err.message };
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  const surfaceArg = readSurfaceArg();
  if (surfaceArg.error) {
    console.error(`FAIL  check:surface-census — ${surfaceArg.error}`);
    console.error('  Usage: node scripts/check-surface-census.mjs --surface <repo-relative-or-absolute path>');
    process.exit(2);
  }
  const surface = resolveSurface(surfaceArg.raw);
  if (surface.error) {
    console.error(`FAIL  check:surface-census — ${surface.error}`);
    process.exit(2);
  }

  // R16 (Revision 1): an unreadable or unparseable surface root exits 2, naming the path, BEFORE
  // any census/scope block is printed — never a silent one-node "clean" census.
  const rootParse = parseCensusNode(surface.absPath);
  if (rootParse.error) {
    console.error(`FAIL  check:surface-census — --surface path could not be parsed: ${surface.relPath} (${rootParse.error})`);
    process.exit(2);
  }

  const { value: manifest, error: manifestError } = loadJsonArray(MANIFEST_PATH, 'scripts/mantine-migration-scope.json');
  if (manifestError) {
    console.error(`FAIL  Cannot read/parse ${relative(ROOT, MANIFEST_PATH)}: ${manifestError}`);
    process.exit(2);
  }
  const manifestSet = new Set(manifest);

  const { value: allowlist, error: allowlistError } = loadJsonArray(ALLOWLIST_PATH, 'scripts/rendered-scope-allowlist.json');
  if (allowlistError) {
    console.error(`FAIL  Cannot read/parse ${relative(ROOT, ALLOWLIST_PATH)}: ${allowlistError}`);
    process.exit(2);
  }
  const allowlistByPath = new Map(allowlist.map((e) => [e && e.path, e]));

  const { importedByAny: storyImportedPaths, canonicalStoryCount, storyFileCount } = buildCanonicalStoryImportIndex();

  // ── Classify one path's tier, consulting the allowlist ──
  function classify(path) {
    const rawTier = path.startsWith(TIER2_PREFIX) ? 'tier2' : 'tier1';
    const entry = allowlistByPath.get(path);
    if (!entry) return { tier: rawTier };
    const missingReasonOrOwner = !entry.reason || !entry.owner;
    if (rawTier === 'tier2') {
      // R10 (reused): a tier-2 path is never a valid allowlist entry, regardless of reason/owner.
      return { tier: 'tier2', invalidAllowlistEntry: true };
    }
    if (missingReasonOrOwner) {
      return { tier: 'tier1', malformedAllowlistEntry: true };
    }
    return { tier: 'tier3', owner: entry.owner, reason: entry.reason };
  }

  // ── Transitive walk — tier-1 nodes only are recursed into (agent-contract 16d) ──
  const nodes = new Map(); // path -> node
  let edgesResolved = 0;
  let nonRenderedSkipped = 0;
  const barrelHops = [];
  const barrelUnresolvedEdges = [];

  let parseFailedCount = 0;

  const queue = [{ path: surface.relPath, parentPath: null, depth: 0 }];
  while (queue.length > 0) {
    const { path, parentPath, depth } = queue.shift();
    if (nodes.has(path)) continue; // visited-set: cycle-safe, each node appears once

    const absPath = join(ROOT, path);
    const classification = classify(path);
    // Task 831 R11: a .ts (never .tsx) file cannot contain JSX, so the depth-0 root of a census that
    // targets one is never a component — only ever a hook, util, route handler, or similar module.
    // Recorded with its own marker instead of the ordinary tier so it is never pushed to blockingNodes
    // as `tier1-unenrolled-or-unstoried`. tier2/tier3 classification (rare for a root, but possible)
    // is untouched — this only overrides what would otherwise be a plain tier1 verdict.
    const rootIsNonComponentTs = depth === 0 && path.endsWith('.ts') && classification.tier === 'tier1';

    // R16: the root was already parsed and validated before this loop (exit 2 on failure, never
    // reaching here) — reuse that result rather than re-parsing. A child is parsed fresh with the
    // same stricter (parse-diagnostics-aware) check; failure never recurses and is tracked/blocking.
    let sourceFile = null;
    let parseFailed = false;
    if (depth === 0) {
      sourceFile = rootParse.sourceFile;
    } else if (existsSync(absPath) && statSync(absPath).isFile()) {
      const parsed = parseCensusNode(absPath);
      if (parsed.error) parseFailed = true;
      else sourceFile = parsed.sourceFile;
    } else {
      parseFailed = true; // a resolved path that no longer exists — cannot vouch for it
    }
    if (parseFailed) parseFailedCount++;

    // R15: className/ui-imports are 'n/a' (never a defaulted 0) for a node whose file could not be
    // parsed; className is measured for every parseable node regardless of tier.
    const node = {
      path,
      depth,
      parentPath,
      tier: rootIsNonComponentTs ? 'root-non-component' : classification.tier,
      owner: classification.owner ?? null,
      reason: classification.reason ?? null,
      invalidAllowlistEntry: !!classification.invalidAllowlistEntry,
      malformedAllowlistEntry: !!classification.malformedAllowlistEntry,
      manifest: manifestSet.has(path),
      story: storyImportedPaths.has(path),
      className: sourceFile ? countClassNameAttributes(sourceFile) : 'n/a',
      uiImports: sourceFile ? 0 : 'n/a', // real value computed just below for every parseable node
      parseFailed,
    };
    nodes.set(path, node);

    if (!sourceFile) continue; // unreadable/unparseable — no children to walk, columns stay n/a

    // R15: ui-imports is measured here, above the tier-1 recursion gate, so a tier-2/tier-3 node's
    // own file is inspected too — the gate below stops recursion, not measurement. renderedTagRoots
    // is computed here (not only for tier-1 nodes) so the rendered-only filter applies uniformly.
    const bindings = extractImportBindings(sourceFile);
    const renderedTagRoots = extractJsxTagRootIdentifiers(sourceFile);
    node.uiImports = countUiImports(bindings, renderedTagRoots, absPath);

    if (classification.tier !== 'tier1') continue; // do not recurse into tier2/tier3 (16d)

    for (const b of bindings) {
      const resolved = resolveImportSpecifier(absPath, b.spec);
      if (!resolved) continue; // external package — not a local edge
      edgesResolved++;

      const rendered = !b.typeOnly && renderedTagRoots.has(b.localName);
      if (!rendered) {
        nonRenderedSkipped++;
        continue;
      }

      const unwrap = unwrapBarrel(resolved, b.importedExportName);
      const finalPath = unwrap.path;
      if (unwrap.barrelHop) {
        barrelHops.push({ from: path, spec: b.spec, barrelPath: resolved, unwrappedPath: finalPath });
      } else if (BARREL_BASENAMES.has(basename(resolved)) && unwrap.barrelUnresolved) {
        barrelUnresolvedEdges.push({ from: path, spec: b.spec, barrelPath: resolved });
      }

      if (!nodes.has(finalPath)) {
        queue.push({ path: finalPath, parentPath: path, depth: depth + 1 });
      }
    }
  }

  // ── Determinism: sort by depth, then path (R5's requirement 5) ──
  const orderedNodes = [...nodes.values()].sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path));

  const tier3Nodes = orderedNodes.filter((n) => n.tier === 'tier3');
  const tier3Owners = [...new Set(tier3Nodes.map((n) => n.owner))].sort();

  // ── Blocking determination (R7, extended by R16) — computed here (moved up from below the human
  // prints, Task 819) so --json can use it without duplicating the logic or printing human text. ──
  const blockingNodes = [];
  for (const n of orderedNodes) {
    if (n.parseFailed) {
      blockingNodes.push({
        node: n,
        reasonCode: 'unparseable-source',
        correction: 'This node\'s file could not be read or parsed, so its className/ui-imports (and, for a tier-1 node, its children) cannot be measured. A node the census cannot read is a node it cannot vouch for — fix or investigate the file before this surface can pass.',
      });
    }
    if (n.tier === 'tier2') {
      blockingNodes.push({
        node: n,
        reasonCode: n.invalidAllowlistEntry ? 'tier2-invalid-allowlist-entry' : 'tier2-legacy-primitive',
        correction: n.invalidAllowlistEntry
          ? 'A src/components/ui/* (tier-2) path is never a valid allowlist entry. Remove the entry; fix the import, not the allowlist.'
          : 'Stop importing this legacy @/components/ui/* primitive from the enrolled surface (agent-contract 16d tier 2). Migrating the primitive file itself is a separate, repo-wide task.',
      });
    } else if (n.tier === 'tier1') {
      if (n.malformedAllowlistEntry) {
        blockingNodes.push({
          node: n,
          reasonCode: 'tier3-malformed-allowlist-entry',
          correction: 'This allowlist entry is missing a "reason" or an "owner" task number. Every tier-3 entry requires both.',
        });
      }
      if (!(n.manifest && n.story)) {
        blockingNodes.push({
          node: n,
          reasonCode: 'tier1-unenrolled-or-unstoried',
          correction: !n.manifest
            ? 'Migrate this component, give it its own canonical Mantine Story, and add it to scripts/mantine-migration-scope.json — or, if it is a tier-3 shared component owned by another surface, add it to scripts/rendered-scope-allowlist.json with a reason and an owning task number.'
            : 'This component is enrolled but no canonical Mantine story imports it by its own path (a story that only imports its parent does not count — GR-3). Create or fix its own canonical Story.',
        });
      }
    }
  }

  // ── --json (Task 819 R2): ONE structured object, same exit code as the human run, nothing else on
  // stdout. Computed from the same orderedNodes/blockingNodes the human path uses below — never a
  // second derivation. ──
  if (JSON_MODE) {
    const jsonExitCode = blockingNodes.length > 0 ? 1 : 0;
    const result = {
      surface: surface.relPath,
      scope: {
        nodesVisited: orderedNodes.length,
        edgesResolved,
        nonRenderedSkipped,
        tier3Count: tier3Nodes.length,
        tier3Owners,
        barrelHopsCount: barrelHops.length,
        barrelUnresolvedCount: barrelUnresolvedEdges.length,
        parseFailedCount,
        canonicalStoryCount,
        storyFileCount,
        // Task 831 R11 — additive only.
        tsRootRule: 'a .ts root is not a component; a .ts module that renders through createElement or re-exports a component under a non-barrel name is not walked',
      },
      nodes: orderedNodes.map((n) => ({
        path: n.path,
        depth: n.depth,
        parentPath: n.parentPath,
        tier: n.tier,
        owner: n.owner,
        reason: n.reason,
        manifest: n.manifest,
        story: n.story,
        className: n.className,
        uiImports: n.uiImports,
        parseFailed: n.parseFailed,
      })),
      blocking: blockingNodes.map((b) => ({ path: b.node.path, reasonCode: b.reasonCode, correction: b.correction })),
    };
    console.log(JSON.stringify(result));
    process.exit(jsonExitCode);
  }

  // ── Scope block — printed on every run (R8) ──
  console.log('check:surface-census — per-surface GR-1 census (Task 817)');
  console.log(`    Surface: ${surface.relPath}`);
  console.log(`    Nodes visited: ${orderedNodes.length}`);
  console.log(`    Local import edges resolved (from tier-1 nodes): ${edgesResolved}`);
  console.log(`    Non-rendered local imports skipped (hooks/utils/consts/context/type-only): ${nonRenderedSkipped}`);
  console.log(`    Tier-3 nodes excluded from recursion, owner-filed (${tier3Nodes.length}): ${tier3Owners.join(', ') || 'none'}`);
  console.log(`    Barrel hops unwrapped (single-hop, index.ts/tsx re-export): ${barrelHops.length}`);
  console.log(`    Barrel edges NOT unwrapped (reported at the barrel file itself): ${barrelUnresolvedEdges.length}`);
  console.log('    className is counted as JsxAttribute nodes named "className" via the TypeScript AST (whole file).');
  console.log('    ui-imports is counted as RENDERED, non-type-only import bindings in that node\'s own file resolving');
  console.log('    under src/components/ui/* (a co-located .module.css or hook sibling is never a rendered JSX tag).');
  console.log('    story:yes means a canonical Mantine story imports the node directly OR through a single-hop index.ts(x)');
  console.log('    barrel re-export (same resolution the render-side walk uses) — never merely its parent (GR-3).');
  console.log(`    Nodes whose source could not be parsed (unreadable, or real TypeScript parse errors): ${parseFailedCount}`);
  console.log('    Cannot see: dynamic import(), React.lazy(), and components rendered only from a .stories.tsx file.');
  console.log('    Task 831 R11: a .ts root is not a component; a .ts module that renders through createElement or');
  console.log('    re-exports a component under a non-barrel name is not walked.');
  console.log(`    Canonical Mantine story files consulted: ${canonicalStoryCount} (of ${storyFileCount} total *.stories.ts(x)).`);
  console.log('');

  // ── Node table — one line per node ──
  console.log(`NODES (${orderedNodes.length}):`);
  for (const n of orderedNodes) {
    const tierLabel = n.tier === 'tier3' ? `tier3(owner=${n.owner})` : n.tier;
    const parentLabel = n.parentPath ?? '(root surface)';
    console.log(
      `    ${n.path}  tier:${tierLabel}  manifest:${n.manifest ? 'yes' : 'no'}  story:${n.story ? 'yes' : 'no'}  ` +
      `className:${n.className}  ui-imports:${n.uiImports}  parent:${parentLabel}`
    );
  }
  console.log('');

  if (barrelHops.length) {
    console.log(`Barrel hops unwrapped (${barrelHops.length}):`);
    for (const h of barrelHops) console.log(`    ${h.from} imports '${h.spec}' -> ${h.barrelPath} -> ${h.unwrappedPath}`);
    console.log('');
  }
  if (barrelUnresolvedEdges.length) {
    console.log(`Barrel edges reported at the barrel file (${barrelUnresolvedEdges.length}):`);
    for (const h of barrelUnresolvedEdges) console.log(`    ${h.from} imports '${h.spec}' -> ${h.barrelPath} (no matching named re-export found)`);
    console.log('');
  }

  if (REPORT_ONLY) {
    process.exit(0);
  }

  // blockingNodes was computed above (before the --json branch); reused here unchanged.
  if (blockingNodes.length > 0) {
    for (const b of blockingNodes) {
      console.error(`FAIL  ${b.node.path}  [${b.reasonCode}]`);
      console.error(`  Fix: ${b.correction}`);
    }
    console.error('');
    const blockedPaths = blockingNodes.map((b) => b.node.path);
    console.error(`GR-1 CENSUS BLOCKED — ${blockedPaths.join(', ')}`);
    console.error('');
    console.error('Docs: docs/golden-rules.md GR-1, docs/agent-contract.md 16d.');
    process.exit(1);
  }

  const tier1Count = orderedNodes.filter((n) => n.tier === 'tier1').length;
  const tier2Count = orderedNodes.filter((n) => n.tier === 'tier2').length;
  const finalTier3Owners = [...new Set(tier3Nodes.map((n) => n.owner))].sort().join(', ');
  console.log(
    `GR-1 CENSUS COMPLETE — ${orderedNodes.length} nodes; tier1 ${tier1Count} migrated+enrolled+story; ` +
    `tier2 ${tier2Count} imports removed; tier3 ${tier3Nodes.length} listed and filed as ${finalTier3Owners || 'none'}.`
  );
  process.exit(0);
}

main();
