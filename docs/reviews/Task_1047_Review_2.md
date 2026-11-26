# Task 1047 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_1047_Received_Attachments_Open_From_The_Admin.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1047_Received_Attachments_Open_From_The_Admin.md) · OWASP record: [Task_1047.json](../security/owasp/reviews/Task_1047.json)

Review 2 of the working tree on d23137521 — APPROVED
Scope: diff-based, Revision 1 only; `git diff --stat d23137521` → 9 files (49+, 10−), no new file: `src/modules/contacts/lib/inboundEmail.ts` (`cut`, used by `oneLine` and `bodyText`), `src/components/admin/InquiryDetailDialogView.tsx:62` (the unnamed file's link text), `messages/{sq,en,uk,it}.json` (`admin.inquiries.attachment_unnamed`), `src/stories/fixtures/admin.fixtures.ts` (a fourth stored file without a name) and the two changed test files.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45768402600 green; `npm test --` the Route's 85 files → 1722 passed, exit 0; the 21 further test files that read `messages/*.json` → 374 passed, exit 0; `node --test scripts/quality/check-files.test.mjs` → 32 passed; `npm run typecheck` → exit 0; ESLint on the 5 changed code files → exit 0; failing-first (R1-1, R1-2) → each exit 1; two breaks → each exit 1, restored with sha256 equal; Storybook 40 renders measured; `owasp.mjs review --base main` → exit 0. CI of the pull request: UNKNOWN until the push (V14).
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: both Review 1 findings are removed with a test that fails without the fix; the change touches no other line of the mail path, the route or the dialog.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "140 sheets at 05861f28ed88; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45768402600 success (Task 1046, #79), the latest `main` run.
- V2: `git diff --stat d23137521` → the 9 files above; `git ls-files --others --exclude-standard` → none. Every file is named by the kickoff's "## Revision 1" (R1-1: the dialog, the four message files, the fixture, the dialog test; R1-2: `inboundEmail.ts`, its test). The one hunk beyond the Revision's wording, the fixture's comment (`admin.fixtures.ts:778`), names the fourth file the same hunk adds, so the comment stays true; kept.
- V3: every claim of the executor's report reproduced:
  - The Route's 85 files (`npm test --`) → 85 passed, 1722 tests, exit 0, the report's numbers.
  - Import search over the whole tree (`grep -rlE` over `src` and `scripts` for `inboundEmail`, `InquiryDetailDialogView`, `admin.fixtures`, `messages/`) → outside the Route `scripts/quality/check-files.test.mjs` (reads `messages/en.json`) and `scripts/__tests__/check-stories.test.ts` (a comment only), as the report says. A wider search for tests that read the message files at run time (`readFileSync(join(..., 'messages', ...))`, which the import pattern does not match) → 20 more files; the 21 run (`npx vitest run`) → 374 passed, exit 0. `node --test scripts/quality/check-files.test.mjs` → 32 passed, exit 0.
  - `npm run typecheck` → exit 0. `npx eslint --no-warn-ignored --max-warnings 0` on the 5 changed code files → exit 0.
  - Failing-first (`v3-breaks.mjs` in the reviewer's scratchpad: the file set at `d23137521` through `git show`, the test file run, the files restored byte for byte, sha256 equal): `inboundEmail.ts` at `d23137521` → 2 failed of 74, the two `[SEC-1047-STORE-NAME]` surrogate cases; the dialog and `en.json` at `d23137521` → 1 failed of 11, "expected undefined to be 'Unnamed file'"; the dialog alone at `d23137521` → the same case fails on the link. Each exit 1, the report's counts.
  - Breaks: `.replace(/[\uD800-\uDBFF]$/, '')` removed from `cut` → both surrogate cases fail; `|| t('attachment_unnamed')` removed → `[SEC-1047-DIALOG-LINK] a stored file without a name ...` fails. Each exit 1, each restored with sha256 equal.
  - The message files: each parses, 2749 keys in each, 0 missing and 0 extra against `sq`, `attachment_unnamed` right after `attachments_title`; the added lines of the diff hold no invisible or bidi character (node scan, 0).
  - `test:security-integration` for R2 not rerun: `r2.ts` is unchanged since Review 1 (`git diff --stat d23137521`), which ran it (4 passed), and the Revision's Run does not name it.
- V4: read once: `InquiryDetailDialogView.tsx` (190 lines), `InquiryDetailDialogView.inbound.test.tsx` (204), `inboundEmail.ts:1-185` and `:260-320` (every caller of `oneLine` and `bodyText`), `inboundEmail.security.test.ts:1-120` and `:400-584` (the doubles and every Task 1047 case), the fixture's hunk, and the whole `admin.inquiries` block of each message file; the rest of each message file is byte-identical to `d23137521` (the diff has one hunk per file). The Cause of each finding is removed: F1 — the link's text is `file.filename || t('attachment_unnamed')` (`:62`), a row without `key` keeps `main`'s line (`:57`); F2 — `cut` (`inboundEmail.ts:79-81`) drops a trailing high surrogate after the cut, `oneLine` (`:85`, the file name `:172`, the declared type `:178`, the subject `:304`, the name `:305`) and `bodyText` (`:133`) use it. Every other `.slice` of the file cuts ASCII (`:149`), header text matched only as whole `<...>` tokens (`:104`, `:119`) or arrays (`:121`, `:170`).
- V5: against `git show main:<path>`: the limits (200, 20 000), the order of NUL removal, line folding and trim, and every check of `processInboundEmail` are as on `main`; the cut now drops one trailing high surrogate (owner decision O1047-3, 2026-11-26). The dialog keeps every section and the plain line of a row without `key`; the unnamed link text is O1047-2 (2026-11-26).
- V5a:
  - Pages: BLOCKED for the link on a page: no inquiry carries a stored attachment (`key`); the code that writes `key` exists only on this branch, the production Worker feeds the deployed `main` (Task 1046). The reviewer's read-only count of such rows was refused by the session's access classifier (UNKNOWN). The page check stays open until an inquiry with a stored attachment exists after the deploy (Review 1, "Open parts").
  - Stories, Storybook `:6006`, Playwright on `iframe.html` at the given width (`v5a-measure.mjs`, `v5a-others.mjs` in the reviewer's scratchpad): `StoredAttachments` in sq, en, uk, it at 320, 640, 1024, 1440 (16 renders); `New`, `WithReplies`, `RepliesLoadFailed`, `EmailThread`, `LongAttachmentName`, `Sending` in en at the four widths (24 renders); 0 page errors, 0 console errors.
  - Dialog box in all 40: 320 → `[0, 320]` (bottom sheet), 640 → left 32, width 576, 1024 → 202/620, 1440 → 410/620. No page horizontal scroll; no `p` or `a` past the dialog's right edge or wider than its box.
  - `StoredAttachments`, the unnamed link: text "Skedar pa emër", "Unnamed file", "Файл без назви", "File senza nome"; line "<text> (18 KB)"; `href` `…inquiry=6a2f9c41-…&n=3`, `target="_blank"`, `rel="noopener noreferrer"`; 14px, weight 400, line height 20.02px, "Open Sans", `rgb(236, 84, 71)`, `text-decoration: none`, `data-underline="hover"`, `overflow-wrap: break-word`, `word-break: normal`, height 19px; focus by keyboard: `:focus-visible`, outline solid 2px `rgb(236, 84, 71)`, offset 2px.
  - Comparison (U4): the PNG, the PDF and the answer's photo links of the same Story measure the same values in every render; the DOCX link the same without `target` and `rel`; Review 1 measured the website `Anchor` of `AdminUserProfileView` (`AdminUserProfileView.tsx:727`) at the same values. The size text: 14px, weight 400, `rgb(0, 0, 0)`. Titles: "Bashkëngjitje", "Attachments", "Вкладення", "Allegati". `EmailThread` and `LongAttachmentName` keep 0 links and "Attachments (not kept)"; the other four Stories render no attachment list. No difference.
  - Firefox: the change is a link's text, not an interactive state; hover and focus are unchanged from Review 1 (the owner's look in Firefox, as Review 1).
- V6: `git diff d23137521` adds no `eslint-disable`, `.skip`, `.only`, `@ts-ignore`, `@ts-expect-error`, allowlist, baseline or registry row (grep, exit 1, no match).
- V7: below.
- V8: R1-1 — `[SEC-1047-DIALOG-LINK] a stored file without a name is a link named "Unnamed file"` fails with the dialog at `d23137521` and with `|| t('attachment_unnamed')` removed, passes restored. R1-2 — both `[SEC-1047-STORE-NAME]` surrogate cases fail with `inboundEmail.ts` at `d23137521` and with the `.replace` removed, pass restored. AC1-AC4 as in Review 1 (the Route's run, 1722 passed). AC5: CI, V14.
- V9: Stories for the owner's look: `Patterns/Mantine/InquiryDetailDialogView` `StoredAttachments` (changed fixture: a fourth stored PNG without a name under "Bashkëngjitje", its link "Skedar pa emër (18 KB)" opens in a new tab like the PNG and the PDF; the DOCX downloads; the answer's photo opens in a new tab), with the measurements of V5a, in sq, en, uk, it at 320, 640, 1024, 1440. `EmailThread` and `LongAttachmentName` unchanged.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 42 sheets triggered, the same set as Review 1; each has its verdict in the record; `Input_Validation` changes from `finding` (F2) to `met`.

## V7 — secure code review

Six steps: (1) no existing control weakened: the limits and the order of `oneLine` and `bodyText` stay, `cut` only removes a trailing high surrogate after the same `slice`; the dialog keeps `rel="noopener noreferrer"` and React text for the file name; (2) no new vector: no new entry point, parameter, outbound call or sink; the new text is a fixed message key; (3) no trust boundary changed; (4) no new package; (5) no test removed or loosened: the changed `[SEC-1047-STORE-NAME]` case now expects 199 × `n` and no lone surrogate where it expected `%EF%BF%BD`, which is stricter; (6) categories:

- Authorization: not touched — `git diff --name-only d23137521` holds no route, action, policy or permission check.
- Input and output: touched — `inboundEmail.ts:79-81` `cut`, `:85`, `:133`: a cut never leaves half a surrogate pair in a stored subject, name, file name, declared type or body (Review 1 F2); the file name stays React text (`InquiryDetailDialogView.tsx:62`).
- Authentication and sessions: not touched — no login, session or token file in the diff.
- Requests and redirects: not touched — the link's `href` is unchanged (`:61`); no route, redirect or fetch in the diff.
- Next.js entry points: not touched — no page, Route Handler, Server Action or middleware in the diff.
- Business logic: touched — a stored file without a name is reachable from the dialog (Review 1 F1); the rest of the flow is unchanged.
- JavaScript and TypeScript: touched — `/[\uD800-\uDBFF]$/` is one anchored character class, linear on a string already cut to at most 20 000 units; no `any` or non-null assertion.
- Data exposure, errors, logging: not touched — no log line, error answer or DTO changed.
- Files: not touched — the put, its type, disposition and key are unchanged; the stored name is cut by the same rule.
- Dependencies and configuration: not touched — no `package.json`, lockfile, workflow or header file in the diff.
- Agent and tool output: no invisible or bidi character in the added lines (node scan, 0); no rule, skill, hook or CI file changed by the executor.
- Tests: each Revision item has its test, and it fails without the change (V8).

## Findings

No findings. Review 1 F1 and F2: fixed in the working tree on d23137521 (Revision 1).

## Notes (no change asked)

- N1: the executor's report says I7 was not done literally for the four message files (2949 lines each, read as the `admin.inquiries` block plus a parse and key-set script). The reviewer's V4 read covers the one hunk of each file and the whole `admin.inquiries` block; the rest of each file is byte-identical to the tree of Review 1.
- N2: the import search of D10, I8 and V3 does not match the 20 tests that read `messages/*.json` at run time through `join(..., 'messages', ...)`; this review ran them (374 passed). Reported to the owner as a gap in the checklist's search pattern (A16), not filled here.

## Open parts

- Owner: read the diff; the handoff gives the commit, the push and the pull request.
- After the deploy: the link on `/admin/inquiries/support` or `/sales` once an inquiry with a stored attachment exists (V5a pages, BLOCKED above), and V14 `gh pr checks <n>`.
