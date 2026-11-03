// Task 943 review 1 self-audit: can the 943 approver extend the 941 chain with a `scope` entry and then a `tests` entry
// (revision 4 R6) so that the 941 review stays current? Runs on a temporary copy of the tracked files; the repository is
// not changed. Run from the project root: node docs/sessions/evidence/task943/review/r1-r6-chain.mjs
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), 'r6-chain-'));
const out = [];
try {
  for (const file of execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean)) {
    try { mkdirSync(dirname(join(tmp, file)), { recursive: true }); cpSync(join(repo, file), join(tmp, file)); } catch { /* deleted in the tree */ }
  }
  const { scopeDigest, digest, rebaseChainErrors, scopeHashErrors, validateContract } = await import(pathToFileURL(join(repo, 'scripts/workflow-gates/contract.mjs')).href);
  const C941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json';
  const C943 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
  const read = p => JSON.parse(readFileSync(join(tmp, p), 'utf8'));
  const save = (p, v) => { mkdirSync(dirname(join(tmp, p)), { recursive: true }); writeFileSync(join(tmp, p), typeof v === 'string' ? v : `${JSON.stringify(v, null, 2)}\n`); };
  const c = read(C941);
  out.push(`941 review digest equals the digest of the current tree: ${c.review.scopeSha256 === scopeDigest(tmp, c)}`);
  // The 943 approver's contract, reviewed (simulated in the copy).
  const g = read(C943); g.stage = 'reviewed'; save(C943, g);
  // Intermediate digest: the committed 943 hook and publication.json, the 941 test file unchanged.
  const intermediate = scopeDigest(tmp, c);
  // Revision 4 R1: the two 941 assertions change (the form of the p15 feasibility run).
  const T = 'scripts/workflow-gates/shell-write.selftest.mjs';
  const from = 'assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);';
  const to = "assert.deepEqual(shellWriteTargets(root, command), [...previousTargets(root, command), ...(K1.has(command) ? ['writeFileSync'] : [])], command);";
  const k1Set = "const K1 = new Set([`sed -i 's/a/b/' ${X} writeFileSync`, `sed -n 1p -i>o.txt ${X} writeFileSync`]);";
  save(T, readFileSync(join(tmp, T), 'utf8').split(from).join(to).replace("const Y = 'scripts/workflow-gates/reader.mjs';", m => `${m}\n${k1Set}`));
  const current = scopeDigest(tmp, c);
  out.push(`digests: reviewed ${c.review.scopeSha256.slice(0, 12)}, intermediate ${intermediate.slice(0, 12)}, current ${current.slice(0, 12)}`);
  const scopeEv = 'docs/sessions/evidence/task943/review/scope-rebase-941.md';
  const testsEv = 'docs/sessions/evidence/task943/review/tests-rebase-941.md';
  save(scopeEv, '# Scope rebase of Task 941 by Task 943\n\n## Changed scope files\n- `scripts/workflow-gates/security-hook.mjs`\n- `scripts/workflow-gates/publication.json`\n');
  const lines = c.cases.map(row => (row.id === 'GOV-941-HOOK-MALFORMED-ERROR'
    ? `- ${row.id}: two sed -i commands equal to the pre-change result -> the pre-change result followed by the in-place file writeFileSync`
    : `- ${row.id}: unchanged -> unchanged`));
  save(testsEv, `# Case-test rebase of Task 941 by Task 943\n\n## Changed case test files\n- \`${T}\`\n\n## Case assertions\n${lines.join('\n')}\n`);
  c.review.rebases = [...(c.review.rebases || []),
    { kind: 'scope', by: C943, evidence: scopeEv, evidenceSha256: digest(tmp, [scopeEv]), originalScopeSha256: c.review.scopeSha256, rebasedScopeSha256: intermediate },
    { kind: 'tests', by: C943, evidence: testsEv, evidenceSha256: digest(tmp, [testsEv]), originalScopeSha256: intermediate, rebasedScopeSha256: current }];
  save(C941, c);
  const fresh = read(C941);
  out.push(`rebaseChainErrors with scope then tests entry: ${JSON.stringify(rebaseChainErrors(tmp, fresh))}`);
  out.push(`review scopeHashErrors: ${JSON.stringify(scopeHashErrors(tmp, fresh, fresh.review.scopeSha256, 'Independent review scope is stale'))}`);
  const report = read(fresh.report);
  out.push(`report scopeHashErrors: ${JSON.stringify(scopeHashErrors(tmp, fresh, report.scopeSha256, 'Security report scope hash is stale'))}`);
  out.push(`validateContract release: ${JSON.stringify(validateContract(tmp, fresh, { phase: 'release' }))}`);
  // Negative control: a single scope entry that also lists the 941 test file is refused (C37).
  const neg = structuredClone(fresh);
  save('docs/sessions/evidence/task943/review/scope-only-941.md', `# x\n\n## Changed scope files\n- \`scripts/workflow-gates/security-hook.mjs\`\n- \`scripts/workflow-gates/publication.json\`\n- \`${T}\`\n`);
  neg.review.rebases = [{ kind: 'scope', by: C943, evidence: 'docs/sessions/evidence/task943/review/scope-only-941.md', evidenceSha256: digest(tmp, ['docs/sessions/evidence/task943/review/scope-only-941.md']), originalScopeSha256: neg.review.scopeSha256, rebasedScopeSha256: current }];
  out.push(`control, one scope entry listing the case test: ${JSON.stringify(rebaseChainErrors(tmp, neg)).slice(0, 200)}`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(out.join('\n'));
