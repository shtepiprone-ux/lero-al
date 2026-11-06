// Task 923 Revision 40, R83 AC (executor): GR-3j mobile-adaptation probe of Patterns/Mantine/CabinetEmailChangeSectionView on the built Storybook (storybook-static, read-only).
// All 11 exports x 320, 390, 639, 640, 768, 1024, 1440 x sq, en, uk, it. Per cell it records, for the app root (#storybook-root; the section opens no overlay):
//   pageOverflow      the page scrolls sideways (documentElement.scrollWidth > clientWidth)
//   pastViewport      a visible element with text lies partly outside 0..viewport width
//   cut               a visible text element with scrollWidth > clientWidth or scrollHeight > clientHeight (+0.5), an ellipsis style or a line clamp
//   smallTarget       an interactive control (button, input, textarea) whose smaller side is under the 44px touch token
//   kvSameLine        a MantineDetailList label that shares a line with its value (key-value-stack violation)
//   labelBesideField  a field label (.mantine-InputWrapper-label) that is not wholly above its input (form-stack violation)
//   actionNotFull     the submit Button is narrower than its form (the full-width action)
//   order             the vertical order of the semantic blocks, to compare with the saved mobile order
//   error             the Storybook error display is shown or the root is empty
// usage (repository root): node docs/sessions/evidence/task923/r40-05-gr3j-probe.mjs <out.jsonl> [W=320,390,...] [L=sq,en,uk,it] [IDS=csv]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('package.json'));
const { chromium } = require('playwright');
const OUT = process.argv[2];
const ROOT = path.resolve('storybook-static');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' });
    res.end(d);
  });
}).listen(0);
const port = server.address().port;

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
const TITLE = 'Patterns/Mantine/CabinetEmailChangeSectionView';
const IDS = process.env.IDS ? process.env.IDS.split(',') : Object.values(index.entries).filter((x) => x.type === 'story' && x.title === TITLE).map((x) => x.id);
const WIDTHS = (process.env.W ?? '320,390,639,640,768,1024,1440').split(',').map(Number);
const LOCALES = (process.env.L ?? 'sq,en,uk,it').split(',');
const jobs = [];
for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCALES) jobs.push({ id, w, loc });

const browser = await chromium.launch();
fs.writeFileSync(OUT, '');
const rows = [];

async function run({ id, w, loc }) {
  const page = await browser.newPage({ viewport: { width: w, height: 1600 }, deviceScaleFactor: 1 });
  let row;
  try {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' });
    await page.waitForFunction(() => { const r = document.querySelector('#storybook-root'); return r && r.textContent.trim().length > 0; }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const m = await page.evaluate((touch) => {
      const root = document.querySelector('#storybook-root') ?? document.body;
      const vw = document.documentElement.clientWidth;
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const txt = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();
      const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const all = [...root.querySelectorAll('*')].filter(vis);
      const out = { pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, pastViewport: [], cut: [], smallTarget: [], kvSameLine: [], labelBesideField: [], actionNotFull: [], order: [], latentEllipsis: [] };

      for (const e of all) {
        if (!ownText(e)) continue;
        const r = e.getBoundingClientRect();
        if (r.left < -0.5 || r.right > vw + 0.5) out.pastViewport.push(`${e.tagName.toLowerCase()} "${txt(e).slice(0, 30)}" ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`);
        const cs = getComputedStyle(e);
        const why = [];
        const clips = /hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflowY);
        // scrollWidth / scrollHeight are rounded integers: only a box that clips its content, and by more than the rounding, cuts text
        if (clips && e.scrollWidth > e.clientWidth + 0.5 && e.clientWidth > 0) why.push(`scrollW ${e.scrollWidth}>${e.clientWidth}`);
        if (clips && e.scrollHeight > e.clientHeight + 1 && e.clientHeight > 0) why.push(`scrollH ${e.scrollHeight}>${e.clientHeight}`);
        const ellipsisStyle = cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX);
        if (ellipsisStyle && (/nowrap|pre\u0008/.test(cs.whiteSpace) || e.scrollWidth > e.clientWidth + 0.5)) why.push('ellipsis');
        else if (ellipsisStyle) out.latentEllipsis.push(`${e.tagName.toLowerCase()} "${txt(e).slice(0, 30)}"`);
        const clamp = cs.getPropertyValue('-webkit-line-clamp');
        if (clamp && clamp !== 'none') why.push(`clamp ${clamp}`);
        if (why.length) out.cut.push(`${e.tagName.toLowerCase()} "${txt(e).slice(0, 30)}" ${why.join(' + ')}`);
      }

      for (const e of root.querySelectorAll('button, input:not([type=hidden]), textarea, [role=button]')) {
        if (!vis(e)) continue;
        // the touch area of an input in Mantine's bordered `.mantine-Input-wrapper` is the wrapper (the census's own rule, fixture bordered-input-wrapper)
        const box = e.matches('input, textarea') ? (e.closest('.mantine-Input-wrapper') ?? e) : e;
        const r = box.getBoundingClientRect();
        if (Math.min(r.width, r.height) < touch - 0.5) out.smallTarget.push(`${e.tagName.toLowerCase()}${e.type ? '[' + e.type + ']' : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.getAttribute('aria-label') || e.placeholder || txt(e)).slice(0, 24)}"`);
      }

      // key-value-stack: the label of every detail-list field is above its value
      for (const stack of root.querySelectorAll('.mantine-Stack-root')) {
        const kids = [...stack.children].filter(vis);
        if (kids.length !== 2) continue;
        const [l, v] = kids;
        if (!l.classList.contains('mantine-Text-root') || !v.classList.contains('mantine-Text-root')) continue;
        const lr = l.getBoundingClientRect(); const vr = v.getBoundingClientRect();
        if (!(lr.bottom <= vr.top + 0.5)) out.kvSameLine.push(`"${txt(l).slice(0, 20)}" | "${txt(v).slice(0, 20)}"`);
      }

      // form-stack: a label is wholly above its input
      for (const label of root.querySelectorAll('.mantine-InputWrapper-label')) {
        if (!vis(label)) continue;
        const wrap = label.closest('.mantine-InputWrapper-root');
        const input = wrap && wrap.querySelector('input, textarea');
        if (!input) continue;
        const lr = label.getBoundingClientRect(); const ir = input.getBoundingClientRect();
        if (!(lr.bottom <= ir.top + 0.5)) out.labelBesideField.push(`"${txt(label).slice(0, 24)}" bottom ${Math.round(lr.bottom)} > input top ${Math.round(ir.top)}`);
      }

      // the full-width action: the submit button spans its form
      for (const b of root.querySelectorAll('form button[type=submit]')) {
        if (!vis(b)) continue;
        const f = b.closest('form').getBoundingClientRect(); const br = b.getBoundingClientRect();
        if (Math.abs(f.width - br.width) > 1) out.actionNotFull.push(`button ${Math.round(br.width)} of form ${Math.round(f.width)}`);
      }

      // the order of the semantic blocks, top to bottom: the direct children of the section Stack (the parent of the title) in DOM order, which must also be their vertical order
      const title = [...root.querySelectorAll('.mantine-Text-root')].find(vis);
      const section = title && title.parentElement;
      const kindOf = (c) => {
        if (c === title) return 'title';
        if (c.querySelector(':scope .mantine-Text-root') && !c.querySelector('input, form') && !c.classList.contains('mantine-Alert-root') && c.classList.contains('mantine-Stack-root')) return 'current-email(label,value)';
        if (c.classList.contains('mantine-Alert-root')) return c.querySelector('.mantine-Alert-title') ? 'waiting-notice' : (c.textContent.length && /Google/.test(c.textContent) ? 'alert' : 'alert');
        if (c.tagName === 'FORM') return 'form(' + [...c.children].filter(vis).map((k) => (k.classList.contains('mantine-Alert-root') ? 'error' : k.querySelector('input[type=email]') ? 'new-email' : k.querySelector('input#cabinet-email-change-password') ? 'password' : k.matches('button[type=submit]') ? 'submit' : 'other')).join(',') + ')';
        if (c.tagName === 'BUTTON') return 'resend';
        return 'other';
      };
      const kids = section ? [...section.children].filter(vis) : [];
      out.order = kids.map(kindOf);
      const ys = kids.map((c) => c.getBoundingClientRect().top);
      if (ys.some((y, k) => k > 0 && y < ys[k - 1])) out.order.push('NOT-MONOTONIC');

      const cap = (a) => (a.length > 6 ? [...a.slice(0, 6), `...+${a.length - 6} more (${a.length} in total)`] : a);
      return {
        pageOverflow: out.pageOverflow,
        pastViewport: cap(out.pastViewport), cut: cap(out.cut), smallTarget: cap(out.smallTarget), kvSameLine: cap(out.kvSameLine), labelBesideField: cap(out.labelBesideField), actionNotFull: cap(out.actionNotFull),
        order: out.order,
        latentEllipsis: out.latentEllipsis.length,
        error: document.body.classList.contains('sb-show-errordisplay') || root.textContent.trim().length === 0,
      };
    }, 44);
    row = { id, w, loc, ...m };
  } catch (e) {
    row = { id, w, loc, runError: String(e).slice(0, 200) };
  }
  rows.push(row);
  fs.appendFileSync(OUT, JSON.stringify(row) + '\n');
  await page.close();
}

let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => { while (i < jobs.length) await run(jobs[i++]); }));
await browser.close();
server.close();

const failing = (r) => r.runError || r.error || r.pageOverflow || r.pastViewport?.length || r.cut?.length || r.smallTarget?.length || r.kvSameLine?.length || r.labelBesideField?.length || r.actionNotFull?.length;
const bad = rows.filter(failing);
console.log(`Stories ${IDS.length}; widths ${WIDTHS.join(',')}; locales ${LOCALES.join(',')}; cells ${rows.length}; failing cells ${bad.length}`);
const perRule = {};
for (const r of rows) for (const k of ['runError', 'error', 'pageOverflow', 'pastViewport', 'cut', 'smallTarget', 'kvSameLine', 'labelBesideField', 'actionNotFull']) if (r[k] && (!Array.isArray(r[k]) || r[k].length)) perRule[k] = (perRule[k] ?? 0) + 1;
console.log('cells failing per rule:', JSON.stringify(perRule));
console.log(`cells with a latent ellipsis style that clips nothing (Mantine Alert / label owners; informational): ${rows.filter((r) => r.latentEllipsis).length}`);
const orders = {};
for (const r of rows) { const key = `${r.id.split('--')[1]} :: ${(r.order ?? []).join(' > ')}`; orders[key] = (orders[key] ?? 0) + 1; }
console.log('vertical order per export (identical in every width and locale when its count is 28):');
for (const [k, n] of Object.entries(orders).sort()) console.log(`  ${n} x ${k}`);
const detail = {};
for (const r of bad) for (const k of ['pastViewport', 'cut', 'smallTarget', 'kvSameLine', 'labelBesideField', 'actionNotFull']) for (const d of r[k] ?? []) { const key = `${k} :: ${r.id.split('--')[1]} :: ${d}`; detail[key] = (detail[key] ?? 0) + 1; }
console.log('distinct findings:');
for (const [k, n] of Object.entries(detail).sort().slice(0, 80)) console.log(`  ${n} x ${k}`);
process.exit(bad.length ? 1 : 0);
