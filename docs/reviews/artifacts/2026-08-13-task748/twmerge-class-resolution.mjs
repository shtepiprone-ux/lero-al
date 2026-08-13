#!/usr/bin/env node
/**
 * Task 748 orchestrator review — witness for F-A and F-B.
 *
 * Both P0 findings are caused by the SAME mechanism: `cn()` is
 * `twMerge(clsx(...))` (src/lib/utils.ts:4). A Tailwind utility written in a
 * `className` participates in tailwind-merge's conflict resolution; a hashed
 * CSS-Modules class does not. So migrating a utility into a module does not
 * only change WHERE the declaration lives — it changes WHICH OTHER CLASSES
 * SURVIVE on the element.
 *
 * This harness prints the resolved class list for each affected site, before
 * and after the Task 748 change set. It asserts nothing about colour; the
 * rendered consequence is measured by cascade-repro.mjs in this same folder.
 *
 * Run: node docs/reviews/artifacts/2026-08-13-task748/twmerge-class-resolution.mjs
 * Deps: the repo's own tailwind-merge + clsx (no extra install).
 * Exit: 0 always — this is a witness, not a gate.
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const cn = (...a) => twMerge(clsx(a));
const MODULE = (n) => `Component_${n}__h4sh`; // stands in for the emitted hashed class

const CASES = [
  {
    id: 'F-A  PerfDevOverlay.tsx:76  priority row, priorityOver === true',
    before: () => cn('text-overlay-foreground/70', 'text-destructive font-bold'),
    after:  () => cn(MODULE('metricRow'), 'text-destructive font-bold'),
  },
  {
    id: 'F-A  PerfDevOverlay.tsx:81  predictive row, predictiveOver === true',
    before: () => cn('text-overlay-foreground/70', 'text-destructive font-bold'),
    after:  () => cn(MODULE('metricRow'), 'text-destructive font-bold'),
  },
  {
    id: 'F-B  ListingGallery.tsx:123  Button variant="ghost" (cva classes prepended by buttonVariants)',
    before: () => cn(
      'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
      'gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70'),
    after: () => cn(
      'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
      `${MODULE('photoCountButton')} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto`),
  },
  // Controls: the other migrated sites, where twMerge was doing no work and the
  // migration therefore cannot change the surviving class list.
  { id: 'ctrl PerfDevOverlay badge',        before: () => cn('bg-overlay/85 text-overlay-foreground rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg'), after: () => cn(MODULE('badge'), 'rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg') },
  { id: 'ctrl PerfDevOverlay divider',      before: () => cn('border-t border-overlay-foreground/20 my-0.5'), after: () => cn(MODULE('divider'), 'border-t my-0.5') },
  { id: 'ctrl ImageUpload orderBadge',      before: () => cn('absolute bottom-2 left-2 h-5 w-5 rounded-full bg-overlay/60 text-overlay-foreground text-2xs font-bold flex items-center justify-center'), after: () => cn(MODULE('orderBadge'), 'absolute bottom-2 left-2 h-5 w-5 rounded-full text-2xs font-bold flex items-center justify-center') },
  { id: 'ctrl LightboxView counter',        before: () => cn('absolute top-4 left-1/2 -translate-x-1/2 text-overlay-foreground/80 text-sm'), after: () => cn(MODULE('counter'), 'absolute top-4 left-1/2 -translate-x-1/2 text-sm') },
  { id: 'ctrl MantineGallery photoCountBadge', before: () => cn('absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-overlay/60 px-2 py-0.5 text-xs text-overlay-foreground'), after: () => cn(MODULE('photoCountBadge'), 'absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs') },
  { id: 'ctrl ListingGallery morePhotosOverlay', before: () => cn('absolute inset-0 bg-overlay/50 flex flex-col items-center justify-center text-overlay-foreground gap-1'), after: () => cn(MODULE('morePhotosOverlay'), 'absolute inset-0 flex flex-col items-center justify-center gap-1') },
];

const set = (s) => new Set(s.split(' ').filter(Boolean));
const isOverlayUtility = (c) => /(?:^|:)(?:bg|text|border)-overlay(?:-foreground)?(?:\/\d+)?$/.test(c);
const isModule = (c) => c.startsWith('Component_');

let moved = 0;
for (const c of CASES) {
  const b = c.before(), a = c.after();
  const bs = set(b), as = set(a);

  // (1) Did an overlay-derived declaration actually reach the element BEFORE?
  //     If twMerge deleted the utility, the answer is NO — and the module class
  //     that replaces it is therefore NOT a faithful reproduction, it is an
  //     addition. This is the F-A mechanism.
  const overlayReachedBefore = [...bs].some(isOverlayUtility);

  // (2) Which OTHER Tailwind classes survive on one side only? Removing a
  //     utility from the className frees its twMerge conflict partners to
  //     survive. This is the F-B mechanism.
  const survivesOnlyAfter = [...as].filter(x => !bs.has(x) && !isModule(x));

  const verdicts = [];
  if (!overlayReachedBefore) verdicts.push('OVERLAY DECLARATION ADDED (twMerge had deleted the utility before)');
  if (survivesOnlyAfter.length) verdicts.push('OTHER UTILITIES NEWLY SURVIVE: ' + survivesOnlyAfter.join(' '));
  if (verdicts.length) moved++;

  console.log(`${verdicts.length ? '>> DELTA' : '   stable'}  ${c.id}`);
  console.log(`     before: ${b}`);
  console.log(`     after : ${a}`);
  for (const v of verdicts) console.log(`     !! ${v}`);
  console.log('');
}
console.log(`sites whose effective declaration set moved: ${moved} of ${CASES.length}`);
console.log('');
console.log('Reading: a module class always wins over @layer utilities (it is emitted');
console.log('unlayered - see emitted-module-chunk-ListingGallery.css and');
console.log('bundle-layer-and-offsets.txt), so every delta above is a rendered delta.');
console.log('Rendered values are measured in cascade-repro.txt.');
