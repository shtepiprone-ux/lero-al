import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });

// Confirm the plant reverted cleanly: all cards should read data again (no error text).
{
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('post-revert contains error text:', bodyText.includes('Something went wrong'));
  await page.close();
}

// Open the preview modal (Recent listings row).
{
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  const rowButtons = await page.$$('button[type="button"]');
  let opened = false;
  for (const btn of rowButtons) {
    const text = await btn.textContent();
    if (text && text.trim().length > 3) {
      await btn.click();
      const dialog = await page.waitForSelector('[role="dialog"]', { timeout: 3000 }).catch(() => null);
      if (dialog) { opened = true; console.log('Preview modal opened for row:', text.trim().slice(0, 40)); break; }
    }
  }
  console.log('modal opened:', opened);
  await page.close();
}

// Click one link per block, record the resulting URL.
const targets = [
  { name: 'ADM-01 StatCard (On moderation)', selector: 'a', textMatch: /On moderation/i, parent: true },
];

async function clickAndRecord(label, findFn) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  const href = await findFn(page);
  console.log(`${label}: ${href}`);
  await page.close();
}

await clickAndRecord('ADM-01 card link (On moderation)', async (page) => {
  const link = await page.locator('a', { hasText: 'On moderation' }).first();
  return link.getAttribute('href').catch(() => null);
});

await clickAndRecord('ADM-06 card link (Unassigned tickets)', async (page) => {
  const link = await page.locator('a', { hasText: 'Unassigned tickets' }).first();
  return link.getAttribute('href').catch(() => null);
});

await clickAndRecord('Recent listings "All listings" link', async (page) => {
  const link = await page.locator('a', { hasText: 'All listings' }).first();
  return link.getAttribute('href').catch(() => null);
});

await clickAndRecord('ADM-01 work list footer "Whole queue"', async (page) => {
  const link = await page.locator('a', { hasText: 'Whole queue' }).first();
  return link.getAttribute('href').catch(() => null);
});

await browser.close();
