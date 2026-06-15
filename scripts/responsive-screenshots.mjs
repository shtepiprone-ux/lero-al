/**
 * Responsive screenshot capture for Lero.al
 *
 * Captures screenshots from built Storybook stories across the canonical
 * viewport × locale matrix. Output goes to .screenshots/responsive/ (gitignored).
 *
 * Usage:
 *   npm run screenshots:responsive                — full fast-check capture
 *   npm run screenshots:responsive:storybook       — same (alias)
 *   npm run governance:screenshots                 — check setup, no browser launch
 *
 * Flags:
 *   --check         Validate setup only (no browser, exit 0 if ready)
 *   --storybook-only  Capture from Storybook static build only (same as default)
 *   --full          Capture full matrix (all 15 viewports × 4 locales)
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 *
 * See docs/responsive-screenshot-governance.md for full documentation.
 * See docs/responsive-screenshot-matrix.md for the canonical viewport/locale matrix.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const FULL_MATRIX = args.includes('--full');

// ── Canonical viewport matrix ────────────────────────────────────────────────
// See docs/responsive-screenshot-matrix.md for the full reference.

/** Representative fast-check matrix: 6 viewports covering all breakpoint families */
const VIEWPORTS_FAST = [
  { name: 'mobile-320',    width: 320,  height: 812  },
  { name: 'mobile-375',    width: 375,  height: 812  },
  { name: 'tablet-768',    width: 768,  height: 1024 },
  { name: 'desktop-1280',  width: 1280, height: 800  },
  { name: 'desktop-1440',  width: 1440, height: 900  },
  { name: 'huge-2560',     width: 2560, height: 1440 },
];

/** Full matrix: all 15 project breakpoints */
const VIEWPORTS_FULL = [
  { name: 'mobile-320',    width: 320,  height: 812  },
  { name: 'mobile-360',    width: 360,  height: 800  },
  { name: 'mobile-375',    width: 375,  height: 812  },
  { name: 'mobile-390',    width: 390,  height: 844  },
  { name: 'mobile-412',    width: 412,  height: 915  },
  { name: 'mobile-480',    width: 480,  height: 900  },
  { name: 'tablet-640',    width: 640,  height: 960  },
  { name: 'tablet-768',    width: 768,  height: 1024 },
  { name: 'desktop-1024',  width: 1024, height: 768  },
  { name: 'desktop-1280',  width: 1280, height: 800  },
  { name: 'desktop-1440',  width: 1440, height: 900  },
  { name: 'huge-1720',     width: 1720, height: 1080 },
  { name: 'huge-1920',     width: 1920, height: 1080 },
  { name: 'huge-2560',     width: 2560, height: 1440 },
  { name: 'ultrawide-3440',width: 3440, height: 1440 },
];

// ── Locale matrix ─────────────────────────────────────────────────────────────

/** All four project locales. uk is the Ukrainian long-string stress locale. */
const LOCALES = ['en', 'sq', 'uk', 'it'];

// ── Story targets ─────────────────────────────────────────────────────────────
// Storybook story IDs: derived from title "Category/Name" + story export name.
// Example: title "Primitives/Button" + export "MobileSafe" → "primitives-button--mobile-safe"
//
// To find story IDs from the built Storybook:
//   open storybook-static/index.json (or stories.json) and look for "id" fields
//   OR open npm run storybook and check the URL for each story.

const STORY_TARGETS = [
  // Primitives — locale & mobile stress
  { id: 'primitives-button--default',          label: 'Button/Default' },
  { id: 'primitives-button--mobile-safe',      label: 'Button/MobileSafe',    viewports: ['mobile-320', 'mobile-375'] },
  { id: 'primitives-button--long-locale-label',label: 'Button/LongLocale',    locales: ['uk'] },
  { id: 'primitives-input--default',           label: 'Input/Default' },
  { id: 'primitives-input--mobile-form',       label: 'Input/MobileForm',     viewports: ['mobile-375'] },
  { id: 'primitives-tabs--default',            label: 'Tabs/Default' },
  { id: 'primitives-dialog--default',          label: 'Dialog/Default' },
  { id: 'primitives-dialog--mobile-dialog',    label: 'Dialog/Mobile',        viewports: ['mobile-375'] },
  { id: 'primitives-sheet--filter-sheet-right',label: 'Sheet/FilterRight',    viewports: ['mobile-375', 'tablet-768'] },
  { id: 'primitives-sheet--nav-drawer-left',   label: 'Sheet/NavLeft',        viewports: ['mobile-375'] },
  { id: 'primitives-badge--default',           label: 'Badge/Default' },
  { id: 'primitives-skeleton--listing-card',   label: 'Skeleton/ListingCard' },
  // System — huge desktop & responsive grid
  { id: 'system-listinggrid--desktop',         label: 'ListingGrid/Desktop',  viewports: ['desktop-1280', 'desktop-1440'] },
  { id: 'system-listinggrid--huge-desktop',    label: 'ListingGrid/HugeDesktop', viewports: ['huge-2560'] },
  { id: 'system-listinggrid--mobile',          label: 'ListingGrid/Mobile',   viewports: ['mobile-320', 'mobile-375'] },
  { id: 'system-listinggrid--with-ukrainian-titles', label: 'ListingGrid/Ukrainian', locales: ['uk'] },
  { id: 'system-containers--container-wide',   label: 'Containers/Wide',      viewports: ['desktop-1280', 'huge-2560'] },
  { id: 'system-containers--all-containers',   label: 'Containers/All',       viewports: ['desktop-1280'] },
  { id: 'system-emptystate--no-listings',      label: 'EmptyState/NoListings' },
  { id: 'system-emptystate--mobile-empty-state', label: 'EmptyState/Mobile',  viewports: ['mobile-375'] },
  { id: 'system-emptystate--ukrainian-locale', label: 'EmptyState/Ukrainian', locales: ['uk'] },
  { id: 'system-adminlayout--admin-toolbar',   label: 'Admin/Toolbar',        viewports: ['desktop-1280'] },
  // Recently-viewed section — Task 165 responsive evidence (7 required breakpoints)
  // Note: mobile-390 is in FULL_MATRIX only; run `screenshots:responsive -- --full` to capture all 7.
  { id: 'system-recentlyviewedsection--populated',   label: 'RecentlyViewedSection/Populated',   viewports: ['mobile-320', 'mobile-375', 'mobile-390', 'tablet-768', 'desktop-1280', 'desktop-1440', 'huge-2560'] },
  { id: 'system-recentlyviewedsection--mobile-scroll', label: 'RecentlyViewedSection/MobileScroll', viewports: ['mobile-320', 'mobile-375', 'mobile-390'] },
  { id: 'system-recentlyviewedsection--empty-state', label: 'RecentlyViewedSection/EmptyState',  viewports: ['desktop-1280'] },
  { id: 'system-recentlyviewedsection--ukrainian-locale', label: 'RecentlyViewedSection/Ukrainian', locales: ['uk'], viewports: ['mobile-375', 'desktop-1280'] },
  // Task 427 rework AC R4 — targeted rendered proof for the 2 density-changed surfaces
  { id: 'admin-adminlistingstable--preview-dialog-sold-status-actions', label: 'AdminListingsTable/PreviewDialogSoldStatusActions', locales: ['uk'], viewports: ['mobile-320', 'mobile-375', 'mobile-390'] },
  { id: 'listings-listingformshellview--staff-status-control-open', label: 'ListingFormShellView/StaffStatusControlOpen', locales: ['uk'], viewports: ['mobile-320', 'mobile-375', 'mobile-390'] },
];

// ── MIME types for static server ──────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

// ── Check mode ────────────────────────────────────────────────────────────────

async function runCheck() {
  let ok = true;

  // 1. Playwright installed?
  try {
    await import('playwright');
    console.log('✅ playwright package installed');
  } catch {
    console.error('❌ playwright not found — run: npm install (already in devDependencies)');
    ok = false;
  }

  // 2. Storybook config present?
  if (existsSync(join(ROOT, '.storybook', 'main.ts'))) {
    console.log('✅ .storybook/main.ts present');
  } else {
    console.error('❌ .storybook/main.ts missing — Storybook is not configured');
    ok = false;
  }

  // 3. Stories present?
  const storiesExist = existsSync(join(ROOT, 'src', 'components', 'ui', 'button.stories.tsx'))
    && existsSync(join(ROOT, 'src', 'stories', 'ListingGrid.stories.tsx'));
  if (storiesExist) {
    console.log('✅ story files present');
  } else {
    console.error('❌ story files missing — Phase 4 stories required');
    ok = false;
  }

  // 4. Screenshots output folder would be gitignored?
  const gitignore = existsSync(join(ROOT, '.gitignore'))
    ? (await readFile(join(ROOT, '.gitignore'), 'utf8'))
    : '';
  if (gitignore.includes('.screenshots')) {
    console.log('✅ .screenshots/ is gitignored');
  } else {
    console.error('❌ .screenshots/ is not in .gitignore — add it');
    ok = false;
  }

  // 5. Browser installed?
  const playwrightBrowserPath = join(ROOT, 'node_modules', 'playwright', 'package.json');
  if (existsSync(playwrightBrowserPath)) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ timeout: 5000 });
      await browser.close();
      console.log('✅ Chromium browser available');
    } catch {
      console.warn('⚠️  Chromium browser not installed — screenshots:responsive will fail.');
      console.warn('   Run: npx playwright install chromium');
      console.warn('   (check-only passes — browser is optional for governance:screenshots)');
    }
  }

  if (!ok) {
    console.error('\nSetup incomplete — fix errors above before running screenshots:responsive');
    process.exit(1);
  }

  console.log('\n✅ Screenshot infrastructure ready.');
  console.log('   Run: npm run screenshots:responsive');
  console.log('   (requires: npx playwright install chromium)');
}

// ── Static HTTP server ────────────────────────────────────────────────────────

function startStaticServer(staticDir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);

      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        // Try index.html for SPA routing
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

    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

// ── Screenshot capture ────────────────────────────────────────────────────────

async function captureScreenshots() {
  const storybookStaticDir = join(ROOT, 'storybook-static');

  if (!existsSync(storybookStaticDir)) {
    console.log('storybook-static/ not found — building Storybook first...');
    console.log('Run: npm run build-storybook');
    console.log('Then run: npm run screenshots:responsive');
    process.exit(1);
  }

  // Dynamic import — only needed here, not in check mode
  const { chromium } = await import('playwright').catch(() => {
    console.error('playwright not installed — run: npm install');
    process.exit(1);
  });

  const viewports = FULL_MATRIX ? VIEWPORTS_FULL : VIEWPORTS_FAST;
  const PORT = 6007;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  // Output directory with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputDir = join(ROOT, '.screenshots', 'responsive', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log(`📸  Starting responsive screenshot capture`);
  console.log(`    Output: .screenshots/responsive/${timestamp}/`);
  console.log(`    Viewports: ${viewports.length} (${FULL_MATRIX ? 'full' : 'fast-check'} matrix)`);
  console.log(`    Locales: ${LOCALES.join(', ')}`);
  console.log(`    Stories: ${STORY_TARGETS.length} targets`);
  console.log('');

  let server;
  let browser;

  try {
    server = await startStaticServer(storybookStaticDir, PORT);
    browser = await chromium.launch();

    let total = 0;
    let failed = 0;

    for (const story of STORY_TARGETS) {
      const storyViewports = story.viewports
        ? viewports.filter(v => story.viewports.includes(v.name))
        : viewports;
      const storyLocales = story.locales ?? LOCALES;

      for (const locale of storyLocales) {
        for (const viewport of storyViewports) {
          const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
          const filename = `${story.id}__${locale}__${viewport.name}.png`;
          const filePath = join(outputDir, filename);

          try {
            const page = await browser.newPage();
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 15000 });
            // Wait for fonts and animations
            await page.waitForTimeout(300);
            await page.screenshot({ path: filePath, fullPage: false });
            await page.close();
            process.stdout.write('.');
            total++;
          } catch (err) {
            process.stdout.write('✗');
            failed++;
            console.warn(`\n  ⚠️  Failed: ${filename} — ${err.message}`);
          }
        }
      }
    }

    console.log(`\n\n✅ Captured ${total} screenshots (${failed} failed)`);
    console.log(`   Output: .screenshots/responsive/${timestamp}/`);
    if (failed > 0) {
      console.warn(`   ${failed} stories failed — check story IDs match the built Storybook.`);
      console.warn('   Run: npm run build-storybook, then inspect storybook-static/stories.json for correct IDs.');
    }

  } finally {
    await browser?.close();
    server?.close();
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (CHECK_ONLY) {
  await runCheck();
} else {
  await captureScreenshots();
}
