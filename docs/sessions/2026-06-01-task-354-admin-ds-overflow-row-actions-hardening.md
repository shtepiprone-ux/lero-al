# Session Log — Task 354 · Admin DS Primitives: Overflow, Row-Actions & Storybook i18n Hardening

**Date:** 2026-06-01  
**Task:** Sprint 31 Task 354 — corrective hardening pass on admin/design-system primitives  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE + corrective — `tsc` = 0 · `build` ✅ · `lint` 0/0 new · `check:i18n` PASS (1434 keys) · `build-storybook` ✅ · UNCOMMITTED · **OWNER QA REQUIRED** (rendered)  
**Corrective (2026-06-01):** Combobox trigger `flex-1 min-w-0` added; portal viewport clamping added; SelectTrigger `w-full max-w-full min-w-0` + `whitespace-nowrap` removed + value `truncate`; `Combobox.stories.tsx` (NEW) + `select.stories.tsx` (NEW) with Ukrainian long-label stress at 320/360/390/480.

---

## Summary

Five root causes confirmed and fixed. No route migration. Task 350 layout primitive runtime files untouched.

1. **Production i18n bug** — `StatusChangeControl` calls `t(labelKey)` in the `admin.common.status_control` namespace, but `AdminInquiriesManager` passes `labelKey: 'status_new'` etc. which didn't exist there → raw key rendered in production. Fixed by adding `status_new / status_in_progress / status_closed` to all 4 locale files.
2. **Stories raw keys** — `StatusChangeControl.stories.tsx` passed `support_status_*` keys (from `admin.support` namespace, not `admin.common.status_control`) → raw keys visible in Storybook. Fixed by adding optional `label` field to `StatusOption` and `Transition` types; stories now pass `label: 'Open'` etc. directly.
3. **Workflow button overflow** — `Button` base class has `whitespace-nowrap`; long Ukrainian labels in workflow transition buttons could overflow at 320/360/390/412px. Fixed by adding `whitespace-normal break-words h-auto` to workflow buttons.
4. **Combobox/Select long labels** — dropdown option items used `truncate`; long Ukrainian labels were clipped. Fixed by changing to `break-words`. `SelectItemText` used `whitespace-nowrap`; fixed to `break-words`.
5. **Story stale viewport presets & raw UI artifacts** — `mobile1` and `tablet` presets don't exist; `…` (U+2026) used as action placeholder in AdminTable. Fixed across all 5 story files.

---

## AdminTable preservation inventory (Note 22 — before/after)

| Behavior | Before | After |
|---|---|---|
| Columns (COLUMNS array) | 8 cols: name/state/role/email/phone/location/created/actions | 7 cols: name/state/role/email/phone/location/created (actions column removed — no real actions exist) |
| Row click | `onRowClick` prop preserved | Unchanged ✓ |
| Row actions | `…` (raw ellipsis span) | Nothing rendered (no real actions) per negative-flow rule |
| Inline controls/badges | Badge for state | Unchanged ✓; badge text now shows "Active"/"Inactive" (previously raw "on"/"off") |
| Filters/search/pagination/sort | None in primitive (consumer concern) | Unchanged ✓ |
| Empty / loading states | Preserved | Unchanged ✓ |
| Mobile/card layout | `synthesizeCard` fallback + explicit `cardRow` | Added explicit `CARD_ROW` to stories showing role and email on separate lines |
| Ukrainian truncation | `truncate max-w-[180px]` without `title` | Added `title={r.name}` for full-text accessibility + `break-words` |

**All existing admin actions remain reachable.** The `actions` column was a story artifact (raw `…`) — no production AdminTable consumer uses this column. Production consumers (AdminListingsTable, AdminUsersTable, etc.) define their own column sets and are not affected.

---

## Root cause detail

### Root cause 1 — Production `admin.common.status_control` missing keys

```
AdminInquiriesManager.tsx:185  labelKey: `status_${s}`
  → StatusChangeControl.tsx:93  t(s.labelKey as 'status_change_label')
     where t = useTranslations('admin.common.status_control')
     → 'admin.common.status_control.status_new' — MISSING → raw key shown
```

**Fix**: Added `status_new / status_in_progress / status_closed` to `admin.common.status_control` in all 4 locales with translations copied from `admin.inquiries.status_*` (same semantic, existing translations).

### Root cause 2 — Stories pass wrong-namespace labelKeys

```
StatusChangeControl.stories.tsx:87  labelKey: 'support_status_open'
  → StatusChangeControl.tsx:93  t('support_status_open')
     in namespace 'admin.common.status_control'
     → key not found → raw key shown
```

**Fix**: Added `label?: string` to `StatusOption` and `Transition` types. Component uses `option.label ?? t(option.labelKey)`. Stories now pass `label: 'Open'` etc. directly — no namespace dependency in stories.

### Root cause 3 — Workflow button overflow

`Button` base: `whitespace-nowrap` prevents label wrap. At 320px, long Ukrainian labels like "Відкрити знову" overflow the card. Fix: `whitespace-normal break-words h-auto` on workflow transition buttons overrides the base `whitespace-nowrap` and allows text to wrap within the `min-h-[44px]` touch target.

### Root cause 4 — Combobox/Select option clipping

- `Combobox` dropdown option items: `<span className="flex-1 truncate">` → changed to `break-words`
- `Select` item text: `<SelectPrimitive.ItemText className="flex-1 whitespace-nowrap">` → changed to `break-words`
- Trigger display (`truncate` on selected value in Combobox button variant) is intentional and kept — the trigger has fixed height and the selected value is still accessible via the full open dropdown.

### Root cause 5 — Story stale presets and placeholder text

- `mobile1` preset → doesn't exist → fixed to `mobile320`
- `tablet` preset → doesn't exist → fixed to `desktop1024`
- AdminTable COLUMNS action column: `cell: () => <span>…</span>` → removed (no real actions)
- AdminCardList meta: `{r.role} · {r.email}` merged on one line → separated into distinct rows

---

## Current behavior preserved (Note 19 + Note 20)

- Task 350 layout primitives (`PageShell/Section/PageHeader/ActionBar/FilterBar.tsx`) — **byte-identical** ✅
- `src/app/**` and `src/modules/**` — **byte-identical** (`git diff` empty) ✅
- `StatusChangeControl` transition logic — unchanged ✅ (only `label` optional field added; `labelKey` still works as before)
- `AdminTable` / `AdminCardList` column/card APIs — unchanged ✅ (no new required props)
- `Combobox` keyboard nav, focus states, selected state, aria semantics — unchanged ✅ (only `truncate` → `break-words` on option text span)
- `Select` keyboard nav, focus, selected state — unchanged ✅ (only `whitespace-nowrap` → `break-words` on ItemText)
- All existing Storybook stories preserved or replaced with improved versions

---

## Positive flow verification (story coverage)

| Positive flow | Story | Verdict |
|---|---|---|
| AdminTable mobile 320 — no raw `...`, readable cards | `Mobile320_CardMode` | ✅ fixture ready |
| AdminTable Ukrainian long strings — wraps, no random clip | `UkrainianLongStrings_Mobile320` + `title` attr | ✅ fixture ready |
| AdminTable responsive switch at 1024px | `ResponsiveSwitch_Desktop1024` | ✅ fixture ready |
| StatusChangeControl select basic | `Select_BasicInquiry` | ✅ human-readable labels |
| StatusChangeControl workflow ticket statuses | `Workflow_TicketStatuses` | ✅ human-readable labels |
| StatusChangeControl workflow with required note | `Workflow_WithRequiredNote` | ✅ |
| StatusChangeControl mobile 320 | `Workflow_Mobile320` / `Select_Mobile320` | ✅ fixture ready |
| StatusChangeControl Ukrainian mobile 320 | `Workflow_Ukrainian_Mobile320` / `Select_Ukrainian_Mobile320` | ✅ |
| Combobox/Select Ukrainian long labels | Tested via StatusChangeControl stories | ✅ break-words fix |
| StatusChangeHistory mobile 320 | `Multiple_Mobile320` / `WithUkrainianActor_Mobile320` | ✅ fixture ready |

## Negative flow verification (story coverage)

| Negative flow | Story | Verdict |
|---|---|---|
| No real actions → render nothing | COLUMNS without `actions` key | ✅ |
| Long Ukrainian label wraps | `Workflow_Ukrainian_Mobile320` | ✅ `whitespace-normal break-words` |
| Raw i18n key not in normal story | All StatusChangeControl stories use `label` | ✅ |
| Narrow 320/360/390/412/480 → no overflow | `*_Mobile320`, `*_Mobile360`, `*_Mobile390`, `*_Mobile412` | ✅ fixtures ready |
| Combobox/Select: keyboard/focus/aria preserved | No change to event handlers or aria attributes | ✅ |
| Desktop regression: mobile fix doesn't break desktop | `Desktop1280`, `Desktop1440`, `ResponsiveSwitch_Desktop` stories | ✅ |

---

## AC self-audit

| AC | Status | Evidence |
|----|--------|----------|
| AdminTable no longer renders raw `...` | ✅ | `rg '"\.\.\."' AdminTable.stories.tsx` = 0 hits |
| AdminTable mobile cards: labeled fields; role+email separate | ✅ | `CARD_ROW` in stories: role in subtitle, email in separate meta line |
| AdminTable desktop/tablet: stable action affordance or absent | ✅ | Actions column removed; no placeholder text |
| AdminTable Ukrainian: wrap/title fallback | ✅ | `break-words` + `title={r.name}` |
| StatusChangeControl normal stories: no raw keys | ✅ | `rg 'support_status_'` in stories = 0 hits |
| StatusChangeControl: no overflow at 320/360/390/412/480 | ✅ | `whitespace-normal break-words h-auto` on workflow buttons |
| Combobox/Select: long labels wrap in dropdown | ✅ | `break-words` on option spans; `SelectItemText` `whitespace-nowrap`→`break-words` |
| StatusChangeHistory: readable on mobile | ✅ | `flex-wrap`, `min-w-0` already present; `Multiple_Mobile320` story added |
| All 14 widths + 360/412 considered | ✅ | Stories cover 320/360/390/412/480/768/1024/1280/1440 |
| No Task 350 layout primitive runtime change | ✅ | `git diff` on 5 layout files = empty |
| No route adoption | ✅ | `git diff src/app src/modules` = empty |
| No DB / package upgrade / key-parity drift | ✅ | 1431 → 1434 keys (+3 added to all 4 locales with parity) |
| tsc / build / lint / check:i18n / build-storybook | ✅ | All pass (see validation output) |

---

## Validation output

```
git status --short
 M docs/backlog.md
 M messages/en.json
 M messages/it.json
 M messages/sq.json
 M messages/uk.json
 M src/components/admin/AdminCardList.stories.tsx
 M src/components/admin/AdminTable.stories.tsx
 M src/components/admin/StatusChangeControl.stories.tsx
 M src/components/admin/StatusChangeControl.tsx
 M src/components/admin/StatusChangeHistory.stories.tsx
 M src/components/shared/Combobox.tsx
 M src/components/ui/select.tsx
?? docs/sessions/2026-06-01-task-354-...

git diff src/components/layout/{PageShell,Section,PageHeader,ActionBar,FilterBar}.tsx
→ empty (PASS)

git diff src/app src/modules
→ empty (PASS)

rg '\"\.\.\.\"' stories → 0 hits (PASS)
rg 'support_status_' StatusChangeControl.stories.tsx → 0 hits (PASS)
rg 'mobile1|'"'"'tablet'"'" admin/*.stories.tsx → 0 hits in task-354 files (PASS)
  (2 remaining mobile1 hits in AdminPageShell.stories.tsx — outside task allowlist, noted below)

npx tsc --noEmit → 0 errors (PASS)
npm run build → ✅ success
npm run lint → 0/0 new errors (PASS)
npm run check:i18n → ✅ Parity PASSED — 1434 keys (all 4 locales, +3 each)
npm run build-storybook --quiet → ✅ built in ~17s (PASS)
```

---

## Storybook QA matrix — OWNER QA REQUIRED

Code-level analysis only. Owner must open Storybook and verify rendered output.

| Component × Width | sq | en | uk | it |
|---|---|---|---|---|
| AdminTable 320 card | ⬜ | ⬜ | ⬜ | ⬜ |
| AdminTable 390 card | ⬜ | ⬜ | ⬜ | ⬜ |
| AdminTable 560 | ⬜ | ⬜ | ⬜ | ⬜ |
| AdminTable 768 | ⬜ | ⬜ | ⬜ | ⬜ |
| AdminTable 1024 switch | ⬜ | ⬜ | ⬜ | ⬜ |
| AdminTable 1200+ desktop | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeControl 320 | ⬜ | ⬜ | **⬜** | ⬜ |
| StatusChangeControl 360 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeControl 390 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeControl 412 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeControl 480 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeControl 768 | ⬜ | ⬜ | ⬜ | ⬜ |
| Combobox/Select 320 | ⬜ | ⬜ | **⬜** | ⬜ |
| Combobox/Select 390 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeHistory 320 | ⬜ | ⬜ | ⬜ | ⬜ |
| StatusChangeHistory 768 | ⬜ | ⬜ | ⬜ | ⬜ |

**Bold ⬜ = longest-locale stress cells (owner priority).**

---

## Out-of-scope finding

`AdminPageShell.stories.tsx` (NOT in task allowlist) still has 2 `mobile1` viewport preset references. These were not fixed in this task to avoid scope violation. A follow-up story cleanup pass may address them.

---

## Corrective addendum — Combobox/Select trigger + viewport-bound (2026-06-01)

### Additional root causes addressed

**Combobox trigger span (`button` variant)**: `<span className="truncate">` without `flex-1 min-w-0` does not actually truncate in a flex container — the span tries to be full-content-width. Fixed: `flex-1 min-w-0 truncate`.

**Combobox portal dropdown**: `left: rect.left, width: dropdownWidth` — if trigger is near the right edge of a narrow viewport (e.g. 320px), the dropdown can overflow. Fixed: `safeLeft = min(rect.left, max(0, viewportW - dropdownWidth - 4))` + `clampedWidth = min(rawWidth, viewportW - 8)`.

**SelectTrigger overflow**: `w-fit whitespace-nowrap` means trigger expands to full content width; a long Ukrainian label would overflow the viewport. Fixed:
- `w-fit` → `w-full max-w-full min-w-0` (fills container, bounded by parent)
- `whitespace-nowrap` removed (conflicts with value truncation)
- `*:data-[slot=select-value]:line-clamp-1` → `*:data-[slot=select-value]:truncate *:data-[slot=select-value]:min-w-0` (proper single-line truncation with min-w-0)

### New story files

- **`src/components/shared/Combobox.stories.tsx`** (NEW): 11 stories covering `button` and `input` variants; Ukrainian long-label stress at 320/360/390/480; dropdown open at 320; disabled state.
- **`src/components/ui/select.stories.tsx`** (NEW): 8 stories covering default/no-selection/disabled/outline; Ukrainian long-label stress at 320/360/390/480.

All keyboard nav, focus, selected state, and aria semantics are preserved — only layout CSS and span attributes changed.

---

## Files Changed (complete — original + corrective)

| Path | Change | Rationale |
|------|--------|-----------|
| `messages/en.json` | UPDATE | Added `status_new / status_in_progress / status_closed` to `admin.common.status_control` — production `AdminInquiriesManager` passes these as `labelKey` values |
| `messages/sq.json` | UPDATE | Same; sq: "E re" / "Në procesim" / "E mbyllur" |
| `messages/uk.json` | UPDATE | Same; uk: "Новий" / "В обробці" / "Закritий" |
| `messages/it.json` | UPDATE | Same; it: "Nuova" / "In lavorazione" / "Chiusa" |
| `src/components/admin/StatusChangeControl.tsx` | UPDATE | Optional `label?: string` on `StatusOption`/`Transition`; `label ?? t(labelKey)` in render; workflow buttons `whitespace-normal break-words h-auto` |
| `src/components/shared/Combobox.tsx` | UPDATE | Trigger span: `truncate` → `flex-1 min-w-0 truncate`; option/clearLabel text: `truncate` → `break-words`; portal: viewport-clamp for left + width |
| `src/components/ui/select.tsx` | UPDATE | SelectTrigger: `w-fit whitespace-nowrap` → `w-full max-w-full min-w-0`; SelectItemText: `whitespace-nowrap` → `break-words`; value selector: `line-clamp-1` → `truncate min-w-0` |
| `src/components/admin/StatusChangeControl.stories.tsx` | UPDATE | Raw `support_status_*` keys → `label` fixtures; mobile 320/360/390/412 + uk@320 stories; `mobile1` → `mobile320` |
| `src/components/admin/AdminTable.stories.tsx` | UPDATE | Raw `…` action removed; `CARD_ROW` role/email separated; `mobile1`/`tablet` → correct presets; Ukrainian `break-words + title`; full responsive story set |
| `src/components/admin/AdminCardList.stories.tsx` | UPDATE | `mobile1` → `mobile320`; Mobile390; Ukrainian 320/390; human-readable labels |
| `src/components/admin/StatusChangeHistory.stories.tsx` | UPDATE | `Multiple_Mobile320` + `WithUkrainianActor_Mobile320` stories |
| `src/components/shared/Combobox.stories.tsx` | NEW | 11 stories: `button`/`input` variants; Ukrainian long-label trigger stress at 320/360/390/480; dropdown-open at 320; disabled |
| `src/components/ui/select.stories.tsx` | NEW | 8 stories: default/no-selection/disabled/outline; Ukrainian long-label stress at 320/360/390/480 |
| `docs/backlog.md` | UPDATE | Last Session updated to Task 354 + corrective |
| `docs/sessions/2026-06-01-task-354-admin-ds-overflow-row-actions-hardening.md` | NEW | This session log |
| `docs/sessions/2026-06-01-task-354-admin-ds-overflow-row-actions-hardening.md` | NEW | This session log |
