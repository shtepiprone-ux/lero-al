-- Task 988 (owner decision O988-3): a new account keeps the language it signed up in. The sign-up form sends `preferred_locale` in the metadata (AuthSheet.tsx, signupMetadata.ts), but the
-- sign-up trigger inserted no `preferred_locale`, so every new profile row got the column default 'sq'. Written against the live body (pg_get_functiondef, read-only, 2026-11-26), which is the
-- body of task962/v8b2.sql, with ONE change: `preferred_locale` is inserted from `raw_user_meta_data->>'preferred_locale'` when it is one of sq, en, uk, it, else 'sq' (the value is chosen by the
-- browser at sign-up: it is only compared with four literals, never used as SQL). No existing row is changed. `create or replace` keeps the owner, the grants (postgres and service_role
-- execute) and the trigger; security definer and the search path are written as they are.
-- One transaction. Run task988-preflight.sql first (every row must count 0 problems); after the apply run task988-verify.sql (every row ok = true). The way back is task988-rollback.sql.
begin;

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_type user_type := 'private';
  v_avatar text := new.raw_user_meta_data->>'avatar_url';
  v_locale text := new.raw_user_meta_data->>'preferred_locale';
begin
  if new.raw_user_meta_data->>'user_type' = 'agent' then v_type := 'agent'; end if;   -- the only choice a sign-up form offers
  if v_avatar is not null and not (starts_with(v_avatar, 'https://res.cloudinary.com/die7okukn/') or starts_with(v_avatar, 'https://lh3.googleusercontent.com/')) then v_avatar := null; end if;   -- the value is rendered in <img src>: only the two hosts of users_avatar_url_prefix_check
  if v_locale is null or v_locale not in ('sq', 'en', 'uk', 'it') then v_locale := 'sq'; end if;   -- Task 988: the sign-up language, only one of the four codes of users_preferred_locale_check
  insert into public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at, preferred_locale)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 200),
    left(new.raw_user_meta_data->>'phone', 32),
    left(v_avatar, 2000),
    'user'::user_role,                       -- never from metadata: administrators are made by an administrator with service_role
    v_type,
    false,
    now(),
    v_locale
  )
  on conflict (id) do nothing;
  return new;
end $function$;

commit;
