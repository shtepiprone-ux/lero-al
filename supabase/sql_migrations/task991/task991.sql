-- Task 991: (1) public.auth_password_matches, the one password check outside Supabase Auth, (2) public.account_status_by_email, the one exact-address lookup of an account (Revision 1, F1), and (3) the two sq e-mail templates of the "an account already exists" and "the account is blocked" notices.
-- One transaction. Run task991-preflight.sql first (every row must say 0); after the apply run task991-verify.sql (every row ok = true). The way back is task991-rollback.sql.
begin;

-- 1. The password check. Supabase Auth refuses a banned account with `user_banned` BEFORE it checks the password, so the sign-in sheet cannot tell a blocked person from a stranger. The server action
--    explainRefusedSignIn calls this function (service role only), after a fresh Turnstile token and the `blocked_signin` limit, and only a caller that proves the password is told the account is blocked.
--    It answers true only when the password matches the stored hash of the ONE auth.users row of the lower-cased address; for an unknown address, a deleted account, an account with no password (Google only) or an
--    input of the wrong shape it runs one dummy hash of the same cost, so the time does not show whether the address exists. It writes nothing, never creates a session and raises nothing: a failure inside
--    answers false, so no error text can carry an argument. SECURITY DEFINER with an empty search_path (pgcrypto lives in the `extensions` schema); executable by the service role only.
create function public.auth_password_matches(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if p_email is null or p_password is null or length(p_email) > 254 or length(p_password) > 1024 then
    perform extensions.crypt('x', extensions.gen_salt('bf', 10));
    return false;
  end if;
  select u.encrypted_password into v_hash
    from auth.users u
    where lower(u.email) = lower(p_email) and u.deleted_at is null
    limit 1;
  if v_hash is null or v_hash = '' then
    perform extensions.crypt(p_password, extensions.gen_salt('bf', 10));
    return false;
  end if;
  return extensions.crypt(p_password, v_hash) = v_hash;
exception when others then
  return false;
end
$$;
revoke all on function public.auth_password_matches(text, text) from public, anon, authenticated;
grant execute on function public.auth_password_matches(text, text) to service_role;

-- 2. The account lookup (Revision 1, F1). The auth actions used to find the account of an address through the admin panel's search (`admin_search_users_by_email`: `ILIKE '%' || q || '%' LIMIT 100`) and then one Auth admin call
--    per candidate: a wildcard search with up to 100 calls for one request, before any human check. This function answers from ONE exact match, `lower(u.email) = lower(p_email)` (no LIKE: `%` and `_` are ordinary
--    characters), with the status and the end date of the suspension of the profile row. Deleted accounts are not found. At most one row: an address held by two rows that differ only in letter case gives the
--    older one, so the answer never depends on the order the database happens to read. It writes nothing and builds no dynamic SQL. SECURITY DEFINER with an empty search_path; executable by the service role only.
--    The types are those the database has: auth.users.id uuid, auth.users.email varchar (cast to text), public.users.status text, public.users.suspended_until timestamptz.
create function public.account_status_by_email(p_email text)
returns table (id uuid, email text, status text, suspended_until timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.status, p.suspended_until
    from auth.users u
    join public.users p on p.id = u.id
    where lower(u.email) = lower(p_email) and u.deleted_at is null
    order by u.created_at, u.id
    limit 1
$$;
revoke all on function public.account_status_by_email(text) from public, anon, authenticated;
grant execute on function public.account_status_by_email(text) to service_role;

-- 3. The two notices, in Albanian only (Task 251: every administrator e-mail is sent in sq). Same shape as the existing keys: inner HTML only (sendTemplatedEmail wraps it in the brand frame), `variables` a jsonb array of the
--    placeholder names, the subject plain text. A row that already exists is left as it is (the administrator may have edited it): this file never overwrites a template.
--    account_exists  {{signInUrl}}: the sign-in page of the site; the text names "Harruat fjalëkalimin?" because no link opens that view directly.
--    account_blocked {{supportUrl}}: the contact page; {{untilText}}: " deri më <date>" for a dated suspension, empty otherwise.
insert into public.email_templates (id, key, locale, subject, html_body, variables, is_active, created_at, updated_at)
select gen_random_uuid(), v.key, v.locale, v.subject, v.html_body, v.variables, true, now(), now()
from (values
  ('account_exists', 'sq', 'Keni tashmë një llogari në Lero.al',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Keni tashmë një llogari</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">Dikush u përpoq të regjistrohej në Lero.al me këtë adresë emaili, por ajo ka tashmë një llogari. Nëse jeni ju, nuk keni nevojë të regjistroheni përsëri: hyni në llogarinë tuaj.</p>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">Nëse e keni harruar fjalëkalimin, në dritaren e hyrjes zgjidhni “Harruat fjalëkalimin?” dhe ndiqni udhëzimet.</p>
<p style="margin:0 0 20px;">
  <a href="{{signInUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Hyr në llogari</a>
</p>
<p style="font-size:13px;color:#71717a;line-height:1.6;margin:0;">Nëse nuk jeni ju, mund ta shpërfillni këtë email: llogaria juaj nuk ka ndryshuar.</p>',
   '["signInUrl"]'::jsonb),
  ('account_blocked', 'sq', 'Llogaria juaj në Lero.al është e bllokuar',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Llogaria juaj është e bllokuar</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">Llogaria me këtë adresë emaili në Lero.al është e bllokuar{{untilText}}, ndaj nuk mund të hyni në të dhe lidhja për ndryshimin e fjalëkalimit nuk do të funksiononte.</p>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">Për të marrë vesh pse u bllokua dhe si të rifitoni qasjen, na shkruani.</p>
<p style="margin:0 0 20px;">
  <a href="{{supportUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Kontaktoni mbështetjen</a>
</p>
<p style="font-size:13px;color:#71717a;line-height:1.6;margin:0;">Nëse nuk jeni ju që e kërkuat këtë email, mund ta shpërfillni.</p>',
   '["supportUrl", "untilText"]'::jsonb)
) as v(key, locale, subject, html_body, variables)
where not exists (select 1 from public.email_templates t where t.key = v.key and t.locale = v.locale);

commit;
