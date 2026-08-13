#!/usr/bin/env node
/**
 * task691-delta/capture-computed-styles.mjs — 691R round 3 (F-R) full-matrix pre/post
 * computed-style capture, hover envelope expanded to both card layouts. Superseded scope: the
 * 691 review's 4-tuple comparator (1 story x 1 locale x 1 viewport) could not see F-A (it used
 * `patterns-mantine-listingcardpattern--default`, which renders `DemoImage`, not the real
 * `AppImage` that carries `appImageConfig.ts`'s `hoverClass`). The round-2 160-tuple capture
 * then hovered `.card` nth(0) — the grid card — in BOTH stories, so the list/horizontal card's
 * hover envelope was never measured in either phase, and neither card root's own hover
 * `transform`/`box-shadow` was captured on either layout (F-R).
 *
 * Required scope (v4 ledger F-R, kickoff AC5/R6, R7):
 *   2 stories (mantine-primitives-listingcard--default REAL AppImage composition +
 *              patterns-mantine-listingcardpattern--default DemoImage composition)
 *   x 4 locales (sq/en/uk/it)
 *   x 5 viewports (320/375/390/768/1024)
 *   x 3 states (rest / hover-grid / hover-list)
 *   x 2 phases (before/after, this script captures ONE phase per invocation)
 *   = 240 tuples total (120 per phase).
 *
 * hover-grid hovers the plain grid card root (`.card` nth(0) in both stories — unchanged from
 * round 2). hover-list hovers the plain LIST card root: `listingcard` story index 1, `pattern`
 * story index 6 (the same indices `inPageCapture()` already uses to resolve `list.plain`).
 *
 * Every hovered state additionally captures, on the card root actually hovered: `transform` +
 * `boxShadow` (added to the existing `site162_cardList` / `site290_cardGrid` structural sites,
 * captured unconditionally at every state so rest acts as its own zero-value control). The
 * title `color` (site205_titleList / site338_titleGrid) and image `scale`/`transform`
 * (imageScaleTransformGrid / imageScaleTransformList) were already unconditional captures from
 * round 2 and needed no change.
 *
 * BEFORE mode locates each site's host element structurally via the CURRENT-AT-BASE literal
 * Tailwind class token(s). AFTER mode locates the same element via the NEW CSS-Modules-hashed
 * class, resolved through a document.styleSheets text scan for the readable substring CSS
 * Modules keeps in the hash (`_<name>_<hash>_<line>`) — same technique as Task 702/688/691.
 *
 * R7 — every tuple captures the real photo element's `scale` AND `transform` CSS properties
 * (not just one), because F-A's regression composes across both: `group-hover:scale-105`
 * (Tailwind v4 sets the `scale` property, not `transform`) and the module's own
 * `.card:hover .imageSection img { transform: scale(1.05) }`. The `listingcard` story is the
 * only one that can measure this (`pattern` story's DemoImage has no `hoverClass`).
 *
 * Usage:
 *   node .screenshots/task691-delta/capture-computed-styles.mjs --mode=before|after --static=<dir>
 * `--static` defaults to `storybook-static` under the current worktree; pass an explicit path
 * for the BEFORE phase's base-revision worktree build.
 * (run `npm run build-storybook` in the target worktree first)
 */

import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
// 691R round 2 (F-T) — an unrecognised flag used to silently no-op instead of failing, which
// nearly cost the AC5 baseline (a typo'd `--static` would have silently captured against the
// default dir with no error). Fail closed on anything not in this allowlist.
const KNOWN_ARGS = new Set(['mode', 'static']);
for (const key of Object.keys(args)) {
  if (!KNOWN_ARGS.has(key)) {
    console.error(`capture-computed-styles.mjs: unrecognised flag "--${key}". Known flags: ${[...KNOWN_ARGS].map(k => `--${k}`).join(', ')}`);
    process.exit(2);
  }
}
const mode = args.mode ?? 'before';
const STATIC_DIR = args.static ? resolve(args.static) : join(ROOT, 'storybook-static');
const PORT = mode === 'before' ? 6395 : 6394;
const OUT = join(__dirname, `computed-${mode}-240.json`);

const STORIES = {
  listingcard: 'mantine-primitives-listingcard--default',
  pattern: 'patterns-mantine-listingcardpattern--default',
};
const LOCALES = ['sq', 'en', 'uk', 'it'];
const VIEWPORTS = [320, 375, 390, 768, 1024];
// hover-grid hovers the plain grid card root (`.card` nth(0)); hover-list hovers the plain LIST
// card root (index depends on story — resolved per-tuple in captureTuple() below).
const STATES = ['rest', 'hover-grid', 'hover-list'];

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch { res.writeHead(404); res.end('Not found'); }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

// Exact-name resolver: `_<EXACTNAME>_<hash>_<line>`, no trailing extra chars, so `card` never
// matches `cardGrid`/`cardTitle`/`cardIcon`.
async function resolveHashedClass(page, exactName) {
  const cssText = await page.evaluate(async () => {
    const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
    const texts = await Promise.all(hrefs.map(h => fetch(h).then(r => r.text()).catch(() => '')));
    const inlineStyles = [...document.querySelectorAll('style')].map(s => s.textContent || '');
    return texts.join('\n') + '\n' + inlineStyles.join('\n');
  });
  const re = new RegExp('\\.(_' + exactName + '_[a-z0-9]+_\\d+)');
  const m = re.exec(cssText);
  return m ? m[1] : null;
}

const NEW_CLASSES = [
  'cardGrid', 'listImage', 'badgesList', 'badgesGrid', 'photoCountList', 'photoCountGrid',
  'infoColumn', 'cardTitle', 'priceWrapper', 'originalPriceList', 'metaRow', 'metaRowBordered',
  'locationRow', 'locationText', 'priceMetaRow', 'priceMetaAuto', 'cardIcon', 'locationIcon',
  'locationIconGrid', 'overlayCenter', 'overlayLabel',
];

// ── In-page structural capture, shared by both stories. `hasPremiumSoldArchived` toggles the
// `pattern` story's richer fixture set (12 cards) vs. `listingcard`'s plain 2-card fixture. ──
function inPageCapture({ mode, resolved, hasPremiumSoldArchived }) {
  function hasClass(el, token) { return !!el && !!el.classList && el.classList.contains(token); }
  function findDesc(root, token) {
    if (!root || !token) return null;
    for (const el of root.querySelectorAll('*')) if (hasClass(el, token)) return el;
    return null;
  }
  function cs(el, props) {
    if (!el) return { found: false };
    const c = getComputedStyle(el);
    const out = { found: true };
    for (const p of props) out[p] = c[p];
    return out;
  }
  function pick(root, afterName) { return findDesc(root, resolved[afterName]); }

  const cardCls = resolved.card;
  const cards = cardCls ? [...document.querySelectorAll('.' + CSS.escape(cardCls))] : [];
  const grid = hasPremiumSoldArchived
    ? { plain: cards[0], premium: cards[1], sold: cards[3], archived: cards[5] }
    : { plain: cards[0] };
  const list = hasPremiumSoldArchived
    ? { plain: cards[6], premium: cards[7], archived: cards[11] }
    : { plain: cards[1] };

  const result = {};

  // F-R — root transform + boxShadow captured unconditionally (rest is its own zero-value
  // control); the hovered card's own values are what F-R requires measured.
  result.site162_cardList = cs(list.plain, ['gap', 'overflow', 'transform', 'boxShadow']);
  result.site172_imageList = mode === 'before'
    ? cs([...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'relative') && hasClass(e, 'min-h-20')),
        ['position', 'width', 'flexShrink', 'alignSelf', 'minHeight', 'overflow', 'backgroundColor'])
    : cs(pick(list.plain, 'listImage'), ['position', 'width', 'flexShrink', 'alignSelf', 'minHeight', 'overflow', 'backgroundColor']);

  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'top-2') && hasClass(e, 'left-2') && hasClass(e, 'flex-col'))
      : findDesc(list.plain, resolved.badgesList);
    result.site178_badgesList = cs(el, ['position', 'top', 'left', 'display', 'flexDirection', 'gap']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'bottom-2') && hasClass(e, 'left-2'))
      : findDesc(list.plain, resolved.photoCountList);
    result.site188_photoCountList = cs(el, ['position', 'bottom', 'left', 'backgroundColor', 'color', 'fontSize', 'lineHeight', 'paddingInline', 'paddingBlock', 'borderRadius']);
  }
  {
    const group = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'bottom-2') && hasClass(e, 'left-2'))
      : findDesc(list.plain, resolved.photoCountList);
    const el = group && group.querySelector('svg');
    result.site189_cameraList = cs(el, ['height', 'width']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'flex-1') && hasClass(e, 'min-w-0'))
      : findDesc(list.plain, resolved.infoColumn);
    result.site195_infoColumn = cs(el, ['flex', 'minWidth']);
  }
  {
    const el = mode === 'before'
      ? list.plain.querySelector('h3')
      : findDesc(list.plain, resolved.cardTitle) || list.plain.querySelector('h3');
    result.site205_titleList = cs(el, ['lineHeight', 'transitionProperty', 'transitionDuration', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'w-full') && hasClass(e, 'mt-2'))
      : findDesc(list.plain, resolved.priceWrapper);
    result.site210_priceWrapperList = cs(el, ['width', 'marginTop']);
  }
  {
    const el = document.createElement('div');
    el.className = mode === 'before' ? 'text-2xs text-muted-foreground/70 leading-tight' : (resolved.originalPriceList || '');
    el.style.position = 'fixed'; el.style.top = '-9999px';
    document.body.appendChild(el);
    result.site229_originalPriceList = { ...cs(el, ['fontSize', 'lineHeight', 'color']), syntheticClass: el.className };
    el.remove();
  }
  {
    const boxes = [...list.plain.querySelectorAll('*')];
    const el = mode === 'before'
      ? boxes.find(e => hasClass(e, 'text-xs') && hasClass(e, 'text-muted-foreground') && !hasClass(e, 'border-t') && e.querySelector('svg'))
      : (() => {
          const metaRowEls = [...list.plain.querySelectorAll('.' + CSS.escape(resolved.metaRow || '__none__'))];
          return metaRowEls.find(e => e.querySelector('svg'));
        })();
    result.site235_featuresList = cs(el, ['fontSize', 'lineHeight', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'text-xs') && hasClass(e, 'text-muted-foreground') && e.querySelector('a, button, [class]'))
      : (() => {
          const metaRowEls = [...list.plain.querySelectorAll('.' + CSS.escape(resolved.metaRow || '__none__'))];
          return metaRowEls[metaRowEls.length - 1];
        })();
    result.site268_footerRowList = cs(el, ['fontSize', 'lineHeight', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'max-w-full') && hasClass(e, 'shrink-0'))
      : findDesc(list.plain, resolved.locationRow);
    result.site270_locationRowList = cs(el, ['minWidth', 'maxWidth', 'flexShrink']);
  }
  {
    const container = mode === 'before'
      ? [...list.plain.querySelectorAll('*')].find(e => hasClass(e, 'max-w-full') && hasClass(e, 'shrink-0'))
      : findDesc(list.plain, resolved.locationRow);
    const el = container && container.querySelector('svg');
    result.site271_mapPinList = cs(el, ['height', 'width', 'flexShrink']);
  }
  {
    const el = mode === 'before'
      ? [...list.plain.querySelectorAll('span')].find(e => hasClass(e, 'min-w-0'))
      : findDesc(list.plain, resolved.locationText);
    result.site272_locationTextList = cs(el, ['minWidth']);
  }
  // F-R — root transform + boxShadow captured unconditionally (rest is its own zero-value
  // control); the hovered card's own values are what F-R requires measured.
  result.site290_cardGrid = cs(grid.plain, ['display', 'flexDirection', 'height', 'transform', 'boxShadow']);
  result.site298_imageSectionGrid = cs(grid.plain && grid.plain.querySelector('.imageSection, [class*="imageSection"]'), ['position', 'overflow']);
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'top-2') && hasClass(e, 'left-2') && hasClass(e, 'flex-wrap'))
      : findDesc(grid.plain, resolved.badgesGrid);
    result.site302_badgesGrid = cs(el, ['position', 'top', 'left', 'display', 'flexWrap', 'gap']);
  }
  if (hasPremiumSoldArchived) {
    const centerEl = mode === 'before'
      ? [...grid.sold.querySelectorAll('*')].find(e => Array.from(e.classList || []).some(c => c === 'bg-overlay/30'))
      : findDesc(grid.sold, resolved.overlayCenter);
    result.site312_overlayCenter = cs(centerEl, ['backgroundColor']);
    const labelEl = mode === 'before'
      ? [...grid.sold.querySelectorAll('*')].find(e => Array.from(e.classList || []).some(c => c === 'rotate-[-8deg]'))
      : findDesc(grid.sold, resolved.overlayLabel);
    result.site313_overlayLabel = cs(labelEl, ['color', 'fontWeight', 'fontSize', 'lineHeight', 'paddingInline', 'paddingBlock', 'borderRadius', 'rotate', 'borderStyle', 'borderWidth']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'bottom-2') && hasClass(e, 'right-2'))
      : findDesc(grid.plain, resolved.photoCountGrid);
    result.site323_photoCountGrid = cs(el, ['position', 'bottom', 'right', 'backgroundColor', 'color', 'fontSize', 'lineHeight', 'paddingInline', 'paddingBlock', 'borderRadius']);
  }
  {
    const group = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'bottom-2') && hasClass(e, 'right-2'))
      : findDesc(grid.plain, resolved.photoCountGrid);
    const el = group && group.querySelector('svg');
    result.site324_cameraGrid = cs(el, ['height', 'width']);
  }
  {
    const el = mode === 'before'
      ? grid.plain.querySelector('h3')
      : findDesc(grid.plain, resolved.cardTitle) || grid.plain.querySelector('h3');
    result.site338_titleGrid = cs(el, ['lineHeight', 'transitionProperty', 'transitionDuration', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('svg')].find(e => hasClass(e, 'shrink-0') && hasClass(e, 'text-muted-foreground'))
      : [...grid.plain.querySelectorAll('.' + CSS.escape(resolved.locationIconGrid || '__none__'))][0];
    result.site342_mapPinGrid = cs(el, ['height', 'width', 'flexShrink', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'min-w-0'))
      : findDesc(grid.plain, resolved.locationText);
    result.site343_locationTextGrid = cs(el, ['minWidth']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'border-t') && hasClass(e, 'pt-2'))
      : findDesc(grid.plain, resolved.metaRowBordered);
    result.site348_featuresGrid = cs(el, ['fontSize', 'lineHeight', 'color', 'borderTopStyle', 'borderTopWidth', 'paddingTop']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'text-2xs') && hasClass(e, 'text-muted-foreground/70'))
      : findDesc(grid.plain, resolved.priceMetaRow);
    result.site372_priceMetaGrid = cs(el, ['fontSize', 'lineHeight', 'color']);
  }
  {
    const el = mode === 'before'
      ? [...grid.plain.querySelectorAll('*')].find(e => hasClass(e, 'ml-auto'))
      : findDesc(grid.plain, resolved.priceMetaAuto);
    result.site375_priceMetaAutoGrid = cs(el, ['marginLeft', 'whiteSpace']);
  }

  if (hasPremiumSoldArchived) {
    result.archivedGridHasGrayscaleOpacity = hasClass(grid.archived, 'grayscale') && hasClass(grid.archived, 'opacity-60');
    result.archivedListHasGrayscaleOpacity = hasClass(list.archived, 'grayscale') && hasClass(list.archived, 'opacity-60');
    result.archivedGridComputed = cs(grid.archived, ['filter', 'opacity']);
    result.archivedListComputed = cs(list.archived, ['filter', 'opacity']);
  }

  // R7 — image scale/transform, both layouts' host <img>. Only meaningful (non-`none`) on the
  // listingcard story's real AppImage; captured on both stories for parity.
  const gridImg = grid.plain && grid.plain.querySelector('img');
  const listImg = list.plain && list.plain.querySelector('img');
  result.imageScaleTransformGrid = cs(gridImg, ['scale', 'transform']);
  result.imageScaleTransformList = cs(listImg, ['scale', 'transform']);

  return result;
}

async function captureTuple(page, { storyKey, storyId, locale, viewport, state, mode }) {
  await page.setViewportSize({ width: viewport, height: 4000 });
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('body');

  const cardCls = await resolveHashedClass(page, 'card');
  const listRowCls = await resolveHashedClass(page, 'listRow');
  const resolved = { card: cardCls, listRow: listRowCls };
  if (mode === 'after') {
    for (const name of NEW_CLASSES) resolved[name] = await resolveHashedClass(page, name);
  }

  const hasPremiumSoldArchived = storyKey === 'pattern';
  // Same indices inPageCapture() uses to resolve grid.plain / list.plain.
  const HOVER_INDEX = { 'hover-grid': 0, 'hover-list': hasPremiumSoldArchived ? 6 : 1 };

  if (state === 'hover-grid' || state === 'hover-list') {
    const cardLocator = page.locator('.' + cardCls).nth(HOVER_INDEX[state]);
    await cardLocator.hover();
    await page.waitForTimeout(400); // past the 0.15s/300ms transitions this file declares
  }

  const data = await page.evaluate(inPageCapture, { mode, resolved, hasPremiumSoldArchived });

  if (state === 'hover-grid' || state === 'hover-list') {
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }

  return { _resolved: resolved, data };
}

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = {};
  let count = 0;
  const missing = [];

  try {
    for (const [storyKey, storyId] of Object.entries(STORIES)) {
      for (const locale of LOCALES) {
        for (const viewport of VIEWPORTS) {
          for (const state of STATES) {
            const key = `${storyKey}|${locale}|${viewport}|${state}`;
            try {
              out[key] = await captureTuple(page, { storyKey, storyId, locale, viewport, state, mode });
              count++;
            } catch (e) {
              missing.push({ key, error: String(e) });
              out[key] = { error: String(e) };
            }
          }
        }
      }
    }
  } finally {
    await page.close();
    await browser.close();
    server.close();
  }

  const result = { mode, staticDir: STATIC_DIR, tupleCount: count, expectedCount: 120, missing, tuples: out };
  await writeFile(OUT, JSON.stringify(result, null, 2));
  console.log(`Wrote ${OUT} — ${count}/120 tuples captured, ${missing.length} missing`);
  if (missing.length) console.log('MISSING:', JSON.stringify(missing.map(m => m.key)));
}

main().catch(e => { console.error(e); process.exit(1); });
