// Review 4 (Opus): what the 312 `gallery-track` details of r4-full are. For the transformed track: its own box, the
// clip bound, and every slide's box, aria-hidden, tabindex, focusability and text. For the counter: its box, its
// computed top/bottom/left, and whether the bound clips it.  node docs/sessions/evidence/task923/review-4/rv4-gallery-probe.mjs
import { createRequire } from 'node:module';
import { startStaticServer } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
console.log(`platform ${process.platform} node ${process.version}`);
const server = await startStaticServer('storybook-static', 6081);
const browser = await chromium.launch();
for (const width of [320, 639, 640]) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  for (const story of ['patterns-mantine-listingdetailpattern--default', 'patterns-mantine-listinggallerypattern--default']) {
    await page.goto(`http://127.0.0.1:6081/iframe.html?id=${story}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const res = await page.evaluate(() => {
      const R = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)]; };
      const out = { tracks: [], counters: [] };
      for (const e of document.querySelectorAll('#storybook-root *')) {
        const cs = getComputedStyle(e);
        if (cs.transform !== 'none' && e.querySelector('button')) {
          let bound = e.parentElement; while (bound && getComputedStyle(bound).overflowX === 'visible') bound = bound.parentElement;
          out.tracks.push({ track: R(e), transform: cs.transform, bound: bound && [String(bound.className).slice(0, 30), R(bound)],
            slides: [...e.children].map((s) => ({ tag: s.tagName.toLowerCase(), box: R(s), ariaHidden: s.getAttribute('aria-hidden'), tabindex: s.getAttribute('tabindex'), label: s.getAttribute('aria-label'), text: (s.textContent || '').trim().slice(0, 20) })) });
        }
        if (/^\d+ \/ \d+$/.test((e.textContent || '').trim()) && cs.position === 'absolute') {
          let bound = e.parentElement; while (bound && getComputedStyle(bound).overflowY === 'visible') bound = bound.parentElement;
          out.counters.push({ text: e.textContent.trim(), box: R(e), top: cs.top, bottom: cs.bottom, left: cs.left, inlineStyle: e.getAttribute('style'), bound: bound && [String(bound.className).slice(0, 40), R(bound)] });
        }
      }
      return out;
    });
    console.log(`\n== ${story} @${width}`);
    console.log(JSON.stringify(res, null, 1));
  }
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
console.log('EXIT_CODE=0');
