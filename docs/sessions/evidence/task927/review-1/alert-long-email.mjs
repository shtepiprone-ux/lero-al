// Opus review 1 of Task 927 (2026-10-20): does the canonical red Alert clip one long unbreakable token (an e-mail, as in cabinet.reauth_google_wrong_account) at 320?
// Diagnosis only: opens the registered Google state of the deletion dialog on the built Storybook and replaces the alert's message text in the live DOM (no Story edit).
// Usage (repository root): node docs/sessions/evidence/task927/review-1/alert-long-email.mjs storybook-static
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const ROOT = resolve(process.argv[2]);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => { const p = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)); try { const b = await readFile(p.endsWith(sep) || p === ROOT ? join(p, 'index.html') : p); res.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); } }).listen(0);
const TRIG = ':scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)';
const browser = await chromium.launch();
for (const width of [320, 390, 640]) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.goto(`http://localhost:${server.address().port}/iframe.html?id=mantine-primitives-modal--delete-confirm-password&viewMode=story&globals=locale:en`);
  await page.waitForSelector('#storybook-root button', { timeout: 30000 });
  await page.locator('#storybook-root').locator(TRIG).click();
  await page.waitForSelector('[data-portal="true"] .mantine-Alert-message', { timeout: 15000 });
  const r = await page.evaluate((fix) => {
    const m = document.querySelector('[data-portal="true"] .mantine-Alert-message');
    if (fix) m.style.overflowWrap = 'anywhere'; m.textContent = 'Confirm with the Google account of this profile (firstnamelastnamefamilyname.secondname@examplecompanyname.com).';
    const cs = getComputedStyle(m);
    const a = m.closest('.mantine-Alert-root').getBoundingClientRect(), body = document.querySelector('[data-portal="true"] .mantine-Modal-content, [data-portal="true"] .mantine-Drawer-content').getBoundingClientRect(); return { alertRight: Math.round(a.right), contentRight: Math.round(body.right), vw: innerWidth, docScrollX: document.documentElement.scrollWidth > innerWidth, overflow: cs.overflow, textOverflow: cs.textOverflow, whiteSpace: cs.whiteSpace, overflowWrap: cs.overflowWrap, sw: m.scrollWidth, cw: m.clientWidth, clipped: m.scrollWidth > m.clientWidth + 1, msgRight: Math.round(m.getBoundingClientRect().right) };
  }, !!process.env.FIX);
  console.log(JSON.stringify({ width, ...r }));
  await page.close();
}
await browser.close(); server.close();
