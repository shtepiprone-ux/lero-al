// Task 889 revision 3 (§19.3) — GR-3b/GR-3c re-measurement for `DashboardStatCard` -> `Accent`,
// re-run this pass (not carried over from rev1) at 320/390/768/1024/1440. Only the Card's background
// changed (gradient value/angle); layout/box model is unchanged from rev1/rev2, but the kickoff
// requires a fresh receipt for this pass rather than reuse.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:6130';
const STORY_ID = 'patterns-mantine-dashboardstatcard--accent';
const WIDTHS = [320, 390, 768, 1024, 1440];

async function main() {
  const browser = await chromium.launch();
  const results = {};

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mantine-Card-root', { timeout: 10000 });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => {
      const card = document.querySelector('.mantine-Card-root');
      const cardRect = card.getBoundingClientRect();
      const texts = Array.from(card.querySelectorAll('.mantine-Text-root')).slice(0, 3);
      const roles = ['label', 'value', 'caption'];
      const fontSizes = texts.map((el, i) => ({ role: roles[i], fontSize: parseFloat(getComputedStyle(el).fontSize) }));
      return {
        cardWidth: Math.round(cardRect.width),
        viewportWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        fontSizes,
      };
    });

    results[width] = data;
    await page.close();
  }

  await browser.close();
  writeFileSync('docs/sessions/evidence/task889/gr3b-gr3c-accent-rev3.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
