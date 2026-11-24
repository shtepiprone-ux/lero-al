# Task 1032 — A sign-up with an address whose account is not confirmed is pinned by the answer Auth really gives

Sprint 94. Priority P3. Owner decision: 2026-11-24 (Task 991 Review 2, note N1), "a separate task 1032" (translated).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

Task 991 had to measure what a sign-up answers for an address whose account exists but is not confirmed; the measurement
on 2026-11-24 used an undeliverable synthetic address, got a 500 and pinned that 500 in a test as the answer of this case.
Measured again on 2026-11-24 with a deliverable address: Auth sends the confirmation mail again and the page says "Check
your email", which the code already does. After the task the test states that measured answer instead of the 500.

## Cause

Read at `371081efd`
- `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts:348-358` pins `unexpected_failure` 500 as the answer for "an address whose account is not confirmed yet".
- That 500 came from the Auth e-mail hook, not from the unconfirmed state: Auth log 2026-11-24 13:03:37 UTC, `/signup` of `zz_synth_…_unconfirmed@example.com`, `user_confirmation_requested` → `"error":"500: Unexpected status code returned from hook: 500"`; the hook answers 500 when the mail is not delivered (`src/app/api/auth-email-hook/route.ts:356-360`).
- Measured 2026-11-24 by Opus with a deliverable address (`delivered+…@resend.dev`, Resend's test sink): an unconfirmed account created through the Auth admin API (no mail), then a sign-up of the same address on `localhost:3000` → the sheet "Check your email"; `auth.users.confirmation_sent_at` 17:48:01 UTC; Resend → "Konfirmoni adresën tuaj të emailit", `delivered`; no `account_notice_mail` row for the address, so the action did not take the `identities` empty branch (`src/modules/auth/actions/captcha.ts:96-97`). The synthetic account was deleted (0 rows left).

Fix: replace the test case at `:348-358` with the measured answer: Auth answers no error and a user with an identity (the confirmation is sent again by Auth), the action answers `{ ok: true }`, schedules no `after()` work, looks nothing up and sends no notice.

## Scope

- `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`: the one case at `:348-358`, replaced.
- Dependencies: none.
- Out of scope: product code (`captcha.ts` already gives the measured answer); the e-mail hook's 500 for an undeliverable address (the page shows `error_generic`, as for any refused sign-up).
- Kept as on `main` (checklist A2): every other case of the file unchanged; `captcha.ts` unchanged.

## Attack surface

Unchanged: one test case; no entry point, data flow or control changes.

## OWASP

- Abuse_Case: not applicable — one test case changes; no abuse path is added or removed.
- Authentication: "Using any of the authentication mechanisms (login, password reset, or password recovery), an application must respond with a generic error message regardless of whether:" — the replaced case asserts the neutral `{ ok: true }` for an unconfirmed address, the same answer as for a new and an existing one — AC1.
- Authentication_Patterns: not applicable — Auth stays the only sign-up mechanism; nothing changes in it.
- Authorization: not applicable — sign-up is anonymous and no permission check changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision exists in the changed test.
- Authorization_Patterns: not applicable — no access rule moves between layers in this task.
- Authorization_Regression_Testing: not applicable — no role or permission rule is touched here.
- Authorization_Testing_Automation: not applicable — no authorization matrix row changes in this task.
- Bot_Management_and_Anti-Automation: not applicable — the CAPTCHA and the notice limit stay unchanged in the code.
- Cookie_Theft_Mitigation: not applicable — sign-up sets no session cookie for an unconfirmed address.
- Credential_Stuffing_Prevention: not applicable — the sign-in path and its CAPTCHA are not touched.
- Denial_of_Service: not applicable — no resource use changes; one test case only.
- Input_Validation: not applicable — no input handling changes in the product code.
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object is looked up by caller input here.
- JavaScript_and_TypeScript_Security: not applicable — test code only; no merge, regex or sink added.
- Mass_Assignment: not applicable — no record is written from caller fields in this task.
- Multifactor_Authentication: not applicable — the factors of sign-in are unchanged by this task.
- Nextjs_Security: not applicable — the Server Action itself is unchanged; only its test changes.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys here.
- Session_Management: not applicable — no session is created, renewed or ended by the case.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the test states only what was measured on 2026-11-24, cited in "## Cause" — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the test and its failing run against a product change — AC1.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A sign-up of an address whose account is not confirmed answers `{ ok: true }` with no lookup, no `after()` work and no notice mail — test: `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` (the replaced case: `signUp` resolves `{ data: { user: { id, identities: [{ id }] }, session: null }, error: null }`); it fails when `captcha.ts:97` schedules the notice for every answered user (deliberate break, restored).
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Work on the branch the owner created from `main` (checklist H1); the uncommitted archive of Task 991, the rule H3 and the backlog rows of 1033 and 1034 land in its first commit (Opus's, not touched by the executor).
2. Replace the case at `:348-358` as the Fix says; the test's comment cites the measurement of "## Cause".
3. Run: `npm test -- src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`. Deliberate break: in `captcha.ts:97` drop the `identities.length === 0` condition → the new case fails; restore. CI on GitHub only (`gh pr checks <n>`).
4. Report: each command, exit code, relevant output, the break and its result.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1032_Review_1.md)
