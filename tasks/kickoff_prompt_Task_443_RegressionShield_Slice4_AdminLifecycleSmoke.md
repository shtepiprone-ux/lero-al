# Task 443 — Regression Shield · SLICE 4: Admin-lifecycle smoke + gate (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** See `tasks/Epics/Epic_RS_Regression_Shield.md` +
> `docs/critical-flow-registry.md` (P0 — Admin lifecycle section).
> **🔴 PREVENTION ONLY.** This slice does NOT fix or redesign any admin flow. It builds the regression net for
> the admin lifecycle so those flows cannot silently break again. No product change, no migration, no UI rework,
> no "while I'm here" fix (Epic RS hard boundary). Tests assert the **existing shipped behavior**.
> **Harness is already chosen:** reuse the Vitest harness established in Slice 2/3 and in the existing admin
> smokes (`updateUserProfileFull.smoke.test.ts`, `clearHistory.smoke.test.ts`) — these are server-action
> call/return contracts, observable at the call/return level. Do NOT introduce Playwright or any parallel e2e
> stack. If a flow genuinely cannot be asserted without product changes, **STOP and ASK** — do not invent scope.

## Goal

A reliable, non-flaky Vitest smoke suite covering the P0 admin-lifecycle flows in the registry, consolidated
under a single `test:admin` script wired into CI as a blocking step, each new gate with a planted-violation
FAIL transcript. Smallest reliable happy path + one known failure/edge path per flow — NOT every UI state, NOT
flaky.

**The one real coverage gap this slice closes:** `hardDeleteUser` (registry row currently `❌`). The other
admin-lifecycle rows already have smokes (`updateUserProfileFull` → Task 448; `clearHistory` success + no-op
race → Task 436); Slice 4 **consolidates** them into `test:admin` + the CI gate and confirms they stay green —
it does NOT rewrite them.

## Pre-read (rule-index → Regression/critical-flow + Admin)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md` (test/error-handling conventions; "Actionable Error-Toast Rule")
- `docs/rls-rules.md` (admin permission boundaries; `users.hard_delete` is a privileged action)
- `docs/domain-rules.md` (listing-archive-on-owner-delete behavior; transition engine)
- `docs/ai-behavior.md` (Note 18 self-validation; Note 22 Admin Table Preservation — context only, no UI change)
- **Existing infra to MIRROR, do not reinvent:**
  `src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts` (admin harness: hoisted `vi.mock`
  of `@/lib/auth/server` `getUser`, `@/lib/auth/permissions` `hasPermission`/`roleHasPermission`,
  `@/lib/supabase/admin` `createAdminClient` with a table-name `from()` router + `auth.admin.deleteUser` spy,
  and `@/modules/listings/actions/applyListingTransition` stubbed),
  `src/modules/admin/actions/__tests__/clearHistory.smoke.test.ts`,
  `package.json` `test:auth` / `test:listings` scripts, `.github/workflows/governance-pr.yml`.

## Source of truth — the actual signatures under test (assert these literally)

- **Hard-delete user (THE GAP):** `hardDeleteUser(userId)` (`src/modules/admin/actions/index.ts:564`)
  → `{ error?: string }`. Ordered contract:
  1. `hasPermission('users.hard_delete')` → falsy (or throws) → `{ error: 'forbidden' }` (NO DB touched).
  2. `getUser()` null → `{ error: 'Unauthorized' }`.
  3. Archives every non-terminal listing of the user via `applyListingTransitionByStatus(id, 'archived', actor)`
     (actor `{ role: 'admin', source: 'admin_panel' }`) — listings stay in the system, not orphaned.
  4. `db.from('users').delete().eq('id', userId)` → on `profileError`:
     `console.error('hardDeleteUser profile failed', { error, userId })` → `{ error: 'delete_failed' }`
     **and `auth.admin.deleteUser` is NOT called** (critical ordering: profile fail aborts before auth delete).
  5. `db.auth.admin.deleteUser(userId)` → on `authError`:
     `console.error('hardDeleteUser auth failed', { error, userId })` → `{ error: 'profile_deleted_auth_failed' }`.
  6. Success → `{}`. **Critical invariant (email-reuse class):** on the happy path
     `auth.admin.deleteUser(userId)` MUST be called — this is what frees the email for re-signup. The exact
     bug class this registry row exists to guard (mirror of the Slice-2 self-delete invariant, Task 441/439).
- **User status / role / account-type change (ALREADY COVERED — Task 448):** `updateUserProfileFull(userId, data)`
  (`index.ts:319`) → `{ error?: string }`. Status change writes `user_status_history`; profile-type change
  writes `user_change_log`; non-admin/moderator → `{ error: 'Forbidden' }`; no session → `{ error: 'Unauthorized' }`.
  Do NOT rewrite — just include the existing smoke in `test:admin` and confirm green.
- **Clear history success + no-op race (ALREADY COVERED — Task 436/432):** `clear_user_history()` RPC via the
  `clearHistory` actions → success clears + audits; rpc failure → `clear_failed` + `console.error`; no-op race
  → `{ cleared: 0 }` neutral path. Do NOT rewrite — include the existing smoke in `test:admin` and confirm green.

## Required investigation (report in session log BEFORE writing tests)

1. Confirm the `updateUserProfileFull.smoke.test.ts` admin harness mounts `hardDeleteUser` cleanly: which seams
   to mock for the new test — `@/lib/auth/permissions` `hasPermission` (set `true` for `'users.hard_delete'` on
   the happy path), `@/lib/auth/server` `getUser`, `@/lib/supabase/admin` `createAdminClient` (a `from()` router
   that returns a `delete().eq()` spy for `'users'`, a `select().eq().not()` chain returning the
   listings-to-archive array, plus an `auth.admin.deleteUser` spy), and
   `@/modules/listings/actions/applyListingTransition` `applyListingTransitionByStatus` (stub `{ ok: true }`).
2. Confirm the **ordering** assertions are observable: profile-delete-fail must leave `auth.admin.deleteUser`
   un-called (the email is NOT freed on a half-delete); the happy path must call it exactly once.
3. Confirm the two already-covered smokes run unchanged under the new `test:admin` script (no edits to them).
4. Confirm the **admin list/detail hydration rows stay `🟡`**: "Admin users list loads" (`/admin/users`) and
   "Admin user detail loads" (`/admin/users/[id]`) are owner-run hydration-gate flows that require a live server
   + real auth cookies + a real user UUID — they are NOT deterministic Vitest smokes and are explicitly out of
   scope to flip here (their CI job lands in Slice 6 / Task 445). Document this; do NOT attempt to fake them.

## Flows to cover (registry: P0 — Admin lifecycle)

For each, happy path + one failure/edge path; reuse the registry's happy/failure columns as the contract:

- **Hard-delete user (NEW smoke)** — happy: permitted admin → non-terminal listings archived (transition called
  per listing) → `users` row deleted → `auth.admin.deleteUser` called once → `{}`. **Assert the call ORDER where
  observable:** every `applyListingTransitionByStatus(...)` archive runs BEFORE `users.delete().eq(...)`, and
  `users.delete().eq(...)` runs BEFORE `auth.admin.deleteUser(userId)` (guards the "auth/profile gone but
  listings never archived" regression). **Failures (assert all):**
  - no permission (`hasPermission` returns `false`) → `{ error: 'forbidden' }`;
  - permission check **throws** (the action's `.catch(() => false)` at `index.ts:565` maps it to `false`) →
    still `{ error: 'forbidden' }`;
  - no session → `{ error: 'Unauthorized' }`;
  - profile delete error → `{ error: 'delete_failed' }` + `console.error('hardDeleteUser profile failed', …)`
    **and `auth.admin.deleteUser` NOT called**;
  - auth delete error → `{ error: 'profile_deleted_auth_failed' }` + `console.error('hardDeleteUser auth failed', …)`.
  **For the `forbidden` (both variants) and `Unauthorized` paths, additionally assert ZERO side effects:** no
  listing transition, no `users.delete`, and no `auth.admin.deleteUser` (return-shape alone is not enough).
- **User status / role / account-type change** — already covered (Task 448 smoke). Include in `test:admin`;
  confirm green. No new test, no edit.
- **Clear history (success + no-op race)** — already covered (Task 436/432 smoke). Include in `test:admin`;
  confirm green. No new test, no edit.

## Gate requirements

- Add a `test:admin` script in `package.json` running exactly the admin-lifecycle smoke files — the existing
  `clearHistory.smoke.test.ts` + `updateUserProfileFull.smoke.test.ts` + the new `hardDeleteUser.smoke.test.ts`
  (mirror the `test:auth` / `test:listings` script shape).
- Wire `npm run test:admin` into `.github/workflows/governance-pr.yml` as a **blocking** step (place it
  alongside the Slice 2 `test:auth` and Slice 3 `test:listings` steps). Document the exact local command.
- The suite must be deterministic: no real Supabase, no real auth, no network — stub at the module boundary
  (mirror the existing admin smokes). No flaky timing.
- The diagnosable-failure paths assert `console.error` is called with the root cause (qa-rules "Actionable
  Error-Toast Rule"), matching the exact strings the action logs.

## Positive flow

Clean tree: `npm run lint` + `npx tsc --noEmit` pass; `npm run test:admin` runs the admin smoke suite green
(the new `hardDeleteUser` happy + every failure path, plus the two existing smokes unchanged);
`docs/critical-flow-registry.md` updated (Hard-delete row `❌ → ✅`); CI step present and blocking.

## Negative flow (PROOF each new gate is real)

A planted-violation transcript for **each new gate** in the session log: break one asserted invariant → the
corresponding smoke FAILS → revert → green. Concrete suggested plants (use these or equivalents):

- **Hard-delete happy path:** comment out `db.auth.admin.deleteUser(userId)` (or short-circuit before it) →
  the "auth.admin.deleteUser called once" invariant assertion FAILS (proves the email-reuse guard is real).
- **Hard-delete ordering:** make the profile-delete-error branch fall through to the auth delete instead of
  early-returning `delete_failed` → the "`auth.admin.deleteUser` NOT called on profile failure" assertion FAILS.
- **Hard-delete diagnosability:** remove `console.error('hardDeleteUser auth failed', …)` → the diagnosable
  assertion on the `profile_deleted_auth_failed` path FAILS.

A gate that cannot be made to fail is a no-op = **TASK FAILURE**.

## Registry update (required)

In `docs/critical-flow-registry.md` "P0 — Admin lifecycle (Slice 4 / Task 443)":
- Flip the **Hard-delete user (admin)** row `❌ → ✅` with the exact `npx vitest run …` command and a one-line
  evidence summary (happy: auth.admin.deleteUser called = email freed; failure: forbidden / Unauthorized /
  delete_failed-no-auth-call / profile_deleted_auth_failed; planted-violation noted), matching the Slice 2/3 format.
- Update the **User status / role / account-type change** and **Clear history** rows' Command column to the new
  `npm run test:admin` (or keep the per-file `npx vitest run …` and note both); keep their existing ✅ evidence.
- The **Admin users list loads** and **Admin user detail loads** rows stay `🟡` (owner-run hydration gate,
  Slice 6) — do NOT flip them; append a one-line note that the deterministic smoke layer does not cover them.

## Out of scope

No product redesign; no migration; no fix to Task 433/434/435/437/439; no incidental bug fixes. No change to
`hardDeleteUser`, `updateUserProfileFull`, the `clearHistory` actions, or any admin component (tests only — if a
flow is not testable without a product change, STOP and ASK). No rewrite of the existing Task 436/448 admin
smokes. No Playwright / parallel e2e stack. No attempt to convert the owner-run hydration rows into smokes. No
mobile/responsive UI change (no rendered surface is modified by this slice, so the `<640` full-width gate is
N/A — state this explicitly in the log). No coverage beyond the registry's admin-lifecycle rows.

## Acceptance criteria

- **AC1** — New Vitest smoke file `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts` covering
  the hard-delete flow; harness reused from the existing admin smokes (no new stack invented).
- **AC2** — Hard-delete has happy path + every failure path, asserting the LITERAL return shapes/error codes
  from "Source of truth" (`'forbidden'`, `'Unauthorized'`, `'delete_failed'`, `'profile_deleted_auth_failed'`,
  `{}`), AND:
  - **Ordering invariants** — happy → `auth.admin.deleteUser` called exactly once; profile-fail → NOT called;
    and, where observable, the call ORDER holds: listing-archive(s) BEFORE `users.delete`, `users.delete`
    BEFORE `auth.admin.deleteUser`.
  - **Permission failure covers BOTH variants** — `hasPermission` returning `false` AND `hasPermission`
    throwing both return `{ error: 'forbidden' }` and touch no DB/auth/listing seam.
  - **Zero-side-effect assertion on `forbidden` (both) + `Unauthorized`** — no listing transition, no
    `users.delete`, no `auth.admin.deleteUser` (not just the return shape).
- **AC3** — Diagnosable-failure paths assert `console.error` is called with the exact root-cause strings
  (`'hardDeleteUser profile failed'`, `'hardDeleteUser auth failed'`).
- **AC4** — `test:admin` script added to `package.json`; runs `clearHistory.smoke.test.ts` +
  `updateUserProfileFull.smoke.test.ts` + the new `hardDeleteUser.smoke.test.ts`.
- **AC5** — `npm run test:admin` wired into `governance-pr.yml` as a blocking step; exact command documented.
- **AC6** — Each NEW gate has a planted-violation FAIL → revert → PASS transcript in the session log.
- **AC7** — `docs/critical-flow-registry.md` Hard-delete row flipped to ✅ with command + evidence; the two
  already-covered rows' commands updated to `test:admin`; the two hydration rows kept `🟡` with a note.
- **AC8** — No product/UI/migration change; no fix to live bugs; no unrelated refactor; existing admin smokes
  unedited.
- **AC9** — `npx tsc --noEmit` clean.
- **AC10** — `npm run lint` clean.
- **AC11** — `npm run check:file-integrity:all` clean (every touched file: 0 NUL, parses, not truncated).
- **AC12** — Investigation notes (harness reuse, stubbing seams for `hardDeleteUser`, ordering-invariant
  rationale, why the hydration rows stay owner-run) in the session log.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run test:admin`, `npm run check:file-integrity:all` — all green on
  every touched file. Provide the AC-by-AC self-audit table + the **"Files Changed"** table in the session log.
  **Do NOT run git** — the orchestrator reviews the diff and emits the commit commands.

## Deliverables / expected Files Changed

- `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts` — NEW (hard-delete smoke)
- `package.json` — MODIFIED (`test:admin` script)
- `.github/workflows/governance-pr.yml` — MODIFIED (blocking `test:admin` step)
- `docs/critical-flow-registry.md` — MODIFIED (Hard-delete row ✅; commands updated; hydration-row note)
- `docs/sessions/2026-06-17-task443-admin-lifecycle-smoke.md` — NEW (session log)
- `docs/backlog.md` — MODIFIED (Last Session + Task 443 status)

(Exact file names may adjust if investigation finds an existing companion test to extend — note any deviation
in the Files Changed table.)
