# Session Archive: Task 653 — FavoriteButton legacy shadcn → Mantine migration — 2026-07-21

## Task path and status

`tasks/kickoff_prompt_Task_653_FavoriteButton_Mantine_Migration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

`src/modules/listings/components/FavoriteButton.tsx` (kickoff named `src/components/shared/` — the
real path is `src/modules/listings/components/`, corrected; grep-verified single file) now renders
Mantine `ActionIcon` (icon shape, card overlays) / `Button` (pill shape, `ListingContact.tsx` action
row) instead of the shadcn `Button`. The entire state machine (optimistic toggle, error rollback,
`isPendingRef` external-prop guard, guest→`openAuthSheet`, `signing_out` no-op) and every a11y
attribute are byte-identical — only the rendered element and its styling mechanism changed. A new
`FavoriteButton.module.css` carries the three-state colors (default/favorited/disabled) + the two
`:hover` transitions, since (as verified empirically this session) an inline `style` — while it
reliably beats Mantine's own unlayered CSS at rest — also unconditionally blocks any `:hover` rule
from ever applying. `shadcn`'s `@/components/ui/button` import is gone.

**Two verified deviations, both flagged for orchestrator confirmation (same category as prior
Paper→Box / R8-radius corrections in this Epic):**
1. **R2 pill height** — `theme.ts`'s project-wide Button `styles.root` sets `minHeight: '2.75rem'`
   (44px) + `height: 'auto'` **unconditionally** on every Button (a P0 touch-target rule, not
   mobile-scoped). The migrated pill therefore renders at 44px on all breakpoints, not the legacy
   `SaveToCollectionButton` sibling's fixed 36px (`h-9`) on desktop. Not overridden — doing so would
   violate the P0 rule. Radius (18px) and border (`var(--border)`) DO match the sibling exactly.
2. **Kickoff's `screenshots:assert --mantine-only` premise** — the kickoff stated the
   `ListingCardPattern` story renders "the real `FavoriteButton`"; source inspection
   (`src/stories/patterns/mantine/ListingCardPattern.stories.tsx:38-58`) shows it actually renders a
   hand-built `DemoFavoriteButton` stand-in (old Tailwind classes, not this component). The gate still
   ran and passed (0 flags), but it doesn't verify this migration — real evidence came from a
   temporary, deleted-before-completion dev route rendering the actual component under the real
   `MantineRootProvider`, plus `ListingCard.smoke.test.tsx` (which DOES mount the real component).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Icon = `ActionIcon`, round 32px, no mobile-full-width chrome; shadcn `Button` gone from the icon path | `git diff`; real-browser computed style (4 locales): `width:32px, height:32px, borderRadius:9999px`; `FavoriteButton.test.tsx` icon-chrome test (no Tailwind classes + no forced `width`) |
| R2/AC2 | Pill = `Button` matching `size="lg"` (height/radius/border), aligned with `SaveToCollectionButton` | Radius (18px) + border (`var(--border)`) confirmed exact via real-browser computed style AND jsdom inline-style inspection. **Height deviates (44px vs 36px) — verified P0 touch-target conflict, see Summary** |
| R3/AC1 | Three states + pending match traced tokens via Mantine mechanism, not Tailwind; favorited = `brand.9`/`#8E322B` | Real-browser computed style, all 3 states + both hover transitions — see Computed-style section. `brand[9]` confirmed `#8E322B` in `theme.ts` (not the `red` tuple) |
| R4/AC3 | Optimistic/rollback/`onToggled`/`isPendingRef`/guest-guard/`signing_out` — unchanged | `git diff` — zero logic change; `FavoriteButton.test.tsx` 14/14 green (all these cases) |
| R5/AC3 | `aria-pressed`/`aria-label`/`aria-disabled`/`title`, real `<button>` — identical semantics | `git diff` — identical expressions; both suites assert via `getByRole('button')`/`aria-*` |
| R6/AC4 | Critical flow: `ListingCard.smoke.test.tsx` green + `screenshots:assert --mantine-only` passes | 13/13 green; planted-violation (`disabled: false`) genuinely FAILed 2/2 disabled-listing tests, reverted → 13/13. `screenshots:assert --mantine-only` exit 0 (see the story-stand-in caveat in Summary) |
| R7/AC5 | No change to `ListingCard.tsx`/`ListingContact.tsx`/`MantineListingCardPattern.tsx`/`SaveToCollectionButton.tsx`/server actions/`theme.ts`/i18n | `git diff --stat` — empty for all of these (confirmed below) |
| R8/AC5 | typecheck/check:stories/check:i18n/check:mojibake + both vitest suites + `npm run build` all exit 0 | All green — see Validation evidence |

## Current versus required behavior

**Current (before):** favorite heart = shadcn ghost `Button` (`icon-sm`/pill) styled with Tailwind
three-state classes (`bg-destructive/10 text-destructive hover:bg-destructive/20` etc.).

**Required after (implemented):** identical behavior/a11y; heart = Mantine `ActionIcon` (icon) /
`Button` (pill); the three states rendered via a CSS module keyed off `data-favorited`/
`data-fav-disabled`/`data-pending`, matched by computed style; `shadcn` `Button` no longer imported;
Homepage render tree is now 100% Mantine (the last legacy-styled control on the page).

## Positive and negative flows

| Branch | Applicable? | Evidence |
|---|---:|---|
| Icon heart renders on card (Grid + List) | Yes | Real-browser homepage capture, 4 locales, uk@320/en@390/sq@1024/it@1440 |
| Toggle favorite (auth user) | Yes (regression) | `FavoriteButton.test.tsx` — optimistic flip, server reconcile, `onToggled` |
| Server error on toggle | Yes | test — rollback + `toast.error` |
| External prop change mid-transition | Yes | test — `isPendingRef` guard holds optimistic state |
| Guest click | Yes | test — `openAuthSheet('login')`, no toggle |
| `signing_out`/`refreshing` guest states | Yes | test — signing_out no-op; refreshing opens sheet |
| Disabled (listing closed) | Yes | test + real-browser capture: muted bg, `aria-disabled`, `title`, `cursor:not-allowed` |
| Pill in `ListingContact` action row | Yes (deviation) | Real-browser capture — radius/border match; height does not (documented) |
| Hover (default→brand text, favorited→deeper tint) | Yes | Real-browser hover verification (see below) — genuinely fails without the CSS-module fix, genuinely passes with it |
| a11y (`aria-pressed`/label/role button) | Yes | test |
| Critical flow: card pattern still renders favorite | Yes (regression) | `ListingCard.smoke.test.tsx` + planted-violation |
| Production build | Yes | `npm run build` exit 0 |
| i18n key change | No | reused `common.aria_add_favorite`/`aria_remove_favorite`/`favorite_error` | `check:i18n` unchanged |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/FavoriteButton.tsx` | shadcn `Button` → Mantine `ActionIcon`/`Button`; state machine/a11y untouched; three-state colors moved to the new CSS module via `data-*` attributes |
| `src/modules/listings/components/FavoriteButton.module.css` | **New.** Three-state colors + two `:hover` transitions, unlayered, competes with Mantine's own unlayered CSS via attribute-selector specificity |
| `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | Added `MantineProvider`+`matchMedia` stub (required — `ActionIcon`/`Button` throw without a provider); the 4 bare `rerender(<FavoriteButton .../>)` calls re-wrapped in `MantineProvider`; the 2 Task-603 Tailwind-class assertions (`max-sm:w-full`/`h-9`, now permanently absent post-migration) replaced with assertions on the real geometry Mantine renders (`--ai-size`, `--button-radius`, `border`) |
| `docs/backlog.md` | Concise active-state update — Task 653 → awaiting review, Homepage 100% Mantine |
| `docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md` | This session log |

**Auto-touched, not edited by hand:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — regenerated as a side-effect of running `npm run screenshots:assert -- --mantine-only` (required by R6); scope grew 298→302 stories / 952→1016 cells (unrelated stories added to Storybook since the report's last run), ambiguous count 27→43, all new ambiguous entries are pre-existing/unrelated (`PopularLocationsView` intentional-ellipsis flags — confirmed via `grep`, zero mention of `ListingCard`/`FavoriteButton` anywhere in the run output).

**Confirmed NOT touched** (`git diff --stat` empty): `ListingCard.tsx`, `ListingContact.tsx`,
`MantineListingCardPattern.tsx`, `SaveToCollectionButton.tsx`, `favoriteActions.ts`, `theme.ts`,
`messages/*.json`.

## Before/after

**Before:**
```tsx
import { Button } from '@/components/ui/button'
...
<Button
  type="button" variant="ghost" size={shape === 'pill' ? size : 'icon-sm'}
  className={cn(
    shape === 'icon' && 'rounded-full w-8 h-8 p-0',
    disabled ? 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-50'
      : favorited ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
      : 'bg-card/80 text-foreground hover:bg-card hover:text-destructive',
    !disabled && isPending && 'opacity-60 cursor-wait',
    className,
  )}
  onClick={handleClick} disabled={disabled || isPending}
  aria-label={...} aria-pressed={...} aria-disabled={...} title={...}
>
  <Heart className={cn('h-4 w-4', !disabled && favorited && 'fill-current')} />
</Button>
```

**After (icon shape):**
```tsx
<ActionIcon {...commonProps} variant="subtle" size={32} radius="pill">
  {icon}
</ActionIcon>
```

**After (pill shape):**
```tsx
<Button {...commonProps} variant="default" size={PILL_SIZE_MAP[size ?? 'default']}
        radius="1.125rem" bd="1px solid var(--border)">
  {icon}
</Button>
```
Where `commonProps` carries `type`/`onClick`/`disabled`/`aria-*`/`title`/`data-favorited`/
`data-fav-disabled`/`data-pending`/`className={cn(styles.control, className)}` — identical for both
shapes. Full diff in `git diff -- src/modules/listings/components/FavoriteButton.tsx`.

## Computed-style confirmation (three states + hover — no unlayered-CSS override)

**Default state, real browser, 4 locales (uk@320/en@390/sq@1024/it@1440), Homepage:**
`backgroundColor: rgba(255, 255, 255, 0.8)` (= `--card` #FFFFFF @ 80%), `color: rgb(35, 35, 35)`
(= `--foreground` #232323 exact), `borderRadius: 9999px`, `width`/`height: 32px` — identical across
all 4 locales; `aria-label` correctly localized per locale.

**All 3 states + hover, real browser, via a temporary dev-only route** (`src/app/[locale]/dev653qatest/`,
rendered under the real `MantineRootProvider`/`theme`, deleted before this report — needed because
favorited/disabled states aren't reachable anonymously on the live site: favoriting requires auth,
and no sold/closed listing exists in the seed data reachable via the public API):

| State | `background-color` | `color` | Expected token |
|---|---|---|---|
| Icon default | `rgba(255, 255, 255, 0.8)` | `rgb(35, 35, 35)` | `--card`@80% / `--foreground` ✅ |
| Icon favorited | `rgba(142, 50, 43, 0.1)` | `rgb(142, 50, 43)` | `--destructive`@10% (`#8E322B`) ✅ |
| Icon disabled | `rgba(245, 245, 245, 0.6)` | `rgb(140, 140, 140)` | `--muted`@60% / `--muted-foreground` (`#8C8C8C`) ✅; `opacity:0.5`, `cursor:not-allowed` ✅ |
| Icon default `:hover` | `rgb(255, 255, 255)` | `rgb(142, 50, 43)` | solid white / `--destructive` ✅ |
| Icon favorited `:hover` | `rgba(142, 50, 43, 0.2)` | (unchanged) | `--destructive`@20% (double the resting tint) ✅ |
| Pill default | `rgba(255, 255, 255, 0.8)` | `rgb(35, 35, 35)` | same as icon default ✅ |
| Pill favorited | `rgba(142, 50, 43, 0.1)` | `rgb(142, 50, 43)` | same as icon favorited ✅ |
| Pill radius (both) | — | — | `18px` exact (`--radius-xl`, matches `SaveToCollectionButton`'s `rounded-xl`) ✅ |
| Pill border (both) | — | — | `1px solid` resolving through `var(--border)` (browser-reported as `lab(90.952 …)`, numerically equivalent to `oklch(0.922 0 0)` = `#EBEBEB`) ✅ |
| Pill height (both) | — | — | `44px` — **deviates from the 36px sibling, see Summary** |

Every value matches its traced token exactly; no silent unlayered-CSS override was observed anywhere
in this matrix.

### Real bug found and fixed mid-task: inline `style` permanently blocks `:hover`

First implementation set the three resting colors via an inline `style={...}` prop (reasoned
correctly: inline styles reliably beat `ActionIcon`/`Button`'s own unlayered CSS at rest, per the
Tasks 629/650/651/612 precedent). Real-browser hover verification then showed the `:hover` CSS module
rules never took effect — `matchesHover:true` but `background-color`/`color` stayed at the resting
values. Root cause: an inline `style` attribute wins over **any** external stylesheet declaration for
the same property unconditionally, including the component's **own** `:hover` rule in a separate
stylesheet — it has no "resting-state-only" concept. Fixed by moving all resting-state colors into
the CSS module too (keyed off `data-favorited`/`data-fav-disabled`/`data-pending`), which competes
with Mantine's own unlayered CSS on equal footing via specificity (`.control[data-favorited='false']`
= (0,2,0) vs Mantine's plain-class `.mantine-ActionIcon-root`/`.mantine-Button-root` = (0,1,0)) — high
enough to win at rest, and low enough (a normal stylesheet rule, not an inline style) that `:hover`
can still cascade over it normally. Re-verified: all resting values unchanged (see table above), hover
now genuinely applies. This is a real, generalizable finding for future Mantine/unlayered-CSS work in
this codebase — worth folding into `docs/mantine-responsive-design-system.md`'s practical rule
(Task 651) as a follow-up, flagged for orchestrator consideration.

## Rendered proof

- **Live Homepage** (`/en`, `/uk`, `/sq`, `/it`, real `next dev` server, no auth): icon heart renders
  correctly on the first listing card, round/translucent/default state, at uk@320 and en@1440 — visual
  match to the pre-migration look.
- **Live listing detail page** (`/en/listings/11-mr7ucly4`): the `ListingContact` secondary-actions row
  (Favorite/SaveToCollection/Report) is **auth-gated** — `listingId` (the prop `FavoriteButton` needs)
  is only passed for authenticated viewers (`ListingContact.tsx:53`, pre-existing, unrelated to this
  task). No credentials were available in this sandbox to authenticate, so the pill's live-page capture
  was substituted with the dev-route capture below (kickoff evidence-path gap, same class as Task
  630's substitution).
- **Temporary dev route** (`src/app/[locale]/dev653qatest/page.tsx`, deleted before this report): all 5
  cells (icon default/favorited/disabled, pill default alongside a 36px sibling stand-in, pill
  favorited) rendered under the real `MantineRootProvider`/theme — screenshot shows the heart icon
  correctly filled/tinted per state, and visually demonstrates the pill's 44px height standing taller
  than the 36px sibling stand-in (the R2 deviation, visible not just measured).
- All screenshots/scripts were session-scratchpad only, deleted before this report; re-capturable via
  the same real-browser Playwright pattern (any Task 650/652/612 precedent) or by re-adding the
  temporary route.

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Icon shape | Inspected `HeaderActions.tsx` (favorites `ActionIcon`, `variant="subtle"`, `mih`/`miw` pattern) | `HeaderActions.tsx` | **Reuse** — same `variant="subtle"` borderless baseline | No new token; `radius="pill"` theme token, `size={32}` literal px |
| Pill shape | Inspected `theme.ts` `Button` block (canonical, themed, `radius:'lg'`/`size:'sm'` defaults) | `theme.ts` Button | **Reuse** — instance overrides `radius`/`bd` only where the still-legacy sibling requires an exact match | `radius="1.125rem"` / `bd="1px solid var(--border)"` — both traced, not invented |
| Three-state colors | Inspected `MantineListingCardPattern.module.css` (CSS-module-beats-unlayered-CSS precedent) + theme.ts's Button `vars`-vs-`styles` precedence comment (Task 589) | `MantineListingCardPattern.module.css`, `theme.ts` Button `vars` comment | **Reuse the CSS-module pattern** — no new component/pattern/token, all values traced to `globals.css`/`theme.ts` | `FavoriteButton.module.css` (new, component-scoped, not a shared pattern) |

No new component, pattern, or shared token was created. `FavoriteButton.module.css` is a
component-scoped CSS module, matching the `MantineListingCardPattern.module.css` precedent exactly.

## Validation evidence

1. `npm run typecheck` → **0 errors**.
2. `npm run check:stories` → **PASSED — 122 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2206/2206 keys, 4 locales, no delta.**
4. `npm run check:mojibake` → **0 artifacts in 1850 files.**
5. `npx vitest run .../FavoriteButton.test.tsx` → **14/14 PASS.**
6. `npx vitest run .../ListingCard.smoke.test.tsx` → **13/13 PASS**; planted-violation
   (`disabled: disabled || isPending` → `disabled: false`) genuinely FAILed the 2 sold-listing
   disabled-favorite assertions (`toBeDisabled()`), reverted → 13/13 PASS again. Combined run: 27/27.
7. `npm run screenshots:assert -- --mantine-only` → **exit 0, all hard assertions PASSED**
   (ambiguous cells are pre-existing/unrelated — see the story-stand-in caveat in Summary; this gate
   does not actually exercise `FavoriteButton`, superseded by the real-browser evidence above).
8. **Rendered proof + computed-style check** — see sections above (live Homepage 4-locale capture,
   temporary dev-route all-states capture, hover fix verification).
9. `npm run build` → **exit 0** — `✓ Compiled successfully in 48s`; all 40 static pages + all dynamic
   routes generated (confirmed via a fresh, final-code re-run after the CSS-module redesign).
10. `git status --short` / `git diff --stat` → `FavoriteButton.tsx`, `FavoriteButton.module.css` (new),
    `FavoriteButton.test.tsx`, `docs/backlog.md`, this session log, plus the auto-touched governance
    report (see Files Changed) and the pre-existing untouched Task 651 doc files.

## Self-review findings

1. **Real defect found and fixed before completion:** inline-`style` resting colors permanently
   blocked `:hover` — see "Real bug found and fixed mid-task" above. Not a product regression (never
   shipped), caught by this session's own mandatory real-browser hover verification before reporting.
2. **Kickoff path/premise corrections:** (a) target file path is `src/modules/listings/components/`,
   not `src/components/shared/` as the kickoff stated — verified via `find`, single match, unambiguous.
   (b) the kickoff's claim that `ListingCardPattern`'s story renders "the real `FavoriteButton`" is
   incorrect — it renders a `DemoFavoriteButton` stand-in; flagged and worked around with real-browser
   evidence instead (see Summary).
3. **Genuine, evidenced R2 deviation** (pill height, 44px vs 36px) — see Summary; NOT silently
   resolved either way, flagged for orchestrator decision (accept 44px as the correct/compliant
   result, migrate `SaveToCollectionButton` too for full row consistency, or explicitly authorize an
   instance-level touch-target exception).

## Assumptions, deviations, and limitations

- **Pill height (44px, not the sibling's 36px)** — genuine P0 touch-target conflict, not overridden;
  see Summary and Self-review #3. Radius/border DO match exactly.
- **Pill live-page capture substituted** — `ListingContact`'s action row is auth-gated
  (pre-existing, unrelated); no test credentials available in this sandbox. Substituted with a
  temporary, deleted dev-route capture under the real provider/theme (kickoff evidence-path gap,
  Task 630 precedent for this class of substitution).
- **`screenshots:assert --mantine-only`'s relevance to R6** — the gate passed, but (per the story
  source inspection above) doesn't actually render this component; real evidence for the icon shape
  came from the live-Homepage capture + `ListingCard.smoke.test.tsx` instead.
- No new story (per kickoff instruction) — `FavoriteButton` remains without a dedicated
  `.stories.tsx`, consistent with "reuse the existing gate" guidance (even though that gate, as
  discovered, doesn't cover it — a story creation was still explicitly out of scope for this task).
- `check:hydration` not run — not part of this task's Q3 profile/gate list; no new client boundary
  (file already `'use client'`).

## Opus handoff

Evidence locations:
- Diff: `src/modules/listings/components/FavoriteButton.tsx`, `.module.css` (new), `__tests__/FavoriteButton.test.tsx` (`git diff`), reproduced in relevant part above.
- Rendered screenshots/computed-style scripts + the temporary dev route: captured/verified this session, then deleted (session-scratchpad only) — re-capturable via the patterns described above.

Questions/risks for the reviewer to inspect:
1. **R2 pill height (44px vs the sibling's 36px)** — confirm whether to accept as-is (P0-compliant,
   the correct call per this session's reasoning), fast-track a `SaveToCollectionButton` migration for
   row consistency, or authorize an explicit touch-target exception for this one instance.
2. **The kickoff's `ListingCardPattern` story premise was incorrect** (renders a demo stand-in, not the
   real component) — confirm the real-browser substitute evidence gathered here is sufficient, and
   consider a kickoff/doc correction so future tasks don't rely on that gate for this component.
3. **The inline-style-blocks-hover finding** is a real, generalizable CSS lesson for this codebase's
   unlayered-CSS work generally — consider folding into `docs/mantine-responsive-design-system.md`'s
   practical rule (Task 651) as a follow-up note.
4. Confirm the test-file changes (`MantineProvider` wrapper, `matchMedia` stub, the 2 replaced
   Task-603 assertions) still assert genuinely meaningful, non-vacuous behavior — the planted-violation
   re-proof (item 6, Validation evidence) demonstrates the critical-flow suite catches a real regression.

## Backlog update

See `docs/backlog.md` — concise active-state entry updated for Task 653 (implemented, awaiting
review, Homepage now 100% Mantine). Full detail lives here per session-log rules.
