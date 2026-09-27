import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
const resp = await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle', timeout: 20000 }).catch((e) => {
  console.log('goto error:', e.message);
  return null;
});
console.log('status', resp?.status());
console.log('url', page.url());
const title = await page.textContent('h1').catch(() => null);
console.log('h1:', title);
await browser.close();
