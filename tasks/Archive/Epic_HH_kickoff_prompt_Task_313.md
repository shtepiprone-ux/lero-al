# Epic HH — Task 313 kickoff (Phase 6) — Verified Agents workflow (state machine + profile Actions panel + public badge)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract + Positive/Negative two-flow rule. Epic HH Phase 6 — INDEPENDENT of the mobile-migration tasks.
> **🔴🔴 HARD BLOCK: this task does NOT begin implementation until the owner SIGNS OFF the DB schema below. Step 1 is a
> schema-confirmation STOP & ASK. Do not write a migration or any code before that sign-off.**

```
Type:        feature + workflow + DB (state machine)
Priority:    medium (product feature; DB-gated)
Area:        users table verification action (REMOVE primary action from table) → user profile right-side Actions panel
             (ADD the workflow there) + public verified badge on listing cards / listing detail / agent profile
```

## Goal
Replace the current one-click "verify" action in the users table with a real **verification state machine** anchored on
the **user profile page's right-side Actions panel** (Note 21 control relocation). States:
`not_verified → pending_review → verified | rejected → revoked` (with reopen-review from rejected/revoked). Each action:
admin confirmation modal + reason/note (REQUIRED for reject/revoke) + audit trail. Users table: verification **badge +
filter** + row-click → profile (NO primary verify action in the table). Public "Verified" badge shows **only if**
`verification_state = 'verified'`.

## 🔴 Step 1 — DB schema sign-off (STOP & ASK before any code)
Owner pre-approved DIRECTION (Epic HH Decision 6/7); the exact migration must be confirmed before implementation. Present
this for sign-off and WAIT:
- `users.verification_state` enum: `not_verified | pending_review | verified | rejected | revoked` (default `not_verified`).
- `user_verification_events` audit table: `id, user_id, prior_state, new_state, reason, actor_id, created_at`.
- RLS: only admin (and moderator IF granted via `role_permissions`, default-deny) may transition; events insert
  server-side only; public reads `verification_state` via a safe view/column (no PII leak — align with the
  `public_user_profiles` pattern, Task 266).
- EXACT idempotent SQL written to the session log; **single-writer — the owner runs it.** Do NOT run migrations yourself.
After sign-off, proceed; if anything in the schema is ambiguous, STOP & ASK again.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `tasks/Epics/Epic_HH_Admin_UX_System.md` (Phase 6 + Decisions 6/7 — the fixed direction).
3. `docs/rule-index.md` → "Schema / migration task" + "Control-relocation task" + "Admin table / admin control task"
   → `data-access-rules`, `rls-rules`, `domain-rules`, `architecture`, `component-rules`, `ai-behavior` Notes 20/21/22,
   `design-system.md` (§14 modals, §16), `qa-rules`.
4. Read before editing: `AdminUsersTable.tsx` (current verify action + verified-agents tab), `AdminUserProfile.tsx`
   (the right-side Actions panel target), the `role_permissions` helper (gating), `public_user_profiles` view (Task 266,
   for the public badge), listing card + listing detail + agent profile components (where the badge renders).
5. `package.json` validation scripts.

## Current behavior to preserve (Notes 20/21/22)
- The users table verified-agents tab + filter — PRESERVE (filter stays; the **primary verify action MOVES** to the
  profile Actions panel; the table keeps badge + filter + row-click-to-profile).
- The profile Actions panel's existing controls — preserve; ADD the verification workflow alongside.
- **Control Relocation Rule (Note 21):** removing the table's verify action is allowed ONLY because the new editable
  location (profile Actions panel) ships in THIS task. The capability must never disappear.
- Inventory users-table + profile-panel controls before/after in the session log.

## 🔴 Mobile <640 full-width gate (clause 11)
The verification confirmation modal = full-width bottom sheet at <640 (reason Textarea required for reject/revoke,
≤90dvh scroll, Esc + backdrop close, focus return). Action buttons in the profile panel `max-sm:w-full`, ≥44px; the panel
folds full-width below content at <640. Public badge wraps/scales, never clips, all 4 locales.

## Positive flow (happy path)
As admin at uk 375px:
1. Users table shows a verification badge + status filter; clicking a row opens the user profile (NO verify action in row).
2. On the profile right-side Actions panel: the current state is shown with allowed transitions (state-machine driven).
3. Transition (e.g. `pending_review → verified`) → confirmation modal (reason optional for verify, REQUIRED for
   reject/revoke) → confirm → `users.verification_state` updates + a `user_verification_events` row is written
   (prior/new/reason/actor/time) → success toast → profile + table badge reflect the new state after revalidation.
4. Public: a `verified` agent shows the "Verified" badge on listing cards / listing detail / agent profile; non-verified
   states show no badge.

## Negative flow (every branch needs a diff line)
- Reject/revoke WITHOUT a reason → blocked (validation), no transition.
- Illegal transition (not allowed from current state) → not offered + server-side guard rejects.
- Permission-denied (moderator without grant) → action hidden AND server denies (RLS), no event.
- Server error → error toast, state unchanged, no event row.
- Cancel/dismiss confirm → no transition, focus returns.
- Double-submit → disabled while pending.
- Public badge: non-`verified` states (pending/rejected/revoked/not_verified) → badge hidden everywhere.
- Locale mismatch → workflow labels + states + badge resolve in active locale, no raw key.
- Concurrent admins transitioning the same user → optimistic-concurrency guard (last write loses or is rejected — decide
  + document; if ambiguous STOP & ASK).

## Acceptance criteria
- DB schema signed off by owner (Step 1) BEFORE code; exact idempotent SQL in session log; owner runs it.
- Verification action lives on the profile Actions panel as a state machine; table keeps badge + filter + row→profile
  (verify action removed from table per Note 21 with the new location shipped).
- Every transition writes a `user_verification_events` audit row; reject/revoke require a reason; RLS enforces gating.
- Public "Verified" badge shows only for `verified`; hidden otherwise; rendered on cards + detail + agent profile.
- Before/after control inventory (Notes 20/21/22); Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it; uk@320/375/390; badge + modal shown.
- `tsc=0`, `lint=0`, `check:i18n` parity PASS (workflow + state + badge labels ×4), `npm run build` passes.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- Internal Tickets / Reports workflow refinements (separate future tasks). Any non-verification profile change.
- Running the migration yourself (single-writer; owner runs SQL). Re-litigating Decisions 6/7 (fixed direction).
