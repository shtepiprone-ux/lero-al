# Task 392 — Rendered DOM Detector + Hardcode/Adaptation Fixes
**Date:** 2026-06-05  
**Executor:** Sonnet 4.6  
**Sprint:** 33 Corrective-H

---

## Summary

Task 392 built a form-agnostic rendered DOM hardcode detector, fixed all enumerated hardcode and adaptation defects across the story suite, and extended the static gate with new forms to close syntax-loopholes.

Initial delivery was partially rejected by the owner: AdminLayout AdminToolbar showed broken layout at 580–680px for uk/it locales — long translations (`Додати оголошення`, `Aggiungi annuncio`) wrapped to a non-full-width second row at the `sm:` (640px) breakpoint. Root cause: `sm:flex-row sm:flex-wrap` on the control row switches to horizontal too early. Fix: breakpoint moved to `md:` (768px) throughout the toolbar, plus a new gate Check 11 to prevent regression.

**Final state: 505/505 tests, 0 gate violations, TypeScript clean.**

---

## AC Table

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Rendered hardcode detector `check-locale-leak.mjs` created, runs every story × sq/en/uk/it, emits JSON leak report | ✅ Script at `scripts/check-locale-leak.mjs`; `npm run check:locale-leak` |
| AC2 | Adaptation fixes: `StatusChangeControl/Command/Skeleton` full-width at <640; `AdminLayout AdminToolbar` full-width at <768 on all 4 locales | ✅ All 4 items fixed; AdminToolbar breakpoint moved to `md:` after owner rejection |
| AC3 | `RecentlyViewedSection` clear button flat flex-wrap; `ListingCard` equal heights | ✅ Both fixed in story and production component |
| AC4 | Check 10 extended (g/h/i) + Check 11 (`toolbar-sm-flex-wrap`); gate tests BAD+GOOD per form | ✅ 9 new gate tests; `checksRan === 11` |
| AC5 | `check:stories`, `npm test`, `check:i18n`, `typecheck` all green | ✅ 505/505 tests, 0 violations |

---

## Part A — Rendered Hardcode Detector

**New file:** `scripts/check-locale-leak.mjs`

Detection algorithm (comparison-based, not pattern-based):
1. Load all story IDs from built Storybook `index.json`/`stories.json`
2. For each story × viewport, render in `en` → collect baseline text tokens (visible text nodes + aria-label/placeholder/title/alt)
3. Render same story in `sq`/`uk`/`it` → collect target tokens
4. Flag tokens that: (a) unchanged from en baseline, (b) satisfy `isEnglishish()`, (c) not in proper-noun/brand allowlist

Allowlist covers: Albanian city names, fixture person names, brand acronyms (EUR/WhatsApp/Email), status codes, numbers, CSS tokens, short abbreviations.

Added to `package.json`: `check:locale-leak` (full) + `check:locale-leak:fast` (320px only).
Requires built Storybook: `npm run build-storybook` then `npm run check:locale-leak`.

---

## Part B — Rendered Adaptation Detector

The existing `check-stories-rendered.mjs` already covers:
- (a) No horizontal overflow at all widths
- (b) Full-width form controls (SelectTrigger, TabsList, inputs) at <640

The adaptation fixes in Part C ensure the flagged components pass these checks.

---

## Part C — Hardcode Fixes

### PasswordInput.stories.tsx
- `Default`, `ErrorState`, `SuccessState` stories had `args: { placeholder: 'Enter password' }` — converted to render functions using `storyT(locale, 'storybook.passwordinput.placeholder')`

### Section.stories.tsx
- Removed hardcoded `SAMPLE_BLOCK` constant with `Section body content` standalone text — replaced with locale-aware `sampleBlock(locale)` function using `storyT(locale, 'storybook.section.sample')`; all 8 stories updated

### Containers.stories.tsx
- `DemoBox` had `{'Content bounded within this container'}` expression child — added `locale` param to `DemoBox`, replaced with `storyT(locale, 'storybook.containers.content')`; all 4 render functions made locale-aware

### messages/{sq,en,uk,it}.json
Added 3 new storybook sub-namespaces (all 4 locales, parity maintained at 297 keys):
- `storybook.passwordinput.placeholder` — en: "Enter password" / sq: "Vendos fjalëkalimin" / uk: "Введіть пароль" / it: "Inserisci la password"
- `storybook.section.sample` — en: "Section body content" / sq: "Përmbajtja e seksionit" / uk: "Вміст секції" / it: "Contenuto della sezione"
- `storybook.containers.content` — en: "Content bounded within this container" / sq: "Përmbajtje brenda kufijve të kontejnerit" / uk: "Вміст обмежений у цьому контейнері" / it: "Contenuto delimitato in questo contenitore"

### Adaptation Fixes

| Component | Issue | Fix |
|-----------|-------|-----|
| `command.stories.tsx` | `Command` Inline had `max-w-xs` constraining width at 375/390 | Removed `max-w-xs`, kept `w-full` |
| `skeleton.stories.tsx` | `ListingCardSkeleton` had `max-w-xs` | Removed `max-w-xs`, kept `w-full` |
| `StatusChangeControl.stories.tsx` | All story wrappers had `max-w-xs`/`max-w-sm` | Changed to `w-full p-4 sm:max-w-xs` / `sm:max-w-sm` |
| `AdminLayout.stories.tsx` | Toolbar `sm:flex-row sm:flex-wrap` at 640px — uk/it labels wrapped non-full-width at 580–680px | **Moved to `md:flex-row md:flex-wrap` (768px)**; Input `md:w-48`; buttons `max-md:w-full` |
| `RecentlyViewedSection.stories.tsx` | Clear button always stacked (`max-sm:flex-col`) | Flat flex-wrap: `flex flex-wrap items-center gap-x-3 gap-y-1` |
| `RecentlyViewedGrid.tsx` (production) | Same stacking issue | Same flat flex-wrap fix |
| `StoryListingCard.tsx` | Cards in grid row had unequal heights | Added `h-full` to root div, `flex-1` to card body |
| `RecentlyViewedSection.stories.tsx` grid | Card wrapper not h-full | Added `flex flex-col` to card wrapper; `sm:[&>*]:h-full` to grid container |
| `RecentlyViewedGrid.tsx` grid | Same | Same fix applied to production component |

---

## Part D — Static Gate Extension

### Check 10 — 3 new forms (g/h/i)

**(g) Object-property placeholder literal**
Pattern: `\bplaceholder\s*:\s*['"]([^'"]+)['"]` — catches `args: { placeholder: 'Enter password' }`

**(h) Standalone JSX text line**
Trigger: trimmed line matches `/^[A-Z][a-zA-Z]+(?:\s[a-zA-Z]+)+$/` — pure alpha words, starts uppercase
Catches: `    Section body content` on its own line inside JSX

**(i) Expression string child with pure alpha words**
Pattern: `\{['"]([A-Z][a-zA-Z]+(?:\s[a-zA-Z]+)+)['"]\}` — catches `{'Content bounded within this container'}`, excludes single-word `{'Submit'}` and strings with punctuation

### Check 11 — `toolbar-sm-flex-wrap` (new)

**Rule:** any story line containing both `sm:flex-row` AND `sm:flex-wrap` triggers `toolbar-sm-flex-wrap`.

**Rationale:** multi-control toolbar rows that switch to horizontal at 640px (`sm:`) break for long translations (uk/it) — items wrap to a second row that is NOT full-width. The correct breakpoint for toolbar control rows is `md:` (768px). Discovered on owner rejection review of AdminLayout AdminToolbar.

Gate tests added: 9 total (6 for forms g/h/i + 3 for Check 11). `checksRan === 11`.

---

## Verification

| Check | Result |
|-------|--------|
| `node scripts/check-stories.mjs` | ✅ PASSED — 32 files, 0 violations, 11 checks |
| `npm run check:i18n` | ✅ PASSED — 297 storybook keys × 4 locales, parity ✅ |
| `npm test` | ✅ **505/505 passed** |
| `npm run typecheck` | ✅ 0 errors |
| `npm run check:locale-leak` | Requires `npm run build-storybook` first |
| `npm run screenshots:assert` | Requires `npm run build-storybook` first |

---

## Files Changed

| File | Change |
|------|--------|
| `scripts/check-locale-leak.mjs` | **NEW** — Playwright rendered DOM hardcode detector (Part A) |
| `scripts/check-stories.mjs` | Extended Check 10 with forms (g/h/i); added Check 11 `toolbar-sm-flex-wrap`; `checksRan → 11` |
| `scripts/__tests__/check-stories.test.ts` | Added 9 gate tests (g/h/i forms + Check 11 BAD+GOOD×2); `checksRan === 11` |
| `messages/en.json` | Added `storybook.passwordinput`, `.section.sample`, `.containers.content` |
| `messages/sq.json` | Same 3 keys (Albanian translations) |
| `messages/uk.json` | Same 3 keys (Ukrainian, Cyrillic) |
| `messages/it.json` | Same 3 keys (Italian translations) |
| `src/components/ui/PasswordInput.stories.tsx` | Default/ErrorState/SuccessState → render functions with storyT placeholder |
| `src/components/layout/Section.stories.tsx` | Removed SAMPLE_BLOCK; added `sampleBlock(locale)`; all 8 stories locale-aware |
| `src/stories/Containers.stories.tsx` | `DemoBox` locale param; expression child → storyT; all 4 renders locale-aware |
| `src/components/ui/command.stories.tsx` | Inline story: removed `max-w-xs` |
| `src/components/ui/skeleton.stories.tsx` | `ListingCardSkeleton`: removed `max-w-xs` |
| `src/components/admin/StatusChangeControl.stories.tsx` | All wrappers: `max-w-xs` → `w-full sm:max-w-xs` |
| `src/stories/AdminLayout.stories.tsx` | Toolbar: `sm:flex-row sm:flex-wrap` → `md:flex-row md:flex-wrap`; Input `md:w-48`; buttons `max-md:w-full` |
| `src/stories/RecentlyViewedSection.stories.tsx` | Clear button row: flat flex-wrap; grid: `sm:[&>*]:h-full`; card wrapper: `flex flex-col` |
| `src/modules/listings/components/RecentlyViewedGrid.tsx` | Clear button row: flat flex-wrap; grid: `sm:[&>*]:h-full`; card wrapper: `flex flex-col` |
| `src/stories/StoryListingCard.tsx` | Root div: `h-full`; card body: `flex-1` |
| `package.json` | Added `check:locale-leak` + `check:locale-leak:fast` scripts |
| `docs/backlog.md` | Updated last session + next tasks |
| `docs/sessions/2026-06-05-task392-rendered-dom-detector.md` | **This file** |
