# Task 957 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 1 of the working tree on 213103f0a (uncommitted) — NEEDS REVISION (1 of 2)
Scope: the 53 changed and 23 new files of the implementation (`git diff --name-only main`, `git ls-files --others
--exclude-standard` less this review's two files), each read in full by the reviewer (the route, the four SQL files, the
cron, `cloudinaryAdminRead.ts`, `cloudinaryDelete.ts`, `imageUrl.ts`, both actions, `deleteAccount.ts`, the CMS route,
the admin profile, the widget, the form shell, view, loader and pages, the fixtures, the sweep, every test and Story,
the four registries, `vercel.json`, `package.json`, `docs/env.md`, the four locale files);
`node_modules/next-cloudinary` 7.0.0 (`CldUploadWidget-088119fa.esm.js`, `cloudinary-ef6def0a.esm.js`) and
`@cloudinary-util/url-loader` `getUploadWidgetOptions` (`dist/index.js:1590-1617`). OWASP record:
`docs/security/owasp/reviews/Task_957.json`; the reference remapped first (Multi_Tenant_Security changed upstream to
f2116329: its new IDOR line mapped to `updateListing.ts`, `owasp sync` and `check` 0).
Tools (local, final tree): `dependencies` steps as `ci.yml` writes them 0 (`npx --yes npm@10.9.8 ci --ignore-scripts`,
both audit gates: 0 blocking); `quality` steps 0 (`npx --yes npm@10.9.8 ci`, `owasp check`, lint, typecheck, `node
--test "scripts/quality/*.test.mjs"` 174 pass 0 fail, `check-files.mjs --all` 14851 files 0 findings, Playwright
install, `product-gates.mjs` 36 of 36, but see F3); `check-ruleset.mjs` 0; `db-catalog-audit.mjs` "no finding" (the SQL
is not applied yet); `cloudinary-config.mjs` exit 1 with U1 only (expected until the owner's preset step). Task tests:
63 files, 751 passed, 2 failed (the two AC16 `ci.yml` cases, see F4). Breaks rerun, each restored (sha256 equal before
and after): the owner check (`route.ts:74`) 2 SEC-UPLOADSIG-SRV-DENY red; the owner prefix (`imageUrl.ts:40`) 4
SEC-UPLOAD-OWNER-DENY red; the byte sniff (`upload-cms-image/route.ts:48`) SEC-UPLOAD-SNIFF-DENY red; the cron secret
(`cloudinary-cleanup/route.ts:43`) SEC-CLEANUP-SRV-DENY red; the account-gone proof (`cloudinaryDelete.ts:284`) 2
SEC-PURGE-SRV-DENY red; the cancel on a failed signature (`ImageUpload.tsx:113`) 4 AC5 red; the two-hour age of the
sweep 4 AC16 red. Live: an upload signed as the route signs (SHA-256, no `signature_algorithm` field, `source=uw`)
passes Cloudinary's signature check (a broken signature of the same request answers 401 "Invalid Signature"; the probe
named a missing preset, so nothing was stored). UNKNOWN until the owner's steps: AC2 and AC4 on the real database, AC8.
UNKNOWN until `gh pr checks <n>`: the browser jobs, `authz`, CodeQL, secrets, workflows. Findings: High 1, Medium 1, Low
2.
Checked, no finding: a cross-site POST to the route carries no session (`@supabase/ssr` cookies are `sameSite: "lax"`,
`node_modules/@supabase/ssr/dist/main/utils/constants.js:6`) and gets 401; the body is read only after
`requireViewer()`.
Overall risk: the server side is sound (signature, limiter, owner checks, trigger, cleanup and purge each fail closed
and each break turns its test red), but the form cannot upload once the public preset is removed, which the owner's step
3 does.

F1 — `src/modules/listings/components/ImageUpload.tsx:201-210` gives `CldUploadWidget` neither `signatureEndpoint` nor
`uploadPreset`; `next-cloudinary` then passes `uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
(`CldUploadWidget-088119fa.esm.js:60`) and `getUploadWidgetOptions` throws "A Cloudinary Upload Preset is required for
unsigned uploads" when it is unset and no `uploadSignature` function is given (`url-loader/dist/index.js:1603-1606`). So
the listing form breaks after the build that follows the owner's removal of that variable, and until then the unsigned
preset's name stays in the client bundle. AC5 does not see it: `ImageUpload.test.tsx:31` mocks `next-cloudinary` whole.
Severity: High (availability of listing creation; the security goal cannot be completed). Category: Dependencies and
configuration. CWE-1188. Reproduction: the reviewer's probe calling `getUploadWidgetOptions` with the options the
component passes → built with the variable set, throws without it. Cause: the kickoff read only how `options` are spread
(design, Opus) and the test mocks the library (implementation). Status: Revision 1 R1-1, AC5.

F2 — the migrated files encode local visual decisions (`ui-token-contract.md` "Forbidden local visual decisions"):
`ImageUpload.tsx:160-161` (`radius="xl"`, `bd` with `2px solid` and `var(--mantine-primary-color-filled)`), `:225-226`
(`2px dashed var(--mantine-color-default-border)`, `bdrs="xl"`); `ListingFormShellView.tsx:90-91` (a page title and
subtitle with their own `fz`/`fw`, where `MantinePageHeaderWithActions` owns them), `:250` (`radius="2xl"`, own
padding); `ListingFormShell.tsx:277` (`color="var(--mantine-color-green-6)"`, `style`), `:281`, `:288` (title text by
`fw`/`fz`); the pages `create/page.tsx:24` and `[slug]/edit/page.tsx:148` (`bg="var(--mantine-color-gray-0)"`). AC15's
test refuses only `className` and `@/components/ui`, so the gates stayed green. Severity: Medium. Category: UI contract.
Status: Revision 1 R1-2, AC15.

F3 — the report gives `product-gates.mjs` exit 0 unlabelled; it ran with `HEAD` equal to `origin/main` (213103f0a) on an
uncommitted tree, so its diff-based checks compared a commit with itself; the report also says the three passes were not
completed on every file. Severity: Low. Category: Agent and tool output (facts rule). Reproduction: `git rev-parse HEAD
origin/main` → the same commit. Status: Revision 1 R1-4; the diff-based checks stay UNKNOWN until GitHub runs them.

F4 — the design of AC16 (Opus) put `SYNTHETIC_RUN_LOG: ${{ runner.temp }}/…` in the job `env`; GitHub's context table
lists `jobs.<job_id>.env` with "github, needs, strategy, matrix, vars, secrets, inputs" and `jobs.<job_id>.steps.env`
with `runner` (docs.github.com/en/actions/reference/workflows-and-actions/contexts), so the workflow would be invalid
and the test (`scripts/__tests__/sweep-synthetic.test.ts:170`) asks for it. Severity: Low. Category: Dependencies and
configuration. Status: Scope and AC16 corrected in the kickoff (Opus); Revision 1 R1-3.

Revision 1 (Sonnet; only these items; three passes over every file it changes, failing-first for each new case):
- R1-1 (F1) `ImageUpload.tsx`: give the widget a configuration that `getUploadWidgetOptions` accepts with
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` unset and whose uploads still carry only the route's signed parameters (read
  the widget reference for `prepareUploadParams` with a signed preset, and `CldUploadWidget-088119fa.esm.js` /
  `url-loader/dist/index.js:1590-1617`; cite what you read; the API key and preset name come from the route answer or a
  server prop, never a `NEXT_PUBLIC_` preset). AC5 extended: a test that runs the real `getUploadWidgetOptions` (not the
  `next-cloudinary` mock) with the exact options and props the component passes and the variable unset, and refuses any
  product file naming `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`; the Stories of `Patterns/Mantine/ImageUpload` render with
  the variable unset. Opus repeats the signed upload live (AC8) after the owner's preset step.
- R1-2 (F2) every literal listed in F2 goes: the form title and subtitle through `MantinePageHeaderWithActions`; the
  cover mark, the drop area border, the success icon, the page frame and the outer surface through their canonical owner
  (an existing pattern or theme token; where none exists, add it at the shared owner with its direct Story first,
  `canonical-component-reuse.md`). `listingFormMantine.test.ts` extended to refuse `style=`, `var(--mantine-`, a `px
  solid|dashed` literal and `fw=`/`fz=` on a heading text in the three files and two pages; the census of the changed
  Stories rerun.
- R1-3 (F4) `scripts/__tests__/sweep-synthetic.test.ts`: the AC16 workflow cases read `SYNTHETIC_RUN_LOG` from the `env`
  of each step that runs `test:security-integration` or `check-signed-in-pages` and of the final sweep step, as the
  corrected Scope says; they stay red until Opus adds the steps.
- R1-4 (F3) the report: three passes over every changed file completed and said so; a diff-based gate run on an
  uncommitted tree is labelled "empty diff, UNKNOWN until GitHub".

Opus, before Review 2: AC9 (`db-sql-roundtrip.mjs`), AC10 (U3, U4 and their self-test), the AC16 steps in `ci.yml` as
the corrected Scope says, AC17 (`ci.yml` cache steps and `ci-browser-cache.test.mjs`). The owner: apply the SQL and
create the signed preset with `CLOUDINARY_LISTING_PRESET` as Route step 5 says; `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
and the unsigned preset stay until R1-1 is approved.
