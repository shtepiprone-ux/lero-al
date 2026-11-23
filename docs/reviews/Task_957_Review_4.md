# Task 957 — Review 4

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 4 of Revision 3, working tree on da4470783 (uncommitted) — NEEDS REVISION (4; beyond the two `flow.md` §3
allows, so the owner gets a proposed scope cut below)
Executor report: `docs/sessions/2026-11-21-task957-revision3-executor-report.md` (a supplier assertion; each claim used
here was rerun or read in the code).
Tools (local, 2026-11-21): `npx --yes npm@10.9.8 ci` in the owner's folder → exit 0, 1109 packages (this restores the
`node_modules` the executor's run left with 143 packages; no Storybook process was running: `Get-CimInstance
Win32_Process node.exe` listed only MCP servers); `node scripts/quality/owasp.mjs sync` → 0 changed; `owasp.mjs check`
→ exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches; `node scripts/check-ui-contract.mjs
--base origin/main` → exit 1 (F29); `npx vitest run` over the 18 changed or new test files → 18 passed, 382 tests;
deliberate break `isEditModeration = false && …` (`applyListingTransition.ts:285`) → `ownerPublish.security.test.ts`
1 failed (`[SEC-O957-10-SRV-EDIT]`), restored → 7 passed; `owasp.mjs review <kickoff> --base main` → exit 0.
Not run, stated as not done (the verdict returns the tree; Review 5 runs them on the revised tree): the remaining steps
of the `quality` and `dependencies` jobs, `db-sql-roundtrip.mjs` on the parking SQL, `db-catalog-audit.mjs` (no SQL of
this revision is applied), every rendered Story check (owner order 2026-11-21).
Read in full: `applyListingTransition.ts` (from :230), `updateListing.ts`, `listingTransitionEngine.ts` (from :200),
`changeListingStatus.ts`, `ImageUpload.tsx`, `ListingFormShell.tsx`, `validateListingForm.ts`, `ParkingField.tsx`,
`uploadFailure.ts`, the three parking SQL files. Read through their diff hunks only: `ListingFormShellView.tsx`,
`MantineDeleteIconButton.tsx`, `NumberTextInput.tsx`, `input-chrome.css`, `theme.ts`, `route.ts`, `edit/page.tsx`,
`validations/index.ts`, `propertyTypeSchema.ts`, `constants/index.ts`, `listingFields.ts`, `types/form.ts`,
`database.ts`, `fieldRegistry.ts`, `listingStatusOptions.ts`, the two fixtures, `Card.stories.tsx`,
`ListingDetailView.stories.tsx`, `mantine-migration-scope.json`. Not read: the other changed tests and Stories and the
four `messages/*.json`; Review 5 reads every file of the revised tree in full.
Findings: Critical 0, High 1 (F27), Medium 3 (F28, F29, F31), Low 3 (F30, F32, F33).
Overall risk: no new hole for an attacker; the owner's status rule leaves every owner without a way back to
publication, a parking change on edit fails the save, and `CI Required` cannot pass (`check:ui-contract`).

F27 — after O957-10 an owner can never get a hidden, archived, sold, rented or expired listing published again
Severity: High      Category: Business logic (approved behaviour)      CWE: CWE-840
Location: src/modules/listings/domain/listingTransitionEngine.ts:217; src/modules/listings/actions/changeListingStatus.ts:36-40
Description: `STAFF_ONLY_TARGET_STATUSES` is now `['active', 'pending']`, so `canOwnerSetStatus` refuses both for an
owner. The owner's only status path is the form's status control (`edit/page.tsx:101-102`, `canManageStatus` for the
owner) through `changeListingStatusAction` (`grep` of `changeListingStatusAction|getAllowedTargetStatuses` over `src`:
no other caller; the cabinet actions have no status action). An owner edit moves only a visible listing to review
(`updateListing.ts:109`). D8 kept `pending` for this: "a listing the owner wants back goes to `pending` and waits for
a check" (`git show HEAD:src/modules/listings/actions/applyListingTransition.ts`, the comment the diff replaces).
Impact: once a listing is hidden, archived, marked sold or rented, or expires, its owner cannot send it back; only staff
can. The owner's words ("The owner cannot review the listing and publish it") name the label "Under review", not this.
Reproduction: owner of an `inactive` listing → the status control offers `sold`, `rented`, `archived`, `expired` and no
`pending` or `active` (`getOwnerTargetStatuses`, `listingTransitionEngine.ts:225-227`); the gateway refuses `pending`
(`[SEC-O957-10-SRV-DENY]`).
Recommendation: the owner decided O957-11 (below); the code follows it with a test per status.
References: OWASP Business_Logic_Security; `.claude/rules/flow.md` approved-behaviour rule.
Status: Revision 4 R4-1.

F28 — changing the parking kind of an underground parking on edit fails the save; a parking can never be removed
Severity: Medium      Category: Business logic (data integrity)      CWE: CWE-20
Location: src/modules/listings/components/ListingFormShell.tsx:203; src/modules/listings/actions/updateListing.ts:119-128; supabase/sql_migrations/task957/task957-parking.sql:15-17
Description: choosing another kind clears the floor in the form (`ParkingField.tsx:32`), and the submit then sends
`parking_floor: undefined` (`ListingFormShell.tsx:203`). `updateListing` spreads `parsed.data` into the update, and
postgrest-js serialises the body with `JSON.stringify` (`node_modules/@supabase/postgrest-js/dist/index.mjs:264`), which
drops an `undefined` key, so the stored floor stays. A row with `parking_type = 'city'` and `parking_floor = -2` breaks
`listings_parking_floor_check` (the SQL is not applied; INFERENCE from its text: the save answers `update_failed`). On
an active listing the move to `pending` has already happened (`updateListing.ts:109-117`), so the listing also leaves
publication. Deselecting the kind sends two `undefined` keys, so a parking once saved can never be removed. The same
`undefined` path keeps every other optional field the person empties (`main` behaviour; the executor's report 7.2
item 7).
Impact: an owner who corrects the parking kind cannot save the listing, and an active one is hidden by the attempt.
Recommendation: the update writes every optional field the form left empty as empty (O957-13, below); a test of the
edit from (underground, -2) to (city) and to no parking.
Status: Revision 4 R4-2.

F29 — `CI Required` cannot pass: `check:ui-contract` fails
Severity: Medium      Category: Quality gate      CWE: none
Location: scripts/ui-contract-registry.json; src/stories/patterns/mantine/{AdminEditLayout,DeleteIconButton,FormSectionStack,ListingFormFields}.stories.tsx
Description: `node scripts/check-ui-contract.mjs --base origin/main` → exit 1: 18 × "newly enrolled component lacks
an explicit UI contract" (`ImageUpload`, `ListingFormShell`, `ListingFormShellView`, the 11 `form/*` files,
`AdminEditLayout`, `FilterChoiceGroup`, `YearCombobox`, `MantineDeleteIconButton`) and 8 × `story-wrapper-presentation`
(`gap` on a wrapper `Stack`/`Group`: `AdminEditLayout.stories.tsx:28`, `:40`, `DeleteIconButton.stories.tsx:26`, `:39`,
`FormSectionStack.stories.tsx:83`, `ListingFormFields.stories.tsx:40`, `:104`, `:126`). The check runs in the `quality`
job (`scripts/quality/product-gates.mjs:49`, `.github/workflows/ci.yml:96`). It reads the manifest of the committed
`HEAD` (`check-ui-contract.mjs:297-300`), which is why `ParkingField.tsx` is not listed yet; after the commit it is the
19th. Revisions 1-2 created these; Reviews 1-3 did not run the `quality` job (stated in Review 3), so they were not seen.
Recommendation: a registry entry per component (direct Story, token owners, parity, `check-ui-contract.mjs:223-270`);
the Story spacing moved out of the wrappers without changing what the owner accepted.
Status: Revision 4.

F30 — the Discard jump (F25, AC34) is not fixed
Severity: Low      Category: UI contract (interaction)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx (`CancelConfirmation`)
Description: the executor's frame-by-frame measurement in Chromium at 320 and 390 shows no change of `scrollY`, the
`h1` position or the document height; only `body` `overflow` and the focus change (report 5.2). Cause UNKNOWN; AC34 has
no test.
Recommendation: measure in Windows Chrome with its classic scrollbar, in the Story and on the edit page (O957-12).
Status: Revision 4 R4-5.

F31 — work outside the kickoff, and two acceptance criteria the code now contradicts
Severity: Medium      Category: Process (scope)      CWE: none
Location: the kickoff's Scope "Revision 3" and AC27, AC32
Description: on the owner's instructions in the executor's session (report 4.1-4.4), Revision 3 also delivers O957-10
(F27), O997-2 (the upload error texts, `uploadFailure.ts`, `Retry-After` on a 429, `route.ts:90-91`), O1001-2 (the
parking: an enum, two columns, a CHECK and grants in `task957-parking*.sql`, `ParkingField.tsx`, the schemas), the
number fields as `TextInput type="number"` with the browser's arrows (`input-chrome.css`, against AC27's
`NumberInput`) and the number badge without `circle` (against AC32, `main` `ImageUpload.tsx` `variant="count" circle`).
None has a dated decision in the kickoff, an AC or a threat line; the parking is partial (no listing page, no filter,
no SQL round trip, no catalog refresh) and couples the deploy to the SQL (`edit/page.tsx:67` selects the two columns:
until the apply, INFERENCE, every edit page answers 404).
Recommendation: the owner kept everything here (O957-14, below); the kickoff now records the decisions, AC27 and AC32
as built, and the parking's remaining parts (Scope "Revision 4").
Status: Revision 4 R4-3.

F32 — the self-review rule and failing-first were not met
Severity: Low      Category: Process      CWE: none
Description: the report states no three clean passes (7.1), tests run before the readings (7.1), and no failing-first
run for the tests added after the first batch (upload reasons, parking, O957-10, `uploadFailure`) nor for
`[SEC-O957-10-SRV-EDIT]` (6.1). This review's deliberate break shows that test red without its control.
Status: Revision 4 runs failing-first for every test it adds and reports the passes as `flow.md` §2 step 4 asks.

F33 — the executor's CI-parity run broke the owner's `node_modules` and ran in a copy of the project
Severity: Low      Category: Process      CWE: none
Description: `npm ci` in the owner's folder failed with EPERM while the owner's Storybook held a native file, leaving
143 packages (report 6.3); the counted run used a robocopy of the tree with `.git`. Restored by this review (Tools).
Status: closed by the restore; Revision 4 runs `npm ci` only after checking no process of the project folder runs.

Proposed scope cut (`flow.md` §3 after a second `NEEDS REVISION`): the parking with F28 to Task 1001, O957-10 with F27
to Task 1009. The owner refused it (O957-14 below).

Owner decisions, 2026-11-21 (answers to this review, translated):
- O957-11 (F27): "he must see the option 'Publish', after which his listing goes to moderation, and the owner of the
  listing sees the status 'On moderation'. Why the hell do you invent functionality that is not needed at all?"
- O957-12 (F30): "it happens in Windows Chrome. Maybe it happens only in Storybook."
- O957-13 (F28): "Clear in the database" (option chosen): a field the person empties on edit is emptied in the database.
- O957-14 (F31): "Keep everything in 957" (option chosen): the parking, O957-10/O957-11 and the upload texts stay here.
- O957-15 (parking and garage per type): land shows neither; the type Garage only the garage kind (underground, above
  ground standalone, built into the house: confirmed); the type Parking a dropdown of parking kinds and the floor when
  needed; the other types the parking kind and "a choice of the garage kind"; `parking` joins the `property_type` enum
  ("Yes"), so Task 979 is done here.

Revision 4 (Sonnet; only these items; the kickoff Scope "Revision 4" and AC36-AC41 carry them):
- R4-1 (F27, O957-11) the owner's "Publish" option and the "On moderation" status (AC36).
- R4-2 (F28, O957-13) an emptied field is written empty on edit (AC37).
- R4-3 (F31, O957-14) the parking finished: the listing page, the filter (AC38); Opus: the SQL round trip and the catalog.
- R4-4 (F29) the UI contract registry and the Story wrappers (AC39).
- R4-5 (F30, O957-12) the Discard jump measured in Windows Chrome (AC40).
- R4-6 (F32) failing-first for every new test and the three passes (AC41).

Open parts, in order: Revision 4 (Sonnet) → Review 5 (every changed file in full, the `quality` and `dependencies` job
steps) → the open parts 1-4 of Review 2.
