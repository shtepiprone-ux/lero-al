#!/usr/bin/env node
/**
 * task764-pointer-probe.mjs — Task 764 Phase A / A2 rendered evidence.
 *
 * Serves the already-built `storybook-static/` locally and drives the REAL production
 * `ListingCard` (`mantine-primitives-listingcard--default` — statically imports `ListingCard`,
 * clause 16c canonical binding; NOT `ListingCardPattern.stories.tsx`, which renders `DemoImage`,
 * per Task 763's review finding) through two Playwright contexts:
 *
 *   - fine:   default desktop context (no touch emulation)
 *   - coarse: `hasTouch: true` at the SAME viewport (not `isMobile`) — per kickoff §10.1's exact
 *             instruction. This is deliberately different from Task 605's `hasTouch:true,
 *             isMobile:true` coarse context, which maps to `(hover: none)`, not the
 *             `(hover:hover) and (pointer:coarse)` hybrid state this task needs to measure.
 *
 * Phase A (mode=matrix, default): for each context, records matchMedia('(hover: hover)'),
 * matchMedia('(pointer: coarse)'), matchMedia('(pointer: fine)'), then rest / hover-image /
 * hover-title computed transform+scale+boundingClientRect for the first vertical card.
 *
 * A2 gate (owner instruction, 2026-08-21): if the coarse context does not report `true` for BOTH
 * `(hover: hover)` and `(pointer: coarse)` simultaneously, this script still WRITES the matrix
 * (so the measured values are on record) but the caller (the executor, per the kickoff) must stop
 * at BLOCKED and not run mode=curve or proceed to Phase B. This script does not decide that — it
 * only measures and reports the gate values plainly in the output.
 *
 * "Priority" vs "non-priority" card: the story's `Default` export does not pass `priority` to any
 * of its three `ListingCard` instances, so every rendered `<img>` carries `AppImage`'s `.fade`
 * class (the `!priority && styles.fade` branch) as rendered. Rather than add a `priority` card to
 * the canonical story (out of scope — no in-scope consumer authorizes a permanent story change),
 * this probe simulates the `priority=true` DOM state by finding, via CSSOM introspection (not a
 * hardcoded hashed class name), whichever class on the `<img>` owns a `transition-property`
 * declaration, and removing exactly that class before the "synthetic priority" sample —
 * reproducing the real production difference (presence/absence of `.fade`) with no file edit.
 * This is a runtime-only DOM mutation inside an ephemeral Playwright page; nothing is persisted.
 *
 * Usage:
 *   node scripts/task764-pointer-probe.mjs matrix <label>   # Phase A  -> phase-a-pointer-matrix.json
 *   node scripts/task764-pointer-probe.mjs curve  <label>   # Phase A2 -> phase-a-transition-curve.json
 * <label> is typically 'pre-edit' or 'post-edit'; output files are written per-label and merged
 * by the caller/report, not overwritten, so both pre- and post-edit runs are retained.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = 6118;
const STATIC_DIR = join(ROOT, 'storybook-static');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task764');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p === '/') p = '/index.html';
        const filePath = join(STATIC_DIR, p);
        const s = await stat(filePath).catch(() => null);
        if (!s || !s.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

const STORY_ID = 'mantine-primitives-listingcard--default';
const VIEWPORT = { width: 1024, height: 900 };
const SETTLE_MS = 620; // past the 300ms transition, matching Task 763's precedent margin

/* eslint-disable no-undef */
function evalMatchMedia() {
  return {
    hoverHover: window.matchMedia('(hover: hover)').matches,
    pointerCoarse: window.matchMedia('(pointer: coarse)').matches,
    pointerFine: window.matchMedia('(pointer: fine)').matches,
  };
}

function findFadeClass(imgHandle) {
  // Returns the class on the element (if any) that owns a `transition-property` declaration in
  // an author stylesheet — identifies AppImage's `.fade` class without a hardcoded hashed name.
  return imgHandle.evaluate((img) => {
    const classes = Array.from(img.classList);
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(rules || [])) {
        if (!rule.selectorText || !rule.style) continue;
        if (!rule.style.transitionProperty) continue;
        for (const cls of classes) {
          if (rule.selectorText === `.${cls}`) return cls;
        }
      }
    }
    return null;
  });
}

async function captureState(page, imgHandle) {
  return imgHandle.evaluate((img) => {
    const cs = getComputedStyle(img);
    const rect = img.getBoundingClientRect();
    return {
      transform: cs.transform,
      scale: cs.scale,
      transitionProperty: cs.transitionProperty,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      classList: Array.from(img.classList),
    };
  });
}

async function runMatrixForContext(browser, contextOpts, label) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOpts });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);

  const matchMedia = await page.evaluate(evalMatchMedia);

  const card = page.locator('a.listing-card--vertical').first();
  const img = card.locator('img').first();
  const title = card.locator('h3').first();

  async function moveAway() {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
  }

  async function sampleFor(fadeRemoved) {
    const imgHandle = await img.elementHandle();
    let removedClass = null;
    if (fadeRemoved) {
      removedClass = await findFadeClass(imgHandle);
      if (removedClass) await imgHandle.evaluate((el, cls) => el.classList.remove(cls), removedClass);
    }

    await moveAway();
    const rest = await captureState(page, imgHandle);

    const imgBox = await img.boundingBox();
    await page.mouse.move(imgBox.x + imgBox.width / 2, imgBox.y + imgBox.height / 2);
    await page.waitForTimeout(SETTLE_MS);
    const hoverOnImage = await captureState(page, imgHandle);

    await moveAway();
    const titleBox = await title.boundingBox();
    await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
    await page.waitForTimeout(SETTLE_MS);
    const hoverOnTitle = await captureState(page, imgHandle);

    await moveAway();
    if (removedClass) await imgHandle.evaluate((el, cls) => el.classList.add(cls), removedClass);

    return { removedClass, rest, hoverOnImage, hoverOnTitle };
  }

  const asRendered = await sampleFor(false);
  const syntheticPriority = await sampleFor(true);

  await context.close();
  return { label, matchMedia, asRendered, syntheticPriority };
}

async function runCurveForContext(browser, contextOpts, label) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOpts });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);

  const card = page.locator('a.listing-card--vertical').first();
  const img = card.locator('img').first();

  async function moveAway() {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
  }

  async function sampleCurve(fadeRemoved) {
    const imgHandle = await img.elementHandle();
    let removedClass = null;
    if (fadeRemoved) {
      removedClass = await findFadeClass(imgHandle);
      if (removedClass) await imgHandle.evaluate((el, cls) => el.classList.remove(cls), removedClass);
    }

    await moveAway();
    const imgBox = await img.boundingBox();
    const samples = [];
    const offsets = [0, 75, 150, 300, 600];
    let elapsed = 0;
    await page.mouse.move(imgBox.x + imgBox.width / 2, imgBox.y + imgBox.height / 2);
    for (const target of offsets) {
      if (target > elapsed) {
        await page.waitForTimeout(target - elapsed);
        elapsed = target;
      }
      const s = await captureState(page, imgHandle);
      samples.push({ tMs: target, ...s });
    }

    await moveAway();
    if (removedClass) await imgHandle.evaluate((el, cls) => el.classList.add(cls), removedClass);
    return { removedClass, samples };
  }

  const nonPriority = await sampleCurve(false);
  const syntheticPriority = await sampleCurve(true);

  await context.close();
  return { label, nonPriority, syntheticPriority };
}

async function main() {
  const mode = process.argv[2] || 'matrix';
  const label = process.argv[3] || 'baseline';

  await mkdir(EVIDENCE_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();

  try {
    if (mode === 'matrix') {
      const fine = await runMatrixForContext(browser, {}, 'fine');
      const coarse = await runMatrixForContext(browser, { hasTouch: true }, 'coarse');
      const result = { label, capturedAt: 'see git log / session transcript (no wall-clock in artifact)', fine, coarse };
      const outPath = join(EVIDENCE_DIR, `phase-a-pointer-matrix.${label}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log('WROTE', outPath);
      console.log('A2 GATE VALUES — coarse context matchMedia:', JSON.stringify(coarse.matchMedia));
      const gatePass = coarse.matchMedia.hoverHover === true && coarse.matchMedia.pointerCoarse === true;
      console.log('A2 GATE:', gatePass ? 'PASS — (hover:hover) AND (pointer:coarse) both true' : 'FAIL — proceed to BLOCKED per kickoff §10.1/A2, do not run curve or Phase B');
      process.exitCode = gatePass ? 0 : 1;
    } else if (mode === 'curve') {
      const fine = await runCurveForContext(browser, {}, 'fine');
      const result = { label, fine };
      const outPath = join(EVIDENCE_DIR, `phase-a-transition-curve.${label}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log('WROTE', outPath);
    } else {
      throw new Error(`Unknown mode: ${mode} (expected matrix|curve)`);
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
