// Generates the D8/D9 security task record and its adjacent contract. The hash comes from the canonical module (never a copied algorithm).
//   node docs/sessions/evidence/task923/security/make-contract.mjs
// DRAFT by the Sonnet executor at the owner's explicit instruction of 2026-10-17. The invariants, scope and applicability below are Opus' to own:
// per .claude/rules/shared/workflow-gates.md Sonnet updates stage/report metadata only; any change of invariant, scope or applicability returns to Opus.
import { writeFileSync } from 'node:fs'
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs'

const ROOT = new URL('../../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const TASK = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.md'
const CONTRACT = TASK.replace(/\.md$/, '.security.json')

const T = {
  engine: 'src/modules/listings/domain/ownerStatusRules.security.test.ts',
  gateway: 'src/modules/listings/actions/ownerPublish.security.test.ts',
  form: 'src/modules/listings/components/ListingFormShellView.status.security.test.tsx',
  access: 'src/lib/auth/accountAccess.security.test.ts',
  adminBan: 'src/modules/admin/actions/accountBan.security.test.ts',
  lift: 'src/lib/auth/blockCheck.security.test.ts',
  sheet: 'src/modules/auth/components/AuthSheet.banned.security.test.tsx',
  contact: 'src/modules/listings/actions/contactSession.security.test.ts',
  dialog: 'src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx',
  // real-boundary controls (separate vitest project; real Auth and real database of the approved development project, synthetic rows only)
  gatewayInt: 'src/modules/listings/actions/ownerPublish.integration.test.ts',
  accessInt: 'src/lib/auth/accountAccess.integration.test.ts',
  adminInt: 'src/modules/admin/actions/accountBan.integration.test.ts',
  contactInt: 'src/modules/listings/actions/contactSession.integration.test.ts',
}
const D = {
  [T.engine]: 'owner status rules',
  [T.gateway]: 'status gateway: publishing is staff-only',
  [T.form]: 'ListingFormShellView status control',
  [T.access]: 'account access sync',
  [T.adminBan]: 'admin actions that change account access',
  [T.lift]: 'automatic lifting of an ended suspension',
  [T.sheet]: 'sign-in sheet and a blocked account',
  [T.contact]: 'contact actions need a signed-in active person',
  [T.dialog]: 'message dialog and an ended session',
  [T.gatewayInt]: 'status gateway against the real database',
  [T.accessInt]: 'account access against real Auth',
  [T.adminInt]: 'admin account actions against real Auth and database',
  [T.contactInt]: 'contact actions against real Auth and database',
}
const c = (id, layer, outcome, critical, file, it, f) => ({
  id: `SEC-${id}`, layer, outcome, boundary: /\.integration\.test\./.test(file) ? 'integration' : 'unit', critical, ...f,
  testFile: file, testName: `${D[file]} [SEC-${id}] ${it}`,
})

const cases = [
  // ── D8: publishing is staff-only ────────────────────────────────────────────────────────────────────────────────────────────────
  c('D8-SRV-DOMAIN-DENY', 'server', 'deny', false, T.engine, 'the owner may set every status except active, from every current status, and active is the only staff-only status', {
    invariant: 'An owner (non-staff) can never reach the status active; the rule is one shared domain function used by the UI list and the gateway',
    actor: 'listing owner without an administrator or moderator role', resource: 'a listing in each of the seven statuses',
    input: 'canOwnerSetStatus(from, to) and getOwnerTargetStatuses(from) for every from/to pair; getAllowedTargetStatuses with canPublish false and true',
    response: 'false / absent for active from every status; true for every other distinct status; staff keeps the full list',
    forbiddenEffects: ['a code path where the owner list contains active', 'getAllowedTargetStatuses callable without an explicit canPublish'],
  }),
  c('D8-SRV-ALLOW', 'server', 'allow', false, T.gateway, 'an administrator and a moderator publish a pending listing and the owner is notified', {
    invariant: 'Staff keep the privileged any-status path including active; the write re-stamps the expiry and notifies the owner',
    actor: 'administrator, moderator', resource: 'a pending listing owned by another person',
    input: 'applyListingTransitionByStatus(listingId, active, staff actor)',
    response: '{ ok: true, nextStatus: active }, one listings update with status active and a new expires_at, one owner notification',
    forbiddenEffects: ['a refusal of a legitimate staff publication', 'a missing owner notification'],
  }),
  c('D8-SRV-OWNER-ALLOW', 'server', 'allow', false, T.gateway, 'the owner hides, archives, sells, rents or sends back to review their own listing', {
    invariant: 'The owner keeps every non-publishing status change on their own listing',
    actor: 'listing owner (role user)', resource: 'own listing in status active or pending',
    input: 'applyListingTransitionByStatus to inactive, archived, sold, rented, pending and expired',
    response: '{ ok: true, nextStatus } for each, one status write each, no expiry re-stamp for non-public statuses',
    forbiddenEffects: ['a refusal of a legitimate owner action', 'an expiry re-stamp for a non-public status'],
  }),
  c('D8-SRV-DENY', 'server', 'deny', true, T.gateway, 'the owner cannot set active from any other status and nothing is written, re-stamped or notified', {
    invariant: 'Publishing for general view is reserved to administrator / moderator (owner decision D8, 2026-10-17); pending -> inactive -> active is closed too',
    actor: 'listing owner (role user), owner with null role', resource: 'own listing in each non-active status',
    input: 'applyListingTransitionByStatus(listingId, active, owner actor) for pending, inactive, expired, sold, rented, archived',
    response: '{ ok: false, reason: forbidden } for every status',
    forbiddenEffects: ['listings update call', 'expires_at re-stamp', 'owner notification', 'site cache revalidation'],
  }),
  c('D8-SRV-DENY-OTHER', 'server', 'deny', false, T.gateway, 'a signed-in user who is not the owner and not staff cannot change the status at all', {
    invariant: 'The existing ownership check still precedes everything: a stranger cannot change any status, including to a non-publishing one',
    actor: 'unrelated signed-in user, user with null role', resource: 'listing owned by another person',
    input: 'applyListingTransitionByStatus to active and to sold',
    response: '{ ok: false, reason: forbidden }',
    forbiddenEffects: ['listings update call', 'owner notification'],
  }),
  c('D8-SRV-ERR', 'server', 'error', false, T.gateway, 'a missing listing, an unchanged status and a failed write return their exact reasons without side effects', {
    invariant: 'Failures are explicit and never read as success; a failed write does not notify or revalidate',
    actor: 'administrator and owner', resource: 'missing listing id; listing already in the requested status; database that rejects the update',
    input: 'applyListingTransitionByStatus with each failing condition',
    response: 'not_found, invalid_transition, db_error respectively',
    forbiddenEffects: ['owner notification after a failed write', 'cache revalidation after a failed write'],
  }),
  c('D8-FE-ALLOW', 'frontend', 'allow', false, T.form, 'staff can pick active as the new status of a non-active listing', {
    invariant: 'The status control offers staff the full any-status list',
    actor: 'administrator or moderator editing a listing', resource: 'the edit form status control of a pending listing',
    input: 'ListingFormShellView with statusControl.canPublish true',
    response: 'active is among the selectable statuses',
    forbiddenEffects: ['a status list without active for staff'],
  }),
  c('D8-FE-DENY', 'frontend', 'deny', false, T.form, 'the owner is never offered active, for every status the listing can have', {
    invariant: 'The form shows an owner only what the gateway will accept; the control is presentation, the gateway is the authority',
    actor: 'listing owner editing their own listing', resource: 'the edit form status control for each of the seven current statuses',
    input: 'ListingFormShellView with statusControl.canPublish false',
    response: 'active is not selectable and the other six statuses (minus the current one) are',
    forbiddenEffects: ['active present in the owner list', 'a request to change status sent from the form for a status that is not offered'],
  }),
  c('D8-FE-ERR', 'frontend', 'error', false, T.form, 'a refused status change keeps the current status and shows the error', {
    invariant: 'A forbidden answer from the server is shown to the person and does not look like a saved change',
    actor: 'listing owner', resource: 'the status control after the server answers forbidden',
    input: 'onStatusChange rejects with forbidden after the person confirms a change',
    response: 'the current status stays selected and an error is shown',
    forbiddenEffects: ['the control showing the refused status as saved'],
  }),
  // ── D9: a blocked account has no access ───────────────────────────────────────────────────────────────────────────────────────────
  c('D9-SRV-DENY', 'server', 'deny', true, T.access, 'a blocked, suspended or inactive account is banned in Auth with the matching duration', {
    invariant: 'A status that removes access bans the account in Supabase Auth (stops sign-in, token refresh and auth.getUser); a dated suspension bans until that date',
    actor: 'server code acting for staff', resource: 'one user id with status blocked (permanent), blocked until a future date, inactive',
    input: 'syncAccountAccess(userId, status, suspendedUntil)',
    response: 'updateUserById called once with ban_duration permanent / hours until the date / permanent; { ok: true }',
    forbiddenEffects: ['an account with status blocked that is not banned', 'a ban for an unrelated user id'],
  }),
  c('D9-SRV-ALLOW', 'server', 'allow', false, T.access, 'an active account, or one whose suspension has ended, is not banned and an existing ban is lifted', {
    invariant: 'Unblocking restores access in Auth in the same operation',
    actor: 'server code acting for staff', resource: 'a user with status active, or blocked with a suspension date in the past',
    input: 'syncAccountAccess(userId, active | blocked-with-past-date)',
    response: 'updateUserById called with ban_duration none; { ok: true }',
    forbiddenEffects: ['an active account left banned'],
  }),
  c('D9-SRV-ERR', 'server', 'error', false, T.access, 'an Auth failure is reported and is never read as success; bad ids and statuses are refused before any call', {
    invariant: 'Failing to ban is an error the caller can see; hostile or malformed input never reaches Auth',
    actor: 'server code acting for staff', resource: 'Auth admin API that errors or throws; ids and statuses that are not valid',
    input: 'syncAccountAccess with a rejecting dependency, a non-uuid id, an unknown status, a suspended_until that is not a date',
    response: '{ ok: false, error } for each; no call for invalid input; no secret in the log',
    forbiddenEffects: ['{ ok: true } after a failed Auth call', 'an Auth call for an invalid id', 'a token or key in the console output'],
  }),
  c('D9-SRV-ADMIN-DENY', 'server', 'deny', true, T.adminBan, 'a caller without permission, or acting on a higher rank, changes nothing and bans nobody', {
    invariant: 'Only an authorised staff member can change an account\'s access, and ranks are respected (a moderator cannot block an administrator)',
    actor: 'anonymous, user without the permission, moderator targeting an administrator', resource: 'a target user account',
    input: 'updateUserProfileFull / deactivateUser / reactivateUser with status blocked or inactive',
    response: 'forbidden / Unauthorized; no status write; no Auth call',
    forbiddenEffects: ['users update', 'Auth ban call', 'user_status_history insert'],
  }),
  c('D9-SRV-ADMIN-ALLOW', 'server', 'allow', false, T.adminBan, 'blocking or deactivating bans the account after the status is saved, and unblocking lifts the ban', {
    invariant: 'The status is saved first (the database cuts access at once), then the Auth ban follows; unblock reverses both',
    actor: 'administrator with the permission', resource: 'a user account',
    input: 'updateUserProfileFull blocked (permanent and dated), deactivateUser, reactivateUser',
    response: 'status written, then syncAccountAccess called with the saved status and date, in that order',
    forbiddenEffects: ['a ban before the status write', 'no Auth call after a successful block'],
  }),
  c('D9-SRV-ADMIN-ERR', 'server', 'error', false, T.adminBan, 'a failed ban is reported to the admin and a failed status write is not followed by a ban', {
    invariant: 'The admin is told when access could not be fully removed; a failed first step stops the second',
    actor: 'administrator', resource: 'a user account being blocked',
    input: 'status update fails; status update succeeds but the Auth ban fails',
    response: 'an access_sync_failed / update_failed error respectively; the Auth call is absent in the first case',
    forbiddenEffects: ['{} (success) after a failed ban', 'an Auth ban after a failed status write'],
  }),
  c('D9-SRV-LIFT-ALLOW', 'server', 'allow', false, T.lift, 'the automatic lift of an ended suspension also lifts the ban', {
    invariant: 'When getBlockedError restores a suspended account to active it removes the Auth ban in the same step',
    actor: 'the suspended person calling a guarded action', resource: 'users row with status blocked and suspended_until in the past',
    input: 'getBlockedError(userId)',
    response: 'null; users updated to active; syncAccountAccess called to lift the ban',
    forbiddenEffects: ['status restored to active while the ban stays'],
  }),
  c('D9-FE-ALLOW', 'frontend', 'allow', false, T.sheet, 'a person who is not blocked signs in and the sheet closes', {
    invariant: 'The new banned-account mapping does not disturb a normal sign-in',
    actor: 'visitor with valid credentials', resource: 'the sign-in sheet',
    input: 'submit the login form; signIn answers without error',
    response: 'signIn called with the typed values, the sheet closes, no error shown',
    forbiddenEffects: ['an error alert after a successful sign-in'],
  }),
  c('D9-FE-DENY', 'frontend', 'deny', false, T.sheet, 'a blocked account sees the blocked message, stays signed out and the sheet stays open', {
    invariant: 'A banned account cannot sign in and is told why (owner decision D9)',
    actor: 'person whose account is blocked', resource: 'the sign-in sheet',
    input: 'signIn answers with the Auth "User is banned" error (400 user_banned)',
    response: 'the blocked-account message in the page language; no redirect, no close, no refresh',
    forbiddenEffects: ['the sheet closing', 'a redirect to the stored destination', 'the generic wrong-password message'],
  }),
  c('D9-FE-ERR', 'frontend', 'error', false, T.sheet, 'any other error stays the generic message and never claims the account is blocked', {
    invariant: 'The blocked message is shown only for a banned account, never for an unknown or network error',
    actor: 'anonymous visitor who tries to sign in', resource: 'the sign-in sheet',
    input: 'signIn answers with an unknown error text, an empty text and a rate-limit text',
    response: 'the generic / rate-limit message; never the blocked-account message',
    forbiddenEffects: ['the blocked message for a non-banned error'],
  }),
  // ── contact actions need a signed-in, active person (owner correction 2026-10-17: a guest has no access to the owner's contact card) ──────────────
  c('CS-SRV-DENY', 'server', 'deny', true, T.contact, 'a guest, a session without a profile and a blocked or inactive account get nothing from the inquiry and contact-event actions', {
    invariant: 'The Server Actions that reach the owner (submitListingInquiry, trackListingContactEvent) serve only a signed-in person whose account is active; a direct call by a guest is refused like the hidden button',
    actor: 'guest without a session, session of a deleted profile, blocked account, inactive account', resource: 'an open listing of another person',
    input: 'submitListingInquiry({ listingId, name, email, message }) and trackListingContactEvent({ listingId, channel whatsapp }) with each caller state',
    response: 'submitListingInquiry -> { error: unauthenticated }; trackListingContactEvent -> { ok: false, reason: unauthenticated }',
    forbiddenEffects: ['listing_inquiries insert', 'owner e-mail', 'owner notification', 'listing_contact_events insert', 'owner e-mail address lookup'],
  }),
  c('CS-SRV-ALLOW', 'server', 'allow', false, T.contact, 'a signed-in active person who is not the owner sends an inquiry and a WhatsApp tap is recorded', {
    invariant: 'The session requirement does not break the legitimate path for a signed-in person',
    actor: 'signed-in person with an active profile, not the owner', resource: 'an open listing of another person',
    input: 'submitListingInquiry with valid fields; trackListingContactEvent for whatsapp',
    response: 'inquiry row inserted with the session user as requester, owner e-mailed, owner notified; contact event recorded with actor_user_id',
    forbiddenEffects: ['a refusal of a legitimate signed-in request', 'an event row without the actor id'],
  }),
  c('CS-SRV-ERR', 'server', 'error', false, T.contact, 'when the session or profile lookup fails the request is refused and nothing is written', {
    invariant: 'Fail closed: a failing session or profile lookup is not treated as a guest who may proceed and not as a signed-in person',
    actor: 'signed-in person during an Auth or database outage', resource: 'an open listing of another person',
    input: 'getUser throws; profile query returns an error; profile query throws',
    response: 'unauthenticated / session_error as the contract of each action says; no write, no e-mail, no notification',
    forbiddenEffects: ['listing_inquiries insert', 'owner e-mail', 'owner notification', 'listing_contact_events insert'],
  }),
  c('CS-FE-DENY', 'frontend', 'deny', false, T.dialog, 'an ended session shows the sign-in prompt, keeps the typed message and does not look like a sent inquiry', {
    invariant: 'If the session ended while the form was open the person is asked to sign in again and loses nothing they typed',
    actor: 'signed-in person whose session expired', resource: 'the message dialog with a typed name, e-mail and message',
    input: 'submitListingInquiry answers unauthenticated',
    response: 'an error message and the sign-in sheet opened; the dialog stays open with the typed text; no success message',
    forbiddenEffects: ['the success toast', 'the dialog closing and losing the text'],
  }),
]
const inv = (id) => cases.find((x) => x.id === id).invariant
// Real-boundary controls for every critical invariant (workflow-gates: allow AND deny on a real boundary, not only unit doubles). Real Auth, real database of the
// approved development project, synthetic rows of one run, verified clean-up; a separate vitest project (never part of the default jsdom run).
cases.push(
  c('D8-INT-DENY', 'server', 'deny', false, T.gatewayInt, 'the owner cannot publish on the real database: status, expiry and notifications stay unchanged', {
    invariant: inv('SEC-D8-SRV-DENY'), actor: 'synthetic listing owner (role user)', resource: 'a synthetic pending listing of that owner in the development database',
    input: 'the real applyListingTransitionByStatus(listingId, active, owner actor) with the real admin client',
    response: '{ ok: false, reason: forbidden }; the row still has status pending and its old expires_at; no notification row for the owner',
    forbiddenEffects: ['listings.status changed', 'listings.expires_at changed', 'notifications row created'],
  }),
  c('D8-INT-ALLOW', 'server', 'allow', false, T.gatewayInt, 'a real administrator publishes the same listing on the real database', {
    invariant: inv('SEC-D8-SRV-DENY'), actor: 'synthetic administrator', resource: 'the same synthetic pending listing',
    input: 'the real applyListingTransitionByStatus(listingId, active, administrator actor)',
    response: '{ ok: true }; the row has status active and a new expires_at; one listing_status_change notification for the owner',
    forbiddenEffects: ['a refusal of the administrator', 'a missing owner notification'],
  }),
  c('D9-INT-DENY', 'server', 'deny', false, T.accessInt, 'a blocked account is really banned: sign-in, refresh and the old access token are refused by Auth', {
    invariant: inv('SEC-D9-SRV-DENY'), actor: 'synthetic user with a live session', resource: 'that user in the real Supabase Auth of the development project',
    input: 'the real syncAccountAccess(userId, blocked, null); then password sign-in, refreshSession and auth.getUser(old access token)',
    response: 'all three answered with user_banned (400 / 400 / 403)',
    forbiddenEffects: ['a successful sign-in', 'a refreshed session', 'auth.getUser returning the user'],
  }),
  c('D9-INT-ALLOW', 'server', 'allow', false, T.accessInt, 'the unblock really lifts the ban: the same user signs in again', {
    invariant: inv('SEC-D9-SRV-DENY'), actor: 'the same synthetic user', resource: 'that user in the real Supabase Auth',
    input: 'the real syncAccountAccess(userId, active, null); then password sign-in',
    response: 'sign-in succeeds and auth.getUser answers with the user',
    forbiddenEffects: ['a user left banned after an unblock'],
  }),
  c('D9-INT-ADMIN-DENY', 'server', 'deny', false, T.adminInt, 'a normal user cannot block anyone on the real database and Auth', {
    invariant: inv('SEC-D9-SRV-ADMIN-DENY'), actor: 'synthetic user with role user (session injected as the cookie-bound client)', resource: 'a synthetic target user',
    input: 'the real updateUserProfileFull(targetId, status blocked) with the real hasPermission / actorMayActOn',
    response: '{ error: forbidden }; the target row keeps status active; the target can still sign in',
    forbiddenEffects: ['users.status changed', 'the target banned in Auth', 'user_status_history row'],
  }),
  c('D9-INT-ADMIN-ALLOW', 'server', 'allow', false, T.adminInt, 'a real administrator blocks and unblocks a user and Auth follows', {
    invariant: inv('SEC-D9-SRV-ADMIN-DENY'), actor: 'synthetic administrator', resource: 'a synthetic target user',
    input: 'the real updateUserProfileFull blocked, then active',
    response: 'status written, then the target is refused by Auth; after the unblock the target signs in again',
    forbiddenEffects: ['a block that leaves the target able to sign in', 'an unblock that leaves the ban'],
  }),
  c('CS-INT-DENY', 'server', 'deny', false, T.contactInt, 'on the real database a guest and a blocked account create no inquiry, e-mail or notification', {
    invariant: inv('SEC-CS-SRV-DENY'), actor: 'guest client without a session; synthetic blocked account', resource: 'a synthetic active listing of another synthetic user',
    input: 'the real submitListingInquiry with the cookie-bound client replaced by an anonymous client / by the blocked user\'s client',
    response: '{ error: unauthenticated }; no listing_inquiries row for the run; the e-mail sink and notifications table untouched',
    forbiddenEffects: ['listing_inquiries row', 'e-mail sink call', 'notifications row'],
  }),
  c('CS-INT-ALLOW', 'server', 'allow', false, T.contactInt, 'on the real database a signed-in active person creates exactly one inquiry', {
    invariant: inv('SEC-CS-SRV-DENY'), actor: 'synthetic signed-in active user, not the owner', resource: 'the same synthetic listing',
    input: 'the real submitListingInquiry with that user\'s client',
    response: 'no error; exactly one listing_inquiries row; one e-mail to the e-mail sink; one owner notification',
    forbiddenEffects: ['a refusal of a legitimate request', 'more than one row, e-mail or notification'],
  }),
)

const scope = [
  // D8
  'src/modules/listings/domain/listingTransitionEngine.ts', 'src/modules/listings/domain/index.ts', 'src/modules/listings/domain/listingTransitionEngine.test.ts',
  'src/modules/listings/actions/applyListingTransition.ts', 'src/modules/listings/actions/applyListingTransition.test.ts',
  'src/modules/listings/components/ListingFormShellView.tsx', 'src/modules/listings/components/ListingFormShellView.stories.tsx',
  'src/modules/listings/components/ListingFormShell.tsx', 'src/modules/listings/components/ListingFormLoader.tsx',
  'src/app/[locale]/listings/[slug]/edit/page.tsx',
  // D9
  'src/lib/auth/accountAccess.ts', 'src/lib/auth/blockCheck.ts', 'src/modules/admin/actions/index.ts', 'src/modules/auth/components/AuthSheet.tsx',
  'messages/sq.json', 'messages/en.json', 'messages/uk.json', 'messages/it.json',
  // owner correction 2026-10-17: a guest has NO access to the owner's contact card; these four files only get corrected comments (no behaviour change here)
  'src/app/[locale]/listings/[slug]/page.tsx', 'src/modules/listings/actions/contactEvents.ts', 'src/modules/listings/actions/submitListingInquiry.ts', 'src/modules/listings/components/ListingContact.tsx',
  // session check for the two contact Server Actions (owner instruction 2026-10-17) and the dialog that has to cope with an ended session
  'src/lib/auth/requireViewer.ts', 'src/modules/listings/components/ListingInquiryDialog.tsx',
  'src/modules/listings/actions/submitListingInquiry.test.ts', 'src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts',
  'src/modules/listings/actions/__tests__/contactEvents.test.ts', 'src/modules/listings/actions/__tests__/visitorActions.security.test.ts',
  // existing admin tests whose doubles must now answer the Auth ban call (they test other behaviour; the ban itself is tested in accountBan.security.test.ts)
  'src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts', 'src/modules/admin/actions/__tests__/userAdministration.security.test.ts',
  'src/modules/admin/actions/__tests__/userWebsite.security.test.ts', 'src/__tests__/security/staffActions.test.ts', 'src/__tests__/security/serverEntryGuards.test.ts',
  'src/modules/listings/actions/__tests__/reStampExpiresAt.smoke.test.ts',
  // separate real-boundary test project: never collected by the default jsdom run
  'vitest.config.ts', 'vitest.integration.config.ts', 'package.json',
  'src/tests/integration/environment.ts', 'src/tests/integration/fixtures.ts', 'src/tests/integration/setup.ts',
  ...Object.values(T),
]

const rules = ['security-testing', 'security-test-quality', 'security-test-environment', 'security-test-boundaries', 'workflow-gates'].map((n) => `.claude/rules/shared/${n}.md`)

const row = (x) => `| ${x.id} | ${x.layer} | ${x.outcome} | ${x.critical ? 'yes' : 'no'} | ${x.actor} | ${x.testFile} |`
const md = `# Security task record — Task 923 Revision 7: owner decisions D8 and D9, and the session check of the contact actions

> **Status: DRAFT, stage \`planned\`.** Written by the Sonnet executor on the owner's explicit instruction of 2026-10-17 ("make the security contract at once"). It is a
> security addendum to Task 923 (\`tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md\`, Revision 7) and is NOT a kickoff: no number is reserved
> and no backlog row is created. Per \`.claude/rules/shared/workflow-gates.md\` the invariants, scope and applicability below belong to Opus: **Opus must review and either adopt or
> correct this record before it is treated as authoritative**. Sonnet changes only the stage and report metadata from here on.

## Owner decisions (verbatim, 2026-10-17)

- **D8.** "власник оголошення не може публікувати свої оголошення для загального перегляду. Оголошення потрапляє у pending, допоки адмін/модератор не перевірить це оголошення і не опублікує публічно."
- **D9.** "якщо користувач був заблокований, він не має змоги авторизуватись на сайті/адмінці, допоки його не розблокує адмін/модератор. Тобто у користувача немає доступу до його акаунту допоки це не вирішить адмін/модератор."
- **D9 addendum.** "Після бану одразу треба преривати сесію, щоб не було і шансу щось встигнути зробити від акаунту забаненого користувача."

## Required behaviour

1. An owner can set every listing status except \`active\`; \`active\` is reserved to an administrator / moderator. The rule is one domain function shared by the status list in the form and by the server gateway (pending -> inactive -> active is closed too). Consequence for the owner (to be confirmed): a listing the owner wants back is set to \`pending\`.
2. A status that removes access (\`blocked\`, \`inactive\`, a dated suspension that has not ended) bans the account in Supabase Auth in the same admin operation: sign-in, token refresh and \`auth.getUser\` stop at once (measured on this project: \`ban-experiment.cjs\`). Unblocking, an ended suspension and reactivation lift the ban. The status is saved first, so the database layer (restrictive policies in the proposed SQL) cuts a still-valid access token at the same moment; a failed ban is reported to the admin.
3. The sign-in sheet explains a banned account in the four languages and never shows that message for another error.
4. The Server Actions that reach the listing owner (\`submitListingInquiry\`, \`trackListingContactEvent\`) serve only a signed-in person whose profile exists and is active; a guest, a session without a profile, a blocked or inactive account is refused before anything is read about the listing owner, written, e-mailed or notified (owner correction: a guest has no access to the contact card). One shared helper decides it (\`requireViewer\`), the answer is \`unauthenticated\`, and a failing lookup fails closed.

**Critical cases and the real boundary.** A critical case is a protection whose break would let someone act without the right to. Presentation (the hidden status option, the banned-account text) is NOT critical: a hidden control proves presentation only (\`security-test-boundaries.md\`). Every critical invariant therefore has an \`integration\` allow and deny control on real Auth and the real database of the approved development project (\`workflow-gates\` rule, \`contract.mjs\`).

## Assets and boundaries (current source locators)

- Gateway: \`src/modules/listings/actions/applyListingTransition.ts\` (\`applyListingTransitionByStatus\`, the only writer of \`listings.status\`); rules \`src/modules/listings/domain/listingTransitionEngine.ts\` (privileged any-status API at "Privileged any-status API (Task 427)"); form \`ListingFormShellView.tsx\` (status options), \`ListingFormShell.tsx\` (\`onStatusChange\` throws the reason), \`app/[locale]/listings/[slug]/edit/page.tsx\` (\`canManageStatus\`).
- Account access: admin writes in \`src/modules/admin/actions/index.ts\` (\`updateUserProfileFull\`, \`deactivateUser\`, \`reactivateUser\`); auto-lift in \`src/lib/auth/blockCheck.ts\`; identity from \`src/lib/auth/server.ts\` \`getUser()\` (\`auth.getUser\`, validated by GoTrue); sign-in in \`src/modules/auth/components/AuthSheet.tsx\` (\`mapAuthError\`).
- Sensitive fields: \`listings.status\`, \`listings.expires_at\`, \`users.status\`, \`users.suspended_until\`, \`users.block_reason\`, Auth \`banned_until\`.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | As listed above. Dependencies: Supabase Auth admin API (\`auth.admin.updateUserById\`), \`createAdminClient\`, \`createNotification\`, Next cache revalidation. |
| Frontend security | Real \`ListingFormShellView\` (status options per role and current status, refused change) and real \`AuthSheet\` login view (banned, generic and successful answers). Cases SEC-D8-FE-*, SEC-D9-FE-*. |
| Server security | Real \`applyListingTransitionByStatus\`, real domain rules, real \`syncAccountAccess\`, real admin actions and \`getBlockedError\` with explicit I/O doubles that record the client used and every write. Cases SEC-D8-SRV-*, SEC-D9-SRV-*. |
| Database/integrations | APPLICABLE and **not part of this contract's runnable cases** (no SQL is in scope): the restrictive write/read policies, \`caller_is_active()\`, the two RPC checks and the status guard are in \`docs/sessions/evidence/task923/db-catalog/proposed-hardening.sql\`; they are proven by \`rls-harness.cjs\` (U01–U08, L01–L07, I01–I06, BL01–BL07) on a disposable or owner-approved database after Opus/owner apply them. The approved existing development database may receive reviewed, owner-approved corrective SQL; deliberate security weakening and destructive experiments require a disposable environment (\`security-test-environment.md\`). Until then the database layer is UNVERIFIED. The Auth ban semantics are evidenced by \`ban-experiment.cjs\` (synthetic user). |
| Cases | The table below; stable IDs, one invariant each. |
| Fixtures and environment | Unit suites use in-memory doubles and synthetic ids; no network, no live credentials. The \`*.integration.test.ts\` suites (own project \`vitest.integration.config.ts\`, script \`npm run test:security-integration\`, excluded from the default run) use real Auth and the real database of the owner-approved development project: the run refuses to start unless \`SECURITY_TEST_PROJECT_REF\` equals the project ref parsed from the Supabase URL, every row carries a per-run \`zz_synth_\` prefix, the e-mail provider is replaced by a recording sink, and clean-up is verified (a failed query is not "zero left"). Credentials are read from the owner's approved \`.env.local\` variables by name only (URL, anon key, service-role key) and never printed. |
| Sensitivity proof | Each critical case is broken in isolation by a named mutation in \`docs/sessions/evidence/task923/r8-142-unit-mutations.mjs\` (baseline pass, intended assertion failure, restored pass) and retained in the report. |
| Execution | \`node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json\`, then \`verify\`; QA profile Q4 (auth/account lifecycle, permissions); final \`npm run build\` and full \`npx vitest run\` as for any non-Q0 task. Expected collected cases: ${cases.length}. |

### Cases

| ID | Layer | Outcome | Critical | Actor | Test file |
|---|---|---|---|---|---|
${cases.map(row).join('\n')}

## Guests and the owner's contact card (owner correction, 2026-10-17)

The owner corrected an earlier statement: **a guest (signed-out visitor, or a zombie session without a profile) has no access to the owner's contact card at all** (not Call, not WhatsApp, not Message). Verified in source: on the listing page a guest gets \`ownerRaw = null\`, \`ListingContact\` selects the \`guestCta\` state and \`MantineListingContactPattern\` renders only the sign-in call to action in that state; \`ListingMobileCTA\` renders nothing (\`has_phone\` / \`has_whatsapp\` are false); the database function \`get_listing_owner_contact\` refuses anonymous callers (probe D09). What does NOT yet match: \`submitListingInquiry\` and \`trackListingContactEvent\` do not require a session, so a guest can call those Server Actions directly, and the comments in the four files below describe guest paths as if they were allowed. This record changes **comments only** in those four files (wording: guests are not offered, and must not be served, the contact card); the behaviour change (a session is required, plus the Turnstile and rate-limit work) belongs to the contact-protection task and its own contract.

## Implementation status (executor, 2026-10-17)

The stage stays \`planned\`: the cases are not all implemented. This section is a status note, not a claim of approval; Opus verifies independently.

| Part | State |
|---|---|
| Server and domain code (D8 rules and gateway, D9 \`syncAccountAccess\`, admin actions, \`getBlockedError\`, \`requireViewer\`, the two contact Server Actions) | implemented |
| Server unit cases (SEC-D8-SRV-*, SEC-D9-SRV-*, SEC-CS-SRV-*) | implemented, passing |
| Real-boundary cases (SEC-*-INT-*, own vitest project, real Auth and database of the approved development project) | implemented, passing, clean-up verified |
| Sensitivity of the four critical cases (unit and real boundary) | proved; raw artifacts in \`docs/sessions/evidence/task923/security/sensitivity/\` |
| Frontend cases (SEC-D8-FE-*, SEC-D9-FE-*, SEC-CS-FE-DENY) and their code (status control, \`AuthSheet\`, \`ListingInquiryDialog\`, comments in \`page.tsx\` / \`ListingContact.tsx\`, the four message files) | **not implemented**: the UI write gate (\`phase-write-gate.ps1\`, 5-second timeout, reads the whole session transcript) cannot finish in the current 300 MB session; to be done in a fresh session |
| \`proposed-hardening.sql\` (database layer) | proposed, NOT applied: the owner has not approved this exact SQL. Under the clarified environment rule (2026-10-17) the existing development database may receive it after Opus review of the exact SQL, the recorded fingerprint, a rollback plan and the owner's approval of that SQL; then rerun \`rls-harness.cjs\` (all VULN -> ok) |
| \`report\` file (\`validateReport\`) | not written: it requires all cases, including the frontend ones |

## Out of scope and still planned

- The contact-protection work (Cloudflare Turnstile Invisible for Call / WhatsApp / Message) and the future Chat button have their own contracts; they are not part of this record.
- Product edits made earlier in the same session (findings S1–S58, \`Header.tsx\`, \`Footer.tsx\`, \`ResetPasswordClient.tsx\`) predate this gate and are not covered here; they need their own retrofit by Opus.
`
writeFileSync(`${ROOT}${TASK}`, md)
const contract = {
  version: 1, stage: 'planned', kind: 'product', qaProfile: 'Q4',
  task: TASK, taskSha256: digest(ROOT.replace(/\/$/, ''), [TASK]),
  scope, rules, report: 'docs/sessions/evidence/task923/security/d8-d9-report.json', cases,
}
writeFileSync(`${ROOT}${CONTRACT}`, JSON.stringify(contract, null, 2) + '\n')
console.log(`wrote ${TASK} and ${CONTRACT}: ${cases.length} cases, ${scope.length} scope paths`)
