#!/usr/bin/env node
/**
 * check-tailwind-runtime-tokens.mjs — Task 762 (Sprint 62) Tailwind runtime-token gate.
 * Revised by Task 762 Revision 1 (2026-08-21) — see "Revision 1" below for what changed and why.
 *
 * Detects any Tailwind-owned custom property REFERENCED (`var(...)`), DECLARED (`--name: …`), or
 * named inside a `transition-property`/`will-change` value list in `src/**\/*.module.css`. Task
 * 757R proved the failure mode on `AuthSheet`: `var(--default-transition-duration)` resolves
 * TODAY only because `@import "tailwindcss"` ships it — once Tailwind is removed (the purpose of
 * the whole de-Tailwind programme), it computes to nothing, and no other gate in this repository
 * can see it (`check:design-tokens` exempts anything shaped like `var(--token)` without resolving
 * it; `check:css-vars` only checks resolution of names it considers OWNED; `tsc`/`next build`
 * never read CSS values; a rendered comparator cannot see a value that is identical today and
 * undefined only after a future deletion).
 *
 * ── Revision 1 (O-1, O-2, E-1) ──────────────────────────────────────────────────────────────────
 *
 * The delivered gate had two reproduced bypasses and one measured under-statement of risk:
 *
 *   B-1: `globals.css` is author-writable, and its `@theme inline` block is exactly where an
 *        author would add a "fix" — one line there silenced the gate while the reference it was
 *        meant to catch stayed broken (the name was never emitted, `--z-sticky` failure mode).
 *   B-2: a brand-new `var(--text-sm)` (or `--font-weight-bold`, `--radius-4xl`, …) passed, because
 *        "declared in globals.css" was the ONLY ownership test and `@theme inline` mirrors
 *        Tailwind's own defaults by design (the file's own comment: "mirrors Tailwind v4 default
 *        sizes (visually inert)").
 *   E-1: the scan matched `var(` only, so a `--tw-shadow: …` DECLARATION, or a bare
 *        `--tw-gradient-from` inside a `transition-property` list, was invisible to both the scan
 *        and the baseline.
 *   O-1: Category C (`--tw-*`) was scoped OUT of the original fix on the theory that it was less
 *        urgent than Category A. Measured (two Chromium documents, identical except for the
 *        presence of Tailwind's compiler-generated `@property` registrations): Category A
 *        DEGRADES a value; Category C DROPS THE WHOLE DECLARATION (`box-shadow` -> `none`,
 *        `border-top-style` -> `none`/`0px`) — worse, not merely equally bad, and the original
 *        kickoff never measured it before ranking it as lower priority.
 *
 * ── Ownership (R4) ──────────────────────────────────────────────────────────────────────────────
 *
 * A name is classified into exactly one of three buckets — there is no "cannot classify" state,
 * which is what makes this fail closed rather than fail open:
 *
 *   1. KNOWN-EXTERNAL, NON-TAILWIND — starts with `--mantine-`. Mantine injects ~112 of its own
 *      runtime custom properties that this project never declares and that have nothing to do
 *      with Tailwind's presence — removing Tailwind does not remove Mantine. Same mechanism class
 *      as `check-design-tokens.mjs`'s `EXTERNAL_VAR_PREFIXES`: a prefix that names an external
 *      SYSTEM, not a list of individual names an author chose. Not flagged.
 *   2. TAILWIND-OWNED — starts with `--tw-` (compiler-generated `@property` registrations; fact 1
 *      of the Revision 1 brief: `grep -c "@property --tw-" node_modules/tailwindcss/*.css` is 0 in
 *      every shipped Tailwind stylesheet, so no non-prefix source could ever name them — the
 *      prefix is the ONLY available signal, same mechanism class as bucket 1's `--mantine-`
 *      exclusion), OR is declared in Tailwind's own `node_modules/tailwindcss/theme.css` /
 *      `index.css` (read live, version-pinned against `package-lock.json` so the source is
 *      deterministic — the same pattern `check-review-ledger.mjs` already uses for imported
 *      package styles). This closes BOTH B-1 and B-2: a name Tailwind's own source also claims is
 *      Tailwind-owned regardless of whether `globals.css` additionally redeclares it — redeclaring
 *      `--default-transition-duration` inside `@theme inline` no longer silences the gate, because
 *      ownership no longer stops at "declared in globals.css."
 *   3. PROJECT-OWNED — declared in `globals.css`'s `@theme`/`@theme inline`/`:root` blocks (same
 *      block-scoped extraction `check-css-var-resolvability.mjs`'s `extractOwnedNames` uses,
 *      `.dark` excluded for the same reason) AND NOT claimed by bucket 2. Not flagged.
 *   Everything not resolved by 1-3 is Tailwind-owned by elimination (never declared anywhere this
 *   gate can attribute to the project or to Mantine) — checked against the baseline.
 *
 * Checkpoint C-1 (`docs/sessions/evidence/task762-r1/emission-census.json`) measured, for all 257
 * names in `globals.css`'s `@theme inline`/`:root` blocks, whether each is emitted in the current
 * build and by which selector context. Result: EVERY emitted `@theme inline` name (49/185) is
 * emitted exclusively inside Tailwind's own compiler-generated `@layer theme{:host,:root{…}}` —
 * zero exceptions across all 257 names, including names with no Tailwind default at all
 * (`--space-0`, `--radius-lg`). Every `:root`-declared name (72/72) is emitted via a plain
 * (non-`@layer theme`) selector. This measured the brief's own flagged INFERENCE and turned it
 * into fact: `@theme inline`'s entire emission mechanism is Tailwind-compiler-dependent, not just
 * the names that happen to mirror a Tailwind default. Bucket 2 (Tailwind's own source, name
 * collision) is a bounded, deterministic proxy for this — it precisely closes B-1/B-2 without
 * flagging every `--space-N`/`--icon-*`/`--control-h-*` reference across the whole migrated
 * design system (a name-collision test only fires on names Tailwind ALSO defines). The broader,
 * now-measured fact — that ALL 185 `@theme inline` names share Category C's emission mechanism —
 * is named here, in `docs/design-system.md` §23.7, and in the session log as still-latent debt
 * this gate does not fully close; closing it completely would require every `@theme inline` name
 * to move to a plain `:root` declaration or a value verified independent of Tailwind, which is
 * out of this revision's bounded scope (D762-3 leaves Category B, the visible instance of this,
 * to Task 763).
 *
 * ── Baseline ────────────────────────────────────────────────────────────────────────────────────
 *
 * `scripts/tailwind-runtime-token-baseline.json` — an array of exact `{ file, property }` pairs.
 * `property` is the Tailwind-owned custom-property NAME, regardless of which role(s) surfaced it
 * in that file (`var()` read, declaration, or a bare name inside `transition-property`/
 * `will-change`) — R6: "a name found in more than one role in one file stays one row." Fails in
 * BOTH directions: a Tailwind-owned name not in the baseline -> exit 1 (new debt); a baseline row
 * whose (file, property) is no longer found -> exit 1 (stale baseline). No inline suppression
 * comment can exempt a reference — the baseline is the only exemption mechanism, and it is a
 * condition this gate evaluates on every run (`docs/backlog.md` corollary 724 ②).
 *
 * Scans the WHOLE file content (not line-by-line), so a multi-line `var(...)`/declaration/value
 * list is still found correctly — wider than `check-design-tokens.mjs`'s documented per-line
 * limitation (§23.6.c A8).
 *
 * Usage:
 *   node scripts/check-tailwind-runtime-tokens.mjs
 *   npm run check:tailwind-runtime-tokens
 *
 * Added by Task 762 (Sprint 62, 2026-08-21). Revised by Task 762 Revision 1 (2026-08-21).
 * Docs: docs/design-system.md §23.7.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const GLOBALS_PATH = resolve(ROOT, 'src/app/globals.css');
const SRC_DIR = resolve(ROOT, 'src');
const BASELINE_PATH = resolve(__dirname, 'tailwind-runtime-token-baseline.json');
const PACKAGE_LOCK_PATH = resolve(ROOT, 'package-lock.json');
const TAILWIND_THEME_PATH = resolve(ROOT, 'node_modules/tailwindcss/theme.css');
const TAILWIND_INDEX_PATH = resolve(ROOT, 'node_modules/tailwindcss/index.css');
const TAILWIND_PKG_PATH = resolve(ROOT, 'node_modules/tailwindcss/package.json');

const EXTERNAL_PREFIXES = ['--mantine-'];
const TAILWIND_PREFIXES = ['--tw-'];

// ── CSS comment stripping (same convention as check-design-tokens.mjs / check-css-var-resolvability.mjs) ──
export function stripCssComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

// ── Block extraction — brace-balanced, same technique as check-css-var-resolvability.mjs ──
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

// ── Ownership bucket 3 — @theme, @theme inline, :root blocks of globals.css. ──
// `.dark` is deliberately excluded (same reasoning as check-css-var-resolvability.mjs's
// extractOwnedNames — every name it re-declares is already owned via `:root`).
export function extractOwnedNames(rawGlobalsContent) {
  const stripped = stripCssComments(rawGlobalsContent);
  const names = new Set();
  for (const block of findAllBlocks(stripped, /^@theme\s*\{/m)) {
    for (const n of extractDeclNamesFromBlock(stripped.slice(block.start, block.end))) names.add(n);
  }
  for (const block of findAllBlocks(stripped, /^@theme inline\s*\{/m)) {
    for (const n of extractDeclNamesFromBlock(stripped.slice(block.start, block.end))) names.add(n);
  }
  for (const block of findAllBlocks(stripped, /^:root\s*\{/m)) {
    for (const n of extractDeclNamesFromBlock(stripped.slice(block.start, block.end))) names.add(n);
  }
  return names;
}

// ── Ownership bucket 2 — every name Tailwind's own shipped source declares (R4). ──
// Anchor-based (not block-scoped): we only need "does Tailwind declare this name anywhere",
// not which specific @theme variant. Reads BOTH theme.css (the theme scale: --text-*, --radius-*,
// --leading-*, --ease-*, …) and index.css (--default-transition-duration/-timing-function live
// here, inside Tailwind's own base-layer rule, not theme.css).
// Removes Tailwind's own explicitly-`/* Deprecated */`-marked block(s) before extraction — a name
// that exists ONLY inside a block Tailwind's own authors marked deprecated (theme.css's
// `@theme default inline reference { --radius: 0.25rem; … }`, superseded by --radius-*) does not
// feed any current Tailwind utility generation, so a project's own active declaration of that bare
// name is not actually shadowed by anything Tailwind currently does. A name declared in BOTH the
// deprecated block and elsewhere in the same file is unaffected (still extracted from the live
// declaration).
function stripDeprecatedBlocks(rawContent) {
  return rawContent.replace(/\/\*\s*Deprecated\s*\*\/\s*@[\w-]+[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, (m) => m.replace(/[^\n]/g, ' '));
}

export function extractAllDeclaredNames(content) {
  const stripped = stripCssComments(stripDeprecatedBlocks(content));
  const names = new Set();
  const re = /(?:^|[{;])\s*(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(stripped)) !== null) names.add(m[1]);
  return names;
}

function getPinnedTailwindVersion() {
  if (!existsSync(PACKAGE_LOCK_PATH)) return null;
  try {
    const lock = JSON.parse(readFileSync(PACKAGE_LOCK_PATH, 'utf8'));
    return lock.packages?.['node_modules/tailwindcss']?.version ?? null;
  } catch { return null; }
}
function getInstalledTailwindVersion() {
  if (!existsSync(TAILWIND_PKG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TAILWIND_PKG_PATH, 'utf8')).version ?? null;
  } catch { return null; }
}

// Fail-closed: a version mismatch, missing lockfile entry, or missing Tailwind source file makes
// the ownership source non-deterministic — this returns { fatal } rather than an empty/partial set.
export function loadTailwindOwnedNames() {
  const pinned = getPinnedTailwindVersion();
  const installed = getInstalledTailwindVersion();
  if (!pinned) return { fatal: `package-lock.json has no pinned version for node_modules/tailwindcss` };
  if (!installed) return { fatal: `node_modules/tailwindcss/package.json not found or unreadable` };
  if (pinned !== installed) {
    return { fatal: `tailwindcss version mismatch — package-lock.json pins ${pinned}, node_modules has ${installed}. Run "npm ci" before this gate.` };
  }
  if (!existsSync(TAILWIND_THEME_PATH) || !existsSync(TAILWIND_INDEX_PATH)) {
    return { fatal: `node_modules/tailwindcss/theme.css or index.css not found — run "npm ci"` };
  }
  const names = new Set();
  for (const n of extractAllDeclaredNames(readFileSync(TAILWIND_THEME_PATH, 'utf8'))) names.add(n);
  for (const n of extractAllDeclaredNames(readFileSync(TAILWIND_INDEX_PATH, 'utf8'))) names.add(n);
  return { names, version: installed };
}

function isKnownExternal(name) {
  return EXTERNAL_PREFIXES.some((p) => name.startsWith(p));
}
function isTailwindPrefixed(name) {
  return TAILWIND_PREFIXES.some((p) => name.startsWith(p));
}

// ── The three-bucket classifier (R4) ──
// `localDeclaredNames` (R4 fix, found during Revision 1 verification): a name declared WITHIN the
// SAME .module.css file being scanned — e.g. MobileBottomNavView.module.css's own
// `--fab-ring-color`/`--fab-scale-x/y`, MantineListingCardPattern.module.css's own `--text-color`
// (the mechanism Mantine's own `Text` component reads unconditionally, not a Tailwind or globals.css
// name at all) — is a genuinely self-contained, project-authored custom property with zero Tailwind
// dependency, the same "same file being scanned" resolution source
// check-css-var-resolvability.mjs's own Arm A/B already use. Without this, R6's widened declaration
// scan would flood false positives on every component-local CSS custom property in the whole
// migrated design system, none of which globals.css has any reason to also declare.
export function classifyName(name, ownedSet, tailwindOwnedNames, localDeclaredNames = new Set()) {
  if (isKnownExternal(name)) return 'external';
  if (isTailwindPrefixed(name)) return 'tailwind';
  if (tailwindOwnedNames.has(name)) return 'tailwind'; // B-1/B-2 fix: wins even if globals.css also declares it
  if (ownedSet.has(name)) return 'project';
  if (localDeclaredNames.has(name)) return 'project';
  return 'tailwind'; // bucket 3 by elimination — never declared anywhere attributable to project/Mantine
}

// ── var() reference NAME extraction — whole-file, paren-depth-aware, nested-call-aware. ──
export function findVarReferenceNames(strippedContent) {
  const names = [];
  const callRe = /var\(/g;
  let m;
  while ((m = callRe.exec(strippedContent)) !== null) {
    const contentStart = m.index + 4;
    let depth = 1;
    let i = contentStart;
    for (; i < strippedContent.length; i++) {
      if (strippedContent[i] === '(') depth++;
      else if (strippedContent[i] === ')') { depth--; if (depth === 0) break; }
    }
    if (depth !== 0) { callRe.lastIndex = contentStart; continue; } // unterminated — skip, do not crash
    const inner = strippedContent.slice(contentStart, i);
    const nameMatch = inner.match(/^\s*(--[\w-]+)/);
    if (nameMatch) names.push(nameMatch[1]);
    callRe.lastIndex = contentStart; // resume inside this call so a nested var() is still found
  }
  return names;
}

// ── Declaration NAME extraction (R6/E-1) — `--name: value;` anywhere in the file. ──
export function findDeclaredNames(strippedContent) {
  const names = [];
  const re = /(?:^|[{;])\s*(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(strippedContent)) !== null) names.push(m[1]);
  return names;
}

// ── Bare property-name-list extraction (R6/E-1) — `transition-property`/`will-change` values. ──
// Whole-value regex (not per-line), so a value spanning physical lines is still found.
export function findPropertyListNames(strippedContent) {
  const names = [];
  const re = /\b(?:transition-property|will-change)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(strippedContent)) !== null) {
    const tokenRe = /(--[\w-]+)/g;
    let tm;
    while ((tm = tokenRe.exec(m[1])) !== null) names.push(tm[1]);
  }
  return names;
}

// ── File collection — src/**/*.module.css ──
function collectModuleCssFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) results.push(...collectModuleCssFiles(full));
    else if (entry.endsWith('.module.css')) results.push(full);
  }
  return results;
}

// ── Core scan — returns Set<string> of Tailwind-owned property names found in one file,
// across all three roles (var() read, declaration, property-name list). ──
export function scanModuleCss(rawContent, ownedSet, tailwindOwnedNames) {
  const stripped = stripCssComments(rawContent);
  const declared = findDeclaredNames(stripped);
  const localDeclaredNames = new Set(declared);
  const names = [
    ...findVarReferenceNames(stripped),
    ...declared,
    ...findPropertyListNames(stripped),
  ];
  const flagged = new Set();
  for (const name of names) {
    if (classifyName(name, ownedSet, tailwindOwnedNames, localDeclaredNames) === 'tailwind') flagged.add(name);
  }
  return flagged;
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return [];
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch (e) {
    console.error(`❌  check:tailwind-runtime-tokens — ${relative(ROOT, BASELINE_PATH)} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error(`❌  check:tailwind-runtime-tokens — ${relative(ROOT, BASELINE_PATH)} must be a JSON array.`);
    process.exit(1);
  }
  return parsed;
}

function keyOf(entry) {
  return `${entry.file} ${entry.property}`;
}

export function runScan({ globalsPath = GLOBALS_PATH, srcDir = SRC_DIR } = {}) {
  if (!existsSync(globalsPath)) {
    return { fatal: `globals.css not found at ${globalsPath}` };
  }
  const globalsRaw = readFileSync(globalsPath, 'utf8');
  const ownedSet = extractOwnedNames(globalsRaw);
  if (ownedSet.size === 0) {
    return { fatal: `0 owned custom properties parsed from ${relative(ROOT, globalsPath) || globalsPath} — parse failure, not a vacuous pass` };
  }

  const tw = loadTailwindOwnedNames();
  if (tw.fatal) return { fatal: tw.fatal };

  const files = collectModuleCssFiles(srcDir);
  const found = [];
  for (const f of files) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const raw = readFileSync(f, 'utf8');
    const flagged = scanModuleCss(raw, ownedSet, tw.names);
    for (const property of [...flagged].sort()) found.push({ file: rel, property });
  }
  found.sort((a, b) => (a.file === b.file ? a.property.localeCompare(b.property) : a.file.localeCompare(b.file)));

  return { ownedSet, tailwindOwnedNames: tw.names, tailwindVersion: tw.version, filesScanned: files.length, found };
}

function printReport(result, baseline) {
  const foundKeys = new Set(result.found.map(keyOf));
  const baselineKeys = new Set(baseline.map(keyOf));

  const newDebt = result.found.filter((f) => !baselineKeys.has(keyOf(f)));
  const staleEntries = baseline.filter((b) => !foundKeys.has(keyOf(b)));

  console.log(`🔍  check:tailwind-runtime-tokens — scanned ${result.filesScanned} src/**/*.module.css file(s)`);
  console.log(`    ownership source: globals.css @theme/@theme inline/:root (${result.ownedSet.size} project-owned names) + tailwindcss@${result.tailwindVersion} theme.css/index.css (${result.tailwindOwnedNames.size} Tailwind-declared names, version-pinned) + --mantine-/--tw- prefixes`);
  console.log(`    Tailwind-owned references found: ${result.found.length} | baseline entries: ${baseline.length}`);
  console.log('');

  if (newDebt.length > 0) {
    console.log(`❌  ${newDebt.length} Tailwind-owned reference(s) NOT in the baseline (new debt):`);
    for (const d of newDebt) console.log(`    ${d.file}  ${d.property}`);
    console.log('');
  }
  if (staleEntries.length > 0) {
    console.log(`❌  ${staleEntries.length} baseline entrie(s) whose reference no longer exists (stale baseline):`);
    for (const s of staleEntries) console.log(`    ${s.file}  ${s.property}`);
    console.log('');
  }

  return { newDebt, staleEntries };
}

function run() {
  const result = runScan();
  if (result.fatal) {
    console.error(`❌  check:tailwind-runtime-tokens — ${result.fatal}`);
    process.exit(1);
  }
  const baseline = loadBaseline();
  const { newDebt, staleEntries } = printReport(result, baseline);

  if (newDebt.length > 0 || staleEntries.length > 0) {
    console.error(`❌  check:tailwind-runtime-tokens — ${newDebt.length} new debt + ${staleEntries.length} stale baseline entrie(s). Baseline must match the live scan exactly.`);
    console.error('    Fix: replace the Tailwind runtime-token reference with a literal (docs/design-system.md §23.7),');
    console.error('    or add/remove the exact { file, property } row in scripts/tailwind-runtime-token-baseline.json.');
    process.exit(1);
  }

  console.log('✅  check:tailwind-runtime-tokens — 0 new debt, 0 stale baseline entries.');
  process.exit(0);
}

// ── CLI entrypoint ──
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
