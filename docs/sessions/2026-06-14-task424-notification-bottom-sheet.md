# Session Log — 2026-06-14 — Task 424 (Epic II, Task 319 mobile-gate follow-up)

**Task:** `tasks/Epics/Epic_II_kickoff_prompt_Task_424.md`
**Scope:** Convert the hand-rolled `NotificationBell`/`NotificationCenter` anchored popup
(`<div role="dialog" className="absolute right-0 top-full mt-2 z-50">` wrapping a fixed `w-80`
panel) into a §26.2-compliant full-width bottom sheet at `<640px`, while leaving the `≥640px`
anchored `w-80` dropdown unchanged.

---

## 1. Decision — primitive choice

Replaced the hand-rolled `absolute` div + manual `mousedown`/`keydown` effects with the project's
canonical Base-UI `Popover` (`@/components/ui/popover`), whose `PopoverContent` already bakes in
`MOBILE_POSITIONER`/`MOBILE_POPUP`/`MOBILE_SLIDE_ANIMATION`/drag-handle (Task 379/421) — meets
§26.2 with zero new architecture. `PopoverTrigger` uses the `render` prop to host the existing
`Button` (bell icon + unread badge), matching the `dropdown-menu.stories.tsx`/`sheet.tsx`
precedent.

## 2. `NotificationBell.tsx` — full rewrite

```tsx
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, loading, refetch } = useNotifications()

  if (loading) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('title')}
            className={cn(
              'relative rounded-xl',
              open ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-destructive text-2xs font-bold text-destructive-foreground leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        role="dialog"
        aria-label={t('title')}
        align="end"
        sideOffset={8}
        className="w-80 max-h-120 gap-0 rounded-xl border bg-background p-0 shadow-lg ring-0 overflow-hidden"
      >
        <NotificationCenter
          notifications={notifications}
          onRead={() => refetch()}
        />
      </PopoverContent>
    </Popover>
  )
}
```

- Manual `panelRef`/`buttonRef` + `mousedown`/`keydown` effects removed entirely — `Popover`'s
  built-in backdrop-tap/Esc dismiss + focus-return-to-trigger replace them (gaining
  focus-return is explicitly allowed per the kickoff's "Current behavior to preserve" note).
- `aria-expanded`/`aria-haspopup` are provided by `PopoverTrigger` automatically (Base-UI
  trigger semantics) — no longer hand-authored.
- Bell badge (`99+` cap), `aria-label`, open-state styling (`bg-muted text-foreground` vs
  `text-muted-foreground`) all preserved verbatim.
- `loading` → `null` early-return preserved. `useNotifications()` wiring (`notifications`,
  `unreadCount`, `loading`, `refetch`) unchanged.

## 3. `NotificationCenter.tsx` — minimal hosting changes

Two className changes only — moved the "visual box" (width/height/rounding/border/shadow/bg) to
`PopoverContent` (above), made `NotificationCenter`'s root a flex-fill so `PopoverContent`'s
`≥640px` `w-80 max-h-120` and `<640px` `max-sm:w-full max-sm:max-h-[90dvh]
max-sm:rounded-t-2xl max-sm:rounded-b-none` (from `MOBILE_POPUP`) both apply correctly:

```diff
- <div className="w-80 max-h-120 flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
+ <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
...
- <div className="flex-1 overflow-y-auto divide-y">
+ <div className="flex-1 min-h-0 overflow-y-auto divide-y">
```

- `min-h-0` on both the root and the scrollable list is required so the flex column actually
  shrinks to `PopoverContent`'s `max-h-120`/`max-sm:max-h-[90dvh]` and the list — not the whole
  sheet — scrolls internally.
- Header (title, "Mark all read" `Button size="sm"`), `useTransition` +
  `markAllNotificationsRead`, `t('title')`/`t('mark_all_read')`/`t('empty')`, props
  (`{ notifications, onRead }`), and the `NotificationItem` mapping are **untouched**.
  `NotificationItem.tsx` (Task 319's surface) was not opened.

At `≥640px` the desktop visual/behavior contract is preserved — the box classes
(`w-80 max-h-120 ... rounded-xl border bg-background shadow-lg`) are unchanged, now on
`PopoverContent` instead of `NotificationCenter`'s root (decision 2). Positioning is
class-/contract-equivalent, not pixel-diffed: the prior hand-rolled
`absolute right-0 top-full mt-2` is replaced by Base-UI's
`PopoverPrimitive.Positioner align="end" sideOffset={8}` (functionally the same "anchored
below-right of the trigger, 8px gap" placement), and `PopoverContent` always renders the
`DRAG_HANDLE_WRAPPER`/`DRAG_HANDLE_BAR` node, which is `sm:hidden` (mobile-only) and adds no
visible element at `≥640px`.

## 4. New story — `NotificationCenter.stories.tsx`

New file. `NotificationBellDemo` wraps `NotificationCenter` in the same `Popover`/`PopoverTrigger`
(`render`)/`PopoverContent` structure as `NotificationBell.tsx` (`defaultOpen`), using real
`useTranslations('notifications')`. Fixture rows (`ROWS`) are `template_id`-driven (matching
`NotificationItem.stories.tsx`'s established pattern from Task 319) so `saved_search_match` /
`price_change` / `support_created` titles/bodies render via real `t()` calls — no raw-literal
governance violations.

- `Default` — `ROWS`, default viewport (`≥640px` anchored `w-80` dropdown).
- `MobileBottomSheet` — `ROWS`, `mobile320` viewport (bottom sheet — the clause-12 target).
- `Empty` — `EMPTY_ROWS`, `mobile320` viewport (empty-state bottom sheet).

`scripts/check-stories-rendered.mjs` `ASSERT_STORIES` (54 → now includes 3 new entries):

```js
// Notification bell popup (Task 424 — §26.2 bottom-sheet conversion)
{ id: 'notifications-notificationcenter--default',          label: 'NotificationCenter/Default' },
{ id: 'notifications-notificationcenter--mobile-bottom-sheet', label: 'NotificationCenter/MobileBottomSheet' },
{ id: 'notifications-notificationcenter--empty',             label: 'NotificationCenter/Empty' },
```

`Empty` (`EMPTY_ROWS`) is the genuinely-new negative-flow case (empty-list bottom sheet, the
kickoff's "Empty list" negative flow) — added during orchestrator evidence cleanup so the
harness's 5 assertions also machine-prove it, not just `Default`/`MobileBottomSheet` (which share
`args: ROWS` and differ only by Storybook's `viewport` global — kept as intentional, harmless
duplication since the harness sweeps all 14 viewports for every story regardless).

## 5. Note 20 — before/after control inventory

| Control | Before | After |
|---|---|---|
| Bell trigger (icon, `aria-label`, unread badge `99+` cap) | manual `<Button>` + manual ref | same `<Button>` via `PopoverTrigger render` — preserved |
| `aria-expanded`/`aria-haspopup` | hand-set on trigger button | provided automatically by `PopoverTrigger` |
| Open-state styling (`bg-muted text-foreground`) | conditional className | preserved, same condition (`open`) |
| Panel open/close | manual `useState` + `mousedown`/`keydown` effects | `Popover open/onOpenChange` — outside-click + Esc built in |
| Focus return to trigger on close | **not implemented** | gained via `Popover`'s built-in focus management (explicitly allowed) |
| `role="dialog"` + `aria-label` on panel | hand-set on wrapper `div` | hand-set on `PopoverContent` (preserved) |
| Header: title + "Mark all read" (`hasUnread`-gated) | `NotificationCenter` | unchanged, `NotificationCenter` |
| List: scrollable, empty state, `NotificationItem` rows | `NotificationCenter` | unchanged, `NotificationCenter` |
| `loading` → `null` | `NotificationBell` early return | preserved |
| Data wiring (`notifications`, `unreadCount`, `loading`, `refetch`, `onRead`) | `useNotifications()` | unchanged |
| `<640px` rendering | fixed `w-80` anchored `absolute` panel — **could overflow at 320** | `max-sm:` full-width bottom sheet (edge-to-edge, rounded-top, `≤90dvh`, drag handle, slide-up) via `MOBILE_POPUP`/`MOBILE_POSITIONER`/`MOBILE_SLIDE_ANIMATION` |
| `≥640px` rendering | `w-80 max-h-120 ... rounded-xl border bg-background shadow-lg`, `absolute right-0 top-full mt-2` | desktop visual/behavior contract preserved — same box classes, now on `PopoverContent`, anchored via Base-UI `Positioner align="end" sideOffset={8}` (class-/contract-equivalent, not pixel-diffed; see §3) |

## 6. Interaction proof — Esc / outside-click / focus-return

The layout harness (§7) does not exercise keyboard/pointer interaction, so this is a separate
Playwright transcript (temporary scratch script `scripts/_tmp-focus-test.mjs`, deleted after use —
not part of the diff) against the built `storybook-static/`, on
`notifications-notificationcenter--default` (`defaultOpen`, `≥640px` viewport, en locale):

```
popover open before Escape: true
popover open after Escape: false
focus returned to trigger after Escape: true
popover open after trigger click (re-open): true
popover open after outside click: false
focus returned to trigger after outside click: true
```

This is the same `PopoverPrimitive.Root`/`Positioner`/`Popup` triad (`@base-ui/react/popover`)
already consumed by `Select`/`Combobox`/`DropdownMenu` — Esc and outside-click both close the
popup and return `document.activeElement` to `[data-slot="popover-trigger"]`, satisfying the
kickoff's "backdrop tap OR Esc closes the sheet; focus returns to the bell trigger" requirement
(§5 row "Focus return to trigger on close").

## 7. Rendered-evidence matrix (clause 12/13)

Scoped run: a temporary throwaway copy of `check-stories-rendered.mjs`
(`scripts/_tmp-check-notif.mjs`, deleted after use — not part of the diff) with `ASSERT_STORIES`
trimmed to the 3 notification stories only, run in **full mode** (all 14 canonical viewports × 4
locales, not `--fast`) against the existing `storybook-static/` build:

```
📸  Starting rendered assertion (full mode)
    Stories: 3 | Viewports: 14 | Locales: 4
    Output: .screenshots/rendered-assert/2026-06-14T06-56/

Results: 168/168 PASS, 0 FAIL
flaky-recovered: 0
✅ All rendered assertions PASSED.
```

Of the 14 canonical viewports, `<640px` = `{mobile-320, mobile-375, mobile-390, mobile-480,
canonical-560}` = **5**; `≥640px` = the remaining **9**
(`canonical-680, tablet-768, canonical-810, canonical-960, desktop-1024, canonical-1200,
desktop-1440, huge-1920, huge-2560`). `3 stories × 14 viewports × 4 locales = 168` total:
`<640px` = 5×4×3 = **60** cells, `≥640px` = 9×4×3 = **108** cells. **168/168 PASS**. Manifest:
`.screenshots/rendered-assert/2026-06-14T06-56/manifest.json` (+ 168 PNGs in the same directory).

The mandatory uk@320/375/390 cells, plus full sq/en/it parity at the same 3 viewports, for all
3 stories (`Default`, `MobileBottomSheet`, `Empty` — 36 cells: 3 stories × 3 viewports × 4
locales) all show:

| locale | viewport | pass | noHorizontalOverflow | fullWidthControlsAtMobile | fullWidthButtonsAtMobile | popupBottomSheetAtMobile |
|---|---|---|---|---|---|---|
| sq/en/uk/it | mobile-320/375/390 (36 cells, all 3 stories) | `true` | `true` | `true` | `true` | `true` |

`popupBottomSheetAtMobile: true` confirms `[data-slot="popover-content"]` is edge-to-edge and
bottom-anchored at all 3 mandatory mobile viewports × all 4 locales, for the populated
(`Default`/`MobileBottomSheet`) AND empty-list (`Empty`) cases — the core fix (no
document-level h-scroll at 320 in sq/en/uk/it, popup is a real bottom sheet, not the old
anchored `w-80` card) plus the kickoff's "Empty list" negative flow.

At the 9 `≥640px` viewports, all 3 stories render the unchanged `w-80 max-h-120 rounded-xl
border bg-background shadow-lg` anchored dropdown (all 108 such cells PASS) with
`fullWidthControlsAtMobile`/`fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` all `null`
(not applicable at `≥640`, per the harness's three-state semantics) and
`noHorizontalOverflow: true`.

## 8. Validation gates

- `npx tsc --noEmit` — clean (0 errors), re-confirmed after final edits.
- `npm run build` — passes.
- `npm run check:stories` — PASS (297 `storybook.*` keys, sq/en/uk/it parity; new story file has
  zero governance violations — no hardcoded literals, no banned layouts, no raw `<button>`).
- `npm run build-storybook` — succeeds.
- `screenshots:assert` (scoped, full-matrix, 3 stories) — 168/168 PASS (§7).

## 9. File-integrity checks (clause 14)

| File | NUL bytes | BOM | tsc |
|---|---|---|---|
| `src/modules/notifications/components/NotificationBell.tsx` | 0 | none | clean |
| `src/modules/notifications/components/NotificationCenter.tsx` | 0 | none | clean |
| `src/modules/notifications/components/NotificationCenter.stories.tsx` | 0 | none | clean |
| `scripts/check-stories-rendered.mjs` | 0 | none | n/a (`.mjs`, loaded successfully by the scoped run) |

`scripts/_tmp-check-notif.mjs` and `scripts/_tmp-focus-test.mjs` (temporary, used for §6/§7) were
deleted after use — not part of the diff.

## 10. AC-by-AC

| AC | Status | Evidence |
|---|---|---|
| `<640px` = §26.2 full-width bottom sheet; `≥640px` unchanged | ✅ | §2/§3 — `PopoverContent`'s baked-in `max-sm:` overrides vs unchanged `w-80 max-h-120 rounded-xl border bg-background shadow-lg` |
| No document-level h-scroll at 320 in sq/en/uk/it | ✅ | §7 — `noHorizontalOverflow: true` for all 36 mandatory cells (3 stories × 3 viewports × 4 locales) |
| Backdrop tap + Esc close, focus returns to trigger | ✅ | §6 — interaction-proof transcript (Esc + outside-click both close + return focus to trigger) |
| Note 20 control inventory preserved | ✅ | §5 |
| Clause 12 rendered matrix (uk@320/375/390 mandatory, machine-produced) | ✅ | §7 — 168/168 PASS, manifest + PNGs in `.screenshots/rendered-assert/2026-06-14T06-56/` |
| Clause 13 story gate | ✅ | §8 — `check:stories` PASS, new story uses `t()`/`storyT()`, `layout` unchanged from project convention, no `/Ukrainian/` export, no raw `<button>` |
| Clause 9/14 — tsc/build/integrity | ✅ | §8/§9 |
| Clause 10 — backlog + session log, no git | ✅ | this log + `docs/backlog.md` update; no git run |
| Locale parity | ✅ | no new `notifications.*` keys — reuses existing `title`/`mark_all_read`/`empty` |

## 11. Files Changed

| File | Change |
|---|---|
| `src/modules/notifications/components/NotificationBell.tsx` | Full rewrite: hand-rolled `absolute` dropdown + manual outside-click/Esc effects → `Popover`/`PopoverTrigger` (render)/`PopoverContent` (§2). All controls/behaviors preserved (§5). |
| `src/modules/notifications/components/NotificationCenter.tsx` | Root `div` and list `div` classNames changed to flex-fill (`flex flex-1 min-h-0 flex-col overflow-hidden` / `flex-1 min-h-0 overflow-y-auto divide-y`) so the "visual box" now lives on `PopoverContent` (§3). No other changes — `NotificationItem.tsx` untouched. |
| `src/modules/notifications/components/NotificationCenter.stories.tsx` | **New file** — `Default`/`MobileBottomSheet`/`Empty` stories via `NotificationBellDemo` (§4). |
| `scripts/check-stories-rendered.mjs` | Appended 3 entries to `ASSERT_STORIES` (`notifications-notificationcenter--default`, `--mobile-bottom-sheet`, `--empty`) (§4). |
| `docs/backlog.md` | "Last Session" updated to summarize Task 424; Epic II queue advanced to Task 323. |
| `docs/sessions/2026-06-14-task424-notification-bottom-sheet.md` | **New** — this session log. |

---

## 12. Confirmations

- **`NotificationItem.tsx` not opened/modified** — Task 319's locale-binding logic untouched.
- **No other popups touched** — scope limited to `NotificationBell`/`NotificationCenter`.
- **No data-layer/mutation changes** — `useNotifications`, `markAllNotificationsRead` untouched.
- **Desktop (`≥640px`) dropdown unchanged** — same visual box, now hosted on `PopoverContent`
  (§3/§6).
- **No new git commands run** by the executor (single-writer rule) — orchestrator to review diff
  and emit explicit-path commit commands.
- **Temporary scratch files (`scripts/_tmp-check-notif.mjs`, `scripts/_tmp-focus-test.mjs`)
  deleted** — not part of the diff.

Self-validation: tsc=0 · build OK · check:stories PASS · build-storybook OK · scoped
`screenshots:assert` (full 14-viewport × 4-locale matrix, 3 stories incl. `Empty`) 168/168 PASS —
uk@320/375/390 mandatory cells (36 total) all green, `popupBottomSheetAtMobile: true`,
`noHorizontalOverflow: true` · interaction-proof transcript (Esc + outside-click both close +
return focus to trigger) · clause-14 integrity clean (0 NUL, no BOM, tsc clean) · Note 20
inventory complete, all controls preserved + focus-return gained · NotificationItem.tsx
untouched · scope=clean.
