# Task 1044 — Mail to support@ and sales@ reaches the admin and joins its inquiry

Sprint 94. Priority P1. Owner request 2026-11-25 (translated): "full two-way mail communication ... the administrator receives, reads and sends
every message only through the LERO admin panel". Owner decision 2026-11-25 (translated): "I approve the minimal architecture Cloudflare Email
Routing + Workers Free for receiving mail and Resend Free for sending ... no additional R2 bucket, queues, cron for mail processing or needless
abstractions ... the raw MIME message limited to 4 MB ... confirm a received mail only after it is reliably stored in the database ... route by
the actual SMTP recipient, not only the To header ... check that the sender belongs to the correspondence, do not rely only on Message-ID ...
switch off the internal staff e-mail notifications ... do not change the sending through Resend, Supabase Auth or the transactional templates
... no paid plan". O1044-1 notifications off; O1044-2 support@lero.al and sales@lero.al kept; O1044-4 attachments: metadata only; O1044-5 a
customer's answer sets the inquiry to `new` and keeps its history. Task 1045 is absorbed here (owner, 2026-11-25: "Task 1045 may be closed as
absorbed by Task 1044 if all its acceptance criteria are met within Task 1044"): AC6. Owner, 2026-11-25 (translated): "to join an incoming
mail to an existing inquiry use: the sender's address equal to the customer's address; the matching correspondence identifier; dmarc=pass from
the trusted Authentication-Results added by Cloudflare. Do not trust authentication headers added by the sender himself. Without sufficient
proof do not join the mail automatically"; "check correct grouping in the visitor's mail client through In-Reply-To, References and
Message-ID ... if it needs only minimal changes of the current reply sending, implement it within 1044". The plan, DNS changes, rollback and the owner's
verification: [plan](../Sprints/Sprint_94_Task_1044_Plan_And_Owner_Settings.md). Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

No mail sent to `support@lero.al` or `sales@lero.al` reaches anyone, and a customer's answer to a staff reply is lost. After the task a
Cloudflare Email Worker hands each received message (at most 4 MB) to a secret-protected Vercel route, which answers success only after the
message is stored: an answer from the inquiry's own address joins its inquiry, any other message opens an inquiry on the Support or Sales
page. A saved contact form message always answers success, and no staff notification is sent.

## Cause

Read at `24036a2e7`
- `Resolve-DnsName lero.al -Type MX -Server 1.1.1.1` → `lero.al 0` (2026-11-25): the MX points at the web host; `-Type NS` →
  `adi.ns.cloudflare.com`, `ricardo.ns.cloudflare.com`.
- No receiving code: `ls src/app/api` → `auth`, `auth-email-hook`, `cron`, `exchange-rate`, `listings`, `presence`, `property-types` and four
  uploads; the admin pages read only `contact_inquiries` and `contact_inquiry_replies` (`src/app/admin/inquiries/support/page.tsx:23-36`,
  `src/modules/contacts/lib/inquiryReplies.ts:12-16`); a reply row is staff text only (`supabase/catalog.json`: `id, inquiry_id, replied_by,
  body, created_at, replied_by_name`).
- Every form message e-mails the mailbox (`src/modules/contacts/actions/index.ts:126-137`) and a failed notification answers an error
  although the row is saved (`:139-146`).
- The form limit counts every row without an address in one bucket (`index.ts:46-58`): received mail stored without an address would refuse
  the form to every visitor whose address is unknown.
- Cloudflare (read 2026-11-25): "Inbound emails (Email Routing)" "Unlimited" on Workers Free; `message.to` is the "envelope RCPT TO",
  `message.from` the "envelope MAIL FROM", `message.raw` a `ReadableStream`, `setReject` "Reject emails with a permanent SMTP error"; "Email
  Routing validates ... DMARC before invoking your Worker. It prepends a standard `Authentication-Results` header"; "Emails that fail both
  checks are rejected"; mail "to an address with no matching rule is rejected"; Workers Free "CPU time per HTTP request 10 ms", "Waiting on
  network requests ... does not count toward CPU time". A Vercel Function body is at most 4.5 MB.
- A staff reply carries no threading header (`src/modules/notifications/lib/emails/send.ts:88-94` sends no `headers`), so the customer's mail
  program does not group it with the customer's own message, and its `Message-ID` is not stored. Resend (changelog 2026-07-08): "The `GET
  /emails/:email_id` endpoint now returns `message_id` for every sent email"; "pass the `message_id` as the `In-Reply-To` and `References`
  headers on your next send, so Gmail, Outlook, and Apple Mail group it into the same conversation"; `resend@6.12.3` passes `headers`
  (`grep -n "headers?: Record<string, string>" node_modules/resend/dist/index.d.cts` → `545:  headers?: Record<string, string>;`).

Fix: a 30-line Email Worker posts the raw message with a shared secret and the envelope addresses to a new route; the route parses it, drops
duplicates, loops, automatic answers and floods, joins an answer to its inquiry only by a stored message id, from the inquiry's address,
with Cloudflare's `dmarc=pass`, otherwise opens an inquiry, and answers 200 only after the write; a staff reply carries `In-Reply-To` and
`References` and its `message_id` is stored; the form stops sending the notification and counts form rows only; the dialog shows the
customer's messages and their attachment names.

## Scope

- SQL `supabase/sql_migrations/task1044/` (`task1044-preflight.sql`, `task1044.sql`, `task1044-verify.sql`, `task1044-rollback.sql`; the
  owner applies): `contact_inquiries` + `source text not null default 'form' check (source in ('form','email'))`, `message_id text`,
  `attachments jsonb not null default '[]'`; `contact_inquiry_replies` + `direction text not null default 'outbound' check (direction in
  ('outbound','inbound'))`, `from_email text`, `message_id text`, `attachments jsonb not null default '[]'`, check `direction = 'outbound' or
  replied_by is null`; a unique index on `message_id` where it is not null in each table. Grants and policies unchanged. Then
  `supabase/catalog.json` by `db-catalog-audit.mjs --save supabase/catalog.json` and `src/types/database.ts` (the new columns).
- `cloudflare/email-inbound/worker.js` (new, no dependency; the owner deploys it): `email(message, env)`: `rawSize` above 4 194 304 →
  `setReject('Message too large: the limit is 4 MB')`; else the raw read once into an `ArrayBuffer` and `POST env.INBOUND_URL` with
  `authorization: Bearer <env.INBOUND_EMAIL_SECRET>`, `content-type: message/rfc822`, `x-envelope-from`, `x-envelope-to`; a thrown fetch or a
  non-2xx answer → `setReject('Temporary failure: please send the message again later')`; nothing logged but the status.
- `src/app/api/email/inbound/route.ts` (new, `POST` only): no `INBOUND_EMAIL_SECRET` → 503; a missing or wrong bearer (`timingSafeEqual`) →
  401; a body above 4 194 304 bytes → 413; a recipient (`x-envelope-to`) whose local part (without `+tag`) is not `support` or `sales`, or
  whose domain is not the domain of `CONTACT_SUPPORT_EMAIL` or a subdomain of it → 422; then `processInboundEmail`; a stored or deliberately
  dropped message → 200; a failed write → 500 (the Worker rejects, the sender is told).
- `src/modules/contacts/lib/inboundEmail.ts` (new, `server-only`) `processInboundEmail(raw, envelope)`: `PostalMime.parse`; the sender is the
  header From address, lower-cased, a plain address (`isPlainEmail`) else 422; the trusted result is the topmost `Authentication-Results`
  header only (Cloudflare "prepends" it), and only when its authserv-id is exactly `mx.cloudflare.net` — any lower or other one is ignored, so a
  header the sender wrote is never trusted; in order: its `message_id` already in either table → 200 `duplicate`; the From or envelope
  sender's domain is `lero.al` or a subdomain → `dropped_loop`; `Auto-Submitted` other than `no`, `Precedence` `bulk|junk|list|auto_reply`,
  `X-Autoreply` or `X-Autorespond` → `dropped_auto`; more than 5 rows from the sender in the last hour or more than 100 `email` rows in the last
  24 hours → `dropped_limit`. Join, all three required: an id of `In-Reply-To` or `References` (at most 50) equals the stored `message_id` of
  the inquiry or of one of its replies (either direction); the sender equals that inquiry's `email`; the trusted result says `dmarc=pass`.
  Anything less → a new inquiry. Joined: the inquiry's `status` = `new` first (closed ones too), then an `inbound` reply row
  (`from_email`, body, `message_id`, `attachments`). New: `source='email'`, `topic='other'`, `custom_subject` = the subject on one line (≤ 200),
  `name` = the From name or the local part (≤ 200), `email`, `target_mailbox` = `CONTACT_SUPPORT_EMAIL` or `CONTACT_SALES_EMAIL` by the
  recipient's local part, `requester_ip` null. Body = `text`, else `html` through `sanitize-html` with no tag and no attribute and the five XML
  entities decoded, ≤ 20 000 characters. `attachments` = at most 20 `{ filename ≤ 200, size, content_type }`; no content kept. A unique
  violation on `message_id` → `duplicate`. Log lines carry the outcome and error codes only.
- `src/modules/contacts/actions/index.ts` `submitContactInquiry`: the notification call and its result handling (`:126-146`) and the
  `sendContactInquiryNotification` import leave; the action returns `{}` after the save (the return type keeps its codes for the unchanged
  form, O1045-1, Task 1006); `isRateLimited` counts `source = 'form'` rows only. `sendInquiryReply`: `In-Reply-To` = the newest stored
  `message_id` of the thread (the inquiry's or a reply's), `References` = the thread's stored ids, oldest first, the last 20; none stored →
  no header; after a sent mail, `getSentMessageId(id)` and the reply row's `message_id` updated (a failed read leaves it null and the reply
  stays sent); for an inquiry with `source = 'email'` the subject is `Re: <custom_subject>`, for a form inquiry the template's as today.
- `src/modules/notifications/lib/emails/send.ts`: optional `headers?: { 'In-Reply-To'?: string; References?: string }` passed to Resend only
  when given; each value 1-20 tokens `<[^<>\s@]{1,128}@[^<>\s]{1,128}>` separated by one space, else `send_failed` (header-injection guard);
  new `getSentMessageId(id)` (`emails.get`, the `message_id` when it matches the same token pattern, else null). Every other caller
  passes no `headers` and is byte-identical.
- `src/modules/notifications/lib/emails/contactInquiry.ts` `sendContactInquiryReply`: optional `headers` and `subject` passed through; the
  body template unchanged.
- `src/modules/contacts/lib/inquiryReplies.ts` selects `direction, from_email, attachments`; the two admin pages select `source, attachments`.
- `src/components/admin/AdminInquiriesManager.tsx`: `InquiryRow` + `source`, `attachments`; `ReplyRow` + `direction`, `from_email`, `attachments`.
- `src/components/admin/InquiryDetailDialogView.tsx`: an `inbound` row's header shows `MantineBadge` tone `neutral` with
  `admin.inquiries.customer_message` and its `from_email` instead of a staff name; under the message and under each row with attachments, the
  title `admin.inquiries.attachments_not_kept` and one `Text size="sm"` line per file, "<filename> (<size> KB)"; plain text only (`renderLines`).
- `src/stories/fixtures/admin.fixtures.ts`, `src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx`: an e-mail inquiry with two
  attachments and an inbound reply (new exports `EmailThread`, `LongAttachmentName`).
- `messages/{sq,en,uk,it}.json` `admin.inquiries`: `customer_message` (sq `Mesazh nga klienti`, en `Message from the customer`, uk
  `Повідомлення від клієнта`, it `Messaggio del cliente`), `attachments_not_kept` (sq `Bashkëngjitje (nuk ruhen)`, en `Attachments (not
  kept)`, uk `Вкладення (не зберігаються)`, it `Allegati (non conservati)`).
- `docs/env.md`: `INBOUND_EMAIL_SECRET` (server-only, at least 32 random bytes, the same value in the Worker). `package.json` and the lockfile:
  `postal-mime@4.2.1` exactly.
- Dependencies: `postal-mime@4.2.1` — `npm view` 2026-11-25: first release 2021-01-12, 4.2.1 of 2026-11-10 (15 days), no dependencies,
  MIT-0, scripts `prepare` (build; not run for a registry install, and `.npmrc` sets `ignore-scripts=true`).
- Out of scope: every other sending path, Supabase Auth mail and every template body; attachment content (O1044-4); `ContactForm.tsx` and
  its two unreachable branches (Task 1006, O1045-1); the Cloudflare, DNS and Vercel settings (the owner's, in the plan).
- Kept as on `main` (A2): the form's validation, limit numbers, save, `save_failed` and `no_mailbox`; `sendInquiryReply` sender, Reply-To,
  body, writes and errors, and the subject of a form inquiry; the dialog's sections, order, labels, composer and footer; the staff rows'
  look; every other route.

## Attack surface

Changed: a public route, service-role writes of stranger text shown to staff, an outside Worker holding a secret, two tables' columns.
1. **What are we working on?** Anyone can POST to `/api/email/inbound`; only the Worker knows the secret. Cloudflare's MX accepts mail for the routed addresses, checks SPF, DKIM, DMARC and block lists, and runs the Worker. The route writes with the service role; staff (admin, moderator with `inquiries.manage`) read the rows.
2. **What can go wrong?**
   - T1 S: a forged POST creates inquiries → mitigate: the bearer secret compared in constant time before the body is read; no secret 503 → AC1, `SEC-1044-INBOUND-DENY`.
   - T2 T: a retried or repeated delivery is stored twice → mitigate: unique `message_id` → AC2.
   - T3 S: a forged mail joins another customer's thread → mitigate: a stored id, the inquiry's own address and `dmarc=pass` from the topmost
     `mx.cloudflare.net` result only; a sender-written result is ignored → AC3.
   - T9 T: a stored id injects a header into a staff reply → mitigate: the token pattern in `sendEmail` and in `getSentMessageId` → AC11.
   - T4 D: a flood fills the admin → mitigate: Cloudflare's checks, 5 per sender per hour, 100 per 24 hours, 4 MB → AC4.
   - T5 D: a loop or an auto-reply storm → mitigate: own-domain senders and automatic mail dropped; no mail is sent in answer → AC5.
   - T6 T/I: HTML or script in a mail runs in the admin → mitigate: stored as text, rendered as text → AC7.
   - T7 R: a mail is acknowledged but lost → mitigate: 200 only after the write; any failure 5xx, and the Worker rejects so the sender knows → AC8.
   - T8 I: mail for another address of the domain reaches the admin → mitigate: Cloudflare rules for two addresses; the route's 422 → AC1.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: `SEC-1044-INBOUND-DENY` — no, a wrong and a too-short bearer → 401, nothing parsed or written; the right bearer → processed.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-25, upstream `05861f28`).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the route, the Worker, the writes and the columns — AC1, AC8, AC9.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every POST is checked for the secret before the body is read — AC1.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — no secret configured answers 503 and reads nothing — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the check runs in the route itself, then the recipient check — AC1.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-1044-INBOUND-DENY` fails when the check is removed — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix row runs per bearer case; the new constraints against the real database — AC1, AC9.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — mail stored as text, rendered as text, the client-sink gate refuses an HTML sink — AC7.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — every tag and attribute is removed before storage and no HTML is rendered — AC7.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — no mail text reaches a sink or a link — AC7.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — grants and policies unchanged; only the service role writes — AC9.
- Denial_of_Service: "Using validation that is cheap in resources first" — the secret and the size run before parsing; the limits before any write — AC1, AC4.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the SBOM job covers the new package — AC10.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — attachment content is never kept or served; only its name, size and declared type are shown as text — AC7.
- GraphQL: "Ensure that the API has proper access control checks." — the Data API has no write grant on the two tables, unchanged — AC9.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the route authorizes the Worker by its secret before the service role writes — AC1.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — writes go through the Supabase client; the SQL is static DDL — AC9.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — the recipient, the sender, the size and every header value sent are checked before use — AC1, AC8, AC11.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — a message joins an inquiry only when its sender is that inquiry's address — AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the id token and header patterns are anchored and bounded, the inputs capped first — AC3, AC11.
- Key_Management: "a single key should be used for only one purpose" — `INBOUND_EMAIL_SECRET` only authenticates the Worker — AC1.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — log lines carry outcomes and codes, never an address, subject or body — AC2.
- Logging_Vocabulary: not applicable — the shared security-event helper is Task 1026; this task logs outcome codes only.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — each row is built from named fields, never from a spread of the parsed mail — AC3.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — `In-Reply-To` and `References` only select a candidate; the sender and `dmarc=pass` decide — AC3.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — `postal-mime@4.2.1` read with `npm view`: no dependency, MIT-0, scripts off by `.npmrc` — AC10.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the route is a public POST and checks its secret first — AC1.
- Nodejs_Security: "When logging untrusted input, sanitize or encode newline characters and control sequences to mitigate log injection attacks" — no received text is logged at all — AC2.
- Prototype_Pollution_Prevention: "If objects have to be used then they should be created using the Object.create(null) API" — parsed headers are read by name into a `Map`, never merged into an object — AC5.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — no SQL is built from mail text — AC9.
- REST_Security: "Return 401 for a missing or invalid key, and 403 for a valid key that lacks access to the resource." — a missing or wrong bearer answers 401 — AC1.
- React_Security: "Without sanitization, it allows injected scripts to execute in the browser." — the dialog renders received text and file names as React text only — AC7.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the Supabase client binds every value — AC9.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the secret is server-only and a Worker secret, never logged or returned, listed in `docs/env.md` — AC1.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads this diff against this kickoff — AC10.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — the one package was read on the registry with its history — AC10.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T8 each became an acceptance criterion — AC1-AC8.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the route accepts only the Worker's secret; the Worker runs only on Cloudflare's routing rule — AC1, AC8.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — `postal-mime` is pinned to `4.2.1` with `--save-exact` — AC10.
- Subdomain_Takeover_Prevention: not applicable — no CNAME is added; the owner's MX records point at Cloudflare's own mail hosts, and DNS monitoring is Task 961.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them — AC1-AC9.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — no sender IP or address is logged; `requester_ip` stays null for mail — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and breaks — AC10.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the audit job checks the new package — AC10.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — received text is rendered as React text — AC7.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the envelope headers, the size and the parsed fields are checked before use — AC1, AC8.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the sanitizer only flattens HTML to text; the defence is text rendering — AC7.

## UI

The inquiry dialog only: `InquiryDetailDialogView` and its Story `src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx`; reused
`MantineBadge` (`src/stories/mantine/primitives/Badge.stories.tsx`) and Mantine `Text size="sm"`; no new component, no `style`, `className`
or literal (U3); U4: both directions keep the reply `Paper` (`InquiryDetailDialogView.tsx:125`); U7: no table, the From line and file names
wrap (GR-3i), spacing from `MantineDialogSections`; U11: thread, no attachments (no list), replies not loaded (the existing alert), a
200-character file name (`LongAttachmentName`), no loading or action state (read-only lines); U12: theme colours, the customer row named by
text, not colour; no new control.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/InquiryDetailDialogView.tsx — the replies section's inbound rows and the attachment name lists under the message and the rows
- Component families: overlay-and-disclosure, record-list-and-data
- Pattern IDs: overlay-adaptive, linear-flow
- Standards: apple-hig-sheets, android-adapt-layouts, w3c-reflow, w3c-focus-order, w3c-hover-focus, android-common-layouts, w3c-meaningful-sequence, apple-hig-layout, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineModal.tsx, src/design-system/mantine/patterns/MantineDialogSections.tsx
- Mobile range and switches: below 640px (theme.other.mobileGate / sm) the structured `MantineModal` is its bottom sheet and each file name
  is one full-width line; at the 640px transition the centred dialog; no other threshold
- Mobile order: facts; status; message; its attachment names; each row (badge or staff name, date, text, attachment names); composer; Close and Send reply
- Required-content treatment: wrap — file names and addresses wrap at any point; no clipping
- Story and verification: src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx (`EmailThread`, `LongAttachmentName`, `WithReplies`); 320, 639, 640, 1440; sq, en, uk, it

## Acceptance criteria

- AC1 `SEC-1044-INBOUND-DENY`; no secret → 503; a body above 4 MB → 413; a recipient other than support@ or sales@ of the domain or a
  subdomain → 422; nothing parsed or written in each case — test: `src/app/api/email/inbound/__tests__/route.security.test.ts` (new).
- AC2 The same `Message-ID` twice stores one row and answers 200 both times, also when the second write hits the unique index — test: `src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts` (new).
- AC3 An answer with a stored id, from the inquiry's address and with `dmarc=pass` in the topmost `mx.cloudflare.net` result joins its
  inquiry, closed before, which becomes `new`; without the id, from another address, with `dmarc` other than `pass`, with the result only in a
  lower header or under another authserv-id, it opens a new inquiry and the other inquiry is unchanged — test: `inboundEmail.security.test.ts`.
- AC4 The sixth mail of a sender in an hour and the 101st in 24 hours are dropped, sliding windows — test: `inboundEmail.security.test.ts`.
- AC5 Mail from `lero.al` or a subdomain, and automatic answers, are dropped; no inbound path calls `sendEmail` — test: `inboundEmail.security.test.ts`.
- AC6 (Task 1045) A saved form message answers `{}` and sends no notification; a failed save answers `save_failed`; form rows alone count
  toward the form limit — test: `src/modules/contacts/actions/__tests__/contacts.security.test.ts`, `src/modules/contacts/actions/__tests__/contactFormLimit.security.test.ts` (both changed).
- AC7 An HTML-only mail (`<script>`, `<img onerror>`) is stored as text; the dialog renders a stored `<b>` and file name as text, and an
  inbound row with its badge and address — test: `inboundEmail.security.test.ts`, `src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx` (new).
- AC8 A failed write answers 500 and nothing half-written answers 200; the Worker rejects above 4 MB, on a thrown fetch and on a non-2xx, and
  posts the raw bytes with the bearer and both envelope addresses — test: `inboundEmail.security.test.ts`, `cloudflare/email-inbound/worker.test.ts` (new).
- AC9 After `task1044.sql`: the checks refuse a wrong `source`, `direction` and an inbound row with `replied_by`; the unique index refuses a
  second `message_id`; `db-catalog-audit.mjs` exits 0 — test: `src/tests/integration/inboundEmail.integration.test.ts` (new).
- AC10 CI passes — test: `gh pr checks <n>` after every check concluded.
- AC11 A staff reply carries `In-Reply-To` and `References` from the thread's stored ids, `Re: <subject>` for an e-mail inquiry, and stores
  its sent `message_id`; a header value with a line break, a space inside a token or more than 20 tokens is refused; a call without
  `headers` sends exactly as before — test: `src/modules/notifications/lib/emails/__tests__/send.security.test.ts` (extended), `contacts.security.test.ts`.

## Route

0. Owner first: `task1044.sql` once written and read by the reviewer (AC9 waits). The Worker, Cloudflare and the live verification come after the merge (the plan).
1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1-AC8); save each failing output.
3. The owner stops Storybook and runs `npm install --save-exact postal-mime@4.2.1` (`project-facts.md`); then the SQL files,
   `database.ts`, `inboundEmail.ts`, the route, the Worker, the action, the loader and pages, the manager, the view, the Story and
   fixtures, the messages, `docs/env.md`; after the owner applies the SQL, `db-catalog-audit.mjs --save supabase/catalog.json`.
4. Run: `npm run typecheck`; `npm test -- src/app/api/email/inbound/__tests__/route.security.test.ts src/modules/contacts/lib/__tests__/inboundEmail.security.test.ts src/components/admin/__tests__/InquiryDetailDialogView.inbound.test.tsx cloudflare/email-inbound/worker.test.ts src/__tests__/reactHooksV7Components.test.tsx src/__tests__/reactHooksV7Shells.test.tsx src/__tests__/security/serverEntryGuards.test.ts src/app/[locale]/auth/verified/__tests__/page.test.tsx src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx src/components/admin/__tests__/AdminCompaniesManager.logo.security.test.tsx src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/components/admin/__tests__/AdminPagesView.test.tsx src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/components/admin/__tests__/AdminShell.pages.test.tsx src/components/admin/__tests__/AdminSidebar.pages.test.tsx src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx src/components/admin/__tests__/AdminUserCreate.watch.test.tsx src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/components/admin/__tests__/StackedConfirmDialogs.test.tsx src/components/admin/__tests__/StatusChangeSelect.test.tsx src/components/admin/__tests__/adminDeleteDialog.security.test.tsx src/components/admin/__tests__/adminPagesContent.test.ts src/components/admin/__tests__/adminPagesHydration.test.tsx src/components/admin/__tests__/savedRowRelativeTime.test.tsx src/components/layout/__tests__/FooterView.security.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx src/components/layout/__tests__/Header.signOut.test.tsx src/components/layout/__tests__/sessionEnded.security.test.tsx src/components/shared/__tests__/Combobox.portal.test.tsx src/components/ui/__tests__/overlays.test.tsx src/components/ui/__tests__/primitives.test.tsx src/components/ui/__tests__/uiPrimitivesExtra.test.tsx src/design-system/mantine/__tests__/badgeTones.test.ts src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/lib/auth/__tests__/controller.test.ts src/lib/auth/__tests__/moderatorKeys.security.test.ts src/lib/auth/staffAccess.security.test.ts src/modules/__tests__/rls-write-guards.smoke.test.ts src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/admin/dashboard/components/__tests__/AdminDashboardView.axis.test.tsx src/modules/auth/__tests__/AuthContext.test.tsx src/modules/auth/components/AuthSheet.banned.security.test.tsx src/modules/auth/components/ResetPasswordClient.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.registerAgent.test.tsx src/modules/auth/components/__tests__/AuthSheet.test.tsx src/modules/auth/components/__tests__/authClientParts.test.tsx src/modules/auth/components/__tests__/resetPassword.test.tsx src/modules/auth/components/__tests__/staleSession.security.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/modules/cabinet/statistics/__tests__/portfolio.test.ts src/modules/cabinet/statistics/components/__tests__/AgentStatisticsView.axis.test.tsx src/modules/listings/actions/ownerPublish.security.test.ts src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx src/modules/listings/components/__tests__/CollectionsSection.delete.test.tsx src/modules/listings/components/__tests__/ListingAccessRestrictedView.security.test.tsx src/modules/listings/components/__tests__/ListingCard.hydration.test.tsx src/modules/listings/components/__tests__/ListingContact.bot.security.test.tsx src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx src/modules/listings/components/__tests__/ListingInquiryDialog.bot.security.test.tsx src/modules/listings/components/form/__tests__/fieldContracts.test.tsx src/modules/listings/components/listingStatusOptions.security.test.tsx src/modules/listings/domain/__tests__/listingConstants.test.ts src/modules/listings/domain/__tests__/listingDomain.test.ts src/modules/listings/domain/__tests__/similarity.test.ts src/modules/listings/domain/listingTransitionEngine.test.ts src/modules/listings/domain/ownerStatusRules.security.test.ts src/modules/listings/lib/__tests__/listingStatusTone.test.ts src/modules/listings/lib/__tests__/visibility.test.ts src/modules/notifications/components/__tests__/NotificationBellView.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx src/stories/fixtures/__tests__/ListingFormHarness.test.tsx src/__tests__/security/staffActions.test.ts src/app/api/auth-email-hook/__tests__/recoveryUrl.smoke.test.ts src/app/api/auth-email-hook/__tests__/route.security.test.ts src/app/api/auth-email-hook/__tests__/unhandledType.test.ts src/app/api/auth-email-hook/authEmailHook.security.test.ts src/app/api/cron/__tests__/jobsPaused.security.test.ts src/app/api/cron/inactivity/__tests__/inactivity.security.test.ts src/app/api/cron/inactivity/__tests__/route.auth.test.ts src/app/api/cron/price-alerts/__tests__/route.auth.test.ts src/app/api/cron/saved-searches/__tests__/route.auth.test.ts src/modules/contacts/actions/__tests__/contactFormLimit.security.test.ts src/modules/contacts/actions/__tests__/contacts.security.test.ts src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts src/modules/listings/actions/__tests__/rateLimits.security.test.ts src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/notifications/lib/__tests__/sendTemplatedEmail.security.test.ts src/modules/notifications/lib/emails/__tests__/emailChange.test.ts src/modules/notifications/lib/emails/__tests__/emailInjection.security.test.ts src/modules/notifications/lib/emails/__tests__/messageBuilders.security.test.ts src/modules/notifications/lib/emails/__tests__/send.address.test.ts src/modules/notifications/lib/emails/__tests__/send.security.test.ts`; `npm run test:security-integration -- src/tests/integration/inboundEmail.integration.test.ts src/tests/integration/inquiryReplies.integration.test.ts`;
   `node scripts/quality/db-catalog-audit.mjs` (checklist D10: every test importing a changed module or `messages/<locale>.json`, found
   2026-11-25 by import). Deliberate breaks: the bearer check skipped → AC1 fails; the duplicate check and the index catch removed → AC2 fails;
   the sender rule, the `dmarc=pass` rule or the topmost-header rule removed → AC3 fails; the sender limit removed → AC4 fails; the
   own-domain rule removed → AC5 fails; the write-before-200 order inverted → AC8 fails; the header pattern removed → AC11 fails; each restored.
5. Measure the dialog (I8a): `EmailThread`, `LongAttachmentName`, `WithReplies` at 320, 639, 640, 1440 px, four languages. 6. Report: each
   command, exit code, relevant output, each failing-first and break output.

## Review
- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_1044_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_1044_Review_2.md)
- [Review 3 — APPROVED WITH NOTES](../../docs/reviews/Task_1044_Review_3.md)
