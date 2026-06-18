#!/usr/bin/env node
/**
 * check-listing-visibility.mjs — Listing public-visibility invariant gate (Epic LV / LV.4, Task 457).
 *
 * Context-aware scanner: finds `from('listings')` query blocks in src/**\/*.{ts,tsx},
 * then detects inline public-visibility literals within those blocks that bypass the
 * canonical `applyPublicVisibility` / `applyPublicEligibleButHidden`.
 *
 * Detector logic is ONE pure exported function (`detectVisibilityViolations`) shared
 * by both the CI scan AND the self-test (--verify-gate).
 *
 * Usage:
 *   node scripts/check-listing-visibility.mjs                 — strict (exit 1 on violation)
 *   node scripts/check-listing-visibility.mjs --report        — report mode (exit 0)
 *   node scripts/check-listing-visibility.mjs --verify-gate   — self-test (Part B)
 *   npm run check:listing-visibility
 *   npm run check:listing-visibility:verify
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CANONICAL_SOURCE = 'src/modules/listings/lib/visibility.ts';
const ANCHOR = 'VISIBILITY_POLICY_ANCHOR';

const args = process.argv.slice(2);
const REPORT_ONLY = args.includes('--report');
const VERIFY_GATE = args.includes('--verify-gate');

// ── Excluded paths (narrow: canonical source + test/story/fixture/script globs ONLY) ─

const EXCLUDED_PATH_PATTERNS = [
  /^src\/modules\/listings\/lib\/visibility\.ts$/,
  /\/__tests__\//, /\.test\./, /\.stories\./, /\/stories\//, /\/fixtures\//, /^scripts\//,
];

function isExcluded(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return EXCLUDED_PATH_PATTERNS.some(p => p.test(norm));
}

// ── Exact/narrow allowlist — each entry pins path + fingerprint + reason ─────
// Seeded with ONLY the real justified hits that exist on the current tree.
// No whole-file entries. Stale entries FAIL the gate.

const ALLOWLIST = [
  // Admin dashboard stats: count-only queries, not public reads
  { path: 'src/app/admin/page.tsx', fingerprint: ".eq('status', 'active')", reason: 'admin dashboard active-count stat (head:true count, not a public list read)' },
  // Cron lifecycle: expiry sweep finds active+lapsed to transition via engine
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".eq('status', 'active')", reason: 'lifecycle expiry sweep — engine-driven status transition, not a public read' },
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".lt('expires_at', now)", reason: 'lifecycle expiry sweep — finds lapsed listings to expire' },
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".is('expires_at', null)", reason: 'lifecycle expiry sweep — finds null-expiry listings to report' },
  // Single-row detail/view reads: multi-status filter for display (not public list visibility)
  { path: 'src/app/api/listings/[slug]/view/route.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'single-row view-count increment, multi-status display filter' },
  { path: 'src/app/[locale]/listings/[slug]/page.tsx', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'single-row detail page, multi-status display filter' },
  // Recently-viewed resolution: by saved IDs, multi-status filter
  { path: 'src/modules/listings/lib/recentlyViewedQueries.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'recently-viewed resolution by saved IDs, not a public list read' },
];

function isAllowlisted(relPath, matchedText) {
  const norm = relPath.replace(/\\/g, '/');
  return ALLOWLIST.some(e => norm === e.path && matchedText.includes(e.fingerprint));
}

// ── Visibility-literal patterns ─────────────────────────────────────────────

const VISIBILITY_PATTERNS = [
  /\.eq\(\s*['"]status['"]\s*,\s*['"]active['"]\s*\)/,
  /\.in\(\s*['"]status['"]\s*,\s*\[.*['"]active['"].*\]\s*\)/,
  /\.match\(\s*\{[^}]*status\s*:\s*['"]active['"][^}]*\}\s*\)/,
  /\.filter\(\s*['"]status['"]\s*,\s*['"]eq['"]\s*,\s*['"]active['"]\s*\)/,
  /status\.eq\.active/,
  /\.gte\(\s*['"]expires_at['"]/,
  /\.lt\(\s*['"]expires_at['"]/,
  /\.is\(\s*['"]expires_at['"]\s*,\s*null\s*\)/,
  /expires_at\.(gte|lt|is)\./,
];

const WRITE_METHODS = /\.(update|insert|upsert|delete)\s*\(/;

// ── Detector — ONE pure function, shared by scan AND self-test ──────────────
//
// Context-aware: extracts `from('listings')` query blocks, then checks only
// those blocks for visibility patterns. Non-listings reads, writes, and
// other-table queries are never flagged.

/**
 * Extract query blocks anchored on `from('listings')`.
 *
 * Two shapes are captured:
 * 1. Inline chains — `from('listings')` followed by continuation `.method()` lines.
 * 2. Derived variables — `let/const <name> = ...from('listings')...`, then later
 *    lines referencing `<name>.method(...)` or `<name> = <name>.method(...)`.
 *
 * Write operations (.update/.insert/.delete/.upsert) are excluded at block level.
 */
function extractListingsQueryBlocks(lines) {
  const blocks = [];
  const fromRe = /from\(\s*['"]listings['"]\s*\)/;
  // Matches: const/let <name> = <expr>from('listings')<expr>
  const assignRe = /(?:const|let)\s+(\w+)\s*=.*from\(\s*['"]listings['"]\s*\)/;

  for (let i = 0; i < lines.length; i++) {
    if (!fromRe.test(lines[i])) continue;

    const blockLines = [{ idx: i, text: lines[i] }];

    // Shape 1: immediate continuation lines (`.method(...)`)
    let j = i + 1;
    while (j < lines.length && /^\s*\./.test(lines[j])) {
      blockLines.push({ idx: j, text: lines[j] });
      j++;
    }

    // Shape 2: derived variable — scan rest of scope for `varName.method(` or `varName = varName.method(`
    const assignMatch = lines[i].match(assignRe);
    if (assignMatch) {
      const varName = assignMatch[1];
      const varUseRe = new RegExp(
        `(?:^|\\b)${varName}\\s*(?:=\\s*(?:await\\s+)?${varName}\\s*\\.|\\.)`
      );
      for (let k = j; k < lines.length; k++) {
        if (varUseRe.test(lines[k])) {
          blockLines.push({ idx: k, text: lines[k] });
        }
      }
    }

    const fullText = blockLines.map(b => b.text).join('\n');
    if (!WRITE_METHODS.test(fullText)) {
      blocks.push(blockLines);
    }
  }
  return blocks;
}

/**
 * Detect inline visibility literals in source code.
 * @param {string} source - File content
 * @param {string} filePath - Relative path (for reporting)
 * @returns {Array<{line: number, text: string, pattern: string}>} Violations found
 */
export function detectVisibilityViolations(source, filePath) {
  const violations = [];
  const lines = source.split('\n');

  const blocks = extractListingsQueryBlocks(lines);
  if (blocks.length === 0) return violations;

  for (const block of blocks) {
    for (const { idx, text } of block) {
      const trimmed = text.trim();
      if (/^\s*\/\//.test(text) || /^\s*\*/.test(text)) continue;

      for (const pattern of VISIBILITY_PATTERNS) {
        if (pattern.test(trimmed)) {
          if (!isAllowlisted(filePath, trimmed)) {
            violations.push({ line: idx + 1, text: trimmed, pattern: pattern.source });
          }
          break;
        }
      }
    }
  }

  return violations;
}

// ── Self-test mode (Part B) ─────────────────────────────────────────────────

function runSelfTest() {
  console.log('🔬 Listing visibility gate self-test (--verify-gate)\n');

  // Bad snippets: each is a from('listings') block with a visibility literal
  const BAD_SNIPPETS = [
    { label: ".eq('status','active')",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .eq('status', 'active')\n  .gte('expires_at', now)` },
    { label: ".in('status',['active'])",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .in('status', ['active'])` },
    { label: ".in('status',['active','pending']) multi-status with active",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .in('status', ['active', 'pending'])` },
    { label: ".match({status:'active'})",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .match({ status: 'active' })` },
    { label: ".filter('status','eq','active')",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .filter('status', 'eq', 'active')` },
    { label: "PostgREST status.eq.active",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .or('status.eq.active,status.eq.pending')` },
    { label: ".gte('expires_at',...)",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .gte('expires_at', new Date().toISOString())` },
    { label: ".lt('expires_at',...) on listings read",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .lt('expires_at', now)` },
    { label: ".is('expires_at', null) on listings read",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .is('expires_at', null)` },
    { label: "expires_at.gte in or()",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .or('expires_at.gte.2026-01-01')` },
    { label: "derived var: query.eq('status','active')",
      code: `let query = supabase.from('listings').select('*')\nquery = query.eq('status', 'active')` },
    { label: "derived var: query.in('status',['active','pending'])",
      code: `let query = supabase.from('listings').select('*')\nquery = query.in('status', ['active', 'pending'])` },
    { label: "derived var: query.lt('expires_at', now)",
      code: `let query = supabase.from('listings').select('*')\nquery = query.lt('expires_at', now)` },
  ];

  // Good snippets: canonical helpers (no from('listings') chain)
  const GOOD_SNIPPETS = [
    { label: "canonical applyPublicVisibility", code: `query = applyPublicVisibility(query)` },
    { label: "canonical applyPublicEligibleButHidden", code: `query = applyPublicEligibleButHidden(query, { reason })` },
    { label: "formatVisibility call", code: `const vis = formatVisibility({ status, expires_at })` },
  ];

  // No-false-positive snippets
  const NO_FALSE_POSITIVE_SNIPPETS = [
    { label: "dynamic .eq('status', param) on listings",
      code: `const { data } = await supabase\n  .from('listings')\n  .select('*')\n  .eq('status', statusParam)` },
    { label: "status write/update on listings",
      code: `const { data } = await supabase\n  .from('listings')\n  .update({ status: 'active' })\n  .eq('id', listingId)` },
    { label: "other-table .gte('expires_at',...)",
      code: `const { data } = await db\n  .from('email_change_tokens')\n  .select('*')\n  .gte('expires_at', new Date().toISOString())` },
    { label: "comment with active pattern",
      code: `// .eq('status', 'active') — just a comment\nconst { data } = await supabase\n  .from('listings')\n  .select('*')` },
  ];

  let passed = 0;
  let failed = 0;

  for (const { label, code } of BAD_SNIPPETS) {
    const hits = detectVisibilityViolations(code, 'test-bad.ts');
    if (hits.length > 0) {
      console.log(`  ✅ DETECTED: ${label}`);
      passed++;
    } else {
      console.log(`  ❌ MISSED:   ${label}`);
      failed++;
    }
  }

  for (const { label, code } of GOOD_SNIPPETS) {
    const hits = detectVisibilityViolations(code, 'test-good.ts');
    if (hits.length === 0) {
      console.log(`  ✅ CLEAN:    ${label}`);
      passed++;
    } else {
      console.log(`  ❌ FALSE+:   ${label} (flagged ${hits.length} hit(s))`);
      failed++;
    }
  }

  for (const { label, code } of NO_FALSE_POSITIVE_SNIPPETS) {
    const hits = detectVisibilityViolations(code, 'test-nofp.ts');
    if (hits.length === 0) {
      console.log(`  ✅ NO-FP:    ${label}`);
      passed++;
    } else {
      console.log(`  ❌ FALSE+:   ${label} (flagged ${hits.length} hit(s))`);
      failed++;
    }
  }

  console.log(`\nSelf-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('\n❌ Gate self-test FAILED — the detector is broken.');
    process.exit(1);
  }
  console.log('✅ Gate self-test PASSED — detector is live and precise.');
  process.exit(0);
}

if (VERIFY_GATE) {
  runSelfTest();
}

// ── Scan mode ───────────────────────────────────────────────────────────────

function collectFiles(dir, exts) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === 'storybook-static') continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.includes(extname(full))) {
      results.push(full);
    }
  }
  return results;
}

const canonicalPath = resolve(ROOT, CANONICAL_SOURCE);
if (!existsSync(canonicalPath)) {
  console.error(`❌ Canonical source missing: ${CANONICAL_SOURCE}`);
  process.exit(1);
}
const canonicalSource = readFileSync(canonicalPath, 'utf8');
if (!canonicalSource.includes(ANCHOR)) {
  console.error(`❌ ${ANCHOR} missing from ${CANONICAL_SOURCE} — the canonical policy source has been tampered with.`);
  process.exit(1);
}

const srcDir = resolve(ROOT, 'src');
const files = collectFiles(srcDir, ['.ts', '.tsx']);
const allViolations = [];

for (const filePath of files) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
  if (isExcluded(relPath)) continue;

  const source = readFileSync(filePath, 'utf8');
  const hits = detectVisibilityViolations(source, relPath);
  for (const hit of hits) {
    allViolations.push({ path: relPath, ...hit });
  }
}

// Stale allowlist check: each entry must match a real detector hit
const staleEntries = ALLOWLIST.filter(entry => {
  const fp = resolve(ROOT, entry.path);
  if (!existsSync(fp)) return true;
  const source = readFileSync(fp, 'utf8');
  // Run detector WITHOUT allowlist filtering to see raw hits
  const lines = source.split('\n');
  const blocks = extractListingsQueryBlocks(lines);
  for (const block of blocks) {
    for (const { text } of block) {
      const trimmed = text.trim();
      if (trimmed.includes(entry.fingerprint)) return false;
    }
  }
  return true;
});

if (allViolations.length === 0 && staleEntries.length === 0) {
  console.log('✅ Listing public-visibility invariant gate PASSED — 0 violations.');
  console.log(`   Anchor ${ANCHOR} present in ${CANONICAL_SOURCE}.`);
  console.log(`   Allowlist: ${ALLOWLIST.length} entries, 0 stale.`);
  console.log(`   Scanned ${files.length} files.`);
  process.exit(0);
}

if (staleEntries.length > 0) {
  console.error('\n❌ Stale allowlist entries (no longer match — remove them):');
  for (const e of staleEntries) {
    console.error(`   ${e.path} — fingerprint: "${e.fingerprint}" — reason: ${e.reason}`);
  }
}

if (allViolations.length > 0) {
  console.error(`\n❌ ${allViolations.length} inline visibility literal(s) on listings reads:\n`);
  for (const v of allViolations) {
    console.error(`   ${v.path}:${v.line}  ${v.text}`);
  }
  console.error('\n   Remediation: route this read through `applyPublicVisibility` or');
  console.error('   `applyPublicEligibleButHidden` in `src/modules/listings/lib/visibility.ts`.');
}

const totalIssues = allViolations.length + staleEntries.length;
if (REPORT_ONLY) {
  console.log(`\n⚠️  ${totalIssues} issue(s) found (report mode — exit 0).`);
  process.exit(0);
} else {
  console.error(`\n❌ ${totalIssues} issue(s) — gate FAILED.`);
  process.exit(1);
}
