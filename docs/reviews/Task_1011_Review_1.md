# Task 1011 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1011_Cloudinary_Keeps_No_Unused_Upload.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1011_Cloudinary_Keeps_No_Unused_Upload.md) · OWASP record: [Task_1011.json](../security/owasp/reviews/Task_1011.json)

Review 1 of the branch `task/1011-cloudinary-keeps-no-unused-upload`, working tree on 25a72eb29 (uncommitted) — APPROVED
Scope: the diff against 25a72eb29 (`main`): the ten files of the kickoff's Scope; entry point: GET `/api/cron/cloudinary-cleanup` (Vercel cron, `CRON_SECRET`); `deleteAccount` (staff and self deletion)
Tools: local commands below with their exit codes; CI is UNKNOWN until `gh pr checks <n>` after the owner's push (V14)
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: lowered; unreferenced uploads, empty owner folders and a deleted account's folder are removed only through the reference check, the folder guard and a proven-gone account, and the deletion check reads every CMS page.

The implementer is Sonnet; every claim of its report was rerun here, none is taken from a report.

## Tools (local, 2026-11-22)

- V1: `node scripts/quality/owasp.mjs sync` → 0 changed (c2a1e3e32cec), exit 0; `node scripts/quality/owasp.mjs check` → exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches, exit 0; `gh run list --branch main --limit 2` → CI run 45049500398 on 25a72eb29 `success`.
- V3: `npm test -- src/app/api/cron/cloudinary-cleanup/__tests__/route.security.test.ts src/lib/__tests__/cloudinaryPurge.security.test.ts src/lib/cloudinaryDelete.security.test.ts src/lib/account/deleteAccount.security.test.ts` → 4 files, 66 passed, exit 0.
- V8, AC1-AC3: the production code undone (`cloudinaryDelete.ts` and `deleteAccount.ts` set to `main`, the cron `route.ts` removed) → 46 failed, 6 passed, the route test file does not load, exit 1; restored (each file compared with `9de067faf` by `cmp`) → 66 passed, exit 0.
- V7: `node scripts/quality/check-files.mjs` on the ten files → 0 findings, exit 0.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0; the record gives a verdict for every sheet of "## OWASP" and for the nine the diff adds (Cryptographic_Storage, Error_Handling, HTTP_Strict_Transport_Security, Identity_Propagation_Patterns, Injection_Prevention, Multi_Tenant_Security, Query_Parameterization, SQL_Injection_Prevention, Transport_Layer_Security).

## Scope (V2) and the changed lines (V4)

- `git status --short --untracked-files=all` → exactly the ten Scope files: five modified (`cloudinaryDelete.ts`, `deleteAccount.ts`, their two tests, `vercel.json`), five new (the cron `route.ts` and its test, `cloudinaryAdminRead.ts`, `cloudinaryPurge.security.test.ts`, `src/tests/fakeCloudinary.ts`).
- Each of the ten files is byte for byte the file of `9de067faf` (`git show 9de067faf:<path>` compared with `cmp`); `main` has not changed any of them since `9de067faf` left it (`git diff --stat <merge-base> 25a72eb29 -- <the files>` empty), so taking them whole undoes nothing of `main`.
- `vercel.json`: only the cron entry `/api/cron/cloudinary-cleanup` `15 3 * * *` (lines 24-27).

## Approved behaviour (V5)

- `deleteAsset` keeps its reference check, its fail-closed lookup and `CLOUDINARY_DELETE_MODE`; the `pages.content` read changes from the first 500 rows to every page of 500 ordered by `id` until a short page, and a failing page still fails the check (`src/lib/cloudinaryDelete.ts:109-118`).
- `deleteAccount` keeps every step in its order: the reads, the auth deletion (`deleteAccount.ts:45`), the releases and the avatar objects; the purge is added last (`deleteAccount.ts:70-79`) and only counts into `filesNotRemoved`, so a failing purge never turns a done deletion into an error.

## Exemptions (V6)

None: the diff adds or removes no allowlist, baseline, registry row, `skip`, `only` or `eslint-disable`.

## Secure code review (V7, secure-code-review.md §2 and §3)

- §2: no control weakened; one new entry point (the cron route), checked by the existing constant-time `verifyCronRequest` before any read (`route.ts:43-44`); no trust boundary moves; no package; no test or assertion removed.
- Authorization: the cron secret on every call (401 without it, an unset secret refuses all: `src/lib/cron/verifyCronRequest.ts:14-24`). A purge first proves the account gone: `getUserById` must answer not found; another answer or a throw touches nothing (`cloudinaryDelete.ts:283-288`); an id that is not a UUID is refused before any read.
- Files: a candidate upload must match `^<uuid>/(listings/(<uuid>/)?|avatars/)[^/]+$` and be older than 7 days (`route.ts:22`, `:77`), and still passes `deleteAsset`. A folder is removed only when the guard allows it (`cloudinaryDelete.ts:254`) or it lies under a proven-gone account; Cloudinary refuses a folder that is not empty, and a folder holding a kept file stays with its parents (`keep`, `cloudinaryDelete.ts`). `Lero` and every root not named by a UUID are skipped (`route.ts:97`).
- Mode: the cleanup, `deleteEmptyFolder` and the purge all read `CLOUDINARY_DELETE_MODE`; a dry run deletes nothing (`cloudinaryDelete.ts:253-255`, `:290-291`).
- Requests: every request goes to the fixed host `https://api.cloudinary.com`, path segments encoded (`cloudinaryAdminRead.ts:51`, `cloudinaryDelete.ts:238`); the Admin API reads are GET only.
- Resources: at most 10 pages of 500, 100 deletions and 200 Admin API calls per run (`route.ts:25-27`); a spent budget stops the run before the call (`cloudinaryAdminRead.ts:26-30`).
- Data exposure, errors, logging: the answer and the run line hold counts only (`route.ts:127-128`); failures log the error name only; no secret, e-mail or URL is logged.
- Authentication and sessions, business logic of listings, dependencies and configuration other than the cron line: not touched — no file of them in the diff.
- Agent and tool output: `check-files.mjs` → 0 findings; no rule, skill, hook, setting or CI file changed.
- Tests: four files, 66 cases; each I9 break of the executor (the secret check, the folder guard, the account-absence proof, the paged read) fails its file; the production code undone fails 46 (V8).

## Stories (V9)

No Story changed; the change has no visible surface.

## Findings

None.

## Open parts

- Owner: commit and push the branch, open the pull request (checklist H).
- Opus: `gh pr checks <n>` until every check has concluded (V14).
- The cleanup deletes only with `CLOUDINARY_DELETE_MODE=enabled` (set by the owner on 2026-11-18, per the kickoff's Cause); the first runs after the merge are read in the Vercel log line `[cron/cloudinary-cleanup] complete (counts only)`.
