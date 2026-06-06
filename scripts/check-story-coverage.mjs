#!/usr/bin/env node
/**
 * check-story-coverage.mjs — Story coverage gate (Task 398, Sprint 34).
 *
 * Enforces that every component under src/components/** either has a
 * colocated *.stories.tsx OR is listed in scripts/story-coverage-exempt.json
 * with a one-line justification.
 *
 * Gate mode (CI / default):
 *   Exits 1 if any component is NEITHER covered NOR in the exemption allowlist.
 *   Existing exempted components do NOT block commits ("fail-on-new" rollout).
 *
 * CLI modes:
 *   (default)           fail-on-new gate check
 *   --update-exempt     write today's storyless components to the exemption
 *                       allowlist (seed once; review stubs afterward)
 *   --report            print full coverage info, always exit 0
 *
 * Stale-entry check: any exemption entry pointing to a non-existent file is
 * flagged as a warning (not a hard failure — file may have been renamed).
 *
 * Usage:
 *   node scripts/check-story-coverage.mjs
 *   npm run check:story-coverage
 *   npm run check:story-coverage:report
 *   npm run check:story-coverage:update-exempt
 *
 * Added by Task 398 (Sprint 34, 2026-06-06).
 * Docs: docs/storybook-governance.md §15
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EXEMPT_PATH = resolve(__dirname, 'story-coverage-exempt.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const UPDATE_EXEMPT = args.includes('--update-exempt');
const REPORT_ONLY = args.includes('--report');

// ── File collection ───────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', 'storybook-static', '__tests__', 'tests',
]);

function collectTsx(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectTsx(full));
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.stories.tsx')) {
      results.push(full);
    }
  }
  return results;
}

// ── Coverage check ────────────────────────────────────────────────────────────
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const allComponents = collectTsx(COMPONENTS_DIR);

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

const covered = [];
const storyless = [];

for (const compPath of allComponents) {
  const dir = dirname(compPath);
  const base = basename(compPath, '.tsx');
  const storyPath = join(dir, `${base}.stories.tsx`);
  if (existsSync(storyPath)) {
    covered.push(compPath);
  } else {
    storyless.push(compPath);
  }
}

// ── Load exemption allowlist ──────────────────────────────────────────────────
let exempt = {};
if (existsSync(EXEMPT_PATH)) {
  try {
    exempt = JSON.parse(readFileSync(EXEMPT_PATH, 'utf8'));
  } catch {
    console.error('⚠️  story-coverage-exempt.json is not valid JSON.');
    console.error('    Fix manually or re-run: node scripts/check-story-coverage.mjs --update-exempt');
    process.exit(1);
  }
}

// ── --update-exempt: seed/refresh allowlist from current storyless components ──
if (UPDATE_EXEMPT) {
  const updated = { ...exempt };
  for (const p of storyless) {
    const key = rel(p);
    if (!updated[key]) {
      updated[key] = 'STUB — owner review needed: describe why this component does not need a story';
    }
  }
  // Remove stale entries (files that no longer exist)
  for (const key of Object.keys(updated)) {
    if (!existsSync(join(ROOT, key.replace(/\//g, sep)))) {
      delete updated[key];
    }
  }
  writeFileSync(EXEMPT_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`✅  Exemption allowlist updated → scripts/story-coverage-exempt.json`);
  console.log(`    ${Object.keys(updated).length} entries (${storyless.length} storyless components)`);
  process.exit(0);
}

// ── Stale entry check ─────────────────────────────────────────────────────────
const staleEntries = Object.keys(exempt).filter(key => {
  const abs = join(ROOT, key);
  return !existsSync(abs);
});

// ── Non-exempt storyless components ──────────────────────────────────────────
const missing = storyless.filter(p => !exempt[rel(p)]);

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`📖  check:story-coverage — ${allComponents.length} component(s) in src/components/**`);
console.log(`    ✅ ${covered.length} have a colocated *.stories.tsx`);
console.log(`    📋 ${storyless.filter(p => !!exempt[rel(p)]).length} explicitly exempt (in allowlist)`);
console.log(`    ❌ ${missing.length} uncovered and NOT exempt`);
if (staleEntries.length > 0) {
  console.log(`    ⚠️  ${staleEntries.length} stale exemption entry/entries (file no longer exists)`);
}
console.log('');

if (REPORT_ONLY) {
  const maxPathLen = allComponents.reduce((m, p) => Math.max(m, rel(p).length), 0);
  console.log('Component coverage:');
  for (const p of allComponents) {
    const key = rel(p);
    const hasCoverage = covered.includes(p);
    const isExempt = !!exempt[key];
    const statusIcon = hasCoverage ? '✅ story ' : isExempt ? '📋 exempt' : '❌ missing';
    console.log(`  ${statusIcon}  ${key}`);
  }
  console.log('');
  if (staleEntries.length > 0) {
    console.log('Stale exemption entries (file no longer exists):');
    for (const key of staleEntries) {
      console.log(`  ⚠️  ${key}`);
    }
    console.log('  Run --update-exempt to remove stale entries.');
    console.log('');
  }
  process.exit(0);
}

// ── Gate verdict ──────────────────────────────────────────────────────────────
if (staleEntries.length > 0) {
  console.warn('⚠️  Stale exemption entries (not a hard failure — clean up when convenient):');
  for (const key of staleEntries) {
    console.warn(`    ${key}`);
  }
  console.warn('    Run: node scripts/check-story-coverage.mjs --update-exempt');
  console.warn('');
}

if (missing.length === 0) {
  const verdict = staleEntries.length > 0
    ? `✅  check:story-coverage PASSED (with ${staleEntries.length} stale entry/entries — clean up).`
    : '✅  check:story-coverage PASSED — all components are covered or explicitly exempt.';
  console.log(verdict);
  process.exit(0);
}

console.error(`❌  check:story-coverage FAILED — ${missing.length} component(s) have no story and no exemption entry:\n`);
for (const p of missing) {
  console.error(`    ${rel(p)}`);
}
console.error('');
console.error('  Fix options (pick ONE per component):');
console.error('    (a) Add a colocated *.stories.tsx — run: npm run new:story <ComponentPath>');
console.error('    (b) Add an entry to scripts/story-coverage-exempt.json with a one-line justification');
console.error('        (for trivial primitives or components that cannot be mocked safely)');
console.error('');
console.error('  Docs: docs/storybook-governance.md §15');
process.exit(1);
