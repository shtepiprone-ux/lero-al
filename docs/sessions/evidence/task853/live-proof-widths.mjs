import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const WIDTHS = [1440, 1024, 768, 390, 320];

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });

for (const width of WIDTHS) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 1400 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  const data = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1,h2')).map((h) => h.textContent?.trim());
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    return { headings, scrollWidth, clientWidth };
  });
  console.log(`\n=== ${width}px ===`);
  console.log(`headings: ${JSON.stringify(data.headings)}`);
  console.log(`scrollWidth=${data.scrollWidth} clientWidth=${data.clientWidth} overflow=${data.scrollWidth > data.clientWidth}`);
  await page.screenshot({ path: `docs/sessions/evidence/task853/live-${width}.png`, fullPage: true });
  await page.close();
}
await browser.close();
