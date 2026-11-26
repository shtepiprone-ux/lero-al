-- Task 988: the way back from task988.sql. It restores the body of public.handle_new_user() that task988.sql replaced (task962/v8b2.sql, the live body read on 2026-11-26), so a new account
-- gets the column default 'sq' again. The profile rows created while task988.sql was applied keep the language they got. One transaction; run it only after task988.sql.
-- After it, row 1 of task988-preflight.sql counts 0 problems again (the body is compared without carriage returns).
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
begin
  if new.raw_user_meta_data->>'user_type' = 'agent' then v_type := 'agent'; end if;   -- the only choice a sign-up form offers
  if v_avatar is not null and not (starts_with(v_avatar, 'https://res.cloudinary.com/die7okukn/') or starts_with(v_avatar, 'https://lh3.googleusercontent.com/')) then v_avatar := null; end if;   -- the value is rendered in <img src>: only the two hosts of users_avatar_url_prefix_check
  insert into public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 200),
    left(new.raw_user_meta_data->>'phone', 32),
    left(v_avatar, 2000),
    'user'::user_role,                       -- never from metadata: administrators are made by an administrator with service_role
    v_type,
    false,
    now()
  )
  on conflict (id) do nothing;
  return new;
end $function$;

commit;
