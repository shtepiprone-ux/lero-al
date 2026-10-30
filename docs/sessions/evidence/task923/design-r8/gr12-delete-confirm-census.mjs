// Task 923 R46 design (Opus, 2026-10-18) - GR-12 element-parity census of "the confirmation step of a destructive action"
// (MantineDeleteConfirmModal), with one form-dialog Story as the reference for a field inside a dialog. Derived from gr12-form-dialog-census.mjs. Measures every existing Story of that meaning on the built Storybook,
// in the portal root, at 1440 and 390, locale en. Read-only: serves storybook-static/ from a local port.
// Usage (repository root): node docs/sessions/evidence/task923/design-r8/gr12-delete-confirm-census.mjs docs/sessions/evidence/task923/design-r8/gr12
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const ROOT = resolve('storybook-static');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { res.writeHead(404); return res.end(); }
  try { const body = await readFile(path.endsWith(sep) || path === ROOT ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const STORIES = [
  'mantine-primitives-modal--delete-confirm',
  'patterns-mantine-adminuserprofiledialogsview--delete',
  'patterns-mantine-adminuserprofiledialogsview--deactivate',
  'patterns-mantine-adminuserprofiledialogsview--unsaved',
  'patterns-mantine-adminuserprofiledialogsview--clear-row',
  'mantine-primitives-modal--form',
];
const measure = () => {
  const px = v => Math.round(parseFloat(v) * 10) / 10;
  const portals = [...document.querySelectorAll('[data-portal="true"]')];
  const content = portals.map(p => p.querySelector('.mantine-Modal-content, .mantine-Drawer-content')).find(Boolean);
  if (!content) return { found: false, portals: portals.length };
  const cs = getComputedStyle(content); const box = content.getBoundingClientRect();
  const title = content.querySelector('.mantine-Modal-title, .mantine-Drawer-title, h2, [class*="title" i]');
  const close = content.querySelector('.mantine-Modal-close, .mantine-Drawer-close, button[aria-label]');
  const labels = [...content.querySelectorAll('label')];
  const inputs = [...content.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea')];
  const wrappers = [...content.querySelectorAll('.mantine-InputWrapper-root, .mantine-TextInput-root, .mantine-Textarea-root, .mantine-Select-root')];
  const gaps = wrappers.slice(1).map((w, i) => Math.round(w.getBoundingClientRect().top - wrappers[i].getBoundingClientRect().bottom));
  const buttons = [...content.querySelectorAll('button')].filter(b => b !== close && b.getBoundingClientRect().height > 0 && b.textContent.trim());
  const footerButtons = buttons.slice(-2).map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  return {
    found: true, kind: content.className.includes('Drawer') ? 'drawer' : 'modal',
    width: Math.round(box.width), radius: cs.borderRadius, viewport: innerWidth,
    title: title ? { text: title.textContent.trim().slice(0, 60), fontSize: px(getComputedStyle(title).fontSize), fontWeight: getComputedStyle(title).fontWeight } : null,
    close: close ? { w: Math.round(close.getBoundingClientRect().width), h: Math.round(close.getBoundingClientRect().height) } : null,
    labels: labels.slice(0, 4).map(l => ({ fontSize: px(getComputedStyle(l).fontSize), fontWeight: getComputedStyle(l).fontWeight, color: getComputedStyle(l).color })),
    inputs: inputs.slice(0, 4).map(i => ({ tag: i.tagName.toLowerCase(), h: Math.round(i.getBoundingClientRect().height), radius: getComputedStyle(i).borderRadius, fontSize: px(getComputedStyle(i).fontSize) })),
    fieldGaps: gaps,
    footer: footerButtons,
    footerStacked: footerButtons.length === 2 ? footerButtons[0].y !== footerButtons[1].y : null,
    primaryColor: buttons.length ? getComputedStyle(buttons[buttons.length - 1]).backgroundColor : null,
  };
};

const browser = await chromium.launch();
const rows = [];
for (const id of STORIES) for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const url = `http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:en`;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    if (!(await page.locator('[data-portal="true"] .mantine-Modal-content, [data-portal="true"] .mantine-Drawer-content').count())) {
      const trigger = page.locator('#storybook-root button').first();
      if (await trigger.count()) { await trigger.click().catch(() => null); await page.waitForTimeout(1200); }
    }
    rows.push({ id, width, ...(await page.evaluate(measure)) });
  } catch (error) { rows.push({ id, width, error: error.message.split('\n')[0] }); }
  await ctx.close();
}
await browser.close();
server.close();
writeFileSync(join(OUT, 'gr12-delete-confirm-census.json'), JSON.stringify(rows, null, 2) + '\n');
for (const r of rows) console.log(JSON.stringify(r));
