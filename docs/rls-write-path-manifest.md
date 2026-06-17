# RLS Write-Path Manifest — action-level permission guard coverage

> **HONESTY DISCLAIMER:** This manifest + the `test:rls-guards` suite cover **action-level permission
> guards only** (authn/authz/client-boundary/ownership/diagnosability) via mocked Supabase. They do
> **NOT** assert live Postgres RLS policy enforcement. DB-level RLS (anon/role/cross-user row
> enforcement at the database) is a known gap, deferred to Slice 5b — see Table 2 below. Do not read
> a ✅ here as DB-RLS coverage.

## Table 1 — Every write action

| Module | Action | File:line | Table(s) written | Archetype | Authn/authz guard | Client | Coverage | Command |
|--------|--------|-----------|------------------|-----------|-------------------|--------|----------|---------|
| contacts | `submitContactInquiry` | `contacts/actions/index.ts:64` | `contact_inquiries` | A (anon) | validation + IP rate-limit | service-role | ✅ guard-smoke (444) | `npm run test:rls-guards` |
| contacts | `updateInquiryStatus` | `contacts/actions/index.ts:152` | `contact_inquiries` | C (admin/mod) | `assertAdminOrModerator()` | service-role | ⬜ | — |
| contacts | `sendInquiryReply` | `contacts/actions/index.ts:177` | `contact_inquiry_replies`, `contact_inquiries` | C (admin/mod) | `assertAdminOrModerator()` | service-role | ⬜ | — |
| cabinet | `updateCabinetProfile` | `cabinet/actions/index.ts:26` | `users` | B (self) | `getUser()` + blocked check | user-scoped | ✅ guard-smoke (444) | `npm run test:rls-guards` |
| cabinet | `saveSavedSearch` | `cabinet/actions/index.ts:77` | `saved_searches` | B (self) | `resolveAuthUser()` | user-scoped | ⬜ | — |
| cabinet | `updateLastViewed` | `cabinet/actions/index.ts:124` | `saved_searches` | B (self) | `resolveAuthUser()` | user-scoped | ⬜ | — |
| cabinet | `deleteAllSavedSearches` | `cabinet/actions/index.ts:144` | `saved_searches` | B (self) | `resolveAuthUser()` | user-scoped | ⬜ | — |
| cabinet | `deleteSavedSearch` | `cabinet/actions/index.ts:163` | `saved_searches` | B (self) | `resolveAuthUser()` + `.eq('user_id', userId)` | user-scoped | ⬜ | — |
| cabinet | `updateSavedSearchFrequency` | `cabinet/actions/index.ts:185` | `saved_searches` | B (self) | `resolveAuthUser()` + `.eq('user_id', userId)` | user-scoped | ⬜ | — |
| cabinet | `updateSavedSearchNotify` | `cabinet/actions/index.ts:208` | `saved_searches` | B (self) | `resolveAuthUser()` + `.eq('user_id', userId)` | user-scoped | ⬜ | — |
| cabinet | `deleteOwnAccount` | `cabinet/actions/index.ts:235` | `users`, `listings` (via transition), auth | B (self) | `resolveAuthUser()` | service-role (admin client for hard-delete) | 🟢 Slice 2 (441) | `npm run test:auth` |
| cabinet | `initiateEmailChange` | `cabinet/actions/index.ts:314` | `email_change_tokens`, `users` | B (self) | `resolveAuthUser()` | service-role | 🟢 Slice 2 (441) | `npm run test:auth` |
| cabinet | `resendEmailVerification` | `cabinet/actions/index.ts:396` | `email_change_tokens` | B (self) | `resolveAuthUser()` | service-role | ⬜ | — |
| cabinet | `changeCabinetPassword` | `cabinet/actions/index.ts:456` | auth (updateUserById) | B (self) | `getUser()` + password verify | service-role (admin for password update) | ⬜ | — |
| cabinet | `consumeEmailChangeToken` | `cabinet/actions/index.ts:521` | `email_change_tokens`, auth | A (token-based) | token validation | service-role | 🟢 Slice 2 (441) | `npm run test:auth` |
| listings | `createListing` | `listings/actions/createListing.ts:26` | `listings`, `listing_images` | B (self) | `getUser()` + blocked check | user-scoped | 🟢 Slice 3 (442) | `npm run test:listings` |
| listings | `updateListing` | `listings/actions/updateListing.ts` | `listings`, `listing_images` | B (self) | `getUser()` + blocked check | user-scoped | 🟢 Slice 3 (442) | `npm run test:listings` |
| listings | `deleteListingAction` | `listings/actions/deleteListing.ts:20` | `listings` (cascade `listing_images`) | B (self) | `getUser()` + blocked check | user-scoped | ⬜ | — |
| listings | `reportListingAction` | `listings/actions/reportListing.ts:23` | `listing_reports` | B (self) | `getUser()` + blocked check | user-scoped | 🟢 Slice 3 (442) | `npm run test:listings` |
| listings | `updateReportStatusAction` | `listings/actions/reportListing.ts:68` | `listing_reports`, `report_actions` | C (admin/mod) | `getUser()` + `hasPermission('reports.manage')` | service-role | ⬜ | — |
| listings | `addFavorite` | `listings/actions/favoriteActions.ts:21` | `favorites` | B (self) | `getUser()` + blocked check + `.eq('user_id', authUser.id)` | user-scoped | ⬜ | — |
| listings | `removeFavorite` | `listings/actions/favoriteActions.ts:49` | `favorites` | B (self) | `getUser()` + blocked check | user-scoped | ⬜ | — |
| listings | `createCollection` | `listings/actions/collectionActions.ts:59` | `collections` | B (self) | `getUser()` + blocked check + `user_id: authUser.id` | user-scoped | ⬜ | — |
| listings | `renameCollection` | `listings/actions/collectionActions.ts:87` | `collections` | B (self) | `getUser()` + blocked check + `.eq('user_id', authUser.id)` | user-scoped | ⬜ | — |
| listings | `deleteCollection` | `listings/actions/collectionActions.ts:115` | `collections` | B (self) | `getUser()` + blocked check + `.eq('user_id', authUser.id)` | user-scoped | ⬜ | — |
| listings | `addToCollection` | `listings/actions/collectionActions.ts:138` | `collection_items` | B (self) | `getUser()` + blocked check | user-scoped | ⬜ | — |
| listings | `removeFromCollection` | `listings/actions/collectionActions.ts:162` | `collection_items` | B (self) | `getUser()` + blocked check | user-scoped | ⬜ | — |
| listings | `submitListingInquiry` | `listings/actions/submitListingInquiry.ts` | `listing_inquiries` | A (anon) | validation + IP rate-limit | service-role | 🟢 Slice 3 (442) | `npm run test:listings` |
| listings | `applyListingTransitionByStatus` | `listings/actions/applyListingTransition.ts` | `listings` | B/C (owner/admin) | getUser + ownership/privilege check | service-role (via `_db` injection) | 🟢 Slice 3 (442) | `npm run test:listings` |
| listings | `trackListingContactEvent` | `listings/actions/contactEvents.ts:21` | `listing_contact_events` | B (self, optional) | `getUser()` (optional, logs anon too) | user-scoped | ⬜ | — |
| listings | `recordListingView` | `listings/actions/recentlyViewedActions.ts:21` | `recently_viewed` (via RPC) / cookie | B (self, optional) | `getUser()` (optional, cookie for guest) | user-scoped | ⬜ | — |
| listings | `clearRecentlyViewed` | `listings/actions/recentlyViewedActions.ts:64` | `recently_viewed` / cookie | B (self, optional) | `getUser()` (optional) | user-scoped | ⬜ | — |
| admin | `updateListingStatus` | `admin/actions/index.ts:39` | `listings` (via transition) | C (admin/mod) | `resolveAdminActor()` | service-role (via transition) | ⬜ | — |
| admin | `setListingPremium` | `admin/actions/index.ts:59` | `listings` | C (permission) | `assertPermission('listings.set_premium')` | service-role | ⬜ | — |
| admin | `deleteListing` | `admin/actions/index.ts:117` | `listings` | C (permission) | `assertPermission('listings.delete')` | service-role | ⬜ | — |
| admin | `updateUserProfile` | `admin/actions/index.ts:134` | `users` | C (admin/mod) | `assertAdminAccess()` | service-role | ⬜ | — |
| admin | `toggleUserVerified` | `admin/actions/index.ts:145` | `users` | C (admin/mod) | `assertAdminAccess()` | service-role | ⬜ | — |
| admin | `createLocation` | `admin/actions/index.ts:156` | `locations` | C (permission) | `assertPermission('locations.manage')` | service-role | ⬜ | — |
| admin | `updateLocation` | `admin/actions/index.ts:168` | `locations` | C (permission) | `assertPermission('locations.manage')` | service-role | ⬜ | — |
| admin | `toggleLocationFeatured` | `admin/actions/index.ts:180` | `locations` | C (permission) | `assertPermission('locations.manage')` | service-role | ⬜ | — |
| admin | `deleteLocation` | `admin/actions/index.ts:189` | `locations` | C (permission) | `assertPermission('locations.manage')` | service-role | ⬜ | — |
| admin | `saveSettings` | `admin/actions/index.ts:200` | `site_settings` | C (permission) | `assertPermission('settings.manage')` | service-role | ⬜ | — |
| admin | `createPage` | `admin/actions/index.ts:226` | `pages` | C (permission) | `assertPermission('legal.manage')` | service-role | ⬜ | — |
| admin | `updatePage` | `admin/actions/index.ts:246` | `pages` | C (permission) | `assertPermission('legal.manage')` | service-role | ⬜ | — |
| admin | `deletePage` | `admin/actions/index.ts:267` | `pages` | C (permission) | `assertPermission('legal.manage')` | service-role | ⬜ | — |
| admin | `updateUserProfileFull` | `admin/actions/index.ts:319` | `users`, `user_status_history`, `user_change_log` | C (admin/mod) | `getUser()` + role check | service-role | 🟢 Slice 4 (448) | `npm run test:admin` |
| admin | `createAdminUser` | `admin/actions/index.ts:413` | `users`, auth | C (permission) | `assertPermission('users.create')` | service-role | ⬜ | — |
| admin | `softDeleteUser` | `admin/actions/index.ts:479` | `users`, `listings` (via transition) | C (permission) | `hasPermission('users.soft_delete')` | service-role | ⬜ | — |
| admin | `deactivateUser` | `admin/actions/index.ts:508` | `users`, `user_status_history` | C (permission) | `hasPermission('users.soft_delete')` | service-role | ⬜ | — |
| admin | `reactivateUser` | `admin/actions/index.ts:536` | `users`, `user_status_history` | C (permission) | `hasPermission('users.soft_delete')` | service-role | ⬜ | — |
| admin | `hardDeleteUser` | `admin/actions/index.ts:564` | `users`, `listings` (via transition), auth | C (permission) | `hasPermission('users.hard_delete')` | service-role | 🟢 Slice 4 (443) | `npm run test:admin` |
| admin | `removeUserAvatar` | `admin/actions/index.ts:603` | `users` | C (admin/mod) | `assertAdminAccess()` | service-role | ⬜ | — |
| admin | `addLocation` | `admin/actions/index.ts:615` | `locations` | C (admin/mod) | `assertAdminAccess()` | service-role | ⬜ | — |
| admin | `approveLocationRequest` | `admin/actions/index.ts:638` | `users` | C (admin/mod) | `assertAdminAccess()` | service-role | ⬜ | — |
| admin | `clearHistoryRow` | `admin/actions/clearHistory.ts` | `history_clear_events` (via RPC) | C (permission) | `hasPermission('audit.clear_history')` | service-role | 🟢 Slice 4 (436) | `npm run test:admin` |
| admin | `clearHistoryForEntity` | `admin/actions/clearHistory.ts` | `history_clear_events` (via RPC) | C (permission) | `hasPermission('audit.clear_history')` | service-role | 🟢 Slice 4 (436) | `npm run test:admin` |
| admin/currencies | `createCurrency` | `admin/actions/currencies.ts:50` | `currencies` | C (admin/mod) | `assertAdmin()` (admin‖moderator) | service-role | ✅ guard-smoke (444) | `npm run test:rls-guards` |
| admin/currencies | `updateCurrency` | `admin/actions/currencies.ts:86` | `currencies` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/currencies | `toggleCurrencyActive` | `admin/actions/currencies.ts:123` | `currencies` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/currencies | `setDefaultCurrency` | `admin/actions/currencies.ts:156` | `currencies` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/currencies | `deleteCurrency` | `admin/actions/currencies.ts:194` | `currencies` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/propertyTypes | `createPropertyType` | `admin/actions/propertyTypes.ts:46` | `property_types` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/propertyTypes | `updatePropertyType` | `admin/actions/propertyTypes.ts:83` | `property_types` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/propertyTypes | `togglePropertyTypeActive` | `admin/actions/propertyTypes.ts:130` | `property_types` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/propertyTypes | `deletePropertyType` | `admin/actions/propertyTypes.ts:147` | `property_types` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/exchangeProviders | `createExchangeProvider` | `admin/actions/exchangeProviders.ts:49` | `exchange_providers` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/exchangeProviders | `updateExchangeProvider` | `admin/actions/exchangeProviders.ts` | `exchange_providers` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/exchangeProviders | `toggleExchangeProviderEnabled` | `admin/actions/exchangeProviders.ts` | `exchange_providers` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/exchangeProviders | `deleteExchangeProvider` | `admin/actions/exchangeProviders.ts` | `exchange_providers` | C (admin/mod) | `assertAdmin()` | service-role | ⬜ | — |
| admin/permissions | `setModeratorPermission` | `admin/actions/permissions.ts:142` | `role_permissions`, `role_permission_events` | D (admin-only) | `getAdminUserId()` (role==='admin' only) | service-role | ✅ guard-smoke (444) | `npm run test:rls-guards` |
| admin/footer | `upsertFooterContent` | `admin/actions/footer.ts:97` | `site_footer` | D (admin-only) | `assertAdminUser()` (role==='admin' only) | service-role | ⬜ | — |
| admin/emailTemplates | `upsertEmailTemplateAction` | `notifications/actions/emailTemplates.ts:46` | `email_templates` | C (admin/mod) | `assertAdminOrModerator()` | service-role | ⬜ | — |
| admin/emailTemplates | `deleteEmailTemplateGroupAction` | `notifications/actions/emailTemplates.ts:83` | `email_templates` | D (admin-only) | `assertAdmin()` (role==='admin' only) | service-role | ⬜ | — |
| admin/emailTemplates | `deleteEmailTemplateLocaleAction` | `notifications/actions/emailTemplates.ts:103` | `email_templates` | D (admin-only) | `assertAdmin()` (role==='admin' only) | service-role | ⬜ | — |
| locations | `setLocationFeatured` | `locations/actions/popularLocationActions.ts:29` | `locations` | C (admin/mod) | `requireAdminOrModerator()` | service-role | ⬜ | — |
| locations | `setLocationUnfeatured` | `locations/actions/popularLocationActions.ts:54` | `locations` | C (admin/mod) | `requireAdminOrModerator()` | service-role | ⬜ | — |
| admin/locale | `setAdminLocale` | `admin/actions/locale.ts:9` | `users` (best-effort) | B (self, optional) | `getUser()` (optional) | user-scoped | ⬜ | — |

## Table 2 — Live-DB-only gaps (deferred → Slice 5b)

These assertions genuinely require real Postgres roles (anon / authenticated / service_role) and cannot be faked with a mocked Supabase client. A mocked client stubs the DB response and never exercises the actual RLS policy.

| Gap | Tables affected | What it guards | Why it needs live DB | Status |
|-----|-----------------|----------------|---------------------|--------|
| Anon INSERT blocked by RLS | `listing_reports`, `favorites`, `collections`, `saved_searches`, `recently_viewed` | Unauthenticated users cannot write to user-scoped tables | Mocked `createClient()` returns whatever we configure — it never hits the real INSERT policy | live-DB-only → Slice 5b |
| Cross-user row isolation | `users`, `saved_searches`, `favorites`, `collections`, `collection_items`, `recently_viewed` | User A cannot UPDATE/DELETE user B's rows | RLS `auth.uid() = user_id` policy is enforced by Postgres, not by the action code; mock stubs it | live-DB-only → Slice 5b |
| Service-role bypass detection | All admin-client tables (`contact_inquiries`, `currencies`, `property_types`, `exchange_providers`, `email_templates`, `role_permissions`, `site_settings`, `pages`, `site_footer`, `locations`) | An action that switches from `createClient()` to `createAdminClient()` silently bypasses RLS | The action-guard smoke for archetype B checks client choice, but does not verify the DB actually enforces RLS on the user-scoped client | live-DB-only → Slice 5b |
| `email_change_tokens` service-role-only | `email_change_tokens` | Table has RLS enabled but no policy rows — only service_role can access | Mock doesn't enforce this; a regression adding a `TO authenticated` policy would be invisible | live-DB-only → Slice 5b |
| Admin-only DB policies | `role_permissions`, `role_permission_events` | Direct DB-level admin-only write enforcement | Even if action code checks role, a DB policy regression (e.g. adding authenticated INSERT) would be invisible to mocked tests | live-DB-only → Slice 5b |

> **Slice 5b scope:** stand up a Supabase-local/Docker test environment that exercises real Postgres roles against
> these policies. Not scheduled — requires owner decision on Docker/CI infrastructure.
