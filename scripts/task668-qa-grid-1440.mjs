#!/usr/bin/env node
/**
 * task668-qa-grid-1440.mjs — Task 668 rendered evidence.
 *
 * Proves the Featured/Latest homepage grid column step moved from Tailwind `2xl` (1536px) to
 * Mantine `xxl` (1440px) — an owner-approved adaptive change (kickoff §1, 2026-07-26) — while
 * every other width band and both gaps stay identical to the pre-change render.
 *
 * Two explicit modes, because this script must run BEFORE the source change exists (when the
 * grids are still raw Tailwind `<div>`s stepping at 1536) and AFTER it (Mantine `SimpleGrid`
 * stepping at 1440):
 *
 *   --baseline  Captures every cell and WRITES the result to a stable baseline file
 *               (.screenshots/task668/baseline.json). Asserts NOTHING about expected column
 *               counts — only fails on infrastructure problems (story failed to render, grid
 *               not found, page error). Must exit 0 against the pre-change tree.
 *
 *   --verify    Captures every cell, asserts the AC1-AC4 expected column/gap tables for the
 *               POST-CHANGE tree, and diffs against the stored baseline to auto-label each
 *               width as `APPROVED CHANGE (owner 2026-07-26)` (1440-1535px band) or `UNCHANGED`
 *               (every other width). Exits non-zero on any expected-table mismatch or on any
 *               unlabelled difference outside the 1440-1535 band. Default mode (no flag).
 *
 * Dual locator (works on BOTH the pre-change Tailwind grid and the post-change SimpleGrid):
 * within #storybook-root, the first element whose `getComputedStyle(el).display === 'grid'`.
 * Each of the four stories below renders exactly one View in one branch, so there is exactly
 * one grid-display element in the tree — no Tailwind-token or Mantine-class dependency.
 *
 * Reuses the already-built storybook-static/ (same build used by screenshots:assert).
 *
 * Usage:
 *   node scripts/task668-qa-grid-1440.mjs --baseline
 *   node scripts/task668-qa-grid-1440.mjs --verify   (or no flag)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const MODE = args.includes('--baseline') ? 'baseline' : 'verify';

const BASELINE_DIR = join(ROOT, '.screenshots', 'task668');
const BASELINE_PATH = join(BASELINE_DIR, 'baseline.json');

const WIDTHS = [320, 640, 768, 1024, 1280, 1439, 1440, 1535, 1536, 1920];
const LOCALES = ['sq', 'en', 'uk', 'it'];
const APPROVED_BAND = { min: 1440, max: 1535 };
const APPROVED_LABEL = 'APPROVED CHANGE (owner 2026-07-26)';
const UNCHANGED_LABEL = 'UNCHANGED';

const STORIES = [
  { id: 'system-featuredlistings--default', component: 'Featured', branch: 'populated' },
  { id: 'system-featuredlistings--loading', component: 'Featured', branch: 'loading' },
  { id: 'system-latestlistings--default', component: 'Latest', branch: 'populated' },
  { id: 'system-latestlistings--loading', component: 'Latest', branch: 'loading' },
];

// AC1/AC2 — post-change expected column count by width, per component (§12).
const EXPECTED_COLS = {
  Featured: { 320: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1439: 3, 1440: 4, 1535: 4, 1536: 4, 1920: 4 },
  Latest: { 320: 1, 640: 1, 768: 2, 1024: 2, 1280: 2, 1439: 2, 1440: 3, 1535: 3, 1536: 3, 1920: 3 },
};

// AC3 — gaps unchanged at every width, both axes (§3.3).
const EXPECTED_GAP_PX = {
  Featured: 16,
  Latest: 12,
};

// AC4 — skeleton counts on the loading branch (§10.2/§10.4).
const EXPECTED_SKELETON_COUNT = {
  Featured: 3,
  Latest: 4,
};

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

// In-page evaluation — dual locator (§10.10): first #storybook-root descendant whose computed
// display is 'grid'. Works on the pre-change Tailwind grid (utility class `grid` -> display:grid)
// and the post-change Mantine SimpleGrid (own compiled CSS -> display:grid) without depending on
// Tailwind tokens or Mantine class names.
/* eslint-disable no-undef */
function evalGrid() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { found: false, reason: 'no-storybook-root' };

  let grid = null;
  const all = root.querySelectorAll('*');
  for (const el of all) {
    if (getComputedStyle(el).display === 'grid') {
      grid = el;
      break;
    }
  }
  if (!grid) return { found: false, reason: 'no-grid-display-element' };

  const cs = getComputedStyle(grid);
  const colsStr = cs.gridTemplateColumns;
  const tracks = colsStr.split(/\s+/).filter((t) => t && t !== '0px');

  return {
    found: true,
    columnCount: tracks.length,
    gridTemplateColumns: colsStr,
    columnGap: cs.columnGap,
    rowGap: cs.rowGap,
    childrenCount: grid.children.length,
  };
}
/* eslint-enable no-undef */

function parsePx(value) {
  if (typeof value !== 'string') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

async function captureMatrix(browser, baseUrl) {
  const matrix = [];
  for (const story of STORIES) {
    for (const locale of LOCALES) {
      for (const width of WIDTHS) {
        const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
        const cell = {
          storyId: story.id,
          component: story.component,
          branch: story.branch,
          locale,
          width,
          grid: null,
          error: null,
          infraOk: false,
        };

        try {
          const page = await browser.newPage();
          const pageErrors = [];
          page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });

          await page.setViewportSize({ width, height: 900 });
          await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(400);

          const renderResult = await page.evaluate(() => {
            if (document.body.classList.contains('sb-show-errordisplay')) {
              const errEl = document.querySelector('#error-message') || document.body;
              return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
            }
            const root = document.querySelector('#storybook-root');
            if (root && root.children.length === 0) return { failed: true, reason: 'blank-canvas', detail: '' };
            return { failed: false, reason: null, detail: '' };
          });

          const grid = await page.evaluate(evalGrid);
          await page.close();

          const renderFailed = renderResult.failed || pageErrors.length > 0;
          cell.grid = grid;
          cell.renderResult = renderResult;
          cell.pageErrors = pageErrors.slice(0, 2);
          cell.infraOk = !renderFailed && grid.found;
          if (renderFailed) cell.error = `render: ${renderResult.reason ?? pageErrors[0] ?? 'unknown'}`;
          else if (!grid.found) cell.error = `locator: ${grid.reason}`;
        } catch (err) {
          cell.error = String(err).slice(0, 300);
          cell.infraOk = false;
        }

        matrix.push(cell);
        const mark = cell.infraOk ? '.' : 'E';
        process.stdout.write(mark);
      }
    }
  }
  process.stdout.write('\n');
  return matrix;
}

function keyFor(cell) {
  return `${cell.storyId}__${cell.locale}__${cell.width}`;
}

async function runBaseline(matrix) {
  const infraFailures = matrix.filter((c) => !c.infraOk);
  mkdirSync(BASELINE_DIR, { recursive: true });
  const payload = { mode: 'baseline', cellCount: matrix.length, matrix };
  writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2));

  console.log('');
  console.log(`Baseline: ${matrix.length} cells captured, ${infraFailures.length} infra failure(s).`);
  console.log(`Written: ${BASELINE_PATH}`);
  if (infraFailures.length > 0) {
    console.log('Infra failures (harness defect — fix the dual locator before touching product code):');
    for (const c of infraFailures.slice(0, 10)) {
      console.log(`  ${c.storyId} @ ${c.locale}@${c.width} - ${c.error}`);
    }
  }
  return infraFailures.length > 0 ? 1 : 0;
}

async function runVerify(matrix) {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`Baseline not found at ${BASELINE_PATH} — run with --baseline first (Phase A, §13).`);
    return 1;
  }
  const baselinePayload = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const baselineByKey = new Map(baselinePayload.matrix.map((c) => [keyFor(c), c]));

  let failCount = 0;
  const rows = [];

  for (const cell of matrix) {
    const row = {
      storyId: cell.storyId,
      component: cell.component,
      branch: cell.branch,
      locale: cell.locale,
      width: cell.width,
      pass: true,
      reasons: [],
      label: cell.width >= APPROVED_BAND.min && cell.width <= APPROVED_BAND.max ? APPROVED_LABEL : UNCHANGED_LABEL,
    };

    if (!cell.infraOk) {
      row.pass = false;
      row.reasons.push(`infra: ${cell.error}`);
      failCount++;
      rows.push(row);
      continue;
    }

    const expectedCols = EXPECTED_COLS[cell.component][cell.width];
    if (cell.grid.columnCount !== expectedCols) {
      row.pass = false;
      row.reasons.push(`columnCount=${cell.grid.columnCount} expected=${expectedCols}`);
    }

    const expectedGap = EXPECTED_GAP_PX[cell.component];
    const colGapPx = parsePx(cell.grid.columnGap);
    const rowGapPx = parsePx(cell.grid.rowGap);
    if (colGapPx !== expectedGap) {
      row.pass = false;
      row.reasons.push(`columnGap=${cell.grid.columnGap} expected=${expectedGap}px`);
    }
    if (rowGapPx !== expectedGap) {
      row.pass = false;
      row.reasons.push(`rowGap=${cell.grid.rowGap} expected=${expectedGap}px`);
    }

    if (cell.branch === 'loading') {
      const expectedSkeletons = EXPECTED_SKELETON_COUNT[cell.component];
      if (cell.grid.childrenCount !== expectedSkeletons) {
        row.pass = false;
        row.reasons.push(`skeletonCount=${cell.grid.childrenCount} expected=${expectedSkeletons}`);
      }
    }

    const baselineCell = baselineByKey.get(keyFor(cell));
    if (baselineCell && baselineCell.infraOk) {
      const baselineCols = baselineCell.grid.columnCount;
      const differs = baselineCols !== cell.grid.columnCount;
      row.baselineColumnCount = baselineCols;
      row.verifyColumnCount = cell.grid.columnCount;
      row.differsFromBaseline = differs;

      const inBand = cell.width >= APPROVED_BAND.min && cell.width <= APPROVED_BAND.max;
      if (differs && !inBand) {
        row.pass = false;
        row.reasons.push(`unlabelled difference vs baseline outside 1440-1535 band (baseline=${baselineCols}, verify=${cell.grid.columnCount})`);
      }
    } else {
      row.pass = false;
      row.reasons.push('no baseline cell to diff against (baseline infra failure or missing)');
    }

    if (!row.pass) failCount++;
    rows.push(row);
  }

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task668', `verify-${timestamp}`);
  mkdirSync(outputDir, { recursive: true });
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, mode: 'verify', rows }, null, 2));

  console.log('');
  console.log(`Verify: ${rows.length} cells, ${rows.length - failCount} PASS, ${failCount} FAIL`);
  console.log(`Manifest: ${manifestPath}`);

  // Before/after summary table (AC11) — one row per component/branch/width, locale sq as representative.
  console.log('');
  console.log('Before/after summary (locale=sq):');
  for (const story of STORIES) {
    console.log(`  ${story.id}:`);
    for (const width of WIDTHS) {
      const r = rows.find((x) => x.storyId === story.id && x.locale === 'sq' && x.width === width);
      if (!r) continue;
      console.log(`    ${width}px: before=${r.baselineColumnCount ?? 'n/a'} after=${r.verifyColumnCount ?? 'n/a'} [${r.label}] ${r.pass ? 'PASS' : 'FAIL: ' + r.reasons.join('; ')}`);
    }
  }

  if (failCount > 0) {
    console.log('');
    console.log('Failing cells:');
    for (const r of rows.filter((x) => !x.pass).slice(0, 30)) {
      console.log(`  ${r.storyId} @ ${r.locale}@${r.width} - ${r.reasons.join('; ')}`);
    }
  }

  return failCount > 0 ? 1 : 0;
}

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6015;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  console.log(`Task 668 §10.10 grid-1440 QA capture — mode: ${MODE}`);
  console.log(`    Stories: ${STORIES.length} | Widths: ${WIDTHS.length} | Locales: ${LOCALES.length} = ${STORIES.length * WIDTHS.length * LOCALES.length} cells`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();

  const matrix = await captureMatrix(browser, baseUrl);

  await browser.close();
  await new Promise((r) => server.close(r));

  const exitCode = MODE === 'baseline' ? await runBaseline(matrix) : await runVerify(matrix);
  process.exit(exitCode);
}

main().catch((err) => { console.error(err); process.exit(1); });
