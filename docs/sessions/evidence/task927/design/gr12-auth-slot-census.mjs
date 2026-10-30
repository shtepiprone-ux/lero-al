// Task 927 design (Opus, 2026-10-20) - GR-12 element-parity and GR-3h rhythm census of the sign-in sheet's Google slot and its
// neighbours on the built Storybook: the Google control, the e-mail Sign in button, the red error Alert, the third-party auth widget
// "not configured" note (Text role=note) and the vertical gaps between the login form's blocks. Read-only: serves storybook-static/.
// Usage (repository root): node docs/sessions/evidence/task927/design/gr12-auth-slot-census.mjs docs/sessions/evidence/task927/design
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';

const OUT = process.argv[2];
const ROOT = resolve('storybook-static');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { res.writeHead(404); return res.end(); }
  try { const body = await readFile(path.endsWith(sep) || path === ROOT ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const built = (await stat(join(ROOT, 'index.json'))).mtime.toISOString();
const STORIES = ['patterns-mantine-authsheet--login', 'patterns-mantine-authsheet--login-validation-error', 'patterns-mantine-authsheet--register', 'patterns-mantine-authsheet--captcha'];
const measure = () => {
  const portal = document.querySelector('[data-portal="true"]');
  const scope = portal || document;
  const look = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { text: el.textContent.trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), fontSize: cs.fontSize, lineHeight: cs.lineHeight, color: cs.color, bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor, radius: cs.borderTopLeftRadius, weight: cs.fontWeight }; };
  const buttons = [...scope.querySelectorAll('button.mantine-Button-root')].map(look);
  const alerts = [...scope.querySelectorAll('.mantine-Alert-root')].map(look);
  const notes = [...scope.querySelectorAll('[role="note"]')].map(look);
  const form = scope.querySelector('form');
  let gaps = null;
  if (form) { const kids = [...form.children].filter(k => k.getBoundingClientRect().height > 0); gaps = kids.slice(1).map((k, i) => Math.round(k.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom)); }
  return { portal: !!portal, buttons, alerts, notes, formGaps: gaps, formRowGap: form ? getComputedStyle(form).rowGap : null };
};
const browser = await chromium.launch();
const rows = [];
for (const id of STORIES) for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('[data-portal="true"] form', { timeout: 30000 });
    await page.waitForTimeout(3000);
    rows.push({ id, width, ...(await page.evaluate(measure)) });
  } catch (error) { rows.push({ id, width, error: error.message.split('\n')[0] }); }
  await ctx.close();
}
await browser.close();
server.close();
const fmt = (x) => `${x.text}; ${x.w}x${x.h}; ${x.fontSize}/${x.lineHeight}; ${x.color}; bg ${x.bg}; bd ${x.border}; r ${x.radius}; w${x.weight}`;
const lines = [
  `GR-12 / GR-3h census, sign-in sheet Google slot (Task 927 design, Opus, 2026-10-20); built Storybook ${built}; locale en`,
  `Stories compared ${STORIES.length}: ${STORIES.join(', ')}`,
  ...rows.map(r => r.error ? `${r.id} @${r.width}: ERROR ${r.error}` : [
    `${r.id} @${r.width}: portal ${r.portal}; form row-gap ${r.formRowGap}; gaps between form blocks ${JSON.stringify(r.formGaps)}`,
    ...r.buttons.map(b => `  button ${fmt(b)}`), ...r.alerts.map(a => `  alert ${fmt(a)}`), ...r.notes.map(n => `  note ${fmt(n)}`),
  ].join('\n')),
];
writeFileSync(join(OUT, 'gr12-auth-slot-census.json'), JSON.stringify({ built, rows }, null, 2) + '\n');
writeFileSync(join(OUT, 'gr12-auth-slot-summary.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
