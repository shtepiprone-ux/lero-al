# Task 957 — Review 8

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 8 of Revision 7, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 7 diff (R7-1): `src/modules/listings/components/form/NumberTextInput.tsx`, `src/design-system/mantine/input-chrome.css`,
`src/modules/listings/components/form/__tests__/fieldContracts.test.tsx`, `src/stories/patterns/mantine/ListingFormFields.stories.tsx` (one comment). No
other file changed since Review 7 (`git status --short`); the empty untracked folder `src/modules/listings/components/steps/` left by Revision 4 was removed
with `rmdir` (stated in the report; Git does not track an empty folder, so no diff).
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → the three latest
`main` runs `success`; `npm test --` the 4 files of the report → exit 0, 167 passed, as reported; deliberate breaks, restored from a copy (`cmp` equal):
`clampBehavior="strict"` and the `:focus-within` rule removed → `fieldContracts.test.tsx` exit 1, 9 failed (the report: 8 and 1); `owasp.mjs review
<kickoff> --base main` → exit 0. Read: `node_modules/@mantine/core/esm/components/NumberInput/NumberInput.mjs:360-368` (`inputMode: "decimal"`, then
`...others`, so a prop overrides it). Not run (A5): `tsc`, lint, the unit job, the census and every rendered Story check; the look of the controls on
hover and focus in Chrome, Firefox, Safari and on a phone is the owner's check.
Findings: Critical 0, High 0, Medium 2 (F43, F45), Low 1 (F44); F42 fixed
Overall risk: no security change; the number fields now have their own controls in every browser, but a field that takes a negative number offers no
minus key on an iPhone, and two descriptions still name the browser's arrows.

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: none touched; the values still reach the same validation (`clampBehavior="none"`). 2. New vectors: none. 3. Trust boundaries:
unchanged. 4. Integrations: none (Mantine `NumberInput` is part of the installed `@mantine/core`; `git diff HEAD -- package.json package-lock.json` empty).
5. Regression: the `fieldContracts.test.tsx` assertions changed with owner decision O957-20, each named with its reason in the report (A9); the bounds are
now proven by behaviour (ArrowUp at `max`, ArrowDown at `min`) because `NumberInput` sets no native `min`/`max`. 6. Patterns: input and output — the
typed value still passes `parseNumberInput`; every other category not touched (no route, schema, auth module, config or lockfile in the diff).

## Findings

F42 — fixed in Revision 7 (R7-1): Mantine `NumberInput` with its own controls, hidden at rest, shown on hover where the device hovers and on focus
(`input-chrome.css:479-492`); the `data-native-steppers` rules and the attribute left.

F43 — a field that takes a negative number offers no minus key on an iPhone
Severity: Medium      Category: Business logic (approved behaviour, A2)      CWE: none
Location: src/modules/listings/components/form/NumberTextInput.tsx:39-52
Description: Mantine `NumberInput` sets `inputMode: "decimal"` (`NumberInput.mjs:367`). `main` renders these fields as `<input type="number">`. Two fields
take negative numbers: the floor of a listing in a multi-storey building (`FloorGroupField.tsx:47`, `min={floorMin}`, negative when `allowNegative`) and
the underground parking floor, which is only negative (`ParkingField.tsx:41`, −10 to −1). INFERENCE (not measured on a device): the iPhone's decimal
keypad has digits and a decimal separator and no minus, so these values cannot be typed there; the executor reported the same as UNKNOWN.
Impact: an owner on an iPhone cannot type a basement floor or the parking floor; only the step controls remain.
Recommendation: `NumberTextInput` passes `inputMode="text"` when the field's `min` is below 0 (the keyboard that has a minus), and keeps Mantine's
`decimal` for every other field; nothing else changes. The owner checks both on an iPhone.
References: `checklists/common.md` A2; `fieldContracts.test.tsx` (AC46).
Status: Revision 8 R8-1.

F44 — two descriptions still name the browser's step arrows
Severity: Low      Category: Process (facts)      CWE: none
Location: scripts/ui-contract-registry.json:667; src/stories/patterns/mantine/ListingFormFields.stories.tsx:25
Description: the registry entry's `element` reads "number input with the browser's own step arrows" and the Story file's header comment names
`TextInput type="number"` with the browser's arrows; after R7-1 both are false. `check-ui-contract.mjs:266` checks only that the text is not empty. The
executor reported the registry line as outside its item.
Recommendation: both state Mantine `NumberInput` with its own controls on hover and focus (O957-20). Text only.
Status: Revision 8 R8-2.

F45 — five buttons of the listing form use an 18px font instead of the canonical 14px
Severity: Medium      Category: UI contract (approved behaviour A2, U3, U4)      CWE: none
Location: src/modules/listings/components/ListingFormShellView.tsx:280, :285, :316; src/modules/listings/components/ImageUpload.tsx:223, :229
Description: the theme's canonical button is `size: 'sm'`, 14px text (`src/design-system/mantine/theme.ts:976-977`; `Mantine/Primitives/Button`
shows xs and sm only, "no md per density rule"). These five pass `size="lg"`, which in Mantine also sets the font: measured in the owner's Chrome on the
edit page at 1920px (2026-11-23): "Додати ще (1/20)", "Зберегти зміни", "Скасувати", "Видалити оголошення" 18px; the other 37 buttons, "Оновити статус"
among them, 14px; every button 44px high (the theme's touch height). On `main` Save and Cancel were the legacy `Button size="xl"`, whose scale changes
only the height, so their text was the base `text-sm`, 14px (`src/components/ui/button.tsx:7`, `:28`); the migration took `xl` to Mantine `lg` and the
font grew. Owner, 2026-11-23 (translated): "there must be one canonical font size for each breakpoint … bring everything to one style".
Impact: the form's main actions read larger than every other button of the site.
Recommendation: the five buttons drop `size="lg"` and take the theme's canonical size (14px, 44px high); nothing else changes.
References: `checklists/common.md` A2; `shared/ui-token-contract.md` U3, U4.
Status: Revision 8 R8-3. Outside this task (A4): `MantineAuthFormPattern.tsx:126` passes `size="md"` (16px); it has no production consumer (only
`src/stories/patterns/mantine/AuthFormPattern.stories.tsx`); filed as Task 1020.

## For the owner

- Stories changed by Revision 7 (V9; read from the code): `Patterns/Mantine/ListingFormFields` `NumberInput` (empty, with a value, with an error,
  disabled) and every form Story with number fields (`FieldKinds`, `Apartment`, `House`, `GarageMultiStorey`, `Land`, `WithValuesAndErrors`, and the
  `ListingFormShellView` Stories) now render Mantine's up and down controls, hidden until the pointer is over the field or the field has focus.
- Please check a number field on hover and on focus in Chrome, Firefox and Safari, and on a phone; after Revision 8 also the floor and parking floor on an
  iPhone (the minus key).

## Revision 8 (Sonnet; only these items)

- R8-1 (F43) the minus key for a field that takes a negative number (AC46).
- R8-2 (F44) the two descriptions.
- R8-3 (F45) the five form buttons at the theme's canonical size (AC47).

Open parts, in order: Revision 8 (Sonnet) → Review 9 → the commit (H) → `gh pr checks` (AC39 on the committed branch, the census rows, the unit and
integration jobs) → the AC9 round trip, waiting for the owner's permission.
