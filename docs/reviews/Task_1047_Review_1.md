# Task 1047 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1047_Received_Attachments_Open_From_The_Admin.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1047_Received_Attachments_Open_From_The_Admin.md) · OWASP record: [Task_1047.json](../security/owasp/reviews/Task_1047.json)

Review 1 of the working tree on d2164bf4e — NEEDS REVISION
Scope: diff-based; `git diff --stat d2164bf4e` → 14 files (559+, 36−) and two new files: `src/app/api/admin/inquiry-attachment/route.ts` (new Route Handler, audience administrator and moderator with the mailbox's page key) with its test, `src/modules/contacts/lib/inboundEmail.ts` (the Worker-fed mail path, now writes to R2), `src/lib/media/r2.ts` (server-only R2 client), `src/components/admin/InquiryDetailDialogView.tsx`, `src/types/database.ts`, the four message files, the fixture, the Story, the census row and three changed test files.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45768402600 green; `npm test --` the Route's 85 files → 1720 passed, exit 0; `npm run typecheck` → exit 0; ESLint on the 11 changed and new code files → exit 0; `node --test` `db-types-drift.test.mjs`, `check-files.test.mjs` → 41 passed; `test:security-integration` R2 → 4 passed, exit 0; failing-first (AC1-AC4) → each exit 1; four breaks → each exit 1; Storybook 36 renders measured; `owasp.mjs review --base main` → exit 0. CI of the pull request: UNKNOWN until the push (V14).
Findings: Critical 0, High 0, Medium 2, Low 0
Overall risk: the route, the signed GET and the stored types hold every kickoff control with a test that fails without it; an attachment without a name becomes an invisible, unnamed link, and a 200-character cut inside an emoji can leave half a surrogate pair in a stored row.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "140 sheets at 05861f28ed88; 0 downloaded; added 0, changed 0, removed 0", `check` → "every quote verified", `check-ruleset.mjs` → "the live ruleset matches"; `gh run list --branch main --limit 3` → CI 45768402600 success (Task 1046, #79).
- V2: `git diff --stat d2164bf4e` → the 14 files above, `git ls-files --others --exclude-standard` → the route and its test; every file is in the kickoff's Scope. `d2164bf4e` differs from `main` (`56f3f8318`) in two documents only (`git diff --stat main d2164bf4e`). The one hunk beyond the Scope's wording, the `attachments` comment of `ContactInquiry` (`database.ts:74`), replaces a sentence the change makes false; kept.
- V3: every claim of the executor's report reproduced:
  - The Route's 85 files (`npm test --`) → 85 passed, 1720 tests, exit 0, the report's numbers.
  - Import search over the whole tree (`grep -rlE` over `src` and `scripts` for `media/r2`, `inboundEmail`, `InquiryDetailDialogView`, `types/database`, `admin.fixtures`, `messages/*.json`, `rendered-interaction-states`, `inquiry-attachment`) → 88 files: the Route's set plus `scripts/quality/db-types-drift.test.mjs` and `scripts/quality/check-files.test.mjs` (both read a changed file: `database.ts:98` of the test, `messages/en.json`), `similarity.test.ts` (a comment only) and the R2 integration test. `node --test` on the two → 41 passed, exit 0.
  - `npm run typecheck` → exit 0. `npx eslint --no-warn-ignored --max-warnings 0` on the 11 changed and new code files → exit 0.
  - `SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<the development ref> npm run test:security-integration -- src/tests/integration/r2SignedUpload.integration.test.ts` → 4 passed, exit 0 (D91).
  - Failing-first: AC1 `inboundEmail.ts` at `d2164bf4e` → 23 failed of 73; AC3 `r2.ts` → 13 failed of 84; AC4 the dialog → 5 failed of 10; AC2 the route moved aside → "Cannot find module"; each exit 1, each restored with sha256 equal.
  - Breaks (`breaks.mjs` in the reviewer's scratchpad: one exact string replaced, the test file run, the file restored byte for byte): the page-key refusal removed (`route.ts:57`) → 4 of 37; the prefix and uuid v4 check removed (`route.ts:62`) → 3 of 37; every file `inline` → 8 of 73; the key deletion after a failed new insert removed → 3 of 73. Each exit 1, the report's counts.
- V4: read the whole diff and both new files. The Cause is removed: the attachments are put under `mail/<inquiry id>/<uuid v4>` before the row (`inboundEmail.ts` `storeAttachments`), the row carries `key` and `preview`, the route signs a 300 s GET (`r2.ts` `presignMailGet`), the dialog links each stored file. Two defects: F1, F2.
- V5: against `git show main:<path>`: every check of `processInboundEmail`, its order, limits, outcomes and log codes are kept (the puts run after checks 1-4 and `findInquiry`, before the reopening); the 20-file cap stays; `r2.ts` keeps every listing export; the dialog keeps every section, the "<name> (<n> KB)" line and "Attachments (not kept)" for old rows (test "a row written before the task keeps its plain lines"). The new title "Attachments" and the links are the kickoff's (O1047-1).
- V5a:
  - Pages, dev server `http://localhost:3000`, the owner's session in the owner's Chrome: `/admin/inquiries/support` (4 inquiries) and `/admin/inquiries/sales` (2); the only mail-received inquiry ("V1 test 1 plain text") has no attachment, and no row of the database carries `key` (the production Worker still runs Task 1046's code), so no page renders the new link: BLOCKED for the link on a page: no inquiry with a stored attachment exists; the dialog of that inquiry renders as on `main`. The route on the dev server with the owner's session: an unknown inquiry → 404 `not_found`, `inquiry=x` → 400, an extra `key` parameter → 400, each `Cache-Control: no-store`.
  - Stories, Storybook `:6006`, measured in iframes of the given width: `StoredAttachments` in sq, en, uk, it at 320, 639, 640, 1024, 1440; `EmailThread` and `LongAttachmentName` in sq at the five widths and in en, uk, it at 320 (36 renders, 0 errors). Dialog box: 320 → `[0, 320]`, 639 → `[0, 639]` (bottom sheet), 640 → left 32, width 576, 1024 → 202/620, 1440 → 410/620 (centred). No page horizontal scroll, no clipped `p` or `a`, no link past the dialog's right edge, in all 36. Each link: 14px, weight 400, line height 20.02px, `rgb(236, 84, 71)`, `text-decoration: none`, `data-underline="hover"`, `overflow-wrap: break-word`; `StoredAttachments` 4 links, targets `_blank`, `_blank`, none (the DOCX), `_blank` (the reply's photo), `rel="noopener noreferrer"`. The size text: 14px, weight 400, `rgb(0, 0, 0)`. Titles: "Bashkëngjitje", "Attachments", "Вкладення", "Allegati" (stored); "(nuk ruhen)", "(not kept)", "(не зберігаються)", "(non conservati)" in `EmailThread` and `LongAttachmentName`; no link in either. Focus: `:focus-visible`, outline solid 2px `rgb(236, 84, 71)`, offset 2px.
  - Comparison (U4): the website `Anchor` of `AdminUserProfileView` (`--view-agent`, `AdminUserProfileView.tsx:727`) measures the same: 14px/400/20.02px, the same colour, `none`, `hover`, `break-word`, `_blank`, `noopener noreferrer`.
  - Firefox: `firefox --headless --screenshot` returned a blank page before the Story rendered; no other Firefox driver is installed (A6). The hover and focus look in Firefox is the owner's.
- V6: `git diff d2164bf4e` has no `eslint-disable`, `.skip`, `.only`, `@ts-ignore`, `@ts-expect-error`, allowlist or baseline. The one registry row (`scripts/rendered-interaction-states.json`, `--stored-attachments`, empty `dismiss` with a `reason`): `validateRegistry` (`scripts/rendered-state-census/registry.mjs:63`) → no error for the row; the planted row without `reason` → "an empty \"dismiss\" needs a non-empty \"reason\""; the reason is true (`InquiryDetailDialogView.stories.tsx:65` `onClose={() => {}}`).
- V7: below.
- V8: as V3's failing-first runs: AC1-AC4 each exit 1 on the unchanged code and exit 0 restored. AC5: CI, V14.
- V9: Stories for the owner's look: `Patterns/Mantine/InquiryDetailDialogView` `StoredAttachments` (new; three files under "Bashkëngjitje" in the message, one in the customer's answer; the PNG, the PDF and the answer's photo open in a new tab, the DOCX downloads), `EmailThread` and `LongAttachmentName` (unchanged: plain lines under "(nuk ruhen)"), with the measurements of V5a, in sq, en, uk, it at 320, 640, 1024, 1440.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 42 sheets triggered; each has its verdict in the record with the four further sheets of the kickoff's "## OWASP"; `Input_Validation` is `finding` (F2).

## V7 — secure code review

Six steps: (1) no existing control weakened: every check of the mail path is kept in its order, the duplicate pre-check and the unique-index answer stay (`[SEC-1044-DUPLICATE-INDEX]` passes; its double now empties only the `.eq('message_id')` reads, and that test is a new inquiry without a thread lookup); (2) new vectors: a staff GET with three parameters, a redirect to a signed address, customer bytes stored and served from R2's host; (3) trust boundaries: the route reads with the service role only after `checkStaff()` and checks the page key before any R2 call; the app now writes to the mail bucket with the mail token; (4) no new package (`aws4fetch`, `postal-mime` as before); (5) no test removed or loosened: the key-list assertion of "keeps no attachment content" follows the new row shape and adds the 20 puts; (6) categories:

- Authorization: touched — `route.ts:36-37` before any read, `:56-57` the mailbox's page key, the reply by id and inquiry (`:49`), the key under that inquiry (`:61-62`); signed URLs follow the row's rule. Not found answers 404 before the page-key check for a staff session only; the ids are random v4 UUIDs, so existence is not guessable.
- Input and output: touched — `route.ts:25-33` allow-list of three names, each once, anchored patterns; no spread into a write; the file name is React text, the `href` a fixed path. F2: `inboundEmail.ts:80`, `:128`.
- Authentication and sessions: not touched — no login, session or token flow in `git diff --name-only d2164bf4e`.
- Requests and redirects: touched — GET changes nothing; the 302 target is signed by the server on `R2_ENDPOINT` from the row's key; the server's PUT goes to `R2_ENDPOINT` only.
- Next.js entry points: touched — new Route Handler `/api/admin/inquiry-attachment`, audience administrator, moderator with `page.inquiries_support` or `page.inquiries_sales`; `r2.ts:1` `server-only`; every answer `no-store`.
- Business logic: touched — the puts run before the row; any failed put, reopen or insert (a unique violation too) deletes the keys put (`[SEC-1047-STORE-ROLLBACK]`); the sender limits of Task 1044 bound how many files arrive.
- JavaScript and TypeScript: touched — linear anchored patterns (`route.ts:14-16`); the jsonb row is `unknown` until `typeof key === 'string'`; no `any` or non-null assertion.
- Data exposure, errors, logging: touched — answers are fixed codes; log lines carry outcome codes only (both tests scan every level).
- Files: touched — the type is read from the bytes (`previewType`), the declared type kept as text; size bounded by Task 1046's 25 MB; the object name is `crypto.randomUUID()`; only the Worker-fed route writes.
- Dependencies and configuration: not touched — no `package.json`, lockfile, workflow or header file in the diff.
- Agent and tool output: no invisible or bidi character (node scan of the diff and both new files → 0); no rule, skill, hook or CI file changed.
- Tests: every AC has its test and it fails without the change (V8); the negative cases fail with the page-key and prefix checks removed.

## Findings

F1 — A stored attachment without a name is an empty, unnamed link
Severity: Medium      Category: Business logic, accessibility (U12)      CWE: —
Location: `src/components/admin/InquiryDetailDialogView.tsx:58-65`
Description: `postal-mime` gives `filename: null` for a part without a name (`node_modules/postal-mime/dist/esm/postal-mime.js:289`); `storeAttachments` stores it as `''` with a `key` (`inboundEmail.ts:167`; the executor's test "an empty name falls back to \"attachment\"" stores such a file). The dialog renders `<Anchor>{file.filename}</Anchor>`, an anchor with no text.
Impact: staff see " (n KB)" with a zero-width link they cannot click, so the file cannot be opened (the kickoff's Goal); a screen reader announces a link without a name (WCAG 2.4.4, 4.1.2; the kickoff's U12 "the link is named by its own file name").
Reproduction: a fixture row `{ filename: '', size: 1024, content_type: 'image/png', key: 'mail/<id>/<uuid v4>', preview: true }` → `getAllByRole('link')` holds an element whose accessible name is `''`.
Recommendation: owner decision O1047-2 (2026-11-26, this review, "Новий ключ"): new key `admin.inquiries.attachment_unnamed` — sq "Skedar pa emër", en "Unnamed file", uk "Файл без назви", it "File senza nome"; the link text of a stored file is `file.filename || t('attachment_unnamed')`; a row without `key` keeps `main`'s line unchanged.
References: WCAG 2.4.4, 4.1.2; checklist U12; A2.
Status: open (Revision 1, R1-1)

F2 — A 200-character cut can leave half a surrogate pair in a stored row
Severity: Medium      Category: Input and output      CWE: CWE-176
Location: `src/modules/contacts/lib/inboundEmail.ts:79-81` (`oneLine`, used for the file name `:167`, the subject `:299`, the sender name `:300`), `:128` (`bodyText`, 20 000)
Description: `.slice(0, max)` counts UTF-16 units; a name, subject or file name whose 200th unit is the first half of an emoji keeps a lone high surrogate. The executor's test `[SEC-1047-STORE-NAME] a 200-character cut inside a surrogate pair still stores the mail` passes against the in-memory database only. Present on `main` for the file name, subject and name; the task rewrote the function that stores the file name.
Impact: INFERENCE: PostgREST hands the row to Postgres as JSON, and Postgres JSON input refuses a lone surrogate escape, so such a mail answers 500 at every delivery and is never stored (after Task 1047 its files are put and deleted each time). Not measured: the reviewer's read-only `select '<json>'::jsonb` was refused by the session's access classifier (UNKNOWN).
Reproduction: a mail with `filename*=UTF-8''` + 199 × `n` + `%F0%9F%98%80.txt` → the stored `filename` ends with `\uD83D` (the executor's test input).
Recommendation: owner decision O1047-3 (2026-11-26, this review, "У Revision 1 задачі 1047"): one helper cuts at `max` and drops a trailing high surrogate (`/[\uD800-\uDBFF]$/`), used by `oneLine` and `bodyText`; the limits, the order and every other step stay.
References: OWASP Input_Validation; A4.
Status: open (Revision 1, R1-2)

## Notes (no change asked)

- N1: the kickoff's U12 says "meaning is text and underline"; the theme's `Anchor` underlines on hover only (`data-underline="hover"`), like the profile's link (U4). The link differs from the black size text by 5.93:1 (computed from `rgb(236, 84, 71)` and `rgb(0, 0, 0)`), above 3:1, with the hover underline and the focus outline as the further cue; the kickoff's sentence was inexact, the code follows U1 and U4.
- N2: the theme's link colour `rgb(236, 84, 71)` (`primaryColor` shade 7, every Mantine `Anchor`) on white is 3.54:1 (computed), below WCAG 1.4.3's 4.5:1 for 14px text. D78-27 accepted white on `brand[7]` for badges only. Theme-wide and outside this task: filed as Task 1051 (A4).
- N3: the executor's gap 4 (I8a widths 320/640/1024/1440 against the Route's 320/639/640/1440; the Route's integration command without `SECURITY_TEST_TARGET`/`SECURITY_TEST_PROJECT_REF`): the executor measured the union; the integration command's variables are in every integration test's header (`accessHardening.integration.test.ts:8`). Revision 1's Route names both.

## Revision 1 (for the implementer)

See the kickoff's "## Revision 1": R1-1 (F1), R1-2 (F2), then the Route's run.

## Open parts

- Owner: commit the reviewed tree locally (handoff below), then the executor's session runs Revision 1.
- Review 2: F1, F2; V5a again (the Stories; a page link only once an inquiry with a stored attachment exists, after the deploy).
