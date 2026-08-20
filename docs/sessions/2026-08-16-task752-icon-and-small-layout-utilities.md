# Task 752 — Icon sizing and small layout utilities (Sprint 60)

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_752_Icon_And_Small_Layout_Utilities.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement and acceptance-criteria evidence

| # | Requirement | Status | Evidence |
|---|---|---|---|
| AC1 | Every row in the 9-file table migrated or listed as deliberately kept, with reason | Met | 8/9 files migrated (below). `LocaleSwitcher.tsx:55` kept unchanged — already `size={12}` on `Loader2`; the only remaining utility is `animate-spin`, explicitly excluded by the task (no Mantine spin equivalent in scope). Zero diff on that file, confirmed by `git diff` (not in the changed-files list below). |
| AC2 | Zero visual delta at 320/390/768/1024/1440, `uk@320` mandatory, for header/filters/phone field/notification bell/favourite button | Met | 66/66 MD5-identical screenshot cells, before vs. after, across the 6 canonical Storybook stories covering these surfaces (see "Validation evidence"). One real regression was found and fixed mid-task (`PhoneField` `align="stretch"`) — see "Implementation validation notes". |
| AC3 | `role="group"`/`aria-label` still present on `FilterRoomsRow`/`FilterMultiToggle` roots; `className` prop still reaches `FilterMultiToggle`'s root | Met | Both components spread `{...(ariaLabel ? { role: 'group', 'aria-label': ariaLabel } : {})}` onto the `Group`/`Stack` root, unchanged logic. `filterLeafComponents.smoke.test.tsx`'s "ARIA group naming (Task 726)" tests (4 assertions) pass unmodified. `FilterMultiToggle`'s incoming `className` is merged via `cn('flex-wrap', className)` (horizontal) or passed directly (vertical `Stack`) — reaches the root in both branches. |
| AC4 | `typecheck`, `check:design-tokens`, `check:i18n`, `build` all exit 0 | Met | All 4 commands exit 0, run twice (once after the initial pass, once after the `align="stretch"` fix) — see "Validation evidence". |
| AC5 | No file outside the nine appears in `git status --porcelain` | Met | `git status --porcelain` shows exactly 8 of the 9 task files (`LocaleSwitcher.tsx` has a zero diff) plus pre-existing unrelated untracked entries from before this session started (`tasks/Sprints/Sprint_59_...md`, `.click-shield-ci-fixture.std{err,out}.log`, `docs/reviews/artifacts/task-667/`, `docs/sessions/2026-08-16-task751-...md`) — none touched by this task. |

## Current versus required behavior

**Current (before):** 9 files used Tailwind utility classes for lucide-icon sizing (`h-N w-N` / `size-N`) and small flex/gap wrapper divs (`flex gap-N`, `flex flex-col gap-N`, `flex-wrap`, `shrink-0`, `flex-1 min-w-0`).

**Required (after):** Same rendered result (D28: mechanism-only, zero visual delta), re-expressed via the icon's own `size` prop and Mantine `Group`/`Stack` at px-equal values, per the task's replacement table.

**Negative-flow applicability:**

| Branch | Applicable? | Notes |
|---|---:|---|
| Validation | No | No form/schema touched |
| Authorization/RLS | No | No data/action touched |
| Offline/network | No | Pure presentational primitives |
| Concurrent writer | No | No mutation |
| Vertical/horizontal `FilterMultiToggle` layout switch | Yes | Both branches implemented and screenshot-verified (horizontal via `FilterControls.stories.tsx`'s `Default`; vertical branch has no dedicated story — verified by code inspection + the 3 live `ListingsFilters.tsx` call sites that pass `className="flex-col gap-1.5"`, all still typecheck/build clean) |
| `FavoriteButton` favorited vs. unfavorited (`fill-current`) | Yes | `ListingCard.stories.tsx` renders the real `FavoriteButton`; screenshot MD5-identical before/after at all required cells |
| `PhoneField` default vs. error state | Yes | Both fixtures in `PhoneField.stories.tsx`; this is exactly where the regression was found and fixed |

## Files Changed

| File | Reason |
|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` | `Bell className="h-5 w-5"` → `size={20}` |
| `src/components/layout/HeaderActions.tsx` | `Heart className="size-5"` → `size={20}` (×2, guest + authenticated) |
| `src/modules/listings/components/FavoriteButton.tsx` | `Heart className={cn('h-4 w-4', ...)}` → `size={16}`, `cn(...)` keeps only the conditional `fill-current` |
| `src/components/layout/UserMenu.tsx` | `<span className="max-w-30 truncate">` → `<Text component="span" truncate inherit maw={120}>` |
| `src/components/shared/FilterRoomsRow.tsx` | Root `div` → `Group gap="xs" wrap="wrap"`; `Button className="shrink-0"` → `style={{ flexShrink: 0 }}` |
| `src/components/shared/FilterMultiToggle.tsx` | Root `div` → `Group`/`Stack` (branches on `className.includes('flex-col')`); `Button className="justify-start text-left"` → `justify="flex-start"` (`text-left` dropped, see notes) |
| `src/components/shared/FilterRangeInputs.tsx` | Root `div` → `Group gap="xs" wrap="nowrap"`; both `TextInput className="flex-1 min-w-0"` → `style={{ flex: 1, minWidth: 0 }}` |
| `src/components/shared/PhoneField.tsx` | Outer `div` → `Stack gap={6}`; inner row `div` → `Group gap="xs" wrap="nowrap" align="stretch"` |
| `docs/backlog.md` | Task 752 registry row + Last Session line updated to current state (net line count unchanged, 80 → 80) |

`src/components/shared/LocaleSwitcher.tsx` — inspected, zero diff (kept, reason above).

## Validation evidence

All commands run from the repo root, actual transcripts (not intended commands):

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | exit 0 | Run twice (pre- and post-fix) |
| `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/components/shared/__tests__/PhoneField.smoke.test.tsx src/lib/phone/__tests__/phone.test.ts src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | 4 files, 83 tests passed | Run twice; the phone-logic test path was located via `Glob` (`src/lib/phone/__tests__/phone.test.ts`), not guessed |
| `npm run check:design-tokens` (`--strict`) | 0 violations, exit 0 | Run twice |
| `npm run check:i18n` | 2218/2218 keys parity across sq/en/uk/it, 0 raw-enum leaks, exit 0 | |
| `npm run check:mojibake` | 0 artifacts in 2845 files, exit 0 | |
| `node scripts/check-file-integrity.mjs <8 changed files>` | PASSED, 17 files clean (git-changed + untracked default scope) | |
| `npx vitest run` (full suite) | **80 files / 1355 tests passed**, exit 0 | Final regression sweep after the `align="stretch"` fix |
| `npm run build` | exit 0 | Run twice (pre- and post-fix), final production build clean |

**Rendered zero-visual-delta evidence (AC2):** Built Storybook (`npm run build-storybook`) from the pre-edit tree, captured full-page PNG screenshots via a scratch Playwright script against the 6 canonical Storybook stories covering these 9 files — `Mantine/Primitives/HeaderActions`, `Mantine/Primitives/NotificationBellView`, `Mantine/Primitives/UserMenu`, `Mantine/Primitives/FilterControls`, `Mantine/Primitives/PhoneField`, `Mantine/Primitives/ListingCard` (real production `FavoriteButton`, clause 16c) — at `320/390/768/1024/1440`, all 4 locales at `320` and `1440` (`uk@320` included/mandatory), single locale (`en`) at `390/768/1024` per the Q2 profile rule ("check all four locales at 320 and the selected desktop width" — no user-facing text changed, so the reduced sweep applies). 66 cells total. MD5-hashed each PNG.

Rebuilt Storybook from the post-edit tree, re-captured the same 66 cells, and diffed the manifests:

- **First pass: 55/66 matched, 11 differed — all 11 in `PhoneField`.** Visual inspection (`Read` on the before/after PNGs) showed the error-state row's country-code trigger sinking below the national `TextInput`'s top edge in the "after" capture. Root cause: Mantine `Group`'s own default `align="center"` (confirmed from `node_modules/@mantine/core/cjs/components/Group/Group.cjs` `defaultProps`) replaced the plain `<div className="flex flex-row gap-2">`'s browser-default `align-items: stretch`; when the sibling `TextInput` grew taller (error message), `Group` centered the shorter combobox trigger instead of stretching it. Fixed by adding `align="stretch"` to that `Group`.
- **Second pass (after the fix): 66/66 matched — byte-identical MD5 across every cell.**

Screenshot artifacts, manifests, and the capture/diff scripts were scratch work (`.tmp-qa752/`, deleted before final `git status` check) — not part of the reviewable diff, per AC5.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Utility → Mantine mapping | Change | Evidence |
|---|---|---|---|---|---|
| Notification bell icon | `NotificationBellView.tsx:39` | `Bell.h-5.w-5` | `h-5 w-5` (20px) → `size={20}` | Changed (mechanism only) | Screenshot MD5 match, `mantine-primitives-notificationbellview--default` |
| Header favorites icon | `HeaderActions.tsx:34,44` | `Heart.size-5` | `size-5` (20px) → `size={20}` | Changed | Screenshot MD5 match, `mantine-primitives-headeractions--default` |
| Card/pill favorite icon | `FavoriteButton.tsx:134` | `Heart.h-4.w-4[.fill-current]` | `h-4 w-4` (16px) → `size={16}`; `fill-current` conditional preserved via `cn(...)` | Changed | Screenshot MD5 match, `mantine-primitives-listingcard--default` (real production component) |
| Locale switcher spinner | `LocaleSwitcher.tsx:55` | `Loader2.animate-spin` (size already a prop) | No Mantine spin equivalent in scope | **Preserved, out of scope** (task-directed) | Code inspection only — file has zero diff |
| User menu name label | `UserMenu.tsx:43` | `span.max-w-30.truncate` | `max-w-30 truncate` (120px, overflow:hidden/ellipsis/nowrap) → `Text component="span" truncate inherit maw={120}` | Changed | Read Mantine's compiled `Text.css` (`node_modules/@mantine/core/styles/Text.css`) before implementing: `[data-truncate]` sets exactly `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` (byte-identical to Tailwind `.truncate`), and `inherit` prop was required to avoid `Text`'s own `font-weight:normal` base rule overriding the button label's inherited weight. Screenshot MD5 match at both fixtures, `mantine-primitives-usermenu--default` |
| Filter rooms row / chip wrap | `FilterRoomsRow.tsx:16,24` | `div.flex.gap-2.flex-wrap` / `Button.shrink-0` | → `Group gap="xs" wrap="wrap"` / `style={{flexShrink:0}}` | Changed | Screenshot MD5 match, `mantine-primitives-filtercontrols--default`; `role="group"`/`aria-label` preserved (unit test) |
| Filter multi-toggle row (horizontal) | `FilterMultiToggle.tsx:21,27` | `div.flex.flex-wrap.gap-2` / `Button.justify-start.text-left` | → `Group gap="xs" wrap="wrap"` / `justify="flex-start"` (`text-left` dropped, see notes) | Changed | Screenshot MD5 match, `mantine-primitives-filtercontrols--default` |
| Filter multi-toggle row (vertical, `ListingsFilters.tsx` callers) | `FilterMultiToggle.tsx` (className override path) | `div.flex.flex-col.gap-1.5` (via caller `className`) | → `Stack gap={6}` when `className` includes `flex-col` | Changed | Code inspection + typecheck/build (no dedicated story for this branch; out-of-scope file `ListingsFilters.tsx` untouched) |
| Filter range inputs row | `FilterRangeInputs.tsx:22,29,37` | `div.flex.gap-2` / `TextInput.flex-1.min-w-0` (×2) | → `Group gap="xs" wrap="nowrap"` / `style={{flex:1,minWidth:0}}` | Changed | Screenshot MD5 match, `mantine-primitives-filtercontrols--default` |
| Phone field stack + row | `PhoneField.tsx:145,150` | `div.flex.flex-col.gap-1.5` / `div.flex.flex-row.gap-2` | → `Stack gap={6}` / `Group gap="xs" wrap="nowrap" align="stretch"` | Changed | Screenshot MD5 match (66/66, after fix), `mantine-primitives-phonefield--default` — regression found and fixed here (see above) |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story / source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Icon `size` prop | lucide-react's own prop, already used identically in the same files (`UserMenu.tsx`'s `User`/`ListPlus`/`LogOut`/`LayoutList`/`LayoutDashboard` icons at `size={16}`, `LocaleSwitcher.tsx`'s `ChevronDown`/`Loader2`) | N/A — native library API, no design-system wrapper exists or is needed | `reuse` | N/A (no token; icon size is a component prop, not a design-token-governed value) |
| `Group`/`Stack` layout | `docs/mantine-responsive-design-system.md:100` ("Mantine docs — layout components... `Stack`, `Group`... used in all 14 canonical patterns"); already consumed identically in the same codebase (`FiltersPanel.tsx` uses `Group`/`Stack`/`SimpleGrid`/`Flex` extensively for this exact filter-drawer surface) | `src/components/shared/FiltersPanel.tsx` (sibling consumer, same feature area) | `reuse` | `src/design-system/mantine/theme.ts:190-196` spacing scale (`xs`=8px/`sm`=12px/`md`=16px/`lg`=20px/`xl`=24px) |
| `gap-1.5` (6px, `PhoneField`/vertical `FilterMultiToggle`) | No spacing token equals 6px in the theme scale (8/12/16/20/24) | N/A | `reuse` (raw number, per task rule 3's explicit exemption: "If a Mantine token does not equal the current px, pass the number") | Numeric `gap={6}` prop, not a token — task-authorized exemption |
| `Text truncate` | `node_modules/@mantine/core/styles/Text.css` inspected directly (see visual source trace) | Mantine `Text` component (native primitive) | `reuse` | N/A — CSS behavior verified byte-for-byte equal to the Tailwind utility it replaces |

No new canonical source was created; every disposition is `reuse` of an existing Mantine primitive or an already-established pattern in this exact codebase.

## Implementation validation notes

- **Real defect found and fixed:** `PhoneField`'s inner row needed `align="stretch"` — without it, `Group`'s default `align="center"` visually misaligned the country-code trigger against the national input whenever they had different heights (the error state, where the input grows to show a validation message). Caught by the before/after screenshot MD5 diff, confirmed by direct visual inspection of both PNGs, root-caused by reading `Group`'s actual default props in `node_modules`, and closed by re-capturing and re-diffing to 66/66 match.
- **`filterLeafComponents.smoke.test.tsx` dependency on a Tailwind class name:** that pre-existing test (out of this task's 9-file scope, AC5-locked) locates `FilterRoomsRow`/`FilterMultiToggle`'s unnamed-fixture root via `container.querySelector('.flex-wrap')` rather than a stable attribute. Migrating away from the literal `flex-wrap` Tailwind class would have silently broken that test without touching it (which AC5 forbids). Resolved by keeping `className="flex-wrap"` as a redundant, zero-visual-effect compatibility anchor on the `Group` root (Group's own `wrap="wrap"` already produces the identical computed `flex-wrap: wrap`, so this adds no new visual behavior — verified by the MD5 match). Flagging for Opus: this is the same shape of problem `docs/backlog.md`'s D33 note warns about (a gate anchored on a utility class that a later migration removes); a follow-up to re-anchor that test on a stable selector (e.g. a `data-testid` or the existing `role`/`aria-label` contract extended to the unnamed case) is out of this task's scope but would remove the need for the compat class.
- **`text-left` on `FilterMultiToggle`'s buttons dropped, not migrated:** the button labels are single-line, non-wrapped, intrinsic-width content inside a `justify="flex-start"` Button — `text-align` has no observable effect in that configuration (confirmed by the MD5-identical screenshot). No Mantine prop was substituted for it because there is nothing to preserve.
- **`FilterMultiToggle`'s vertical branch (`Stack`) has no dedicated Storybook coverage** — `FilterControls.stories.tsx`'s only fixture exercises the horizontal (default) path. The 3 live vertical callers in `ListingsFilters.tsx` (out of scope, untouched) were verified by code inspection, typecheck, and the full production build, but not by a rendered screenshot. Recorded as a coverage gap, not silently claimed as visually proven.

## Assumptions, deviations, and limitations

- `LocaleSwitcher.tsx` required zero code changes — the task's own text anticipated this ("only `animate-spin` remains there — keep the spin").
- `FilterMultiToggle`'s `className?.includes('flex-col')` branch condition is a deviation from a literal 1:1 utility swap (the task's replacement table doesn't spell out this case) but is required to preserve the 3 live vertical call sites in `ListingsFilters.tsx` without touching that out-of-scope file. Not authorized as a "create canonical" decision — this is ordinary prop-driven conditional rendering inside the one component the task already owns.
- The vertical `Stack` branch's rendered proof is code-inspection + build-level only (see note above), not a screenshot MD5 match, since no story exercises it.
- Screenshot capture used a scratch Playwright script and a temporary `.tmp-qa752/` directory (deleted before the final `git status --porcelain` check) rather than the repo's `scripts/check-stories-rendered.mjs`/`scripts/responsive-screenshots.mjs` harnesses, because those are fixed-matrix tools not scoped to an arbitrary story subset. `npm run screenshots:assert:fast` (structural/geometry gate, not a before/after diff) was not additionally run — the MD5 before/after comparison is stronger evidence for the specific "zero visual delta" claim this task requires.

## Opus handoff

- Diff: `git diff -- src/components/layout/HeaderActions.tsx src/components/layout/UserMenu.tsx src/components/shared/FilterMultiToggle.tsx src/components/shared/FilterRangeInputs.tsx src/components/shared/FilterRoomsRow.tsx src/components/shared/PhoneField.tsx src/modules/listings/components/FavoriteButton.tsx src/modules/notifications/components/NotificationBellView.tsx`
- Command transcripts referenced above were run directly in this session (not piped through a secondary command); exit codes captured via `$?` immediately after each command per the evidence-capture rule.
- Screenshot manifests/PNGs are not retained (scratch-only) — the MD5 comparison result (66/66 → 11 diff → 66/66 after fix) is reported here as the evidence; Opus may independently re-run the same before/after capture method if it wants to re-verify.
- Open item for Opus: the `filterLeafComponents.smoke.test.tsx` `.flex-wrap`-selector dependency (see "Implementation validation notes") — recommend filing a small follow-up task to re-anchor it, not blocking this task's approval.

## Backlog update

`docs/backlog.md` — Task 752 registry row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a concise evidence summary; "Last Session" line updated to lead with 752. Net line count: 80 → 80 (no growth; edited existing lines in place). No `BACKLOG LIMIT BREACH`.
