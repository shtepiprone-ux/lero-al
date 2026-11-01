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
  // Cron lifecycle: expiry sweep finds active+lapsed to transition via engine
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".eq('status', 'active')", reason: 'lifecycle expiry sweep — engine-driven status transition, not a public read' },
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".lt('expires_at', now)", reason: 'lifecycle expiry sweep — finds lapsed listings to expire' },
  { path: 'src/app/api/cron/listings-expiry/route.ts', fingerprint: ".is('expires_at', null)", reason: 'lifecycle expiry sweep — finds null-expiry listings to report' },
  // Single-row detail/view reads: multi-status filter for display (not public list visibility)
  { path: 'src/app/api/listings/[slug]/view/route.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'single-row view-count increment, multi-status display filter' },
  { path: 'src/app/[locale]/listings/[slug]/page.tsx', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'single-row detail page, multi-status display filter' },
  // Recently-viewed resolution: by saved IDs, multi-status filter
  { path: 'src/modules/listings/lib/recentlyViewedQueries.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'recently-viewed resolution by saved IDs, not a public list read' },
  // Contact-event lookup: one listing by id via service role (Task 850/887)
  { path: 'src/modules/listings/actions/contactEvents.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])", reason: 'single-row WhatsApp contact-event lookup by id (service role, Task 850) — link-reachable status set, not a public list read' },
  // Arrow-factory reads (Task 863): reached through listingCount()/ownListings() call sites
  { path: 'src/modules/admin/dashboard/queries.ts', fingerprint: ".eq('status', 'active')", reason: 'ADM-11 consistency check only (Task 847 R3) — raw active head:true count, never displayed, not a public read' },
  { path: 'src/modules/cabinet/statistics/data.ts', fingerprint: ".gte('expires_at', window.startUtc)", reason: 'AGT-01 expiring window on an applyPublicVisibility set (Task 848) — not a visibility predicate' },
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

const SCOPE_LINE =
  "ℹ️  Scope: inspects from('listings') blocks in src/**/*.{ts,tsx} minus excluded paths — direct chains, derived variables (including a multi-line `let q = supabase` / `.from('listings')` declaration), and same-file arrow factories (call sites, their continuation lines, variables assigned from them). " +
  "CANNOT see: factories declared with `function`, factories whose from('listings') is on a later line than the declaration, factories imported from another module / passed as arguments / stored on objects, or predicates built with dynamic strings.";

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
 * 2. Derived variables — `let/const <name> = ...from('listings')...` (the declaration may span lines:
 *    `let <name> = <identifier>`, then `.from('listings')` on the next line), then later
 *    lines referencing `<name>.method(...)` or `<name> = <name>.method(...)`.
 *
 * 3. Arrow factories — `const <name> = (...) => ...from('listings')...`; every call of
 *    `<name>(` in the same file, its `.` continuation lines and variables assigned from it.
 *
 * Write operations (.update/.insert/.delete/.upsert) are excluded at block level
 * (shape 3: per call-site block, so a write at one call never hides a read at another).
 */
function extractListingsQueryBlocks(lines) {
  const blocks = [];
  const fromRe = /from\(\s*['"]listings['"]\s*\)/;
  // Matches: const/let <name> = <expr>from('listings')<expr>
  const assignRe = /(?:const|let)\s+(\w+)\s*=.*from\(\s*['"]listings['"]\s*\)/;
  // Task 857 R13: multi-line declaration — `const|let <name> = [await] <identifier>` on one line and
  // `.from('listings')` starting the next.
  const multiLineDeclRe = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?[\w$.]+\s*$/;
  const continuedFromRe = /^\s*\.\s*from\(\s*['"]listings['"]\s*\)/;

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
    let varName = assignMatch ? assignMatch[1] : null;
    if (!varName && i > 0 && continuedFromRe.test(lines[i])) {
      const declMatch = lines[i - 1].match(multiLineDeclRe);
      if (declMatch) varName = declMatch[1];
    }
    if (varName) {
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

    // Shape 3: arrow factory — `const <name> = (...) => ...from('listings')...`. The builder is
    // returned by the factory and chained where the factory is CALLED, so every call site
    // (anywhere in the file) is its own block, with its own write exclusion.
    if (assignMatch) {
      const between = lines[i].slice(lines[i].indexOf('=', assignMatch.index), lines[i].search(fromRe));
      if (between.includes('=>')) {
        blocks.push(...extractFactoryCallBlocks(lines, i, assignMatch[1]));
      }
    }
  }
  return blocks;
}

/**
 * Call-site blocks for one arrow factory (name is \w+, so regex-safe).
 * Block = the call line + its `.`-continuation lines + lines that chain a variable
 * assigned from the call. The write exclusion is applied per call-site block.
 */
function extractFactoryCallBlocks(lines, declIdx, name) {
  const out = [];
  const callRe = new RegExp(`\\b${name}\\s*\\(`);
  const varFromCallRe = new RegExp(`(?:const|let)\\s+(\\w+)[^=]*=.*\\b${name}\\s*\\(`);
  for (let k = 0; k < lines.length; k++) {
    if (k === declIdx || !callRe.test(lines[k])) continue;
    const block = [{ idx: k, text: lines[k] }];
    let j = k + 1;
    while (j < lines.length && /^\s*\./.test(lines[j])) {
      block.push({ idx: j, text: lines[j] });
      j++;
    }
    const varMatch = lines[k].match(varFromCallRe);
    if (varMatch) {
      const v = varMatch[1];
      const varUseRe = new RegExp(`(?:^|\\b)${v}\\s*(?:=\\s*(?:await\\s+)?${v}\\s*\\.|\\.)`);
      for (let m = j; m < lines.length; m++) {
        if (varUseRe.test(lines[m])) block.push({ idx: m, text: lines[m] });
      }
    }
    if (!WRITE_METHODS.test(block.map(b => b.text).join('\n'))) out.push(block);
  }
  return out;
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
    { label: "factory: listingCount().eq('status','active') head:true count",
      code: `const listingCount = () => db.from('listings').select('id', { count: 'exact', head: true })\nconst n = await countOf(() => listingCount().eq('status', 'active'))` },
    { label: "factory: call line + .gte('expires_at') continuation",
      code: `const base = () => supabase.from('listings').select('*')\nconst { data } = await base()\n  .gte('expires_at', now)` },
    { label: "factory with args: byOwner(uid).in('status',['active'])",
      code: `const byOwner = (id) => db.from('listings').select('id').eq('user_id', id)\nconst { data } = await byOwner(uid).in('status', ['active'])` },
    { label: "factory: write at one call site does not hide a read at another",
      code: `const base = () => supabase.from('listings').select('*')\nawait base().update({ status: 'x' }).eq('id', id)\nconst r = await base().eq('status', 'active')` },
    { label: "factory: variable assigned from factory call, then q.lt('expires_at')",
      code: `const base = () => supabase.from('listings').select('*')\nlet q = base()\nq = q.lt('expires_at', now)` },
    { label: "multi-line declaration: query = query.eq('status','active')",
      code: "let query = supabase\n  .from('listings')\n  .select(`\n    id, title\n  `, { count: 'exact' })\n  .order('created_at', { ascending: false })\nquery = query.eq('status', 'active')" },
    { label: "multi-line declaration: query.gte('expires_at')",
      code: "let query = supabase\n  .from('listings')\n  .select('*')\nquery = query.gte('expires_at', now)" },
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
    { label: "factory wrapped by applyPublicVisibility, no literal",
      code: `const listingCount = () => db.from('listings').select('id', { count: 'exact', head: true })\nconst n = await countOf(() => applyPublicVisibility(listingCount()))` },
    { label: "factory chained with dynamic .eq('status', status)",
      code: `const listingCount = () => db.from('listings').select('id', { count: 'exact', head: true })\nconst n = await listingCount().eq('status', status)` },
    { label: "factory over another table with .gte('expires_at')",
      code: `const tokens = () => db.from('email_change_tokens').select('*')\nconst r = await tokens().gte('expires_at', now)` },
    { label: "factory call site that writes",
      code: `const base = () => supabase.from('listings').select('*')\nawait base().update({ status: 'active' }).eq('id', id)` },
    { label: "factory declared, never called",
      code: `const base = () => supabase.from('listings').select('*')` },
    { label: "multi-line declaration + dynamic .eq('status', status)",
      code: "let query = supabase\n  .from('listings')\n  .select('*')\nquery = query.eq('status', status)" },
    { label: "multi-line declaration + applyPublicVisibility(query)",
      code: "let query = supabase\n  .from('listings')\n  .select('*')\nquery = applyPublicVisibility(query)" },
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

console.log(SCOPE_LINE);

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

console.error(`   Allowlist: ${ALLOWLIST.length} entries, ${staleEntries.length} stale.`);

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
