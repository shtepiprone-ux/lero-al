import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1400 });
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(500);
const bodyText = await page.evaluate(() => document.body.innerText);
const idx = bodyText.indexOf('Recent listings');
console.log(bodyText.slice(idx, idx + 500));
console.log('---all button texts---');
const buttons = await page.$$eval('button[type="button"]', (els) => els.map((e) => e.textContent?.trim().slice(0, 40)));
console.log(buttons);
await browser.close();
