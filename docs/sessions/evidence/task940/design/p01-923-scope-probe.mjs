import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const { scopeDigest } = await import(pathToFileURL(root + '/scripts/workflow-gates/contract.mjs'));
const p = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const c = JSON.parse(readFileSync(root + '/' + p, 'utf8'));
const now = scopeDigest(root, c);
console.log('review.scopeSha256        ', c.review.scopeSha256);
console.log('rulesRebase.rebasedScope  ', c.review.rulesRebase?.rebasedScopeSha256);
console.log('current scopeDigest       ', now);
for (const f of ['src/lib/auth/__tests__/permissions.test.ts', 'src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts', 'src/modules/cabinet/statistics/__tests__/access.test.ts', 'src/app/api/cron/listings-expiry/__tests__/route.test.ts']) {
  const o = new Map([[f, readFileSync(root + '/' + f, 'utf8') + '\n// probe edit\n']]);
  console.log('digest after editing', f.split('/').pop().padEnd(40), scopeDigest(root, c, o) === now ? 'UNCHANGED' : 'CHANGED');
}
