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

## Open parts

- Owner: commit, push, pull request (Checklist H); V14 `gh pr checks <n>`.
- After the merge: the plan's Worker, Cloudflare and live verification (Route step 0).
