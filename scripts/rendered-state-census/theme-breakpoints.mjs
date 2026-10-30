/**
 * theme-breakpoints.mjs — the theme's breakpoint list in px (Task 923, R12).
 *
 * `widths.min` / `widths.max` of a registry state must be a theme breakpoint (or a breakpoint minus 1), so the list is
 * read from the single source, the Mantine theme file's `breakpoints: { name: '<n>em', ... }`, never copied.
 * Mantine converts an `em` breakpoint at the 16px root.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const THEME_PATH = ['src', 'design-system', 'mantine', 'theme.ts'];
const ROOT_FONT_PX = 16;

/** @param {string} source the text of theme.ts @returns {Record<string, number>} name -> px */
export function parseBreakpoints(source) {
  const block = source.match(/\bbreakpoints\s*:\s*\{([^}]*)\}/s);
  if (!block) throw new Error('theme.ts has no `breakpoints: { ... }` block');
  const out = {};
  for (const m of block[1].matchAll(/^\s*(\w+)\s*:\s*'([\d.]+)(em|px|rem)'/gm)) {
    out[m[1]] = Math.round(parseFloat(m[2]) * (m[3] === 'px' ? 1 : ROOT_FONT_PX));
  }
  if (Object.keys(out).length === 0) throw new Error('theme.ts `breakpoints` block has no `name: \'<n>em\'` entries');
  return out;
}

export function loadBreakpoints(repoRoot) {
  const named = parseBreakpoints(readFileSync(join(repoRoot, ...THEME_PATH), 'utf8'));
  return { named, list: Object.values(named).sort((a, b) => a - b) };
}
