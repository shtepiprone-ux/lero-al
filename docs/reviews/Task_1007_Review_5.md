# Task 1007 — Review 5

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json) · Previous: [Review 4](Task_1007_Review_4.md)

Review 5 of pull request #70 at c8d9f87aa (checklist V14, CI run 45379769180) — NEEDS REVISION
Scope: the red job "Lint, types and product checks" (`gh run view 45379769180 --job 138395448739 --log-failed`); 21 checks pass, Click-shield and the unit
run included; every commit of the pull request is signed (`verified=true`). The earlier runs stopped this job before its product checks (`check-files`,
then `owasp.mjs sync --verify`), so these three are seen for the first time: "33 of 36 product checks passed", failed `check:rendered-scope`,
`check:ui-contract`, `check:story-coverage`.
Findings: Critical 0, High 0, Medium 2 (F5, F6), Low 0
Overall risk: no product or security defect; the design enrolled seven route files as Story-proven components, and one changed Story keeps style props.
Both are misses of the kickoff (Opus, U2) and of Reviews 1-4 (Opus, U3), not of the executor.

## Findings

F5 — seven route files enrolled as migrated components
Severity: Medium      Category: Tests (the design-system gates)      CWE: none
Location: scripts/mantine-migration-scope.json (the seven `src/app/admin/*/page.tsx` entries this task added)
Description: the kickoff's U2 line asked to enrol the seven legacy pages whose `className` wrapper became `AdminPageFrame`. An enrolled file must be
imported by a canonical Story, carry a UI contract, and render only enrolled components; a `page.tsx` has no Story and renders the legacy managers
(`AdminCompaniesManager`, `AdminEmailTemplatesManager`, `AdminFooterManager`, `AdminLocationsManager`, `AdminPopularLocationsManager`,
`AdminPropertyTypesManager`, `AdminSettings`). `main` enrols no `page.tsx` (`git show main:scripts/mantine-migration-scope.json`); the element these pages
migrated, the frame, is enrolled (`src/components/admin/AdminPageFrame.tsx`, `:125`).
Impact: `check:story-coverage` ("7 manifest-enrolled component(s) have no canonical Mantine story"), `check:ui-contract` ("newly enrolled component
lacks an explicit UI contract", ×7) and `check:rendered-scope` ("7 rendered edge(s) not in the baseline", `[tier1-unenrolled]`) fail.
Recommendation: the seven entries leave the scope file (its list returns to `main`'s). No check of `main` is loosened (A9): the entries were added by this
pull request; the pages keep the frame and lose their Tailwind wrapper, which `adminPageFrame.test.ts` proves. Migrating the seven managers is not this
task's Cause.
Status: Revision 3 R3-1.

F6 — the changed `AdminPageFrame` Story styles its placeholder
Severity: Medium      Category: Tests (UI contract, checklist U3)      CWE: none
Location: src/stories/patterns/mantine/AdminPageFrame.stories.tsx:39-40
Description: `<Paper withBorder radius="lg" p="lg">` and `<Text size="sm" c="dimmed">` were on `main` too, inside the removed `frameStory`; moved to
`Default`, they are changed lines, and `check-ui-contract.mjs` rejects style props on a wrapper of a changed canonical Story. Reviews 1-4 did not flag it
(U3: "no `style`, `styles`, `className`, colour, size, radius, spacing or shadow literal in a consumer or Story").
Impact: `check:ui-contract` fails four times (`[story-wrapper-presentation]` `radius`, `p`, `size`, `c`).
Recommendation: `Default` renders its content inside the frame with canonical components and their public state only, no style prop on any wrapper
(for example `AdminPageHeader` alone, or with one canonical component that takes only data props).
Status: Revision 3 R3-2.

## Notes

- A5: `product-gates.mjs` and its checks (`check:story-coverage`, `check:ui-contract`, `check:rendered-scope`) run only on GitHub; the revision is
  written to their documentation (`docs/storybook-governance.md` §15, the rule texts above) and proven by the next CI run.

## Revision 3 (Sonnet; only these items)

- R3-1 (F5) `scripts/mantine-migration-scope.json`: the seven `page.tsx` entries leave.
- R3-2 (F6) `AdminPageFrame.stories.tsx` `Default`: no style prop on any wrapper.

Open parts, in order: Revision 3 (Sonnet) → Review 6 → the commit and push to pull request #70 (H) → `gh pr checks 70` → the merge → the moderator check
of Route step 5 → the archive (H7).
