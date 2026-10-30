import { describe, it, expect, afterEach } from 'vitest';
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

  // Task 790 (rest): the production enrolment map is empty since Task 896, so the exact-title
  // mechanism is proven against a fixture entry added to the real exported map and always removed.
  // The fixture title is not a production Story title.
  const FIXTURE_TITLE = 'Fixture/EnrolledOnly';
  afterEach(() => {
    delete (MANTINE_STORY_ENROLLED_TITLES as Record<string, string>)[FIXTURE_TITLE];
  });

  it('enrols an exact title without enrolling its unrelated siblings (R3 / D32 counterexample)', () => {
    expect(isCanonicalMantineTitle(FIXTURE_TITLE)).toBe(false);
    (MANTINE_STORY_ENROLLED_TITLES as Record<string, string>)[FIXTURE_TITLE] =
      'fixture entry proving the exact-title mechanism';
    expect(isCanonicalMantineTitle(FIXTURE_TITLE)).toBe(true);
    // 3 arbitrary siblings under the same `Fixture/` segment — none enrolled by the prefix, none
    // enrolled by name, so none may resolve true.
    expect(isCanonicalMantineTitle('Fixture/AdminCardList')).toBe(false);
    expect(isCanonicalMantineTitle('Fixture/AdminSidebar')).toBe(false);
    expect(isCanonicalMantineTitle('Fixture/AdminSettings')).toBe(false);
  });

  it('does not enrol by substring or partial match — only exact title equality', () => {
    (MANTINE_STORY_ENROLLED_TITLES as Record<string, string>)[FIXTURE_TITLE] =
      'fixture entry proving the exact-title mechanism';
    expect(isCanonicalMantineTitle(`${FIXTURE_TITLE}Extra`)).toBe(false);
    expect(isCanonicalMantineTitle(`${FIXTURE_TITLE}/Default`)).toBe(false);
    expect(isCanonicalMantineTitle(`X/${FIXTURE_TITLE}`)).toBe(false);
  });

  it('leaves no fixture entry behind in the production enrolment map', () => {
    expect(Object.hasOwn(MANTINE_STORY_ENROLLED_TITLES, FIXTURE_TITLE)).toBe(false);
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
