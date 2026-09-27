import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1600 });
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(600);

async function linkHref(label, text) {
  const link = page.locator('a', { hasText: text }).first();
  const count = await link.count();
  if (count === 0) { console.log(`${label}: NOT FOUND`); return; }
  const href = await link.getAttribute('href');
  console.log(`${label}: ${href}`);
}

await linkHref('ADM-02 StatCard (Complaints in progress)', 'Complaints in progress');
await linkHref('ADM-02 worklist footer (All reports)', 'All reports');
await linkHref('ADM-06 worklist footer (All tickets)', 'All tickets');

await browser.close();
