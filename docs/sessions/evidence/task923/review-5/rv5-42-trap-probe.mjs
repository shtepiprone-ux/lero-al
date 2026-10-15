// Review 5 (diagnosis only): the AuthSheet register-agent-add-company focus trap at 390 / en, opened on mount.
// Presses Tab n+1 times like runner.mjs, five times with no pause (the gate) and five times with a 300ms pause
// after mount and between presses, and logs where the focus lands.
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = await startStaticServer('storybook-static', 6051);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6051');
const story = 'patterns-mantine-authsheet--register-agent-add-company';
for (const pause of [0, 0, 0, 0, 0, 300, 300, 300, 300, 300]) {
  const page = await newMeasuringPage(browser);
  const ok = await loadStory(page, ctx, { story, locale: 'en', width: 390 });
  await waitStable(page, 1);
  if (pause) await page.waitForTimeout(pause);
  const n = await page.evaluate(() => window.__census.tabbableCount());
  const trail = [];
  for (let i = 0; i < n + 1; i++) {
    await page.keyboard.press('Tab');
    if (pause) await page.waitForTimeout(pause);
    const f = await page.evaluate(() => window.__census.focusState(null));
    trail.push(f.portalIndex < 0 ? `OUT:${f.active}` : f.active.slice(0, 40));
    if (f.portalIndex < 0) break;
  }
  console.log(`pause ${pause} load ${ok.ok} tabbables ${n}: ${trail.some((t) => t.startsWith('OUT')) ? 'LEAK' : 'kept'} | ${trail.join(' > ')}`);
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
