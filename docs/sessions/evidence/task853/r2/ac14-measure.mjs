import { chromium } from 'playwright';

const BASE = 'http://localhost:6102';
const browser = await chromium.launch();

async function measureRows(width, locale) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/iframe.html?id=patterns-mantine-admindashboardrecentlistings--default&globals=locale:${locale}&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const rows = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button[type="button"]');
    const out = [];
    for (const btn of buttons) {
      const layers = btn.querySelectorAll(':scope > div');
      for (const layer of layers) {
        if (getComputedStyle(layer).display === 'none') continue;
        const timeEl = layer.querySelector('time');
        if (!timeEl) continue;
        const timeCs = getComputedStyle(timeEl);
        // Owner name: the second text line under the avatar (lineClamp 1, size xs, c gray.5).
        const texts = Array.from(layer.querySelectorAll('p, span')).filter(
          (el) => el.textContent && el.textContent.trim().length > 0 && !el.closest('[class*="Badge"]') && el.tagName !== 'TIME',
        );
        // Title is the bold (fw 600) text; owner name is the next plain (fw 400) text that does not
        // contain the <time> element and is not the badge.
        const title = texts.find((el) => getComputedStyle(el).fontWeight === '600');
        const ownerCandidates = texts.filter(
          (el) => getComputedStyle(el).fontWeight === '400' && !el.contains(timeEl) && !el.querySelector('time'),
        );
        const owner = ownerCandidates[0];
        out.push({
          timeFontSize: timeCs.fontSize,
          timeColor: timeCs.color,
          titleFontSize: title ? getComputedStyle(title).fontSize : null,
          ownerColor: owner ? getComputedStyle(owner).color : null,
          timeText: timeEl.textContent,
        });
        break;
      }
    }
    return out;
  });
  console.log(`\n=== rows @ ${width}px ${locale} ===`);
  for (const r of rows) console.log(JSON.stringify(r));
  await page.close();
}

await measureRows(320, 'uk');
await measureRows(1440, 'en');

// Modal "Created" value. The story's own `play` function only runs under Storybook's
// test-runner/interactions addon, not on a bare iframe.html load, so trigger the same click here.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/iframe.html?id=patterns-mantine-admindashboardrecentlistings--modal-open&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const firstRowButton = page.locator('button[type="button"]').first();
  await firstRowButton.click();
  await page.locator('[role="dialog"]').waitFor({ timeout: 5000 });
  const data = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'no dialog' };
    const timeEl = dialog.querySelector('time');
    const timeCs = timeEl ? getComputedStyle(timeEl) : null;
    // The price value Text beside it (sibling row) for comparison: find rows with label/value pairs.
    const rows = Array.from(dialog.querySelectorAll('div')).filter((d) => d.children.length === 2);
    let priceValueCs = null;
    for (const row of rows) {
      const label = row.children[0];
      if (label && /price/i.test(label.textContent || '')) {
        const value = row.children[1];
        priceValueCs = { fontSize: getComputedStyle(value).fontSize, fontWeight: getComputedStyle(value).fontWeight };
      }
    }
    return {
      timeFontSize: timeCs?.fontSize,
      timeFontWeight: timeCs?.fontWeight,
      timeText: timeEl?.textContent,
      priceValueCs,
    };
  });
  console.log('\n=== modal Created ===');
  console.log(JSON.stringify(data));
  await page.close();
}

await browser.close();
