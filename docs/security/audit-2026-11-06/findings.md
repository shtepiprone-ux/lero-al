# Whole-project OWASP audit, 2026-11-06 — findings

Owner, 2026-11-06 (translated): "check the whole project, every file, every line in every file, and implement my
requirement in full, without exceptions, with a deep and complete audit". Auditor: Opus. Method: every file gets the
machine checks of its lane (`coverage.md`); every server-side file, SQL file, configuration, CI and agent file is read
in full by the auditor; client code is read in full for its sinks. Each finding: ID, severity (`secure-code-review.md`),
location, OWASP source, reproduction or evidence, and status (fixed here with a test / filed as task N).

Severity: Critical, High, Medium, Low, Info.

## Route handlers (`src/app/**/route.ts`, 18 files, 1 948 lines — read in full)

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| A-01 | Medium | `src/app/auth/confirm/route.ts:101-108`, `src/lib/auth/server.ts:112-119` | `user_metadata.company_id` is written to `users.company_id` at e-mail confirmation and at every `ensureUserProfile`. `user_metadata` is set by the person at sign-up (`options.data`) and changed by them at will (`auth.updateUser`); `users.company_id` is also writable by the person directly (DB-03). Anyone can join any company without proof. Today `company_id` only feeds the admin agent count (`src/app/admin/companies/page.tsx:26`); it becomes High the day membership grants anything | Mass Assignment ("Bind only intended input fields"); Business Logic ("Client state is input, not truth") | Task 949 (one company model) owns it; the AC is added there |
| A-02 | Low | `src/app/auth/confirm/route.ts:109` | `catch {}` swallows a failed profile upsert silently; no log line | Error Handling; JavaScript ("do not silence them with an empty catch") | Task 955 |
| A-03 | Low | `src/app/api/listings/[slug]/view/route.ts:44-55` | the view fingerprint is an unsalted SHA-256 of IP + user agent cut to 24 hex: the IPv4 space can be brute-forced, so the stored hash is re-identifiable personal data | Cryptographic Storage; User Privacy Protection | Task 959 |
| A-04 | Low | `src/app/api/listings/[slug]/view/route.ts` | anonymous service-role write with no rate limit: a client rotating its user agent inflates a listing's view count | Business Logic (abuse-prone counters need limits); Denial of Service | Task 959 |
| A-05 | Low | `src/app/api/upload-cms-image/route.ts:35` | the image type is taken from the browser-declared `file.type`; the byte sniff (`declaredTypeMatchesBytes`) that the other three upload routes run is missing here | File Upload ("don't trust the Content-Type header") | Task 957 |
| A-06 | Low | `src/app/api/upload-avatar/route.ts:91,113` | `console.log` debug lines on every upload (user id, public id) in production logs | Logging ("Limit … log"); no structured log | Task 955 |
| A-07 | Info | `src/app/api/auth-email-hook/route.ts:237-248` | with no secret outside `NODE_ENV=production` the hook accepts unsigned requests (fail-open in development only) | Webhook Security | Task 955 (AC13: 401 whenever the secret is unset, in every environment) |
| A-09 | Low | `src/app/[locale]/auth/confirm-email/page.tsx` | the e-mail-change confirmation token is consumed by a GET page render: a mail scanner or link preview that fetches the URL completes the change before the person opens it | CSRF ("no state change on GET"); Business Logic | Task 959 |
| A-08 | Info | `src/app/api/cron/*` | GET and POST both run a job; Vercel cron uses GET | — | not a gap: both methods pass the same bearer check, constant time and fail closed, `src/lib/cron/__tests__/verifyCronRequest.security.test.ts` |

Read and found sound: `exchange-rate`, `property-types` (locale allow-list), `auth/me`, `auth/callback`
(`safeNextPath`), `presence` (`requireViewer`, server-built filter), `listings` (RLS client + public visibility),
`cron/listings-expiry`, `cron/listing-activity`, `cron/inactivity`, `cron/saved-searches`, `cron/price-alerts`
(`verifyCronRequest`, every read checked), `upload-popular-location-photo`, `upload-company-logo` (grant or
`companies.manage`, byte sniff, size read before upload), `upload-avatar` (rank rule, trusted URL), `auth-email-hook`
(Standard Webhooks, trusted origin), `src/lib/cron/verifyCronRequest.ts`, `sendTemplatedEmail.ts` (variables
escaped).

## Server Actions (25 `'use server'` files, 4 998 lines — read in full)

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| S-01 | Medium | every action file | Argument checks are hand-written and uneven. About 30 exported actions call `.trim()` or read fields of an argument whose runtime type is never checked (a number or `null` gives a 500 instead of a refusal): `reportListingAction` (`comment`), `updateReportStatusAction` (`notes`), `sendInquiryReply` (`body`, no length bound), `updateCompanyAction` (`name`), `createPropertyType` / `updatePropertyType` / `createCurrency` / `updateCurrency` (every name field, `sort_order`, `decimals`), `deactivateUser` / `reactivateUser` (`reason`), `searchUsersForPicker` (`query`), `createSupportTicket`, `upsertFooterContent` (link arrays and text fields read before the admin check), `updateUserProfileFull` (`blockReason`, `companyName`, `position`, `yearStarted`, `locationId` unbounded), `createLocation` / `updateLocation` (`image_url` not checked by `isTrustedImageUrl`), `setListingPremium` (`isPremium`, an unparsable `premiumUntil` passes the past-date check), `updateSavedSearchNotify` (`notifyEmail`), `updateCabinetProfile` (`companyName`, `locationId`) | Input Validation ("validate all input server-side against an allow-list schema"); Next.js Security ("validate Server Action arguments") | Task 955 |
| S-02 | Medium | `src/modules/contacts/actions/index.ts:71` | the public contact form is anonymous with no human check: 5 per hour per IP only, and the count-then-insert race is open, so rotating addresses fill the staff mailbox and the table | Abuse Case; Denial of Service ("rate limit anonymous endpoints"); Authentication ("CAPTCHA on anonymous forms") | Task 959 |
| S-03 | Medium | `src/modules/companies/actions.ts:25` | `createCompanyAction` writes with the service role for ANY caller (no session by design, for registration), with no human check and no rate limit: unlimited company rows | Business Logic; Denial of Service | Task 949 (company creation moves to a confirmed agent's cabinet) |
| S-04 | Low | `src/modules/listings/actions/favoriteActions.ts:40,66` | the database error text (`error.message`) is returned to the browser | Error Handling ("generic message to the user") | Task 955 |
| S-05 | Low | `src/modules/auth/actions/captcha.ts:40,65` | `supabaseErrorMessage` (Supabase's own text, e.g. "User already registered") is returned to the browser: account enumeration at sign-up | Authentication ("generic responses"); Error Handling | Task 955 |
| S-06 | Low | `src/modules/cabinet/actions/index.ts:238-397`, `collectionActions.ts:11` | saved-search actions and `getCollectionsWithMembership` use `getUser()` without the block check (`getBlockedError` / `requireViewer`), unlike every other write; the restrictive `blocked_account_*` policies stop the write at the database, so the gap is consistency, not access. No cap on the number of saved searches a person stores (the daily cron reads them all) | Authorization ("one check, every path"); Denial of Service | Task 959 |
| S-07 | Low | `src/modules/admin/actions/index.ts:918-1002` | four `catch {}` around `support_ticket_events` inserts and notifications: a PostgREST error is RETURNED, not thrown, so a lost audit row is silent (the class R71 (c) fixed elsewhere) | Logging ("record security events; detect logging failures"); Error Handling | Task 955 |
| S-08 | Low | `src/modules/admin/actions/locale.ts:27`, `src/lib/auth/server.ts:120`, `src/app/auth/confirm/route.ts:109` | empty `catch {}` swallowing a failed write with no log line | Error Handling | Task 955 (+ ESLint rule, see T-02) |
| S-09 | Low | `src/modules/auth/actions/recovery.ts:36` | `LOG_CORRELATION_SALT` falls back to the constant `'lero-al'`, which is in the public repository: the 16-hex correlation id of an e-mail is then recomputable | Key Management ("no hard-coded keys"); Logging | Task 959 |
| S-10 | Low | `src/lib/uploads/uploadGrant.ts:20` | the upload grant HMAC key falls back to the service-role key: one secret used for two purposes | Key Management ("a key per purpose") | Task 959 |
| S-11 | Info | `src/modules/listings/actions/contactGateway.ts:37`, `submitListingInquiry.ts:33` | count-then-insert rate limits pass parallel requests (documented OPEN) | Business Logic (race conditions) | Task 959 (the atomic sliding-window limiter, AC2) |

Read and found sound: `mutations.ts` (RLS + `requireViewer`), `changeListingStatus.ts`, `clearHistory.ts` (atomic DB function), `popularLocationActions.ts`, `deleteListing.ts` (ownership decided before the write, exactly one row), `recentlyViewedActions.ts` (UUID allow-list), `createListing.ts` / `updateListing.ts` (schema, image allow-list, catalogue check, moderation through the gateway), `emailTemplates.ts`, `contactGateway.ts` (order: shape, session, human check, `_as` function, limits), `footer.ts` (link allow-list, CMS slug existence), `collectionActions.ts` (ownership asked before item writes), `submitListingInquiry.ts` (sender from Auth, not the form), `permissions.ts`, `propertyTypes.ts`, `currencies.ts`, `reportListing.ts` (rate limit fails closed, CAS update with audit revert), `cabinet/actions` (re-authentication with a per-person failure limit, single-use hashed e-mail-change tokens, global sign-out after a password change), `admin/actions` (field allow-lists against mass assignment, rank rule, self-sanction refused, audit rows read for errors), and
the two `server-only` gateways the actions call: `applyListingTransition.ts` (not a Server Action since S28; compare-and-set
write of exactly one row; only staff may set `active`, D8) and `contactEvents.ts` (UUID and value allow-list before any
query, signed-in live viewer, active listing of a live owner, 30-minute de-duplication).

## Server libraries (the `server-lib` lane of `coverage.md`: 112 files, 10 564 lines — read in full)

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| L-01 | Medium | `src/lib/security/headers.ts:13-38` | no enforced script policy anywhere: `script-src` is report-only and only on `/admin`, cabinet and auth routes; the public pages (listing text, CMS, footer links from data) have no CSP script defence in depth | Content Security Policy ("enforce, nonce + strict-dynamic"); XSS Prevention (defence in depth) | Task 954 (scope extended: enforce after the report-only evidence) |
| L-02 | Info | `src/lib/auth/server.ts:30` | a server `getSession()` export exists (Supabase: do not trust `getSession` on the server); no server caller uses it today | Session Management | Task 959 removes the export |
| L-03 | Low | `src/lib/passwordRules.ts:9-22`; `src/modules/auth/actions/captcha.ts:22-36`; `src/modules/cabinet/actions/index.ts:650` | the password policy is composition rules (upper, lower, digit, and a special character from the six `!@#$%*=` only) with an 8-character minimum and no breached-password check. The server applies it only on the cabinet password change: sign-up (`signUpWithCaptcha` passes the password straight to Supabase) and recovery (`ResetPasswordClient.tsx:29`, browser) check it in the browser only, so the real floor there is whatever the Supabase Auth setting is (not readable with the keys the project holds) | Authentication ("minimum length, no composition rules, allow all characters, check breached passwords"); Input Validation ("server-side") | Task 959 (one server check on every path; the policy text is an owner decision) |
| L-04 | Info | `src/types/database.ts` (611 lines) | the row types are written by hand, not generated from the catalog: nothing tells a reviewer when a type and the live column differ (example: `Listing.expires_at: string`, while the visibility code treats a missing expiry as a real state) | Secure Code Review (trust the source of truth, not a copy) | Task 956 (generate the types and fail CI on drift) |

Read and found sound: `requireViewer` (service-role row by session id, fails closed), `staff.ts` (`checkStaff`, rank rule, `requireStaffPage`), `permissions.ts` (keys read per check), `accountAccess.ts` / `blockCheck.ts` (Auth ban kept in step, CAS auto-lift), `safeRedirect.ts`, `trustedOrigin.ts`, `safeUrl.ts` (scheme allow-list after parsing), `escapeHtml.ts`, `inputs.ts` (`jsonForScript`), `postgrest/escape.ts`, `sentryScrub.ts`, `verifyTurnstile.ts` (action + hostname), `verifyCronRequest.ts`, `uploads/*` (byte sniff, Cloudinary allow-list, image count bound), `deleteAccount.ts`, `googleIdentity.ts` / `googlePopup.ts` (nonce, state, origin check), `controller.ts`, `supabase/*`. The other 79 files of
the lane: `sanitizeCmsHtml.ts` (library allow-list, own-Cloudinary images only, `target` forces `rel`), `isCmsBodyEmpty.ts`,
`sanitizeReturnTo.ts`, `savedSearchCanonicalize.ts` (known words, integer bounds, `Object.hasOwn`), `tableParams.ts`
(`Object.hasOwn` against prototype keys), `generateSlug.ts` (matches the database CHECK), every e-mail builder
(`contactInquiry`, `listingInquiry`, `emailChange`, `passwordChanged`, `sendTemplatedEmail`: every stranger-written value
escaped, the subject is one line), `notifications/lib/mutations.ts` (`requireViewer`, RLS), the admin dashboard reads
(`trends.ts`: paged, a truncated read is an error, never a smaller count), the statistics modules (an id typed
`AgentOwnerId` can only come from the session), `phone/index.ts` (libphonenumber, E.164 guard), `formatters.ts`,
`i18n/*`, `analytics/beforeSend.ts` (auth pages and the address fragment never reach analytics), and
`lib/performance/*` (browser-only measurement, no data leaves the page except through `lero:vitals` events).

## Live database (read-only catalog of the one project, 2026-11-07: 52 tables, 176 policies, 29 functions, 1 bucket)

Method: `begin transaction read only`, catalog queries only (`pg_policies`, `pg_class`, `information_schema` grants,
`pg_get_functiondef`, `pg_constraint`, `storage.buckets`); owner decision D91 allows read-only checks on the one project.
The repository holds no complete schema (only proposed migrations under `supabase/sql_migrations/`), so the live catalog
is the only full source today; Task 950 puts it under version control. Reproduce with
`node scripts/quality/db-catalog-audit.mjs` (2026-11-07: 59 invariant violations; I3 = DB-01, I5 = DB-02, I6 = DB-03, I8 = DB-04,
I4 = DB-05, I9 = DB-06, I7 = DB-08).

| ID | Sev | Object | Finding | OWASP | Status |
|---|---|---|---|---|---|
| DB-01 | High | `public.get_listing_owner_contact(uuid)` | SECURITY DEFINER and EXECUTE granted to `authenticated`: any signed-in active account calls `/rest/v1/rpc/get_listing_owner_contact` with its own session and gets the phone AND WhatsApp of any active listing, without the Turnstile check, the reveal limits (R126, D77/D79/D80) and the reveal record that `revealListingContact` enforces. The documented "revoke in hardening v8b" was never applied (v8b does not exist as SQL) | Authorization ("enforce on every path, at the trusted layer"); Business Logic (limits enforced server-side); Abuse Case (scraping) | Task 956 |
| DB-02 | High | 22 write policies on 17 tables (`listings`, `pages`, `page_translations`, `locations`, `location_translations`, `amenities`, `amenity_translations`, `listing_reports`, `report_actions`, `site_settings`, `support_tickets`, `support_ticket_events`, `verification_requests`, `companies`, `email_templates`, `contact_inquiries`, `contact_inquiry_replies`; the full list is invariant I5 of `scripts/quality/db-catalog-audit.mjs`) | the policies grant `role in (admin, moderator)` without the moderator's permission key (R75). A moderator whose key is switched off does the same writes directly through PostgREST with their session: delete any listing, rewrite any listing's text and price, write `site_settings` (logo, social links: the app's link allow-list is skipped), CMS pages, locations, reports. The keys exist only in the application | Authorization ("deny by default; the check at the data layer must match the application's"); Mass Assignment (validation skipped on the direct path) | Task 956 |
| DB-03 | High | `public.users` policy "Users can update own profile" + column UPDATE grants | a person updates their own row directly with every column the guard trigger does not protect: `company_id` (A-01), `avatar_url` and `company_logo_url` (any address rendered in `<img src>` on public pages: a tracking pixel), `website`, `phone`, `whatsapp` (no E.164 check), `name` (no length bound), `pending_email`, `location_request`, `last_seen_at`, `inactivity_warning_sent_at`, `created_at`. The code cites "the `users` CHECKs of hardening v8b" for the name, website and logo bounds: the live table has only `users_status_check` and `users_preferred_locale_check` | Mass Assignment; Input Validation (the server-side check must hold on every write path) | Task 956 |
| DB-04 | High | `public.listings` policy "Users can update own listings" | the owner updates an ACTIVE listing's title, description, price, type, location and photos' parent row directly through PostgREST; the guard trigger protects status, premium, views, slug and dates only, so the edit stays live without the moderation step that owner decision D53 / R74 requires (the app moves the listing to `pending` first) and without the catalogue check (inactive property type or currency) | Business Logic ("enforce workflow steps server-side"); Authorization | Task 956 |
| DB-05 | Low | table grants | `anon` holds INSERT / UPDATE / DELETE grants on 15 tables: `users`, `listings`, `listing_images`, `listing_contact_events`, `listing_inquiries`, `favorites`, `favorite_price_alerts`, `collections`, `collection_items`, `companies`, `currencies`, `locations`, `property_types`, `site_footer`, `recently_viewed`; RLS refuses every such write today, but least privilege removes the grant itself | Database Security ("least privilege"); Multi Tenant Security | Task 956 |
| DB-06 | Low | `storage.buckets.avatars` | public bucket with no `file_size_limit` and no `allowed_mime_types`; only the service role writes (every storage policy is RESTRICTIVE), so the bound is the route's today | File Upload (defence in depth at the store) | Task 956 |
| DB-07 | Info | `public.public_user_profiles` | a definer view (`security_invoker=false`) lists every account's name, avatar, type, verification, company name, `deleted_at` and has-phone flags to any active session | User Privacy Protection (data minimisation) | Task 956 reviews the column list |
| DB-08 | Medium | `public.listings` policy "Listings viewable by everyone" (`status in (active, sold, rented) or auth.uid() = user_id`) + table SELECT grant to `anon` | with the public anon key anyone reads, directly through PostgREST, every column of an ACTIVE listing whose `expires_at` has passed or is null, and of every sold or rented listing; the application hides all of them (`src/modules/listings/lib/visibility.ts:15-23`: only active and unexpired is public). The project has three definitions of "public listing": `visibility.ts` (active + unexpired), `listingAccessState.ts:11` (active, sold, rented), `recentlyViewedQueries.ts:41,68` (active, sold, rented, archived) | Business Logic ("one rule, enforced at the data layer"); Authorization | Task 956 (one definition, enforced by the policy) |

Verified sound: RLS is ON for all 52 tables; the 64 `blocked_account_*` policies are all RESTRICTIVE; the six tables with
no policy (`email_change_tokens`, `listing_activity_daily`, `listing_activity_refresh`, `listing_contact_reveals`,
`reauth_failures`, `role_permissions`) are service-role only by design; every SECURITY DEFINER function pins
`search_path`; `guard_users_protected_columns` stops a session from changing `role`, `is_verified`, `status`, block and
deletion fields; `guard_listings_protected_columns` stops status, premium, views, slug and owner changes; `handle_new_user`
never takes the role from metadata; `caller_is_active()` also requires a live Auth session row; storage has no
permissive policy (no direct client write).

## External services (live configuration, read-only)

Method: Cloudinary Admin API `GET /upload_presets` with the test credentials of `.env.local` (owner decision D32), no
write, no secret printed (script output scrubbed).

| ID | Sev | Object | Finding | OWASP | Status |
|---|---|---|---|---|---|
| X-01 | High | Cloudinary preset named by `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`; `src/modules/listings/components/ImageUpload.tsx:179-189`; `src/app/[locale]/listings/create/page.tsx:22-25`, `src/app/[locale]/listings/[slug]/edit/page.tsx:103` | listing photos are uploaded by the browser straight to Cloudinary with an UNSIGNED preset (live: `unsigned: true`, no `allowed_formats`, no `max_file_size`, no folder lock, no moderation, `use_filename: true`). The preset name and the cloud name are public (`NEXT_PUBLIC_*`, in the page HTML), so anyone without an account can post any file of any type and size to `https://api.cloudinary.com/v1_1/<cloud>/auto/upload` into any folder, including another person's `<userId>/listings` folder: the account's storage and bandwidth are spent (cost denial of service) and arbitrary content is hosted under the project's cloud. `isTrustedImageUrl` accepts any address in the cloud, so such an asset, or another person's photo, can be attached to a listing. The widget's `clientAllowedFormats` and `maxFileSize` are browser-side only. The comment at `src/lib/uploads/imageUrl.ts:6` ("Images are uploaded by the server") is false for listing photos | File Upload ("authenticate uploads, validate type and size on the server, the user may not choose the storage path"); Abuse Case; Denial of Service | Task 957 |


## Pages and layouts (`src/app/**/page.tsx|layout.tsx`, 41 files, 2 709 lines — read in full)

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| P-01 | Low | the 14 admin pages that read with the service role (`src/app/admin/users/page.tsx:26`, `users/[id]/page.tsx:15,25`, `inquiries/*/page.tsx:17`, `support/page.tsx:16`, `companies/page.tsx:13`, `email-templates/page.tsx:13`, …) | the pages are gated by `requireStaffPage()` alone: a moderator holding no permission key still reads every account's name, phone and company, every inquiry, support ticket and e-mail template. The keys (`src/lib/auth/permissionKeys.ts`) gate writes only | User Privacy Protection ("need to know"); Authorization ("least privilege") | Task 959 (a read key per page; which reads a moderator keeps is the owner's decision, asked in the report) |
| P-02 | Info | `src/app/admin/listings/page.tsx:50-58` | `catch {}` around `admin_search_users_by_email`, commented "RPC not yet applied"; the function exists in the live database, so a real failure is silent | Error Handling | Task 955 |
| P-03 | Info | `src/app/admin/users/page.tsx:36`, `src/app/admin/listings/page.tsx:32` | `Math.max(1, Number(sp.page))` is `NaN` for `?page=x`: the range is `NaN` and the page shows an empty list instead of page 1 | Input Validation | Task 955 |
| P-04 | Info | `src/lib/auth/safeRedirect.ts`, `src/modules/auth/lib/sanitizeReturnTo.ts` | two return-path sanitizers with different rules; one check in one place | Unvalidated Redirects and Forwards | Task 959 |
| P-05 | Info | `src/app/[locale]/cabinet/page.tsx:63` | `users.select('*')` passes the whole own row (block reason, pending e-mail, inactivity fields) to a client component | User Privacy Protection (data minimisation) | Task 959 |
| P-06 | Info | `src/modules/notifications/components/NotificationItem.tsx:289`; policies "Users can update own notifications" / `notifications_update` | `notification.link` is rendered as `href` without `safeExternalUrl` / an internal-path check, and a person may update every column of their own notifications directly (self-only today: inserts are service-role only). The table also carries two duplicate SELECT and two duplicate UPDATE policies | XSS Prevention (defence in depth for URL sinks); Database Security | Task 959 (render through the URL guard), Task 956 (column grant, duplicate policies) |
| P-07 | Medium | `contact_inquiries.requester_ip`, `listing_inquiries.requester_ip` (`src/modules/contacts/actions/index.ts:117`, `src/modules/listings/actions/submitListingInquiry.ts:137`); `listing_views.ip_hash` and `user_id` (`src/app/api/listings/[slug]/view/route.ts:44-63`); `listing_contact_reveals` (`src/modules/listings/actions/contactGateway.ts:84-89`) | personal data kept with no retention limit: the raw IP address of every contact-form and inquiry sender is stored forever, although the rate limits read only the last 24 hours; every listing view keeps the viewer's account id and the IP fingerprint forever (a per-person viewing history), although the dedup window is 24 hours; the 2-day deletion of reveal rows runs only inside a later reveal, so without traffic the rows stay. Corrects the earlier note that called the reveal retention sound (re-checked 2026-11-07 at the owner's question). A view row cannot simply be deleted: `lower_views_count_on_view_delete` would lower the public count | User Privacy Protection (data minimisation, defined retention); Logging (retention of personal data) | Task 959 (one daily retention job, AC12; periods decided by the owner 2026-11-07, O-R01: sender IP 7 days, reveal rows 2 days, a view's account id and fingerprint 2 days) |

Read and found sound: every admin page calls `requireStaffPage()` before its first read; `admin/permissions` is admin-only; admin search text is
quoted by `orContains` / `ilikeContains`; `cabinet`, `favorites`, `listings/create`, `listings/[slug]/edit` require a session and read
through RLS with the session's own id; `auth/login` sanitises `next`; `auth/verified` reads only the session; the home and contact
pages read nothing private; `[locale]/[slug]` renders CMS HTML through `sanitizeCmsHtml`; `ci/click-shield-modal` is env-gated;
`auth/google/callback` posts only to its own origin.

## Request gate, monitoring and deploy configuration (read in full)

`src/proxy.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
`next.config.ts`, `vercel.json`, `.npmrc`.

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| C-01 | Low | `src/proxy.ts:22-32` | the request gate reads the public `default_locale` setting with the SERVICE-ROLE key; a public value needs only the anon key | Key Management ("least privilege per key"); Secrets Management | Task 959 |
| C-02 | Info | `sentry.*.config.ts`, `src/instrumentation-client.ts` | `tracesSampleRate: 1` and `enableLogs: true` in production on browser, server and edge: every request and log line goes to Sentry (scrubbed by `sentryScrub.ts`) | Logging ("log what is needed") | Task 955 (sample rate) |
| C-03 | Low | `src/modules/notifications/lib/emails/send.ts:58-61,76,110`, `emailChange.ts:205,208`, `contactInquiry.ts:270`, `listingInquiry.ts:156` | a person's e-mail address is written to the server log on a failed send (the old and the new address of an e-mail change, the inquirer, the listing owner) and in development | Logging ("do not log personal data") | Task 955 |
| C-04 | Info | `src/modules/notifications/lib/emails/resolveUserLocale.ts` | deprecated module with no caller and an empty `catch {}` | Error Handling | Task 955 removes it |
| C-05 | Info | `src/lib/cloudinaryDelete.ts:102` | the reference check reads only the first 500 CMS pages: with more, an image used on page 501 can be destroyed | Business Logic | Task 957 |

Read and found sound: the proxy refreshes the session on `/admin` and `/api` and excludes only the cron and Auth-hook routes (each
authenticates on its own); `sendDefaultPii: false` with the scrubber on events, transactions and logs; security headers on every
route (`next.config.ts:15-17`); `.npmrc` `ignore-scripts=true`; cron paths in `vercel.json` are the five verified routes.

Server module libraries read in full (27 files, 2 600 lines): `cloudinaryDelete.ts` / `cloudinaryUpload.ts` (signed, reference
check fails closed), `getExchangeRateServer.ts`, `footer-route-allowlist.ts`, `admin/lib/*`, `cabinet/lib/queries.ts`,
`listings/lib/*` (`contactHumanCheck`, `favoritesQueries`, `listingAccessState`, `queries`, `recentlyViewedQueries` (UUID filter on
the cookie), `visibility`), `notifications/lib/*` (every interpolated person-supplied value escaped; `sendEmail` refuses multi-address
and header injection), `admin/dashboard/queries.ts`, `analytics/activity/read.ts`, `cabinet/statistics/access.ts` / `data.ts`
(owner id from `requireViewer`, every query scoped to it).

## Build configuration and tooling (the `build-config` lane: 14 files read in full; `package-lock.json` by machine)

`package.json`, `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `vercel.json`, `.npmrc`, `.nvmrc`, `.gitignore`,
`.gitattributes`, `.orchestratorignore`, `components.json`, `postcss.config.mjs`, `sentry.server.config.ts`,
`sentry.edge.config.ts`. `package-lock.json` (36 856 lines) is checked by `npm audit`, the install-script review
(`install-scripts.test.mjs`), the SBOM job and Dependabot, not read by a person.

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| B-01 | Low | `.nvmrc` (`20`), `package.json` (no `engines`, `@types/node ^20`) | the local and declared runtime is Node 20, whose upstream support ended on 2026-04-30, while CI builds and tests on Node 22.22.3: what CI proves is not what the repository declares. The production runtime is a Vercel project setting this audit could not read (the agent's Vercel connection has no access to the team scope) | Vulnerable and Outdated Components; CI/CD Security ("build and test what you ship") | Task 958 (`engines.node` and `.nvmrc` pinned to the CI version, a test compares them; the owner confirms the Vercel setting) |
| T-02 | Low | `eslint.config.mjs` | no lint rule refuses an empty `catch {}`; A-02, S-08 and C-04 were found only by reading. The security block (`no-eval`, `react/no-danger`, …) has no rule for a swallowed error | Error Handling ("never silence errors"); Secure Code Review (automate what a reader found) | Task 955 (`no-empty` with `allowEmptyCatch: false` on product code once the Next 16 upgrade releases `eslint.config.mjs`; every remaining empty catch gets a comment that says why) |
| T-03 | Medium | `src/__tests__/security/clientSinks.test.ts` | the existing sink test (checked against the DOM based XSS and XSS Filter Evasion sheets at the owner's question, 2026-11-07): its "planted" case tested a regex literal, not the checker, so a broken rule still passed; the raw-HTML, `eval` and timer rules had no planted case at all; `dangerouslySetInnerHTML` was allowed per FILE (a second, unsanitised use in `CmsPageView.tsx` or `SimilarListings.tsx` passed); `innerHTML +=`, `Function(` without `new` and `document.writeln` were not seen; navigation to a computed address, `srcdoc`, `setAttribute` of a handler or URL and `createContextualFragment` were not checked anywhere | Secure Code Review (a control is proven to detect); DOM based XSS Prevention (sink list) | fixed in this audit (`src/__tests__/security/clientSinks.test.ts`, `scripts/quality/client-sinks.mjs`): the rules run through shared checkers with planted cases for every rule and one use per allowed file; `client-sinks.mjs` K6-K8 cover the rest, each with a planted case; 15 navigation and DOM sinks reviewed line by line and listed with their reason |
| T-04 | Low | `messages/*.json`; `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts` | nothing checked the VALUES of the locale files (only the keys): two Story captions (`storybook.mantine.header_view_caption_guest` / `_authed`, four locales) were invalid ICU (`(<md)` opens a tag), so next-intl failed to format them; and the CMS sanitizer's security test held one case (other cloud images) and none of the OWASP XSS Filter Evasion vectors | Input Validation; XSS Filter Evasion; Secure Code Review | fixed in this audit: `scripts/quality/locale-safety.mjs` (M1-M6, self-test in CI) and the captions escaped (`('<'md)`, same visible text); 25 evasion vectors with a sensitivity case (every raw vector fails the rule) — `sanitizeCmsHtml` passes all |

Read and found sound: `.npmrc` keeps install scripts off; `.gitignore` keeps every `.env*`, `*.pem`, the database CA
(`prod-ca-2021.crt`), `.vercel` and the local `.claude` state out of the repository; `.gitattributes` forces LF;
`tsconfig.json` is `strict`; ESLint refuses code-from-string, `dangerouslySetInnerHTML` outside a named sanitizer,
`javascript:` URLs, invisible characters and unused disable comments.

## Client sinks (every product `.ts` / `.tsx`, machine census, flagged lines read)

The census is now a tool that runs in CI on every line of product code: `scripts/quality/client-sinks.mjs` (rules K1-K8: postMessage to `*`, message listeners without an origin check, `outerHTML` / `insertAdjacentHTML`, credential-like storage, stored URLs as `href`, HTML / code / URLs set through DOM APIs (`innerHTML +=`, `Function(`, `createContextualFragment`, `srcdoc`, `setAttribute` of a handler or URL), navigation to a computed address, and every `dangerouslySetInnerHTML` by occurrence; the existing `src/__tests__/security/clientSinks.test.ts` covers `window.open`, `target="_blank"`, `dangerouslySetInnerHTML`, `eval`, `innerHTML =` and `document.write`;
a reviewed list whose stale entries fail; `client-sinks.test.mjs` plants each sink, and a run with the reviewed list
emptied finds exactly the one known line, P-06). Detectors of the one-off census: `postMessage` and `message` listeners, writes to `location`, `eval` / `new Function` / `innerHTML` /
`document.write` / `insertAdjacentHTML`, `localStorage` / `sessionStorage`, `Math.random`, `NEXT_PUBLIC_*` names, `href`
built from data without the URL guard. Result: the Google popup relay posts to its own origin and the listener checks the
origin (`src/lib/auth/googlePopup.ts`); no code sink; storage holds no credential (a remembered Google account's name,
masked e-mail and picture by design; the return path is re-sanitised on read); `Math.random` only in ids that carry no
security meaning; every `NEXT_PUBLIC_*` value is public by design; data-built links go through `safeExternalUrl`, a
`tel:` / `https://wa.me/` prefix with digits only, or a server-built path, except P-06.

## CI, hooks and agent configuration (read in full)

`.github/workflows/ci.yml`, `repository-settings.yml`, `scorecard.yml`, `.github/dependabot.yml`, `.githooks/pre-commit`,
`.claude/settings.json`, `.claude/agents/*`, `.claude/skills/*`, `.claude/rules/**`.

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| CI-01 | Medium | `.github/workflows/ci.yml` jobs `authz`, `click-shield` | the Supabase service-role key and URL were bound at JOB level: every step saw them, the third-party actions, `npm ci` and the Playwright install included | CI/CD Security ("least privilege for pipeline credentials"); GitHub Actions Security | fixed here: secrets bound on the steps that read them; `scripts/quality/ci-workflow.test.mjs` refuses a workflow- or job-level secret and a secret on a `uses:` step, `npm ci` or the browser install (planted case and the pre-fix workflow both refused) |
| CI-02 | Low | every job: `step-security/harden-runner` with `egress-policy: audit` | outbound traffic is recorded, never blocked: a compromised dependency in a job that holds a secret can send it anywhere | CI/CD Security ("restrict network egress") | Task 958 (allow-list from the audit logs, then `block`) |
| G-01 | High | `.claude/skills/review-task/SKILL.md`, `create-task/SKILL.md`, `.claude/rules/secure-code-review.md` | no tool of either model reads the LIVE database catalog or the live configuration of an external service. The repository holds no complete schema, so a diff review cannot see DB-01..DB-08 or X-01; all nine were found only by this audit's catalog and Admin API reads | Secure Code Review ("review the configuration, not only the code"); Database Security; Threat Modeling | fixed here: `scripts/quality/db-catalog-audit.mjs` and `scripts/quality/cloudinary-config.mjs` (read-only, invariants tested on fixtures in CI) are steps of `create-task`, `execute-task`, `review-task` and `secure-code-review.md` §1.5, which also gained the check that an application-only guard has a database twin |
| G-02 | Medium | the governance reset of 2026-11-06 | no ledger proves which files an audit covered and how: the owner's "every file" could not be checked | Secure Code Review (scope); Logging (audit trail) | fixed here: `scripts/quality/audit-coverage.mjs` assigns every tracked file to a lane and fails on an unassigned file; `coverage.md` records the lanes, their checks and what was read manually |
| E-01 | Info | `docs/sessions/evidence/**` (900+ probe scripts) | developer-run probes: shell commands from fixed strings, `.env.local` reads with scrubbing; never run in CI | — | Task 951 (their CodeQL alerts); the machine checks of their lane (`scripts/quality/check-files.mjs`, gitleaks) run on every file |

Read and found sound: every action pinned to a full SHA; `permissions: {}` at the top of each workflow and the least scope per
job; `persist-credentials: false` on every checkout; no `pull_request_target`; no untrusted `${{ github.event.* }}` text in a
`run:` (the base SHA reaches the shell through `env:`); `CI Required` needs every job (tested); `.npmrc` keeps install scripts
off; the pre-commit hook and the agent settings are covered by `agent-settings.test.mjs` and `agent-check.test.mjs`.

## The OWASP Cheat Sheet Series, sheet by sheet (2026-11-07)

Owner, 2026-11-07 (translated): "create a tool or script that will force the Opus model, when creating, editing or
reviewing a task, to always check against https://cheatsheetseries.owasp.org/index.html and add or upgrade the protections
and checks of current and new code, because I am not sure you did it, and all this work will be useless without permanent
synchronisation". All 137 sheets of the upstream repository (commit `757270a26306`) were read and mapped in
`docs/security/owasp/controls.json`: 84 apply, 53 do not (each with its reason). Each requirement of an applicable sheet is
a verbatim quote held either by a control of this project (a file and the text in it that implements the quote) or by a
numbered task whose kickoff cites it. A requirement that no control held was a gap; the gaps below are new to this audit.

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| G-03 | High | `.claude/skills/*`, `.claude/rules/*`, CI | the reference was a memory, not a gate: nothing made a task design or a review consult the current sheets, nothing noticed a sheet changing upstream, and a cited "OWASP" line was never checked against the sheet's text. The audit above could age silently | Secure Code Review; Threat Modeling (re-done when the reference changes); Vulnerable Dependency Management (a reference is a dependency) | fixed here: `scripts/quality/owasp.mjs` (`sync`, `check` O1-O8, `plan`, `kickoff`, `review`; `owasp.test.mjs` plants each rule); CI fails when upstream differs from `sheets.json` or a mapping, quote, evidence or handed requirement does not hold; `check-files.mjs` refuses a Sprint 93+ kickoff without a verified "## OWASP" section; a review verdict needs "### OWASP check" over the kickoff's sheets and every sheet the diff triggers; every Claude Code session starts with the reference's state (`agent-check.mjs start`, re-reads upstream after a day); the skills and `flow.md` name the steps |
| OW-01 | High | `src/lib/auth/*` (no `aal2` check anywhere in `src`); the Supabase session cookies | staff accounts sign in with a password alone, no second factor; the session cookies are readable by page script (the browser client reads them), so one script injection takes the session | Multifactor Authentication; Session Management ("HttpOnly"); Cookie Theft Mitigation; Credential Stuffing Prevention | Task 960 (the MFA scope is owner decision O-MFA) |
| OW-02 | Medium | the count-then-insert limits (`src/modules/contacts/actions/index.ts`, `src/modules/listings/actions/submitListingInquiry.ts`, `contactGateway.ts`) | beyond the race of S-11, a fixed-window design lets twice the limit through across a window edge | Bot Management and Anti-Automation (per-endpoint limits, fixed-window weakness) | Task 959 (the atomic limiter is a sliding window: an advisory lock, old hits deleted, count, insert below the maximum; AC2 tests the window edge) |
| OW-03 | Low | `src/modules/contacts/actions/index.ts:82`, `src/modules/listings/actions/submitListingInquiry.ts:93`, `src/modules/auth/actions/recovery.ts:38`, `googleIdentity.ts:133`, `rememberedGoogleAccount.ts:23`, the e-mail change | e-mail addresses are lower-cased and trimmed inline, each path its own way: a limit or a lookup keyed by the address can be split by a variant spelling | Email Validation and Verification (normalise before comparing); Input Validation | Task 959 (`normalizeEmail` in `src/lib/security/inputs.ts`, one call on every path; AC13) |
| OW-04 | Low | answers that depend on the session (`src/proxy.ts`, the cabinet and admin pages) | nothing states `Cache-Control: private` / `no-store` on a personalised answer: a shared cache in front of the site may keep one person's page for another | Web Cache Deception ("default to preventing shared caching") | Task 954 (Scope: the shared-cache line; AC7) |
| OW-05 | Low | every security-relevant failure path | security events are written as free text, each path its own words: no alert can be written on them | Logging Vocabulary | Task 955 creates `src/lib/security/securityEvent.ts` with the vocabulary's event names (AC12) |
| OW-06 | Low | the DNS zone of `lero.al`; the MCP servers the agents use | nothing watches for a dangling CNAME (subdomain takeover) or for a changed tool description of an installed MCP server (rug pull) | Subdomain Takeover Prevention ("DNS change monitoring"); MCP Security ("rug pull detection") | Task 961 |

## Proposed SQL (`supabase/sql_migrations/**`, 22 files, 3 266 lines)

Read in full: `proposed-hardening.sql` (v7.1), `proposed-hardening-v8a.sql`, `proposed-account-deletion.sql`,
`proposed-contact-reveals.sql`, `a12-account-has-password.sql`; their `.dryrun.sql` twins differ in the last line, their
`-rollback.sql` files restore the captured state, and `review-48/*` / `review-13/*` are earlier copies (compared by DDL
census). The live catalog holds every object these files create, so all of them are APPLIED, although each header still
says "PROPOSED — NOT APPLIED".

| ID | Sev | Location | Finding | OWASP | Status |
|---|---|---|---|---|---|
| SQL-01 | High | `proposed-hardening-v8a.sql:10-11` | v8a names what "v8b, after the push" must do: R69 (a) the staff listings policy, R69 (d) the users CHECKs, R84 the moderation of an active listing, R86 (c) the revoke of `authenticated` from `get_listing_owner_contact`. The push happened; v8b was never written. These are DB-01 to DB-04 | Database Security; Secure Code Review (a planned control tracked to closure) | Task 956 and Task 962 carry v8b (962: the five promises v8a named that no task held) |
| SQL-02 | Info | every applied file's header | "PROPOSED — NOT APPLIED" on applied files: an auditor reading the repository is told the opposite of the live state | Logging (an accurate record of changes) | Task 950 (the applied schema under version control, the drafts marked applied) |

Checked and sound: `listing_contact_reveals` access (RLS on, no policy, no session grant; its retention is NOT sound, see P-07); `account_display_name` / `set_actor_name` (service-role
only, no name taken from a writer); `reauth_failures`, `end_user_sessions`, `set_default_currency` (service-role only).
