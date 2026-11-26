# Task 1044 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md) · OWASP record: [Task_1044.json](../security/owasp/reviews/Task_1044.json)

Review 1 of the working tree on c126db3e4 (first implementation, uncommitted) — NEEDS REVISION
Scope: the 21 changed and 12 new files of the executor's report against c126db3e4: `POST /api/email/inbound`, `src/modules/contacts/lib/inboundEmail.ts`, `cloudflare/email-inbound/worker.js`, `submitContactInquiry` and `sendInquiryReply`, `send.ts` (`headers`, `getSentMessageId`), `contactInquiry.ts`, the replies loader, the two admin inquiry pages, `AdminInquiriesManager.tsx`, `InquiryDetailDialogView.tsx`, `database.ts`, `supabase/sql_migrations/task1044/`, the Story and fixtures, the four message files, `docs/env.md`, `package.json` and the lockfile. Every file is in the kickoff's Scope.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45647444776 success; the Route's 107 unit files → exit 1, 106 passed, 1 failed (3 tests, F2); `inquiryReplies.test.ts` (found by import) → exit 1, 1 failed (F2); `npm run typecheck` → exit 0; ESLint on the 22 changed and new code files → exit 0; 14 breaks and 3 reverts to `main` → each exit 1, every file restored (md5 OK); `db-catalog-audit.mjs` → exit 0; H4 on the SQL (below); Storybook measurement (below).
Findings: Critical 0, High 0, Medium 1 (F2), Low 2 (F1, F3)
Overall risk: the server side holds: the secret before the body, the recipient, the duplicate check and the unique index, the three proofs of a join, the limits, the text-only body and the write before 200 all fail their tests when removed. Open: a long sender address breaks the 320 px row; two tests outside the Scope keep CI red; the census rows of the two new overlay Stories are missing.

## Checklist V

- V1: as above; `main` green.
- V2: `git diff --stat HEAD` → 21 files, 449+/67−; 12 new files (1236 lines). Each file is a Scope line or a test named by an AC; `supabase/catalog.json` is not changed (I10 BLOCKED until the apply).
- V3: every claim reproduced: 106 of 107 Route files, the same 3 failures in `src/modules/__tests__/rls-write-guards.smoke.test.ts` (`base.eq is not a function` ×2, and the positive case expects the removed notification); `inquiryReplies.test.ts:54` fails on the select string; typecheck and ESLint exit 0; the 14 breaks fail with the same counts (B1 1, B2 4, B3a 1, B3b 3, B3c 2, B4 2, B5 5, B6 4, B7a 12, B7b 3, B8 1, B9 1, B10 1, B11 9). The report's "109 files" is 107 (`wc -w` of the Route's list); its results are those of 107. The import search over `src` and `cloudflare` found no other test outside the Route than `inquiryReplies.test.ts` and `inquiryReplies.integration.test.ts` (the latter is in the Route's integration command).
- V4: read every changed and new file once, tests included; the SQL read in full (below).
- V5: form: the notification and its two error answers leave (O1044-1, Task 1045 AC6, owner 2026-11-25); validation, limit numbers, save, `save_failed`, `no_mailbox` unchanged. Staff reply: sender, Reply-To, body, writes and errors unchanged; a form inquiry keeps the template subject (`contacts.security.test.ts` "a thread with no stored id"). Dialog: staff rows, sections, order, labels, composer and footer unchanged (`git show main:src/components/admin/InquiryDetailDialogView.tsx`). Deploy order: the pages, the loader and `sendInquiryReply` read the new columns, so `task1044.sql` precedes the deploy (Route step 0).
- V5a: Stories `Patterns/Mantine/InquiryDetailDialogView` New, WithReplies, RepliesLoadFailed, EmailThread, LongAttachmentName, Sending at 320, 639, 640, 1024, 1440 px; EmailThread, LongAttachmentName and WithReplies in sq, en, uk, it (75 renders, Playwright on the owner's Storybook :6006, no console error). Dialog: bottom sheet 0–w below 640, centred 32–608 / 202–822 / 410–1030 from 640; no horizontal overflow, no clipped box. Badge 24 px, 12px/500, #fff on rgb(52, 64, 84), radius 9999px, padding 2px 8px — equal to the neutral badges ("Inactive", "Archived") of `Mantine/Primitives/Badge` Statuses. Reply `Paper`: radius 6px, 1px rgb(208, 213, 221), padding 16px in EmailThread and in WithReplies (the `main` Story) alike. Address 12px/500 rgb(0, 0, 0), as the staff name. Attachment title 12px/500; file lines 14px/400, `overflow-wrap: break-word`; the 200-character name 6 lines at 320 px, 3 lines from 639 px, not clipped. A long sender address (F1): at 320 px the address line ends at x 415 while its `Paper` ends at 298. Pages `/admin/inquiries/support` and `/sales`: BLOCKED: `task1044.sql` is not applied, and both pages select `source, attachments`. No interactive change (no new control), so no Firefox check.
- V6: no `eslint-disable`, `skip`, `only`, `ts-` directive, allowlist or baseline in the diff.
- V7: below.
- V8: each AC with its change undone once, restored byte for byte: AC1 B1 and B11; AC2 B2; AC3 B3a–B3c; AC4 B4; AC5 B5; AC6 the action reverted to `main` → 8 failed of 89 (with B9); AC7 the View reverted to `main` → 3 failed of 4 (with B8); AC8 B6 and B10; AC11 `send.ts` reverted to `main` → 22 failed of 57 (with B7a, B7b). AC9 BLOCKED: `task1044.sql` not applied. AC10: CI, after the push.
- V9: below.
- V10: `owasp.mjs review <kickoff> --base main` → exit 0; the record lists every sheet of the kickoff and the eight more the diff triggers.
- H4: `task1044-preflight.sql` read-only, LF and CRLF → rows 1–4 problems 0; `task1044-verify.sql` before the apply → `42703 column r.direction does not exist` (row 7 reads the new column: expected before the apply); `db-sql-roundtrip.mjs task1044.sql task1044-rollback.sql`, LF and CRLF → "the rollback restores the catalog (22 catalog row(s) changed by the change file)", exit 0. md5: preflight `11ff522eaf5112351772b31c1a434783`, apply `e52aa466047cb5abc6464de2e3e278a5`, verify `c59d8bfd52d30a192bb5a90f1887881e`, rollback `9336d2399bda31f8b6c396387c2ec8f0`.

## V7 — secure code review

Six steps: no existing control weakened (the form keeps its limit, now over form rows only; `sendEmail` refuses a bad header and sends every other call byte-identical, `send.security.test.ts` "a call without headers"); new entry point `POST /api/email/inbound` (audience: the Cloudflare Email Worker by its shared secret) and a new outside component (the Worker); new outbound call `emails.get` to Resend; trust boundaries Cloudflare → Worker → route → database (service role), stranger text → staff dialog; new package `postal-mime@4.2.1` (lockfile: this package only; `resend` keeps its nested 2.7.4); no test deleted without the kickoff's reason (AC6 removes the notification), two tests outside the Scope fail (F2).
- Authorization: touched — the bearer in constant time before the body (`route.ts:42`), fail closed without the secret (`:41`), recipient allowlist (`:47-48`); a join needs a stored id, the inquiry's own address and the topmost `mx.cloudflare.net` `dmarc=pass` (`inboundEmail.ts:92-98`, `:160-176`, `:216`); grants and policies unchanged (`task1044.sql`; `db-catalog-audit.mjs` exit 0).
- Input and output: touched — named fields only (`inboundEmail.ts:223-253`); header values as 1–20 bounded tokens (`send.ts:33-39`, `:103-113`); text only in the dialog (`InquiryDetailDialogView.tsx:47-56`, `:146-157`). `.in('message_id', ids)` with ids holding `"`, `,`, `\` or `()`: read-only probe through supabase-js on the development project (2026-11-25) → no error for any; postgrest-js quotes `,()` and escapes nothing, so such an id may not match and the mail opens a new inquiry: the kickoff's "anything less → a new inquiry", never a 500 and never a wrong join (the sender and `dmarc=pass` still decide).
- Authentication and sessions: not touched (`git diff --name-only` has no auth file).
- Requests and redirects: touched — a machine route with a bearer, no cookie, no `Origin` (the Worker sends none); no redirect; the Worker never follows one (`worker.js:26`); idempotent by the unique `message_id`.
- Next.js entry points: touched — `route.ts` `POST` only; `inboundEmail.ts:1` `server-only`; no cache. The request proxy's matcher includes `/api/email/inbound` (session refresh only, no locale, `src/proxy.ts:53`, `:102`), as for every other non-cron API route.
- Business logic: touched — 5 per sender per hour, 100 per 24 hours (`inboundEmail.ts:144-158`); a duplicate racing the pre-check is caught by the index (`[SEC-1044-DUPLICATE-INDEX]`); status `new` before the answer row.
- JavaScript and TypeScript: touched — every pattern anchored and bounded, input cut first (`inboundEmail.ts:55`, `:110`; `send.ts:36-37`).
- Data exposure, errors, logging: touched — outcomes and codes only (`inboundEmail.ts:64-72`; `route.ts:57`; `worker.js:32`); 500 carries no error text (`[SEC-1044-ROUTE-WRITE]`).
- Files: touched — attachment content is never kept; name, size and declared type only, as text.
- Dependencies and configuration: touched — `postal-mime@4.2.1` exact, MIT-0, no dependency, `prepare` not run (`.npmrc` `ignore-scripts=true`).
- Agent and tool output: `check-files` runs in CI and in the owner's pre-commit hook.
- Tests: touched — F2; every security test fails with its control removed (V3, V8).

## Findings

F1 — A long sender address breaks out of its row at 320 px
Severity: Low      Category: UI (U7, the kickoff's mobile record)      CWE: —
Location: src/components/admin/InquiryDetailDialogView.tsx:147-150
Description: the address `Text` is a flex item of the inner `Group`; a flex item's minimum width is its longest unbreakable run, which `overflow-wrap: break-word` does not shorten, so a long address does not wrap inside the row.
Impact: below 640 px the end of a long customer address leaves its `Paper` and is cut by the sheet; the kickoff requires "file names and addresses wrap at any point; no clipping".
Reproduction: Story EmailThread at 320 px, the address text set to `ardit.leka.customer.with.a.very.long.mailbox.name@subdomain.of-a-long-example-domain.com` in the page → address line x 33..415, its `Paper` ends at 298 (at 640 px it fits: 65..569 within 586).
Recommendation: the address wraps inside its row at every width with no `style`, `className` or size literal (U3): render it as its own block `Text size="xs" fw={500}` line under the header row of the inbound `Paper` (badge and date stay in the header `Group`), so `break-word` breaks it; the Story `LongAttachmentName` also shows an inbound answer whose `from_email` is a long address, and I8a measures it at 320, 639, 640, 1440 px in sq, en, uk, it.
References: kickoff "## Mobile adaptation record" (Required-content treatment); `.claude/rules/checklists/ui.md` U3, U7.
Status: open

F2 — Two tests outside the Scope fail on the change the Scope requires
Severity: Medium      Category: Tests      CWE: —
Location: src/modules/__tests__/rls-write-guards.smoke.test.ts:113, :125-141; src/modules/contacts/lib/__tests__/inquiryReplies.test.ts:45-54
Description: the smoke test's mock offers one `.eq()` before `.gte()`, while `isRateLimited` now chains `.eq('source', 'form')` first; its positive case expects the staff notification AC6 removes. `inquiryReplies.test.ts` pins the old select string and the old mapped row. The kickoff listed the first in its Route and neither in its Scope (the design's miss).
Impact: `Unit and component tests` fails in CI (AC10).
Reproduction: the Route's run → `rls-write-guards.smoke.test.ts` 3 failed (`TypeError: base.eq is not a function`; `expected "spy" to be called`); `npm test -- src/modules/contacts/lib/__tests__/inquiryReplies.test.ts` → 1 failed.
Recommendation: owner decision 2026-11-25 (this review): Revision 1 adds both files to the Scope. The smoke mock supports the chain `.select().eq('source', 'form').eq('requester_ip', …)|.is(…).gte(…)`; the positive case asserts `{}`, the insert with `source: 'form'` and that no notification is sent; every other assertion stays. `inquiryReplies.test.ts` expects the new select string and the three new fields on each mapped row; nothing else changes (A9).
References: `.claude/rules/quality-gates.md` §5; `secure-code-review.md` §3 Tests.
Status: open

F3 — The two new overlay Stories have no census rows
Severity: Low      Category: UI (U8)      CWE: —
Location: scripts/rendered-interaction-states.json (rows `patterns-mantine-inquirydetaildialogview--*`, at line 6584)
Description: `EmailThread` and `LongAttachmentName` open the `MantineModal` on mount, and U8 asks for their rows; the kickoff's Scope does not name the file (the design's miss). The reported conflict with the census "word split" rule does not hold: segments split after a hyphen (`scripts/rendered-state-census/in-page.mjs:85`), the fixture's 200-character name is hyphenated, and an address is the documented exception (`:367-369`).
Impact: the census registry misses two states; the census is not yet a CI step (`.github/workflows/` has none), so no job fails today.
Reproduction: `grep -n "inquirydetaildialogview" scripts/rendered-interaction-states.json` → new, replies-load-failed, sending, with-replies only.
Recommendation: owner decision 2026-11-25 (this review): Revision 1 adds the file to the Scope; two rows `patterns-mantine-inquirydetaildialogview--email-thread` and `--long-attachment-name`, the same fields as the `--with-replies` row (`open` mount, `portals` 1, `focus` trap, `dismiss` [], the same `reason`).
References: `.claude/rules/checklists/ui.md` U8; `.claude/rules/shared/rendered-state-census.md`.
Status: open

## Notes (no change asked)

- N1: `getSentMessageId` reads the id right after the send; whether Resend returns `message_id` at once is UNKNOWN until the plan's live check. Without it the reply's `message_id` stays null and a customer's answer to that reply opens a new inquiry (safe by the kickoff's rule).
- N2: `resend@6.12.3` does not declare `message_id` in the `emails.get` answer; it is read through a cast and kept only when it matches the token pattern (`send.ts:167-168`, `[SEC-1044-SENT-ID]`).
- N3: an answer joined to its inquiry does not raise `reply_count` (the action raises it for staff replies only); the kickoff names no count for inbound rows.

## V9 — Stories for the owner

`Patterns/Mantine/InquiryDetailDialogView`: New, WithReplies, RepliesLoadFailed, Sending (unchanged states), EmailThread (an e-mail inquiry with two attachment names, a staff reply and the customer's answer with its badge, address and one attachment name), LongAttachmentName (a 200-character file name). Measurements in V5a.

## Revision 1 (for the implementer)

Owner decision 2026-11-25 (this review, translated): "Yes, add the 3 files": Revision 1 may change `src/modules/__tests__/rls-write-guards.smoke.test.ts`, `src/modules/contacts/lib/__tests__/inquiryReplies.test.ts` and `scripts/rendered-interaction-states.json` in addition to the Scope.

- R1-1 (F1): `InquiryDetailDialogView.tsx` as in F1's Recommendation; `admin.fixtures.ts` and the Story: `LongAttachmentName` gets an inbound answer whose `from_email` is a long address; `InquiryDetailDialogView.inbound.test.tsx` asserts the address is rendered outside the header `Group` of its row (fails on the current code); I8a measures the address line inside its `Paper` at 320, 639, 640, 1440 px in sq, en, uk, it.
- R1-2 (F2): the two test files as in F2's Recommendation; both green; the Route's run → exit 0.
- R1-3 (F3): the two registry rows as in F3's Recommendation.
- AC9 after the owner applies `task1044.sql`: `npm run test:security-integration -- src/tests/integration/inboundEmail.integration.test.ts src/tests/integration/inquiryReplies.integration.test.ts`, `node scripts/quality/db-catalog-audit.mjs`, then `--save supabase/catalog.json` (I10).

## Open parts

- Owner: apply `task1044.sql` (preflight, apply, verify; md5 as in H4), before R1 runs AC9.
- Review 2: F1–F3; AC9; the admin pages on the owner's Chrome after the apply (V5a).
