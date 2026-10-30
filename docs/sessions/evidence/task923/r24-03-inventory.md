# r24-03 — Code inventory for hardening v8 (R96 (c)), static, 2026-10-21

Static reading only: no database access, no write outside this file. Every finding has a `file:line`.
Two code states are named throughout:

- **working tree** = the uncommitted files in `C:\Claude_Code_Projects\lero-al` (most of Task 923's code is only here);
- **HEAD** = commit `8e20bfd3a` (read with `git show HEAD:<path>` / `git grep ... HEAD`), the code the live site runs (C748 premise).

Database facts come from `docs/sessions/evidence/task923/db-catalog/catalog-post-v71.json` (`cat-post`, line numbers are of that file) and from
`r24-02-counts.txt` (`B…` / `P…` ids), both taken in this run's read-only transaction.

**Short list of what Opus will want first** (each is detailed below):

1. The live `listings` read policy still shows only `active` rows and the owner's (`cat-post:1314-1319`), so sold/rented pages are 404 for visitors today; R73 (a) changes that on purpose.
2. The eight R75 keys have **no row** in `role_permissions` (B19c lists 12 keys, none of the eight). The working-tree code reads `data?.allowed ?? false` (`src/lib/auth/permissions.ts:26`), so a moderator is refused on all eight until the seed row exists: the seed must be applied no later than the code (section 4 (c), section 8).
3. `handle_new_user` (live since v7.1) copies `raw_user_meta_data.avatar_url` (any `https://` host), `name` (up to 200 characters) and `phone` (up to 32 characters) into `public.users` (`cat-post:2848`). The R69 (d) CHECKs on `avatar_url`, `name` and `phone` would make that trigger fail for a Google sign-up (section 8, row 4).
4. Two `users` rows already break the R69 (d) `website` and `company_logo_url` rules (B10, B11; the same two ids). A NOT VALID check does not look at them, but any UPDATE of those two rows is checked.
5. In the working tree **nothing calls `verifyTurnstile`** any more (R67 (c) moved sign-up and reset to Supabase's own captcha check); at HEAD `src/modules/auth/actions/captcha.ts:23` and `:57` still do (section 7).
6. The avatars bucket holds 1 object (B17); neither HEAD nor the working tree uses Supabase Storage at all (section 8, row 5).

---

## 1. R69 (a) — every staff write to `listings` through a session client

**Search used:** every `.from('listings')` / `.from('listing_images')` in `src/**` (not tests, Stories, integration files) followed within 9 lines by `.insert(`, `.update(`, `.delete(` or `.upsert(`; the client of each found by reading the function. A second pass of `git grep` over HEAD with the same pattern. Also searched: `.rpc(` calls (section 2 note), browser-side clients (none write `listings`).

**Working tree — no staff write to `listings` or `listing_images` uses a session client.**

| Site | Operation | Client | Who |
|---|---|---|---|
| `src/modules/listings/actions/updateListing.ts:67` | `const writer = isOwner ? supabase : createAdminClient()`; the writes at `:89` (listings update), `:108` (read), `:117` (images delete), `:130` / `:135` (images insert) | session for the owner, **service role for staff** | a staff member editing another person's listing; the key `listings.moderate` is checked first at `:66` |
| `src/modules/admin/actions/index.ts:112` | `setListingPremium` update (`db` = `createAdminClient()` at `:97`) | service role | staff with `listings.set_premium` |
| `src/modules/admin/actions/index.ts:145`, `:151` | `deleteListing` images read and listing delete (`db` at `:141`) | service role | staff with `listings.delete` |
| `src/modules/listings/actions/deleteListing.ts:55` (images read `:45`) | owner or staff delete; `const db = createAdminClient()` at `:41`; ownership and the key `listings.delete` are checked at `:37-39` with the session client's *read* only | service role for the write | owner, or staff with the key |
| `src/modules/listings/actions/applyListingTransition.ts:110` | status update; `db` is `createAdminClient()` (`:51`, `:212`, `:247`) | service role | every status change (owner, staff, cron) |

**HEAD — staff writes through the session client exist** (they depend on the `Admins can manage all listings` ALL policy, `cat-post:1304`):

| Site (HEAD) | Operation | Evidence |
|---|---|---|
| `HEAD:src/modules/listings/actions/updateListing.ts:61-62` | listing content update, for owner and staff alike | `const supabase = await createClient()` at `:30`; no `createAdminClient` in the file |
| `HEAD:src/modules/listings/actions/updateListing.ts:85`, `:94` | images delete and insert, session | same client; a staff member editing another person's listing is not the owner, so `Users can manage own listing images` (`cat-post:1054`) does not apply (the working-tree comment at `updateListing.ts:62-65` says the staff image writes were refused silently) |
| `HEAD:src/modules/listings/actions/deleteListing.ts:37` | `deleteListingAction`: `supabase.from('listings').delete()`; HEAD has no permission check in the file | the file's only client is the session one (`:32`) |

Note, DB side: there is **no owner DELETE policy** on `listings` (policies on `listings`: ALL for staff, SELECT `status = 'active' OR owner`, INSERT, UPDATE own; `cat-post:1304-1340`), so at HEAD an owner's `deleteListingAction` deletes 0 rows and HEAD returns no error for it (`HEAD:deleteListing.ts:41-43` only tests `error`). Only staff deletions through the ALL policy delete anything today.

---

## 2. R84 (c) — every session write to `listings` and `listing_images`, its status, and whether it can reach `active`

**Search used:** as in section 1, working tree only, session client only. Result: five call sites, all in two files. (Service-role writers are listed in section 1 and are not subject to the guard of R84 (a)/(b), which names `authenticated` and `anon`.)

| Site | Session write | Listing status at the moment | Can it reach an `active` listing? |
|---|---|---|---|
| `src/modules/listings/actions/createListing.ts:37-38` | INSERT into `listings` | the row is new and is written with `status: 'pending'` (`:44`); the v7.1 guard already refuses any other status | **No** (an INSERT creates a row) |
| `src/modules/listings/actions/createListing.ts:65` | INSERT into `listing_images` for the listing just created | `pending`, unless staff publish it between `:38` and `:65` (milliseconds) | Only through that race; then R84 (b) refuses the insert and the action answers `images_failed` (`:71`) |
| `src/modules/listings/actions/updateListing.ts:89` (owner only; staff use the service role, `:67`) | UPDATE of the listing content | At `active`, the action first moves the listing to `pending` through the gateway (`:79-80`: `isListingVisible` is true only for `active`, `src/modules/listings/domain/listingSemanticHelpers.ts:40-42`) and writes after that. At any other status (`pending`, `inactive`, `sold`, `rented`, `archived`, `expired`) it writes directly: edit is allowed at every status (`src/modules/listings/domain/listingPermissions.ts:58-60`) | **Not by design.** Only if staff publish the listing between the read at `:36-42` and the write at `:89` (the read status was not `active`, so no move to `pending` was made): R84 (a) refuses the update with 42501 and the action returns `update_failed` |
| `src/modules/listings/actions/updateListing.ts:117` | DELETE of the listing's images (`writer`) | same as above | same race only |
| `src/modules/listings/actions/updateListing.ts:130`, `:135` | INSERT of the new images / restore of the old ones | same as above | same race only; at `:135` the restore of the old rows would also be refused |

No other file writes `listings` or `listing_images` with a session client. The other `.rpc(` callers found (`record_listing_view`, `recompute_listing_activity`, `end_user_sessions`, `set_default_currency`, `clear_user_history`, `admin_search_users_by_email`, `record_recently_viewed`, `get_listing_owner_contact`) are called with the service role except `record_recently_viewed` (`src/modules/listings/actions/recentlyViewedActions.ts:31`) and `get_listing_owner_contact` (`getListingOwnerContact.ts:19`), neither of which writes `listings` or `listing_images` (`record_recently_viewed` writes `recently_viewed`).

HEAD differs: `HEAD:updateListing.ts:61-62`, `:85`, `:94` write the content and images with the session client **without** the move to `pending`, so at an `active` listing they are exactly what R84 (a) and (b) refuse (section 8, rows 11 and 12).

---

## 3. R73 (b) — the status filters of the listing page and its metadata

Working tree (`src/app/[locale]/listings/[slug]/page.tsx`; identical at HEAD for these lines):

| Where | Filter | Observation |
|---|---|---|
| `:57-72` `generateMetadata` query | **no status filter** (`.eq('slug', slug).single()`, session client) | the database policy decides what is returned (`cat-post:1314-1319`: `active` or own) |
| `:77-79` | `publicStatuses = ['active', 'sold', 'rented', 'archived']`; any other status gets `{ title: 'Lero.al' }` | `archived` is a public status here; R73 (b) wants `active`, `sold`, `rented` only |
| `:81-87` | `robots: { index: false, follow: true }` only for `archived` listings older than `archived_noindex_days` (`getArchivedNoindexDays`, `src/modules/admin/lib/settings.ts:32`) | no `noindex` for `sold` or `rented` |
| `:150-153` page query | `.in('status', ['active', 'sold', 'rented', 'archived'])` | `archived` is requested; today the database returns it only to its owner (and staff through the ALL policy) |
| `src/app/api/listings/[slug]/view/route.ts:27-31` | `.in('status', ['active', 'sold', 'rented', 'archived'])` (service role) | the same list; the view counter accepts `archived` |
| `src/modules/listings/lib/recentlyViewedQueries.ts:34`, `:60` (HEAD and working tree) | `.in('status', ['active', 'sold', 'rented', 'archived'])` | same list |
| `src/modules/listings/lib/favoritesQueries.ts:58`, `:79` (HEAD) | `.neq('status', 'archived')` | |

Not implemented in the working tree: R73 (b)'s list without `archived`, and `noindex` on sold/rented.

---

## 4. R75 (a)–(g) — implemented in the working tree, or not

| Req. | State | Evidence |
|---|---|---|
| (a) a key for every action that admits a moderator | **Implemented** | `src/lib/auth/permissionKeys.ts:17-24` adds the eight keys. Uses: `users.edit` (`src/modules/admin/actions/index.ts:179`, `:472`, `:799`; `src/app/api/upload-avatar/route.ts:65`), `users.verify` (`index.ts:203`), `support.manage` (`index.ts:881`, `:941`, `:1025`), `inquiries.manage` (`src/modules/contacts/actions/index.ts:158`), `catalog.manage` (`src/modules/admin/actions/currencies.ts:20`, `propertyTypes.ts:14`, `exchangeProviders.ts:15`), `email_templates.manage` (`src/modules/notifications/actions/emailTemplates.ts:12`), `companies.manage` (`src/modules/companies/actions.ts:11`, `src/app/api/upload-company-logo/route.ts:44`), `listings.moderate` (`index.ts:65`, `changeListingStatus.ts:30`, `updateListing.ts:66`). Other staff entry points already carried a key: `deleteListing.ts:39`, `reportListing.ts:142-143`, `:276`, `upload-cms-image/route.ts:18`, `upload-popular-location-photo/route.ts:32`. |
| (b) keys in `PERMISSION_KEYS`, label and hint in four locales | **Implemented** | `permissionKeys.ts:1-25`; `messages/{en,sq,uk,it}.json` carry all eight keys under `admin.permissions.keys` and `admin.permissions.descriptions` (checked: 16 of 16 entries in each file; `messages/en.json:1800-1807` and `:1823-1830` show the English pair) |
| (c) one `role_permissions` row with `allowed = true` per new key, in hardening v7 | **Not implemented in the database.** B19c lists the 12 rows that exist; none is one of the eight new keys (`reports.status_override`, one of the 13 older keys, has no row either). The table's constraints (B19): primary key `(role, permission_key)`, `CHECK (role = 'moderator')`, a foreign key on `updated_by_user_id`; **no constraint restricts the text of `permission_key`**; no trigger (B19b); `allowed` has default `false` (B19a). | `src/lib/auth/permissions.ts:26` returns `data?.allowed ?? false`: with no row, a moderator is refused. |
| (d) a test that lists every action admitting a moderator and fails on one without a key | **Implemented** | `src/lib/auth/__tests__/moderatorKeys.security.test.ts:77-100` (action files, the `ADMITS` and `HAS_KEY` patterns), cases at `:101` and `:144`. Run in this session: 1 file, 2 tests passed. (The planned real-database companion `src/tests/integration/moderatorKeys.integration.test.ts` is named in the contract but does not exist.) The scan covers the 11 files of `ACTION_FILES`; the three `src/app/api/upload-*` routes with a key and `deleteListing.ts` / `reportListing.ts` / `updateListing.ts` are outside that list and were read one by one above. |
| (e) only an administrator opens `/admin/permissions` and reads the switches | **Implemented** | `src/app/admin/permissions/page.tsx:14-16` (`if (role !== 'admin') notFound()`); `src/modules/admin/actions/permissions.ts:41-46` (`getModeratorPermissions` throws `forbidden` for a non-administrator), `:102` (`getPermissionEvents` returns `null` for a non-administrator). A moderator's own checks go through `roleHasPermission` (`permissions.ts:8`). |
| (f) hardening v7 drops the four unused row policies of `role_permissions`; a harness check | **Not implemented** (v8's SQL) | the four policies exist today: `role_permissions_admin_insert`, `_admin_select`, `_admin_update`, `_moderator_read` (`cat-post:1724` and the three after it); `anon`/`authenticated` hold only REFERENCES and TRIGGER on the table, so the policies are already unreachable by privilege. No harness row for them yet. |
| (g) a switch is read on every check, never cached | **Implemented** | `src/lib/auth/permissions.ts:8-31` reads the row on every call (no `unstable_cache`, no module variable); the second case of the test above changes a switch between two calls. Each change keeps its event row: `src/modules/admin/actions/permissions.ts:173` (upsert) and `:190` (event insert). |

---

## 5. R78 (a) and (c) — the exchange-providers screen, actions, component, Story, registries, table

**Search used:** `exchange_providers|exchangeProviders|ExchangeProvider|exchange-providers` (case-insensitive) in `src`, `scripts`, `messages`, `.storybook`, and `docs/*.md` (counts only for docs).

| Kind | File:line (first match; matches in the file) |
|---|---|
| Screen (route) | `src/app/admin/currency/page.tsx:7` (import), `:10`, `:21` (`getAllExchangeProvidersAdmin()` in the page's data load), `:32` (`providers={<AdminExchangeProvidersManager …/>}`) — 4 matches |
| Tab host | `src/components/admin/AdminCurrencyTabs.tsx:10` (comment: "The exchange-providers tab body") — 1 |
| Container component | `src/components/admin/AdminExchangeProvidersManager.tsx:6` — 24 |
| View component | `src/components/admin/AdminExchangeProvidersView.tsx:12` — 16 |
| Server Actions | `src/modules/admin/actions/exchangeProviders.ts:6` — 25 (table reads/writes at `:40`, `:59`, `:97`, `:130`, `:149`, `:157`; five exported actions `getAllExchangeProvidersAdmin`, `createExchangeProvider`, `updateExchangeProvider`, `toggleExchangeProviderEnabled`, `deleteExchangeProvider`; guard `checkStaff({ permission: 'catalog.manage' })` at `:15`) |
| Type | `src/types/database.ts:524` (`DBExchangeProvider`) |
| Stories | `src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx:3` — 11; `src/stories/patterns/mantine/AdminCurrencyTabs.stories.tsx:7` (imports the view; `:61` renders it) — 3; fixtures `src/stories/fixtures/admin.fixtures.ts:13`, `:101-103` (`FIXTURE_PROVIDERS`) — 3 |
| Tests | `src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx:2` — 14; `src/modules/admin/actions/__tests__/adminCatalog.security.test.ts:47` — 26; `adminGetters.security.test.ts:5` — 9; `src/modules/admin/actions/adminGetters.integration.test.ts:2` — 8 (inserts and deletes real `exchange_providers` rows); `src/__tests__/security/staffActions.test.ts:67` — 6; `src/modules/__tests__/noDbMessage.security.test.ts:106` — 5; `src/lib/auth/__tests__/moderatorKeys.security.test.ts:78`, `:147`, `:162` — 3 |
| Registries and scripts | `scripts/mantine-migration-scope.json:117`; `scripts/rendered-interaction-states.json:2873-3015` (18 matches: the rows `patterns-mantine-adminexchangeprovidersview--…`); `scripts/surface-census-baseline.json:274`; `scripts/check-schema-drift.mjs:70`; `scripts/schema-drift-check.sql:22` (24 matches, columns at `:240-250` and `:592-…`); `scripts/grant-discipline-audit.sql:16-20`, `:184-185`; `scripts/task-870-privilege-audit.sql:95`; generated reports `scripts/governance/reports/component-catalog.latest.json:1582` (9) and `tailwind-entropy.latest.json:416` (5) |
| Messages | none (`messages/*.json`: no match) |
| Docs (counts of matching lines) | `docs/admin-ux-rules.md` 4, `backlog-archive.md` 4, `backlog.md` 2, `component-catalog.md` 2, `component-risk-register.md` 3, `design-system.md` 1, `mantine-responsive-design-system.md` 1, `mantine-tailadmin-migration-tracker.md` 1, `responsive-storybook-inventory.md` 3, `rls-write-path-manifest.md` 5 |
| Table | live: RLS on, grants `anon`/`authenticated` = REFERENCES, TRIGGER only; one policy `exchange_providers_read` (SELECT, `{public}`) (`cat-post` tables / grants / policies). Rows: **2**, ids **1, 2** (B18, B18a). No key was read. |
| Readers outside the admin code | **none found**: `grep` for `exchange_providers` / `getAllExchangeProvidersAdmin` outside `src/modules/admin`, `src/components/admin`, `src/app/admin`, tests and Stories returns nothing, in both HEAD and the working tree. The rate pipeline does not read the table (`src/lib/getExchangeRateServer.ts`, section 6). |

**R78 (c)** (a test of `SETTING_KEYS` and admin-only tables): **no such test exists** (search: `orphan` in `src` and `scripts`; the matches are unrelated). `SETTING_KEYS` is at `src/modules/admin/actions/index.ts:276-279` (17 keys). Readers of those keys outside the admin directories that the search found: `site_name` (`src/components/layout/Footer.tsx:15`), `og_image` (`src/app/[locale]/listings/[slug]/page.tsx:72`), `archived_noindex_days` (`:84`, through `getArchivedNoindexDays`, whose function lives in `src/modules/admin/lib/settings.ts:32`), `default_locale` (`src/middleware.ts:25`, `src/proxy.ts:23`, `src/app/page.tsx:3`). No reader outside the admin directories was found for the other 13 keys (`tagline`, `contact_email`, `contact_phone`, `logo_url`, `logo_dark_url`, `favicon_url`, `social_facebook`, `social_instagram`, `social_linkedin`, `about_al`, `about_uk`, `meta_title`, `meta_desc`); `getAllSettings` (`src/modules/admin/lib/settings.ts:85`) is read by the admin layout and settings page only (`src/app/admin/layout.tsx:46`, `src/app/admin/settings/page.tsx:37`). This is a search result, not the planned test; the tables-written-only-by-admin half of (c) was not measured in this run.

---

## 6. R79 (a)–(c) — the open.er-api path, the rate read, its caching

| Req. | Working tree | HEAD |
|---|---|---|
| (a) the open.er-api path goes; a currency iliria98 does not publish cannot be activated | **Done.** `src/lib/getExchangeRateServer.ts:4-11` (one source, "that path is gone"); the only fetch is `SOURCE_URL = 'https://iliria98.com/'` (`:31`, used at `:73`); a currency without a published rate is left out and logged (`:177-184`); `isRatePublished` (`:126-132`) is called by the currency action, which answers `rate_unavailable` (`src/modules/admin/actions/currencies.ts:56`, `:66`, `:98`). No match for `open.er-api` in `src` outside tests and comments. | still present: `HEAD:src/lib/getExchangeRateServer.ts:10` ("derive via EUR/ALL ÷ EUR/X (open.er-api.com cross-rate)") |
| (b) each successful read is stored on the server; a failed read serves the stored set; the failure is not cached | **Done, with an existing table.** `storeRates` (`:156-166`) upserts into `public.currency_rates` on `(from_currency, to_currency)`; `readStoredRates` (`:137-153`) serves the last good set; `fetchAllRates` throws when the euro rate cannot be read (`:174`), and `unstable_cache` does not keep a thrown error (`:191-195`, `revalidate: 3600`); after a failure the instance serves the stored set for 5 minutes (`:201-214`). **The existing table fits:** `currency_rates` has `from_currency`, `to_currency`, `rate`, `source_url`, `fetched_at`, a unique key on the pair (B20a: columns, 1 row). By grants it is service-role only: `anon` and `authenticated` hold **no** privilege on it (`cat-post` grants: none), although two policies exist (`Currency rates viewable by everyone` SELECT, `Only admins can manage currency rates` ALL). B20 lists the other tables with a rate-, currency- or exchange-named column or a json/jsonb column: `email_templates`, `history_clear_events`, `listings` (`currency` enum), `notifications`, `page_translations`, `pages`, `saved_searches`, `site_footer`, `users` (`preferred_currency`, `location_request`); none is a rate store. | `git grep currency_rates HEAD -- src` finds no use outside tests and types: HEAD does not store rates |
| (c) no key is stored or shown | **Done.** The page is read with no key (`getExchangeRateServer.ts:4`, headers `:74`); no `api_key` or environment secret appears in the file. The only key column in the area is `exchange_providers.api_key` (section 5), which R78 (a) removes with the table. | |

---

## 7. R86 — every contact action: server entry, client, current bot check

| Action | Client entry | Server entry | Database client | Current bot check |
|---|---|---|---|---|
| Phone reveal ("Call") | `src/modules/listings/components/ListingContact.tsx:123` (also `ListingMobileCTA.tsx:33`) | `src/modules/listings/actions/getListingOwnerContact.ts:7` — guards: `isUuid` (`:13`), `requireViewer()` (`:15`) | **session client** `createClient()` (`:18`) → `supabase.rpc('get_listing_owner_contact', …)` (`:19`). The function is executable by `authenticated` (`cat-post:2822`: `acl … authenticated=X/postgres …`) | **none** |
| WhatsApp number | `ListingContact.tsx:123-132` (type `whatsapp`; `ListingMobileCTA.tsx:53`) | the same `getListingOwnerContact` as above | session client (same line) | **none** |
| WhatsApp event | `ListingContact.tsx:131`; `ListingMobileCTA.tsx:60`; `src/components/listing/WhatsAppContactButton.tsx:51` (this component has **no importer** in `src`; search: its name outside its own file and tests) | `src/modules/listings/actions/contactEvents.ts:36` `trackListingContactEvent` — guards: ids and channel allowlist (`:40`), `requireViewer()` (`:43`), active listing (`:58`) | **service role** `createAdminClient()` (`:50`) | **none** |
| Inquiry ("Send message") | `src/modules/listings/components/ListingInquiryDialog.tsx:57` | `src/modules/listings/actions/submitListingInquiry.ts:61` — guards: input checks, `requireViewer()` (`:79`), `isRateLimited(ip, email)` (`:98`), active listing (`:110`) | **service role** (`:82`) | **none** (rate limit by IP and sender address only) |
| In-platform chat first message | **not built**: no `.from('messages')` or `.from('conversations')` in `src` (the tables `messages` and `conversations` exist in the database) | — | — | — |

The Turnstile pieces that exist:

- `src/lib/captcha/verifyTurnstile.ts:6-34` verifies a token with Cloudflare; it returns `{ success, errorCodes }`; it does **not** check `action`, `hostname` or replay.
- `src/components/auth/CaptchaWidget.tsx:53` is the one widget; it is used in `src/modules/auth/components/AuthSheet.tsx:245` and `:722` only.
- **Working tree: `verifyTurnstile` has no caller outside its own tests.** `src/modules/auth/actions/captcha.ts:7-9` explains: since R67 (c) Supabase Auth is the one verifier, the action only checks that a token exists (`:31`, `:57`) and passes it on (`:37`, `:62`). **HEAD:** `HEAD:src/modules/auth/actions/captcha.ts:23` and `:57` call `verifyTurnstile(captchaToken)`.
- C819 ("the working tree has the Turnstile check that R86 extends") is true of the function (`verifyTurnstile.ts:6`); it is not called anywhere in the working tree.

Direct database path (R86 (c)): a signed-in session can call `get_listing_owner_contact` without going through the Server Action, because `authenticated` holds EXECUTE (`cat-post:2822`).

---

## 8. For each v8 change: would the live `HEAD` code break once it is applied?

"Break" means a HEAD code path gets a database error or a changed answer it does not handle. HEAD evidence is `git show HEAD:<path>` / `git grep … HEAD`; database facts are from the counts and `cat-post`. The working-tree state is added where it differs.

| # | v8 change | HEAD would… | Evidence |
|---|---|---|---|
| 1 | R69 (a): staff `ALL` policy on `listings` becomes `SELECT` | **Break:** a staff edit of another person's listing (content, then images) and a staff delete through `deleteListingAction` use the session client. Working tree: no break, staff writes use the service role (section 1). | `HEAD:src/modules/listings/actions/updateListing.ts:30-62`, `:85`, `:94`; `HEAD:src/modules/listings/actions/deleteListing.ts:32-37` |
| 2 | R69 (b): CHECKs on `listings` (title, description, price, price_old, lat, lng), NOT VALID | **No break for valid input.** Existing rows: 0 break any of them (B1–B7). One difference: HEAD's Zod trims after the length test, so a title of five spaces passes and is stored as `''`; the CHECK would refuse it and HEAD answers with the database message. The price ceiling is not in Zod yet (B5: largest stored `price` 80 000 000; 3 listings above 1e7, 4 above 1e6, of 19). | `HEAD:src/modules/listings/validations/index.ts` (`title: z.string().min(5).max(150).transform(v => v.trim())`; the diff to the working tree is that one line) |
| 3 | R69 (c): `listing_images.url` must start with the project's Cloudinary prefix | **Silent loss:** HEAD has no image-URL validation (`git grep isValidImagePayload HEAD` finds nothing) and `createListing` only logs a failed images insert and returns `{ slug }` as success. A URL outside the prefix would give a listing without photos and a success message. Existing rows: 0 outside `https://res.cloudinary.com/die7okukn/` (B8; 83 rows, one prefix, P1). Working tree: `isValidImagePayload` (`src/lib/uploads/imageUrl.ts:37`) refuses first, and `createListing.ts:71` returns `images_failed`. | `HEAD:src/modules/listings/actions/createListing.ts:72-81` |
| 4 | R69 (d): `users` CHECKs (`avatar_url` / `company_logo_url` prefix, `website` `https?://` ≤ 200, `phone` / `whatsapp` E.164, `name` / `last_name` ≤ 100) | **Break, in three places.** (i) `updateUserProfileFull` and the create action store `website`, `company_logo_url`, `phone`, `whatsapp` as typed (`HEAD:src/modules/admin/actions/index.ts:374-382` create, `:469-478` update; `company_logo_url` is written at `:381` in the create action), so a bare-host website or a logo from another host is refused with 23514. (ii) **Two existing rows break the rules now:** `company_logo_url` not on the project prefix (B10: 2 ids) and `website` not `http(s)://` (B11: the same 2 ids, `5b6caf0d-…`, `6e791daf-…`); a NOT VALID check skips old rows but **any UPDATE of those two rows is checked**, so an admin edit of either fails until the value is fixed. (iii) the live `handle_new_user` trigger inserts `avatar_url` from sign-up metadata (any `https://` address, `left(…, 2000)`), `name` up to 200 characters and `phone` up to 32 characters (`cat-post:2848`): a Google sign-up carries a Google picture URL, so the avatar CHECK, or a name of 101–200 characters, makes the trigger fail and the sign-up with it. Other counts: avatar not on prefix 0 (B9; 4 null, 2 on prefix, P2); phone, whatsapp, name, last_name, website length: 0 (B12–B16). The same holds for the working tree. | cited inline |
| 5 | R69 (e): drop the three staff write policies of the `avatars` bucket; remove the bucket only at 0 objects | **No break.** Neither HEAD nor the working tree uses Supabase Storage (`git grep -E "\.storage\b|storage\.from" HEAD -- src` and the same search in the working tree: no match); avatars go to Cloudinary (`HEAD:src/app/api/upload-avatar/route.ts:77`). The bucket has **1 object** (B17), so it cannot be removed as asked. The three policies are `Admin/moderator delete|update|upload avatars` (`cat-post:2184`, `:2194`, `:2204`). | |
| 6 | R73 (a): `listings` read policy → `active`, `sold`, `rented` or owner; `listing_images` read policy follows the listing | **No break; visible change as intended.** HEAD already asks for `['active','sold','rented','archived']` (`HEAD:src/app/[locale]/listings/[slug]/page.tsx:153`) and today's policy returns only `active` and the owner's (`cat-post:1314-1319`); `listing_images` is `using: true` today (`cat-post:1044`), so photos of non-public listings are readable by id today. Favourites and recently viewed will additionally show sold/rented rows (`HEAD:…/favoritesQueries.ts:58`, `:79`; `recentlyViewedQueries.ts:34`, `:60`). | |
| 7 | R75 (c): seed `role_permissions` rows for the eight new keys | **No break for HEAD** (it uses only the older keys). **Order matters for the working tree:** until the rows exist a moderator is refused on all eight keys (`src/lib/auth/permissions.ts:26`; B19c: none present). | |
| 8 | R75 (f): drop the four `role_permissions` row policies | **No break.** HEAD reads and writes `role_permissions` and `role_permission_events` only with the service role (`HEAD:src/lib/auth/permissions.ts:14`, `HEAD:src/modules/admin/actions/permissions.ts:56`, `:163`, `:177`, `:194`). | |
| 9 | R78 (a): drop `exchange_providers` | **Degrades the admin tab only.** HEAD's `getAllExchangeProvidersAdmin` ignores the error and returns `[]` (`HEAD:src/modules/admin/actions/exchangeProviders.ts:38-44`), so `/admin/currency` shows an empty providers tab; its create / update / toggle / delete actions return errors. Nothing public reads the table (section 5). The working tree has the same screen and actions. | |
| 10 | R79 (b): a table for the rate set | **None needed:** `currency_rates` already exists and is service-role only by grants (section 6). HEAD does not use it, so it is unaffected. | |
| 11 | R84 (a): refuse a session UPDATE of an `active` listing's content | **Break:** an owner's edit of an `active` listing. HEAD writes the content directly with the session (no move to `pending` first) and returns `error: updateError.message` (`HEAD:updateListing.ts:73-75`). Working tree: the move to `pending` comes first (`updateListing.ts:79-80`), so only the race of section 2 can reach the guard. | |
| 12 | R84 (b): refuse session writes to `listing_images` of an `active` listing | **Break (same flow):** `HEAD:updateListing.ts:85` ignores the delete error and `:94` only logs the insert error, so a refusal there would be silent. In practice HEAD returns at `:73-75` before reaching them. `createListing` HEAD (`:72-81`) writes images for a `pending` listing: no break. | |
| 13 | R86 (c): a new `service_role`-only contact function (expand) and, later, REVOKE EXECUTE on `get_listing_owner_contact` from `authenticated` (contract) | **Expand: no break.** **Contract: break** for HEAD and for the working tree: both call the function with the session client (`HEAD:src/modules/listings/actions/getListingOwnerContact.ts:11-12`; `src/modules/listings/actions/getListingOwnerContact.ts:18-19`) until the gateway code is deployed. | |

Row 4 (iii), row 3 and the order in row 7 are the findings I would check first; none needs a database change to establish, but all three decide how v8's NOT VALID checks and seed rows must be ordered against the code release.
