-- Task 956 Part B: the way back from v8b.sql. It restores every object v8b.sql changes to the definition the live catalog
-- held on 2026-11-15 (read by scripts/quality/db-catalog-audit.mjs), in the reverse order. One transaction; run it only
-- after v8b.sql. scripts/quality/db-sql-roundtrip.mjs proves that the catalog after the rollback equals the one before
-- v8b.sql. The permission function goes last, after every policy that calls it is gone.
begin;

-- 9. notifications: the two policies come back as they were; site_settings_read as the live catalog of 2026-11-16 holds it (db-catalog-audit.mjs --save: PERMISSIVE, roles {public}, cmd SELECT, qual true, no with_check).
create policy "notifications_select" on public.notifications for select to public
  using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update to public
  using (user_id = auth.uid());
create policy "site_settings_read" on public.site_settings for select to public
  using (true);

-- 8. avatars bucket: no limit, no type list.
update storage.buckets
  set file_size_limit = null, allowed_mime_types = null
  where id = 'avatars';

-- 7. anon holds the three write grants again.
grant insert, update, delete on table
  public.collection_items, public.collections, public.companies, public.currencies, public.favorite_price_alerts,
  public.favorites, public.listing_contact_events, public.listing_images, public.listing_inquiries, public.listings,
  public.locations, public.property_types, public.recently_viewed, public.site_footer, public.users
  to anon;

-- 6b. the view counter as it was: the live definition of 2026-11-15, read with pg_get_functiondef (it counted archived listings and ignored the expiry); the block after the statement
--     makes the stored text equal the live text byte for byte. `create or replace` keeps the owner and the grants (postgres, service_role).
create or replace function public.record_listing_view(p_listing_id uuid, p_user_id uuid default null::uuid, p_ip_hash text default ''::text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_hash text := left(coalesce(p_ip_hash, ''), 64);
begin
  -- same statuses as the view route (src/app/api/listings/[slug]/view/route.ts)
  if not exists (select 1 from listings where id = p_listing_id and status in ('active', 'sold', 'rented', 'archived')) then return false; end if;
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
-- Review 4, F12. FACT, read-only query on the live project on 2026-11-15:
--     select md5(prosrc), position(E'\r' in prosrc) > 0, length(prosrc) from pg_proc where oid = 'public.record_listing_view(uuid,uuid,text)'::regprocedure
--     -> 7d50dca26919d2465d99cdf188b8a973 | true | 1026
--   and, read on the same row: 16 CR (length(prosrc) - length(replace(prosrc, E'\r', ''))), 16 LF (the same with E'\n'), every LF after a CR, a body that begins with CR LF and ends with "end ".
-- So the text to restore has CRLF line endings. The statement above stores the body with the line endings of THIS FILE: LF when the file has LF (the file as committed), CRLF when it has CRLF (a checkout
-- with autocrlf). The block below makes the result the same for both: it takes the definition Postgres stores, removes every CR, turns every LF into CR LF (removing first, so a file with CRLF does not
-- end with CR CR LF), and executes it again. The stored body is then CRLF throughout: md5 7d50dca26919d2465d99cdf188b8a973, length 1026 (src/tests/__tests__/v8bSql.test.ts computes both from this file
-- as LF and as CRLF). The header lines of the definition are rewritten with CRLF too; INFERENCE: the parser reads them as white space, and scripts/quality/db-sql-roundtrip.mjs (functionDefs compares
-- pg_get_functiondef before the change and after this file) is the proof that decides.
do $$
begin
  execute replace(replace(pg_catalog.pg_get_functiondef('public.record_listing_view(uuid, uuid, text)'::pg_catalog.regprocedure), E'\r', ''), E'\n', E'\r\n');
end
$$;

-- 6. the public-listing rule as it was.
alter policy "Listings viewable by everyone" on public.listings
  using (status = any (array['active'::public.listing_status, 'sold'::public.listing_status, 'rented'::public.listing_status]) or auth.uid() = user_id);

-- 5. no moderation trigger.
drop trigger listings_owner_edit_moderation on public.listings;
drop function public.listings_owner_edit_moderation();

-- 4. users: no bound, the table-wide UPDATE and INSERT grants (v8b.sql grants no INSERT column, so nothing is revoked before the table-wide grant comes back).
alter table public.users
  drop constraint users_name_length_check,
  drop constraint users_last_name_length_check,
  drop constraint users_company_name_length_check,
  drop constraint users_position_length_check,
  drop constraint users_website_check,
  drop constraint users_phone_e164_check,
  drop constraint users_whatsapp_e164_check;
revoke update (id, name, last_name, phone, whatsapp, role, user_type, company_name, is_verified, status, block_reason,
               location_id, "position", year_started, website, deleted_at, preferred_currency, preferred_locale, suspended_until)
  on table public.users from authenticated;
grant update on table public.users to authenticated;
grant insert on table public.users to authenticated;

-- 3. the contact RPC is executable by a signed-in session again.
grant execute on function public.get_listing_owner_contact(uuid) to authenticated;

-- 2b. the ALL policies come back, the per-command ones go.
drop policy "verification_requests_staff_select" on public.verification_requests;
drop policy "verification_requests_staff_insert" on public.verification_requests;
drop policy "verification_requests_staff_update" on public.verification_requests;
drop policy "verification_requests_staff_delete" on public.verification_requests;
create policy "Admins can manage verification requests" on public.verification_requests for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "support_tickets_staff_delete" on public.support_tickets;
create policy "Admins can manage all tickets" on public.support_tickets for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "site_settings_staff_insert" on public.site_settings;
drop policy "site_settings_staff_update" on public.site_settings;
drop policy "site_settings_staff_delete" on public.site_settings;
create policy "site_settings_admin_write" on public.site_settings for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "report_actions_staff_select" on public.report_actions;
drop policy "report_actions_staff_insert" on public.report_actions;
drop policy "report_actions_staff_update" on public.report_actions;
drop policy "report_actions_staff_delete" on public.report_actions;
create policy "report_actions_admin" on public.report_actions for all to authenticated
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "pages_staff_select" on public.pages;
drop policy "pages_staff_insert" on public.pages;
drop policy "pages_staff_update" on public.pages;
drop policy "pages_staff_delete" on public.pages;
create policy "Admins can manage pages" on public.pages for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "page_translations_staff_insert" on public.page_translations;
drop policy "page_translations_staff_update" on public.page_translations;
drop policy "page_translations_staff_delete" on public.page_translations;
create policy "Admins can manage page translations" on public.page_translations for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "locations_staff_insert" on public.locations;
drop policy "locations_staff_update" on public.locations;
drop policy "locations_staff_delete" on public.locations;
create policy "Only admins can modify locations" on public.locations for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "location_translations_staff_insert" on public.location_translations;
drop policy "location_translations_staff_update" on public.location_translations;
drop policy "location_translations_staff_delete" on public.location_translations;
create policy "Admins can manage location translations" on public.location_translations for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "listings_staff_select" on public.listings;
drop policy "listings_staff_update" on public.listings;
drop policy "listings_staff_delete" on public.listings;
create policy "Admins can manage all listings" on public.listings for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "listing_reports_staff_insert" on public.listing_reports;
drop policy "listing_reports_staff_delete" on public.listing_reports;
create policy "Admins can manage reports" on public.listing_reports for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "amenity_translations_staff_insert" on public.amenity_translations;
drop policy "amenity_translations_staff_update" on public.amenity_translations;
drop policy "amenity_translations_staff_delete" on public.amenity_translations;
create policy "Admins can manage amenity translations" on public.amenity_translations for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

drop policy "amenities_staff_insert" on public.amenities;
drop policy "amenities_staff_update" on public.amenities;
drop policy "amenities_staff_delete" on public.amenities;
create policy "Only admins can manage amenities" on public.amenities for all to public
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

-- 2a. the policies of one command ask for the role again, not the key.
alter policy "support_tickets_admin_update" on public.support_tickets
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "support_tickets_admin_insert" on public.support_tickets
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "ste_admin_insert" on public.support_ticket_events
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "listing_reports_admin_update" on public.listing_reports
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "email_templates_update" on public.email_templates
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "email_templates_insert" on public.email_templates
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "contact_inquiry_replies_moderator_insert" on public.contact_inquiry_replies
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "contact_inquiries_moderator_update" on public.contact_inquiries
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "companies_admin_delete" on public.companies
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));
alter policy "companies_admin_update" on public.companies
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = any (array['admin'::public.user_role, 'moderator'::public.user_role])));

-- 1. no permission function (no policy or trigger calls it any more).
drop function public.caller_has_permission(text);

-- 0. the data step of v8b.sql (users.website with no scheme) is NOT undone: this file does not know the old value, and the new value (https://<host>/…) is a valid address
--    that needs no CHECK to be valid. The rows the step changed stay as v8b.sql wrote them.

commit;
