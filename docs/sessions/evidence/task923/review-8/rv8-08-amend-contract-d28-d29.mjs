// Task 923 review 8 (Opus, 2026-10-18), self-audit: corrects the D27 cases to the facts and adds R45 (owner D28: the inactivity state is
// restored within 90 days; D29: the server ends a refused session and the person is a guest). Record "Opus corrections (review 8)" (11).
// Run from the repository root after rv8-07 and after the record (.md) is final:
//   node docs/sessions/evidence/task923/review-8/rv8-08-amend-contract-d28-d29.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';

const file = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const text = readFileSync(file, 'utf8');
const contract = JSON.parse(text);
const byId = id => {
  const c = contract.cases.find(x => x.id === id);
  if (!c) throw new Error(`missing case ${id}`);
  return c;
};

// 1. facts: only admin / moderator may write avatars (catalog.json storage policies); softDeleteUser has no caller, the realistic unbanned
//    no-access state is the inactivity mark (cron/inactivity/route.ts:84-86); a deleted administrator is deleted by hardDeleteUser
const INACTIVITY_MARK = 'deleted_at and status inactive written through the service role exactly as cron/inactivity writes them';
Object.assign(byId('SEC-DB-STORAGE-DENY'), {
  actor: 'a synthetic moderator blocked by staff, then a synthetic administrator deleted through the real hardDeleteUser, each with the still-valid access token',
  input: 'an upload, a replace and a delete in the avatars bucket through the Storage API right after the staff action',
});
Object.assign(byId('SEC-DB-STORAGE-ALLOW'), {
  actor: 'a synthetic active moderator',
  input: 'an upload to the avatars bucket, which the existing moderator policy allows',
});
Object.assign(byId('SEC-D27-INT-STAFF-DENY'), {
  input: `a synthetic administrator blocks the moderator through the real updateUserProfileFull; the second administrator gets the inactivity mark (${INACTIVITY_MARK}); each then calls with their still-valid session`,
});
Object.assign(byId('SEC-D27-INT-VIEWER-DENY'), {
  input: `a synthetic administrator blocks the user through the real updateUserProfileFull; the agent gets the inactivity mark (${INACTIVITY_MARK}); each then calls with their still-valid session`,
});

// 2. R45
const unitMw = 'src/lib/auth/middleware.security.test.ts';
const intSession = 'src/lib/auth/sessionEnd.integration.test.ts';
const dbTest = 'src/tests/integration/accessHardening.integration.test.ts';
const feTest = 'src/components/layout/__tests__/sessionEnded.security.test.tsx';
for (const path of ['src/lib/auth/middleware.ts', 'src/app/api/presence/route.ts', 'src/app/api/cron/inactivity/route.ts', 'src/middleware.ts', unitMw, intSession, feTest]) {
  if (!contract.scope.includes(path)) contract.scope.push(path);
}
const I = {
  end: 'A banned, deleted or no-access session is ended by the server on the next page request and the person is a guest',
  restore: 'An account marked by the inactivity rule is restored on its return within 90 days and never later',
  guest: 'After the server ends the session the header offers sign-in and no personal entry',
};
const row = (id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile) => ({
  id, layer, outcome, critical, boundary, invariant, actor, resource, input, response, forbiddenEffects, testFile, testName: `[${id}] ${invariant}`,
});
const rows = [
  row('SEC-D29-SRV-DENY', 'server', 'deny', true, 'unit', I.end, 'a request with auth cookies', 'refreshSession (src/lib/auth/middleware.ts)',
    'getUser answers an AuthApiError with code user_banned, then user_not_found; then getUser returns a user and the rpc caller_access_state answers none',
    "supabase.auth.signOut({ scope: 'local' }) is called once and the response carries the cleared auth cookies",
    ['the auth cookies kept', 'a restore attempted for a banned or deleted account'], unitMw),
  row('SEC-D29-SRV-ALLOW', 'server', 'allow', true, 'unit', I.end, 'a request with auth cookies', 'refreshSession',
    'getUser returns a user and caller_access_state answers active; then getUser fails with a network error; then caller_access_state errors',
    'no signOut; the session and its cookies stay as they are', ['an active person signed out', 'a session ended on a transient failure'], unitMw),
  row('SEC-D28-SRV-RESTORE', 'server', 'allow', true, 'unit', I.restore, 'a request of a person whose state is restorable', 'refreshSession',
    'getUser returns a user and caller_access_state answers restorable', 'restore_inactive_account is called once and no signOut follows',
    ['a restorable person signed out', 'a second restore call'], unitMw),
  row('SEC-D29-INT-DENY', 'server', 'deny', true, 'integration', I.end, 'a synthetic user with a real session cookie', 'the real refreshSession against the approved development project',
    'a synthetic administrator blocks the user through the real updateUserProfileFull; then a synthetic agent is deleted through the real hardDeleteUser; each old cookie set is sent to refreshSession',
    'the response clears the auth cookies for both', ['an auth cookie kept after the block or the deletion'], intSession),
  row('SEC-D29-INT-ALLOW', 'server', 'allow', true, 'integration', I.end, 'a synthetic active user with a real session cookie', 'the real refreshSession against the approved development project',
    'the cookie set is sent to refreshSession', 'the auth cookies are kept (refreshed or unchanged)', ['an active person signed out'], intSession),
  row('SEC-D28-INT-RESTORE', 'database', 'allow', true, 'integration', I.restore, `a synthetic user given the inactivity mark (${INACTIVITY_MARK}) 10 days ago, with a live session`, 'caller_access_state and restore_inactive_account',
    'the two RPCs through the REST API with the user token', 'restorable, then true; the row is active with deleted_at null and one user_status_history row reactivated_within_grace_period',
    ['a restore without its history row', 'any other column changed'], dbTest),
  row('SEC-D28-INT-DENY', 'database', 'deny', true, 'integration', I.restore, 'a synthetic user given the inactivity mark 100 days ago; an anonymous client; a synthetic blocked user', 'caller_access_state and restore_inactive_account',
    'the two RPCs through the REST API', 'none and false for the 100-day and the blocked user; permission denied for the anonymous client; no row changed',
    ['a restore after 90 days', 'a restore of a blocked account', 'an anonymous call executed'], dbTest),
  row('SEC-D29-FE-DENY', 'frontend', 'deny', false, 'unit', I.guest, 'a page rendered after the server ended the session', 'the real Header container with AuthProvider initialUser null',
    'mount the Header container under AuthProvider initialUser null, as the locale layout does when resolveSession returns no user', 'sign-in and register are offered; no favorites link, no user menu, no cabinet or admin entry', ['any personal entry rendered'], feTest),
  row('SEC-D29-FE-ALLOW', 'frontend', 'allow', false, 'unit', I.guest, 'a page rendered for an active signed-in person', 'the real Header container with AuthProvider initialUser set',
    'mount the Header container under AuthProvider initialUser = an active user with role user', 'the user menu and the favorites link render as today', ['the active person shown as a guest'], feTest),
];
for (const r of rows) {
  const at = contract.cases.findIndex(c => c.id === r.id);
  if (at === -1) contract.cases.push(r); else contract.cases[at] = r;
}
contract.taskSha256 = digest(process.cwd(), [contract.task]);
const indent = /^\{\r?\n( +)/.exec(text)?.[1].length ?? 2;
writeFileSync(file, JSON.stringify(contract, null, indent) + (text.endsWith('\n') ? '\n' : ''), 'utf8');
const integ = contract.cases.filter(c => c.boundary === 'integration');
console.log(JSON.stringify({ scope: contract.scope.length, cases: contract.cases.length, integration: integ.length, critical: contract.cases.filter(c => c.critical).length }));
