# Sprint 31 — Task 355 kickoff (Sonnet) — Listing status lifecycle: allow owner/admin/moderator to correct Sold/Rented

> **Status: READY (priority: HIGH — runs after the design-system task 354 per owner ordering).**
> Related: Epic I — Listing Lifecycle and Status Rules (`tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md`).
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture outside the requested scope. Do NOT remove existing listing actions.
> Do NOT silently change listing visibility rules. Preserve existing behavior unless this task explicitly
> changes it. If anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator**.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End your session with
> a "Files Changed" table only; the ORCHESTRATOR (Opus) reads the real diff and emits commit commands during
> review. (agent-contract clause 10.)

```
Type:     bugfix
Priority: high
Area:     listings / owner cabinet / admin listings / moderation / status lifecycle
```

## Role contract

You are Sonnet acting as the lero-al code executor. Opus is the orchestrator/reviewer. Do not invent
architecture outside the requested scope. Do not remove existing listing actions. Do not silently change
listing visibility rules. Preserve existing behavior unless this task explicitly changes it. Do not run git.

## Required pre-read (per `docs/rule-index.md`: "Admin table / admin control" + "DB / server action / RLS" + "Profile / edit-flow")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/design-system.md` (§9 admin layout, §10 `tableAt`), `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/component-governance.md`, `docs/domain-rules.md`, `docs/rls-rules.md`, `docs/data-access-rules.md`,
`docs/qa-rules.md`, `docs/ai-behavior.md` → Note 22 "Admin Table Preservation Rule" + Note 23 "Edit-Flow Preservation
Rule".
**Only if relevant:** `docs/admin-ux-rules.md`, `docs/state-authority.md`, `package.json`.
**Then inspect:** relevant listing status / server-action / domain files · owner-cabinet listing table/card/bottom-
sheet files · admin listings table / status-action files · moderation / role / permission helpers. (Discover exact
paths with `rg` — see investigation below.)

## Problem

When an owner sets a listing status to "Орендовано" / "Продано" (Rented / Sold), the status becomes effectively
locked. Owner cannot correct it afterward; admin/moderator also cannot correct it; the mobile bottom-sheet action
menu is incomplete and does not allow returning a listing from sold/rented to an editable/published state. This
makes accidental status changes dangerous and creates a moderation/admin dead end.

## Required investigation (inventory before editing)

All listing status enum values · where status is displayed · where status is changed · owner-facing status actions
· admin/moderator-facing status actions · server actions/mutations that update status · permission checks for
owner/admin/moderator · public visibility rules for active/sold/rented/archived/pending · redirects after status
changes · toast/success/error messages · mobile bottom-sheet action behavior.

Suggested searches:
- `rg -n "sold|rented|Продано|Орендовано|status|listing_status|enum" src/modules/listings src/components src/app -g "*.ts" -g "*.tsx"`
- `rg -n "updateStatus|setStatus|changeStatus|server action|use server" src/modules/listings src/app -g "*.ts" -g "*.tsx"`
- `rg -n "bottom-sheet|bottomsheet|Sheet|action menu|isOwner|isAdmin|isModerator|role" src/components src/modules -g "*.tsx"`

## Goal

A single consistent status-correction flow letting BOTH the listing owner AND admin/moderator change a listing's
status after it was marked sold or rented — back to active or another allowed lifecycle status — on
desktop and mobile.

## Status lifecycle rules to PRESERVE

Do not make pending/moderation listings publicly visible unless already allowed elsewhere · do not allow random
users to change status · do not allow an owner to change someone else's listing · do not bypass existing
admin/moderator permission checks · do not remove archive/delete/edit/view/premium actions · do not break the
post-save redirect logic fixed for pending listings (Task 334) · do not create a new public-detail visibility
regression.

## Canonical status enum + transition engine (MANDATORY — verified by orchestrator audit)

The single source of truth is `src/modules/listings/domain/listingTransitionEngine.ts`. The canonical `ListingStatus`
type (`@/types/database`) is exactly: **`pending | active | inactive | sold | rented | archived`**. There is **no
`published`** value — the live market status is **`active`**. **Do NOT invent `published`/`active` aliases or write
status strings ad-hoc anywhere else.**

Currently `ALLOWED_LISTING_TRANSITIONS` defines `sold → ['ARCHIVE']` and `rented → ['ARCHIVE']` only — i.e. the
"locked" behavior is by-design in the canonical matrix, so the correction requires a **canonical** new transition
(e.g. a `REOPEN` action: `sold | rented → active`) added in `listingTransitionEngine.ts` (matrix +
`ACTION_NEXT_STATUS`), and then consumed by owner UI, admin/moderator UI, and the server action via the existing
`resolveTransition` / `canTransitionListing` / `assertCanTransitionListing` helpers. Do NOT bypass the engine with a
direct `db.update({ status: ... })`. **If the owner prefers the correction target to be `inactive` (or a different
canonical status) rather than `active`, STOP & ASK before implementing** — do not guess.

## Required implementation

**Owner:** can change own listing from sold/rented back to active if otherwise valid; keeps existing
archive/edit/view/delete/premium actions; UI clearly shows available status actions for sold/rented listings; on
mobile the bottom-sheet action popup includes the status-correction option and remains usable at narrow widths.

**Admin/moderator:** can change status from sold/rented to active or another allowed lifecycle status from
admin listing management UI; uses the same canonical lifecycle helper/server action where possible; UI must not
depend on owner-only permissions.

**Server-side:** add/update validation so status updates are authorized by owner OR admin OR moderator (if
moderators currently have listing-moderation permission); return localized success/error states; reject
unauthorized changes; keep validation deterministic and covered by existing role helpers.

**UI/control preservation rule:** any existing control must remain, move to a specified new place, or be explicitly
listed as removed. Silent removal is forbidden.

**Mobile action sheet rule:** below 1024px, listing row/card actions stay clickable; the sticky bottom-sheet/popup
opens from the bottom, stays above page content, and exposes all relevant actions without clipping; buttons inside
wrap/stack safely with no horizontal overflow.

## Localization coverage

Locales **sq / en / uk / it**. Any user-facing text change → add/update translations in all four files. No English
fallback in non-English locales. Long labels wrap instead of truncating. Use Ukrainian as the stress locale, but
verify all locales remain usable.

## Responsive coverage

Verify 320 · 375 · 390 · 768 · 1280 · 1440 · 2560.

## Positive flow (happy path) — required (Task 255 rule)

**Owner correcting own listing.** Actor: authenticated owner. Preconditions: owns a listing currently in `sold` (or
`rented`). 1. Owner opens own listing in the cabinet (desktop row/card, or mobile bottom-sheet). 2. The available
status actions clearly include a "return to active" correction. 3. Owner selects it → server action
authorizes (owner-of-listing), updates status, returns a localized success state. 4. UI reflects the new status
(toast if the existing UX uses toasts); the listing returns to its normal editable/published visibility per existing
rules. Post-conditions: status row persisted; listing visible per existing active rules; archive/edit/
view/delete/premium actions still present; refreshed page shows corrected status.

**Admin/moderator correcting any eligible listing.** Actor: admin (or moderator if moderators have listing-moderation
permission). 1. Admin opens the admin listings UI. 2. Status control for a sold/rented listing exposes the correction
to active or another allowed lifecycle status. 3. Admin selects it → same canonical lifecycle helper/server
action authorizes (admin/moderator role), updates status, returns localized success. 4. Admin UI reflects the change
without depending on owner-only permissions. Post-conditions: as above; admin can correct owner mistakes.

**Mobile (≤1024px).** Bottom-sheet/popup opens from the bottom, stays above page content, exposes the status-
correction option plus existing actions without clipping; buttons wrap/stack; usable at 320/375/390.

## Negative flow (every off-happy-path branch) — required (Task 255 rule)

- **Unauthenticated / random user** attempts a status change → server action rejects (no DB write); localized
  permission-denied/auth message; UI exposes no status-correction control to them.
- **Owner attempts to change ANOTHER user's listing** → server action rejects ownership check; no DB write; localized
  error; no control shown on listings they don't own.
- **Moderator when project permissions do NOT grant listing moderation** → control hidden + server action rejects.
- **Server/validation error (500 / invalid transition)** → no status change persisted; localized error toast/message;
  user remains on the same surface and can retry; no partial write.
- **Pending / on-moderation listing** → correction must NOT make it publicly visible unless already allowed elsewhere;
  no new public-detail visibility regression; pending post-save redirect (Task 334) unaffected.
- **Cancel / dismiss (Esc, backdrop, Cancel)** on the action sheet/dialog → no status change; sheet closes to a valid
  state; no stuck overlay.
- **Double-submit / re-entry** → guarded; status changes at most once; no duplicate writes.
- **Long localized labels (uk stress)** → wrap; no horizontal overflow; no clipped/hidden action in the sheet.
- **Existing actions** (archive/edit/view/delete/premium) → none silently removed; before/after control inventory in
  the session log; any moved control documents its new entry point.
- **Scope-escape** → if a fix appears to need public-visibility rule changes beyond this bug, or ownership-rule
  changes, or analytics/email → STOP & ASK.

## Acceptance criteria (literal — each maps to Positive or Negative flow above)

- Owner can change own listing from sold → active. *(Positive: owner flow)*
- Owner can change own listing from rented → active.
- Admin can change any eligible listing from sold → active.
- Admin can change any eligible listing from rented → active.
- Moderator can change eligible listing status if current project permissions allow moderators to manage status.
- Unauthorized users cannot change listing status.
- Owner cannot change another user's listing status.
- Existing archive / edit / delete / view / premium actions still work (premium where currently allowed).
- Mobile bottom-sheet actions remain clickable at 320/375/390; status-correction action is visible/reachable there.
- Long localized labels wrap safely and do not break layout.
- No public-visibility regression for pending/moderation listings; no regression to pending-listing post-save redirects.
- No new TypeScript errors; no new lint errors; no new governance violations.
- `docs/backlog.md` updated; a session log added under `docs/sessions/`.

## Out of scope

Redesign the entire listing lifecycle · create a new global mobile design system · redesign all admin tables ·
change pricing/premium logic · change listing ownership rules · change public visibility rules except where strictly
required for this status-correction bug · add analytics · add email notifications · rewrite unrelated listing actions.

## Required validation (run or document why impossible)

`npm run typecheck` · `npm run build` · `npm run lint` · **`npm run check:i18n` (REQUIRED if any translation/locale
file changed — must pass with key parity across sq/en/uk/it)** · governance checks required by `docs/rule-index.md` · manual
QA for owner status correction · manual QA for admin status correction · manual QA for mobile bottom-sheet at
320/375/390 · manual QA for all locales sq/en/uk/it · manual QA for breakpoints 320/375/390/768/1280/1440/2560.

## Final report required (no git commands from you)

Files changed · root cause · lifecycle rules found · permissions implemented · owner-flow result · admin/moderator-flow
result · mobile bottom-sheet QA result · locale QA result (sq/en/uk/it) · breakpoint QA result · validation commands
and results · docs updated · Files Changed table (Path / Change / Rationale). The ORCHESTRATOR emits the git commands.
