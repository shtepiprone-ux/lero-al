// Opus review 1 of Task 927 (2026-10-20): the Google slot's own box against its visible child (GR-3h trailing gap). Read-only, built Storybook.
// Usage (repository root): node docs/sessions/evidence/task927/review-1/slot-trailing-gap.mjs storybook-static
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const ROOT = resolve(process.argv[2]);
const T = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2' };
const server = createServer(async (req, res) => { const p = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url,'http://x').pathname)); if (p!==ROOT && !p.startsWith(ROOT+sep)) {res.writeHead(404);return res.end();} try { const b = await readFile(p.endsWith(sep)||p===ROOT?join(p,'index.html'):p); res.writeHead(200,{'content-type':T[extname(p)]||'application/octet-stream'}); res.end(b);} catch {res.writeHead(404);res.end();} }).listen(0);
const port = server.address().port;
const TRIG = ':scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)';
const browser = await chromium.launch();
const measure = () => {
  const out = [];
  for (const alert of document.querySelectorAll('.mantine-Alert-root, [role="status"]')) {
    // the slot Stack is the nearest Stack ancestor that also holds a [hidden] host
    let slot = alert.parentElement; while (slot && !(slot.classList.contains('mantine-Stack-root') && slot.querySelector('[hidden]'))) slot = slot.parentElement;
    if (!slot) continue;
    const a = alert.getBoundingClientRect(), s = slot.getBoundingClientRect();
    const kids = [...slot.children].map(k => { const r = k.getBoundingClientRect(); return { tag: k.className.split(' ')[0] || k.tagName, top: Math.round(r.top - s.top), h: Math.round(r.height) }; });
    const parent = slot.parentElement, pr = parent.getBoundingClientRect(), pcs = getComputedStyle(parent);
    const next = slot.nextElementSibling ? slot.nextElementSibling.getBoundingClientRect() : null;
    out.push({ which: alert.matches('[role=status]') ? 'loader' : 'alert', slotH: Math.round(s.height), markH: Math.round(a.height), trailingInsideSlot: Math.round(s.bottom - a.bottom), slotRowGap: getComputedStyle(slot).rowGap, kids,
      parentRowGap: pcs.rowGap, gapToNextSibling: next ? Math.round(next.top - a.bottom) : null, alertToParentBottom: Math.round(pr.bottom - a.bottom), parentPadBottom: pcs.paddingBottom });
  }
  return out;
};
for (const [id, click] of [['patterns-mantine-googlesigninslot--unavailable'], ['patterns-mantine-googlesigninslot--loading'], ['patterns-mantine-googlesigninslot--unavailable-reauth'], ['mantine-primitives-modal--delete-confirm-password', TRIG]]) {
  for (const width of [320, 1440]) {
    const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
    await page.goto(`http://localhost:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:en`);
    await page.waitForSelector(click ? '#storybook-root button' : '#storybook-root .mantine-Alert-root, #storybook-root [role=status]', { timeout: 30000 });
    if (click) { await page.locator('#storybook-root').locator(click).click(); await page.waitForSelector('[data-portal="true"] .mantine-Alert-root', { timeout: 15000 }); await page.waitForTimeout(600); }
    console.log(JSON.stringify({ id, width, m: await page.evaluate(measure) }));
    await page.close();
  }
}
await browser.close(); server.close();
