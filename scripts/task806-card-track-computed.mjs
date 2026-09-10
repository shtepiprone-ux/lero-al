#!/usr/bin/env node
/**
 * task806-card-track-computed.mjs — Task 806 kickoff §13 computed-style probe.
 *
 * AC2/AC7 require the shared listing-card track's COMPUTED geometry at every tested width, not a
 * source-code reading or a screenshot. No production consumer exists yet (Task 807), so this script
 * measures the BUILT STORYBOOK IFRAME directly — `Patterns/Mantine/ListingCardTrack` -> `Grid`/`Rail`
 * — never the live app.
 *
 * Modelled on `scripts/task803-similar-row-computed.mjs` (BASE_URL env, `git hash-object`/
 * `git rev-parse` identity via `child_process` with no shell, one immutable run directory per
 * invocation via `writeFile(..., { flag: 'wx' })`).
 *
 * PRECONDITION: `storybook-static/` must already be built (`npm run build-storybook`) and served at
 * BASE_URL, e.g. `npx http-server storybook-static -p 6006 -a 127.0.0.1` (any static file server
 * works — this script only ever GETs `/iframe.html`). It does not start a server itself, unlike
 * `scripts/task770-storybook-capture.mjs`, so the SAME served build can be probed repeatedly across
 * the two-armed plant/revert cycle without a restart between requests.
 *
 * EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:6006 node scripts/task806-card-track-computed.mjs <runId>
 * Output:
 *   docs/sessions/evidence/task806/runs/<runId>/card-track-computed.json
 *
 * Contract (kickoff §13):
 *   - Locale `uk` (project's standard stress locale). Widths 320/390/768/1024/1440 (AC7's exact set).
 *     Both modes: `Grid` (patterns-mantine-listingcardtrack--grid) and `Rail` (…--rail).
 *   - The track root is found by `findTrackRoot()` below: it descends from `#storybook-root` past
 *     Mantine's injected `<style data-mantine-styles>` siblings and the global decorator wrapper div
 *     to the first element computing `display: grid`/`flex` — see that function's own comment for
 *     the measured DOM shape this walk relies on. `AuthContext.Provider` is a React context, not a
 *     DOM wrapper, so nothing about the story's own composition adds an extra element.
 *   - Per cell: mode, width, root's computed display/gridTemplateColumns/overflowX, the resolved
 *     column count (grid — `gridTemplateColumns.split(' ')` track count), the first child's computed
 *     flexBasis and `getBoundingClientRect().width`, trackScrollWidth/trackClientWidth,
 *     docScrollWidth/docClientWidth, plus an `expected`/`measured`/`matchesExpectation` triple
 *     computed from the DOCUMENTED product contract (280px min, 16px `spacing-md` gap, 82% rail
 *     clamp — kickoff §3.4/§10.3), evaluated against the cell's OWN measured container width so a
 *     standalone-story's zero page-gutters (vs. the sprint doc's inference table, which assumed a
 *     padded page container) is not miscounted as a defect. See the session log's deviation note.
 *   - Fails closed (cell + run, exit 1) on: missing root node; zero-area root rect; `grid` mode not
 *     computing `display:grid`; `rail` mode not computing `display:flex` with `overflow-x` in
 *     auto/scroll; page-level horizontal overflow at 320 or 390; `matchesExpectation === false`
 *     (the two-armed plant's failing arm — kickoff §13 "Two-armed proof"). The "no `@media` was
 *     needed" condition is NOT re-checked at runtime here — it is a static property proven by AC3's
 *     grep, not something a rendered probe can observe.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task806');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:6006';

const WIDTHS = [320, 390, 768, 1024, 1440];
const LOCALE = 'uk';

// Documented product contract (D74-2, kickoff §10.1/§10.3) — NOT read from the live CSS variable.
// The probe's "expected" values are always derived from this constant, so a planted change to the
// live `--listing-card-min` diverges from expectation instead of silently reconfirming itself.
const DOCUMENTED_MIN_PX = 280;
const GAP_PX = 16; // Mantine spacing.md (theme.ts:351) — 1rem
const RAIL_CLAMP_PCT = 0.82;
const GRID_COLUMN_TOLERANCE = 0; // integer track count — exact match
const RAIL_FLEX_BASIS_TOLERANCE_PX = 3; // subpixel/rounding tolerance

const STORIES = [
  { mode: 'grid', storyId: 'patterns-mantine-listingcardtrack--grid' },
  { mode: 'rail', storyId: 'patterns-mantine-listingcardtrack--rail' },
];

const runId = process.argv[2];
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: BASE_URL=<storybook-static server> node scripts/task806-card-track-computed.mjs <runId>');
  process.exit(2);
}

function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task806-card-track-computed.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function expectedGridColumns(containerWidthPx) {
  return Math.max(1, Math.floor((containerWidthPx + GAP_PX) / (DOCUMENTED_MIN_PX + GAP_PX)));
}

function expectedRailFlexBasisPx(containerWidthPx) {
  return Math.min(DOCUMENTED_MIN_PX, Math.round(RAIL_CLAMP_PCT * containerWidthPx * 100) / 100);
}

/**
 * Descends from `#storybook-root` to the real `MantineListingCardTrack` root. Measured DOM shape
 * (both `Grid` and `Rail`): `#storybook-root` > two `<style data-mantine-styles>` siblings (Mantine's
 * injected stylesheet — `display: none`, zero-area, NOT the component) + one decorator wrapper div
 * (`.min-h-screen.bg-background.text-foreground`, the global Storybook decorator, `display: block`)
 * > the track div itself (Vite CSS Modules emits a pure-hash class here, e.g. `_grid_1i95f_12` — no
 * `MantineListingCardTrack` substring survives, unlike the webpack/Next build task803 measured — so
 * a class-name selector is not reliable here). This walk skips STYLE/SCRIPT siblings and single-child
 * decorator wrappers, stopping at the first element computing `display: grid`/`flex` (bounded depth,
 * safety against an unexpected decorator nesting change).
 */
function evalCell() {
  // Nested (not module-level): `page.evaluate(evalCell)` serializes only this function's own
  // source, not the module's other top-level functions — a sibling `findTrackRoot` would be a
  // `ReferenceError` inside the page context (measured).
  function findTrackRoot(storyRoot) {
    if (!storyRoot) return null;
    let current = storyRoot;
    for (let i = 0; i < 6; i++) {
      const d = getComputedStyle(current).display;
      if (current !== storyRoot && (d === 'grid' || d === 'flex')) return current;
      const contentChildren = Array.from(current.children).filter((el) => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT');
      if (contentChildren.length !== 1) return contentChildren[0] ?? current;
      current = contentChildren[0];
    }
    return current;
  }

  const storyRoot = document.getElementById('storybook-root') ?? document.querySelector('#root');
  const root = findTrackRoot(storyRoot);

  const docEl = document.documentElement;
  const docScrollWidth = docEl.scrollWidth;
  const docClientWidth = docEl.clientWidth;
  const pageOverflows = docScrollWidth > docClientWidth + 2;

  let rootRectZeroArea = null;
  let rootRectWidth = null;
  let display = null;
  let gridTemplateColumns = null;
  let overflowX = null;
  let columnCount = null;
  let trackScrollWidth = null;
  let trackClientWidth = null;
  let firstChildFound = false;
  let firstChildFlexBasis = null;
  let firstChildRectWidth = null;

  if (root) {
    const rect = root.getBoundingClientRect();
    rootRectZeroArea = rect.width <= 0 || rect.height <= 0;
    rootRectWidth = rect.width;
    const cs = getComputedStyle(root);
    display = cs.display;
    gridTemplateColumns = cs.gridTemplateColumns;
    overflowX = cs.overflowX;
    columnCount = gridTemplateColumns && gridTemplateColumns !== 'none'
      ? gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
      : null;
    trackScrollWidth = root.scrollWidth;
    trackClientWidth = root.clientWidth;

    const firstChild = root.children[0] ?? null;
    firstChildFound = !!firstChild;
    if (firstChild) {
      firstChildFlexBasis = getComputedStyle(firstChild).flexBasis;
      firstChildRectWidth = firstChild.getBoundingClientRect().width;
    }
  }

  return {
    rootFound: !!root,
    rootRectZeroArea,
    rootRectWidth,
    display,
    gridTemplateColumns,
    overflowX,
    columnCount,
    trackScrollWidth,
    trackClientWidth,
    firstChildFound,
    firstChildFlexBasis,
    firstChildRectWidth,
    docScrollWidth,
    docClientWidth,
    pageOverflows,
  };
}

async function main() {
  let probeHash;
  let gitCommit;
  try {
    probeHash = computeProbeHash();
    if (!probeHash) throw new Error('empty git hash-object output');
    gitCommit = computeGitCommit();
    if (!/^[0-9a-f]{40}$/i.test(gitCommit)) throw new Error('invalid git rev-parse HEAD output');
  } catch (err) {
    console.error(
      `\n❌ task806-card-track-computed: unable to identify the current Git tree (${
        err instanceof Error ? err.message : String(err)
      }). Refusing to write evidence without a reproducible commit.`
    );
    process.exit(1);
    return;
  }

  await mkdir(RUNS_DIR, { recursive: true });
  const runDir = join(RUNS_DIR, runId);
  await mkdir(runDir);

  const browser = await chromium.launch({ headless: true });
  const result = {
    runId,
    locale: LOCALE,
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
    probeHash,
    gitCommit,
    documentedContract: { minPx: DOCUMENTED_MIN_PX, gapPx: GAP_PX, railClampPct: RAIL_CLAMP_PCT },
    cells: [],
  };
  let hardFail = false;

  try {
    for (const { mode, storyId } of STORIES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const cell = { mode, storyId, width };

        try {
          const url = `${BASE_URL}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${LOCALE}`;
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          cell.httpStatus = response ? response.status() : null;
          cell.ok = response ? response.ok() : false;

          if (!cell.ok) {
            cell.failReason = `non-OK response status ${cell.httpStatus}`;
            hardFail = true;
          } else {
            const measured = await page.evaluate(evalCell);
            Object.assign(cell, measured);

            const reasons = [];
            if (!measured.rootFound) reasons.push('track root not found (#storybook-root firstElementChild)');
            if (measured.rootFound) {
              if (measured.rootRectZeroArea) reasons.push('root bounding rect has zero area');
              if (mode === 'grid' && measured.display !== 'grid') reasons.push(`grid mode display: ${measured.display}`);
              if (mode === 'rail') {
                if (measured.display !== 'flex') reasons.push(`rail mode display: ${measured.display}`);
                if (!['auto', 'scroll'].includes(measured.overflowX)) {
                  reasons.push(`rail mode overflowX not auto/scroll: ${measured.overflowX}`);
                }
              }
            }
            if ((width === 320 || width === 390) && measured.pageOverflows) {
              reasons.push(`pageOverflows at ${width}`);
            }

            // Two-armed proof assertion (kickoff §13) — expected derived from the DOCUMENTED
            // constant + the cell's OWN measured container width, never from the live CSS variable.
            if (measured.rootFound && !measured.rootRectZeroArea) {
              const containerWidthPx = measured.rootRectWidth;
              if (mode === 'grid' && measured.columnCount != null) {
                const expected = expectedGridColumns(containerWidthPx);
                const delta = Math.abs(measured.columnCount - expected);
                cell.expected = { columnCount: expected };
                cell.matchesExpectation = delta <= GRID_COLUMN_TOLERANCE;
                if (!cell.matchesExpectation) {
                  reasons.push(`grid columnCount mismatch: measured=${measured.columnCount} expected=${expected} (containerWidthPx=${containerWidthPx.toFixed(2)})`);
                }
              } else if (mode === 'rail' && measured.firstChildFound) {
                const expected = expectedRailFlexBasisPx(containerWidthPx);
                const measuredPx = measured.firstChildRectWidth;
                const delta = Math.abs(measuredPx - expected);
                cell.expected = { firstChildWidthPx: expected };
                cell.matchesExpectation = delta <= RAIL_FLEX_BASIS_TOLERANCE_PX;
                if (!cell.matchesExpectation) {
                  reasons.push(`rail firstChild width mismatch: measured=${measuredPx.toFixed(2)}px expected=${expected.toFixed(2)}px (containerWidthPx=${containerWidthPx.toFixed(2)})`);
                }
              }
            }

            if (reasons.length > 0) {
              cell.failReason = reasons.join('; ');
              hardFail = true;
            }
          }
        } catch (err) {
          cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
          hardFail = true;
        } finally {
          await context.close();
        }

        result.cells.push(cell);
      }
    }
  } finally {
    await browser.close();
  }

  const outPath = join(runDir, 'card-track-computed.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task806-card-track-computed: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task806-card-track-computed: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
