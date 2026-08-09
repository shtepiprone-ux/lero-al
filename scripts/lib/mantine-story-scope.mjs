/**
 * mantine-story-scope.mjs — single source of truth for "canonical Mantine story" (Task Q0R).
 *
 * A story is canonical Mantine iff its Storybook `title` starts with one of these prefixes, OR
 * its exact `title` is a key in `MANTINE_STORY_ENROLLED_TITLES` (Task 678). This is the ONE
 * definition used to scope every CI-blocking rendered/locale/coverage gate. `check-stories-
 * rendered.mjs`, `check-locale-leak.mjs`, and `check-story-coverage.mjs` all import this module
 * — neither the prefix list nor the enrolment mechanism may be re-implemented in any of them.
 *
 * History: originally defined only in check-stories-rendered.mjs (Task 529, extended to a list
 * by Task 607). Task Q0R centralizes it here so check-locale-leak.mjs and check-story-coverage.mjs
 * can enforce the identical scope instead of inventing a second criterion.
 */

export const MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/'];

/**
 * Per-story enrolment (Task 678) — the exact-title escape hatch for the prefix list above.
 *
 * A prefix enrols every story under a path segment; that is wrong when only ONE story under an
 * unmigrated segment is actually canonical Mantine (measured 2026-08-08: adding an `Admin/`
 * prefix would enrol 20 still-shadcn siblings alongside the 1 migrated component, asserting all
 * 21 are canonical Mantine when only 1 is). Each key here is an EXACT Storybook `title` string —
 * matched by equality, never by prefix or substring — so enrolling one story never enrols its
 * siblings. The value is the reason this exact story belongs in a canonical-Mantine gate; keep it
 * current if the reason changes.
 *
 * An empty object here must leave `isCanonicalMantineTitle` byte-identical to the prefix-only
 * check — the enrolment mechanism is additive and must never narrow or widen prefix scope on its
 * own (Task 678 D32 counterexample: the empty case is a required proof, not an edge case).
 *
 * @type {Record<string, string>}
 */
export const MANTINE_STORY_ENROLLED_TITLES = {
  'Admin/AdminUsersTable':
    'Task 678/687 — the only migrated component among 21 `Admin/*` stories (measured 2026-08-08): ' +
    'imports Avatar, Badge, Button, Group, Stack, Tabs, Text, TextInput, ActionIcon, Loader, ' +
    'SegmentedControl, ScrollArea from @mantine/core, plus the canonical MantineDataTableToCards ' +
    'pattern. Its 20 `Admin/*` siblings are still shadcn and must stay out of scope — do not widen ' +
    'this to an `Admin/` prefix.',
};

/** @param {string} title @returns {boolean} */
export function isCanonicalMantineTitle(title) {
  if (typeof title !== 'string') return false;
  return (
    MANTINE_STORY_TITLE_PREFIXES.some((p) => title.startsWith(p)) ||
    Object.hasOwn(MANTINE_STORY_ENROLLED_TITLES, title)
  );
}
