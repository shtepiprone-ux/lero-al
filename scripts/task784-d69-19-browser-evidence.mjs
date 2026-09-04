#!/usr/bin/env node
/**
 * task784-d69-19-browser-evidence.mjs — Task 784 Revision 4 (D69-19) §14/I2 real-browser evidence.
 *
 * Every "expected" numeric/string value below is extracted at run time from the ACTUAL
 * `src/design-system/mantine/theme.ts` source text via a targeted regex (see `readThemeValue`/
 * `readThemeArray` below) — never a literal copied into this script. This keeps `theme.ts` the
 * sole value authority, per the kickoff's I1/I2 instruction ("Expected dimensions must be
 * obtained at runtime from the named theme contract, never copied into test code").
 *
 * Serves `storybook-static` on an OS-assigned port (same static-file-server shape as
 * `check-stories-rendered.mjs`/`task770-storybook-capture.mjs`), drives real Chromium via
 * Playwright against each of the 8 owner families in the kickoff's §14/I2 evidence matrix, and
 * writes one JSON result file + one screenshot per check to
 * `docs/sessions/evidence/task784/d69-19-browser/`.
 *
 * Usage: node scripts/task784-d69-19-browser-evidence.mjs [--dir <storybook-static-dir>]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task784/d69-19-browser');
const THEME_PATH = join(ROOT, 'src/design-system/mantine/theme.ts');

const args = process.argv.slice(2);
const dirFlagIdx = args.indexOf('--dir');
const storybookStaticDir = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? resolve(process.cwd(), args[dirFlagIdx + 1])
  : join(ROOT, 'storybook-static');

// ── Read D69-18 expected values from the ACTUAL theme.ts source (never hardcoded here) ────────
const themeSrc = readFileSync(THEME_PATH, 'utf8');

function readThemeValue(pattern, label) {
  const m = themeSrc.match(pattern);
  if (!m) throw new Error(`task784-d69-19-browser-evidence: could not find ${label} in theme.ts`);
  return m[1];
}

const EXPECTED = {
  listingContactStickyOffsetPx: Number(readThemeValue(/listingContactStickyOffset:\s*(\d+)/, 'layout.listingContactStickyOffset')),
  tooltipInlinePaddingRem: readThemeValue(/inlinePadding:\s*'([\d.]+rem)'/, 'tooltip.inlinePadding'),
  tooltipMultilineWidthRem: readThemeValue(/multilineWidth:\s*'([\d.]+rem)'/, 'tooltip.multilineWidth'),
  authFormMaxWidthPx: Number(readThemeValue(/authFormMaxWidth:\s*(\d+)/, 'layout.authFormMaxWidth')),
  emptyStateMinBlockSizePx: Number(readThemeValue(/emptyStateMinBlockSize:\s*(\d+)/, 'layout.emptyStateMinBlockSize')),
  footerGridGapPx: Number(readThemeValue(/footerGridGap:\s*(\d+)/, 'layout.footerGridGap')),
  dragHandleWidthRem: readThemeValue(/dragHandle:\s*\{\s*\n\s*width:\s*'([\d.]+rem)'/, 'overlay.dragHandle.width'),
  dragHandleHeightRem: readThemeValue(/height:\s*'([\d.]+rem)',\s*\/\/\s*4px/, 'overlay.dragHandle.height'),
  breakpointLgEm: readThemeValue(/lg:\s*'([\d.]+em)',\s*\/\/\s*1024px/, 'breakpoints.lg'),
  breakpointXs2Em: readThemeValue(/xs2:\s*'([\d.]+em)',\s*\/\/\s*480px/, 'breakpoints.xs2'),
  breakpointMdEm: readThemeValue(/md:\s*'([\d.]+em)',\s*\/\/\s*768px/, 'breakpoints.md'),
  breakpointXlEm: readThemeValue(/xl:\s*'([\d.]+em)',\s*\/\/\s*1280px/, 'breakpoints.xl'),
};

// rem → px at the project's fixed 16px root (documented convention throughout theme.ts's own
// "px→em reference" comments — not invented here).
const remToPx = (remStr) => Math.round(parseFloat(remStr) * 16);

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir) {
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
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

async function gotoStory(page, baseUrl, storyId, { locale } = {}) {
  const globals = locale ? `&globals=locale:${locale}` : '';
  const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story${globals}`;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const readiness = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
    if (!root) return { ok: false, reason: 'expected Storybook root is absent' };
    const rect = root.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return { ok: false, reason: `root has zero rect (${rect.width}x${rect.height})` };
    return { ok: true };
  });
  return { ok: !!response?.ok() && readiness.ok, httpStatus: response ? response.status() : null, readiness };
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  if (!existsSync(join(storybookStaticDir, 'index.json'))) {
    console.error(`❌ missing ${join(storybookStaticDir, 'index.json')} — run "npm run build-storybook" first.`);
    process.exit(1);
  }

  const server = await startStaticServer(storybookStaticDir);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  const results = { capturedAt: new Date().toISOString(), storybookStaticDir, expected: EXPECTED, checks: [] };
  let hardFail = false;

  const record = (name, data) => {
    results.checks.push({ name, ...data });
    if (data.pass === false) hardFail = true;
    console.log(`${data.pass === false ? '❌' : '✅'} ${name}: ${JSON.stringify(data)}`);
  };

  try {
    // ── 1. Listing contact — sticky at desktop, normal flow below it ─────────────────────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default');
      if (!nav.ok) {
        record('listing-contact-desktop-sticky', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(150);
        const style = await page.evaluate(() => {
          const papers = Array.from(document.querySelectorAll('.mantine-Paper-root'));
          const el = papers[papers.length - 1];
          if (!el) return null;
          const cs = getComputedStyle(el);
          return { position: cs.position, top: cs.top, rect: el.getBoundingClientRect() };
        });
        const expectedTopPx = EXPECTED.listingContactStickyOffsetPx;
        const pass = !!style && style.position === 'sticky' && Math.round(parseFloat(style.top)) === expectedTopPx;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'listing-contact-desktop.png'), fullPage: false });
        record('listing-contact-desktop-sticky', { pass, style, expectedTopPx });
      }
      await context.close();
    }
    {
      const context = await browser.newContext({ viewport: { width: 768, height: 800 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default');
      if (!nav.ok) {
        record('listing-contact-below-lg-normal-flow', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const style = await page.evaluate(() => {
          const papers = Array.from(document.querySelectorAll('.mantine-Paper-root'));
          const el = papers[papers.length - 1];
          if (!el) return null;
          return { position: getComputedStyle(el).position };
        });
        const pass = !!style && style.position !== 'sticky';
        await page.screenshot({ path: join(EVIDENCE_DIR, 'listing-contact-tablet.png'), fullPage: false });
        record('listing-contact-below-lg-normal-flow', { pass, style, note: '768px is < breakpoints.lg (1024px) — sticky must not apply here' });
      }
      await context.close();
    }

    // ── 2. Tooltip — long-uk label, computed padding + wrap width ─────────────────────────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'mantine-primitives-tooltip--default', { locale: 'uk' });
      if (!nav.ok) {
        record('tooltip-long-uk-label', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        // Second Tooltip section's trigger — same aria-label as the first, so index by DOM order.
        const buttons = await page.$$('button[aria-label]');
        const secondTrigger = buttons[1];
        if (!secondTrigger) {
          record('tooltip-long-uk-label', { pass: false, failReason: `expected ≥2 aria-labelled trigger buttons, found ${buttons.length}` });
        } else {
          await secondTrigger.hover();
          await page.waitForTimeout(300);
          const tooltipStyle = await page.evaluate(() => {
            const tip = document.querySelector('[role="tooltip"]');
            if (!tip) return null;
            const cs = getComputedStyle(tip);
            return { paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, maxWidth: cs.maxWidth, width: cs.width, whiteSpace: cs.whiteSpace };
          });
          const expectedPaddingPx = remToPx(EXPECTED.tooltipInlinePaddingRem);
          const expectedMaxWidthPx = remToPx(EXPECTED.tooltipMultilineWidthRem);
          const pass = !!tooltipStyle
            && Math.round(parseFloat(tooltipStyle.paddingLeft)) === expectedPaddingPx
            && Math.round(parseFloat(tooltipStyle.paddingRight)) === expectedPaddingPx
            && Math.round(parseFloat(tooltipStyle.maxWidth)) <= expectedMaxWidthPx;
          await page.screenshot({ path: join(EVIDENCE_DIR, 'tooltip-long-uk-label.png'), fullPage: false });
          record('tooltip-long-uk-label', { pass, tooltipStyle, expectedPaddingPx, expectedMaxWidthPx });
        }
      }
      await context.close();
    }

    // ── 3. Listing skeletons — non-zero media height, per-line geometry ───────────────────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-homepagelistinggrids--loading');
      if (!nav.ok) {
        record('listing-skeletons-loading', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const skeletons = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('[class*="skeleton"]'));
          return els.length;
        });
        const mediaRect = await page.evaluate(() => {
          const el = document.querySelector('[class*="mantine-AspectRatio-root"]');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { width: r.width, height: r.height };
        });
        const pass = !!mediaRect && mediaRect.height > 0 && mediaRect.width > 0 && skeletons > 0;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'listing-skeletons.png'), fullPage: true });
        record('listing-skeletons-loading', { pass, mediaRect, skeletonElementCount: skeletons });
      }
      await context.close();
    }

    // ── 4. Auth / centered states — desktop cap + mobile full-width, min-block-size ───────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-authformpattern--default');
      if (!nav.ok) {
        record('auth-desktop-max-width', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const width = await page.evaluate(() => {
          const paper = document.querySelector('.mantine-Paper-root');
          return paper ? paper.getBoundingClientRect().width : null;
        });
        const pass = typeof width === 'number' && Math.round(width) <= EXPECTED.authFormMaxWidthPx;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'auth-desktop.png'), fullPage: false });
        record('auth-desktop-max-width', { pass, renderedWidth: width, expectedMaxWidthPx: EXPECTED.authFormMaxWidthPx });
      }
      await context.close();
    }
    {
      const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-authformpattern--default');
      if (!nav.ok) {
        record('auth-mobile-full-width', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const width = await page.evaluate(() => {
          const paper = document.querySelector('.mantine-Paper-root');
          return paper ? paper.getBoundingClientRect().width : null;
        });
        // Full-width on mobile means the Paper is NOT capped near authFormMaxWidth (400px) despite
        // the viewport being far narrower than desktop — the exact rendered width depends on the
        // story's own nested padding (Stack p="md" + Center p="xl"), so this checks "not capped
        // near desktop's value," not an exact pixel target.
        const pass = typeof width === 'number' && width > 200 && width < EXPECTED.authFormMaxWidthPx;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'auth-mobile.png'), fullPage: false });
        record('auth-mobile-full-width', { pass, renderedWidth: width });
      }
      await context.close();
    }
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-emptyloadingerrorstate--default');
      if (!nav.ok) {
        record('empty-loading-error-min-block-size', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const heights = await page.evaluate(() => {
          const centers = Array.from(document.querySelectorAll('.mantine-Center-root'));
          return centers.map((el) => Math.round(el.getBoundingClientRect().height));
        });
        const pass = heights.length > 0 && heights.every((h) => h >= EXPECTED.emptyStateMinBlockSizePx);
        await page.screenshot({ path: join(EVIDENCE_DIR, 'empty-loading-error.png'), fullPage: true });
        record('empty-loading-error-min-block-size', { pass, heights, expectedMinPx: EXPECTED.emptyStateMinBlockSizePx });
      }
      await context.close();
    }

    // ── 5. Footer — grid gap at supported widths ───────────────────────────────────────────────
    for (const width of [375, 768, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'mantine-primitives-footerview--default');
      if (!nav.ok) {
        record(`footer-grid-gap-${width}`, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const gap = await page.evaluate(() => {
          const grid = document.querySelector('.mantine-SimpleGrid-root');
          if (!grid) return null;
          const cs = getComputedStyle(grid);
          return { columnGap: cs.columnGap, rowGap: cs.rowGap };
        });
        const pass = !!gap
          && Math.round(parseFloat(gap.columnGap)) === EXPECTED.footerGridGapPx
          && Math.round(parseFloat(gap.rowGap)) === EXPECTED.footerGridGapPx;
        if (width === 1280) await page.screenshot({ path: join(EVIDENCE_DIR, 'footer-desktop.png'), fullPage: true });
        record(`footer-grid-gap-${width}`, { pass, gap, expectedPx: EXPECTED.footerGridGapPx });
      }
      await context.close();
    }

    // ── 6. Drawer and bottom sheet — shared handle geometry + interaction ─────────────────────
    for (const [name, storyId] of [
      ['dialog-drawer-pattern', 'patterns-mantine-dialogdrawerpattern--default'],
      ['dropdown-menu', 'mantine-primitives-dropdownmenu--default'],
    ]) {
      const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, storyId);
      if (!nav.ok) {
        record(`overlay-${name}-drag-handle`, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        // Scope to the Storybook preview root — an unscoped `button` locator can match Storybook's
        // own chrome (not present in iframe.html, but scoping is the correct, robust practice).
        const trigger = page.locator('#storybook-root button, #root button').first();
        await trigger.waitFor({ state: 'visible', timeout: 10000 });
        await trigger.click();
        await page.waitForTimeout(300);
        const handle = await page.evaluate(() => {
          // The drag handle is the small pill Box inside the Drawer title area — locate it as the
          // only element whose computed width/height match a small (<80px) fixed rem-derived box
          // directly under the drawer title/header, not by a project-added test id.
          const header = document.querySelector('.mantine-Drawer-header, .mantine-Modal-header');
          if (!header) return { found: false };
          const candidates = Array.from(header.querySelectorAll('div'));
          for (const el of candidates) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && r.width < 80 && r.height < 20) {
              const cs = getComputedStyle(el);
              return { found: true, width: r.width, height: r.height, borderRadius: cs.borderRadius };
            }
          }
          return { found: false };
        });
        const expectedWidthPx = remToPx(EXPECTED.dragHandleWidthRem);
        const expectedHeightPx = remToPx(EXPECTED.dragHandleHeightRem);
        const pass = handle.found && Math.round(handle.width) === expectedWidthPx && Math.round(handle.height) === expectedHeightPx;
        await page.screenshot({ path: join(EVIDENCE_DIR, `overlay-${name}-open.png`), fullPage: false });
        // Close via Escape — interaction contract proof. Mantine's Drawer close transition needs
        // more than 200ms to fully unmount the header (measured: 500ms is reliably sufficient,
        // 200ms was not — a script timing bug, not a product regression).
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        const stillOpen = await page.evaluate(() => !!document.querySelector('.mantine-Drawer-header, .mantine-Modal-header'));
        record(`overlay-${name}-drag-handle`, { pass: pass && !stillOpen, handle, expectedWidthPx, expectedHeightPx, closedOnEscape: !stillOpen });
      }
      await context.close();
    }

    // ── 7. Pagination probe — real getBoundingClientRect measurability (jsdom cannot do this) ──
    {
      const context = await browser.newContext({ viewport: { width: 375, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'mantine-primitives-pagination--default');
      if (!nav.ok) {
        record('pagination-hidden-probe', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.waitForTimeout(300); // mounted-gated probe (useEffect)
        const probe = await page.evaluate(() => {
          const el = document.querySelector('[aria-hidden="true"][tabindex="-1"]');
          if (!el) return { found: false };
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            found: true,
            rect: { width: r.width, height: r.height },
            visibility: cs.visibility,
            pointerEvents: cs.pointerEvents,
            position: cs.position,
            hasLeftTopStyle: el.style.left !== '' || el.style.top !== '',
          };
        });
        const pass = probe.found && probe.rect.width > 0 && probe.visibility === 'hidden'
          && probe.pointerEvents === 'none' && probe.position === 'fixed' && !probe.hasLeftTopStyle;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'pagination-narrow.png'), fullPage: false });
        record('pagination-hidden-probe', { pass, probe });
      }
      await context.close();
    }

    // ── 8. Filters and count button — unchanged, source-faithful; readiness + screenshot only ─
    for (const [name, storyId] of [
      ['filter-controls', 'mantine-primitives-filtercontrols--default'],
      ['count-button', 'mantine-primitives-countbutton--default'],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, storyId);
      await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: true }).catch(() => {});
      record(`${name}-renders`, { pass: nav.ok, nav });
      await context.close();
    }

    // ── 9. Listing contact — Call/WhatsApp + Send-message/Share row direction gate ────────────
    // (D69-21 R13 established the base/lg gate; D69-22 (owner instruction) replaced it with a
    // piecewise gate — row from xs2 (480px, full-width stacked panel), back to column at md
    // (768px, the panel narrows to a Grid sidebar there), row again from xl (1280px, sidebar wide
    // enough). All four gate values are read from theme.ts at run time — never hardcoded. Both
    // Flex rows (Call/WhatsApp and, since D69-24, Send-message/Share) share this exact gate.
    const xs2Px = remToPx(EXPECTED.breakpointXs2Em);
    const mdPx = remToPx(EXPECTED.breakpointMdEm);
    const xlPx = remToPx(EXPECTED.breakpointXlEm);
    function expectedCtaDirection(width) {
      if (width >= xlPx) return 'row';
      if (width >= mdPx) return 'column';
      if (width >= xs2Px) return 'row';
      return 'column';
    }
    for (const width of [375, 479, 480, 720, 767, 768, 1023, 1024, 1280]) {
      const expectedDirection = expectedCtaDirection(width);
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default');
      const name = `cta-row-direction-${width}`;
      if (!nav.ok) {
        record(name, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const [callDirection, shareDirection] = await page.evaluate(() => {
          const flexes = Array.from(document.querySelectorAll('.mantine-Flex-root'));
          return [flexes[0], flexes[1]].map((el) => el ? getComputedStyle(el).flexDirection : null);
        });
        const pass = callDirection === expectedDirection && shareDirection === expectedDirection;
        record(name, { pass, callDirection, shareDirection, expectedDirection, xs2Px, mdPx, xlPx });
      }
      await context.close();
    }

    // ── 10. Listing contact — CTA label no mid-word break at row widths, longest locales ──────
    // Checks the Call/WhatsApp row only — each label is a single unbreakable word, so any wrap is
    // necessarily mid-word (the real defect class D69-21 found). The Send-message/Share row is
    // deliberately excluded: "Send message" is multi-word in every locale, so it wraps cleanly
    // between words at some widths (confirmed visually, not a defect) — a same-shaped single-line
    // assertion would false-flag that benign wrap.
    for (const locale of ['it', 'uk']) {
      for (const width of [1024, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default', { locale });
        const name = `cta-row-label-single-line-${locale}-${width}`;
        if (!nav.ok) {
          record(name, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
        } else {
          const spans = await page.evaluate(() => {
            // Index 0 = Call/WhatsApp row (checked here); index 1 = Send-message/Share row
            // (deliberately not checked for single-line — see this block's header comment).
            const el = document.querySelectorAll('.mantine-Flex-root')[0];
            if (!el) return null;
            // Each button nests Mantine's own inner/label wrapper spans around our custom
            // `<span style={{minWidth:0,display:'block'}}>{label}</span>` — the innermost one,
            // i.e. the LAST span per button in DOM order, is the one that actually wraps text.
            const buttons = Array.from(el.querySelectorAll('button'));
            return buttons.map((btn) => {
              const btnSpans = Array.from(btn.querySelectorAll('span'));
              const span = btnSpans[btnSpans.length - 1];
              if (!span) return { text: null, height: null, lineHeight: null };
              const cs = getComputedStyle(span);
              const rect = span.getBoundingClientRect();
              return { text: span.textContent, height: rect.height, lineHeight: parseFloat(cs.lineHeight) };
            });
          });
          const pass = !!spans && spans.length > 0
            && spans.every((s) => Math.abs(s.height - s.lineHeight) <= 2);
          await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false });
          record(name, { pass, spans });
        }
        await context.close();
      }
    }

    // ── 11. ListingDetailPattern — Grid stack/sidebar boundary (D69-21) ───────────────────────
    // Gate value read from EXPECTED.breakpointMdEm. Below md the two Grid.Col's stack (contact
    // panel below content); at/above md they sit side by side (panel becomes a sidebar).
    for (const width of [767, 768]) {
      const expectedStacked = width < mdPx;
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default');
      const name = `grid-stack-boundary-${width}`;
      if (!nav.ok) {
        record(name, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.waitForTimeout(200);
        const rects = await page.evaluate(() => {
          const cols = Array.from(document.querySelectorAll('.mantine-Grid-col'));
          return cols.map((c) => c.getBoundingClientRect());
        });
        const stacked = rects.length === 2 && rects[1].top >= rects[0].top + rects[0].height - 5;
        const pass = stacked === expectedStacked;
        record(name, { pass, stacked, expectedStacked, mdPx });
      }
      await context.close();
    }

    // ── 12. ListingDetailPattern — favorite always in the badges row, right-edge aligned ──────
    // (D69-25, owner instruction, supersedes D69-23's viewport split.) One instance, always
    // visible, at every tested breakpoint; its right edge must match the content column's own
    // right edge — the same edge the gallery image and description/amenities cards align to —
    // not the full viewport's right edge (which would be wrong once the sidebar appears at md+).
    for (const width of [375, 767, 768, 1024, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingdetailpattern--default');
      const name = `favorite-placement-${width}`;
      if (!nav.ok) {
        record(name, { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.waitForTimeout(200);
        const measured = await page.evaluate(() => {
          const heart = document.querySelector('.mantine-ActionIcon-root[aria-label]');
          // The gallery image sits in the same content column and shares its right edge — a
          // stable reference that doesn't depend on Grid.Col internals.
          const galleryImg = document.querySelector('img');
          if (!heart || !galleryImg) return null;
          const heartRect = heart.getBoundingClientRect();
          const contentRect = galleryImg.getBoundingClientRect();
          // D69-27: the badge row and the favorite must share a centre line. Measure the badge
          // GROUP (not one Badge) so the 320px two-row wrap case is covered too.
          const badge = document.querySelector('.mantine-Badge-root');
          const badgeGroup = badge ? badge.parentElement : null;
          const badgeRect = badgeGroup ? badgeGroup.getBoundingClientRect() : null;
          return {
            visible: heartRect.width > 0 && heartRect.height > 0,
            heartRight: heartRect.right,
            contentRight: contentRect.right,
            heartCentreY: heartRect.top + heartRect.height / 2,
            badgeCentreY: badgeRect ? badgeRect.top + badgeRect.height / 2 : null,
          };
        });
        const centredOk = !!measured && measured.badgeCentreY !== null
          && Math.abs(measured.heartCentreY - measured.badgeCentreY) <= 2;
        const pass = !!measured && measured.visible
          && Math.abs(measured.heartRight - measured.contentRight) <= 2
          && centredOk;
        record(name, { pass, measured, centredOk, note: 'favorite right edge aligns with the content column right edge (±2px) AND shares a centre line with the badge group (±2px, D69-27)' });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const outPath = join(EVIDENCE_DIR, 'results.json');
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task784-d69-19-browser-evidence: one or more checks failed (see above).');
    process.exit(1);
  }
  console.log('\n✅ task784-d69-19-browser-evidence: all checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
