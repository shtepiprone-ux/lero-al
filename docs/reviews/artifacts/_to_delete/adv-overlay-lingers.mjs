#!/usr/bin/env node
/**
 * Task 748 REWORK — RR4. Extends the reviewer's 9-case witness
 * (docs/reviews/artifacts/2026-08-13-task748/twmerge-class-resolution.mjs) to ALL 18 distinct
 * JSX elements the parent task touched (24 utility sites live on 18 elements — several elements
 * carry more than one migrated utility). Same method: `cn()` is `twMerge(clsx(...))`
 * (src/lib/utils.ts:4); a Tailwind utility written directly in a `className` participates in
 * tailwind-merge's conflict resolution, a hashed CSS-Modules class does not — so migrating a
 * utility into a module can change WHICH OTHER CLASSES SURVIVE on the element, not only where the
 * declaration lives.
 *
 * "before" strings are copied verbatim from `git show d3ffd6d6c:<path>` (the parent task's own I0
 * base revision). "after" strings are copied verbatim from the current worktree post-REWORK-fix.
 *
 * Exit: non-zero if any element other than the two already-known, already-fixed sites (F-A rows,
 * F-B) shows a moved effective declaration set — this is the RE-RUN D34 pass's own regression
 * gate, not just a report.
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const cn = (...a) => twMerge(clsx(a));
const MODULE = (n) => `Component_${n}__h4sh`;

const CASES = [
  // PerfDevOverlay.tsx — 10 elements, 11 utility sites
  { id: 'E1 PerfDevOverlay.tsx badge', before: () => cn('bg-overlay/85 text-overlay-foreground rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg'), after: () => cn(MODULE('badge'), 'rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg') },
  { id: 'E2 PerfDevOverlay.tsx pressureClass (low-pressure branch)', before: () => cn('text-overlay-foreground/70'), after: () => cn(MODULE('metricRow')) },
  { id: 'E3 PerfDevOverlay.tsx LCP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E4 PerfDevOverlay.tsx INP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E5 PerfDevOverlay.tsx divider', before: () => cn('border-t border-overlay-foreground/20 my-0.5'), after: () => cn(MODULE('divider'), 'border-t my-0.5') },
  { id: 'E6 PerfDevOverlay.tsx priority row', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(false && MODULE('metricRow'), false && 'text-destructive font-bold') || cn(!false && MODULE('metricRow')), note: 'see restOnly/overOnly variants below' },
  // REWORK2 fix: this placeholder was missing from the round-1 array, so the idx7 splice below's
  // `findIndex` returned -1 and `CASES.splice(-1, 1, ...)` silently deleted E18 (the actual last
  // array element at that point) instead of replacing this row — E18 never ran, and the file's own
  // "all 18 distinct JSX elements" claim was false by one element. Restored so idx7 finds a real
  // target and E18 survives.
  { id: 'E7 PerfDevOverlay.tsx predictive row', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(!false && MODULE('metricRow'), false && 'text-destructive font-bold') },
  { id: 'E8 PerfDevOverlay.tsx offLabel', before: () => 'text-overlay-foreground/40', after: () => MODULE('offLabel'), rawClassName: true },
  { id: 'E9 PerfDevOverlay.tsx guardStats', before: () => 'text-overlay-foreground/60', after: () => MODULE('guardStats'), rawClassName: true },
  { id: 'E10 PerfDevOverlay.tsx sourceLabel', before: () => 'text-overlay-foreground/50', after: () => MODULE('sourceLabel'), rawClassName: true },
  // ListingGallery.tsx — 2 elements, 5 utility sites
  { id: 'E11 ListingGallery.tsx morePhotosOverlay', before: () => cn('absolute inset-0 bg-overlay/50 flex flex-col items-center justify-center text-overlay-foreground gap-1'), after: () => cn(MODULE('morePhotosOverlay'), 'absolute inset-0 flex flex-col items-center justify-center gap-1') },
  { id: 'E12 ListingGallery.tsx:123 photoCountButton', before: () => cn('text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50', 'gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70'), after: () => cn('text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50', `${MODULE('photoCountButton')} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto`) },
  // MantineListingGalleryPattern.tsx — 2 elements, 3 utility sites
  { id: 'E13 MantineListingGalleryPattern.tsx photoCountBadge', before: () => cn('absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-overlay/60 px-2 py-0.5 text-xs text-overlay-foreground'), after: () => cn(MODULE('photoCountBadge'), 'absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs') },
  { id: 'E14 MantineListingGalleryPattern.tsx extraCountOverlay', before: () => cn('absolute inset-0 flex items-center justify-center bg-overlay/60'), after: () => cn(MODULE('extraCountOverlay'), 'absolute inset-0 flex items-center justify-center') },
  // ImageUpload.tsx — 2 elements, 3 utility sites
  { id: 'E15 ImageUpload.tsx hoverOverlay', before: () => cn('absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2'), after: () => cn(MODULE('hoverOverlay'), 'absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2') },
  { id: 'E16 ImageUpload.tsx orderBadge', before: () => cn('absolute bottom-2 left-2 h-5 w-5 rounded-full bg-overlay/60 text-overlay-foreground text-2xs font-bold flex items-center justify-center'), after: () => cn(MODULE('orderBadge'), 'absolute bottom-2 left-2 h-5 w-5 rounded-full text-2xs font-bold flex items-center justify-center') },
  // LightboxView.tsx — 1 element, 1 utility site
  { id: 'E17 LightboxView.tsx counter', before: () => cn('absolute top-4 left-1/2 -translate-x-1/2 text-overlay-foreground/80 text-sm'), after: () => cn(MODULE('counter'), 'absolute top-4 left-1/2 -translate-x-1/2 text-sm') },
  // AdminUserAvatar.tsx — 1 element, 1 utility site
  { id: 'E18 AdminUserAvatar.tsx spinnerOverlay', before: () => cn('absolute inset-0 flex items-center justify-center bg-overlay/30 rounded-full'), after: () => cn(MODULE('spinnerOverlay'), 'absolute inset-0 flex items-center justify-center rounded-full') },
];

// E6/E7 need explicit priorityOver/predictiveOver true/false pairs — replace the placeholder case above.
const idx6 = CASES.findIndex(c => c.id === 'E6 PerfDevOverlay.tsx priority row');
CASES.splice(idx6, 1,
  { id: 'E6a PerfDevOverlay.tsx priority row (priorityOver=false)', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(!false && MODULE('metricRow'), false && 'text-destructive font-bold') },
  { id: 'E6b PerfDevOverlay.tsx priority row (priorityOver=true)', before: () => cn('text-overlay-foreground/70', true && 'text-destructive font-bold'), after: () => cn(!true && MODULE('metricRow'), true && 'text-destructive font-bold') },
);
const idx7 = CASES.findIndex(c => c.id === 'E7 PerfDevOverlay.tsx predictive row');
CASES.splice(idx7, 1,
  { id: 'E7a PerfDevOverlay.tsx predictive row (predictiveOver=false)', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(!false && MODULE('metricRow'), false && 'text-destructive font-bold') },
  { id: 'E7b PerfDevOverlay.tsx predictive row (predictiveOver=true)', before: () => cn('text-overlay-foreground/70', true && 'text-destructive font-bold'), after: () => cn(!true && MODULE('metricRow'), true && 'text-destructive font-bold') },
);

const set = (s) => new Set(String(s).split(' ').filter(Boolean));
const isOverlayUtility = (c) => /(?:^|:)(?:bg|text|border)-overlay(?:-foreground)?(?:\/\d+)?$/.test(c);
const isModule = (c) => c.startsWith('Component_');

// REWORK2/RW1+RW2 (findings G1, G2). The round-1 detector keyed forgiveness on the case id alone
// (`c.id.includes('priority row') || ...`), unconditional on what the actual delta was — a revert
// of the RR1 fix still matched the id and was forgiven, so the gate could never fail on the three
// sites it exists to protect (G1). Separately, it flagged E6b/E7b as "OVERLAY DECLARATION ADDED"
// by asking only whether an overlay utility reached the element in `before`, never checking whether
// `after` still carries a module class — so a byte-identical before/after pair (which is exactly
// what the RR1 fix produces) was misreported as a moved delta (G2).
//
// Fixed method: key each known site on its own expected delta SIGNATURE, not on the case id.
//   - E6b/E7b (over-budget branch): the module class must be OMITTED from `after` — that is the
//     entire point of RR1 (`!priorityOver && styles.metricRow`) — and no other utility should newly
//     survive. Expected signature: moduleExpected=false, allowedSurviving=[].
//   - E12 (photoCountButton): once the overlay utility is replaced by the module class, twMerge no
//     longer sees a same-property utility to evict `text-foreground`/`hover:bg-muted` from the GHOST
//     prefix, so those two newly survive alongside the (present) module class. Expected signature:
//     moduleExpected=true, allowedSurviving=['hover:bg-muted', 'text-foreground'].
//   - Every other site: plain utility -> module swap. Expected signature: moduleExpected=true,
//     allowedSurviving=[].
// A case reddens (unexpectedMoves++) whenever its ACTUAL module-presence or newly-surviving set
// differs from ITS OWN declared signature above — a different delta, or a delta where none is
// expected, still fails. `moved` (informational, printed as `>> DELTA`) is independent of that: it
// only counts cases with a real difference between before and after, so E6b/E7b (byte-identical
// before/after, once RR1 is correctly applied) print `stable`, not `DELTA`.
const SITE_PROFILES = new Map([
  ['E6b PerfDevOverlay.tsx priority row (priorityOver=true)', { moduleExpected: false, allowedSurviving: [] }],
  ['E7b PerfDevOverlay.tsx predictive row (predictiveOver=true)', { moduleExpected: false, allowedSurviving: [] }],
  ['E12 ListingGallery.tsx:123 photoCountButton', { moduleExpected: true, allowedSurviving: ['hover:bg-muted', 'text-foreground'] }],
]);
const DEFAULT_PROFILE = { moduleExpected: true, allowedSurviving: [] };

let moved = 0;
let unexpectedMoves = 0;
for (const c of CASES) {
  const b = c.before(), a = c.after();
  const bs = set(b);
  const asFull = set(a);
  const moduleTokensAfter = [...asFull].filter(isModule);
  const nonModuleAfter = [...asFull].filter(x => !isModule(x));
  const overlayUtilityStillInAfter = nonModuleAfter.filter(isOverlayUtility);
  const newlySurviving = nonModuleAfter.filter(x => !bs.has(x)).sort();

  const profile = SITE_PROFILES.get(c.id) ?? DEFAULT_PROFILE;
  const modulePresent = moduleTokensAfter.length > 0;
  const unexpectedSurviving = newlySurviving.filter(x => !profile.allowedSurviving.includes(x));
  const missingAllowedSurviving = profile.allowedSurviving.filter(x => !newlySurviving.includes(x));

  const verdicts = [];
  let unexpected = false;

  if (modulePresent !== profile.moduleExpected) {
    verdicts.push(profile.moduleExpected
      ? 'MODULE CLASS MISSING (expected present)'
      : 'MODULE CLASS PRESENT (expected omitted so the override utility wins the cascade)');
    unexpected = true;
  }
  if (overlayUtilityStillInAfter.length) {
    verdicts.push('OVERLAY UTILITY STILL PRESENT AFTER MIGRATION: ' + overlayUtilityStillInAfter.join(' '));
    unexpected = true;
  }
  if (unexpectedSurviving.length) {
    verdicts.push('OTHER UTILITIES NEWLY SURVIVE (unexpected): ' + unexpectedSurviving.join(' '));
    unexpected = true;
  }
  if (missingAllowedSurviving.length) {
    verdicts.push('EXPECTED SURVIVING UTILITY MISSING: ' + missingAllowedSurviving.join(' '));
    unexpected = true;
  }
  if (!unexpectedSurviving.length && newlySurviving.length) {
    verdicts.push('OTHER UTILITIES NEWLY SURVIVE (expected, RR1/RR2 fix): ' + newlySurviving.join(' '));
  }

  if (verdicts.length) moved++;
  if (unexpected) unexpectedMoves++;

  console.log(`${verdicts.length ? '>> DELTA' : '   stable'}  ${c.id}`);
  console.log(`     before: ${b}`);
  console.log(`     after : ${a}`);
  for (const v of verdicts) console.log(`     !! ${v}`);
  console.log('');
}
console.log(`Elements checked: ${CASES.length}, moved: ${moved}, unexpected (not already known/fixed): ${unexpectedMoves}`);
if (unexpectedMoves > 0) {
  console.error('FAIL: an unexpected element moved that RR1/RR2 did not already address.');
  process.exit(1);
}
console.log('PASS: E6b/E7b are byte-identical before/after (module class correctly omitted so the inline override wins) and print no delta; E12 is the one genuine moved site (text-foreground/hover:bg-muted newly survive because the overlay utility they used to lose to is gone), matching RR1/RR2 exactly; every other site is stable.');
