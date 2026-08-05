#!/usr/bin/env node
/**
 * check-assertion-liveness.mjs — meta-gate: a boolean assertion that is `null`/absent in EVERY
 * cell of its scope is a dead gate, not a pass (Task 710).
 *
 * Why. `check-stories-rendered.mjs` writes several boolean assertion keys per cell
 * (`cell.assertions.<key>`), and every consumer of those keys only ever tests `=== false`
 * (docs/storybook-governance.md §14.9.17, docs/critical-flow-registry.md row 50). A key that is
 * `null`/absent in EVERY cell therefore contributes `true` to `hardPass` — it looks like a
 * passing check while never having checked anything. That is exactly how Task 573's
 * `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` assertions died unnoticed for ~5 weeks
 * (both selectors are shadcn `data-slot` names the Mantine-only scope never renders).
 *
 * This script reads an already-persisted `manifest.json` (produced by
 * `npm run screenshots:assert`) — it NEVER launches a browser — and classifies every BOOLEAN
 * assertion key it finds into one of four states:
 *
 *   LIVE        — resolved to `true` or `false` (i.e. not null/absent) in at least one cell.
 *   DEAD-NEW    — null/absent in EVERY cell, and no registry entry names it for this scope.
 *                 This is a NEW dead gate — blocking.
 *   DEAD-KNOWN  — null/absent in EVERY cell, AND a registry entry tracks it for this scope
 *                 against a follow-up task. Reported loudly, non-blocking.
 *   STALE-ENTRY — a registry entry names it for this scope, but it is NOT dead any more (it
 *                 resolved true/false in ≥1 cell). The registry itself is now wrong — blocking,
 *                 so a stale entry can never quietly become a permanent allowlist.
 *
 * Classification is SHAPE-DRIVEN (A1), never a hardcoded key list: a key is a boolean-assertion
 * candidate iff every value it takes anywhere in the manifest is `true`, `false`, or `null`. A key
 * that is ever an object/array/string/number (e.g. `renderCheck`, `styleIntegrity`,
 * `visualIntegrity`) is skipped automatically — not because this file names it. `null` and
 * "key absent from this cell's `assertions` object" are treated identically (A2).
 *
 * The registry (`scripts/assertion-liveness-registry.json`) is a TRACKED DEAD GATE list, not an
 * exemption list: every entry must carry a `followUpTask`, and an entry whose assertion has come
 * back to life is a hard failure (STALE-ENTRY) naming the entry to delete — the registry can never
 * rot into a silent allowlist (mirrors `check:design-tokens`'s stale-marker precedent).
 *
 * A registry entry is scoped to `{ scope, assertion }` (A3) — the scope this task measured is
 * `mantine-only` only; full-matrix liveness of the two known-dead assertions is UNMEASURED.
 *
 * Exit codes: 0 = every key is LIVE or DEAD-KNOWN. 1 = at least one DEAD-NEW or STALE-ENTRY.
 * 2 = bad input (manifest missing / unparseable / no `matrix` array / zero cells) — never a
 * silent green on degenerate input.
 *
 * Usage:
 *   npm run check:assertion-liveness              — classify the latest screenshots:assert manifest
 *   npm run check:assertion-liveness:verify        — self-test (proves DEAD-NEW/STALE-ENTRY/bad-input
 *                                                     actually fail, and the real manifest passes)
 *   node scripts/check-assertion-liveness.mjs --manifest <path> --registry <path> --scope <name>
 *
 * Added by Task 710 (Sprint 49, 2026-08-05). See docs/storybook-governance.md §14.9.23 and
 * docs/critical-flow-registry.md row 50.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Crash guards — same contract as check-stories-rendered.mjs / check-homepage-grid.mjs: the
// process must always exit with a controlled integer code, never -1 (OS kill / unhandled
// exception). Exit 2 = harness crash / bad input, distinguishable from controlled exit 1 = a real
// dead-or-stale assertion found.
process.on('uncaughtException', (err) => {
  console.error('❌ check-assertion-liveness: uncaughtException — exiting with code 2');
  console.error(err);
  process.exitCode = 2;
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ check-assertion-liveness: unhandledRejection — exiting with code 2');
  console.error(reason);
  process.exitCode = 2;
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEFAULT_REGISTRY_PATH = join(ROOT, 'scripts', 'assertion-liveness-registry.json');
const RENDERED_ASSERT_DIR = join(ROOT, '.screenshots', 'rendered-assert');
const DEFAULT_SCOPE = 'mantine-only';

// ── CLI flags ─────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { verifyGate: false, manifestPath: null, registryPath: DEFAULT_REGISTRY_PATH, scope: DEFAULT_SCOPE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verify-gate') args.verifyGate = true;
    else if (a === '--manifest') args.manifestPath = argv[++i];
    else if (a === '--registry') args.registryPath = argv[++i];
    else if (a === '--scope') args.scope = argv[++i];
  }
  return args;
}

/** Latest `.screenshots/rendered-assert/<timestamp>/` directory, sorted lexicographically —
 * the directory names are `YYYY-MM-DDTHH-MM`, so string sort is chronological sort. */
function findLatestManifestPath() {
  if (!existsSync(RENDERED_ASSERT_DIR)) return null;
  const dirs = readdirSync(RENDERED_ASSERT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (dirs.length === 0) return null;
  return join(RENDERED_ASSERT_DIR, dirs[dirs.length - 1], 'manifest.json');
}

// ── Manifest / registry loading (never launches a browser — A4) ────────────────

/**
 * @returns {{ ok: true, manifest: object } | { ok: false, code: string, message: string }}
 */
function loadManifest(manifestPath) {
  if (!manifestPath) {
    return { ok: false, code: 'missing-file', message: 'No --manifest given and no run found under .screenshots/rendered-assert/ to default to.' };
  }
  if (!existsSync(manifestPath)) {
    return { ok: false, code: 'missing-file', message: `Manifest not found: ${manifestPath}` };
  }
  let raw;
  try {
    raw = readFileSync(manifestPath, 'utf8');
  } catch (err) {
    return { ok: false, code: 'missing-file', message: `Manifest could not be read: ${manifestPath}: ${err.message}` };
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return { ok: false, code: 'unparseable', message: `Manifest is not valid JSON: ${manifestPath}: ${err.message}` };
  }
  if (!json || typeof json !== 'object' || !Array.isArray(json.matrix)) {
    return { ok: false, code: 'no-matrix', message: `Manifest has no "matrix" array: ${manifestPath}` };
  }
  if (json.matrix.length === 0) {
    return { ok: false, code: 'zero-cells', message: `Manifest "matrix" is empty (0 cells) — cannot classify assertions on an empty scope: ${manifestPath}` };
  }
  return { ok: true, manifest: json };
}

/**
 * @returns {{ ok: true, entries: Array } | { ok: false, code: string, message: string }}
 */
function loadRegistry(registryPath) {
  if (!existsSync(registryPath)) {
    return { ok: false, code: 'registry-missing', message: `Registry not found: ${registryPath}` };
  }
  let raw;
  try {
    raw = readFileSync(registryPath, 'utf8');
  } catch (err) {
    return { ok: false, code: 'registry-missing', message: `Registry could not be read: ${registryPath}: ${err.message}` };
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return { ok: false, code: 'registry-unparseable', message: `Registry is not valid JSON: ${registryPath}: ${err.message}` };
  }
  if (!json || !Array.isArray(json.entries)) {
    return { ok: false, code: 'registry-bad-shape', message: `Registry has no "entries" array: ${registryPath}` };
  }
  for (const entry of json.entries) {
    if (!entry.followUpTask) {
      return { ok: false, code: 'registry-bad-shape', message: `Registry entry missing "followUpTask" (a registry entry is a TRACKED DEAD GATE, not an exemption): ${JSON.stringify(entry)}` };
    }
  }
  return { ok: true, entries: json.entries };
}

// ── Classification (shape-driven — A1/A2) ───────────────────────────────────────

/**
 * @param {Array<object>} matrix
 * @param {Array<object>} registryEntries
 * @param {string} scope
 * @returns {Array<{ key: string, state: 'LIVE'|'DEAD-NEW'|'DEAD-KNOWN'|'STALE-ENTRY', liveCount: number, totalCells: number, registryEntry: object|null }>}
 */
function classifyAssertions(matrix, registryEntries, scope) {
  // Discover every key ever present in any cell's `assertions` object — never a hardcoded list.
  const allKeys = new Set();
  for (const cell of matrix) {
    const a = cell?.assertions;
    if (a && typeof a === 'object') {
      for (const k of Object.keys(a)) allKeys.add(k);
    }
  }

  const results = [];
  for (const key of [...allKeys].sort()) {
    let isBooleanShape = true;
    let liveCount = 0; // cells where the value is true or false (not null, not absent)

    for (const cell of matrix) {
      const a = cell?.assertions ?? {};
      const has = Object.prototype.hasOwnProperty.call(a, key);
      if (!has) continue; // absent = non-committal, same as null (A2) — contributes nothing either way
      const v = a[key];
      if (v !== null && v !== true && v !== false) {
        // Not a boolean/null value anywhere → excluded by SHAPE, not by name (A1).
        isBooleanShape = false;
        break;
      }
      if (v === true || v === false) liveCount++;
    }

    if (!isBooleanShape) continue;

    const dead = liveCount === 0;
    const registryEntry = registryEntries.find((e) => e.scope === scope && e.assertion === key) ?? null;

    let state;
    if (dead) state = registryEntry ? 'DEAD-KNOWN' : 'DEAD-NEW';
    else state = registryEntry ? 'STALE-ENTRY' : 'LIVE';

    results.push({ key, state, liveCount, totalCells: matrix.length, registryEntry });
  }
  return results;
}

// ── Report formatting ────────────────────────────────────────────────────────

function formatReport(states, scope, manifestLabel) {
  const lines = [];
  lines.push(`check-assertion-liveness — scope="${scope}" — manifest: ${manifestLabel}`);
  lines.push('');

  const byState = { LIVE: [], 'DEAD-KNOWN': [], 'DEAD-NEW': [], 'STALE-ENTRY': [] };
  for (const r of states) byState[r.state].push(r);

  for (const r of byState.LIVE) {
    lines.push(`✅ LIVE        ${r.key} — resolved true/false in ${r.liveCount}/${r.totalCells} cells`);
  }
  for (const r of byState['DEAD-KNOWN']) {
    const e = r.registryEntry;
    lines.push(`📌 DEAD-KNOWN  ${r.key} — null/absent in ALL ${r.totalCells} cells. TRACKED (Task ${e.followUpTask}) — NOT fixed here. Reason: ${e.reason ?? '(no reason recorded)'} (dead since ${e.deadSince ?? 'unknown'}, scope="${scope}")`);
  }
  for (const r of byState['DEAD-NEW']) {
    lines.push(`❌ DEAD-NEW    ${r.key} — null/absent in ALL ${r.totalCells} cells, and NO registry entry names it for scope="${scope}". This is a NEW dead gate: either fix the assertion, or add a tracked entry to scripts/assertion-liveness-registry.json with a followUpTask.`);
  }
  for (const r of byState['STALE-ENTRY']) {
    const e = r.registryEntry;
    lines.push(`❌ STALE-ENTRY ${r.key} — registry (Task ${e.followUpTask}) claims this is dead for scope="${scope}", but it resolved true/false in ${r.liveCount}/${r.totalCells} cells. Delete this registry entry: { "scope": "${scope}", "assertion": "${r.key}" }.`);
  }

  lines.push('');
  lines.push(`Results: ${byState.LIVE.length} LIVE / ${byState['DEAD-KNOWN'].length} DEAD-KNOWN / ${byState['DEAD-NEW'].length} DEAD-NEW / ${byState['STALE-ENTRY'].length} STALE-ENTRY`);
  return lines;
}

// ── Core evaluators ──────────────────────────────────────────────────────────

/** Evaluate against a manifest object + registry entries already loaded into memory. */
function evaluateInMemory({ manifest, registryEntries, scope, label }) {
  if (!manifest || !Array.isArray(manifest.matrix)) {
    const message = `Manifest has no "matrix" array: ${label}`;
    return { exitCode: 2, messages: [message], states: null };
  }
  if (manifest.matrix.length === 0) {
    const message = `Manifest "matrix" is empty (0 cells) — cannot classify assertions on an empty scope: ${label}`;
    return { exitCode: 2, messages: [message], states: null };
  }
  const states = classifyAssertions(manifest.matrix, registryEntries, scope);
  const messages = formatReport(states, scope, label);
  const hasBlocking = states.some((r) => r.state === 'DEAD-NEW' || r.state === 'STALE-ENTRY');
  return { exitCode: hasBlocking ? 1 : 0, messages, states };
}

/** Evaluate against on-disk paths — the CLI's normal entry point. */
function evaluateFromPaths({ manifestPath, registryPath, scope }) {
  const m = loadManifest(manifestPath);
  if (!m.ok) return { exitCode: 2, messages: [`❌ BAD INPUT [${m.code}]: ${m.message}`], states: null };

  const r = loadRegistry(registryPath);
  if (!r.ok) return { exitCode: 2, messages: [`❌ BAD INPUT [${r.code}]: ${r.message}`], states: null };

  return evaluateInMemory({ manifest: m.manifest, registryEntries: r.entries, scope, label: manifestPath });
}

// ── --verify-gate self-test (house pattern: check-homepage-grid.mjs:655-760) ───

function makeCell(assertions) {
  return { story: 'Fixture/Story', storyId: 'fixture-story', locale: 'en', viewport: 'mobile-320', width: 320, assertions };
}

function runVerifyGate() {
  console.log('check-assertion-liveness.mjs --verify-gate\n');
  console.log('Purpose: prove the gate is not a no-op — DEAD-NEW, STALE-ENTRY, and bad input all genuinely fail; the real manifest genuinely passes.\n');

  let overallPass = true;

  // ── Negative arm — the real, latest manifest + the real registry must pass (exit 0). ──
  console.log('── Negative arm: latest real screenshots:assert manifest, real registry ──');
  const realManifestPath = findLatestManifestPath();
  const negative = evaluateFromPaths({ manifestPath: realManifestPath, registryPath: DEFAULT_REGISTRY_PATH, scope: DEFAULT_SCOPE });
  console.log(negative.messages.join('\n'));
  if (negative.exitCode === 0) {
    console.log('✅ Negative arm PASS — exit 0 on the real manifest.\n');
  } else {
    console.log(`❌ Negative arm FAILED — expected exit 0, got ${negative.exitCode}. Gate is broken or the real manifest/registry has drifted.\n`);
    overallPass = false;
  }

  // ── Three planted failing arms ──
  const PLANTS = [
    {
      id: 'DEAD-NEW',
      describe: 'An unregistered boolean key that is null in every cell → DEAD-NEW, exit 1',
      run: () => {
        const manifest = {
          matrix: [
            makeCell({ neverTrueAssertion: null }),
            makeCell({ neverTrueAssertion: null }),
          ],
        };
        return evaluateInMemory({ manifest, registryEntries: [], scope: 'fixture-scope', label: '(in-memory DEAD-NEW plant)' });
      },
      expectExitCode: 1,
      expectReason: (out) => /DEAD-NEW\s+neverTrueAssertion/.test(out),
    },
    {
      id: 'STALE-ENTRY',
      describe: 'A registered assertion that has come back to life (true in ≥1 cell) → STALE-ENTRY, exit 1',
      run: () => {
        const manifest = {
          matrix: [
            makeCell({ resurrectedAssertion: null }),
            makeCell({ resurrectedAssertion: true }),
          ],
        };
        const registryEntries = [
          { scope: 'fixture-scope', assertion: 'resurrectedAssertion', followUpTask: 999, deadSince: '2026-01-01', reason: 'fixture' },
        ];
        return evaluateInMemory({ manifest, registryEntries, scope: 'fixture-scope', label: '(in-memory STALE-ENTRY plant)' });
      },
      expectExitCode: 1,
      expectReason: (out) => /STALE-ENTRY\s+resurrectedAssertion/.test(out),
    },
    {
      id: 'BAD-INPUT',
      describe: 'A nonexistent manifest path → exit 2, a distinct "missing-file" message',
      run: () => evaluateFromPaths({ manifestPath: join(ROOT, '.screenshots', 'task710-evidence', 'does-not-exist.json'), registryPath: DEFAULT_REGISTRY_PATH, scope: DEFAULT_SCOPE }),
      expectExitCode: 2,
      expectReason: (out) => /BAD INPUT \[missing-file\]/.test(out),
    },
  ];

  for (const plant of PLANTS) {
    console.log(`── Plant: ${plant.id} — ${plant.describe} ──`);
    const result = plant.run();
    const out = result.messages.join('\n');
    console.log(out);
    if (result.exitCode !== plant.expectExitCode) {
      console.log(`❌ ${plant.id}: expected exit ${plant.expectExitCode}, got ${result.exitCode}\n`);
      overallPass = false;
      continue;
    }
    if (!plant.expectReason(out)) {
      console.log(`❌ ${plant.id}: exit code matched but the diagnostic did not match the expected reason\n`);
      overallPass = false;
      continue;
    }
    console.log(`✅ ${plant.id}: exit ${result.exitCode} with the expected diagnostic.\n`);
  }

  return overallPass ? 0 : 1;
}

// ── Entry point ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.verifyGate) {
    process.exitCode = runVerifyGate();
    return;
  }

  const manifestPath = args.manifestPath ?? findLatestManifestPath();
  const result = evaluateFromPaths({ manifestPath, registryPath: args.registryPath, scope: args.scope });
  console.log(result.messages.join('\n'));
  process.exitCode = result.exitCode;
}

main();
