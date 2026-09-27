import { chromium } from 'playwright';

const BASE = 'http://localhost:6102';
const WIDTHS = [320, 390, 1024, 1440];
const STORIES = [
  'patterns-mantine-admindashboardrecentlistings--default',
  'patterns-mantine-admindashboardrecentlistings--modal-open',
  'patterns-mantine-admindashboardrecentlistings--empty',
];

const browser = await chromium.launch();
for (const storyId of STORIES) {
  console.log(`\n=== ${storyId} ===`);
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${BASE}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const card = document.querySelector('[class*="Card-root"], [class*="mantine-Card-root"]');
      const cardRect = card?.getBoundingClientRect();
      return { scrollWidth, clientWidth, cardWidth: cardRect?.width };
    });
    console.log(`  ${width}px: scrollWidth=${data.scrollWidth} clientWidth=${data.clientWidth} overflow=${data.scrollWidth > data.clientWidth} cardWidth=${data.cardWidth}`);
    await page.close();
  }
}
await browser.close();
