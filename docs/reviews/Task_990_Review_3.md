# Task 990 — Review 3

Kickoff: [Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md](../../tasks/Sprints/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md) · OWASP record: [Task_990.json](../security/owasp/reviews/Task_990.json)

Review 3 of the working tree on 2c91e20a9 (branch `task/990-a-new-page-reaches-the-site`, Revision 2 uncommitted) — APPROVED
Scope: diff-based, `git diff 2c91e20a9` (Revision 2, F6): `PageEditorDialogView.tsx`, `MantineRichTextEditor.tsx`, `AdminPagesManager.smoke.test.tsx`; the page `/admin/pages`; the Stories of the two changed components; the executor's Revision 2 report
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46147156669 green; Route 54 files 1069 passed; integration 8 files 52 passed; `vitest related` 5 files 74 passed; ESLint → exit 0; typecheck → 80 errors, all in the stale `.next`, 0 in `src`; `owasp.mjs review` → exit 0; V5a in Chromium and Firefox on the Storybook and app dev servers
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: F6 is removed and holds in Chromium and Firefox at every width; the same Escape loss inside the editor's menus comes from shared overlay components this diff does not change and is Task 1081.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → Repository settings 46148491112 success, CI 46147156669 success, CI 46027702079 success (#85).
- V2: `git diff --stat 2c91e20a9` → the three files of Revision 2, 72 insertions, 2 deletions. Every hunk is the Revision 2 item: the editor's `onDialogChange` (prop, docstring, one effect), the view's `editorDialogOpen` guard of the modal's `onClose` (Cancel unchanged), the `[F6]` tests; the view's docstring line names the new state. Nothing outside it.
- V3: rerun of the report.
  - Route: `npm test -- <the 54 Route files>` → "Test Files 54 passed (54)", "Tests 1069 passed (1069)", exit 0. Reproduced.
  - Integration: `vitest run --config vitest.integration.config.ts <the 8 Route files>` (`SECURITY_TEST_TARGET=development`, `.env.local` loaded by a launcher that prints no value) → "Test Files 8 passed (8)", "Tests 52 passed (52)", exit 0; afterwards `pages` holds only its three pages (no synthetic row left). Reproduced.
  - §8.1 import graph: `npx vitest related --run --reporter=verbose <the 3 changed files>` → 5 files (`serverNowProps`, `AdminPagesManager.smoke`, `MantineRichTextEditor.smoke`, `MantineRichTextEditor.toolbar`, `richTextRoundTrip`), "Tests 74 passed (74)", exit 0; integration collection → "No test files found", exit 0. Text search by name as well as by path (`PageEditorDialogView`, `MantineRichTextEditor`, `onDialogChange`, `useCmsEditorLabels`, `RichTextEditorLabels` over `src`, `scripts`, `.storybook` test files) → 4 files, all in the graph's set. The report's search by path only found 0; no test is missed.
  - `npx eslint --no-warn-ignored --max-warnings 0 <the 3 files>` → exit 0. `npm run typecheck` → exit 1 (the report says 2), 80 errors, every one in `.next/types`, 0 in `src`: not a finding of this diff.
  - Failing first: see V8. Reproduced.
- V4: every changed file read. `MantineRichTextEditor.tsx:263-270`: `dialogOpen = fullscreen || imageOpen`, reported once per change through a ref, not on mount. `PageEditorDialogView.tsx:161-168`: `closeUnlessEditorDialog` reads the state of the render that opened the nested dialog, so Mantine's window listener, which fires for both modals in the same event, finds it `true`. The four language panels each mount an editor; each reports only its own change, and only the active one can open a dialog. The change removes the Cause of F6.
- V5: against `main`: the page dialog's Escape and Cancel close it as on `main` when no editor dialog is open (`[F6] (c)`, and V5a below); no visible element changes.
- V5a:
  - Pages, local app dev server started by the reviewer (`npm run dev`, stopped after; `AGENTS.md` sha256 `b7de756f…` and `CLAUDE.md` `948b5888…` before and after), signed in as `HYDRATION_ADMIN` through `signInWithPassword`, `/uk/admin/pages`, a title typed, nothing saved (no POST other than presence and monitoring). Visible dialogs counted (a hidden `Drawer` content with `role="dialog"` stays in the DOM below 640px).
    - Chromium, 320, 640, 1024, 1440: full screen 2 → Escape → 1 (the title kept, the focus on "На весь екран") → Escape → 0; "Додати медіафайл" 2 → 1 (the title kept) → 0. The full-screen tool 44×44 at 320, 26×26 from 640, radius 8px, `rgb(52, 64, 84)` on white, 16px/400; the full-screen close 44×44, radius 9999px, `rgba(52, 64, 84, 0.1)`; "Додати медіафайл" 181×44, radius 8px, `rgb(52, 64, 84)` on white, 14px/500 — the values of Review 2. No overflow, no console error.
    - Firefox (WebDriver BiDi, `puppeteer-core`, `C:/Program Files/Mozilla Firefox/firefox.exe`), 320 and 1440: full screen 2 → 1 (title kept, focus on "На весь екран") → 0; "Додати медіафайл" 2 → 1 (title kept) → 0. Same as Chromium.
    - The editor's table menu (the executor's A4 report): one Escape leaves no dialog and the title is gone, at 320 (bottom sheet) and at 640, 1024, 1440 (anchored); the focus was on the page dialog element in 7 of 8 openings; in the one opening with the focus inside the menu, Escape closed only the menu. `MantineDropdownMenu.tsx`, `MantineModal.tsx`, `responsiveBottomSheet.tsx` and `@mantine/*` are unchanged against `main` (`git diff --stat main`), and `main`'s editor opened its five menus through the same component inside the same dialog (`git show main:…MantineRichTextEditor.tsx`, `:240-242`). INFERENCE: the same on `main`; production was not measured (a scripted session there was refused by the session's permission policy). Not a defect of this diff; filed as Task 1081 (checklist A4).
  - Stories, Storybook dev server started by the reviewer (`npm run storybook -- --no-open`, stopped after), Chromium, sq, en, uk, it × 320, 640, 1024, 1440 (16 renders each): RichTextEditor `WithContent` — the full-screen close 44×44, radius 9999px, `rgba(52, 64, 84, 0.1)`, keyboard focus 2px solid `rgb(236, 84, 71)` offset 2px, the focus back on "Fullscreen" (in each language) after the close control and after Escape; the "Add media" dialog's close 44×44 pill `rgba(52, 64, 84, 0.1)` from 640px (a bottom sheet at 320); no overflow, no console error. PageEditorDialogView `New`: the Albanian tab selected, the switch on. `TitleRequired`: input border `rgb(217, 45, 32)`, the error 12px/400 `rgb(217, 45, 32)`, not clipped; `SlugError` 12px/400 `rgb(217, 45, 32)` — equal in all 16. Unchanged against Review 2, as the diff changes no style.
- V6: the diff adds or removes no `eslint-disable`, `.skip`, `.only`, `.todo`, `@ts-*`, allowlist, baseline or registry row (`git diff 2c91e20a9 | grep` → exit 1, no match).
- V7: §2: (1) no control changes; (2) no new input, output or entry point: a client-side flag between two components; (3) no trust boundary crossed; (4) no dependency; (5) three tests added, none changed or loosened; (6) §3: Authorization, Authentication and sessions, Requests and redirects, Files, Next.js entry points, Data exposure, Dependencies and configuration, Agent and tool output, Data: not touched (`git diff --name-only 2c91e20a9` holds no server file, action, route, policy, upload or configuration). Input and output: not touched (no value rendered or parsed). Business logic: touched — the invariant "Escape closes the topmost dialog only, the page form keeps its input" now holds for the editor's two dialogs (`[F6]`). JavaScript and TypeScript: touched — no `any`, no dynamic code; the effect's deps are complete (ESLint exit 0). Tests: V8.
- V8: `PageEditorDialogView.tsx` and `MantineRichTextEditor.tsx` put back to `2c91e20a9` (`git show`), `npm test -- …AdminPagesManager.smoke.test.tsx -t "F6"` → exit 1, "Tests 2 failed | 1 passed | 18 skipped (21)": `[F6] (a)` and `(b)` failed, `(c)` passed (it pins `main`'s behaviour); restored, sha256 of both equal to the copies taken before.
- V9: below.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0; the record `Task_990.json` holds a verdict for every triggered sheet; Revision 2 triggers none beyond them.
- V11: no finding. The executor's A4 report is Task 1081.
- V12: this file, linked from the kickoff; `check-files.mjs` on the kickoff, this file and `docs/backlog.md`.
- V13: APPROVED.

## Findings

No findings.

## Stories for the owner (V9)

The reviewer's measurements are in V5a; the owner's look comes last.

- Patterns/Mantine/RichTextEditor — Default, WithContent, WithError, ImageUploading, TextMode: full screen and its round close; Escape and the close control return the focus to "Fullscreen".
- Patterns/Mantine/PageEditorDialogView — New (Albanian tab, "Published"), TitleRequired, EditPublished, SlugError, PublishBodyRequired, RichContent at 320 and 1440. The Escape fix of F6 shows only on `/admin/pages` (the Stories' `onClose` does nothing).

## Open for Opus and the owner

- Task 1081 (Sprint 93, P2): Escape in a menu inside a dialog closes the dialog.
- Task 1080 (Sprint 93, P1): the sweep covers every table an integration suite writes.
- Opus, after the merge: the Route's step 5 (`HYDRATION_ADMIN` in Ukrainian saves `opus-990-check`, opens it on the site, deletes it), then H7.
