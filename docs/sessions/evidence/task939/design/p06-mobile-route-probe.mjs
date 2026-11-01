// Task 939 design probe: below the 640px gate the RangeDatePicker renders MobileBody (no Next arrow; all months of
// its window; a Confirm button). Proves the planned mobile branch of the CustomRangeTooLong play function on the
// probe Storybook build (p03 stub, CI-equivalent env): open the picker, press Enter on 2026-01-05, Enter on
// 2026-05-05, Enter on Confirm, then read the role="alert" text. Driven on the CustomOpen story: its play passes at
// every viewport in CI and leaves the picker open (anchor 2026-09; the mobile window starts 12 months earlier, so
// 2026-01-05 and 2026-05-05 are rendered). CustomRangeTooLong itself cannot be driven: its failing play leaves the
// Storybook error overlay over the canvas. Same component, same picker props except the initial range.
// Usage: node p06-mobile-route-probe.mjs <storybook dir> <repo root>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [dir, root] = process.argv.slice(2).map(p => path.resolve(p));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch();
const id = 'patterns-mantine-dashboardperiodcontrol--custom-open';
for (const width of [320, 375, 639, 640, 1280]) {
  for (const locale of ['en', 'sq', 'uk', 'it']) {
    const msg = JSON.parse(fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8'));
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(sid => { const r = window.__STORYBOOK_PREVIEW__?.currentRender; return r?.id === sid && ['finished', 'errored'].includes(r.phase); }, id, { timeout: 20000 });
    const below = await page.evaluate(() => window.matchMedia('(max-width: 39.99375em)').matches);
    await page.waitForSelector('[data-date="2026-09-17"]', { timeout: 5000 }); // rendered by both bodies
    const hasNext = await page.getByRole('button', { name: msg.common.aria_next, exact: true }).count();
    const confirm = page.getByRole('button', { name: msg.common.confirm, exact: true });
    const hasConfirm = await confirm.count();
    let alertText = '(desktop branch not driven)';
    if (below) {
      for (const d of ['2026-01-05', '2026-05-05']) { await page.focus(`[data-date="${d}"]`); await page.keyboard.press('Enter'); }
      await confirm.focus(); await page.keyboard.press('Enter');
      alertText = await page.getByRole('alert').first().textContent({ timeout: 5000 }).catch(() => '(no alert)');
    }
    const expected = msg.dashboard.period.error_longer_than_90_days;
    const verdict = below ? (alertText === expected && hasNext === 0 && hasConfirm === 1 ? 'PASS' : 'FAIL') : (hasNext === 1 && hasConfirm === 0 ? 'DESKTOP' : 'FAIL');
    console.log(`${verdict} width=${width} locale=${locale} belowGate=${below} nextButtons=${hasNext} confirmButtons=${hasConfirm} alert=${JSON.stringify(alertText)}`);
    await page.close();
  }
}
await browser.close(); server.close();
