# Task 435 — Report-listing submit failure: DIAGNOSE ONLY (Epic BB)

> **Type:** DB / server-action / RLS bug diagnosis. **NO product-code edits this task.**
> **Owner-reported (2026-06-15):** the `Report this listing` dialog opens, a reason is selectable,
> but `Submit report` returns the generic toast **“Failed to submit report. Please try again.”**
> This is a SEPARATE latent bug. It MUST NOT be mixed into Task 432 (clear-history no-op toast),
> Task 433 (globals.css / Tailwind source), or Task 434 (AdminTable hydration whitespace).

## Pre-read (rule-index → DB / server-action / RLS task)

- `docs/agent-contract.md` (P0 clauses 1–14 — always)
- `docs/backlog.md` (always)
- `docs/data-access-rules.md`
- `docs/rls-rules.md`
- `docs/domain-rules.md`
- `docs/qa-rules.md`

## Hard contract (P0 — verified against the diff on return)

This is a **diagnosis** task. The ONLY deliverable is a root-cause report file (see below).
- **Do NOT edit product code** (`src/`, migrations, SQL, locales) this task. If a fix is obvious,
  describe it in the report; do not apply it. The orchestrator opens a separate fix task.
- Do NOT change scope, do NOT invent architecture, STOP and ASK if blocked.
- No `git add` / `git commit` — orchestrator emits commits.

## 🔴 ACTUAL ERROR SIGNATURE (owner browser console, 2026-06-15) — READ THIS FIRST

The failure is **NOT a returned `save_failed` and NOT (primarily) RLS.** The owner's browser console shows
the **server-action POST itself failing at the transport layer**:

```
reportListing.ts:23 Fetch failed loading: POST "http://localhost:3000/uk/listings/<slug>".
  (anonymous) @ fetch.ts:86
  fetchServerAction @ server-action-reducer.ts:92
  ... action @ react-server-dom-turbopack-client.browser.development.js
  (anonymous) @ reportListing.ts:23
  handleSubmit @ ListingReportDialog.tsx:53
```

A `listing_reports` RLS denial would return **HTTP 200 with `{ error: 'save_failed' }`** and a clean error
toast — it would NOT log "Fetch failed loading". "Fetch failed loading: POST" means the action POST got a
**500 / aborted / intercepted response** (no normal RSC payload). So the **prior RLS / Task 270 hypothesis
is DEMOTED** to a low-priority candidate. Re-prioritised hypotheses (most→least likely given this signature):

1. **Middleware interferes with the server-action POST on a localized route.** `src/middleware.ts` matcher
   catches `/uk/listings/...` for **all methods including POST**, and runs BOTH `handleI18nRouting`
   (next-intl) and `refreshSession` on it. next-intl middleware running on a server-action POST is a known
   footgun that yields exactly this "Fetch failed loading: POST". Inspect whether `handleI18nRouting`
   redirects/rewrites the POST (the action dispatch needs the POST to reach the route unchanged), and
   whether the action POST should be skipped (it carries `Next-Action` + `Next-Router-State-Tree` headers).
2. **The server action throws an unhandled exception (500)** before returning a typed error. Decisive
   evidence = the **Next.js dev SERVER TERMINAL** stack at click time (NOT the browser console). Candidates
   inside the call chain: `getUser()`, `getBlockedError()` (`src/lib/auth/blockCheck.ts` — `createClient()`
   + `.single()`), or `createClient()`.
3. **Dev-only stale server-action ID.** The logs show heavy `[Fast Refresh] rebuilding` around the failure.
   In `next dev`, a page rendered before a recompile can POST a server-action ID the new bundle no longer
   knows → the POST 500s. **This would NOT reproduce on a production build.**
4. **RLS / `auth.uid()` mismatch (DEMOTED).** Only relevant if the server log shows a 200 + Postgres
   `42501`; left in as the prior Task-270 lead (`docs/sessions/2026-05-28-task-270-rls-insert-tightening.md`
   dropped the permissive `"Users can create reports"` policy, leaving `WITH CHECK (auth.uid() = user_id)`).

**Three cheap discriminators to capture FIRST (they collapse the hypothesis space):**
- **(D1) Server terminal output** at the moment of clicking Submit — the real 500/stack. This is the single
  most decisive artifact; the browser console is a dead end here.
- **(D2) Production build:** does it reproduce under `npm run build && npm start`, or ONLY in `next dev`?
  Only-in-dev ⇒ hypothesis 3 (stale action id), not a real product bug.
- **(D3) Sibling action:** does the **"Send message" / listing inquiry** server action (Task 243) succeed on
  the SAME `/uk/listings/<slug>` page? Inquiry works + report fails ⇒ report-action-specific (hyp. 2).
  BOTH fail ⇒ middleware-wide on localized POSTs (hyp. 1).

## Known code facts (already traced by the orchestrator — start here, do not re-derive)

- UI: `src/modules/listings/components/ListingReportDialog.tsx` → `handleSubmit` calls
  `reportListingAction(listingId, reason, comment)`. The **generic** `toast.error(t('report_error'))`
  ("Failed to submit report…") fires for **ANY** returned `result.error` that is **not** `already_reported`.
  So the toast is a catch-all — the real cause is the specific `error` string the action returned.
- Action: `src/modules/listings/actions/reportListing.ts → reportListingAction`. It can return:
  - `unauthorized` (no logged-in user),
  - a block error (`getBlockedError`),
  - `invalid_reason` (reason not in `spam|fraud|duplicate|wrong_category|offensive|other`),
  - `already_reported` (handled separately in the UI — NOT this bug),
  - **`save_failed`** — the `.from('listing_reports').insert(...)` returned a Postgres error;
    the real error is logged server-side at line ~61: `console.error('[reportListing] insert failed', error)`.
- The screenshot shows **Fraud / scam** selected → maps to enum value `fraud`, which IS valid.
  So `invalid_reason` is unlikely; the prime suspect is **`save_failed`** (a DB-level rejection on
  the `listing_reports` insert) or `unauthorized`/block if the session is not what's assumed.

## Diagnose — ordered steps (NO fix)

1. **Reproduce** the failure in the running app: open a listing detail page → `Report this listing`
   → pick `Fraud / scam` → `Submit report`. Confirm the generic toast appears.
2. **Capture all three evidence layers** and paste them verbatim into the report:
   - **Browser console** (any client error / network 500).
   - **Network/server-action response** — the exact `{ error: '…' }` string returned by
     `reportListingAction` (which branch fired: `unauthorized` / block / `invalid_reason` / `save_failed`).
   - **Terminal / server log** — specifically the `[reportListing] insert failed` line and the full
     Postgres error object (code, message, details, hint) if `save_failed`.
3. **Classify the root cause** into exactly one of:
   - **auth/session** — `getUser()` null at action time (e.g. cookie/session not reaching the action),
   - **block** — `getBlockedError` returning truthy for this account,
   - **RLS** — `listing_reports` has no/incorrect INSERT policy for the authenticated role
     (check the table's policies; cross-ref `docs/rls-rules.md`),
   - **schema drift** — `listing_reports` table/columns (`listing_id`, `user_id`, `reason`,
     `comment`, `status`) missing or renamed vs. the insert (cross-ref `check-schema-drift` output),
   - **enum / check-constraint mismatch** — DB `reason` enum or `status` check rejects `fraud`/`pending`,
   - **other** (name it precisely).
4. **Name the minimal affected files / DB objects** for the eventual fix (table, policy, enum, migration).
5. Do NOT edit product code. Stop after the report.

## Positive flow (what a healthy submit should do — for contrast in the report)

Logged-in, non-blocked user → valid reason → `listing_reports` row inserted (`status='pending'`)
→ `reportListingAction` returns `{}` → `toast.success(report_success)` → dialog closes.
The report must state which step actually breaks.

## Negative flow (branches to confirm/rule-out, each with evidence)

- **unauthorized** — action returns `unauthorized`; confirm whether the session reaches the action.
- **blocked** — `getBlockedError` truthy; confirm the test account's `status`/block fields.
- **already_reported** — duplicate guard hit (UI shows `report_already_reported`, NOT the generic toast — so if the generic toast shows, this is NOT the branch).
- **invalid_reason** — only if the submitted value is outside the enum (shouldn't be for `fraud`).
- **save_failed (PRIME SUSPECT)** — capture the Postgres error; decide RLS vs schema-drift vs constraint.

## Deliverable

- A root-cause report at `docs/governance-reports/2026-06-15-task435-report-listing-submit-rootcause.md`
  containing: reproduction, the three evidence layers verbatim, the single classified root cause,
  the minimal affected files/DB objects, and a recommended fix (described, NOT applied).
- Update `docs/backlog.md` (Task 435 → diagnosis complete, root cause = X, fix routed to follow-up)
  and add a session log under `docs/sessions/`. Include the "Files Changed" table (report + docs only).

## Acceptance criteria

- AC1 — Failure reproduced; generic toast confirmed (Positive flow break-point identified).
- AC2 — All three evidence layers captured verbatim (console + action response + server/Postgres log).
- AC3 — Exactly one root cause classified from the list in step 3, justified by the captured evidence
  (maps to the relevant Negative-flow branch).
- AC4 — Minimal affected files / DB objects named for the fix; recommended fix described, NOT applied.
- AC5 — No product-code/SQL/locale edits in the diff (report + backlog + session log only).
- AC6 — **UX-messaging finding (owner point, 2026-06-15):** the report MUST flag that
  `ListingReportDialog.handleSubmit` collapses EVERY non-`already_reported` error into one
  unhelpful catch-all toast (`report_error` = "Failed to submit report. Please try again."),
  which wrongly implies user fault and gives no actionable cause. The recommended fix MUST include
  a per-branch, user-actionable, **4-locale (sq/en/uk/it)** message map — e.g. `unauthorized` →
  "sign in to report", `blocked` → account-restricted message, true server/`save_failed` →
  an honest "problem on our side, try again later" (NOT "you did something wrong"). This messaging
  fix is part of the follow-up fix task, NOT applied here.

---

## 🔁 ORCHESTRATOR REVIEW — REWORK (minor, documentation-accuracy only) · 2026-06-18

Diff-verified against the real files (`src/middleware.ts:6-11`, both deliverable docs, this kickoff,
`critical-flow-registry.md` report-listing row). The middleware mechanism is plausible and the
RLS-demotion is correct, but the report **overstates confidence**: AC1/AC2/AC3 are only partially
satisfiable from a browser console alone (D1/D2/D3 never captured), so a *confirmed* single root cause
cannot be claimed yet. **Apply these doc edits only — no product code, no new evidence invented:**

- **R1 — Downgrade the certainty wording.** Replace every categorical "Root cause:" with
  **"Primary probable cause (pending D1/D2/D3 confirmation):"** in BOTH files (report §"Root cause
  classification" + session log §"Root cause"/"Summary").
- **R2 — Remove the unproven causal claim.** In the session log, line "The action never executes
  because the POST dies in middleware" → **"The available evidence is consistent with the POST failing
  before the action runs; the server terminal (D1) is required to confirm."**
- **R3 — Co-rank Hypothesis 3.** The heavy `[Fast Refresh] rebuilding` logs make the dev-only
  stale-action-ID at least co-primary, not merely "CONTRIBUTING". State that **D1 (server terminal) is
  the single decisive artifact** that distinguishes hyp 1 (middleware redirect/rewrite) from hyp 3
  (stale action id). Note the hole in hyp 1: if `/uk/...` already carries the correct locale prefix,
  `handleI18nRouting` returns a pass-through `next()`, NOT a redirect — so middleware-corruption is only
  decisive if D1 shows a redirect/rewrite or no terminal stack.
- **R4 — Harden Fix A for the follow-up.** Bind the guard to POST and import the symbol:
  `const isServerAction = request.method === 'POST' && request.headers.has('Next-Action')` and add
  `import { NextResponse } from 'next/server'`. Keep `refreshSession` + cookie-copy on the action path.
- **R5 — Mark status honestly.** Title the deliverable a **hypothesis-ranked diagnosis pending owner
  discriminators**, not "root cause confirmed". The follow-up FIX task **must start by capturing D1/D2/D3
  before applying or approving the fix** (these are its first steps, not a blocker that stops it from opening).
- **R6 — AC5 / commit hygiene.** `scripts/.../schema-drift-check.sql` (timestamp-only churn from an
  earlier `check:schema-drift` run) MUST NOT be in the Task 435 commit — this is a docs-only task.
  Owner confirms via NATIVE `git status` and reverts/leaves it unstaged.

**Verdict: REWORK — minor.** Not a blocker for the eventual middleware fix; the direction is right.
After R1–R5 land (docs only), Task 435 closes as a *diagnosis*, and the FIX task opens with D1/D2/D3
capture as its first steps (before applying or approving the fix).
