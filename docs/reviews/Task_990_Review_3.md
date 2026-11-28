# Task 990 — Review 3

Kickoff: [Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md](../../tasks/Sprints/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md) · OWASP record: [Task_990.json](../security/owasp/reviews/Task_990.json)

Review 3 of 7c5903e2e (branch `task/990-a-new-page-reaches-the-site`, PR #86) — NEEDS REVISION
Scope: diff-based, `git diff 2c91e20a9` (Revision 2, F6): `PageEditorDialogView.tsx`, `MantineRichTextEditor.tsx`, `AdminPagesManager.smoke.test.tsx`; the page `/admin/pages`; the Stories of the two changed components; the executor's Revision 2 report
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46147156669 green; Route 54 files 1069 passed; integration 8 files 52 passed; `vitest related` 5 files 74 passed; ESLint → exit 0; typecheck → 80 errors, all in the stale `.next`, 0 in `src`; `owasp.mjs review` → exit 0; V5a in Chromium and Firefox on the Storybook and app dev servers
Findings: Critical 0, High 0, Medium 0, Low 3
Overall risk: F6 is removed and holds in Chromium and Firefox at every width; the same Escape loss inside the editor's menus comes from shared overlay components this diff does not change and is Task 1081. V13 set APPROVED; V14 then found three CI checks red on code of the first implementation (F7-F9), so the verdict is NEEDS REVISION (V14: fixed in the same pull request).

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
- V12: this file, linked from the kickoff; `check-files.mjs` on the kickoff, this file and `docs/backlog.md`; rerun after V14.
- V13: APPROVED, handed over with the commit, push and pull request commands; the owner committed `7c5903e2e`, pushed it and opened PR #86.
- V14: `gh pr checks 86` after every check concluded (run 46164462550): 19 passed; failed: "Lint, types and product checks" (job 141038811730), "CodeQL" (check run 141039595359, "1 new alert including 1 high severity security vulnerability") and "CI Required". `gh run view 46164462550 --job 141038811730 --log-failed` → `npm run check:design-tokens:strict` (F7) and `node scripts/check-badge-canonical.mjs` (F8); the CodeQL annotations (`gh api repos/:owner/:repo/check-runs/141039595359/annotations`) → F9. The three files are the first implementation's, unchanged since Review 1; these gates run only on GitHub (A5), so no review ran them. Verdict changed to NEEDS REVISION.

## Findings

F7 — A raw colour function in the text palette fails the design-token gate
Severity: Low      Category: UI (U3, `check:design-tokens:strict`)      CWE: —
Location: `src/design-system/mantine/richtext/textColors.ts:23`
Description: `colorOf` writes the browser's `rgb(r, g, b)` spelling of each theme colour (the spelling Tiptap's `Color` reads back from `element.style.color`, which the sanitizer must also accept). The template literal holds `rgb(`, which the strict design-token scan reports as a raw colour value.
Impact: the CI job "Lint, types and product checks" fails; the pull request cannot merge.
Reproduction: run 46164462550, job 141038811730: `src/design-system/mantine/richtext/textColors.ts (1) :23 [color:color function] "rgb("`, "check:design-tokens STRICT — 1 raw style-value violation(s)".
Recommendation: Revision 3, item 1.
References: `docs/design-system.md` §22-23 (the same-line `design-tokens-allow` marker; precedent `src/design-system/mantine/patterns/MantineTooltip.tsx:26`); checklist U3
Status: open

F8 — The sanitizer's colour rule is named like a badge colour map
Severity: Low      Category: UI (`check-badge-canonical.mjs`)      CWE: —
Location: `src/modules/cms/lib/sanitizeCmsHtml.ts:32`
Description: `PALETTE_COLOR` is the `allowedStyles` rule of `span` (`{ color: RegExp[] }`), the same kind as `TEXT_ALIGN` above it; the gate refuses any object variable named `*_COLOR` or `*_TONE` outside `badgeTones.ts` (`scripts/check-badge-canonical.mjs:9`, `:67`).
Impact: the CI job "Lint, types and product checks" fails.
Reproduction: run 46164462550: "FAIL src/modules/cms/lib/sanitizeCmsHtml.ts:32 [colour-map] declares `PALETTE_COLOR`".
Recommendation: Revision 3, item 2.
References: `scripts/check-badge-canonical.mjs`
Status: open

F9 — The "Text" mode parses the typed HTML with `DOMParser` (CodeQL js/xss-through-dom, high)
Severity: Low      Category: JavaScript and TypeScript      CWE: CWE-79
Location: `src/design-system/mantine/patterns/MantineRichTextEditor.tsx:176-185` (`insAsUnderline`), `:306`
Description: the textarea's value flows into `new DOMParser().parseFromString(html, 'text/html')` and back out as `doc.body.innerHTML` into `editor.commands.setContent`. The parsed document is inert and only an admin's own text reaches it (visitors get a page only through `sanitizeCmsHtml`), so the practical risk is low; CodeQL reports "DOM text reinterpreted as HTML" at high severity, and a high alert blocks the merge (`quality-gates.md` §5). The function exists only to read `ins` as underline, which the editor schema can do itself.
Impact: the CodeQL check and `CI Required` fail; the pull request cannot merge.
Reproduction: check run 141039595359, annotation `src/design-system/mantine/patterns/MantineRichTextEditor.tsx:178` "DOM text reinterpreted as HTML".
Recommendation: Revision 3, item 3.
References: OWASP `DOM_based_XSS_Prevention`; `quality-gates.md` §5 "CodeQL"
Status: open

## Revision 3

Items for the executor (`/execute-task`). The base is the commit of this review's documentation that the owner makes (V13); Review 4 diffs against it and reads `gh pr checks 86` again. `textColors.ts`, `sanitizeCmsHtml.ts` and `MantineRichTextEditor.tsx` are in the Scope; `package.json` and `package-lock.json` for item 3, as for `@tiptap/extension-text-style` in the Scope. Nobody runs the gates locally (A5): CI on the pushed branch is the check.

1. F7: `textColors.ts:23` — keep the computed `rgb(r, g, b)` spelling and add the same-line marker of `docs/design-system.md` §23 in the form of `MantineTooltip.tsx:26`: `// design-tokens-allow: rgb( — the browser's serialization of a theme colour, computed from the theme hex; the sanitizer and the editor compare it, it is not a style value`. No other change in the file.
2. F8: `sanitizeCmsHtml.ts` — rename `PALETTE_COLOR` to `PALETTE_COLOR_STYLE` (its declaration and its one use); behaviour unchanged.
3. F9: `MantineRichTextEditor.tsx` — remove `insAsUnderline` and its `DOMParser`; `changeText` passes the typed HTML to `setContent` as it is. In `RICH_TEXT_EXTENSIONS`: `StarterKit.configure({ link: false, underline: false })` and `Underline.extend({ parseHTML() { return [...(this.parent?.() ?? []), { tag: 'ins' }] } })` from `@tiptap/extension-underline`, added to `package.json` `dependencies` as `"@tiptap/extension-underline": "3.32.2"`. It is already installed as a dependency of `@tiptap/starter-kit` 3.32.2; `npm view @tiptap/extension-underline@3.32.2`, read 2026-11-28: repository `ueberdosis/tiptap`, scripts `build` only, peer `@tiptap/core` 3.32.2, integrity equal to `package-lock.json:7353`, first release 2020-11-16, latest 3.35.1 (the pin follows the installed Tiptap). Update `package-lock.json` with `npm install --package-lock-only`; no other package may change (the lockfile diff is the root `dependencies` entry only). Update the docstring above the removed function. The toolbar test's case "back in Visual, del is strike and ins is underline" (`MantineRichTextEditor.toolbar.test.tsx:289`) passes unchanged; `richTextRoundTrip.test.ts` and `sanitizeCmsHtml.security.test.ts` unchanged and passing.
4. Report: the Route tests, both §8.1 searches over every changed file, `npm run typecheck`, the hook's ESLint command over the changed code files, each with its exit code; `git diff package-lock.json` in full; a grep showing `DOMParser` and `insAsUnderline` gone from `src/design-system`.

## Stories for the owner (V9)

The reviewer's measurements are in V5a; the owner's look comes last.

- Patterns/Mantine/RichTextEditor — Default, WithContent, WithError, ImageUploading, TextMode: full screen and its round close; Escape and the close control return the focus to "Fullscreen".
- Patterns/Mantine/PageEditorDialogView — New (Albanian tab, "Published"), TitleRequired, EditPublished, SlugError, PublishBodyRequired, RichContent at 320 and 1440. The Escape fix of F6 shows only on `/admin/pages` (the Stories' `onClose` does nothing).

## Open for Opus and the owner

- Task 1081 (Sprint 93, P2): Escape in a menu inside a dialog closes the dialog.
- Task 1080 (Sprint 93, P1): the sweep covers every table an integration suite writes.
- Opus, after the merge: the Route's step 5 (`HYDRATION_ADMIN` in Ukrainian saves `opus-990-check`, opens it on the site, deletes it), then H7.
