import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1400 });
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(500);

// The recent-listings section is the last card ("Recent listings"); find its first row button.
const heading = page.locator('h2', { hasText: 'Recent listings' });
const card = heading.locator('xpath=ancestor::*[contains(@class,"Card-root") or contains(@class,"mantine-Card-root")][1]');
const rowButton = card.locator('button[type="button"]').first();
const rowText = await rowButton.textContent();
await rowButton.click();
const dialog = page.locator('[role="dialog"]');
await dialog.waitFor({ timeout: 3000 });
const dialogText = await dialog.textContent();
console.log('Row clicked:', rowText?.trim().slice(0, 60));
console.log('Dialog opened, text:', dialogText?.slice(0, 200));
await browser.close();
