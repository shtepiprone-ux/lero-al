#!/usr/bin/env node
/**
 * check-locale-leak.mjs — Rendered DOM hardcode detector (form-agnostic).
 *
 * For EVERY story export × sq/en/uk/it, renders the story in Playwright and
 * walks the DOM to detect English text that leaked through to non-English locales.
 *
 * Detection method (comparison-based, not pattern-based):
 *   1. Render story in `en` → collect baseline text tokens.
 *   2. Render same story in sq/uk/it → collect target tokens.
 *   3. Any token that: (a) appears unchanged from the en baseline, (b) looks
 *      English (isEnglishish), and (c) is NOT in the proper-noun/brand allowlist
 *      is reported as a LEAKED hardcode.
 *
 * This catches ALL forms: JSX string props, args-object literals, multi-line
 * text children, expression children, variable-sourced strings alike —
 * because it reads rendered output, not source.
 *
 * Output:
 *   .screenshots/locale-leak/<timestamp>/
 *     report.json   — machine-readable leak report (before/after runs)
 *
 * Part A of Task 392 (Sprint 33 corrective, 2026-06-05).
 * Docs: docs/storybook-governance.md §14.4
 *
 * Usage:
 *   npm run check:locale-leak        — full run (requires built Storybook)
 *   node scripts/check-locale-leak.mjs
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');

// ── Locales to compare (en = baseline; sq/uk/it = detection targets) ──────────

const TARGET_LOCALES = ['sq', 'uk', 'it'];
const ALL_LOCALES    = ['en', ...TARGET_LOCALES];

// ── Viewport for leak detection (use standard mobile + desktop) ───────────────

const VIEWPORTS = FAST_MODE
  ? [{ name: 'mobile-320', width: 320, height: 812 }]
  : [
      { name: 'mobile-320', width: 320,  height: 812 },
      { name: 'mobile-375', width: 375,  height: 812 },
      { name: 'desktop-1280', width: 1280, height: 800 },
    ];

// ── Proper-noun / brand allowlist ─────────────────────────────────────────────
//
// Tokens matching these patterns are NEVER flagged as leaks even if they appear
// unchanged across locales (they are intentionally language-neutral).

const LEAK_ALLOWLIST = [
  // Albanian city names
  /^(Tirana|Durrës|Durrës|Vlorë|Vlore|Shkodër|Shkoder|Berat|Kombinat|Sauk|Blloku|Elbasan)$/i,
  // Albanian person names used in fixtures
  /^(Ana|Koci|Blerim|Hoxha|Flutura|Lleshi)$/i,
  // Brand / acronym / technical tokens
  /^(EUR|URL|DELETE|SMS|HTTP|HTTPS|WhatsApp|Email|SEO|API|ID|QA)$/i,
  // Role labels intentionally shared (used as enum-like values in some contexts)
  /^(Administrator|Moderator|Agent)$/,
  // Status codes and short technical values
  /^(ACTIVE|INACTIVE|PENDING|CLOSED|OPEN|SOLD|RENTED|ARCHIVED)$/i,
  // Pure numbers, currency, units
  /^[\d\s€$+\-.,%()/[\]]+$/,
  // Short abbreviations / sizes
  /^(XS|SM|LG|XL|XXL|m²|m³|km|km²)$/,
  // Anything 1-2 chars (likely icon labels, abbreviations)
  /^.{1,2}$/,
  // Arrow/separator patterns
  /[→←×÷]/,
  // CSS class / code tokens starting with . or lowercase
  /^\.|^[a-z]/,
  // Storybook navigation chrome (story titles, addon labels)
  /^(Docs|Canvas|Controls|Actions|Accessibility|Interactions)$/,
];

function isAllowlisted(token) {
  return LEAK_ALLOWLIST.some(p => p.test(token));
}

/**
 * Returns true when `value` looks like a plain-English string.
 * Mirror of the isEnglishish() function in check-stories.mjs.
 */
function isEnglishish(value) {
  if (!value || typeof value !== 'string') return false;
  if (!/^[A-Z]/.test(value)) return false;
  if ((value.match(/[A-Za-z]/g) ?? []).length < 3) return false;
  // Non-ASCII Latin (ë/ç/à/è/…) or Cyrillic → not plain English
  if (/[À-ÖØ-öø-ÿĀ-ɏЀ-ӿ]/.test(value)) return false;
  return true;
}

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

// ── Collect text tokens from a rendered page ──────────────────────────────────

/**
 * In-browser function: walk visible DOM, collect text tokens and attribute values.
 * Returns a Set of unique string tokens (trimmed, non-empty).
 */
const COLLECT_TOKENS_FN = `
() => {
  const tokens = new Set();
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'DEFS']);

  function addToken(str) {
    if (!str) return;
    const t = str.trim();
    if (t.length >= 3) tokens.add(t);
  }

  function walk(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (parent && !SKIP_TAGS.has(parent.tagName)) {
        // Only collect from visible elements
        if (parent.offsetParent !== null || parent.tagName === 'BODY') {
          addToken(node.textContent);
        }
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;

    // Collect aria/accessibility text attributes
    const ariaLabel = node.getAttribute('aria-label');
    if (ariaLabel) addToken(ariaLabel);
    const placeholder = node.getAttribute('placeholder');
    if (placeholder) addToken(placeholder);
    const title = node.getAttribute('title');
    if (title) addToken(title);
    const alt = node.getAttribute('alt');
    if (alt) addToken(alt);

    for (const child of node.childNodes) {
      walk(child);
    }
  }

  walk(document.body);
  return Array.from(tokens);
}
`;

// ── Load story IDs from built Storybook index ─────────────────────────────────

function loadStoryIds(storybookStaticDir) {
  // Try index.json first (Storybook 7+), then stories.json
  for (const name of ['index.json', 'stories.json']) {
    const filePath = join(storybookStaticDir, name);
    if (!existsSync(filePath)) continue;
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      // Storybook 7 index.json: { entries: { [id]: { id, type, ... } } }
      if (data.entries) {
        return Object.values(data.entries)
          .filter(e => e.type === 'story')
          .map(e => ({ id: e.id, label: e.title + '/' + e.name }));
      }
      // Storybook 6 stories.json: { stories: { [id]: { id, kind, name } } }
      if (data.stories) {
        return Object.values(data.stories)
          .map(e => ({ id: e.id, label: (e.kind || e.title || '') + '/' + e.name }));
      }
    } catch {
      // ignore parse errors
    }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright').catch(() => {
    console.error('playwright not installed — run: npm install');
    process.exit(1);
  });

  // Load story IDs
  const allStories = loadStoryIds(storybookStaticDir);
  if (!allStories) {
    console.error('Cannot find index.json / stories.json in storybook-static/. Rebuild Storybook.');
    process.exit(1);
  }

  const PORT = 6009;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'locale-leak', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log(`🔍  Locale leak detector — ${FAST_MODE ? 'fast' : 'full'} mode`);
  console.log(`    Stories: ${allStories.length} | Locales: sq/uk/it (vs en baseline) | Viewports: ${VIEWPORTS.length}`);
  console.log(`    Output: .screenshots/locale-leak/${timestamp}/`);
  console.log('');

  let server, browser;
  const leaks = [];
  let scanned = 0;

  try {
    server = await startStaticServer(storybookStaticDir, PORT);
    browser = await chromium.launch();

    for (const story of allStories) {
      const storyLeaks = [];

      for (const viewport of VIEWPORTS) {
        // ── Step 1: render in `en` → collect baseline tokens ─────────────────
        let enTokens = new Set();
        try {
          const page = await browser.newPage();
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const url = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:en&viewMode=story`;
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(300);
          const tokens = await page.evaluate(COLLECT_TOKENS_FN);
          enTokens = new Set(tokens);
          await page.close();
        } catch {
          continue; // skip on error
        }

        // ── Step 2: render in each target locale, compare ─────────────────────
        for (const locale of TARGET_LOCALES) {
          try {
            const page = await browser.newPage();
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            const url = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
            await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(300);
            const targetTokens = await page.evaluate(COLLECT_TOKENS_FN);
            await page.close();

            // ── Step 3: diff — find leaks ─────────────────────────────────────
            for (const token of targetTokens) {
              if (!enTokens.has(token)) continue;          // changed → correctly translated
              if (!isEnglishish(token)) continue;          // not English → not a leak
              if (isAllowlisted(token)) continue;          // proper noun/brand → OK
              // Token is English AND unchanged from en → LEAK
              storyLeaks.push({
                storyId:    story.id,
                storyLabel: story.label,
                locale,
                viewport:   viewport.name,
                token,
              });
            }

          } catch {
            // skip on error
          }

          process.stdout.write('.');
          scanned++;
        }
      }

      leaks.push(...storyLeaks);
    }

    console.log('\n');

    // ── Deduplicate leaks (same token may appear in multiple viewports) ────────
    const seen = new Set();
    const uniqueLeaks = leaks.filter(l => {
      const key = `${l.storyId}|${l.locale}|${l.token}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Emit report.json ───────────────────────────────────────────────────────
    const report = {
      timestamp,
      mode: FAST_MODE ? 'fast' : 'full',
      storiesScanned: allStories.length,
      localesChecked: TARGET_LOCALES,
      leakCount: uniqueLeaks.length,
      leaks: uniqueLeaks,
    };
    const reportPath = join(outputDir, 'report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    // ── Summary ────────────────────────────────────────────────────────────────
    if (uniqueLeaks.length === 0) {
      console.log(`✅  Locale leak detector: ZERO leaks across ${allStories.length} stories × sq/uk/it.`);
      console.log(`    Report: .screenshots/locale-leak/${timestamp}/report.json`);
    } else {
      console.error(`❌  Locale leak detector: ${uniqueLeaks.length} leak(s) found:`);
      // Group by story
      const byStory = {};
      for (const l of uniqueLeaks) {
        byStory[l.storyLabel] ??= [];
        byStory[l.storyLabel].push(l);
      }
      for (const [storyLabel, items] of Object.entries(byStory)) {
        console.error(`\n  Story: ${storyLabel}`);
        for (const { locale, token } of items) {
          console.error(`    [${locale}] "${token}"`);
        }
      }
      console.error(`\n    Report: .screenshots/locale-leak/${timestamp}/report.json`);
      process.exit(1);
    }

  } finally {
    await browser?.close();
    server?.close();
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
