// Review 6 (diagnosis only). Parallel variant of rv6-53 (10 pages at once). Does the gate measure the dashboard chart before it has finished drawing? For one registry
// state, at CPU throttle 1x and 4x, 4 trials each: load, open and waitStable exactly as the gate does, measure the app
// root, then wait 3 000ms and measure again. Prints the time waitStable took, the chart component-overflow details at
// both moments, and whether the boxes of the app root's elements changed in between (a JS-driven animation that
// `getAnimations()` cannot see).
//   node docs/sessions/evidence/task923/review-6/rv6-54-chart-settle-parallel.mjs <state-id> <locale> <width>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable, openAction } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [id, locale, width] = [process.argv[2], process.argv[3], Number(process.argv[4])];
const state = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === id);
if (!state) throw new Error(`no registry row ${id}`);
console.log(`platform ${process.platform} node ${process.version}; state ${id} @ ${locale} ${width}`);
const server = await startStaticServer('storybook-static', 6063);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6063');
const signature = () => {
  const root = document.querySelector('#storybook-root');
  let n = 0;
  let sum = 0;
  for (const e of root.querySelectorAll('*')) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    n++;
    sum += Math.round(r.left) + Math.round(r.top) * 3 + Math.round(r.width) * 7 + Math.round(r.height) * 11;
  }
  return `${n}/${sum}`;
};
const chartDetails = async (page) => {
  const m = await page.evaluate(() => window.__census.measure({ kind: 'app', index: 0, appInert: false }));
  return (m.rules['component-overflow'] ?? []).filter((d) => /apexcharts|m_6d731127/.test(d)).length;
};
// 10 pages at once in one browser, as the full run uses 10 workers; 3 rounds.
for (let round = 1; round <= 3; round++) {
  await Promise.all(Array.from({ length: 10 }, async (_, w) => {
    const page = await newMeasuringPage(browser);
    await loadStory(page, ctx, { story: state.story, locale, width });
    const o = await openAction(page, state);
    const t0 = Date.now();
    await waitStable(page, state.portals);
    const waited = Date.now() - t0;
    const s1 = await page.evaluate(signature);
    const c1 = await chartDetails(page);
    await page.waitForTimeout(3000);
    const s2 = await page.evaluate(signature);
    const c2 = await chartDetails(page);
    console.log(`round ${round} page ${w + 1}: open ${o.ok ? "ok" : "FAILED"}; waitStable ${waited}ms; chart details at return ${c1}, 3s later ${c2}; layout ${s1 === s2 ? "unchanged" : "CHANGED"}`);
    await page.close();
  }));
}
await browser.close();
await new Promise((res) => server.close(res));
