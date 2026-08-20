# Task 752 — Icon sizing and small layout utilities (9 files)

**Sprint:** 60 · **Type:** UI mechanism (D28) · **QA profile:** `Q2 Standard UI` · **Status:** KICKOFF FILED

## Objective

Replace lucide-icon Tailwind sizing with the icon's own `size` prop, and small flex/gap wrappers with Mantine
`Group`/`Stack`, in nine files. **Zero visual delta (D28).**

## Exact current state — read 2026-08-16, verify before editing

| File | Line | Current |
|---|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` | 39 | `<Bell className="h-5 w-5" />` |
| `src/components/layout/HeaderActions.tsx` | 34, 44 | `<Heart className="size-5" />` (twice) |
| `src/modules/listings/components/FavoriteButton.tsx` | 134 | `<Heart className={cn('h-4 w-4', !disabled && favorited && 'fill-current')} />` |
| `src/components/shared/LocaleSwitcher.tsx` | 55 | `<Loader2 size={12} className="animate-spin" />` |
| `src/components/layout/UserMenu.tsx` | 43 | `<span className="max-w-30 truncate">{user.name}</span>` |
| `src/components/shared/FilterRoomsRow.tsx` | 16, 24 | `className="flex gap-2 flex-wrap"` · `className="shrink-0"` |
| `src/components/shared/FilterMultiToggle.tsx` | 21, 27 | `cn('flex flex-wrap gap-2', className)` · `className="justify-start text-left"` |
| `src/components/shared/FilterRangeInputs.tsx` | 22, 29, 37 | `className="flex gap-2"` · `className="flex-1 min-w-0"` (twice) |
| `src/components/shared/PhoneField.tsx` | 145, 150 | `className="flex flex-col gap-1.5"` · `className="flex flex-row gap-2"` |

## Replacement rules

1. **Icon sizing** — `h-N w-N` / `size-N` on a `lucide-react` icon → the icon's `size={px}` prop.
   Tailwind scale: `h-5 w-5` = 20px, `h-4 w-4` = 16px, `size-5` = 20px. `LocaleSwitcher:55` already passes
   `size={12}`; only `animate-spin` remains there — keep the spin (see rule 4).
2. **`fill-current`** (`FavoriteButton:134`) is **not** sizing — it is a fill state. Preserve its conditional
   behaviour exactly; migrate only the `h-4 w-4` part.
3. **Flex/gap wrappers** — `flex gap-N` → `<Group gap=…>`; `flex flex-col gap-N` → `<Stack gap=…>`;
   `flex-wrap` → `wrap="wrap"`; `shrink-0` → `style={{ flexShrink: 0 }}` or Mantine's own prop where one
   exists. **Map the Tailwind value to the same rendered px**, not to the nearest Mantine token name:
   `gap-2` = 8px, `gap-1.5` = 6px, `gap-3` = 12px. If a Mantine token does not equal the current px, pass the
   number.
4. **Do not migrate** `animate-spin` (`LocaleSwitcher:55`) — no Mantine equivalent is in scope here; leave it
   and say so in the report. Same for `truncate`/`max-w-30` on `UserMenu:43` **if** `Text truncate` +
   `maw={120}` does not render byte-identically — measure, do not assume. `max-w-30` = 120px.
5. `flex-1 min-w-0` (`FilterRangeInputs:29,37`) → `style={{ flex: 1, minWidth: 0 }}` is acceptable;
   `minWidth: 0` is an explicitly exempt helper under the migration tracker's DoD §5.

## Preserve exactly

- `FilterRoomsRow:16` and `FilterMultiToggle:21` carry conditional `role="group"` + `aria-label`. **Both must
  survive on the same element.** Task 730 (Sprint 55) is open on chip-row selected-state announcement — do not
  change any ARIA here, in either direction.
- `FilterMultiToggle:21` merges an incoming `className` prop via `cn(...)`. The prop must still reach the root.
- `PhoneField` phone logic is untouched; `phone.test.ts` must stay at its current pass count.

## Out of scope

Any other file · any restyle · any token change · ARIA changes · `AppImage`, `ListingFeatureIcon`.

## Acceptance criteria

- **AC1** — every row in the table above is either migrated or listed in the report as deliberately kept, with the reason.
- **AC2** — rendered evidence shows **zero visual delta** at 320 / 390 / 768 / 1024 / 1440, `uk@320` mandatory, for every affected surface (header, filters, phone field, notification bell, favourite button).
- **AC3** — `role="group"` and `aria-label` still present on `FilterRoomsRow` and `FilterMultiToggle` roots; `className` prop still reaches `FilterMultiToggle`'s root.
- **AC4** — `npm run typecheck`, `npm run check:design-tokens`, `npm run check:i18n`, and `npm run build` all exit 0.
- **AC5** — no file outside the nine listed appears in `git status --porcelain`.

## Verification plan

`npm run typecheck` → `npm run check:design-tokens` → `npm run check:i18n` → rendered matrix per AC2 →
`npx vitest run src/modules/listings/**/phone.test.ts` (or the phone test's real path — locate it, do not
guess) → `npm run build` (exit 0 mandatory, non-Q0).

## Report contract

Changed files with line numbers; every utility migrated with its px mapping; every utility **kept** with the
reason; commands run with actual output; rendered evidence locations; any place where the Mantine equivalent
did **not** render identically and what you did about it.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
