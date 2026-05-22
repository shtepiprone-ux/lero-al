# Task 167 — Dashboard status i18n: status_active / status_inactive

**Date:** 2026-05-22  
**Sprint:** Sprint 5 (post-deploy bugfixes)  
**Status:** ✅ DONE

## Problem

Admin dashboard rendered raw keys `listing.status_active` and `listing.status_inactive` in the status-breakdown bars and recent-listing badge. `sold` / `rented` / `archived` translated fine. Root cause: two keys were absent from the `listing` namespace in all 4 catalogs.

## Change

Added `status_active` and `status_inactive` to the `listing` namespace in all four locale files, placed after `status_pending` and before `status_sold`.

| Locale | status_active | status_inactive |
|--------|---------------|-----------------|
| sq     | Aktiv         | Joaktiv         |
| en     | Active        | Inactive        |
| uk     | Активне       | Неактивне       |
| it     | Attivo        | Non attivo      |

Files changed:
- `messages/sq.json`
- `messages/en.json`
- `messages/uk.json`
- `messages/it.json`

No source-code changes. No other namespace touched.

## Verification

- Grep confirms keys now present at `listing` namespace (lines ~159-160, before `cabinet` at line 403).
- Locale parity: all 4 catalogs share the same key set.
