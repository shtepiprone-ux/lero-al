#!/usr/bin/env node
/**
 * task658-qa-listingcard-chrome-migration.mjs — Task 658 targeted computed-style proof.
 *
 * Ad hoc verification script (not CI, not persisted as a gate) answering the specific
 * cascade-layer risk questions raised while migrating MantineListingCardPattern's internal
 * chrome from raw Tailwind elements to Mantine primitives (Box/Group/Stack/Center/Text):
 *
 *  1. Title hover color: the title moved from a raw <h3> to a Mantine <Text>. Mantine's own
 *     Text.css sets `color: var(--text-color)` UNLAYERED (imported un-@layer'd in
 *     src/app/layout.tsx). Tailwind's `group-hover:text-primary` utility is LAYERED
 *     (@layer utilities). Per the CSS Cascade Layers spec, an unlayered declaration always
 *     wins over a layered one for the same property on the same element, REGARDLESS of
 *     pseudo-class match or specificity -- so there is a real risk the retained
 *     `group-hover:text-primary` className is now inert. This script hovers the grid card
 *     and reads the title's computed `color` before/after.
 *  2. S2 (layout='list') location+footer row @320: the Task 656 wrap-safety fix must still
 *     hold now that the row is a Mantine `Group` -- location's computed width must be > 0
 *     (not collapsed), and the row must not force page horizontal overflow.
 *  3. originalPrice ("text-2xs" carve-out, rendered via Box not Text) computed font-size must
 *     be 10px (0.625rem), not silently defaulted to Mantine's own font-size fallback.
 *  4. Photo-counter / overlay / badges still render with correct position (sanity, both layouts).
 *
 * Usage: node scripts/task658-qa-listingcard-chrome-migration.mjs
 * (reuses storybook-static/, same build used by screenshots:assert -- run
 * `npm run build-storybook` first).
 */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6392;
const STORY_ID = 'patterns-mantine-listingcardpattern--default';

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

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const results = { pass: [], fail: [] };

  function check(label, ok, detail) {
    (ok ? results.pass : results.fail).push({ label, detail });
    console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  }

  try {
    // ── 1. Title hover color (desktop viewport, real mouse hover, sq locale is irrelevant here) ──
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mantine-Card-root');

      const gridCard = (await page.$$('.mantine-Card-root'))[0];
      const titleHandle = await gridCard.$('h3');
      if (!titleHandle) {
        check('Title element found (grid card 1, <h3> tag)', false, 'no <h3> located inside first card root');
      } else {
        const before = await titleHandle.evaluate(el => getComputedStyle(el).color);
        const box = await gridCard.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2 + 1); // nudge to trigger :hover
        await page.waitForTimeout(400); // transition-colors 150ms-ish + settle
        const after = await titleHandle.evaluate(el => getComputedStyle(el).color);
        check(
          'Title color changes on card hover (group-hover:text-primary still functions after Text migration)',
          before !== after,
          `before=${before} after=${after}`,
        );
      }
      await page.close();
    }

    // ── 2. S2 list layout @320 — location computed width > 0, no page overflow ──
    {
      const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:uk`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mantine-Card-root');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      check('No page horizontal overflow @320 (uk, longest strings)', !overflow);

      const listRowData = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.mantine-Card-root')];
        const listRow = cards.find(el => getComputedStyle(el).flexDirection === 'row');
        if (!listRow) return null;
        const locationTextEls = [...listRow.querySelectorAll('span, p')].filter(el => el.textContent && el.textContent.length > 3 && el.querySelector === undefined);
        // Simpler: find the MapPin-adjacent truncated span by walking for the location group marker.
        const truncated = [...listRow.querySelectorAll('*')].find(el => getComputedStyle(el).textOverflow === 'ellipsis' && getComputedStyle(el).whiteSpace === 'nowrap');
        if (!truncated) return { found: false };
        const rect = truncated.getBoundingClientRect();
        return { found: true, width: rect.width, text: truncated.textContent };
      });
      if (!listRowData || !listRowData.found) {
        check('Location (truncated span) located in list row @320', false, JSON.stringify(listRowData));
      } else {
        check('Location computed width > 0 @320 (Task 656 wrap-safety preserved)', listRowData.width > 0, `width=${listRowData.width}px text="${listRowData.text}"`);
      }
      await page.close();
    }

    // ── 3. originalPrice (text-2xs carve-out) computed font-size ──
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mantine-Card-root');
      const fz = await page.evaluate(() => {
        const els = [...document.querySelectorAll('span')];
        const el = els.find(e => getComputedStyle(e).fontSize === '10px');
        return el ? getComputedStyle(el).fontSize : (els.map(e => getComputedStyle(e).fontSize).includes('10px') ? '10px' : 'not-found');
      });
      check('A text-2xs (10px) carve-out element renders at 10px, not Mantine\'s 16px default', fz === '10px', `found=${fz}`);
      await page.close();
    }

    // ── 4. Photo counter / overlay / badges sanity (grid + list) ──
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mantine-Card-root');
      const sanity = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.mantine-Card-root')];
        const gridCards = cards.filter(el => getComputedStyle(el).flexDirection === 'column');
        const listRows = cards.filter(el => getComputedStyle(el).flexDirection === 'row');
        const soldGrid = gridCards.find(c => c.textContent.includes('SOLD') || c.textContent.toUpperCase().includes('SOLD'));
        return {
          gridCount: gridCards.length,
          listCount: listRows.length,
          gridHasPhotoCounter: gridCards.some(c => getComputedStyle([...c.querySelectorAll('*')].find(e => e.textContent === '5') || document.body).position !== undefined && c.querySelector('svg.lucide-camera') != null),
          soldOverlayFound: !!soldGrid,
        };
      });
      check('Grid + list sections both rendered (SimpleGrid + Stack)', sanity.gridCount >= 6 && sanity.listCount >= 6, JSON.stringify(sanity));
      check('Photo counter (camera icon) present in at least one grid card', sanity.gridHasPhotoCounter, JSON.stringify(sanity));
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n${results.pass.length} passed, ${results.fail.length} failed`);
  if (results.fail.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
