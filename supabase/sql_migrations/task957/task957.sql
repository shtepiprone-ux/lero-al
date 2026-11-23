-- Task 957: the shared sliding limiter (O957-1) and the database twin of the photo check (a listing photo lies in the listing owner's folder).
-- One transaction; every object is schema-qualified. Run task957-preflight.sql first (its row must say 0); after the apply run task957-verify.sql (every row ok = true). The way back is
-- task957-rollback.sql; scripts/quality/db-sql-roundtrip.mjs proves that the catalog after the rollback equals the one before this file.
begin;

-- 1. The hits of the limiter. Row level security is on and there is no policy and no grant for a session, so the table can be read and written by the service role (and the function below) only.
create table public.rate_limit_hits (
  bucket text not null,
  subject text not null,
  hit_at timestamptz not null default now()
);
create index rate_limit_hits_key_idx on public.rate_limit_hits (bucket, subject, hit_at);
alter table public.rate_limit_hits enable row level security;
revoke all on table public.rate_limit_hits from public, anon, authenticated;

-- 2. The sliding limiter. It answers true and records a hit only when fewer than max_hits hits of the key lie inside the last window_seconds. The advisory lock on the key makes the count
--    and the insert one step for parallel callers; the lock is released at the end of the transaction. No dynamic SQL: the arguments are bound values. SECURITY DEFINER with an empty
--    search_path; only the service role can execute it (the application calls it from the server, after its own caller checks).
--    `#variable_conflict use_variable`: a bare `bucket`, `subject`, `window_seconds` or `max_hits` is the argument; the columns are always written with the alias h.
create function public.consume_rate_limit(bucket text, subject text, window_seconds integer, max_hits integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  v_key text := bucket || E'\x1f' || subject;
  v_count integer;
begin
  if window_seconds is null or window_seconds < 1 or window_seconds > 604800 then
    raise exception 'consume_rate_limit: window_seconds must be between 1 and 604800' using errcode = '22023';
  end if;
  if max_hits is null or max_hits < 1 then
    raise exception 'consume_rate_limit: max_hits must be at least 1' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  -- this key's hits that left the window, and any hit older than 7 days (the longest window is 7 days)
  delete from public.rate_limit_hits h
    where h.bucket = bucket and h.subject = subject and h.hit_at < now() - make_interval(secs => window_seconds);
  delete from public.rate_limit_hits h
    where h.hit_at < now() - interval '7 days';
  select count(*) into v_count from public.rate_limit_hits h
    where h.bucket = bucket and h.subject = subject;
  if v_count >= max_hits then
    return false;
  end if;
  insert into public.rate_limit_hits (bucket, subject, hit_at) values (bucket, subject, now());
  return true;
end
$$;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

-- 3. A listing photo lies in its OWNER's folder: `/<cloud>/image/upload/[v<digits>/]<listings.user_id>/listings/<name>`. The same rule as src/lib/uploads/imageUrl.ts
--    (isOwnedListingImageUrl): no `.` or `..` segment, no encoded dot, slash or backslash, no backslash, no query, no fragment. The cloud itself stays pinned by the CHECK listing_images_url_prefix_check. SECURITY DEFINER so that the
--    owner of the listing is read whoever writes (a session cannot read every listing); it checks the row, so the service role is held to it too. Refused with 42501.
create function public.listing_images_owner_folder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_path text;
begin
  select l.user_id into v_owner from public.listings l where l.id = new.listing_id;
  if v_owner is null then
    raise exception 'listing_images: the listing has no owner' using errcode = '42501';
  end if;
  v_path := substring(new.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$');
  if v_path is null
     or position(v_owner::text || '/listings/' in v_path) <> 1
     or v_path = v_owner::text || '/listings/'
     or v_path ~ '(^|/)\.\.?(/|$)'
     or new.url ~* '%2e|%2f|%5c'
     or new.url ~ '[?#]'
     or position(chr(92) in new.url) > 0 then
    raise exception 'listing_images: the photo must lie in the folder of the listing owner' using errcode = '42501';
  end if;
  return new;
end
$$;
revoke all on function public.listing_images_owner_folder() from public, anon, authenticated;
create trigger listing_images_owner_folder
  before insert or update of url, listing_id on public.listing_images
  for each row execute function public.listing_images_owner_folder();

commit;
