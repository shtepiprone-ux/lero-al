# Session Log — Task 354-Fix: Rendered-Storybook QA Failure → Global DS Mobile-Control / Localization / Filter-State / No-Raw-Enum Corrective

**Date:** 2026-06-01  
**Executor:** Sonnet 4.6  
**Status:** UNCOMMITTED — OWNER QA REQUIRED

---

## Root Causes (from orchestrator audit 2026-06-01)

1. **Raw enum/status labels** — `StatusChangeHistory.tsx` identity fallback (`const label = (s) => labelFormatter ? labelFormatter(s) : s`) let raw codes `open`, `in_progress`, `resolved` render as user-visible text when no formatter was supplied. Stories `Single`, `Multiple`, `Multiple_Mobile320` passed raw data with no formatter.

2. **Mixed-language normal stories** — `PageHeader`, `FilterBar`, `ActionBar` locale-specific stories (uk/sq/it) used English SAMPLE_CONTENT ("Search results", "Page content area") and English action buttons ("New Listing"), violating the no-mixed-language Storybook contract.

3. **Filter count vs state mismatch** — `FilterChips` in `FilterBar.stories.tsx` rendered all chips with `size="sm" variant="outline"` (no active vs available distinction), while `activeCount` was a disconnected number. "Filters 2" but no chip showed as active.

4. **Sub-44 mobile controls / chip text bigger than chip** — `FilterChips` used `size="sm"` (h-7 = 28px), sub-44px touch target. Text at `text-[0.8rem]` nearly as tall as the 28px pill.

5. **Mobile actions not full-width/stacked** — `ActionBar` children lacked `w-full` on mobile. `PageHeader` action slot used `shrink-0` without mobile override, producing content-width pills on mobile.

6. **Inconsistent control heights on a shared surface** — chips/buttons at 28px mixed with Input/Combobox/Select at 44px (ui-rules.md §15 violation).

---

## Proof for Primitive Runtime Changes

### ActionBar.tsx — `[&>*]:max-md:w-full` added

**Proof the contract belongs in ActionBar:** ActionBar is the layout primitive that owns the mobile stacking behavior (`flex-col` at `<md:`). Its doc comment states "Action cluster stacks (flex-col, full-width buttons) at `<md:`" — but children were not becoming full-width, making the "full-width" part aspirational only. The correct place to enforce child width on mobile is the parent layout primitive (ActionBar), not each individual consumer. This is additive (does not break desktop — `max-md:` scopes it), non-breaking (existing consumers with explicit `w-full` on buttons still work), and follows the established pattern that layout primitives own their layout contract.

### PageHeader.tsx — `max-md:w-full` on action slot div

**Proof the contract belongs in PageHeader:** PageHeader's action slot uses `<div className="shrink-0">` — `shrink-0` prevents flex-shrinking at desktop (correct), but at `<md:` the flex direction is column so `shrink-0` produces a content-width action div, which causes a small "New Listing" pill on mobile. The fix adds `max-md:w-full` to the action wrapper so it fills the column at mobile widths. The root of the defect is structurally inside PageHeader's action slot layout.

---

## Changes Made

### 1. `src/components/admin/StatusChangeHistory.tsx`
- Added `humanize(s: string)` function that converts snake_case → Title Case.
- Changed identity fallback to use `humanize()` when no `labelFormatter` is supplied.
- Behavior: `open` → "Open", `in_progress` → "In Progress", `resolved` → "Resolved". Raw enum codes never leak as user-visible text.

### 2. `src/components/admin/StatusChangeHistory.stories.tsx`
- **Full rewrite.** Replaced raw-enum stories with per-locale stories.
- Added `STATUS_EN/SQ/UK/IT` label maps and `fmt()` factory.
- Added en/sq/uk/it normal stories each with `labelFormatter`.
- Added mobile 320/375/390 stories for each locale.
- Added `RawKeyStress` story (no formatter → tests humanize fallback).
- No normal story exposes raw enum values as user-visible text.

### 3. `src/components/admin/StatusChangeControl.stories.tsx`
- Added sq fixtures: `INQUIRY_STATUSES_SQ`, `TICKET_STATUSES_SQ`, `TICKET_TRANSITIONS_SQ`.
- Added it fixtures: `INQUIRY_STATUSES_IT`, `TICKET_STATUSES_IT`, `TICKET_TRANSITIONS_IT`.
- Added stories: `Workflow_Sq_Mobile320`, `Select_Sq_Mobile320`, `Workflow_It_Mobile320`, `Select_It_Mobile320`.

### 4. `src/components/layout/ActionBar.tsx`
- Added `[&>*]:max-md:w-full` to make children full-width at `<md:` (mobile stacking contract).
- Added comment documenting the mobile-stacking contract.

### 5. `src/components/layout/ActionBar.stories.tsx`
- Added `SAMPLE_CONTENT_UK`, `SAMPLE_CONTENT_SQ`, `SAMPLE_CONTENT_IT` helpers.
- Updated `ManyActionsWrappedUk320`, `LongLabelsUk480` to use `SAMPLE_CONTENT_UK`.
- Updated `LongLabelsSq320` to use `SAMPLE_CONTENT_SQ`.
- Added `InsidePageHeaderUk_Mobile320`, `InsidePageHeaderSq_Mobile320`, `InsidePageHeaderIt_Mobile320` locale stories demonstrating the full-width mobile action contract.

### 6. `src/components/layout/PageHeader.tsx`
- Added `max-md:w-full` to the action slot div: `<div className="shrink-0 max-md:w-full">`.

### 7. `src/components/layout/PageHeader.stories.tsx`
- Added `ACTION_UK`, `ACTION_SQ`, `ACTION_IT` locale-specific action buttons (all `size="xl"`).
- Added `SAMPLE_CONTENT_UK`, `SAMPLE_CONTENT_SQ`, `SAMPLE_CONTENT_IT` locale helpers.
- Fixed `ACTION_CLUSTER` to use `size="xl"` (was using default).
- Updated `LongUkTitleMobile320` to use `ACTION_UK` + `SAMPLE_CONTENT_UK`.
- Updated `CountBadgeUkMobile320` to use `SAMPLE_CONTENT_UK`.
- Updated `LongSqTitleMobile320` to use `ACTION_SQ` + `SAMPLE_CONTENT_SQ`.
- Added `LongItTitleMobile320` story (new, it locale).

### 8. `src/components/layout/FilterBar.stories.tsx`
- **FilterChips helper:** Changed `size="sm"` to `size="xl"` (44px touch target). Added `activeValues` prop — active chips use `variant="default"` (filled), available chips use `variant="outline"`.
- Added `SAMPLE_CONTENT_UK`, `SAMPLE_CONTENT_SQ`, `SAMPLE_CONTENT_IT` locale helpers.
- Updated `Default` story to pass `activeValues={['Sale', 'Studio']}` (2 active chips match `activeCount={2}`).
- Updated all locale-specific stories (`UkLongLabels320`, `UkLongLabels375`, `InlineSq1440`, `InlineIt1440`, `InlineUk1440`, `MobileSq375`, `MobileIt375`, `StackedAt680`) to use locale SAMPLE_CONTENT and locale-correct `activeValues`.
- Added required filter-state stories: `ZeroActive_Mobile390`, `TwoActive_Mobile390`, `ManyAvailableTwoActive_Mobile390`, `Uk_ZeroActive_Mobile320`, `Uk_TwoActive_Mobile320`, `Uk_SheetOpen_Mobile390`.

### 9. `docs/design-system.md`
- Added `§12a — Mobile Control Touch Target and Stacking Contract`.

### 10. `docs/ui-rules.md`
- Added `§18 — No raw enum/status labels in UI`.
- Added `§19 — No mixed-language normal Storybook stories`.

### 11. `docs/storybook-governance.md`
- Added `§8a — RENDERED QA RULES` (build-storybook ≠ visual approval; OWNER QA REQUIRED definition; status-label contract; mixed-language contract).
- Updated `§9 FORBIDDEN ANTI-PATTERNS` to include new violations.

### 12. `docs/responsive-screenshot-matrix.md`
- Registered all new required DS rendered story targets under "DS Rendered QA Stories (Task 354-Fix)".

### 13a. `src/components/layout/FilterBar.tsx` — inline Reset rhythm fix (global rhythm directive)
- Changed inline desktop Reset from `size="sm"` (28px) to `size="xl"` (44px), ghost variant preserved.
- **Proof this belongs in the primitive:** The Reset button is hardcoded inside FilterBar's render; no consumer prop can resize it. The `size="sm"` was a structural defect preventing the one-row-one-height contract from being achievable at all.
- Now the full inline row at `lg:+` is: chips (`size="xl"`) + search Input (h-11) + Reset ghost (`size="xl"`) — all 44px.

### 13b. `src/components/layout/FilterBar.stories.tsx` — global rhythm proof stories
- Added 6 new rhythm stories: `Rhythm_Desktop1440_OneRowOneHeight`, `Rhythm_Uk_Desktop1280`, `Rhythm_Tablet768_TriggerAndSearch`, `Rhythm_Mobile320_StackedColumn`, `Rhythm_Sq_Mobile320`, `Rhythm_It_Tablet768`.
- All demonstrate that chips + search + reset share the same 44px height in the same DS surface.

### 13c. `src/components/layout/ActionBar.stories.tsx` — global rhythm proof stories
- Added 6 new rhythm stories: primary + secondary + destructive combinations at Desktop 1440, Mobile 320, uk@320, Tablet 768, sq@320, it@390.
- All three action variants use `size="xl"` (44px); on mobile they stack full-width.

### 13. `docs/backlog.md`
- Updated Last Session (2–4 lines).

---

## Files Preserved from Task 354

- `src/components/shared/Combobox.tsx` — Task 354 viewport-clamp preserved ✅
- `src/components/ui/select.tsx` — Task 354 `w-full max-w-full min-w-0` + value `truncate min-w-0` preserved ✅
- `src/components/shared/Combobox.stories.tsx` — Task 354 uk@320/360/390/480 stories preserved ✅
- `src/components/ui/select.stories.tsx` — Task 354 uk@320/360/390/480 stories preserved ✅
- `src/components/admin/AdminTable.stories.tsx` — Task 354 row-action stories preserved ✅
- `src/components/admin/AdminCardList.stories.tsx` — Task 354 stories preserved ✅
- `messages/{sq,en,uk,it}.json` — No new keys added (not needed; stories use inline fixtures)

---

## Validation Output

### `npx tsc --noEmit`
```
(no output = 0 errors) ✅
```

### `npm run lint`
```
(no output = 0 errors/warnings) ✅
```

### `npm run check:i18n`
```
── Part 1: Locale key-set parity ──────────────────────────────
  ✅ en  — 1434 keys (matches sq)
  ✅ uk  — 1434 keys (matches sq)
  ✅ it  — 1434 keys (matches sq)
Parity PASSED — all 4 locale files have identical key sets (1434 keys).
⚠️ Raw-enum scan: 1 potential hit in AdminInquiriesManager.tsx:288 (false positive — not a label context, not touched by this task). ✅
```

### `npm run build`
```
✓ (exits 0 — truncated output for brevity) ✅
```

### `npm run build-storybook`
```
✓ built in 6.26s (exits 0) ✅
```

### rg audit: raw enum transitions in normal stories/components
```
rg -n "\b(open|in_progress|resolved|closed|pending|active|inactive|sold|rented|archived)\b\s*(→|->|=>)" src/components -g "*.tsx"
```
Results: All hits are `Dialog open onOpenChange={open => ...}` pattern — these are React `open` prop usage, NOT status enum labels. Zero status enum transition patterns found. ✅

### rg audit: fromStatus/toStatus/labelKey in stories
```
rg -n "fromStatus:|toStatus:|labelKey:" src/components -g "*.stories.tsx"
```
Results: All `fromStatus`/`toStatus` hits are raw enum code data fields that are fed through `labelFormatter` (now provided in all normal stories). `labelKey` hits are in `StatusOption`/`Transition` objects where the `label` prop overrides the `labelKey`. No raw keys rendered as user-visible text. ✅

### rg audit: mixed-language strings in locale-specific stories
```
rg -n "Search results|Page content area|Available Listings|Browse available properties|New Listing|Listings" src/components -g "*.stories.tsx"
```
Results: All remaining hits are in stories WITHOUT locale globals set (English-only stories). Zero hits in stories with `globals: { locale: 'uk' }`, `globals: { locale: 'sq' }`, or `globals: { locale: 'it' }`. ✅

### rg audit: truncate/line-clamp/whitespace-nowrap in touched DS components
```
rg -n "truncate|line-clamp|whitespace-nowrap|text-ellipsis" src/components/admin src/components/layout src/components/ui src/components/shared -g "*.tsx"
```
Results:
- `select.tsx`: `*:data-[slot=select-value]:truncate` — Task 354 fix; with `min-w-0`, correct ✅
- `Combobox.tsx`: `flex-1 min-w-0 truncate` — Task 354 fix; button variant trigger label, correct ✅
- `button.tsx`: `whitespace-nowrap` — base class prevents label breaking *inside* button text, correct ✅
- `table.tsx`: `whitespace-nowrap` — standard for table headers/cells, correct ✅
- `tabs.tsx`: `whitespace-nowrap` — standard for tab triggers, correct ✅
- Other admin files: all `truncate` uses are in dense table cells or nav items with `min-w-0` parent context, correct ✅
- No hits in FilterBar.tsx, ActionBar.tsx, PageHeader.tsx, StatusChangeHistory.tsx (not touched for truncation) ✅

### rg audit: touch-target sizes in filter/action stories
```
rg -n "size=\"sm\"|size=\"default\"|size=\"lg\"|h-7|h-8|h-9" src/components/layout/FilterBar.stories.tsx src/components/layout/ActionBar.stories.tsx
```
Results: **No output** — zero matches. FilterChips now uses `size="xl"` (44px). ActionBar stories use `size="xl"`. ✅

### git diff — src/app, src/modules
```
(empty — no changes to src/app or src/modules) ✅
```

### git diff — package.json, package-lock.json
```
(empty — no dependency changes) ✅
```

---

## Confirmation Summary

- ✅ No `src/app` or `src/modules` edits.
- ✅ No DB / package / Storybook config changes.
- ✅ Task 354 Combobox/Select viewport-clamp preserved.
- ✅ Task 354 admin story improvements preserved.
- ✅ Status labels are localized (en/sq/uk/it) via `labelFormatter` in all normal stories. Component falls back to Title Case humanization, never raw enum leak.
- ✅ Filter count/state consistent: `activeValues` prop → active chips (filled) match `activeCount`.
- ✅ Mobile controls meet touch-target/stacking contract: FilterChips `size="xl"` (44px); ActionBar `[&>*]:max-md:w-full`; PageHeader action `max-md:w-full`.
- ✅ No existing interactive control silently removed.
- ✅ `check:i18n` PASS (1434 keys, parity holds, no new keys needed).

---

## Rendered QA Matrix

**OWNER QA REQUIRED** — Sonnet executor has no browser access; build-storybook exits 0 but visual inspection is owner's responsibility.

### StatusChangeHistory (320 / 375 / 390 / 768 / 1280 × sq / en / uk / it)

| Story | 320 | 375 | 390 | 768 | 1280 |
|---|---|---|---|---|---|
| En_Single | — | — | — | — | OWNER QA REQUIRED |
| En_Multiple_Mobile320 | OWNER QA REQUIRED | — | — | — | — |
| En_Multiple_Mobile375 | — | OWNER QA REQUIRED | — | — | — |
| En_Multiple_Mobile390 | — | — | OWNER QA REQUIRED | — | — |
| Sq_Normal | — | — | — | — | OWNER QA REQUIRED |
| Sq_Mobile320 | OWNER QA REQUIRED | — | — | — | — |
| Sq_Mobile375 | — | OWNER QA REQUIRED | — | — | — |
| Sq_Mobile390 | — | — | OWNER QA REQUIRED | — | — |
| Uk_Normal | — | — | — | — | OWNER QA REQUIRED |
| Uk_Mobile320 | OWNER QA REQUIRED | — | — | — | — |
| Uk_Mobile375 | — | OWNER QA REQUIRED | — | — | — |
| Uk_Mobile390 | — | — | OWNER QA REQUIRED | — | — |
| It_Normal | — | — | — | — | OWNER QA REQUIRED |
| It_Mobile320 | OWNER QA REQUIRED | — | — | — | — |
| It_Mobile375 | — | OWNER QA REQUIRED | — | — | — |
| It_Mobile390 | — | — | OWNER QA REQUIRED | — | — |
| RawKeyStress | — | — | — | — | OWNER QA REQUIRED |

### FilterBar / filter sheet (320 / 375 / 390 / 768 / 1280 × sq / en / uk / it + state variants)

All cells: OWNER QA REQUIRED. Key cells for verification:
- `ZeroActive_Mobile390` (en@390): no badge, no reset, all chips outline.
- `TwoActive_Mobile390` (en@390): "Sale"+"Studio" filled, rest outline, badge=2.
- `ManyAvailableTwoActive_Mobile390` (en@390): 9 chips, 2 active, 7 outline, badge=2.
- `Uk_ZeroActive_Mobile320` (uk@320): no badge, all chips outline.
- `Uk_TwoActive_Mobile320` (uk@320): 2 active (filled), rest outline.
- `Uk_SheetOpen_Mobile390` (uk@390): sheet content shows active vs available, reset in footer.
- `UkLongLabels320` (uk@320): no English, all uk copy, chips fit/wrap.

### ActionBar / PageHeader action groups (320 / 375 / 390 / 768 / 1280 × sq / en / uk / it)

All cells: OWNER QA REQUIRED. Key cells:
- `InsidePageHeaderUk_Mobile320` (uk@320): action becomes full-width column, buttons stack full-width.
- `StackedMobile320` (en@320): buttons stack full-width via `[&>*]:max-md:w-full`.
- `ManyActionsWrappedUk320` (uk@320): all Ukrainian buttons stack full-width, no overflow.

### Button / chip / input rhythm stories (320 / 375 / 390 × sq / en / uk / it)

All cells: OWNER QA REQUIRED. Key check: FilterChips `size="xl"` (44px) visually matches Input/Combobox/Select trigger height.

### Combobox / Select trigger + open dropdown (320 / 375 / 390 / 480 × sq / en / uk / it)

All cells: OWNER QA REQUIRED. Task 354 clamp fixes preserved; these stories unchanged from Task 354.

---

## Files Changed Table

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/StatusChangeHistory.tsx` | Added `humanize()` fn + safe fallback in `label()` | Closes raw enum leak when no `labelFormatter` supplied (AC-1) |
| `src/components/admin/StatusChangeHistory.stories.tsx` | Full rewrite: per-locale labelFormatter + en/sq/uk/it × 320/375/390 stories + RawKeyStress | Closes AC-1, AC-2, AC-3: no raw enum in normal stories; all transition labels localized |
| `src/components/admin/StatusChangeControl.stories.tsx` | Added sq/it fixture data + 4 new locale stories | Closes AC-2/AC-3 for StatusChangeControl: sq/en/uk/it stress coverage |
| `src/components/layout/ActionBar.tsx` | Added `[&>*]:max-md:w-full` to className | Mobile full-width stacking contract belongs in ActionBar layout primitive (AC-7, §A) |
| `src/components/layout/ActionBar.stories.tsx` | Added SAMPLE_CONTENT_UK/SQ/IT; fixed locale stories; added InsidePageHeader uk/sq/it mobile stories | Closes AC-3: no English in locale stories; demonstrates full-width stacking |
| `src/components/layout/PageHeader.tsx` | Added `max-md:w-full` to action slot div | PageHeader action slot owns mobile layout; `shrink-0` alone produced content-width pills (AC-7) |
| `src/components/layout/PageHeader.stories.tsx` | Added locale ACTION_UK/SQ/IT; SAMPLE_CONTENT_UK/SQ/IT; fixed 3 locale stories; added LongItTitleMobile320 | Closes AC-3: uk/sq/it stories contain no English scaffolding |
| `src/components/layout/FilterBar.stories.tsx` | FilterChips size="xl"; activeValues prop; locale SAMPLE_CONTENT; 6 new filter-state stories | Closes AC-4, AC-5, AC-6: touch targets ≥44px; active vs available distinction; no English in locale stories |
| `docs/design-system.md` | Added §12a Mobile Control Touch Target and Stacking Contract | Canonicalizes the 44px floor + full-width stacking + one-row-one-height rules |
| `docs/ui-rules.md` | Added §18 No raw enum labels; §19 No mixed-language stories | Codifies the governance rules that Task 354-Fix enforced |
| `docs/storybook-governance.md` | Added §8a Rendered QA rules; updated §9 forbidden list | Enforces build-storybook ≠ visual approval; status-label + mixed-language contracts |
| `docs/responsive-screenshot-matrix.md` | Added "DS Rendered QA Stories (Task 354-Fix)" sections | Registers new required story targets for the rendered QA matrix |
| `docs/backlog.md` | Updated Last Session | Required per agent-contract |
| `docs/sessions/2026-06-01-task-354-fix-rendered-storybook-mobile-control-localization-ds-contract.md` | New session log | Required per agent-contract |
| `src/components/layout/ActionBar.stories.tsx` (ClassNameMerge) | Button label "Save — className=mt-4 merged" → "Save changes" | Technical debug string must not appear as user-visible button label |
| `src/components/layout/PageHeader.stories.tsx` (AsDiv, ClassNameMerge) | Titles "Available Listings — as=div root element" / "— className=mb-2 merged" → "Available Listings"; descriptions humanized | Props/classNames must not appear in rendered headings or visible descriptions |
| `src/components/layout/FilterBar.tsx` (inline Reset) | `size="sm"` → `size="xl"` on inline desktop Reset button | Fixes one-row-one-height: Reset was 28px while chips/search are 44px; primitive owns this control |
| `src/components/layout/FilterBar.stories.tsx` (rhythm stories) | 6 new `Rhythm_*` stories: chips + search + reset one-row-one-height at Desktop/Tablet/Mobile × en/uk/sq/it | Proves global control-rhythm contract across locales and widths |
| `src/components/layout/FilterBar.stories.tsx` (ZeroActive stories) | Added `FilterChipsLabeled` helper with explicit "Active filters" / "No active filters" + "Available filters" section labels; updated `ZeroActive_Mobile390`, `TwoActive_Mobile390`, `ManyAvailableTwoActive_Mobile390`, `Uk_ZeroActive_Mobile320`, `Uk_TwoActive_Mobile320`, `Uk_SheetOpen_Mobile390` to use labeled fixture | Owner directive: ZeroActive sheet must show "No active filters" label; active-vs-available distinction explicit via section headers; no available chip may appear selected |
| `src/components/layout/ActionBar.stories.tsx` (rhythm stories) | 6 new `Rhythm_PrimarySecondaryDestructive_*` stories: all three action variants at Desktop/Tablet/Mobile × en/uk/sq/it | Proves no action shrinks into tiny pill; full-width stacking on mobile |
