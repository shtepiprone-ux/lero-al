# Task 957 — Review 11

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 11 of Revision 10, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 10 diff (R10-1 to R10-3): `input-chrome.css` (the `NumberInput` disabled root, the control colours), `theme.ts` (the `Input` entry; the
`minHeight` of `TextInput`, `NumberInput`, `PasswordInput`, `Select` removed; the `FileInput` entry deleted), `NumberTextInput.tsx` (the step from an empty
box), the tests `fieldContracts.test.tsx` and `listingFormMantine.test.ts`.
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success`; `npm test
--` the 6 files of the report → exit 0, 211 passed, as reported. V5a in the owner's Chrome (the one connected browser, `list_connected_browsers`), after the
owner signed in again (the first pass met a lapsed session: `/uk/listings/create` and `/uk/cabinet` answered a redirect to `/uk/auth/login`; the edit
link answered the restricted page, which this review first read as the form): see "Rendered comparison". Not run (A5): `tsc`, lint, the unit job, build,
census.
Findings: Critical 0, High 0, Medium 1 (F52), Low 0; F49, F50, F51 fixed
Overall risk: no security change; every field of the listing form and the cabinet now has one canonical height and look, and a step from empty goes as on
`main`; one field type that this revision touched, `FileInput`, still has Mantine's look.

## Secure code review (`secure-code-review.md` §2, §3)

Styles, a theme entry and a number field's step: no entry point, query, permission, schema, dependency or configuration. Every category of §3: not touched.
Agent and tool output: the executor appended the AC51 and AC53 tests with a shell heredoc (`cat >>`), against A12 (stated in its report); the appended
tests were read here through their red and green runs and their text.

## Rendered comparison (V5a, 2026-11-23)

- Storybook, 1920px, `ListingFormFields` `Apartment`: every number field 44px, controls box 42px from border to border, divider `rgb(208,213,221)`, chevrons
  `rgb(29,41,57)`; real clicks: `bedrooms` from empty up → 1, then down → 0 with the down control disabled and the root `opacity` 1, the label
  `rgb(52,64,84)`; `total_floors` from empty down → 1 (as `stepDown` with `min` 1).
- Storybook through 320px and 1440px frames: `Select`, `PasswordInput`, `HeroSearch` and `ListingFormShellView` `Owner`: every field 44px, gray-3, text
  start 16px (the `PasswordInput` inner field 1px + 16px from the border, its outer padding 14.67px unused), the left-icon fields 42px icon section and
  text start.
- App, signed in, 1920px: `/uk/listings/create`: every field 44px, radius 8px, gray-3, shadow, gray-8 text; number controls 42px in the field's colours;
  real clicks on `area_gross`: from empty up → 1 (its lower bound), then up, down, down → 1, root `opacity` 1, label unchanged, the divider full height
  (screenshot). `/uk/listings/<slug>/edit`: the seven number fields, `Select`, the `TextInput`s and the three left-icon fields 44px, gray-3, radius 8px,
  opacity 1; the description 169px, `resize: vertical`; the note 64px. `/uk/cabinet?tab=profile`: every Mantine field 44px, radius 8px, gray-3; the
  legacy `name` field (radius 18px, `ProfileTab.tsx:287`) is Task 895's migration.
- `FileInput` (the image dialog of the CMS editor, `MantineRichTextEditor.tsx:396`, Story `Patterns/Mantine/RichTextEditor` `ImageUploading`): 44px, but
  border `rgb(152,162,179)`, start padding 14.67px, black text, no shadow, beside the dialog's `TextInput` (gray-3, 16px, gray-8, shadow): F52.
- Mantine field types in use (`import … from '@mantine/core'`, outside tests and Stories): `TextInput` 25 files, `Textarea` 10, `PasswordInput` 6, `Select`
  2, `NumberInput` 1, `FileInput` 1; `FileInput` is the only one with no rule in `input-chrome.css`.
- Firefox: the owner's look, 2026-11-23 (translated): "in Firefox everything is ok". Safari: UNKNOWN, the owner has no Safari.

## Findings

F49, F50, F51 — fixed in Revision 10 (R10-1 to R10-3), each measured above.

F52 — the file field keeps Mantine's look
Severity: Medium      Category: UI contract (U4, owner decision O957-22)      CWE: none
Location: src/design-system/mantine/input-chrome.css (no `FileInput` selector); src/design-system/mantine/patterns/MantineRichTextEditor.tsx:396
Description: Revision 10 removed the `FileInput` theme entry (its only line was the height, now given by the `Input` entry), so this task changed it; the
canonical field look (`input-chrome.css:4-33`, `:132-148`, `:161-183`) names `TextInput`, `Textarea`, `Select`, `PasswordInput` and `NumberInput`, not
`FileInput`. Measured: border `rgb(152,162,179)`, padding 14.67px, black text, no shadow, beside a canonical `TextInput` in the same dialog. `main` had the
same look except the height (its own `minHeight`), so this is not a regression; it is the canonical rule the owner set for every text field (O957-22).
Recommendation: `input-chrome.css` adds `.mantine-FileInput-input` to the same selector lists as `NumberInput` (resting border and shadow, focus, error,
padding-top and -bottom and text colour, start padding guarded on `.mantine-FileInput-wrapper:not([data-with-left-section])`, the disabled field and the
disabled root named by the field as R10-1), and its placeholder (`.mantine-FileInput-placeholder`) the placeholder colour; no new value.
Status: Revision 11 R11-1.

## For the owner

- Stories changed by Revision 10: every form Story's number fields (controls 42px, field colours; a bound no longer fades the field). Every Mantine field
  of the site takes its height from one theme rule (`Input` `vars`, `theme.other.touchTarget`); the left-icon fields' icon section and text start are 42px
  (O957-22).
- Please check a number field and the image dialog's file field in Firefox and Safari.

## Revision 11 (Sonnet; only this item)

- R11-1 (F52) the file field takes the canonical field look (AC54).

Open parts, in order: Revision 11 (Sonnet) → Review 12 (V5a) → the commit and pull request (H) → `gh pr checks <n>` → the merge.
