#!/usr/bin/env node
// Publication guard for owner handoffs (governance reset 2026-11-06). The user-level Claude Code Stop hook runs it when
// a reply contains a `git push` or `gh pr merge` command; exit 0 lets the reply through, exit 2 blocks it with the
// reason on stderr. OWASP basis: CI/CD Security (main changes only through a reviewed PR whose required check is
// green; no force push, no bypass), AI Agent Security (an agent's handoff is checked by code, not trusted).
//
//   echo <hook event JSON> | node scripts/quality/push-safety.mjs
//
// A push is allowed only as `git push [-u|--set-upstream] origin <branch>` where <branch> is the current branch or a
// branch the same reply creates first (`git switch -c` / `git checkout -b`), and never main/master. A merge is allowed only as `gh pr merge <number> --squash`, never with --admin, and only when the PR
// targets main, is open, and its `CI Required` check concluded SUCCESS at the moment of the reply.

import { readFileSync, openSync, fstatSync, closeSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROTECTED = /^(?:refs\/heads\/)?(?:main|master)$/i;
const REQUIRED_CHECK = 'CI Required';

/** Commands in prose and inline code; fenced blocks and quotes are included (a fence is still a command to copy). */
export function commands(text) {
  const found = { push: [], merge: [], wrapped: [], created: [] };
  for (const line of String(text).split(/\r?\n/)) {
    for (const m of line.matchAll(/\bgit(?:\.exe)?\s+(?:switch\s+(?:-c|--create)|checkout\s+-b)\s+([^\s`'";|&]+)/gi)) found.created.push(m[1]);
    for (const p of gitPushes(line)) found.push.push(p);
    for (const m of line.matchAll(/\bgh(?:\.exe)?\s+pr\s+merge\b([^`|;&\r\n]*)/gi)) found.merge.push({ args: m[1].trim() });
    if (/\b(?:node|python\d*|powershell|pwsh|cmd|bash|sh)(?:\.exe)?\s[^\r\n`]*\bgit\b[^\r\n`]*\bpush\b/i.test(line)) found.wrapped.push(line.trim());
  }
  return found;
}

/**
 * `git [-c k=v | -C dir]... push <args>` in one line, read word by word. A nested-quantifier regex over the options
 * backtracks exponentially on a crafted line (CodeQL js/redos, 2026-11-06); this walk is linear.
 */
export function gitPushes(line) {
  const out = [];
  for (const m of line.matchAll(/\bgit(?:\.exe)?(?=\s)/gi)) {
    const rest = line.slice(m.index + m[0].length);
    const segment = rest.split(/[`|;&\r\n]/, 1)[0];
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    const prefix = [];
    let i = 0;
    while (i + 1 < tokens.length && (tokens[i] === '-c' || tokens[i] === '-C')) { prefix.push(tokens[i], tokens[i + 1]); i += 2; }
    if (tokens[i]?.toLowerCase() !== 'push') continue;
    out.push({ prefix: prefix.join(' '), args: tokens.slice(i + 1).join(' ') });
  }
  return out;
}

const words = (s) => (String(s).match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((w) => w.replace(/^["']|["']$/g, '').replace(/[.,]+$/, ''));

/** Reasons a push command is refused; [] when it is the allowed shape. */
export function pushProblems(cmd, currentBranch, created = []) {
  const out = [];
  if (cmd.prefix) out.push(`git options before push (${cmd.prefix}) are not allowed`);
  const w = words(cmd.args);
  const flags = w.filter((x) => x.startsWith('-'));
  const rest = w.filter((x) => !x.startsWith('-'));
  for (const f of flags) if (!['-u', '--set-upstream'].includes(f)) out.push(`flag ${f} is not allowed (force, delete, mirror, all, tags and push options are refused)`);
  if (rest.length !== 2) return [...out, `name exactly one remote and one branch: git push -u origin ${currentBranch || '<branch>'}`];
  const [remote, refspec] = rest;
  if (remote !== 'origin') out.push(`remote must be origin, not ${remote}`);
  if (refspec.startsWith('+')) out.push('a + refspec is a force push');
  const target = refspec.includes(':') ? refspec.split(':').pop() : refspec;
  const source = refspec.includes(':') ? refspec.split(':')[0] : refspec;
  if (PROTECTED.test(target) || PROTECTED.test(source)) out.push('main is changed only through a PR merged by the owner');
  if (refspec.includes(':') && source !== target) out.push('push a branch to the same name (no src:dst refspec)');
  if (!currentBranch) out.push('the current branch is unknown');
  else if (source !== currentBranch && source !== 'HEAD' && !created.includes(source)) out.push(`branch ${source} is neither the current branch ${currentBranch} nor created in this reply`);
  if (source === 'HEAD' && PROTECTED.test(currentBranch || '')) out.push('HEAD is main');
  return out;
}

/** Reasons a merge command is refused, given the PR's state as `gh pr view --json` returns it. */
export function mergeProblems(cmd, pr) {
  const out = [];
  const w = words(cmd.args);
  const number = w.find((x) => /^\d+$/.test(x));
  if (!number) out.push('name the PR number: gh pr merge <number> --squash');
  if (!w.includes('--squash') && !w.includes('-s')) out.push('the main ruleset allows squash merges only (--squash)');
  if (w.includes('--admin')) out.push('--admin bypasses the ruleset');
  for (const f of w.filter((x) => x.startsWith('-'))) if (!['--squash', '-s', '--delete-branch', '-d'].includes(f)) out.push(`flag ${f} is not allowed`);
  if (!number) return out;
  if (!pr) return [...out, `PR #${number} could not be read`];
  if (pr.state !== 'OPEN') out.push(`PR #${number} is ${pr.state}`);
  if (pr.baseRefName !== 'main') out.push(`PR #${number} targets ${pr.baseRefName}, not main`);
  const checks = (pr.statusCheckRollup ?? []).filter((c) => (c.name ?? c.context) === REQUIRED_CHECK);
  const ok = checks.length > 0 && checks.every((c) => (c.conclusion ?? c.state) === 'SUCCESS');
  if (!ok) out.push(`PR #${number}: ${REQUIRED_CHECK} is ${checks.map((c) => c.conclusion || c.status || c.state).join(', ') || 'missing'} — give the merge command only after it is green`);
  return out;
}

/** Every problem in a reply. `env` supplies the current branch and the PR reader (injected by tests). */
export function evaluate(reply, env) {
  const found = commands(reply);
  const problems = [];
  for (const line of found.wrapped) problems.push(`a push wrapped in another program cannot be verified: ${line}`);
  for (const b of found.created) if (PROTECTED.test(b)) problems.push(`creating a branch named ${b} is refused`);
  for (const p of found.push) for (const x of pushProblems(p, env.branch(), found.created)) problems.push(`git push ${p.args}: ${x}`);
  for (const m of found.merge) {
    const number = words(m.args).find((x) => /^\d+$/.test(x));
    for (const x of mergeProblems(m, number ? env.pr(number) : null)) problems.push(`gh pr merge ${m.args}: ${x}`);
  }
  return problems;
}

function latestReply(event) {
  if (typeof event.last_assistant_message === 'string') return event.last_assistant_message;
  const t = event.transcript_path;
  if (typeof t !== 'string') throw new Error('the reply is unavailable to the guard');
  // One open file descriptor for the size check and the read, so the file cannot change between them
  // (CodeQL js/file-system-race).
  let text;
  let fd;
  try {
    fd = openSync(t, 'r');
    if (fstatSync(fd).size > 64 * 1024 * 1024) throw new Error('too large');
    text = readFileSync(fd, 'utf8');
  } catch {
    throw new Error('the reply is unavailable to the guard');
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  let latest = '';
  for (const line of text.split('\n')) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
      const text = entry.message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      if (text) latest = text;
    }
  }
  return latest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const raw = readFileSync(0, 'utf8');
    const event = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
    const cwd = path.resolve(process.env.CLAUDE_PROJECT_DIR || event.cwd || '.');
    const run = (cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8', windowsHide: true, timeout: 30000 });
    const env = {
      branch: () => { const r = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']); return r.status === 0 ? r.stdout.trim() : null; },
      pr: (n) => {
        const r = run('gh', ['pr', 'view', n, '--json', 'state,baseRefName,statusCheckRollup']);
        if (r.status !== 0) return null;
        try { return JSON.parse(r.stdout); } catch { return null; }
      },
    };
    const problems = evaluate(latestReply(event), env);
    if (problems.length) {
      console.error(`Publication command refused:\n${problems.map((p) => `- ${p}`).join('\n')}`);
      process.exit(2);
    }
  } catch (e) {
    console.error(`push-safety could not verify the reply: ${e.message}`);
    process.exit(2);
  }
}
