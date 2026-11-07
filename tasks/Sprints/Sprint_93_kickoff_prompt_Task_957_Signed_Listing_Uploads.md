# Task 957 — Listing photos are uploaded only with a server signature, into the owner's own folder

Sprint 93. Priority P0. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed". Filed by the whole-project audit (`docs/security/audit-2026-11-06/findings.md`: X-01, A-05,
C-05). Implementer: Sonnet, after Task 952 (it moves `next-cloudinary` to 7.0.0 and creates the widget test). Reviewer: Opus. The owner changes the Cloudinary preset (an account setting agents do not
write).

## Goal

Today:
- Listing photos go from the browser straight to Cloudinary with an UNSIGNED preset
  (`src/modules/listings/components/ImageUpload.tsx:179-189`, the preset name from
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` at `src/app/[locale]/listings/create/page.tsx:22` and
  `src/app/[locale]/listings/[slug]/edit/page.tsx:103`). `node scripts/quality/cloudinary-config.mjs` (read-only, 2026-11-07)
  reports U1 for that preset: anyone who reads the page HTML uploads any file of any size into any folder, including
  another person's `<userId>/listings` folder (X-01). The widget's `clientAllowedFormats` and `maxFileSize` are
  browser-only.
- `isTrustedImageUrl` (`src/lib/uploads/imageUrl.ts:11-22`) accepts any address in the cloud, so another person's photo
  or a stranger's upload can be attached to a listing; its comment at line 6 ("Images are uploaded by the server") is
  false for listing photos.
- `upload-cms-image/route.ts:35` trusts the browser-declared `file.type`; the other upload routes also run
  `declaredTypeMatchesBytes` (A-05).
- `cloudinaryDelete.ts:102` reads only the first 500 CMS pages before deciding an asset is unreferenced (C-05).

After the task: no unsigned preset exists; the browser still uploads directly to Cloudinary (the request body stays off
the Vercel function, whose limit is 4.5 MB, while a photo may be 10 MB), but only with parameters the server signed for
that session: the folder, the formats and the timestamp. A listing accepts only photos from its owner's folder.

## Scope

- New route `src/app/api/listings/upload-signature/route.ts` (POST): an active signed-in session (the check the other
  upload routes use); for an edit, the listing id in the body and the caller must own it or hold `listings.moderate`;
  signs exactly `{ timestamp, folder: '<ownerId>/listings' or '<ownerId>/listings/<listingId>', upload_preset: <signed
  preset>, allowed_formats: 'jpg,jpeg,png,webp' }` with `CLOUDINARY_API_SECRET` (SHA-256 per Cloudinary's signing rules);
  refuses any other parameter the browser asks to sign; a per-account limit of signatures per minute (the limiter
  already used by the reveal and recovery paths, cited in the report).
- `ImageUpload.tsx`: `signatureEndpoint` instead of an unsigned preset; the `uploadPreset` prop becomes the signed
  preset's name from a server-only variable `CLOUDINARY_LISTING_PRESET`, passed by the two pages;
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` leaves the two pages and `docs/env.md` (`cloudinary-config.mjs` keeps reading it
  only to report a preset left behind).
- `imageUrl.ts`: `isOwnedListingImageUrl(url, ownerId)` (trusted AND the path is `/<cloud>/image/upload/<version?>/<ownerId>/listings/…`);
  `createListing` and `updateListing` require it for every image (the owner's id, also when staff edit); the false
  comment corrected.
- `upload-cms-image/route.ts`: `declaredTypeMatchesBytes` before the upload, as in the other three routes.
- `cloudinaryDelete.ts`: the CMS reference check reads every page (paged, or a server-side text search), never a
  first-500 window.
- `scripts/quality/cloudinary-config.mjs`: a new invariant U3, the signed listing preset has `allowed_formats` set and an
  incoming transformation that bounds the stored size; its self-test extended.
- Owner (Cloudinary console, after the merge): create the signed preset named in `CLOUDINARY_LISTING_PRESET`, delete the
  unsigned preset; set `CLOUDINARY_LISTING_PRESET` in Vercel. Opus gives the exact steps.
- Dependencies: none (`next-cloudinary` 7.0.0 supports `signatureEndpoint`; Sonnet confirms in its docs under
  `node_modules/next-cloudinary`).
- Out of scope: moving existing photos; a malware scan of images (images are re-encoded by Cloudinary on delivery).

## Attack surface

Changed: a new authenticated endpoint; the upload path of listing photos; the image acceptance of listing writes.
- T1 Spoofing / elevation: a stranger or another account uploads into a person's folder. Mitigation: only a session
  gets a signature, and the folder is the server's choice.
- T2 Denial of service (cost): unlimited uploads. Mitigation: signatures per account per minute; signed formats; the
  preset's incoming transformation bounds the stored size; the timestamp expires per Cloudinary (one hour).
- T3 Tampering: a listing carries someone else's photo. Mitigation: `isOwnedListingImageUrl` on every write.
- T4 Tampering: a CMS upload whose bytes are not the declared type. Mitigation: the byte sniff.

Authorization matrix for `upload-signature`: anon 401; blocked account 403; active user, own new listing 200; active
user, another person's listing 403; moderator with `listings.moderate`, any listing 200; moderator without it 403.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — unsigned uploads into any folder and photos of another account are the abuse cases — AC1, AC3.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC3, AC5.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the signature route checks the session and the listing owner on each request — AC1.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a request asking to sign another folder or parameter is refused — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the folder is derived from the owner id on the server — AC1, AC3.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the route and updateListing are tested directly, not through the widget — AC1, AC3.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — every matrix row of the new route is a test case — AC1.
- Bot_Management_and_Anti-Automation: "Avoid fixed-window counters: they allow bursts at boundary times." — the route uses the sliding limiter (Task 959) or its own per-minute limit until then — AC2.
- Credential_Stuffing_Prevention: not applicable — no sign-in path changes; the route requires an existing session.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — ImageUpload and the listing pages render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC4, AC8.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the signature uses the account secret on the server with SHA-256 — AC1.
- Denial_of_Service: "Using validation that is cheap in resources first" — the per-minute limit answers 429 before signing — AC2.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — ImageUpload and the listing pages add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC4, AC8.
- DOM_Clobbering_Prevention: not applicable — the CMS route stores images only; the HTML sanitizer is untouched.
- File_Upload: "List allowed extensions. Only allow safe and critical extensions for business functionality" — the signature fixes allowed_formats; the CMS route sniffs bytes — AC1, AC5, AC7.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — cloudinary-config.mjs pass file names and arguments as array items; no value is joined into a command line — AC7.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the CMS route checks the bytes whatever the declared type — AC5.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — an image in another account's folder is refused on save — AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC8.
- Key_Management: "a single key should be used for only one purpose" — the preset name moves to a server variable; the public preset variable is removed — AC4.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — only server parameters are signed; folder, public_id, type and overwrite from the body are refused — AC1.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — the folder comes from the session, never from the body — AC1, AC3.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the signature route authenticates although only the owner page renders the widget — AC1.
- Nodejs_Security: not applicable — the new route reads a small JSON body with the framework parser; no new runtime feature.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — cloudinary-config.mjs start git and node with argument arrays, never a shell string — AC7.
- Prototype_Pollution_Prevention: not applicable — the route reads named fields; no body object is merged into the signed set.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the route decides access itself for each request — AC1.
- Secrets_Management: "prevent them from leaking and compromising the organization" — no Cloudinary value reaches client code; the clientSinks test fails on the public preset name — AC4.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC8.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC8.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC3, AC5.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — deletion pages through Cloudinary admin calls on its fixed host only — AC6.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the new function refuses callers without a session — AC1.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC3, AC5.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — only this project's Cloudinary folder addresses are stored for a listing — AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC8.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — ImageUpload and the listing pages use no innerHTML; lint (react/no-danger) fails on one — AC4, AC8.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the body schema allows only the fields the widget sends — AC1.
- XSS_Filter_Evasion: not applicable — the CMS route sniffs image bytes; no HTML filtering changes.

## UI

No visible change (the same widget, signed).

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The signature route follows the matrix and signs only the server's parameters — test:
  `src/app/api/listings/upload-signature/__tests__/route.security.test.ts` (new): every matrix row; a body asking to
  sign `folder`, `public_id`, `type` or `overwrite` is refused; the signature verifies with the known secret.
- AC2 The limit holds — test: `src/app/api/listings/upload-signature/__tests__/route.security.test.ts`, one request
  over the per-minute limit answers 429.
- AC3 A listing accepts only its owner's photos — test: `src/lib/uploads/__tests__/imageUrl.security.test.ts`
  (extended: another account's folder, the cloud root, a look-alike folder `<ownerId>x/listings`, `..` segments and a
  query string are refused) and `src/modules/listings/actions/updateListing.integration.test.ts` (extended: an image in
  another account's folder answers the refusal).
- AC4 The widget uses the signature endpoint and no public preset variable remains — test:
  `src/modules/listings/components/__tests__/ImageUpload.test.tsx` (Task 952 creates it; extended: the widget receives
  `signatureEndpoint` and no
  unsigned preset) and `src/__tests__/security/clientSinks.test.ts` (extended: any product file naming
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` fails).
- AC5 The CMS route sniffs bytes — test: `src/app/api/upload-cms-image/__tests__/route.test.ts` (extended: a PNG
  declared as `image/jpeg`, and text declared as `image/png`, answer 400).
- AC6 Deletion sees every CMS page — test: `src/lib/cloudinaryDelete.security.test.ts` (extended: the reference on page
  501 of 600 keeps the asset).
- AC7 The live account has no unsigned preset and the listing preset is bounded — test:
  `node scripts/quality/cloudinary-config.mjs` exits 0 after the owner's console step (Opus runs it), and
  `scripts/quality/cloudinary-config.test.mjs` (extended: U3 cases).
- AC8 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md`
  exit 0.

## Route

1. Confirm Task 952 is merged; branch from `main`. Run `node scripts/quality/cloudinary-config.mjs`; keep the output (U1 expected).
2. Tests first (AC1-AC6); save each failing output.
3. The route, the widget, the image ownership check, the CMS sniff, the delete paging, U3.
4. Run AC1-AC8; one deliberate break per security test (remove the ownership check, see AC3 fail; restore).
5. Report: each command, exit code and relevant output; the exact console steps for the owner (preset settings).
6. After the owner's console step and the merge, Opus runs AC7.

## Review
