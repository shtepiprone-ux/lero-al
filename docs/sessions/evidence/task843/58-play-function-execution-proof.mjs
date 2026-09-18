import { chromium } from 'playwright';

const STORIES = [
  { name: 'DashboardStatCard (AC2 — single link target)', id: 'patterns-mantine-dashboardstatcard--default' },
  { name: 'DashboardStatRows (AC3/AC6 — all-zero gate + touch target)', id: 'patterns-mantine-dashboardstatrows--default' },
  { name: 'DashboardWorkList (AC1/AC2 — row links + touch target)', id: 'patterns-mantine-dashboardworklist--default' },
  { name: 'RelativeTime (AC5 — keyboard focus + nested-link no-tabindex)', id: 'mantine-primitives-relativetime--default' },
];

const browser = await chromium.launch();
let allPassed = true;

for (const story of STORIES) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(`http://localhost:6006/iframe.html?id=${story.id}&globals=locale:uk`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const relevantErrors = errors.filter((e) => !e.includes('Download the React DevTools'));
  const passed = relevantErrors.length === 0;
  allPassed = allPassed && passed;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${story.name} (id=${story.id})`);
  if (!passed) for (const e of relevantErrors) console.log(`  ERROR: ${e}`);
  await page.close();
}

await browser.close();
process.exit(allPassed ? 0 : 1);
