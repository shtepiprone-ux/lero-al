import { chromium } from 'playwright';

const BASE = 'http://localhost:6100';
const WIDTHS = [320, 390, 768, 1440];
const STORY = 'patterns-mantine-admindashboardview--default';

const browser = await chromium.launch();
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto(`${BASE}/iframe.html?id=${STORY}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const sizes = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => {
      const cs = getComputedStyle(el);
      results.push({ tag: el.tagName, text: el.textContent?.slice(0, 40), fontSize: cs.fontSize });
    });
    return results;
  });
  console.log(`\n--- ${width}px ---`);
  for (const s of sizes) console.log(`  ${s.tag} "${s.text}" fontSize=${s.fontSize}`);
  await page.close();
}
await browser.close();
