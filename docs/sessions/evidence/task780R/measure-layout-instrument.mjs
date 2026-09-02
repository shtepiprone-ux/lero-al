// Task 780R — retained layout-measurement instrument (R5/R8). NOT deleted after use.
// Measures, per cell: bar-root width, per-control widths against bar-root width (mobile), the
// desktop right-edge alignment of the advanced-filters Button against bar-root, AND — the
// control the previous attempt lacked — the bar-root's own right edge against its containing
// block's CONTENT-box right edge (the story's Box px-gutter container). A normalized control
// that only checks `advancedWidth == barRootWidth` cannot detect the bar root itself shrinking
// inside its container; this containerContentRight/barInsetRight pair can.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';

const ROOT = process.cwd();
const staticDir = join(ROOT, 'storybook-static');
if (!existsSync(staticDir)) {
  console.error('storybook-static/ not found — build first.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(dir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404); res.end('Not found');
        }
      }
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 800 },
  { name: 'mobile-375', width: 375, height: 800 },
  { name: 'mobile-390', width: 390, height: 800 },
];
const DESKTOP_VIEWPORT = { name: 'desktop-1024', width: 1024, height: 900 };
const STORY_ID = 'patterns-mantine-listingsfilterbar--default';
const TOLERANCE = 2;

const messages = {};
for (const l of LOCALES) {
  messages[l] = JSON.parse(await readFile(join(ROOT, 'messages', `${l}.json`), 'utf-8'));
}

async function main() {
  const { chromium } = await import('playwright');
  const PORT = 6019;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const server = await startStaticServer(staticDir, PORT);
  const browser = await chromium.launch();
  const cells = [];

  try {
    for (const locale of LOCALES) {
      const resetLabel = messages[locale].common.reset_filters;
      const premiumLabel = messages[locale].listing.filter_premium_toggle_label;

      for (const vp of [...MOBILE_VIEWPORTS, DESKTOP_VIEWPORT]) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        const url = `${baseUrl}/iframe.html?id=${STORY_ID}&globals=locale:${locale}&viewMode=story`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForSelector('[data-testid="listings-filter-bar-root"]', { timeout: 10000 });

        const measured = await page.evaluate(({ resetLabel, premiumLabel }) => {
          const barRoot = document.querySelector('[data-testid="listings-filter-bar-root"]');
          const barRect = barRoot.getBoundingClientRect();

          const container = barRoot.parentElement;
          const containerRect = container.getBoundingClientRect();
          const containerStyle = getComputedStyle(container);
          const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
          const containerContentRight = containerRect.right - containerPaddingRight;

          const inputs = Array.from(barRoot.querySelectorAll('input'));
          const propertyTypeInput = inputs[0] ?? null;
          const locationInput = inputs[1] ?? null;

          function findButtonByText(label) {
            const buttons = Array.from(barRoot.querySelectorAll('.mantine-Button-root'));
            return buttons.find(b => (b.textContent ?? '').trim() === label.trim()) ?? null;
          }
          const advancedButton = barRoot.querySelector('[data-testid="task775-advanced-filters"]');
          const resetButton = findButtonByText(resetLabel);
          const premiumButton = findButtonByText(premiumLabel);

          function rect(el) { return el ? el.getBoundingClientRect() : null; }

          const docEl = document.documentElement;

          return {
            documentScrollWidth: docEl.scrollWidth,
            documentClientWidth: docEl.clientWidth,
            barRootWidth: barRect.width,
            barRootRight: barRect.right,
            containerContentRight,
            propertyTypeWidth: propertyTypeInput ? rect(propertyTypeInput).width : null,
            locationWidth: locationInput ? rect(locationInput).width : null,
            premiumWidth: premiumButton ? rect(premiumButton).width : null,
            resetWidth: resetButton ? rect(resetButton).width : null,
            advancedWidth: advancedButton ? rect(advancedButton).width : null,
            advancedRight: advancedButton ? rect(advancedButton).right : null,
          };
        }, { resetLabel, premiumLabel });

        await page.close();

        const isDesktop = vp.name === 'desktop-1024';
        const barInsetRight = measured.containerContentRight - measured.barRootRight;
        const cell = { locale, viewport: vp.name, ...measured, barInsetRight, checks: {} };

        cell.checks.containerRelative = Math.abs(barInsetRight) <= TOLERANCE;
        cell.checks.noDocumentOverflow = measured.documentScrollWidth <= measured.documentClientWidth + 1;

        if (!isDesktop) {
          const minWidth = measured.barRootWidth - TOLERANCE;
          cell.checks.propertyType = measured.propertyTypeWidth !== null && measured.propertyTypeWidth >= minWidth;
          cell.checks.location = measured.locationWidth !== null && measured.locationWidth >= minWidth;
          cell.checks.premium = measured.premiumWidth !== null && measured.premiumWidth >= minWidth;
          cell.checks.reset = measured.resetWidth !== null && measured.resetWidth >= minWidth;
          cell.checks.advanced = measured.advancedWidth !== null && measured.advancedWidth >= minWidth;
          cell.tolerance = TOLERANCE;
          cell.minRequiredWidth = minWidth;
        } else {
          const diff = measured.advancedRight !== null ? Math.abs(measured.barRootRight - measured.advancedRight) : null;
          cell.rightEdgeDiff = diff;
          cell.checks.rightAligned = diff !== null && diff <= TOLERANCE;
        }

        cell.pass = Object.values(cell.checks).every(Boolean);
        cells.push(cell);
        console.log(`${locale} × ${vp.name}: ${cell.pass ? 'PASS' : 'FAIL'} barInsetRight=${barInsetRight.toFixed(2)} ${JSON.stringify(cell.checks)}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  const allPass = cells.every(c => c.pass);
  const output = {
    generatedAt: new Date().toISOString(),
    story: STORY_ID,
    tolerance: TOLERANCE,
    totalCells: cells.length,
    allPass,
    cells,
  };
  const outPath = process.argv[2] ?? join(ROOT, 'docs/sessions/evidence/task780R/layout-measurements.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n${allPass ? '✅' : '❌'} ${cells.filter(c => c.pass).length}/${cells.length} cells PASS`);
  process.exit(allPass ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(2); });
