# Task 442 — Regression Shield · SLICE 3: Listings-lifecycle smoke + gate (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** See `tasks/Epics/Epic_RS_Regression_Shield.md` +
> `docs/critical-flow-registry.md` (P0/P1 — Listings lifecycle section).
> **🔴 PREVENTION ONLY.** This slice does NOT fix or redesign any listing flow. It builds the regression
> net for the listings lifecycle so those flows cannot silently break again. No product change, no migration,
> no UI rework, no "while I'm here" fix (Epic RS hard boundary). Tests assert the **existing shipped behavior**.
> **Harness is already chosen:** reuse the Vitest + jsdom harness established in Slice 2 (Task 441) — these are
> server-action and component-contract flows, observable at the call/return level. Do NOT introduce Playwright or
> any parallel e2e stack. If a flow genuinely cannot be asserted without product changes, **STOP and ASK** — do
> not invent scope.

## Goal

A reliable, non-flaky Vitest smoke suite covering the P0/P1 listings-lifecycle flows in the registry, wired
into CI as a blocking step, each with a planted-violation FAIL transcript. Smallest reliable happy path + one
known failure/edge path per flow — NOT every UI state, NOT flaky.

## Pre-read (rule-index → Regression/critical-flow + Listings)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md` (test/error-handling conventions; "Actionable Error-Toast Rule")
- `docs/domain-rules.md` (listing status model + the listing transition state machine / Task 427 privileged any-status rule)
- `docs/ai-behavior.md` (Note 18 self-validation)
- **Existing infra to MIRROR, do not reinvent:** `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts`
  (Slice 1 pattern: hoisted `vi.mock` at the module boundary, `mockFrom` table-name spy, `console.error`
  assertion), `package.json` `test:auth` script, `.github/workflows/governance-pr.yml`, `src/tests/setup.ts`.

## Source of truth — the actual signatures under test (assert these literally)

- **Create:** `createListing(payload)` (`src/modules/listings/actions/createListing.ts`)
  → `{ slug: string } | { error: string }`. Inserts into `listings` with `status: 'pending'`.
  Error codes: `'unauthenticated'`, block-error, `'validation_failed'` (zod `listingSchema`),
  `insertError.message ?? 'insert_failed'` (logs `console.error('Failed to create listing', …)`).
- **Edit:** `updateListing(...)` (`src/modules/listings/actions/updateListing.ts`)
  → `{ slug: string; status: ListingStatus } | { error: string }`. Error codes:
  `'unauthenticated'`, `'not_found'`, `check.reason` (permission), `'validation_failed'`,
  `updateError.message ?? 'update_failed'`.
- **Status change:** `applyListingTransitionByStatus(listingId, toStatus, actor)` and its thin bridge
  `changeListingStatusAction(listingId, toStatus)` (`applyListingTransition.ts` / `changeListingStatus.ts`)
  → `TransitionApplicationResult = { ok: true; nextStatus; listingId } | { ok: false; reason: 'not_found' | 'invalid_transition' | 'forbidden' | 'db_error' }`.
  Pure engine: `resolveTransition`, `canSetStatusPrivileged`, `getPrivilegedTargetStatuses`
  (`src/modules/listings/domain/listingTransitionEngine.ts`).
- **Report listing:** `reportListingAction(...)` (`src/modules/listings/actions/reportListing.ts`)
  → `{ error?: string }` (`'unauthorized'`, `'invalid_reason'`, `'already_reported'`, db error).
  **Action-level smoke ALREADY EXISTS** (`reportListing.smoke.test.ts`, Task 436/448) — do NOT duplicate it.
  This slice adds ONLY the still-open **dialog-open** coverage the registry row defers to 442.
- **Inquiry / send message:** `submitListingInquiry(input)` (`src/modules/listings/actions/submitListingInquiry.ts`)
  → `{ error?: 'rate_limited' | 'validation' | 'not_found' | 'save_failed' | 'owner_unavailable' | 'email_transient' }`
  or `{}` on success. Inserts into `listing_inquiries` (`status: 'new'`), then
  `sendListingInquiryNotification(...)`. Rate limit: 5 / IP / hour (`'unknown'` IP never limited).

## Required investigation (report in session log BEFORE writing tests)

1. Confirm the Vitest harness reuse is correct for each flow (server actions = call/return contract;
   dialogs = RTL render in jsdom). Note which seam each test mocks (`@/lib/supabase/server`,
   `@/lib/supabase/admin`, `@/lib/auth/server` `getUser`, `next/headers`, `sendListingInquiryNotification`).
2. For **status change**, confirm whether to assert via the pure engine (`resolveTransition` /
   `canSetStatusPrivileged` — fast, no DB) for the legal/illegal-matrix cases AND via
   `applyListingTransitionByStatus` (mocked admin client) for the write + typed-result contract. Both are
   in scope: the pure-engine test proves the matrix, the gateway test proves the write + `reason` codes.
3. For **report dialog open**, confirm the dialog component path and that it can render in jsdom without a
   running server; if it cannot be mounted without product changes, document it as the reason and keep the
   existing action-level smoke as the coverage (STOP and ASK before changing the component).

## Flows to cover (registry: P0/P1 — Listings lifecycle)

For each, happy path + one failure/edge path; reuse the registry's happy/failure columns as the contract:

- **Create listing** — valid payload → `{ slug }`, inserted with `status:'pending'`; **failure:**
  `listingSchema` invalid → `{ error: 'validation_failed' }` (and unauthenticated → `'unauthenticated'`).
- **Edit listing** — valid edit by permitted actor → `{ slug, status }` persisted; **failure:**
  `not_found` and/or `validation_failed` (and permission `check.reason`).
- **Status change** — legal/privileged transition persists → `{ ok:true, nextStatus }`; **failure:** an
  illegal transition is blocked → `{ ok:false, reason:'invalid_transition' }` (and `forbidden` for a
  non-owner/non-admin actor). Pure-engine matrix: `canSetStatusPrivileged(owner/admin) === true`,
  a disallowed plain-user transition is refused.
- **Report listing** — **dialog-open smoke only** (action smoke already covered): the report dialog opens,
  renders its reason options + submit, and submitting invokes `reportListingAction` with the selected reason.
  Failure/edge: `already_reported` / `invalid_reason` surfaces the typed error (assert via the existing
  action smoke; the dialog test asserts the wiring, not a second copy of the action contract).
- **Inquiry / send message** — valid input → insert into `listing_inquiries` (`status:'new'`) →
  `sendListingInquiryNotification` called → `{}`; **failures (assert at least two):** short message / bad
  email → `'validation'`; rate-limited (6th in window) → `'rate_limited'`; missing listing → `'not_found'`;
  email send fails → `'email_transient'` (partial-success: row written, typed transient error returned).

## Gate requirements

- Add a `test:listings` script in `package.json` running exactly the new + existing listings smoke files
  (mirror the `test:auth` script shape).
- Wire `npm run test:listings` into `.github/workflows/governance-pr.yml` as a **blocking** step (place it
  alongside the Slice 2 `test:auth` step). Document the exact local command.
- The suite must be deterministic: no real Supabase, no real email, no network — stub at the module boundary
  (mirror `reportListing.smoke.test.ts`). No flaky timing.
- Where a flow asserts a failure is **diagnosable**, assert `console.error` is called with the root cause
  (qa-rules "Actionable Error-Toast Rule"), as the report-listing `save_failed` smoke already does.

## Positive flow

Clean tree: `npm run lint` + `npx tsc --noEmit` pass; `npm run test:listings` runs the listings smoke suite
green (every happy path + each chosen failure/edge path); `docs/critical-flow-registry.md` updated; CI step
present and blocking.

## Negative flow (PROOF each gate is real)

A planted-violation transcript **per gate** in the session log: break one asserted invariant → the
corresponding smoke FAILS → revert → green. Concrete suggested plants (use these or equivalents):

- **Create:** force `status: 'active'` instead of `'pending'` in the insert → happy-path status assertion FAILS.
- **Edit:** drop the `not_found` early-return → `not_found` assertion FAILS.
- **Status change:** make `canSetStatusPrivileged` return `true` for a disallowed plain-user transition →
  illegal-transition assertion FAILS.
- **Inquiry:** return `{}` instead of `{ error: 'rate_limited' }` past the limit → rate-limit assertion FAILS;
  and/or remove the `console.error` on `save_failed` → diagnosable assertion FAILS.

A gate that cannot be made to fail is a no-op = **TASK FAILURE**.

## Registry update (required)

In `docs/critical-flow-registry.md` "P0/P1 — Listings lifecycle (Slice 3 / Task 442)":
- Flip **Create listing**, **Edit listing**, **Status change**, **Inquiry / send message** rows
  `❌ → ✅` with the exact `npx vitest run …` command(s) and a one-line evidence summary (happy + failure
  + planted-violation), matching the format Slice 2 used.
- **Report listing** row stays `✅` — append the dialog-open coverage note (do not remove the existing
  Task 436/448 action-smoke evidence).

## Out of scope

No product redesign; no migration; no fix to Task 433/434/435/437/439; no incidental bug fixes. No change to
any listing action, component, or the transition engine (tests only — if a flow is not testable without a
product change, STOP and ASK). No Playwright / parallel e2e stack. No mobile/responsive UI change (no rendered
surface is modified by this slice, so the `<640` full-width gate is N/A — state this explicitly in the log).
No coverage beyond the registry's listings rows.

## Acceptance criteria

- **AC1** — New Vitest smoke file(s) under `src/modules/listings/**/__tests__/` covering Create, Edit, Status
  change (gateway + pure engine), Inquiry, and the Report dialog-open wiring; harness reused from Slice 2 (no
  new stack invented).
- **AC2** — Each flow has happy path + ≥1 failure/edge path, asserting the LITERAL return shapes/error codes
  listed in "Source of truth" above (`'validation_failed'`, `not_found`, `{ ok:false, reason:'invalid_transition' }`,
  `'rate_limited'`, `'email_transient'`, etc.).
- **AC3** — Diagnosable-failure paths assert `console.error` is called with the root cause where the action logs it.
- **AC4** — `test:listings` script added to `package.json`; runs the new + existing (`reportListing.smoke.test.ts`)
  listings smoke files.
- **AC5** — `npm run test:listings` wired into `governance-pr.yml` as a blocking step; exact command documented.
- **AC6** — Each gate has a planted-violation FAIL → revert → PASS transcript in the session log.
- **AC7** — `docs/critical-flow-registry.md` listings rows flipped to ✅ with commands + evidence; Report row
  dialog-open note appended.
- **AC8** — No product/UI/migration change; no fix to live bugs; no unrelated refactor.
- **AC9** — `npx tsc --noEmit` clean.
- **AC10** — `npm run lint` clean.
- **AC11** — `npm run check:file-integrity:all` clean (every touched file: 0 NUL, parses, not truncated).
- **AC12** — Investigation notes (harness reuse rationale, stubbing seams, status-change pure-vs-gateway split,
  report-dialog mountability) in the session log.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run test:listings`, `npm run check:file-integrity:all` — all green
  on every touched file. Provide the AC-by-AC self-audit table + the **"Files Changed"** table in the session
  log. **Do NOT run git** — the orchestrator reviews the diff and emits the commit commands.

## Deliverables / expected Files Changed

- `src/modules/listings/actions/__tests__/createListing.smoke.test.ts` — NEW (Create)
- `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts` — NEW (Edit)
- `src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts` — NEW (Status: gateway + pure engine)
- `src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts` — NEW (Inquiry)
- `src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` — NEW (Report dialog-open wiring)
- `package.json` — MODIFIED (`test:listings` script)
- `.github/workflows/governance-pr.yml` — MODIFIED (blocking `test:listings` step)
- `docs/critical-flow-registry.md` — MODIFIED (listings rows ✅ + Report dialog note)
- `docs/sessions/2026-06-16-task442-listings-lifecycle-smoke.md` — NEW (session log)
- `docs/backlog.md` — MODIFIED (Last Session + Task 442 status)

(Exact file names may adjust if investigation finds an existing companion test to extend — note any deviation
in the Files Changed table.)
