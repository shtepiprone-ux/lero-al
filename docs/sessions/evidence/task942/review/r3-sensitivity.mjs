// Task 942 approver: each saved break spec of the hook cases, run in memory through the Task 944 load hook, writing no record.
// Usage from the project root: node docs/sessions/evidence/task942/review/r3-sensitivity.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const register = pathToFileURL(resolve('scripts/workflow-gates/sensitivity-register.mjs')).href;
const contract = JSON.parse(readFileSync('tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.security.json', 'utf8'));
const run = (id, spec) => {
  const row = contract.cases.find(entry => entry.id === id);
  const env = spec ? { ...process.env, NODE_OPTIONS: `--import=${register}`, SENSITIVITY_BREAK: resolve(spec) } : process.env;
  const out = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^${row.testName.slice(0, 40).replace(/[[\]]/g, '\\$&')}`, row.testFile], { encoding: 'utf8', env, timeout: 280000 });
  const failure = /error: '?([^\n]{0,160})/.exec(out.stdout || '')?.[1] ?? '';
  const code = /code: '?(\w+)/.exec(out.stdout || '')?.[1] ?? '';
  return `exit ${out.status}; ${/# pass (\d+)/.exec(out.stdout || '')?.[0]}; ${/# fail (\d+)/.exec(out.stdout || '')?.[0]}; ${code} ${failure}`;
};
for (const id of ['GOV-942-CI-PATH-DENY', 'GOV-942-HOOK-SHELL-FORMS-DENY', 'GOV-942-HOOK-SHELL-CLASSES-DENY']) {
  console.log(`${id}\n  baseline: ${run(id)}\n  break:    ${run(id, `docs/sessions/evidence/task942/sensitivity/${id}.break.json`)}\n  restored: ${run(id)}`);
}
