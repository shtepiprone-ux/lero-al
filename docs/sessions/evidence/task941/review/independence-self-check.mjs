// Task 941 approver, read-only: the Stop hook's governanceIndependenceErrors on this session's own transcript, for the
// archived 941 contract. Usage: node <this file> <transcript .jsonl path>. Prints the error count only (no transcript text).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { governanceIndependenceErrors } from '../../../../../scripts/workflow-gates/security-hook.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json';
const errors = governanceIndependenceErrors(ROOT, readJson(ROOT, C941), C941, readFileSync(process.argv[2], 'utf8'));
console.log(`941 independence errors: ${errors.length}`);
for (const error of errors) console.log(`  ${error}`);
