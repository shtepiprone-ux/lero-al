import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6130';
const STORY_ID = 'patterns-mantine-dashboardstatcard--accent';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
await page.waitForSelector('.mantine-Card-root', { timeout: 10000 });
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
  const card = document.querySelector('.mantine-Card-root');
  const cs = getComputedStyle(card);
  const rect = card.getBoundingClientRect();
  // sample via an offscreen canvas drawing the element's background using html2canvas-free approach:
  // just report computed style + rect; pixel sampling is done by the outer screenshot instead.
  return { backgroundImage: cs.backgroundImage, backgroundColor: cs.backgroundColor, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
