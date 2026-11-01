// Task 943 design probe (Opus designer, 2026-11-01). Read-only: imports the real hook functions and prints/saves what
// they report for shell commands that mutate a file without one of the recognised write words.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../..');
const { shellWriteTargets, governanceIndependenceErrors } = await import(new URL('../../../../../scripts/workflow-gates/security-hook.mjs', import.meta.url).href);

const X = 'scripts/workflow-gates/cli.mjs';
const Y = 'docs/sessions/evidence/task943/design/p01-undetected-writes-probe.mjs';
const commands = [
  ['cp', `cp ${Y} ${X}`],
  ['mv (destination)', `mv ${Y} ${X}`],
  ['mv (source)', `mv ${X} docs/moved.mjs`],
  ['tee', `echo x | tee ${X}`],
  ['sed -i', `sed -i 's/a/b/' ${X}`],
  ['rm', `rm -f ${X}`],
  ['touch', `touch ${X}`],
  ['ln -s', `ln -s ${Y} ${X}`],
  ['install', `install ${Y} ${X}`],
  ['dd of=', `dd if=${Y} of=${X}`],
  ['Copy-Item', `Copy-Item -Path ${Y} -Destination ${X}`],
  ['Move-Item', `Move-Item ${X} docs/moved.mjs`],
  ['Remove-Item', `Remove-Item -Path ${X} -Force`],
  ['Rename-Item', `Rename-Item -Path ${X} -NewName other.mjs`],
  ['New-Item', `New-Item -ItemType File -Path ${X} -Force`],
  ['Clear-Content', `Clear-Content ${X}`],
  ['node fs.copyFileSync', `node -e "require('fs').copyFileSync('${Y}', '${X}')"`],
  ['node fs.rmSync', `node -e "require('fs').rmSync('${X}')"`],
  ['node fs.appendFileSync', `node -e "require('fs').appendFileSync('${X}', 'x')"`],
  ['.NET WriteAllText', `[IO.File]::WriteAllText('${X}', 'x')`],
  ['control: Set-Content (detected today)', `Set-Content '${X}' 'x'`],
];
const lines = [`platform ${process.platform}; node ${process.version}; root ${root}`];
for (const [label, command] of commands) lines.push(`${label}: targets ${JSON.stringify(shellWriteTargets(root, command))}`);

const CONTRACT = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const contract = JSON.parse(readFileSync(join(root, CONTRACT), 'utf8'));
const transcript = commands.slice(0, -1).flatMap(([, command], i) => [
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: `c${i}`, name: 'Bash', input: { command } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `c${i}`, content: '' }] } },
]).map(line => JSON.stringify(line)).join('\n');
lines.push(`governanceIndependenceErrors(940 contract, transcript of every command above except the control): ${JSON.stringify(governanceIndependenceErrors(root, contract, CONTRACT, transcript))}`);
const text = `${lines.join('\n')}\n`;
process.stdout.write(text);
writeFileSync(join(here, 'p01-undetected-writes-probe.txt'), text);
