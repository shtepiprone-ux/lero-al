#!/usr/bin/env node
/**
 * 691R round 2 (F-N) — `prefers-reduced-motion: reduce` negative-flow probe. Modelled on
 * coarse-pointer-probe.mjs (same static server, same `--static` flag, same output shape).
 *
 * Module `MantineListingCardPattern.module.css:72-83` under `@media (prefers-reduced-motion:
 * reduce)` resets `.card:hover`'s own `transform` (the `translateY(-2px)` lift) and
 * `.card:hover .imageSection img`'s `transform` (the `scale(1.05)` zoom) to `none`. It does
 * **not** touch the `scale` CSS property that `group-hover:scale-105` (F-A) sets — that
 * mechanism is untouched by this block. So under RM, hover is expected to give
 * `transform: none` but `scale: 1.05` — the composite zoom is only half-suppressed, by design of
 * the pre-existing module code (not something this task changes).
 *
 * A desktop context (not `devices['iPhone 12']`) is used deliberately: RM and coarse-pointer
 * are independent negative flows, and mixing them would leave RM's effect indistinguishable
 * from `(hover: hover)` never having matched at all. Real `.hover()`, not `.tap()`.
 *
 * Two passes in the same run: `reducedMotion: 'reduce'` (the flow under test) and
 * `reducedMotion: 'no-preference'` (the control). The control's own assertions fail closed if
 * hover does not visibly zoom without RM — otherwise a probe that always reports "nothing
 * changed" would be indistinguishable from a probe that correctly measured RM suppressing it.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const STATIC_DIR = args.static ? resolve(args.static) : join(ROOT, 'storybook-static');
// `--static` pointing at the base worktree's build is the BEFORE phase; the default (this
// worktree's own storybook-static) is AFTER — same convention capture-computed-styles.mjs uses.
const PHASE = args.static ? 'before' : 'after';
const OUT = join(__dirname, `reduced-motion-probe-${PHASE}.json`);
const PORT = 6398;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};
function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch { res.writeHead(404); res.end('Not found'); }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

function readCardState() {
  const cardEl = document.querySelector('[class*="_card_"]');
  const img = cardEl && cardEl.querySelector('img');
  const title = cardEl && cardEl.querySelector('h3');
  return {
    imgScale: img ? getComputedStyle(img).scale : null,
    imgTransform: img ? getComputedStyle(img).transform : null,
    imgTransitionDuration: img ? getComputedStyle(img).transitionDuration : null,
    titleColor: title ? getComputedStyle(title).color : null,
  };
}

async function runPass(browser, reducedMotion) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 4000 } });
  const page = await context.newPage();
  try {
    await page.emulateMedia({ reducedMotion });
    await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body');

    const mediaReduce = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

    const rest = await page.evaluate(readCardState);

    const card = page.locator('[class*="_card_"]').first();
    await card.hover();
    await page.waitForTimeout(400);
    const hover = await page.evaluate(readCardState);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    return { reducedMotion, mediaPrefersReducedMotionReduce: mediaReduce, rest, hover };
  } finally {
    await context.close();
  }
}

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const result = { staticDir: STATIC_DIR };
  try {
    result.control = await runPass(browser, 'no-preference');
    result.reducedMotion = await runPass(browser, 'reduce');
  } finally {
    await browser.close();
    server.close();
  }

  // Fail-closed: the control must actually show the hover zoom firing, otherwise a probe that
  // measures nothing would be indistinguishable from one correctly observing RM suppression.
  const controlHoverFired = /matrix\(1\.05/.test(result.control.hover.imgTransform ?? '');
  result.controlHoverFired = controlHoverFired;

  // Under RM, module :77-79/:80-82 resets `.card:hover`/`.card:hover .imageSection img`'s
  // `transform` to `none`. `scale` (the group-hover mechanism, F-A) is untouched by that block.
  const rmTransformSuppressed = result.reducedMotion.hover.imgTransform === 'none';
  result.rmTransformSuppressed = rmTransformSuppressed;
  result.rmScaleSurvives = result.reducedMotion.hover.imgScale;

  result.passed = controlHoverFired && rmTransformSuppressed;

  await writeFile(OUT, JSON.stringify(result, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(JSON.stringify(result, null, 2));

  if (!controlHoverFired) {
    console.error(`REDUCED-MOTION PROBE FAILED — control pass (no-preference) did not show transform:matrix(1.05,...) on hover; got "${result.control.hover.imgTransform}". The probe cannot distinguish RM suppression from a probe that measured nothing.`);
    process.exit(1);
  }
  if (!rmTransformSuppressed) {
    console.error(`REDUCED-MOTION PROBE FAILED — reduced-motion pass did not show transform:none on hover; got "${result.reducedMotion.hover.imgTransform}".`);
    process.exit(1);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
