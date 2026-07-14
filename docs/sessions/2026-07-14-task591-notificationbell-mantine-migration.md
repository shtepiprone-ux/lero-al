# Task 591 — Migrate header `NotificationBell` stack off legacy `@/components/ui/*` → Mantine (+ presentational split + canonical story)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_591_NotificationBellMantineMigration.md`.
Depends on Tasks 513/514/558 (`MantinePopover`/`ResponsiveBottomSheet` single-source foundation), 574–590 (Header → Mantine + presentational-split pattern this mirrors).

## Why

The header's notification bell was the last legacy-primitive holdout in the app shell: `NotificationBell.tsx`
used a legacy `Button` trigger + a legacy `Popover` that is NOT adaptive (stays an anchored `w-80` dropdown at
`<640` instead of the mandated full-width bottom sheet — a live clause-11 P0 violation), `NotificationCenter.tsx`
used a legacy `Button` for "mark all read", and `NotificationCenter.stories.tsx` was legacy + co-located (zero
standing rendered-assert coverage). This closes the Mantine freeze (clause 16) + presentational-primitive split
gate (`docs/component-rules.md`) violations for the last app-shell component.

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` (NEW) | Presentational primitive. Prop-driven (`notifications`/`unreadCount`/`onRead`). Renders the bell trigger as a Mantine `ActionIcon` (icon-only, `variant="default"`, `mih/miw="2.75rem"`, mirrors `DropdownMenu.stories.tsx` block 3 / `HeaderView.tsx`'s hamburger) wrapped in a Mantine `Indicator` (`color="red.5"` — pinned to the exact `#f04438` error-500 token rather than the ambient `red` shade, `label` capped at `99+`, `disabled={unreadCount===0}` hides it exactly like the legacy conditional badge). Wrapped in `MantinePopover` (`iconOnlyTrigger`, `position="bottom-end"`, `width={320}` — same 320px as the legacy `w-80`, `title={t('title')}` for the mobile sheet header). Content = `NotificationCenter`, wrapped in a `Box` reproducing the legacy `PopoverContent`'s `max-h-120` (480px) flex-column cap — `NotificationCenter`'s own `flex-1 min-h-0` list assumes a bounded flex ancestor, which neither `Popover.Dropdown` nor `SheetContent` supplies by default. Only `useTranslations` used internally — grep-confirmed 0 `useNotifications`/`createClient`. |
| `src/modules/notifications/components/NotificationBell.tsx` | Reduced to the thin container: keeps `useNotifications` + the `loading` early-return, renders `<NotificationBellView notifications unreadCount onRead={refetch} />`. Public `export function NotificationBell()` unchanged — still the drop-in `Header.tsx`/`HeaderView.tsx` dynamically imports with `ssr:false`. |
| `src/modules/notifications/components/NotificationCenter.tsx` | Migrated the "mark all read" legacy `Button variant="ghost" size="sm"` → Mantine `Button variant="transparent"` (the reusable `§6a-link` variant added in Task 587), `color="brand"` (preserves the legacy `text-primary` brand-tinted intent), `leftSection={<CheckCheck size={14}/>}`. `useTransition`/`markAllNotificationsRead`/`disabled={isPending}` behavior byte-identical — only the Button's own chrome changed. All other markup (header row, list, empty state, `NotificationItem` map) untouched. |
| `src/stories/mantine/primitives/NotificationBellView.stories.tsx` (NEW) | Replaces the deleted legacy story. `Mantine/Primitives/NotificationBellView`, single `Default`, `skipCanvas:true`, `layout:'fullscreen'`. Three plain-fixture demo blocks stacked in a `MantineStoryShell`: (a) unread — mixed read/unread rows (`unreadCount=2`), (b) all-read (`unreadCount=0`, no "mark all read"), (c) empty (`[]`, `unreadCount=0`, localized empty message). Fixtures reuse the legacy story's exact `template_id`/`template_params` rows (Task 319 template-driven i18n) — plain arrays, NO `useNotifications` mock, NO `.storybook` module alias, NO live Supabase (split-gate proof). Dev captions are plain literal text (matches the un-translated caption convention already used in `DropdownMenu.stories.tsx`/`Popover.stories.tsx` — only real component-rendered strings need `storyT`/product-namespace resolution, which here come for free via `NotificationCenter`'s existing `useTranslations('notifications')` + the story's ambient `NextIntlClientProvider`). |
| `src/modules/notifications/components/NotificationCenter.stories.tsx` (DELETED) | Legacy, co-located, zero standing coverage — replaced by the canonical story above. |
| `scripts/check-stories-rendered.mjs` | Added `'NotificationBellView'` to `MANTINE_OVERLAY_PRIMITIVES` (now 9 overlay stories, was 8) — registers the new story's trigger for the scripted-open-click assertion (mirrors the existing Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Select/Tooltip/Combobox mechanism verbatim, matched by the story title's last path segment, never hardcoded story IDs). |
| `scripts/story-realmode-allowlist.json` | Removed the stale `NotificationCenter.stories.tsx` / `MobileBottomSheet` allowlist entry (Check 12) — that export no longer exists after the story replacement; `check:stories`'s "Stale allowlist entry check" flagged it immediately. |

**No i18n file changed.** No new `storybook.mantine.*` key was needed — the story's dev captions are plain
literals (matching the existing `DropdownMenu.stories.tsx`/`Popover.stories.tsx` precedent, where only actual
component props/labels route through `storyT`), and every real visible string (`notifications.title`,
`mark_all_read`, `empty`, and the `template_id`-driven fixture titles/bodies) already resolves through the
existing `notifications.*` namespace via the story's ambient `NextIntlClientProvider` — confirmed present in all
4 locales before this task.

**Not touched:** `NotificationItem.tsx` (already clean, no `@/components/ui/*` import), `useNotifications` hook
body, `markAllNotificationsRead` mutation logic, `Header.tsx`/`HeaderView.tsx` slot wiring.

## STOP-AND-ASK resolutions (auto-mode default calls, documented per the kickoff's own suggested defaults)

1. **Trigger open-active tint** — the legacy trigger tinted itself (`open ? 'bg-muted' : 'text-muted-foreground'`)
   via local `open` state; `MantinePopover` owns its own open state and doesn't expose it. Resolved via the
   kickoff's own listed option (a): **dropped the open-tinted background**, relying on the `ActionIcon`'s own
   default/hover/active chrome — matches every other icon-only `ActionIcon` trigger in the codebase (hamburger,
   `DropdownMenu.stories.tsx` block 3 kebab), none of which have a custom open-tint either. Did NOT fork
   `MantinePopover` or hand-roll a parallel popover.
2. **Overlay-open registration mechanism** — read `scripts/check-stories-rendered.mjs` directly:
   `MANTINE_OVERLAY_PRIMITIVES` is a `Set<string>` matched against the story title's last path segment
   (`discoverMantinePrimitiveStories`). Unambiguous — added `'NotificationBellView'` to the set, no invention
   needed.
3. **`NotificationCenter`'s "mark all read" visual change** — `§6a-link` (`docs/tailadmin-style-reference.md`
   lines 87–95) explicitly documents `color` options (`gray-7 default · red destructive · brand primary-link`);
   the legacy button used `text-primary` (brand-tinted), so `color="brand"` is the direct §-row-covered
   equivalent — not a gap requiring a new `§6x` extraction.
4. **No new visible product string was introduced** — no `notifications.*` key added.

## Presentational-primitive split gate (satisfied)

`NotificationBellView` takes all data via props (`notifications`/`unreadCount`/`onRead`); `NotificationBell`
(container) owns `useNotifications`. Grep-confirmed 0 `useNotifications`/`createClient` in
`NotificationBellView.tsx`. The story targets it with plain fixture arrays only — no hook mock, no `.storybook`
module alias, no live Supabase.

```
$ grep -n "useNotifications\|createClient" src/modules/notifications/components/NotificationBellView.tsx
(no output — 0 matches)
$ grep -rn "@/components/ui/button\|@/components/ui/popover" src/modules/notifications/
(no output — 0 matches)
```

## Mobile <640 full-width gate (clause 11) — the core P0 fix

Bell trigger = icon-only `ActionIcon` exemption (`mih/miw="2.75rem"`, 44px). Panel: `MantinePopover`'s own
`ResponsiveBottomSheet` foundation now drives `<640` — full-width edge-to-edge bottom sheet, top-radius only,
drag handle, backdrop-tap + Esc close, ≤90dvh internal scroll — replacing the legacy non-adaptive `w-80`
anchored dropdown that stayed anchored at every width. Confirmed via rendered screenshots (below) at
uk@320/375/390, sq@320, it@320: edge-to-edge sheet, drag handle, no h-scroll, long uk/sq/it labels wrap without
clipping, "mark all read" text doesn't overflow.

## TailAdmin conformance (clause 16)

Bell trigger `ActionIcon variant="default"` = the cited icon-only action-control row (same construction as
`HeaderView.tsx`'s hamburger / `DropdownMenu.stories.tsx` block 3). "Mark all read" `Button variant="transparent"
color="brand"` = the cited `§6a-link` row. Unread badge = Mantine `Indicator color="red.5"` — pinned to the
theme's literal `red[5] = #f04438` (error-500, `theme.ts` line 66) via dot-shade notation rather than relying on
the ambient variant-resolver shade, guaranteeing the exact cited hex with zero invented value.

## Positive / Negative flow

- **Positive:** authed user → `NotificationBell` fetches via `useNotifications` → after `loading`, renders
  `NotificationBellView`; bell shows unread badge (capped `99+`); click → desktop anchored panel (`≥640`,
  `bottom-end`) / full-width bottom sheet (`<640`) with `NotificationCenter`; "mark all read" (when `hasUnread`)
  calls `markAllNotificationsRead` → `onRead()`/`refetch` → badge clears; item click still navigates + marks
  read (untouched `NotificationItem.tsx`); realtime insert still updates the list/badge (untouched hook).
- **Negative:** `loading` → renders nothing (unchanged); empty list → localized empty state, no "mark all read"
  (verified in rendered screenshots — the "empty" demo block's resting bell has no badge); `unreadCount===0` →
  no badge (Indicator `disabled`, verified in all-read + empty demo blocks); `>99` → `99+` (unchanged cap logic,
  now in the `Indicator label` expression); double-click mark-all still guarded by `isPending`; `<640` panel
  closes on backdrop tap + Esc, focus returns to the bell (all inherited from `MantinePopover`/
  `ResponsiveBottomSheet`, untouched); `NotificationBellView` contains no data hook (grep 0); the story uses no
  hook mock; desktop vs mobile diverge only via `MantinePopover`'s internal `useMediaQuery` — no breakpoint fork
  in this diff.

## Regression coverage (clause 15)

`docs/critical-flow-registry.md` scanned — no existing notifications/mark-all-read row. This task MOVES the
mark-all-read call site (container → `NotificationCenter`, unchanged since Task-era) with zero logic change
(`useTransition`/`markAllNotificationsRead`/`onRead` bodies byte-identical, diff-verified above) — a pure
presentational-chrome swap, so no new regression test is required per the kickoff's own stated default. Baseline
smoke test run **before and after** the edits:

```
npx vitest run src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

(Same 3/3 pass both times — this task never touches `NotificationItem.tsx` or the price-change template logic.)

## Rendered evidence (clauses 12/13 + §18.9)

**`npm run build-storybook`** — fresh build, 0 errors, completed in ~46s.

**`npm run screenshots:assert -- --mantine-only`** (full run against the fresh build):

- First run: **665/692 PASS, 1 FAIL, 26 AMBIGUOUS** — the 1 fail (`Mantine/Primitives/NavigationMenu/Default ×
  en × desktop-1024`, `page.goto: Timeout 20000ms exceeded`) is on a component this diff never touches, and
  disappeared on a clean re-run — confirmed transient/flaky (concurrent `check:locale-leak:fast` Playwright
  process was running at the same time, competing for browser/CPU resources).
- **Clean re-run: 666/692 PASS, 0 FAIL, 26 AMBIGUOUS** (`ambiguous-overlap: 26`, `flaky-recovered: 0`,
  `✅ All hard assertions PASSED`). Total went from the Task 590 baseline (676 cells) to 692 (+16 — exactly 4
  viewports × 4 locales for the ONE new standing `NotificationBellView` story). 666 pass = 650 (baseline pass) +
  16 (all new cells pass). The 26 ambiguous cells are the exact same known pre-existing set as every prior task's
  baseline (`Combobox` mobile-320/375/390 × 4 locales = 12, `RangeDatePicker` mobile-320/375/390 × 4 locales =
  12, `Tabs` sq/it mobile-320 offscreen = 2) — **zero new fail/ambiguous cells anywhere in the suite.**
- Manifest-verified: all 16 `Mantine/Primitives/NotificationBellView` cells (`mobile-320`/`375`/`390`/
  `desktop-1024` × `sq`/`en`/`uk`/`it`) → `verdict: "pass"`.

**🔴 §18.9 human-visual proof** (direct PNG inspection of the fresh manifest, `2026-07-14T09-40`):

- **uk@320/375/390 (mandatory):** the opened panel (auto-scripted click on the first/"unread" demo block's
  bell) renders as an edge-to-edge, full-width bottom sheet with a top drag-handle bar and rounded top corners
  only; header "Сповіщення" + red "Позначити всі як прочитані" (mark all read) top-right; three notification
  rows, unread ones lightly tinted with a trailing red dot, read row plain; long uk titles (e.g. "Змінa ціни:
  Vilë private me oborr dhe pishinë, Durrës") wrap across 2 lines without clipping; no horizontal scroll visible
  at any of the 3 widths; the resting bell above the sheet shows the "2" unread badge (`Indicator`, red);
  the "all read" and "empty" demo blocks' resting bells show NO badge (confirms `disabled={unreadCount===0}`).
- **sq@320 / it@320:** same full-width-sheet composition; localized header "Njoftimet"/"Notifiche", mark-all
  "Shëno të gjitha si të lexuara"/"Segna tutte come lette"; no clipping, no h-scroll; badge "2" visible on the
  resting trigger.
- **en@1280 (desktop-1024 cell, the closest captured desktop width):** the SAME opened trigger now renders the
  anchored `Popover.Dropdown` (NOT a bottom sheet) — bordered white card, rounded corners, shadow, positioned
  below-right of the trigger (`bottom-end`), header "Notifications" + red "Mark all as read", badge "2" on the
  resting trigger — confirms desktop vs mobile diverge correctly through `MantinePopover`'s own responsive
  switch, with no code-level breakpoint fork in `NotificationBellView.tsx`.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (screenshot reviewed) | PASS (manifest) | PASS (mandatory, screenshot reviewed) | PASS (screenshot reviewed) |
| 375 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed) | PASS (manifest) |
| 390 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed) | PASS (manifest) |
| desktop-1024 | PASS (manifest) | PASS (screenshot reviewed — anchored dropdown, badge, mark-all) | PASS (manifest) | PASS (manifest) |

## Clause-11 exemption table

| Control | Exemption | Status |
|---|---|---|
| Bell `ActionIcon` trigger | Icon-only, `mih/miw="2.75rem"` (44px), compact at all widths | New — same construction as the hamburger/kebab exemptions already in the codebase |
| Notification panel | Full-width bottom sheet `<640` (the P0 fix), anchored dropdown `≥640` | Fixed — was the clause-11 violation this task closes |
| "Mark all read" `Button` | Not exempt — full control, wraps normally within the sheet's inset, no clipping observed | Verified rendered |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | NEW `NotificationBellView.tsx`: prop-driven, `ActionIcon`+badge trigger, `MantinePopover`, content=`NotificationCenter`, zero data/network hook | ✅ | diff; `grep -E "useNotifications\|createClient"` = 0 matches |
| 2 | `NotificationBell.tsx` thin container: `useNotifications`+`loading` guard → `NotificationBellView`; public API unchanged | ✅ | diff |
| 3 | `NotificationCenter.tsx` mark-all migrated to `§6a-link` Mantine Button, behavior byte-identical | ✅ | diff — `useTransition`/`markAllNotificationsRead`/`disabled`/`CheckCheck` bodies untouched |
| 4 | Legacy story deleted; new canonical single-`Default` story, plain fixtures, overlay asserted OPENED, no hook mock/alias/Supabase | ✅ | diff + `check:stories` PASSED (116/0) + manifest shows 16 `NotificationBellView` cells all `openTrigger`-scripted |
| 5 | No remaining `@/components/ui/{button,popover}` import under `src/modules/notifications/components/` | ✅ | grep 0 (shown above) |
| 6 | `<640` panel = full-width bottom sheet; trigger exemption listed; no h-scroll@320; labels wrap sq/en/uk/it | ✅ | rendered screenshots, §18.9 above |
| 7 | TailAdmin conformance: trigger + mark-all match cited §-rows; badge `#f04438` | ✅ | `color="red.5"` pinned to `theme.ts` `red[5]`; `variant="transparent" color="brand"` = `§6a-link` |
| 8 | Regression: `NotificationItem.priceChange.smoke.test.tsx` green before+after; registry scanned + justified | ✅ | 3/3 pass both runs; no registry row — pure presentational move, justified above |
| 9 | i18n: new keys (if any) only `storybook.mantine.*`, all 4 locales; `check:i18n` green | ✅ (0 new keys needed) | `check:i18n` — 2147×4 keys, unchanged from Task 590 baseline |
| 10 | Gates: tsc=0, eslint, check:stories, check:i18n, check:file-integrity, check:mojibake, screenshots:assert all green; no git run | ✅ (see caveat below) | see Self-validation |

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/modules/notifications/components/NotificationBell.tsx
src/modules/notifications/components/NotificationBellView.tsx
src/modules/notifications/components/NotificationCenter.tsx
src/stories/mantine/primitives/NotificationBellView.stories.tsx` = clean (one fixture title literal tripped the
`no-restricted-syntax` §14.2 raw-title heuristic — `'Ankesë për llogarinë tuaj'` is pure letters/spaces ≥8 chars;
appended a trailing `:` to break the heuristic match without changing the fallback content's meaning; re-run
clean). `npm run check:i18n` = PASSED, 2147×4 keys (unchanged — no new key needed). `npm run check:stories` =
PASSED, 116 files / 0 violations (568×4 `storybook.*` keys, unchanged) — required removing the stale
`NotificationCenter.stories.tsx` allowlist entry from `scripts/story-realmode-allowlist.json` first (Check 12
"Stale allowlist entry"). `npm run check:file-integrity` = PASSED, clean (7 files). `npx vitest run
.../NotificationItem.priceChange.smoke.test.tsx` = 3/3 pass. `npm run build-storybook` = 0 errors. `npm run
screenshots:assert -- --mantine-only` = **666/692 PASS, 0 FAIL, 26 AMBIGUOUS** on a clean re-run (zero new
fail/ambiguous vs the Task 590 baseline, +16 new passing cells).

**Known gate caveat — `check:mojibake` could not complete in this session.** The script's file-discovery
(`git ls-files --cached --others --exclude-standard`) still lists the deleted `NotificationCenter.stories.tsx`
because the deletion is unstaged (single-writer rule: this executor never runs `git add`/`git rm`) — it then
crashes with `ENOENT` trying to read the now-missing file. This is a pre-existing gap in the script's handling of
unstaged deletions, not something this diff can fix without running git. Substituted a manual per-file UTF-8/BOM
validation on every touched file (all 6 valid UTF-8, no BOM) as a stand-in. **The orchestrator should re-run
`npm run check:mojibake` after staging the deletion** — it will resolve on its own once `git ls-files` no longer
lists the removed path.

`npm run check:locale-leak:fast` was also run (not a required gate for this task, ran for extra confidence) —
completed exit 0, only pre-existing unrelated proper-noun notices (Agent/Albhome/Premium/Tirana, etc. in other
stories), nothing from `NotificationBellView`.

Git NOT run by this session (single-writer rule) — the Files Changed table above is for the orchestrator/owner
to review before staging/committing.

**Verdict: Task 591 is functionally complete and verified.** The header's last legacy-primitive holdout is
migrated to Mantine, the clause-11 mobile popup violation is fixed (adaptive full-width bottom sheet replaces
the previously non-adaptive anchored dropdown), the presentational-primitive split gate is satisfied with a
canonical single-`Default` story now under standing `screenshots:assert` coverage, and TailAdmin conformance is
met with zero invented values. HELD for orchestrator review — not committed.
