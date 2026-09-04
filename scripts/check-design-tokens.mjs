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
 *   - Length function-wrapped arbitrary values: *-[calc(...)] / *-[min(...)] /
 *     *-[max(...)] / *-[clamp(...)] containing a raw px/rem literal with NO
 *     var(--token) reference anywhere in the brackets (incl. viewport-relative
 *     forms, e.g. min-h-[calc(100vh-4rem)] — no broad viewport exemption)
 *   - Inline style px/rem string values in style props
 *   - Z-index arbitrary: z-[N] and inline zIndex: N / 'z-index': N
 *   - Shadow arbitrary: shadow-[...] (including negative-offset, e.g. shadow-[0_-2px_...])
 *   - Duration arbitrary: duration-[...] and inline transitionDuration/animationDuration
 *   - Undefined CSS custom-property references: var(--x) in a .css file where --x
 *     resolves against NONE of globals.css / the same file / a measured external
 *     prefix-or-exact-name list (Task 718, category css-undefined-var, blocking
 *     from the start — see "A documented token is not an implemented token" in
 *     docs/orchestrator-procedures.md)
 *   - Raw numeric or unit-bearing dimension JSX props. This covers Mantine's
 *     size/constraint props plus layout spacing, component-specific dimension props,
 *     and numeric inline-style dimensions. `={0}` remains exempt where it expresses
 *     flex behaviour rather than a design value.
 *   - Named Tailwind dimension utilities in canonical Mantine stories. Production
 *     stories remain fixtures for the other categories, but a Mantine story must not
 *     reintroduce the Tailwind size/spacing syntax that its production source retired.
 *
 * Does NOT flag:
 *   - var(--token) references, including function-wrapped *-[var(--token)] forms
 *     (e.g. rounded-[min(var(--radius-md),10px)], rounded-[calc(var(--radius)-5px)] —
 *     token-anchored function forms are exempt even if they also contain px/rem)
 *   - Named token utilities (p-4, text-sm, shadow-md, z-50, max-w-md, duration-200)
 *   - Non-literal inline z-index (zIndex: Z_TOKEN, zIndex: 'var(--z-toast)', zIndex: someVar)
 *   - src/app/globals.css (the token source of truth — excluded entirely)
 *   - Entries in scripts/design-tokens-allowlist.json (path-level allowlist)
 *   - Values covered by a same-line design-tokens-allow: <value> — <reason> marker
 *   - JSX comment blocks {/* ... *\/} (single- AND multi-line) — stripped to whitespace
 *     before detection so commented-out code is not scanned as a live violation. A
 *     real violation earlier on the same line as a trailing {/* ... *\/} is still
 *     flagged (only the comment span is blanked).
 *   - var(--x, fallback) — a reference WITH a fallback (Task 718 A5): it cannot
 *     silently fall back to the property's initial value, so it is treated as
 *     resolved regardless of whether --x itself is defined anywhere.
 *
 * Inline suppression (Task 403, Part 0; marker-value parsing widened Task 408):
 *   Place a comment on the SAME physical line as the match:
 *     // design-tokens-allow: <exact raw value> — <reason>
 *   <exact raw value> is everything between the marker prefix and the — separator,
 *   trimmed — this MAY contain spaces (e.g. `zIndex: 9999`), so it must match the
 *   detected token's source text byte-for-byte including internal whitespace.
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
 *   node scripts/check-design-tokens.mjs --strict --scope=mantine — restrict the scan to the
 *     current Mantine union (Task 784, §3.2): every path listed in
 *     scripts/mantine-migration-scope.json, every production source under
 *     src/design-system/mantine/**, and every canonical Mantine story under
 *     src/stories/mantine/** / src/stories/patterns/mantine/**. Purely additive — it filters
 *     WHICH files are scanned; every detection category, marker check, and strict/report
 *     exit-code rule is identical to the default (unscoped) run. Omitting --scope leaves the
 *     default global scan byte-for-byte unchanged.
 *   npm run check:design-tokens
 *   npx vitest run scripts/__tests__/check-design-tokens.test.ts — detector unit tests
 *
 * Added by Task 402 (Sprint 35, 2026-06-06). Epic JJ Phase 2.
 * Inline suppression added by Task 403 (Sprint 35, 2026-06-06). Epic JJ Phase 3.
 * Detector hardening (JSX-comment strip, inline zIndex marker, negative/var lock
 * tests) added by Task 408 (Sprint 35, 2026-06-13). Epic JJ Phase 4.
 * Plain CSS declaration coverage (css-length/css-duration/css-zindex,
 * single-value only, report-only) added by Task 714 (Sprint 52, 2026-08-06).
 * Shorthand / function-wrapped generalization of those 3 categories (per-literal
 * token-anchored exemption) + reason-less CSS marker missing-reason fix added by
 * Task 716 (Sprint 52, 2026-08-06).
 * Undefined CSS custom-property reference detection (css-undefined-var, blocking
 * from the start) + globals.css --z-* token definitions + R8 stale-string fix
 * added by Task 718 (Sprint 52, 2026-08-06).
 * Docs: docs/design-system.md §23
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ALLOWLIST_PATH = resolve(__dirname, 'design-tokens-allowlist.json');
const MANTINE_SCOPE_MANIFEST_PATH = resolve(__dirname, 'mantine-migration-scope.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const STRICT_MODE = args.includes('--strict');
const UPDATE_ALLOWLIST = args.includes('--update-allowlist');
const SCOPE_MANTINE = args.includes('--scope=mantine');
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
const TEST_SUFFIXES = ['.test.tsx', '.test.ts'];
const CANONICAL_MANTINE_STORY_PATH = /^src\/stories\/(?:mantine|patterns\/mantine)\//;
// Task 784, §3.2 — the second named scope root: every production source under this directory,
// regardless of manifest membership.
const MANTINE_DESIGN_SYSTEM_ROOT = 'src/design-system/mantine/';

// ── --scope=mantine membership (Task 784, R1) ─────────────────────────────────
//
// Reads scripts/mantine-migration-scope.json (the SAME manifest the rest of the project already
// treats as the Mantine migration surface — Task 784 does not hand-maintain a second copy) and
// returns it as a Set of exact repo-relative paths (POSIX separators, matching relPath's own
// normalization elsewhere in this file).
export function loadMantineScopeManifest() {
  if (!existsSync(MANTINE_SCOPE_MANIFEST_PATH)) return new Set();
  try {
    const list = JSON.parse(readFileSync(MANTINE_SCOPE_MANIFEST_PATH, 'utf8'));
    return new Set(list);
  } catch {
    console.error('⚠️  mantine-migration-scope.json is not valid JSON.');
    process.exit(1);
  }
}

// §3.2 exact membership — a path-derived union of exactly three kinds, never a fourth:
//   1. an exact manifest entry (scripts/mantine-migration-scope.json);
//   2. any production source under src/design-system/mantine/** (whole-directory root, not
//      manifest-gated — a design-system file need not be manifest-listed to be in scope);
//   3. any canonical Mantine story (the SAME CANONICAL_MANTINE_STORY_PATH regex the default scan
//      already uses to select canonical-story-only findings — no second story-path definition).
// No transitive-import expansion, no non-Mantine story, no legacy source: a path outside these
// three exact kinds is never in scope, however close its relationship to an in-scope file.
export function isMantineScopeFile(relPath, manifestSet) {
  if (manifestSet.has(relPath)) return true;
  if (relPath.startsWith(MANTINE_DESIGN_SYSTEM_ROOT)) return true;
  if (CANONICAL_MANTINE_STORY_PATH.test(relPath)) return true;
  return false;
}

// Applies the §3.2 filter to an already-collected file list ONLY when scopeMantine is true — the
// identity branch (scopeMantine === false) returns `files` completely untouched, by construction,
// so the default global scan can never be narrowed by this function regardless of manifest
// content (Task 784 R4 — proven directly by a unit test passing a non-empty manifest here and
// asserting the untouched-files return, not inferred from reading the branch).
export function filterFilesForScope(files, scopeMantine, manifestSet) {
  if (!scopeMantine) return files;
  return files.filter((relPath) => isMantineScopeFile(relPath, manifestSet));
}

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
export const DETECTION_PATTERNS = [
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
  // Length: function-wrapped arbitrary value (calc/min/max/clamp) containing a
  // raw px/rem literal with NO var(--token) reference anywhere in the brackets
  // (Task 408, §C row 2). Token-anchored forms — e.g. rounded-[min(var(--radius-md),10px)],
  // rounded-[calc(var(--radius)-5px)] — are exempt (filter below). Pure-literal
  // forms — incl. viewport-relative, e.g. min-h-[calc(100vh-4rem)],
  // max-w-[calc(100vw-2rem)] — are FLAGGED (no broad viewport exemption).
  // Matches: w-[calc(100px+2rem)], h-[calc(100%-1px)], translate-x-[calc(100%-2px)]
  // Does NOT match: rounded-[min(var(--radius-md),10px)], rounded-[calc(var(--radius)-5px)]
  {
    re: /\b[\w-]+-\[(?:calc|min|max|clamp)\([^\]]*\)\]/g,
    cat: 'length',
    label: 'function-wrapped arbitrary length (calc/min/max/clamp) with raw px/rem',
    filter: (m) => /(?:px|rem)\b/.test(m) && !/var\(--/.test(m),
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
  // Z-index: inline style object value — raw numeric literals only
  // Matches: zIndex: 100, zIndex:9999, 'z-index': 50, "z-index": 2
  // Does NOT match: zIndex: Z_TOKEN, zIndex: 'var(--z-toast)', zIndex: someVar
  // (no \d+ immediately after the colon — not a numeric literal)
  {
    re: /(?:\bzIndex|['"]z-index['"])\s*:\s*\d+/g,
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

  // Raw numeric dimension/layout JSX props. Task 782 originally covered the compact
  // `size|miw|maw|mih|mah|w|h` set only; that left real rendered dimensions such as
  // `gap={6}`, `spacing={40}`, `separatorMargin={6}`, `width={320}` and
  // `triggerWidth={150}` invisible. All names below are visual dimensions; data values
  // such as `count`, `page`, `maxLength`, and `lineClamp` are deliberately absent.
  // A token reference remains valid because this matches only a bare numeric literal.
  {
    re: /\b(?:size|miw|maw|mih|mah|w|h|width|height|minWidth|maxWidth|minHeight|maxHeight|gap|rowGap|columnGap|spacing|verticalSpacing|horizontalSpacing|m|mt|mb|ms|me|mx|my|p|pt|pb|ps|pe|px|py|top|right|bottom|left|inset|insetX|insetY|offset|separatorMargin|triggerWidth|dropdownMinWidth|dropdownMaxHeight|scrollbarSize|thumbSize|radius)=\{-?(?:\d+\.\d+|\d+|\.\d+)\}/g,
    cat: 'raw-dimension-prop',
    label: 'raw numeric dimension/layout prop',
    filter: (m) => !/=\{-?0(?:\.0+)?\}$/.test(m),
    tsxOnly: true,
  },
  // Unit-bearing JSX props. Mantine accepts named spacing tokens or token references;
  // raw `"2.75rem"`, compound `"0.25rem 0.75rem"`, and calc strings with a raw
  // unit bypass that scale just as much as a numeric prop does.
  {
    re: /\b(?:size|miw|maw|mih|mah|w|h|width|height|minWidth|maxWidth|minHeight|maxHeight|gap|rowGap|columnGap|spacing|verticalSpacing|horizontalSpacing|m|mt|mb|ms|me|mx|my|p|pt|pb|ps|pe|px|py|top|right|bottom|left|inset|insetX|insetY|offset|separatorMargin|triggerWidth|dropdownMinWidth|dropdownMaxHeight|scrollbarSize|thumbSize|radius|lh|fz|letterSpacing)=(["'])[^"']*-?(?:\d+\.\d+|\d+|\.\d+)(?:px|rem|em)[^"']*\1/g,
    cat: 'raw-dimension-prop',
    label: 'raw unit-bearing dimension/layout prop',
    tsxOnly: true,
  },
  // Numeric and unit-bearing dimensions in inline style/style-slot objects.
  // Zero is intentionally excluded: flex and reset semantics commonly require it.
  {
    re: /\b(?:width|height|minWidth|maxWidth|minHeight|maxHeight|margin|marginTop|marginRight|marginBottom|marginLeft|marginInline|marginBlock|padding|paddingTop|paddingRight|paddingBottom|paddingLeft|paddingInline|paddingBlock|gap|rowGap|columnGap|top|right|bottom|left|inset|insetInline|insetBlock|borderRadius|fontSize|lineHeight|letterSpacing)\s*:\s*(?:-?(?:\d+\.\d+|\d+|\.\d+)|["'][^"']*-?(?:\d+\.\d+|\d+|\.\d+)(?:px|rem|em)[^"']*["'])/g,
    cat: 'raw-inline-dimension',
    label: 'raw inline style dimension',
    filter: (m) => {
      const numeric = m.match(/:\s*(-?(?:\d+\.\d+|\d+|\.\d+))$/);
      if (numeric) return Number(numeric[1]) !== 0;
      const unit = m.match(/-?(?:\d+\.\d+|\d+|\.\d+)(?:px|rem|em)/);
      return unit ? Number.parseFloat(unit[0]) !== 0 : true;
    },
    tsxOnly: true,
  },
  // Canonical Mantine stories must use Mantine/theme sizing, not named Tailwind
  // dimensions. This intentionally targets only sizing/spacing utilities, not
  // generic fixture classes; it runs through the dedicated canonical-story pass.
  {
    re: /\bclassName\s*=\s*(["'])[^"']*(?:-?(?:m|p)(?:[trblxyse])?-\d+(?:\.\d+)?|(?:gap|space-[xy]|h|w|min-h|max-h|min-w|max-w|size)-\d+(?:\.\d+)?)[^"']*\1/g,
    cat: 'tailwind-dimension-utility',
    label: 'Tailwind dimension utility in canonical Mantine story',
    storyOnly: true,
  },

  // ── Plain CSS declaration coverage (Task 714, report-only category — see §23.6) ──
  //
  // The patterns above are all shaped around Tailwind's arbitrary-value bracket
  // syntax (`*-[Npx]`) or inline style-object literals. A plain CSS declaration in
  // a `.module.css` file — e.g. `font-size: 10px;`, `gap: 1.5rem;`,
  // `transition-duration: .15s;`, `z-index: 30;` — matches none of them (Task 713
  // moved 3 previously-detected `text-[10px]` sites into exactly this blind spot).
  //
  // Scope (deliberate, documented boundary — Task 714 A2/A3/A5):
  //   - `cssOnly: true` — only ever runs against `.css` file content; `.tsx`/`.ts`
  //     detection is byte-identical to before this task (R9).
  //   - Matches ONLY a declaration whose value is a single bare numeric-unit token
  //     (`property: <N unit>` followed by `;` or `}`) — i.e. plain, unambiguous,
  //     directly-tokenizable declarations. Multi-value/shorthand lists
  //     (`border-bottom: 1px solid var(--border)`) and function-wrapped values
  //     (`blur(8px)`, `calc(...)`, `translateY(-2px)`) are OUT of scope: they need
  //     the same nested-function handling Task 408 built for Tailwind's
  //     calc/min/max/clamp brackets, generalized to arbitrary CSS functions — a
  //     separate, harder follow-on, not required by R1/R2's "plain CSS
  //     declaration" wording. Named as a limitation for a future task.
  //   - Zero values (`0`, `0px`, `0rem`, `0em`) and the approved `1px`/`-1px`
  //     hairline-border value (A3 — `HeaderView.module.css:37` precedent) are
  //     exempt by value via the `filter` callback, not by regex shape.
  //   - `@media (min-width: 40rem)`/`@supports (...)` preludes never match: the
  //     condition's numeric token is always followed by `)`, never `;`/`}`, so the
  //     terminator lookahead structurally excludes preludes (A5) without special
  //     casing.
  //   - rawValue reported is `property: value` (e.g. `font-size: 10px`), matching
  //     the existing inline-zIndex convention — this disambiguates identical bare
  //     values on one line coming from different properties, and is the exact
  //     string a `design-tokens-allow` marker must reproduce (A1).
  {
    re: /([\w-]+)\s*:\s*(-?(?:\d+\.\d+|\.\d+|\d+)(?:e\d+)?(?:px|rem|em))(?=\s*[;}])/g,
    cat: 'css-length',
    label: 'raw CSS length declaration',
    cssOnly: true,
    filter: (m) => {
      const v = m.match(/(-?(?:\d+\.\d+|\.\d+|\d+)(?:e\d+)?)(px|rem|em)$/);
      if (!v) return true;
      const num = parseFloat(v[1]);
      if (num === 0) return false;
      if (v[2] === 'px' && Math.abs(num) <= 1) return false; // A3: 0px/1px/-1px exempt
      return true;
    },
  },
  {
    re: /([\w-]+)\s*:\s*(-?(?:\d+\.\d+|\.\d+|\d+)(?:ms|s))(?=\s*[;}])/g,
    cat: 'css-duration',
    label: 'raw CSS duration declaration',
    cssOnly: true,
    filter: (m) => {
      const v = m.match(/(-?(?:\d+\.\d+|\.\d+|\d+))(ms|s)$/);
      if (!v) return true;
      return parseFloat(v[1]) !== 0;
    },
  },
  {
    re: /(z-index)\s*:\s*(-?\d+)(?=\s*[;}])/g,
    cat: 'css-zindex',
    label: 'raw CSS z-index declaration',
    cssOnly: true,
    filter: (m) => {
      const v = m.match(/(-?\d+)$/);
      if (!v) return true;
      return parseInt(v[1], 10) !== 0;
    },
  },
];

// Categories landed report-only by Task 714 (§23.6): detected and printed under
// their own heading, but never counted toward the strict/blocking exit code.
// 715 owns the strict flip once the pre-existing inventory (Task 714 R6) is
// remediated or explicitly marker-suppressed.
export const REPORT_ONLY_CATEGORIES = /** @type {Set<string>} */ (new Set([]));

// ── Shorthand / function-wrapped CSS declaration coverage (Task 716) ─────────
//
// The css-length/css-duration/css-zindex DETECTION_PATTERNS entries above only
// match a declaration whose ENTIRE value is one bare token (the §23.6 boundary
// Task 714 documented and this task closes). This section generalizes them to a
// raw literal that appears INSIDE a multi-value shorthand list
// (`border-bottom: 1px solid var(--border)`) or wrapped in a CSS function
// (`filter: blur(8px)`), following the SAME token-anchored exemption mechanism
// Task 408 built for Tailwind's calc/min/max/clamp brackets (§23.1.b) — but
// applied per-literal, scoped to the literal's OWN outermost enclosing function
// call, not per-declaration (Task 716 A1): a raw literal sitting at the
// declaration's TOP level (not inside any function) is never exempted just
// because a var(--…) reference appears elsewhere in the same value. That is
// exactly what makes `border-bottom: 1px solid var(--border)` detect the `1px`
// (R1) while a function like `calc(var(--x) + 2px)` stays exempt (A4 — the
// literal's own outermost function contains a var(--…) reference, matching the
// frozen Task 408 `rounded-[calc(var(--radius)-5px)]` precedent exactly).
//
// A declaration whose value IS exactly one bare token is skipped here — the
// dedicated single-value pattern above already reports it (incl. its own
// zero/A3 1px-exemption), so this function never double-counts a finding.
//
// Task 716 A3 (the 1px policy, decided): the 1px/-1px hairline exemption is
// SINGLE-VALUE-ONLY, unchanged above. The instant 1px co-occurs with any other
// token in a shorthand list it is a full finding like any other raw literal —
// proven by AC1's `border-bottom: 1px solid var(--border)` case. This is one
// consistent rule ("the exemption applies only when 1px IS the whole value")
// applied identically in both paths, not two different policies.
//
// Task 716 A5 (the --* decision): custom-property declarations are IN scope,
// unchanged from the property-name shape already used above (`[\w-]+` matches
// a leading `--`) — no special-casing needed or added.
const SHORTHAND_CSS_SPECS = [
  {
    cat: 'css-length',
    label: 'raw CSS length declaration (shorthand/function-wrapped)',
    propertySource: '[\\w-]+',
    unitSource: '-?(?:\\d+\\.\\d+|\\.\\d+|\\d+)(?:e\\d+)?(?:px|rem|em)',
    isZero: (literal) => {
      const m = literal.match(/^(-?(?:\d+\.\d+|\.\d+|\d+)(?:e\d+)?)(px|rem|em)$/);
      return m ? parseFloat(m[1]) === 0 : false;
    },
  },
  {
    cat: 'css-duration',
    label: 'raw CSS duration declaration (shorthand/function-wrapped)',
    propertySource: '[\\w-]+',
    unitSource: '-?(?:\\d+\\.\\d+|\\.\\d+|\\d+)(?:ms|s)',
    isZero: (literal) => {
      const m = literal.match(/^(-?(?:\d+\.\d+|\.\d+|\d+))(ms|s)$/);
      return m ? parseFloat(m[1]) === 0 : false;
    },
  },
  {
    cat: 'css-zindex',
    label: 'raw CSS z-index declaration (function-wrapped)',
    propertySource: 'z-index',
    unitSource: '-?\\d+',
    isZero: (literal) => parseInt(literal, 10) === 0,
  },
];

// Returns true when the literal starting at `litStart` inside `value` sits
// within a CSS function call whose full parenthesized span (from its own `(`
// to its matching `)`) contains a `var(--` reference ANYWHERE — the per-function
// token-anchored exemption (A1/A4), generalizing Task 408's whole-bracket
// var-anywhere rule from Tailwind's `*-[calc(...)]` syntax to arbitrary CSS
// functions. A literal that is not inside any function at all (paren depth 0
// at its own position) is never anchored — this is what makes a bare
// shorthand token never inherit exemption from a sibling `var()` token.
function isVarAnchoredLiteral(value, litStart) {
  let depth = 0;
  let outerStart = -1;
  for (let i = 0; i < litStart; i++) {
    if (value[i] === '(') {
      if (depth === 0) outerStart = i;
      depth++;
    } else if (value[i] === ')') {
      depth--;
      if (depth === 0) outerStart = -1;
    }
  }
  if (depth <= 0 || outerStart === -1) return false;
  let d2 = 0;
  let outerEnd = value.length - 1;
  for (let i = outerStart; i < value.length; i++) {
    if (value[i] === '(') d2++;
    else if (value[i] === ')') {
      d2--;
      if (d2 === 0) { outerEnd = i; break; }
    }
  }
  return /var\(--/.test(value.slice(outerStart, outerEnd + 1));
}

// Finds raw literals for one spec (css-length/css-duration/css-zindex) in
// shorthand or function-wrapped declarations on a single, already
// CSS-comment-stripped line. Declarations are located by scanning for
// `property:` then walking forward tracking paren depth to find the
// terminating `;`/`}` AT depth 0. This is what structurally excludes
// @media/@supports preludes (A5) without special-casing: a prelude's condition
// paren (e.g. `(min-width: 40rem)`) closes to a NEGATIVE depth relative to this
// walk (the walk starts after the prelude's own property colon, so it never saw
// the prelude's opening paren), so depth never returns to exactly 0 and no
// terminator is ever found on that line — the candidate declaration is skipped.
function findShorthandCssLiterals(line, spec) {
  const results = [];
  const declRe = new RegExp(`(${spec.propertySource})\\s*:\\s*`, 'g');
  const soleTokenRe = new RegExp(`^${spec.unitSource}$`);
  const literalRe = new RegExp(spec.unitSource, 'g');
  let dm;
  while ((dm = declRe.exec(line)) !== null) {
    const property = dm[1];
    const valueStart = declRe.lastIndex;
    let depth = 0;
    let valueEnd = -1;
    for (let i = valueStart; i < line.length; i++) {
      const ch = line[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if ((ch === ';' || ch === '}') && depth === 0) { valueEnd = i; break; }
    }
    if (valueEnd === -1) continue;
    const value = line.slice(valueStart, valueEnd);

    // Single-bare-token values are already reported by the dedicated
    // single-value pattern above (incl. its own zero/A3 exemption) — skip
    // here so this function never double-counts a finding.
    if (soleTokenRe.test(value.trim())) continue;

    literalRe.lastIndex = 0;
    let lm;
    while ((lm = literalRe.exec(value)) !== null) {
      const literal = lm[0];
      if (spec.isZero(literal)) continue;
      if (isVarAnchoredLiteral(value, lm.index)) continue;
      results.push({ cat: spec.cat, label: spec.label, match: `${property}: ${literal}` });
    }
  }
  return results;
}

// ── Undefined CSS custom-property reference coverage (Task 718, R4) ──────────
//
// A var(--x) reference in a scanned .css file is a finding when --x cannot be
// resolved against any of three sources:
//   1. src/app/globals.css — the token source of truth. It is itself excluded
//      from scanning (SKIP_FILES), so its definitions are supplied by the
//      caller as globalsDefinedProps (measured once in run(), threaded through
//      scanFile → scanContent; test callers pass their own set or the default
//      empty one).
//   2. The same file being scanned — via extractCssCustomPropertyDefinitions
//      on that file's own content (self-contained, no extra input needed).
//   3. A measured external prefix/exact-name list (EXTERNAL_VAR_PREFIXES /
//      EXTERNAL_VAR_EXACT_NAMES below) — variables a framework supplies at
//      build time that this repo does not define. --z- is deliberately
//      absent: it is the token family Task 718 defines in globals.css, and if
//      it needed this list, R1 failed.
//
// A5 (decided): var(--x, fallback) is treated as RESOLVED even when --x is
// undefined — a fallback means the declaration can never silently compute to
// the property's initial value, which is the exact failure mode (§3.6/R2 of
// the Task 718 kickoff) this category exists to catch. Only a var() with NO
// fallback and NO resolvable definition is a finding.
//
// Runs on the SAME CSS-comment-stripped source (codeOnlyCss) the shorthand
// scanner above already uses (A3 — no second stripper), and is found by a
// direct `var(` text search rather than a DETECTION_PATTERNS regex entry,
// because correctly matching the reference's own closing paren (which may
// contain nested function calls in its fallback) needs the same paren-balance
// walk isVarAnchoredLiteral/findShorthandCssLiterals already use above.
//
// Each external entry is proven present in the production build and/or
// node_modules (measured 2026-08-06, R6):
//   --tw-       Tailwind v4 internal utility vars (e.g. --tw-shadow,
//               --tw-ring-color) — present in 3 of 6 .next/static/css/*.css
//               build chunks and generated by every Tailwind utility class.
//   --mantine-  Mantine v9 createTheme() output (e.g. --mantine-color-brand-5)
//               — present in .next/static/css/*.css and in every
//               node_modules/@mantine/core/styles/*.css file.
//   --spacing   Tailwind v4's OWN base spacing-scale unit (`--spacing: .25rem`
//               at node_modules/tailwindcss/theme.css:325, also present in
//               .next/static/css/e55fe1d775976885.css) — DISTINCT from this
//               repo's --spacing-N named tokens in globals.css. Consumed via
//               calc(var(--spacing) * N), Tailwind's own compiled form of
//               gap-0.5/w-48 etc. (MobileBottomNavView.module.css,
//               HeroSearchView.module.css — the 3 real sites that forced this
//               entry onto the list; measured, not guessed, per A2).
//   --default-transition-timing-function   Tailwind v4's own base easing
//               variable — defined at node_modules/tailwindcss/theme.css:493
//               and node_modules/tailwindcss/index.css:502, present in
//               .next/static/css/e55fe1d775976885.css. Consumed as the
//               fallback arm of a nested var(--tw-ease, var(--default-...))
//               at MobileBottomNavView.module.css:92 (transition-timing-function,
//               Tailwind's compiled `transition-transform` output) — the one
//               real site that forced this entry onto the list, per A2.
const EXTERNAL_VAR_PREFIXES = ['--tw-', '--mantine-'];
const EXTERNAL_VAR_EXACT_NAMES = new Set(['--spacing', '--default-transition-timing-function']);

function isExternallyResolvedVar(name) {
  if (EXTERNAL_VAR_EXACT_NAMES.has(name)) return true;
  return EXTERNAL_VAR_PREFIXES.some((p) => name.startsWith(p));
}

function findUndefinedCssVarReferences(line, globalsDefinedProps, localDefinedProps) {
  const results = [];
  const callRe = /var\(/gi;
  let m;
  while ((m = callRe.exec(line)) !== null) {
    const contentStart = m.index + 4; // length of the literal "var("
    let depth = 1;
    let i = contentStart;
    for (; i < line.length; i++) {
      if (line[i] === '(') depth++;
      else if (line[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) continue; // unterminated on this physical line — skip
    const inner = line.slice(contentStart, i);
    const nameMatch = inner.match(/^\s*(--[\w-]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    // A5: a top-level comma after the name (not nested inside the fallback's
    // own function call) means a fallback is present — resolved regardless.
    let hasFallback = false;
    let d2 = 0;
    for (let j = nameMatch[0].length; j < inner.length; j++) {
      const ch = inner[j];
      if (ch === '(') d2++;
      else if (ch === ')') d2--;
      else if (ch === ',' && d2 === 0) { hasFallback = true; break; }
    }
    if (hasFallback) continue;

    if (localDefinedProps.has(name)) continue;
    if (globalsDefinedProps.has(name)) continue;
    if (isExternallyResolvedVar(name)) continue;

    results.push({ match: line.slice(m.index, i + 1) });
  }
  return results;
}

// ── JSX comment stripping (Task 408, §A) ──────────────────────────────────────
//
// Replace every {/* ... */} block (including multi-line spans) with whitespace
// of the same shape (newlines preserved, all other characters become spaces) so
// that line/column numbers of any REAL code after the strip are unchanged. This
// runs on the whole file content BEFORE per-line detection, so commented-out
// JSX attribute values (e.g. {/* className="text-[10px]" */}) are never scanned
// as live violations — while a real violation earlier on the same physical line
// as a trailing {/* ... */} is still detected (only the comment span is blanked).
//
// Inline suppression markers (design-tokens-allow:) are still parsed from the
// ORIGINAL (unstripped) line, so a marker placed inside a {/* ... */} JSX
// comment (the existing convention, e.g. AdminTable's sticky z-[1]/z-[2]) keeps
// working.
export function stripJsxComments(content) {
  return content.replace(/\{\/\*[\s\S]*?\*\/\}/g, (match) =>
    match.replace(/[^\n]/g, ' ')
  );
}

// ── CSS comment stripping (Task 714, A2) ──────────────────────────────────────
//
// Replace every /* ... */ span (including multi-line) with whitespace of the
// same shape, so line/column numbers of real code are unchanged. Used ONLY to
// build the detection source for the cssOnly patterns above — the existing
// color/Tailwind-bracket patterns keep reading the unstripped codeOnly source,
// so their behavior on .css files is unchanged (R9). A `design-tokens-allow`
// marker lives INSIDE a CSS comment, so this strip also removes the marker's own
// text from the detection source — exactly like the existing trailing `//`
// strip does for TSX — preventing the marker's embedded value string from being
// double-counted as a live violation. Markers themselves are still parsed from
// the original, unstripped physical line (parseInlineMarkers below).
export function stripCssComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' ')
  );
}

// ── CSS custom-property definition extraction (Task 718, R4; Task 720, R1-R3) ─
//
// Returns the set of custom-property NAMES declared anywhere in `content`, using
// the same CSS-comment-stripped source as stripCssComments above (A3 — one
// stripper, reused). Position within the file does not matter for resolution:
// a declaration is in scope for the whole cascade context it lives in, and
// this detector does not model selector/media scoping (a documented
// simplification consistent with the rest of this file's line-based design).
// Used for TWO resolution sources in scanContent: globals.css (called once in
// run() against globals.css's own content, passed in as globalsDefinedProps)
// and the same file being scanned (called per-file against its own content).
//
// Task 720, R1/R2: a declaration can start anywhere a top-level `{` or `;` just
// ended (or at the very start of the source) — not only at the start of a
// physical line, so a second same-line declaration is no longer invisible.
// "Top-level" is tracked with a quote-state + paren-depth walk over the
// stripped source, so a declaration-shaped literal inside a quoted value (a
// `content` string, a data-URI) is never mistaken for a definition — deleting
// the old `^` line anchor outright was rejected for exactly that reason (§3.4
// of the kickoff): it would register `--fake` out of `content: "--fake: 1px"`.
// Name case is never normalized (R3) — `--Foo` and `--foo` stay distinct.
export function extractCssCustomPropertyDefinitions(content) {
  const stripped = stripCssComments(content);
  const defs = new Set();
  const declRe = /\s*(--[\w-]+)\s*:/y;
  const tryMatchAt = (pos) => {
    declRe.lastIndex = pos;
    const m = declRe.exec(stripped);
    if (m) defs.add(m[1]);
  };
  tryMatchAt(0);
  let parenDepth = 0;
  let quote = null;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(') { parenDepth++; continue; }
    if (ch === ')') { if (parenDepth > 0) parenDepth--; continue; }
    if (parenDepth === 0 && (ch === '{' || ch === ';')) tryMatchAt(i + 1);
  }
  return defs;
}

// ── Skip heuristics ───────────────────────────────────────────────────────────
// Task 719, R1: in .css, CSS comments have already been stripped into
// cssStrippedLine (Task 714 A2) by the time this runs, so a leading `*` there
// is the universal selector, not a comment — ask the stripper whether
// anything real survived instead of guessing from the raw line's first
// character. In .ts/.tsx, nothing else strips `/** ... */` JSDoc continuation
// lines, so the leading-`*`/`/*` heuristic stays exactly as it was for those
// files (A2 of the kickoff — this branch must not move).
function shouldSkipLine(line, isCssFile, cssStrippedLine) {
  const trimmed = line.trimStart();
  // Comment-only lines (value inside a trailing // comment is not runtime code)
  if (trimmed.startsWith('//')) return true;
  if (isCssFile) {
    if (cssStrippedLine.trim() === '') return true;
  } else if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return true;
  }
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
//
// The raw value is everything between the marker prefix and the — separator,
// trimmed. This MAY contain internal whitespace (Task 408, §B) so that values
// like `zIndex: 9999` — whose detected source text includes the colon-space —
// can be suppressed with a marker that matches byte-for-byte.
export function parseInlineMarkers(line) {
  const results = [];
  let searchFrom = 0;
  while (true) {
    const pos = line.indexOf(ALLOW_MARKER_PREFIX, searchFrom);
    if (pos === -1) break;

    const afterPrefix = line.slice(pos + ALLOW_MARKER_PREFIX.length);
    const dashIdx = afterPrefix.indexOf('—');
    // Task 716 R4: a reason-less CSS block-comment marker (`/* design-tokens-allow:
    // <value> */`, no — separator) had its own `*/` terminator absorbed into
    // valuePart, so the extracted value never matched the detected source text and
    // the marker misreported as `stale-marker` instead of the documented
    // missing-reason error. Strip a trailing `*/` ONLY when there is no reason — a
    // marker WITH a reason never has `*/` before the — separator, so this never
    // touches that path. The `//` (TSX) form has no terminator to strip, so this is
    // a no-op there — the TSX path is unchanged.
    let valuePart = dashIdx === -1 ? afterPrefix : afterPrefix.slice(0, dashIdx);
    if (dashIdx === -1) valuePart = valuePart.replace(/\*\/\s*$/, '');
    const rawValue = valuePart.trim();

    if (!rawValue) {
      searchFrom = pos + ALLOW_MARKER_PREFIX.length;
      continue;
    }

    let hasReason = false;
    if (dashIdx !== -1) {
      const reasonPart = afterPrefix.slice(dashIdx + 1).trim();
      hasReason = reasonPart.length > 0;
    }

    results.push({ rawValue, hasReason });
    searchFrom = pos + ALLOW_MARKER_PREFIX.length + valuePart.length;
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
    // Key is a path prefix (directory) or exact file match. The unbounded
    // `relPath.startsWith(key)` third arm (no trailing slash) was removed by
    // Task 717 R9: re-measured 0 files exempted only by it (K4-matcher.log),
    // matching the kickoff's own 2026-08-08 measurement — the first two
    // conditions cover every current match, and leaving it would give the
    // new exact-file allowlist keys no real boundary (e.g. a bare `theme.ts`
    // key would also exempt a sibling `theme.test.ts`).
    if (relPath === key || relPath.startsWith(key + '/')) {
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
function collectFiles(dir, exts, includeStories = false) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, exts, includeStories));
    } else if (
      exts.some(e => entry.endsWith(e)) &&
      !(includeStories ? TEST_SUFFIXES : SKIP_SUFFIXES).some(s => entry.endsWith(s))
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
//
// scanContent operates on raw text + a relPath used only for grouping/allowlist
// lookups — it does not touch the filesystem, so tests can plant fixtures as
// in-memory strings (Task 408, §E). globalsDefinedProps (Task 718) is the one
// exception to "no filesystem": it is a Set of custom-property names computed
// by the CALLER (run() reads real globals.css once; tests pass their own set
// or the empty default) — scanContent itself never reads a file.
export function scanContent(content, relPath, allowlist = {}, globalsDefinedProps = new Set(), options = {}) {
  if (isAllowlisted(relPath, allowlist)) return [];

  const isCssFile = relPath.endsWith('.css');
  const storyOnly = options.storyOnly === true;
  const lines = content.split('\n');
  // §A: strip {/* ... */} JSX comment blocks (incl. multi-line) before detection.
  // Markers are still parsed from the ORIGINAL (unstripped) lines below.
  const strippedLines = stripJsxComments(content).split('\n');
  // Task 714 A2: separate CSS-comment-stripped source, .css files only, used
  // ONLY by the cssOnly patterns — existing patterns keep reading strippedLines
  // so their behavior is unchanged (R9).
  const cssStrippedLines = isCssFile ? stripCssComments(content).split('\n') : null;
  // Task 718, R4 resolution source 2: custom properties defined anywhere in
  // THIS file (position-independent — see extractCssCustomPropertyDefinitions).
  const localDefinedProps = isCssFile ? extractCssCustomPropertyDefinitions(content) : new Set();
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (shouldSkipLine(line, isCssFile, isCssFile ? cssStrippedLines[i] : null)) continue;

    // Strip trailing // comment before detection so that the marker text itself
    // (which contains the suppressed value string) is not scanned as a violation.
    // parseInlineMarkers runs on the full original line to find the markers.
    const codeOnly = strippedLines[i].replace(/\s*\/\/.*$/, '');
    const codeOnlyCss = isCssFile ? cssStrippedLines[i].replace(/\s*\/\/.*$/, '') : null;

    // Collect all pattern matches on the code portion of this line
    const rawMatches = [];
    for (const { re, cat, label, filter, cssOnly, tsxOnly, storyOnly: patternIsStoryOnly } of DETECTION_PATTERNS) {
      if (storyOnly !== Boolean(patternIsStoryOnly)) continue;
      if (cssOnly && !isCssFile) continue;
      if (tsxOnly && isCssFile) continue;
      const source = cssOnly ? codeOnlyCss : codeOnly;
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(source)) !== null) {
        if (filter && !filter(m[0])) continue;
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

    // Task 716: shorthand / function-wrapped css-length/css-duration/css-zindex
    // literals — only ever runs against .css content, on the same CSS-comment-
    // stripped source the single-value cssOnly patterns above already use.
    if (!storyOnly && isCssFile) {
      for (const spec of SHORTHAND_CSS_SPECS) {
        for (const { cat, label, match } of findShorthandCssLiterals(codeOnlyCss, spec)) {
          rawMatches.push({ file: relPath, line: lineNum, cat, label, match, area: getArea(relPath) });
        }
      }
      // Task 718, R4: a var(--x) reference that resolves against none of
      // globals.css / this file / the measured external list — blocking from
      // the start (not added to REPORT_ONLY_CATEGORIES).
      for (const { match } of findUndefinedCssVarReferences(codeOnlyCss, globalsDefinedProps, localDefinedProps)) {
        rawMatches.push({
          file: relPath,
          line: lineNum,
          cat: 'css-undefined-var',
          label: 'var() reference with no resolvable definition',
          match,
          area: getArea(relPath),
        });
      }
    }

    // Parse inline suppression markers from the full original line (including
    // markers placed inside {/* ... */} JSX comments, e.g. AdminTable z-[1]/z-[2])
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

export function scanCanonicalMantineStoryContent(content, relPath, allowlist = {}, globalsDefinedProps = new Set()) {
  if (!CANONICAL_MANTINE_STORY_PATH.test(relPath)) return [];
  return scanContent(content, relPath, allowlist, globalsDefinedProps, { storyOnly: true });
}

function scanFile(filePath, allowlist, globalsDefinedProps) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
  let content;
  try { content = readFileSync(filePath, 'utf8'); } catch { return []; }
  return scanContent(content, relPath, allowlist, globalsDefinedProps);
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const allowlist = loadAllowlist();
  const staleWarnings = checkStaleEntries(allowlist);

  // Task 718, R4 resolution source 1: globals.css is excluded from the file
  // loop below (SKIP_FILES) but IS the token source of truth, so its
  // definitions are read once here and threaded through every css-file scan.
  const globalsCssPath = join(ROOT, 'src/app/globals.css');
  const globalsDefinedProps = existsSync(globalsCssPath)
    ? extractCssCustomPropertyDefinitions(readFileSync(globalsCssPath, 'utf8'))
    : new Set();

  const srcDir = join(ROOT, 'src');
  const mantineScopeManifest = SCOPE_MANTINE ? loadMantineScopeManifest() : new Set();
  const collectedFiles = collectFiles(srcDir, ['.tsx', '.ts', '.css']);
  const allStoryFiles = collectFiles(srcDir, ['.stories.tsx'], true);
  // canonicalMantineStoryFiles is already exactly §3.2 union member #3 (the
  // CANONICAL_MANTINE_STORY_PATH test below is byte-identical to isMantineScopeFile's own story
  // check) — every canonical Mantine story is in scope regardless of --scope=mantine, so this list
  // is never additionally filtered.
  const canonicalMantineStoryFiles = allStoryFiles.filter((filePath) =>
    CANONICAL_MANTINE_STORY_PATH.test(relative(ROOT, filePath).replace(/\\/g, '/'))
  );
  // filterFilesForScope's predicate expects relPath strings; collectedFiles holds absolute paths
  // keyed 1:1 to their own relPath, so filter the relPath projection and re-derive the absolute
  // list from the surviving relPaths (both sides use the identical relative()/replace() call, so
  // the derivation is exact — no separate path-matching logic).
  const collectedRelPaths = collectedFiles.map((filePath) => relative(ROOT, filePath).replace(/\\/g, '/'));
  const scopedRelPaths = new Set(filterFilesForScope(collectedRelPaths, SCOPE_MANTINE, mantineScopeManifest));
  const allFiles = collectedFiles.filter((filePath, i) => scopedRelPaths.has(collectedRelPaths[i]));

  if (SCOPE_MANTINE) {
    console.log(`🔍  check:design-tokens --scope=mantine — scanning ${allFiles.length} of ${collectedFiles.length} production src/**/*.{tsx,ts,css} files`);
    console.log(`    (§3.2 union: scripts/mantine-migration-scope.json ∪ src/design-system/mantine/** ∪ canonical Mantine stories)`);
    console.log(`    + ${canonicalMantineStoryFiles.length} canonical Mantine stories for Tailwind dimension utilities`);
    console.log(`    (excludes globals.css, tests, non-Mantine stories, and allowlisted paths)`);
  } else {
    console.log(`🔍  check:design-tokens — scanning ${allFiles.length} production src/**/*.{tsx,ts,css} files`);
    console.log(`    + ${canonicalMantineStoryFiles.length} canonical Mantine stories for Tailwind dimension utilities`);
    console.log(`    (excludes globals.css, tests, non-Mantine stories, and allowlisted paths)`);
  }
  console.log('');

  if (staleWarnings.length > 0) {
    console.log('Allowlist warnings:');
    for (const w of staleWarnings) console.log(w);
    console.log('');
  }

  const allFindings = [];
  for (const f of allFiles) {
    allFindings.push(...scanFile(f, allowlist, globalsDefinedProps));
  }
  for (const f of canonicalMantineStoryFiles) {
    const relPath = relative(ROOT, f).replace(/\\/g, '/');
    let content;
    try { content = readFileSync(f, 'utf8'); } catch { continue; }
    allFindings.push(...scanCanonicalMantineStoryContent(content, relPath, allowlist, globalsDefinedProps));
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
  // Task 714 (§23.6): css-length/css-duration/css-zindex are report-only — never
  // counted toward the strict/blocking exit code, printed under their own heading.
  const cssDeclFindings = allFindings.filter(f => REPORT_ONLY_CATEGORIES.has(f.cat));
  const regularFindings = allFindings.filter(
    f => f.cat !== 'missing-reason' && f.cat !== 'stale-marker' && !REPORT_ONLY_CATEGORIES.has(f.cat)
  );

  // ── Group findings by area → file → category (excludes report-only css-decl
  // findings, which get their own dedicated section below — A4)
  const byArea = {};
  for (const finding of allFindings) {
    if (REPORT_ONLY_CATEGORIES.has(finding.cat)) continue;
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

  // ── CSS declaration coverage — legacy report-only heading (Task 714, §23.6).
  // REPORT_ONLY_CATEGORIES has been empty since Task 715 (§23.6.b), so
  // cssDeclFindings is always []; css-length/css-duration/css-zindex findings
  // now surface in the per-area sections above like every other blocking
  // category. Own heading kept for output-shape stability, count always 0.
  console.log(`  ── CSS DECLARATION LITERALS — legacy report-only heading, always 0 since Task 715  (${cssDeclFindings.length} finding${cssDeclFindings.length === 1 ? '' : 's'}) ──`);
  if (cssDeclFindings.length === 0) {
    console.log('  (none found)');
  } else {
    const byFile = {};
    for (const f of cssDeclFindings) (byFile[f.file] ??= []).push(f);
    for (const file of Object.keys(byFile).sort()) {
      const items = byFile[file];
      console.log(`  ${file}  (${items.length})`);
      for (const { line, cat, label, match } of items) {
        console.log(`    :${line}  [${cat}:${label}]  "${match}"`);
      }
    }
  }
  console.log(`  715 flipped css-length/css-duration/css-zindex to blocking; they report above with every other category now. Docs: docs/design-system.md §23.6.b.`);
  console.log('');

  // ── Summary
  console.log(`  Total: ${regularFindings.length} raw style-value violation(s) | ${staleMarkerFindings.length} stale-marker(s) | ${missingReasonFindings.length} missing-reason error(s) | ${cssDeclFindings.length} css-declaration literal(s) (report-only)`);
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

// ── CLI entrypoint ────────────────────────────────────────────────────────────
// Guarded so this module can be `import`-ed by tests (Task 408, §E) without
// triggering process.exit().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
