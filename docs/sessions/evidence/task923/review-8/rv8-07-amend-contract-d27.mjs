// Task 923 review 8 (Opus, 2026-10-18): owner D27 ("blocked or deleted holds for every user, not only the administrator") enters the D8/D9
// contract - R44 (one account check in front of every role decision on the server) and the storage / realtime cases of R37 (record
// "Opus corrections (review 8)" (10)). Run from the repository root after the record (.md) is final and the inventory is current:
//   node docs/sessions/evidence/task923/design-r8/role-guard-inventory.mjs
//   node docs/sessions/evidence/task923/review-8/rv8-07-amend-contract-d27.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';

const file = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const text = readFileSync(file, 'utf8');
const contract = JSON.parse(text);
const inventory = JSON.parse(readFileSync('docs/sessions/evidence/task923/design-r8/role-guard-inventory.json', 'utf8'));

const unitStaff = 'src/lib/auth/staffAccess.security.test.ts';
const unitViewer = 'src/lib/auth/requireViewer.security.test.ts';
const unitStatic = 'src/lib/auth/roleReads.security.test.ts';
const intStaff = 'src/lib/auth/staffAccess.integration.test.ts';
const dbTest = 'src/tests/integration/accessHardening.integration.test.ts';

// every file that reads the caller's role, and every entry point that acts for a person without the canonical check today
const roleFiles = inventory.rows.map(r => r.file);
const entryFiles = inventory.entries.filter(e => e.accountCheck !== 'requireViewer/getBlockedError' && !e.noPerson).map(e => e.file);
const add = [...roleFiles, ...entryFiles, 'src/lib/auth/staff.ts', 'src/lib/auth/permissions.ts', 'src/lib/auth/blockCheck.ts', 'src/lib/auth/requireViewer.ts',
  unitStaff, unitViewer, unitStatic, intStaff];
for (const path of add) if (!contract.scope.includes(path)) contract.scope.push(path);

const I = {
  staff: 'A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role',
  viewer: 'A blocked, suspended, deactivated, deleted or missing account of any role is not a viewer, and a deleted one is blocked',
  one: "No product code decides by the caller's role except through requireViewer",
  storage: 'A blocked or deleted account writes no file through the Storage API on its next request',
  realtime: 'A blocked account receives no further realtime change after the block',
};
const row = (id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile) => ({
  id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile, testName: `[${id}] ${invariant}`,
});
const GUARDS = 'getStaffRole, hasPermission, assertPermission and each local role guard of role-guard-inventory.json (assertAdmin, assertAdminUser, assertAdminOrMod, assertAdminOrModerator, requireAdminOrModerator, the inline checks)';
const rows = [
  row('SEC-D27-SRV-STAFF-DENY', 'server', 'deny', true, 'unit', I.staff, 'a caller whose profile has role admin, then moderator', GUARDS,
    'the profile is deleted (deleted_at set), blocked permanently, blocked until a future date, inactive, or has no row', 'each guard gives its existing refusal (forbidden, unauthenticated or redirect)',
    ['a staff answer', 'a service-role write, upload, e-mail or notification after the refusal'], unitStaff),
  row('SEC-D27-SRV-STAFF-ALLOW', 'server', 'allow', true, 'unit', I.staff, 'a caller whose profile has role admin, then moderator', GUARDS,
    'the profile is active, or blocked with a suspension that has ended', 'each guard gives its existing staff answer for that role',
    ['an active staff member refused', 'a moderator given an administrator-only right'], unitStaff),
  row('SEC-D27-SRV-STAFF-ERR', 'server', 'error', false, 'unit', I.staff, 'a caller with role admin', GUARDS,
    'requireViewer answers lookup_failed (the profile read errors or throws)', 'each guard gives its existing failure answer',
    ['a staff answer on a failed read', 'any write after a failed read'], unitStaff),
  row('SEC-D27-SRV-VIEWER-DENY', 'server', 'deny', true, 'unit', I.viewer, 'a caller whose profile has role user, then agent', 'requireViewer and getBlockedError',
    'the profile is deleted, blocked permanently, blocked until a future date, inactive, or has no row', 'requireViewer answers not ok; getBlockedError answers account_blocked or account_suspended, and account_blocked for a set deleted_at',
    ['ok for a deleted or blocked account', 'null from getBlockedError for a deleted account'], unitViewer),
  row('SEC-D27-SRV-VIEWER-ALLOW', 'server', 'allow', false, 'unit', I.viewer, 'a caller with role user, agent, moderator, admin', 'requireViewer',
    'an active profile', 'ok with the userId and the role read in the same query', ['a second role read', 'an active account refused'], unitViewer),
  row('SEC-D27-SRV-STATIC-DENY', 'server', 'deny', false, 'unit', I.one, 'product source under src (tests and Stories excluded)', "every .select('role') on public.users",
    'a scan of src for a role read', 'none outside src/lib/auth/requireViewer.ts', ['a role read anywhere else'], unitStatic),
  row('SEC-D27-INT-STAFF-DENY', 'server', 'deny', true, 'integration', I.staff, 'a synthetic moderator and a synthetic administrator, each with a real session', 'getStaffRole and hasPermission on the approved development project',
    'a synthetic administrator blocks the moderator through the real updateUserProfileFull, and the second administrator is soft-deleted; each then calls with their still-valid session',
    'no staff role and no permission for either', ['a staff answer after the block or the deletion'], intStaff),
  row('SEC-D27-INT-STAFF-ALLOW', 'server', 'allow', true, 'integration', I.staff, 'a synthetic active moderator with a real session', 'getStaffRole and hasPermission on the approved development project',
    'the active moderator calls with their session', 'role moderator and the permissions role_permissions grants', ['an active moderator refused'], intStaff),
  row('SEC-D27-INT-VIEWER-DENY', 'server', 'deny', true, 'integration', I.viewer, 'a synthetic user and a synthetic agent, each with a real session', 'requireViewer and getBlockedError on the approved development project',
    'a synthetic administrator blocks the user through the real updateUserProfileFull and soft-deletes the agent; each then calls with their still-valid session',
    'requireViewer answers not ok and getBlockedError answers account_blocked for both', ['ok or null for either'], intStaff),
  row('SEC-D27-INT-VIEWER-ALLOW', 'server', 'allow', true, 'integration', I.viewer, 'a synthetic active user and a synthetic active agent with real sessions', 'requireViewer and getBlockedError on the approved development project',
    'each calls with their session', 'requireViewer answers ok with their role; getBlockedError answers null', ['an active account refused'], intStaff),
  row('SEC-DB-STORAGE-DENY', 'database', 'deny', true, 'integration', I.storage, 'a synthetic account blocked, then one soft-deleted, each with a still-valid access token', 'the avatars bucket (storage.objects)',
    'an upload, a replace and a delete through the Storage API right after the staff action', 'refused; storage.objects unchanged', ['an object written, replaced or removed'], dbTest),
  row('SEC-DB-STORAGE-ALLOW', 'database', 'allow', false, 'integration', I.storage, 'a synthetic active account', 'the avatars bucket (storage.objects)',
    'the write the existing avatars policies allow', 'it succeeds and the synthetic object is removed in clean-up', ['an active account refused'], dbTest),
  row('SEC-DB-REALTIME-DENY', 'database', 'deny', true, 'integration', I.realtime, 'a synthetic account subscribed to postgres_changes on its own notifications', 'Supabase Realtime on the approved development project',
    'the service role inserts a notification for the account before and after a staff block', 'the event before the block arrives; none after it', ['an event delivered after the block'], dbTest),
  row('SEC-DB-REALTIME-ALLOW', 'database', 'allow', true, 'integration', I.realtime, 'a synthetic active account subscribed to postgres_changes on its own notifications', 'Supabase Realtime on the approved development project',
    'the service role inserts a notification for the account', 'the event arrives', ['an active account receiving nothing'], dbTest),
];
for (const r of rows) if (!contract.cases.some(c => c.id === r.id)) contract.cases.push(r);
contract.taskSha256 = digest(process.cwd(), [contract.task]);
const indent = /^\{\r?\n( +)/.exec(text)?.[1].length ?? 2;
writeFileSync(file, JSON.stringify(contract, null, indent) + (text.endsWith('\n') ? '\n' : ''), 'utf8');
console.log(JSON.stringify({ scope: contract.scope.length, cases: contract.cases.length, added: rows.length, roleFiles: new Set(roleFiles).size, entryFiles: entryFiles.length }));
