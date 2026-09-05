#!/usr/bin/env node
/**
 * task787-clearance-live-evidence.mjs — Task 787 AC3/AC9 live-route evidence.
 *
 * Requires a running `next start` server (AC9's own control — a real request, never Storybook or
 * `next build` alone, per §3.4's Task 784 outage lesson). Measures the REAL `/sq` and
 * `/sq/listings` routes at 375px: `<main>`'s and the footer's own `padding-bottom`, and the total
 * document height, to prove the deleted mobile bottom bar's 56px clearance reservation is gone with
 * no unexplained dead space left behind (AC3).
 *
 * The "before" values are NOT re-derived from a second live server render of the pre-edit code
 * (Sonnet cannot run mutating Git to check out that state — single-writer rule, docs/ai-behavior.md
 * "Single-writer git"). They are instead the literal pre-edit source values this session read
 * directly (Read tool, not re-rendered): `src/app/[locale]/layout.tsx`'s
 * `pb={{ base: 'var(--homepage-runtime-space-14)', md: 0 }}` and
 * `FooterView.module.css`'s `.footer { padding-bottom: var(--homepage-runtime-space-14); }` with a
 * `@media (min-width:48rem){ .footer{ padding-bottom:0 } }` override — both resolving to exactly
 * 56px at <768px (--homepage-runtime-space-14 = 3.5rem = 56px, confirmed in globals.css both
 * pre- and post-edit). The git diff itself is the proof of removal; this script's job is to prove
 * the AFTER state has genuinely zero reservation and zero unexplained tail, not to re-render the
 * BEFORE state.
 *
 * Usage: node scripts/task787-clearance-live-evidence.mjs [--base-url http://localhost:3000]
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task787');

const args = process.argv.slice(2);
const baseUrlIdx = args.indexOf('--base-url');
const baseUrl = baseUrlIdx !== -1 && args[baseUrlIdx + 1] ? args[baseUrlIdx + 1] : 'http://localhost:3000';

const BEFORE_RESERVATION_PX = 56; // --homepage-runtime-space-14 = 3.5rem, cited above (not re-rendered)

async function measureRoute(page, path) {
  const url = `${baseUrl}${path}`;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(200);
  const measured = await page.evaluate(() => {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer.site-footer, footer');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const mainStyle = main ? getComputedStyle(main) : null;
    const footerStyle = footer ? getComputedStyle(footer) : null;
    return {
      documentScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      mainPaddingBottom: mainStyle ? mainStyle.paddingBottom : null,
      mainRect: main ? main.getBoundingClientRect().toJSON?.() ?? {
        top: main.getBoundingClientRect().top, bottom: main.getBoundingClientRect().bottom,
      } : null,
      footerPaddingBottom: footerStyle ? footerStyle.paddingBottom : null,
      footerRect: footer ? {
        top: footer.getBoundingClientRect().top, bottom: footer.getBoundingClientRect().bottom,
      } : null,
      bottomNavPresent: !!bottomNav,
      tailBelowFooter: footer ? document.documentElement.scrollHeight - (footer.getBoundingClientRect().bottom + window.scrollY) : null,
    };
  });
  return { path, httpStatus: response ? response.status() : null, measured };
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const page = await context.newPage();

  const results = { capturedAt: new Date().toISOString(), baseUrl, beforeReservationPx: BEFORE_RESERVATION_PX, routes: [] };
  let hardFail = false;

  for (const path of ['/sq', '/sq/listings']) {
    const r = await measureRoute(page, path);
    await page.screenshot({ path: join(EVIDENCE_DIR, `ac3-live-${path.replace(/\//g, '_')}.png`), fullPage: true }).catch(() => {});
    const pass = r.httpStatus === 200
      && !r.measured.bottomNavPresent
      && parseFloat(r.measured.mainPaddingBottom || '0') === 0
      && parseFloat(r.measured.footerPaddingBottom || '0') === 0
      && r.measured.tailBelowFooter !== null && Math.abs(r.measured.tailBelowFooter) < 2;
    if (!pass) hardFail = true;
    results.routes.push({ ...r, pass, deltaFromBeforePx: BEFORE_RESERVATION_PX - parseFloat(r.measured.mainPaddingBottom || '0') - parseFloat(r.measured.footerPaddingBottom || '0') });
    console.log(`${pass ? '✅' : '❌'} ${path}: httpStatus=${r.httpStatus} mainPb=${r.measured.mainPaddingBottom} footerPb=${r.measured.footerPaddingBottom} bottomNavPresent=${r.measured.bottomNavPresent} tailBelowFooter=${r.measured.tailBelowFooter}`);
  }

  await browser.close();

  const outPath = join(EVIDENCE_DIR, 'ac3-ac9-live-results.json');
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task787-clearance-live-evidence: one or more routes failed.');
    process.exit(1);
  }
  console.log('\n✅ task787-clearance-live-evidence: all routes clean — 0px reserved, 0 unexplained tail, delta == removed 56px reservation.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
