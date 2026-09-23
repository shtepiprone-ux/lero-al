# Task 870 — Data API privilege hardening: no view is writable, no service-only or consumer-less table is reachable, no default hands out access

Sprint 80 · **P1** · QA profile **Q4** (RLS/permission security; data-integrity risk) · no dependencies ·
owner actions **O80-1 … O80-3** · **Status: 🔁 NEEDS REVISION 2026-09-23 (review 1) — re-enter at §16, READY FOR SONNET**

Sprint plan: [`Sprint_80_The_Data_API_Privileges_Nobody_Audited.md`](Sprint_80_The_Data_API_Privileges_Nobody_Audited.md).
Design-time evidence (owner grids, verbatim): `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.

Owner instruction that opened it (2026-09-23, verbatim): *"Задачу створи, щоб уникнути дірок."*

## 1. Mode and task type

`IMPLEMENTATION`. The deliverables are owner-applied SQL, a read-only audit SQL, a Node probe and a rules-document
update. **No file under `src/` changes, and there is no component, JSX, `className`, style, locale key or Storybook
change.** Bundles: **DB / Server Action / RLS** + **Regression / Critical Flow Coverage** (because a DB permission
change touches the tables of registered critical flows).

GR-0, GR-1, GR-3 and GR-3a are **NOT APPLICABLE**: there is no visible artifact and no surface file in the write set
(§7). The executor must stop and report if that stops being true.

## 2. Objective

1. **Record the 2026-09-23 hotfix.** `public.public_user_profiles` grants `SELECT` to `authenticated` and
   `service_role` only, and no other privilege to `anon` or `authenticated`. This lives in a versioned, idempotent
   script, not only in the owner's SQL Editor history.
2. **Close the grant layer on 18 tables.** `anon` and `authenticated` lose every privilege on the three tables the
   rules call service-role only, and on the fifteen tables that no code in `src/` reads or writes through a
   user-scoped client. `service_role` is unchanged. The SQL checks its own preconditions and aborts, changing
   nothing, if any table is still reachable through a path this task cannot see.
3. **Future tables inherit nothing.** `postgres`'s default privileges in `public` grant nothing to `anon` or
   `authenticated`, for tables or sequences.
4. **The audit is repeatable.** One read-only SQL file returns **one** result grid covering eight checks. Every
   check always prints a COUNT row.
5. **The rule is written down.** `docs/rls-rules.md` forbids write grants on any view and names the audit as the
   post-migration check.

## 3. Verified context — measured 2026-09-23 (re-measure the live arms at I0)

### 3.1 The hole that was open, and is now closed

- **F1 FACT (owner grid 4):** `public_user_profiles` had `anon_upd=true, auth_upd=true, anon_ins=true`,
  `information_schema.views.is_updatable = YES`, `reloptions = {security_invoker=false}`, owner
  `postgres bypassrls=true`.
- **F2 INFERENCE from F1:** the view is a simple projection of `public.users`
  (`docs/sessions/2026-05-28-task-266-t8-users-rls-narrowing.md:34-47`), so Postgres auto-updates it. A write
  through a non-invoker view runs with its owner's privileges, and the owner bypasses RLS. Anyone holding the public
  anon key could therefore `PATCH /rest/v1/public_user_profiles?id=eq.<victim>` and change `name`, `avatar_url`,
  `user_type`, `is_verified`, `company_name` or `deleted_at` on any row of `users`. `role` is not in the view, so role
  escalation was not possible through it. `DELETE` was not measured.
- **F3 FACT:** Task 266 granted only `SELECT` to `authenticated`: *"Grant SELECT on view to authenticated (not anon
  — guests continue to get null)"* (session log `:49-50`). Task 275's audit then listed the view under "✅ OK — grants
  already match rule" (`scripts/grant-discipline-audit.sql:222-228`).
- **F4 FACT (owner, 2026-09-23):** the hotfix in the evidence file was applied. Owner grid 5 reads
  `anon_sel/upd/del=false, auth_sel=true, auth_upd/ins/del=false`.
- **F5 FACT (owner, 2026-09-23):** *"Гість, як і раніше, бачить кнопку входу, а залогінений користувач бачить картку
  контактів"*. The two consumers still work. Code: `src/app/[locale]/listings/[slug]/page.tsx:168-176` reads the view
  only inside `if (authUser)`, and `src/app/admin/listings/[id]/preview/page.tsx:47-51` is an admin route. Neither
  site writes to it; `git grep -n "public_user_profiles" -- src` returns only those two read sites and a type comment.
- **F6 (owner statement, not a measurement):** *"дірою ніхто не користувався"*. The site is not indexed and the URL
  has not been shared. No API-log query was run. Record this as an owner statement, never as a measured absence.

### 3.2 The service-only tables that are not

- **F7 FACT (owner grid 1):** `email_change_tokens`, `user_status_history` and `user_change_log` give `anon` and
  `authenticated` `SELECT=true` and `INSERT=true`.
- **F8 FACT:** the rules say otherwise. `docs/rls-rules.md` → "user_status_history Access Policy" says *"INSERT:
  service-role only"*. "Email-Change Token Policy" says *"no direct user RLS access"*. "Per-role GRANT discipline"
  says these tables *"get no GRANTs to anon/authenticated"*.
- **F9 FACT:** Task 275 never revoked them. `scripts/grant-discipline-audit.sql:166-173` only runs
  `grant all … to service_role`.
- **F10 FACT (owner grid 3):** the only policies are one `SELECT` policy each on `user_change_log` and
  `user_status_history` ("Admin/moderator read …", `{public}`). `email_change_tokens` has zero policies. With RLS on,
  every anon/authenticated write is refused today. **Latent, not live.**
- **F11 FACT (file-level, design-time):** every consumer of these three tables in `src/` is in a file that builds
  `createAdminClient()`. The files are:
  - `src/modules/cabinet/actions/index.ts` (`email_change_tokens` ×6)
  - `src/app/admin/users/[id]/page.tsx:44,56`
  - `src/app/api/cron/inactivity/route.ts:104`
  - `src/app/api/presence/route.ts:42`
  - `src/modules/admin/actions/index.ts:396,417,541,569`

  Several of those files **also** build a user-scoped client. The **per-site** trace (which client variable each
  `.from()` uses) is I0 work (§10.1). The design-time read only confirmed `presence/route.ts:20` (`const db =
  createAdminClient()`) and `admin/users/[id]/page.tsx:13,21`.

### 3.3 The fifteen tables with no consumer

- **F12 FACT (design-time):** `git grep -nE "from\(['\"]<t>['\"]\)" -- src ':!*__tests__*'` returns **0** for each of
  the following, and `git grep -nwE "<t>\(" -- src` (a PostgREST embed) also returns **0**:
  `agent_reviews`, `amenities`, `amenity_translations`, `conversations`, `currency_rates`, `history_clear_events`,
  `languages`, `listing_amenities`, `listing_translations`, `location_translations`, `messages`,
  `notification_settings`, `page_translations`, `support_messages`, `verification_requests`. Whole-word hits for
  `amenities`, `languages` and `messages` exist in `src/`, and every one was read: they are prop names, i18n files
  and a Storybook comment, never a table access.
- **F13 FACT:** `history_clear_events` is written only through `rpc('clear_user_history')`
  (`src/modules/admin/actions/clearHistory.ts:26-28`), and the client there is `createAdminClient()`.
- **F14 FACT (owner grid 1):** all fifteen give `anon` and `authenticated` `SELECT` and `INSERT`.
- **F15 FACT (Task 865 reserved row, 2026-09-21):** their write policies are predicate-neutralised. `listing_views` is
  the only open write predicate in the schema, and 865 owns it.
- **F16 UNKNOWN:** whether any `SECURITY INVOKER` function or trigger function, any view, or the
  `supabase_realtime` publication reaches one of the eighteen tables. `src/` cannot show this. The harden SQL's guard
  (R3) measures it at apply time and aborts on any hit. Known realtime subscriptions in `src/` are on `listings`,
  `favorites` and `notifications` (`useCabinetListingsRealtime.ts:37`, `useFavoritesRealtime.ts:57`,
  `useNotifications.ts:35`), and none of those is in the set.

### 3.4 Default privileges

- **F17 FACT (owner grid 2):** tables that `postgres` creates in `public` currently get `anon=Dxtm`,
  `authenticated=Dxtm`, `service_role=Dxtm` (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN). They get **no**
  `SELECT/INSERT/UPDATE/DELETE` for anyone but `postgres`. Sequences get `anon=w`, `authenticated=w`. Functions get
  EXECUTE for `postgres` only.
- **F18 INFERENCE from F17:** Supabase's 2026-10-30 change does not change how this project creates tables through
  the SQL Editor. Explicit grants are already required, which is why `task-277` and `task-849` write them. The
  `supabase_admin` rows cover objects that Supabase itself creates. They are not this task's to change.
- **F19 UNKNOWN:** whether the dashboard toggle "Automatically expose new tables" (currently ON) writes `postgres`'s
  default ACL or `supabase_admin`'s. O80-1 turns it off before the SQL runs, and check A7 measures the result.

### 3.5 A finding outside this task's write set — filed as 871

- **F20 FACT:** `roleHasPermission` (`src/lib/auth/permissions.ts:6-18`) reads `role_permissions` through the
  user-scoped `createClient()`. Owner grid 1 shows `authenticated` with `SELECT=false` on `role_permissions`, revoked
  by Task 275 (`grant-discipline-audit.sql:84-85`).
- **F21 INFERENCE:** for a moderator, the query errors, `data` is null, and the function returns `false`. Every
  configurable moderator permission has therefore been denied since 2026-05-28. The failure is fail-closed. **871
  owns it. This task must not grant, revoke or change anything on `role_permissions`.**

### 3.6 A lesson from the same session that binds this task's SQL

- **F22 FACT:** the Supabase SQL Editor shows only the **last** statement's result. The owner's first two-query paste
  on 2026-09-23 returned only the second grid. Task 867's `verify.sql` "came back with only PART d2" (commit
  `2164663e5`'s message). **Every read-only script this task ships returns exactly one result grid.**
- **F23 FACT:** pasting prose along with SQL made the SQL Editor reject the whole batch (`42601`) and **apply
  nothing**. The owner-run block in §13.3 therefore copies each file to the clipboard with a command, so nothing is
  retyped or pasted by hand from chat.

## 4. Requirements

**Set definitions (used everywhere below):**
- **S1** = `email_change_tokens`, `user_status_history`, `user_change_log`.
- **S2** = the fifteen tables in F12.
- **R = S1 ∪ S2** (18 tables): the revoke set.
- **S0** = `exchange_providers`, `site_settings`, `email_templates`, `contact_inquiries`, `contact_inquiry_replies`,
  `report_actions`, `role_permission_events`, `support_tickets`, `support_ticket_events`, `listing_activity_daily`,
  `listing_activity_refresh`. These are already service-only for `SELECT` and `INSERT` (grid 1). They are
  **monitored** by A4 and **not** in R. `role_permissions` is deliberately excluded from S0, because 871 owns it.

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Objective 4, F22 | `scripts/task-870-privilege-audit.sql` (new, read-only). **Exactly one** top-level SQL statement, returning one grid with the columns `check_id, object_name, role_name, detail`. It runs checks **A1–A8** as defined in §10.3. Every check emits one row with `object_name = '(count)'` and the check's row count in `detail`, **even when the count is 0**, followed by its detail rows. It performs no write and creates no object. | P0 | AC1, AC5 | Confirmed |
| **R2** | Objective 1, F4 | `scripts/task-870-harden-privileges.sql` (new, owner-applied), step 1: `revoke all on public.public_user_profiles from anon, authenticated; grant select on public.public_user_profiles to authenticated; grant select on public.public_user_profiles to service_role;`. This is identical in effect to the 2026-09-23 hotfix and idempotent, and a header comment cites F1–F4. | P0 | AC2, AC5 | Confirmed |
| **R3** | Objective 2, F16 | The same script, step 0: a `do $$ … $$` guard over the array of the 18 names in R. It raises **one** exception, listing every violation found, if any of these holds: (g1) a name does not exist as a table in `public`; (g2) a function in `public` with `prosecdef = false` has a body matching `'\m<name>\M'` (case-insensitive); (g3) the table is in `pg_publication_tables` for `supabase_realtime`; (g4) any view depends on the table (`pg_depend` through `pg_rewrite`). Because the script is one transaction, a guard exception applies **nothing**. | P0 | AC3 | Confirmed |
| **R4** | Objective 2, F7–F15 | The same script, step 2: `revoke all on public.<t> from anon, authenticated;` for each `t` in R. It changes no `service_role` privilege and touches no table outside R. | P0 | AC2, AC5, AC6 | Confirmed |
| **R5** | Objective 3, F17 | The same script, step 3: `alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;` and the same `on sequences`. Step 4: `notify pgrst, 'reload schema';`. The whole script is one `begin; … commit;` block. | P0 | AC5 | Confirmed |
| **R6** | RLS-Change Test Requirement §1–5; F23 | `scripts/task-870-guard-selftest.sql` (new, owner-run, read-only). The **identical** guard block from R3, run against the planted array `array['users']`. It must raise an exception naming `public_user_profiles` (g4 — FACT: the view is defined over `users`, F2). It contains no `revoke`, `grant` or `alter`. | P0 | AC3 | Confirmed |
| **R7** | RLS-Change Test Requirement §3, §5 | `scripts/task-870-anon-probe.mjs` (new). It reads `.env.local` with Node `fs` (never PowerShell `Get-Content -Raw`) and takes `--phase before` or `--phase after`. For each `t` in R it sends an anon `GET /rest/v1/<t>?select=*&limit=0` and a service-role `GET` with `Prefer: count=exact` and `Range: 0-0`. For `public_user_profiles` it sends an anon `GET` and an anon `PATCH ?id=eq.00000000-0000-0000-0000-000000000000` with body `{"name":null}` and `Prefer: return=minimal`. For every request it prints `phase, relation, role, method, http_status, pg_code` and nothing else: **no key, no token, no row content, no count value**. It issues **no other write**, and the one `PATCH` targets an id that cannot exist. It exits 1 if any request fails at the network level (no HTTP status). | P0 | AC4 | Confirmed |
| **R8** | Rollback discipline (865 row convention) | `scripts/task-870-rollback.sql` (new, owner-applied only on breakage). `grant all on public.<t> to anon, authenticated;` for each `t` in R, plus the default privileges that F17 records (`truncate, references, trigger` on tables and `update` on sequences, for `anon, authenticated`, `for role postgres in schema public`). The header states in capitals that the rollback **never** re-grants any privilege on `public_user_profiles` beyond R2's. | P1 | AC7 | Confirmed |
| **R9** | Objective 5, F3, F8, F22 | `docs/rls-rules.md` is updated in exactly the sections named in §10.5. | P0 | AC8 | Confirmed |
| **R10** | RLS-Change Test Requirement §1, §4 | The session log carries (a) the **per-site** write/read-path inventory for S1 (every `.from('<t>')` for `t` in S1, with the file:line of the client construction it uses), (b) the S2 zero-consumer census re-run at I0 with its raw output, and (c) the actor matrix of §11. | P0 | AC6 | Confirmed |

## 5. Assumptions and open questions

1. **ASSUMED, re-measured at I0:** the live grants still match grids 1 and 5. The executor's BEFORE probe is that
   measurement. An S1 or S2 table returning anything other than `200` for anon `GET` before the harden SQL, or
   `public_user_profiles` returning anything other than `42501` for anon, means the premise has drifted. **STOP and
   report `PREMISE DRIFT` with the probe output.** Do not adjust the sets. **Amended by §16.4:** a `42501` whose
   `denied_relation` is a different table than the one probed (for example `support_messages` →
   `support_tickets`) comes from an RLS policy subquery. It is not a drift, and §16.4 defines the expected value.
2. **ASSUMED:** `.env.local`'s project URL is the production project (Task 867 §5.2 made the same assumption and its
   probe confirmed it). If the probe cannot reach the project from the executor's environment, record
   `MISSING EVIDENCE` and continue. The owner's AFTER run (O80-2) then supplies both arms.
3. **UNKNOWN until the owner runs A5/A6:** the set of open write policies and anon-executable `SECURITY DEFINER`
   functions. This task **lists** them and fixes neither (§8). Expected at design time: A5 contains
   `listing_views / "Anyone can insert a view"` only, unless 865 has landed.
4. **Revoke grantor risk — measured, not assumed.** `REVOKE` removes only privileges granted by the current role. If
   any R grant was made by a grantor other than `postgres`, the owner's `REVOKE` leaves it in place. The hotfix and
   Task 867 §16.7's revokes both took effect, which suggests `postgres` is the grantor. That is an INFERENCE, so A4
   and A8 print the **grantor** of every surviving entry, and a non-zero A4 COUNT in the AFTER grid is a finding, not
   a pass.
5. **DECIDED, not open:** 871 (`role_permissions`) is not this task's. 865 (`listing_views`) is not this task's. 867
   (`pages`) is not this task's.

## 6. Pre-read rule bundle

- `docs/golden-rules.md` — GR-2, GR-4, GR-5 and GR-6 (GR-0/1/3/3a are not applicable, per §1; read GR-0 far enough to
  confirm that).
- `docs/agent-contract.md` — clauses 1, 2, 9, 9a, 10, 14, 15.
- `docs/rule-index.md` → "DB / Server Action / RLS" and "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md` — the `Q4` row and "Negative-flow applicability".
- `docs/rls-rules.md` — **"RLS-Change Test Requirement" in full**, "Security Definer Views", "Public Schema GRANT
  Discipline", "RPC EXECUTE Discipline", "Acknowledged Advisor Exceptions".
- `docs/data-access-rules.md`, `docs/qa-rules.md`.
- `docs/rls-write-path-manifest.md` — the rows for `initiateEmailChange`, `resendEmailVerification`,
  `consumeEmailChangeToken`, `updateUserProfileFull`, `deactivateUser`, `reactivateUser`.
- `docs/critical-flow-registry.md` — rows "Email change", "Admin user detail loads", "User status / role /
  account-type change".
- `docs/backlog-reserved.md` — rows **865** and **871** (boundaries only).
- `docs/orchestrator-procedures.md` → the 818/816 corollary (`Get-Content -Raw` mojibake) and "Git state — durable
  lessons".
- `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.

Do not read the UI bundles: this task changes no visible artifact.

## 7. Scope

Files the executor may create or change:

- `scripts/task-870-privilege-audit.sql` *(new)*
- `scripts/task-870-harden-privileges.sql` *(new)*
- `scripts/task-870-guard-selftest.sql` *(new)*
- `scripts/task-870-rollback.sql` *(new)*
- `scripts/task-870-anon-probe.mjs` *(new)*
- `docs/rls-rules.md`: only the sections named in §10.5
- `docs/sessions/2026-09-2?-task870-data-api-privilege-hardening.md` *(new)* and `docs/sessions/evidence/task870/**`
  (the existing `00-owner-grids-2026-09-23.txt` is **read-only**)
- `docs/backlog.md`: the 870 registry row's state cell only

## 8. Out of scope

- **Any file under `src/`.** No test file is created or edited either: the positive-permission tests this task
  relies on already exist (§11). If the executor concludes that a test must change, it stops and reports.
- **`role_permissions`** (871), **`listing_views`** (865), **`pages`** (867): no statement in any 870 script names
  these tables. The audit may list them, as read-only output.
- **Fixing A5 or A6 findings**, i.e. open write policies and anon-executable `SECURITY DEFINER` functions. Opus files
  numbered tasks from the owner's grid at review.
- **Narrowing grants on tables the app uses** (`users`, `listings`, `favorites`, …). Sprint 80's plan records this as
  a later candidate.
- **S0 remediation.** If A4's BEFORE grid shows an S0 row, the executor reports it and does not add S0 to R.
- **Dropping any table, policy or function.** This task only revokes.
- **The `supabase_admin` default-ACL rows**, which cover Supabase-owned objects.
- **`scripts/schema-drift-check.sql`.** It is modified in the worktree by an unrelated `npm run check:schema-drift`
  run on 2026-09-23 (only its timestamp line changed). Leave it alone.

## 9. Current and required behavior

| | Current (2026-09-23, after the hotfix) | Required |
|---|---|---|
| Anon/authenticated **write** to `public_user_profiles` | refused (grid 5) | refused, now also recorded in a versioned script |
| Signed-in listing detail → owner card | renders (F5) | unchanged |
| Guest listing detail → sign-in CTA | renders (F5) | unchanged |
| Admin listing preview owner block | service-role read | unchanged |
| Anon `GET /rest/v1/<t>` for `t` in R | `200` with rows filtered by RLS (grant present) | `401`/`403` with `42501` (grant absent) |
| Email change, resend, confirm (`email_change_tokens`) | service-role writes | unchanged, proven by `npm run test:auth` + F11 trace |
| Admin status/profile change writing `user_status_history`/`user_change_log` | service-role writes | unchanged, proven by `npm run test:admin` + F11 trace |
| Presence/inactivity cron writing `user_status_history` | service-role writes | unchanged, proven by the F11 trace |
| Admin `/admin/users/[id]` history sections | service-role reads | unchanged (O80-3) |
| Admin "clear history" (`history_clear_events` through the RPC) | service-role RPC | unchanged, proven by `npm run test:admin` (clearHistory smoke) |
| A table `postgres` creates tomorrow | `anon`/`authenticated` get `Dxtm` | they get nothing |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. Record `node.exe -p process.platform` (must be `win32`), `node.exe --version`, and the working directory.
2. Save `git --no-optional-locks status --porcelain` to `docs/sessions/evidence/task870/01-status-before.txt`, and
   `git hash-object` of every path that file lists as modified (` M`). That is the pre-existing-path witness for §13.2.
3. Re-run the F12 census for all fifteen S2 names with `git grep`, save the raw output, and confirm 0 `.from()` and 0
   embed hits for each. **Any hit removes that table from R.** Record the removal, and let the guard array, the
   probe list and the rollback list follow it. This is the only permitted change to R.
4. The per-site S1 trace (R10a). For every `.from('<t>')` with `t` in S1, open the enclosing function and record the
   file:line of the `createAdminClient()` / `createClient()` call that constructs the variable used. **If any site
   uses a user-scoped client, STOP and report `S1 USER-SCOPED CONSUMER` with the site.** Do not remove the table from
   R on your own.
5. Run the probe with `--phase before` (R7). Assumption 5.1 applies.

### 10.2 Order

I0 → write the audit, harden, selftest and rollback SQL → write the probe → §10.5 docs → §13.2 gate block → report.
The executor **writes** the SQL. The owner **applies** it (O80-2). The executor does not wait for that before
reporting.

### 10.3 The audit checks (R1): one statement, `with … select … union all … order by check_id, sort_key, object_name`

| Check | What it selects | Expected BEFORE (design-time) | Expected AFTER |
|---|---|---|---|
| **A1 view_write_grant** | every relation in `public` with `relkind in ('v','m')` × role in (`anon`,`authenticated`) × privilege in (`INSERT`,`UPDATE`,`DELETE`,`TRUNCATE`,`REFERENCES`,`TRIGGER`) where `has_table_privilege` is true | 0 (hotfix applied) | 0 |
| **A2 definer_view** | every `public` view whose `reloptions` does not contain `security_invoker=true`/`on`/`1`; detail = owner, `rolbypassrls`, and which of `anon`/`authenticated` hold `SELECT` | `public_user_profiles` — owner postgres, bypassrls true, authenticated only | same |
| **A3 rls_disabled_reachable** | every `relkind in ('r','p')` in `public` with `relrowsecurity = false` where `anon` or `authenticated` holds any of the 7 table privileges | 0 (865's sweep) | 0 |
| **A4 service_only_reachable** | every table in **R ∪ S0** × (`anon`,`authenticated`) × (`SELECT`,`INSERT`,`UPDATE`,`DELETE`) where `has_table_privilege` is true; detail includes the grantor(s) from `aclexplode(relacl)` for that grantee, or `PUBLIC` | > 0 (R) | **0** |
| **A5 open_write_policy** | every `pg_policies` row in `public` with `cmd in ('INSERT','UPDATE','DELETE','ALL')` and roles overlapping `{public,anon,authenticated}` whose `coalesce(qual,'') \|\| coalesce(with_check,'')` does not match `auth\.(uid\|jwt\|role)\(`; detail = policy name, cmd, qual, with_check | `listing_views` only (865) | same, unless 865 landed |
| **A6 definer_function_exec** | every `public` function with `prosecdef` where `anon` or `authenticated` has `EXECUTE`; detail = identity args | UNKNOWN | unchanged (list only) |
| **A7 default_acl_anon_auth** | every `aclexplode(defaclacl)` entry of `pg_default_acl` for `defaclrole = 'postgres'::regrole`, namespace `public`, whose grantee is `anon` or `authenticated` | 4 (F17: tables `Dxtm` ×2, sequences `w` ×2, as exploded privileges; count what `aclexplode` returns) | **0** |
| **A8 acl_snapshot** | `relacl` entries (`aclexplode`) for grantee `anon`/`authenticated` on every table in R and on `public_user_profiles`; detail = privilege_type + grantor | the exact prior state (the rollback's reference) | view: SELECT for authenticated only; R: none |

A5's regex is a **discovery filter, not a verdict**. A predicate that calls a helper function (for example an admin
check) can land in A5 while still being safe. The executor classifies each A5 row from the owner's AFTER grid in its
session log. At design time only the BEFORE grid is expected to be unknown.

### 10.4 SQL-file rules

1. Every file is UTF-8 without BOM and pure SQL plus `--` comments. There is no prose outside comments, because F23
   showed a single stray line rejects the whole batch.
2. The audit and the selftest are single statements. The selftest's only statement is the `do` block.
3. The harden script is `begin;` … `commit;`, and the guard is its first statement after `begin;`.
4. The guard block in the harden script and in the selftest must be **byte-identical except for the array literal**.
   The session log shows that with a `diff` of the two blocks.
5. Each file's header comment names: purpose, owner-run order (§13.3), what the expected grid looks like, and that it
   was written by Task 870.
6. Every `revoke` / `grant` in the harden and rollback scripts is a **literal statement naming one relation**
   (`revoke all on public.<t> from anon, authenticated;`). There is no dynamic SQL (`execute format(…)`) and no loop
   for those statements, so AC2's target list is readable from the file itself. Dynamic SQL is allowed only inside
   the read-only guard.

### 10.5 `docs/rls-rules.md` changes — only these

1. **"`SECURITY DEFINER` exception (public-facade pattern)", condition 4.** Rewrite it so that the GRANT block always
   begins with `revoke all on public.<view> from anon, authenticated;` and then grants `select` only to the roles
   that have a named consumer. Add a sentence, citing Task 870, that **no view is ever granted `INSERT`, `UPDATE`,
   `DELETE`, `TRUNCATE`, `REFERENCES` or `TRIGGER` to `anon` or `authenticated`**. The reason: an auto-updatable
   non-invoker view executes writes as its owner and bypasses the base table's RLS.
2. **"Existing known finding".** Keep the Task 268 facade decision. Add that its grants were `anon`/`authenticated`
   DML until the owner's 2026-09-23 hotfix, now recorded by Task 870's R2.
3. **"Public Schema GRANT Discipline":**
   - Add F17's measured fact (with its date and the evidence path) under "Effective dates": on this project, tables
     that `postgres` creates already get no `arwd` for `anon`/`authenticated`.
   - Add a numbered rule: after any SQL that creates or alters a `public` object, run
     `scripts/task-870-privilege-audit.sql`; A1, A3, A4 and A7 must read `0`.
   - Add the F22 rule: every owner-run read-only script returns exactly one result grid.
4. **"Existing-table audit".** Add one line saying that Task 870 extended the Task 275 audit to views, default
   privileges and functions, with the script paths. **Do not write that the SQL was applied**: the executor does not
   know that. The reviewer records it after O80-2.

Change nothing else in the file. The session log quotes each changed section before and after.

## 11. Positive and negative flows

**Positive flow (owner-run, O80-2 + O80-3):** the audit returns its BEFORE grid, the selftest fails as planted, and
the harden script applies. The AFTER audit reads 0 on A1/A3/A4/A7. The AFTER probe gets `42501` for anon on R and on
the view, and `200` for service role on R. The signed-in owner card, the guest CTA and the admin user-history
sections all still render.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Authorization — anon reaching R at the grant layer | **Yes** | R4 | `42501` | probe BEFORE `200` → AFTER `42501` (AC4) |
| Authorization — anon/authenticated writing through the view | **Yes** | R2 | `42501` | probe `PATCH` (AC4) + A1 COUNT 0 (AC5) |
| Authorization — legitimate service-role writer on S1 | **Yes** | F11 | unchanged success | `npm run test:auth`, `npm run test:admin`, R10 trace, probe service-role `200` |
| Guard fires — an R table still reachable by another path | **Yes** | R3 | exception, nothing applied | selftest (AC3); a real guard hit during O80-2 is a reported finding |
| Revoke silently ineffective (another grantor) | **Yes** | Assumption 5.4 | A4 AFTER non-zero with grantor named | A4/A8 (AC5) |
| Validation (form/input) | No | no form or action changes | N/A | — |
| Offline/network | No — for the app | the probe exits 1 on a network failure (R7) | N/A | — |
| Concurrent writer | No | DDL in one transaction; no data rows change | N/A | — |

**Actor matrix (R10c):**

| Actor | Tested how |
|---|---|
| anonymous | probe (live DB), BEFORE/AFTER |
| authenticated (user JWT) | N/A for the probe (no test credentials in the task). The grant state comes from A4/A8 AFTER, and the manual check is O80-3 |
| owner/self | `npm run test:auth` (the email-change actions write through the service role; mocked) |
| admin/moderator | `npm run test:admin` (mocked) + O80-3 manual |
| service_role | probe (live DB) `200` on R, both phases |

## 12. Acceptance criteria

- **AC1 [R1]** Given `scripts/task-870-privilege-audit.sql`, when its `--` comments and its single-quoted string
  literals are stripped, then exactly one `;` remains, at the end of the file, and none of `insert`, `update`,
  `delete`, `grant`, `revoke`, `alter`, `create`, `drop`, `truncate` remains. Privilege names such as `'UPDATE'` are
  string literals and are stripped first. Checked by the node one-liner in §13.2, whose raw output is saved.
  **The live grid is closed at review from the owner's O80-2 output:** every check A1–A8 shows a `(count)` row.
- **AC2 [R2, R4]** Given the harden script, when read, then its revoke statements name exactly the 18 R tables
  (or R after I0's permitted removals) plus `public_user_profiles`. Its `grant` statements are exactly R2's two. No
  statement names a table outside that set, and none names `role_permissions`, `listing_views` or `pages`. The node
  one-liner in §13.2 lists the names each statement targets and diffs them against the R list.
- **AC3 [R3, R6]** Given the selftest, when the owner runs it (O80-2), then it errors with a message naming
  `public_user_profiles`. Given the harden script on the live database, the guard either passes and the script
  applies, or it raises and nothing applies. A raise is reported with its full message, never worked around.
- **AC4 [R7]** Given the probe, when run `--phase before` by the executor, then every R relation returns anon `200`
  and service-role `200`, and `public_user_profiles` returns anon `401`/`403` with `pg_code 42501` for both `GET` and
  `PATCH`. When run `--phase after` by the owner after the harden script, then every R relation returns anon
  `401`/`403` with `pg_code 42501` and service-role `200`. **The pair is the two-armed proof.** A BEFORE run that
  already shows `42501` on R is `PREMISE DRIFT` (Assumption 5.1), not a pass. **Superseded in part by §16.4**, which
  adds `denied_relation`, the `support_messages` policy-subquery arm, and accepts `206` for the service role.
- **AC5 [R1, R2, R4, R5]** Given the owner's AFTER audit grid, the `(count)` rows of A1, A3, A4 and A7 read `0`, and
  A8 shows `public_user_profiles` with a single `SELECT` entry for `authenticated` and no entry for `anon`.
- **AC6 [R4, R10]** Given the R10 inventory, every S1 `.from()` site cites the `createAdminClient()` call it uses.
  `npm run test:auth` and `npm run test:admin` exit 0.
- **AC7 [R8]** Given the rollback, when read, then it grants on exactly the R tables and restores exactly F17's
  default-privilege entries. It contains no statement naming `public_user_profiles`. Its header carries the
  never-re-open-the-view warning.
- **AC8 [R9]** Given `docs/rls-rules.md`, the four sections of §10.5 carry the stated rules. `git diff` of the file
  touches no other section, and the session log quotes each section before and after.
- **AC9 [all]** `npm run build` exits 0, `check:file-integrity` and `check:mojibake` exit 0, and the final
  `git status --porcelain` shows no path outside §7 beyond the paths recorded in `01-status-before.txt`. Each of those
  pre-existing ` M` paths has an identical `git hash-object` before and after, except `docs/backlog.md`, whose diff
  is limited to the 870 row.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.` Each "exactly" names a fixed
artifact property (a file's statement count, a named set), which a correct implementation cannot violate. AC4's and
AC5's live expectations are measured outcomes with a named drift branch.

## 13. QA profile and verification plan

**Q4.** Reasons: RLS/permission security on tables behind three registered critical flows (Email change; Admin user
detail loads; User status / role / account-type change), and a data-integrity hole (F2). Required evidence: the
regression suites of those flows, the changed-behavior proof (the probe pair), the planted failure (the selftest),
the owner-native security checks (O80-2), and `npm run build`.

### 13.1 Re-entry

From scratch. The only pre-existing artifact is `00-owner-grids-2026-09-23.txt`. It is read-only, and no command
writes it.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task870"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\02-platform.txt"
node.exe scripts\task-870-anon-probe.mjs --phase before | Tee-Object "$ev\03-probe-before.txt"
node.exe -e "const fs=require('fs');for(const f of ['scripts/task-870-privilege-audit.sql','scripts/task-870-guard-selftest.sql']){const s=fs.readFileSync(f,'utf8').replace(/--.*$/gm,'').replace(/'(?:[^']|'')*'/g,'');const n=(s.match(/;/g)||[]).length;const bad=s.match(/\b(insert|update|delete|grant|revoke|alter|create|drop|truncate)\b/gi);console.log(f,'semicolons='+n,'endsWithSemicolon='+/;\s*$/.test(s),'writeKeywords='+(bad?bad.join(','):'none'))}" | Tee-Object "$ev\04-single-statement-check.txt"
node.exe -e "const fs=require('fs');const s=fs.readFileSync('scripts/task-870-harden-privileges.sql','utf8').replace(/--.*$/gm,'');const t=[...s.matchAll(/\b(revoke|grant)\b[^;]*?\bon\s+(?:table\s+)?public\.([a-z_]+)/gi)].map(m=>m[1].toLowerCase()+':'+m[2]);console.log(t.join('\n'))" | Tee-Object "$ev\05-harden-targets.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\06-test-auth.txt"
npm.cmd run test:admin *>&1 | Tee-Object "$ev\07-test-admin.txt"
npx.cmd eslint scripts\task-870-anon-probe.mjs *>&1 | Tee-Object "$ev\08-eslint-probe.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\09-check-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\10-check-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\11-build.txt"
git --no-optional-locks hash-object scripts\task-870-privilege-audit.sql scripts\task-870-harden-privileges.sql scripts\task-870-guard-selftest.sql scripts\task-870-rollback.sql scripts\task-870-anon-probe.mjs docs\rls-rules.md | Tee-Object "$ev\12-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\13-status-after.txt"
```

Expected results:
- `02` prints `win32`.
- `03`: per AC4, the BEFORE arm.
- `04`: `semicolons=1 endsWithSemicolon=true writeKeywords=none` for the audit. The selftest's `do` block contains
  PL/pgSQL, so its line is recorded and read by the reviewer (its body must contain no DDL/DML keyword other than
  those in string literals naming the guard's message).
- `05`: the revoke/grant targets for AC2.
- `06`/`07`: exit 0.
- `08`: no errors.
- `09`/`10`/`11`: exit 0; `11` ends with the route table and no error.
- `12` is the content tie for the shipped files (818 corollary).
- `13` is compared with `01-status-before.txt` for AC9.

Every command's exit code goes into the session log next to its file. Before running `build`, stop any running dev
server.

### 13.3 Owner-native steps, in order (O80-1 → O80-3), after the executor reports

```powershell
$ev = "docs\sessions\evidence\task870"
Get-Content -Raw -Encoding utf8 scripts\task-870-privilege-audit.sql | Set-Clipboard
Get-Content -Raw -Encoding utf8 scripts\task-870-guard-selftest.sql | Set-Clipboard
Get-Content -Raw -Encoding utf8 scripts\task-870-harden-privileges.sql | Set-Clipboard
Get-Content -Raw -Encoding utf8 scripts\task-870-privilege-audit.sql | Set-Clipboard
node.exe scripts\task-870-anon-probe.mjs --phase after | Tee-Object "$ev\20-probe-after.txt"
```

Run the block **one line at a time**. After each `Set-Clipboard` line, do the matching step below before running the
next line:

1. **Before anything:** Supabase → Integrations → Data API → Settings → switch "Automatically expose new tables" OFF
   → Save (O80-1).
2. After line 2: in the SQL Editor, empty the editor (Ctrl+A, Delete), paste (Ctrl+V), Run. Save the grid (Export →
   CSV or copy) as the **BEFORE audit**.
3. After line 3: same, for the **selftest**. Expected: an ERROR whose message names `public_user_profiles`. Nothing
   is changed by this step.
4. After line 4: same, for the **harden** script. Expected: `Success. No rows returned`. If it errors, stop and
   return the full message. Nothing was applied.
5. After line 5: same, for the **AFTER audit**.
6. Line 6 runs the AFTER probe.
7. O80-3: signed in, open one listing and check the owner card renders. Signed out, check the same listing shows the
   sign-in button. As admin, open `/admin/users/` for any user and check the status-history and change-log sections
   load.

Return: the BEFORE grid, the selftest error text, the harden result line, the AFTER grid, `20-probe-after.txt`, and
the three O80-3 observations.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved. The
report lists:

- the changed files, with their `12-hash-object.txt` values;
- the requirement IDs completed;
- every §13.2 command with its real exit code and evidence path;
- the I0 outputs: the platform, the S2 census raw output, the S1 per-site trace table, and any removal from R with
  its evidence;
- the BEFORE probe result, verbatim;
- the guard-block `diff` (§10.4.4);
- the `docs/rls-rules.md` before/after quotes;
- assumptions, deviations, limitations, and any `PREMISE DRIFT` / `S1 USER-SCOPED CONSUMER` / `MISSING EVIDENCE`
  stop;
- the owner steps still owed (§13.3), stated as owed and never as done.

Sonnet updates the 870 registry row in `docs/backlog.md` (state cell only) and writes the session log with a "Files
Changed" table matching the real diff.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — sets, checks, commands and stops are defined in this file; the design-time grids are persisted in the evidence file |
| One active route | Yes — Appendix C |
| Every requirement has a binary AC and a verification | R1→AC1/AC5 · R2→AC2/AC5 · R3→AC3 · R4→AC2/AC4/AC5/AC6 · R5→AC5 · R6→AC3 · R7→AC4 · R8→AC7 · R9→AC8 · R10→AC6 |
| Two-armed control that can demonstrably fail | the probe pair (grant present → absent) and the guard selftest (planted `users` → g4 must fire) |
| Detector blind spot stated | A5 is a regex discovery filter (§10.3). A6 lists and does not judge. A4 covers only R ∪ S0. A1 covers views and matviews only. The probe cannot test an authenticated JWT (§11) |
| Material absence claims traced | S2 "no consumer" = `.from()` + embed grep + whole-word review of every hit (F12), plus the SQL guard for the paths `src/` cannot show (F16). S1 "service-role only" = per-site trace required at I0 (F11 is file-level) |
| Dirty worktree handled | I0 status snapshot + hash witnesses; §13.2 comparator (AC9) |
| No owner exception claimed without a quote | Yes — 865's and 867's boundaries are quoted from their rows; 871 is a filed number, not an exception |
| Kickoff facts re-measured by the executor where state can drift | I0 steps 3–5; drift branch in Assumption 5.1 |

---

## Appendix A — Evidence preflight (task design)

| Field | Value |
|---|---|
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch` |
| Exact start step | §10.1 I0 |
| Reused artifacts | `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt` (read-only) |
| Artifacts that must not be overwritten | the same file |
| Owner decision required? | no, for 870. **871** needs one (its fix route); it is separate |

| Claim | Source inspected | Status |
|---|---|---|
| The view was writable by anon | owner grid 4 | VERIFIED (live measurement) |
| The hotfix took effect | owner grid 5 | VERIFIED |
| The view's consumers are read-only and authenticated/admin | `[slug]/page.tsx:162-176`, `preview/page.tsx:47-51`, `git grep public_user_profiles -- src` | VERIFIED |
| S1 are service-only by rule | `rls-rules.md` "user_status_history Access Policy", "Email-Change Token Policy", "Per-role GRANT discipline" | VERIFIED |
| S1 consumers use the admin client | file-level grep; two sites opened | **PARTIAL** — per-site trace is I0 step 4, with a STOP branch |
| S2 has no `src` consumer | `git grep` `.from()` + embed, whole-word hits reviewed | VERIFIED for `src/`; paths outside `src/` → the R3 guard |
| 871 exists | `permissions.ts:6-18` + grid 1 `role_permissions auth_sel=f` | VERIFIED code path; runtime denial INFERENCE |
| The SQL Editor shows only the last grid | the owner's 2026-09-23 run + commit `2164663e5` message | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule source and clause | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `rls-rules.md` → RLS-Change Test Requirement §1 | changes DB permissions | write-path inventory | R10a, AC6 | COMPLIANT |
| same §2 | same | positive permission test on actual action code | `test:auth` (email-change actions), `test:admin` (`updateUserProfileFull`, `clearHistory`) run the real actions with a mocked admin client; live service-role `200` in the probe | COMPLIANT |
| same §3 | same | negative permission test | the probe pair (live DB, anon) | COMPLIANT |
| same §4 | same | actor matrix | §11 | COMPLIANT |
| same §5 | same | runtime proof after the change | O80-2 AFTER probe + O80-3 | COMPLIANT (owner-native, per Q4) |
| `rls-rules.md` → Public Schema GRANT Discipline | grants change | template + per-role discipline | R4/R5 + §10.5.3 | COMPLIANT |
| `rls-rules.md` → Security Definer Views, condition 4 | the view's grants | minimal grants | R2; rule text tightened in §10.5.1 | COMPLIANT |
| `agent-contract` 9 | non-Q0 | `npm run build` exit 0 | §13.2 `11-build.txt` | COMPLIANT |
| `agent-contract` 14 | new files | UTF-8 no BOM, no mojibake; the probe reads `.env.local` through Node | §10.4.1, R7, `09`/`10` | COMPLIANT |
| `agent-contract` 15 + `critical-flow-registry.md` | Email change, User status change, Admin user detail | automated regression | `test:auth`, `test:admin` | COMPLIANT |
| `qa-profiles.md` Q4 | security | regression + changed-behavior test + planted failure + owner-native | §13.2 + §13.3 | COMPLIANT |
| 818/816 corollary | the probe reads `.env.local`; the owner copies SQL to the clipboard | Node `fs`; `-Encoding utf8` | R7; §13.3 | COMPLIANT |
| 818 corollary (hash in the final block) | new scripts | `git hash-object` in the gate block | `12-hash-object.txt` | COMPLIANT |
| `backlog-reserved.md` 865 owner scope lock 2026-09-21 | a neighbouring scope | do not widen 865; do not touch `listing_views` | §8, AC2 | COMPLIANT |
| GR-0 / GR-1 / GR-3 / GR-3a | UI rules | — | NOT APPLICABLE: no visible artifact, no `src/` change (§1, §8) | NOT APPLICABLE |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Task | 870 |
| Active route | single route: write the five scripts + the docs; the owner applies |
| Decision source | owner instruction 2026-09-23 (quoted in the header) |
| Starting worktree mode | dirty (unrelated Task 867 work and an unrelated `schema-drift-check.sql` timestamp) — I0 snapshot + hash witnesses |
| Exact allowed final write set | §7 |
| Blocked rule or decision | none |

| # | Checkpoint | Producer → artifact | Comparator / failure |
|---|---|---|---|
| 0 | Platform + status snapshot | I0 steps 1–2 → `01-status-before.txt`, `02-platform.txt` | platform ≠ `win32` → stop |
| 1 | S2 census | `git grep` → session log | any hit → remove from R with evidence (the only allowed R change) |
| 2 | S1 per-site trace | reading the source → session log table | a user-scoped site → STOP `S1 USER-SCOPED CONSUMER` |
| 3 | BEFORE probe | `task-870-anon-probe.mjs --phase before` → `03` | R not `200` for anon, or view not `42501` → STOP `PREMISE DRIFT`; network failure → exit 1 → `MISSING EVIDENCE` |
| 4 | Scripts written | executor → five files | `04` single-statement check; `05` target list vs R (AC2) |
| 5 | Docs | executor → `rls-rules.md` | `git diff` limited to §10.5 sections (AC8) |
| 6 | Gates | §13.2 → `06`–`11` | any non-zero exit → `PARTIALLY IMPLEMENTED` |
| 7 | Final state | `12`, `13` | `13` vs `01`: no path outside §7; ` M` hash witnesses equal (AC9) |
| 8 | Owner apply | O80-2 → BEFORE/AFTER grids, selftest error, `20-probe-after.txt` | selftest does not error → guard defect (NEEDS REVISION); A1/A3/A4/A7 AFTER ≠ 0 → finding; probe AFTER R ≠ `42501` → finding |

| Contract claim | Counterexample | Evidence | Required outcome |
|---|---|---|---|
| The guard can fail | a planted `users` (a view depends on it) | ANALYTICAL at design time (the F2 view DDL); EXECUTED at O80-2 | selftest errors naming `public_user_profiles` |
| The probe distinguishes grant from RLS | R before the revoke returns `200` (RLS filters) | EXECUTED at checkpoint 3 | BEFORE `200` / AFTER `42501` |
| A zero COUNT is not a missing check | every check prints a `(count)` row even at 0 | AC1 / AC5 | a check with no `(count)` row → AC1 fails |
| The revoke could be silently ineffective | a grantor ≠ `postgres` | A4/A8 print the grantor | A4 AFTER non-zero → finding, not a pass |
| Unexpected write path | a user-scoped S1 site | checkpoint 2 | STOP |

---

## 16. Revision 1 — review 1, 2026-09-23 (`NEEDS REVISION`)

**Re-entry mode: `remediation`.** Start at §16.5. Keep every file in `docs/sessions/evidence/task870/` (`00`–`13`,
`i0-*`, `guard-block-diff-check.txt`) **as is**. They are the revision-0 record, so do not overwrite them. Write
revision evidence as `r1-NN-*.txt` in the same folder. I0 (§10.1) is **not** re-run, and R and the three sets do not
change. The S1 per-site trace (session log, I0 step 4) and the S2 census are **accepted**, and the reviewer
spot-checked eight of the construction lines. `docs/rls-rules.md` and `scripts/task-870-rollback.sql` are
**accepted and must not change**.

### 16.1 F1 — P2 — the selftest cannot name `public_user_profiles` (R3, R6, AC3)

- **Observed:** in `scripts/task-870-harden-privileges.sql` (and the byte-identical block in
  `scripts/task-870-guard-selftest.sql`), g4 counts dependent views, and its violation text is
  `format('g4: a view depends on %s', v_name)`. That message names only the **table**. For the planted
  `array['users']`, the exception reads `… g4: a view depends on users`, and `public_user_profiles` never appears.
  AC3 and R6 require the selftest error to name `public_user_profiles`, and the selftest's own header promises it.
  As shipped, O80-2 step 3 fails AC3 even though the guard works.
- **Required:** in both files, replace the g4 count with the names of the dependent views:
  `select string_agg(distinct vc.relname, ',' order by vc.relname) into v_dep_names …` (same joins and filters as
  now), and raise when it is not null, with
  `format('g4: view(s) %s depend on %s', v_dep_names, v_name)`. Declare `v_dep_names text;` and remove
  `v_dep_count`. The two blocks stay byte-identical except for the array literal (§10.4.4).

### 16.2 F2 — P3 — g2 calls `pg_get_functiondef` on every `pg_proc` row (R3)

- **Observed:** g2 runs `pg_get_functiondef(p.oid)` for every function in `public`. `pg_get_functiondef` raises an
  error for an aggregate (`"<name>" is an aggregate function`). If `public` contains one, the guard aborts with an
  error unrelated to any violation, and the harden script cannot apply. Whether `public` holds an aggregate is
  **UNKNOWN**.
- **Required:** add `and p.prokind in ('f', 'p')` to g2's `where`, in both files.

### 16.3 F3 — P2 — A8 has no schema filter (R1, AC5)

- **Observed:** `a8_detail` joins `pg_class` to `r_tables` on `relname` alone. A1, A3, A4 and A2 all filter
  `n.nspname = 'public'`; A8 does not. Any same-named relation in another schema enters A8. Supabase ships schemas
  other than `public` (for example `realtime`), and `messages` is one of R's names. The AFTER grid could therefore
  show `anon`/`authenticated` entries that belong to a different table, which would falsely fail AC5, or hide which
  table they belong to.
- **Required:** join `pg_namespace` in `a8_detail` and filter `n.nspname = 'public'`, the same way `a4_detail`
  does.

### 16.4 F4 — P2 — orchestration defect: the probe cannot tell a grant refusal from a policy-subquery refusal (R7, AC4)

- **Measured by the reviewer, 2026-09-23** (one anon `GET /rest/v1/support_messages?select=*&limit=0`, win32):
  `status 401 code 42501 message permission denied for table support_tickets`. The refusal comes from a
  `support_messages` RLS policy that reads `support_tickets`, where `anon` has no `SELECT` (grid 1). It does not
  come from a grant change on `support_messages`. **The "PREMISE DRIFT" of revision 0 is resolved: no drift.**
  `anon` still holds `SELECT` on `support_messages`, and R stays unchanged. The executor handled it correctly: it
  stopped, did not adjust the sets, and reported.
- **Why this is a task defect:** R7 told the probe to print `pg_code` and nothing else, so a policy-subquery `42501`
  and a grant `42501` look identical. For `support_messages`, AC4's BEFORE (`200`) cannot happen, and its AFTER
  (`42501`) would prove nothing.
- **Required:** the probe also prints `denied_relation=<name>` for every non-2xx response. Take it from the PostgREST
  `message` with `/permission denied for (?:table|view|relation) ([A-Za-z0-9_."]+)/`, or print `null` when the
  message does not match. The message text itself stays unprinted. A relation name is not a secret, and nothing else
  from the body is printed.
- **AC4 as amended** (supersedes the corresponding clauses of §12 AC4):
  - **BEFORE** (executor):
    - each of the 17 R tables other than `support_messages` returns anon `200`;
    - `support_messages` returns anon `401`/`403` `42501` with `denied_relation=support_tickets`;
    - the service role returns `200` **or `206`** (the `Range: 0-0` header produces `206` on non-empty tables);
    - `public_user_profiles` returns anon `401`/`403` `42501` with `denied_relation=public_user_profiles` for both
      `GET` and `PATCH`.
  - **AFTER** (owner): every R table **including `support_messages`** returns anon `401`/`403` `42501` with
    `denied_relation` equal to **that table's own name**. The grant check runs before RLS, so after the revoke the
    refusal names the probed table, and that is what distinguishes the fix from the policy. The service role returns
    `200`/`206`.
  - Any other combination is a finding, never a pass.
- **Assumption 5.1 amended accordingly:** the `support_messages` BEFORE arm above is expected, not a drift.

### 16.5 Gate block for revision 1 (executor, Windows PowerShell, project root)

Restore nothing and plant nothing. The SQL cannot run in the executor's environment. The guard's failing arm is
still proven by the owner's selftest run (O80-2 step 3), and the ACs below are static checks on the corrected files.

```powershell
$ev = "docs\sessions\evidence\task870"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r1-01-platform.txt"
node.exe scripts\task-870-anon-probe.mjs --phase before | Tee-Object "$ev\r1-02-probe-before.txt"
node.exe -e "const fs=require('fs');for(const f of ['scripts/task-870-privilege-audit.sql','scripts/task-870-guard-selftest.sql']){const s=fs.readFileSync(f,'utf8').replace(/--.*$/gm,'').replace(/'(?:[^']|'')*'/g,'');const n=(s.match(/;/g)||[]).length;const bad=s.match(/\b(insert|update|delete|grant|revoke|alter|create|drop|truncate)\b/gi);console.log(f,'semicolons='+n,'endsWithSemicolon='+/;\s*$/.test(s),'writeKeywords='+(bad?bad.join(','):'none'))}" | Tee-Object "$ev\r1-03-single-statement-check.txt"
node.exe -e "const fs=require('fs');const D=String.fromCharCode(36,36);const g=f=>{const L=fs.readFileSync(f,'utf8').split(/\r?\n/);const i=L.indexOf('do '+D);const j=L.indexOf('end '+D+';',i);return L.slice(i,j+1)};const a=g('scripts/task-870-harden-privileges.sql'),b=g('scripts/task-870-guard-selftest.sql');const d=a.map((l,i)=>l===b[i]?null:i+1).filter(Boolean);console.log('lines',a.length,b.length,'differing',JSON.stringify(d));for(const f of ['scripts/task-870-harden-privileges.sql','scripts/task-870-guard-selftest.sql']){const s=fs.readFileSync(f,'utf8');console.log(f,'g4_names_views='+/string_agg\(distinct vc\.relname/.test(s),'g4_msg='+/g4: view\(s\) %s depend on %s/.test(s),'g2_prokind='+/prokind in \('f', 'p'\)/.test(s))}" | Tee-Object "$ev\r1-04-guard-check.txt"
node.exe -e "const s=require('fs').readFileSync('scripts/task-870-privilege-audit.sql','utf8');const a8=s.slice(s.indexOf('a8_detail as ('),s.indexOf('combined as ('));console.log('a8_public_filter='+/nspname = 'public'/.test(a8))" | Tee-Object "$ev\r1-05-a8-filter-check.txt"
npx.cmd eslint scripts\task-870-anon-probe.mjs *>&1 | Tee-Object "$ev\r1-06-eslint-probe.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r1-07-check-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r1-08-check-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r1-09-build.txt"
git --no-optional-locks hash-object scripts\task-870-privilege-audit.sql scripts\task-870-harden-privileges.sql scripts\task-870-guard-selftest.sql scripts\task-870-rollback.sql scripts\task-870-anon-probe.mjs docs\rls-rules.md | Tee-Object "$ev\r1-10-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\r1-11-status-after.txt"
```

Expected results:
- `r1-02`: the AC4 BEFORE arm as amended in §16.4, including `denied_relation=support_tickets` on `support_messages`.
- `r1-03`: the audit line reads `semicolons=1 endsWithSemicolon=true writeKeywords=none`.
- `r1-04`: `differing` is a single line (the array literal), and all three flags read `true` for both files.
- `r1-05`: `a8_public_filter=true`.
- `r1-06` to `r1-09`: exit 0.
- `r1-10`: the rollback and `rls-rules.md` hashes equal the revision-0 values in `12-hash-object.txt`, because
  neither may change.

Record each exit code in the session log.

### 16.6 Completion report for revision 1

Report:
- the three changed scripts' new hashes, with the corrected g2/g4 lines and the A8 filter quoted;
- the probe's new `denied_relation` output line format;
- `r1-02` verbatim;
- the `r1-04` and `r1-05` results;
- the exit codes of `r1-06` to `r1-09`.

Add a `## Revision 1` section to the existing session log (do not create a new log), and record there that the
revision-0 PREMISE DRIFT is resolved by §16.4. Set the 870 backlog row to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.

**Scope:**
- **May change:** `scripts/task-870-harden-privileges.sql`, `scripts/task-870-guard-selftest.sql`,
  `scripts/task-870-privilege-audit.sql`, `scripts/task-870-anon-probe.mjs`, the session log, `r1-*` evidence, and
  the backlog row.
- **Must not change:** anything else.

No git command other than the read-only ones in §16.5.
