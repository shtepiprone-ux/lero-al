# Task 957 — Review 9

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 9 of Revision 8, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 8 diff (R8-1 to R8-3): `NumberTextInput.tsx` (the `inputMode` override), `scripts/ui-contract-registry.json:667` and the header
comment of `ListingFormFields.stories.tsx` (text), `ListingFormShellView.tsx:280`, `:285`, `:316` and `ImageUpload.tsx:223`, `:229` (`size="lg"` removed),
and the tests `fieldContracts.test.tsx`, `listingFormMantine.test.ts`, `ListingFormShellView.controls.test.tsx`; no other file; `MantineAuthFormPattern.tsx`
untouched (Task 1020). Then every unit test the acceptance criteria name, on the whole branch.
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → the three latest
`main` runs `success`; `npm test --` the 4 files of the report → exit 0, 182 passed, as reported; deliberate breaks, restored from a copy (`cmp` equal): the
`inputMode` override removed and `size="lg"` back on Save → exit 1, 3 failed (the report: 1 and 2); `npm test --` the 20 unit test files the acceptance
criteria name → exit 0, 464 passed; `node --test scripts/quality/cloudinary-config.test.mjs` → exit 0, 9 passed; `check-ui-contract.mjs --verify-gate` → exit
0; `check-i18n-parity.mjs` → exit 0, 2695 keys; AC35's grep finds only the test that asserts the two ids are gone (`listingFormMantine.test.ts:314`);
`owasp.mjs review <kickoff> --base main` → exit 0. Not run (A5): `tsc`, lint, the unit and integration jobs, the census, every rendered Story check, and
`check-ui-contract.mjs --base origin/main` (it reads the committed branch, AC39): these are `CI Required` on the pull request (V14).
Findings: Critical 0, High 0, Medium 3 (F46, F47, F48), Low 0; F43, F44, F45 fixed
Overall risk: no security change; this review first read `APPROVED` without comparing the number fields' look with the other fields (U4); the owner found
the difference the same day, and the measurement below confirms it, so the verdict is `NEEDS REVISION` and the commit commands are withdrawn.

## Secure code review (`secure-code-review.md` §2, §3)

The Revision 8 diff changes a keyboard hint, two descriptions and five button sizes: no entry point, query, permission, schema, dependency or
configuration (`git status --short`). Every category of §3: not touched by Revision 8; the categories Revisions 5-7 touched are answered in Reviews 6-8.

## Findings

F43, F44, F45 — fixed in Revision 8 (R8-1 to R8-3), each proven above.

F46 — the number fields lost the canonical field look
Severity: Medium      Category: UI contract (approved behaviour A2, U3, U4)      CWE: none
Location: src/design-system/mantine/input-chrome.css:4-33, :132-148, :161-183; src/design-system/mantine/theme.ts:1083-1093
Description: the canonical field look is written for `TextInput`, `Textarea`, `Select` and `PasswordInput` only: the border, shadow, placeholder, focus and
error colours (`input-chrome.css:4-33`, `:36-70`), the padding and text colour (`:132-148`), the disabled state (`:161-183`), and in the theme the 44px
height, radius, size and text colour (`theme.ts:1083-1093`). Revision 7 (R7-1, owner decision O957-20) made the number fields Mantine `NumberInput`, which
has none of these, so they render Mantine's defaults. Measured in the owner's Chrome on the edit page (2026-11-23), every visible field: the seven number
fields (`bedrooms`, `bathrooms`, `toilets`, `area_gross`, `area_net`, `floor`, `total_floors`) have border `rgb(152,162,179)`, height 36px, start padding
12px, text black, no shadow; every `TextInput`, `Textarea` and `Select` has border `rgb(208,213,221)` (gray-3), height 44px, padding 16px, text
`rgb(29,41,57)` (gray-8) and the resting shadow. Owner, 2026-11-23 (translated): "all text fields have a canonical colour … I did not agree to this".
The cause is the R7-1 item of this kickoff (Opus): it named the controls and not the field look; Reviews 8 and 9 (Opus) did not compare the look (U4);
the executor did not either.
Impact: the number fields look different from every other field of the site and are 8px below the 44px touch height.
Recommendation: EXTEND the canonical owners to `NumberInput`, adding no new value: `theme.ts` gets a `NumberInput` entry equal to `TextInput`'s
(`defaultProps` radius, size, `inputWrapperOrder`; `styles.input` `minHeight` and `color`); `input-chrome.css` adds `.mantine-NumberInput-input` (and
`.mantine-NumberInput-root` for the disabled fade) to the selector lists of the resting border and shadow, placeholder, focus, error, padding-top and
-bottom and text colour, start padding (guarded on `.mantine-NumberInput-wrapper:not([data-with-left-section])`), and the two disabled parts; the end padding
stays Mantine's, since the controls are a permanent right section.
References: `shared/ui-token-contract.md` U3, U4; `checklists/common.md` A2.
Status: Revision 9 R9-1.

## Acceptance criteria

- The unit tests of AC27-AC47 pass on the branch (above); AC36, AC42, AC43, AC44, AC45, AC46, AC47 turn red under their deliberate breaks (Reviews 6-9).
- AC9: the catalog part is met (Review 6: `db-catalog-audit.mjs` no finding, `supabase/catalog.json` refreshed). The round trip was refused by this
  session's permission classifier; the owner then applied `task957.sql` and `task957-parking.sql` in the SQL Editor without it (2026-11-23), after being
  told that the rollback files then stay unproven. It can no longer run as written: `task957.sql:7` creates `rate_limit_hits`, which now exists.
- AC4, AC8, AC37 (`[INT-EDIT-EMPTIED]`), AC39 (`--base origin/main`) and the census rows of `rendered-interaction-states.json` run in `CI Required` on
  the pull request; the verdict on them is `gh pr checks <n>` (V14).

## For the owner

- Visible changes against `main` that come from this task's design, not from a defect, for you to confirm or refuse (each measured above): the page
  title 24px → 36px at desktop width (canonical page header); the photo upload area (88px dashed) → a 44px button; the chips 36-40px round at 16px → 44px
  at 14px with 8px corners; labels 14px/500 black → 14px/600 gray-7; section titles 16px/600 → 16px/500; the fields 16px → 14px text; the number fields 40px → 44px (after R9-1).
- Hand checks: a number field on hover and focus in Chrome, Firefox and Safari and on a phone; a negative floor and a parking floor typed on an iPhone;
  the buttons of the edit page all at one size.
- Owner decisions O1019-1 and O1019-2 (2026-11-23, translated): the listing note is the owner's only (staff have no note field), one note without history,
  shown above its field with a pencil to edit and a trash icon to delete it for good; it is built in Task 1019, not here. Until then the note field of this
  form works as on `main` (it reports "Помилка при оновленні статусу", reproduced in the owner's Chrome on 2026-11-23).

F47 — the canonical delete icon is 44px beside 22px icons of the same row
Severity: Medium      Category: UI contract (approved behaviour A2, U4)      CWE: none
Location: src/design-system/mantine/patterns/MantineDeleteIconButton.tsx:27-36; src/components/admin/AdminPagesView.tsx (row actions);
src/modules/listings/components/CollectionsSection.tsx:146-156
Description: `MantineDeleteIconButton` (created in Revision 2, R2-8) always renders `size="lg"` with `mih`/`miw` `theme.other.touchTarget`. Measured on
`/admin/pages` in the owner's Chrome (2026-11-23): in every row "Відкрити перегляд" and "Редагувати" are 22×22 (`size="sm"`), "Видалити" 44×44; on
production (`main`) all three are 22×22. On `main` the three icons of a row took the 44px touch target together and only in the touch layout
(`AdminPagesView.tsx` `touchProps = touch ? { mih, miw } : {}`, applied to all three). In `CollectionsSection` the pencil stays `size="sm" radius="md"`
beside the 44px delete (read from the code; the owner's account has no collection to measure). The component's comment says it keeps the touch target
"as the admin pages' and the collections' delete controls were before this owner existed"; production shows that is not so.
Impact: on a desktop the delete icon is twice the size of its neighbours in every row of the admin pages table and of the collections list.
Recommendation: `MantineDeleteIconButton` without `onMedia` renders the row size of `main` (`size="sm"`), and takes the touch target only when the
consumer says the row is in its touch layout (a `touch` prop; `AdminPagesView` passes its `touch`, as it does for the other two icons); with `onMedia`
(the photo tile, owner decision O957-7) it stays as built; its comment states what `main` did. The `DeleteIconButton` Story shows the row size and the touch
size. `CollectionsSection`'s pencil drops its local `radius="md"` (a consumer radius, U3), so the pencil and the delete share the theme's radius (8px).
References: `checklists/common.md` A2; `shared/ui-token-contract.md` U4; `checklists/review.md` V5a.
Status: Revision 9 R9-2.

F48 — the description field is shorter than on `main` and lost its resize handle
Severity: Medium      Category: UI contract (approved behaviour A2)      CWE: none
Location: src/modules/listings/components/ListingFormShellView.tsx:189-198
Description: `main` renders the description as `Textarea rows={4}` with `min-h-40` (160px), a vertical resize handle (`resize-y`) and `max-h-128`
(512px) (`git show main:src/modules/listings/components/ListingFormShellView.tsx`, lines 186-193). The branch renders Mantine `Textarea autosize
minRows={4} maxRows={14}`: measured on the edit page (2026-11-23) 106px against 160px on production, and no handle (Mantine's `resize` defaults to
`none`). No kickoff item or review decided this; this review's own measurement had both heights and did not compare them (the owner asked, 2026-11-23).
The canonical handle for every Mantine multi-line field is Task 1008 (owner request 2026-11-19); until it lands, this form keeps `main`'s behaviour.
Impact: a long description starts in a smaller box and cannot be made taller by hand, as it could on `main`.
Recommendation: the description is a Mantine `Textarea` without `autosize`, with `resize="vertical"` and the `rows` whose measured height is at least
`main`'s 160px (`rows={7}`; the reviewer measures it, V5a); `main`'s 512px ceiling has no token and is not kept (stated in the report); nothing else changes.
References: `checklists/common.md` A2; `checklists/review.md` V5a.
Status: Revision 9 R9-3.

Addition to F46: on `main` the number fields measure 40px (legacy), the branch 36px; R9-1 gives them the canonical 44px of every other field (the
owner, 2026-11-23: "all text fields have a canonical colour"), a visible change from `main` listed under "For the owner".

Correction to Review 8 F45 (measured 2026-11-23 on production): `main`'s "Зберегти зміни" renders 16px, not 14px as F45 read from the legacy class list.
F45's fix stands on the owner's decision of 2026-11-23 ("one canonical font size … bring everything to one style": the theme's `sm`, 14px), not on
`main`.

## Rendered comparison (V5a, 2026-11-23, owner's Chrome, 1920px; `main` = production `https://lero.al`, the same database)

- Edit page `/uk/listings/<slug>/edit` and create page `/uk/listings/create`: every `TextInput`, `Textarea`, `Select` and combobox trigger 44px, border
  gray-3 `rgb(208,213,221)`, text gray-8, padding 16px (34px with an icon), shadow xs; every number field 36px, border `rgb(152,162,179)`, text black,
  padding 12px, no shadow (F46); every button 14px/500, 44px (after Revision 8); labels 14px/600 gray-7; section titles 16px/500; page title 36px/700 at
  this width (`MantinePageHeaderWithActions`, `TITLE_FZ.h2`); photo tile controls 44px (`onMedia`), the number and cover badges 24px pills.
- `main` renders the legacy form: fields 40-44px at 16px, chips 36-40px round at 16px, labels 14px/500 black, section titles 16px/600, page title 24px,
  photo controls 28px round, the number badge an 18px circle, the upload control an 88px dashed area, Save and Cancel 44px at 16px. The move to the
  canonical Mantine look is this task's design (owner decision 2026-10-20 "inherited canonical design"; R1-2 the page header; Revision 2 the upload button
  and `FilterChoiceGroup`; O957-7, O957-8 the photo tile; Revision 4 the number badge without `circle`); listed under "For the owner" to be confirmed.
- `/admin/pages`: F47. Favorites: no collection to render (code read, F47). The admin dialogs that render `StatusChangeSelect` do not pass `enableNote`,
  so the note label of R2-8 shows only in the listing form.
- Stories (Storybook dev server, the owner's Chrome, 2026-11-23): every Story of the 19 Story files the branch changes or that render a changed component
  (73) and the primitive Stories TextInput, Select, Textarea, PasswordInput, Button, ActionIcon, Badge and Checkbox, at 1920px; eleven of them also at 320,
  640 and 1024px (`ListingFormShellView` `OwnerStatusControl`, `ListingFormFields` `FieldKinds`, `ImageUpload` `WithPhotos`, `AdminPagesView` `Default`,
  `CollectionsSection` `Populated`, `StatusChangeSelect` `WithNote`, `DeleteIconButton` `States`, `FormSectionStack` `Default`, `AdminEditLayout` `Default`,
  and the TextInput and Button primitives). Every field of every Story is 44px, radius 8px, gray-3, gray-8 text and the resting shadow, with the
  primitives' disabled and error looks, except the number fields of every form Story (36px, `rgb(152,162,179)`, black, no shadow; disabled and error
  differ too: F46). Every button is 44px at 14px/500 at every width. `AdminPagesView`: 22px open and edit beside a 44px delete from 1024px, all three 44px
  in the touch layout below it (F47). `CollectionsSection`: the rename pencil 22×22 with radius 6px (`radius="md"` in the consumer) beside the 44×44 delete
  with radius 8px at every width (F47). The photo tile controls are 44px at every width (O957-7, O957-8). The admin user dialog's typed-confirmation field
  has a pink border in the `Delete` Story; that Story's 957 change is the `Cancel` Story only, so it is not this task's.
- Not measured: Firefox and Safari (no browser of theirs reachable from this session: the owner's look, V5a).

Owner decision O957-21 (2026-11-23, translated, to "the description field: canonical with `main`'s height, or as on `main`?"): "As on `main`": the
description keeps `main`'s vertical handle and 160px floor and does not grow by itself (F48, R9-3), until Task 1008 brings the canonical handle.

## Revision 9 (Sonnet; only these items)

- R9-1 (F46) the number fields take the canonical field look of `TextInput` (AC48).
- R9-2 (F47) the delete icon takes its row's size; the touch target only in a touch layout (AC49).
- R9-3 (F48) the description keeps `main`'s height and resize handle (AC50).

Open parts, in order: Revision 9 (Sonnet) → Review 10 → the commit and pull request (H) → `gh pr checks <n>` (V14) → the merge → archive (H7).
