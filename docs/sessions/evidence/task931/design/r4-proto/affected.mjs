// Task 931 revision 4: which reviewed contracts the test files of class D touch. Read-only. Run from the repository root.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const fresh = ['src/app/admin/listings/__tests__/page.test.tsx', 'src/modules/admin/actions/__tests__/permissions.failures.test.ts', 'src/modules/listings/actions/__tests__/applyListingTransition.effects.test.ts'];
const changed = ['src/modules/listings/actions/__tests__/contactEvents.test.ts', 'src/modules/listings/actions/submitListingInquiry.test.ts', 'src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx', 'src/tests/fakeSupabase.ts', 'src/tests/__tests__/fakeSupabase.test.ts'];
const d16 = readFileSync('docs/sessions/evidence/task931/design/d16-guard-criterion.txt', 'utf8');
const own = JSON.parse(readFileSync('tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json', 'utf8'));
const reviewed = [];
for (const folder of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(folder).filter(f => f.endsWith('.security.json'))) {
  const contract = JSON.parse(readFileSync(join(folder, name), 'utf8'));
  if (contract.stage === 'reviewed' && contract.review) reviewed.push({ name: /Task_\d+[^.]{0,24}/.exec(name)?.[0] ?? name, contract });
}
const holders = file => reviewed.filter(({ contract }) => contract.scope?.includes(file) || contract.inputs?.includes(file) || contract.cases?.some(row => row.testFile === file)).map(({ name }) => name);
console.log(`reviewed contracts ${reviewed.length}`);
for (const file of fresh) console.log(`new ${file}: exists today ${existsSync(file)}; held by ${holders(file).length} reviewed contracts`);
for (const file of changed) console.log(`changed ${file}: in the 931 scope ${own.scope.includes(file)}; a guard hit of d16 ${d16.includes(file)}; held by: ${holders(file).join(', ') || 'none'}`);
console.log(`new files held by a reviewed contract: ${fresh.filter(file => holders(file).length).length}`);
const tsconfig = readFileSync('tsconfig.json', 'utf8');
console.log(`tsconfig exclude: ${/"exclude"\s*:\s*\[[^\]]*\]/.exec(tsconfig)?.[0].replace(/\s+/g, ' ').slice(0, 300)}`);
