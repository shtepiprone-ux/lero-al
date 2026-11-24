# Task 1034 — The admin inquiry pages show the replies staff sent

Sprint 94. Priority P1. Owner report 2026-11-24 (translated): "in the admin I do not see the e-mails, I see only this text:
'The reply history could not be loaded. Replies may exist in the database.'"
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

Every answered inquiry in Admin → Inquiries (sales and support) shows the yellow "reply history could not be loaded"
alert instead of its replies, although the replies are stored (6 replies of 3 inquiries, read 2026-11-24). After the task
both pages load the replies with the name of the staff member who sent each one, and a failed load is logged by its code.

## Cause

Read at `b582094da`
- Both pages read the replies with the embed `replier:users!replied_by(name)` (`src/app/admin/inquiries/sales/page.tsx:40`, `src/app/admin/inquiries/support/page.tsx:40`) and ignore the error of that read (`:38-43`: only `data` is used).
- `contact_inquiry_replies.replied_by` references `auth.users`, not `public.users`: Task 923's account-deletion migration repointed it (`supabase/sql_migrations/task923/db-catalog/proposed-account-deletion.sql:246`) and added the column `replied_by_name`, filled by a trigger, to keep the name when the account goes (`:182`, `:226`).
- So PostgREST cannot resolve the embed: the page's query run with the service role on 2026-11-24 → `PGRST200 Could not find a relationship between 'contact_inquiry_replies' and 'users' in the schema cache`; the same read without the embed → 6 rows, `replied_by_name` set on all 6. The page gets `replies = []`, and the dialog shows the alert for an inquiry with `reply_count > 0` (`src/components/admin/InquiryDetailDialogView.tsx:117-119`).

Fix: one loader for both pages that selects `replied_by_name` instead of the embed and returns the existing `ReplyRow` shape (`replier: { name: replied_by_name }`); a failed read logs its code and returns `[]`, as the page does today.

## Scope

- `src/modules/contacts/lib/inquiryReplies.ts` (new): `loadInquiryReplies(db, inquiryIds)` — `select('id, inquiry_id, body, created_at, replied_by, replied_by_name')`, `.in('inquiry_id', inquiryIds)`, `.order('created_at', { ascending: true })`; maps each row to `ReplyRow` with `replier: row.replied_by_name ? { name: row.replied_by_name } : null`; on an error `console.error('[admin-inquiries] the replies were not loaded', { code })` and `[]`; `[]` without a query for no ids.
- `src/app/admin/inquiries/sales/page.tsx` and `src/app/admin/inquiries/support/page.tsx`: the block at `:36-44` replaced by one call of `loadInquiryReplies(db, inquiryIds)`.
- Dependencies: none.
- Out of scope: `src/modules/contacts/actions/index.ts:249-258` (the reply action reads the name with its own query and works); the type `ContactInquiryReply` in `src/types/database.ts` (not used by these pages); the foreign key itself (Task 923's design).
- Kept as on `main` (checklist A2): the `ReplyRow` type, `AdminInquiriesManager`, `InquiryDetailDialogView` and their Stories unchanged; the inquiries query, its mailbox scope, order and limit unchanged; the alert still shows when replies cannot be loaded.

## Attack surface

Unchanged: the same staff pages (`requireStaffPage` first, `sales/page.tsx:17`) read the same rows with the same service-role client; one column replaces an embed; nothing is written.

## OWASP

- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — both pages keep `requireStaffPage` before the first read (`sales/page.tsx:17`); the loader runs only after it — AC1.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is added or moved by the loader.
- Authorization_Patterns: not applicable — the access rule stays the page guard of `main`.
- Authorization_Regression_Testing: not applicable — no role or page key changes in this task.
- Authorization_Testing_Automation: not applicable — no authorization matrix row changes in this task.
- Cross_Site_Scripting_Prevention: not applicable — the reply body and name render as React text, unchanged.
- DOM_based_XSS_Prevention: not applicable — no new sink; the dialog component is unchanged.
- Input_Validation: not applicable — the loader takes the page's own inquiry ids, no caller input.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the replies belong to the inquiries the guarded page already lists.
- JavaScript_and_TypeScript_Security: not applicable — no merge, regex or dynamic code in the loader.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — a failed load logs the error code only, never a body, name or address — AC1.
- Logging_Vocabulary: not applicable — a load failure of an admin page is not a security event.
- Mass_Assignment: not applicable — the task writes no record at all.
- Nextjs_Security: not applicable — no Server Action or route changes; two server pages read as before.
- Prototype_Pollution_Prevention: not applicable — rows are mapped field by field, no merge.
- React_Security: not applicable — no component changes; the props keep their shape.
- Web_Frontend_Security: not applicable — no HTML sink or script is added.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the Cause is measured on the database, not taken from the old code's comments — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns both tests and their failing runs — AC1, AC2.

## UI

No visible component change: the dialog's replies section renders as its Story `InquiryDetailDialogView` with replies already shows (`src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx:64`); the page now feeds it the stored replies.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The loader returns every reply with its sender's name and never asks for the embed — test: `src/modules/contacts/lib/__tests__/inquiryReplies.test.ts` (new): a database double that answers `PGRST200` to any select containing `!` and rows otherwise → two replies with `replier.name` from `replied_by_name`, a row without a name → `replier: null`; an error → `[]` and one log line with the code only (no body, no address); no ids → no query. Fails against the old embed (`select` with `users!replied_by`).
- AC2 The real database accepts the loader's read — test: `src/tests/integration/inquiryReplies.integration.test.ts` (new, real Supabase development project, CI `authz` job): `loadInquiryReplies(run.admin, [<random uuid>])` → `[]` and no error log; the same read with the old embed → `PGRST200` (the test asserts both, so it fails if the relationship ever changes again).
- AC3 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1, AC2); save the failing output of AC1 against a loader written with the old embed.
3. The loader and the two pages.
4. Run: `npm test -- src/modules/contacts/lib/__tests__/inquiryReplies.test.ts src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx` (AC2 runs in the CI `authz` job). Deliberate break: the loader's select back to the embed → AC1 fails; restore. CI on GitHub only (`gh pr checks <n>`).
5. Report: each command, exit code, relevant output, the break and its result.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1034_Review_1.md)
