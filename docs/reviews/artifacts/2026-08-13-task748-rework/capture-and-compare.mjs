#!/usr/bin/env node
/**
 * Task 748 — AC2/AC9 rendered proof for the two real story-backed surfaces
 * (MantineListingGalleryPattern.tsx via `patterns-mantine-listinggallerypattern--default`,
 * LightboxView.tsx via `mantine-primitives-lightboxview--default`). §3.6 correction: the
 * kickoff's own table named `ListingGallery.tsx` as story-backed and
 * `MantineListingGalleryPattern.tsx` as story-less — measured false. The
 * `ListingGalleryPattern.stories.tsx` file imports and renders `MantineListingGalleryPattern`,
 * not the legacy `ListingGallery`; no story anywhere imports the legacy component (`grep -rn
 * "from '@/modules/listings/components/ListingGallery'" src/stories` → 0 hits). The tree wins;
 * this script measures the real two story-backed sites, not the kickoff's assumed pair.
 *
 * Method: a single build (this worktree's own `storybook-static`, already required for AC9's
 * rendered proof) — no separate "before" worktree/build. For each of the 3 real sites (2 in
 * MantineListingGalleryPattern, 1 in LightboxView), the script resolves the REAL migrated
 * element's CSS-Modules-hashed class, captures its live `getComputedStyle()`, and compares it
 * against a synthetic probe element injected into the SAME page carrying the EXACT ground-truth
 * declaration text extracted from the real `npm run build` output at I0
 * (`.screenshots/task748-overlay/final-build.txt` cross-checked against the I0 grep of
 * `.next/static/css`, both quoted in the session log). Both sides are evaluated by the same
 * browser engine on the same page load, so any serialization/rounding quirk cancels out — this
 * is a stronger comparison than a two-build live/live diff, not a weaker one, and it is possible
 * precisely because a synthetic probe using the ORIGINAL TAILWIND UTILITY CLASS NAME no longer
 * works post-migration (the utility is no longer a scanned candidate anywhere in `src/**`, so
 * Tailwind no longer generates it in this build) — the probe instead uses inline `style` set to
 * the literal ground-truth declaration text, which requires no Tailwind candidate at all.
 *
 * Usage: node capture-and-compare.mjs [--plant]
 *   --plant intentionally corrupts one expected value to prove the comparator can fail (AC2).
 */
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6493;
const PLANT = process.argv.includes('--plant');

const LOCALES = ['sq', 'en', 'uk', 'it'];
const VIEWPORTS = [320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560];

// Ground truth: exact declaration text from the real I0 `npm run build` output
// (`.next/static/css`), quoted verbatim in each *.module.css file's own header comment.
const SITES = [
  {
    key: 'photoCountBadge',
    storyId: 'patterns-mantine-listinggallerypattern--default',
    hashedName: 'photoCountBadge',
    props: [
      { cssProp: 'backgroundColor', decl: 'color-mix(in oklab, var(--overlay) 60%, transparent)' },
      { cssProp: 'color', decl: 'var(--overlay-foreground)' },
    ],
  },
  {
    key: 'extraCountOverlay',
    storyId: 'patterns-mantine-listinggallerypattern--default',
    hashedName: 'extraCountOverlay',
    props: [
      { cssProp: 'backgroundColor', decl: 'color-mix(in oklab, var(--overlay) 60%, transparent)' },
    ],
  },
  {
    key: 'counter',
    storyId: 'mantine-primitives-lightboxview--default',
    hashedName: 'counter',
    props: [
      { cssProp: 'color', decl: 'color-mix(in oklab, var(--overlay-foreground) 80%, transparent)' },
    ],
  },
];

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

async function resolveHashedClass(page, exactName) {
  const cssText = await page.evaluate(async () => {
    const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
    const texts = await Promise.all(hrefs.map(h => fetch(h).then(r => r.text()).catch(() => '')));
    const inlineStyles = [...document.querySelectorAll('style')].map(s => s.textContent || '');
    return texts.join('\n') + '\n' + inlineStyles.join('\n');
  });
  const re = new RegExp('([A-Za-z0-9_-]*_' + exactName + '_[a-z0-9]+_?\\d*)');
  const m = re.exec(cssText);
  return m ? m[1] : null;
}

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];
  let failCount = 0;

  try {
    for (const site of SITES) {
      for (const locale of LOCALES) {
        for (const viewport of VIEWPORTS) {
          const cellKey = `${site.key}|${locale}|${viewport}`;
          try {
            await page.setViewportSize({ width: viewport, height: 1200 });
            await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${site.storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
            await page.waitForSelector('body');

            if (site.storyId.includes('lightboxview')) {
              // No auto-play — open the multi-image lightbox via its trigger button (first Button on the page).
              const trigger = page.locator('button', { hasText: '' }).first();
              await page.locator('.mantine-Button-root').first().click();
              await page.waitForTimeout(350); // Modal open transition
            } else {
              await page.waitForTimeout(350); // play() click + Modal open transition
            }

            const hashedClass = await resolveHashedClass(page, site.hashedName);
            if (!hashedClass) { results.push({ cellKey, status: 'MISSING_CLASS' }); failCount++; continue; }

            const cellResult = await page.evaluate(({ hashedClass, props, plant }) => {
              const el = document.querySelector('.' + CSS.escape(hashedClass));
              if (!el) return { status: 'MISSING_ELEMENT' };
              const real = getComputedStyle(el);
              const out = { status: 'OK', props: {} };
              for (const { cssProp, decl } of props) {
                const realValue = real[cssProp];
                const probe = document.createElement('div');
                const plantedDecl = plant && cssProp === props[0].cssProp ? 'rgb(1, 2, 3)' : decl;
                probe.style.cssText = `${cssProp === 'backgroundColor' ? 'background-color' : cssProp === 'color' ? 'color' : cssProp}: ${plantedDecl};`;
                probe.style.position = 'fixed'; probe.style.top = '-9999px';
                document.body.appendChild(probe);
                const probeValue = getComputedStyle(probe)[cssProp];
                probe.remove();
                out.props[cssProp] = { real: realValue, expected: probeValue, match: realValue === probeValue };
              }
              return out;
            }, { hashedClass, props: site.props, plant: PLANT && site.key === 'photoCountBadge' && locale === 'en' && viewport === 320 });

            const cellFailed = cellResult.status !== 'OK' || Object.values(cellResult.props || {}).some(p => !p.match);
            if (cellFailed) failCount++;
            results.push({ cellKey, hashedClass, ...cellResult });
          } catch (e) {
            failCount++;
            results.push({ cellKey, status: 'ERROR', error: String(e) });
          }
        }
      }
    }
  } finally {
    await page.close();
    await browser.close();
    server.close();
  }

  const expectedCells = SITES.length * LOCALES.length * VIEWPORTS.length;
  const summary = { plant: PLANT, expectedCells, actualCells: results.length, failCount, results };
  const outPath = join(__dirname, PLANT ? 'capture-and-compare-PLANTED.json' : 'capture-and-compare-result.json');
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Cells: ${results.length}/${expectedCells}, failures: ${failCount}`);
  if (failCount > 0 || results.length !== expectedCells) {
    console.error('COMPARATOR: FAIL');
    process.exit(1);
  }
  console.log('COMPARATOR: PASS');
}

main().catch(e => { console.error(e); process.exit(1); });
