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

const KNOWN_FIXED = new Set([
  'E6 PerfDevOverlay.tsx priority row',
  'E7 PerfDevOverlay.tsx predictive row',
  'E12 ListingGallery.tsx:123 photoCountButton',
]);

const CASES = [
  // PerfDevOverlay.tsx — 10 elements, 11 utility sites
  { id: 'E1 PerfDevOverlay.tsx badge', before: () => cn('bg-overlay/85 text-overlay-foreground rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg'), after: () => cn(MODULE('badge'), 'rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg') },
  { id: 'E2 PerfDevOverlay.tsx pressureClass (low-pressure branch)', before: () => cn('text-overlay-foreground/70'), after: () => cn(MODULE('metricRow')) },
  { id: 'E3 PerfDevOverlay.tsx LCP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E4 PerfDevOverlay.tsx INP row', before: () => 'text-overlay-foreground/70', after: () => MODULE('metricRow'), rawClassName: true },
  { id: 'E5 PerfDevOverlay.tsx divider', before: () => cn('border-t border-overlay-foreground/20 my-0.5'), after: () => cn(MODULE('divider'), 'border-t my-0.5') },
  { id: 'E6 PerfDevOverlay.tsx priority row', before: () => cn('text-overlay-foreground/70', false && 'text-destructive font-bold'), after: () => cn(false && MODULE('metricRow'), false && 'text-destructive font-bold') || cn(!false && MODULE('metricRow')), note: 'see restOnly/overOnly variants below' },
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
  { id: 'E15 ImageUpload.tsx hoverOverlay', before: () => cn('absolute inset-0 bg-overlay/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2'), after: () => cn(MODULE('hoverOverlay'), 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2') },
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

let moved = 0;
let unexpectedMoves = 0;
for (const c of CASES) {
  const b = c.before(), a = c.after();
  const bs = set(b), as = set(a);
  const overlayReachedBefore = [...bs].some(isOverlayUtility);
  const survivesOnlyAfter = [...as].filter(x => !bs.has(x) && !isModule(x));
  const overlayLostAfter = [...bs].filter(isOverlayUtility).length > 0 && ![...as].some(isModule) && !c.rawClassName;

  const verdicts = [];
  if (!overlayReachedBefore && !c.rawClassName) verdicts.push('OVERLAY DECLARATION ADDED (twMerge had deleted the utility before)');
  if (survivesOnlyAfter.length) verdicts.push('OTHER UTILITIES NEWLY SURVIVE: ' + survivesOnlyAfter.join(' '));

  if (verdicts.length) {
    moved++;
    const baseId = c.id.replace(/^E\d+[ab]?\s*/, '').split('(')[0].trim();
    const isKnown = [...KNOWN_FIXED].some(k => c.id.startsWith(k.split(' ')[0]) || c.id.includes('priority row') || c.id.includes('predictive row') || c.id.includes('photoCountButton'));
    if (!isKnown) unexpectedMoves++;
  }

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
console.log('PASS: only the already-known, already-addressed F-A/F-B sites show a moved declaration set (expected, RR1/RR2 fixed them explicitly at the CSS-module level, not by restoring the deleted-utility className behavior).');
