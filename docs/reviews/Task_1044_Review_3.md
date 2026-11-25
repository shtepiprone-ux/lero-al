# Task 1044 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md) · OWASP record: [Task_1044.json](../security/owasp/reviews/Task_1044.json) · Previous: [Review 2](Task_1044_Review_2.md)

Review 3 of Revision 2 (working tree on 42651b8ad, the owner's commit of the Review 2 tree) — APPROVED WITH NOTES
Scope: `supabase/catalog.json`, the only file of Revision 2 (a Scope line, `Sprint_94_kickoff_prompt_Task_1044_…md:62`); and V5a (1), the two admin pages, BLOCKED in Review 2.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `db-catalog-audit.mjs --save <scratchpad>` → exit 0, "no finding"; `cmp` of that snapshot with `supabase/catalog.json` → equal; `check-files.mjs supabase/catalog.json` → exit 0; the two admin pages in the owner's Chrome (below).
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the committed snapshot is the live database byte for byte; the pages read the new columns without error and show the form inquiries as on `main`. What stays open is the plan's live check after the merge (the Worker, Cloudflare routing, Resend's `message_id`).

## Checklist V

- V1: as above; `main` green (45647444776).
- V2: `git diff --numstat 42651b8ad` → `supabase/catalog.json` 113+/1−, plus Opus's documents; nothing else.
- V3: the report reproduced: the live snapshot saved here equals the committed file (`cmp`), and is the same snapshot Review 2 compared object by object: Task 1044 +7 columns and +3 checks, Task 991 +2 functions, Task 1038 the `listing_images_url_prefix_check` with `https://media.lero.al/` (1 removed, 1 added). One statement of the report is wrong and changes nothing: `db-types-drift.mjs` is called "the CI gate"; no workflow runs it (`grep db-types-drift .github/workflows/*.yml` → nothing; Task 978 adds it). It reports 42 differences, as on `main` (N4).
- V4: read the whole diff of `supabase/catalog.json`.
- V5: no behaviour change; the snapshot is read only by `db-types-drift.mjs` (`grep -rl catalog.json src scripts .github`: that tool, and a comment in `listingImageOwner.integration.test.ts:19`).
- V5a: (1) owner's Chrome (Claude in Chrome), session as admin, `http://localhost:3000`, window 1920 px, uk. `/admin/inquiries/support`: 3 inquiries, the list renders; the dialog of "Технічна підтримка" (3 staff replies) centred 650–1270, 3 reply `Paper`s radius 6px, 1px rgb(208, 213, 221), padding 16px, names 12px/500 rgb(0, 0, 0) — equal to the `WithReplies` and `EmailThread` Stories (Review 2 V5a); no badge (no inbound row exists yet), no text outside the dialog, no horizontal overflow, no console error. `/admin/inquiries/sales`: 2 inquiries; the dialog of "Продажі" (2 replies) with the same `Paper` values, no badge, nothing outside, no console error. (2) unchanged since Review 2 (no file of the View, Story or fixtures changed).
- V6: no exemption in the diff.
- V7: no code changes; every category keeps its Review 1 answer. Data: `db-catalog-audit.mjs` → "no finding".
- V8: R2-1 has no product change to undo; its check is the `cmp` with the live catalog (V3). The ACs keep the breaks of Reviews 1 and 2. AC10: CI, after the push.
- V9: the Stories list of Review 2 stands.
- V10: `owasp.mjs review <kickoff>` → exit 0 (record unchanged since Review 2).

## Notes (no change asked)

- N1 (Review 1) stands: whether Resend returns `message_id` at once is checked in the plan's live verification.
- N4 (Review 2): `InquiryAttachment` in `NOT_TABLE_TYPES` is Task 978's (backlog row).
- N5: the inbound row (badge, address, attachment names) is seen on the real pages only once a mail arrives through the Worker; until then the Stories `EmailThread` and `LongAttachmentName` are its evidence.

## V14 — pull request #77

- `Secret scan (gitleaks)` failed (run 45674212779): `generic-api-key` at `cloudflare/email-inbound/worker.test.ts:14` in commit 4faf138ba, the synthetic marker of the Worker test's bearer value (no real secret). The scan reads every commit of the pull request, so a later commit cannot clear it, and a force push is not allowed (account rules §2). Owner decision 2026-11-25 (translated): "New branch + PR": the marker becomes `'S'.repeat(48)`, as in `route.security.test.ts:18`, and the log check names `ENV.INBOUND_EMAIL_SECRET` (the test: 10 of 10, ESLint 0); the tree goes to `task/1044-inbound-mail-2` from c126db3e4 as one squashed commit, and #77 is closed. A diff search for other key-like literals found none.
- `Lint, types and product checks` failed: `scripts/quality/db-types-drift.test.mjs:97` "InquiryAttachment is not classified". V3 and N4 of Reviews 2 and 3 were wrong: no workflow runs the drift tool itself, but this test of the tool reads `src/types/database.ts` in the `quality` job. Fixed here: `InquiryAttachment` joins `NOT_TABLE_TYPES` (`scripts/quality/db-types-drift.mjs:77`); the test file → 9 passed; the tool on `supabase/catalog.json` → 41 differences (42 before); the hand-off line in the Task 978 backlog row is removed.
- `CodeQL` failed with one high alert, "Bad HTML filtering regexp" at `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts:343` (the AC7 assertion did not match an upper-case `<SCRIPT>`). Fixed: the pattern is case-insensitive; the file → 47 passed. ESLint on the three changed files → exit 0.
- `Unit and component tests`: 447 files and 7766 tests passed; the changed-line coverage step failed: line 26 of `src/app/admin/inquiries/support/page.tsx` and of `sales/page.tsx` (the select with `source, attachments`) runs in no test. Fixed: `src/app/admin/inquiries/__tests__/inquiryPagesRead.test.tsx` (new) runs both real pages with doubles for the guard, locale, translations, admin client and replies loader, and asserts the select string, the mailbox filter and the props handed to `AdminInquiriesManager` → 2 passed; `changed-lines-coverage.mjs --base main` on its coverage → both pages 1/1; typecheck and ESLint → exit 0.

## Open parts

- Owner: commit, push, pull request (Checklist H); V14 `gh pr checks <n>`.
- After the merge: the plan's Worker, Cloudflare and live verification (Route step 0).
