#!/usr/bin/env node
/**
 * check-homepage-grid.mjs — Task 701 consolidated homepage-grid invariants CI gate.
 *
 * Owner directive (2026-07-31, step 2 of the post-693 cleanup sequence): the Featured/Latest
 * column-step, gap, and header-row invariants that protect the homepage grids currently live in
 * three task-numbered Playwright probes that NO CI job runs:
 *   - scripts/task420-qa-grid-step.mjs      (column steps + supporting checks, incl. Similar)
 *   - scripts/task668-qa-grid-1440.mjs      (column steps + gaps, Featured/Latest)
 *   - scripts/task668-qa-header-geometry.mjs (Featured header-row geometry)
 * Task 691 (ListingCard de-Tailwind) lands directly on top of these grids next. This gate ports
 * every assertion those three probes make into ONE neutrally-named check that runs inside the
 * existing `rendered-proof` CI job (no new job, no second Storybook build).
 *
 * The three original probes are left on disk untouched — deleting/renaming them is step 3 of the
 * owner sequence and explicitly out of scope here (kickoff §8, R6).
 *
 * Ported invariants (kickoff §3.5), each transcribed verbatim from its source probe, not
 * re-derived from theme values or the current render (R8/A1):
 *   I-A  Featured column steps   1 -> 2@640 -> 3@1280 -> 4@1440   (task668-qa-grid-1440.mjs)
 *   I-A  Latest column steps     1 -> 2@768 -> 3@1440             (task668-qa-grid-1440.mjs)
 *   I-A  Similar column steps    unmigrated Tailwind, steps@1536  (task420-qa-grid-step.mjs)
 *   I-B  Featured grid gap       16px (theme.spacing.md)          (task668-qa-grid-1440.mjs)
 *   I-B  Latest grid gap         12px (theme.spacing.sm)          (task668-qa-grid-1440.mjs)
 *   I-C  Featured header row     Group geometry == pre-migration flex row (task668-qa-header-geometry.mjs)
 *   I-D  Featured/Latest loading skeleton count  3 / 4 grid direct children (task668-qa-grid-1440.mjs:77,
 *        added Task 703 — F1 of the Task 701 review, ported into the existing gap-matrix pass, no new cells)
 *   supporting  no horizontal scroll (scrollWidth <= clientWidth + 2)     (task420-qa-grid-step.mjs)
 *   supporting  .container-wide content box <= 1408px at >=1536          (task420-qa-grid-step.mjs)
 *
 * This is a PORT, not a wrapper (A2): each source probe's own story/width/locale matrix and
 * locator mechanism is reproduced here directly — the script never shells out to the three
 * originals.
 *
 * Two modes:
 *   node scripts/check-homepage-grid.mjs                 Assert the real tree. Exit 0 iff every
 *                                                         invariant holds on all matrices.
 *   node scripts/check-homepage-grid.mjs --verify-gate    Self-test (CI-safe, no product-code
 *                                                         edits). Negative arm: every invariant
 *                                                         PASSes on the unmodified real tree.
 *                                                         Then, for each of the seven invariants in
 *                                                         kickoff §I5 (Task 701) / §3.4 (Task 703,
 *                                                         I-D), an in-page `page.evaluate`
 *                                                         plant is applied, measured, asserted to
 *                                                         trip THAT invariant (and no other), and
 *                                                         restored in a `finally` block. A plant
 *                                                         that fails to reproduce, that trips the
 *                                                         wrong assertion, or that survives the run
 *                                                         is a gate defect (non-zero exit).
 *
 * Reuses the already-built storybook-static/ (same build screenshots:assert / the three probes
 * use). Run `npm run build-storybook` first.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');

const LOCALES = ['sq', 'en', 'uk', 'it'];

// ── I-A (Featured/Similar) + supporting — transcribed verbatim from
// scripts/task420-qa-grid-step.mjs EXPECTED_COLS_BY_WIDTH / VIEWPORTS / CONTAINER_CAP_PX. ──

const STEP_WIDTHS = [320, 375, 390, 640, 768, 1024, 1280, 1440, 1536, 1920, 2560];
const CONTAINER_CAP_PX = 1408;

const STEP_EXPECTED_COLS = {
  featured: { 320: 1, 375: 1, 390: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1440: 4, 1536: 4, 1920: 4, 2560: 4 },
  similar:  { 320: 1, 375: 1, 390: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1440: 3, 1536: 4, 1920: 4, 2560: 4 },
};

const STEP_STORIES = [
  {
    id: 'system-featuredlistings--default',
    label: 'FeaturedListings/Default',
    invariant: 'I-A Featured',
    expectedColsKey: 'featured',
    locator: 'mechanism-agnostic', // first display:grid inside #storybook-root with >=1 .listing-card descendant
  },
  {
    id: 'system-similarlistings--default',
    label: 'SimilarListings/Default',
    invariant: 'I-A Similar',
    expectedColsKey: 'similar',
    locator: 'tailwind-tokens', // ORIGINAL hardcoded-Tailwind locator, kept verbatim (A4) — proves NOT migrated
  },
];

// ── I-A (Featured/Latest) + I-B (gaps) — transcribed verbatim from
// scripts/task668-qa-grid-1440.mjs WIDTHS / EXPECTED_COLS / EXPECTED_GAP_PX. ──

const GAP_WIDTHS = [320, 640, 768, 1024, 1280, 1439, 1440, 1535, 1536, 1920];

const GAP_EXPECTED_COLS = {
  Featured: { 320: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1439: 3, 1440: 4, 1535: 4, 1536: 4, 1920: 4 },
  Latest:   { 320: 1, 640: 1, 768: 2, 1024: 2, 1280: 2, 1439: 2, 1440: 3, 1535: 3, 1536: 3, 1920: 3 },
};
const GAP_EXPECTED_PX = { Featured: 16, Latest: 12 };

// ── I-D — transcribed verbatim from scripts/task668-qa-grid-1440.mjs:77 EXPECTED_SKELETON_COUNT.
// Grid direct-children count on the loading branch (cards, not .mantine-Skeleton-root elements —
// kickoff Task 703 A1). Live count read and confirmed 3/4 before this assertion existed (I2),
// against FeaturedListingsView.tsx:59 / LatestListingsView.tsx:44. Checked inside the existing
// gap-matrix pass (A2) — no new story matrix, no new cells. ──
const GAP_EXPECTED_SKELETON_COUNT = { Featured: 3, Latest: 4 };

const GAP_STORIES = [
  { id: 'system-featuredlistings--default', component: 'Featured', branch: 'populated' },
  { id: 'system-featuredlistings--loading', component: 'Featured', branch: 'loading' },
  { id: 'system-latestlistings--default', component: 'Latest', branch: 'populated' },
  { id: 'system-latestlistings--loading', component: 'Latest', branch: 'loading' },
];

// ── I-C — Featured header geometry. Task 724R deliberately made the header stack at
// <640px so its title and View all action retain usable inline space on narrow screens. The
// original Task 668 probe predates that responsive contract and incorrectly required the wide
// row at 320px. Keep the same wide-row assertion from 640px upward, and assert the intentional
// compact column branch at 320px. ──

const HEADER_STORY_ID = 'system-featuredlistings--default';
const HEADER_WIDTHS = [320, 640, 1440];
const RECT_EPSILON_PX = 0.5;
const HEADER_EXPECTED_RULES = {
  compact: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
    marginBottom: '24px',
    columnGap: '16px',
  },
  wide: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginBottom: '24px',
    columnGap: '16px',
  },
};

function headerExpectedRules(width) {
  return width < 640 ? HEADER_EXPECTED_RULES.compact : HEADER_EXPECTED_RULES.wide;
}

// ── Static server (shared boilerplate, verbatim pattern from all three source probes). ──

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

function renderFailureCheck() {
  if (document.body.classList.contains('sb-show-errordisplay')) {
    const errEl = document.querySelector('#error-message') || document.body;
    return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
  }
  const root = document.querySelector('#storybook-root');
  if (root && root.children.length === 0) return { failed: true, reason: 'blank-canvas', detail: '' };
  return { failed: false, reason: null, detail: '' };
}

// ── In-page grid measurement, with an optional in-page plant (§I5). ──
//
// locatorType: 'mechanism-agnostic' (task420 Featured), 'tailwind-tokens' (task420 Similar,
// verbatim), 'first-grid' (task668, dual locator — first display:grid element).
// plant: { type: 'cols', tracks: N } | { type: 'gap', px: N } | null. Applied via inline style on
// the located grid element, measured, then removed in the SAME evaluate call before returning —
// the DOM never carries a plant across a call boundary (A3).
/* eslint-disable no-undef */
function evalGridCell({ locatorType, plant }) {
  function tokens(el) { return (el.className || '').toString().split(/\s+/); }

  let grid = null;
  if (locatorType === 'tailwind-tokens') {
    grid = [...document.querySelectorAll('div')].find((d) => {
      const t = tokens(d);
      return t.includes('grid') && t.includes('grid-cols-1') &&
        t.includes('sm:grid-cols-2') && t.includes('xl:grid-cols-3') && t.includes('2xl:grid-cols-4');
    });
  } else if (locatorType === 'mechanism-agnostic') {
    const root = document.querySelector('#storybook-root');
    if (root) {
      grid = [...root.querySelectorAll('*')].find(
        (el) => getComputedStyle(el).display === 'grid' && el.querySelector('.listing-card')
      );
    }
  } else {
    // 'first-grid' — task668 dual locator, no .listing-card requirement.
    const root = document.querySelector('#storybook-root');
    if (root) {
      grid = [...root.querySelectorAll('*')].find((el) => getComputedStyle(el).display === 'grid');
    }
  }
  if (!grid) return { found: false };

  let restore = null;
  if (plant && plant.type === 'cols') {
    const prev = grid.style.getPropertyValue('grid-template-columns');
    grid.style.setProperty('grid-template-columns', `repeat(${plant.tracks}, 1fr)`);
    restore = () => {
      if (prev) grid.style.setProperty('grid-template-columns', prev);
      else grid.style.removeProperty('grid-template-columns');
    };
  } else if (plant && plant.type === 'gap') {
    const prevCol = grid.style.getPropertyValue('column-gap');
    const prevRow = grid.style.getPropertyValue('row-gap');
    grid.style.setProperty('column-gap', `${plant.px}px`);
    grid.style.setProperty('row-gap', `${plant.px}px`);
    restore = () => {
      if (prevCol) grid.style.setProperty('column-gap', prevCol);
      else grid.style.removeProperty('column-gap');
      if (prevRow) grid.style.setProperty('row-gap', prevRow);
      else grid.style.removeProperty('row-gap');
    };
  } else if (plant && plant.type === 'removeChild') {
    // I-D plant (Task 703) — remove the last skeleton card so childrenCount is wrong; restore by
    // re-appending the SAME node (last child removed, so appendChild restores its original slot).
    const removedNode = grid.lastElementChild;
    if (removedNode) grid.removeChild(removedNode);
    restore = () => {
      if (removedNode) grid.appendChild(removedNode);
    };
  }

  const cs = getComputedStyle(grid);
  const colsStr = cs.gridTemplateColumns;
  const tracks = colsStr.split(/\s+/).filter((t) => t && t !== '0px');
  const columnGap = cs.columnGap;
  const rowGap = cs.rowGap;
  const childrenCount = grid.children.length;

  let containerWidthPx = null;
  let ancestor = grid.parentElement;
  while (ancestor) {
    if (tokens(ancestor).includes('container-wide')) {
      const style = getComputedStyle(ancestor);
      const rect = ancestor.getBoundingClientRect();
      containerWidthPx = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      break;
    }
    ancestor = ancestor.parentElement;
  }

  const noHScroll = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;

  if (restore) restore();

  return {
    found: true,
    columnCount: tracks.length,
    gridTemplateColumns: colsStr,
    columnGap,
    rowGap,
    childrenCount,
    containerWidthPx,
    noHScroll,
  };
}
/* eslint-enable no-undef */

// ── In-page header-geometry measurement — ported verbatim from
// scripts/task668-qa-header-geometry.mjs, with an optional pre-set --group-gap plant applied
// BEFORE the live measurement (instead of the original's post-hoc synthetic-0 probe, which is
// preserved unchanged as the SAME internal effectiveness check). ──
/* eslint-disable no-undef */
async function evalHeaderCell({ plantGapPx }) {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };

  const all = root.querySelectorAll('*');
  const candidates = [];
  for (const el of all) {
    if (getComputedStyle(el).display === 'flex' && el.querySelector('h2')) {
      candidates.push(el);
    }
  }
  if (candidates.length !== 1) {
    return {
      infra: false,
      reason: candidates.length === 0 ? 'no-group-match' : 'multiple-group-matches',
      count: candidates.length,
    };
  }
  const group = candidates[0];
  const title = group.querySelector('h2');
  if (!title) return { infra: false, reason: 'no-title' };
  const viewAllLink = group.lastElementChild;
  if (!viewAllLink || viewAllLink === title) {
    return { infra: false, reason: 'no-viewalllink-distinct' };
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  }

  function measure() {
    const cs = getComputedStyle(group);
    return {
      group: rectOf(group),
      title: rectOf(title),
      viewAllLink: rectOf(viewAllLink),
      clientWidth: group.clientWidth,
      scrollWidth: group.scrollWidth,
      computed: {
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        flexWrap: cs.flexWrap,
        marginBottom: cs.marginBottom,
        columnGap: cs.columnGap,
      },
    };
  }

  // Plant (§I5 I-C): force --group-gap to a non-zero value the row must not tolerate, BEFORE the
  // "live" measurement — so the plant is what "live" observes. Restored in the outer finally.
  let plantRestore = null;
  if (plantGapPx != null) {
    const prev = group.style.getPropertyValue('--group-gap');
    group.style.setProperty('--group-gap', `${plantGapPx}px`);
    plantRestore = () => {
      if (prev) group.style.setProperty('--group-gap', prev);
      else group.style.removeProperty('--group-gap');
    };
  }

  const live = measure();

  const savedValue = group.style.getPropertyValue('--group-gap');
  const savedPriority = group.style.getPropertyPriority('--group-gap');
  const wasAbsent = savedValue === '';

  let synthetic;
  try {
    group.style.setProperty('--group-gap', '0px');
    await new Promise((r) => requestAnimationFrame(r));
    synthetic = measure();
  } finally {
    if (wasAbsent) group.style.removeProperty('--group-gap');
    else group.style.setProperty('--group-gap', savedValue, savedPriority);
    // Undo the plant fully — the pre-plant state had no inline --group-gap at all.
    if (plantRestore) plantRestore();
  }

  if (synthetic.computed.columnGap !== '0px') {
    return {
      infra: false,
      reason: `synthetic probe ineffective: columnGap=${synthetic.computed.columnGap} expected=0px`,
    };
  }

  return { infra: true, live, synthetic };
}
/* eslint-enable no-undef */

function rectDelta(a, b) {
  return {
    x: Math.abs(a.x - b.x), y: Math.abs(a.y - b.y),
    width: Math.abs(a.width - b.width), height: Math.abs(a.height - b.height),
  };
}
function maxOf(delta) { return Math.max(delta.x, delta.y, delta.width, delta.height); }

function evaluateHeaderRow({ geometry, error, width }) {
  const row = { pass: true, reasons: [] };
  if (error) {
    row.pass = false;
    row.reasons.push(error);
    return row;
  }
  if (!geometry.infra) {
    row.pass = false;
    row.reasons.push(`infra: ${geometry.reason}`);
    return row;
  }

  const { live, synthetic } = geometry;

  if (synthetic.computed.columnGap !== '0px') {
    row.pass = false;
    row.reasons.push(`synthetic probe ineffective: columnGap=${synthetic.computed.columnGap} expected=0px`);
  }

  const expectedRules = headerExpectedRules(width);
  for (const [prop, expected] of Object.entries(expectedRules)) {
    if (live.computed[prop] !== expected) {
      row.pass = false;
      row.reasons.push(`computed ${prop}=${live.computed[prop]} expected=${expected}`);
    }
  }

  const groupDeltaMax = maxOf(rectDelta(live.group, synthetic.group));
  const titleDeltaMax = maxOf(rectDelta(live.title, synthetic.title));
  const linkDeltaMax = maxOf(rectDelta(live.viewAllLink, synthetic.viewAllLink));
  row.groupDeltaMax = groupDeltaMax;
  row.titleDeltaMax = titleDeltaMax;
  row.linkDeltaMax = linkDeltaMax;

  const liveOverflow = Math.max(0, live.scrollWidth - live.clientWidth);
  const syntheticOverflow = Math.max(0, synthetic.scrollWidth - synthetic.clientWidth);
  row.liveOverflowPx = liveOverflow;
  row.syntheticOverflowPx = syntheticOverflow;

  // In the intentional compact column branch, setting the synthetic gap to 0 necessarily moves
  // the second flex child vertically. The probe still proves it can change `--group-gap`, but
  // zero geometry delta is only a meaningful wide-row invariant.
  if (width >= 640) {
    if (groupDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`Group rect delta ${groupDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
    if (titleDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`Title rect delta ${titleDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
    if (linkDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`ViewAllLink rect delta ${linkDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
  }
  if (liveOverflow > syntheticOverflow + RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`worse overflow with real gap than synthetic gap:0 (${liveOverflow.toFixed(2)}px > ${syntheticOverflow.toFixed(2)}px)`); }

  return row;
}

// ── Matrix runners ──

async function navigateAndCheck(page, baseUrl, storyId, locale, width, height, evalFn, evalArgs) {
  const storyUrl = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
  const pageErrors = [];
  const handler = (err) => { pageErrors.push(err.message.slice(0, 200)); };
  page.on('pageerror', handler);
  try {
    await page.setViewportSize({ width, height });
    await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(400);

    const renderResult = await page.evaluate(renderFailureCheck);
    const renderFailed = renderResult.failed || pageErrors.length > 0;
    if (renderFailed) {
      return { renderFailed: true, error: `render: ${renderResult.reason ?? pageErrors[0] ?? 'unknown'}` };
    }
    const result = await page.evaluate(evalFn, evalArgs);
    return { renderFailed: false, result };
  } finally {
    page.off('pageerror', handler);
  }
}

async function runStepMatrixReal(browser, baseUrl, { onlyStoryId, onlyWidths, onlyLocales, plant } = {}) {
  const rows = [];
  const stories = onlyStoryId ? STEP_STORIES.filter((s) => s.id === onlyStoryId) : STEP_STORIES;
  const widths = onlyWidths ?? STEP_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const story of stories) {
    for (const locale of locales) {
      for (const width of widths) {
        const expectedCols = STEP_EXPECTED_COLS[story.expectedColsKey][width];
        const row = { matrix: 'step', invariant: story.invariant, storyId: story.id, label: story.label, locale, width, expectedCols, pass: true, reasons: [] };
        const page = await browser.newPage();
        try {
          const cellPlant = plant && plant.storyId === story.id && plant.width === width && plant.locale === locale ? plant.spec : null;
          const outcome = await navigateAndCheck(
            page, baseUrl, story.id, locale, width, 900,
            evalGridCell,
            { locatorType: story.locator, plant: cellPlant }
          );
          if (outcome.renderFailed) {
            row.pass = false;
            row.reasons.push(outcome.error);
          } else {
            const grid = outcome.result;
            row.grid = grid;
            if (!grid.found) {
              row.pass = false;
              row.reasons.push('grid-not-found');
            } else {
              if (grid.columnCount !== expectedCols) {
                row.pass = false;
                row.reasons.push(`columnCount=${grid.columnCount} expected=${expectedCols}`);
              }
              if (!grid.noHScroll) {
                row.pass = false;
                row.reasons.push('horizontal-scroll-present');
              }
              if (width >= 1536 && grid.containerWidthPx !== null && grid.containerWidthPx > CONTAINER_CAP_PX + 2) {
                row.pass = false;
                row.reasons.push(`containerWidthPx=${grid.containerWidthPx} > cap=${CONTAINER_CAP_PX}`);
              }
            }
          }
        } catch (err) {
          row.pass = false;
          row.reasons.push(String(err).slice(0, 300));
        } finally {
          await page.close();
        }
        rows.push(row);
      }
    }
  }
  return rows;
}

async function runGapMatrix(browser, baseUrl, { onlyStoryId, onlyWidths, onlyLocales, plant } = {}) {
  const rows = [];
  const stories = onlyStoryId ? GAP_STORIES.filter((s) => s.id === onlyStoryId) : GAP_STORIES;
  const widths = onlyWidths ?? GAP_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const story of stories) {
    for (const locale of locales) {
      for (const width of widths) {
        const expectedCols = GAP_EXPECTED_COLS[story.component][width];
        const expectedGap = GAP_EXPECTED_PX[story.component];
        const expectedSkeleton = story.branch === 'loading' ? GAP_EXPECTED_SKELETON_COUNT[story.component] : null;
        const row = {
          matrix: 'gap',
          invariant: story.branch === 'loading' ? `I-A/I-B/I-D ${story.component}` : `I-A/I-B ${story.component}`,
          storyId: story.id,
          component: story.component, branch: story.branch, locale, width,
          expectedCols, expectedGap, expectedSkeleton, pass: true, reasons: [],
        };
        const page = await browser.newPage();
        try {
          const cellPlant = plant && plant.storyId === story.id && plant.width === width && plant.locale === locale ? plant.spec : null;
          const outcome = await navigateAndCheck(
            page, baseUrl, story.id, locale, width, 900,
            evalGridCell,
            { locatorType: 'first-grid', plant: cellPlant }
          );
          if (outcome.renderFailed) {
            row.pass = false;
            row.reasons.push(outcome.error);
          } else {
            const grid = outcome.result;
            row.grid = grid;
            if (!grid.found) {
              row.pass = false;
              row.reasons.push('grid-not-found');
            } else {
              if (grid.columnCount !== expectedCols) {
                row.pass = false;
                row.reasons.push(`columnCount=${grid.columnCount} expected=${expectedCols}`);
              }
              const colGapPx = parseFloat(grid.columnGap);
              const rowGapPx = parseFloat(grid.rowGap);
              if (colGapPx !== expectedGap) {
                row.pass = false;
                row.reasons.push(`columnGap=${grid.columnGap} expected=${expectedGap}px`);
              }
              if (rowGapPx !== expectedGap) {
                row.pass = false;
                row.reasons.push(`rowGap=${grid.rowGap} expected=${expectedGap}px`);
              }
              // I-D — task668-qa-grid-1440.mjs:77 EXPECTED_SKELETON_COUNT, loading branch only.
              if (expectedSkeleton !== null && grid.childrenCount !== expectedSkeleton) {
                row.pass = false;
                row.reasons.push(`skeletonCount=${grid.childrenCount} expected=${expectedSkeleton}`);
              }
            }
          }
        } catch (err) {
          row.pass = false;
          row.reasons.push(String(err).slice(0, 300));
        } finally {
          await page.close();
        }
        rows.push(row);
      }
    }
  }
  return rows;
}

async function runHeaderMatrix(browser, baseUrl, { onlyWidths, onlyLocales, plantGapPx } = {}) {
  const rows = [];
  const widths = onlyWidths ?? HEADER_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const locale of locales) {
    for (const width of widths) {
      const row = { matrix: 'header', invariant: 'I-C Header', locale, width, pass: true, reasons: [] };
      const page = await browser.newPage();
      try {
        const outcome = await navigateAndCheck(
          page, baseUrl, HEADER_STORY_ID, locale, width, 900,
          evalHeaderCell,
          { plantGapPx: plantGapPx ?? null }
        );
        if (outcome.renderFailed) {
          Object.assign(row, evaluateHeaderRow({ error: outcome.error, width }));
        } else {
          Object.assign(row, evaluateHeaderRow({ geometry: outcome.result, width }));
        }
      } catch (err) {
        row.pass = false;
        row.reasons.push(String(err).slice(0, 300));
      } finally {
        await page.close();
      }
      rows.push(row);
    }
  }
  return rows;
}

function summarize(rows) {
  const pass = rows.filter((r) => r.pass).length;
  return { total: rows.length, pass, fail: rows.length - pass, failRows: rows.filter((r) => !r.pass) };
}

function printSummary(name, summary) {
  console.log(`  ${name}: ${summary.pass}/${summary.total} PASS, ${summary.fail} FAIL`);
  for (const r of summary.failRows.slice(0, 20)) {
    console.log(`    ✗ ${r.invariant} @ ${r.locale}@${r.width}${r.storyId ? ` (${r.storyId})` : ''} - ${r.reasons.join('; ')}`);
  }
}

async function runFullGate(browser, baseUrl) {
  const step = await runStepMatrixReal(browser, baseUrl);
  const gap = await runGapMatrix(browser, baseUrl);
  const header = await runHeaderMatrix(browser, baseUrl);
  return { step, gap, header };
}

// ── Normal mode ──

async function runGate(baseUrl, browser) {
  console.log('check-homepage-grid.mjs — asserting the real tree\n');
  const { step, gap, header } = await runFullGate(browser, baseUrl);

  const stepSummary = summarize(step);
  const gapSummary = summarize(gap);
  const headerSummary = summarize(header);

  printSummary('I-A/supporting (step matrix, task420 source)', stepSummary);
  printSummary('I-A/I-B/I-D (gap matrix, task668-grid-1440 source)', gapSummary);
  printSummary('I-C (header matrix, task668-header-geometry source)', headerSummary);

  const totalFail = stepSummary.fail + gapSummary.fail + headerSummary.fail;
  const totalCells = stepSummary.total + gapSummary.total + headerSummary.total;
  console.log(`\nTOTAL: ${totalCells - totalFail}/${totalCells} PASS, ${totalFail} FAIL`);
  return totalFail === 0 ? 0 : 1;
}

// ── --verify-gate mode ──

const PLANTS = [
  {
    id: 'I-A-Featured',
    describe: 'Featured column count: override grid-template-columns to 3 tracks at 1440 (expected 4)',
    run: (browser, baseUrl) => runStepMatrixReal(browser, baseUrl, {
      onlyStoryId: 'system-featuredlistings--default',
      onlyWidths: [1440],
      onlyLocales: ['en'],
      plant: { storyId: 'system-featuredlistings--default', width: 1440, locale: 'en', spec: { type: 'cols', tracks: 3 } },
    }),
    expectReason: (r) => /columnCount=3 expected=4/.test(r.reasons.join(';')),
  },
  {
    id: 'I-A-Latest',
    describe: 'Latest column count: override grid-template-columns to 2 tracks at 1440 (expected 3)',
    run: (browser, baseUrl) => runGapMatrix(browser, baseUrl, {
      onlyStoryId: 'system-latestlistings--default',
      onlyWidths: [1440],
      onlyLocales: ['en'],
      plant: { storyId: 'system-latestlistings--default', width: 1440, locale: 'en', spec: { type: 'cols', tracks: 2 } },
    }),
    expectReason: (r) => /columnCount=2 expected=3/.test(r.reasons.join(';')),
  },
  {
    id: 'I-A-Similar',
    describe: 'Similar column count: force 4-track (1440-migrated) behaviour at 1440 (expected 3, still Tailwind-1536)',
    run: (browser, baseUrl) => runStepMatrixReal(browser, baseUrl, {
      onlyStoryId: 'system-similarlistings--default',
      onlyWidths: [1440],
      onlyLocales: ['en'],
      plant: { storyId: 'system-similarlistings--default', width: 1440, locale: 'en', spec: { type: 'cols', tracks: 4 } },
    }),
    expectReason: (r) => /columnCount=4 expected=3/.test(r.reasons.join(';')),
  },
  {
    id: 'I-B-Featured-gap',
    describe: "Featured gap: plant Latest's 12px value onto Featured's grid at 1024 (expected 16px)",
    run: (browser, baseUrl) => runGapMatrix(browser, baseUrl, {
      onlyStoryId: 'system-featuredlistings--default',
      onlyWidths: [1024],
      onlyLocales: ['en'],
      plant: { storyId: 'system-featuredlistings--default', width: 1024, locale: 'en', spec: { type: 'gap', px: 12 } },
    }),
    expectReason: (r) => /columnGap=12px expected=16px/.test(r.reasons.join(';')) && /rowGap=12px expected=16px/.test(r.reasons.join(';')),
  },
  {
    id: 'I-B-Latest-gap',
    describe: "Latest gap: plant Featured's 16px value onto Latest's grid at 1024 (expected 12px)",
    run: (browser, baseUrl) => runGapMatrix(browser, baseUrl, {
      onlyStoryId: 'system-latestlistings--default',
      onlyWidths: [1024],
      onlyLocales: ['en'],
      plant: { storyId: 'system-latestlistings--default', width: 1024, locale: 'en', spec: { type: 'gap', px: 16 } },
    }),
    expectReason: (r) => /columnGap=16px expected=12px/.test(r.reasons.join(';')) && /rowGap=16px expected=12px/.test(r.reasons.join(';')),
  },
  {
    id: 'I-C-Header',
    describe: 'Header geometry: set --group-gap to 40px (a value the row must not tolerate; expected 16px)',
    run: (browser, baseUrl) => runHeaderMatrix(browser, baseUrl, { onlyWidths: [1440], onlyLocales: ['en'], plantGapPx: 40 }),
    expectReason: (r) => /computed columnGap=40px expected=16px/.test(r.reasons.join(';')),
  },
  {
    id: 'I-D-Featured-skeleton-count',
    describe: 'Featured skeleton count: remove one skeleton card from the loading grid at 1024 (expected childrenCount=3)',
    run: (browser, baseUrl) => runGapMatrix(browser, baseUrl, {
      onlyStoryId: 'system-featuredlistings--loading',
      onlyWidths: [1024],
      onlyLocales: ['en'],
      plant: { storyId: 'system-featuredlistings--loading', width: 1024, locale: 'en', spec: { type: 'removeChild' } },
    }),
    expectReason: (r) => /skeletonCount=2 expected=3/.test(r.reasons.join(';')),
  },
];

async function runVerifyGate(baseUrl, browser) {
  console.log('check-homepage-grid.mjs --verify-gate\n');
  console.log('Purpose: prove the gate is not a no-op, per-invariant (kickoff §I5/§3.4).\n');

  let overallPass = true;

  // ── Negative arm (R4) — no plant, every invariant PASSes on the real tree. ──
  console.log('── Negative arm: no plant, full real-tree matrix ──');
  const { step, gap, header } = await runFullGate(browser, baseUrl);
  const stepSummary = summarize(step);
  const gapSummary = summarize(gap);
  const headerSummary = summarize(header);
  printSummary('I-A/supporting', stepSummary);
  printSummary('I-A/I-B/I-D gap', gapSummary);
  printSummary('I-C header', headerSummary);
  const negativeFail = stepSummary.fail + gapSummary.fail + headerSummary.fail;
  if (negativeFail === 0) {
    console.log('✅ Negative arm PASS — 0/… FAIL on the unmodified tree.\n');
  } else {
    console.log(`❌ Negative arm FAILED — ${negativeFail} cell(s) failed on the UNMODIFIED tree. Gate is broken or tree has drifted from the transcribed tables.\n`);
    overallPass = false;
  }

  // ── Seven per-invariant plants (R3, R4, cross-swap per I5; I-D added Task 703). ──
  for (const plant of PLANTS) {
    console.log(`── Plant: ${plant.id} — ${plant.describe} ──`);
    const rows = await plant.run(browser, baseUrl);
    console.log(JSON.stringify(rows, null, 2));

    const tripped = rows.filter((r) => !r.pass);

    if (tripped.length === 0) {
      console.log(`❌ ${plant.id}: plant did not trip ANY assertion — gate is a no-op for this invariant.\n`);
      overallPass = false;
      continue;
    }
    const wrongReason = tripped.find((r) => !plant.expectReason(r));
    if (wrongReason) {
      console.log(`❌ ${plant.id}: plant tripped an assertion with the WRONG reason: ${JSON.stringify(wrongReason.reasons)}\n`);
      overallPass = false;
      continue;
    }
    console.log(`✅ ${plant.id}: plant correctly tripped its own invariant (${tripped.length} cell(s)), no unrelated cell affected.\n`);
  }

  // ── Confirm no plant survives (A3/AC4) — re-run the negative arm once more. ──
  console.log('── Post-plant re-check: negative arm again, confirming full restore ──');
  const { step: step2, gap: gap2, header: header2 } = await runFullGate(browser, baseUrl);
  const restoredFail = summarize(step2).fail + summarize(gap2).fail + summarize(header2).fail;
  if (restoredFail === 0) {
    console.log('✅ Tree fully restored — 0 FAIL after all seven plants.\n');
  } else {
    console.log(`❌ Tree NOT fully restored — ${restoredFail} cell(s) still failing after plants. A plant leaked.\n`);
    overallPass = false;
  }

  return overallPass ? 0 : 1;
}

// ── Entry point ──

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6020;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();

  let exitCode;
  try {
    exitCode = VERIFY_GATE ? await runVerifyGate(baseUrl, browser) : await runGate(baseUrl, browser);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  process.exit(exitCode);
}

main().catch((err) => { console.error(err); process.exit(1); });
