// Task 931 revision (Opus, read-only): in-memory readiness of the saved draft sidecar as `ready` (orchestration-state),
// and a simulated R10 on a temporary copy of the repository contracts to show the 935 entry by this contract validates.
// Usage: node <this file>
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateContract, scopeDigest, digest, scopeEntryErrors } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C931 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const saved = readJson(ROOT, C931);
console.log(`saved executionStatus ${saved.executionStatus}; stage ${saved.stage}`);
console.log(`ready candidate plan errors: ${JSON.stringify(validateContract(ROOT, { ...saved, executionStatus: 'ready' }, { phase: 'plan' }))}`);

// Simulated R10 (c) on a temporary root holding only the files the 935 entry check reads.
const tmp = mkdtempSync(join(tmpdir(), 'lero-931-r10-'));
try {
  const c935 = readJson(ROOT, C935);
  const needed = new Set([C931, C935, C923, ...c935.scope, ...c935.rules, ...c935.cases.map(c => c.testFile),
    '.claude/rules/shared/workflow-contract.md', '.claude/rules/shared/workflow-evidence.md', '.claude/rules/shared/workflow-ci.md',
    'package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc', 'src/tests/setup.ts', 'src/tests/integration/setup.ts',
    'next.config.ts', 'vitest.config.ts', 'vitest.integration.config.ts']);
  for (const file of needed) if (existsSync(join(ROOT, file))) { mkdirSync(dirname(join(tmp, file)), { recursive: true }); cpSync(join(ROOT, file), join(tmp, file)); }
  const before = scopeDigest(tmp, c935);
  writeFileSync(join(tmp, C923), `${readFileSync(join(tmp, C923), 'utf8')} `); // stands in for the 923 entry of R10 (b)
  const after = scopeDigest(tmp, c935);
  const reviewed = { ...readJson(tmp, C931), stage: 'reviewed' };
  writeFileSync(join(tmp, C931), JSON.stringify(reviewed, null, 2));
  const evidence = 'docs/sessions/evidence/task931/review/scope-rebase-935.md';
  mkdirSync(dirname(join(tmp, evidence)), { recursive: true });
  writeFileSync(join(tmp, evidence), `# Scope rebase\n\n## Changed scope files\n- \`${C923}\`\n`);
  const entry = { kind: 'scope', by: C931, evidence, evidenceSha256: digest(tmp, [evidence]), originalScopeSha256: before, rebasedScopeSha256: after };
  console.log(`935 digest changed by the 923 write: ${before !== after}`);
  console.log(`935 scope entry by the reviewed 931 contract: ${JSON.stringify(scopeEntryErrors(tmp, c935, entry))}`);
  const unscoped = { ...reviewed, scope: reviewed.scope.filter(file => file !== C923) };
  writeFileSync(join(tmp, C931), JSON.stringify(unscoped, null, 2));
  console.log(`same entry without the 923 file in the 931 scope: ${JSON.stringify(scopeEntryErrors(tmp, c935, entry))}`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
