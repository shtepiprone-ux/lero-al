# Sprint 12 — kickoff prompts (Tasks 228, 234, 235, 236, 239, 242, 244, 248)

> **Migrated to the new concrete task template on 2026-05-27 by Task 254.** The original task
> intent, scope, and acceptance criteria are preserved. Each task now references the new P0 source
> of truth (`docs/agent-contract.md`), uses `docs/rule-index.md` for task-type pre-read selection,
> and carries the new behavior-preservation hooks (Notes 21/22/23) where relevant.

> Shared hard contract (top of every prompt). You are Claude Code Sonnet 4.6 working in `lero-al`.
> **P0 contract:** read `docs/agent-contract.md` FIRST — it is the short, non-negotiable contract
> every Sonnet task must follow.
> **Pre-read selection:** every task lists its `Pre-read` from `docs/rule-index.md` under the
> matching task type — never "read all docs".
> Long-form rules: `docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt"
> and the 2026-05-25 + 2026-05-27 rules in `docs/ai-behavior.md` — **Note 18 (Pre-Completion
> Self-Validation)**, **Note 19 (UX Flow Preservation)**, **Note 20 (Existing-Control
> Preservation)**, **Note 21 (Control Relocation Rule)**, **Note 22 (Admin Table Preservation
> Rule)**, **Note 23 (Edit-Flow Preservation Rule)** — these are non-optional.
> No scope change; no invented architecture (STOP & ask the orchestrator if anything is ambiguous);
> literal AC; **self-validate BEFORE the "complete" claim** (tsc=0 in shell, AC-by-AC audit table
> in session log, diff self-review, runtime check in `uk` 320px); **preserve UX flow and existing
> controls** (before/after inventory in session log); update `docs/backlog.md` + add session log
> under `docs/sessions/`; 0 new lint/typecheck errors; `npm run build` passes; governance PASS;
> locale parity sq/en/uk/it (every new string ×4); responsive 320/375/390/768/1280/1440/2560 for
> any UI. **Owner runs git AND SQL** — emit ready-to-run `git add <paths>` (or `git add -A`) +
> `git commit -m "<type>(TaskN): …"` as plain text at the end; emit any new SQL into the session
> log; the executor NEVER runs git or SQL itself.
>
> **Every task below uses this Pre-read header (in addition to the task-specific files):**
> 1. `docs/agent-contract.md` (P0 contract)
> 2. `docs/backlog.md`
> 3. Task-relevant docs from `docs/rule-index.md` (named per task)
> 4. Inspect `package.json` for current validation scripts.
>
> **Every task below also carries:**
> - A `Current behavior to preserve` block (the surface inventory the orchestrator filled — Sonnet re-verifies in the session log).
> - A `Required after behavior` block (the user-facing outcome).
> - The conditional rule blocks (Note 21 / 22 / 23) where the task type matches.

---

## Task 228 — W.1 — Filter sections disappearing on property-type change

```
Hard contract: see top.

BUG (visible production): in the "Розширені фільтри" drawer on BOTH the homepage and `/listings`,
selecting a different "Тип нерухомості" (property type) makes the "Ринок нерухомості" section (and
possibly other sections) silently disappear. The user loses controls they had a second ago.

Root-cause hypothesis (verify before fixing): the filter-section visibility decision lives in
`getFilterVisibility` / the property-type change handler, and the homepage draft state's
`handlePropertyTypeChange` strips fields whose section is no longer visible (`docs/ai-behavior.md`
→ Filter Architecture Anti-Patterns: "when property type changes, clear all fields for sections
that are no longer visible (handlePropertyTypeChange must delete from { …prev, property_type: pt },
not from an empty object)"). The rule against stale fields is correct; the bug is that one of the
sections is being marked not-visible when it should be visible for the new property type.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md (canonical control rules + UI pre-flight)
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Filter Architecture Anti-Patterns + Note 14 (Global Change Verification) + Note 19 (UX flow) + Note 20 (control preservation)
- src/lib/filters/filterEngine.ts (getFilterVisibility, parseSearchParams)
- src/modules/filters/components/FiltersPanel.tsx (homepage drawer) + useHomepageFilters.ts
- src/modules/listings/components/ListingsFilters.tsx (/listings drawer)

Current behavior to preserve:
- Affected surfaces: homepage "Розширені фільтри" drawer + /listings drawer.
- Existing controls: every filter section visible today (property type, market, price range, area, rooms, etc.) + the property-type Combobox + the Apply / Reset buttons.
- Existing editable controls: every filter input/select/toggle inside each section.
- Existing read-only labels: section headers.
- Existing success/error behavior: filters apply on click (homepage = batch; /listings = URL-immediate).
- Existing mobile behavior at 320px in uk.

Any existing control must either remain, move to a specified new place, or be explicitly listed as removed. Silent removal is forbidden (this task EXISTS because a section was silently disappearing — the fix is to STOP that disappearance, not to add new sections).

Required after behavior:
As a guest or signed-in user, on the homepage OR /listings drawer:
1. Open "Розширені фільтри".
2. Select any property type.
3. The same set of filter sections that should be visible for that property type IS visible — no section silently disappears.
4. Apply filters → filters work end-to-end exactly as before.
5. Reset → all fields cleared, all visible-by-default sections shown.
6. Same behavior in all four locales (sq/en/uk/it) at all seven breakpoints.

Scope (Epic W kickoff narrowed to this one bug — siblings are W.2-W.6, separate tasks):
1. Identify which section(s) lose visibility on property-type change. Reproduce in the running
   app at both surfaces. Capture the property-type values that trigger it.
2. Fix in filterEngine.ts (the canonical source). `getFilterVisibility` is the single decision —
   no inline override in FiltersPanel.tsx or ListingsFilters.tsx (per Note 14: ONE shared
   implementation).
3. Re-verify: switch every property type at both surfaces in all four locales; capture the
   before/after section inventory in the session log per Note 20.

Acceptance criteria:
- For every property type, the same set of filter sections is visible at both surfaces — no
  silent disappearance. Inventory table (property_type × section) in the session log; every cell
  green.
- The fix lives in filterEngine.ts (or a sibling canonical module), not in component-level
  overrides. Grep proves no per-component visibility branching.
- §17 UI pre-flight output in the session log.
- Self-validation block per Note 18 (tsc=0, AC table all green, scope=clean).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-228-w1-filter-section-visibility.md.

Out of scope: W.2 (one global reset), W.3 (sort option), W.4 (canonical Combobox migration),
W.5 (toolbar overflow), W.6 (vertical gap). File them as later sprint tasks; do not touch them here.
```

---

## Task 234 — X.1 — `property_type=room` enum drift + global enum integrity audit

```
Hard contract: see top.

PRODUCTION ERROR (issues.txt 2026-05-25, Sentry-style log included):
  invalid input value for enum property_type: "room"  (code 22P02, searchParams { property_type: 'room' })
This is the SECOND member of the same bug class — the previous one was fixed on 2026-05-23 (check
docs/sessions/ around that date for the prior fix). Owner wants a global enum audit to prevent
the next variant.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "DB / server action / RLS task" bundle:
  - docs/data-access-rules.md
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification) + Domain Integrity Rules + Note 18 (self-validation)
- src/lib/filters/filterEngine.ts (parseSearchParams + value coercion)
- src/modules/listings/validations/* (Zod enums)
- src/modules/listings/queries/* (Postgres enum usage)
- the 2026-05-23 session log that fixed the prior variant (use it as the reference fix shape)
- Task 172 session log + scripts/check-schema-drift.mjs + src/types/database.ts

Current behavior to preserve:
- Affected surfaces: /listings page (parseSearchParams runs server-side), filter drawer (Combobox catalog values), Zod schema validation, DB enum usage in queries.
- Existing controls / behavior: known property_type / offer_type / purchase_conditions / listing_status / moderation_status / currency / role values continue to work end-to-end; legal URLs are unchanged.
- Existing error behavior: the production 22P02 error must STOP happening; no new user-facing error replaces it (the unknown value is silently dropped per scope).
- No UI control disappears as a side effect of the coercion change.

Required after behavior:
As any user visiting `/listings?property_type=room` (or any URL carrying an unknown domain-enum value):
1. The request reaches `parseSearchParams`, the unknown value is dropped.
2. The query that hits Postgres no longer carries `property_type=room` — no 22P02 error.
3. The page renders normally as if no `property_type` filter was applied.
4. Same behavior for every other domain enum in the listings module (audit table proves it).
5. The schema-drift guard (or a follow-up task) prevents this class of bug from re-appearing.

Scope:
1. Coerce-or-drop in filterEngine.ts. parseSearchParams must:
   - Read the canonical list of property_type values from the single source of truth (DB catalog
     `property_types` if it exists, or the canonical TS enum — confirm with the orchestrator if
     ambiguous, STOP and ask).
   - If the URL carries an unknown `property_type=<x>`, drop it (do not propagate). Same rule for
     every other domain enum used by the listings module.
2. Global enum audit for the listings module. For each of: property_type, offer_type,
   purchase_conditions, listing_status, moderation_status, currency, role — list in a session-log
   table: where the UI catalog lives, where the Zod schema lives, where the DB enum lives,
   whether they agree.
3. For each divergence found: fix in this task if it's a one-line catalog miss; otherwise file a
   numbered follow-up task under Epic X (orchestrator approves the slice — STOP and ask).
4. Schema-drift guard (Task 172) — extend it so a future enum addition that doesn't reach all
   four layers fails the build (or document why it can't and propose the smallest follow-up).

Acceptance criteria:
- `property_type=room` (or any unknown property_type) URL no longer reaches Postgres — verified
  by hitting the URL locally and seeing the value dropped at parseSearchParams, plus a unit test
  for the coercion.
- Audit table in the session log; one row per domain enum; ✅ for "all 4 layers agree" or ❌ +
  a follow-up task ID.
- Schema-drift guard either extended OR a follow-up filed; documented choice in the session log.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales (any new error string); 7
  breakpoints (filter UI unaffected unless a value is hidden).
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-234-x1-enum-drift-audit.md.

Out of scope: non-listings enums (users / reports / etc.) — file follow-ups if affected.
```

---

## Task 235 — X.2 — Restore removed admin row actions on `/admin/listings`

```
Hard contract: see top.

P0 REGRESSION (issues.txt 2026-05-25 #1): a prior Sonnet change silently removed admin row
actions from /admin/listings, leaving roughly half of the listing-status / management options
unreachable. This is the canonical Note-20 violation that triggered the new rule in this same
day. Restore.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "Admin table / admin control task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/component-governance.md §11 (canonical AdminTableRow pattern)
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → **Note 20 (Existing-Control Preservation, 2026-05-25)** + **Note 22 (Admin Table Preservation Rule, 2026-05-27)** + Note 18 (self-validation) + Note 19 (UX flow)
- Epic K session logs — Tasks 127–130 (canonical AdminTableRow pattern)
- src/components/admin/AdminListingsTable.tsx, src/app/admin/listings/page.tsx,
  src/modules/admin/actions/* (moderation + status-change handlers — they all still exist;
  the UI lost the entry points)
- read-only `git log` of AdminListingsTable.tsx to identify when the row actions were dropped
  (allowed per orchestrator-role.md — read-only git only; do NOT touch the index)

Current behavior to preserve (BEFORE = current broken state; AFTER = restored state):
- Affected surface: /admin/listings.
- Existing controls today (broken state): row click + a reduced subset of row actions. Status switcher and several moderation actions are MISSING (this is the regression to fix).
- Pre-regression controls (target state, reconstructed from git history): every row action that existed before the regression — approve / reject / publish / archive / draft / sold / hide / moderation, listing status switcher, every moderation action. Inventory in the session log using `git log` evidence.
- Server actions are intact (`src/modules/admin/actions/*`) — the UI lost the entry points.

**Admin Table Preservation Rule (Note 22):**
Before editing the table, inventory in the session log: columns, row click behavior, row actions, inline controls, filters, search, pagination, sort, empty state, loading state, mobile layout. After the change, every BEFORE-regression admin action must remain reachable — via the canonical §11 pattern OR via Task 196's side-panel.

Required after behavior:
As an admin or moderator, on /admin/listings:
1. The row click target works (opens the modal OR navigates to edit, per the canonical §11 decision).
2. Every listing-lifecycle action that existed pre-regression is reachable — approve / reject / publish / archive / etc., however the §11 canonical pattern routes it.
3. Status changes persist after page reload.
4. Locale `uk` at 320px: every action is reachable (no overflow, no off-screen controls).

Scope:
1. BEFORE-state inventory. From git history, list every row action / status switcher that
   existed pre-regression. Include moderation actions (approve / reject / publish / archive /
   etc., whatever the listing lifecycle supports). Paste the table into the session log.
2. AFTER-state implementation. Restore every BEFORE-state action — via the canonical §11 pattern
   (no per-row Actions column, row click → modal) OR via the Task 196 side-panel actions on the
   listing edit screen if that ships first. The decision MUST follow §11; do NOT invent a new
   placement.
3. Verify: signed in as admin, on `/admin/listings`, every action that existed before is reachable
   (row click → modal → action OR row click → edit → side panel → action). Locale `uk` 320px
   pass.

Acceptance criteria:
- Inventory table in the session log: BEFORE (every action) ↔ AFTER (every action's new
  location). Every BEFORE row has an AFTER row.
- Listing-status changes reachable from /admin/listings exactly as before (or canonical §11 if
  that supersedes the old pattern — documented choice).
- §17 UI pre-flight output + UX-flow trace per Note 19 + control-inventory per Note 20.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-235-x2-admin-listings-controls.md.

Out of scope: the side-panel pattern itself (Task 196 / R.2 — if not yet shipped, this task
uses §11 only and X.2 may be re-checked once R.2 lands). Changing the lifecycle.
```

---

## Task 236 — Y.1 — Raw i18n keys exposed on the listing form

```
Hard contract: see top.

BUG (issues.txt 2026-05-25 #27): on the cabinet listing-create form, labels render as raw
i18n key paths instead of translated strings — confirmed: `listing.offer_type`,
`listing.purchase_conditions`. The same audit applies to the admin listing create/edit form.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification) + Localization (i18n) Rules + Note 18 (self-validation)
- src/modules/listings/components/ListingFormShell.tsx + every field it renders
- messages/sq.json / en.json / uk.json / it.json — specifically the `listing` namespace; cross-reference with Task 217 session log (offer_type + purchase_conditions columns + form)

Current behavior to preserve:
- Affected surfaces: cabinet listing-create form + admin listing create/edit form.
- Existing controls: every form field (offer_type, purchase_conditions, property_type, market, price, area, rooms, photos, location, etc.) and their inputs/Comboboxes/toggles.
- Existing editable controls: every form field — unchanged by this task; only labels (i18n) are being fixed.
- Existing read-only labels: section headers, helper text — must render properly translated in all four locales after this task.
- Existing success/error behavior: form save behavior unchanged.

This is a localization-only fix — no behavior changes; only the missing i18n key strings are added.

Required after behavior:
As a signed-in user, on the cabinet listing-create form, in each of the four locales (sq/en/uk/it):
1. Every label/section header renders as a translated string — never as a raw dot-path like `listing.offer_type`.
2. Same form behavior as before (submit / validate / save).

As an admin, on the admin listing create/edit form, in each of the four locales:
1. Same — no raw `listing.*` key paths visible.

Scope:
1. Audit. Open the cabinet listing-create form in all four locales; list every visible string that
   renders as a raw key (anything containing a `.`). Same for admin listing create/edit. Paste
   the table in the session log.
2. Fix. For each raw key, add the missing translation under the correct namespace in all four
   locale files, OR fix the consumer if the key path is wrong (whichever the audit indicates).
3. Locale-parity check. Count keys per file and per namespace BEFORE and AFTER; they must match.

Acceptance criteria:
- Grep + runtime proof: zero raw `listing.*` (or any namespace dot-path) visible on the cabinet
  listing form at runtime in any of the 4 locales.
- Same on the admin listing create/edit form.
- Locale parity ×4 verified (key-count audit in the session log).
- §17 UI pre-flight output.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-236-y1-raw-i18n-keys-listing-form.md.

Out of scope: restructuring the form layout (Y.3); status-control flow (Y.3); cancel modal (Y.4).
```

---

## Task 239 — Y.4 — Admin listing edit: Cancel confirm modal no-op fix

```
Hard contract: see top.

BUG (issues.txt 2026-05-25 #99): in admin listing edit, clicking "Скасувати" opens a confirm
popup; clicking "Скасувати" inside the popup does NOTHING. Cancel flow dead.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md (Modal canonical pattern reference — even though Epic Z hasn't shipped, the canonical Dialog is in place)
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → **Note 19** (every state of the flow must work — cancel/dismiss included) + **Note 18** (self-validation) + No Fake Fixes Policy + Note 20 (control preservation)
- src/app/admin/listings/[id]/* (admin listing edit page) and the file rendering the cancel button + its confirm Dialog
- src/components/ui/dialog.tsx + any ConfirmationDialog wrapper if present

Current behavior to preserve:
- Affected surface: admin listing edit screen.
- Existing controls: every form field, every action button (Save, Cancel, Delete, etc.), every modal.
- Existing editable controls: every editable field on the listing edit form.
- Existing read-only labels: any informational text.
- Existing server actions: updateListing, deleteListing, etc. (none of these need to change).
- The bug today: Cancel → confirm modal → "Скасувати" button does NOTHING. After this task: it must correctly leave the edit screen (the standard cancel-and-discard-changes flow).
- Existing mobile behavior at 320px in `uk`.

Required after behavior:
As an admin, on the admin listing edit page:
1. Click "Скасувати" → confirm modal opens.
2. Click "Скасувати" inside the modal → the user navigates away from the edit screen (or closes the modal, per the canonical pattern — the choice is documented).
3. Press Escape → modal closes; no navigation.
4. Click the backdrop → modal closes; no navigation.
5. Click "Підтвердити" (or equivalent) → confirmation completes the cancel; user leaves the edit screen.
6. Same behavior in all four locales at all seven breakpoints.
7. Same canonical fix applied everywhere the broken pattern existed (grep proof in the session log).

Scope:
1. Reproduce in the running app; capture the broken-state UX trace (entry → button → modal →
   confirm → outcome).
2. Root-cause: missing onClick on the confirm button? wrong button bound to dismiss vs cancel?
   silent thrown promise? Document the cause in the session log.
3. Fix. Use the canonical Dialog primitive (no raw `div.fixed.inset-0` — that's a §0 violation).
4. Grep the repo for the same dead-confirm pattern. Apply the same fix everywhere if any other
   site uses the same broken wiring (Note 14 — Global Change Verification).

Acceptance criteria:
- Cancel → confirm modal → confirm button correctly leaves the edit screen (navigation /
  modal-close behaviour matching the canonical pattern used in admin elsewhere).
- Esc, backdrop click, and the other dismiss controls also work.
- Same fix applied everywhere the broken pattern existed (grep proof in the session log).
- UX-flow trace per Note 19; control-inventory per Note 20 (modal close button preserved).
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-239-y4-admin-cancel-modal.md.

Out of scope: redesigning the modal layout (Epic Z); the side-panel pattern (Y.3).
```

---

## Task 242 — BB.1 — Listing report button broken on detail page

```
Hard contract: see top.

BUG (issues.txt 2026-05-25 #100): the "Поскаржитись" button on the public listing detail is
visible but clicking it does nothing — the Epic C reports backend exists; the UI wiring is broken
or was lost in a refactor.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 19 (UX-flow preserved) + Note 20 (no silent control removal — verify the dialog component still exists) + Note 18 (self-validation)
- Task 117 session log (`ListingReportDialog` + `reportListingAction`)
- Task 118 + Task 125 session logs (admin reports dashboard + reporter notification)
- src/modules/listings/components/ListingContact.tsx (and wherever the Report button trigger lives)
- src/modules/listings/components/ListingReportDialog.tsx (or wherever Epic C placed it)

Current behavior to preserve:
- Affected surface: public listing detail page — specifically the contact card / actions row containing the "Поскаржитись" (Report) button.
- Existing controls: every action on the detail page (Save / Favorite / Share / Contact / Report / etc.) — all must remain reachable.
- Existing editable controls: the Report dialog form fields (reason, optional comment) must remain editable when the dialog finally opens.
- Existing server actions: `reportListingAction` is intact; only the UI wiring is broken.
- Existing read-only labels: nothing to change.
- Existing mobile behavior at 320px in uk.

Required after behavior:
As a signed-in user, on the public listing detail page:
1. Click "Поскаржитись" → canonical `ListingReportDialog` opens.
2. Fill the reason → submit → server action creates a `reports` row → success toast (4 locales).
3. Admin sees the new row in `/admin/reports`.
4. Admin changes the report status → reporter receives an in-app notification + email (Task 125 contract preserved; email in Albanian per Epic GG / Task 251).
5. Esc / backdrop / Cancel all behave correctly inside the dialog.
6. Same behavior in all four locales at all seven breakpoints.

Scope:
1. Reproduce. Capture the broken-state trace.
2. Root-cause: is the Dialog mounted? Is `open` state ever set true? Is the trigger pointing at
   the right component? Is the server action returning an error that's silently swallowed?
3. Fix the wiring at the smallest scope. Do NOT redesign the report flow.
4. End-to-end verify: signed-in user reports → row in admin → status change → notification
   email reaches reporter (Task 125 contract preserved).

Acceptance criteria:
- Clicking Report opens the canonical ListingReportDialog; submit creates a `reports` row
  reaching the admin dashboard.
- Reporter notification still fires (no Task 125 regression).
- UX-flow trace + control-inventory in the session log.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-242-bb1-listing-report-button.md.

Out of scope: redesigning the reports schema or admin dashboard; changing the email content.
```

---

## Task 244 — CC.1 — Phone Combobox placeholder 9 digits across the project

```
Hard contract: see top.

BUG (issues.txt 2026-05-25 #9): the phone-number combobox placeholder shows 8 digits everywhere on
site + admin. Albanian mobile numbers are 9 digits. Placeholder must be 9 digits.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Localization (i18n) Rules + Note 14 (Global Change Verification) + Note 18 (self-validation)
- Task 158 session log (libphonenumber-js + PhoneField), Task 170 (phone validation i18n), Task 187 (45 country codes), Task 188 (client validation)
- src/components/shared/PhoneField.tsx
- messages/sq.json / en.json / uk.json / it.json — every key whose value looks like a phone placeholder (likely under nav / common / auth / admin)

Current behavior to preserve:
- Affected surfaces: every phone input across the site + admin (registration, login, profile, listing form, admin user-profile edit, contact form, etc.).
- Existing controls: PhoneField (country-code Combobox + national-number input) — unchanged in behavior.
- Existing editable controls: the country-code selector and the national-number input — both stay editable.
- Existing validation: libphonenumber-js validation rules unchanged (Tasks 158/170/187/188).
- Existing server actions: unchanged.
- Existing read-only label: only the placeholder text changes (8-digit → 9-digit).

Required after behavior:
As any user, on any surface containing a phone input, in any of the four locales:
1. The phone input renders with a 9-digit placeholder (e.g. `691 234 567` — confirm exact string with the orchestrator if no canonical example exists yet).
2. Validation, country-code selection, and submission behavior are unchanged.
3. Locale parity ×4: all four files carry the 9-digit placeholder in the same key set.

Scope:
1. Audit. Grep messages/*.json for any phone-placeholder strings. List them with current
   8-digit values.
2. Also grep PhoneField.tsx (and any sibling) for a fallback hardcoded placeholder; fix that
   too.
3. Update every placeholder to a 9-digit example. Owner has not specified the exact pattern —
   if there's no canonical example string already in the repo, propose one (e.g.
   `691 234 567`) and STOP to confirm with the orchestrator before shipping.
4. Locale parity ×4: every locale file must carry the 9-digit placeholder.

Acceptance criteria:
- Every phone input across the site + admin renders a 9-digit placeholder at runtime, in all 4
  locales.
- Grep proves no remaining 8-digit placeholder strings in messages/*.json or component
  fallbacks.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-244-cc1-phone-placeholder.md.

Out of scope: changing phone validation rules (Tasks 158/170/187/188); changing country-code
defaults; CC.2 (multi-lang search match) — separate task.
```

---

## Task 248 — FF.1 — Header reactivity on profile name change

```
Hard contract: see top.

BUG (issues.txt 2026-05-25 #30): the user changes their name in the cabinet Profile tab and
saves; the header user-chip keeps showing the OLD name until the user manually reloads the page.
This is a Note-19 cross-page-reactivity violation.

Pre-read (in addition to the Sprint-wide always-required pair from the header):
- `docs/rule-index.md` → "Profile / edit-flow task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
  - docs/state-authority.md
- docs/ai-behavior.md → **Note 19** (cross-page propagation) + **Note 23 (Edit-Flow Preservation Rule)** + Note 18 (self-validation) + No Fake Fixes Policy
- Task 185 session log (P.3 — stale header after self-delete; AuthController commit pattern is the closest precedent)
- src/modules/cabinet/components/ProfileTab.tsx (the name edit + save flow)
- the header user-chip component — find by grep (likely src/components/shared/Header*.tsx or src/modules/layout/Header*.tsx) — and the auth context / user state holder

Current behavior to preserve:
- Affected surfaces: cabinet ProfileTab (name edit + save), site header (user chip), sidebar (if it shows name), breadcrumb (if it shows name), any greeting surface.
- Existing controls: ProfileTab name input + Save button — both stay editable.
- Existing editable controls: the name field — unchanged in editability; only the reactivity is being fixed.
- Existing read-only labels: header user-chip is a read-only display — that is correct; it just needs to update without a manual reload.
- Existing server actions: profile-update server action (preserve its behavior; this is a state-authority fix, not a server-action change).
- Existing success/error behavior: save toast on success, error toast on failure (preserved).
- Existing mobile behavior at 320px in uk.

**Edit-Flow Preservation Rule (Note 23):**
The name field MUST remain editable after this task. After save, the new name must persist after `router.refresh()` or a page reload (already true today; do not regress). The header / sidebar / breadcrumb (read-only displays) must reflect the new name without a manual reload — that is the FIX.

Required after behavior:
As a signed-in user, in the cabinet on the Profile tab, in any of the four locales:
1. Edit the name field and click Save.
2. The save server action succeeds.
3. The success toast appears (4 locales).
4. The header user-chip immediately shows the NEW name — without a manual page reload.
5. The sidebar, breadcrumb, and every other surface displaying the user name also shows the NEW name without manual reload.
6. After `router.refresh()` or a real page reload, the new name persists everywhere.
7. Same behavior at 320 / 1280 / 2560 breakpoints in `uk`.

Scope:
1. Map the current data path: where does the header read its `name` from? When does the cabinet
   Save invalidate / refresh that source? Document in the session log.
2. Fix at the state-authority layer (server-authoritative → router.refresh() is canonical; a
   client-only divergence from the server is forbidden per No Fake Fixes).
3. Also verify every other surface that renders the user name — sidebar, breadcrumb, greetings —
   propagates the change. Grep proof + runtime note for each.

Acceptance criteria:
- After saving a new name in the Profile tab, the header shows the new name with no manual
  reload, in all 4 locales, at 320 / 1280 / 2560.
- Every sibling surface displaying the user name also updates without manual reload (grep
  proof + per-surface runtime confirmation).
- UX-flow trace per Note 19 (entry → save → toast → header updates).
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-25-task-248-ff1-header-reactivity.md.

Out of scope: avatar reactivity (verify and report status — file follow-up if also broken);
the toast audit v2 (FF.2 / Task 249); changing the auth lifecycle.
```
