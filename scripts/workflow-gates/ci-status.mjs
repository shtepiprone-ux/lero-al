#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { git } from './push-safety.mjs';

// event 'push' verifies main after a merge; event 'pull_request' verifies a PR head before the merge handoff.
// A job whose `if` excludes pull_request must be reported as skipped on a PR run and successful on main.
export function ciErrors(run, jobs, sha, workflow, { event = 'push', branch = 'main' } = {}) {
  const errors = [];
  if (run?.head_sha !== sha || run?.event !== event || run?.head_branch !== branch
    || run?.path !== '.github/workflows/governance-pr.yml' || run?.status !== 'completed' || run?.conclusion !== 'success') errors.push(`The exact ${event} workflow for ${branch} is absent, pending, or unsuccessful`);
  const expected = Object.values(workflow.jobs).flatMap(job => (job.strategy?.matrix?.shard
    ? job.strategy.matrix.shard.map(shard => job.name.replace('${{ matrix.shard }}', String(shard))) : [job.name])
    .map(name => ({ name, conclusion: event === 'pull_request' && /github\.event_name != 'pull_request'/.test(job.if || '') ? 'skipped' : 'success' })));
  for (const { name, conclusion } of expected) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].status !== 'completed' || matches[0].conclusion !== conclusion
      || matches[0].head_sha !== sha || matches[0].run_id !== run?.id) errors.push(`Missing or unsuccessful exact-SHA check: ${name}`);
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
    const args = process.argv.slice(2);
    const pr = args[0] === '--pr' && /^\d+$/.test(args[1] || '') && args.length === 2 ? args[1] : null;
    if (args.length && !pr) throw new Error('Use ci-status.mjs (main after merge) or ci-status.mjs --pr <number>');
    const sha = git(root, ['rev-parse', 'HEAD']);
    const api = path => JSON.parse(execFileSync('gh', ['api', path], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 }));
    let event = 'push', branch = 'main';
    if (pr) {
      const pull = api(`repos/shtepiprone-ux/lero-al/pulls/${pr}`);
      if (pull.state !== 'open' || pull.base?.ref !== 'main' || pull.head?.repo?.full_name !== 'shtepiprone-ux/lero-al') throw new Error('The PR is not an open same-repository PR into main');
      if (pull.head.sha !== sha) throw new Error('The PR head does not equal the reviewed local HEAD');
      event = 'pull_request'; branch = pull.head.ref;
    } else {
      const ref = api('repos/shtepiprone-ux/lero-al/git/ref/heads/main');
      if (ref.object?.sha !== sha) throw new Error('Remote main does not equal the local HEAD; switch to main and fast-forward it first');
    }
    const runs = api(`repos/shtepiprone-ux/lero-al/actions/workflows/governance-pr.yml/runs?head_sha=${sha}&event=${event}&per_page=100`).workflow_runs;
    const run = runs?.filter(r => r.head_sha === sha && r.head_branch === branch).sort((a, b) => b.id - a.id)[0];
    if (!run) throw new Error(`No ${event} CI run exists for this exact SHA`);
    const jobs = [];
    for (let page = 1; page <= 100; page++) {
      const batch = api(`repos/shtepiprone-ux/lero-al/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`);
      jobs.push(...batch.jobs);
      if (jobs.length >= batch.total_count) break;
      if (page === 100 || !batch.jobs.length) throw new Error('CI job pagination is incomplete');
    }
    const errors = ciErrors(run, jobs, sha, JSON.parse(readFileSync(`${root}/.github/workflows/governance-pr.yml`, 'utf8')), { event, branch });
    if (errors.length) throw new Error(errors.join('; '));
    console.log(`CI PASSED for ${sha}: ${run.html_url}`);
  } catch (error) { console.error(`CI UNVERIFIED: ${error.message}`); process.exitCode = 1; }
}
