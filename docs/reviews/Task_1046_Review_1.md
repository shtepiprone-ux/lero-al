# Task 1046 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1046_Received_Mail_Travels_Through_Private_R2.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1046_Received_Mail_Travels_Through_Private_R2.md) · OWASP record: [Task_1046.json](../security/owasp/reviews/Task_1046.json)

Review 1 of the working tree on 4aa6ace4a — APPROVED WITH NOTES
Scope: diff-based; the 7 files of the kickoff's Scope (`git diff --stat HEAD`: 561+, 72−): `cloudflare/email-inbound/worker.js` (Email Worker), `src/app/api/email/inbound/route.ts` (public POST, Worker-only by bearer), `src/lib/media/r2.ts` (server-only R2 client), `docs/env.md`, and the three test files.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45681895170 green; `npm test --` 9 files → 339 passed, exit 0; `npm run typecheck` → exit 0; ESLint on the 6 changed code files → exit 0; `test:security-integration` R2 → 4 passed, exit 0; failing-first → 62 failed of 136, exit 1; six breaks → each exit 1; `owasp.mjs review --base main` → exit 0. CI of the pull request: UNKNOWN until the push (V14).
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the route reads only a key of the Worker's own shape, from the mail bucket only, with the mail token only, and deletes it after every answer; every control has a test that fails without it. Open: CI and the owner's live setup (bucket, token, binding, variables) before the deploy.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "140 sheets at 05861f28ed88 … changed 0", `check` → "every quote verified", `check-ruleset.mjs` → "matches"; `gh run list --branch main --limit 3` → CI 45681895170 success (Task 1044, #78).
- V2: `git diff --stat HEAD` → the 7 files of the kickoff's Scope, nothing else; HEAD 4aa6ace4a is Opus's documentation commit of the kickoff (the revision started from it). Every hunk serves the Cause or AC1-AC3.
- V3: every claim of the executor's report reproduced:
  - Route and import-found tests (`grep -rlE` over `src` and `cloudflare` for `media/r2`, `email/inbound/route`, the exported names): `worker.test.ts`, `route.security.test.ts`, `r2.security.test.ts`, `listingPhoto.security.test.ts`, `listingPhotoVerify.security.test.ts`, `upload-url/__tests__/route.security.test.ts`, `ImageUpload.test.tsx`, `ImageUpload.widgetOptions.test.tsx`, `uploadQueue.test.ts` → 9 files, 339 passed (the report's 178 + 161), exit 0.
  - `npm run typecheck` → exit 0. `npx eslint --no-warn-ignored --max-warnings 0` on `worker.js`, `worker.test.ts`, `route.ts`, `route.security.test.ts`, `r2.ts`, `r2.security.test.ts` → exit 0.
  - `SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<the development ref> npm run test:security-integration -- src/tests/integration/r2SignedUpload.integration.test.ts` → 4 passed, exit 0 (D91, `project-facts.md:46`).
  - Failing-first: the three product files set to `HEAD`, the three test files run → 62 failed, 74 passed (136), exit 1 (worker 12 of 14, route 35 of 51, r2 15 of 71); files restored, `git diff --stat HEAD` unchanged.
  - Breaks (`breaks.mjs` in the reviewer's scratchpad: replace one exact string, run the test file, restore byte for byte): key pattern removed → 12 of 51 `[SEC-1046-KEY-DENY]`; the `finally` delete removed → 5 of 51 `[SEC-1046-RAW]`; mail store bucket = `R2_BUCKET_NAME` → 4 of 71 `[SEC-1046-R2-MAIL]`; Worker `put` of an `arrayBuffer` → 3 of 14 incl. `[SEC-1046-WORKER-STREAM]`; Worker delete removed → 8 of 14 `[SEC-1046-WORKER-CLEAN]`; real-length check off → 1 of 71. Each exit 1, the same counts as the report.
- V4: read the whole diff of the 7 files. The Worker no longer reads the message (`worker.js:18-19`, `FixedLengthStream` + `put` awaited together), so the 4 MB body and the CPU cost of the buffer — the Cause — are gone; the limit is 26 214 400 in the Worker (`:7`) and the route (`route.ts:21`).
- V5: against `git show main:<path>`: the route's order 503, 401, declared size, recipient 422 is kept (`route.ts:72-79`), the answers and log lines of `main` are kept, and `processInboundEmail` is unchanged (its signature accepts `ArrayBuffer | Uint8Array`, `inboundEmail.ts:178`). The Worker's temporary-failure text and status-only log are kept. Every listing export of `r2.ts` reads the same variables (`'listing'` store). Changed by the kickoff (owner decisions O1046-1, O1046-2): the body limit 1 024 bytes, the 25 MB message limit, the `{ key }` body.
- V5a: not applicable: kickoff "## UI: No visible change"; `git diff --name-only HEAD` has no page, component or Story.
- V6: `git diff HEAD | grep` for `eslint-disable`, `.skip`, `.only`, `@ts-ignore`, `@ts-expect-error`, allowlist, baseline → nothing.
- V7: below.
- V8: AC1 → `worker.test.ts` 12 of 14 fail on `main`'s Worker; AC2 → `route.security.test.ts` 35 of 51 fail on `main`'s route; AC3 → `r2.security.test.ts` 15 of 71 fail on `main`'s `r2.ts`; restored, 339 passed. AC4: CI, V14.
- V9: no Story changed.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 30 sheets triggered; each has its verdict in the record, with the four further sheets of the kickoff's "## OWASP".

## V7 — secure code review

Six steps: (1) no existing control weakened: the bearer check, recipient check and `SEC-1044-INBOUND-DENY` are unchanged, and that test now also asserts no R2 call; (2) new vector: the request now names an object key; it is bound by an anchored pattern, one-property shape and 1 024-byte limit before any R2 call; (3) trust boundary: route ↔ R2 now uses a second token, scoped to the mail bucket (`r2.ts:47-50`); (4) no new package (`aws4fetch` as before); the Worker gains the R2 binding `INBOUND_BUCKET` (the owner's, before the deploy); (5) no test removed or loosened: the 4 MB tests became 25 MB and 1 024-byte tests as the kickoff says, every Task 1044 tag is still asserted; (6) categories:

- Authorization: touched — `route.ts:73` before any read; IDOR: the key of the request reaches only `inbound/<uuid v4>.eml` in the mail bucket (`route.ts:25`, `:42`; `r2.ts:69` `assertKey`).
- Input and output: touched — `route.ts:31-43` (JSON shape, one own `key`, pattern), `:76`, `:86` size; no spread, no `obj[key] =`.
- Authentication and sessions: not touched — no login, session or token flow in `git diff --name-only HEAD`.
- Requests and redirects: touched — the Worker posts only to `INBOUND_URL` with `redirect: 'manual'` (`worker.js:30`); the route fetches only `R2_ENDPOINT` (`r2.ts` `settings`), never a URL from the body.
- Next.js entry points: touched — `/api/email/inbound` stays a public Route Handler, audience: the Worker only (bearer); `r2.ts:1` `server-only`.
- Business logic: touched — the object is deleted after every answer of `processInboundEmail` (`route.ts:106-108`) and after a too-large read (`:91-93`); a failed read leaves it to the Worker's delete on a non-2xx answer (`worker.js:37-44`) and the 1-day rule (kickoff Scope does not ask the route to delete it there). The sender limits of Task 1044 are unchanged.
- JavaScript and TypeScript: touched — `route.ts:25` linear, anchored; input ≤ 1 024 bytes; no `any` or non-null assertion on the body.
- Data exposure, errors, logging: touched — answers are fixed codes; `route.ts:49` logs `raw_delete_failed` only; the read error text is not echoed (test "a failed read answers 500 without its text").
- Files: not touched as an upload — the mail object is written only by the Worker binding; its MIME is parsed by the unchanged `processInboundEmail`. `getMailObject` caps the bytes kept (`r2.ts:152`, `:162`).
- Dependencies and configuration: not touched — no `package.json`, lockfile, workflow or header file in the diff.
- Agent and tool output: no invisible or bidi character (node scan of `git diff HEAD` → 0); no rule, skill, hook or CI file changed.
- Tests: every AC has its test and it fails without the change (V8); the negative cases of `SEC-1046-KEY-DENY` fail with the pattern removed.

## Notes (no change asked)

- N1: `src/lib/media/r2.ts:156` (`if (!res.body) return new Uint8Array(0)`) runs in no test (the executor says so). `quality-gates.md:148` asks for at least one changed line run per changed product file and 80 % of all changed executable lines; INFERENCE: one line of the 85-line `r2.ts` hunk stays well above it. CI's `changed-lines-coverage.mjs` decides (V14).
- N2: the executor's A4 report (no listing-photo R2 variables in `docs/env.md`) is already Task 1050 in `docs/backlog.md` (Sprint 94, P3); nothing to file.
- N3: the route keeps the object after a failed read (500) and relies on the Worker's delete on a non-2xx answer and on the 1-day lifecycle rule; this is the kickoff's design (Scope: "a failed read → 500"), not a gap.

## Open parts

- Owner: commit and push (checklist H), the pull request; then V14 `gh pr checks <n>`.
- Owner, before the deploy (kickoff Route 0): bucket `lero-inbound-mail` with the `inbound/` 1-day lifecycle rule, a token for that bucket only, `R2_MAIL_*` on Vercel Production, the Worker binding `INBOUND_BUCKET`; Vercel deploys first, then the new `worker.js` is pasted.

## V14 — pull request #79

- `gh pr checks 79` on d90a3bef9: all 23 checks pass, `CI Required` included (run 45764498069); the changed-line coverage of `Unit and component tests` passed with `r2.ts:156` uncovered (N1 closed). `gh pr view 79`: `MERGEABLE`, `CLEAN`; `main` on GitHub 1bf37a166, the branch's base.
- Live setup (kickoff Route 0), read or done 2026-11-26 by Opus at the owner's request: the bucket, its 1-day `inbound/` rule, the token and the three Vercel names read; the Worker binding `INBOUND_BUCKET` added (plan file).
