# Task 957 — Listing photos are uploaded only with a server signature, one photo per signature, into the owner's own folder

Sprint 93. Priority P0. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed"; O957-1 2026-11-18 (option chosen: "957 builds the limiter": the shared sliding limiter moves here
from Task 959, which reuses it); O957-2 2026-11-18 (option chosen: "close completely": a repeated signed request must
not create a second photo); O957-3 2026-11-18 (option chosen: "UUID + metadata + admin": the folder stays the account
UUID, each photo carries the uploader's number and listing in Cloudinary metadata, the admin profile copies the UUID); O957-4 2026-11-18 (the owner: "add automatic cleanup to the existing task": a daily job removes
unreferenced listing and avatar uploads and empty owner folders); O957-5 2026-11-19 (the owner, translated: "this test must
be added to the next task in the list, because there are already 1008 tasks not done, and the list keeps growing": the
synthetic test users and listings a cancelled CI run leaves are removed). Filed by the whole-project audit (`docs/security/audit-2026-11-06/findings.md`: X-01, A-05,
C-05); revised 2026-11-18 by Opus (current rules, the four owner decisions, the database twin of the photo check).
Implementer: Sonnet (product code, tests, SQL files, the synthetic sweep script); Opus (`scripts/quality/cloudinary-config.mjs` U3, the SQL round
trip, the catalog snapshot, the two sweep steps of `.github/workflows/ci.yml`: the executor may not edit `.github/**` or `scripts/quality/**`, `.claude/skills/execute-task/SKILL.md` step 3). Reviewer: Opus. The owner applies the SQL and changes the Cloudinary presets and Vercel.

## Goal

Listing photos go from the browser straight to Cloudinary with an unsigned preset, so anyone who reads the page uploads
any file into any folder of the account, including another person's `<userId>/listings` (X-01); a listing (through the
Server Actions or directly through PostgREST) accepts any photo address of the cloud. After the task: no unsigned preset
exists; the browser still uploads directly to Cloudinary (the body stays off the Vercel function, whose limit is
4.5 MB), but each photo needs a signature the server issues for that session, for one server-chosen `public_id` under
the owner's folder, with `overwrite=false`, so a repeated request stores nothing new; signatures are limited per
account; the database refuses a photo outside its listing owner's folder. A photo is traceable both ways: Cloudinary
shows the uploader's `#public_id` and listing in the asset's metadata, and the admin copies an account's UUID (the folder
name) from its profile and finds an account by a pasted folder name. A daily job deletes listing and avatar uploads no row
uses after 7 days and the owner folders left empty; a deleted account's whole folder goes, except a file a row still uses. The synthetic users and listings
(`zz_synth_…`) of a test run that CI cancelled or killed are removed by the same job, and any older one by the next CI
run (O957-5).

## Cause

Read at `a9915f3ba`
- The widget uploads with an unsigned preset and a browser-chosen folder: `src/modules/listings/components/ImageUpload.tsx:181-190` (`uploadPreset={uploadPreset}`, `folder: uploadFolder`); the preset name is public: `src/app/[locale]/listings/create/page.tsx:22`, `src/app/[locale]/listings/[slug]/edit/page.tsx:103-104`.
  `node scripts/quality/cloudinary-config.mjs` → "U1 the preset named by NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: unsigned: anyone who knows the name uploads any file into the account" (2026-11-18).
- A photo address is checked only for the cloud: `src/lib/uploads/imageUrl.ts:20` (the path starts with `/<cloud>/`); its comment `src/lib/uploads/imageUrl.ts:6` ("Images are uploaded by the server") is false for listing photos.
  A session writes `listing_images.url` directly (`supabase/catalog.json:2535`, INSERT and UPDATE of `url` granted to `authenticated`), and the only check is the cloud prefix (`supabase/catalog.json:3009`, `listing_images_url_prefix_check`).
  Today all 200 `listing_images` rows lie under `/<listing owner>/listings/` (read-only count on the development project, 2026-11-18), so the stricter rule rejects no stored photo.
- No shared limiter exists: the reveal limit counts its own table (`src/modules/listings/actions/contactGateway.ts:39`); the sliding `consume_rate_limit` was planned in Task 959 (`tasks/Sprints/Sprint_93_kickoff_prompt_Task_959_Auth_Abuse_Keys_Data_Exposure.md:53`), not built.
- Cloudinary: "Signatures are valid for one hour from the timestamp value used to generate the signature" (cloudinary.com/documentation/authentication_signatures); whether one signature serves several uploads: the docs do not say (UNKNOWN), hence O957-2.
  "parameters provided directly in the upload request take precedence over the same parameters defined in the upload preset" and "Upload presets don't support a per-preset file size limit" (cloudinary.com/documentation/upload_presets).
  `next-cloudinary` 7.0.0 spreads `options` into the widget options after its own `uploadSignature` (its `dist/CldUploadWidget-*.cjs.js`), so the widget's `prepareUploadParams` reaches Cloudinary.
- A folder name cannot be traced to a person in the admin: the profile shows only `#public_id` (`src/components/admin/AdminUserProfileView.tsx:515-517`), never the UUID; the users search accepts a full UUID (`src/app/admin/users/page.tsx:63-64`) but its hint does not say so (`messages/en.json:921`).
  Cloudinary's `prepareUploadParams` "only supports preparing the following parameters", among them `context`, `overwrite`, `publicId`, `signature`, `tags`, `uploadPreset`, not `allowed_formats` (cloudinary.com/documentation/upload_widget_reference), so the signed preset bounds the formats.
- Nothing removes an upload no row uses, nor an empty folder: `deleteAsset` (`src/lib/cloudinaryDelete.ts:158`) destroys one asset when a caller asks (`/image/destroy`, `src/lib/cloudinaryDelete.ts:127`), and no code calls the folders API.
  A read-only count (Admin API and `listing_images`, 2026-11-18): 216 assets under `<uuid>/listings/`, 16 of them referenced by no `listing_images` row, all older than 24 hours, the oldest of 2026-09-20 (abandoned create forms).
  Until 2026-11-18 production never deleted: an approved probe (the test agent replaced its avatar twice on `https://lero.al/api/upload-avatar`, then restored) logged `[deleteAsset] … outcome: 'DRY_RUN'` (Vercel runtime log, production, 22:29:45 UTC),
  so every removal before (photos, listings, accounts, avatars) left its file: 16 unreferenced files under `<uuid>/listings/`, 1 under `<uuid>/avatars/` (read-only count). Of the 12 root UUID folders 5 belong to no account: 4 hold only an empty `listings` folder, 1 holds that avatar file.
  `deleteAccount` releases only the ids its rows hold (`src/lib/account/deleteAccount.ts:36`, `collectPublicIds` at :73), so a file no row names stays with its folder: one test account's `<uuid>/Brand/Favicon` and `<uuid>/Brand/Logotype` hold 9 files uploaded by hand, and `site_settings` `logo_url`, `logo_dark_url` and `favicon_url` use 2 of them (read-only, 2026-11-18). The owner then set `CLOUDINARY_DELETE_MODE=enabled` (one variable for production and preview)
  and redeployed; the repeated probe logged `outcome: 'DELETED'` (22:36:33 UTC) and the replaced file answers 404. The cleanup removes what the earlier removals left.
  The account uses dynamic folders: a stored listing asset has `public_id` `<uuid>/listings/<name>` and `asset_folder` `<uuid>/listings` (same read).
- Synthetic test data outlives a cancelled run (O957-5): the integration suites and the signed-in walk create users and listings with the run prefix `zz_synth_<time><hex>` (`src/tests/integration/fixtures.ts:32`) and delete them only in-process at the end
  (`src/tests/integration/fixtures.ts:92`, called at `scripts/check-signed-in-pages.mjs:383`); a pull-request run is cancelled when a newer commit arrives (`.github/workflows/ci.yml:21`, `cancel-in-progress`), and GitHub then sends the running step
  "`SIGINT/Ctrl-C`", then "`SIGTERM/Ctrl-Break`", then "kills the process tree" (docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation), so the clean-up never runs; no other code removes an old prefix.
  `gh run view 44417722424 --json jobs` → the walk step started 2026-11-18T23:11:24Z and was `cancelled` at 23:17:04Z, the authz test step (23:08:03Z) likewise; a read-only census of the development project (2026-11-19)
  → `zz_synth_mwmqjll84aaa` (started 23:11:25Z: 4 users including `walk_agent`, 1 listing) and `zz_synth_mwmqqjgb09a7` (23:16:49Z: 3 users) are left. The same GitHub cancellation page: a step with `if: always()` still runs in a cancelled job
  ("the condition `if: always()` would evaluate to true and the job continues to run"), within "the 5 minute cancellation timeout period".
- `src/app/api/upload-cms-image/route.ts:35` trusts the declared `file.type` (A-05); `src/lib/cloudinaryDelete.ts:102` reads only the first 500 CMS pages before calling an asset unreferenced (C-05).
Fix (O957-5): every run writes its prefix to a job file and a final `if: always()` step of each CI job that creates synthetic data removes those prefixes and any prefix older than two hours; the in-process clean-up stays.
Fix: a signature route that issues per-photo signed parameters chosen by the server (owner folder, random `public_id`, `overwrite=false`, preset, uploader metadata) after the session, owner and limit checks; the widget gets them through `prepareUploadParams`; the limiter and a `listing_images` owner-folder trigger in SQL; the owner check in the two Server Actions; the CMS byte sniff; paged CMS reads in deletion; U3 in `cloudinary-config.mjs`; the UUID copy control in the admin profile and the search hint; a daily cleanup cron.

## Scope

- SQL `supabase/sql_migrations/task957/` (`task957.sql`, `task957-rollback.sql`, `task957-preflight.sql`, `task957-verify.sql`), one transaction:
  - table `public.rate_limit_hits (bucket text, subject text, hit_at timestamptz default now())`, index `(bucket, subject, hit_at)`, RLS on, no policy, no grant to `anon` or `authenticated`;
  - `public.consume_rate_limit(bucket text, subject text, window_seconds int, max_hits int) returns boolean`, SECURITY DEFINER, `search_path = ''`, EXECUTE for `service_role` only: refuses `window_seconds` outside 1..604800 and `max_hits` < 1;
    takes `pg_advisory_xact_lock` on the key; deletes this key's hits older than the window and any hit older than 7 days; counts; inserts and returns `true` only below `max_hits` (sliding, atomic, no dynamic SQL);
  - trigger `listing_images_owner_folder` BEFORE INSERT OR UPDATE OF `url, listing_id` on `listing_images`: the `url` path must be `/<cloud>/image/upload/[v<digits>/]<listings.user_id of listing_id>/listings/...`, else 42501;
  - the preflight counts rows the trigger would refuse (0 expected) and refuses to run otherwise.
- `src/app/api/listings/upload-signature/route.ts` (POST, new): `requireViewer()` (401 / 403 as `upload-avatar`); body parsed by a strict zod schema `{ listingId?: uuid }` (any other key refused, 400).
  With `listingId`, the listing's `user_id` is read with the service client and the caller must own it or hold `listings.moderate` (`roleHasPermission`, as `src/modules/listings/actions/updateListing.ts:93`), else 403; without it the folder is the caller's.
  Then `consume_rate_limit('listing-upload-10m', <caller id>, 600, 30)` and `('listing-upload-day', <caller id>, 86400, 200)` (Opus proposal; 20 photos per listing) → 429 on `false`, 503 on an RPC error (fail closed).
  Answers per call one photo's parameters, signed with `CLOUDINARY_API_SECRET` by Cloudinary's rules: `folder` `<ownerId>/listings[/<listingId>]` with `public_id` `<crypto.randomUUID()>` (stored as `<folder>/<uuid>` with that `asset_folder`, as today's assets; AC8 checks it live), `overwrite=false`, `upload_preset` from the server-only `CLOUDINARY_LISTING_PRESET`,
  `tags=user-<owner public_id>` and `context=user=<owner public_id>[|listing=<listingId>]` (the listing part only when a `listingId` was sent; O957-3; the number read from `users.public_id`; no name, e-mail or phone), `timestamp` of the server, and every parameter the widget adds itself
  (the upload widget guide: "Generate the signature string from all parameters used, including `source=uw`"); AC8 proves the exact set live.
- `ImageUpload.tsx`: `options.prepareUploadParams` calls the route once per photo; no `uploadPreset`, no `folder`; props `uploadPreset` and `uploadFolder` become `listingId?: string` through `ListingFormLoader.tsx`, `ListingFormShell.tsx`,
  `ListingFormShellView.tsx` (and its Story) and the two pages; `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` leaves the pages and `docs/env.md` (which lists `CLOUDINARY_LISTING_PRESET`).
- Legacy leaves with this change (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`; it takes over Task 906 and the shell part of
  Task 907, `tasks/Sprints/Sprint_86_Listing_Form_On_Canonical_Mantine.md`): `ImageUpload.tsx` (Tailwind classes from `:94`: the photo
  grid, its order, cover and delete controls, the empty state) on Mantine (`SimpleGrid`, `ActionIcon`, `MantineBadge`,
  `AppImage` `upload`); `ListingFormShellView.tsx` (`@/components/ui` button, input, label, textarea and dialog at `:5-11`, and
  its Tailwind classes) on `MantineFormSectionStack`, `TextInput`, `Textarea` (`MantineTextarea` once Task 1008 merged),
  `MantineModal` and `Button`; `ListingFormShell.tsx` (`:275`) and the pages `src/app/[locale]/listings/create/page.tsx:28` and
  `src/app/[locale]/listings/[slug]/edit/page.tsx:150` (a Tailwind page frame) on Mantine. `steps/StepPhotos.tsx` is
  imported by no file (`grep -rn "steps/Step" src` → nothing) and is deleted instead of changed. The three components
  join `scripts/mantine-migration-scope.json`; `DynamicFieldSection` (Task 905) and `AdminEditLayout` (Task 907) stay
  legacy children, allowlisted in `scripts/rendered-scope-allowlist.json` with those owners. The legacy Story
  `Listings/ListingFormShellView` (`src/modules/listings/components/ListingFormShellView.stories.tsx`) gives way to
  `Patterns/Mantine/ListingFormShellView` and `Patterns/Mantine/ImageUpload`.
- `src/lib/uploads/imageUrl.ts`: `isOwnedListingImageUrl(url, ownerId)` (trusted, path as the trigger's, no `..` segment, no query or fragment); `isValidImagePayload` takes the owner id; `createListing.ts:57` and `updateListing.ts:99` pass the listing owner's id (also when staff edit); the false comment corrected.
- Admin (O957-3): `AdminUserProfileView.tsx` renders the `#public_id` line with the canonical `MantineCopyIdButton` (label `#<public_id>`, copies `user.id`; accessible names from new `admin.user_profile` keys in all four locales), as `AdminListingsView.tsx:124-129` does;
  the users search hint (`search_placeholder`, `messages/*.json:921`) names the account ID in all four locales; the Story `Patterns/Mantine/AdminUserProfileView` passes `public_id` and `id`.
- `src/app/api/upload-cms-image/route.ts`: `declaredTypeMatchesBytes` after reading the bytes, as `upload-avatar`. `src/lib/cloudinaryDelete.ts`: the `pages.content` check reads every page in pages of 500 until a short page.
- Opus: `scripts/quality/cloudinary-config.mjs` U3 (the preset named by `CLOUDINARY_LISTING_PRESET` is signed and has `allowed_formats` limited to jpg, jpeg, png, webp and an incoming transformation that bounds the stored size) and U4 (every Cloudinary address in `users`, `companies`, `listing_images`, `pages` and `site_settings` names an asset that exists: on 2026-11-18 a console folder deletion left account #3's `avatar_url` pointing at a deleted file, and nothing reported it), with its self-test.
- Cleanup (O957-4): `src/app/api/cron/cloudinary-cleanup/route.ts` (GET, `verifyCronRequest`; daily `15 3 * * *` in `vercel.json`). It pages the Admin API image list (at most 10 pages of 500 per run), keeps only `public_id` matching
  `^<uuid>/(listings/(<uuid>/)?|avatars/)[^/]+$` created more than 7 days ago (Opus proposal: a create form left open for days still saves), and calls `deleteAsset(id, { reason: 'upload_unreferenced' })` for at most 100 per run; `deleteAsset`'s reference check over every table,
  its fail-closed lookup and its `CLOUDINARY_DELETE_MODE` decide. Then `deleteEmptyFolder(path)`, new in `src/lib/cloudinaryDelete.ts` (the one module allowed to delete), walks every root folder named by a UUID and its `listings`, `listings/<uuid>` and `avatars` subfolders, and removes deepest first each one matching
  `^<uuid>(/listings(/<uuid>)?|/avatars)?$` that holds no asset and no subfolder, whether or not its account exists (`DELETE /folders/<path>`, same mode switch; any other path refused, so `<uuid>/Brand/…` and its parent stay); at most 200 Admin API calls per run (the Free plan allows 500 per hour). The answer and one log line carry the counts (scanned, deleted, kept, folders removed, dry run).
- Account folders (O957-4, owner 2026-11-18: deleting a user should remove "the user's main folder and all files and folders in it"): `purgeAccountFolder(userId)` in `src/lib/cloudinaryDelete.ts` first proves the account is gone (`auth.admin.getUserById` answers not found;
  any other answer or error: nothing is touched), then walks every folder under `<userId>` (any name, `Brand` included), passes every asset of each `asset_folder` (paged) to `deleteAsset(id, { reason: 'account_folder' })`, and removes the emptied folders deepest first, `<userId>` last;
  a file a row still uses (the site logo above) is kept with its folders. A root folder not named by a UUID is never touched: `Lero` holds the site's own logos and favicon (owner, 2026-11-18: "this folder concerns the site, not users"). `deleteAccount` calls it after the auth deletion; the cron calls it for each root UUID folder with no account (within the same caps).
- Synthetic leftovers (O957-5): `src/tests/integration/fixtures.ts`: the delete-and-verify body of `cleanup()` becomes the exported `removeRun(admin, run)` (same order, same verification), and `createRun()` appends its prefix (the prefix only) to the file named by `SYNTHETIC_RUN_LOG` when set.
  `scripts/sweep-synthetic.mjs` (new, Sonnet): starts only through `loadIntegrationEnv()` (development target and project ref, `src/tests/integration/environment.ts:49-52`); collects the prefixes listed in `SYNTHETIC_RUN_LOG` and every prefix of the exact shape
  `zz_synth_<8 base-36 time><4 hex>` found in auth e-mails and listing slugs whose time is more than two hours old (a job lasts at most 30 minutes); calls `removeRun` for each; prints counts and prefixes only; exits 1 when a read fails or anything remains; `--dry-run` only reads and lists.
  `.github/workflows/ci.yml` (Opus, on the same branch after Sonnet's report): the `authz` and `click-shield` jobs set `SYNTHETIC_RUN_LOG: ${{ runner.temp }}/synthetic-runs.txt` and end with the step "Synthetic test data of this job is removed" (`if: always()`, the three Supabase secrets on that step only, `node scripts/sweep-synthetic.mjs`); `package.json` (Sonnet): `sweep:synthetic`.
- Dependencies: none. Out of scope: moving stored photos (none is outside its folder); a malware scan (Cloudinary re-encodes on delivery); the limiter call sites of Task 959 (contact form, reveal, inquiry, view counter, saved searches).

## Attack surface

Changed: a new authenticated endpoint, the photo upload path, the photo acceptance of listing writes (application and database), a new SECURITY DEFINER function.
- T1 Spoofing / elevation: a stranger or another account uploads into a person's folder — mitigate: only an active session gets a signature; the folder and `public_id` are the server's; a signed request cannot change them.
- T2 Denial of service (cost): unlimited uploads — mitigate: 30 signatures per 10 minutes and 200 per day per account; one signature stores at most one photo (`overwrite=false` on a fixed `public_id`, O957-2); the signed preset bounds the formats; the preset's incoming transformation bounds the stored size; a signature expires after one hour.
- T3 Tampering: a listing carries another account's photo — mitigate: `isOwnedListingImageUrl` in both actions and the trigger for direct PostgREST writes.
- T4 Tampering: a CMS upload whose bytes are not the declared type — mitigate: the byte sniff.
- T5 Elevation through the new definer function — eliminate: EXECUTE for `service_role` only, `search_path` empty.
- T7 Tampering / denial of service: the cleanup or the purge deletes a file in use or a living account's folder, or a stranger starts it — mitigate: the cron secret (401), the pattern and 7 days of age, the proven absence of the account before a purge, `deleteAsset`'s reference check failing closed, the folder guard, the per-run caps.
- T8 Tampering: the synthetic sweep deletes a real person or listing, or runs against another project — mitigate: only the exact `zz_synth_` prefix shape (an e-mail or slug without it is never read for deletion), the escaped LIKE of `removeRun`, the development-target guard before any read, the two-hour age for a prefix this job did not log.
- T6 Information disclosure: uploader metadata reaches Cloudinary — eliminate: only the pseudonymous `#public_id` and the listing id, never a name, e-mail or phone; the folder stays the opaque UUID.

Authorization matrix, `upload-signature`: anonymous 401; blocked account 403; active user, no listing (own folder) 200; active user, own listing 200; active user, another person's listing 403; moderator with `listings.moderate`, any listing 200 (owner's folder);
moderator without it 403; admin 200. `listing_images` direct write: owner, own folder allowed; owner, another folder 42501.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (c12dd22e17ce, 2026-11-18).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T5 name uploads into a foreign folder, cost abuse by repeats, a foreign photo in a listing — AC1, AC2, AC3, AC8.
- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new endpoint, function and trigger — AC1, AC2, AC4.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the route checks the session and the listing owner or `listings.moderate` on every call — AC1.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the actions and the database trigger both refuse a foreign photo — AC3, AC4.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a limiter or permission read error answers 503 / 403 and signs nothing; a failing account-existence read purges nothing — AC2, AC14.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the route checks the listing it signs for; the trigger sits on `listing_images` — AC1, AC4.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the tests call the route, the actions and PostgREST directly, without the widget — AC1, AC3, AC4.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — every matrix row is a test case, the database rows on the real project — AC1, AC4.
- Bot_Management_and_Anti-Automation: "Avoid fixed-window counters: they allow bursts at boundary times." — `consume_rate_limit` slides; the boundary burst test passes only 5 of 10 — AC2.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the workflow change reaches main only through the pull request with CI Required green, merged by the owner — AC11, AC16.
- Credential_Stuffing_Prevention: not applicable — the task adds no login, password or recovery path.
- Cross_Site_Scripting_Prevention: not applicable — the widget change renders no new user-controlled text or markup.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the `public_id` part comes from `crypto.randomUUID()` — AC1.
- Dependency_Graph_SBOM: not applicable — `package.json` gains one script line; no dependency enters the SBOM.
- DOM_Clobbering_Prevention: not applicable — the CMS route change checks file bytes and renders no HTML.
- DOM_based_XSS_Prevention: not applicable — the widget receives server parameters; no DOM sink is added or changed.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the table has no session grant; the function is executable by `service_role` only — AC2, AC9.
- Denial_of_Service: "Using validation that is cheap in resources first" — the route checks the session and the body before any database call and the limit before signing — AC1, AC2.
- File_Upload: "List allowed extensions. Only allow safe and critical extensions for business functionality" — the signed preset allows jpg, jpeg, png and webp only, and U3 checks it — AC8, AC10.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the CMS route compares the declared type with the bytes — AC6.
- GitHub_Actions_Security: "Pass secrets at the step level, not the job level." — the sweep step binds the three Supabase secrets to itself; the job keeps `contents: read` and full-SHA pins — AC16.
- GraphQL: "Ensure that the API has proper access control checks." — the new table and function have no `anon` or `authenticated` grant, so no Supabase API exposes them — AC2.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the service-role read runs only after the caller's check, and the trigger checks every write again — AC1, AC4.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — the route calls the RPC with named arguments — AC2.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a strict schema answers 400 to any key but `listingId` — AC1.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — a `listingId` is signed for only after the owner check — AC1, AC3.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — the signed parameters are built from server values; no request key is merged — AC1.
- Key_Management: "a single key should be used for only one purpose" — `CLOUDINARY_API_SECRET` signs Cloudinary requests only; the preset name is a separate, non-secret variable — AC1.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the cleanup's run line holds counts only; `deleteAsset` logs the asset id, no contact data — AC13.
- Logging_Vocabulary: not applicable — the cleanup records maintenance counts, not a security event of the vocabulary.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the body schema is an allow-list of one key — AC1.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: "Authorize the exact tenant, object, and operation before you upload or download an object, delete it, or generate a signed URL." — the route authorizes the owner folder and listing before it signs one upload — AC1, AC4.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the route and both Server Actions check the caller and the photo owner themselves — AC1, AC3.
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — ESLint with the security rules runs on every changed file — AC11.
- NPM_Security: not applicable — `package.json` gains the `sweep:synthetic` script only; no package is installed or changed.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — U3 reads the Admin API over HTTPS and starts no process — AC10.
- Prototype_Pollution_Prevention: not applicable — the route copies no request key into any object it builds.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — the function has no dynamic SQL; its arguments are bound — AC2.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the route decides itself, not the page that shows the widget — AC1.
- Software_Supply_Chain_Security: not applicable — no dependency or action is added; the sweep reuses installed tools.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — RPC named arguments and a static function body — AC2.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the secret stays server-only; no public variable names a preset — AC5, AC11.
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — Opus reviews by `secure-code-review.md` — AC11.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; `next-cloudinary` is already installed — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat T1-T5 became an acceptance criterion — AC1-AC8.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the paged deletion reads only the configured database; no URL comes from input — AC7.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the new function checks the session and the owner — AC1.
- Subdomain_Takeover_Prevention: not applicable — `vercel.json` gains one cron path; no domain, DNS record or CNAME changes.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for T1-T5 — AC1-AC8.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — the limiter keys on the account id; no IP is stored or logged; the Cloudinary metadata holds no contact data; a deleted account's files leave Cloudinary — AC1, AC14.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the report — AC11.
- Vulnerable_Dependency_Management: not applicable — no dependency is added or changed; `package.json` gains one script.
- Web_Frontend_Security: not applicable — the widget change adds no `innerHTML` or other markup sink.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the strict zod body schema — AC1.
- XSS_Filter_Evasion: not applicable — the CMS route change checks file bytes and filters no markup.

## UI

The listing form and the photo widget keep their layout, fields and order, rebuilt on canonical Mantine (REUSE
`MantineFormSectionStack`, `MantineModal`, `AppImage` `upload`, `MantineBadge`; inherited canonical design — owner decision
2026-10-20). The admin profile's `#public_id` line becomes the canonical `MantineCopyIdButton` (owner `src/design-system/mantine/patterns/MantineCopyIdButton.tsx`, with its own direct Story); no new token or style; the users search hint text changes.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminUserProfileView.tsx — the identity block of /admin/users/[id]; src/modules/listings/components/ListingFormShellView.tsx — the listing form; src/modules/listings/components/ImageUpload.tsx — the photo grid and its controls
- Component families: inline-status-and-utility-control, form-picker-and-choice, media-gallery-and-listing-contact
- Pattern IDs: inline-control, form-stack, grid-media-reflow
- Standards: w3c-target-size, apple-hig-menus, android-layout-navigation, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, android-common-layouts, android-adapt-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineCopyIdButton.tsx, src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the control keeps the 44px target its owner sets; 640px transition to the owner's desktop size; the listing form one column with full-width fields and the photo grid in two columns, as today; 640px transition to today's desktop layout
- Mobile order: name → badges → e-mail → `#public_id` copy control; form — today's section order; photo — image → number and cover mark → order and delete controls
- Required-content treatment: no semantic loss: the number stays visible and the copy action reachable; nothing clamps
- Story and verification: Patterns/Mantine/AdminUserProfileView at 320px and on both sides of the 640px transition × sq, en, uk, it; Patterns/Mantine/ListingFormShellView and Patterns/Mantine/ImageUpload at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 The signature route follows the matrix and signs only the server's parameters — test: `src/app/api/listings/upload-signature/__tests__/route.security.test.ts` (new): every matrix row; a body with `folder`, `public_id`, `overwrite`, `type` or any unknown key answers 400;
  the answer's `public_id` lies under the owner's folder with a fresh random part on each call, `overwrite` is false, the signature verifies with the test secret, `tags` and `context` carry the owner's `public_id` and the listing and no name, e-mail or phone, the limiter subject is the caller's id (SEC-…-ALLOW / -DENY per `security-testing.md`).
- AC2 The limits hold and fail closed — test: the same file (the 31st call in 10 minutes and a failing RPC answer 429 and 503, and sign nothing) and `src/tests/integration/rateLimit.integration.test.ts` (new, real database: 20 parallel calls with `max_hits` 5 give exactly 5 `true`;
  5 hits at a window's end and 5 at the next start give 5 `true`; `anon` and `authenticated` cannot execute the function or read the table).
- AC3 A listing accepts only its owner's photos — test: `src/lib/uploads/__tests__/imageUrl.security.test.ts` (extended: another account's folder, the cloud root, `<ownerId>x/listings`, `..` segments, a query string refused; `/<v>/<ownerId>/listings/<listingId>/<id>` accepted)
  and `src/modules/listings/actions/updateListing.integration.test.ts` (extended: a photo of another account's folder answers `invalid_image`, also for a staff edit).
- AC4 The database refuses a photo outside the owner's folder — test: `src/tests/integration/listingImageOwner.integration.test.ts` (new, real database: a session's direct insert and update of `url` into another folder fail with 42501; its own folder succeeds).
- AC5 The widget asks the route for each photo and no public preset remains — test: `src/modules/listings/components/__tests__/ImageUpload.test.tsx` (extended: `prepareUploadParams` posts `{ listingId }` and hands the answer on; no `uploadPreset` or `folder` reaches the widget)
  and `src/__tests__/security/clientSinks.test.ts` (extended: a product file naming `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` fails).
- AC6 The CMS route sniffs bytes — test: `src/app/api/upload-cms-image/__tests__/route.test.ts` (extended: a PNG declared `image/jpeg` and text declared `image/png` answer 400).
- AC7 Deletion sees every CMS page — test: `src/lib/cloudinaryDelete.security.test.ts` (extended: a reference on page 501 of 600 keeps the asset).
- AC8 A repeated signed request stores nothing new (O957-2) — test: `src/tests/integration/cloudinarySignedUpload.integration.test.ts` (new; live Cloudinary, skipped without `CLOUDINARY_API_SECRET`, run by the reviewer with `.env.local` after the owner's preset step):
  one 1×1 PNG uploaded with a route answer, the same request sent again returns the same `asset_id` and `version`, a 1×1 GIF signed the same way is refused by the preset, and the asset is deleted.
- AC9 The SQL is proven and the catalog stays clean — test: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task957/task957.sql supabase/sql_migrations/task957/task957-rollback.sql` exits 0 (Opus);
  after the owner's apply, db-catalog-audit reports none of its invariants (`node scripts/quality/db-catalog-audit.mjs`: no I1, no I3) and `supabase/catalog.json` is refreshed (Opus).
- AC10 The live account has no unsigned preset and the listing preset is bounded — test: `node scripts/quality/cloudinary-config.mjs` exits 0 after the owner's console step (Opus) and `scripts/quality/cloudinary-config.test.mjs` (extended: U3 and U4 cases, Opus).
- AC11 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.
- AC13 The cleanup deletes only unused listing and avatar uploads and empty owner folders (O957-4) — test: `src/app/api/cron/cloudinary-cleanup/__tests__/route.security.test.ts` (new): without the secret 401; an unreferenced `<uuid>/listings/` or `<uuid>/avatars/` asset of 8 days is deleted;
  a referenced one (a listing photo, a current avatar), one of 6 days, `avatars/…`, a root logo, `Lero/…` and `task951-signature-check/…` stay; a failing reference read deletes nothing; the dry-run mode deletes nothing; the caps hold; the run log line holds counts only; an empty `<uuid>/listings/<uuid>` folder is removed before its parent; a root `<uuid>` folder of no account holding only empty `listings` and `avatars` folders is removed whole; a folder with an asset, or with a subfolder outside the pattern (`<uuid>/Brand`), stays;
  and `src/lib/cloudinaryDelete.security.test.ts` (extended: `deleteEmptyFolder` refuses `avatars`, `companies`, `../x`, `<uuid>/other`).
- AC14 A deleted account's folder goes whole, a used file stays (O957-4) — test: `src/lib/__tests__/cloudinaryPurge.security.test.ts` (new): an account that still exists, or a failing existence read, touches nothing; a deleted account's `listings`, `avatars` and `Brand/Favicon` files and folders go, `<userId>` last;
  a file `site_settings` references stays with its folders; and `src/lib/account/deleteAccount.security.test.ts` (extended: the purge runs after the auth deletion and never before or on its failure).
- AC12 The admin copies the account UUID and the hint names it (O957-3) — test: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (extended: the `#public_id` control writes `user.id` to the clipboard)
  and `node scripts/check-i18n-parity.mjs` with `node scripts/quality/locale-safety.mjs` (the new keys and hint in all four locales).

- AC15 The listing form and the photo widget are on Mantine (owner rule 2026-11-19) — test: `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass with `ImageUpload.tsx`, `ListingFormShell.tsx` and `ListingFormShellView.tsx` enrolled in `scripts/mantine-migration-scope.json` and no baseline entry for them; `src/modules/listings/components/__tests__/listingFormMantine.test.ts` (new): those three files and the two pages import nothing from `@/components/ui` and have no `className`; the census of `.claude/rules/shared/rendered-state-census.md` for the two new Stories; the existing listing-form tests pass.

- AC16 A cancelled run's synthetic data is removed and nothing else (O957-5) — test: `scripts/__tests__/sweep-synthetic.test.ts` (new, Sonnet): a logged prefix is removed at any age; an unlogged one older than two hours is removed, a younger one stays; `walk_agent@example.com`, `zz_synthx…` and a real e-mail are never touched;
  a failing read deletes nothing and exits 1; a non-development target is refused before any read; `--dry-run` deletes nothing; every `.github/workflows/ci.yml` job (the test reads the file; Opus adds the steps) that receives `SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY` and runs `test:security-integration` or `check-signed-in-pages` sets `SYNTHETIC_RUN_LOG` and ends with the sweep step under `if: always()`;
  the existing integration suites pass on `removeRun`; after the PR's CI, `npm run -s sweep:synthetic -- --dry-run` (Opus, read-only) lists no prefix older than two hours.

## Route

1. Branch from `main`. `node scripts/quality/cloudinary-config.mjs`: keep the output (U1 expected). Read cloudinary.com/documentation/upload_widget_reference (`prepareUploadParams`) and cite the parameters it signs.
2. Tests first (AC1-AC7, AC12-AC16; AC8 written, run later); save each failing output.
3. The SQL files (handed to Opus for AC9; the owner applies before the merge), the route, the widget and its prop chain, the ownership check, the admin copy control and hint, the Mantine form and widget with their Stories, the synthetic sweep script, the cleanup cron and the account-folder purge, the CMS sniff, the paged reads. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; one deliberate break per security test (the owner check, the trigger, the limit, the `overwrite` flag, the cleanup age and pattern), restored.
5. Report: each command, exit code, relevant output (the AC16 workflow case stays red until Opus adds the two CI steps; reported as such); the owner's steps, in order: apply the SQL; create the signed preset (allowed formats jpg, jpeg, png, webp; incoming transformation) and set `CLOUDINARY_LISTING_PRESET` in Vercel before the merge;
   after the deploy delete the unsigned preset and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`; if the owner wants, delete `main-sample` (Cloudinary's sample created with the account 2026-10-21,
   referenced nowhere in the repository; the owner deleted the empty `task951-signature-check` and the legacy root `avatars` and `companies` folders on 2026-11-18). Then Opus runs AC8-AC10 and the read-only sweep of AC16.

## Review
