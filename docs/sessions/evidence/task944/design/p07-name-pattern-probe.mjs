// Task 944 design probe p07: an anchored, regex-escaped full test name selects exactly that test through --test-name-pattern
// (spawnSync argument array, no shell); its mutant result carries code: 'ERR_ASSERTION' in the TAP diagnostic block.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseTap } from '../../../../../scripts/workflow-gates/cli.mjs';
const contract = JSON.parse(readFileSync('tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json', 'utf8'));
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const row of contract.cases.filter(c => ['GOV-943-TESTS-REBASE-DENY', 'GOV-943-HOOK-PRETOOL-DENY'].includes(c.id))) {
  const args = ['--test', '--test-reporter=tap', `--test-name-pattern=^${escape(row.testName)}$`, row.testFile];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const named = parseTap(r.stdout).filter(t => t.name === row.testName);
  console.log(`${row.id}: exit ${r.status}; results ${parseTap(r.stdout).length}; named ${named.length} ${named.map(t => t.status)}`);
}
const row = contract.cases.find(c => c.id === 'GOV-943-TESTS-REBASE-DENY');
const env = { ...process.env, SENS_TARGET: `${process.cwd()}/scripts/workflow-gates/contract.mjs`, SENS_FIND: 'if (source !== null) check(source.includes',
  SENS_REPLACE: 'if (false && source !== null) check(source.includes',
  NODE_OPTIONS: `--import=${pathToFileURL(`${process.cwd()}/docs/sessions/evidence/task944/design/p01-loader/register.mjs`).href}` };
const m = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^${escape(row.testName)}$`, row.testFile], { encoding: 'utf8', env });
console.log(`mutant: exit ${m.status}; named ${parseTap(m.stdout).filter(t => t.name === row.testName).map(t => t.status)}; ERR_ASSERTION in TAP: ${/code: 'ERR_ASSERTION'/.test(m.stdout)}`);
