# Task 990 — Review 2

Kickoff: [Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md](../../tasks/Archive/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md) · OWASP record: [Task_990.json](../security/owasp/reviews/Task_990.json)

Review 2 of the working tree on 646917f67 (branch `task/990-a-new-page-reaches-the-site`, Revision 1 uncommitted) — NEEDS REVISION
Scope: diff-based, `git diff 646917f67` (Revision 1): `MantineRichTextEditor.tsx`, its toolbar test, `PageEditorDialogView.tsx`, `PageEditorDialogView.stories.tsx`, `scripts/rendered-interaction-states.json`, the four message files; the pages `/admin/pages` and `/admin/footer`; the executor's Revision 1 report
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46147156669 green; Route 54 files 1066 passed; `vitest related` 166 files 2234 passed, integration 5 files 20 passed; ESLint → exit 0; typecheck → 80 errors, all in the stale `.next`, 0 in `src`; V5a on Storybook (Chromium) and on the local app dev server (Chromium, `HYDRATION_ADMIN`)
Findings: Critical 0, High 0, Medium 1, Low 0
Overall risk: Revision 1 closes F1-F4; on the real page, Escape inside the new full-screen view (and inside "Add media") closes the whole page dialog and loses what the admin typed, which no Story can show because the Stories' `onClose` does nothing.

## Checklist V

V1-V4 and V6-V10 ran in the first part of this review (2026-11-28, before the owner's decision on the synthetic rows); V1 was repeated and V5a (1) ran after that decision, the same day.

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → Repository settings 46148491112 success, CI 46147156669 success (schedule), CI 46027702079 success (Task 989, #85).
- V2: `git diff --stat 646917f67`: the four message files, `scripts/rendered-interaction-states.json`, `PageEditorDialogView.tsx`, `MantineRichTextEditor.tsx`, its toolbar test, `PageEditorDialogView.stories.tsx`; plus Opus's `docs/backlog.md` and `Task_990.json`. Each file is a Revision 1 item's file (the two outside the Scope by the owner's permission of 2026-11-28). The focus return after full screen (`MantineRichTextEditor.tsx:248-255`) is outside the four items: accepted under A4, because full screen is new in this task and without it the focus fell to `body`.
- V3: rerun of the report: Route `npm test --` 54 files, 1066 passed, exit 0; §8.1 import graph `npx vitest related --run` 166 files, 2234 passed, exit 0; integration collection 5 files, 20 passed, exit 0; text search: 3 files outside the graph, run, 10 and 32 passed; `npx eslint --no-warn-ignored --max-warnings 0` over the changed code files → exit 0; `npm run typecheck` → 80 errors, all in the stale `.next/types`, 0 in `src`. Reproduced.
- V4: every changed file read once. F1: 18 rows removed, 9 changed, 21 added, no duplicate id. F2: `New` starts published, `TitleRequired` renders `sqTitleError`. F3: the full-screen close is `ActionIcon variant="light" color="gray" radius="pill" size="xl"` named `fullscreenClose` (`MantineRichTextEditor.tsx:596`). F4: the six keys are gone from the four files. The executor's three objections to Revision 1 hold and are the reviewer's errors: no `text-mode` mount row is possible (the Story opens no portal on start); the `~add-media` rows are needed or the census discovers an unregistered trigger; the editor triggers inside the page dialog are covered by that dialog's mount row (`scripts/rendered-state-census/discover.mjs:59`).
- V5: against `main`: the changes are the Revision 1 items; the full-screen close now equals the canonical dialog close (`MantineModal.tsx:109`).
- V5a:
  - Stories (first part), Storybook dev server, Chromium, en, uk, sq, it × 320, 640, 1024, 1440: the full-screen close 44×44, radius 9999px, background `rgba(52, 64, 84, 0.1)`, the same as the "Add media" dialog's canonical close; keyboard focus 2px solid `rgb(236, 84, 71)`; after Escape and after the close control the focus is on "Fullscreen" (RichTextEditor Story, no dialog around it); `New` opens on the Albanian tab with "Published"; `TitleRequired`: the error 12px/400 `rgb(217, 45, 32)`, input border `rgb(217, 45, 32)`, the same as the slug error; nothing clipped, no overflow, no console error. Firefox: not reachable (Playwright's Firefox is not installed); left to the owner's look.
  - Pages, local app dev server started by the reviewer (`npm run dev`, stopped after; `AGENTS.md` sha256 `b7de756f…` before and after), Chromium (Playwright), signed in as `HYDRATION_ADMIN` through `signInWithPassword`, nothing saved. The first part was `BLOCKED`: 15 synthetic `pages` rows with `content = {}` made `isMigrationPending` (`adminPagesContent.ts:34`) disable "New page"; the owner decided their removal (below). The admin's account language is `uk`, so `/sq/admin/pages` answers `/uk/admin/pages` (Task 988); measured in `uk`:
    - `/uk/admin/pages`, 320, 640, 1024, 1440: no alert; "New page" enabled, 44px, radius 8px, `rgb(236, 84, 71)` on white text, 14px/500 (272px wide at 320, 148px from 640). The dialog opens on "Албанська" with the switch on; its close 44×44 pill `rgba(52, 64, 84, 0.1)` (640-1440; the bottom sheet at 320 has none, as on `main`). The full-screen tool 44×44 at 320, 26×26 from 640, radius 8px, `rgb(52, 64, 84)` on white. The full-screen close 44×44, radius 9999px, `rgba(52, 64, 84, 0.1)`, the same as the page dialog's close; keyboard focus on it 2px solid `rgb(236, 84, 71)`, offset 2px (320, 640, 1440; at 1024 the scripted Shift+Tab, Tab left the focus elsewhere, so that one value was not read). The close control returns the focus to "На весь екран" and the page dialog stays open (all four widths). Save without the Albanian title: the dialog stays open, the title input `data-error`, border 1px `rgb(217, 45, 32)`, shadow none, the error "Заповніть заголовок албанською: він потрібен кожній сторінці." 12px/400 `rgb(217, 45, 32)`; the slug error ("Невірний формат slug" for `Жжж`): border 1px `rgb(217, 45, 32)`, 12px/400 `rgb(217, 45, 32)` — the same. No overflow of the dialog or the document, no console error.
    - Escape in full screen: the full-screen view and the page dialog both close (dialogs after Escape: 0, at all four widths), and a title typed before (`zz-v5a-unsaved`) is lost. Escape in "Додати медіафайл": dialogs 2 → 0, the same. F6.
    - `/uk/admin/footer`, 320-1440: the page opens, no overflow, no console error.
- V6: the diff adds and removes registry rows only (F1 of Review 1); each new row's selector was opened on the Storybook dev server in the first part (it opens exactly its `portals`); no `skip`, `eslint-disable`, allowlist or baseline.
- V7: Revision 1 touches no Server Action, policy, sanitizer or upload path (`git diff --name-only 646917f67`); the categories of Review 1 stand. Data: the synthetic rows were removed through the service role by the owner's decision (below), no schema or policy changed.
- V8: `MantineRichTextEditor.tsx` put back to `646917f67` → the toolbar test 3 failed (the close control's name and size, the focus after full screen, the focus after `img`); restored byte for byte (sha256 `1a67da55…` equal).
- V9: below.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 1 first: the branch now carries the rule changes and the Task 1078 kickoff, which trigger five more sheets; `Task_990.json` holds a "not applicable" verdict with its reason for each; rerun → exit 0.
- V11: one finding, F6.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: NEEDS REVISION.

## Test data removed (owner decision, 2026-11-28)

The integration run `zz_synth_mwyrxpon6e49` (2026-11-27 09:23 UTC, `moderatorKeys.integration.test.ts`) had left its rows in the one real project (D91), so "New page" was disabled for every admin, also on production. Owner (translated): "yes, delete these test records, they are not needed". Counted before (service role, `like 'zz_synth_mwyrxpon6e49%'` on each table's own text column, children also through their parent ids): `amenities` 15, `locations` 15, `pages` 15, `companies` 6, `contact_inquiries` 6, `page_translations` 6, `amenity_translations` 6, `location_translations` 6, `email_templates` 3, `site_settings` 1 = 79 (the first part had counted 67 in eight tables; the two translation tables carry the same prefix in `name`). Deleted children first, then the parents filtered by id and prefix; recount → 0. `pages` now holds `privacy-policy`, `about`, `terms-of-service`, each with `sq`, `en`, `uk`, `it` content. The cause (the sweep removes only users and listings) is Task 1080.

## Findings

F6 — Escape in the editor's full-screen view or "Add media" dialog closes the page dialog and loses its input
Severity: Medium      Category: Business logic (UI, U11)      CWE: —
Location: `src/design-system/mantine/patterns/MantineRichTextEditor.tsx:590` (full screen), `:604` (the image dialog); `src/components/admin/PageEditorDialogView.tsx:161-163`
Description: the full-screen `Modal` and the image `MantineModal` open while the page dialog's `MantineModal` stays open. Mantine 8.3.18 closes every opened modal on Escape through its own `window` keydown listener in the capture phase (`node_modules/@mantine/core/esm/components/ModalBase/use-modal.mjs:20-27`), so one Escape calls both `onClose`s. The page dialog's `onClose` closes it and drops the unsaved form. The Stories cannot show it: `PageEditorDialogView.stories.tsx:112` passes `onClose={() => {}}`, and the RichTextEditor Story has no dialog around the editor.
Impact: an admin who leaves full screen with Escape (the usual key, and the one the census checks) loses the page being written. The image dialog has the same nesting on `main` (`git show main:…MantineRichTextEditor.tsx`, `:373`); this task moved its trigger to "Add media" and added full screen, and the same cause closes both (A4).
Reproduction: local app dev server, `HYDRATION_ADMIN`, `/uk/admin/pages` → "Нова сторінка" → type a title → "На весь екран" → Escape → `document.querySelectorAll('[role="dialog"]').length === 0`, the title is gone; the same after "Додати медіафайл" → Escape (2 → 0). 320, 640, 1024, 1440.
Recommendation: Revision 2, item 1.
References: WAI-ARIA APG Dialog (Modal) pattern: Escape closes the dialog that has the focus; checklist U11 (error and partial states); A4
Status: open

## Revision 2

Items for the executor (`/execute-task`). The base is the commit of the reviewed tree that the owner makes with this review's commands (V13); V2 of Review 3 diffs against it. Both files are in the Scope. AC6 runs only on GitHub CI (A5).

1. F6:
   - `MantineRichTextEditor.tsx`: a new optional prop `onDialogChange?: (open: boolean) => void`, called from an effect with `true` when full screen or the "Add media" dialog becomes open and `false` when neither is open (one call per change). No other behaviour changes. Add it to the props docstring.
   - `PageEditorDialogView.tsx`: keeps `editorDialogOpen` from that prop; the `onClose` it hands to `MantineModal` does nothing while `editorDialogOpen` is `true` and calls `onClose` otherwise. The Cancel button keeps calling `onClose` directly.
   - Test, `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` (the real container, whose `onClose` closes the dialog), tag `[F6]`. (a) New page → type an Albanian title → open full screen → `fireEvent.keyDown(document.activeElement, { key: 'Escape' })` → the full-screen close control is gone, the page dialog is still open, the title keeps its value. (b) The same with "Add media". (c) With no editor dialog open, Escape closes the page dialog, as on `main`. Save the output of (a) and (b) failing before the fix, and the output passing after.
   - Report: the Route tests and both §8.1 searches over the two changed files, `npm run typecheck`, the hook's ESLint command over the changed code files, each with its exit code; and on the app dev server (`/uk/admin/pages`, 320 and 1440) the dialog count after Escape in full screen and in "Add media" (expected 1) and after a second Escape (expected 0).

## Stories for the owner (V9)

The reviewer's measurements are in V5a; the owner's look comes last.

- Patterns/Mantine/RichTextEditor — Default, WithContent, WithError, ImageUploading, TextMode: full screen and its round close; Escape and the close control return the focus to "Fullscreen".
- Patterns/Mantine/PageEditorDialogView — New (Albanian tab, "Published"), TitleRequired (the title's error and red border, like SlugError), EditPublished, SlugError, PublishBodyRequired, RichContent at 320 and 1440.
- Firefox: not measured in this review; the full-screen close, its focus ring and the "Add media" dialog are left to the owner's look.

## Open for Opus and the owner

- Opus, Review 3: V5a on `/admin/pages` again (the Escape cases of F6 at 320-1440).
- Opus, after the merge: the Route's step 5 (`HYDRATION_ADMIN` in Ukrainian saves `opus-990-check`, opens it on the site, deletes it).
- Task 1080 (Sprint 93): the sweep covers every table an integration suite writes.
