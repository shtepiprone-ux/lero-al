#!/usr/bin/env node
/**
 * check-rendered-scope.mjs — rendered-but-unenrolled component detector (Task 812).
 *
 * `check:story-coverage` only inspects components already IN `scripts/mantine-migration-scope.json`.
 * A component that an enrolled component renders, but that is not itself enrolled, is invisible to
 * that gate and to every other CI check — this is the exact hole Task 809 fell through:
 * `/favorites` shipped with `CollectionsSection`, `SaveToCollectionButton` and `FavoritesTypeFilter`
 * rendered, unmigrated, unenrolled and unstoried, while `check:story-coverage` printed 34/34 green.
 *
 * This gate walks the enrolled subgraph (every manifest path, then any resolved local import that is
 * itself enrolled) and reports every resolved local import at the frontier — imported by an enrolled
 * file, not itself enrolled — that is ACTUALLY RENDERED (its local binding appears as a JSX tag name
 * in the importing file). A type-only import, a hook, a util, a constant, or a context object is not
 * a rendered component and is never reported (agent-contract 16d tier definitions):
 *
 *   tier1-unenrolled       — a local feature component, neither in the manifest nor allowlisted.
 *   tier2-legacy-primitive — resolves under src/components/ui/*; the fix is "stop importing it", not
 *                            "enrol the file" (16d tier 2).
 *   tier3 (allowlisted)    — a shared component owned by another surface (16d tier 3). Excluded ONLY
 *                            via scripts/rendered-scope-allowlist.json, keyed by component PATH (not
 *                            by edge) — one entry excuses every importing/rendering call site of that
 *                            component, and stays non-stale as long as at least one such edge still
 *                            exists. Each entry requires a non-empty reason and an owning task number.
 *                            A stale entry (no edge to its path survives) or an entry missing
 *                            reason/owner is itself a gate failure — the house pattern
 *                            check-design-tokens.mjs already uses for its design-tokens-allow markers.
 *
 * Explicitly NOT modified: check-story-coverage.mjs's behavior (Task 812 R9) — the two scripts share
 * scripts/lib/import-resolver.mjs, never duplicate it.
 *
 * Explicitly out of reach: dynamic `import()` and `React.lazy` — stated in the scope line, not
 * silently treated as covered.
 *
 * Usage:
 *   node scripts/check-rendered-scope.mjs            # gate check (CI default)
 *   npm run check:rendered-scope
 *   npm run check:rendered-scope:report               # full frontier listing, always exit 0
 *
 * Docs: docs/storybook-governance.md §15.5, docs/golden-rules.md GR-1/GR-3.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { resolveImportSpecifier as resolveImportSpecifierShared } from './lib/import-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'rendered-scope-allowlist.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const REPORT_ONLY = args.includes('--report');

function resolveImportSpecifier(fromFile, spec) {
  return resolveImportSpecifierShared(ROOT, fromFile, spec);
}

function parseSourceFile(absPath) {
  const text = readFileSync(absPath, 'utf8');
  return ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
}

/**
 * Every local (non-type-only) and type-only import binding in the file, with its module specifier.
 * @returns {Array<{ localName: string, importedExportName: string, spec: string, typeOnly: boolean }>}
 */
function extractImportBindings(sourceFile) {
  const bindings = [];
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (!clause) continue; // side-effect import: `import './x.css'`
    const declTypeOnly = !!clause.isTypeOnly;

    if (clause.name) {
      // default import
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

const BARREL_BASENAMES = new Set(['index.ts', 'index.tsx']);

/**
 * Single-hop barrel unwrap: if `resolvedPath` is an index.ts(x) barrel, look for a
 * `export { X [as Y] } from '<spec>'` whose re-exported name matches `importedExportName`, and
 * resolve `<spec>` relative to the barrel. Returns the unwrapped path, or `resolvedPath` unchanged
 * (with `barrelUnresolved: true`) when the barrel doesn't re-export that name from a local spec.
 */
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
      const exportedName = el.name.text; // name as re-exported (Y in `export { X as Y }`)
      if (exportedName !== importedExportName) continue;
      const target = resolveImportSpecifier(absBarrel, stmt.moduleSpecifier.text);
      if (target) return { path: target, barrelHop: true, barrelUnresolved: false };
    }
  }
  return { path: resolvedPath, barrelHop: false, barrelUnresolved: true };
}

// ── Load manifest ──────────────────────────────────────────────────────────────

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`FAIL  Cannot read/parse ${relative(ROOT, MANIFEST_PATH)}: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(manifest)) {
  console.error(`FAIL  ${relative(ROOT, MANIFEST_PATH)} must be a JSON array of component source paths.`);
  process.exit(1);
}
const manifestSet = new Set(manifest);

// ── Load allowlist ──────────────────────────────────────────────────────────────

let allowlist = [];
let allowlistParseError = null;
if (existsSync(ALLOWLIST_PATH)) {
  try {
    allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    if (!Array.isArray(allowlist)) throw new Error('must be a JSON array');
  } catch (err) {
    allowlistParseError = err.message;
    allowlist = [];
  }
}
const allowlistByPath = new Map(allowlist.map((e) => [e && e.path, e]));
const allowlistMatched = new Set(); // paths actually matched against a real frontier edge this run

// ── Walk the enrolled subgraph ───────────────────────────────────────────────────

let rootsWalked = 0;
let edgesResolved = 0; // every resolved local import binding (value or type-only)
let nonRenderedSkipped = 0; // resolved local imports whose binding is not a rendered JSX tag (incl. type-only)
let allowlistedEdgeCount = 0;

const tier1Findings = []; // { from, to, tier: 'tier1-unenrolled' }
const tier2Findings = []; // { from, to, tier: 'tier2-legacy-primitive' }
const allowlistedFindings = []; // { from, to, ownerEntry }
const barrelHops = []; // { from, spec, barrelPath, unwrappedPath }
const barrelUnresolvedEdges = []; // { from, spec, barrelPath }

const TIER2_PREFIX = 'src/components/ui/';

for (const manifestPath of manifest) {
  const absPath = join(ROOT, manifestPath);
  if (!existsSync(absPath)) continue; // stale manifest entry — not this gate's concern
  rootsWalked++;

  let sourceFile;
  try {
    sourceFile = parseSourceFile(absPath);
  } catch {
    continue; // unparseable — tsc/check:stories catch this
  }

  const renderedTagRoots = extractJsxTagRootIdentifiers(sourceFile);
  const bindings = extractImportBindings(sourceFile);

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
      barrelHops.push({ from: manifestPath, spec: b.spec, barrelPath: resolved, unwrappedPath: finalPath });
    } else if (BARREL_BASENAMES.has(basename(resolved)) && unwrap.barrelUnresolved) {
      barrelUnresolvedEdges.push({ from: manifestPath, spec: b.spec, barrelPath: resolved });
    }

    if (manifestSet.has(finalPath)) continue; // enrolled-to-enrolled edge — not a frontier candidate

    const tier = finalPath.startsWith(TIER2_PREFIX) ? 'tier2-legacy-primitive' : 'tier1-unenrolled';
    const allowEntry = allowlistByPath.get(finalPath);
    // R10: the allowlist is a tier-3 mechanism only. A tier-2 (src/components/ui/*) path is never
    // honoured through it, even with a valid reason/owner — the fix for tier 2 is "stop importing
    // it", not "excuse it". allowlistMatched still records the match so a genuinely-tier-3 entry
    // pointed at a tier-2 path is reported by the invalid-entry check below, not as stale.
    if (allowEntry && allowEntry.reason && allowEntry.owner && tier !== 'tier2-legacy-primitive') {
      allowlistMatched.add(finalPath);
      allowlistedEdgeCount++;
      allowlistedFindings.push({ from: manifestPath, to: finalPath, reason: allowEntry.reason, owner: allowEntry.owner });
      continue;
    }
    if (allowEntry) allowlistMatched.add(finalPath); // seen (even if tier-2-invalid or malformed) — not stale

    const finding = { from: manifestPath, to: finalPath, tier };
    if (tier === 'tier2-legacy-primitive') tier2Findings.push(finding);
    else tier1Findings.push(finding);
  }
}

// ── Validate the allowlist itself ─────────────────────────────────────────────

const allowlistMissingReasonOrOwner = allowlist.filter((e) => !e || !e.path || !e.reason || !e.owner);
// R10: a tier-2 (src/components/ui/*) path is never a valid allowlist entry — the allowlist is
// tier-3 only. Reported as its own error category, distinct from missing-reason and stale, so the
// fix message is right ("remove this entry; fix the import" — not "add a reason").
const allowlistTier2Invalid = allowlist.filter((e) => e && e.path && e.path.startsWith(TIER2_PREFIX));
const allowlistStale = allowlist.filter(
  (e) =>
    e &&
    e.path &&
    e.reason &&
    e.owner &&
    !e.path.startsWith(TIER2_PREFIX) &&
    !allowlistMatched.has(e.path)
);

// ── Report ─────────────────────────────────────────────────────────────────────

console.log('check:rendered-scope — enrolled-subgraph rendered-component detector (Task 812)');
console.log(`    Enrolled roots walked: ${rootsWalked} (of ${manifest.length} manifest entries)`);
console.log(`    Local import edges resolved: ${edgesResolved}`);
console.log(`    Non-rendered local imports skipped (hooks/utils/consts/context/type-only): ${nonRenderedSkipped}`);
console.log(`    Allowlisted edges (tier3, owner-filed): ${allowlistedEdgeCount}`);
console.log(`    Barrel hops unwrapped (single-hop, index.ts/tsx re-export): ${barrelHops.length}`);
console.log(`    Barrel edges NOT unwrapped (reported at the barrel file itself): ${barrelUnresolvedEdges.length}`);
console.log('    Cannot see: dynamic import() and React.lazy() — not statically resolved by this gate.');
console.log('');

if (REPORT_ONLY) {
  console.log(`  tier1-unenrolled (${tier1Findings.length}):`);
  for (const f of tier1Findings) console.log(`    ${f.from} -> ${f.to}`);
  console.log(`  tier2-legacy-primitive (${tier2Findings.length}):`);
  for (const f of tier2Findings) console.log(`    ${f.from} -> ${f.to}`);
  console.log(`  allowlisted (${allowlistedFindings.length}):`);
  for (const f of allowlistedFindings) console.log(`    ${f.from} -> ${f.to}  [owner ${f.owner}: ${f.reason}]`);
  if (barrelHops.length) {
    console.log(`  barrel hops unwrapped (${barrelHops.length}):`);
    for (const h of barrelHops) console.log(`    ${h.from} imports '${h.spec}' -> ${h.barrelPath} -> ${h.unwrappedPath}`);
  }
  if (barrelUnresolvedEdges.length) {
    console.log(`  barrel edges reported at the barrel file (${barrelUnresolvedEdges.length}):`);
    for (const h of barrelUnresolvedEdges) console.log(`    ${h.from} imports '${h.spec}' -> ${h.barrelPath} (no matching named re-export found)`);
  }
  if (allowlistMissingReasonOrOwner.length) {
    console.log(`  allowlist entries missing reason/owner (${allowlistMissingReasonOrOwner.length}):`);
    for (const e of allowlistMissingReasonOrOwner) console.log(`    ${JSON.stringify(e)}`);
  }
  if (allowlistStale.length) {
    console.log(`  stale allowlist entries (${allowlistStale.length}):`);
    for (const e of allowlistStale) console.log(`    ${e.path}`);
  }
  if (allowlistTier2Invalid.length) {
    console.log(`  invalid allowlist entries — tier-2 path, allowlist is tier-3 only (${allowlistTier2Invalid.length}):`);
    for (const e of allowlistTier2Invalid) console.log(`    ${e.path}`);
  }
  process.exit(0);
}

let failed = false;

if (allowlistParseError) {
  console.error(`FAIL  Cannot read/parse ${relative(ROOT, ALLOWLIST_PATH)}: ${allowlistParseError}`);
  failed = true;
}

if (allowlistMissingReasonOrOwner.length > 0) {
  console.error(`FAIL  ${allowlistMissingReasonOrOwner.length} rendered-scope-allowlist.json entry(ies) missing reason or owner:`);
  for (const e of allowlistMissingReasonOrOwner) console.error(`    ${JSON.stringify(e)}`);
  console.error('  Every allowlist entry requires a non-empty "reason" and an "owner" task number.');
  failed = true;
}

if (allowlistStale.length > 0) {
  console.error(`FAIL  ${allowlistStale.length} stale rendered-scope-allowlist.json entry(ies) — no matching rendered, unenrolled edge exists:`);
  for (const e of allowlistStale) console.error(`    ${e.path}`);
  console.error('  Remove the entry, or fix the path so it matches a real edge.');
  failed = true;
}

if (allowlistTier2Invalid.length > 0) {
  console.error(`FAIL  ${allowlistTier2Invalid.length} invalid rendered-scope-allowlist.json entry(ies) — a src/components/ui/* (tier-2) path is never a valid allowlist entry:`);
  for (const e of allowlistTier2Invalid) console.error(`    ${e.path}`);
  console.error('  The allowlist is tier-3 only. A tier-2 legacy primitive is fixed by removing the import from the');
  console.error('  enrolled surface, not by excusing it with a reason.');
  failed = true;
}

if (tier1Findings.length > 0) {
  console.error(`FAIL  ${tier1Findings.length} tier1-unenrolled component(s) rendered by an enrolled surface but not enrolled:`);
  for (const f of tier1Findings) console.error(`    ${f.from} -> ${f.to}  [tier1-unenrolled]`);
  console.error('  Fix: migrate, story and add the target to scripts/mantine-migration-scope.json — or,');
  console.error('  if it is a tier-3 shared component owned by another surface, add it to');
  console.error('  scripts/rendered-scope-allowlist.json with a reason and an owning task number.');
  failed = true;
}

if (tier2Findings.length > 0) {
  console.error(`FAIL  ${tier2Findings.length} tier2-legacy-primitive import(s) — an enrolled surface still imports a legacy @/components/ui/* primitive:`);
  for (const f of tier2Findings) console.error(`    ${f.from} -> ${f.to}  [tier2-legacy-primitive]`);
  console.error('  Fix: stop importing the legacy primitive from the enrolled surface (agent-contract 16d tier 2).');
  failed = true;
}

if (failed) {
  console.error('');
  console.error('Docs: docs/storybook-governance.md §15.5, docs/agent-contract.md 16d, docs/golden-rules.md GR-1/GR-3.');
  process.exit(1);
}

console.log('PASS  check:rendered-scope — every component an enrolled surface renders is enrolled, legacy-clean, or allowlisted.');
process.exit(0);
