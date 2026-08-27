#!/usr/bin/env node
/**
 * check-homepage-theme-runtime-deps.mjs — Task 770 (Sprint 65, Level 3) fixed-manifest ownership gate.
 *
 * A fixed-manifest ownership check. NOT a route-graph parser, NOT a directory walk. Thirteen hardcoded
 * repository-relative paths: the twelve migration inputs of kickoff §3.1, plus
 * `src/components/ui/AppImage.module.css` as the single expected-zero input (D65-E — the durable
 * control Task 768 transferred here). All thirteen are resolved before any scanning; a missing path is
 * fatal in every mode, naming every missing path (fail-closed, the same shape
 * `check-tailwind-runtime-tokens.mjs` already gives its own configured TSX inputs).
 *
 * Reuses this repository's own extractors from `check-css-var-resolvability.mjs` — `stripComments`,
 * `extractCssDeclaredNames`, `findVarReferences` — never a second implementation (kickoff §3.8). The
 * `:root`/`@theme inline` block walker is a local copy of that file's brace-balanced `findAllBlocks`
 * scan (the same technique `check-tailwind-runtime-tokens.mjs` already copies for its own
 * `extractOwnedNames`), because this gate needs `plainRoot` and `themeInline` held as SEPARATE sets —
 * `extractOwnedNames` merges them and cannot answer "declared ONLY in @theme inline" (kickoff §3.8).
 *
 * ── Classification (kickoff §10.3) ──────────────────────────────────────────────────────────────
 * For every literal `var()` reference in each of the twelve migration inputs, exactly one category,
 * decided in this order: (1) `mantine-external` — `--mantine-` prefix; (2) `module-local` — declared
 * in the same `.css` file, never applies to a `.tsx` input; (3) `root-owned` — in `plainRoot`;
 * (4) `theme-inline-only` — in `themeInline` and not in `plainRoot`; (5) `unknown` — none of the above.
 * `theme-inline-only` and `unknown` are BLOCKING. No baseline, marker, allowlist or exemption exists
 * (R9) — none may be added to reach green.
 *
 * ── Two distinct headline numbers (kickoff §10.4, A.2) — do not conflate them ─────────────────────
 * `TOTAL CLASSIFIED` is every literal var() reference found across the twelve migration inputs, in
 * ANY of the five categories — this includes long-standing, unrelated project tokens these files
 * already read (e.g. `--border`, `--foreground`, `--primary`, `--muted-foreground`,
 * `--homepage-runtime-font-size-*` from Task 767) that were never theme-inline debt. Measured on this
 * gate's own first run (2026-08-26): 94 pairs / 170 uses, invariant across the migration because a
 * rename does not add or remove a var() call site.
 * `BLOCKING` is the theme-inline-only + unknown subset — the number the kickoff's §10.0 preflight,
 * §3.1 per-file table, R1, R7 and AC4 actually key on: 42 pairs / 79 uses before migration (matching
 * kickoff §3.1 exactly, file by file), 0 / 0 after. This is the number this gate's exit code depends
 * on. Both are printed, explicitly labelled, in both `--report` and default mode — never one number
 * that means both (A.2's own instruction).
 *
 * ── The approved-target signature ─────────────────────────────────────────────
 * `MIGRATION_TARGETS` fixes the 42 approved (file, legacyProperty, expectedToken, uses) tuples, and
 * `MIGRATION_SIGNATURE` is their deterministic sha256 over a sorted, line-number-free canonical
 * form. A count is not enough: swapping a migrated token for a DIFFERENT but still root-owned token
 * leaves blocking at 0/0 and the full census unchanged. Only the per-tuple comparison, and the
 * signature derived from it, catches that class of defect — asserted by verify-gate case 6, and
 * blocking in DEFAULT mode too, not only inside the self-test.
 *
 * ── The D65-E expected-zero arm ────────────────────────────────────────────────────────────────
 * `AppImage.module.css` is scanned with the same extractor but is NEVER a migration pair or use and
 * can never change the totals above. Its required result is zero live `var(--space-0)` references.
 * Any such reference is a blocking `expected-zero reintroduced` finding naming the exact path,
 * property and line, non-zero in both modes.
 *
 * Boundary (kickoff §10.3): the input list is closed at thirteen paths. A clean run makes no claim
 * about any other file in the repository, and it is not a route certification (D65-C).
 *
 * MODES:
 *   node scripts/check-homepage-theme-runtime-deps.mjs               Default — exits 1 if any
 *                                                                      blocking pair or expected-zero
 *                                                                      finding exists, else 0.
 *   node scripts/check-homepage-theme-runtime-deps.mjs --report       Prints every row grouped by
 *                                                                      file, per-category totals, the
 *                                                                      two headline numbers above, and
 *                                                                      the expected-zero arm. Exits 0
 *                                                                      unless a fatal input error.
 *   node scripts/check-homepage-theme-runtime-deps.mjs --verify-gate  Self-test: six asserted
 *                                                                      outcomes (kickoff §10.4 + owner case 6) inside
 *                                                                      independent `mkdtempSync`
 *                                                                      copies of `src/`. No plant ever
 *                                                                      touches the real worktree.
 *
 * npm scripts: `npm run check:homepage-theme-runtime-deps`,
 *              `npm run check:homepage-theme-runtime-deps:verify-gate`.
 *
 * Added by Task 770 (Sprint 65, level 3, 2026-08-26). Docs: docs/design-system.md §23.8.
 */

import {
  readFileSync, existsSync, mkdtempSync, cpSync, rmSync, writeFileSync,
} from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { stripComments, extractCssDeclaredNames, findVarReferences } from './check-css-var-resolvability.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Twelve migration inputs (kickoff §3.1) — fixed, never a glob.
export const MIGRATION_INPUTS_REL = [
  'src/app/[locale]/layout.tsx',
  'src/app/[locale]/page.tsx',
  'src/components/layout/FooterView.module.css',
  'src/components/layout/HeaderView.module.css',
  'src/components/layout/MobileBottomNavView.module.css',
  'src/components/shared/HeroSearchView.module.css',
  'src/design-system/mantine/patterns/MantineCopyIdButton.module.css',
  'src/design-system/mantine/patterns/MantineHomeSection.tsx',
  'src/design-system/mantine/patterns/MantineListingCardPattern.module.css',
  'src/modules/listings/components/FeaturedListingsView.module.css',
  'src/modules/listings/components/LatestListingsView.module.css',
  'src/modules/listings/components/ListingCard.module.css',
];
// The single expected-zero input (kickoff §3.7, D65-E) — thirteenth fixed path.
export const EXPECTED_ZERO_INPUT_REL = 'src/components/ui/AppImage.module.css';
export const EXPECTED_ZERO_PROPERTY = '--space-0';

// ── The approved migration target manifest (Task 770 remediation, owner decision 2026-08-27) ──
// Owner decision, recorded verbatim in the Task 770 session log and docs/design-system.md §23.8:
//   "42/79 is the exact migration subset; 94/170 is the full census of the twelve manifest files.
//    Case 5 must verify both values, the exact migration signature, and 0/0 blocking."
// Each tuple is (file, legacyProperty, expectedToken, uses), derived from the kickoff §3.1 census
// and the §10.2 replacement mapping, then re-verified against the migrated tree. Line numbers are
// deliberately absent: re-indentation or an added declaration must never invalidate the signature,
// only a changed target, token or use count may.
export const MIGRATION_TARGETS = [
  { file: 'src/app/[locale]/layout.tsx', legacyProperty: '--space-14', expectedToken: '--homepage-runtime-space-14', uses: 1 },
  { file: 'src/app/[locale]/page.tsx', legacyProperty: '--space-16', expectedToken: '--homepage-runtime-space-16', uses: 1 },
  { file: 'src/app/[locale]/page.tsx', legacyProperty: '--space-24', expectedToken: '--homepage-runtime-space-24', uses: 1 },
  { file: 'src/components/layout/FooterView.module.css', legacyProperty: '--space-12', expectedToken: '--homepage-runtime-space-12', uses: 2 },
  { file: 'src/components/layout/FooterView.module.css', legacyProperty: '--space-14', expectedToken: '--homepage-runtime-space-14', uses: 1 },
  { file: 'src/components/layout/FooterView.module.css', legacyProperty: '--space-2-5', expectedToken: '--homepage-runtime-space-2-5', uses: 1 },
  { file: 'src/components/layout/HeaderView.module.css', legacyProperty: '--space-1', expectedToken: '--homepage-runtime-space-1', uses: 1 },
  { file: 'src/components/layout/HeaderView.module.css', legacyProperty: '--space-16', expectedToken: '--homepage-runtime-space-16', uses: 1 },
  { file: 'src/components/layout/HeaderView.module.css', legacyProperty: '--space-2', expectedToken: '--homepage-runtime-space-2', uses: 4 },
  { file: 'src/components/layout/HeaderView.module.css', legacyProperty: '--space-6', expectedToken: '--homepage-runtime-space-6', uses: 1 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-0', expectedToken: '--homepage-runtime-space-0', uses: 4 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-12', expectedToken: '--homepage-runtime-space-12', uses: 2 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-14', expectedToken: '--homepage-runtime-space-14', uses: 1 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-3', expectedToken: '--homepage-runtime-space-3', uses: 1 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-5', expectedToken: '--homepage-runtime-space-5', uses: 2 },
  { file: 'src/components/layout/MobileBottomNavView.module.css', legacyProperty: '--space-6', expectedToken: '--homepage-runtime-space-6', uses: 2 },
  { file: 'src/components/shared/HeroSearchView.module.css', legacyProperty: '--space-0', expectedToken: '--homepage-runtime-space-0', uses: 2 },
  { file: 'src/components/shared/HeroSearchView.module.css', legacyProperty: '--space-11', expectedToken: '--homepage-runtime-space-11', uses: 1 },
  { file: 'src/components/shared/HeroSearchView.module.css', legacyProperty: '--space-2', expectedToken: '--homepage-runtime-space-2', uses: 1 },
  { file: 'src/components/shared/HeroSearchView.module.css', legacyProperty: '--space-3', expectedToken: '--homepage-runtime-space-3', uses: 1 },
  { file: 'src/components/shared/HeroSearchView.module.css', legacyProperty: '--space-6', expectedToken: '--homepage-runtime-space-6', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineCopyIdButton.module.css', legacyProperty: '--text-2xs', expectedToken: '--homepage-runtime-font-size-2xs', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineCopyIdButton.module.css', legacyProperty: '--color-muted-foreground', expectedToken: '--muted-foreground', uses: 2 },
  { file: 'src/design-system/mantine/patterns/MantineCopyIdButton.module.css', legacyProperty: '--color-ring', expectedToken: '--ring', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineCopyIdButton.module.css', legacyProperty: '--color-status-success', expectedToken: '--status-success', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineHomeSection.tsx', legacyProperty: '--home-section-py-base', expectedToken: '--homepage-runtime-section-py-base', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineHomeSection.tsx', legacyProperty: '--home-section-py-lg', expectedToken: '--homepage-runtime-section-py-lg', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineHomeSection.tsx', legacyProperty: '--home-section-py-md', expectedToken: '--homepage-runtime-section-py-md', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--color-badge-premium', expectedToken: '--badge-premium', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--shadow-listing-card-elevation-lg', expectedToken: '--homepage-runtime-listing-card-shadow', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--space-0', expectedToken: '--homepage-runtime-space-0', uses: 3 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--space-1', expectedToken: '--homepage-runtime-space-1', uses: 2 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--space-2', expectedToken: '--homepage-runtime-space-2', uses: 14 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--space-20', expectedToken: '--homepage-runtime-space-20', uses: 1 },
  { file: 'src/design-system/mantine/patterns/MantineListingCardPattern.module.css', legacyProperty: '--space-3', expectedToken: '--homepage-runtime-space-3', uses: 8 },
  { file: 'src/modules/listings/components/FeaturedListingsView.module.css', legacyProperty: '--space-2', expectedToken: '--homepage-runtime-space-2', uses: 1 },
  { file: 'src/modules/listings/components/FeaturedListingsView.module.css', legacyProperty: '--space-3', expectedToken: '--homepage-runtime-space-3', uses: 1 },
  { file: 'src/modules/listings/components/LatestListingsView.module.css', legacyProperty: '--space-2', expectedToken: '--homepage-runtime-space-2', uses: 1 },
  { file: 'src/modules/listings/components/LatestListingsView.module.css', legacyProperty: '--space-3', expectedToken: '--homepage-runtime-space-3', uses: 1 },
  { file: 'src/modules/listings/components/ListingCard.module.css', legacyProperty: '--space-1', expectedToken: '--homepage-runtime-space-1', uses: 1 },
  { file: 'src/modules/listings/components/ListingCard.module.css', legacyProperty: '--space-6', expectedToken: '--homepage-runtime-space-6', uses: 2 },
  { file: 'src/modules/listings/components/ListingCard.module.css', legacyProperty: '--space-8', expectedToken: '--homepage-runtime-space-8', uses: 2 },
];

// The three independent invariants Case 5 asserts (owner decision 2026-08-27).
export const FULL_CENSUS_PAIRS = 94;
export const FULL_CENSUS_USES = 170;
export const MIGRATION_TARGET_PAIRS = 42;
export const MIGRATION_TARGET_USES = 79;
export const MIGRATION_SIGNATURE = 'cc84b1dc078b3dffd8bd2d6f07aa1fc02ff4cbe67b17892dc8216d057208613e';

function canonicalTargetLine(t) {
  return `${t.file}|${t.legacyProperty}|${t.expectedToken}|${t.uses}`;
}

// Deterministic, sorted, line-number-free signature over the target tuples.
export function computeMigrationSignature(targets) {
  return createHash('sha256').update(targets.map(canonicalTargetLine).sort().join('\n')).digest('hex');
}

// Verifies that every approved target resolves to its APPROVED token with its APPROVED use count,
// and that no legacy name came back. A count alone cannot catch a wrong-but-root-owned substitution
// (verify-gate case 6); the per-tuple comparison and its derived signature can.
export function verifyMigrationTargets(rows) {
  const counts = new Map();
  for (const r of rows) {
    const k = `${r.file}|${r.property}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const observed = [];
  const mismatches = [];
  for (const t of MIGRATION_TARGETS) {
    const seen = counts.get(`${t.file}|${t.expectedToken}`) ?? 0;
    const legacySeen = counts.get(`${t.file}|${t.legacyProperty}`) ?? 0;
    observed.push({ ...t, uses: seen });
    if (seen !== t.uses) {
      mismatches.push(`${t.file}  ${t.expectedToken}  expected ${t.uses} use(s), found ${seen}  (approved migration of ${t.legacyProperty})`);
    }
    if (legacySeen > 0) {
      mismatches.push(`${t.file}  ${t.legacyProperty}  legacy reference reintroduced (${legacySeen} use(s)) — expected 0`);
    }
  }
  const observedSignature = computeMigrationSignature(observed);
  return {
    observed,
    mismatches,
    observedSignature,
    expectedSignature: MIGRATION_SIGNATURE,
    signatureMatches: observedSignature === MIGRATION_SIGNATURE,
    pairs: MIGRATION_TARGETS.length,
    uses: observed.reduce((s, t) => s + t.uses, 0),
    ok: mismatches.length === 0 && observedSignature === MIGRATION_SIGNATURE,
  };
}

const MANTINE_PREFIX = '--mantine-';
const CATEGORIES = ['mantine-external', 'module-local', 'root-owned', 'theme-inline-only', 'unknown'];

// ── :root / @theme inline block-scoped ownership — copied brace-balanced scan (kickoff §3.8), not
// `extractOwnedNames` (which merges both sources and cannot answer "theme-inline ONLY"). ──
function findAllBlocks(strippedSource, headerRe) {
  const blocks = [];
  const re = new RegExp(headerRe.source, headerRe.flags.includes('g') ? headerRe.flags : headerRe.flags + 'g');
  let m;
  while ((m = re.exec(strippedSource)) !== null) {
    let i = m.index + m[0].length;
    let depth = 1;
    for (; i < strippedSource.length; i++) {
      if (strippedSource[i] === '{') depth++;
      else if (strippedSource[i] === '}') { depth--; if (depth === 0) break; }
    }
    blocks.push({ start: m.index + m[0].length, end: i });
    re.lastIndex = i + 1;
  }
  return blocks;
}
function extractDeclNamesFromBlock(text) {
  const names = [];
  const re = /(^|\n)\s*(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(text)) !== null) names.push(m[2]);
  return names;
}

export function extractPlainRootAndThemeInline(rawGlobalsContent) {
  const stripped = stripComments(rawGlobalsContent, true);
  const plainRoot = new Set();
  for (const block of findAllBlocks(stripped, /^:root\s*\{/m)) {
    for (const n of extractDeclNamesFromBlock(stripped.slice(block.start, block.end))) plainRoot.add(n);
  }
  const themeInline = new Set();
  for (const block of findAllBlocks(stripped, /^@theme inline\s*\{/m)) {
    for (const n of extractDeclNamesFromBlock(stripped.slice(block.start, block.end))) themeInline.add(n);
  }
  return { plainRoot, themeInline };
}

// ── The classifier (kickoff §10.3 order) ──
export function classify(name, plainRoot, themeInline, localDeclaredNames) {
  if (name.startsWith(MANTINE_PREFIX)) return 'mantine-external';
  if (localDeclaredNames.has(name)) return 'module-local';
  if (plainRoot.has(name)) return 'root-owned';
  if (themeInline.has(name) && !plainRoot.has(name)) return 'theme-inline-only';
  return 'unknown';
}

// ── Core scan — resolves all thirteen inputs first (fail-closed), then classifies every literal
// var() reference in the twelve migration inputs and scans the expected-zero input separately. ──
export function runScan({ root = ROOT } = {}) {
  const globalsAbsPath = join(root, 'src/app/globals.css');
  const migrationAbsPaths = MIGRATION_INPUTS_REL.map((p) => join(root, p));
  const expectedZeroAbsPath = join(root, EXPECTED_ZERO_INPUT_REL);

  const missing = [];
  MIGRATION_INPUTS_REL.forEach((rel, i) => { if (!existsSync(migrationAbsPaths[i])) missing.push(rel); });
  if (!existsSync(expectedZeroAbsPath)) missing.push(EXPECTED_ZERO_INPUT_REL);
  if (missing.length > 0) {
    return { fatal: `missing configured input(s): ${missing.join(', ')}` };
  }

  if (!existsSync(globalsAbsPath)) {
    return { fatal: `globals.css not found at ${relative(root, globalsAbsPath) || globalsAbsPath}` };
  }
  const globalsRaw = readFileSync(globalsAbsPath, 'utf8');
  const { plainRoot, themeInline } = extractPlainRootAndThemeInline(globalsRaw);
  if (plainRoot.size === 0 && themeInline.size === 0) {
    return { fatal: `0 owned names parsed from globals.css (:root + @theme inline) — parse failure, not a vacuous pass` };
  }

  const rows = [];
  for (let i = 0; i < migrationAbsPaths.length; i++) {
    const absPath = migrationAbsPaths[i];
    const rel = MIGRATION_INPUTS_REL[i];
    const isCss = rel.endsWith('.css');
    const raw = readFileSync(absPath, 'utf8');
    const stripped = stripComments(raw, isCss);
    const localDeclaredNames = isCss ? extractCssDeclaredNames(raw) : new Set();
    for (const ref of findVarReferences(stripped)) {
      rows.push({
        file: rel,
        line: ref.line,
        property: ref.name,
        category: classify(ref.name, plainRoot, themeInline, localDeclaredNames),
      });
    }
  }

  const ezRaw = readFileSync(expectedZeroAbsPath, 'utf8');
  const ezStripped = stripComments(ezRaw, true);
  const expectedZeroFindings = findVarReferences(ezStripped)
    .filter((r) => r.name === EXPECTED_ZERO_PROPERTY)
    .map((r) => ({ file: EXPECTED_ZERO_INPUT_REL, line: r.line, property: r.name }));

  return { plainRoot, themeInline, rows, expectedZeroFindings, targets: verifyMigrationTargets(rows) };
}

// ── Grouping — one row per (file, property) pair, with a use count and first line. ──
function groupPairs(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.file} ${r.property}`;
    if (!map.has(key)) map.set(key, { file: r.file, property: r.property, category: r.category, line: r.line, uses: 0 });
    const entry = map.get(key);
    entry.uses += 1;
    entry.line = Math.min(entry.line, r.line);
  }
  return [...map.values()];
}

function summarize(rows) {
  const pairs = groupPairs(rows);
  const byCategory = {};
  for (const cat of CATEGORIES) {
    const catPairs = pairs.filter((p) => p.category === cat);
    byCategory[cat] = { pairs: catPairs, pairCount: catPairs.length, useCount: catPairs.reduce((s, p) => s + p.uses, 0) };
  }
  const blockingPairs = [...byCategory['theme-inline-only'].pairs, ...byCategory.unknown.pairs];
  return {
    pairs,
    totalPairs: pairs.length,
    totalUses: rows.length,
    byCategory,
    blockingPairs,
    blockingPairCount: blockingPairs.length,
    blockingUseCount: blockingPairs.reduce((s, p) => s + p.uses, 0),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// § Report + default run
// ═══════════════════════════════════════════════════════════════════════════
function runReport() {
  const result = runScan();
  if (result.fatal) {
    console.error(`❌  check:homepage-theme-runtime-deps --report — ${result.fatal}`);
    process.exit(1);
  }
  const summary = summarize(result.rows);
  console.log(`🔍  check:homepage-theme-runtime-deps --report — scanned ${MIGRATION_INPUTS_REL.length} migration input(s) + 1 expected-zero input`);
  console.log('');

  const byFile = new Map();
  for (const p of summary.pairs) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }
  for (const rel of MIGRATION_INPUTS_REL) {
    const pairs = (byFile.get(rel) ?? []).slice().sort((a, b) => a.line - b.line);
    const uses = pairs.reduce((s, p) => s + p.uses, 0);
    console.log(`${rel}  (${pairs.length} pair(s) / ${uses} use(s))`);
    for (const p of pairs) console.log(`    ${p.line}: ${p.property}  [${p.category}]  (${p.uses} use${p.uses === 1 ? '' : 's'})`);
  }
  console.log('');
  for (const cat of CATEGORIES) {
    const c = summary.byCategory[cat];
    console.log(`${cat}: ${c.pairCount} pair(s) / ${c.useCount} use(s)`);
  }
  console.log('');
  console.log(`TOTAL CLASSIFIED (all categories): ${summary.totalPairs} pair(s) / ${summary.totalUses} use(s)`);
  console.log(`BLOCKING (theme-inline-only + unknown): ${summary.blockingPairCount} pair(s) / ${summary.blockingUseCount} use(s)`);
  console.log(`MIGRATED_TARGETS (approved subset): ${result.targets.pairs} pair(s) / ${result.targets.uses} use(s)  ${result.targets.ok ? 'signature OK' : 'SIGNATURE MISMATCH'}`);
  console.log(`    expected signature ${result.targets.expectedSignature}`);
  console.log(`    observed signature ${result.targets.observedSignature}`);
  for (const m of result.targets.mismatches) console.log(`    ✗ ${m}`);
  console.log('');
  console.log(`expected-zero input ${EXPECTED_ZERO_INPUT_REL}: ${result.expectedZeroFindings.length} live ${EXPECTED_ZERO_PROPERTY} reference(s)`);
  for (const f of result.expectedZeroFindings) console.log(`    ${f.line}: ${f.property}`);
  process.exit(0);
}

function run() {
  const result = runScan();
  if (result.fatal) {
    console.error(`❌  check:homepage-theme-runtime-deps — ${result.fatal}`);
    process.exit(1);
  }
  const summary = summarize(result.rows);
  console.log(`🔍  check:homepage-theme-runtime-deps — scanned ${MIGRATION_INPUTS_REL.length} migration input(s) + 1 expected-zero input`);
  console.log(`    TOTAL CLASSIFIED (all categories): ${summary.totalPairs} pair(s) / ${summary.totalUses} use(s)`);
  console.log(`    BLOCKING (theme-inline-only + unknown): ${summary.blockingPairCount} pair(s) / ${summary.blockingUseCount} use(s)`);
  console.log(`    MIGRATED_TARGETS (approved subset): ${result.targets.pairs} pair(s) / ${result.targets.uses} use(s)  ${result.targets.ok ? 'signature OK' : 'SIGNATURE MISMATCH'}`);
  console.log('');

  if (summary.blockingPairCount > 0) {
    console.log(`❌  ${summary.blockingPairCount} blocking pair(s):`);
    for (const p of summary.blockingPairs) console.log(`    [${p.category}] ${p.file}:${p.line}  ${p.property}  (${p.uses} use${p.uses === 1 ? '' : 's'})`);
    console.log('');
  }
  if (result.expectedZeroFindings.length > 0) {
    console.log(`❌  ${result.expectedZeroFindings.length} expected-zero reintroduced finding(s):`);
    for (const f of result.expectedZeroFindings) console.log(`    ${f.file}:${f.line}  ${f.property}`);
    console.log('');
  }

  if (!result.targets.ok) {
    console.log(`❌  migration signature mismatch — ${result.targets.mismatches.length} approved-target defect(s):`);
    for (const m of result.targets.mismatches) console.log(`    ${m}`);
    console.log(`    expected signature ${result.targets.expectedSignature}`);
    console.log(`    observed signature ${result.targets.observedSignature}`);
    console.log('');
  }

  const blocking = summary.blockingPairCount + result.expectedZeroFindings.length + (result.targets.ok ? 0 : 1);
  if (blocking > 0) {
    console.error(`❌  check:homepage-theme-runtime-deps — ${summary.blockingPairCount} blocking pair(s) + ${result.expectedZeroFindings.length} expected-zero finding(s)${result.targets.ok ? '' : ' + migration signature mismatch'}. No baseline, marker or allowlist exists (R9).`);
    process.exit(1);
  }
  console.log('✅  check:homepage-theme-runtime-deps — 0 blocking pairs, 0 expected-zero findings, migration signature OK.');
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § --verify-gate (kickoff §10.4) — five asserted outcomes, each in its own fresh mkdtempSync copy
// of `src/`, torn down in `finally`. No plant ever touches the real worktree.
// ═══════════════════════════════════════════════════════════════════════════
function setupTempTree() {
  const base = mkdtempSync(join(tmpdir(), 'homepage-theme-runtime-deps-verify-'));
  cpSync(resolve(ROOT, 'src'), join(base, 'src'), { recursive: true });
  return { base };
}
function teardownTempTree(base) {
  rmSync(base, { recursive: true, force: true });
}

function evaluate(root) {
  const result = runScan({ root });
  if (result.fatal) return { exitCode: 1, fatal: result.fatal };
  const summary = summarize(result.rows);
  const blocking = summary.blockingPairCount + result.expectedZeroFindings.length + (result.targets.ok ? 0 : 1);
  return { exitCode: blocking > 0 ? 1 : 0, summary, expectedZeroFindings: result.expectedZeroFindings, targets: result.targets };
}

const gateResults = [];
function record(id, expectedExitCode, actualExitCode, detail, extraAssertionsOk = true) {
  const ok = expectedExitCode === actualExitCode && extraAssertionsOk;
  gateResults.push({ id, expectedExitCode, actualExitCode, ok, detail });
  console.log(`${ok ? '✅' : '❌'}  ${id} — expected exit ${expectedExitCode}, got exit ${actualExitCode} — ${detail}`);
}

// Case 1 — a padding declaration reading var(--space-2) planted into the copied HeroSearchView.module.css.
function runCase1() {
  const tree = setupTempTree();
  try {
    const target = join(tree.base, 'src/components/shared/HeroSearchView.module.css');
    const raw = readFileSync(target, 'utf8');
    writeFileSync(target, `${raw}\n.verifyGateCase1 { padding: var(--space-2); }\n`, 'utf8');
    const outcome = evaluate(tree.base);
    const hit = outcome.summary?.blockingPairs.find((p) => p.property === '--space-2' && p.file.endsWith('HeroSearchView.module.css'));
    record('Case 1 (CSS theme-inline-only plant)', 1, outcome.exitCode,
      hit ? `reported ${hit.file}:${hit.line} ${hit.property} [theme-inline-only]` : `blockingPairs=${JSON.stringify(outcome.summary?.blockingPairs)}`);
  } finally { teardownTempTree(tree.base); }
}

// Case 2 — the copied MantineHomeSection.tsx's migrated base token reverted to var(--home-section-py-base).
function runCase2() {
  const tree = setupTempTree();
  try {
    const target = join(tree.base, 'src/design-system/mantine/patterns/MantineHomeSection.tsx');
    const raw = readFileSync(target, 'utf8');
    if (!raw.includes('--homepage-runtime-section-py-base')) {
      record('Case 2 (TSX theme-inline-only plant)', 1, 2, 'pre-plant census failed — --homepage-runtime-section-py-base not found; migration not applied yet');
      return;
    }
    writeFileSync(target, raw.replace('--homepage-runtime-section-py-base', '--home-section-py-base'), 'utf8');
    const outcome = evaluate(tree.base);
    const hit = outcome.summary?.blockingPairs.find((p) => p.property === '--home-section-py-base' && p.file.endsWith('MantineHomeSection.tsx'));
    record('Case 2 (TSX theme-inline-only plant)', 1, outcome.exitCode,
      hit ? `reported ${hit.file}:${hit.line} ${hit.property} [theme-inline-only]` : `blockingPairs=${JSON.stringify(outcome.summary?.blockingPairs)}`);
  } finally { teardownTempTree(tree.base); }
}

// Case 3 — one configured migration input deleted from the copied tree; the hardcoded list itself
// is untouched.
function runCase3() {
  const tree = setupTempTree();
  try {
    const targetRel = MIGRATION_INPUTS_REL[3]; // HeaderView.module.css
    rmSync(join(tree.base, targetRel));
    const outcome = evaluate(tree.base);
    const namesMissing = typeof outcome.fatal === 'string' && outcome.fatal.includes(targetRel);
    record('Case 3 (missing configured migration input is fatal)', 1, outcome.exitCode,
      namesMissing ? `fatal names the missing path: ${outcome.fatal}` : `fatal=${outcome.fatal}`);
  } finally { teardownTempTree(tree.base); }
}

// Case 4 — the copied AppImage.module.css's `inset: 0` changed to `inset: var(--space-0)` (D65-E).
function runCase4() {
  const tree = setupTempTree();
  try {
    const target = join(tree.base, EXPECTED_ZERO_INPUT_REL);
    const raw = readFileSync(target, 'utf8');
    const anchor = 'inset: 0;';
    if (!raw.includes(anchor)) {
      record('Case 4 (expected-zero reintroduced)', 1, 2, `pre-plant census failed — anchor "${anchor}" not found in copied ${EXPECTED_ZERO_INPUT_REL}`);
      return;
    }
    writeFileSync(target, raw.replace(anchor, 'inset: var(--space-0);'), 'utf8');
    const outcome = evaluate(tree.base);
    const hit = outcome.expectedZeroFindings?.find((f) => f.property === EXPECTED_ZERO_PROPERTY);
    record('Case 4 (expected-zero reintroduced, D65-E)', 1, outcome.exitCode,
      hit ? `reported ${hit.file}:${hit.line} ${hit.property}` : `expectedZeroFindings=${JSON.stringify(outcome.expectedZeroFindings)}`);
  } finally { teardownTempTree(tree.base); }
}

// Case 5 — unmodified copy: the passing control. Asserts THREE independent invariants (owner
// decision 2026-08-27), each failing on its own:
//   FULL_CENSUS       — exactly 94 pairs / 170 uses across the twelve manifest files, all five
//                       categories. Invariant across the rename: a rename adds no var() call site.
//   MIGRATED_TARGETS  — exactly 42 pairs / 79 uses, AND every approved (file, legacyProperty,
//                       expectedToken, uses) tuple matches, witnessed by an exact signature match.
//   BLOCKING          — exactly 0 pairs / 0 uses, and 0 expected-zero violations.
// A count alone is not sufficient: two wrong-but-root-owned substitutions can preserve every count.
// Only the per-tuple comparison and its signature catch that — see case 6.
function runCase5() {
  const tree = setupTempTree();
  try {
    const outcome = evaluate(tree.base);
    const s = outcome.summary;
    const t = outcome.targets;
    const checks = [
      [`FULL_CENSUS ${FULL_CENSUS_PAIRS}/${FULL_CENSUS_USES}`,
        s?.totalPairs === FULL_CENSUS_PAIRS && s?.totalUses === FULL_CENSUS_USES,
        `${s?.totalPairs}/${s?.totalUses}`],
      [`MIGRATED_TARGETS ${MIGRATION_TARGET_PAIRS}/${MIGRATION_TARGET_USES}`,
        t?.pairs === MIGRATION_TARGET_PAIRS && t?.uses === MIGRATION_TARGET_USES,
        `${t?.pairs}/${t?.uses}`],
      ['MIGRATION_SIGNATURE exact match', t?.signatureMatches === true, t?.observedSignature ?? 'n/a'],
      ['BLOCKING 0/0', s?.blockingPairCount === 0 && s?.blockingUseCount === 0,
        `${s?.blockingPairCount}/${s?.blockingUseCount}`],
      ['EXPECTED_ZERO 0', (outcome.expectedZeroFindings?.length ?? -1) === 0,
        String(outcome.expectedZeroFindings?.length)],
    ];
    const failed = checks.filter(([, ok]) => !ok);
    const detail = failed.length === 0
      ? `FULL_CENSUS=${s.totalPairs}/${s.totalUses}; MIGRATED_TARGETS=${t.pairs}/${t.uses}; BLOCKING=${s.blockingPairCount}/${s.blockingUseCount}; expected-zero=${outcome.expectedZeroFindings.length}; signature=${t.observedSignature}`
      : `FAILED invariant(s): ${failed.map(([name, , got]) => `${name} (got ${got})`).join('; ')}`;
    record('Case 5 (unmodified copy — three invariants asserted)', 0, outcome.exitCode, detail, failed.length === 0);
  } finally { teardownTempTree(tree.base); }
}

// Case 6 — semantic mutation: ONE migrated token replaced by a DIFFERENT but still perfectly valid
// root-owned token (`--foreground`, declared in globals.css's top-level `:root`). This is the arm
// that proves the gate checks the RIGHT token, not merely a plausible one:
//   • `theme-inline-only` stays 0 — the substitute is genuinely root-owned;
//   • `unknown` stays 0 — the name resolves;
//   • FULL_CENSUS is unchanged in uses — one call site swapped, none added or removed.
// Nothing but the approved-target comparison and its signature can see this defect.
function runCase6() {
  const tree = setupTempTree();
  try {
    const targetRel = 'src/components/layout/HeaderView.module.css';
    const target = join(tree.base, targetRel);
    const raw = readFileSync(target, 'utf8');
    const from = 'var(--homepage-runtime-space-2)';
    const to = 'var(--foreground)';
    if (!raw.includes(from)) {
      record('Case 6 (wrong-but-root-owned token substitution)', 1, 2,
        `pre-plant census failed — ${from} not found in copied ${targetRel}`);
      return;
    }
    writeFileSync(target, raw.replace(from, to), 'utf8');
    const outcome = evaluate(tree.base);
    const t = outcome.targets;
    const caughtBySignature = t?.signatureMatches === false && t.mismatches.length > 0;
    const stayedNonBlocking = outcome.summary?.blockingPairCount === 0 && (outcome.expectedZeroFindings?.length ?? -1) === 0;
    record('Case 6 (wrong-but-root-owned token substitution)', 1, outcome.exitCode,
      caughtBySignature
        ? `migration signature mismatch — ${t.mismatches[0]}; blocking stayed ${outcome.summary.blockingPairCount}/${outcome.summary.blockingUseCount} and expected-zero stayed ${outcome.expectedZeroFindings.length} (the substitute is legitimately root-owned), so ONLY the signature caught it; observed ${t.observedSignature}`
        : `NOT CAUGHT — signatureMatches=${t?.signatureMatches}, mismatches=${t?.mismatches?.length}, blocking=${outcome.summary?.blockingPairCount}`,
      caughtBySignature && stayedNonBlocking);
  } finally { teardownTempTree(tree.base); }
}

function runVerifyGate() {
  console.log('🔬  check:homepage-theme-runtime-deps self-test (--verify-gate) — 6 outcomes asserted (kickoff §10.4 + owner decision 2026-08-27)\n');
  runCase1();
  runCase2();
  runCase3();
  runCase4();
  runCase5();
  runCase6();
  console.log('');
  const failed = gateResults.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`❌  ${failed.length}/${gateResults.length} verify-gate assertion(s) did not behave as expected.`);
    process.exit(1);
  }
  console.log(`✅  ${gateResults.length}/${gateResults.length} verify-gate assertions behaved as expected.`);
  process.exit(0);
}

// ── CLI entrypoint ──
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--verify-gate')) runVerifyGate();
  else if (process.argv.includes('--report')) runReport();
  else run();
}
