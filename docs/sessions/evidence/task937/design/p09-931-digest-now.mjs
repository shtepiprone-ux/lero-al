// Task 937 revision 1 (Opus, read-only, 2026-11-02): is the reviewed Task 931 contract current on the real tree?
// Prints its recorded review scope digest, the current scope digest, and the release-phase validation errors.
// Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest, validateContract, rebaseChainErrors } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
for (const path of ['tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json',
  'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json',
  'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json']) {
  const c = readJson(ROOT, path);
  console.log(`${path.split('/').pop()}: review.scopeSha256 ${c.review?.scopeSha256}; current ${scopeDigest(ROOT, c)}; rebases ${(c.review?.rebases || []).length}`);
  console.log(`  release errors ${JSON.stringify(validateContract(ROOT, c, { phase: 'release' }))}; chain errors ${JSON.stringify(rebaseChainErrors(ROOT, c))}`);
}
