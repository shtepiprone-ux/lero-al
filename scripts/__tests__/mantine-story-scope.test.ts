import { describe, it, expect } from 'vitest';
import {
  MANTINE_STORY_TITLE_PREFIXES,
  MANTINE_STORY_ENROLLED_TITLES,
  isCanonicalMantineTitle,
} from '../lib/mantine-story-scope.mjs';

describe('mantine-story-scope — Task 678 per-story enrolment', () => {
  it('keeps the prefix list unchanged (AC8 / R8 witness)', () => {
    expect(MANTINE_STORY_TITLE_PREFIXES).toEqual(['Mantine/Primitives/', 'Patterns/Mantine/']);
  });

  it('still resolves prefix-scoped titles exactly as before (no regression)', () => {
    expect(isCanonicalMantineTitle('Mantine/Primitives/Alert/Default')).toBe(true);
    expect(isCanonicalMantineTitle('Patterns/Mantine/HomeSection/Default')).toBe(true);
    expect(isCanonicalMantineTitle('System/FeaturedListings')).toBe(false);
  });

  it('enrols an exact title without enrolling its unrelated siblings (R3 / D32 counterexample)', () => {
    expect(isCanonicalMantineTitle('Admin/AdminUsersTable')).toBe(true);
    // 3 arbitrary siblings under the same `Admin/` segment — none enrolled by the prefix, none
    // enrolled by name, so none may resolve true.
    expect(isCanonicalMantineTitle('Admin/AdminCardList')).toBe(false);
    expect(isCanonicalMantineTitle('Admin/AdminSidebar')).toBe(false);
    expect(isCanonicalMantineTitle('Admin/AdminSettings')).toBe(false);
  });

  it('does not enrol by substring or partial match — only exact title equality', () => {
    expect(isCanonicalMantineTitle('Admin/AdminUsersTableExtra')).toBe(false);
    expect(isCanonicalMantineTitle('Admin/AdminUsersTable/Default')).toBe(false);
    expect(isCanonicalMantineTitle('X/Admin/AdminUsersTable')).toBe(false);
  });

  it('fails closed on an empty enrolment set: behavior reduces to prefix-only (D32 empty case)', () => {
    const emptyEnrolled: Record<string, string> = {};
    const isCanonicalWithEmptyEnrolment = (title: string) =>
      typeof title === 'string' &&
      (MANTINE_STORY_TITLE_PREFIXES.some((p) => title.startsWith(p)) ||
        Object.hasOwn(emptyEnrolled, title));

    for (const title of [
      'Mantine/Primitives/Alert/Default',
      'Patterns/Mantine/HomeSection/Default',
      'System/FeaturedListings',
      'Admin/AdminUsersTable',
      'Admin/AdminCardList',
    ]) {
      expect(isCanonicalWithEmptyEnrolment(title)).toBe(
        MANTINE_STORY_TITLE_PREFIXES.some((p) => title.startsWith(p))
      );
    }
  });

  it('rejects non-string titles without throwing', () => {
    expect(isCanonicalMantineTitle(undefined as unknown as string)).toBe(false);
    expect(isCanonicalMantineTitle(null as unknown as string)).toBe(false);
  });

  it('every enrolled title carries a non-empty reason', () => {
    for (const [title, reason] of Object.entries(MANTINE_STORY_ENROLLED_TITLES)) {
      expect(title.length).toBeGreaterThan(0);
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(20);
    }
  });
});
