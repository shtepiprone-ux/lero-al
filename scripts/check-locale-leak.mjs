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
 *   node scripts/check-locale-leak.mjs --story=<id> --widths=<px,px,…>
 *       — opt-in (Task 939): one Story and/or explicit viewport widths; with neither flag the run is 320, 375 and 1280 px over every Story
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANTINE_STORY_TITLE_PREFIXES, isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';
import { requestPathWithin } from './lib/within-repository.mjs';
import { isEntryPoint } from './lib/entry-point.mjs';

// One CI shard of the Story list: stable code-unit order, every n-th Story from the shard's index.
function selectShard(stories, shard) {
  const match = /^(\d+)\/(\d+)$/.exec(shard);
  const index = Number(match?.[1]);
  const total = Number(match?.[2]);
  if (!match || !Number.isInteger(index) || index < 1 || total < index || total > stories.length) {
    throw new Error('Invalid or empty locale shard');
  }
  const sorted = [...stories].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (new Set(sorted.map((s) => s.id)).size !== sorted.length) throw new Error('Duplicate Story IDs');
  return sorted.filter((_, i) => i % total === index - 1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const DEFAULT_WIDTHS = [320, 375, 1280];
const MIN_WIDTH = 200;
const MAX_WIDTH = 4000;

/** Task 939 (review 1, F3): '320,639,640' → [320, 639, 640]; anything that is not a list of whole widths in range is refused. */
export function parseWidths(value) {
  const parts = String(value ?? '').split(',');
  const widths = parts.map(part => (/^\d{1,4}$/.test(part) ? Number(part) : Number.NaN));
  if (widths.some(w => !Number.isInteger(w) || w < MIN_WIDTH || w > MAX_WIDTH)) {
    throw new Error(`Invalid --widths: expected whole pixel widths from ${MIN_WIDTH} to ${MAX_WIDTH} separated by commas`);
  }
  return [...new Set(widths)];
}

/** One viewport per width: below 640px a phone-height viewport, from 640px a desktop one (the heights the default run always used). */
export function viewportsForWidths(widths) {
  return widths.map(width => (width < 640
    ? { name: `mobile-${width}`, width, height: 812 }
    : { name: `desktop-${width}`, width, height: 800 }));
}

/** Pure parse of the command line. No flag keeps the defaults of the CI command: every Story at 320, 375 and 1280 px, shard 1/1. */
export function parseCliArgs(argv) {
  const value = name => argv.find(arg => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  const fast = argv.includes('--fast');
  const widthsValue = value('--widths');
  const story = value('--story');
  if (story !== undefined && !/^[a-z0-9_-]+$/i.test(story)) throw new Error('Invalid --story: expected a Storybook Story id');
  const widths = widthsValue === undefined ? (fast ? [DEFAULT_WIDTHS[0]] : DEFAULT_WIDTHS) : parseWidths(widthsValue);
  return {
    fast,
    // Owner decision 2026-07-19: migration leaks are reported, not release blockers. Rendering must still complete.
    reportOnlyLeaks: argv.includes('--report-only-leaks'),
    // Task Q0R — restricts the scan to canonical Mantine stories only (scripts/lib/mantine-story-scope.mjs),
    // the same criterion check-stories-rendered.mjs enforces. Legacy stories are excluded entirely —
    // they never run this gate and can never block a PR on it.
    mantineOnly: argv.includes('--mantine-only'),
    shard: value('--shard') || '1/1',
    story,
    widths,
    viewports: viewportsForWidths(widths),
  };
}

// ── Locales to compare (en = baseline; sq/uk/it = detection targets) ──────────

const TARGET_LOCALES = ['sq', 'uk', 'it'];

// ── Multi-locale demo story exclusions ────────────────────────────────────────
//
// Stories whose IDs match this pattern intentionally render ALL locale strings
// simultaneously (LocaleStress / AllLocales / LocaleVariants / LocalePlaceholders /
// LongLabelLocaleStress / SettlementsLocaleStress). They are SKIPPED entirely from
// the scan so their cross-locale tokens do NOT need to be globally allowlisted —
// which would mask the same words when they leak from real component stories.
const DEMO_STORY_SKIP = /locale-stress|all-locales|locale-variants|locale-placeholder|long-label-locale-stress|settlements-locale-stress/i;

// ── Global allowlist — language-neutral tokens only ───────────────────────────
//
// Keep ONLY: proper nouns (cities / person names), brand acronyms, CSS variant
// labels that are not translatable UI content, all-caps enum codes, and
// Storybook chrome. Do NOT add translatable vocabulary here — that would mask
// genuine hardcode leaks in real component stories.

const LEAK_ALLOWLIST = [
  // ── Geographic (proper nouns) ─────────────────────────────────────────────────
  /^(Tirana|Durrës|Durrës|Vlorë|Vlore|Shkodër|Shkoder|Berat|Kombinat|Sauk|Blloku|Elbasan)$/i,
  /^(Kyiv|Milan)$/i,
  // ── Person names (proper nouns) ───────────────────────────────────────────────
  /^(Ana|Koci|Blerim|Hoxha|Flutura|Lleshi)$/i,
  /^(Arben|Krasniqi|Oksana|Petrenko|Marco|Rossi)$/i,
  /^(Arben Krasniqi|Oksana Petrenko|Marco Rossi|Ana Koci|Blerim Hoxha|Flutura Lleshi)$/,
  // ── Brand / acronym / technical tokens (not translatable) ────────────────────
  /^(EUR|URL|DELETE|SMS|HTTP|HTTPS|WhatsApp|Email|SEO|API|ID|QA)$/i,
  // ── Design-system CSS variant labels (not translatable UI content) ────────────
  /^(Outline|Neutral)$/,
  // ── Task 624 — Tech/UI canonical loanwords, verified against messages/*.json (not guessed):
  //    it: password/dashboard/admin/pannello(wall_panel loanword)/brand are ALL used identically
  //    to en across many real product keys (auth.password, nav.admin_dashboard, admin.settings.tab_brand,
  //    listing.wall_panel); sq: admin/brand/panel(wall_panel) likewise identical to en in admin.*/
  //    role keys and admin.settings.tab_brand. ─────────────────────────────────────────────────
  /^(Password|Dashboard|Admin|Panel|Brand)$/,
  // ── Task 624 — Real-estate loanwords, verified against messages/*.json listing.layout_*/
  //    listing.premium: sq/it keep Premium/Duplex identical to en (genuine cognates in both
  //    locales). Studio/Penthouse do NOT stay here — Task 626 moved them to PER_STORY_TOKENS
  //    because it translates Studio→"Monolocale" and Penthouse→"Attico" (a global allowlist
  //    entry would have masked a real mistranslation anywhere else these render). ─────────────
  /^(Premium|Duplex)$/,
  // ── Task 624 — universal Min abbreviation, verified against messages/*.json common.min/
  //    storybook.filtercontrols.price_min: sq/it keep "Min" identical to en (Albanian "Minimumi"
  //    and Italian "minimo" abbreviate the same way). "Max" does NOT stay here — Task 626 moved
  //    it to PER_STORY_TOKENS because sq translates Max→"Maks" (a global allowlist entry would
  //    have masked a real sq mistranslation anywhere else this renders). ───────────────────────
  /^(Min)$/,
  // ── Task 624 — brand names, identical across all locales by design. ────────────────────────
  /^(Lero|Lero\.al|Facebook|Instagram)$/,
  // ── Task 853 — universal loanword, verified against messages/*.json listing.report_reason_spam:
  //    sq/it keep "Spam" identical to en (genuine international loanword in both locales); uk
  //    correctly transliterates to "Спам", so this entry cannot mask a real uk mistranslation. ──
  /^(Spam)$/,
  // ── Status codes — all-caps enum values, never translatable prose ─────────────
  /^(ACTIVE|INACTIVE|PENDING|CLOSED|OPEN|SOLD|RENTED|ARCHIVED)$/i,
  // ── Storybook chrome ──────────────────────────────────────────────────────────
  /^Required$/,
  /^Column options:/,
  /^(StatusChangeControl|Used in:)$/,
  /^(Docs|Canvas|Controls|Actions|Accessibility|Interactions)$/,
  // ── Story fixture identifiers ─────────────────────────────────────────────────
  /^ID: story-listing-/,
  // ── Numeric / symbol patterns ─────────────────────────────────────────────────
  /^[\d\s€$+\-.,%()/[\]]+$/,
  /^(XS|SM|LG|XL|XXL|m²|m³|km|km²)$/,
  /^.{1,2}$/,
  /[→←×÷]/,
  /^\.|^[a-z]/,
];

function isAllowlisted(token) {
  return LEAK_ALLOWLIST.some(p => p.test(token));
}

// ── Per-story allowlist ────────────────────────────────────────────────────────
//
// Tokens allowlisted only for specific story ID prefixes. Used for two categories:
//
// 1. Genuine loanwords where the sq/it translation is identical to English
//    (e.g. "Premium" → sq:"Premium", it:"Premium") — the comparison-based detector
//    cannot distinguish a correctly-translated loanword from a hardcode. These are
//    NOT added globally (that would mask real hardcodes in OTHER stories).
//
// 2. Story fixture placeholder data rendered as raw strings (not via storyT) in
//    stories that are correct-by-design (e.g. role codes in an admin-table demo).
//
const PER_STORY_TOKENS = {
  // Badge: storybook.badge.premium = "Premium" in sq + it (correct loanword).
  'primitives-badge': ['Premium'],
  // Button: Italian "Link" is a loanword (same word in it).
  'primitives-button': ['Link'],
  // Checkbox: "Studio" (sq loanword) and "Villa" (it loanword).
  'primitives-checkbox': ['Studio', 'Villa'],
  // Command: cmdk CommandList renders aria-label="Suggestions" by default (library default).
  'primitives-command': ['Suggestions'],
  // Input: PhoneNumericValidation fixture demo labels rendered as raw JSX strings.
  'primitives-input': [
    'Phone (valid — digits only)',
    'Phone (error state — letters blocked)',
    'Enter digits only — no letters or symbols.',
  ],
  // layout-filterbar entry removed (Task 788, 2026-09-05): src/components/layout/FilterBar.tsx
  // and its story deleted, zero production consumers — the allowlist key can no longer match.
  // StatusChangeHistory: actorName fixture + RawKeyStress humanizes snake_case → Title Case by design.
  'admin-statuschangehistory': ['Admin', 'Moderator', 'Administrator', 'In Progress', 'Resolved'],
  // StatusChangeControl/WorkflowWithHistory: actorName fixture + status label t() fallbacks.
  'admin-statuschangecontrol': ['Admin', 'Moderator', 'New', 'In Progress'],

  // ── Task 624 — canonical Mantine-prefix mirrors of the legacy-keyed entries above. The legacy
  // prefixes (the retired legacy `Admin/AdminTable` Story, etc.) never matched the new Mantine story IDs, so these role/
  // fixture allowances were simply never applied to the Mantine stories until now.
  // Avatar/SegmentedControl: mirrors the retired legacy table Story's "Administrator" role fixture.
  'mantine-primitives-avatar': ['Administrator'],
  'mantine-primitives-segmentedcontrol': ['Administrator'],
  // Table: raw fixture role + agency/person names (mirrors the retired legacy table Story's "Agent"; agency/
  // person names are story-specific, not in the legacy table).
  'mantine-primitives-table': ['Agent', 'Tirana RE', 'Antonio Berluskoni', 'Roma Immobili', 'Albhome', 'Arben Krasniqi-Marashi'],
  // AdminSurfacePattern: same raw fixture role + agency/person names as Table.
  'patterns-mantine-adminsurfacepattern': ['Agent', 'Tirana RE', 'Roma Immobili', 'Albhome', 'Giulia Romano'],
  // Task 877: currency codes and database-stored multilingual currency names from `FIXTURE_CURRENCIES`
  // render verbatim by design (the list shows `name_en || name_sq`, the detail shows all four name
  // columns). The search placeholder `EUR, ALL…` is identical in all four locales.
  'patterns-mantine-admintable': ['ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar'],
  'patterns-mantine-admincurrenciesview': ['EUR, ALL…', 'ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar', 'EUR — Euro'],
  'patterns-mantine-admincurrencytabs': ['EUR, ALL…', 'ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar'],
  'patterns-mantine-currencydetaildialogview': ['ALL', 'Albanian Lek', 'Lek albanese', 'Euro', 'USD', 'US Dollar', 'Dollar amerikan', 'Dollaro statunitense'],
  // HeaderView/MobileNavDrawer/UserMenu: demo authenticated-user fixture name(s).
  'mantine-primitives-headerview': ['Alba Krasniqi'],
  'mantine-primitives-mobilenavdrawer': ['Alba Krasniqi'],
  'mantine-primitives-usermenu': ['Alba Krasniqi', 'Driton Berisha'],
  // Listing patterns: agent/agency/place proper-noun fixtures.
  'patterns-mantine-listingcontactpattern': ['Elira Hoxha', 'Prime Realty Tirana'],
  'patterns-mantine-listingdetailpattern': ['Elira Hoxha', 'Prime Realty Tirana', 'Tirana, Albania'],
  'patterns-mantine-listingcardpattern': ['Tirana, Albania'],
  // ListingCard: "Tirana, Albania" is the correct Italian spelling of this place name.
  // Its canonical Storybook ID is mantine-primitives-listingcard--default.
  'mantine-primitives-listingcard': ['Tirana, Albania'],
  // FiltersPanelShell: heating_gas loanword (it:"Gas") + layout_features loanwords (sq:"Studio"/
  // "Penthouse" — sq keeps these identical to en) + common.max loanword (it:"Max" — it keeps this
  // identical to en); all verified against messages/it.json + messages/sq.json (Task 626).
  'mantine-primitives-filterspanelshell': ['Gas', 'Studio', 'Penthouse', 'Max'],
  // FilterControls: storybook.filtercontrols.price_max renders via common.max — it keeps "Max"
  // identical to en (genuine Italian cognate), verified against messages/it.json (Task 626).
  'mantine-primitives-filtercontrols': ['Max'],
  // UnstyledButton: mirrors 'primitives-button's own "Link" entry above — Italian "Link" is the
  // same loanword, verified against messages/it.json's own dozens of unmodified "Link" usages
  // (e.g. auth.link_copied, admin.field_nav_links).
  'mantine-primitives-unstyledbutton': ['Link'],
  // AvatarCropModal (Task 842 review, owner-authorised 2026-09-18): cabinet.avatar_zoom_label is
  // "Zoom" in it — the standard Italian loanword, verified against messages/it.json:565; sq/uk
  // translate it ("Zmadho"/"Масштаб"), so it stays story-scoped, never global.
  'patterns-mantine-avatarcropmodal': ['Zoom'],
  // AdminShell/AdminSidebar (Task 852): admin.sidebar.item_footer = "Footer" in sq/it (the same
  // loanword this codebase already uses identically across admin.footer.tab_footer/save_success/
  // field_site_name_hint, messages/sq.json:698,903,1150 and messages/it.json:698,903,1150 — verified,
  // not guessed). uk translates the same key ("Футер", matching its own tab_footer), so it is not
  // listed here.
  'patterns-mantine-adminshell': ['Footer'],
  'patterns-mantine-adminsidebar': ['Footer'],
  // AdminDashboardView (Task 890 rev 1, F1): every export renders inside the real `AdminShell` (the
  // production parent), so the same sidebar loanword "Footer" appears in sq/it — the same key and
  // reasoning as the two entries above.
  'patterns-mantine-admindashboardview': ['Footer'],
};

function isPerStoryAllowlisted(storyId, token) {
  for (const [prefix, tokens] of Object.entries(PER_STORY_TOKENS)) {
    if (storyId.startsWith(prefix) && tokens.includes(token)) return true;
  }
  return false;
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
      try {
        // the request path is decoded and held inside the served directory (Task 951 AC8): "../", "%2e%2e/", a link out of it all fall through to the fallback below
        const filePath = requestPathWithin(staticDir, urlPath);
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
// Wrapped as IIFE so page.evaluate(string) calls it immediately.
// page.evaluate("() => {...}") evaluates the arrow function expression but doesn't call it
// (returns undefined in Playwright ≥1.x). Wrapping as "(() => {...})()" calls it immediately.
const COLLECT_TOKENS_FN = `
(() => {
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
})()
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
          .map(e => ({ id: e.id, title: e.title ?? '', label: e.title + '/' + e.name }));
      }
      // Storybook 6 stories.json: { stories: { [id]: { id, kind, name } } }
      if (data.stories) {
        return Object.values(data.stories)
          .map(e => ({ id: e.id, title: e.kind ?? e.title ?? '', label: (e.kind || e.title || '') + '/' + e.name }));
      }
    } catch {
      // ignore parse errors
    }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Task 939 (review 1, F4): a page load that the browser's network stack refuses (net::ERR_NO_BUFFER_SPACE, net::ERR_NETWORK_IO_SUSPENDED, …) says nothing
// about the Story; it is retried once on a fresh page. A render or play failure, an HTTP failure and the 15 s render wait are never retried.
export function isTransportError(error) {
  return /net::ERR_[A-Z0-9_]+/.test(String(error?.message ?? ''));
}

async function loadStoryPage(browser, url, viewport, story, onRetry) {
  for (let attempt = 1; ; attempt += 1) {
    const page = await browser.newPage();
    const state = { runtimeFailure: false };
    // Storybook can log a failed play assertion and then report phase=finished. Retain that failure.
    page.on('pageerror', () => { state.runtimeFailure = true; });
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes(`Error rendering story '${story.id}'`)) state.runtimeFailure = true;
    });
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return { page, state, response };
    } catch (error) {
      await page.close();
      if (attempt === 1 && isTransportError(error)) {
        onRetry?.({ storyId: story.id, viewport: viewport.name, reason: renderErrorReason(error) });
        continue;
      }
      throw error;
    }
  }
}

// One tuple (Story × viewport × locale) has one deadline over every await on its page. Playwright gives goto and
// waitForFunction a timeout, but newPage, setViewportSize, evaluate and close wait forever on a renderer that hangs:
// shard 1/6 of an ad hoc local run of 2026-11-10 printed tuple 468 of 729 at 15:00:48 and nothing more for 19 hours
// (no deadline above it). In CI the job's timeout-minutes ends such a hang without naming the Story. With this deadline
// the tuple fails as "Timeout <n>ms exceeded" with its Story, viewport and locale, is counted as a render error, and the
// scan goes on; the page is closed without waiting for it.
export const TUPLE_DEADLINE_MS = 90_000; // above the longest normal tuple: two 20 s page loads (one transport retry) and the 15 s render wait

export async function collectStoryTokens(browser, baseUrl, story, viewport, locale, onRetry, deadlineMs = TUPLE_DEADLINE_MS) {
  const url = `${baseUrl}/iframe.html?id=${encodeURIComponent(story.id)}&globals=locale:${locale}&viewMode=story`;
  const held = { page: null };
  const collect = async () => {
    const { page, state, response } = await loadStoryPage(browser, url, viewport, story, onRetry);
    held.page = page;
    if (!response?.ok()) throw new Error('Story HTTP response failed');
    // Network-idle waits on unrelated assets and cannot establish that Storybook actually rendered.
    await page.waitForFunction(id => {
      const render = window.__STORYBOOK_PREVIEW__?.currentRender;
      return render?.id === id && ['finished', 'errored'].includes(render.phase);
    }, story.id, { timeout: 15000 });
    const failed = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay')
      || window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'errored');
    if (failed || state.runtimeFailure) throw new Error('Story render/play failed');
    return await page.evaluate(COLLECT_TOKENS_FN);
  };
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout ${deadlineMs}ms exceeded: ${story.id} at ${viewport.name} in ${locale}`)), deadlineMs);
  });
  try {
    return await Promise.race([collect(), deadline]);
  } finally {
    clearTimeout(timer);
    // a page whose renderer hangs may never close: the close is started, never awaited past a short grace
    if (held.page) {
      let grace;
      await Promise.race([held.page.close().catch(() => {}), new Promise(resolve => { grace = setTimeout(resolve, 5000); })]);
      clearTimeout(grace); // no timer outlives the tuple
    }
  }
}

/**
 * One line per render error for the log: which tuple and why. The reasons were only in report.json, so the log said
 * "1 render errors" and nothing more; neither the reader of a CI log nor ci-local's timeout diagnosis (load-watch.mjs
 * reads the step's output) could see that it was "page.waitForFunction: Timeout 15000ms exceeded" (ci-local run of
 * 2026-11-11, patterns-mantine-cmspageview--body-only at mobile-375 in sq; the Story alone passed 5 runs of 5).
 */
export function renderErrorLines(errors) {
  return errors.map(e => `  render error: ${e.storyId ?? '(scan)'}${e.viewport ? ` at ${e.viewport}` : ''}${e.locale ? ` in ${e.locale}` : ''}: ${e.reason}`);
}

function renderErrorReason(error) {
  // Retain actionable browser diagnostics without logging query strings or remote URLs.
  return String(error?.message || 'render failed').split('\n')[0].replace(/https?:\/\/\S+/g, '(URL)').slice(0, 240);
}

async function run() {
  const { fast: FAST_MODE, reportOnlyLeaks: REPORT_ONLY_LEAKS, mantineOnly: MANTINE_ONLY, shard: SHARD, story: ONLY_STORY, viewports: VIEWPORTS } = parseCliArgs(process.argv.slice(2));
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

  // Task Q0R (Q2/Q5) — under --mantine-only, restrict the entire scan to the canonical Mantine
  // set (scripts/lib/mantine-story-scope.mjs). An empty result is a hard error, not a silent
  // skip — either the build is stale/wrong or the title prefixes no longer match any story.
  const scopedStories = MANTINE_ONLY ? allStories.filter(s => isCanonicalMantineTitle(s.title)) : allStories;
  if (MANTINE_ONLY && scopedStories.length === 0) {
    console.error(`❌ check-locale-leak --mantine-only: discovered ZERO stories matching any of [${MANTINE_STORY_TITLE_PREFIXES.join(', ')}].`);
    console.error(`   Checked: storybook-static/index.json — filtering entries with a title starting with one of the prefixes above.`);
    console.error('   This is a hard error, not a skip — either the build is stale/wrong, or a title prefix no longer matches story titles.');
    process.exit(1);
  }

  let baseUrl;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(ROOT, '.screenshots', 'locale-leak', `${timestamp}-shard-${SHARD.replace('/', '-')}`);
  mkdirSync(outputDir, { recursive: true });

  const eligible = scopedStories.filter(s => !DEMO_STORY_SKIP.test(s.id));
  // Task 939 (F3): --story=<id> narrows the run to one eligible Story; an id that matches none is a hard error, never an empty pass.
  const pool = ONLY_STORY === undefined ? eligible : eligible.filter(s => s.id === ONLY_STORY);
  if (ONLY_STORY !== undefined && pool.length === 0) {
    console.error(`❌ check-locale-leak --story=${ONLY_STORY}: no eligible Story has this id (Mantine scope and demo-story exclusions apply).`);
    process.exit(1);
  }
  const scannable = selectShard(pool, SHARD);
  console.log(`🔍  Locale leak detector — ${FAST_MODE ? 'fast' : 'full'} mode${MANTINE_ONLY ? ' (mantine-only)' : ''}`);
  if (MANTINE_ONLY) {
    console.log(`Mantine selected: ${scopedStories.length}; non-Mantine excluded: ${allStories.length - scopedStories.length}`);
  }
  console.log(`    Shard: ${SHARD} | Stories: ${scannable.length}/${eligible.length} | Locales: sq/uk/it | Viewports: ${VIEWPORTS.map(v => v.width).join('/')}${ONLY_STORY === undefined ? '' : ` | Story: ${ONLY_STORY}`}`);
  console.log(`    Output: ${outputDir}`);
  console.log('');

  let server, browser;
  const leaks = [];
  const errors = [];
  const retries = [];
  let scanned = 0;
  const expected = scannable.length * VIEWPORTS.length * TARGET_LOCALES.length;
  const reportPath = join(outputDir, 'report.json');
  const persist = (complete = false) => writeFileSync(reportPath, JSON.stringify({
    timestamp, shard: SHARD, complete, expected, scanned, errors, retried: retries.length, retries, leaksBlocking: !REPORT_ONLY_LEAKS,
    storyIds: scannable.map(s => s.id), leakCount: leaks.length, leaks,
  }, null, 2), 'utf8');
  persist();

  try {
    server = await startStaticServer(storybookStaticDir, 0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch();

    const onRetry = retry => retries.push(retry);

    for (const story of scannable) {

      const storyLeaks = [];

      for (const viewport of VIEWPORTS) {
        // ── Step 1: render in `en` → collect baseline tokens ─────────────────
        let enTokens = new Set();
        try {
          const tokens = await collectStoryTokens(browser, baseUrl, story, viewport, 'en', onRetry);
          enTokens = new Set(tokens);
        } catch (error) {
          errors.push({ storyId: story.id, viewport: viewport.name, locale: 'en', reason: renderErrorReason(error) });
          persist();
          continue;
        }

        // ── Step 2: render in each target locale, compare ─────────────────────
        for (const locale of TARGET_LOCALES) {
          try {
            const targetTokens = await collectStoryTokens(browser, baseUrl, story, viewport, locale, onRetry);

            // ── Step 3: diff — find leaks ─────────────────────────────────────
            for (const token of targetTokens) {
              if (!enTokens.has(token)) continue;                          // changed → correctly translated
              if (!isEnglishish(token)) continue;                          // not English → not a leak
              if (isAllowlisted(token)) continue;                          // proper noun/brand → OK
              if (isPerStoryAllowlisted(story.id, token)) continue;        // story-scoped loanword/fixture → OK
              // Token is English AND unchanged from en → LEAK
              storyLeaks.push({
                storyId:    story.id,
                storyLabel: story.label,
                locale,
                viewport:   viewport.name,
                token,
              });
            }
            scanned++;

          } catch (error) {
            errors.push({ storyId: story.id, viewport: viewport.name, locale, reason: renderErrorReason(error) });
          }

          process.stdout.write('.');
        }
      }

      leaks.push(...storyLeaks);
      persist();
      console.log(` ${story.id}: ${scanned}/${expected} tuples, ${errors.length} render errors, ${retries.length} retried`);
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
      shard: SHARD,
      complete: errors.length === 0 && scanned === expected,
      expected,
      scanned,
      errors,
      retried: retries.length,
      retries,
      storyIds: scannable.map(s => s.id),
      mode: FAST_MODE ? 'fast' : 'full',
      mantineOnly: MANTINE_ONLY,
      storiesScanned: scannable.length,
      storiesExcluded: scopedStories.length - eligible.length,
      nonMantineExcluded: MANTINE_ONLY ? allStories.length - scopedStories.length : undefined,
      localesChecked: TARGET_LOCALES,
      leakCount: uniqueLeaks.length,
      leaksBlocking: !REPORT_ONLY_LEAKS,
      leaks: uniqueLeaks,
    };
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    // ── Summary ────────────────────────────────────────────────────────────────
    if (!report.complete) {
      console.error(`Incomplete locale scan: ${scanned}/${expected} tuples; ${errors.length} render errors; ${retries.length} retried. Report: ${reportPath}`);
      for (const line of renderErrorLines(errors)) console.error(line);
      process.exitCode = 1;
    } else if (uniqueLeaks.length === 0) {
      console.log(`✅  Locale leak detector: ZERO leaks across ${scannable.length} stories × sq/uk/it.`);
      console.log(`    Report: ${reportPath}`);
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
      console.error(`\n    Report: ${reportPath}`);
      process.exitCode = REPORT_ONLY_LEAKS ? 0 : 1;
    }

  } catch (error) {
    errors.push({ reason: 'scan runtime failed' });
    persist();
    throw error;
  } finally {
    await browser?.close();
    if (server) await new Promise(done => server.close(done));
  }
}

// Importing this module (the unit test) must not start a scan: run only when it is the entry point. isEntryPoint compares real
// paths (Task 963 AC17/AC18): Node gives import.meta.url the symlink-resolved path but keeps argv[1] as typed, so comparing
// them raw skipped run() through a symlinked checkout and the gate exited 0 having scanned nothing.
if (isEntryPoint(import.meta.url)) {
  run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
