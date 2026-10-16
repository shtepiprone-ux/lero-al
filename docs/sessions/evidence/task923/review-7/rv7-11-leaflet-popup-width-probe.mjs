// Task 923 review 7 (Opus, diagnosis only). archived-listing sq 390: what decides the Leaflet popup width?
// A MutationObserver installed before any page script records the page at the moment Leaflet writes the width of
// `.leaflet-popup-content` (Popup._updateLayout): the map width, whether leaflet.css applies (popup position), the
// content's font and the font status. CPU throttle 1x and 4x, 3 trials each.
//   node docs/sessions/evidence/task923/review-7/rv7-11-leaflet-popup-width-probe.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const registry = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states;
const state = registry.find((s) => s.id === 'patterns-mantine-listingdetailview--archived-listing~all-photos');
console.log(`platform ${process.platform} node ${process.version} ${new Date().toISOString()}`);
const server = await startStaticServer('storybook-static', 6078);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6078');
for (const rate of [1, 4]) {
  for (let trial = 1; trial <= 3; trial++) {
    const page = await newMeasuringPage(browser);
    await page.addInitScript(() => {
      window.__popupLog = [];
      new MutationObserver(() => {
        const c = document.querySelector('.leaflet-popup-content');
        if (!c || !c.style.width || window.__popupLog.some((x) => x.width === c.style.width)) return;
        const map = document.querySelector('.listing-map');
        const popup = c.closest('.leaflet-popup');
        window.__popupLog.push({
          t: Math.round(performance.now()), width: c.style.width,
          mapWidth: map ? Math.round(map.getBoundingClientRect().width) : null,
          popupPosition: popup ? getComputedStyle(popup).position : null,
          contentFont: getComputedStyle(c).fontFamily.slice(0, 40), fontSize: getComputedStyle(c).fontSize,
          fontsStatus: document.fonts.status, openSans: document.fonts.check('14px "Open Sans"'),
        });
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await loadStory(page, ctx, { story: state.story, state: state.id, locale: 'sq', width: 390 });
    await waitStable(page, null);
    await sleep(3000);
    const end = await page.evaluate(() => {
      const p = document.querySelector('.leaflet-popup'); const c = document.querySelector('.leaflet-popup-content');
      const r = p?.getBoundingClientRect();
      return { log: window.__popupLog, popup: r ? `${Math.round(r.left)}..${Math.round(r.right)}` : null, contentFont: c ? getComputedStyle(c).fontFamily.slice(0, 40) : null, fontSize: c ? getComputedStyle(c).fontSize : null };
    });
    console.log(`throttle ${rate}x trial ${trial}: at width write ${JSON.stringify(end.log)} | end popup ${end.popup} font ${end.contentFont} ${end.fontSize}`);
    await page.close();
  }
}
await browser.close();
await new Promise((res) => server.close(res));
