// Task 923 review 8 (Opus, 2026-10-18): owner D30-D34 (hard delete everywhere, staff traces keep a name, the person's statistics go,
// reports and inquiries stay, companies go with their creator, DELETE typed in both dialogs) enter the D8/D9 contract as R43's cases.
// Record "Opus corrections (review 8)" (12). Run from the repository root after rv8-08 and after the record (.md) is final:
//   node docs/sessions/evidence/task923/review-8/rv8-09-amend-contract-deletion.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';

const file = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const text = readFileSync(file, 'utf8');
const contract = JSON.parse(text);

const unit = 'src/lib/account/deleteAccount.security.test.ts';
const integ = 'src/lib/account/deleteAccount.integration.test.ts';
const fe = 'src/modules/cabinet/components/__tests__/deleteAccount.security.test.tsx';
for (const path of [
  'src/lib/account/deleteAccount.ts', unit, integ, fe,
  'src/modules/admin/actions/index.ts', 'src/modules/cabinet/actions/index.ts', 'src/app/api/cron/inactivity/route.ts',
  'src/modules/cabinet/components/ProfileTab.tsx',
  'src/modules/admin/actions/__tests__/userAdministration.security.test.ts', 'src/__tests__/security/staffActions.test.ts',
  'supabase/migrations/20261018010000_task923_account_deletion.sql',
  'messages/sq.json', 'messages/en.json', 'messages/uk.json', 'messages/it.json',
  // R46: the canonical typed confirmation and its two consumers
  'src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx',
  'src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx',
  'src/stories/mantine/primitives/Modal.stories.tsx', 'scripts/rendered-interaction-states.json',
  'src/components/admin/AdminUserProfileDialogsView.tsx', 'src/components/admin/__tests__/adminDeleteDialog.security.test.tsx',
]) if (!contract.scope.includes(path)) contract.scope.push(path);
const feAdmin = 'src/components/admin/__tests__/adminDeleteDialog.security.test.tsx';
const feOwner = 'src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx';

const I = {
  all: 'Deleting an account removes the account, its data, its listings and their files for every role, in one database transaction',
  who: 'Only the person or a staff member whose rank allows it can delete an account',
  trace: 'A deleted staff member leaves the records of their actions with their name and without their id',
  ui: 'The person is warned that every listing and photo is deleted and must type DELETE before the account is deleted',
};
const row = (id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile) => ({
  id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile, testName: `[${id}] ${invariant}`,
});
const rows = [
  row('SEC-DEL-SRV-ALLOW', 'server', 'allow', true, 'unit', I.all, 'hardDeleteUser, deleteOwnAccount and the inactivity cron calling deleteAccount', 'deleteAccount (src/lib/account/deleteAccount.ts)',
    'a profile with an avatar, two listings with three images, and one company with created_by = the person; the Auth admin double succeeds',
    'auth.admin.deleteUser is called once; then deleteAsset is called once per collected public id with reason account_deleted; the result is ok with filesNotRemoved 0',
    ['a listing archived first', 'a deleteAsset call before the Auth deletion', 'a public id left out'], unit),
  row('SEC-DEL-SRV-ERR', 'server', 'error', false, 'unit', I.all, 'deleteAccount', 'deleteAccount',
    'auth.admin.deleteUser answers an error; then it succeeds but one deleteAsset call throws',
    'delete_failed with no deleteAsset call; then ok with filesNotRemoved 1', ['a deleteAsset call after a failed deletion', 'a failed file reported as a failed deletion'], unit),
  row('SEC-DEL-SRV-DENY', 'server', 'deny', true, 'unit', I.who, 'a moderator without users.hard_delete, a moderator against an administrator, an anonymous caller, a blocked administrator', 'hardDeleteUser and deleteOwnAccount',
    'each calls the action', 'forbidden or Unauthorized as today; deleteAccount is never called', ['deleteAccount called', 'any row read before the refusal'], unit),
  row('SEC-DEL-INT-ALLOW', 'database', 'allow', true, 'integration', I.all, 'a synthetic administrator', 'the real hardDeleteUser on the approved development project after the deletion SQL is applied',
    'a synthetic agent with a listing and image rows, a favourite, a counted view and a phone click on another synthetic owner\'s listing, a report and an inquiry on it, and a company with created_by = the agent plus a second synthetic agent in it',
    'Auth user, profile, listing, image rows and favourite gone; view and click gone and the other listing views_count one lower; report kept with user_id null and user_id_name = the name of the agent (D35); inquiry kept; company gone; second agent company_id null',
    ['a row of the person left', 'the report or the inquiry deleted', 'the second agent deleted'], integ),
  row('SEC-DEL-INT-STAFF', 'database', 'allow', true, 'integration', I.trace, 'a synthetic administrator deleting a synthetic moderator', 'the real hardDeleteUser after the deletion SQL is applied',
    'the moderator changed another synthetic user\'s status and replied to a synthetic inquiry before', 'the deletion succeeds; the status history row and the reply keep the moderator\'s name in their _name column and a null id',
    ['the deletion refused by a foreign key', 'the history row or the reply deleted', 'the name lost'], integ),
  row('SEC-DEL-INT-DENY', 'database', 'deny', true, 'integration', I.who, 'a synthetic moderator, an anonymous client', 'the real hardDeleteUser and deleteOwnAccount on the approved development project',
    'the moderator deletes a synthetic administrator; the anonymous client calls deleteOwnAccount', 'forbidden and Unauthorized; both accounts and every row unchanged',
    ['any row deleted'], integ),
  row('SEC-DEL-INT-OTHERS', 'database', 'deny', false, 'integration', I.all, 'a synthetic administrator', 'the real hardDeleteUser after the deletion SQL is applied',
    'the same fixture as SEC-DEL-INT-ALLOW', 'the other owner, their listing, its other views and the second agent with their own listings and favourites are unchanged',
    ['a row of another person deleted', 'another listing count lowered for a view that was not the person\'s'], integ),
  row('SEC-DEL-INT-SELF', 'database', 'allow', true, 'integration', I.who, 'a synthetic user with a real session', 'the real deleteOwnAccount on the approved development project',
    'the user deletes their own account', 'ok; the Auth user, the profile and the user\'s rows are gone', ['the account kept', 'another account touched'], integ),
  row('SEC-DEL-INT-STAFF-KEEP', 'database', 'deny', false, 'integration', I.trace, 'a synthetic administrator deleting a synthetic moderator', 'the real hardDeleteUser after the deletion SQL is applied',
    'the same fixture as SEC-DEL-INT-STAFF', 'the other user, their status history row and the inquiry the reply belongs to are not deleted',
    ['a record of the moderator\'s action deleted', 'the other user changed'], integ),
  row('SEC-DEL-INT-CRON', 'database', 'allow', false, 'integration', I.all, 'the inactivity cron with its secret', 'the real cron route after the deletion SQL is applied',
    'one synthetic account with the inactivity mark 100 days old and one 10 days old', 'the 100-day account is deleted completely; the 10-day account is untouched',
    ['a 10-day account deleted', 'a 100-day account kept'], integ),
  row('SEC-DEL-FE-DENY', 'frontend', 'deny', false, 'unit', I.ui, 'a signed-in person in the cabinet', 'the real ProfileTab deletion dialog',
    'open the dialog and press confirm before typing, and after typing delet', 'the confirm button is disabled and deleteOwnAccount is not called; the dialog shows the R43 (e) text',
    ['deleteOwnAccount called without DELETE typed', 'the old archive text shown'], fe),
  row('SEC-DEL-FE-ALLOW', 'frontend', 'allow', false, 'unit', I.ui, 'a signed-in person in the cabinet', 'the real ProfileTab deletion dialog',
    'type DELETE and confirm; the action answers ok, then delete_failed', 'deleteOwnAccount is called once; ok shows the delete_account_success toast and signs out to the home page; delete_failed shows the error_deleting toast and the canonical dialog stays open',
    ['a success toast on delete_failed', 'a sign-out on delete_failed'], fe),
  row('SEC-DEL-FE-OWNER-DENY', 'frontend', 'deny', false, 'unit', I.ui, 'any consumer of MantineDeleteConfirmModal with typedConfirm', 'MantineDeleteConfirmModal',
    'open it and press the red primary with the field empty, with delet and with DELETED; close and reopen after typing DELETE', 'onConfirm is not called and the primary is disabled each time; the field is empty after reopening',
    ['onConfirm called without the word', 'the typed word kept across openings'], feOwner),
  row('SEC-DEL-FE-OWNER-ALLOW', 'frontend', 'allow', false, 'unit', I.ui, 'any consumer of MantineDeleteConfirmModal', 'MantineDeleteConfirmModal',
    'type delete, Delete, a spaced DELETE and DELETE with typedConfirm set; render it without typedConfirm', 'the primary is enabled and onConfirm called once each time; without typedConfirm no field renders and the primary behaves as today',
    ['a consumer without typedConfirm changed'], feOwner),
  row('SEC-DEL-FE-ADMIN', 'frontend', 'deny', false, 'unit', I.ui, 'a staff member on a user profile', 'the real AdminUserProfileDialogsView delete dialog',
    'press Delete permanently before typing, then type DELETE and press it', 'onConfirm is not called before the word and called once after it; the dialog shows the R43 (e) points',
    ['a deletion without the word', 'the archive text shown'], feAdmin),
];
for (const r of rows) {
  const at = contract.cases.findIndex(c => c.id === r.id);
  if (at === -1) contract.cases.push(r); else contract.cases[at] = r;
}
contract.taskSha256 = digest(process.cwd(), [contract.task]);
const indent = /^\{\r?\n( +)/.exec(text)?.[1].length ?? 2;
writeFileSync(file, JSON.stringify(contract, null, indent) + (text.endsWith('\n') ? '\n' : ''), 'utf8');
console.log(JSON.stringify({ scope: contract.scope.length, cases: contract.cases.length, integration: contract.cases.filter(c => c.boundary === 'integration').length, critical: contract.cases.filter(c => c.critical).length }));
