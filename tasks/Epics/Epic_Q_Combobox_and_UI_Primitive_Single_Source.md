# Epic Q — Combobox & UI Primitive Single-Source

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator.
**Source notes:** issues.txt #1 (do we need separate comboboxes, or one canonical Combobox + ComboboxOption?), #12 (mobile keyboard pops up on a non-typeable combobox), #6 (header icon buttons look inconsistent — need a button single source), #22 (Listings tabs have a stray border / look off), #23 (card/list view toggle has clipped corners instead of smooth active rounding).
**Kickoffs:** `Epic_Q_kickoff_prompts.md` (Tasks 190–194).
**Governance already codified:** docs/ui-rules.md **§0** (Combobox + Button single-source) was added 2026-05-22.

## Goal

One canonical `Combobox` (no parallel implementations), no keyboard on non-typeable comboboxes, one
visual source-of-truth per button type, and clean canonical Tabs / view-toggle UI.

## Dependencies

- `src/components/shared/Combobox.tsx` (canonical primitive — `variant: 'input' | 'button'`,
  `ComboboxOption`), the domain wrappers (`LocationCombobox`, `YearCombobox`, `PropertyTypeCombobox`),
  `src/components/ui/button.tsx`, `src/components/ui/tabs.tsx`, `src/components/layout/Header.tsx`,
  `src/components/layout/MobileBottomNav.tsx`, `src/modules/notifications/components/NotificationBell.tsx`.

## Tasks

### Task 190 — Q.1 — Combobox consolidation: one canonical Combobox + ComboboxOption (Note 1)

**Type:** refactor / governance
**Priority:** high
**Area:** all selection dropdowns

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Selection Components Policy; Global Change Verification Rule)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/ui-rules.md **§0**, docs/component-governance.md
4. `src/components/shared/Combobox.tsx` + every `*Combobox*` wrapper and any local `Select`-based dropdown

**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Confirm/enforce that there is exactly ONE canonical `Combobox` and that all domain selectors
are thin wrappers delegating popover/list/keyboard/a11y to it. Fold any parallel implementation back
into the canonical component. (Answer to Note 1: yes — one `Combobox` + `ComboboxOption`; wrappers are
data adapters only.)

**Acceptance criteria:**
- Every dropdown resolves to the canonical `Combobox`; no parallel popover-list/Select domain dropdown
  remains (grep proves it).
- Domain wrappers contain no duplicated dropdown internals.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the keyboard-suppression fix (Q.2) beyond confirming `variant="button"` is available.

### Task 191 — Q.2 — Suppress mobile keyboard on non-typeable comboboxes (Note 12)

**Type:** bug / UX
**Priority:** medium
**Area:** homepage "Всі типи" type combobox + any non-searchable combobox

**Pre-read:** Q.1; `src/components/shared/Combobox.tsx` (`variant="button"` = click-to-open, no typing);
homepage filter (`src/components/shared/useHomepageFilters.ts`, `FiltersPanel.tsx`); docs/ui-rules.md §0.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints (verify on real mobile 320–390).

**Goal:** Opening a non-typeable combobox (e.g. "All types" on the homepage) must NOT raise the mobile
keyboard. Use the canonical `variant="button"` mode for short, non-searchable lists; if `variant="button"`
still focuses a typeable element on mobile, fix it inside the canonical Combobox so every consumer benefits.

**Acceptance criteria:**
- Opening a non-typeable combobox on mobile does not show the keyboard.
- Fix applied in the canonical Combobox (or by switching consumers to `variant="button"`), not per-page hacks.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** searchable comboboxes that legitimately accept typing.

### Task 192 — Q.3 — Button single-source-of-truth for header icon buttons (Note 6)

**Type:** UX / refactor
**Priority:** medium
**Area:** header icon-action buttons (Notifications, Favorites)

**Pre-read:** docs/ui-rules.md **§0** + §3 (Button governance); `src/components/layout/Header.tsx`,
`src/modules/notifications/components/NotificationBell.tsx`; docs/component-governance.md.
**Localization coverage:** sq, en, uk, it (aria-labels).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Make all header icon-action buttons visually identical (same shape/size/radius/hover/active) by
rendering them through one shared canonical icon-button config. Fix the inconsistency where Notifications
looks polished/round and Favorites looks different.

**Acceptance criteria:**
- Notifications and Favorites (and any sibling header icon buttons) are visually identical via one shared
  source; no per-button ad-hoc styling.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** non-header buttons; behavioural changes to notifications/favorites.

### Task 193 — Q.4 — Listings page tabs: remove stray border / use canonical Tabs (Note 22)

**Type:** bug / UI
**Priority:** low
**Area:** Listings page tabs

**Pre-read:** `src/components/ui/tabs.tsx` (canonical), the Listings page tabs usage; docs/ui-rules.md.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** The tabs on the Listings page have a stray border and don't fit the design. Render them through
canonical shadcn `Tabs`/`TabsList`/`TabsTrigger` and remove the rogue border.

**Acceptance criteria:**
- Tabs use the canonical Tabs primitive; the stray border is gone; design-consistent at all breakpoints.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the view toggle (Q.5).

### Task 194 — Q.5 — Card/list view toggle: smooth active-state rounding (Note 23)

**Type:** bug / UI
**Priority:** low
**Area:** Listings card/list view toggle

**Pre-read:** the view-toggle component on the Listings page; docs/ui-rules.md (radius/button tokens).
**Localization coverage:** sq, en, uk, it (aria-labels).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Fix the card/list toggle whose active state looks clipped at the corners; it should have smooth
rounding consistent with the design tokens.

**Acceptance criteria:**
- Active state of the toggle has smooth, token-consistent rounding (no clipped corners).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the tabs (Q.4).

## Epic-level acceptance

One canonical Combobox with thin wrappers; no keyboard on non-typeable comboboxes; one visual source per
button type; canonical Tabs and a clean view toggle.
