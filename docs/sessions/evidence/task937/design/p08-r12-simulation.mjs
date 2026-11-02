// Task 937 revision 1 (Opus, read-only, 2026-11-02): in-memory readiness of the saved draft sidecar as `ready`, and a
// simulated R12 on a temporary copy of the contracts: after the 923 entry, a scope entry by the reviewed 937 contract on
// the 931 and the 935 contract validates and continues each chain; the same entry fails without the 923 file in the 937
// scope (negative control). Writes only to an OS temporary directory, removed at the end. Usage: node <this file>
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateContract, scopeDigest, digest, scopeEntryErrors, rebaseChainErrors } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C937 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_937_Governance_Check_Product_Findings.security.json';
const C931 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const saved = readJson(ROOT, C937);
console.log(`saved executionStatus ${saved.executionStatus}; stage ${saved.stage}; 937 scope lists 923 contract: ${saved.scope.includes(C923)}`);
console.log(`ready candidate plan errors: ${JSON.stringify(validateContract(ROOT, { ...saved, executionStatus: 'ready' }, { phase: 'plan' }))}`);

const tmp = mkdtempSync(join(tmpdir(), 'lero-937-r12-'));
const put = (file, text) => writeFileSync(join(tmp, file), text);
try {
  const targets = [C931, C935].map(path => [path, readJson(ROOT, path)]);
  const needed = new Set([C937, C923, saved.task, ...saved.scope, ...saved.inputs, ...saved.rules,
    '.claude/rules/shared/workflow-contract.md', '.claude/rules/shared/workflow-evidence.md', '.claude/rules/shared/workflow-ci.md',
    'package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc', 'src/tests/setup.ts', 'src/tests/integration/setup.ts',
    'next.config.ts', 'vitest.config.ts', 'vitest.integration.config.ts']);
  for (const [path, c] of targets) for (const f of [path, c.task, c.review?.evidence, ...c.scope, ...(c.inputs || []), ...c.rules, ...c.cases.map(r => r.testFile),
    ...(c.review?.rebases || []).flatMap(r => [r.evidence, r.by])]) if (f) needed.add(f);
  for (const file of needed) if (existsSync(join(ROOT, file))) { mkdirSync(dirname(join(tmp, file)), { recursive: true }); cpSync(join(ROOT, file), join(tmp, file)); }
  const before = Object.fromEntries(targets.map(([path, c]) => [path, scopeDigest(tmp, c)]));
  for (const [path, c] of targets) console.log(`${path.split('/').pop()} copy digest equals real tree: ${before[path] === scopeDigest(ROOT, c)}; chain before the 923 write: ${JSON.stringify(rebaseChainErrors(tmp, c))}`);
  put(C923, `${readFileSync(join(tmp, C923), 'utf8')} `); // stands in for the 923 entry of R12 (b)
  const reviewed = { ...readJson(tmp, C937), stage: 'reviewed' };
  put(C937, JSON.stringify(reviewed, null, 2));
  for (const [path, c] of targets) {
    const name = path.match(/Task_(\d+)/)[1];
    const after = scopeDigest(tmp, c);
    const evidence = `docs/sessions/evidence/task937/review/scope-rebase-${name}.md`;
    mkdirSync(dirname(join(tmp, evidence)), { recursive: true });
    put(evidence, `# Scope rebase\n\n## Changed scope files\n- \`${C923}\`\n`);
    const entry = { kind: 'scope', by: C937, evidence, evidenceSha256: digest(tmp, [evidence]), originalScopeSha256: before[path], rebasedScopeSha256: after };
    const chained = { ...c, review: { ...c.review, rebases: [...(c.review.rebases || []), entry] } };
    console.log(`${name}: digest changed by the 923 write: ${before[path] !== after}; entry errors ${JSON.stringify(scopeEntryErrors(tmp, c, entry))}; chain errors with the entry ${JSON.stringify(rebaseChainErrors(tmp, chained, after))}`);
    put(C937, JSON.stringify({ ...reviewed, scope: reviewed.scope.filter(f => f !== C923) }, null, 2));
    console.log(`${name}: same entry without the 923 file in the 937 scope: ${JSON.stringify(scopeEntryErrors(tmp, c, entry))}`);
    put(C937, JSON.stringify(reviewed, null, 2));
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
