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
