// Task 944 review 3 (approver, read-only): candidate and input fingerprints (shared/orchestration-state.md). Writes no file.
// Usage (project root): node docs/sessions/evidence/task944/review/r3-fingerprint.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, planDigest, scopeDigest } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json';
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const contract = JSON.parse(readFileSync(resolve(ROOT, PATH), 'utf8'));
console.log(`HEAD ${git('rev-parse', 'HEAD')}`);
console.log(`branch ${git('branch', '--show-current')}`);
console.log(`node ${process.version}; platform ${process.platform}; cwd ${process.cwd()}`);
console.log(`stage ${contract.stage}; executionStatus ${contract.executionStatus}`);
console.log(`taskSha256 recorded ${contract.taskSha256}`);
console.log(`taskSha256 current  ${digest(ROOT, [contract.task])}`);
console.log(`planDigest ${planDigest(ROOT, contract)}`);
console.log(`scopeDigest ${scopeDigest(ROOT, contract)}`);
for (const file of contract.scope) console.log(`  ${digest(ROOT, [file])} ${file}`);
console.log(`git status of scripts and .claude: [${git('status', '--short', 'scripts', '.claude')}]`);
