// Task 937 revision 2 design (Opus, read-only, 2026-11-02): for the full 937 change set, which contract of tasks/ (any stage)
// binds a changed file through scope, inputs, expanded rules, a case testFile or the runtime list, and which contracts scope
// the contract files the 937 reviewer writes? Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowRuleInputs, isRuntimeFile } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson, allContracts } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const self = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_937_Governance_Check_Product_Findings.security.json';
const changed = readJson(ROOT, self).scope.filter(f => !f.endsWith('.security.json'))
  .concat(['docs/sessions/evidence/task923/r33-13a-mojibake.txt']);
const written = ['tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
  'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json'];
console.log(`937 change set ${changed.length} files; runtime files in it ${changed.filter(isRuntimeFile).length}`);
for (const path of allContracts(ROOT)) {
  if (path === self) continue;
  let c; try { c = readJson(ROOT, path); } catch { console.log(`${path}: unreadable`); continue; }
  const tests = new Set((c.cases || []).map(r => r.testFile));
  const rules = workflowRuleInputs(ROOT, c.rules || []);
  const hits = changed.flatMap(f => [
    ...(c.scope || []).includes(f) ? [`scope ${f}`] : [], ...(c.inputs || []).includes(f) ? [`inputs ${f}`] : [],
    ...rules.includes(f) ? [`rules ${f}`] : [], ...tests.has(f) ? [`case test ${f}`] : []]);
  const contractFiles = written.filter(w => (c.scope || []).includes(w) || (c.inputs || []).includes(w));
  if (!hits.length && !contractFiles.length) continue;
  console.log(`${path} [${c.kind}, ${c.stage}]`);
  for (const h of hits) console.log(`  binds ${h}`);
  for (const w of contractFiles) console.log(`  scopes written contract ${w}`);
}
