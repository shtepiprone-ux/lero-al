#!/usr/bin/env node
/**
 * task791-detail-evidence.mjs — Task 791 rendered-geometry evidence (Revision 1 + Revision 2),
 * carried forward and updated by Task 793 (kickoff §3.5/R5/R9).
 *
 * Revision 1 (F2, kickoff §16.2): AC3 (breadcrumb DOM), AC6 (sidebar column widths), AC10 (bottom
 * clearance), AC12 (lightbox stacking) and AC14 (320/uk overflow). Same static-file-server +
 * Playwright shape as scripts/task785-inert-media-evidence.mjs.
 *
 * Revision 3 (kickoff §20): R13 was WITHDRAWN by the owner — the h1 keeps the plain `size="h2"`
 * (36px at every width), so the R13 checks and the token they read were removed with it.
 * breakpoint gate — on both the live route and the canonical `Patterns/Mantine/ListingDetailPattern`
 * story.
 *
 * Task 793: the fixed mobile contact bar is deleted, and `listingContactBarClearance` (the token
 * the old AC10 check read) is deleted with it. The old three-breakpoint clearance check is replaced
 * by an AC5 check — the page's `pb` is now the ordinary `2xl` token at every width — and the
 * `.listing-contact` selector AC6/AC12 read is replaced by `[data-testid="listing-contact-card"]`,
 * a stable hook on the canonical pattern's own root (the old class lived on a wrapper `<div>` this
 * task deleted).
 *
 * Two targets:
 *   - LIVE_BASE_URL (default http://localhost:3000) — a real `next start` server, requested with
 *     a real seeded listing slug (LISTING_SLUG, default 11-mr7ucly4). Owns AC3 (live half), AC5,
 *     AC6, AC12, AC14.
 *   - a static server over storybook-static (--dir, default ./storybook-static) — owns the
 *     Patterns/Mantine/ListingsPageFrame Default half of AC3. Rebuild with
 *     `npm run build-storybook` whenever ListingsPageFrame.tsx, MantineListingDetailPattern.tsx or
 *     either story changes.
 *
 * Usage: node scripts/task791-detail-evidence.mjs [--dir <storybook-static-dir>]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task791');

const args = process.argv.slice(2);
const dirFlagIdx = args.indexOf('--dir');
const storybookStaticDir = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? resolve(process.cwd(), args[dirFlagIdx + 1])
  : join(ROOT, 'storybook-static');

const LIVE_BASE_URL = process.env.LIVE_BASE_URL || 'http://localhost:3000';
const LISTING_SLUG = process.env.LISTING_SLUG || '11-mr7ucly4';

// Expected bottom-padding value — NOT hardcoded as the pass/fail source: read from theme.ts's own
// spacing scale via source regex (never duplicated as a bare literal comparison target without a
// citation). Task 793 deleted `listingContactBarClearance` — the fixed mobile bar it reserved
// space for is gone, so the page now takes the SAME ordinary `2xl` token at every breakpoint
// (`ListingDetailView.tsx`'s `pb="2xl"`), not a base/md/lg-specific reservation.
import { readFileSync } from 'node:fs';
const themeSrc = readFileSync(join(ROOT, 'src/design-system/mantine/theme.ts'), 'utf8');
const spacing2xlMatch = themeSrc.match(/'2xl':\s*'([\d.]+)rem'/);
if (!spacing2xlMatch) throw new Error('task791-detail-evidence: could not find spacing[\'2xl\'] in theme.ts');
const EXPECTED_PB_PX = Math.round(parseFloat(spacing2xlMatch[1]) * 16);

const smBreakpointMatch = themeSrc.match(/sm:\s*'([\d.]+)em',\s*\/\/\s*(\d+)px/);
if (!smBreakpointMatch) throw new Error('task791-detail-evidence: could not find breakpoints.sm in theme.ts');
const SM_GATE_PX = Number(smBreakpointMatch[2]);

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

// Reduces a serialized element to its tag + SORTED attribute-name skeleton, with all text and
// attribute VALUES stripped. Attribute insertion ORDER legitimately differs between a Next.js
// prod SSR render and a Storybook/Vite dev render of the same JSX (React reads props off the same
// object either way, but two different bundlers snapshot/iterate that object differently) — this
// is not a rendered-output difference AC3 is testing for, so it is normalized away here rather
// than left to produce a false mismatch.
function domSkeleton(outerHTML) {
  const noText = outerHTML.replace(/>[^<]*</g, '><');
  return noText.replace(/<([a-zA-Z0-9-]+)((?:\s+[a-zA-Z-]+="[^"]*")*)/g, (_m, tag, attrs) => {
    const names = [...attrs.matchAll(/\s+([a-zA-Z-]+)="[^"]*"/g)].map(a => a[1]).sort();
    return `<${tag}${names.map(n => ` ${n}=""`).join('')}`;
  });
}

async function gotoStory(page, baseUrl, storyId) {
  const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
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

  const results = {
    capturedAt: new Date().toISOString(),
    liveBaseUrl: LIVE_BASE_URL,
    listingSlug: LISTING_SLUG,
    storybookStaticDir,
    expected: { pbPx: EXPECTED_PB_PX },
    checks: [],
  };
  let hardFail = false;
  const record = (name, data) => {
    results.checks.push({ name, ...data });
    if (data.pass === false) hardFail = true;
    console.log(`${data.pass === false ? '❌' : '✅'} ${name}: ${JSON.stringify(data)}`);
  };

  const browser = await chromium.launch({ headless: true });

  // ── AC5 (Task 793) — ordinary bottom padding at 320/390/768/1280, sq locale ─────────────────
  // The fixed mobile bar is deleted and `listingContactBarClearance` with it — the page now takes
  // the same ordinary `2xl` spacing token at every width (no more base/md-specific reservation).
  for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const url = `${LIVE_BASE_URL}/sq/listings/${LISTING_SLUG}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
    const name = `ac5-bottom-padding-${width}`;
    if (!response?.ok()) {
      record(name, { pass: false, failReason: `navigation failed (status ${response?.status()})` });
      await context.close();
      continue;
    }
    const measured = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="listing-detail-view"]');
      if (!el) return null;
      return { paddingBottom: getComputedStyle(el).paddingBottom };
    });
    const measuredPx = measured ? Math.round(parseFloat(measured.paddingBottom)) : null;
    const pass = measuredPx === EXPECTED_PB_PX;
    await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
    record(name, { pass, width, expectedPx: EXPECTED_PB_PX, measured, measuredPx });
    await context.close();
  }

  // ── AC6 — sidebar Grid.Col geometry at 768/1023/1024, sq locale, sidebarFrom="lg" ───────────
  for (const width of [768, 1023, 1024]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const url = `${LIVE_BASE_URL}/sq/listings/${LISTING_SLUG}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
    const name = `ac6-sidebar-${width}`;
    if (!response?.ok()) {
      record(name, { pass: false, failReason: `navigation failed (status ${response?.status()})` });
      await context.close();
      continue;
    }
    const measured = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll('.mantine-Grid-col'));
      if (cols.length < 2) return { colCount: cols.length };
      const left = cols[0].getBoundingClientRect();
      const right = cols[1].getBoundingClientRect();
      const contactEl = document.querySelector('[data-testid="listing-contact-card"]');
      const contactVisible = contactEl ? getComputedStyle(contactEl).display !== 'none' : false;
      return {
        colCount: cols.length,
        leftRect: { top: left.top, left: left.left, width: left.width, height: left.height },
        rightRect: { top: right.top, left: right.left, width: right.width, height: right.height },
        contactVisible,
      };
    });
    // Below `lg` (1024): sidebarFrom="lg" gives rightSpan base:12 — stacked below the left
    // column (right.top clearly below left's bottom), not beside it. At/above 1024: side-by-side
    // (right.top approximately equal to left.top).
    const stacked = measured?.leftRect && measured?.rightRect
      ? measured.rightRect.top >= measured.leftRect.top + measured.leftRect.height - 4
      : null;
    const sideBySide = measured?.leftRect && measured?.rightRect
      ? Math.abs(measured.rightRect.top - measured.leftRect.top) <= 4
      : null;
    const expectStacked = width < 1024;
    const pass = expectStacked ? stacked === true : sideBySide === true;
    await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
    record(name, { pass, width, expectStacked, stacked, sideBySide, measured });
    await context.close();
  }

  // ── AC14 — 320/uk overflow ────────────────────────────────────────────────────────────────
  {
    const width = 320;
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const url = `${LIVE_BASE_URL}/uk/listings/${LISTING_SLUG}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
    const name = 'ac14-overflow-320-uk';
    if (!response?.ok()) {
      record(name, { pass: false, failReason: `navigation failed (status ${response?.status()})` });
    } else {
      const measured = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const nav = document.querySelector('nav[aria-label]');
        const navOverflow = nav ? nav.scrollWidth > nav.clientWidth + 1 : null;
        const badges = Array.from(document.querySelectorAll('.mantine-Badge-root'));
        const viewportWidth = window.innerWidth;
        const clippedBadges = badges.filter(b => {
          const r = b.getBoundingClientRect();
          return r.right > viewportWidth + 1 || r.left < -1;
        }).length;
        return { scrollWidth, clientWidth, navOverflow, badgeCount: badges.length, clippedBadges };
      });
      const pass = !!measured
        && measured.scrollWidth <= measured.clientWidth + 1
        && measured.navOverflow === false
        && measured.clippedBadges === 0;
      await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: true }).catch(() => {});
      record(name, { pass, width, measured });
    }
    await context.close();
  }

  // ── AC12 — lightbox stacking above header and sticky contact card ───────────────────────────
  for (const [width, locale] of [[390, 'sq'], [390, 'uk'], [1280, 'sq'], [1280, 'uk']]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const url = `${LIVE_BASE_URL}/${locale}/listings/${LISTING_SLUG}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
    const name = `ac12-stacking-${width}-${locale}`;
    if (!response?.ok()) {
      record(name, { pass: false, failReason: `navigation failed (status ${response?.status()})` });
      await context.close();
      continue;
    }
    await page.waitForTimeout(300); // allow GalleryIsland's client hydration swap
    const galleryTrigger = page.locator('.listing-gallery .cursor-zoom-in').first();
    const triggerVisible = await galleryTrigger.isVisible().catch(() => false);
    if (!triggerVisible) {
      record(name, { pass: false, failReason: 'gallery trigger not found/visible after hydration' });
      await context.close();
      continue;
    }
    await galleryTrigger.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(150);

    const probe = await page.evaluate((viewportWidth) => {
      const isInsideDialog = (el) => !!el && !!el.closest('[role="dialog"]');
      const headerProbe = document.elementFromPoint(Math.floor(viewportWidth / 2), 10);
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const dialogRect = dialog ? dialog.getBoundingClientRect() : null;
      const result = {
        headerProbeInsideDialog: isInsideDialog(headerProbe),
        headerProbeTag: headerProbe ? headerProbe.tagName : null,
        // Task 793: the contact card can be off-screen below the fold at mobile widths (see the
        // N/A branch below) — this independently proves the scrim covers the FULL viewport
        // regardless of where the card happens to be scrolled to.
        dialogCoversViewport: !!dialogRect && dialogRect.width >= window.innerWidth - 1 && dialogRect.height >= window.innerHeight - 1,
      };
      const contactEl = document.querySelector('[data-testid="listing-contact-card"]');
      // Task 793: below `lg` the card renders in normal document flow (R1), not `position:fixed`/
      // `sticky` — it can legitimately sit outside the CURRENT viewport (scrolled below the fold)
      // when the gallery trigger near the top of the page is clicked. The fullScreen Modal's
      // scroll-lock (Task 612) means the viewport cannot be scrolled to reach it once open, so a
      // probe point outside the current viewport proves nothing about stacking — same N/A
      // treatment as the pre-existing "not rendered" branch below.
      const viewportHeight = window.innerHeight;
      const isOnScreen = (r) => r.bottom > 0 && r.top < viewportHeight && r.right > 0 && r.left < viewportWidth;
      if (contactEl && getComputedStyle(contactEl).display !== 'none' && isOnScreen(contactEl.getBoundingClientRect())) {
        const r = contactEl.getBoundingClientRect();
        const cx = Math.floor(r.left + r.width / 2);
        const cy = Math.floor(r.top + Math.min(20, r.height / 2));
        const contactProbe = document.elementFromPoint(cx, cy);
        result.contactProbeInsideDialog = isInsideDialog(contactProbe);
        result.contactProbeTag = contactProbe ? contactProbe.tagName : null;
        result.contactProbePoint = { cx, cy };
      } else {
        result.contactProbeInsideDialog = null; // not rendered, hidden, or off-screen at this width — N/A
      }
      return result;
    }, width);

    const pass = probe.headerProbeInsideDialog === true
      && probe.dialogCoversViewport === true
      && (probe.contactProbeInsideDialog === true || probe.contactProbeInsideDialog === null);
    await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
    record(name, { pass, width, locale, probe });
    await context.close();
  }

  await browser.close();

  // ── AC3 — breadcrumb DOM: live /sq/listings vs Patterns/Mantine/ListingsPageFrame Default ────
  {
    const browser2 = await chromium.launch({ headless: true });
    let liveNav = null;
    let liveOk = false;
    {
      const context = await browser2.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const response = await page.goto(`${LIVE_BASE_URL}/sq/listings`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
      liveOk = !!response?.ok();
      if (liveOk) {
        const raw = await page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label]');
          if (!nav) return null;
          return { anchorCount: nav.querySelectorAll('a').length, outerHTML: nav.outerHTML };
        });
        if (raw) liveNav = { anchorCount: raw.anchorCount, outerHTMLLength: raw.outerHTML.length, skeleton: domSkeleton(raw.outerHTML) };
      }
      await context.close();
    }

    let storyNav = null;
    let storyOk = false;
    if (existsSync(join(storybookStaticDir, 'index.json'))) {
      const server = await startStaticServer(storybookStaticDir);
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      const context = await browser2.newContext({ viewport: { width: 1280, height: 1200 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingspageframe--default');
      storyOk = nav.ok;
      if (storyOk) {
        const raw = await page.evaluate(() => {
          const navs = Array.from(document.querySelectorAll('nav[aria-label]'));
          const first = navs[0]; // first ListingsPageFrame instance in the Default story — no intermediate crumbs
          if (!first) return null;
          return { anchorCount: first.querySelectorAll('a').length, outerHTML: first.outerHTML };
        });
        if (raw) storyNav = { anchorCount: raw.anchorCount, outerHTMLLength: raw.outerHTML.length, skeleton: domSkeleton(raw.outerHTML) };
      }
      await context.close();
      server.close();
    }
    await browser2.close();

    const structuralMatch = !!liveNav && !!storyNav && liveNav.anchorCount === storyNav.anchorCount && liveNav.skeleton === storyNav.skeleton;
    record('ac3-breadcrumb-dom', {
      pass: liveOk && storyOk && structuralMatch,
      liveOk, storyOk, structuralMatch, liveNav, storyNav,
    });
  }


  const outPath = join(EVIDENCE_DIR, 'results.json');
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task791-detail-evidence: one or more checks failed (see above).');
    process.exit(1);
  }
  console.log('\n✅ task791-detail-evidence: all checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
