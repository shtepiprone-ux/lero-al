# Task 998 — Staff give or remove the "Verified" mark from the user's profile, and a refused change is shown as an error

Sprint 94. Priority P1. Owner decisions: owner list item 22 (2026-11-19, translated): "the admin or the moderator
verifies a user from the edit or view profile popup"; O994-2 (2026-11-19, translated): "the 'Verified' badge is given by an admin or
a moderator. But the problem is different: right now, as admin or moderator, I cannot give this badge, the function in
the admin does not work." Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The admin user profile shows the "Verified" badge but has no control to change it, so the owner cannot verify from the
place the owner works in; the only control is an icon in the users table, which shows "User verified" whatever the server
answers: on production a moderator who toggles an administrator's account gets "User verified" while nothing changes.
The table also offers the icon on rows where the server always refuses. Who verified whom is not recorded, and the
verified person is not told, although the `agent_verified` notification type and its label exist. After the task: the
profile offers "Verify" or "Remove verification" in view and in edit mode; the table and the profile show the control only where the
server allows it; a refusal or failure is an error message and the shown state stays the stored one; each real change
is written to the profile's change history with the staff member who made it; a verification sends the person one
`agent_verified` notification.

## Cause

Read at `dc5e3af66`
- The table's handler awaits the action and shows success without reading its answer: `src/components/admin/AdminUsersTable.tsx:85-90`. The action answers `{ error: 'forbidden' }` when the rank rule refuses (a moderator on an administrator's account) and `{ error: 'update_failed' }` when the write fails (`src/modules/admin/actions/index.ts:212-225`), and throws when the staff check fails (`src/modules/admin/actions/index.ts:33-39`), which also skips `setLoadingId(null)`, so the row spinner never ends (`src/components/admin/AdminUsersTable.tsx:80-83`).
- Measured on production 2026-11-19 with the `.env.local` test accounts (Playwright with a Supabase session cookie; every value restored afterwards): the admin and the moderator verify `HYDRATION_AGENT2` from `/admin/users` at 1440 and 390 px → database `true`, toast "User verified", and the badge then shows in the admin profile, the agent's `/uk/cabinet` and the listing contact card seen by `HYDRATION_AGENT1`; the moderator toggles `HYDRATION_ADMIN` → database unchanged (`false`), toast "User verified".
- The profile renders the badge and nothing else for it (`src/components/admin/AdminUserProfileView.tsx:506-510`); its view-mode actions are edit, deactivate or reactivate, and delete (`src/components/admin/AdminUserProfileView.tsx:312-354`); the page passes no verify permission (`src/app/admin/users/[id]/page.tsx:82-84`). Measured the same day: the profile of `HYDRATION_AGENT2` has 0 verify controls.
- The table renders the icon on every row for every staff viewer: mobile card `src/components/admin/AdminUsersTableView.tsx:115-131`, desktop row `src/components/admin/AdminUsersTableView.tsx:273-282`, verified tab `src/components/admin/AdminUsersTableView.tsx:335-345` and `src/components/admin/AdminUsersTableView.tsx:371-382`; the page reads no permission for it (`src/app/admin/users/page.tsx:26`).
- The action writes only `is_verified` (`src/modules/admin/actions/index.ts:217`): no `user_change_log` row, unlike a profile-type change (`src/modules/admin/actions/index.ts:538-545`), and no notification; `agent_verified` has an icon (`src/modules/notifications/components/NotificationItem.tsx:28`) and a type (`src/types/database.ts:50`) and no writer. The action also revalidates `/admin/badges` (`src/modules/admin/actions/index.ts:224`), a page deleted in `121401d77`.

Fix: each handler reads the answer, shows an error for a refusal, a failure or a throw and clears its loading state in `finally`; the profile gets the control; both surfaces render it only for a viewer with `users.verify` who may act on that account; the action changes the value only when it differs, and for that change writes the change-log row and, on a verification, the notification; the dead revalidation goes.

## Scope

- `src/modules/admin/actions/index.ts` `toggleUserVerified`: the update matches the opposite stored value and returns the changed row (`.eq('is_verified', !isVerified).select('id')`), so a repeat or a second concurrent call changes nothing and answers `{}`; when a row changed, it inserts `user_change_log` (`field_name: 'is_verified'`, `old_value`/`new_value` `'false'`/`'true'`, `changed_by` the actor) and, when the new value is `true`, calls `createNotification({ userId, type: 'agent_verified', templateId: 'agent_verified', templateParams: {}, title, body })` with the Albanian fallback text; a failed log insert or notification is logged with the ids and does not fail or undo the change; `revalidatePath('/admin/badges')` removed.
- `src/components/admin/AdminUsersTable.tsx` `handleToggleVerified`: success toast only for `{}`; `forbidden` → `admin.users.verify_forbidden`; another error or a throw → `admin.users.verify_error` (`toast.error`); `setLoadingId(null)` in `finally`.
- `src/lib/auth/verifyRule.ts` (new, importable from client and server): `staffMayVerify({ hasVerifyKey, viewerRole, targetRole })` is `hasVerifyKey && (targetRole !== 'admin' || viewerRole === 'admin')`, the server's rule (`checkStaff` key, `checkActorRank`) used only to show the control.
- `src/app/admin/users/page.tsx`: `hasVerifyKey = await hasPermission('users.verify')` and the viewer role from `requireStaffPage()`, passed to the table; the verified tab query also selects `role`.
- `src/components/admin/AdminUsersTableView.tsx`: props `hasVerifyKey` and `viewerRole`; the icon (mobile card, desktop row, verified tab) renders only when `staffMayVerify` allows it for that row; `VerifiedAgent` gains `role`.
- `src/app/admin/users/[id]/page.tsx`: `canVerify = staffMayVerify(...)` for the shown account, passed to `AdminUserProfile`.
- `src/components/admin/AdminUserProfile.tsx`: `handleToggleVerified` calls `toggleUserVerified(user.id, !user.is_verified)` with the table's answer handling (the `admin.users` keys), a loading state, and `router.refresh()` after a success.
- `src/components/admin/AdminUserProfileView.tsx`: props `canVerify`, `verifyLoading`, `onToggleVerified`; in the view-mode actions, after "Edit profile", a `Button fullWidth justify="flex-start" variant="default"` (the "Edit profile" treatment) with `ShieldCheck` (verify) or `ShieldOff` (remove), label `admin.users.verify` / `admin.users.revoke_verify`, `loading={verifyLoading}`, rendered only when `canVerify`; in edit mode the same button closes the "Role and status" section and acts at once, outside the form (the form's values come from `defaultValues` at mount and reset only on save or cancel, `src/components/admin/AdminUserProfile.tsx:152,327,411`, so the refresh keeps unsaved fields); the change-history rows show their field: `HistoryRow` gets a `label`, profile-type rows keep their labels, `is_verified` rows read "Verification: Not verified → Verified" (keys below).
- `messages/{sq,en,uk,it}.json`: `admin.users.verify_forbidden`, `admin.users.verify_error`, `admin.user_profile.history.verification`, `admin.user_profile.history.verified`, `admin.user_profile.history.not_verified`, `notifications.agent_verified_title`, `notifications.agent_verified_body`.
- Stories: `src/stories/patterns/mantine/AdminUserProfileView.stories.tsx` adds `ViewVerifiable` (unverified agent, "Verify"), `ViewVerified` (verified agent, "Remove verification"), `ViewNoVerifyPermission` (no control), `EditVerifiable` (the button in "Role and status") and a change-history row of each kind; `src/stories/patterns/mantine/AdminUsersTable.stories.tsx` adds `NoVerifyPermission` (no icon) and a moderator viewer with an administrator row (no icon on that row).
- Dependencies: none.
- Out of scope: the server authorization of `toggleUserVerified` (`checkStaff`, `checkActorRank`; unchanged, its tests stay); notification links and their language (Task 988); `revalidatePath('/admin/badges')` in `setListingPremium` (`index.ts:127`, asserted by `adminOperations.security.test.ts:117`) goes with Task 999, which changes that action.

## Attack surface

Changed: an admin function (`toggleUserVerified`) gains two writes and a second caller page.
1. **What are we working on?** The Server Action `toggleUserVerified`, reachable by an administrator and by a moderator
   whose `users.verify` key is on (`checkStaff`), on accounts the rank rule allows (`checkActorRank`: an
   administrator's account only for an administrator); called from `/admin/users` and now `/admin/users/[id]`. It
   writes `users.is_verified` and now `user_change_log` and `notifications` through the service role. Verification is a
   privilege: it raises the account's contact-reveal limits (`src/modules/listings/actions/contactGateway.ts:55-60`).
2. **What can go wrong?**
   - T1 E: a guest, a signed-in user, a moderator without the key, or a moderator on an administrator's account calls
     the action directly → mitigate: `checkStaff` and `checkActorRank` on the server (unchanged); a hidden control is
     not the control → AC1, tests `SEC-998-VERIFY-DENY`.
   - T2 R: a verification or removal with no trace of who made it → mitigate: one `user_change_log` row per real change
     with `changed_by` from the session, never from input → AC2, `SEC-998-VERIFY-LOGGED`.
   - T3 T (abuse: repeat, race): two calls flip the value twice, or send two notifications → mitigate: the update
     matches the opposite stored value, so only one call changes the row and only that call writes → AC3,
     `SEC-998-VERIFY-ONCE`.
   - T4 S/I: notification text taken from the caller → eliminate: the action takes no text; title and body are
     template keys and the fixed Albanian fallback → AC4.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix rows: admin × any account × verify/remove → allow (`SEC-998-VERIFY-ALLOW`); moderator with
   `users.verify` × non-admin account → allow; moderator × administrator's account → deny; moderator without the key,
   signed-in user, guest × any → deny (`SEC-998-VERIFY-DENY`).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (c12dd22e17ce, 2026-11-19).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T4 name the direct call by a lower role, the untraced change, the repeat and the race, and caller-supplied text — AC1, AC2, AC3, AC4.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the action, its callers and its two new writes — AC1, AC2, AC4.
- Authentication: not applicable — `verifyRule.ts` reads no credential; sign-in and passwords are untouched.
- Authentication_Patterns: not applicable — no authentication flow or identity provider changes here.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every call passes `checkStaff` with `users.verify` and the rank rule before any write, whichever page sent it — AC1.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed rank read refuses (unchanged), and the client treats a throw as a failure, never as success — AC1, AC5.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the action checks the key and the target account itself; the shown control only mirrors it — AC1, AC6.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the hidden control is a convenience; AC1 calls the action directly for every denied actor — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix rows of "## Attack surface" are cases of the new test with the real permission helpers (the matrix file itself is Task 950's) — AC1.
- Bot_Management_and_Anti-Automation: not applicable — a staff-only action with no anonymous or public caller.
- Business_Logic_Security: "Any operation that reads a value, makes a decision, and then writes a value is a potential race condition." — the update matches the opposite stored value in one statement, so only one call changes the row and writes the log and the notification — AC3.
- Cookie_Theft_Mitigation: not applicable — no cookie is set, read or changed by this task.
- Credential_Stuffing_Prevention: not applicable — the task adds no login, password or recovery path.
- Cross_Site_Scripting_Prevention: not applicable — every new text is a message key rendered as React text.
- DOM_based_XSS_Prevention: not applicable — no new DOM sink, URL or HTML string is written.
- Denial_of_Service: not applicable — one staff click updates one row; no work grows with input.
- Error_Handling: "a generic response is returned by the application but the error details are logged server side for investigation, and not returned to the user" — the client shows a localized refusal or failure message; the action logs a failed write, log row or notification with the ids — AC4, AC5.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the service-role writes run only after the action's own key and rank checks — AC1.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — a non-boolean value answers `validation` and writes nothing — AC1.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the rank rule is checked for the named account on every call — AC1.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression is added.
- Logging: "User administration actions such as addition or deletion of users, changes to privileges" — verification raises the account's reveal limits, so each real change writes `user_change_log` with the actor from the session — AC2.
- Logging_Vocabulary: "All activity by privileged users such as admin should be recorded." — the same row names `changed_by`, the field and both values — AC2.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — the action writes `is_verified` and fixed log and notification fields only; nothing else comes from the caller — AC1, AC4.
- Multifactor_Authentication: not applicable — staff sign-in and its factors are unchanged (Task 960 carries MFA).
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the tests call the action directly, and it returns `{}` or `{ error }` only — AC1, AC5.
- Prototype_Pollution_Prevention: not applicable — no object is built from caller-supplied keys.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC10.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC10.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1-AC4.
- Session_Management: not applicable — the action reads the existing session through `requireViewer`; nothing about sessions changes.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2, AC3, AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate breaks included — AC10.
- Web_Cache_Security: not applicable — the task adds no cache and drops a stale revalidation.
- Web_Frontend_Security: not applicable — no `innerHTML`, new script or third-party content is added.

## UI

Reference research (GR-7): inherited canonical design — owner decision 2026-10-20. GR-0 queries: "staff action in the
user profile", "row action icon", "change history row", "action feedback". Inspected: the profile's view-mode actions
(`AdminUserProfileView.tsx:312-354`, Story `Patterns/Mantine/AdminUserProfileView` `View`, `ViewAgent`), the table icon
(`AdminUsersTableView.tsx:115-131`, Story `Patterns/Mantine/AdminUsersTable` `Default`, `VerifiedTab`), the toast owner
`src/lib/toast`. Decision: REUSE the profile action `Button` inside `MantineFormSection` with the "Edit profile"
treatment and `theme.other.iconSize.standard`; REUSE the table icon unchanged (only where it renders); EXTEND the view's
local `HistoryRow` with a field label; REUSE `toast.success` and `toast.error`. No new token, colour or style.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminUserProfileView.tsx — the view-mode actions, the edit-mode "Role and status" section and the change history of /admin/users/[id]; src/components/admin/AdminUsersTableView.tsx — the row actions of /admin/users
- Component families: form-picker-and-choice, record-list-and-data
- Pattern IDs: form-stack, inline-control, record-card
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation, w3c-meaningful-sequence, w3c-focus-order, apple-hig-lists-tables, android-common-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineDataTableToCards.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the profile column stacks and its actions are full-width buttons, table rows are cards with the icon at the touch target; 640px transition to the side column and the table
- Mobile order: profile view — Edit profile → Verify or Remove verification → deactivate or reactivate → delete; profile edit — account type → status → block fields → Verify or Remove verification; history row — field label → old value → new value; card — identity → state → actions
- Required-content treatment: labels and history values wrap at full width; no clipping
- Story and verification: Patterns/Mantine/AdminUserProfileView ViewVerifiable, ViewVerified, ViewNoVerifyPermission, EditVerifiable and Patterns/Mantine/AdminUsersTable NoVerifyPermission at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 Only an allowed staff member changes the mark — test: `src/modules/admin/actions/__tests__/staffVerification.security.test.ts` (new; the real permission helpers, `requireViewer` and action, the in-memory database of `adminResults.security.test.ts`): `SEC-998-VERIFY-ALLOW` admin on an agent and on an administrator, moderator with the key on an agent → value changed;
  `SEC-998-VERIFY-DENY` guest, signed-in agent, moderator without the key, moderator on an administrator → refused (a throw or `forbidden`), value unchanged, no log row, no notification; `isVerified` as `'true'`, `1` or an object → `validation`, nothing written.
- AC2 Each real change is recorded with its actor — test: `src/modules/admin/actions/__tests__/staffVerification.security.test.ts`, `SEC-998-VERIFY-LOGGED`: a verification writes one `user_change_log` row (`is_verified`, `'false'` → `'true'`, `changed_by` the session's user), a removal the reverse; a failing log insert keeps the change, answers `{}` and logs the ids.
- AC3 A repeat or a race changes once — test: `src/modules/admin/actions/__tests__/staffVerification.security.test.ts`, `SEC-998-VERIFY-ONCE`: two sequential and two concurrent (`Promise.all`) verifications of one account give one change, one log row and one notification, and both answer `{}`; the action revalidates exactly `/admin/users`.
- AC4 A verification tells the person once, a removal does not — test: `src/modules/admin/actions/__tests__/staffVerification.security.test.ts`: one `notifications` row with `type` and `template_id` `agent_verified`, the fixed Albanian title and body and no link; none on removal; a failing notification insert keeps the change and answers `{}`.
- AC5 The table shows what the server answered — test: `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (extended): `{}` → success toast; `{ error: 'forbidden' }` → the `verify_forbidden` error toast and no success; `{ error: 'update_failed' }` and a throw → `verify_error`; after a throw the spinner is gone and the icon is back.
- AC6 The control appears only where the server allows it — test: `src/lib/auth/__tests__/verifyRule.test.ts` (new: every combination of key, viewer role and target role) and `AdminUsersTable.smoke.test.tsx` (extended: no icon without the key; a moderator sees no icon on an administrator's row in the list and in the verified tab, and sees it on the other rows).
- AC7 The profile verifies and removes — test: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (extended): with `canVerify` the button reads "Verify" for an unverified and "Remove verification" for a verified account, calls `toggleUserVerified(id, !is_verified)`, shows the AC5 messages for the same answers and refreshes after a success, in view and in edit mode; in edit mode an unsaved name stays in its field after the change; without `canVerify` there is no button in either mode.
- AC8 The history names the field — test: `AdminUserProfile.smoke.test.tsx` (extended): an `is_verified` row reads "Verification" with "Not verified" → "Verified"; a `profile_type` row keeps its labels under "Account type".
- AC9 Every new text exists in the four languages and the Stories show every state — test: `node scripts/check-i18n-parity.mjs` and `node scripts/quality/locale-safety.mjs`; the new Stories at 320, 639 and 640 px in sq, en, uk, it with no horizontal overflow, no clipped text and targets of at least 44 px (`node scripts/check-mobile-adaptation-contract.mjs` and the census of `.claude/rules/shared/rendered-state-census.md`, raw output saved).
- AC10 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read `src/modules/admin/actions/index.ts` (actor resolution, rank check, `toggleUserVerified`), `AdminUsersTable.tsx`, `AdminUsersTableView.tsx`, `AdminUserProfile.tsx`, `AdminUserProfileView.tsx`, both pages, and `adminResults.security.test.ts` for the in-memory database.
2. Tests first (AC1-AC8); save each failing output.
3. The rule helper, the action, the two containers, the two views, the two pages, the messages, the Stories. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); one deliberate break per security test (the key check, the rank rule, the opposite-value filter, `changed_by` from the session), restored.
5. Report: each command, exit code, relevant output. After the merge Opus repeats the 2026-11-19 production check with the `.env.local` test accounts (admin and moderator verify from the profile; the moderator sees no control on the administrator's account; every value restored).

## Review
