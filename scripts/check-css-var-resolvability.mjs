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
 * Input seam (R11, kickoff §0.2 D4): `--css-dir` / `--globals-path` / `--src-dir` / `--snapshot-path`
 * (the last added by Task 743, same seam shape). Every `--verify-gate` plant and control runs
 * against a `mkdtempSync` copy driven through all four flags — the real tree is never written to.
 *
 * OWNERSHIP SNAPSHOT (Task 743, Sprint 75 — 700 F1 / kickoff §3.1). `extractOwnedNames` above is
 * computed LIVE from globals.css on every run — which means DELETING a declaration un-owns the name
 * and every reference to it in the same motion, and the two arms above report "0 violations" even
 * though a live reference is now dangling. Reproduced twice: `--color-overlay-foreground` (Task 700's
 * own review) and `--motion-duration-slow` (Task 765, a sibling-preserved deletion with a static
 * `.css` consumer). `scripts/css-var-ownership-snapshot.json` — a committed `{version, names}` record,
 * written only by `--update-snapshot` — is the second, deliberately-stale signal this blind spot
 * needs: comparing the live owned set against it (drift, R3) makes a SHRINK observable, and checking
 * every fallback-less reference to a name that fell out of the live set (dropped-name, R2) turns that
 * shrink into a named failure. See `docs/design-system.md` §23.9 for the full contract, the writer's
 * refusal rule, and the update workflow.
 *
 * Usage:
 *   node scripts/check-css-var-resolvability.mjs                    Assert the real tree.
 *   node scripts/check-css-var-resolvability.mjs --verify-gate       Self-test (temp copies only).
 *   node scripts/check-css-var-resolvability.mjs --update-snapshot   Write the ownership snapshot.
 *   node scripts/check-css-var-resolvability.mjs --css-dir <dir> --globals-path <file> --src-dir <dir> --snapshot-path <file>
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
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────
function getFlag(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] !== undefined) return process.argv[idx + 1];
  return def;
}
const VERIFY_GATE = process.argv.includes('--verify-gate');
const UPDATE_SNAPSHOT = process.argv.includes('--update-snapshot');
const CSS_DIR = resolve(process.cwd(), getFlag('css-dir', resolve(ROOT, '.next/static/css')));
const GLOBALS_PATH = resolve(process.cwd(), getFlag('globals-path', resolve(ROOT, 'src/app/globals.css')));
const SRC_DIR = resolve(process.cwd(), getFlag('src-dir', resolve(ROOT, 'src')));
const SNAPSHOT_PATH = resolve(process.cwd(), getFlag('snapshot-path', resolve(ROOT, 'scripts/css-var-ownership-snapshot.json')));

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
// § Ownership snapshot (Task 743) — a committed record of what "owned" was the
// last time a human deliberately ran `--update-snapshot`. `extractOwnedNames`
// (above) is computed LIVE from globals.css on every run, which is exactly
// the mechanism that makes a DELETED-but-still-referenced token invisible
// (700 F1 / kickoff §3.1): deleting a declaration un-owns the name and every
// reference to it in the same motion, so the live-only gate reports "0
// violations". The snapshot is the second, deliberately-stale signal that
// makes a live-set SHRINK observable as drift, without reopening the ~112
// Mantine runtime false positives (§3.2) — those names were never owned and
// are never in the snapshot either.
// ═══════════════════════════════════════════════════════════════════════════
const SNAPSHOT_VERSION = 1;
const SNAPSHOT_NAME_RE = /^--[\w-]+$/;

// Parses raw snapshot JSON TEXT (no filesystem access — the seam unit tests
// exercise directly for the valid/malformed cases, R7).
export function parseSnapshotContent(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, kind: 'malformed', reason: `invalid JSON — ${e.message}` };
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, kind: 'malformed', reason: 'expected a JSON object { "version": 1, "names": [...] }' };
  }
  if (json.version !== SNAPSHOT_VERSION) {
    return { ok: false, kind: 'malformed', reason: `expected "version": ${SNAPSHOT_VERSION}, found ${JSON.stringify(json.version)}` };
  }
  if (!Array.isArray(json.names)) {
    return { ok: false, kind: 'malformed', reason: '"names" must be an array of strings' };
  }
  const names = new Set();
  for (const n of json.names) {
    if (typeof n !== 'string' || !SNAPSHOT_NAME_RE.test(n)) {
      return { ok: false, kind: 'malformed', reason: `"names" contains a non-custom-property entry: ${JSON.stringify(n)}` };
    }
    names.add(n);
  }
  return { ok: true, names };
}

// Reads and parses the snapshot at `snapshotPath`. A MISSING file and a
// present-but-unparsable file are distinguished (`kind`) because the two
// callers treat them differently: the default scan (R1) treats both as
// fatal; the writer (R4) treats "missing" as the empty starting snapshot
// (first-run bootstrap, §13's own required flow) but still refuses to
// silently overwrite a present, corrupt file.
export function loadSnapshot(snapshotPath) {
  if (!existsSync(snapshotPath)) {
    return { ok: false, kind: 'missing', reason: `snapshot not found at ${snapshotPath}` };
  }
  const raw = readFileSync(snapshotPath, 'utf8');
  return parseSnapshotContent(raw);
}

// Canonical on-disk form (R1/§10.4): UTF-8 no BOM (writeFileSync's default
// 'utf8' encoding never emits one), LF (JSON.stringify never emits \r),
// 2-space indent, trailing newline, names sorted with localeCompare.
export function serializeSnapshot(namesIterable) {
  const names = [...namesIterable].sort((a, b) => a.localeCompare(b));
  return `${JSON.stringify({ version: SNAPSHOT_VERSION, names }, null, 2)}\n`;
}

export function writeSnapshotFile(snapshotPath, namesIterable) {
  writeFileSync(snapshotPath, serializeSnapshot(namesIterable), 'utf8');
}

// Drift (R3): the live-computed owned set vs. the committed snapshot, as pure
// sets — independent of whether either side is ever referenced. `added` is
// only meaningful as "run --update-snapshot"; `dropped` is the set R2's
// dropped-name check evaluates for live fallback-less references.
export function computeDrift(ownedSet, snapshotNames) {
  const added = [...ownedSet].filter((n) => !snapshotNames.has(n)).sort((a, b) => a.localeCompare(b));
  const dropped = [...snapshotNames].filter((n) => !ownedSet.has(n)).sort((a, b) => a.localeCompare(b));
  return { added, dropped };
}

// Dropped-name references (R2): given a flat list of every var() reference
// found on one arm (owned or not — this deliberately does NOT filter through
// ownedSet, because a dropped name is by definition no longer owned) and the
// current dropped-name set, split into blocking (fallback-less) and
// non-blocking (fallback-bearing, folded into the existing R10 report).
export function findDroppedNameRefs(allRefs, droppedNames, armLabel) {
  const violations = [];
  const fallbackReports = [];
  for (const ref of allRefs) {
    if (!droppedNames.has(ref.name)) continue;
    if (ref.hasFallback) {
      fallbackReports.push({ arm: armLabel, file: ref.file, line: ref.line, name: ref.name });
    } else {
      violations.push({ arm: armLabel, file: ref.file, line: ref.line, name: ref.name });
    }
  }
  return { violations, fallbackReports };
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
  const allRefs = []; // every literal var() ref found on this arm, owned or not (R2 needs the unowned/dropped ones too)
  for (const f of files) {
    const stripped = stripComments(rawByFile.get(f), true);
    const refs = findVarReferences(stripped);
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    for (const r of refs) allRefs.push({ ...r, file: rel });
    const { violations: v, fallbackReports: fb, resolvedOwnedNames } =
      classifyReferences(refs, ownedSet, declaredSet, propertySet, 'A', rel);
    violations.push(...v);
    fallbackReports.push(...fb);
    for (const n of resolvedOwnedNames) referencedOwnedNames.add(n);
  }
  return { violations, fallbackReports, referencedOwnedNames, declaredSet, propertySet, allRefs };
}

function scanArmB(srcDir, globalsPath, ownedSet, declaredSet, propertySet) {
  const files = getArmBFiles(srcDir, globalsPath);
  const violations = [];
  const fallbackReports = [];
  const referencedOwnedNames = new Set();
  const dynamicSites = [];
  const allRefs = []; // same purpose as scanArmA's allRefs, see comment there
  for (const f of files) {
    const isCss = f.endsWith('.css');
    const raw = readFileSync(f, 'utf8');
    const stripped = stripComments(raw, isCss);
    const rel = relative(ROOT, f).replace(/\\/g, '/');

    const refs = findVarReferences(stripped);
    for (const r of refs) allRefs.push({ ...r, file: rel });
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
  return { violations, fallbackReports, referencedOwnedNames, dynamicSites, allRefs };
}

function runScan({ cssDir, globalsPath, srcDir, snapshotPath }) {
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

  const snapshotResult = loadSnapshot(snapshotPath);
  if (!snapshotResult.ok) {
    return { fatal: `ownership snapshot ${snapshotResult.kind} at ${snapshotPath} — ${snapshotResult.reason} (run "npm run check:css-vars:update-snapshot", R1)` };
  }
  const snapshotNames = snapshotResult.names;

  const armA = scanArmA(cssDir, ownedSet);
  const armB = scanArmB(srcDir, globalsPath, ownedSet, armA.declaredSet, armA.propertySet);

  const inClassDynamicSites = armB.dynamicSites.filter((s) => s.inClass);

  const drift = computeDrift(ownedSet, snapshotNames);
  const droppedNames = new Set(drift.dropped);
  const droppedA = findDroppedNameRefs(armA.allRefs, droppedNames, 'A');
  const droppedB = findDroppedNameRefs(armB.allRefs, droppedNames, 'B');
  const dropped = {
    violations: [...droppedA.violations, ...droppedB.violations],
    fallbackReports: [...droppedA.fallbackReports, ...droppedB.fallbackReports],
  };

  return {
    ownedSet,
    armA,
    armB,
    inClassDynamicSites,
    violations: [...armA.violations, ...armB.violations],
    snapshotPath,
    snapshotNames,
    drift,
    dropped,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// § Report + main run
// ═══════════════════════════════════════════════════════════════════════════
// R6 — printed on every run, meaning every call site that can reach a
// terminal state with the scan/writer having attempted to load the snapshot:
// `run()` (default scan); `updateSnapshot()`'s success, refusal, and
// fatal-after-load paths (the three early fatals in performUpdateSnapshot —
// missing globals.css, 0 owned names, stale build — occur BEFORE any
// snapshot load is attempted, so there is nothing yet to print there); and
// once in `verifyGate()`, immediately after the baseline line (Task 743
// Rev 1, F2 — the original comment here claimed the writer and verify-gate
// already called this function; neither did, which is exactly the defect).
// Prints the snapshot's own identity, plus the three known blind spots this
// ownership snapshot still cannot see. None of the three is a new check;
// they are the honest boundary of R2/R3, stated so a reader never mistakes
// "0 drift, 0 dropped" for "nothing can go missing here".
function printSnapshotScope(snapshotPath, snapshotNames) {
  const sizeText = snapshotNames ? `${snapshotNames.size} name(s)` : 'unavailable (see error above)';
  console.log(`    Ownership snapshot: version ${SNAPSHOT_VERSION}, ${sizeText} (${relative(ROOT, snapshotPath) || snapshotPath})`);
  console.log('    Blind spots (R6): a name deleted from globals.css BEFORE the snapshot\'s first commit is invisible to drift — the snapshot only remembers what it was told to; a dynamically-built var(--prefix${…}) construction site is covered only by the existing prefix rule (R6/§3.4), unchanged by this task; a reference living outside src/**/*.{css,tsx,ts} (Arm B\'s own glob) is never scanned by either arm.');
}

function printReport(result) {
  const { ownedSet, armA, armB, inClassDynamicSites, violations, snapshotPath, snapshotNames, drift, dropped } = result;
  console.log(`🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): ${ownedSet.size}`);
  console.log(`    Arm A (shipped CSS) — owned names referenced: ${armA.referencedOwnedNames.size}`);
  console.log(`    Arm B (src/**/*.{css,tsx,ts}, excl. globals.css) — owned names referenced: ${armB.referencedOwnedNames.size}`);
  console.log(`    Dynamic var() construction sites: ${armB.dynamicSites.length} raw, ${inClassDynamicSites.length} in-class (prefix could name an owned token)`);
  printSnapshotScope(snapshotPath, snapshotNames);
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

  if (dropped.violations.length > 0) {
    console.log(`❌  ${dropped.violations.length} dropped-name var() reference(s) — name left globals.css but a reference still reads it (R2):`);
    for (const d of dropped.violations) {
      console.log(`    Arm ${d.arm}  ${d.file}:${d.line}  var(${d.name}) — dropped from ownership, no fallback`);
    }
    console.log('');
  }

  if (drift.added.length > 0 || drift.dropped.length > 0) {
    console.log(`❌  Ownership snapshot drift (R3) — owned set does not match ${relative(ROOT, snapshotPath) || snapshotPath}:`);
    if (drift.added.length > 0) console.log(`    added (${drift.added.length}): ${drift.added.join(', ')}`);
    if (drift.dropped.length > 0) console.log(`    dropped (${drift.dropped.length}): ${drift.dropped.join(', ')}`);
    console.log('    remedy: npm run check:css-vars:update-snapshot (refuses if any dropped name above is still referenced without a fallback)');
    console.log('');
  }

  const allFallback = [...armA.fallbackReports, ...armB.fallbackReports, ...dropped.fallbackReports];
  console.log(`ℹ️   ${allFallback.length} fallback-bearing owned/dropped reference(s) — non-blocking (R10):`);
  if (allFallback.length > 0) {
    for (const f of allFallback) console.log(`    Arm ${f.arm}  ${f.file}:${f.line}  var(${f.name}, …)`);
  }
  console.log('');
}

function run() {
  const result = runScan({ cssDir: CSS_DIR, globalsPath: GLOBALS_PATH, srcDir: SRC_DIR, snapshotPath: SNAPSHOT_PATH });
  if (result.fatal) {
    console.error(`❌  check:css-vars — ${result.fatal}`);
    process.exit(1);
  }
  printReport(result);
  const blocking = result.violations.length + result.inClassDynamicSites.length
    + result.dropped.violations.length + result.drift.added.length + result.drift.dropped.length;
  if (blocking > 0) {
    console.error(`❌  check:css-vars — ${blocking} blocking finding(s). Baseline is 0.`);
    process.exit(1);
  }
  console.log('✅  check:css-vars — 0 violations, 0 in-class dynamic sites, 0 dropped-name references, 0 snapshot drift.');
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § --update-snapshot (R4) — writes scripts/css-var-ownership-snapshot.json
// to the CURRENT live-computed owned set. Refuses (no write, exit 1) while
// any name the snapshot is about to drop still has a fallback-less var()
// reference in Arm A or Arm B — the exact condition R2's dropped-name check
// blocks on, checked here BEFORE the write so the snapshot can never move
// past a reference it would immediately make invisible.
// ═══════════════════════════════════════════════════════════════════════════
export function performUpdateSnapshot({ cssDir, globalsPath, srcDir, snapshotPath }) {
  if (!existsSync(globalsPath)) {
    return { refused: true, fatal: `globals.css not found at ${globalsPath}` };
  }
  const globalsRaw = readFileSync(globalsPath, 'utf8');
  const ownedSet = extractOwnedNames(globalsRaw);
  if (ownedSet.size === 0) {
    return { refused: true, fatal: `0 owned custom properties parsed from ${relative(ROOT, globalsPath) || globalsPath} — parse failure, not a vacuous pass (R3)` };
  }
  const freshness = checkFreshness(cssDir, globalsPath, srcDir);
  if (!freshness.fresh) {
    return { refused: true, fatal: freshness.reason };
  }

  // Missing snapshot bootstraps as empty (first-run flow, §13 implementation
  // order) — an empty prior snapshot can never have a "dropped" name, so the
  // very first write always proceeds straight to the refusal check below. A
  // PRESENT but malformed snapshot is still fatal: silently overwriting
  // corrupt state defeats the point of a committed, reviewable file.
  const loaded = loadSnapshot(snapshotPath);
  let snapshotNames;
  if (loaded.ok) {
    snapshotNames = loaded.names;
  } else if (loaded.kind === 'missing') {
    snapshotNames = new Set();
  } else {
    // "fatal-after-load" (Rev 1, F2): the load was attempted, but the
    // present file is corrupt — distinct from the two early fatals above,
    // which never got as far as attempting a load at all. `snapshotPath` is
    // still returned so the caller can print the scope line with an
    // "unavailable" size rather than silently skipping it.
    return { refused: true, fatal: `ownership snapshot malformed at ${snapshotPath} — ${loaded.reason}`, snapshotPath };
  }

  const armA = scanArmA(cssDir, ownedSet);
  const armB = scanArmB(srcDir, globalsPath, ownedSet, armA.declaredSet, armA.propertySet);
  const drift = computeDrift(ownedSet, snapshotNames);
  const droppedNames = new Set(drift.dropped);
  const droppedA = findDroppedNameRefs(armA.allRefs, droppedNames, 'A');
  const droppedB = findDroppedNameRefs(armB.allRefs, droppedNames, 'B');
  const droppedViolations = [...droppedA.violations, ...droppedB.violations];

  if (droppedViolations.length > 0) {
    // Refused: print the PRIOR (still-current, since nothing was written)
    // snapshot's own size — not the live owned set, which is what the
    // refusal is preventing from being written.
    return { refused: true, droppedViolations, drift, ownedSet, snapshotPath, snapshotNames };
  }

  writeSnapshotFile(snapshotPath, ownedSet);
  return { refused: false, written: true, drift, ownedSet, snapshotPath };
}

function updateSnapshot() {
  const result = performUpdateSnapshot({ cssDir: CSS_DIR, globalsPath: GLOBALS_PATH, srcDir: SRC_DIR, snapshotPath: SNAPSHOT_PATH });
  if (result.fatal) {
    console.error(`❌  check:css-vars:update-snapshot — ${result.fatal}`);
    if (result.snapshotPath) printSnapshotScope(result.snapshotPath, null);
    process.exit(1);
  }
  if (result.refused) {
    console.error(`❌  check:css-vars:update-snapshot — refused: ${result.droppedViolations.length} dropped name(s) still referenced without a fallback:`);
    for (const d of result.droppedViolations) {
      console.error(`    Arm ${d.arm}  ${d.file}:${d.line}  var(${d.name})`);
    }
    console.error(`    ${relative(ROOT, SNAPSHOT_PATH) || SNAPSHOT_PATH} left byte-unchanged. Remove or fallback-guard the reference(s) above, then retry.`);
    printSnapshotScope(result.snapshotPath, result.snapshotNames);
    process.exit(1);
  }
  printSnapshotScope(result.snapshotPath, result.ownedSet);
  console.log(`✅  check:css-vars:update-snapshot — wrote ${result.ownedSet.size} name(s) to ${relative(ROOT, SNAPSHOT_PATH) || SNAPSHOT_PATH} (version ${SNAPSHOT_VERSION}).`);
  console.log(`    added: ${result.drift.added.length ? result.drift.added.join(', ') : '(none)'}`);
  console.log(`    dropped: ${result.drift.dropped.length ? result.drift.dropped.join(', ') : '(none)'}`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § --verify-gate (R9/R11) — 7 plants shown FAILING, 6 controls shown PASSING
// (Task 743 added P5-P7/C5-C6 to the original 4/4), all against mkdtempSync
// copies driven through --css-dir/--globals-path/--src-dir/--snapshot-path.
// No plant ever writes to the real tree.
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
  // The snapshot copy lives at the temp base, outside srcDir — it is not a
  // `.css`/`.tsx`/`.ts` file so Arm B would never scan it anyway, but keeping
  // it structurally separate from src/ matches cssDir's own placement and
  // avoids any accidental future glob overlap. Copied from the REAL committed
  // snapshot so P1-P4/C1-C4 (none of which touch globals.css) see 0 drift —
  // their assertions are about Arm A/B resolvability, not ownership drift.
  const snapshotPath = join(base, 'css-var-ownership-snapshot.json');
  cpSync(resolve(ROOT, 'scripts/css-var-ownership-snapshot.json'), snapshotPath);
  return { base, cssDir, globalsPath, srcDir, snapshotPath };
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

// Appends a brand-new top-level :root block to globals.css (P7) — never
// touches an existing block, so it cannot accidentally remove or shadow a
// real declaration; `extractOwnedNames` finds every top-level :root
// occurrence (findAllBlocks, 'g' flag), so a second one at EOF is owned same
// as the first.
function appendRootDeclaration(filePath, name, value) {
  const raw = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, `${raw}\n:root {\n  ${name}: ${value};\n}\n`, 'utf8');
}

// How many times NAME is declared anywhere in globals.css raw content — used
// only to pick a C6 candidate that is unambiguous (exactly one declaration
// site in the WHOLE file, .dark block included), so removeDeclarationLine's
// single regex match is guaranteed to be the real, ownership-conferring one.
function countAllDeclarationOccurrences(rawContent, name) {
  const stripped = stripComments(rawContent, true);
  const re = /(?:^|[{;])\s*(--[\w-]+)\s*:/g;
  let m;
  let count = 0;
  while ((m = re.exec(stripped)) !== null) if (m[1] === name) count++;
  return count;
}

// C6 (§13 implementation order — "chosen at runtime from the owned set,
// printed"): finds the alphabetically-first owned name that (a) is declared
// exactly once in the whole globals.css copy, so its removal is unambiguous,
// and (b) has ZERO var() references anywhere across the already-scanned
// baseline Arm A + Arm B ref lists — so deleting it drifts the snapshot
// without ever tripping the dropped-name (R2) check, isolating the drift
// assertion C6 exists to make.
function findZeroReferenceOwnedName(ownedSet, globalsRaw, baselineArmA, baselineArmB) {
  const referenced = new Set([...baselineArmA.allRefs, ...baselineArmB.allRefs].map((r) => r.name));
  const candidates = [...ownedSet]
    .filter((n) => !referenced.has(n) && countAllDeclarationOccurrences(globalsRaw, n) === 1)
    .sort((a, b) => a.localeCompare(b));
  return candidates[0] ?? null;
}

// git hash-object computes the same content hash git would assign this file
// as a blob, without requiring it to be tracked — used by C5 to prove the
// refused writer left the temp snapshot byte-for-byte unchanged.
function gitHashObject(filePath) {
  return execFileSync('git', ['hash-object', filePath], { cwd: ROOT, encoding: 'utf8' }).trim();
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
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
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
  // untouched (same ownership-preservation reasoning as P1). Re-targeted
  // TWICE by Task 743 (2026-09-16). First attempt, --color-badge-premium: no
  // longer has ANY shipped declaration or reference — it now only exists as
  // an alias inside globals.css itself, never emitted to the bundle. Second
  // attempt, --badge-premium (12 shipped refs, looked clean by presence
  // alone): its ONE shipped declaration FILE actually contains the literal
  // text `--badge-premium:` **twice** (measured — a duplicate emission this
  // gate's own `countDeclarationSites`/`extractCssDeclaredNames` cannot see,
  // since both check Set membership, not occurrence count), so
  // `removeDeclarationLine`'s single-match regex left the second declaration
  // standing and the plant silently failed to reproduce. --color-input is
  // the current target: exactly ONE literal `--color-input:` occurrence in
  // the whole shipped CSS (its declaration file), consumed by
  // `.mantine-Switch-track{background-color:var(--color-input)}` in a
  // separate shipped file — genuinely single-declaration, genuinely
  // referenced.
  const name = '--color-input';
  const declSites = countDeclarationSites(tree.cssDir, name);
  const refFileBefore = listCssDirFiles(tree.cssDir).find((f) =>
    findVarReferences(stripComments(readFileSync(f, 'utf8'), true)).some((r) => r.name === name));
  if (declSites !== 1 || !refFileBefore) {
    record('P2', 'FAIL', false, `pre-plant census failed — ${name} has ${declSites} declaration site(s), ref file ${refFileBefore ?? 'none'} (no further lifeline unproven)`);
    return;
  }
  const declFile = findFirstDeclarationSite(tree.cssDir, name);
  // Literal-occurrence guard (Task 743, added after the --badge-premium
  // near-miss above): declSites===1 only proves ONE FILE contains the name,
  // not that the name is declared exactly once WITHIN that file —
  // removeDeclarationLine's regex removes only the first match, so a second
  // occurrence in the same file would silently survive and this plant would
  // not reproduce.
  const occurrencesInDeclFile = countAllDeclarationOccurrences(readFileSync(declFile, 'utf8'), name);
  if (occurrencesInDeclFile !== 1) {
    record('P2', 'FAIL', false, `pre-plant census failed — ${name} occurs ${occurrencesInDeclFile} time(s) in its own declaration file ${declFile} (expected exactly 1 — no further lifeline unproven)`);
    return;
  }
  const original = readFileSync(declFile, 'utf8');
  removeDeclarationLine(declFile, name);
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const hit = result.violations?.find((v) => v.name === name && v.arm === 'A');
    record('P2', 'FAIL', !!hit, hit
      ? `Arm A correctly reported unresolved ${name} at ${hit.file}:${hit.line} after its declaration was deleted`
      : `Arm A did NOT report ${name} after its shipped declaration was deleted — plant did not reproduce`);
  } finally {
    writeFileSync(declFile, original, 'utf8');
  }
}

function runPlantP3(tree) {
  // P3 (Arm B) — --homepage-runtime-search-max-width. Re-targeted by Task 743
  // (2026-09-16): the previous target, --text-3xl, no longer has ANY shipped
  // declaration site — measured this session, Tailwind now inlines
  // `.text-3xl{font-size:1.875rem}` directly rather than emitting
  // `--text-3xl:1.875rem` at all, so the plant's own pre-plant census started
  // failing (0 decl sites, not the required 1) independent of anything this
  // task changes. The replacement has the same required shape: exactly 1
  // shipped declaration site (globals.css:362, `@theme inline`), 0 shipped
  // var() REFERENCES, and a live TSX consumer outside cssDir
  // (`src/components/shared/HeroSearchView.tsx:51`'s
  // `maw="var(--homepage-runtime-search-max-width)"`) so Arm B actually fires
  // when the declaration disappears. Remove ONLY the one shipped declaration.
  // globals.css is left untouched: the token stays owned via its single
  // `@theme inline` declaration there, which is what lets Arm B evaluate it at
  // all (removing it from globals.css would un-own it — the same
  // self-immunization P1/P2 avoid).
  //
  // OVER-MATCH GUARD (Task 695 review, F1, preserved verbatim across the
  // re-target). The guard is name-agnostic and structurally always live:
  // `declaredBefore` is non-empty by construction (the census above proved
  // `name` is declared in this file), and it catches ANY over-match, not only
  // one sibling somebody thought to name.
  const name = '--homepage-runtime-search-max-width';
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
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
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
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
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
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
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
  const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
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
  // Task 743 Rev 1 (F1): no hardcoded owned-count literal — Revision 0's
  // `=== 297` already went stale twice (256/257 -> 297) and broke this exact
  // control the moment an unrelated task added a token to globals.css. The
  // temp snapshot copy (a copy of the real committed
  // scripts/css-var-ownership-snapshot.json, unmodified by any earlier
  // plant/control in this run) is the source of truth: compare set size AND
  // membership against it.
  const snapshotLoaded = loadSnapshot(tree.snapshotPath);
  let blockOk = false;
  let snapshotDetail;
  if (!snapshotLoaded.ok) {
    snapshotDetail = `snapshot failed to load (${snapshotLoaded.kind}: ${snapshotLoaded.reason})`;
  } else {
    const snapshotNames = snapshotLoaded.names;
    const added = [...ownedSet].filter((n) => !snapshotNames.has(n));
    const dropped = [...snapshotNames].filter((n) => !ownedSet.has(n));
    blockOk = added.length === 0 && dropped.length === 0 && !ownedSet.has('--spacing-N');
    snapshotDetail = `owned=${ownedSet.size} snapshot=${snapshotNames.size} added=${JSON.stringify(added)} dropped=${JSON.stringify(dropped)}`;
  }

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
    `block: ${snapshotDetail}, --spacing-N excluded=${!ownedSet.has('--spacing-N')} | line: ${lineDetail}`);
}

function runControlC4(tree) {
  // C4 — an out-of-class dynamic site (var(--mantine-color-${c}-5)) must not
  // be reported (R6). Asserts against the real 8 measured sites, unmodified.
  touchCssDir(tree.cssDir);
  const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
  const mantineSites = result.armB.dynamicSites.filter((s) => s.prefix === 'mantine-color-');
  const ok = mantineSites.length >= 1 && mantineSites.every((s) => !s.inClass);
  record('C4', 'PASS', ok,
    `${mantineSites.length} "--mantine-color-" dynamic site(s) found, all out-of-class=${mantineSites.every((s) => !s.inClass)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// § Task 743 additions — R5: 3 new plants (P5-P7), 2 new controls (C5-C6),
// all against the same mkdtempSync copy P1-P4/C1-C4 already run against. Only
// P5/P6/P7/C5/C6 ever touch tree.globalsPath or tree.snapshotPath; every
// mutation is restored in its own `finally` before the next assertion runs.
// ═══════════════════════════════════════════════════════════════════════════

function runPlantP5(tree) {
  // P5 — the exact 765 reproduction (kickoff §3.1): delete
  // --motion-duration-slow's single :root declaration from globals.css while
  // AppImage.module.css's two live `var(--motion-duration-slow)` references
  // stay untouched. Must surface as a dropped-name violation on Arm B (a
  // `.module.css` file, in Arm B's own `.css` glob — never Arm A, which only
  // scans SHIPPED bundle CSS, not source CSS Modules).
  const name = '--motion-duration-slow';
  const before = readFileSync(tree.globalsPath, 'utf8');
  if (countAllDeclarationOccurrences(before, name) !== 1) {
    record('P5', 'FAIL', false, `pre-plant census failed — ${name} has ${countAllDeclarationOccurrences(before, name)} declaration occurrence(s) in globals.css (expected 1 — no further lifeline unproven)`);
    return;
  }
  // OVER-MATCH GUARD (Task 743 Rev 1, F3 — same shape as P3's, applied to the
  // OWNED set rather than a shipped-CSS declared set: removeDeclarationLine's
  // regex has no left anchor, so a longer name ending in this one, e.g.
  // `--x--motion-duration-slow:`, would be removed instead and nothing would
  // report it).
  const ownedBefore = extractOwnedNames(before);
  removeDeclarationLine(tree.globalsPath, name);
  try {
    const ownedAfter = extractOwnedNames(readFileSync(tree.globalsPath, 'utf8'));
    const removedNames = [...ownedBefore].filter((n) => !ownedAfter.has(n));
    if (removedNames.length !== 1 || removedNames[0] !== name) {
      record('P5', 'FAIL', false, `plant removed ${removedNames.length} owned name(s) [${removedNames.join(', ') || 'none'}] from globals.css — must remove exactly one, ${name}`);
      return;
    }
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const hit = result.dropped.violations.find((v) => v.name === name && v.arm === 'B' && v.file.includes('AppImage.module.css'));
    record('P5', 'FAIL', !!hit, hit
      ? `dropped-name violation correctly reported: Arm B ${hit.file}:${hit.line} var(${name}) — CSS Module consumer`
      : `planted deletion of ${name} was NOT reported as a dropped-name violation naming AppImage.module.css (dropped.violations=${JSON.stringify(result.dropped?.violations)})`);
  } finally {
    writeFileSync(tree.globalsPath, before, 'utf8');
  }
}

function runPlantP6(tree) {
  // P6 — the TSX-consumer sibling of P5 (kickoff §3.3): delete
  // --width-page-max's single :root declaration while
  // ListingsPageFrame.tsx's `maw="var(--width-page-max)"` (×2) stays live.
  // Same dropped-name check, different arm shape: a `.tsx` file has no
  // shipped-CSS declaration to speak of at all — Arm B is the only arm that
  // could ever see either this token or its consumer.
  const name = '--width-page-max';
  const before = readFileSync(tree.globalsPath, 'utf8');
  if (countAllDeclarationOccurrences(before, name) !== 1) {
    record('P6', 'FAIL', false, `pre-plant census failed — ${name} has ${countAllDeclarationOccurrences(before, name)} declaration occurrence(s) in globals.css (expected 1 — no further lifeline unproven)`);
    return;
  }
  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the reasoning.
  const ownedBefore = extractOwnedNames(before);
  removeDeclarationLine(tree.globalsPath, name);
  try {
    const ownedAfter = extractOwnedNames(readFileSync(tree.globalsPath, 'utf8'));
    const removedNames = [...ownedBefore].filter((n) => !ownedAfter.has(n));
    if (removedNames.length !== 1 || removedNames[0] !== name) {
      record('P6', 'FAIL', false, `plant removed ${removedNames.length} owned name(s) [${removedNames.join(', ') || 'none'}] from globals.css — must remove exactly one, ${name}`);
      return;
    }
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const hit = result.dropped.violations.find((v) => v.name === name && v.arm === 'B' && v.file.includes('ListingsPageFrame.tsx'));
    record('P6', 'FAIL', !!hit, hit
      ? `dropped-name violation correctly reported: Arm B ${hit.file}:${hit.line} var(${name}) — TSX consumer`
      : `planted deletion of ${name} was NOT reported as a dropped-name violation naming ListingsPageFrame.tsx (dropped.violations=${JSON.stringify(result.dropped?.violations)})`);
  } finally {
    writeFileSync(tree.globalsPath, before, 'utf8');
  }
}

function runPlantP7(tree) {
  // P7 (R3) — add a brand-new owned name with no snapshot entry and no
  // consumer at all. Must surface as drift (added), never as a dropped-name
  // or resolvability violation — isolating the "owned set grew" half of R3
  // from the "owned set shrank" half P5/P6/C6 exercise.
  const name = '--task743-plant';
  const before = readFileSync(tree.globalsPath, 'utf8');
  appendRootDeclaration(tree.globalsPath, name, '1px');
  try {
    touchCssDir(tree.cssDir);
    const result = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const inAdded = result.drift?.added?.includes(name);
    const noOtherFindings = result.violations.length === 0 && result.inClassDynamicSites.length === 0 && result.dropped.violations.length === 0;
    const ok = !!inAdded && noOtherFindings;
    record('P7', 'FAIL', ok, ok
      ? `drift correctly reported ${name} as added, with no other blocking finding`
      : `expected ONLY drift.added to contain ${name} — got added=${JSON.stringify(result.drift?.added)}, violations=${result.violations.length}, dropped=${result.dropped.violations.length}`);
  } finally {
    writeFileSync(tree.globalsPath, before, 'utf8');
  }
}

function runControlC5(tree) {
  // C5 (R4) — the writer refuses P5's exact plant. Reuses P5's own mutation
  // (delete --motion-duration-slow, leaving AppImage.module.css's references
  // live) and calls the writer directly against the temp snapshot copy,
  // asserting BOTH the refusal AND that the temp snapshot file is left
  // byte-for-byte unchanged (git hash-object before === after).
  const name = '--motion-duration-slow';
  const before = readFileSync(tree.globalsPath, 'utf8');
  if (countAllDeclarationOccurrences(before, name) !== 1) {
    record('C5', 'PASS', false, `pre-plant census failed — ${name} has ${countAllDeclarationOccurrences(before, name)} declaration occurrence(s) in globals.css (expected 1)`);
    return;
  }
  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the reasoning.
  const ownedBefore = extractOwnedNames(before);
  removeDeclarationLine(tree.globalsPath, name);
  try {
    const ownedAfter = extractOwnedNames(readFileSync(tree.globalsPath, 'utf8'));
    const removedNames = [...ownedBefore].filter((n) => !ownedAfter.has(n));
    if (removedNames.length !== 1 || removedNames[0] !== name) {
      record('C5', 'PASS', false, `plant removed ${removedNames.length} owned name(s) [${removedNames.join(', ') || 'none'}] from globals.css — must remove exactly one, ${name}`);
      return;
    }
    touchCssDir(tree.cssDir);
    const hashBefore = gitHashObject(tree.snapshotPath);
    const result = performUpdateSnapshot({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const hashAfter = gitHashObject(tree.snapshotPath);
    const refusedCorrectly = result.refused === true && (result.droppedViolations ?? []).some((v) => v.name === name);
    const byteUnchanged = hashBefore === hashAfter;
    const ok = refusedCorrectly && byteUnchanged;
    record('C5', 'PASS', ok,
      `refused=${result.refused === true} naming ${name}=${(result.droppedViolations ?? []).some((v) => v.name === name)}; git hash-object before=${hashBefore} after=${hashAfter} unchanged=${byteUnchanged}`);
  } finally {
    writeFileSync(tree.globalsPath, before, 'utf8');
  }
}

function runControlC6(tree, baseline) {
  // C6 (R4/R3) — a dropped name with NO reference anywhere: drift blocks the
  // plain scan, then --update-snapshot succeeds (nothing referenced it, so no
  // refusal condition), then a fresh scan of the now-updated snapshot exits
  // clean. Chosen at RUNTIME from the tree's own owned set (never hardcoded),
  // using the already-computed baseline scan's Arm A/B reference lists.
  const name = findZeroReferenceOwnedName(baseline.ownedSet, readFileSync(tree.globalsPath, 'utf8'), baseline.armA, baseline.armB);
  if (!name) {
    record('C6', 'PASS', false, 'no candidate found — every owned name in the current tree is referenced at least once (cannot isolate an unreferenced-drift case)');
    return;
  }
  const before = readFileSync(tree.globalsPath, 'utf8');
  const snapshotBefore = readFileSync(tree.snapshotPath, 'utf8');
  // OVER-MATCH GUARD (Task 743 Rev 1, F3) — see P5's comment for the
  // reasoning. `findZeroReferenceOwnedName` already filters candidates to
  // exactly-one-anchored-occurrence, but that only bounds the PRE-condition;
  // this asserts what `removeDeclarationLine`'s own unanchored regex actually
  // removed.
  const ownedBefore = extractOwnedNames(before);
  removeDeclarationLine(tree.globalsPath, name);
  try {
    const ownedAfterRemoval = extractOwnedNames(readFileSync(tree.globalsPath, 'utf8'));
    const removedNames = [...ownedBefore].filter((n) => !ownedAfterRemoval.has(n));
    if (removedNames.length !== 1 || removedNames[0] !== name) {
      record('C6', 'PASS', false, `plant removed ${removedNames.length} owned name(s) [${removedNames.join(', ') || 'none'}] from globals.css — must remove exactly one, ${name}`);
      return;
    }
    touchCssDir(tree.cssDir);
    const driftScan = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const driftBlocked = driftScan.drift?.dropped?.includes(name) && driftScan.dropped.violations.length === 0;

    const writeResult = performUpdateSnapshot({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const writeSucceeded = writeResult.refused === false && writeResult.written === true;

    const finalScan = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const finalClean = !finalScan.fatal && finalScan.violations.length === 0 && finalScan.inClassDynamicSites.length === 0
      && finalScan.dropped.violations.length === 0 && finalScan.drift.added.length === 0 && finalScan.drift.dropped.length === 0;

    const ok = driftBlocked && writeSucceeded && finalClean;
    record('C6', 'PASS', ok,
      `chosen name=${name}; drift-blocked=${!!driftBlocked} (dropped=${JSON.stringify(driftScan.drift?.dropped)}); writer succeeded=${writeSucceeded}; post-update scan clean=${finalClean}`);
  } finally {
    writeFileSync(tree.globalsPath, before, 'utf8');
    writeFileSync(tree.snapshotPath, snapshotBefore, 'utf8');
  }
}

function verifyGate() {
  console.log('🔬 check:css-vars self-test (--verify-gate) — 7 plants FAIL, 6 controls PASS\n');
  const tree = setupTempTree();
  try {
    // Baseline: the unmodified temp copy must itself be clean — 0 violations,
    // 0 in-class dynamic sites, AND (Task 743) 0 dropped-name violations, 0
    // snapshot drift, since the temp snapshot is a copy of the real committed
    // one and no plant has run yet.
    touchCssDir(tree.cssDir);
    const baseline = runScan({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath: tree.snapshotPath });
    const baselineClean = !baseline.fatal && baseline.violations.length === 0 && baseline.inClassDynamicSites.length === 0
      && baseline.dropped.violations.length === 0 && baseline.drift.added.length === 0 && baseline.drift.dropped.length === 0;
    if (!baselineClean) {
      console.error(`❌  baseline (unmodified temp copy) is not clean: ${baseline.fatal ?? `${baseline.violations.length} violation(s), ${baseline.inClassDynamicSites.length} in-class dynamic site(s), ${baseline.dropped.violations.length} dropped-name violation(s), drift added=${JSON.stringify(baseline.drift.added)} dropped=${JSON.stringify(baseline.drift.dropped)}`}`);
      process.exitCode = 1;
      return;
    }
    console.log(`✅  baseline (unmodified temp copy): 0 violations, 0 in-class dynamic sites, 0 dropped-name violations, 0 snapshot drift (owned=${baseline.ownedSet.size}, snapshot=${baseline.snapshotNames.size}, Arm A refs=${baseline.armA.referencedOwnedNames.size}, Arm B refs=${baseline.armB.referencedOwnedNames.size})`);
    printSnapshotScope(tree.snapshotPath, baseline.snapshotNames);
    console.log('');

    runPlantP1(tree);
    runPlantP2(tree);
    runPlantP3(tree);
    runPlantP4(tree);
    runPlantP5(tree);
    runPlantP6(tree);
    runPlantP7(tree);
    runControlC1(tree);
    runControlC2(tree);
    runControlC3(tree);
    runControlC4(tree);
    runControlC5(tree);
    runControlC6(tree, baseline);

    console.log('');
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error(`❌  ${failed.length}/${results.length} verify-gate assertion(s) did not behave as expected.`);
      process.exitCode = 1;
    } else {
      console.log(`✅  ${results.length}/${results.length} verify-gate assertions behaved as expected (7 plants FAILED, 6 controls PASSED).`);
      process.exitCode = 0;
    }
  } finally {
    teardownTempTree(tree.base);
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (VERIFY_GATE) verifyGate();
  else if (UPDATE_SNAPSHOT) updateSnapshot();
  else run();
}
