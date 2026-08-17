# Task 754 — `NotificationCenter` + `NotificationItem`

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_754_Notification_Center_And_Item.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement / acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | Both files render via Mantine primitives; every surviving Tailwind utility listed with reason | `NotificationCenter.tsx` imports `Button, Flex, Stack, Text`. `NotificationItem.tsx` imports `Anchor, Box, Group, Text`. No Tailwind utility classes remain in either file. Two CSS Modules (`NotificationCenter.module.css`, `NotificationItem.module.css`) reproduce `divide-y` and the conditional `bg-primary/*`/`hover:`/`transition-colors`/`opacity-60` chain — neither has a Mantine prop equivalent (see report contract items below) |
| AC2 | Rendered evidence, zero visual delta, 320/390/768/1024/1440 + uk@320, in 4 states (empty, unread item, read item, ≥3 items) | Storybook's existing canonical story `Mantine/Primitives/NotificationBellView` (`src/stories/mantine/primitives/NotificationBellView.stories.tsx`) already covers all 4 states in one real click-to-open Popover mount (3-item unread list, all-read, empty). Captured before (`git show HEAD:<path>`) vs. after (edited) computed-style diff — 1386 leaf values compared across all 18 viewport×locale×state combinations, **0 unexplained mismatches** (12 divide-y mechanism deltas independently proven positionally/visually equivalent — see below). Screenshots visually confirmed at 320/768/uk@320 |
| AC3 | `sm:` → Mantine breakpoint mapping stated as px, matrix includes a width on each side of it | `sm:` = 640px (`globals.css:281`, `--bp-sm: 640px`); Mantine's own `sm` breakpoint = 40em = 640px (`mantine-responsive-design-system.md` §6.1) — an exact 1:1 mapping, stated in-code as a comment. Matrix includes 390 (below) and 768 (above); computed `header.flexDirection` measured `column` at 320/390, `row` at 768/1024/1440 in both before and after — confirms the switch happens between 390 and 768 either way |
| AC4 | `data-testid`, both ARIA attributes, `href`, `handleClick` verified present in rendered DOM | Confirmed in captured `outerHTML`/computed queries: `data-testid="notification-center"` on the `Stack` root; `aria-hidden` on the icon `Text`; `aria-label={t('unread_count',...)}` on the dot `Box`; `role="button"`/`tabIndex="0"` on unread rows (absent on read rows, matching original); `anchorHref` present and matching `notification.link`; `onClick={handleClick}` unchanged in source (same function, same call sites) |
| AC5 | `typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0 | All four re-run on final content, all exit 0 (see Validation evidence) |
| AC6 | No string content changed; `check:i18n` key parity unchanged | No `t()` calls added/removed/changed; `check:i18n` still reports 2218 keys/locale, parity PASSED |

## Current versus required behavior

- **Preserved:** `data-testid="notification-center"`; `aria-hidden` on the icon; `aria-label` on the unread dot; the read/unread conditional (background tint, hover, cursor, `font-medium`/`fw=500` title weight, `role`/`tabIndex`) — both branches, unchanged behavior; `handleClick` and `href` on the anchor; every `t()` key; `allPasswordRulesMet`-equivalent n/a (no such export here); `NotificationBell`/`useNotifications`/data logic untouched (out of scope, confirmed no edits).
- **Required after behavior:** raw Tailwind utilities replaced with Mantine primitives per the kickoff's replacement rules, zero visual delta (D28).
- **Negative flows:** N/A — presentational/state-driven components (read/unread, pending/mark-all-read, empty list). No validation/authorization/network/concurrency branches are newly in scope; `markNotificationRead`/`markAllNotificationsRead` server actions are untouched.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/notifications/components/NotificationCenter.tsx` | Outer `<div>` → `Stack`; header `<div>` → `Flex` with responsive `direction`/`align`/`justify`; `<p>` title/empty-message → `Text`; mark-all `Button`'s `className="w-full sm:w-auto"` → `w={{base:'100%',sm:'auto'}}`; list wrapper's `divide-y` → CSS Module class |
| `src/modules/notifications/components/NotificationItem.tsx` | Root `<div>` → `Group`; icon `<span>` → `Text component="span"`; title/body/timestamp `<p>` → `Text`; unread dot `<span>` → `Box`; `<a>` → `Anchor`; conditional background/hover/cursor/opacity classes → CSS Module (`styles.root`/`.unread`/`.interactive`/`.pending`, composed via `cn()`, same conditional branches) |
| `src/modules/notifications/components/NotificationCenter.module.css` | New — reproduces `divide-y`'s single-line-per-adjacent-pair result via `:not(:first-child) { border-top }` (mirror of Tailwind's own `:not(:last-child) { border-bottom }`) |
| `src/modules/notifications/components/NotificationItem.module.css` | New — reproduces `transition-colors`, `bg-primary/5`, `hover:bg-primary/10`, `cursor-pointer`, `opacity-60` (none has a Mantine style-prop equivalent) |
| `src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx` | Added `MantineProvider` wrapper + `matchMedia` stub (matches `ListingCard.smoke.test.tsx` precedent) — `NotificationItem` now renders Mantine components, which the existing test rendered without a provider |
| `src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` | Same fix, same reason |

## Validation evidence

```
npm run typecheck                     → exit 0
npm run check:design-tokens --strict  → 0 violations, exit 0 (3 raw-value markers added with reasons, see below)
npm run check:i18n                    → 2218 keys × 4 locales, parity PASSED, exit 0
npm run check:mojibake                → 0 artifacts in 2849 files, exit 0
npm run check:stories                 → 127 files checked, 0 violations, exit 0
npm run build                          → ✓ Compiled successfully, 40/40 static pages, exit 0
npx vitest run src/modules/notifications → 3 files / 9 tests passed
```

File integrity: all 6 touched/added files verified UTF-8, no BOM, no NUL bytes.

`check:design-tokens` markers added (all with reasons, none suppress a real defect):
- `NotificationCenter.module.css:5` — `border-top: 1px` (divide-y border-width, matches Tailwind's own compiled `.divide-y` rule).
- `NotificationItem.module.css:6` — `var(--default-transition-duration)` (Tailwind-internal token, confirmed defined in the built CSS; the static scanner cannot see through `@import "tailwindcss"`).
- `NotificationItem.tsx:197` — `: '0.125rem'` (2px icon offset, px-equal literal, same pattern as Tasks 752/753).

### The `divide-y` decision and its evidence (AC1 + report contract)

**Decision: CSS Module**, not a `Divider` between items (the kickoff's second option) — a `Divider` would add a DOM node between every pair of items, changing sibling structure and requiring separate proof that the extra element doesn't affect layout/spacing; the CSS-only reproduction changes nothing structurally.

`NotificationCenter.module.css`: `.list > :not(:first-child) { border-top: 1px solid var(--border) }`. Tailwind's own compiled rule (inspected in the built CSS) is `.divide-y > :not(:last-child) { border-bottom-width: 1px }` (color from cascade, not the utility itself). These are mechanically different (top-of-next vs. bottom-of-previous) but were **measured to be positionally and chromatically identical**: for a 3-item list, direct-children inspection showed
- **before**: `[A(border-bottom:1px, color oklch(0.922 0 0)), A(border-bottom:1px, same color), DIV(none)]`
- **after**: `[A(none), A(border-top:1px, same color), DIV(border-top:1px, same color)]`

Both produce exactly 2 lines, in the same 2 positions (between item 0↔1 and 1↔2), same color (`var(--border)` = `oklch(0.922 0 0)`). Confirmed via direct Playwright DOM inspection (see Implementation validation notes) and via screenshots.

### The `sm:` px mapping (AC3)

Stated in `NotificationCenter.tsx` as an in-code comment: `sm:` = 640px (`globals.css:281`, `--bp-sm: 640px`); Mantine's `sm` breakpoint = 40em = 640px — exact 1:1, no conversion needed. `Flex direction={{ base: 'column', sm: 'row' }}` (and `align`/`justify` at `sm` only, intentionally omitted at `base` — see Implementation validation notes).

### `text-2xs` / opacity-token handling (AC1, D35)

- `text-2xs` (`globals.css:173`, `0.625rem`/10px, no Mantine token) → `fz="0.625rem"` raw literal (D28 raw-value exemption, same family as Tasks 752/753's px-equal literals).
- `text-muted-foreground/60` is an **opacity-modified token** aliased through `@theme inline` (same shape as D35's `--overlay` regression). Verified in the built CSS (`.next/static/css/*.css`) that, unlike the `--overlay` case, Tailwind DID successfully emit a `color-mix()` `@supports` rule for this specific utility (`color-mix(in oklab, var(--muted-foreground) 60%, transparent)`) — not the D35 failure mode. Reproduced that exact expression directly as the `c` prop value (verified byte-for-byte via computed-style capture: `oklab(0.556 0 0 / 0.6)` before, identical after).

### Every utility migrated, with reason

| Utility | Migrated to | Note |
|---|---|---|
| `flex flex-1 min-h-0 flex-col overflow-hidden` | `Stack` + inline `style={{flex,minHeight,overflow}}` (no named style-prop for these) | |
| `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b shrink-0` | `Flex` responsive props + inline `borderBottom`/`flexShrink` | `border-b` has no color-token style-prop; reproduced with `var(--border)` directly |
| `text-sm font-semibold` (title) | `Text size="sm" fw={600} lh={1.625}` | `lh` explicit — see line-height finding below |
| `w-full sm:w-auto` (button) | `w={{base:'100%',sm:'auto'}}` | canonical Mantine responsive style-prop pattern |
| `flex-1 min-h-0 overflow-y-auto divide-y` | CSS Module `.list` class + inline style | divide-y has no prop equivalent (see above) |
| `px-4 py-8 text-center text-sm text-muted-foreground` (empty) | `Text ... px="md" py={32} ta="center" c="var(--muted-foreground)" lh={1.625}` | `py-8`=32px has no token (Mantine `xl`=24px); raw literal |
| `flex items-start gap-3 px-4 py-3 transition-colors` + conditional bg/hover/opacity | `Group` + CSS Module (`.root`/`.unread`/`.interactive`/`.pending`) | none of transition-shorthand/opacity-bg/hover has a Mantine prop |
| `text-base shrink-0 mt-0.5` (icon) | `Text component="span" fz="1rem" lh="1.5rem" style={{flexShrink,marginTop}}` | |
| `text-sm leading-snug ... font-medium` (title) | `Text size="sm" fw={...} lh={1.375}` | |
| `text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-normal break-words` (body) | `Text size="xs" c="var(--muted-foreground)" lh={1.625} lineClamp={2} mt={2} style={{whiteSpace,overflowWrap}}` | |
| `text-2xs text-muted-foreground/60 mt-1` (timestamp) | `Text fz="0.625rem" c="color-mix(...)" lh={1.625} mt="0.25rem"` | see D35 handling above |
| `h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5` (dot) | `Box h={8} w={8} bdrs="pill" bg="var(--primary)" mt={6} style={{flexShrink}}` | token kept per kickoff instruction |
| `block hover:no-underline` (anchor) | `Anchor display="block" underline="never" c="inherit"` | verified renders identically — see finding below |

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Token/utility path | Change | Evidence |
|---|---|---|---|---|---|
| Header row layout | `Flex` | `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2` | `--bp-sm` 640px ↔ Mantine `sm` 40em | Responsive props | Computed `flexDirection`/`alignItems`/`justifyContent` at all 5 widths, before=after |
| Header border | `Flex` style | `border-b` | `var(--border)` | Inline style | `borderBottomColor: oklch(0.922 0 0)` before=after |
| Title text | `Text` | `text-sm font-semibold` | n/a | `size="sm" fw={600} lh={1.625}` | Computed fontSize/lineHeight/fontWeight before=after |
| Mark-all button width | `Button` | `w-full sm:w-auto` | n/a | `w={{base,sm}}` | Not independently re-measured (unchanged Button internals, only the width prop source changed) |
| List divider | CSS Module | `divide-y` | `var(--border)` | `:not(:first-child)` border-top | Direct-children inspection, positions+color match |
| Empty message | `Text` | `text-sm text-muted-foreground text-center` | `var(--muted-foreground)` | `size="sm" c=... ta="center" lh={1.625}` | Computed color/lineHeight/textAlign before=after |
| Row background (unread) | CSS Module `.unread` | `bg-primary/5` | `color-mix(in oklab, var(--primary) 5%, transparent)` | CSS Module | Computed `backgroundColor: oklab(0.649... / 0.05)` before=after |
| Row hover (unread, not pending) | CSS Module `.interactive:hover` | `hover:bg-primary/10` | `color-mix(...10%...)` | CSS Module | Source-derived from the same color-mix mechanism verified for `.unread`; not independently hover-triggered in headless capture (documented limitation below) |
| Icon | `Text component="span"` | `text-base shrink-0 mt-0.5` | n/a | `fz="1rem" lh="1.5rem"` | Computed fontSize 16px/lineHeight 24px/marginTop 2px before=after |
| Title (item) | `Text` | `text-sm leading-snug ... font-medium` | n/a | `lh={1.375}` | Computed lineHeight 19.25px before=after |
| Body | `Text` | `text-xs text-muted-foreground ... line-clamp-2` | `var(--muted-foreground)` | `lh={1.625} lineClamp={2}` | Computed color/lineHeight before=after |
| Timestamp | `Text` | `text-2xs text-muted-foreground/60` | color-mix opacity token | `fz="0.625rem" c="color-mix(...)"` | Computed color `oklab(0.556 0 0 / 0.6)` before=after |
| Unread dot | `Box` | `h-2 w-2 rounded-full bg-primary` | `var(--primary)` | `h={8} w={8} bdrs="pill" bg=...` | Computed width/height/backgroundColor before=after; `borderRadius` differs as a computed-string artifact only (`calc(infinity*1px)` clamped vs. `9999px`) — both exceed half the 8px box, visually identical full circle |
| Anchor wrapper | `Anchor` | `block hover:no-underline` | n/a | `display="block" underline="never" c="inherit"` | Computed `display`, `textDecorationLine: none` before=after; `color` fixed to match (see finding below) |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Whole `NotificationCenter`/`NotificationItem` rendered surface | Searched for `NotificationCenter` literally (missed the real consumer) and then found `src/stories/mantine/primitives/NotificationBellView.stories.tsx` — a toolbar-driven, click-to-open, Mantine-native story rendering the exact real `NotificationBellView → MantinePopover → NotificationCenter → NotificationItem` chain, already covering all 4 required states (unread/all-read/empty, ≥3 items) | `Mantine/Primitives/NotificationBellView` `Default` story | `reuse` (initially created a redundant standalone `NotificationCenter.stories.tsx`, found the real canonical source, deleted the redundant one) | n/a — no new story needed |
| Header responsive row/column switch | Searched Mantine style-props for `flexDirection`/`align`/`justify` responsive support; no such prop exists on bare `Box`/`Group`. Found `Flex` component (`FLEX_STYLE_PROPS_DATA`) explicitly supports responsive `direction`/`align`/`justify`/`wrap`/`gap` via the same `{base,sm,...}` object system | Mantine `Flex` (core primitive) | `reuse` | n/a (core primitive) |
| Muted/dimmed text color | Same precedent search as Task 753 — `c="var(--muted-foreground)"` (ListingCard family) vs. `c="dimmed"` (documented in `MantineFilterSection.tsx` as resolving to a different gray) | `c="var(--muted-foreground)"` direct-token pattern | `reuse` | `var(--muted-foreground)` |
| Opacity-modified muted color (timestamp) | Searched the built CSS for the actual Tailwind-compiled `color-mix()` expression rather than approximating | n/a — reproduced the compiled CSS expression directly | `reuse` (of the compiled mechanism, not a component) | `color-mix(in oklab, var(--muted-foreground) 60%, transparent)` |
| Semantic primary color (dot, mark-all button, row tint) | Kickoff explicitly says "keep the token" | `var(--primary)` / `color="brand"` (Button, unchanged) | `reuse` | `var(--primary)` |
| Unread-row background/hover | No Mantine style-prop for opacity-modified backgrounds or `:hover`; searched CSS Module precedent (`FavoriteButton.module.css`, `MantineListingCardPattern`'s own module) | CSS Module pattern | `reuse` (of the established CSS-Module-alongside-Mantine convention) | `color-mix(in oklab, var(--primary) N%, transparent)` |
| Divide-y separator | No Mantine prop; kickoff named two options | CSS Module pattern | `reuse`/create-local (justified above) | `var(--border)` |
| Pill/circle geometry (dot) | Checked `theme.radius.pill` ('9999px') vs. Tailwind's `rounded-full` (`calc(infinity*1px)`) — both exceed half the 8px box | Mantine theme `radius.pill` token | `reuse` | `bdrs="pill"` |

## Implementation validation notes

Three defects found and fixed during evidence capture, none shipped:

1. **Real product bug — Anchor link color leaking into title text.** `<Anchor>` without an explicit `c` prop defaults to Mantine's own link color; the original `<a>` relied on Tailwind Preflight's `a { color: inherit }`. Measured: anchor-wrapped item titles rendered `rgb(236, 84, 71)` (brand red) instead of `rgb(0, 0, 0)` (black, matching non-anchored items). Fixed with `c="inherit"` on `Anchor`, re-verified: 0 mismatches.
2. **Verification-script-only defect — off-by-one header/list indexing.** Mantine's responsive style-props system (used by `Flex`'s `direction={{base,sm}}`) injects an actual `<style>` element as a DOM child of the panel, shifting `:nth-child` index-based selectors by one in the capture script. Caught by re-inspecting the panel's real `children` array directly (`tag: "STYLE"` as the first child), fixed the script (not product code) to filter non-element children before indexing.
3. **Redundant `align`/`justify` base values.** Initially set `align={{base:'stretch',sm:'center'}}`/`justify={{base:'flex-start',sm:'space-between'}}` explicitly. CSS spec: `align-items`/`justify-content: normal` (the browser default when unset) behaves identically to `stretch`/`flex-start` in a flex container — visually equivalent, but the explicit values produced a non-identical computed-style *string* (`"stretch"` vs `"normal"`). Simplified to `align={{sm:'center'}}`/`justify={{sm:'space-between'}}` (base omitted), which correctly falls back to the browser default and reproduces the original computed string exactly.

Remaining 12 of 1386 compared leaf values differ only in the already-explained, positionally-verified divide-y mechanism (border-bottom-on-previous vs. border-top-on-next — same visual line, same position, same color).

## Assumptions, deviations, and limitations

- The `:hover` state on unread rows (`bg-primary/10`) was reproduced from the same verified `color-mix()` mechanism as the resting `bg-primary/5` state, but was not independently triggered and measured via a synthetic `:hover` pseudo-class in headless Playwright (no mouse-hover simulation was run in this pass). The mechanism (same `color-mix()` function, same `--primary` token, different percentage) is the same one verified correct for the resting state; treated as low-risk given that verification, but not independently measured.
- No canonical story was created for `NotificationCenter` standalone — the existing `NotificationBellView` story already covers it end-to-end through the real production mount path, which is a stronger proof than an isolated fixture.
- `NotificationBell`/`NotificationBellView`/`useNotifications`/data logic — confirmed untouched (no diff).
- No new i18n keys added; no automated regression test added or required beyond the two existing test files' provider-wrapper fix (this task touches no `docs/critical-flow-registry.md` entry — presentational-only components).

## Opus handoff

- Diff: `git diff -- src/modules/notifications/components/NotificationCenter.tsx src/modules/notifications/components/NotificationItem.tsx src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx`
- New files: `src/modules/notifications/components/NotificationCenter.module.css`, `src/modules/notifications/components/NotificationItem.module.css`
- This session log: `docs/sessions/2026-08-17-task754-notification-center-and-item.md`
- Backlog: `docs/backlog.md` (Last Session line + registry row 754 updated)
- Sprint plan: `tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md` row 754 updated
- Owner-run commit (explicit paths), when ready:
  `git add docs/backlog.md docs/sessions/2026-08-17-task754-notification-center-and-item.md src/modules/notifications/components/NotificationCenter.tsx src/modules/notifications/components/NotificationItem.tsx src/modules/notifications/components/NotificationCenter.module.css src/modules/notifications/components/NotificationItem.module.css src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
