// Task 927 execution (Sonnet, 2026-10-20) - GR-12 element parity, GR-3h rhythm and GR-3i/GR-3j wrap probe of the Google slot on the BUILT Storybook, over the app root and every
// portal root, at the whole canonical width matrix (both sides of the 640 switch) x sq/en/uk/it. Read-only: serves storybook-static/ and clicks only the registered triggers.
// Usage (repository root): node docs/sessions/evidence/task927/validation/gr3-probe.mjs docs/sessions/evidence/task927/validation
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';

const OUT = process.argv[2];
const ROOT = resolve('storybook-static');
const WIDTHS = [320, 375, 390, 480, 560, 639, 640, 680, 768, 1024, 1440, 1920];
const LOCALES = ['sq', 'en', 'uk', 'it'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { res.writeHead(404); return res.end(); }
  try { const body = await readFile(path.endsWith(sep) || path === ROOT ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const built = (await stat(join(ROOT, 'index.json'))).mtime.toISOString();

// the Google dialog state is opened by the registered trigger (scripts/rendered-interaction-states.json, row mantine-primitives-modal--delete-confirm-password~delete-google)
const GOOGLE_TRIGGER = ':scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)';
const CASES = [
  { id: 'patterns-mantine-authsheet--login', state: 'mount', ready: '[data-portal="true"] form' },
  { id: 'patterns-mantine-googlesigninslot--loading', state: 'mount', ready: '#storybook-root [role="status"]' },
  { id: 'patterns-mantine-googlesigninslot--unavailable', state: 'mount', ready: '#storybook-root .mantine-Alert-root' },
  { id: 'patterns-mantine-googlesigninslot--unavailable-reauth', state: 'mount', ready: '#storybook-root .mantine-Alert-root' },
  { id: 'mantine-primitives-modal--delete-confirm-password', state: 'delete-google', ready: '#storybook-root button', click: GOOGLE_TRIGGER, portalReady: '[data-portal="true"] .mantine-Alert-root' },
];

const measure = () => {
  const px = (n) => Math.round(n * 10) / 10;
  const roots = [['app', document.querySelector('#storybook-root')], ...[...document.querySelectorAll('[data-portal="true"]')].map((p, i) => [`portal${i + 1}`, p])];
  const result = { docOverflowX: document.documentElement.scrollWidth > window.innerWidth, roots: {} };
  for (const [name, root] of roots) {
    if (!root) continue;
    const textEls = [...root.querySelectorAll('*')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && el.getBoundingClientRect().height > 0);
    const cut = [], boxes = [];
    for (const el of textEls) {
      const cs = getComputedStyle(el);
      const clipped = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      const ellipsis = cs.textOverflow === 'ellipsis';
      const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if ((clipped && cs.display !== 'inline') || ellipsis || clamp) cut.push({ text: el.textContent.trim().slice(0, 50), clipped, ellipsis, clamp: !!clamp, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
    }
    const alerts = [...root.querySelectorAll('.mantine-Alert-root')].map((el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { text: el.textContent.trim().slice(0, 60), w: px(r.width), h: px(r.height), bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor, radius: cs.borderTopLeftRadius, font: cs.fontSize + '/' + cs.lineHeight, color: cs.color, role: el.getAttribute('role'), right: px(r.right), left: px(r.left) };
    });
    const loaders = [...root.querySelectorAll('[role="status"]')].map((el) => ({ name: el.getAttribute('aria-label'), w: px(el.getBoundingClientRect().width), h: px(el.getBoundingClientRect().height), hasLoader: !!el.querySelector('.mantine-Loader-root') }));
    const form = root.querySelector('form');
    let formGaps = null, formRowGap = null, slot = null;
    if (form) {
      const kids = [...form.children].filter((k) => k.getBoundingClientRect().height > 0);
      formGaps = kids.slice(1).map((k, i) => px(k.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom));
      formRowGap = getComputedStyle(form).rowGap;
      const googleAlert = [...form.children].find((k) => k.querySelector('.mantine-Alert-root') && !k.matches('.mantine-Alert-root') && k.querySelector('[hidden]'));
      if (googleAlert) { const r = googleAlert.getBoundingClientRect(); slot = { w: px(r.width), h: px(r.height), formW: px(form.getBoundingClientRect().width), childGap: getComputedStyle(googleAlert).rowGap }; }
    }
    // the dialog's Google section: the message and the slot are two children of one Stack gap
    const sections = [...root.querySelectorAll('.mantine-Modal-body > *, .mantine-Modal-body [class*="Stack"]')].length;
    const googleSection = [...root.querySelectorAll('.mantine-Stack-root')].filter((s) => s.querySelector('.mantine-Alert-root') && s.querySelector('p, .mantine-Text-root')).map((s) => {
      const kids = [...s.children].filter((k) => k.getBoundingClientRect().height > 0);
      return { rowGap: getComputedStyle(s).rowGap, gaps: kids.slice(1).map((k, i) => px(k.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom)), kids: kids.length };
    });
    const rr = root.getBoundingClientRect();
    result.roots[name] = { w: px(rr.width), right: px(rr.right), overflowRight: rr.right > window.innerWidth + 1, textCount: textEls.length, cut, alerts, loaders, formGaps, formRowGap, slot, googleSection, sections };
  }
  return result;
};

const browser = await chromium.launch();
const rows = [];
for (const c of CASES) for (const locale of LOCALES) for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${c.id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector(c.ready, { timeout: 30000 });
    if (c.click) {
      await page.evaluate((sel) => { const root = document.querySelector('#storybook-root'); const t = root.querySelector(sel); if (!t) throw new Error('registered trigger not found'); t.click(); }, c.click);
      await page.waitForSelector(c.portalReady, { timeout: 15000 });
    }
    await page.waitForTimeout(1500);
    rows.push({ id: c.id, state: c.state, locale, width, ...(await page.evaluate(measure)) });
  } catch (error) { rows.push({ id: c.id, state: c.state, locale, width, error: String(error.message).split('\n')[0] }); }
  await ctx.close();
}
await browser.close();
server.close();

// verdicts
const lines = [`GR-12 / GR-3h / GR-3i / GR-3j probe, Google slot (Task 927 execution); built Storybook ${built}; widths ${WIDTHS.join(',')}; locales ${LOCALES.join(',')}`];
let errors = 0, cuts = 0, overflow = 0, offRhythm = 0;
const looks = new Map();
for (const r of rows) {
  if (r.error) { errors++; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width}: ERROR ${r.error}`); continue; }
  if (r.docOverflowX) { overflow++; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width}: page horizontal overflow`); }
  for (const [name, m] of Object.entries(r.roots)) {
    if (m.overflowRight) { overflow++; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width} ${name}: root past the viewport (right ${m.right})`); }
    if (m.cut.length) { cuts += m.cut.length; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width} ${name}: CUT ${JSON.stringify(m.cut.slice(0, 3))}`); }
    if (m.formGaps && m.formRowGap) { const want = parseFloat(m.formRowGap); const bad = m.formGaps.filter((g) => Math.abs(g - want) > 0.5); if (bad.length) { offRhythm += bad.length; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width} ${name}: form gaps off the ${m.formRowGap} rhythm ${JSON.stringify(m.formGaps)}`); } }
    for (const g of m.googleSection) { const want = parseFloat(g.rowGap); const bad = g.gaps.filter((x) => Math.abs(x - want) > 0.5); if (bad.length) { offRhythm += bad.length; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width} ${name}: Google section gaps off ${g.rowGap} ${JSON.stringify(g.gaps)}`); } }
    for (const a of m.alerts) { const key = `${a.bg}|${a.border}|${a.radius}|${a.font}|${a.color}|${a.role}`; (looks.get(key) ?? looks.set(key, []).get(key)).push(`${r.id}~${r.state}@${r.width}`); if (a.right > r.width + 1 || a.left < -1) { overflow++; lines.push(`${r.id}~${r.state} ${r.locale}@${r.width}: alert past the viewport`); } }
  }
}
lines.push(`rows ${rows.length}; render errors ${errors}; page/root overflow ${overflow}; cut text elements (clipped, ellipsis or clamp) ${cuts}; gaps off the rhythm ${offRhythm}`);
lines.push(`distinct looks of the red alert across all rows: ${looks.size}`);
for (const [key, where] of looks) lines.push(`  look ${key} -> ${where.length} alerts, e.g. ${where.slice(0, 3).join(', ')}`);
writeFileSync(join(OUT, 'gr3-probe.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
writeFileSync(join(OUT, 'gr3-probe-summary.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exitCode = errors || overflow || cuts || offRhythm ? 1 : 0;
