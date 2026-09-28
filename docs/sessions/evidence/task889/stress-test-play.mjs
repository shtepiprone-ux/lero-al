// Task 889 — stress-tests the exact failure mode check:locale-leak:mantine-only surfaced: Storybook's
// own automatic play() execution racing against the async ApexCharts dynamic-import + draw. Replays
// check-locale-leak.mjs's own navigation shape (page.goto waitUntil:'networkidle', then a short
// settle wait, then check the story canvas) N times per story, under whatever system load is present
// right now, and reports whether Storybook's error boundary ("component failed to render properly")
// ever appears — that text is what a thrown play() (parameters.throwPlayFunctionExceptions: true)
// replaces the canvas with.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6009';
const STORIES = [
  'patterns-mantine-dashboardsparkline--default',
  'patterns-mantine-dashboardsparkline--all-zero',
  'patterns-mantine-dashboardbarchart--grouped',
  'patterns-mantine-dashboardbarchart--horizontal',
];
const REPEATS = 8;
const LOCALES = ['en', 'sq', 'uk', 'it'];

const browser = await chromium.launch();
let failures = 0;
let total = 0;

for (const storyId of STORIES) {
  for (let i = 0; i < REPEATS; i++) {
    const locale = LOCALES[i % LOCALES.length];
    const page = await browser.newPage();
    total++;
    try {
      const url = `${BASE}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(300); // exactly check-locale-leak.mjs's own settle wait
      const bodyText = await page.evaluate(() => document.body.innerText);
      const crashed = bodyText.includes('The component failed to render properly');
      if (crashed) {
        failures++;
        console.log(`FAIL  ${storyId} [${locale}] run ${i + 1}/${REPEATS} — error boundary shown`);
      } else {
        console.log(`PASS  ${storyId} [${locale}] run ${i + 1}/${REPEATS}`);
      }
    } catch (e) {
      failures++;
      console.log(`ERROR ${storyId} [${locale}] run ${i + 1}/${REPEATS} — ${e.message}`);
    } finally {
      await page.close();
    }
  }
}

await browser.close();
console.log(`\n${total - failures}/${total} clean (no error boundary)`);
process.exit(failures > 0 ? 1 : 0);
