# Task 957 — Review 10

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 10 of Revision 9, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 9 diff (R9-1 to R9-3): `theme.ts` (`NumberInput` entry), `input-chrome.css` (the `NumberInput` selectors), `MantineDeleteIconButton.tsx`,
`AdminPagesView.tsx`, `CollectionsSection.tsx`, `ListingFormShellView.tsx` (description), `DeleteIconButton.stories.tsx`, the tests
`listingFormMantine.test.ts`, `MantineDeleteIconButton.test.tsx`, `ListingFormShellView.controls.test.tsx` and the new `AdminPagesView.test.tsx`.
Tools (local, 2026-11-23): `npm test --` the 7 files of the report → exit 0, 259 passed, as reported. V5a in the owner's Chrome on the Storybook dev
server: `AdminPagesView` `Default` open, edit and delete 22×22, radius 8px; `CollectionsSection` `Populated` rename and delete 22×22, radius 8px; the
description 169px, `rows` 7, `resize: vertical`; the number fields 44px with gray-3 border at rest (F46 fixed). Then the number field stepped from empty
(`ListingFormFields` `Apartment`, `bedrooms`, `total_floors`) and the native rule measured with `HTMLInputElement.stepUp`/`stepDown` in the same Chrome.
The owner's screenshot of the create page (2026-11-23) shows "Туалети" 0, "Загальна площа" 1 and the focused "Поверх" 0 faded with their labels.
Not run (A5): `tsc`, lint, the unit job, build, census.
Findings: Critical 0, High 0, Medium 3 (F49, F50, F51), Low 0; F46 (at rest), F47, F48 fixed
Overall risk: no security change; a number field at its lower bound looks disabled as a whole, its controls are shorter than the field and differ in colour,
and its first step from empty lands on the bound instead of where `main`'s field stepped.

## Secure code review (`secure-code-review.md` §2, §3)

Revision 9 changes styles, a delete icon's size, a textarea's props and tests: no entry point, query, permission, schema, dependency or configuration. Every
category of §3: not touched (`git status --short`).

## Findings

F49 — a number field at its lower bound fades as if disabled
Severity: Medium      Category: UI contract (approved behaviour A2)      CWE: none
Location: src/design-system/mantine/input-chrome.css:171-172; src/modules/listings/components/__tests__/listingFormMantine.test.ts:359-375
Description: R9-1 copied the `TextInput` disabled-root rule as `.mantine-NumberInput-root:has(:disabled)` and `:has([data-disabled])`. In a `TextInput` the
only element that can be `:disabled` is the field; a `NumberInput` also holds its up and down controls, and Mantine disables the down control at the lower
bound. Measured in Storybook after one step up from empty in `bedrooms`: value 0, the only `:disabled` element inside the root is the down control, the
matched rule is this one, root `opacity` 0.5 and `cursor: not-allowed`; the label and the field fade (screenshot of the measurement; the owner's create
page shows the same for 0 and 1). The field itself is not disabled (`input.disabled` false) and still takes typing. AC48's test (`:359`) requires every
`TextInput` rule to be copied to `NumberInput` with the name replaced, so it pins the defect. The cause is the R9-1 item (Opus): it named a copy, not the
meaning of the rule.
Impact: every number field that reaches 0 or 1 looks switched off, the focused one too.
Recommendation: the `NumberInput` disabled root rule names the field: `.mantine-NumberInput-root:has(.mantine-NumberInput-input:disabled)` and
`.mantine-NumberInput-root:has(.mantine-NumberInput-input[data-disabled])`; the `TextInput` rule is unchanged; AC48's copy test checks this rule by its
meaning (the root fades only when the field is disabled), and a new test proves a field at its bound with a disabled down control does not fade.
Status: Revision 10 R10-1.

F50 — the step controls do not match the field
Severity: Medium      Category: UI contract (U3, U4)      CWE: none
Location: src/design-system/mantine/theme.ts (`NumberInput` entry); src/design-system/mantine/input-chrome.css
Description: Mantine sizes the controls from `--input-height` (`@mantine/core/styles.css:5087-5118`: the box `calc(var(--input-height) - 2px)`, each control
half of it), which `Input` sets inline on the wrapper from the size (`esm/components/Input/Input.mjs:43`, `sm` = 36px). R9-1 gave the field the canonical
44px through `styles.input.minHeight`, so measured: field 44px, controls box 34px, each control 17px; the divider (`border-inline-start: 1px solid
var(--input-bd)`) is `rgb(152,162,179)` against the field's gray-3 `rgb(208,213,221)`, and the chevrons are black against the field's gray-8 text. The
divider therefore stops short of the field's top and bottom (the owner, 2026-11-23). No literal was written; the mismatch comes from two height mechanisms.
Recommendation (replaced the same day by the owner's decision O957-22, below): one canonical height for every field, from the existing token. The 44px is
today a literal per field (`theme.ts` `TextInput` `:1089`, `NumberInput` `:1100`, `PasswordInput` `:1129`, `Select` `:1140`, `FileInput` `:1144`; the
token `theme.other.touchTarget` `'2.75rem'`, `:751`), and Mantine sizes the field, its line height, its left and right sections and the number controls from
`--input-height` (`styles.css:1367-1383`, `:5098`, `:5110`), which `Input` sets inline on every field's wrapper (`Input.mjs:43`) from
`--input-height-sm` (`styles.css:1350`, on the wrapper class). So: one theme `Input` entry sets `vars: (theme) => ({ wrapper: { '--input-height':
theme.other.touchTarget } })` for every field; the five per-field `minHeight: '2.75rem'` of the input and the `NumberInput` `vars` leave once every field is
measured at 44px (`Textarea` keeps its multi-line floor, `input-chrome.css:15-17`; `Button`, `Checkbox`, `Tabs` heights are not fields); `input-chrome.css`
gives `.mantine-NumberInput-control` the field's border colour (`var(--mantine-color-gray-3)`) and text colour (`var(--mantine-color-gray-8)`); the error
state and the hover stay Mantine's. Measured in Storybook (`ListingFormShellView` `Owner`) with the same variable applied to every field wrapper: every field
stays 44px; the line height 34 → 42px; the fields with a left icon (location, property type, year) move their icon section and text start 34 → 42px and
their right section 34 → 42px; the text keeps its vertical place; the number controls 42px.
Status: Revision 10 R10-2.

Owner decision O957-22 (2026-11-23, translated: "it is simply hard-coding; canonical rules must apply to all text fields, with controls or without"; to
the question how to set the canonical 44px for every text and number field: "One variable for all"): the field height comes from one theme rule fed by the
existing touch-target token, for every field; the per-field literals leave; the wider icon sections that follow from Mantine's own proportions are accepted
with it (shown to the owner before the revision).

F51 — the first step from an empty field lands on the bound, not where `main` stepped
Severity: Medium      Category: Business logic (approved behaviour A2)      CWE: none
Location: src/modules/listings/components/form/NumberTextInput.tsx
Description: Mantine steps an empty field to `clamp(startValue, min, max)` in both directions (`esm/components/NumberInput/NumberInput.mjs:186`, `:213`),
`startValue` 0 (`:62`): measured, one up click in an empty `bedrooms` gives 0 and in `total_floors` gives 1 (each its lower bound, which also triggered F49).
`main`'s `<input type="number">` steps from an empty value as from 0 by one step, then clamps: measured in the same Chrome with `stepUp`/`stepDown`: up gives
1 (with `min` 0, 1 or none), down gives 0 with `min` 0, 1 with `min` 1, −1 with no `min`. On `main` an empty field shows the placeholder "—" and a typed 0
shows 0 (`main:src/modules/listings/components/form/NumInputField.tsx:35-45`, `value ?? ''`).
Recommendation: `NumberTextInput` steps an empty field as `main` did: up to `clamp(0 + 1, min, max)`, down to `clamp(0 − 1, min, max)` (the parking floor,
−10 to −1, gives −1 both ways); a non-empty field steps as now; typing is unchanged; an emptied field stays empty with "—".
Status: Revision 10 R10-3.

F46 (the resting look), F47 and F48 — fixed in Revision 9, measured above.

## For the owner

- Stories changed by Revision 9: `Patterns/Mantine/DeleteIconButton` (`States` 22px, new `Touch` 44px, `OnPhoto` unchanged); every form Story's number
  fields (44px, gray-3); `ListingFormShellView` description (169px, vertical handle).
- The executor measured the Stories only: the app pages need the owner's session (its report: `BLOCKED: no session`); this review measured in the owner's
  Chrome.

## Revision 10 (Sonnet; only these items)

- R10-1 (F49) the disabled fade only when the field itself is disabled (AC51).
- R10-2 (F50, O957-22) one canonical field height for every field from the touch-target token; the controls take the field's colours (AC52).
- R10-3 (F51) a step from an empty field as on `main` (AC53).

Open parts, in order: Revision 10 (Sonnet, with I8a in the owner's Chrome) → Review 11 (V5a) → the commit and pull request (H) → `gh pr checks <n>` → the merge.
