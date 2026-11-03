// Task 943 approver (review 3, session e50584bc): appends the R6 rebase entries with canonical digests, then prints each
// chain's errors. Writes only the 935, 940, 941, 923 owner-fixes and 927 contract files (none is a 943 scope file).
// Usage (project root, once): node test-results/943-r3/write-rebases.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const { scopeDigest, digest, rebaseChainErrors } = await import(new URL('../../scripts/workflow-gates/contract.mjs', import.meta.url));
const { gitBaseReader } = await import(new URL('../../scripts/workflow-gates/cli.mjs', import.meta.url));
const EV = 'docs/sessions/evidence/task943/review';
const C943 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C940 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const C941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json';
const C927 = 'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json';
const read = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const save = (p, v) => writeFileSync(resolve(ROOT, p), `${JSON.stringify(v, null, 2)}\n`);
const latest = c => (c.review.rebases?.length ? c.review.rebases.at(-1).rebasedScopeSha256 : c.review.scopeSha256);
const entry = (kind, by, evidence, original, rebased) => ({ kind, by, evidence: `${EV}/${evidence}`, evidenceSha256: digest(ROOT, [`${EV}/${evidence}`]), originalScopeSha256: original, rebasedScopeSha256: rebased });
const append = (path, ...entries) => {
  const c = read(path);
  if ((c.review.rebases || []).some(e => entries.some(n => n.evidence === e.evidence))) throw new Error(`${path}: entry already written`);
  c.review.rebases = [...(c.review.rebases || []), ...entries];
  save(path, c);
};
for (const [path, evidence] of [[C935, 'scope-rebase-935.md'], [C940, 'scope-rebase-940.md']]) {
  const c = read(path);
  append(path, entry('scope', C943, evidence, latest(c), scopeDigest(ROOT, c)));
}
{
  const c = read(C941);
  const base = gitBaseReader(ROOT, 'b85f5a66b');
  const T = 'scripts/workflow-gates/shell-write.selftest.mjs';
  const intermediate = scopeDigest(ROOT, c, new Map([[T, base(T)]]));
  console.log(`941 intermediate digest ${intermediate}`);
  append(C941, entry('scope', C943, 'scope-rebase-941.md', latest(c), intermediate),
    entry('tests', C943, 'tests-rebase-941.md', intermediate, scopeDigest(ROOT, c)));
}
for (const [path, evidence] of [[C923, 'rules-rebase-923-owner-fixes.md'], [C927, 'rules-rebase-927.md']]) {
  const c = read(path);
  append(path, entry('rules', C935, evidence, latest(c), scopeDigest(ROOT, c)));
}
for (const path of [C935, C940, C941, C923, C927]) {
  const c = read(path);
  const last = c.review.rebases.at(-1);
  console.log(`${path}: entries ${c.review.rebases.length}; last ${last.kind} by ${last.by.split('/').pop()} ${last.originalScopeSha256.slice(0, 12)} -> ${last.rebasedScopeSha256.slice(0, 12)}; rebaseChainErrors ${JSON.stringify(rebaseChainErrors(ROOT, c))}`);
}
