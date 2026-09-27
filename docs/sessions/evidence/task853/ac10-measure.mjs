import { chromium } from 'playwright';

const BASE = 'http://localhost:6101';
const WIDTHS = [320, 390, 768, 1440];
const STORIES = [
  'patterns-mantine-admindashboardview--default',
  'patterns-mantine-dashboardheader--default',
  'patterns-mantine-dashboardheader--fresh',
  'patterns-mantine-dashboardheader--without-period-control',
  'patterns-mantine-dashboardstatcard--default',
  'patterns-mantine-dashboardstatcard--zero',
  'patterns-mantine-dashboardgrid--default',
];

const browser = await chromium.launch();
for (const storyId of STORIES) {
  console.log(`\n=== ${storyId} ===`);
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 1200 } });
    await page.goto(`${BASE}/iframe.html?id=${storyId}&globals=locale:uk&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => {
        out.push({ tag: el.tagName, text: el.textContent?.slice(0, 30), fontSize: getComputedStyle(el).fontSize });
      });
      // StatCard value: the big bold Text with fw 700.
      document.querySelectorAll('p, span').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.fontWeight === '700' && el.textContent && /^\d/.test(el.textContent.trim())) {
          out.push({ tag: 'VALUE', text: el.textContent?.slice(0, 20), fontSize: cs.fontSize });
        }
      });
      return out;
    });
    console.log(`  ${width}px:`, JSON.stringify(data));
    await page.close();
  }
}
await browser.close();
