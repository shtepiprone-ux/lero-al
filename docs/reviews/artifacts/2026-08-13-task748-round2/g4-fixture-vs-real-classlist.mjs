#!/usr/bin/env node
/* Reviewer verification of G4 (round 2). real-before-after-comparator.mjs:38-40 states its
 * Part B className strings are "verified byte-identical against twmerge-class-resolution-all18.mjs's
 * output, not invented". This checks that claim for the two ListingGallery witnesses.
 * Exit 1 if the fixture differs from the real tailwind-merge output.
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
const cn = (...a) => twMerge(clsx(a));
const GHOST = 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50';
const LOCAL_BEFORE = 'gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70';
const real = cn(GHOST, LOCAL_BEFORE);
const fixture = `${GHOST} ${LOCAL_BEFORE}`; // what the comparator hardcodes as its BEFORE side
console.log('real twMerge output :', real);
console.log('comparator fixture  :', fixture);
const r = new Set(real.split(' ')), f = new Set(fixture.split(' '));
const extra = [...f].filter(x => !r.has(x));
console.log('present in the fixture but NOT in the real class list:', extra.join(' ') || '(none)');
console.log('');
console.log('Why the measured value is nevertheless right: the extra `text-foreground` (0-1-0) loses');
console.log('to `.text-overlay-foreground` (0-1-0) on source order in the shipped bundle');
console.log('(byte 46187 > 44970 — see ../2026-08-13-task748/bundle-layer-and-offsets.txt), and the');
console.log('extra `hover:bg-muted` only affects background-color, which this witness does not read.');
console.log('The witness is correct by accident, on a fact its fixture does not encode.');
if (extra.length) { console.error('\nG4: the byte-identical claim is FALSE'); process.exit(1); }
console.log('\nG4: fixture matches');
