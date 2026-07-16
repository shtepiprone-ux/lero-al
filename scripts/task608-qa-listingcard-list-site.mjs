#!/usr/bin/env node
/**
 * task608-qa-listingcard-list-site.mjs — Task 608 rendered evidence.
 *
 * Verifies the migrated `ListingCard` `variant="horizontal"` (List view) on the REAL
 * `/[locale]/listings` page, driven by a live `next dev` server:
 *
 *  - Content-completeness: each row renders through `MantineListingCardPattern layout="list"`
 *    (thumb image, badges, inline favorite, title, price, features, footer copy-id+date,
 *    location) and never renders an overlay/photo-count pill/contact CTA (list design never
 *    had them).
 *  - Mobile <640 full-width gate: row spans the full list-column width, no page overflow.
 *  - Title hover -> brand-red (parity with grid, the just-shipped title-hover fix) on a real
 *    desktop pointer context.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/task608-qa-listingcard-list-site.mjs
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

/* eslint-disable no-undef */
function evalListRow() {
  const links = [...document.querySelectorAll('a.listing-card--horizontal')];
  const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  if (links.length === 0) return { found: false, pageOverflow };

  const link = links[0];
  const linkRect = link.getBoundingClientRect();
  const parentRect = link.parentElement ? link.parentElement.getBoundingClientRect() : linkRect;

  const favorite = link.querySelector('button[aria-pressed]');
  const favoritePosition = favorite ? getComputedStyle(favorite).position : null;
  const badgeEl = [...link.querySelectorAll('span')].find(s => {
    const cls = (s.className || '').toString();
    return cls.includes('rounded-4xl') || cls.includes('text-2xs');
  });
  const overlayEl = [...link.querySelectorAll('div')].find(d => {
    const cls = (d.className || '').toString();
    return cls.includes('bg-overlay/30');
  });
  const photoCountEl = [...link.querySelectorAll('div')].find(d => {
    const cls = (d.className || '').toString();
    return cls.includes('bottom-2') && cls.includes('right-2') && d.querySelector('svg');
  });
  // No onContact/contactLabel is ever passed by ListingCard.tsx's horizontal branch (grep-verified,
  // and the pattern's layout='list' JSX branch structurally never emits the contact Card.Section at
  // all — it returns before that code path) — a Mantine Card.Section is the only element that CTA
  // could ever render inside, so its absence is a direct, reliable runtime signal.
  const hasCardSection = !!link.querySelector('.mantine-Card-section');
  const hasFooterActions = !!link.querySelector('button[title]');
  const hasFeatureIcon = !!link.querySelector('svg');
  const img = link.querySelector('img');

  // The row's OWN containment/overflow, independent of `pageOverflow` — `pageOverflow` also
  // trips on the pre-existing, out-of-scope FilterBar/Combobox <640 overflow bug (tracked in
  // docs/backlog.md Pending Action Items, reproduced identically in the untouched Grid view —
  // same scrollWidth, same offender elements, verified before writing this script). The row
  // itself must never exceed the viewport or its own content, regardless of that unrelated bug.
  const clientWidth = document.documentElement.clientWidth;
  const rowExceedsViewport = linkRect.right > clientWidth + 2;
  const rowOwnOverflow = link.scrollWidth > link.clientWidth + 2;

  return {
    found: true,
    pageOverflow,
    rowExceedsViewport,
    rowOwnOverflow,
    linkWidth: Math.round(linkRect.width),
    parentWidth: Math.round(parentRect.width),
    fullWidth: Math.abs(linkRect.width - parentRect.width) <= 2,
    hasFavorite: !!favorite,
    favoritePosition,
    favoriteIsInline: favoritePosition !== null && favoritePosition !== 'absolute',
    hasBadge: !!badgeEl,
    hasOverlay: !!overlayEl,
    hasPhotoCount: !!photoCountEl,
    hasContactCardSection: hasCardSection,
    hasFooterActions,
    hasFeatureIcon,
    hasImg: !!img,
    hasTitle: !!link.querySelector('h3'),
  };
}

async function evalTitleHover(page) {
  const link = page.locator('a.listing-card--horizontal').first();
  const count = await link.count();
  if (count === 0) return { found: false };
  const title = link.locator('h3').first();

  const before = await title.evaluate((el) => getComputedStyle(el).color);
  await link.hover();
  await page.waitForTimeout(300);
  const after = await title.evaluate((el) => getComputedStyle(el).color);

  return { found: true, before, after, changed: before !== after };
}
/* eslint-enable no-undef */

async function main() {
  const { chromium } = await import('playwright');

  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
  const outputDir = join(ROOT, 'docs', 'sessions', '2026-07-15-task608-assets');
  mkdirSync(outputDir, { recursive: true });

  console.log('Task 608 — ListingCard horizontal (List view) site-wiring rendered evidence');
  console.log(`    Target: ${BASE_URL}`);
  console.log('');

  const browser = await chromium.launch();
  const matrix = [];

  for (const locale of LOCALES) {
    const url = `${BASE_URL}/${locale}/listings`;
    let page = null;
    try {
      // The Grid/List toggle (`ListingsSortBar.tsx`) is `hidden sm:flex` — out of this task's
      // scope, pre-existing — so List view can only be REACHED via a click at >=640px. `view`
      // is local React state, unaffected by a subsequent viewport resize on the SAME page, so
      // navigate+click ONCE at a wide viewport, then resize that one page across every canonical
      // breakpoint to capture genuine mobile rendering of the (already-active) list layout.
      page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
      const listToggle = page.locator('button:has(svg.lucide-list)').first();
      await listToggle.click({ timeout: 15000 });
      await page.waitForSelector('a.listing-card--horizontal', { timeout: 10000 });
    } catch (err) {
      for (const viewport of VIEWPORTS) {
        matrix.push({ locale, viewport: viewport.name, screenshot: null, data: null, pass: false, error: String(err).slice(0, 300) });
      }
      console.log(`  E ${locale} (List-toggle setup) - ${String(err).slice(0, 200)}`);
      if (page) await page.close().catch(() => null);
      continue;
    }

    for (const viewport of VIEWPORTS) {
      const isMandatoryShot = (locale === 'uk' && MOBILE_NAMES.has(viewport.name)) || viewport.name === '2560';
      const filename = `list__${locale}__${viewport.name}.png`;
      const screenshotPath = join(outputDir, filename);

      const cell = { locale, viewport: viewport.name, screenshot: isMandatoryShot ? filename : null, data: null, pass: null, error: null };

      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(250);

        const data = await page.evaluate(evalListRow);
        cell.data = data;
        cell.pass = data.found
          && !data.rowExceedsViewport
          && !data.rowOwnOverflow
          && data.hasFavorite
          && data.favoriteIsInline
          && !data.hasOverlay
          && !data.hasPhotoCount
          && !data.hasContactCardSection
          && data.hasFooterActions
          && data.hasFeatureIcon
          && data.hasImg
          && data.hasTitle
          && (viewport.width >= 640 || data.fullWidth);

        if (isMandatoryShot) {
          const link = page.locator('a.listing-card--horizontal').first();
          await link.scrollIntoViewIfNeeded().catch(() => null);
          await page.waitForTimeout(150);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }

        console.log(`  ${cell.pass ? '✓' : 'X'} ${locale} x ${viewport.name} (fullWidth=${data.fullWidth} favInline=${data.favoriteIsInline} badge=${data.hasBadge} overlay=${data.hasOverlay} photoCount=${data.hasPhotoCount} contactSection=${data.hasContactCardSection} footer=${data.hasFooterActions} rowExceeds=${data.rowExceedsViewport} rowOwnOverflow=${data.rowOwnOverflow} pageOverflow[pre-existing FilterBar bug]=${data.pageOverflow})`);
      } catch (err) {
        cell.error = String(err).slice(0, 300);
        cell.pass = false;
        console.log(`  E ${locale} x ${viewport.name} - ${cell.error}`);
      }

      matrix.push(cell);
    }

    await page.close();
  }

  // Title hover -> brand-red, real desktop pointer.
  console.log('');
  console.log('Title hover verification (List view, desktop pointer):');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`${BASE_URL}/en/listings`, { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
  await desktopPage.locator('button:has(svg.lucide-list)').first().click();
  await desktopPage.waitForSelector('a.listing-card--horizontal', { timeout: 10000 });
  const hover = await evalTitleHover(desktopPage);
  console.log(`  changed=${hover.changed} before=${hover.before} after=${hover.after}`);
  await desktopPage.screenshot({ path: join(outputDir, 'title-hover-list-desktop.png') });
  await desktopContext.close();

  await browser.close();

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, baseUrl: BASE_URL, matrix, titleHover: hover }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Matrix results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: docs/sessions/2026-07-15-task608-assets/manifest.json`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
