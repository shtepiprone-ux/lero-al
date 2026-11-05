// Task 945 review 1: each command of the `static` group of pipeline.json on the candidate, change-review excepted (it ran alone, see r05), so that the failures of
// CI run 41823787040 can be told apart from what this commit adds. Run results only: exit code and seconds per command, and the file lines of this task named by a failure.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync('scripts/workflow-gates/pipeline.json', 'utf8'));
const OWN = /code-check|change-review|dependency-check|mutation-|hook-differential|hook-corrections|audit-baseline|secure-code-review|task945|Task_945/;
for (const command of policy.groups.static) {
  const text = command.join(' ');
  if (/change-review\.mjs/.test(text)) { console.log(`SKIP  ${text}`); continue; }
  const executable = command[0] === 'node' ? process.execPath : command[0];
  const begun = Date.now();
  const run = spawnSync(executable, command.slice(1), { encoding: 'utf8', maxBuffer: 1 << 28, timeout: 600000, shell: command[0] !== 'node', windowsHide: true });
  const out = `${run.stdout}${run.stderr}`.split(/\r?\n/);
  const own = run.status === 0 ? [] : [...new Set(out.filter(line => OWN.test(line)).map(line => line.trim().slice(0, 150)))].slice(0, 6);
  console.log(`${run.status === 0 ? 'ok   ' : `FAIL${run.status}`} ${Math.round((Date.now() - begun) / 1000)}s ${text.slice(0, 110)}`);
  for (const line of own) console.log(`      own: ${line}`);
  if (run.status !== 0) console.log(`      last: ${out.filter(Boolean).slice(-1)[0]?.slice(0, 150)}`);
}
