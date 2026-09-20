#!/usr/bin/env node
/**
 * tooltip-edge.mjs — Task 845 Revision 2 follow-up (owner rejection: "tooltip виходить за рамки екранів").
 *
 * For every dashboard chart Story, hovers a grid of points and, wherever
 * a tooltip is visible, records how far its bounding box extends past the viewport and past the enclosing card (right and left).
 * `worstOverflowPx` = 0 means the tooltip stayed fully on screen at every hovered point.
 *
 *   node tooltip-edge.mjs <arm-label>     → tooltip-edge.<arm-label>.json
 *
 * Run against a built `storybook-static/` (native ApexCharts tooltips, Task 845 Revision 2).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6399;
const ARM = process.argv[2] ?? 'after';

const STORIES = [
  'patterns-mantine-dashboardbarchart--default',
  'patterns-mantine-dashboardlinechart--default',
  'patterns-mantine-dashboarddonut--default',
  'patterns-mantine-dashboardsemidonut--default',
  'patterns-mantine-dashboardradar--default',
  'patterns-mantine-dashboardradialprogress--default',
];
const CELLS = [
  { width: 320, locale: 'uk' },
  { width: 320, locale: 'en' },
  { width: 390, locale: 'uk' },
  { width: 768, locale: 'uk' },
  { width: 1440, locale: 'uk' },
];
const HEIGHT = 900;

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  try { const d = await readFile(join(STATIC_DIR, p)); res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(PORT);

// ApexCharts gives the tooltip a CSS transition on left, so its bounding rect is an in-between
// position for ~150ms after every move. The settled position is offsetParent.left + style.left.
const readTooltip = () => {
  const el = document.querySelector('.apexcharts-tooltip.apexcharts-active');
  if (!el) return null;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetWidth) return null;
  const wrapLeft = el.offsetParent ? el.offsetParent.getBoundingClientRect().left : 0;
  const left = wrapLeft + parseFloat(el.style.left || '0');
  const card = document.querySelector('.mantine-Card-root');
  const c = card ? card.getBoundingClientRect() : null;
  return { kind: 'apexcharts-native', left, right: left + el.offsetWidth, width: el.offsetWidth, cardLeft: c ? c.left : null, cardRight: c ? c.right : null };
};

const browser = await chromium.launch();
const results = [];
try {
  for (const cell of CELLS) {
    const context = await browser.newContext({ viewport: { width: cell.width, height: HEIGHT } });
    const page = await context.newPage();
    for (const id of STORIES) {
      await page.goto(`http://localhost:${PORT}/iframe.html?id=${id}&viewMode=story&globals=locale:${cell.locale}`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelector('#storybook-root')?.children.length > 0, null, { timeout: 30000 });
      await page.waitForTimeout(1200);
      const box = await page.evaluate(() => {
        const s = document.querySelector('.apexcharts-svg');
        const r = s ? s.getBoundingClientRect() : document.querySelector('#storybook-root').getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: Math.min(r.height, 700), apex: !!s };
      });
      let shown = 0, worst = 0, worstCard = 0, worstAt = null, kind = null;
      for (let fx = 0.04; fx <= 0.981; fx += 0.05) {
        for (let fy = 0.1; fy <= 0.91; fy += 0.1) {
          const x = box.x + box.w * fx, y = box.y + box.h * fy;
          await page.mouse.move(x - 4, y - 4);
          await page.mouse.move(x, y, { steps: 3 });
          await page.waitForTimeout(120);
          const t = await page.evaluate(readTooltip);
          if (!t) continue;
          shown++; kind = t.kind;
          const over = Math.max(0, t.right - cell.width, -t.left);
          if (t.cardLeft !== null) worstCard = Math.max(worstCard, t.right - t.cardRight, t.cardLeft - t.left, 0);
          if (over > worst) { worst = over; worstAt = { x: Math.round(x), y: Math.round(y), left: Math.round(t.left), right: Math.round(t.right), width: Math.round(t.width) }; }
        }
      }
      // The grid above barely touches thin targets (radar vertices, ring arcs), so also hover the
      // centre and edge points of every chart element itself.
      const targets = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.apexcharts-marker, .apexcharts-pie-area, .apexcharts-radialbar-area, .apexcharts-bar-area'))
          .flatMap((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) return [];
            return [[0.1, 0.5], [0.5, 0.5], [0.9, 0.5], [0.5, 0.1], [0.5, 0.9]].map(([a, b]) => ({ x: r.left + r.width * a, y: r.top + r.height * b }));
          })
          .slice(0, 160),
      );
      for (const { x, y } of targets) {
        await page.mouse.move(x - 3, y - 3);
        await page.mouse.move(x, y, { steps: 3 });
        await page.waitForTimeout(120);
        const t = await page.evaluate(readTooltip);
        if (!t) continue;
        shown++; kind = t.kind;
        const over = Math.max(0, t.right - cell.width, -t.left);
        if (t.cardLeft !== null) worstCard = Math.max(worstCard, t.right - t.cardRight, t.cardLeft - t.left, 0);
        if (over > worst) { worst = over; worstAt = { x: Math.round(x), y: Math.round(y), left: Math.round(t.left), right: Math.round(t.right), width: Math.round(t.width) }; }
      }
      results.push({ story: id, width: cell.width, locale: cell.locale, apex: box.apex, hoverPointsWithTooltip: shown, tooltipKind: kind, worstOverflowPx: Math.round(worst * 10) / 10, worstOutsideCardPx: Math.round(worstCard * 10) / 10, worstAt });
      console.log(`${cell.width}/${cell.locale} ${id}: shown=${shown} kind=${kind} worstOverflow=${Math.round(worst)}px outsideCard=${Math.round(worstCard)}px`);
    }
    await context.close();
  }
} finally { await browser.close(); server.close(); }
await writeFile(join(__dirname, `tooltip-edge.${ARM}.json`), JSON.stringify({ arm: ARM, viewportHeight: HEIGHT, results }, null, 2) + '\n', 'utf8');
console.log(`ARM ${ARM}: ${results.length} cells; cells with overflow: ${results.filter((r) => r.worstOverflowPx > 0).length}; cells with tooltip outside the card: ${results.filter((r) => r.worstOutsideCardPx > 0).length}; cells where no tooltip appeared: ${results.filter((r) => r.hoverPointsWithTooltip === 0).length}`);
