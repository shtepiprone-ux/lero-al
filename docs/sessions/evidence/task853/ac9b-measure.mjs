import { chromium } from 'playwright';

const BASE = 'http://localhost:6102';
const STORY = 'patterns-mantine-admindashboardrecentlistings--default';

const browser = await chromium.launch();
for (const width of [768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/iframe.html?id=${STORY}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const priceEls = Array.from(document.querySelectorAll('p, span')).filter((el) => /€|EUR/.test(el.textContent || ''));
    const visiblePrices = priceEls.filter((el) => getComputedStyle(el).display !== 'none' && el.offsetParent !== null);
    return { scrollWidth, clientWidth, priceCount: visiblePrices.length, priceTexts: visiblePrices.map((e) => e.textContent) };
  });
  console.log(`${width}px: scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth} visiblePrices=${result.priceCount} ${JSON.stringify(result.priceTexts)}`);
  await page.close();
}
await browser.close();
