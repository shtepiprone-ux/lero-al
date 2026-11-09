#!/usr/bin/env node
// The open code-scanning (CodeQL) alerts of a pull request or branch (Task 951 AC1, written by Opus 2026-11-09).
// OWASP basis: CI/CD Security (a scanner's findings are a gate, not a report), Secure Code Review (tools first).
//
//   node scripts/quality/codeql-alerts.mjs --ref refs/pull/19/merge [--repo shtepiprone-ux/lero-al]
//
// Reads the GitHub code-scanning API with the GitHub CLI and prints each open alert as `rule path:line`.
// Exit 0: none open. Exit 1: alerts are open. Exit 2: the alerts could not be read (never reported as "none").
import { spawnSync } from 'node:child_process';
import { isEntryPoint } from '../lib/entry-point.mjs';

const PULL_REF = /^refs\/pull\/\d+\/(merge|head)$/;
const BRANCH_REF = /^refs\/heads\/[A-Za-z0-9._/-]+$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** A ref the API may be asked about: a pull request's merge or head ref, or a branch without `..`. */
export function isScanRef(ref) {
  const s = String(ref ?? '');
  return PULL_REF.test(s) || (BRANCH_REF.test(s) && !s.includes('..'));
}

/** The top-level JSON values of `text` (gh --paginate prints one array per page, back to back). */
function topLevelValues(text) {
  const out = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '[' || c === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) out.push(text.slice(start, i + 1));
    } else if (depth === 0 && !/\s/.test(c)) throw new Error(`cannot read the alerts: unexpected text at ${i}`);
  }
  if (depth !== 0 || inString || out.length === 0) throw new Error('cannot read the alerts: incomplete JSON');
  return out;
}

/** The open alerts of a gh response, sorted by path and line. Anything that is not a list of alerts is refused. */
export function parseAlerts(text) {
  const alerts = [];
  for (const value of topLevelValues(String(text ?? ''))) {
    const page = JSON.parse(value);
    if (!Array.isArray(page)) throw new Error('cannot read the alerts: the response is not a list');
    for (const a of page) {
      const location = a?.most_recent_instance?.location;
      if (!Number.isInteger(a?.number) || typeof a?.state !== 'string' || typeof a?.rule?.id !== 'string' || typeof location?.path !== 'string') {
        throw new Error('cannot read the alerts: an entry has no number, state, rule or location');
      }
      if (a.state === 'open') alerts.push({ number: a.number, rule: a.rule.id, path: location.path, line: location.start_line ?? 0 });
    }
  }
  return alerts.sort((x, y) => x.path.localeCompare(y.path) || x.line - y.line || x.number - y.number);
}

export const formatAlert = (a) => `${a.rule} ${a.path}:${a.line}`;

/** { code, lines }: 0 none open, 1 open (one line per alert), 2 could not read (the reason). `run` is spawnSync's shape. */
export function openAlerts({ ref, repo, run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 }) }) {
  if (!isScanRef(ref)) return { code: 2, lines: [`--ref must be refs/pull/<n>/merge|head or refs/heads/<branch>, got ${JSON.stringify(ref)}`] };
  if (!REPO.test(String(repo ?? ''))) return { code: 2, lines: [`--repo must be <owner>/<name>, got ${JSON.stringify(repo)}`] };
  const r = run('gh', ['api', '--paginate', `repos/${repo}/code-scanning/alerts?ref=${encodeURIComponent(ref)}&state=open&per_page=100`]);
  if (r.error || r.status !== 0) return { code: 2, lines: [`gh could not read the alerts: ${String(r.error?.message ?? r.stderr ?? '').trim()}`] };
  try {
    const alerts = parseAlerts(r.stdout);
    return { code: alerts.length ? 1 : 0, lines: alerts.map(formatAlert) };
  } catch (error) {
    return { code: 2, lines: [error.message] };
  }
}

if (isEntryPoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
  const { code, lines } = openAlerts({ ref: arg('--ref'), repo: arg('--repo', 'shtepiprone-ux/lero-al') });
  for (const line of lines) (code === 2 ? console.error : console.log)(line);
  console.log(code === 0 ? 'codeql-alerts: no open alert' : code === 1 ? `codeql-alerts: ${lines.length} open alert(s)` : 'codeql-alerts: could not read the alerts');
  process.exit(code);
}
