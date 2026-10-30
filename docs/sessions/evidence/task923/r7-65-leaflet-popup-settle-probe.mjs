// Task 923 Revision 6, AC32 (diagnosis only; a copy of review-6/rv6-53-chart-settle-probe.mjs with the chart measure replaced).
// The cell listingdetailview--archived-listing~all-photos @ sq 390 is component-overflow + text-hidden at CPU throttle 1x and green at
// 4x (r7-63). For each throttle, 5 trials: load, open and waitStable exactly as the gate does, then the popup's and the map's boxes
// at return and 3 000ms later, and whether the layout moved in between.
//   node docs/sessions/evidence/task923/r7-65-leaflet-popup-settle-probe.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable, openAction, lastSettle } from '../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const id = 'patterns-mantine-listingdetailview--archived-listing~all-photos';
const state = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === id);
console.log(`platform ${process.platform} node ${process.version}; state ${id} @ sq 390`);
const server = await startStaticServer('storybook-static', 6065);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6065');
const boxes = () => {
  const r = (el) => { if (!el) return 'absent'; const b = el.getBoundingClientRect(); return `${Math.round(b.left)}..${Math.round(b.right)} x ${Math.round(b.top)}..${Math.round(b.bottom)}`; };
  const pane = document.querySelector('.leaflet-map-pane');
  return `map ${r(document.querySelector('.listing-map'))}; popup ${r(document.querySelector('.leaflet-popup'))}; pane ${pane ? pane.style.transform : 'absent'}; mapPane anims ${pane ? pane.getAnimations({ subtree: true }).length : '-'}`;
};
for (const rate of [1, 4]) {
  for (let trial = 1; trial <= 5; trial++) {
    const page = await newMeasuringPage(browser);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await loadStory(page, ctx, { story: state.story, locale: 'sq', width: 390 });
    const o = await openAction(page, state);
    await waitStable(page, state.portals);
    const s = lastSettle(page);
    const a = await page.evaluate(boxes);
    await page.waitForTimeout(3000);
    const b = await page.evaluate(boxes);
    console.log(`throttle ${rate}x trial ${trial}: open ${o.ok ? 'ok' : 'FAILED'}; settle ${JSON.stringify(s)}\n   at return: ${a}\n   3s later:  ${b}\n   ${a === b ? 'unchanged' : 'CHANGED'}`);
    await page.close();
  }
}
await browser.close();
await new Promise((res) => server.close(res));
