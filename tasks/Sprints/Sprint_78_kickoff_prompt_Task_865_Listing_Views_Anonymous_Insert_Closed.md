# Task 865 — close the one live anonymous write path: `listing_views` → `"Anyone can insert a view"`

**Sprint 78** (hosted by discovery, not goal fit; the owner may move it) · **P2** · **Q4** (RLS / write-path
security) · Track B (non-UI) · filed 2026-09-21 by Task 850's owner-native closure · kickoff written 2026-09-27 ·
owner action **O78-8** · **Status: revision 1 (§17.4) applied 2026-09-30 by Opus at the owner's request — verify `37be33eb`; awaiting
the owner's O78-8 continuation (§17.5); the close script is NOT applied yet; R6 is the Opus closure review's (§16.3)**

Executor: run this file through the `execute-task` workflow. Your strongest permitted completion status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. You never approve, and you never emit or run a mutating Git command.
You **write** the SQL; the owner **applies** it in the Supabase SQL Editor (O78-8). You never connect to the database.

## 1. Mode and task type

- Mode: `TASK DESIGN` → implementation handoff.
- Task type: **DB / RLS** (one policy, one table's `anon` grants) + the rule doc that records it. No UI, no `src/`
  change, no visible text.
- Execution state: `from-scratch`, in **two executor stages** separated by one owner step (§10.2). The split is
  required, not stylistic: the verification SQL must insert a row that satisfies the table's `NOT NULL` columns, and
  those columns are recorded nowhere in this repository (§3.5).
- GR-1 / GR-3 / GR-3a / GR-3b / GR-3c: **not applicable** — no visible surface, Story or user-facing text changes.

## 2. Objective

An unauthenticated caller holding the public anon key can today insert rows into `public.listing_views` straight
through PostgREST, bypassing `record_listing_view` and every guard (24 h de-dup, IP hash, listing-status filter)
that the documented exception relies on. Close that path — drop the policy and revoke `anon`'s `INSERT`/`UPDATE`/
`DELETE` on that table — and prove, before and after, that the refusal is now a **grant** refusal and that view
tracking through `record_listing_view` still records a view.

**Scope is locked narrow by owner decision, 2026-09-21, verbatim:** *"865 залишити вузьким: закрити реальний anon
INSERT до listing_views; не роздувати його в повний schema-wide аудит."* Every schema-wide figure in §3 is context
for why this is sufficient, never a deliverable.

## 3. Verified context

Measurements dated 2026-09-21 come from Task 850's owner-native closure and were moved here from
`docs/backlog-reserved.md` (row deleted in the same commit as this kickoff). **They are design-time records: the
BEFORE audit (O78-8 step 1) re-measures every one of them, and only that grid counts as execution evidence.**

### 3.1 The open path

- Policy `"Anyone can insert a view"` on `public.listing_views`: `PERMISSIVE`, `cmd INSERT`, `roles {public}`,
  `qual NULL`, `with_check = true`. Measured 2026-09-21 (850 closure) and again **2026-09-23** in Task 870's audit,
  BEFORE and AFTER: `A5 (count) 1   listing_views | Anyone can insert a view | cmd=INSERT | qual= | with_check=true`
  (`docs/sessions/evidence/task870/20-owner-o80-2-o80-3.txt:14,38`). **FACT.** Task 870 did not touch it.
- It is the **only** write-capable policy in `public` whose predicate does not reference `auth.uid()`/a role helper
  (predicate scan 2026-09-21; confirmed by 870's A5 = 1). The other 24 tables whose write policies list `public` are
  predicate-neutralised (NULL `auth.uid()` for an anonymous request). **FACT (2026-09-21/23).** Not this task's scope.
- `anon` holds a direct `INSERT` grant on `listing_views`, and `UPDATE`/`DELETE` grants that **no** policy admits
  (2026-09-21). The repo's own declaration grants it: `scripts/grant-discipline-audit.sql:218-219`
  (`-- listing_views — acknowledged exception: anon INSERT for view tracking.` / `grant insert on public.listing_views to anon;`).
  **FACT** (file read). Re-running that file after the fix would re-open the path — hence R4.
- `authenticated`'s grants on `listing_views`: **UNKNOWN** (never measured). With the policy dropped, no policy admits
  any `authenticated` write, so an `authenticated` write is refused for the RLS reason whatever its grant. This task
  measures and reports them; it does **not** revoke them (owner's narrow scope; §8).

### 3.2 Why the documented exception is false

`docs/rls-rules.md:437` (Acknowledged Advisor Exceptions, `0024_permissive_rls_policy`) justifies the policy with
*"Guards live in `record_listing_view` RPC (rate limit, IP hash)"* and already carries a ⚠️ note that the rationale was
falsified 2026-09-21. Task 270's policy comment claims *"This policy enables the RPC to INSERT inside its SECURITY
DEFINER context"* (`docs/sessions/2026-05-28-task-270-rls-insert-tightening.md:187-193`). **FACT** (both read). That
claim is what §10.3's guard and O78-8's RPC arm test: a `SECURITY DEFINER` function runs as its owner, and an owner
with `BYPASSRLS` (or the table's owner without `FORCE ROW LEVEL SECURITY`) needs no policy.
`docs/rls-rules.md:410-411` also cites `listing_views` as the example of an "acceptable intentional exception". **FACT.**

### 3.3 Nothing in the application writes the table directly

- `git grep -n "listing_views"` over `src/`: one hit, a doc comment (`src/modules/analytics/activity/types.ts:29`).
  **FACT.**
- The only writer is `record_listing_view`, called from `src/app/api/listings/[slug]/view/route.ts:60` through
  `createAdminClient()` (service role, `:24`) with `p_listing_id`, `p_user_id`, `p_ip_hash` (`:60-64`). The route
  filters bots (`:21-22`), resolves the listing with the public status set (`:27-33`), excludes the owner (`:40-42`)
  and returns `{ ok: true, recorded: true }` when the RPC reports a new row (`:71`). **FACT** (read in full).
- `record_listing_view(uuid, uuid, text)` is `SECURITY DEFINER` (Task 269 comment,
  `docs/sessions/2026-05-28-task-269-rpc-execute-hardening.md:248-254`). `anon`/`authenticated` hold `EXECUTE`
  (870 A6, 2026-09-23). Its **owner** and the owner's `rolbypassrls`: **UNKNOWN** — measured by V6 (§10.3). For
  context only: in the same project `postgres` reads `bypassrls=true` (870 A2, 2026-09-23).
- `anon`'s `EXECUTE` on `record_listing_view` is a separate, still-acknowledged exception (`rls-rules.md:436`,
  `0028/0029`); it is **not** in scope and stays.

### 3.4 Impact of leaving it

Rows inserted through the open path feed Task 849's `listing_activity_daily.recorded_views`
(`scripts/task-849-listing-activity-daily.sql:125-131` counts `listing_views` by `viewed_at`), the data source of the
853/855/856 dashboards. `UPDATE`/`DELETE` have no admitting policy, so the live exposure is **insert-only**. **FACT /
INFERENCE** (the dashboard consequence follows from the 849 SQL read).

### 3.5 What this repository does not know about the table

`listing_views`' column list, `NOT NULL`/default set, foreign keys, owner and `relforcerowsecurity` are **UNKNOWN**:
there is no `supabase/` directory, no `CREATE TABLE` for it in `scripts/`, and no generated type. Only `listing_id`
and `viewed_at` are evidenced (849 SQL `:126-131`). That is why stage 2 (§10.2) exists.

### 3.6 SQL conventions this project already enforces (restated so this file stands alone)

- Changes ship as `scripts/task-NNN-*.sql`, owner-run in the Supabase SQL Editor; there is no migrations directory.
- Every read-only script returns **exactly one** result grid; a batch with a stray prose line is rejected whole — pure
  SQL plus `--` comments only (`rls-rules.md:241-243`; Task 870 F22/F23).
- A write script is one transaction: step-0 guard that raises and applies nothing, the change, a post-condition that
  raises and rolls back on mismatch, then `notify pgrst, 'reload schema'` — see
  `scripts/task-881-notifications-least-privilege.sql:1-60` (read).
- A live probe classifies each refusal as `grant` (`/permission denied for (?:table|relation) listing_views/i`),
  `rls` (`/row-level security/i`), `none` (2xx) or `other`, and never prints a key or row content — see
  `scripts/task-881-notifications-probe.mjs:1-45` and `scripts/task-870-anon-probe.mjs` (read).
- `SET LOCAL ROLE anon` inside `begin; … rollback;` is the established way to test a role in the SQL Editor
  (`scripts/task-867-verify.sql:31-37`).
- After any SQL that alters a `public` object, run `scripts/task-870-privilege-audit.sql` (`rls-rules.md:237`). Its
  A5 row is expected to go from `1` (listing_views) to `0` (its own header, `:21`: *"A5=1 or 0 (listing_views, owned
  by Task 865)"*).

### 3.7 Folded-in question: one guest `listing_contact_events` row that should not exist

Carried from the reserved row (2026-09-21): `listing_contact_events` holds one row dated `2026-08-20 19:24:15+00`
with `actor_user_id is null`, written **after** `scripts/task-289-listing-contact-events-anon-revoke.sql`
(2026-05-29) dropped `events_insert_anon`. Design-time trace, read this session:

- Between `fbc0b947d` (2026-05-29) and `7f22f8ca3` (2026-09-20, Task 850), `trackListingContactEvent` inserted through
  the **user-scoped** `createClient()` with `actor_user_id = user?.id ?? null` (`git show fbc0b947d:src/modules/listings/actions/contactEvents.ts:23-50`).
  A guest call would therefore reach the table as `anon` with a null actor. **FACT.**
- Task 289's header asserts "task-277 … has ALREADY been applied"; nothing in the repository records **when** 289
  itself was applied. **UNKNOWN.**
- Candidate explanations (none verified): 289 applied later than its commit; a manual SQL/service-role insert; a
  path not in this repository. **INFERENCE — ranked by nothing yet.**

This is a **read-only investigation with a written conclusion**, not a fix: R7.

### 3.8 Worktree at design time (read-only `git --no-optional-locks status --porcelain`, 2026-09-27)

Fifteen entries, all **Task 854**'s (Track A, in progress): `M messages/{en,it,sq,uk}.json`,
`M src/components/layout/{MobileNavDrawer,UserMenu}.tsx`, `M src/design-system/mantine/patterns/MantineDataTableToCards.tsx`,
`M src/design-system/mantine/theme.ts`, `M src/stories/mantine/primitives/{MobileNavDrawer,Table,UserMenu}.stories.tsx`,
`?? docs/sessions/evidence/task854/`, `?? src/app/[locale]/cabinet/statistics/`,
`?? src/modules/cabinet/statistics/components/`, `?? src/stories/fixtures/agentStatistics.fixtures.ts`. All
`EXCLUDED AS UNRELATED`; none is in §7. The gates this task runs (`check:*-grants`) read only `scripts/*.sql`.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row ①; owner 2026-09-21 | After O78-8, `public.listing_views` has no policy named `"Anyone can insert a view"`, and `anon` holds none of `INSERT`, `UPDATE`, `DELETE` on it. | P0 | AFTER audit V1/V2; close script post-condition | Confirmed |
| R2 | §3.2; reserved row ④ | The close script refuses to apply (raises, nothing changed) unless `record_listing_view(uuid, uuid, text)` is `SECURITY DEFINER` **and** its owner either has `rolbypassrls` or owns `listing_views` while `relforcerowsecurity` is false. | P0 | guard source; AFTER RPC arm | Confirmed |
| R3 | reserved row ⑤ | Two-armed proof: an `anon` insert **succeeds past grant and RLS** BEFORE (row inserted then rolled back, or a foreign-key error, which is raised only after both), and is refused **for the grant reason** AFTER (`permission denied for table listing_views`). The PostgREST probe records the same shift. | P0 | verify parts (a); probe | Confirmed |
| R4 | §3.1 | `scripts/grant-discipline-audit.sql` no longer grants anything on `listing_views` to `anon`; its `service_role` grant line stays. `check:notifications-grants` and `check:listing-reports-grants` (both read that file) still exit 0. | P1 | diff; §13.2 | Confirmed |
| R5 | reserved row ④ | View tracking still records: AFTER, `record_listing_view` called as `service_role` inside a rolled-back transaction returns `true` and adds exactly one row visible inside that transaction; and one real guest page view on production returns `{"ok":true,"recorded":true}`. | P0 | verify part (c); O78-8 step 9 | Confirmed |
| R6 | reserved row ② | `docs/rls-rules.md`: the `:437` row records the closure (date = O78-8 apply date, what was dropped/revoked, and V6's owner/bypass fact) and loses the "falsified" warning; `:410-411`'s parenthetical `listing_views` example is removed. No other line of that file changes. **Owner of the edit: Opus, in the closure review (§16.3) — never the executor** (review 1). | P1 | diff at closure | Confirmed |
| R7 | reserved row "fold in" | The 2026-08-20 guest row is investigated read-only and concluded in the session log as `EXPLAINED` (with the evidence) or `UNKNOWN` (with what would decide it). If the evidence shows a path that is **still** live, stop and report it; do not fix it here. | P3 | V7 grid; session log | Confirmed |
| R8 | §3.1 | `authenticated`'s privileges on `listing_views` are measured BEFORE and AFTER and reported; they are not changed. The AFTER `authenticated` insert arm is refused for the RLS reason. | P2 | V1; verify part (b) | Confirmed |
| R9 | `rls-rules.md:237` | `scripts/task-870-privilege-audit.sql` run AFTER reads A5 `(count) 0`; A1, A3, A4, A7 unchanged from their 2026-09-23 AFTER values (`0`). | P1 | O78-8 step 8 | Confirmed |
| R10 | agent-contract 10 | Rollback script restores exactly the BEFORE state recorded by V1/V2; session log with a Files Changed table; backlog cell updated; `docs/backlog.md` ≤ 80 lines. | P2 | read-after-write | Confirmed |

## 5. Assumptions and open questions

- **A1 (INFERENCE):** a foreign-key violation (`23503`) in the BEFORE insert arm proves the row passed the privilege
  check and the RLS `WITH CHECK`: PostgreSQL enforces foreign keys with `AFTER` row triggers, which run after both.
  `NOT NULL` violations are **not** used as evidence — their order relative to RLS is not relied on — which is why
  stage 2 supplies every `NOT NULL` column without a default.
- **A2 (INFERENCE):** a `PATCH`/`DELETE` by `anon` BEFORE returns 2xx with zero rows (no admitting policy filters every
  row) and AFTER returns the grant refusal. If BEFORE instead shows a grant refusal, record it — it means one of those
  grants was already gone, and the reserved row's 2026-09-21 reading is stale for it.
- Open owner questions: **none**. The narrow scope and every deliverable come from the owner decision in §2 and the
  reserved row it governs.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 9, 10, 14) · `docs/rule-index.md` → "DB / Server Action /
RLS" · `docs/qa-profiles.md` (Q4) · `docs/rls-rules.md` → "Public Schema GRANT Discipline" (incl. `:228-259`), "RLS
INSERT Policy Discipline", "Acknowledged Advisor Exceptions" · `docs/data-access-rules.md` (service-role rules) ·
`docs/qa-rules.md` · `docs/orchestrator-procedures.md` → the 818/819 encoding corollary · the three pattern files named
in §3.6 · this kickoff. Nothing else.

## 7. Scope — the exact allowed write set

1. `scripts/task-865-listing-views-audit.sql` (new; stage 1) — read-only, one grid.
2. `scripts/task-865-close-anon-insert.sql` (new; stage 2) — the change.
3. `scripts/task-865-rollback.sql` (new; stage 2).
4. `scripts/task-865-verify.sql` (new; stage 2) — parts run separately.
5. `scripts/task-865-anon-probe.mjs` (new; stage 2).
6. `scripts/grant-discipline-audit.sql` — lines `:218-219` only (R4).
7. ~~`docs/rls-rules.md`~~ — **not an executor path** (review 1). `docs/*rule*.md` is read-only for Sonnet under the
   `execute-task` policy-file boundary, which no allowed-files list can override, and R6's text needs the O78-8 step 4
   apply date, which does not exist at stage 2. Opus makes the R6 edit in the closure review (§16.3).
8. `docs/sessions/2026-MM-DD-task865-listing-views-anon-insert.md` (new) and `docs/sessions/evidence/task865/` (new).
9. `docs/backlog.md` — the 865 text inside the reserved-registry row only.

## 8. Out of scope (owner-locked, 2026-09-21)

- Any other table, policy or grant; any schema-wide revoke; `authenticated`'s grants on `listing_views` (measured only);
  `TRUNCATE`/`REFERENCES`/`TRIGGER` on `listing_views` (reported by V1 if present, not changed — PostgREST exposes none
  of them).
- `record_listing_view`'s body, signature and `EXECUTE` grants, and `rls-rules.md:436`'s `0028/0029` row.
- `listing_contact_events` of any kind beyond R7's read-only query; its dead guest columns (the retired-866 P3 note).
- Any `src/` file. Every Task 854 path in §3.8.
- A new CI gate for `listing_views` grants. (Not in the owner's deliverable list; R4 removes the only declaration that
  could silently re-grant it.)

## 9. Current and required behavior

| | Current (2026-09-21/23) | Required after O78-8 |
|---|---|---|
| Anonymous `POST /rest/v1/listing_views` | accepted (policy `with_check = true` + grant) | refused, grant reason |
| Anonymous `PATCH`/`DELETE` | 2xx, zero rows (no policy) | refused, grant reason |
| Authenticated insert through PostgREST | admitted by the `{public}` policy (grant UNKNOWN) | refused (RLS reason, or grant reason if no grant) |
| `/api/listings/[slug]/view` guest view | recorded once per 24 h per fingerprint | **unchanged** |
| `record_listing_view` via `service_role` | inserts | **unchanged** |
| `anon` `EXECUTE` on `record_listing_view` | yes | **unchanged** |
| 870 audit A5 | 1 | 0 |
| `grant-discipline-audit.sql` | grants `anon` insert | grants nothing to `anon` on this table |

## 10. Implementation requirements

### 10.1 I0 — before any write (stage 1)

1. `node.exe -p "process.platform + ' ' + process.version"` → `win32`.
2. Save `git --no-optional-locks status --porcelain` to `docs/sessions/evidence/task865/00-start-status.txt` and the
   SHA-256 of every §3.8 entry to `00-start-manifest.txt`. If any §7 path is already modified or present, **STOP —
   `BLOCKED — WRITE PATH NOT CLEAN`**.
3. Run `npm.cmd run check:notifications-grants` and `npm.cmd run check:listing-reports-grants`; save both (baseline:
   exit 0, measured 2026-09-27).
4. Re-read `scripts/grant-discipline-audit.sql:215-221` and `docs/rls-rules.md:405-420,430-440`. If the cited lines
   moved, work from their content, and record the new line numbers.

### 10.2 Two stages

- **Stage 1** — I0, then write `task-865-listing-views-audit.sql` (§10.3). Start the session log. End with status
  `BLOCKED — AWAITING O78-8 STEP 1 (BEFORE AUDIT GRID)` and the owner block of §13.3 step 1 only.
- **Owner** — runs step 1, returns the grid.
- **Stage 2** (a fresh session reads this file and the session log) — save the owner's grid verbatim to
  `docs/sessions/evidence/task865/10-before-audit.txt`; write files 2–5 of §7 from it (§10.4–§10.6); edit file 6 (file 7 is Opus's, §16.3);
  run §13.2; report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with O78-8 steps 2–9 stated as **owed**.

### 10.3 `task-865-listing-views-audit.sql` — read-only, one grid, one row per fact

Shape: a single top-level `with … select` returning columns `check_id, ord, object_name, detail`, ordered by
`check_id, ord, object_name`, every check printing a `(count)` row first even when 0 (870's shape, `:193-195`).

| Check | Content |
|---|---|
| V1 | For `anon`, `authenticated`, `service_role` × `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`: `has_table_privilege(role, 'public.listing_views', priv)` — every true row |
| V2 | Every `pg_policies` row on `public.listing_views`: `policyname, permissive, cmd, roles, qual, with_check` |
| V3 | Every column: `column_name, data_type, is_nullable, column_default` |
| V4 | Every constraint: `conname, contype, pg_get_constraintdef(oid)` |
| V5 | Table: `relrowsecurity`, `relforcerowsecurity`, owner, owner's `rolbypassrls` |
| V6 | `record_listing_view(uuid, uuid, text)`: `prosecdef`, owner, owner's `rolbypassrls`, `proconfig`, whether `prosrc` mentions `listing_views`, and `has_function_privilege` for the three roles |
| V7 | `listing_contact_events` rows with `actor_user_id is null`: `id, listing_id, channel, source, locale, is_owner_click, created_at` — no other column |

No write, no `set role`, pure SQL + `--` comments. The header states the run point (BEFORE and AFTER) and the expected
AFTER values (V1: no `anon` I/U/D row; V2: the policy absent; V5–V7 unchanged).

### 10.4 `task-865-close-anon-insert.sql` — one transaction

`begin;` → **step 0 guard** in one `do $$ … $$` that collects every violation and raises once:
g1 `listing_views` exists as a table with RLS enabled; g2 `record_listing_view(uuid, uuid, text)` exists and is
`SECURITY DEFINER`; g3 its owner has `rolbypassrls`, **or** owns `listing_views` and `relforcerowsecurity` is false (R2).
→ **step 1** `drop policy if exists "Anyone can insert a view" on public.listing_views;`
`revoke insert, update, delete on public.listing_views from anon;` → **step 2 post-condition** raising (and so rolling
back step 1) unless: no policy of that name exists; `anon` has none of the three privileges; and no remaining
`INSERT`/`ALL` policy on the table lists `public` or `anon` with a predicate that does not match
`auth\.(uid|jwt|role)\(` (870 A5's test, `:118-127`) → `notify pgrst, 'reload schema';` → `commit;`.
Idempotent (a second run is a no-op that still passes the post-condition). The header states the run order (§13.3)
and that its success output is "Success. No rows returned". `service_role`, `postgres` and `authenticated` are not
named in any statement.

### 10.5 `task-865-verify.sql` and `task-865-rollback.sql`

Verify — each PART is run on its own and **always ends in one raised message**, so nothing it does can persist even
if the editor would otherwise commit. Shape of every part:
`begin; set local role <role>; do $$ … $$; rollback;`, where the `do` block performs the arm inside
`begin … exception when others then … end`, captures `sqlstate` and `sqlerrm`, and finally executes
`raise exception 'TASK865_<PART> result=<passed|refused> sqlstate=<…> msg=<…>'` (plus the part's own values). The
owner returns that one error line.

- **(a) anon insert arm** — role `anon`; `insert into public.listing_views (<every NOT NULL column without a default,
  from V3>) values (…)` with `listing_id = '00000000-0000-0000-0000-000000000865'` (cannot exist) and fixed, obviously
  synthetic values for the rest. BEFORE: `result=passed`, or `sqlstate=23503` if V4 shows a foreign key on
  `listing_id` (A1). AFTER: `sqlstate=42501`, message `permission denied for table listing_views`.
- **(b) authenticated insert arm** — identical with role `authenticated`. AFTER: refused; the message says which
  reason (R8).
- **(c) RPC arm** — role `service_role`; select one `active` listing id into a variable; count that listing's
  `listing_views` rows; call `public.record_listing_view(<id>, null, 'task865-probe')`; count again; raise
  `TASK865_C recorded=<bool> before=<n> after=<n>`. BEFORE and AFTER: `recorded=true`, `after = before + 1` (R5). The
  closing raise discards the row. If V6 shows `service_role` lacks `EXECUTE`, stop and report — the production route
  would already be failing.

Rollback — restores exactly V1's `anon` privileges and V2's policy definition (name, `PERMISSIVE`, `INSERT`, roles,
`with check (true)`), then `notify pgrst`. Its header says it re-opens the hole and exists only if R5 fails AFTER.

### 10.6 `task-865-anon-probe.mjs --phase before|after`

Pattern: `task-881-notifications-probe.mjs` (classification and print rules) and `task-870-anon-probe.mjs`
(`dotenv`, raw `fetch`). `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local` via `dotenv`
only. Arms, each one line `phase=… arm=… method=… http_status=… pg_code=… reason=none|grant|rls|other`:

| Arm | Request (anon key) | Expected BEFORE | Expected AFTER |
|---|---|---|---|
| P1 | `POST /rest/v1/listing_views`, `Prefer: return=minimal`, body = verify (a)'s values | `other`/`23503` — **run only if V4 has a foreign key on `listing_id`**; otherwise the arm prints `skipped=no_fk` in the before phase, because a 2xx would persist a row | `grant` |
| P2 | `PATCH /rest/v1/listing_views?listing_id=eq.00000000-0000-0000-0000-000000000865`, `Prefer: return=minimal`, body `{"viewed_at":"2000-01-01T00:00:00Z"}` | `none` (0 rows) | `grant` |
| P3 | `DELETE` with the same filter | `none` (0 rows) | `grant` |

Exit 0 when every arm matches its phase column, 1 with a `MISMATCH` line otherwise, 2 on a setup error. Never prints
a key, token or row content. No service-role write.

## 11. Positive and negative flows

**Positive flow.** A guest opens a listing → the page POSTs `/api/listings/<slug>/view` → the route calls
`record_listing_view` as service role → one row, `{ok:true, recorded:true}` — before and after this task.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Anon direct insert (the hole) | Yes | R1, R3 | BEFORE passes; AFTER grant refusal | verify (a), probe P1 |
| Anon update/delete | Yes | R1 | AFTER grant refusal | probe P2/P3 |
| Authenticated direct insert | Yes | R8 | AFTER refused | verify (b) |
| Guard would break tracking | Yes | R2 | raise, nothing applied | guard source; step 4 output |
| Re-run of the close script | Yes | §10.4 | no-op, passes | step 4 re-run optional; post-condition |
| RPC still records | Yes | R5 | `true`, +1 | verify (c), step 9 |
| Declaration file re-applied later | Yes | R4 | grants nothing to anon | diff |
| Network/offline, concurrency, UI | No | — | no application code changes | — |

## 12. Acceptance criteria

- **AC1 [R1, R9]** Given the AFTER audit grid, when read, then V2 has no `"Anyone can insert a view"` row, V1 has no
  `anon` row for `INSERT`, `UPDATE` or `DELETE`, and the 870 audit's A5 count reads 0.
- **AC2 [R3]** Given verify part (a) BEFORE and AFTER, when run, then BEFORE reports `result=passed` (or
  `sqlstate=23503`) and AFTER reports `sqlstate=42501` with a message naming `listing_views` as a permission refusal,
  not a row-level-security refusal.
- **AC3 [R3]** Given the probe, when run with `--phase before` and `--phase after`, then each exits 0 and every AFTER
  arm prints `reason=grant`.
- **AC4 [R2]** Given `task-865-close-anon-insert.sql`, when its guard is read, then each of g1–g3 is a distinct
  condition that appends a named violation, and the raise precedes every statement of step 1.
- **AC5 [R5]** Given verify part (c) AFTER, when run, then it reports `recorded=true` and `after` one higher than
  `before`; and given O78-8 step 9, the guest view response is `{"ok":true,"recorded":true}`.
- **AC6 [R4]** Given the final `grant-discipline-audit.sql`, when read, then it contains no `grant … on public.listing_views to anon`
  statement, keeps the `service_role` line, and both grants gates exit 0.
- **AC7 [R6]** Given the final `rls-rules.md`, when diffed, then only `:410-411` and `:437` changed, and `:437` states the
  apply date, the dropped policy, the revoked privileges and V6's owner/`rolbypassrls` value. Checked at the Opus
  closure review against Opus's own edit (§16.3); not an executor criterion.
- **AC8 [R7, R8, R10]** Given the session log, when read, then it records V7's rows and an `EXPLAINED`/`UNKNOWN`
  conclusion, the BEFORE/AFTER `authenticated` privileges and part (b)'s reason, a rollback matching V1/V2, and a Files
  Changed table equal to the real diff of §7's paths; `docs/backlog.md` is ≤ 80 physical lines.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none.`

`GR-2 SCOPE STATED — check:notifications-grants and check:listing-reports-grants inspect only GRANT statements in scripts/*.sql for their own tables; they cannot see the live database or listing_views; R1/R3/R5 are closed by the owner-run audit, verify and probe results, never by those gates.`

## 13. QA profile and verification plan

**Q4** — RLS / write-path security. Evidence: BEFORE baseline (audit, verify, probe), changed-behavior proof (AFTER
of each), the guard's failure semantics, owner-native live runs, and the executor's Windows-native gate block with a
final `npm run build`.

### 13.1 Re-entry

Never re-run a BEFORE step after step 4 has been applied: the BEFORE grids in `docs/sessions/evidence/task865/` are
irreplaceable. If step 4 fails, the transaction applied nothing, and BEFORE stays valid.

### 13.2 Final gate block (executor, stage 2, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task865"
node.exe -p "process.platform + ' ' + process.version"
node.exe --check scripts\task-865-anon-probe.mjs; "probe syntax exit=$LASTEXITCODE"
npm.cmd run check:notifications-grants *> "$ev\20-notifications-grants.txt"; "notifications-grants exit=$LASTEXITCODE"
npm.cmd run check:listing-reports-grants *> "$ev\21-listing-reports-grants.txt"; "listing-reports-grants exit=$LASTEXITCODE"
npm.cmd run check:file-integrity *> "$ev\22-file-integrity.txt"; "file-integrity exit=$LASTEXITCODE"
npm.cmd run check:mojibake *> "$ev\23-mojibake.txt"; "mojibake exit=$LASTEXITCODE"
npm.cmd run lint *> "$ev\24-lint.txt"; "lint exit=$LASTEXITCODE"
npm.cmd run build *> "$ev\25-build.txt"; "build exit=$LASTEXITCODE"
git hash-object scripts\task-865-listing-views-audit.sql scripts\task-865-close-anon-insert.sql scripts\task-865-rollback.sql scripts\task-865-verify.sql scripts\task-865-anon-probe.mjs scripts\grant-discipline-audit.sql docs\rls-rules.md
git --no-optional-locks status --porcelain
```

Expected: `win32`; every exit 0; porcelain = the I0 snapshot plus only §7's paths. Return every transcript path and
exit code. If a named script does not exist in `package.json`, report missing evidence; do not substitute.

### 13.3 Owner-native steps (O78-8), in order

Step 1 runs between stage 1 and stage 2; steps 2–9 run after stage 2 is reported. Each SQL step: Supabase Dashboard →
SQL Editor, paste the whole file (or the named PART alone), run, return the grid or the full error text.

1. `scripts/task-865-listing-views-audit.sql` → the BEFORE grid.
2. `scripts/task-865-verify.sql` PART (a), then PART (b), then PART (c) — each alone → three BEFORE results.
3. The probe, BEFORE — block below.
4. `scripts/task-865-close-anon-insert.sql` → expected "Success. No rows returned". A raised guard message means
   nothing was applied; return it and stop.
5. `scripts/task-865-listing-views-audit.sql` again → the AFTER grid.
6. `scripts/task-865-verify.sql` PART (a), (b), (c) again → three AFTER results.
7. The probe, AFTER — block below.
8. `scripts/task-870-privilege-audit.sql` → return the A1, A3, A4, A5, A7 `(count)` rows.
9. In a private browser window, open any active listing on the production site with DevTools → Network open; return
   the response body of `POST /api/listings/<slug>/view`.

```powershell
node.exe scripts\task-865-anon-probe.mjs --phase before
node.exe scripts\task-865-anon-probe.mjs --phase after
```

Run the first line at step 3 and the second at step 7. Expected: each prints three `arm=` lines (the before phase may
print `skipped=no_fk` for P1) and exits 0. Return the full output of each.

If step 6 PART (c) or step 9 fails, run `scripts/task-865-rollback.sql` and return its output; the review then decides.

## 14. Completion report contract

Stage 1: status `BLOCKED — AWAITING O78-8 STEP 1 (BEFORE AUDIT GRID)`, the audit file's hash, I0 artifacts.
Stage 2: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`, with: changed files;
requirement IDs; each command's real exit code and transcript path; the stage-2 decisions derived from the BEFORE grid
(the NOT NULL column set used, whether P1 runs before, the rollback's exact privilege list); the manifest end
comparison (a changed §3.8 hash is `CHANGED — NOT ATTRIBUTED`); assumptions, deviations, limitations; O78-8 steps 2–9
stated as **owed**, never as done. Update the 865 cell of `docs/backlog.md` (≤ 2 lines) and the session log. No Git
commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh session without chat context | yes — both stages, every file, check and arm are specified here |
| Scope matches the owner's narrow decision | §2 quote; §8 excludes every schema-wide item |
| The fix cannot break tracking silently | R2 guard + R5 two proofs |
| Two-armed proof distinguishes the fix from the existing RLS guard | AC2/AC3 require the **grant** reason AFTER |
| Unknown schema facts are measured, not assumed | §3.5 → V3–V6 → stage 2 |
| The declaration that could re-open the hole is fixed | R4 |
| Dirty worktree handled | §3.8, I0 2, §13.2 comparator |
| Owner decisions needed | none |

## 16. Review 1 — 2026-09-30 — `PARTIALLY VERIFIED`

### 16.1 What was inspected

Stage 2 files at the gate-block hashes (re-hashed at review, all equal): audit `fb4f1516`, close `3194bb32`, rollback
`cf66dac7`, verify `a4d411b8`, probe `3503f13b`, `grant-discipline-audit.sql` `debcfa26`, `rls-rules.md` `f57cc9a5`
(unchanged). BEFORE grid `evidence/task865/10-before-audit.txt` (the V6-defective first grid is superseded by it and kept
as `10a-…-superseded.txt`). Gate transcripts `20-`…`25-` and `27-gate-summary.txt` (`win32 v22.22.3`, every exit 0,
build `exit=0`); manifest end `28-manifest-end.txt` (1 of 70 changed: `docs/critical-flow-registry.md`, Task 893's,
`CHANGED — NOT ATTRIBUTED`).

| Req | Status | Basis |
|---|---|---|
| R1 | NOT VERIFIABLE | close script source correct (drop + revoke + fail-closed post-condition); live AFTER audit owed (O78-8 step 5) |
| R2 | VERIFIED (source) | g1–g3 collected into one raise before step 1; BEFORE V5/V6 satisfy g3 (`postgres`, `bypassrls=true`) |
| R3 | NOT VERIFIABLE | verify (a) and probe P1–P3 match §10.5/§10.6 and V3/V4 (NOT NULL `listing_id`, `ip_hash`; FK on `listing_id`); live runs owed (steps 2, 3, 6, 7) |
| R4 | VERIFIED | diff `:218-219`; `service_role` line kept; both grants gates exit 0 |
| R5 | NOT VERIFIABLE | verify (c) source matches; live runs + step 9 owed |
| R6 | NOT DONE — reassigned | task-design defect F1 below; Opus edit at closure (§16.3) |
| R7 | VERIFIED | V7 row recorded; conclusion `UNKNOWN`, decider named (Task 289's apply date in the owner's Supabase SQL history); no live path found |
| R8 | PARTIALLY VERIFIED | BEFORE: `authenticated` holds all seven privileges (V1); AFTER + part (b) owed |
| R9 | NOT VERIFIABLE | step 8 owed |
| R10 | VERIFIED (files) | rollback restores V1's three revoked privileges + V2's policy; session log Files Changed matches the status paths; backlog 80 lines |

`GR-2 SCOPE STATED — check:notifications-grants and check:listing-reports-grants inspect only GRANT statements in scripts/*.sql for their own tables; they cannot see the live database or listing_views; R4 is closed by the inspected diff, R1/R3/R5/R8/R9 stay open until the owner-run results.`

### 16.2 Finding F1 — P2 — task-design defect (Opus), not an executor defect

§7 item 7, R6 and AC7 assigned `docs/rls-rules.md` to the executor. `execute-task/SKILL.md` → "Absolute policy-file
boundary" makes every `docs/*rule*.md` read-only for Sonnet and states that an allowed-files list cannot delegate it,
and R6's text needs the O78-8 step 4 apply date, which cannot exist at stage 2. The executor correctly stopped and
reported `POLICY-EDIT AUTHORITY REQUIRED`. **Correction (this revision):** §7 item 7, R6, AC7 and §10.2 now route the
edit to Opus at closure; no executor revision is needed.

### 16.3 Closure route — after the owner returns O78-8 steps 2–9

1. Opus saves each returned output verbatim to `docs/sessions/evidence/task865/`: `30-verify-before.txt` (step 2, three
   lines), `31-probe-before.txt` (step 3), `32-close-apply.txt` (step 4), `33-after-audit.txt` (step 5),
   `34-verify-after.txt` (step 6), `35-probe-after.txt` (step 7), `36-870-audit-after.txt` (step 8),
   `37-guest-view.txt` (step 9).
2. Opus checks AC1–AC5 and AC8's `authenticated` half against them. **Checkpoint 4 still binds:** if step 2 PART (a)
   BEFORE is already refused, the owner must not have applied step 4 — report it. Any AC mismatch → `NEEDS REVISION`
   routed to Sonnet in a new §17; a (c)/step 9 failure → the owner runs `scripts/task-865-rollback.sql` first.
3. If all pass, Opus edits `docs/rls-rules.md` (R6/AC7), nothing else in that file:
   - `:410-411` — `(e.g. anonymous page-view\ntracking via \`listing_views\`)` → removed; the sentence reads
     "For tables where the insertion is genuinely anonymous-by-design, the policy MAY use …".
   - `:437` — rationale cell → `Closed <step 4 date> by Task 865: policy "Anyone can insert a view" dropped and anon's
     INSERT/UPDATE/DELETE on public.listing_views revoked. record_listing_view (SECURITY DEFINER, owner postgres,
     rolbypassrls=true — audit V6, 2026-09-30) is the only writer and keeps working (verify (c) AFTER, guest view).`;
     last cell → `Task 269 (rationale comment) · closed by Task 865`. The ⚠️ falsified warning is removed.
4. Then the normal approved-review closure: archive row, kickoff to `tasks/Archive/`, sprint row, O78-8 removed from
   the plan's open owner items, commit + push handoff.

## 17. Revision 1 — review 2, 2026-09-30 — `NEEDS REVISION`

**Supersedes** R5, AC5, §10.5 PART (c), §13.3 step 9 and §16.3 step 1's evidence-file map wherever they differ.

### 17.1 Owner results so far (O78-8 BEFORE; nothing applied)

Saved verbatim: `evidence/task865/30-verify-before.txt`, `31-probe-before.txt`.

| Run | Result | Against expectation |
|---|---|---|
| verify (a) | `TASK865_A result=refused sqlstate=23503` (FK `listing_views_listing_id_fkey`) | as expected: the hole is open, so checkpoint 4 passes |
| verify (b) | `TASK865_B result=refused sqlstate=23503` | as expected |
| verify (c) | `ERROR 22P02: invalid input syntax for type boolean: ""`, `line 13 at assignment` | **failed**: F2 |
| probe before | P1 `409 / 23503 / other`, P2 `204 / none`, P3 `204 / none` | as expected |

The 22P02 error aborts the transaction, so nothing from PART (c) persisted.

### 17.2 Finding F2 — P1 — task-design defect (Opus): `record_listing_view` returns `void`, not `boolean`

- **FACT.** Assigning the function's result to a `boolean` failed on the empty string, which is how `void` renders as
  text.
- **FACT (history).** The only definition this repository ever held, `supabase/migrations/20260511_record_listing_view.sql`
  (`git show dad9b863a:…`; the directory was deleted in `19bcb9cfa`), declares `RETURNS void`. Its dedup branch is a
  bare `RETURN`, so no value distinguishes a recorded view from a suppressed one.
- R5/AC5 and §10.5 (c) asserted `recorded=true`. The executor had flagged this as an assumption, and the kickoff
  should not have made it.
- **Second consequence, INFERENCE from the same fact.** In `src/app/api/listings/[slug]/view/route.ts:60-71`, `recorded`
  comes from a void RPC, so `recorded === true` can never hold. The route therefore always answers
  `{"ok":true,"recorded":false}`, and step 9's expected `recorded:true` was unreachable: it would have triggered a
  wrong rollback. This defect is pre-existing and outside 865's owner-locked scope (`src/`), so it is filed as **899**
  (`docs/backlog-reserved.md`).

### 17.3 Revised requirement and criterion

- **R5′ (P0).** View tracking still records.
  - AFTER, verify PART (c), run as `service_role` inside a rolled-back transaction, adds exactly one `listing_views`
    row for the chosen listing: `after = before + 1`. The return value is not read.
  - After one real guest page view on production, PART (d) lists a row for that listing's slug with `guest = true`,
    viewed within the last 30 minutes.
- **AC5′ [R5′].** PART (c) prints `TASK865_C before=N after=N+1`, both BEFORE and AFTER. PART (d), run AFTER the guest
  view, returns a row with the opened slug and `guest = true`. The route's `recorded` field is **not** evidence (899).

### 17.4 Executor work (Sonnet) — the whole of revision 1

Write set:
- `scripts/task-865-verify.sql`;
- a new "Revision 1" section in the session log;
- the 865 text in the `docs/backlog.md` registry row.

Nothing else. The close, rollback, audit and probe files stay byte-identical.

1. **PART (c).**
   - Delete `v_recorded` and its assignment.
   - Call `perform public.record_listing_view(v_listing, null, 'task865-probe');`.
   - Raise `TASK865_C before=% after=%`.
   - Update the header comment for (c): the function returns `void`, and the expectation is `after = before + 1`.
2. **PART (d)**, appended after PART (c). It is read-only and returns one grid: no `begin`, no `set role`, pure SQL plus
   `--` comments. The header says it runs AFTER the guest page view.
   ```sql
   select l.slug, v.viewed_at, (v.user_id is null) as guest
   from public.listing_views v
   join public.listings l on l.id = v.listing_id
   where v.viewed_at > now() - interval '30 minutes'
   order by v.viewed_at desc
   limit 10;
   ```
3. **PARTs (a) and (b)** stay byte-identical: their BEFORE results are recorded evidence.
4. **Gate block** (Windows PowerShell, from the project root; transcripts go to `evidence/task865/40-…`):
   - `node.exe -p "process.platform + ' ' + process.version"`;
   - `npm.cmd run check:file-integrity`;
   - `npm.cmd run check:mojibake`;
   - `npm.cmd run build`;
   - `git hash-object scripts\task-865-verify.sql scripts\task-865-close-anon-insert.sql scripts\task-865-rollback.sql scripts\task-865-anon-probe.mjs scripts\task-865-listing-views-audit.sql`.

   Expected: `win32`, every exit 0, and only the verify hash changed from §16.1.
5. **Report.** Give the new line ranges of PARTs (a)–(d); the owner copies them by line number. Status:
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 17.5 Owner re-entry after revision 1

- Keep the BEFORE results of verify (a), verify (b) and the probe; never re-run them (§13.1).
- Run only the new PART (c) BEFORE, then continue from the apply step (§13.3 step 4) onward.
- The guest-view step is: open the listing, then run PART (d). The route response is not collected.
- Opus saves the new results as `evidence/task865/32-…` onward.

## Appendix A — Evidence preflight (task design)

| Claim | Evidence | Classification |
|---|---|---|
| Policy exists, `with_check = true` | 870 evidence `:14,:38` (2026-09-23) | VERIFIED (dated; re-measured at step 1) |
| Only non-`auth.*()` write policy in `public` | 870 A5 = 1 | VERIFIED (dated) |
| `anon` INSERT/UPDATE/DELETE granted | reserved row (2026-09-21) + `grant-discipline-audit.sql:219` | VERIFIED for INSERT in source; live values dated, re-measured V1 |
| No `src/` writer | `git grep` 2026-09-27 | VERIFIED |
| Route uses service role → RPC | `route.ts:24,60` | VERIFIED |
| RPC bypasses RLS after the drop | depends on owner + `rolbypassrls` | UNKNOWN → guard g3 (R2) + verify (c) + step 9 |
| Table columns / FK | none in repo | UNKNOWN → V3/V4, stage 2 |
| Declaration file re-grants | `:218-219` | VERIFIED → R4 |
| 2026-08-20 guest row origin | git history of `contactEvents.ts` | UNKNOWN → R7 |
| Falsification attempted | "the policy is what lets the RPC insert" (Task 270's claim) | ANALYTICAL now; EXECUTED by verify (c) AFTER |

## Appendix B — Rule-compliance ledger

| Rule | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| Owner decision 2026-09-21 (narrow) | this task | no schema-wide work | §2, §8 | COMPLIANT |
| `rls-rules.md` per-role discipline | `anon` DML on a table | never `insert/update/delete` to `anon` | R1, R4 | COMPLIANT |
| `rls-rules.md` INSERT policy discipline | `with check (true)` for anon | removed, exception closed | R1, R6 | COMPLIANT |
| `rls-rules.md:237` | alters a `public` object | 870 audit after | R9, step 8 | COMPLIANT |
| `rls-rules.md:241-243` / F22–F23 | owner-run SQL | one grid, pure SQL | §10.3, §10.5 | COMPLIANT |
| `qa-profiles.md` Q4 | RLS/write path | baseline, changed-behavior, owner-native | §13.3 | COMPLIANT (owner-native owed) |
| `agent-contract.md` 9 | non-Q0 | final build exit 0 | §13.2 | COMPLIANT |
| `agent-contract.md` 9 (deletion/rename audit) | a grant is removed from a declaration | update every live consumer | R4 + both gates | COMPLIANT |
| `agent-contract.md` 14 | new text files | UTF-8 no BOM | `check:file-integrity`, `check:mojibake` | COMPLIANT |
| `agent-contract.md` 10 | Git | executor runs no mutating Git; owner applies SQL | §1, §14 | COMPLIANT |
| GR-1/3/3a/3b/3c | visible UI only | — | §1 | NOT APPLICABLE |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Active route | one: drop the policy + revoke `anon` I/U/D on `listing_views`, guarded, owner-applied |
| Decision source | owner, 2026-09-21 (quoted §2) |
| Starting worktree | dirty with manifest (§3.8, I0 2) |
| Final write set | §7 items 1–9 |

| # | Checkpoint | Producer / artifact | Comparator and failure |
|---|---|---|---|
| 0 | I0 | `00-*` | non-`win32`, dirty §7 path, a grants gate non-zero → `BLOCKED` |
| 1 | Stage 1 end | audit SQL | — ; status `BLOCKED — AWAITING O78-8 STEP 1` |
| 2 | BEFORE grid | `10-before-audit.txt` | V6 shows `prosecdef = false` or no `service_role` EXECUTE → `BLOCKED`, report |
| 3 | Stage 2 files | §7 2–7 | §13.2 non-zero → `PARTIALLY IMPLEMENTED` |
| 4 | Owner BEFORE runs | steps 2–3 | verify (a) BEFORE already refused → the hole is already closed; report, do not apply |
| 5 | Owner apply | step 4 | guard raise → nothing applied; report |
| 6 | Owner AFTER runs | steps 5–9 | any AC1–AC5 mismatch → finding; (c)/step 9 failure → rollback |
| 7 | Manifest end | end hashes | any change → `CHANGED — NOT ATTRIBUTED` |

| Counterexample | Result |
|---|---|
| Hole already closed before apply | checkpoint 4 detects it (verify (a) BEFORE refused) |
| Drop breaks the RPC | g3 refuses to apply; verify (c) AFTER + step 9 detect it; rollback exists |
| BEFORE insert persists a row | (a)/(b)/(c) end in a raised exception, which discards the row; P1 is skipped before when no FK |
| NOT NULL error masquerading as proof | not accepted as evidence (A1); stage 2 supplies the columns |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-27)

Moved out of `docs/backlog-reserved.md` when this kickoff was written, per the reserved-number preflight. It is the design-time record; §3 supersedes it wherever they differ, and the owner decision it quotes binds §2 and §8. Its schema-wide measurements are **context, not scope**.

| # | State | What |
|---|---|---|
| **865** | reserved 2026-09-21 — **Sprint 78** (hosted by discovery, not goal fit; the owner may move it), **P2**, filed by Task 850's owner-native closure. **SCOPE LOCKED NARROW by owner decision 2026-09-21:** *"865 залишити вузьким: закрити реальний anon INSERT до listing_views; не роздувати його в повний schema-wide аудит."* The kickoff closes the one live path and nothing else; the schema-wide grant material below is **context for why that is sufficient**, not scope, and must not be promoted into deliverables. Lowered P1→P2 once the blast radius was measured and came back empty. | **`anon` and `authenticated` hold DML on `public.listing_contact_events` that no script in this repository ever granted — including UPDATE and DELETE for both.** Measured on the live database 2026-09-21, after Task 850's step 2: `anon` → `select=false, insert=true, update=true, delete=true`; `authenticated` → `select=true, insert=false, update=true, delete=true`. **The asymmetry is the proof of mechanism, and it is not an inference about which privilege came from where:** every privilege the repo's scripts explicitly named has exactly the value those scripts dictate — authenticated SELECT `true` (granted by `task-277:21`, never revoked), anon SELECT `false` (revoked by `task-289`), authenticated INSERT `false` (revoked by Task 850 step 2) — while **every privilege no script ever named is `true`**. It is also not a `PUBLIC` grant: a grant to `PUBLIC` would make anon SELECT read `true`, and it reads `false`. That leaves Supabase's standard `public`-schema bootstrap (`grant all on all tables in schema public to anon, authenticated, service_role` + matching `alter default privileges`) as the source: 277's explicit grants were redundant, and 289 and 850 each removed only the single privilege they named. **Not live today, and the kickoff must say so rather than escalate:** RLS is on and Task 850 verify PART (c) shows exactly **one** policy on the table — `events_select_owner` (SELECT, `{authenticated}`) — so every command without a permissive policy is denied whatever the grant says. **The reason this is P1 and not P2 is blast radius, not this table:** if the same default applies schema-wide, then any table carrying a `for all` policy, or with RLS disabled, converts these grants into live anonymous writes — and nothing in this repo has ever measured that. **Schema sweep, measured 2026-09-21 (50 `public` tables):** `rowsecurity = true` on **every one** — there is no RLS-disabled table, so the worst case (a grant with no RLS at all) does not exist anywhere. Anon write grants are nonetheless widespread across the schema, which confirms the blanket-default reading rather than a per-table mistake. **Caveat on that grid, and it is the reviewer's own defect:** the sweep query left-joined grants and policies in one pass, so its `anon_privs` / `auth_privs` / `write_policies` columns are **products** (grants × policies), not counts — usable to see *that* a table carries anon write grants, useless as magnitudes. Re-measure with grouped CTEs, not that query. **Role-scoping measured 2026-09-21, and it is NOT the neutraliser — correct this before reasoning from the grid.** 25 tables carry write-capable policies whose `roles` include `public`: `agent_reviews`, `amenities`, `amenity_translations`, `collection_items`, `collections`, `conversations`, `currency_rates`, `favorites`, `history_clear_events`, `languages`, `listing_amenities`, `listing_images`, `listing_translations`, `listing_views`, `listings`, `location_translations`, `locations`, `messages`, `notification_settings`, `notifications`, `page_translations`, `recently_viewed`, `support_messages`, `users`, `verification_requests`. **`{public}` is simply what PostgreSQL records when a policy is created without `TO <role>`, which is how nearly every policy in this project was written**, so a `public` role list means almost nothing on its own. **The reviewer's own instruction that "any row returned is a live anonymous write path" was an overstatement and must not be carried into the kickoff.** What actually denies an anonymous request is the **predicate**: `auth.uid()` evaluates to NULL with no JWT, so `using (auth.uid() = user_id)` and every admin-role check yield NULL/false and the write is refused. Policy names in the returned set are consistent with that — "Users can update own profile", "Only admins can manage languages", "Users can manage own favorites". **The one row whose name predicts a genuinely open predicate is `listing_views` → "Anyone can insert a view" (INSERT)**; if that is `with check (true)`, anon really can insert view rows — probably a deliberate legacy of the view tracker, which today writes through `record_listing_view` under the service role (`api/listings/[slug]/view/route.ts`), so the policy may simply be dead surface worth revoking. **Predicate scan, measured 2026-09-21 — the decisive result.** Of every write-capable policy in the schema that lists `public`/`anon`, **exactly one** has a predicate that does not depend on `auth.uid()`: `listing_views` → `"Anyone can insert a view"`, `cmd INSERT`, `PERMISSIVE`, `roles {public}`, `qual NULL`, `with_check = true`. All 24 other tables are predicate-neutralised — their `using`/`with check` clauses reference `auth.uid()` or a role helper, which is NULL for an anonymous request — so for them this task is hardening, not exposure. **The `listing_views` policy is a genuine live anonymous write path, and it is already an accepted exception whose stated rationale is false.** `docs/rls-rules.md:378` admits advisor finding `0024_permissive_rls_policy` on exactly this policy with the justification *"Guards live in `record_listing_view` RPC (rate limit, IP hash)"* — but those guards are inside the RPC, and the permissive policy plus anon's direct `INSERT` grant open a **second path straight through PostgREST that never touches the RPC**. The exception's premise is that the guarded path is the only path; it is not. That row is now marked falsified in `rls-rules.md` pending this task. **Closing it is safe and small:** nothing in `src/` writes `listing_views` directly (only a doc comment in `analytics/activity/types.ts:29`), and `record_listing_view` is `SECURITY DEFINER`, so it bypasses RLS and keeps working after the policy is dropped. **Impact if left:** an unauthenticated caller with the public anon key can inflate any listing's view count at will, and those rows feed Task 849's `listing_activity_daily.recorded_views`, which is the data source for the 853/855/856 dashboards now being built. Anon holds `UPDATE`/`DELETE` grants on the same table but **no** policy admits them, so the exposure is insert-only. **Deliverable — the whole task, and nothing beyond it:** ① drop `"Anyone can insert a view"` and revoke anon's `INSERT`/`UPDATE`/`DELETE` on `public.listing_views`; ② update `rls-rules.md:378`'s exception row to record the closure and remove the falsified-rationale warning; ③ ship as `scripts/task-865-*.sql` with a rollback, per the no-`supabase/`-dir convention; ④ prove view tracking still works through `record_listing_view` afterwards (it is `SECURITY DEFINER`, so it bypasses RLS — assert, do not assume); ⑤ two-armed proof — the grid before and after, plus a real anon-role write refused for the **grant** reason after the fix rather than the RLS reason, since only that distinguishes the fix from the guard that already exists. **Fold in, from the same closure:** `listing_contact_events` holds one row dated `2026-08-20 19:24:15+00` with `actor_user_id is null` — a guest row written **after** `task-289` (2026-05-29) dropped the anon INSERT policy, when the documented policy state should have made an anon insert impossible. Establish how it got there before assuming the RLS guard has always held; it is the one piece of evidence that the "latent, not live" reading may not be true historically. **Do not fold this into a 850 revision — 850 is approved, archived, and its step 2 did exactly what R2 specified.** Re-measure every figure at execution; do not cite this row. |
