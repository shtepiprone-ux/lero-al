#!/usr/bin/env node
/**
 * task670-qa-hero-fallback-geometry.mjs — Task 670 rendered evidence.
 *
 * Proves the `HeroSearchClient` `ssr:false` loading fallback's rendered height matches the real
 * `HeroSearchView` height at every required cell, replacing the current single hardcoded `h-[76px]`
 * (kickoff §3.2/§10 I4) with a value actually measured against production geometry — never invented.
 *
 * Two explicit modes, because this script must run BEFORE the fallback migration exists (against the
 * unmodified tree, where the `Mantine/Primitives/HeroSearch` story's `Fallback` export still renders the
 * CURRENT raw Tailwind `<div className="... h-[76px] ...">` verbatim) and AFTER it (the `Fallback` export
 * renders the real `HeroSearchFallback` Mantine component):
 *
 *   --baseline  Captures every cell and WRITES the result to a stable baseline file
 *               (.screenshots/task670/baseline.json). Asserts NOTHING about expected heights — only
 *               fails on infrastructure problems (story failed to render, locator not found, page
 *               error). Must exit 0 against the unmodified tree (I4 step 1).
 *
 *   --verify    Captures every cell, asserts AC4 (|fallbackHeight - realHeight| <= 1px AND that delta
 *               does not exceed the same cell's baseline delta) and diffs against the stored baseline.
 *               Exits non-zero on any cell that fails either condition, or has no baseline row to diff
 *               against (Task 668 revision-7 F3 precedent: a missing-baseline branch must never
 *               silently pass). Default mode (no flag).
 *
 * Locator (mechanism-agnostic — works on BOTH the pre-change raw-`<div>` fallback and the post-change
 * Mantine `HeroSearchFallback`, and on the real `HeroSearchView`): both the `Default` and `Fallback`
 * exports of `Mantine/Primitives/HeroSearch` wrap their single search-slot child directly inside
 * `<div className="container-wide relative z-10">` (the exact fragment `src/app/[locale]/page.tsx:28`
 * uses around `<HeroSearchClient />`). The search-slot content is therefore always
 * `document.querySelector('.container-wide').firstElementChild` — independent of whether that child is
 * a raw `<div>`, a Mantine `Box`, or a Fragment's first element (`HeroSearchView` returns a Fragment of
 * `[Box.hero-search, FiltersPanel]`; with `filtersOpen=false` `FiltersPanel` is never the first child).
 * No class name, story id, or testid dependency for the height read itself.
 *
 * Cells: the AC8 canon (14 widths) + the `HeroSearch` `band-700` cell already defined at
 * `scripts/check-stories-rendered.mjs:414` (Task 573 precedent) — 15 widths x 4 locales = 60 cells.
 *
 * Reuses the already-built storybook-static/ (same build used by screenshots:assert).
 *
 * Usage:
 *   node scripts/task670-qa-hero-fallback-geometry.mjs --baseline
 *   node scripts/task670-qa-hero-fallback-geometry.mjs --verify   (or no flag)
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

const BASELINE_DIR = join(ROOT, '.screenshots', 'task670');
const BASELINE_PATH = join(BASELINE_DIR, 'baseline.json');

// AC8 canon (14) + the HeroSearch band-700 cell (check-stories-rendered.mjs:414, Task 573 precedent).
const WIDTHS = [
  { name: 'w320', width: 320, height: 900 },
  { name: 'w375', width: 375, height: 900 },
  { name: 'w390', width: 390, height: 900 },
  { name: 'w480', width: 480, height: 900 },
  { name: 'w560', width: 560, height: 900 },
  { name: 'w680', width: 680, height: 900 },
  { name: 'w768', width: 768, height: 900 },
  { name: 'band-700', width: 700, height: 900 },
  { name: 'w810', width: 810, height: 900 },
  { name: 'w960', width: 960, height: 900 },
  { name: 'w1024', width: 1024, height: 900 },
  { name: 'w1200', width: 1200, height: 900 },
  { name: 'w1440', width: 1440, height: 900 },
  { name: 'w1920', width: 1920, height: 1080 },
  { name: 'w2560', width: 2560, height: 1440 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];

const SUBJECTS = [
  { id: 'mantine-primitives-herosearch--default', role: 'real' },
  { id: 'mantine-primitives-herosearch--fallback', role: 'fallback' },
];

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

// In-page evaluation — dual/triple locator (see header comment): the search-slot content is always
// the first element child of `.container-wide` inside `#storybook-root`.
/* eslint-disable no-undef */
function evalHeroContent() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { found: false, reason: 'no-storybook-root' };

  const containerWide = root.querySelector('.container-wide');
  if (!containerWide) return { found: false, reason: 'no-container-wide' };

  const contentEl = containerWide.firstElementChild;
  if (!contentEl) return { found: false, reason: 'container-wide-empty' };

  const rect = contentEl.getBoundingClientRect();
  return {
    found: true,
    height: rect.height,
    width: rect.width,
    tag: contentEl.tagName,
    className: contentEl.className || null,
  };
}
/* eslint-enable no-undef */

async function captureMatrix(browser, baseUrl) {
  const matrix = [];
  for (const locale of LOCALES) {
    for (const viewport of WIDTHS) {
      const cell = {
        locale,
        viewportName: viewport.name,
        width: viewport.width,
        subjects: {},
        infraOk: true,
        error: null,
      };

      for (const subject of SUBJECTS) {
        const storyUrl = `${baseUrl}/iframe.html?id=${subject.id}&globals=locale:${locale}&viewMode=story`;
        const sub = { role: subject.role, storyId: subject.id, geometry: null, error: null, infraOk: false };

        try {
          const page = await browser.newPage();
          const pageErrors = [];
          page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
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

          const geometry = await page.evaluate(evalHeroContent);
          await page.close();

          const renderFailed = renderResult.failed || pageErrors.length > 0;
          sub.geometry = geometry;
          sub.pageErrors = pageErrors.slice(0, 2);
          sub.infraOk = !renderFailed && geometry.found;
          if (renderFailed) sub.error = `render: ${renderResult.reason ?? pageErrors[0] ?? 'unknown'}`;
          else if (!geometry.found) sub.error = `locator: ${geometry.reason}`;
        } catch (err) {
          sub.error = String(err).slice(0, 300);
          sub.infraOk = false;
        }

        cell.subjects[subject.role] = sub;
        if (!sub.infraOk) {
          cell.infraOk = false;
          cell.error = cell.error ? `${cell.error}; ${subject.role}: ${sub.error}` : `${subject.role}: ${sub.error}`;
        }
      }

      if (cell.infraOk) {
        cell.realHeight = cell.subjects.real.geometry.height;
        cell.fallbackHeight = cell.subjects.fallback.geometry.height;
        cell.delta = Math.round((cell.fallbackHeight - cell.realHeight) * 100) / 100;
      }

      matrix.push(cell);
      process.stdout.write(cell.infraOk ? '.' : 'E');
    }
  }
  process.stdout.write('\n');
  return matrix;
}

function keyFor(cell) {
  return `${cell.locale}__${cell.viewportName}`;
}

async function runBaseline(matrix) {
  const infraFailures = matrix.filter((c) => !c.infraOk);
  mkdirSync(BASELINE_DIR, { recursive: true });
  const payload = { mode: 'baseline', cellCount: matrix.length, matrix };
  writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2));

  console.log('');
  console.log(`Baseline: ${matrix.length} cells captured, ${infraFailures.length} infra failure(s).`);
  console.log(`Written: ${BASELINE_PATH}`);

  console.log('');
  console.log('Before-state delta table (realHeight vs fallbackHeight, current h-[76px] fallback):');
  for (const cell of matrix) {
    if (!cell.infraOk) {
      console.log(`  ${cell.locale}@${cell.width} (${cell.viewportName}): INFRA FAILURE - ${cell.error}`);
      continue;
    }
    console.log(`  ${cell.locale}@${cell.width} (${cell.viewportName}): real=${cell.realHeight}px fallback=${cell.fallbackHeight}px delta=${cell.delta}px`);
  }

  if (infraFailures.length > 0) {
    console.log('');
    console.log('Infra failures (harness defect — fix the locator before touching product code):');
    for (const c of infraFailures.slice(0, 20)) {
      console.log(`  ${c.locale}@${c.width} (${c.viewportName}) - ${c.error}`);
    }
  }
  return infraFailures.length > 0 ? 1 : 0;
}

async function runVerify(matrix) {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`Baseline not found at ${BASELINE_PATH} — run with --baseline first (I4 step 1).`);
    return 1;
  }
  const baselinePayload = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const baselineByKey = new Map(baselinePayload.matrix.map((c) => [keyFor(c), c]));

  let failCount = 0;
  const rows = [];

  for (const cell of matrix) {
    const row = {
      locale: cell.locale,
      viewportName: cell.viewportName,
      width: cell.width,
      pass: true,
      reasons: [],
    };

    if (!cell.infraOk) {
      row.pass = false;
      row.reasons.push(`infra: ${cell.error}`);
      failCount++;
      rows.push(row);
      continue;
    }

    row.realHeight = cell.realHeight;
    row.fallbackHeight = cell.fallbackHeight;
    row.delta = Math.abs(cell.delta);

    if (row.delta > 1) {
      row.pass = false;
      row.reasons.push(`|delta|=${row.delta}px > 1px tolerance (real=${row.realHeight}, fallback=${row.fallbackHeight})`);
    }

    const baselineCell = baselineByKey.get(keyFor(cell));
    if (baselineCell && baselineCell.infraOk) {
      row.baselineDelta = Math.abs(baselineCell.delta);
      row.baselineRealHeight = baselineCell.realHeight;
      row.baselineFallbackHeight = baselineCell.fallbackHeight;
      if (row.delta > row.baselineDelta) {
        row.pass = false;
        row.reasons.push(`delta worse than baseline (verify=${row.delta}px, baseline=${row.baselineDelta}px)`);
      }
    } else {
      // Task 668 revision-7 F3 precedent: a missing/failed baseline row must never silently pass.
      row.pass = false;
      row.reasons.push('no baseline cell to diff against (baseline infra failure or missing)');
    }

    if (!row.pass) failCount++;
    rows.push(row);
  }

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task670', `verify-${timestamp}`);
  mkdirSync(outputDir, { recursive: true });
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, mode: 'verify', rows }, null, 2));

  console.log('');
  console.log(`Verify: ${rows.length} cells, ${rows.length - failCount} PASS, ${failCount} FAIL`);
  console.log(`Manifest: ${manifestPath}`);

  console.log('');
  console.log('After-state delta table (real vs fallback) beside the baseline delta:');
  for (const r of rows) {
    if (r.baselineDelta === undefined) {
      console.log(`  ${r.locale}@${r.width} (${r.viewportName}): ${r.pass ? 'PASS' : 'FAIL: ' + r.reasons.join('; ')}`);
      continue;
    }
    console.log(`  ${r.locale}@${r.width} (${r.viewportName}): real=${r.realHeight}px fallback=${r.fallbackHeight}px delta=${r.delta}px (baseline delta=${r.baselineDelta}px) ${r.pass ? 'PASS' : 'FAIL: ' + r.reasons.join('; ')}`);
  }

  if (failCount > 0) {
    console.log('');
    console.log('Failing cells:');
    for (const r of rows.filter((x) => !x.pass)) {
      console.log(`  ${r.locale}@${r.width} (${r.viewportName}) - ${r.reasons.join('; ')}`);
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

  const PORT = 6016;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  console.log(`Task 670 hero-fallback-geometry QA capture — mode: ${MODE}`);
  console.log(`    Widths: ${WIDTHS.length} | Locales: ${LOCALES.length} | Subjects: ${SUBJECTS.length} = ${WIDTHS.length * LOCALES.length} cells`);
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
