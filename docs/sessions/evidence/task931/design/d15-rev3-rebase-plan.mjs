// Task 931 revision 3 design (Opus, read-only, 2026-11-02): for the full revision 3 change set, which reviewed contract
// needs which rebase entry kind? Change set = the 64 non-integration files of d09, the five class A files, the N1 file,
// src/tests/fakeSupabase.ts and the two new tests. Contract files the approver writes are listed separately.
// Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { workflowRuleInputs, isRuntimeFile } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const d09 = readFileSync(resolve(ROOT, 'docs/sessions/evidence/task931/design/d09-hand-written-query-doubles.txt'), 'utf8')
  .split(/\r?\n/).filter(line => /^src\/\S+\.test\.tsx?$/.test(line));
const integration = d09.filter(f => f.endsWith('.integration.test.ts'));
// The migration list is the guard criterion's list (d16-guard-criterion.txt), not d09.
const d16 = readFileSync(resolve(ROOT, 'docs/sessions/evidence/task931/design/d16-guard-criterion.txt'), 'utf8').split(/\r?\n/);
const migrate = d16.slice(d16.indexOf('Guard hits (the revision 3 migration list):') + 1).filter(line => /^src\/\S+\.test\.tsx?$/.test(line));
const CLASS_A = ['src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  // added after d18/d22: a short find default under load (class A)
  'src/modules/listings/components/__tests__/ListingDetailView.contactSession.security.test.tsx'];
const N1 = 'src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts';
const NEW = ['src/tests/__tests__/fakeSupabase.test.ts', 'src/tests/__tests__/queryDoubles.guard.test.ts'];
const changed = [...new Set([...migrate, ...CLASS_A, N1, 'src/tests/fakeSupabase.ts', ...NEW])];
console.log(`d09 files ${d09.length}; integration ${integration.length}; to migrate ${migrate.length}; class A in d09 ${CLASS_A.filter(f => d09.includes(f)).length}; N1 in d09 ${d09.includes(N1)}; change set ${changed.length}; runtime files in it ${changed.filter(isRuntimeFile).length}; new files existing ${NEW.filter(f => existsSync(resolve(ROOT, f))).length}`);
const contracts = [];
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const f of readdirSync(resolve(ROOT, dir))) if (f.endsWith('.security.json')) {
  try { const c = readJson(ROOT, `${dir}/${f}`); if (Array.isArray(c.scope)) contracts.push([`${dir}/${f}`, c]); } catch {}
}
for (const [path, c] of contracts) {
  const tests = new Set(c.cases.map(r => r.testFile));
  const caseTests = changed.filter(f => tests.has(f));
  const scopeOnly = changed.filter(f => c.scope.includes(f) && !tests.has(f));
  const bound = changed.filter(f => (c.inputs || []).includes(f) || workflowRuleInputs(ROOT, c.rules || []).includes(f));
  const contractFiles = contracts.map(([p]) => p).filter(p => c.scope.includes(p));
  if (!caseTests.length && !scopeOnly.length && !bound.length && !contractFiles.length) continue;
  console.log(`${path.split('/').pop()} [${c.kind}, ${c.stage}]: case tests ${caseTests.length}; non-case scope files ${scopeOnly.length}; inputs/rules ${bound.length}; contract files in scope ${JSON.stringify(contractFiles.map(p => p.split('/').pop()))}`);
  if (scopeOnly.length) console.log(`  non-case scope files: ${scopeOnly.join(', ')}`);
}
