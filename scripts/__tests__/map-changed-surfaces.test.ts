// @vitest-environment node
/**
 * The changed-file limit of check:surface-census:changed counts census candidates only (governance reset 2026-11-06:
 * a PR changing 300+ rules, docs and tests failed the census with no production surface involved).
 *
 * Run: npx vitest run scripts/__tests__/map-changed-surfaces.test.ts
 */
import { describe, expect, it } from 'vitest';
import { changedFileLimit, classifyChangedFile } from '../map-changed-surfaces.mjs';

describe('classifyChangedFile', () => {
  it('keeps production .ts/.tsx under src/ and excludes everything the census cannot map', () => {
    expect(classifyChangedFile({ status: 'M', path: 'src/modules/listings/components/ListingCard.tsx' })).toEqual({ excluded: false });
    expect(classifyChangedFile({ status: 'M', path: '.claude/rules/flow.md' }).reason).toBe('outside-src');
    expect(classifyChangedFile({ status: 'M', path: 'src/styles/tokens.css' }).reason).toBe('not-ts-tsx');
    expect(classifyChangedFile({ status: 'A', path: 'src/a/Card.test.tsx' }).reason).toBe('story-or-test-file');
    expect(classifyChangedFile({ status: 'M', path: 'src/a/__tests__/x.ts' }).reason).toBe('non-production-directory');
    expect(classifyChangedFile({ status: 'D', path: 'src/a/Old.tsx' }).reason).toBe('deleted');
  });
});

describe('changedFileLimit', () => {
  it('ignores how many non-candidate files the PR changes', () => {
    expect(changedFileLimit(['src/a.tsx'], 300, 5000)).toBeNull();
    expect(changedFileLimit([], 0, 900)).toBeNull();
  });

  it('fails closed when the candidates alone exceed the limit, naming both counts', () => {
    const r = changedFileLimit(['src/a.tsx', 'src/b.tsx'], 1, 40);
    expect(r).toMatchObject({ failClosed: true, reason: 'changed-file-limit-exceeded', changedCount: 2, limit: 1 });
    expect(r?.detail).toBe('2 changed production file(s) exceeds the limit of 1 (40 changed in total)');
  });

  it('a limit equal to the candidate count is not exceeded', () => {
    expect(changedFileLimit(['src/a.tsx', 'src/b.tsx'], 2)).toBeNull();
  });
});
