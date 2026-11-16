-- Task 956 Part B: the read-only check before v8b.sql. One statement, no write. Each row counts what v8b.sql would refuse, hide,
-- or fail on; ANY row from 1 to 14 with problems > 0 stops the apply (the owner decides what to do with those rows, never the file).
-- Row 15 is not a problem: it counts the rows the data step of v8b.sql (step 0) rewrites, so the owner knows what the apply changes (the live value on 2026-11-15: 1).
-- Rows 5 and 15 read users.website as the data step will leave it: the same condition and the same value as v8b.sql step 0.
select n, check_name, problems
from (
  -- the rows each new CHECK on public.users would refuse
  select 1 as n, 'users.name longer than 200 characters' as check_name,
         (select count(*) from public.users where char_length(name) > 200) as problems
  union all select 2, 'users.last_name longer than 100 characters',
         (select count(*) from public.users where char_length(last_name) > 100)
  union all select 3, 'users.company_name longer than 200 characters',
         (select count(*) from public.users where char_length(company_name) > 200)
  union all select 4, 'users.position longer than 200 characters',
         (select count(*) from public.users where char_length("position") > 200)
  -- a website with no scheme is fixed by the data step; this row counts what the CHECK would STILL refuse after it (another scheme, http://, a value that is not a host, over 200 characters)
  union all select 5, 'users.website that the data step cannot fix (after it: not an https address of at most 200 characters)',
         (select count(*) from (
            select case when website is not null and website !~* '^[a-z][a-z0-9+.-]*:' and website ~ '^[^\s/?#:@]+\.[^\s/?#@]+' and website !~ '[[:cntrl:][:space:]]' and website !~ '^[^/?#]*[@\\]'
                        then 'https://' || lower(substring(website from '^[^/?#]*'))
                             || case when substring(website from '^[^/?#]*(.*)$') ~ '^([?#]|$)' then '/' else '' end
                             || substring(website from '^[^/?#]*(.*)$')
                        else website end as new_website
            from public.users where website is not null) s
          where not (char_length(new_website) <= 200 and new_website ~ '^https://'))
  union all select 6, 'users.phone that is not E.164 (an empty string passes)',
         (select count(*) from public.users where phone is not null and phone <> '' and phone !~ '^\+[1-9][0-9]{6,14}$')
  union all select 7, 'users.whatsapp that is not E.164 (an empty string passes)',
         (select count(*) from public.users where whatsapp is not null and whatsapp <> '' and whatsapp !~ '^\+[1-9][0-9]{6,14}$')
  -- the rows the one public rule hides although the current policy shows them
  union all select 8, 'active listings with no expiry or an expiry in the past (the new rule hides them)',
         (select count(*) from public.listings where status = 'active'::public.listing_status and (expires_at is null or expires_at <= now()))
  -- a key a policy asks for with no moderator row is off for every moderator, silently
  union all select 9, 'permission keys the policies ask for that have no moderator row in role_permissions',
         (select count(*) from (values ('listings.moderate'), ('listings.delete'), ('legal.manage'), ('locations.manage'), ('catalog.manage'),
                                       ('reports.manage'), ('reports.delete'), ('settings.manage'), ('support.manage'), ('users.verify'),
                                       ('companies.manage'), ('email_templates.manage'), ('inquiries.manage')) k(key)
          where not exists (select 1 from public.role_permissions rp where rp.role = 'moderator' and rp.permission_key = k.key))
  -- every policy v8b.sql alters or drops must exist exactly once, or the file fails half way
  union all select 10, 'policies v8b.sql changes that are missing or not unique',
         (select count(*) from (values
            ('companies', 'companies_admin_update'), ('companies', 'companies_admin_delete'),
            ('contact_inquiries', 'contact_inquiries_moderator_update'), ('contact_inquiry_replies', 'contact_inquiry_replies_moderator_insert'),
            ('email_templates', 'email_templates_insert'), ('email_templates', 'email_templates_update'),
            ('listing_reports', 'listing_reports_admin_update'), ('support_ticket_events', 'ste_admin_insert'),
            ('support_tickets', 'support_tickets_admin_insert'), ('support_tickets', 'support_tickets_admin_update'),
            ('amenities', 'Only admins can manage amenities'), ('amenity_translations', 'Admins can manage amenity translations'),
            ('listing_reports', 'Admins can manage reports'), ('listings', 'Admins can manage all listings'),
            ('location_translations', 'Admins can manage location translations'), ('locations', 'Only admins can modify locations'),
            ('page_translations', 'Admins can manage page translations'), ('pages', 'Admins can manage pages'),
            ('report_actions', 'report_actions_admin'), ('site_settings', 'site_settings_admin_write'),
            ('support_tickets', 'Admins can manage all tickets'), ('verification_requests', 'Admins can manage verification requests'),
            ('listings', 'Listings viewable by everyone'), ('notifications', 'notifications_select'), ('notifications', 'notifications_update')
          ) v(tbl, pol)
          where (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = v.tbl and p.policyname = v.pol) <> 1)
  -- nothing v8b.sql creates may exist yet
  union all select 11, 'policies named like the ones v8b.sql creates (_staff_) that already exist',
         (select count(*) from pg_policies where schemaname = 'public' and policyname ~ '_staff_(select|insert|update|delete)$')
  union all select 12, 'functions v8b.sql creates that already exist',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname in ('caller_has_permission', 'listings_owner_edit_moderation'))
  union all select 13, 'the moderation trigger or one of the seven users constraints already exists',
         (select count(*) from pg_trigger where tgname = 'listings_owner_edit_moderation' and not tgisinternal)
         + (select count(*) from pg_constraint where conrelid = 'public.users'::regclass
            and conname in ('users_name_length_check', 'users_last_name_length_check', 'users_company_name_length_check', 'users_position_length_check',
                            'users_website_check', 'users_phone_e164_check', 'users_whatsapp_e164_check'))
  -- what v8b.sql relies on must exist
  -- record_listing_view is replaced with `create or replace`: were it missing, the statement would create it with the default grants (executable by every role)
  union all select 14, 'functions and the bucket v8b.sql relies on that are missing',
         (4 - (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and ((p.proname in ('caller_is_admin', 'caller_is_active') and p.pronargs = 0)
                                              or (p.proname = 'get_listing_owner_contact' and p.pronargs = 1)
                                              or (p.proname = 'record_listing_view' and p.pronargs = 3))))
         + (1 - (select count(*) from storage.buckets where id = 'avatars'))
  -- not a problem: the rows the data step of v8b.sql (step 0) rewrites
  union all select 15, 'users.website rows the data step changes (informational, not a problem: the live value on 2026-11-15 is 1)',
         (select count(*) from public.users
          where website is not null and website !~* '^[a-z][a-z0-9+.-]*:' and website ~ '^[^\s/?#:@]+\.[^\s/?#@]+' and website !~ '[[:cntrl:][:space:]]' and website !~ '^[^/?#]*[@\\]')
) checks
order by n;
