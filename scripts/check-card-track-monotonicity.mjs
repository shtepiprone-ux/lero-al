#!/usr/bin/env node
/**
 * check-card-track-monotonicity.mjs — Task 815 blocking CI gate.
 *
 * Replaces `measureStorybookColumnMonotonicity` (scripts/task809-favorites-parity-probe.mjs:319-374)
 * — one story, 600-900px, first `display:grid` element, run only from a probe that drives a
 * production server with an authenticated storage state, and invoked by NO `package.json` script
 * and NO CI job (kickoff §3.1) — with a gate that:
 *
 *   1. discovers, from the BUILT Storybook (`storybook-static/index.json`), every canonical Mantine
 *      Story (`scripts/lib/mantine-story-scope.mjs`'s `isCanonicalMantineTitle` — never re-implemented,
 *      never a hand-written list) that renders `MantineListingCardTrack`;
 *   2. sweeps each one across every rung boundary this repository declares
 *      (`320 479 480 639 640 767 768 1023 1024 1279 1280 1439 1440 1535 1536 1920 2560`); and
 *   3. fails when a wider sampled viewport produces FEWER grid columns or FEWER fully visible rail
 *      cards than the immediately preceding narrower sampled viewport — the failure class Task 809
 *      Revision 6 hit: two independent ancestors stepping horizontal padding at the same breakpoint,
 *      shrinking the track as the viewport grows, so a column (or a rail card) disappears.
 *
 * Owner decision (2026-09-16, kickoff §5.1, quoted verbatim there): scope is canonical Mantine/
 * Patterns Stories ONLY. The 11 legacy `System/*` stories that also render the track are excluded —
 * printed on every run, not silently dropped — and their own measured 1535->1536 rail drop is Task
 * 827's to fix, not this gate's to catch.
 *
 * The track's CSS Module classes are hashed per build (kickoff §3.3) — this script extracts the
 * grid/rail class names from the one matching built CSS asset at runtime. No literal hashed class
 * name is ever written here (R2).
 *
 * Two modes:
 *   node scripts/check-card-track-monotonicity.mjs                Assert the real tree. Exit 0 iff
 *                                                                  no in-scope story drops at any
 *                                                                  sampled rung.
 *   node scripts/check-card-track-monotonicity.mjs --verify-gate   Self-test (CI-safe, no product-
 *                                                                  code edits, no repository file
 *                                                                  written). Five arms (kickoff R7):
 *                                                                  (a) negative — real tree clean;
 *                                                                  (b) grid plant at the 1024 rung on
 *                                                                  `patterns-mantine-listingcardtrack
 *                                                                  --grid`; (c) rail plant at the 1280
 *                                                                  rung on `…--rail`; (d) selector
 *                                                                  fail-closed; (e) scope fail-closed.
 *
 * Reuses `storybook-static/` (build first: `npm run build-storybook`) and the `check-homepage-
 * grid.mjs` static-server shape (kickoff §3.7/§10.2), on its own port — neither 6020 (that gate) nor
 * 6006 (the dev server).
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');

const PORT = 6034;
const LOCALE = 'en';
const HEIGHT = 900;

// ── R4 — the width list: every declared Mantine rung and the `.container-wide` 1536 step, each as
// `rung-1, rung`, plus 320/1920/2560 bounds (kickoff §3.2/§15 "Why these widths?"). ──
const WIDTHS = [320, 479, 480, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1439, 1440, 1535, 1536, 1920, 2560];

// ── R3 — discovery loads each canonical Story at these two widths only; a Story is in scope when
// either load contains at least one track. ──
const DISCOVERY_WIDTHS = [320, 1440];

const CANNOT_SEE =
  'cannot see: a breakpoint not in the width list; locales other than en; a track rendered only ' +
  'after interaction; a drop that recovers between two sampled widths not at a declared breakpoint; ' +
  'a Story whose track mounts only after its Storybook render reaches finished.';

// ── Static server — same shape as scripts/check-homepage-grid.mjs `startStaticServer` (§3.7). ──

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

// ── R2 — derive the track's selectors from the built CSS. Reads only the one matching asset under
// `storybook-static/assets/`; no baseline file, no allowlist (AC5). ──

async function extractTrackSelectors(staticDir, assetPattern = /^MantineListingCardTrack-.*\.css$/) {
  const assetsDir = join(staticDir, 'assets');
  let files;
  try {
    files = await readdir(assetsDir);
  } catch (err) {
    return { ok: false, reason: `cannot read ${assetsDir}: ${err instanceof Error ? err.message : String(err)}` };
  }
  const matches = files.filter((f) => assetPattern.test(f));
  if (matches.length !== 1) {
    return {
      ok: false,
      reason: `expected exactly 1 asset matching ${assetPattern} in ${assetsDir}, found ${matches.length}: ${JSON.stringify(matches)}`,
    };
  }
  const css = await readFile(join(assetsDir, matches[0]), 'utf8');
  const gridClasses = [...new Set([...css.matchAll(/\.(_grid_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  const railClasses = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  if (gridClasses.length !== 1) {
    return { ok: false, reason: `expected exactly 1 grid class in ${matches[0]}, found ${gridClasses.length}: ${JSON.stringify(gridClasses)}` };
  }
  if (railClasses.length !== 1) {
    return { ok: false, reason: `expected exactly 1 rail class in ${matches[0]}, found ${railClasses.length}: ${JSON.stringify(railClasses)}` };
  }
  return { ok: true, asset: matches[0], gridClass: gridClasses[0], railClass: railClasses[0] };
}

// ── In-page evaluation. Classes are passed in as arguments — never a literal hashed name (R2). ──

/* eslint-disable no-undef */
function renderFailureCheck() {
  if (document.body.classList.contains('sb-show-errordisplay')) {
    const errEl = document.querySelector('#error-message') || document.body;
    return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
  }
  return { failed: false, reason: null, detail: '' };
}

// R4 — grid: `grid-template-columns` track count. Rail: number of direct children whose box lies
// entirely within `[rail.left, rail.left + rail.clientWidth]` at `scrollLeft` 0 (§5.2 assumption —
// the gate sets `scrollLeft = 0` itself rather than trusting load state).
function evalTracks({ gridClass, railClass }) {
  const els = Array.from(document.querySelectorAll(`.${gridClass}, .${railClass}`));
  return els.map((el) => {
    const isGrid = el.classList.contains(gridClass);
    if (isGrid) {
      const gtc = getComputedStyle(el).gridTemplateColumns.trim();
      const value = gtc === 'none' ? 0 : gtc.split(/\s+/).length;
      return { mode: 'grid', value, width: el.getBoundingClientRect().width };
    }
    el.scrollLeft = 0;
    const rect = el.getBoundingClientRect();
    const value = Array.from(el.children).filter((c) => {
      const cr = c.getBoundingClientRect();
      return cr.left >= rect.left - 0.5 && cr.right <= rect.left + el.clientWidth + 0.5;
    }).length;
    return { mode: 'rail', value, width: el.getBoundingClientRect().width };
  });
}
/* eslint-enable no-undef */

const SWEEP_READY_TIMEOUT_MS = 15000;

async function waitForReady(page, gridClass, railClass, timeout) {
  await page.waitForFunction(
    ({ gridClass: g, railClass: r }) => {
      if (document.body.classList.contains('sb-show-errordisplay')) return true;
      return document.querySelectorAll(`.${g}, .${r}`).length > 0;
    },
    { gridClass, railClass },
    { timeout },
  ).catch(() => {});
}

// ── R3/§17.4 Route A — discovery readiness. Rev 1's `sb-show-main` body-class signal was proven
// unreliable at runtime (`58a_`/`58b_` — it resolves while `sb-show-preparing-story` is still set and
// the track has not mounted, in 5 of 6 samples). §17.3's probe (`62_probe-render-phase.txt`) verified
// 32/32 that `window.__STORYBOOK_PREVIEW__.currentRender` reaching `id === storyId` and
// `phase === 'finished' | 'errored'` DOES correlate with the track being mounted (and stable 2000ms
// later), so Route A is adopted per the kickoff's mechanical rule. A story that never reaches that
// state within the timeout is a discovery FAILURE, not a silent "out of scope".
const DISCOVERY_ROUTE_DESCRIPTION = 'storybook render phase (finished|errored)';

async function waitForRenderPhase(page, storyId, timeout) {
  try {
    await page.waitForFunction(
      (expectedId) => {
        const render = window.__STORYBOOK_PREVIEW__ && window.__STORYBOOK_PREVIEW__.currentRender;
        if (!render) return false;
        return render.id === expectedId && (render.phase === 'finished' || render.phase === 'errored');
      },
      storyId,
      { timeout },
    );
  } catch {
    return { timedOut: true };
  }
  return page.evaluate((expectedId) => {
    const render = window.__STORYBOOK_PREVIEW__.currentRender;
    return { timedOut: false, id: render.id, idMatches: render.id === expectedId, phase: render.phase };
  }, storyId);
}

async function navigateStory(page, baseUrl, storyId, width, height, locale) {
  const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
}

// §10.3 — readiness per navigation, then a story that never renders its track (and never shows the
// Storybook error display either) is a failure naming the story, never a skipped cell.
//
// §16.1 — an optional plant (`{ mode, rung, paddingPx }`) is applied on EVERY navigation, after
// readiness and before `evalTracks`: tag the track's parent with `data-task815-plant`, then
// `page.addStyleTag` a `@media (min-width: <rung>px)` rule. A plant does not survive navigation,
// which is why it is applied per-navigation rather than once per page.
async function measureStoryAtWidth(page, baseUrl, storyId, width, height, locale, selectors, plant = null) {
  const { gridClass, railClass } = selectors;
  await navigateStory(page, baseUrl, storyId, width, height, locale);
  await waitForReady(page, gridClass, railClass, SWEEP_READY_TIMEOUT_MS);
  if (plant) {
    const trackSelector = plant.mode === 'grid' ? `.${gridClass}` : `.${railClass}`;
    const tag = await page.evaluate(tagParentPlant, trackSelector);
    if (!tag.applied) {
      return { failed: true, reason: `plant tag failed: ${tag.reason}` };
    }
    await page.addStyleTag({
      content: `@media (min-width: ${plant.rung}px) { [data-task815-plant] { padding-inline: ${plant.paddingPx}px; } }`,
    });
  }
  const renderResult = await page.evaluate(renderFailureCheck);
  if (renderResult.failed) {
    return { failed: true, reason: `render: ${renderResult.reason}` };
  }
  const tracks = await page.evaluate(evalTracks, selectors);
  if (tracks.length === 0) {
    return { failed: true, reason: 'no track rendered' };
  }
  return { failed: false, tracks };
}

// ── §16.1 — the ONE sweep implementation. The real run (no plant) and the plant arms (with a
// plant) both go through this function and its call to `evaluateSweep`, so the failure/pass
// decision is never re-derived anywhere else. ──
async function sweepStory(page, baseUrl, storyId, selectors, { plant = null } = {}) {
  const cells = [];
  for (const width of WIDTHS) {
    const outcome = await measureStoryAtWidth(page, baseUrl, storyId, width, HEIGHT, LOCALE, selectors, plant);
    cells.push({ width, ...outcome });
  }
  return evaluateSweep(storyId, cells);
}

// ── R3/§17.4 Route A — discovery. Only canonical Stories are ever loaded; every non-canonical Story
// (including every `System/*` Story) is excluded by construction and never navigated to at all.
// Readiness is `waitForRenderPhase` (the story's own `currentRender` reaching `finished`/`errored`),
// not a fixed wait; the track selectors are then queried exactly once. A story that never reaches
// that phase within `SWEEP_READY_TIMEOUT_MS` is a discovery FAILURE — named, and the run exits 1 —
// never silently dropped out of scope. A canonical story whose render phase is `errored` is ALSO a
// named discovery failure (kickoff §17.4) — checked against `sb-show-errordisplay` for confirmation —
// never silently treated as "no track". Discovery stays sequential on one page (Route A). ──

async function discoverInScope(page, baseUrl, allStories, selectors, isTitleInScope) {
  const canonical = allStories.filter((s) => isTitleInScope(s.title));
  const inScope = [];
  const discoveryFailures = [];
  for (const story of canonical) {
    let found = false;
    for (const width of DISCOVERY_WIDTHS) {
      await navigateStory(page, baseUrl, story.id, width, HEIGHT, LOCALE);
      const resolved = await waitForRenderPhase(page, story.id, SWEEP_READY_TIMEOUT_MS);
      if (resolved.timedOut) {
        discoveryFailures.push(
          `${story.id} @ ${width}px: did not reach render phase finished/errored within ${SWEEP_READY_TIMEOUT_MS}ms`,
        );
        continue;
      }
      if (resolved.phase === 'errored') {
        const hasErrorDisplay = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'));
        discoveryFailures.push(
          `${story.id} @ ${width}px: render phase errored (sb-show-errordisplay=${hasErrorDisplay})`,
        );
        continue;
      }
      const tracks = await page.evaluate(evalTracks, selectors);
      if (tracks.length > 0) {
        found = true;
        break;
      }
    }
    if (found) inScope.push(story);
  }
  return { canonical, inScope, discoveryFailures };
}

// ── R5 — monotonicity evaluation. Pure given the measured cells. Called only from `sweepStory`
// (§16.1), so both the real run (`runGate`, no plant) and the plant arms (`runPlantArm`, with a
// plant) go through the SAME comparison here — the failure/pass decision is never re-derived
// anywhere else. ──

function evaluateSweep(storyId, cellsByWidth) {
  const failures = [];
  const render = [];
  let trackCountRef = null;
  const prevByTrack = new Map();

  for (const cell of cellsByWidth) {
    if (cell.failed) {
      failures.push(`${storyId} @ ${cell.width}: ${cell.reason}`);
      render.push({ width: cell.width, tracks: null });
      continue;
    }
    if (trackCountRef === null) trackCountRef = cell.tracks.length;
    if (cell.tracks.length !== trackCountRef) {
      failures.push(`${storyId} @ ${cell.width}: track count changed (${trackCountRef} -> ${cell.tracks.length})`);
    }
    cell.tracks.forEach((tr, i) => {
      const prev = prevByTrack.get(i);
      if (prev && tr.value < prev.value) {
        failures.push(
          `${storyId} track ${i} (${tr.mode}): ${prev.width}px->${cell.width}px measure ${prev.value}->${tr.value} ` +
          `(track width ${prev.trackWidth.toFixed(1)}px->${tr.width.toFixed(1)}px)`,
        );
      }
      prevByTrack.set(i, { width: cell.width, value: tr.value, trackWidth: tr.width });
    });
    render.push({ width: cell.width, tracks: cell.tracks });
  }

  return { pass: failures.length === 0, failures, render };
}

function evaluateGateExitCode({ inScopeCount, anyFailure }) {
  if (inScopeCount === 0) return 1;
  return anyFailure ? 1 : 0;
}

// ── Reporting (R6 — every run prints its own scope and blind spots). Each takes `log` so every
// line runGate prints — including error-shaped lines — goes through the same collectible sink
// (§17.5 item 2: arm (d) collects runGate's own output to prove the `cannot see:` line). ──

function printScopeReport(log, { total, canonicalCount, inScope }) {
  log(`discovery readiness: ${DISCOVERY_ROUTE_DESCRIPTION}`);
  log(`in scope: ${inScope.length} canonical stories rendering the track (of ${canonicalCount} canonical, ${total} total)`);
  for (const s of inScope) log(`  - ${s.id}`);
  const excludedCount = total - canonicalCount;
  log(
    `excluded (owner decision 2026-09-16): ${excludedCount} non-canonical stories, including the ` +
    'System/* stories — Task 827 owns the known 1535->1536 drop there',
  );
}

function printStoryResult(log, storyId, result) {
  log(`${storyId}: ${result.pass ? 'PASS' : 'FAIL'}`);
  for (const cell of result.render) {
    if (cell.tracks === null) {
      log(`  @${cell.width}: FAILED`);
      continue;
    }
    log(`  @${cell.width}: ${cell.tracks.map((t, i) => `t${i}=${t.mode[0]}${t.value}`).join(' ')}`);
  }
  for (const f of result.failures) log(`  ✗ ${f}`);
}

// ── Normal mode ──

const DEFAULT_ASSET_PATTERN = /^MantineListingCardTrack-.*\.css$/;

// §16.3 — R6 requires the scope-and-blind-spot block on EVERY exit path, not only the happy one.
// The `finally` below is what guarantees `CANNOT_SEE` prints even when the function returns early
// (selector extraction failure) — `main()`'s missing-build exit is a one-line error and is
// deliberately NOT routed through here (kickoff §16.3).
//
// §17.5 item 2 — `assetPattern` and `log` replace Rev 1's evidence-only CLI test-hook flag.
// `--verify-gate`'s arm (d) calls this function directly with a non-matching pattern and a
// collecting `log`, so AC13 is re-provable on every CI run without any script-level test hook.
async function runGate(baseUrl, browser, staticDir, { assetPattern = DEFAULT_ASSET_PATTERN, log = console.log } = {}) {
  log('check-card-track-monotonicity.mjs — asserting the real tree\n');

  let inScope = [];
  let anyFailure = false;
  try {
    const selectors = await extractTrackSelectors(staticDir, assetPattern);
    if (!selectors.ok) {
      log(`Selector extraction failed: ${selectors.reason}`);
      log('scope: not discovered — selector extraction failed');
      anyFailure = true;
      return evaluateGateExitCode({ inScopeCount: 0, anyFailure });
    }
    log(`CSS asset: ${selectors.asset}`);
    log(`Grid class: ${selectors.gridClass}`);
    log(`Rail class: ${selectors.railClass}\n`);

    const index = JSON.parse(await readFile(join(staticDir, 'index.json'), 'utf8'));
    const allStories = Object.values(index.entries).filter((e) => e.type === 'story');

    const page = await browser.newPage();
    try {
      const discovery = await discoverInScope(page, baseUrl, allStories, selectors, isCanonicalMantineTitle);
      inScope = discovery.inScope;
      printScopeReport(log, { total: allStories.length, canonicalCount: discovery.canonical.length, inScope });
      log('');

      if (discovery.discoveryFailures.length > 0) {
        log(`Discovery failures (${discovery.discoveryFailures.length}):`);
        for (const f of discovery.discoveryFailures) log(`  ✗ ${f}`);
        log('');
        anyFailure = true;
      }

      if (inScope.length === 0) {
        log('Discovered scope is zero canonical stories rendering the track.');
      } else {
        for (const story of inScope) {
          const result = await sweepStory(page, baseUrl, story.id, selectors);
          printStoryResult(log, story.id, result);
          if (!result.pass) anyFailure = true;
        }
      }
    } finally {
      await page.close();
    }

    return evaluateGateExitCode({ inScopeCount: inScope.length, anyFailure });
  } finally {
    log(`\n${CANNOT_SEE}`);
  }
}

// ── --verify-gate mode (R7) ──

const PLANT_ARMS = [
  {
    id: 'b-grid-1024',
    describe:
      'Grid column count: padding-inline 80px at min-width:1024px on the track’s parent on ' +
      'patterns-mantine-listingcardtrack--grid (expect 1023->1024 to drop 3->2)',
    storyId: 'patterns-mantine-listingcardtrack--grid',
    mode: 'grid',
    prevWidth: 1023,
    rung: 1024,
    paddingPx: 80,
    expectedProducedWidth: 864,
  },
  {
    id: 'c-rail-1280',
    describe:
      'Rail fully-visible count: padding-inline 140px at min-width:1280px on the track’s parent ' +
      'on patterns-mantine-listingcardtrack--rail (expect 1279->1280 to drop 4->3)',
    storyId: 'patterns-mantine-listingcardtrack--rail',
    mode: 'rail',
    prevWidth: 1279,
    rung: 1280,
    paddingPx: 140,
    expectedProducedWidth: 1000,
  },
];

/* eslint-disable no-undef */
function tagParentPlant(sel) {
  const el = document.querySelector(sel);
  if (!el) return { applied: false, reason: 'track element not found' };
  const parent = el.parentElement;
  if (!parent) return { applied: false, reason: 'track has no parent element' };
  parent.setAttribute('data-task815-plant', '1');
  return { applied: true };
}
/* eslint-enable no-undef */

// §16.1 — the plant arm calls `sweepStory` (§16.1's single sweep implementation) with the plant
// over the FULL 17-width list, so the trip is decided by the same `evaluateSweep` the real gate
// uses — not a private comparison re-derived here. Passes only when, in order: (1) the cell at
// `arm.rung` produced the expected track width (asserted first — a plant that silently did not
// apply is an arm failure, not a pass, kickoff §10.4); (2) `evaluateSweep` reports EXACTLY one
// failure; (3) that failure names this story, this track/mode, and the `prevWidth->rung` pair;
// (4) an unplanted `sweepStory` of the same story afterwards returns `pass: true` (reload-clean).
async function runPlantArm(browser, baseUrl, selectors, arm) {
  const result = { id: arm.id, pass: true, notes: [] };

  const plantPage = await browser.newPage();
  let sweep;
  try {
    sweep = await sweepStory(plantPage, baseUrl, arm.storyId, selectors, {
      plant: { mode: arm.mode, rung: arm.rung, paddingPx: arm.paddingPx },
    });
  } finally {
    await plantPage.close();
  }

  const rungCell = sweep.render.find((c) => c.width === arm.rung);
  if (!rungCell || rungCell.tracks === null) {
    result.pass = false;
    result.notes.push(`no measurable cell at ${arm.rung}px for ${arm.storyId} under the plant`);
    return result;
  }
  if (rungCell.tracks.length !== 1) {
    result.pass = false;
    result.notes.push(`expected exactly 1 track at ${arm.rung}px under the plant, found ${rungCell.tracks.length}`);
    return result;
  }
  const producedWidth = rungCell.tracks[0].width;
  if (Math.round(producedWidth) !== arm.expectedProducedWidth) {
    result.pass = false;
    result.notes.push(`plant did not apply: produced width ${producedWidth}px, expected ${arm.expectedProducedWidth}px`);
    return result;
  }
  result.notes.push(`produced width at ${arm.rung}px: ${producedWidth}px (expected ${arm.expectedProducedWidth}px) — plant applied`);

  if (sweep.failures.length !== 1) {
    result.pass = false;
    result.notes.push(`expected exactly 1 evaluateSweep failure, found ${sweep.failures.length}: ${JSON.stringify(sweep.failures)}`);
    return result;
  }
  const failure = sweep.failures[0];
  const expectedFragments = [arm.storyId, `track 0 (${arm.mode})`, `${arm.prevWidth}px->${arm.rung}px`];
  const missing = expectedFragments.filter((f) => !failure.includes(f));
  if (missing.length > 0) {
    result.pass = false;
    result.notes.push(`evaluateSweep failure does not match the expected shape (missing ${JSON.stringify(missing)}): ${failure}`);
    return result;
  }
  // §17.5 item 1 — Rev 1's shape check stopped at the width pair; it never confirmed the failure
  // was actually a DROP (`measure X->Y` with `Y < X`), only that it named the right story/track/pair.
  const measureMatch = failure.match(/measure (\d+)->(\d+)/);
  if (!measureMatch) {
    result.pass = false;
    result.notes.push(`evaluateSweep failure has no "measure X->Y" segment: ${failure}`);
    return result;
  }
  const measureBefore = Number(measureMatch[1]);
  const measureAfter = Number(measureMatch[2]);
  if (!(measureAfter < measureBefore)) {
    result.pass = false;
    result.notes.push(`evaluateSweep failure's measure is not a drop (Y < X required): measure ${measureBefore}->${measureAfter}: ${failure}`);
    return result;
  }
  result.notes.push(`evaluateSweep failure: ${failure}`);

  const cleanPage = await browser.newPage();
  let cleanSweep;
  try {
    cleanSweep = await sweepStory(cleanPage, baseUrl, arm.storyId, selectors);
  } finally {
    await cleanPage.close();
  }
  if (!cleanSweep.pass) {
    result.pass = false;
    result.notes.push(`reload after plant did not come back clean: ${JSON.stringify(cleanSweep.failures)}`);
    return result;
  }
  result.notes.push('reload clean — full 17-width unplanted sweep, 0 failures');

  return result;
}

async function runVerifyGate(baseUrl, browser, staticDir) {
  console.log('check-card-track-monotonicity.mjs --verify-gate\n');
  let overallPass = true;

  console.log('── Arm (a): negative — real tree, expect every in-scope story clean ──');
  const negativeExit = await runGate(baseUrl, browser, staticDir);
  if (negativeExit === 0) {
    console.log('✅ Arm (a) PASS — 0 drops on the unmodified tree.\n');
  } else {
    console.log('❌ Arm (a) FAILED — the unmodified tree already reports a drop. Gate is broken or the tree has drifted.\n');
    overallPass = false;
  }

  const selectors = await extractTrackSelectors(staticDir);
  if (!selectors.ok) {
    console.log(`❌ Arms (b)/(c) cannot run — selector extraction failed: ${selectors.reason}\n`);
    overallPass = false;
  } else {
    for (const arm of PLANT_ARMS) {
      console.log(`── Arm (${arm.id}): ${arm.describe} ──`);
      const result = await runPlantArm(browser, baseUrl, selectors, arm);
      for (const note of result.notes) console.log(`  ${note}`);
      if (result.pass) {
        console.log(`✅ Arm (${arm.id}) PASS\n`);
      } else {
        console.log(`❌ Arm (${arm.id}) FAILED\n`);
        overallPass = false;
      }
    }
  }

  console.log('── Arm (d): selector fail-closed — runGate itself, via a non-matching asset pattern (§17.5) ──');
  {
    const collected = [];
    const collectingLog = (msg) => collected.push(String(msg));
    const badExit = await runGate(baseUrl, browser, staticDir, {
      assetPattern: /^DOES-NOT-EXIST-TASK815-.*\.css$/,
      log: collectingLog,
    });
    const joined = collected.join('\n');
    const sawCannotSee = joined.includes('cannot see:');
    console.log(collected.map((l) => `  ${l}`).join('\n'));
    if (badExit === 1 && sawCannotSee) {
      console.log(`✅ Arm (d) PASS — runGate returned exit ${badExit} and printed the cannot see: line.\n`);
    } else {
      console.log(`❌ Arm (d) FAILED — runGate returned exit ${badExit}, cannot-see line present: ${sawCannotSee}.\n`);
      overallPass = false;
    }
  }

  console.log('── Arm (e): scope fail-closed — discovery with a title predicate matching nothing ──');
  if (!selectors.ok) {
    console.log('❌ Arm (e) cannot run — real selectors unavailable.\n');
    overallPass = false;
  } else {
    const index = JSON.parse(await readFile(join(staticDir, 'index.json'), 'utf8'));
    const allStories = Object.values(index.entries).filter((e) => e.type === 'story');
    const page = await browser.newPage();
    let discovery;
    try {
      discovery = await discoverInScope(page, baseUrl, allStories, selectors, () => false);
    } finally {
      await page.close();
    }
    const exitCode = evaluateGateExitCode({ inScopeCount: discovery.inScope.length, anyFailure: false });
    if (discovery.inScope.length === 0 && exitCode === 1) {
      console.log('✅ Arm (e) PASS — discovered scope is 0 with a nothing-matches predicate (the real gate would exit 1).\n');
    } else {
      console.log(`❌ Arm (e) FAILED — expected 0 in-scope stories and exit 1, found ${discovery.inScope.length} stories / exit ${exitCode}.\n`);
      overallPass = false;
    }
  }

  console.log('── Post-plant re-check: negative arm again, confirming full restore ──');
  const restoredExit = await runGate(baseUrl, browser, staticDir);
  if (restoredExit === 0) {
    console.log('✅ Tree fully restored — 0 drops after all plants.\n');
  } else {
    console.log('❌ Tree NOT fully restored — a plant leaked.\n');
    overallPass = false;
  }

  return overallPass ? 0 : 1;
}

// ── Entry point ──

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error(`storybook-static/ not found at ${storybookStaticDir}. Build first: npm run build-storybook`);
    process.exit(1);
    return;
  }
  const indexPath = join(storybookStaticDir, 'index.json');
  if (!existsSync(indexPath)) {
    console.error(`storybook-static/index.json not found at ${indexPath}. Build first: npm run build-storybook`);
    process.exit(1);
    return;
  }

  const { chromium } = await import('playwright');
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();

  let exitCode;
  try {
    exitCode = VERIFY_GATE
      ? await runVerifyGate(baseUrl, browser, storybookStaticDir)
      : await runGate(baseUrl, browser, storybookStaticDir);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  process.exit(exitCode);
}

main().catch((err) => { console.error(err); process.exit(1); });
