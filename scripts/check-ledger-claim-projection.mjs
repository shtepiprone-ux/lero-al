#!/usr/bin/env node
/**
 * check-ledger-claim-projection.mjs — projects a review ledger's machine-derived state
 * (openP0 / openP1 / openP2 / decision) onto a visible `<span data-ledger-claim>` marker
 * planted in prose, and fails closed in both directions: when the visible marker body
 * drifts from a ledger that has NOT moved (`CLAIM-STALE`), and when the ledger itself
 * moves while the marker's declared hash stands still (`LEDGER-MOVED`).
 *
 * Spec: Task 747 Phase 1 REVISION 5
 * (tasks/Sprints/Sprint_61_Task_747_phase1_decision.md). That document is specification,
 * not suggestion — this file transcribes its marker syntax, v1 field set, source-path
 * policy, preflight order, and fail-closed enumeration. It does not redesign any of it.
 *
 * A marker is a single-line, declared inline element:
 *
 *   <span data-ledger-claim data-source="docs/reviews/<x>.review-ledger.json"
 *         data-field="openP0" data-ledger-hash="<40-hex>">4 P0</span>
 *
 * `data-ledger-claim` is the required boolean marker attribute; `data-source`,
 * `data-field`, and `data-ledger-hash` are mandatory quoted attributes. `data-field` is
 * one of `openP0` / `openP1` / `openP2` / `decision` (v1; no others). `data-ledger-hash`
 * is the `git hash-object` of the source file's CURRENT working-tree content — not a
 * commit, not `HEAD:<path>`, not a historical blob.
 *
 * Scan scope: `docs/backlog.md`, `tasks/Sprints/*.md`, `docs/sessions/**\/*.md`. Markers
 * inside fenced code blocks or inline code spans are ignored (a checker-evaluated syntax
 * rule, not an author exemption). `docs/backlog-archive.md` is never opened. A file or a
 * number carrying no marker silently passes.
 *
 * Exit codes:
 *   0 — every marker found matched its ledger, no bad input.
 *   1 — at least one CLAIM-STALE and/or LEDGER-MOVED drift, no bad input.
 *   2 — bad input (malformed marker syntax, illegal/missing source, shallow repository,
 *       source-validation failure, unsupported field, unavailable git). Printed alongside
 *       any drift also found in the same run — bad input never hides drift.
 *
 * Usage:
 *   npm run check:ledger-claim-projection
 *   node scripts/check-ledger-claim-projection.mjs
 *
 * Added by Task 747 Phase 2 (Sprint 61, 2026-08-20). See
 * docs/backlog.md and docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Crash guard — house pattern shared with check-assertion-liveness.mjs /
// check-homepage-grid.mjs: the process must always exit with a controlled integer code,
// never -1 (OS kill / unhandled exception). Exit 2 = harness crash, same class as bad
// input; distinguishable from a controlled exit 1 = real drift found.
process.on('uncaughtException', (err) => {
  console.error('❌ check-ledger-claim-projection: uncaughtException — exiting with code 2');
  console.error(err);
  process.exitCode = 2;
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ check-ledger-claim-projection: unhandledRejection — exiting with code 2');
  console.error(reason);
  process.exitCode = 2;
});

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');

export const SUPPORTED_FIELDS = new Set(['openP0', 'openP1', 'openP2', 'decision']);
export const KNOWN_ATTRS = new Set(['data-source', 'data-field', 'data-ledger-hash']);
export const MARKER_ATTR = 'data-ledger-claim';
const HASH_RE = /^[0-9a-f]{40}$/;
const ENTITY_RE = /&[#a-zA-Z0-9]+;/;

// ── Scan scope (Q3) ──────────────────────────────────────────────────────────

export function walkMarkdown(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, out);
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** `docs/backlog.md` + `tasks/Sprints/*.md` (one level, no recursion) +
 * `docs/sessions/**\/*.md` (recursive). `docs/backlog-archive.md` is never opened — it is
 * not in this list, deliberately. */
export function listScanFiles() {
  const backlog = join(ROOT, 'docs', 'backlog.md');
  const sprintsDir = join(ROOT, 'tasks', 'Sprints');
  const sprints = existsSync(sprintsDir)
    ? readdirSync(sprintsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => join(sprintsDir, entry.name))
    : [];
  const sessions = walkMarkdown(join(ROOT, 'docs', 'sessions'));
  return [...(existsSync(backlog) ? [backlog] : []), ...sprints, ...sessions];
}

// ── Fence / inline-code-span exemption (Q1, checker-evaluated syntax rule) ──────

/** Per-line "inside a fenced code block" flag. Both ``` and ~~~ fences of length ≥3 are
 * recognized (both appear in this repo's own Task 747 documents). The delimiter line
 * itself is always treated as inside the fence — a marker cannot legally live on it. */
export function markFencedLines(content) {
  const lines = content.split(/\r?\n/);
  const flags = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      flags.push(true);
      inFence = !inFence;
      continue;
    }
    flags.push(inFence);
  }
  return { lines, flags };
}

/** Blanks out inline code spans (`...`) so a marker written only as documentation inside
 * backticks is invisible to the scanner. Length-preserving, so column offsets — and every
 * character OUTSIDE a backtick span — survive unchanged. This is what lets extraction
 * below operate on the stripped text directly: a real marker positioned outside backticks
 * reads identically whether taken from the raw or the stripped line, while a decoy marker
 * written only as documentation inside backticks (even sharing a line with a real one) no
 * longer contains a literal "<span" at all. */
export function stripInlineCodeSpans(line) {
  return line.replace(/`[^`]*`/g, (match) => ' '.repeat(match.length));
}

/**
 * Whether a candidate `<span ...>` attribute string declares the marker by real
 * tokenization, never by a regex or substring scan over the raw attribute text. `attrString`
 * is fully tokenized via `tokenizeAttributes` (below) and a candidate is a marker only if
 * some token's KEY is exactly `data-ledger-claim`.
 *
 * This is what correctly distinguishes the attribute actually being declared from
 * `data-ledger-claim` appearing anywhere else in the text that a boundary-aware substring
 * check cannot tell apart — most importantly as another attribute's VALUE, e.g.
 * `data-note="data-ledger-claim"`, which names the token in prose without declaring it. A
 * key-only check also naturally excludes a longer identifier that merely starts with the
 * token (`data-ledger-claim-note`), since tokenization yields the key `data-ledger-claim-note`
 * whole, never a match against the shorter `data-ledger-claim`.
 */
export function attrStringDeclaresMarkerKey(attrString) {
  const { tokens } = tokenizeAttributes(attrString);
  return tokens.some((token) => token.key === MARKER_ATTR);
}

// ── Marker candidate extraction (one line, no nested marker) ───────────────────

/**
 * Finds every `<span ...>...</span>` on a line whose opening tag declares the marker via a
 * tokenized attribute KEY (`attrStringDeclaresMarkerKey`), entirely within the
 * inline-code-stripped text — so a decoy marker inside backticks never leaks a spurious
 * candidate even when it shares a line with a genuine one, and `data-ledger-claim` occurring
 * only as another attribute's name substring or value never triggers a false positive.
 * Malformed candidates (unterminated tag, no closing tag on the same line) are reported as
 * bad input rather than silently dropped.
 */
export function findMarkerCandidates(rawLine) {
  const stripped = stripInlineCodeSpans(rawLine);

  const candidates = [];
  let searchFrom = 0;
  while (true) {
    const openStart = stripped.indexOf('<span', searchFrom);
    if (openStart === -1) break;
    const openEnd = stripped.indexOf('>', openStart);
    if (openEnd === -1) {
      const rest = stripped.slice(openStart + '<span'.length);
      if (attrStringDeclaresMarkerKey(rest)) {
        candidates.push({ ok: false, code: 'MALFORMED-ATTRIBUTE', reason: 'unterminated <span ...> opening tag (no ">" on this line)' });
      }
      break;
    }
    const attrString = stripped.slice(openStart + '<span'.length, openEnd);
    const closeStart = stripped.indexOf('</span>', openEnd + 1);
    if (closeStart === -1) {
      if (attrStringDeclaresMarkerKey(attrString)) {
        candidates.push({ ok: false, code: 'MALFORMED-BODY', reason: 'marker <span> has no matching </span> on the same line — a marker must be one line' });
      }
      break;
    }
    const body = stripped.slice(openEnd + 1, closeStart);
    if (attrStringDeclaresMarkerKey(attrString)) {
      candidates.push({ ok: true, attrString, body });
    }
    searchFrom = closeStart + '</span>'.length;
  }
  return candidates;
}

// ── Attribute tokenizing + syntax validation ────────────────────────────────────

export function tokenizeAttributes(attrString) {
  let rest = attrString;
  const tokens = [];
  let malformedQuoting = false;
  let malformedAttribute = false;

  while (true) {
    const leadingWs = rest.match(/^\s+/);
    if (leadingWs) rest = rest.slice(leadingWs[0].length);
    if (rest.length === 0) break;

    const eqMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9-]*)=/);
    if (eqMatch) {
      const key = eqMatch[1];
      const afterEq = rest.slice(eqMatch[0].length);
      const dq = afterEq.match(/^"([^"]*)"/);
      const sq = afterEq.match(/^'([^']*)'/);
      if (dq) {
        tokens.push({ key, value: dq[1] });
        rest = afterEq.slice(dq[0].length);
      } else if (sq) {
        tokens.push({ key, value: sq[1] });
        malformedQuoting = true;
        rest = afterEq.slice(sq[0].length);
      } else {
        const unq = afterEq.match(/^([^\s]*)/);
        const consumed = unq ? unq[0].length : 0;
        tokens.push({ key, value: unq ? unq[1] : '' });
        malformedQuoting = true;
        if (consumed === 0) {
          // "key=" with nothing parseable as a value — guaranteed-progress recovery: skip
          // just the "key=" prefix and keep scanning (see the fallback branch below for why
          // this must not stop scanning outright).
          malformedAttribute = true;
          rest = afterEq;
          continue;
        }
        rest = afterEq.slice(consumed);
      }
      continue;
    }

    const bareMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9-]*)(?=\s|$)/);
    if (bareMatch) {
      tokens.push({ key: bareMatch[1], value: null });
      rest = rest.slice(bareMatch[0].length);
      continue;
    }

    // Unparseable token (e.g. a stray "@bad" before a valid `data-ledger-claim`). This must
    // NOT stop scanning: the marker attribute key can still appear later in the string, and
    // silently missing it here would let a malformed marker attempt slip past as an ordinary
    // unmarked span (fail-open) instead of surfacing MALFORMED-ATTRIBUTE. Skip exactly the
    // unparseable run (up to the next whitespace) and keep scanning; malformedAttribute stays
    // set regardless of what is found afterward.
    malformedAttribute = true;
    const skipped = rest.match(/^\S+/);
    if (!skipped) break; // unreachable — rest is non-empty and has no leading whitespace here
    rest = rest.slice(skipped[0].length);
  }

  return { tokens, malformedQuoting, malformedAttribute, leftover: rest };
}

/**
 * @returns {{ok: true, dataSource: string, dataField: string, dataLedgerHash: string, body: string}
 *          | {ok: false, code: string, message: string}}
 */
export function validateMarkerCandidate({ attrString, body }) {
  const { tokens, malformedQuoting, malformedAttribute, leftover } = tokenizeAttributes(attrString);

  if (malformedAttribute || leftover.trim().length > 0) {
    return { ok: false, code: 'MALFORMED-ATTRIBUTE', message: `marker attribute text could not be parsed: "${attrString.trim()}"` };
  }
  if (malformedQuoting) {
    return { ok: false, code: 'MALFORMED-QUOTING', message: `every attribute value must be double-quoted: "${attrString.trim()}"` };
  }

  const seen = new Set();
  let hasMarker = false;
  const attrs = {};
  for (const token of tokens) {
    if (seen.has(token.key)) {
      return { ok: false, code: 'DUPLICATE-ATTRIBUTE', message: `attribute "${token.key}" appears more than once` };
    }
    seen.add(token.key);

    if (token.key === MARKER_ATTR) {
      hasMarker = true;
      continue;
    }
    if (!KNOWN_ATTRS.has(token.key)) {
      return { ok: false, code: 'UNKNOWN-ATTRIBUTE', message: `unknown attribute "${token.key}"` };
    }
    if (token.value === null) {
      return { ok: false, code: 'MALFORMED-ATTRIBUTE', message: `attribute "${token.key}" must have a double-quoted value` };
    }
    if (token.value.includes('>') || ENTITY_RE.test(token.value)) {
      return { ok: false, code: 'MALFORMED-ATTRIBUTE', message: `attribute "${token.key}" must not contain ">" or an HTML entity` };
    }
    attrs[token.key] = token.value;
  }

  if (!hasMarker) {
    return { ok: false, code: 'MISSING-ATTRIBUTE', message: `missing required marker attribute "${MARKER_ATTR}"` };
  }
  for (const required of KNOWN_ATTRS) {
    if (!(required in attrs)) {
      return { ok: false, code: 'MISSING-ATTRIBUTE', message: `missing required attribute "${required}"` };
    }
  }

  if (body.includes('<')) {
    return { ok: false, code: 'NESTED-MARKUP', message: `marker body must not contain nested markup: "${body}"` };
  }
  if (body.includes('>') || ENTITY_RE.test(body)) {
    return { ok: false, code: 'MALFORMED-BODY', message: `marker body must not contain ">" or an HTML entity: "${body}"` };
  }

  if (!HASH_RE.test(attrs['data-ledger-hash'])) {
    return { ok: false, code: 'MALFORMED-ATTRIBUTE', message: `data-ledger-hash must be a 40-character lowercase hexadecimal hash, got "${attrs['data-ledger-hash']}"` };
  }
  if (!SUPPORTED_FIELDS.has(attrs['data-field'])) {
    return { ok: false, code: 'UNSUPPORTED-FIELD', message: `unsupported data-field "${attrs['data-field']}" — v1 supports only openP0, openP1, openP2, decision` };
  }

  return {
    ok: true,
    dataSource: attrs['data-source'],
    dataField: attrs['data-field'],
    dataLedgerHash: attrs['data-ledger-hash'],
    // Not trimmed — Q1 requires the body to "equal exactly" the derived value. A body
    // padded with stray whitespace (e.g. "4 P0 ") is not the same visible claim as the
    // ledger derives ("4 P0") and must not be silently normalized into a false match.
    body,
  };
}

// ── Source-path policy (Q2) ──────────────────────────────────────────────────

/** @returns {{ok: true, normalized: string} | {ok: false, reason: string}} */
export function validateSourcePath(dataSource) {
  const raw = dataSource || '';
  const normalized = raw.replaceAll('\\', '/');
  if (!normalized) return { ok: false, reason: 'data-source must not be empty' };
  if (normalized.includes('..')) return { ok: false, reason: `data-source must not contain "..": "${raw}"` };
  if (/^[a-zA-Z]:/.test(normalized) || normalized.startsWith('/')) {
    return { ok: false, reason: `data-source must be repository-relative: "${raw}"` };
  }
  if (!normalized.startsWith('docs/reviews/')) {
    return { ok: false, reason: `data-source must be a path below docs/reviews/: "${raw}"` };
  }
  if (normalized.endsWith('.SUPERSEDED.json')) {
    return { ok: false, reason: `a *.SUPERSEDED.json ledger is not a production source: "${raw}"` };
  }
  if (normalized.endsWith('.DRAFT.json')) {
    return { ok: false, reason: `a *.DRAFT.json ledger is not a production source: "${raw}"` };
  }
  if (!normalized.endsWith('.review-ledger.json')) {
    return { ok: false, reason: `data-source must end exactly in .review-ledger.json: "${raw}"` };
  }
  return { ok: true, normalized };
}

// ── Ledger-derived projection (Q2/Q4, mirrors check-review-ledger.mjs:927-929) ──

/** @returns {string|null} null only for an unsupported field — should be unreachable once
 * validateMarkerCandidate has already rejected it. */
export function deriveClaimText(ledger, field) {
  if (field === 'decision') {
    const decision = ledger?.review?.decision;
    return typeof decision === 'string' ? decision : null;
  }
  if (field === 'openP0' || field === 'openP1' || field === 'openP2') {
    const priority = field.slice('open'.length);
    const findings = Array.isArray(ledger?.findings) ? ledger.findings : [];
    const count = findings.filter((finding) => finding && finding.priority === priority && finding.status === 'OPEN').length;
    return `${count} ${priority}`;
  }
  return null;
}

// ── Bidirectional comparison (D1) ────────────────────────────────────────────

/**
 * The D1 table, verbatim:
 *   current hash matches declared hash, body differs from derived  → CLAIM-STALE, exit 1
 *   current hash differs from declared hash, any body              → LEDGER-MOVED, exit 1
 *   current hash matches declared hash, body equals derived        → pass
 */
export function evaluateClaim({ fileLabel, line, dataSource, dataField, claimedText, currentHash, declaredHash, ledger }) {
  if (currentHash !== declaredHash) {
    return {
      kind: 'drift',
      code: 'LEDGER-MOVED',
      message: `${fileLabel}:${line}: LEDGER-MOVED — "${dataSource}" now hashes to ${currentHash}, but the marker declares ${declaredHash}. Claimed text: "${claimedText}".`,
    };
  }
  const derived = deriveClaimText(ledger, dataField);
  if (derived === null) {
    return { kind: 'bad-input', code: 'UNSUPPORTED-FIELD', message: `${fileLabel}:${line}: could not derive data-field "${dataField}" from "${dataSource}"` };
  }
  if (claimedText !== derived) {
    return {
      kind: 'drift',
      code: 'CLAIM-STALE',
      message: `${fileLabel}:${line}: CLAIM-STALE — "${dataSource}" claims "${claimedText}" but the ledger derives "${derived}".`,
    };
  }
  return { kind: 'pass' };
}

// ── git integration (injectable — real spawnSync by default, fakeable in tests) ──

export function createRealGitOps() {
  let shallowCache;
  const validatorCache = new Map();
  return {
    isShallow() {
      if (shallowCache !== undefined) return shallowCache;
      const result = spawnSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, encoding: 'utf8' });
      shallowCache = result.error ? { unavailable: true } : { unavailable: false, shallow: result.stdout.trim() === 'true' };
      return shallowCache;
    },
    hashObject(relPath) {
      const result = spawnSync('git', ['hash-object', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
      if (result.error) return { unavailable: true };
      if (result.status !== 0) return { unavailable: false, ok: false };
      return { unavailable: false, ok: true, hash: result.stdout.trim() };
    },
    runLedgerValidator(relPath) {
      if (validatorCache.has(relPath)) return validatorCache.get(relPath);
      const result = spawnSync(process.execPath, [join(ROOT, 'scripts', 'check-review-ledger.mjs'), '--file', relPath], { cwd: ROOT, encoding: 'utf8' });
      const outcome = result.error ? { unavailable: true } : { unavailable: false, passed: result.status === 0 };
      validatorCache.set(relPath, outcome);
      return outcome;
    },
  };
}

// ── Per-marker evaluation (preflight order: shallow → exists → validator → hash) ──

export function evaluateParsedMarker(parsed, { fileLabel, line }, gitOps) {
  const pathCheck = validateSourcePath(parsed.dataSource);
  if (!pathCheck.ok) {
    return { kind: 'bad-input', code: 'ILLEGAL-SOURCE-PATH', message: `${fileLabel}:${line}: ${pathCheck.reason}` };
  }
  const normalized = pathCheck.normalized;

  // (1) SHALLOW-REPOSITORY — before any source is evaluated.
  const shallow = gitOps.isShallow();
  if (shallow.unavailable) {
    return { kind: 'bad-input', code: 'GIT-UNAVAILABLE', message: `${fileLabel}:${line}: git is unavailable — cannot evaluate data-source "${normalized}"` };
  }
  if (shallow.shallow) {
    return { kind: 'bad-input', code: 'SHALLOW-REPOSITORY', message: `${fileLabel}:${line}: repository is a shallow clone — cannot evaluate "${normalized}"` };
  }

  // (2) exists / readable.
  const absolute = resolve(ROOT, normalized);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    return { kind: 'bad-input', code: 'MISSING-SOURCE', message: `${fileLabel}:${line}: data-source does not exist or is not a readable file: "${normalized}"` };
  }

  // (3) node scripts/check-review-ledger.mjs --file <source>, once per distinct source.
  const validatorResult = gitOps.runLedgerValidator(normalized);
  if (validatorResult.unavailable) {
    return { kind: 'bad-input', code: 'GIT-UNAVAILABLE', message: `${fileLabel}:${line}: git is unavailable — cannot run check-review-ledger for "${normalized}"` };
  }
  if (!validatorResult.passed) {
    return { kind: 'bad-input', code: 'SOURCE-VALIDATION-FAILED', message: `${fileLabel}:${line}: check-review-ledger --file ${normalized} did not exit 0 — this source cannot be trusted` };
  }

  let ledger;
  try {
    ledger = JSON.parse(readFileSync(absolute, 'utf8'));
  } catch {
    return { kind: 'bad-input', code: 'SOURCE-VALIDATION-FAILED', message: `${fileLabel}:${line}: data-source is not valid JSON despite passing check-review-ledger: "${normalized}"` };
  }

  const hashResult = gitOps.hashObject(normalized);
  if (hashResult.unavailable) {
    return { kind: 'bad-input', code: 'GIT-UNAVAILABLE', message: `${fileLabel}:${line}: git is unavailable — cannot hash "${normalized}"` };
  }
  if (!hashResult.ok) {
    return { kind: 'bad-input', code: 'MISSING-SOURCE', message: `${fileLabel}:${line}: git hash-object could not read "${normalized}"` };
  }

  return evaluateClaim({
    fileLabel,
    line,
    dataSource: normalized,
    dataField: parsed.dataField,
    claimedText: parsed.body,
    currentHash: hashResult.hash,
    declaredHash: parsed.dataLedgerHash,
    ledger,
  });
}

// ── Per-file scan ────────────────────────────────────────────────────────────

export function scanFileContent(content, fileLabel, gitOps) {
  const { lines, flags } = markFencedLines(content);
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    if (flags[i]) continue; // inside a fenced code block — never even syntax-checked
    const candidates = findMarkerCandidates(lines[i]);
    for (const candidate of candidates) {
      const lineNo = i + 1;
      if (!candidate.ok) {
        results.push({ kind: 'bad-input', code: candidate.code, message: `${fileLabel}:${lineNo}: ${candidate.reason}` });
        continue;
      }
      const validated = validateMarkerCandidate(candidate);
      if (!validated.ok) {
        results.push({ kind: 'bad-input', code: validated.code, message: `${fileLabel}:${lineNo}: ${validated.message}` });
        continue;
      }
      results.push(evaluateParsedMarker(validated, { fileLabel, line: lineNo }, gitOps));
    }
  }
  return results;
}

/**
 * Classifies a flat list of per-marker results into the exit-code contract. Bad input
 * always wins the exit code, but every drift finding already collected is still printed
 * — bad input never hides drift (mixed-run rule).
 */
export function summarizeResults(allResults) {
  const badInputs = allResults.filter((r) => r.kind === 'bad-input');
  const drift = allResults.filter((r) => r.kind === 'drift');
  const passes = allResults.filter((r) => r.kind === 'pass');

  const lines = [];
  for (const d of drift) lines.push(`❌ ${d.code} ${d.message}`);
  for (const b of badInputs) lines.push(`❌ BAD-INPUT[${b.code}] ${b.message}`);

  let exitCode;
  if (badInputs.length > 0) {
    lines.push(`\nResults: ${passes.length} PASS / ${drift.length} DRIFT / ${badInputs.length} BAD-INPUT`);
    exitCode = 2;
  } else if (drift.length > 0) {
    lines.push(`\nResults: ${passes.length} PASS / ${drift.length} DRIFT / 0 BAD-INPUT`);
    exitCode = 1;
  } else {
    lines.push(`✅ check-ledger-claim-projection PASSED — ${passes.length} live marker(s) matched their ledger, 0 drift, 0 bad input.`);
    exitCode = 0;
  }

  return { exitCode, lines, passes, drift, badInputs };
}

export function runScan(gitOps = createRealGitOps(), files = listScanFiles()) {
  const allResults = [];
  for (const absPath of files) {
    const fileLabel = relative(ROOT, absPath).replaceAll('\\', '/');
    let content;
    try {
      content = readFileSync(absPath, 'utf8');
    } catch {
      continue;
    }
    allResults.push(...scanFileContent(content, fileLabel, gitOps));
  }
  return summarizeResults(allResults);
}

// ── Entry point ────────────────────────────────────────────────────────────

function main() {
  const { exitCode, lines } = runScan();
  console.log(lines.join('\n'));
  process.exitCode = exitCode;
}

// Guarded so this module can be `import`-ed by tests without triggering the CLI scan
// (house pattern, check-design-tokens.mjs).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
