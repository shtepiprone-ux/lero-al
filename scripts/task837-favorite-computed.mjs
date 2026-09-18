#!/usr/bin/env node
/**
 * task837-favorite-computed.mjs — Task 837 kickoff §13.3 computed-style probe (AC2, AC5).
 *
 * EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 * Modelled on `scripts/task806-card-track-computed.mjs` (own `node:http` static server over
 * `storybook-static/`, no dependency on an external server tool, Playwright Chromium headless).
 *
 * Captures, at 1440x900 and 390x844, locale en and uk:
 *   - every heart-bearing button in `patterns-mantine-listingdetailpattern--default` (badges-row
 *     favorite + share, both enabled sections, plus the E5 disabled-favorite section) and in
 *     `mantine-primitives-favoritebutton--default` (all icon-shape sections) — AC2/R1.
 *   - the corrected `DemoInquiryTrigger` Button in the pattern story vs the canonical
 *     `mantine-primitives-button--default` filled-variant sample — R3 "proven-equal" evidence for
 *     the one remaining Demo* node with no importable real component.
 *
 * Revision 1 (Task 837 §16.3.3, owner decision 2026-09-18) — for
 * `patterns-mantine-listingdetailpattern--default` only, also captures the top-alignment geometry
 * of every badges row: `firstBadgeTop`, `firstBadgeHeight`, `favoriteTop`, `shareTop`
 * (`getBoundingClientRect()`, CSS px) and a `badgeRows` count derived from distinct Badge `top`
 * values — AC10/AC11. Adds a 320x800 `uk` viewport cell for this story only, to capture the
 * wrapped-badges case. The capture fails a cell that finds no Badge or no favorite button in a
 * badges row (`badgeRowsError`).
 *
 * Guards against the manager-fallback render (Task 836 failure mode): asserts no
 * `#storybook-explorer-tree` node exists in the captured document.
 *
 * Usage: node scripts/task837-favorite-computed.mjs <runId>
 * Output: docs/sessions/evidence/task837/runs/<runId>/favorite-computed.json
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task837');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6041;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const LOCALES = ['en', 'uk'];

const runId = process.argv[2];
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: node scripts/task837-favorite-computed.mjs <runId>');
  process.exit(2);
}

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

// Evaluated in-page. Finds every element with role="button" (Mantine ActionIcon/Button both render
// a <button>) inside #storybook-root, tagged with its accessible name and a heart/share heuristic
// via aria-label content, and returns its computed geometry.
function evalButtons() {
  const explorerFallback = !!document.getElementById('storybook-explorer-tree');
  const root = document.getElementById('storybook-root');
  if (!root) return { explorerFallback, rootFound: false, buttons: [] };

  const nodes = Array.from(root.querySelectorAll('button'));
  const buttons = nodes.map((el, i) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      index: i,
      ariaLabel: el.getAttribute('aria-label'),
      title: el.getAttribute('title'),
      textContent: el.textContent?.trim().slice(0, 60) ?? '',
      disabled: el.disabled,
      width: rect.width,
      height: rect.height,
      borderTopWidth: cs.borderTopWidth,
      borderTopStyle: cs.borderTopStyle,
      borderTopColor: cs.borderTopColor,
      borderTopLeftRadius: cs.borderTopLeftRadius,
      backgroundColor: cs.backgroundColor,
      boxShadow: cs.boxShadow,
      buttonRadiusVar: cs.getPropertyValue('--button-radius') || null,
    };
  });
  return { explorerFallback, rootFound: true, buttons };
}

// Revision 1 (Task 837 §16.3.3, AC10/AC11). Evaluated in-page, `patterns-mantine-
// listingdetailpattern--default` only. A "badges row" is the outer `Group justify="space-between"`
// in `MantineListingDetailPattern.tsx:174`: a direct child `Group` holding the `Badge`s, and (when
// favorite/share exist) a sibling direct child `Group` holding the favorite button first and the
// share button second (JSX child order, locale-independent — `.mantine-Group-root`/
// `.mantine-Badge-root` are Mantine's own static class names, already used by
// `scripts/task791-detail-evidence.mjs`). `badgeRows` is the count of distinct (rounded) badge
// `top` values in that row, so a value >= 2 proves the row wrapped onto a second line.
function evalBadgeRows() {
  const root = document.getElementById('storybook-root');
  if (!root) return { rows: [], badgeRowsError: null };

  const rows = [];
  let badgeRowsError = null;
  const groups = Array.from(root.querySelectorAll('.mantine-Group-root'));

  for (const g of groups) {
    const directChildGroups = Array.from(g.children).filter((c) => c.classList.contains('mantine-Group-root'));
    if (directChildGroups.length === 0) continue;
    const badgesGroup = directChildGroups.find((c) => c.querySelector('.mantine-Badge-root'));
    if (!badgesGroup) continue;

    const badges = Array.from(badgesGroup.querySelectorAll('.mantine-Badge-root'));
    if (badges.length === 0) {
      badgeRowsError = 'badges group matched but contains zero Badge nodes';
      continue;
    }

    const iconsGroup = directChildGroups.find((c) => c !== badgesGroup && c.querySelector('button'));
    const buttons = iconsGroup ? Array.from(iconsGroup.querySelectorAll('button')) : [];
    const favoriteButton = buttons[0] ?? null;
    const shareButton = buttons[1] ?? null;
    if (!favoriteButton) {
      badgeRowsError = 'a badges row was found with no favorite button';
    }

    const firstBadgeRect = badges[0].getBoundingClientRect();
    const distinctTops = new Set(badges.map((b) => Math.round(b.getBoundingClientRect().top)));

    rows.push({
      firstBadgeTop: firstBadgeRect.top,
      firstBadgeHeight: firstBadgeRect.height,
      favoriteTop: favoriteButton ? favoriteButton.getBoundingClientRect().top : null,
      shareTop: shareButton ? shareButton.getBoundingClientRect().top : null,
      badgeCount: badges.length,
      badgeRows: distinctTops.size,
    });
  }

  if (rows.length === 0) badgeRowsError = 'no badges row found on this story/cell';
  return { rows, badgeRowsError };
}

async function captureStory(browser, storyId, locale, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const cell = { storyId, locale, viewport };
  try {
    const url = `http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    cell.httpStatus = response ? response.status() : null;
    cell.ok = response ? response.ok() : false;
    if (cell.ok) {
      const measured = await page.evaluate(evalButtons);
      Object.assign(cell, measured);
      if (storyId === 'patterns-mantine-listingdetailpattern--default') {
        const badgeRowMeasured = await page.evaluate(evalBadgeRows);
        Object.assign(cell, badgeRowMeasured);
      }
    }
  } catch (err) {
    cell.error = err instanceof Error ? err.message : String(err);
  } finally {
    await context.close();
  }
  return cell;
}

async function main() {
  let gitCommit;
  try {
    gitCommit = computeGitCommit();
  } catch (err) {
    console.error(`Unable to resolve git HEAD: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  await mkdir(RUNS_DIR, { recursive: true });
  const runDir = join(RUNS_DIR, runId);
  await mkdir(runDir);

  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch({ headless: true });

  const STORIES = [
    'patterns-mantine-listingdetailpattern--default',
    'mantine-primitives-favoritebutton--default',
    'mantine-primitives-button--default',
  ];
  const PATTERN_STORY = 'patterns-mantine-listingdetailpattern--default';
  // Revision 1 (§16.3.3) — 320x800 uk only, and only for the pattern story: proves the wrapped-
  // badges case at the Q2-mandatory mobile width.
  const WRAP_VIEWPORT_CELL = { locale: 'uk', viewport: { width: 320, height: 800 } };

  const result = { runId, gitCommit, capturedAt: new Date().toISOString(), port: PORT, cells: [] };
  let hardFail = false;

  try {
    for (const storyId of STORIES) {
      for (const locale of LOCALES) {
        for (const viewport of VIEWPORTS) {
          const cell = await captureStory(browser, storyId, locale, viewport);
          if (!cell.ok || cell.explorerFallback || !cell.rootFound) hardFail = true;
          if (storyId === PATTERN_STORY && cell.badgeRowsError) hardFail = true;
          result.cells.push(cell);
        }
      }
    }
    const wrapCell = await captureStory(browser, PATTERN_STORY, WRAP_VIEWPORT_CELL.locale, WRAP_VIEWPORT_CELL.viewport);
    if (!wrapCell.ok || wrapCell.explorerFallback || !wrapCell.rootFound || wrapCell.badgeRowsError) hardFail = true;
    result.cells.push(wrapCell);
  } finally {
    await browser.close();
    await new Promise((res) => server.close(res));
  }

  const outPath = join(runDir, 'favorite-computed.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task837-favorite-computed: one or more cells failed (see ok/explorerFallback/rootFound above).');
    process.exit(1);
  }
  console.log('\n✅ task837-favorite-computed: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
