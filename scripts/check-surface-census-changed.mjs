#!/usr/bin/env node
/**
 * check-surface-census-changed.mjs — GR-1's pre-enrolment case, made blocking (Task 819).
 *
 * `check-surface-census.mjs` (Task 817) censuses ONE named surface, by hand. `check:rendered-scope`
 * (Task 818) is blocking but only ever walks ENROLLED roots. Neither one knows which surface a given
 * PR is about. This is the runner that closes that gap: it asks `map-changed-surfaces.mjs` what the
 * PR's own base..head diff affects, censuses every one of those surfaces with the Task 817 command
 * (`--json`, Task 819 R2), and aggregates every blocking node against a versioned baseline of debt
 * that already existed — new debt fails the run, exactly like `check-rendered-scope.mjs`'s edge
 * baseline (Task 818), whose shape (`version` + a keyed object, `--update-baseline`'s bootstrap and
 * tier-2 refusals, `evaluateGateExitCode`) this file copies rather than reinvents.
 *
 * Baseline key: `"<surface> :: <node> :: <reasonCode>"` — one entry per (surface, blocking node)
 * pair, because the SAME node (e.g. a widely-rendered tier-2 primitive) can block many different
 * surfaces' censuses independently, and each is its own recorded debt.
 *
 * Fail-closed (decision 4, verbatim: "fail closed... never a skipped check and never a pass with a
 * warning"): the run exits non-zero, naming the condition, whenever the mapping itself cannot resolve
 * — merge base unavailable, an unresolved candidate, either limit exceeded, a mapped surface's own
 * census exiting 2 — or whenever the baseline is missing/unparseable/version-mismatched. None of these
 * is a skip; every one is a failing run.
 *
 * This does NOT write to `scripts/rendered-scope-baseline.json` (Task 818's ledger) — that file has
 * exactly one writer, `check-rendered-scope.mjs --update-baseline`, which regenerates it wholesale;
 * this task's entries would be deleted as stale on its next run. One writer per ledger.
 *
 * Usage:
 *   node scripts/check-surface-census-changed.mjs --base <ref> [--head <ref>]
 *     [--max-changed-files <n>] [--max-surfaces <n>]
 *   node scripts/check-surface-census-changed.mjs --base <ref> [--head <ref>] --update-baseline
 *   node scripts/check-surface-census-changed.mjs --verify-gate   # CI-safe self-test (Task 819 R7)
 *   npm run check:surface-census:changed
 *   npm run check:surface-census:changed:update-baseline
 *   npm run check:surface-census:changed:verify
 *
 * `--base`/`--head` fall back to `SURFACE_CENSUS_BASE_SHA`/`SURFACE_CENSUS_HEAD_SHA` env vars (the
 * `check:review-ledger` gate's own house pattern) so `npm run check:surface-census:changed` works
 * unmodified in CI, where the workflow step sets those from the PR's base/head SHAs; an explicit CLI
 * flag always wins over the environment.
 *
 * Docs: docs/storybook-governance.md §15.7, docs/golden-rules.md GR-1/GR-3.
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  runMapping,
  resolveSurfacesFor,
  computeCandidateSurfaces,
  loadManifestSet,
  DEFAULT_MAX_CHANGED_FILES,
  DEFAULT_MAX_SURFACES,
} from './map-changed-surfaces.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CENSUS_SCRIPT = join(ROOT, 'scripts', 'check-surface-census.mjs');
const BASELINE_PATH = join(ROOT, 'scripts', 'surface-census-baseline.json');
const BASELINE_VERSION = 1;

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const UPDATE_BASELINE = args.includes('--update-baseline');
const SEED_BASELINE = args.includes('--seed-baseline');
const VERIFY_GATE = args.includes('--verify-gate');
function argVal(flag) {
  const i = args.indexOf(flag);
  return i === -1 || i + 1 >= args.length ? null : args[i + 1];
}
// House pattern (review-ledger gate): the CI step sets env vars rather than baking a PR-specific SHA
// into package.json; an explicit --base/--head CLI arg always wins over the environment.
const CLI_BASE = argVal('--base') ?? process.env.SURFACE_CENSUS_BASE_SHA ?? null;
const CLI_HEAD = argVal('--head') ?? process.env.SURFACE_CENSUS_HEAD_SHA ?? null;
const CLI_MAX_CHANGED = argVal('--max-changed-files') ? Number(argVal('--max-changed-files')) : DEFAULT_MAX_CHANGED_FILES;
const CLI_MAX_SURFACES = argVal('--max-surfaces') ? Number(argVal('--max-surfaces')) : DEFAULT_MAX_SURFACES;

// ── Census one surface via subprocess, --json mode ──────────────────────────

/**
 * Runs `check-surface-census.mjs --surface <path> --json` as a subprocess and returns its parsed
 * result. `ok: true` covers BOTH exit 0 (clean) and exit 1 (blocking) — both produce valid JSON on
 * stdout per R2. `ok: false` is exit 2 (the invocation itself was unusable) or a JSON parse failure,
 * either of which is R5's "a mapped surface makes the census exit 2" fail-closed condition.
 */
export function censusSurface(surfacePath, execFn = execFileSync) {
  try {
    const out = execFn(process.execPath, [CENSUS_SCRIPT, '--surface', surfacePath, '--json'], { cwd: ROOT, encoding: 'utf8' });
    try {
      return { ok: true, exitCode: 0, result: JSON.parse(out) };
    } catch (parseErr) {
      return { ok: false, exitCode: 0, detail: `--json output did not parse: ${parseErr.message}` };
    }
  } catch (err) {
    const exitCode = typeof err.status === 'number' ? err.status : null;
    if (exitCode === 1 && err.stdout) {
      try {
        return { ok: true, exitCode: 1, result: JSON.parse(err.stdout.toString()) };
      } catch (parseErr) {
        return { ok: false, exitCode, detail: `--json output did not parse on a blocking census: ${parseErr.message}` };
      }
    }
    return {
      ok: false,
      exitCode,
      detail: err.stderr ? err.stderr.toString().split('\n').filter(Boolean).slice(0, 3).join(' | ') : String(err.message),
    };
  }
}

// ── Baseline: dedupe, compare, update — same shape as check-rendered-scope.mjs's (Task 818) ────────

/** Collapses every surface's blocking nodes into one Map keyed "<surface> :: <node> :: <reasonCode>".
 *  Pure: plain [{surface, blocking}] array in, plain Map out. */
export function dedupeBlocks(perSurfaceBlocks) {
  const map = new Map();
  for (const { surface, blocking } of perSurfaceBlocks) {
    for (const b of blocking) {
      const key = `${surface} :: ${b.path} :: ${b.reasonCode}`;
      if (!map.has(key)) map.set(key, { key, surface, node: b.path, reasonCode: b.reasonCode, correction: b.correction });
    }
  }
  return map;
}

/** The surface prefix of a block key `"<surface> :: <node> :: <reasonCode>"`. Paths never contain the
 *  ` :: ` separator, so the first segment is always exactly the surface. */
function surfaceOfKey(key) {
  return key.split(' :: ')[0];
}

/**
 * Pure comparator (Task 819 Revision 1, R12): current measured blocks (Map) vs. baseline blocks
 * (plain object) vs. `censusedSurfaces` — the set of surfaces THIS run actually censused
 * (`mapping.included`). This run only ever measures the surfaces its own diff mapped to; a baseline
 * entry belonging to a surface outside that set is neither confirmed nor refuted by this run, so it is
 * `carried` (untouched, does not fail) rather than `stale`. A baseline entry IS `stale` only when its
 * own surface was censused this run and the block no longer appears — that is real, measured paid-off
 * debt. (`check-rendered-scope.mjs`'s whole-manifest walk measures every edge on every run, so its
 * stale rule is unconditional; this run is diff-scoped, so it cannot be.)
 */
export function compareToBaseline(currentBlocks, baselineBlocks, censusedSurfaces) {
  const newBlocks = [];
  const staleKeys = [];
  const carriedKeys = [];
  let baselinedCount = 0;
  for (const [key, block] of currentBlocks) {
    if (Object.prototype.hasOwnProperty.call(baselineBlocks, key)) baselinedCount++;
    else newBlocks.push(block);
  }
  for (const key of Object.keys(baselineBlocks)) {
    if (currentBlocks.has(key)) continue; // already counted above (baselined)
    if (censusedSurfaces.has(surfaceOfKey(key))) staleKeys.push(key);
    else carriedKeys.push(key);
  }
  return { newBlocks, staleKeys, carriedKeys, baselinedCount };
}

/**
 * Pure --update-baseline writer logic (Task 819 Revision 1, R12): current measured blocks (Map) + the
 * PRIOR baseline's blocks object (always real, never null — `--update-baseline` refuses to run at all
 * when the file is missing) + `censusedSurfaces` (the surfaces this run measured). MERGES rather than
 * replaces: every prior entry whose surface was NOT censused this run survives byte-identically —
 * a run must never be able to delete recorded debt for a surface it did not look at. Entries for a
 * censused surface are regenerated from `currentBlocks` (so paid-off debt on that surface drops, and a
 * new tier-2 block is refused exactly as `check-rendered-scope.mjs`'s R4/R13, Task 818 Revision 1).
 * Each written value carries its `reasonCode` (R14) so the ledger is readable without parsing its key.
 */
export function computeBaselineUpdate(currentBlocks, priorBaselineBlocks, censusedSurfaces) {
  const blocks = {};
  const refusedTier2 = [];

  for (const key of Object.keys(priorBaselineBlocks)) {
    if (!censusedSurfaces.has(surfaceOfKey(key))) {
      blocks[key] = priorBaselineBlocks[key];
    }
  }

  for (const [key, block] of currentBlocks) {
    if (
      block.reasonCode === 'tier2-legacy-primitive' &&
      !Object.prototype.hasOwnProperty.call(priorBaselineBlocks, key)
    ) {
      refusedTier2.push(block);
      continue;
    }
    blocks[key] = { reasonCode: block.reasonCode };
  }

  return { blocks, refusedTier2 };
}

/** Loads and validates scripts/surface-census-baseline.json. Returns { error, message } on any
 *  failure — missing file, unparseable JSON, or a missing/unrecognised version — never a silent
 *  empty baseline. Returns { version, blocks } on success. */
export function loadBaselineFile(path) {
  if (!existsSync(path)) {
    return {
      error: 'missing',
      message: `FAIL  Baseline file missing: ${relative(ROOT, path)}\n` +
        `  Run: npm run check:surface-census:changed:update-baseline`,
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
        `  Run: npm run check:surface-census:changed:update-baseline`,
    };
  }
  if (parsed.version !== BASELINE_VERSION) {
    return {
      error: 'version',
      message: `FAIL  ${relative(ROOT, path)} version ${parsed.version} does not match the expected version ${BASELINE_VERSION}.\n` +
        `  Run: npm run check:surface-census:changed:update-baseline`,
    };
  }
  if (parsed.blocks === null || typeof parsed.blocks !== 'object' || Array.isArray(parsed.blocks)) {
    return { error: 'shape', message: `FAIL  ${relative(ROOT, path)} "blocks" must be an object.` };
  }
  return { version: parsed.version, blocks: parsed.blocks };
}

/** Writes the baseline file, keys sorted (determinism). Node's utf8 writer never emits a BOM. */
export function writeBaselineFile(path, version, blocksObj) {
  const sorted = {};
  for (const key of Object.keys(blocksObj).sort()) sorted[key] = blocksObj[key];
  writeFileSync(path, JSON.stringify({ version, blocks: sorted }, null, 2) + '\n', 'utf8');
}

/**
 * Pure: the exit-code decision — the EXACT function the real run calls, and the self-test's exit-
 * wiring arm exercises with synthetic counts (Task 818 R15 precedent).
 */
export function evaluateGateExitCode({ newBlocksCount, staleKeysCount, failClosedCount }) {
  return newBlocksCount > 0 || staleKeysCount > 0 || failClosedCount > 0 ? 1 : 0;
}

// ── The whole pipeline: mapping -> per-surface census -> aggregate ──────────

/**
 * mapping -> census each included surface -> aggregate. Returns `{ failClosed: true, stage, ... }`
 * the moment R5 fires; otherwise `{ failClosed: false, mapping, perSurfaceBlocks }`.
 */
export function runPipeline({ base, head, maxChangedFiles, maxSurfaces }, censusFn = censusSurface) {
  const mapping = runMapping({ base, head, maxChangedFiles, maxSurfaces });
  if (mapping.failClosed) {
    return { failClosed: true, stage: 'mapping', mapping };
  }

  const perSurfaceBlocks = [];
  const censusFailures = [];
  for (const surface of mapping.included) {
    const c = censusFn(surface);
    if (!c.ok) {
      censusFailures.push({ surface, exitCode: c.exitCode, detail: c.detail });
      continue;
    }
    perSurfaceBlocks.push({ surface, blocking: c.result.blocking });
  }

  if (censusFailures.length > 0) {
    return { failClosed: true, stage: 'census-exit-2', mapping, censusFailures };
  }

  return { failClosed: false, mapping, perSurfaceBlocks };
}

// ── Self-test (--verify-gate, R7) ───────────────────────────────────────────
//
// CI-safe: no network. Arms 1-5 are synthetic in-memory plants through the same pure functions the
// real run uses — nothing written to a tracked file, no subprocess spawned. Arm 6 runs the REAL
// pipeline end-to-end with `--base HEAD --head HEAD` (an empty diff, real git + real fs, no server) to
// prove the unplanted/empty-diff path is clean.
function runSelfTest() {
  const ARM_COUNT = 8;
  console.log(`check:surface-census:changed gate self-test (--verify-gate, Task 819 R7) — running ${ARM_COUNT} arms\n`);
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

  // Arm 1 — a synthetic changed file that resolves to a known surface (manifest entry) is included.
  {
    const renderedBy = new Map([['src/fake/verify/Leaf.tsx', ['src/fake/verify/Root.tsx']]]);
    const manifestSet = new Set(['src/fake/verify/Root.tsx']);
    const res = resolveSurfacesFor('src/fake/verify/Leaf.tsx', renderedBy, manifestSet);
    record(
      !res.unresolved && res.roots.length === 1 && res.roots[0] === 'src/fake/verify/Root.tsx',
      'Arm 1 — changed file resolves upward to a known (manifest) surface -> included'
    );
  }

  // Arm 2 — a synthetic changed file trapped in a pure cycle (no root anywhere) is unresolved, and
  // that condition drives the pipeline's fail-closed exit code to non-zero.
  {
    const renderedBy = new Map([
      ['src/fake/verify/CycleA.tsx', ['src/fake/verify/CycleB.tsx']],
      ['src/fake/verify/CycleB.tsx', ['src/fake/verify/CycleA.tsx']],
    ]);
    const manifestSet = new Set(); // neither cycle member is a manifest entry or under src/app/**
    const res = resolveSurfacesFor('src/fake/verify/CycleA.tsx', renderedBy, manifestSet);
    const exitCode = evaluateGateExitCode({ newBlocksCount: 0, staleKeysCount: 0, failClosedCount: res.unresolved ? 1 : 0 });
    record(res.unresolved === true && exitCode === 1, 'Arm 2 — changed file trapped in a rootless cycle -> unresolved, drives exit non-zero');
  }

  // Arm 3 — an over-limit diff drives the exit decision to non-zero (fail-closed, R5). Uses `HEAD~1`
  // as base so the diff is real and non-empty (base===head would always be 0 changed files, which can
  // never exceed a limit of 0 — this arm needs an actual changed-file count to cap).
  {
    const mapping = runMapping({ base: 'HEAD~1', head: 'HEAD', maxChangedFiles: 0, maxSurfaces: DEFAULT_MAX_SURFACES });
    const exitCode = evaluateGateExitCode({ newBlocksCount: 0, staleKeysCount: 0, failClosedCount: mapping.failClosed ? 1 : 0 });
    record(
      mapping.failClosed === true && mapping.reason === 'changed-file-limit-exceeded' && exitCode === 1,
      'Arm 3 — changed-file limit set below the real diff size -> fail-closed, drives exit non-zero'
    );
  }

  // Arm 4 — a new (un-baselined) block, on a surface THIS run censused, drives the exit decision to
  // non-zero.
  {
    const surface = 'src/fake/verify/Surface.tsx';
    const key = `${surface} :: src/fake/verify/Unmigrated.tsx :: tier1-unenrolled-or-unstoried`;
    const current = new Map([[key, { key, surface, node: 'src/fake/verify/Unmigrated.tsx', reasonCode: 'tier1-unenrolled-or-unstoried' }]]);
    const censusedSurfaces = new Set([surface]);
    const { newBlocks, staleKeys } = compareToBaseline(current, {}, censusedSurfaces);
    const exitCode = evaluateGateExitCode({ newBlocksCount: newBlocks.length, staleKeysCount: staleKeys.length, failClosedCount: 0 });
    record(newBlocks.length === 1 && exitCode === 1, 'Arm 4 — new (un-baselined) block on a censused surface -> drives exit non-zero');
  }

  // Arm 5 — a block already recorded in the baseline does not fail.
  {
    const surface = 'src/fake/verify/Surface.tsx';
    const key = `${surface} :: src/fake/verify/Debt.tsx :: tier1-unenrolled-or-unstoried`;
    const current = new Map([[key, { key, surface, node: 'src/fake/verify/Debt.tsx', reasonCode: 'tier1-unenrolled-or-unstoried' }]]);
    const priorBaseline = { [key]: { reasonCode: 'tier1-unenrolled-or-unstoried' } };
    const censusedSurfaces = new Set([surface]);
    const { newBlocks, staleKeys, baselinedCount } = compareToBaseline(current, priorBaseline, censusedSurfaces);
    const exitCode = evaluateGateExitCode({ newBlocksCount: newBlocks.length, staleKeysCount: staleKeys.length, failClosedCount: 0 });
    record(
      newBlocks.length === 0 && staleKeys.length === 0 && baselinedCount === 1 && exitCode === 0,
      'Arm 5 — baselined block is recorded debt -> does not fail'
    );
  }

  // Arm 6 — the real pipeline, base===head (an empty, real diff): 0 changed files, 0 surfaces, clean.
  {
    const result = runPipeline({ base: 'HEAD', head: 'HEAD', maxChangedFiles: CLI_MAX_CHANGED, maxSurfaces: CLI_MAX_SURFACES });
    record(
      result.failClosed === false && result.mapping.changedCount === 0 && result.perSurfaceBlocks.length === 0,
      `Arm 6 — real pipeline, base===head (empty diff) -> clean (${result.failClosed ? 'failClosed' : `${result.mapping?.changedCount ?? '?'} changed, ${result.perSurfaceBlocks?.length ?? '?'} surfaces`})`
    );
  }

  // Arm 7 (Task 819 Revision 1, R15) — a baseline entry for a surface this run did NOT census is
  // `carried`, not `stale`: it must not appear in staleKeys and must not drive the exit non-zero. This
  // is the exact defect Revision 1 fixes — a diff-scoped run must never treat an un-censused surface's
  // recorded debt as paid off.
  {
    const censusedSurface = 'src/fake/verify/Censused.tsx';
    const uncensusedSurface = 'src/fake/verify/NotTouchedByThisDiff.tsx';
    const key = `${uncensusedSurface} :: src/fake/verify/OldDebt.tsx :: tier1-unenrolled-or-unstoried`;
    const current = new Map(); // this run censused Censused.tsx and found nothing blocking on it
    const priorBaseline = { [key]: { reasonCode: 'tier1-unenrolled-or-unstoried' } };
    const censusedSurfaces = new Set([censusedSurface]);
    const { newBlocks, staleKeys, carriedKeys } = compareToBaseline(current, priorBaseline, censusedSurfaces);
    const exitCode = evaluateGateExitCode({ newBlocksCount: newBlocks.length, staleKeysCount: staleKeys.length, failClosedCount: 0 });
    record(
      staleKeys.length === 0 && carriedKeys.length === 1 && carriedKeys[0] === key && exitCode === 0,
      'Arm 7 — baseline entry for an un-censused surface -> carried, not stale, does not fail'
    );
  }

  // Arm 8 (Task 819 Revision 1, R15) — a block missing from a surface this run DID census is `stale`
  // and drives the exit non-zero — the mirror of arm 7, proving the distinction cuts both ways.
  {
    const censusedSurface = 'src/fake/verify/Censused.tsx';
    const key = `${censusedSurface} :: src/fake/verify/PaidOffDebt.tsx :: tier1-unenrolled-or-unstoried`;
    const current = new Map(); // the surface was censused and this block no longer appears — paid off
    const priorBaseline = { [key]: { reasonCode: 'tier1-unenrolled-or-unstoried' } };
    const censusedSurfaces = new Set([censusedSurface]);
    const { newBlocks, staleKeys, carriedKeys } = compareToBaseline(current, priorBaseline, censusedSurfaces);
    const exitCode = evaluateGateExitCode({ newBlocksCount: newBlocks.length, staleKeysCount: staleKeys.length, failClosedCount: 0 });
    record(
      staleKeys.length === 1 && staleKeys[0] === key && carriedKeys.length === 0 && exitCode === 1,
      'Arm 8 — block missing from a censused surface -> stale, drives exit non-zero'
    );
  }

  console.log(`\nArms run: ${ARM_COUNT}`);
  console.log(`Self-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAIL  check:surface-census:changed:verify — the gate self-test found a broken arm.');
    process.exit(1);
  }
  console.log(`PASS  check:surface-census:changed:verify — all ${ARM_COUNT} arms (R7) behave correctly.`);
  process.exit(0);
}

// ── CLI: gate mode / --update-baseline ──────────────────────────────────────

function printScopeBlock(mapping, extra) {
  console.log('check:surface-census:changed — diff-mapped per-surface GR-1 census (Task 819)');
  if (mapping.base !== undefined) {
    console.log(`    Base: ${mapping.base}  Head: ${mapping.head ?? '(n/a)'}  Merge base: ${mapping.mergeBase ?? '(n/a)'}`);
  }
  console.log(`    Changed paths seen: ${mapping.changedCount ?? 0}`);
  console.log(`    Excluded (${(mapping.excluded ?? []).length}):`);
  for (const e of mapping.excluded ?? []) console.log(`      ${e.path}  [${e.reason}]`);
  console.log(`    Included surfaces (${(mapping.included ?? []).length}):`);
  for (const s of mapping.included ?? []) console.log(`      ${s}`);
  if (extra) {
    console.log(`    Surfaces censused: ${extra.censused}`);
    console.log(`    Blocks baselined (recorded debt, does not fail): ${extra.baselinedCount}`);
    console.log(`    Blocks carried (baseline entries for a surface this run did NOT census — neither stale nor new): ${extra.carriedCount}`);
    console.log(`    Blocks new (not in baseline): ${extra.newCount}`);
    console.log(`    Stale baseline entries (censused surface, no matching measured block): ${extra.staleCount}`);
  }
  console.log(`    Limits: maxChangedFiles=${CLI_MAX_CHANGED} maxSurfaces=${CLI_MAX_SURFACES}`);
  console.log('    Cannot see: dynamic import(), React.lazy(), a surface reached only through a route convention');
  console.log('    this mapper does not model, a file changed outside src/, or a component rendered only from a');
  console.log('    .stories.tsx file (check-surface-census.mjs\'s own blind spot, unchanged by this task).');
  console.log('');
}

/**
 * Censuses every surface in the CANDIDATE SPACE (Task 819 Revision 1, R13) — every manifest entry,
 * every route file under `src/app/**`, and every file nothing in the whole-src render graph renders —
 * not one diff's mapped surfaces. This is what `--seed-baseline` seeds from; the ordinary gate/
 * `--update-baseline` paths still use the diff-mapped `mapping.included` set from `runPipeline`.
 */
function censusCandidateSpace(censusFn = censusSurface) {
  const manifestSet = loadManifestSet();
  const surfaces = computeCandidateSurfaces(manifestSet);
  const perSurfaceBlocks = [];
  const censusFailures = [];
  for (const surface of surfaces) {
    const c = censusFn(surface);
    if (!c.ok) {
      censusFailures.push({ surface, exitCode: c.exitCode, detail: c.detail });
      continue;
    }
    perSurfaceBlocks.push({ surface, blocking: c.result.blocking });
  }
  return { surfaces, perSurfaceBlocks, censusFailures };
}

function main() {
  // ── --seed-baseline: the ONE-TIME initial write, deliberately not `--update-baseline` and never
  // wired into any npm script (R4's "refuses to bootstrap a missing file once seeded", the Task 818
  // Revision 1 R13 escape-hatch shape: "an explicit, separately-named flag ... not reachable from
  // npm run ...update-baseline"). It only ever runs against a genuinely missing file; once the file
  // exists, `--update-baseline` is the only path, and it never bootstraps (see below). Seeds from the
  // full CANDIDATE SPACE (R13), not from one diff's mapped surfaces — it needs no --base/--head.
  if (SEED_BASELINE) {
    if (existsSync(BASELINE_PATH)) {
      console.error(`FAIL  ${relative(ROOT, BASELINE_PATH)} already exists — --seed-baseline is for the one-time`);
      console.error('  initial write only. Use --update-baseline to regenerate an existing baseline.');
      process.exit(1);
    }
    console.log('check:surface-census:changed --seed-baseline — censusing the full candidate space (Task 819 R13)');
    const { surfaces, perSurfaceBlocks, censusFailures } = censusCandidateSpace();
    console.log(`    Candidate-space surfaces: ${surfaces.length}`);
    if (censusFailures.length > 0) {
      console.error(`FAIL  ${censusFailures.length} candidate surface(s) made their own census exit 2 (invocation unusable):`);
      for (const f of censusFailures) console.error(`    ${f.surface}  [exit ${f.exitCode}]  ${f.detail}`);
      process.exit(1);
    }
    const currentBlocks = dedupeBlocks(perSurfaceBlocks);
    const blocks = {};
    for (const [key, block] of currentBlocks) blocks[key] = { reasonCode: block.reasonCode };
    console.log(`About to seed ${Object.keys(blocks).length} block(s) as pre-existing debt into ${relative(ROOT, BASELINE_PATH)}:`);
    for (const key of Object.keys(blocks).sort()) console.log(`    ${key}`);
    writeBaselineFile(BASELINE_PATH, BASELINE_VERSION, blocks);
    console.log(`PASS  --seed-baseline — wrote ${Object.keys(blocks).length} entries across ${surfaces.length} candidate-space surfaces, version ${BASELINE_VERSION}.`);
    process.exit(0);
  }

  if (!CLI_BASE) {
    console.error('FAIL  check:surface-census:changed — --base <ref> is required.');
    process.exit(1);
  }

  if (UPDATE_BASELINE) {
    if (!existsSync(BASELINE_PATH)) {
      console.error(`FAIL  Baseline file missing: ${relative(ROOT, BASELINE_PATH)}`);
      console.error('  --update-baseline only updates an EXISTING baseline — regenerating from nothing would record');
      console.error('  any new tier2-legacy-primitive block as pre-existing debt, which the tier-2 ratchet must never');
      console.error('  permit. Restore the file from version control instead of regenerating it, e.g.:');
      console.error('    git checkout -- scripts/surface-census-baseline.json');
      process.exit(1);
    }
    const loaded = loadBaselineFile(BASELINE_PATH);
    if (loaded.error) {
      console.error(loaded.message);
      process.exit(1);
    }

    const pipeline = runPipeline({ base: CLI_BASE, head: CLI_HEAD, maxChangedFiles: CLI_MAX_CHANGED, maxSurfaces: CLI_MAX_SURFACES });
    if (pipeline.failClosed) {
      console.error(`FAIL  check:surface-census:changed:update-baseline — mapping/census failed closed (${pipeline.stage}); cannot seed a baseline from a failed run.`);
      console.error(JSON.stringify(pipeline, null, 2));
      process.exit(1);
    }

    printScopeBlock(pipeline.mapping);
    const currentBlocks = dedupeBlocks(pipeline.perSurfaceBlocks);
    const censusedSurfaces = new Set(pipeline.mapping.included);
    const { blocks, refusedTier2 } = computeBaselineUpdate(currentBlocks, loaded.blocks, censusedSurfaces);
    writeBaselineFile(BASELINE_PATH, BASELINE_VERSION, blocks);

    console.log(`Baseline updated -> ${relative(ROOT, BASELINE_PATH)}`);
    console.log(`    version: ${BASELINE_VERSION}`);
    console.log(`    entries written: ${Object.keys(blocks).length} (carried-forward entries for the ${loaded.blocks && Object.keys(loaded.blocks).length ? Object.keys(loaded.blocks).length : 0}-entry prior baseline's un-censused surfaces are preserved, not deleted)`);

    if (refusedTier2.length > 0) {
      console.error('');
      console.error(`FAIL  ${refusedTier2.length} new tier2-legacy-primitive block(s) refused — a baseline cannot exempt a new legacy-primitive import:`);
      for (const b of refusedTier2) console.error(`    ${b.surface} :: ${b.node}  [tier2-legacy-primitive]`);
      console.error('  Fix: stop importing the legacy primitive from the enrolled surface (agent-contract 16d tier 2).');
      process.exit(1);
    }

    console.log('PASS  check:surface-census:changed:update-baseline — baseline written, no tier-2 refusals.');
    process.exit(0);
  }

  // ── Gate mode ──
  const pipeline = runPipeline({ base: CLI_BASE, head: CLI_HEAD, maxChangedFiles: CLI_MAX_CHANGED, maxSurfaces: CLI_MAX_SURFACES });

  if (pipeline.failClosed) {
    if (pipeline.stage === 'mapping') {
      const m = pipeline.mapping;
      console.error(`FAIL  check:surface-census:changed — ${m.reason}: ${typeof m.detail === 'string' ? m.detail : JSON.stringify(m.detail)}`);
      if (m.excluded || m.included) printScopeBlock(m);
    } else {
      console.error('FAIL  check:surface-census:changed — one or more mapped surfaces made their own census exit 2 (invocation unusable):');
      for (const f of pipeline.censusFailures) console.error(`    ${f.surface}  [exit ${f.exitCode}]  ${f.detail}`);
      printScopeBlock(pipeline.mapping);
    }
    console.error('Docs: docs/storybook-governance.md §15.7, docs/golden-rules.md GR-1/GR-3.');
    process.exit(1);
  }

  const loaded = loadBaselineFile(BASELINE_PATH);
  if (loaded.error) {
    console.error(loaded.message);
    console.error('Docs: docs/storybook-governance.md §15.7, docs/golden-rules.md GR-1/GR-3.');
    process.exit(1);
  }

  const currentBlocks = dedupeBlocks(pipeline.perSurfaceBlocks);
  const censusedSurfaces = new Set(pipeline.mapping.included);
  const { newBlocks, staleKeys, carriedKeys, baselinedCount } = compareToBaseline(currentBlocks, loaded.blocks, censusedSurfaces);

  printScopeBlock(pipeline.mapping, {
    censused: pipeline.mapping.included.length,
    baselinedCount,
    carriedCount: carriedKeys.length,
    newCount: newBlocks.length,
    staleCount: staleKeys.length,
  });

  if (newBlocks.length > 0) {
    console.error(`FAIL  ${newBlocks.length} block(s) not in the baseline:`);
    for (const b of newBlocks) {
      console.error(`    ${b.surface} :: ${b.node}  [${b.reasonCode}]`);
      console.error(`      ${b.correction}`);
    }
  }
  if (staleKeys.length > 0) {
    console.error(`FAIL  ${staleKeys.length} stale baseline entr(ies) — no matching block exists:`);
    for (const key of staleKeys) console.error(`    ${key}`);
    console.error('  Fix: run `npm run check:surface-census:changed:update-baseline` to drop paid-off debt from the baseline.');
  }

  const exitCode = evaluateGateExitCode({ newBlocksCount: newBlocks.length, staleKeysCount: staleKeys.length, failClosedCount: 0 });
  if (exitCode !== 0) {
    console.error('');
    console.error('Docs: docs/storybook-governance.md §15.7, docs/agent-contract.md 16d, docs/golden-rules.md GR-1/GR-3.');
    process.exit(exitCode);
  }

  console.log('PASS  check:surface-census:changed — every surface the diff affects is enrolled, baselined, or clean.');
  process.exit(exitCode);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (VERIFY_GATE) runSelfTest();
  else main();
}
