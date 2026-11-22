# Task 957 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 2 of the working tree on 213103f0a (uncommitted) — NEEDS REVISION (2 of 2)
Correction, 2026-11-20: the first version of this review gave APPROVED WITH NOTES after confirming an exemption without
reading what it hid; on the owner's question every exemption, baseline and check target the diff changes was then
audited and the reviewer census of `.claude/rules/shared/rendered-state-census.md` (never run in the first version) was
run (F7-F9). On the owner's second rejection the review was done again: every changed front-end file and Story read
in full against `main`, every removed test case compared, the rule "One meaning, one look" of `ui-token-contract.md`
(skipped in the first versions) applied to every element the diff changes by reading its other owners in `src` (the
built-Storybook `GR-12 ELEMENT PARITY` receipts are required of Revision 2, R2-8), and six renders of the changed Stories
looked at by the reviewer (`Staff` uk 320 closed and with the status list open, `WithErrors` sq 320, `ImageUpload`
`WithPhotos` uk 320 and `LimitReached` it 320, `Staff` en 1440) (F10-F15). The verdict is changed and Revision 2 is the second and last revision.
Scope: Revision 1 (R1-1 … R1-4): every file it changed or added, each read in full (`ImageUpload.tsx`,
`cloudinaryWidgetConfig.ts`, `ListingFormShell.tsx`, `ListingFormShellView.tsx`, `ListingFormLoader.tsx`, both pages,
the three Stories, `scripts/check-locale-leak.mjs`, and the tests `ImageUpload.widgetOptions.test.tsx`,
`cloudinaryWidgetConfig.test.ts`, `ListingFormShell.cloudinaryConfig.test.tsx`, `listingFormMantine.test.ts`,
`ImageUpload.test.tsx`, `ListingFormLoader.test.tsx`, `createPage.test.tsx`, `editAccessRestricted.security.test.ts`,
`ListingFormShellView.controls.test.tsx`, `sweep-synthetic.test.ts`); `next-cloudinary` 7.0.0
(`CldUploadWidget-088119fa.esm.js`, `cloudinary-ef6def0a.esm.js:112-131`) and the widget loader
`https://upload-widget.cloudinary.com/global/all.js` (read 2026-11-20). Opus's own parts, written before this review
and passed through three clean full passes before their green runs: `.github/workflows/ci.yml` (AC16 sweep steps, AC17
browser cache), `scripts/quality/ci-browser-cache.test.mjs` (new), `scripts/quality/cloudinary-config.mjs` U3 and U4 with
`cloudinary-config.test.mjs`; `docs/env.md` (the API key line). The rest of the branch was read in Review 1.
Tools (local, final tree): `dependencies` steps as `ci.yml` writes them 0 (`npx --yes npm@10.9.8 ci --ignore-scripts`,
both audit gates 0 blocking); `quality` steps 0 (`npx --yes npm@10.9.8 ci`, `owasp sync --verify`, `owasp check`, lint,
typecheck, `node --test "scripts/quality/*.test.mjs"` 188 tests 185 pass 3 skipped 0 fail, `check-files.mjs --all`
14856 files 0 findings, Playwright install, `product-gates.mjs` 36 of 36 with `BASE_SHA=origin/main HEAD_SHA=HEAD`:
empty diff on an uncommitted tree, so its diff-based checks stay UNKNOWN until GitHub); `check-ruleset.mjs` 0; `uvx zizmor
.github/workflows/ci.yml` (1.32.0) no findings, the one suppression the same as on the original file. Task tests: 97
files, 1549 passed, 2 failed before the `ci.yml` steps (the two AC16 cases); after them `npx vitest run
scripts/__tests__/sweep-synthetic.test.ts` 13 of 13. Failing first, on the original `ci.yml` and script:
`ci-browser-cache.test.mjs` 0 of 3, the AC16 cases 2 red, `cloudinary-config.test.mjs` "does not provide an export named
'checkReferences'". Breaks rerun, each red and restored (sha256 equal): `uploadSignature` removed 6 red; the cloud name
dropped 6; `canBuildUploadWidget` always true 8; Shell 2; View 1; create page 1; a `style` on the success icon 1; `fw` on
a title 1; a dashed `bd` 1; a local `h1` 11; a public preset named in a page 2. Live (read-only): `cloudinary-config.mjs`
exit 1 with U1 only (the unsigned preset `lero-al`, removed by the owner after the deploy); U3 holds for the preset named
by `CLOUDINARY_LISTING_PRESET` (signed, `jpg,jpeg,png,webp`, `c_limit,w_2560,h_2560`); U4: 205 stored Cloudinary
addresses, every asset exists. AC9: `db-sql-roundtrip.mjs` exit 0 on the files as committed (CRLF), on an LF copy and on
a doubled-CR copy ("the rollback restores the catalog (15 catalog row(s) changed by the change file)"); sha256
`task957.sql` dea616ce91d667cbec6ba23fc49cd1a565c4c121a1f3a17a383088854bb5de51, `task957-rollback.sql`
cf0a5bda1203ef417130ad41c0a7c397d3eb838a7f9af8edb0db2d00fd2a5635; `task957-preflight.sql` in a read-only transaction:
rows 1, 2 and 3 each 0. Vercel (names only, MCP read): `CLOUDINARY_LISTING_PRESET` set for production and preview,
`CLOUDINARY_API_KEY` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set for production. UNKNOWN until the owner applies the
SQL: AC8 (its route calls `consume_rate_limit`, which the preflight shows absent), AC2 and AC4 on the real database, the
AC9 catalog audit and `supabase/catalog.json`. UNKNOWN until `gh pr checks <n>`: the browser jobs, `authz`, CodeQL,
secrets, workflows, the OWASP gate on the pushed diff.
Census (reviewer, 2026-11-20, on a fresh `npm run build-storybook`, exit 0): `node scripts/check-rendered-state-census.mjs
--stories <the 24 Stories of Patterns/Mantine/ListingFormShellView, ListingFormShellContainer, ImageUpload and
AdminUserProfileView>` exit 0 (3224 rows, 55 registered states, 0 violations, 1860 s) — green only over the rows
that exist; the discovery of the same 24 Stories (the repository's own `discover()` over an index
narrowed to them, scratch wrapper; `--discover` has no `--stories` option) exit 1: one unregistered Story, and 144
candidate triggers "not operable": 92 under the registered mount dialog of `CancelConfirmation`, 52 in seven other
form Stories (F9).
Findings: Critical 0, High 0, Medium 0, Low 11 (F5 and F7-F15 to Revision 2; F6 to Task 997).
Overall risk: Review 1's four findings are closed and each closing has a test that turns red without it; no security
exposure remains, but the visible part is not proven: two legacy children stay behind an allowlist, the open status
control lost its proof, the census could not operate most of the form, a refused upload is not explained, the photos stay
editable during a save, the photo controls are not told apart by a screen reader, and the migrated form still draws
one meaning several ways (F10-F15).

Review 1 findings: F1 closed — `ImageUpload.tsx:214` names the API key and cloud name the page read on the server, so
`getCloudinaryConfig` (`cloudinary-ef6def0a.esm.js:120-131`, `Object.assign` with the passed `config` last) uses them, and
`uploadSignature` makes `getUploadWidgetOptions` treat the upload as signed without any public preset; the loader takes
`prepareUploadParams||uploadSignature`, so the route's answer signs every upload and `refuseBrowserSignature` is never
called (the report's UNKNOWN, resolved from the loader text). F2 closed — the literals are gone (`listingFormMantine.test.ts`
refuses `style=`, `var(--mantine-`, `px solid|dashed`, `radius|bdrs|bd|bg=` and a heading `fw`/`fz` outside `TITLE_FZ`;
breaks above); the dashed drop area is now the default Button, an existing canonical component, which the owner sees as a
visible change. F3 closed — the report labels the diff-based run and the three passes. F4 closed — the AC16 cases read the
step env and pass with the two `ci.yml` steps. The `check-locale-leak.mjs` tokens of Sonnet's report: "ALL" is
the lek's ISO code in every locale (as `patterns-mantine-admintable` allows) and "Gas" is the Italian `listing.heating_gas`
(`messages/it.json:69`; sq "Gaz", uk "Газове"), both correct. "Upload Widget" is English text the loader writes into the
form's page as the frame title (`title:"Upload Widget"`, `data-test:"uw-iframe"`), read by a screen reader in every
locale: the token keeps CI green but hides that text, so it is part of F6 and leaves the table in Task 997.

Exemption audit (2026-11-20, `git diff main` of every allowlist, baseline, registry and check-target file; each entry read
against what it covered on `main`): `scripts/check-locale-leak.mjs` — above. `scripts/rendered-scope-allowlist.json` —
`[]` became two entries, `DynamicFieldSection.tsx` (owner "Task 905") and `AdminEditLayout.tsx` (owner "Task 907"):
F8. `scripts/responsive-screenshots.mjs` — the target `listings-listingformshellview--staff-status-control-open` removed
with no replacement: F7. `scripts/check-stories-rendered.mjs` — the two ids renamed to
`patterns-mantine-listingformshellview--owner` and `--staff`, both in `storybook-static/index.json`: correct.
`scripts/type-responsive-baseline.json` — the `ListingFormShellView.tsx :: text-2xl` row removed, the file no longer has
the class: a tightening. `scripts/mantine-migration-scope.json` — the three components enrolled: a tightening.
`scripts/rendered-interaction-states.json` — 206 lines added, none removed, no `exempt*` or `ownerDecision` field: rows
for the new Stories' property-type and year pickers and the cancel dialog; no row for the status select of `Staff` and
`OwnerStatusControl` (F7) nor for `AdminUserProfileView` `EditAgent` (F9). No `skip`, `.only`, `eslint-disable` or
`@ts-ignore` added (`git diff main -U0` searched). Removed test cases (every changed test file against `main`):
`imagePayload.test.ts` 3 removed and 3 added, the same cases with the owner argument; `ImageUpload.test.tsx` the case
asserting `uploadPreset` and `folder` replaced, its option assertions kept at `:68`: no weakening. Every changed
front-end file has 0 `className`, 0 `@/components/ui`, 0 `cn` and 0 `style={{`; `ImageUpload.module.css` (the hover
overlay) deleted with the overlay: the controls are now always visible under the image (a phone has no hover).

F5 — the photo upload disappears without a word when it cannot be built
Severity: Low      Category: Error handling      CWE: CWE-755
Location: src/modules/listings/components/ImageUpload.tsx:210
Description: with an empty API key or cloud name `canBuildUploadWidget` is false and nothing renders in the button's
place, while `ListingFormShell.tsx:190-191` still requires a photo before publishing.
Impact: in an environment missing either value a person is told to add a photo and has no way and no reason; no data or
access is exposed (production has both values, Vercel read above).
Reproduction: the passing case "[AC5] without %s no widget is offered" (`ImageUpload.test.tsx:139-147`) renders with
`{ apiKey: '', cloudName: 'demo-cloud' }` → no widget is built, and `ImageUpload.tsx:209-249` render nothing else in its
place.
Recommendation: the canonical error state in place of the button, with a message in four locales.
References: OWASP Error_Handling; `.claude/rules/shared/canonical-component-reuse.md`.
Status: Revision 2 R2-4 (kickoff Scope, AC21); this task created the hole, so it closes it (first filed to Task 997, moved back 2026-11-20).

F6 — the upload window opens in English for every locale
Severity: Low      Category: UI contract (localization)      CWE: none
Location: src/modules/listings/components/ImageUpload.tsx:215-224
Description: the widget options pass neither `language` nor `text`; the widget reference gives `language` "Default: en";
pre-existing (the widget had no language before this task).
Impact: Albanian, Ukrainian and Italian readers get an English upload window inside a localized form, and a screen
reader names its frame "Upload Widget" in every locale (the loader's fixed `title`, exempted in `check-locale-leak.mjs`).
Reproduction: `grep -c "language" src/modules/listings/components/ImageUpload.tsx` → 0; `curl -s
https://upload-widget.cloudinary.com/global/all.js | grep -o 'title:"Upload Widget"'` → `title:"Upload Widget"`.
Recommendation: `language` from the page locale and `text` from the message files, the key list read from the reference;
the frame's title set from the message files once the frame exists, and the "Upload Widget" token removed from the
three Stories' entries.
References: `.claude/rules/shared/project-language.md`; cloudinary.com/documentation/upload_widget_reference.
Status: task 997 (Scope "F6", AC6), added 2026-11-20.

F7 — the open staff status control lost its proof
Severity: Low      Category: UI contract (test coverage)      CWE: none
Location: scripts/responsive-screenshots.mjs (the removed target), scripts/rendered-interaction-states.json
Description: `main` proves the staff status control open as a bottom sheet at 320 (the legacy Story
`StaffStatusControlOpen`, `git show main:src/modules/listings/components/ListingFormShellView.stories.tsx` lines 119-143,
Task 427, and its screenshot target in uk at 320, 375 and 390). The revision removed the Story and the target; the new
Stories render the control closed and the registry has no row that opens it.
Impact: the open list (seven statuses for staff, read 2026-11-20 by clicking it in the built Story) is measured by no gate
at any width or locale.
Reproduction: `git diff main -- scripts/responsive-screenshots.mjs` → the target removed; `grep -c
"listingformshellview--staff~" scripts/rendered-interaction-states.json` → the year and property-type rows only.
Recommendation: registry rows that open the status select of `Staff` and `OwnerStatusControl`, measured by the census;
the census saves no image and `scripts/responsive-screenshots.mjs` shoots a Story as it renders (`:296-309`), so the
mobile render also returns: a screenshot target opens a registry row before its shot (added 2026-11-20 on the owner's
question; the first version of F7 restored only the measurement).
References: `.claude/rules/shared/rendered-state-census.md` §1-§2.
Status: Revision 2 R2-3 (kickoff Scope, AC20).

F8 — two legacy children of the migrated form stay behind an allowlist
Severity: Low      Category: UI contract (legacy)      CWE: none
Location: scripts/rendered-scope-allowlist.json
Description: the kickoff (Opus's design, Scope "Legacy leaves with this change") kept `DynamicFieldSection` (Task 905)
and `AdminEditLayout` (Task 907) legacy and allowlisted. `AdminEditLayout` is rendered only by
`ListingFormShellView.tsx` (`grep -rln AdminEditLayout src` → the component, the view and its Story), so the entry's
reason, "shared with the admin edit screens", is false, and Task 907 has no kickoff (reserved in
`docs/backlog-reserved.md`); `DynamicFieldSection` (one `className`) renders the nine fields of `form/`, each with `className`
(3 to 8 per file) and `@/components/ui` imports (1 to 3 per file; `grep -c` per file).
Impact: the migrated form still renders Tailwind and the ui kit, hidden from `check:rendered-scope`.
Reproduction: `cat scripts/rendered-scope-allowlist.json` → the two entries; `git show main:scripts/rendered-scope-allowlist.json` → `[]`.
Recommendation: the owner chose 2026-11-20 (option "Both now") to migrate both in this task.
References: `.claude/rules/shared/canonical-component-reuse.md`; owner rule 2026-11-19 "legacy leaves with every change".
Status: Revision 2 R2-1 and R2-2 (kickoff Scope, AC18, AC19); Task 905 taken over, `AdminEditLayout` leaves Task 907.

F9 — the census cannot see the upload window and then cannot operate the rest of the form
Severity: Low      Category: UI contract (gate)      CWE: none
Location: scripts/rendered-state-census/discover.mjs:107-130, scripts/rendered-interaction-states.json
Description: clicking "Add more" opens the Cloudinary widget as a full-viewport frame outside any `[data-portal="true"]`
root (`iframe[title="Upload Widget"]` 390×844, `z-index` 1000000, probe on the built `Staff` Story at 390); `clickThrough`
counts 0 portals, sees the app root unchanged, does not reload, and every later trigger times out under the frame
("not operable", 52 over `ListingFormShellView` `Owner`, `Create`, `Staff`, `OwnerStatusControl`, `WithErrors`,
`Submitting` and `ListingFormShellContainer` `Create`: the address fields, Save, Cancel and "Change status"); a
not-operable trigger does not fail the discovery. The three tried alone ("Location", "Cancel" and "Change status" of
`Staff` at 390) each click in a fresh load, and "Change status" opens a portal of seven options. The registry row of
`CancelConfirmation` declares `"dismiss": []` because the Story leaves `onCancelDialogChange` a no-op, while the product
closes the dialog through it (`ListingFormShellView.tsx:286` → `ListingFormShell.tsx:341` `setShowCancel`), so Escape and
the close control are measured nowhere; the row cites `adminuserprofiledialogsview--cancel` as its precedent. Separately,
`AdminUserProfileView` `EditAgent` (a Story on `main`, rendering the component this task changes) has no registry row
while six of its triggers open portals (menu, country, city, role, status at 390; the language menu at 1440).
Impact: the registry completeness proof for the changed Stories is void, which is how F7 passed unseen.
Reproduction: the discovery above → `unregisteredTriggers`: `patterns-mantine-adminuserprofileview--edit-agent` and 144
`notOperable`; the probe: click "Add more", then "Cancel" → `locator.click: Timeout 2500ms exceeded`.
Recommendation: `clickThrough` reloads the Story after any click that makes an element outside the app root visible and
reports that element; a not-operable trigger fails `--discover`; a `--verify-gate` fixture of a button opening a fixed
full-screen frame outside `[data-portal]`; the registry rows of `EditAgent`; the two dialog Stories keep their open
state in a demo wrapper so the census measures their dismissal.
References: `.claude/rules/shared/rendered-state-census.md` §2 ("an unregistered overlay is a gap, not a pass").
Status: Revision 2 R2-5 (kickoff Scope, AC20).

F10 — a refused photo signature cancels the upload without a word
Severity: Low      Category: Error handling      CWE: CWE-755
Location: src/modules/listings/components/ImageUpload.tsx:124-130
Description: on 401, 403, 429, 503 or no network `prepareUploadParams` answers `{ cancel: true }` and nothing else; the
test asserts exactly that (`ImageUpload.test.tsx:114-124`).
Impact: a person past the 30-per-10-minutes limit, or whose session ended, sees the upload stop with no reason.
Reproduction: the case "a refused request" (`ImageUpload.test.tsx:114`, 429) asserts only `{ cancel: true }`;
`ImageUpload.tsx:124-130` calls nothing else on a refusal.
Recommendation: the canonical `toast` with one message per case, four locales.
References: OWASP Error_Handling.
Status: Revision 2 R2-6 (kickoff Scope, AC22).

F11 — photos and fields stay editable while the form is saved
Severity: Low      Category: Business logic (state)      CWE: CWE-362
Location: src/modules/listings/components/ListingFormShellView.tsx:221, src/modules/listings/components/ImageUpload.tsx:187-199
Description: the view passes no `disabled` to `ImageUpload` and the photo controls never read it; only Save and Cancel are
disabled (`:256`, `:261`); `main` had the same (`git show main:…/ListingFormShellView.tsx` line 253), kept by the migration.
Impact: the payload takes `data.images` before the save is awaited (`ListingFormShell.tsx:247`, `await updateListing` at
`:251`) and the page leaves 3 s after a success (`:264`), so a photo added, moved or removed in that time is not saved
while the form shows it.
Reproduction: `ListingFormShellView.tsx:221` renders `ImageUpload` with `images`, `onChange`, `listingId` and `cloudinary`
only; at `ImageUpload.tsx:187-199` only the first "up" and the last "down" control are ever disabled.
Recommendation: with `submitting` every field, the upload and every photo control disabled.
References: `.claude/rules/flow.md` (golden rule: a gap in a changed file is closed).
Status: Revision 2 R2-7 (kickoff Scope, AC23).

F12 — every photo's controls share the same names
Severity: Low      Category: Accessibility      CWE: none
Location: src/modules/listings/components/ImageUpload.tsx:187-199
Description: "Move up", "Move down", "Set as cover" and "Remove photo" repeat on every tile, with `alt=""` on the image.
Impact: a screen-reader user cannot tell which photo a control moves or removes.
Reproduction: each control's `aria-label` is `t('reorder_up')`, `t('reorder_down')`, `t('set_as_cover')` or
`t('remove_photo')` with no photo number (`ImageUpload.tsx:187-199`); `ImageUpload.test.tsx:146` finds them by the bare key.
Recommendation: each name carries the photo's number.
References: WCAG 2.2 success criteria 2.4.6 and 4.1.2; `.claude/rules/shared/mobile-adaptation-contract.md` (`form-stack`: label and control remain associated).
Status: Revision 2 R2-7 (kickoff Scope, AC23).

F13 — local visual decisions and two looks for one meaning in the migrated form
Severity: Low      Category: UI contract (GR-12)      CWE: none
Location: src/modules/listings/components/ListingFormShellView.tsx:108-120, :126, :145-151, :168, :176-186, :222, :229,
:246, :254, :268; src/modules/listings/components/ImageUpload.tsx:199, :237, :239, :243-244, :253;
src/components/admin/StatusChangeSelect.tsx
Description: the photo error is a local red centred text while every other error is a field error; the title hint is
both placeholder and a local text; the status label is a local bold text and the note has no label; the listing type and
currency are local button pairs while the fields' single choices become `FilterChoiceGroup` (Task 905 R4, taken over); the
sidebar card copies the section card's padding without its radius; label wrappers add `mt="xs"`; the submit alert is
centred; the upload button sets its own text weight and size; the counters and photo hints are local dimmed texts; the
photo delete control is `light`/`lg` where the other Mantine delete icon actions are `subtle`
(`AdminPagesView.tsx:113`, `CollectionsSection.tsx:161`); at 320px the cover tile and the other tiles arrange their
controls differently, and the selected condition is a light red pill while the selected heating, listing type and
currency are filled red (`form/EnumSelectorField.tsx:47`; reviewer renders). No GR-12 receipt was given or asked for.
Impact: the owner sees the same meaning drawn in several ways inside one form; the note field is unlabelled.
Reproduction: the lines above; the reviewer's renders of `Staff` (uk 320, en 1440), `WithErrors` (sq 320) and
`ImageUpload` `WithPhotos` (uk 320).
Recommendation: as the kickoff Scope "One meaning, one look" lists, with the GR-12 receipts.
References: `.claude/rules/shared/ui-token-contract.md`; `.claude/rules/shared/canonical-component-reuse.md`.
Status: Revision 2 R2-8 (kickoff Scope, AC24).

F14 — the Stories show no photo and miss states of the form
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx:38-39, :107-125; src/stories/patterns/mantine/ImageUpload.stories.tsx:14
Description: the photo fixtures are `example.com` addresses, so every tile is grey in every render; `WithErrors`
omits the floor errors (`ListingFormShell.tsx:197-199`); no composition Story shows the photo limit or F5's state.
Impact: the owner's visual check of the photo grid and of the floor error has nothing to look at.
Reproduction: the reviewer's renders above (grey tiles at 320 and 1440).
Recommendation: labelled fixture images served by the Storybook build, the floor error, the two photo states.
References: `.claude/rules/shared/storybook-proof.md`; `.claude/rules/shared/ui-token-contract.md` (fixture data labelled).
Status: Revision 2 R2-9 (kickoff Scope, AC25).

F15 — the kickoff contradicts itself on the fields' layout on a phone
Severity: Low      Category: UI contract (mobile)      CWE: none
Location: the kickoff Scope (Revision 2) and its Mobile adaptation record
Description: the record says "the listing form one column with full-width fields" below 640px and names `form-stack`
("fields are one column"), while Task 905, taken over, gives the group grid `SimpleGrid cols={{ base: 2, sm: 3 }}` (R6)
and the area and floor pairs `SimpleGrid cols={2}` (R2); the reviewer's 320px render of `WithErrors` shows the fields
of today two per row. Opus's design defect.
Recommendation: one column below 640px for the grid and the pairs; the kickoff corrected.
References: `.claude/rules/shared/mobile-adaptation-contract.md`.
Status: Revision 2 R2-10 (kickoff Scope, AC26).

Revision 2 (Sonnet; only these items; the second and last revision of this task, `flow.md` §3; three passes over every
file it changes, failing-first for each new case):
- R2-1 (F8) `AdminEditLayout.tsx` on Mantine as the kickoff Scope (Revision 2) and AC19 say, with the three new
  `theme.other.layout` keys; its entry leaves `scripts/rendered-scope-allowlist.json`.
- R2-2 (F8) the field layer of Task 905 as its kickoff §3.2, §3.3 and R1-R9 say (taken over; its §13 hashes are of
  2026-09-30, read the files again): the nine fields and `DynamicFieldSection` on Mantine, `FilterChoiceGroup` and
  `YearCombobox` enrolled, `steps/` and the legacy `NumInputField` Story deleted with their baseline rows,
  `Patterns/Mantine/ListingFormFields` and `Mantine/Primitives/Combobox` `YearCombobox`, `fieldContracts.test.tsx` with
  its two breaks; `scripts/rendered-scope-allowlist.json` back to `[]` (AC18).
- R2-3 (F7) registry rows opening the status select of `Patterns/Mantine/ListingFormShellView` `Staff` and
  `OwnerStatusControl`; `scripts/responsive-screenshots.mjs` targets accept `open: <row id>` (click the row's selector,
  wait for a visible portal root, shoot; exit 1 when nothing opens), and the two status targets return in uk at
  mobile-320, mobile-375 and mobile-390 (AC20).
- R2-4 (F5) the upload-unavailable error state and its four-locale texts (AC21).
- R2-5 (F9) `scripts/rendered-state-census/discover.mjs` (named here, so this task may change it): reload after a click
  that makes anything outside the app root visible, and report it; a not-operable trigger fails `--discover`; a
  `--verify-gate` fixture for both; registry rows for `AdminUserProfileView` `EditAgent` and every Story the
  revision adds or changes (`Patterns/Mantine/ListingFormFields` included); `--discover` and the census over every
  changed Story exit 0 on the final build, both outputs saved; `Patterns/Mantine/ListingFormShellView`
  `CancelConfirmation` and `adminuserprofiledialogsview--cancel` hold their open state in a demo wrapper (as
  `WithErrorsDemo` does) and their rows declare the dismissals Mantine supports (AC20).
- R2-6 (F10) a refused signature explained through the canonical `toast`, one message per case (AC22).
- R2-7 (F11, F12) every field and photo control disabled while saving; each photo control named with its photo (AC23).
- R2-8 (F13) every item of the kickoff Scope "One meaning, one look", the canonical delete icon action with its Story and
  its three consumers, the `StatusChangeSelect` `label` and note label, the GR-12 receipts (AC24).
- R2-9 (F14) fixture images that load, the floor error in `WithErrors`, the limit and upload-unavailable states in the
  composition (AC25).
- R2-10 (F15) one column below 640px for the field grid and its pairs (AC26).
If Review 3 finds Revision 2 incomplete, the proposal to the owner is a scope cut: R2-2 returns to Task 905 with its
kickoff, and Task 957 merges with `DynamicFieldSection` allowlisted to 905 by an owner decision.

Open parts, in order:
0. Sonnet runs Revision 2 (`.claude/skills/execute-task/SKILL.md`); Opus reviews it (Review 3).
1. The owner applies `supabase/sql_migrations/task957/task957.sql` (Supabase SQL Editor), after `task957-preflight.sql`
   shows 0 in all three rows, then runs `task957-verify.sql` (every row `ok = true`).
2. Opus runs AC8 (`src/tests/integration/cloudinarySignedUpload.integration.test.ts` with `.env.local`), the AC9 catalog
   audit (no I1, no I3) and refreshes `supabase/catalog.json`; a failure is fixed in this pull request.
3. The owner commits, pushes and opens the pull request; Opus reads `gh pr checks <n>` until every check concludes and runs
   the read-only sweep of AC16 (`--dry-run`).
4. After the merge and the production deploy: the owner deletes the unsigned preset `lero-al` and
   `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (production and preview); Opus reruns `cloudinary-config.mjs` (expects no
   finding) and reads AC17's two `main` runs (the first writes the browser cache, the second restores it).
