# Task 881 — `notifications` least privilege: `anon` loses everything, `authenticated` keeps exactly read-own and mark-as-read

Sprint 80 · **P2** · QA profile **Q4** (Data API grants on a table behind a registered critical flow) · no
dependencies · owner action **O80-5** · **Status: `KICKOFF FILED` 2026-09-25**

Sprint plan: [`Sprint_80_The_Data_API_Privileges_Nobody_Audited.md`](Sprint_80_The_Data_API_Privileges_Nobody_Audited.md).
Pattern to follow: archived Task 870 (`tasks/Archive/Sprint_80_kickoff_prompt_Task_870_Data_API_Privilege_Hardening.md`
§10.3–§10.4, §13.3 and `scripts/task-870-*`).

**Owner decision that created it — D82-4, 2026-09-24, verbatim option chosen:** *"Separate task (Recommended)"*;
the option read *"Its own number in Sprint 80 (Data API privileges), so the notifications task stays narrow."*
(`tasks/Archive/Sprint_82_Notifications_That_Were_Never_Delivered.md:53`). Sprint 80 hosts it under its own clause
*"Least-privilege on tables the app actually uses … becomes one when the owner schedules it"*.

## 1. Mode and task type

`IMPLEMENTATION`. Deliverables: owner-applied SQL (audit, hardening, guard selftest, rollback), an owner-run
two-armed live probe, a static CI grant gate, one action-level test file, and doc rows. Bundles: **DB / Server
Action / RLS** + **Regression / Critical Flow Coverage**.

**No product source under `src/` changes except one new test file.** No component, JSX, `className`, style, locale
key or Storybook change. **GR-0, GR-1, GR-3 and GR-3a are NOT APPLICABLE:** there is no visible artifact and no
surface file in the write set (§7). The notification bell's code and states are unchanged. §11's live realtime arm
proves its behavior is preserved. The executor stops and reports if the write set ever needs a `src/` file other than
the test.

## 2. Objective

1. `anon` holds **no** privilege on `public.notifications`.
2. `authenticated` holds exactly what the code uses: table-level `SELECT` (the bell's read and its Realtime
   subscription), and `UPDATE` on the **`is_read` column only** (the two mark-as-read actions). It loses `INSERT`,
   `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` and table-level `UPDATE`.
3. `service_role` is unchanged. `createNotification` keeps inserting.
4. The repo's grant declaration for `notifications` (`scripts/grant-discipline-audit.sql:158-160`) is corrected to
   match. A CI gate fails when the declaration drifts from that contract, and a test fails when the actions' update
   payload drifts from `is_read`.
5. A live two-armed probe shows each change is a **grant** refusal after and not before. The same probe shows that
   mark-as-read and the live bell still work for a signed-in user.

## 3. Verified context — measured 2026-09-25 unless dated otherwise (re-measure the live arms at O80-5)

### 3.1 Live grants and policies — the design-time record

- **F1 FACT (owner-run, 2026-09-24, recorded in `docs/backlog-reserved.md`'s former 881 row during Task 880's
  design; that row moves here).** `information_schema.role_table_grants` on `public.notifications`: `anon`,
  `authenticated`, `postgres`, `service_role` **each** hold
  `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`. Live policies: SELECT ×2, UPDATE ×2 and DELETE ×1,
  all `auth.uid() = user_id` on `{public}`; INSERT `notifications_insert_service_role` on `{service_role}`.
- **F2 FACT.** Owner grid 1, 2026-09-23 (`docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`):
  `notifications | t | t | t | t | t` — RLS on; `anon` SELECT, `authenticated` SELECT/INSERT, `service_role`
  SELECT all true. It agrees with F1.
- **F3 INFERENCE (F1).** Every anonymous and cross-user row access is predicate-neutralised today. This task is
  hardening, not closing a live exposure. The one privilege RLS does not govern is `TRUNCATE`: Postgres does not
  apply RLS to it, and `anon`/`authenticated` hold it. PostgREST exposes no `TRUNCATE` verb, so no Data API path to
  it is known. It is removed either way.
- **F4 FACT.** Task 870 did not touch `notifications`: it is absent from `scripts/task-870-anon-probe.mjs`'s
  `R_TABLES` and from 870's revoke set.

### 3.2 Every consumer — the per-privilege matrix

`git grep -n "from('notifications')\|table: 'notifications'" -- src`, 2026-09-25, non-test hits:

| Site | Client | Operation | Columns | Privilege needed by `authenticated` |
|---|---|---|---|---|
| `src/modules/notifications/lib/mutations.ts:26-35` `createNotification` | `createAdminClient()` (`:26`) | `INSERT` | all | none — service role |
| `…/mutations.ts:43-53` `markNotificationRead` | user-scoped `createClient()` (`:44`) | `UPDATE … SET is_read = true WHERE id = ? AND is_read = false` | writes `is_read`; filters `id`, `is_read` | `UPDATE (is_read)` + `SELECT` |
| `…/mutations.ts:55-64` `markAllNotificationsRead` | user-scoped (`:56`) | `UPDATE … SET is_read = true WHERE is_read = false` | writes `is_read`; filters `is_read` | `UPDATE (is_read)` + `SELECT` |
| `src/modules/notifications/hooks/useNotifications.ts:18-37` `fetchAll` | browser `createClient()` (`:19`) | `SELECT id, user_id, type, title, body, link, is_read, created_at, template_id, template_params` | all ten | `SELECT` |
| `…/useNotifications.ts:56-75` Realtime `postgres_changes`, `filter: user_id=eq.<id>` (Task 882) | browser client | Realtime row delivery | all | `SELECT` (Realtime authorises delivery as the subscriber's role) |

- **F5 FACT.** The ten columns are exactly `Notification` in `src/types/database.ts:473-485`.
- **F6 FACT — no `DELETE` consumer.** No `.delete()` on `notifications` anywhere in `src/`, whatever the client.
  `authenticated`'s `DELETE` has no consumer, and its DELETE policy becomes inert once the grant is gone. The policy
  is not dropped (§8).
- **F7 FACT — no user-scoped `INSERT`.** The only insert is the service-role one. `authenticated` `INSERT` is already
  refused by RLS, because the only INSERT policy is `{service_role}` (F1). Revoking it changes the refusal reason
  from RLS to grant and changes no outcome.
- **F8 FACT — the bell mounts only for a signed-in header.** `src/components/layout/Header.tsx:78`:
  `notificationSlot={headerUser ? <NotificationBell /> : undefined}`. `useNotifications` is consumed only by
  `NotificationBell.tsx:7`.
- **F9 FACT — a latent anon request path.** `useNotifications.ts:40` calls `fetchAll()` **before** the
  `if (!userId) return` guard (`:42`). If the bell were mounted while the browser client had no session, that read
  would today return `200 []` (RLS). After this task it returns `42501` and logs `[notifications] fetch failed`
  (`:28`) while keeping the list. Whether that window occurs in practice is **UNKNOWN**. O80-5 step 5 watches the
  console across sign-in and sign-out. Changing the hook is out of scope (§8): an extra console line, if one
  appears, is a finding for review, not a functional break.
- **F10 FACT — the trap the reserved row named.** `scripts/grant-discipline-audit.sql:158-160` declares
  `grant select on public.notifications to authenticated;` and `grant all … to service_role;`, commented "user reads
  own; service_role writes". Applied literally as the whole contract, it would drop `UPDATE` and break mark-as-read
  silently: both actions only `console.error` (`mutations.ts:50-52`, `:61-63`). The same file's footer (`:224-230`)
  lists `notifications` under "✅ OK".

### 3.3 The gates and tests that exist today

- **F11 FACT.** No test covers `mutations.ts`. `src/modules/notifications/` has only component tests and
  `useNotifications.smoke.test.ts`.
- **F12 FACT.** The static-gate precedent is `scripts/check-listing-reports-grants.mjs` (Task 460). It strips
  comments from its SQL source-of-truth files (`grant-discipline-audit.sql` + the task's own SQL), splits on `;`,
  and fails on a missing grant, an uncountered revoke, or an overgrant. CI runs it at
  `.github/workflows/governance-pr.yml:169-170`.
- **F13 FACT.** CI runs `npm run test:rls-guards` (`governance-pr.yml:77`). The script is currently
  `vitest run src/modules/__tests__/rls-write-guards.smoke.test.ts` (`package.json:15`).
- **F14 FACT.** The owner-run signed-in probe precedent is `scripts/task-882-realtime-probe.mjs`: `.env.local` via
  `dotenv`; `PROBE_EMAIL`/`PROBE_PASSWORD` from process env only (a test account, never committed); the probe row is
  inserted through the service role and deleted in `finally`; it prints no key, password or row content; exit
  `0`/`1`/`2`.
- **F15 FACT (Task 870 F22/F23, `rls-rules.md` "Existing-table audit").** The Supabase SQL Editor shows only the last
  statement's grid, and prose pasted with SQL rejects the whole batch. Every read-only script returns one grid, and
  the owner copies files with `Set-Clipboard`, never from chat.

### 3.4 Critical flows touched (`docs/critical-flow-registry.md`)

"Notifications panel — template-driven title/body localization" (`useNotifications.ts` is its data source),
"Authenticated header hydration — NotificationBell SSR shell", and the Task 880 notes on "Report listing" and
"Inquiry / send message" (both rely on `createNotification`'s service-role insert).

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | pattern 870 R1; F15 | `scripts/task-881-notifications-audit.sql`: read-only, **one statement, one grid**, `(check_id, sort_key, object_name, detail)`. Checks: **N1** `has_table_privilege` for `anon`, `authenticated`, `service_role` × the 7 table privileges (21 rows + one `(count)` row of the `true` cells for `anon`/`authenticated`); **N2** `has_column_privilege(role, 'public.notifications', col, 'UPDATE')` for `anon` and `authenticated` × every column from `information_schema.columns` (rows + `(count)` of `true`); **N3** every `pg_policies` row for the table (name, cmd, roles, qual, with_check) + `(count)`; **N4** `aclexplode(relacl)` entries whose grantee is `anon`, `authenticated` or `PUBLIC` (privilege + grantor) + `(count)`; **N5** column ACL entries (`pg_attribute.attacl`) for the same grantees + `(count)`. Every check prints its `(count)` row even at 0. | P1 | AC1 | Confirmed |
| **R2** | reserved row; F1–F9 | `scripts/task-881-notifications-least-privilege.sql`: `begin;` → guard (R3) → `revoke all on public.notifications from anon;` → `revoke all on public.notifications from authenticated;` → `grant select on public.notifications to authenticated;` → `grant update (is_read) on public.notifications to authenticated;` → post-condition block (R4) → `notify pgrst, 'reload schema';` → `commit;`. Literal statements naming the one relation; no dynamic SQL outside the guard/post-condition blocks. `service_role` and `postgres` are not named. | P0 | AC2, AC5 | Confirmed |
| **R3** | pattern 870 R3 | The guard is a `do` block, first after `begin;`, that raises (applying nothing) when any holds: **G1** the table is missing or `relrowsecurity` is false; **G2** a view or materialized view depends on it (`pg_depend` → `pg_rewrite`), with the dependent names in the message; **G3** a function in a non-system schema (excluding `pg_catalog`, `information_schema`, `realtime`, `extensions`, `graphql`, `graphql_public`, `auth`, `storage`, `vault`, `pgsodium`) with `prosecdef = false` whose `prosrc` matches `\mnotifications\M`, with names in the message. A security-invoker function running as `authenticated` could need a privilege this task removes. `scripts/task-881-guard-selftest.sql` is a single `do` block, byte-identical to the guard except that its table literal is `users`, and it must raise naming `public_user_profiles` (G2, proven by 870's selftest on the same view). | P1 | AC3 | Confirmed |
| **R4** | 870 Assumption 5.4 (revoke silently ineffective under another grantor) | The post-condition `do` block, before `commit;`, raises (rolling everything back) unless: every `has_table_privilege('anon', t, p)` is false for the 7 privileges; `authenticated` has table-level `SELECT` true and table-level `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/`REFERENCES`/`TRIGGER` false; `has_column_privilege('authenticated', t, 'is_read', 'UPDATE')` is true and is false for every other column; `service_role` still has `SELECT` and `INSERT`. | P0 | AC2, AC5 | Confirmed |
| **R5** | Q4 reversibility | `scripts/task-881-rollback.sql`: `begin;` → `grant select, insert, update, delete, truncate, references, trigger on public.notifications to authenticated;` → `notify pgrst, 'reload schema';` → `commit;`. **It does not re-grant `anon`.** Rationale in the header comment: no app path reads `notifications` as `anon` (F8), so restoring `anon` would restore only exposure. The rollback exists to restore the app if the column-level grant breaks mark-as-read. | P1 | AC2 | Confirmed (design choice, reversible) |
| **R6** | reserved row ("two-armed anon probe … and a signed-in mark-as-read proof"); F14 | `scripts/task-881-notifications-probe.mjs --phase before\|after`, owner-run (§5, Assumption 2). Setup: a service-role insert of one probe row for the probe user (`title = '[task-881 probe]'`); a `finally` deletes every row with that title for that user. Arms, in this order, each printing `phase arm role method http_status pg_code reason` where `reason ∈ {none, grant, rls, other}` (`grant` = message matches `/permission denied for (table\|relation) notifications/`; `rls` = `/row-level security/`): **A1** anon `GET ?select=id&limit=0`; **A2** anon `POST` insert; **A3** anon `PATCH is_read` on the probe id; **A4** anon `DELETE` on the probe id; **U1** user `GET` own probe row (prints the row **count** only); **U2** user `PATCH {is_read:true}` on the probe id, then a service-role re-read printing `is_read_after=true\|false`; **U3** user `PATCH {title:'x'}` on the probe id; **U4** user `POST` insert; **RT** Realtime: the user's client subscribes exactly as `useNotifications.ts:56-62`, a second probe row is inserted through the service role, and the probe prints `received_ms=<n>\|MISSING` within 10 s; **U5** user `DELETE` on the probe id — **last**. Exit 0 when every arm matches §11's table for the phase, 1 on any mismatch, 2 on setup error (missing env var, sign-in failure, insert failure). No key, password, token or row content is printed. `.env.local` is read with `dotenv`, never PowerShell. | P0 | AC4 | Confirmed |
| **R7** | F10; reserved row ("the audit SQL corrected to match") | `scripts/grant-discipline-audit.sql`: `:158-160` become the correct declaration (`grant select, update (is_read) on public.notifications to authenticated;` + the unchanged `service_role` line), with a comment naming Task 881, the consumer matrix and that `anon` holds nothing. The footer list (`:224-230`) no longer claims `notifications` is "no changes required" and points to Task 881. No other statement in the file changes. | P1 | AC6 | Confirmed |
| **R8** | F12 precedent; recurring failure mode M1 | `scripts/check-notifications-grants.mjs` + `package.json` `"check:notifications-grants"` + a `governance-pr.yml` step right after the Task 460 step. Sources: `scripts/grant-discipline-audit.sql` and `scripts/task-881-notifications-least-privilege.sql`. It exits 1, naming the statement, when: `authenticated` is not granted `select`; `authenticated` is not granted `update` restricted to exactly `(is_read)`; any statement grants `anon` anything on `notifications`; any statement grants `authenticated` `insert`, `delete`, `truncate`, `references`, `trigger`, `all` or table-level `update`. It ignores the rollback file by design; its header says so. It prints its scope every run: the files read, and that it cannot see live grants (N1–N5 do). | P1 | AC7 | Confirmed |
| **R9** | `rls-rules.md` RLS-Change Test Requirement §1–§3; F11 | `src/modules/notifications/lib/__tests__/mutations.smoke.test.ts`, appended to `test:rls-guards` in `package.json`. It asserts: both mark-as-read actions construct the user-scoped client and never the admin client; the `update()` payload's keys are exactly `['is_read']` with value `true` (the column contract R2 grants); `markNotificationRead` filters `eq('id', id)` and `eq('is_read', false)`; `markAllNotificationsRead` filters `eq('is_read', false)`; an `{ error }` result logs the existing message once and resolves; `createNotification` uses the admin client and never the user-scoped one. | P1 | AC8 | Confirmed |
| **R10** | `agent-contract` 15; RLS-Change §1 | Docs: `docs/rls-write-path-manifest.md` Table 1 gains three rows (`createNotification` service-role; `markNotificationRead`, `markAllNotificationsRead` archetype B, guard "none in code — RLS `auth.uid() = user_id` + `UPDATE (is_read)` grant (881)", `npm run test:rls-guards`). `docs/critical-flow-registry.md` "P0 — Server-action / RLS write paths" gains one row, **"Notification read-state write + `notifications` grant contract"**, naming the test, `check:notifications-grants` and the owner probe. `docs/rls-rules.md` → "Existing-table audit" gains one paragraph recording the 881 contract, the scripts and the gate. | P2 | AC9 | Confirmed |

## 5. Assumptions and open questions

1. **Assumption — column-level `UPDATE` suffices for PostgREST's PATCH.** `supabase-js` `.update()` with no
   `.select()` sends `Prefer: return=minimal`, so PostgREST issues `UPDATE … SET is_read …` with no `RETURNING`.
   That needs `UPDATE (is_read)` plus `SELECT` on the filtered columns, both granted. **Not executed at design time.**
   It is proven or disproven by probe arm U2 AFTER (`is_read_after=true`). If U2 fails AFTER, the owner runs
   `task-881-rollback.sql` and returns the output. The review then decides between table-level `UPDATE` and a fix.
   The executor does not pre-empt that.
2. **Owner-run probe.** The probe needs a signed-in **test** account (`PROBE_EMAIL`/`PROBE_PASSWORD`), which the
   executor does not have (F14). The executor proves the script's setup-error path (exit 2 with no env) and its
   syntax. Both live phases are O80-5.
3. **Anon Realtime is not an arm.** Whether an anonymous `postgres_changes` join errors or silently receives nothing
   once `anon` loses `SELECT` is **UNKNOWN**. 882's arm B already proved anon receives nothing today. RT tests only
   the authenticated subscriber, the one the bell uses.
4. **Revoke under another grantor.** If any `anon`/`authenticated` privilege was granted by a role other than the
   one running the script (for example `supabase_admin`), `revoke` does not remove it. R4 then raises and nothing is
   applied. The BEFORE audit's N4 shows grantors in advance. That outcome is a reported finding, not a workaround.
5. **Open, not blocking.** Whether to drop the now-inert DELETE policy. Out of scope (§8).

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-2, GR-4, GR-5, GR-6. GR-0/1/3/3a are not applicable, per §1. Read GR-0 far enough to
  confirm that.
- `docs/agent-contract.md`: clauses 1, 2, 3, 9, 9a, 10, 14, 15.
- `docs/rule-index.md`: "DB / Server Action / RLS" and "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md`: the `Q4` row and "Negative-flow applicability".
- `docs/rls-rules.md`: "RLS-Change Test Requirement" in full, "Public Schema GRANT Discipline" (all subsections),
  "RLS INSERT Policy Discipline".
- `docs/data-access-rules.md`, `docs/qa-rules.md`.
- `docs/critical-flow-registry.md`: the rows in §3.4.
- `docs/rls-write-path-manifest.md`: the header and Table 1's column contract.
- The pattern files, read-only: `scripts/task-870-privilege-audit.sql`, `scripts/task-870-harden-privileges.sql`,
  `scripts/task-870-guard-selftest.sql`, `scripts/task-870-anon-probe.mjs`, `scripts/task-882-realtime-probe.mjs`,
  `scripts/check-listing-reports-grants.mjs`.
- `docs/orchestrator-procedures.md` → the 818/816 corollary and "Git state — durable lessons".

Do not read the UI bundles.

## 7. Scope — the exact allowed write set

1. `scripts/task-881-notifications-audit.sql` (new)
2. `scripts/task-881-notifications-least-privilege.sql` (new)
3. `scripts/task-881-guard-selftest.sql` (new)
4. `scripts/task-881-rollback.sql` (new)
5. `scripts/task-881-notifications-probe.mjs` (new)
6. `scripts/check-notifications-grants.mjs` (new)
7. `scripts/grant-discipline-audit.sql` — `:158-160` and the footer list only (R7)
8. `package.json` — the new `check:notifications-grants` entry and the `test:rls-guards` string only
9. `.github/workflows/governance-pr.yml` — one new step (R8)
10. `src/modules/notifications/lib/__tests__/mutations.smoke.test.ts` (new)
11. `docs/rls-write-path-manifest.md`, `docs/critical-flow-registry.md`, `docs/rls-rules.md` — R10 only
12. `docs/sessions/2026-09-25-task881-notifications-least-privilege.md` and `docs/sessions/evidence/task881/*`
13. `docs/backlog.md` — the 881 registry cell only

## 8. Out of scope

- Every policy on `notifications`, including the inert DELETE policy and the UPDATE policies' predicates. Grants
  only.
- `src/modules/notifications/**` source, `useNotifications.ts` (F9's early `fetchAll` included) and every
  component.
- `notification_settings`, `listing_views` (Task 865's scope lock), and every other table.
- `service_role`, `postgres` and default-ACL changes (Task 870 closed default ACLs).
- Changing `createNotification`'s error handling.

## 9. Current and required behavior

| Actor / operation | Current (F1, F3) | Required after |
|---|---|---|
| anon `SELECT` | `200 []` (RLS) | `42501` grant |
| anon `INSERT` | `42501` RLS | `42501` grant |
| anon `UPDATE`/`DELETE` | `2xx`, 0 rows (RLS) | `42501` grant |
| user reads own rows (bell) | `200`, own rows | **unchanged** |
| user marks one / all read | row(s) updated | **unchanged** |
| user updates another column of own row (`title`, `body`, `link`, `user_id`, …) | allowed by grant + policy | `42501` grant — **changed**, no consumer (§3.2) |
| user `INSERT` | `42501` RLS | `42501` grant |
| user `DELETE` own row | allowed | `42501` grant — **changed**, no consumer (F6) |
| Realtime delivery of an own-row INSERT to the signed-in bell | delivered (882: 716 ms) | **unchanged** |
| service role `INSERT` (`createNotification`) | succeeds | **unchanged** |
| any role `TRUNCATE` | held by `anon`/`authenticated` | `anon`/`authenticated` do not hold it |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. Record `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` (must start `win32`).
2. Save `git --no-optional-locks status --porcelain` to `docs/sessions/evidence/task881/01-status-before.txt`, and
   the `git hash-object` of every path it lists as modified.
3. Re-run the §3.2 grep, plus `git grep -n "notifications" -- src ':!*.test.*' ':!*.stories.*'` narrowed by hand to
   table access (drop the i18n namespace hits). A new user-scoped consumer that needs a privilege R2 removes is a
   STOP: report `UNLISTED NOTIFICATIONS CONSUMER` with the site and the privilege.
4. Re-read `mutations.ts:43-64`. If either update writes a column other than `is_read`, stop and report
   `PREMISE DRIFT`.
5. Save the baselines of `npm.cmd run test:rls-guards` and `npm.cmd run check:listing-reports-grants` before any
   edit (`03`, `04`). Both are expected to exit 0.

### 10.2 Order

I0 → R9 test (run it against the unchanged source: it must pass, because the current payload already satisfies the
contract; this pins the contract before the grant depends on it) → the R9 plant/restore → R1 audit → R3 guard +
selftest → R2 hardening with R4 post-conditions → R5 rollback → R6 probe → R8 gate + its plants → R7 declaration →
R10 docs → §13.2 gate block → report. The executor **writes** the SQL. The owner **applies** it (O80-5).

### 10.3 SQL-file rules (870 §10.4, restated so this file stands alone)

1. UTF-8 without BOM. Pure SQL and `--` comments; no prose outside comments.
2. The audit is one statement. The selftest's only statement is its `do` block.
3. The hardening script is `begin;` … `commit;`, with the guard the first statement after `begin;` and the
   post-condition block the last before `notify`.
4. The guard in the hardening script and the selftest are byte-identical apart from the table literal. The session
   log shows the `diff`.
5. Each file's header comment names its purpose, its position in the §13.3 order, the expected result, and Task 881.
6. Every `grant`/`revoke` is a literal statement naming `public.notifications`.

### 10.4 Plants (two-armed, hash-witnessed, restored through the Edit tool or Node)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** (R9) | `markNotificationRead`'s payload becomes `{ is_read: true, title: 'x' }` | the payload-keys test | `05-plant-p1.txt`, `06-restored-p1.txt` |
| **P2** (R8) | in the hardening script, `update (is_read)` becomes `update` | `check:notifications-grants` exit 1 naming the overgrant | `07-plant-p2.txt` |
| **P3** (R8) | append `grant select on public.notifications to anon;` to the hardening script | exit 1 naming the anon grant | `08-plant-p3.txt` |
| restore | both reverted | exit 0 | `09-gate-restored.txt` |

Record `git hash-object` of each planted file before the plant and after the restore, in the same evidence file.

## 11. Positive and negative flows

**Positive flow (O80-5).** BEFORE audit and probe `--phase before` → selftest raises → hardening applies → AFTER
audit shows N1/N2/N4/N5 at the target → probe `--phase after` exits 0. A signed-in user opens the bell, sees the list,
marks one read and marks all read. A second account triggers a notification, and it appears live.

**Probe expectations (R6):**

| Arm | BEFORE | AFTER |
|---|---|---|
| A1 anon GET | `200`, reason `none` | `42501`, reason `grant` |
| A2 anon POST | `42501` (or 401/403 carrying it), reason `rls` | `42501`, reason `grant` |
| A3 anon PATCH | `2xx`, reason `none` | `42501`, reason `grant` |
| A4 anon DELETE | `2xx`, reason `none` | `42501`, reason `grant` |
| U1 user GET own | `200`, count `1` | `200`, count `1` |
| U2 user PATCH is_read | `2xx`, `is_read_after=true` | `2xx`, `is_read_after=true` |
| U3 user PATCH title | `2xx`, reason `none` | `42501`, reason `grant` |
| U4 user POST | `42501`, reason `rls` | `42501`, reason `grant` |
| RT realtime | `received_ms` ≤ 10000 | `received_ms` ≤ 10000 |
| U5 user DELETE | `2xx`, reason `none` | `42501`, reason `grant` |

U2 resets the probe row between phases: the setup inserts a fresh row in each phase, so `is_read` starts `false`.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Authorization — anon at the grant layer | **Yes** | R2 | `42501` grant on A1–A4 | probe pair (AC4) |
| Authorization — user writing a non-`is_read` column, inserting, deleting | **Yes** | R2 | `42501` grant | U3/U4/U5 (AC4) |
| Authorization — legitimate mark-as-read | **Yes** | R2, R9 | unchanged success | U2 (AC4), AC8 test, O80-5 step 4 |
| Realtime delivery to the owner of the row | **Yes** | 882 | unchanged | RT (AC4), O80-5 step 4 |
| Service-role insert | **Yes** | F7 | unchanged | probe setup insert succeeds both phases; AC8 `createNotification` case |
| Guard fires | **Yes** | R3 | exception, nothing applied | selftest (AC3); a real guard hit during O80-5 is a reported finding |
| Revoke ineffective (another grantor, `PUBLIC`) | **Yes** | R4 | exception, rolled back | AC5; N4 grantors in the BEFORE grid |
| Signed-out visitor | **Yes** | F8, F9 | no bell mounted; no new console error expected | O80-5 step 5 |
| Validation (form/input) | No | no input changes | N/A | — |
| Offline/network | No — for the app | probe: a network failure has no HTTP status → exit 2 | N/A | — |
| Concurrent writer | No | DDL in one transaction; no data rows change | N/A | — |

**Actor matrix (RLS-Change Test Requirement §4):**

| Actor | Tested how |
|---|---|
| anonymous | probe A1–A4, both phases (live) |
| authenticated owner of the row | probe U1–U5 + RT (live); AC8 (action code, mocked client) |
| authenticated non-owner | RLS unchanged. 882's arm B already proved non-delivery. Not re-tested: this task changes no predicate |
| admin/moderator | N/A — no admin path touches `notifications` through a user-scoped client (§3.2) |
| service_role | probe setup/cleanup (live); AC8 `createNotification` (mocked) |

## 12. Acceptance criteria

- **AC1 [R1]** Given the audit file, when its comment-and-string-stripped text is checked (`10`), then it has one
  `;`, ends with it, and has no write/DDL keyword. Its checks N1–N5 each emit a `(count)` row. The reviewer reads
  that from the file's `union all` branches.
- **AC2 [R2, R4, R5]** Given `11-sql-targets.txt` (every `grant`/`revoke` target and privilege list extracted from the
  hardening and rollback files), then the hardening file revokes all from `anon` and `authenticated` and grants
  exactly `select` and `update (is_read)` to `authenticated`. The rollback grants `authenticated` the seven table
  privileges and names no `anon` grant. Neither names `service_role` or `postgres`. The post-condition block
  asserts every R4 clause.
- **AC3 [R3]** Given the guard `diff` in the session log, then the two blocks differ only in the table literal.
  Given O80-5 step 2, when the owner runs the selftest, then it raises naming `public_user_profiles`, and nothing
  changes.
- **AC4 [R6]** Given `20-probe-before.txt` and `21-probe-after.txt` (owner-run), then every arm matches §11's
  table for its phase and both runs exit 0. Given the executor's `12-probe-no-env.txt`, then running without
  `PROBE_EMAIL` exits 2 and prints no secret.
- **AC5 [R2, R4]** Given the owner's AFTER audit grid, then the N1 `(count)` of true `anon`/`authenticated` cells
  reads 1 (`authenticated` `SELECT`). N2's `(count)` reads 1 (`authenticated`/`is_read`). N4 lists only
  `authenticated`/`SELECT`. N5 lists only `authenticated`/`is_read`/`UPDATE`. `service_role`'s N1 rows still read
  true.
- **AC6 [R7]** Given `git diff scripts/grant-discipline-audit.sql`, then only `:158-160` and the footer list changed,
  and the new declaration grants `authenticated` `select` and `update (is_read)` only.
- **AC7 [R8]** Given `check:notifications-grants`, then it exits 0 on the final tree (`13`), exits 1 naming the cause
  under P2 (`07`) and P3 (`08`), and exits 0 after the restore (`09`), with equal pre/post hash witnesses. It prints
  its scope statement on every run. The workflow step exists after the Task 460 step.
- **AC8 [R9]** Given `mutations.smoke.test.ts`, then every R9 assertion passes on the final source (`14`). Under P1
  the payload-keys test fails (`05`); after the restore it passes (`06`) with equal hash witnesses. `npm run
  test:rls-guards` runs both test files and exits 0.
- **AC9 [R10]** Given `git diff` of the three docs, then each has only the R10 addition.
- **AC10 [all]** `npm.cmd run build` exits 0 on the final tree (`16`). `typecheck`, `test:rls-guards`,
  `check:listing-reports-grants`, the notifications component/hook suites, `check:file-integrity` and
  `check:mojibake` exit 0. `17-status-after.txt` vs `01` shows no path outside §7, and the pre-existing modified
  paths have equal hash witnesses.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.` (AC5's counts are the measured
target of a grant contract read from a live grid, not a proxy for correctness. AC2/AC6 name exact statements
because the statements are the deliverable.)

## 13. QA profile and verification plan

**Q4.** Reasons: grants on a table behind registered critical flows (§3.4), with an RLS/permission security change.
Required evidence: regression baselines (I0 step 5), the changed-behavior test (AC8), planted failures (P1–P3), the
live two-armed probe and audit grids (O80-5), and `npm run build`.

### 13.1 Re-entry

From scratch. Pre-existing read-only artifacts: `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Run the §10.4 plants first, by hand, saving `05`–`09`. Then:

```powershell
$ev = "docs\sessions\evidence\task881"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\02-platform.txt"
node.exe -e "const fs=require('fs');const s=fs.readFileSync('scripts/task-881-notifications-audit.sql','utf8').replace(/--.*$/gm,'').replace(/'(?:[^']|'')*'/g,'');const n=(s.match(/;/g)||[]).length;const bad=s.match(/\b(insert|update|delete|grant|revoke|alter|create|drop|truncate)\b/gi);console.log('semicolons='+n,'endsWithSemicolon='+/;\s*$/.test(s),'writeKeywords='+(bad?bad.join(','):'none'))" | Tee-Object "$ev\10-audit-single-statement.txt"
node.exe -e "const fs=require('fs');for(const f of ['scripts/task-881-notifications-least-privilege.sql','scripts/task-881-rollback.sql']){const s=fs.readFileSync(f,'utf8').replace(/--.*$/gm,'');for(const m of s.matchAll(/\b(grant|revoke)\b[^;]*?;/gi))console.log(f+': '+m[0].replace(/\s+/g,' '))}" | Tee-Object "$ev\11-sql-targets.txt"
node.exe scripts\task-881-notifications-probe.mjs --phase before *>&1 | Tee-Object "$ev\12-probe-no-env.txt"
npm.cmd run check:notifications-grants *>&1 | Tee-Object "$ev\13-check-notifications-grants.txt"
npm.cmd run test:rls-guards *>&1 | Tee-Object "$ev\14-test-rls-guards.txt"
npx.cmd vitest run src/modules/notifications *>&1 | Tee-Object "$ev\15a-test-notifications.txt"
npm.cmd run check:listing-reports-grants *>&1 | Tee-Object "$ev\15b-check-listing-reports-grants.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\15c-typecheck.txt"
npx.cmd eslint scripts\task-881-notifications-probe.mjs scripts\check-notifications-grants.mjs src\modules\notifications\lib\__tests__\mutations.smoke.test.ts *>&1 | Tee-Object "$ev\15d-eslint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\15e-check-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\15f-check-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\16-build.txt"
git --no-optional-locks hash-object scripts\task-881-notifications-audit.sql scripts\task-881-notifications-least-privilege.sql scripts\task-881-guard-selftest.sql scripts\task-881-rollback.sql scripts\task-881-notifications-probe.mjs scripts\check-notifications-grants.mjs scripts\grant-discipline-audit.sql package.json .github\workflows\governance-pr.yml src\modules\notifications\lib\__tests__\mutations.smoke.test.ts docs\rls-write-path-manifest.md docs\critical-flow-registry.md docs\rls-rules.md | Tee-Object "$ev\16z-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\17-status-after.txt"
```

Run the block in a PowerShell session where `PROBE_EMAIL` and `PROBE_PASSWORD` are **not** set.

Expected results:

- `02` starts with `win32`.
- `10`: `semicolons=1 endsWithSemicolon=true writeKeywords=none` (AC1).
- `11`: the statement list AC2 checks.
- `12`: exit 2 with a missing-env message and no secret (AC4).
- `13`: exit 0 with the scope statement (AC7).
- `14`/`15a`/`15b`/`15c`: exit 0. `15d`: no errors. `15e`/`15f`/`16`: exit 0; `16` ends with the route table.
- `16z` ties the transcripts to the shipped content. `17` vs `01` for AC10.

Record every command's real exit code next to its file in the session log. Stop any running dev server before
`build`.

### 13.3 Owner-native steps (O80-5), in order, after the executor reports

```powershell
$ev = "docs\sessions\evidence\task881"
$env:PROBE_EMAIL = "test-account-2@example.com"
$env:PROBE_PASSWORD = "the-test-account-password"
Get-Content -Raw -Encoding utf8 scripts\task-881-notifications-audit.sql | Set-Clipboard
node.exe scripts\task-881-notifications-probe.mjs --phase before | Tee-Object "$ev\20-probe-before.txt"
Get-Content -Raw -Encoding utf8 scripts\task-881-guard-selftest.sql | Set-Clipboard
Get-Content -Raw -Encoding utf8 scripts\task-881-notifications-least-privilege.sql | Set-Clipboard
Get-Content -Raw -Encoding utf8 scripts\task-881-notifications-audit.sql | Set-Clipboard
node.exe scripts\task-881-notifications-probe.mjs --phase after | Tee-Object "$ev\21-probe-after.txt"
Remove-Item Env:PROBE_PASSWORD
```

Replace the two `$env:` values with the test account used for 882's O82-4 before running. Never use a real user's
account. Run the block **one line at a time**, doing the matching step below after each `Set-Clipboard` line:

1. After line 4 (audit): in the SQL Editor, empty the editor, paste, Run. Save the grid as the **BEFORE audit**. Line 5
   runs the BEFORE probe. It must exit 0.
2. After line 6 (selftest): paste, Run. Expected: an ERROR naming `public_user_profiles`. Nothing is changed.
3. After line 7 (hardening): paste, Run. Expected: `Success. No rows returned`. On any error, stop and return the full
   message: nothing was applied (the guard or a post-condition fired).
4. After line 8 (audit): paste, Run. Save the grid as the **AFTER audit**. Line 9 runs the AFTER probe. Then, signed in
   on lero.al as a normal user: open the bell, mark one notification read, mark all read, reload. The state holds.
   From a second account, trigger a notification to the first (for example, report one of its listings), and confirm
   it appears in the open bell without a reload.
5. Signed out: load `/sq`, sign in, sign out, with DevTools Console open. Report any `[notifications] fetch failed`
   line (F9).
6. **Only if the AFTER probe's U2 fails, or step 4's mark-as-read does not hold:** copy
   `scripts\task-881-rollback.sql` the same way, run it, and return its output with the probe transcript.

Return: both grids, both probe transcripts, the selftest error text, the hardening result line, and the step 4–5
observations.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.
The report lists:

- the changed files with their `16z-hash-object.txt` values;
- the requirement IDs completed;
- every command in §10.1, §10.4 and §13.2 with its real exit code and evidence path;
- the I0 outputs: the consumer grep and any new consumer, the baselines;
- the guard `diff` (§10.3 item 4) and the §10.4 plant table with its hashes;
- the before/after quotes of `grant-discipline-audit.sql` and the three docs;
- assumptions, deviations, limitations, and any `PREMISE DRIFT` / `UNLISTED NOTIFICATIONS CONSUMER` /
  `MISSING EVIDENCE` stop;
- O80-5, stated as owed and never as done.

Sonnet updates the 881 cell of the `docs/backlog.md` registry row (state only). It writes the session log with a
"Files Changed" table matching the real diff. It emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — the matrix, the SQL shape, the probe arms and their expected results, the plants and the owner block are in this file |
| One active route | Yes — Appendix C |
| Every requirement has a binary AC and a verification | R1→AC1 · R2→AC2/AC5 · R3→AC3 · R4→AC2/AC5 · R5→AC2 · R6→AC4 · R7→AC6 · R8→AC7 · R9→AC8 · R10→AC9 · all→AC10 |
| Two-armed control that can demonstrably fail | the probe pair (grant present → absent, each classified by reason), P1–P3, the guard selftest, and R4's post-conditions |
| Detector blind spot stated | `check:notifications-grants` reads two SQL files, not the live database (N1–N5 do). The payload test proves the code's column contract with a mocked client, not PostgREST behavior (U2 does). G3 is a regex over `prosrc` and misses a function that builds the table name dynamically. N1 is table-level: column grants live only in N2/N5 |
| Material absence claims traced | "No DELETE consumer", "no user-scoped INSERT": `git grep` over `src/` for the table, with every hit classified by client (§3.2). Paths outside `src/` → G2/G3. "Bell mounts only when signed in": `Header.tsx:78` + the single `useNotifications` consumer |
| Dirty worktree handled | Clean at design time; the I0 snapshot and hash witnesses anyway (AC10) |
| No owner exception claimed without a quote | D82-4 quoted. R5's anon-free rollback is a labelled design choice, not an owner exception |
| Kickoff facts re-measured where state can drift | I0 steps 3–5; BEFORE audit and probe (O80-5) |

---

## Appendix A — Evidence preflight (task design)

| Field | Value |
|---|---|
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch` |
| Exact start step | §10.1 I0 |
| Reused artifacts | `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt` (read-only) |
| Artifacts that must not be overwritten | the same file |
| Owner decision required? | no. D82-4 created the task, and its deliverables were written in the reserved row |

| Claim | Source inspected | Status |
|---|---|---|
| All four roles hold all seven privileges | the 2026-09-24 owner grid as transcribed (F1) | VERIFIED by transcription; re-measured by the BEFORE audit N1 |
| RLS on; `anon` SELECT live | owner grid 1, 2026-09-23 | VERIFIED |
| Consumer matrix | `mutations.ts:26,44,56`, `useNotifications.ts:19-22,56-62` | VERIFIED |
| No DELETE / no user INSERT consumer | `git grep` over `src/` | VERIFIED for `src/`; G3 covers invoker DB functions |
| The audit declaration would break mark-as-read | `grant-discipline-audit.sql:158-160` vs `mutations.ts:44-60` | VERIFIED |
| Column-level UPDATE works through PostgREST | — | ASSUMED (Assumption 1); U2 decides |
| Bell mounts only when signed in | `Header.tsx:78` | VERIFIED |
| Early `fetchAll` before the userId guard | `useNotifications.ts:40-42` | VERIFIED; whether it fires unauthenticated is UNKNOWN (O80-5 step 5) |

## Appendix B — Rule-compliance ledger

| Rule source and clause | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `rls-rules.md` → RLS-Change Test Requirement §1 | DB permission change | write-path inventory | §3.2, R10 manifest rows | COMPLIANT |
| same §2 | same | positive test on actual action code | AC8 runs the real actions; U2 live | COMPLIANT |
| same §3 | same | negative test | A1–A4, U3–U5 live; AC7 overgrant plants | COMPLIANT |
| same §4 | same | actor matrix | §11 | COMPLIANT |
| same §5 | same | runtime proof after the change | O80-5 AFTER probe + step 4 | COMPLIANT (owner-native, per Q4) |
| `rls-rules.md` → Per-role GRANT discipline | grants change | `anon` no DML; `authenticated` DML only with `auth.uid()` policies | R2 (`anon` none; UPDATE policy is `auth.uid() = user_id`, F1) | COMPLIANT |
| `rls-rules.md` → Existing-table audit | audit after the change | one-grid read-only audit | R1; R10 paragraph | COMPLIANT |
| `agent-contract` 3 | capabilities stay reachable | mark-as-read, bell, live updates preserved | §9, U2, RT, step 4 | COMPLIANT |
| `agent-contract` 9 | non-Q0 | `npm run build` exit 0 | `16-build.txt` | COMPLIANT |
| `agent-contract` 14 | new files | UTF-8 no BOM; Node I/O; clipboard with `-Encoding utf8` | §10.3.1, §10.4, §13.3 | COMPLIANT |
| `agent-contract` 15 + registry | §3.4 flows | automated regression + recorded command | `test:rls-guards`, notifications suites, `check:notifications-grants`, R10 row | COMPLIANT |
| `qa-profiles.md` Q4 | security | baseline + changed-behavior + planted failure + owner-native | I0 5, AC8, P1–P3, O80-5 | COMPLIANT |
| 818 corollary | plants, new scripts | hash witnesses; hash in the final block | §10.4, `16z` | COMPLIANT |
| Task 865 owner scope lock (2026-09-21) | neighbouring scope | `listing_views` untouched | §8 | COMPLIANT |
| GR-0 / GR-1 / GR-3 / GR-3a | UI rules | — | NOT APPLICABLE: no visible artifact (§1) | NOT APPLICABLE |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Task | 881 |
| Active route | single route: write the six scripts, the test, the gate and the docs; the owner applies and probes |
| Decision source | D82-4 (2026-09-24, quoted in the header) |
| Starting worktree mode | clean at design time; I0 snapshot regardless |
| Exact allowed final write set | §7 |
| Blocked rule or decision | none |

| # | Checkpoint | Producer → artifact | Comparator / failure |
|---|---|---|---|
| 0 | Platform + status | I0 1–2 → `01`, `02` | not `win32` → stop |
| 1 | Consumer census | I0 3 → session log | a user-scoped consumer needing a removed privilege → STOP |
| 2 | Premise | I0 4 | a non-`is_read` update column → `PREMISE DRIFT` |
| 3 | Baselines | I0 5 → `03`, `04` | red → recorded, not fixed |
| 4 | Contract test + P1 | R9 → `05`, `06` | P1 stays green → the test cannot see a payload change → fix the test |
| 5 | SQL + probe + gate | R1–R8 | `10`–`13` as §13.2 expects |
| 6 | Gate plants | P2/P3 → `07`–`09` | a plant exits 0 → gate defect |
| 7 | Gates | §13.2 | any non-zero exit → `PARTIALLY IMPLEMENTED` |
| 8 | Final state | `16z`, `17` | a path outside §7 → report |
| 9 | Owner apply | O80-5 → grids, `20`, `21` | selftest does not raise → guard defect; a hardening error → finding (nothing applied); AFTER probe mismatch → finding; U2 failure → rollback + review decision |

| Contract claim | Counterexample | Evidence | Required outcome |
|---|---|---|---|
| The probe tells a grant refusal from an RLS refusal | A2/U4 already return `42501` BEFORE | `reason` = `rls` BEFORE, `grant` AFTER | the pair differs by reason, not by code |
| Mark-as-read survives a column-level grant | PostgREST needs more than `UPDATE (is_read)` | U2 AFTER (EXECUTED at O80-5) | `is_read_after=true`, or rollback + review |
| The bell's live update survives | Realtime needs a privilege this task removes | RT AFTER | `received_ms` ≤ 10000 |
| A revoke cannot silently leave a privilege | another grantor or `PUBLIC` | R4 post-condition | raises and rolls back |
| The declaration cannot drift again | someone widens `grant-discipline-audit.sql` | P2/P3 against R8 | exit 1 in CI |
