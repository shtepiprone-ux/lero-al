# Session Archive: Epic K.1 — Canonical Admin Table Row Pattern — 2026-05-21

## Task 127 — Define canonical AdminTableRow pattern

**Status:** COMPLETE

---

## What was done

Audited all 8 admin table/manager components and documented the canonical admin table row interaction pattern in `docs/component-governance.md §11`.

## Audit findings

| Component | Clickable title | Actions col | Delete method | Status |
|---|---|---|---|---|
| `AdminReportsManager` | ✅ → Dialog | ❌ | Dialog | **CANONICAL** — reference impl |
| `AdminUsersTable` | ✅ → profile page | ⚠️ verify toggle | — | Mostly OK |
| `AdminListingsTable` | ❌ | ✅ Pencil+Trash+Star | `window.confirm()` | K.2 migration |
| `AdminCompaniesManager` | ❌ | ✅ Pencil+Trash | Dialog | K.4 migration |
| `AdminLocationsManager` | ❌ | ✅ Pencil+Trash | `window.confirm()` | K.4 migration |
| `AdminPropertyTypesManager` | ❌ | ✅ Pencil+Trash | Dialog | K.4 migration |
| `AdminEmailTemplatesManager` | ✅ Edit button | Pencil+Trash | Dialog | K.4 review |
| `AdminCurrenciesManager` | — | ✅ buttons | — | K.4 audit |

## Canonical pattern (summary)

1. **Single click affordance** — primary text (title/name) is the only clickable element
2. **No Actions column** — icon buttons removed from rows
3. **Click outcome**: Dialog (no detail page) or Link (detail page exists)
4. **Destructive confirmation**: Dialog, never `window.confirm()`
5. **Canonical primitives**: Button, Dialog, sonner toast

Reference implementation: `AdminReportsManager.tsx`

## Next tasks

- **K.2** (Task 128): AdminListingsTable — add preview Dialog, remove actions column, replace window.confirm()
- **K.3** (Task 129): AdminUsersTable — remove the "actions" column (verify toggle → move to profile page)
- **K.4** (Task 130): Audit + migrate remaining tables (Companies, Locations, PropertyTypes, Currencies, EmailTemplates)

## Files modified

- `docs/component-governance.md` — new §11 with pattern definition, audit table, migration checklist
