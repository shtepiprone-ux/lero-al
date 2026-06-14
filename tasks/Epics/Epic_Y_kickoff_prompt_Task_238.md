# Task 238 — Y.3 — Listing edit/create side-panel pattern + status control + dirty-state Save

**Epic:** Y — Listing Form & Lifecycle UX · **Type:** feature + UX · **Priority:** critical
**Area:** the shared listing create/edit form (`ListingFormShell`) on the cabinet path AND when opened by staff
**Date:** 2026-06-14 · **Task #:** 238 (reserved in Epic Y — do not renumber; `Last task number` in `docs/backlog.md` is unchanged, new tasks still start at 425)
**Kickoff author:** Opus orchestrator. Executor: Sonnet 4.6. **Sonnet reads THIS FILE directly — it is the single source of truth for scope.**

---

## 0. Pre-read (load ONLY these — rule-index selection for: profile/edit-flow + UI/layout + control-relocation + admin-control/server-action + Storybook)

Always required:
- `docs/agent-contract.md` (P0 clauses 1–14)
- `docs/backlog.md`

Required for this task:
- `docs/design-system.md` — **§24 forbidden hardcodes, §25 control-preservation, §26 mobile <640 full-width + bottom-sheet gate, §27 Storybook proof contract** (read these four in full)
- `docs/ui-rules.md` (canonical controls; Combobox-only; modal/popup pattern)
- `docs/component-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` → **Note 19 (UX Flow Preservation), Note 20 (Existing-Control Preservation), Note 21 (Control Relocation Rule), Note 23 (Edit-Flow Preservation Rule), Note 14 (Global Change Verification)**
- `docs/domain-rules.md` (listing status lifecycle — the source of which statuses are selectable)
- `docs/rls-rules.md` (who may change status)
- `docs/storybook-governance.md` (§14 enforced gates) + `docs/design-system.md §27`

Reference files to read before coding (do not change unless listed in §9):
- `src/modules/listings/components/ListingFormShell.tsx` — the form being restructured.
- `src/modules/listings/components/ListingFormLoader.tsx` — the wrapper that renders the shell (prop plumbing).
- `src/app/[locale]/listings/[slug]/edit/page.tsx` — the edit route (already computes `userRole` + `checkEditPermission`; already fetches `listing.status`).
- `src/app/[locale]/listings/create/page.tsx` — the create route.
- `src/components/admin/AdminEditLayout.tsx` — the canonical two-column side-panel container (Task 196).
- `src/components/admin/StatusChangeControl.tsx` — the canonical status control (`variant="select"`).
- `src/modules/listings/actions/applyListingTransition.ts` — exports `applyListingTransitionByStatus(listingId, toStatus, actor)` — THE UI-facing status write gateway.
- `src/modules/listings/domain/listingPermissions.ts` — `checkEditPermission`, `canAdminEditListing`.
- Task 196 / R.2 session log (`docs/sessions/2026-05-23-*`) for the AdminEditLayout pattern intent.

---

## 1. Orchestrator-fixed architecture decisions (NOT open to reinvention — clause 2)

These are decided. If anything here proves impossible, **STOP and ASK the orchestrator** — do not improvise an alternative.

1. **There is NO separate admin listing-edit route, and you must NOT create one.** Staff (admin/moderator) edit a listing through the SAME `/[locale]/listings/[slug]/edit` route; `EditListingPage` already resolves `userRole` and permits staff via `checkEditPermission`. "Admin path" in this task = the shared form rendered for a staff viewer. "Cabinet path" = the same form rendered for the owner. (The earlier draft of this kickoff that referenced a separate "admin listing edit page" and `src/app/admin/users/[id]/page.tsx` was wrong — ignore it.)
2. **Reuse `AdminEditLayout`** (`{ main, sidebar }`, collapses to single column below `lg`) as the side-panel container. Do NOT clone it or build a new two-column primitive. (It is purely presentational; its `Admin` name does not restrict reuse.)
3. **Reuse `StatusChangeControl` with `variant="select"`** for the "Change status" control. Do NOT build a new status UI.
4. **The status write goes through `applyListingTransitionByStatus(listingId, toStatus, actor)` ONLY** (it is the single write gateway; direct `db.update({status})` is forbidden). Wrap it in a small `'use server'` action if a client-callable entry is needed; pass `actor = { userId, role, source: 'cabinet' }`.
5. **Dirty-state uses the EXISTING manual `isDirty` state in `ListingFormShell` (~line 109, set by `patch()` / `handlePropertyTypeChange`).** Do **NOT** introduce `react-hook-form` or any new form-state library — that would be unrequested architecture (clause 1/2). The epic's pre-read and the earlier kickoff draft mention `formState.isDirty`; the real code uses a manual flag — use the manual flag. Save gets `disabled={submitting || !isDirty}`.
6. **Status control visibility is role-gated, server-side.** It renders only when the viewer is admin/moderator. The edit route must pass `canManageStatus: boolean` (derive from `canAdminEditListing(userRole)`) plus `currentStatus` and `listingId` down through `ListingFormLoader` → `ListingFormShell`. In **create mode** there is no status → never render it. For a non-staff owner, never render it (do not rely on UI hiding alone — the prop is computed on the server).
7. **Selectable target statuses come from the existing domain/transition layer** (`listingTransitionEngine` / `domain-rules.md`) — do NOT hardcode a status string array (Note 14). If the selectable set for this control is not already derivable from an existing helper, STOP and ASK.

---

## 2. Current behavior to preserve (action-by-action — verify each still works in the diff)

On `ListingFormShell` today (cabinet + staff, both modes):
- Header: title (`edit_listing`/`create_listing`) + subtitle + a ghost **Cancel** (top-right).
- Four `SectionCard`s: Basics (listing type, property type, title, description, price+currency), Details (`DynamicFieldSection`), Photos (`ImageUpload`), Location.
- Bottom action row: **Cancel** (outline, `size="xl"`) + **Save/Publish** (`size="xl"`, label `form_save`/`form_publish`, spinner while `submitting`). Save is currently disabled only while `submitting` (NOT on `!isDirty` — that changes in §3).
- **Cancel logic:** if `isDirty` → open the cancel-confirm `Dialog`; else `navigateAway()`. The confirm Dialog has No (`cancel_confirm_no`, closes) + Yes (`cancel_confirm_yes`, destructive, `navigateAway()`). **This dialog works today — keep it working.**
- `beforeunload` guard while `isDirty`.
- `submitError` banner; validation via `handleSubmit` + `scrollToFirstError`.
- Success `done` state (`CheckCircle2` + localized title/body, timed `router.push`).
- Edit submit → `updateListing`; `not_found` → redirect to cabinet; success → `getPostSaveRedirect`. Create submit → `createListing` → home.

**None of the above may be silently dropped (Note 20). Save/Cancel may RELOCATE into the side panel (Note 21 — the new location must be implemented in this same task), but every behavior above must remain reachable and functional.**

---

## 3. Required after-behavior (action-by-action)

1. The form renders in the `AdminEditLayout` two-column pattern on **both** create and edit, owner and staff: **main** = the four `SectionCard`s; **sidebar** = the action panel.
2. The **action panel (sidebar)** contains, top to bottom: **Save changes** (`form_save`/`form_publish`), **Cancel**, and — only when `canManageStatus` — a **Change status** block (the `StatusChangeControl` select + its note Textarea + submit). No other action exists today; confirm via inventory.
3. **Save is disabled when `!isDirty`** (and while `submitting`); it enables the instant any field changes (`isDirty` flips true via `patch`); after a successful save `isDirty` resets and Save disables again. The disabled state must be visible (not merely hidden).
4. **Change status** (staff only): selecting a target status calls the wrapped `applyListingTransitionByStatus`; on `ok:true` show the success toast (already in `StatusChangeControl`) and reflect the new status without a full reload where feasible (`router.refresh()` acceptable); the row is persisted (no UI-only flip). Status change is INDEPENDENT of the form's Save (it has its own submit inside `StatusChangeControl`).
5. Cancel (now in the panel) keeps the exact `isDirty` → confirm-Dialog → `navigateAway()` logic. The header ghost Cancel may be removed ONLY because Cancel now lives in the panel (document this relocation in the inventory).
6. The single-column `max-w-2xl` wrapper is replaced by the two-column layout in a wider container; the main column keeps the section cards' look.

---

## 4. 🔴 Mobile <640 full-width gate (OWNER P0 — MANDATORY, spell-out)

`AdminEditLayout` collapses to one column below `lg` (1024) — the sidebar stacks **below** the main form. That satisfies stacking, but the **controls inside the panel must be full-width at `<640` (`max-sm`)**:

- **Save changes** button: `max-sm:w-full max-sm:min-h-11`.
- **Cancel** button: `max-sm:w-full max-sm:min-h-11`.
- **Change status** `StatusChangeControl` (select): the trigger is the canonical `Combobox` `variant="button"` — confirm it is full-width at `<640` and that its **dropdown opens as a full-width bottom sheet** (the canonical Combobox already carries the Task 421 bottom-sheet tokens — verify in the rendered screenshot, do not re-implement). The note `Textarea` and its submit button: full-width at `<640` (`max-sm:w-full` on the button, `min-h-11`).
- The cancel-confirm `Dialog` is the canonical `Dialog` — confirm it renders as a full-width bottom sheet at `<640` with its two footer buttons full-width/stacked.
- ≥44px touch targets on every panel control; long sq/en/uk/it labels wrap (`whitespace-normal break-words`), never clip; **no horizontal scroll at 320**.
- **Icon-only exemptions:** none expected. If you add any icon-only control, list it with justification.

If the correct mobile composition of the stacked side panel is genuinely ambiguous (panel-above vs panel-below the form on mobile), **STOP and ASK** — do not guess. Default decided here: panel stacks **below** the form (AdminEditLayout default order), matching today's bottom-action placement.

---

## 5. Positive flow (happy path)

**5a. Owner edits and saves (cabinet):** Actor: listing owner, logged in. Pre: `/sq/listings/<slug>/edit` renders the form, Save disabled (not dirty). Steps: (1) owner edits a field → `isDirty=true`, Save enables; (2) owner clicks **Save changes** (panel) → spinner, `updateListing` → success `done` state → timed redirect via `getPostSaveRedirect`. Post: row updated; `isDirty=false`; no status control shown.

**5b. Staff changes status (shared route, staff viewer):** Actor: admin/moderator. Pre: opens the same edit route for any listing; panel shows the **Change status** block (`canManageStatus=true`) with `currentStatus` preselected. Steps: (1) staff picks a valid target status in the Combobox → wrapped `applyListingTransitionByStatus({...,toStatus})` runs; (2) `ok:true` → success toast, panel reflects the new status (`router.refresh()`), owner gets the existing `listing_status_change` notification. Post: `listings.status` persisted via the gateway; public index/detail revalidated by the action.

Both flows' key steps must be verifiable at file:line in the diff.

---

## 6. Negative flow (every branch — each needs a verifiable handler/guard/toast/early-return in the diff)

- **Cancel with unsaved changes:** Cancel → confirm Dialog opens; **No** closes (stays on form, nothing saved); **Yes** → `navigateAway()`. Esc / backdrop also dismiss the Dialog and do NOT navigate.
- **Cancel with no changes:** Cancel → `navigateAway()` immediately, no Dialog.
- **Save with `!isDirty`:** button disabled — no submit possible (verify disabled, not hidden).
- **Save validation error:** `handleSubmit` sets `errors`, scrolls to first error, no server call (existing behavior preserved).
- **Save server error:** `updateListing`/`createListing` returns `error` → `submitError` banner, `submitting=false`, stays on form (existing behavior preserved).
- **Save `not_found` (edit):** redirect to cabinet listings (existing).
- **Status change — invalid transition:** gateway returns `invalid_transition` → map non-`ok` to a thrown error so `StatusChangeControl`'s existing try/catch shows `status_change_error`; status unchanged.
- **Status change — forbidden (role lost / not staff):** gateway returns `forbidden` → error toast; no write. Also a non-staff user must never SEE the control (`canManageStatus=false`, server-gated).
- **Status change — not_found / db_error:** error toast; no optimistic flip persists.
- **Status change — same status:** gateway returns `ok:true` no-op; control resets without a spurious "changed" claim.
- **Double-submit:** Save disabled while `submitting`; status submit disabled while its `pending` (existing `disabled || pending`).
- **Network offline / expired session on Save:** action rejects → `submitError` path; on `getUser()` loss the route already redirects to login with `session=lost`.
- **Locale mismatch:** all new labels resolve in sq/en/uk/it (no raw keys).
- **Create mode:** never render the status control (no `listingId`/status).

---

## 7. i18n, control inventory, rendered evidence

- **i18n (clause 7):** any NEW user-facing string (e.g. a side-panel section heading like `listing.actions_panel_title`, or a Change-status sub-heading if not already in `admin.common.status_control`) goes into **all four** `messages/{sq,en,uk,it}.json` with the SAME key set. Reuse existing keys where present (`common.cancel`, `listing.form_save`, `listing.form_publish`, `admin.common.status_control.*`). Paste the parity count in the log.
- **Control inventory (Note 20):** session log MUST contain a before/after table for the form's controls (header Cancel, bottom Cancel, Save, + new Change-status) showing where each lives AFTER and that nothing was dropped; the Save/Cancel relocation into the panel documented per Note 21.
- **Rendered evidence (clause 12/13 — REQUIRED, machine-produced):** add a Storybook story harness for the form layout (follow the `ListingDetailView.stories.tsx` precedent from Task 237: mock data/actions, no live Supabase) covering at minimum **owner mode** (no status control) and **staff mode** (status control visible); add the new story IDs to `ASSERT_STORIES` in `scripts/check-stories-rendered.mjs`. Run `npm run build-storybook` (`check:stories` must stay green — no hardcoded literals, no `layout:'centered'`) then `npm run screenshots:assert`; paste the real `Results: N/N PASS, 0 FAIL` with **uk@320/375/390 mandatory cells** for the new stories. If mocking the full `ListingFormShell` for Storybook is infeasible, **STOP and ASK the orchestrator** — do NOT close UI cells with "no browser access"; that never approves a UI task.

---

## 8. Acceptance criteria (each maps to a flow above + must be verifiable in the diff)

1. Both modes (create/edit) and both viewers (owner/staff) render the `AdminEditLayout` side-panel; main column = section cards, sidebar = actions. [§3.1; file:line]
2. **Save changes** disabled when `!isDirty`, enabled on first change, resets after save; uses the existing manual `isDirty` (no react-hook-form added). [Positive 5a; file:line]
3. **Change status** appears only when `canManageStatus` (staff), wired to `applyListingTransitionByStatus`; persists; success toast; owner notified. [Positive 5b; file:line]
4. Cancel relocated to the panel; `isDirty`→confirm-Dialog→`navigateAway` preserved incl. Esc/backdrop dismiss. [Negative: cancel branches; file:line]
5. Every Negative-flow branch in §6 has a verifiable guard/toast/early-return. [§6; file:line each]
6. Before/after control inventory present; nothing dropped (Note 20/21). [§7]
7. 4-locale parity for any new keys (count in log). [clause 7]
8. Mobile <640 full-width gate met for all panel controls + popups, with the rendered matrix (uk@320/375/390) proving it. [§4 + §7; clause 12/13]
9. `npx tsc --noEmit`=0; `npm run build` passes; `npm run lint` 0 new; `check:i18n`/`check:i18n-dynamic`/`check:i18n-hardcode` green; `check:file-integrity:all` green; `check:stories` + `screenshots:assert` green. Paste the transcript.

---

## 9. Hard contract (P0 — orchestrator verifies each against the real diff) + expected files

- No scope change; no drive-by refactors (clause 1). No invented architecture; STOP&ASK on ambiguity (clause 2) — the §1 decisions are fixed.
- No silently removed control; editable controls keep an editable home (clauses 3/4, Notes 20/21).
- Implement BOTH the positive AND every negative branch in §5/§6 (clause 6a).
- All four locales for new strings (clause 7); rendered evidence at the canonical breakpoints (clauses 8/12/13).
- Mobile <640 full-width + bottom-sheet gate (clause 11) — §4 is non-negotiable.
- Self-validate before claiming complete (clause 9): `tsc=0`, AC-by-AC table (each row → file:line OR runtime step → ✅), run the flow at `uk` 320px end-to-end, final `Self-validation: …` line.
- File-integrity (clause 14): read back every written file; 0 NUL, no BOM, parses, not truncated; paste the green transcript.
- **Update `docs/backlog.md` + add a session log under `docs/sessions/` with a "Files Changed" table (one row/path + 1-line rationale).** Do **NOT** run any git — single-writer; the orchestrator emits commit commands at review. Do not run git even read-only in the sandbox.

Expected files to change (confirm in your Files Changed table; adjust only with justification): `ListingFormShell.tsx`, `ListingFormLoader.tsx`, `src/app/[locale]/listings/[slug]/edit/page.tsx`, `src/app/[locale]/listings/create/page.tsx`, a small `'use server'` status-change wrapper (if needed), the new form Storybook story, `scripts/check-stories-rendered.mjs`, `messages/{sq,en,uk,it}.json`, `docs/backlog.md`, `docs/sessions/2026-06-14-task238-listing-form-side-panel.md`.

## 10. Out of scope

- The admin Cancel-confirm dead-button bug → **Task 239 (Y.4)**.
- Raw-key labels → Task 236 (Y.1, done). The moderation preview → Task 237 (Y.2, done).
- The underlying listing lifecycle / transition engine internals (Epic R/I) — consume them, do not change them.
- Redesigning `StatusChangeControl` or `AdminEditLayout` internals; field-level form layout beyond relocating actions into the panel.
