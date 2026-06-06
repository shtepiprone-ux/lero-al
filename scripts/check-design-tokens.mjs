#!/usr/bin/env node
/**
 * check-design-tokens.mjs — Raw style-value detector (Epic JJ Phase 2, Task 402).
 *
 * Scans src/**\/*.{tsx,ts,css} for raw style-value literals that bypass the
 * design token system (Epic JJ). In report mode (default) always exits 0 and
 * prints a grouped inventory. In strict mode (--strict, NOT in CI until Task 407)
 * exits 1 on any non-allowlisted violation.
 *
 * Detects:
 *   - Color literals: #hex, rgb( / rgba( / hsl( / hsla( / oklch(
 *   - Length arbitrary Tailwind values: *-[Npx] / *-[Nrem]
 *   - Inline style px/rem string values in style props
 *   - Z-index arbitrary: z-[N] and inline zIndex: N
 *   - Shadow arbitrary: shadow-[...]
 *   - Duration arbitrary: duration-[...] and inline transitionDuration/animationDuration
 *
 * Does NOT flag:
 *   - var(--token) references
 *   - Named token utilities (p-4, text-sm, shadow-md, z-50, max-w-md, duration-200)
 *   - src/app/globals.css (the token source of truth — excluded entirely)
 *   - Entries in scripts/design-tokens-allowlist.json
 *
 * Usage:
 *   node scripts/check-design-tokens.mjs             — report mode (exit 0)
 *   node scripts/check-design-tokens.mjs --report    — same (explicit)
 *   node scripts/check-design-tokens.mjs --strict    — exit 1 on violation (NOT in CI yet)
 *   node scripts/check-design-tokens.mjs --update-allowlist — seed/refresh allowlist stubs
 *   npm run check:design-tokens
 *
 * Added by Task 402 (Sprint 35, 2026-06-06). Epic JJ Phase 2.
 * Docs: docs/design-system.md §23
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ALLOWLIST_PATH = resolve(__dirname, 'design-tokens-allowlist.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const STRICT_MODE = args.includes('--strict');
const UPDATE_ALLOWLIST = args.includes('--update-allowlist');
// --report is the default; --strict overrides the exit code
const REPORT_ONLY = !STRICT_MODE || args.includes('--report');

// ── File exclusions ───────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', 'storybook-static',
  '__tests__', 'tests',
]);
// globals.css is the token SOURCE — skip it entirely
const SKIP_FILES = new Set([
  'src/app/globals.css',
]);
const SKIP_SUFFIXES = ['.stories.tsx', '.test.tsx', '.test.ts'];

// ── Detection patterns ────────────────────────────────────────────────────────
//
// Each entry: { re, cat, label }
//   re    — RegExp with /g flag (reset lastIndex per line)
//   cat   — category key for grouping
//   label — human label for output
//
// NOT flagged by design: var(--token) (no # or rgb() in it), named Tailwind
// utilities (p-4 = no bracket, z-50 = no bracket, shadow-md = no bracket,
// duration-200 = no bracket), token definitions in globals.css (file excluded).
const DETECTION_PATTERNS = [
  // Color literals — hex (3/6/8 digit)
  {
    re: /#[0-9a-fA-F]{3,8}\b/g,
    cat: 'color',
    label: 'hex color',
  },
  // Color literals — functional notation (rgb/rgba/hsl/hsla/oklch)
  {
    re: /\b(rgb|rgba|hsl|hsla|oklch)\s*\(/g,
    cat: 'color',
    label: 'color function',
  },
  // Length: arbitrary Tailwind utility values with px or rem units
  // Matches: p-[13px], h-[340px], max-w-[220px], text-[10px], min-h-[44px]
  // Does NOT match: h-full, p-4, max-w-md, or h-[90vh], w-[100%]
  {
    re: /\b[\w-]+-\[[\d.]+(?:px|rem)\]/g,
    cat: 'length',
    label: 'arbitrary px/rem utility',
  },
  // Length: inline style px/rem string values (style prop objects)
  // Matches: width: '220px', height: "44px", maxWidth: '600px'
  // Does NOT match: className="...", var(--space-4)
  {
    re: /:\s*['"][\d.]+(?:px|rem)['"]/g,
    cat: 'length',
    label: 'inline style px/rem value',
  },
  // Z-index: arbitrary Tailwind class
  // Matches: z-[100], z-[9999], z-[2]
  // Does NOT match: z-50, z-30 (named utilities — no brackets)
  {
    re: /\bz-\[\d+\]/g,
    cat: 'z-index',
    label: 'arbitrary z-index class',
  },
  // Z-index: inline style object value
  // Matches: zIndex: 100, zIndex: 9999, zIndex: 50 (even if same as named utility)
  {
    re: /\bzIndex\s*:\s*\d+/g,
    cat: 'z-index',
    label: 'inline zIndex value',
  },
  // Shadow: arbitrary Tailwind class
  // Matches: shadow-[0_0_2px_red], shadow-[0_2px_4px_rgba(0,0,0,0.1)]
  // Does NOT match: shadow-sm, shadow-md (named utilities)
  {
    re: /\bshadow-\[[^\]]+\]/g,
    cat: 'shadow',
    label: 'arbitrary shadow class',
  },
  // Duration: arbitrary Tailwind class
  // Matches: duration-[450ms], duration-[1000ms]
  // Does NOT match: duration-200, duration-300 (named utilities)
  {
    re: /\bduration-\[[^\]]+\]/g,
    cat: 'duration',
    label: 'arbitrary duration class',
  },
  // Duration: inline style object — transitionDuration/animationDuration with raw ms
  {
    re: /\b(transitionDuration|animationDuration)\s*:\s*['"]?[\d]+ms/g,
    cat: 'duration',
    label: 'inline duration value',
  },
];

// ── Skip heuristics ───────────────────────────────────────────────────────────
function shouldSkipLine(line) {
  const trimmed = line.trimStart();
  // Comment lines
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // CSS comment lines
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  // Import / type declarations — no runtime style values
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}

// ── Area grouping ─────────────────────────────────────────────────────────────
function getArea(relPath) {
  if (relPath.startsWith('src/components/ui/')) return 'ui';
  if (relPath.startsWith('src/components/shared/')) return 'shared';
  if (relPath.startsWith('src/components/layout/')) return 'layout';
  if (relPath.startsWith('src/components/admin/')) return 'admin';
  if (relPath.startsWith('src/modules/admin/')) return 'admin';
  if (relPath.startsWith('src/modules/listings/') || relPath.startsWith('src/modules/listing/')) return 'listing';
  if (relPath.startsWith('src/modules/auth/')) return 'auth';
  if (relPath.startsWith('src/app/')) return 'app';
  if (relPath.startsWith('src/modules/')) return 'modules';
  return 'other';
}

// ── Allowlist loading + matching ──────────────────────────────────────────────
function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  } catch {
    console.error('⚠️  design-tokens-allowlist.json is not valid JSON. Run --update-allowlist to regenerate.');
    process.exit(1);
  }
}

function isAllowlisted(relPath, allowlist) {
  for (const key of Object.keys(allowlist)) {
    // Key is a path prefix (directory) or exact file match
    if (relPath === key || relPath.startsWith(key + '/') || relPath.startsWith(key)) {
      return true;
    }
  }
  return false;
}

function checkStaleEntries(allowlist) {
  const warnings = [];
  for (const key of Object.keys(allowlist)) {
    const full = join(ROOT, key);
    if (!existsSync(full)) {
      warnings.push(`  ⚠️  Stale allowlist entry — path not found: ${key}`);
    }
  }
  return warnings;
}

// ── File collection ───────────────────────────────────────────────────────────
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
      const rel = relative(ROOT, full).replace(/\\/g, '/');
      if (!SKIP_FILES.has(rel)) {
        results.push(full);
      }
    }
  }
  return results;
}

// ── File scanner ──────────────────────────────────────────────────────────────
function scanFile(filePath, allowlist) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
  if (isAllowlisted(relPath, allowlist)) return [];

  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { return []; }

  const lines = content.split('\n');
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (shouldSkipLine(line)) continue;

    for (const { re, cat, label } of DETECTION_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          file: relPath,
          line: lineNum,
          cat,
          label,
          match: m[0],
          area: getArea(relPath),
        });
      }
    }
  }

  return findings;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const allowlist = loadAllowlist();
  const staleWarnings = checkStaleEntries(allowlist);

  const srcDir = join(ROOT, 'src');
  const allFiles = collectFiles(srcDir, ['.tsx', '.ts', '.css']);

  console.log(`🔍  check:design-tokens — scanning ${allFiles.length} src/**/*.{tsx,ts,css} files`);
  console.log(`    (excludes globals.css, *.stories.tsx, *.test.tsx, and allowlisted paths)`);
  console.log('');

  if (staleWarnings.length > 0) {
    console.log('Allowlist warnings:');
    for (const w of staleWarnings) console.log(w);
    console.log('');
  }

  const allFindings = [];
  for (const f of allFiles) {
    allFindings.push(...scanFile(f, allowlist));
  }

  // ── --update-allowlist mode
  if (UPDATE_ALLOWLIST) {
    const existing = loadAllowlist();
    const newAllowlist = { ...existing };
    for (const f of allFindings) {
      if (!(f.file in newAllowlist)) {
        newAllowlist[f.file] = 'STUB: add justification (replace this before committing)';
      }
    }
    writeFileSync(ALLOWLIST_PATH, JSON.stringify(newAllowlist, null, 2) + '\n', 'utf8');
    const added = Object.keys(newAllowlist).length - Object.keys(existing).length;
    console.log(`✅  Allowlist updated → scripts/design-tokens-allowlist.json  (+${added} stub entries)`);
    console.log(`    Review each stub and replace "STUB: add justification" with a real reason.`);
    process.exit(0);
  }

  // ── Group findings by area → file → category
  const byArea = {};
  for (const finding of allFindings) {
    (byArea[finding.area] ??= {})[finding.file] ??= [];
    byArea[finding.area][finding.file].push(finding);
  }

  // ── Category summary counters
  const catCounts = {};
  for (const f of allFindings) {
    catCounts[f.cat] = (catCounts[f.cat] ?? 0) + 1;
  }

  // ── Print area-grouped report
  const AREA_ORDER = ['ui', 'shared', 'layout', 'admin', 'listing', 'auth', 'app', 'modules', 'other'];
  for (const area of AREA_ORDER) {
    const byFile = byArea[area];
    if (!byFile) continue;
    const areaCount = Object.values(byFile).reduce((s, a) => s + a.length, 0);
    console.log(`  ── ${area.toUpperCase()}  (${areaCount} violation${areaCount === 1 ? '' : 's'}) ──`);
    for (const file of Object.keys(byFile).sort()) {
      const items = byFile[file];
      console.log(`  ${file}  (${items.length})`);
      for (const { line, cat, label, match } of items) {
        console.log(`    :${line}  [${cat}:${label}]  "${match}"`);
      }
    }
    console.log('');
  }

  // ── Summary
  console.log(`  Total: ${allFindings.length} raw style-value violation(s) across ${Object.keys(byArea).length} area(s)`);
  if (Object.keys(catCounts).length > 0) {
    console.log('  By category:');
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${cat.padEnd(20)} ${count}`);
    }
  }
  console.log('');

  // ── Mode: strict vs. report
  if (STRICT_MODE && allFindings.length > 0) {
    console.error(`❌  check:design-tokens STRICT — ${allFindings.length} raw style-value violation(s) found.`);
    console.error('    Fix: replace raw values with design tokens from docs/design-system.md §22,');
    console.error('    or add a justified entry to scripts/design-tokens-allowlist.json.');
    console.error('    Docs: docs/design-system.md §22–23');
    process.exit(1);
  }

  if (allFindings.length === 0) {
    console.log('✅  check:design-tokens — 0 raw style-value violations found.');
  } else {
    console.log(`📋  Report mode — ${allFindings.length} violation(s) listed above (inventory for Tasks 403–406).`);
    console.log('    Run with --strict to block on these. Strict gate lands in Task 407.');
  }

  process.exit(0);
}

run();
