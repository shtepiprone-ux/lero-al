# Task 1047 — Staff open the attachments of a received mail from the inquiry dialog

Sprint 94. Priority P1. After Task 1046 (it builds on its mail store in `r2.ts`). Owner decisions 2026-11-25 ([plan](Sprint_94_Task_1044_Plan_And_Owner_Settings.md),
"Owner decisions"), translated: "what is the point of testing attachments if they are not kept and nobody in the administration can even open
them"; O1046-1 "a new private R2 bucket"; O1047-1 "preview of photos and PDF", every other file is downloaded. 1048 and 1049 delete these files
with their conversation, so every file of one conversation sits under one prefix. Implementer: Sonnet. Reviewer: Opus. Human owner of the
change: the owner.

## Goal

A received mail keeps only the name, size and declared type of each attachment; its content is thrown away and the dialog shows the names under
"Attachments (not kept)". After the task each attachment is stored in the private mail bucket under its conversation, and staff who may see that
inquiry open it from the dialog: a photo (JPEG, PNG, WebP) or a PDF opens in a new tab, any other file is downloaded.

## Cause

Read at `56f3f8318` (Task 1046 merged; of the files below only `r2.ts` changed since `1bf37a166`)
- `src/modules/contacts/lib/inboundEmail.ts:127-133` (`attachmentList`) keeps `filename`, `size`, `content_type` and drops `a.content`; `:17`
  "attachments keep their name, size and declared type, never their content (O1044-4)"; the rows are written at `:223-230` and `:241-253`.
- `src/types/database.ts:81-85`: `InquiryAttachment` has no field for a stored object.
- `src/components/admin/InquiryDetailDialogView.tsx:47-57` (`AttachmentNames`) prints plain text lines; `:132`, `:155` the title
  `attachments_not_kept` (`messages/en.json:1182` "Attachments (not kept)").
- `src/lib/media/r2.ts:47-57` two stores since Task 1046, `'listing'` and `'mail'`; the mail store only reads (`getMailObject` `:145`, a
  GET the server signs and makes itself) and deletes (`deleteMailObjects` `:137`); `:82-83` the only presign is a PUT for WebP or JPEG on
  the listing store; no mail object is ever put by the app or presigned for a browser.
- `ls src/app/api/admin` → "No such file or directory": no route hands staff a file.
- Cloudflare (read 2026-11-25): S3 API PutObject "✅ Content-Type", "✅ Content-Disposition", "✅ Cache-Control"; presigned URLs support "`GET`:
  Fetch an object from a bucket", "Timeout from 1 second to 7 days"; the `response-content-*` overrides of GetObject are not listed, so the
  type and disposition are fixed at PUT time.

Fix: after the drop checks, `processInboundEmail` puts each kept attachment into the mail bucket under `mail/<inquiry id>/<uuid>` with a type
and disposition from its real signature, then writes the row with each file's key; a new staff route checks who asks, finds the file by inquiry,
reply and index, and redirects to a five-minute presigned GET; the dialog links each stored file to that route.

## Scope

- `src/lib/media/r2.ts` (on Task 1046's `settings('mail')`): new `putMailObject(key, bytes, { contentType, contentDisposition })`: a signed PUT
  on the mail bucket with `Content-Type`, `Content-Disposition`, `Cache-Control: private, no-store`; a non-2xx answer throws. New
  `presignMailGet(key)`: a presigned GET on the mail bucket, `X-Amz-Expires` = `MAIL_GET_EXPIRES_SECONDS` (300). Both call `assertKey`.
- `src/modules/contacts/lib/inboundEmail.ts`: `attachmentList` becomes `storeAttachments(inquiryId, email)`: for each of the first 20
  (`MAX_ATTACHMENTS`, kept) the bytes (a string content through `TextEncoder`); `preview` is true only for `sniffImageType` (`src/lib/uploads/imageSniff.ts:10`,
  JPEG, PNG, WebP) or the bytes `%PDF-`; `Content-Type` is that type, else `application/octet-stream`; `Content-Disposition` is `inline` or
  `attachment` with `filename="<ASCII letters, digits, . _ - and space only, else _; at most 100; empty → attachment>"` and
  `filename*=UTF-8''<percent-encoded, also ' ( ) *>`; key `mail/<inquiryId>/<crypto.randomUUID()>`; all puts together (`Promise.allSettled`).
  The row keeps `filename`, `size`, `content_type` (declared) as today and adds `key`, `preview`. The puts run after checks 1-4 and, for an
  answer, after `findInquiry` and before the reopening update; a new inquiry gets `id: crypto.randomUUID()` before its puts and is inserted with
  it. A failed put → the keys already put are deleted, `failed('write_failed', 'attachment_put')`, nothing written. Any failed reopen or insert
  (a unique violation too) → its keys deleted, then today's outcome. A failed delete logs `{ outcome: 'attachment_delete_failed' }` only. The
  header comment `:17` follows.
- `src/types/database.ts:81-85`: `InquiryAttachment` gains `key?: string` and `preview?: boolean` (absent on rows written before this task).
- New `src/app/api/admin/inquiry-attachment/route.ts`, `GET ?inquiry=<uuid>&n=<0-19>[&reply=<uuid>]`, in this order: `checkStaff()` → 401
  `unauthenticated`, 403 `forbidden`; the query (lower-case UUIDs, `n` `^(?:[0-9]|1[0-9])$`, no other parameter) → else 400; the inquiry's
  `id, target_mailbox, attachments` (and with `reply` that reply's `attachments` where `id = reply` and `inquiry_id = inquiry`) → read error 500,
  no row 404; `checkStaff({ permission: /sales/i.test(target_mailbox) ? 'page.inquiries_sales' : 'page.inquiries_support' })` (the pages'
  split: `support/page.tsx` `.not('target_mailbox', 'ilike', '%sales%')`, `sales/page.tsx:29`) → 403; `attachments[n].key` must match
  `^mail/<inquiry>/<uuid v4>$` → else 404, no R2 call; `presignMailGet` → 302 with `Location`, `Cache-Control: no-store`,
  `Referrer-Policy: no-referrer`; a throw → 500. Logs carry the outcome code only.
- `src/components/admin/InquiryDetailDialogView.tsx` `AttachmentNames`: takes `inquiryId` and an optional `replyId`; a file with `key` is a
  Mantine `Anchor size="sm"` whose text is the file name, `href` the route above, `target="_blank" rel="noopener noreferrer"` when `preview`,
  no target otherwise, followed by ` (<n> KB)`; a file without `key` stays the line of `main`; the title is `attachments_title` when every file
  has a `key`, else `attachments_not_kept`. Callers `:132`, `:155` pass the ids.
- `messages/{en,sq,uk,it}.json` `admin.inquiries.attachments_title`: "Attachments", "Bashkëngjitje", "Вкладення", "Allegati".
- `src/stories/fixtures/admin.fixtures.ts`: a fixture inquiry with stored files (a PNG and a PDF with `preview`, a DOCX without) and an answer
  with one stored file; `src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx`: export `StoredAttachments`;
  `scripts/rendered-interaction-states.json`: its row, as the `email-thread` row.
- Tests: `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts`, `src/lib/media/__tests__/r2.security.test.ts`,
  `src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx` (changed); new
  `src/app/api/admin/inquiry-attachment/__tests__/route.security.test.ts`.
- Dependencies: none.
- Out of scope: deleting conversations and their files (1048, 1049); the transport and `inbound/` (1046); `/api/email/inbound`; the pages'
  selects (they read `attachments` whole); GIF, HEIC and SVG previews (downloaded; SVG can carry script); files of mails stored before this task.
- Kept as on `main` (A2): `inboundEmail.ts` keeps every check, its order, limits, outcomes, statuses and log codes, the body handling and the
  20-file cap; the dialog keeps every section, control, label and order, the "<name> (<n> KB)" line and the "not kept" title for old rows;
  `r2.ts` keeps every listing export, variable and call; the inquiry pages are unchanged.

## Attack surface

Changed: a new staff route, signed GET URLs, stored customer files.
1. **What are we working on?** The Worker-fed route (secret only) now writes attachments into the private mail bucket. Staff reach a new GET
   route with their session; it redirects to a five-minute signed address on R2's S3 host. Nobody else reads the bucket.
2. **What can go wrong?**
   - T1 S/E: a visitor, a plain user or a moderator without the page of that mailbox opens a file → mitigate: `checkStaff` first, then the
     page key of the inquiry's mailbox → AC2.
   - T2 T/I: a request names another conversation's file, another bucket or a crafted key → mitigate: the client sends ids and an index only;
     the key comes from the row and must sit under `mail/<that inquiry>/`; a reply must belong to that inquiry → AC2.
   - T3 T/E: a file declared `image/png` is HTML or SVG and runs script when opened → mitigate: inline only for the JPEG, PNG, WebP or PDF
     signature, every other file `application/octet-stream` and `attachment`; it is served from R2's host, never from `lero.al` → AC1.
   - T4 T: a file name injects a header or a path → mitigate: the name never enters the key; the disposition is built from an ASCII-only
     fallback and a percent-encoded `filename*` → AC1.
   - T5 I: a signed address leaks (history, a log, a Referer) → mitigate: 300 s expiry, `Referrer-Policy: no-referrer`, `no-store` on the
     redirect and `private, no-store` on the object; the address and the key are never logged → AC2, AC3.
   - T6 D/I: a failed write leaves files without a row, or a row without files → mitigate: puts before the row, every put key deleted on any
     failed write; the sender's retry stores them again → AC1.
   - T7 R: a moderator opens files unseen → Accept within this task: the read is staff-only and is not a change; the event log is Task 1026.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: `SEC-1047-ATTACHMENT-DENY` (anonymous 401; plain user, agent 403; moderator without `page.inquiries_support` on a
  support inquiry, without `page.inquiries_sales` on a sales one 403; a reply of another inquiry, an index past the list, a row without `key`,
  a key under another inquiry 404 and no R2 call) and `SEC-1047-ATTACHMENT-ALLOW` (an administrator; a moderator with the mailbox's page key).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-25, upstream `05861f28`).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T7 name another mailbox, another conversation, a disguised file, a crafted name, a leaked address and a half-written mail — AC1, AC2.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new route, the signed GET and the stored files — AC1-AC3.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every GET checks the session's staff role, then the mailbox's page key — AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed role or permission read is `forbidden` (`checkStaff`), a failed row read 500, never a link — AC2.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the route itself checks the inquiry's mailbox; the reply is read by its id AND its inquiry, and the key must sit under that inquiry — AC2.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-1047-ATTACHMENT-DENY` fails when the page-key or prefix check is removed — AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — each matrix row is one case of the route test — AC2.
- Bot_Management_and_Anti-Automation: not applicable — the only new entry point answers staff sessions only and sends no mail or code.
- Credential_Stuffing_Prevention: not applicable — no login, password or account step is added or changed here.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — inline only for four signatures, everything else `application/octet-stream` with `attachment`, served from R2's host, the name rendered by React as text — AC1, AC4.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the object name is `crypto.randomUUID()`, never the file name — AC1.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the link is a fixed path with ids and an index; no file text reaches a sink — AC4.
- Denial_of_Service: "Using validation that is cheap in resources first" — the route checks role and query before any read; the puts are bounded by 1046's 25 MB and the 20-file cap — AC1, AC2.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the stored type comes from the bytes' signature; the declared type is kept as text only — AC1.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — rows are read through the query builder with checked UUIDs; the disposition is built from an allow-listed fallback and percent-encoding — AC1, AC2.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a malformed or extra query parameter is 400 before any read — AC2.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the file is found from the row the viewer may see, never from a key the browser sends — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the query and key patterns are anchored with fixed-length groups — AC2.
- Key_Management: "a single key should be used for only one purpose" — the mail token signs mail objects only; the listing token is never used — AC3.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — outcome codes only; no key, address, file name or signed URL — AC1, AC2.
- Logging_Vocabulary: not applicable — the shared security-event helper is Task 1026; this task adds two outcome codes only.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the route reads three named query parameters and refuses any other — AC2.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the route checks the session itself; the admin page around the link is no guard — AC2.
- Nodejs_Security: "Never write sensitive data to application logs, including passwords, API keys, session tokens, authorization headers, or sensitive personal data." — no signed URL, key or customer data is logged — AC2.
- OAuth2: not applicable — no OAuth flow is touched; the word comes from the route's redirect to a signed file address.
- OS_Command_Injection_Defense: not applicable — no command is run; the census file is JSON read by the Storybook job.
- Prototype_Pollution_Prevention: "If objects have to be used then they should be created using the Object.create(null) API" — no object is merged from the query or the mail; `URLSearchParams` is read by name — AC2.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — `.eq` with validated UUIDs; no SQL text is built — AC2.
- REST_Security: "Return 401 for a missing or invalid key, and 403 for a valid key that lacks access to the resource." — no session 401, a session without access 403 — AC2.
- React_Security: "Never allow `javascript:` or `data:` in navigable attributes." — the `href` is the fixed `/api/admin/inquiry-attachment` path, never a stored value — AC4.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the route's two reads take only checked UUIDs through the query builder — AC2.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the mail token stays server-side; a signed address lives 300 s and is never logged — AC2, AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads this diff against this kickoff — AC5.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no new package; the executor follows this kickoff only — AC5.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T6 each became an acceptance criterion — AC1-AC3.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the new route authorizes itself; the bucket is reachable only by the mail token and signed GETs — AC2, AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them — AC1-AC3.
- Unvalidated_Redirects_and_Forwards: "If used, do not allow the URL as user input for the destination." — the redirect target is signed by the server from the row's key; no parameter is a URL — AC2.
- User_Privacy_Protection: not applicable — the files are read by staff only; no visitor request or address reaches a third party.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and the breaks — AC5.
- Web_Cache_Security: "Default to preventing shared caching for authenticated, personalized, tenant-specific, or otherwise sensitive responses." — `no-store` on the redirect, `private, no-store` on each object — AC2, AC3.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the file name is React text, no HTML is set — AC4.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the query is two UUIDs and one index of fixed patterns — AC2.

## UI

The inquiry dialog only: `InquiryDetailDialogView` and its Story `src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx`. U1: reuse
Mantine `Anchor` with its theme entry (`src/design-system/mantine/theme.ts:1338-1350`, `overflowWrap: 'break-word'`) as the admin's other
links (`AdminUserProfileView.tsx:727` `Anchor ... target="_blank" rel="noopener noreferrer" size="sm"`); no new component. U2: the file is
Mantine already. U3: no `style`, `className` or literal. U4: compared `AdminUserProfileView.tsx:727` (same props and size). U7: no table;
file names wrap (GR-3i); spacing from `MantineDialogSections`; no popup buttons; no heading. U8: the new export's row in
`scripts/rendered-interaction-states.json`. U11: stored files (built), files of an old row (built, `main`'s lines), no attachments (nothing,
as `main`), a 200-character name (`LongAttachmentName`, kept), the longest title "Bashkëngjitje" (built); loading, empty list, partial,
disabled, offline: not needed, the lines are links rendered from loaded data; error and no permission: the route's 401, 403, 404, 500 answer in
the opened tab, no state of the dialog. U12: link colour from the theme's `Anchor`; the link is named by its own file name (3.3.2); meaning is
text and underline, not colour alone; focus is Mantine's visible ring.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/InquiryDetailDialogView.tsx — the attachment lines under the message and under each reply
- Component families: overlay-and-disclosure, record-list-and-data
- Pattern IDs: overlay-adaptive, linear-flow
- Standards: apple-hig-sheets, android-adapt-layouts, w3c-reflow, w3c-focus-order, w3c-hover-focus, android-common-layouts, w3c-meaningful-sequence, apple-hig-layout, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineModal.tsx, src/design-system/mantine/patterns/MantineDialogSections.tsx
- Mobile range and switches: below 640px (theme.other.mobileGate / sm) the structured `MantineModal` is its bottom sheet and each file is one
  full-width line; at the 640px transition the centred dialog; no other threshold
- Mobile order: facts; status; message; its files; each row (badge or staff name, date, text, its files); composer; Close and Send reply
- Required-content treatment: wrap — file names wrap at any point; no clipping
- Story and verification: src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx (`StoredAttachments`, `EmailThread`, `LongAttachmentName`); 320, 639, 640, 1440; sq, en, uk, it

## Acceptance criteria

- AC1 Each attachment is put under `mail/<inquiry id>/<uuid v4>` of the mail store: JPEG, PNG, WebP and PDF bytes with their type and
  `inline`; HTML or SVG bytes declared `image/png`, and any other file, `application/octet-stream` and `attachment`; a name with `"`, `\`,
  CR LF, `/` and Cyrillic gives an ASCII fallback without them and a percent-encoded `filename*`; the new inquiry's `id` is the prefix; an
  answer's files sit under its inquiry; the rows carry `key` and `preview`; a dropped mail (checks 1-4) puts nothing; a failed put deletes the
  earlier keys, answers 500 and writes no row; a failed reopen or insert and a unique violation delete the keys — test:
  `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts` (changed).
- AC2 `SEC-1047-ATTACHMENT-DENY` and `SEC-1047-ATTACHMENT-ALLOW` as in the matrix; a malformed or extra query parameter 400; a failed read and
  a failed presign 500; the allowed answer is 302 to the presigned address with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`;
  no log line holds a key, an address or a URL — test: `src/app/api/admin/inquiry-attachment/__tests__/route.security.test.ts` (new).
- AC3 `putMailObject` signs a PUT to `R2_MAIL_BUCKET_NAME` with the mail key and the three headers; `presignMailGet` signs a GET to the mail
  bucket with `X-Amz-Expires=300`; neither reads a listing variable; a refused key throws before any call — test:
  `src/lib/media/__tests__/r2.security.test.ts` (changed).
- AC4 A stored preview file is a link to `/api/admin/inquiry-attachment?inquiry=<id>&n=<i>` (with `&reply=<id>` in a reply) with `target="_blank"`
  and `rel="noopener noreferrer"`; a stored other file has no target; the title reads "Attachments"; an old row keeps its plain lines and
  "Attachments (not kept)" — test: `src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx` (changed).
- AC5 CI passes — test: `gh pr checks <n>` after every check concluded.

## Route

0. Task 1046 is merged and deployed first; the bucket, its token and `R2_MAIL_*` exist (owner, 2026-11-25, in the plan). Done 2026-11-26:
   PR #79 (`56f3f8318`), Vercel Production and the Worker version `3adacb0f` live, V1 passed (the plan).
1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1-AC4); save each failing output.
3. `r2.ts`, `inboundEmail.ts`, `database.ts`, the route, the dialog, the messages, the fixture, the Story, the census row.
4. Run: `npm run typecheck`; ESLint on the changed code files (the pre-commit hook's command); `npm test --` with every file of
   `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts src/app/api/admin/inquiry-attachment/__tests__/route.security.test.ts` and
   the files found 2026-11-25, and again 2026-11-26 at `56f3f8318` (the same 85), by import of `r2.ts`, `inboundEmail.ts`, `InquiryDetailDialogView`, `@/types/database`, `admin.fixtures`,
   `messages/*.json` and `rendered-interaction-states.json` (checklist D10):
   scripts/__tests__/responsive-screenshots.test.ts src/__tests__/reactHooksV7Components.test.tsx src/__tests__/reactHooksV7Shells.test.tsx src/app/[locale]/auth/verified/__tests__/page.test.tsx src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx src/app/api/email/inbound/__tests__/route.security.test.ts src/components/admin/__tests__/AdminCompaniesManager.logo.security.test.tsx src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/components/admin/__tests__/AdminPagesView.test.tsx src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/components/admin/__tests__/AdminShell.pages.test.tsx src/components/admin/__tests__/AdminSidebar.pages.test.tsx src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx src/components/admin/__tests__/AdminUserCreate.watch.test.tsx src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx src/components/admin/__tests__/StackedConfirmDialogs.test.tsx src/components/admin/__tests__/StatusChangeSelect.test.tsx src/components/admin/__tests__/adminDeleteDialog.security.test.tsx src/components/admin/__tests__/adminPagesContent.test.ts src/components/admin/__tests__/adminPagesHydration.test.tsx src/components/admin/__tests__/savedRowRelativeTime.test.tsx
   src/components/layout/__tests__/FooterView.security.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx src/components/layout/__tests__/Header.signOut.test.tsx src/components/layout/__tests__/sessionEnded.security.test.tsx src/components/shared/__tests__/Combobox.portal.test.tsx src/components/ui/__tests__/overlays.test.tsx src/components/ui/__tests__/primitives.test.tsx src/components/ui/__tests__/uiPrimitivesExtra.test.tsx src/design-system/mantine/__tests__/badgeTones.test.ts src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/lib/auth/__tests__/controller.test.ts src/lib/media/__tests__/listingPhoto.security.test.ts src/lib/media/__tests__/r2.security.test.ts src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/admin/dashboard/components/__tests__/AdminDashboardView.axis.test.tsx src/modules/auth/__tests__/AuthContext.test.tsx src/modules/auth/components/AuthSheet.banned.security.test.tsx src/modules/auth/components/ResetPasswordClient.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.registerAgent.test.tsx src/modules/auth/components/__tests__/AuthSheet.test.tsx src/modules/auth/components/__tests__/authClientParts.test.tsx src/modules/auth/components/__tests__/resetPassword.test.tsx src/modules/auth/components/__tests__/staleSession.security.test.tsx
   src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/modules/cabinet/statistics/__tests__/portfolio.test.ts src/modules/cabinet/statistics/components/__tests__/AgentStatisticsView.axis.test.tsx src/modules/listings/actions/__tests__/listingPhotoVerify.security.test.ts src/modules/listings/actions/ownerPublish.security.test.ts src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx src/modules/listings/components/__tests__/CollectionsSection.delete.test.tsx src/modules/listings/components/__tests__/ListingAccessRestrictedView.security.test.tsx src/modules/listings/components/__tests__/ListingCard.hydration.test.tsx src/modules/listings/components/__tests__/ListingContact.bot.security.test.tsx src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx src/modules/listings/components/__tests__/ListingInquiryDialog.bot.security.test.tsx src/modules/listings/components/form/__tests__/fieldContracts.test.tsx src/modules/listings/components/listingStatusOptions.security.test.tsx src/modules/listings/domain/__tests__/listingConstants.test.ts src/modules/listings/domain/__tests__/listingDomain.test.ts src/modules/listings/domain/listingTransitionEngine.test.ts src/modules/listings/domain/ownerStatusRules.security.test.ts src/modules/listings/lib/__tests__/listingStatusTone.test.ts src/modules/listings/lib/__tests__/visibility.test.ts src/modules/notifications/components/__tests__/NotificationBellView.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx src/stories/fixtures/__tests__/ListingFormHarness.test.tsx;
   `npm run test:security-integration -- src/tests/integration/r2SignedUpload.integration.test.ts`. The `StoredAttachments` Story and the
   dialog measured at 320, 639, 640 and 1440 px on the running Storybook (I8a). Deliberate breaks: the page-key check removed →
   `SEC-1047-ATTACHMENT-DENY` fails; the `mail/<inquiry>/` prefix check removed → AC2 fails; every file stored `inline` → AC1 fails; the key
   deletion after a failed insert removed → AC1 fails; each restored. CI runs only on GitHub and is read with `gh pr checks <n>` (A5).
5. Report: each command, exit code, relevant output; each new test's failing run before the change; each break's output.

## Revision 1

Owner decisions 2026-11-26 (Review 1, translated): O1047-2 "a new key" for a stored file without a name; O1047-3 "in Revision 1 of task 1047"
for the cut inside a surrogate pair. Starts from the owner's local commit of the reviewed tree (Review 1, handoff).

- R1-1 (Review 1, F1) `src/components/admin/InquiryDetailDialogView.tsx:62`: the link text of a stored file is
  `file.filename || t('attachment_unnamed')`; a file without `key` keeps `main`'s line. `messages/{sq,en,uk,it}.json`
  `admin.inquiries.attachment_unnamed`: "Skedar pa emër", "Unnamed file", "Файл без назви", "File senza nome" (Edit only, after
  `attachments_title`). `src/stories/fixtures/admin.fixtures.ts`: `FIXTURE_STORED_ATTACHMENT_INQUIRY` gains a fourth file
  `{ filename: '', size: 18_432, content_type: 'image/png', key: mail/<its id>/<a new uuid v4>, preview: true }`. Test
  `src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx`: `[SEC-1047-DIALOG-LINK] a stored file without a name is a link
  named "Unnamed file"` (`getByRole('link', { name: t.attachment_unnamed })`, its `href` and `target`); it fails on the reviewed tree.
- R1-2 (Review 1, F2) `src/modules/contacts/lib/inboundEmail.ts:79-81`, `:128`: one helper cuts a text at `max` and then drops a trailing
  high surrogate (`/[\uD800-\uDBFF]$/`); `oneLine` and `bodyText` use it; no other line changes (the limits, the order, every check stay).
  Test `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts`: `[SEC-1047-STORE-NAME] a 200-character cut inside a surrogate
  pair ...` expects the stored `filename` to be 199 × `n`, the disposition `attachment; filename="<100 × n>"; filename*=UTF-8''<199 × n>`, and
  no lone surrogate (`/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/`) in the stored row; a new case does the same
  for a 199-character subject and sender name followed by an emoji, and for a body of 19 999 characters followed by an emoji; each fails on
  the reviewed tree.
- Run (I8): `npm run typecheck`; ESLint on the changed code files; `npm test --` with the Route's 85 files; the `StoredAttachments` Story at
  320, 640, 1024 and 1440 px in sq, en, uk, it (I8a), the unnamed file's link measured as the others.

## Review

- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_1047_Review_1.md)
