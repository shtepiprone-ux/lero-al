#!/usr/bin/env node
/**
 * check-homepage-grid.mjs — Task 828 retarget to the canonical Mantine homepage Story.
 *
 * Owner rule (2026-09-17, quoted in kickoff §5.1): "ми не покриваємо тестами TailWind Stories, ми
 * покриваємо лише Mantine" — legacy `System/*` Stories are excluded from every test. This gate now
 * measures ONLY `Patterns/Mantine/HomepageListingGrids` (`--default` / `--loading`), the canonical
 * Mantine coverage story that statically imports the real production `FeaturedListingsView` and
 * `LatestListingsView` (`src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`).
 *
 * Task 701's original I-A (column-step) and I-B (grid-gap) invariants are REMOVED, not re-tuned:
 * owner decisions D74-1/D74-4 (`tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md`,
 * 2026-09-10) replaced the per-surface `cols={{base,sm,xl,xxl}}` column ladder with one shared
 * rail track — `FeaturedListingsView`/`LatestListingsView` render `<MantineListingCardTrack
 * mode="rail">` unconditionally, so a fixed column-count/gap assertion describes a layout the
 * product no longer has. Rail geometry (visible-card-count must not shrink as the viewport grows)
 * is covered separately by `npm run check:card-track-monotonicity` (Task 815) against every
 * canonical Mantine Story that renders the track, `HomepageListingGrids` included. What that gate
 * does NOT assert is that Featured/Latest stay in `rail` MODE at all — that is this gate's I-G
 * below, added because removing I-A also removed the only existing guard against a regression back
 * to `display:grid`.
 *
 * Retained invariants (kickoff §4, still describing the real product):
 *   I-C  Featured header row geometry           (unchanged rules, retargeted story)
 *   I-D  Featured/Latest loading skeleton count  3 / 4 items on `--loading`
 *   I-E  No page-level horizontal scroll         scrollWidth <= clientWidth + 2
 *   I-F  1408px page cap                         `--width-page-max` (globals.css) content box
 *   I-G  Rail mode                                both tracks are flex/overflow-x rails, never grid,
 *                                                  anywhere in their subtree (review 1/R13 below)
 *
 * None of the five invariants above locate anything by a Tailwind or CSS-Modules-hashed class name.
 * I-D's wrapper class (`featured-listings` / `latest-listings`, `FeaturedListingsView.tsx` /
 * `LatestListingsView.tsx` loading branches only) is the track's own stable, project-authored global
 * class — not a build artifact. I-G locates each rail/grid scroller structurally: a flex element
 * with horizontal overflow (or a grid element) that contains a `.listing-card` descendant, in DOM
 * order (Featured always renders before Latest in the story's `Stack`) — the same mechanism-agnostic
 * approach Task 701 used for I-A, kept because the populated (`--default`) tracks carry no className
 * of their own (only the loading branches do).
 *
 * Review 1 (2026-09-17, P2/R7) — the first implementation took the first two DOM-order candidates as
 * "the two tracks" and silently ignored any candidate beyond that. A `display:grid` element nested
 * INSIDE a rail (a real regression, or the reviewer's own counter-probe) is itself a candidate: when
 * nested inside Featured it became DOM-order candidate 2 and was misread as "the Latest track",
 * failing the WRONG row; when nested inside Latest it became candidate 3 and was dropped entirely —
 * both rows PASSed (fail-open). Fixed (R13): the TOP-LEVEL set is candidates with no candidate
 * ancestor — there must be exactly 2, or the run fails closed naming `found`/`topLevel`/`nested` so
 * nothing is silently dropped — and every other candidate is attributed to whichever top-level track's
 * subtree (`Node.contains`) holds it, failing that track's own row (`nested-grid`/`nested-rail`),
 * never its sibling.
 *
 * Two modes:
 *   node scripts/check-homepage-grid.mjs                 Assert the real tree. Exit 0 iff every
 *                                                         invariant holds on both target stories.
 *   node scripts/check-homepage-grid.mjs --verify-gate    Self-test (CI-safe, no product-code
 *                                                         edits). Negative arm: every invariant
 *                                                         PASSes on the unmodified real tree. Then,
 *                                                         for each of I-C/I-D/I-E/I-F/I-G plus I-G's
 *                                                         own nested-grid case (R14), an in-page
 *                                                         `page.evaluate` plant trips THAT invariant
 *                                                         and no other, restored in a `finally`
 *                                                         block. A plant that does not trip, trips
 *                                                         the wrong row, trips a sibling row, or
 *                                                         survives the run is a gate defect (non-zero
 *                                                         exit).
 *
 * Reuses the already-built storybook-static/ (run `npm run build-storybook` first).
 */

import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');

const LOCALES = ['sq', 'en', 'uk', 'it'];

// ── Canonical Mantine targets (R1/R12) — the gate's ONLY story targets. ──
const DEFAULT_ID = 'patterns-mantine-homepagelistinggrids--default';
const LOADING_ID = 'patterns-mantine-homepagelistinggrids--loading';

// ── I-C — Featured header geometry (kickoff R3). Rules and epsilon are byte-identical to the
// pre-828 gate; only the target story and locator changed (§5.2 — do not retune these). ──
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

// ── I-D — loading skeleton count (kickoff R4). FeaturedListingsView.tsx:73 / LatestListingsView
// .tsx:51 pass this class ONLY on the loading branch. ──
const SKELETON_WIDTHS = [320, 1024, 1440];
const SKELETON_WRAPPER_CLASS = { Featured: 'featured-listings', Latest: 'latest-listings' };
const SKELETON_EXPECTED_COUNT = { Featured: 3, Latest: 4 };

// ── I-E — no page-level horizontal scroll (kickoff R5). Same 11-width matrix the pre-828 gate used
// for its step matrix. ──
const NOSCROLL_WIDTHS = [320, 375, 390, 640, 768, 1024, 1280, 1440, 1536, 1920, 2560];

// ── I-F — 1408px page cap (kickoff R6). `--width-page-max: 88rem` (globals.css:299) = 1408px. ──
const CAP_WIDTHS = [1536, 1920, 2560];
const CONTAINER_CAP_PX = 1408;

// ── I-G — rail mode (kickoff R7, Opus addition — not the owner's option text; see kickoff §5.2).
// Asserts D74-4 (both sections are rails at every width), the only guard I-A used to provide. ──
const RAIL_WIDTHS = [320, 1024, 1440];
const RAIL_COMPONENTS = ['Featured', 'Latest'];

// ── Static server (unchanged boilerplate). ──

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

// ── I-C evaluator — ported from the pre-828 gate, with ONE locator fix (R9): the pre-828 locator
// (`display:flex` + `querySelector('h2')`, i.e. any descendant) also matched the canonical story's
// outer `Stack` (itself `display:flex`, wrapping the header's h2 several levels down), which the
// legacy per-story render never had. Requiring the h2 to be a DIRECT child isolates the header
// `Group` again (measured, I0 probe: 2 matches before the fix, 1 after, at every cell) — a locator
// fix, not a rule change; `HEADER_EXPECTED_RULES` above is untouched. ──
/* eslint-disable no-undef */
async function evalHeaderCell({ plantGapPx }) {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };

  const all = root.querySelectorAll('*');
  const candidates = [];
  for (const el of all) {
    if (getComputedStyle(el).display === 'flex' && [...el.children].some((c) => c.tagName === 'H2')) {
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

  // Plant (kickoff R8, I-C): force --group-gap to a non-zero value the row must not tolerate,
  // BEFORE the "live" measurement — so the plant is what "live" observes. Restored below.
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

  if (width >= 640) {
    if (groupDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`Group rect delta ${groupDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
    if (titleDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`Title rect delta ${titleDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
    if (linkDeltaMax > RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`ViewAllLink rect delta ${linkDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`); }
  }
  if (liveOverflow > syntheticOverflow + RECT_EPSILON_PX) { row.pass = false; row.reasons.push(`worse overflow with real gap than synthetic gap:0 (${liveOverflow.toFixed(2)}px > ${syntheticOverflow.toFixed(2)}px)`); }

  return row;
}

// ── I-D evaluator — both wrapper classes are measured in ONE page load (both Views render on the
// same `--loading` story), so a plant on one component's row is provably inert on the sibling row
// (kickoff R8's "no other" requirement) within a single navigation. The wrapper class
// (`featured-listings` / `latest-listings`) is on MantineListingCardTrack's WRAPPER Box, not its
// scroller; the scroller (`.rail`, first element child) is what actually holds the item nodes. ──
/* eslint-disable no-undef */
function evalSkeletonCell({ plantComponent, wrapperClasses }) {
  function measure(wrapperClass, doPlant) {
    const wrapper = document.querySelector(`.${wrapperClass}`);
    if (!wrapper) return { found: false, reason: 'wrapper-not-found' };
    const rail = wrapper.firstElementChild;
    if (!rail) return { found: false, reason: 'rail-not-found' };
    if (getComputedStyle(rail).display !== 'flex') {
      return { found: false, reason: `rail-not-flex:${getComputedStyle(rail).display}` };
    }
    let restore = null;
    if (doPlant) {
      const removedNode = rail.lastElementChild;
      if (removedNode) rail.removeChild(removedNode);
      restore = () => { if (removedNode) rail.appendChild(removedNode); };
    }
    const childrenCount = rail.children.length;
    if (restore) restore();
    return { found: true, childrenCount };
  }
  return {
    Featured: measure(wrapperClasses.Featured, plantComponent === 'Featured'),
    Latest: measure(wrapperClasses.Latest, plantComponent === 'Latest'),
  };
}
/* eslint-enable no-undef */

// ── I-E evaluator. ──
/* eslint-disable no-undef */
function evalNoScrollCell({ plant }) {
  let restore = null;
  if (plant) {
    const prev = document.body.style.getPropertyValue('min-width');
    document.body.style.setProperty('min-width', '3000px');
    restore = () => {
      if (prev) document.body.style.setProperty('min-width', prev);
      else document.body.style.removeProperty('min-width');
    };
  }
  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;
  const noHScroll = scrollWidth <= clientWidth + 2;
  if (restore) restore();
  return { noHScroll, scrollWidth, clientWidth };
}
/* eslint-enable no-undef */

// ── I-F evaluator — locates the element whose computed max-width resolves to 1408px
// (`--width-page-max: 88rem`), independent of the Mantine style-prop mechanism that produced it. ──
/* eslint-disable no-undef */
function evalPageCapCell({ plant }) {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };
  const all = [...root.querySelectorAll('*')];
  const frame = all.find((el) => Math.abs(parseFloat(getComputedStyle(el).maxWidth) - 1408) < 1);
  if (!frame) return { infra: true, found: false };

  let restore = null;
  if (plant) {
    const prev = frame.style.getPropertyValue('max-width');
    frame.style.setProperty('max-width', '3000px');
    restore = () => {
      if (prev) frame.style.setProperty('max-width', prev);
      else frame.style.removeProperty('max-width');
    };
  }

  const cs = getComputedStyle(frame);
  const rect = frame.getBoundingClientRect();
  const contentWidthPx = rect.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (restore) restore();

  return { infra: true, found: true, contentWidthPx };
}
/* eslint-enable no-undef */

// ── I-G evaluator — locates BOTH tracks by structure (no class name): a flex element with
// horizontal overflow containing a `.listing-card` descendant is a rail; a `display:grid` element
// containing one is a regression. Featured always precedes Latest in the story's `Stack`, so DOM
// order alone assigns index 0 -> Featured, index 1 -> Latest.
//
// Review 1 (R13) — candidates are no longer taken as the first two in DOM order. A candidate whose
// ancestor is ALSO a candidate is nested (e.g. a `display:grid` wrapper injected inside a rail, by
// a real regression or by a plant) and must never be mistaken for the sibling top-level track. The
// TOP-LEVEL set is exactly the candidates with no candidate ancestor; there must be exactly 2, or
// every row fails `track-count=<n> expected=2` naming `found`/`topLevel`/`nested` so nothing is
// dropped silently. Every remaining (nested) candidate is attributed to the one top-level track
// whose subtree contains it (`Node.contains`), and marks that track's own row `nested-grid` or
// `nested-rail`, independent of whether the top-level track itself still measures as a rail.
//
// `plantIndex` (existing, kept) flips one TOP-LEVEL track's own inline style to `display:grid` —
// the top-level regression case. `plantNestedComponent` (R14, new) instead wraps that track's last
// item in a freshly created `display:grid` `div` appended inside it — the nested-regression case
// R13 exists to catch. Both locate their target from the pre-plant top-level identity, so locating
// is never plant-affected, matching the pre-828 gate's locate-then-plant-then-measure-then-restore
// shape for I-A. ──
/* eslint-disable no-undef */
function evalRailCell({ plantIndex, plantNestedComponent }) {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };

  function collectCandidates() {
    return [...root.querySelectorAll('*')].filter((el) => {
      if (!el.querySelector('.listing-card')) return false;
      const cs = getComputedStyle(el);
      return (cs.display === 'flex' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll')) || cs.display === 'grid';
    });
  }

  const candidates = collectCandidates();
  const topLevel = candidates.filter((c) => !candidates.some((other) => other !== c && other.contains(c)));

  if (topLevel.length !== 2) {
    return {
      infra: true,
      found: candidates.length,
      topLevelCount: topLevel.length,
      nestedCount: candidates.length - topLevel.length,
      tracks: [],
    };
  }

  const tracked = topLevel; // index 0 -> Featured, index 1 -> Latest (DOM order preserved by the filter above)

  let restoreRegression = null;
  if (plantIndex != null) {
    const target = tracked[plantIndex];
    const prevDisplay = target.style.getPropertyValue('display');
    const prevOverflowX = target.style.getPropertyValue('overflow-x');
    target.style.setProperty('display', 'grid');
    target.style.setProperty('overflow-x', 'visible');
    restoreRegression = () => {
      if (prevDisplay) target.style.setProperty('display', prevDisplay);
      else target.style.removeProperty('display');
      if (prevOverflowX) target.style.setProperty('overflow-x', prevOverflowX);
      else target.style.removeProperty('overflow-x');
    };
  }

  let restoreNested = null;
  if (plantNestedComponent != null) {
    const idx = plantNestedComponent === 'Featured' ? 0 : 1;
    const rail = tracked[idx];
    const item = rail.lastElementChild;
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    rail.appendChild(wrap);
    wrap.appendChild(item);
    restoreNested = () => {
      rail.appendChild(item);
      wrap.remove();
    };
  }

  const candidatesAfterPlant = collectCandidates();
  const nested = candidatesAfterPlant.filter((c) => !tracked.includes(c));

  const tracks = tracked.map((el) => {
    const cs = getComputedStyle(el);
    const isRail = cs.display === 'flex' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll');
    const isGrid = cs.display === 'grid';
    const nestedUnder = nested.filter((n) => el.contains(n));
    const nestedGrid = nestedUnder.some((n) => getComputedStyle(n).display === 'grid');
    const nestedRail = nestedUnder.some((n) => {
      const ncs = getComputedStyle(n);
      return ncs.display === 'flex' && (ncs.overflowX === 'auto' || ncs.overflowX === 'scroll');
    });
    return { isRail, isGrid, display: cs.display, overflowX: cs.overflowX, nestedGrid, nestedRail };
  });

  if (restoreNested) restoreNested();
  if (restoreRegression) restoreRegression();

  return {
    infra: true,
    found: candidatesAfterPlant.length,
    topLevelCount: 2,
    nestedCount: candidatesAfterPlant.length - 2,
    tracks,
  };
}
/* eslint-enable no-undef */

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
          page, baseUrl, DEFAULT_ID, locale, width, 900,
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

async function runSkeletonMatrix(browser, baseUrl, { onlyWidths, onlyLocales, plantComponent } = {}) {
  const rows = [];
  const widths = onlyWidths ?? SKELETON_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const locale of locales) {
    for (const width of widths) {
      const page = await browser.newPage();
      let outcome;
      try {
        outcome = await navigateAndCheck(
          page, baseUrl, LOADING_ID, locale, width, 900,
          evalSkeletonCell,
          { plantComponent: plantComponent ?? null, wrapperClasses: SKELETON_WRAPPER_CLASS }
        );
      } catch (err) {
        outcome = { renderFailed: true, error: String(err).slice(0, 300) };
      } finally {
        await page.close();
      }
      for (const component of ['Featured', 'Latest']) {
        const expected = SKELETON_EXPECTED_COUNT[component];
        const row = { matrix: 'skeleton', invariant: `I-D ${component}`, component, locale, width, expected, pass: true, reasons: [] };
        if (outcome.renderFailed) {
          row.pass = false;
          row.reasons.push(outcome.error);
        } else {
          const r = outcome.result[component];
          if (!r.found) {
            row.pass = false;
            row.reasons.push(r.reason);
          } else if (r.childrenCount !== expected) {
            row.pass = false;
            row.reasons.push(`skeletonCount=${r.childrenCount} expected=${expected}`);
          }
        }
        rows.push(row);
      }
    }
  }
  return rows;
}

async function runNoScrollMatrix(browser, baseUrl, { onlyWidths, onlyLocales, plant } = {}) {
  const rows = [];
  const widths = onlyWidths ?? NOSCROLL_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const locale of locales) {
    for (const width of widths) {
      const row = { matrix: 'noScroll', invariant: 'I-E No horizontal scroll', locale, width, pass: true, reasons: [] };
      const page = await browser.newPage();
      try {
        const outcome = await navigateAndCheck(
          page, baseUrl, DEFAULT_ID, locale, width, 900,
          evalNoScrollCell,
          { plant: plant ?? false }
        );
        if (outcome.renderFailed) {
          row.pass = false;
          row.reasons.push(outcome.error);
        } else if (!outcome.result.noHScroll) {
          row.pass = false;
          row.reasons.push(`scrollWidth=${outcome.result.scrollWidth} clientWidth=${outcome.result.clientWidth}`);
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

async function runPageCapMatrix(browser, baseUrl, { onlyWidths, onlyLocales, plant } = {}) {
  const rows = [];
  const widths = onlyWidths ?? CAP_WIDTHS;
  const locales = onlyLocales ?? LOCALES;

  for (const locale of locales) {
    for (const width of widths) {
      const row = { matrix: 'pageCap', invariant: 'I-F Page cap', locale, width, pass: true, reasons: [] };
      const page = await browser.newPage();
      try {
        const outcome = await navigateAndCheck(
          page, baseUrl, DEFAULT_ID, locale, width, 900,
          evalPageCapCell,
          { plant: plant ?? false }
        );
        if (outcome.renderFailed) {
          row.pass = false;
          row.reasons.push(outcome.error);
        } else if (!outcome.result.infra) {
          row.pass = false;
          row.reasons.push(`infra: ${outcome.result.reason}`);
        } else if (!outcome.result.found) {
          row.pass = false;
          row.reasons.push('page-frame-not-found');
        } else if (outcome.result.contentWidthPx > CONTAINER_CAP_PX + 2) {
          row.pass = false;
          row.reasons.push(`contentWidthPx=${outcome.result.contentWidthPx} > cap=${CONTAINER_CAP_PX}`);
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

async function runRailMatrix(browser, baseUrl, { onlyWidths, onlyLocales, plantComponent, plantNestedComponent } = {}) {
  const rows = [];
  const widths = onlyWidths ?? RAIL_WIDTHS;
  const locales = onlyLocales ?? LOCALES;
  const plantIndex = plantComponent ? RAIL_COMPONENTS.indexOf(plantComponent) : null;

  for (const locale of locales) {
    for (const width of widths) {
      const page = await browser.newPage();
      let outcome;
      try {
        outcome = await navigateAndCheck(
          page, baseUrl, DEFAULT_ID, locale, width, 900,
          evalRailCell,
          { plantIndex, plantNestedComponent: plantNestedComponent ?? null }
        );
      } catch (err) {
        outcome = { renderFailed: true, error: String(err).slice(0, 300) };
      } finally {
        await page.close();
      }
      RAIL_COMPONENTS.forEach((component, index) => {
        const row = { matrix: 'rail', invariant: `I-G ${component}`, component, locale, width, pass: true, reasons: [] };
        if (outcome.renderFailed) {
          row.pass = false;
          row.reasons.push(outcome.error);
        } else if (!outcome.result.infra) {
          row.pass = false;
          row.reasons.push(`infra: ${outcome.result.reason}`);
        } else if (outcome.result.topLevelCount !== 2) {
          row.pass = false;
          row.reasons.push(
            `track-count=${outcome.result.topLevelCount} expected=2 (found=${outcome.result.found} nested=${outcome.result.nestedCount})`
          );
        } else {
          const t = outcome.result.tracks[index];
          if (t.isGrid) {
            row.pass = false;
            row.reasons.push(`regressed-to-grid display=${t.display}`);
          } else if (t.nestedGrid) {
            row.pass = false;
            row.reasons.push(`nested-grid inside ${component} track`);
          } else if (t.nestedRail) {
            row.pass = false;
            row.reasons.push(`nested-rail inside ${component} track`);
          } else if (!t.isRail) {
            row.pass = false;
            row.reasons.push(`unexpected display=${t.display} overflowX=${t.overflowX}`);
          }
        }
        rows.push(row);
      });
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
    console.log(`    ✗ ${r.invariant} @ ${r.locale}@${r.width}${r.component ? ` (${r.component})` : ''} - ${r.reasons.join('; ')}`);
  }
}

async function runFullGate(browser, baseUrl) {
  const header = await runHeaderMatrix(browser, baseUrl);
  const skeleton = await runSkeletonMatrix(browser, baseUrl);
  const noScroll = await runNoScrollMatrix(browser, baseUrl);
  const pageCap = await runPageCapMatrix(browser, baseUrl);
  const rail = await runRailMatrix(browser, baseUrl);
  return { header, skeleton, noScroll, pageCap, rail };
}

// ── R12 — printed scope, first block of every run. ──
function printScope() {
  console.log('check-homepage-grid.mjs — canonical Mantine scope only\n');
  console.log(`Targets: ${DEFAULT_ID}, ${LOADING_ID}`);
  console.log(
    'Invariants: I-C header geometry (12) · I-D loading skeleton count (24) · ' +
    'I-E no page-level horizontal scroll (44) · I-F 1408px page cap (12) · I-G rail mode (24, ' +
    'review 1/R13 — also fails a nested display:grid or nested rail found anywhere inside a ' +
    'top-level track, attributed to the track that contains it, never dropped past the top-level pair)'
  );
  console.log(
    'Excluded: legacy System/* Stories (owner rule 2026-09-17 — Tailwind Stories are not covered ' +
    'by tests) · rail visible-card-count monotonicity (covered by `npm run ' +
    'check:card-track-monotonicity`, Task 815, not this gate)\n'
  );
}

// ── Normal mode ──

async function runGate(baseUrl, browser) {
  printScope();
  const { header, skeleton, noScroll, pageCap, rail } = await runFullGate(browser, baseUrl);

  const headerSummary = summarize(header);
  const skeletonSummary = summarize(skeleton);
  const noScrollSummary = summarize(noScroll);
  const pageCapSummary = summarize(pageCap);
  const railSummary = summarize(rail);

  printSummary('I-C header', headerSummary);
  printSummary('I-D skeleton count', skeletonSummary);
  printSummary('I-E no horizontal scroll', noScrollSummary);
  printSummary('I-F page cap', pageCapSummary);
  printSummary('I-G rail mode', railSummary);

  const totalFail = headerSummary.fail + skeletonSummary.fail + noScrollSummary.fail + pageCapSummary.fail + railSummary.fail;
  const totalCells = headerSummary.total + skeletonSummary.total + noScrollSummary.total + pageCapSummary.total + railSummary.total;
  console.log(`\nTOTAL: ${totalCells - totalFail}/${totalCells} PASS, ${totalFail} FAIL`);
  return totalFail === 0 ? 0 : 1;
}

// ── --verify-gate mode ──

const PLANTS = [
  {
    id: 'I-C-Header',
    describe: 'Header geometry: set --group-gap to 40px at 1440/en (a value the row must not tolerate; expected 16px)',
    run: (browser, baseUrl) => runHeaderMatrix(browser, baseUrl, { onlyWidths: [1440], onlyLocales: ['en'], plantGapPx: 40 }),
    expectReason: (r) => /computed columnGap=40px expected=16px/.test(r.reasons.join(';')),
  },
  {
    id: 'I-D-Featured-skeleton-count',
    describe: 'Featured skeleton count: remove one skeleton card from the loading rail at 1024/en (expected childrenCount=3)',
    run: (browser, baseUrl) => runSkeletonMatrix(browser, baseUrl, { onlyWidths: [1024], onlyLocales: ['en'], plantComponent: 'Featured' }),
    expectReason: (r) => /skeletonCount=2 expected=3/.test(r.reasons.join(';')),
  },
  {
    id: 'I-E-No-Scroll',
    describe: 'Horizontal scroll: force body min-width to 3000px at 1440/en (page-level overflow must never pass)',
    run: (browser, baseUrl) => runNoScrollMatrix(browser, baseUrl, { onlyWidths: [1440], onlyLocales: ['en'], plant: true }),
    expectReason: (r) => /scrollWidth=\d+ clientWidth=\d+/.test(r.reasons.join(';')),
  },
  {
    id: 'I-F-Page-Cap',
    describe: 'Page cap: widen the 1408px page frame to 3000px at 1920/en (content box must never exceed the cap)',
    run: (browser, baseUrl) => runPageCapMatrix(browser, baseUrl, { onlyWidths: [1920], onlyLocales: ['en'], plant: true }),
    expectReason: (r) => /contentWidthPx=\d+(\.\d+)? > cap=1408/.test(r.reasons.join(';')),
  },
  {
    id: 'I-G-Rail-Mode',
    describe: 'Rail mode: flip the Featured track to display:grid at 1024/en (expected: rail regression detected)',
    run: (browser, baseUrl) => runRailMatrix(browser, baseUrl, { onlyWidths: [1024], onlyLocales: ['en'], plantComponent: 'Featured' }),
    expectReason: (r) => /regressed-to-grid/.test(r.reasons.join(';')),
  },
  {
    id: 'I-G-Nested-Grid',
    describe: 'Nested grid (R13/R14, review 1): wrap the Latest rail\'s last item in a new display:grid div at 1024/en (expected: attributed to Latest, not Featured, and not silently dropped past the top-level pair)',
    run: (browser, baseUrl) => runRailMatrix(browser, baseUrl, { onlyWidths: [1024], onlyLocales: ['en'], plantNestedComponent: 'Latest' }),
    expectReason: (r) => /nested-grid inside Latest track/.test(r.reasons.join(';')),
  },
];

async function runVerifyGate(baseUrl, browser) {
  printScope();
  console.log('check-homepage-grid.mjs --verify-gate');
  console.log('Purpose: prove the gate is not a no-op, per-invariant (kickoff R8).\n');

  let overallPass = true;

  // ── Negative arm — no plant, every invariant PASSes on the real tree. ──
  console.log('── Negative arm: no plant, full real-tree matrix ──');
  const { header, skeleton, noScroll, pageCap, rail } = await runFullGate(browser, baseUrl);
  const headerSummary = summarize(header);
  const skeletonSummary = summarize(skeleton);
  const noScrollSummary = summarize(noScroll);
  const pageCapSummary = summarize(pageCap);
  const railSummary = summarize(rail);
  printSummary('I-C header', headerSummary);
  printSummary('I-D skeleton count', skeletonSummary);
  printSummary('I-E no horizontal scroll', noScrollSummary);
  printSummary('I-F page cap', pageCapSummary);
  printSummary('I-G rail mode', railSummary);
  const negativeFail = headerSummary.fail + skeletonSummary.fail + noScrollSummary.fail + pageCapSummary.fail + railSummary.fail;
  if (negativeFail === 0) {
    console.log('✅ Negative arm PASS — 0 FAIL on the unmodified tree.\n');
  } else {
    console.log(`❌ Negative arm FAILED — ${negativeFail} cell(s) failed on the UNMODIFIED tree. Gate is broken or tree has drifted.\n`);
    overallPass = false;
  }

  // ── Six per-invariant plants (R8, +R14 from review 1). ──
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
    if (tripped.length > 1) {
      console.log(`❌ ${plant.id}: plant tripped ${tripped.length} rows — cross-trip into a sibling row: ${JSON.stringify(tripped.map((r) => r.reasons))}\n`);
      overallPass = false;
      continue;
    }
    if (!plant.expectReason(tripped[0])) {
      console.log(`❌ ${plant.id}: plant tripped an assertion with the WRONG reason: ${JSON.stringify(tripped[0].reasons)}\n`);
      overallPass = false;
      continue;
    }
    console.log(`✅ ${plant.id}: plant correctly tripped its own invariant, no unrelated row affected.\n`);
  }

  // ── Post-plant re-check — confirm no plant survives (AC4). ──
  console.log('── Post-plant re-check: negative arm again, confirming full restore ──');
  const { header: header2, skeleton: skeleton2, noScroll: noScroll2, pageCap: pageCap2, rail: rail2 } = await runFullGate(browser, baseUrl);
  const restoredFail = summarize(header2).fail + summarize(skeleton2).fail + summarize(noScroll2).fail + summarize(pageCap2).fail + summarize(rail2).fail;
  if (restoredFail === 0) {
    console.log('✅ Tree fully restored — 0 FAIL after all six plants.\n');
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

  // R9 — fail closed if the discovered index lacks either target ID; never a silent skip.
  const index = JSON.parse(await readFile(join(storybookStaticDir, 'index.json'), 'utf8'));
  const missingIds = [DEFAULT_ID, LOADING_ID].filter((id) => !index.entries?.[id]);
  if (missingIds.length > 0) {
    console.error(`storybook-static/index.json is missing required story id(s): ${missingIds.join(', ')}`);
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
