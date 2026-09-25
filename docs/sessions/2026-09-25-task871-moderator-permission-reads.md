# Task 871 — Moderator permission reads through the service role

Sprint 80 · P2 · QA profile Q4. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

Kickoff: `tasks/Archive/Sprint_80_kickoff_prompt_Task_871_Moderator_Permission_Reads_Through_Service_Role.md`.

## Preflight receipts

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
GR-0/GR-1/GR-3/GR-3a **NOT APPLICABLE** — non-visible, data-only change (kickoff §1): the write set contains no
component, JSX, className, style, locale key, or Storybook file. `/admin/permissions` renders the same
`AdminPermissionsManager` props shape before/after; only the stored value arriving changes.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.`

## I0 — before writing anything

1. Platform (`02-platform.txt`): `win32 v22.22.3 C:\Claude_Code_Projects\lero-al` — starts `win32`. ✅
2. Pre-existing-path snapshot (`01-status-before.txt`): only the new evidence directory untracked — tree was clean.
   No pre-existing modified paths to hash.
3. Caller census re-run (`00b-caller-grep.txt`, `00c-role-permissions-grep.txt`): matches kickoff §3.2 and the
   quality-gate table exactly — no new caller, no unlisted `role_permissions` reader. No `UNLISTED
   ROLE_PERMISSIONS READER`.
4. Re-read `src/lib/auth/permissions.ts:1-19` and `src/modules/admin/actions/permissions.ts:44-92` — matched F1/F5
   exactly. No `PREMISE DRIFT`.
5. Baselines (unchanged source): `test:admin` — 3 files / 18 tests passed, exit 0 (`03-test-admin-before.txt`).
   `test:rls-guards` — 2 files / 24 tests passed, exit 0 (`04-test-rls-guards-before.txt`).

## Requirement and acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1, AC2, AC3 | `roleHasPermission` (`src/lib/auth/permissions.ts:6-33`) now: `admin`→`true` and `moderator`≠role→`false` with no client constructed; moderator branch wrapped in try/catch, reads via `createAdminClient()`, `.maybeSingle()`, logs `[permissions] role_permissions read failed` with `{key, code}` on a returned error or a caught throw (`code:'exception'`), never throws. `permissions.test.ts` 10/10 pass (`05b-new-tests-postfix.txt`, `11a-test-admin.txt`). |
| R2 | AC4, AC5 | `getModeratorPermissions` (`src/modules/admin/actions/permissions.ts:44-...`) keeps the unauthenticated/forbidden throws before any `role_permissions` read; one `createAdminClient()` instance now serves both the `role_permissions` read and the existing actor-name read; on a read error logs `[permissions] getModeratorPermissions read failed` with `{code}` and returns the existing all-`false` map — never throws for this reason. `getModeratorPermissions.smoke.test.ts` 4/4 pass. |
| R3 | AC6 | `13-status-after.txt` vs `01-status-before.txt`: every changed path is in kickoff §7; only `.sql` path is `scripts/task-871-moderator-census.sql`; no pre-existing modified path (tree was clean at I0). `hasPermission`/`assertPermission` still read `users.role` through the user-scoped `createClient()` (unchanged). No grant/policy/migration file touched. |
| R4 | AC3, AC5 | Two plant/restore pairs, see below — both plants fail the moderator-allowed case; both restores are hash-identical to pre-plant. |
| R5 | AC7 | `package.json`'s `test:admin` now lists both new files; `npm run test:admin` exit 0, output names both (`11a-test-admin.txt`). |
| R6 | AC8 | `docs/critical-flow-registry.md` — exactly one new row added ("Moderator capability read"); `docs/rls-rules.md` — exactly one bullet extended (`role_permissions` named as service-role-only). `git diff` of both files confirmed — nothing else changed. |
| R7 | AC9 | `scripts/task-871-moderator-census.sql` — `10-census-single-statement.txt`: `semicolons=1 endsWithSemicolon=true writeKeywords=none`. |
| all | AC10 | `npm run build` exit 0 (`12-build.txt`, ends with the route table, `.next/BUILD_ID` present); `typecheck`, `test:admin`, `test:rls-guards`, the reports regression suite, `check:file-integrity`, `check:mojibake` all exit 0. |

## Current versus required behavior (kickoff §9) — confirmed

| Actor / input | Before | After |
|---|---|---|
| admin, any key | `true`, no DB read | unchanged |
| non-moderator role | `false`, no DB read | unchanged |
| moderator, key stored `allowed:true` | `false` (bug) | `true` — fixed |
| moderator, key stored `allowed:false` | `false` | `false` |
| moderator, no row | `false` | `false`, no log |
| moderator, DB/client error | `false`, silent | `false` + one `console.error` |
| `/admin/permissions` | every switch off regardless of stored value (bug) | stored values — fixed |
| `/admin/permissions`, signed-out/regular user | throws unauthenticated/forbidden | unchanged, no `role_permissions` read |
| `setModeratorPermission` | admin client, audit event, revalidate | unchanged (not touched — already correct) |

Negative flows (kickoff §11): authorization (granted/denied/absent key, non-moderator) — covered by AC1;
unauthenticated/regular-user reaching the service-role read in `getModeratorPermissions` — covered by AC4 (rejected
before the read); DB/client error — covered by AC2/AC5. Validation, offline/network, concurrent-writer: N/A per
kickoff (no form, no new network layer, read-only change).

## Files Changed

| Path | Reason |
|---|---|
| `src/lib/auth/permissions.ts` | R1 — `roleHasPermission`'s moderator branch reads `role_permissions` via `createAdminClient()`, fail-closed with diagnosable logging |
| `src/modules/admin/actions/permissions.ts` | R2 — `getModeratorPermissions` reads `role_permissions` via the same admin client instance already used for actor names, fail-closed |
| `src/lib/auth/__tests__/permissions.test.ts` (new) | R5 — client-boundary, fail-closed and end-to-end moderator coverage for `roleHasPermission`/`hasPermission`/`assertPermission` |
| `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts` (new) | R5 — admin-caller/unauthenticated/forbidden/error-path coverage for `getModeratorPermissions` |
| `package.json` | R5 — `test:admin` script lists both new test files |
| `scripts/task-871-moderator-census.sql` (new) | R7 — read-only owner census (O80-4 step 1) |
| `docs/critical-flow-registry.md` | R6 — new "Moderator capability read" row |
| `docs/rls-rules.md` | R6 — `role_permissions` named as service-role-only in the Per-role GRANT discipline bullet |
| `docs/backlog.md` | 871 registry cell — state only |
| `docs/sessions/2026-09-25-task871-moderator-permission-reads.md` (new) | this session log |
| `docs/sessions/evidence/task871/*` (new) | full evidence trail |

`12z-hash-object.txt`:

```
0a30e83434797e6d60bac4716979b2b4b2439c46  src/lib/auth/permissions.ts
e54a43cfb71cb78f57912c9b1ec0a1f38a74a218  src/modules/admin/actions/permissions.ts
7569c40336d799aeb471344b2e725cc2c03a138d  src/lib/auth/__tests__/permissions.test.ts
29e532ad6e373ccf83027cc2db913e0d0070a04f  src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts
f637a323deb5aeb49fab1591908228c82736ed66  package.json
9839f3ddaf0b891c6cf0e1e4ffd1a79cac4f99b6  scripts/task-871-moderator-census.sql
1e096a8d32b8929c7f2200a9477af4f35a00de8f  docs/critical-flow-registry.md
f57cc9a511dcbb359f02ead3eb6a5af73c84f655  docs/rls-rules.md
```

## Validation evidence

All commands run from the project root, Windows PowerShell 5.1, `win32 v22.22.3`.

| Step | Command | Result | Evidence |
|---|---|---|---|
| I0.1 | `node -p platform+version+cwd` | `win32 v22.22.3 ...` | `02-platform.txt` |
| I0.2 | `git status --porcelain` (before) | only evidence dir untracked | `01-status-before.txt` |
| I0.3 | caller grep | matches §3.2, no unlisted reader | `00b-caller-grep.txt`, `00c-role-permissions-grep.txt` |
| I0.5 | `npm run test:admin` (baseline) | exit 0, 3 files / 18 tests | `03-test-admin-before.txt` |
| I0.5 | `npm run test:rls-guards` (baseline) | exit 0, 2 files / 24 tests | `04-test-rls-guards-before.txt` |
| pre-fix arm | new tests vs unchanged source | exit 1, 9/14 fail incl. the moderator-allowed case | `05-new-tests-prefix.txt` |
| post-fix | new tests vs fixed source | exit 0, 14/14 pass | `05b-new-tests-postfix.txt` |
| post-fix | `test:admin` (pre-package.json-edit sanity) | exit 0, 18/18 pass | `05c-test-admin-postfix.txt` |
| post-fix | `test:rls-guards` (sanity) | exit 0, 24/24 pass | `05d-test-rls-guards-postfix.txt` |
| plant A | `permissions.test.ts` with `roleHasPermission`'s read pointed at `createClient()` | exit 1, 4/10 fail incl. the moderator-allowed case | `06-plant-a.txt` |
| restore A | same file | exit 0, 10/10 pass; hash `0a30e83...` = pre-plant | `07-restored-a.txt` |
| plant B | `getModeratorPermissions.smoke.test.ts` with the `role_permissions` read pointed at the user-scoped client | exit 1, 2/4 fail incl. the admin-caller case | `08-plant-b.txt` |
| restore B | same file | exit 0, 4/4 pass; hash `e54a43c...` = pre-plant | `09-restored-b.txt` |
| AC9 | census single-statement/write-keyword check | `semicolons=1 endsWithSemicolon=true writeKeywords=none` | `10-census-single-statement.txt` |
| §13.2 | `npm run test:admin` | exit 0, 5 files / 32 tests, names both new files | `11a-test-admin.txt` |
| §13.2 | `npm run test:rls-guards` | exit 0, 2 files / 24 tests | `11b-test-rls-guards.txt` |
| §13.2 | reports regression suite | exit 0, 3 files / 49 tests | `11c-test-reports.txt` |
| §13.2 | `npm run typecheck` | exit 0 | `11d-typecheck.txt` |
| §13.2 | `eslint` on the 4 changed/new source+test files | exit 0, no errors | `11e-eslint.txt` |
| §13.2 | `npm run check:file-integrity` | exit 0, 29/29 clean | `11f-check-file-integrity.txt` |
| §13.2 | `npm run check:mojibake` | exit 0, 0 artifacts in 6895 files | `11g-check-mojibake.txt` |
| §13.2 | `npm run build` (clean `.next`, dev server stopped first) | exit 0, ends with route table, `BUILD_ID` present | `12-build.txt` |
| §13.2 | `git hash-object` of every changed/new file | recorded | `12z-hash-object.txt` |
| §13.2 | `git status --porcelain` (final) | matches §7 exactly | `13-status-after.txt` |

## Canonical UI decision record

Not applicable — non-visible, data-only change (§1). No component, style, or Storybook artifact created or changed.

## Implementation validation notes

- Windows-PowerShell hazard hit and fixed: `Tee-Object` writes UTF-8-**with**-BOM by default (PowerShell 5.1), which
  `check:file-integrity` correctly flagged on 19 evidence transcripts. Stripped every stray BOM via a small Node
  script (never `Get-Content -Raw` without `-Encoding utf8`, per the 818 corollary), then switched later captures
  (`check:file-integrity`, `check:mojibake`, `build`) to `[System.IO.File]::WriteAllText(..., UTF8Encoding($false))`
  to avoid re-introducing it. This is an evidence-capture hazard only — no source file was affected.
- No other defect found. Both fixes are minimal, scoped exactly to R1/R2, and the plant/restore pairs prove the
  tests actually exercise the client-routing decision rather than passing vacuously.

## Assumptions, deviations, limitations

- `.maybeSingle()` assumption (kickoff §5.1) held — no I0 finding contradicted the one-row-per-`(role,
  permission_key)` uniqueness contract `setModeratorPermission`'s upsert already relies on.
- No deviation from the kickoff's scope, order, or command set.
- **O80-4 is owed, not done.** The owner must run the census SQL and the two post-deploy live checks
  (`scripts/task-871-moderator-census.sql` output, `/admin/permissions` switch-state check, and the moderator-arm
  check only if a moderator test account exists) per kickoff §13.3, after approval and deploy.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task871/`.
- Confirm the client-boundary assertions in both new test files actually pin the admin-client-only invariant (not
  just a truthy return) — `mockFrom`/`mockAdminFrom` call-site checks are present in both files.
- Confirm the plant/restore hash witnesses (`06`–`09`) tie to the same file versions as the final `12z` hashes.
- O80-4 (owner census + live checks) is unrun by design — Sonnet has no Supabase SQL Editor access; state it as
  owed in the review, never as done.

## Backlog update

`docs/backlog.md`'s 871 registry cell (row under "Task registry") updated from `KICKOFF FILED` to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, with a one-line result summary and this session log's path added.
Resulting file: **80 physical lines** (`wc -l docs/backlog.md`) — at the 80-line budget, not over. No `BACKLOG
LIMIT BREACH`.
