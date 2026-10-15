// Review 4 (Opus): why the ListingGalleryPattern Story shows an aria-hidden slide in its frame. Reads the clipping
// container's scrollLeft, the track transform and the focused element after the Story's play (which clicks the main
// photo and opens the lightbox), then after Escape.  node docs/sessions/evidence/task923/review-4/rv4-gallery-scroll.mjs
import { createRequire } from 'node:module';
import { startStaticServer } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
console.log(`platform ${process.platform} node ${process.version}`);
const server = await startStaticServer('storybook-static', 6082);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
const read = (label) => page.evaluate((label) => {
  const track = [...document.querySelectorAll('#storybook-root *')].find((e) => getComputedStyle(e).transform !== 'none' && e.querySelector('button'));
  const box = track.parentElement;
  const named = [...track.children].findIndex((s) => s.getAttribute('aria-label'));
  const fr = box.getBoundingClientRect();
  const shown = [...track.children].findIndex((s) => { const r = s.getBoundingClientRect(); return r.left >= fr.left - 0.5 && r.right <= fr.right + 0.5; });
  const a = document.activeElement;
  return `${label}: container scrollLeft ${box.scrollLeft}; track transform ${getComputedStyle(track).transform}; slide in the frame #${shown}; named tabbable slide #${named}; portals ${document.querySelectorAll('[data-portal="true"]').length}; focus ${a.tagName.toLowerCase()} "${a.getAttribute('aria-label') ?? ''}"`;
}, label);
for (const story of ['patterns-mantine-listinggallerypattern--default', 'patterns-mantine-listingdetailpattern--default']) {
  await page.goto(`http://127.0.0.1:6082/iframe.html?id=${story}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  console.log(story);
  console.log(await read('after load (+play)'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  console.log(await read('after Escape'));
}
await browser.close();
await new Promise((r) => server.close(r));
console.log('EXIT_CODE=0');
