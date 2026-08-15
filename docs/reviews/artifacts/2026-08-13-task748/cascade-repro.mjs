#!/usr/bin/env node
/**
 * Task 748 orchestrator review — rendered witness for F-A and F-B.
 *
 * Self-contained: it writes its own HTML, so it needs no repo build and no
 * storybook-static. The stylesheet below is not invented — every rule is
 * transcribed from artifacts in this same folder:
 *   - Tailwind utilities sit in `@layer utilities`
 *     (bundle-layer-and-offsets.txt: `@layer utilities{` at braceDepth 0,
 *      `.text-destructive` and `.hover\:text-foreground:hover` inside it)
 *   - the CSS-module rules are UNLAYERED and are copied verbatim from
 *     emitted-module-chunk-ListingGallery.css
 *   - the class lists on each element are twMerge's real output
 *     (twmerge-class-resolution.txt)
 *   - the token values are src/app/globals.css:82-85 / :470-471
 *
 * It therefore measures the cascade the browser actually gets, before and
 * after the Task 748 change set, on the two sites the task's own 168-cell
 * comparator does not contain.
 *
 * CORRECTION (reviewer, 2026-08-13, round 2): `--destructive` in the :root block
 * below is a PLACEHOLDER chosen by this harness, not the project's value. The real
 * chain is globals.css:411 `--destructive: var(--brand-900)` -> :365
 * `--brand-900: var(--mantine-color-brand-9)`, which MantineProvider injects at
 * RUNTIME and which is absent from `.next/static/css` (real value #8E322B). The
 * F-A finding is a DELTA claim - before != after - and the delta is unaffected by
 * which concrete red stands in for --destructive. But `oklch(0.58 0.22 27)` must
 * not be quoted as this project's production destructive colour; it is this file's
 * own stand-in. A harness page that omits Mantine's runtime variables will render
 * that row `rgb(0, 0, 0)` (invalid at computed-value time -> UA default), which is
 * a measurement artefact of the harness, not a rendered value of the app.
 *
 * Run:  node docs/reviews/artifacts/2026-08-13-task748/cascade-repro.mjs
 *       [--chromium /path/to/chrome]
 * Exit: 0 if every measured value matches the recorded expectation below,
 *       1 on any mismatch, missing element or launch error. Fail-closed.
 */
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const execIdx = argv.indexOf('--chromium');
const executablePath = execIdx >= 0 ? argv[execIdx + 1] : undefined;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--overlay:oklch(0 0 0);--overlay-foreground:oklch(1 0 0);
      --destructive:oklch(.58 .22 27);--foreground:oklch(.15 0 0);--muted:oklch(.96 0 0)}
@layer theme, base, components, utilities;
@layer utilities{
  .text-destructive{color:var(--destructive)}
  .font-bold{font-weight:700}
  .text-foreground{color:var(--foreground)}
  .text-overlay-foreground{color:var(--overlay-foreground)}
  .text-overlay-foreground\\/70{color:#ffffffb3}
  @supports (color:color-mix(in lab,red,red)){
    .text-overlay-foreground\\/70{color:color-mix(in oklab,var(--overlay-foreground) 70%,transparent)}}
  .bg-overlay\\/60{background-color:#0009}
  @supports (color:color-mix(in lab,red,red)){
    .bg-overlay\\/60{background-color:color-mix(in oklab,var(--overlay) 60%,transparent)}}
  @media (hover:hover){
    .hover\\:text-foreground:hover{color:var(--foreground)}
    .hover\\:bg-muted:hover{background-color:var(--muted)}
    .hover\\:bg-overlay\\/70:hover{background-color:#000000b3}
    @supports (color:color-mix(in lab,red,red)){
      .hover\\:bg-overlay\\/70:hover{background-color:color-mix(in oklab,var(--overlay) 70%,transparent)}}}
}
/* ---- UNLAYERED: verbatim from emitted-module-chunk-ListingGallery.css and
       PerfDevOverlay.module.css (same emission path, same absence of @layer) ---- */
.PerfDevOverlay_metricRow__h{color:#ffffffb3}
@supports (color:color-mix(in lab,red,red)){
  .PerfDevOverlay_metricRow__h{color:color-mix(in oklab,var(--overlay-foreground) 70%,transparent)}}
.ListingGallery_photoCountButton__h{background-color:#0009;color:var(--overlay-foreground)}
@supports (color:color-mix(in lab,red,red)){
  .ListingGallery_photoCountButton__h{background-color:color-mix(in oklab,var(--overlay) 60%,transparent)}}
@media (hover:hover){.ListingGallery_photoCountButton__h:hover{background-color:#000000b3}}
@supports (color:color-mix(in lab,red,red)){@media (hover:hover){
  .ListingGallery_photoCountButton__h:hover{background-color:color-mix(in oklab,var(--overlay) 70%,transparent)}}}
</style></head><body>
<div id="fa-before" class="text-destructive font-bold">pri 9/6</div>
<div id="fa-after"  class="PerfDevOverlay_metricRow__h text-destructive font-bold">pri 9/6</div>
<button id="fb-before" class="hover:text-foreground bg-overlay/60 text-overlay-foreground text-sm hover:bg-overlay/70">all photos</button>
<button id="fb-after"  class="text-foreground hover:bg-muted hover:text-foreground ListingGallery_photoCountButton__h text-sm">all photos</button>
<div id="ctrl-before" class="text-overlay-foreground/70">LCP 1200ms</div>
<div id="ctrl-after"  class="PerfDevOverlay_metricRow__h">LCP 1200ms</div>
</body></html>`;

// finding | element | state | property | expected computed value
const EXPECT = [
  ['F-A', 'fa-before',   'rest',  'color',            'oklch(0.58 0.22 27)'],
  ['F-A', 'fa-after',    'rest',  'color',            'oklab(1 0 0 / 0.7)'],
  ['F-B', 'fb-before',   'rest',  'color',            'oklch(1 0 0)'],
  ['F-B', 'fb-after',    'rest',  'color',            'oklch(1 0 0)'],
  ['F-B', 'fb-before',   'hover', 'color',            'oklch(0.15 0 0)'],
  ['F-B', 'fb-after',    'hover', 'color',            'oklch(1 0 0)'],
  ['F-B', 'fb-before',   'hover', 'background-color', 'oklab(0 0 0 / 0.7)'],
  ['F-B', 'fb-after',    'hover', 'background-color', 'oklab(0 0 0 / 0.7)'],
  ['F-A', 'fa-before',   'hover', 'color',            'oklch(0.58 0.22 27)'],
  ['F-A', 'fa-after',    'hover', 'color',            'oklab(1 0 0 / 0.7)'],
  ['ctrl', 'ctrl-before','rest',  'color',            'oklab(1 0 0 / 0.7)'],
  ['ctrl', 'ctrl-after', 'rest',  'color',            'oklab(1 0 0 / 0.7)'],
  ['ctrl', 'ctrl-before','hover', 'color',            'oklab(1 0 0 / 0.7)'],
  ['ctrl', 'ctrl-after', 'hover', 'color',            'oklab(1 0 0 / 0.7)'],
];

const dir = mkdtempSync(join(tmpdir(), 'task748-cascade-'));
const file = join(dir, 'repro.html');
writeFileSync(file, HTML, 'utf8');

let browser;
let failures = 0;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ hasTouch: false });
  await page.goto('file://' + file);
  for (const [finding, id, state, prop, expected] of EXPECT) {
    let actual;
    try {
      if (state === 'hover') await page.hover('#' + id);
      else await page.mouse.move(0, 0);
      actual = await page.$eval('#' + id, (el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    } catch (e) {
      actual = 'ERROR: ' + String(e).split('\n')[0];
    }
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${finding.padEnd(5)} ${id.padEnd(12)} ${state.padEnd(5)} ${prop.padEnd(17)} expected ${expected.padEnd(22)} actual ${actual}`);
  }
} catch (e) {
  console.error('LAUNCH/RUN ERROR:', String(e).split('\n')[0]);
  failures++;
} finally {
  if (browser) await browser.close();
}

console.log('');
console.log(`cells: ${EXPECT.length}, failures: ${failures}`);
console.log('');
console.log('F-A  PerfDevOverlay over-budget row: red BEFORE, 70% white AFTER  -> warning colour lost.');
console.log('F-B  ListingGallery photo-count Button hovered text: --foreground BEFORE,');
console.log('     --overlay-foreground AFTER -> the utility was a hover-state D34 LOSER and');
console.log('     the unlayered module rule promotes it. Background is unchanged either way.');
console.log('ctrl A site where twMerge was doing no work: identical before and after.');
if (failures > 0) { console.error('CASCADE-REPRO: FAIL'); process.exit(1); }
console.log('CASCADE-REPRO: PASS (the recorded deltas reproduce exactly)');
