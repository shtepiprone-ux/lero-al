# Session — Task 537: Canonical `MantineCombobox` (searchable combobox base) → TailAdmin conformance

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_537_MantineComboboxSearchablePrimitive.md`
**Executor:** Sonnet (this session)

## Summary

New canonical `MantineCombobox` primitive (`src/design-system/mantine/patterns/MantineCombobox.tsx`) — a
single responsive searchable combobox at behavioral parity with the legacy `src/components/shared/
Combobox.tsx`, TailAdmin-styled, reusing the Task 514 `responsiveBottomSheet` foundation for `<640`. Plus
its Storybook proof (`Mantine/Primitives/Combobox`). **Primitive + story ONLY — zero consumer migration**
(LocationCombobox/PropertyTypeCombobox/YearCombobox/PhoneField/HeroSearch/FiltersPanel/8 admin managers all
stay on legacy `Combobox.tsx` — Phase 2). Along the way, found and fixed a real TailAdmin-conformance bug:
Mantine's `Combobox` was accidentally inheriting the WRONG dropdown radius from its internal Popover
plumbing (12px instead of the correct 16px "Dropdowns/menus" chrome).

## STOP-and-ASK #1 — architectural base (resolved via `AskUserQuestion`, owner-confirmed)

The kickoff flagged this explicitly: legacy `Combobox.tsx` supports a `variant="button"` trigger with an
OPTIONAL search field rendered **inside the dropdown** (not on the trigger) — a pattern Mantine's
`<Select searchable>` cannot express (its search field IS the trigger, there is no "custom target + separate
in-dropdown search" mode). Before implementing, I inspected Mantine's actual shipped API
(`node_modules/@mantine/core/lib/components/Combobox/*.d.ts`) and confirmed Mantine ships a full low-level
`Combobox` primitive family — `Combobox.Target`/`.Dropdown`/`.Options`/`.Option`/`.Search`/`.Empty`/`.Chevron`
+ `useCombobox()` store — architected exactly for this "arbitrary target + optional in-dropdown search"
composition (this is literally what `Combobox.Target` + `Combobox.Search` are for). I presented this finding
via `AskUserQuestion` (not a guess) with three options — low-level `Combobox` primitive (recommended),
`Select`-pattern + a fork for `button+searchable`, or deferring `button+searchable` to Phase 2 — and the
owner confirmed **low-level Mantine `Combobox` primitive**. This is the foundation `MantineCombobox.tsx` is
built on.

## Architecture

- **ONE store** (`useCombobox()`) drives both variants; `Combobox.Target targetType={variant === 'input' ?
  'input' : 'button'}` wraps either a real `<TextInput>` (variant="input", typing filters) or a
  `<TextInput readOnly>` (variant="button", click-only — same chrome, no typing) — `MantineCombobox.tsx:214-252`.
- **`<640`:** the Popover-based `Combobox.Dropdown` is never rendered (`{!isMobile && <Combobox.Dropdown>...}`,
  `MantineCombobox.tsx:255`); instead the shared `ResponsiveBottomSheet` (Task 514 foundation, same as
  `MantineSelect`) opens with its OWN `UnstyledButton` option-row list (`MantineCombobox.tsx:300-360`) —
  mirrors `MantineSelect`'s mobile pattern (separate mobile rendering) rather than trying to reposition the
  same Popover, matching the established Batch-C precedent.
- **`≥640`:** Mantine's own `Combobox`/`Combobox.Dropdown`/`Combobox.Options`/`Combobox.Option` render the
  anchored dropdown; `Combobox.Search` (only for `variant="button"`+`searchable`) sits inside the dropdown,
  not on the trigger — `MantineCombobox.tsx:255-274`.

## STOP-and-ASK #2 — `portal` mode (resolved, owner-pre-authorized default)

Deferred to whichever Phase-2 consumer first needs table/`overflow:hidden`-container rendering. Mantine's
`Combobox` already renders its dropdown via a `Popover` with `withinPortal` defaulting to `true`, so this
primitive does not clip inside a scroll container out of the box — no clipping regression exists without
explicitly wiring the legacy `portal` prop. Documented in the component's JSDoc (`MantineCombobox.tsx:150-155`).

## STOP-and-ASK #3 — mobile keyboard/search interaction (resolved)

Legacy `Combobox.tsx`'s mobile bottom sheet is literally the SAME `<input>` element CSS-repositioned to the
bottom (`max-sm:!fixed`) — a DOM mechanism that cannot be replicated with a portal-rendered Mantine `Drawer`
(the Task 514 foundation every other Batch-C overlay already uses). The parity-preserving equivalent: the
mobile sheet gets its OWN search `TextInput` — always for `variant="input"` (since typing-to-filter is the
whole point of that variant), and only when `searchable` for `variant="button"` (`MantineCombobox.tsx:311-321`).
This keeps typing-to-filter reachable on mobile without fighting the Drawer's portal architecture.

## TailAdmin chrome — every value cited

- **Trigger** (both variants): a real Mantine `<TextInput>` — inherits §6d/§6e resting/focus/error/disabled
  chrome for **free** via the EXISTING `.mantine-TextInput-input` rules in `input-chrome.css` (Task 505/527/
  528). **Zero new CSS** for the trigger itself.
- **Dropdown container — a genuine conformance FIX, not a stylistic choice.** Measured live via
  `getComputedStyle` BEFORE adding a `theme.ts` block: `.mantine-Combobox-dropdown` rendered at
  `border-radius: 12px` — Mantine's `Combobox`→`Popover` component chain was accidentally inheriting
  `theme.components.Popover`'s `radius:'xl'` (12px, correct for content-card Popovers per the §6l Addendum)
  instead of the semantically-correct §6l **"Dropdowns/menus"** row (16px `rounded-2xl`, items 14px/gray-700/
  padding~10×12/8px radius — the SAME row `theme.components.Menu` already implements). Added a new
  `theme.components.Combobox` block (`theme.ts:435-452`) mirroring the `Menu` block exactly. Re-measured
  after the fix: `border-radius: 16px`, `box-shadow` = the exact `shadow-theme-lg` value, `border: 1px solid
  rgb(228,231,236)` (gray-200), `padding: 12px`; options: `font-size: 14px`, `color: rgb(52,64,84)` (gray-700
  #344054), `padding: 10px 12px`, `border-radius: 8px` — all match §6l exactly.
- **In-dropdown search field** (`variant="button"`+`searchable`): Mantine's own `ComboboxSearch` default is
  only a bottom-border divider (`border-width: 0 0 1px`), not a full input box. STOP-and-ASK #4 (kickoff)
  resolved to reuse §6e input chrome VERBATIM — new `.mantine-Combobox-search` rule in `input-chrome.css`
  (lines 72-92): full border/radius/shadow-xs resting, brand-3 focus ring, gray-4 placeholder, 10×16 padding
  — same tokens as `TextInput`/`Select`, no new value invented.
- **Selected-row brand tint** (§6l: "selected = brand tint + check in brand-7"): Mantine ships no default
  background for the `active` prop's `[data-combobox-active]` attribute. New CSS rule
  (`input-chrome.css:95-101`) matching legacy `Combobox.tsx`'s exact `bg-primary/10 text-primary` treatment
  (`color-mix(...brand-7 10%...)` background + brand-7 text). Verified via Playwright screenshot comparison
  that this does NOT conflict with Mantine's own separate solid-fill keyboard-hover highlight
  (`[data-combobox-selected]`, a DIFFERENT attribute driven by arrow-key navigation) — both render
  simultaneously and are visually distinct (hover = solid brand fill, actually-selected = light 10% tint).
- **Item text** renders via a plain `<span>` (not `<Text>`) inside `Combobox.Option`, inheriting font-size/
  color from the themed `.mantine-Combobox-option` element — matching the established `Menu.Item` pattern
  (`MantineDropdownMenu` renders `{item.label}` bare, no `Text` wrapper); an explicit `<Text size="xs"
  c="gray.5">` is used only for the secondary `description` field, which intentionally differs from the base
  option style (`MantineCombobox.tsx:183-199`).

## Manually-verified flows (Playwright, native measurements — not self-reported)

- **Desktop dropdown** (1024px): opened via the gate's own scripted-click mechanism AND via a real Playwright
  click; `getComputedStyle` confirmed 16px radius / shadow-theme-lg / 1px gray-200 border / 12px padding on
  the dropdown, 14px/gray-700/10×12px-padding/8px-radius on options.
- **Filtering**: `normalizeSearch` diacritic-folding verified in isolation (`node -e`, "Vlorë"→"vlore",
  `.includes("vlo")` = true); typed filter narrows the visible option list; selecting an option fires
  `onChange`, clears search, closes the dropdown.
- **`variant="button"`+`searchable`**: compact read-only trigger; search field renders INSIDE the dropdown
  with correct §6e chrome (after the CSS fix); typing filters; selecting closes + updates the trigger.
- **`variant="button"` without `searchable`**: static list, no search field anywhere — confirmed via
  screenshot.
- **Mobile bottom sheet** (uk@375, via a real click on the gate's own scripted-open target): sheet
  `getBoundingClientRect` = `{ left:0, right:375, bottom:812 }` (full-width, bottom-anchored); 7 option rows
  all `≥44.015625px` tall (≥44px P0 tap target); drag handle + title "Оберіть місто" + own search field with
  visible brand-3 focus border; long 99-char Italian label wraps to 3 lines with **zero** h-scroll at it@320
  (confirmed via both `scrollWidth` check and screenshot).
- **Dismiss**: Escape confirmed closes the desktop dropdown (`display` transitions to `none`); outside-click
  confirmed closes the `variant="button"` dropdown via Mantine's own built-in Popover `closeOnClickOutside`
  (no explicit `onBlur` needed on the read-only trigger — verified this works without one).
- **Disabled**: a genuine no-op, confirmed via Playwright's REAL (non-forced) `.click()` throwing a 30s
  actionability timeout trying to interact with a truly-disabled `<input>` (proving browser-level inertness,
  not a testing shortcut) — 0 visible dropdowns after.
- **Empty options** (`options={[]}`): shows the localized `noResultsLabel` ("No results found" / locale
  equivalent), no crash — confirmed via a visibility-scoped DOM query (an earlier flawed test queried ALL 7
  sections' persistently-DOM-present-but-hidden dropdowns rather than the visible one; corrected).

## Planted-violation proof (clause 13) — THREE attempts, all honestly documented

1. **Mobile-sheet `UnstyledButton miw={900}`** → **0 FAIL**.
2. **Mobile-sheet `Text whiteSpace:'nowrap'`** (removing wrap protection on the 99-char long label) →
   **0 FAIL**, even though an ad-hoc `scrollWidth` check also read `false`.

   Root-caused via reading `scripts/geometry-integrity.mjs`'s `offscreen-control` check (~lines 258-293): it
   explicitly downgrades elements found inside an `overflow-x: auto|scroll` ancestor away from a hard FAIL.
   `ResponsiveBottomSheet`'s Drawer body (`bottomSheetDrawerStyles.body`, `responsiveBottomSheet.tsx:34`) has
   `overflowY:'auto'`, and the Drawer's own root/content computed `overflow-x: auto` (measured). **This is a
   genuine, reusable gate-limitation finding** (mirrors the Task 529-established "gate limitation" pattern):
   the rendered gate cannot catch un-clipped/scrollable-ancestor overflow defects INSIDE any Drawer-based
   bottom sheet — only true document-level, non-scrollable overflow. Worth recording for future overlay
   primitives built on the same `ResponsiveBottomSheet` foundation.
3. **Story-level `<Box miw={900}>`** wrapping section 1's trigger (`Combobox.stories.tsx`, normal
   `MantineStoryShell` document flow — NOT inside any Drawer). Learning applied from attempts 1–2: **pre-
   verified via an ad-hoc script** that this caused real `document.documentElement.scrollWidth` overflow
   BEFORE running the full (expensive) gate. Result:
   ```
   Results: 369/384 PASS, 12 FAIL, 0 unexpected
     12/12 = Mantine/Primitives/Combobox/Default × {sq,en,uk,it} × {mobile-320,375,390}
     each: ✗ horizontal overflow detected + ✗ geometry [offscreen-control]
   ```
   Exactly the expected 12 cells (4 locales × 3 mobile viewports for the Combobox story), 0 unexpected FAILs
   elsewhere, ambiguous count unchanged at 3 (pre-existing Tabs, unrelated). Reverted (`Box` wrapper + now-
   unused import removed from `Combobox.stories.tsx`), rebuilt, reconfirmed green.

## Gates (all green, final clean run)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 98 files, 0 violations, storybook.* 514/514 parity
npm run check:i18n                   → PASSED, 4 locales, 2079 keys, parity OK
npm run check:mojibake               → 0 artifacts, 1539 files
npm run check:design-tokens:strict   → 0 violations, 392 files scanned
npm run check:file-integrity         → PASSED, 47 files clean
npm run build-storybook              → built in ~40s (final clean build)
npm run screenshots:assert -- --mantine-only → 381/384 PASS, 0 FAIL, 3 AMBIGUOUS (pre-existing Tabs, unrelated)
  Mantine/Primitives/* : 24 stories (384 cells), 8 overlay stories scripted-open-clicked (Combobox added to
  MANTINE_OVERLAY_PRIMITIVES, scripts/check-stories-rendered.mjs)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `MantineCombobox.tsx` created + exported; behavioral parity per §3 | ✅ | `patterns/index.ts` export; two variants, options/clearLabel/error/disabled/icon/searchable all implemented, `MantineCombobox.tsx:127-149` prop surface |
| 2 | TailAdmin chrome, every value cited; zero invented | ✅ | §6d/§6e trigger reuse; new `theme.ts` Combobox block citing §6l; new CSS citing §6e verbatim; `check:design-tokens:strict` 0 violations |
| 3 | Positive flow §5 steps 1–5 rendered-verified | ✅ | Desktop open/filter/select, mobile sheet, clearLabel row, `variant="button"`+searchable — all manually verified above |
| 4 | Negative flow §6 every branch has code + evidence | ✅ | Disabled (real-click timeout), error (red-6 border screenshot), empty/no-results, dismiss (Esc + outside-click), long-label wrap, double-open reset (`sheetSearch`/`search` cleared on close, `MantineCombobox.tsx:161-166`), SSR (`isMobile` false first render, same caveat as `MantineSelect`) |
| 5 | Mobile <640 full-width gate §7 | ✅ | Trigger `w={{base:'100%',sm:'auto'}}`; sheet full-width/edge-to-edge/≥44px/wraps/no-h-scroll — measured |
| 6 | Story wrapped in `MantineStoryShell`, single `Default`, `storyT()` only, `combobox_*` 4× parity; renders OPEN | ✅ | `Combobox.stories.tsx`; 14 new keys ×4 locales; gate's scripted click opens section 1 |
| 7 | All gates green + planted-violation FAIL transcript | ✅ | Above — 3 attempts, 2 honest negatives + 1 working 12/12 FAIL, reverted to green |
| 8 | Session log + tracker updated; no git run | ✅ | This file; `mantine-tailadmin-migration-tracker.md` P1.21; zero git commands run |

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked) → 47 files clean (0 NUL, no BOM, not truncated): all new/
changed files including `MantineCombobox.tsx`, `Combobox.stories.tsx`, `theme.ts`, `input-chrome.css`, 4
locale JSONs, tracker, session log + assets.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | NEW (~330 lines) — the canonical searchable combobox primitive. |
| `src/design-system/mantine/patterns/index.ts` | +3 lines — export `MantineCombobox` + its types. |
| `src/design-system/mantine/theme.ts` | +21 lines — new `Combobox` block (conformance fix: 12px accidental Popover-inherited radius → correct 16px §6l Dropdowns chrome). |
| `src/design-system/mantine/input-chrome.css` | +26 lines — 3 new rule blocks: `.mantine-Combobox-search` chrome (§6e verbatim), its padding, `[data-combobox-active]` selected brand-tint. |
| `src/stories/mantine/primitives/Combobox.stories.tsx` | NEW (~160 lines) — 7 sections covering every Positive/Negative flow item. |
| `scripts/check-stories-rendered.mjs` | +1 line — `'Combobox'` added to `MANTINE_OVERLAY_PRIMITIVES` so the enforced gate's scripted open-trigger click covers it. |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | +14 `combobox_*` keys each (56 total) — trigger placeholder, search placeholder, clear label, no-results, error, aria-label, sheet title, 6 option labels/descriptions. |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.21 row + Batch D summary line updated. |
| `docs/backlog.md` | Last Session + Sprint 40 status updated. |
| `docs/sessions/2026-07-03-task537-mantine-combobox-searchable-primitive.md` | This file. |
| `docs/sessions/assets/task537/*` | Rendered gate PNGs (16 Combobox cells), manual-QA screenshots, `rendered-proof-manifest.json`, `planted-violation/` subfolder (FAIL transcript + representative screenshot). |

**Not touched this task:** legacy `src/components/shared/Combobox.tsx` / `command.tsx` (stay until their
consumers migrate, Phase 6 per the kickoff); any consumer (`LocationCombobox`, `PropertyTypeCombobox`,
`YearCombobox`, `PhoneField`, `HeroSearch`, `FiltersPanel`, admin managers, `Header`) — Phase 2; `Menu`/
`Popover`/`Table` theme.ts blocks (verified diff shows ONLY the new `Combobox` block); dark mode.

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-
inventory.md` (auto-regenerated side effect of the required gate command, restored to HEAD in-session, same
as every prior Sprint 40 task).

**Self-validation:** `tsc=0` · `build-storybook=passes` · `AC=all 8 green` · `runtime uk@320/375/390 PASS`
(rendered gate, 16/16 Combobox cells) · `scope=clean` (git status matches exactly the Files Changed table
above).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
