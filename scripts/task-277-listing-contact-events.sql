-- Task 277: listing_contact_events table + RLS
-- Run this in Supabase Dashboard → SQL Editor before deploying.

-- Table
create table public.listing_contact_events (
  id               uuid         primary key default gen_random_uuid(),
  listing_id       uuid         not null references public.listings(id) on delete cascade,
  listing_owner_id uuid         not null references public.users(id) on delete cascade,
  actor_user_id    uuid         references public.users(id) on delete set null,
  channel          text         not null check (channel in ('whatsapp')),
  source           text         not null,
  locale           text,
  is_owner_click   boolean      not null default false,
  created_at       timestamptz  not null default now()
);

alter table public.listing_contact_events enable row level security;

-- GRANTs (canonical public-schema discipline — Task 275 pattern)
grant select                           on public.listing_contact_events to anon;
grant select, insert                   on public.listing_contact_events to authenticated;
grant select, insert, update, delete   on public.listing_contact_events to service_role;

-- Policies
create policy "events_insert_anon" on public.listing_contact_events
  for insert to anon
  with check (actor_user_id is null);

create policy "events_insert_authenticated" on public.listing_contact_events
  for insert to authenticated
  with check (actor_user_id = auth.uid());

create policy "events_select_owner" on public.listing_contact_events
  for select to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_contact_events.listing_id
        and l.user_id = auth.uid()
    )
  );

-- Indexes for future analytics page
create index listing_contact_events_listing_created_idx
  on public.listing_contact_events (listing_id, created_at desc);

create index listing_contact_events_owner_created_idx
  on public.listing_contact_events (listing_owner_id, created_at desc);

notify pgrst, 'reload schema';
