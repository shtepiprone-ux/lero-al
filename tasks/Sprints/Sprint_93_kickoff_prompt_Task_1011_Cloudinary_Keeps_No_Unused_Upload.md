# Task 1011 — Cloudinary keeps no upload that nothing uses, and deletion sees every CMS page

Sprint 93. Priority P1. Owner decisions: O957-4 2026-11-18 (the owner: "add automatic cleanup to the existing task": a daily job removes unreferenced listing and avatar uploads and empty owner folders); the owner 2026-11-18 on deleting a user: "the user's main folder and all files and folders in it". Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`). Corrected 2026-11-22 before execution (checklist D, owner, translated: "fix it"): that code is in commit `9de067faf`; `deleteAccount.ts` is named in the Scope; the executor starts from a clean tree and takes the files with `git show`; the Route runs the checklist's test command.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

Nothing removes an upload that no row uses, an empty folder, or a deleted account's folder, and the deletion check reads only the first 500 CMS pages, so a file a later page uses could be called unreferenced. After the task a daily cron removes unreferenced listing and avatar uploads older than 7 days and empty owner folders, deleting an account removes its folder, and the reference check reads every CMS page.

## Cause

Read at `a9915f3ba`
- Nothing removes an upload no row uses, nor an empty folder: `deleteAsset` (`src/lib/cloudinaryDelete.ts:158`) destroys one asset when a caller asks (`/image/destroy`, `src/lib/cloudinaryDelete.ts:127`), and no code calls the folders API. A read-only count (Admin API and `listing_images`, 2026-11-18): 216 assets under `<uuid>/listings/`, 16 of them referenced by no `listing_images` row, all older than 24 hours, the oldest of 2026-09-20 (abandoned create forms). Until 2026-11-18 production never deleted: an approved probe (the test agent replaced its avatar twice on `https://lero.al/api/upload-avatar`, then restored) logged `[deleteAsset] … outcome: 'DRY_RUN'` (Vercel runtime log, production, 22:29:45 UTC), so every removal before (photos, listings, accounts, avatars) left its file: 16 unreferenced files under `<uuid>/listings/`, 1 under `<uuid>/avatars/` (read-only count). Of the 12 root UUID folders 5 belong to no account: 4 hold only an empty `listings` folder, 1 holds that avatar file. `deleteAccount` releases only the ids its rows hold (`src/lib/account/deleteAccount.ts:36`, `collectPublicIds` at :73), so a file no row names stays with its folder: one test account's `<uuid>/Brand/Favicon` and `<uuid>/Brand/Logotype` hold 9 files uploaded by hand, and `site_settings` `logo_url`, `logo_dark_url` and `favicon_url` use 2 of them (read-only, 2026-11-18). The owner then set `CLOUDINARY_DELETE_MODE=enabled` (one variable for production and preview) and redeployed; the repeated probe logged `outcome: 'DELETED'` (22:36:33 UTC) and the replaced file answers 404. The cleanup removes what the earlier removals left. The account uses dynamic folders: a stored listing asset has `public_id` `<uuid>/listings/<name>` and `asset_folder` `<uuid>/listings` (same read).
- `src/lib/cloudinaryDelete.ts:102` reads only the first 500 CMS pages before calling an asset unreferenced (C-05); the cleanup above relies on that check.
Fix: the daily cron, `deleteEmptyFolder` and `purgeAccountFolder` in the one module allowed to delete, `deleteAccount` calling the purge, and the paged CMS read.

## Scope

- Cleanup (O957-4): `src/app/api/cron/cloudinary-cleanup/route.ts` (GET, `verifyCronRequest`; daily `15 3 * * *` in `vercel.json`). It pages the Admin API image list (at most 10 pages of 500 per run), keeps only `public_id` matching
  `^<uuid>/(listings/(<uuid>/)?|avatars/)[^/]+$` created more than 7 days ago (Opus proposal: a create form left open for days still saves), and calls `deleteAsset(id, { reason: 'upload_unreferenced' })` for at most 100 per run; `deleteAsset`'s reference check over every table,
  its fail-closed lookup and its `CLOUDINARY_DELETE_MODE` decide. Then `deleteEmptyFolder(path)`, new in `src/lib/cloudinaryDelete.ts` (the one module allowed to delete), walks every root folder named by a UUID and its `listings`, `listings/<uuid>` and `avatars` subfolders, and removes deepest first each one matching
  `^<uuid>(/listings(/<uuid>)?|/avatars)?$` that holds no asset and no subfolder, whether or not its account exists (`DELETE /folders/<path>`, same mode switch; any other path refused, so `<uuid>/Brand/…` and its parent stay); at most 200 Admin API calls per run (the Free plan allows 500 per hour). The answer and one log line carry the counts (scanned, deleted, kept, folders removed, dry run).
- Account folders (O957-4, owner 2026-11-18: deleting a user should remove "the user's main folder and all files and folders in it"): `purgeAccountFolder(userId)` in `src/lib/cloudinaryDelete.ts` first proves the account is gone (`auth.admin.getUserById` answers not found;
  any other answer or error: nothing is touched), then walks every folder under `<userId>` (any name, `Brand` included), passes every asset of each `asset_folder` (paged) to `deleteAsset(id, { reason: 'account_folder' })`, and removes the emptied folders deepest first, `<userId>` last;
  a file a row still uses (the site logo above) is kept with its folders. A root folder not named by a UUID is never touched: `Lero` holds the site's own logos and favicon (owner, 2026-11-18: "this folder concerns the site, not users"). `deleteAccount` calls it after the auth deletion; the cron calls it for each root UUID folder with no account (within the same caps).
- `src/lib/cloudinaryDelete.ts`: the `pages.content` check reads every page in pages of 500 until a short page (C-05). `src/lib/cloudinaryAdminRead.ts` (new): the paged Admin API reads. `src/tests/fakeCloudinary.ts` (new): the test double.
- `src/lib/account/deleteAccount.ts`: `purgeAccountFolder` added to the import (line 4), step 4 added to the header comment (after line 27), and one step before `return { ok: true, filesNotRemoved }` (line 67), after the file releases, that calls it and counts a purge that did not finish in `filesNotRemoved`.
- Tests: `src/app/api/cron/cloudinary-cleanup/__tests__/route.security.test.ts`, `src/lib/__tests__/cloudinaryPurge.security.test.ts`, `src/lib/cloudinaryDelete.security.test.ts`, `src/lib/account/deleteAccount.security.test.ts`. `vercel.json`: the cron line. The Supabase mocks of two existing tests, which the paged `pages` read (`.order().range()`) breaks: `src/lib/__tests__/cloudinary.security.test.ts` (the `order` mock, 2 lines after line 28) and `src/lib/__tests__/cloudinarySignature.test.ts` (the `order` mock, 1 line after line 16) — added to the Scope after Review 1 by the owner's decision (2026-11-22, translated: "option 1"), because CI of PR #55 failed 16 cases there.
- Source of the code (option A, owner 2026-11-22): commit `9de067faf` on the local branch `task/957-signed-listing-uploads` (Task 957 Revision 3; Reviews 1-4 of Task 957 name no finding against these files). In that commit every change of the ten files above belongs to this task (`git diff --stat main...9de067faf -- <the files>` → 10 files changed, 1067 insertions(+), 6 deletions(-); their hunks and test names carry only O957-4 and C-05), so the executor takes each file whole with `git show 9de067faf:<path>`, tests first (Route). The two mocked tests differ from `main` only by those 3 lines (`git diff --stat main 9de067faf -- <the two>` → 2 files changed, 3 insertions(+)), so they are taken whole too. Nothing else of that commit.
- Dependencies: none. Out of scope: moving stored photos (none is outside its folder); the signed upload (Task 957).
- Kept as on `main` (checklist A2): `deleteAsset` keeps its reference check, fail-closed lookup and `CLOUDINARY_DELETE_MODE`; `deleteAccount` keeps every step it has and adds the purge last.

## Attack surface

Changed: a new cron endpoint and deletion of stored files.
- T7 Tampering / denial of service: the cleanup or the purge deletes a file in use or a living account's folder, or a stranger starts it — mitigate: the cron secret (401), the pattern and 7 days of age, the proven absence of the account before a purge, `deleteAsset`'s reference check failing closed, the folder guard, the per-run caps.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T7 names deleting a used file or a living account's folder and a stranger starting the cron — AC1, AC2, AC3
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new cron endpoint and the deletions — AC2, AC3
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the cron route checks the cron secret on every call and answers 401 without it — AC2
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failing reference or account-existence read deletes nothing — AC1, AC3
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — `deleteAsset`, the one module allowed to delete, checks the references at the deletion itself — AC1, AC2
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the tests call the cron route directly, without and with the secret — AC2
- Authorization_Testing_Automation: not applicable — one caller only: the cron secret, tested in AC2; no role matrix
- Bot_Management_and_Anti-Automation: not applicable — the cron is called by Vercel with a secret, not by people
- Credential_Stuffing_Prevention: not applicable — the task adds no login, password or recovery path
- Cross_Site_Scripting_Prevention: not applicable — the cron answers counts as JSON and renders no markup
- DOM_Clobbering_Prevention: not applicable — no HTML is rendered or sanitized by the cleanup or the purge
- Denial_of_Service: "Using validation that is cheap in resources first" — the secret is checked before any Admin API call; a run reads at most 10 pages, deletes at most 100 files and makes at most 200 calls — AC2
- File_Upload: not applicable — no upload is accepted; the task deletes stored files only
- Input_Validation: not applicable — the cron takes no request input besides its secret header
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object id comes from a request; the ids come from Cloudinary listings
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or eval; the two patterns are fixed and anchored
- Key_Management: not applicable — no key is added; the Cloudinary and cron secrets keep their single uses
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the run line holds counts only; `deleteAsset` logs the asset id, no contact data — AC2
- Logging_Vocabulary: not applicable — the cleanup records maintenance counts, not a security event of the vocabulary
- Mass_Assignment: not applicable — no request body is bound to any object or row
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the cron route is reachable by anyone and checks the secret itself — AC2
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — ESLint with the security rules runs on every changed file in CI — AC4
- Prototype_Pollution_Prevention: not applicable — no request key is copied into any object the code builds
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the cron route decides itself, before any read or deletion — AC2
- Secrets_Management: "prevent them from leaking and compromising the organization" — the Cloudinary and cron secrets stay server-only and no log line prints them — AC2
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — Opus reviews by `secure-code-review.md` — AC4
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC4
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — threat T7 became acceptance criteria — AC1, AC2, AC3
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the cron calls only the configured Cloudinary API and database; no address comes from input — AC2
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the cron trigger requires the secret — AC2
- Subdomain_Takeover_Prevention: not applicable — `vercel.json` gains one cron path; no domain or DNS record changes
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for T7 — AC1, AC2, AC3
- Transaction_Authorization: not applicable — no user transaction is authorized; the cron acts as the system
- User_Privacy_Protection: not applicable — the cleanup deletes files and logs counts; no IP or contact data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC4
- Web_Service_Security: not applicable — the cron route takes no body and therefore no schema
- XSS_Filter_Evasion: not applicable — the task filters no markup; it deletes stored files
## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Deletion sees every CMS page — test: `src/lib/cloudinaryDelete.security.test.ts` (extended: a reference on page 501 of 600 keeps the asset).
- AC2 The cleanup deletes only unused listing and avatar uploads and empty owner folders (O957-4) — test: `src/app/api/cron/cloudinary-cleanup/__tests__/route.security.test.ts` (new): without the secret 401; an unreferenced `<uuid>/listings/` or `<uuid>/avatars/` asset of 8 days is deleted; a referenced one (a listing photo, a current avatar), one of 6 days, `avatars/…`, a root logo, `Lero/…` and `task951-signature-check/…` stay; a failing reference read deletes nothing; the dry-run mode deletes nothing; the caps hold; the run log line holds counts only; an empty `<uuid>/listings/<uuid>` folder is removed before its parent; a root `<uuid>` folder of no account holding only empty `listings` and `avatars` folders is removed whole; a folder with an asset, or with a subfolder outside the pattern (`<uuid>/Brand`), stays; and `src/lib/cloudinaryDelete.security.test.ts` (extended: `deleteEmptyFolder` refuses `avatars`, `companies`, `../x`, `<uuid>/other`).
- AC3 A deleted account's folder goes whole, a used file stays (O957-4) — test: `src/lib/__tests__/cloudinaryPurge.security.test.ts` (new): an account that still exists, or a failing existence read, touches nothing; a deleted account's `listings`, `avatars` and `Brand/Favicon` files and folders go, `<userId>` last; a file `site_settings` references stays with its folders; and `src/lib/account/deleteAccount.security.test.ts` (extended: the purge runs after the auth deletion and never before or on its failure).
- AC4 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. The owner creates the branch `task/1011-cloudinary-keeps-no-unused-upload` from `main` with this kickoff committed on it (checklist H); nothing else is taken onto it, so the executor starts from a clean tree (checklist I1).
2. Tests first (I4): the four test files and `src/tests/fakeCloudinary.ts` from `9de067faf`; run `npm test -- src/app/api/cron/cloudinary-cleanup/__tests__/route.security.test.ts src/lib/__tests__/cloudinaryPurge.security.test.ts src/lib/cloudinaryDelete.security.test.ts src/lib/account/deleteAccount.security.test.ts`; they fail on the unchanged code; keep that output.
3. The change (I5): `route.ts`, `cloudinaryAdminRead.ts`, `cloudinaryDelete.ts`, `deleteAccount.ts` and the `vercel.json` cron line from `9de067faf`.
4. Run: the same `npm test -- …` command; nothing else runs locally. Break (I9), each once, then restore: the cron secret check (`route.security.test.ts` fails), the folder pattern guard of `deleteEmptyFolder` (`cloudinaryDelete.security.test.ts`), the account-absence proof of `purgeAccountFolder` (`cloudinaryPurge.security.test.ts`), the paged `pages` read (`cloudinaryDelete.security.test.ts`). CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
5. Report: each command, exit code, relevant output; the failing run before the change; each break output.

## Revision 1 — Review 2 (2026-11-22): the two mocks the paged `pages` read needs

F1 (Review 2): CI of PR #55 (run 45053076568, job "Unit and component tests") fails 16 cases in `src/lib/__tests__/cloudinary.security.test.ts` and `src/lib/__tests__/cloudinarySignature.test.ts`: their Supabase mock has no `order`, so the paged read (`src/lib/cloudinaryDelete.ts:111`) throws `db.from(...).select(...).order is not a function` and every reference check fails closed.

- Change: take both files whole with `git show 9de067faf:<path>`; that adds only the `order: () => ({ range: … })` mock (2 lines and 1 line). Nothing else.
- Run (I4 before, I8 after): `npm test -- src/lib/__tests__/cloudinary.security.test.ts src/lib/__tests__/cloudinarySignature.test.ts` → before 16 failed, after every case passes; then the Route's four files once more → 66 passed. No break (I9): the change is a test double, no control.
- Report: each command, exit code, the counts before and after.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1011_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_1011_Review_2.md)
- [Review 3 — APPROVED](../../docs/reviews/Task_1011_Review_3.md)
