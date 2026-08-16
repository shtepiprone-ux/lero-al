#!/usr/bin/env node
/**
 * check-css-var-resolvability.mjs — Task 700 (Sprint 46.3) CSS custom-property resolvability gate.
 *
 * Owner directive, 2026-08-10 (re-scoped from a "@theme-dependency" premise measured and falsified
 * — see the kickoff §0.1/§3.1): every reference to a project-OWNED custom property must resolve to
 * a declaration that actually SHIPS in the production bundle, or to an `@property` registration.
 * "Owned" is computed live from `src/app/globals.css` — never a hardcoded array or allowlist file
 * (R3) — because an unscoped "every var() must resolve" check false-positives on ~112 Mantine
 * runtime custom properties set only via inline styles (`--app-shell-navbar-width`,
 * `--mantine-color-brand-0…9`, etc. — §3.3 of the kickoff).
 *
 * TWO ARMS, because one is not enough (kickoff §0.2 D1 — draft 1's own motivating example,
 * `LightboxView.tsx`/`MantineListingGalleryPattern.tsx`'s `var(--color-overlay-foreground)`
 * TSX-inline-style consumers, would have been invisible to a CSS-only scan):
 *   Arm A — every `var(--owned)` in the shipped CSS (`.next/static/css/*.css` by default)
 *           resolves to a shipped declaration or an `@property` registration.
 *   Arm B — every `var(--owned)` written in `src/**\/*.{css,tsx,ts}` (excluding `globals.css`,
 *           the ownership source) resolves the same way. The glob is `.css`, not `.module.css`
 *           (kickoff §0.3 E3 — `src/design-system/mantine/input-chrome.css` is a real project
 *           stylesheet, not a CSS Module, and contributes `--color-input`).
 *
 * Baseline on both arms: 0 violations. This gate starts blocking and stays blocking — no
 * allowlist, no baseline file, no `continue-on-error` (kickoff §10.8).
 *
 * Explicitly NOT claimed: this gate cannot resolve a dynamically-constructed variable name
 * (`var(--${name})`). It instead asserts a SCOPED invariant (R6, kickoff §3.4): for each dynamic
 * `var()` construction site, take the literal text between `var(--` and the first `${` — the
 * "prefix". A site is reported iff some OWNED name starts with `--<prefix>`. The 8 measured
 * `var(--mantine-color-${color}-N)` sites share the prefix `mantine-color-`, and NO owned name
 * starts with `--mantine`, so they are out-of-class and silent; a new prefix that COULD
 * name an owned token (e.g. `--space-`) fails the gate for a human to resolve.
 *
 * Two more resolution rules, both found by measurement (kickoff §3.5):
 *   - Comments are stripped before scanning, on BOTH arms, covering CSS block comments and,
 *     for TS/TSX, block/line/JSX forms — via a small tokenizer that also tracks string/template/
 *     regex-literal state so `https://` (or a regex literal containing a block-comment opener) is
 *     never misread as a comment (kickoff §0.3 E4 — draft 2's naive block-comment-only strip missed
 *     the `//` line-comment form entirely; `theme.ts:280`'s `// … var(--button-hover, …)` is the
 *     control case, C3).
 *   - `@property --x { … }` counts as a declaration (R5) — 80 such registrations back the
 *     `--tw-shadow`/`--tw-ring-*` family `ListingCard.module.css` and `MobileBottomNavView.module.css`
 *     depend on (Task 702 C1); missing this would false-positive on landed D28 work.
 *
 * A reference WITH a fallback (`var(--x, fallback)`) can never silently compute to the property's
 * initial value, so it is reported separately, non-blocking (R10) — it never affects the exit code.
 *
 * Freshness (R8/A1): the shipped bundle is only as current as the last `npm run build`. Its newest
 * file mtime is compared against the newest mtime among ALL scanned inputs — `globals.css` PLUS
 * every file matched by Arm B's own glob — not just `.module.css` files (kickoff §0.3 E3 / draft 1's
 * D3: a narrower staleness guard passes an edited non-module `.css` file that never got rebuilt).
 *
 * Ownership (R3) is computed by parsing `globals.css` (comments stripped) for every `--x:`
 * declaration inside `@theme`, `@theme inline`, and every top-level `:root` block — never the
 * `.dark` block (A2 — a name re-declared there under an already-owned name adds nothing; `.dark`
 * never introduces a NEW name in this file, measured 2026-08-10). An empty owned set is a
 * non-zero exit (a `globals.css` parse failure must never look like "0 violations").
 *
 * Input seam (R11, kickoff §0.2 D4): `--css-dir` / `--globals-path` / `--src-dir`. Every
 * `--verify-gate` plant and control runs against a `mkdtempSync` copy driven through these three
 * flags — the real tree is never written to.
 *
 * Usage:
 *   node scripts/check-css-var-resolvability.mjs                    Assert the real tree.
 *   node scripts/check-css-var-resolvability.mjs --verify-gate       Self-test (temp copies only).
 *   node scripts/check-css-var-resolvability.mjs --css-dir <dir> --globals-path <file> --src-dir <dir>
 *
 * Precedent copied (kickoff §3.7): `check-homepage-grid.mjs`'s `--verify-gate` self-test
 * convention and provenance-comment style; `check-design-tokens.mjs`'s strict/report split and
 * violation-report format; `scripts/__tests__/` as the unit-test location the `governance` CI job
 * already runs.
 *
 * Wired into CI: `.github/workflows/governance-pr.yml`, `click-shield` job, after `npm run build`
 * (the only job in this file that runs a real Next.js build — kickoff §3.6).
 */

import {
  readFileSync, readdirSync, statSync, existsSync,
  mkdtempSync, cpSync, rmSync, mkdirSync, writeFileSync, unlinkSync, utimesSync,
} from 'node:fs';
import { join, resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────
function getFlag(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] !== undefined) return process.argv[idx + 1];
  return def;
}
const VERIFY_GATE = process.argv.includes('--verify-gate');
const CSS_DIR = resolve(process.cwd(), getFlag('css-dir', resolve(ROOT, '.next/static/css')));
const GLOBALS_PATH = resolve(process.cwd(), getFlag('globals-path', resolve(ROOT, 'src/app/globals.css')));
const SRC_DIR = resolve(process.cwd(), getFlag('src-dir', resolve(ROOT, 'src')));

// ═══════════════════════════════════════════════════════════════════════════
// § Comment stripping (R4) — CSS: block comments only (CSS has no line comments).
// TS/TSX: block, line (`//`), and JSX (`{/* … */}` — a block comment whose
// surrounding braces are ordinary JSX syntax, left untouched; only the `/* … */`
// span itself is blanked) — WITH string/template/regex-literal state tracking so
// a comment marker inside a string (`"https://example.com"`) or a regex literal
// is never misread as starting a real comment (kickoff §0.3 E4).
//
// Every stripped character that is not a newline becomes a single space, so
// line/column numbers of real code after the strip are unchanged (the same
// convention `check-design-tokens.mjs` uses for its own JSX/CSS strippers).
// ═══════════════════════════════════════════════════════════════════════════
const REGEX_PRECEDING = new Set([
  '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', ';', '+', '-', '*', '%', '^', '~', '<', '>', '',
]);
const REGEX_PRECEDING_KEYWORDS = new Set([
  'return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'do', 'else', 'yield', 'instanceof',
]);

export function stripComments(content, isCss) {
  let out = '';
  let i = 0;
  const n = content.length;
  let prevChar = ''; // last emitted non-whitespace, non-comment significant char
  let lastWord = ''; // last identifier/keyword run, for the regex heuristic

  while (i < n) {
    const c = content[i];
    const c2 = i + 1 < n ? content[i + 1] : '';

    // Line comment (// …) — TS/TSX only.
    if (!isCss && c === '/' && c2 === '/') {
      while (i < n && content[i] !== '\n') { out += ' '; i++; }
      continue;
    }

    // Block comment (/* … */) — both CSS and TS/TSX. This also strips the
    // content of a JSX comment `{/* … */}`: the braces are ordinary JSX
    // expression-container syntax and are left alone; only the `/* … */`
    // span between them is blanked.
    if (c === '/' && c2 === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(content[i] === '*' && content[i + 1] === '/')) {
        out += content[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < n) { out += '  '; i += 2; } else { break; }
      continue;
    }

    if (!isCss) {
      // Single/double-quoted string — respect backslash escapes.
      if (c === '"' || c === "'") {
        const quote = c;
        out += c; i++;
        while (i < n && content[i] !== quote) {
          if (content[i] === '\\' && i + 1 < n) { out += content[i] + content[i + 1]; i += 2; continue; }
          out += content[i] === '\n' ? '\n' : content[i];
          i++;
        }
        if (i < n) { out += content[i]; i++; }
        prevChar = quote; lastWord = '';
        continue;
      }
      // Template literal (backtick) — tracks one level of `${ … }` interpolation
      // depth so a brace inside the interpolated expression doesn't end the
      // template early. Nested backticks inside `${…}` are not modeled — a
      // documented simplification; no scanned file in this repo does that.
      if (c === '`') {
        out += c; i++;
        let braceDepth = 0;
        while (i < n) {
          if (content[i] === '\\' && i + 1 < n) { out += content[i] + content[i + 1]; i += 2; continue; }
          if (braceDepth === 0 && content[i] === '`') { out += content[i]; i++; break; }
          if (content[i] === '$' && content[i + 1] === '{') { out += '${'; i += 2; braceDepth++; continue; }
          if (braceDepth > 0 && content[i] === '{') { braceDepth++; out += content[i]; i++; continue; }
          if (braceDepth > 0 && content[i] === '}') { braceDepth--; out += content[i]; i++; continue; }
          out += content[i] === '\n' ? '\n' : content[i];
          i++;
        }
        prevChar = '`'; lastWord = '';
        continue;
      }
      // Regex literal — heuristic entry (previous significant token suggests an
      // operand position, matching common tokenizer heuristics). Bails to plain
      // division if no matching unescaped `/` is found before a newline.
      if (c === '/' && (REGEX_PRECEDING.has(prevChar) || REGEX_PRECEDING_KEYWORDS.has(lastWord))) {
        let j = i + 1;
        let inClass = false;
        let closed = false;
        while (j < n && content[j] !== '\n') {
          if (content[j] === '\\' && j + 1 < n) { j += 2; continue; }
          if (content[j] === '[') inClass = true;
          else if (content[j] === ']') inClass = false;
          else if (content[j] === '/' && !inClass) { j++; closed = true; break; }
          j++;
        }
        if (closed) {
          while (j < n && /[a-z]/i.test(content[j])) j++;
          out += content.slice(i, j);
          i = j;
          prevChar = '/'; lastWord = '';
          continue;
        }
        // Not a regex after all (e.g. plain division with no closing `/` on
        // this line) — fall through and emit the `/` literally below.
      }
    }

    out += c;
    if (/[A-Za-z0-9_$]/.test(c)) lastWord += c;
    else lastWord = '';
    if (!/\s/.test(c)) prevChar = c; else if (c !== '\n') prevChar = prevChar;
    i++;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// § Block extraction — find every top-level occurrence of a header (e.g.
// `@theme inline {`) in already comment-stripped content and return its
// brace-balanced content span. Used for ownership scoping (R3, A2).
// ═══════════════════════════════════════════════════════════════════════════
function findAllBlocks(strippedSource, headerRe) {
  const blocks = [];
  const re = new RegExp(headerRe.source, headerRe.flags.includes('g') ? headerRe.flags : headerRe.flags + 'g');
  let m;
  while ((m = re.exec(strippedSource)) !== null) {
    let i = m.index + m[0].length; // header regex ends with the opening '{'
    let depth = 1;
    const start = i;
    for (; i < strippedSource.length; i++) {
      if (strippedSource[i] === '{') depth++;
      else if (strippedSource[i] === '}') { depth--; if (depth === 0) break; }
    }
    blocks.push({ start, end: i });
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

// ── Ownership (R3, R2 A2) ──────────────────────────────────────────────────
// Parses `@theme`, `@theme inline`, and every top-level `:root` block. The
// `.dark` block is deliberately excluded: measured 2026-08-10, every custom
// property it re-declares already has the same NAME declared in `:root` — a
// re-declaration under an already-owned name introduces no new owned name.
export function extractOwnedNames(rawGlobalsContent) {
  const stripped = stripComments(rawGlobalsContent, true);
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

// ── "Is this name declared anywhere in this CSS content" (Arm A/B resolution
// source — declarations anywhere, not selector-scoped: a shipped `@layer theme`
// declaration lives inside a `:where(...)` wrapper Tailwind generates).
//
// Anchored on the character immediately preceding the candidate declaration
// (start-of-file, `{`, or `;`) rather than a full quote/paren-depth walk — a
// depth-tracking walk (check-design-tokens.mjs's extractCssCustomPropertyDefinitions
// approach, built for AUTHORED, non-minified CSS) was tried first and measured
// broken against Tailwind v4's own MINIFIED, HEAVILY-ESCAPED output: an
// arbitrary-value selector like `[class*=\'size-\']` backslash-escapes its own
// apostrophes as literal selector characters, which a naive outside-of-string
// backslash-skip does not account for; the walk misreads the first escaped `'`
// as opening a real string, and every declaration after that point in the file
// (measured: `--radius`/`--muted`/`--border`/… — an entire later `:root` block)
// silently disappears. The anchor-based regex below needs no quote state at
// all and was cross-checked against a from-scratch re-derivation (2026-08-10):
// 190/50/140 and Arm A = 78, exactly matching the kickoff's own measured
// figures, including the "declaration immediately following a real `;`/`{`"
// case this file's own minified selectors are full of.
export function extractCssDeclaredNames(rawCssContent) {
  const stripped = stripComments(rawCssContent, true);
  const defs = new Set();
  const re = /(?:^|[{;])\s*(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(stripped)) !== null) defs.add(m[1]);
  return defs;
}

// ── @property registrations (R5) ────────────────────────────────────────────
export function extractPropertyRegisteredNames(rawCssContent) {
  const stripped = stripComments(rawCssContent, true);
  const names = new Set();
  const re = /@property\s+(--[\w-]+)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) names.add(m[1]);
  return names;
}

// ═══════════════════════════════════════════════════════════════════════════
// § var() reference extraction — literal (static) references only. A dynamic
// construction site (`var(--prefix${...})`) never matches here: `--[\w-]+`
// cannot consume a `$`, so the regex fails to reach a `,`/`)` at that position
// and the whole match attempt is rejected — dynamic sites are found separately
// by findDynamicVarSites. Paren-depth aware for the fallback arm, so a nested
// `var(--tw-ease, var(--default-transition-timing-function))` finds BOTH the
// outer and (independently) the inner reference, and the outer's fallback text
// is not truncated at the inner call's own closing paren.
// ═══════════════════════════════════════════════════════════════════════════
export function findVarReferences(strippedContent) {
  const results = [];
  const lineStarts = buildLineIndex(strippedContent);
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
    if (depth !== 0) continue; // unterminated — skip
    const inner = strippedContent.slice(contentStart, i);
    const nameMatch = inner.match(/^\s*(--[\w-]+)\s*(,|$)/);
    if (!nameMatch) continue; // not a plain literal name (e.g. a dynamic site) — skip
    const name = nameMatch[1];
    const hasFallback = nameMatch[2] === ',';
    results.push({ name, hasFallback, line: lineNumberAt(lineStarts, m.index) });
    // Resume the search right after THIS call's own "var(" (not past its
    // closing paren) so a var() nested inside this one's fallback — e.g.
    // `var(--tw-ease, var(--default-transition-timing-function))` — is still
    // found on a later iteration of this same loop, independently.
    callRe.lastIndex = contentStart;
  }
  return results;
}

// ── Dynamic var() construction sites (R6, §3.4) ────────────────────────────
// Matches `var(--<literal-prefix>${` — the prefix is everything between `--`
// and the first `${`. Runs on comment-stripped, STRING/TEMPLATE-PRESERVING
// content, so this only fires inside real template-literal text (the same
// source findVarReferences reads).
export function findDynamicVarSites(strippedContent) {
  const results = [];
  const lineStarts = buildLineIndex(strippedContent);
  const re = /var\(\s*--([\w-]*)\$\{/g;
  let m;
  while ((m = re.exec(strippedContent)) !== null) {
    results.push({ prefix: m[1], line: lineNumberAt(lineStarts, m.index), raw: m[0] });
  }
  return results;
}

function buildLineIndex(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) if (content[i] === '\n') starts.push(i + 1);
  return starts;
}
function lineNumberAt(lineStarts, pos) {
  let lo = 0, hi = lineStarts.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= pos) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans + 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// § File walking
// ═══════════════════════════════════════════════════════════════════════════
function walkFiles(dir, exts) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

function listCssDirFiles(cssDir) {
  if (!existsSync(cssDir)) return [];
  return readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => join(cssDir, f));
}

// Bumps every shipped-CSS file's mtime to "now" — called after every
// --verify-gate mutation, right before re-running the scan. Every plant/
// control edits or creates a file under the temp globals/src copies; without
// this, that edit's own (freshly-created) mtime would be NEWER than the
// bundle's copied-at-setup mtime and R8's OWN freshness gate would report a
// stale build on every single plant, masking the actual assertion under test.
function touchCssDir(cssDir) {
  // +60s, not "now": Node's utimesSync/statSync round-trip through a Date can
  // lose sub-millisecond precision on some filesystems, so a bare "now" was
  // measured tying (not beating) a fixture file written a moment earlier in
  // the SAME call — R8's strict `>` correctly read that as "not newer" and
  // reported the bundle stale. A 60s-future timestamp removes the ambiguity.
  const future = new Date(Date.now() + 60_000);
  for (const f of listCssDirFiles(cssDir)) utimesSync(f, future, future);
}

// ═══════════════════════════════════════════════════════════════════════════
// § Freshness (R8/A1) — the bundle mtime vs. every scanned input's mtime: the
// SAME file list Arm B scans (globals.css + every src/**/*.{css,tsx,ts} file),
// derived from one list so widening the glob can never silently leave the
// freshness set narrow (kickoff §0.3 E3 / draft 1's D3).
// ═══════════════════════════════════════════════════════════════════════════
function checkFreshness(cssDir, globalsPath, srcDir) {
  const cssFiles = listCssDirFiles(cssDir);
  if (cssFiles.length === 0) {
    return { fresh: false, reason: `no shipped CSS found under ${relative(ROOT, cssDir) || cssDir} — run "npm run build" first` };
  }
  let bundleMtime = 0;
  for (const f of cssFiles) bundleMtime = Math.max(bundleMtime, statSync(f).mtimeMs);

  const scannedInputs = getArmBFiles(srcDir, globalsPath);
  if (existsSync(globalsPath)) scannedInputs.push(globalsPath);

  let newestInput = 0;
  let newestInputPath = null;
  for (const f of scannedInputs) {
    const mtime = statSync(f).mtimeMs;
    if (mtime > newestInput) { newestInput = mtime; newestInputPath = f; }
  }

  if (newestInput > bundleMtime) {
    return {
      fresh: false,
      reason: `shipped CSS (newest ${new Date(bundleMtime).toISOString()}) is older than ${relative(ROOT, newestInputPath) || newestInputPath} (${new Date(newestInput).toISOString()}) — rebuild with "npm run build"`,
    };
  }
  return { fresh: true };
}

// Arm B's own file list — src/**/*.{css,tsx,ts} EXCLUDING globals.css. This is
// the exact set reused by both scanArmB and checkFreshness (A1's "one list").
function getArmBFiles(srcDir, globalsPath) {
  const files = walkFiles(srcDir, ['.css', '.tsx', '.ts']);
  const globalsResolved = resolve(globalsPath);
  return files.filter((f) => resolve(f) !== globalsResolved);
}

// ═══════════════════════════════════════════════════════════════════════════
// § Core scan
// ═══════════════════════════════════════════════════════════════════════════
function classifyReferences(refs, ownedSet, declaredSet, propertySet, armLabel, fileLabel) {
  const violations = [];
  const fallbackReports = [];
  const resolvedOwnedNames = new Set();
  for (const ref of refs) {
    if (!ownedSet.has(ref.name)) continue; // unowned — never reported (R3/C2)
    resolvedOwnedNames.add(ref.name);
    if (ref.hasFallback) {
      fallbackReports.push({ arm: armLabel, file: fileLabel, line: ref.line, name: ref.name });
      continue; // fallback exempts from blocking (R10) regardless of resolution
    }
    const resolved = declaredSet.has(ref.name) || propertySet.has(ref.name);
    if (!resolved) {
      violations.push({ arm: armLabel, file: fileLabel, line: ref.line, name: ref.name });
    }
  }
  return { violations, fallbackReports, resolvedOwnedNames };
}

function scanArmA(cssDir, ownedSet) {
  const files = listCssDirFiles(cssDir);
  const declaredSet = new Set();
  const propertySet = new Set();
  const rawByFile = new Map();
  for (const f of files) {
    const raw = readFileSync(f, 'utf8');
    rawByFile.set(f, raw);
    for (const n of extractCssDeclaredNames(raw)) declaredSet.add(n);
    for (const n of extractPropertyRegisteredNames(raw)) propertySet.add(n);
  }
  const violations = [];
  const fallbackReports = [];
  const referencedOwnedNames = new Set();
  for (const f of files) {
    const stripped = stripComments(rawByFile.get(f), true);
    const refs = findVarReferences(stripped);
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const { violations: v, fallbackReports: fb, resolvedOwnedNames } =
      classifyReferences(refs, ownedSet, declaredSet, propertySet, 'A', rel);
    violations.push(...v);
    fallbackReports.push(...fb);
    for (const n of resolvedOwnedNames) referencedOwnedNames.add(n);
  }
  return { violations, fallbackReports, referencedOwnedNames, declaredSet, propertySet };
}

function scanArmB(srcDir, globalsPath, ownedSet, declaredSet, propertySet) {
  const files = getArmBFiles(srcDir, globalsPath);
  const violations = [];
  const fallbackReports = [];
  const referencedOwnedNames = new Set();
  const dynamicSites = [];
  for (const f of files) {
    const isCss = f.endsWith('.css');
    const raw = readFileSync(f, 'utf8');
    const stripped = stripComments(raw, isCss);
    const rel = relative(ROOT, f).replace(/\\/g, '/');

    const refs = findVarReferences(stripped);
    const { violations: v, fallbackReports: fb, resolvedOwnedNames } =
      classifyReferences(refs, ownedSet, declaredSet, propertySet, 'B', rel);
    violations.push(...v);
    fallbackReports.push(...fb);
    for (const n of resolvedOwnedNames) referencedOwnedNames.add(n);

    if (!isCss) {
      for (const site of findDynamicVarSites(stripped)) {
        const inClass = [...ownedSet].some((n) => n.startsWith(`--${site.prefix}`));
        dynamicSites.push({ file: rel, line: site.line, prefix: site.prefix, inClass });
      }
    }
  }
  return { violations, fallbackReports, referencedOwnedNames, dynamicSites };
}

function runScan({ cssDir, globalsPath, srcDir }) {
  if (!existsSync(globalsPath)) {
    return { fatal: `globals.css not found at ${globalsPath}` };
  }
  const globalsRaw = readFileSync(globalsPath, 'utf8');
  const ownedSet = extractOwnedNames(globalsRaw);
  if (ownedSet.size === 0) {
    return { fatal: `0 owned custom properties parsed from ${relative(ROOT, globalsPath) || globalsPath} — parse failure, not a vacuous pass (R3)` };
  }

  const freshness = checkFreshness(cssDir, globalsPath, srcDir);
  if (!freshness.fresh) {
    return { fatal: freshness.reason };
  }

  const armA = scanArmA(cssDir, ownedSet);
  const armB = scanArmB(srcDir, globalsPath, ownedSet, armA.declaredSet, armA.propertySet);

  const inClassDynamicSites = armB.dynamicSites.filter((s) => s.inClass);

  return {
    ownedSet,
    armA,
    armB,
    inClassDynamicSites,
    violations: [...armA.violations, ...armB.violations],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// § Report + main run
// ═══════════════════════════════════════════════════════════════════════════
function printReport(result) {
  const { ownedSet, armA, armB, inClassDynamicSites, violations } = result;
  console.log(`🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): ${ownedSet.size}`);
  console.log(`    Arm A (shipped CSS) — owned names referenced: ${armA.referencedOwnedNames.size}`);
  console.log(`    Arm B (src/**/*.{css,tsx,ts}, excl. globals.css) — owned names referenced: ${armB.referencedOwnedNames.size}`);
  console.log(`    Dynamic var() construction sites: ${armB.dynamicSites.length} raw, ${inClassDynamicSites.length} in-class (prefix could name an owned token)`);
  console.log('');

  if (violations.length > 0) {
    console.log(`❌  ${violations.length} unresolved owned var() reference(s):`);
    for (const v of violations) {
      console.log(`    Arm ${v.arm}  ${v.file}:${v.line}  var(${v.name}) — no shipped declaration, no @property registration`);
    }
    console.log('');
  }

  if (inClassDynamicSites.length > 0) {
    console.log(`❌  ${inClassDynamicSites.length} dynamic var() construction site(s) whose prefix could name an owned token:`);
    for (const s of inClassDynamicSites) {
      console.log(`    ${s.file}:${s.line}  ${s.raw}…)  — prefix "--${s.prefix}" matches an owned name`);
    }
    console.log('');
  }

  const allFallback = [...armA.fallbackReports, ...armB.fallbackReports];
  console.log(`ℹ️   ${allFallback.length} fallback-bearing owned reference(s) — non-blocking (R10):`);
  if (allFallback.length > 0) {
    for (const f of allFallback) console.log(`    Arm ${f.arm}  ${f.file}:${f.line}  var(${f.name}, …)`);
  }
  console.log('');
}

function run() {
  const result = runScan({ cssDir: CSS_DIR, globalsPath: GLOBALS_PATH, srcDir: SRC_DIR });
  if (result.fatal) {
    console.error(`❌  check:css-vars — ${result.fatal}`);
    process.exit(1);
  }
  printReport(result);
  const blocking = result.violations.length + result.inClassDynamicSites.length;
  if (blocking > 0) {
    console.error(`❌  check:css-vars — ${blocking} blocking finding(s). Baseline is 0.`);
    process.exit(1);
  }
  console.log('✅  check:css-vars — 0 violations, 0 in-class dynamic sites.');
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § --verify-gate (R9/R11) — 4 plants shown FAILING, 4 controls shown PASSING,
// all against mkdtempSync copies driven through --css-dir/--globals-path/
// --src-dir. No plant ever writes to the real tree.
// ═══════════════════════════════════════════════════════════════════════════
function setupTempTree() {
  const base = mkdtempSync(join(tmpdir(), 'css-var-resolvability-'));
  const cssDir = join(base, 'css');
  const srcDir = join(base, 'src');
  mkdirSync(cssDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });
  for (const f of listCssDirFiles(resolve(ROOT, '.next/static/css'))) {
    cpSync(f, join(cssDir, relative(resolve(ROOT, '.next/static/css'), f)));
  }
  // Arm B only ever needs .css/.tsx/.ts files, but copying the whole src tree
  // keeps relative import/reference shapes intact for anything a future plant
  // might need; the real gate only ever walks the three extensions anyway.
  cpSync(resolve(ROOT, 'src'), srcDir, { recursive: true });
  // globals-path points at the copy that already lives INSIDE srcDir (its
  // real production location, src/app/globals.css) — NOT a second, separate
  // standalone copy. A first version of this self-test copied globals.css to
  // a sibling path outside srcDir; getArmBFiles' exclusion filter then never
  // matched the (different-path) copy still sitting inside srcDir, so that
  // copy was scanned as an ordinary Arm B file and inflated the owned-name
  // reference count via globals.css's own internal alias chains (e.g.
  // `--primary: var(--brand-700)`) — measured baseline Arm B refs = 106
  // instead of 55 before this fix (2026-08-10).
  const globalsPath = join(srcDir, 'app', 'globals.css');
  return { base, cssDir, globalsPath, srcDir };
}

function teardownTempTree(base) {
  rmSync(base, { recursive: true, force: true });
}

function findFirstDeclarationSite(cssDir, name) {
  for (const f of listCssDirFiles(cssDir)) {
    const raw = readFileSync(f, 'utf8');
    if (extractCssDeclaredNames(raw).has(name)) return f;
  }
  return null;
}

function countDeclarationSites(cssDir, name) {
  let count = 0;
  for (const f of listCssDirFiles(cssDir)) {
    if (extractCssDeclaredNames(readFileSync(f, 'utf8')).has(name)) count++;
  }
  return count;
}

function removeDeclarationLine(filePath, name) {
  const raw = readFileSync(filePath, 'utf8');
  const stripped = stripComments(raw, true);
  const re = new RegExp(`${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:[^;{}]*;?`);
  const m = re.exec(stripped);
  if (!m) throw new Error(`removeDeclarationLine: ${name} not found in ${filePath}`);
  const newContent = raw.slice(0, m.index) + raw.slice(m.index + m[0].length);
  writeFileSync(filePath, newContent, 'utf8');
  return newContent !== raw;
}

function renameDeclarationName(filePath, oldName, newName) {
  const raw = readFileSync(filePath, 'utf8');
  const stripped = stripComments(raw, true);
  const re = new RegExp(`${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s*:)`);
  const m = re.exec(stripped);
  if (!m) throw new Error(`renameDeclarationName: ${oldName} not found in ${filePath}`);
  const newContent = raw.slice(0, m.index) + newName + raw.slice(m.index + oldName.length);
  writeFileSync(filePath, newContent, 'utf8');
}

const results = [];
function record(id, expectation, ok, detail) {
  results.push({ id, expectation, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon}  ${id} (${expectation}) — ${detail}`);
}

function runPlantP1(tree) {
  // P1 (Arm A) — half-applied rename, modeled entirely within the shipped-CSS
  // copy: the DECLARATION side is renamed while a CONSUMING reference is left
  // pointing at the old name. globals.css is left untouched so the target
  // token STAYS owned — renaming it away in globals.css would un-own it,
  // which would make the plant undetectable under R3's own live-ownership
  // rule (a self-immunizing mutation the kickoff's literal "rename … in the
  // globals copy" text does not account for; see the session log's deviation
  // note). Target: --radius-md (declared once, @theme inline; consumed in
  // shipped CSS via Tailwind's own `rounded-[min(var(--radius-md),Npx)]`
  // arbitrary-value bracket classes).
  const name = '--radius-md';
  const declSites = countDeclarationSites(tree.cssDir, name);
  const refFileBefore = listCssDirFiles(tree.cssDir).find((f) =>
    findVarReferences(stripComments(readFileSync(f, 'utf8'), true)).some((r) => r.name === name));
  if (declSites !== 1 || !refFileBefore) {
    record('P1', 'FAIL', false, `pre-plant census failed — ${name} has ${declSites} declaration site(s), ref file ${refFileBefore ?? 'none'} (no further lifeline unproven)`);
    return;
  }
  const declFile = findFirstDeclarationSite(tree.cssDir, name);
  renameDeclarationName(declFile, name, `${name}-renamed`);
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    const hit = result.violations?.find((v) => v.name === name && v.arm === 'A');
    record('P1', 'FAIL', !!hit, hit
      ? `Arm A correctly reported unresolved ${name} at ${hit.file}:${hit.line} after its declaration was renamed to ${name}-renamed`
      : `Arm A did NOT report ${name} after its shipped declaration was renamed away — plant did not reproduce`);
  } finally {
    renameDeclarationName(declFile, `${name}-renamed`, name);
  }
}

function runPlantP2(tree) {
  // P2 (Arm A) — full declaration deletion from the shipped CSS, leaving a
  // consumer intact; mirrors Task 690's move-out-of-@theme (the shipped
  // declaration disappeared, but nothing else changed). globals.css is left
  // untouched (same ownership-preservation reasoning as P1).
  const name = '--color-badge-premium';
  const declSites = countDeclarationSites(tree.cssDir, name);
  const refFileBefore = listCssDirFiles(tree.cssDir).find((f) =>
    findVarReferences(stripComments(readFileSync(f, 'utf8'), true)).some((r) => r.name === name));
  if (declSites !== 1 || !refFileBefore) {
    record('P2', 'FAIL', false, `pre-plant census failed — ${name} has ${declSites} declaration site(s), ref file ${refFileBefore ?? 'none'} (no further lifeline unproven)`);
    return;
  }
  const declFile = findFirstDeclarationSite(tree.cssDir, name);
  const original = readFileSync(declFile, 'utf8');
  removeDeclarationLine(declFile, name);
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    const hit = result.violations?.find((v) => v.name === name && v.arm === 'A');
    record('P2', 'FAIL', !!hit, hit
      ? `Arm A correctly reported unresolved ${name} at ${hit.file}:${hit.line} after its declaration was deleted`
      : `Arm A did NOT report ${name} after its shipped declaration was deleted — plant did not reproduce`);
  } finally {
    writeFileSync(declFile, original, 'utf8');
  }
}

function runPlantP3(tree) {
  // P3 (Arm B) — --text-3xl. Task 695 deleted --color-overlay-foreground (this
  // plant's original target) along with the rest of the `@theme inline`
  // overlay copy, so a token with the same shape had to be found: exactly 1
  // shipped declaration site and 0 shipped var() REFERENCES (confirmed
  // 2026-08-13 against the real build — Tailwind's own `.text-3xl` utility
  // inlines the literal `1.875rem` rather than emitting `var(--text-3xl)`, so
  // the declaration `--text-3xl:1.875rem;` is the only place the name appears
  // in shipped CSS), plus a live TSX consumer outside cssDir
  // (`src/app/[locale]/page.tsx`'s `fz={{ base: 'var(--text-3xl)', … }}`) so
  // Arm B actually fires when the declaration disappears. `--overlay-foreground`
  // is NOT a valid substitute after this task: it now has live CSS Module
  // var() consumers (`LightboxView.module.css` and siblings, §3.4 of the
  // kickoff) as well as the migrated inline-style consumers, so its shipped
  // reference count is no longer 0 — it would fail this plant's own
  // pre-plant census, the same self-immunization P1/P2/P3 all guard against.
  // Remove ONLY the one shipped declaration. globals.css is left untouched: the
  // token stays owned via its single @theme declaration there, which is what
  // lets Arm B evaluate it at all (removing it from globals.css would un-own it
  // — the same self-immunization P1/P2 avoid).
  //
  // OVER-MATCH GUARD (Task 695 review, F1). The re-point to --text-3xl retired
  // the previous named-sibling guard: it compared the declaration-site count of
  // `--text-3xl--line-height` before and after, and that name is NOT emitted in
  // the shipped bundle at all (Tailwind inlines `line-height` into the utility),
  // so the comparison was 0 -> 0 unconditionally and could not have come out
  // wrong — the exact defect class this gate exists to prevent, introduced into
  // the gate's own self-test. The guard below is name-agnostic and structurally
  // always live instead: `declaredBefore` is non-empty by construction (the
  // census above proved `name` is declared in this file), and it catches ANY
  // over-match, not only the one sibling somebody thought to name.
  const name = '--text-3xl';
  const declSites = countDeclarationSites(tree.cssDir, name);
  const refCountBefore = listCssDirFiles(tree.cssDir).reduce((sum, f) =>
    sum + findVarReferences(stripComments(readFileSync(f, 'utf8'), true)).filter((r) => r.name === name).length, 0);
  if (declSites !== 1 || refCountBefore !== 0) {
    record('P3', 'FAIL', false, `pre-plant census failed — ${name} has ${declSites} declaration site(s) and ${refCountBefore} shipped var() reference(s) (expected 1 decl, 0 refs — no further lifeline unproven)`);
    return;
  }
  const declFile = findFirstDeclarationSite(tree.cssDir, name);
  const original = readFileSync(declFile, 'utf8');
  const declaredBefore = extractCssDeclaredNames(original);
  removeDeclarationLine(declFile, name);
  try {
    const declaredAfter = extractCssDeclaredNames(readFileSync(declFile, 'utf8'));
    const removedNames = [...declaredBefore].filter((n) => !declaredAfter.has(n));
    if (removedNames.length !== 1 || removedNames[0] !== name) {
      record('P3', 'FAIL', false, `plant removed ${removedNames.length} declared name(s) [${removedNames.join(', ') || 'none'}] from ${declFile} — must remove exactly one, ${name}`);
      return;
    }
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    const armAHit = result.violations.find((v) => v.name === name && v.arm === 'A');
    const armBHit = result.violations.find((v) => v.name === name && v.arm === 'B');
    const armASilent = !armAHit;
    const ok = armASilent && !!armBHit;
    record('P3', 'FAIL', ok, ok
      ? `Arm A silent (0 refs to check) + Arm B correctly reported unresolved ${name} at ${armBHit.file}:${armBHit.line}`
      : `expected Arm A silent + Arm B FAIL — got Arm A ${armAHit ? 'FAIL' : 'silent'}, Arm B ${armBHit ? 'FAIL' : 'silent'}`);
  } finally {
    writeFileSync(declFile, original, 'utf8');
  }
}

function runPlantP4(tree) {
  // P4 (dynamic, R6) — insert `var(--space-${n})` into a TSX copy. `--space-`
  // IS a prefix of owned names (--space-0, --space-1, …), so the site is
  // in-class and must fail. (Draft 2's plant used `var(--${x})`, a shape that
  // occurs nowhere in this repo — §0.3 E1.)
  const fixturePath = join(tree.srcDir, '__task700_verify_gate_fixture_p4.tsx');
  const original = existsSync(fixturePath) ? readFileSync(fixturePath, 'utf8') : null;
  writeFileSync(fixturePath, `const style = { padding: \`var(--space-\${n})\` }\n`, 'utf8');
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    const hit = result.inClassDynamicSites.find((s) => s.prefix === 'space-');
    record('P4', 'FAIL', !!hit, hit
      ? `in-class dynamic site correctly reported: ${hit.file}:${hit.line} prefix "--${hit.prefix}"`
      : 'planted var(--space-${n}) was NOT reported as an in-class dynamic site');
  } finally {
    if (original === null) unlinkSync(fixturePath); else writeFileSync(fixturePath, original, 'utf8');
  }
}

function runControlC1(tree) {
  // C1 — a fallback-bearing reference must not block (R10). No real owned
  // fallback reference exists in the current tree (measured 2026-08-10), so a
  // dedicated fixture is added to the temp src copy only.
  const name = '--color-badge-reduced';
  const fixturePath = join(tree.srcDir, '__task700_verify_gate_fixture_c1.tsx');
  writeFileSync(fixturePath, `const style = { color: 'var(${name}, red)' }\n`, 'utf8');
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    const isViolation = result.violations.some((v) => v.name === name);
    const inFallbackReport = result.armB.fallbackReports.some((f) => f.name === name);
    const ok = !isViolation && inFallbackReport;
    record('C1', 'PASS', ok, ok
      ? `var(${name}, red) reported only in the non-blocking fallback list, never as a violation`
      : `expected non-blocking-only — violation=${isViolation}, in fallback report=${inFallbackReport}`);
  } finally {
    unlinkSync(fixturePath);
  }
}

function runControlC2(tree) {
  // C2 — an unowned Mantine runtime name must not be reported at all (R3/§3.3).
  const name = '--app-shell-navbar-width';
  touchCssDir(tree.cssDir);
  const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
  const ownedIncludes = result.ownedSet.has(name);
  const inAnyReport =
    result.violations.some((v) => v.name === name) ||
    result.armA.fallbackReports.some((f) => f.name === name) ||
    result.armB.fallbackReports.some((f) => f.name === name);
  const ok = !ownedIncludes && !inAnyReport;
  record('C2', 'PASS', ok, ok
    ? `${name} is not owned and appears in no report`
    : `${name} owned=${ownedIncludes}, appeared in a report=${inAnyReport}`);
}

function runControlC3(tree) {
  // C3 — a token named only inside a comment must not be reported (R4). Both
  // halves, per the kickoff (§10.7): --spacing-N (globals.css block comment)
  // and --button-hover (theme.ts // line comment). Neither plant nor mutation
  // needed — this asserts against the REAL comment text already in the temp
  // copy, proving the tokenizer strips both forms correctly.
  const globalsRaw = readFileSync(tree.globalsPath, 'utf8');
  const ownedSet = extractOwnedNames(globalsRaw);
  // 259 -> 257 (Task 695): --color-overlay and --color-overlay-foreground no
  // longer exist anywhere in globals.css. 257 -> 256 (Task 749): the now-unused
  // --breakpoint-notification-compact token was removed. Keep this control tied
  // to the current real tree; the unit test asserts the same measured count.
  const blockOk = ownedSet.size === 256 && !ownedSet.has('--spacing-N');

  const themePath = join(tree.srcDir, 'design-system/mantine/theme.ts');
  let lineOk = true;
  let lineDetail = 'theme.ts fixture not present — skipped';
  if (existsSync(themePath)) {
    const raw = readFileSync(themePath, 'utf8');
    const stripped = stripComments(raw, false);
    const strippedLines = stripped.split('\n');
    const rawLines = raw.split('\n');
    let targetIdx = rawLines.findIndex((l) => l.includes('var(--button-hover') && l.trimStart().startsWith('//'));
    if (targetIdx === -1) {
      targetIdx = rawLines.findIndex((l) => l.includes('--button-hover') && l.trimStart().startsWith('//'));
    }
    if (targetIdx === -1) {
      lineOk = false;
      lineDetail = '--button-hover // line-comment fixture line not found in theme.ts (real-file assumption moved — see report)';
    } else {
      const survived = /--button-hover/.test(strippedLines[targetIdx]);
      lineOk = !survived;
      lineDetail = survived
        ? `line comment at theme.ts:${targetIdx + 1} was NOT stripped — --button-hover text survived`
        : `line comment at theme.ts:${targetIdx + 1} correctly stripped`;
    }
  }
  const ok = blockOk && lineOk;
  record('C3', 'PASS', ok,
    `block: owned=${ownedSet.size} (expect 256), --spacing-N excluded=${!ownedSet.has('--spacing-N')} | line: ${lineDetail}`);
}

function runControlC4(tree) {
  // C4 — an out-of-class dynamic site (var(--mantine-color-${c}-5)) must not
  // be reported (R6). Asserts against the real 8 measured sites, unmodified.
  touchCssDir(tree.cssDir);
  const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
  const mantineSites = result.armB.dynamicSites.filter((s) => s.prefix === 'mantine-color-');
  const ok = mantineSites.length >= 1 && mantineSites.every((s) => !s.inClass);
  record('C4', 'PASS', ok,
    `${mantineSites.length} "--mantine-color-" dynamic site(s) found, all out-of-class=${mantineSites.every((s) => !s.inClass)}`);
}

function verifyGate() {
  console.log('🔬 check:css-vars self-test (--verify-gate) — 4 plants FAIL, 4 controls PASS\n');
  const tree = setupTempTree();
  try {
    // Baseline: the unmodified temp copy must itself be clean (0 violations).
    touchCssDir(tree.cssDir);
    const baseline = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir });
    if (baseline.fatal || baseline.violations.length > 0 || baseline.inClassDynamicSites.length > 0) {
      console.error(`❌  baseline (unmodified temp copy) is not clean: ${baseline.fatal ?? `${baseline.violations.length} violation(s), ${baseline.inClassDynamicSites.length} in-class dynamic site(s)`}`);
      process.exitCode = 1;
      return;
    }
    console.log(`✅  baseline (unmodified temp copy): 0 violations, 0 in-class dynamic sites (owned=${baseline.ownedSet.size}, Arm A refs=${baseline.armA.referencedOwnedNames.size}, Arm B refs=${baseline.armB.referencedOwnedNames.size})\n`);

    runPlantP1(tree);
    runPlantP2(tree);
    runPlantP3(tree);
    runPlantP4(tree);
    runControlC1(tree);
    runControlC2(tree);
    runControlC3(tree);
    runControlC4(tree);

    console.log('');
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error(`❌  ${failed.length}/${results.length} verify-gate assertion(s) did not behave as expected.`);
      process.exitCode = 1;
    } else {
      console.log(`✅  ${results.length}/${results.length} verify-gate assertions behaved as expected (4 plants FAILED, 4 controls PASSED).`);
      process.exitCode = 0;
    }
  } finally {
    teardownTempTree(tree.base);
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (VERIFY_GATE) verifyGate();
  else run();
}
