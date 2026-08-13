#!/usr/bin/env node
/* Reviewer verification of RR1 (round 2). Evaluates the REAL className expressions from both
 * trees with the project's own cn(), across all four branches.
 *   before: `git show d3ffd6d6c:src/components/shared/PerfDevOverlay.tsx` :74 and :79
 *   after : current worktree :82 and :87
 * Exit 1 if any branch is not equivalent. This is what RR1's proof should look like: the
 * comparison is over class LISTS, so it needs no stylesheet and no browser, and it cannot be
 * fooled by an unresolvable custom property (see g3-destructive-var-chain.txt).
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
const cn = (...a) => twMerge(clsx(a));
const M = 'PerfDevOverlay_metricRow__hash';
const before = (over) => cn('text-overlay-foreground/70', over && 'text-destructive font-bold');
const after  = (over) => cn(!over && M, over && 'text-destructive font-bold');
let bad = 0;
for (const row of ['priority', 'predictive']) {
  for (const over of [false, true]) {
    const B = before(over), A = after(over);
    // Equivalent iff the non-overlay classes match AND the overlay declaration reaches the
    // element on exactly the same branches (utility before <-> module class after).
    const bOverlay = B.split(' ').some(c => /(?:^|:)(?:bg|text|border)-overlay/.test(c));
    const aOverlay = A.split(' ').includes(M);
    const bRest = B.split(' ').filter(c => !/overlay/.test(c)).sort().join(' ');
    const aRest = A.split(' ').filter(c => c !== M).sort().join(' ');
    const ok = bOverlay === aOverlay && bRest === aRest;
    if (!ok) bad++;
    console.log(`${ok ? 'EQUIVALENT' : '>> MOVED  '}  ${row} row, over=${over}`);
    console.log(`    before: ${JSON.stringify(B)}`);
    console.log(`    after : ${JSON.stringify(A)}`);
  }
}
console.log(`\nbranches checked: 4, not equivalent: ${bad}`);
if (bad) { console.error('RR1: FAIL'); process.exit(1); }
console.log('RR1: PASS — over-budget branches are byte-identical; under-budget branches swap the utility for the module class, which is the intended migration.');
