#!/usr/bin/env node
// Every file in the repository is checked — owner instruction 2026-11-06: "quality must cover all files in the
// project, without exceptions". Each file gets the universal checks, then the check of its type
// (.claude/rules/quality-gates.md §1 lists them). OWASP basis: Secure Code Review (tools before people), Secure
// Coding with AI §1/§9/§12 (invisible characters, secrets in the tree), Secrets Management (scan at every stage),
// Attack Surface Analysis (leftover logs and backups enlarge the surface), JavaScript and TypeScript Security.
//
// Usage:
//   node scripts/quality/check-files.mjs --all              every tracked and untracked-not-ignored file
//   node scripts/quality/check-files.mjs --staged           the staged version of every staged file (pre-commit)
//   node scripts/quality/check-files.mjs --changed <base>   files changed since <base>
//   node scripts/quality/check-files.mjs --worktree         modified, staged and untracked-not-ignored files
//   node scripts/quality/check-files.mjs <path> [...]       the named files; paths outside the repository or
//                                                           ignored by Git are skipped (the agent loop)
//   node scripts/quality/check-files.mjs --stdin-list       the same, one path per line on standard input
// Exit 0 = no finding; exit 1 = findings (printed); exit 2 = the checker could not run.

import { readFileSync, existsSync, statSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { findMojibake, loadAllowlist, isAllowlisted } from '../check-mojibake.mjs';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const MAX_BYTES = 20 * 1024 * 1024;
const MAGIC = {
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]],
  '.ico': [[0x00, 0x00, 0x01, 0x00]],
  '.woff': [[0x77, 0x4f, 0x46, 0x46]],
  '.woff2': [[0x77, 0x4f, 0x46, 0x32]],
  '.ttf': [[0x00, 0x01, 0x00, 0x00], [0x74, 0x72, 0x75, 0x65]],
  '.otf': [[0x4f, 0x54, 0x54, 0x4f]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  '.zip': [[0x50, 0x4b]],
  '.gz': [[0x1f, 0x8b]],
};
const JUNK_EXT = /\.(log|bak|nul|orig|rej|tmp|swp)$/i;
const JUNK_DIR = /(^|\/)(node_modules|\.next|storybook-static|test-results|\.screenshots|\.playwright-mcp|coverage)\//;
// Environment files hold secrets; only a documented template may be committed (Secrets Management).
const ENV_FILE = /(^|\/)\.env(\.(?!example$|template$|sample$)[^/]+)?$/i;
// C0 controls other than tab/newline/carriage return/form feed, C1 controls, zero-width characters, soft hyphen, word
// joiner, bidi embedding/override/isolate controls and tag characters (Trojan Source, hidden prompt text). U+FEFF is
// handled separately: a BOM is allowed only at the start of a .ps1 file.
// eslint-disable-next-line no-control-regex -- control characters are exactly what this pattern refuses
const INVISIBLE =/[\u0000-\u0008\u000B\u000E-\u001F\u007F-\u009F\u200B\u200C\u2060\u00AD\u202A-\u202E\u2066-\u2069]|[\u{E0000}-\u{E007F}]/u;
export const SECRET_PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Stripe live key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/],
  ['JSON Web Token', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['npm token', /\bnpm_[A-Za-z0-9]{36}\b/],
  ['Vercel token', /\bvc[pkai]_[A-Za-z0-9]{24,}\b/],
];
const CODE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i;
const KICKOFF = /^tasks\/Sprints\/Sprint_(\d+)_kickoff_prompt_Task_\d+_.+\.md$/;
export const KICKOFF_SECTIONS = ['## Goal', '## Scope', '## Attack surface', '## UI', '## Acceptance criteria', '## Route', '## Review'];
const KICKOFF_FIRST_SPRINT = 93;
const KICKOFF_MAX_LINES = 200;

const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const finding = (rule, message, line) => ({ rule, message, line });

let ts;
const typescript = () => (ts ??= require('typescript'));
let yaml;
const jsYaml = () => (yaml ??= require('js-yaml'));
let postcss;
const postcssParse = () => (postcss ??= require('postcss'));
let mojibakeAllow;

/** All findings for one file. `exists(rel)` answers whether a repository-relative path exists (link checks). */
export function checkFile(rel, buf, { exists = inRepository } = {}) {
  const out = [];
  const ext = path.extname(rel).toLowerCase();
  if (JUNK_EXT.test(rel)) out.push(finding('junk-file', `"${ext}" files never belong in the repository (logs, backups, scratch)`));
  if (ENV_FILE.test(rel)) out.push(finding('env-file', 'environment files hold secrets and never belong in the repository (.env.example is the template)'));
  if (JUNK_DIR.test(rel)) out.push(finding('junk-file', 'build output, dependencies or tool scratch output never belong in the repository'));
  if (buf.length > MAX_BYTES) out.push(finding('too-large', `${buf.length} bytes > ${MAX_BYTES}`));

  if (MAGIC[ext]) {
    if (!MAGIC[ext].some((sig) => sig.every((b, i) => buf[i] === b))) out.push(finding('binary-type', `content is not a ${ext} file`));
    return out;
  }
  if (buf.length === 0) return out;
  if (buf.includes(0)) return [...out, finding('nul-byte', 'NUL byte in a text file (binary content under a text name, or a corrupted write)')];

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buf);
  } catch {
    return [...out, finding('not-utf8', 'not valid UTF-8')];
  }
  let body = text;
  if (text.charCodeAt(0) === 0xfeff) {
    if (ext !== '.ps1') out.push(finding('bom', 'UTF-8 BOM (only .ps1 files may carry one)', 1));
    body = text.slice(1);
  }
  const inv = INVISIBLE.exec(body) ?? /\uFEFF/.exec(body);
  if (inv) out.push(finding('invisible-character', `U+${inv[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} — write it as an escape (\\u....) in code; remove it from prose`, lineOf(body, inv.index)));
  const conflict = /^(?:<{7}|>{7})(?: |$)/m.exec(body);
  if (conflict && /^={7}$/m.test(body)) out.push(finding('merge-conflict', 'merge conflict marker', lineOf(body, conflict.index)));
  for (const [name, re] of SECRET_PATTERNS) {
    const m = re.exec(body);
    if (m) out.push(finding('secret', `${name} — remove it, then revoke and rotate it (Secrets Management: revoke, rotate, delete)`, lineOf(body, m.index)));
  }
  mojibakeAllow ??= loadAllowlist();
  if (!isAllowlisted(rel, mojibakeAllow)) for (const h of findMojibake(body).slice(0, 3)) out.push(finding('mojibake', `${h.name}: "…${h.snippet}…"`, h.line));

  if (ext === '.json') {
    try { JSON.parse(body); } catch (e) { out.push(finding('json', e.message)); }
    if (rel === 'package.json') for (const m of brokenScripts(body, exists)) out.push(finding('stale-path', m));
  } else if (ext === '.yml' || ext === '.yaml') {
    try { jsYaml().loadAll(body); } catch (e) { out.push(finding('yaml', e.message.split('\n')[0], e.mark ? e.mark.line + 1 : undefined)); }
  } else if (CODE_EXT.test(rel)) {
    const t = typescript();
    const kind = /\.tsx$/i.test(rel) ? t.ScriptKind.TSX : /\.(ts|mts|cts)$/i.test(rel) ? t.ScriptKind.TS : /\.jsx$/i.test(rel) ? t.ScriptKind.JSX : t.ScriptKind.JS;
    const sf = t.createSourceFile(rel, body, t.ScriptTarget.Latest, false, kind);
    for (const d of (sf.parseDiagnostics ?? []).slice(0, 3)) out.push(finding('syntax', t.flattenDiagnosticMessageText(d.messageText, ' '), lineOf(body, d.start ?? 0)));
  } else if (ext === '.css') {
    try { postcssParse().parse(body, { from: rel }); } catch (e) { out.push(finding('css', e.reason ?? e.message, e.line)); }
  } else if (ext === '.sql') {
    const err = sqlStructure(body);
    if (err) out.push(finding('sql', err.message, err.line));
  } else if (ext === '.svg') {
    const m = /<script\b|\son[a-z]+\s*=|javascript:/i.exec(body);
    if (m) out.push(finding('svg-active-content', 'script, event handler or javascript: URL in an SVG', lineOf(body, m.index)));
  } else if (ext === '.md') {
    for (const l of brokenLinks(rel, body, exists)) out.push(finding('broken-link', `relative link target does not exist: ${l.target}`, l.line));
    for (const p of stalePaths(rel, body, exists)) {
      out.push(p.script
        ? finding('stale-path', `names \`${p.target}\`, which is not a package.json script — name the current command, or say on the same line that it was removed`, p.line)
        : finding('stale-path', `names \`${p.target}\`, which is not in the repository — point to the current file, or say on the same line that it was removed`, p.line));
    }
    const k = KICKOFF.exec(rel);
    if (k && Number(k[1]) >= KICKOFF_FIRST_SPRINT) out.push(...kickoffFindings(body));
  }
  return out;
}

let repoPaths;
/** True when the repository-relative path is a tracked or untracked-not-ignored file, or a folder holding one: what a
 *  clean checkout (CI) contains once the work is committed. Ignored files (local evidence, build output) do not count,
 *  so a reference passes or fails the same way on the agent's machine and in CI. */
export function inRepository(p) {
  if (!repoPaths) {
    repoPaths = new Set();
    for (const f of [...zlist(git(['ls-files', '-z'])), ...zlist(git(['ls-files', '-z', '--others', '--exclude-standard']))]) {
      if (!existsSync(path.join(ROOT, f))) continue;
      repoPaths.add(f);
      for (let d = path.posix.dirname(f); d !== '.'; d = path.posix.dirname(d)) repoPaths.add(d);
    }
  }
  return repoPaths.has(String(p).replace(/\/+$/, ''));
}

// Records of the past keep the paths they had; everything else is policy or reference an agent acts on.
const HISTORY_DOC = /^(docs\/(sessions|reviews|chat-gpt-reports|governance-reports)\/|docs\/backlog-archive\.md$|tasks\/|reports\/)/;
const INLINE_PATH = /`((?:\.github|\.claude|\.githooks|\.storybook|\.agents|scripts|src|docs|supabase|messages|public|playwright)\/[^`\s]+?)(?::\d+(?:[-,]\d+)*)?`/g;
// A line that itself says the file is gone, or that the work will create it, may name a path that is not there.
export const PATH_HISTORY_LINE = /\b(removed|deleted|retired|replaced|superseded|no longer|renamed|moved|was|were|legacy|former|creates?|adds?|new|will|gitignored|not in git|not exist|local only)\b/i;

/** Inline-code repository paths in an active document that point at nothing (rules naming deleted hooks, docs naming
 *  deleted components): an agent following them acts on a file that does not exist. */
export function stalePaths(rel, body, exists) {
  if (HISTORY_DOC.test(rel)) return [];
  const out = [];
  let fence = false;
  body.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    if (fence || PATH_HISTORY_LINE.test(line)) return;
    for (const m of line.matchAll(INLINE_PATH)) {
      if (/[*{}<>$|#?]|\.\.|\u2026|YYYY|NNN/.test(m[1])) continue;
      const target = m[1].replace(/[.,;:)]+$/, '').replace(/\/+$/, '');
      if (!exists(target)) out.push({ target, line: i + 1 });
    }
    for (const m of line.matchAll(NPM_RUN)) {
      if (!scripts().has(m[1])) out.push({ target: `npm run ${m[1]}`, line: i + 1, script: true });
    }
  });
  return out;
}

const NPM_RUN = /\bnpm run ([a-z0-9][\w:.-]*\w)/gi;
let scriptNames;
/** The script names of the root package.json. */
export function scripts() {
  if (!scriptNames) {
    try { scriptNames = new Set(Object.keys(JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts ?? {})); } catch { scriptNames = new Set(); }
  }
  return scriptNames;
}
/** For tests: replace the known script names. */
export function setScripts(names) { scriptNames = new Set(names); }

/** package.json scripts that run a file which is not in the repository, or call a script that does not exist. */
export function brokenScripts(pkgText, exists) {
  let pkg;
  try { pkg = JSON.parse(pkgText); } catch { return []; }
  const all = pkg.scripts ?? {};
  const out = [];
  for (const [name, cmd] of Object.entries(all)) {
    for (const m of String(cmd).matchAll(/(?:^|[\s&;|(])(?:node|tsx|npx tsx|bash|sh)\s+((?:\.?\/)?[\w.\/-]+\.(?:mjs|cjs|js|ts|sh))\b/g)) {
      const p = m[1].replace(/^\.\//, '');
      if (!exists(p)) out.push(`script "${name}" runs ${p}, which is not in the repository`);
    }
    for (const m of String(cmd).matchAll(/npm run ([\w:.-]+)/g)) if (!(m[1] in all)) out.push(`script "${name}" calls npm run ${m[1]}, which does not exist`);
  }
  return out;
}

/** Relative Markdown links whose target is missing. Code fences and inline code are ignored. */
export function brokenLinks(rel, body, exists) {
  const masked = body
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/`+[^`\n]*`+/g, (m) => ' '.repeat(m.length));
  const out = [];
  for (const m of masked.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:|tel:|data:|\/)/i.test(target)) continue;
    if (!/^[\w.\/~%()\u0080-\uFFFF-]+$/.test(target) || !/[./]/.test(target)) continue;
    let decoded = target;
    try { decoded = decodeURIComponent(target); } catch { /* keep raw */ }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), decoded));
    if (resolved.startsWith('../') || !exists(resolved)) out.push({ target, line: lineOf(body, m.index) });
  }
  return out;
}

/** A kickoff written from Sprint 93 on follows .claude/rules/kickoff-template.md. */
export function kickoffFindings(body) {
  const out = [];
  const lines = body.split('\n');
  if (lines.length > KICKOFF_MAX_LINES + 1) out.push(finding('kickoff', `${lines.length} lines > ${KICKOFF_MAX_LINES} (flow.md §1: split the task)`));
  if (!/^# Task \d+ — \S/.test(lines[0] ?? '')) out.push(finding('kickoff', 'first line must be "# Task <n> — <outcome>"', 1));
  let last = -1;
  for (const s of KICKOFF_SECTIONS) {
    const i = lines.findIndex((l) => l.trim() === s);
    if (i < 0) out.push(finding('kickoff', `missing section "${s}" (kickoff-template.md)`));
    else if (i < last) out.push(finding('kickoff', `section "${s}" is out of order`, i + 1));
    else last = i;
  }
  const ac = lines.findIndex((l) => l.trim() === '## Acceptance criteria');
  if (ac >= 0) {
    const end = lines.findIndex((l, i) => i > ac && l.startsWith('## '));
    const block = lines.slice(ac + 1, end < 0 ? undefined : end);
    if (!block.some((l) => /^- AC\d+\b/.test(l))) out.push(finding('kickoff', 'no "- AC<n>" acceptance criterion', ac + 1));
    for (const item of acceptanceCriteria(block, ac + 2)) {
      if (!AUTOMATED_TEST.test(item.text)) {
        out.push(finding('kickoff', `${item.id} names no automated test (a test file, or a command in backticks that exits non-zero on failure) — quality-gates.md §8`, item.line));
      }
    }
  }
  return out;
}

/** Each "- AC<n>" item with its continuation lines. */
export function acceptanceCriteria(block, firstLine) {
  const items = [];
  block.forEach((l, i) => {
    const m = /^- (AC\d+)\b/.exec(l);
    if (m) items.push({ id: m[1], line: firstLine + i, text: l });
    else if (items.length && /^\s+\S/.test(l)) items[items.length - 1].text += ` ${l.trim()}`;
  });
  return items;
}

// An automated test: a test file (unit, component, node:test, integration, Story with a play function run by the
// Storybook test runner), or a command in backticks that runs a check and exits non-zero on failure.
export const AUTOMATED_TEST = /\.(test|spec)\.(ts|tsx|mts|mjs|js)\b|\.stories\.tsx\b[^.]*\bplay\b|`(?:npm [a-z]|npx |node |gh )[^`]+`/;

/** Structural SQL check: strings, quoted identifiers, dollar quotes, comments and parentheses are balanced. */
export function sqlStructure(sql) {
  let depth = 0;
  let i = 0;
  const n = sql.length;
  const at = (k) => ({ line: lineOf(sql, k) });
  while (i < n) {
    const c = sql[i];
    const d = sql[i + 1];
    if (c === '-' && d === '-') { const e = sql.indexOf('\n', i); i = e < 0 ? n : e + 1; continue; }
    if (c === '/' && d === '*') {
      let nest = 1; const start = i; i += 2;
      while (i < n && nest > 0) { if (sql[i] === '/' && sql[i + 1] === '*') { nest++; i += 2; } else if (sql[i] === '*' && sql[i + 1] === '/') { nest--; i += 2; } else i++; }
      if (nest > 0) return { message: 'unterminated block comment', ...at(start) };
      continue;
    }
    if (c === "'" ) {
      const start = i; const escapes = /[eE]/.test(sql[i - 1] ?? '') && !/\w/.test(sql[i - 2] ?? ''); i++;
      while (i < n) { if (escapes && sql[i] === '\\') { i += 2; continue; } if (sql[i] === "'") { if (sql[i + 1] === "'") { i += 2; continue; } break; } i++; }
      if (i >= n) return { message: 'unterminated string literal', ...at(start) };
      i++; continue;
    }
    if (c === '"') { const e = sql.indexOf('"', i + 1); if (e < 0) return { message: 'unterminated quoted identifier', ...at(i) }; i = e + 1; continue; }
    if (c === '$') {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 64));
      if (m && !/[\w$]/.test(sql[i - 1] ?? '')) {
        const tag = m[0]; const e = sql.indexOf(tag, i + tag.length);
        if (e < 0) return { message: `unterminated dollar-quoted string ${tag}`, ...at(i) };
        i = e + tag.length; continue;
      }
    }
    if (c === '(') depth++;
    if (c === ')') { depth--; if (depth < 0) return { message: 'unbalanced ")"', ...at(i) }; }
    i++;
  }
  return depth === 0 ? null : { message: `${depth} unclosed "("`, line: lineOf(sql, n) };
}

/** Parses PowerShell files with the PowerShell parser (pwsh, else Windows PowerShell). Fails closed. */
export function checkPowerShell(entries) {
  if (!entries.length) return new Map();
  const shell = ['pwsh', 'powershell'].find((s) => spawnSync(s, ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.Major'], { encoding: 'utf8', windowsHide: true }).status === 0);
  const result = new Map();
  if (!shell) { for (const e of entries) result.set(e.rel, [finding('powershell', 'no PowerShell available to parse this file')]); return result; }
  const script = `$ErrorActionPreference='Stop'; $paths = [Console]::In.ReadToEnd() | ConvertFrom-Json; $out=@{}; foreach ($p in $paths) { $t=$null; $e=$null; [void][System.Management.Automation.Language.Parser]::ParseFile($p, [ref]$t, [ref]$e); $out[$p] = @($e | ForEach-Object { @{ line = $_.Extent.StartLineNumber; message = $_.Message } }) }; $out | ConvertTo-Json -Depth 4 -Compress`;
  const r = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', script], { input: JSON.stringify(entries.map((e) => e.abs)), encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
  let parsed = {};
  try { parsed = JSON.parse(r.stdout || '{}'); } catch { /* fall through */ }
  for (const e of entries) {
    const errs = parsed[e.abs];
    if (errs === undefined) result.set(e.rel, [finding('powershell', `parser did not answer (${(r.stderr || '').trim().slice(0, 200)})`)]);
    else result.set(e.rel, [].concat(errs).filter(Boolean).map((x) => finding('powershell', x.message, x.line)));
  }
  return result;
}

/** A shell script: a .sh file, or any file whose first line is a sh/bash shebang. */
export const isShellScript = (rel, body) => /\.sh$/i.test(rel) || /^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?(?:ba)?sh\b/.test(body);

/** Parses shell scripts with `bash -n` (syntax only, nothing runs). Fails closed when no bash is available. */
export function checkShell(entries) {
  const result = new Map();
  if (!entries.length) return result;
  // On Windows a hook process often has no bash on PATH; Git for Windows ships one next to git.exe.
  const candidates = ['bash'];
  if (process.platform === 'win32') {
    for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')]) {
      if (base) candidates.push(path.join(base, 'Git', 'bin', 'bash.exe'), path.join(base, 'Git', 'usr', 'bin', 'bash.exe'));
    }
  }
  const bash = candidates.find((c) => (c === 'bash' || existsSync(c)) && spawnSync(c, ['-c', 'exit 0'], { encoding: 'utf8', windowsHide: true }).status === 0);
  for (const e of entries) {
    if (!bash) { result.set(e.rel, [finding('shell', 'no bash available to parse this file')]); continue; }
    const r = spawnSync(bash, ['-n', e.abs], { encoding: 'utf8', windowsHide: true });
    result.set(e.rel, r.status === 0 ? [] : [finding('shell', (r.stderr || '').trim().split('\n')[0] || `bash -n exit ${r.status}`)]);
  }
  return result;
}

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'buffer', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${r.stderr.toString().trim()}`);
  return r.stdout;
}
const zlist = (buf) => buf.toString('utf8').split('\0').filter(Boolean);

function selectFiles(argv) {
  if (argv.includes('--all')) {
    return [...new Set([...zlist(git(['ls-files', '-z'])), ...zlist(git(['ls-files', '-z', '--others', '--exclude-standard']))])]
      .filter((f) => existsSync(path.join(ROOT, f))).map((rel) => ({ rel }));
  }
  if (argv.includes('--staged')) {
    return zlist(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])).map((rel) => ({ rel, staged: true }));
  }
  if (argv.includes('--worktree')) {
    const tracked = zlist(git(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z']));
    const untracked = zlist(git(['ls-files', '-z', '--others', '--exclude-standard']));
    return [...new Set([...tracked, ...untracked])].filter((f) => existsSync(path.join(ROOT, f))).map((rel) => ({ rel }));
  }
  const ci = argv.indexOf('--changed');
  if (ci >= 0) {
    const base = argv[ci + 1];
    if (!base) throw new Error('--changed needs a base ref');
    return zlist(git(['diff', '--name-only', '--diff-filter=ACMR', '-z', `${base}...HEAD`])).filter((f) => existsSync(path.join(ROOT, f))).map((rel) => ({ rel }));
  }
  const given = argv.includes('--stdin-list') ? readFileSync(0, 'utf8').split(/\r?\n/).filter(Boolean) : argv.filter((a) => !a.startsWith('--'));
  const named = given
    .map((p) => path.relative(ROOT, path.resolve(ROOT, p)).split(path.sep).join('/'))
    .filter((rel) => rel && !rel.startsWith('../') && !path.isAbsolute(rel));
  if (!named.length) return [];
  // Git-ignored paths never reach the repository (.env.local, build output); .gitignore itself is a tracked file.
  const r = spawnSync('git', ['check-ignore', '-z', '--stdin'], { cwd: ROOT, input: named.join('\0'), encoding: 'utf8', windowsHide: true });
  if (r.status !== 0 && r.status !== 1) throw new Error(`git check-ignore failed: ${(r.stderr || '').trim()}`);
  const ignored = new Set((r.stdout || '').split('\0').filter(Boolean));
  return named.filter((rel) => !ignored.has(rel)).map((rel) => ({ rel }));
}

export function run(argv) {
  const files = selectFiles(argv);
  const findings = new Map();
  const ps1 = [];
  const sh = [];
  let tmp;
  for (const f of files) {
    const abs = path.join(ROOT, f.rel);
    let buf;
    if (f.staged) buf = git(['show', `:${f.rel}`]);
    else if (existsSync(abs) && statSync(abs).isFile()) buf = readFileSync(abs);
    else { findings.set(f.rel, [finding('missing', 'file does not exist')]); continue; }
    const list = checkFile(f.rel, buf);
    // The staged version is what will be committed, so for --staged the parsers read a copy of it.
    const parseable = (ext) => {
      if (!f.staged) return abs;
      tmp ??= mkdtempSync(path.join(os.tmpdir(), 'check-files-'));
      const copy = path.join(tmp, `${ps1.length + sh.length}${ext}`);
      writeFileSync(copy, buf);
      return copy;
    };
    if (path.extname(f.rel).toLowerCase() === '.ps1') ps1.push({ rel: f.rel, abs: parseable('.ps1') });
    else if (!MAGIC[path.extname(f.rel).toLowerCase()] && isShellScript(f.rel, buf.subarray(0, 64).toString('utf8'))) sh.push({ rel: f.rel, abs: parseable('.sh') });
    if (list.length) findings.set(f.rel, list);
  }
  try {
    for (const [rel, list] of [...checkPowerShell(ps1), ...checkShell(sh)]) if (list.length) findings.set(rel, [...(findings.get(rel) ?? []), ...list]);
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
  return { checked: files.length, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  try {
    result = run(process.argv.slice(2));
  } catch (e) {
    console.error(`check-files could not run: ${e.message}`);
    process.exit(2);
  }
  const total = [...result.findings.values()].reduce((n, l) => n + l.length, 0);
  for (const [rel, list] of result.findings) for (const f of list) console.error(`${rel}${f.line ? `:${f.line}` : ''}  [${f.rule}]  ${f.message}`);
  console.log(`check-files: ${result.checked} file(s) checked, ${total} finding(s) in ${result.findings.size} file(s)`);
  process.exit(total ? 1 : 0);
}
