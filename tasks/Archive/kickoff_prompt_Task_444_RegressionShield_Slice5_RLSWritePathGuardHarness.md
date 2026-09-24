# Task 444 — Regression Shield · SLICE 5: Server-action RLS write-path GUARD harness + manifest (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** See `tasks/Epics/Epic_RS_Regression_Shield.md` +
> `docs/critical-flow-registry.md` (P0 — Server-action / RLS write paths section).
> **🔴 PREVENTION ONLY.** This slice does NOT fix or redesign any action, does NOT change any RLS policy,
> migration, GRANT, or product code. It builds the regression net for server-action write paths. Tests assert
> the **existing shipped behavior**. No "while I'm here" fix (Epic RS hard boundary).
>
> **🔴🔴 SCOPE DECISION ALREADY MADE BY OWNER (2026-06-17) — DO NOT RE-OPEN, DO NOT WIDEN.**
> This slice covers **action-level permission GUARDS only**, with a deterministic Vitest module-boundary harness
> (the same stack as Slices 2/3/4). It does **NOT** stand up a live DB / Supabase-local / Docker, does **NOT**
> assert real Postgres RLS policy enforcement, and **MUST NOT claim DB-level RLS as covered.** The literal
> Task 270→435 class (a DB *policy* change breaking an insert while action code is unchanged) is **explicitly
> out of scope** here — a mocked Supabase client stubs the DB and cannot catch it. That live-DB canary is
> deferred to a separate future task (Slice 5b). Your job: deterministic action-guard coverage + an honest
> manifest that NAMES the live-DB-only gaps. If you find yourself wanting a real DB, a migration, or a policy
> edit — **STOP and ASK.** That is the boundary, not the task.

## What an "action-level permission guard" means here (read carefully)

Each server action carries its OWN authorization logic before it touches data. That logic — and ONLY that
logic — is what this slice tests, at the action's call/return boundary:

1. **Authn gate** — does the action require a session? (`getUser()` null → `Unauthorized`).
2. **Authz gate** — role / permission check (`assertAdminAccess()`, `hasPermission('<key>')`, moderator-vs-admin
   matrix per `docs/rls-rules.md`). Wrong actor → typed error (`forbidden`/`Forbidden`), no write.
3. **Client-boundary invariant** — does the action use the **user-scoped** Supabase client (RLS applies) or the
   **service-role admin client** (RLS bypassed)? A regression that swaps a user-scoped client for the admin
   client silently disables RLS — this harness asserts which client an action constructs.
4. **Ownership / actor invariant** — for self-scoped actions, the row written is anchored to `auth.uid()`
   (e.g. `eq('user_id', me.id)` / `user_id: me.id` in the insert payload), not an attacker-supplied id.
5. **Diagnosability** — failure paths `console.error(...)` the root cause (qa-rules "Actionable Error-Toast Rule").

These catch the "someone weakened/removed an action's guard or swapped its client" regression class. They do
**NOT** catch a pure DB-policy regression (that needs live roles) — say so explicitly everywhere.

## Goal

1. A reliable, non-flaky Vitest **guard smoke suite** covering a concrete, representative write-action per guard
   archetype (below), each asserting authn + authz + client-boundary + ownership + diagnosability for one
   legitimate positive path and one negative **guard** path per archetype:
   - **wrong / unauthorized actor** for the authn/authz archetypes (B authenticated-self, C admin-only, D
     admin-vs-moderator);
   - **invalid payload / rate-limited / blocked write** for the anon-allowed public-write archetype (A) — anon
     IS the legitimate actor there, so the negative is a validation/rate-limit guard, NOT a "wrong actor".
2. A durable **RLS write-path manifest** (`docs/rls-write-path-manifest.md`) enumerating EVERY write action in
   `src/modules/**/actions/**`, classified by guard archetype, table(s) written, client used, coverage status,
   and — prominently — the **live-DB-only gaps this slice does NOT cover**.
3. A `test:rls-guards` script + blocking CI step, each new gate with a planted-violation FAIL transcript.

Smallest reliable positive + one negative per representative action. NOT every action, NOT every UI state, NOT
flaky. The manifest is the breadth artifact; the smokes are depth on one representative per archetype.

## Pre-read (rule-index → Regression/critical-flow + DB/server-action/RLS)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md` (Slice 5 contract + DoD + hard boundary)
- `docs/rls-rules.md` — **read "RLS-Change Test Requirement", the User-Roles + Admin Profile Mutation Matrix
  (moderator CANNOT delete users / change roles), Cabinet Self-Mutation Rules, and `user_status_history` /
  `email_change_tokens` service-role-only policies.** These define the legitimate/illegitimate actor per action.
- `docs/data-access-rules.md` — user-scoped client vs `createAdminClient()` (service-role) usage rules.
- `docs/domain-rules.md` (ownership semantics), `docs/qa-rules.md` ("Actionable Error-Toast Rule").
- `docs/ai-behavior.md` (Note 18 self-validation).
- **Existing infra to MIRROR, do not reinvent:** the Slice 2/3/4 admin/auth/listings smokes —
  `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts`,
  `src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts`,
  `src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts`,
  `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts`;
  `package.json` `test:auth`/`test:listings`/`test:admin` scripts; `.github/workflows/governance-pr.yml`.

## Required investigation (report in session log BEFORE writing tests)

1. **Enumerate every write action** under `src/modules/**/actions/**` (insert/update/delete/upsert/RPC). Seed
   list (verify + complete it — do NOT trust this list as exhaustive): admin (`updateListingStatus`,
   `setListingPremium`, `deleteListing`, `updateUserProfile`, `toggleUserVerified`, `createAdminUser`,
   `softDeleteUser`, `deactivateUser`/`reactivateUser`, `saveSettings`, `createPage`/`updatePage`/`deletePage`,
   `createCurrency`/`updateCurrency`/`deleteCurrency`/`setDefaultCurrency`, `createLocation`/`updateLocation`/
   `deleteLocation`, `createPropertyType`/…, `upsertFooterContent`, exchange-provider CRUD, `setModeratorPermission`,
   `upsertEmailTemplateAction`/…, `updateTicketStatus`), cabinet (`updateCabinetProfile`, `saveSavedSearch`,
   `deleteSavedSearch`/`deleteAllSavedSearches`, `updateSavedSearchFrequency`/`Notify`, `initiateEmailChange`,
   `changeCabinetPassword`, `consumeEmailChangeToken`), listings (`createListing`, `updateListing`,
   `deleteListingAction`, `addFavorite`/`removeFavorite`, collection CRUD, `reportListingAction`,
   `updateReportStatusAction`, `submitListingInquiry`, `applyListingTransition*`), contacts (`submitContactInquiry`,
   `updateInquiryStatus`, `sendInquiryReply`), locations (`setLocationFeatured`/`Unfeatured`).
2. **Classify each** into a guard archetype (below) and record: file:line, table(s) written, the authn/authz
   guard, the client used (user-scoped vs admin/service-role), and current coverage (already covered by a Slice
   2/3/4 smoke? / new in this slice? / live-DB-only gap?).
3. **Pick exactly ONE representative NEW-coverage action per archetype** (one not already covered by Slices
   2/3/4) and confirm its mock seams. Document the choice + why it is representative.
4. **Identify the live-DB-only gaps** — assertions that genuinely require real Postgres roles (e.g. "anon is
   blocked by the INSERT policy", "user A cannot update user B's row at the DB"). These CANNOT be faked with a
   mocked client; list them honestly for the manifest and the deferred Slice 5b.

## Guard archetypes + the ONE representative new smoke each (assert literally)

Cover these four archetypes. For each, write the positive + negative for the chosen representative; reference
(do not rewrite) the already-covered examples.

- **A. Anon-allowed public write** (no session; guard = validation + rate-limit/IP). Already covered:
  `reportListingAction` (442/436), `submitListingInquiry` (442). **Representative NEW:** `submitContactInquiry`
  (`src/modules/contacts/actions/index.ts:64`) — positive: valid payload → inserted (assert table + payload),
  email/notification fired; negative: validation fail / rate-limited → typed error + no insert + `console.error`
  where applicable. (If already trivially covered, pick another anon-write and note it.) **The email/notification
  seam MUST be mocked — the session log must state explicitly that no real email is sent and no network call is
  made (the "email/notification fired" assertion checks the mocked sender was invoked, nothing more).**
- **B. Authenticated self-scoped write** (guard = `getUser()` + **user-scoped client**, row anchored to
  `auth.uid()`). **Representative NEW:** `updateCabinetProfile` (`src/modules/cabinet/actions/index.ts:26`) —
  positive: authenticated user → update runs **through the user-scoped `createClient()`** (NOT the admin client)
  and is anchored to the caller's id; negative: no session → `Unauthorized`, no write. **Assert the
  client-boundary invariant explicitly** (the action must NOT use `createAdminClient()` to mutate the profile).
- **C. Admin-only write** (guard = `assertAdminAccess()` / `hasPermission`). **Representative NEW:**
  `deleteListing` (`src/modules/admin/actions/index.ts:117`) OR a config-table writer such as `createCurrency`
  (`currencies.ts:50`) — pick the one with the cleanest seam; positive: admin → write proceeds; negative:
  non-admin/no session → `Forbidden`/`Unauthorized`, no write. (Reference `updateUserProfileFull`, already
  covered by Task 448, as the existing admin-write example — do NOT rewrite it.)
- **D. Admin-but-NOT-moderator boundary** (per rls-rules matrix: moderator CANNOT delete users / change roles /
  create admins). **Representative NEW:** `softDeleteUser` (`index.ts:479`) OR `createAdminUser` (`index.ts:413`)
  OR the role-change branch of `updateUserProfile` — positive: admin → proceeds; negative: **moderator actor →
  rejected** (typed error, no write). This is the archetype most likely to silently regress and the registry
  has no dedicated coverage for it.

> If any chosen representative cannot be asserted at the module boundary without a product change, **STOP and
> ASK** — pick a sibling in the same archetype and document the swap; do not invent scope or touch product code.

## RLS write-path manifest (required durable artifact)

Create `docs/rls-write-path-manifest.md` with:

- A header stating the manifest's purpose and the **explicit honesty disclaimer**: "This manifest + the
  `test:rls-guards` suite cover **action-level permission guards only** (authn/authz/client-boundary/ownership/
  diagnosability) via mocked Supabase. They do **NOT** assert live Postgres RLS policy enforcement. DB-level RLS
  (anon/role/cross-user row enforcement at the database) is a known gap, deferred to Slice 5b — see the gaps
  table below. Do not read a ✅ here as DB-RLS coverage."
- **Table 1 — every write action:** module · action (file:line) · table(s) written · guard archetype (A/B/C/D) ·
  authn/authz guard · client (user-scoped / service-role) · coverage (✅ guard-smoke this slice · 🟢 covered by
  Slice 2/3/4 · ⬜ guard-uncovered) · command.
- **Table 2 — live-DB-only gaps:** the assertions that need real roles (e.g. "anon INSERT blocked on
  `listing_reports`", "user A cannot UPDATE user B `users` row"), each marked `live-DB-only → Slice 5b`.

Keep it deterministic and doc-based. **Do NOT** build a Supabase-local/Docker harness or a flaky "scan every
action and fail CI" drift script in this task — if you think a manifest-drift guard is worthwhile, propose it as
a follow-up and STOP-and-ASK; do not add it unilaterally.

## Gate requirements

- Add a `test:rls-guards` script in `package.json` running exactly the new guard smoke file(s) (mirror the
  `test:admin`/`test:listings` script shape). Suggested single file:
  `src/modules/__tests__/rls-write-guards.smoke.test.ts` (or per-module files if cleaner — note the choice).
- Wire `npm run test:rls-guards` into `.github/workflows/governance-pr.yml` as a **blocking** step, alongside
  the Slice 2/3/4 `test:auth`/`test:listings`/`test:admin` steps. Document the exact local command.
- Deterministic: no real Supabase, no real auth, no network, no Docker — stub at the module boundary. No flaky
  timing.

## Positive flow

Clean tree: `npm run lint` + `npx tsc --noEmit` pass; `npm run test:rls-guards` runs the new guard suite green
(one positive + one negative per archetype A–D, with client-boundary + ownership + diagnosability assertions);
`docs/rls-write-path-manifest.md` created and complete; `docs/critical-flow-registry.md` Slice 5 section updated
honestly (action-guard rows ✅; the DB-level-RLS row stays ❌/🟡 → Slice 5b); CI step present and blocking.

## Negative flow (PROOF each new gate is real)

A planted-violation transcript for **each new gate** in the session log: break one asserted invariant → the
corresponding smoke FAILS → revert → green. Concrete suggested plants (use these or equivalents):

- **Archetype B client-boundary:** make `updateCabinetProfile` use `createAdminClient()` instead of the
  user-scoped client → the "uses user-scoped client / not admin client" assertion FAILS (proves the RLS-bypass
  guard is real).
- **Archetype C authz:** remove/short-circuit the `assertAdminAccess()`/`hasPermission` check on the chosen
  admin write → the "non-admin → Forbidden, no write" assertion FAILS.
- **Archetype D moderator boundary:** let the moderator actor through on `softDeleteUser`/`createAdminUser` →
  the "moderator rejected" assertion FAILS.
- **Archetype A:** drop the validation/rate-limit guard on `submitContactInquiry` → the "invalid/rate-limited →
  no insert" assertion FAILS.

A gate that cannot be made to fail is a no-op = **TASK FAILURE.**

## Registry update (required — be honest)

In `docs/critical-flow-registry.md` "P0 — Server-action / RLS write paths (Slice 5 / Task 444)":
- Replace the single broad `❌` row with per-archetype rows reflecting **action-guard** coverage: mark the four
  representative actions ✅ (with `npm run test:rls-guards` command + one-line evidence) and reference the
  Slice 2/3/4-covered writes as 🟢.
- Add/keep a clearly-labelled row **"DB-level RLS policy enforcement (anon/role/cross-user, live-DB)" → ❌
  (Slice 5b, deferred — mocked-client smoke cannot cover; see `docs/rls-write-path-manifest.md` gaps table).**
  Do NOT flip this to ✅. Point to the manifest.

## Out of scope

No product redesign; **no RLS policy / GRANT / migration / SQL change**; no Supabase-local / Docker / live-DB
test; no fix to Task 433/434/435/437/439; no incidental bug fixes; no edits to the existing Slice 2/3/4 smokes;
no Playwright / parallel e2e stack; no manifest-drift CI scanner (propose as follow-up + STOP-and-ASK). No
claim, anywhere, that DB-level RLS is covered. No change to any action's product code — if a representative is
untestable without a product change, STOP and ASK and swap to a sibling. **No rendered UI surface is modified,
so the `<640` full-width mobile gate is N/A — state this explicitly in the session log.**

## Acceptance criteria

- **AC1** — New Vitest guard smoke file(s) (e.g. `src/modules/__tests__/rls-write-guards.smoke.test.ts`) covering
  one representative NEW-coverage action per archetype A–D; harness reused from existing smokes (no new stack).
- **AC2** — For each representative action: positive (legitimate actor → write proceeds) + negative (illegitimate
  actor → LITERAL typed error, no write), asserting the literal return shapes/error codes from the source.
- **AC3** — **Client-boundary invariant asserted** for the self-scoped archetype (B): the action uses the
  user-scoped client, NOT `createAdminClient()`; and **ownership invariant** asserted (row anchored to the
  caller's id).
- **AC4** — **Moderator-vs-admin boundary asserted** (archetype D): moderator actor is rejected on the chosen
  privileged user-management action; admin proceeds.
- **AC5** — Diagnosable failure paths assert `console.error` with the exact root-cause string the action logs.
- **AC6** — `docs/rls-write-path-manifest.md` created: Table 1 (every write action classified) + Table 2
  (live-DB-only gaps) + the explicit honesty disclaimer that DB-level RLS is NOT covered.
- **AC7** — `test:rls-guards` script added to `package.json`; wired into `governance-pr.yml` as a blocking step;
  exact command documented.
- **AC8** — Each NEW gate has a planted-violation FAIL → revert → PASS transcript in the session log.
- **AC9** — `docs/critical-flow-registry.md` Slice 5 section updated: representative actions ✅; the DB-level-RLS
  row kept ❌ (Slice 5b) pointing to the manifest. DB-level RLS NOT claimed as covered.
- **AC10** — No product/UI/migration/policy change; no fix to live bugs; existing smokes unedited; no Docker/live DB.
- **AC11** — `npx tsc --noEmit` clean.
- **AC12** — `npm run lint` clean.
- **AC13** — `npm run check:file-integrity:all` clean (every touched file: 0 NUL, parses, not truncated).
- **AC14** — Investigation notes (full write-action enumeration + classification, representative-action choices +
  rationale, the live-DB-only gap list, confirmation that `<640` mobile gate is N/A) in the session log.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run test:rls-guards`, `npm run check:file-integrity:all` — all green
  on every touched file. Provide the AC-by-AC self-audit table + the **"Files Changed"** table in the session
  log. **Do NOT run git** — the orchestrator reviews the diff and emits the commit commands.

## Deliverables / expected Files Changed

- `src/modules/__tests__/rls-write-guards.smoke.test.ts` — NEW (guard smoke; or per-module files — note any split)
- `docs/rls-write-path-manifest.md` — NEW (write-action manifest + live-DB-only gaps + honesty disclaimer)
- `package.json` — MODIFIED (`test:rls-guards` script)
- `.github/workflows/governance-pr.yml` — MODIFIED (blocking `test:rls-guards` step)
- `docs/critical-flow-registry.md` — MODIFIED (Slice 5 action-guard rows ✅; DB-level-RLS row ❌ → Slice 5b)
- `docs/sessions/2026-06-18-task444-rls-write-path-guard-harness.md` — NEW (session log; adjust date to run day)
- `docs/backlog.md` — MODIFIED (Last Session + Task 444 status)

(Exact representative-action choices and the single-file-vs-per-module test layout may adjust if investigation
finds a cleaner seam — note any deviation in the Files Changed table and the session log.)
