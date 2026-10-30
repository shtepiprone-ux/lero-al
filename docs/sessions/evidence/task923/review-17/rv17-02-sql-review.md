# Task 923 review 17 — hardening v6, and the owner's loophole audit of account deletion v2 (2026-10-19)

Files reviewed (SHA-256 in `rv17-01-reviewed-sha256.txt`): `db-catalog/proposed-hardening.sql` (v6) with its rollback, and
`db-catalog/proposed-account-deletion.sql` (v2) with its rollback. The owner asked, before approving v2, for a check "чи немає там лазівок, дірок".
Sources read: the four files; `catalog.json` (policies, table and column grants of the 17 tables that gain a name column, of `companies`,
`listing_views` and `listing_contact_events`); `fingerprint.json` (triggers, `users_company_id_fkey`); `r9-61-deletion-schema-facts.txt`; the
application readers of `pages`, `site_footer`, `support_tickets`, `verification_requests` and `listing_reports`; the executor's `r15-01` to `r15-05`.

## Hardening v6 — approvable

R61 holds: the view's condition is `current_user not in ('authenticated', 'anon') or (select public.caller_is_active())`
(`proposed-hardening.sql:149`); the probe answered each role's own name inside a rolled-back transaction (`r15-02-view-probe.txt:5-6`); `H01e` is
asserted and passes (`r15-03-rls-harness-pre-apply.txt:180`); clean-up is verified and the run exits 1 as expected before the apply (`:200`, `:205`);
both preflights pass and refuse each broken comparison (`r15-05`); the deletion hashes are unchanged (`r15-04`). **Opus approves v6 for the owner's
approval:** `proposed-hardening.sql` `217bd678092faaf33e5c084dacb8de787e669080853d2d69614d8579697b8726`, rollback
`2f09fca869f24e501518a580fc1c051b6065df671ce22badebc04b676399456a`.

## Account deletion v2 — Opus withdraws review 16's approval: NEEDS REVISION (v3)

### What was checked and holds

- Every new function is `security definer` with `search_path = public, pg_temp`, and `execute` is revoked from `public, anon, authenticated`
  (`account_display_name` stays callable by `service_role` only). The trigger functions return `trigger` and cannot be called through the API.
- No client can lower a view count through the new trigger: `listing_views` has no DELETE policy (only "viewable by listing owner"), so RLS
  removes no row although `authenticated` holds the DELETE grant; the same for `listing_contact_events`. The listings guard lets the count
  update through because the trigger runs as its owner.
- No client can write `companies.created_by` (the column does not exist yet; `authenticated` has no INSERT/UPDATE grant; `anon` has the grants
  but no write policy; inserts are `service_role` only). Deleting a company touches nothing else: the only key to it is
  `users.company_id … ON DELETE SET NULL` (`fingerprint.json:776`).
- No name oracle: a client can choose the id of a row only where the policy pins it to itself (`listing_reports_insert_own`), or the table
  grants it no INSERT at all (`support_tickets`, `verification_requests`); so the trigger never tells a user someone else's name.
- No audit table has an immutability trigger that the SET NULL would trip; the rollback refuses (and rolls back) rather than half-restores.

### Findings

1. **P1 — a staff member's name, or e-mail, becomes readable by anyone on the internet.** `pages` gains `updated_by_name`
   (`proposed-account-deletion.sql:142`) and `site_footer` gains `updated_by_name` (`:146`). `anon` holds a table-level SELECT on both
   (`catalog.json:1818-1819`, `:1908-1909`), which covers every new column; the policies return every published page to `anon` and
   `authenticated` (`catalog.json:1166-1168`) and every footer row to everyone (`catalog.json:1336-1340`). So, with only the public API key,
   `GET /rest/v1/pages?select=updated_by_name` and `GET /rest/v1/site_footer?select=updated_by_name` return the name of the admin or
   moderator who last edited them — and, by finding 2, their login e-mail when the name is empty. Today only an opaque id is exposed there.
   (The application's own public footer is not the leak: `getFooterContent` reads with the service-role client and `Footer.tsx` passes on
   named fields only.)
2. **P1 — the "name" may be an e-mail, and it is kept after a hard delete.** `account_display_name()` falls back to the Auth e-mail when name
   and last name are empty (`proposed-account-deletion.sql:104`). D32 and D35 keep the account's **name**; D30 keeps no other data of a
   deleted person. An e-mail copied into 17 columns would outlive the deletion, in reports and tickets kept for years.
3. **P2 — a cleared id keeps the previous person's name.** On UPDATE the old name is kept whenever the id becomes null (`:126`), whether the
   person was deleted (D32) or a writer merely cleared the field (a ticket unassigned, a page edited by the system). The record would then name
   someone who did not do it. No path clears these ids today; the first one that does would falsify the trail.
4. **P2 — a company's logo stays in Cloudinary.** The company now goes with its creator (`:233`), and `companies` holds `logo_url` (C326), but
   R60's list of the person's files names only `users.company_logo_url`, the verification documents and the avatars (`:27`). D30 says
   every file of the person goes.

### Required (R62, deletion v3; the hardening files do not change)

- (a) `account_display_name()` returns the trimmed name and last name, or null; no e-mail.
- (b) In the same transaction, `revoke select on public.pages, public.site_footer from anon, authenticated` and grant SELECT back to both
  roles on every current column except `updated_by_name` (the column lists generated from the capture; the preflight compares both tables'
  columns and ACLs with the capture and refuses on any difference); the rollback restores the table-level grants and drops the column grants.
  Staff screens read the two name columns through the service-role client after the staff check.
- (c) `set_actor_name()`: when the id becomes null, the old name stays only if the old account no longer exists (no row in `public.users`,
  none in `auth.users`); otherwise the name becomes null.
- (d) R43 (c) / R60 amended: `deleteAccount` also collects the Cloudinary public id of `companies.logo_url` of every company whose
  `created_by` is the person, before the delete.
- (e) The rollback header says that a rollback after any staff deletion drops the only name that record still carries.

### Notes (no change)

- When a staff member is deleted, the SET NULL updates their tickets and templates, so `updated_at` of those rows moves to the deletion time:
  that is a real change of the record and is accepted.
- `users.name` is chosen by its owner, so a staff trace keeps whatever name the staff member had at the time; after the deletion only that name
  remains (D32). Keeping anything stronger than the name (the e-mail) is what D30 forbids; this residual risk is the owner's to accept.
