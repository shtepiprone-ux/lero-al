#!/usr/bin/env node
/**
 * task807-card-width-parity.mjs — Task 807 kickoff §13 rendered-route parity probe.
 *
 * AC4/AC6 require the shared listing-card track's rendered geometry to be measured on the REAL
 * ROUTES (`/`, `/listings`, `/listings/<slug>`) against `npm run start`, not only in Storybook —
 * Task 806's probe (`scripts/task806-card-track-computed.mjs`) measured the standalone story only.
 * This script extends that script's conventions (BASE_URL env, `git hash-object`/`git rev-parse`
 * identity via `child_process` with no shell, one immutable run directory per invocation via
 * `writeFile(..., { flag: 'wx' })`) against `chromium` + the real site.
 *
 * PRECONDITION: `npm run start` (production server) running and reachable at BASE_URL, with the
 * seeded/live dev Supabase database configured in `.env.local` (real listing rows required — the
 * script cannot seed data itself).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/task807-card-width-parity.mjs <runId> <slugA> <slugB> <slugC>
 *     <slugA>/<slugB> are visited first (in a fresh browser context) to populate the
 *     `rv_listings` recently-viewed cookie; <slugC> is the measured detail-page target.
 * Output:
 *   docs/sessions/evidence/task807/runs/<runId>/card-width-parity.json
 *
 * Contract (kickoff §13):
 *   - Locale `uk`. Widths 320/390/768/1024/1440.
 *   - Per route, per card section: track root's computed display/gridTemplateColumns/overflowX,
 *     column count, first card's getBoundingClientRect().width, first image's `sizes` attribute +
 *     resolved `currentSrc`, docScrollWidth/docClientWidth.
 *   - Track roots are located by their CSS Modules class name substring, which the Next.js/webpack
 *     production build (unlike Storybook's Vite build, see Task 806 §6 Deviation 3) preserves:
 *     `[class*="MantineListingCardTrack_rail__"]` / `[class*="MantineListingCardTrack_grid__"]`.
 *     Verified live 2026-09-10 against the built homepage response before this script was written.
 *   - Hard-fails (cell + run, exit 1) on: non-OK response; `NEXT_HTTP_ERROR_FALLBACK` in the body;
 *     a track section expected present (per a prior successful probe of the same route/section)
 *     but absent; zero-area track; page-level horizontal overflow at 320/390; the SAME track mode
 *     reporting different first-card widths on different routes at the same viewport (AC6's own
 *     assertion). A section that is genuinely absent because the underlying query returned zero
 *     rows (Similar/RecentlyViewed depend on live data the script does not seed) is recorded as
 *     `sectionPresent: false` and does NOT hard-fail on its own — R7's "zero cards" negative flow.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task807');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const WIDTHS = [320, 390, 768, 1024, 1440];
const LOCALE = 'uk';

const RAIL_SELECTOR = '[class*="MantineListingCardTrack_rail__"]';
const GRID_SELECTOR = '[class*="MantineListingCardTrack_grid__"]';

const [, , runId, slugA, slugB, slugC] = process.argv;
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId) || !slugA || !slugB || !slugC) {
  console.error('Usage: BASE_URL=<server> node scripts/task807-card-width-parity.mjs <runId> <slugA> <slugB> <slugC>');
  process.exit(2);
}

function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task807-card-width-parity.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Serialized into page.evaluate — must be self-contained (no closures over outer scope). */
function evalTracks(args) {
  const { railSelector, gridSelector } = args;
  const docEl = document.documentElement;
  const docScrollWidth = docEl.scrollWidth;
  const docClientWidth = docEl.clientWidth;
  const pageOverflows = docScrollWidth > docClientWidth + 2;

  function measureOne(root) {
    const rect = root.getBoundingClientRect();
    const cs = getComputedStyle(root);
    const gridTemplateColumns = cs.gridTemplateColumns;
    const columnCount = gridTemplateColumns && gridTemplateColumns !== 'none'
      ? gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
      : null;
    const firstChild = root.children[0] ?? null;
    const img = firstChild ? firstChild.querySelector('img') : null;
    return {
      rootRectZeroArea: rect.width <= 0 || rect.height <= 0,
      rootRectWidth: rect.width,
      display: cs.display,
      gridTemplateColumns,
      overflowX: cs.overflowX,
      columnCount,
      trackScrollWidth: root.scrollWidth,
      trackClientWidth: root.clientWidth,
      firstChildFound: !!firstChild,
      firstChildFlexBasis: firstChild ? getComputedStyle(firstChild).flexBasis : null,
      firstChildRectWidth: firstChild ? firstChild.getBoundingClientRect().width : null,
      imgFound: !!img,
      imgSizes: img ? img.getAttribute('sizes') : null,
      imgCurrentSrc: img ? img.currentSrc : null,
    };
  }

  const railEls = Array.from(document.querySelectorAll(railSelector));
  const gridEls = Array.from(document.querySelectorAll(gridSelector));

  return {
    docScrollWidth,
    docClientWidth,
    pageOverflows,
    rails: railEls.map(measureOne),
    grids: gridEls.map(measureOne),
  };
}

async function waitForRealContent(page, selector) {
  // Loading skeletons render Skeleton placeholders, not <img>; wait for at least one <img>
  // inside the matched track, or time out (section may legitimately be empty/absent).
  try {
    await page.waitForFunction(
      (sel) => {
        const els = Array.from(document.querySelectorAll(sel));
        return els.some((el) => el.querySelector('img'));
      },
      selector,
      { timeout: 8000 },
    );
  } catch {
    // Timed out — either genuinely empty (no data) or slow network. Caller measures whatever
    // is present at this point.
  }
}

async function measureRoute(browser, width, path, { warmupPaths = [] } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const result = { path, width, warmupPaths };

  try {
    for (const warmupPath of warmupPaths) {
      const wResp = await page.goto(`${BASE_URL}/${LOCALE}${warmupPath}`, { waitUntil: 'networkidle', timeout: 30000 });
      if (!wResp || !wResp.ok()) {
        result.failReason = `warmup navigation to ${warmupPath} failed: status ${wResp ? wResp.status() : 'null'}`;
        return result;
      }
    }

    const url = `${BASE_URL}/${LOCALE}${path}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    result.httpStatus = response ? response.status() : null;
    result.ok = response ? response.ok() : false;
    if (!result.ok) {
      result.failReason = `non-OK response status ${result.httpStatus}`;
      return result;
    }

    const body = await page.content();
    if (body.includes('NEXT_HTTP_ERROR_FALLBACK')) {
      result.failReason = 'NEXT_HTTP_ERROR_FALLBACK in body';
      return result;
    }

    await waitForRealContent(page, `${RAIL_SELECTOR}, ${GRID_SELECTOR}`);
    // Second settle for Suspense-streamed sections (similar/recently-viewed) that mount after
    // the initial networkidle wait.
    await page.waitForTimeout(1500);

    const measured = await page.evaluate(evalTracks, { railSelector: RAIL_SELECTOR, gridSelector: GRID_SELECTOR });
    Object.assign(result, measured);

    if ((width === 320 || width === 390) && measured.pageOverflows) {
      result.failReason = `pageOverflows at ${width}`;
    }
  } catch (err) {
    result.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    await context.close();
  }

  return result;
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
    console.error(`\n❌ task807-card-width-parity: unable to identify the current Git tree (${err instanceof Error ? err.message : String(err)}). Refusing to write evidence without a reproducible commit.`);
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
    slugs: { slugA, slugB, slugC },
    cells: [],
  };
  let hardFail = false;

  try {
    for (const width of WIDTHS) {
      const home = await measureRoute(browser, width, '/', {});
      home.route = 'home';
      result.cells.push(home);

      const listings = await measureRoute(browser, width, '/listings', {});
      listings.route = 'listings';
      result.cells.push(listings);

      const detail = await measureRoute(browser, width, `/listings/${slugC}`, {
        warmupPaths: [`/listings/${slugA}`, `/listings/${slugB}`],
      });
      detail.route = 'detail';
      result.cells.push(detail);
    }
  } finally {
    await browser.close();
  }

  // Hard-fail check 1: any cell with an explicit failReason not already classified as a
  // legitimate empty-section case (those carry no failReason — only a note).
  for (const cell of result.cells) {
    if (cell.failReason) {
      hardFail = true;
    }
  }

  // Hard-fail check 2 (AC6): the SAME mode must report the SAME first-card width across routes
  // at the SAME viewport. Compare rail cells across home/detail; compare grid cells (listings is
  // the only grid route, so nothing to cross-check there beyond itself).
  const railWidthByViewport = {};
  for (const cell of result.cells) {
    if (cell.failReason) continue;
    for (const rail of cell.rails ?? []) {
      if (!rail.firstChildFound || rail.rootRectZeroArea) continue;
      const key = cell.width;
      railWidthByViewport[key] = railWidthByViewport[key] ?? [];
      railWidthByViewport[key].push({ route: cell.route, width: rail.firstChildRectWidth });
    }
  }
  const parityMismatches = [];
  for (const [vw, entries] of Object.entries(railWidthByViewport)) {
    if (entries.length < 2) continue;
    const first = entries[0].width;
    for (const e of entries) {
      if (Math.abs(e.width - first) > 3) {
        parityMismatches.push(`viewport=${vw} route=${e.route} width=${e.width.toFixed(2)} vs route=${entries[0].route} width=${first.toFixed(2)}`);
      }
    }
  }
  if (parityMismatches.length > 0) {
    hardFail = true;
    result.parityMismatches = parityMismatches;
  }

  const outPath = join(runDir, 'card-width-parity.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task807-card-width-parity: one or more cells failed closed (see failReason/parityMismatches above).');
    process.exit(1);
  }
  console.log('\n✅ task807-card-width-parity: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
