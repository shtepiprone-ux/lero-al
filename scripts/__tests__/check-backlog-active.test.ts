// @vitest-environment node
/**
 * check:backlog-active check 5 (governance reset 2026-11-06): every number backlog-reserved.md records as reserved is
 * in the backlog's Task registry, so the registry really is the single source of open numbers.
 *
 * Run: npx vitest run scripts/__tests__/check-backlog-active.test.ts
 */
import { describe, expect, it } from 'vitest';
import { unregisteredReserved } from '../check-backlog-active.mjs';

const backlog = (rows: string[]) => ['# Backlog', '', '## Task registry — open numbers', '', '| # | State | What |', '|---|---|---|', ...rows, '', '## Next', '| **999** | x | y |'].join('\n');
const reserved = (rows: string[]) => ['# Reserved', '', '| # | State | Text |', '|---|---|---|', ...rows].join('\n');

describe('unregisteredReserved', () => {
  it('reports a reserved number the registry does not list in its first column', () => {
    const b = backlog(['| **929 · 930** | reserved | the profile tab, the site settings |']);
    const r = reserved(['| **929** | reserved 2026-10-20 — P2 | x |', '| **930** | reserved 2026-10-21 — P2 | x |', '| **934** | reserved 2026-10-28 — P3 | x |']);
    expect(unregisteredReserved(b, r)).toEqual(['934']);
  });

  it('a number named only in another column or after the registry section does not count as registered', () => {
    const b = backlog(['| **945** | Sprint 93 | folds **934** |']);
    expect(unregisteredReserved(b, reserved(['| **934** | reserved — P3 | x |']))).toEqual(['934']);
    expect(unregisteredReserved(b, reserved(['| **999** | reserved — P3 | x |']))).toEqual(['999']);
  });

  it('closed, folded and retired records are not reserved numbers', () => {
    const r = reserved(['| **925** | **folded into 939** on 2026-11-06 | x |', '| **793** | **closed** — approved 2026-09-06 | x |']);
    expect(unregisteredReserved(backlog([]), r)).toEqual([]);
  });

  it('a backlog without a registry reports nothing rather than everything', () => {
    expect(unregisteredReserved('# Backlog\n', reserved(['| **934** | reserved | x |']))).toEqual([]);
  });
});
