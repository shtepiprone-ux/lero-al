-- Task 1044: the way back from task1044.sql. It removes the two indexes, the three checks and the seven columns task1044.sql added. One transaction; run it only after task1044.sql.
-- What it loses: the inquiries and answers received by mail stay as rows, but without their source, direction, sender address, message ids and attachment names; an
-- inbound answer would then read as a staff reply with no author. Delete the received rows first if they must not remain (the plan's clean-up statements).
begin;

drop index public.contact_inquiry_replies_message_id_key;
drop index public.contact_inquiries_message_id_key;

alter table public.contact_inquiry_replies
  drop constraint contact_inquiry_replies_inbound_no_staff_check,
  drop constraint contact_inquiry_replies_direction_check,
  drop column attachments,
  drop column message_id,
  drop column from_email,
  drop column direction;

alter table public.contact_inquiries
  drop constraint contact_inquiries_source_check,
  drop column attachments,
  drop column message_id,
  drop column source;

commit;
