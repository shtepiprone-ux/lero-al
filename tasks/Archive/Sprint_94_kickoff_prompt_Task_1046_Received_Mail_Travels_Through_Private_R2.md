# Task 1046 — A received mail travels to the route through a private R2 bucket, up to 25 MB

Sprint 94. Priority P1. Owner decisions 2026-11-25 ([plan](../Sprints/Sprint_94_Task_1044_Plan_And_Owner_Settings.md), "Owner decisions"): on the V1
results (translated) "staff cannot open the attachment, so what is the point" → attachments become openable from the admin, the Worker
streams the raw message to R2 and hands the route its key, "which removes the 4 MB cap and the CPU risk"; O1046-1 "a new private R2 bucket
with no public domain and an API token for that bucket only"; O1046-2 "the message limit becomes 25 MB, Cloudflare Email Routing's own
maximum". Split by checklist D4: 1046 (this transport), 1047 (attachments opened from the admin), 1048 (an administrator deletes a
conversation and its files), 1049 (a conversation is deleted 180 days after its last message). Implementer: Sonnet. Reviewer: Opus. Human
owner of the change: the owner.

## Goal

A mail above 4 MB is rejected (`cloudflare/email-inbound/worker.js:9-10`), and a 4.17 MB mail took 7 ms of the Workers Free 10 ms CPU
limit because the Worker reads the whole message into memory before it posts it as the request body. After the task the Worker streams the
message into a private R2 bucket without reading it and posts only its key; the route reads the message from that bucket, processes it as
today and deletes it. Mail up to 25 MB is received.

## Cause

Read at `1bf37a166`
- The Worker reads the whole message into one buffer and sends it as the body: `cloudflare/email-inbound/worker.js:15` (`new
  Response(message.raw).arrayBuffer()`), `:16-27` (`body: raw`); its limit is 4 MB: `:5`, `:9-10`.
- The route caps the body at 4 MB because a Vercel Function body is at most 4.5 MB: `src/app/api/email/inbound/route.ts:16-17`, `:44-45`,
  `:52-53`.
- `Workers Logs query: lero-email-inbound, 2026-11-25 21:18 (V1, 2.9 MB attachment)` → `"rawSize": 4168923, "outcome": "ok", "cpuTimeMs":
  7`; `21:12:34 (3.5 MB attachment)` → `"rawSize": 5029837`, the sender got `555 5.7.1 Message too large: the limit is 4 MB`.
- Cloudflare (read 2026-11-25): R2 binding `put()` takes a `ReadableStream` whose "length must be known: for example ... the readable half
  of a FixedLengthStream"; Email Routing "Inbound message size | 25 MiB ... Messages larger than this are rejected"; Workers Free "CPU time
  per HTTP request | 10 ms", "Waiting on fetch or KV does not count".
- `src/lib/media/r2.ts:33-37`: one R2 configuration, the public listing-photo bucket (`R2_BUCKET_NAME`, read by `R2_PUBLIC_URL` `:112-122`).

Fix: the Worker pipes `message.raw` through a `FixedLengthStream(message.rawSize)` into the mail bucket binding and posts `{ key }`; the route
checks the key, reads the object from the mail bucket with the mail bucket's own credentials, calls `processInboundEmail` unchanged and
deletes the object; the limit becomes 25 MiB in both.

## Scope

- `cloudflare/email-inbound/worker.js`: `MAX_MESSAGE_BYTES = 26214400`; above it `setReject('Message too large: the limit is 25 MB')`;
  `key = inbound/<crypto.randomUUID()>.eml`; `{ readable, writable } = new FixedLengthStream(message.rawSize)`; `message.raw.pipeTo(writable)`
  and `env.INBOUND_BUCKET.put(key, readable)` awaited together; then `POST env.INBOUND_URL` with `authorization: Bearer …`, `content-type:
  application/json`, `x-envelope-from`, `x-envelope-to`, body `JSON.stringify({ key })`, `redirect: 'manual'`; a thrown put or fetch, or a
  non-2xx answer → `env.INBOUND_BUCKET.delete(key)` (its failure ignored) and the temporary-failure reject; the header comment names the binding.
- `src/lib/media/r2.ts`: `settings()` takes the store, `'listing'` (today's `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) or
  `'mail'` (`R2_MAIL_ACCESS_KEY_ID`, `R2_MAIL_SECRET_ACCESS_KEY`, `R2_MAIL_BUCKET_NAME`; both on `R2_ENDPOINT`); every existing export uses
  `'listing'`. New `getMailObject(key, maxBytes)`: a GET on the mail bucket; 404 → null; a declared or real length above `maxBytes` → throws
  `R2TooLargeError` before or without keeping the bytes; else the bytes. New `deleteMailObjects(keys)`: as `deleteObjects`, on the mail bucket.
- `src/app/api/email/inbound/route.ts`: after the secret check, a declared body above 1 024 bytes → 413; then the recipient check (422) as
  today; the body read as JSON with one string `key` matching `^inbound/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.eml$`,
  else 422 `key`; `getMailObject(key, 26214400)`: null → 422 `missing`, too large → 413 (the object deleted), a failed read → 500; then
  `processInboundEmail(bytes, envelope)` unchanged; after any answer from it, `deleteMailObjects([key])`, a failure logged as `{ outcome:
  'raw_delete_failed' }` only. The header comment and `MAX_MESSAGE_BYTES` (26 214 400) follow.
- `docs/env.md`: `R2_MAIL_BUCKET_NAME`, `R2_MAIL_ACCESS_KEY_ID`, `R2_MAIL_SECRET_ACCESS_KEY` (server-only; a token for the mail bucket only).
- `cloudflare/email-inbound/worker.test.ts`, `src/app/api/email/inbound/__tests__/route.security.test.ts`,
  `src/lib/media/__tests__/r2.security.test.ts`: the cases of AC1-AC4.
- Dependencies: none (`aws4fetch` is already used by `r2.ts:2`).
- Out of scope: `processInboundEmail` and everything it stores (attachments are Task 1047); deleting conversations (1048, 1049); the
  bucket, its lifecycle rule, the token, the Worker binding and the Vercel variables (the owner's, in the plan, before the deploy).
- Kept as on `main` (A2): the route's order (503, 401, size, recipient 422), its answers and log lines; the Worker's temporary-failure
  text and status-only logging; `processInboundEmail`; every listing-photo export of `r2.ts` with the same variables, keys and calls.

## Attack surface

Changed: a new private bucket and token, the Worker's binding, and what the public route reads (a key instead of the message).
1. **What are we working on?** Anyone can POST to `/api/email/inbound`; only the Worker knows the secret. The Worker writes the raw mail into
   the mail bucket through its binding; the route reads and deletes it with the mail token. Nothing else reads that bucket.
2. **What can go wrong?**
   - T1 S: a forged POST → mitigate: the bearer check before anything is read, unchanged → AC2 (`SEC-1044-INBOUND-DENY` kept).
   - T2 T/I: a key from the request reads another object, another prefix or the listing bucket → mitigate: the anchored `inbound/<uuid v4>.eml`
     pattern before any R2 call, the mail functions bound to the mail bucket and token only, `assertKey` kept → AC2, AC3.
   - T3 I: raw customer mail stays in R2 → mitigate: the route deletes it after every answer of `processInboundEmail` and after a too-large
     read; the Worker deletes it when the post fails; the owner's lifecycle rule (prefix `inbound/`, 1 day) removes any left over → AC1, AC2.
   - T4 D: a 25 MB message exhausts memory or CPU → mitigate: Cloudflare rejects above 25 MiB; the Worker never buffers; the route refuses a
     declared or real length above 26 214 400 before keeping it; the sender limits of 1044 are unchanged → AC1, AC2, AC3.
   - T5 E: the mail token reaches the listing bucket or the listing token the mail → mitigate: separate variables per store; the owner scopes
     the mail token to that bucket only (Transfer: Cloudflare's token scope, set in the plan) → AC3.
   - T6 R: a stored-but-unposted mail is acknowledged → mitigate: 2xx only after the route's answer; any failure rejects the mail → AC1.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: `SEC-1046-KEY-DENY` — a key with `..`, another prefix, a listing key, a non-v4 id, a number or an array → 422 and no
   R2 call; the Worker's own key shape → read.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-25, upstream `05861f28`).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the bucket, the token, the binding and the key the route now reads — AC1-AC3.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every POST is checked for the secret before the key is read — AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a missing mail variable throws before any call; a failed read answers 500 and the Worker rejects — AC2, AC3.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the route checks the key's shape itself before the R2 read — AC2.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-1046-KEY-DENY` fails when the key pattern is removed — AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix row runs per key case — AC2.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — the body size, the JSON shape and the key pattern are checked before any read — AC2.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — the read and the delete take only a key of the Worker's own shape, in the mail bucket only — AC2, AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the key pattern is anchored with fixed-length groups — AC2.
- Key_Management: "a single key should be used for only one purpose" — the mail token serves the mail bucket only, the listing token the listing bucket only — AC3.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the Worker logs the status, the route the outcome code; never a key, address or content — AC1, AC2.
- Logging_Vocabulary: not applicable — the shared security-event helper is Task 1026; this task adds one outcome code only.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the route reads one named field, `key`, and nothing else of the body — AC2.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the route stays a public POST that checks its secret first — AC2.
- Nodejs_Security: "Never write sensitive data to application logs, including passwords, API keys, session tokens, authorization headers, or sensitive personal data." — no token, key or mail text is logged — AC1, AC2.
- OAuth2: not applicable — no OAuth flow is touched; the word comes from the Worker's `redirect: 'manual'` fetch option.
- Prototype_Pollution_Prevention: "If objects have to be used then they should be created using the Object.create(null) API" — no object is built from the body: one own string property, `key`, is read and nothing is merged — AC2.
- REST_Security: "Return 401 for a missing or invalid key, and 403 for a valid key that lacks access to the resource." — a missing or wrong bearer still answers 401 — AC2.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the mail token is server-only, listed in `docs/env.md`, never logged or returned — AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads this diff against this kickoff — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no new package; the executor follows this kickoff only — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T6 each became an acceptance criterion — AC1-AC3.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the route accepts only the Worker's secret; the bucket is written only through the Worker's binding — AC1, AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them — AC1-AC3.
- Unvalidated_Redirects_and_Forwards: "If used, do not allow the URL as user input for the destination." — the Worker posts only to `INBOUND_URL` and never follows a redirect (`redirect: 'manual'`, kept) — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and the breaks — AC4.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the body is one object with one string `key` of a fixed pattern — AC2.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The Worker rejects above 26 214 400 bytes with the 25 MB text and writes nothing; otherwise it puts a `FixedLengthStream` of exactly
  `rawSize` under `inbound/<uuid>.eml`, never calls `arrayBuffer`, and posts only `{ key }` with the bearer and both envelope addresses; a
  failed put, a thrown fetch and a non-2xx answer delete the key and reject with the temporary-failure text; only the status is logged —
  test: `cloudflare/email-inbound/worker.test.ts` (changed).
- AC2 `SEC-1044-INBOUND-DENY` unchanged; `SEC-1046-KEY-DENY`; a body above 1 024 bytes → 413; an object above 26 214 400 bytes → 413 and
  deleted; a missing object → 422; a failed read → 500; the object's bytes reach `processInboundEmail`, and the object is deleted after a 200
  and after a 500 — test: `src/app/api/email/inbound/__tests__/route.security.test.ts` (changed).
- AC3 The mail functions sign with `R2_MAIL_*` and address `R2_MAIL_BUCKET_NAME` only; the listing functions never use a mail variable;
  a missing mail variable throws `R2ConfigError` before any call; a length above the limit throws without keeping the body — test:
  `src/lib/media/__tests__/r2.security.test.ts` (changed).
- AC4 CI passes — test: `gh pr checks <n>` after every check concluded.

## Route

0. Owner, before the deploy (the plan): the private bucket with a lifecycle rule (prefix `inbound/`, delete after 1 day), a token for that
   bucket only, `R2_MAIL_*` on Vercel Production, the Worker binding `INBOUND_BUCKET`; Vercel deploys first, then the Worker is pasted.
1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1-AC3); save each failing output.
3. `r2.ts`, the route, the Worker, `docs/env.md`.
4. Run: `npm run typecheck`; `npm test -- cloudflare/email-inbound/worker.test.ts src/app/api/email/inbound/__tests__/route.security.test.ts
   src/lib/media/__tests__/r2.security.test.ts src/lib/media/__tests__/listingPhoto.security.test.ts
   src/modules/listings/actions/__tests__/listingPhotoVerify.security.test.ts`; `npm run test:security-integration --
   src/tests/integration/r2SignedUpload.integration.test.ts` (checklist D10: every test importing `worker.js`, `route.ts` or `r2.ts`, found
   2026-11-25 by import). Deliberate breaks: the key pattern removed → `SEC-1046-KEY-DENY` fails; the delete after processing removed → AC2
   fails; the mail store reading `R2_BUCKET_NAME` → AC3 fails; the Worker buffering with `arrayBuffer` → AC1 fails; each restored. CI runs only
   on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
5. Report: each command, exit code, relevant output; each new test's failing run before the change; each break's output.

## Review

- [Review 1 — APPROVED WITH NOTES](../../docs/reviews/Task_1046_Review_1.md)
