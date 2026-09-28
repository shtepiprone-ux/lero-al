// Task 889 Review 1 remediation (§16.3, AC5/F2) — loads `Grouped` and `Horizontal` 10 times each in
// each of the four locales (80 loads total), replaying check-locale-leak.mjs's own exact navigation
// shape (page.goto waitUntil:'networkidle', then a bare 300ms settle, nothing else), and counts how
// many show Storybook's error boundary ("The component failed to render properly").
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6009';
const STORIES = ['patterns-mantine-dashboardbarchart--grouped', 'patterns-mantine-dashboardbarchart--horizontal'];
const LOCALES = ['en', 'sq', 'uk', 'it'];
const REPEATS_PER_LOCALE = 10;

const browser = await chromium.launch();
let failures = 0;
let total = 0;

for (const storyId of STORIES) {
  for (const locale of LOCALES) {
    for (let i = 0; i < REPEATS_PER_LOCALE; i++) {
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
          console.log(`FAIL  ${storyId} [${locale}] run ${i + 1}/${REPEATS_PER_LOCALE} — error boundary shown`);
        } else {
          console.log(`PASS  ${storyId} [${locale}] run ${i + 1}/${REPEATS_PER_LOCALE}`);
        }
      } catch (e) {
        failures++;
        console.log(`ERROR ${storyId} [${locale}] run ${i + 1}/${REPEATS_PER_LOCALE} — ${e.message}`);
      } finally {
        await page.close();
      }
    }
  }
}

await browser.close();
console.log(`\n${total - failures}/${total} clean (no error boundary)`);
process.exit(failures > 0 ? 1 : 0);
