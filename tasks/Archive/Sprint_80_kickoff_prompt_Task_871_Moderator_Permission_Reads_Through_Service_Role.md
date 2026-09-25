# Task 871 — Moderator permission checks read `role_permissions` through the service role, so a granted capability actually grants

Sprint 80 · **P2** · QA profile **Q4** (auth/permission path behind registered critical flows) · no dependencies ·
owner action **O80-4** · **Status: ✅ `APPROVED WITH NOTES` 2026-09-25 (review 1) — archived; O80-4 open; see §16**

Sprint plan: [`Sprint_80_The_Data_API_Privileges_Nobody_Audited.md`](Sprint_80_The_Data_API_Privileges_Nobody_Audited.md).
Design-time evidence (owner grids, verbatim, read-only): `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.

**Owner decision that fixes the route (2026-09-23, verbatim):** *"Задача 871 - я вибираю варіант а) читати
role_permissions через service role, права в базі не змінюються."* Option (b), a `grant select` to `authenticated`
plus a policy, was the rejected alternative. This task implements (a) and nothing else on the database side.

## 1. Mode and task type

`IMPLEMENTATION`. Server-side TypeScript change in two functions, plus tests, one read-only census SQL file and
documentation rows. Bundles: **DB / Server Action / RLS** + **Regression / Critical Flow Coverage**.

**No grant, policy, table or SQL migration changes.** No component, JSX, `className`, style, locale key or Storybook
file changes.

**GR-0, GR-1, GR-3 and GR-3a are NOT APPLICABLE — classification: non-visible, data-only change.** Evidence:

- the write set (§7) contains no surface file, no component and no string;
- `/admin/permissions` (`src/app/admin/permissions/page.tsx`) renders `AdminPermissionsManager` with the same props
  shape before and after; each toggle already renders both its on and off state today. The task changes which stored
  value arrives, not what can render;
- the capability-gated controls (reports status override/delete, clear history) already render in both states and
  are driven by booleans that this task does not change for admins.

`AdminPermissionsManager.tsx` is unmigrated legacy UI (44 `className`, `@/components/ui/switch` and `badge`). It is
already recorded as baselined debt at `scripts/surface-census-baseline.json:652`. This task does not edit it. The
executor must stop and report if the write set ever needs a file under `src/components/` or `src/app/`.

## 2. Objective

1. `roleHasPermission` (`src/lib/auth/permissions.ts`) reads the moderator's `role_permissions` row through
   `createAdminClient()`. A moderator who has been granted a key passes `hasPermission` / `assertPermission` for it.
2. `getModeratorPermissions` (`src/modules/admin/actions/permissions.ts`) reads `role_permissions` through the same
   service-role path. `/admin/permissions` then shows the stored values instead of all switches off.
3. Both read failures become diagnosable (`console.error`) and still fail closed.
4. The denial is reproduced by a planted arm in automated tests, and the tests join `npm run test:admin`, which CI
   runs (`.github/workflows/governance-pr.yml:74`).

## 3. Verified context — measured 2026-09-25 (re-measure at I0)

### 3.1 The defect

- **F1 FACT.** `src/lib/auth/permissions.ts:6-19` — `roleHasPermission` returns `true` for `admin` (`:7`), `false`
  for any role other than `moderator` (`:8`), and for a moderator runs
  `createClient()` → `.from('role_permissions').select('allowed').eq('role','moderator').eq('permission_key', key).single()`
  (`:10-16`) and returns `data?.allowed ?? false` (`:18`). The `error` is not read.
- **F2 FACT.** `createClient` there is the user-scoped server client (`import … from '@/lib/supabase/server'`, `:1`).
- **F3 FACT.** Owner grid 1, 2026-09-23 (`00-owner-grids-2026-09-23.txt`, row `role_permissions | t | f | f | f | t`):
  `authenticated` has `SELECT = false` on `role_permissions`; `service_role` has `SELECT = true`. Revoked by Task
  275: `scripts/grant-discipline-audit.sql:84-85`; the file declares service-role-only at `:188-189`.
- **F4 INFERENCE (from F1–F3; not run).** For a moderator the query returns a `42501` error, `data` is `null`, and
  the function returns `false`. Every configurable moderator permission has been denied since Task 275 was
  owner-applied (2026-05-28). Fail-closed: a functional bug, not a leak. §12 AC3's planted arm reproduces it with a
  mocked client.
- **F5 FACT — the second read the reserved row did not name.** `src/modules/admin/actions/permissions.ts:44-92` —
  `getModeratorPermissions` gates on `users.role ∈ {admin, moderator}` through the user-scoped client (`:48-50`),
  then reads `role_permissions` **through the same user-scoped client** (`:52-55`), ignores the error, and fills
  every key with `allowed: false` by default (`:75-77`).
- **F6 INFERENCE (from F3 + F5).** For every caller, admin included, `rows` is `null`, so `/admin/permissions` shows
  every switch off whatever is stored. `setModeratorPermission` writes through `createAdminClient()` (`:150-177`) and
  succeeds, so after `revalidatePath` the page reads again and the switch appears to snap back. The owner's decision
  text covers this read without extension: *"читати role_permissions через service role"*. It is in scope.
- **F7 FACT.** `createAdminClient()` (`src/lib/supabase/admin.ts`) imports `server-only` and **throws** when
  `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.
- **F8 FACT.** `src/app/admin/reports/page.tsx:14-17` awaits `hasPermission(...)` twice inside `Promise.all` with no
  `.catch`. A throw from `roleHasPermission` would error that page. R1's try/catch exists for this reason.

### 3.2 Every caller (the blast radius of R1/R2)

`git grep -n "roleHasPermission\|hasPermission(\|assertPermission(\|getModeratorPermissions" -- src`, run
2026-09-25, non-test hits:

| Caller | Key(s) | Call |
|---|---|---|
| `src/modules/admin/actions/index.ts:65` | `listings.set_premium` | `assertPermission` |
| `…/index.ts:118` | `listings.delete` | `assertPermission` |
| `…/index.ts:160,172,181,190` | `locations.manage` | `assertPermission` |
| `…/index.ts:201` | `settings.manage` | `assertPermission` |
| `…/index.ts:229,255,287` | `legal.manage` | `assertPermission` |
| `…/index.ts:386` (`updateUserProfileFull`) | `users.change_role` | `roleHasPermission(myProfile.role, …)` |
| `…/index.ts:445` | `users.create` | `assertPermission` |
| `…/index.ts:499,528,556` | `users.soft_delete` | `hasPermission(...).catch(() => false)` |
| `…/index.ts:584` | `users.hard_delete` | `hasPermission(...).catch(() => false)` |
| `src/modules/admin/actions/clearHistory.ts:20` | `audit.clear_history` | `hasPermission(...).catch(() => false)` |
| `src/modules/listings/actions/reportListing.ts:125-126,257` | `reports.manage`, `reports.status_override`, `reports.delete` | `hasPermission` |
| `src/app/admin/reports/page.tsx:15-16` | `reports.status_override`, `reports.delete` | `hasPermission` |
| `src/app/admin/users/[id]/page.tsx:78`, `src/app/admin/users/new/page.tsx:27` | `audit.clear_history` | `hasPermission(...).catch(() => false)` |
| `src/app/admin/permissions/page.tsx:10` | — | `getModeratorPermissions()` |

- **F9 FACT.** Every existing test that imports these callers mocks `@/lib/auth/permissions` as a whole module
  (`rls-write-guards.smoke.test.ts:47-51`, `clearHistory.smoke.test.ts:21`, `hardDeleteUser.smoke.test.ts:28`,
  `updateUserProfileFull.smoke.test.ts:61`, `deleteReport.smoke.test.ts:33`, `reportListing.smoke.test.ts:99`,
  `pages-and-footer-validation.smoke.test.ts:38`). **No test exercises the body of `permissions.ts`**, which is why
  the denial went unseen. None of those tests should need an edit; if one does, record why.
- **F10 FACT.** No test calls `getModeratorPermissions` (`git grep` hits only the page and the definition).
- **F11 FACT.** `PERMISSION_KEYS` (`src/lib/auth/permissionKeys.ts`) has 13 keys.
- **F12 UNKNOWN — blast radius on the live data.** Whether any `users.role = 'moderator'` row exists, and whether
  any `role_permissions` row has `allowed = true`. The reserved row required this to be confirmed first. The
  orchestrator does not query production. R7 gives the owner a one-grid read-only census (O80-4 step 1). **It does
  not gate implementation:** the fix is decided and correct either way. It decides only whether the owner's live
  moderator arm is reachable (§11).

### 3.3 Critical flows touched (`docs/critical-flow-registry.md`)

"User status / role / account-type change" (`updateUserProfileFull` → `roleHasPermission`), "Clear history",
"Hard-delete user", "Report listing" (capability-gated, *"delegable via Дозволи"*), "Archetype C" and "Archetype D"
(`setModeratorPermission` lives in the file R2 edits).

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | owner decision (a); F1–F4, F7, F8 | `roleHasPermission`: `admin` → `true` and no client is constructed; a role other than `moderator` → `false` and no client is constructed; `moderator` → reads `role_permissions` (`role = 'moderator'`, `permission_key = key`) through `createAdminClient()` with `.maybeSingle()`. It returns `true` only when the row exists and `allowed === true`. No row → `false` with no `console.error`. A returned `error`, or a throw from client construction or the query → `false` plus one `console.error('[permissions] role_permissions read failed', { key, code })`, where `code` is the PostgREST code or `'exception'`. It never throws. | P1 | AC1, AC2, AC3 | Confirmed |
| **R2** | owner decision (a); F5, F6 | `getModeratorPermissions`: the unauthenticated/forbidden checks and their throws are unchanged and still run **before** any `role_permissions` read. The `role_permissions` read uses `createAdminClient()`. One admin client instance serves both that read and the existing actor-name read. On a read error it logs `console.error('[permissions] getModeratorPermissions read failed', { code })` and returns the existing all-`false` default map (shape unchanged, never throws for this reason). | P1 | AC4, AC5 | Confirmed |
| **R3** | owner decision "права в базі не змінюються" | No SQL migration, grant, revoke or policy change. `git diff` touches no `*.sql` except the new read-only census file (R7). `hasPermission`/`assertPermission` keep reading `users.role` through the user-scoped client. | P0 | AC6 | Confirmed |
| **R4** | reserved row ("reproduce the denial with a mocked user-scoped client returning `42501`"); recurring failure mode M1 | Two-armed plant, run and restored: pointing each function's `role_permissions` read back at the user-scoped mock (which returns `42501`) makes the named tests fail; restoring makes them pass; pre/post `git hash-object` witnesses equal. | P1 | AC3, AC5 | Confirmed |
| **R5** | `agent-contract` 15; `rls-rules.md` RLS-Change Test Requirement §2–§4 | New tests `src/lib/auth/__tests__/permissions.test.ts` and `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts`, both appended to the `test:admin` script in `package.json`. | P1 | AC7 | Confirmed |
| **R6** | `agent-contract` 15 | `docs/critical-flow-registry.md`: one new row in "P0 — Server-action / RLS write paths" named **"Moderator capability read (`roleHasPermission` / `getModeratorPermissions`)"** with happy path, failure path, test, `npm run test:admin`, and the Task 871 coverage note. `docs/rls-rules.md` → "Per-role GRANT discipline": the service-role-only bullet names `role_permissions` and states that the app reads it only through `createAdminClient()` (Task 871). | P2 | AC8 | Confirmed |
| **R7** | reserved row (blast radius); F12 | `scripts/task-871-moderator-census.sql`: read-only, **exactly one statement returning one grid**, UTF-8 without BOM, comment header naming Task 871 and O80-4. Rows `(metric, value)`: `moderators_total`, `moderators_not_deleted` (`deleted_at is null`; the column exists at `src/types/database.ts:179`), `role_permissions_allowed`, `role_permissions_denied` (both `role = 'moderator'`), `authenticated_select_role_permissions` (`has_table_privilege`). Counts only — no names, ids or emails. | P2 | AC9 | Confirmed |

## 5. Assumptions and open questions

1. **Assumption (reversible).** `.maybeSingle()` is the right call: `role_permissions` has one row per
   `(role, permission_key)`, the conflict target `setModeratorPermission` upserts on (`permissions.ts:176`).
   If I0 finds a different uniqueness contract, stop and report.
2. **Assumption.** Service-role reads in these two functions are safe because each is reached only after a role
   check (`hasPermission` reads the caller's own role first; `getModeratorPermissions` gates on admin/moderator
   first). R2's ordering requirement and AC4's negative test protect the second one.
3. **Open, not blocking:** F12. The owner's census answers it.
4. **Not an owner decision:** whether `AdminPermissionsManager` gets migrated. It is baselined debt, outside this
   task (§1).

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-2, GR-4, GR-5, GR-6. GR-0/1/3/3a are not applicable, per §1. Read GR-0 far enough to
  confirm that.
- `docs/agent-contract.md`: clauses 1, 2, 3, 9, 9a, 10, 14, 15.
- `docs/rule-index.md`: "DB / Server Action / RLS" and "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md`: the `Q4` row and "Negative-flow applicability".
- `docs/rls-rules.md`: "RLS-Change Test Requirement" in full, "User Roles", "Per-role GRANT discipline".
- `docs/data-access-rules.md`, `docs/qa-rules.md`.
- `docs/critical-flow-registry.md`: the rows named in §3.3.
- `docs/rls-write-path-manifest.md`: rows 61-62 (`deactivateUser`, `reactivateUser`) and 82 (`setModeratorPermission`).
- `docs/orchestrator-procedures.md` → the 818/816 corollary (`Get-Content -Raw` mojibake; hash witnesses).

Do not read the UI bundles.

## 7. Scope — the exact allowed write set

1. `src/lib/auth/permissions.ts`
2. `src/modules/admin/actions/permissions.ts`
3. `src/lib/auth/__tests__/permissions.test.ts` (new)
4. `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts` (new)
5. `package.json` — the `test:admin` script string only
6. `scripts/task-871-moderator-census.sql` (new)
7. `docs/critical-flow-registry.md` — one new row (R6)
8. `docs/rls-rules.md` — the one bullet (R6)
9. `docs/sessions/2026-09-25-task871-moderator-permission-reads.md` (new session log) and
   `docs/sessions/evidence/task871/*`
10. `docs/backlog.md` — the 871 registry cell only

## 8. Out of scope

- Any grant, revoke, policy or migration on `role_permissions` or any other table (owner decision (a); R3).
- `setModeratorPermission`, `getPermissionEvents` and `getAdminUserId` — they already use the right clients
  (`permissions.ts:103`, `:150`) or read only `users`.
- `AdminPermissionsManager.tsx` and every other component (§1).
- Changing which keys a moderator holds on the live database. The owner does that in `/admin/permissions`.
- Task 881 (`notifications`), which is a separate number in this sprint.

## 9. Current and required behavior

| Actor / input | Current behavior (preserve unless listed as changed) | Required after |
|---|---|---|
| `admin`, any key | `true`, no DB read | **unchanged** |
| `user`/any non-moderator role | `false`, no DB read | **unchanged** |
| moderator, key stored `allowed = true` | `false` (F4, INFERENCE) | **`true`** — changed |
| moderator, key stored `allowed = false` | `false` | `false` |
| moderator, no row for the key | `false` | `false`, no log |
| moderator, DB/client error | `false`, silent | `false` + one `console.error` (R1) |
| `/admin/permissions`, admin or moderator | every switch off whatever is stored (F6, INFERENCE) | **stored values** — changed |
| `/admin/permissions`, signed-out / regular user | throws `unauthenticated` / `forbidden` | **unchanged**, and no `role_permissions` read happens |
| `setModeratorPermission` (admin toggles a switch) | writes through the admin client, audit event, revalidate | **unchanged** |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. Record `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` (must start `win32`).
2. Save `git --no-optional-locks status --porcelain` to `docs/sessions/evidence/task871/01-status-before.txt`, and
   the `git hash-object` of every path it lists as modified. That is the pre-existing-path witness for AC6.
3. Re-run the §3.2 caller grep and save it raw. A new caller is added to the §3.2 table in the session log. A caller
   that reads `role_permissions` through a user-scoped client **outside** the two functions in §7 is a STOP:
   report `UNLISTED ROLE_PERMISSIONS READER` with the site.
4. Re-read `permissions.ts:6-19` and `admin/actions/permissions.ts:44-92`. If either no longer matches F1/F5, stop and
   report `PREMISE DRIFT`.
5. Save the baseline of `npm.cmd run test:admin` and `npm.cmd run test:rls-guards` **before** any edit
   (`03-test-admin-before.txt`, `04-test-rls-guards-before.txt`). Both are expected to exit 0. A red baseline is
   recorded, not fixed.

### 10.2 Order

I0 → write the tests first and run them against the **unchanged** source (the moderator-allowed tests must fail:
that is the pre-fix arm, `05-new-tests-prefix.txt`) → R1 → R2 → run the tests (pass) → the R4 plant/restore → R5
`package.json` → R6 docs → R7 SQL → §13.2 gate block → report.

### 10.3 Test content (observable assertions, not implementation detail)

Mock `@/lib/supabase/server` and `@/lib/supabase/admin` as separate factories, in the style of
`src/modules/__tests__/rls-write-guards.smoke.test.ts:31-40`. The user-scoped mock's `role_permissions` query
resolves `{ data: null, error: { code: '42501', message: 'permission denied for table role_permissions' } }`,
reproducing F3. **`permissions.test.ts`** must include:

| Case | Asserts |
|---|---|
| admin | `true`; neither client factory called |
| role `user` (and `agent`) | `false`; neither client factory called |
| moderator, admin-client row `{ allowed: true }` | **`true`**; `from('role_permissions')` was called on the admin client, and never on the user-scoped client |
| moderator, row `{ allowed: false }` | `false` |
| moderator, no row (`data: null, error: null`) | `false`; `console.error` not called |
| moderator, admin client returns `{ error: { code: 'XX000' } }` | `false`; `console.error` called once with `'[permissions] role_permissions read failed'` and `code: 'XX000'` |
| moderator, `createAdminClient` throws | `false`; resolves (does not reject); `console.error` called |
| `hasPermission` end-to-end for a moderator | user-scoped mock returns `users.role = 'moderator'`; admin mock returns `{ allowed: true }` → `true` |
| `assertPermission`, same moderator with `{ allowed: false }` | rejects with `forbidden` |

**`getModeratorPermissions.smoke.test.ts`** must include:

| Case | Asserts |
|---|---|
| admin caller; user-scoped `role_permissions` read would return `42501`; admin client returns two rows (`reports.delete` allowed, `audit.clear_history` denied) | result reflects the rows (`reports.delete.allowed === true`); every other key `false`; 13 keys present |
| unauthenticated | rejects `unauthenticated`; admin client `from('role_permissions')` never called |
| regular user | rejects `forbidden`; admin client `from('role_permissions')` never called |
| admin client read error | resolves to the all-`false` map; `console.error` called with `'[permissions] getModeratorPermissions read failed'` |

## 11. Positive and negative flows

**Positive flow.** A moderator whose `reports.delete` key is stored `allowed = true` opens `/admin/reports`: the
page's `hasPermission('reports.delete')` returns `true` and the delete control appears. An admin opening
`/admin/permissions` sees the stored switch states, and a switch flipped on stays on after reload.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Authorization — granted moderator key | **Yes** | R1 | `true` | AC1 test; O80-4 step 3 when a moderator account exists |
| Authorization — denied/absent key, non-moderator role | **Yes** | R1 | `false`, no DB read for non-moderators | AC1 |
| Authorization — regular user reaching the service-role read in `getModeratorPermissions` | **Yes** | R2 | rejected before the read | AC4 |
| DB/client error | **Yes** | R1, R2, F8 | fail closed, logged, no throw | AC2, AC5 |
| Validation (form/input) | No | no form or input changes | N/A | — |
| Offline/network | No — beyond the error branch above | server-side read | covered by the error branch | AC2 |
| Concurrent writer | No | read-only change; `setModeratorPermission`'s no-op/CAS path is untouched | N/A | — |

**Actor matrix (RLS-Change Test Requirement §4):**

| Actor | Tested how |
|---|---|
| anonymous | `getModeratorPermissions` unauthenticated test (AC4); `hasPermission` returns `false` without a user (existing `:22-23`, unchanged) |
| authenticated regular user | AC1 (role `user`), AC4 (forbidden before read) |
| moderator | AC1, AC3 (mocked); O80-4 step 3 (live, when an account exists) |
| admin | AC1 (short-circuit); O80-4 step 2 (live `/admin/permissions`) |
| service_role | the read path itself (mocked in AC1/AC4); F3 shows `service_role` `SELECT = true` live |

## 12. Acceptance criteria

- **AC1 [R1, R5]** Given `permissions.test.ts`, when it runs on the final source, then every §10.3 row for
  `roleHasPermission`, `hasPermission` and `assertPermission` passes, including the assertion that a moderator's
  `role_permissions` query is issued on the admin client and not on the user-scoped one.
- **AC2 [R1]** Given a moderator and an admin-client error or a throw from `createAdminClient`, when
  `roleHasPermission` runs, then it resolves `false` and logs exactly one `console.error` naming
  `role_permissions read failed`. With no row, it resolves `false` and logs nothing.
- **AC3 [R1, R4]** Given `05-new-tests-prefix.txt` (the tests run against the unchanged source), then the moderator
  `{ allowed: true }` case fails there. Given the plant (the `role_permissions` read in `roleHasPermission` pointed back
  at `createClient()`), the same case fails (`06-plant-a.txt`). After restoring it, it passes (`07-restored-a.txt`),
  and the pre-plant and post-restore `git hash-object` of `src/lib/auth/permissions.ts` are equal.
- **AC4 [R2, R5]** Given `getModeratorPermissions.smoke.test.ts`, when it runs, then the admin-caller case returns the
  stored rows, and the unauthenticated and regular-user cases reject before any admin-client `role_permissions`
  call.
- **AC5 [R2, R4]** Given the plant (the `role_permissions` read in `getModeratorPermissions` pointed back at the
  user-scoped client), then the admin-caller case fails (`08-plant-b.txt`). After restoring it, it passes
  (`09-restored-b.txt`), with equal `git hash-object` witnesses for `src/modules/admin/actions/permissions.ts`.
  The error case resolves the all-`false` map and logs once.
- **AC6 [R3]** Given `13-status-after.txt` compared with `01-status-before.txt`, then every new or modified path is
  in §7. The only `*.sql` path is `scripts/task-871-moderator-census.sql`. Every pre-existing modified path has equal
  before/after hash witnesses.
- **AC7 [R5]** Given `package.json`, then `test:admin` lists both new test files, and `npm.cmd run test:admin`
  exits 0 and its output names both files.
- **AC8 [R6]** Given `git diff docs/critical-flow-registry.md docs/rls-rules.md`, then the registry has the one new
  row and `rls-rules.md` has the one bullet change, and nothing else in those files changed.
- **AC9 [R7]** Given `scripts/task-871-moderator-census.sql`, when the comment-and-string-stripped text is checked
  (`10-census-single-statement.txt`), then it has one `;`, ends with it, and contains no write or DDL keyword. Its
  `select` list returns the five named metrics and no identifying column.
- **AC10 [all]** `npm.cmd run build` exits 0 on the final source (`12-build.txt`); `typecheck`, the §13.2 regression
  suites, `check:file-integrity` and `check:mojibake` exit 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.` (AC6's "only `*.sql` path" is a
scope comparator over a named file list, not a byte absolute.)

## 13. QA profile and verification plan

**Q4.** Reasons: the auth/permission path behind six registered critical flows (§3.3). Required evidence:
regression baselines (I0 step 5), the changed-behavior tests (AC1/AC4), the planted failures (AC3/AC5), owner-native
live checks (O80-4), and `npm run build`.

### 13.1 Re-entry

From scratch. The only pre-existing artifact is `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.
It is read-only, and no command writes it.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Run the R4 plants first, by hand, in the order of §10.2. Save `05`–`09` as named in AC3/AC5. For each plant, save
`git hash-object` before the edit and after the restore into the same file. Make every plant and restore edit through
the Edit tool or Node, never through `Get-Content -Raw` without `-Encoding utf8` (818 corollary). Then:

```powershell
$ev = "docs\sessions\evidence\task871"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\02-platform.txt"
node.exe -e "const fs=require('fs');const s=fs.readFileSync('scripts/task-871-moderator-census.sql','utf8').replace(/--.*$/gm,'').replace(/'(?:[^']|'')*'/g,'');const n=(s.match(/;/g)||[]).length;const bad=s.match(/\b(insert|update|delete|grant|revoke|alter|create|drop|truncate)\b/gi);console.log('semicolons='+n,'endsWithSemicolon='+/;\s*$/.test(s),'writeKeywords='+(bad?bad.join(','):'none'))" | Tee-Object "$ev\10-census-single-statement.txt"
npm.cmd run test:admin *>&1 | Tee-Object "$ev\11a-test-admin.txt"
npm.cmd run test:rls-guards *>&1 | Tee-Object "$ev\11b-test-rls-guards.txt"
npx.cmd vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx *>&1 | Tee-Object "$ev\11c-test-reports.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\11d-typecheck.txt"
npx.cmd eslint src/lib/auth/permissions.ts src/modules/admin/actions/permissions.ts src/lib/auth/__tests__/permissions.test.ts src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts *>&1 | Tee-Object "$ev\11e-eslint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\11f-check-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\11g-check-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\12-build.txt"
git --no-optional-locks hash-object src\lib\auth\permissions.ts src\modules\admin\actions\permissions.ts src\lib\auth\__tests__\permissions.test.ts src\modules\admin\actions\__tests__\getModeratorPermissions.smoke.test.ts package.json scripts\task-871-moderator-census.sql docs\critical-flow-registry.md docs\rls-rules.md | Tee-Object "$ev\12z-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\13-status-after.txt"
```

Expected results:

- `02` starts with `win32`.
- `10`: `semicolons=1 endsWithSemicolon=true writeKeywords=none` (AC9).
- `11a`: exit 0, and the output names both new files (AC7). `11b`/`11c`/`11d`: exit 0. `11e`: no errors.
- `11f`/`11g`/`12`: exit 0; `12` ends with the route table and no error.
- `12z` ties the retained transcripts to the shipped content (818 corollary).
- `13` is compared with `01-status-before.txt` for AC6.

Record every command's real exit code next to its file in the session log. Stop any running dev server before
`build`.

### 13.3 Owner-native steps (O80-4) — after the executor reports; steps 2–3 after approval and deploy

```powershell
Get-Content -Raw -Encoding utf8 scripts\task-871-moderator-census.sql | Set-Clipboard
```

1. **Census (any time, before or after deploy).** In the Supabase SQL Editor, empty the editor, paste, Run. Return
   the five-row grid. `authenticated_select_role_permissions` is expected to read `false` (F3, unchanged by design).
   **Optional BEFORE arm (before the deploy):** as admin, open `/admin/permissions` and note whether every switch
   reads off while the grid's `role_permissions_allowed` is above 0. That is F6's live confirmation.
2. **After the deploy — admin.** Open `/admin/permissions`. The switches match the grid's allowed/denied rows.
   Switch one key on, reload: it stays on. Switch it back off, reload: it stays off. Only that toggle is written.
3. **After the deploy — moderator (only if `moderators_not_deleted` ≥ 1 and a moderator test account is
   available).** With `reports.delete` switched on for moderators, sign in as the moderator and open
   `/admin/reports`: the delete control is present. Switch the key off as admin; the moderator reloads: it is gone.
   If no moderator account exists, record **"moderator arm UNREACHABLE — no moderator account"**. That is not a
   failure; AC1/AC3 carry that arm.

Return: the census grid, the optional BEFORE observation, and the step 2 and 3 observations.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.
The report lists:

- the changed files with their `12z-hash-object.txt` values;
- the requirement IDs completed;
- every command in §10.1 and §13.2 with its real exit code and evidence path;
- the I0 outputs: platform, the caller grep with any new caller, the baselines;
- the pre-fix run (`05`) and both plant/restore pairs (`06`–`09`) with their hash witnesses;
- the `docs/` before/after quotes (R6);
- assumptions, deviations, limitations, and any `PREMISE DRIFT` / `UNLISTED ROLE_PERMISSIONS READER` /
  `MISSING EVIDENCE` stop;
- O80-4, stated as owed and never as done.

Sonnet updates the 871 cell of the `docs/backlog.md` registry row (state only). It writes the session log with a
"Files Changed" table matching the real diff. It emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — the decision is quoted, the callers are listed, and the tests, plants, commands and stops are in this file |
| One active route | Yes — owner option (a); Appendix C |
| Every requirement has a binary AC and a verification | R1→AC1/AC2/AC3 · R2→AC4/AC5 · R3→AC6 · R4→AC3/AC5 · R5→AC7 · R6→AC8 · R7→AC9 · all→AC10 |
| Two-armed control that can demonstrably fail | pre-fix run (`05`) + two plant/restore pairs, each with a hash witness |
| Detector blind spot stated | The mocked tests prove client routing, not live grants. The live grant is F3 (owner grid) and O80-4. `test:admin`'s other suites mock `permissions.ts` wholesale (F9), so they prove only that callers still compile and behave with a mocked boolean |
| Material absence claims traced | "No test exercises `permissions.ts`" — every `vi.mock('@/lib/auth/permissions'` site listed (F9). "No other user-scoped `role_permissions` reader" — `git grep role_permissions -- src` returns `permissions.ts:12`, `admin/actions/permissions.ts:53,154,168`, and one test mock only; `:154,168` are on the admin client (`:150`). I0 step 3 re-measures |
| Dirty worktree handled | The tree was clean at design time. I0 still takes the snapshot and hash witnesses (AC6) |
| No owner exception claimed without a quote | The only owner authority used is the 2026-09-23 decision, quoted verbatim |
| Kickoff facts re-measured by the executor where state can drift | I0 steps 3–5 |

---

## Appendix A — Evidence preflight (task design)

| Field | Value |
|---|---|
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch` |
| Exact start step | §10.1 I0 |
| Reused artifacts | `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt` (read-only) |
| Artifacts that must not be overwritten | the same file |
| Owner decision required? | no. Route (a) was decided 2026-09-23 |

| Claim | Source inspected | Status |
|---|---|---|
| `roleHasPermission` reads through the user-scoped client | `src/lib/auth/permissions.ts:1,10-16` | VERIFIED |
| `getModeratorPermissions` does the same | `src/modules/admin/actions/permissions.ts:48-55` | VERIFIED |
| `authenticated` cannot `SELECT role_permissions` | owner grid 1, 2026-09-23 | VERIFIED (live, two days old; F3) |
| The query errors and returns `false` for moderators | F1 + F3 | INFERENCE; AC3's pre-fix arm reproduces it against a mock |
| The admin page shows all switches off | F5 + F3 | INFERENCE; O80-4 step 1 optional BEFORE arm |
| `createAdminClient` throws without env | `src/lib/supabase/admin.ts` | VERIFIED |
| `/admin/reports` has no `.catch` on `hasPermission` | `src/app/admin/reports/page.tsx:14-17` | VERIFIED |
| Other suites mock `permissions.ts` wholesale | the seven `vi.mock` sites in F9 | VERIFIED |
| CI runs `test:admin` | `.github/workflows/governance-pr.yml:74` | VERIFIED |
| Any moderator exists | — | UNKNOWN → O80-4 step 1 (non-gating) |

## Appendix B — Rule-compliance ledger

| Rule source and clause | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `rls-rules.md` → RLS-Change Test Requirement §1 | changes a permission read path (service-role access) | inventory | §3.2 caller table, re-run at I0 | COMPLIANT |
| same §2 | same | positive test on the actual code | AC1/AC4 run the real functions | COMPLIANT |
| same §3 | same | negative test | AC1 (non-moderator, denied, absent), AC4 (forbidden before read) | COMPLIANT |
| same §4 | same | actor matrix | §11 | COMPLIANT |
| same §5 | same | runtime proof | O80-4 (owner-native, per Q4) | COMPLIANT |
| `rls-rules.md` → service-role usage stays server-side | new service-role reads | server-only | `admin.ts` imports `server-only`; both files are server modules | COMPLIANT |
| owner decision 2026-09-23 | fix route | (a) only; no DB change | R3, AC6 | COMPLIANT |
| `agent-contract` 3 | existing capabilities stay reachable | no control removed | §9 | COMPLIANT |
| `agent-contract` 9 | non-Q0 | `npm run build` exit 0 | `12-build.txt` | COMPLIANT |
| `agent-contract` 14 | new files | UTF-8 no BOM; Node or Edit-tool writes | §13.2 note, `11f`/`11g` | COMPLIANT |
| `agent-contract` 15 + registry | six critical flows | automated regression + recorded command | `test:admin`, `test:rls-guards`, report suites; R6 row | COMPLIANT |
| `qa-profiles.md` Q4 | auth/permission | baseline + changed-behavior + planted failure + owner-native | I0 step 5, AC1/AC4, AC3/AC5, O80-4 | COMPLIANT |
| 818 corollary | plants and new files | hash witnesses; hash in the final block | AC3/AC5, `12z` | COMPLIANT |
| GR-0 / GR-1 / GR-3 / GR-3a | UI rules | — | NOT APPLICABLE: non-visible data-only change (§1) | NOT APPLICABLE |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Task | 871 |
| Active route | single route: owner option (a) |
| Decision source | owner decision 2026-09-23 (quoted in the header) |
| Starting worktree mode | clean at design time; I0 snapshot regardless |
| Exact allowed final write set | §7 |
| Blocked rule or decision | none |

| # | Checkpoint | Producer → artifact | Comparator / failure |
|---|---|---|---|
| 0 | Platform + status | I0 1–2 → `01`, `02` | not `win32` → stop |
| 1 | Caller census | I0 3 → session log | an unlisted user-scoped `role_permissions` reader → STOP |
| 2 | Premise | I0 4 | mismatch with F1/F5 → `PREMISE DRIFT` |
| 3 | Baselines | I0 5 → `03`, `04` | red → recorded, not fixed |
| 4 | Pre-fix arm | tests on unchanged source → `05` | the moderator-allowed case does **not** fail → the test cannot see the defect → fix the test before the source |
| 5 | Fix | R1, R2 | AC1/AC4 green |
| 6 | Plants | `06`–`09` | a plant that stays green, or unequal hashes → `NEEDS REVISION` material, report it |
| 7 | Gates | §13.2 | any non-zero exit → `PARTIALLY IMPLEMENTED` |
| 8 | Final state | `12z`, `13` | a path outside §7 → report it |
| 9 | Owner live | O80-4 | switches still all off after deploy → finding |

| Contract claim | Counterexample | Evidence | Required outcome |
|---|---|---|---|
| The tests see the defect | the tests pass against the unchanged source | checkpoint 4 (EXECUTED) | the moderator-allowed case fails pre-fix |
| The fix is not a privilege widening | a regular user reaches the service-role read | AC4 negative cases | rejected before the read |
| Fail-closed survives the new client | `createAdminClient` throws (F7) | AC2 | `false`, no reject |
| No database change | a `grant`/`revoke` appears | AC6 comparator + AC9 keyword check | only the read-only census file |

---

## 16. Review 1 — 2026-09-25 (`APPROVED WITH NOTES`)

Every acceptance criterion is verified against the real diff. Ledger: `docs/reviews/2026-09-25-task871-moderator-permission-reads.review-ledger.json` (`check:review-ledger` PASSED).

- **`roleHasPermission`.** The moderator branch reads `role_permissions` through `createAdminClient()` with
  `.maybeSingle()`, inside a try/catch. It returns `false` plus one `console.error` on an error or a throw, and
  never throws.
- **`getModeratorPermissions`.** The unauthenticated/forbidden throws still run before the admin client is built,
  and one admin client serves both reads.
- **Tests.** On the unchanged source, 9 of 14 new tests fail (`05`); after the fix, 14/14 pass. Plant A fails the
  moderator-allowed case, plant B the admin-caller case.
- **Gates.** `test:admin` 32/32, `test:rls-guards` 24/24, reports suites 49/49; typecheck, eslint, integrity and
  build all exit 0.
- **Freshness.** The reviewer-measured blobs equal `12z`.

Notes:

- **F1 (P3).** The plant hash witnesses are in the session log only, not in `06`–`09`. The restore is proven by
  the final blobs.
- **F2 (NOTE).** `/admin/permissions` now always builds the admin client, so a missing service-role key would throw
  there. `setModeratorPermission` already has the same dependency.
- **F3 (NOTE).** O80-4 is owner-native: census, then `/admin/permissions` and the moderator arm after deploy. It is
  tracked in the sprint plan.
