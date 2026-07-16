#!/usr/bin/env node
/**
 * task612-qa-listinggallery-lightbox-portal.mjs — Task 612 rendered evidence.
 *
 * Verifies, on the REAL `/[locale]/listings/[slug]` page driven by a live `next dev` server,
 * that the `ListingGallery` lightbox — once portaled to `document.body` — genuinely paints ABOVE
 * the site header (`.site-header`) and the sticky agent contact card (`.listing-contact` on
 * desktop / `.listing-mobile-cta` below `lg`), instead of being trapped behind them by an
 * ancestor stacking context.
 *
 * For each cell this checks:
 *   1. The `[role="dialog"]` lightbox node's parent is `document.body` (portal proof).
 *   2. `document.elementFromPoint()` sampled directly over the header AND the sticky contact
 *      surface resolves to the lightbox (or a descendant of it) while it is open — i.e. the
 *      scrim is genuinely the TOPMOST paint at that pixel, not the header/card showing through.
 *   3. No page horizontal overflow while the lightbox is open.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 SLUG=test-7-molyl9c8 MODE=after node scripts/task612-qa-listinggallery-lightbox-portal.mjs
 *   MODE=before ... captures the (bug-reproduction) pass — run only against a temporarily
 *   reverted (non-portaled) ListingGallery.tsx.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SLUG = process.env.SLUG ?? 'test-7-molyl9c8';
const MODE = process.env.MODE === 'before' ? 'before' : 'after';

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
const MANDATORY_SHOT = new Set(['320__uk', '375__uk', '390__uk', '1280__en']);

/* eslint-disable no-undef */
function evalLightboxStacking() {
  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (!dialog) return { dialogFound: false };

  // Mantine's Portal wraps content in nested divs before appending to document.body (not a
  // DIRECT child) — `closest('[data-portal]')` is the definitive portal-escape proof.
  const isBodyChild = document.body.contains(dialog) && !!dialog.closest('[data-portal]');
  const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;

  const header = document.querySelector('.site-header');
  const contactCard = document.querySelector('.listing-contact') || document.querySelector('.listing-mobile-cta');

  function topmostAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return { tag: el ? el.tagName : null, isDialogOrDescendant: !!(el && (el === dialog || dialog.contains(el))) };
  }

  const headerRect = header ? header.getBoundingClientRect() : null;
  const headerPoint = headerRect ? topmostAt(Math.max(1, headerRect.left + 10), Math.max(1, headerRect.top + headerRect.height / 2)) : null;

  const contactRect = contactCard ? contactCard.getBoundingClientRect() : null;
  const contactVisible = contactRect && contactRect.width > 0 && contactRect.height > 0
    && contactRect.top < window.innerHeight && contactRect.bottom > 0;
  const contactPoint = contactVisible
    ? topmostAt(contactRect.left + contactRect.width / 2, Math.max(1, Math.min(window.innerHeight - 1, contactRect.top + 10)))
    : null;

  return {
    dialogFound: true,
    isBodyChild,
    pageOverflow,
    headerFound: !!header,
    headerCoveredByDialog: headerPoint ? headerPoint.isDialogOrDescendant : null,
    contactCardFound: !!contactCard,
    contactCardVisibleInViewport: !!contactVisible,
    contactCardCoveredByDialog: contactPoint ? contactPoint.isDialogOrDescendant : null,
  };
}
/* eslint-enable no-undef */

async function main() {
  const { chromium } = await import('playwright');

  const outputDir = join(ROOT, 'docs', 'sessions', '2026-07-16-task612-assets');
  mkdirSync(outputDir, { recursive: true });

  console.log(`Task 612 — ListingGallery lightbox portal/stacking rendered evidence (MODE=${MODE})`);
  console.log(`    Target: ${BASE_URL}/[locale]/listings/${SLUG}`);
  console.log('');

  const browser = await chromium.launch();
  const matrix = [];

  for (const locale of LOCALES) {
    const url = `${BASE_URL}/${locale}/listings/${SLUG}`;
    const page = await browser.newPage();
    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      // 'load' not 'networkidle' — the dev server's HMR websocket keeps at least one connection
      // open indefinitely, so 'networkidle' would time out on every navigation.
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.listing-gallery', { timeout: 15000 });
    } catch (err) {
      for (const viewport of VIEWPORTS) {
        matrix.push({ locale, viewport: viewport.name, screenshot: null, data: null, pass: false, error: String(err).slice(0, 300) });
      }
      console.log(`  E ${locale} (page load) - ${String(err).slice(0, 200)}`);
      await page.close().catch(() => null);
      continue;
    }

    for (const viewport of VIEWPORTS) {
      const cellKey = `${viewport.name}__${locale}`;
      const isMandatoryShot = MANDATORY_SHOT.has(cellKey);
      const filename = `${MODE}__${locale}__${viewport.name}.png`;
      const screenshotPath = join(outputDir, filename);
      const cell = { locale, viewport: viewport.name, screenshot: isMandatoryShot ? filename : null, data: null, pass: null, error: null };

      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(200);

        // Open the lightbox — the gallery main image cover is always in the DOM at every
        // viewport (only visibility toggles via CSS), so a direct click works uniformly.
        const cover = page.locator('.listing-gallery .cursor-zoom-in').first();
        await cover.click({ timeout: 10000 });
        await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
        await page.waitForTimeout(150);

        const data = await page.evaluate(evalLightboxStacking);
        cell.data = data;
        cell.pass = data.dialogFound
          && data.isBodyChild
          && !data.pageOverflow
          && (data.headerFound ? data.headerCoveredByDialog : true)
          && (data.contactCardVisibleInViewport ? data.contactCardCoveredByDialog : true);

        if (isMandatoryShot) {
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }

        console.log(`  ${cell.pass ? '✓' : 'X'} ${locale} x ${viewport.name} bodyChild=${data.isBodyChild} headerCovered=${data.headerCoveredByDialog} contactVisible=${data.contactCardVisibleInViewport} contactCovered=${data.contactCardCoveredByDialog} pageOverflow=${data.pageOverflow}`);

        // Close for the next viewport in this page (Esc — matches real user closing behavior).
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      } catch (err) {
        cell.error = String(err).slice(0, 300);
        cell.pass = false;
        console.log(`  E ${locale} x ${viewport.name} - ${cell.error}`);
      }

      matrix.push(cell);
    }

    await page.close();
  }

  await browser.close();

  const manifestPath = join(outputDir, `manifest.${MODE}.json`);
  writeFileSync(manifestPath, JSON.stringify({ mode: MODE, baseUrl: BASE_URL, slug: SLUG, matrix }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Matrix results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: docs/sessions/2026-07-16-task612-assets/manifest.${MODE}.json`);

  process.exit(MODE === 'after' && failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
