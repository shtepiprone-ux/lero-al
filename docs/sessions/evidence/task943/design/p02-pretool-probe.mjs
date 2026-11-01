// Task 943 design probe (Opus designer, 2026-11-01). Read-only: runs the real pre-write guard for an executor event on
// commands that write a policy or product file without a recognised write word, next to the detected control.
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../..');
const { evaluateHook } = await import(new URL('../../../../../scripts/workflow-gates/security-hook.mjs', import.meta.url).href);
const event = (tool_name, command) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name, tool_input: { command } });
const rows = [
  ['executor cp into a policy file', event('Bash', 'cp docs/backlog.md scripts/check-example.mjs')],
  ['executor sed -i on a policy file', event('Bash', "sed -i 's/a/b/' scripts/workflow-gates/cli.mjs")],
  ['executor Copy-Item into a policy file', event('PowerShell', 'Copy-Item -Path docs/backlog.md -Destination scripts/workflow-gates/cli.mjs')],
  ['executor cp into a product file', event('Bash', 'cp docs/backlog.md src/lib/example.ts')],
  ['control: executor Set-Content into a policy file', event('PowerShell', "Set-Content 'scripts/workflow-gates/cli.mjs' 'x'")],
];
const lines = [`platform ${process.platform}; node ${process.version}`];
for (const [label, value] of rows) lines.push(`${label}: ${JSON.stringify(evaluateHook(root, value, ''))}`);
const text = `${lines.join('\n')}\n`;
process.stdout.write(text);
writeFileSync(join(here, 'p02-pretool-probe.txt'), text);
