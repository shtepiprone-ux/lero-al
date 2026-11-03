// Review 2: reproduce the GOV-943-HOOK-NESTED-DENY sensitivity break on a copy of the gate folder (live files untouched).
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const repo = process.argv[2];
const copy = join(repo, 'test-results', 'task943-review2', 'gates-copy', 'scripts', 'workflow-gates');
rmSync(join(repo, 'test-results', 'task943-review2', 'gates-copy'), { recursive: true, force: true });
cpSync(join(repo, 'scripts', 'workflow-gates'), copy, { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const run = label => {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', 'GOV-943-HOOK-NESTED-DENY', join(copy, 'shell-mutation.selftest.mjs')], { encoding: 'utf8' });
  const lines = r.stdout.split(/\r?\n/).filter(l => /^(not )?ok |^# (pass|fail)|error: |name: 'AssertionError'/.test(l.trim()));
  console.log(`## ${label} hook sha256 ${sha(join(copy, 'security-hook.mjs'))} exit ${r.status}`);
  for (const l of lines) console.log(l);
};
run('baseline (copy of the final hook)');
const hook = join(copy, 'security-hook.mjs');
const original = readFileSync(hook, 'utf8');
const needle = 'if (inner && depth < 3) {';
if (!original.includes(needle)) throw new Error('break anchor not found');
writeFileSync(hook, original.replace(needle, 'if (false && inner && depth < 3) {'));
run('mutant (R13 (b) parsed text evaluation dropped)');
writeFileSync(hook, original);
run('restored');
console.log('live hook sha256', sha(join(repo, 'scripts', 'workflow-gates', 'security-hook.mjs')));
