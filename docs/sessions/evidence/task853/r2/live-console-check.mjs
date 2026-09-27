import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const WIDTHS = [1440, 320];
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: 'playwright/.auth/admin-storage-state.json' });
const page = await context.newPage();

const messages = [];
page.on('console', (msg) => {
  const type = msg.type();
  if (type === 'error' || type === 'warning') {
    messages.push({ kind: `console.${type}`, text: msg.text() });
  }
});
page.on('pageerror', (err) => {
  messages.push({ kind: 'pageerror', text: err.message + '\n' + (err.stack || '') });
});

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 1400 });
  messages.push({ kind: 'nav', text: `--- navigating to /admin at ${width}px ---` });
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // AC14 live: row time/title/owner values.
  const rowData = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button[type="button"]');
    const out = [];
    for (const btn of buttons) {
      const layers = btn.querySelectorAll(':scope > div');
      for (const layer of layers) {
        if (getComputedStyle(layer).display === 'none') continue;
        const timeEl = layer.querySelector('time');
        if (!timeEl) continue;
        const timeCs = getComputedStyle(timeEl);
        const texts = Array.from(layer.querySelectorAll('p, span')).filter(
          (el) => el.textContent && el.textContent.trim().length > 0 && !el.closest('[class*="Badge"]') && el.tagName !== 'TIME',
        );
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
        });
        break;
      }
      if (out.length >= 3) break;
    }
    return out;
  });
  messages.push({ kind: `ac14-live-${width}`, text: JSON.stringify(rowData) });
}

const outPath = process.argv[2] || 'docs/sessions/evidence/task853/r2/live-console.txt';
const fs = await import('node:fs');
fs.writeFileSync(outPath, messages.map((m) => `[${m.kind}] ${m.text}`).join('\n\n'), 'utf8');
console.log(`Wrote ${messages.length} entries to ${outPath}`);
console.log('Hydration-pattern matches:', messages.filter((m) => /hydrat|did not match|server rendered|Text content does not match/i.test(m.text)).length);

await browser.close();
