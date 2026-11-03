// Task 943 approver (review 2), read-only: the Stop hook's governanceIndependenceErrors on this session's own transcript, for
// the archived 943 contract. Usage: node <this file> <transcript .jsonl path>. Prints the errors only (no transcript text).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { governanceIndependenceErrors } from '../../../../../scripts/workflow-gates/security-hook.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C943 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const errors = governanceIndependenceErrors(ROOT, readJson(ROOT, C943), C943, readFileSync(process.argv[2], 'utf8'));
console.log(`943 independence errors: ${errors.length}`);
for (const error of errors) console.log(`  ${error}`);
