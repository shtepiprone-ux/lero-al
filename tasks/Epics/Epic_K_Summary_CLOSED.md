# Epic K — Admin Tables Standardization — CLOSED

**Status:** COMPLETE
**Opened:** 2026-05-19
**Closed:** 2026-05-21

---

## Goal (achieved)

Every admin table follows the same row-interaction pattern: clickable title, no duplicate actions column, canonical Dialog for confirmation. Documented in `docs/component-governance.md §11`.

---

## Tasks completed

| Task | Epic sub | Description | Session log |
|------|----------|-------------|-------------|
| 127 | K.1 | Canonical AdminTableRow pattern defined and audited | [log](../../docs/sessions/2026-05-21-task-127-k1-admin-table-pattern.md) |
| 128 | K.2 | AdminListingsTable migrated (title→Dialog, remove actions col) | [log](../../docs/sessions/2026-05-21-task-128-k2-listings-table-canonical.md) |
| 129 | K.3 | AdminUsersTable migrated (name already clickable, removed actions col) | [log](../../docs/sessions/2026-05-21-task-129-k3-users-table-canonical.md) |
| 130 | K.4 | All remaining tables migrated (Locations, PropertyTypes, Companies, Currencies, ExchangeProviders) | [log](../../docs/sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md) |

---

## Pattern (see §11 in docs/component-governance.md)

1. Row primary text = single clickable affordance → opens Dialog or navigates to detail page
2. No dedicated "Actions" column
3. Quick toggles (verify, active, featured) move inline as small icon buttons
4. Destructive confirmation via Dialog (never window.confirm())
5. Canonical primitives: Button, Dialog, sonner toast

## Reference implementation: `AdminReportsManager` (already canonical before Epic K)
