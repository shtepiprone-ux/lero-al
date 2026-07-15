#!/usr/bin/env node
/**
 * task603-qa-favoritebutton.mjs — Task 603 rendered evidence.
 *
 * Captures the REAL `ListingCard` vertical card (NOT the Storybook demo `ActionIcon`
 * favorite that slipped through Task 602's matrix) on a running `next dev` server,
 * proving the real `FavoriteButton` renders as a compact ~32px circle at every
 * breakpoint, including <640px, and never expands into a full-width pill.
 *
 * For each (route x locale x viewport) cell, finds every `button[aria-pressed]`
 * (the FavoriteButton's stable in-DOM signature — no test-id needed since
 * aria-pressed is unique to this control on the card) and asserts:
 *   - width and height are both <= 40px (compact circle, not a full-width pill)
 *   - width and height are within 4px of each other (circle, not stretched)
 *   - the button does not overlap the top-left badges or bottom-right photo-count
 *   - no horizontal page overflow
 *
 * Captures PNGs for the uk@320/375/390 mandatory cells + one 2560 cell.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/task603-qa-favoritebutton.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const VIEWPORTS = [
  { name: '320',  width:  320, height:  812 },
  { name: '375',  width:  375, height:  812 },
  { name: '390',  width:  390, height:  844 },
  { name: '768',  width:  768, height: 1024 },
  { name: '1280', width: 1280, height:  900 },
  { name: '1440', width: 1440, height:  900 },
  { name: '2560', width: 2560, height: 1440 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_NAMES = new Set(['320', '375', '390']);

const ROUTES = [
  { path: (l) => `/${l}`,          label: 'Homepage (Latest, vertical card)' },
  { path: (l) => `/${l}/listings`, label: 'Listings Grid' },
];

/* eslint-disable no-undef */
function evalFavoriteButtons() {
  const buttons = [...document.querySelectorAll('button[aria-pressed]')];
  const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;

  const results = buttons.slice(0, 6).map((btn) => {
    const rect = btn.getBoundingClientRect();
    // Nearest ancestor with position:relative/absolute that also contains the
    // top-left badge / bottom-right photo-count overlays (the AppImage wrapper).
    let card = btn.parentElement;
    while (card && !card.className?.toString().includes('relative')) card = card.parentElement;

    let overlapsBadge = false;
    let overlapsPhotoCount = false;
    if (card) {
      const badgeEls = [...card.querySelectorAll('.absolute.top-2.left-2, .absolute.top-2\\.left-2')];
      const photoCountEls = [...card.querySelectorAll('.absolute.bottom-2.right-2')];
      const intersects = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      overlapsBadge = badgeEls.some(el => intersects(rect, el.getBoundingClientRect()));
      overlapsPhotoCount = photoCountEls.some(el => intersects(rect, el.getBoundingClientRect()));
    }

    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      overlapsBadge,
      overlapsPhotoCount,
    };
  });

  return { count: buttons.length, results, pageOverflow };
}
/* eslint-enable no-undef */

async function main() {
  const { chromium } = await import('playwright');

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task603-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log('Task 603 — real FavoriteButton rendered-evidence capture');
  console.log(`    Target: ${BASE_URL}`);
  console.log(`    Routes: ${ROUTES.length} | Locales: ${LOCALES.length} | Viewports: ${VIEWPORTS.length}`);
  console.log(`    Output: .screenshots/task603-qa/${timestamp}/`);
  console.log('');

  const browser = await chromium.launch();
  const matrix = [];

  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      for (const viewport of VIEWPORTS) {
        const url = `${BASE_URL}${route.path(locale)}`;
        const isMandatoryShot = (locale === 'uk' && MOBILE_NAMES.has(viewport.name)) || viewport.name === '2560';
        const filename = `${route.label.replace(/[^a-z0-9]+/gi, '-')}__${locale}__${viewport.name}.png`;
        const screenshotPath = join(outputDir, filename);

        const cell = {
          route: route.label, url, locale, viewport: viewport.name,
          screenshot: isMandatoryShot ? filename : null,
          data: null, pass: null, error: null,
        };

        try {
          const page = await browser.newPage();
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForSelector('button[aria-pressed]', { timeout: 10000 }).catch(() => null);
          await page.waitForTimeout(300);

          const data = await page.evaluate(evalFavoriteButtons);
          cell.data = data;

          let pass = data.count > 0 && !data.pageOverflow;
          for (const r of data.results) {
            if (r.width > 40 || r.height > 40) pass = false;
            if (Math.abs(r.width - r.height) > 4) pass = false;
            if (r.overlapsBadge || r.overlapsPhotoCount) pass = false;
          }
          cell.pass = pass;

          if (isMandatoryShot) {
            const firstBtn = page.locator('button[aria-pressed]').first();
            await firstBtn.scrollIntoViewIfNeeded().catch(() => null);
            await page.waitForTimeout(150);
            await page.screenshot({ path: screenshotPath, fullPage: false });
          }
          await page.close();

          const first = data.results[0];
          const mark = pass ? '✓' : 'X';
          console.log(`  ${mark} ${route.label} x ${locale} x ${viewport.name} (n=${data.count}, first=${first ? `${first.width}x${first.height}` : 'none'})`);
        } catch (err) {
          cell.error = String(err).slice(0, 300);
          cell.pass = false;
          console.log(`  E ${route.label} x ${locale} x ${viewport.name} - ${cell.error}`);
        }

        matrix.push(cell);
      }
    }
  }

  await browser.close();

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, baseUrl: BASE_URL, matrix }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: .screenshots/task603-qa/${timestamp}/manifest.json`);
  console.log(`PNGs (uk@320/375/390 + 2560 only): .screenshots/task603-qa/${timestamp}/*.png`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
