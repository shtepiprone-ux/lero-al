import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { safePath } from './contract.mjs';
import { plainResponseLines } from './response-state.mjs';
import { sessionRole } from './session-role.mjs';

export const REPORT = 'test-results/workflow-gates/prepush/report.json';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function blobId(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
export function trackedTreeErrors(root, entries) {
  const errors = [], files = [];
  for (const entry of entries) {
    const match = entry.match(/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/s);
    if (!match) { errors.push('Unsupported tree entry; symlinks/submodules need explicit validation'); continue; }
    try {
      const file = safePath(root, match[3]);
      if (lstatSync(file).isSymbolicLink()) errors.push(`Symlink is not an ordinary tracked blob: ${match[3]}`);
      else files.push({ path: match[3], expected: match[2] });
    } catch (error) { errors.push(error.message); }
  }
  if (errors.length || !files.length) return errors;
  // One read-only Git process applies Git's real attribute/EOL rules. No -w, index mutation or reimplementation
  // of Git's binary/text heuristics. This independently detects assume-unchanged/skip-worktree hidden edits.
  const actual = execFileSync('git', ['--no-optional-locks', 'hash-object', '--stdin-paths'], {
    cwd: root, input: files.map(file => JSON.stringify(file.path)).join('\n') + '\n', encoding: 'utf8',
    timeout: 20000, maxBuffer: 4 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  }).trim().split(/\r?\n/);
  if (actual.length !== files.length) return ['Incomplete tracked-byte hash collection'];
  for (const [index, file] of files.entries()) if (actual[index] !== file.expected) errors.push(`Tracked bytes differ from HEAD: ${file.path}`);
  return errors;
}
export const git = (root, args) => execFileSync('git', ['--no-optional-locks', ...args], {
  cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

// Every git push occurrence outside a historical blockquote is a handoff: fenced lines, inline code spans,
// table cells, labelled prose and wrappers alike (owner decision 2026-11-01 after an inline-code bypass).
// A false positive costs one rephrased reply; a false negative publishes unverified code.
const GIT_PUSH = /(?:^|[\s`|(;&"'*:])(?:[^\s`|"']*[/\\])?git(?:\.exe)?["']?\s+(?:-[\w=-]+(?:\s+(?:"[^"]*"|'[^']*'|[^\s;|&`-][^\s;|&`]*))?\s+)*push\b[^`|;&\r\n]*/gi;
const WRAPPED_PUSH = /(?:^|[`;|&(]\s*)(?:&\s*)?(?:["']?[^\s`"']*[/\\])?(?:node|python\d*|powershell|pwsh|cmd|bash|sh)(?:\.exe)?["']?\s[^\r\n`]*\bgit(?:\.exe)?\b[^\r\n`]*\bpush\b/i;
export function pushCommands(text) {
  const found = [];
  for (const raw of String(text).replace(/`[ \t]*\r?\n/g, ' ').split(/\r?\n/)) {
    if (/^ {0,3}(`{3,}|~{3,})/.test(raw) || /^\s*>/.test(raw)) continue;
    const before = found.length;
    for (const match of raw.matchAll(GIT_PUSH)) {
      const command = match[0].replace(/^[\s`|(;&"'*:]/, '').trim().replace(/["'*.,]+$/, '').trim();
      // A wrapper payload ("node -e ... git push") is reported as the whole line so it can never be allowed.
      found.push(WRAPPED_PUSH.test(raw) ? raw.trim() : command);
    }
    if (found.length === before && WRAPPED_PUSH.test(raw)) found.push(raw.trim());
  }
  return found;
}
// Owner merge handoffs; an administrator override can never be offered.
export function mergeCommands(text) {
  return [...String(text).matchAll(/\bgh(?:\.exe)?\s+pr\s+merge\b[^`|;&\r\n]*/gi)].map(match => match[0].trim());
}
// Only a pushed task branch may be offered; main is reachable only through a PR whose required checks are green.
export const BRANCH_PUSH = /^git push (?:-u |--set-upstream )?origin (?!-)(?!(?:main|master|HEAD)$)(?!refs\/)[A-Za-z0-9][\w./-]*$/;
export const REQUIRED_CHECKS = ['Governance Required', 'Release Security Required'];
// GitHub's public branch-rules endpoint reports the rules actually enforced on main, not a local file.
export function rulesetErrors(rules) {
  const errors = [];
  if (!Array.isArray(rules)) return ['GitHub branch rules for main are unavailable'];
  for (const type of ['pull_request', 'required_status_checks', 'non_fast_forward', 'deletion']) {
    if (!rules.some(rule => rule.type === type)) errors.push(`main is not protected by the active ${type} rule`);
  }
  const contexts = rules.filter(rule => rule.type === 'required_status_checks')
    .flatMap(rule => rule.parameters?.required_status_checks || []).map(check => check.context);
  for (const name of REQUIRED_CHECKS) if (!contexts.includes(name)) errors.push(`main does not require the ${name} check`);
  return errors;
}
export async function liveRulesetErrors() {
  try {
    const response = await globalThis.fetch('https://api.github.com/repos/shtepiprone-ux/lero-al/rules/branches/main', {
      headers: { accept: 'application/vnd.github+json' }, signal: globalThis.AbortSignal.timeout(15000),
    });
    if (!response.ok) return [`GitHub branch rules request failed: HTTP ${response.status}`];
    return rulesetErrors(await response.json());
  } catch (error) { return [`GitHub branch rules are unavailable: ${error.message}`]; }
}

export function reportErrors(report, current, plan, now = Date.now()) {
  const errors = [];
  if (report?.version !== 1 || report?.kind !== 'local-prepush' || report?.status !== 'passed') errors.push('No successful local pre-push report');
  for (const key of ['head', 'tree', 'base', 'remote', 'remoteUrl', 'branch', 'policySha256', 'nodeVersion', 'platform']) {
    if (!current[key] || report?.[key] !== current[key]) errors.push(`Pre-push binding changed: ${key}`);
  }
  const completed = Date.parse(report?.completedAt), started = Date.parse(report?.startedAt);
  if (!Number.isFinite(completed) || !Number.isFinite(started) || started > completed || completed > now || now - completed > 3600000) errors.push('Pre-push report is expired or has invalid timestamps');
  if (current.dirty) errors.push('The worktree/index contains unpublished files; the tested commit is not the current execution input');
  if (report?.install?.code !== 0 || report.install.signal || report.install.error) errors.push('Lockfile dependency installation is not proved');
  if (report?.release?.code !== 0 || report.release.signal || report.release.error) errors.push('The release-security blocker check is not proved');
  if (!Array.isArray(report?.jobs) || report.jobs.length !== plan.length) errors.push('Incomplete required-job collection');
  for (const row of plan) {
    const matches = report?.jobs?.filter?.(job => job.id === row.id) || [];
    if (matches.length !== 1 || matches[0].status !== 'passed' || JSON.stringify(matches[0].commands) !== JSON.stringify(row.commands)
      || matches[0].results?.length !== row.commands.length || matches[0].results.some(r => r.code !== 0 || r.signal || r.error)) errors.push(`Required job not proved: ${row.id}`);
  }
  return errors;
}

// Optional local pre-check of a task branch against the live origin/main base (the PR target).
export function snapshot(root, { network = true, base } = {}) {
  const remote = 'origin';
  const head = git(root, ['rev-parse', 'HEAD']);
  const branch = git(root, ['branch', '--show-current']);
  if (!branch) throw new Error('Detached HEAD has no task branch to validate');
  const remoteUrl = git(root, ['remote', 'get-url', '--push', '--all', remote]);
  if (!/^(?:https:\/\/github\.com\/|git@github\.com:)shtepiprone-ux\/lero-al(?:\.git)?$/.test(remoteUrl)) throw new Error('Unexpected publication remote');
  const actualBase = network ? git(root, ['ls-remote', '--exit-code', remote, 'refs/heads/main']).split(/\s/)[0] : base;
  if (!/^[a-f0-9]{40}$/.test(actualBase || '')) throw new Error('Remote base SHA is unavailable');
  if (git(root, ['merge-base', actualBase, head]) !== actualBase) throw new Error('The task branch does not contain current origin/main; update it before validation');
  let dirty = Boolean(git(root, ['status', '--porcelain=v1', '--untracked-files=all']));
  if (!dirty) {
    const attributes = readFileSync(safePath(root, '.gitattributes'), 'utf8').replace(/\r\n/g, '\n');
    if (attributes.trim() !== '* text=auto eol=lf\n*.bat text eol=crlf\n*.cmd text eol=crlf') throw new Error('Changed Git conversion policy needs an inspected tree-byte adapter');
    dirty = trackedTreeErrors(root, git(root, ['ls-tree', '-rz', '--full-tree', head]).split('\0').filter(Boolean)).length > 0;
  }
  return {
    head, tree: git(root, ['rev-parse', 'HEAD^{tree}']), base: actualBase, remote, remoteUrl, branch,
    policySha256: hash(Buffer.concat(['scripts/workflow-gates/pipeline.json', '.github/workflows/governance-pr.yml',
      'scripts/workflow-gates/prepush.mjs', 'scripts/workflow-gates/push-safety.mjs'].map(p => readFileSync(join(root, p))))),
    nodeVersion: process.versions.node, platform: process.platform,
    dirty,
  };
}

export async function verifyReport(root, { network = true } = {}) {
  const report = JSON.parse(readFileSync(join(root, REPORT), 'utf8'));
  const { localPlan, preflightErrors } = await import('./prepush.mjs');
  const plan = localPlan(JSON.parse(readFileSync(join(root, '.github/workflows/governance-pr.yml'), 'utf8')),
    JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), 'utf8')));
  const current = snapshot(root, { network, base: report.base });
  const errors = [...reportErrors(report, current, plan), ...preflightErrors(root, current,
    JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), 'utf8')))];
  for (const result of [report.install, report.release, ...(report.jobs || []).flatMap(job => job.results || [])].filter(Boolean)) {
    if (!/^test-results\/workflow-gates\/prepush\/[\w.-]+\.log$/.test(result.log || '')
      || !existsSync(join(root, result.log)) || hash(readFileSync(join(root, result.log))) !== result.logSha256) errors.push('Required raw log is missing or changed');
  }
  return errors;
}

export function latestReply(event) {
  if (typeof event.last_assistant_message === 'string') return event.last_assistant_message;
  if (typeof event.transcript_path !== 'string' || !existsSync(event.transcript_path)) throw new Error('Current response is unavailable to the publication guard');
  if (statSync(event.transcript_path).size > 64 * 1024 * 1024) throw new Error('Oversized transcript: current last_assistant_message is required');
  let latest = '';
  for (const line of readFileSync(event.transcript_path, 'utf8').split('\n')) {
    let entry; try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
      const text = entry.message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      if (text) latest = text;
    }
  }
  return latest;
}

// Owner decision 2026-11-01: main changes only through a pull request whose required GitHub checks pass.
// The local prepush report is optional; the server-side ruleset is the enforced gate and must be active.
export async function handoffErrors(root, event, { rules = liveRulesetErrors } = {}) {
  const text = latestReply(event), commands = pushCommands(text), merges = mergeCommands(text);
  if (!commands.length && !merges.length) return [];
  if (sessionRole(root, event) !== 'orchestrator') return ['Only the known orchestrator role may issue an owner push or merge handoff'];
  if (!plainResponseLines(text).some(line => /^APPROVED(?: WITH NOTES)?$/.test(line.text))) return ['Push or merge requires the current whole-task APPROVED verdict'];
  if (commands.some(command => /(?:\s|:)(?:refs\/heads\/)?(?:main|master|HEAD)$/.test(command) || /^git push(?: \S+)?$/.test(command))) return ['Direct push to main is prohibited; push the task branch and merge its pull request after the required checks pass'];
  if (commands.length > 1 || commands.some(command => !BRANCH_PUSH.test(command))) return ['Only one explicit `git push -u origin <task-branch>` command is allowed; wrappers, force, delete, tags and refspecs are unverified'];
  if (merges.some(command => /--admin\b|--auto\b/.test(command) || !/^gh pr merge \d+ (?:--squash|--merge|--rebase)(?: --delete-branch)?$/.test(command))) return ['Only `gh pr merge <number> --squash|--merge|--rebase [--delete-branch]` is allowed; administrator overrides are prohibited'];
  if (merges.length > 1 || (merges.length && commands.length)) return ['Push the branch, verify its PR checks with ci-status.mjs --pr, then hand off the merge separately'];
  return rules();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const event = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''));
    const errors = await handoffErrors(resolve(process.env.CLAUDE_PROJECT_DIR || event.cwd || '.'), event);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 2; }
  } catch (error) { console.error(`PUBLICATION BLOCKED: ${error.message}`); process.exitCode = 2; }
}
