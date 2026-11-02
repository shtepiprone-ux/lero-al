// Task 943 revision 1 self-audit (Opus, read-only, 2026-11-02): section 5b requires, for every case whose testFile a
// `tests` entry lists, that the file text still contains `[<id>]` and the part of `testName` after `[<id>] `. Is that
// literal check feasible on the reviewed contracts the D12 entries will rebase? Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const CONTRACTS = [
  'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
  'tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json',
  'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json',
  'tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json',
];
for (const path of CONTRACTS) {
  let c; try { c = readJson(ROOT, path); } catch (error) { console.log(`${path}: unreadable (${error.message})`); continue; }
  let ok = 0; const misses = [];
  for (const row of c.cases) {
    const text = readFileSync(resolve(ROOT, row.testFile), 'utf8');
    const prefix = `[${row.id}] `;
    const rest = row.testName.startsWith(prefix) ? row.testName.slice(prefix.length) : null;
    const hasId = text.includes(`[${row.id}]`);
    const hasRest = rest !== null && text.includes(rest);
    if (hasId && hasRest) ok++; else misses.push(`${row.id} id:${hasId} prefix:${rest !== null} rest:${hasRest} file:${row.testFile}`);
  }
  console.log(`${path.split('/').pop()}: cases ${c.cases.length}; literal ok ${ok}; misses ${misses.length}`);
  for (const m of misses.slice(0, 3)) console.log(`  miss ${m}`);
  console.log(`  misses with the [id] still in the file: ${misses.filter(m => m.includes(' id:true ')).length} of ${misses.length}`);
}
