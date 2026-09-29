# Task 888 — `check:hydration --with-admin` measures the admin routes that exist

**Sprint 78** (hosted next to 887, the other red gate 853's reviews found) · **P2** · **Q2** · Track B (non-UI) · filed
2026-09-27 by Task 853's review 2 (F10) · kickoff written 2026-09-29 · owner action **O78-10** · **Status: 📝
`KICKOFF FILED`**

Executor: run this file through the `execute-task` workflow. Strongest permitted status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`. No mutating Git command, ever.

## 1. Mode and task type

- Mode: `TASK DESIGN` → implementation handoff.
- Task type: **Regression / Critical Flow Coverage** — governance script (`scripts/check-hydration-console.mjs`) and
  the critical-flow registry row that cites it. No product code, no UI, no database.
- Execution state: `from-scratch`.
- GR-1 / GR-3 / GR-3a–d: **not applicable** (no visible surface).

## 2. Objective

The gate's admin branch navigates `/en/admin/users` and `/en/admin/users/<uuid>`, which have returned 404 since the admin
tree left the locale segment, and it never visits `/admin`. Point it at `/admin/users`, `/admin/users/<uuid>` and
`/admin`, update the CI-safe route-plan self-test so it fails on the old paths, correct the registry row, and hand the
owner one native run that proves the admin branch passes clean and fails on a planted mismatch.

## 3. Verified context (measured 2026-09-29, win32, Node v22.22.3)

### 3.1 The admin tree has no locale segment — since before the gate's admin branch existed

- `src/app/admin/` exists; `src/app/[locale]/` has no `admin` child (`ls`, FACT).
- `src/middleware.ts:25-27` excludes `admin` from the locale matcher (comment: *"admin panel has no [locale] segment in
  the URL"*). FACT.
- `git log -S"|admin|" -- src/middleware.ts` → earliest `d9c42eef1 2026-05-14 fix: exclude /admin routes from middleware
  locale prefix`. FACT. The gate's admin routes date from Task 451 (June 2026), so they were **never** valid.
- The registry row "Hydration / console errors — admin routes" (`docs/critical-flow-registry.md:115`) records an
  owner-verified PASS on 2026-06-17. The gate only began failing a non-OK response in **Task 600 (2026-07-15)**
  (script header `:19-25`, FACT). INFERENCE: the 2026-06-17 PASS was a 404 page with no hydration console text — a false
  green. Task 600's own registry entry (`:39`) records the hardened gate catching "an unrelated genuine
  `/en/admin/users` HTTP 404 in every run". FACT.

### 3.2 The code

`scripts/check-hydration-console.mjs` (714 lines, `git hash-object` = `a218c42c0cb4f70c243bcef2918f5a5e528dc4b7`). FACT.

| Where | Today |
|---|---|
| `planRoutes` `:172-253` | no session → two `notRealCoverage` admin rows (labels contain `Admin`); session → `/en/admin/users`, and `/en/admin/users/${adminUserId}` or a `notRealCoverage` detail row |
| `verifyAdminConfig` `:483-574` | state 1 expects **2** admin rows (`label.includes('Admin')`), all `notRealCoverage`; states 2–3 assert `path === '/en/admin/users'` and `/en/admin/users/${testUuid}`; states 4–5 cover the authenticated homepage |
| `package.json:92-95` | `check:hydration`, `:verify`, `:admin-config`, `:error-page` |
| CI `.github/workflows/governance-pr.yml:164,167` | runs `check:hydration:verify` and `check:hydration:admin-config` (no server) |

### 3.3 Other live references to `/en/admin`

Grep over the repo excluding `docs/sessions/**`, `tasks/Archive/**`, `node_modules`: the script, `docs/critical-flow-registry.md`,
`docs/backlog.md`, `docs/backlog-reserved.md`, the Sprint 78 plan, and two historical kickoffs
(`tasks/Epics/Epic_RS_kickoff_prompt_Task_451_REWORK_no_session_admin_skip.md`,
`tasks/kickoff_prompt_Task_448_RegressionGuardsSlice1Rework.md`). The two historical kickoffs record what was run and
are **not** rewritten. FACT.

### 3.4 Worktree at design time

Task 893 (in progress) holds four modified paths and one untracked evidence folder — `EXCLUDED AS UNRELATED`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row | With a session, `planRoutes` returns `/admin/users`, then `/admin/users/<uuid>` (or its `notRealCoverage` row without a UUID), then **`/admin`** labelled `Admin dashboard /admin (Task 853)`. No `/en/admin` string remains in the script. | P1 | AC1 | Confirmed |
| R2 | §3.2 | Without a session, the plan carries **three** `notRealCoverage` admin rows (list, detail, dashboard), never a navigable one. | P1 | AC2 | Confirmed |
| R3 | reserved row; self-test must be able to fail | `verifyAdminConfig` asserts R1 and R2 exactly: state 1 expects 3 rows; states 2–3 assert the new list and detail paths **and** the dashboard path; a new assertion fails if any planned path starts with `/en/admin`. | P1 | AC3 (plant P1) | Confirmed |
| R4 | §3.1 | `docs/critical-flow-registry.md:115`: route cell → `/admin/users`, `/admin/users/[id]`, `/admin`; the command cell unchanged except the gate still needs `--with-admin`; the status cell appends *"Task 888 (2026-MM-DD): the admin routes had 404'd since the gate's admin branch was written (admin has no locale segment since 2026-05-14); the 2026-06-17 PASS predates Task 600's non-OK failure and was a false green. Routes corrected; `/admin` added; owner-native re-proof O78-10."* The row's ✅ becomes 🟡 until O78-10 returns. | P1 | AC4 | Confirmed |
| R5 | reserved row (two-armed plant on `/admin`) | A plant script `docs/sessions/evidence/task888/plant-admin-mismatch.mjs` with `apply` and `restore` modes, Node `fs` I/O, printing `git hash-object` before apply and after restore. `apply` creates `src/app/admin/__hydrationPlant.tsx` (`'use client'`, renders `<span>{typeof window === 'undefined' ? 'server' : 'client'}</span>`) and renders it once inside `src/app/admin/page.tsx`'s returned tree. A Server Component is never hydrated, so the differing text must come from a client component. `restore` deletes the plant file and writes `page.tsx`'s pre-apply bytes back. The executor runs `apply` then `restore` once (no server) and records equal hashes. | P1 | AC5 | Confirmed |
| R6 | agent-contract 9 | Session log; `docs/backlog.md` 888 cell; ≤ 80 lines. | P2 | AC6 | Confirmed |

## 5. Assumptions and open questions

- A1: `/admin` renders the Task 853/890 dashboard for a staff session; the gate navigates it like any other route.
- A2 (INFERENCE): the dev noise floor documented in the registry row `:39` (Task 601) can make a single run flaky;
  O78-10 therefore asks for three consecutive runs per arm.
- Open owner questions: none. The live proof is owner-native because it needs a staff session (O78-10).

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (9, 10, 14, 15) · `docs/rule-index.md` → "Regression / Critical
Flow Coverage" · `docs/qa-profiles.md` (Q2) · `docs/critical-flow-registry.md` rows `:39` and `:115` · the script's own
header (`:1-110`) · `docs/orchestrator-procedures.md` → the 818/819 corollary · this kickoff.

## 7. Scope — the exact allowed write set

1. `scripts/check-hydration-console.mjs` — `planRoutes` and `verifyAdminConfig` only (R1–R3).
2. `docs/critical-flow-registry.md` — row `:115` (R4).
3. `docs/sessions/evidence/task888/` — new files, including `plant-admin-mismatch.mjs` (R5).
4. `docs/sessions/2026-MM-DD-task888-hydration-admin-routes.md` (new).
5. `docs/backlog.md` — the 888 text only.

Temporary, restored byte-identical and absent from the final status: `src/app/admin/page.tsx` and
`src/app/admin/__hydrationPlant.tsx` (R5 dry run only).

## 8. Out of scope

- Any product file; the non-admin routes; the error-page self-test; the capture harness (`capture:admin-session`).
- Making the dev-mode noise floor deterministic (Task 601's harness is the authoritative proof for the header case).
- The two historical kickoffs in §3.3.

## 9. Current and required behavior

| | Current | Required after |
|---|---|---|
| `--with-admin` + session | navigates two 404 routes → both FAIL | navigates `/admin/users`, `/admin/users/<uuid>`, `/admin` |
| `--with-admin`, no session | 2 admin rows SKIP | 3 admin rows SKIP |
| `check:hydration:admin-config` (CI) | passes on the 404 paths | passes on the new paths; fails if any `/en/admin` path returns (P1) |
| Registry row `:115` | ✅, 404 routes, a false-green PASS | corrected routes, 🟡 until O78-10 |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version"` → `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task888/00-status.txt`; a §7 path already
   modified → `BLOCKED — WRITE PATH NOT CLEAN`.
3. `git hash-object scripts\check-hydration-console.mjs src\app\admin\page.tsx` → `01-hash-before.txt`. If the script
   hash differs from §3.2, re-read `:172-253` and `:483-574` before editing and record the new line numbers.
4. `npm.cmd run check:hydration:admin-config` and `npm.cmd run check:hydration:verify` → `02`, `03` (both exit 0 expected).

### 10.2 Order

I0 → P1 (self-test must go red first) → R1–R3 → P1 re-run (green) → R5 script + dry run → R4 → gates → session log.

### 10.3 Plants

| Plant | Edit | Expected |
|---|---|---|
| **P1** | before R1: extend `verifyAdminConfig` with R3's assertions only, leaving `planRoutes` unchanged | `admin-config` exits 1 naming the `/en/admin` path and the missing dashboard row (the failing arm of the self-test itself); after R1 it exits 0 |
| **P2** | after R1–R3: through Node, change R1's list path back to `/en/admin/users` | `admin-config` exits 1; restore → exit 0 and the script hash equals the post-R3 hash |
| **P3** (R5 dry run) | `plant-admin-mismatch.mjs apply` then `restore` | two hashes of `src/app/admin/page.tsx` equal; the plant's client file absent afterwards |

## 11. Positive and negative flows

**Positive flow.** The owner runs `next dev`, captures a staff session and runs `check:hydration -- --with-admin`: the
three admin rows PASS; with the plant applied `/admin` FAILs; after restore it PASSes again.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| No session | Yes | 3 admin rows SKIP, never PASS | AC2 |
| Session, no UUID | Yes | detail row SKIP, list + dashboard navigated | AC3 |
| Old `/en/admin` path reintroduced | Yes | CI self-test FAILs | P2 |
| Hydration mismatch on `/admin` | Yes | FAIL (owner-native) | O78-10 |
| `next start` instead of `next dev` | Yes | false green by design — O78-10's block uses `next dev` | script header `:27-36` |

## 12. Acceptance criteria

- **AC1 [R1]** Given the final script, when `planRoutes({withAdmin:true, hasSession:true, adminUserId:'x'})` is
  exercised by the self-test, then the admin paths are exactly `/admin/users`, `/admin/users/x`, `/admin`, and
  `git grep --untracked -n "/en/admin" -- scripts/check-hydration-console.mjs` prints nothing.
- **AC2 [R2]** Given no session, when the self-test runs, then it reports 3 admin rows, all `notRealCoverage`.
- **AC3 [R3]** Given P1 and P2, when `check:hydration:admin-config` runs, then each planted state exits 1 naming the
  failed assertion, and the final state exits 0.
- **AC4 [R4]** Given the registry row, when read back, then it names the three new routes and the R4 sentence, and no
  other row changed.
- **AC5 [R5]** Given P3, then both `page.tsx` hashes equal `01` and the client plant file is absent from the final status.
- **AC6 [R6]** Given the session log, then its Files Changed table equals the real diff of §7; backlog ≤ 80 lines.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC1's empty grep on one named file (the declared deliverable, read with --untracked).`

`GR-2 SCOPE STATED — check:hydration:admin-config inspects the route plan only and cannot see a real hydration mismatch; check:hydration --with-admin sees console hydration text, non-OK status, pageerror and the dev overlay on the routes it visits, only under next dev with a staff session; the admin criteria are closed by the self-test transcripts here and by O78-10's native transcripts.`

## 13. QA profile and verification plan

**Q2** — a gate route-plan fix; CI-safe plants here, the live arm owner-native.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task888"
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run check:hydration:admin-config *> "$ev\20-admin-config.txt"; "admin-config exit=$LASTEXITCODE"
npm.cmd run check:hydration:verify *> "$ev\21-verify.txt"; "verify exit=$LASTEXITCODE"
npm.cmd run typecheck *> "$ev\22-typecheck.txt"; "typecheck exit=$LASTEXITCODE"
npm.cmd run lint *> "$ev\23-lint.txt"; "lint exit=$LASTEXITCODE"
npm.cmd run check:file-integrity *> "$ev\24-file-integrity.txt"; "file-integrity exit=$LASTEXITCODE"
npm.cmd run check:mojibake *> "$ev\25-mojibake.txt"; "mojibake exit=$LASTEXITCODE"
npm.cmd run build *> "$ev\26-build.txt"; "build exit=$LASTEXITCODE"
git --no-optional-locks grep --untracked -n "/en/admin" -- scripts/check-hydration-console.mjs
git hash-object scripts\check-hydration-console.mjs src\app\admin\page.tsx docs\critical-flow-registry.md
git --no-optional-locks status --porcelain
```

Expected: `win32`; every exit 0; the grep prints nothing; `page.tsx` hash equals `01`.

### 13.2 O78-10 — owner-native live proof (after the executor reports; `next dev`, never `next start`)

```powershell
$env:BASE_URL = "http://localhost:3000"
$env:HYDRATION_GATE_STORAGE_STATE = "playwright/.auth/admin-storage-state.json"
$env:HYDRATION_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000000"
npm.cmd run capture:admin-session
npm.cmd run check:hydration -- --with-admin
npm.cmd run check:hydration -- --with-admin
npm.cmd run check:hydration -- --with-admin
node.exe docs\sessions\evidence\task888\plant-admin-mismatch.mjs apply
npm.cmd run check:hydration -- --with-admin
npm.cmd run check:hydration -- --with-admin
npm.cmd run check:hydration -- --with-admin
node.exe docs\sessions\evidence\task888\plant-admin-mismatch.mjs restore
npm.cmd run check:hydration -- --with-admin
```

Before running: start `npm.cmd run dev` in a second window, and replace the UUID line with a real user id from
`/admin/users` (it must be a real user, or the detail row renders an empty profile). Expected: the three clean runs show
`Admin users list`, `Admin user detail` and `Admin dashboard /admin` as PASS; the three planted runs show
`Admin dashboard /admin` FAIL with a hydration message; after `restore` the script prints two equal hashes and the last
run is PASS again. Return all seven summaries and the two hashes.

## 14. Completion report contract

Status per `execute-task`. Include: changed files and hashes; R1–R6/AC1–AC6 with evidence paths; each command's real
exit code; P1–P3 with hashes; O78-10 stated as owed. Update the 888 cell of `docs/backlog.md`; write the session log.
No Git commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1 · R2→AC2 · R3→AC3 · R4→AC4 · R5→AC5 · R6→AC6 |
| Self-test can demonstrably fail | P1 before the fix, P2 after |
| Live arm has a failing plant | R5 / O78-10 |
| Historical records untouched | §3.3, §8 |
| Owner decision needed | none; owner-native run O78-10 |

## Appendix A — Evidence preflight

| Claim | Evidence | Status |
|---|---|---|
| Admin has no locale segment since 2026-05-14 | `src/middleware.ts:25-27`; `git log -S` | VERIFIED |
| Gate plans `/en/admin/*` | `check-hydration-console.mjs:237-243`, self-test `:509,:530,:537` | VERIFIED |
| Non-OK failure landed 2026-07-15 | script header `:19-25`; registry `:39` | VERIFIED |
| 2026-06-17 PASS was a false green | the two facts above | INFERENCE |
| CI runs the config self-test | `governance-pr.yml:164,167` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| agent-contract 9 (deletion/rename audit) | every live `/en/admin` reference rewritten; historical kept | COMPLIANT (§3.3, AC1, AC4) |
| agent-contract 14 | Node I/O, hash witnesses | COMPLIANT (§10.3) |
| agent-contract 15 | gate keeps a failing arm | COMPLIANT (P1, P2, O78-10) |
| Windows-native rule | O78-10 is PowerShell, `npm.cmd`/`node.exe` | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | P1 red before R1 | self-test cannot fail → fix the assertion first |
| 2 | R1–R3 green; P2 red then green | `PARTIALLY IMPLEMENTED` |
| 3 | P3 hashes equal | `BLOCKED` |
| 4 | Final gates | non-zero → `PARTIALLY IMPLEMENTED` |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **888** | reserved 2026-09-27 — **Sprint 78** (hosted next to 887, the other red gate 853's reviews found; the owner may move it), **P2**, **Q2**, filed by Task 853's review 2 (F10) | **`check:hydration -- --with-admin` has two permanently failing admin routes and never visits `/admin`.** `scripts/check-hydration-console.mjs` → `planRoutes` pushes `/en/admin/users` and `/en/admin/users/${adminUserId}` (unchanged since Task 600, 2026-07-15). The admin tree is `src/app/admin/` with no `[locale]` segment, so both return `404`. Measured 2026-09-26 in 853's owner-requested run: `PASS 6 / FAIL 2 / SKIP 1`; `/tmp/dev-server-3000.log` shows `GET /en/admin/users 404` and `GET /en/admin/users/<uuid> 404`, then `GET /admin/users 307` (unauthenticated redirect). So the Task 434 admin-hydration coverage this gate was built for has been dead for an unknown time, and the gate cannot be run green by anyone. Kickoff first: find when the admin routes lost the locale prefix (`git log` on `src/app/admin` and the middleware), and whether any other script or doc still names `/en/admin`. Deliverable: the two routes become `/admin/users` and `/admin/users/<id>`; `/admin` joins the admin list; `check:hydration:admin-config`'s self-test is updated to the new plan; the owner's `--with-admin` run exits 0 with the staff session. A two-armed plant proves a hydration mismatch planted on `/admin` fails the gate and its revert clears it. |
