# Epic I — Task 427 REWORK kickoff (Sonnet) — close the 4 review gaps

> **Status: READY (rework).** Task 427 is NOT committed and is NOT closed — it is routed back.
> Parent kickoff (full spec, still authoritative for everything not listed here):
> `tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md`.
> Session log to amend (do not start a new one): `docs/sessions/2026-06-15-task427-admin-owner-full-edit-and-status-access.md`.
>
> **You are Sonnet 4.6 executor.** Implement ONLY the deltas below. Do NOT re-open the rest of Task 427 — the
> engine resolver, gateway authorization, edit-route, admin table derivation, owner-cabinet option set, and the
> 1 new i18n key are all APPROVED as-is. Do NOT change scope. If anything is ambiguous, STOP and ASK.
>
> **Single-writer git:** you do NOT run git. End with the updated "Files Changed" table; the orchestrator emits commits.

```
Type:     rework (review follow-up to Task 427)
Priority: high
Area:     listings status gateway / delete proof / build verification / mobile rendered proof
```

## Why this rework exists (orchestrator review, 2026-06-15)

The orchestrator verified the Task 427 diff against the real code (not the session log) and found ONE literal-AC
deviation plus three evidence gaps. Owner decisions are captured below — do NOT re-litigate them.

## Pre-read (unchanged from parent)

`docs/agent-contract.md`, `docs/backlog.md`; `docs/domain-rules.md`, `docs/rls-rules.md`, `docs/data-access-rules.md`,
`docs/qa-rules.md`; `docs/design-system.md` §26 (mobile <640 full-width + bottom-sheet); `docs/ai-behavior.md`
Note 18 (self-validation) + Note 20 (control preservation). `agent-contract.md` clause 12 (rendered matrix) is
the gate for item 4.

---

## Delta 1 — Gateway `to === from` must reject with `invalid_transition` (OWNER DECISION: literal AC)

**Current (defect):** `src/modules/listings/actions/applyListingTransition.ts:231–234` short-circuits a privileged
same-status call to a success no-op:

```js
// Same-status: no-op success (UI may emit the current status as "change")
if (currentStatus === toStatus) {
  return { ok: true, nextStatus: toStatus, listingId }
}
```

This contradicts the parent kickoff §2 (line 103) and Negative flow (line 195), which require
`{ ok:false, reason:'invalid_transition' }` at the gateway. **Owner decision (2026-06-15):** the privileged
mutation API must NOT return success/no-op for a non-transition; same-status is not a real status transition. The
UI guard (`toStatus === currentStatus` → no network call) stays, but if a same-status call ever reaches the gateway
it returns `invalid_transition`.

**Required after-behavior:** remove the same-status early-return block (231–234). Authorization order is preserved
(non-owner/non-staff still hit the `forbidden` guard at 225–227 FIRST, before any same-status consideration).
Execution then falls through to the existing check at 236–237 — `canSetStatusPrivileged(from, to)` already returns
`false` when `to === from`, so the gateway returns `{ ok:false, reason:'invalid_transition' }` with no extra code.
Confirm `canSetStatusPrivileged` semantics in `listingTransitionEngine.ts` (`to !== from && both valid`) — do NOT
change the engine; only delete the no-op branch in the gateway.

**Test delta (`applyListingTransition.test.ts`):** the existing **"owner same-status no-op"** case must be rewritten
to assert `{ ok:false, reason:'invalid_transition' }` for a privileged (owner) same-status call (e.g. owner,
`active → active`). Keep the existing **non-owner same-status → forbidden** assertion (auth precedes transition
validity). Add/confirm an admin same-status → `invalid_transition` case.

- **AC R1:** gateway no-op branch removed; privileged same-status returns `invalid_transition`; non-owner same-status
  still `forbidden`; test updated and green. (Parent AC2 + Negative flow `from===to`.)

## Delta 2 — Delete proof in the session log (NOT a code change)

The orchestrator confirmed `src/modules/listings/actions/deleteListing.ts` has **no status gate** — it deletes by id
and relies on RLS (`auth.uid()` + role), and `docs/rls-rules.md` documents no status predicate on the listings DELETE
policy. So there is nothing to lift; AC5's "owner delete works at any status" is already satisfied in code. **But
parent AC5 required this be PROVEN, and the original log closed it declaratively.**

**Required:** add a short "Delete (AC5) — proof trace" subsection to the session log containing: (a) the
`deleteListing.ts` line(s) showing no status branch (deletes by id, RLS-enforced); (b) a one-line statement that the
listings DELETE RLS policy is ownership/role-scoped with no status predicate (cite `rls-rules.md`); (c) **either** a
new test asserting `deleteListingAction` permits an owner to delete their own listing regardless of status
(`sold`/`rented`/`archived`/`pending`/`active`/`inactive`) **or**, if delete is not unit-testable in isolation here,
an explicit grep/code trace + the statement that no status gate exists. Non-owner/non-staff must remain unable to
delete (RLS) — note this. **No production code change unless a status gate is actually found** (if one is found,
STOP and ASK before lifting it).

- **AC R2:** session log contains the delete proof trace (code trace + RLS statement, and a test if feasible);
  no silent code change to delete.

## Delta 3 — Run `npm run build` (OWNER DECISION: no waiver)

Task 427 is non-trivial (server action + permissions + admin table + owner cabinet + i18n); parent AC8 / agent-contract
clause 9 require `npm run build`. It was not run.

**Required:** run `npm run build`, paste the GREEN tail of the transcript into the session log's Validation section
(alongside the existing `tsc`/`vitest`/`check:*` lines). If build legitimately cannot complete in the executor
environment, STOP and ASK — do not silently skip.

- **AC R3:** `npm run build` transcript (exit 0) in the session log.

## Delta 4 — Targeted rendered mobile proof for the two density-changed surfaces (OWNER DECISION: no waiver)

The inherited-proof argument is accepted for *unchanged* primitives, BUT the data density changed and that is a
rendered-state change the parent log did not prove: `ListingPreviewDialog` now renders up to **5** status-action
buttons (was 1–3), and the owner/editor `StatusChangeControl` now offers up to **6** options (was ≤4). Owner decision:
**no waiver** — render these two surfaces; a full breakpoint×locale matrix is NOT required because no new control
types, popup primitives, or `max-sm` class overrides were added.

**Required rendered evidence (add a real matrix to the session log, uk@320/375/390 mandatory):**

1. **`ListingPreviewDialog` with the maximum status-action button set** (use a `sold` or `rented` listing → 5
   buttons), rendered at **uk @ 320 / 375 / 390**.
2. **Owner/editor `StatusChangeControl` with the full privileged status set** (6 options), rendered at
   **uk @ 320 / 375 / 390**.

**Each cell must demonstrate:** no horizontal overflow at 320; status-action buttons full-width + label wrap +
≥44px touch target; dialog / combobox renders as a full-width bottom sheet (not a centered card / mini-dropdown);
uk status labels are not clipped. Machine-produced artifacts (responsive-screenshots) are preferred; if unavailable,
STOP and ASK rather than self-reporting PASS with "no browser access".

- **AC R4:** targeted rendered matrix (2 surfaces × uk@320/375/390) with per-cell evidence of the four checks above.

---

## Out of scope (already approved — do NOT touch)

Engine resolver (`getPrivilegedTargetStatuses`/`canSetStatusPrivileged`/`getAllowedTargetStatuses`), gateway
authorization (`privileged = isOwner || canAdminEditListing`), `checkEditPermission`/`edit/page.tsx`,
`AdminListingsTable` engine-derived actions, `ListingFormShellView` option derivation, the `admin.listings.btn_set_status`
i18n key (4-locale parity verified). Do NOT widen delete to non-owner/non-staff. Do NOT change the base
`ALLOWED_LISTING_TRANSITIONS` matrix or semantic helpers.

## Deliverables on return

Amend `docs/sessions/2026-06-15-task427-admin-owner-full-edit-and-status-access.md`: updated Files Changed table
(only the gateway + its test should change in code), the delete proof trace, the `npm run build` transcript, and the
targeted rendered matrix. Update the AC self-audit (R1–R4 + re-confirm parent AC1–AC8). Update `docs/backlog.md`
Last Session line. Do NOT emit git commands — the orchestrator does that at re-review.
