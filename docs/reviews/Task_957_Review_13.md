# Task 957 — Review 13

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 13 of Revision 12, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — APPROVED
Scope: the Revision 12 diff (R12-1): one selector in the end-padding rule of `input-chrome.css` and one test in `listingFormMantine.test.ts`; then the
unit tests of every acceptance criterion on the whole branch, and V5a on the pages Revisions 9-12 changed.
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success`; `npm test
--` the 20 unit test files the acceptance criteria name plus `MantineDeleteIconButton.test.tsx` and `AdminPagesView.test.tsx` → exit 0, 22 files, 497
passed; `node --test scripts/quality/cloudinary-config.test.mjs` → 9 passed; `check-ui-contract.mjs --verify-gate` → exit 0; `check-i18n-parity.mjs` → exit
0, 2695 keys; `owasp.mjs review <kickoff> --base main` → exit 0. Not run (A5): `tsc`, lint, the unit and integration jobs, build, census, and
`check-ui-contract.mjs --base origin/main` (it reads the committed branch): `CI Required` on the pull request (V14).
Findings: Critical 0, High 0, Medium 0, Low 0; F53 fixed
Overall risk: low; every finding of Reviews 1-12 is fixed or withdrawn (F38), every unit test of the acceptance criteria passes, every field and control the
task changed was measured in the owner's Chrome against its canonical owner, and the open proofs are the pull request's CI jobs.

## Secure code review (`secure-code-review.md` §2, §3)

One selector added to an existing stylesheet list and one test: no entry point, query, permission, schema, dependency or configuration. Every category of
§3: not touched by Revision 12; the categories earlier revisions touched are answered in Reviews 6-12.

## Rendered comparison (V5a, 2026-11-23, the owner's Chrome, 1920px)

- `/admin/pages` → edit → Insert → Insert image (opened and closed with Escape, nothing saved): the empty `FileInput` 44px, radius 8px, border
  `rgb(208,213,221)`, padding start 16px and end 16px, text `rgb(29,41,57)`, shadow, no right section; the dialog's `TextInput` the same in every value.
- `/uk/listings/<slug>/edit`, regression check after Revisions 11-12: the seven number fields 44px, gray-3, controls 42px, opacity 1; `Select`, the
  `TextInput`s and the three left-icon fields 44px, gray-3; the description 169px; the note 64px.
- The executor's I8a (Storybook `RichTextEditor` `ImageUploading`, 320 to 1440px) agrees: empty 16px end padding, 42px (Mantine's reservation) with a file
  and its clear button.
- Firefox: the owner's look (Review 11): "everything is ok". Safari: UNKNOWN (no Safari available).

## Findings

F53 — fixed in Revision 12 (R12-1), measured above.

## Acceptance criteria

- The unit tests of AC27-AC55 pass on the branch (above); each revision's deliberate breaks turned its tests red (Reviews 6-13).
- AC9: the catalog part met (Review 6); the round trip not run, the SQL applied by the owner without it (Review 9).
- AC4, AC8, AC37 (`[INT-EDIT-EMPTIED]`), AC39 (`--base origin/main`) and the census rows run in `CI Required` on the pull request; the verdict on them is
  `gh pr checks <n>` (V14).

## For the owner

- Visible changes against `main` from this task's design, measured in Review 9, still for your confirmation: the page title 24px → 36px at desktop
  width; the 88px dashed upload area → a 44px button; the chips 36-40px round at 16px → 44px at 14px with 8px corners; labels 14px/500 black → 14px/600
  gray-7; section titles 16px/600 → 16px/500; field text 16px → 14px; the number fields 40px → 44px with Mantine's step controls (O957-20); the left-icon
  fields' text start 34px → 42px (O957-22).
- Owner decisions of this review cycle: O957-20 (step controls on hover and focus), O957-21 (the description as on `main`), O957-22 (one canonical field
  height); Tasks 1019 (the owner's listing note, O1019-1, O1019-2) and 1020 (the auth form button size) filed.

## V14 — pull request #66 (commit `0061132c0`), 2026-11-23

`gh pr checks 66` → red: "Lint, types and product checks", "Unit and component tests", "Authorization regression", "Click-shield" and Vercel; green:
CodeQL, OWASP task gate, gitleaks, Storybook build, locale leak, change report, dependency audit, SBOM, zizmor. `gh run view 45182648357 --log-failed`:
every red job stops at the type check of its build, on four errors:
- `src/modules/listings/components/form/NumberTextInput.tsx(61,27)` and `(61,53)`: TS2367, "the types 'SourceType' and '"increment"' have no overlap".
  Mantine passes `{ source: "increment" }` and `"decrement"` at run time (`node_modules/@mantine/core/esm/components/NumberInput/NumberInput.mjs:197`,
  `:222`) but types `onValueChange`'s source as `react-number-format`'s `SourceType` (`node_modules/react-number-format/types/types.d.ts:13`).
- `src/modules/listings/components/__tests__/listingFormMantine.test.ts(412,77)` and `(413,12)`: TS18048, "'appTheme.other' is possibly 'undefined'".
The unit tests passed locally because Vitest does not type-check; `tsc` is a CI check (A5). The jobs after the build are UNKNOWN until it passes.
Fix in this pull request: Revision 13.

Second run, commit `9a14f810b` (run 45186358458): the type check passes; red: "Lint, types and product checks" and "Authorization regression".
- "OWASP reference — upstream equals the committed registry": upstream changed `Nodejs_Security`, `NPM_Security` and `User_Privacy_Protection` today
  (registry `c2a1e3e3` → `7db73fd2`). Opus re-read the upstream diffs (`gh api repos/OWASP/CheatSheetSeries/compare/c2a1e3e32cec...7db73fd2770f`):
  `NPM_Security` adds the workspace-root `.npmrc` (no workspaces here; the root `.npmrc` has `ignore-scripts=true`: met); `User_Privacy_Protection`
  rewrites certificate pinning (native mobile apps only; not applicable); `Nodejs_Security` rewrites logging: two requirements (no sensitive data in a log;
  untrusted input escaped against log injection) mapped to the existing control `recovery.ts` and to the new Task 1021 (Task 955's kickoff, which owns logs,
  lacks "## Cause" and fails `check-files`, so it is not extended). `owasp.mjs check` → exit 0; `owasp.mjs sync --verify` → exit 0.
- "Authorization regression" (`npm run test:security-integration` on the development project), 13 failed in 4 files, every one `42501`:
  - `rateLimit.integration.test.ts` reads, seeds and removes `rate_limit_hits` through the service role (`:23`, `:68`, `:75`); `task957.sql:13-14`
    revokes the table from `public`, `anon`, `authenticated` and grants the service role nothing, against its own comment ("read and written by the service
    role"); the application never reads the table (`grep rate_limit_hits src` outside tests: nothing), the function is `SECURITY DEFINER`.
  - `accessHardening`, `deleteAccount` and `listingAccessState` insert synthetic photos outside the owner's folder (for example
    `accessHardening.integration.test.ts:436`, `…/upload/v1/zz-synth-photo.jpg`); the new trigger `listing_images_owner_folder` refuses them (42501,
    `task957.sql:58-85`), as designed; the cases that expect a foreign host refused with `23514` (`:556`, `:581`) meet the trigger first (a `BEFORE`
    trigger runs before the CHECK).
Fix in this pull request: Revision 14 (Sonnet), then the owner applies `task957-grants.sql`.

Revision 14, read here: `task957-grants.sql` grants the service role `select, insert, delete` on `rate_limit_hits` and nothing else, its rollback
revokes the same three; the three integration files put every synthetic photo in the owner's folder (`photoUrl(ownerId)`), and each deny case asserts the
rule that refuses it: the trigger (42501, its message) for a foreign host, `http` or an address outside the owner's folder, the CHECK (23514,
`listing_images_url_prefix_check`) for another cloud in the owner's folder, so both protections stay proven; `deleteAccount`'s ids follow from
`publicIdFromUrl` dropping the `v1` segment (`src/lib/cloudinaryUpload.ts:148-150`). The owner applied `task957-grants.sql` in the SQL Editor (2026-11-23,
"Success. No rows returned"); read in a `read only` transaction: `has_table_privilege` on `public.rate_limit_hits`: `service_role` SELECT, INSERT, DELETE
true, UPDATE false; `anon` and `authenticated` false for all four. The integration results are UNKNOWN until `gh pr checks 66`.

Open parts, in order: commit and push (Revision 14 and the OWASP remap) → `gh pr checks 66` → the merge.
