-- ROLLBACK for proposed-account-deletion.sql (v4) — NOT APPLIED. Restores the audited delete rules (the seven re-created keys exactly as captured in r43-02-capture-r14.json) and drops every object
-- the deletion design created. The two updated_at triggers are not touched by the rollback (the apply enabled them again).
-- The two columns that were NOT NULL (contact_inquiry_replies.replied_by, report_actions.actor_id) get NOT NULL back only if no row has become null since: delete or fill
-- those rows first, otherwise the statement fails and the transaction rolls back (nothing is half-restored).
-- WARNING (R62 (e)): a rollback after ANY staff account has been deleted drops the <column>_name columns, which hold the ONLY name those records still carry. The kept names are lost for good;
-- take a copy of the 17 name columns first if that matters.
begin;
set local lock_timeout = '10s';
set local search_path = public, pg_temp;
-- v3 (R62 (b)): the column grants go and the table-level SELECT of anon / authenticated comes back (the captured relacl is checked below)
revoke select ("id", "title", "slug", "content", "is_published", "updated_by", "updated_at") on public.pages from anon, authenticated;
revoke select ("locale", "brand_title", "tagline", "nav_section_title", "nav_links", "info_section_title", "info_links", "social_section_title", "social_links", "copyright_template", "updated_at", "updated_by") on public.site_footer from anon, authenticated;
grant select on public.pages, public.site_footer to anon, authenticated;
drop index if exists public.companies_created_by;
alter table public.companies drop column if exists created_by;
drop trigger if exists listing_views_lower_count on public.listing_views;
drop function if exists public.lower_views_count_on_view_delete();
alter table public.listing_views drop constraint "listing_views_user_id_fkey", add constraint "listing_views_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
alter table public.listing_contact_events drop constraint "listing_contact_events_actor_user_id_fkey", add constraint "listing_contact_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
-- contact_inquiries.handled_by was SET NULL already
alter table public.contact_inquiry_replies drop constraint "contact_inquiry_replies_replied_by_fkey", add constraint "contact_inquiry_replies_replied_by_fkey" FOREIGN KEY (replied_by) REFERENCES auth.users(id);
alter table public.contact_inquiry_replies alter column "replied_by" set not null;
alter table public.email_templates drop constraint "email_templates_updated_by_fkey", add constraint "email_templates_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);
-- history_clear_events.actor_user_id was SET NULL already
-- pages.updated_by was SET NULL already
alter table public.report_actions drop constraint "report_actions_actor_id_fkey", add constraint "report_actions_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES users(id);
alter table public.report_actions alter column "actor_id" set not null;
-- role_permission_events.actor_user_id was SET NULL already
-- role_permissions.updated_by_user_id was SET NULL already
-- site_footer.updated_by was SET NULL already
-- support_ticket_events.actor_user_id was SET NULL already
-- support_tickets.assigned_to was SET NULL already
-- support_tickets.created_by_admin_id was SET NULL already
alter table public.user_change_log drop constraint "user_change_log_changed_by_fkey", add constraint "user_change_log_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES users(id);
alter table public.user_status_history drop constraint "user_status_history_changed_by_fkey", add constraint "user_status_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES users(id);
-- verification_requests.reviewed_by was SET NULL already
drop trigger if exists contact_inquiries_handled_by_name on public.contact_inquiries;
alter table public.contact_inquiries drop column if exists "handled_by_name";
drop trigger if exists contact_inquiry_replies_replied_by_name on public.contact_inquiry_replies;
alter table public.contact_inquiry_replies drop column if exists "replied_by_name";
drop trigger if exists email_templates_updated_by_name on public.email_templates;
alter table public.email_templates drop column if exists "updated_by_name";
drop trigger if exists history_clear_events_actor_user_id_name on public.history_clear_events;
alter table public.history_clear_events drop column if exists "actor_user_id_name";
drop trigger if exists pages_updated_by_name on public.pages;
alter table public.pages drop column if exists "updated_by_name";
drop trigger if exists report_actions_actor_id_name on public.report_actions;
alter table public.report_actions drop column if exists "actor_id_name";
drop trigger if exists role_permission_events_actor_user_id_name on public.role_permission_events;
alter table public.role_permission_events drop column if exists "actor_user_id_name";
drop trigger if exists role_permissions_updated_by_user_id_name on public.role_permissions;
alter table public.role_permissions drop column if exists "updated_by_user_id_name";
drop trigger if exists site_footer_updated_by_name on public.site_footer;
alter table public.site_footer drop column if exists "updated_by_name";
drop trigger if exists support_ticket_events_actor_user_id_name on public.support_ticket_events;
alter table public.support_ticket_events drop column if exists "actor_user_id_name";
drop trigger if exists support_tickets_assigned_to_name on public.support_tickets;
alter table public.support_tickets drop column if exists "assigned_to_name";
drop trigger if exists support_tickets_created_by_admin_id_name on public.support_tickets;
alter table public.support_tickets drop column if exists "created_by_admin_id_name";
drop trigger if exists user_change_log_changed_by_name on public.user_change_log;
alter table public.user_change_log drop column if exists "changed_by_name";
drop trigger if exists user_status_history_changed_by_name on public.user_status_history;
alter table public.user_status_history drop column if exists "changed_by_name";
drop trigger if exists verification_requests_reviewed_by_name on public.verification_requests;
alter table public.verification_requests drop column if exists "reviewed_by_name";
drop trigger if exists listing_reports_user_id_name on public.listing_reports;
alter table public.listing_reports drop column if exists "user_id_name";
drop trigger if exists support_tickets_reported_user_id_name on public.support_tickets;
alter table public.support_tickets drop column if exists "reported_user_id_name";
drop function if exists public.set_actor_name();
drop function if exists public.account_display_name(uuid);
-- the restored keys are the captured ones
do $chk$
declare
  want_def text[][] := array[
    ['contact_inquiry_replies', 'contact_inquiry_replies_replied_by_fkey', 'FOREIGN KEY (replied_by) REFERENCES auth.users(id)'],
    ['email_templates', 'email_templates_updated_by_fkey', 'FOREIGN KEY (updated_by) REFERENCES auth.users(id)'],
    ['report_actions', 'report_actions_actor_id_fkey', 'FOREIGN KEY (actor_id) REFERENCES users(id)'],
    ['user_change_log', 'user_change_log_changed_by_fkey', 'FOREIGN KEY (changed_by) REFERENCES users(id)'],
    ['user_status_history', 'user_status_history_changed_by_fkey', 'FOREIGN KEY (changed_by) REFERENCES users(id)'],
    ['listing_views', 'listing_views_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'],
    ['listing_contact_events', 'listing_contact_events_actor_user_id_fkey', 'FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL']
  ];
  i int;
  have_def text;
begin
  for i in 1 .. array_length(want_def, 1) loop
    select pg_get_constraintdef(c.oid) into have_def from pg_constraint c where c.conrelid = ('public.' || want_def[i][1])::regclass and c.conname = want_def[i][2];
    if have_def is distinct from want_def[i][3] then
      raise exception 'rollback check failed: %.% is defined as % (captured %)', want_def[i][1], want_def[i][2], coalesce(have_def, 'missing'), want_def[i][3];
    end if;
  end loop;
end $chk$;
-- v3 (R62 (b)): the table-level ACL of both tables is the captured one again and no column-level ACL is left
do $chk2$
begin
  if (select c.relacl::text from pg_class c where c.oid = 'public.pages'::regclass) is distinct from '{postgres=arwdDxtm/postgres,anon=rm/postgres,authenticated=rm/postgres,service_role=arwdDxtm/postgres}' then
    raise exception 'rollback check failed: the table-level ACL of public.pages is not the captured one';
  end if;
  if exists (select 1 from pg_attribute a where a.attrelid = 'public.pages'::regclass and a.attnum > 0 and not a.attisdropped and a.attacl is not null) then
    raise exception 'rollback check failed: public.pages still has a column-level ACL';
  end if;
  if (select c.relacl::text from pg_class c where c.oid = 'public.site_footer'::regclass) is distinct from '{postgres=arwdDxtm/postgres,anon=arwdxtm/postgres,authenticated=arwdxtm/postgres,service_role=arwdDxtm/postgres}' then
    raise exception 'rollback check failed: the table-level ACL of public.site_footer is not the captured one';
  end if;
  if exists (select 1 from pg_attribute a where a.attrelid = 'public.site_footer'::regclass and a.attnum > 0 and not a.attisdropped and a.attacl is not null) then
    raise exception 'rollback check failed: public.site_footer still has a column-level ACL';
  end if;
end $chk2$;
notify pgrst, 'reload schema';
commit;
