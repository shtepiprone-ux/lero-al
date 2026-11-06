# Task 591 — Migrate the header NotificationBell stack off legacy `@/components/ui/*` → Mantine (+ presentational split + canonical story)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — Mantine migration + presentational-primitive split + Storybook + server-action-adjacent (mark-all-read). Owner-directed 2026-07-13 (owner spotted the notification bell is still non-Mantine in the site header).
**Depends on:** Tasks 513/514/558 (`MantinePopover` + `ResponsiveBottomSheet` single-source foundation), 574–590 (Header → Mantine + presentational-split pattern this mirrors).

## Why

The header's notification bell is the last legacy-primitive holdout in the app shell. `Header.tsx` (thin container, Task 590) passes `<NotificationBell/>` in as `notificationSlot`, so the shell is Mantine but the bell inside it is NOT. Confirmed holdouts (orchestrator-verified 2026-07-13):

- `src/modules/notifications/components/NotificationBell.tsx` — trigger is a legacy `Button` from `@/components/ui/button` (line 7); dropdown is a legacy `Popover/PopoverContent/PopoverTrigger` from `@/components/ui/popover` (line 8). **The legacy `Popover` is NOT adaptive** — at `<640` it stays an anchored `w-80` dropdown instead of the mandated full-width bottom sheet → a live **clause-11 (mobile full-width popup) P0 violation** in the header.
- `src/modules/notifications/components/NotificationCenter.tsx` — legacy `Button` (line 6) for the "mark all read" action.
- `src/modules/notifications/components/NotificationCenter.stories.tsx` — legacy `Button` + `Popover`, and co-located (NOT under `Mantine/Primitives/*`), so it has **zero standing rendered-assert coverage**.

This violates the **Mantine freeze** (agent-contract clause 16 — Mantine is the source of truth for all UI) and the **presentational-primitive split gate** (`NotificationBell` consumes the `useNotifications` data hook but has no prop-driven presentational primitive and no canonical story). `NotificationItem.tsx` is already clean (no `@/components/ui/*` import) — leave it alone.

## Pre-read (rule-index → UI / layout / component + Storybook/visual + DB/server-action for mark-all-read)

- `docs/agent-contract.md` (clauses **1, 3, 5, 11, 12, 13, 15, 16**) + `docs/backlog.md` + `docs/critical-flow-registry.md` — **scan for a notifications / mark-all-read flow**; if a row exists, baseline its test before the change; if the mark-all-read realtime-refresh path is not yet a row and you change its wiring, you are only MOVING the call (no logic change) so no new row is required — but record the baseline of `src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` green before+after.
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §8 (Mantine story proof path: single `Default`, `skipCanvas`, toolbar-driven viewport/locale), §12 (canonical patterns), **§18 (theming pitfalls)**, §18.9 (icon/overlap human-visual).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — the bell trigger (icon-only `ActionIcon`) and the "mark all read" button must match their authoritative §-rows (icon-only action control + `§6a` Button / `§6a-link` tertiary). If a needed chrome is not yet an authoritative row, **extract it from the zip into a new `§6x` row FIRST** — do not invent.
- `docs/component-rules.md` → **"Container / Presentational Primitive Split"** (the rule being satisfied), `docs/ui-rules.md` (§15 control-height, §17 pre-flight), `docs/qa-rules.md`, `docs/storybook-governance.md` (§14 `check:stories`), `docs/storybook-visual-snapshots.md`.
- **Reference implementations to MIRROR:** `src/design-system/mantine/patterns/MantinePopover.tsx` (the canonical adaptive popover — read its prop API: `trigger`, `children` or `(close)=>children`, `iconOnlyTrigger`, `title`, `position`, `width`, `offset`); `src/components/layout/UserMenu.tsx` + `src/components/layout/MobileNavDrawer.tsx` (container → prop-driven primitive + canonical single-`Default` story); `src/stories/mantine/primitives/DropdownMenu.stories.tsx` block 3 (canonical icon-only `ActionIcon variant="default"` 2.75rem/44px trigger) and `HeaderView.tsx` lines 148–157 (the hamburger `ActionIcon` pattern).

## Files in scope

1. **NEW `src/modules/notifications/components/NotificationBellView.tsx`** — the presentational primitive. Prop-driven: `notifications: Notification[]`, `unreadCount: number`, `onRead: () => void`. Renders the bell **trigger** (Mantine `ActionIcon`, icon-only) with the unread badge, wrapped in **`MantinePopover`** (`iconOnlyTrigger`, `position="bottom-end"`, `title` = notifications title for the mobile sheet), whose content is `<NotificationCenter notifications={notifications} onRead={onRead} />`. MAY use `useTranslations` (i18n) only — **NO `useNotifications`, `createClient`, or any Supabase/data hook** (grep-confirm 0).
2. **EDIT `src/modules/notifications/components/NotificationBell.tsx`** — reduce to the THIN container: keeps `useNotifications` + the `loading` early-return, renders `<NotificationBellView notifications={notifications} unreadCount={unreadCount} onRead={refetch} />`. Public `export function NotificationBell()` — NO signature change (still the drop-in the `Header.tsx` container dynamically imports with `ssr:false`).
3. **EDIT `src/modules/notifications/components/NotificationCenter.tsx`** — migrate the "mark all read" legacy `Button variant="ghost" size="sm"` → the Mantine tertiary/link Button (`§6a-link` `transparent` variant, the reusable one added in Task 587) OR a Mantine `ActionIcon`+text per the §-row you cite; keep `CheckCheck` icon, `handleMarkAll`/`useTransition`/`markAllNotificationsRead`/`disabled={isPending}` behavior byte-identical. All other markup (header row, list, empty state, `NotificationItem` map) unchanged.
4. **REPLACE the legacy story** — delete `src/modules/notifications/components/NotificationCenter.stories.tsx` and add **NEW `src/stories/mantine/primitives/NotificationBellView.stories.tsx`**: title `Mantine/Primitives/NotificationBellView`, single `Default`, `skipCanvas:true`, `layout:'fullscreen'`. Fixtures (plain arrays, NO Supabase): (a) unread set (`unreadCount>0`, mixed read/unread), (b) all-read, (c) empty (`[]`, `unreadCount=0`). Because this is an OPEN-state overlay, register the story in the rendered-assert harness's overlay-open set so the popover/bottom-sheet is asserted OPENED via scripted click (mirror how the existing 8 overlay stories are wired in `scripts/check-stories-rendered.mjs` — **STOP-AND-ASK if the registration mechanism is unclear rather than inventing a new one**).
5. **EDIT `messages/{sq,en,uk,it}.json`** — add any `storybook.mantine.*` caption/fixture key(s) needed, all four locales, same key set. The real notification strings resolve from the existing `notifications.*` namespace via the story's `NextIntlClientProvider` — NO new product `notifications.*` key unless a genuinely new visible string is introduced (if so, STOP-AND-ASK).

**MUST NOT touch:** `NotificationItem.tsx` (already clean), the `useNotifications` hook body, `markAllNotificationsRead` mutation logic, `Header.tsx`/`HeaderView.tsx` (the slot wiring is already correct), any unrelated legacy-button file. If migrating `NotificationCenter`'s button forces a visual change you can't match to a §-row, STOP AND ASK.

## Current behavior to PRESERVE / required after-behavior

- **Preserve:** the bell icon + **unread badge** (count, `99+` cap at `>99`, error/`#f04438` semantic color), the `loading` early-return (renders nothing until first fetch), opening the panel shows `NotificationCenter` (title, "mark all read" when `hasUnread`, list or empty state), `onRead`/`refetch` after mark-all / item-read, realtime updates via `useNotifications` (unchanged).
- **Required after:** identical desktop behavior (anchored dropdown, `align end`); **NEW correct `<640` behavior = full-width bottom sheet** (edge-to-edge, top-radius, drag handle, ≤90dvh scroll, backdrop-tap + Esc close, focus return) via `MantinePopover` — this is the P0 fix, not a regression. Mark-all-read and item navigation fire exactly as today.
- **Known trigger-active-state note:** the legacy trigger styled itself on `open` (`open ? 'bg-muted' : 'text-muted-foreground'`) using local `open` state. `MantinePopover` owns its own open state and does not expose it to the trigger. **STOP-AND-ASK:** either (a) drop the open-tinted background (rely on `ActionIcon` hover/active chrome), or (b) request an exposed open-state hook — do NOT fork `MantinePopover` or hand-roll a parallel popover to keep the tint.

## Presentational-primitive split gate (the rule being satisfied)

`NotificationBellView` takes ALL data via props (`notifications`/`unreadCount`/`onRead`); `NotificationBell` (container) owns `useNotifications`. The story targets `NotificationBellView` with **plain fixture arrays** — NO `useNotifications` mock, NO `.storybook` module alias, NO live Supabase. A hook mock in the story = the split was skipped → task incomplete.

## Mobile <640 full-width gate (clause 11) — this is the core P0 fix

The bell **trigger** is an icon-only exemption (`ActionIcon`, ≥44px `mih/miw="2.75rem"`) — list it in the exemption table. The **panel** MUST become the full-width bottom sheet at `<640` (edge-to-edge, top-radius only, drag handle, backdrop-tap + Esc close) via `MantinePopover` — the legacy `w-80` anchored dropdown at `<640` was the violation. The "mark all read" control and the `NotificationCenter` rows must not clip or h-scroll at 320; long uk/it labels wrap.

## TailAdmin conformance (clause 16)

Bell trigger `ActionIcon` and the "mark all read" Button must match their cited `tailadmin-style-reference.md` §-rows (icon-only action + `§6a`/`§6a-link`); unread badge = semantic error `#f04438`. Zero invented color/px/radius/shadow. Rendered side-by-side vs the reference at the canonical breakpoints × locales — `tsc=0`/gate-green is NOT style proof.

## Positive / Negative flow

- **Positive:** authed user → `NotificationBell` container fetches via `useNotifications` → after `loading`, renders `NotificationBellView`; bell shows unread badge; click → desktop anchored panel (`≥640`) / full-width bottom sheet (`<640`) with `NotificationCenter`; "mark all read" (when `hasUnread`) calls `markAllNotificationsRead` → `onRead()`/`refetch` → badge clears; clicking an item navigates + marks read; realtime insert updates the list/badge live.
- **Negative:** `loading` → renders nothing (unchanged); empty list → localized empty state, no "mark all read"; `unreadCount===0` → no badge; `>99` → `99+`; double-click mark-all guarded by `isPending`; `<640` panel closes on backdrop tap AND Esc, focus returns to the bell; `NotificationBellView` contains NO data hook (grep 0); the story uses NO hook mock; desktop vs mobile diverge only via `MantinePopover`'s internal `useMediaQuery` (no breakpoint fork in this code).

## Regression coverage (clause 15)

Scan `docs/critical-flow-registry.md` for a notifications / mark-all-read row. Baseline `npx vitest run src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` green BEFORE + AFTER. This task MOVES the mark-all-read call site (container→primitive) without changing its logic; if the registry lacks a notifications-panel row and you judge the panel a critical flow, ADD a row + a smoke test asserting the panel opens and "mark all read" fires the mutation — otherwise record why a new test is not required (pure presentational move) with the baseline pass.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- `npm run screenshots:assert -- --mantine-only` before/after — the NEW `Mantine/Primitives/NotificationBellView/Default` OPEN-state cells must PASS (or land as a documented known-ambiguous overlay-backdrop cell like the existing Combobox/RangeDatePicker set — but the PANEL itself must be full-width at `<640`); zero NEW fail/ambiguous elsewhere vs the current 650/676/0/26 baseline.
- 🔴 §18.9 human-visual at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280**: (a) `<640` panel is edge-to-edge full-width bottom sheet with drag handle, rows not clipped, "mark all read" not overflowing; (b) `≥640` anchored dropdown unchanged; (c) unread badge legible, `99+` cap; (d) icon does not overlap text (§18.9); no h-scroll at 320; labels wrap.
- Rendered matrix (breakpoints × sq/en/uk/it) with real per-cell evidence; uk@320/375/390 mandatory.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. NEW `NotificationBellView.tsx`: prop-driven (`notifications`/`unreadCount`/`onRead`), Mantine `ActionIcon` trigger + unread badge, `MantinePopover` (`iconOnlyTrigger`, `position="bottom-end"`, `title`), content = `NotificationCenter`; NO data/network hook (grep 0 `useNotifications`/`createClient`). *(diff)*
2. `NotificationBell.tsx` reduced to thin container: `useNotifications` + `loading` guard → renders `<NotificationBellView .../>`; public API unchanged. *(diff)*
3. `NotificationCenter.tsx` "mark all read" migrated to the cited Mantine Button (`§6a-link`) — behavior byte-identical (`useTransition`/`markAllNotificationsRead`/`disabled`/`CheckCheck`). *(diff)*
4. Legacy `NotificationCenter.stories.tsx` deleted; NEW canonical `Mantine/Primitives/NotificationBellView.stories.tsx` — single `Default`, plain fixtures (unread/all-read/empty), overlay asserted OPENED, NO hook mock/module alias/live Supabase. *(diff + `check:stories`)*
5. No remaining `@/components/ui/{button,popover}` import anywhere under `src/modules/notifications/components/` (grep 0). *(diff)*
6. `<640` panel is the full-width bottom sheet (clause 11 fix); bell trigger icon-only exemption listed; no h-scroll at 320; labels wrap sq/en/uk/it. *(clause 11 + rendered)*
7. TailAdmin conformance: trigger + mark-all button match cited §-rows; unread badge `#f04438`; rendered side-by-side. *(clause 16 + rendered)*
8. Regression: `NotificationItem.priceChange.smoke.test.tsx` green before+after; registry scanned + row added-or-justified. *(clause 15, transcript)*
9. i18n: any new key only under `storybook.mantine.*`, all four locales, same key set; `check:i18n` green. *(diff + transcript)*
10. Gates: `tsc=0`, `eslint`, `check:stories`, `check:i18n`, `check:file-integrity`, `check:mojibake`, `screenshots:assert -- --mantine-only` all green; §18.9 + before/after set + rendered matrix + Files-Changed table + AC-by-AC self-audit in the session log. **Do NOT run `git add`/`git commit` — HELD for orchestrator review.** *(transcript)*

## STOP-AND-ASK (resolve before inventing)

- The trigger open-active tint (legacy `open ? bg-muted`) — `MantinePopover` owns open state; ASK whether to drop the tint or expose an open hook. Do NOT fork `MantinePopover`.
- The overlay-open registration in `scripts/check-stories-rendered.mjs` (adding `NotificationBellView` to the scripted-open set) — mirror the existing 8 overlay stories; ASK if the mechanism isn't obvious.
- If migrating `NotificationCenter`'s "mark all read" to a §-row Button changes its look in a way no existing §-row covers — ASK (extract a §6x row from the zip first, don't invent).
- If any new visible product string is required — ASK before adding a `notifications.*` key.

## Out of scope

`NotificationItem.tsx` (already clean); `useNotifications` hook internals; `markAllNotificationsRead` mutation logic; `Header.tsx`/`HeaderView.tsx` slot wiring; email templates under `lib/emails/`; any unrelated legacy-primitive file.
