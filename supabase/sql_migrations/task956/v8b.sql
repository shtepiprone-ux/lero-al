-- Task 956 Part B, hardening v8b: the database enforces the moderator keys, the contact gateway, the profile bounds,
-- edit moderation and one public-listing rule. Written against the live catalog read on 2026-11-15 (59 findings of
-- scripts/quality/db-catalog-audit.mjs). One transaction; every object is schema-qualified.
-- Run v8b-preflight.sql first: every count of its rows 1 to 14 must be 0 (rows 15 and 16 are informational: the websites step 0 rewrites, the lapsed active listings step 6 closes). The way back is v8b-rollback.sql; the proof of both is
-- scripts/quality/db-sql-roundtrip.mjs. After the apply run v8b-verify.sql: every row must say ok = true.
begin;

-- 0. A data step before the CHECK that would refuse the row (Review 3, F4; owner decision O956-1). users.website is checked below to be an https address, and the live
--    table held a value with no scheme (`lero.al`); the admin form cannot save such a profile unchanged, so this file fixes the row itself. A value with no scheme is stored as the
--    application stores it: normalizeWebsite (src/modules/admin/actions/index.ts) reads a host with no scheme as https and keeps what safeExternalUrl (src/lib/security/safeUrl.ts)
--    returns, which is URL.href. So `lero.al` becomes `https://lero.al/` (the host in lower case; a slash after a bare host, as the profile saved through the form already holds:
--    `https://lero.al/`) and `lero.al/team` becomes `https://lero.al/team` (a slash is added only when nothing, a query or a fragment follows the host). Only a value with no scheme
--    that reads as a host is changed (the same two patterns as safeUrl.ts: HAS_SCHEME and a host with a dot; a value with a control character or any white space is left alone, because
--    the application trims and encodes it and this file does not; so is a value with an `@` or a backslash before the first `/`, `?` or `#`, as an address with credentials is refused
--    there); every other value, `http://` ones included, stays for the CHECK and is counted by v8b-preflight.sql.
--    The step is not undone by v8b-rollback.sql. Showing the website without its scheme is the application's (Task 956 AC13: displayWebsite in src/lib/security/safeUrl.ts), not this file.
update public.users
  set website = 'https://' || lower(substring(website from '^[^/?#]*'))
                || case when substring(website from '^[^/?#]*(.*)$') ~ '^([?#]|$)' then '/' else '' end
                || substring(website from '^[^/?#]*(.*)$')
  where website is not null
    and website !~* '^[a-z][a-z0-9+.-]*:'
    and website ~ '^[^\s/?#:@]+\.[^\s/?#@]+'
    and website !~ '[[:cntrl:][:space:]]'
    and website !~ '^[^/?#]*[@\\]';

-- 1. The permission key as a database fact (finding DB-02). It answers about the caller only: an active administrator holds
--    every key; an active moderator holds the keys the administrator switched on in public.role_permissions (a key with no
--    row is off); every other caller holds none. SECURITY DEFINER because a session cannot read role_permissions.
create function public.caller_has_permission(key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.caller_is_admin() then true
    when public.caller_is_active()
      and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'moderator'::public.user_role)
      then coalesce((select rp.allowed from public.role_permissions rp
                     where rp.role = 'moderator' and rp.permission_key = caller_has_permission.key), false)
    else false
  end
$$;
revoke all on function public.caller_has_permission(text) from public, anon;
grant execute on function public.caller_has_permission(text) to authenticated, service_role;

-- 2. The 22 write policies that admit a moderator now ask for the key the application checks for the same write.
--    Reading is not changed: where a dropped ALL policy was the only staff read, a SELECT policy keeps it.

-- 2a. A policy of one command keeps its name and roles; only its predicate changes.
alter policy "companies_admin_update" on public.companies
  using ((select public.caller_has_permission('companies.manage')));
alter policy "companies_admin_delete" on public.companies
  using ((select public.caller_has_permission('companies.manage')));
alter policy "contact_inquiries_moderator_update" on public.contact_inquiries
  using ((select public.caller_has_permission('inquiries.manage')));
alter policy "contact_inquiry_replies_moderator_insert" on public.contact_inquiry_replies
  with check ((select public.caller_has_permission('inquiries.manage')));
alter policy "email_templates_insert" on public.email_templates
  with check ((select public.caller_has_permission('email_templates.manage')));
alter policy "email_templates_update" on public.email_templates
  using ((select public.caller_has_permission('email_templates.manage')));
alter policy "listing_reports_admin_update" on public.listing_reports
  using ((select public.caller_has_permission('reports.manage')));
alter policy "ste_admin_insert" on public.support_ticket_events
  with check ((select public.caller_has_permission('support.manage')));
alter policy "support_tickets_admin_insert" on public.support_tickets
  with check ((select public.caller_has_permission('support.manage')));
alter policy "support_tickets_admin_update" on public.support_tickets
  using ((select public.caller_has_permission('support.manage')));

-- 2b. An ALL policy is replaced by one policy per command, each with its key.
drop policy "Only admins can manage amenities" on public.amenities;
create policy "amenities_staff_insert" on public.amenities for insert to authenticated
  with check ((select public.caller_has_permission('catalog.manage')));
create policy "amenities_staff_update" on public.amenities for update to authenticated
  using ((select public.caller_has_permission('catalog.manage')));
create policy "amenities_staff_delete" on public.amenities for delete to authenticated
  using ((select public.caller_has_permission('catalog.manage')));

drop policy "Admins can manage amenity translations" on public.amenity_translations;
create policy "amenity_translations_staff_insert" on public.amenity_translations for insert to authenticated
  with check ((select public.caller_has_permission('catalog.manage')));
create policy "amenity_translations_staff_update" on public.amenity_translations for update to authenticated
  using ((select public.caller_has_permission('catalog.manage')));
create policy "amenity_translations_staff_delete" on public.amenity_translations for delete to authenticated
  using ((select public.caller_has_permission('catalog.manage')));

-- listing_reports: the update policy above covers UPDATE; staff reading stays on listing_reports_admin_select.
drop policy "Admins can manage reports" on public.listing_reports;
create policy "listing_reports_staff_insert" on public.listing_reports for insert to authenticated
  with check ((select public.caller_has_permission('reports.manage')));
create policy "listing_reports_staff_delete" on public.listing_reports for delete to authenticated
  using ((select public.caller_has_permission('reports.delete')));

-- listings: staff keep reading every listing; UPDATE needs listings.moderate, DELETE needs listings.delete; INSERT stays
-- the owner's ("Users can create listings").
drop policy "Admins can manage all listings" on public.listings;
create policy "listings_staff_select" on public.listings for select to authenticated
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
create policy "listings_staff_update" on public.listings for update to authenticated
  using ((select public.caller_has_permission('listings.moderate')));
create policy "listings_staff_delete" on public.listings for delete to authenticated
  using ((select public.caller_has_permission('listings.delete')));

drop policy "Admins can manage location translations" on public.location_translations;
create policy "location_translations_staff_insert" on public.location_translations for insert to authenticated
  with check ((select public.caller_has_permission('locations.manage')));
create policy "location_translations_staff_update" on public.location_translations for update to authenticated
  using ((select public.caller_has_permission('locations.manage')));
create policy "location_translations_staff_delete" on public.location_translations for delete to authenticated
  using ((select public.caller_has_permission('locations.manage')));

drop policy "Only admins can modify locations" on public.locations;
create policy "locations_staff_insert" on public.locations for insert to authenticated
  with check ((select public.caller_has_permission('locations.manage')));
create policy "locations_staff_update" on public.locations for update to authenticated
  using ((select public.caller_has_permission('locations.manage')));
create policy "locations_staff_delete" on public.locations for delete to authenticated
  using ((select public.caller_has_permission('locations.manage')));

drop policy "Admins can manage page translations" on public.page_translations;
create policy "page_translations_staff_insert" on public.page_translations for insert to authenticated
  with check ((select public.caller_has_permission('legal.manage')));
create policy "page_translations_staff_update" on public.page_translations for update to authenticated
  using ((select public.caller_has_permission('legal.manage')));
create policy "page_translations_staff_delete" on public.page_translations for delete to authenticated
  using ((select public.caller_has_permission('legal.manage')));

-- pages: staff keep reading the unpublished pages (the public policy shows published ones only).
drop policy "Admins can manage pages" on public.pages;
create policy "pages_staff_select" on public.pages for select to authenticated
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
create policy "pages_staff_insert" on public.pages for insert to authenticated
  with check ((select public.caller_has_permission('legal.manage')));
create policy "pages_staff_update" on public.pages for update to authenticated
  using ((select public.caller_has_permission('legal.manage')));
create policy "pages_staff_delete" on public.pages for delete to authenticated
  using ((select public.caller_has_permission('legal.manage')));

-- report_actions: staff keep reading; DELETE follows reports.delete.
drop policy "report_actions_admin" on public.report_actions;
create policy "report_actions_staff_select" on public.report_actions for select to authenticated
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
create policy "report_actions_staff_insert" on public.report_actions for insert to authenticated
  with check ((select public.caller_has_permission('reports.manage')));
create policy "report_actions_staff_update" on public.report_actions for update to authenticated
  using ((select public.caller_has_permission('reports.manage')));
create policy "report_actions_staff_delete" on public.report_actions for delete to authenticated
  using ((select public.caller_has_permission('reports.delete')));

drop policy "site_settings_admin_write" on public.site_settings;
create policy "site_settings_staff_insert" on public.site_settings for insert to authenticated
  with check ((select public.caller_has_permission('settings.manage')));
create policy "site_settings_staff_update" on public.site_settings for update to authenticated
  using ((select public.caller_has_permission('settings.manage')));
create policy "site_settings_staff_delete" on public.site_settings for delete to authenticated
  using ((select public.caller_has_permission('settings.manage')));

-- support_tickets: the two policies above cover INSERT and UPDATE, support_tickets_admin_select covers reading.
drop policy "Admins can manage all tickets" on public.support_tickets;
create policy "support_tickets_staff_delete" on public.support_tickets for delete to authenticated
  using ((select public.caller_has_permission('support.manage')));

-- verification_requests: staff keep reading; every write follows users.verify.
drop policy "Admins can manage verification requests" on public.verification_requests;
create policy "verification_requests_staff_select" on public.verification_requests for select to authenticated
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
create policy "verification_requests_staff_insert" on public.verification_requests for insert to authenticated
  with check ((select public.caller_has_permission('users.verify')));
create policy "verification_requests_staff_update" on public.verification_requests for update to authenticated
  using ((select public.caller_has_permission('users.verify')));
create policy "verification_requests_staff_delete" on public.verification_requests for delete to authenticated
  using ((select public.caller_has_permission('users.verify')));

-- 3. The contact RPC that takes no caller is closed to every session (finding DB-01); the server gateway calls
--    public.get_listing_owner_contact_as with the service role after its own checks.
revoke execute on function public.get_listing_owner_contact(uuid) from authenticated, anon, public;

-- 4. users (finding DB-03). A session writes only the columns a person edits about themselves; the ten server-only columns are
--    written by the server (service role) alone. UPDATE was granted on the whole table, so the table grant goes and the
--    column grants for the other 19 columns come back (a column cannot be revoked out of a table grant).
revoke update on table public.users from authenticated;
grant update (id, name, last_name, phone, whatsapp, role, user_type, company_name, is_verified, status, block_reason,
              location_id, "position", year_started, website, deleted_at, preferred_currency, preferred_locale, suspended_until)
  on table public.users to authenticated;

-- INSERT on users is taken from authenticated on EVERY column and none is granted back (Review 3, F6 and Review 4, AC15). FACT (read-only queries, 2026-11-15): users has no permissive INSERT policy
-- (only the RESTRICTIVE blocked_account_no_insert), so row-level security refused every session INSERT, and the profile row is made by public.handle_new_user() (trigger on_auth_user_created on
-- auth.users, `on conflict (id) do nothing`). The application no longer inserts or upserts into users with a session (src/lib/auth/server.ts, src/app/auth/confirm/route.ts,
-- src/lib/auth/browser.ts), so a session insert is refused by the grant itself. The service role is not held to this grant.
revoke insert on table public.users from authenticated;

-- Each bound is equal to or looser than the application's (src/lib/security/inputs.ts, the profile and sign-up schemas):
--   name: the application stores at most 100 characters; the bound is 200 because public.handle_new_user() (the sign-up
--     trigger, Task 962) writes up to 200 and must not start to fail; last_name: 100 (MAX_PROFILE_NAME_LENGTH);
--   company_name: 200 (registerSchema); position: 200 (the application sets none);
--   website: 200 (MAX_PROFILE_WEBSITE_LENGTH) and an https address (normalizeWebsite stores only https);
--   phone, whatsapp: E.164 as isE164 reads it, one digit looser at the short end; an empty string is a number the person removed.
alter table public.users
  add constraint users_name_length_check check (name is null or char_length(name) <= 200),
  add constraint users_last_name_length_check check (last_name is null or char_length(last_name) <= 100),
  add constraint users_company_name_length_check check (company_name is null or char_length(company_name) <= 200),
  add constraint users_position_length_check check ("position" is null or char_length("position") <= 200),
  add constraint users_website_check check (website is null or (char_length(website) <= 200 and website ~ '^https://')),
  add constraint users_phone_e164_check check (phone is null or phone = '' or phone ~ '^\+[1-9][0-9]{6,14}$'),
  add constraint users_whatsapp_e164_check check (whatsapp is null or whatsapp = '' or whatsapp ~ '^\+[1-9][0-9]{6,14}$');

-- 5. An owner's edit of an ACTIVE listing is published only after staff approve it (finding DB-04, D53 / R74). The session of
--    the owner cannot change the content of an active listing; the application moves it to pending first (updateListing.ts).
--    Staff (listings.moderate), the service role and definer functions are not held to it. The comparison is over the whole
--    row, so a column added later is content by default; only the columns the server derives are left out.
create function public.listings_owner_edit_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if old.status = 'active'::public.listing_status
     and auth.uid() is not null
     and auth.uid() = old.user_id
     and not (select public.caller_has_permission('listings.moderate'))
     and (to_jsonb(new) - array['updated_at', 'search_vector', 'price_old', 'price_initial'])
         is distinct from (to_jsonb(old) - array['updated_at', 'search_vector', 'price_old', 'price_initial'])
  then
    raise exception 'an active listing is edited only through moderation' using errcode = '42501';
  end if;
  return new;
end
$$;
create trigger listings_owner_edit_moderation
  before update on public.listings
  for each row execute function public.listings_owner_edit_moderation();

-- 6. One public-listing rule (finding DB-08, D72): an active listing until its expiry, a sold or rented listing, and the
--    owner's own listing. The same rule is in visibility.ts (isListingOpenableByAddress), listingAccessState.ts and the
--    recently-viewed queries; visibility.test.ts holds the SQL text and the TypeScript table together.
alter policy "Listings viewable by everyone" on public.listings
  using ((status = 'active'::public.listing_status and expires_at > now()) or status in ('sold'::public.listing_status, 'rented'::public.listing_status) or auth.uid() = user_id);

-- 6b. The view counter asks the same rule (Review 3, F7). public.record_listing_view counted a view of an active, sold, rented or ARCHIVED listing whatever its expiry, so a listing
--     the rule above closes was still counted. Only the status condition changes: it is the table OPEN_BY_ADDRESS of src/modules/listings/lib/visibility.ts (visibility.test.ts builds
--     the condition from that table and compares the rest of the text with the live definition). Signature, attributes, owner and grants are kept by `create or replace`;
--     v8b-rollback.sql restores the live text byte for byte (the live body holds CRLF line endings: see the comment there).
create or replace function public.record_listing_view(p_listing_id uuid, p_user_id uuid default null::uuid, p_ip_hash text default ''::text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_hash text := left(coalesce(p_ip_hash, ''), 64);
begin
  -- the one rule of src/modules/listings/lib/visibility.ts (OPEN_BY_ADDRESS): an active listing until its expiry, a sold or rented one (D72); archived is not counted
  if not exists (select 1 from listings where id = p_listing_id and ((status = 'active' and expires_at > now()) or status in ('sold', 'rented'))) then return false; end if;
  if p_user_id is null and v_hash = '' then return false; end if;   -- nothing to de-duplicate by: not counted
  perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text || '|' || coalesce(p_user_id::text, 'ip:' || v_hash), 0));
  if exists (
    select 1 from listing_views
    where listing_id = p_listing_id and viewed_at >= now() - interval '24 hours'
      and ((p_user_id is not null and user_id = p_user_id) or (p_user_id is null and ip_hash = v_hash))
  ) then return false; end if;
  insert into listing_views (listing_id, user_id, ip_hash, viewed_at) values (p_listing_id, p_user_id, v_hash, now());
  update listings set views_count = views_count + 1 where id = p_listing_id;
  return true;
end $function$;

-- 7. anon writes nothing (finding DB-05): RLS already refuses it, the grant goes as well.
revoke insert, update, delete on table
  public.collection_items, public.collections, public.companies, public.currencies, public.favorite_price_alerts,
  public.favorites, public.listing_contact_events, public.listing_images, public.listing_inquiries, public.listings,
  public.locations, public.property_types, public.recently_viewed, public.site_footer, public.users
  from anon;

-- 8. The avatars bucket holds what the upload route accepts (finding DB-06): at most 2 MB, jpeg, png or webp.
update storage.buckets
  set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

-- 9. notifications: the two later policies repeat the two original ones (P-06); site_settings: "site_settings_read" repeats "site_settings_public_read" (both SELECT for public using true; audit I15, Task 956 F29).
drop policy "notifications_select" on public.notifications;
drop policy "notifications_update" on public.notifications;
drop policy "site_settings_read" on public.site_settings;

-- public.public_user_profiles is not changed: every column it lists is read by the listing page, the staff preview or the
-- contact card (see the Task 956 report), so none can leave without a change of those pages.

commit;
