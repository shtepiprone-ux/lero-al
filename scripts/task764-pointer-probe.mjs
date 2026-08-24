#!/usr/bin/env node
/**
 * task764-pointer-probe.mjs — Task 764 Phase A / A2 rendered evidence.
 *
 * Serves the already-built `storybook-static/` locally and drives the REAL production
 * `ListingCard` (`mantine-primitives-listingcard--default` — statically imports `ListingCard`,
 * clause 16c canonical binding; NOT `ListingCardPattern.stories.tsx`, which renders `DemoImage`,
 * per Task 763's review finding) through THREE Playwright contexts (kickoff §10.1):
 *
 *   - fine (control):        default desktop context. Expect hover:hover=true, pointer:fine=true.
 *   - coarse-natural:        `hasTouch: true`, same viewport. RETAINED LIMITATION, not the A2
 *                            subject — expected to report `(hover: none)` (§3.4 row 2). Its
 *                            failure to reach the target hybrid state is NOT a BLOCKED condition.
 *   - coarse-override:       launched with Chromium flag
 *                            `--blink-settings=primaryHoverType=2,availableHoverTypes=2,
 *                             primaryPointerType=2,availablePointerTypes=2`, WITHOUT `hasTouch`
 *                            (§3.4 row 4: the two cancel — never combine them). This is the A2
 *                            subject, authorized narrowly by owner decision D63-G for probe
 *                            measurement only — no product code, gate, or threshold depends on it.
 *
 * A2 gate (owner decision D63-G, 2026-08-22): before Phase A2 or Phase B may run, the
 * coarse-override context's three matchMedia values must satisfy
 *   hover:hover === true && pointer:coarse === true && pointer:fine === false
 * If not, this script still WRITES every measured value (so the record exists) but exits
 * non-zero; the caller (the executor) must stop at BLOCKED and not proceed further. Do not
 * fall back to hasTouch and do not reach for CDP Emulation.setEmulatedMedia (§3.4 row 5: silent
 * no-op).
 *
 * "Priority" vs "non-priority" card: the story's `Default` export does not pass `priority` to
 * any of its three `ListingCard` instances, so every rendered `<img>` carries `AppImage`'s
 * `.fade` class (the `!priority && styles.fade` branch) as rendered. This probe simulates the
 * `priority=true` DOM state by finding, via CSSOM introspection recursing into `@layer`/`@media`
 * grouping rules (not a hardcoded hashed class name), whichever class on the `<img>` owns a
 * `transition-property` declaration, and removing exactly that class before the "synthetic
 * priority" sample — reproducing the real production difference (presence/absence of `.fade`)
 * with no file edit. This is a runtime-only DOM mutation inside an ephemeral Playwright page;
 * nothing is persisted.
 *
 * Usage:
 *   node scripts/task764-pointer-probe.mjs matrix <label>     # Phase A  -> phase-a-pointer-matrix.<label>.json
 *   node scripts/task764-pointer-probe.mjs curve  <label>     # Phase A2 -> phase-a-transition-curve.<label>.json
 *   node scripts/task764-pointer-probe.mjs favorites <label>  # Rev1 R-A/R-D -> rev1-favorites-composition.<label>.json
 * <label> is typically 'pre-edit' or 'post-edit'; output files are written per-label, not
 * overwritten, so both pre- and post-edit runs are retained.
 *
 * Revision 1 additions:
 *   - `matrix` mode now also runs a fourth context, `reducedMotion`, launched via Playwright's
 *     `newContext({ reducedMotion: 'reduce' })` (a real `prefers-reduced-motion: reduce` media
 *     match, not a CSS override) — closes F4 (kickoff §10.3): the grid card's image/title hover
 *     `effectiveScale`/`transform` are MEASURED under this context, not reasoned from the
 *     cascade (A6).
 *   - `favorites` mode drives the `mantine-primitives-listingcard--favorites-composition` story
 *     (kickoff §10.1/§10.4) and captures rest/hover-on-image/hover-on-title/hover-on-action for
 *     the grid card's image, plus `document.elementFromPoint` at the save action's centre
 *     (AC16's paint-order check).
 */
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = 6118;
const STATIC_DIR = join(ROOT, 'storybook-static');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task764');

const BLINK_SETTINGS_ARG =
  '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=2,availablePointerTypes=2';

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
const FAVORITES_STORY_ID = 'mantine-primitives-listingcard--favorites-composition';
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
  // an author stylesheet — identifies AppImage's `.fade` class (declared inside `@layer
  // utilities`) without a hardcoded hashed name. Recurses into grouping rules (@layer, @media,
  // @supports) since `.fade` is not a top-level rule.
  return imgHandle.evaluate((img) => {
    const classes = Array.from(img.classList);
    function search(rules) {
      for (const rule of Array.from(rules || [])) {
        // NOTE: rule.cssRules is an empty-but-truthy array on leaf CSSStyleRule objects in this
        // Chromium build — `if (rule.cssRules)` alone wrongly recurses into it and skips the
        // rule's own selectorText. Only treat it as a grouping rule when non-empty.
        if (rule.cssRules && rule.cssRules.length) {
          const found = search(rule.cssRules);
          if (found) return found;
          continue;
        }
        if (!rule.selectorText || !rule.style) continue;
        if (!rule.style.transitionProperty) continue;
        for (const cls of classes) {
          if (rule.selectorText === `.${cls}`) return cls;
        }
      }
      return null;
    }
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const found = search(rules);
      if (found) return found;
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

async function gotoStory(page) {
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);
}

async function gotoFavoritesStory(page) {
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${FAVORITES_STORY_ID}&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);
}

async function runMatrixForContext(browser, contextOpts, label, findCards) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOpts });
  const page = await context.newPage();
  await gotoStory(page);

  const matchMedia = await page.evaluate(evalMatchMedia);

  const gridCard = page.locator('a.listing-card--vertical').first();
  const gridImg = gridCard.locator('img').first();
  const gridTitle = gridCard.locator('h3').first();

  const listCard = page.locator('a.listing-card--horizontal').first();
  const listImg = listCard.locator('img').first();
  const listTitle = listCard.locator('h3').first();

  async function moveAway() {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
  }

  async function sampleFor(cardLocator, img, title, fadeRemoved) {
    const cardCount = await cardLocator.count();
    if (cardCount === 0) return { skipped: true, reason: 'card not found in DOM' };
    const imgHandle = await img.elementHandle();
    if (!imgHandle) return { skipped: true, reason: 'img not found in DOM' };
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

  const gridAsRendered = await sampleFor(gridCard, gridImg, gridTitle, false);
  const gridSyntheticPriority = await sampleFor(gridCard, gridImg, gridTitle, true);
  const listAsRendered = await sampleFor(listCard, listImg, listTitle, false);

  await context.close();
  return {
    label,
    matchMedia,
    grid: { asRendered: gridAsRendered, syntheticPriority: gridSyntheticPriority },
    list: { asRendered: listAsRendered },
  };
}

async function captureActionWrapperOpacity(action) {
  // Walks up from the action element to the nearest ancestor whose class list contains
  // `imageActions` (the CSS Module wrapper class, hashed at build time — matched by substring,
  // not an exact/hardcoded name) and returns its computed `opacity`. AC17's coarse-pointer
  // reveal capture and the P4 planted-violation proof both read this.
  return action.evaluate((el) => {
    let node = el
    while (node && node !== document.body) {
      const classes = Array.from(node.classList || [])
      if (classes.some((c) => c.includes('imageActions'))) {
        return getComputedStyle(node).opacity
      }
      node = node.parentElement
    }
    return null
  })
}

async function runFavoritesForContext(browser, contextOpts, label) {
  // English aria-label — matches the pinned `globals=locale:en` in gotoFavoritesStory; the
  // save action must be located by its own accessible name, never by the title/image selectors
  // (kickoff §10.4: "not the title, not the image").
  const SAVE_ACTION_NAME = 'Save to collection';

  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOpts });
  const page = await context.newPage();
  await gotoFavoritesStory(page);

  const matchMedia = await page.evaluate(evalMatchMedia);

  const card = page.locator('a.listing-card--vertical').first();
  const img = card.locator('img').first();
  const title = card.locator('h3').first();
  const action = page.getByRole('button', { name: SAVE_ACTION_NAME });

  async function moveAway() {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
  }

  const imgHandle = await img.elementHandle();

  await moveAway();
  const rest = await captureState(page, imgHandle);
  const actionOpacityAtRest = await captureActionWrapperOpacity(action);

  const imgBox = await img.boundingBox();
  await page.mouse.move(imgBox.x + imgBox.width / 2, imgBox.y + imgBox.height / 2);
  await page.waitForTimeout(SETTLE_MS);
  const hoverOnImage = await captureState(page, imgHandle);
  // AC17 (R17) — reveal on card hover, measured at the SAME moment as the image zoom sample
  // above (hovering the image is hovering the card — `.cardGrid:hover`).
  const actionOpacityOnCardHover = await captureActionWrapperOpacity(action);

  await moveAway();
  const titleBox = await title.boundingBox();
  await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  await page.waitForTimeout(SETTLE_MS);
  const hoverOnTitle = await captureState(page, imgHandle);

  await moveAway();
  const actionBox = await action.boundingBox();
  const actionCentre = { x: actionBox.x + actionBox.width / 2, y: actionBox.y + actionBox.height / 2 };
  await page.mouse.move(actionCentre.x, actionCentre.y);
  await page.waitForTimeout(SETTLE_MS);
  const hoverOnAction = await captureState(page, imgHandle);

  // AC16 — elementFromPoint at the action's own centre must return the action, not a badge
  // painted at the same top-left offset (kickoff §3.4/§10.4).
  const elementAtActionCentre = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return {
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : String(el.className),
      ariaLabel: el.getAttribute('aria-label'),
      closestButtonAriaLabel: el.closest('button')?.getAttribute('aria-label') ?? null,
    };
  }, [actionCentre.x, actionCentre.y]);

  await moveAway();
  await context.close();
  return {
    label,
    matchMedia,
    rest,
    hoverOnImage,
    hoverOnTitle,
    hoverOnAction,
    elementAtActionCentre,
    reveal: { actionOpacityAtRest, actionOpacityOnCardHover },
  };
}

async function runCurveForContext(browser, contextOpts, label) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOpts });
  const page = await context.newPage();
  await gotoStory(page);

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

  const browserDefault = await chromium.launch();
  const browserOverride = await chromium.launch({ args: [BLINK_SETTINGS_ARG] });
  const browserVersion = browserDefault.version();

  try {
    if (mode === 'matrix') {
      const fine = await runMatrixForContext(browserDefault, {}, 'fine');
      const coarseNatural = await runMatrixForContext(browserDefault, { hasTouch: true }, 'coarse-natural');
      const coarseOverride = await runMatrixForContext(browserOverride, {}, 'coarse-override');
      // Revision 1 / F4 (kickoff §10.3) — a REAL `prefers-reduced-motion: reduce` context
      // (Playwright's own `newContext` option), not a CSS reasoning claim. Reuses the identical
      // sampling function/assertions as the other three contexts.
      const reducedMotion = await runMatrixForContext(browserDefault, { reducedMotion: 'reduce' }, 'reduced-motion');

      const gate = coarseOverride.matchMedia.hoverHover === true
        && coarseOverride.matchMedia.pointerCoarse === true
        && coarseOverride.matchMedia.pointerFine === false;

      const result = { label, browserVersion, fine, coarseNatural, coarseOverride, reducedMotion, a2Gate: { pass: gate, assertedOn: 'coarseOverride.matchMedia' } };
      const outPath = join(EVIDENCE_DIR, `phase-a-pointer-matrix.${label}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log('WROTE', outPath);
      console.log('Browser version:', browserVersion);
      console.log('fine matchMedia:', JSON.stringify(fine.matchMedia));
      console.log('coarse-natural matchMedia (retained limitation, not gating):', JSON.stringify(coarseNatural.matchMedia));
      console.log('coarse-override matchMedia (A2 subject):', JSON.stringify(coarseOverride.matchMedia));
      console.log('reduced-motion grid image-hover effectiveScale.w:', JSON.stringify(
        reducedMotion.grid.asRendered.hoverOnImage.rect.width / reducedMotion.grid.asRendered.rest.rect.width,
      ));
      console.log('A2 GATE:', gate ? 'PASS — (hover:hover) && (pointer:coarse) && !(pointer:fine) on coarse-override' : 'FAIL — stop at BLOCKED per kickoff §10.1/A2 (D63-G), do not run curve or Phase B');
      process.exitCode = gate ? 0 : 1;
    } else if (mode === 'curve') {
      const fine = await runCurveForContext(browserDefault, {}, 'fine');
      const result = { label, browserVersion, fine };
      const outPath = join(EVIDENCE_DIR, `phase-a-transition-curve.${label}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log('WROTE', outPath);
    } else if (mode === 'favorites') {
      const fine = await runFavoritesForContext(browserDefault, {}, 'fine');
      // AC17 — "proven ... by a coarse-pointer reveal capture": the coarse-override context
      // (D63-G) reports (hover:hover) && (pointer:coarse) && !(pointer:fine), the exact hybrid
      // state the reveal's `(hover: hover)`-only guard must still fire under.
      const coarseOverride = await runFavoritesForContext(browserOverride, {}, 'coarse-override');
      const result = { label, browserVersion, fine, coarseOverride };
      const outPath = join(EVIDENCE_DIR, `rev1-favorites-composition.${label}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log('WROTE', outPath);
      console.log('fine matchMedia:', JSON.stringify(fine.matchMedia));
      console.log('elementAtActionCentre:', JSON.stringify(fine.elementAtActionCentre));
      console.log('fine reveal:', JSON.stringify(fine.reveal));
      console.log('coarse-override matchMedia:', JSON.stringify(coarseOverride.matchMedia));
      console.log('coarse-override reveal:', JSON.stringify(coarseOverride.reveal));
    } else {
      throw new Error(`Unknown mode: ${mode} (expected matrix|curve|favorites)`);
    }
  } finally {
    await browserDefault.close();
    await browserOverride.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
