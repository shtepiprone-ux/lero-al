#!/usr/bin/env node
/**
 * check-rendered-scope.mjs — rendered-but-unenrolled component detector (Task 812; Task 818 baseline).
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
 * Task 818 — the gate is now baselined and blocking. `scripts/rendered-scope-baseline.json` (a
 * versioned, edge-keyed "<from> -> <to>" object) records the frontier as it exists; an edge already in
 * the baseline is reported as baselined debt and does not fail, an edge absent from it fails naming the
 * edge, and a baseline entry with no matching measured edge is stale and fails. `--update-baseline`
 * regenerates an EXISTING baseline from a live run (Revision 1: it refuses to run at all if the file is
 * missing — regenerating from nothing would launder any new tier-2 edge as pre-existing debt, so there
 * is no bootstrap path left to abuse) and refuses to record a NEW tier2-legacy-primitive edge (agent
 * -contract 16d tier 2) — the baseline is a debt ledger, never a tier-2 exemption mechanism. The tier
 * classification and the allowlist (tier 3) are completely unchanged by this — the baseline is
 * consulted only after classification, for an edge that already survived the allowlist.
 *
 * Explicitly NOT modified: check-story-coverage.mjs's behavior (Task 812 R9) — the two scripts share
 * scripts/lib/import-resolver.mjs, never duplicate it.
 *
 * Explicitly out of reach: dynamic `import()` and `React.lazy` — stated in the scope line, not
 * silently treated as covered.
 *
 * Usage:
 *   node scripts/check-rendered-scope.mjs                  # gate check (CI default)
 *   npm run check:rendered-scope
 *   npm run check:rendered-scope:report                     # full frontier listing, always exit 0
 *   npm run check:rendered-scope:update-baseline             # regenerate the baseline from a live run
 *   npm run check:rendered-scope:verify                      # CI-safe gate self-test (--verify-gate)
 *
 * Docs: docs/storybook-governance.md §15.5, docs/golden-rules.md GR-1/GR-3.
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { resolveImportSpecifier as resolveImportSpecifierShared } from './lib/import-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'rendered-scope-allowlist.json');
const BASELINE_PATH = join(ROOT, 'scripts', 'rendered-scope-baseline.json');
const BASELINE_VERSION = 1;

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const REPORT_ONLY = args.includes('--report');
const UPDATE_BASELINE = args.includes('--update-baseline');
const VERIFY_GATE = args.includes('--verify-gate');

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

// ── Walk the enrolled subgraph ───────────────────────────────────────────────────

const TIER2_PREFIX = 'src/components/ui/';

/**
 * Walks every manifest root, resolving each locally-imported, actually-rendered binding to its
 * frontier edge. Parameterised (not module-scope state) so the real run and the self-test's arm 4
 * (`--verify-gate`) call the exact same code.
 */
function walkEnrolledSubgraph(manifest, manifestSet, allowlistByPath) {
  let rootsWalked = 0;
  let edgesResolved = 0; // every resolved local import binding (value or type-only)
  let nonRenderedSkipped = 0; // resolved local imports whose binding is not a rendered JSX tag (incl. type-only)
  let allowlistedEdgeCount = 0;

  const tier1Findings = []; // { from, to, tier: 'tier1-unenrolled' }
  const tier2Findings = []; // { from, to, tier: 'tier2-legacy-primitive' }
  const allowlistedFindings = []; // { from, to, ownerEntry }
  const barrelHops = []; // { from, spec, barrelPath, unwrappedPath }
  const barrelUnresolvedEdges = []; // { from, spec, barrelPath }
  const allowlistMatched = new Set(); // paths actually matched against a real frontier edge this run

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

  return {
    rootsWalked, edgesResolved, nonRenderedSkipped, allowlistedEdgeCount,
    tier1Findings, tier2Findings, allowlistedFindings, barrelHops, barrelUnresolvedEdges, allowlistMatched,
  };
}

// ── Baseline: dedupe, compare, update (Task 818) ────────────────────────────────

/** Collapses tier1+tier2 findings into one Map keyed "<from> -> <to>" — two bindings resolving to the
 *  same file are one edge (§10.2). Pure: plain arrays in, plain Map out. */
function dedupeEdges(tier1Findings, tier2Findings) {
  const map = new Map();
  for (const f of [...tier1Findings, ...tier2Findings]) {
    const key = `${f.from} -> ${f.to}`;
    if (!map.has(key)) map.set(key, { key, from: f.from, to: f.to, tier: f.tier });
  }
  return map;
}

/** Pure comparator: current measured edges (Map) vs. baseline edges (plain object). No I/O — shared by
 *  the real gate run and the self-test's synthetic arms. */
function compareToBaseline(currentEdges, baselineEdges) {
  const newEdges = [];
  const staleKeys = [];
  let baselinedCount = 0;
  for (const [key, edge] of currentEdges) {
    if (Object.prototype.hasOwnProperty.call(baselineEdges, key)) baselinedCount++;
    else newEdges.push(edge);
  }
  for (const key of Object.keys(baselineEdges)) {
    if (!currentEdges.has(key)) staleKeys.push(key);
  }
  return { newEdges, staleKeys, baselinedCount };
}

/**
 * Pure --update-baseline writer logic: current measured edges (Map) + the PRIOR baseline's edges
 * object — always a real object, never `null` (Task 818 Revision 1, R13). `--update-baseline` only
 * ever updates an EXISTING baseline; the one-time bootstrap write already happened and is not a
 * reachable code path any more (a missing file is refused by the caller before this function is ever
 * called — see the `UPDATE_BASELINE` branch below). Returns the edges object to write and the tier-2
 * edges refused (R4): a tier-2 edge not already present in the prior baseline is never written — this
 * refusal is therefore unconditional for every path `--update-baseline` can actually reach.
 */
function computeBaselineUpdate(currentEdges, priorBaselineEdges) {
  const edges = {};
  const refusedTier2 = [];
  for (const [key, edge] of currentEdges) {
    if (
      edge.tier === 'tier2-legacy-primitive' &&
      !Object.prototype.hasOwnProperty.call(priorBaselineEdges, key)
    ) {
      refusedTier2.push(edge);
      continue;
    }
    edges[key] = { tier: edge.tier };
  }
  return { edges, refusedTier2 };
}

/** Loads and validates scripts/rendered-scope-baseline.json. Returns { error, message } on any failure
 *  — missing file, unparseable JSON, or a missing/unrecognised version (R1) — never a silent empty
 *  baseline. Returns { version, edges } on success. */
function loadBaselineFile(path) {
  if (!existsSync(path)) {
    return {
      error: 'missing',
      message: `FAIL  Baseline file missing: ${relative(ROOT, path)}\n` +
        `  Run: npm run check:rendered-scope:update-baseline`,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return { error: 'parse', message: `FAIL  Cannot read/parse ${relative(ROOT, path)}: ${err.message}` };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.version !== 'number') {
    return {
      error: 'version',
      message: `FAIL  ${relative(ROOT, path)} has an unrecognised or missing "version" — expected ${BASELINE_VERSION}.\n` +
        `  Run: npm run check:rendered-scope:update-baseline`,
    };
  }
  if (parsed.version !== BASELINE_VERSION) {
    return {
      error: 'version',
      message: `FAIL  ${relative(ROOT, path)} version ${parsed.version} does not match the expected version ${BASELINE_VERSION}.\n` +
        `  Run: npm run check:rendered-scope:update-baseline`,
    };
  }
  if (parsed.edges === null || typeof parsed.edges !== 'object' || Array.isArray(parsed.edges)) {
    return { error: 'shape', message: `FAIL  ${relative(ROOT, path)} "edges" must be an object.` };
  }
  return { version: parsed.version, edges: parsed.edges };
}

/** Writes the baseline file, keys sorted (§10.6 — determinism). Node's utf8 writer never emits a BOM. */
function writeBaselineFile(path, version, edgesObj) {
  const sorted = {};
  for (const key of Object.keys(edgesObj).sort()) sorted[key] = edgesObj[key];
  writeFileSync(path, JSON.stringify({ version, edges: sorted }, null, 2) + '\n', 'utf8');
}

/**
 * Pure: the exit-code decision from a baseline comparison plus allowlist integrity — the EXACT function
 * gate mode calls to compute the value passed to `process.exit()`, not a re-derivation of its logic
 * (Task 818 Revision 1, R15). The self-test's exit-wiring arm calls this same function with synthetic
 * counts, so a refactor that keeps classification correct but stops wiring it to the exit code is
 * caught, which arms 1-3 (pure classification only) cannot catch.
 */
function evaluateGateExitCode({ newEdgesCount, staleKeysCount, allowlistFailureCount }) {
  return newEdgesCount > 0 || staleKeysCount > 0 || allowlistFailureCount > 0 ? 1 : 0;
}

// ── Self-test (--verify-gate, R6) ───────────────────────────────────────────────
//
// CI-safe: no server, no browser, no network. Arms 1-3 are synthetic in-memory plants run through the
// same pure compareToBaseline/computeBaselineUpdate functions the real gate uses — nothing is written
// to any tracked file. Arm 4 re-runs the real walk (read-only) against the real committed baseline
// (read-only) to prove the unplanted tree is clean.
function runSelfTest() {
  const ARM_COUNT = 5;
  console.log(`check:rendered-scope gate self-test (--verify-gate, Task 818 R6/R15) — running ${ARM_COUNT} arms\n`);
  let passed = 0;
  let failed = 0;
  function record(ok, label) {
    if (ok) {
      console.log(`  PASS  ${label}`);
      passed++;
    } else {
      console.log(`  FAIL  ${label}`);
      failed++;
    }
  }

  // Arm 1 — a new tier-1 edge absent from the baseline is reported as new.
  {
    const key = 'src/fake/verify-gate/From.tsx -> src/fake/verify-gate/To.tsx';
    const current = new Map([[key, { key, from: 'src/fake/verify-gate/From.tsx', to: 'src/fake/verify-gate/To.tsx', tier: 'tier1-unenrolled' }]]);
    const { newEdges, staleKeys } = compareToBaseline(current, {});
    record(
      newEdges.length === 1 && newEdges[0].key === key && newEdges[0].tier === 'tier1-unenrolled' && staleKeys.length === 0,
      'Arm 1 — new tier1-unenrolled edge absent from baseline -> reported new'
    );
  }

  // Arm 2 — a new tier-2 edge is reported new, and --update-baseline refuses to record it.
  {
    const key = 'src/fake/verify-gate/From.tsx -> src/components/ui/FakeVerifyGate.tsx';
    const current = new Map([[key, { key, from: 'src/fake/verify-gate/From.tsx', to: 'src/components/ui/FakeVerifyGate.tsx', tier: 'tier2-legacy-primitive' }]]);
    const priorBaseline = {}; // an existing baseline file that does not contain this edge
    const { newEdges } = compareToBaseline(current, priorBaseline);
    const { edges, refusedTier2 } = computeBaselineUpdate(current, priorBaseline);
    record(
      newEdges.length === 1 &&
        refusedTier2.length === 1 &&
        refusedTier2[0].key === key &&
        !Object.prototype.hasOwnProperty.call(edges, key),
      'Arm 2 — new tier2-legacy-primitive edge -> gate reports new, --update-baseline refuses it'
    );
  }

  // Arm 3 — a stale baseline entry (no matching measured edge) is reported stale.
  {
    const staleKey = 'src/fake/verify-gate/Gone.tsx -> src/fake/verify-gate/Ghost.tsx';
    const current = new Map();
    const priorBaseline = { [staleKey]: { tier: 'tier1-unenrolled' } };
    const { newEdges, staleKeys } = compareToBaseline(current, priorBaseline);
    record(
      staleKeys.length === 1 && staleKeys[0] === staleKey && newEdges.length === 0,
      'Arm 3 — baseline entry with no matching measured edge -> reported stale'
    );
  }

  // Arm 4 — the real, unplanted tree measured against the real committed baseline is clean.
  {
    const loaded = loadBaselineFile(BASELINE_PATH);
    if (loaded.error) {
      record(false, `Arm 4 — unplanted tree vs. committed baseline -> clean (baseline load failed: ${loaded.message.split('\n')[0]})`);
    } else {
      const realWalk = walkEnrolledSubgraph(manifest, manifestSet, allowlistByPath);
      const realCurrent = dedupeEdges(realWalk.tier1Findings, realWalk.tier2Findings);
      const { newEdges, staleKeys } = compareToBaseline(realCurrent, loaded.edges);
      record(
        newEdges.length === 0 && staleKeys.length === 0,
        `Arm 4 — unplanted tree vs. committed baseline -> clean (${newEdges.length} new, ${staleKeys.length} stale)`
      );
    }
  }

  // Arm 5 — the EXIT-CODE decision itself is exercised, not only classification (R15): a synthetic
  // new edge must drive `evaluateGateExitCode` — the exact function gate mode calls — to 1, and an
  // all-clear synthetic state must drive it to 0.
  {
    const dirty = evaluateGateExitCode({ newEdgesCount: 1, staleKeysCount: 0, allowlistFailureCount: 0 });
    const clean = evaluateGateExitCode({ newEdgesCount: 0, staleKeysCount: 0, allowlistFailureCount: 0 });
    record(
      dirty === 1 && clean === 0,
      'Arm 5 — exit-code wiring: a synthetic new edge drives evaluateGateExitCode to 1, the clean state to 0'
    );
  }

  console.log(`\nArms run: ${ARM_COUNT}`);
  console.log(`Self-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAIL  check:rendered-scope:verify — the gate self-test found a broken arm.');
    process.exit(1);
  }
  console.log(`PASS  check:rendered-scope:verify — all ${ARM_COUNT} arms (R6 + R15) behave correctly.`);
  process.exit(0);
}

if (VERIFY_GATE) {
  runSelfTest();
}

// ── Run the walk ─────────────────────────────────────────────────────────────────

const walk = walkEnrolledSubgraph(manifest, manifestSet, allowlistByPath);
const {
  rootsWalked, edgesResolved, nonRenderedSkipped, allowlistedEdgeCount,
  tier1Findings, tier2Findings, allowlistedFindings, barrelHops, barrelUnresolvedEdges, allowlistMatched,
} = walk;

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

console.log('check:rendered-scope — enrolled-subgraph rendered-component detector (Task 812; Task 818 baseline)');
console.log(`    Enrolled roots walked: ${rootsWalked} (of ${manifest.length} manifest entries)`);
console.log(`    Local import edges resolved: ${edgesResolved}`);
console.log(`    Non-rendered local imports skipped (hooks/utils/consts/context/type-only): ${nonRenderedSkipped}`);
console.log(`    Allowlisted edges (tier3, owner-filed): ${allowlistedEdgeCount}`);
console.log(`    Barrel hops unwrapped (single-hop, index.ts/tsx re-export): ${barrelHops.length}`);
console.log(`    Barrel edges NOT unwrapped (reported at the barrel file itself): ${barrelUnresolvedEdges.length}`);
console.log('    Cannot see: dynamic import() and React.lazy() — not statically resolved by this gate.');
console.log('');

const currentEdges = dedupeEdges(tier1Findings, tier2Findings);
const rawFindingCount = tier1Findings.length + tier2Findings.length;
console.log(`    Distinct rendered frontier edges: ${currentEdges.size} (deduped from ${rawFindingCount} finding(s) — two bindings can resolve to the same edge)`);
console.log('');

// Baseline context (Task 818 Revision 1, R14) — read once, printed for --report AND gate mode alike,
// consulted (not re-read) by --update-baseline below. --report never hard-fails on a baseline problem:
// it stays the always-exit-0 triage view, so a missing/bad baseline is stated, not fatal, here.
const baselineLoaded = loadBaselineFile(BASELINE_PATH);
let baselineComparison = null;
if (!baselineLoaded.error) {
  baselineComparison = compareToBaseline(currentEdges, baselineLoaded.edges);
  console.log(`    Baseline version: ${baselineLoaded.version}`);
  console.log(`    Baselined edges (recorded debt, does not fail): ${baselineComparison.baselinedCount}`);
  console.log(`    New edges (not in baseline): ${baselineComparison.newEdges.length}`);
  console.log(`    Stale baseline entries (no matching measured edge): ${baselineComparison.staleKeys.length}`);
  console.log('    A baselined tier-2 edge is recorded debt and not an exemption — agent-contract 16d tier 2 still binds.');
} else {
  console.log(`    Baseline context unavailable: ${baselineLoaded.message.split('\n')[0]}`);
}
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

// ── --update-baseline ────────────────────────────────────────────────────────────
//
// Only ever updates an EXISTING baseline (Task 818 Revision 1, R13). A missing file is refused rather
// than bootstrapped: regenerating from nothing would record any new tier-2 edge as pre-existing debt,
// exactly the hole the tier-2 refusal exists to close. The one-time bootstrap write already produced
// the committed file; it is not a repeatable code path from this command.
if (UPDATE_BASELINE) {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`FAIL  Baseline file missing: ${relative(ROOT, BASELINE_PATH)}`);
    console.error('  --update-baseline only updates an EXISTING baseline — regenerating from nothing would record');
    console.error('  any new tier2-legacy-primitive edge as pre-existing debt, which the tier-2 ratchet must never');
    console.error('  permit. Restore the file from version control instead of regenerating it, e.g.:');
    console.error('    git checkout -- scripts/rendered-scope-baseline.json');
    process.exit(1);
  }
  if (baselineLoaded.error) {
    console.error(baselineLoaded.message);
    process.exit(1);
  }

  const { edges, refusedTier2 } = computeBaselineUpdate(currentEdges, baselineLoaded.edges);
  writeBaselineFile(BASELINE_PATH, BASELINE_VERSION, edges);

  console.log(`Baseline updated -> ${relative(ROOT, BASELINE_PATH)}`);
  console.log(`    version: ${BASELINE_VERSION}`);
  console.log(`    entries written: ${Object.keys(edges).length}`);

  if (refusedTier2.length > 0) {
    console.error('');
    console.error(`FAIL  ${refusedTier2.length} new tier2-legacy-primitive edge(s) refused — a baseline cannot exempt a new legacy-primitive import:`);
    for (const f of refusedTier2) console.error(`    ${f.from} -> ${f.to}  [tier2-legacy-primitive]`);
    console.error('  Fix: stop importing the legacy primitive from the enrolled surface (agent-contract 16d tier 2).');
    process.exit(1);
  }

  console.log('PASS  check:rendered-scope:update-baseline — baseline written, no tier-2 refusals.');
  process.exit(0);
}

// ── Gate mode: compare against the baseline ──────────────────────────────────────

if (baselineLoaded.error) {
  console.error(baselineLoaded.message);
  console.error('Docs: docs/storybook-governance.md §15.5, docs/golden-rules.md GR-1/GR-3.');
  process.exit(1);
}

const { newEdges, staleKeys } = baselineComparison;

if (allowlistParseError) {
  console.error(`FAIL  Cannot read/parse ${relative(ROOT, ALLOWLIST_PATH)}: ${allowlistParseError}`);
}

if (allowlistMissingReasonOrOwner.length > 0) {
  console.error(`FAIL  ${allowlistMissingReasonOrOwner.length} rendered-scope-allowlist.json entry(ies) missing reason or owner:`);
  for (const e of allowlistMissingReasonOrOwner) console.error(`    ${JSON.stringify(e)}`);
  console.error('  Every allowlist entry requires a non-empty "reason" and an "owner" task number.');
}

if (allowlistStale.length > 0) {
  console.error(`FAIL  ${allowlistStale.length} stale rendered-scope-allowlist.json entry(ies) — no matching rendered, unenrolled edge exists:`);
  for (const e of allowlistStale) console.error(`    ${e.path}`);
  console.error('  Remove the entry, or fix the path so it matches a real edge.');
}

if (allowlistTier2Invalid.length > 0) {
  console.error(`FAIL  ${allowlistTier2Invalid.length} invalid rendered-scope-allowlist.json entry(ies) — a src/components/ui/* (tier-2) path is never a valid allowlist entry:`);
  for (const e of allowlistTier2Invalid) console.error(`    ${e.path}`);
  console.error('  The allowlist is tier-3 only. A tier-2 legacy primitive is fixed by removing the import from the');
  console.error('  enrolled surface, not by excusing it with a reason.');
}

if (newEdges.length > 0) {
  console.error(`FAIL  ${newEdges.length} rendered edge(s) not in the baseline:`);
  for (const f of newEdges) {
    console.error(`    ${f.from} -> ${f.to}  [${f.tier}]`);
  }
  console.error('  Fix (tier1-unenrolled): migrate, story and add the target to scripts/mantine-migration-scope.json — or,');
  console.error('  if it is a tier-3 shared component owned by another surface, add it to scripts/rendered-scope-allowlist.json');
  console.error('  with a reason and an owning task number.');
  console.error('  Fix (tier2-legacy-primitive): stop importing the legacy primitive from the enrolled surface (agent-contract 16d tier 2).');
  console.error('  Once the edge is a deliberately-owned exception (tier1 -> allowlist) or fixed, run: npm run check:rendered-scope:update-baseline');
}

if (staleKeys.length > 0) {
  console.error(`FAIL  ${staleKeys.length} stale baseline entr(ies) — no matching rendered edge exists:`);
  for (const key of staleKeys) console.error(`    ${key}`);
  console.error('  Fix: run `npm run check:rendered-scope:update-baseline` to drop paid-off debt from the baseline.');
}

// R15: the exit code is a pure, shared decision (evaluateGateExitCode) — the exact function the
// self-test's exit-wiring arm exercises with synthetic counts, not a re-derivation of its logic.
const allowlistFailureCount =
  (allowlistParseError ? 1 : 0) +
  allowlistMissingReasonOrOwner.length +
  allowlistStale.length +
  allowlistTier2Invalid.length;
const exitCode = evaluateGateExitCode({
  newEdgesCount: newEdges.length,
  staleKeysCount: staleKeys.length,
  allowlistFailureCount,
});

if (exitCode !== 0) {
  console.error('');
  console.error('Docs: docs/storybook-governance.md §15.5, docs/agent-contract.md 16d, docs/golden-rules.md GR-1/GR-3.');
  process.exit(exitCode);
}

console.log('PASS  check:rendered-scope — every component an enrolled surface renders is enrolled, baselined, legacy-clean, or allowlisted.');
process.exit(exitCode);
