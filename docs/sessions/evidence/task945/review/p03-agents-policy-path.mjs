// Task 945 review 1: does the sidecar validate with AGENTS.md in scope once isPolicyPath holds it? Run under the candidate's loader, with the correction of R19 in memory.
// Usage: node p03-agents-policy-path.mjs. It spawns itself with the mutant set; the live contract.mjs and the sidecar stay unchanged.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const FILE = 'scripts/workflow-gates/contract.mjs';
const SIDECAR = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_945_Written_Code_Is_Always_Checked.security.json';
const validate = async label => {
  const { validateContract, isPolicyPath } = await import(pathToFileURL(join(ROOT, FILE)).href);
  const saved = JSON.parse(readFileSync(join(ROOT, SIDECAR), 'utf8'));
  const contract = { ...saved, executionStatus: 'ready', scope: [...saved.scope, 'AGENTS.md'] };
  let errors;
  try { errors = validateContract(ROOT, contract, { phase: 'plan' }); } catch (error) { errors = [`threw: ${error.message}`]; }
  const own = (Array.isArray(errors) ? errors : []).filter(line => /AGENTS|unrelated|product/i.test(String(line)));
  console.log(`${label}: isPolicyPath(AGENTS.md) ${isPolicyPath('AGENTS.md')}; errors naming AGENTS.md or an unrelated path: ${own.length}${own.length ? ` :: ${String(own[0]).slice(0, 140)}` : ''}; other errors: ${(Array.isArray(errors) ? errors : []).length - own.length}`);
};
if (process.env.P03_CHILD) {
  await validate('with the correction in memory');
} else {
  await validate('as committed');
  const text = readFileSync(join(ROOT, FILE), 'utf8');
  const find = 'isPolicyPath = file => /^(?:\\.claude\\/|';
  const start = text.indexOf(find);
  const out = join(ROOT, 'test-results/task945-review/out');
  mkdirSync(out, { recursive: true });
  const report = join(out, 'p03.log');
  const env = { ...process.env, P03_CHILD: '1', NODE_OPTIONS: `--import=${pathToFileURL(join(ROOT, 'scripts/workflow-gates/mutation-loader.mjs')).href}`, CODE_CHECK_MUTANT: JSON.stringify({ key: resolve(ROOT, FILE).replaceAll('\\', '/').toLowerCase(), start, end: start + find.length, original: find, replacement: 'isPolicyPath = file => /^(?:AGENTS\\.md$|\\.claude\\/|', report }) };
  const run = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { cwd: ROOT, env, encoding: 'utf8' });
  process.stdout.write(run.stdout);
  process.stderr.write(run.stderr);
  console.log('applied:', readFileSync(report, 'utf8').includes('applied'));
  rmSync(report, { force: true });
}
