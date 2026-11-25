# Task 1038 — Listing photos are optimised in the browser and stored in Cloudflare R2

Sprint 94. Priority P2. Owner request 2026-11-25 (translated): "implement client-side image compression before uploading property photographs to
Cloudflare R2 ... optimisation entirely in the user's browser ... no TinyPNG, Cloudinary transformations, Cloudflare Images or other paid image
processing ... no compression inside Vercel Functions ... upload optimised images directly to R2 using presigned PUT URLs ... preserve the existing
image upload interface and listing creation workflow". Owner decisions 2026-11-25: O1038-1 photos are served from `https://media.lero.al` (the
owner moved the DNS of `lero.al` to Cloudflare; "they are replaced, it only takes a couple of hours to update"); O1038-2 the browser makes two
versions of each photo (1920 px and a small one for cards); O1038-3 everything moves to R2, system images into `Lero/` (Tasks 1040-1043); O1038-4
HEIC through `heic-to` (Task 1039); O1038-5 (2026-11-25) the cache policy `Cache-Control: public, max-age=3600, s-maxage=31536000`, purge
through the Cloudflare API after the R2 delete, never "Purge Everything", retried and never reported as done when it failed, every cached variant
cleared, secrets `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_CACHE_PURGE_TOKEN` server-only, no paid service. Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

A listing photo goes today as the original file (up to 10 MB) to Cloudinary, and the server stores any address in the owner's folder without
looking at the file. After the task the browser turns each photo into a 1920 px and a 640 px WebP (JPEG where the browser cannot encode WebP),
each at most 800 KB, without metadata; it puts both into R2 through presigned PUT addresses that only the server issues, after the session, the
listing's owner and the limits are checked; the server reads both objects back before it attaches them to the listing; cards use the small
version; deleting a listing or a photo deletes both objects. Photos already stored on Cloudinary keep working until Task 1043 moves them.

## Cause

Read at `f36b68bad`
- The form uploads the original through the Cloudinary widget: `src/modules/listings/components/ImageUpload.tsx:296-311` (`CldUploadWidget`,
  `maxFileSize: 10_000_000`, `clientAllowedFormats` jpg/jpeg/png/webp: browser-only limits); the signing route sets no size or format
  (`src/app/api/listings/upload-signature/route.ts:101-116`). No code resizes or compresses a photo (`grep -rn "imageCompression\|toBlob" src/modules/listings` → nothing).
- The server stores the address without reading the file: `createListing.ts:54-94` and `updateListing.ts:111`, `:170-176` only parse the URL
  (`src/lib/uploads/imageUrl.ts:30-42`, Cloudinary host only, `:20`); the database pins Cloudinary (`listing_images_url_prefix_check`,
  `supabase/catalog.json:3025`; trigger `listing_images_owner_folder`, `supabase/sql_migrations/task957/task957.sql:72`).
- Smaller copies exist only as Cloudinary transformations: `src/design-system/media/appImageConfig.ts:268-284` (`insertTransform`,
  `buildSrcset` return the address unchanged / empty for any other host); `src/lib/imageDelivery.ts:12-49` repeats it for the preload.
- Deletion is Cloudinary-only: `deleteListing.ts:67-78`, `updateListing.ts:190-206`, the staff delete `src/modules/admin/actions/index.ts:143-167`
  and `src/lib/account/deleteAccount.ts:119` call `deleteAsset(publicIdFromUrl(url))` (`src/lib/cloudinaryDelete.ts:174-213`, reference check
  `:75-121`, dry run unless `CLOUDINARY_DELETE_MODE=enabled`, `:178`).
- No R2 code exists: `grep -rnE "R2_|S3Client|aws4fetch|presign" src` → nothing; `.env.local` holds `R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`,
  `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, `R2_SECRET_ACCESS_KEY` (names only).
- Cloudflare (read 2026-11-25): presigned URLs support GET, HEAD, PUT, DELETE, expire in "1 second to 7 days", "cannot be used with custom
  domains"; a signed `Content-Type` must match or "uploads will fail with a `403/SignatureDoesNotMatch` error"; a browser PUT needs a bucket CORS
  rule (`PUT`, header `Content-Type`); `r2.dev` "should only be used for development purposes"; egress is free.
- The CDN keeps a deleted photo: `curl -sI https://media.lero.al/<object>` (owner, 2026-11-25) → `cf-cache-status: HIT`, `max-age=14400`.
  Cloudflare (read 2026-11-25): the default cache key holds the full URL with its query string and "The Origin header is always included unless
  explicitly excluded"; the Browser Cache TTL default is "4 hours" and overrides an origin `max-age` that "is less than the Browser Cache TTL";
  404 is cached "3m"; `POST /zones/{zone_id}/purge_cache` takes `files` or `prefixes`; Free: "Max operations per request | 100", single files
  800 URLs per second, prefixes "5 requests per minute". The purge token answers `GET /accounts/<id>/tokens/verify` → 200, `status: active`.

Fix: a browser pipeline (resize, encode, two versions, a Web Worker, two photos at a time, progress and retries) feeding a new route that issues
two presigned PUT addresses per photo under `<owner>/listings/<uuid>/`; create and update verify both objects before writing rows; the URL rule,
the CHECK and the trigger accept that form on `https://media.lero.al`; `AppImage` picks the small or the large object; the delete paths delete both, then purge the photo's folder from the CDN.

## Scope

- `src/lib/media/r2.ts` (new, `import 'server-only'`): an `aws4fetch` client from the `R2_*` variables; `presignPut(key, contentType, contentLength)`
  (300 s; `Content-Type`, `Content-Length` and `Cache-Control: public, max-age=3600, s-maxage=31536000` signed, the browser sends all
  three), `headObject(key)`, `readHead(key, 16)` (ranged GET), `deleteObjects(keys)`,
  `publicUrl(key)`, `keyFromPublicUrl(url)` (only `R2_PUBLIC_URL` host, no `..`, query, fragment or encoded separator).
- `src/lib/media/listingPhoto.ts` (new): the key rule `<owner>/listings/<uuid>/{full,thumb}.{webp,jpg}`; `verifyListingPhoto(url, ownerId)`
  (both objects exist, `Content-Length` ≤ 819 200, `Content-Type` image/webp or image/jpeg equal to the extension, the first bytes match through
  `src/lib/uploads/imageSniff.ts` `declaredTypeMatchesBytes`); `deleteListingPhoto(url, reason)`: an R2 address → the reference check of
  `cloudinaryDelete.ts` (exported, run on the key), the same dry-run gate, then both objects, then their purge; a Cloudinary address →
  `deleteAsset` as today. `deleteListingPhotos(urls, reason)` does the same for a whole listing with one purge call.
- `src/lib/media/cdnPurge.ts` (new, `import 'server-only'`): `purgePhotoFolders(prefixes)` → `POST /zones/{CLOUDFLARE_ZONE_ID}/purge_cache`
  `{ prefixes: ['media.lero.al/<owner>/listings/<uuid>/', ...] }` (no scheme, query or fragment; a photo's folder holds only `full` and `thumb`;
  INFERENCE: a prefix purge clears every query and `Origin` variant under it, proven live by AC13), at most 100 per request; a 429, a 5xx or a network failure is retried twice after `Retry-After`
  or 1 s / 4 s; the outcome (`purged` or `purge_failed` with the prefixes and Cloudflare's error codes) is returned and logged, never `purged`
  after a failure; the token never reaches a log line or an answer; never `purge_everything`.
- `src/app/api/listings/upload-url/route.ts` (new): POST `{ listingId?, type: 'image/webp'|'image/jpeg', fullBytes, thumbBytes }`, strict schema;
  the order and checks of `upload-signature/route.ts:34-92` (session, body, listing owner or `listings.moderate`, the two limits on the same
  buckets); each size 1..819 200; answers `{ fullUrl, thumbUrl, publicUrl }` with `Cache-Control: no-store` and nothing else.
- `src/modules/listings/lib/photoPipeline.ts` (new, client): `browser-image-compression` with `useWebWorker: true`, `maxWidthOrHeight` 1920 and
  640 (never upscaled: a smaller side keeps its size), `initialQuality: 0.85`, `fileType: 'image/webp'` with JPEG when the result is not WebP,
  `maxSizeMB` 0.5 for the large version, failure above 800 KB, `preserveExif: false`; orientation applied; accepted inputs jpeg, png, webp.
- `src/modules/listings/lib/uploadQueue.ts` (new, client): at most two photos processed at once; per photo: processing, uploading (XHR upload
  progress), done, failed with its `UploadFailure`; a network or 5xx PUT is retried twice, an expired address (403) asks the route again once.
- `src/modules/listings/components/ImageUpload.tsx`: a file input (`accept` jpeg, png, webp; several files; the 20-photo limit) replaces
  `CldUploadWidget`; each pending photo is a tile with `MantineProgress` and its state; a failed tile offers retry and remove. The `cloudinary`
  prop is no longer read (its chain leaves with Task 1043).
- `src/modules/listings/lib/uploadFailure.ts`: the codes of the new route and `processing` (the browser cannot read the file).
- `src/lib/uploads/imageUrl.ts` `isOwnedListingImageUrl` / `isTrustedImageUrl`: also the `https://media.lero.al/<owner>/listings/<uuid>/full.{webp,jpg}` form.
- `src/modules/listings/actions/createListing.ts`, `updateListing.ts`: `verifyListingPhoto` for every R2 photo not already on the listing,
  before any row is written (`images_invalid`); `updateListing.ts:190-206`, `deleteListing.ts:67-78`, `admin/actions/index.ts:143-167`,
  `deleteAccount.ts:119`: `deleteListingPhoto` instead of `deleteAsset(publicIdFromUrl(...))`.
- `src/design-system/media/appImageConfig.ts`, `src/lib/imageDelivery.ts`: an R2 listing photo renders `thumb` for `listing`, `listing-thumb`,
  `gallery-strip`, `upload`, and `srcset` `thumb 640w, full 1920w` elsewhere; the LQIP is the static blur (`:307-313`); Cloudinary unchanged.
- `supabase/sql_migrations/task1038/` (`task1038-preflight.sql`, `task1038.sql`, `task1038-verify.sql`, `task1038-rollback.sql`; the owner
  applies): the CHECK also accepts `https://media.lero.al/`; the trigger also accepts `^https://media\.lero\.al/<owner>/listings/<uuid>/full\.(webp|jpg)$`.
- `messages/{sq,en,uk,it}.json` `listing`: the progress, retry and failure texts.
- Dependencies: `browser-image-compression@2.0.2` (`npm view`: first release 2017-07-22, version 2023-03-06, no install script, one dependency
  `uzip@0.20201231.0`, 2022-05-23; 0 GitHub advisories); `aws4fetch@1.0.20` (first 2018-12-20, version 2024-08-28, no install script, no
  dependency; 0 advisories).
- Out of scope: HEIC (Task 1039); avatars (1040); system images into `Lero/` (1041); the account-folder purge and orphan cleanup on R2 (1042);
  moving the stored Cloudinary photos, retiring the widget configuration, the signing route and `next-cloudinary` (1043); the CSP (no `img-src`
  or `connect-src` today, `src/lib/security/headers.ts:10-13`).
- Kept as on `main` (checklist A2): the photo grid, two/three/four columns, the number and cover marks, set-cover, delete, up and down, their
  labels and positions (`ImageUpload.tsx:238-282`); at most 20 photos; the first photo is the cover; disabled while saving; the edit form deletes
  removed photos only when saved; a failed row write restores the old rows and deletes nothing (`updateListing.ts:178-187`); the reference
  check and the dry-run gate before any delete; stored Cloudinary photos render and delete as today.

## Attack surface

Changed: a new upload entry point, signed URLs, a new secret in use, file upload.
1. **What are we working on?** `POST /api/listings/upload-url` (a signed-in active account; the listing's owner or `listings.moderate`), the
   browser PUT to R2, `createListing`/`updateListing` attaching R2 addresses, the delete paths. Trust boundaries: browser → route, browser → R2, server → R2.
2. **What can go wrong?** T1 S/E: an address for another person's folder → mitigate: the key comes from the session or the listing's owner,
   never the body → AC3. T2 T: a non-image, an oversized or a script file through the PUT → mitigate: type and length signed; the server reads
   both objects (length, type, first bytes) before attaching → AC3, AC4. T3 T: another owner's object attached to my listing → mitigate:
   `isOwnedListingImageUrl` and the trigger require `<owner>/listings/` → AC5, AC6. T4 I: R2 keys reach the browser → mitigate: `server-only`
   module, the route answers three fields → AC3, AC9. T5 D: an upload flood or a storage bill → mitigate: 30 per 10 minutes and 200 per day,
   20 photos, 800 KB per object → AC3. T6 T: the same address replayed after the server checked it → mitigate: 300 s expiry, random key, the
   signed length; residual: a same-length same-type replacement within 300 s of the PUT stays an image of the uploader's own listing.
   T7 I: a deleted photo stays reachable from the CDN → mitigate: R2 delete, then the folder purge, retried, failure reported → AC12, AC13;
   residual (owner policy O1038-5): a visitor's browser may keep it up to 3600 s. T8 I: the purge token leaks → mitigate: `server-only`, never
   logged, the token's one permission is Cache Purge on `lero.al` (owner) → AC12. T9 D: the purge rate limit → mitigate: ≤ 100 per request,
   one request per listing, retries after `Retry-After` → AC12.
3. Each mitigation is an acceptance criterion; the tests fail when it is removed (I9).

## OWASP

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the new route, the R2 PUT and the server reads are listed with their threats above — AC3, AC4.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every address request checks the session and the listing's owner — AC3.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a permission, listing or limiter read that fails refuses — AC3.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the route that issues the address and the trigger on `listing_images` both check the owner — AC3, AC6.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the route and the actions refuse without the form — AC3, AC4.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the database and the live upload are tested on the real project — AC6, AC10.
- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T9 name the abuse of the address route, the PUT, the attach and the purge — AC3, AC4, AC12.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — the address route keeps its own two limits (30 per 10 minutes, 200 per day) — AC3.
- Clickjacking_Defense: not applicable — the frame headers of `headers.ts` are not changed by this task.
- Credential_Stuffing_Prevention: not applicable — no sign-in, password or credential check is added or changed here.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — log lines carry codes, prefixes and counts, never a key, token, signed address or signature — AC9, AC12.
- Logging_Vocabulary: not applicable — the security-event helper is Task 1026; this task adds no security event.
- Content_Security_Policy: not applicable — the policy has no `img-src` or `connect-src` and is not changed here.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — photo addresses render only through `AppImage` and `safeImageSrc`; no file name is rendered as markup — AC7.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the object key is a `randomUUID()` chosen by the server — AC3.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the pipeline and queue pass files and blobs only, no string reaches a sink — AC2.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the migration changes one CHECK and the trigger body; its `revoke` from `public, anon, authenticated` stays — AC6.
- Denial_of_Service: "Using validation that is cheap in resources first" — session, body, owner, limits, then signing; the server reads 16 bytes and two HEADs per photo — AC3, AC4.
- Dependency_Graph_SBOM: not applicable — the existing CI SBOM job lists the two new production packages unchanged.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the server compares the first bytes of each object with its type before attaching it — AC4.
- GraphQL: not applicable — the project exposes no GraphQL endpoint and the migration adds none.
- HTTP_Headers: not applicable — no response header of the site changes; the new route uses the existing `no-store` answer.
- HTTP_Strict_Transport_Security: not applicable — HSTS of `headers.ts` stays exactly as on `main`.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — reads go through supabase-js; the SQL has no dynamic statement — AC6.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — type and sizes checked by the route schema and again on the stored objects — AC3, AC4.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the listing id and every attached address are checked against the owner — AC3, AC5.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — the body is a strict schema of four keys, nothing is merged — AC3.
- Key_Management: "a single key should be used for only one purpose" — the R2 key pair is read only by `r2.ts` for this bucket — AC9.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — rows take `url`, `is_cover`, `order` only, after the owner check — AC3, AC4.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — the listing id selects; the folder owner comes from the database — AC3.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — both packages read with `npm view` and the advisory database, exact versions — AC11.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the route and both actions check the session and owner themselves — AC3, AC4.
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — the ESLint security rules hold for the new files in CI — AC11.
- Prototype_Pollution_Prevention: not applicable — no object is built from client-supplied keys; the schema is strict.
- Query_Parameterization: not applicable — the migration has no dynamic SQL and every query goes through supabase-js.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the route decides on its own reads — AC3.
- React_Security: "Without sanitization, it allows injected scripts to execute in the browser." — no `dangerouslySetInnerHTML` or ref HTML write in the form; React text only — AC7.
- SQL_Injection_Prevention: not applicable — no SQL is built from input; the migration is static text.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — the keys stay in the environment; the pre-commit and CI secret scans hold — AC9, AC11.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the diff against this kickoff (V7) — AC11.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — both names and versions were read on npm before they were written here — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T6 each became an acceptance criterion — AC3-AC9.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the server calls only `R2_ENDPOINT` with keys it built; another host is refused by `keyFromPublicUrl` — AC8, AC9.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the route and the actions authenticate and authorize — AC3, AC4.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — exact versions with the lockfile — AC11.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the four answers are under "Attack surface" — AC3-AC9.
- Transport_Layer_Security: not applicable — every site and R2 address is https already; no TLS setting changes.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — photos load from the platform's own `media.lero.al`, and EXIF and GPS are dropped in the browser — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests, breaks and measurements — AC1-AC11.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit covers both packages — AC11.
- Web_Cache_Security: "Default to preventing shared caching for authenticated, personalized, tenant-specific, or otherwise sensitive responses." — the signed addresses are answered with `no-store` — AC3.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no `innerHTML` in the form or pipeline — AC7.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — a strict schema with type and size bounds — AC3.

## UI

Visible: the photo section of the listing form. Owner: `ImageUpload.tsx` (tiles `Card` + `AppImage variant="upload"`, kept); progress:
`src/design-system/mantine/patterns/MantineProgress.tsx`, Story `src/stories/mantine/primitives/Progress.stories.tsx` (U1 reuse); no
local visual value (U3); states (U11): empty, processing, uploading with percent, done, failed with reason + retry + remove, partial (some
failed), disabled while saving, limit reached, offline (network failure → retry), no permission (403 → message); the longest of the four locales
wraps under the tile (U5); U7: no table, no popup, no heading change; U12: progress has a text label with the percent, a failure names the
photo number and what to do, focus stays on the tile controls. Story: `src/stories/patterns/mantine/ImageUpload.stories.tsx` gains the
processing, uploading, failed and partial states.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/listings/components/ImageUpload.tsx — the photo tiles with their progress and failure state
- Component families: form-picker-and-choice, media-gallery-and-listing-contact
- Pattern IDs: form-stack, grid-media-reflow
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, android-common-layouts, android-adapt-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineProgress.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): two tile columns as today; the progress bar spans the tile; 640px transition unchanged
- Mobile order: photo — number → state text → progress → retry / remove
- Required-content treatment: the state and failure text wrap inside the tile; nothing is clipped
- Story and verification: ImageUpload Stories at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 The pipeline asks for 1920 and 640 px, quality 0.85, WebP then JPEG, no EXIF, a Worker, and refuses a result above 800 KB — test:
  `src/modules/listings/lib/__tests__/photoPipeline.test.ts` (new; `browser-image-compression` mocked, its options and the size and type checks asserted).
- AC2 Two photos at a time, per-photo progress, two retries, one new address after a 403 — test: `src/modules/listings/lib/__tests__/uploadQueue.test.ts` (new).
- AC3 The route: 401 without session, 403 for another's listing, 400 for an extra key, a wrong type or a size of 0 or above 819 200, 429 per
  limit, keys under the owner's folder with a random uuid, `Content-Type` and `Content-Length` in the signed headers, a 300 s expiry, no other
  field in the answer — test: `src/app/api/listings/upload-url/__tests__/route.security.test.ts` (new).
- AC4 Create and update refuse an R2 photo whose object is missing, too large, of another type or whose bytes are not that image, and write
  nothing — test: `src/modules/listings/actions/__tests__/listingPhotoVerify.security.test.ts` (new).
- AC5 The address rule accepts only the owner's `full` object on `media.lero.al` — test: `src/lib/uploads/__tests__/imageUrl.security.test.ts` (extended).
- AC6 The database accepts the owner's R2 address and refuses another owner's — test: `src/modules/listings/actions/listingR2Images.integration.test.ts` (new; after the owner applies `task1038.sql`).
- AC7 Cards use `thumb`, the gallery a 640/1920 `srcset`, Cloudinary addresses as before — test: `src/design-system/media/__tests__/appImageConfig.test.ts` (extended).
- AC8 Every delete path deletes `full` and `thumb` after the reference check, in the same dry-run mode — test: `src/lib/media/__tests__/listingPhoto.security.test.ts` (new).
- AC9 `r2.ts` cannot be imported by client code and signs with the `R2_*` values — test: `src/lib/media/__tests__/r2.security.test.ts` (new).
- AC10 A real photo goes through the route to R2 and is verified — test: `src/tests/integration/r2SignedUpload.integration.test.ts` (new; after O1038-1).
- AC12 The purge: prefixes without scheme, query or fragment, at most 100 per request, one request for a listing's photos, after the R2
  delete; a 429, 5xx or network failure retried twice after `Retry-After`; a failure returned and logged as `purge_failed`; no
  `purge_everything`; the token in no log line or answer — test: `src/lib/media/__tests__/cdnPurge.security.test.ts` (new).
- AC13 Live: an uploaded photo answers `Cache-Control: public, max-age=3600, s-maxage=31536000` to the browser and `cf-cache-status: HIT` on a
  repeat, for `full` and `thumb`, plainly, with `Origin: https://lero.al` and with `?v=1`; after `deleteListingPhoto` (R2 delete, purge
  `purged`) the same six requests answer 404 — test: `src/tests/integration/r2SignedUpload.integration.test.ts` (with AC10; its own photo).
- AC11 The texts exist in four languages and the CI jobs pass — test: `gh pr checks <n>` after every check concluded.

## Route

0. Owner first: O1038-1 the R2 custom domain `media.lero.al` once the delegation is live; O1038-5 the bucket CORS rule (origins: the production
   origin and `http://localhost:3000`; method `PUT`; header `Content-Type`; max age 3600); `R2_PUBLIC_URL=https://media.lero.al` in Vercel and
   `.env.local`; `task1038.sql` after its preflight. Done by the owner 2026-11-25: the domain (Active), CORS (GET, HEAD, PUT; three
   origins), `R2_PUBLIC_URL`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CACHE_PURGE_TOKEN`, and the Cache Rule `LERO Media Cache` (Active;
   `(http.host eq "media.lero.al")`; eligible for cache; Edge TTL "Use cache-control header if present, bypass cache if not"; Browser TTL
   "Respect origin TTL"; so an object without `Cache-Control`, a 404 included, is not cached). Still the owner's: `task1038.sql`, applied
   after the executor writes it and the reviewer reads it; AC6 waits for it, AC10 and AC13 do not.
1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1-AC5, AC7-AC9, AC12); save each failing output.
3. The dependencies: the owner stops Storybook and runs `npm install --save-exact browser-image-compression@2.0.2 aws4fetch@1.0.20`
   (`project-facts.md`: no install runs in the owner's folder while Storybook locks `node_modules`); then the server modules, the route, the
   pipeline and queue, the form, the delete paths, the delivery, the SQL, the messages.
4. Run: `npm run typecheck`; `npm test -- <the new and extended test files above> src/__tests__/reactHooksV7Components.test.tsx src/__tests__/reactHooksV7Shells.test.tsx src/__tests__/security/filterStrings.test.ts src/__tests__/security/publicListingsTag.test.ts src/__tests__/security/staffActions.test.ts src/app/__tests__/serverNowProps.test.tsx src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx src/app/api/upload-avatar/uploadAvatar.security.test.ts src/app/api/upload-company-logo/__tests__/route.security.test.ts src/app/api/upload-popular-location-photo/__tests__/route.security.test.ts src/components/admin/__tests__/AdminCompaniesManager.logo.security.test.tsx src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/components/admin/__tests__/AdminShell.pages.test.tsx src/components/admin/__tests__/AdminSidebar.pages.test.tsx src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx src/components/admin/__tests__/AdminUserCreate.watch.test.tsx src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx src/components/admin/__tests__/StackedConfirmDialogs.test.tsx src/components/admin/__tests__/StatusChangeSelect.test.tsx src/components/admin/__tests__/adminDeleteDialog.security.test.tsx src/components/admin/__tests__/adminPagesHydration.test.tsx src/components/admin/__tests__/savedRowRelativeTime.test.tsx src/components/layout/__tests__/FooterView.security.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx src/components/layout/__tests__/Header.signOut.test.tsx src/components/layout/__tests__/headerFooterContainers.test.tsx src/components/layout/__tests__/sessionEnded.security.test.tsx src/components/shared/__tests__/Combobox.portal.test.tsx src/components/ui/__tests__/overlays.test.tsx src/components/ui/__tests__/primitives.test.tsx src/components/ui/__tests__/uiPrimitivesExtra.test.tsx src/design-system/mantine/__tests__/badgeTones.test.ts src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/media/__tests__/appImageConfig.test.ts src/design-system/media/__tests__/cloudinaryUrl.test.ts src/design-system/media/__tests__/safeImageSrc.test.ts src/lib/__tests__/cloudinary.security.test.ts src/lib/__tests__/cloudinaryPurge.security.test.ts src/lib/__tests__/cloudinarySignature.test.ts src/lib/__tests__/pureLibs.test.ts src/lib/account/deleteAccount.security.test.ts src/lib/auth/__tests__/moderatorKeys.security.test.ts src/lib/auth/staffAccess.security.test.ts src/lib/cloudinaryDelete.security.test.ts src/lib/uploads/__tests__/imagePayload.test.ts src/lib/uploads/__tests__/imageUrl.security.test.ts src/modules/__tests__/noDbMessage.security.test.ts src/modules/__tests__/rls-write-guards.smoke.test.ts src/modules/admin/__tests__/adminOrphans.test.ts src/modules/admin/actions/__tests__/adminActorRank.security.test.ts src/modules/admin/actions/__tests__/adminOperations.security.test.ts src/modules/admin/actions/__tests__/adminPermissions.security.test.ts src/modules/admin/actions/__tests__/adminResults.security.test.ts src/modules/admin/actions/__tests__/clearHistory.smoke.test.ts src/modules/admin/actions/__tests__/createAdminUser.security.test.ts src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts src/modules/admin/actions/__tests__/footerContent.security.test.ts src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/admin/actions/__tests__/profileBounds.security.test.ts src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts src/modules/admin/actions/__tests__/userAdministration.security.test.ts src/modules/admin/actions/__tests__/userWebsite.security.test.ts src/modules/admin/dashboard/components/__tests__/AdminDashboardView.axis.test.tsx src/modules/auth/components/AuthSheet.banned.security.test.tsx src/modules/auth/components/ResetPasswordClient.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.registerAgent.test.tsx src/modules/auth/components/__tests__/AuthSheet.test.tsx src/modules/auth/components/__tests__/authClientParts.test.tsx src/modules/auth/components/__tests__/resetPassword.test.tsx src/modules/auth/components/__tests__/staleSession.security.test.tsx src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts src/modules/cabinet/actions/__tests__/cabinetFailures.security.test.ts src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts src/modules/cabinet/actions/__tests__/reauth.security.test.ts src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts src/modules/cabinet/actions/__tests__/reauthLimit.security.test.ts src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/modules/cabinet/statistics/components/__tests__/AgentStatisticsView.axis.test.tsx src/modules/listings/actions/__tests__/deleteListing.security.test.ts src/modules/listings/actions/__tests__/listingBounds.security.test.ts src/modules/listings/actions/__tests__/listingImages.security.test.ts src/modules/listings/actions/__tests__/updateListing.security.test.ts src/modules/listings/actions/__tests__/updateListing.smoke.test.ts src/modules/listings/actions/__tests__/updateListingGallery.security.test.ts src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx src/modules/listings/components/__tests__/ImageUpload.test.tsx src/modules/listings/components/__tests__/ImageUpload.widgetOptions.test.tsx src/modules/listings/components/__tests__/ListingAccessRestrictedView.security.test.tsx src/modules/listings/components/__tests__/ListingCard.hydration.test.tsx src/modules/listings/components/__tests__/ListingContact.bot.security.test.tsx src/modules/listings/components/__tests__/ListingFormShell.bounds.security.test.tsx src/modules/listings/components/__tests__/ListingFormShell.cancel.test.tsx src/modules/listings/components/__tests__/ListingFormShell.cloudinaryConfig.test.tsx src/modules/listings/components/__tests__/ListingFormShell.create.security.test.tsx src/modules/listings/components/__tests__/ListingFormShell.delete.test.tsx src/modules/listings/components/__tests__/ListingFormShell.moderation.security.test.tsx src/modules/listings/components/__tests__/ListingFormShell.parking.test.tsx src/modules/listings/components/__tests__/ListingFormShell.submitError.test.tsx src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx src/modules/listings/components/__tests__/ListingFormShellView.price.security.test.tsx src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx src/modules/listings/components/__tests__/ListingInquiryDialog.bot.security.test.tsx src/modules/listings/components/__tests__/listingFormMantine.test.ts src/modules/listings/components/form/__tests__/fieldContracts.test.tsx src/modules/listings/components/listingStatusOptions.security.test.tsx src/modules/listings/lib/__tests__/generateSlug.security.test.ts src/modules/listings/lib/__tests__/uploadFailure.test.ts src/stories/fixtures/__tests__/ListingFormHarness.test.tsx`; `npm run test:security-integration -- src/modules/listings/actions/listingR2Images.integration.test.ts src/tests/integration/r2SignedUpload.integration.test.ts src/app/api/upload-avatar/uploadAvatar.integration.test.ts src/lib/account/deleteAccount.integration.test.ts src/lib/auth/sessionEnd.integration.test.ts src/lib/auth/staffAccess.integration.test.ts src/modules/listings/actions/deleteListing.integration.test.ts src/modules/listings/actions/listingSlugGuard.integration.test.ts src/modules/listings/actions/updateListing.integration.test.ts src/tests/integration/accessHardening.integration.test.ts src/tests/integration/cloudinarySignedUpload.integration.test.ts src/tests/integration/moderatorKeys.integration.test.ts`
   (checklist D10: every test that imports a changed module or `messages/<locale>.json`, found 2026-11-25 by import). Deliberate breaks: the
   owner check off → AC3 fails; `verifyListingPhoto` skipped → AC4 fails; `thumb` delete dropped → AC8 fails; a failed purge reported as
   `purged` → AC12 fails; each restored. AC13 is run once more with the purge call removed: the six requests then answer 200, not 404.
5. Measure in a real browser (I8a): Chrome desktop and a phone (or its emulation) — three 12+ MP phone photos and a 10-photo batch: input
   size, output sizes, processing time, peak tab memory where shown; the form at 320, 639, 640, 1024, 1440 px in four languages.
6. Report: each command, exit code, relevant output, each failing-first and break output, the measurement table.

## Review
