// Opus review 1 of Task 927, follow-up (2026-10-20): what the Google button in the AuthSheet Login entry shows per toolbar locale.
// Read-only. Screenshots the Google host and lists the page-side text GIS put around its iframe.
// Usage (repository root): node docs/sessions/evidence/task927/review-1/login-google-shot.mjs storybook-static <outDir>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const ROOT = resolve(process.argv[2]);
const OUT = process.argv[3];
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => { const p = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)); try { const b = await readFile(p.endsWith(sep) || p === ROOT ? join(p, 'index.html') : p); res.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); } }).listen(0);
const browser = await chromium.launch();
for (const loc of ['sq', 'en', 'uk', 'it']) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 900 } })).newPage();
  await page.goto(`http://localhost:${server.address().port}/iframe.html?id=patterns-mantine-authsheet--login&viewMode=story&globals=locale:${loc}`);
  const frame = page.locator('[data-portal="true"] form iframe').first();
  await frame.waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const f = document.querySelector('[data-portal="true"] form iframe');
    const box = f.parentElement.parentElement;
    const texts = [...box.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .map(e => { const r = e.getBoundingClientRect(); return { tag: e.tagName, text: e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) } });
    const fr = f.getBoundingClientRect();
    const hl = (f.src.match(/[?&]hl=[^&]*/) || ['none'])[0];
    return { hl, iframeTitle: f.title, iframeShown: getComputedStyle(f).display !== 'none' && fr.width > 0, iframe: { w: Math.round(fr.width), h: Math.round(fr.height) }, pageSideTexts: texts };
  });
  await frame.locator('xpath=../..').screenshot({ path: `${OUT}/google-button-${loc}.png` });
  console.log(JSON.stringify({ loc, ...info }));
  await page.close();
}
await browser.close(); server.close();
