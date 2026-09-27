import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1600 });
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(600);
console.log('landed at', page.url());

// Recent-listings row -> preview modal (Epic K §11).
const heading = page.locator('h2', { hasText: 'Recent listings' });
const cardCount = await heading.count();
console.log('Recent listings heading found:', cardCount);
if (cardCount > 0) {
  const card = heading.locator('xpath=ancestor::*[contains(@class,"Card-root")][1]');
  const rowButtons = card.locator('button[type="button"]');
  const rowCount = await rowButtons.count();
  console.log('recent-listing row buttons:', rowCount);
  if (rowCount > 0) {
    const firstRow = rowButtons.first();
    const rowText = (await firstRow.textContent())?.trim().slice(0, 60);
    await firstRow.click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ timeout: 5000 });
    const dialogText = (await dialog.textContent())?.slice(0, 300);
    console.log('Modal opened for row:', rowText);
    console.log('Modal content:', dialogText);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else {
    console.log('No recent-listing rows in live data — cannot open modal live (real DB has 0 listings).');
  }
}

// Per-block link URLs.
async function linkHref(label, text) {
  const link = page.locator('a', { hasText: text }).first();
  const count = await link.count();
  if (count === 0) { console.log(`${label}: NOT FOUND (0 matches for "${text}")`); return; }
  const href = await link.getAttribute('href');
  console.log(`${label}: ${href}`);
}

await linkHref('ADM-01 StatCard (On moderation)', 'On moderation');
await linkHref('ADM-06 StatCard (Unassigned tickets)', 'Unassigned tickets');
await linkHref('ADM-01 worklist footer (Whole queue)', 'Whole queue');
await linkHref('Recent listings header link (All listings)', 'All listings');

await browser.close();
