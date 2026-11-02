// Task 931 revision 3 / Task 943 revision 1 self-audit (Opus, read-only, 2026-11-02): for every file that 943 or 931
// revision 3 changes, list each contract (any stage) that binds it through scope, inputs, rules (expanded as the digest
// does) or a case test, so every staleness a rebase cannot repair is visible before publication. Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { workflowRuleInputs } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const list = readFileSync(resolve(ROOT, 'docs/sessions/evidence/task931/design/d09-hand-written-query-doubles.txt'), 'utf8')
  .split(/\r?\n/).filter(line => /^src\//.test(line));
const CHANGED = [
  'scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/publication.json', 'scripts/workflow-gates/contract.mjs',
  '.claude/rules/review/03-decision-closure.md', '.claude/rules/review/04-contract-rebases.md', 'src/tests/fakeSupabase.ts',
  'src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx', ...list,
];
const contracts = [];
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const f of readdirSync(resolve(ROOT, dir))) if (f.endsWith('.security.json')) {
  try { const c = readJson(ROOT, `${dir}/${f}`); if (Array.isArray(c.scope)) contracts.push([`${dir}/${f}`, c]); } catch {}
}
const counts = { scope: 0, inputs: 0, rules: 0, caseTest: 0 };
const caseTestOwners = {};
for (const file of [...new Set(CHANGED)]) {
  for (const [path, c] of contracts) {
    const how = [];
    if (c.scope.includes(file)) how.push('scope');
    if ((c.inputs || []).includes(file)) how.push('INPUTS');
    if (workflowRuleInputs(ROOT, c.rules || []).includes(file)) how.push('RULES');
    if ((c.cases || []).some(r => r.testFile === file)) how.push('case-test');
    if (!how.length) continue;
    if (how.includes('INPUTS') || how.includes('RULES')) console.log(`${file} <- ${path.split('/').pop()} [${c.stage}] ${how.join(',')}`);
    for (const h of how) counts[h === 'INPUTS' ? 'inputs' : h === 'RULES' ? 'rules' : h === 'case-test' ? 'caseTest' : 'scope']++;
    if (how.includes('case-test')) { const key = `${path.split('/').pop()} [${c.stage}]`; caseTestOwners[key] = (caseTestOwners[key] || 0) + 1; }
  }
}
for (const [owner, n] of Object.entries(caseTestOwners)) console.log(`case-test files of ${owner}: ${n}`);
console.log(`bindings: ${JSON.stringify(counts)} over ${new Set(CHANGED).size} files and ${contracts.length} contracts`);
