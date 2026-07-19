/**
 * mantine-story-scope.mjs — single source of truth for "canonical Mantine story" (Task Q0R).
 *
 * A story is canonical Mantine iff its Storybook `title` starts with one of these prefixes.
 * This is the ONE definition used to scope every CI-blocking rendered/locale/coverage gate.
 * `check-stories-rendered.mjs`, `check-locale-leak.mjs`, and `check-story-coverage.mjs` all
 * import this module — the prefix list must never be re-typed in any of them.
 *
 * History: originally defined only in check-stories-rendered.mjs (Task 529, extended to a list
 * by Task 607). Task Q0R centralizes it here so check-locale-leak.mjs and check-story-coverage.mjs
 * can enforce the identical scope instead of inventing a second criterion.
 */

export const MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/'];

/** @param {string} title @returns {boolean} */
export function isCanonicalMantineTitle(title) {
  return typeof title === 'string' && MANTINE_STORY_TITLE_PREFIXES.some((p) => title.startsWith(p));
}
