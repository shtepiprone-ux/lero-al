# Task 888 — `check:hydration --with-admin` measures the admin routes that exist

**Sprint 78** (hosted next to 887, the other red gate 853's reviews found) · **P2** · **Q4** (was Q2; corrected by
review 1 — the task changes `docs/critical-flow-registry.md`) · Track B (non-UI) · filed 2026-09-27 by Task 853's
review 2 (F10) · kickoff written 2026-09-29 · live proof **O78-10** · **Status: 🔁 `NEEDS REVISION` — review 1,
2026-09-30. Start at §16 (Revision 1).**

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

### 3.5 Review 1 live measurement (2026-09-30, win32, Node v22.22.3, `next dev`)

Evidence: `docs/sessions/evidence/task888/review/` (`00-env.txt`, `10-warmup.txt`, `11-dev-server.log`).

- The reviewer ran `check:hydration -- --with-admin` against `next dev` with the stored
  `playwright/.auth/admin-storage-state.json` (its access token expired 2026-09-27T01:01:48Z) and a real user id. FACT.
- The server answered `GET /admin/users 307`, `GET /admin/users/<id> 307` and `GET /admin 307`, each followed by
  `GET /en/auth/login?next=%2Fadmin&session=lost 200` (`11-dev-server.log`). The redirect is
  `src/app/admin/layout.tsx:40`. FACT.
- The gate reported all three admin rows as **measured** routes and failed them on an *attribute* hydration mismatch
  from the **login page** (`10-warmup.txt`). No admin page rendered in that run. FACT.
- Cause: `checkRoute` (`scripts/check-hydration-console.mjs:293-349`) calls `page.goto`, which follows redirects, and
  judges only the final response (`response.ok()`, `:328`) and the landing page's console. It never compares the landing
  URL with the requested one. FACT (full function read).
- Consequence: whenever the session is stale or lacks staff rights, the three admin rows measure the login page. If the
  login page is clean, they **PASS without rendering any admin page** — the same false-coverage class this task exists
  to remove (the 404 was one; a redirect is the other). INFERENCE from the source above; the login page was not clean
  in this run, so it was a FAIL, not a PASS.
- The public routes do not redirect: `GET /en 200`, `/en/listings 200`, `/sq 200`, `/uk 200` in the same log. FACT.
  A same-path rule therefore does not change their verdicts.
- `.env.local` defines `HYDRATION_ADMIN_EMAIL` and `HYDRATION_ADMIN_PASSWORD` (names counted, values not read), so
  `npm.cmd run capture:admin-session` can refresh the session without a person at the keyboard. FACT.
- Side observations, filed and **out of scope here**: `/admin/users/[id]/page.tsx:82` dereferences `me!.id` and throws
  `TypeError` on a lost session before the layout redirect lands → **900**; the login page's attribute hydration
  mismatch (measured with Task 886's uncommitted `MantineAuthFormPattern.tsx` in the tree) → **901**.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row | With a session, `planRoutes` returns `/admin/users`, then `/admin/users/<uuid>` (or its `notRealCoverage` row without a UUID), then **`/admin`** labelled `Admin dashboard /admin (Task 853)`. No `/en/admin` string remains in the script. | P1 | AC1 | Confirmed |
| R2 | §3.2 | Without a session, the plan carries **three** `notRealCoverage` admin rows (list, detail, dashboard), never a navigable one. | P1 | AC2 | Confirmed |
| R3 | reserved row; self-test must be able to fail | `verifyAdminConfig` asserts R1 and R2 exactly: state 1 expects 3 rows; states 2–3 assert the new list and detail paths **and** the dashboard path; a new assertion fails if any planned path starts with `/en/admin`. | P1 | AC3 (plant P1) | Confirmed |
| R4 | §3.1 | `docs/critical-flow-registry.md:115`: route cell → `/admin/users`, `/admin/users/[id]`, `/admin`; the command cell unchanged except the gate still needs `--with-admin`; the status cell appends *"Task 888 (2026-MM-DD): the admin routes had 404'd since the gate's admin branch was written (admin has no locale segment since 2026-05-14); the 2026-06-17 PASS predates Task 600's non-OK failure and was a false green. Routes corrected; `/admin` added; owner-native re-proof O78-10."* The row's ✅ becomes 🟡 until O78-10 returns. | P1 | AC4 | Confirmed |
| R5 | reserved row (two-armed plant on `/admin`) | A plant script `docs/sessions/evidence/task888/plant-admin-mismatch.mjs` with `apply` and `restore` modes, Node `fs` I/O, printing `git hash-object` before apply and after restore. `apply` creates `src/app/admin/__hydrationPlant.tsx` (`'use client'`, renders `<span>{typeof window === 'undefined' ? 'server' : 'client'}</span>`) and renders it once inside `src/app/admin/page.tsx`'s returned tree. A Server Component is never hydrated, so the differing text must come from a client component. `restore` deletes the plant file and writes `page.tsx`'s pre-apply bytes back. The executor runs `apply` then `restore` once (no server) and records equal hashes. | P1 | AC5 | Confirmed |
| R6 | agent-contract 9 | Session log; `docs/backlog.md` 888 cell; ≤ 80 lines. | P2 | AC6 | Confirmed |
| R7 | review 1 F1 (§3.5) | `checkRoute` records a violation `{ type: 'redirect', text: 'redirected <requested pathname> → <landing pathname>' }` whenever the landing page's pathname (`new URL(page.url()).pathname`) differs from the requested URL's pathname. The query string and one trailing slash are ignored. It applies to every navigated route, so a stale or non-staff session turns each admin row into a FAIL that names the login path, never a verdict about the login page. `runErrorPageSelfTest` gains a case `/redirect` that answers `307` with `Location: /clean`, expected **FAIL**; the existing three cases keep their expectations. | P1 | AC7 (plant P4) | Confirmed |
| R8 | review 1 F2 (§3.5) | The live arm runs, with fresh evidence, against the **final** script: `capture:admin-session` exits 0, then one warm-up run (not counted), three clean runs, three with the P3 plant applied, one after restore — the §13.2 sequence, run by the executor. Clean and restored runs: the three admin rows PASS. Planted runs: `Admin dashboard /admin` FAILs on a hydration message (not `redirect`), and the list and detail rows PASS. | P1 | AC8 | Confirmed |
| R9 | review 1 | The registry row's status sentence (R4) also says that `checkRoute` now fails a redirect off the requested path. The row stays 🟡; only the approving review turns it ✅. | P2 | AC4 | Confirmed |

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

1. `scripts/check-hydration-console.mjs` — `planRoutes` and `verifyAdminConfig` (R1–R3); **Revision 1 adds**
   `checkRoute` and `runErrorPageSelfTest` with its test server (R7), and the file header's description of what the
   gate fails on (one line for the redirect rule).
2. `docs/critical-flow-registry.md` — row `:115` (R4).
3. `docs/sessions/evidence/task888/` — new files, including `plant-admin-mismatch.mjs` (R5).
4. `docs/sessions/2026-MM-DD-task888-hydration-admin-routes.md` (new).
5. `docs/backlog.md` — the 888 text only.

Temporary, restored byte-identical and absent from the final status: `src/app/admin/page.tsx` and
`src/app/admin/__hydrationPlant.tsx` (R5 dry run only).

## 8. Out of scope

- Any product file; the non-admin routes' plan; the capture harness (`capture:admin-session`) — it is run, not edited.
- Wiring `check:hydration:error-page` into CI: `.github/workflows/governance-pr.yml` is modified by Task 886 and is not
  a clean write path. `GR-2 SCOPE STATED — check:hydration:error-page inspects checkRoute's verdict on four synthetic
  pages; CI does not run it; R7 is closed by P4's transcripts here and by R8's live runs.`
- **900** and **901** (§3.5).
- Making the dev-mode noise floor deterministic (Task 601's harness is the authoritative proof for the header case).
- The two historical kickoffs in §3.3.

## 9. Current and required behavior

| | Current | Required after |
|---|---|---|
| `--with-admin` + session | navigates two 404 routes → both FAIL | navigates `/admin/users`, `/admin/users/<uuid>`, `/admin` |
| `--with-admin`, no session | 2 admin rows SKIP | 3 admin rows SKIP |
| `check:hydration:admin-config` (CI) | passes on the 404 paths | passes on the new paths; fails if any `/en/admin` path returns (P1) |
| Registry row `:115` | ✅, 404 routes, a false-green PASS | corrected routes, 🟡 until O78-10 |
| a navigated route redirects (e.g. stale session → `/en/auth/login`) | the landing page is judged as if it were the route | FAIL `redirect`, naming both paths |

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
| Stale / non-staff session → admin route redirects to login | Yes | admin rows FAIL `redirect`, never judged on the login page | AC7 (P4), §3.5 |
| First dev compile exceeds the 15 s `goto` timeout | Yes | row SKIPs; the warm-up run absorbs it and is not counted | AC8 |

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
- **AC7 [R7]** Given P4 (§16.3), when `check:hydration:error-page` runs with the R7 guard absent, then the `/redirect`
  case reports PASS and the command exits 1; with the guard present it reports FAIL with a `redirect` violation, the
  other three cases keep their expected results, and the command exits 0.
- **AC8 [R8]** Given the §13.2 sequence on `next dev` against the final script hash, then each of the three clean runs
  and the restored run lists `Admin users list`, `Admin user detail` and `Admin dashboard /admin` as PASS; each of
  the three planted runs lists `Admin dashboard /admin` as FAIL with a hydration-text violation and no `redirect`
  violation; and the two plant hashes of `src/app/admin/page.tsx` are equal. Rows outside the admin branch are
  recorded as observed, not asserted.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC1's empty grep on one named file (the declared deliverable, read with --untracked). AC8 asserts the admin rows only, because a dev-mode public row can fail for reasons outside this task.`

`GR-2 SCOPE STATED — check:hydration:admin-config inspects the route plan only and cannot see a real hydration mismatch; check:hydration --with-admin sees console hydration text, non-OK status, pageerror and the dev overlay on the routes it visits, only under next dev with a staff session; the admin criteria are closed by the self-test transcripts here and by O78-10's native transcripts.`

## 13. QA profile and verification plan

**Q4** — the task changes a `docs/critical-flow-registry.md` row (`docs/qa-profiles.md` Q4). Required: the regression
baseline (I0 `02`/`03`), a changed-behavior test (the admin-config self-test, and P4's error-page case), planted-violation
failure proof for each gate claimed (P1, P2, P4, and the P3 plant inside R8's live runs), and native evidence. Review 1
corrected the original `Q2`, which is the standard-UI profile.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task888"
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run check:hydration:admin-config *> "$ev\20-admin-config.txt"; "admin-config exit=$LASTEXITCODE"
npm.cmd run check:hydration:verify *> "$ev\21-verify.txt"; "verify exit=$LASTEXITCODE"
npm.cmd run check:hydration:error-page *> "$ev\27-error-page.txt"; "error-page exit=$LASTEXITCODE"
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

### 13.2 O78-10 — live proof (Revision 1: run by the executor as R8; `next dev`, never `next start`)

Revision 1: the executor runs this block itself after the final script edit, redirecting each command into
`docs/sessions/evidence/task888/rev1/40-…` to `48-…` through a Node UTF-8 rewrite (no BOM), and uses the staff
user id from the fresh storage state. The first `check:hydration` line is the warm-up and is not counted. If
`capture:admin-session` exits non-zero, stop the live arm and report `PARTIALLY IMPLEMENTED — O78-10 OWNER-NATIVE`
with the capture transcript; the owner then runs this same block.

```powershell
$env:BASE_URL = "http://localhost:3000"
$env:HYDRATION_GATE_STORAGE_STATE = "playwright/.auth/admin-storage-state.json"
$env:HYDRATION_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000000"
npm.cmd run capture:admin-session
npm.cmd run check:hydration -- --with-admin
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

Before running: start `npm.cmd run dev` in a second window (or as a background process whose log is retained as
`rev1/39-dev-server.log`), and replace the UUID line with a real user id from `/admin/users` (it must be a real user,
or the detail row renders an empty profile). The first `check:hydration` line is the warm-up. Expected: the three
counted clean runs show `Admin users list`, `Admin user detail` and `Admin dashboard /admin` as PASS; the three planted
runs show `Admin dashboard /admin` FAIL with a hydration message and no `redirect` violation; after `restore` the script
prints two equal hashes and the last run is PASS again. Return all eight summaries, the dev-server log lines for the
admin requests (each must be `200`, never `307`), and the two hashes.

## 14. Completion report contract

Status per `execute-task`. Include: changed files and hashes; R1–R9/AC1–AC8 with evidence paths; each command's real
exit code; P1–P4 with hashes; the R8 live-arm transcripts, or `O78-10 OWNER-NATIVE` with the capture transcript if
capture failed. Update the 888 cell of `docs/backlog.md`; write the session log. No Git commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1 · R2→AC2 · R3→AC3 · R4→AC4 · R5→AC5 · R6→AC6 |
| Self-test can demonstrably fail | P1 before the fix, P2 after |
| Live arm has a failing plant | R5 / R8 (O78-10) |
| A redirect cannot stand in for the route | R7 / P4 (review 1) |
| Historical records untouched | §3.3, §8 |
| Owner decision needed | none; O78-10 falls back to the owner only if capture fails |

## 16. Revision 1 — review 1, 2026-09-30 (`NEEDS REVISION`)

### 16.1 Findings this revision answers

| Finding | Severity | Requirement | Summary |
|---|---|---|---|
| F1 | P1 | R7 | `checkRoute` follows a redirect and judges the landing page; with a stale session all three admin rows measured `/en/auth/login` (§3.5). A clean login page would PASS them. |
| F2 | P1 | R8 | The live arm never ran, and the stored session is dead (access token expired 2026-09-27), so O78-10 as handed over would have measured the login page three times per arm. |
| F3 | P3 | §13 | The QA profile was `Q2` (standard UI); a registry change is `Q4`. Corrected in the header and §13. |

The original pass is accepted as-is for R1–R6 (self-test P1/P2 red→green and the P3 dry run, re-verified by the
reviewer: `check:hydration:admin-config` and `check:hydration:verify` exit 0 natively, script hash `b383308a…`,
`page.tsx` hash `74b26361…`, plant file absent, empty `/en/admin` grep).

### 16.2 Re-entry

- Mode: `remediation`. Start at step 1 below. Do not re-run I0, P1, P2 or the P3 dry run, and do not overwrite any file
  in `docs/sessions/evidence/task888/` outside `rev1/`. `review/` is the reviewer's and is read-only.
- Write evidence to `docs/sessions/evidence/task888/rev1/`. Rewrite every PowerShell-redirected file through Node as
  UTF-8 without BOM before `check:file-integrity` (the original pass hit this; list the files as an explicit manifest).
- In §13.1, use `$ev = "docs\sessions\evidence\task888\rev1"`.

### 16.3 Steps

1. `git hash-object scripts\check-hydration-console.mjs src\app\admin\page.tsx` → `rev1/00-hash-before.txt`; expect
   `b383308a502347ca831b68cc223b979bc15251f3` and `74b26361b0f4c90c33e45c0ed15195483fbcfc8e`. A different script hash →
   re-read `checkRoute` and `runErrorPageSelfTest` before editing and record it.
2. **P4 red first.** Add only the `/redirect` case to `runErrorPageSelfTest` (server answers `307`, `Location: /clean`;
   case expects `FAIL`). Run `npm.cmd run check:hydration:error-page` → `rev1/10-P4-red.txt`: the `/redirect` case
   reports PASS and the command exits 1.
3. Add the R7 guard to `checkRoute`, after the `goto` succeeds and before the verdict: compare
   `new URL(url).pathname` with `new URL(page.url()).pathname`, each with one trailing `/` removed (keep a bare `/`).
   Update the header's fail-list line. Re-run → `rev1/11-P4-green.txt`: `/redirect` FAIL with a `redirect` violation,
   `/500` FAIL, `/throw` FAIL, `/clean` PASS, exit 0.
4. Re-run `check:hydration:verify` and `check:hydration:admin-config` → `rev1/12`, `rev1/13` (both exit 0).
5. Update the registry row's status sentence (R9). One-line diff against the current row.
6. Run §13.2 (R8) → `rev1/39`–`rev1/48`, then §13.1 → `rev1/20`–`rev1/27` plus the hash, grep and status lines.
7. Session log: add a `## Revision 1` section (Files Changed updated) to the existing log; update the 888 backlog cell.

### 16.4 Stop conditions

- The fresh session still produces `307` on an admin route → `BLOCKED — STAFF SESSION`, with the capture transcript
  and the dev-server lines. Do not change the capture harness.
- A public route FAILs `redirect` in the live run → stop and report it with the dev-server line. Do not narrow R7 to
  the admin rows.

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
