import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const { scopeDigest } = await import(pathToFileURL(root + '/scripts/workflow-gates/contract.mjs'));
const p = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const c = JSON.parse(readFileSync(root + '/' + p, 'utf8'));
const now = scopeDigest(root, c);
console.log('935 review.scopeSha256 ', c.review.scopeSha256);
console.log('935 current scopeDigest', now);
for (const f of ['scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/cli.mjs', 'scripts/workflow-gates/security-hook.mjs', '.claude/rules/review/03-decision-closure.md']) {
  const o = new Map([[f, readFileSync(root + '/' + f, 'utf8') + '\n// probe edit\n']]);
  console.log('in 935 scope:', c.scope.includes(f), '| digest after editing', f, scopeDigest(root, c, o) === now ? 'UNCHANGED' : 'CHANGED');
}
