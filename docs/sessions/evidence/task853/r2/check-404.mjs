import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
page.on('response', (resp) => {
  if (resp.status() === 404) console.log('404:', resp.url());
});
await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);
await browser.close();
