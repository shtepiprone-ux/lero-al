#!/usr/bin/env node
/**
 * check-stories.mjs — Build-gating Storybook governance script.
 *
 * Checks all *.stories.tsx files and src/stories/** for banned patterns:
 *   1. layout:'centered'|'padded' — must use fullscreen + withCanvas
 *   2. Raw HTML controls (<button>/<input>/<select>/<textarea> in JSX)
 *   3. /Ukrainian/ story export names — use LocaleStress instead
 *   4. globals:{locale:'uk'} pins — stories must be toolbar-reactive
 *   5. Known hardcoded English user-facing title literals in fixtures
 *   6. storybook.* namespace key parity across sq/en/uk/it
 *
 * Exit 0 on clean tree. Exit non-zero on any violation.
 * Wired into prebuild-storybook, prestorybook, and CI.
 *
 * Usage:
 *   node scripts/check-stories.mjs
 *   npm run check:stories
 *
 * Added by Task 380 (Sprint 33 corrective, 2026-06-04).
 * docs/storybook-governance.md §14.3
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

// Story files: colocated *.stories.tsx + src/stories/**
const STORY_FILES = [
  ...collectFiles(join(ROOT, 'src'), ['.stories.tsx']),
  ...collectFiles(join(ROOT, 'src', 'stories'), ['.ts', '.tsx']).filter(
    f => !f.endsWith('.stories.tsx') // avoid double-counting
  ),
];

// ── Violation registry ─────────────────────────────────────────────────────────

const violations = [];
function fail(file, line, rule, detail) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  violations.push({ file: rel, line, rule, detail });
}

// ── Check helpers ──────────────────────────────────────────────────────────────

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
    // Skip full-line comments and import statements for most checks
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

// ── Check 1: Banned layout values ─────────────────────────────────────────────

console.log('── Check 1: Banned layout values ──────────────────────────────────');

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

// ── Check 2: Raw HTML controls ─────────────────────────────────────────────────

console.log('── Check 2: Raw HTML controls ──────────────────────────────────────');

// Match JSX opening tags: <button, <input, <select, <textarea
// Exclude false positives: type annotations, string literals, comments
// Detect raw HTML control elements in JSX context.
// Skip lines where the element tag appears inside a string literal (doc descriptions),
// e.g. 'instead of raw `<button>`' is documentation, not JSX.
const inStringLiteral = (tag) => (line) => {
  // If the tag is preceded by a quote/backtick character on the line → in a string
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

// ── Check 3: /Ukrainian/ story export names ────────────────────────────────────

console.log('── Check 3: Ukrainian export names ────────────────────────────────');

for (const f of STORY_FILES.filter(f => f.endsWith('.tsx'))) {
  checkFile(f, [
    {
      pattern: /export\s+const\s+\w*Ukrainian\w*/,
      rule: 'ukrainian-export',
      detail: "Story exports matching /Ukrainian/ are FORBIDDEN. Rename to 'LocaleStress' (§13/§14).",
    },
  ]);
}

// ── Check 4: Pinned globals.locale = 'uk' ─────────────────────────────────────

console.log('── Check 4: Pinned globals.locale pins ─────────────────────────────');

for (const f of STORY_FILES.filter(f => f.endsWith('.tsx'))) {
  checkFile(f, [
    {
      pattern: /globals\s*:\s*\{[^}]*locale\s*:\s*['"]uk['"]/,
      rule: 'globals-locale-pin',
      detail: "globals:{locale:'uk'} pins are FORBIDDEN. Stories must be toolbar-reactive (§13/§14).",
    },
  ]);
}

// ── Check 5: Known hardcoded English title literals in fixture files ──────────

console.log('── Check 5: Hardcoded title literals in fixtures ───────────────────');

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

const fixtureFiles = collectFiles(join(ROOT, 'src', 'stories', 'fixtures'), ['.ts', '.tsx']);
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

// ── Check 6: storybook.* key parity across sq/en/uk/it ────────────────────────

console.log('── Check 6: storybook.* namespace key parity ───────────────────────');

const LOCALES = ['sq', 'en', 'uk', 'it'];
const messageData = {};
let messagesOk = true;

for (const locale of LOCALES) {
  const filePath = join(ROOT, 'messages', `${locale}.json`);
  try {
    messageData[locale] = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`  ❌ Cannot read messages/${locale}.json: ${err.message}`);
    messagesOk = false;
  }
}

if (messagesOk) {
  function collectStorybookKeys(obj, prefix = '') {
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
  }

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
      console.log(`  ✅ storybook.* ${locale} — ${localeKeys.size} keys (matches ${primary})`);
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
    console.log(`  ✅ storybook.* en  — ${primaryKeys.size} keys (reference)`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────

console.log('');
if (violations.length === 0) {
  console.log(`✅ check:stories PASSED — ${STORY_FILES.length} files checked, 0 violations.`);
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
