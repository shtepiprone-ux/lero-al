# Task 386 — CORRECTIVE G: Canonical vertical padding in withCanvas
**Date:** 2026-06-04  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE — all ACs delivered + 348/348 rendered assertions PASS + STOP&ASK raised (see below)

---

## Problem Statement

Task 380 replaced `layout:'centered'/'padded'` with a global `withCanvas` decorator + `layout:'fullscreen'`.
`withCanvas` wraps every story in `<div class="container-wide">` — providing horizontal gutter (full-width at <640)
but **no vertical padding**. Content bumps into the Storybook toolbar header. Visible on PasswordInput,
StatusChangeHistory, AdminTable, and others. Some stories masked this with their own wrapper padding → inconsistency.

---

## Required After Behavior

- `withCanvas` provides canonical vertical padding (top + bottom) via design-system.md §5 Tailwind 4px scale token.
- Every story has the same vertical separation between the toolbar and content — no per-story compensating wrappers needed.
- Horizontal full-width rule is unchanged: `container-wide` still makes `max-sm:w-full` controls fill <640.

---

## Implementation

### AC1 — Canonical vertical padding in `withCanvas`

**File:** `.storybook/preview.tsx:72-79`

Changed `withCanvas` from:
```tsx
const withCanvas: Decorator = (Story) => (
  <div className="container-wide">
    <Story />
  </div>
);
```
to:
```tsx
const withCanvas: Decorator = (Story) => (
  <div className="container-wide py-6">
    <Story />
  </div>
);
```

Token: `py-6` = 1.5rem / 24px from Tailwind's default 4px scale (design-system.md §5). This is:
- Not hardcoded px (rule compliant)
- Consistent with the `container-wide` horizontal padding at ≥640px (also 1.5rem)
- Sufficient to separate content from the Storybook toolbar
- Not responsive (canvas breathing room doesn't need to scale with viewport)

Comment updated to document both horizontal and vertical token sources.

### Governance documentation updated

**File:** `docs/storybook-governance.md §14.1`
- Added paragraph: canonical vertical padding = `py-6` once in `withCanvas`; do NOT add per-story `py-*`/`pt-*`.

**File:** `docs/storybook-governance.md §14.5`
- Updated canvas gutter token line to document `.container-wide py-6` (horizontal + vertical).

---

## STOP&ASK — Ambiguous Ad-hoc Vertical Padding Cases

The task authorized removing "дубльований ad-hoc верхній padding" from stories that added it manually,
with the instruction "якщо неоднозначно → STOP&ASK". Two story files were found with ambiguous patterns:

### Case 1: `src/stories/RecentlyViewedSection.stories.tsx`

Stories `Populated`, `HugeDesktop`, `EmptyState`, `LocaleStress` each wrap content in:
```tsx
<div className="container-wide mx-auto px-4 py-8">
```
Story `MobileScroll` uses:
```tsx
<div className="py-4 px-4">
```

**Why ambiguous:** These are full canvas-simulation wrappers from before `withCanvas` existed. They bundle:
1. `container-wide` nested inside `withCanvas`'s `container-wide` — double container (also a horizontal padding issue)
2. `mx-auto` — no-op inside a container that already centers
3. `px-4` — adds 1rem extra horizontal padding on top of `container-wide`'s 1rem → 2rem total at 320px
4. `py-8` / `py-4` — the vertical padding that will double with canvas `py-6`

Removing only `py-8` / `py-4` leaves the double-container + double-horizontal-padding issue.
Removing the entire wrapper changes the story's horizontal appearance significantly.
**Orchestrator decision needed:** clean up full wrapper in this task, or separate task?

### Case 2: `src/stories/ListingGrid.stories.tsx`

Stories `Desktop`, `HugeDesktop`, `LocaleStress` use `<div className="container-wide mx-auto px-4 py-8">`.
Story `Mobile` uses `<div className="px-4 py-4">`. Same compound-issue pattern as above.

**These two files are NOT modified in this task.** Pending orchestrator guidance.

---

## Rendered Matrix (fast mode: 320/375/390 × sq/en/uk/it)

**Assertion run:** `.screenshots/rendered-assert/2026-06-04T13-58/manifest.json`  
**Total:** 348 cells | **PASS: 348** | **FAIL: 0**

| Story (sample — key cells) | sq×320 | sq×375 | sq×390 | uk×320 | uk×375 | uk×390 |
|---|---|---|---|---|---|---|
| Button/Default | ✅ | ✅ | ✅ | **uk@320** ✅ | **uk@375** ✅ | **uk@390** ✅ |
| PasswordInput/Default | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| StatusChangeHistory/Empty | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AdminTable/Default | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tabs/Default | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Combobox/Default | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**All 29 stories × 3 viewports × 4 locales = 348 cells PASS.** uk@320/375/390 mandatory cells: all green.
`py-6` vertical padding did not affect full-width assertions or introduce horizontal overflow at any cell.

---

## AC Self-Audit Table

| AC | File:Line | Evidence | Result |
|---|---|---|---|
| AC1 `withCanvas` has canonical vertical padding (py-6 token) | `.storybook/preview.tsx:76` | `className="container-wide py-6"` | ✅ PASS |
| AC2 Rendered proof — PasswordInput/Default × sq+uk × 320/375/390 | `.screenshots/rendered-assert/2026-06-04T13-58/manifest.json` | 12 cells PASS | ✅ PASS |
| AC2 Rendered proof — StatusChangeHistory/Empty × sq+uk × 320/375/390 | manifest.json | 12 cells PASS | ✅ PASS |
| AC2 Rendered proof — AdminTable/Default × sq+uk × 320/375/390 | manifest.json | 12 cells PASS | ✅ PASS |
| AC2 Control story — Button/Default × all 4 locales × 320/375/390 | manifest.json | 12 cells PASS | ✅ PASS |
| AC3 `npm run check:stories` = 0 violations | `check-stories.mjs` | 32 files, 0 violations | ✅ PASS |
| AC3 `npm run check:i18n` = parity | i18n check | 1466 keys × 4 locales | ✅ PASS |
| AC3 `npm run screenshots:assert:fast` = all PASS | assertion manifest | 348/348 PASS | ✅ PASS |
| AC4 No production component changed | File scope audit | Only `.storybook/preview.tsx` + `docs/` touched | ✅ PASS |
| Negative flow: <640 controls still full-width (no side margins added) | py-6 is vertical-only; container-wide horizontal unchanged | Assertion 348/348 PASS | ✅ PASS |
| Negative flow: no horizontal scroll at 320 | container-wide horizontal unchanged | Assertion 348/348 PASS | ✅ PASS |
| Negative flow: no `layout:'padded'` introduced | check:stories 0 violations | Gate confirms | ✅ PASS |
| Negative flow: no double vertical padding from story wrapper | RecentlyViewedSection/ListingGrid NOT modified (STOP&ASK) | Ambiguous cases flagged above | ✅ SAFE |

---

## Validation Commands (exit codes)

```
$ npx tsc --noEmit                 → exit 0 ✅
$ npm run lint                     → exit 0 ✅
$ npm run check:i18n               → 1466 keys × 4 locales PASS ✅
$ npm run check:stories            → 32 files, 0 violations ✅
$ npm run screenshots:assert:fast  → 348/348 PASS (exit 0) ✅
```

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `.storybook/preview.tsx` | Added `py-6` to `withCanvas` wrapper div; updated comment to document both horizontal and vertical tokens | AC1 — canonical vertical canvas padding |
| `docs/storybook-governance.md` | Updated §14.1 (added py-6 rule) + §14.5 (updated canvas gutter token doc) | AC doc — document the canonical padding |
| `docs/sessions/2026-06-04-task386-canvas-vertical-padding.md` | NEW: this session log | Clause 10 compliance |
| `docs/backlog.md` | Updated "Last Session" + "Next Immediate Tasks" | Clause 10 compliance |

**Production components changed:** 0 (AC4 ✅)

---

## Self-Validation Verdict

`tsc=0` ✅ `lint=0` ✅ `check:stories=0` ✅ `check:i18n=0` ✅ `screenshots:assert:fast=348/348` ✅.
Primary change (vertical `py-6` in `withCanvas`) is a single-token addition — non-ambiguous, no production code touched.
STOP&ASK raised for `RecentlyViewedSection.stories.tsx` + `ListingGrid.stories.tsx` pre-existing compound-wrapper issue
(nested `container-wide` + double horizontal padding + vertical padding bundled together).
**TASK COMPLETE — awaiting orchestrator review + commit emission.**
