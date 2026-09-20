#!/usr/bin/env node
/**
 * combobox-consumers.mjs — Task 845 Revision 2, X3 (review 2 finding F11).
 *
 * Captures rendered evidence for every `MantineCombobox` consumer Story from a built
 * `storybook-static/`, at widths 360 and 1440 and locales en and uk, and writes one JSON per arm.
 * Each control found (`.mantine-TextInput-root`) records: its own width, its parent's width (the
 * component's outer `Box`), and where `document.elementFromPoint` lands at the exact centre of the
 * right section (the chevron): the `<input>`, the bare `<svg>`, or another node in the wrapper.
 *
 *   node combobox-consumers.mjs capture <before|after>   → combobox-consumers.<arm>.json + PNGs
 *   node combobox-consumers.mjs diff                     → combobox-consumers.json (both arms + deltas)
 *
 * BEFORE arm = `MantineCombobox.tsx` at HEAD (planted by the caller, Storybook rebuilt).
 * AFTER  arm = the working-tree `MantineCombobox.tsx` (Storybook rebuilt).
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const OUT_DIR = __dirname;
const PORT = 6397;

const TITLES = [
  'Mantine/Primitives/Combobox',
  'Mantine/Primitives/PhoneField',
  'Mantine/Primitives/RangeDatePicker',
  'Mantine/Primitives/FilterControls',
  'Mantine/Primitives/LocationComboboxSubPanel',
  'Patterns/Mantine/ListingsFilterBar',
  'Patterns/Mantine/ListingsSortBar',
];
const WIDTHS = [360, 1440];
const LOCALES = ['en', 'uk'];
const VIEWPORT_HEIGHT = 900;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.map': 'application/json',
};

function startStaticServer() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(STATIC_DIR, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.on('error', reject);
    server.listen(PORT, () => resolvePromise(server));
  });
}

async function resolveStories() {
  const index = JSON.parse(await readFile(join(STATIC_DIR, 'index.json'), 'utf8'));
  const stories = Object.values(index.entries).filter((e) => e.type === 'story' && TITLES.includes(e.title));
  stories.sort((a, b) => (a.id < b.id ? -1 : 1));
  return stories.map((s) => ({ id: s.id, title: s.title, name: s.name }));
}

function measureInPage() {
  const describe = (el) => (el ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''}` : null);
  const roots = Array.from(document.querySelectorAll('.mantine-TextInput-root'));
  return roots.map((root, index) => {
    const rect = root.getBoundingClientRect();
    const parent = root.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : null;
    const section = root.querySelector('.mantine-TextInput-section[data-position="right"]');
    let chevronHit = 'no-right-section';
    let chevronPoint = null;
    if (section) {
      // `elementFromPoint` returns null outside the viewport, so bring each chevron into view first
      // (widths above were read before scrolling and are unaffected by it).
      section.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = section.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      chevronPoint = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
      const hit = document.elementFromPoint(x, y);
      if (!hit) chevronHit = 'nothing';
      else if (hit.tagName === 'INPUT') chevronHit = 'input';
      else if (hit.closest('svg') && section.contains(hit)) chevronHit = 'svg';
      else if (hit.closest('.mantine-TextInput-wrapper') && root.contains(hit)) chevronHit = `other-in-wrapper:${describe(hit)}`;
      else chevronHit = `outside:${describe(hit)}`;
    }
    return {
      index,
      rootWidth: Math.round(rect.width * 100) / 100,
      parentWidth: parentRect ? Math.round(parentRect.width * 100) / 100 : null,
      parent: describe(parent),
      chevronPoint,
      chevronHit,
    };
  });
}

async function capture(arm) {
  if (arm !== 'before' && arm !== 'after') throw new Error('arm must be before|after');
  const stories = await resolveStories();
  console.log(`ARM ${arm}: ${stories.length} stories resolved from storybook-static/index.json`);
  for (const s of stories) console.log(`  ${s.id}  (${s.title} / ${s.name})`);
  const pngDir = join(OUT_DIR, 'combobox', arm);
  await mkdir(pngDir, { recursive: true });
  const server = await startStaticServer();
  const browser = await chromium.launch();
  const cells = {};
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: VIEWPORT_HEIGHT } });
      const page = await context.newPage();
      for (const story of stories) {
        for (const locale of LOCALES) {
          const url = `http://localhost:${PORT}/iframe.html?id=${story.id}&viewMode=story&globals=locale:${locale}`;
          await page.goto(url, { waitUntil: 'load' });
          await page.waitForFunction(() => {
            const root = document.querySelector('#storybook-root');
            return root && root.children.length > 0;
          }, null, { timeout: 30000 });
          await page.waitForTimeout(900);
          const controls = await page.evaluate(measureInPage);
          const key = `${story.id}|${width}|${locale}`;
          const png = `${story.id}__${width}__${locale}.png`;
          await page.screenshot({ path: join(pngDir, png), fullPage: true });
          cells[key] = { storyId: story.id, width, locale, controlCount: controls.length, controls, screenshot: `combobox/${arm}/${png}` };
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  const out = { arm, viewportHeight: VIEWPORT_HEIGHT, widths: WIDTHS, locales: LOCALES, stories, cells };
  await writeFile(join(OUT_DIR, `combobox-consumers.${arm}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`ARM ${arm}: ${Object.keys(cells).length} cells written`);
}

async function diff() {
  const before = JSON.parse(await readFile(join(OUT_DIR, 'combobox-consumers.before.json'), 'utf8'));
  const after = JSON.parse(await readFile(join(OUT_DIR, 'combobox-consumers.after.json'), 'utf8'));
  const keys = Array.from(new Set([...Object.keys(before.cells), ...Object.keys(after.cells)])).sort();
  const deltas = [];
  const missing = [];
  for (const key of keys) {
    const b = before.cells[key];
    const a = after.cells[key];
    if (!b || !a) { missing.push({ key, inBefore: !!b, inAfter: !!a }); continue; }
    if (b.controlCount !== a.controlCount) deltas.push({ key, kind: 'controlCount', before: b.controlCount, after: a.controlCount });
    const n = Math.min(b.controls.length, a.controls.length);
    for (let i = 0; i < n; i++) {
      const bc = b.controls[i];
      const ac = a.controls[i];
      const fields = [];
      if (bc.rootWidth !== ac.rootWidth) fields.push(['rootWidth', bc.rootWidth, ac.rootWidth]);
      if (bc.parentWidth !== ac.parentWidth) fields.push(['parentWidth', bc.parentWidth, ac.parentWidth]);
      if (bc.chevronHit !== ac.chevronHit) fields.push(['chevronHit', bc.chevronHit, ac.chevronHit]);
      for (const [field, bv, av] of fields) {
        deltas.push({ key, storyId: b.storyId, width: b.width, locale: b.locale, control: i, field, before: bv, after: av });
      }
    }
  }
  const at = (w) => deltas.filter((d) => d.width === w);
  const summary = {
    cellsBefore: Object.keys(before.cells).length,
    cellsAfter: Object.keys(after.cells).length,
    cellsCompared: keys.length - missing.length,
    missing,
    deltaCount: deltas.length,
    deltasAt360ByStory: Object.fromEntries(
      Array.from(new Set(at(360).map((d) => d.storyId))).sort().map((id) => [id, at(360).filter((d) => d.storyId === id).length]),
    ),
    deltasAt1440: at(1440),
  };
  const out = { stories: after.stories, summary, deltas, before: before.cells, after: after.cells };
  await writeFile(join(OUT_DIR, 'combobox-consumers.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

const [, , mode, arg] = process.argv;
if (mode === 'capture') await capture(arg);
else if (mode === 'diff') await diff();
else { console.error('usage: combobox-consumers.mjs capture <before|after> | diff'); process.exit(2); }
