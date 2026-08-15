// @vitest-environment node
/**
 * Unit tests for scripts/lib/rendered-run-mode.mjs (Task 742, R5/AC4).
 *
 * describeRunMode() is the single pure source for what check-stories-rendered.mjs's manifest.json
 * (R1), harness-generated inventory header (R2/R3) and console NOT RUN line (R4) all say about run
 * mode and skipped phases. It takes fastMode/mantineOnly/counts as arguments and reads no
 * module-level state, so all three modes plus the zero-cell edge case are assertable here in one
 * process without a real rendered run.
 *
 * Run: npx vitest run scripts/__tests__/rendered-run-mode.test.ts
 */

import { describe, it, expect } from 'vitest';
import { describeRunMode, PHASE_LABELS } from '../lib/rendered-run-mode.mjs';

describe('describeRunMode — Task 742', () => {
  it('full mode: no phases skipped, wording matches the pre-742 "full" arm byte-for-byte', () => {
    const result = describeRunMode({
      fastMode: false,
      mantineOnly: false,
      counts: { storiesRendered: 317, cellsRendered: 1204 },
    });
    expect(result.runMode).toBe('full');
    expect(result.phasesSkipped).toEqual([]);
    expect(result.scopeLine).toBe('Global enumeration (317 stories, 1204 cells)');
    expect(result.noteLine).toBe('Full global-enumeration run.');
  });

  it('fast mode: Phase 2 skipped, Phase 1 NOT listed as skipped (A1)', () => {
    const result = describeRunMode({
      fastMode: true,
      mantineOnly: false,
      counts: { storiesRendered: 200, cellsRendered: 800 },
    });
    expect(result.runMode).toBe('fast');
    expect(result.phasesSkipped).toEqual(['phase2-geometry-only']);
    expect(result.phasesSkipped).not.toContain('phase1-assert-stories');
    expect(result.noteLine).toContain('NOT RUN');
    expect(result.noteLine).toContain('Phase 2');
    expect(result.noteLine).not.toContain('Phase 1');
  });

  it('mantine-only mode: both Phase 1 and Phase 2 skipped, and the anchor rows are named', () => {
    const result = describeRunMode({
      fastMode: false,
      mantineOnly: true,
      counts: { storiesRendered: 21, cellsRendered: 1204 },
    });
    expect(result.runMode).toBe('mantine-only');
    expect(result.phasesSkipped).toEqual(['phase1-assert-stories', 'phase2-geometry-only']);
    expect(result.noteLine).toContain('Phase 1');
    expect(result.noteLine).toContain('Phase 2');
    // AC3 — the console NOT RUN line derived from noteLine must name all 4 .listing-card anchors.
    expect(result.noteLine).toContain('system-featuredlistings--default');
    expect(result.noteLine).toContain('system-latestlistings--default');
    expect(result.noteLine).toContain('system-similarlistings--default');
    expect(result.noteLine).toContain('patterns-mantine-homepagelistinggrids--default');
  });

  it('mantine-only header contains neither "Global enumeration" nor "Full global-enumeration run." (AC2)', () => {
    const result = describeRunMode({
      fastMode: false,
      mantineOnly: true,
      counts: { storiesRendered: 21, cellsRendered: 1204 },
    });
    expect(result.scopeLine).not.toContain('Global enumeration');
    expect(result.noteLine).not.toBe('Full global-enumeration run.');
    expect(result.noteLine).not.toContain('Full global-enumeration run.');
  });

  it('mantine-only takes precedence when --fast is also set (matches the real gate precedence)', () => {
    const result = describeRunMode({
      fastMode: true,
      mantineOnly: true,
      counts: { storiesRendered: 21, cellsRendered: 1204 },
    });
    expect(result.runMode).toBe('mantine-only');
    expect(result.phasesSkipped).toEqual(['phase1-assert-stories', 'phase2-geometry-only']);
  });

  it('zero-cell case: no NaN, no division, well-formed strings for every mode (R3/AC4)', () => {
    for (const [fastMode, mantineOnly] of [[false, false], [true, false], [false, true]] as const) {
      const result = describeRunMode({ fastMode, mantineOnly, counts: { storiesRendered: 0, cellsRendered: 0 } });
      expect(result.scopeLine).not.toContain('NaN');
      expect(result.noteLine).not.toContain('NaN');
      expect(result.scopeLine).toContain('0 stories, 0 cells');
    }
  });

  it('counts default to 0 when omitted entirely — no throw, no NaN', () => {
    const result = describeRunMode({ fastMode: false, mantineOnly: false });
    expect(result.scopeLine).toBe('Global enumeration (0 stories, 0 cells)');
  });

  it('is a pure function — repeated calls with identical input produce identical output', () => {
    const input = { fastMode: false, mantineOnly: true, counts: { storiesRendered: 21, cellsRendered: 1204 } };
    const a = describeRunMode(input);
    const b = describeRunMode(input);
    expect(a).toEqual(b);
  });

  it('PHASE_LABELS names Phase 1 and Phase 2 concretely, not as "some phases" (R2/R4)', () => {
    expect(PHASE_LABELS['phase1-assert-stories']).toMatch(/ASSERT_STORIES/);
    expect(PHASE_LABELS['phase1-assert-stories']).toContain('.listing-card');
    expect(PHASE_LABELS['phase2-geometry-only']).toMatch(/geometry-only/);
  });
});
