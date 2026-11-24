# Task 1034 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1034_Admin_Inquiries_Show_Their_Replies.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1034_Admin_Inquiries_Show_Their_Replies.md) · OWASP record: [Task_1034.json](../security/owasp/reviews/Task_1034.json)

Review 1 of the working tree on 05ce259b0 (uncommitted) — APPROVED
Scope: `src/modules/contacts/lib/inquiryReplies.ts` (new), the two inquiry pages (the reply block replaced by one call; the now unused `type ReplyRow` import removed and the loader imported, which ESLint's `no-unused-vars` needs), and the two tests of AC1 and AC2: exactly the Fix.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the pages read the stored replies again; a failed read is logged by its code; nothing else changes.

## Checklist V

- V1: `owasp.mjs sync` → exit 0; `check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 1` → success.
- V2: `git diff --stat HEAD` → the two pages (4 insertions, 20 deletions) and three new files; nothing outside the Scope.
- V3: `npm test -- src/modules/contacts/lib/__tests__/inquiryReplies.test.ts src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx` → exit 0, 11 passed
  (reproduces). Break: the loader's select back to `replier:users!replied_by(name)` → exit 1, 1 failed (reproduces); restored. AC2, which the
  executor could not run: `SECURITY_TEST_TARGET=development npx vitest run --config vitest.integration.config.ts src/tests/integration/inquiryReplies.integration.test.ts`
  → exit 0, 2 passed (the loader's read accepted, the old embed `PGRST200`).
- V4: the loader selects `replied_by_name`, filters and orders as the old read, maps to the unchanged `ReplyRow`, logs only `{ code }`, makes no
  query for no ids. The type of `row` is inferred from the untyped admin client, as the old cast was. The Cause is removed.
- V5: `ReplyRow`, `AdminInquiriesManager`, `InquiryDetailDialogView` and their Stories equal `main`; the inquiries query, scope, order and limit unchanged.
- V5a: `localhost:3000` on this tree, signed in as the test administrator (`HYDRATION_ADMIN`, values filled from `.env.local` by a local feed, never
  shown), Ukrainian admin locale: `/admin/inquiries/sales` → the answered inquiry's dialog shows 2 replies signed "shtepiprone", no yellow alert;
  reply card: white, border 1px solid rgb(208,213,221), radius 6px, padding 16px, the name 12px/500. `/admin/inquiries/support` → the dialogs show 2 and 1
  reply, no alert. The component is unchanged, so the card's values are its `main` values; the change is that the stored replies now reach it. Signed out after.
- V6: no exemption added.
- V7: Data exposure, errors, logging — touched (`inquiryReplies.ts`: code-only log, tested); Authorization — not changed (the page guards stay first);
  every other category not touched (`git diff --name-only HEAD` → the two pages).
- V8: AC1 fails without the fix (the break above); AC2 asserts the old embed's `PGRST200` on the real database.
- V9: no Story changed.
- V10: `owasp.mjs review <kickoff> --base main` → 24 sheets of the diff plus 3 more the kickoff names (Input_Validation, Insecure_Direct_Object_Reference_Prevention,
  Prototype_Pollution_Prevention), each with a verdict in `Task_1034.json`; the review then exits 0.

## Open parts of Opus and the owner

- Owner: commit, push and open the pull request; Opus: V14 (`gh pr checks <n>`), then H7.
