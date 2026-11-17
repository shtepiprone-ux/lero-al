#!/usr/bin/env node
// Dependency audit gate (Task 972 Revision 3). OWASP basis: Vulnerable Dependency Management (automated analysis of the
// dependencies on every change; a risk without a fix is accepted only explicitly) and CI/CD Security.
//
//   node scripts/quality/audit-gate.mjs --level <low|moderate|high|critical> [--omit-dev]
//
// Runs `npm audit --json` (with `--omit=dev` when asked) and fails on every advisory at or above the level, like
// `npm audit --audit-level=<level>`, except an advisory listed in scripts/quality/audit-exceptions.json. Only the owner
// accepts a risk (flow.md, golden rule): each entry names the owner decision, the advisory id, the one package, the
// vulnerable range npm reports, the package's latest version on npm and an expiry date. The entry stops matching, and
// the gate fails again, when the range changes, when the package publishes a new latest version (a fix may exist) or
// on its expiry date. A report npm could not produce fails closed. Exit 1 on a blocking advisory or a bad exceptions
// file, 2 when the audit cannot run.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const EXCEPTIONS_FILE = path.join(ROOT, 'scripts', 'quality', 'audit-exceptions.json');
const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const LEVELS = ['low', 'moderate', 'high', 'critical'];
const FIELDS = ['advisory', 'package', 'range', 'latest', 'decision', 'decidedOn', 'expires'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `--level <level>` (required) and `--omit-dev`; anything else is refused. */
export function parseArgs(argv) {
  let level = null;
  let omitDev = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--level') level = argv[++i];
    else if (argv[i] === '--omit-dev') omitDev = true;
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!LEVELS.includes(level)) throw new Error(`--level must be one of ${LEVELS.join(', ')}`);
  return { level, omitDev };
}

/** Problems with the exceptions file: every entry complete, dated, decided by the owner, one entry per advisory. */
export function exceptionProblems(file) {
  if (!Array.isArray(file?.exceptions)) return ['audit-exceptions.json has no "exceptions" array'];
  const out = [];
  const seen = new Set();
  for (const e of file.exceptions) {
    const missing = FIELDS.filter((f) => typeof e?.[f] !== 'string' || !e[f]);
    if (missing.length) { out.push(`${e?.advisory ?? '?'}: missing ${missing.join(', ')}`); continue; }
    if (!/^O\d+-\d+$/.test(e.decision)) out.push(`${e.advisory}: decision "${e.decision}" is not an owner decision O<task>-<n>`);
    else if (!DATE.test(e.expires) || !DATE.test(e.decidedOn) || Number.isNaN(Date.parse(e.expires)) || Number.isNaN(Date.parse(e.decidedOn))) out.push(`${e.advisory}: decidedOn and expires must be dates YYYY-MM-DD`);
    else if (seen.has(e.advisory)) out.push(`${e.advisory}: listed twice`);
    seen.add(e.advisory);
  }
  return out;
}

/** The advisories of an `npm audit --json` report at or above `level`, split into blocking and accepted. */
export function auditFindings(report, exceptions, { level, now = Date.now(), latestOf }) {
  if (!report || typeof report !== 'object' || report.error || !report.vulnerabilities || typeof report.vulnerabilities !== 'object') {
    throw new Error(`npm audit produced no report${report?.error ? `: ${report.error.code ?? ''} ${report.error.summary ?? ''}` : ''}`);
  }
  const advisories = new Map();
  for (const entry of Object.values(report.vulnerabilities)) {
    for (const via of entry?.via ?? []) {
      if (!via || typeof via !== 'object') continue; // a package name: that package's own entry carries the advisory
      if (!(via.severity in RANK)) throw new Error(`npm audit reported an unknown severity "${via.severity}" for ${via.name}`);
      const id = String(via.url ?? via.source).split('/').pop();
      advisories.set(`${id} ${via.name}`, { id, name: via.name, severity: via.severity, range: via.range, title: via.title });
    }
  }
  const blocking = [];
  const accepted = [];
  for (const a of advisories.values()) {
    if (RANK[a.severity] < RANK[level]) continue;
    const e = exceptions.find((x) => x.advisory === a.id && x.package === a.name);
    let reason = null;
    if (!e) reason = 'no owner decision accepts it';
    else if (now >= Date.parse(`${e.expires}T00:00:00Z`)) reason = `the acceptance ${e.decision} expired on ${e.expires}`;
    else if (e.range !== a.range) reason = `the advisory range is now "${a.range}", ${e.decision} accepted "${e.range}"`;
    else {
      const current = latestOf(a.name);
      if (current !== e.latest) reason = `${a.name} latest on npm is now ${current ?? 'unknown'}, ${e.decision} accepted it at ${e.latest}: a fix may exist`;
    }
    (reason ? blocking : accepted).push({ ...a, reason, decision: e?.decision });
  }
  return { blocking, accepted };
}

const isNpmName = (name) => typeof name === 'string' && name.length <= 214 && /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/i.test(name);
const npm = (args) => spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, shell: process.platform === 'win32', windowsHide: true });

function latestOnNpm(name) {
  if (!isNpmName(name)) return null; // names reach a shell on Windows (OS Command Injection Defense)
  const r = npm(['view', name, 'dist-tags.latest']);
  return r.status === 0 ? r.stdout.trim() || null : null;
}

if (isEntryPoint(import.meta.url)) {
  let args;
  try { args = parseArgs(process.argv.slice(2)); } catch (err) { console.error(`audit-gate: ${err.message}`); process.exit(2); }
  const file = JSON.parse(readFileSync(EXCEPTIONS_FILE, 'utf8'));
  const problems = exceptionProblems(file);
  for (const p of problems) console.error(`audit-gate: ${p}`);
  const r = npm(['audit', '--json', ...(args.omitDev ? ['--omit=dev'] : [])]);
  let report;
  try { report = JSON.parse(r.stdout); } catch { console.error(`audit-gate: npm audit gave no JSON (exit ${r.status}): ${(r.stderr || '').trim().slice(0, 300)}`); process.exit(2); }
  let result;
  try { result = auditFindings(report, problems.length ? [] : file.exceptions, { level: args.level, latestOf: latestOnNpm }); } catch (err) { console.error(`audit-gate: ${err.message}`); process.exit(2); }
  const scope = args.omitDev ? 'production dependencies' : 'every dependency';
  for (const a of result.accepted) console.log(`accepted by ${a.decision}: ${a.id} ${a.name} ${a.range} (${a.severity})`);
  for (const b of result.blocking) console.log(`BLOCKING: ${b.id} ${b.name} ${b.range} (${b.severity}) — ${b.reason}`);
  console.log(`audit-gate: ${scope}, level ${args.level}: ${result.blocking.length} blocking, ${result.accepted.length} accepted by an owner decision`);
  process.exit(result.blocking.length || problems.length ? 1 : 0);
}
