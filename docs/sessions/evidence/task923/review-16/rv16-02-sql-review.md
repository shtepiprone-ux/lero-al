# Task 923 review 16 — Opus re-review of hardening v5 and account deletion v2 (2026-10-19)

Files reviewed (SHA-256 in `rv16-01-reviewed-sha256.txt`): `db-catalog/proposed-hardening.sql` (v5) with its rollback, and
`db-catalog/proposed-account-deletion.sql` (v2) with its rollback. Evidence read: `r14-01` (syntax, four files, exit 0), `r14-02` (harness against
the database without either file: 196 checks, the 22 new ones as expected, clean-up verified), `r14-03` (read-only capture), `r14-04` (hashes),
`r14-05` (the trigger logic on temporary objects, all cases hold), `r14-06` (both preflights pass on the live schema, eight broken comparisons refused).

## Account deletion v2 — approvable

R59 (a)–(d) hold on the file: the two `updated_at` triggers are disabled only around their four backfills and enabled again, and the preflight
requires both to exist and be enabled; `set_actor_name()` owns the name (INSERT from the id, null with a null id; UPDATE recomputes only when the id
changes to another person, keeps the old name otherwise); all 17 backfills run before the 17 triggers exist; the preflight compares the full
definition of the seven re-created keys, and the rollback restores exactly those definitions and drops all 18 triggers it created. The harness
section DX shows today's defect directly: a staff account that has acted cannot be deleted (`DX03a`). **Opus approves v2 for the owner's
approval:** `proposed-account-deletion.sql` `c5e61f0a006b61bfe60a0571cd6f033b66886a6a4f89a5b53c8a33be15a64bd8`, rollback
`4b01bb9dce4ed484460439e45c949efb25d5225f30fb65b12498ab58cf0b7c8a`. It is applied in R43 (b)'s turn of the order, not before.

## Hardening v5 — one required change (v6)

R58 (b) holds (six `alter function … set search_path`, preflight per setting, rollback restores). R58 (a) holds as written, and that is the defect:

**P1 — the view refuses the service role too** (Opus's design error in R58 (a), raised by the executor as `H01e`). The view's new condition is
`where (select public.caller_is_active())` (`proposed-hardening.sql:146`); `caller_is_active()` needs `auth.uid()` (`:117`), which a service-role or
owner caller does not have. The admin listing preview reads the view through `createAdminClient()`
(`src/app/admin/listings/[id]/preview/page.tsx:35`, `:45`), so after the apply every preview would show an empty owner.

Required: the condition becomes `where current_user not in ('authenticated', 'anon') or (select public.caller_is_active())` — the guards' own test
(section 3 of the file): a session is checked, a trusted server role is not. A view that is not `security_invoker` runs its functions and
`current_user` as the caller, not as the view's owner; this is proved before the apply, in a transaction that is rolled back on the development
database: a definer view `select current_user::text` read under `set local role authenticated` answers `authenticated`, under
`set local role service_role` answers `service_role`. `H01e` becomes an asserted check after the apply (service role reads one row), and the header's
item 5 of "NOT BEHAVIOUR-NEUTRAL" is rewritten to say so.

## Notes

- The evidence scripts load `pg` 8.21.0 and `plpgsql-parser` 18.5.10 from a scratchpad prefix through `NODE_PATH`; the session log records it. Any
  re-run needs the same two packages; the repository's `package.json` stays unchanged.
- `set local search_path = public, pg_temp` at the top of each file is accepted: it fixes the rendering of the captured definitions.
- `DX01` compares against a snapshot taken right before the apply; it is taken in the same session as the apply.
