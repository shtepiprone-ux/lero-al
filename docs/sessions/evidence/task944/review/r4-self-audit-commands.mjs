// Task 944 review 4 self-audit (read-only): lists this session's shell commands that name a file of the 944 scope and break the owner's
// handoff rule: one job, no $(...), ${...}, heredoc, backticks or node -e, and no write program in the same line. Writes no file.
// Usage (project root): node docs/sessions/evidence/task944/review/r4-self-audit-commands.mjs <transcript.jsonl>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const contract = JSON.parse(readFileSync(resolve(ROOT, 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json'), 'utf8'));
const scope = contract.scope.map(file => file.toLowerCase());
const seen = new Set();
let shell = 0, naming = 0, multi = 0, forbidden = 0, writers = 0;
for (const line of readFileSync(process.argv[2], 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let entry; try { entry = JSON.parse(line); } catch { continue; }
  for (const block of Array.isArray(entry?.message?.content) ? entry.message.content : []) {
    if (block?.type !== 'tool_use' || !['Bash', 'PowerShell'].includes(block.name) || typeof block.input?.command !== 'string' || seen.has(block.id)) continue;
    seen.add(block.id);
    shell++;
    const command = block.input.command;
    const lower = command.toLowerCase();
    const named = scope.filter(file => lower.includes(file));
    if (!named.length) continue;
    naming++;
    const body = command.replace(/^cd \S+; /, '');
    const isMulti = /[;|&\n]/.test(body.replace(/'[^']*'|"[^"]*"/g, ''));
    const isForbidden = /\$\(|\$\{|<<|`|node -e/.test(command);
    const isWriter = /\b(?:sed -i|mv|cp|tee)\s|(?:^|[;&|]\s*)rm\s/.test(command);
    if (isMulti) multi++; if (isForbidden) forbidden++; if (isWriter) writers++;
    if (isMulti || isForbidden || isWriter) console.log(`${isMulti ? 'MULTI ' : ''}${isForbidden ? 'FORBIDDEN-FORM ' : ''}${isWriter ? 'WRITE-PROGRAM ' : ''}names ${named.map(file => file.split('/').pop()).join(', ')} :: ${command.slice(0, 150).replace(/\n/g, ' ')}`);
  }
}
console.log(`${shell} shell commands; ${naming} name a scope file; more than one job ${multi}; forbidden form ${forbidden}; write program ${writers}`);
