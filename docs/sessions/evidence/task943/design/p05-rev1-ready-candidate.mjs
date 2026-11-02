// Task 943 revision 1 (Opus, read-only, 2026-11-02): in-memory plan validation of the saved draft sidecar as `ready`
// (orchestration-state), and the policy/governance classification of every scope file. Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract, isPolicyPath, isGovernanceScopePath, isEvidencePath } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const saved = readJson(ROOT, PATH);
console.log(`saved executionStatus ${saved.executionStatus}; stage ${saved.stage}; cases ${saved.cases.length}; scope ${saved.scope.length}`);
console.log(`ready candidate plan errors: ${JSON.stringify(validateContract(ROOT, { ...saved, executionStatus: 'ready' }, { phase: 'plan' }))}`);
for (const file of saved.scope) console.log(`${file}: policy ${isPolicyPath(file)}; governance scope ${isGovernanceScopePath(file)}; evidence ${isEvidencePath(file)}`);
