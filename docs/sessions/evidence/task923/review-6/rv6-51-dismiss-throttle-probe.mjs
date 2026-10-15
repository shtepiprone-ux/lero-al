// Review 6 (diagnosis only). A state whose dismiss-outside verdict flipped between r5-full and r6-full is run through the
// gate's own dismissCheck at CPU throttle 1x, 4x and 8x (Chrome DevTools Protocol), 4 trials each. When the gate reports
// "still visible 1000ms after the dismissal", the probe keeps polling the portal count up to 5 000ms more to tell a slow
// close (it closes later) from an ignored click (it never closes).
//   node docs/sessions/evidence/task923/review-6/rv6-51-dismiss-throttle-probe.mjs <state-id> <locale> <width>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable, openAction, dismissCheck } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [id, locale, width] = [process.argv[2], process.argv[3], Number(process.argv[4])];
const state = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === id);
if (!state) throw new Error(`no registry row ${id}`);
console.log(`platform ${process.platform} node ${process.version}; state ${id} @ ${locale} ${width}`);
const server = await startStaticServer('storybook-static', 6061);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6061');
for (const rate of [1, 4, 8]) {
  for (let trial = 1; trial <= 4; trial++) {
    const page = await newMeasuringPage(browser);
    const cdp = await page.context().newCDPSession(page);
    await loadStory(page, ctx, { story: state.story, locale, width });
    await waitStable(page, null);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const o = await openAction(page, state);
    const n = await waitStable(page, state.portals);
    const t0 = Date.now();
    const r = await dismissCheck(page, ctx, state, locale, width, 'outside', true);
    const gateMs = Date.now() - t0;
    let later = '';
    if (!r.closed) {
      const t1 = Date.now();
      let closedAt = null;
      while (Date.now() - t1 < 5000) {
        if ((await page.evaluate(() => window.__census.portals().length)) === 0) { closedAt = Date.now() - t1; break; }
        await page.waitForTimeout(50);
      }
      later = closedAt == null ? '; still open 5000ms later (the click was not taken)' : `; closed ${closedAt}ms after the gate gave up (slow close)`;
    }
    console.log(`throttle ${rate}x trial ${trial}: open ${o.ok ? 'ok' : 'FAILED'}, portals ${n}; gate ${r.closed ? 'CLOSED' : 'NOT CLOSED'} in ${gateMs}ms ${r.details.join(' | ')}${later}`);
    await page.close();
  }
}
await browser.close();
await new Promise((res) => server.close(res));
