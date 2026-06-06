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
 *   - Entries in scripts/design-tokens-allowlist.json (path-level allowlist)
 *   - Values covered by a same-line design-tokens-allow: <value> — <reason> marker
 *
 * Inline suppression (Task 403, Part 0):
 *   Place a comment on the SAME physical line as the match:
 *     // design-tokens-allow: <exact raw value> — <reason>
 *   One marker suppresses one exact value string on that physical line. Distinct
 *   raw values on the same line need distinct markers. Duplicate occurrences of
 *   the same exact value on the same physical line are suppressed together; split
 *   the line if occurrence-level control is needed.
 *   A missing or empty <reason> (nothing after —) is an ERROR in both modes.
 *   A marker whose <exact raw value> is not found on the line is a stale-marker
 *   violation (detected in both modes; exits 1 in strict).
 *
 * Usage:
 *   node scripts/check-design-tokens.mjs             — report mode (exit 0)
 *   node scripts/check-design-tokens.mjs --report    — same (explicit)
 *   node scripts/check-design-tokens.mjs --strict    — exit 1 on violation (NOT in CI yet)
 *   node scripts/check-design-tokens.mjs --update-allowlist — seed/refresh allowlist stubs
 *   npm run check:design-tokens
 *
 * Added by Task 402 (Sprint 35, 2026-06-06). Epic JJ Phase 2.
 * Inline suppression added by Task 403 (Sprint 35, 2026-06-06). Epic JJ Phase 3.
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
  // Comment-only lines (value inside a trailing // comment is not runtime code)
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // CSS comment lines
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  // Import / type declarations — no runtime style values
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}

// ── Inline suppression (design-tokens-allow: <value> — <reason>) ─────────────
//
// One marker suppresses one exact value string on that physical line.
// Distinct raw values on the same line need distinct markers.
// Duplicate occurrences of the same exact value on the same physical line are
// suppressed together; split the line if occurrence-level control is needed.
// A missing/empty reason is an ERROR (exit 1 in both report and strict modes).
// A marker whose rawValue is absent from the line's detections = stale-marker violation.
const ALLOW_MARKER_PREFIX = 'design-tokens-allow:';

// Returns Array of { rawValue: string, hasReason: boolean }
function parseInlineMarkers(line) {
  const results = [];
  let searchFrom = 0;
  while (true) {
    const pos = line.indexOf(ALLOW_MARKER_PREFIX, searchFrom);
    if (pos === -1) break;

    const afterPrefix = line.slice(pos + ALLOW_MARKER_PREFIX.length).trimStart();
    if (!afterPrefix) {
      searchFrom = pos + ALLOW_MARKER_PREFIX.length;
      continue;
    }

    // Extract the value (non-whitespace sequence = a Tailwind/CSS class name)
    const valueMatch = afterPrefix.match(/^(\S+)/);
    if (!valueMatch) {
      searchFrom = pos + ALLOW_MARKER_PREFIX.length;
      continue;
    }
    const rawValue = valueMatch[1];

    // Look for the em-dash separator (—) followed by a non-empty reason
    const afterValue = afterPrefix.slice(rawValue.length).trimStart();
    let hasReason = false;
    if (afterValue.startsWith('—')) {
      const reasonPart = afterValue.slice(1).trim();
      hasReason = reasonPart.length > 0;
    }

    results.push({ rawValue, hasReason });
    searchFrom = pos + ALLOW_MARKER_PREFIX.length + rawValue.length;
  }
  return results;
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

    // Strip trailing // comment before detection so that the marker text itself
    // (which contains the suppressed value string) is not scanned as a violation.
    // parseInlineMarkers runs on the full original line to find the markers.
    const codeOnly = line.replace(/\s*\/\/.*$/, '');

    // Collect all pattern matches on the code portion of this line
    const rawMatches = [];
    for (const { re, cat, label } of DETECTION_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(codeOnly)) !== null) {
        rawMatches.push({
          file: relPath,
          line: lineNum,
          cat,
          label,
          match: m[0],
          area: getArea(relPath),
        });
      }
    }

    // Parse inline suppression markers from the full line (including comment)
    const markers = parseInlineMarkers(line);

    if (rawMatches.length === 0 && markers.length === 0) continue;

    // Build set of detected value strings on this line
    const detectedValues = new Set(rawMatches.map(f => f.match));

    // Process each marker: check for stale or missing-reason
    const suppressedValues = new Set();
    for (const { rawValue, hasReason } of markers) {
      if (!detectedValues.has(rawValue)) {
        // Stale marker — value not detected on this line
        findings.push({
          file: relPath,
          line: lineNum,
          cat: 'stale-marker',
          label: 'stale inline suppression (value not detected on this line)',
          match: rawValue,
          area: getArea(relPath),
        });
      } else if (!hasReason) {
        // Missing/empty reason — this is always an error (exit 1 in both modes)
        findings.push({
          file: relPath,
          line: lineNum,
          cat: 'missing-reason',
          label: 'design-tokens-allow marker missing reason after —',
          match: rawValue,
          area: getArea(relPath),
        });
        // A missing-reason marker does NOT suppress the value
      } else {
        // Valid marker with reason — suppress this exact value on this line
        suppressedValues.add(rawValue);
      }
    }

    // Emit unsuppressed matches as findings
    for (const finding of rawMatches) {
      if (!suppressedValues.has(finding.match)) {
        findings.push(finding);
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

  // ── --update-allowlist mode (only uses regular findings, not marker errors)
  if (UPDATE_ALLOWLIST) {
    const existing = loadAllowlist();
    const newAllowlist = { ...existing };
    const regularFindings = allFindings.filter(f => f.cat !== 'missing-reason' && f.cat !== 'stale-marker');
    for (const f of regularFindings) {
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

  // ── Separate finding types
  const missingReasonFindings = allFindings.filter(f => f.cat === 'missing-reason');
  const staleMarkerFindings = allFindings.filter(f => f.cat === 'stale-marker');
  const regularFindings = allFindings.filter(f => f.cat !== 'missing-reason' && f.cat !== 'stale-marker');

  // ── Group findings by area → file → category
  const byArea = {};
  for (const finding of allFindings) {
    (byArea[finding.area] ??= {})[finding.file] ??= [];
    byArea[finding.area][finding.file].push(finding);
  }

  // ── Category summary counters (regular violations only)
  const catCounts = {};
  for (const f of regularFindings) {
    catCounts[f.cat] = (catCounts[f.cat] ?? 0) + 1;
  }

  // ── Print area-grouped report
  const AREA_ORDER = ['ui', 'shared', 'layout', 'admin', 'listing', 'auth', 'app', 'modules', 'other'];
  for (const area of AREA_ORDER) {
    const byFile = byArea[area];
    if (!byFile) continue;
    const areaCount = Object.values(byFile).reduce((s, a) => s + a.length, 0);
    console.log(`  ── ${area.toUpperCase()}  (${areaCount} finding${areaCount === 1 ? '' : 's'}) ──`);
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
  console.log(`  Total: ${regularFindings.length} raw style-value violation(s) | ${staleMarkerFindings.length} stale-marker(s) | ${missingReasonFindings.length} missing-reason error(s)`);
  if (Object.keys(catCounts).length > 0) {
    console.log('  By category (regular violations):');
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${cat.padEnd(20)} ${count}`);
    }
  }
  console.log('');

  // ── missing-reason is always an error (exit 1 in BOTH report and strict modes)
  if (missingReasonFindings.length > 0) {
    console.error(`❌  check:design-tokens — ${missingReasonFindings.length} design-tokens-allow marker(s) with missing or empty reason.`);
    console.error('    Every design-tokens-allow: marker MUST have a non-empty reason after the — separator.');
    console.error('    Example: // design-tokens-allow: rounded-[4px] — 4px corner, no scale token');
    console.error('    Docs: docs/design-system.md §23.2');
    process.exit(1);
  }

  // ── Mode: strict vs. report
  if (STRICT_MODE && (regularFindings.length > 0 || staleMarkerFindings.length > 0)) {
    console.error(`❌  check:design-tokens STRICT — ${regularFindings.length} raw style-value violation(s) + ${staleMarkerFindings.length} stale-marker(s) found.`);
    console.error('    Fix: replace raw values with design tokens from docs/design-system.md §22,');
    console.error('    or add a justified entry to scripts/design-tokens-allowlist.json (path-level),');
    console.error('    or add a same-line // design-tokens-allow: <value> — <reason> marker (exact-value).');
    console.error('    Docs: docs/design-system.md §22–23');
    process.exit(1);
  }

  if (regularFindings.length === 0 && staleMarkerFindings.length === 0) {
    console.log('✅  check:design-tokens — 0 violations found.');
  } else {
    if (staleMarkerFindings.length > 0) {
      console.log(`⚠️  ${staleMarkerFindings.length} stale-marker(s) listed above — remove or correct the design-tokens-allow marker(s).`);
    }
    if (regularFindings.length > 0) {
      console.log(`📋  Report mode — ${regularFindings.length} violation(s) listed above (inventory for Tasks 403–406).`);
      console.log('    Run with --strict to block on these. Strict gate lands in Task 407.');
    }
  }

  process.exit(0);
}

run();
