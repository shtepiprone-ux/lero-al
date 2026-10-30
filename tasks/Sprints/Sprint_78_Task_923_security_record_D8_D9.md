# Security task record — Task 923 Revision 7: owner decisions D8 and D9, and the session check of the contact actions

> **Status: ADOPTED by Opus with corrections, review 8 of Task 923 (2026-10-17); stage `planned`.** First drafted by the Sonnet executor on the owner's instruction of
> 2026-10-17 ("make the security contract at once"). It is the security record of Task 923 Revision 8 (kickoff §17,
> `tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md`) and is NOT a kickoff: no number is reserved. The invariants, scope and applicability
> below are Opus's; Sonnet changes only the stage and report metadata from here on.
>
> **Opus corrections (review 8).** (1) The contact-action session check (`requireViewer`, cases SEC-CS-*) is in scope here, as implemented; the earlier sentence that this
> record changed comments only is withdrawn. (2) `src/lib/security/inputs.ts`, `src/lib/security/safeUrl.ts` and `src/lib/postgrest/escape.ts` are new files imported by
> the changed actions, so they join the scope. (3) `inputs` now names the unchanged guards the cases rely on: `src/lib/auth/server.ts`, `src/lib/auth/permissions.ts`,
> `src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`. (4) The sensitivity proof is `docs/sessions/evidence/task923/security/sensitivity.mjs` with its artifacts in
> `security/sensitivity/`. (5) Any error code the inquiry dialog does not handle shows an error, never success (kickoff §17, R42).
> (6) **D21:** a banned account sees the wrong-credentials text, because Supabase Auth answers `user_banned` before it checks the password
> (`docs/sessions/evidence/task923/design-r8/supabase-auth-ban-order.txt`; OWASP ASVS 5.0 6.3.8); the separate blocked message of the
> earlier draft is withdrawn. (7) **D20:** the frontend status cases test the real `StatusChangeSelect` with `buildListingStatusOptions`, not
> the legacy form (`listingStatusOptions.security.test.tsx` replaces `ListingFormShellView.status.security.test.tsx`). (8) **D19:** the
> inquiry dialog is migrated to canonical Mantine; after `unauthenticated` it closes, keeps the typed text and opens the sign-in sheet
> (one sheet at a time); SEC-CS-FE-ALLOW and SEC-CS-FE-ERR are added. D22 (owner never sets `active`) and D23 (`inactive` blocks like
> `blocked`) confirm the implemented rules. (9) **R37 (Opus SQL review, 2026-10-18, D25, D26):** the approved SQL is versioned as
> `supabase/migrations/20261018000000_task923_access_hardening.sql`, so the database layer enters this contract with real-database cases
> SEC-DB-* in `src/tests/integration/accessHardening.integration.test.ts`; `getBlockedError` reads through the service role and a missing
> profile row is no access (SEC-D9-SRV-MISSING-DENY). A critical database case's "mutant" is the recorded run against the still
> unhardened database before the approved file is applied (a deliberate weakening of the shared database was then forbidden; owner
> decision D91 of 2026-10-28 allows it until launch, see "Revision 54 amendments" below); baseline and
> restored are runs after it. (10) **R44 (owner D27, 2026-10-18: blocked or deleted holds for every account and every role):** every
> server decision by role takes the role from `requireViewer`, which already refuses a missing, deleted or no-access profile, so a
> blocked or deleted user, agent, moderator or administrator gets nothing from a guard; `getBlockedError` also answers `account_blocked`
> for a set `deleted_at`; no product file reads the caller's `users.role` anywhere else (static case). Cases SEC-D27-SRV-* (unit) and
> SEC-D27-INT-* (real development project), and SEC-DB-STORAGE-* / SEC-DB-REALTIME-DENY for file storage and realtime events after
> the approved SQL. (11) **Self-audit and R45 (owner D28, D29, 2026-10-18):** only `admin` / `moderator` may write avatars, so the storage
> cases use a moderator and an administrator; the unbanned no-access state used by the D27 real-boundary cases is the inactivity mark the
> cron writes (`softDeleteUser` has no caller). R45: the middleware ends a banned, deleted or no-access session (`signOut` with scope
> `local`) and restores an inactivity-marked account within 90 days through `restore_inactive_account`; cases SEC-D29-* and SEC-D28-*,
> with the header's guest state as the frontend consumer. (12) **R43 (owner D30–D34, 2026-10-18):** one `deleteAccount` for staff,
> self and the inactivity cron deletes the Auth user (one transaction), then the collected Cloudinary files; the deletion SQL keeps
> staff traces with a name, deletes the person's views and clicks and lowers the counts, keeps reports and inquiries, and deletes a
> company with its creator; cases SEC-DEL-*, with the cabinet deletion dialog as the frontend consumer. Owner D35 keeps the name on
> the kept reports too (`user_id_name`). R46: both deletion dialogs use the canonical `MantineDeleteConfirmModal` with a typed DELETE
> (SEC-DEL-FE-OWNER-*, SEC-DEL-FE-ADMIN). (13) **Review 11 (2026-10-19, kickoff §20, R51):** the 16 existing test files that still give
> the caller's role through the session client fail against the R44 guards (216 tests, `docs/sessions/evidence/task923/review-11/rv11-04-red-suite.txt`);
> they join the scope so R44 can move their doubles to the `requireViewer` read. Each test keeps its name and expected answer.

## Owner decisions (verbatim, 2026-10-17)

- **D8.** "власник оголошення не може публікувати свої оголошення для загального перегляду. Оголошення потрапляє у pending, допоки адмін/модератор не перевірить це оголошення і не опублікує публічно."
- **D9.** "якщо користувач був заблокований, він не має змоги авторизуватись на сайті/адмінці, допоки його не розблокує адмін/модератор. Тобто у користувача немає доступу до його акаунту допоки це не вирішить адмін/модератор."
- **D9 addendum.** "Після бану одразу треба преривати сесію, щоб не було і шансу щось встигнути зробити від акаунту забаненого користувача."

## Required behaviour

1. An owner can set every listing status except `active`; `active` is reserved to an administrator / moderator. The rule is one domain function shared by the status list in the form and by the server gateway (pending -> inactive -> active is closed too). Consequence for the owner (to be confirmed): a listing the owner wants back is set to `pending`.
2. A status that removes access (`blocked`, `inactive`, a dated suspension that has not ended) bans the account in Supabase Auth in the same admin operation: sign-in, token refresh and `auth.getUser` stop at once (measured on this project: `ban-experiment.cjs`). Unblocking, an ended suspension and reactivation lift the ban. The status is saved first, so the database layer (restrictive policies in the proposed SQL) cuts a still-valid access token at the same moment; a failed ban is reported to the admin.
3. The sign-in sheet answers a banned account with the same text as wrong credentials (D21), so the answer reveals neither the account
   nor the ban; every other error keeps its own message.
4. The Server Actions that reach the listing owner (`submitListingInquiry`, `trackListingContactEvent`) serve only a signed-in person whose profile exists and is active; a guest, a session without a profile, a blocked or inactive account is refused before anything is read about the listing owner, written, e-mailed or notified (owner correction: a guest has no access to the contact card). One shared helper decides it (`requireViewer`), the answer is `unauthenticated`, and a failing lookup fails closed.

**Critical cases and the real boundary.** A critical case is a protection whose break would let someone act without the right to. Presentation (the hidden status option, the banned-account text) is NOT critical: a hidden control proves presentation only (`security-test-boundaries.md`). Every critical invariant therefore has an `integration` allow and deny control on real Auth and the real database of the approved development project (`workflow-gates` rule, `contract.mjs`).

## Assets and boundaries (current source locators)

- Gateway: `src/modules/listings/actions/applyListingTransition.ts` (`applyListingTransitionByStatus`, the only writer of `listings.status`); rules `src/modules/listings/domain/listingTransitionEngine.ts` (privileged any-status API at "Privileged any-status API (Task 427)"); form `ListingFormShellView.tsx` (status options), `ListingFormShell.tsx` (`onStatusChange` throws the reason), `app/[locale]/listings/[slug]/edit/page.tsx` (`canManageStatus`).
- Account access: admin writes in `src/modules/admin/actions/index.ts` (`updateUserProfileFull`, `deactivateUser`, `reactivateUser`); auto-lift in `src/lib/auth/blockCheck.ts`; identity from `src/lib/auth/server.ts` `getUser()` (`auth.getUser`, validated by GoTrue); sign-in in `src/modules/auth/components/AuthSheet.tsx` (`mapAuthError`).
- Sensitive fields: `listings.status`, `listings.expires_at`, `users.status`, `users.suspended_until`, `users.block_reason`, Auth `banned_until`.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | As listed above. Dependencies: Supabase Auth admin API (`auth.admin.updateUserById`), `createAdminClient`, `createNotification`, Next cache revalidation. |
| Frontend security | Real `StatusChangeSelect` fed by `buildListingStatusOptions` (status options per role and current status, refused change), real `AuthSheet` login view (banned, generic and successful answers) and the real migrated `ListingInquiryDialog` (every action answer). Cases SEC-D8-FE-*, SEC-D9-FE-*, SEC-CS-FE-*. |
| Server security | Real `applyListingTransitionByStatus`, real domain rules, real `syncAccountAccess`, real admin actions and `getBlockedError` with explicit I/O doubles that record the client used and every write. Cases SEC-D8-SRV-*, SEC-D9-SRV-*. |
| Database/integrations | **Since review 8 in scope (correction 9):** the approved v4 SQL as `supabase/migrations/20261018000000_task923_access_hardening.sql` and cases SEC-DB-* on the real database of the approved development project. Earlier text, kept for the record: APPLICABLE and **not part of this contract's runnable cases** (no SQL is in scope): the restrictive write/read policies, `caller_is_active()`, the two RPC checks and the status guard are in `docs/sessions/evidence/task923/db-catalog/proposed-hardening.sql`; they are proven by `rls-harness.cjs` (U01–U08, L01–L07, I01–I06, BL01–BL07) on a disposable or owner-approved database after Opus/owner apply them. The approved existing development database may receive reviewed, owner-approved corrective SQL; deliberate security weakening and destructive experiments require a disposable environment (`security-test-environment.md`). Until then the database layer is UNVERIFIED. The Auth ban semantics are evidenced by `ban-experiment.cjs` (synthetic user). |
| Cases | The table below; stable IDs, one invariant each. |
| Fixtures and environment | Unit suites use in-memory doubles and synthetic ids; no network, no live credentials. The `*.integration.test.ts` suites (own project `vitest.integration.config.ts`, script `npm run test:security-integration`, excluded from the default run) use real Auth and the real database of the owner-approved development project: the run refuses to start unless `SECURITY_TEST_PROJECT_REF` equals the project ref parsed from the Supabase URL, every row carries a per-run `zz_synth_` prefix, the e-mail provider is replaced by a recording sink, and clean-up is verified (a failed query is not "zero left"). Credentials are read from the owner's approved `.env.local` variables by name only (URL, anon key, service-role key) and never printed. |
| Sensitivity proof | Each critical case is broken in isolation by a named mutation in `docs/sessions/evidence/task923/security/sensitivity.mjs` (baseline pass, intended assertion failure, restored pass; unit and real boundary), its raw artifact in `security/sensitivity/` hashed into the report. |
| Execution | `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`, then `verify`; QA profile Q4 (auth/account lifecycle, permissions); final `npm run build` and full `npx vitest run` as for any non-Q0 task. Expected collected cases: 33 (25 unit, 8 real boundary) after the review-8 amendment. |

### Cases

| ID | Layer | Outcome | Critical | Actor | Test file |
|---|---|---|---|---|---|
| SEC-D8-SRV-DOMAIN-DENY | server | deny | no | listing owner without an administrator or moderator role | src/modules/listings/domain/ownerStatusRules.security.test.ts |
| SEC-D8-SRV-ALLOW | server | allow | no | administrator, moderator | src/modules/listings/actions/ownerPublish.security.test.ts |
| SEC-D8-SRV-OWNER-ALLOW | server | allow | no | listing owner (role user) | src/modules/listings/actions/ownerPublish.security.test.ts |
| SEC-D8-SRV-DENY | server | deny | yes | listing owner (role user), owner with null role | src/modules/listings/actions/ownerPublish.security.test.ts |
| SEC-D8-SRV-DENY-OTHER | server | deny | no | unrelated signed-in user, user with null role | src/modules/listings/actions/ownerPublish.security.test.ts |
| SEC-D8-SRV-ERR | server | error | no | administrator and owner | src/modules/listings/actions/ownerPublish.security.test.ts |
| SEC-D8-FE-ALLOW | frontend | allow | no | administrator or moderator editing a listing | src/modules/listings/components/listingStatusOptions.security.test.tsx |
| SEC-D8-FE-DENY | frontend | deny | no | listing owner editing their own listing | src/modules/listings/components/listingStatusOptions.security.test.tsx |
| SEC-D8-FE-ERR | frontend | error | no | listing owner | src/modules/listings/components/listingStatusOptions.security.test.tsx |
| SEC-D9-SRV-DENY | server | deny | yes | server code acting for staff | src/lib/auth/accountAccess.security.test.ts |
| SEC-D9-SRV-ALLOW | server | allow | no | server code acting for staff | src/lib/auth/accountAccess.security.test.ts |
| SEC-D9-SRV-ERR | server | error | no | server code acting for staff | src/lib/auth/accountAccess.security.test.ts |
| SEC-D9-SRV-ADMIN-DENY | server | deny | yes | anonymous, user without the permission, moderator targeting an administrator | src/modules/admin/actions/accountBan.security.test.ts |
| SEC-D9-SRV-ADMIN-ALLOW | server | allow | no | administrator with the permission | src/modules/admin/actions/accountBan.security.test.ts |
| SEC-D9-SRV-ADMIN-ERR | server | error | no | administrator | src/modules/admin/actions/accountBan.security.test.ts |
| SEC-D9-SRV-LIFT-ALLOW | server | allow | no | the suspended person calling a guarded action | src/lib/auth/blockCheck.security.test.ts |
| SEC-D9-FE-ALLOW | frontend | allow | no | visitor with valid credentials | src/modules/auth/components/AuthSheet.banned.security.test.tsx |
| SEC-D9-FE-DENY | frontend | deny | no | person whose account is blocked | src/modules/auth/components/AuthSheet.banned.security.test.tsx |
| SEC-D9-FE-ERR | frontend | error | no | anonymous visitor who tries to sign in | src/modules/auth/components/AuthSheet.banned.security.test.tsx |
| SEC-CS-SRV-DENY | server | deny | yes | guest without a session, session of a deleted profile, blocked account, inactive account | src/modules/listings/actions/contactSession.security.test.ts |
| SEC-CS-SRV-ALLOW | server | allow | no | signed-in person with an active profile, not the owner | src/modules/listings/actions/contactSession.security.test.ts |
| SEC-CS-SRV-ERR | server | error | no | signed-in person during an Auth or database outage | src/modules/listings/actions/contactSession.security.test.ts |
| SEC-CS-FE-DENY | frontend | deny | no | signed-in person whose session expired | src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx |
| SEC-CS-FE-ERR | frontend | error | no | signed-in person with an active account | src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx |
| SEC-CS-FE-ALLOW | frontend | allow | no | signed-in person with an active account | src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx |
| SEC-D8-INT-DENY | server | deny | no | synthetic listing owner (role user) | src/modules/listings/actions/ownerPublish.integration.test.ts |
| SEC-D8-INT-ALLOW | server | allow | no | synthetic administrator | src/modules/listings/actions/ownerPublish.integration.test.ts |
| SEC-D9-INT-DENY | server | deny | no | synthetic user with a live session | src/lib/auth/accountAccess.integration.test.ts |
| SEC-D9-INT-ALLOW | server | allow | no | the same synthetic user | src/lib/auth/accountAccess.integration.test.ts |
| SEC-D9-INT-ADMIN-DENY | server | deny | no | synthetic user with role user (session injected as the cookie-bound client) | src/modules/admin/actions/accountBan.integration.test.ts |
| SEC-D9-INT-ADMIN-ALLOW | server | allow | no | synthetic administrator | src/modules/admin/actions/accountBan.integration.test.ts |
| SEC-CS-INT-DENY | server | deny | no | guest client without a session; synthetic blocked account | src/modules/listings/actions/contactSession.integration.test.ts |
| SEC-CS-INT-ALLOW | server | allow | no | synthetic signed-in active user, not the owner | src/modules/listings/actions/contactSession.integration.test.ts |

## Guests and the owner's contact card (owner correction, 2026-10-17)

The owner corrected an earlier statement: **a guest (signed-out visitor, or a zombie session without a profile) has no access to the owner's contact card at all** (not Call, not WhatsApp, not Message). Verified in source: on the listing page a guest gets `ownerRaw = null`, `ListingContact` selects the `guestCta` state and `MantineListingContactPattern` renders only the sign-in call to action in that state; `ListingMobileCTA` renders nothing (`has_phone` / `has_whatsapp` are false); the database function `get_listing_owner_contact` refuses anonymous callers (probe D09). What does NOT yet match: `submitListingInquiry` and `trackListingContactEvent` do not require a session, so a guest can call those Server Actions directly, and the comments in the four files below describe guest paths as if they were allowed. This record requires a session in both Server Actions through `requireViewer` (cases SEC-CS-*) and corrects the guest wording of the comments in those four files. The Turnstile, atomic rate-limit and idempotency work belongs to the contact-protection task and its own contract.

## Implementation status (executor, 2026-10-17)

The stage stays `planned`: the cases are not all implemented. This section is a status note, not a claim of approval; Opus verifies independently.

| Part | State |
|---|---|
| Server and domain code (D8 rules and gateway, D9 `syncAccountAccess`, admin actions, `getBlockedError`, `requireViewer`, the two contact Server Actions) | implemented |
| Server unit cases (SEC-D8-SRV-*, SEC-D9-SRV-*, SEC-CS-SRV-*) | implemented, passing |
| Real-boundary cases (SEC-*-INT-*, own vitest project, real Auth and database of the approved development project) | implemented, passing, clean-up verified |
| Sensitivity of the four critical cases (unit and real boundary) | proved; raw artifacts in `docs/sessions/evidence/task923/security/sensitivity/` |
| Frontend cases (SEC-D8-FE-*, SEC-D9-FE-*, SEC-CS-FE-DENY) and their code (status control, `AuthSheet`, `ListingInquiryDialog`, comments in `page.tsx` / `ListingContact.tsx`, the four message files) | **not implemented**: the UI write gate (`phase-write-gate.ps1`, 5-second timeout, reads the whole session transcript) cannot finish in the current 300 MB session; to be done in a fresh session |
| `proposed-hardening.sql` (database layer) | proposed, NOT applied: the owner has not approved this exact SQL. Under the clarified environment rule (2026-10-17) the existing development database may receive it after Opus review of the exact SQL, the recorded fingerprint, a rollback plan and the owner's approval of that SQL; then rerun `rls-harness.cjs` (all VULN -> ok) |
| `report` file (`validateReport`) | not written: it requires all cases, including the frontend ones |

## Revision 54 amendments (Opus, 2026-10-28, Task 923 final review)

The executable route is kickoff §80 (`tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md`, R159–R165). It supersedes the
implementation status above, which is kept as history.

- **Owner decision D91** (2026-10-28, translated): "That is not a problem: right now the site is closed to the world, nobody knows anything about it.
  So for now everything may be tested on the real database." Until launch, a critical database case's mutant is a scripted break of the one protection
  the case names on the development project. Each break runs one at a time through `docs/sessions/evidence/task923/security/db-break.cjs`, with a
  catalog fingerprint before and after and the restore in `finally`, on `zz_synth_` fixtures only (`.claude/rules/shared/security-test-environment.md`).
  The break of each case is named in kickoff §80, R163.
- **Cases retired** (`docs/sessions/evidence/task923/final-review/fr-31-contract-corrections.txt`):
  - `SEC-S16-*`: D51 removed every reader, and `exchange_providers` grants nothing to `anon` / `authenticated`.
  - `SEC-DB-STORAGE-ALLOW` / `-DENY`: no moderator Storage policy exists; `SEC-DB-X-AVATARS-STORAGE-*` carry the boundary.
- **Cases moved out**, their definitions kept in `fr-31-moved-cases.json`:
  - `SEC-X-SRV-CONFIRM-GET-INERT` goes to Task 932.
  - `SEC-DB-X-STAFF-LISTING-WRITE-*` and `SEC-DB-X-PROFILE-FIELDS-*` go to hardening v8b, whose SQL makes them true.
- **Cases amended:**
  - `SEC-D29-SRV-*` lose their `caller_access_state` inputs: R82 (a) deleted that function, and every status without access carries an Auth ban.
  - `SEC-X-INT-ADMINPAGE-GUARD-*` call the page and its metadata in-process with a real synthetic session through mocked `next/headers`.
- **Counts:** 228 cases, 65 of them critical. The report `d8-d9-report.json` is written by `d8-d9-report.mjs` (§80, R164).

## Revision 55 amendments (Opus, 2026-10-29, Task 923 Review 62)

The executable route is kickoff §81 (R166–R169). Kickoff §80 stays as history, with its open obligations carried into §81.

- **Cases amended:** `SEC-DB-X-LISTING-CHECKS-ALLOW` / `-DENY` state the test as written and accepted. It inserts through the service role, which bypasses
  row-level security and the guard triggers' session rules, so only the CHECK constraints decide.
- **Sensitivity:** `SEC-X-SRV-RESTRICTED-PAGE-DENY` gets a break of the page's public status list (R167). `SEC-DEL-INT-DENY` switches the moderator key on
  for its case, so the rank rule is reached (R166). The 21 database breaks run through the same harness, started by the owner (R168, D91).
- **Counts:** unchanged, 228 cases with 65 critical.

## Revision 56 amendments (Opus, 2026-10-29, Task 923 Review 63)

The executable route is kickoff §82 (R171–R172). It adds the server cases that the release-blocker rule needs before S59, S60 and S62 can be resolved
(`scripts/workflow-gates/cli.mjs` `release`: a critical server denial and a real-boundary denial among the finding's case IDs).

- **Cases added:**
  - `SEC-X-SRV-VIEW-DENY` (critical, server, unit) for S62: the view route records no view of a pending, inactive or expired listing, takes the
    viewer id from Supabase Auth, and never records the owner's own. Its real-boundary controls are `SEC-DB-S62-DENY` and the new
    `SEC-DB-S62-ALLOW`, with the same invariant.
  - `SEC-DB-S62-ALLOW` (database, integration): the service role records a view through `record_listing_view`.
  - `SEC-X-SRV-PROFILE-PROTECTED-DENY` (critical, server, unit) for S59 and S60: `updateCabinetProfile` writes only the form's seven columns, whatever
    else the browser sends. Its real-boundary controls are `SEC-DB-S59-DENY` and `SEC-DB-S59-ALLOW`, with the same invariant.
- **No product change.** The view route and `record_listing_view` both still count `archived` listings, which the listing page and the table's
  read policy treat as not public. That is an observation for the owner (Review 63, F32), not part of S62, which names pending views.
- **Planned resolution** (Opus, after the review of Revision 56): S59 and S60 by `SEC-X-SRV-PROFILE-PROTECTED-DENY`, `SEC-DB-S59-DENY`,
  `SEC-DB-S59-ALLOW`; S61 by `SEC-D8-SRV-DENY`, `SEC-DB-S61-DENY`, `SEC-DB-S61-ALLOW`; S62 by `SEC-X-SRV-VIEW-DENY`, `SEC-DB-S62-DENY`, `SEC-DB-S62-ALLOW`.
- **Counts:** 231 cases, 67 of them critical; the scope gains the new test file of the view route (596 paths).

## Revision 58 amendments (Opus, 2026-10-29, Task 923 Review 65)

The executable route is kickoff §85 (R175–R176). The owner found that the admin profile shows no city, though the account stores one (F34, an old defect).
The page now passes the stored city and its region to the existing view.

- **Case amended:** `SEC-X-SRV-ADMIN-USER-PRESENT` (server, unit, not critical). The profile receives the row together with its `location`, which is
  built from the two lists the page already reads.
- **Scope:** gains `src/modules/admin/lib/userLocation.ts` and `src/modules/admin/lib/__tests__/userLocation.test.ts`.
- **Counts:** 231 cases, 67 of them critical, 598 paths. The stage goes back to `planned`; S59–S62 stay resolved on this contract.

## Revision 59 amendments (Opus, 2026-10-29, Task 923 Review 66)

The executable route is kickoff §86 (R177–R178). Review 66 accepted Revision 58 and set this contract to `reviewed`. Then the owner found that a city-only
change on the admin profile cannot be saved (F35, an old defect). The container now marks the city change as a change.

- **Cases:** unchanged. The fix is form state, not an access rule. Its proof is the profile smoke test (T12, T12b) and a deliberate break of the new option.
- **Scope:** unchanged. It already holds `src/components/admin/AdminUserProfile.tsx` and its smoke test, so the report goes stale and is run again.
- **Counts:** 231 cases, 67 of them critical, 598 paths. The stage goes back to `planned` and the review binding of `rv66-11` is removed; S59–S62 stay resolved on this contract.

## Out of scope and still planned

- The contact-protection work (Cloudflare Turnstile Invisible for Call / WhatsApp / Message) and the future Chat button have their own contracts; they are not part of this record.
- Product edits made earlier in the same session (findings S1–S58, `Header.tsx`, `Footer.tsx`, `ResetPasswordClient.tsx`) predate this gate and are not covered here; they need their own retrofit by Opus.
