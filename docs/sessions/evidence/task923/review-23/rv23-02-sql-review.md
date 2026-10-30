# Task 923 — review 23: Opus's SQL review of hardening v7 (2026-10-20)

Files reviewed (hashes recomputed by Opus, `rv23-01-sha256-and-callers.txt`):

- `db-catalog/proposed-hardening.sql` `a8b0ae690d0786747b34e4c582612a1d7b4dc5eb095ae4066a3dc0230455e438` (556 lines);
- `db-catalog/proposed-hardening-rollback.sql` `52bd460f8c8cbe688f6bc24dae726728725e3c2414be827a27097c0327813db5` (188 lines).

Method (the same as review 18): every statement of both files read in order, against `catalog.json`, `fingerprint.json`,
`r16-00-capture.txt`, the application's callers in `src`, the owner decisions D39–D41, D49 and D58, and the executor's runs
`r18-20` (grammar), `r18-21` (v7 logic on temporary objects, one transaction, rolled back) and `r18-22` (RLS harness on the development
database, v7 not applied).

## Verdict

**NEEDS REVISION — v7 is not approvable as written. The owner approves NO SHA of this version.** Two P1 findings. Each would
reopen a hole or break a working flow on the day the file is applied. A narrow v7.1 follows, and Opus reviews it again.

## Findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| S1 | P1 | Change 8 still creates `restore_inactive_account()` and grants it to `authenticated` (apply `:458-470`). The function clears `deleted_at` and sets `status = 'active'` (`:464`). D58 says that no account restores itself, and R77 (e) says that v7 removes this function from change 8. The code already stopped calling it: `src/app/api/presence/route.ts:9`, and 0 files under `src` call either function of change 8 (`rv23-01`). So after the apply, a marked account with a live session could call `rpc('restore_inactive_account')` through the Data API and restore itself. That is the exact path D58 closes. `caller_access_state()` (`:442-455`) has no caller left either (R45 (b)'s `restorable` branch is withdrawn). | apply `:464`, `:470`; route `:9`; `rv23-01:4` |
| S2 | P1 | The INSERT slug rule (`:313`) refuses slugs that today's `createListing` makes. `generateSlug` does not collapse hyphens (`createListing.ts:22`). It gives a leading hyphen for a title with no Latin letter or digit. It can also leave a trailing hyphen after `.slice(0, 80)`. The executor's probe: `"Shitet apartament - 2+1"` and `"Продається квартира в центрі"` are refused, and so are 57.1% of 20 000 random titles (`r16-06:18`, `:21`, `:33`). The executor reported this as item 8 and asked Opus to decide. Opus's decision: **keep the rule** (it is the guard of `SEC-X-INT-SLUG-SCRIPT-DENY`), and **fix the generator first**. The fix works with or without v7, so it ships before the apply. | apply `:313`; `createListing.ts:22`; `r16-06:33` |
| S3 | P2 | Change 7 (S64) still creates the per-person contact quota: the table `owner_contact_access`, `owner_contact_daily_limit()` (NULL) and the counting branch (`:399-434`). D49 says contact reveals get no cap, and R78 (b) says that v7 removes the unset quota. As written, v7 adds a dead table and a dead lock path, and a later NOT-NULL edit of one function would turn the cap on. | apply `:410`; kickoff R76 |
| S4 | P2 — Opus's ambiguity | R69, R73 (a), R75 (c) (f), R78 (a) and R79 (b) were placed "in hardening v7" (R69's own text). §31.4 then listed them as "waiting for the owner's SQL approval". The executor read this as "not written yet" (apply `:8`). Opus's decision: v7 stays narrow (R63–R65, R81 (b), and the two removals S1 and S3). Every other SQL change goes into **hardening v8**, a separate file with its own preflight, harness, rollback and Opus review. v8 starts after v7 is applied. | apply `:8`; kickoff `:2409`, `:2618` |
| S5 | P3 | `r18-21` proves `reauth_failures` on a TEMPORARY table (`pg_temp.reauth_failures`, line 44). Temporary tables do not receive the schema's default privileges. So R3 ("service_role … not update") says nothing about the real table, where Supabase's default privileges give `service_role` every privilege. This is harmless, because `service_role` bypasses RLS anyway. The proof for the real table is the post-apply case `SEC-DB-X-REAUTH-FAILURES-NO-SESSION`, plus a harness check of the real table's grantees. The comment at `:58` ("service_role may select, insert and delete") must not claim that `UPDATE` is absent. | `r18-21:44` |

## What holds (no change)

- **Preflight** (`:100-180`). It checks:
  - the md5 of the four functions, the view's definition, ACL and options, and the six `proconfig` values;
  - the `created_at` and `public_id` defaults, the price types, and the two triggers of `listings`;
  - `currencies.id integer`, `DELETE` on `auth.sessions`, and that no v7 or hardening object exists yet.
  
  The whole file is one transaction with `lock_timeout = '10s'`, so any failure leaves the database unchanged.
- **Change 2/3** (`:184-202`) is unchanged since v6, which reviews 16–17 accepted. The guards' trust test,
  `current_user not in ('authenticated','anon') or caller_is_admin()`, is also unchanged.
- **3b** (`:294-297`). The column is added and backfilled before any listings trigger of this file exists. `listings_updated_at` is
  disabled only around the backfill. The backfill clears `price_old`, which is owner decision D39–D41, accepted at review 19.
- **Change 11** (`:302-332`):
  - `created_at is distinct from now()`: the default `now()` is the transaction time, so it is equal to the trigger's `now()` (G1, G2, G2b);
  - the sequence override (G3), and `created_at` and `slug` compared on UPDATE (G5, G6);
  - trusted roles are unaffected (G8).
  
  **Item 6 (gaps of 2 in `public_id`) is accepted by Opus.** A sequence never promised dense numbers, and the `currval` variant would
  depend on the pooled backend's earlier calls.
- **Change 12** (`:336-355`). The triggers fire in name order: guard < price_rule < search_vector < updated_at. P1–P11 hold.
  **The currency fail-safe is accepted by Opus as the rule of v7.** It can only hide a reduction, never show a false one, which is what
  D39–D41 protect. A conversion through the stored rates of R79 (b) is a candidate for the listing-lifecycle task of 31.3, not for this file.
- **Change 13** (`:422-437`): both reads require `status = 'active'` (O1).
- **Change 14** (`:518-528`). It deletes `auth.sessions` rows of one user, and the refresh tokens and AMR claims cascade (captured). Only
  `service_role` can run it (E1–E3), and `p_user` null deletes nothing.
- **Change 15** (`:531-541`). The advisory lock plus one UPDATE work because `currencies` has no unique index on `is_default` (only
  `currencies_code_key` and the primary key, `r16-00:156-157`). So one statement that moves the flag cannot hit a duplicate key (C1–C6).
- **Change 16** (`:545-553`). This is the R81 (b) text that review 22 verified: the FK cascades to `auth.users`, RLS is on, there is no
  policy, and `anon`/`authenticated` are revoked. The policy loop of section 9 runs before the table exists, and the table has no
  `authenticated` grant, so no restrictive policy is needed.
- **Rollback**:
  - The policies are dropped before the functions they call. The triggers are dropped before their functions.
  - The audited bodies and ACLs of the four functions are restored from `catalog.json`, and the view is restored with its md5, ACL and
    options checked.
  - The six settings are restored. `price_initial`, the two v7 functions and `reauth_failures` are dropped, and the final check covers
    v7. The loss of the cleared `price_old` values is stated.
  - Every drop of an object that v7.1 no longer creates (`restore_inactive_account`, `caller_access_state`, `owner_contact_access`,
    `owner_contact_daily_limit`) is `if exists`, so the rollback stays valid for v7.1 unchanged except for its header.

## Required for v7.1 (R82 of the kickoff, §34)

1. Delete `caller_access_state()` and `restore_inactive_account()` from change 8. Keep the preflight's "does not exist" checks.
2. Delete the quota from change 7: no `owner_contact_access`, no `owner_contact_daily_limit()`. `get_listing_owner_contact` keeps the
   session check, the `caller_is_active()` check and the two `status = 'active'` reads, and has no counting branch. The header loses
   S64's quota and "D-quota".
3. Header: v7.1 lists S1–S5. The NOT BEHAVIOUR-NEUTRAL items 6 and 8 and change 12's fail-safe record Opus's decisions. Line 8 names
   hardening v8 as the home of R69, R73 (a), R75 (c) (f), R78 (a) and R79 (b).
4. Harness:
   - the real-table grantee check of `reauth_failures` after the apply;
   - a check that a session's `rpc('restore_inactive_account')` and `rpc('caller_access_state')` answer "function not found" after the
     apply;
   - a check that `owner_contact_access` does not exist.
5. Code, before the apply: `generateSlug` moves to a non-action module. It collapses runs of `-`, trims `-` after the cut, and uses
   the fixed base `listing` when nothing is left. Its output always matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is at most 120 characters.
   The executor reruns the 20 000-title probe against the new function: 0 refused.
