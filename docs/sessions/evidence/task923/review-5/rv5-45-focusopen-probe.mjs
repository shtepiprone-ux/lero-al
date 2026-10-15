// Review 5 (diagnosis only): AdminShell drawer-open (mount) at 639 / en. Samples, every 50ms for 1.5s after the
// render finishes, the visible portal count, the running finite animations and whether the focus is inside a portal,
// and also runs the gate's own waitStable to show when it returns.
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = await startStaticServer('storybook-static', 6052);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6052');
const story = 'patterns-mantine-adminshell--drawer-open';
for (let run = 0; run < 6; run++) {
  const page = await newMeasuringPage(browser);
  await loadStory(page, ctx, { story, locale: 'en', width: 639 });
  const t0 = Date.now();
  if (run % 2 === 0) {
    const n = await waitStable(page, 1);
    const f = await page.evaluate(() => window.__census.focusState(null));
    console.log(`run ${run} gate waitStable returned at ${Date.now() - t0}ms portals ${n}: focus ${f.portalIndex < 0 ? 'OUTSIDE ' + f.active : 'inside'}`);
  } else {
    const trail = [];
    while (Date.now() - t0 < 1500) {
      const s = await page.evaluate(() => ({ n: window.__census.portals().length, run: document.getAnimations().filter((a) => a.playState === 'running').length, f: window.__census.focusState(null).portalIndex >= 0 }));
      trail.push(`${Date.now() - t0}:${s.n}/${s.run}/${s.f ? 'in' : 'out'}`);
      await page.waitForTimeout(50);
    }
    console.log(`run ${run} samples t:portals/animations/focus ${trail.join(' ')}`);
  }
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
