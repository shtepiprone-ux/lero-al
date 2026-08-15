#!/usr/bin/env node
/* REWORK2 — AC1 evidence for RW1/G1. Byte-identical to twmerge-class-resolution-all18.mjs in this
 * same folder, with exactly one change: E6b/E7b's `after` expressions have the RR1 fix REVERTED, so
 * the module class is unconditionally present regardless of `priorityOver`/`predictiveOver` — the
 * exact state finding F-A described and RR1 was written to eliminate. This is the fixed gate's own
 * equivalent of the reviewer's round-2 g1-gate-blindness-probe.mjs (which cannot be edited or
 * re-used here — it embeds the OLD, since-fixed detector logic, so running it only re-demonstrates
 * the already-filed G1 bug against the pre-fix code, not whether the CURRENT gate catches the same
 * revert). A regression gate that protects RR1 must exit non-zero on this input.
 *
 * Run both for AC1:
 *   node rw1-gate-blindness-probe.mjs        -> expect non-zero (RR1 fix reverted)
 *   node twmerge-class-resolution-all18.mjs  -> expect zero (real tree, RR1 fix present)
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const cn = (...a) => twMerge(clsx(a));
const MODULE = (n) => `Component_${n}__h4sh`;

const CASES = [
  { id: 'E1 PerfDevOverlay.tsx badge', before: () => cn('bg-overlay/85 text-overlay-foreground rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg'), after: () => cn(MODULE('badge'), 'rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg') },
  { id: 'E2 PerfDevOverlay.tsx pressureClass (low-pressure branch)', before: () => cn('text-overlay-foreground/70'), after: () => cn(MODULE('metricRow')) },
  { id: 'E3 PerfDevOverlay.tsx LCP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E4 PerfDevOverlay.tsx INP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E5 PerfDevOverlay.tsx divider', before: () => cn('border-t border-overlay-foreground/20 my-0.5'), after: () => cn(MODULE('divider'), 'border-t my-0.5') },
  { id: 'E6a PerfDevOverlay.tsx priority row (priorityOver=false)', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(!false && MODULE('metricRow'), false && 'text-destructive font-bold') },
  { id: 'E6b PerfDevOverlay.tsx priority row (priorityOver=true)', before: () => cn('text-overlay-foreground/70', true && 'text-destructive font-bold'), after: () => cn(MODULE('metricRow'), true && 'text-destructive font-bold') /* <-- RR1 FIX REVERTED for this probe */ },
  { id: 'E7a PerfDevOverlay.tsx predictive row (predictiveOver=false)', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(!false && MODULE('metricRow'), false && 'text-destructive font-bold') },
  { id: 'E7b PerfDevOverlay.tsx predictive row (predictiveOver=true)', before: () => cn('text-overlay-foreground/70', true && 'text-destructive font-bold'), after: () => cn(MODULE('metricRow'), true && 'text-destructive font-bold') /* <-- RR1 FIX REVERTED for this probe */ },
  { id: 'E8 PerfDevOverlay.tsx offLabel', before: () => 'text-overlay-foreground/40', after: () => MODULE('offLabel'), rawClassName: true },
  { id: 'E9 PerfDevOverlay.tsx guardStats', before: () => 'text-overlay-foreground/60', after: () => MODULE('guardStats'), rawClassName: true },
  { id: 'E10 PerfDevOverlay.tsx sourceLabel', before: () => 'text-overlay-foreground/50', after: () => MODULE('sourceLabel'), rawClassName: true },
  { id: 'E11 ListingGallery.tsx morePhotosOverlay', before: () => cn('absolute inset-0 bg-overlay/50 flex flex-col items-center justify-center text-overlay-foreground gap-1'), after: () => cn(MODULE('morePhotosOverlay'), 'absolute inset-0 flex flex-col items-center justify-center gap-1') },
  { id: 'E12 ListingGallery.tsx:123 photoCountButton', before: () => cn('text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50', 'gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70'), after: () => cn('text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50', `${MODULE('photoCountButton')} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto`) },
  { id: 'E13 MantineListingGalleryPattern.tsx photoCountBadge', before: () => cn('absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-overlay/60 px-2 py-0.5 text-xs text-overlay-foreground'), after: () => cn(MODULE('photoCountBadge'), 'absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs') },
  { id: 'E14 MantineListingGalleryPattern.tsx extraCountOverlay', before: () => cn('absolute inset-0 flex items-center justify-center bg-overlay/60'), after: () => cn(MODULE('extraCountOverlay'), 'absolute inset-0 flex items-center justify-center') },
  { id: 'E15 ImageUpload.tsx hoverOverlay', before: () => cn('absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2'), after: () => cn(MODULE('hoverOverlay'), 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2') },
  { id: 'E16 ImageUpload.tsx orderBadge', before: () => cn('absolute bottom-2 left-2 h-5 w-5 rounded-full bg-overlay/60 text-overlay-foreground text-2xs font-bold flex items-center justify-center'), after: () => cn(MODULE('orderBadge'), 'absolute bottom-2 left-2 h-5 w-5 rounded-full text-2xs font-bold flex items-center justify-center') },
  { id: 'E17 LightboxView.tsx counter', before: () => cn('absolute top-4 left-1/2 -translate-x-1/2 text-overlay-foreground/80 text-sm'), after: () => cn(MODULE('counter'), 'absolute top-4 left-1/2 -translate-x-1/2 text-sm') },
  { id: 'E18 AdminUserAvatar.tsx spinnerOverlay', before: () => cn('absolute inset-0 flex items-center justify-center bg-overlay/30 rounded-full'), after: () => cn(MODULE('spinnerOverlay'), 'absolute inset-0 flex items-center justify-center rounded-full') },
];

const set = (s) => new Set(String(s).split(' ').filter(Boolean));
const isOverlayUtility = (c) => /(?:^|:)(?:bg|text|border)-overlay(?:-foreground)?(?:\/\d+)?$/.test(c);
const isModule = (c) => c.startsWith('Component_');

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
  console.error('FAIL (expected for this probe): the RR1-reverted E6b/E7b now show the module class present, which the fixed gate correctly reddens.');
  process.exit(1);
}
console.log('PASS');
