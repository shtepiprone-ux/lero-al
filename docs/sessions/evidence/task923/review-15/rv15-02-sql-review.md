# Task 923 review 15 — Opus re-review of the v4 hardening SQL and the account-deletion SQL (2026-10-19)

Files reviewed (SHA-256 in `rv15-01-reviewed-sha256.txt`): `db-catalog/proposed-hardening.sql` (v4, `11b9c065…49545f`) with its rollback, and
`db-catalog/proposed-account-deletion.sql` (`691007fc…04c55e`) with its rollback. Sources read: `catalog.json` and `fingerprint.json` (2026-10-17),
`r9-61-deletion-schema-facts.txt`, `r9-account-references.json`, `r9-52-rls-harness-pre-apply.txt`, and the application code that writes the guarded
tables (`createAdminUser`, `updateListing`, `deleteListing`, `api/presence`, the inactivity cron, the view route).

**Verdict: neither file is approvable as written.** Both are sound in structure. Five changes are required (below). The owner has not been asked to
approve either hash, and must not approve these two.

## Hardening v4 — what holds

- Review 8's changes 1–8 are all present: `public, pg_temp` in the three rewritten functions; `caller_is_active()` requires the profile row,
  `deleted_at is null`, a status that gives access and a live `auth.sessions` row for the JWT's `session_id`; `caller_is_admin()` requires
  `caller_is_active()`; restrictive SELECT / INSERT / UPDATE / DELETE policies on every public table `authenticated` is granted; the `users`
  guard on INSERT too; the v4 header; restrictive policies on `storage.objects`; `caller_access_state()` and `restore_inactive_account()`.
- `restore_inactive_account()` makes the writes of `src/app/api/presence/route.ts:35-48`, stricter in one point (status must be `inactive`).
- The guards do not break the application writers: `createAdminUser` writes the profile with the service role after `auth.admin.createUser`
  (`src/modules/admin/actions/index.ts:551`, `:568`); `updateListing` writes through the session client only the fields of `listingSchema`,
  which has none of the guarded columns; the view route uses `createAdminClient()`.
- The harness covers every check R37 (a) names, and its run against the unhardened database exits 1 with the expected VULN rows and clean-up
  verified (`r9-52-rls-harness-pre-apply.txt`).
- The rollback drops every `blocked_account_no_*` policy (public and storage), both guards, the four new functions and the quota table, and
  restores the audited bodies and grants.

## Required changes — hardening (v5)

1. **The view `public_user_profiles` stays readable** (P2). It is a view with `security_invoker=false` (`catalog.json:290-297`), granted SELECT to
   `authenticated` only (`catalog.json:1838-1843`; the listing page notes "anon returns null", `src/app/[locale]/listings/[slug]/page.tsx:162`).
   The policy loop joins `pg_tables` (`proposed-hardening.sql:307`), which holds no view, and a definer view ignores the RLS of `users`. So a
   blocked, deleted or signed-out-elsewhere account keeps a read path that a guest does not have (seller name, company, avatar, `has_phone`).
   Required: capture `pg_get_viewdef('public.public_user_profiles', true)` and its md5 into the catalog, check the md5 in the preflight, recreate
   the view with the same columns and `(select public.caller_is_active())` added to its condition, keep its grants, and restore the captured
   definition in the rollback. Harness: a blocked, a deleted and an ended-session account read 0 rows from the view; an active account reads it.
2. **`search_path` of the other SECURITY DEFINER functions** (P2). The v4 header says "every SECURITY DEFINER function written without it"
   (`proposed-hardening.sql:14`), but `clear_user_history`, `handle_new_user_notifications` (trigger on `public.users`),
   `listing_contact_events_set_owner` (trigger on a table `authenticated` may insert into, `catalog.json:2200-2203`) and
   `process_saved_search_notify` keep `search_path=public`, `admin_search_users_by_email` keeps `auth, public` and `rls_auto_enable` keeps
   `pg_catalog` (`catalog.json` "functions"). Required: `alter function … set search_path` with `pg_temp` appended to each current list
   (`public, pg_temp`; `auth, public, pg_temp`; `pg_catalog, pg_temp`), no body change; the preflight checks each current setting and the rollback
   restores it. Harness: read `proconfig` of every SECURITY DEFINER function of `public` and require `pg_temp` as the last entry.

## Account deletion — what holds

- The preflight's 19 delete rules equal `r9-61-deletion-schema-facts.txt`, and every re-created key names the same target table as there.
- The 17 name columns, their triggers and the backfill cover R43 (b) (1) and (3); the five NO ACTION keys and the two NOT NULL columns are
  handled; `listing_views` and `listing_contact_events` cascade; the views-count trigger never goes below 0; no other code deletes
  `listing_views` rows (`recompute_listing_activity` only reads them), so the trigger lowers a count only when a person's views go.
- `companies.created_by` with `ON DELETE CASCADE` and its index. The rollback restores every rule and drops every object.

## Required changes — deletion (v2)

3. **The backfill rewrites `updated_at`** (P2). `email_templates` and `support_tickets` carry `BEFORE UPDATE` triggers that set `updated_at`
   (`fingerprint.json:24-26`, `:52-54`), so the backfill (`proposed-account-deletion.sql:97`, `:121`, `:124`, `:139`) gives every template and ticket
   a staff member touched a new "last updated" time at migration. Required: in the same transaction, disable exactly those two triggers around
   their backfills and enable them again (the preflight checks both names); the harness counts rows whose `updated_at` changed: 0.
4. **A name column can be written by the client** (P2). `set_actor_name()` keeps a supplied name when the id is null on INSERT
   (`proposed-account-deletion.sql:83`) or unchanged on UPDATE (`:84`), so a writer can store any name beside a staff id or with none. Required:
   the name is the trigger's alone — INSERT sets it from the id (null when the id is null); UPDATE recomputes it when the id changes to another
   person, keeps the old name when the id becomes null (the deletion), and keeps the old name when the id is unchanged. The backfill therefore
   runs **before** each trigger is created. Harness: an insert and an update that supply a name keep the trigger's value.
5. **The preflight checks only the delete rule** (P2). `proposed-account-deletion.sql:53` reads `confdeltype` and nothing else, while the seven
   re-created keys are written with defaults (no `ON UPDATE`, `MATCH`, `DEFERRABLE` clause). Required: record `pg_get_constraintdef(oid)` of the
   seven keys in the schema facts, compare it in the preflight, and restore exactly that definition in the rollback.

## Outside the SQL (Opus decision, amends R43 (c))

The file lists three references its design does not cover (`proposed-account-deletion.sql:18-19`). Under D30 (one complete deletion) all three
go with the account: `deleteAccount` also collects the Cloudinary public ids of `users.company_logo_url` and of every
`verification_requests.document_url` of the person (identity documents), and removes every Storage object of the `avatars` bucket under
`<user id>/` through the service role; a failure is logged and counted in `filesNotRemoved` like the other files.

## Notes (no change to these files)

- The views-count trigger updates `listings`, which fires `listings_updated_at` and `listings_search_vector`, as every counted view already does.
- `companies.created_by` cascades from the creator. Task 926 must not record a staff member as the creator of a company made for an agent,
  or deleting that staff account would delete the agents' company; filed against Task 926's kickoff at its next revision.

## After v5 and v2

The executor regenerates both files through their generators, re-runs the syntax check and the harness against the unhardened database
(exit 1, the new checks listed), and reports the four SHA-256. Opus re-reviews. Only then is the owner asked to approve the two hashes.
