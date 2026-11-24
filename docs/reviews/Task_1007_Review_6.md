# Task 1007 — Review 6

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json) · Previous: [Review 5](Task_1007_Review_5.md)

Review 6 of the working tree on c8d9f87aa (pull request #70, uncommitted Revision 3) — APPROVED
Scope: Revision 3 changed `scripts/mantine-migration-scope.json` (−7 lines: the seven `page.tsx` entries; `git diff main --` the file → empty) and
`src/stories/patterns/mantine/AdminPageFrame.stories.tsx` (the `Paper` and `Text` placeholder and their import removed, the header comment updated):
exactly R3-1 and R3-2. The kickoff and `docs/reviews/Task_1007_Review_5.md` are Opus's.
Tools (local, 2026-11-24): `npx eslint` on the Story → exit 0; `check-files.mjs` on both files → exit 0; `npm test --` `adminPageFrame.test.ts`,
`scripts/__tests__/mantine-story-scope.test.ts`, `AdminShell.pages.test.tsx`, `check-signed-in-pages.test.ts` → exit 0, 4 files, 88 passed. Not run (A5):
`product-gates.mjs` and its `check:ui-contract`, `check:story-coverage`, `check:rendered-scope`: UNKNOWN until the next CI run of pull request #70.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: F5 and F6 are removed at their cause (the scope file equals `main`'s; the changed Story has no wrapper with a style prop); the three gates
are confirmed only by CI.

## Checklist V on the revision

- V2, V4: two files; `AdminPageFrame.stories.tsx` `Default` renders `AdminPageFrame` > `AdminPageHeader` with data props only (`grep` of style props on
  the file → none).
- V3: the executor's four commands reproduce (above).
- V5a, V9: `patterns-mantine-adminpageframe--default` (Storybook dev server, iframes, locale uk): 320px → padding 24px, `max-width: none`, frame 320px,
  heading 20px/600 (GR-3c below 640px), no overflow; 1024px → 32px, none, 784px (240px navbar), heading 24px/600; 1440px → 32px, none, 1200px; no `Paper`
  left. The frame values equal Review 1; the placeholder card is gone (a Story-only element, no production surface).
- V6: no exemption added; the scope file loses only this task's own entries, so no check of `main` is loosened (A9).
- V7: Tests (the design-system gates) — touched; every other category — not touched.
- V8: the executor's I8a and the values above; the gates' failing state is Review 5's CI run 45379769180; the passing state is the next run.
- V10: `owasp.mjs review` exit 0.

Open parts, in order: the commit and push to pull request #70 (H) → `gh pr checks 70` → the merge → the moderator check of Route step 5 → the archive
(H7).
