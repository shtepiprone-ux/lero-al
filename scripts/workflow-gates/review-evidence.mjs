import { spawnSync } from 'node:child_process';
const args = ['scripts/check-review-ledger.mjs', '--ci'];
// Task-design commits may have no approved ledger. Product diffs still require security contracts;
// the push release gate separately rejects unresolved security findings.
if (['push', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)) args.push('--push');
const result = spawnSync(process.execPath, args, { stdio: 'inherit', timeout: 5 * 60 * 1000 });
process.exitCode = result.status === 0 && !result.error ? 0 : 1;
