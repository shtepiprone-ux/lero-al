# Epic X — Domain Type Integrity & Admin Controls Restoration

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #14 (production error
`invalid input value for enum property_type: "room"` on `/listings`, same family as the issue
resolved on 2026-05-23 — global audit needed to prevent recurrence); #1 (Sonnet 4.6, during a prior
change, removed admin-table row actions for listings — listing-status switchers, moderation
actions, etc. — leaving roughly half of those options unreachable in `/admin/listings`).
**Kickoffs:** `Epic_X_kickoff_prompts.md` (Tasks 234–235).

> Both tasks here are about the same underlying weakness: divergence between what the UI sends and
> what the DB / domain catalog accepts (X.1), and between what the admin UI used to expose and what
> it now exposes (X.2). Note 14 (Global Change Verification Rule) + Note 20 (Existing-Control
> Preservation) are the rules of record.

## Goal

A single canonical source of truth for every domain enum used by the listings module (frontend
filter values → URL → server action → query → Postgres enum), with a programmatic guard that fails
the build if they drift; and full restoration of the admin row actions on `/admin/listings` that
were silently removed in earlier Sonnet work.

## Dependencies

- `src/lib/filters/filterEngine.ts` (`parseSearchParams`, value coercion), `src/modules/listings/
  validations/*` (Zod enums), `src/modules/listings/queries/*` (Postgres enum usage), the schema-
  drift guard from Sprint 8 / Task 172 (`scripts/check-schema-drift.mjs`, `database.ts`).
- `src/components/admin/AdminListingsTable.tsx`, `src/app/admin/listings/page.tsx`, the canonical
  admin-table pattern in `docs/component-governance.md §11` (Epic K), the action handlers in
  `src/modules/admin/actions/*`.
- `docs/ai-behavior.md` → Note 14 (Global Change Verification Rule), Note 20 (Existing-Control
  Preservation), Domain Integrity Rules; `docs/domain-rules.md`; `docs/rls-rules.md`.

## Tasks

### Task 234 — X.1 — `property_type "room"` enum drift + global enum integrity audit

**Type:** bug + audit
**Priority:** critical
**Area:** listings module — filter URL parsing, Zod enums, queries, Postgres enums

**Pre-read:** `docs/ai-behavior.md` Note 14 + Domain Integrity Rules; `docs/data-access-rules.md`;
`docs/domain-rules.md`; `src/lib/filters/filterEngine.ts`; `src/modules/listings/validations/*`;
`src/modules/listings/queries/*`; the 2026-05-23 session log that resolved the previous variant
(check `docs/sessions/` around 2026-05-23 for the enum fix referenced in issue #14); Task 172
session log (schema-drift guard); `database.ts`.
**Localization coverage:** sq, en, uk, it (any user-visible error / empty-state string).
**Responsive coverage:** all 7 breakpoints.

**Goal:** A `property_type=room` URL value reaches Postgres and Postgres rejects it because `room`
is not in the enum. Root-cause: either the catalog of allowed property types is being read from one
place in the UI and a different (out-of-date) place when the query is built, OR a stale link / saved
search / external referral still uses `room`. Fix:

1. Pick the canonical source of property-type values (DB catalog `property_types` table OR a single
   TS enum if the catalog is not the source — confirm with the owner in the kickoff). Make every UI
   consumer, Zod enum, filter parser, and query read from that one place.
2. In `filterEngine.ts`, coerce-or-drop unknown values: if the URL carries
   `property_type=<unknown>`, the parser drops it (and does NOT propagate to the query) — never let
   an unknown value reach Postgres.
3. Sweep the repo for every domain enum used by the listings module (property_type, offer_type,
   purchase_conditions, listing_status, moderation_status, currency, role, etc.). For each, list
   today: where the UI catalog lives, where the Zod schema lives, where the DB enum lives. If any
   two diverge, that is an X.1 bug class — file each divergence in the session log; fix or open a
   follow-up task per divergence (one logical change per follow-up).
4. Extend the schema-drift guard (Task 172) — or document why it can't catch this — so a future
   enum addition that doesn't reach all four layers fails the build.

**Acceptance criteria:**
- `property_type=room` URL cannot reach Postgres anymore — `filterEngine.ts` drops it; tested
  manually + a unit test.
- Every listings-module domain enum has a documented single source of truth; the audit table is in
  the session log.
- Any divergence found is either fixed in this task (if trivial) or filed as a numbered follow-up
  (with a kickoff prompt) under this Epic.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** non-listings enums (users / reports / etc.) — file as separate tasks if affected.

### Task 235 — X.2 — Restore removed admin row actions on `/admin/listings`

**Type:** bug (P0 regression)
**Priority:** critical
**Area:** admin Listings table

**Pre-read:** `docs/ai-behavior.md` Note 20 (Existing-Control Preservation); Epic K session logs
(Task 127–130 — canonical AdminTableRow pattern + `docs/component-governance.md §11`);
`src/components/admin/AdminListingsTable.tsx`, `src/app/admin/listings/page.tsx`, the moderation/
status-change handlers in `src/modules/admin/actions/*`; git history of `AdminListingsTable.tsx`
(read-only `git log` per `orchestrator-role.md`) to identify when the row actions were dropped.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** The admin Listings table is missing the row actions / status switchers that existed
before some prior Sonnet change. Today admins cannot reach roughly half of the listing
management/status operations from the table. Restore every control that existed in the
pre-regression version (or its canonical §11 equivalent — row click → modal — per Epic K), so
admin can: open the listing in admin edit, change status (active → moderation → rejected →
archived → deleted, whatever the lifecycle allows), trigger moderation actions, and use any other
row-level operation that was present before.

**Acceptance criteria:**
- Inventory table in the session log: BEFORE (every row action that existed pre-regression) vs
  AFTER (every control restored, where it now lives). Every BEFORE row has a green AFTER row.
- Every listing-status change reachable from the admin table or the row's edit screen (the side
  panel pattern from Task 196 / R.2 if that has shipped).
- Canonical §11 pattern (no per-row Actions column — row click → modal, OR the side-panel actions
  pattern from R.2 if applicable).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** the side-panel pattern itself (Task 196 / R.2); changing the listing lifecycle.

## Epic-level acceptance

`property_type=room`-class errors cannot recur (one canonical source + URL coercion + drift guard);
the admin Listings table has every row action it had before the regression; the underlying
"silent removal" was the trigger for Note 20 (Existing-Control Preservation, 2026-05-25), which is
now enforced on every future Sonnet diff.
