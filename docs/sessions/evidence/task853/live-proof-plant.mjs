import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 1400 });
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

const data = await page.evaluate(() => {
  // Find the Complaints card (title "Complaints") and read its body text.
  const headings = Array.from(document.querySelectorAll('h2'));
  const complaintsHeading = headings.find((h) => h.textContent?.trim() === 'Complaints');
  const card = complaintsHeading?.closest('[class*="Card-root"], [class*="mantine-Card-root"]');
  const cardText = card?.textContent;
  const hasRetryButton = card ? Array.from(card.querySelectorAll('button')).some((b) => /retry/i.test(b.textContent || '')) : false;
  // Every other card should still show data — check the ADM-01 "Moderation queue" card is not an error.
  const moderationHeading = headings.find((h) => h.textContent?.trim() === 'Moderation queue');
  const modCard = moderationHeading?.closest('[class*="Card-root"], [class*="mantine-Card-root"]');
  const modText = modCard?.textContent?.slice(0, 200);
  return { cardText, hasRetryButton, modText };
});
console.log('Complaints card text:', data.cardText);
console.log('has Retry button:', data.hasRetryButton);
console.log('Moderation queue card text (should show data):', data.modText);
await browser.close();
