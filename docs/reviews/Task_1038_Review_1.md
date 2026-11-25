# Task 1038 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 1 of the working tree on a44708037 (first implementation, uncommitted) — NEEDS REVISION
Scope: the 18 changed and 17 new files of the executor's report against a44708037: `src/lib/media/{r2,cdnPurge,listingPhoto}.ts`, `POST /api/listings/upload-url`, `photoPipeline.ts`, `uploadQueue.ts`, `ImageUpload.tsx`, the create, update, delete and account-delete paths, `appImageConfig.ts`, `imageDelivery.ts`, `imageUrl.ts`, `supabase/sql_migrations/task1038/`, the four message files, the ImageUpload Stories. Every file is in the kickoff's Scope (`cloudinaryDelete.ts`: the one word `export` the Scope names; the Stories: "## UI").
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45556120214 success; `npm run typecheck` → exit 0; the nine new and extended test files → 355 passed; the Route's 125 unit files in four runs → 2 files failed (42 tests, F2), the rest passed; 22 more files found by import outside the Route → 254 passed; integration (12 files, development target) → 102 of 105, the three failures are AC6 before `task1038.sql`; H4 on the SQL (below); V8 breaks (below); Storybook measurement (below).
Findings: Critical 0, High 0, Medium 3 (F1, F2, F3), Low 0
Added 2026-11-25 after the review: F3, found by the pre-commit hook's ESLint when the owner committed the reviewed tree (V13); this review ran no ESLint on the changed files.
Overall risk: the server side holds (owner check, signed type, length and cache policy, read-back before attach, delete then purge); the browser fetches third-party code at run time, and the form's two old test files fail CI.

## Checklist V

- V1: as above; `main` green.
- V2: no file outside the Scope; `docs/security/owasp/{controls,sheets}.json` are the output of `owasp.mjs sync` (A0); `docs/backlog.md` and the Task 1044/1045 files are another Opus session's documentation, not the executor's.
- V3: every claim reproduced: 355; 125 Route files with the same two failing files (35 + 7 tests); 102 of 105 integration with AC6's three; AC10 and AC13 live on R2 4 of 4. The report's "5 importers outside the Route" is a smaller set than the import search of this review (22 files, all green).
- V4: read every new server module and the route in full; the create, update and delete diffs; the SQL. `photoPipeline.ts:38` passes no `libURL` (F1).
- V5: stored Cloudinary photos keep `insertTransform`/`buildSrcset` unchanged (`appImageConfig.ts`, `appImageConfig.test.ts` Cloudinary cases green); the grid, marks, cover, order, delete and disabled-while-saving are as on `main` (measured below).
- V5a: Stories `Patterns/Mantine/ImageUpload` Partial, Failed and Uploading at 320, 639, 640, 1024, 1440 px × sq, en, uk, it (60 renders): no horizontal overflow, no clipped text; columns 2, 2, 3, 4, 4 (the 640 switch as on `main`); the retry button 44 px (62 px when its label wraps at 320), radius 8px, border 1px rgb(228, 231, 236), 14px/500, rgb(52, 64, 84) on white — equal to "Add more"; the progress bar 8 px, track rgb(228, 231, 236), fill rgb(236, 84, 71) — the same as `Mantine/Primitives/Progress` default (U4). The listing form pages: BLOCKED — no app dev server and no owner session in this session's browser (the DevTools profile was held by another browser); the executor's measurement of the form at five widths stands as reported, to be measured by Review 2 on the owner's Chrome.
- V6: no `eslint-disable`, `skip`, `only`, `ts-expect-error` or allowlist in the diff.
- V7: below.
- V8: each AC's test fails with its change undone once, file restored byte for byte (md5): AC1 2 failed, AC2 3, AC3 2, AC4 15, AC5 4, AC7 4, AC8 4, AC9 3, AC12 7; AC13 live with the purge call replaced by a fake `purged`: "full plain: after the purge: expected 200 to be 404", restored → 4 of 4. AC6 waits for the SQL; AC10 is AC13's upload; AC11 is CI.
- V9: Stories for the owner: Empty, WithPhotos, SinglePhoto, LimitReached, Saving, Processing, Uploading, Failed, Partial, LimitWithPending (measurements in V5a).
- V10: `owasp.mjs review <kickoff> --base main` → the record lists every sheet of the kickoff and of the diff (68).
- H4: `task1038-preflight.sql` read-only, LF and CRLF → rows 1-4 problems 0; `task1038-verify.sql` before the apply → rows 1-2 false, 3-5 true (as expected); `db-sql-roundtrip.mjs task1038.sql task1038-rollback.sql`: CRLF copies → "the rollback restores the catalog (6 catalog row(s) changed)"; LF files → the function body differs only by `\r` (the live body of `listing_images_owner_folder` holds CRLF line ends since `task957.sql` was applied from a CRLF copy). md5 LF: preflight `313042d204a1cf20a4227ccd0b66ef28`, apply `61d81e9f87c353ddef323301248ebe3a`, verify `9b890fe48d954b1a5969200cc4767dba`, rollback `b896fc01a638a2026bbfe037f311f6c6`.

## V7 — secure code review

Six steps: no existing control weakened (the Cloudinary branch of the trigger and of `isOwnedListingImageUrl` unchanged); new entry point `POST /api/listings/upload-url` (signed-in active account; owner or `listings.moderate`); new outbound calls to `R2_ENDPOINT` and the Cloudflare API only; trust boundaries browser → route, browser → R2 (signed PUT), server → R2, server → Cloudflare; new packages `browser-image-compression@2.0.2`, `aws4fetch@1.0.20` (lockfile +3 entries only, npm 10.9.8); no test deleted, two test files fail (F2).
- Authorization: touched — `route.ts:63-77` (owner from the session or the listing, fail closed), `createListing.ts` and `updateListing.ts` verify R2 photos in the owner's folder before any write; database twin: the trigger (`task1038.sql:31-36`).
- Input and output: touched — strict zod schema (`route.ts:21-26`); rows take `url`, `is_cover`, `order` only.
- Authentication and sessions: not touched (`requireViewer` reused).
- Requests and redirects: touched — no redirect; server fetches only to `R2_ENDPOINT` with `assertKey` (`r2.ts:40-52`) and to `api.cloudflare.com`; the route checks no `Origin`, as no route of the project does; the session cookie is `sameSite: "lax"` (`@supabase/ssr` constants), so a cross-site POST carries no session.
- Next.js entry points: touched — `r2.ts:1` and `cdnPurge.ts:1` import `server-only`; `listingPhoto.ts` imports them, so no client bundle can import it.
- Business logic: touched — per-actor limits kept (`route.ts:28-31`); the replacement within 300 s is the kickoff's accepted residual (T6).
- JavaScript and TypeScript: touched — `KEY` and the trigger regex have no nested quantifier; input length bounded first.
- Data exposure, errors, logging: touched — generic error codes; logs carry codes, prefixes and counts, never a key, token or signed address.
- Files: touched — type by content (`listingPhoto.ts:50-56`), size on the server, key chosen by the server, owner checked.
- Dependencies and configuration: touched — F1.
- Agent and tool output: `check-files` runs in CI and at the owner's commit.
- Tests: touched — F2; the security tests fail when their control is removed (V8).

## Findings

F1 — The image Worker loads its code from cdn.jsdelivr.net at run time
Severity: Medium      Category: Dependencies and configuration      CWE: 829
Location: src/modules/listings/lib/photoPipeline.ts:38
Description: `useWebWorker: true` without `libURL`; the library's Worker then runs `importScripts` of its default
`https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js`
(`node_modules/browser-image-compression/dist/browser-image-compression.mjs`, `libURL=o.libURL||"https://cdn.jsdelivr.net/..."`), seen in the executor's Network log.
Impact: code from a third party, outside the lockfile and its integrity hash, runs with every photo a person uploads; every upload tells jsdelivr the visitor's address; the owner's condition "all processing locally in the user's browser, no third-party APIs" does not hold.
Reproduction: the executor's report (Network: a request to cdn.jsdelivr.net during processing); the default in the package text above.
Recommendation: serve the package's own file from the site: `public/vendor/browser-image-compression-2.0.2.js`, a byte copy of `node_modules/browser-image-compression/dist/browser-image-compression.js`; pass `libURL: '/vendor/browser-image-compression-2.0.2.js'` in `COMMON`; a test asserts the option on both calls and that the copy's sha256 equals the installed file's.
References: Software_Supply_Chain_Security, User_Privacy_Protection, Third_Party_Javascript_Management.
Status: open

F2 — The form's two existing test files fail: they test the removed widget
Severity: Medium      Category: Tests      CWE: —
Location: src/modules/listings/components/__tests__/ImageUpload.test.tsx, ImageUpload.widgetOptions.test.tsx
Description: 35 and 7 tests assert `CldUploadWidget` behaviour the Fix removes; the kickoff listed both in the Route but gave no Scope line to rewrite them (the design's miss).
Impact: `Unit and component tests` fails in CI; the form's new behaviour (input options, the 20-photo limit with pending tiles, failure reasons, retry and remove) has no component test.
Reproduction: `npx vitest run src/modules/listings/components/__tests__/ImageUpload.test.tsx src/modules/listings/components/__tests__/ImageUpload.widgetOptions.test.tsx` → 42 failed.
Recommendation: rewrite both files for the file input, keeping their names: every grid, cover, order, delete and disabled assertion stays; each widget assertion is replaced by the input's counterpart (accept jpeg/png/webp, `multiple`, the 20-photo limit counting pending tiles, the failure text per reason, retry, remove); no assertion removed without its replacement (A9).
References: quality-gates.md §5 and §8; secure-code-review.md §3 Tests.
Status: open

F3 — ESLint refuses the form: a ref is passed to a function called during render
Severity: Medium      Category: Tests and gates      CWE: —
Location: src/modules/listings/components/ImageUpload.tsx:242
Description: `{canUploadMore && triggerButton(disabled ? undefined : () => inputRef.current?.click())}` passes a closure that reads `inputRef.current` to `triggerButton`, a plain function called during render; `react-hooks/refs` reports "Error: Cannot access refs during render" ("Passing a ref to a function may read its value during render"). On `main` the same helper got `openWidget` from the widget, not a ref (`git show main:src/modules/listings/components/ImageUpload.tsx`, lines 221, 286, 321).
Impact: the pre-commit hook (`.githooks/pre-commit`, ESLint `--max-warnings 0` on staged code) refuses every commit of the file, and the CI job "Lint, types and product checks" fails on any ESLint error (quality-gates.md §5). INFERENCE: no wrong behaviour at run time, the closure reads the ref only when clicked.
Reproduction: the owner's `git commit` of the staged tree on 2026-11-25 → "ImageUpload.tsx 242:39 error Error: Cannot access refs during render react-hooks/refs", 1 problem; no commit created.
Recommendation: the ref is read only inside an event handler given directly to the trigger's `onClick` prop, not through an argument of a function called during render; the trigger keeps its look, label, position and disabled state (A2); no `eslint-disable`.
References: quality-gates.md §2 and §5; react.dev/reference/react/useRef.
Status: open

## Notes (no change asked)

- N1 `gallery-side` (largest request 640 px) and `preview` (800 px) render `thumb` without a `srcset`: `useAdaptiveImageConfig.ts` is outside the Scope, so the choice keys on the requested width; for `gallery-side` the 640 px object is exactly the largest size Cloudinary served; `preview` gets 640 against 800.
- N2 A12: `deleteAccount.ts` was edited with a node heredoc, not Edit; the diff was read here and is correct.
- N3 R2 deletes and purges follow the same mode switch as Cloudinary (`CLOUDINARY_DELETE_MODE=enabled`, `listingPhoto.ts:92`); its value in Vercel is UNKNOWN to this review — without it no photo is deleted or purged in production (owner).
- N4 the executor's own choices (PUT timeout 120 s, retry pauses 1 s and 3 s, `Retry-After` cap 30 s, no `maxSizeMB` for `thumb` with the 800 KB check after) stay inside the kickoff.

## Revision 1 (for the implementer)

- R1-1 (F1): `photoPipeline.ts` `COMMON` gets `libURL: '/vendor/browser-image-compression-2.0.2.js'`; new file `public/vendor/browser-image-compression-2.0.2.js`, a byte copy of `node_modules/browser-image-compression/dist/browser-image-compression.js` (57 069 bytes); `photoPipeline.test.ts` asserts `libURL` on both `imageCompression` calls and the sha256 equality of the two files (fails without the option and with a changed copy). I8a: DevTools Network shows the Worker script from the site and no request to cdn.jsdelivr.net.
- R1-2 (F2): rewrite `ImageUpload.test.tsx` and `ImageUpload.widgetOptions.test.tsx` as above; both green; nothing else changes.
- R1-3 (F3): `ImageUpload.tsx:242` as in F3's Recommendation; `npx eslint --no-warn-ignored --max-warnings 0` on every changed `.ts`/`.tsx` file of the task (the pre-commit hook's command) → exit 0; R1-2's tests assert that the trigger opens the file input and is disabled while saving.
- Order (owner, 2026-11-25): the owner commits the reviewed tree without `ImageUpload.tsx` (the only file the hook refused); R1-3 alone starts from that commit with `ImageUpload.tsx` the one uncommitted file, then stops and reports; the owner commits `ImageUpload.tsx`; R1-1 and R1-2 start from that commit, which Review 2's V2 diffs against.

## Open parts

- Owner: apply `task1038.sql` (preflight, apply, verify) — AC6; say whether `CLOUDINARY_DELETE_MODE=enabled` is set in Vercel (N3).
- Review 2: AC6 after the apply; the form pages on the owner's Chrome (V5a); F1, F2 and F3.
