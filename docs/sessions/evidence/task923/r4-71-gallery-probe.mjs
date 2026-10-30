// Task 923 Revision 3: why do the `gallery-track` details that remain after R19 fail? Probe the element the full run names.
//   node docs/sessions/evidence/task923/r4-71-gallery-probe.mjs
import { createRequire } from 'node:module';
import { startStaticServer } from '../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = await startStaticServer('storybook-static', 6071);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
for (const story of ['patterns-mantine-listingdetailpattern--default', 'patterns-mantine-listinggallerypattern--default']) {
  await page.goto(`http://127.0.0.1:6071/iframe.html?id=${story}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const res = await page.evaluate(() => {
    const cs = (e) => getComputedStyle(e);
    const CONTROL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
    const out = [];
    for (const e of document.querySelectorAll('#storybook-root *')) {
      const s = cs(e);
      if (!(s.position === 'absolute' || s.position === 'fixed' || s.transform !== 'none')) continue;
      let bound = null;
      for (let p = e.parentElement; p; p = p.parentElement) { if (cs(p).overflowX !== 'visible' || cs(p).overflowY !== 'visible') { bound = p; break; } }
      if (!bound) continue;
      const r = e.getBoundingClientRect();
      const b = bound.getBoundingClientRect();
      if (!(r.right > b.right + 0.5 || r.left < b.left - 0.5)) continue;
      if (!bound.className.toString().includes('h-full')) continue;
      out.push({
        el: e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 40),
        x: [Math.round(r.left), Math.round(r.right)], bound: [Math.round(b.left), Math.round(b.right)], boundOverflow: cs(bound).overflowX + '/' + cs(bound).overflowY,
        text: (e.textContent || '').trim().slice(0, 60), hasControl: e.matches(CONTROL) || !!e.querySelector(CONTROL),
        controls: [...e.querySelectorAll(CONTROL)].slice(0, 3).map((c) => c.tagName.toLowerCase() + (c.getAttribute('tabindex') ? '[tabindex=' + c.getAttribute('tabindex') + ']' : '') + ' ' + (c.getAttribute('aria-label') || c.textContent || '').trim().slice(0, 30)),
        childTags: [...e.children].map((c) => c.tagName.toLowerCase()).slice(0, 5),
      });
    }
    return out.slice(0, 6);
  });
  console.log(story);
  console.log(JSON.stringify(res, null, 1));
}
await browser.close();
await new Promise((r) => server.close(r));
