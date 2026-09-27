import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
const resp = await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 20000 }).catch((e) => {
  console.log('goto error:', e.message);
  return null;
});
console.log('status', resp?.status());
console.log('url', page.url());
const bodyText = await page.textContent('body').catch(() => null);
console.log('bodyText snippet:', bodyText?.slice(0, 400));
await browser.close();
