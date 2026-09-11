#!/usr/bin/env node
/**
 * check-media-enrolment.mjs — one rule for the media directory (Task 813; decision §5.1 (C), 2026-09-11).
 *
 * Owner decision §5.1 (C) moved `AppImage.tsx` (the project's canonical non-Mantine `<img>` render
 * site) and its co-located siblings out of `src/components/ui/` — which two gates classify as
 * `tier2-legacy-primitive` by path prefix alone (`scripts/check-rendered-scope.mjs`,
 * `scripts/check-surface-census.mjs`, both `TIER2_PREFIX = 'src/components/ui/'`) — to a new
 * directory, `src/design-system/media/`, rather than into `src/design-system/mantine/patterns/`
 * (the project's canonical non-Mantine image primitive is not a Mantine pattern). The decision's own
 * words: the new directory "does not ship ungoverned" — every `.tsx` there must be a
 * `scripts/mantine-migration-scope.json` entry, checked against the live directory listing, never a
 * hard-coded name list, so the rule keeps applying to file 2 without anyone remembering to update it.
 *
 * Built to the exact shape `scripts/check-pattern-enrolment.mjs` (Task 820) already proved for the
 * sibling `src/design-system/mantine/patterns/` directory — a pure `evaluateMediaEnrolment`
 * classifier, a pure `evaluateGateExitCode`, a printed scope boundary, and a `--verify-gate` self-test
 * whose arms include a ghost-entry arm and an exit-code-wiring arm — WITHOUT importing from or
 * modifying that file (R12/1a: two directories, two independent checks, never a shared arm bolted
 * onto an existing script).
 *
 * Story coverage is NOT this check's job. `check:story-coverage` already fails for any enrolled
 * component with no canonical Mantine story importing its own path; this check asserts enrolment
 * only, and says so on every run.
 *
 * Scope, stated so the narrowing is visible, never implicit (every run prints this):
 *   - Scanned: every top-level `*.tsx` file directly under `src/design-system/media/`.
 *   - NOT scanned: `*.module.css`, `*.ts` (non-`.tsx` siblings such as `appImageConfig.ts` and
 *     `useAdaptiveImageConfig.ts` — hooks/config, not components), any `__tests__/` subdirectory, and
 *     any `.tsx` this exact directory does not itself contain — a file added anywhere else is
 *     invisible to this check by construction (`check:rendered-scope`'s/`check:story-coverage`'s
 *     concern, not this one's).
 *   - Cannot see: a file this script cannot read (permissions/symlink) — skipped, never silently
 *     treated as compliant. Canonical-Story coverage is `check:story-coverage`'s job, not this
 *     check's — a `.tsx` here can be enrolled (pass this gate) and still fail that one.
 *
 * The directory is authoritative in both directions:
 *   - a `.tsx` in the directory absent from the manifest -> FAIL, "unenrolled".
 *   - a manifest entry under this directory whose file no longer exists -> FAIL, "ghost entry".
 *
 * Usage:
 *   node scripts/check-media-enrolment.mjs          # gate check (CI default)
 *   npm run check:media-enrolment
 *   npm run check:media-enrolment:verify             # CI-safe self-test (--verify-gate)
 *
 * Docs: docs/design-system-pattern-ownership.md, docs/storybook-governance.md §15.9, docs/golden-rules.md GR-1.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR_ABS = join(ROOT, 'src', 'design-system', 'media');
const MEDIA_DIR_REL = 'src/design-system/media';
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');

/**
 * Every top-level `.tsx` file directly under the media directory, repo-relative (`/`-separated),
 * sorted. The directory listing IS the source of truth — never derived from the manifest, or a
 * hard-coded name list would silently stop enforcing the rule the moment file 2 is added.
 */
export function listMediaFiles(dirAbs = MEDIA_DIR_ABS, dirRel = MEDIA_DIR_REL) {
  if (!existsSync(dirAbs)) return [];
  return readdirSync(dirAbs)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => `${dirRel}/${f}`)
    .sort();
}

/**
 * Pure: the parity decision. `mediaFiles` — every `.tsx` under the directory (array of repo-relative
 * paths). `manifestEntries` — every `scripts/mantine-migration-scope.json` entry (array). `dirPrefix`
 * — the directory's repo-relative prefix with a trailing slash. No I/O — the real run and the
 * self-test's synthetic arms both call this exact function.
 *
 * @returns {{ unenrolled: string[], ghostManifestEntries: string[] }}
 */
export function evaluateMediaEnrolment(mediaFiles, manifestEntries, dirPrefix) {
  const mediaSet = new Set(mediaFiles);
  const manifestSet = new Set(manifestEntries);
  const unenrolled = mediaFiles.filter((p) => !manifestSet.has(p)).sort();
  const ghostManifestEntries = manifestEntries
    .filter((p) => p.startsWith(dirPrefix) && p.endsWith('.tsx') && !mediaSet.has(p))
    .sort();
  return { unenrolled, ghostManifestEntries };
}

/**
 * Pure: the exit-code decision — the EXACT function the real run calls, and the self-test's
 * exit-wiring arm exercises with synthetic counts (same shape as `check-pattern-enrolment.mjs`'s
 * `evaluateGateExitCode`, Task 820, itself following Task 818 R15's precedent).
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
  console.log('check:media-enrolment — one rule for the media directory (Task 813, decision §5.1 (C))');
  console.log(`    Scanned: every top-level *.tsx directly under ${MEDIA_DIR_REL}/`);
  console.log('    NOT scanned (stated, never implicit): *.module.css, non-.tsx siblings (hooks/config, e.g.');
  console.log('    appImageConfig.ts, useAdaptiveImageConfig.ts), any __tests__/ subdirectory, and any .tsx this');
  console.log('    directory does not itself contain — a file added anywhere else is invisible to this check by');
  console.log('    construction.');
  console.log('    Cannot see: a file this script cannot read (permissions/symlink) — skipped, never silently');
  console.log('    treated as compliant. Canonical-Story coverage is check:story-coverage\'s job, not this');
  console.log('    check\'s — enrolment here does not imply a Story exists.');
  console.log('');
}

// ── Self-test (--verify-gate) ───────────────────────────────────────────────
//
// CI-safe: no server, no browser, no network, no write to any tracked file. Arms 1-4 are synthetic
// in-memory plants through the same pure functions the real run uses. Arm 5 re-runs the real
// directory-vs-manifest comparison (read-only) to prove the unplanted, final tree is clean.
function runSelfTest() {
  const ARM_COUNT = 5;
  console.log(`check:media-enrolment gate self-test (--verify-gate, Task 813) — running ${ARM_COUNT} arms\n`);
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
    const mediaFiles = ['src/fake/verify/media/NewMedia.tsx'];
    const manifestEntries = [];
    const { unenrolled, ghostManifestEntries } = evaluateMediaEnrolment(mediaFiles, manifestEntries, 'src/fake/verify/media/');
    record(
      unenrolled.length === 1 && unenrolled[0] === 'src/fake/verify/media/NewMedia.tsx' && ghostManifestEntries.length === 0,
      'Arm 1 — .tsx in the directory, absent from the manifest -> reported unenrolled'
    );
  }

  // Arm 2 — a manifest entry under the directory whose file no longer exists is reported a ghost entry.
  {
    const mediaFiles = [];
    const manifestEntries = ['src/fake/verify/media/Deleted.tsx'];
    const { unenrolled, ghostManifestEntries } = evaluateMediaEnrolment(mediaFiles, manifestEntries, 'src/fake/verify/media/');
    record(
      ghostManifestEntries.length === 1 && ghostManifestEntries[0] === 'src/fake/verify/media/Deleted.tsx' && unenrolled.length === 0,
      'Arm 2 — manifest entry under the directory, file no longer exists -> reported a ghost entry'
    );
  }

  // Arm 3 — a directory and manifest that agree exactly produce zero findings.
  {
    const mediaFiles = ['src/fake/verify/media/A.tsx', 'src/fake/verify/media/B.tsx'];
    const manifestEntries = ['src/fake/verify/media/A.tsx', 'src/fake/verify/media/B.tsx', 'src/some/other/Enrolled.tsx'];
    const { unenrolled, ghostManifestEntries } = evaluateMediaEnrolment(mediaFiles, manifestEntries, 'src/fake/verify/media/');
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
    const mediaFiles = listMediaFiles();
    const loaded = loadManifest(MANIFEST_PATH);
    if (loaded.error) {
      record(false, `Arm 5 — real directory vs. real manifest -> clean (manifest load failed: ${loaded.error})`);
    } else {
      const { unenrolled, ghostManifestEntries } = evaluateMediaEnrolment(mediaFiles, loaded.entries, `${MEDIA_DIR_REL}/`);
      record(
        unenrolled.length === 0 && ghostManifestEntries.length === 0,
        `Arm 5 — real directory (${mediaFiles.length} files) vs. real manifest -> clean (${unenrolled.length} unenrolled, ${ghostManifestEntries.length} ghost)`
      );
    }
  }

  console.log(`\nArms run: ${ARM_COUNT}`);
  console.log(`Self-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAIL  check:media-enrolment:verify — the gate self-test found a broken arm.');
    process.exit(1);
  }
  console.log(`PASS  check:media-enrolment:verify — all ${ARM_COUNT} arms behave correctly.`);
  process.exit(0);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain && VERIFY_GATE) {
  runSelfTest();
}

// ── Real run ─────────────────────────────────────────────────────────────────

function main() {
  printScope();

  const mediaFiles = listMediaFiles();
  const loaded = loadManifest(MANIFEST_PATH);
  if (loaded.error) {
    console.error(loaded.error);
    process.exit(1);
  }

  console.log(`    Media files found: ${mediaFiles.length}`);
  console.log(`    Manifest entries (total, all surfaces): ${loaded.entries.length}`);
  console.log('');

  const { unenrolled, ghostManifestEntries } = evaluateMediaEnrolment(mediaFiles, loaded.entries, `${MEDIA_DIR_REL}/`);

  if (unenrolled.length > 0) {
    console.error(`FAIL  ${unenrolled.length} media-directory file(s) not enrolled in ${relative(ROOT, MANIFEST_PATH)}:`);
    for (const p of unenrolled) console.error(`    ${p}`);
    console.error('  Fix: add the path to scripts/mantine-migration-scope.json and give it a canonical Mantine Story.');
  }

  if (ghostManifestEntries.length > 0) {
    console.error(`FAIL  ${ghostManifestEntries.length} manifest entr(ies) under ${MEDIA_DIR_REL}/ point at a file that no longer exists:`);
    for (const p of ghostManifestEntries) console.error(`    ${p}`);
    console.error('  Fix: remove the stale entry from scripts/mantine-migration-scope.json.');
  }

  const exitCode = evaluateGateExitCode({ unenrolledCount: unenrolled.length, ghostCount: ghostManifestEntries.length });

  if (exitCode !== 0) {
    console.error('');
    console.error('Docs: docs/design-system-pattern-ownership.md, docs/golden-rules.md GR-1.');
    process.exit(exitCode);
  }

  console.log(`PASS  check:media-enrolment — every .tsx under ${MEDIA_DIR_REL}/ is enrolled, and every manifest entry under it exists. Canonical-Story coverage is check:story-coverage's job, not this check's.`);
  process.exit(exitCode);
}

if (isMain && !VERIFY_GATE) {
  main();
}
