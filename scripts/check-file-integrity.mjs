#!/usr/bin/env node
/**
 * check-file-integrity.mjs — File integrity gate (agent-contract clause 14).
 *
 * Detects files that would silently corrupt the repo:
 *   1. NUL bytes      — any \x00 in the file buffer
 *   2. Stray UTF-8 BOM — EF BB BF at start of source files
 *   3. Unparseable JSON — JSON.parse throws
 *   4. Unparseable .mjs/.js — `node --check` exits non-zero
 *   5. .ts/.tsx — NUL/BOM/truncation only; full type-check deferred to the
 *      existing `tsc --noEmit` gate (running tsc per-file is too slow here)
 *   6. Truncation heuristic — for text files not covered by a parse check:
 *      file lacks a trailing newline AND its last non-empty line ends with an
 *      obviously open construct ({, (, [, comma, =>, :).  Conservative — parse
 *      success (for JSON/JS) is the stronger guarantee; this heuristic covers
 *      .ts/.tsx, .md, .yml, .txt, etc.
 *
 * CLI modes:
 *   (default)          check git-changed (staged + unstaged) + untracked files
 *   --all              check all src/ + scripts/ + messages/ + docs/
 *   --files a b c …    check explicit paths (space-separated after the flag)
 *
 * Exit 0 = all clean. Exit 1 = one or more failures (offenders named).
 *
 * Added: Task 400, Sprint 34, 2026-06-06.
 * Rule:  docs/agent-contract.md clause 14
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let mode = 'changed';
let explicitFiles = [];

if (args.includes('--all')) {
  mode = 'all';
} else {
  const fi = args.indexOf('--files');
  if (fi !== -1) {
    mode = 'files';
    explicitFiles = args.slice(fi + 1);
  }
}

// ── Skip dirs (used in --all walk) ────────────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.next', 'storybook-static', '.screenshots',
  '.git', 'dist', 'out', '.turbo', 'coverage',
]);

// ── Binary extensions — skip all integrity checks ────────────────────────────
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.gz', '.tar', '.br',
  '.mp4', '.webm', '.ogg', '.mp3',
  '.map',  // source-maps are auto-generated, not hand-written
]);

// ── Extension sets for check routing ─────────────────────────────────────────
const JSON_EXTS    = new Set(['.json']);
const JSLIKE_EXTS  = new Set(['.mjs', '.js', '.cjs']);
const TSLIKE_EXTS  = new Set(['.ts', '.tsx']);
// Source files that should never carry a BOM
const SOURCE_EXTS  = new Set([
  '.ts', '.tsx', '.mjs', '.js', '.cjs', '.jsx',
  '.json', '.md', '.mdx', '.css', '.scss', '.html',
  '.yml', '.yaml', '.txt', '.env', '.sh',
]);

// ── File collectors ───────────────────────────────────────────────────────────
function walkDir(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) walkDir(full, out);
    else out.push(full);
  }
  return out;
}

function gitLines(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (!r.stdout) return [];
  return r.stdout.split('\n').map(l => l.trim()).filter(Boolean);
}

function collectTargetFiles() {
  if (mode === 'files') {
    return explicitFiles.map(f => (f.startsWith('/') ? f : resolve(ROOT, f)));
  }

  if (mode === 'all') {
    const dirs = ['src', 'scripts', 'messages', 'docs'].map(d => join(ROOT, d));
    const out = [];
    for (const d of dirs) walkDir(d, out);
    return out;
  }

  // default: staged + unstaged tracked changes + untracked
  const paths = new Set([
    ...gitLines(['diff', '--name-only']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]);

  return [...paths]
    .map(p => resolve(ROOT, p))
    .filter(p => {
      const rel = relative(ROOT, p);
      return !SKIP_DIRS.has(rel.split(/[/\\]/)[0]);
    });
}

// ── Individual checks ─────────────────────────────────────────────────────────

function checkNulBytes(buf) {
  if (!buf.includes(0)) return null;
  const count = [...buf].filter(b => b === 0).length;
  return `NUL bytes present (${count} byte${count !== 1 ? 's' : ''}) — file is corrupt`;
}

function checkBom(filePath, buf) {
  const ext = extname(filePath).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) return null;
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return 'Stray UTF-8 BOM (EF BB BF) at start of source file';
  }
  return null;
}

function checkJsonParse(content) {
  try {
    JSON.parse(content);
    return null;
  } catch (e) {
    return `Unparseable JSON: ${e.message}`;
  }
}

function checkNodeSyntax(filePath) {
  const r = spawnSync(process.execPath, ['--check', filePath], {
    encoding: 'utf8',
    timeout: 10_000,
  });
  if (r.status === 0) return null;
  const msg = (r.stderr || r.stdout || '').trim().split('\n')[0] ?? 'syntax error';
  return `node --check failed: ${msg}`;
}

// Conservative truncation heuristic for text files not covered by a parse check.
// Only fires when the file BOTH lacks a trailing newline AND its last content
// line ends with an open construct — two conditions reduce false positives.
const OPEN_TOKEN_RE = /[{(\[,]$|=>\s*$|:\s*$/;

function checkTruncation(content, ext) {
  // JSON and JS/MJS truncation is definitively caught by their parse checks.
  if (JSON_EXTS.has(ext) || JSLIKE_EXTS.has(ext)) return null;

  if (!content) return null;
  if (content.endsWith('\n')) return null; // well-terminated

  const lastLine = content.split('\n').filter(l => l.trim()).at(-1) ?? '';
  if (OPEN_TOKEN_RE.test(lastLine.trimEnd())) {
    const snippet = lastLine.trimEnd().slice(-60);
    return `Possibly truncated — no trailing newline, last line ends with open construct: "…${snippet}"`;
  }
  return null;
}

// ── Per-file driver ───────────────────────────────────────────────────────────
function checkFile(filePath) {
  const errors = [];

  if (!existsSync(filePath)) return errors;
  let stat;
  try { stat = statSync(filePath); } catch { return errors; }
  if (!stat.isFile()) return errors;

  const ext = extname(filePath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return errors;

  let buf;
  try { buf = readFileSync(filePath); } catch (e) {
    errors.push(`Cannot read file: ${e.message}`);
    return errors;
  }

  // Check 1: NUL bytes — must be first; stops further checks (content unreliable)
  const nulErr = checkNulBytes(buf);
  if (nulErr) {
    errors.push(nulErr);
    return errors; // don't try to parse a NUL-corrupted file
  }

  // Check 2: BOM
  const bomErr = checkBom(filePath, buf);
  if (bomErr) errors.push(bomErr);

  // Decode to string (strip BOM if present to avoid double-counting)
  const start = (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) ? 3 : 0;
  const content = buf.slice(start).toString('utf8');

  // Check 3: JSON parse
  if (JSON_EXTS.has(ext)) {
    const jsonErr = checkJsonParse(content);
    if (jsonErr) errors.push(jsonErr);
  }

  // Check 4: JS/MJS syntax via node --check
  if (JSLIKE_EXTS.has(ext)) {
    const nodeErr = checkNodeSyntax(filePath);
    if (nodeErr) errors.push(nodeErr);
  }

  // Check 5 + 6: TS/TSX and all remaining text files — truncation heuristic
  // (TS full type-check is deferred to the existing tsc --noEmit gate)
  const truncErr = checkTruncation(content, ext);
  if (truncErr) errors.push(truncErr);

  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const files = collectTargetFiles();

  const modeLabel =
    mode === 'all'   ? 'src/ + scripts/ + messages/ + docs/ (--all)' :
    mode === 'files' ? `${explicitFiles.length} explicit file(s) (--files)` :
                       'git-changed + untracked (default)';

  console.log(`🔍  check:file-integrity — ${modeLabel}`);
  console.log(`    Checking ${files.length} file(s) — NUL bytes · BOM · JSON parse · node --check · truncation`);
  console.log('');

  const failures = {};
  for (const fp of files) {
    const errs = checkFile(fp);
    if (errs.length > 0) {
      failures[relative(ROOT, fp).replace(/\\/g, '/')] = errs;
    }
  }

  const failCount = Object.keys(failures).length;

  if (failCount === 0) {
    console.log(`✅  check:file-integrity PASSED — all ${files.length} file(s) clean`);
    process.exit(0);
  }

  console.error(`❌  check:file-integrity FAILED — ${failCount} corrupt / invalid file(s):\n`);
  for (const [rel, errs] of Object.entries(failures).sort()) {
    console.error(`  ${rel}`);
    for (const e of errs) {
      console.error(`    → ${e}`);
    }
  }
  console.error('');
  console.error('  Remediation:');
  console.error('    NUL bytes / truncation : re-write the file (Cowork/Windows mount write-failure)');
  console.error('    Stray BOM              : strip with sed or PowerShell before committing');
  console.error('    JSON parse error       : validate and fix the JSON');
  console.error('    node --check failure   : fix the JS/MJS syntax error');
  console.error('  Rule: docs/agent-contract.md clause 14');
  process.exit(1);
}

run();
