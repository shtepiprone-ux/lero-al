# Epic Y — Listing Form & Lifecycle UX

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #27 (raw i18n keys like `listing.offer_type` and
`listing.purchase_conditions` showing on the listing-create form in the user cabinet — audit + fix,
include the admin path); #28 (admin/moderator clicking "Переглянути оголошення" on a moderation
listing in `/admin/listings` shows a 404 — the public detail page does not exist yet because the
listing is on moderation; the requested behaviour is a temporary preview page that is replaced by
the permanent page on publish-approval); #29 (the listing create/edit screen on both site and
admin must use the same right-side actions pattern as the user create/edit screen — Task 196 /
R.2 — with "Save", "Cancel", "Change status" all reachable; admin cannot currently change a
listing's status because the control is hidden or broken; "Save changes" must be disabled while the
form has no dirty fields); #99 (in admin listing edit, clicking "Скасувати" shows a confirm popup
and clicking its "Скасувати" button does nothing — the cancel flow is dead).
**Kickoffs:** `Epic_Y_kickoff_prompts.md` (Tasks 236–239).

> This Epic is about the listing form being correct, complete, and reachable end-to-end — labels,
> entry points, status control, dirty-state tracking, confirmation flow. All four tasks touch the
> SAME form, so they MUST be coordinated against the Existing-Control Preservation rule (Note 20)
> — every shipped surface must keep its previous controls unless explicitly authorised.

## Dependencies

- `src/modules/listings/components/ListingFormShell.tsx` (the canonical form), the listing
  validations (`src/modules/listings/validations/*`), the admin listing edit page
  (`src/app/admin/listings/[id]/page.tsx` or similar), the cabinet listing create/edit screens.
- The admin side-panel actions pattern from Task 196 / R.2 (`AdminEditLayout` per the session log
  for 2026-05-23). Y.3 EXTENDS that pattern to the listing form.
- `docs/ui-rules.md` (canonical controls, modal pattern), `docs/component-rules.md`,
  `docs/ai-behavior.md` Note 19 + Note 20 (UX flow + control preservation), `docs/domain-rules.md`
  (listing status lifecycle), `messages/*.json` (i18n keys must exist for every label currently
  shown raw).

## Tasks

### Task 236 — Y.1 — Raw i18n keys exposed on the listing form

**Type:** bug
**Priority:** critical
**Area:** cabinet listing create/edit + admin listing create/edit

**Pre-read:** `docs/ai-behavior.md` Note 14 (Global Change Verification); `docs/ui-rules.md`;
`src/modules/listings/components/ListingFormShell.tsx` and every field component it renders;
`messages/sq.json` / `en.json` / `uk.json` / `it.json` under the `listing` namespace.
**Localization coverage:** sq, en, uk, it (every field/label/placeholder/help/error × 4).
**Responsive coverage:** all 7 breakpoints.

**Goal:** The listing-create form in the user cabinet currently shows raw i18n key paths instead of
translated labels — confirmed: `listing.offer_type`, `listing.purchase_conditions`. Audit every
field label / placeholder / help text / error message on the listing form (cabinet AND admin) and
fix every raw key.

**Acceptance criteria:**
- Zero raw `listing.*` (or any namespace dot-path) visible on the cabinet listing form at runtime
  in any of the 4 locales.
- Same audit run against the admin listing create/edit form; any missing keys filed and fixed.
- All four locale files have the same key set under `listing.*` (parity check in the session log).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** restructuring the form layout (Y.3); status control flow (Y.3); the cancel
modal (Y.4).

### Task 237 — Y.2 — Admin moderation preview: temporary listing page

**Type:** bug + feature
**Priority:** high
**Area:** admin `/admin/listings` row action "Переглянути оголошення" + public listing detail

**Pre-read:** `src/app/[locale]/listings/[slug]/page.tsx` (public detail page route); the admin
moderation row action; `docs/data-access-rules.md`; `docs/rls-rules.md`; `docs/domain-rules.md`
(listing status lifecycle); existing moderation/status helpers in `src/modules/listings/*`.
**Localization coverage:** sq, en, uk, it (any new preview-only label / banner).
**Responsive coverage:** all 7 breakpoints.

**Goal:** From `/admin/listings`, an admin or moderator viewing a listing in `moderation` status
clicks "Переглянути оголошення" and sees a 404 — the public detail page is not generated until
the listing is published. Required behaviour:

1. Provide a temporary admin-only preview at e.g. `/admin/listings/[id]/preview` that renders the
   listing the same way the public detail page would, with a clear "PREVIEW — not published" banner
   (i18n × 4). Admin + moderator role gated; RLS enforces visibility of non-published listings.
2. On publish approval, the listing becomes reachable at the canonical public URL
   (`/[locale]/listings/[slug]`) — the temporary preview is no longer needed but the admin preview
   link should keep working for as long as the row exists (so moderators can re-check after
   publish). The kickoff must spell out the exact behaviour with the owner; if ambiguous Sonnet
   stops and asks.

**Acceptance criteria:**
- "Переглянути оголошення" from `/admin/listings` never 404s for any non-deleted listing in any
  lifecycle state; admin + moderator can preview moderation/rejected/archived listings; non-staff
  cannot reach the preview URL (RLS + route guard).
- Public detail URL works only after the listing is published, as today.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** restructuring the public detail page; lifecycle state changes (covered by Y.3 +
Epic R).

### Task 238 — Y.3 — Listing edit/create side-panel pattern + status control + dirty-state Save

**Type:** feature + UX
**Priority:** critical
**Area:** cabinet listing create/edit + admin listing create/edit

**Pre-read:** Task 196 / R.2 session log (`AdminEditLayout` side-panel pattern, 2026-05-23);
`docs/ui-rules.md`; `docs/ai-behavior.md` Note 19 + Note 20; `src/modules/listings/components/
ListingFormShell.tsx`; `src/app/admin/users/[id]/page.tsx` (the user-edit reference);
`react-hook-form` `formState.isDirty`.
**Localization coverage:** sq, en, uk, it (every side-panel label + status option × 4).
**Responsive coverage:** all 7 breakpoints (the side panel folds below content on mobile).

**Goal:** Apply the Task 196 admin edit-screen side-panel pattern to the listing form, on BOTH
the cabinet path and the admin path. The right-hand side panel houses all action controls:
"Save changes", "Cancel", "Change status" (admin/moderator only), and any other action that today
sits in the main form area or — worse — is hidden entirely. "Save changes" is disabled when
`formState.isDirty === false`. "Change status" must be reachable from the side panel and persist
through the existing status-change action (no UI-only state).

**Acceptance criteria:**
- Both screens (cabinet + admin) render the side-panel pattern; the main column holds the form
  fields, the side column holds Save / Cancel / Change status / other actions.
- Admin/moderator can change the listing status from the side panel; the action calls the existing
  server action (no UI-only flips); the change persists.
- "Save changes" is disabled when the form is not dirty; enabled the moment any field changes.
- Inventory table in the session log: every control that exists today (BEFORE) + where it lives
  AFTER (Note 20 compliance — nothing dropped).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** the cancel-confirmation flow (Y.4); the underlying listing lifecycle (Epic R /
Epic I); raw-key labels (Y.1).

### Task 239 — Y.4 — Admin listing edit: Cancel confirm modal no-op fix

**Type:** bug
**Priority:** high
**Area:** admin listing edit — Cancel button + its confirmation modal

**Pre-read:** Y.3 session log (after Y.3 ships) OR the current admin listing edit page if Y.3 is
still in flight; the canonical Dialog primitive (`src/components/ui/dialog.tsx`); the
ConfirmationDialog wrapper if one exists; `docs/ai-behavior.md` Note 19 (every state of the flow
must work — cancel/dismiss included).
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** In admin listing edit, the user clicks "Скасувати"; a confirmation popup appears; the
user clicks "Скасувати" inside the popup; **nothing happens**. The cancel flow is dead. Reproduce
the bug, identify the missing handler / wrong button binding / silent error, and fix it.

**Acceptance criteria:**
- Cancel → confirm modal → confirm button correctly navigates back / closes the edit screen,
  matching the canonical confirm-cancel pattern used elsewhere in admin.
- The same fix applies anywhere this dead-confirm pattern is duplicated in admin (Global Change
  Verification Rule — grep the repo).
- Cancel via Esc / backdrop click / the modal's other dismiss control also works.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** redesigning the modal layout (Epic Z); the side-panel pattern (Y.3).

## Epic-level acceptance

No raw i18n keys on the listing form (Y.1); admin moderation preview never 404s (Y.2); the listing
form (cabinet + admin) uses the side-panel pattern with reachable status control and a
dirty-state-aware Save (Y.3); the admin Cancel-confirm flow works (Y.4). Every task carries a
before/after control inventory in the session log (Note 20) and a UX-flow trace (Note 19).
