#!/usr/bin/env node
/**
 * check-stories.mjs — Build-gating Storybook governance script.
 *
 * Checks all *.stories.tsx and *.stories.ts files and src/stories/** for banned patterns:
 *   1. layout:'centered'|'padded' — must use fullscreen + withCanvas
 *   2. Raw HTML controls (<button>/<input>/<select>/<textarea> in JSX)
 *   3. Locale-NAME export families (Ukrainian/Albanian/Italian/English + Uk/Sq/It/En segments)
 *   4. Hardcoded locale pins (globals.locale + args.locale + locale="…" JSX props)
 *   5. Known hardcoded English user-facing title literals in fixtures
 *   6. storybook.* namespace key parity across sq/en/uk/it
 *   7. Inline locale maps (uk:/sq:/it: object literals) in story files
 *   8. messages/uk.json storybook.* values with Latin letters only (no Cyrillic)
 *   9. Runtime component hardcoded English literals
 *  10. English JSX string-prop literals and JSX text children in story files
 *  11. sm:flex-row sm:flex-wrap — toolbar overflow at 640px
 *  12. Viewport/width-named exports (identifier-token vs file-scoped allowlist)
 *  13. Duplicate-family export names (Proof/Demo/Filtered/Canonical vs allowlist)
 *  14. Off-scale Mantine <Button size="lg"|"xl"> in src/stories/mantine/** +
 *      src/design-system/mantine/patterns/** (Task 520 — Density Correction gate;
 *      canonical default is size="sm"/14px + 44px min-height, theme.ts + §6 of
 *      docs/tailadmin-style-reference.md). Escape hatch: "// @allow-button-size <reason>"
 *      on the size="lg"/"xl" line or the line immediately above it.
 *  15. Unregistered Mantine colour — repository-wide over all of src/**, three forms (Task 685,
 *      widened repository-wide by Task 686): (A) a literal `(color|c|bg)="value"` prop; (B) a
 *      `var(--mantine-color-<stock-but-unregistered>-<digit>)` CSS variable, which re-catches an
 *      unregistered ramp smuggled past Form A's var() passthrough; (C) a `*COLOR*`-named object
 *      literal whose string value is a stock-but-unregistered palette name. The registered set is
 *      derived from theme.ts's `colors: {…}` object at runtime; the stock Mantine palette set is
 *      derived from the installed `default-colors.mjs` at runtime — neither is hard-coded, and an
 *      underivable set fails loudly rather than scanning with an empty set. The passthrough
 *      accepts `#`-values, any CSS function call (`var()`/`rgb()`/`rgba()`/`hsl()`/`oklch()`/
 *      `lab()`/`color()`/`*-gradient()`), the CSS-wide keywords (transparent/currentColor/
 *      inherit/initial/unset/revert/none), the Mantine keywords (dimmed/bright/white/black), or a
 *      registered name (bare or `.0`-`.9` shaded).
 *
 * Exit 0 on clean tree. Exit non-zero on any violation.
 * Wired into prebuild-storybook, prestorybook, and CI.
 *
 * Exports: isEnglishish(value), JSX_PROP_ALLOWLIST, runGate(root, opts)
 *   — consumed by scripts/__tests__/check-stories.test.ts (vitest)
 *
 * Usage:
 *   node scripts/check-stories.mjs
 *   npm run check:stories
 *
 * Added by Task 380 (Sprint 33 corrective, 2026-06-04).
 * Broadened + exported by Task 391 (2026-06-04).
 * docs/storybook-governance.md §14.3 / §14.7
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── File discovery ─────────────────────────────────────────────────────────────

function collectFiles(dir, exts) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'storybook-static') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...collectFiles(full, exts));
    else if (exts.some(e => entry.endsWith(e))) results.push(full);
  }
  return results;
}

// ── Exported helpers ───────────────────────────────────────────────────────────

/**
 * Returns true when `value` looks like a plain-English string (not Albanian/Italian/Cyrillic).
 * Heuristic: starts with ASCII uppercase A–Z, contains ≥3 ASCII alpha chars, and has
 * NO non-ASCII accented/diacritic/Cyrillic characters (those mark Albanian/Italian/Ukrainian).
 */
export function isEnglishish(value) {
  if (!/^[A-Z]/.test(value)) return false;
  if ((value.match(/[A-Za-z]/g) ?? []).length < 3) return false;
  // Non-ASCII Latin (ë/ç/à/è/…) or Cyrillic → not plain English
  if (/[À-ÖØ-öø-ÿĀ-ɏЀ-ӿ]/.test(value)) return false;
  return true;
}

/**
 * Proper-noun / brand allowlist — JSX prop values AND JSX text children matching
 * these patterns are not flagged by Check 10 even when isEnglishish returns true.
 */
export const JSX_PROP_ALLOWLIST = [
  /^(Tirana|Durr[eë]s|Vlor[eë]|Shkod[eë]r|Berat|Kombinat|Sauk|Blloku|Elbasan)$/i,
  /^(EUR|URL|DELETE|SMS|HTTP|HTTPS|WhatsApp|Email)$/i,
  // Role labels used in table-row data (allowed in story fixtures; caught in runtime by check 9)
  /^(Administrator|Moderator|Agent)$/,
];

// ── Gate runner (exported for testing) ────────────────────────────────────────

/**
 * Run all 16 governance checks against the given repo root.
 *
 * @param {string} root - Absolute path to the repo root (defaults to this script's parent dir).
 * @param {{ verbose?: boolean }} opts - When verbose=true, prints check-header lines to stdout.
 * @returns {{ violations: Array<{file:string, line:number, rule:string, detail:string}>,
 *             storyFilesCount: number, checksRan: number }}
 */
export function runGate(root = ROOT, { verbose = false } = {}) {
  const log    = verbose ? (...a) => console.log(...a)   : () => {};
  const logErr = verbose ? (...a) => console.error(...a) : () => {};

  // Story files: colocated *.stories.tsx + *.stories.ts + src/stories/**
  const STORY_FILES = [
    ...collectFiles(join(root, 'src'), ['.stories.tsx', '.stories.ts']),
    ...collectFiles(join(root, 'src', 'stories'), ['.ts', '.tsx']).filter(
      f => !f.endsWith('.stories.tsx') && !f.endsWith('.stories.ts')
    ),
  ];

  // ── Load file-scoped real-mode allowlist ────────────────────────────────────
  let allowlist = [];
  try {
    const allowlistPath = join(root, 'scripts', 'story-realmode-allowlist.json');
    allowlist = JSON.parse(readFileSync(allowlistPath, 'utf8'));
  } catch { /* allowlist missing = no exceptions */ }

  function isAllowlisted(filePath, exportName, checkNum) {
    const rel = relative(root, filePath).replace(/\\/g, '/');
    return allowlist.some(e =>
      e.file === rel && e.export === exportName && (e.check === checkNum || !e.check)
    );
  }

  // ── Identifier-token segmentation ──────────────────────────────────────────
  function segmentIdentifier(name) {
    return name
      .replace(/_/g, '\0')
      .replace(/([a-z0-9])([A-Z])/g, '$1\0$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2')
      .split('\0')
      .filter(Boolean);
  }

  const violations = [];
  function fail(file, line, rule, detail) {
    const rel = relative(root, file).replace(/\\/g, '/');
    violations.push({ file: rel, line, rule, detail });
  }

  function checkFile(filePath, checks) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      return;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trimStart();
      const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
      for (const { pattern, rule, detail, skipComments = true, shouldSkip } of checks) {
        if (skipComments && isComment) continue;
        if (shouldSkip && shouldSkip(line)) continue;
        if (pattern.test(line)) {
          fail(filePath, lineNum, rule, detail ?? line.trim().slice(0, 100));
        }
      }
    }
  }

  // ── Check 1: Banned layout values ─────────────────────────────────────────

  log('── Check 1: Banned layout values ──────────────────────────────────');

  const LAYOUT_CHECKS = [
    {
      pattern: /layout\s*:\s*['"]centered['"]/,
      rule: 'layout:centered',
      detail: "layout:'centered' is FORBIDDEN in stories. Use withCanvas + layout:'fullscreen' (§14.1).",
    },
    {
      pattern: /layout\s*:\s*['"]padded['"]/,
      rule: 'layout:padded',
      detail: "layout:'padded' is FORBIDDEN in stories. withCanvas provides the canonical gutter (§14.1).",
    },
  ];

  for (const f of STORY_FILES) {
    checkFile(f, LAYOUT_CHECKS);
  }

  // ── Check 2: Raw HTML controls ─────────────────────────────────────────────

  log('── Check 2: Raw HTML controls ──────────────────────────────────────');

  // Match JSX opening tags: <button, <input, <select, <textarea
  // Skip lines where the element tag appears inside a string literal (doc descriptions).
  const inStringLiteral = (tag) => (line) => {
    return new RegExp(`['"\`][^'"\`\\n]*<${tag}`).test(line);
  };

  const RAW_CONTROL_CHECKS = [
    {
      pattern: /<button[\s/>]/,
      rule: 'raw-html-button',
      detail: 'Raw <button> in stories is FORBIDDEN. Use Button from @/components/ui/button.',
      shouldSkip: inStringLiteral('button'),
    },
    {
      pattern: /<input[\s/>]/,
      rule: 'raw-html-input',
      detail: 'Raw <input> in stories is FORBIDDEN. Use Input from @/components/ui/input.',
      shouldSkip: inStringLiteral('input'),
    },
    {
      pattern: /<select[\s/>]/,
      rule: 'raw-html-select',
      detail: 'Raw <select> in stories is FORBIDDEN. Use Select from @/components/ui/select.',
      shouldSkip: inStringLiteral('select'),
    },
    {
      pattern: /<textarea[\s/>]/,
      rule: 'raw-html-textarea',
      detail: 'Raw <textarea> in stories is FORBIDDEN. Use a canonical form component.',
      shouldSkip: inStringLiteral('textarea'),
    },
  ];

  for (const f of STORY_FILES.filter(f => f.endsWith('.tsx'))) {
    checkFile(f, RAW_CONTROL_CHECKS);
  }

  // ── Check 3: Locale-NAME export families ────────────────────────────────
  // Broadened by Task 468: FAIL on identifier segments that equal a locale token.
  // Full words: Ukrainian|Albanian|Italian|English
  // Short codes as leading segment: Uk|Sq|It|En (followed by uppercase or _)
  // Identifier-token match, NOT substring — Items, Enabled, Square, Editable PASS.

  log('── Check 3: Locale-NAME export families ─────────────────────────────');

  const LOCALE_FULL_WORDS = new Set(['Ukrainian', 'Albanian', 'Italian', 'English']);
  const LOCALE_SHORT_CODES = new Set(['Uk', 'Sq', 'It', 'En']);
  const EXPORT_RE = /export\s+const\s+(\w+)/;

  for (const f of STORY_FILES.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = EXPORT_RE.exec(lines[i]);
      if (!m) continue;
      const name = m[1];
      const segments = segmentIdentifier(name);
      const hasLocaleToken = segments.some(seg =>
        LOCALE_FULL_WORDS.has(seg) || LOCALE_SHORT_CODES.has(seg)
      );
      if (hasLocaleToken && !isAllowlisted(f, name, 3)) {
        fail(f, i + 1, 'locale-name-export',
          `Export '${name}' contains a locale-NAME segment (${segments.join('|')}). ` +
          `Use 'LocaleStress' instead — per-locale export families are FORBIDDEN (§13/§14, Check 3).`);
      }
    }
  }

  // ── Check 4: Hardcoded locale pins AND props ─────────────────────────────
  // Broadened by Task 468: catches globals.locale, args.locale / meta.args.locale,
  // and JSX locale="…" / locale={'…'} props — ALL four locales (uk/sq/en/it).
  // Legal: locale resolved from context.globals.locale (toolbar-reactive);
  //        viewport-only pin; function parameter defaults (`locale = 'en'`).
  // Fixture data files (*.fixtures.*) are excluded — they carry locale as data.

  log('── Check 4: Hardcoded locale pins (globals + args + props) ─────────');

  const isFixtureFile = (f) => /[/\\]fixtures[/\\]/.test(f) || f.includes('.fixtures.');

  // Detect whether a line is inside a function parameter list / destructuring
  // (where `locale = 'en'` is a legal default), versus inside JSX or an object
  // literal (where it is a hardcoded pin).
  // Strategy: track unclosed `<Tag` across lines for JSX context.
  // For the `=` form, only flag when inside JSX context (not param defaults).
  // For the `:` form, always flag (object property = pin).

  for (const f of STORY_FILES.filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !isFixtureFile(f))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    let inJsxTag = false; // tracks unclosed <Component ... (multiline JSX opening)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      if (/^\s*(import|export\s+type|type\s+|interface\s+)/.test(line)) continue;
      if (/context\??\.globals\??\.locale|ctx\??\.globals\??\.locale/.test(line)) continue;

      // Track JSX context: <Component opens; /> or > closes.
      // Snapshot BEFORE clearing so a line like `locale="en" />` is still in-JSX.
      if (/<[A-Z]/.test(line)) inJsxTag = true;
      const lineIsJsx = inJsxTag;
      if (inJsxTag && (/\/>/.test(line) || />[^<]*$/.test(line))) inJsxTag = false;

      // (i) locale PROPERTY (colon) with any of uk/sq/en/it — catches globals, args, meta.args
      const localePropMatch = /\blocale\s*:\s*['"](uk|sq|en|it)['"]/.exec(line);
      if (localePropMatch) {
        fail(f, i + 1, 'locale-pin',
          `Hardcoded locale:'${localePropMatch[1]}' pin. Stories must be toolbar-reactive — ` +
          `resolve locale from context.globals.locale (§13/§14, Check 4).`);
        continue;
      }

      // (ii) JSX locale="…" or locale={'…'} prop — all four locales
      // Uses the snapshot taken before the close-tag cleared inJsxTag.
      if (lineIsJsx) {
        const jsxLocaleMatch = /\blocale\s*=\s*(?:["'](uk|sq|en|it)["']|\{\s*["'](uk|sq|en|it)["']\s*\})/.exec(line);
        if (jsxLocaleMatch) {
          const val = jsxLocaleMatch[1] || jsxLocaleMatch[2];
          fail(f, i + 1, 'locale-pin',
            `Hardcoded locale="${val}" JSX prop. Stories must be toolbar-reactive (§13/§14, Check 4).`);
        }
      }
    }
  }

  // ── Check 5: Known hardcoded English title literals in fixture files ──────────

  log('── Check 5: Hardcoded title literals in fixtures ───────────────────');

  // After Task 380 migration, these specific strings must NOT appear as raw literals
  // in src/stories/fixtures/**. The fixture must use storyT() instead.
  const FORBIDDEN_TITLE_LITERALS = [
    // English titles that should be in storybook.listing.* namespace
    /title\s*:\s*['"]Modern Apartment in Tirana/,
    /title\s*:\s*['"]Cozy Studio in Sauk/,
    /title\s*:\s*['"]Villa with Garden/,
    /title\s*:\s*['"]Studio Flat in Sauk/,
    /title\s*:\s*['"]Office Space in/,
    /title\s*:\s*['"]Penthouse in/,
    /title\s*:\s*['"]Beach House/,
    /title\s*:\s*['"]Mountain Retreat/,
    /title\s*:\s*['"]Renovated Apartment/,
    // Ukrainian hardcoded title (was in LISTING_FIXTURE_LONG_TITLE)
    /title\s*:\s*['"]Апартаменти в центрі/,
  ];

  const fixtureFiles = collectFiles(join(root, 'src', 'stories', 'fixtures'), ['.ts', '.tsx']);
  for (const f of fixtureFiles) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      for (const pattern of FORBIDDEN_TITLE_LITERALS) {
        if (pattern.test(line)) {
          fail(f, i + 1, 'hardcoded-title-literal',
            'Raw title literal in fixture. Use storyT(locale, "storybook.listing.KEY") (§14.2). ' +
            line.trim().slice(0, 80));
        }
      }
    }
  }

  // ── Check 6: storybook.* key parity across sq/en/uk/it ────────────────────

  log('── Check 6: storybook.* namespace key parity ───────────────────────');

  const LOCALES = ['sq', 'en', 'uk', 'it'];
  const messageData = {};
  let messagesOk = true;

  for (const locale of LOCALES) {
    const filePath = join(root, 'messages', `${locale}.json`);
    try {
      messageData[locale] = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (err) {
      logErr(`  ❌ Cannot read messages/${locale}.json: ${err.message}`);
      messagesOk = false;
    }
  }

  if (messagesOk) {
    const collectStorybookKeys = (obj, prefix = '') => {
      const keys = [];
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          keys.push(...collectStorybookKeys(value, path));
        } else {
          keys.push(path);
        }
      }
      return keys;
    };

    const sbKeySets = {};
    for (const locale of LOCALES) {
      const sbNs = messageData[locale]?.storybook;
      if (!sbNs) {
        violations.push({
          file: `messages/${locale}.json`,
          line: 1,
          rule: 'storybook-ns-missing',
          detail: `messages/${locale}.json is missing the "storybook" namespace.`,
        });
        sbKeySets[locale] = new Set();
      } else {
        sbKeySets[locale] = new Set(collectStorybookKeys(sbNs, 'storybook'));
      }
    }

    const primary = 'en';
    const primaryKeys = sbKeySets[primary];
    for (const locale of LOCALES) {
      if (locale === primary) continue;
      const localeKeys = sbKeySets[locale];
      const missing = [...primaryKeys].filter(k => !localeKeys.has(k));
      const extra   = [...localeKeys].filter(k => !primaryKeys.has(k));
      if (missing.length === 0 && extra.length === 0) {
        log(`  ✅ storybook.* ${locale} — ${localeKeys.size} keys (matches ${primary})`);
      } else {
        missing.forEach(k => {
          violations.push({ file: `messages/${locale}.json`, line: 1, rule: 'storybook-parity', detail: `Missing storybook key: ${k}` });
        });
        extra.forEach(k => {
          violations.push({ file: `messages/${locale}.json`, line: 1, rule: 'storybook-parity', detail: `Extra storybook key in ${locale}: ${k}` });
        });
      }
    }
    if (primaryKeys.size > 0) {
      log(`  ✅ storybook.* en  — ${primaryKeys.size} keys (reference)`);
    }
  }

  // ── Check 7: Inline locale maps in story files ────────────────────────────
  // Any { uk: '...' } / { sq: '...' } / { it: '...' } object literal in a .stories.tsx
  // is an inline locale map — all story text must come via storyT() from messages/*.json.

  log('── Check 7: Inline locale maps (uk:/sq:/it: in stories) ───────────────');

  for (const f of STORY_FILES.filter(f => f.endsWith('.tsx'))) {
    checkFile(f, [
      {
        pattern: /\buk\s*:\s*['"`]/,
        rule: 'inline-locale-map',
        detail: "Inline locale map with uk: literal. Use storyT(locale, 'storybook.*') instead (§14.6).",
        shouldSkip: (line) => {
          const trimmed = line.trimStart();
          if (/^\s*(import|export|type|interface|\/\/)/.test(line)) return true;
          if (trimmed.startsWith('*')) return true;
          if (line.includes('storyT') || line.includes('useStoryMessages')) return true;
          return false;
        },
      },
      {
        pattern: /\bsq\s*:\s*['"`]/,
        rule: 'inline-locale-map',
        detail: "Inline locale map with sq: literal. Use storyT(locale, 'storybook.*') instead (§14.6).",
        shouldSkip: (line) => {
          const trimmed = line.trimStart();
          if (/^\s*(import|export|type|interface|\/\/)/.test(line)) return true;
          if (trimmed.startsWith('*')) return true;
          if (line.includes('storyT') || line.includes('useStoryMessages')) return true;
          return false;
        },
      },
    ]);
  }

  // ── Check 8: messages/uk.json values with Latin only (no Cyrillic) ───────────
  // Validates that uk translations use Cyrillic, not transliterated Latin.
  // Allowlist: URL/brand/abbreviation strings legitimately kept in Latin.

  log('── Check 8: uk.json Latin-only values (non-Cyrillic check) ────────────');

  const LATIN_ALLOWLIST_PATTERNS = [
    // URL paths, slugs, email addresses, email domains (i18n-rules.md §5a: email placeholders never translated)
    /https?:\/\//, /^[a-z0-9-]+\.[a-z]{2,}/, /^@/, /^[A-Z]+$/,
    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
    // City names (Albania) and brand names that appear in all locales
    /^(Tirana|Durrës|Vlorë|Shkodër|Berat|Kombinat|Sauk|Blloku|Elbasan)$/i,
    // WhatsApp, Email, brand identifiers
    /WhatsApp|Email|SEO|URL|SMS|HTTP/i,
    // Numbers, special chars, currency
    /^[\d\s€$+\-\.→←×÷%,()[\]{}<>]+$/,
    // Arrow-containing sort labels (A→Z etc.) — intentional mixed-script
    /[A-Z]→[A-Z]/,
    // Short mixed abbreviations (sizes, units)
    /^(XS|SM|LG|XL|XXL|m²|m³|km)$/,
  ];

  if (messagesOk && messageData.uk) {
    const flattenValues = (obj, prefix = '') => {
      const results = [];
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          results.push(...flattenValues(value, path));
        } else if (typeof value === 'string') {
          results.push({ path, value });
        }
      }
      return results;
    };

    const HAS_CYRILLIC = /[Ѐ-ӿ]/;
    const HAS_LATIN_LETTER = /[a-zA-Z]/;

    for (const { path, value } of flattenValues(messageData.uk.storybook ?? {})) {
      if (!value || !HAS_LATIN_LETTER.test(value)) continue; // no Latin → pass
      if (HAS_CYRILLIC.test(value)) continue; // has Cyrillic → mixed, probably OK
      const isAllowed = LATIN_ALLOWLIST_PATTERNS.some(pat => pat.test(value));
      if (!isAllowed) {
        violations.push({
          file: 'messages/uk.json',
          line: 1,
          rule: 'uk-latin-only',
          detail: `storybook.${path} has Latin letters but no Cyrillic: "${value.slice(0, 60)}" (§14.6)`,
        });
      }
    }
    log('  ✅ uk.json Cyrillic check complete');
  }

  // ── Check 9: Hardcoded user-facing literals in runtime components ──────────────
  // Scans src/components/**/*.tsx and src/modules/**/*.tsx (excluding *.stories.tsx)
  // for raw English string literals in JSX that are user-facing.

  log('── Check 9: Runtime component hardcoded literals ────────────────────');

  // Task 612 — also exclude test files (`.test.tsx` / `__tests__/**`): a vitest RTL assertion
  // like `getByRole('button', { name: 'Next' })` matches a Mantine `aria-label`, not a hardcoded
  // user-facing literal — the same "not runtime UI copy" reasoning that already excludes
  // `.stories.tsx`.
  const isNonRuntimeFile = (f) => f.endsWith('.stories.tsx') || f.endsWith('.test.tsx') || f.includes('__tests__');
  const RUNTIME_FILES = [
    ...collectFiles(join(root, 'src', 'components'), ['.tsx']).filter(f => !isNonRuntimeFile(f)),
    ...collectFiles(join(root, 'src', 'modules'), ['.tsx']).filter(f => !isNonRuntimeFile(f)),
  ];

  const RUNTIME_HARDCODE_FORBIDDEN = [
    'Hide column', 'Newest first', 'Oldest first', 'Sort A→Z', 'Sort Z→A',
    'Sort low→high', 'Sort high→low', 'Previous', 'Next',
  ];

  const RUNTIME_HARDCODE_PATTERNS = RUNTIME_HARDCODE_FORBIDDEN.map(str => ({
    pattern: new RegExp(`['"\`>]${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`<]`),
    rule: 'runtime-hardcode',
    detail: `Hardcoded "${str}" in runtime component. Use t() from next-intl (§14.6).`,
    shouldSkip: (line) => {
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) return true;
      if (/\bt\s*\(/.test(line) || /tSort\s*\(/.test(line) || /useTranslations/.test(line)) return true;
      if (/^\s*(import|export\s+type|type\s+|interface\s+)/.test(line)) return true;
      return false;
    },
  }));

  for (const f of RUNTIME_FILES) {
    checkFile(f, RUNTIME_HARDCODE_PATTERNS.map(p => ({ ...p, skipComments: true })));
  }

  // ── Check 10: English JSX string-prop literals and text children in stories ──
  // Flags raw English string literals in JSX prop attributes AND JSX text children
  // in *.stories.tsx files that are NOT produced by storyT()/t().
  //
  // Prop attribute forms caught (for watched prop names):
  //   (a) Double-quote:              title="Listings"
  //   (b) Single-quote:              title='Listings'
  //   (c) Expression double-quote:   title={"Listings"}
  //   (d) Expression single-quote:   title={'Listings'}
  //   (e) Template literal (no ${…}): title={`Listings`}
  //
  // JSX text children caught:
  //   (f) Text directly between > and < on the same line (no braces/nested tags)
  //       e.g. <Button>Submit</Button>  →  "Submit" flagged
  //
  // Object property / args forms caught (defense-in-depth, Task 392):
  //   (g) Object property placeholder literal:  placeholder: 'Enter password'
  //   (h) Standalone JSX text line (own line, pure alpha words):  Section body content
  //   (i) Expression string child with pure words:  {'Content bounded within this container'}
  //
  // Exceptions: storyT / t() on the same line, import lines, comment lines,
  //             allowlisted proper nouns/brands (JSX_PROP_ALLOWLIST).
  //
  // Gate wiring: Task 390 added (a) only. Task 391 added (b)–(f) + test suite.
  //              Task 392 added (g)–(i) — form-agnostic multi-syntax coverage.
  // Docs: §14.7.

  log('── Check 10: English JSX string-prop literals in stories ───────────');

  const WATCHED_PROP_NAMES_STR = 'title|description|label|placeholder|heading|subject|cta|alt|aria-label|name';

  // Five prop-value regex patterns (one per form). Reset lastIndex before each exec().
  const PROP_PATTERNS_10 = [
    // (a) double-quote: title="Foo"
    new RegExp('\\b(' + WATCHED_PROP_NAMES_STR + ')\\s*=\\s*"([^"]*)"', 'g'),
    // (b) single-quote: title='Foo'
    new RegExp("\\b(" + WATCHED_PROP_NAMES_STR + ")\\s*=\\s*'([^']*)'", 'g'),
    // (c) expression double-quote: title={"Foo"}
    new RegExp('\\b(' + WATCHED_PROP_NAMES_STR + ')\\s*=\\s*\\{\\s*"([^"]*)"\\s*\\}', 'g'),
    // (d) expression single-quote: title={'Foo'}
    new RegExp("\\b(" + WATCHED_PROP_NAMES_STR + ")\\s*=\\s*\\{\\s*'([^']*)'\\s*\\}", 'g'),
    // (e) template literal (no interpolation): title={`Foo`}
    new RegExp('\\b(' + WATCHED_PROP_NAMES_STR + ')\\s*=\\s*\\{\\s*`([^`$]*)`\\s*\\}', 'g'),
  ];

  // (f) JSX text children: text between > and < not containing braces/nested tags/newlines
  const JSX_TEXT_CHILD_RE = />([^<>{}\n]+)</g;

  // (g) Object-property placeholder literal: placeholder: 'Enter password'
  //     Watches only `placeholder` (the most common args-object hardcode form).
  //     Values containing '/' are storage-routing titles (e.g. 'Category/Name') — skipped.
  const OBJ_PROP_PLACEHOLDER_RE = /\bplaceholder\s*:\s*['"]([^'"]+)['"]/g;

  // (i) Expression string child whose content is ONLY alpha words separated by spaces:
  //     {'Content bounded within this container'} — no punctuation, numbers, or special chars.
  //     Single-word PascalCase component names ({'Submit'}) are excluded by the space requirement.
  const EXPR_STRING_CHILD_RE = /\{['"]([A-Z][a-zA-Z]+(?:\s[a-zA-Z]+)+)['"]\}/g;

  for (const f of STORY_FILES.filter(f => f.endsWith('.stories.tsx'))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      if (/^\s*(import|export\s+type|type\s+|interface\s+)/.test(line)) continue;
      // Already localized via storyT / t()
      if (line.includes('storyT') || /\bt\s*\(/.test(line) || line.includes('useStoryMessages')) continue;

      // (a)–(e): Prop value variants
      for (const re of PROP_PATTERNS_10) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(line)) !== null) {
          const attrName = match[1];
          const value = match[2];
          if (!isEnglishish(value)) continue;
          if (JSX_PROP_ALLOWLIST.some(p => p.test(value))) continue;
          fail(f, i + 1, 'jsx-prop-literal',
            `Hardcoded English literal in JSX prop ${attrName}="${value}". ` +
            `Use storyT(locale, 'storybook.*') instead (§14.7).`);
        }
      }

      // (f): JSX text children
      JSX_TEXT_CHILD_RE.lastIndex = 0;
      let textMatch;
      while ((textMatch = JSX_TEXT_CHILD_RE.exec(line)) !== null) {
        const text = textMatch[1].trim();
        if (!isEnglishish(text)) continue;
        if (JSX_PROP_ALLOWLIST.some(p => p.test(text))) continue;
        fail(f, i + 1, 'jsx-text-literal',
          `Hardcoded English text child "${text.slice(0, 60)}". ` +
          `Use storyT(locale, 'storybook.*') instead (§14.7).`);
      }

      // (g): Object-property placeholder literal
      OBJ_PROP_PLACEHOLDER_RE.lastIndex = 0;
      let gMatch;
      while ((gMatch = OBJ_PROP_PLACEHOLDER_RE.exec(line)) !== null) {
        const value = gMatch[1];
        if (value.includes('/')) continue; // routing title pattern (e.g. 'Category/Name')
        if (!isEnglishish(value)) continue;
        if (JSX_PROP_ALLOWLIST.some(p => p.test(value))) continue;
        fail(f, i + 1, 'jsx-prop-literal',
          `Hardcoded English literal in object-property placeholder="${value}". ` +
          `Use storyT(locale, 'storybook.*') instead (§14.7, form g).`);
      }

      // (h): Standalone JSX text line (pure alpha-word line with spaces, no special chars)
      //      Catches multi-line JSX text like:
      //        <div>
      //          Section body content   ← flagged by (h)
      //        </div>
      if (/^[A-Z][a-zA-Z]+(?:\s[a-zA-Z]+)+$/.test(trimmed)) {
        fail(f, i + 1, 'jsx-text-literal',
          `Hardcoded English standalone text line "${trimmed.slice(0, 60)}". ` +
          `Use storyT(locale, 'storybook.*') instead (§14.7, form h).`);
      }

      // (i): Expression string child with pure alpha words
      //      Catches: {'Content bounded within this container'}
      //      Excludes: {'StatusChangeControl'} (no space), {'Phone (valid...)'}  (has parens)
      EXPR_STRING_CHILD_RE.lastIndex = 0;
      let iMatch;
      while ((iMatch = EXPR_STRING_CHILD_RE.exec(line)) !== null) {
        const value = iMatch[1];
        if (!isEnglishish(value)) continue;
        if (JSX_PROP_ALLOWLIST.some(p => p.test(value))) continue;
        fail(f, i + 1, 'jsx-text-literal',
          `Hardcoded English expression text child "${value.slice(0, 60)}". ` +
          `Use storyT(locale, 'storybook.*') instead (§14.7, form i).`);
      }
    }
  }

  // ── Check 11: sm:flex-row sm:flex-wrap in stories (toolbar overflow at 640px) ─
  // A multi-control toolbar row that uses sm:flex-row (640px breakpoint) wraps
  // items in a non-full-width way for long translations (uk/it) at 640-767px.
  // Toolbar control rows with flex-wrap MUST use md:flex-row (768px) so that
  // at <768px all controls stack full-width — no awkward partial rows.
  //
  // Rule: any story line containing BOTH "sm:flex-row" AND "sm:flex-wrap" is banned.
  //       Use "md:flex-row md:flex-wrap" instead (§14 P0 mobile gate).
  //
  // Added by Task 392 follow-up (2026-06-05).

  log('── Check 11: sm:flex-row sm:flex-wrap (toolbar 640px overflow) ────────');

  for (const f of STORY_FILES.filter(f => f.endsWith('.stories.tsx'))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      // Flag lines that have BOTH sm:flex-row AND sm:flex-wrap
      if (line.includes('sm:flex-row') && line.includes('sm:flex-wrap')) {
        fail(f, i + 1, 'toolbar-sm-flex-wrap',
          'sm:flex-row + sm:flex-wrap on a toolbar control row causes long translations (uk/it) ' +
          'to wrap non-full-width at 640px. Use md:flex-row md:flex-wrap (768px breakpoint) + ' +
          'max-md:w-full on each control (§14 P0 mobile gate, Task 392).');
      }
    }
  }

  // ── Check 12: Viewport/width-named exports (identifier-token rule) ────────
  // Splits export name into PascalCase segments + underscore splits.
  // FAIL if any segment exactly equals a viewport keyword or width number.

  log('── Check 12: Viewport/width-named exports ────────────────────────────');

  const VIEWPORT_KEYWORDS = new Set([
    'Mobile', 'Tablet', 'Desktop', 'Laptop', 'Wide', 'Huge',
  ]);
  const WIDTH_NUMBERS = new Set([
    '320', '375', '390', '768', '1024', '1280', '1440', '1920', '2560',
  ]);

  for (const f of STORY_FILES.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = EXPORT_RE.exec(lines[i]);
      if (!m) continue;
      const name = m[1];
      const segments = segmentIdentifier(name);
      const hasForbiddenSegment = segments.some(seg => {
        if (VIEWPORT_KEYWORDS.has(seg)) return true;
        if (WIDTH_NUMBERS.has(seg)) return true;
        // keyword+digits pattern: Mobile320, Tablet768, etc.
        const kwMatch = seg.match(/^(Mobile|Tablet|Desktop|Laptop|Wide|Huge)(\d+)$/);
        if (kwMatch) return true;
        // bare width number at segment level
        if (/^\d{3,4}$/.test(seg) && WIDTH_NUMBERS.has(seg)) return true;
        return false;
      });
      if (hasForbiddenSegment && !isAllowlisted(f, name, 12)) {
        fail(f, i + 1, 'viewport-width-export',
          `Export '${name}' contains a viewport/width segment (${segments.join('|')}). ` +
          `Use a real-mode name or add a file-scoped allowlist entry (§14.3, Check 12).`);
      }
    }
  }

  // ── Check 13: Duplicate-family export names (Proof/Demo/Filtered/Canonical) ──

  log('── Check 13: Duplicate-family export names ─────────────────────────────');

  const FAMILY_KEYWORDS = new Set(['Proof', 'Demo', 'Canonical', 'Filtered']);

  for (const f of STORY_FILES.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = EXPORT_RE.exec(lines[i]);
      if (!m) continue;
      const name = m[1];
      const segments = segmentIdentifier(name);
      const hasFamilySegment = segments.some(seg => {
        if (FAMILY_KEYWORDS.has(seg)) return true;
        // Canonical+digits: Canonical320, Canonical375
        if (/^Canonical\d+$/.test(seg)) return true;
        return false;
      });
      if (hasFamilySegment && !isAllowlisted(f, name, 13)) {
        fail(f, i + 1, 'duplicate-family-export',
          `Export '${name}' contains a duplicate-family segment (${segments.join('|')}). ` +
          `Rename to a real-scenario name or add a file-scoped allowlist entry (§14.3, Check 13).`);
      }
    }
  }

  // ── Check 14: Off-scale Mantine Button size (Task 520 — Density Correction gate) ──

  log('── Check 14: Mantine Button size="lg"|"xl" (off-scale, Task 520) ──────');

  const MANTINE_BUTTON_SCOPE_FILES = [
    ...collectFiles(join(root, 'src', 'stories', 'mantine'), ['.tsx', '.ts']),
    ...collectFiles(join(root, 'src', 'design-system', 'mantine', 'patterns'), ['.tsx', '.ts']),
  ];

  const OFFSCALE_SIZE_RE = /size=["'](lg|xl)["']/;
  const ALLOW_ESCAPE_RE = /@allow-button-size/;

  for (const f of MANTINE_BUTTON_SCOPE_FILES) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = content.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trimStart();
      const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
      const openTagIdx = line.indexOf('<Button');
      const isRealOpenTag = openTagIdx !== -1 && /^<Button(\s|>|\/|$)/.test(line.slice(openTagIdx));
      if (!isComment && isRealOpenTag) {
        // Collect the opening-tag block (may span multiple lines) until a bare '>' closes it.
        let end = i;
        let tagLines = [line];
        let closed = />/.test(line.slice(openTagIdx));
        while (!closed && end + 1 < lines.length) {
          end++;
          tagLines.push(lines[end]);
          if (/>/.test(lines[end])) closed = true;
        }
        const sizeLineOffset = tagLines.findIndex(l => OFFSCALE_SIZE_RE.test(l));
        if (sizeLineOffset !== -1) {
          const sizeLineIdx = i + sizeLineOffset;
          const sizeLine = lines[sizeLineIdx];
          const prevLine = sizeLineIdx > 0 ? lines[sizeLineIdx - 1] : '';
          const escaped = ALLOW_ESCAPE_RE.test(sizeLine) || ALLOW_ESCAPE_RE.test(prevLine);
          if (!escaped) {
            const sizeVal = sizeLine.match(OFFSCALE_SIZE_RE)[1];
            fail(f, sizeLineIdx + 1, 'mantine-button-offscale-size',
              `Mantine <Button size="${sizeVal}"> is off-scale — canonical default is size="sm" ` +
              `(14px) + 44px min-height (theme.ts; docs/tailadmin-style-reference.md §6 Density ` +
              `Correction, Task 492). Remove the size override, or add "// @allow-button-size <reason>" ` +
              `on the previous line for a justified exception (Task 520).`);
          }
        }
        i = end + 1;
        continue;
      }
      i++;
    }
  }

  // ── Check 15: Unregistered Mantine colour — forms A/B/C (Task 685, widened Task 686) ──

  log('── Check 15: Unregistered Mantine colour prop (Task 685/686) ────────');

  const COLOR_SCOPE_FILES = collectFiles(join(root, 'src'), ['.ts', '.tsx']);

  // Registered set is derived from theme.ts's `colors: { … }` object at runtime — never a
  // hard-coded literal — so it tracks any future colour addition/removal with no script edit.
  function loadRegisteredColorNames(rootDir) {
    const themePath = join(rootDir, 'src', 'design-system', 'mantine', 'theme.ts');
    let themeContent;
    try { themeContent = readFileSync(themePath, 'utf8'); } catch { return new Set(); }
    const match = themeContent.match(/colors:\s*\{([^}]*)\}/s);
    if (!match) return new Set();
    return new Set(
      match[1]
        .split(',')
        .map((entry) => entry.split(':')[0].trim())
        .filter((name) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
    );
  }

  // Stock Mantine palette keys, derived at runtime from the installed package's own default
  // colour table — never retyped (A2 discipline, inherited from Task 685 R3). Tracks any future
  // Mantine colour addition/removal with no script edit. Always resolved against the real
  // repository root (module-level ROOT), never the scan `root` argument — the installed
  // node_modules package is a fixed dependency of THIS script, not of whatever directory is being
  // scanned (a vitest temp fixture root has no node_modules of its own to derive from).
  function loadStockPaletteNames(rootDir) {
    const defaultColorsPath = join(
      rootDir, 'node_modules', '@mantine', 'core', 'esm', 'core', 'MantineProvider', 'default-colors.mjs'
    );
    let content;
    try { content = readFileSync(defaultColorsPath, 'utf8'); } catch { return new Set(); }
    const objMatch = content.match(/const DEFAULT_COLORS\s*=\s*\{([\s\S]*?)\n\};/);
    if (!objMatch) return new Set();
    const names = new Set();
    for (const m of objMatch[1].matchAll(/^\s{2}([A-Za-z_$][A-Za-z0-9_$]*):\s*\[/gm)) {
      names.add(m[1]);
    }
    return names;
  }

  const REGISTERED_COLORS = loadRegisteredColorNames(root);
  const STOCK_PALETTE_NAMES = loadStockPaletteNames(ROOT);

  // Resolved outside theme.colors by Mantine's own parseThemeColor() — legal, not a theme
  // lookup (node_modules/@mantine/core/esm/core/MantineProvider/color-functions/parse-theme-color).
  const MANTINE_COLOR_KEYWORDS = new Set(['dimmed', 'bright', 'white', 'black']);

  // CSS-wide keywords and any CSS function call are legal colour-prop values under a
  // repository-wide scope (F3, Task 686 §3.10) — without this passthrough, legal values like
  // `bg="transparent"` or `c="oklch(0.6 0.2 20)"` would become build-blocking false positives.
  const CSS_WIDE_KEYWORDS = new Set(['transparent', 'currentColor', 'inherit', 'initial', 'unset', 'revert', 'none']);
  const CSS_FUNCTION_CALL_RE = /^[a-z-]+\(/;

  const COLOR_PROP_RE = /\b(color|c|bg)="([^"]+)"/g;
  const COLOR_VAR_RE = /var\(--mantine-color-([a-z]+)-([0-9])\)/g;
  const COLOR_MAP_DECL_RE = /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::[^=]+)?=\s*\{/g;
  const COLOR_MAP_VALUE_RE = /:\s*['"]([A-Za-z][A-Za-z0-9]*)(?:\.([0-9]))?['"]/g;

  function isRegisteredColorValue(value) {
    if (value.startsWith('#')) return true;
    if (CSS_FUNCTION_CALL_RE.test(value)) return true;
    if (CSS_WIDE_KEYWORDS.has(value)) return true;
    if (MANTINE_COLOR_KEYWORDS.has(value)) return true;
    const [name, shade] = value.split('.');
    if (shade !== undefined && !/^[0-9]$/.test(shade)) return false;
    return REGISTERED_COLORS.has(name);
  }

  function isStockButUnregistered(name) {
    return STOCK_PALETTE_NAMES.has(name) && !REGISTERED_COLORS.has(name);
  }

  if (REGISTERED_COLORS.size === 0) {
    fail(join(root, 'src', 'design-system', 'mantine', 'theme.ts'), 0, 'colour-registered-set-underivable',
      `Check 15 could not derive a registered colour set from theme.ts's colors:{…} object. ` +
      `Refusing to scan src/ with an empty registered set — that would flag every legal colour ` +
      `value as a violation. Fix theme.ts's colors:{…} object.`);
  } else if (STOCK_PALETTE_NAMES.size === 0) {
    fail(join(ROOT, 'node_modules', '@mantine', 'core', 'esm', 'core', 'MantineProvider', 'default-colors.mjs'), 0,
      'colour-stock-set-underivable',
      `Check 15 could not derive the stock Mantine palette set from the installed ` +
      `default-colors.mjs. Refusing to scan src/ with an empty stock set — Forms B and C would ` +
      `silently never fire. Reinstall @mantine/core or check the file's shape.`);
  } else {
    for (const f of COLOR_SCOPE_FILES) {
      let content;
      try { content = readFileSync(f, 'utf8'); } catch { continue; }
      const lines = content.split('\n');

      // Form A — literal (color|c|bg)="value" prop.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
        if (isComment) continue;
        for (const match of line.matchAll(COLOR_PROP_RE)) {
          const [, prop, value] = match;
          if (!isRegisteredColorValue(value)) {
            fail(f, i + 1, 'unregistered-mantine-colour',
              `${prop}="${value}" names a colour absent from theme.ts's registered set ` +
              `(${[...REGISTERED_COLORS].join(', ')}). Use a registered colour, a shade of one ` +
              `(e.g. "gray.5"), a Mantine keyword (dimmed/bright/white/black), a CSS-wide keyword, ` +
              `or a CSS function call / #hex value.`);
          }
        }
      }

      // Form B — var(--mantine-color-<stock-but-unregistered>-<digit>). Re-catches an
      // unregistered ramp smuggled in through a CSS variable (Form A's var() passthrough stays).
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
        if (isComment) continue;
        for (const match of line.matchAll(COLOR_VAR_RE)) {
          const [full, name] = match;
          if (isStockButUnregistered(name)) {
            fail(f, i + 1, 'unregistered-mantine-colour-var',
              `${full} names a colour absent from theme.ts's registered set ` +
              `(${[...REGISTERED_COLORS].join(', ')}). Register '${name}' in theme.ts or use a ` +
              `registered colour's CSS variable.`);
          }
        }
      }

      // Form C — a *COLOR*-named object literal whose string value is a stock-but-unregistered
      // palette name (the map shape; free-form expressions remain outside the gate, §3.8).
      for (const declMatch of content.matchAll(COLOR_MAP_DECL_RE)) {
        const ident = declMatch[1];
        if (!/COLOR/i.test(ident)) continue;
        const openBraceIdx = declMatch.index + declMatch[0].length - 1;
        let depth = 0;
        let endIdx = -1;
        for (let p = openBraceIdx; p < content.length; p++) {
          if (content[p] === '{') depth++;
          else if (content[p] === '}') {
            depth--;
            if (depth === 0) { endIdx = p; break; }
          }
        }
        if (endIdx === -1) continue;
        const blockContent = content.slice(openBraceIdx, endIdx + 1);
        const startLine = content.slice(0, openBraceIdx).split('\n').length;
        const blockLines = blockContent.split('\n');
        for (let bi = 0; bi < blockLines.length; bi++) {
          const bLine = blockLines[bi];
          const bTrimmed = bLine.trimStart();
          if (bTrimmed.startsWith('//') || bTrimmed.startsWith('*') || bTrimmed.startsWith('/*')) continue;
          for (const vMatch of bLine.matchAll(COLOR_MAP_VALUE_RE)) {
            const [, name, shade] = vMatch;
            if (isStockButUnregistered(name)) {
              fail(f, startLine + bi, 'unregistered-mantine-colour-map',
                `${ident}[…] = '${name}${shade ? `.${shade}` : ''}' names a colour absent from ` +
                `theme.ts's registered set (${[...REGISTERED_COLORS].join(', ')}). Register ` +
                `'${name}' in theme.ts or use a registered colour.`);
            }
          }
        }
      }
    }
  }

  // ── Check 16: Wall-clock fixture values (Task 697, §14.10; corrected Task 698) ─

  log('── Check 16: Wall-clock fixture values (Task 697/698, §14.10) ─────────');

  // Flags Date.now() used anywhere as a value, and bare zero-argument new Date() used as a
  // value — both outside comments AND outside string/template literals. Deliberately does NOT
  // flag new Date(<non-empty argument>): a frozen literal (new Date('2026-01-01T00:00:00.000Z'))
  // or an expression derived from a frozen constant
  // (new Date(FIXTURE_ANCHOR_MS - 2 * 86_400_000)) is the required fix, not a second violation —
  // over-flagging either form is a gate defect (Task 697 I6.4).
  //
  // Matching runs against a comment/string-masked copy of the whole file (not line-by-line), so:
  //   - a trailing `// … new Date() …` comment is masked and never matches (Task 698 F3);
  //   - `'… new Date() …'` / `"… new Date() …"` / a non-interpolated `` `…` `` template literal
  //     is masked and never matches (Task 698 F3);
  //   - an apostrophe that does NOT close on its own line (JSX text `It's`, a regex literal
  //     `/don't/`) is treated as ordinary code, not as the start of a string, so it cannot
  //     swallow a real violation further down the file (Task 698 review F1);
  //   - a `new` / `Date()` pair split across a line break still matches, since `\s` in the regex
  //     already spans the intervening newline once masking removes the comment/string noise
  //     around it (Task 698 F3).
  // A template literal containing `${…}` interpolation is left unmasked (treated as ordinary
  // code) so a real `` `${new Date()}` `` violation inside the interpolation is still caught.
  const WALLCLOCK_DATE_NOW_RE = /\bDate\.now\(\)/g;
  const WALLCLOCK_BARE_NEW_DATE_RE = /\bnew\s+Date\(\s*\)/g;

  function maskCommentsAndStrings(content) {
    let out = '';
    let i = 0;
    const n = content.length;
    while (i < n) {
      const two = content.slice(i, i + 2);
      if (two === '//') {
        let j = i;
        while (j < n && content[j] !== '\n') { out += ' '; j++; }
        i = j;
        continue;
      }
      if (two === '/*') {
        out += '  ';
        let j = i + 2;
        while (j < n && content.slice(j, j + 2) !== '*/') {
          out += content[j] === '\n' ? '\n' : ' ';
          j++;
        }
        if (j < n) { out += '  '; j += 2; } else { j = n; }
        i = j;
        continue;
      }
      const ch = content[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        // A JS single-/double-quoted string literal cannot contain a RAW line break, so a quote
        // with no matching close before the next newline is not a string delimiter at all — it is
        // an apostrophe in JSX text (<span>It's brand new</span>) or inside a regex literal
        // (/don't/). Masking from there to the next stray quote would swallow real code and
        // silently hide a genuine violation further down the file (Task 698 review F1).
        // A backslash line-continuation IS a legal way for a literal to span lines, so the scan
        // steps over any escaped character (including an escaped newline) and keeps looking.
        let close = -1;
        for (let j = i + 1; j < n; j++) {
          const cj = content[j];
          if (cj === '\\') { j++; continue; }
          if (cj === '\n') break;
          if (cj === quote) { close = j; break; }
        }
        if (close === -1) { out += ch; i++; continue; }
        // Keep the quote delimiters themselves in the masked output (not whitespace) so a
        // frozen literal like new Date('2026-01-01T00:00:00.000Z') doesn't mask down to
        // new Date(          ) — which would wrongly match the bare-new-Date() regex.
        out += quote;
        let j = i + 1;
        while (j < close) {
          // Preserve a continuation newline so line numbers stay exact.
          if (content[j] === '\\') { out += ' '; out += content[j + 1] === '\n' ? '\n' : ' '; j += 2; continue; }
          out += content[j] === '\n' ? '\n' : ' ';
          j++;
        }
        out += quote;
        i = close + 1;
        continue;
      }
      if (ch === '`') {
        const start = i;
        let j = i + 1;
        let depth = 0;
        let hasInterpolation = false;
        while (j < n) {
          if (content[j] === '\\' && j + 1 < n) { j += 2; continue; }
          if (depth === 0 && content[j] === '`') { j++; break; }
          if (depth === 0 && content[j] === '$' && content[j + 1] === '{') {
            hasInterpolation = true;
            depth = 1;
            j += 2;
            continue;
          }
          if (depth > 0) {
            if (content[j] === '{') depth++;
            else if (content[j] === '}') depth--;
            j++;
            continue;
          }
          j++;
        }
        const raw = content.slice(start, j);
        if (hasInterpolation) {
          out += raw; // leave as code — a real `${new Date()}` violation must still be caught
        } else {
          // Keep the backtick delimiters themselves (not whitespace) — same reason as the
          // quote-preservation above.
          for (let k = 0; k < raw.length; k++) {
            const c = raw[k];
            if (k === 0 || k === raw.length - 1) out += c;
            else out += (c === '\n' ? '\n' : ' ');
          }
        }
        i = j;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
  }

  function lineOf(content, index) {
    let line = 1;
    for (let k = 0; k < index; k++) if (content[k] === '\n') line++;
    return line;
  }

  for (const f of STORY_FILES) {
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    const masked = maskCommentsAndStrings(content);

    for (const m of masked.matchAll(WALLCLOCK_DATE_NOW_RE)) {
      fail(f, lineOf(masked, m.index), 'wall-clock-fixture-value',
        `Line uses Date.now() as a story fixture value. A rendered capture taken on a different ` +
        `calendar day will not be byte-identical. Derive the value from a frozen, named, ` +
        `documented anchor constant instead (docs/storybook-governance.md §14.10, Task 697).`);
    }
    for (const m of masked.matchAll(WALLCLOCK_BARE_NEW_DATE_RE)) {
      fail(f, lineOf(masked, m.index), 'wall-clock-fixture-value',
        `Line uses bare new Date() (current wall-clock instant) as a story fixture value. Use a ` +
        `frozen, named, documented anchor constant instead (docs/storybook-governance.md §14.10, ` +
        `Task 697).`);
    }
  }

  // ── Stale allowlist entry check ────────────────────────────────────────────

  log('── Stale allowlist entry check ──────────────────────────────────────');

  for (const entry of allowlist) {
    const entryPath = join(root, entry.file);
    if (!existsSync(entryPath)) {
      violations.push({
        file: entry.file,
        line: 0,
        rule: 'stale-allowlist-entry',
        detail: `Allowlist entry for '${entry.export}' points at non-existent file '${entry.file}'.`,
      });
      continue;
    }
    let content;
    try { content = readFileSync(entryPath, 'utf8'); } catch { continue; }
    const exportPattern = new RegExp(`export\\s+const\\s+${entry.export}\\b`);
    if (!exportPattern.test(content)) {
      violations.push({
        file: entry.file,
        line: 0,
        rule: 'stale-allowlist-entry',
        detail: `Allowlist entry for '${entry.export}' — export not found in '${entry.file}'.`,
      });
    }
  }

  return { violations, storyFilesCount: STORY_FILES.length, checksRan: 16 };
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { violations, storyFilesCount } = runGate(ROOT, { verbose: true });

  console.log('');
  if (violations.length === 0) {
    console.log(`✅ check:stories PASSED — ${storyFilesCount} files checked, 0 violations.`);
    process.exit(0);
  } else {
    console.error(`❌ check:stories FAILED — ${violations.length} violation(s):`);
    console.error('');
    for (const { file, line, rule, detail } of violations) {
      console.error(`  ${file}:${line}  [${rule}]`);
      console.error(`    ${detail}`);
    }
    console.error('');
    console.error('Fix all violations before building Storybook.');
    console.error('See docs/storybook-governance.md §14 for the rules.');
    process.exit(1);
  }
}
