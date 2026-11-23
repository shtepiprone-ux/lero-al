# Task 957 — Review 12

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 12 of Revision 11, working tree on 163534aac (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 11 diff (R11-1): `input-chrome.css` (ten `FileInput` selectors in existing lists) and `listingFormMantine.test.ts` (one block, three tests).
Tools (local, 2026-11-23): `npm test --` the 3 files of the report → exit 0, 194 passed, as reported; `git diff HEAD --stat` → 43 files (Revisions 5-11).
V5a in the owner's Chrome: the Storybook `Patterns/Mantine/RichTextEditor` `ImageUploading` Story and the app page `/admin/pages` → edit dialog →
Insert → Insert image (opened and closed with Escape; nothing saved). Not run (A5): `tsc`, lint, the unit job, build, census.
Findings: Critical 0, High 0, Medium 0, Low 1 (F53); F52 fixed except the end padding
Overall risk: no security change; the file field now has the canonical look but for 1.3px of end padding while it holds no file.

## Secure code review (`secure-code-review.md` §2, §3)

Selectors added to existing stylesheet lists and tests: no entry point, query, permission, schema, dependency or configuration. Every category of §3:
not touched.

## Rendered comparison (V5a, 2026-11-23, 1920px)

- Storybook `ImageUploading` and the app's insert-image dialog, the same values in both: `FileInput` 44px, radius 8px, border `rgb(208,213,221)`, padding
  top 10px, start 16px, text `rgb(29,41,57)`, shadow, placeholder `rgb(152,162,179)`, root opacity 1; the dialog's `TextInput` the same, except the end
  padding: `FileInput` 14.67px, `TextInput` 16px. The empty `FileInput` has no right section (`data-with-right-section` absent on its wrapper): its clear
  button (`clearable`, `MantineRichTextEditor.tsx:403`) appears only once a file is chosen.
- `/admin/pages`: the open, edit and delete icons of a row are one size (screenshot).
- The executor's I8a (Storybook, 320 to 1440px) agrees; its "the end padding is left to Mantine's clear button" holds only while a file is chosen.

## Findings

F52 — fixed in Revision 11, except the end padding (F53).

F53 — the empty file field's end padding is Mantine's, not the canonical 16px
Severity: Low      Category: UI contract (U4, O957-22)      CWE: none
Location: src/design-system/mantine/input-chrome.css (the end-padding rule, `.mantine-TextInput-wrapper:not([data-with-right-section]) .mantine-TextInput-input`)
Description: the canonical end padding (16px) is given to a field without a right section; R11-1 (Opus) listed the start padding for `FileInput` and not the
end padding, so an empty `FileInput` keeps Mantine's `calc(var(--input-height) / 3)`, 14.67px, measured in Storybook and on `/admin/pages`.
Recommendation: the end-padding rule adds `.mantine-FileInput-wrapper:not([data-with-right-section]) .mantine-FileInput-input`; with a file chosen the clear
button's section keeps Mantine's reservation, as `Select`'s chevron does.
Status: Revision 12 R12-1.

## For the owner

- The executor asked whether proceeding on a non-empty `git status` (I1) is accepted: yes; each Revision block keeps the earlier revisions' uncommitted
  tree (stated in every executor prompt since Revision 5).
- Safari: UNKNOWN (no Safari available).

## Revision 12 (Sonnet; only this item)

- R12-1 (F53) the empty file field's end padding takes the canonical rule (AC55).

Open parts, in order: Revision 12 (Sonnet) → Review 13 (V5a) → the commit and pull request (H) → `gh pr checks <n>` → the merge.
