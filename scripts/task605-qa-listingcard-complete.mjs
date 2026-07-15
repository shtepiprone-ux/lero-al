#!/usr/bin/env node
/**
 * task605-qa-listingcard-complete.mjs — Task 605 rendered evidence.
 *
 * Verifies the rebuilt `MantineListingCardPattern` (single source of truth, Task 605) on the
 * REAL Next.js homepage + `/listings` Grid, driven by a live `next dev` server:
 *
 *  1. Content-completeness matrix: for every (route x locale x viewport) cell, confirms the
 *     real card renders a favorite button, a photo-count pill, and at least one badge/feature
 *     — i.e. the pattern is genuinely the complete card, not the Task-602 thin shell. No
 *     horizontal overflow at any cell.
 *  2. Real-page hover verification (absorbs Task 604): computed-style before/after of `.card`
 *     (boxShadow/transform) and its `img` (transform) on a REAL desktop pointer context
 *     (Playwright's default context — hasTouch:false, isMobile:false, i.e. genuinely
 *     `(hover:hover) and (pointer:fine)`), PLUS a coarse-pointer context (hasTouch:true,
 *     isMobile:true) proving the hover is correctly suppressed there (by design — a tap on a
 *     touch device must never leave a card "stuck" zoomed/elevated).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/task605-qa-listingcard-complete.mjs
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
function evalCardCompleteness() {
  const links = [...document.querySelectorAll('a.listing-card--vertical')];
  const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  if (links.length === 0) return { found: false, pageOverflow };

  const link = links[0];
  const favorite = link.querySelector('button[aria-pressed]');
  // Photo-count pill: the pattern's bottom-right overlay (Camera icon + number).
  const photoCountEl = [...link.querySelectorAll('div')].find(d => {
    const cls = (d.className || '').toString();
    return cls.includes('bottom-2') && cls.includes('right-2') && d.querySelector('svg');
  });
  const badgeEl = [...link.querySelectorAll('span')].find(s => {
    const cls = (s.className || '').toString();
    return cls.includes('rounded-4xl');
  });
  const typeLabelPresent = !!link.querySelector('p');
  // Copy-id button (footerActions node) — always has a `title` attribute (listing id); the
  // favorite button never does unless disabled/closed, so this is a specific-enough signal.
  const hasFooterActions = !!link.querySelector('button[title]');
  const featuresRow = [...link.querySelectorAll('div')].find(d => {
    const cls = (d.className || '').toString();
    return cls.includes('border-t') && cls.includes('pt-2');
  });

  return {
    found: true,
    pageOverflow,
    hasFavorite: !!favorite,
    hasPhotoCount: !!photoCountEl,
    photoCountText: photoCountEl ? photoCountEl.textContent.trim() : null,
    hasBadge: !!badgeEl,
    hasTypeLabel: typeLabelPresent,
    hasFooterActions,
    hasFeatures: !!featuresRow,
  };
}

async function evalHover(page) {
  const link = page.locator('a.listing-card--vertical').first();
  const count = await link.count();
  if (count === 0) return { found: false };

  const card = link.locator('> div').first();
  const img = card.locator('img').first();
  const hasImg = (await img.count()) > 0;

  const before = await card.evaluate((el) => {
    const s = getComputedStyle(el);
    return { boxShadow: s.boxShadow, transform: s.transform };
  });
  const beforeImg = hasImg ? await img.evaluate((el) => getComputedStyle(el).transform) : null;

  await link.hover();
  await page.waitForTimeout(400); // let the 300ms CSS transition settle

  const after = await card.evaluate((el) => {
    const s = getComputedStyle(el);
    return { boxShadow: s.boxShadow, transform: s.transform };
  });
  const afterImg = hasImg ? await img.evaluate((el) => getComputedStyle(el).transform) : null;

  return { found: true, before, after, beforeImg, afterImg, hoverFired: before.boxShadow !== after.boxShadow || before.transform !== after.transform };
}
/* eslint-enable no-undef */

async function main() {
  const { chromium } = await import('playwright');

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task605-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log('Task 605 — complete-card rendered evidence + real-page hover verification');
  console.log(`    Target: ${BASE_URL}`);
  console.log('');

  const browser = await chromium.launch();
  const matrix = [];

  // ── Part 1: content-completeness matrix ──────────────────────────────────
  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      for (const viewport of VIEWPORTS) {
        const url = `${BASE_URL}${route.path(locale)}`;
        const isMandatoryShot = (locale === 'uk' && MOBILE_NAMES.has(viewport.name)) || viewport.name === '2560';
        const filename = `${route.label.replace(/[^a-z0-9]+/gi, '-')}__${locale}__${viewport.name}.png`;
        const screenshotPath = join(outputDir, filename);

        const cell = { route: route.label, url, locale, viewport: viewport.name, screenshot: isMandatoryShot ? filename : null, data: null, pass: null, error: null };

        try {
          const page = await browser.newPage();
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
          await page.waitForTimeout(300);

          const data = await page.evaluate(evalCardCompleteness);
          cell.data = data;
          cell.pass = data.found && !data.pageOverflow && data.hasFavorite && data.hasPhotoCount && data.hasTypeLabel && data.hasFooterActions && data.hasFeatures;

          if (isMandatoryShot) {
            const link = page.locator('a.listing-card--vertical').first();
            await link.scrollIntoViewIfNeeded().catch(() => null);
            await page.waitForTimeout(150);
            await page.screenshot({ path: screenshotPath, fullPage: false });
          }
          await page.close();

          console.log(`  ${cell.pass ? '✓' : 'X'} ${route.label} x ${locale} x ${viewport.name} (favorite=${data.hasFavorite} photoCount=${data.hasPhotoCount}(${data.photoCountText}) features=${data.hasFeatures} footerActions=${data.hasFooterActions} badge=${data.hasBadge} overflow=${data.pageOverflow})`);
        } catch (err) {
          cell.error = String(err).slice(0, 300);
          cell.pass = false;
          console.log(`  E ${route.label} x ${locale} x ${viewport.name} - ${cell.error}`);
        }

        matrix.push(cell);
      }
    }
  }

  // ── Part 2: real-page hover verification (desktop pointer + coarse pointer) ──
  console.log('');
  console.log('Hover verification:');

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
  const desktopHover = await evalHover(desktopPage);
  console.log(`  Desktop pointer (hover:hover, pointer:fine): fired=${desktopHover.hoverFired}`);
  console.log(`    BEFORE: boxShadow=${desktopHover.before?.boxShadow} transform=${desktopHover.before?.transform}`);
  console.log(`    AFTER:  boxShadow=${desktopHover.after?.boxShadow} transform=${desktopHover.after?.transform}`);
  console.log(`    img BEFORE=${desktopHover.beforeImg} AFTER=${desktopHover.afterImg}`);
  await desktopPage.screenshot({ path: join(outputDir, 'hover_desktop_after.png') });
  await desktopContext.close();

  // Reduced-motion, same desktop pointer context.
  const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.emulateMedia({ reducedMotion: 'reduce' });
  await reducedPage.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
  await reducedPage.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
  const reducedHover = await evalHover(reducedPage);
  console.log(`  prefers-reduced-motion: reduce: transform stays none = ${reducedHover.after?.transform === 'none'}`);
  console.log(`    AFTER: transform=${reducedHover.after?.transform} img AFTER=${reducedHover.afterImg}`);
  await reducedContext.close();

  // Coarse pointer (touch/mobile emulation) — hover must be suppressed.
  const coarseContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const coarsePage = await coarseContext.newPage();
  await coarsePage.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
  await coarsePage.waitForSelector('a.listing-card--vertical', { timeout: 10000 }).catch(() => null);
  const coarseHover = await evalHover(coarsePage);
  console.log(`  Coarse pointer (touch, hasTouch:true/isMobile:true): fired=${coarseHover.hoverFired} (expected: false — suppressed by design)`);
  console.log(`    AFTER: boxShadow=${coarseHover.after?.boxShadow} transform=${coarseHover.after?.transform}`);
  await coarsePage.screenshot({ path: join(outputDir, 'hover_coarse_pointer.png') });
  await coarseContext.close();

  await browser.close();

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, baseUrl: BASE_URL, matrix, desktopHover, reducedHover, coarseHover }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Matrix results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: .screenshots/task605-qa/${timestamp}/manifest.json`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
