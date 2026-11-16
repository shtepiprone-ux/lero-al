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
//                                                           ignored by Git are skipped
//   node scripts/quality/check-files.mjs --stdin-list       the same, one path per line on standard input
// Exit 0 = no finding; exit 1 = findings (printed); exit 2 = the checker could not run.

import { readFileSync, readdirSync, existsSync, openSync, fstatSync, closeSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { findMojibake, loadAllowlist, isAllowlisted } from '../check-mojibake.mjs';
import { checkKickoff, checkReview, loadJson, readReviewRecord, REGISTRY, CONTROLS, OWASP_GRANDFATHERED } from './owasp.mjs';
import { scan as sinkScan, PRODUCT as SINK_PRODUCT } from './client-sinks.mjs';
import { check as localeCheck, LOCALES, loadParser } from './locale-safety.mjs';
import { isEntryPoint } from '../lib/entry-point.mjs';

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
export const KICKOFF_SECTIONS = ['## Goal', '## Cause', '## Scope', '## Read set', '## Attack surface', '## OWASP', '## UI', '## Mobile adaptation record', '## Acceptance criteria', '## Route', '## Review'];
const KICKOFF_FIRST_SPRINT = 93;
const KICKOFF_MAX_LINES = 200;
// Owner, 2026-11-16 (translated): "a kickoff always states the cause of the problem, by fact, and how to solve it"; "the size
// limit must be checked by a tool, not by the model". "## Cause" holds the fact with its sources and a "Fix:" line; "## Read
// set" names the commit its counts were taken at ("Counted at <commit>") and lists every file the implementer will change
// with its line count in that commit, at most MAX_READ_SET_LINES in all (more: split the task at design). Every source and
// every count is checked on every run, not only at design (Task 956 Review 6, F20, F21).
export const MAX_READ_SET_LINES = 3000;
/** The sha256 of a kickoff's text (checkFile has removed a BOM), line endings normalised: the same on Windows and in CI. */
export const kickoffHash = (body) => createHash('sha256').update(String(body).replace(/\r\n/g, '\n')).digest('hex');
// Kickoffs written before the rule, each with the sha256 of its text on 2026-11-16. A listed kickoff whose text differs
// has been revised since, and is held to the rule like any other (Task 956 Review 6, F22).
export const CAUSE_GRANDFATHERED = new Map([
  ['926', 'af68a6807ae740a2015cb8ca8dbad0936a0acc648efb78c395cc14d50115be49'],
  ['939', '0ecb856e27e4aa21c3162fa7f52cd913ad41b9a03e6361a480c0226d66662b54'],
  ['945', '1d83a7d73fc2e07c37a7118c064a777954e057f2b6d715416d370814cb9ad595'],
  ['947', 'b6020fe3733e267d50a0088b95e45c7a9fb4e1aea356759aa973e650b91f14f2'],
  ['948', '329765840da7d46a3a78131445feaa49bb1f0bbf1bf116cbe7a9ffca6eea4f29'],
  ['950', 'b3d65a342d8f9bebcbe4f72039d25cd9afa04e3a280c5715702b2442ee0382a8'],
  ['951', '5f4d393b96e8fe58e7ba9f02956859d0ed56cffc1aa5f209ea681abf421019c7'],
  ['952', 'b15e41f19a20eab6ed5b59ac3f33c76bd11b0da497d99f4eac4b1fda0c06738b'],
  ['953', 'b10536cbdee8e2da96847502354e7debb33d72fafd883cd0f05f3358a0772ec2'],
  ['954', 'bb47f365402043e016c50db9975f682d1f3305279479a35bce52907b4e8d2b07'],
  ['955', 'bd2148064d63723bc0d756ce52c9185ea2d542a2ee0b008b41d245acd39319dc'],
  ['957', '14c70fdca0575335097e13773f2945fada9e3ebc1f83292ae85580b588a8ac01'],
  ['958', 'e3183b63925fc77c77a388c24e6e7b1e650f372203c70789bd336206e9b410f8'],
  ['959', '575dab5fb22fdb1011dfa45e8c94f56381060b853610c44ad8a8aa2cdcfed4dd'],
  ['962', '4bd89a630299e1b1681cd45baf790c0e824c0a0a3c2c8e67b3fedbc1c1d8d858'],
  ['963', '323199cdcaebf74fcb04aa11a2893789ef8a0d4cc6974e9af7375c9b0e3f1762'],
  ['964', '7f74cf0292fbc40bff0d9ce4265e113e63c27944ea791db5a884618ee5a8dca0'],
  ['965', '01cc7f3a1ee44ab396c9cb5ac56b9ee0ca07b115604a1a5d4eb58e81ceb83d5f'],
  ['967', '8f3ba3d9990a0c194ac107952440496ad5d12a33761656daf9bf597f70cdb2d2'],
  ['968', 'bf5fb2c03c90c831d24385f1e7e43789536940a93236ddc6aa5e5f1f5153c8ca'],
  ['969', 'a36ed7094e999bd0d0a8365917173f2bd9e2fb5794f1cbb3c8443bc03298d245'],
  ['970', '51719dccf3cdb1336e1aad6adef089bfffab7b9608ed571af184526b3fab3d79'],
  ['971', '437d9cff5b3cca24dcf2df9ae06d09e7235048e3de782990e0791175daefcdc6'],
  ['972', '583db8dfd6f2d1f14ae22eeaa1d404d2b3858cecdc48d50b9d31edefe51eaceb'],
  ['973', 'b4a090613ec51e6ba7ff178679194ceab240b2cf8f9d71c4dbf60afdcdbfb51f'],
  ['974', 'eebe8a3663b3fd13bb70e188a074a48ab57ef928af5f4aac01def394462ca9f1'],
  ['977', 'eaacf89b5378aa8fb43511740c5e17c2a342697427d1891afa0e145f5d73b8cd'],
  ['978', '0d8be55863621a24c648dd05a67f6cf5d2065fe089d73d3d906539a99b5500ca'],
  ['979', '58a98ce14feb3a81c63943deb69ceb80b161a04f035de05aaf5d24deeb910846'],
  ['980', '386d4f95e5d9f7b41c4592d575bf87992c5a98bca353009be1b1f43351c1ffb2'],
]);
const NEW_SECTIONS = new Set(['## Cause', '## Read set']);
/** A `path:line` source (or a range): a repository path with a folder; a bare file name is not a source. */
const PATH_SOURCE = /`([^`\s:]+\/[^`\s:]+\.[A-Za-z0-9]+):(\d+)(?:-(\d+))?`/g;
/** A command or query source in backticks; its quoted output follows on the same line after "→". */
const COMMAND_SOURCE = /`((?:node|npm|npx|gh|git|select|grep|rg) [^`]+)`/gi;
const READ_SET_ENTRY = /^- `([^`]+)` — (?:(new), )?(\d+) lines?$/;
const COUNTED_AT = /^Counted at `?([0-9a-f]{7,40})`?\.?$/i;
// Kickoffs approved before the OWASP gate existed: OWASP_GRANDFATHERED in owasp.mjs, one list for both tools.

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
    let parsed = true;
    try { JSON.parse(body); } catch (e) { parsed = false; out.push(finding('json', e.message)); }
    if (rel === 'package.json') for (const m of brokenScripts(body, exists)) out.push(finding('stale-path', m));
    if (parsed) out.push(...localeFindings(rel, body));
  } else if (ext === '.yml' || ext === '.yaml') {
    try { jsYaml().loadAll(body); } catch (e) { out.push(finding('yaml', e.message.split('\n')[0], e.mark ? e.mark.line + 1 : undefined)); }
  } else if (CODE_EXT.test(rel)) {
    const t = typescript();
    const kind = /\.tsx$/i.test(rel) ? t.ScriptKind.TSX : /\.(ts|mts|cts)$/i.test(rel) ? t.ScriptKind.TS : /\.jsx$/i.test(rel) ? t.ScriptKind.JSX : t.ScriptKind.JS;
    const sf = t.createSourceFile(rel, body, t.ScriptTarget.Latest, false, kind);
    for (const d of (sf.parseDiagnostics ?? []).slice(0, 3)) out.push(finding('syntax', t.flattenDiagnosticMessageText(d.messageText, ' '), lineOf(body, d.start ?? 0)));
    out.push(...productCodeFindings(rel, body));
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
    out.push(...ledgerFindings(rel, body, exists));
    const k = KICKOFF.exec(rel);
    if (k && Number(k[1]) >= KICKOFF_FIRST_SPRINT) out.push(...kickoffFindings(body, { task: /_Task_(\d+)_/.exec(rel)?.[1] }), ...owaspFindings(rel, body));
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

const FINDINGS_LEDGER = /^docs\/security\/.+\/findings[^/]*\.md$/;
const FINDING_ROW = /^\| ([A-Z]+-\d+) \|/;
/**
 * The golden rule (owner, 2026-11-07, translated: "you are forbidden to walk past the gaps you find and only report that
 * you found something but did not fix it; this must be a golden, inviolable rule, always"). Every finding row of an
 * audit ledger ends in one of: `fixed …` with the existing test or tool that proves it; `not a gap …` with the existing
 * test that proves the control holds; `accepted …` only with the owner's decision (D<n>) and its existing test; or the
 * open task(s) `Task N` that close it, each of whose kickoff cites the finding's ID (the backlog row when the task has no
 * kickoff yet). A finding that is only reported fails.
 */
export function ledgerFindings(rel, body, exists, { root = ROOT } = {}) {
  if (!FINDINGS_LEDGER.test(rel)) return [];
  const out = [];
  const backlogFile = path.join(root, 'docs', 'backlog.md');
  const backlog = existsSync(backlogFile) ? readFileSync(backlogFile, 'utf8') : '';
  const kickoffDir = path.join(root, 'tasks', 'Sprints');
  const kickoffs = existsSync(kickoffDir) ? readdirSync(kickoffDir) : [];
  const paths = (s) => [...s.matchAll(/`([^`\s]+\/[^`\s]+\.[a-z]+)(?::\d+)?`/g)].map((m) => m[1]).filter((p) => exists(p));
  body.split('\n').forEach((line, i) => {
    const m = FINDING_ROW.exec(line);
    if (!m) return;
    const id = m[1];
    const status = line.replace(/\s*\|\s*$/, '').split(' | ').pop().trim();
    const bad = (message) => out.push(finding('finding-status', `${id}: ${message}`, i + 1));
    if (/^fixed\b/i.test(status)) { if (!paths(status).length) bad('"fixed" names the existing test or tool that proves it (a backticked path)'); return; }
    if (/^not a gap\b/i.test(status)) { if (!paths(status).length) bad('"not a gap" names the existing test that proves the control holds (a backticked path)'); return; }
    if (/^accepted\b/i.test(status)) {
      if (!/\bD\d+\b/.test(status)) bad('only the owner accepts a risk: name the owner decision (D<n>), or fix it, or hand it to a task');
      else if (!paths(status).length) bad('an accepted risk names the existing test that bounds it (a backticked path)');
      return;
    }
    const tasks = [...status.matchAll(/\bTask (\d+)\b/g)].map((t) => t[1]);
    if (!tasks.length) { bad('only reported: fix it (with its test), hand it to an open task that cites it, or name the owner decision that accepts it'); return; }
    for (const n of new Set(tasks)) {
      if (!backlog.includes(`**${n}**`)) { bad(`Task ${n} is not an open task of docs/backlog.md`); continue; }
      const k = kickoffs.find((f) => new RegExp(`^Sprint_\\d+_kickoff_prompt_Task_${n}_`).test(f));
      if (k ? !readFileSync(path.join(kickoffDir, k), 'utf8').includes(id) : !new RegExp(`\\*\\*${n}\\*\\*[^\\n]*\\b${id}\\b`).test(backlog)) {
        bad(`Task ${n} does not cite ${id} (${k ? `tasks/Sprints/${k}` : 'its docs/backlog.md row; it has no kickoff yet'}): the finding is closed only by a task that carries it`);
      }
    }
  });
  return out;
}

let icuParse;
/** Locale data (owner 2026-11-07: "quality protection" of the translations, not a key census): every value of every
 *  locale through locale-safety.mjs M1-M5 (markup, dangerous schemes, plain http, ICU validity, placeholder parity) at
 *  every commit (pre-commit hook) and CI run — the locale under check from its own (staged) text, the others from disk. */
export function localeFindings(rel, body) {
  const locale = /^messages\/([a-z]{2})\.json$/.exec(rel)?.[1];
  if (!locale || !LOCALES.includes(locale)) return [];
  const messages = {};
  for (const l of LOCALES) {
    try { messages[l] = l === locale ? JSON.parse(body) : JSON.parse(readFileSync(path.join(ROOT, 'messages', `${l}.json`), 'utf8')); } catch { /* that file's own check reports it */ }
  }
  icuParse ??= loadParser(ROOT);
  return localeCheck(messages, [], icuParse)
    .filter((f) => /^M[1-5]$/.test(f.id) || (f.id === 'M0' && !f.at.startsWith('src/')))
    .map((f) => finding('locale', `${f.id} ${f.at}: ${f.message} (scripts/quality/locale-safety.mjs)`));
}

/** Product code: the client sinks of client-sinks.mjs (K1-K8) and the translation calls that bypass next-intl's text
 *  output (locale-safety.mjs M6), on the file's own text, at every commit (pre-commit hook) and CI run. */
export function productCodeFindings(rel, body) {
  if (!SINK_PRODUCT(rel)) return [];
  const sinks = sinkScan([{ file: rel, text: body }]).filter((f) => f.file === rel)
    .map((f) => finding('client-sink', `${f.id} ${f.message} (scripts/quality/client-sinks.mjs)`, f.line || undefined));
  icuParse ??= loadParser(ROOT);
  const bypass = localeCheck({}, [{ file: rel, text: body }], icuParse, [])
    .filter((f) => f.id === 'M6' || (f.id === 'M0' && f.at === rel))
    .map((f) => finding('locale', `${f.id} ${f.message} (scripts/quality/locale-safety.mjs)`, Number(/:(\d+)$/.exec(f.at)?.[1]) || undefined));
  return [...sinks, ...bypass];
}

let owaspData;
/** The OWASP gate on a kickoff (scripts/quality/owasp.mjs): "## OWASP" names every sheet the task triggers, with a quote
 *  verified against the sheet's text and the acceptance criteria that implement it; a written review has its record
 *  under docs/security/owasp/reviews/. */
export function owaspFindings(rel, body) {
  const task = /_Task_(\d+)_/.exec(rel)?.[1];
  if (OWASP_GRANDFATHERED.has(task)) return [];
  owaspData ??= { registry: loadJson(REGISTRY, ROOT), controls: loadJson(CONTROLS, ROOT) };
  if (!owaspData.registry || !owaspData.controls) return [finding('owasp', `${REGISTRY} or ${CONTROLS} is missing: run node scripts/quality/owasp.mjs sync`)];
  return [...checkKickoff(body, owaspData.registry, owaspData.controls), ...checkReview(body, owaspData.registry, owaspData.controls, [], { record: readReviewRecord(rel, ROOT) })]
    .filter((f) => !f.message.startsWith('missing section "## OWASP"')) // kickoffFindings reports the missing section
    .map((f) => finding('owasp', f.message, f.line));
}

/** The number of lines of a repository file (a final newline ends the last line), or null when it is not a regular file
 *  inside the repository (a path that leaves the root, or a folder, is never read). */
export function lineCount(rel, { root = ROOT } = {}) {
  const abs = path.resolve(root, rel);
  const inside = path.relative(root, abs);
  if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) return null;
  const buf = readRegularFile(abs);
  return buf ? countLines(buf) : null;
}

/** The number of lines of a text (a final newline ends the last line). */
function countLines(buf) {
  const lines = buf.toString('utf8').split('\n');
  return lines.length > 1 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
}

const HEX_COMMIT = /^[0-9a-f]{7,40}$/i;
/**
 * The files of a commit, read with Git: `exists(sha)` is true for a commit of this repository, `lineCount(sha, rel)` is the
 * number of lines of the file `rel` in it, or null when it holds no such file. CI checks out every branch and tag
 * (`fetch-depth: 0`), so a commit the owner pushed with the branch is there; one that is not makes the check fail, never
 * skip.
 */
export const commitLines = {
  exists: (sha) => HEX_COMMIT.test(sha) && spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: ROOT, windowsHide: true }).status === 0,
  lineCount: (sha, rel) => {
    if (!HEX_COMMIT.test(sha)) return null;
    const r = spawnSync('git', ['cat-file', 'blob', `${sha}:${rel}`], { cwd: ROOT, encoding: 'buffer', maxBuffer: 1 << 28, windowsHide: true });
    return r.status === 0 ? countLines(r.stdout) : null;
  },
};

/** The lines of one section (without its heading) and the 1-based number of its first line, or null without the section. */
function sectionLines(lines, heading) {
  const i = lines.findIndex((l) => l.trim() === heading);
  if (i < 0) return null;
  const end = lines.findIndex((l, j) => j > i && /^## /.test(l));
  return { first: i + 2, lines: lines.slice(i + 1, end < 0 ? undefined : end) };
}

/**
 * "## Cause" names the fact behind the problem with its sources and the fix: a `path:line` source is a file of the
 * "Counted at" commit that has that line, a command source quotes its output after "→" (F21). The source is read where
 * the cause was read, so a fix that deletes the file leaves its kickoff valid (F26); without a commit this repository
 * holds (itself a finding below) the file now is read. "## Read set" names the commit its counts were taken at and lists
 * the files to change with their line counts, within MAX_READ_SET_LINES; every count is compared with that commit on
 * every run, so the numbers come from Git, not from the model (F20). `lineCount(rel)` reads the file now; `atCommit`
 * reads a commit (`commitLines`).
 */
export function causeAndReadSetFindings(lines, { lineCount: count = lineCount, atCommit = commitLines } = {}) {
  const out = [];
  const set = sectionLines(lines, '## Read set');
  const sha = set?.lines.map((l) => COUNTED_AT.exec(l.trim())).find(Boolean)?.[1] ?? null;
  const known = sha !== null && atCommit.exists(sha);
  const sourceLines = known ? (file) => atCommit.lineCount(sha, file) : count;
  const cause = sectionLines(lines, '## Cause');
  if (cause) {
    let sources = 0;
    cause.lines.forEach((l, k) => {
      for (const m of l.matchAll(PATH_SOURCE)) {
        const [, file, from, to] = m;
        const cited = `${file}:${from}${to ? `-${to}` : ''}`;
        const total = sourceLines(file);
        if (total === null) out.push(finding('kickoff', `"## Cause" cites \`${cited}\`, which is not in ${known ? sha : 'the repository'}`, cause.first + k));
        else if (Number(from) < 1 || Number(to ?? from) > total) out.push(finding('kickoff', `"## Cause" cites \`${cited}\`, but ${file} has ${total} lines${known ? ` at ${sha}` : ''}`, cause.first + k));
        else sources++;
      }
      for (const m of l.matchAll(COMMAND_SOURCE)) {
        if (/→\s*\S/.test(l.slice(m.index + m[0].length))) sources++;
        else out.push(finding('kickoff', `"## Cause" names the command \`${m[1]}\` but quotes no output (write "→ <its output>" after it)`, cause.first + k));
      }
    });
    if (!sources) out.push(finding('kickoff', '"## Cause" names no source of the fact (`path:line` with a folder, or a `command` or query followed by "→ <its output>")', cause.first - 1));
    if (!cause.lines.some((l) => /^Fix: \S/.test(l))) out.push(finding('kickoff', '"## Cause" has no "Fix: <the change that removes the cause>" line', cause.first - 1));
  }
  if (set) {
    if (!sha) out.push(finding('kickoff', '"## Read set" has no "Counted at <commit>" line (the commit whose files the counts were taken from)', set.first - 1));
    if (sha && !known) out.push(finding('kickoff', `"## Read set": ${sha} is not a commit of this repository (the counts are checked against it; push the branch that holds it)`, set.first - 1));
    let total = 0;
    let entries = 0;
    set.lines.forEach((l, k) => {
      if (!l.trim() || COUNTED_AT.test(l.trim())) return;
      const m = READ_SET_ENTRY.exec(l);
      if (!m) { out.push(finding('kickoff', '"## Read set" line must be "Counted at <commit>", "- `path` — <n> lines" or "- `path` — new, <n> lines"', set.first + k)); return; }
      entries++;
      total += Number(m[3]);
      if (!known) return;
      const actual = atCommit.lineCount(sha, m[1]);
      if (m[2] && actual !== null) out.push(finding('kickoff', `${m[1]} is in ${sha}, so it is not new (${actual} lines)`, set.first + k));
      if (!m[2] && actual === null) out.push(finding('kickoff', `${m[1]} is not in ${sha}: mark it "new, <n> lines"`, set.first + k));
      if (!m[2] && actual !== null && actual !== Number(m[3])) out.push(finding('kickoff', `${m[1]} has ${actual} lines at ${sha}, not ${m[3]}`, set.first + k));
    });
    if (!entries) out.push(finding('kickoff', '"## Read set" lists no file', set.first - 1));
    if (total > MAX_READ_SET_LINES) out.push(finding('kickoff', `the read set is ${total} lines > ${MAX_READ_SET_LINES} (flow.md §1: split the task)`, set.first - 1));
  }
  return out;
}

/** A kickoff written from Sprint 93 on follows .claude/rules/kickoff-template.md. */
export function kickoffFindings(body, { task, lineCount: count = lineCount, atCommit = commitLines, grandfathered = CAUSE_GRANDFATHERED } = {}) {
  const out = [];
  const lines = body.split('\n');
  // The "## OWASP" section is a checklist with one line per required sheet; it does not count towards the length limit.
  const owaspStart = lines.findIndex((l) => l.trim() === '## OWASP');
  const owaspEnd = owaspStart < 0 ? -1 : lines.findIndex((l, i) => i > owaspStart && /^## /.test(l));
  const owaspLines = owaspStart < 0 ? 0 : (owaspEnd < 0 ? lines.length : owaspEnd) - owaspStart;
  if (lines.length - owaspLines > KICKOFF_MAX_LINES + 1) out.push(finding('kickoff', `${lines.length - owaspLines} lines > ${KICKOFF_MAX_LINES}, the "## OWASP" checklist not counted (flow.md §1: split the task)`));
  if (!/^# Task \d+ — \S/.test(lines[0] ?? '')) out.push(finding('kickoff', 'first line must be "# Task <n> — <outcome>"', 1));
  let last = -1;
  // the text recorded on 2026-11-16, unchanged: written before the rule; any revision since is held to it
  const oldRule = grandfathered.has(task) && grandfathered.get(task) === kickoffHash(body);
  for (const s of KICKOFF_SECTIONS.filter((x) => !oldRule || !NEW_SECTIONS.has(x))) {
    const i = lines.findIndex((l) => l.trim() === s);
    if (i < 0) out.push(finding('kickoff', `missing section "${s}" (kickoff-template.md)`));
    else if (i < last) out.push(finding('kickoff', `section "${s}" is out of order`, i + 1));
    else last = i;
  }
  if (!oldRule) out.push(...causeAndReadSetFindings(lines, { lineCount: count, atCommit }));
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

/** The bytes of a regular file, or null. One file descriptor serves the type check and the read, so the file cannot be
 *  swapped between them (CodeQL js/file-system-race). */
export function readRegularFile(abs) {
  let fd;
  try {
    fd = openSync(abs, 'r');
    return fstatSync(fd).isFile() ? readFileSync(fd) : null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
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
    else buf = readRegularFile(abs);
    if (!buf) { findings.set(f.rel, [finding('missing', 'file does not exist')]); continue; }
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

if (isEntryPoint(import.meta.url)) {
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
