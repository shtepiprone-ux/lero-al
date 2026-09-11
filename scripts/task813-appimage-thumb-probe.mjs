#!/usr/bin/env node
/**
 * task813-appimage-thumb-probe.mjs — Task 813 R17/AC24 rendered measurement (Revision 4).
 *
 * WHY THIS SCRIPT EXISTS: `screenshots:assert` and every alias are retired (owner decision
 * 2026-09-03); AC24 explicitly requires raw measurements, not a screenshot ("Quote the raw
 * measurements per width — a screenshot is not a measurement"). Modelled on
 * `scripts/task766-route-shell-probe.mjs` (per-label retained JSON evidence, fail-closed cell
 * checks) and `scripts/check-stories-rendered.mjs` (static `storybook-static/` +
 * `iframe.html?id=...&globals=locale:...&viewMode=story` URL shape).
 *
 * Revision 4 correction (kickoff §13.5 step 1): Revision 3's pass condition checked per-row
 * uniformity only and printed a pass on cells that measured 66/83.5/106/329.5 px across widths —
 * not what AC24 says. This version's pass condition is exactly AC24's amended sentence: every
 * gallery-strip thumbnail and the no-src square measures 44×44 px (±1px) at every one of
 * 320/390/480/1440, the value is the same at all four widths (max − min ≤ 1px across every
 * measured thumbnail width, pooled across all four widths), and the page never overflows
 * horizontally. Elements are selected STRUCTURALLY (by walking from the section's own Text label
 * to its sibling content), never by `data-testid` — the Revision 3 Story's test hooks are removed
 * in Revision 4 (story markup existing only to serve a measurement is a probe, not a permanent
 * artifact). The same selector must find the Revision 3 elements too (same Stack/label/sibling
 * shape), which is what lets step 2's negative arm reuse this exact script unmodified.
 *
 * It is EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 *
 * Usage:
 *   npm run build-storybook   (must be run first)
 *   node scripts/task813-appimage-thumb-probe.mjs --out <path/to/output.json>
 *
 * `--out` is required; the script refuses to run without it and refuses to overwrite an existing
 * file (every run's evidence is retained under its own name — see kickoff §13.5 preamble on
 * `R17_04_ac24-thumb-measurements.json` staying untouched as Revision 3 evidence).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STORYBOOK_STATIC_DIR = join(ROOT, 'storybook-static');
const STORY_ID = 'mantine-primitives-appimage--default';
const LOCALE = 'en';
const WIDTHS = [320, 390, 480, 1440];
const TARGET_PX = 44;
const TOLERANCE_PX = 1;

const GALLERY_STRIP_LABEL = 'gallery-strip / thumbnail row';
const NO_SRC_LABEL = 'negative flow — no src (container-only, no crash)';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.map': 'application/json',
};

function parseArgs(argv) {
  const idx = argv.indexOf('--out');
  if (idx === -1 || !argv[idx + 1]) {
    console.error('Usage: node scripts/task813-appimage-thumb-probe.mjs --out <path/to/output.json>');
    console.error('--out is required: this probe refuses to guess where its evidence belongs.');
    process.exit(2);
  }
  return { outPath: resolve(process.cwd(), argv[idx + 1]) };
}

function startStaticServer(dir) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/') urlPath = '/index.html';
        const filePath = join(dir, urlPath);
        const body = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

async function main() {
  const { outPath } = parseArgs(process.argv.slice(2));

  if (existsSync(outPath)) {
    console.error(`Refusing to overwrite existing evidence file: ${outPath}`);
    process.exit(2);
  }
  if (!existsSync(STORYBOOK_STATIC_DIR)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(2);
  }
  await mkdir(dirname(outPath), { recursive: true });

  const server = await startStaticServer(STORYBOOK_STATIC_DIR);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const result = {
    story: STORY_ID,
    locale: LOCALE,
    target: { px: TARGET_PX, tolerancePx: TOLERANCE_PX },
    capturedAt: new Date().toISOString(),
    widths: [],
  };
  let hardFail = false;
  const failReasons = [];
  const pooledWidths = []; // every measured thumbnail width, across all elements and all viewport widths

  for (const viewportWidth of WIDTHS) {
    const context = await browser.newContext({ viewport: { width: viewportWidth, height: 1000 } });
    const page = await context.newPage();
    const cell = { viewportWidth };
    const storyUrl = `${baseUrl}/iframe.html?id=${STORY_ID}&globals=locale:${LOCALE}&viewMode=story`;

    try {
      const response = await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 30000 });
      cell.httpStatus = response ? response.status() : null;
      cell.ok = response ? response.ok() : false;

      const devServerDetected = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
      cell.devServerDetected = devServerDetected;

      const errorScreen = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'));
      cell.errorScreen = errorScreen;

      if (!cell.ok || devServerDetected || errorScreen) {
        cell.failReason = !cell.ok
          ? `non-OK response status ${cell.httpStatus}`
          : devServerDetected
            ? 'nextjs-portal present'
            : 'sb-show-errordisplay present';
        hardFail = true;
        failReasons.push(`width ${viewportWidth}: ${cell.failReason}`);
      } else {
        const measured = await page.evaluate(
          ({ galleryLabel, noSrcLabel }) => {
            function findSectionContent(labelText) {
              const candidates = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
              const labelEl = candidates.find(
                (el) => el.children.length === 0 && (el.textContent ?? '').trim() === labelText,
              );
              if (!labelEl || !labelEl.parentElement) return null;
              // Mantine injects a sibling <style> element (runtime CSS-variable scope, e.g.
              // SimpleGrid's `--sg-cols`) directly after some components — skip non-content tags
              // to reach the real next sibling.
              let el = labelEl.nextElementSibling;
              while (el && (el.tagName === 'STYLE' || el.tagName === 'SCRIPT')) el = el.nextElementSibling;
              return el;
            }

            const galleryContent = findSectionContent(galleryLabel);
            const noSrcContent = findSectionContent(noSrcLabel);

            const galleryThumbs = galleryContent ? Array.from(galleryContent.children) : [];
            const noSrcEls = noSrcContent ? [noSrcContent] : [];

            const toRect = (el, role, index) => {
              const r = el.getBoundingClientRect();
              return { role, index, width: r.width, height: r.height };
            };

            const rects = [
              ...galleryThumbs.map((el, i) => toRect(el, 'gallery-strip', i)),
              ...noSrcEls.map((el, i) => toRect(el, 'no-src-square', i)),
            ];

            return {
              gallerySectionFound: !!galleryContent,
              noSrcSectionFound: !!noSrcContent,
              galleryThumbCount: galleryThumbs.length,
              rects,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            };
          },
          { galleryLabel: GALLERY_STRIP_LABEL, noSrcLabel: NO_SRC_LABEL },
        );

        cell.gallerySectionFound = measured.gallerySectionFound;
        cell.noSrcSectionFound = measured.noSrcSectionFound;
        cell.galleryThumbCount = measured.galleryThumbCount;
        cell.rects = measured.rects;
        cell.scrollWidth = measured.scrollWidth;
        cell.clientWidth = measured.clientWidth;
        cell.noHorizontalOverflow = measured.scrollWidth <= measured.clientWidth;

        if (!measured.gallerySectionFound || !measured.noSrcSectionFound || measured.galleryThumbCount !== 4) {
          cell.failReason = !measured.gallerySectionFound
            ? `gallery-strip section not found (label "${GALLERY_STRIP_LABEL}")`
            : !measured.noSrcSectionFound
              ? `no-src section not found (label "${NO_SRC_LABEL}")`
              : `expected 4 gallery-strip thumbs, found ${measured.galleryThumbCount}`;
          hardFail = true;
          failReasons.push(`width ${viewportWidth}: ${cell.failReason}`);
        } else {
          cell.perElement = measured.rects.map((r) => ({
            ...r,
            withinToleranceOf44:
              Math.abs(r.width - TARGET_PX) <= TOLERANCE_PX && Math.abs(r.height - TARGET_PX) <= TOLERANCE_PX,
          }));
          const badElements = cell.perElement.filter((r) => !r.withinToleranceOf44);
          cell.all44WithinTolerance = badElements.length === 0;

          for (const r of measured.rects) pooledWidths.push(r.width);

          if (!cell.all44WithinTolerance) {
            cell.failReason = `${badElements.length} element(s) not 44±${TOLERANCE_PX}px: ${badElements
              .map((r) => `${r.role}[${r.index}]=${r.width.toFixed(1)}x${r.height.toFixed(1)}`)
              .join(', ')}`;
            hardFail = true;
            failReasons.push(`width ${viewportWidth}: ${cell.failReason}`);
          }
          if (!cell.noHorizontalOverflow) {
            const reason = `horizontal overflow: scrollWidth ${measured.scrollWidth} > clientWidth ${measured.clientWidth}`;
            cell.failReason = cell.failReason ? `${cell.failReason}; ${reason}` : reason;
            hardFail = true;
            failReasons.push(`width ${viewportWidth}: ${reason}`);
          }
        }
      }
    } catch (err) {
      cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
      hardFail = true;
      failReasons.push(`width ${viewportWidth}: ${cell.failReason}`);
    } finally {
      await context.close();
    }

    result.widths.push(cell);
  }

  await browser.close();
  server.close();

  if (pooledWidths.length > 0) {
    const max = Math.max(...pooledWidths);
    const min = Math.min(...pooledWidths);
    result.crossWidth = { max, min, delta: max - min, sampleCount: pooledWidths.length };
    if (result.crossWidth.delta > TOLERANCE_PX) {
      hardFail = true;
      failReasons.push(
        `cross-width delta ${result.crossWidth.delta.toFixed(1)}px exceeds ${TOLERANCE_PX}px (max ${max}, min ${min}, pooled across every measured thumbnail at every width)`,
      );
    }
  } else {
    result.crossWidth = null;
  }

  result.hardFail = hardFail;
  result.failReasons = failReasons;

  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  if (hardFail) {
    console.error('\n❌ task813-appimage-thumb-probe: FAIL —');
    for (const reason of failReasons) console.error(`   - ${reason}`);
    process.exit(1);
  }
  console.log('\n✅ task813-appimage-thumb-probe: every thumbnail 44±1px, cross-width delta ≤1px, no overflow.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
