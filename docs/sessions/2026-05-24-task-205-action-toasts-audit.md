# Task 205 — T.1: Action toasts audit + implementation

**Date:** 2026-05-24  
**Epic:** T — Global UX Polish & Forms  
**Status:** ✅ Complete

## Action → Toast Inventory

### Already had toasts (no change)

| Component | Actions |
|-----------|---------|
| `AdminUserProfile` | Save profile, deactivate, reactivate, avatar upload/error |
| `AdminLocationsManager` | Create, update, delete location |
| `AdminPropertyTypesManager` | Create, update, delete property type |
| `AdminCurrenciesManager` | Create, update, toggle active |
| `AdminEmailTemplatesManager` | Save template |
| `AdminExchangeProvidersManager` | Create, update provider |
| `AdminPermissionsManager` | Toggle permission |
| `AdminPopularLocationsManager` | Save order, add/remove featured |
| `AdminReportsManager` | Change report status |
| `AdminSupportManager` | Update ticket status |
| `AdminCompaniesManager` | Save, delete company |
| `ProfileTab` (cabinet) | Save profile, change password, change email |
| `SaveSearchButton` | Save / delete saved search |
| `SaveToCollectionButton` | Add / remove from collection |
| `CollectionsSection` | Create / delete collection |
| `ListingReportDialog` | Submit report |
| `ClearRecentlyViewedButton` | Clear recently viewed |
| `ListingsTab` (cabinet) | Delete own listing |

### Deliberate non-toast patterns (acceptable)

| Component | Pattern | Reason |
|-----------|---------|--------|
| `ListingFormShell` | Full-page success state | Intentional design; `if (done)` renders a dedicated confirmation screen with icon + text |
| `FavoriteButton` success | Optimistic icon flip | Heart icon change IS the visual feedback on success |

### Gaps filled — 4 actions

| Component | Action | New toast |
|-----------|--------|-----------|
| `AdminUsersTable` | Toggle verify (main table) | `toast.success(verify_success / revoke_success)` |
| `AdminUsersTable` | Revoke verify (verified tab) | `toast.success(revoke_success)` |
| `AdminListingsTable.PremiumDialog` | Set premium | `toast.success(premium_success)` |
| `AdminListingsTable.PremiumDialog` | Remove premium | `toast.success(premium_removed_success)` |
| `AdminListingsTable.ListingPreviewDialog` | Delete listing | `toast.success(delete_success)` |
| `FavoriteButton` | Error (optimistic revert) | `toast.error(favorite_error)` |

## New locale keys (× 4 locales)

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `admin.listings.delete_success` | Njoftimi u fshi | Listing deleted | Оголошення видалено | Annuncio eliminato |
| `admin.listings.premium_success` | Statusi premium u vendos | Premium status set | Premium статус встановлено | Stato premium impostato |
| `admin.listings.premium_removed_success` | Premium u hoq | Premium status removed | Premium статус знято | Stato premium rimosso |
| `admin.users.verify_success` | Përdoruesi u verifikua | User verified | Користувача верифіковано | Utente verificato |
| `admin.users.revoke_success` | Verifikimi u hoq | Verification revoked | Верифікацію знято | Verifica revocata |
| `common.favorite_error` | Nuk mund të bëhet ndryshimi. Provo sërish. | Couldn't update favorites. Please try again. | Не вдалося оновити обрані. Спробуйте ще раз. | Impossibile aggiornare i preferiti. Riprova. |

## Files changed

| File | Change |
|------|--------|
| `messages/en.json` | +6 keys |
| `messages/sq.json` | +6 keys |
| `messages/uk.json` | +6 keys |
| `messages/it.json` | +6 keys |
| `src/components/admin/AdminUsersTable.tsx` | `import { toast }` + toast calls on verify/revoke (×2 sites) |
| `src/components/admin/AdminListingsTable.tsx` | `import { toast }` + toast in PremiumDialog.apply/remove + ListingPreviewDialog.handleDelete |
| `src/modules/listings/components/FavoriteButton.tsx` | `import { toast }` + `toast.error` on error branch |

## Type-check

`tsc --noEmit` → 0 errors.
