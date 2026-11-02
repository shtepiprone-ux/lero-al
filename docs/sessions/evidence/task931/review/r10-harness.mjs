// Task 931 reviewer, read-only: anchors, digests and release validation for the R10 rebases. Usage:
//   node <this file> <anchor rev> <diff base sha> <931 contract path>
// Anchor: the 923 scope digest with the <anchor rev> contents of the three auth test files, and the 935 scope digest with the
// <anchor rev> contents of the 923 contract file, are compared with the last recorded digest of each chain.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest, planDigest, digest, validateContract, validateGovernanceReport, validateReport, rebaseChain } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson, validateDiff, changedFiles } from '../../../../../scripts/workflow-gates/cli.mjs';

const root = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const [anchorRev, base, C931] = process.argv.slice(2);
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const AUTH_TESTS = ['src/lib/auth/__tests__/permissions.test.ts',
  'src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts',
  'src/modules/cabinet/statistics/__tests__/access.test.ts'];
const at = (rev, file) => { try { return execFileSync('git', ['show', `${rev}:${file}`], { cwd: root }); } catch { return null; } };
const last = contract => { const { entries } = rebaseChain(contract); return entries.length ? entries.at(-1).entry.rebasedScopeSha256 : contract.review?.scopeSha256; };

console.log(`anchor ${anchorRev}; diff base ${base}`);
for (const [path, files] of [[C923, AUTH_TESTS], [C935, [C923]]]) {
  const contract = readJson(root, path);
  const anchored = scopeDigest(root, contract, new Map(files.map(file => [file, at(anchorRev, file)])));
  const changed = files.filter(file => { const old = at(anchorRev, file); return !old || digest(root, [file]) !== digest(root, [file], undefined, new Map([[file, old]])); });
  console.log(`${path}`);
  console.log(`  chain entries ${rebaseChain(contract).entries.length}; last recorded digest ${last(contract)}`);
  console.log(`  digest with ${anchorRev} contents of the listed files ${anchored} (${anchored === last(contract) ? 'EQUALS LAST RECORDED' : 'DIFFERS'})`);
  console.log(`  listed files changed since ${anchorRev}: ${changed.length}/${files.length}`);
  console.log(`  current scope digest ${scopeDigest(root, contract)}`);
}
for (const path of [C931, C923, C935]) {
  try {
    const contract = readJson(root, path);
    console.log(`${path}`);
    console.log(`  stage ${contract.stage}; taskDigest ${digest(root, [contract.task])} (recorded ${contract.taskSha256}); planDigest ${planDigest(root, contract)}`);
    console.log(`  release errors: ${JSON.stringify(validateContract(root, contract, { phase: 'release' }))}`);
    if (contract.kind === 'product' && path === C931) console.log(`  report errors: ${JSON.stringify(validateReport(root, contract, readJson(root, contract.report)))}`);
    if (contract.kind === 'governance') console.log(`  report errors: ${JSON.stringify(validateGovernanceReport(root, contract, readJson(root, contract.report)))}`);
  } catch (error) { console.log(`${path}: ERROR ${error.message}`); }
}
const files = changedFiles(root, { base, working: true });
const { errors } = validateDiff(root, files, { phase: 'release', base });
console.log(`validateDiff release, base ${base}: ${files.length} changed file(s)`);
for (const [task, path] of Object.entries({ 923: C923, 931: C931, 935: C935 })) {
  const own = errors.filter(error => error.startsWith(`${path}:`));
  console.log(`  ${task}: ${own.length ? `${own.length} error(s)` : 'no error'}`);
  for (const error of own) console.log(`    ${error}`);
}
const other = errors.filter(error => ![C923, C931, C935].some(path => error.startsWith(`${path}:`)));
console.log(`  other: ${other.length} error(s)`);
for (const error of other) console.log(`    ${error}`);
