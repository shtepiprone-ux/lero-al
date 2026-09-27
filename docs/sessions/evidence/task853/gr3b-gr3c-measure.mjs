import { chromium } from 'playwright';

const BASE = 'http://localhost:6101';
const WIDTHS = [320, 390, 1024, 1440];
const STORIES = [
  'patterns-mantine-admindashboardview--default',
  'patterns-mantine-admindashboardrecentlistings--default',
];

const browser = await chromium.launch();
for (const storyId of STORIES) {
  console.log(`\n=== ${storyId} ===`);
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(400);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const rootRect = await page.evaluate(() => {
      const el = document.getElementById('storybook-root') || document.body.firstElementChild;
      const r = el?.getBoundingClientRect();
      return r ? { width: r.width, left: r.left } : null;
    });
    const fixedWidthNodes = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      let count = 0;
      for (const el of all) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' && style.width && /^\d+px$/.test(style.width)) count++;
      }
      return count;
    });
    console.log(
      `  ${width}px: scrollWidth=${scrollWidth} clientWidth=${clientWidth} overflow=${scrollWidth > clientWidth} root=${JSON.stringify(rootRect)}`,
    );
    await page.close();
  }
}
await browser.close();
