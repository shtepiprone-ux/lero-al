// Task 764 Phase A — isolated matchMedia sanity check, independent of the storybook-static
// harness and the ListingCard story. A minimal `page.setContent` page proves the A2 gate FAIL
// measured by task764-pointer-probe.mjs is not an artifact of the story/server harness: the same
// Playwright/Chromium install (playwright@1.60.0, Chromium 148.0.7778.96 measured this run)
// reports the identical matchMedia values on a trivial page with no CSS at all.
import { chromium } from 'playwright';
const browser = await chromium.launch();
console.log('chromium version:', browser.version());
const ctxFine = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const pageFine = await ctxFine.newPage();
await pageFine.setContent('<div>test</div>');
console.log('fine (no touch):', await pageFine.evaluate(() => ({
  hoverHover: matchMedia('(hover: hover)').matches,
  pointerCoarse: matchMedia('(pointer: coarse)').matches,
  pointerFine: matchMedia('(pointer: fine)').matches,
})));
await ctxFine.close();

const ctxCoarse = await browser.newContext({ viewport: { width: 1024, height: 900 }, hasTouch: true });
const pageCoarse = await ctxCoarse.newPage();
await pageCoarse.setContent('<div>test</div>');
console.log('coarse (hasTouch:true, no isMobile):', await pageCoarse.evaluate(() => ({
  hoverHover: matchMedia('(hover: hover)').matches,
  pointerCoarse: matchMedia('(pointer: coarse)').matches,
  pointerFine: matchMedia('(pointer: fine)').matches,
})));
await ctxCoarse.close();
await browser.close();
