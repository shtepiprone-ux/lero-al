// Review 5 (diagnosis only): ListingContactPattern default, "write on WhatsApp" at 1440 / it. After the registered
// click, samples every 50ms for 1.5s: the visible portal count, the running animations and the box of the visible
// notification; and runs the gate's own waitStable first on even runs to show where it returns.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable, openAction } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const state = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === 'patterns-mantine-listingcontactpattern--default~write-on-whatsapp');
const server = await startStaticServer('storybook-static', 6053);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6053');
const box = () => { const n = [...document.querySelectorAll('[data-portal="true"] .mantine-Notification-root')].find((e) => e.getBoundingClientRect().width > 0); if (!n) return 'none'; const r = n.getBoundingClientRect(); return `${Math.round(r.left)}..${Math.round(r.right)}`; };
for (let run = 0; run < 6; run++) {
  const page = await newMeasuringPage(browser);
  await loadStory(page, ctx, { story: state.story, locale: 'it', width: 1440 });
  await waitStable(page, null);
  await openAction(page, state);
  const t0 = Date.now();
  if (run % 2 === 0) {
    await waitStable(page, state.portals);
    const t = Date.now() - t0;
    const b1 = await page.evaluate(box);
    await page.waitForTimeout(1000);
    const b2 = await page.evaluate(box);
    console.log(`run ${run} waitStable returned at ${t}ms: notification ${b1}; 1s later ${b2}`);
  } else {
    const trail = [];
    while (Date.now() - t0 < 1500) {
      const s = await page.evaluate(`({ n: window.__census.portals().length, a: document.getAnimations().filter((a) => a.playState === 'running').length, b: (${box})() })`);
      trail.push(`${Date.now() - t0}:${s.n}/${s.a}/${s.b}`);
      await page.waitForTimeout(50);
    }
    console.log(`run ${run} t:portals/animations/box ${trail.join(' ')}`);
  }
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
