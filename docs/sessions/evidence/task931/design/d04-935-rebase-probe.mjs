// Task 931 revision (Opus, read-only): can this task's reviewer rebase the Task 935 contract after writing the Task 923
// D8/D9 contract (R10)? Prints the 935 scope membership, case-test and runtime status of the 923 contract file and the
// digest effect of a later write to it. Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { scopeDigest, isRuntimeFile } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const C931 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json';
const c935 = readJson(ROOT, C935);
const current = scopeDigest(ROOT, c935);
const touched = scopeDigest(ROOT, c935, new Map([[C923, `${readFileSync(resolve(ROOT, C923), 'utf8')} `]]));
console.log(`923 contract listed in 935 scope: ${c935.scope.includes(C923)}`);
console.log(`923 contract is a 935 case test file: ${c935.cases.some(row => row.testFile === C923)}`);
console.log(`923 contract is a runtime file: ${isRuntimeFile(C923)}`);
console.log(`935 digest after a later write to the 923 contract: ${touched === current ? 'unchanged' : 'CHANGED'}`);
console.log(`923 contract listed in 931 scope: ${readJson(ROOT, C931).scope.includes(C923)}`);
