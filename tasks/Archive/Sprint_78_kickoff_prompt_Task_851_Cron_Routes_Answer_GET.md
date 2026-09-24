# Task 851 — the four cron routes answer Vercel's `GET`, and refuse every call when `CRON_SECRET` is missing

Sprint 78 · P1 · QA profile **Q4** (critical flow "Listing expiry reconciliation") · Wave B, **before 849** · owner
action **O78-2** first · **Status: ✅ APPROVED WITH NOTES 2026-09-20, ARCHIVED — all of R1–R6 and AC1–AC6 verified.
AC4 closed on the owner's run of `scripts/task-851-first-run-impact.sql`: 7 silent `favorite_price_alerts` baseline
rows and zero emails, soft-deletes or mutations. O78-2 returned empty View Logs — the crons are **Disabled** in
Vercel, so §3's 405 INFERENCE stays UNKNOWN and is moot; enabling all four (owner-authorized on that grid) is a
separate active owner action, not part of this task. Ledger
`docs/reviews/2026-09-20-task851-cron-routes-answer-get.review-ledger.json`; archive row in `docs/backlog-archive.md`.**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). Filed because 849's
design read the Vercel cron docs (D78-4) and found the existing routes cannot be invoked the way Vercel invokes them.
ADM-09's "expired" count depends on the expiry sweep actually running.

## 1. Mode and task type

`IMPLEMENTATION` — a shared auth helper and a handler-export change in four route files, with tests. Bundles:
**Regression / Critical Flow Coverage** + **DB / Server Action / RLS** (scheduled writes).

## 2. Objective

1. `src/lib/cron/verifyCronRequest.ts` exports `verifyCronRequest(request): { ok: true } | { ok: false; response: NextResponse }`.
   It returns **401 when `CRON_SECRET` is unset or empty** (fail closed) and 401 when the `Authorization` header is not
   exactly `Bearer ${CRON_SECRET}`. 849's new route reuses it.
2. Each of `inactivity`, `listings-expiry`, `price-alerts` and `saved-searches` exports **`GET`** (what Vercel sends)
   **and** keeps `POST` (for manual/owner triggering), both bound to one unchanged handler body that starts with
   `verifyCronRequest`.
3. Before any deploy, the owner receives a **first-run impact report**. If the routes have really been returning 405
   in production, the first successful run of each job acts on its whole backlog at once: expiry sweeps, inactivity
   warnings and account actions, saved-search emails, price alerts. The owner then decides the enable order.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- `vercel.json` has 4 crons: `/api/cron/inactivity` `0 8 * * *`, `/api/cron/saved-searches` `0 9 * * *`,
  `/api/cron/price-alerts` `0 10 * * *`, `/api/cron/listings-expiry` `0 7 * * *`.
- Each route file exports **only** `POST`: `inactivity/route.ts:52`, `listings-expiry/route.ts:21`,
  `price-alerts/route.ts:40`, `saved-searches/route.ts:49`. Each secret check is **fail-open**
  (`if (cronSecret) { … }`): with `CRON_SECRET` unset, anyone can trigger the job.
- Vercel docs (read 2026-09-18, `vercel.com/docs/cron-jobs`): *"To trigger a cron job, Vercel makes an HTTP GET
  request to your project's production deployment URL"*; the secret arrives as `Authorization: Bearer <CRON_SECRET>`;
  no retries; delivery can duplicate.
- INFERENCE, not measured: a Next.js App Router route with no `GET` export answers `GET` with **405**, so these jobs
  have not run on schedule. The owner's Vercel log check (**O78-2**) turns this into a fact or refutes it.
- Critical flow `docs/critical-flow-registry.md:69` names `POST /api/cron/listings-expiry` and its regression command
  `npx vitest run src/app/api/cron/listings-expiry/__tests__/route.test.ts`. That test imports `POST` (`:55`) and posts
  requests (`:72`). It is the only cron test directory (`ls -d src/app/api/cron/*/__tests__`).
- `scripts/check-listing-visibility.mjs:53-55` allowlists three **content fingerprints** in `listings-expiry/route.ts`
  (`.eq('status', 'active')`, `.lt('expires_at', now)`, `.is('expires_at', null)`). The handler body must keep those
  exact substrings, which is why the body is left unchanged.
- `docs/env.md:17` says `CRON_SECRET` is "Used by /api/cron/inactivity" (incomplete; all four read it).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Vercel docs | `verifyCronRequest` per §2.1, no other behaviour; unit tests cover unset, empty, wrong and correct secrets. | P0 | AC1 | Confirmed |
| **R2** | Vercel docs | In each of the four routes, `export async function POST(request)` becomes a module-local `async function handle(request)`, whose first statement is `const auth = verifyCronRequest(request); if (!auth.ok) return auth.response`, and which replaces the old inline check. Then `export const GET = handle` and `export const POST = handle`. **No other line of the handler body changes.** | P0 | AC2, AC3 | Confirmed |
| **R3** | critical flow | `listings-expiry/__tests__/route.test.ts` gains `GET` cases mirroring the existing `POST` ones (authorized → same result; wrong secret → 401) and an **unset-secret → 401** case for both methods. The existing cases stay and pass. | P0 | AC3 | Confirmed |
| **R4** | fail-closed | New minimal tests for the other three routes: `GET` with no/wrong secret → 401 **before** any Supabase call (mock `createAdminClient` and assert it was not called). | P1 | AC3 | Confirmed |
| **R5** | owner safety | `scripts/task-851-first-run-impact.sql`: read-only counts of what each job would act on now. The executor derives the exact predicates by **reading each route's query code** and copying them. Expected: listings with `status='active' AND expires_at < now()`, and the NULL-expiry count; users past the inactivity warning/final thresholds as coded in `inactivity/route.ts`; saved searches due as coded; price alerts due as coded. Each count is labelled with the route file and line it mirrors. | P0 | AC4 | Confirmed |
| **R6** | docs | `docs/env.md:17` lists all routes that read `CRON_SECRET` (the four + `/api/cron/listing-activity` from 849) and states "unset = every cron call is refused (401)". `docs/critical-flow-registry.md:69`'s route column reads `GET\|POST /api/cron/listings-expiry`. | P2 | AC5 | Confirmed |

## 5. Assumptions and open questions

- **O78-2 (owner, before I0 closes):** Vercel → Project → Settings → Cron Jobs → View Logs for each of the four jobs:
  the last few statuses (`405` or `200`), and whether `CRON_SECRET` is set for Production. If the logs show `200`, the
  INFERENCE in §3 is wrong. The task still ships (fail-closed + GET is correct per the docs), but the "first-run blast
  radius" risk disappears; record that.
- **STOP — OWNER DECISION REQUIRED before deploy (not before implementation):** after the review, the owner reads
  R5's report and decides whether all four jobs go live together, or whether some are disabled first (Vercel → Cron
  Jobs → Disable) and re-enabled one by one. This kickoff does not choose. The executor implements and hands over the
  report.
- If `CRON_SECRET` is **not** set in Production, deploying this task changes nothing for Vercel's own invocations
  (they were 405) but blocks manual `POST` triggers. The owner sets the variable first.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–6a, 9, 10, 14, 15) · `docs/qa-profiles.md` · `docs/env.md` ·
`docs/critical-flow-registry.md` (row 69) · `docs/domain-rules.md` (inactivity) · `docs/app-lifecycle-contract.md` ·
`docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Created:** `src/lib/cron/verifyCronRequest.ts` · `src/lib/cron/__tests__/verifyCronRequest.test.ts` ·
  `src/app/api/cron/inactivity/__tests__/route.auth.test.ts` · `src/app/api/cron/price-alerts/__tests__/route.auth.test.ts`
  · `src/app/api/cron/saved-searches/__tests__/route.auth.test.ts` · `scripts/task-851-first-run-impact.sql`.
- **Edited:** the four `route.ts` files (R2 only) · `src/app/api/cron/listings-expiry/__tests__/route.test.ts` (R3) ·
  `docs/env.md` · `docs/critical-flow-registry.md` (row 69 route cell) · `docs/backlog.md` (851 line).

## 8. Out of scope

Job logic and schedules · `vercel.json` (849 adds its own entry after this task) · any dry-run mode · 849's route.

## 9. Current and required behavior

**Before.** Vercel's `GET` gets 405 (INFERENCE pending O78-2); with no secret configured, anyone can `POST` a job.
**After.** Vercel's `GET` runs the job; `POST` still works for authenticated manual runs; a missing secret refuses
every call.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes of the four routes and the test; re-read §3's lines; record
   O78-2's answer from the sprint file (if still missing, continue with implementation and mark AC4's owner half
   pending); run the critical-flow command (baseline green).
2. Tests first: R1 and R4 red (helper missing), R3 GET/unset cases red.
3. Implement R1, R2. Show `git diff` per route: only the signature, the removed inline check, the new helper call and
   the two exports.
4. `node.exe scripts\check-listing-visibility.mjs` must stay green (fingerprints intact).
5. Write R5's SQL with line citations.

## 11. Positive and negative flows

**Positive.** At 07:00 UTC Vercel sends `GET /api/cron/listings-expiry` with the bearer secret; the sweep expires
lapsed listings and returns its JSON as today.

| Negative flow | Applicable | Expected |
|---|---|---|
| Secret unset | Yes | 401 for GET and POST; no DB call. |
| Wrong secret | Yes | 401; no DB call. |
| Manual owner POST with secret | Yes | Runs as before. |
| Duplicate Vercel delivery | Yes (pre-existing) | Each job's own idempotency (the expiry sweep is idempotent per its registry row); unchanged here. |
| First run after months of 405 | Yes | Owner decision on the enable order, with R5's counts. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `npm.cmd run test -- src/lib/cron/__tests__/verifyCronRequest.test.ts`, when run, then the
  unset, empty, wrong and correct cases pass.
- **AC2 [R2]** — Given `git --no-optional-locks diff -- src/app/api/cron`, when read, then each route's hunks contain
  only R2's changes; and `git --no-optional-locks grep -n -E "^export (const|async function) (GET|POST)" -- src/app/api/cron`
  shows `GET` and `POST` exported by all four routes.
- **AC3 [R3, R4]** — Given `npx.cmd vitest run src/app/api/cron`, when run, then all pass. Given a plant that restores
  `if (cronSecret)` fail-open logic in `verifyCronRequest`, when re-run, then the unset-secret cases fail; revert with
  an equal hash.
- **AC4 [R5]** — Given `scripts/task-851-first-run-impact.sql`, when read, then every count cites its route file:line;
  the owner's run output is attached to the review (owner-native).
- **AC5 [R6]** — Given `docs/env.md` and row 69 of the registry, when read, then they state the new facts.
- **AC6** — Given the §13.2 block, when run, then everything exits 0.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC2's "only R2's changes" is bounded by the named hunks, not a byte claim on the file.`

GR-1 / GR-3 / GR-3a: **not applicable** — no visible artifact.

## 13. QA profile and verification plan

**`Q4`** — a registered critical flow's entry point changes. Regression baseline (I0), changed-behaviour tests, a
planted violation (AC3), and owner-native evidence (O78-2, AC4).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task851/`.

### 13.2 Final gate block (executor)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/lib/cron/__tests__/verifyCronRequest.test.ts
npx.cmd vitest run src/app/api/cron
npx.cmd vitest run src/app/api/cron/listings-expiry/__tests__/route.test.ts
npm.cmd run check:listing-visibility
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "^export (const|async function) (GET|POST)" -- src/app/api/cron
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/lib/cron/verifyCronRequest.ts src/app/api/cron/inactivity/route.ts src/app/api/cron/listings-expiry/route.ts src/app/api/cron/price-alerts/route.ts src/app/api/cron/saved-searches/route.ts
```

Expected: all exit 0; the grep lists `GET` and `POST` for four routes.

### 13.3 Owner-native steps

1. **O78-2 (before execution):** Vercel → Settings → Cron Jobs → View Logs for each job; record the last statuses and
   whether `CRON_SECRET` is set for Production.
2. **After review, before deploy:** run `scripts/task-851-first-run-impact.sql` in the Supabase SQL editor; return the
   grid; decide the enable order (STOP, §5).
3. **After deploy:** the next scheduled invocation of each enabled job shows `200` in View Logs.

## 14. Completion report contract

Files with hashes · R1–R6 · AC1–AC6 · commands with exit codes · O78-2's answer as recorded · the per-route diff ·
plant transcript · assumptions · deviations · limitations. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git. Update the 851 line of `docs/backlog.md`;
session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Is the 405 claim proven? | No — labelled INFERENCE; O78-2 measures it; the fix is correct per the docs either way. |
| Blast radius of a first real run? | R5 report + owner STOP before deploy. |
| Critical-flow test kept and extended? | R3 + registry row updated (R6). |
| Visibility gate fingerprints intact? | Handler body unchanged (R2) + `check:listing-visibility` in §13.2. |
| Commands in blocks | §13.2 + §13.3. |
