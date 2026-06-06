#!/usr/bin/env node
/**
 * check-hardcoded-i18n.mjs — Static i18n hardcode scanner.
 *
 * Walks ALL src/**\/*.tsx (excluding *.stories.tsx, *.test.tsx, src/stories/)
 * and flags user-facing English string literals not wrapped in t()/useTranslations().
 *
 * Detection scope:
 *   - JSX prop attributes: aria-label, aria-description, aria-placeholder,
 *     aria-roledescription, title, placeholder, alt, label
 *   - JSX text children on the same line (> ... < form, covers sr-only spans)
 *
 * Gate mode (CI default):
 *   Compares against scripts/i18n-hardcode-baseline.json.
 *   Exits 1 if any finding's "file:line" key is NOT in the baseline (= NEW hardcode).
 *   Existing debt (in baseline) does NOT block commits.
 *
 * Usage:
 *   node scripts/check-hardcoded-i18n.mjs              — scan + gate check (CI)
 *   node scripts/check-hardcoded-i18n.mjs --report     — print all findings, exit 0
 *   node scripts/check-hardcoded-i18n.mjs --update-baseline  — write baseline, exit 0
 *   npm run check:i18n-hardcode
 *
 * Added by Task 396 (Sprint 34, 2026-06-05). Epic II Phase 1 (audit + CI gate).
 * Docs: docs/i18n-governance.md
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const BASELINE_PATH = resolve(__dirname, 'i18n-hardcode-baseline.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args            = process.argv.slice(2);
const UPDATE_BASELINE = args.includes('--update-baseline');
const REPORT_ONLY     = args.includes('--report');

// ── isEnglishish ──────────────────────────────────────────────────────────────
// Local mirror of check-stories.mjs isEnglishish(). Kept local to avoid
// import coupling (the scanner must be runnable standalone with no imports).
//
// Returns true when `value` looks like a plain-English string:
//   — starts with ASCII uppercase A–Z
//   — contains ≥ 3 ASCII alpha characters
//   — has NO non-ASCII accented/diacritic/Cyrillic characters
//     (those mark Albanian ë/ç, Italian à/è, Ukrainian Cyrillic)
function isEnglishish(value) {
  if (!value || typeof value !== 'string') return false;
  if (!/^[A-Z]/.test(value)) return false;
  if ((value.match(/[A-Za-z]/g) ?? []).length < 3) return false;
  // Non-ASCII Latin (ë/ç/à/è/…) or Cyrillic → not plain English
  if (/[À-ÖØ-öø-ÿĀ-ɏЀ-ӿ]/.test(value)) return false;
  return true;
}

// ── Static allowlist (language-neutral tokens ONLY) ───────────────────────────
//
// Keep ONLY: proper nouns, brand/acronym codes, all-caps enum codes, and
// pure numeric/symbol values that are provably non-translatable.
//
// NEVER allowlist translatable vocabulary:
//   Close / Save / Loading / Breadcrumb / Pagination / Privacy / Help / …
//
// Mirrors the LEAK_ALLOWLIST discipline from check-locale-leak.mjs.
// Every pattern below must be documented with its rationale.
const STATIC_ALLOWLIST = [
  // ── Geographic proper nouns (Albanian cities) ─────────────────────────────
  /^(Tirana|Durrës|Vlorë|Shkodër|Berat|Kombinat|Sauk|Blloku|Elbasan)$/i,
  // ── Currency / URL / acronym codes — never translated ─────────────────────
  // EUR = Euro currency code; ALL = Albanian Lek code; DELETE = confirmation
  // keyword (type to confirm); URL/API/SEO/QA = technical acronyms.
  /^(EUR|URL|DELETE|SMS|HTTP|HTTPS|API|ID|SEO|QA|ALL|JSON|CSV|PDF|RSS|CTA)$/,
  // ── Pure numeric / symbol / operator values ───────────────────────────────
  /^[\d\s€$+\-.,%()/[\]{}|<>=!@#&*^~]+$/,
  // ── All-caps identifiers (enum / status codes, SCREAMING_SNAKE) ───────────
  // Examples: ACTIVE, PENDING, SOLD, ARCHIVED, ROLE_ADMIN.
  // Minimum 2 uppercase letters after first char, or contains underscore.
  /^[A-Z][A-Z0-9_]+$/,
  // ── Design-system CSS/variant labels (not translatable UI content) ─────────
  /^(Outline|Neutral|Primary|Secondary|Ghost|Destructive|Default)$/,
  // ── Site brand name — Lero.al (appears in email footers, not translated) ───
  /^Lero(\.al)?$/,
  // ── Map tile attribution provider (proper noun / brand) ──────────────────
  /^OpenStreetMap$/,
  // ── Storybook chrome — appears in some rendered DOM inspected by scripts ──
  /^(Docs|Canvas|Controls|Actions|Accessibility|Interactions|Required)$/,
  // ── Social media / platform brand names (proper nouns, not translated) ─────
  /^(Facebook|Instagram|LinkedIn|YouTube|Twitter|X|TikTok|WhatsApp|Telegram)$/,
  // ── Language-code display sequences (e.g. "EN / UK / IT") ────────────────
  /^[A-Z]{2}(\s*\/\s*[A-Z]{2})+$/,
];

function isAllowlisted(value) {
  return STATIC_ALLOWLIST.some(p => p.test(value.trim()));
}

// ── File collection ───────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', 'storybook-static',
  'stories',       // src/stories/ = storybook helpers (covered by check-stories.mjs)
  '__tests__', 'tests',
]);
const SKIP_SUFFIXES = ['.stories.tsx', '.test.tsx', '.test.ts'];

function collectFiles(dir, exts) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (
      exts.some(e => entry.endsWith(e)) &&
      !SKIP_SUFFIXES.some(s => entry.endsWith(s))
    ) {
      results.push(full);
    }
  }
  return results;
}

// ── Attribute detection ───────────────────────────────────────────────────────
//
// Watched JSX/HTML attributes that carry user-facing text.
// Note: `label` catches custom component props (e.g. <Field label="Meta title">).
// Note: `title` catches HTML tooltip attributes and Next.js <title> elements.
const WATCHED_ATTRS = [
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-roledescription',
  'title',
  'placeholder',
  'alt',
  'label',
];

// Per-attribute regex pairs covering four string literal forms:
//   (a) attr="VALUE"
//   (b) attr='VALUE'
//   (c) attr={"VALUE"}  or  attr={'VALUE'}
//   (d) attr={`VALUE`}  (no ${ interpolation })
// Build attribute detection patterns.
// `label` needs a stricter lookbehind — `\blabel` also matches the `label`
// suffix inside `aria-label`, `data-label`, etc. Use `(?<![-a-z])label` to
// require that `label` is NOT preceded by a hyphen or lowercase letter.
const ATTR_PATTERNS = WATCHED_ATTRS.flatMap(attr => {
  if (attr === 'label') {
    // Special case: prevent false matches on `aria-label`, `data-label`, etc.
    return [
      { re: /(?<![-a-z])label\s*=\s*"([^"\n]+)"/g,             attr },
      { re: /(?<![-a-z])label\s*=\s*'([^'\n]+)'/g,             attr },
      { re: /(?<![-a-z])label\s*=\s*\{\s*["']([^"'\n]+)["']\s*\}/g, attr },
      { re: /(?<![-a-z])label\s*=\s*\{\s*`([^`$\n]+)`\s*\}/g,  attr },
    ];
  }
  // General case: word-boundary match is safe for attrs that aren't suffixes
  // of other attrs (aria-label, placeholder, alt, title, aria-description, …).
  const a = attr.replace(/[-]/g, '\\-');
  return [
    { re: new RegExp(`\\b${a}\\s*=\\s*"([^"\\n]+)"`, 'g'), attr },
    { re: new RegExp(`\\b${a}\\s*=\\s*'([^'\\n]+)'`, 'g'), attr },
    { re: new RegExp(`\\b${a}\\s*=\\s*\\{\\s*["']([^"'\\n]+)["']\\s*\\}`, 'g'), attr },
    { re: new RegExp(`\\b${a}\\s*=\\s*\\{\\s*\`([^\`$\\n]+)\`\\s*\\}`, 'g'), attr },
  ];
});

// ── JSX text children detection ───────────────────────────────────────────────
// Matches visible text directly between > and < on the same line.
// Excludes: JSX expressions {…}, nested tags <…>, newlines.
// This naturally covers sr-only span content, email link text, and any
// visible JSX prose not protected by the attribute patterns above.
//
// `(?<!=)>` negative lookbehind excludes `=>` arrow-function operators.
// Without it, `() => Promise<void>` would yield a false-positive "Promise"
// match (the `>` in `=>` paired with the `<` in `Promise<…>`).
const JSX_TEXT_RE = /(?<!=)>([^<>{}\n]+)</g;

// ── Per-line skip heuristics ──────────────────────────────────────────────────
// A line that already uses an i18n call is considered safe.
// A line that is a comment or import/type declaration is not JSX user-facing text.
function shouldSkipLine(line) {
  const trimmed = line.trimStart();
  // Comment lines
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // Already localized — any i18n call on the line means the dev has handled it
  if (/\bt\s*\(/.test(line)) return true;
  if (/useTranslations/.test(line)) return true;
  if (/storyT\s*\(/.test(line)) return true;
  // TypeScript structural lines — no user-facing strings expected
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}

// ── File scanner ──────────────────────────────────────────────────────────────
function scanFile(filePath) {
  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { return []; }

  const relPath  = relative(ROOT, filePath).replace(/\\/g, '/');
  const lines    = content.split('\n');
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line    = lines[i];
    const lineNum = i + 1;

    if (shouldSkipLine(line)) continue;

    // ── Attribute pattern checks
    for (const { re, attr } of ATTR_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const value = m[1].trim();
        if (!isEnglishish(value)) continue;
        if (isAllowlisted(value)) continue;
        findings.push({ file: relPath, line: lineNum, kind: 'attr', attr, value });
      }
    }

    // ── JSX text children check
    JSX_TEXT_RE.lastIndex = 0;
    let tm;
    while ((tm = JSX_TEXT_RE.exec(line)) !== null) {
      const text = tm[1].trim();
      if (!text) continue;
      if (!isEnglishish(text)) continue;
      if (isAllowlisted(text)) continue;
      findings.push({ file: relPath, line: lineNum, kind: 'jsx-text', attr: null, value: text });
    }
  }

  return findings;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const srcDir   = join(ROOT, 'src');
  const allFiles = collectFiles(srcDir, ['.tsx', '.ts']);

  console.log(`🔍  check:i18n-hardcode — scanning ${allFiles.length} src/**/*.tsx files`);
  console.log(`    (excludes *.stories.tsx, *.test.tsx, src/stories/, src/__tests__/)`);
  console.log('');

  const allFindings = [];
  for (const f of allFiles) {
    allFindings.push(...scanFile(f));
  }

  // ── Report: group by file, sorted
  const byFile = {};
  for (const finding of allFindings) {
    (byFile[finding.file] ??= []).push(finding);
  }

  for (const file of Object.keys(byFile).sort()) {
    const items = byFile[file];
    console.log(`  ${file}  (${items.length})`);
    for (const { line, kind, attr, value } of items) {
      const tag = kind === 'attr' ? `[${attr}]` : '[text-child]';
      console.log(`    :${line}  ${tag}  "${value}"`);
    }
  }

  const fileCount = Object.keys(byFile).length;
  console.log('');
  console.log(`  Total: ${allFindings.length} hardcoded user-facing string(s) across ${fileCount} file(s)`);
  console.log('');

  // ── --update-baseline mode
  if (UPDATE_BASELINE) {
    const baseline = {};
    for (const f of allFindings) {
      baseline[`${f.file}:${f.line}`] = { kind: f.kind, attr: f.attr ?? undefined, value: f.value };
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n', 'utf8');
    console.log(`✅  Baseline written → scripts/i18n-hardcode-baseline.json  (${allFindings.length} entries)`);
    process.exit(0);
  }

  // ── --report mode (print only, always exit 0)
  if (REPORT_ONLY) {
    console.log('📋  Report-only mode — no gate check performed.');
    process.exit(0);
  }

  // ── Gate check: fail only on findings NOT in baseline ("fail on NEW")
  let baseline = {};
  if (existsSync(BASELINE_PATH)) {
    try {
      baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    } catch {
      console.error('⚠️  Baseline file is not valid JSON. Run --update-baseline to regenerate.');
      process.exit(1);
    }
  } else {
    console.error('⚠️  No baseline found at scripts/i18n-hardcode-baseline.json.');
    console.error('    Run: node scripts/check-hardcoded-i18n.mjs --update-baseline');
    process.exit(1);
  }

  const newFindings = allFindings.filter(f => !(`${f.file}:${f.line}` in baseline));

  if (newFindings.length === 0) {
    const knownCount = allFindings.length;
    console.log(`✅  check:i18n-hardcode PASSED — ${knownCount} known finding(s) in baseline, 0 NEW.`);
    console.log(`    Existing debt is tracked in scripts/i18n-hardcode-baseline.json.`);
    console.log(`    Task 397 will remediate the backlog.`);
    process.exit(0);
  }

  console.error(`❌  check:i18n-hardcode FAILED — ${newFindings.length} NEW hardcode(s) not in baseline:\n`);
  for (const { file, line, kind, attr, value } of newFindings) {
    const tag = kind === 'attr' ? `[${attr}]` : '[text-child]';
    console.error(`  ${file}:${line}  ${tag}  "${value}"`);
  }
  console.error('');
  console.error('  Fix: wrap the string in t() / useTranslations() from next-intl,');
  console.error('  or update the baseline if the finding is provably non-translatable.');
  console.error('  Docs: docs/i18n-governance.md');
  process.exit(1);
}

run();
