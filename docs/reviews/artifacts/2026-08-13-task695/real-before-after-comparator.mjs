#!/usr/bin/env node
/**
 * Task 695 — two-phase before/after comparator for the seven `var(--color-overlay*)` ->
 * `var(--overlay*)` migration sites (§3.2, §9.2 of the kickoff).
 *
 * TWO REAL PHASES, same shape as `docs/reviews/artifacts/2026-08-13-task748-rework/
 * real-before-after-comparator.mjs` (task's §9.2 "reuse its shape"):
 *   BEFORE = a clean I0 export of f42e9b855bcd119ad2041c0daf1c5b6d06d637c4 (`git archive … | tar -x`,
 *            read-only, node_modules reused via a directory junction — package-lock.json is
 *            byte-identical because nothing in this task touches dependencies), both
 *            `npm run build-storybook` and `npm run build` run there natively.
 *   AFTER  = this worktree's own `storybook-static` + `.next`, built after steps 3-5 of the
 *            kickoff's mandatory ordering (comment rewrite, seven-site migration, `@theme` deletion).
 *
 * Both `LightboxView` and `MantineListingGalleryPattern` are real story-backed production
 * components (`docs/reviews/artifacts/2026-08-13-task695/` — no synthetic harness needed, unlike
 * Task 748 REWORK's Part B witnesses which had no canonical story). All four sites below resolve
 * REAL rendered elements in each phase's own DOM, structurally — never by translated aria-label
 * text, which would vary by locale — so the same selector logic works across all 4 locales.
 *
 * Four sites (kickoff §9.2):
 *   1. modalScrim         — LightboxView `Modal.Content` `backgroundColor` (color-mix over
 *                            `--color-overlay`/`--overlay`).
 *   2. actionIconClose     — the four `--ai-*`-driven ActionIcon custom properties, captured as
 *                            `backgroundColor`+`color` at REST and again at HOVER (all three
 *                            ActionIcons in `LightboxView.tsx` share the exact same
 *                            `LIGHTBOX_ACTION_ICON_STYLE` object, so one instance — Close, always
 *                            present — proves the rename for all three).
 *   3. activeThumbnailBorder — the active thumbnail's `borderColor` (`--color-overlay-foreground`
 *                            -> `--overlay-foreground`).
 *   4. extraCountText      — `MantineListingGalleryPattern`'s `+N` overflow badge `Text` `color`.
 *
 * Structural selection (no aria-label text, which is locale-translated): within the opened
 * `Modal.Content` (`[role="dialog"]`), `LightboxView.tsx`'s JSX renders, in DOM order: Close
 * ActionIcon, counter div, Prev ActionIcon (images.length>1), image div, Next ActionIcon
 * (images.length>1), thumbnail strip. The multi-image story fixture has 3 images, so
 * `dialog.querySelectorAll('button')` is `[close, prev, next, thumb0, thumb1, thumb2]` — a fixed,
 * locale-independent structural contract this task does not change (§8 out of scope: sibling
 * button ordering/classNames untouched).
 *
 * Matrix (Task 695 review, F8): 7 measured properties × 4 locales × the 4 canonical Mantine story
 * widths (320/375/390/1024, `check-stories-rendered.mjs` MANTINE_VIEWPORTS) = 112 cells. The first
 * submission ran 28 — one width — while the kickoff §11 declared Q3's visual matrix applies and
 * `docs/qa-profiles.md:15` defines Q3 as all required widths and all four locales, mobile stress
 * cells included. The three mobile widths were neither captured nor declared as an exception.
 *
 * Fail-closed: exits 1 on any moved property, missing/errored/short cell. `--plant` corrupts the
 * AFTER-side measurement of two cells at one pinned (locale, viewport) pair before comparison
 * (never the expectation) to prove the comparator reddens on a real subject defect (AC2's "shown
 * to fail" requirement). Pinning keeps the planted run at 2/112 rather than scaling with the
 * matrix.
 *
 * Usage:
 *   node real-before-after-comparator.mjs             Real run, BEFORE vs AFTER.
 *   node real-before-after-comparator.mjs --plant      Same, with one AFTER cell corrupted.
 *   LERO_I0_EXPORT_DIR=<path> node real-before-after-comparator.mjs   Override the I0 export location.
 */
import { writeFile, readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');

const I0_REVISION = 'f42e9b855bcd119ad2041c0daf1c5b6d06d637c4';
const I0_EXPORT_DIR = process.env.LERO_I0_EXPORT_DIR
  ? resolve(process.env.LERO_I0_EXPORT_DIR)
  : resolve(ROOT, '..', 'lero-al-i0-f42e9b8');
const BEFORE_STATIC = join(I0_EXPORT_DIR, 'storybook-static');
const AFTER_STATIC = join(ROOT, 'storybook-static');
const BEFORE_PORT = 6521;
const AFTER_PORT = 6522;
const PLANT = process.argv.includes('--plant');
const LOCALES = ['sq', 'en', 'uk', 'it'];
// Task 695 review, F8 — the canonical Mantine story matrix, verbatim from
// `scripts/check-stories-rendered.mjs`'s MANTINE_VIEWPORTS (:393-398). The first submission
// captured `const VIEWPORT = 1024` only — 1 of the 4 required widths — while the kickoff's §11
// declares Q3's visual matrix applies to both rendered surfaces and `docs/qa-profiles.md:15`
// defines Q3 as "all required Storybook/app widths and all four locales, including mobile stress
// cells". A single-width capture was neither full coverage nor a declared exception. Both story
// subjects here are Mantine stories, so MANTINE_VIEWPORTS — not VIEWPORTS_FULL — is the set that
// binds.
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 812 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1024', width: 1024, height: 768 },
];
// The plant stays pinned to one (locale, viewport) pair so its 2 failing cells stay legible
// against the full matrix instead of scaling with it.
const PLANT_LOCALE = 'en';
const PLANT_VIEWPORT = 'desktop-1024';

function requireI0Export() {
  if (existsSync(BEFORE_STATIC)) return;
  console.error(`I0 export not found at ${I0_EXPORT_DIR} (need storybook-static/ built there).`);
  console.error(`Create it with: git archive ${I0_REVISION} | tar -x -C <target-dir>`);
  console.error('...then npm run build-storybook there (node_modules via a directory junction is fine).');
  process.exit(1);
}
function requireAfterBuild() {
  if (existsSync(AFTER_STATIC)) return;
  console.error(`AFTER build not found at ${AFTER_STATIC} — run "npm run build-storybook" in this worktree first (after the migration is implemented).`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};
function startStaticServer(staticDir, port) {
  return new Promise((res, rej) => {
    const server = createServer(async (req, resp) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        resp.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        resp.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          resp.writeHead(200, { 'Content-Type': 'text/html' });
          resp.end(data);
        } catch { resp.writeHead(404); resp.end('Not found'); }
      }
    });
    server.listen(port, '127.0.0.1', () => res(server));
    server.on('error', rej);
  });
}

const LIGHTBOX_STORY_ID = 'mantine-primitives-lightboxview--default';
const GALLERY_STORY_ID = 'patterns-mantine-listinggallerypattern--default';

async function captureLightboxCell(page, locale, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`http://127.0.0.1:${page.__port}/iframe.html?id=${LIGHTBOX_STORY_ID}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root button');
  // First trigger button in DOM order = LightboxMultiImageSection's open button (3 images).
  await page.locator('#storybook-root button').first().click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'no dialog' };
    const buttons = [...dialog.querySelectorAll('button')];
    // Expect [close, prev, next, thumb0, thumb1, thumb2] — 3-image fixture.
    if (buttons.length < 6) return { error: `expected >=6 buttons in dialog, found ${buttons.length}` };
    const [closeBtn, , , thumb0] = buttons;
    const dialogCs = getComputedStyle(dialog);
    const closeCsRest = getComputedStyle(closeBtn);
    return {
      modalScrim: { backgroundColor: dialogCs.backgroundColor },
      actionIconRest: { backgroundColor: closeCsRest.backgroundColor, color: closeCsRest.color },
      thumbBorder: { borderColor: getComputedStyle(thumb0).borderColor },
    };
  });
  if (result.error) return { status: 'ERROR', error: result.error };

  // Hover the close button for real (Playwright pointer hover, not a forced CSS class) — this
  // is what proves the four --ai-* properties feed Mantine's OWN :hover rule (A2), not a JS state.
  await page.locator('[role="dialog"] button').first().hover();
  await page.waitForTimeout(80);
  const hoverResult = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const closeBtn = dialog.querySelectorAll('button')[0];
    const cs = getComputedStyle(closeBtn);
    return { backgroundColor: cs.backgroundColor, color: cs.color };
  });

  return {
    status: 'OK',
    modalScrim: result.modalScrim,
    actionIconRest: result.actionIconRest,
    actionIconHover: hoverResult,
    thumbBorder: result.thumbBorder,
  };
}

async function captureGalleryCell(page, locale, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`http://127.0.0.1:${page.__port}/iframe.html?id=${GALLERY_STORY_ID}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root');
  await page.waitForTimeout(300); // play() fires on mount (clicks main photo) — let it settle
  const result = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('#storybook-root p')];
    const el = candidates.find(p => /^\+\d+$/.test((p.textContent ?? '').trim()));
    if (!el) return { error: `no "+N" Text node found among ${candidates.length} <p> candidates` };
    return { color: getComputedStyle(el).color, text: el.textContent.trim() };
  });
  if (result.error) return { status: 'ERROR', error: result.error };
  return { status: 'OK', extraCountText: { color: result.color } };
}

async function main() {
  requireI0Export();
  requireAfterBuild();
  const beforeServer = await startStaticServer(BEFORE_STATIC, BEFORE_PORT);
  const afterServer = await startStaticServer(AFTER_STATIC, AFTER_PORT);
  const browser = await chromium.launch();
  const beforePage = await browser.newPage();
  const afterPage = await browser.newPage();
  beforePage.__port = BEFORE_PORT;
  afterPage.__port = AFTER_PORT;

  const cells = [];
  let failCount = 0;

  try {
    for (const viewport of VIEWPORTS) {
      for (const locale of LOCALES) {
        const plantHere = PLANT && locale === PLANT_LOCALE && viewport.name === PLANT_VIEWPORT;
        const cellPrefix = `${viewport.name}|${locale}`;

        const beforeLb = await captureLightboxCell(beforePage, locale, viewport);
        let afterLb = await captureLightboxCell(afterPage, locale, viewport);
        if (plantHere && afterLb.status === 'OK') {
          afterLb = { ...afterLb, actionIconHover: { ...afterLb.actionIconHover, backgroundColor: 'rgb(9, 9, 9)' } };
        }
        if (beforeLb.status !== 'OK' || afterLb.status !== 'OK') {
          cells.push({ cellKey: `lightbox|${cellPrefix}`, status: 'ERROR', beforeLb, afterLb });
          failCount++;
        } else {
          const props = [
            ['modalScrim.backgroundColor', beforeLb.modalScrim.backgroundColor, afterLb.modalScrim.backgroundColor],
            ['actionIconRest.backgroundColor', beforeLb.actionIconRest.backgroundColor, afterLb.actionIconRest.backgroundColor],
            ['actionIconRest.color', beforeLb.actionIconRest.color, afterLb.actionIconRest.color],
            ['actionIconHover.backgroundColor', beforeLb.actionIconHover.backgroundColor, afterLb.actionIconHover.backgroundColor],
            ['actionIconHover.color', beforeLb.actionIconHover.color, afterLb.actionIconHover.color],
            ['thumbBorder.borderColor', beforeLb.thumbBorder.borderColor, afterLb.thumbBorder.borderColor],
          ];
          for (const [prop, before, after] of props) {
            const same = before === after;
            if (!same) failCount++;
            cells.push({ cellKey: `lightbox|${cellPrefix}|${prop}`, status: same ? 'OK' : 'MOVED', before, after });
          }
        }

        const beforeGal = await captureGalleryCell(beforePage, locale, viewport);
        let afterGal = await captureGalleryCell(afterPage, locale, viewport);
        if (plantHere && afterGal.status === 'OK') {
          afterGal = { ...afterGal, extraCountText: { color: 'rgb(9, 9, 9)' } };
        }
        if (beforeGal.status !== 'OK' || afterGal.status !== 'OK') {
          cells.push({ cellKey: `gallery|${cellPrefix}`, status: 'ERROR', beforeGal, afterGal });
          failCount++;
        } else {
          const same = beforeGal.extraCountText.color === afterGal.extraCountText.color;
          if (!same) failCount++;
          cells.push({ cellKey: `gallery|${cellPrefix}|extraCountText.color`, status: same ? 'OK' : 'MOVED', before: beforeGal.extraCountText.color, after: afterGal.extraCountText.color });
        }
      }
    }
  } finally {
    await beforePage.close();
    await afterPage.close();
    await browser.close();
    beforeServer.close();
    afterServer.close();
  }

  const summary = {
    plant: PLANT,
    ...(PLANT ? { plantPinnedAt: { locale: PLANT_LOCALE, viewport: PLANT_VIEWPORT } } : {}),
    locales: LOCALES,
    viewports: VIEWPORTS.map((v) => v.name),
    totalCells: cells.length,
    failCount,
    cells,
  };
  const outPath = join(__dirname, PLANT ? 'real-comparator-PLANTED.json' : 'real-comparator-result.json');
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Total cells: ${cells.length}, failures: ${failCount}`);
  if (failCount > 0) {
    console.error('COMPARATOR: FAIL');
    process.exit(1);
  }
  console.log('COMPARATOR: PASS, diffCount: 0');
}

main().catch(e => { console.error(e); process.exit(1); });
