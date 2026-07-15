# Session Archive: Task 603 — `FavoriteButton` (icon shape) mobile full-width stretch fix — 2026-07-15

Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_603_FavoriteButtonIconMobileFullWidthFix.md`

## Root cause (confirmed exactly as the kickoff's source review stated)

`FavoriteButton.tsx`'s `shape === 'icon'` branch passed `size={undefined}` to the canonical `Button`
(`@/components/ui/button.tsx`). `size={undefined}` falls back to `size="default"`, whose cva class string
carries `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`. Below 640px
those responsive utilities beat the local unprefixed `w-8 h-8` override, stretching the heart into a full-width
44px-tall pill. The `icon-*` size variants carry none of that mobile chrome.

## Fix (one line, styling-only)

`src/modules/listings/components/FavoriteButton.tsx` — the icon-shape branch now passes `size="icon-sm"` instead
of `size={undefined}`:

```diff
-      size={shape === 'pill' ? size : undefined}
+      size={shape === 'pill' ? size : 'icon-sm'}
```

The local `rounded-full w-8 h-8 p-0` override (unchanged) still wins the final width/height via tailwind-merge
(`w-8 h-8` beats `icon-sm`'s `size-7`), so the rendered diameter is byte-identical to today's desktop appearance
(~32px) at every breakpoint. The `pill` branch (`size={size}`, used only by `ListingContact.tsx` with `size="lg"`)
is untouched — confirmed byte-identical by diff and by a dedicated regression assertion (below).

## Documented exemption (owner decision, 2026-07-15, via orchestrator `AskUserQuestion`)

The icon-shape `FavoriteButton` (card overlay heart) is a **documented icon-only exemption** from BOTH:
- clause-11 mobile-full-width rule, and
- the ≥44px touch-target minimum,

at ALL breakpoints — same class of explicit owner override as the Task 557 day-cell 39px exemption. The compact
~32px circle matches the dom.ria.com reference and today's existing desktop appearance; the owner explicitly
rejected forcing this control to 44px/full-width. The `pill`-shape branch (`ListingContact`'s action-row button)
is **NOT** exempt and remains full-width `size="lg"` on mobile — confirmed unchanged.

## Positive / negative flow — preserved, unmodified

No behavior changed. This is a `size` prop change only; guest guard → `openAuthSheet`, optimistic toggle,
`useTransition`, disabled/closed handling (`disabledLabel`/`title`), pending state, server-error revert+toast,
signing-out no-op, `aria-label`/`aria-pressed`/`aria-disabled`, and the two-effect authority pattern are all
byte-unchanged. Verified by the full pre-existing `FavoriteButton.test.tsx` suite staying green (26/26, see Gates).

## Rendered matrix (clause 12) — REAL `ListingCard` + REAL `FavoriteButton`, live `next dev` server

Per the kickoff's explicit warning, Task 602's matrix captured the Storybook `MantineListingCardPattern` Default
story's own demo `ActionIcon` favorite — NOT the real `FavoriteButton`. This task's matrix instead drives the
**live dev server** (`http://localhost:3000`) directly: `/{locale}` (homepage Latest, vertical card) and
`/{locale}/listings` (Grid), both of which inject the real `FavoriteButton` via `imageSlot`.

Script: `scripts/task603-qa-favoritebutton.mjs` (new, ad hoc QA script — not part of the CI check suite). For
every cell it locates all `button[aria-pressed]` elements (the FavoriteButton's unique in-DOM signature) and
asserts: width/height ≤ 40px, width≈height (±4px, i.e. circular not stretched), and no bounding-box overlap with
the top-left badges or bottom-right photo-count overlay.

Matrix: 2 routes × 4 locales (sq/en/uk/it) × 7 widths (320/375/390/768/1280/1440/2560) = 56 cells.

```
Results: 44/56 PASS, 12 FAIL
```

**Every one of the 56 cells measured the FavoriteButton itself at exactly 32×32px, zero badge/photo-count
overlap.** The 12 "FAIL" cells are ALL on `/listings` Grid at <640px (320/375/390 × all 4 locales) and fail
solely on a **pre-existing, out-of-scope page-level horizontal-overflow bug** — traced with a DOM offender scan
(`getBoundingClientRect` vs viewport) to the FilterBar's segmented-control button (`flex-1`, right edge at
x=339 on a 320px viewport) and a `min-w-35` Combobox trigger, both unrelated to `FavoriteButton` (which sits at
x=263–333, fully inside the 320px viewport in every failing cell). This is NOT introduced by this diff (the
diff touches only `FavoriteButton.tsx`) and NOT fixed here per the kickoff's explicit scope lock
("MUST NOT touch ... ListingCard.tsx ... or any other file"). Flagging as a candidate follow-up task for the
orchestrator — not addressed in this session.

Full manifest (per-cell measurements) and PNGs persisted at `docs/sessions/2026-07-15-task603-assets/`
(`manifest.json` + `homepage_uk_{320,375,390,2560}.png` + `grid_uk_{320,375,390,2560}.png`).

### Internal-spacing / chrome visual check (owner P0) — personally reviewed

Opened `homepage_uk_320.png`, `homepage_uk_375.png`, `homepage_uk_390.png`, `grid_uk_320.png`, `grid_uk_390.png`
by eye: the heart renders as a small white/pink circle in the top-right corner of the photo, does not overlap
the "Продаж · Квартира" text below it, the photo-count badge (bottom-right, "📷 1"), or the top-left badge row
(no badges present on this fixture listing, no crowding regardless). Matches the dom.ria.com reference.

### Before/after at uk@320 (explicit, required by the gate)

Reverted the fix (`size={undefined}`), reloaded (`next dev` HMR), and re-measured the same button:

```
BEFORE (bug, size=undefined):  { w: 286, h: 44 }
AFTER  (fixed, size="icon-sm"): { w: 32,  h: 32 }
```

Screenshots: `docs/sessions/2026-07-15-task603-assets/before_bug_uk_320.png` (wide white pill spanning most of
the card width, heart centered inside it — exactly the owner's reported defect) vs
`after_fixed_uk_320.png` (compact ~32px circle, top-right corner) — visually confirmed side-by-side.
Fix restored immediately after capture; all subsequent gates below ran against the restored, fixed code.

## TailAdmin conformance (clause 16)

No new color/px/radius/shadow value introduced. The heart stays `variant="ghost"`, `rounded-full w-8 h-8 p-0`
(unchanged), `bg-card/80` resting / `bg-destructive/10 text-destructive` favorited (unchanged). Only the `size`
variant choice changed, selecting an existing cva size (`icon-sm`) already used elsewhere in the codebase for
icon-only overlay controls (`src/stories/StoryListingCard.tsx`).

## Regression coverage

Added to `src/modules/listings/components/__tests__/FavoriteButton.test.tsx`:

```tsx
it('icon shape (card overlay, default) does NOT carry the mobile full-width chrome', () => {
  renderButton({ isFavorited: false })
  expect(getButton().className).not.toMatch(/max-sm:w-full/)
  expect(getButton().className).not.toMatch(/max-sm:min-h-11/)
})

it('pill shape (ListingContact action row) still carries the mobile full-width chrome at size="lg"', () => {
  renderButton({ isFavorited: false, shape: 'pill', size: 'lg' })
  expect(getButton().className).toMatch(/max-sm:w-full/)
  expect(getButton().className).toMatch(/h-9/)
})
```

**Planted-violation transcript** (reverted `size={shape === 'pill' ? size : 'icon-sm'}` back to
`size={shape === 'pill' ? size : undefined}`):

```
FAIL  FavoriteButton > icon shape (card overlay, default) does NOT carry the mobile full-width chrome
AssertionError: expected '...max-sm:w-full max-sm:h-auto max-sm:min-h-11...rounded-full w-8 h-8 p-0...'
  not to match /max-sm:w-full/
Test Files  1 failed | Tests  1 failed | 25 passed (26)
```

Reverted → **26/26 PASS** (full suite, both test files). This is the exact class of regression the kickoff
described (the `max-sm:min-h-11` leaking through even though `w-8`/`h-8` win the width/height battle via
tailwind-merge) — confirmed reproducible and now guarded.

## Gates (all green)

```
npx tsc --noEmit                                    → 0 errors
npx eslint FavoriteButton.tsx FavoriteButton.test.tsx → 0 errors
npx vitest run FavoriteButton.test.tsx               → 26/26 PASS
npm run check:stories                                → 116 files, 0 violations
npm run check:i18n                                   → 2145 keys × 4 locales, parity PASSED
npm run check:mojibake                               → 0 artifacts in 1723 files
npm run check:file-integrity                         → 4 files clean
```

No new/changed i18n keys (reuses `common.aria_add_favorite`/`common.aria_remove_favorite`). No `git add`/
`git commit` run by Sonnet — commits are the orchestrator's to emit at review.

## AC-by-AC self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Icon branch → canonical `icon-sm` size; compact-circle override kept; pill branch byte-identical | `FavoriteButton.tsx` one-line diff above | ✅ |
| 2. Compact ~32px circle at every breakpoint, 4 locales, REAL `ListingCard` | 56-cell live-server matrix (32×32 in all 56 cells) + uk@320/375/390 personal review + before/after | ✅ |
| 3. All pre-existing behavior preserved | Full `FavoriteButton.test.tsx` suite unchanged and green (24 pre-existing + 2 new = 26) | ✅ |
| 4. `ListingContact` pill unchanged, still full-width on mobile | Diff shows `ListingContact.tsx` untouched; new regression test asserts pill still carries `max-sm:w-full` + `size="lg"`'s `h-9` | ✅ |
| 5. Regression assertion + verified planted-violation FAIL | Transcript above | ✅ |
| 6. Gates green, exemption documented, no git ops by Sonnet | Gates section above; exemption note above | ✅ |

## Files Changed

| File | Rationale |
|------|-----------|
| `src/modules/listings/components/FavoriteButton.tsx` | One-line fix: icon-shape branch passes `size="icon-sm"` instead of `size={undefined}`, so the text-size `default` chrome (`max-sm:w-full`/`max-sm:min-h-11`) can never apply. |
| `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | New regression assertions: icon shape excludes `max-sm:w-full`/`max-sm:min-h-11`; pill shape still carries them at `size="lg"`. |
| `scripts/task603-qa-favoritebutton.mjs` | New — ad hoc QA script (not wired into CI) that drives the live `next dev` server to capture the real `ListingCard`/`FavoriteButton` rendered matrix, since Storybook cannot (Task 602's blind spot). |
| `docs/sessions/2026-07-15-task603-assets/` | New — persisted PNGs + manifest.json (`.screenshots/` is gitignored). |
| `docs/sessions/2026-07-15-task603-favoritebutton-mobile-fullwidth-fix.md` | This session log. |

## Out-of-scope finding (for orchestrator follow-up consideration)

`/listings` Grid page has a **pre-existing** horizontal-overflow bug at <640px, unrelated to `FavoriteButton`:
the FilterBar's segmented-control button and a `min-w-35` Combobox trigger extend past the 320/375/390px
viewport width (`document.documentElement.scrollWidth` 452px vs 320px clientWidth at 320px). Not touched by this
task (explicitly out of scope per the kickoff's file lock). Visible as a sliver of clipped filter-bar content at
the right edge in `grid_uk_320.png`/`grid_uk_390.png`.
