# Epic I — Task 427 kickoff (Sonnet) — Full edit + full status access for admin/moderator (and owner-correct) regardless of listing status

> **Status: READY.** Epic: I — Listing Lifecycle and Status Rules (`tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md`).
> Supersedes the never-implemented **Task 355** (Sprint 31 kickoff existed, no code/commit/session-log ever landed).
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change scope.
> Do NOT invent architecture outside what is specified here. Do NOT remove existing listing actions/controls.
> If anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator** — do not guess.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End your session with a
> "Files Changed" table only; the ORCHESTRATOR (Opus) reads the real diff and emits commit commands during review
> (agent-contract clause 10).

```
Type:     bugfix + feature (lifecycle/permissions)
Priority: high
Area:     listings / admin listings / owner cabinet edit-flow / status lifecycle / permissions
```

## Required pre-read (rule-index: "Admin table / admin control" + "DB / server action / RLS" + "Profile / edit-flow")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/design-system.md` (§9 admin layout, §10 `tableAt`, §26 mobile <640 full-width + bottom-sheet),
`docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`, `docs/domain-rules.md`,
`docs/rls-rules.md`, `docs/data-access-rules.md`, `docs/qa-rules.md`,
`docs/ai-behavior.md` → Note 14 (global-change), Note 19 (UX-flow), Note 20 (control-preservation),
Note 22 (Admin Table Preservation), Note 23 (Edit-Flow Preservation).

## Problem (verified by orchestrator audit, 2026-06-15)

Two coupled defects on listings whose status is `sold` / `rented` (and `archived`):

1. **"Редагувати" opens the PUBLIC VIEW, not the editor.** The admin "Edit" button
   (`src/components/admin/AdminListingsTable.tsx:369`) links to `/[locale]/listings/[slug]/edit`. That route
   (`src/app/[locale]/listings/[slug]/edit/page.tsx:56-61`) calls `checkEditPermission`, which
   (`src/modules/listings/domain/listingPermissions.ts:63-75`) returns `not_editable` for any non-editable status
   and `redirect()`s to the public detail page — **for everyone, including admin/moderator** (see the in-file
   comment "This applies to everyone including admin"). `isListingEditableStatus`
   (`src/modules/listings/domain/listingSemanticHelpers.ts:69-72`) is `false` for `sold`/`rented` (CLOSED) and
   `archived`. Net effect: the Edit button is shown for closed listings but the route bounces to view. For `active`
   it works.

2. **From `sold`/`rented` only "Архівувати" is offered.** The canonical matrix
   (`src/modules/listings/domain/listingTransitionEngine.ts:74-81`) defines `sold: ['ARCHIVE']` and
   `rented: ['ARCHIVE']`. The admin status gateway `applyListingTransition`
   (`src/modules/listings/actions/applyListingTransition.ts`) gates on `canAdminEditListing(actor.role)` and
   validates against that base matrix, so admin/moderator are limited to ARCHIVE from a closed listing. The admin
   table also keeps a hardcoded duplicate map `STATUS_ACTIONS` (`AdminListingsTable.tsx:36`, comment "Matches
   ALLOWED_LISTING_TRANSITIONS") that must stay in sync.

## Owner decisions (captured 2026-06-15 — do NOT re-litigate)

- **Who gets full access:** **admin/moderator (any listing) AND the listing owner (own listing).**
- **Status transitions:** **admin/moderator AND the owner-of-listing may move a listing directly to ANY other status
  from ANY status, at any time** (full direct control, including into/out of `sold`/`rented`/`archived`/`pending`/
  `active`/`inactive`). The owner is NOT restricted to a `REOPEN`-only correction — owner directive (2026-06-15):
  *"власник має повне право робити зі своїм оголошенням все що хоче — редагувати, видаляти, змінювати статуси коли
  завгодно на який завгодно."*
- **Content edit:** admin/moderator (any listing) and owner (own listing) may open the **editor regardless of
  status** — the status-editability gate no longer blocks editing for an authorized editor.
- **Delete:** the owner may delete their own listing at any status; admin/moderator may delete any. (Verify the
  existing delete action already permits the owner; if it is currently status- or role-gated against the owner, lift
  that gate too — but do NOT expand delete to non-owners/non-staff.)

> **ℹ️ Moderation implication (intentional, owner-approved — do NOT block on it):** because the owner now has full
> any-status power on their OWN listing, an owner CAN self-approve `pending → active`. This is the owner's explicit
> decision. **Implementation rule:** the privileged any-status path applies to **owner-of-listing OR
> admin/moderator**. Keep the base `ALLOWED_LISTING_TRANSITIONS` matrix and the semantic helpers
> (`isTerminalListingStatus`/`isMarketClosedStatus`/`isModeratableStatus`) UNCHANGED — they still describe the
> automation/visibility semantics; only the *human authorized-editor* path bypasses them. A truly unauthenticated /
> non-owner / non-staff caller still gets nothing.

## Architecture to implement (specified — do NOT invent an alternative)

### 1. Transition engine — privileged any-status capability (`listingTransitionEngine.ts`)

- **Keep `ALLOWED_LISTING_TRANSITIONS` and the action API (`resolveTransition`, `getTransitionActionForStatus`,
  `ACTION_NEXT_STATUS`) UNCHANGED.** They remain the source of truth for automation and for the semantic helpers
  (`isTerminalListingStatus`/`isMarketClosedStatus`/`isModeratableStatus`). Do NOT add `REOPEN`, do NOT widen the
  base `sold`/`rented` rows — the human override is a separate, privileged path, not a base-matrix change.
- **Add a pure privileged resolver:** export `getPrivilegedTargetStatuses(currentStatus): ListingStatus[]` returning
  **every `ListingStatus` except `currentStatus`** (use the canonical status list; derive it, don't hardcode the six
  strings — e.g. `Object.keys(ALLOWED_LISTING_TRANSITIONS)`). Also export
  `canSetStatusPrivileged(from, to): boolean` = `to !== from && both are valid ListingStatus`. Keep the engine
  **pure** (no Supabase, no React).
- **Optionally** also export `getAllowedTargetStatuses(currentStatus, { privileged }: { privileged: boolean })` that
  returns `getPrivilegedTargetStatuses(...)` when `privileged`, else the base-matrix-derived target set (via
  `getTransitionActionForStatus`/`ACTION_NEXT_STATUS`) — this is the single function the UIs call.
- Update `listingTransitionEngine.test.ts`: privileged set = all-except-current for each status; `from === to`
  rejected; base matrix + semantic helpers unchanged (regression-guard those assertions).

### 2. Mutation gateway — authorize owner + privileged any-status write (`applyListingTransition.ts`)

- Widen authorization: a status change is allowed when `canAdminEditListing(actor.role)` **OR** `actor.userId` ===
  the listing's `user_id` (owner-of-listing). The gateway already fetches the listing (owner id) — reuse it; do NOT
  trust a client-supplied owner id. Compute `privileged = isOwner || canAdminEditListing(actor.role)`.
- **`applyListingTransitionByStatus(listingId, toStatus, actor)`** becomes the privileged any-status entry: when
  `privileged`, validate `canSetStatusPrivileged(currentStatus, toStatus)` (`to !== from`) and write
  `status = toStatus` **directly through the single-write executor in this file** (add a private
  `executePrivilegedStatusSet(...)` mirroring `executeTransition`'s write + side-effects, OR extend `executeTransition`
  to accept a direct target status when no action applies — your choice, but the write MUST stay inside this file).
  When NOT privileged, reject with `{ ok:false, reason:'forbidden' }`. Reject `to === from` with
  `{ ok:false, reason:'invalid_transition' }`. Do NOT throw on expected failures.
- The action-based `applyListingTransition(listingId, action, actor)` keeps its current `canAdminEditListing` gate for
  automation/moderation callers (unchanged) — owners reach status changes only through the status-based entry above.
- Preserve ALL existing side-effects on every successful write (owner notification when `ownerId !== actor.userId`,
  `revalidateTag('site-stats')`, per-locale `revalidatePath` of index + detail). The single-write-point invariant
  (this file owns the ONLY `listings.status` write) must remain — no `db.update({status})` anywhere else.

### 3. Edit-route permission (`listingPermissions.ts` + `edit/page.tsx`)

- In `checkEditPermission`, **stop blocking authorized editors by status**: an editor who is owner-of-listing OR
  admin/moderator may edit at ANY status. Concretely, the `isListingEditableStatus` gate must no longer return
  `not_editable` for owner/admin/moderator. (If you keep `not_editable` for some non-editor case, document it; the
  practical result is: owner/admin/mod always pass the status check.)
- In `edit/page.tsx`, set `canManageStatus` to true for **owner OR admin/moderator** (currently only
  `canAdminEditListing`), so the owner sees the status-correction control on their own listing. Keep `currentStatus`
  threading. The redirect-to-view on a *genuinely forbidden* caller (not owner, not staff) must remain.

### 4. Admin table status actions (`AdminListingsTable.tsx`)

- Replace the hardcoded `STATUS_ACTIONS` map with values **derived from the engine's role-aware function** for an
  admin/moderator viewer (i.e. all other statuses become available targets, including from `sold`/`rented`/
  `archived`). Do NOT leave a divergent hardcoded matrix (Note 14). Each target still routes through the existing
  `updateListingStatus` server action → `applyListingTransitionByStatus`.
- The "Edit" link (`:369`) needs no URL change — it now resolves to the editor for admins at any status because of
  §3. Verify it does.

### 5. Owner cabinet status-correction surface

- The shared editor's `StatusChangeControl` (rendered via `ListingFormShellView`) now appears for the owner too
  (from §3). The status options the owner sees on their OWN listing must be the **privileged full set** (all statuses
  except current) — switch the option derivation in `ListingFormShellView` from the base-matrix
  `getTransitionActionForStatus` filter to `getAllowedTargetStatuses(currentStatus, { privileged: true })` whenever
  the viewer is owner-or-staff (i.e. whenever the control renders). `changeListingStatusAction` already passes the
  server-resolved role and now succeeds for the owner via the widened gateway. Do NOT add a second status pipeline —
  reuse `changeListingStatusAction` / `applyListingTransitionByStatus`.
- **Delete:** confirm the owner's existing delete control (cabinet/admin) still works at any status; if it is gated
  to non-closed statuses, lift that gate for the owner. Do NOT introduce delete for non-owners/non-staff.

## Status lifecycle rules to PRESERVE

Do NOT make `pending` listings publicly visible by default; do NOT let a random/unauthenticated user change status;
do NOT let an owner edit/transition someone else's listing; do NOT remove archive/edit/view/premium/delete actions;
do NOT bypass the `applyListingTransition` single-write gateway with a direct `db.update({ status })`; do NOT regress
the post-save redirect logic (`getPostSaveRedirect`). Owner stays restricted to base+REOPEN (no self-approve from
pending) per the policy note above.

## Localization (sq / en / uk / it — full parity, no English fallback)

Any new user-facing string (e.g. the `REOPEN` button label, any new admin status-action labels for newly-available
targets, success/error toasts) must be added to ALL four `messages/{sq,en,uk,it}.json` under the existing namespaces
(`admin.common.status_control.*`, `admin.listings.*`, `listing.*`) with identical key sets. Long labels wrap, never
clip. Use Ukrainian as the stress locale for verification.

## Mobile <640 full-width gate (OWNER P0 — MANDATORY)

Every text control touched here is full-width at `max-sm` (≥44px touch target, labels wrap sq/en/uk/it, no h-scroll
at 320): the admin table's per-row status-action buttons / cluster, the editor sidebar Save/Cancel/status block, and
the `StatusChangeControl` trigger. ALL popups (the `Combobox` status dropdown, the admin preview/`ListingPreviewDialog`,
the Cancel-confirm `Dialog`) render as full-width bottom sheets at <640 via the canonical primitives — do NOT
reimplement; reuse canonical `Combobox`/`Dialog`/`Sheet`. Icon-only controls are the only exemption and must be
listed. If any surface's correct mobile pattern is genuinely ambiguous, STOP & ASK.

## Positive flow (happy path)

1. **Admin edits a sold listing's content.** Admin opens `/admin/listings` → row preview → "Редагувати" →
   `/[locale]/listings/[slug]/edit` now renders the editor (no redirect). Admin edits a field → `isDirty` → Save →
   `updateListing()` succeeds → success state + redirect per existing rules. Post: content persisted; status
   unchanged.
2. **Admin moves a sold listing directly to active (or any status).** In the admin table status-action cluster (or
   the editor status control), admin selects `active` (or `pending`/`inactive`/`rented`/`archived`) → `updateListingStatus`
   → `applyListingTransitionByStatus` (privileged path) writes the new status → row badge + dialog update live,
   `router.refresh()`/`revalidatePath` propagate; owner notification fired.
3. **Owner changes own rented listing to any status + edits + deletes.** Owner opens own `sold`/`rented` listing's
   editor → status control visible with the FULL status set → selects any target (e.g. `active`, or `inactive`, or
   `pending`) → `changeListingStatusAction` → gateway authorizes owner-of-listing → status written → listing reflects
   the new status/visibility. Owner can also edit content at any status and delete the listing. Existing
   edit/view/archive/premium actions intact.
4. **Mobile (≤640):** all the above controls and popups are full-width bottom sheets, usable at 320/375/390.

## Negative flow (every off-happy-path branch — implement each, cite in the AC table)

- **Unauthenticated / random user** hits `.../edit` or calls a status action → `checkEditPermission` →
  `forbidden` → redirect to public detail (edit) / gateway returns `{ok:false,reason:'forbidden'}` (status), no DB
  write, no toast of success. Owner-only / staff-only controls never render for them.
- **Owner targets a NON-owned listing** (and is not staff) → `privileged` false → gateway `forbidden`, no write.
  (This is the only owner-side rejection — a `pending → active` self-approve on the owner's OWN listing is now
  ALLOWED by owner directive and must NOT be rejected.)
- **`from === to`** (selecting current status) → no-op (existing `handleSubmit` guard `toStatus === currentStatus`)
  and `canSetStatusPrivileged` false → `{ok:false,reason:'invalid_transition'}` if it ever reaches the gateway; no
  network call from the UI guard.
- **not_found** (deleted/missing listing) → gateway `{ok:false,reason:'not_found'}`, localized error, no crash.
- **DB write error** → `{ok:false,reason:'db_error'}` logged, localized error toast, UI status unchanged.
- **Double-submit / pending** → existing `pending` state disables the control during the in-flight request.
- **Locale mismatch** → all new strings resolve in sq/en/uk/it (no English fallback in uk/sq/it).

## Acceptance criteria (each maps to a flow + a file:line in the diff)

1. `listingTransitionEngine.ts`: base matrix + action API + semantic helpers UNCHANGED; `getPrivilegedTargetStatuses`
   + `canSetStatusPrivileged` (+ optional `getAllowedTargetStatuses`) exported and pure; tests updated & green incl.
   base-matrix regression-guard. (Pos 2/3, Neg: from===to)
2. `applyListingTransition.ts`: authorization widened to owner-OR-staff (`privileged = isOwner || canAdminEditListing`);
   privileged any-status write through the in-file single-write executor; non-privileged → forbidden; side-effects
   preserved; single-write invariant intact. (Pos 2/3, Neg: non-owner forbidden, not_found, db_error)
3. `listingPermissions.ts` + `edit/page.tsx`: owner/admin/mod edit at any status; `canManageStatus` true for owner
   too; genuine-forbidden (non-owner/non-staff) redirect preserved. (Pos 1/3, Neg: unauthenticated)
4. `AdminListingsTable.tsx`: `STATUS_ACTIONS` derived from the engine privileged set (no divergent hardcode, Note 14);
   all targets available for admin incl. from sold/rented/archived; Edit link resolves to editor. (Pos 1/2)
5. Owner cabinet: `ListingFormShellView` status options = privileged full set on own listing; status change works via
   `changeListingStatusAction` for the owner (incl. pending self-approve); owner delete works at any status; no second
   pipeline. (Pos 3)
6. i18n: all new keys in sq/en/uk/it, identical key sets, runtime-verified in uk. (Neg: locale mismatch)
7. Mobile <640 full-width gate satisfied on every touched surface with the rendered verification matrix
   (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory) in the session log. (Pos 4)
8. Self-validation: `npx tsc --noEmit` = 0; `npm run build` if non-trivial; AC-by-AC self-audit table; file-integrity
   transcript (0 NUL, parses) for every touched file; UX-flow trace; before/after control inventory (Note 20).

## Deliverables on return

A session log under `docs/sessions/` with: Files Changed table (one row per path + rationale), AC-by-AC self-audit
(file:line each), the rendered verification matrix, positive + negative flow verification, control inventory, and the
self-validation verdict line. Update `docs/backlog.md`. Do NOT emit git commands — the orchestrator does that at review.
