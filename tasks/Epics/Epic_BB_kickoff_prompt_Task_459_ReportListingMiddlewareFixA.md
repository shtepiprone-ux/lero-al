# Task 459 — Report-listing submit failure: Fix A (middleware server-action POST bypass) — Epic BB

> **Type:** Middleware / server-action transport FIX + middleware regression coverage. **NOT a UI task.**
> **Depends on:** Task 435 diagnosis (`docs/governance-reports/2026-06-15-task435-report-listing-submit-rootcause.md`)
> and Task 458 (Fix B already SHIPPED — per-branch 4-locale error toasts + `report_err_suspended`; do NOT redo it).
> **What 458 left open:** Fix B only improved the *message* shown when the report POST fails. The underlying
> **transport failure** (`Fetch failed loading: POST "/uk/listings/<slug>"` at `reportListing.ts:23`) is still
> unfixed if Hypothesis 1 (middleware corrupts the server-action POST) is real in production. 458 could not
> capture D1/D2/D3 in the executor environment, so Fix A was deferred to this task.
> **This task is BLOCKED from touching `src/middleware.ts` until Phase 0 proves a prod-reproducing middleware
> corruption.** If Phase 0 shows dev-only / non-reproducing, this task closes as "Fix A NOT needed" with the
> evidence — it does NOT ship a speculative middleware change.

## Pre-read (rule-index → DB/server-action/RLS + regression bundles; NOT the UI bundle — no rendered surface changes)

- `docs/agent-contract.md` (P0 clauses 1–15 — always; **clause 15 regression coverage applies**).
- `docs/backlog.md` (always).
- `docs/critical-flow-registry.md` (always) — **the "Report listing" row (P0/P1 Listings lifecycle,
  owner-task 243/BB/435/442/458) is the flow you touch.** Baseline its existing tests GREEN before changing
  anything; the same tests (plus the new middleware test) must pass after. Do NOT close without that proof.
- `docs/data-access-rules.md`, `docs/rls-rules.md` — server-action transport path context (RLS already
  verified correct for this flow in Task 270; do NOT re-litigate it).
- `docs/qa-rules.md` → "Actionable Error-Toast Rule" (Task 436) for the action-error contract context.
- `docs/architecture.md` (only the middleware/request-lifecycle section) — to confirm what else flows through
  `src/middleware.ts` so the bypass does not regress other server actions on `[locale]` routes.

## Hard contract (P0 — verified against the diff on return)

- Do NOT change scope beyond `src/middleware.ts` (Fix A) + its regression test + the registry/backlog/session
  housekeeping. **No edits to `ListingReportDialog.tsx`, the locale files, or `reportListing.ts`** — Fix B is
  done and is out of scope for 459.
- Do NOT invent architecture. The fix is pre-decided (below). If Phase 0 evidence contradicts BOTH known
  hypotheses, or implies a different architecture/product decision, **STOP and ASK the orchestrator** — do not
  improvise a different middleware change.
- The Fix A snippet is **behavioral guidance, not blind copy-paste.** Use the minimal Next.js-valid
  `NextResponse` shape this codebase's installed `next/server` types accept; `npx tsc --noEmit` must pass.
- Execute the acceptance criteria literally. Self-validate before claiming complete (Note 18).
- No `git add` / `git commit` — the orchestrator emits commits after diff review.
- Read-after-write + clause-14 file-integrity check on every touched file; paste the green transcript.

---

## 🔴 PHASE 0 (MANDATORY FIRST — capture the discriminators, then decide; NO fix code before this)

435 could not confirm a single root cause from the browser console alone. Reproduce the failure on a
**running app** (`/uk/listings/<slug>` → Report → `Fraud / scam` → Submit) and capture all three discriminators
BEFORE writing any fix code. Paste the verbatim evidence into the session log.

- **D1 — Server terminal at the Submit click (the single decisive artifact).** Capture the Next.js dev
  terminal output at the instant of Submit and classify it:
  - a **redirect/rewrite** of the POST, or **no terminal stack at all** → middleware consumed/processed the
    POST ⇒ **Hypothesis 1 confirmed → Fix A is the correct fix** (pending D2 prod confirmation). **Note:** a
    "no terminal stack" reading is only decisive when corroborated by the D1-Network artifact below — on its
    own it is weak evidence.
  - a **"Failed to find Server Action" / stale-action-ID 500** → **Hypothesis 3** (dev-only stale action ID).
  - a **real exception** inside `getUser()` / `getBlockedError()` / `createClient()` → neither hypothesis;
    **STOP and ASK.**
- **D1-Network (R2) — Browser DevTools Network record for the failed POST.** The terminal classification above
  must be corroborated by the actual transport record. Capture, for the failed POST:
  - request URL + method;
  - presence (or absence) of the `Next-Action` request header;
  - response status code;
  - response `content-type`;
  - `Location` / `x-middleware-rewrite` / `x-middleware-redirect` response headers if present;
  - whether the response body is a valid RSC/server-action response, or HTML / a redirect / an empty transport
    failure.
  A redirect/rewrite header or an HTML/empty body on the action POST is the positive signal for Hypothesis 1
  (middleware corruption). A valid RSC response that still errors points away from middleware → re-check D1/D3.
- **D2 — Production build.** Does it reproduce under `npm run build && npm start` (not `next dev`)?
  - **Reproduces in prod ⇒ real product bug ⇒ apply Fix A.**
  - **Only in `next dev` ⇒ dev-only stale-action-ID ⇒ do NOT apply Fix A.** Close this task as "Fix A not
    needed (dev-only artifact)" with the evidence; the report flow already returns a clean toast via Fix B.
- **D3 — Sibling action on the SAME page.** Does "Send message" (`submitListingInquiry`) succeed while Report
  fails?
  - **BOTH fail ⇒ middleware-wide corruption** → Fix A (it fixes every `[locale]`-route server action).
  - **Inquiry works + report fails ⇒ report-action-specific** → re-opens Hypothesis 2; **STOP and ASK** (Fix A
    would be the wrong fix).

**Decision gate (record the chosen branch + its evidence in the session log as AC1):**
- **(a)** D1 = redirect/rewrite or no-stack (corroborated by D1-Network) **AND** D2 reproduces in prod **AND**
  D3 not action-specific → **apply Fix A.**
- **(b)** D2 = dev-only **OR** D1 = stale-action-ID 500 → **do NOT apply Fix A**; close with evidence ("Fix A
  not needed — dev-only"); the catch-all-toast UX defect was already resolved by Fix B (458).
- **(b2) Non-reproducible anywhere (R1).** If the failure **cannot be reproduced** after a CLEAN page load in
  `next dev` **AND** cannot be reproduced under `npm run build && npm start` **AND** D1 cannot be classified:
  - do **NOT** change `middleware.ts`;
  - do **NOT** add the middleware test;
  - record the browser Network result + server-terminal "no reproduction" evidence (D1-Network shows a normal
    RSC response or the action simply succeeds);
  - re-run the baseline report-listing suites GREEN;
  - update registry / backlog / session as **"Fix A not applied — non-reproducing, no prod evidence"** and
    close. This is a legitimate close, not a failure, and does NOT require stop-and-ask.
- **(c)** D1 = real exception, or D3 = action-specific, or evidence contradicts BOTH hypotheses → **STOP and
  ASK the orchestrator.**

---

## Fix A — Middleware skips server-action POSTs (apply ONLY under decision gate (a))

In `src/middleware.ts`: detect server-action POSTs by HTTP method + the `Next-Action` header and bypass
`handleI18nRouting` for them, while STILL running `refreshSession` and copying its cookies onto the returned
response. Behavioral guidance (verify the exact shape against the installed `next/server` types — Clarification 1):

```typescript
import { type NextRequest, NextResponse } from 'next/server'
// ...existing imports (routing, refreshSession) unchanged...

export async function middleware(request: NextRequest) {
  const sessionResponse = await refreshSession(request)

  // Server-action POSTs carry the Next-Action header — locale routing must NOT
  // process them (it corrupts the RSC action response → "Fetch failed loading: POST").
  const isServerAction = request.method === 'POST' && request.headers.has('Next-Action')
  const response = isServerAction
    ? NextResponse.next({ request })
    : handleI18nRouting(request)

  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }
  return response
}

export const config = { /* matcher UNCHANGED */ }
```

**Current behavior to preserve (verify each in the diff):**
- Every **non-action** request keeps full `handleI18nRouting` behavior unchanged (locale prefix redirect,
  default-locale rewrite, pass-through `next()` when the prefix already matches).
- `refreshSession` runs on **ALL** requests, including the action POST, and its cookies are copied to the
  returned response in **both** branches.
- The `matcher` config is **unchanged**; `/api`, `/auth`, `/admin`, `_next/*`, and static assets remain
  excluded exactly as today.
- No other server action on `[locale]` routes (inquiry, cabinet, listing CRUD) regresses — the bypass applies
  uniformly to any `POST + Next-Action`, which is correct for all of them.

## 🔴 Mobile <640 full-width gate — EXEMPT (documented)

This task touches **only `src/middleware.ts`** — it renders **no UI surface, no popup, no dialog, no control**.
The mobile full-width / bottom-sheet gate does not apply (no rendered surface in scope). `ListingReportDialog`
is **not** modified by this task. Explicitly state this exemption in the session log; do NOT add a rendered
matrix (there is nothing to render). If Fix A unexpectedly requires any UI/overlay change, **STOP and ASK** —
that would be out of scope.

## 🔴 Regression coverage (agent-contract clause 15 — critical-flow-registry "Report listing")

1. **Baseline:** run the existing report-listing tests GREEN first and record the transcript —
   `npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx`
   (these are the Task 442/448/458 suites; they must stay GREEN — 459 must not regress them).
2. **Add a NEW middleware unit test** (e.g. `src/__tests__/middleware.smoke.test.ts` — match the repo's
   existing test-location convention) asserting:
   - a `POST` request carrying a `Next-Action` header → `handleI18nRouting` is **NOT invoked** and the
     response is the pass-through (`NextResponse.next`), **AND** `refreshSession` cookies are still copied;
   - a normal `GET` (no `Next-Action`) → `handleI18nRouting` **IS invoked** and its response is returned,
     with `refreshSession` cookies copied;
   - a `POST` **without** `Next-Action` (ordinary form post, if applicable) routes through
     `handleI18nRouting` (the bypass is gated on the header, not the method alone).
   Mock `handleI18nRouting` and `refreshSession` at the module boundary (mirror the mocking style in
   `ReportListingDialog.smoke.test.tsx`). **Test-seam rule (R3):** do NOT export product-only test seams from
   `middleware.ts` unless strictly necessary. `handleI18nRouting` is a local `const` created from
   `createMiddleware(routing)` — prefer mocking the **imported factory/module** (`next-intl/middleware` →
   `createMiddleware`, and `@/lib/auth/middleware` → `refreshSession`) rather than refactoring the file to
   expose internals. Any refactor MUST preserve the runtime exports (`middleware`, `config`) and the `matcher`
   unchanged.
3. **Planted-violation proof:** revert Fix A locally (restore the unconditional `handleI18nRouting(request)`)
   and show the new middleware test FAILS; then restore → GREEN. Paste both transcripts.
4. **If decision gate (b) or (b2) — Fix A NOT applied:** no middleware code or middleware test is added;
   instead the session log records the Phase-0 evidence proving Fix A is unnecessary, and the registry row note
   is updated — for gate (b) state the transport failure was a **dev-only artifact** (no prod fix required); for
   gate (b2) state it was **non-reproducible anywhere (no prod evidence)**. The existing report-listing tests
   are still re-run GREEN as the baseline in both cases.
5. Update the registry "Report listing" row coverage note with the new middleware test + command (gate (a)),
   the dev-only resolution (gate (b)), or the non-reproducible / no-prod-evidence resolution (gate (b2)), at
   approval time.

## Positive flow (happy path — gate (a), Fix A applied)

Logged-in, non-blocked user on `/uk/listings/<slug>` → opens Report dialog → selects `Fraud / scam` →
Submit → `POST /uk/listings/<slug>` carries `Next-Action` → **middleware bypasses `handleI18nRouting`**, runs
`refreshSession`, copies cookies → the POST reaches `reportListingAction` → row inserted (`status='pending'`)
→ action returns `{}` → `toast.success(report_success)` (Fix B path) → dialog closes. Post-conditions:
`listing_reports` row written; the action POST is no longer redirected/rewritten; subsequent normal page
navigation still locale-routes correctly.

## Negative flow (every off-happy-path branch — each needs a verifiable line in code or a covered test)

- **Non-action GET on a `[locale]` route** — unchanged: `handleI18nRouting` runs (prefix redirect /
  default-locale rewrite / pass-through as today). Covered by the middleware GET test.
- **Server-action POST while session expired** — `refreshSession` still runs and copies cookies in the bypass
  branch; the action receives the refreshed session. No locale redirect on the POST.
- **Excluded paths (`/api`, `/auth`, `/admin`, `_next/*`)** — matcher unchanged; middleware does not run; no
  behavior change.
- **`reportListingAction` returns a typed error** (`unauthorized` / `account_blocked` / `account_suspended` /
  `save_failed`) — now reaches the client correctly and is surfaced by the Fix B per-branch toasts (already
  shipped in 458; this task only ensures the POST is delivered, not swallowed by middleware). No change to the
  toast code.
- **Transport still fails after Fix A** — would mean Hypothesis 1 was wrong; that is the STOP-and-ASK outcome
  captured in Phase 0, not a silent ship.
- **Decision gate (b)/(c)** — no middleware change; documented evidence; (c) halts for orchestrator input.

## Acceptance criteria

- **AC1** — Phase 0 D1 (server terminal) + **D1-Network** + D2 + D3 captured verbatim in the session log; the
  decision is recorded with its evidence as exactly one of: **(a)** Fix A applied (prod-reproducing middleware
  corruption confirmed, terminal corroborated by Network); **(b)** Fix A NOT applied — dev-only, with evidence;
  **(b2)** Fix A NOT applied — non-reproducible anywhere (no prod evidence), with the "no reproduction"
  Network + terminal evidence; or **(c)** STOP-and-ASK.
- **AC2** — *(gate (a) only)* `src/middleware.ts` bypasses `handleI18nRouting` for `POST + Next-Action`,
  preserves `refreshSession` + cookie copy on **both** paths, and leaves non-action routing + the matcher
  unchanged. Verifiable at file:line.
- **AC3** — *(gate (a) only)* New middleware regression test asserts: action-POST → bypass (handleI18nRouting
  not called) + cookies copied; GET → routes through + cookies copied; POST-without-`Next-Action` → routes
  through. Planted-violation FAIL transcript present; baseline report-listing suites still GREEN.
- **AC4** — *(gate (b))* No `middleware.ts` change; session log documents the dev-only evidence and why Fix A
  is unnecessary; report-listing baseline suites re-run GREEN; registry note updated accordingly.
- **AC5** — `npx tsc --noEmit` = 0 errors; baseline report-listing suites (`test:listings`) GREEN in ALL gates;
  the new middleware test GREEN **only under gate (a)** — gates (b)/(b2)/(c) add no middleware code or test, so
  there is nothing to report there (do not mark it "N/A — failed"; state "no middleware test added — gate (b/…)").
  clause-14 file-integrity transcript green. AC-by-AC self-audit table + "Files Changed" table in the session log.
- **AC6** — Mobile gate exemption explicitly stated (middleware-only, no rendered surface). No rendered matrix.
- **AC7** — Update `docs/critical-flow-registry.md` "Report listing" row + `docs/backlog.md` (Task 459 status)
  + add a session log under `docs/sessions/`. No `git add` / `git commit`.

## Deliverable

Under gate (a): the middleware Fix A + a middleware regression test with planted-violation proof, baseline
report-listing suites GREEN, registry row update, session log + Files Changed table, backlog update. Under gate
(b): documented Phase-0 evidence closing Fix A as unnecessary (dev-only), baseline GREEN, registry + backlog
update, no code change. Under gate (b2): documented non-reproduction evidence (Network + terminal "no
reproduction"), baseline GREEN, registry + backlog update, no code change, no middleware test. Under gate (c):
Phase-0 evidence + the specific question for the orchestrator, no code change.

---

## Clarifications before execution (TAKE PRECEDENCE over any conflicting wording above)

1. **The Fix A snippet is behavioral guidance, not blind copy-paste.** Verify the exact `NextResponse` shape
   against this codebase's installed `next/server` types (the documented header-passthrough form is
   `NextResponse.next({ request })` or `NextResponse.next({ request: { headers } })`). Required behavior
   regardless of shape: `POST + Next-Action` bypasses `handleI18nRouting`; `refreshSession` still runs; its
   cookies are copied to the returned response; non-action routing + matcher unchanged; `tsc` passes. If local
   typing rejects a shape, pick a valid one — do NOT improvise unrelated middleware changes.
2. **Phase 0 is a hard gate, not a formality.** No `middleware.ts` edit may be written until D1/D2 prove a
   prod-reproducing corruption (gate (a)). The "dev-only ⇒ do not apply" outcome (gate (b)) is a legitimate,
   expected close — it is NOT a failure and does NOT require stop-and-ask. Stop-and-ask is only for gate (c).
3. **Fix B is out of scope.** Do NOT modify `ListingReportDialog.tsx`, the locale files, or `reportListing.ts`.
   459 is the middleware/transport fix only. If you believe a Fix B follow-up is also needed, note it for the
   orchestrator — do not implement it here.
4. **Global blast radius.** Fix A changes global middleware behavior for ALL `[locale]`-route server-action
   POSTs (report, inquiry, cabinet, listing CRUD). That is intended and correct, but it means the middleware
   test must assert the GENERIC contract (any `POST + Next-Action` bypasses; any GET routes through), not a
   report-specific one. Confirm via D3 that the sibling inquiry action benefits identically.
