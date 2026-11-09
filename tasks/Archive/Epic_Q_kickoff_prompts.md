# Epic Q — kickoff prompts (Combobox & UI Primitive Single-Source)

> Tasks 190–194. Shared hard contract: no scope change; no invented architecture (stop & ask if
> ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors;
> governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560; Global Change
> Verification Rule; commit + single `git add -A` then `git log -1` (owner runs git/SQL).
> Governance already codified in docs/ui-rules.md **§0**.

## Task 190 — Q.1 — Combobox consolidation: one canonical Combobox + ComboboxOption (Note 1)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Selection Components Policy (docs/ai-behavior.md): Combobox is canonical; no
Select-based domain dropdowns; no parallel combobox.

Pre-read: src/components/shared/Combobox.tsx (canonical — variant 'input'|'button', ComboboxOption);
the domain wrappers LocationCombobox/YearCombobox/PropertyTypeCombobox; grep for any local Select-based
domain dropdown or second popover-list; docs/ui-rules.md §0; docs/component-governance.md.

Scope: confirm/enforce exactly ONE canonical Combobox; make all domain selectors thin wrappers that only
supply options/data and delegate popover/list/filter/keyboard/a11y to it. Fold any parallel implementation
back in. (Answer to Note 1: one Combobox + ComboboxOption; wrappers are data adapters.)

Acceptance criteria:
- Every dropdown resolves to the canonical Combobox; no parallel popover-list/Select domain dropdown
  remains (grep proves it); wrappers contain no duplicated internals.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: keyboard suppression (191) beyond confirming variant="button" exists.
```

## Task 191 — Q.2 — Suppress mobile keyboard on non-typeable comboboxes (Note 12)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Fix in the canonical Combobox (or by switching consumers to variant="button"),
NOT per-page hacks.

Pre-read: src/components/shared/Combobox.tsx (variant="button" = click-to-open, no typing); the homepage
"All types" type combobox (src/components/shared/useHomepageFilters.ts, FiltersPanel.tsx); docs/ui-rules.md §0.

Scope: opening a non-typeable combobox (e.g. homepage "Всі типи") must NOT raise the mobile keyboard. Use
variant="button" for short non-searchable lists; if variant="button" still focuses a typeable element on
mobile, fix it inside the canonical Combobox so all consumers benefit.

Acceptance criteria:
- Non-typeable combobox does not show the mobile keyboard (verify 320–390); fix is canonical, not per-page.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: searchable comboboxes that legitimately accept typing.
```

## Task 192 — Q.3 — Button single-source-of-truth for header icon buttons (Note 6)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). docs/ui-rules.md §0 (Button single source) + §3 (Button governance).

Pre-read: src/components/layout/Header.tsx; src/modules/notifications/components/NotificationBell.tsx;
docs/component-governance.md.

Scope: render all header icon-action buttons (Notifications, Favorites, siblings) through ONE shared
canonical icon-button config so they're visually identical (shape/size/radius/hover/active). Remove the
ad-hoc styling that makes Favorites differ from the round Notifications button.

Acceptance criteria:
- Header icon buttons are visually identical via one shared source; no per-button ad-hoc styling.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: non-header buttons; notifications/favorites behaviour.
```

## Task 193 — Q.4 — Listings tabs: remove stray border / use canonical Tabs (Note 22)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Use canonical shadcn Tabs (docs/ai-behavior.md: no local tab clones).

Pre-read: src/components/ui/tabs.tsx; the Listings page tabs usage; docs/ui-rules.md.

Scope: render the Listings page tabs through canonical Tabs/TabsList/TabsTrigger and remove the rogue
border that doesn't fit the design.

Acceptance criteria:
- Tabs use canonical Tabs; stray border gone; design-consistent at all breakpoints.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: the view toggle (194).
```

## Task 194 — Q.5 — Card/list view toggle: smooth active-state rounding (Note 23)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top).

Pre-read: the card/list view-toggle component on the Listings page; docs/ui-rules.md (radius/button tokens).

Scope: fix the toggle whose active state looks clipped at the corners; it must have smooth, token-consistent
rounding.

Acceptance criteria:
- Active toggle state has smooth token-consistent rounding (no clipped corners).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: the tabs (193).
```
