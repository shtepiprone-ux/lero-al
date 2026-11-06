# Task 458 — Report-listing submit failure: FIX (Epic BB)

> **Type:** DB / server-action / middleware FIX + UI error-messaging + regression coverage.
> **Depends on:** Task 435 diagnosis (`docs/governance-reports/2026-06-15-task435-report-listing-submit-rootcause.md`).
> **Owner-reported (2026-06-15):** `Report this listing` → Submit → generic toast "Failed to submit
> report. Please try again." Browser console: `Fetch failed loading: POST "/uk/listings/<slug>"`.
> **435 left this as a HYPOTHESIS-RANKED diagnosis, NOT a confirmed root cause.** Two co-primary
> hypotheses remain open and are distinguished only by evidence this task captures FIRST (Phase 0).

## Pre-read (rule-index → DB/server-action/RLS + UI/component + regression bundles)

- `docs/agent-contract.md` (P0 clauses 1–15 — always; **clause 15 regression coverage applies**)
- `docs/backlog.md` (always)
- `docs/critical-flow-registry.md` (always) — **the "Report listing" row (P0/P1 Listings lifecycle,
  owner-task 243/BB/435/442) is the flow you touch. Baseline its existing test GREEN before changing
  anything; the same test (updated) must pass after. Do NOT close without that automated proof.**
- `docs/data-access-rules.md`, `docs/rls-rules.md` (server-action path)
- `docs/ui-rules.md`, `docs/component-rules.md` (the dialog + toast messaging)
- `docs/qa-rules.md` → **"Actionable Error-Toast Rule" (Task 436)** — actions log root cause + return
  typed keys; the toast must surface a user-actionable, non-blaming message.
- `docs/i18n-rules.md` (4-locale parity for the new message keys)

## Hard contract (P0 — verified against the diff on return)

- Do NOT change scope beyond the report-listing submit path + its error messaging + its regression test.
  No drive-by refactor of unrelated middleware behavior or other actions/dialogs.
- Do NOT invent architecture. The two fixes below are pre-decided; if Phase 0 evidence contradicts them,
  **STOP and ASK the orchestrator** — do not improvise a different fix.
- Execute the acceptance criteria literally. Self-validate before claiming complete (Note 18).
- No `git add` / `git commit` — the orchestrator emits commits after diff review.
- Read-after-write + clause-14 integrity check on every touched file; paste the green transcript.

---

## 🔴 PHASE 0 (MANDATORY FIRST — capture the discriminators, then decide)

435 could not confirm a single root cause from the browser console alone. Capture all three BEFORE
writing any fix code, and paste the verbatim evidence into the session log:

- **D1 — Server terminal at Submit click.** The single decisive artifact. Reproduce the failure
  (`/uk/listings/<slug>` → Report → Fraud/scam → Submit) and capture the Next.js dev terminal output at
  that instant. Classify it:
  - a **redirect/rewrite** of the POST, or **no terminal stack at all** → middleware consumed the POST
    ⇒ **Hypothesis 1 confirmed → do Fix A.**
  - a **"Failed to find Server Action" / stale-action-ID 500** → **Hypothesis 3** (dev-only).
  - a **real exception** inside `getUser()`/`getBlockedError()`/`createClient()` → neither; **STOP and ASK**.
- **D2 — Production build.** Does it reproduce under `npm run build && npm start`? **Reproduces in prod ⇒
  real product bug (Fix A required). Only in `next dev` ⇒ dev-only stale-action-ID — do NOT apply Fix A;
  proceed with Fix B only and record why (see Clarification 1).**
- **D3 — Sibling action.** Does "Send message" (`submitListingInquiry`) succeed on the SAME page?
  BOTH fail ⇒ middleware-wide (Fix A). Inquiry works + report fails ⇒ report-action-specific (re-open
  hyp 2 — STOP and ASK).

**Decision gate:** proceed to Fix A ONLY if D1/D2 confirm a real (prod-reproducing) middleware-corruption
of the server-action POST. Otherwise do NOT touch `middleware.ts` and proceed with Fix B only, recording
the Phase-0 evidence and that Fix A was not applied (see Clarification 1 — stop-and-ask is required only
if the evidence contradicts BOTH known hypotheses or implies a different architecture/product decision).
**Fix B (messaging) proceeds regardless** — the catch-all toast is a real UX defect either way (AC6 from 435).

---

## Fix A — Middleware skips server-action POSTs (apply ONLY if Phase 0 confirms hyp 1)

In `src/middleware.ts`: detect server-action POSTs by method + `Next-Action` header and bypass
`handleI18nRouting` for them, while STILL running `refreshSession` and copying its cookies. **The snippet
below is behavioral guidance, not blind copy-paste (see Clarification 2)** — use the minimal
Next.js-valid response shape this codebase's `NextResponse.next` typing accepts; `tsc` must pass.

```typescript
import { type NextRequest, NextResponse } from 'next/server'

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
```

**Current behavior to preserve:** every NON-action request keeps full `handleI18nRouting` locale
behavior (prefix redirect, default-locale rewrite) unchanged; `refreshSession` + cookie copy run on ALL
requests including the action POST; the matcher config is unchanged; `/api`, `/auth`, `/admin`, `_next/*`
remain excluded.

## Fix B — Per-branch, user-actionable, 4-locale error toasts (AC6 — apply always)

`src/modules/listings/components/ListingReportDialog.tsx` `handleSubmit` currently collapses EVERY
non-`already_reported` error into one `report_error` toast ("Failed to submit report. Please try again.")
which wrongly implies user fault. Replace with a per-branch map keyed off the action's typed `error`:

| Action `error` | Required toast (new key, sq/en/uk/it) |
|---|---|
| `unauthorized` | "Sign in to report this listing." |
| `account_blocked` | "Your account is restricted. Contact support." |
| `account_suspended` | "Your account is temporarily suspended." |
| `save_failed` (server) | "Problem on our side — please try again later." |
| `already_reported` | (UNCHANGED — existing `report_already_reported` → `toast.info`, dialog closes) |
| transport failure / no result | "Connection error — please try again." |
| `invalid_reason` | keep generic (UI guard prevents it) |

- Add the new keys to **all four** locale files (`sq`/`en`/`uk`/`it`) under the report namespace, same
  key set, runtime-verified by switching locale (not just matching counts).
- Do NOT remove the existing success path (`report_success` → `toast.success`, dialog closes) or the
  `already_reported` branch.

## 🔴 Mobile <640 full-width gate (OWNER P0)

This task changes TOAST TEXT and (conditionally) middleware — it does NOT add or restructure any
popup/dialog layout. `ListingReportDialog` already ships as a full-width bottom sheet at <640 (Task 243).
**Required:** confirm in the rendered matrix that the dialog STILL renders as a full-width bottom sheet at
<640 across sq/en/uk/it (uk@320/375/390 mandatory), that the new longer toast strings wrap and do not
clip/overflow at 320, and that the Submit button stays `max-sm:w-full`. No new exemptions. If any layout
regresses, that is in scope to fix. If a genuinely new overlay pattern would be needed, STOP and ASK.

## 🔴 Regression coverage (agent-contract clause 15 — critical-flow-registry "Report listing")

1. **Baseline:** run the existing report-listing tests GREEN first and record it —
   `npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx`.
2. **Add/extend tests** covering the changed behavior:
   - **Fix B:** each typed `error` branch (`unauthorized`/`account_blocked`/`account_suspended`/
     `save_failed`/transport-failure) maps to its OWN distinct toast key (not the catch-all), and
     `already_reported` still → `toast.info` + close, success still → `toast.success` + close.
   - **Fix A (if applied):** a middleware unit test asserting a `POST` with `Next-Action` returns the
     pass-through (`handleI18nRouting` NOT invoked) while a normal GET still routes through it, and
     `refreshSession` cookies are copied in BOTH paths.
3. **Planted-violation proof:** revert each fix locally and show the new test FAILS, then restore GREEN.
   Paste both transcripts.
4. Update the registry "Report listing" row coverage note with the new test + command at approval time.

## Positive flow (happy path)

Logged-in, non-blocked user on `/uk/listings/<slug>` → opens Report dialog → selects `Fraud / scam` →
Submit → `POST` reaches `reportListingAction` (middleware passes the action POST through) → row inserted
(`status='pending'`) → action returns `{}` → `toast.success(report_success)` → dialog closes. Post-
conditions: `listing_reports` row written; no locale redirect on the action POST; normal page navigation
still locale-routes correctly afterward.

## Negative flow (every off-happy-path branch — each needs a verifiable line + locale key)

- **unauthorized** — action returns `unauthorized` → `toast(report_err_unauthorized)` "Sign in to
  report"; no insert; dialog stays open for retry.
- **account_blocked / account_suspended** — typed error → respective restricted/suspended toast; no insert.
- **save_failed** — server/DB error → action logs root cause (`console.error`) + returns `save_failed` →
  "Problem on our side" toast; no false success.
- **already_reported** — UNCHANGED: `toast.info(report_already_reported)` + dialog closes; NOT the
  catch-all.
- **transport failure / no result** — Submit returns no typed result (network/abort) → "Connection
  error" toast; no unhandled JS exception; dialog stays open.
- **invalid_reason** — UI guard prevents submit; if it surfaces, generic message (documented).
- **cancel / dismiss** — Esc, backdrop tap, Cancel → dialog closes, no insert, no toast.
- **double-submit** — Submit disabled / guarded while pending; no duplicate insert.
- **locale mismatch** — same behavior + correct localized toast on sq/en/it as on uk.

## Acceptance criteria

- AC1 — Phase 0 D1/D2/D3 captured verbatim in the session log; the decision is recorded with its
  evidence as exactly one of: **(a)** Fix A applied (prod middleware corruption confirmed); **(b)** Fix A
  NOT applied, Fix B-only outcome (dev-only / non-prod-reproducing — per Clarification 1); or **(c)**
  STOP-and-ASK (evidence contradicts BOTH known hypotheses or requires an architecture/product decision).
- AC2 — **Fix A** (if Phase 0 confirms): `middleware.ts` bypasses `handleI18nRouting` for
  `POST + Next-Action`, preserves `refreshSession` + cookie copy on both paths, non-action routing
  unchanged. Verifiable at file:line + middleware regression test.
- AC3 — **Fix B**: `ListingReportDialog.handleSubmit` maps each typed error to its own toast key; no
  remaining catch-all collapse; success + `already_reported` paths preserved. Verifiable at file:line.
- AC4 — New toast keys present in **all four** locales (sq/en/uk/it), same key set, runtime locale-switch
  confirmed.
- AC5 — Rendered verification matrix (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory): dialog stays
  full-width bottom sheet <640, new strings wrap with no clip/overflow at 320, Submit `max-sm:w-full`.
- AC6 — Regression: baseline recorded GREEN; new tests are mandatory for CHANGED behavior (typed error →
  distinct toast key; transport/no-result → connection toast; success + `already_reported` preserved; and,
  if applied, Fix A middleware behavior). Pre-existing negative-flow behavior (cancel/dismiss,
  double-submit, invalid_reason) may be left to existing tests unless the touched code removes/risks that
  coverage (see Clarification 3). Planted-violation FAIL transcripts present; registry row updated.
- AC7 — `npx tsc --noEmit` = 0 errors; relevant gates (`check:i18n`, `test:listings`) green; clause-14
  file-integrity transcript green. AC-by-AC self-audit table + Files Changed table in the session log.
- AC8 — Update `docs/backlog.md` (Task 458 status) + add a session log under `docs/sessions/`. No
  `git add`/`git commit`.

## Deliverable

Working fix (Fix B always; Fix A iff Phase 0 confirms), 4-locale keys, regression tests with
planted-violation proof, rendered matrix, registry row update, session log + Files Changed table,
backlog update. Stop-and-ask outcomes (if any) documented for the orchestrator.

---

## Clarifications before execution (TAKE PRECEDENCE over any conflicting wording above)

1. **If Phase 0 does NOT confirm production middleware corruption** (D1 = stale-action-ID 500, or D2 =
   reproduces only in `next dev`, or D3 = report-action-specific): do NOT touch `middleware.ts`; proceed
   with **Fix B only**; record the Phase-0 evidence and explicitly state that Fix A was not applied and
   why. **Stop-and-ask is required only if the evidence contradicts BOTH known hypotheses or implies a
   different architecture/product decision** — not for the ordinary "dev-only ⇒ Fix B only" outcome.
   Do NOT halt the whole task: Fix B (the catch-all-toast UX defect) ships either way.

2. **The Fix A snippet is behavioral guidance, not blind copy-paste.** Use the minimal Next.js-valid
   response shape for this codebase (verify against the real `middleware.ts` and the installed
   `next/server` types; the documented header-passthrough form is
   `NextResponse.next({ request: { headers } })`). Required behavior, regardless of exact shape:
   `POST + Next-Action` bypasses `handleI18nRouting`; `refreshSession` still runs; its cookies are copied
   to the returned response; non-action routing is unchanged; `npx tsc --noEmit` passes. If the local
   typing rejects a shape, pick a valid one — do NOT improvise unrelated middleware changes.

3. **Regression scope.** New tests are mandatory for CHANGED behavior only (typed error → distinct toast
   key; transport/no-result → connection toast; success + `already_reported` preserved; Fix A middleware
   behavior if applied). Pre-existing negative-flow behavior (cancel/dismiss, double-submit,
   invalid_reason) may be verified by existing tests; add new ones only where coverage is absent or the
   touched code risks regressing it. Keep this a focused fix, not a full UI-test rewrite.
