#!/usr/bin/env node
/**
 * task810-rail-controls-probe.mjs — Task 810 kickoff §13/§18 (Revision 1) rendered-route probe.
 *
 * Extends `scripts/task807-card-width-parity.mjs`'s conventions (playwright chromium, BASE_URL
 * env, probeHash/gitCommit via execFileSync with no shell, one immutable run directory per
 * invocation via writeFile(..., { flag: 'wx' }), exit 1 on hard fail, 2 on usage error) to measure
 * the rail's prev/next controls (R1-R3), equal card heights (R4), the D74-5 single-card boundary
 * (R6), the D74-6 count-ladder peek (R7), and — Revision 1 — the container-query fix (R10),
 * BOTH the homepage and a detail route (R11), `grid` mode (R12), the D74-8 paging arithmetic
 * (R13), real hit-testability (R14), a widened width set (R15), and the selected rung itself (R16).
 *
 * PRECONDITION: `npm run build && npm run start` (production server) running and reachable at
 * BASE_URL, with the seeded/live dev Supabase database configured in `.env.local`.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 DETAIL_SLUG=<slug> node scripts/task810-rail-controls-probe.mjs <runId>
 * Output:
 *   docs/sessions/evidence/task810/runs/<runId>/rail-controls-probe.json
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task810');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const LOCALE = 'uk';

// R15 — the canonical Q3 set plus 750/1010, which sit inside the two cap-binding windows Revision 0
// flagged as untested, plus 1920/2560 (docs/qa-profiles.md's own canonical Q3 upper viewports,
// never measured before). 872 stays mandatory (the degenerate-peek case §3.3 measured).
const WIDTHS = [320, 390, 480, 481, 640, 750, 768, 872, 1010, 1024, 1440, 1920, 2560];

// Detail-route fixture. R11 — env-overridable, default is the owner's own reproduction slug
// (docs/sessions/2026-09-10-task810-the-rail-becomes-usable.md §6). Two other real seeded slugs
// warm the `rv_listings` recently-viewed cookie first (Task 807's own convention,
// scripts/task807-card-width-parity.mjs) — without a warmup, Recently-viewed/Similar render
// nothing for a fresh browser context and the detail route's track is never actually exercised.
const DETAIL_SLUG = process.env.DETAIL_SLUG ?? '11-mr7ucly4';
const WARMUP_SLUGS = ['apartament-ne-lungomare-mtuf41kg', '2-garazhde-mtueqmyb'];

const RAIL_SELECTOR = '[class*="MantineListingCardTrack"][class*="rail"]';
const GRID_SELECTOR = '[class*="MantineListingCardTrack"][class*="grid"]';

// D74-7/D74-9 — the rung ladder, now keyed on the CONTAINER (not the viewport). Mirrors
// MantineListingCardTrack.module.css's `@container` thresholds and `offset=36` exactly; kept here
// as an INDEPENDENT re-derivation (R16), not a copy-paste of the CSS, so the probe can actually
// catch a future drift between the two the way it could not catch Revision 0's viewport/container
// mismatch.
const RUNG_OFFSET = 36;
const RUNG_THRESHOLDS = [
  { minContainer: 1280, n: 5 }, // xl, theme.ts:326 — 1280px
  { minContainer: 1024, n: 4 }, // lg, theme.ts:325 — 1024px
  { minContainer: 768, n: 3 },  // md, theme.ts:324 — 768px
  { minContainer: 480, n: 2 },  // xs2, theme.ts:322 — 480px
  { minContainer: 0, n: 1 },
];

function expectedRailCardWidth(containerPx) {
  const rung = RUNG_THRESHOLDS.find((r) => containerPx >= r.minContainer);
  const n = rung.n;
  const pct = (100 / n - RUNG_OFFSET / (n * n)) / 100;
  const expected = Math.min(280, pct * containerPx);
  return { n, expected };
}

const [, , runId] = process.argv;
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: BASE_URL=<server> DETAIL_SLUG=<slug> node scripts/task810-rail-controls-probe.mjs <runId>');
  process.exit(2);
}

function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task810-rail-controls-probe.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Serialized into page.evaluate — must be self-contained (no closures over outer scope). */
function evalRailSection(args) {
  const { railSelector, index } = args;
  const rail = document.querySelectorAll(railSelector)[index];
  if (!rail) return null;
  const wrapper = rail.parentElement;
  const rect = rail.getBoundingClientRect();
  const cs = getComputedStyle(rail);
  const webkitRest = getComputedStyle(rail, '::-webkit-scrollbar');

  const children = Array.from(rail.children);
  const heights = children.map((c) => c.getBoundingClientRect().height);
  // All rail children sit in ONE flex row, so — unlike the grid's row-bucketed check — every
  // child here IS a genuine side-by-side sibling. Tolerant of sub-pixel rounding (<=1px).
  const equalHeightsRail = heights.length < 2 || (Math.max(...heights) - Math.min(...heights) <= 1);

  // Controls are DIRECT children of the wrapper (siblings of `.rail` itself, Task 810 §10.1) — this
  // never collides with a button nested inside a card's own content (favorite/copy-id).
  const controls = Array.from(wrapper.children).filter((c) => c.tagName === 'BUTTON');
  const controlLabels = controls.map((b) => b.getAttribute('aria-label'));

  // R14 — hit-testability, independent of the click test below. `document.elementFromPoint` at
  // each control's own centre must resolve to a node the control itself contains; this measures
  // the stacking fix's actual outcome without depending on Playwright scrolling anything into view.
  // Most of these sections sit below the fold at a 900px probe viewport height — an un-scrolled
  // check would silently skip almost every cell (an `inViewport:false` no-op looks identical to a
  // passing assertion, exactly the "cannot fail" gap R14 exists to close), so the wrapper is
  // scrolled to centre INSTANTLY (bypassing the page's own `scroll-behavior: smooth`, which would
  // otherwise still be mid-animation at the synchronous point this reads back its position) before
  // the point is read.
  wrapper.scrollIntoView({ block: 'center', behavior: 'instant' });
  const hitTests = controls.map((btn) => {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
      return { label: btn.getAttribute('aria-label'), inViewport: false, hit: null, atTag: null, atCls: null };
    }
    const at = document.elementFromPoint(cx, cy);
    return {
      label: btn.getAttribute('aria-label'),
      inViewport: true,
      hit: !!(at && btn.contains(at)),
      atTag: at ? at.tagName : null,
      atCls: at ? at.className : null,
    };
  });

  // Peek — the visible sliver of the first child whose right edge exceeds the rail's own right
  // boundary (the "next card" a user would scroll to).
  const railRight = rect.right;
  let peekPx = null;
  let peekCardWidth = null;
  for (const child of children) {
    const cr = child.getBoundingClientRect();
    if (cr.right > railRight + 0.5) {
      peekPx = railRight - cr.left;
      peekCardWidth = cr.width;
      break;
    }
  }

  return {
    containerWidth: wrapper.getBoundingClientRect().width,
    clientWidth: rail.clientWidth,
    scrollWidth: rail.scrollWidth,
    overflows: rail.scrollWidth > rail.clientWidth + 2,
    scrollbarWidthComputed: cs.scrollbarWidth,
    webkitScrollbarHeightRest: webkitRest.height,
    childCount: children.length,
    cardHeights: heights,
    equalHeights: equalHeightsRail,
    firstChildWidth: children[0] ? children[0].getBoundingClientRect().width : null,
    controlCount: controls.length,
    controlLabels,
    hitTests,
    peekPx,
    peekCardWidth,
  };
}

/** R12 — grid cell shape. Controls/peek/scrollbar are N/A for a grid (no wrapper is rendered). */
function evalGridSection(args) {
  const { gridSelector, index } = args;
  const grid = document.querySelectorAll(gridSelector)[index];
  if (!grid) return null;
  const cs = getComputedStyle(grid);
  const gtc = cs.gridTemplateColumns;
  const columnCount = gtc && gtc !== 'none' ? gtc.trim().split(/\s+/).filter(Boolean).length : 1;
  const children = Array.from(grid.children);
  const heights = children.map((c) => c.getBoundingClientRect().height);
  // R4 requires equal heights WITHIN a row of side-by-side siblings — CSS Grid's `align-items:
  // stretch` only stretches an item against the OTHER items in its own row. A single-column layout
  // (the common case at narrow widths, where `auto-fill minmax(280px,1fr)` fits only 1 column) has
  // no row-mate to stretch against at all, so per-row height differences there are the CORRECT,
  // expected behaviour, not a defect — bucket by row (columnCount items per row) and require
  // equality only within each bucket, tolerant of sub-pixel rounding (<=1px).
  let equalHeights = true;
  for (let i = 0; i < heights.length; i += columnCount) {
    const row = heights.slice(i, i + columnCount);
    if (row.length < 2) continue;
    if (Math.max(...row) - Math.min(...row) > 1) { equalHeights = false; break; }
  }
  // A grid renders no `.wrapper`/`RailControls` of its own (MantineListingCardTrack.tsx early-
  // returns for `mode==='grid'`) — match the SAME CSS-module class markers `RAIL_SELECTOR`/the
  // rail's `.control` use, not a locale-text heuristic (an aria-label substring match previously
  // caught the card's OWN "Copy listing ID" button, whose uk string also contains "оголошення").
  const strayControls = Array.from(grid.querySelectorAll('button[class*="MantineListingCardTrack"][class*="control"]'));
  return {
    columnCount,
    childCount: children.length,
    cardHeights: heights,
    equalHeights,
    controlCount: strayControls.length,
  };
}

async function waitForTrack(page, selector) {
  await page.waitForFunction(
    (sel) => document.querySelectorAll(sel).length > 0,
    selector,
    { timeout: 8000 },
  ).catch(() => {});
  await page.waitForTimeout(1200);
}

async function measurePath(page, width, path, { isDetailPath = false } = {}) {
  const url = `${BASE_URL}/${LOCALE}${path}`;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  const result = { width, path };
  result.httpStatus = response ? response.status() : null;
  result.ok = response ? response.ok() : false;
  const body = result.ok ? await page.content() : '';
  const isNotFound = !result.ok || body.includes('NEXT_HTTP_ERROR_FALLBACK');

  if (isDetailPath && isNotFound) {
    // R11 — a missing fixture is a usage failure, not a product verdict.
    throw Object.assign(new Error(`detail route ${path} did not resolve (status ${result.httpStatus})`), { usageError: true });
  }
  if (isNotFound) {
    result.failReason = !result.ok ? `non-OK response status ${result.httpStatus}` : 'NEXT_HTTP_ERROR_FALLBACK in body';
    return result;
  }

  await waitForTrack(page, `${RAIL_SELECTOR}, ${GRID_SELECTOR}`);

  const railCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, RAIL_SELECTOR);
  result.rails = [];
  for (let i = 0; i < railCount; i++) {
    const section = await page.evaluate(evalRailSection, { railSelector: RAIL_SELECTOR, index: i });
    result.rails.push(section);
  }

  const gridCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, GRID_SELECTOR);
  result.grids = [];
  for (let i = 0; i < gridCount; i++) {
    const section = await page.evaluate(evalGridSection, { gridSelector: GRID_SELECTOR, index: i });
    result.grids.push(section);
  }

  // Hover the first overflowing rail and re-read its webkit scrollbar height (AC1 — "increases on
  // hover"), then exercise the paging click (AC3/AC13) and re-check hit-testability post-click.
  const overflowingIndex = result.rails.findIndex((r) => r && r.overflows);
  if (overflowingIndex >= 0) {
    const railHandles = await page.$$(RAIL_SELECTOR);
    await railHandles[overflowingIndex].hover();
    await page.waitForTimeout(150);
    const hoverHeight = await railHandles[overflowingIndex].evaluate(
      (el) => getComputedStyle(el, '::-webkit-scrollbar').height,
    );
    result.rails[overflowingIndex].webkitScrollbarHeightHover = hoverHeight;

    const wrapper = await railHandles[overflowingIndex].evaluateHandle((el) => el.parentElement);
    const nextBtn = await wrapper.evaluateHandle((w) => Array.from(w.children).find((c) => c.tagName === 'BUTTON') ?? null);
    const nextBtnEl = nextBtn.asElement();
    if (nextBtnEl) {
      const before = await railHandles[overflowingIndex].evaluate((el) => el.scrollLeft);
      const beforeGeom = await railHandles[overflowingIndex].evaluate((el) => ({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
      }));
      // A raw DOM `.click()` rather than Playwright's hit-tested click: the section this control
      // belongs to sits below the fold at most widths, and Playwright's real-mouse actionability
      // check repeatedly lost the race against the page's own `position: sticky` header while
      // scrolling the target into view (reproduced live, Revision 0). R14's hit-test assertion
      // above/below is what actually proves the stacking fix — this click proves the handler.
      await nextBtnEl.evaluate((el) => el.click());
      await page.waitForTimeout(700);
      const after = await railHandles[overflowingIndex].evaluate((el) => el.scrollLeft);
      const controlsAfter = await page.evaluate(
        (args) => {
          const rail = document.querySelectorAll(args.sel)[args.idx];
          const w = rail.parentElement;
          return Array.from(w.children).filter((c) => c.tagName === 'BUTTON').map((b) => b.getAttribute('aria-label'));
        },
        { sel: RAIL_SELECTOR, idx: overflowingIndex },
      );
      const peekBefore = result.rails[overflowingIndex].peekPx;
      const isEndClamp = after === beforeGeom.scrollWidth - beforeGeom.clientWidth;
      result.clickTest = {
        before,
        after,
        delta: after - before,
        controlsAfter,
        expectedDelta: peekBefore !== null ? beforeGeom.clientWidth - peekBefore : null,
        isEndClamp,
      };
    }
  }

  return result;
}

function pushRailHardFails(cell, hardFailReasons, tagPrefix, { expectRails = true } = {}) {
  if (cell.failReason) {
    hardFailReasons.push(`${tagPrefix}: ${cell.failReason}`);
    return;
  }
  if (expectRails && (!cell.rails || cell.rails.length === 0)) {
    hardFailReasons.push(`${tagPrefix}: no rail track found`);
    return;
  }
  if (!expectRails && (!cell.grids || cell.grids.length === 0)) {
    hardFailReasons.push(`${tagPrefix}: no grid track found`);
    return;
  }
  for (let i = 0; i < cell.rails.length; i++) {
    const r = cell.rails[i];
    // R11 — a null section is a hard-fail, never a silent skip (Revision 0's `if (!r) continue`
    // was a fail-open; this replaces it).
    if (!r) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: null section (fail-open closed, Revision 1 R11)`);
      continue;
    }
    if (r.childCount > 0 && !r.equalHeights) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: unequal card heights ${JSON.stringify(r.cardHeights)}`);
    }
    if (!r.overflows && r.controlCount > 0) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: control present on non-overflowing rail (count=${r.controlCount})`);
    }
    if (r.overflows && r.controlCount === 0) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: overflowing rail has NO control`);
    }
    if (r.overflows && r.childCount > 1 && (r.peekPx === null || r.peekPx <= 0)) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: peek is ${r.peekPx}px on an overflowing multi-card rail (must be >0)`);
    }
    // No MULTI-card rail's card may exceed var(--listing-card-min) (280px), D74-6. A lone card
    // (childCount===1) is D74-5's own exception.
    if (r.childCount > 1 && r.firstChildWidth !== null && r.firstChildWidth > 280.5) {
      hardFailReasons.push(`${tagPrefix} rail[${i}]: card width ${r.firstChildWidth}px exceeds 280px cap`);
    }
    // R14 — every rendered control must be hit-testable at its own centre.
    for (const ht of r.hitTests ?? []) {
      if (ht.inViewport && ht.hit === false) {
        hardFailReasons.push(`${tagPrefix} rail[${i}]: control "${ht.label}" not hit-testable — elementFromPoint returned <${ht.atTag} class="${ht.atCls}">`);
      }
    }
    // R16 — the selected rung must match D74-9's own container-keyed arithmetic.
    if (r.childCount > 1 && r.firstChildWidth !== null && r.containerWidth) {
      const { n, expected } = expectedRailCardWidth(r.containerWidth);
      r.rungN = n;
      r.rungExpected = expected;
      if (Math.abs(r.firstChildWidth - expected) > 1) {
        hardFailReasons.push(`${tagPrefix} rail[${i}]: firstChildWidth=${r.firstChildWidth.toFixed(2)} but container=${r.containerWidth.toFixed(2)} (n=${n}) expects ${expected.toFixed(2)} (±1px)`);
      }
    }
  }
  // R13/AC13 — paging arithmetic, with the end-clamp exemption.
  if (cell.clickTest && cell.clickTest.expectedDelta !== null) {
    const { delta, expectedDelta, isEndClamp } = cell.clickTest;
    if (!isEndClamp && Math.abs(delta - expectedDelta) > 2) {
      hardFailReasons.push(`${tagPrefix}: paging delta=${delta} but expected clientWidth-peek=${expectedDelta.toFixed(2)} (±2px, no end-clamp)`);
    }
  }
  // R12 — grid cells: equal heights, and zero stray controls.
  for (let i = 0; i < (cell.grids ?? []).length; i++) {
    const g = cell.grids[i];
    if (!g) continue;
    if (g.childCount > 0 && !g.equalHeights) {
      hardFailReasons.push(`${tagPrefix} grid[${i}]: unequal card heights ${JSON.stringify(g.cardHeights)}`);
    }
    if (g.controlCount !== 0) {
      hardFailReasons.push(`${tagPrefix} grid[${i}]: unexpected rail-style control on a grid (count=${g.controlCount})`);
    }
  }
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
    console.error(`\n❌ task810-rail-controls-probe: unable to identify the current Git tree (${err instanceof Error ? err.message : String(err)}). Refusing to write evidence without a reproducible commit.`);
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
    detailSlug: DETAIL_SLUG,
    capturedAt: new Date().toISOString(),
    probeHash,
    gitCommit,
    cells: [],
  };
  const hardFailReasons = [];
  let usageError = null;

  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      try {
        const home = await measurePath(page, width, '/');
        result.cells.push(home);
        pushRailHardFails(home, hardFailReasons, `width=${width} path=/`);

        const grid = await measurePath(page, width, '/listings');
        grid.pathTag = 'listings-grid';
        result.cells.push(grid);
        pushRailHardFails(grid, hardFailReasons, `width=${width} path=/listings`, { expectRails: false });

        // Warm the recently-viewed cookie, then measure the detail route.
        for (const slug of WARMUP_SLUGS) {
          await page.goto(`${BASE_URL}/${LOCALE}/listings/${slug}`, { waitUntil: 'networkidle', timeout: 45000 });
          await page.waitForTimeout(500);
        }
        const detail = await measurePath(page, width, `/listings/${DETAIL_SLUG}`, { isDetailPath: true });
        result.cells.push(detail);
        pushRailHardFails(detail, hardFailReasons, `width=${width} path=/listings/${DETAIL_SLUG}`);
      } catch (err) {
        if (err && err.usageError) { usageError = err; throw err; }
        hardFailReasons.push(`width=${width}: navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await context.close();
      }
    }
  } catch (err) {
    if (usageError) {
      await browser.close();
      console.error(`\n❌ task810-rail-controls-probe: usage error — ${usageError.message}`);
      process.exit(2);
      return;
    }
    throw err;
  } finally {
    if (!usageError) await browser.close();
  }

  // AC10 — homepage vs. detail-route card-width comparison at every width where both have an
  // overflowing multi-card rail.
  const byWidth = new Map();
  for (const cell of result.cells) {
    if (!byWidth.has(cell.width)) byWidth.set(cell.width, {});
    if (cell.path === '/') byWidth.get(cell.width).home = cell;
    else if (cell.path?.startsWith(`/listings/${DETAIL_SLUG}`)) byWidth.get(cell.width).detail = cell;
  }
  result.homeVsDetail = [];
  for (const [width, { home, detail }] of byWidth) {
    if (!home?.rails || !detail?.rails) continue;
    const homeRail = home.rails.find((r) => r && r.childCount > 1);
    const detailRail = detail.rails.find((r) => r && r.childCount > 1);
    if (!homeRail || !detailRail) continue;
    result.homeVsDetail.push({
      width,
      homeContainer: homeRail.containerWidth,
      homeCardWidth: homeRail.firstChildWidth,
      detailContainer: detailRail.containerWidth,
      detailCardWidth: detailRail.firstChildWidth,
      diff: Math.abs(homeRail.firstChildWidth - detailRail.firstChildWidth),
    });
  }

  result.hardFail = hardFailReasons.length > 0;
  result.hardFailReasons = hardFailReasons;

  const outPath = join(runDir, 'rail-controls-probe.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (result.hardFail) {
    console.error(`\n❌ task810-rail-controls-probe: ${hardFailReasons.length} hard-fail condition(s):`);
    for (const r of hardFailReasons) console.error(`   - ${r}`);
    process.exit(1);
  }
  console.log('\n✅ task810-rail-controls-probe: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
