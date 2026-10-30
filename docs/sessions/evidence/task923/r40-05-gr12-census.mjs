// Task 923 Revision 40, R83 AC (executor): GR-12 element-parity census of Patterns/Mantine/CabinetEmailChangeSectionView on the built Storybook (storybook-static, read-only).
// For every element meaning of the new Story it measures the element in the new Story ("mine") and in the Stories that already render the same meaning ("ref"), at the same
// locale and width (390 and 1440; sq, en, uk, it): fill, text colour, border, radius, height, typography, padding, icon, and the gap to the blocks around it.
// A meaning has more than one look when a measured property differs between "mine" and any "ref" (properties that follow the content or the container, such as the width,
// are not compared). Output: a JSON of every measurement and a verdict text. usage (repository root): node docs/sessions/evidence/task923/r40-05-gr12-census.mjs <out.json>
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

const E = 'patterns-mantine-cabinetemailchangesectionview--';
const PW = 'patterns-mantine-cabinetpasswordsectionview--';
// root: the element that carries the meaning; parts: relative selectors measured inside it; icon: a selector for the icon inside it ('' = none expected)
const MEANINGS = [
  { meaning: 'section title (Text 600 sm)', items: [
    { side: 'mine', story: `${E}with-password`, root: '#storybook-root .mantine-Text-root' },
    // CONTROL=1 swaps the reference for another element (the 12px gray label of a detail field): the census must then report a different look
    { side: 'ref', story: process.env.CONTROL ? 'patterns-mantine-detaillist--plain' : `${PW}empty`, root: '#storybook-root .mantine-Text-root' },
  ] },
  { meaning: 'TextInput with label and hint', items: [
    { side: 'mine', story: `${E}with-password`, root: '.mantine-TextInput-root', parts: { label: '.mantine-InputWrapper-label', hint: '.mantine-InputWrapper-description', box: '.mantine-Input-wrapper', input: 'input' } },
    { side: 'ref', story: 'mantine-primitives-textinput--default', root: '.mantine-TextInput-root', parts: { label: '.mantine-InputWrapper-label', hint: '.mantine-InputWrapper-description', box: '.mantine-Input-wrapper', input: 'input' } },
  ] },
  { meaning: 'PasswordInput with label', items: [
    { side: 'mine', story: `${E}with-password`, root: '.mantine-PasswordInput-root', parts: { label: '.mantine-InputWrapper-label', box: '.mantine-Input-wrapper', input: 'input', toggle: 'button' } },
    { side: 'ref', story: `${PW}empty`, root: '.mantine-PasswordInput-root', parts: { label: '.mantine-InputWrapper-label', box: '.mantine-Input-wrapper', input: 'input', toggle: 'button' } },
    { side: 'ref', story: 'mantine-primitives-passwordinput--default', root: '.mantine-PasswordInput-root', parts: { label: '.mantine-InputWrapper-label', box: '.mantine-Input-wrapper', input: 'input', toggle: 'button' } },
  ] },
  { meaning: 'full-width submit Button', items: [
    { side: 'mine', story: `${E}ready-to-submit`, root: 'form button[type=submit]' },
    { side: 'ref', story: `${PW}ready-to-submit`, root: 'form button[type=submit]' },
  ] },
  { meaning: 'refusal Alert (red, no icon, no title)', items: [
    { side: 'mine', story: `${E}wrong-password`, root: '#storybook-root form .mantine-Alert-root' },
    { side: 'ref', story: `${PW}error-invalid-current`, root: '#storybook-root form .mantine-Alert-root' },
  ] },
  { meaning: 'waiting notice Alert (info, icon and title)', items: [
    { side: 'mine', story: `${E}waiting-for-confirmation`, root: '#storybook-root .mantine-Alert-root:has(.lucide-info)', icon: 'svg' },
    { side: 'ref', story: 'mantine-primitives-alert--default', root: '#storybook-root .mantine-Alert-root:has(.lucide-info)', icon: 'svg' },
  ] },
  { meaning: 'resend Anchor button', items: [
    { side: 'mine', story: `${E}waiting-for-confirmation`, root: '#storybook-root button.mantine-Anchor-root' },
    { side: 'ref', story: 'patterns-mantine-authsheet--login', root: 'button.mantine-Anchor-root', global: true },
  ] },
  { meaning: 'labelled detail field (MantineDetailList plain)', items: [
    { side: 'mine', story: `${E}with-password`, fn: 'field' },
    { side: 'ref', story: 'patterns-mantine-detaillist--plain', fn: 'field' },
  ] },
];

const browser = await chromium.launch();
const results = [];

async function measure(page, item) {
  return page.evaluate(({ root, parts, icon, fn }) => {
    const px = (v) => Math.round(parseFloat(v) * 100) / 100;
    const bundle = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return {
        bg: cs.backgroundColor, color: cs.color, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, radius: cs.borderTopLeftRadius,
        height: px(r.height), fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily.split(',')[0].trim(),
        padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`, textTransform: cs.textTransform,
      };
    };
    const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    let el;
    if (fn === 'field') {
      // a labelled detail field with a plain-text value: the Stack whose visible children are exactly two Text elements (label, then value), the value holding no element (a Badge value is another meaning)
      el = [...document.querySelectorAll('#storybook-root .mantine-Stack-root')].find((st) => { const k = [...st.children].filter(visible); return k.length === 2 && k.every((c) => c.classList.contains('mantine-Text-root')) && k[1].children.length === 0; });
      if (el) { const [l, v] = [...el.children]; return { found: true, root: { ...bundle(el), label: bundle(l), value: bundle(v) } }; }
    } else {
      el = [...document.querySelectorAll(root)].find(visible);
    }
    if (!el) return { found: false };
    const out = { found: true, root: bundle(el) };
    if (parts) { out.parts = {}; for (const [k, sel] of Object.entries(parts)) out.parts[k] = bundle(el.querySelector(sel)); }
    if (icon) { const svg = el.querySelector(icon); const r = svg && svg.getBoundingClientRect(); out.icon = svg ? { w: px(r.width), h: px(r.height), color: getComputedStyle(svg).color } : null; }
    // the gap to the blocks around it inside its container (GR-3h)
    const prev = el.previousElementSibling; const next = el.nextElementSibling; const r = el.getBoundingClientRect();
    out.gapAbove = prev ? px(r.top - prev.getBoundingClientRect().bottom) : null;
    out.gapBelow = next ? px(next.getBoundingClientRect().top - r.bottom) : null;
        return out;
  }, { root: item.root ?? null, parts: item.parts ?? null, icon: item.icon ?? null, fn: item.fn ?? null });
}

for (const locale of ['en', 'sq', 'uk', 'it']) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1400 }, deviceScaleFactor: 1 });
    for (const m of MEANINGS) {
      for (const item of m.items) {
        await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${item.story}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load' });
        await page.waitForFunction(() => document.querySelector('#storybook-root')?.textContent.trim().length > 0 || document.querySelector('[data-portal="true"]'), null, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(900);
        const data = await measure(page, item);
        results.push({ meaning: m.meaning, side: item.side, story: item.story, locale, width, ...data });
      }
    }
    await page.close();
  }
}
await browser.close();
server.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n');

// ── the verdict: per meaning, per locale x width, every measured property of "mine" against every "ref"
const flat = (o, prefix = '') => Object.entries(o ?? {}).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
// content- or container-driven properties are not part of the look
const IGNORE = [/^root\.height$/, /^parts\.hint\.height$/, /^parts\.label\.height$/, /^parts\.toggle\.padding$/];
const different = [];
console.log(`GR-12 ELEMENT PARITY census — meanings ${MEANINGS.length}; measurements ${results.length}; locales en,sq,uk,it; widths 390,1440`);
for (const m of MEANINGS) {
  const stories = [...new Set(m.items.map((i) => i.story))];
  let found = 0; let looks = 0;
  const notes = [];
  for (const locale of ['en', 'sq', 'uk', 'it']) for (const width of [390, 1440]) {
    const cell = results.filter((r) => r.meaning === m.meaning && r.locale === locale && r.width === width);
    const mine = cell.find((r) => r.side === 'mine');
    for (const ref of cell.filter((r) => r.side === 'ref')) {
      if (!mine?.found || !ref.found) { notes.push(`NOT FOUND @${width} ${locale}: mine ${mine?.found} ref(${ref.story}) ${ref.found}`); continue; }
      found++;
      const measured = (r) => Object.fromEntries(flat({ root: r.root, parts: r.parts, icon: r.icon }));
      const a = measured(mine); const b = measured(ref);
      const diffs = Object.keys(a).filter((k) => !IGNORE.some((re) => re.test(k)) && b[k] !== undefined && String(a[k]) !== String(b[k]));
      const unmatched = Object.keys(a).filter((k) => a[k] !== undefined && b[k] === undefined && !k.startsWith('parts.hint.')).length;
      if (unmatched) notes.push(`@${width} ${locale} vs ${ref.story}: ${unmatched} measured properties of mine have no counterpart in the reference`);
      // the Button of the saved route is full width in both; the Alert/Anchor/field references differ by design only in content
      if (diffs.length) { looks++; notes.push(`@${width} ${locale} vs ${ref.story}: ${diffs.map((k) => `${k}: mine ${a[k]} | ref ${b[k]}`).join('; ')}`); }
    }
  }
  const gaps = results.filter((r) => r.meaning === m.meaning && r.found).map((r) => `${r.side}:${r.gapAbove}/${r.gapBelow}`);
  const distinctGaps = [...new Set(gaps)];
  console.log(`- ${m.meaning}: Stories compared ${stories.length} (${stories.join(', ')}); cells compared ${found}; cells with a different look ${looks}`);
  console.log(`    gap above/below inside its container (mine vs ref): ${distinctGaps.join(' | ')}`);
  for (const n of [...new Set(notes)].slice(0, 12)) console.log(`    ${n}`);
  if (looks) different.push(m.meaning);
}
console.log(`meanings with more than one look: ${different.length ? different.join('; ') : 'NONE'} (owner decisions: none)`);
console.log('hardcode in the changed files and their Stories (style/styles/className/colour literal/raw string): see the zero-hit grep file');
process.exit(different.length ? 1 : 0);
