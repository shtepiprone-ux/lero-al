# Task 881 — `notifications` least privilege: session log (Sonnet executor)

Kickoff: `tasks/Archive/Sprint_80_kickoff_prompt_Task_881_Notifications_Least_Privilege_Grants.md` (archived at approval, review 4; ledger `docs/reviews/2026-09-25-task881-notifications-least-privilege.review-ledger.json`).
Sprint 80. QA profile **Q4**. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 3).

**This log covers four passes.** The first pass (below, through "Backlog update") was reviewed
2026-09-25 and returned `NEEDS REVISION` (review 1) — commit `98b7ad8fb`, kickoff §16. The
**Revision 1** section covers that remediation; it was reviewed 2026-09-25 and returned
`NEEDS REVISION` again (review 2) — commit `ce8691e60`, kickoff §17, because the grant gate RV1
shipped was still not fail-closed. The **Revision 2** section covers that remediation; it was
reviewed 2026-09-25 and returned `PARTIALLY VERIFIED` (review 3) — commit `9e5a48053`, kickoff
§18 — meaning every code-side acceptance criterion was accepted except one remaining gap in the
gate (RF8), with the owner-native O80-5 evidence still outstanding. The owner then ran O80-5 to
completion in parallel (commit `1f3c2114d`, kickoff §18.2–§18.4), including an orchestrator-applied
hotfix to the audit SQL's N5 branch (RF9) hit live during that run. The **Revision 3** section at
the end of this file covers RV7, the gate fix for RF8, plus the file-integrity fix the owner's
O80-5 transcripts needed (§18.4's closing note). Every artifact named `r3-*` supersedes its
`r2-*` counterpart named in §18.1 of the kickoff; every artifact not superseded remains final;
earlier-pass artifacts are kept throughout, not deleted, for the record.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
GR-0/GR-1/GR-3/GR-3a are **NOT APPLICABLE** per the kickoff §1: no visible artifact and no surface
file in the write set. Confirmed by re-reading GR-0 and clauses 16b–16c in full, and by the final
diff containing no `src/` file other than the one new test file.

## Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1/AC1 | `scripts/task-881-notifications-audit.sql` — one statement, ends `;`, no write keyword. `10-audit-single-statement.txt`: `semicolons=1 endsWithSemicolon=true writeKeywords=none`. Five checks (N1–N5), each with a `(count)` row (`union all` branches in the file). |
| R2/R4/R5/AC2 | `11-sql-targets.txt`: hardening file revokes all from `anon` and `authenticated`, grants exactly `select` and `update (is_read)` to `authenticated`; rollback grants the seven table privileges to `authenticated` only, no `anon` line. Neither file names `service_role` or `postgres`. |
| R3/AC3 | Guard `do $$…$$` block is byte-identical between `task-881-guard-selftest.sql` and the STEP 0 block of `task-881-notifications-least-privilege.sql` except the table-name literal (`'users'` vs `'notifications'`) — verified programmatically (`g1 === g2` after normalizing the literal → `true`, no `diff` output). Live selftest run (must raise naming `public_user_profiles`) is owner-native, O80-5 step 2. |
| R4/AC2/AC5 | Post-condition `do $$…$$` block (STEP 2 of the hardening script) asserts the exact target grant state and raises+rolls back on any mismatch. Live proof is O80-5. |
| R5/AC2 | `scripts/task-881-rollback.sql` — grants the seven table privileges to `authenticated`, never `anon` (F8-based design choice, documented in the file header). |
| R6/AC4 | `scripts/task-881-notifications-probe.mjs` — 10 arms (A1–A4, U1–U5, RT) in the kickoff's order, classifies `grant`/`rls`/`none`/`other`, compares against an embedded per-phase expectation table (§11), exits 0/1/2. Executor-provable arm: `12-probe-no-env.txt` — no `PROBE_EMAIL`/`PROBE_PASSWORD` → exit 2, no secret printed. Live BEFORE/AFTER runs are owner-native, O80-5 (owed — see below). |
| R7/AC6 | `scripts/grant-discipline-audit.sql` `:158-166` (shifted by the added comment lines) now grants `authenticated` `select` and `update (is_read)` only; footer list no longer lists `notifications` as "no changes required" and points to Task 881. No other statement in the file changed (confirmed by `15b-check-listing-reports-grants.txt` staying green — the unrelated `listing_reports` gate reads the same file). |
| R8/AC7 | `scripts/check-notifications-grants.mjs` + `check:notifications-grants` script + `governance-pr.yml` step after the Task 460 step. Final tree: `13-check-notifications-grants.txt` exit 0. P2 (`07-plant-p2.txt`) exit 1 naming the table-level `update` overgrant. P3 (`08-plant-p3.txt`) exit 1 naming the `anon` grant. Restore: `09-gate-restored.txt` exit 0, hash `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` both before P2 and after restore. Prints its scope statement every run (see any of `07`/`08`/`09`/`13`). |
| R9/AC8 | `src/modules/notifications/lib/__tests__/mutations.smoke.test.ts` — 9 tests: user-scoped-client-only + payload-keys-exactly-`[is_read]` + filter predicates + `{error}` diagnosability for both mark-as-read actions, and admin-client-only for `createNotification`. Pinned against the **unchanged** source first (`_r9-initial-run.txt`, 9/9 pass) before any hardening SQL was written. P1 plant (`05-plant-p1.txt`): payload-keys test genuinely FAILs. Restore (`06-restored-p1.txt`): 9/9 pass, hash `563f0f0be0a83d32fd9c9938b9e989ce6126afdb` both before the plant and after restore. `14-test-rls-guards.txt`: both test files run under `test:rls-guards`, 24/24 pass. |
| R10/AC9 | `docs/rls-write-path-manifest.md` Table 1: 3 new rows (`createNotification`, `markNotificationRead`, `markAllNotificationsRead`). `docs/critical-flow-registry.md` "P0 — Server-action / RLS write paths": 1 new row ("Notification read-state write + `notifications` grant contract"). `docs/rls-rules.md` → "Existing-table audit": one new paragraph recording the 881 contract, scripts and gate. |
| AC10 | `16-build.txt`: `npm run build` exit 0, route table printed. `15c-typecheck.txt` exit 0. `14-test-rls-guards.txt` exit 0. `15b-check-listing-reports-grants.txt` exit 0. `15a-test-notifications.txt` (full module suite) exit 0 (5 files / 32 tests). `15e`/`15f` exit 0. `17-status-after.txt` vs `01-status-before.txt`: every changed path is inside kickoff §7; `mutations.ts` shows **no diff** (byte-identical to the pre-task baseline after the P1 plant/restore). |

`GR-4 AC AUDIT` is the kickoff's own (task-design artifact); not re-emitted here — this is an
execution session, not a task-design response.

## Current versus required behavior

Matches kickoff §9 exactly; no deviation. `anon` moves from RLS-neutralised access to grant
refusal on every operation; `authenticated` loses table-level `UPDATE`/`INSERT`/`DELETE` and every
privilege on every column but `is_read`; the bell's read, Realtime subscription, and both
mark-as-read actions are unchanged in code and (per the automated evidence above) in the write
path's own contract. Live confirmation that the column-level grant does not break PostgREST's PATCH
(Assumption 1) is **owed** — O80-5.

Negative flows: per kickoff §11's applicability table — anon at the grant layer, a user writing a
non-`is_read` column/inserting/deleting, legitimate mark-as-read, Realtime delivery to the row's
owner, the service-role insert, the guard firing, and a revoke-under-another-grantor are all
**Applicable** and covered by the evidence above (automated where possible, owner-native probe for
the live grant/RLS distinction and Realtime).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/task-881-notifications-audit.sql` (new) | R1 — read-only one-grid audit |
| `scripts/task-881-notifications-least-privilege.sql` (new) | R2/R3/R4 — guarded, post-conditioned hardening |
| `scripts/task-881-guard-selftest.sql` (new) | R3 — planted-violation proof for the guard |
| `scripts/task-881-rollback.sql` (new) | R5 — break-glass restore, `anon` deliberately excluded |
| `scripts/task-881-notifications-probe.mjs` (new) | R6 — owner-run two-armed live probe |
| `scripts/check-notifications-grants.mjs` (new) | R8 — static CI grant gate |
| `scripts/grant-discipline-audit.sql` | R7 — corrected `notifications` declaration + footer |
| `package.json` | R8/R9 — `check:notifications-grants` script; `test:rls-guards` runs both test files |
| `.github/workflows/governance-pr.yml` | R8 — new step after the Task 460 step |
| `src/modules/notifications/lib/__tests__/mutations.smoke.test.ts` (new) | R9 — write-path column-contract pin |
| `docs/rls-write-path-manifest.md` | R10 — three new Table 1 rows |
| `docs/critical-flow-registry.md` | R10 — one new critical-flow row |
| `docs/rls-rules.md` | R10 — "Existing-table audit" paragraph |
| `docs/backlog.md` | 881 registry cell — state only |
| `docs/sessions/2026-09-25-task881-notifications-least-privilege.md` (new) | this session log |
| `docs/sessions/evidence/task881/*` (new) | all numbered evidence files |

`src/modules/notifications/lib/mutations.ts` is **not** in this list — it was planted (P1) and
byte-identically restored (hash `563f0f0be0a83d32fd9c9938b9e989ce6126afdb` before and after;
`git status` shows it clean in the final tree).

## Validation evidence

All commands and real exit codes are captured in `docs/sessions/evidence/task881/`:

- I0: `02-platform.txt` (`win32 v22.22.3`), `03-baseline-test-rls-guards.txt` (exit 0, pre-task),
  `04-baseline-check-listing-reports-grants.txt` (exit 0, pre-task).
- Consumer census (I0 step 3): re-ran `git grep -n "from('notifications')\|table: 'notifications'" -- src`
  — identical 5 hits to the kickoff's §3.2 matrix, all `createAdminClient`/user-scoped `createClient`
  as documented. Broader `git grep -n "notifications" -- src ':!*.test.*' ':!*.stories.*'` found no
  dynamic table-name consumer and no user-scoped consumer needing a privilege R2 removes. No
  `UNLISTED NOTIFICATIONS CONSUMER`.
- Premise check (I0 step 4): re-read `mutations.ts:43-64` — both updates write only `is_read`. No
  `PREMISE DRIFT`.
- R9 pin: `_r9-initial-run.txt` (9/9 pass against unchanged source).
- P1 plant/restore: `05-plant-p1.txt` (1 fail), `06-restored-p1.txt` (9/9 pass), hash
  `563f0f0be0a83d32fd9c9938b9e989ce6126afdb` both sides.
- P2/P3 plants/restore: `07-plant-p2.txt`, `08-plant-p3.txt` (each exit 1, naming the cause),
  `09-gate-restored.txt` (exit 0), hash `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` both sides.
- Final §13.2 block: `10-audit-single-statement.txt`, `11-sql-targets.txt`, `12-probe-no-env.txt`
  (exit 2, no secret), `13-check-notifications-grants.txt` (exit 0), `14-test-rls-guards.txt`
  (24/24 pass), `15a-test-notifications.txt` (32/32 pass, 5 files), `15b-check-listing-reports-grants.txt`
  (exit 0), `15c-typecheck.txt` (exit 0 — one round-trip: the first run failed with `TS2556` on the
  test file's spread-argument mocks; fixed by removing the unneeded `(...args)` wrapper since the
  real `createClient()`/`createAdminClient()` take no arguments; re-run exit 0), `15d-eslint.txt`
  (0 errors; the two new `scripts/*.mjs` files print the pre-existing "ignored because of a matching
  ignore pattern" warning, same as every other file under `scripts/`), `15e-check-file-integrity.txt`
  (35 files clean), `15f-check-mojibake.txt` (0 artifacts / 6775 files), `16-build.txt` (exit 0, full
  route table), `16z-hash-object.txt` (hash of every changed file, tied to this transcript),
  `17-status-after.txt` (every path inside kickoff §7; compared against `01-status-before.txt`).

## Visual source trace

Not applicable — no visible UI artifact changes (kickoff §1).

## Canonical UI decision record

Not applicable — no visible UI artifact changes (kickoff §1). GR-0/GR-1/GR-3/GR-3a confirmed
NOT APPLICABLE per the preflight above.

## Implementation validation notes

- One defect found and fixed during this session: the R9 test file's `vi.mock` factories originally
  wrapped `mockCreateClient`/`mockCreateAdminClient` in a `(...args: unknown[]) => mock(...args)`
  arrow, which `tsc` rejected (`TS2556`) because the mocks' inferred signature (from their
  zero-argument implementation) is not a rest-parameter type. Fixed by calling the mocks directly
  with no arguments, matching the real `createClient()`/`createAdminClient()` signatures. No product
  code was affected; `typecheck` was red then green within this session (`15c-typecheck.txt` is the
  final, green run).
- No other implementation defect found. The plant/restore triad (P1 on the test, P2/P3 on the gate)
  all produced the expected fail→pass transitions with matching hash witnesses.

## Assumptions, deviations, and limitations

- **Assumption 1 (kickoff §5.1), not executed at design or execution time:** whether
  `UPDATE (is_read)` plus the retained table-level `SELECT` is sufficient for PostgREST's PATCH to
  succeed (probe arm U2 AFTER) is unproven until O80-5 runs live. If it fails, the owner runs
  `scripts/task-881-rollback.sql` and the review decides between table-level `UPDATE` and a fix — the
  executor does not pre-empt that, per the kickoff.
- **No deviation from the kickoff's scope, order, or file list.** The write set matches §7 exactly;
  no `src/` file other than the one new test file was touched.
- **Audit SQL output shape:** the kickoff's R1 names the tuple `(check_id, sort_key, object_name,
  detail)`; `task-881-notifications-audit.sql`'s final `select` uses exactly those four column names,
  unlike Task 870's precedent script (which selects `object_name, role_name` instead of
  `sort_key, object_name`). This is a deliberate, literal reading of R1's stated tuple, not an
  unannounced deviation — flagged here for the reviewer to confirm the reading is the one intended.
- **Limitation:** the audit SQL, the guard, the post-condition, and the probe's live phases have not
  been run against a real Supabase database in this session — there is no DB access from the
  executor. Every SQL file was validated only syntactically (single-statement/no-write-keyword check
  for the audit; guard byte-identity check; `node --check`-equivalent review by inspection) and via
  the static `check:notifications-grants` gate. This is exactly what O80-5 exists to close.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task881/`.
- Confirm the R1 audit's four-column reading (`check_id, sort_key, object_name, detail`) against the
  kickoff's own literal text before treating AC1 as fully closed — flagged above as a judgment call.
- **O80-5 is owed, not done.** The owner must run, in order: BEFORE audit → BEFORE probe → guard
  selftest (expect an error naming `public_user_profiles`) → the hardening script (expect
  "Success. No rows returned") → AFTER audit → AFTER probe → the two manual checks (mark-as-read
  holds; a second account's notification appears live) → the signed-out console check. Exact block:
  kickoff §13.3.
- If the AFTER probe's U2 fails, or O80-5 step 4's manual mark-as-read does not hold, the owner runs
  `scripts/task-881-rollback.sql` and returns its output — do not approve until that branch is
  resolved one way or the other.
- This task never touched `role_permissions` (871's table) or `listing_views`/`pages` (865/867's
  scope locks) — confirmed by the write set and the consumer census.

## Backlog update

`docs/backlog.md` line 56 (the `871 · 874 · 877 · 881` registry row): the `881` cell now reads
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a pointer to this session log and a note that
O80-5 is owed. Physical line count after the edit: **80** (unchanged — the edit was in-place on an
existing line, no line added). No `BACKLOG LIMIT BREACH`.

---

## Revision 1 — remediation of review 1 (`NEEDS REVISION`)

Kickoff §16, commit `98b7ad8fb`. Re-entry mode: `remediation`, started at §16.2 RV1. Status after
this pass: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
Still **NOT APPLICABLE** — this revision touches no `src/` file besides the already-shipped test
file, which is unchanged in this pass (confirmed: `mutations.smoke.test.ts` is not in the revision
diff, and its own hash was never re-touched).

### RF1–RF5 → RV1–RV5

| Finding | Correction | Evidence |
|---|---|---|
| **RF1** (P2) — `check:notifications-grants` misses widened/extra column grants and the unqualified table spelling | **RV1** — rewrote `scripts/check-notifications-grants.mjs`: parses each `GRANT` statement into privilege-list / `ON` target / `TO` roles clauses (top-level-comma-aware, so a column list's internal commas can't be mistaken for extra privileges); the `ON`-target match now accepts `notifications`, `public.notifications`, quoted forms, and `ON ALL TABLES IN SCHEMA public`; the `UPDATE` check now flags **any** column list other than exactly `is_read` (bare, widened, or a different column), not just a fully bare `UPDATE` | `r1-09-gate-restored.txt`, `r1-13-check-notifications-grants.txt` (both exit 0 on final tree); P2/P3 re-proven (`r1-07-plant-p2.txt`, `r1-08-plant-p3.txt`) plus three new plants proving the specific gaps RF1 found: `r1-07b-plant-p4.txt` (widened column list `(is_read, title)`), `r1-07c-plant-p5.txt` (extra column grant `(user_id)`), `r1-08b-plant-p6.txt` (unqualified `notifications` name granted to `anon`) |
| **RF2** (P3) — the probe calls `process.exit(2)` after the setup row exists, skipping `finally`; cleanup also misses the setup row after a title rename | **RV2** — rewrote `scripts/task-881-notifications-probe.mjs`: every post-setup-insert failure now calls a `failSetup()` helper that `throw`s (caught by the existing `catch`, which sets `process.exitCode = 2`) instead of calling `process.exit()`; only `parsePhase`, the two env-var checks, and the sign-in failure still call `process.exit()` (all before any row exists); the RT arm's insert now captures its own row id (`rtInsertedId`); `finally` deletes by `id IN (probeId, rtInsertedId)` **and** by `user_id + title = PROBE_TITLE`, so a renamed setup row (U3 BEFORE) and an untracked-id row (a hypothetical successful U4) are both still caught; removed the unused `anonRtClient` | `r1-12b-probe-exit-lines.txt` — `process.exit lines=42,103,148,167,171,194 first insert line=202 all exits before first insert=true` (lines 42/148 are the header-comment/inline-comment mentions of the literal string, not calls); `r1-12-probe-no-env.txt` — exit 2, no secret, unchanged behavior for the one call site this task can exercise without a live DB |
| **RF3** (P3) — the audit's header comment claims a wrong BEFORE value for N2 | **RV3** — comment-only correction: `N2 count = 2 × the column count (20 with ten columns)`, since `has_column_privilege` is true for every column once the role holds the table-level privilege | `r1-10-audit-single-statement.txt` byte-identical to first-pass `10` (diffed, `IDENTICAL`); `r1-10b-audit-statement-length-before.txt` vs `r1-10b-audit-statement-length.txt` — both `stripped_statement_chars=3383` (comment-stripped statement provably unchanged) |
| **RF4** (P3) — the footer NOTE misstates what the file used to grant, and displaces the pre-existing idempotency line | **RV4** — reworded the NOTE to say the file's own declaration was `select`-only (never table-level `UPDATE`), and that the **live database** (not this file) held full DML; moved the idempotency line back directly under the table list | `r1-17b-grant-discipline-diff.txt` — every hunk outside the one genuine statement line (`grant update (is_read) …`, unchanged from the first pass) is a `--`-prefixed comment line |
| **RF5** (P3) — plant evidence files carry no hash witness | **RV5** — every plant (P2, P3, P4, P5, P6) now has its own evidence file containing the pre-plant `git hash-object`, the full gate transcript with `EXIT_CODE=`, and the post-restore `git hash-object`, both equal in every file | `r1-07-plant-p2.txt`, `r1-08-plant-p3.txt`, `r1-07b-plant-p4.txt`, `r1-07c-plant-p5.txt`, `r1-08b-plant-p6.txt` |

The reviewer's closed items required no action: AC8's P1 witness (`06-restored-p1.txt`) already
recorded the post-restore hash `563f0f0be0a83d32fd9c9938b9e989ce6126afdb`, unchanged this pass
(`mutations.ts` untouched — not in `r1-16z-hash-object.txt`'s inputs list). R7's two-statement form
in `grant-discipline-audit.sql` (`grant select …;` + `grant update (is_read) …;`) is kept, not
merged — confirmed unchanged in `r1-17b-grant-discipline-diff.txt`.

### Plant/restore hash witnesses (RV5)

| Plant | File planted | Pre-plant hash | Post-restore hash | Match |
|---|---|---|---|---|
| P2 — bare `update` | `task-881-notifications-least-privilege.sql` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | ✅ |
| P3 — `grant select … to anon` | `task-881-notifications-least-privilege.sql` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | ✅ |
| P4 — widened `update (is_read, title)` | `grant-discipline-audit.sql` | `2ea9dd1aada0a7c484de54b277c9703b9cda6e91` | `2ea9dd1aada0a7c484de54b277c9703b9cda6e91` | ✅ |
| P5 — extra `update (user_id)` | `task-881-notifications-least-privilege.sql` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | ✅ |
| P6 — unqualified `notifications` to `anon` | `task-881-notifications-least-privilege.sql` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` | ✅ |

Each row's two hashes are read from that plant's own evidence file (not asserted from this table).

### Superseded artifacts

First-pass `07`, `08`, `09`, `10`, `12`, `13`, `16`, `16z` and `17` are **superseded** by their
`r1-` counterparts (`r1-07…`, `r1-08…`, `r1-09`, `r1-10`, `r1-12`, `r1-13`, `r1-16`, `r1-16z`,
`r1-17`) and kept for the record, not deleted. `01`–`06`, `_r9-initial-run.txt`, `_guard1.txt`,
`_guard2.txt`, `11-sql-targets.txt`, `14`, `15a`, `15b` and `15d` are reused unchanged — re-verified
this pass at `r1-14-test-rls-guards.txt` (24/24), `r1-15b-check-listing-reports-grants.txt` (exit
0), `r1-15c-typecheck.txt` (exit 0), `r1-15e-check-file-integrity.txt` (58 files clean, more than
the first pass's 35 because the evidence directory itself now has more files in it),
`r1-15f-check-mojibake.txt` (0 artifacts / 6798 files), `r1-16-build.txt` (exit 0).

### Validation evidence (revision)

All commands and real exit codes: `r1-02-platform.txt` (`win32`), the five plant files above, the
RV1 gate on the final tree (`r1-09-gate-restored.txt` and `r1-13-check-notifications-grants.txt`,
both exit 0), the RV2 structural proof (`r1-12b-probe-exit-lines.txt`) and its executable proof
(`r1-12-probe-no-env.txt`, exit 2, no secret), the RV3 statement-identity proof (`r1-10`
byte-identical to first-pass `10`; `r1-10b` before/after both `3383`), `r1-14-test-rls-guards.txt`
(24/24), `r1-15b/c/e/f` (all exit 0), `r1-16-build.txt` (exit 0, full route table),
`r1-16z-hash-object.txt` (hash of every changed file, tied to this transcript), and
`r1-17-status-after.txt` / `r1-17b-grant-discipline-diff.txt` (every changed path inside kickoff
§7; the only genuine SQL statement change anywhere in `grant-discipline-audit.sql` is the
first-pass `grant update (is_read) …` line, confirmed by the diff).

### Files changed (revision, in addition to the first pass)

| Path | Reason |
|---|---|
| `scripts/check-notifications-grants.mjs` | RV1 — full rewrite: clause-aware `GRANT` parsing, widened/extra-column and unqualified-relation detection |
| `scripts/task-881-notifications-probe.mjs` | RV2 — `process.exit()` removed from every post-setup path; id-based + title-based cleanup |
| `scripts/task-881-notifications-audit.sql` | RV3 — header comment only (N2 BEFORE value corrected) |
| `scripts/grant-discipline-audit.sql` | RV4 — footer NOTE reworded, idempotency line moved back; no statement changed beyond the first pass's `grant update (is_read)` addition |
| `docs/backlog.md` | 881 registry cell — state only, revision 1 |
| `docs/sessions/2026-09-25-task881-notifications-least-privilege.md` | this section |
| `docs/sessions/evidence/task881/r1-*` (new) | all revision evidence files |

### Assumptions, deviations, and limitations (revision)

- No deviation from kickoff §16's scope or order. Every file touched is named in §16.2/§16.3.
- Same limitation as the first pass: no live DB access from the executor. RV1's rewritten gate and
  RV2's rewritten probe are validated statically and via the plant/restore proofs above; O80-5 is
  still what closes the live behavior, now against the revised files.
- The audit script's four-column reading `(check_id, sort_key, object_name, detail)` — flagged as a
  judgment call in the first pass — was reviewed and closed with no change required (§16.1).

### Opus handoff (revision)

- Evidence root: `docs/sessions/evidence/task881/`, `r1-*` files are the current evidence for AC1,
  AC3, AC7 and AC10; first-pass files remain for AC2, AC4 (executor-provable part), AC6, AC8, AC9.
- **O80-5 is still owed**, now against the revised `task-881-notifications-audit.sql` (corrected
  comment, same statement) and the unchanged `task-881-notifications-least-privilege.sql`/
  `task-881-guard-selftest.sql`/`task-881-rollback.sql`. Run order and the manual checks are
  unchanged from kickoff §13.3.
- Please verify RV1's parser against a case the plants above don't cover if one comes to mind —
  the rewrite is a genuine reparse (clause-splitting, top-level-comma-aware), not a patch to the
  old regex set, so it is a new piece of logic and deserves a fresh adversarial look rather than a
  diff-only read.

### Backlog update (revision)

`docs/backlog.md` line 56: the `881` cell now reads `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
(revision 1), pointing at this session log. Physical line count: **80** (unchanged — in-place edit).
No `BACKLOG LIMIT BREACH`.

---

## Revision 2 — remediation of review 2 (`NEEDS REVISION`)

Kickoff §17, commit `ce8691e60`. Re-entry mode: `remediation`, started at §17.2. Review 1's
RV2–RV5 are **accepted** — the probe, the audit, `grant-discipline-audit.sql`'s comments and the
hash-witness format all stay as shipped in Revision 1; their `r1-*` evidence remains final. The
**only** file that changes in this pass is `scripts/check-notifications-grants.mjs`, plus this
session log and the 881 backlog cell. Status after this pass: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
Still **NOT APPLICABLE** — no `src/` file changes in this pass.

### RF6/RF7 → RV6

Review 2's root-cause finding: **the kickoff, not the executor, under-specified R8 at review 1.**
Review 1's R8 enumerated relation *spellings* to recognise instead of requiring a fail-closed
parse, and Revision 1 implemented exactly what was asked. Review 2 rewrote R8 itself (§4) into an
allowlist: a statement mentioning the table (by any means, including a multi-target `ON` list) or
targeting `ALL TABLES IN SCHEMA ... public` must parse as either a table grant or a role-membership
grant; every table-grant grantee must be in `{authenticated, service_role}`; every privilege
`authenticated` receives must be exactly table-level `select` or `update (is_read)`; and a
role-membership grant (no `ON` clause at all, so it can never be caught by a table-name search) may
never name `anon`, `authenticated` or `public`.

| Finding | Correction | Evidence |
|---|---|---|
| **RF6** (P2) — the RV1 gate exits 0 on a multi-table `ON` list, `TO public`, a quoted grantee, `GRANTED BY`, an unrecognised privilege keyword, and a role-membership grant with no `ON` clause | **RV6** — full rewrite of `scripts/check-notifications-grants.mjs`: scope is now "the statement text, quotes removed, contains `notifications` anywhere" (so a multi-target list can't dodge it) OR `ON ALL TABLES IN SCHEMA` listing `public`; every grantee is checked against the `{authenticated, service_role}` allowlist (not just `anon`); grantee tokens have `WITH GRANT OPTION` and `GRANTED BY <role>` stripped in either order before quote-removal; a role-membership form (`grant <role> to <grantee>`, matched only when the table-grant form — which requires a literal `on` — does not match) is checked independently against `{anon, authenticated, public}`; an unrecognised privilege keyword is a parse failure, not a silently-skipped token | `r2-09-gate-restored.txt`, `r2-13-check-notifications-grants.txt` (both exit 0 on final tree, allowlist scope line printed); P2–P6 re-proven (`r2-p2.txt` … `r2-p6.txt`) plus six new plants proving the specific RF6 gaps: `r2-p7.txt` (multi-table `on public.listings, public.notifications` to `anon`), `r2-p8.txt` (`to public`), `r2-p9.txt` (quoted `"anon"` with `granted by postgres`), `r2-p10.txt` (quoted `"authenticated"` with an `insert` overgrant, `table` keyword present), `r2-p11.txt` (`grant maintain …` — unrecognised privilege), `r2-p12.txt` (`grant authenticated to anon;` — role-membership, no `on` clause) |
| **RF7** (P3) — the RV1 header claimed an unparseable grant was "treated as unrecognised" but the code `continue`d past it silently | **RV6** (same rewrite) — an in-scope statement that matches neither the table-grant nor the role-membership shape is now an explicit failure (`In-scope GRANT statement could not be parsed…`), and an unparseable privilege token inside a matched table grant is also an explicit failure, not a silently-dropped array entry | Same evidence as RF6 — `r2-p11.txt`'s `maintain` case is the concrete proof that an unrecognised token now fails loudly instead of vanishing |

### Plant/restore hash witnesses (RV6, P2–P12)

| Plant | File planted | Pre-plant hash | Post-restore hash | Match |
|---|---|---|---|---|
| P2 — bare `update` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P3 — `grant select … to anon` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P4 — widened `update (is_read, title)` | `grant-discipline-audit.sql` | `2b2da09c…` | `2b2da09c…` | ✅ |
| P5 — extra `update (user_id)` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P6 — unqualified `notifications` to `anon` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P7 — multi-table `on public.listings, public.notifications` to `anon` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P8 — `grant select … to public` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P9 — `to "anon" granted by postgres` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P10 — `grant insert on table … to "authenticated"` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P11 — `grant maintain … to authenticated` | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |
| P12 — `grant authenticated to anon` (role-membership) | `task-881-notifications-least-privilege.sql` | `a6fd627e…` | `a6fd627e…` | ✅ |

Full (untruncated) hashes are in each plant's own `r2-p*.txt` file, per RV5's format (kept from
Revision 1). `a6fd627e…` = `a6fd627e8e78bacd1853e9a35f5bf673fc6928f0` throughout — the hardening
script itself is never actually changed by this task; only plants against it are.
`2b2da09c…` = `2b2da09c3d49556cb08b0cab655712afe4e92755`.

### Superseded artifacts

`r1-07`, `r1-08`, `r1-07b`, `r1-07c`, `r1-08b`, `r1-09`, `r1-13`, `r1-15b`, `r1-15c`, `r1-15e`,
`r1-15f`, `r1-16`, `r1-16z` and `r1-17` are **superseded** by `r2-p2` … `r2-p12`, `r2-09`, `r2-13`,
`r2-15b`, `r2-15c`, `r2-15e`, `r2-15f`, `r2-16`, `r2-16z` and `r2-17` respectively, and kept for the
record. Every other `r1-*` file (the probe evidence, the audit evidence, `r1-10`/`r1-10b`,
`r1-17b`, `r1-12`/`r1-12b`, `r1-14`) remains final, per §17's own instruction that RV2–RV5 are
accepted.

### Validation evidence (revision 2)

`r2-02-platform.txt` (`win32`); the eleven plant files above (each `EXIT_CODE=1`, naming its cause,
two equal hashes); `r2-09-gate-restored.txt` and `r2-13-check-notifications-grants.txt` (both exit
0, allowlist scope line); `r2-15b-check-listing-reports-grants.txt` (exit 0 — the unrelated gate
is unaffected); `r2-15c-typecheck.txt` (exit 0); `r2-15e-check-file-integrity.txt` (79 files
clean); `r2-15f-check-mojibake.txt` (0 artifacts / 6819 files); `r2-16-build.txt` (exit 0, full
route table); `r2-16z-hash-object.txt` — compared line-by-line against `r1-16z-hash-object.txt`:
every line is identical **except** `check-notifications-grants.mjs` (line 6), confirming this
revision touched exactly the one file it was scoped to; `r2-17-status-after.txt` — every changed
path inside kickoff §7, unchanged from Revision 1's set.

### Files changed (revision 2, in addition to revisions 1)

| Path | Reason |
|---|---|
| `scripts/check-notifications-grants.mjs` | RV6 — full rewrite: fail-closed allowlist parse (table grants and role-membership grants), replacing review 1's spelling-enumeration approach |
| `docs/backlog.md` | 881 registry cell — state only, revision 2 |
| `docs/sessions/2026-09-25-task881-notifications-least-privilege.md` | this section |
| `docs/sessions/evidence/task881/r2-*` (new) | all revision-2 evidence files |

### Assumptions, deviations, and limitations (revision 2)

- No deviation from kickoff §17's scope or order — the only source file touched is the one named.
- Same limitation as both prior passes: no live DB access from the executor. This gate is entirely
  static; O80-5 is unaffected by this pass (the owner-facing SQL files did not change) and remains
  owed.
- Per §17.2's precondition, I confirmed before writing RV6 that the final tree (both source files)
  contains no role-membership grant and no multi-target `on` list of its own — the rewrite's new
  branches are exercised only by the plants, not by any pre-existing shipped statement.

### Opus handoff (revision 2)

- Evidence root: `docs/sessions/evidence/task881/`; `r2-*` files are current for AC7 (R8); every
  other AC's evidence is unchanged from Revision 1 (see that section's handoff for the AC1/AC2/
  AC4/AC6/AC8/AC9 evidence map).
- **O80-5 is still owed**, unaffected by this pass — the probe, the hardening SQL, the guard, the
  rollback and the docs are all Revision-1-final.
- This is the second rewrite of the same ~180-line parser in two review passes. I read the amended
  R8 text literally and implemented each clause as written (in-scope test, top-level-comma
  splitting, grantee-suffix stripping order, the allowlist, the role-membership branch) rather than
  patching the review-1 regexes again — worth confirming the parser actually matches every clause
  of §4's R8 rather than trusting that "it passes P2–P12" is sufficient, since a third gap would be
  a third round trip.

### Backlog update (revision 2)

`docs/backlog.md` line 56: the `881` cell now reads `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
(revision 2), pointing at this session log. Physical line count: **80** (unchanged — in-place
edit). No `BACKLOG LIMIT BREACH`.

---

## Revision 3 — remediation of review 3 (`PARTIALLY VERIFIED`)

Kickoff §18, commit `9e5a48053`, re-entry at §18.1 (as the user instructed this session). Status
after this pass: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Review 3 accepted every code-side
acceptance criterion produced by Revision 2 (AC1, AC2, AC6, AC7, AC8, AC9, AC10, and AC3's guard-
`diff` half) and found one remaining gap in the gate (RF8). The only file this pass changes is
`scripts/check-notifications-grants.mjs`, plus two owner-produced probe transcripts that needed an
encoding fix (below), this session log and the 881 backlog cell.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
Still **NOT APPLICABLE** — no `src/` file changes in this pass.

### RF8 → RV7

| Finding | Correction | Evidence |
|---|---|---|
| **RF8** (P3) — two more spellings of a real grant still exit 0: (1) `/* hotfix */ grant select on public.notifications to anon;` — only `--` line comments were stripped, so the fragment starts with `/*` and is skipped by the `startsWith('grant')` filter; (2) `do $$ begin grant select on public.notifications to anon; end $$;` — the `;`-split fragment starts with `do`, not `grant`, so it is likewise invisible. Separately, `WITH GRANT OPTION` on an `authenticated` grantee was silently stripped instead of failing. | **RV7** — added `stripBlockComments()` (`/\/\*[\s\S]*?\*\//g`, non-greedy across lines), run before the existing `--`-strip, so a block-comment-prefixed GRANT reduces to a plain in-scope GRANT and is caught by the existing allowlist logic (no new clause needed for that half); added clause **(g)** — any `;`-fragment that does not itself start with `grant` but contains the word `grant` and, quotes removed, contains `notifications`, fails as "cannot be verified" (catches the `DO $$ … $$` case, which comment-stripping cannot fix since it is not a comment); added clause **(h)** — a table-grant's raw (pre-strip) `TO` token is checked for `WITH GRANT OPTION` before the suffix is stripped, and `authenticated` carrying it now fails instead of being silently normalised away. Header comment and the printed scope line updated to name both new clauses and the function-body blind spot. | `r3-13-check-notifications-grants.txt` (exit 0, final tree, updated scope line); `r3-p13.txt` (block-comment case, now caught by the *existing* allowlist logic post-strip — exit 1 naming the `anon` grantee); `r3-p14.txt` (DO-block case — exit 1, clause (g), naming the un-parseable fragment verbatim); `r3-p15.txt` (`WITH GRANT OPTION` — exit 1, clause (h)); regression re-proof that nothing broke: `r3-p2.txt`, `r3-p3.txt`, `r3-p7.txt`, `r3-p12.txt` (P2, P3, P7, P12 re-run against the hardened gate, all still exit 1 naming their original cause) |

Every plant/restore pair in this pass carries equal pre/post `git hash-object` values in its own
`r3-p*.txt` file (RV5's format, unchanged since Revision 1).

### RF9 — orchestrator hotfix to the audit (informational, not executor work)

Between review 3 and this pass, the owner ran O80-5 and hit a live error the audit's N5 branch:
`ERROR: 22023: ACL arrays must be one-dimensional`, from `aclexplode(coalesce(a.attacl, '{}'::aclitem[]))`
— an empty `'{}'::aclitem[]` array has zero dimensions and `aclexplode` rejects it. The orchestrator
applied the fix directly (kickoff §18.3, since the owner was mid-procedure and the file is a
read-only diagnostic): N5 now joins on `a.attacl is not null and cardinality(a.attacl) > 0` and
calls `aclexplode(a.attacl)` directly, no `coalesce`. This explains why
`task-881-notifications-audit.sql` showed as changed on disk at the start of this pass — it is a
legitimate owner/orchestrator-applied correction, not reverted. Verified still a single
read-only statement: `r3-10-audit-single-statement.txt` — `semicolons=1 endsWithSemicolon=true
writeKeywords=none`, unchanged shape from every prior pass.

### Owner-transcript encoding fix (kickoff §18.4's closing note)

O80-5's two live probe transcripts (`20-probe-before.txt`, `21-probe-after.txt`) and their
superseded sign-in-failure predecessors were written by the owner's native Windows PowerShell 5.1
`Tee-Object`, which defaults to UTF-16LE — the same class of issue as the 818/819 corollary
(`docs/orchestrator-procedures.md`), just on the write side instead of the read side this time.
`check:file-integrity` correctly flagged all four as "NUL bytes present" (`r3-15e`'s first run).
Per the kickoff's own closing instruction, normalised all four to UTF-8 without BOM through Node
(`readFileSync(f, 'utf16le')` → strip a leading `﻿` → `writeFileSync(f, text, 'utf8')`),
verified line-for-line identical content before and after (printed `lineForLineIdentical=true` for
all four), then re-ran the gate: `r3-15e-check-file-integrity.txt` — `✅ all 101 file(s) clean`.
The two "final" transcripts' content, decoded, is the actual O80-5 result: **both phases exit 0,
every arm matches §11 exactly, including U2's AFTER `is_read_after=true`** — the live proof that
Assumption 1 (column-level `UPDATE (is_read)` is sufficient for PostgREST's PATCH) holds, so no
rollback was needed.

### Validation evidence (revision 3)

`r3-02-platform.txt` (`win32`); seven plant files (`r3-p13`, `r3-p14`, `r3-p15`, `r3-p2`, `r3-p3`,
`r3-p7`, `r3-p12`, each exit 1 naming its cause, two equal hashes); `r3-10-audit-single-statement.txt`
(RF9 re-check); `r3-13-check-notifications-grants.txt` (exit 0, hardened scope line);
`r3-15e-check-file-integrity.txt` (clean after the encoding fix — see above); `r3-15f-check-mojibake.txt`
(0 artifacts / 6842 files); `r3-16-build.txt` (exit 0, full route table); `r3-16z-hash-object.txt` —
compared against `r2-16z-hash-object.txt`: every line identical except
`task-881-notifications-audit.sql` (line 1, the RF9 orchestrator hotfix) and
`check-notifications-grants.mjs` (line 6, RV7), confirming this pass touched exactly the files it
was scoped to; `r3-17-status-after.txt` — every changed path inside kickoff §7, unchanged set from
prior passes.

### Files changed (revision 3, in addition to revisions 1–2)

| Path | Reason |
|---|---|
| `scripts/check-notifications-grants.mjs` | RV7 — block-comment stripping, clause (g) (GRANT-in-block/after-other-text), clause (h) (`WITH GRANT OPTION` on `authenticated`) |
| `docs/sessions/evidence/task881/20-probe-before.txt`, `21-probe-after.txt`, and their `.superseded-signin-failed.txt` predecessors | encoding fix only (UTF-16LE → UTF-8 without BOM, content unchanged) — owner-produced O80-5 evidence, not executor-authored |
| `docs/backlog.md` | 881 registry cell — state only, revision 3 |
| `docs/sessions/2026-09-25-task881-notifications-least-privilege.md` | this section |
| `docs/sessions/evidence/task881/r3-*` (new) | all revision-3 evidence files |

Not changed by this pass, confirmed by `r3-16z` against `r2-16z`: the probe, the hardening SQL,
the guard, the rollback, `grant-discipline-audit.sql`, `package.json`, the workflow, the test, and
the three R10 docs. `task-881-notifications-audit.sql` changed, but by the orchestrator's RF9
hotfix (§18.3), not by this executor pass.

### Assumptions, deviations, and limitations (revision 3)

- No deviation from kickoff §18.1's scope. The probe-transcript encoding fix was not explicitly
  in §18.1's own file list, but is explicitly authorized by §18.4's closing sentence in the same
  kickoff, which this pass follows literally (Node-based UTF-8 re-encode, content verified
  line-for-line identical, per the 818/819 corollary's established method).
- **O80-5 is no longer owed** — it completed in full before this pass started (kickoff §18.4). All
  ten steps returned the expected result, including U2 AFTER (`is_read_after=true`), so
  Assumption 1 from the original kickoff (§5.1) is now resolved: no rollback needed.
- One out-of-scope follow-up was surfaced by O80-5 step 10 and is **not** this task's to fix (§8):
  F9 materialised — a signed-out visitor's `GET notifications` now returns `401` (previously `200
  []`) and logs `[notifications] fetch failed`, with no functional break (the bell unmounts). The
  kickoff's own §18.4 table states this needs a separate numbered task at the final review; I am
  not filing it myself, since task numbering and filing is Opus's role, not the executor's.

### Opus handoff (revision 3)

- Evidence root: `docs/sessions/evidence/task881/`; `r3-*` files are current for AC3 (guard, now
  fully closed — the live selftest ran and raised as expected, per kickoff §18.4 step 4) and AC7
  (R8, now including clauses (g)/(h)); AC4 and AC5 are now closed by the owner's O80-5 transcripts
  themselves (`20-probe-before.txt`, `21-probe-after.txt`, `18-audit-before.tsv`,
  `19-audit-after.tsv`, `19b-selftest-and-apply.txt`, `19c-manual-checks.txt`) — all owner/
  orchestrator-produced, not executor-produced, and referenced here for completeness rather than
  claimed as this pass's own evidence.
- **This is the third rewrite of the same gate script across three review passes** (RV1 → RV6 →
  RV7). I read RF8 and the amended R8 clauses (g)/(h) literally and added exactly those two checks
  plus block-comment stripping, rather than a broader defensive rewrite — worth a specific check
  that no *fourth* bypass shape exists (e.g., a `GRANT` split across a `;`-terminated `SET` prefix,
  or a nested block comment) before calling R8 closed for good, since this parser has now missed
  something at every prior pass.
- The one open follow-up (F9, signed-out 401) is named above for filing at the final review; I am
  not proposing a task number.

### Backlog update (revision 3)

`docs/backlog.md` line 56: the `881` cell now reads `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
(revision 3), noting O80-5 is complete and pointing at this session log. Physical line count:
**80** (unchanged — in-place edit). No `BACKLOG LIMIT BREACH`.
