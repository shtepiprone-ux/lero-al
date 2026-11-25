-- Task 1044: mail to support@ and sales@ is stored as an inquiry, or as an answer in the thread of its inquiry, by the route /api/email/inbound (service role only).
-- One transaction. Run task1044-preflight.sql first (every row must say 0); after the apply run task1044-verify.sql (every row ok = true). The way back is task1044-rollback.sql.
-- No grant and no policy changes: anon and authenticated keep no read or write on either table; only the service role writes, as before.
-- Every new column has a default or is nullable, so the existing rows and the existing writes (the contact form, a staff reply) keep working unchanged.
begin;

-- 1. contact_inquiries: where the inquiry came from (the form, or a received mail), the Message-ID of that mail, and the names, sizes and declared types of its
--    attachments (O1044-4: their content is never kept). The unique index makes a repeated delivery of the same mail store one row only.
alter table public.contact_inquiries
  add column source text not null default 'form',
  add column message_id text,
  add column attachments jsonb not null default '[]'::jsonb;
alter table public.contact_inquiries
  add constraint contact_inquiries_source_check check (source in ('form', 'email'));
create unique index contact_inquiries_message_id_key on public.contact_inquiries (message_id) where message_id is not null;

-- 2. contact_inquiry_replies: a row is a staff reply (outbound, the existing rows) or a customer's answer received by mail (inbound: its sender's address, no staff
--    author). message_id is the Message-ID of a received answer, or the one Resend gave a staff reply; the next staff reply names them in In-Reply-To and References.
alter table public.contact_inquiry_replies
  add column direction text not null default 'outbound',
  add column from_email text,
  add column message_id text,
  add column attachments jsonb not null default '[]'::jsonb;
alter table public.contact_inquiry_replies
  add constraint contact_inquiry_replies_direction_check check (direction in ('outbound', 'inbound')),
  add constraint contact_inquiry_replies_inbound_no_staff_check check (direction = 'outbound' or replied_by is null);
create unique index contact_inquiry_replies_message_id_key on public.contact_inquiry_replies (message_id) where message_id is not null;

commit;
