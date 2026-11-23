# Task 957 — Review 7

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 7 of Revision 6, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 6 diff (R6-1 to R6-5) on top of Revision 5: `listingStatusOptions.security.test.tsx`, `edit/page.tsx`,
`editAccessRestricted.security.test.ts`, `applyListingTransition.ts` and `listingTransitionEngine.ts` (comments), the `ListingFormShellView` Story,
`scripts/rendered-interaction-states.json`. Read against the Revision 5 copies kept in Review 6 (`diff`) and `git diff HEAD`: `listingStatusOptions.ts`,
`ListingFormShellView.tsx` and `ListingFormShell.tsx` unchanged since Revision 5; no file outside R6-1 to R6-4.
Tools (local, 2026-11-23): `owasp.mjs sync` → exit 0, 0 changed; `owasp.mjs check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main
--limit 3` → the three latest `main` runs `success` (CI 45124810384); `npm test --` the 8 files of the report → exit 0, 115 passed, as reported; deliberate
breaks, each restored from a copy (`cmp` equal): `value` → `defaultValue` in `StatusChangeSelect.tsx` → `[SEC-D8-FE-ERR]` and `[SEC-D8-FE-ERR-STAFF]`
red; the `listingError` check off in `edit/page.tsx` → `[SEC-X-SRV-EDIT-QUERY-ERROR]` red (3 failed, exit 1), as reported; `sed -n 486,489p
src/design-system/mantine/input-chrome.css` → still `-moz-appearance: number-input` (R6-5 not done); `owasp.mjs review <kickoff> --base main` → exit 0.
Earlier the same day (Review 6, the owner's report): in the owner's Chrome 157 on the edit page all eight number fields carry `type="number"` and
`data-native-steppers` and show the arrows on hover or focus; the owner sees none in Firefox. Not run (A5): `tsc`, lint, the unit job, the census and
every rendered Story check.
Findings: Critical 0, High 0, Medium 1 (F42, open: R6-5 not done, superseded by O957-20), Low 0; F37, F39, F40, F41 fixed
Overall risk: no new hole; the security test, the edit page's error path, the owner Story and the comments are fixed and proven; the number fields still
lack controls in Firefox and, per the owner's decision O957-20, must have them on hover and focus in every browser.

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: unchanged; the edit page still decides access exactly as `main` and now refuses to read a failed query as "no row".
2. New vectors: none. 3. Trust boundaries: unchanged. 4. Integrations: none. 5. Regression: `[SEC-D8-FE-ERR]` is the owner's again (F37 fixed); no
assertion loosened (the staff case moved unchanged to `[SEC-D8-FE-ERR-STAFF]`). 6. Patterns:
- Data exposure, errors — touched: `edit/page.tsx:80-83` logs `{ code }` only and throws a message with the code only; the test checks that neither holds
  the database message, the slug or a listing field.
- Authorization, business logic — touched only by comments (`applyListingTransition.ts:32-35`, `:245-246`, `:282`; `listingTransitionEngine.ts:208-209`),
  each now stating O957-17.
- Input and output, authentication, requests and redirects, Next.js entry points, JavaScript and TypeScript, files, dependencies and configuration —
  not touched: no route, schema, auth module, config or lockfile in the Revision 6 diff.
- Agent and tool output — the report omits R6-5, which the owner passed to the session after Review 6 (F42 below); every break went through Edit.
- Tests — F37 fixed.

## Findings

F37, F39, F40, F41 — fixed in Revision 6 (R6-1 to R6-4), each proven above.

F42 — the number fields have no step controls in Firefox (open)
Severity: Medium      Category: Business logic (approved behaviour, A2)      CWE: none
Location: src/design-system/mantine/input-chrome.css:486-488; src/modules/listings/components/form/NumberTextInput.tsx:33-36
Description: R6-5 (`appearance: auto` instead of `-moz-appearance: number-input`) is not in the tree and not in the report. `fieldContracts.test.tsx:228`
pins `-moz-appearance: number-input`, the value Firefox does not apply, so the test passed while Firefox showed no arrows. Native arrows also differ by
browser (Chrome on hover or focus, none on touch screens). Owner decision O957-20 (2026-11-23, translated): "the arrows must show on hover in every
browser, not only in Chrome and Firefox"; on a touch screen "on focus".
Impact: an approved control of `main` is missing for part of the people who edit listings.
Recommendation: R7-1: `NumberTextInput` renders Mantine `NumberInput` with its own controls (no clamping, decimals and a minus sign allowed, ArrowUp and
ArrowDown step), shown on hover under `@media (hover: hover)` and on focus, through rules on Mantine's static `NumberInput` classes in
`input-chrome.css`; the `data-native-steppers` rules and attribute leave; `fieldContracts.test.tsx` changes with the decision (AC45).
References: `checklists/common.md` A2; `shared/canonical-component-reuse.md` (no canonical `NumberInput` exists: no theme entry, no Primitives Story).
Status: Revision 7 R7-1.

## For the owner

- Stories changed by Revision 6 (V9; read from the code): `Patterns/Mantine/ListingFormShellView` `OwnerStatusControl` now shows the badge, the
  operations and, under them, "Delete listing", as the owner's page does. After Revision 7: `Patterns/Mantine/ListingFormFields` `NumberInput` and every
  form Story with number fields show Mantine's up and down controls on hover and on focus.
- The census rows `owner~delete-listing` and `owner-status-control~delete-listing` are derived from the code, not measured: the CI census decides.

## Revision 7 (Sonnet; only these items)

- R7-1 (F42, O957-20) the number fields on Mantine `NumberInput`, controls on hover and focus in every browser (AC45).

Open parts, in order: Revision 7 (Sonnet) → Review 8 → the commit (H) → `gh pr checks` (AC39 on the committed branch, the census rows, the unit and
integration jobs) → the AC9 round trip, waiting for the owner's permission (the SQL is applied; the catalog part is met, Review 6).
