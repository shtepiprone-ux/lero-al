# Task 1044 — plan, DNS changes, rollback and the owner's verification

Companion of [the kickoff](../Archive/Sprint_94_kickoff_prompt_Task_1044_Mail_To_Support_And_Sales_Reaches_The_Admin.md). Architecture approved by the
owner on 2026-11-25: Cloudflare Email Routing and Workers Free receive, Resend Free only sends; $0 a month; no R2 bucket, queue or mail cron.
Facts read 2026-11-25 on developers.cloudflare.com and resend.com.

## Owner decisions of 2026-11-25 (translated)

- Priorities: "zero additional monthly fee, minimal changes of the code base, no needless infrastructure and enough reliability for the MVP".
- O1044-1: "Disable the internal staff e-mail notifications." O1044-2: "Keep the addresses support@lero.al and sales@lero.al."
- O1044-3: "Keep Resend Free for sending ... so that inbound mail does not spend the Resend quota"; "Do not move to Workers Paid or Resend Pro."
- O1044-4: "Do not implement permanent storage of attachments for now"; attachment metadata kept; "Do not use the public bucket lero-media
  for private correspondence."
- O1044-5: "When a customer's answer is received, move the inquiry to status new, keeping the correspondence history."
- "Do not rewrite the existing e-mail sending system. Do not implement additional mail-provider adapters. Do not create needless
  abstractions." "The raw MIME message limited to 4 MB." "Confirm a received mail only after it is reliably stored in the database." "Route
  by the actual SMTP recipient, not only the To header. To join answers to inquiries, check that the sender belongs to the correspondence. Do
  not rely only on Message-ID." "Task 1045 may be closed as absorbed by Task 1044 if all its acceptance criteria are met within Task 1044."
- Comparison that led here: Resend counts received mail in the sending quota ("This quota includes both sent and received emails"), which
  O1044-3 refuses; Cloudflare's inbound routing is "Unlimited" on Workers Free and separate from Resend.

## Architecture

1. A customer writes to support@ or sales@ (`lero.al`, or `mailtest.lero.al` during the verification).
2. Cloudflare's MX takes the mail; DMARC-failing mail, mail failing both SPF and DKIM, block-listed senders and unknown addresses are refused
   by Cloudflare. A routing rule per address sends it to the Worker `lero-email-inbound`.
3. The Worker (`cloudflare/email-inbound/worker.js`): above 4 MB → rejected ("Message too large"); else the raw MIME is POSTed to
   `https://lero.al/api/email/inbound` with the shared secret and the envelope sender and recipient. A failed or non-2xx answer → rejected
   ("Temporary failure: please send the message again later"); the sending server then reports it to the sender. No retry, no buffer.
4. The route checks the secret, the size and the recipient, parses the MIME (`postal-mime`) and answers 200 only after the row is written.
5. Duplicates (same `Message-ID`), our own domain, automatic answers and floods are dropped with 200 (no bounce loop).
6. An answer joins its inquiry only when all three hold: `In-Reply-To`/`References` names a stored message id of that inquiry; the sender is
   the inquiry's own address; the topmost `Authentication-Results` header, from `mx.cloudflare.net` only, says `dmarc=pass` (a header the
   sender wrote lower in the message is ignored). The inquiry becomes `new`, closed ones included; the answer is an `inbound` row of its
   thread. Anything less opens a new inquiry (`source = email`).
7. Attachments: name, size and type are stored and shown; their content is not kept anywhere.
8. Staff answer from the dialog as today; the only additions (owner, 2026-11-25: "if it needs only minimal changes ... implement it within
   1044"): `In-Reply-To` and `References` from the thread's stored ids, `Re: <subject>` for an inquiry that came by mail, and the reply's
   `message_id` read back from Resend (`GET /emails/{id}`) and stored, so the customer's answer carries an id we know.
9. The contact form no longer e-mails staff; a saved message always answers success (Task 1045, absorbed).

## Database changes (`supabase/sql_migrations/task1044/`, the owner applies)

| Table | Change |
|---|---|
| `contact_inquiries` | `source` (`form`/`email`, default `form`), `message_id`, `attachments` (jsonb, default `[]`); unique index on `message_id` where not null |
| `contact_inquiry_replies` | `direction` (`outbound`/`inbound`, default `outbound`), `from_email`, `message_id`, `attachments`; check: an inbound row has no `replied_by`; unique index on `message_id` where not null |

No new table or function; grants and policies unchanged; existing rows keep working (defaults, nullable columns).

## Free-plan limits that apply (documented)

Inbound "Unlimited"; message "25 MiB" (ours: 4 MB, the Vercel body limit is 4.5 MB); routing rules "200" per domain; Workers Free
"100,000/day" requests, "10 ms" CPU per invocation (waiting on `fetch` not counted), "128 MB"; Workers Logs on Free, "3 Days", with CPU time in
the invocation log. Not documented, therefore measured below: the CPU of reading and posting a 4 MB message, and what a sender receives when
the Worker throws or exceeds its CPU.

## Owner steps after the merge (no model does them)

1. **Vercel** → Settings → Environment Variables, Production: `INBOUND_EMAIL_SECRET` = 32+ random bytes (Sensitive); redeploy. Until it is
   set the route answers 503 and nothing is received.
2. **Cloudflare** → Workers & Pages → Create → Worker `lero-email-inbound`: paste `cloudflare/email-inbound/worker.js`; Variables:
   `INBOUND_URL=https://lero.al/api/email/inbound`, secret `INBOUND_EMAIL_SECRET` (the same value); observability on (default for new Workers).
3. **Cloudflare** → Compute → Email Service → Email Routing → `lero.al` → Settings → Subdomains → add `mailtest.lero.al`. Cloudflare adds the
   subdomain's records ("Cloudflare adds the required DNS records to the subdomain"). If this form is not reachable before Email Routing is
   enabled on `lero.al`, stop and use "DNS changes for lero.al" below only after the owner's approval.
4. Routing rules (literal; catch-all stays off — "Catch-all rules are only available for the apex domain"): `support@mailtest.lero.al` and
   `sales@mailtest.lero.al` → Send to a Worker → `lero-email-inbound`.

Done 2026-11-25. Steps 1-2 by the owner; the secret was generated again and set in both places, then Vercel was redeployed (route: 401
without the secret). Steps 3-4 by Opus in the owner's Cloudflare at the owner's request ("ти ж сам можеш ці кроки зробити"): subdomain
`mailtest.lero.al` Enabled (MX `route1-3.mx.cloudflare.net`, TXT SPF); rules `support@` and `sales@mailtest.lero.al` → `lero-email-inbound`
Active, catch-all Disabled. Adding the subdomain also enabled Email Routing on `lero.al` and published two root records:
`TXT lero.al v=spf1 include:_spf.mx.cloudflare.net ~all` and `TXT cf2024-1._domainkey.lero.al` (DKIM). The root MX is unchanged
(`MX lero.al 0 lero.al`), so no mail to `@lero.al` is routed; `send.lero.al`, `resend._domainkey`, `_dmarc` are unchanged (public DNS read).

Workers Logs (found on V1, 2026-11-25): with "Include invocation logs" on, Cloudflare stores the sender's address in every invocation
(`mailFrom`, `trigger`). Owner decision, 2026-11-25: unchanged during the verification (the CPU time is only in these records, needed for V1
and V5); "Include invocation logs" or all Workers Logs are turned off before the root MX is switched.

## Verification on `mailtest.lero.al` (before the root domain)

| # | Scenario | How | Expected |
|---|---|---|---|
| V1 | Sizes | from an outside mailbox to `support@mailtest.lero.al`: plain text; 1 MB attachment; 3.5 MB attachment | three inquiries on Support Inbox with their attachment names; Workers Logs: outcome ok, CPU time per size recorded |
| V2 | Too large | a 5 MB attachment | the sender gets a rejection naming the 4 MB limit; no inquiry |
| V3 | Vercel unavailable | Worker variable `INBOUND_URL=https://unreachable.invalid/` (temporarily) | the sender gets the temporary-failure rejection; no inquiry; restore the variable |
| V4 | Vercel API error | Worker secret changed to a wrong value (temporarily) | the route answers 401; the sender gets the temporary-failure rejection; restore |
| V5 | Worker CPU exceeded | a copy of the Worker with a 50 ms busy loop before the POST, bound to `sales@mailtest.lero.al` (temporarily) | record what the sender receives and Workers Logs `EXCEEDED_CPU`; this is the undocumented case |
| V6 | Repeated delivery | a copy of the Worker that POSTs the same message twice (temporarily) | one inquiry; both answers 200 |
| V7 | Customer answer | close the V1 inquiry; staff reply from the dialog to the V1 sender; the sender answers it, To changed to `support@mailtest.lero.al` (the root is not routed yet) | the answer joins the V1 inquiry, which is `new` again; the staff reply and the answer are one conversation in the sender's mail program (Gmail, Outlook) |
| V8 | Sending after routing | a password-reset mail and a staff reply after step 3 | both arrive; their headers show `dkim=pass` and `dmarc=pass` for `lero.al` |
| V9 | Forged answer | from a second mailbox, an answer to the V7 thread with the same `In-Reply-To`/`References` (copy the headers, or reply from a forwarded copy); if a tool that sets `From` is at hand, also a mail with the V1 sender's address as `From` from another server | each opens a new inquiry or is rejected by Cloudflare; the V1 inquiry gains nothing |

Results, 2026-11-25 (sent by Opus from the owner's Gmail at the owner's request; random-byte attachments, no personal data):

| # | Mail | Raw size (Workers Logs) | Worker | Route | Admin |
|---|---|---|---|---|---|
| V1 | plain text | 7 334 B | CPU 0 ms, status 200 | `stored` | Support inquiry, `new` |
| V1 | 1 MB attachment | 1 442 592 B | CPU 1 ms, status 200 | `stored` | Support inquiry, attachment `v1-test-1mb.bin (1024 KB)` |
| V1 | 3.5 MB attachment | 5 029 837 B | CPU 0 ms, rejected before the POST | — | none; sender got `555 5.7.1 Message too large: the limit is 4 MB` |

The 4 MB limit is on the raw message: base64 makes an attachment about 1.38 times larger (1 442 592 / 1 048 576), so the largest
attachment that passes is about 3 MB. The 3.5 MB row of V1 cannot pass; it already shows the V2 rejection. In its place (owner, 2026-11-25):

| V1 | 2.9 MB attachment | 4 168 923 B | **CPU 7 ms**, wall 3.7 s, status 200 | `stored` | Support inquiry, attachment `v1-test-2-9mb.bin (2970 KB)` |

Open: 7 ms of the Workers Free 10 ms CPU limit for a message just under the 4 MB cap is not "well under 10 ms" (the pass condition
below). One sample each; CPU grows with size (0 ms at 7 KB, 1 ms at 1.4 MB, 7 ms at 4.2 MB).

Owner decision, 2026-11-25 (on "staff cannot open the attachment, so what is the point"): attachments become openable from the admin. A
new task stores each received message and its attachments in private R2 (staff open them through short-lived links only); the Worker
streams the raw message to R2 and hands the route its key, which removes the 4 MB cap and the CPU risk. This supersedes the "no R2
bucket" part of the $0 decision; the cost stays $0 within the R2 free tier. V1 sizes and V5 are measured again after that task.

Owner decisions, 2026-11-25 (answers to the design questions of the follow-up; split by checklist D4 into Tasks 1046, 1047, 1048):
- O1046-1: a new private R2 bucket with no public domain and an API token for that bucket only; the existing listing-photo bucket is public
  and is not used for mail.
- O1046-2: the message limit becomes 25 MB, Cloudflare Email Routing's own maximum ("Inbound message size | 25 MiB").
- O1047-1: staff preview images and PDF in the browser; every other file is downloaded.
- O1048-1 (translated): "the admin also needs a function to delete conversations. When a conversation is deleted, the files kept in
  Cloudflare R2 for that conversation are deleted too." A file lives as long as its conversation.
- O1048-2: only an administrator deletes a conversation (inquiry, every reply, its R2 files), after a confirmation dialog; a moderator
  reads and answers but has no delete control.
- O1049-1 (translated): "also develop automatic deletion of a conversation after 180 days, from the admin and the files of that
  conversation from Cloudflare R2"; the 180 days count from the conversation's last message, of the customer or of staff (Task 1049).

Owner steps for Task 1046, after its merge and before the Worker is replaced: (1) Cloudflare → R2 → Create bucket `lero-inbound-mail`,
no public access, no custom domain; its Settings → Object Lifecycle Rules → Add rule: prefix `inbound/`, delete after 1 day. (2) R2 → Manage
API tokens → Create: Object Read & Write, this bucket only. (3) Vercel Production: `R2_MAIL_BUCKET_NAME`, `R2_MAIL_ACCESS_KEY_ID`,
`R2_MAIL_SECRET_ACCESS_KEY` (Sensitive); redeploy. (4) Worker `lero-email-inbound` → Settings → Bindings → R2 bucket: `INBOUND_BUCKET` →
`lero-inbound-mail`; then paste the new `worker.js` and deploy. Then V1 is repeated with 1 MB, 10 MB and 24 MB attachments.
Bucket created 2026-11-25 by Opus at the owner's request ("ти ж сам можеш створити backet"): `lero-inbound-mail`, Eastern Europe (EEUR),
Standard class, Public Access Disabled, no custom domain, Public Development URL disabled, no CORS policy; only Cloudflare's "Default
Multipart Abort Rule" (abort uploads after 7 days). Lifecycle rule added the same day by Opus at the owner's request ("так, додай"):
`delete-raw-inbound-after-1-day`, prefix `inbound/`, "Delete objects after 1 day(s)", Enabled. Token created by the owner the same day,
read by Opus: Account API token `lero-inbound-mail-api`, applied to `lero-inbound-mail` only, Object Read & Write, Active; Vercel Production
has `R2_MAIL_ACCESS_KEY_ID`, `R2_MAIL_SECRET_ACCESS_KEY`, `R2_MAIL_BUCKET_NAME` (Sensitive, Production only; names read, values not
decrypted). Separate from the listing-photo `R2_*` variables of 2026-11-24 (`lero-media-api`, `lero-media`). Only the binding is still open.

Pass: V1-V4 and V6-V9 as expected, and V1's CPU times well under 10 ms. V5 decides how a crash looks to a sender; the owner accepts the MVP
without automatic retries only after V2-V5 show that the sender is told the mail was not delivered (owner, 2026-11-25).

Rules during the verification (owner, 2026-11-25): no secret, mail content or customer data in any log, note or screenshot kept; Workers Logs
show only the status and CPU time, the route's lines only outcome codes. After the verification the test inquiries are deleted by the owner
in the Supabase SQL editor, replies first (the test mailboxes' addresses in place of the placeholders):
`delete from contact_inquiry_replies where inquiry_id in (select id from contact_inquiries where source = 'email' and email in ('<test-1>', '<test-2>'));`
then `delete from contact_inquiries where source = 'email' and email in ('<test-1>', '<test-2>');` — and the routing rules and the
`mailtest.lero.al` subdomain are removed once the root is switched. The root MX of `lero.al` changes only with the owner's separate approval.

## DNS changes for lero.al (only after the verification and the owner's approval)

Today (Cloudflare, read 2026-11-25): `MX lero.al 0 lero.al` (receives nothing); `TXT lero.al google-site-verification=…`; `MX send.lero.al
feedback-smtp.eu-west-1.amazonses.com 10`, `TXT send.lero.al v=spf1 include:amazonses.com ~all`, `TXT resend._domainkey.lero.al` (Resend);
`TXT _dmarc.lero.al v=DMARC1; p=none;`.

Change (Email Routing → `lero.al` → enable; Cloudflare writes the records): delete `MX lero.al 0 lero.al` (Cloudflare refuses "Non-Cloudflare
MX records exist"); add `MX lero.al route1.mx.cloudflare.net`, `route2`, `route3` (priorities assigned by Cloudflare); `TXT lero.al v=spf1
include:_spf.mx.cloudflare.net ~all`; `TXT cf2024-1._domainkey.lero.al` (DKIM). Unchanged: every `send.lero.al` and `resend._domainkey`
record, `_dmarc`, the Google verification TXT. Then rules `support@lero.al` and `sales@lero.al` → `lero-email-inbound`; catch-all off.

Rollback: Email Routing → `lero.al` → Settings → Disable ("removes every routing-related DNS record (MX, SPF, DKIM) that Email Service added
to the root domain"); then, to return to today's exact state, add back `MX lero.al 0 lero.al`. Sending through Resend is not affected either
way (its records are on `send.lero.al` and `resend._domainkey`). For the subdomain: remove `mailtest.lero.al` under Subdomains and delete any
record Cloudflare left on `mailtest.lero.al` (the documentation does not describe subdomain removal).
