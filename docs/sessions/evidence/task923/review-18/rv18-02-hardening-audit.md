# Task 923 review 18 — the owner's loophole audit of hardening v6 (2026-10-19)

The owner asked whether `proposed-hardening.sql` had been audited as thoroughly as the deletion file. It had not: review 17 checked only R61
(the view's condition) and its evidence. This review reads the whole file (`rv18-01-reviewed-sha256.txt`) against `catalog.json` (every
SECURITY DEFINER function and its ACL, every view, every PUBLIC grant, the policies and the table and column grants of `users` and `listings`),
`fingerprint.json` (defaults, unique keys, the triggers of `listings`) and the application writers and readers.

## Opus withdraws review 17's approval of v6: NEEDS REVISION (v7)

### What was checked and holds

- Every SECURITY DEFINER function that `anon` or `authenticated` can call is one this file rewrites (`record_listing_view`,
  `record_recently_viewed`, `get_listing_owner_contact`) or creates; the other six are `postgres` / `service_role` only, so a blocked
  account has no definer path around the restrictive policies. No PUBLIC grant exists; `public_user_profiles` is the only view.
- The users guard: the columns it leaves writable (`pending_email`, `last_seen_at`, `created_at`, `company_id`, `user_type`, …) do not
  escalate. The e-mail change takes the address from the token, not from `pending_email` (`consumeEmailChangeToken`); the inactivity cron
  skips blocked accounts, so a ban cannot become a restorable inactivity; "member since" is shown only in the person's own cabinet.
- `restore_inactive_account()`, `caller_access_state()`, the quota, the storage policies and the TRUNCATE revoke hold as reviewed before.

### Findings

1. **P1 — an owner can pin a listing to the top of the catalogue.** The default catalogue order is premium first, then `created_at`
   descending (`src/app/[locale]/listings/page.tsx:61`). The owner may update the own listing (`catalog.json:976-980`) with a table-level
   UPDATE grant (`catalog.json:1793-1795`), and the listings guard compares seven columns on UPDATE, not `created_at`
   (`proposed-hardening.sql:237-243`); on INSERT it checks status, premium, counters and expiry only (`:228-232`). So
   `PATCH /rest/v1/listings?id=eq.<own id>` with `created_at = 2099-01-01` keeps the listing above every non-premium listing for good, which is
   what premium is sold for.
2. **P2 — a client can jam the creation of listings.** `public_id` is filled from `listings_public_id_seq` and is unique
   (`fingerprint.json:424-427`, `:732-734`). The guard compares `public_id` on UPDATE only; on INSERT a client may supply it. Inserting
   listings with the next values of the sequence makes each later `createListing` that draws one of them fail with a unique violation.

### Required (R63, hardening v7; the deletion files are not affected)

- (a) In `guard_listings_protected_columns()`, for a session INSERT: `created_at` must equal `now()` (the column default; anything else is
  refused with 42501) and `public_id` is taken from `nextval('listings_public_id_seq')` whatever was supplied. On UPDATE `created_at` joins the
  compared columns. `createListing` sends neither column (`src/modules/listings/actions/createListing.ts:37-50`) and keeps working.
- (b) Harness: an owner's update of `created_at` is refused; an insert with a future `created_at` is refused; an insert that supplies a
  `public_id` stores another one; a plain insert as `createListing` sends it works. Each before the apply with its cause printed.
- (c) The header's "WHAT IT CLOSES" row S61 names `created_at` and `public_id` on INSERT.

### Notes (owner, no change here)

- A user may set `company_id` to any company at any time, so a private account can show an agency's name and logo. D31 lets the sign-up pick
  an existing company without approval; whether joining needs the company's consent is a Task 926 decision.
- `price_old` is the owner's own value, so a listing can show an invented "old price". A product rule, not a database hole.
