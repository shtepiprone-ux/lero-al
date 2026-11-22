# Task 957 — Review 3

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 3 of Revision 2, working tree on 213103f0a (uncommitted) — NEEDS REVISION (3; the owner allowed a third revision on 2026-11-21)
Basis: the owner checked every Story Revision 2 created or changed by hand on 2026-11-21 (Opus's list of 45 Story ids)
and returned the findings below; Opus then read, for each finding, the code of the branch and of `main` it names.
Owner, 2026-11-21 (translated): "Sonnet started changing approved functionality on its own. This must be forbidden
directly"; "do not run the Stories check, I will check it by hand much faster". The narrowed run of
`scripts/check-stories-rendered.mjs` started for this review was stopped on that order; no rendered Story check was run.
Accepted by the owner, unchanged: `Mantine/Primitives/Combobox` `YearCombobox`, `AdminUserProfileDialogsView` `Cancel`,
`FormSectionStack` `Untitled`, `StatusChangeSelect` `WithNote`, `ListingFormShellView` `Owner`, `Create`, `Staff`,
`Submitting`, `AdminEditLayout` `Default` (its gutter aside, F17), `ListingFormShellContainer` `Create` (F17 aside),
`DeleteIconButton` `States`, `ImageUpload` `Empty`, `WithPhotos`, `SinglePhoto`, `LimitReached` (the tile aside, F21).
Rules changed in this review at the owner's request (the owner approves them in the pull request): the
approved-behaviour rule in `CLAUDE.md`, `.claude/rules/flow.md` (rule, §1 step 3, §2 step 1, §3),
`.claude/rules/kickoff-template.md` ("Kept as on `main`"), `.claude/rules/shared/canonical-component-reuse.md`
(a migration keeps the behaviour of `main`, with F16 as the example), `.claude/rules/shared/storybook-proof.md` (GR-3d,
consistent fixtures, interactive Stories), `.claude/skills/execute-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`,
`.claude/agents/executor.md`.
Tools (local): `node scripts/quality/owasp.mjs review <kickoff> --base main` exit 1 before this review ("no verdict for
Third_Party_Javascript_Management (triggered by the diff)": the `.storybook/main.ts` alias of Revision 2), then the two
verdicts below; `node scripts/quality/check-files.mjs` over the changed rule files 8 files 0 findings. Not run, stated
as not done: the `quality` and `dependencies` job steps and the reruns of Sonnet's claims (the verdict returns the tree
and Review 4 runs them on Revision 3's tree), the rendered census and every rendered Story check (owner order above).
Not read in this review: the files of Revision 2 that no finding names; Review 4 reads every file Revision 3 changes in
full.
Findings: Critical 0, High 0, Medium 1 (F16), Low 10 (F17-F26), all to Revision 3.
Overall risk: no security finding; the visible form changed approved behaviour (the number fields lost their step
arrows, the cover tile its border, the save error is not seen where the owner expects it), and the Stories cannot show
the product: no edge gutter, nothing reacts, errors that the form would never produce, no photographs.

New requirements of the owner's check (not findings; flow.md §3 "A revision only fixes findings"): every refused or
failed photo names its reason → owner decision O997-2 in Task 997 (it owns the upload window's text); the owner of a
listing is not offered "Under Review" → Task 1009 (new, Sprint 94); parking kinds (underground, private street, city)
with a floor and a garage option → owner decision O1001-2 in Task 1001 (it adds parking). Each is in `docs/backlog.md`
with the owner's words; its kickoff is revised by `create-task` before the task starts.

OWASP record (this review): `AI_Agent_Security` was "not applicable — no agent … changed by this diff"; the diff now
changes agent instructions (the rule files above), so `met` (they only narrow what an agent may do; `.claude/settings.json`
unchanged against `main`). `Third_Party_Javascript_Management` `met`: the Storybook stub of `next-cloudinary` loads no
script; the product's loader fetches the widget over HTTPS only (`CldUploadWidget-088119fa.esm.js:201`), as on `main`.

F16 — the number fields lost the step arrows they have on `main`
Severity: Medium      Category: Business logic (approved behaviour)      CWE: none
Location: src/modules/listings/components/form/NumberTextInput.tsx:29-42
Description: `main` renders every number field of the listing form as `<Input type="number">` (for example `git show
main:src/modules/listings/components/form/NumInputField.tsx`), which shows the browser's step arrows. Revision 2 renders
Mantine `TextInput type="number"`; Mantine's input CSS sets `appearance: none` on the spin buttons
(`node_modules/@mantine/core/styles.css:1550-1557`, class `m_8fb7ebe7`, the `Input` `input` class of
`esm/components/Input/Input.module.css.mjs:2`), so bedrooms, bathrooms, toilets, floor, building floors and the areas
became plain boxes. The cause is Opus's design: Task 905 §3.3 R2 named `TextInput type="number"` and this kickoff's
Revision 2 took it over; Sonnet followed it.
Impact: an approved control is gone from the form people use to create and edit listings.
Reproduction: owner, `Patterns/Mantine/ListingFormFields` and `ListingFormShellView`, 2026-11-21: "almost all fields
became just text fields"; the CSS lines above.
Recommendation: Mantine `NumberInput` with `clampBehavior="none"` (the native input never changed a typed value).
References: `.claude/rules/flow.md` approved-behaviour rule; `.claude/rules/shared/canonical-component-reuse.md`.
Status: Revision 3 R3-1 (kickoff Scope "Revision 3", AC27).

F17 — four Story files have no edge gutter (GR-3d)
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/patterns/mantine/ImageUpload.stories.tsx:28, ListingFormShellView.stories.tsx:78, AdminEditLayout.stories.tsx:15, ListingFormShellContainer.stories.tsx
Description: each sets `skipCanvas: true`, which removes the canvas gutter (`.storybook/preview.tsx` `withCanvas`), and
none imports `StoryPageGutter` (`src/stories/_StoryPageGutter.tsx`), while `ListingFormFields` and `DeleteIconButton`
do. GR-3d (`docs/rules/golden/gr-3d-story-gutter.md`) has no gate: its gate, Task 909, was filed 2026-10-01 and never
run, the skills of the 2026-11-06 reset did not name it, and this kickoff had no GR-3d line (Opus's design).
Impact: the owner cannot judge the component at its real distance from the screen edge; a repeat of the owner's
2026-09-29 rule.
Reproduction: owner, 2026-11-21, every Story of the task: "no gutters from the screen edges".
Recommendation: the gutter on every side the content lacks, per export.
References: GR-3d; `.claude/rules/shared/storybook-proof.md` (gutter line added in this review).
Status: Revision 3 R3-2 (AC28); the repository-wide gate stays with Task 909.

F18 — the composition Stories do not react
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx:59, :66
Description: the Stories pass `patch: () => {}` and `onSubmit: () => {}`, so typing, choosing or removing a photo
changes nothing; `storybook-proof.md` asks for a stateful harness when a control does nothing.
Impact: the owner cannot see what happens after an action (for example whether the upload button returns after a photo
is removed at the limit).
Reproduction: owner, `PhotoLimitReached`, 2026-11-21.
Recommendation: one fixture harness holding the form data for every composition Story.
References: `.claude/rules/shared/storybook-proof.md`.
Status: Revision 3 R3-3 (AC29).

F19 — the Stories show errors the form would never produce
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx:21, :119; src/stories/patterns/mantine/ListingFormFields.stories.tsx:74-75
Description: `WithErrors` selects `apartment` and shows `error_property_type`; `WithValuesAndErrors` fills the condition
(`good`) and shows `error_required` under it. The real checks (`ListingFormShell.tsx:178-209`) give neither for those
values.
Impact: the owner reads the Story as a validation fault of the platform.
Reproduction: owner, 2026-11-21: "Apartments is selected, but an error is shown"; "why does Condition show 'This field
is required'?".
Recommendation: the checks moved unchanged into a pure function the Shell and the Story harness both call; the Story's
errors come from a Save over values that fail.
References: `.claude/rules/shared/storybook-proof.md` (consistent fixtures, added in this review).
Status: Revision 3 R3-4 (AC29).

F20 — the photo fixtures are colour fills, not photographs
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/fixtures/listingPhotos.fixture.ts
Description: each fixture photo is an SVG of one colour with the text "Fixture photo n"; the listing card Stories already
use photographs (`src/stories/fixtures/cardListingData.fixture.ts:39-42`).
Impact: the owner cannot judge the badges and controls over a real photo.
Reproduction: owner, 2026-11-21: "I see just a fill in each photo frame".
Recommendation: the photographs of `cardListingData.fixture.ts`.
Status: Revision 3 R3-5 (AC30).

F21 — the photo tile's controls
Severity: Low      Category: UI contract (owner decision)      CWE: none
Location: src/modules/listings/components/ImageUpload.tsx:227-245; src/design-system/mantine/patterns/MantineDeleteIconButton.tsx:23-41
Description: the controls sit in two rows under the image, delete is the `subtle` canonical icon (Revision 2 R2-8, Opus's
design, against `main`'s filled red delete at `main` `ImageUpload.tsx:158-165`), and the star has no visible meaning.
Owner decisions 2026-11-21: O957-7 delete with a fill in the photo's top right corner and up/down stretched across the
tile's width; O957-8 the star stays as on `main`, next to delete in the top right corner.
Impact: the owner's layout is not met; a `subtle` delete over a photo merges with it.
Reproduction: owner, `ImageUpload` and `ListingFormShellView`, 2026-11-21.
Recommendation: as the kickoff Scope "Photo tile"; `onMedia` on the canonical delete action.
Status: Revision 3 R3-6 (AC31).

F22 — the cover tile lost its border
Severity: Low      Category: Business logic (approved behaviour)      CWE: none
Location: src/modules/listings/components/ImageUpload.tsx:213
Description: `main` draws the cover tile with a 2px primary border and the others transparent (`main`
`ImageUpload.tsx:107-108`); Revision 2 renders every tile as the same `Card withBorder`.
Impact: an approved cue for the cover photo is gone.
Reproduction: the two lines above.
Recommendation: the selected look through a canonical owner.
Status: Revision 3 R3-6 (AC31).

F23 — the number and cover badges look different from `main`
Severity: Low      Category: UI contract (approved behaviour)      CWE: none
Location: src/modules/listings/components/ImageUpload.tsx:218-220
Description: the owner sees other colours than on `main`; the code uses the same `MantineBadge` variants (`main` `:114`
`photoMark`/`cover`, `:172` `count`). Cause UNKNOWN.
Reproduction: owner, `ImageUpload`, 2026-11-21.
Recommendation: measure both badges' computed colours on production and in the Story; fix the cause at its owner.
Status: Revision 3 R3-6 (AC32).

F24 — the save error is not at the top of the form
Severity: Low      Category: UI contract (owner decision)      CWE: none
Location: src/modules/listings/components/ListingFormShellView.tsx:238-242
Description: the alert is the last element of the main column, as on `main` (`:273`); Opus's description to the owner
("shown at the top") was wrong. Owner decision O957-9, 2026-11-21: move it to the top.
Recommendation: first element of the main column, scrolled into view and focused after a failed save.
Status: Revision 3 R3-7 (AC33).

F25 — Discard on a phone moves the page
Severity: Low      Category: UI contract (interaction)      CWE: none
Location: src/stories/patterns/mantine/ListingFormShellView.stories.tsx:150-162 (`CancelConfirmation`)
Description: after Discard the bottom sheet closes and the interface moves down a few pixels (owner, 2026-11-21). Cause
UNKNOWN.
Recommendation: record scroll position, page styles and focus before, during and after; fix at the owner the values name.
Status: Revision 3 R3-8 (AC34).

F26 — two Stories with no value for the owner
Severity: Low      Category: UI contract (Story proof)      CWE: none
Location: src/stories/patterns/mantine/ImageUpload.stories.tsx:55; src/stories/patterns/mantine/DeleteIconButton.stories.tsx:47
Description: `Disabled` is the saving state but does not say so; `Clickable` shows a click counter, while the click is
proven by `MantineDeleteIconButton.test.tsx:25-30`.
Reproduction: owner, 2026-11-21: "why is this Story needed at all?"; "what is this click counter for?".
Recommendation: `Disabled` becomes `Saving` with a description; `Clickable` goes.
Status: Revision 3 R3-9 (AC35).

Revision 3 (Sonnet; only these items; three passes over every file it changes, failing-first for each new case; the
approved-behaviour rule: anything else that would change what `main` does is stopped and reported):
- R3-1 (F16) `NumberTextInput` on Mantine `NumberInput` (AC27).
- R3-2 (F17) the GR-3d gutter in every export of the four Story files (AC28).
- R3-3 (F18) `src/stories/fixtures/ListingFormHarness.tsx` for every composition Story (AC29).
- R3-4 (F19) `src/modules/listings/lib/validateListingForm.ts`, called by the Shell and the harness; Story errors from it (AC29).
- R3-5 (F20) photographs in `listingPhotos.fixture.ts` (AC30).
- R3-6 (F21, F22, F23) the photo tile of O957-7/O957-8, `onMedia`, the cover border, the badge colours measured (AC31, AC32).
- R3-7 (F24) the save error at the top (AC33).
- R3-8 (F25) the Discard jump's cause and fix (AC34).
- R3-9 (F26) `Saving` and no `Clickable` (AC35).
Sonnet runs no rendered Story check over the whole library; the owner checks the changed Stories by hand.

Open parts, in order:
0. Sonnet runs Revision 3 (`.claude/skills/execute-task/SKILL.md`); Opus reviews it (Review 4).
1. Then the open parts 1-4 of Review 2 (the SQL, AC8 and AC9, the pull request and its checks, the steps after the
   deploy), and the owner's approval of the rule files recorded as a comment on the pull request (`flow.md` §4 step 1).
