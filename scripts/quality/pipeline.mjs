#!/usr/bin/env node
// Step-by-step pipeline for every task phase (owner, 2026-11-10, translated: "you must never do your work partially,
// it is strictly forbidden"; "there must be a clear workflow and pipeline that closes these holes in the rules, and
// tasks will always be created, executed and reviewed step by step").
//
// OWASP basis: Verifying Third Party Agent Execution Evidence (an agent's claim is checked against evidence bound to
// the exact inputs, not trusted), AI Agent Security (the agent's output is gated by code), Secure Code Review (tools
// first, every step), CI/CD Security (what is handed over is what was checked).
//
//   node scripts/quality/pipeline.mjs run <phase> [<kickoff>] [--base main]
//       runs the phase's steps of scripts/quality/pipeline-steps.json in order, stops at the first failing step and
//       writes the ledger <git dir>/lero-al-pipeline/<key>.json: the fingerprint of what was checked, and per step
//       the argv, exit code, SHA-256 of the output, start and duration. Exit 0 only when every step passed.
//   node scripts/quality/pipeline.mjs status <phase> [<kickoff>]   is the phase complete for the current files?
//   node scripts/quality/pipeline.mjs ci-status <pr>               every check of the PR's head: concluded or not
//   node scripts/quality/pipeline.mjs stop                         Stop / SubagentStop hook (see stopFindings)
//
// Phases: design (Opus, flow.md §1), execute (Sonnet, §2), review (Opus, §3), handoff (Opus, §4). A step is an argv
// started without a shell, or a built-in check of this file. No command is taken from the hook payload or the reply;
// the commands a kickoff names are run only in the shape `node scripts/<path>` or `npm run <script of package.json>`.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';
import { kickoffAcs } from './ac-tests.mjs';
import { spawnLogged } from './ci-local.mjs';
import { readRegularFile } from './check-files.mjs';
import { lastVerdict, section, VERDICT_LINE } from './owasp.mjs';
import { commands } from './push-safety.mjs';
import { isOwnerMessage, loadVocabulary, looksAtCi, mentionsCi } from './claims.mjs';
import { provenanceFindings } from './provenance.mjs';
import { fixtureHidden, isFixturePath, sweepStaleFixture } from './test-fixtures.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STEPS_FILE = 'scripts/quality/pipeline-steps.json';
export const MAX_STOP_BLOCKS = 3;
const KICKOFF = /^tasks\/Sprints\/[^/]+_kickoff_prompt_Task_\d+_[^/]*\.md$/;
const SAFE_ARG = /^[\w./:=@,+-]+$/;
// Documentation and task records: a review written into them does not change the code an execute ledger checked.
const DOC = /^(?:(?:docs|tasks)\/.*|.*\.md)$/;

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function git(args, root) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return r.stdout;
}
const zlist = (s) => s.split('\0').filter(Boolean);

/** Every changed path against HEAD, untracked and not ignored ones included: { path: sha256 of bytes | '-' (deleted) }. */
export function changedPaths(root = ROOT) {
  const paths = new Set([...zlist(git(['diff', 'HEAD', '--name-only', '-z'], root)), ...zlist(git(['ls-files', '-z', '--others', '--exclude-standard'], root))]);
  // keyed by repository paths: a file named __proto__ stays a key (Prototype Pollution Prevention)
  const out = Object.create(null);
  for (const rel of [...paths].sort()) {
    // one descriptor for the type check and the read (CodeQL js/file-system-race); null for a deleted or non-regular path
    const bytes = readRegularFile(path.join(root, rel));
    out[rel] = bytes ? sha256(bytes) : '-';
  }
  return out;
}

/**
 * What a ledger is bound to. `tree`: HEAD's tree and every changed path's bytes; `code`: the same without changed
 * documentation and task records (the execute phase: Opus's review notes do not change Sonnet's code); `kickoff`: the
 * kickoff and the backlog.
 */
export function fingerprint(scope, { root = ROOT, kickoff = null } = {}) {
  if (scope === 'kickoff') {
    if (!kickoff) throw new Error('a kickoff-scoped phase needs the kickoff path');
    const read = (rel) => readRegularFile(path.join(root, rel)) ?? Buffer.from('-'); // one descriptor (CodeQL js/file-system-race)
    return sha256(Buffer.concat([Buffer.from(`${kickoff}\0`), read(kickoff), Buffer.from('\0'), read('docs/backlog.md')]));
  }
  if (scope !== 'tree' && scope !== 'code') throw new Error(`unknown fingerprint scope ${scope}`);
  const tree = git(['rev-parse', 'HEAD^{tree}'], root).trim();
  const entries = Object.entries(changedPaths(root)).filter(([p]) => scope === 'tree' || !DOC.test(p));
  return sha256(`${scope}\n${tree}\n${entries.map(([p, h]) => `${p}\0${h}`).join('\n')}`);
}

export function loadPhases(root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, STEPS_FILE), 'utf8')).phases;
}

export function ledgerDir(root = ROOT) {
  return path.join(path.resolve(root, git(['rev-parse', '--git-dir'], root).trim()), 'lero-al-pipeline');
}

export function taskKey(kickoff) {
  return /_Task_(\d+)_/.exec(kickoff ?? '')?.[1] ?? null;
}

export function ledgerFile(phase, kickoff, root = ROOT) {
  const task = taskKey(kickoff);
  return path.join(ledgerDir(root), `${task ? `Task_${task}-` : ''}${phase}.json`);
}

export function readLedger(phase, kickoff, root = ROOT) {
  try { return JSON.parse(readFileSync(ledgerFile(phase, kickoff, root), 'utf8')); } catch { return null; }
}

/** True when the ledger has every step of the phase, each with exit 0, for this fingerprint. */
export function isComplete(ledger, phaseDef, fp) {
  if (!ledger || ledger.fingerprint !== fp || !Array.isArray(ledger.steps)) return false;
  const ran = new Map(ledger.steps.map((s) => [s.id, s.exit]));
  // a step the phase defines as "skip" under revision counts only in a ledger of a run under revision that skipped it;
  // the fingerprint binds the kickoff, so a verdict changed after the run makes the ledger stale
  const skipped = new Set(ledger.underRevision === true ? ledger.steps.filter((s) => s.skipped).map((s) => s.id) : []);
  return phaseDef.steps.every((s) => ran.get(s.id) === 0 || (s.underRevision === 'skip' && skipped.has(s.id)));
}

/** npm is a .cmd shim on Windows; start its CLI with this Node instead, so no shell is ever involved. */
export function resolveArgv(argv) {
  if (argv[0] === 'node') return [process.execPath, ...argv.slice(1)];
  if (argv[0] === 'npm' || argv[0] === 'npx') {
    const cli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', `${argv[0]}-cli.js`);
    if (existsSync(cli)) return [process.execPath, cli, ...argv.slice(1)];
  }
  return argv;
}

// A step's output goes to a file, never through a pipe: a process the step left that keeps a pipe open would hold the
// phase past its deadline with no sign of life (ci-local.mjs spawnLogged, owner 2026-11-11: "monitor every stage and
// its status"). A step past its deadline is exit 124 and what it started is stopped.
function runArgv(argv, root, timeoutMs) {
  const [cmd, ...args] = resolveArgv(argv);
  const dir = path.join(ledgerDir(root), 'out');
  mkdirSync(dir, { recursive: true });
  const log = path.join(dir, `step-${process.pid}-${Date.now()}.log`);
  const r = spawnLogged(cmd, args, { cwd: root, env: { ...process.env, FORCE_COLOR: '0' }, timeoutMs, token: null, log });
  rmSync(log, { force: true });
  return { exit: r.exit, output: r.timedOut ? `${r.output}\nstep timed out after ${Math.round(timeoutMs / 60_000)} min` : r.output };
}

/** Commands an acceptance criterion names in backticks, in the only shapes that are run: `node scripts/…`, `npm run <script>`. */
export function namedCommands(text, scripts = {}) {
  const out = [];
  for (const m of String(text).matchAll(/`((?:node|npm run) [^`]+)`/g)) {
    const w = m[1].trim().split(/\s+/);
    if (!w.every((x) => SAFE_ARG.test(x.replace(/^"|"$/g, '')))) continue;
    if (w[0] === 'node' && /^scripts\/[\w./-]+\.m?js$/.test(w[1]) && !w[1].includes('..')) out.push(w.map((x) => x.replace(/^"|"$/g, '')));
    if (w[0] === 'npm' && w[1] === 'run' && Object.hasOwn(scripts, w[2])) out.push(w);
  }
  return out;
}

/** The runs that execute every test the kickoff's acceptance criteria name. */
export function kickoffTestRuns(body, { files, scripts = {} }) {
  const mjs = new Set();
  const vitest = new Set();
  const cmds = [];
  const missing = [];
  for (const ac of kickoffAcs(body)) {
    for (const t of ac.tests) {
      const found = t.includes('/') ? (files.has(t) ? [t] : []) : [...files].filter((f) => f.endsWith(`/${t}`));
      if (!found.length) { missing.push(`${ac.id}: ${t}`); continue; }
      for (const f of found) {
        if (/\.stories\.tsx$/.test(f)) continue; // Stories run in the Storybook, locale-leak and homepage jobs of ci-local
        (/^scripts\/quality\/.*\.test\.mjs$/.test(f) ? mjs : vitest).add(f);
      }
    }
    for (const c of namedCommands(ac.text, scripts)) cmds.push(c);
  }
  const runs = [];
  if (mjs.size) runs.push(['node', '--test', ...[...mjs].sort()]);
  if (vitest.size) runs.push(['npx', 'vitest', 'run', ...[...vitest].sort()]);
  for (const c of cmds) runs.push(c);
  return { runs, missing };
}

/** Paths a Route step names in backticks that neither exist nor are named in Scope (a file the task creates). */
export function missingRoutePaths(body, exists) {
  const route = (section(body, '## Route') ?? []).map((l) => l.text).join('\n');
  const scope = (section(body, '## Scope') ?? []).map((l) => l.text).join('\n');
  const out = [];
  for (const m of route.matchAll(/`([^`\s]+)`/g)) {
    const p = m[1].replace(/[),.;:]+$/, '');
    if (!/^[\w.-]+(\/[\w.@[\]-]+)+\.\w+$/.test(p) && !/^\.?[\w-]+\/[\w./-]+\/$/.test(p)) continue;
    if (!exists(p) && !scope.includes(p)) out.push(p);
  }
  return [...new Set(out)];
}

const BUILTIN = {
  'route-paths': ({ body, root }) => {
    const miss = missingRoutePaths(body, (p) => existsSync(path.join(root, p)));
    return miss.length ? { exit: 1, output: `Route names paths that do not exist and are not in Scope: ${miss.join(', ')}` } : { exit: 0, output: 'every Route path exists or is created by the Scope' };
  },
  'ac-names-test': ({ body }) => {
    const acs = kickoffAcs(body);
    const bad = acs.filter((a) => !/\btest:\s*\S/.test(a.text)).map((a) => a.id);
    if (!acs.length) return { exit: 1, output: 'no "- AC<n>" acceptance criterion' };
    return bad.length ? { exit: 1, output: `criteria without "test: <test>": ${bad.join(', ')}` } : { exit: 0, output: `${acs.length} criteria, each names its test` };
  },
  'kickoff-tests': ({ body, root, timeoutMs }) => {
    const files = new Set(zlist(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], root)));
    const scripts = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).scripts ?? {};
    const { runs, missing } = kickoffTestRuns(body, { files, scripts });
    if (missing.length) return { exit: 1, output: `named tests that do not exist: ${missing.join(', ')}` };
    let output = '';
    for (const argv of runs) {
      const r = runArgv(argv, root, timeoutMs);
      output += `$ ${argv.join(' ')}\n${r.output}\n`;
      if (r.exit !== 0) return { exit: r.exit, output };
    }
    return { exit: 0, output: output || 'the criteria name no runnable test' };
  },
  verdict: ({ body, kickoff, root }) => {
    const verdicts = (section(body, '## Review') ?? []).map((l) => VERDICT_LINE.exec(l.text.trim())?.[1]).filter(Boolean);
    const task = taskKey(kickoff);
    const record = `docs/security/owasp/reviews/Task_${task}.json`;
    if (!verdicts.length) return { exit: 1, output: 'the Review section has no verdict line (Review N — APPROVED | APPROVED WITH NOTES | NEEDS REVISION)' };
    if (!existsSync(path.join(root, record))) return { exit: 1, output: `the OWASP review record ${record} is missing` };
    return { exit: 0, output: `verdict ${verdicts.at(-1)}, record ${record}` };
  },
};

/**
 * Runs one phase. `phases` and `exec`-able built-ins are injectable for the tests.
 * @returns {{ ledger: object, complete: boolean, failed: string|null }}
 */
export function runPhase(phase, { kickoff = null, base = 'main', root = ROOT, phases = loadPhases(root), log = () => {}, timeoutMs = 3 * 60 * 60 * 1000 } = {}) {
  const def = phases[phase];
  if (!def) throw new Error(`unknown phase ${phase}; phases: ${Object.keys(phases).join(', ')}`);
  if (!/^[A-Za-z0-9][\w./~^-]*$/.test(base)) throw new Error(`refused base ${JSON.stringify(base)}: not a git ref or commit`);
  const needsKickoff = def.scope === 'kickoff' || def.steps.some((s) => s.check || (s.argv ?? []).includes('{kickoff}'));
  if (needsKickoff && (!kickoff || !KICKOFF.test(kickoff) || !existsSync(path.join(root, kickoff)))) throw new Error(`phase ${phase} needs an existing kickoff under tasks/Sprints/ (got ${kickoff})`);
  const fp = fingerprint(def.scope, { root, kickoff });
  const body = kickoff ? readFileSync(path.join(root, kickoff), 'utf8') : '';
  const ledger = { phase, kickoff, base, role: def.role, fingerprint: fp, startedAt: new Date().toISOString(), steps: [] };
  // A review whose last verdict is NEEDS REVISION (owner, 2026-11-11): the OWASP task gate needs a task approved by
  // review, which such a task cannot have, so the steps that name "underRevision" run their variant or are skipped; the
  // gate still runs at the approving review, the handoff and in CI.
  const underRevision = Boolean(kickoff) && def.steps.some((s) => s.underRevision) && lastVerdict(body) === 'NEEDS REVISION';
  if (underRevision) ledger.underRevision = true;
  let failed = null;
  for (const step of def.steps) {
    const t0 = Date.now();
    if (underRevision && step.underRevision === 'skip') {
      const summary = 'skipped: the last verdict is NEEDS REVISION; this step runs at the approving review, the handoff and in CI';
      ledger.steps.push({ id: step.id, argv: [], exit: null, skipped: true, summary, startedAt: new Date(t0).toISOString(), ms: 0 });
      log(`[${phase}] ${step.id} ${summary}`);
      continue;
    }
    log(`[${phase}] ${step.id} …`);
    const argv = underRevision && Array.isArray(step.underRevision) ? step.underRevision : step.argv;
    const r = step.check
      ? BUILTIN[step.check]({ body, kickoff, root, timeoutMs })
      : runArgv(argv.map((a) => a.replace('{kickoff}', kickoff ?? '').replace('{base}', base)), root, timeoutMs);
    // the step's last output line, so a [pipeline: <phase>] result can be reconciled with what the step printed
    const summary = r.output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1)?.slice(0, 300) ?? '';
    const entry = { id: step.id, argv: argv ?? [`builtin:${step.check}`], exit: r.exit, outputSha256: sha256(r.output), summary, startedAt: new Date(t0).toISOString(), ms: Date.now() - t0 };
    ledger.steps.push(entry);
    log(`[${phase}] ${step.id} exit ${r.exit} (${Math.round(entry.ms / 1000)}s)`);
    if (r.exit !== 0) { failed = step.id; log(r.output.split('\n').slice(-40).join('\n')); break; }
  }
  // The files must not change while the phase runs: a ledger is bound to what every step saw.
  const after = fingerprint(def.scope, { root, kickoff });
  if (!failed && after !== fp) { failed = 'files-changed-during-run'; ledger.steps.push({ id: failed, exit: 1 }); }
  ledger.complete = !failed;
  ledger.finishedAt = new Date().toISOString();
  mkdirSync(ledgerDir(root), { recursive: true });
  writeFileSync(ledgerFile(phase, kickoff, root), `${JSON.stringify(ledger, null, 2)}\n`);
  return { ledger, complete: !failed, failed };
}

/**
 * The summary of every check of a PR head (`gh pr checks --json name,bucket,state`: the ci.yml jobs and the checks
 * outside it, Vercel and code scanning) and of its commits' signatures: the main ruleset requires signed commits, so an
 * unsigned commit blocks the merge as a red check does.
 */
export function ciSummary(pr, sha, checks, { unsigned = [] } = {}) {
  const concluded = checks.filter((c) => c.bucket !== 'pending');
  const failed = checks.filter((c) => c.bucket === 'fail' || c.bucket === 'cancel');
  const pending = checks.filter((c) => c.bucket === 'pending');
  const line = `CI ${String(sha).slice(0, 9)} PR #${pr}: ${concluded.length} of ${checks.length} checks concluded, ${failed.length} failed, ${unsigned.length} unsigned commit(s)`;
  const done = checks.length > 0 && pending.length === 0;
  return { line, done, passed: done && failed.length === 0 && unsigned.length === 0, failed: failed.map((c) => c.name), pending: pending.map((c) => c.name), unsigned };
}

/** Verdict lines of the "## Review" section. */
export function verdictLines(body) {
  return (section(body ?? '', '## Review') ?? []).map((l) => l.text.trim()).filter((t) => VERDICT_LINE.test(t));
}

/** The kickoff without its "## Review" section: the design. */
export function designPart(body) {
  const lines = String(body ?? '').split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Review');
  return (start < 0 ? lines : lines.slice(0, start)).join('\n');
}

/** Paths a reply's `git add` commands stage; `all` when one stages everything. */
export function stagedByReply(reply) {
  const out = new Set();
  let all = false;
  for (const line of String(reply).split(/\r?\n/)) {
    for (const m of line.matchAll(/\bgit(?:\.exe)?\s+add\s+([^`|;&\r\n]+)/gi)) {
      for (const w of m[1].trim().split(/\s+/)) {
        if (w === '-A' || w === '--all' || w === '.') all = true;
        else if (!w.startsWith('-')) out.add(w.replace(/^["']|["']$/g, '').replace(/\\/g, '/'));
      }
    }
  }
  return { paths: out, all };
}

const PR_NUMBER = /\b(?:PR|pull request)\s*#?\s*(\d+)\b/i;

/**
 * Why the stop is refused, [] when it may go through.
 * @param {object} s
 * @param {string} s.reply             the last reply
 * @param {string} s.event             Stop | SubagentStop
 * @param {string|null} s.agentType    the stopping subagent's type
 * @param {Array<{path:string, head:string|null, now:string}>} s.kickoffs   changed kickoffs, HEAD and current text
 * @param {Record<string,string>} s.changed   changedPaths()
 * @param {(phase:string, kickoff:string|null) => boolean} s.complete  is the phase's ledger complete for current files?
 * @param {(pr:string|null) => ({ line:string, at:number }|null)} s.ciStatus the PR's (or, with null, the newest) ci-status record
 * @param {number|null} s.turnStart    when the user's last message arrived (ms)
 * @param {string[]} s.vocab           the check names of claims.mjs ciVocabulary
 * @param {boolean} s.turnLookedAtCi   a tool call of this turn looked at CI (claims.mjs CI_TOOL)
 */
export function stopFindings({ reply, event, agentType = null, kickoffs = [], changed = {}, complete, ciStatus, turnStart = null, now = Date.now(), vocab = [], turnLookedAtCi = false }) {
  const out = [];
  for (const k of kickoffs) {
    if (designPart(k.head) !== designPart(k.now) && !complete('design', k.path)) {
      out.push(`${k.path}: the design changed, and \`node scripts/quality/pipeline.mjs run design ${k.path}\` has not passed on it (flow.md §1, completeness rule)`);
    }
    const added = verdictLines(k.now).filter((v) => !verdictLines(k.head).includes(v));
    if (added.length && !complete('review', k.path)) {
      out.push(`${k.path}: a verdict was written ("${added.at(-1)}") without a complete \`node scripts/quality/pipeline.mjs run review ${k.path}\` on these files (flow.md §3)`);
    }
  }
  // Product code is Sonnet's (flow.md roles): a stop with src/ changed, in any session, or an executor's stop with any
  // code changed, needs a complete execute ledger of some task for the code as it is now.
  const code = Object.keys(changed).filter((p) => !DOC.test(p));
  const product = code.filter((p) => p.startsWith('src/'));
  if ((product.length || (event === 'SubagentStop' && agentType === 'executor' && code.length)) && !complete('execute', '*')) {
    out.push(`the implementation (${(product.length ? product : code).slice(0, 5).join(', ')}) stands without a complete \`node scripts/quality/pipeline.mjs run execute <kickoff>\` on the code as it is now (flow.md §2)`);
  }
  const found = commands(reply);
  if (found.push.length || /\bgit(?:\.exe)?\s+commit\b/i.test(reply)) {
    if (!complete('handoff', null)) out.push('a commit or push is handed over without a complete `node scripts/quality/pipeline.mjs run handoff` on exactly these files (flow.md §4: every CI job run locally first)');
    const staged = stagedByReply(reply);
    if (!staged.all) {
      const missing = Object.keys(changed).filter((p) => !staged.paths.has(p));
      const extra = [...staged.paths].filter((p) => !(p in changed));
      if (missing.length) out.push(`the reply's \`git add\` leaves changed files out, so the commit is not what was checked: ${missing.join(', ')}`);
      if (extra.length) out.push(`the reply's \`git add\` names files that are not changed: ${extra.join(', ')}`);
    }
  }
  // A reply to the owner that names a PR, CI, a run, a job or a check, or that follows a look at CI in this turn, carries
  // this turn's ci-status line (claims.mjs: the second test does not depend on wording).
  if (event !== 'SubagentStop' && (turnLookedAtCi || mentionsCi(reply, vocab))) {
    const pr = PR_NUMBER.exec(reply)?.[1] ?? null;
    const st = ciStatus(pr);
    const why = turnLookedAtCi ? 'follows a look at CI in this turn' : 'names a PR, CI, a run, a job or a check';
    const fresh = st && (turnStart ? st.at >= turnStart : now - st.at < 15 * 60 * 1000);
    if (!fresh) out.push(`the reply ${why} without \`node scripts/quality/pipeline.mjs ci-status${pr ? ` ${pr}` : ''}\` run in this turn`);
    else if (!reply.includes(st.line)) out.push(`the reply ${why} but does not carry the ci-status line verbatim: "${st.line}" (a run in progress is never a result)`);
  }
  return out;
}

/** The step summaries of the phase's ledgers that are complete for the files as they are: a stale run backs nothing. */
export function phaseSummaries(phase, { root = ROOT, phases = loadPhases(root) } = {}) {
  const def = phases[phase];
  if (!def) return '';
  try {
    const shared = def.scope === 'kickoff' ? null : fingerprint(def.scope, { root });
    return readdirSync(ledgerDir(root)).filter((f) => f.endsWith(`-${phase}.json`) || f === `${phase}.json`)
      .map((f) => JSON.parse(readFileSync(path.join(ledgerDir(root), f), 'utf8')))
      .filter((l) => isComplete(l, def, shared ?? fingerprint('kickoff', { root, kickoff: l.kickoff })))
      .flatMap((l) => l.steps.map((s) => s.summary ?? '')).join('\n');
  } catch { return ''; }
}

function transcriptInfo(event) {
  let reply = typeof event.last_assistant_message === 'string' ? event.last_assistant_message : '';
  let turnStart = null;
  let turnLookedAtCi = false;
  let commands = [];
  // a subagent's own transcript holds its turn; the main one holds the session's
  const t = event.hook_event_name === 'SubagentStop' && typeof event.agent_transcript_path === 'string' ? event.agent_transcript_path : event.transcript_path;
  if (typeof t === 'string' && existsSync(t)) {
    for (const line of readFileSync(t, 'utf8').split('\n')) {
      let e;
      try { e = JSON.parse(line); } catch { continue; }
      const content = e.message?.content;
      // a turn starts at the owner's message; a Stop hook's feedback and other injected entries (isMeta) continue it
      if (isOwnerMessage(e)) {
        const at = Date.parse(e.timestamp);
        if (!Number.isNaN(at)) turnStart = at;
        turnLookedAtCi = false;
        commands = [];
      }
      // the output Claude Code recorded for a shell call of this turn (not the model's text)
      if (e.type === 'user' && Array.isArray(content)) {
        for (const b of content) {
          if (b.type !== 'tool_result') continue;
          const run = commands.find((c) => c.id === b.tool_use_id);
          if (!run) continue;
          run.output = typeof b.content === 'string' ? b.content : (Array.isArray(b.content) ? b.content.filter((x) => x.type === 'text').map((x) => x.text).join('\n') : '');
          run.error = b.is_error === true;
        }
      }
      if (e.type === 'assistant' && Array.isArray(content)) {
        if (content.some(looksAtCi)) turnLookedAtCi = true;
        for (const b of content) if (b.type === 'tool_use' && typeof b.input?.command === 'string') commands.push({ id: b.id, command: b.input.command, output: null, error: false });
        const text = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        if (text && !event.last_assistant_message) reply = text;
      }
    }
  }
  return { reply, turnStart, turnLookedAtCi, commands };
}

function stopHook(root) {
  const raw = readFileSync(0, 'utf8');
  const event = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const { reply, turnStart, turnLookedAtCi, commands: turnCommands } = transcriptInfo(event);
  const phases = loadPhases(root);
  // test fixtures (test-fixtures.mjs): a stale directory is removed; one a living test holds is not the session's work
  const gitDir = path.resolve(root, git(['rev-parse', '--git-dir'], root).trim());
  sweepStaleFixture(root, gitDir);
  const hidden = fixtureHidden(gitDir);
  const changed = Object.fromEntries(Object.entries(changedPaths(root)).filter(([p]) => !(hidden && isFixturePath(p))));
  const show = (p) => { const r = spawnSync('git', ['show', `HEAD:${p}`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true }); return r.status === 0 ? r.stdout : null; };
  const kickoffs = Object.keys(changed).filter((p) => KICKOFF.test(p) && changed[p] !== '-').map((p) => ({ path: p, head: show(p), now: readFileSync(path.join(root, p), 'utf8') }));
  const complete = (phase, kickoff) => {
    const def = phases[phase];
    try {
      if (kickoff !== '*') return isComplete(readLedger(phase, kickoff, root), def, fingerprint(def.scope, { root, kickoff }));
      // any task's ledger of this phase, each checked against the files it is bound to (its kickoff for the design phase)
      const shared = def.scope === 'kickoff' ? null : fingerprint(def.scope, { root });
      return readdirSync(ledgerDir(root)).filter((f) => f.endsWith(`-${phase}.json`) || f === `${phase}.json`)
        .some((f) => {
          try {
            const l = JSON.parse(readFileSync(path.join(ledgerDir(root), f), 'utf8'));
            return isComplete(l, def, shared ?? fingerprint('kickoff', { root, kickoff: l.kickoff }));
          } catch { return false; }
        });
    } catch { return false; }
  };
  const ciStatus = (pr) => {
    try {
      if (pr) return JSON.parse(readFileSync(path.join(ledgerDir(root), `ci-status-${pr}.json`), 'utf8'));
      // no PR number in the reply: the newest ci-status record (a PR, or the branch that has none)
      return readdirSync(ledgerDir(root)).filter((f) => /^ci-status-.+\.json$/.test(f))
        .map((f) => JSON.parse(readFileSync(path.join(ledgerDir(root), f), 'utf8'))).sort((a, b) => b.at - a.at)[0] ?? null;
    } catch { return null; }
  };
  const agentType = event.agent_type ?? event.subagent_type ?? null;
  const findings = stopFindings({ reply, event: event.hook_event_name, agentType, kickoffs, changed, complete, ciStatus, turnStart, vocab: existsSync(path.join(root, '.github', 'workflows', 'ci.yml')) ? loadVocabulary(root) : [], turnLookedAtCi });
  // the source of every stated result (provenance.mjs): to the owner, and in the executor's report to Opus
  if (event.hook_event_name !== 'SubagentStop' || agentType === 'executor') {
    const fresh = (st) => (st && (turnStart ? st.at >= turnStart : Date.now() - st.at < 15 * 60 * 1000) ? st : null);
    const phaseOutput = (phase) => phaseSummaries(phase, { root, phases });
    findings.push(...provenanceFindings({ reply, runs: turnCommands, ciStatus: (pr) => fresh(ciStatus(pr)), phaseComplete: (phase) => !!phases[phase] && complete(phase, '*'), phaseOutput }));
  }
  const stateFile = path.join(ledgerDir(root), `stop-${String(event.session_id || 'no-session').replace(/[^\w-]/g, '')}.json`);
  let blocks = 0;
  try { blocks = JSON.parse(readFileSync(stateFile, 'utf8')).blocks ?? 0; } catch { /* first stop of the session */ }
  mkdirSync(ledgerDir(root), { recursive: true });
  if (!findings.length) { writeFileSync(stateFile, JSON.stringify({ blocks: 0 })); return; }
  if (blocks >= MAX_STOP_BLOCKS) {
    writeFileSync(stateFile, JSON.stringify({ blocks: 0 }));
    process.stdout.write(JSON.stringify({ systemMessage: `Pipeline: the work is NOT done; report it as not done:\n- ${findings.join('\n- ')}` }));
    return;
  }
  writeFileSync(stateFile, JSON.stringify({ blocks: blocks + 1 }));
  process.stdout.write(JSON.stringify({ decision: 'block', reason: `Pipeline (completeness rule, flow.md): finish every step before this reply:\n- ${findings.join('\n- ')}` }));
}

function ciStatusCommand(given, root) {
  if (given !== undefined && !/^\d+$/.test(given)) throw new Error('ci-status takes a PR number, or none for the current branch');
  // no number: the open PR of the current branch; a branch without one gets a record that says so
  const head = spawnSync('gh', ['pr', 'view', ...(given ? [given] : []), '--json', 'number,headRefOid,state'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (head.status !== 0) {
    if (given) throw new Error(`gh pr view ${given} failed: ${head.stderr}`);
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).stdout.trim().replace(/[^\w./-]/g, '');
    const line = `CI branch ${branch}: no open pull request, so no check has run`;
    console.log(line);
    mkdirSync(ledgerDir(root), { recursive: true });
    writeFileSync(path.join(ledgerDir(root), `ci-status-branch-${branch.replace(/[^\w-]/g, '_')}.json`), JSON.stringify({ pr: null, branch, line, done: false, passed: false, at: Date.now() }));
    return 1;
  }
  const view = JSON.parse(head.stdout);
  const pr = String(view.number);
  const sha = view.headRefOid;
  const r = spawnSync('gh', ['pr', 'checks', pr, '--json', 'name,bucket,state,link'], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 24 });
  let checks;
  try { checks = JSON.parse(r.stdout); } catch { throw new Error(`gh pr checks ${pr} failed: ${r.stderr}`); }
  const commits = spawnSync('gh', ['pr', 'view', pr, '--json', 'commits', '--jq', '.commits[].oid'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (commits.status !== 0) throw new Error(`gh pr view ${pr} --json commits failed: ${commits.stderr}`);
  const unsigned = [];
  for (const oid of commits.stdout.split('\n').filter((x) => /^[0-9a-f]{40}$/.test(x))) {
    const v = spawnSync('gh', ['api', `repos/{owner}/{repo}/commits/${oid}`, '--jq', '.commit.verification.verified'], { cwd: root, encoding: 'utf8', windowsHide: true });
    if (v.status !== 0 || v.stdout.trim() !== 'true') unsigned.push(oid.slice(0, 9));
  }
  const s = ciSummary(pr, sha, checks, { unsigned });
  for (const c of [...checks].sort((a, b) => a.bucket.localeCompare(b.bucket) || a.name.localeCompare(b.name))) console.log(`${c.bucket}\t${c.name}`);
  console.log(s.failed.length ? `failed: ${s.failed.join(', ')}` : 'failed: none');
  if (unsigned.length) console.log(`unsigned commits (the main ruleset refuses them): ${unsigned.join(', ')}`);
  if (s.pending.length) console.log(`still running: ${s.pending.join(', ')}`);
  console.log(s.line);
  mkdirSync(ledgerDir(root), { recursive: true });
  writeFileSync(path.join(ledgerDir(root), `ci-status-${pr}.json`), JSON.stringify({ pr, sha, line: s.line, done: s.done, passed: s.passed, at: Date.now() }));
  return s.passed ? 0 : 1;
}

if (isEntryPoint(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (name, dflt) => { const i = rest.indexOf(name); return i >= 0 ? rest.splice(i, 2)[1] : dflt; };
  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || ROOT);
  try {
    if (mode === 'stop') {
      try { stopHook(root); } catch (e) {
        process.stdout.write(JSON.stringify({ decision: 'block', reason: `pipeline stop check could not run (fail closed): ${e.message}` }));
      }
      process.exit(0);
    }
    if (mode === 'run') {
      const base = opt('--base', 'main');
      const [phase, kickoff = null] = rest;
      const { complete, failed, ledger } = runPhase(phase, { kickoff: kickoff?.replace(/\\/g, '/') ?? null, base, root, log: (m) => console.log(m) });
      console.log(complete ? `pipeline ${phase}: complete, ${ledger.steps.length} step(s), fingerprint ${ledger.fingerprint.slice(0, 12)}` : `pipeline ${phase}: STOPPED at ${failed}; the phase is not done`);
      process.exit(complete ? 0 : 1);
    }
    if (mode === 'status') {
      const [phase, kickoff = null] = rest;
      const def = loadPhases(root)[phase];
      if (!def) throw new Error(`unknown phase ${phase}`);
      const k = kickoff?.replace(/\\/g, '/') ?? null;
      const ok = isComplete(readLedger(phase, k, root), def, fingerprint(def.scope, { root, kickoff: k }));
      console.log(`pipeline ${phase}${k ? ` ${k}` : ''}: ${ok ? 'complete for the current files' : 'NOT complete for the current files'}`);
      process.exit(ok ? 0 : 1);
    }
    if (mode === 'ci-status') process.exit(ciStatusCommand(rest[0], root));
    console.error('usage: pipeline.mjs run <phase> [<kickoff>] [--base main] | status <phase> [<kickoff>] | ci-status <pr> | stop');
    process.exit(2);
  } catch (e) {
    console.error(`pipeline: ${e.message}`);
    process.exit(2);
  }
}
