// Task 944 review 3 (approver, read-only): the Stop hook's own governanceIndependenceErrors on this session's transcript, and the
// calls it counts as writes of a 944 scope file. Usage (project root): node docs/sessions/evidence/task944/review/r3-independence.mjs <transcript.jsonl>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { governanceIndependenceErrors, shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json';
const contract = JSON.parse(readFileSync(resolve(ROOT, PATH), 'utf8'));
const transcript = readFileSync(process.argv[2], 'utf8');
const errors = governanceIndependenceErrors(ROOT, contract, PATH, transcript);
console.log(`GOVERNANCE INDEPENDENCE errors: ${errors.length}`);
for (const error of errors) console.log(`  ${error}`);
let calls = 0, hits = 0;
const scope = new Set(contract.scope.map(file => file.toLowerCase()));
for (const line of transcript.split('\n')) {
  if (!line.trim()) continue;
  let entry; try { entry = JSON.parse(line); } catch { continue; }
  for (const block of Array.isArray(entry?.message?.content) ? entry.message.content : []) {
    if (block?.type !== 'tool_use') continue;
    if (['Bash', 'PowerShell'].includes(block.name) && typeof block.input?.command === 'string') {
      calls++;
      const targets = shellWriteTargets(ROOT, block.input.command).filter(file => scope.has(String(file).toLowerCase()));
      if (targets.length) { hits++; console.log(`  shell call counted as a write of ${JSON.stringify(targets)}: ${block.input.command.slice(0, 120)}`); }
    } else if (['Write', 'Edit'].includes(block.name)) {
      calls++;
      const file = String(block.input?.file_path || '').replaceAll('\\', '/').replace(/^.*\/lero-al\//, '');
      if (scope.has(file.toLowerCase())) { hits++; console.log(`  ${block.name} of scope file ${file}`); }
    }
  }
}
console.log(`${calls} write-capable calls read; ${hits} touching a scope file`);
