#!/usr/bin/env node
/**
 * check-pattern-enrolment.mjs — one rule for the pattern directory (Task 820; Decision 5, 2026-09-11).
 *
 * Decision 5 in `docs/design-system-pattern-ownership.md` §4: "Every current and future `.tsx` file
 * under `src/design-system/mantine/patterns/` is governed as an enrolled design-system pattern." This
 * is the CI-blocking check that makes that rule self-enforcing: it fails when a `.tsx` file in the
 * directory is not a `scripts/mantine-migration-scope.json` entry, and — the directory is the source of
 * truth in BOTH directions — it also fails when a manifest entry points at a pattern path under that
 * directory that no longer exists on disk. Neither `audit-design-system-patterns.mjs` (Task 816, an
 * unwired audit that verifies the now-retired tier-3 allowlist's own premise) nor
 * `check-story-coverage.mjs`/`check-rendered-scope.mjs` (which only ever inspect components ALREADY in
 * the manifest) asks this question: is every file in the directory enrolled at all.
 *
 * Deliberately a NEW, small script — not an arm inside `audit-design-system-patterns.mjs`. R8 (Task 820)
 * forbids modifying that file, and the two ask different questions: "does the (now-empty) tier-3
 * allowlist's premise still hold" vs "is every pattern-directory file enrolled". A blocking CI gate
 * should not share an exit code with an audit the owner deliberately left unwired to CI.
 *
 * Scope, stated so the narrowing is visible, never implicit (every run prints this):
 *   - Scanned: every top-level `*.tsx` file directly under `src/design-system/mantine/patterns/`.
 *   - NOT scanned: `index.ts` (the barrel — not `.tsx`), any `__tests__/` subdirectory, `*.module.css`,
 *     and any `.tsx` the directory does not itself contain (a pattern added anywhere else is invisible
 *     to this check by construction — enrolment elsewhere is `check:rendered-scope`'s/`check:story-
 *     coverage`'s concern, not this one's).
 *   - Cannot see: a pattern file this script cannot read (permissions/symlink) — such a file is skipped,
 *     never silently treated as compliant.
 *
 * The directory is authoritative in both directions:
 *   - a `.tsx` in the directory absent from the manifest -> FAIL, "unenrolled".
 *   - a manifest entry under this directory whose file no longer exists -> FAIL, "ghost entry" (the
 *     directory says it is gone; the manifest still claims it).
 *
 * Usage:
 *   node scripts/check-pattern-enrolment.mjs          # gate check (CI default)
 *   npm run check:pattern-enrolment
 *   npm run check:pattern-enrolment:verify             # CI-safe self-test (--verify-gate)
 *
 * Docs: docs/design-system-pattern-ownership.md §4 (decision 5), docs/golden-rules.md GR-1.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PATTERNS_DIR_ABS = join(ROOT, 'src', 'design-system', 'mantine', 'patterns');
const PATTERNS_DIR_REL = 'src/design-system/mantine/patterns';
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');

/**
 * Every top-level `.tsx` file directly under the patterns directory, repo-relative (`/`-separated),
 * sorted. The directory listing IS the source of truth for "every pattern" — this never derives its
 * file list from the manifest, or a hard-coded name list would silently stop enforcing the rule the
 * moment file 34 is added (§10.3 of the kickoff).
 */
export function listPatternFiles(dirAbs = PATTERNS_DIR_ABS, dirRel = PATTERNS_DIR_REL) {
  if (!existsSync(dirAbs)) return [];
  return readdirSync(dirAbs)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => `${dirRel}/${f}`)
    .sort();
}

/**
 * Pure: the parity decision. `patternFiles` — every `.tsx` under the directory (array of repo-relative
 * paths). `manifestEntries` — every `scripts/mantine-migration-scope.json` entry (array). `dirPrefix` —
 * the directory's repo-relative prefix with a trailing slash. No I/O — the real run and the self-test's
 * synthetic arms both call this exact function.
 *
 * @returns {{ unenrolled: string[], ghostManifestEntries: string[] }}
 */
export function evaluatePatternEnrolment(patternFiles, manifestEntries, dirPrefix) {
  const patternSet = new Set(patternFiles);
  const manifestSet = new Set(manifestEntries);
  const unenrolled = patternFiles.filter((p) => !manifestSet.has(p)).sort();
  const ghostManifestEntries = manifestEntries
    .filter((p) => p.startsWith(dirPrefix) && p.endsWith('.tsx') && !patternSet.has(p))
    .sort();
  return { unenrolled, ghostManifestEntries };
}

/**
 * Pure: the exit-code decision — the EXACT function the real run calls, and the self-test's
 * exit-wiring arm exercises with synthetic counts (same shape as `check-rendered-scope.mjs`'s
 * `evaluateGateExitCode`, Task 818 R15).
 */
export function evaluateGateExitCode({ unenrolledCount, ghostCount }) {
  return unenrolledCount > 0 || ghostCount > 0 ? 1 : 0;
}

function loadManifest(path) {
  if (!existsSync(path)) {
    return { error: `FAIL  Manifest missing: ${relative(ROOT, path)}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return { error: `FAIL  Cannot read/parse ${relative(ROOT, path)}: ${err.message}` };
  }
  if (!Array.isArray(parsed)) {
    return { error: `FAIL  ${relative(ROOT, path)} must be a JSON array of component source paths.` };
  }
  return { entries: parsed };
}

function printScope() {
  console.log('check:pattern-enrolment — one rule for the pattern directory (Task 820, Decision 5)');
  console.log(`    Scanned: every top-level *.tsx directly under ${PATTERNS_DIR_REL}/`);
  console.log('    NOT scanned (stated, never implicit): index.ts (the barrel, not .tsx), any __tests__/');
  console.log('    subdirectory, *.module.css, and any .tsx this directory does not itself contain — a pattern');
  console.log('    added anywhere else is invisible to this check by construction.');
  console.log('    Cannot see: a pattern file this script cannot read (permissions/symlink) — skipped, never');
  console.log('    silently treated as compliant.');
  console.log('');
}

// ── Self-test (--verify-gate) ───────────────────────────────────────────────
//
// CI-safe: no server, no browser, no network, no write to any tracked file. Arms 1-4 are synthetic
// in-memory plants through the same pure functions the real run uses. Arm 5 re-runs the real
// directory-vs-manifest comparison (read-only) to prove the unplanted, final tree is clean.
function runSelfTest() {
  const ARM_COUNT = 5;
  console.log(`check:pattern-enrolment gate self-test (--verify-gate, Task 820) — running ${ARM_COUNT} arms\n`);
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

  // Arm 1 — a .tsx present in the directory but absent from the manifest is reported unenrolled.
  {
    const patternFiles = ['src/fake/verify/patterns/NewPattern.tsx'];
    const manifestEntries = [];
    const { unenrolled, ghostManifestEntries } = evaluatePatternEnrolment(patternFiles, manifestEntries, 'src/fake/verify/patterns/');
    record(
      unenrolled.length === 1 && unenrolled[0] === 'src/fake/verify/patterns/NewPattern.tsx' && ghostManifestEntries.length === 0,
      'Arm 1 — .tsx in the directory, absent from the manifest -> reported unenrolled'
    );
  }

  // Arm 2 — a manifest entry under the directory whose file no longer exists is reported a ghost entry.
  {
    const patternFiles = [];
    const manifestEntries = ['src/fake/verify/patterns/Deleted.tsx'];
    const { unenrolled, ghostManifestEntries } = evaluatePatternEnrolment(patternFiles, manifestEntries, 'src/fake/verify/patterns/');
    record(
      ghostManifestEntries.length === 1 && ghostManifestEntries[0] === 'src/fake/verify/patterns/Deleted.tsx' && unenrolled.length === 0,
      'Arm 2 — manifest entry under the directory, file no longer exists -> reported a ghost entry'
    );
  }

  // Arm 3 — a directory and manifest that agree exactly produce zero findings.
  {
    const patternFiles = ['src/fake/verify/patterns/A.tsx', 'src/fake/verify/patterns/B.tsx'];
    const manifestEntries = ['src/fake/verify/patterns/A.tsx', 'src/fake/verify/patterns/B.tsx', 'src/some/other/Enrolled.tsx'];
    const { unenrolled, ghostManifestEntries } = evaluatePatternEnrolment(patternFiles, manifestEntries, 'src/fake/verify/patterns/');
    record(
      unenrolled.length === 0 && ghostManifestEntries.length === 0,
      'Arm 3 — directory and manifest agree exactly (manifest entries outside the directory ignored) -> zero findings'
    );
  }

  // Arm 4 — the exit-code decision itself is exercised, not only classification: a synthetic finding
  // must drive evaluateGateExitCode to 1, and an all-clear synthetic state must drive it to 0.
  {
    const dirty = evaluateGateExitCode({ unenrolledCount: 1, ghostCount: 0 });
    const dirtyGhost = evaluateGateExitCode({ unenrolledCount: 0, ghostCount: 1 });
    const clean = evaluateGateExitCode({ unenrolledCount: 0, ghostCount: 0 });
    record(
      dirty === 1 && dirtyGhost === 1 && clean === 0,
      'Arm 4 — exit-code wiring: an unenrolled or a ghost finding drives evaluateGateExitCode to 1, the clean state to 0'
    );
  }

  // Arm 5 — the real, unplanted tree measured against the real committed manifest is clean.
  {
    const patternFiles = listPatternFiles();
    const loaded = loadManifest(MANIFEST_PATH);
    if (loaded.error) {
      record(false, `Arm 5 — real directory vs. real manifest -> clean (manifest load failed: ${loaded.error})`);
    } else {
      const { unenrolled, ghostManifestEntries } = evaluatePatternEnrolment(patternFiles, loaded.entries, `${PATTERNS_DIR_REL}/`);
      record(
        unenrolled.length === 0 && ghostManifestEntries.length === 0,
        `Arm 5 — real directory (${patternFiles.length} files) vs. real manifest -> clean (${unenrolled.length} unenrolled, ${ghostManifestEntries.length} ghost)`
      );
    }
  }

  console.log(`\nArms run: ${ARM_COUNT}`);
  console.log(`Self-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAIL  check:pattern-enrolment:verify — the gate self-test found a broken arm.');
    process.exit(1);
  }
  console.log(`PASS  check:pattern-enrolment:verify — all ${ARM_COUNT} arms behave correctly.`);
  process.exit(0);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain && VERIFY_GATE) {
  runSelfTest();
}

// ── Real run ─────────────────────────────────────────────────────────────────

function main() {
  printScope();

  const patternFiles = listPatternFiles();
  const loaded = loadManifest(MANIFEST_PATH);
  if (loaded.error) {
    console.error(loaded.error);
    process.exit(1);
  }

  console.log(`    Pattern files found: ${patternFiles.length}`);
  console.log(`    Manifest entries (total, all surfaces): ${loaded.entries.length}`);
  console.log('');

  const { unenrolled, ghostManifestEntries } = evaluatePatternEnrolment(patternFiles, loaded.entries, `${PATTERNS_DIR_REL}/`);

  if (unenrolled.length > 0) {
    console.error(`FAIL  ${unenrolled.length} pattern-directory file(s) not enrolled in ${relative(ROOT, MANIFEST_PATH)}:`);
    for (const p of unenrolled) console.error(`    ${p}`);
    console.error('  Fix: add the path to scripts/mantine-migration-scope.json and give it a canonical Mantine Story.');
  }

  if (ghostManifestEntries.length > 0) {
    console.error(`FAIL  ${ghostManifestEntries.length} manifest entr(ies) under ${PATTERNS_DIR_REL}/ point at a file that no longer exists:`);
    for (const p of ghostManifestEntries) console.error(`    ${p}`);
    console.error('  Fix: remove the stale entry from scripts/mantine-migration-scope.json.');
  }

  const exitCode = evaluateGateExitCode({ unenrolledCount: unenrolled.length, ghostCount: ghostManifestEntries.length });

  if (exitCode !== 0) {
    console.error('');
    console.error('Docs: docs/design-system-pattern-ownership.md §4 (decision 5), docs/golden-rules.md GR-1.');
    process.exit(exitCode);
  }

  console.log(`PASS  check:pattern-enrolment — every .tsx under ${PATTERNS_DIR_REL}/ is enrolled, and every manifest entry under it exists.`);
  process.exit(exitCode);
}

if (isMain && !VERIFY_GATE) {
  main();
}
