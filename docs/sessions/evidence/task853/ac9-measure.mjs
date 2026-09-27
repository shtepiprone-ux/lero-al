import { chromium } from 'playwright';

const BASE = 'http://localhost:6102';
const STORY = 'patterns-mantine-admindashboardrecentlistings--default';

const browser = await chromium.launch();

async function measure(width, locale) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/iframe.html?id=${STORY}&globals=locale:${locale}&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    // Each row's UnstyledButton is a direct child button in the recent-listings stack.
    const buttons = Array.from(document.querySelectorAll('button')).filter((b) => b.closest('[class*="Card"]') || true);
    const rows = [];
    // Find title text elements: the ones with the listing title text inside a stacked (hiddenFrom sm) or visible layout.
    document.querySelectorAll('p, span, div').forEach(() => {});
    return { scrollWidth, clientWidth, buttonCount: buttons.length };
  });

  // Row-level measurement: title element vs its column, avatar width, gap.
  const rowData = await page.evaluate(() => {
    const rowButtons = document.querySelectorAll('button[type="button"]');
    const out = [];
    for (const btn of rowButtons) {
      // Only the visible layer (hiddenFrom/visibleFrom controlled by CSS display).
      const stacks = btn.querySelectorAll(':scope > div');
      for (const stack of stacks) {
        const cs = getComputedStyle(stack);
        if (cs.display === 'none') continue;
        // Find avatar (round element) and title text within this visible layer.
        const avatar = stack.querySelector('[class*="Avatar"]');
        const titleEl = Array.from(stack.querySelectorAll('p, span')).find((el) => el.textContent && el.textContent.length > 8 && !el.querySelector('*'));
        if (!avatar || !titleEl) continue;
        const rowRect = btn.getBoundingClientRect();
        const avatarRect = avatar.getBoundingClientRect();
        const titleRect = titleEl.getBoundingClientRect();
        // The title's own parent column (its containing flex item).
        const col = titleEl.parentElement;
        const colRect = col ? col.getBoundingClientRect() : titleRect;
        out.push({
          rowWidth: rowRect.width,
          avatarWidth: avatarRect.width,
          titleWidth: titleRect.width,
          colWidth: colRect.width,
          titleText: titleEl.textContent?.slice(0, 30),
        });
        break; // one visible layer per button
      }
    }
    return out;
  });

  console.log(`\n=== ${locale} @ ${width}px ===`);
  console.log(`scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth} overflow=${result.scrollWidth > result.clientWidth}`);
  for (const r of rowData) {
    console.log(`  row: rowWidth=${r.rowWidth.toFixed(1)} avatarWidth=${r.avatarWidth.toFixed(1)} titleWidth=${r.titleWidth.toFixed(1)} colWidth=${r.colWidth.toFixed(1)} text="${r.titleText}"`);
  }
  await page.close();
}

for (const locale of ['en', 'uk']) {
  for (const width of [320, 390]) {
    await measure(width, locale);
  }
}
await browser.close();
