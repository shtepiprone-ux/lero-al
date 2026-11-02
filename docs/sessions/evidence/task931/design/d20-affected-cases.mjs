// Task 931 revision 3 design (Opus, read-only, 2026-11-02): how many mapped cases of each reviewed contract live in the files
// revision 3 changes (the d16 migration list plus the five class A files)? Usage: node <this file>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const read = p => readFileSync(resolve(ROOT, p), 'utf8');
const d16 = read('docs/sessions/evidence/task931/design/d16-guard-criterion.txt').split(/\r?\n/);
const migrate = d16.slice(d16.indexOf('Guard hits (the revision 3 migration list):') + 1).filter(l => /^src\/\S+\.test\.tsx?$/.test(l));
const CLASS_A = ['src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  // added after d18/d22: a short find default under load (class A)
  'src/modules/listings/components/__tests__/ListingDetailView.contactSession.security.test.tsx'];
const changed = new Set([...migrate, ...CLASS_A]);
for (const p of ['tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json', 'tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json',
  'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json', 'tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json']) {
  const c = JSON.parse(read(p));
  const hit = c.cases.filter(r => changed.has(r.testFile));
  console.log(`${p.split('/').pop()}: cases ${c.cases.length}; in changed files ${hit.length}; files ${new Set(hit.map(r => r.testFile)).size}; integration among them ${hit.filter(r => r.boundary === 'integration').length}`);
}
console.log(`class A files in the migration list: ${CLASS_A.filter(f => migrate.includes(f)).length}`);
