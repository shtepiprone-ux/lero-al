-- Task 923 Revision 37 (Opus, 2026-10-23), kickoff section 61: the rollback of proposed-contact-reveals.sql. It drops public.listing_contact_reveals and its rows. The gateway that counts
-- reveals refuses every reveal without the table (it never counts a failed read as zero), so run it together with the gateway code that reads the table, never alone.
-- OWNER STEPS: Get-FileHash -Algorithm SHA256 against the hash Opus gives; run it in the SQL editor; after an error run "rollback;" as a separate query and report the error to Opus.
begin;

do $preflight$
begin
  if to_regclass('public.listing_contact_reveals') is null then
    raise exception 'rollback preflight failed: public.listing_contact_reveals does not exist';
  end if;
end
$preflight$;

drop table public.listing_contact_reveals;

do $postcheck$
begin
  if to_regclass('public.listing_contact_reveals') is not null then
    raise exception 'rollback check failed: public.listing_contact_reveals still exists';
  end if;
end
$postcheck$;

notify pgrst, 'reload schema';
commit;
