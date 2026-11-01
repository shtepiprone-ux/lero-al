// Task 941 design probe (Opus designer, 2026-11-01). Read-only: imports the real hook functions, prints and saves
// their results for read-only and writing shell commands. It writes only its own output file next to itself.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../..');
const { shellWriteTargets, governanceIndependenceErrors } = await import(new URL('../../../../../scripts/workflow-gates/security-hook.mjs', import.meta.url).href);

const CONTRACT = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const commands = [
  ['read-only grep (this session, turn 1)', "grep -n -i -E 'writeFileSync|Set-Content|Out-File' scripts/workflow-gates/security-hook.mjs | head -30"],
  ['read-only grep + sed -n (Task 940 approver session)', "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs; sed -n '60,70p' .claude/rules/review/03-decision-closure.md"],
  ['read-only PowerShell Select-String', "Select-String -Pattern 'Set-Content' -Path scripts/workflow-gates/security-hook.mjs"],
  ['read-only grep naming a product path (designer session, refused as ORCHESTRATOR BOUNDARY)', "grep -n -E 'Set-Content|echo injected > src/profile.ts' scripts/workflow-gates/diff-hook.selftest.mjs"],
  ['write: Set-Content',"Set-Content 'scripts/workflow-gates/cli.mjs' 'x'"],
  ['write: node -e writeFileSync', `node -e "require('fs').writeFileSync('scripts/workflow-gates/cli.mjs', 'x')"`],
  ['write: redirection', 'echo x > scripts/workflow-gates/cli.mjs'],
  ['write: grep redirected into a scope file', "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs > scripts/workflow-gates/publication.json"],
];
const lines = [`platform ${process.platform}; node ${process.version}; root ${root}`];
for (const [label, command] of commands) lines.push(`${label} | targets ${JSON.stringify(shellWriteTargets(root, command))}`);

const transcript = [
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'r1', name: 'Bash', input: { command: commands[1][1] } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'r1', content: 'read output' }] } },
].map(line => JSON.stringify(line)).join('\n');
const contract = JSON.parse((await import('node:fs')).readFileSync(join(root, CONTRACT), 'utf8'));
lines.push(`governanceIndependenceErrors(940 contract, transcript with only the read-only command) | ${JSON.stringify(governanceIndependenceErrors(root, contract, CONTRACT, transcript))}`);
const text = `${lines.join('\n')}\n`;
process.stdout.write(text);
writeFileSync(join(here, 'p01-false-positive-probe.txt'), text);
