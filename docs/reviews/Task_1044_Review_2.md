# Task 1044 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md) · OWASP record: [Task_1044.json](../security/owasp/reviews/Task_1044.json) · Previous: [Review 1](Task_1044_Review_1.md)

Review 2 of Revision 1 (working tree on 4faf138ba, the owner's commit of the Review 1 tree) — NEEDS REVISION
Scope: the 7 files of Revision 1 against 4faf138ba: `InquiryDetailDialogView.tsx`, its inbound test, `admin.fixtures.ts`, the Story, `rls-write-guards.smoke.test.ts`, `inquiryReplies.test.ts`, `scripts/rendered-interaction-states.json`. Every file is a Scope line or one of the three files the owner added on 2026-11-25 (Review 1).
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45647444776 success; the Route's 107 unit files plus `inquiryReplies.test.ts` → exit 0, 108 files, 2073 tests; `npm run typecheck` → exit 0; ESLint on the 6 changed code files → exit 0; AC9 integration (both files) → exit 0, 4 of 4; one database break and one revert to 4faf138ba → each exit 1, restored (catalog fingerprint and md5 equal); `task1044-verify.sql` → rows 1–7 `ok`; `db-catalog-audit.mjs` → exit 0; `check-files.mjs --worktree` → exit 0; Storybook measurement (below).
Findings: Critical 0, High 0, Medium 0, Low 1 (F4)
Overall risk: F1–F3 are fixed and each fix fails its test when undone; AC9 holds on the real database. Open: the committed catalog snapshot was not re-saved after the apply (a Scope line), and the two admin pages are not yet seen in the owner's Chrome.

## Checklist V

- V1: as above; `main` green.
- V2: `git diff --stat 4faf138ba` → 7 files, 75+/15−, no new file; all inside the Scope as widened by the owner (Review 1). `supabase/catalog.json` unchanged (F4).
- V3: every claim of the Revision 1 report reproduced: the Route run (108 files, exit 0), typecheck 0, ESLint 0, the R1-1 test red on the old View. AC9, BLOCKED in the report for want of `SECURITY_TEST_TARGET` and `SECURITY_TEST_PROJECT_REF`, ran here with both set in the process environment (`src/tests/integration/environment.ts:49-56` reads them only there; the ref equals the host of `NEXT_PUBLIC_SUPABASE_URL`; D91): 2 files, 4 tests, exit 0. The import search over `src` found no test of the changed View or fixtures outside the Route.
- V4: read the whole Revision 1 diff once.
- V5: the dialog's staff rows, header, sections and composer unchanged; the inbound row keeps its badge and date in the header and moves the address to its own line under it (the decision of Review 1 F1). The form's positive case now asserts the notification is gone (O1044-1); the loader's select string adds `direction, from_email, attachments` (the Scope's columns).
- V5a: (2) Stories `Patterns/Mantine/InquiryDetailDialogView` New, WithReplies, RepliesLoadFailed, EmailThread, LongAttachmentName, Sending at 320, 639, 640, 1024, 1440 px; EmailThread, LongAttachmentName and WithReplies in sq, en, uk, it (75 renders, Chrome DevTools on the owner's Storybook :6006, each width as an iframe of that width). No horizontal overflow, no text box outside its `Paper` or the dialog. Dialog 0–w below 640, centred 32–608 / 202–822 / 410–1030 from 640. The long sender address (F1) in LongAttachmentName: x 33–281 inside its `Paper` 16–298 at 320 px (3 lines), 33–600 in 16–617 at 639 (1 line), 65–569 in 48–586 at 640 (2 lines), 1 line at 1024 and 1440; 12px/500 rgb(0, 0, 0), as before and as the staff name. EmailThread address 1 line at every width. Badge 24 px, 12px/500, #fff on rgb(52, 64, 84), radius 9999px, padding 2px 8px; reply `Paper` radius 6px, 1px rgb(208, 213, 221), padding 16px — equal to Review 1. (1) Pages `/admin/inquiries/support` and `/admin/inquiries/sales`: BLOCKED: the Claude in Chrome extension is not connected ("Browser extension is not connected", 2026-11-25), so the owner's session cannot be opened; the SQL they need is applied. No interactive change, so no Firefox check.
- V6: two registry rows added to `scripts/rendered-interaction-states.json`, equal in every field to the four rows of the same Story file. Each value observed on the built Storybook: one portal, focus inside the dialog, `aria-modal="true"`, and Escape leaves the dialog open (the no-op `onClose` the reason names). The census itself runs in CI only (A5); its result is read at V14.
- V7: below.
- V8: R1-1: the View reverted to 4faf138ba → the new test fails (1 of 5), restored (md5 equal) → 5 of 5. AC9: `contact_inquiry_replies_inbound_no_staff_check` dropped on the development project → `[SEC-1044-DB-CHECKS]` fails (`expected undefined to be '23514'`), the check re-added exactly as `task1044.sql` writes it, catalog fingerprint before and after equal (`0a07c216…8612`), `task1044-verify.sql` rows 1–7 `ok`. R1-2 changes only tests (their run is V3). AC10: CI, after the push.
- V9: below.
- V10: `owasp.mjs review <kickoff>` → exit 0 after one verdict was added: `OS_Command_Injection_Defense` not applicable (triggered by the `scripts/` path of the census registry, a JSON file; no file of the diff starts a process).

## V7 — secure code review

Revision 1 adds no input path, query, permission, secret or dependency: one JSX line moves, the rest are tests, fixtures and two registry rows. Every category of `secure-code-review.md` §3 keeps its Review 1 answer; the address line still renders `r.from_email` as a React text node (`InquiryDetailDialogView.tsx:153`), never as HTML.

## Findings

### F4 — Low — the catalog snapshot is not re-saved after the apply

- Where: `supabase/catalog.json` (unchanged); the kickoff's Scope (`Sprint_94_kickoff_prompt_Task_1044_…md:62`) and Route step 3 (`:241`) name `db-catalog-audit.mjs --save supabase/catalog.json` after the owner's apply.
- Fact: the owner applied `task1044.sql` on 2026-11-25. A snapshot of the live catalog (saved to the scratchpad) differs from the committed one by the 7 new columns and 3 new checks of this task, and by 3 rows of earlier tasks: the functions `account_status_by_email` and `auth_password_matches` (Task 991) and the wider `listing_images_url_prefix_check` (Task 1038). The executor left the save to Opus because of those 3 rows.
- Decision (Opus, this review): save it. The snapshot records the live database, and those 3 rows are live; leaving them out keeps the file wrong for every later reader (`db-types-drift.mjs`, Task 978). The pull request names them as rows of Tasks 991 and 1038.
- Recommendation: R2-1.

## Notes (no change asked)

- N4: `db-types-drift.mjs` on the live catalog lists 42 differences, as on `main` (42): Task 1044 removes one (`ContactInquiryReply.replied_by` now admits null) and adds one (`InquiryAttachment`, an exported interface that is not a table row). Handed to Task 978 (its backlog line, 2026-11-25), which makes the tool exit 0 and puts it in CI.
- N1–N3 of Review 1 stand.

## V9 — Stories for the owner

`Patterns/Mantine/InquiryDetailDialogView`: New, WithReplies, RepliesLoadFailed, Sending (unchanged), EmailThread (an e-mail inquiry, a staff reply and the customer's answer: badge and date on top, the address on its own line, one attachment name), LongAttachmentName (a 200-character file name and the customer's answer from a long address that wraps inside its row). Measurements in V5a.

## Revision 2 (for the implementer)

- R2-1 (F4): `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json` → exit 0, "no finding"; the report lists the rows it adds and removes, the 3 of Tasks 991 and 1038 named as such. No other file changes.

## Open parts

- Review 3: R2-1; V5a (1), the two admin pages in the owner's Chrome with the extension connected.
- After the push: V14 (`gh pr checks <n>`, the census among them); N1, Resend's `message_id`, in the plan's live check.
