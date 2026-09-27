import { chromium } from 'playwright';

const BASE = 'http://localhost:6102';
const WIDTHS = [320, 390, 768, 1440];
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
      const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,time'));
      let maxSize = 0;
      let maxEl = null;
      for (const el of all) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size > maxSize) { maxSize = size; maxEl = el.tagName + ':' + (el.textContent || '').slice(0, 20); }
      }
      return { maxSize, maxEl };
    });
    console.log(`  ${width}px: largestText=${data.maxSize}px (${data.maxEl})`);
    await page.close();
  }
}
await browser.close();
