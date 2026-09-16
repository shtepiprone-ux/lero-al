// Task 815 §17.3 — evidence-only signal probe. NEVER imported by the gate.
//
// Determines whether Storybook's own render-phase signal (`window.__STORYBOOK_PREVIEW__.currentRender`
// reaching phase `finished`/`errored`) is a reliable, fast discovery-readiness signal, as an
// alternative to Rev 1's `sb-show-main` (proven unreliable — see `58a_`/`58b_`). Runs the mechanical
// 32/32 adoption rule from kickoff §17.3 and prints which route (A or B) the result selects.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6037; // not 6020 / 6034 / 6035 / 6036 / 6006
const LOCALE = 'en';
const HEIGHT = 900;
const READY_TIMEOUT_MS = 15000;

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer(dir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
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

// Exactly as `extractTrackSelectors` in scripts/check-card-track-monotonicity.mjs (kickoff §17.3).
async function extractTrackSelectors(dir) {
  const assetsDir = join(dir, 'assets');
  const files = await readdir(assetsDir);
  const matches = files.filter((f) => /^MantineListingCardTrack-.*\.css$/.test(f));
  if (matches.length !== 1) throw new Error(`expected exactly 1 track CSS asset, found ${matches.length}`);
  const css = await readFile(join(assetsDir, matches[0]), 'utf8');
  const gridClasses = [...new Set([...css.matchAll(/\.(_grid_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  const railClasses = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  if (gridClasses.length !== 1 || railClasses.length !== 1) throw new Error('expected exactly 1 grid class and 1 rail class');
  return { asset: matches[0], gridClass: gridClasses[0], railClass: railClasses[0] };
}

// The 16 in-scope story ids, verbatim from docs/sessions/evidence/task815/23_check-card-track-monotonicity.txt.
const IN_SCOPE_16 = [
  'mantine-primitives-favoritesshell--populated',
  'mantine-primitives-listingcard--favorites-composition',
  'mantine-primitives-recentlyviewedgridview--populated',
  'mantine-primitives-similarlistingsview--default',
  'mantine-primitives-similarlistingsview--fewer-than-eight',
  'patterns-mantine-homepagelistinggrids--default',
  'patterns-mantine-homepagelistinggrids--loading',
  'patterns-mantine-listingcardtrack--grid',
  'patterns-mantine-listingcardtrack--rail',
  'patterns-mantine-listingcardtrack--grid-single-item',
  'patterns-mantine-listingcardtrack--rail-single-item',
  'patterns-mantine-listingcardtrack--rail-no-overflow',
  'patterns-mantine-listingcardtrack--rail-mixed-title-lengths',
  'patterns-mantine-listingcardtrack--grid-mixed-title-lengths',
  'patterns-mantine-listingcardtrack--empty',
  'patterns-mantine-listingsshellview--default',
];

// First two canonical story ids in index.json order that are NOT in the 16 (isCanonicalMantineTitle,
// re-derived from storybook-static/index.json at probe-authoring time — see session log).
const NO_TRACK_2 = ['admin-adminuserstable--default', 'mantine-primitives-actionicon--default'];

const WIDTHS = [320, 1440];

/* eslint-disable no-undef */
function evalTrackCount({ gridClass, railClass }) {
  return document.querySelectorAll(`.${gridClass}, .${railClass}`).length;
}
function readRenderPhase(expectedId) {
  const preview = window.__STORYBOOK_PREVIEW__;
  const render = preview && preview.currentRender;
  if (!render) return { found: false };
  return {
    found: true,
    idProp: 'id',
    id: render.id,
    idMatches: render.id === expectedId,
    phase: render.phase,
  };
}
/* eslint-enable no-undef */

async function navigate(page, baseUrl, storyId, width) {
  await page.setViewportSize({ width, height: HEIGHT });
  const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${LOCALE}&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
}

async function waitForRenderPhase(page, storyId, timeout) {
  try {
    await page.waitForFunction(
      (expectedId) => {
        const preview = window.__STORYBOOK_PREVIEW__;
        const render = preview && preview.currentRender;
        if (!render) return false;
        return render.id === expectedId && (render.phase === 'finished' || render.phase === 'errored');
      },
      storyId,
      { timeout },
    );
  } catch {
    return { timedOut: true };
  }
  const info = await page.evaluate(readRenderPhase, storyId);
  return { timedOut: false, ...info };
}

async function waitForSbShowMain(page, timeout) {
  try {
    await page.waitForFunction(() => document.body.classList.contains('sb-show-main'), undefined, { timeout });
  } catch {
    return { timedOut: true };
  }
  return { timedOut: false };
}

async function main() {
  console.log('62_probe-render-phase.mjs — Task 815 §17.3 signal probe');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log(`cwd: ${process.cwd()}`);
  console.log(`command: node docs/sessions/evidence/task815/62_probe-render-phase.mjs\n`);

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  const selectors = await extractTrackSelectors(staticDir);
  console.log(`selectors: asset=${selectors.asset} gridClass=${selectors.gridClass} railClass=${selectors.railClass}\n`);

  let sampleN = 0;
  const step1Results = [];

  console.log('── Step 1/2: render-phase resolve + 2000ms stability witness (16 stories x 2 widths = 32 samples) ──');
  for (const storyId of IN_SCOPE_16) {
    for (const width of WIDTHS) {
      sampleN += 1;
      const page = await browser.newPage();
      let line;
      try {
        await navigate(page, baseUrl, storyId, width);
        const resolved = await waitForRenderPhase(page, storyId, READY_TIMEOUT_MS);
        if (resolved.timedOut) {
          line = `SAMPLE ${sampleN}: story=${storyId} width=${width} TIMED_OUT (no finished/errored phase within ${READY_TIMEOUT_MS}ms)`;
          step1Results.push({ storyId, width, timedOut: true });
        } else {
          const trackCountAtResolve = await page.evaluate(evalTrackCount, selectors);
          await page.waitForTimeout(2000);
          const trackCountAfter2000ms = await page.evaluate(evalTrackCount, selectors);
          line =
            `SAMPLE ${sampleN}: story=${storyId} width=${width} idProp=${resolved.idProp} resolvedId=${resolved.id} ` +
            `idMatches=${resolved.idMatches} phase=${resolved.phase} trackCountAtResolve=${trackCountAtResolve} ` +
            `trackCountAfter2000ms=${trackCountAfter2000ms}`;
          step1Results.push({
            storyId, width, timedOut: false,
            idMatches: resolved.idMatches, phase: resolved.phase,
            trackCountAtResolve, trackCountAfter2000ms,
          });
        }
      } finally {
        await page.close();
      }
      console.log(line);
    }
  }

  console.log('\n── Step 4: counter-check — same 32 samples, track count at the moment sb-show-main resolves (Rev 1 signal) ──');
  const counterCheckResults = [];
  sampleN = 0;
  for (const storyId of IN_SCOPE_16) {
    for (const width of WIDTHS) {
      sampleN += 1;
      const page = await browser.newPage();
      let line;
      try {
        await navigate(page, baseUrl, storyId, width);
        const settled = await waitForSbShowMain(page, READY_TIMEOUT_MS);
        if (settled.timedOut) {
          line = `COUNTERCHECK ${sampleN}: story=${storyId} width=${width} TIMED_OUT (sb-show-main never set)`;
          counterCheckResults.push({ storyId, width, timedOut: true });
        } else {
          const trackCount = await page.evaluate(evalTrackCount, selectors);
          line = `COUNTERCHECK ${sampleN}: story=${storyId} width=${width} sbShowMainTrackCount=${trackCount}`;
          counterCheckResults.push({ storyId, width, timedOut: false, trackCount });
        }
      } finally {
        await page.close();
      }
      console.log(line);
    }
  }

  console.log('\n── Step 5: two canonical stories with no track — each must reach finished/errored within the timeout ──');
  const noTrackResults = [];
  sampleN = 0;
  for (const storyId of NO_TRACK_2) {
    for (const width of WIDTHS) {
      sampleN += 1;
      const page = await browser.newPage();
      let line;
      try {
        await navigate(page, baseUrl, storyId, width);
        const resolved = await waitForRenderPhase(page, storyId, READY_TIMEOUT_MS);
        if (resolved.timedOut) {
          line = `NOTRACK ${sampleN}: story=${storyId} width=${width} TIMED_OUT (no finished/errored phase within ${READY_TIMEOUT_MS}ms)`;
          noTrackResults.push({ storyId, width, reached: false });
        } else {
          line = `NOTRACK ${sampleN}: story=${storyId} width=${width} idProp=${resolved.idProp} resolvedId=${resolved.id} idMatches=${resolved.idMatches} phase=${resolved.phase} reached=true`;
          noTrackResults.push({ storyId, width, reached: true, idMatches: resolved.idMatches, phase: resolved.phase });
        }
      } finally {
        await page.close();
      }
      console.log(line);
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  // ── Mechanical adoption rule (kickoff §17.3) ──
  const allStep1Ok = step1Results.every(
    (r) => !r.timedOut && r.idMatches && (r.phase === 'finished' || r.phase === 'errored') &&
      r.trackCountAtResolve > 0 && r.trackCountAtResolve === r.trackCountAfter2000ms,
  );
  const allNoTrackOk = noTrackResults.every((r) => r.reached && r.idMatches && (r.phase === 'finished' || r.phase === 'errored'));
  const routeA = allStep1Ok && allNoTrackOk;

  console.log('\n── Adoption rule (mechanical) ──');
  console.log(`step1 (32 in-scope samples) all pass: ${allStep1Ok}`);
  if (!allStep1Ok) {
    for (const r of step1Results) {
      if (r.timedOut || !r.idMatches || !(r.phase === 'finished' || r.phase === 'errored') || r.trackCountAtResolve === 0 || r.trackCountAtResolve !== r.trackCountAfter2000ms) {
        console.log(`  FAILING SAMPLE: ${JSON.stringify(r)}`);
      }
    }
  }
  console.log(`no-track 2 stories (4 samples) all reach finished/errored: ${allNoTrackOk}`);
  if (!allNoTrackOk) {
    for (const r of noTrackResults) {
      if (!r.reached || !r.idMatches || !(r.phase === 'finished' || r.phase === 'errored')) {
        console.log(`  FAILING SAMPLE: ${JSON.stringify(r)}`);
      }
    }
  }
  console.log(routeA ? 'ROUTE SELECTED: A (Storybook render phase)' : 'ROUTE SELECTED: B (deterministic wait, 15s, 6 pages)');

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
