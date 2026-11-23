# Task 957 — Review 6

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 6 of Revision 5, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 5 diff (R5-1 to R5-6) against `163534aac`, 18 changed and 2 new files: `listingTransitionEngine.ts`, `listingStatusOptions.ts`,
`ListingFormShell.tsx`, `ListingFormShellView.tsx`, `ListingFormLoader.tsx`, `edit/page.tsx`, `updateListing.ts` (comment), the four `messages/*.json`,
`scripts/rendered-interaction-states.json`, the `ListingFormShellView` Story, the tests `ownerStatusRules.security`, `ownerPublish.security`,
`applyListingTransition`, `listingStatusOptions.security`, `ListingFormShellView.controls` and the new `ListingFormShell.delete` and
`ListingFormShell.cancel`. Every file is named by an R5 item; no file outside the Scope.
Tools (local, 2026-11-23): `owasp.mjs sync` → exit 0, 0 changed; `owasp.mjs check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main
--limit 3` → the three latest `main` runs `success` (CI 45124810384); `git diff --stat HEAD` → 18 files, +334/−89, plus the 2 untracked tests;
`npm test --` the 8 files of the report (with `deleteListing.security.test.ts`) → exit 0, 127 passed, as reported; `check-i18n-parity.mjs` → exit 0,
2695 keys. Deliberate breaks, each restored from a copy (`cmp` equal): (1) `expired` out of `STAFF_ONLY_TARGET_STATUSES` → exit 1, 4 failed, as
reported; (1b) `pending` back in it → exit 1, 7 failed, the R5-1 case among them; (2) the current status back in the owner's list → exit 1, 5 failed, as
reported; (3) the `canDelete` check out of the view → exit 1, 1 failed, as reported; (4) `router.back()` out of `navigateAway` → 2 of `ListingFormShell.cancel`
failed; (5) the push after a delete removed → 1 of `ListingFormShell.delete` failed; (6) `[SEC-D8-FE-ERR]` put back to the owner (`canPublish` false)
→ exit 1, `expected '' to be 'Under review'` (F37), restored. Final rerun → exit 0, 127 passed. After the owner's report (F41): a read-only PostgREST select with the anon key → `id,heating` 200,
`id,parking_type` and `id,parking_floor` 400 `42703`. `owasp.mjs review <kickoff> --base main` → exit 0, every
sheet in the record. Not run (A5: CI only on GitHub): `tsc`, lint, the unit job, the census and every rendered Story check (owner order 2026-11-21).
Findings: Critical 0, High 0, Medium 2 (F37, F42), Low 3 (F39, F40, F41); F38 withdrawn
Overall risk: no new hole; the server keeps every status and delete check, but one security test was moved off the owner without a word, the edit page
shows a failed query as "access restricted", the production owner state has no Story with the delete section, and four comments state the rule before
O957-17.

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: the gateway gets stricter (`expired` staff-only, `listingTransitionEngine.ts:221`); `deleteListingAction` is reused unchanged
   (owner or `listings.delete`, `deleteListing.ts:33-34`). 2. New vectors: none; the form calls an existing Server Action already reachable from the
   cabinet (`ListingsTab.tsx:141`). 3. Trust boundaries: unchanged; `canDelete` (`edit/page.tsx:159`) only hides the section, and a session still cannot
   write `listings.status` (`guard_listings_protected_columns`, `supabase/sql_migrations/task923/db-catalog/proposed-hardening.sql:326-335`).
   4. Integrations: none. 5. Regression: one security test weakened (F37); the other changed cases follow O957-16 and O957-17. 6. Patterns:
- Authorization — touched: `canOwnerSetStatus` (`listingTransitionEngine.ts:224-226`) refuses `active` and `expired`; the delete keeps its server check.
- Business logic — touched: the owner's five operations (`listingStatusOptions.ts:11`, `:35-37`) equal the server's targets for every status
  (`[SEC-O957-17-FE-SET]`).
- Requests and redirects — touched: `navigateAway` (`ListingFormShell.tsx:87-98`) goes back or to the fixed listing path; a delete goes to the fixed
  `/<locale>/cabinet?tab=listings` (`:320`); no target from input.
- Input and output, authentication, Next.js entry points, JavaScript and TypeScript, data exposure, files, dependencies and configuration — not
  touched: none of the 20 files is a route, schema, auth module, proxy, config, upload handler or lockfile; no new entry point.
- Agent and tool output — touched: the executor made break 1 with `sed` on a product file (A12), stated in its report and restored; no repository
  file comes from it.
- Tests — touched: F37.

## Findings

F37 — a security test was moved from the owner to staff, so the owner's refused change is no longer proven
Severity: Medium      Category: Tests (Authorization regression)      CWE: none
Location: src/modules/listings/components/listingStatusOptions.security.test.tsx:144-152
Description: `[SEC-D8-FE-ERR]` ("a refused status change keeps the current status and shows the error") rendered the owner's control
(`renderControl('pending', false, …)` at `163534aac`); Revision 5 changed it to staff (`true`). The report does not say so. Put back to the owner, it
fails only on its last line: the owner's select no longer holds the current status (O957-16), so its input reads `''`, not "Under review".
Impact: the case the server refuses most, the owner's, has no test that a refused change is not shown as chosen; A9 forbids changing a case to get green.
Reproduction: `renderControl('pending', false, onSubmit)` in that test → `npx vitest run … -t "SEC-D8-FE-ERR"` → exit 1, `expected '' to be 'Under review'`.
Recommendation: keep the owner case: the owner of a `pending` listing picks "Archived", the call is refused, the error toast shows, no success toast,
and the input's value after the refusal equals its value before the pick (not "Archived"). The staff case stays as a second test.
References: Authorization_Regression_Testing; `checklists/common.md` A9; `secure-code-review.md` §3 Tests.
Status: Revision 6 R6-1.

F38 — withdrawn (the reviewer's error)
The first text of this review said no canonical delete button exists, after a search of `src/design-system/mantine/patterns/` only. The owner pointed
out the canonical button styles (2026-11-23): `Mantine/Primitives/Button` shows the destructive variant `variant="light" color="red"`
(`src/stories/mantine/primitives/Button.stories.tsx:43`), and the theme leaves an explicit `color` to destructive actions
(`src/design-system/mantine/theme.ts:996-997`). `ListingFormShellView.tsx:316` reuses that variant: met (U1). No revision item.

F41 — the edit page shows "access restricted" when its own query fails
Severity: Low      Category: Data exposure, errors (Error Handling)      CWE: CWE-755
Location: src/app/[locale]/listings/[slug]/edit/page.tsx:62-80
Description: the page reads only `data` of the listing query (`.single()`) and treats every failure as "no row": a hidden listing then gets the
restricted page, any other a 404. Revision 4 (F31, by this kickoff) added `parking_type, parking_floor` to the select; on the live database, where
`task957-parking.sql` is not applied yet, the query answers `42703 column listings.parking_type does not exist` (read-only PostgREST probe,
2026-11-23), so the owner who clicked "Edit" on a hidden listing read "access to this page is restricted by the listing's owner" (owner's report,
2026-11-23). No access rule changed: the page's checks equal `main` (`git diff main` shows only the select, the Cloudinary config and `canDelete`);
`main` also ignores the error (`const { data: listing }`, `main` line 62).
Impact: a database or schema failure reaches the owner as an access refusal or a missing page; the real cause is hidden from the person and from the log.
Reproduction: the live database without `task957-parking.sql` → the owner opens `/<locale>/listings/<hidden slug>/edit` → the restricted page.
Recommendation: the page reads `error` too: "no row" (`PGRST116`) keeps today's path (restricted page or 404); any other error is logged with its
code only and thrown to the error boundary, never shown as the restricted page or a 404. The owner applies `task957-parking.sql` before checking the
edit page (Route step 5).
References: Error_Handling; `secure-code-review.md` §3 data exposure, errors.
Status: Revision 6 R6-2.

F39 — the production owner state has no Story with the delete section
Severity: Low      Category: Stories (U6)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx:99-102, :117
Description: the owner always gets both the status control and the delete section (`edit/page.tsx:43`: `canManageStatus` is true for the owner;
`:159`: `canDelete`). `Owner` (`statusControl: undefined`) now shows the delete section, a combination production never renders; `OwnerStatusControl`,
the real owner, has no delete section. The kickoff's R5-5 named `Owner` (Opus's gap).
Impact: the owner checks the Stories by hand and never sees the badge, the operations and the delete section together, as the owner's page shows them.
Recommendation: `OwnerStatusControl` also passes `canDelete: true` and a handler that resolves at once; its delete trigger gets its row
`patterns-mantine-listingformshellview--owner-status-control~delete-listing` in `scripts/rendered-interaction-states.json` (the same selector as the
`owner~delete-listing` row: the sidebar is `div:nth-child(4)` of the layout, its second section `div:nth-child(2)`, the section's `Box`
`div:nth-child(2)`, the button its first child). `Owner` stays.
References: `shared/storybook-proof.md` U6; `shared/rendered-state-census.md` U8.
Status: Revision 6 R6-3.

F40 — four comments still say the owner may set every status but `active`
Severity: Low      Category: Process (facts)      CWE: none
Location: src/modules/listings/actions/applyListingTransition.ts:32-35, :244-246, :282-283; src/modules/listings/domain/listingTransitionEngine.ts:208-209
Description: after R5-4 (`expired` staff-only) these comments still say the owner keeps every other status, and the engine's D8 note says only the
publishing status is staff-only. The executor reported the three in `applyListingTransition.ts` as outside its file list (I6).
Impact: the next reader is told a rule that no longer holds.
Recommendation: each states O957-17: the owner never sets `active` or `expired`; `pending` from every status but `active`. Comments only.
Status: Revision 6 R6-4.

F42 — the number fields have no step arrows in Firefox
Severity: Medium      Category: Business logic (approved behaviour, A2)      CWE: none
Location: src/design-system/mantine/input-chrome.css:486-488
Description: `main` renders the listing form's number fields as `<input type="number">`, which every desktop browser gives its own step arrows.
The branch renders Mantine `TextInput type="number"` (`NumberTextInput.tsx:33-36`). Mantine hides the arrows: in Chrome through the spin-button
pseudo-elements (`node_modules/@mantine/core/styles.css:1550-1557`), in Firefox through `.m_8fb7ebe7[type='number'] { -moz-appearance: textfield }`
(`:1559-1561`). The project restores them with `appearance: auto` on the pseudo-elements, which works in Chrome, and `-moz-appearance: number-input` on the
input for Firefox. MDN lists `number-input` only among the legacy non-standard values; the standard keyword for the native look is `auto`.
Measured in the owner's Chrome 157 on `/uk/listings/<own listing>/edit` (2026-11-23): all eight number fields carry `type="number"` and
`data-native-steppers`, and the arrows show on hover or focus, as on `main`. The owner sees no arrows in Firefox (2026-11-23). INFERENCE: Firefox does
not accept `number-input` from page CSS, so Mantine's `textfield` stays. Separately measured in the injected copy: `appearance: auto` on the input
keeps the Mantine field's look in Chrome.
Impact: an approved control of `main` is gone for Firefox users.
Recommendation: `input-chrome.css:486-488` sets the standard `appearance: auto` (and `-moz-appearance: auto`) on
`.mantine-TextInput-input[type='number'][data-native-steppers]` instead of `number-input`. Proof: the owner's look in Firefox and in Chrome; the
automated test pins the rule.
References: `checklists/common.md` A2; MDN `appearance`.
Status: Revision 6 R6-5.

## For the owner

- Stories changed by Revision 5 (V9; read from the code, not rendered): `Patterns/Mantine/ListingFormShellView` → `Owner`: under Save and Cancel a
  second section with "Delete listing"; a click opens the confirm "Delete listing" / "Delete this listing?" with Cancel and Delete; the handler deletes
  nothing. `OwnerStatusControl`: the badge "Active" above the select; the select shows no value and lists Archived, Deactivate, Sold, Rented. `Staff`,
  `Create`, `WithErrors`, `PhotoLimitReached`, `UploadUnavailable`, `CancelConfirmation`: no change. After Revision 6 `OwnerStatusControl` also shows the
  delete section (F39).
- Neither SQL file is applied on the live database (read-only catalog read in a `read only` transaction, 2026-11-23): no `rate_limit_hits`,
  `consume_rate_limit`, `listing_images_owner_folder` (function and trigger) of `task957.sql`; no `parking_type` type, columns or check of
  `task957-parking.sql`. On the dev server the edit page's query therefore failed (F41), and the photo signature route answered 503 (its limiter call,
  `src/app/api/listings/upload-signature/route.ts:85-88`). The AC9 round trip was refused by this session's permission classifier; the owner then
  applied `task957.sql` and `task957-parking.sql` in the Supabase SQL Editor (2026-11-23, both "Success. No rows returned"), without the round-trip
  proof. Read after the apply: every object of both files is in the catalog; PostgREST selects `parking_type` and `parking_floor` (200);
  `db-catalog-audit.mjs --save supabase/catalog.json` → exit 0, no finding; the snapshot adds exactly the two files' objects (`rate_limit_hits` with
  RLS, the two definer functions with an empty `search_path` and no anon or authenticated execute, the trigger, the `parking_type` enum, the two
  columns, `listings_parking_floor_check`, and the two columns in the `authenticated` INSERT and UPDATE column grants). AC9: the catalog part met; the
  round-trip part not run.
- The owner's badge for a `pending` listing reads `listing.status_pending`: uk "На модерації", en "Under review" (R5-3 removed `status_pending_owner`).
- A hole found outside this revision (A4), filed as Task 1019: the status control's note (`StatusChangeSelect.tsx:90-111`, `enableNote` in
  `ListingFormShellView.tsx`) never reaches the server: `ListingFormShell.tsx` `onStatusChange` drops `note`, and "Update status" re-sends the current
  status, which `canSetStatusPrivileged` refuses (`from !== to`, `listingTransitionEngine.ts:201-203`), so it always shows the error. `main` the same.

## Revision 6 (Sonnet; only these items)

- R6-1 (F37) `[SEC-D8-FE-ERR]` proves the owner's refused change again; the staff case stays (AC36).
- R6-2 (F41) the edit page throws a failed listing query instead of showing the restricted page or a 404 (AC44).
- R6-3 (F39) `OwnerStatusControl` shows the delete section; its census row (AC42).
- R6-4 (F40) the four comments.
- R6-5 (F42) the number fields' arrows in Firefox: `appearance: auto` instead of `number-input` (AC45).

Open parts, in order: Revision 6 (Sonnet) → Review 7 → the commit (H) → `gh pr checks` (AC39 on the committed branch, the census rows, the unit and
integration jobs after the owner's apply of `task957-parking.sql`) → Opus: AC9 (the SQL round trips, the catalog).
