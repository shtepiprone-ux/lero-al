# Task 931 — completion report (Sonnet executor)

Task: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md` · sidecar stage set to `implemented` ·
security report `docs/sessions/evidence/task931/security/report.json` (17 cases, all `passed`).
Environment: native Windows, Node v22.22.3. No Git command was run except read-only inspection.

## Status

**PARTIALLY IMPLEMENTED.** Every requirement R1–R9 and every acceptance criterion except the two global checks of AC8
(`npm run check:file-integrity`, `npm run check:mojibake`) is met. Those two exit 1 on files that belong to other tasks and
that this task may not touch (see "Deviations", D1). R10 is the reviewer's.

## Totals

| | Tests | Passed | Failed |
|---|---|---|---|
| 7 files, before (`impl/before.json`) | 67 | 50 | 17 (identities identical to `d03-local-failed-ids.txt`, `impl/before-identities.txt`) |
| 7 files, after (`impl/after-7-files.json`) | 76 | 76 | 0, 0 skipped |
| Full suite (`impl/full-suite.txt`, `test-results/unit.json`) | 5931 | 5931 | 0, 0 pending, 351 files |

CI had 5922 tests with 17 failed; 5922 + 9 new tests = 5931.

## Per requirement

| Req | Changed file | Evidence | Status |
|---|---|---|---|
| R1 cron | `src/app/api/cron/listings-expiry/__tests__/route.test.ts` | double supports `.select().eq().lt().limit()` and `.select(…,{count,head}).eq().is()`, records every `update`; 11 tests pass | done |
| R2 transition | `src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts` | `update` double applies each `.eq` to the current row, answers `.select('id')`; the ALLOW test also asserts the write filters are `[id, status]`; 13 tests pass | done |
| R3 admin page | `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` | mocks `@/lib/auth/requireViewer` (real `requireStaffPage`), `notFound`/`redirect` throw recognisable errors; new DENY test; 19 tests pass | done |
| R4 permissions | `src/lib/auth/__tests__/permissions.test.ts` | `requireViewer` double; `@/lib/auth/server` mock removed; client-factory mocks kept for `roleHasPermission`; new refused-viewer and no-role tests | done |
| R5 moderator switches | `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts` | `requireViewer` double; assertions target the `role_permissions` table; new moderator and lookup-failed tests | done |
| R6 signup | `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` | token reaches `signUp`, `verifyTurnstile` not called; Supabase refusal → `captcha_failed` | done |
| R7 statistics | `src/modules/cabinet/statistics/__tests__/access.test.ts` | `requireViewer` double; no own role read; `lookup_failed` → `not_agent`; missing/deleted profile → `unauthenticated` | done |
| R8 registry | `docs/critical-flow-registry.md` rows Signup and Listing expiry reconciliation | rows describe Supabase refusal and the paused counting, name the current tests; Signup row reference `captcha.ts:12` corrected to `captcha.ts:22` | done |
| R9 planted breaks | `impl/sensitivity/run-plants.mjs`, `P1…P6-*.txt`, `*-baseline/broken/restored.json` | each: baseline pass → break → named case fails with an assertion → restored pass → `git diff --exit-code -- <file>` exit 0 | done |
| R10 | — | reviewer's, after Task 940 | not mine |

## Renamed or rewritten tests (old full name → new full name)

Full lists: `impl/rename-map.txt`. Two of the 17 keep their name and now pass (`admin: pending → active (privileged)…`,
`GET … authorized, lapsed active listings → same result as POST`). The other 15, plus two tests that passed before by accident:

- T9 `selects premium_until…` → `[SEC-931-FE-PAGE-ALLOW] a staff viewer: selects premium_until…`
- `hasPermission → true for a moderator…` → `[SEC-931-SRV-PERM-ALLOW] hasPermission → true…`
- getModeratorPermissions: `admin caller…` → `[SEC-931-SRV-MODPERM-ALLOW] …`; `regular user…` → `[SEC-931-SRV-MODPERM-USER-DENY] …`; `admin client read error…` → `[SEC-931-SRV-MODPERM-ERROR] …`
- signup: `happy path: valid captcha + email/password → { ok: true }` → `[SEC-931-SRV-CAPTCHA-ALLOW] happy path: … the token goes to Supabase and verifyTurnstile is not called`
- signup: `captcha fail — turnstile rejects → … without calling Supabase` → `[SEC-931-SRV-CAPTCHA-DENY] captcha fail — Supabase refuses the token → { ok: false, reason: "captcha_failed" }` (the old name ends: it asserted the removed Task 923 R67 (c) behaviour)
- `owner: active → sold (privileged)…` → `[SEC-931-SRV-TRANSITION-ALLOW] owner: active → sold (privileged)…`
- statistics: `role agent -> ok…` → `[SEC-931-SRV-STATS-ALLOW] …`; `a role lookup error is denied…` → `[SEC-931-SRV-STATS-DENY] …`; `reads the role of the session user only` → `takes the role from requireViewer and makes no role read of its own`; `a missing profile row is not_agent` (passed by accident) → `a missing or deleted profile is unauthenticated`
- cron: `authorized, lapsed active listings → expired count matches` → `[SEC-931-SRV-CRON-ALLOW] … counted as would_expire, expired 0, no listing written`; `authorized, nothing lapsed → expired = 0, no updates` → `… would_expire 0, no updates`; `NULL-expiry active rows reported but NOT mutated` → `[SEC-931-SRV-CRON-DENY] …`; `status set to engine-resolved value (expired), not raw string` → `while paused, no listing status is written` (the old name ends, D56/D58)
- T4 `a failed update toasts status_change_error…` → `[SEC-931-FE-STATUS-ERROR] a failed update toasts…`

New tests beyond the sidecar cases: cron failed NULL-expiry count → 500; permissions viewer without a role; getModeratorPermissions
lookup-failed viewer; signup message-only captcha refusal; statistics `role null`.

## Dropped expectation (R7)

The old `expect(errorSpy).toHaveBeenCalledWith('[AgentStatistics] access failed', { code: 'PGRST116' })` of "a role lookup error is
denied" is dropped: `access.ts` no longer reads the database or logs (C13); the lookup and its logging live in `requireViewer`.
The denial itself (`not_agent`, never `ok`) is still asserted and is the planted-break target of P6.

## SEC-931 cases

All 17 `passed` in `security/report.json` (`impl/report-harness.txt`); `verify --contract …security.json` exit 0 (`impl/verify.txt`).
The six deny cases that are planted-break targets: PAGE-DENY (P1), PERM-DENY (P2), MODPERM-MODERATOR-DENY (P3), CAPTCHA-DENY (P4),
CRON-DENY (P5), STATS-DENY (P6). Failure text of each: `impl/sensitivity/P*-SEC-*.txt` (P1 `promise resolved … instead of rejecting`;
P2 `expected true to be false`; P3 `promise resolved … instead of rejecting`; P4 `expected { ok: false, …(2) } to deeply equal …`;
P5 `expected [ { …(2) } ] to have a length of +0 but got 1`; P6 `expected { Object (kind, ownerId) } to deeply equal { kind: 'not_agent' }`).

## Commands (AC8)

| Command | Exit | Transcript |
|---|---|---|
| `npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json` | 0 | `impl/full-suite.txt` |
| `node scripts/workflow-gates/cli.mjs unit-report` | 0 | `impl/unit-report.txt` |
| `npm run typecheck` | 0 | `impl/typecheck.txt` |
| `npx eslint <the 7 files>` | 0 | `impl/eslint.txt` |
| `npm run build` | 0 | `impl/build.txt` |
| `npm run test:admin` / `test:auth` / `test:listings` | 0 / 0 / 0 (38 / 81 / 65 tests) | `impl/test-admin.txt`, `test-auth.txt`, `test-listings.txt` |
| `node …/report.mjs`, then `cli.mjs verify --contract …security.json` | 0, 0 | `impl/report-harness.txt`, `impl/verify.txt` |
| `npm run check:file-integrity` (default mode) | **1** | `impl/file-integrity.txt` |
| `npm run check:file-integrity -- --files <the 11 files of this task>` | 0 | `impl/file-integrity-scoped.txt` |
| `npm run check:mojibake` | **1** | `impl/mojibake.txt` (extract) |

`git diff --name-only` lists no production file under `src/` outside `__tests__`. It also lists `.claude/rules/review/03-decision-closure.md`,
`scripts/workflow-gates/{cli,contract,security-hook}.mjs` and `publication.json`: I did not edit them; they were already modified in the
working tree when this session started (another session's governance work).

## Deviations and questions for Opus

- **D1 — two AC8 checks fail on other tasks' files.** `check:file-integrity` (default mode = git-changed + untracked): 2 corrupt files,
  `docs/sessions/evidence/task923/review-67/rv67-40-final-commit-paths.nul` and `rv67-44-closing-evidence-paths.nul` (NUL-delimited path lists,
  untracked). `check:mojibake`: 2546 artifacts in 7 untracked evidence files of Tasks 923, 927 and 937 (list in `impl/mojibake.txt`); none
  names a file of this task. I did not change those files or `scripts/mojibake-allowlist.json` (out of scope, policy). Needs an owner/Opus decision
  (fix, move or allowlist by whoever owns that evidence). The raw mojibake output was replaced by a short extract because it quotes the
  artifacts verbatim and would itself trip the check.
- **D2 — the sidecar test name says "13 keys present", the registry holds 21 keys.** `PERMISSION_KEYS` has 21 entries (13 + 8 added after
  Task 871). The old literal `toHaveLength(13)` was stale and was hidden by the earlier failure. The two assertions now use
  `PERMISSION_KEYS.length` (the next assertion already checks every key is present). I kept the title text `… 13 keys present` because the sidecar
  maps that exact full name and changing it is Opus's. Please revise the `SEC-931-SRV-MODPERM-ALLOW` testName (and the title) to `21 keys`/`all keys`.
- **D3 — GR-7.** No reference audit was run: the task is test-only with `Scope: none` and relies on no UI/reference claim
  (`shared/reference-research.md`: the gate applies to a UI/reference claim).
- **D4 — harness writes to production files.** `run-plants.mjs` (a Node script, not the Edit tool) wrote and restored the six production files;
  restoration is byte-compared in the script and re-proved by `git diff --exit-code` (exit 0 for each). `git status` of the six files is clean.

## Owner visual QA

None: no visible UI change.

PARTIALLY IMPLEMENTED
