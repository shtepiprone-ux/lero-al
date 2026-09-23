# Task 870 — Data API privilege hardening: session log

Task path: `tasks/Sprints/Sprint_80_kickoff_prompt_Task_870_Data_API_Privilege_Hardening.md`

**Status (revision 0, superseded — see "## Revision 1" below for the current status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`): `PARTIALLY IMPLEMENTED — AWAITING
ORCHESTRATOR REVIEW`.** Every requirement (R1–R10) is implemented and self-validated; the full
§13.2 gate block is green. The status is not `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` because the
BEFORE probe measured a **PREMISE DRIFT** against Assumption 5.1 (below) on one of the 18 R tables, and
the task instructs the executor to stop and report that rather than adjust the sets or self-resolve it.
No file under `src/` was touched. GR-0/GR-1/GR-3/GR-3a confirmed **NOT APPLICABLE** — no visible
artifact, no `src/` change.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## PREMISE DRIFT (Assumption 5.1) — read first

Assumption 5.1: *"An S1 or S2 table returning anything other than `200` for anon `GET` before the
harden SQL … means the premise has drifted. STOP and report `PREMISE DRIFT` with the probe output.
Do not adjust the sets."*

The I0 BEFORE probe (`node scripts/task-870-anon-probe.mjs --phase before`, run twice for
reproducibility, identical both times) shows **17 of 18 R relations plus the view behaving exactly
as designed** (anon `200`, service-role `200`/`206`, `public_user_profiles` anon `401`/`42501` for
both `GET` and `PATCH` — the 2026-09-23 hotfix still holds). The one exception:

```
phase=before relation=support_messages role=anon method=GET http_status=401 pg_code=42501
phase=before relation=support_messages role=service_role method=GET http_status=200 pg_code=null
```

`support_messages` is one of the S2 fifteen (F12). Grid 1 (design-time, same day, 2026-09-23)
recorded `support_messages | t | t | t | t | t` — i.e. `anon_sel=true`. The live BEFORE probe now
reads `401`/`42501` for anon `GET`, meaning anon currently has **no** `SELECT` grant on
`support_messages` — a `42501` from PostgREST is a genuine missing-GRANT error, not an RLS-filtered
empty result (which would be `200` with zero rows). This is a real, reproducible discrepancy between
the design-time grid and the live database measured a few hours later, not a probe defect: the other
17 relations queried by the identical code path all returned the expected `200`.

Per the task's explicit instruction, **the R set is not adjusted** — `support_messages` stays in R,
in the harden script's revoke list, the guard array, the probe list and the rollback list, exactly
as designed. Revoking an already-unreachable table is harmless. What changed is only the executor's
claim of completion: AC4's "before" arm partially fails for this one relation, so this task is
reported `PARTIALLY IMPLEMENTED` rather than `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, and Opus
must decide whether Grid 1 was wrong, whether the owner (or Supabase) changed something on
`support_messages` between the grid capture and now, or whether this is otherwise immaterial before
authorizing O80-2.

## I0 — before writing anything

1. **Platform**: `win32`, `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al` — captured ad hoc at I0 start and again in the final gate block (`docs/sessions/evidence/task870/02-platform.txt`), identical both times.
2. **Pre-existing git status** — `docs/sessions/evidence/task870/01-status-before.txt`: 5 pre-existing
   ` M` paths (`docs/sessions/evidence/task861/storybook-dev.log`, `scripts/schema-drift-check.sql`,
   `src/lib/footer-route-allowlist.ts`, `src/modules/admin/actions/footer.ts`,
   `src/modules/admin/actions/index.ts`) plus a large `??` set from Task 867's untracked work-in-progress
   — none of it touched by this task. Pre-write `git hash-object` witness for the 5 ` M` paths:
   `docs/sessions/evidence/task870/01b-hash-before-modified.txt`.
3. **S2 zero-consumer census, re-run** — `docs/sessions/evidence/task870/i0-3-s2-census.txt`: all
   fifteen S2 names return 0 `.from()` hits and 0 whole-word embed hits via
   `git grep -nE "from\(['"]<t>['"]\)" -- src ':!*__tests__*'` and
   `git grep -nwE "<t>\(" -- src`, matching F12 exactly. Also checked `--untracked` (backlog-reserved.md
   row 864's corollary — plain `git grep` misses untracked files) against the same pattern set: 0 hits.
   **No table removed from R.**
4. **S1 per-site trace (R10a)** — every `.from('<t>')` site for `t` in S1
   (`docs/sessions/evidence/task870/i0-4-s1-from-sites.txt`), traced to its enclosing function and the
   client-construction call it uses:

   | Table | File:line | Enclosing function | Client variable | Constructed by |
   |---|---|---|---|---|
   | `user_change_log` | `src/app/admin/users/[id]/page.tsx:44` | `AdminUserProfilePage` | `db` | `createAdminClient()` (`:21`) |
   | `user_status_history` | `src/app/admin/users/[id]/page.tsx:56` | `AdminUserProfilePage` | `db` | `createAdminClient()` (`:21`) |
   | `user_status_history` | `src/app/api/cron/inactivity/route.ts:104` | `handle` | `db` | `createAdminClient()` (`:61`) |
   | `user_status_history` | `src/app/api/presence/route.ts:42` | `POST` | `db` | `createAdminClient()` (`:20`) |
   | `user_change_log` | `src/modules/admin/actions/index.ts:396` | `updateUserProfileFull` | `db` | `createAdminClient()` (`:366`) |
   | `user_status_history` | `src/modules/admin/actions/index.ts:417` | `updateUserProfileFull` | `db` | `createAdminClient()` (`:366`) |
   | `user_status_history` | `src/modules/admin/actions/index.ts:541` | `deactivateUser` | `db` | `createAdminClient()` (`:534`) |
   | `user_status_history` | `src/modules/admin/actions/index.ts:569` | `reactivateUser` | `db` | `createAdminClient()` (`:562`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:327` | `initiateEmailChange` | `db` | `createAdminClient()` (`:322`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:358` | `initiateEmailChange` | `db` | `createAdminClient()` (`:322`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:406` | `resendEmailVerification` | `db` | `createAdminClient()` (`:402`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:424` | `resendEmailVerification` | `db` | `createAdminClient()` (`:402`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:530` | `consumeEmailChangeToken` | `db` | `createAdminClient()` (`:527`) |
   | `email_change_tokens` | `src/modules/cabinet/actions/index.ts:541` | `consumeEmailChangeToken` | `db` | `createAdminClient()` (`:527`) |

   **Every S1 site uses the admin (service-role) client.** No user-scoped consumer found —
   `S1 USER-SCOPED CONSUMER` does not apply.
5. **BEFORE probe** — see "PREMISE DRIFT" above; full output at
   `docs/sessions/evidence/task870/03-probe-before.txt`.

## Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1 | `scripts/task-870-privilege-audit.sql` — one statement (AC1: `04-single-statement-check.txt` → `semicolons=1 endsWithSemicolon=true writeKeywords=none`), 8 checks (A1–A8), each emits a `(count)` row + detail rows, read-only (no write/DDL keyword present outside quoted string literals). |
| R2 | Harden script step 1 — `revoke all on public.public_user_profiles from anon, authenticated; grant select … to authenticated; grant select … to service_role;`, identical in effect to the hotfix (F1–F4), idempotent, header cites F1–F4. |
| R3 | Harden script step 0 — `do $$ … $$` guard over the 18 R names, checks g1 (table exists), g2 (`SECURITY INVOKER` function body reference), g3 (`supabase_realtime` publication), g4 (dependent view via `pg_depend`/`pg_rewrite`); one transaction, one exception naming every violation, applies nothing on raise. |
| R4 | Harden script step 2 — 18 literal `revoke all on public.<t> from anon, authenticated;` statements, one per R table, no `service_role` change, no table outside R (AC2: `05-harden-targets.txt`). |
| R5 | Harden script step 3 — `alter default privileges for role postgres in schema public revoke all on tables/sequences from anon, authenticated;`; step 4 `notify pgrst, 'reload schema';`; whole script is `begin; … commit;`. |
| R6 | `scripts/task-870-guard-selftest.sql` — identical guard block, planted `array['users']`; guard-block diff (below) shows the array literal is the only difference. Contains no `revoke`/`grant`/`alter`. Not executed against the live DB by the executor (SQL-Editor-only, per §13.3) — the owner runs it at O80-2 and must see an exception naming `public_user_profiles` (g4, since the view is defined directly over `users`, F2). |
| R7 | `scripts/task-870-anon-probe.mjs` — reads `.env.local` via `dotenv`/Node `fs`; `--phase before\|after`; anon+service-role GET on each R table, anon GET+PATCH on the view (id that cannot exist); prints only `phase, relation, role, method, http_status, pg_code`; exits 1 on network failure. Run BEFORE (`03-probe-before.txt`) — see PREMISE DRIFT above. |
| R8 | `scripts/task-870-rollback.sql` — `grant all` on exactly the 18 R tables, restores exactly `truncate, references, trigger` on tables + `update` on sequences (F17/R8's literal text), never names `public_user_profiles`, header warning in capitals. |
| R9 | `docs/rls-rules.md` — exactly the four §10.5 sections changed (quotes below); `git diff --unified=1` confirms no other section touched. |
| R10 | This session log — S1 per-site trace (R10a, above), S2 census re-run (R10b, above), actor matrix (R10c, kickoff §11, unchanged — no new actors introduced). |

## Current versus required behavior

| | Current (after this session) | Required | Status |
|---|---|---|---|
| Anon/authenticated write to `public_user_profiles` | refused (42501, live-confirmed) | refused, now versioned in R2 | ✅ script written; already true live |
| Anon `GET` on 17 of 18 R relations | `200` (live-confirmed BEFORE) | `401`/`42501` after O80-2 | script written; **owed: O80-2** |
| Anon `GET` on `support_messages` | already `401`/`42501` | `401`/`42501` after O80-2 | **PREMISE DRIFT — already true, contradicts F14; flagged for Opus** |
| Service-role `GET` on all 18 R relations | `200`/`206` (live-confirmed) | unchanged | ✅ confirmed both phases will match |
| Email change / admin status-change / presence / clear-history flows | service-role writes | unchanged | ✅ `test:auth` 28/28, `test:admin` 18/18, S1 trace all-admin-client |
| A table `postgres` creates tomorrow | already gets no arwd (F17) | gets nothing (incl. the Dxtm/w residue) | script written; **owed: O80-2** |

## Files Changed

| Path | Reason | `git hash-object` (final) |
|---|---|---|
| `scripts/task-870-privilege-audit.sql` (new) | R1 — one-grid, 8-check read-only audit | `330006849c1c604b1cab9d7061d6413cfcabad8e` |
| `scripts/task-870-harden-privileges.sql` (new) | R2–R5 — guard + revoke + default-privilege lockdown | `77959befbfff65f0ad7979777c8f0b3bc5332b57` |
| `scripts/task-870-guard-selftest.sql` (new) | R6 — planted-violation proof for the guard | `0268882fb3bd919c5bc4787b060a2ec2933f4eae` |
| `scripts/task-870-rollback.sql` (new) | R8 — break-glass restore | `6cb0029cdd958ee2c46b75227822a43c33de0d1d` |
| `scripts/task-870-anon-probe.mjs` (new) | R7 — two-armed live proof | `c57adc76c3e8f31709262aba9006fa4fff6b0e1e` |
| `docs/rls-rules.md` | R9 — 4 sections per §10.5 | `2a6898a55259f1106807f7eaf25d0437dd40d6dc` |
| `docs/backlog.md` | 870 registry row state cell only | committed by the owner in parallel as `ebf93808a` during this session |
| `docs/sessions/2026-09-23-task870-data-api-privilege-hardening.md` (new) | this session log | — |
| `docs/sessions/evidence/task870/**` (new) | I0 + gate-block evidence | — |

`docs/backlog.md`'s diff is limited to the single 870 state cell (verified: `git diff docs/backlog.md`
touches only line 56, and the physical line count is unchanged at 80 — `git show HEAD:docs/backlog.md
| wc -l` = 80, `wc -l docs/backlog.md` = 80. No `BACKLOG LIMIT BREACH`.)

## Guard-block diff (§10.4.4)

Node-based line-diff of the `do $$ … end $$;` block in both files (script + raw output retained at
`docs/sessions/evidence/task870/guard-block-diff-check.txt`): **58 lines each, exactly 1 line differs**
— the `v_names` array literal (`array['email_change_tokens', …]` vs `array['users']`). Every other
line, including whitespace, is byte-identical.

## `docs/rls-rules.md` before/after quotes (R9)

**1. "`SECURITY DEFINER` exception" condition 4 — before:**
> 4. GRANTs on the view are minimal — typically `grant select on <view> to anon, authenticated;`
>    and never to roles that don't need it.

**After:**
> 4. GRANTs on the view always begin with `revoke all on public.<view> from anon, authenticated;`,
>    then grant `select` only to the roles that have a named consumer — never to a role that
>    doesn't need it. **No view is ever granted `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`,
>    `REFERENCES` or `TRIGGER` to `anon` or `authenticated` (Task 870).** An auto-updatable
>    non-invoker view executes a write as its owner, bypassing the base table's RLS entirely —
>    this is exactly how `public.public_user_profiles` was writable by anon (see "Existing known
>    finding" below and Task 870's session log).

**2. "Existing known finding" — added (nothing removed):**
> - Its grants were `anon`/`authenticated` DML (the view is auto-updatable, so an `UPDATE`/
>   `INSERT` grant let anon and authenticated write through it) until the owner's 2026-09-23
>   hotfix revoked them, leaving only `SELECT` for `authenticated`. That hotfix is now recorded
>   in a versioned, idempotent script by Task 870's R2 (`scripts/task-870-harden-privileges.sql`
>   step 1), not only in the owner's SQL Editor history.

**3. "Public Schema GRANT Discipline" → "Effective dates" — added:**
> - **Measured 2026-09-23 (Task 870, F17, …):** on this project, `postgres`'s default privileges in
>   `public` already grant no `SELECT`/`INSERT`/`UPDATE`/`DELETE` to `anon`/`authenticated` for a
>   table `postgres` creates — only `TRUNCATE`/`REFERENCES`/`TRIGGER`/`MAINTAIN` (`Dxtm`) for tables
>   and `UPDATE` (`w`) for sequences. Task 870's `scripts/task-870-harden-privileges.sql` step 3
>   revokes that residue too.

**4. "Existing-table audit" — added:**
> Task 870 (Sprint 80, 2026-09-23) extended this audit to views, default privileges and
> `SECURITY DEFINER` functions: `scripts/task-870-privilege-audit.sql` (read-only, one grid, eight
> checks), `scripts/task-870-harden-privileges.sql` (revokes), `scripts/task-870-guard-selftest.sql`
> and `scripts/task-870-rollback.sql`.
>
> **After any SQL that creates or alters a `public` object, run
> `scripts/task-870-privilege-audit.sql`.** Checks A1, A3, A4 and A7 must each read `0`.
>
> **Every owner-run read-only script in this project returns exactly one result grid** — …

No statement was written claiming the SQL has been applied — that remains for the reviewer to
record after O80-2.

## Validation evidence (§13.2 final gate block)

| # | Command | Evidence path | Result |
|---|---|---|---|
| 1 | `node -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` | `02-platform.txt` | `win32 v22.22.3 …` |
| 2 | `node scripts/task-870-anon-probe.mjs --phase before` | `03-probe-before.txt` | 17/18 R + view as expected; `support_messages` PREMISE DRIFT (above); exit 0 (no network failure) |
| 3 | single-statement/write-keyword check (audit + selftest) | `04-single-statement-check.txt` | audit: `semicolons=1 endsWithSemicolon=true writeKeywords=none`; selftest: `semicolons=24 endsWithSemicolon=true writeKeywords=none` (PL/pgSQL body, no forbidden keyword outside its guard message) |
| 4 | harden-target extraction | `05-harden-targets.txt` | 1 revoke + 2 grants on `public_user_profiles`; 18 revokes, exactly the R set; nothing else |
| 5 | `npm run test:auth` | `06-test-auth.txt` | 6 files / 28 tests passed, exit 0 |
| 6 | `npm run test:admin` | `07-test-admin.txt` | 3 files / 18 tests passed, exit 0 |
| 7 | `npx eslint scripts/task-870-anon-probe.mjs` | `08-eslint-probe.txt` | file ignored (repo-wide `scripts/**` eslint ignore, pre-existing), exit 0 |
| 8 | `npm run check:file-integrity` | `09-check-file-integrity.txt` | 78 files clean, exit 0 |
| 9 | `npm run check:mojibake` | `10-check-mojibake.txt` | 0 artifacts / 6406 files, exit 0 |
| 10 | `npm run build` | `11-build.txt` | full route table printed, exit 0 |
| 11 | `git hash-object` (6 changed files) | `12-hash-object.txt` | recorded above in Files Changed |
| 12 | `git status --porcelain` (final) | `13-status-after.txt` | see AC9 note below |

## AC self-audit

- **AC1** ✅ — single-statement/keyword check clean; live grid closed only after O80-2 (owed).
- **AC2** ✅ — target list exactly matches R + `public_user_profiles`; no `role_permissions`/`listing_views`/`pages`.
- **AC3** — guard is written and structurally sound (design-time/ANALYTICAL); **EXECUTED** proof is O80-2's selftest run (owed).
- **AC4** — **PARTIAL.** BEFORE arm: 17/18 R + view match; `support_messages` is PREMISE DRIFT (already `401`/`42501`, not the assumed `200`). AFTER arm owed (O80-2/O80-3, `20-probe-after.txt`).
- **AC5** — owed: closed only from the owner's O80-2 AFTER audit grid.
- **AC6** ✅ — S1 trace complete (table above), `test:auth`/`test:admin` exit 0.
- **AC7** ✅ — rollback names exactly R, restores exactly the 3 default-privilege classes, never names the view, capitalized warning present.
- **AC8** ✅ — `git diff` of `rls-rules.md` limited to the 4 named sections; quotes above.
- **AC9** — `npm run build` / `check:file-integrity` / `check:mojibake` all exit 0. Final `git status --porcelain` (`13-status-after.txt`) vs `01-status-before.txt`: the only new paths are this task's own scope (§7) plus its evidence directory. Of the 5 pre-existing ` M` paths, 2 (`docs/sessions/evidence/task861/storybook-dev.log`, `scripts/schema-drift-check.sql`) remain ` M` with an identical `git hash-object` before/after (confirmed: `f371f911…`, `92ada5e5…`). The other 3 (`src/lib/footer-route-allowlist.ts`, `src/modules/admin/actions/footer.ts`, `src/modules/admin/actions/index.ts`) plus `docs/backlog.md` no longer appear as modified — **not this task's doing**: `git log` shows the owner committed Task 867's approved work (`8b073107b`) and this session's own `docs/backlog.md` row edit (`ebf93808a`) natively, in parallel, during this session (visible via `git --no-optional-locks log --oneline`). This task never touched the 3 `src/` files at any point (out of scope per §8) and its only `docs/backlog.md` edit was the single 870 row, which the owner's commit confirms was captured intact (`sed -n '56p' docs/backlog.md` shows the edited text). No path outside §7 was written by this task.

## Implementation validation notes

No defect found in the shipped SQL/script logic during self-validation (design-time/ANALYTICAL only
for the DB-side scripts — they cannot be executed against the live database from this session; only
the Node probe, which talks to the live REST API, was actually run). The one finding is the
PREMISE DRIFT documented above, which is a fact about the live database's current state, not a defect
in this task's deliverables.

## Assumptions, deviations, limitations

- **PREMISE DRIFT (Assumption 5.1)** on `support_messages` — reported above; sets not adjusted, as instructed.
- **MISSING EVIDENCE**: none — `.env.local` reached the project successfully; the probe ran cleanly both times.
- **S1 USER-SCOPED CONSUMER**: does not apply — every S1 site uses `createAdminClient()`.
- The audit/harden/selftest/rollback SQL files were written and self-validated for syntax/structure
  (single-statement check, keyword scan, target-list extraction, byte-identical guard-block diff) but
  **could not be executed against the live Postgres database from this session** — there is no direct
  `psql`/Postgres connection available to the executor, only the Supabase REST API (which the Node
  probe uses). Executing them is O80-2, owner-native, by design (§10.2: "The executor writes the SQL.
  The owner applies it.").
- A2/A5/A6 audit checks are analytical/unexecuted; the kickoff explicitly scopes A5/A6 as "list,
  never judge" and defers their remediation to a later, separately-filed task (§8 out-of-scope).
- **Concurrent owner git activity during this session** (read-only `git log` observation, not this
  task's action): the owner committed Task 867's approved work (`8b073107b`) and this session's own
  `docs/backlog.md` row edit (`ebf93808a`) natively in PowerShell while this session was running,
  which is why 3 of the 5 pre-existing ` M` paths and `docs/backlog.md` no longer show as modified in
  the final `git status` (see AC9 above). This task issued no git write of any kind, per the executor
  git boundary.

## Opus handoff

- **Primary decision needed**: is the `support_messages` PREMISE DRIFT material? Options: (a) accept
  it as a harmless pre-existing state (anon already can't read it — even better than assumed) and
  proceed to O80-2 unmodified; (b) investigate why Grid 1 (same-day) recorded `anon_sel=true` when
  the live measurement a few hours later shows `false` — possible causes: an out-of-band change, a
  stale grid capture, or a role-membership/session nuance in how Grid 1's query was run. This task's
  deliverables are correct either way (revoking an already-revoked grant is a no-op), so the decision
  gates the review verdict, not a code change.
- **Evidence to inspect**: `docs/sessions/evidence/task870/03-probe-before.txt` (verbatim probe
  output), `04-single-statement-check.txt`, `05-harden-targets.txt`, `06`–`11` (test/lint/build gates),
  `12-hash-object.txt`, `13-status-after.txt`, `guard-block-diff-check.txt`, `i0-3-s2-census.txt`,
  `i0-4-s1-from-sites.txt`.
- **Owner steps still owed (§13.3, O80-1 → O80-3) — NOT done, stated as owed, never as done:**
  1. O80-1: Supabase Dashboard → Data API → turn OFF "Automatically expose new tables."
  2. Run `scripts/task-870-privilege-audit.sql` in the SQL Editor → BEFORE grid.
  3. Run `scripts/task-870-guard-selftest.sql` → expect an error naming `public_user_profiles`.
  4. Run `scripts/task-870-harden-privileges.sql` → expect `Success. No rows returned`.
  5. Run `scripts/task-870-privilege-audit.sql` again → AFTER grid (A1/A3/A4/A7 must read `0`).
  6. Run `node scripts/task-870-anon-probe.mjs --phase after` → `20-probe-after.txt`.
  7. O80-3: manual check — signed-in owner card renders, guest sign-in CTA renders,
     `/admin/users/[id]` history sections load.
- The audit's BEFORE grid, the selftest's error text, the harden result line, the AFTER grid, and
  `20-probe-after.txt` are all still owed from the owner and are required before AC1/AC3/AC4/AC5 can
  close.

## Backlog update

`docs/backlog.md` line 56 (the 870 · 871 registry row) — state cell updated to
`PARTIALLY IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, PREMISE DRIFT noted, owner steps flagged as
owed. Resulting physical line count: **80** (unchanged from `HEAD`). No `BACKLOG LIMIT BREACH`.

---

## Revision 1 — review 1 remediation (2026-09-23)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.** All four review-1 findings
(§16 F1–F4) are fixed. **The revision-0 PREMISE DRIFT is resolved by F4**: the reviewer's own live
measurement showed the `support_messages` anon `401`/`42501` comes from an RLS policy subquery that
reads `support_tickets` (where anon has no `SELECT`), not from a grant change on `support_messages`
itself. `anon` still holds `SELECT` on `support_messages`; R is unchanged. Revision 0's stop-and-report
was the correct call — the underlying fact needed a live differentiator (`denied_relation`) that
revision 0's probe didn't yet have.

Re-entry mode: `remediation`, started at §16.5. `docs/rls-rules.md` and `scripts/task-870-rollback.sql`
were **not touched** (confirmed by identical `git hash-object` values below). I0 was **not** re-run.
Revision-0 evidence files (`00`–`13`, `i0-*`, `guard-block-diff-check.txt`) are untouched; all new
evidence is `r1-*` in the same `docs/sessions/evidence/task870/` folder.

### Fixes applied

- **F1 (g4 naming, `scripts/task-870-harden-privileges.sql` + `scripts/task-870-guard-selftest.sql`,
  byte-identical in both):** replaced the `v_dep_count int` counter with `v_dep_names text` populated by
  `select string_agg(distinct vc.relname, ',' order by vc.relname) into v_dep_names from pg_depend d
  join pg_rewrite rw on rw.oid = d.objid and d.classid = 'pg_rewrite'::regclass join pg_class vc on
  vc.oid = rw.ev_class and vc.relkind in ('v', 'm') join pg_namespace vn on vn.oid = vc.relnamespace
  where d.refobjid = v_tbl_oid and d.refclassid = 'pg_class'::regclass and vn.nspname = 'public';`, and
  the raise condition/message to `if v_dep_names is not null then v_violations :=
  array_append(v_violations, format('g4: view(s) %s depend on %s', v_dep_names, v_name)); end if;`. The
  selftest's exception will now read `… g4: view(s) public_user_profiles depend on users …`, satisfying
  AC3/R6 literally.
- **F2 (g2 aggregate guard, both files):** added `and p.prokind in ('f', 'p')` to g2's function-scan
  `where` clause, so `pg_get_functiondef` is never called on an aggregate (which would raise and abort
  the guard for a reason unrelated to any real violation).
- **F3 (A8 schema filter, `scripts/task-870-privilege-audit.sql`):** `a8_detail` now joins
  `pg_namespace n on n.oid = c.relnamespace` and filters `where n.nspname = 'public' and (...)`, the same
  pattern `a4_detail` already used, so a same-named relation in another schema (e.g. `realtime.messages`)
  can no longer enter A8's grid.
- **F4 (probe `denied_relation`, `scripts/task-870-anon-probe.mjs`):** added `pgInfoOf()` (replacing
  `pgCodeOf()`), which also extracts `denied_relation` from the PostgREST JSON body's `message` field via
  `/permission denied for (?:table|view|relation) ([A-Za-z0-9_."]+)/`, printing `null` for a 2xx response
  or a non-matching message. Every print line now ends `pg_code=<code> denied_relation=<name|null>`. The
  raw `message` text itself is still never printed.

### Guard-block diff, re-verified after F1/F2

Both blocks are still **59 lines, exactly 1 differing** (the `v_names` array literal) — re-run with the
same Node line-diff approach as revision 0, output at `docs/sessions/evidence/task870/r1-04-guard-check.txt`
via the kickoff's own §16.5 one-liner, which additionally asserts (all `true` for both files):
`g4_names_views` (the `string_agg(distinct vc.relname` pattern is present), `g4_msg` (the
`'g4: view(s) %s depend on %s'` format string is present), `g2_prokind` (`prokind in ('f', 'p')` is
present).

### r1-02 — BEFORE probe, verbatim (with `denied_relation`)

```
phase=before relation=email_change_tokens role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=email_change_tokens role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=user_status_history role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=user_status_history role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=user_change_log role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=user_change_log role=service_role method=GET http_status=206 pg_code=null denied_relation=null
phase=before relation=agent_reviews role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=agent_reviews role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=amenities role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=amenities role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=amenity_translations role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=amenity_translations role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=conversations role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=conversations role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=currency_rates role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=currency_rates role=service_role method=GET http_status=206 pg_code=null denied_relation=null
phase=before relation=history_clear_events role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=history_clear_events role=service_role method=GET http_status=206 pg_code=null denied_relation=null
phase=before relation=languages role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=languages role=service_role method=GET http_status=206 pg_code=null denied_relation=null
phase=before relation=listing_amenities role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=listing_amenities role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=listing_translations role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=listing_translations role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=location_translations role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=location_translations role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=messages role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=messages role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=notification_settings role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=notification_settings role=service_role method=GET http_status=206 pg_code=null denied_relation=null
phase=before relation=page_translations role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=page_translations role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=support_messages role=anon method=GET http_status=401 pg_code=42501 denied_relation=support_tickets
phase=before relation=support_messages role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=verification_requests role=anon method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=verification_requests role=service_role method=GET http_status=200 pg_code=null denied_relation=null
phase=before relation=public_user_profiles role=anon method=GET http_status=401 pg_code=42501 denied_relation=public_user_profiles
phase=before relation=public_user_profiles role=anon method=PATCH http_status=401 pg_code=42501 denied_relation=public_user_profiles
```

Matches §16.4's amended BEFORE arm exactly: 17/18 R tables anon `200`; `support_messages` anon
`401`/`42501` with `denied_relation=support_tickets` (the policy-subquery signature, not a drift); the
view `401`/`42501` with `denied_relation=public_user_profiles` for both `GET` and `PATCH`; service role
`200`/`206` throughout.

### r1-04 / r1-05 results

- `r1-04-guard-check.txt`: `lines 59 59 differing [3]` — a single differing line (the array literal);
  `g4_names_views=true`, `g4_msg=true`, `g2_prokind=true` for **both** `task-870-harden-privileges.sql`
  and `task-870-guard-selftest.sql`.
- `r1-05-a8-filter-check.txt`: `a8_public_filter=true`.

### Gate exit codes (`r1-06` → `r1-09`)

| # | Command | Evidence | Exit |
|---|---|---|---|
| r1-06 | `npx eslint scripts/task-870-anon-probe.mjs` | `r1-06-eslint-probe.txt` | 0 (file ignored — repo-wide `scripts/**` eslint ignore, pre-existing, same as revision 0) |
| r1-07 | `npm run check:file-integrity` | `r1-07-check-file-integrity.txt` | 0 — 33 files clean (smaller candidate set than revision 0's 78, because Task 867's untracked files were committed by the owner in the interim — see AC9 note above) |
| r1-08 | `npm run check:mojibake` | `r1-08-check-mojibake.txt` | 0 — 0 artifacts / 6419 files |
| r1-09 | `npm run build` | `r1-09-build.txt` | 0 — full route table printed |

### r1-10 — hash-object, compared against revision 0

| File | Revision 0 (`12-hash-object.txt`) | Revision 1 (`r1-10-hash-object.txt`) | Changed? |
|---|---|---|---|
| `scripts/task-870-privilege-audit.sql` | `330006849c1c604b1cab9d7061d6413cfcabad8e` | `e61bbb47faf7ac0f7dc02b5ec1c2ae0530770db4` | yes (F3) |
| `scripts/task-870-harden-privileges.sql` | `77959befbfff65f0ad7979777c8f0b3bc5332b57` | `b1145e11404a1a7fa4dde6a0e2a465a6516caa9b` | yes (F1, F2) |
| `scripts/task-870-guard-selftest.sql` | `0268882fb3bd919c5bc4787b060a2ec2933f4eae` | `dfa2b995d713ae91a1be530e1383785156f88928` | yes (F1, F2) |
| `scripts/task-870-rollback.sql` | `6cb0029cdd958ee2c46b75227822a43c33de0d1d` | `6cb0029cdd958ee2c46b75227822a43c33de0d1d` | **no — unchanged, as required** |
| `scripts/task-870-anon-probe.mjs` | `c57adc76c3e8f31709262aba9006fa4fff6b0e1e` | `d723409d994a15157eb10b8aa9071897a89040b0` | yes (F4) |
| `docs/rls-rules.md` | `2a6898a55259f1106807f7eaf25d0437dd40d6dc` | `2a6898a55259f1106807f7eaf25d0437dd40d6dc` | **no — unchanged, as required** |

### r1-11 — final status

`r1-11-status-after.txt`: only this task's §7-scoped paths plus its evidence directory are new/modified
(`docs/rls-rules.md` shows as ` M` from revision 0's earlier edit, unchanged again this revision; the
two untouched pre-existing ` M` paths from revision 0 remain ` M`). No path outside scope.

### Revision-1 files changed

| Path | Reason |
|---|---|
| `scripts/task-870-privilege-audit.sql` | F3 — A8 schema filter |
| `scripts/task-870-harden-privileges.sql` | F1 — g4 names dependent views; F2 — g2 skips non-function `prokind` |
| `scripts/task-870-guard-selftest.sql` | F1, F2 — identical fixes, guard block re-verified byte-identical except the array literal |
| `scripts/task-870-anon-probe.mjs` | F4 — prints `denied_relation` |
| `docs/sessions/2026-09-23-task870-data-api-privilege-hardening.md` | this `## Revision 1` section |
| `docs/backlog.md` | 870 row → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)` |
| `docs/sessions/evidence/task870/r1-*` (11 files, new) | revision-1 gate evidence |

**Not changed** (confirmed by identical hash): `scripts/task-870-rollback.sql`, `docs/rls-rules.md`.

### Owner steps still owed — unchanged, still owed, never done

Same seven O80-1→O80-3 steps listed above under "Opus handoff" in the revision-0 section, now run
against the corrected scripts. Nothing has been applied to the live database by anyone in this
revision.
