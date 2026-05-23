# Task 211 — ListingContact action row: overflow + FavoriteButton composition

**Date:** 2026-05-23  
**Sprint:** 9 follow-up  
**Type:** UI fix / composition

## Root causes

**Overflow:** `<div className="flex gap-2">` on the desktop sidebar action row had no `flex-wrap`.
The canonical `Button` base includes `shrink-0`, so `flex-1` children can grow but NOT shrink.
Ukrainian label "Зберегти в колекцію" (Save to collection) is too wide at normal card widths →
the row spills past the card's `p-5` border.

**FavoriteButton composition:** `FavoriteButton` baked `rounded-full w-8 h-8 p-0` unconditionally
in its `cn()` base. This makes it a small round icon button regardless of what the caller passes.
While `tailwind-merge` does resolve class conflicts (later wins), the baked `p-0` and the
structural conflict creates a fragile override dependency. The canonical fix: express shape via a
prop so callers don't need to know what to override.

## Changes

| File | Change |
|---|---|
| `src/modules/listings/components/FavoriteButton.tsx` | Added `shape?: 'icon' \| 'pill'` prop (default `'icon'`). When `shape === 'icon'`, applies `rounded-full w-8 h-8 p-0` (existing behavior). When `shape === 'pill'`, no shape base — Button's default size provides proper padding and height via caller's className. |
| `src/modules/listings/components/ListingContact.tsx` | Action row `flex gap-2` → `flex flex-wrap gap-2`. FavoriteButton: added `shape="pill"`, removed redundant `w-auto` from className. |

## Consumer audit (FavoriteButton)

| Consumer | className passed | shape used | Verdict |
|---|---|---|---|
| `ListingCard.tsx:173` (horizontal) | `"shrink-0 -mt-0.5 -mr-1"` | default `'icon'` | ✅ unchanged |
| `ListingCard.tsx:294` (vertical overlay) | `"absolute top-2 right-2 shadow-sm"` | default `'icon'` | ✅ unchanged |
| `ListingContact.tsx:201` | `"flex-1 h-9 rounded-xl border border-border"` | `'pill'` | ✅ updated |

Mobile bar in ListingContact has no FavoriteButton and no long i18n labels — no change needed.

## Pre-existing test note

`FavoriteButton.test.tsx` had 4/9 failing tests before this task (confirmed via `git stash`).
Root cause: tests click the button but don't mock `useAuth` — the `if (!user) return` guard
blocks all transitions. These failures are out of scope for Task 211.

## Verification

```
$ npx tsc --noEmit
(exit 0 — 0 errors)

$ npx eslint src/modules/listings/components/FavoriteButton.tsx src/modules/listings/components/ListingContact.tsx
(exit 0 — 0 errors)
```

## Acceptance criteria

- [x] Action row wraps gracefully instead of overflowing (`flex-wrap`) at all widths including uk
- [x] FavoriteButton composes via `shape` prop — no baked override of round shape when pill is needed
- [x] All card/overlay consumers of FavoriteButton audited — no change, default `shape='icon'` preserves existing behavior
- [x] 0 new tsc errors; 0 lint errors
- [x] Pre-existing test failures unchanged (4/9 were failing before, 4/9 after)
