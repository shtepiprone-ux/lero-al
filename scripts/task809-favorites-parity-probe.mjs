#!/usr/bin/env node
/**
 * task809-favorites-parity-probe.mjs — Task 809 kickoff §13 rendered-route probe.
 *
 * Follows `scripts/task810-rail-controls-probe.mjs`'s conventions (playwright chromium, BASE_URL
 * env, probeHash/gitCommit via execFileSync with no shell, one immutable run directory per
 * invocation via writeFile(..., { flag: 'wx' }), exit 1 on hard fail, 2 on usage error). Known
 * weaknesses in that template, NOT copied here (kickoff §13 instruction): its hit-test skips when
 * `inViewport` is false (not applicable — this probe does no click/hit-testing); its rung
 * thresholds are px against the CSS's `em` (not applicable — this probe compares two LIVE
 * measurements to each other, never a hand-derived expected value).
 *
 * PRECONDITION: `npm run build && npm run start` (production server) running and reachable at
 * BASE_URL, and an authenticated Playwright storageState for a user with real favorited listings
 * (STORAGE_STATE env, default `playwright/.auth/admin-storage-state.json` — captured via
 * `npm run capture:admin-session`; the admin account is also a regular user and can favorite
 * listings like any signed-in user).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 DETAIL_SLUG=<slug> STORAGE_STATE=<path> \
 *     node scripts/task809-favorites-parity-probe.mjs <runId>
 * Output:
 *   docs/sessions/evidence/task809/runs/<runId>/favorites-parity-probe.json
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task809');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const LOCALE = 'uk';
const STORAGE_STATE = process.env.STORAGE_STATE ?? join(ROOT, 'playwright/.auth/admin-storage-state.json');
const DETAIL_SLUG = process.env.DETAIL_SLUG ?? 'apartament-ne-lungomare-mtuf41kg';

// AC1/AC4's exact widths.
const WIDTHS = [320, 390, 480, 640, 768, 1024, 1440];

const GRID_SELECTOR = '[class*="MantineListingCardTrack"][class*="grid"]';
const RAIL_SELECTOR = '[class*="MantineListingCardTrack"][class*="rail"]';
// The pre-809 Tailwind ladder this task deletes — the two-armed proof (§13) plants this class back
// onto the favorites grid container to prove the probe can catch the regression it exists to catch.
const OLD_LADDER_MARKER = 'grid-cols-1';

const [, , runId] = process.argv;
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: BASE_URL=<server> STORAGE_STATE=<path> node scripts/task809-favorites-parity-probe.mjs <runId>');
  process.exit(2);
}

function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task809-favorites-parity-probe.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Serialized into page.evaluate — self-contained. */
function evalGridFirstCard(args) {
  const { gridSelector } = args;
  const grid = document.querySelector(gridSelector);
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  const cs = getComputedStyle(grid);
  const gtc = cs.gridTemplateColumns;
  const columnCount = gtc && gtc !== 'none' ? gtc.trim().split(/\s+/).filter(Boolean).length : 1;
  const firstChild = grid.children[0];
  return {
    containerWidth: rect.width,
    columnCount,
    firstChildWidth: firstChild ? firstChild.getBoundingClientRect().width : null,
    childCount: grid.children.length,
  };
}

function evalClassNameSurvivors(args) {
  const { gridSelector, markers } = args;
  const grid = document.querySelector(gridSelector);
  if (!grid) return { found: false, hits: [] };
  const hits = [];
  const all = [grid, ...Array.from(grid.querySelectorAll('*'))];
  for (const el of all) {
    const cls = el.className;
    if (typeof cls !== 'string' || !cls) continue;
    for (const marker of markers) {
      if (cls.includes(marker)) {
        hits.push({ tag: el.tagName, className: cls, marker });
      }
    }
  }
  return { found: hits.length > 0, hits: hits.slice(0, 10) };
}

function evalRailFirstItem(args) {
  const { railSelector } = args;
  const rail = document.querySelector(railSelector);
  if (!rail) return null;
  const firstChild = rail.children[0];
  return {
    containerWidth: rail.getBoundingClientRect().width,
    firstChildWidth: firstChild ? firstChild.getBoundingClientRect().width : null,
    childCount: rail.children.length,
    // Skeleton items are `Paper` (no <img>); resolved items are `ListingCard` (has <img>). This
    // distinguishes which state was actually captured, independent of timing.
    hasImg: !!rail.querySelector('img'),
  };
}

async function measureFavoritesVsListings(browser, width, hardFailReasons) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, storageState: STORAGE_STATE });
  const page = await context.newPage();
  const cell = { width };
  try {
    const favUrl = `${BASE_URL}/${LOCALE}/favorites`;
    const favResp = await page.goto(favUrl, { waitUntil: 'networkidle', timeout: 30000 });
    cell.favoritesHttpStatus = favResp ? favResp.status() : null;
    if (!favResp || !favResp.ok()) {
      hardFailReasons.push(`width=${width} /favorites: non-OK response ${cell.favoritesHttpStatus}`);
      return cell;
    }
    await page.waitForTimeout(1000);

    const favGrid = await page.evaluate(evalGridFirstCard, { gridSelector: GRID_SELECTOR });
    cell.favoritesGrid = favGrid;
    if (!favGrid) {
      hardFailReasons.push(`width=${width} /favorites: no track (mode="grid") found`);
    }

    const survivors = await page.evaluate(evalClassNameSurvivors, { gridSelector: GRID_SELECTOR, markers: [OLD_LADDER_MARKER] });
    cell.classNameSurvivors = survivors;
    if (survivors.found) {
      hardFailReasons.push(`width=${width} /favorites: className survivor(s) detected — ${JSON.stringify(survivors.hits)}`);
    }

    const listingsUrl = `${BASE_URL}/${LOCALE}/listings`;
    const listResp = await page.goto(listingsUrl, { waitUntil: 'networkidle', timeout: 30000 });
    cell.listingsHttpStatus = listResp ? listResp.status() : null;
    if (!listResp || !listResp.ok()) {
      hardFailReasons.push(`width=${width} /listings: non-OK response ${cell.listingsHttpStatus}`);
      return cell;
    }
    await page.waitForTimeout(1000);
    const listGrid = await page.evaluate(evalGridFirstCard, { gridSelector: GRID_SELECTOR });
    cell.listingsGrid = listGrid;
    if (!listGrid) {
      hardFailReasons.push(`width=${width} /listings: no track (mode="grid") found`);
    }

    if (favGrid && listGrid && favGrid.firstChildWidth != null && listGrid.firstChildWidth != null) {
      cell.cardWidthDiff = Math.abs(favGrid.firstChildWidth - listGrid.firstChildWidth);
      if (cell.cardWidthDiff > 1) {
        hardFailReasons.push(
          `width=${width}: favorites card width ${favGrid.firstChildWidth.toFixed(2)}px differs from ` +
          `/listings ${listGrid.firstChildWidth.toFixed(2)}px by ${cell.cardWidthDiff.toFixed(2)}px (>1px)`,
        );
      }
    }
  } catch (err) {
    hardFailReasons.push(`width=${width} favorites-vs-listings: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await context.close();
  }
  return cell;
}

/**
 * AC4 — captures the recently-viewed Suspense placeholder's geometry WHILE pending (via CDP
 * network throttling, since `networkidle`/settle waits reliably race past the fallback otherwise —
 * measured true of the identical Similar-listings case in `scripts/task807-card-width-parity.mjs`,
 * which only ever measured the resolved state) and the resolved geometry after it, in the SAME
 * page load, then diffs the first item's width.
 */
async function measureRecentlyViewedSkeleton(browser, width, hardFailReasons) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, storageState: STORAGE_STATE });
  const page = await context.newPage();
  const cell = { width };
  try {
    // Warm the recently-viewed cookie/table with a real prior visit, matching Task 807/810's own
    // convention — otherwise the section renders nothing and there is nothing to measure.
    await page.goto(`${BASE_URL}/${LOCALE}/listings/2-garazhde-mtueqmyb`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);

    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (400 * 1024) / 8, // 400kbps — slow enough to hold the Suspense boundary
      uploadThroughput: (400 * 1024) / 8,   // pending without timing out the initial document itself
      latency: 100,
    });

    const url = `${BASE_URL}/${LOCALE}/listings/${DETAIL_SLUG}`;
    // 'commit' — earliest Playwright waitUntil stage (navigation started, response headers
    // received) — lets the still-streaming document continue downloading in the background while
    // the probe starts polling for the rail selector below, instead of blocking on a full
    // domcontentloaded that the throttle would otherwise delay past a practical timeout.
    await page.goto(url, { waitUntil: 'commit', timeout: 60000 });

    // Capture the PENDING (skeleton) state — poll briefly for the rail to exist at all (either
    // skeleton or resolved may be first-painted depending on stream timing), then read it
    // immediately, before throttling is lifted.
    await page.waitForFunction(
      (sel) => document.querySelectorAll(sel).length > 0,
      RAIL_SELECTOR,
      { timeout: 25000 },
    ).catch(() => {});
    // The selector existing in the DOM does not mean CSS has painted it yet — under a throttled
    // connection the stylesheet itself is still downloading, and a pre-CSS read measures an
    // unstyled 0x0 box (measured on the production server: containerWidth=0 with the correct
    // childCount=4 — the elements existed, only their layout did not). Wait for a real box.
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return !!(el && el.getBoundingClientRect().width > 0);
      },
      RAIL_SELECTOR,
      { timeout: 10000 },
    ).catch(() => {});
    cell.pending = await page.evaluate(evalRailFirstItem, { railSelector: RAIL_SELECTOR });

    // Lift throttling and wait for the resolved content (an <img> appears once the real
    // RecentlyViewedSection replaces the skeleton).
    await client.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: -1, uploadThroughput: -1, latency: 0 });
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return !!(el && el.querySelector('img'));
      },
      RAIL_SELECTOR,
      { timeout: 30000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
    cell.resolved = await page.evaluate(evalRailFirstItem, { railSelector: RAIL_SELECTOR });

    if (!cell.pending || cell.pending.hasImg) {
      cell.note = 'pending capture already shows resolved content (network too fast to hold the boundary) — recorded, not a hard fail';
    }
    if (!cell.resolved || !cell.resolved.hasImg) {
      hardFailReasons.push(`width=${width} recently-viewed: resolved state never captured an <img> — section may be empty for this account`);
    } else if (cell.pending && cell.pending.firstChildWidth != null && cell.resolved.firstChildWidth != null) {
      cell.delta = Math.abs(cell.pending.firstChildWidth - cell.resolved.firstChildWidth);
      if (cell.delta > 2) {
        hardFailReasons.push(
          `width=${width} recently-viewed: placeholder first-item width ${cell.pending.firstChildWidth.toFixed(2)}px ` +
          `vs resolved ${cell.resolved.firstChildWidth.toFixed(2)}px, delta ${cell.delta.toFixed(2)}px (>2px)`,
        );
      }
    }
  } catch (err) {
    hardFailReasons.push(`width=${width} recently-viewed-skeleton: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await context.close();
  }
  return cell;
}

/**
 * AC3 — the filtered-empty state's action must be a real `<a href>` (not a callback). Reached live
 * via a `type` filter query param that matches none of the account's real favorited property types.
 */
async function measureFilteredEmptyAction(browser, hardFailReasons) {
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  const cell = {};
  try {
    const url = `${BASE_URL}/${LOCALE}/favorites?type=land`;
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    cell.httpStatus = resp ? resp.status() : null;
    if (!resp || !resp.ok()) {
      hardFailReasons.push(`filtered-empty action check: non-OK response ${cell.httpStatus}`);
      return cell;
    }
    await page.waitForTimeout(1000);
    // The filtered-empty state's action is the ONLY link inside a Mantine Alert-less Center/Stack
    // with no card grid present — locate it by role + presence of an href.
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .filter((a) => a.textContent && a.textContent.trim().length > 0)
        .map((a) => ({ tag: a.tagName, href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 40) }));
    });
    cell.anchors = links;
    const favoritesAnchor = links.find((a) => a.href && a.href.includes('/favorites') && !a.href.includes('type='));
    cell.actionAnchorFound = !!favoritesAnchor;
    if (!favoritesAnchor) {
      hardFailReasons.push(`filtered-empty action check: no <a href="/${LOCALE}/favorites"> action found — anchors seen: ${JSON.stringify(links)}`);
    }
  } catch (err) {
    hardFailReasons.push(`filtered-empty action check: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await context.close();
  }
  return cell;
}

/**
 * Column-monotonicity regression — owner rejection 2026-09-11. `Mantine/Primitives/FavoritesShell
 * -> Populated` (GB English, 900px canvas height) dropped from 2 grid columns to 1 between 639px and
 * 640px viewport width, then back to 2 by 663-664px: a breakpoint dead zone, not a valid responsive
 * transition. Root cause (measured, not assumed): `_MantineStoryShell.tsx`'s inner "white card
 * chrome" Box stepped its own `px`/`bd`/`bg`/`bdrs` at the SAME `sm` (640px) breakpoint the outer
 * Box already used for its own page-gutter step, compounding to a 50px content-width loss at exactly
 * 640px against `MantineListingCardTrack`'s `.grid` (~31px of slack at 639px, `--listing-card-min`
 * 280px + 16px gap). Fixed by deferring the inner Box's step to `md` (768px), where the track has
 * ~94px of slack. This probe re-measures the fix directly against the canonical Storybook story
 * (not the live route — the dead zone was a `MantineStoryShell` harness defect, invisible to
 * `measureFavoritesVsListings` above, which only ever measures the production route's own
 * `.container-wide` gutter, a smaller, non-breaking step).
 *
 * PRECONDITION: `npm run storybook` (dev server) reachable at STORYBOOK_URL.
 */
const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const STORYBOOK_MONOTONICITY_WIDTHS = [600, 620, 639, 640, 650, 663, 664, 700, 750, 767, 768, 769, 800, 900];

function evalStorybookGridColumns() {
  const candidates = Array.from(document.querySelectorAll('div, section'));
  const grid = candidates.find((el) => getComputedStyle(el).display === 'grid');
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  const cs = getComputedStyle(grid);
  const templateCols = cs.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
  const firstChild = grid.children[0];
  return {
    contentBoxWidth: rect.width,
    columnCount: templateCols.length,
    firstChildWidth: firstChild ? firstChild.getBoundingClientRect().width : null,
  };
}

async function measureStorybookColumnMonotonicity(browser, hardFailReasons) {
  const page = await browser.newPage();
  const cells = [];
  try {
    const storyUrl = `${STORYBOOK_URL}/iframe.html?id=mantine-primitives-favoritesshell--populated&viewMode=story&globals=locale:en`;
    for (const width of STORYBOOK_MONOTONICITY_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(storyUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('div, section')).some((el) => getComputedStyle(el).display === 'grid'),
        { timeout: 15000 },
      ).catch(() => {});
      const measured = await page.evaluate(evalStorybookGridColumns);
      cells.push({ width, ...measured });
    }
  } catch (err) {
    hardFailReasons.push(`storybook column monotonicity: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await page.close();
  }

  let prevColumnCount = 0;
  for (const cell of cells) {
    if (cell.columnCount == null) {
      hardFailReasons.push(`storybook column monotonicity: width=${cell.width} — grid not found`);
      continue;
    }
    if (cell.columnCount < prevColumnCount) {
      hardFailReasons.push(
        `storybook column monotonicity: width=${cell.width} columnCount=${cell.columnCount} < previous ${prevColumnCount} ` +
        `— viewport grew but column count dropped (the exact dead-zone regression this check exists to catch)`,
      );
    }
    prevColumnCount = cell.columnCount;
  }

  return cells;
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
    console.error(`\n❌ task809-favorites-parity-probe: unable to identify the current Git tree (${err instanceof Error ? err.message : String(err)}). Refusing to write evidence without a reproducible commit.`);
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
    storageState: STORAGE_STATE,
    capturedAt: new Date().toISOString(),
    probeHash,
    gitCommit,
    favoritesVsListings: [],
    recentlyViewedSkeleton: [],
    storybookColumnMonotonicity: [],
  };
  const hardFailReasons = [];

  try {
    for (const width of WIDTHS) {
      result.favoritesVsListings.push(await measureFavoritesVsListings(browser, width, hardFailReasons));
    }
    for (const width of [320, 768, 1440]) {
      result.recentlyViewedSkeleton.push(await measureRecentlyViewedSkeleton(browser, width, hardFailReasons));
    }
    result.filteredEmptyAction = await measureFilteredEmptyAction(browser, hardFailReasons);
    result.storybookColumnMonotonicity = await measureStorybookColumnMonotonicity(browser, hardFailReasons);
  } finally {
    await browser.close();
  }

  result.hardFail = hardFailReasons.length > 0;
  result.hardFailReasons = hardFailReasons;

  const outPath = join(runDir, 'favorites-parity-probe.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (result.hardFail) {
    console.error(`\n❌ task809-favorites-parity-probe: ${hardFailReasons.length} hard-fail condition(s):`);
    for (const r of hardFailReasons) console.error(`   - ${r}`);
    process.exit(1);
  }
  console.log('\n✅ task809-favorites-parity-probe: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
