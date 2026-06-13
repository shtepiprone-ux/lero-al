#!/usr/bin/env node
/**
 * task320-qa-i18n-fixes.mjs — Task 320 rendered evidence.
 *
 * Captures:
 *  - Admin/AdminSupportManager.UserCardStatusBadges: UserCard status badge resolves
 *    via admin.users.user_status_active/blocked/inactive (Bucket 1 namespace fix),
 *    NOT the raw key "admin.support.user_status_*".
 *  - Listings/Form/NumInputField.FloorsTotal: the floors_total field label resolves
 *    via listing.floors_total (Bucket 3), NOT the raw key "floors_total".
 *
 * sq/en/uk/it x mandatory viewports (320/375/390) + desktop 1280.
 *
 * Reuses the already-built storybook-static/.
 *
 * Usage: node scripts/task320-qa-i18n-fixes.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VIEWPORTS = [
  { name: 'mobile-320',   width:  320, height:  812 },
  { name: 'mobile-375',   width:  375, height:  812 },
  { name: 'mobile-390',   width:  390, height:  844 },
  { name: 'desktop-1280', width: 1280, height:  800 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MANDATORY_VIEWPORTS = new Set(['mobile-320', 'mobile-375', 'mobile-390']);

// Expected localized admin.users.user_status_{active,blocked,inactive} labels,
// in the same order as the UserCardStatusBadges fixture (active, blocked, inactive).
// Source of truth: messages/{sq,en,uk,it}.json -> admin.users.user_status_*
const EXPECTED_USER_STATUS = {
  sq: ['Aktiv', 'Bllokuar', 'Joaktiv'],
  en: ['Active', 'Blocked', 'Inactive'],
  uk: ['Активний', 'Заблокований', 'Неактивний'],
  it: ['Attivo', 'Bloccato', 'Non attivo'],
};

// Expected listing.floors_total label per locale.
// Source of truth: messages/{sq,en,uk,it}.json -> listing.floors_total
const EXPECTED_FLOORS_TOTAL = {
  sq: 'Katshmëria',
  en: 'Total floors',
  uk: 'Поверховість',
  it: 'Piani totali',
};

const STORIES = [
  {
    id: 'admin-adminsupportmanager--user-card-status-badges',
    label: 'UserCard-status-badges',
    check: async (page) => page.evaluate(() => {
      const cards = [...document.querySelectorAll('.flex.flex-col.gap-2.max-w-sm > div')];
      return cards.map(card => {
        const full = card.textContent ?? '';
        const hasRawLeak = full.includes('admin.support.user_status');
        const hasOverflow = card.scrollWidth > card.clientWidth + 2;
        return { full, hasRawLeak, hasOverflow };
      });
    }),
    validate: (rows, locale) => {
      const expected = EXPECTED_USER_STATUS[locale];
      return rows.length === 3
        && rows.every(r => !r.hasRawLeak && !r.hasOverflow && r.full.trim().length > 0)
        && rows.every((r, i) => r.full.includes(expected[i]));
    },
  },
  {
    id: 'listings-form-numinputfield--floors-total',
    label: 'NumInputField-floors_total-label',
    check: async (page) => page.evaluate(() => {
      const label = document.querySelector('label');
      const text = label?.textContent?.trim() ?? '';
      const hasOverflow = label ? label.scrollWidth > label.clientWidth + 2 : false;
      return [{ full: text, hasRawLeak: text === 'floors_total', hasOverflow }];
    }),
    validate: (rows, locale) => rows.length === 1
      && rows[0].full.length > 0
      && !rows[0].hasRawLeak
      && !rows[0].hasOverflow
      && rows[0].full === EXPECTED_FLOORS_TOTAL[locale],
  },
];

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

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
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
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6021;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-').replace('T', '_');
  const outputDir = join(ROOT, '.screenshots', 'task320-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log('📸  Task 320 i18n fixes rendered QA');
  console.log(`    Stories: ${STORIES.length} x Locales: ${LOCALES.length} x Viewports: ${VIEWPORTS.length}`);
  console.log(`    Output: .screenshots/task320-qa/${timestamp}/`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();
  const matrix = [];

  for (const story of STORIES) {
    for (const locale of LOCALES) {
      for (const viewport of VIEWPORTS) {
        const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
        const isMandatoryShot = locale === 'uk' && MANDATORY_VIEWPORTS.has(viewport.name);
        const filename = `${story.id}__${locale}__${viewport.name}.png`;
        const screenshotPath = join(outputDir, filename);

        const cell = {
          story: story.label,
          locale,
          viewport: viewport.name,
          width: viewport.width,
          screenshot: isMandatoryShot ? filename : null,
          assertions: {},
          pass: null,
          error: null,
        };

        try {
          const page = await browser.newPage();
          const pageErrors = [];
          page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(400);

          const renderResult = await page.evaluate(() => {
            if (document.body.classList.contains('sb-show-errordisplay')) {
              const errEl = document.querySelector('#error-message') || document.body;
              return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
            }
            const root = document.querySelector('#storybook-root');
            if (root && root.children.length === 0) return { failed: true, reason: 'blank-canvas', detail: '' };
            return { failed: false, reason: null, detail: '' };
          });

          const rows = await story.check(page);
          const valid = story.validate(rows, locale);

          cell.assertions = { renderCheck: renderResult, pageErrors: pageErrors.slice(0, 2), rows, valid };

          const renderFailed = renderResult.failed || pageErrors.length > 0;
          cell.pass = !renderFailed && valid;

          if (isMandatoryShot) {
            await page.screenshot({ path: screenshotPath, fullPage: true });
          }
          await page.close();

          const mark = cell.pass ? '✓' : (renderFailed ? 'E' : '✗');
          console.log(`  ${mark} ${story.label} | ${locale} x ${viewport.name}`);
        } catch (err) {
          cell.error = String(err).slice(0, 300);
          cell.pass = false;
          console.log(`  E ${story.label} | ${locale} x ${viewport.name} - ${cell.error}`);
        }

        matrix.push(cell);
      }
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, matrix }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: .screenshots/task320-qa/${timestamp}/manifest.json`);
  console.log(`PNGs (uk@320/375/390): .screenshots/task320-qa/${timestamp}/*.png`);

  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
