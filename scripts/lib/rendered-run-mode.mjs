/**
 * rendered-run-mode.mjs — pure run-mode / skipped-phase description for check-stories-rendered.mjs
 * (Task 742).
 *
 * `check-stories-rendered.mjs` supports three run modes via CLI flags: full (no flag), `--fast`,
 * and `--mantine-only`. Each mode runs a different subset of Phase 0 (Mantine/Primitives gate,
 * always runs, incl. under `--fast`), Phase 1 (`ASSERT_STORIES`, includes the 4 `.listing-card`
 * anchor rows), and Phase 2 (geometry-only sweep). Task Q0R made the console *start* banner
 * truthful about this; Task 742 makes every artifact that outlives the terminal — `manifest.json`
 * and the harness-generated inventory — truthful too, by deriving the mode/skip description from
 * this one pure function instead of independent per-callsite ternaries that only branched on
 * `FAST_MODE` and silently fell through to the "full" wording under `--mantine-only`.
 *
 * Pure by construction: takes flags/counts as arguments, reads no module-level state, so all three
 * modes are unit-testable in a single process (R5).
 */

/** @type {Record<string, string>} */
export const PHASE_LABELS = {
  'phase1-assert-stories':
    'Phase 1 (ASSERT_STORIES — including the 4 `.listing-card` anchor rows: ' +
    'system-featuredlistings--default, system-latestlistings--default, ' +
    'system-similarlistings--default, patterns-mantine-homepagelistinggrids--default)',
  'phase2-geometry-only': 'Phase 2 (geometry-only sweep)',
};

/**
 * @param {{
 *   fastMode: boolean,
 *   mantineOnly: boolean,
 *   counts?: { storiesRendered?: number, cellsRendered?: number },
 * }} input
 * @returns {{
 *   runMode: 'full' | 'fast' | 'mantine-only',
 *   phasesSkipped: string[],
 *   scopeLine: string,
 *   noteLine: string,
 * }}
 */
export function describeRunMode({ fastMode, mantineOnly, counts = {} }) {
  const storiesRendered = counts.storiesRendered ?? 0;
  const cellsRendered = counts.cellsRendered ?? 0;

  /** @type {'full' | 'fast' | 'mantine-only'} */
  let runMode;
  /** @type {string[]} */
  const phasesSkipped = [];

  // --mantine-only takes precedence regardless of --fast, matching the actual gate precedence in
  // check-stories-rendered.mjs: the Phase 1 loop reads `MANTINE_ONLY ? [] : ASSERT_STORIES`
  // unconditionally on FAST_MODE, and Phase 2's guard is `!FAST_MODE && !MANTINE_ONLY`.
  if (mantineOnly) {
    runMode = 'mantine-only';
    phasesSkipped.push('phase1-assert-stories', 'phase2-geometry-only');
  } else if (fastMode) {
    runMode = 'fast';
    phasesSkipped.push('phase2-geometry-only');
  } else {
    runMode = 'full';
  }

  const skippedLabels = phasesSkipped.map((key) => PHASE_LABELS[key]);

  const scopeLine = phasesSkipped.length > 0
    ? `${runMode} (rendered scope only — ${skippedLabels.join('; ')} NOT run; ${storiesRendered} stories, ${cellsRendered} cells)`
    : `Global enumeration (${storiesRendered} stories, ${cellsRendered} cells)`;

  const noteLine = phasesSkipped.length > 0
    ? `${runMode} run. NOT RUN: ${skippedLabels.join('; ')}.`
    : 'Full global-enumeration run.';

  return { runMode, phasesSkipped, scopeLine, noteLine };
}
