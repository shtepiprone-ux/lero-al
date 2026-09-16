// Task 822 AC5 — before/after computed-property probe for the 5 storied components (§3.6).
// Evidence-only; never imported by any gate. Run once against the unedited tree ("before") and
// once against the edited tree ("after"); the two JSON outputs must be byte-equal on every
// measured property, at 390x900 and 1440x900, locale:en.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const staticDir = 'C:/Claude_Code_Projects/lero-al/storybook-static';
const PORT = 6040;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(staticDir, decodeURIComponent(urlPath));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const WIDTHS = [390, 1440];
const results = {};

async function navigate(page, storyId, width) {
  await page.setViewportSize({ width, height: 900 });
  const url = `http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(400);
}

for (const width of WIDTHS) {
  const key = `w${width}`;
  results[key] = {};

  // FilterChoiceGroup — vertical branch (MultiToggleDemo, orientation="vertical"), row 9.
  {
    const page = await browser.newPage();
    await navigate(page, 'mantine-primitives-filtercontrols--default', width);
    const r = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-testid="filter-chip-row"]'));
      const stack = els.find((el) => el.className.includes('mantine-Stack-root'));
      return stack ? { gap: getComputedStyle(stack).gap } : { found: false };
    });
    results[key].filterChoiceGroup_verticalGap = r;
    await page.close();
  }

  // HowItWorksSteps — Title mb (row 10), SimpleGrid spacing (row 11).
  {
    const page = await browser.newPage();
    await navigate(page, 'mantine-primitives-howitworkssteps--default', width);
    const r = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const grid = document.querySelector('[class*="SimpleGrid"]');
      return {
        titleMarginBottom: h2 ? getComputedStyle(h2).marginBottom : null,
        gridColumnGap: grid ? getComputedStyle(grid).columnGap : null,
        gridRowGap: grid ? getComputedStyle(grid).rowGap : null,
      };
    });
    results[key].howItWorksSteps = r;
    await page.close();
  }

  // PhoneField — outer Stack gap (row 12), country dropdown minWidth after opening it (row 13).
  {
    const page = await browser.newPage();
    await navigate(page, 'mantine-primitives-phonefield--default', width);
    const before = await page.evaluate(() => {
      const input = document.querySelectorAll('input[type="tel"]')[0];
      let el = input;
      for (let i = 0; i < 4; i++) el = el?.parentElement ?? null;
      return el ? { gap: getComputedStyle(el).gap, className: el.className, childCount: el.children.length } : { found: false };
    });
    // Open the first country combobox trigger. MantineCombobox's `variant="button"` trigger
    // renders as a read-only `TextInput` (an `<input>`, not a `<button>`), carrying
    // `aria-label={triggerAriaLabel}` = t('phone.country') = "Country" (messages/en.json).
    let dropdownMinWidth = null;
    try {
      const trigger = page.locator('input[aria-label="Country"]').first();
      await trigger.click({ timeout: 5000 });
      await page.waitForTimeout(300);
      dropdownMinWidth = await page.evaluate(() => {
        const dd = document.querySelector('[class*="Combobox-dropdown"]');
        return dd ? { minWidth: getComputedStyle(dd).minWidth, inlineStyle: dd.getAttribute('style') } : { found: false };
      });
    } catch (err) {
      dropdownMinWidth = { error: String(err).slice(0, 200) };
    }
    results[key].phoneField = { outerStack: before, dropdown: dropdownMinWidth };
    await page.close();
  }

  // FavoriteButton — pill shape radius (row 18).
  {
    const page = await browser.newPage();
    await navigate(page, 'mantine-primitives-favoritebutton--default', width);
    const r = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[aria-label]')).filter((b) => b.className.includes('mantine-Button-root'));
      return btns.map((b) => ({ ariaLabel: b.getAttribute('aria-label'), borderRadius: getComputedStyle(b).borderRadius }));
    });
    results[key].favoriteButton_pillRadius = r;
    await page.close();
  }

  // NotificationBellView — trigger offset/mih/miw (rows 24-26), popover width/maxHeight after open (rows 27-28).
  {
    const page = await browser.newPage();
    await navigate(page, 'mantine-primitives-notificationbellview--default', width);
    const trigger = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Notifications"]');
      const indicator = btn?.closest('[class*="Indicator"]');
      return {
        mih: btn ? getComputedStyle(btn).minHeight : null,
        miw: btn ? getComputedStyle(btn).minWidth : null,
      };
    });
    let popover = null;
    try {
      await page.click('button[aria-label="Notifications"]', { timeout: 5000 });
      await page.waitForTimeout(300);
      popover = await page.evaluate(() => {
        const dropdowns = Array.from(document.querySelectorAll('[class*="Popover-dropdown"]'));
        const dd = dropdowns[dropdowns.length - 1];
        if (!dd) return { found: false };
        const inner = dd.querySelector('div[style*="max-height"]') || dd.querySelector('div');
        return {
          ddWidth: getComputedStyle(dd).width,
          innerMaxHeight: inner ? getComputedStyle(inner).maxHeight : null,
        };
      });
    } catch (err) {
      popover = { error: String(err).slice(0, 200) };
    }
    results[key].notificationBellView = { trigger, popover };
    await page.close();
  }
}

await browser.close();
await new Promise((r) => server.close(r));

console.log(JSON.stringify(results, null, 2));
