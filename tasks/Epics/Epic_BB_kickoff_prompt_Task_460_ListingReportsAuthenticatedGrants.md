# Task 460 — Fix `listing_reports` authenticated table grants (report submit `save_failed`) (Epic BB)

> **Type:** DB / schema-migration / RLS-grants + regression protection. **NOT** UI, **NOT** middleware.
> **Depends on / follows:** Task 435 diagnosis · Task 458 Fix B (per-branch toasts, already approved) ·
> Task 459 (Fix A NOT applied — **CLOSED, do NOT reopen**).
> **Root cause is now PROVEN** by the owner's production-like reproduction below. This task applies the DB
> grant fix identified AFTER Task 459 and adds regression protection so it cannot silently regress again.
> **⚠️ This is NOT Task 459 "Fix A" (the middleware `POST`+`Next-Action` bypass).** It does not touch
> `middleware.ts` at all — it is a PostgreSQL table-grant fix. Any wording you may recall associating "Fix A"
> with middleware does NOT apply here.

---

## Why this task exists (PROVEN root cause — read before anything)

Task 459 is closed and must **NOT** be reopened. The production-like reproduction proves the report-submit
failure is **NOT** middleware transport corruption. It is a **PostgreSQL table-privilege** problem:
the role `authenticated` is missing `INSERT` and `SELECT` on `public.listing_reports`, so the user-scoped
insert in `reportListingAction` fails with `42501 permission denied for table listing_reports`.

### Owner reproduction (production-like server)

- `npm run build` → `npm run start -- -p 3002`
- Browser: `/uk/listings/test1-mqidv5is`, logged-in authenticated user.
- Report dialog → reason `Шахрайство / скам` → Submit.

### Network evidence (transport is healthy — this is NOT a middleware bug)

- Request URL `http://localhost:3002/uk/listings/test1-mqidv5is`, Method `POST`, Status `200 OK`.
- Response `content-type: text/x-component`; request header `next-action` present; response header
  `x-action-revalidated` present.
- **No** `location`, **no** `x-middleware-rewrite`, **no** `x-middleware-redirect`, **no**
  `x-nextjs-action-not-found`. ⇒ the server action POST reached the server and ran.

### Terminal evidence (the real failure)

```text
[reportListing] insert failed {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for table listing_reports'
}
```

### Owner SQL evidence

`information_schema.role_table_grants` for `public.listing_reports`:
- `authenticated` has ONLY `REFERENCES`, `TRIGGER`, `TRUNCATE` — it is **missing `INSERT`, `SELECT`,
  `UPDATE`**.
- `service_role` and `postgres` have full privileges.

`pg_policies` for `public.listing_reports` (RLS policies are PRESENT and correct):
- `listing_reports_insert_own` — `{authenticated}`, `INSERT`, `with_check (auth.uid() = user_id)`.
- `listing_reports_select_own` — `{authenticated}`, `SELECT`, `qual (user_id = auth.uid())`.
- admin/moderator `SELECT`/`UPDATE` policies also exist.

**Diagnosis:** RLS policies exist, but the underlying table GRANTs for `authenticated` are missing.
PostgreSQL checks table privileges **before** RLS, so the insert is denied with `42501` regardless of the
(correct) RLS policy.

### 🔎 Where the regression came from (confirmed in-repo — use this; do NOT re-investigate from scratch)

`scripts/grant-discipline-audit.sql` (Task 275, 2026-05-28) contains, in SECTION 2:

```sql
-- listing_reports — reportListing.ts inserts via createAdminClient(); no user direct path.
revoke select, insert, update, delete on public.listing_reports from anon;
revoke select, insert, update, delete on public.listing_reports from authenticated;
```

That comment is **factually wrong**: `reportListingAction` inserts via `createClient()` (the
**authenticated** user-scoped client), not `createAdminClient()`. Task 275 therefore revoked the exact
grants the report path needs. **This is the source of the regression and it WILL come back if the audit
script is re-run as-is.** Fixing the audit script's `listing_reports` rows is therefore in scope (see
Migration §2).

---

## Pre-read (rule-index → Schema/migration + DB/server-action/RLS bundles)

- `docs/agent-contract.md` (P0 clauses 1–15 — always; **clause 15 regression coverage applies**).
- `docs/backlog.md` (always).
- `docs/critical-flow-registry.md` (always) — **the "Report listing" row (P0/P1, owner-task
  243/BB/435/442/458) is the flow you touch.** Baseline its existing tests GREEN before changing anything;
  they must pass after. Do NOT close without that automated proof. Update the row at approval time.
- `docs/data-access-rules.md` — DB access / grant conventions.
- `docs/rls-rules.md` ← **read "RLS-Change Test Requirement" (Task 436) AND the per-role grant rules**
  (`§Per-role` — when `anon`/`authenticated` may/may not hold grants). Note the **acknowledged advisor
  exceptions** so you do not touch them.
- `docs/domain-rules.md` — report flow rules.
- `docs/qa-rules.md` ← **read "Actionable Error-Toast Rule" (Task 436) AND "Schema drift check"**
  (how `check:schema-drift` works; where a CI grant check would belong).
- `docs/architecture.md` (schema/migration placement conventions — only the relevant parts).

## Hard contract (P0 — verified against the diff on return)

- **Do NOT reopen Task 459.** Do NOT modify `src/middleware.ts`. Do NOT add any middleware POST/`Next-Action`
  bypass. This is a DB/grants task only.
- **Do NOT modify `ListingReportDialog.tsx` / `ListingReportDialog` or any locale file**, and do NOT change
  the Fix B (Task 458) toasts. The UX layer is already correct — it currently (correctly) surfaces
  `save_failed` → "Проблема на нашому боці — спробуйте пізніше." This task removes the underlying DB cause so
  that toast stops firing on the happy path.
- **Do NOT change scope** beyond: the new grant migration, the corrective edit to
  `scripts/grant-discipline-audit.sql`, the grant regression check, the registry row, the session log +
  backlog. No drive-by refactors. **Allowed ONLY for wiring the grant check (do not touch them for anything
  else):**
  - `package.json` — add the `check:listing-reports-grants` npm script (or the chosen check command).
  - `.github/workflows/governance-pr.yml` — add the new check as a blocking CI step (match the existing
    `check:*` step style).
- **Do NOT invent architecture.** If any audit step below contradicts the expected migration, **STOP and ASK
  the orchestrator** — do not improvise a different grant set.
- **Minimal privilege.** Grant ONLY what the code paths require. Keep `anon` unable to insert/select reports.
  Do **NOT** grant `DELETE` to `authenticated`. Do **NOT** grant `UPDATE` to `authenticated` unless the code
  audit (below) proves an authenticated user-scoped path needs it.
- No `git add` / `git commit` — the orchestrator emits commits after diff review.
- Read-after-write + clause-14 integrity check on every touched file; paste the green transcript.

---

## 🔴 PHASE 0 — code audit BEFORE writing the migration (MANDATORY; paste findings into the session log)

The expected migration is `grant insert, select on table public.listing_reports to authenticated;` and NO
`update`/`delete`. **Prove it** with these five audits before writing SQL — do not assume:

1. **`reportListingAction` (`src/modules/listings/actions/reportListing.ts`).** Confirm which client it
   uses for each `listing_reports` access and therefore which grants `authenticated` needs:
   - duplicate/already-reported guard → `SELECT` (currently `createClient().from('listing_reports').select(...)`)
   - the insert → `INSERT` (currently `createClient().from('listing_reports').insert(...)`)
   Record the exact lines. (Reference: the SELECT guard and INSERT both run on the **user-scoped**
   `createClient()`, so `authenticated` needs `INSERT` + `SELECT`.)
2. **Admin/moderator report management** (`updateReportStatusAction` and any moderation UI/action).
   Confirm whether the `UPDATE` / `SELECT` on `listing_reports` runs via **`createAdminClient()`
   (service_role)** or via an **authenticated user-scoped client**. (Reference: `updateReportStatusAction`
   uses `createAdminClient()`, which bypasses both grants and RLS — so `authenticated` does **NOT** need
   `UPDATE`.) If you find ANY authenticated user-scoped path that updates `listing_reports`, STOP and ASK
   before adding an `UPDATE` grant.
3. **Existing migration / grant conventions.** There is no `migrations/` directory; one-off DB changes are
   SQL scripts under `scripts/` named `task-<NNN>-<slug>.sql`, run manually in the Supabase SQL Editor,
   idempotent, ending with `notify pgrst, 'reload schema';` (see `scripts/task-289-listing-contact-events-anon-revoke.sql`
   and `scripts/grant-discipline-audit.sql` for the exact house style). Follow that style.
4. **Schema-drift / SQL check scripts.** Inspect `scripts/check-schema-drift.mjs` +
   `scripts/schema-drift-check.sql` (column-drift only today — generates SQL the owner runs; does NOT check
   grants) and decide where a **grant** regression check belongs (see Regression coverage §). Note that
   live-DB privilege assertions (`has_table_privilege`) are **not** in CI — Slice 5b (live-DB RLS canary) is
   deferred — so the CI-runnable protection must be a **static check over the SQL source-of-truth**, not a
   live query.
5. **Primary-key / default / sequence audit.** Inspect `listing_reports`'s `id` and any defaulted columns
   (the `database.ts` type + the original create script). Confirm that an `authenticated` `INSERT` does NOT
   require an additional `USAGE`/`SELECT` grant on a sequence — i.e. that the PK is a UUID default
   (`gen_random_uuid()`/`uuid_generate_v4()`) or an `identity` column that does not need a separate sequence
   grant, NOT a `serial`/`nextval('..._seq')` that would surface a follow-up
   `permission denied for sequence ...` after the table grant lands. If a sequence/identity default could
   require a sequence grant, **STOP and ASK** before adding it — do not silently grant sequence privileges.

**Decision gate:** if Phase 0 confirms the references above (authenticated needs INSERT+SELECT only; admin
update is service_role; no sequence grant required), proceed with the migration below. If anything diverges,
STOP and ASK.

---

## Migration requirements

### §1 — New grant migration script

Create `scripts/task-460-listing-reports-authenticated-grants.sql` in the house style:

- Header comment block: task, date, context (Task 275 over-revoke root cause), what it grants and WHY, what
  it deliberately does NOT grant (no `update`/`delete` to authenticated; `anon` stays with nothing),
  "Run in Supabase SQL Editor", idempotency note.
- The grant (idempotent — `grant` is a no-op if already present):

```sql
grant insert, select on table public.listing_reports to authenticated;
```

- Do **NOT** add `update`/`delete` to `authenticated` (unless Phase 0 §2 proved an authenticated
  user-scoped update path — then STOP and ASK first).
- Do **NOT** grant anything to `anon`.
- Leave `service_role` full grant intact (already present; a confirming idempotent
  `grant all on public.listing_reports to service_role;` is acceptable but optional).
- End with `notify pgrst, 'reload schema';`.

### §2 — Corrective edit to `scripts/grant-discipline-audit.sql` (prevents re-regression)

The audit script is the source-of-truth that re-broke this. Update it so re-running it NO LONGER strips the
report path:

- Fix the wrong SECTION 2 comment + remove `listing_reports` from the `revoke ... from authenticated` line
  (keep the `anon` revoke — anon must stay locked out). The corrected comment must state that
  `reportListingAction` inserts/selects via the **authenticated user-scoped** `createClient()` and therefore
  `authenticated` requires `INSERT, SELECT`.
- Add a SECTION 3 GRANT-confirmation line for `listing_reports`:
  `grant insert, select on public.listing_reports to authenticated;` (keep the existing
  `grant all on public.listing_reports to service_role;`).
- Keep the file idempotent and re-runnable; do not reorder unrelated rows or touch other tables.

---

## 🔴 Regression coverage (agent-contract clause 15 — critical-flow-registry "Report listing")

A live-DB privilege test is out of scope (Slice 5b deferred, not in CI). The deterministic, CI-runnable
protection is a **static gate over the grant source-of-truth** so the Task 275 mistake cannot recur:

1. **Baseline:** run the existing report-listing tests GREEN first and record the transcript —
   `npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx`.
2. **Add a grant regression check** (investigate the best home in Phase 0 §4; default: a small
   `scripts/check-listing-reports-grants.mjs` wired as `npm run check:listing-reports-grants`, or an
   extension of an existing grant/drift check if one fits better). It MUST, against
   `scripts/grant-discipline-audit.sql` (and the new migration), assert deterministically:
   - `authenticated` is granted `INSERT` **and** `SELECT` on `listing_reports`, AND
   - no un-countered `revoke ... on public.listing_reports from authenticated` remains; **and SPECIFICALLY
     for `scripts/grant-discipline-audit.sql`, ANY active (non-commented) `revoke` of `SELECT` or `INSERT`
     on `public.listing_reports` from `authenticated` is a FAILURE — even if a later `grant` re-adds it
     elsewhere** — because that audit script may be run standalone and would re-break the flow on the spot,
     AND
   - `anon` is NOT granted `insert`/`select` on `listing_reports`, AND
   - **`authenticated` does NOT receive `UPDATE`, `DELETE`, or `ALL`/`all privileges` on `listing_reports`**
     (overgrant gate — `INSERT`/`SELECT` being present must NOT mask an accidental `grant all ... to
     authenticated` or `grant update, delete ... to authenticated`). The ONLY way this becomes acceptable is
     if the task was explicitly revised after a STOP-and-ASK that authorised it.
   - **The check MUST normalize case/whitespace and strip SQL comments BEFORE evaluating statements**, so a
     commented-out line (e.g. `-- grant insert, select on public.listing_reports to authenticated;`) can
     NEVER satisfy the gate, and a commented `revoke`/`grant all` can never accidentally trip or pass it.
   Wire it into the same CI workflow other `check:*` gates use (e.g. `governance-pr.yml`) as a blocking step.
3. **Planted-violation proof (TWO cases, per AC4):** (a) a **missing-grant** case — re-introduce the bad
   revoke or delete the grant line; and (b) an **overgrant** case — add `grant all on public.listing_reports
   to authenticated;`. Show the check FAILS on EACH, then restore and show it PASSES. Paste all three
   transcripts (two FAIL + one restored PASS). A no-op gate is a task failure.
4. Update the registry "Report listing" row with the new check + command at approval time.

> If, after Phase 0, you conclude a different regression mechanism is materially better (e.g. the existing
> drift tooling can host this), propose it in the session log — but it MUST be CI-runnable and FAIL on a
> planted violation. Do NOT rely on the manual owner SQL check alone.

## Positive flow (happy path)

Authenticated, non-blocked, non-owner user on `/uk/listings/<slug>` → opens Report dialog → selects
`Шахрайство / скам` → Submit → `POST` reaches `reportListingAction` → user-scoped `SELECT` duplicate-guard
succeeds (no existing row) → user-scoped `INSERT` succeeds under `listing_reports_insert_own`
(`auth.uid() = user_id`) → action returns `{}` → `toast.success(report_success)` → dialog closes. Post-
conditions: one `listing_reports` row (`status='pending'`); **no `42501`**; network stays
`POST 200 text/x-component` with `next-action` present and no middleware rewrite/redirect.

## Negative flow (every off-happy-path branch — behavior preserved, no code change to the action/dialog)

- **already reported (same user)** — duplicate-guard `SELECT` finds the row → action returns
  `already_reported` → `toast.info(report_already_reported)` + dialog closes. **Acceptable success-equivalent
  acceptance outcome.**
- **unauthenticated / anon** — `getUser()` null → `unauthorized` toast; no insert. `anon` still holds NO
  table grant (defense in depth) — anon can never insert/select reports.
- **blocked / suspended account** — typed error → restricted/suspended toast; no insert (unchanged).
- **real DB error (non-privilege)** — insert fails for another reason → `console.error` + `save_failed` →
  "Проблема на нашому боці" toast. (After this fix, a `42501` is no longer the cause of `save_failed` on the
  happy path.)
- **cancel / dismiss, double-submit, invalid_reason** — unchanged; covered by existing dialog tests.

> These branches are already implemented (Task 458 Fix B) and are NOT modified here. The grant fix only
> removes the privilege error from the happy path; the negative-flow toasts remain as-is.

## 🔴 Mobile <640 full-width gate (OWNER P0)

**Not applicable to executable scope** — this task touches only SQL migration scripts, a CI check script,
docs, and the registry. No UI/popup/component/locale surface is added or modified. **Explicitly state this
exemption in the session log** ("no UI surface touched; mobile full-width gate N/A — DB/grants-only task").
If you find yourself editing any `.tsx`/locale file, you are out of scope — STOP and ASK.

## Acceptance criteria

- **AC1** — Phase 0 audit pasted into the session log: the exact `reportListing.ts` lines + clients
  (authenticated `createClient` for SELECT guard + INSERT), the admin-update client
  (`createAdminClient`/service_role → no authenticated `UPDATE` needed), the migration-convention finding,
  the chosen grant-check home, **and the primary-key/default/sequence audit result confirming no additional
  sequence `USAGE`/`SELECT` grant is required (or a STOP-and-ASK if it diverges)**. Decision recorded: grant
  `INSERT, SELECT` to `authenticated` only (or a STOP-and-ASK if anything diverged).
- **AC2** — `scripts/task-460-listing-reports-authenticated-grants.sql` exists, house-style, idempotent,
  grants `insert, select` to `authenticated` on `public.listing_reports`, grants nothing to `anon`, no
  `update`/`delete` to authenticated, ends with `notify pgrst, 'reload schema';`. Verifiable in the diff.
- **AC3** — `scripts/grant-discipline-audit.sql` corrected: `listing_reports` removed from the
  authenticated `revoke` line (anon revoke kept), comment fixed to state the authenticated user-scoped path,
  and a SECTION 3 `grant insert, select ... to authenticated` confirmation added. Re-running the audit no
  longer strips the report path. Verifiable at file:line.
- **AC4** — Grant regression check added and wired into a blocking CI step; asserts authenticated
  INSERT+SELECT present, no un-countered authenticated revoke, anon not granted, **and FAILS on overgrant
  (authenticated UPDATE/DELETE/ALL)**; **strips comments + normalizes case/whitespace** so a commented-out
  grant cannot satisfy it. Planted-violation FAIL transcripts for BOTH a missing-grant case AND an
  overgrant case (`grant all ... to authenticated`) + restored PASS transcript in the session log.
- **AC5** — Critical-flow-registry "Report listing" row updated to reference Task 460 + the new grant check
  + command; existing report tests baselined GREEN (transcript) and still GREEN after.
- **AC6** — `npx tsc --noEmit` = 0 errors; the new `check:*` gate and relevant existing gates
  (`check:schema-drift` if touched, `test:listings`) green; clause-14 file-integrity transcript green for
  every touched file. AC-by-AC self-audit table + "Files Changed" table in the session log.
- **AC7** — Owner SQL verification commands provided in the session log (see Validation), with the expected
  post-fix results.
- **AC8** — `docs/backlog.md` (Task 460 status) updated + session log under `docs/sessions/`. No
  `git add`/`git commit`.

## Validation commands

```bash
# Code-level / CI
npx tsc --noEmit
npm run check:listing-reports-grants        # (or the chosen grant-check command)
npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts \
               src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx
```

**Owner SQL verification (run in Supabase SQL Editor AFTER applying the migration):**

```sql
select
  has_table_privilege('authenticated', 'public.listing_reports', 'INSERT') as authenticated_can_insert,
  has_table_privilege('authenticated', 'public.listing_reports', 'SELECT') as authenticated_can_select,
  has_table_privilege('authenticated', 'public.listing_reports', 'UPDATE') as authenticated_can_update,
  has_table_privilege('authenticated', 'public.listing_reports', 'DELETE') as authenticated_can_delete,
  has_table_privilege('anon',          'public.listing_reports', 'INSERT') as anon_can_insert,
  has_table_privilege('anon',          'public.listing_reports', 'SELECT') as anon_can_select;
```

**Expected post-fix:**
- `authenticated_can_insert = true`
- `authenticated_can_select = true`
- `anon_can_insert = false`
- `anon_can_select = false`
- `authenticated_can_delete = false`
- `authenticated_can_update` — `false` is acceptable/expected (admin update is service_role); `true` only if
  Phase 0 §2 proved an authenticated user-scoped update path (in which case you must have STOPPED and ASKED
  first).

**Production-like manual acceptance (owner, after applying the migration locally or in Supabase):**

1. `npm run build` → `npm run start -- -p 3002`.
2. Log in as an authenticated non-owner user; open `/uk/listings/<slug>`; submit a report.
3. Expected: **no `42501 permission denied`**; report success toast — OR, if the same user already reported
   this listing, the already-reported toast (`toast.info`) is an acceptable outcome.
4. Network remains `POST 200 text/x-component` with `next-action` present and no middleware
   rewrite/redirect/`x-nextjs-action-not-found`.

## Final report requirements (session log under `docs/sessions/`)

- Phase 0 audit findings (verbatim file:line references).
- "Files Changed" table — one row per touched path + 1-line rationale.
- AC-by-AC self-audit table (every AC → file:line or transcript → ✅/❌), citing the Positive + Negative
  flows by name.
- Baseline-GREEN + planted-violation FAIL + restored-PASS transcripts for the grant check.
- clause-14 file-integrity transcript for every touched file.
- The owner SQL verification block + expected results, and the production-like manual acceptance steps.
- Final line: `Self-validation: tsc=0 errors · grant-check=green+planted-fail-proven · report tests=green ·
  file-integrity=clean · scope=DB/grants-only (no UI/middleware/locale) · AC table=all green`.
- **No `git add` / `git commit`** — the orchestrator emits the commit after diff review.

## Deliverable

`scripts/task-460-listing-reports-authenticated-grants.sql` (new) + corrected
`scripts/grant-discipline-audit.sql` + CI grant regression check (new/extended, wired blocking) +
`package.json` (npm script) + `.github/workflows/governance-pr.yml` (blocking CI step) — both ONLY for the
check wiring — + updated `docs/critical-flow-registry.md` "Report listing" row + session log + "Files
Changed" table + backlog update. Owner SQL verification + production-like acceptance documented.
Stop-and-ask outcomes (if any) recorded for the orchestrator.

---

## Clarifications before execution (TAKE PRECEDENCE over any conflicting wording above)

1. **`authenticated_can_update` may stay `false`.** The admin/moderator report-status update runs via
   `createAdminClient()` (service_role), which bypasses table grants and RLS. So do NOT grant `UPDATE` to
   `authenticated`. Only if Phase 0 §2 finds a real authenticated user-scoped update path do you add it —
   and in that case STOP and ASK the orchestrator first.
2. **The grant SQL is applied by the owner, not by you.** You author the idempotent migration; the owner
   runs it in Supabase (and locally for the prod-like acceptance). Your CI grant check protects the
   source-of-truth so the fix cannot be silently reverted by a future audit re-run.
3. **If the best regression home is the existing drift tooling rather than a new script, choose it** — but
   it must be CI-runnable, blocking, and FAIL on a planted violation. The manual owner `has_table_privilege`
   check is required for owner verification but does NOT satisfy the clause-15 automated-proof requirement on
   its own.
