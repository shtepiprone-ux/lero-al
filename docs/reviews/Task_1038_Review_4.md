# Task 1038 — Review 4

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 4 of Revision 3 (R3-1, R3-2) on 4826746e6, uncommitted — APPROVED
Scope: `git diff --stat 4826746e6`: `src/proxy.ts`, `middlewareScope.security.test.ts`, `photoPipeline.test.ts` — exactly [Review 3](Task_1038_Review_3.md) "Revision 3" Files; plus Opus's documentation and rules of this review (below).
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0, `plan` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45556120214 success; 9 test files found by import → 206 passed, 1 failed (the built-manifest case, V3); the 13 unit files of the acceptance criteria → 444 passed; integration (2 files, development target, after `task1038.sql`) → 21 passed; `npm run typecheck` → exit 0; `npx eslint --no-warn-ignored --max-warnings 0` on the 36 changed and new code files of the task → exit 0; `db-catalog-audit.mjs` → exit 0, `cloudinary-config.mjs` → exit 0; V8 breaks and the browser measurements below.
Findings: Critical 0, High 0, Medium 0, Low 0; Review 3 F4 and F5 fixed, Reviews 1-2 F1, F2, F3 fixed
Overall risk: a listing photo is compressed in the Worker on the real site and stored in R2 through the signed addresses; the database accepts only the owner's photo.

## Checklist V

- V1: as above; `main` green.
- V2: only the three files; every hunk is named by R3-1 or R3-2.
- V3: every claim of the report reproduced: 38 tests, the four files that import the proxy (52 passed, 1 failed), typecheck, ESLint, the failing-first text, the breaks, the responses of the dev server. The failing case is `[SEC-T1-SRV-BUILT-PROXY]` (`src/__tests__/security/proxyFile.test.ts:80`): it compares the matcher with the manifest of the build of 2026-11-21, and A5 forbids a local build. Owner, 2026-11-25: only CI checks this one case (I8, V3 changed); its result is UNKNOWN until V14.
- V4: read `src/proxy.ts`, `middlewareScope.security.test.ts` in full and the `photoPipeline.test.ts` hunk. The exclusion is `vendor/[^/]+\\.(?:js|txt)$`; it removes F4's cause. No assertion removed.
- V5: no visible element changed in this step; the photo tile markup equals `main` (`git diff main -- src/modules/listings/components/ImageUpload.tsx` changes no line of it).
- V5a, pages, the owner's session in the owner's Chrome through the extension, Ukrainian:
  - `/uk/listings/create` at 320, 640, 1024, 1440px, empty: the trigger is 44px high, radius 8px, border 1px rgb(228, 231, 236), padding 0 16px 0 10.67px, 14px/500, rgb(52, 64, 84) on white, shadow rgba(16, 24, 40, 0.05) 0 1px 2px, widths 240, 552, 624, 714; the page's own default button "Cancel" has the same height, radius, border, font, colours and shadow; focus of both: outline solid 2px rgb(236, 84, 71), offset 2px.
  - The same page with one done, one uploading and one failed photo (the answers of the route and of R2 replaced in the page): columns 2, 3, 4, 4; progress 8px, track rgb(228, 231, 236), fill rgb(236, 84, 71); error 12px rgb(217, 45, 32); retry 44px (62px when its label wraps), the same look as the trigger; delete 44x44 rgb(180, 35, 24); order buttons 44px high, disabled rgb(102, 112, 133) on rgb(228, 231, 236); 0 elements past the right edge, 0 clipped.
  - A real photo through the form (4000×3000 JPEG, 1 122 703 bytes): 2 Workers, 16 messages, 2 result files, 0 errors; `POST /api/listings/upload-url` 200 `no-store`; two PUT 200 (`image/webp`, 204 106 and 84 338 bytes, the signed cache policy sent); processing → uploading 0% → 99% → done in 2.1 s; the tile shows `thumb.webp` 640×480 from the media host; no request to jsdelivr. The listing was not saved; the two test objects stay in the owner's R2 folder (Task 1042 removes objects no row names).
  - `/uk/listings/<slug>/edit` (six stored Cloudinary photos, nothing saved) at the four widths: every value of the cover tile, trigger, delete and order buttons equals production at 320 and 1024px; 0 broken images.
  - Cloudinary delivery unchanged: the `src`, `srcset` and `sizes` of every photo of `/uk`, `/uk/listings` and a listing page are the same on production and here (26, 11 and 1 photos, equal digests).
  - Firefox: the owner's look, 2026-11-25 (translated): "Everything is fine".
  - Stories: none changed in this step; the measurements of Reviews 1-3 stand. No listing with an R2 photo exists yet, so its card and gallery are held by AC7's test.
- V6: no `eslint-disable`, `skip`, `only`, `ts-expect-error` or allowlist added.
- V7: below.
- V8: R3-1: the exclusion removed; widened to `vendor`; without `$`; any extension; any depth → 1 failed in each of the five; `src/proxy.ts` restored, md5 `8ad97858db1c1570e85ea0909c1eb628` before and after. AC6: before `task1038.sql` 3 failed (42501), after it 17 of 17. AC10 and AC13 live: 4 of 4. A Worker given the old address `/sq/vendor/…` fails in `importScripts`, the control of the browser measurement. The breaks of the other criteria stand (Review 1 V8).
- V9: no Story changed in this step; Review 2's list stands.
- V10: `owasp.mjs review <kickoff> --base main` → exit 0; the record: Software_Supply_Chain_Security and User_Privacy_Protection from `finding` F1 to `met`; Session_Management's reason and Nextjs_Security's evidence name the proxy.
- H4: `task1038-preflight.sql` read-only, LF and CRLF → rows 1-4 problems 0; `db-sql-roundtrip.mjs`: CRLF → "the rollback restores the catalog (6 catalog row(s) changed)", LF → only `\r` differs; md5 as in Review 1. Applied by the owner 2026-11-25 ("Success. No rows returned"); `task1038-verify.sql` → rows 1-5 true.

## V7 — secure code review

Six steps: no control weakened (the two static files read no session; every other path keeps its refresh); no new entry point, outbound call or package; trust boundaries unchanged; no test deleted.
- Authorization; authentication and sessions; input and output; business logic; JavaScript and TypeScript; data exposure, errors, logging; files; dependencies and configuration: not touched by this step (`git diff --name-only 4826746e6` shows no file of them).
- Requests and redirects: touched — `src/proxy.ts:102`: `/vendor/<file>.js` and `.txt` are no longer redirected; `/vendor`, `/vendor/a/b.js`, `/vendor/x.json`, `/vendor/..%2fsq%2flistings.js` still are (dev server).
- Next.js entry points: touched — the matcher; an unknown `/vendor/x.js` answers 404 `no-store`; `nosniff` and the other headers of `next.config.ts` stay on the two files. The bodies equal the committed files (md5 `3d6dfc9976fe6b936151b7406ec3ebe2`, `04127a0bc07804bf075ae24f8f218226`).
- Agent and tool output: every claim rerun (V3); no invisible character in the three files.
- Tests: touched — the new case fails in five breaks (V8).

## Closed and filed

- Review 1 N3: the owner states `CLOUDINARY_DELETE_MODE=enabled` is set in Vercel (2026-11-25).
- A4, outside this task, the same on `main`: the marks of a photo lie under its controls on narrow tiles → Task 997, Scope line of 2026-11-25 and AC7.
- `supabase/catalog.json` still holds the CHECK and trigger from before `task1038.sql` (no gate compares it with the live database) → Task 1043's row in `docs/backlog.md`.

## Open parts

- Owner: read the diff line by line where the change report lists it (`src/proxy.ts`, rules, dependencies, lint configuration, security tests, SQL).
- V14: `gh pr checks <n>` after the push, `[SEC-T1-SRV-BUILT-PROXY]` and AC11 among them.
