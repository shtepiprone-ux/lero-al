# Task 923 review 20 — Opus deep audit working notes (2026-10-20, HEAD fe07bb62e)

Scope read line by line so far: all 27 'use server' modules, api routes auth/me, listings, listings/[slug]/view, property-types, presence,
upload-avatar, upload-cms-image, upload-company-logo, cron inactivity / listings-expiry / listing-activity / saved-searches, lib/auth permissions /
requireViewer, catalog.json policies + grants (db-policies.txt), fingerprint constraints, r14-03 capture columns.

## New, verified
- X01 P1 cron/inactivity selects users.email; public.users has no email column (r14-03-capture) -> query error ignored -> job never warns or deactivates.
- X02 P1 listings RLS: staff ALL policy + authenticated full grants -> a moderator deletes / edits any listing through the Data API without listings.delete
  (permission keys enforced only in Server Actions). Hardening guard returns early only for caller_is_admin; moderators keep DELETE and content UPDATE.
- X03 P2 Data API bypasses the listing Zod schema and image allow-list: listings has no CHECK on title/description length, price>0, lat/lng; listing_images
  writable by the owner with any url (S21 fix only in actions); users own-row UPDATE writes avatar_url / company_logo_url / website / phone / whatsapp / name
  unchecked (avatar shown to visitors in the contact card).
- X04 P2 sold / rented / archived listings: public pages and the "closed" tab read through the session client; RLS SELECT allows status='active' OR own ->
  every visitor gets 404 / empty tab while the code builds archived-noindex, F2 lock and closed tab for them. CONFLICT -> owner.
- X05 P1 initiateEmailChange has no re-authentication: a stolen session changes the login e-mail to the attacker's and then resets the password.
- X06 P2 deleteOwnAccount has no re-authentication.
- X07 P2 submitListingInquiry: sender e-mail is caller-chosen (Reply-To any address); limit keyed on IP, not the verified user.
- X08 P2 changeCabinetPassword: signOut({scope:'others'}) result not checked ({error} is returned, not thrown).
- X09 P2 moderator user actions without permission keys: updateUserProfile, toggleUserVerified, approve/rejectLocationRequest, createSupportTicket,
  updateTicketStatus, currencies, property types, exchange providers, companies update/delete, email templates, contact inquiries.
- X10 P2 createAdminUser: users.create alone assigns the moderator role (editing a role needs users.change_role).
- X11 P2 audit rows lost: `try { await db.from(x).insert() } catch {}` never sees a PostgREST error (index.ts:484-492, 505-513, 645-653, 677-685, 925-934,
  986-996); updateUserProfile / toggleUserVerified report success on a failed write (:169, :180).
- X12 P2 fire-and-forget I/O in serverless (createNotification().catch in the gateway, void sendPasswordChangedEmail) -> can be dropped; use after().
- X13 P2 staff edit of another person's listing images: listing_images RLS is owner-only, updateListing uses the session client -> delete/insert refused silently.
- X14 P3 raw database error text returned to the browser (createListing :64, updateListing :161, deleteListingAction, collections, favorites, saved searches,
  currencies, providers, property types, locations).
- X15 P3 upload routes check dimensions after the upload (orphaned Cloudinary files); staff logo replacement leaves the old logo.
- X16 P3 listings-expiry writes status outside the gateway: no owner notification, no revalidation.
- X17 P3 inactivity cron status filter names "self_deleted", not a status.
- X18 P3 exchange_providers: endpoint_url / api_key stored and shown to moderators but never used (rates come from iliria98 + open.er-api).
- X19 P3 hardDeleteUser / softDeleteUser allow self; gateway actor role hard-coded 'admin' for moderators (audit misattribution).
- X20 P3 logPasswordRecoveryCompletion callable any time by a signed-in person -> repeated "password changed" e-mails (Resend quota).
- X21 P3 propertyTypes delete/update: listing count error ignored -> fail-open.
- X22 P3 listing price has no upper bound; property_type / currency enums hard-coded while admin manages the tables.
- X23 P3 no caps: saved searches, collections, favorites per person.
- X24 P2 src/proxy.ts is dead (middleware-manifest registers only src/middleware) -> admin default_locale setting has no effect.
- X25 P1 (upgraded) 22 admin pages have no own staff check; 14 read with the service key. admin/users/[id] reads users select('*'), auth e-mail,
  change log and status history (:29-70) before requireViewer (:75), and generateMetadata (:11-16) reads the name with no check at all.
  Next 15.5.18 walk-tree-with-flight-router-state skips matching layout segments; the owner's report probe
  `docs/chat-gpt-reports/2026-10-20-full-admin-layout-probe.json` (walker real, renderer double) shows layoutGuardCalls 0 and the page returning
  phone. Not a full HTTP/RSC reproduction -> R68 requires the real HTTP probe first.
- X26 P2 owner edits an active listing with no re-moderation (listingPermissions) -> OWNER question.
- X27 P3 price-alerts cron covers non-public listings (`.neq('status','archived')`) and compares price without currency.
- X28 P2 /auth/confirm consumes every OTP type by GET (link scanners burn magiclink / email_change tokens); dead users upsert in confirm and callback.
- X29 P2 CSP has no script-src (baseline only).
- X30 P2 updateUserProfileFull saves suspended_until before validating it; a past date makes the block a no-op.
- X31 P2 lint red: 2 react/display-name errors in untracked test files (AuthSheet.test.tsx:58, authClientParts.test.tsx:20); eslint ignoreDuringBuilds.
- X32 P3 no sitemap / robots / not-found / segment error pages; global-error is English-only NextError statusCode 0.
- X33 P3 CMS image allow-list accepts any res.cloudinary.com cloud, not the project cloud.
- X34 P3 no rate limit: createCompanyAction (Task 926), reportListing, upload routes, listing view counter (UA varies the key).
- X35 P3 local assertAdmin guard duplicated in 8 modules (one owner needed).
- X36 P3 owner-contact daily quota still NULL (D-quota open) -> OWNER number.
- X37 P2 src/middleware.ts matcher excludes api and admin -> refreshSession never runs there; Server Components cannot write cookies
  (supabase/server.ts setAll catch {}) -> a token refreshed on /admin is not stored (rotated refresh token reused -> staff signed out), and the R45 (a)
  banned / deleted sign-out never runs on /admin or /api.
- X24 detail: next-intl default localePrefix 'always' redirects "/" in middleware before src/app/page.tsx (getDefaultSiteLocale) can run.
- X38 P3 Supabase Storage bucket `avatars` is public, unused by the code (no storage.from), and moderators may INSERT / UPDATE / DELETE any object
  in it (catalog.json storage policies) -> remove the bucket or its write policies.
- X39 P3 `try { await db.from(...) } catch {}` around PostgREST calls (admin/users/[id] :42-62) never sees an error; dead pattern.
- X40 P3 Google sign-in drops the original destination (AuthSheet handleGoogle -> /auth/callback without next).
- X41 P3 admin/companies page reads every users.company_id with no range -> member counts silently stop at the PostgREST row cap.
- Popular-location photo route: the previous image is not deleted (orphan), same class as X15.
- Report check 2026-10-20 00:25: new `2026-10-20-full-admin-layout-probe.json` and progress update -> X25; nothing else new.
