// Task 931 revision 3 (Opus, read-only, 2026-11-02): for every file revision 3 changes, which reviewed contract scopes it,
// and is it a case test or runtime file of that contract (a case test is never rebased, Task 940 D9)?
// Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { isRuntimeFile } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const CHANGED = [
  'src/tests/fakeSupabase.ts', 'src/tests/__tests__/fakeSupabase.test.ts',
  'src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  'src/app/[locale]/[slug]/__tests__/page.errors.test.ts', 'src/app/api/cron/listings-expiry/__tests__/route.test.ts',
  'src/app/auth/confirm/__tests__/route.test.ts', 'src/lib/__tests__/exchangeRateServer.test.ts', 'src/lib/__tests__/exchangeRates.security.test.ts',
  'src/lib/auth/__tests__/blockCheck.security.test.ts', 'src/lib/auth/__tests__/permissions.test.ts', 'src/lib/auth/__tests__/staffPage.security.test.ts',
  'src/lib/auth/blockCheck.security.test.ts', 'src/lib/auth/requireViewer.security.test.ts', 'src/modules/__tests__/rls-write-guards.smoke.test.ts',
  'src/modules/admin/actions/__tests__/adminGetters.security.test.ts', 'src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts',
  'src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts', 'src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts',
  'src/modules/admin/actions/__tests__/userWebsite.security.test.ts', 'src/modules/auth/actions/__tests__/recovery.security.test.ts',
  'src/modules/cabinet/actions/__tests__/changePassword.security.test.ts', 'src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts',
  'src/modules/listings/actions/__tests__/contactEvents.test.ts', 'src/modules/listings/actions/__tests__/createListing.smoke.test.ts',
  'src/modules/listings/actions/__tests__/deleteListing.security.test.ts', 'src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts',
  'src/modules/listings/actions/__tests__/listingImages.security.test.ts', 'src/modules/listings/actions/__tests__/reStampExpiresAt.smoke.test.ts',
  'src/modules/listings/actions/__tests__/reportListing.smoke.test.ts', 'src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts',
  'src/modules/listings/actions/__tests__/updateListing.smoke.test.ts', 'src/modules/listings/actions/__tests__/visitorActions.security.test.ts',
  'src/modules/listings/actions/ownerPublish.security.test.ts', 'src/modules/listings/actions/submitListingInquiry.test.ts',
  'src/modules/notifications/lib/__tests__/notifications.security.test.ts',
];
const contracts = [];
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const f of readdirSync(resolve(ROOT, dir))) if (f.endsWith('.security.json')) {
  try { const c = readJson(ROOT, `${dir}/${f}`); if (Array.isArray(c.scope)) contracts.push([`${dir}/${f}`, c]); } catch {}
}
let caseConflicts = 0;
for (const file of CHANGED) {
  const hits = [];
  for (const [path, c] of contracts) {
    const scoped = c.scope.includes(file); const caseTest = (c.cases || []).some(r => r.testFile === file);
    if (scoped || caseTest) hits.push(`${path.split('/').pop()} [stage ${c.stage}${c.executionStatus ? `/${c.executionStatus}` : ''}]${scoped ? ' scope' : ''}${caseTest ? ' CASE-TEST' : ''}`);
    if (caseTest && c.stage === 'reviewed' && !/Task_931_/.test(path)) caseConflicts++;
  }
  console.log(`${file}${isRuntimeFile(file) ? ' (runtime)' : ''}: ${hits.length ? hits.join('; ') : 'no contract'}`);
}
console.log(`reviewed contracts other than 931 with a changed case test: ${caseConflicts}`);
