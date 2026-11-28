# Task 990 — Review 1

Kickoff: [Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md](../../tasks/Sprints/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md) · OWASP record: [Task_990.json](../security/owasp/reviews/Task_990.json)

Review 1 of the working tree on c968d63c9 (branch `task/990-a-new-page-reaches-the-site`, uncommitted) — NEEDS REVISION
Scope: diff-based; 17 code files (2 new), 4 message files, `package.json`, `package-lock.json`; entry points: the changed Server Actions `updatePage`, `deletePage` (staff, `legal.manage`), `saveFooterShared`, `upsertFooterContent` (admin); the public page render through `sanitizeCmsHtml`; the executor's report `docs/sessions/2026-11-27-task990-executor-report.md`
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46027702079 green; ESLint → exit 0; typecheck → exit 1 (80 errors, all in the stale `.next/types/validator.ts`, 0 in `src`); `vitest related` → exit 1, 1 failed of 8199 (`[SEC-T1-SRV-BUILT-PROXY]`, stale local build); Route 54 files 1063 passed; integration 8 files 52 passed; `db-catalog-audit.mjs` → exit 0
Findings: Critical 0, High 0, Medium 1, Low 4
Overall risk: the code removes the Cause and its two security controls hold under deliberate breaks; CI would be red on the overlay census, whose registry rows the kickoff did not name, and two visible states are wrong or missing in the Stories and the full-screen dialog.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → CI 46027702079 success (Task 989, #85), Scorecard 46027702223 success, Repository settings 46011668919 success.
- V2: `git diff --stat c968d63c9` (21 files) plus the untracked `textColors.ts`, `MantineRichTextEditor.toolbar.test.tsx` and the report. Every product file is a Scope file or a test the Route names; `PageEditorDialogView.tsx` carries the labels the extended editor needs. Outside the kickoff's Scope text: the en/uk/it title label "(optional)" in place of the "required mark" — the owner's decision of 2026-11-27 recorded in the report ("By the 2026-06-26 policy"). No hunk the Cause does not need. Files the change needs and the Scope did not name: `scripts/rendered-interaction-states.json` (F1) and `src/stories/patterns/mantine/PageEditorDialogView.stories.tsx` (F2) — the kickoff's gap, not the executor's.
- V3: claims rerun.
  - Route, default collection: `npm test -- <the 53 Route files + MantineRichTextEditor.toolbar.test.tsx>` → "Test Files 54 passed (54)", "Tests 1063 passed (1063)", exit 0. Reproduced.
  - Integration: `npm run test:security-integration`-equivalent (`npx vitest run --config vitest.integration.config.ts <8 Route files>`, `SECURITY_TEST_TARGET=development`, `.env.local` loaded by a launcher that prints no value) → "Test Files 8 passed (8)", "Tests 52 passed (52)", exit 0. Reproduced.
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 17 changed and new code files → no output, exit 0. Reproduced.
  - `npm run typecheck` → exit 1 (the report says 2): 80 errors, every one in `.next/types/validator.ts` (build output of 2026-11-21, route paths that no longer exist); 0 in `src`. Not a finding of this diff.
  - §8.1 import graph, default collection: `npx vitest related --run --reporter=verbose <21 changed files + 2 new>` → exit 1, "Test Files 1 failed | 474 passed (475)", "Tests 1 failed | 8198 passed (8199)"; the one failure is `proxyFile.test.ts` `[SEC-T1-SRV-BUILT-PROXY]` (the stale local manifest; `src/proxy.ts` unchanged; the I8/V3 exception). Reproduced.
  - §8.1 import graph, integration collection (the report did not run it; §8.1 names it): with the source files only, `vitest related --config vitest.integration.config.ts` reaches exactly the Route's 8 files (all passed above). With `package.json` and `package-lock.json` in the list Vitest takes every integration file (36): exit 1, "Tests 4 failed | 192 passed (196)": `serverActionManifest.integration.test.ts` (`.next is older than … applyListingTransition.ts: run npm run build again`), `contactLifecycle.integration.test.ts` and `contactSession.integration.test.ts` (`bot_check_failed` from `checkContactHuman`). None of the three is reached by a changed source file; CI builds first and runs the whole integration collection (`.github/workflows/ci.yml:162-174`). UNKNOWN locally why the bot check refuses; CI decides (V14).
  - §8.1 text search over every changed path, the folder `modules/admin/actions`, the message files, `package.json`, `package-lock` and every added export (`TEXT_COLORS`, `TEXT_COLOR_NAMES`, `TextColorName`, `RichTextEditorLabels`, `RICH_TEXT_EXTENSIONS`, `footerLocalesLinking`, `badShapeLinks`, `sqTitleError`, `usePageLocaleNames`, `useCmsEditorLabels`) → 104 files; not in the graph's set: six `scripts/quality/*.test.mjs` and four `*.integration.test.ts` (all four among the Route's 8). `node --test` on the six → "# tests 83", "# pass 83", exit 0. Reproduced.
  - Deliberate breaks of the report (I9), each through a copy restored byte for byte (sha256 equal): BRK1, the footer read moved before `assertPermission` in `deletePage` → `pages-and-footer-validation.smoke.test.ts` 2 failed (both `[SEC-990-PAGE-FOOTER-DENY]`); BRK2, the palette match replaced by `/.*/` → `sanitizeCmsHtml.security.test.ts` 6 failed. Reproduced. The third break (the `page_in_footer` returns removed) is covered by V8 AC3.
  - Report claim "regenerating the census rows is impossible without the census" does not hold: `.claude/rules/shared/rendered-state-census.md` ("What a task does") has Sonnet write the rows `{ id, story, open, portals }` by hand in the same change; only the gate runs in CI (F1).
- V4: every changed file read once, tests included (the four message files through their complete diff: 29 changed lines each). The Cause's six points are removed: the dialog opens on `sq` for a new page (`AdminPagesManager.tsx:46`); Save is disabled only while saving or with a slug error (`PageEditorDialogView.tsx:157`) and answers a missing Albanian title on the field (`AdminPagesManager.tsx:101-106`, `PageEditorDialogView.tsx:214`); `toSlug` keeps Albanian letters (`adminPagesContent.ts:12`); a new page starts published (`AdminPagesManager.tsx:59`); `deletePage`/`updatePage` refuse a page an enabled footer link names (`index.ts:345-363`, `:377-386`, `:414-416`) and the footer errors name their links (`footer.ts:38-40`, `:68-88`, `AdminFooterManager.tsx:382-415`); the O990-1 toolbar, Text mode and colour (`MantineRichTextEditor.tsx`); the sanitizer keeps `del`, `ins`, a palette-coloured `span` and aligned `h5`/`h6` (`sanitizeCmsHtml.ts:30-32`, `:82-113`); `btn_new` without "+ ".
- V5: against `git show c968d63c9:<path>` (= `main` for these files): every change of behaviour is one the Scope orders (O990-1 replaces D868-6/D868-7; owner list item 20) or the owner's decision of 2026-11-27 (the "(optional)" titles). Kept as on `main`: the four language tabs, the slug field and its errors, `sq_body_required`, the image upload path, `createPage`, the slug uniqueness check, `pickFields`, every footer check and bound, every tag and attribute the sanitizer kept (the per-tag `allowedStyles` equals the old `'*'` rule on the tags that may carry `style`). The editor's toolbar control is the same `RichTextEditor.Control` with the same `touch` sizes as `main`'s five menu triggers. The full-screen dialog's close control is new and below the canonical close (F3).
- V5a:
  - Pages: `BLOCKED: the app dev server is not running` (`curl http://localhost:3000/` → no connection; the owner stopped it for the dependency install, the report asks the owner to restart it), and a dev server started by the reviewer rewrites the tracked `AGENTS.md` (`project-facts.md`). `/admin/pages` and `/admin/footer` are measured in the next review on the owner's server and Chrome session.
  - Stories, Storybook dev server started by the reviewer (`npm run storybook -- --no-open`, port 6006), Chromium (Playwright): RichTextEditor Default, WithContent, WithError, ImageUploading, TextMode; PageEditorDialogView New, EditPublished, SlugError, PublishBodyRequired, RichContent × en, uk × 320, 640, 1024, 1440 = 80 renders; no page error, no document overflow in any. Visual toolbar: 21 buttons, 0 outside the viewport, no toolbar overflow; rows 6 at 320, 2 from 640; every control 44×44 below 640px, 26×26 from 640px; control: radius 8px, colour `rgb(52, 64, 84)`, background `rgb(255, 255, 255)`, border none, shadow none, font 16px/400 — the values of `main`'s toolbar control (same component and props). Text toolbar: 12 buttons, rows 3/2/1/1, 44px / 26px, padding 0 8px. "Add media": 44px, radius 8px, border 1px `rgb(228, 231, 236)`, 14px/500, shadow `rgba(16, 24, 40, 0.05) 0 1px 2px` — the theme's `Button` `default` variant. Visual/Text tabs: 44px, radius 6px, 14px/500, selected `rgb(16, 24, 40)` on white with the theme's tab shadow, unselected `rgb(102, 112, 133)` transparent — the theme `Tabs.Tab`. Text field: `ui-monospace` (the theme's monospace). PageEditorDialogView: the Albanian tab is selected in every state and locale ("Albanian*", "Албанська*"); the `New` Story's switch is off ("Draft") although production starts a new page published (F2).
  - Overlays (WithContent, en and uk): the link popover, the table menu, the "Paragraph" select ("Text format") and the colour palette each open one portal with focus inside and close on Escape with the focus back on the trigger; items 44px below 640px (bottom sheet), 41px from 640px (anchored, as `main`'s menus), none outside the viewport or clipped; 7 items each (table: 7, Paragraph: paragraph, h2-h6, preformatted; colour: default + 6). Full screen: the dialog is 320×800 / 640×800 / 1440×800, the text keeps its length before, inside and after (458 en, 524 uk); its close control is 28px high and named "Fullscreen"/"На весь екран" (F3).
  - Firefox 161 (WebDriver BiDi, `puppeteer-core`): WithContent at 320, 640, 1440 — 21 buttons, rows 6/2/2, heights 44/26/26, 0 outside, radius 8px, colour `rgb(52, 64, 84)`; keyboard focus on "Bold": outline solid 2px `rgb(236, 84, 71)`, offset 2px; table menu 7 items, 44px at 320, 41px from 640. Same as Chromium.
- V6: the diff adds or removes no `eslint-disable`, `.skip`, `.only`, `.todo`, `@ts-*`, allowlist, baseline or registry row (grep over the whole diff and the new files). The registry rows F1 needs are missing, not exempted.
- V7: below.
- V8: each product change put back to `c968d63c9` (`git show`, test, copy back, sha256 equal after each): AC1 (`AdminPagesManager.tsx`, `PageEditorDialogView.tsx`, `adminPagesContent.ts`) → 8 failed (4 `toSlug`, 4 AC1 dialog cases); AC2 (`"btn_new": "+ New page"` in `en.json`) → 1 failed; AC3 (`index.ts`, `footer.ts`, `AdminFooterManager.tsx`) → 12 failed; AC4 (`MantineRichTextEditor.tsx`) → toolbar test 12 failed; AC5 (`sanitizeCmsHtml.ts`) → 12 failed. AC2's `check-i18n-parity.mjs`, AC6 and AC7: CI only (A5). The case "editing a draft keeps it a draft" passes on both trees, as it must: it pins what `main` already does.
- V9: below, "Stories for the owner".
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 31 sheets triggered; 5 of them are not in the kickoff's "## OWASP" (`HTTP_Strict_Transport_Security`, `Identity_Propagation_Patterns`, `Logging`, `Logging_Vocabulary`, `Transport_Layer_Security`: the lockfile and the documents of the branch's first commit trigger them). The record holds a verdict for each and for the kickoff's four others.
- V11: five findings, below.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: NEEDS REVISION.

Contradiction reported to the owner (A16): the kickoff's AC6 names `node scripts/check-mobile-adaptation-contract.mjs` as a test, while A5 forbids running any gate of `product-gates.mjs` locally and that script is one (`scripts/quality/product-gates.mjs:50`). The executor ran it (exit 0); this review did not, and does not use its result. The next kickoff states AC6 as "CI".

## V7 — secure code review

Six steps: (1) controls kept: `legal.manage` first in `updatePage`/`deletePage` (`index.ts:369`, `:411`); the footer actions keep their order (`assertAdminUser` before the service-role read, `footer.ts:152`, `:223`); the sanitizer keeps every tag, attribute and scheme of `main`. (2) New vectors: the "Text" mode (staff HTML, parsed by the editor schema in the admin's browser, rendered to visitors only through `sanitizeCmsHtml`); the `span` colour style; two new service-role reads. (3) Trust boundary: staff HTML → every visitor; the sanitizer is the boundary, and a colour must equal one of 12 theme-derived strings. (4) New package `@tiptap/extension-text-style` 3.32.2: `npm view` in the kickoff (2026-11-19, repeated 2026-11-27); lockfile +14 lines, one entry from `registry.npmjs.org` with `integrity`, peer `@tiptap/core` 3.32.2 (installed). (5) Tests: the changed assertions follow the Scope (opening tab, `toSlug`, the removed menus) and none is loosened; `invalid_internal_link` cases became stricter (`links`). (6) Categories:

- Authorization: touched. Permission first in both page actions; `[SEC-990-PAGE-FOOTER-DENY]` proves no read of `site_footer` or `pages` for a refused caller and the call order for an allowed one; service role only after it. `pages` has no write grant for `authenticated` (`db-catalog-audit.mjs` → "no finding", exit 0). Corrected 2026-11-28: `site_footer` has one, `INSERT`, `UPDATE`, `DELETE` for `authenticated` under the policy `site_footer_admin_write` (live catalog, `db-catalog-audit.mjs --save <scratch file>` → exit 0), so an administrator's session can write the footer past the application guard; it is not changed by this diff and is filed as Task 1079 (checklist A4). Check-then-act: the footer read and the delete/update are two statements; a footer save that adds a link between them, or a page change between `checkCmsSlugs` and the footer write, leaves a link to a missing page (F5).
- Input and output: touched. `data.slug` still passes `validateSlug` first; `footerLocalesLinking` reads `l.enabled === true` and `typeof l.url === 'string'` before use (`index.ts:359`); toasts use ICU values (text). Sanitizer: `span` → `style` with only `color` equal to a palette value (anchored, escaped, `sanitizeCmsHtml.ts:32`); `del`/`ins` without attributes; tested with `url()`, `expression()`, background, a second property, `rgba`, spacing and case variants, attributes and other elements.
- Authentication and sessions; Requests and redirects; Files (server side): not touched (`git diff --name-only` has no file of `src/app/auth`, `src/lib/auth`, route handlers or upload actions; "Add media" calls the unchanged `onUploadImage`).
- Next.js entry points: touched, no new one. The four actions keep their audience (staff `legal.manage`; admin); each is called directly in the tests.
- Business logic: touched. Invariant "an enabled footer link names a published page" is enforced on both sides (footer save, page delete/unpublish/rename), each tested; not atomic (F5).
- JavaScript and TypeScript: touched. The one runtime `RegExp` is built from theme constants, escaped; `insAsUnderline` uses an inert `DOMParser` document; no `any` across a trust boundary (the footer JSON is narrowed with `Array.isArray` and property checks).
- Data exposure, errors, logging: touched. Errors to the client are codes and language codes; the three new `console.error` lines log the error object and the page id on the server.
- Dependencies and configuration: touched (above). No header, CSP or workflow change.
- Agent and tool output: `check-files.mjs` runs at commit; no rule, hook or settings file in the diff.
- Tests: every AC test fails without its change (V8); both security tags fail under the breaks (V3).
- Data: `db-catalog-audit.mjs` → exit 0 (52 tables, 196 policies). Uploads: not touched on the server; `cloudinary-config.mjs` not needed.

## Findings

F1 — The overlay census registry still holds the removed menus and lacks the new overlays
Severity: Medium      Category: Tests (UI, checklist U8)      CWE: —
Location: `scripts/rendered-interaction-states.json` (the 28 rows `patterns-mantine-richtexteditor--*`); `src/design-system/mantine/patterns/MantineRichTextEditor.tsx:503`, `:514`, `:519`, `:572`; `src/stories/patterns/mantine/RichTextEditor.stories.tsx` (`TextMode`)
Description: 27 rows (`default`, `with-content`, `with-error` × `add-link`, `history`, `history-wide`, `insert`, `insert-wide`, `paragraph`, `paragraph-wide`, `text-format`, `text-format-wide`) open the five menu triggers this task removed, by structural selectors that now point at other controls; `image-uploading` opened the image dialog through the Insert menu. The table menu, the "Paragraph" select, the colour palette, the full-screen dialog, "Add media", the `img` quicktag and the new `TextMode` Story have no row. The CI census opens every registered row and, with `--discover`, fails on a trigger that opens a portal without a row (`scripts/rendered-state-census/discover.mjs:1-12`).
Impact: the Storybook census job of the pull request fails; the new overlays are not measured by the gate at 320-1440 in four languages.
Reproduction: `node -e` over the registry → 28 rows for the Story; none names the table, Paragraph, colour or full-screen trigger; `MantineRichTextEditor.tsx` has no Insert/History/Format menu.
Recommendation: rewrite the rows of the five RichTextEditor Stories and of the PageEditorDialogView Stories whose editor triggers the census discovers: one row per trigger that opens a portal (link popover, table menu, Paragraph select, colour palette: each below 640px and from 640px as `widths`; full screen; "Add media"; `img` in `TextMode`), shape and selectors as the existing rows (`{ id, story, open, portals, focus, dismiss, trigger, widths }`); each selector checked on the Storybook dev server at 390 and 1440 (it opens exactly the stated number of portals). The kickoff named no rows (the design's gap, `rendered-state-census.md` "Opus (design)").
References: `.claude/rules/shared/rendered-state-census.md`; checklist U8
Status: open

F2 — The dialog Stories do not show the new production states
Severity: Low      Category: Tests (UI, checklist U6; A4)      CWE: —
Location: `src/stories/patterns/mantine/PageEditorDialogView.stories.tsx:59`, `:111`; `src/components/admin/PageEditorDialogView.tsx:30`, `:214`
Description: `New` renders the switch off ("Draft", `initialPublished = false`), while a new page now starts published (`AdminPagesManager.tsx:59`); no Story renders `sqTitleError` (Save pressed without the Albanian title), a state the task adds.
Impact: the owner's look and the Storybook gates check a state production no longer shows and miss one it now shows.
Reproduction: V5a — `pageeditordialogview--new` → `switch.checked === false` in every locale and width.
Recommendation: `New` starts published; a Story `TitleRequired` (new page, `sq` tab, `sqTitleError`) with its census row (`mount`, as the other dialog rows).
References: checklist U6 ("every production state"); A4
Status: open

F3 — The full-screen dialog's close control is 28px and named "Fullscreen"
Severity: Low      Category: UI (U4, U12)      CWE: —
Location: `src/design-system/mantine/patterns/MantineRichTextEditor.tsx:572`
Description: the Mantine `Modal` default close button renders 28×28 at every width, below the 44px touch target under 640px, and its accessible name is the toolbar tool's name ("Fullscreen", "На весь екран"), not a close action. The canonical dialog close is the 44px round `ActionIcon` (`variant="light" color="gray" radius="pill" size="xl"`, named by the common "close", `MantineModal.tsx:109`).
Impact: a touch user at 320px gets a 28px target; a screen-reader user hears "Fullscreen" on the control that leaves full screen.
Reproduction: V5a — full screen at 320, 640, 1440 in en and uk → close control height 28, name "Fullscreen"/"На весь екран".
Recommendation: the close control takes the canonical close look (size `xl`, 44px, radius pill, light gray) and a close name (a new label `fullscreenClose` — "Exit full screen" — in the four message files, or the common close label passed in); the toolbar test asserts the name and the size props.
References: `MantineModal.tsx:109`; WCAG 2.5.8, 4.1.2; checklist U4, U12
Status: open

F4 — Six message keys no code reads any more
Severity: Low      Category: Input and output (i18n hygiene, A1)      CWE: —
Location: `messages/{sq,en,uk,it}.json` `admin.pages.editor.menu_insert`, `menu_history`, `clear_formatting`, `columns_2`, `columns_3`, `columns_remove`
Description: the change removed every reader of these keys (`grep -rn` over `src`, `scripts`, `.storybook` → none); they stay in the four files.
Impact: dead translations that the next change has to reason about; no gate removes them.
Reproduction: `grep -rln "menu_insert\|menu_history\|clear_formatting\|columns_remove" src scripts .storybook` → no file.
Recommendation: remove the six keys from the four message files (Edit only, A12).
References: A1; checklist I7
Status: open

F5 — The footer guard is check-then-act across two statements
Severity: Low      Category: Business logic      CWE: CWE-367
Location: `src/modules/admin/actions/index.ts:377-386`, `:414-417`; `src/modules/admin/actions/footer.ts:170-175`, `:228-233`
Description: `deletePage`/`updatePage` read the footers and then delete or update the page; `saveFooterShared`/`upsertFooterContent` read the published pages and then write the footer. Two staff members acting at the same moment can each pass their check and leave an enabled footer link to a deleted, unpublished or renamed page.
Impact: a footer link that answers 404 until an admin edits it; needs two concurrent staff actions; no data exposure.
Reproduction: interleave `deletePage(<id of /about>)` after `upsertFooterContent` passed `checkCmsSlugs` and before its upsert (no test can show it without a database transaction).
Recommendation: not in this task's Scope (it needs one database function that checks and writes in one transaction, or a constraint); proposed as a new numbered task for the owner to file or accept (A4: only the owner accepts a risk).
References: `secure-code-review.md` §3 Business logic ("check-then-act is atomic"); OWASP Business_Logic_Security
Status: filed as Task 1078 (owner decision O1078-1, 2026-11-28)

## Revision 1

Items for the executor (`/execute-task`), one per finding F1-F4; F5 is Task 1078 (owner, 2026-11-28). F1 and F2 reach files the Scope did not name (`scripts/rendered-interaction-states.json`, `src/stories/patterns/mantine/PageEditorDialogView.stories.tsx`): owner's permission 2026-11-28 (translated): "Yes". AC6 runs only on GitHub CI (checklist A5): the executor does not run `check-mobile-adaptation-contract.mjs`, `locale-safety.mjs` or the census locally.

1. F1: in `scripts/rendered-interaction-states.json` replace the 28 `patterns-mantine-richtexteditor--*` rows: for each of `default`, `with-content`, `with-error` one row per trigger that opens a portal — the link popover (`add-link`), the table menu (`table`, `table-wide`), the "Paragraph" select (`paragraph`, `paragraph-wide`), the colour palette (`text-color`, `text-color-wide`), with `widths` `{ "max": 639 }` / `{ "min": 640 }` as today, and full screen (`fullscreen`); `image-uploading` (the dialog opened by "Add media" in `play`); `text-mode` (mount) and `text-mode~img`; plus the rows the census discovers for the same triggers inside the PageEditorDialogView Stories. Shape and selector style as the existing rows; each selector checked on the Storybook dev server at 390 and 1440 (`document.querySelector` from `#storybook-root` opens exactly `portals` portal roots), the result in the report. Nobody runs the census locally (A5).
2. F2: `PageEditorDialogView.stories.tsx` — `New` starts published; a new Story `TitleRequired` (new page, `sq` tab, `sqTitleError`), with its `mount` row in the registry like the other dialog rows.
3. F3: `MantineRichTextEditor.tsx:572` — the full-screen dialog's close control takes the canonical close look (`size="xl"`, 44px, radius pill, `variant="light"`, `color="gray"`, as `MantineModal.tsx:109`) and a close name: a new label `fullscreenClose` ("Exit full screen" and its sq, uk, it translations) in `RichTextEditorLabels`, `useCmsEditorLabels` and the four message files; the toolbar test asserts the name and the 44px size below 640px.
4. F4: remove `admin.pages.editor.menu_insert`, `menu_history`, `clear_formatting`, `columns_2`, `columns_3`, `columns_remove` from the four message files.

## Stories for the owner (V9)

The reviewer's measurements are in V5a; the owner's look comes last.

- Patterns/Mantine/RichTextEditor — Default, WithContent, WithError, ImageUploading (the image dialog opened by "Add media"), TextMode (Text tab with quicktags): 320, 640, 1024, 1440; the four menus (table, Paragraph, colour, link) and full screen at 320 (bottom sheets) and 1440 (anchored).
- Patterns/Mantine/PageEditorDialogView — New (now opens on the Albanian tab; the switch shows "Draft" until F2), EditPublished, EmptyLocaleWarning, SlugError, PublishBodyRequired, Saving, RichContent: the editor inside the dialog at 320 and 1440.
- Firefox: the toolbar and a menu were measured in Firefox 161 (V5a); the owner's look covers the rest.

## Open for Opus and the owner

- The owner, 2026-11-28 (translated): Revision 1 items 1 and 2 may reach the two files outside the Scope ("Yes"); F5 is a separate task ("Create a separate task"): Task 1078, Sprint 93 (owner decision O1078-1); the session write grant on `site_footer` found in its design: Task 1079.
- Opus, after the revision: V5a on the app pages `/admin/pages` and `/admin/footer` on the owner's dev server and Chrome session (blocked in this review).
- Opus, after the merge: the Route's step 5 (`HYDRATION_ADMIN` in Ukrainian saves `opus-990-check`, opens it on the site, deletes it).
