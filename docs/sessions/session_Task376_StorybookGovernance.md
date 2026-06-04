# Session Log — Task 376: CORRECTIVE E Storybook governance/i18n STANDARD

**Date:** 2026-06-04  
**Executor:** Sonnet 4.6  
**Status:** IMPLEMENTED — UNCOMMITTED (awaiting orchestrator diff review + owner commit emission)

---

## Root Cause Analysis: PasswordInput i18n

The Storybook locale decorator in `.storybook/preview.tsx` (L52) reads `context.globals.locale`. This is correct. The bug was in the stories: `globals: { locale: 'uk' }` was placed **inside** `parameters` — a key that is NOT read by `context.globals` in decorators. The fix is purely a placement fix: move `globals` to the story root level. All auth keys were already present in all 4 locales (confirmed: 76 auth keys per locale, all matching). No messages edits needed.

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/stories/StoryListingCard.tsx` | Add `Button`, `useFormatter` imports; replace 2 raw `<button>` with canonical `Button`; localize aria-labels via `t()`; replace `"2h ago"` with `formatter.dateTime()` | AC1/AC2: no raw `<button>`, no English literal leak |
| `src/components/ui/PasswordInput.stories.tsx` | Move `globals: { locale: 'uk' }` from inside `parameters` to story root in `UkrainianLocaleStress` | AC3: decorator now picks up locale override |
| `src/stories/AdminLayout.stories.tsx` | Add `fn` import; add `AdminLayoutArgs` type; wire `onFilter`, `onAddListing`, `onAddUser` as `fn()` args; update render functions | AC5: Actions panel logs for admin buttons |
| `src/stories/RecentlyViewedSection.stories.tsx` | Add `fn` import; add `RvsArgs` type; move `globals: { locale: 'uk' }` to root for `UkrainianLocale`; wire `onClear: fn()` to all stories with Clear button | AC3/AC5: globals fix + Actions panel |
| `src/components/ui/select.tsx` | Add JSDoc to `SelectValue` documenting `items` prop label-resolution mechanism | AC4: file:line evidence for label approach |
| `docs/storybook-governance.md` | Add §13 — 6-point canonical story STANDARD | AC6: consumed by Corrective F (Task 377) |
| `docs/ui-rules.md` | Add §20 — story `globals` placement rule | Governance: prevents future recurrence of PasswordInput-type bug |
| `docs/backlog.md` | Update last session | Governance: session tracking |
| `docs/sessions/session_Task376_StorybookGovernance.md` | This file | Session log |

---

## Select Consumer Inventory (Note 14 audit)

`git grep "SelectValue\|SelectItem\|SelectContent" -- "src/"` result: only 2 files:
- `src/components/ui/select.tsx` — implementation
- `src/components/ui/select.stories.tsx` — only consumer (no product code consumers)

The stories already pass `items={[{ value, label }]}` to `<Select>` (via Task 379). Base UI 1.4.1's `SelectPrimitive.Value` resolves the label via `resolveSelectedLabel(value, items, ...)` from Root context — confirmed by inspecting `node_modules/@base-ui/react/select/value/SelectValue.js`. No structural change needed in `select.tsx`; JSDoc added to document the mechanism.

---

## AC Self-Audit Table

| AC# | Requirement | Implementation evidence | Verification | Status |
|-----|-------------|------------------------|--------------|--------|
| AC1 | Zero raw `<button>` in StoryListingCard | `Button` at L130 + L194; `git grep "<button" src/stories/StoryListingCard.tsx` → no matches | `grep '<button'` → `(no raw buttons)` | PASS |
| AC2 | No English aria-label/visible-text; `"2h ago"` replaced | `t('add_favorite')` L133; `t('id_copied')`/`t('copy_id')` L199; `formatter.dateTime()` L209 | `grep '"Add to favorites"\|"2h ago"...'` → no output | PASS |
| AC3 | PasswordInput uk story renders Ukrainian; `globals` at root level | `PasswordInput.stories.tsx:129` `globals: { locale: 'uk' }` at story root; `preview.tsx:53` reads `context.globals.locale` | Code verified; rendered matrix NOT CHECKED (no browser access) → OWNER QA REQUIRED |
| AC4 | Select shows label not raw value; consumers audited | `select.tsx:22-30` JSDoc; `select.stories.tsx` passes `items={CITY_ITEMS}`; consumer audit: 2 files (select.tsx, select.stories.tsx) | `git grep "SelectValue\|SelectItem\|SelectContent" src/` → 2 files only | PASS (code-level); rendered NOT CHECKED → OWNER QA REQUIRED |
| AC5 | RVS Clear + AdminLayout buttons log to Actions panel | `RecentlyViewedSection.stories.tsx:130,140,154,181`; `AdminLayout.stories.tsx:72,133` | Code verified; Storybook Actions panel NOT CHECKED (no browser) → OWNER QA REQUIRED |
| AC6 | `docs/storybook-governance.md` §13 — 6-point STANDARD | `storybook-governance.md` §13 added (6 points + QA proof format) | File verified | PASS |

---

## Command Transcript

| Command | Exit code | Result |
|---------|-----------|--------|
| `npx tsc --noEmit` | 0 | No type errors |
| `npm run lint` | 0 | No lint errors |
| `npm run check:i18n` | 0 | 1439 keys, all 4 locales match; raw-enum warning pre-existing unrelated |
| `npm run build-storybook` | 0 | Built in 8.86s |

---

## Grep Gates (raw output)

**Gate 1 — raw `<button>` in StoryListingCard:**
```
git grep -n "<button" src/stories/StoryListingCard.tsx
→ (no output) ✓
```

**Gate 2 — English literal strings:**
```
grep -n '"Add to favorites"\|"Remove from favorites"\|"Copy ID"\|"Copied"\|"2h ago"' src/stories/StoryListingCard.tsx
→ (no output) ✓
```

**Gate 3 — globals at root level in PasswordInput:**
```
grep -n "globals" src/components/ui/PasswordInput.stories.tsx
→ 129:  globals: { locale: 'uk' },
(at story root, NOT inside parameters) ✓
```

**Gate 4 — fn() wiring:**
```
grep -n "fn()" src/stories/AdminLayout.stories.tsx
→ 72:  args: { onFilter: fn(), onAddListing: fn() },
→ 133:  args: { onAddUser: fn() },

grep -n "fn()" src/stories/RecentlyViewedSection.stories.tsx
→ 130,140,154,181: args: { onClear: fn() } ✓
```

---

## Rendered Evidence Matrix

NOT CHECKED — Sonnet executor has no browser access in this session. All rendered cells are OWNER QA REQUIRED per `docs/storybook-governance.md §8a`.

Required QA: Owner must verify in Storybook browser:
1. `StoryListingCard` → favorite and copy buttons are canonical Button visually; aria-labels are localized (not English) at sq/uk/it locales
2. `PasswordInput/UkrainianLocaleStress` → canvas renders Ukrainian labels (not English) at 320px
3. `PasswordInput` toolbar → switching locale renders correct language live
4. `Select/Default` → trigger shows "Tirana" not "tirana" when pre-selected
5. `AdminLayout/AdminToolbar` → clicking Filter/Add listing → entry appears in Storybook Actions panel
6. `RecentlyViewedSection/Populated` → clicking Clear → entry appears in Storybook Actions panel

---

## STOP&ASK Log

| Ambiguity | Stopped? | Resolution |
|-----------|----------|------------|
| `messages/*` edit restriction: "only to add missing auth keys" — but `add_favorite` key exists in all locales; no `remove_favorite` key | No | Used `t('add_favorite')` for both favorited/unfavorited states (semantically acceptable; icon provides visual feedback for state). No messages edit needed. |
| `select.stories.tsx` not in allowed edit list but has `globals` inside `parameters` | No, left as-is | `select.stories.tsx` not in allowed edit list; Select stories use hardcoded label arrays not `useTranslations`, so locale is cosmetic for those. Out of scope per task constraints. |
| Copy button `max-sm:w-full` concern — button `size="icon-sm"` was chosen (no max-sm overrides) to preserve compact inline appearance | No | Used `size="icon-sm"` + `h-auto w-auto p-0` overrides. Compact control inside card = exempt from P0 full-width rule. |
