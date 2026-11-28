# Task 990 — executor report (first implementation)

Executor: Sonnet (`sclaude`), skill `execute-task`, checklist I under checklist A, U for the visible UI. Kickoff:
`tasks/Sprints/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md` (refreshed 2026-11-27 on `9b74f63a0`).
Branch `task/990-a-new-page-reaches-the-site`, base commit `c968d63c9`. No Git command that writes was run.

## Owner decisions taken in this session (2026-11-27, translated)

- **Dependency install**: `project-facts.md` says no install runs while the owner's Storybook runs; the owner chose "I will stop
  the servers", stopped Storybook and `next dev`, then the install ran.
- **Required mark**: the kickoff asks for "the required mark" on the Albanian tab and title, while the theme
  (`theme.ts`, `InputWrapper`, owner decision 2026-06-26, Task 503) hides every asterisk ("all fields required by default → no
  `*`; optional fields use a localized '(optional)' suffix"). The owner chose "By the 2026-06-26 policy": the Albanian title
  has no mark, the en/uk/it titles read "Title (optional)" (`admin.pages.field_title_optional_label`), the tab has no mark.

## I1–I3

- I1: `git log --oneline -1` → `c968d63c9 Task 989 archived (Task 930 closed); Tasks 1075-1077 filed; Task 990 kickoff refreshed`; `git status --short` → empty.
- I2: the kickoff read whole; Scope files and the Route's 48 + 5 + 8 test files and the new toolbar test noted.
- I3: `git diff main --stat` touched only `docs/` and `tasks/`; every Scope file equals `main`.
- A0: `node scripts/quality/owasp.mjs sync` → `142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0` (exit 0);
  `owasp.mjs plan <kickoff>` (exit 0) — the sheets the kickoff's "## OWASP" lists; `quality-gates.md` §1, §2, §4, §5, §8, §8.1 read.

## git diff --stat c968d63c9

```
 messages/en.json                                   |  29 +-
 messages/it.json                                   |  29 +-
 messages/sq.json                                   |  29 +-
 messages/uk.json                                   |  29 +-
 package-lock.json                                  |  14 +
 package.json                                       |   1 +
 src/components/admin/AdminFooterManager.tsx        |  24 +-
 src/components/admin/AdminPagesManager.tsx         |  35 +-
 src/components/admin/PageEditorDialogView.tsx      |  47 +-
 .../__tests__/AdminFooterManager.shared.test.tsx   |  27 ++
 .../__tests__/AdminPagesManager.smoke.test.tsx     | 126 +++++-
 .../admin/__tests__/adminPagesContent.test.ts      |   8 +-
 src/components/admin/adminPagesContent.ts          |   5 +-
 .../mantine/patterns/MantineRichTextEditor.tsx     | 489 +++++++++++++++------
 .../__tests__/MantineRichTextEditor.smoke.test.tsx | 123 +++---
 .../pages-and-footer-validation.smoke.test.ts      | 166 ++++++-
 src/modules/admin/actions/footer.ts                |  40 +-
 src/modules/admin/actions/index.ts                 |  46 +-
 .../lib/__tests__/sanitizeCmsHtml.security.test.ts |  55 +++
 src/modules/cms/lib/sanitizeCmsHtml.ts             |  27 +-
 .../patterns/mantine/RichTextEditor.stories.tsx    |  22 +-
 21 files changed, 1095 insertions(+), 276 deletions(-)
```

New (untracked): `src/design-system/mantine/richtext/textColors.ts`,
`src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.toolbar.test.tsx`.

## Changes by Scope item

1. **Dialog** (`AdminPagesManager.tsx`, `PageEditorDialogView.tsx`): a new page opens on `sq` (an edited page keeps the
   admin language, as `main`); Save is disabled only while saving or with a slug error; Save without the Albanian title switches
   to `sq`, shows `admin.pages.sq_title_required` on that field (cleared when the title is typed) and calls no action; a new page
   starts "Published" (`page?.is_published ?? true`), an edited page keeps its stored state; the en/uk/it titles read
   `field_title_optional_label` (owner decision above). `page_in_footer` from `updatePage`/`deletePage` toasts
   `admin.pages.page_in_footer` with the language names (`usePageLocaleNames`). `sqTitleError` is an optional View prop.
2. **`toSlug`**: `normalize('NFD')` and the combining marks removed before the existing chain; `toSlug('Çmimet e shtëpive')` →
   `cmimet-e-shtepive`, `toSlug('Тестова')` → `''`.
3. **Page actions** (`index.ts`): `footerLocalesLinking` reads the stored slug (`pages.select('id, slug')`) and the four
   `site_footer` rows (`locale, nav_links, info_links, social_links`); an enabled link whose `normalizeInternalPath` equals
   `/<slug>` names its row's language. `deletePage` and `updatePage` (when `is_published === false` or the slug differs from the
   stored one) → `{ error: 'page_in_footer', locales }`, nothing written; a failed page or footer read → `transient`, nothing
   written. `assertPermission('legal.manage')` stays the first await; in `updatePage` the check runs after the slug format and
   uniqueness checks (cheap checks first).
4. **Footer actions** (`footer.ts`): `invalid_internal_link` of `saveFooterShared` and `upsertFooterContent` (the shape check and
   the existence check `checkCmsSlugs`) returns `links` (the refused addresses, each once). `AdminFooterManager.tsx` names them in
   its three toasts with `admin.footer.error_invalid_internal_link_named`; other results, bounds and checks unchanged.
5. **Editor** (`MantineRichTextEditor.tsx`, EXTEND): "Add media" (today's image dialog and upload path) and the tabs
   "Visual"/"Text" above the toolbar; row 1: bold, italic, strikethrough, bulleted list, numbered list, quote, horizontal line,
   align left/centre/right, link (Mantine's link control), remove link, the table menu (7 items), the row toggle, full screen;
   row 2 (starts shown): the "Paragraph" select (paragraph, H2–H6, preformatted; trigger shows the current format), underline,
   justify, text colour (palette + "default"), undo, redo. Each tool: lucide icon, `title` and `aria-label` = its name,
   `data-active` state; 44px below 640px, 26px from 640px (the existing `touch` sizes). Menus are `MantineDropdownMenu`. "Text"
   mode: the HTML in a monospace `Textarea` inside the same editor box with the quicktags b, i, link, b-quote, del, ins, img, ul,
   ol, li, code, close tags (WordPress behaviour: wrap a selection; without one open the tag, the button reads `/b` and closes it;
   "close tags" closes all, last first; `img` opens the image dialog and inserts `<img src alt>` with escaped attributes). Typed
   HTML is parsed by the editor schema at once (`ins` becomes `u` in an inert `DOMParser` document; `del` is the schema's strike).
   Full screen renders the same editor in a full-screen Mantine `Modal` (the editor content moves; the document stays). Not
   offered: special character, clear formatting, paste as text, indent/outdent, help, more, columns; the columns extension stays.
   Extensions add `TextStyle` and `Color`.
6. **Dependency**: `npm install --save-exact --ignore-scripts @tiptap/extension-text-style@3.32.2` (exit 0, "added 1 package").
   npm 11.16 also rewrote unrelated lockfile entries (removed the `webpack`/`terser`/`@webassemblyjs/*` entries and changed `dev`
   flags; −1019 lines); the committed lockfile was restored (`git show HEAD:package-lock.json`) and only the package's own
   entry and its root dependency line were inserted (+14 lines). `node_modules` gained only the package (npm printed no removal).
   `npm view` 2026-11-27: created 2020-11-16, 3.32.2 published 2026-10-30, repository `ueberdosis/tiptap`, scripts `build` only,
   peer `@tiptap/core` 3.32.2.
7. **Sanitizer**: allows `del`, `ins` (no attributes) and `span` with `style` `color` only; `allowedStyles` moved from `'*'` to
   per tag (`p`, `h2`–`h6`, `li`: `text-align`; `span`: palette colour), so a span keeps no alignment; `h5`/`h6` gain `style`.
   **Fact found:** ProseMirror writes a style through `dom.style.cssText` (`node_modules/prosemirror-model/dist/index.js:3435`),
   and the browser serialises a hex colour as `rgb(r, g, b)`: measured in Chromium (Storybook, `setColor('#EC5447')` →
   `getHTML()` = `<p><span style="color: rgb(236, 84, 71);">word</span></p>`) and in jsdom. A hex-only allowlist would remove
   every colour the editor writes. So `textColors.ts` gives each palette colour both spellings of the same theme value (`value`
   hex, `rgb`), and the sanitizer matches either exactly (anchored regex of the escaped value). INFERENCE: this reading of
   "exact values of textColors.ts" needs the reviewer's confirmation.
8. **Story and messages**: `RichTextEditor.stories.tsx` gains `TextMode` (opens "Text" in `play`), `ImageUploading` opens the
   dialog through "Add media"; description updated. Messages in sq/en/uk/it: `admin.pages.btn_new` without "+ ";
   `field_title_optional_label`, `sq_title_required`, `page_in_footer`, 21 `admin.pages.editor.*` keys,
   `admin.footer.error_invalid_internal_link_named`.

`textColors.ts`: `brand, gray, red, orange, green, blueLight` at the theme's `primaryShade` (7), read from `theme.colors`.

## Test changes to assertions (for the reviewer; A9)

No assertion was loosened. Assertions that pinned behaviour the Scope replaces were changed to the new behaviour:
- `AdminPagesManager.smoke.test.tsx` T1: "opens on the admin locale (en)" → opens on `sq` (Scope item 1). T12 opens the image
  dialog through "Add media" (the Insert menu is gone). `activePanel` takes the first visible tabpanel (the editor adds its own).
- `adminPagesContent.test.ts`: `'Përditësime'` → `'perditesime'` (was `'prditsime'`; Scope item 2).
- `pages-and-footer-validation.smoke.test.ts`: three `{ error: 'invalid_internal_link' }` → with `links` (stricter).
- `MantineRichTextEditor.smoke.test.tsx` pinned D868-6/D868-7, which O990-1 replaces: "five toolbar controls" → 21 tools; the
  four menu-content cases → every kept D868-3 function offered by name (tools, table menu, Paragraph select); each functional case
  keeps its assertions and presses the tool instead of a menu item; T7 inserts/removes columns through the editor commands (the
  extension stays, the tool left); AC30 keeps "Bold active, Italic not" on the tools — its two assertions on the Format menu's
  check icon were removed with the menu.

## Commands (shell, exit code, summary)

| Step | Command | Shell | Exit | Summary |
|---|---|---|---|---|
| I4 | `npm test -- <6 AC test files>` on unchanged code | Git Bash | 1 | `Test Files 6 failed (6)`, `Tests 29 failed \| 85 passed (114)`; the toolbar and sanitizer-security files fail to import `textColors` |
| I8 | `npm test -- <48 import-graph + 5 text-search + toolbar test>` | Git Bash | 0 | `Test Files 54 passed (54)`, `Tests 1063 passed (1063)` |
| I8 | `npm run test:security-integration -- <8 files>` (SECURITY_TEST_TARGET=development, SECURITY_TEST_PROJECT_REF from `.env.local`, not printed) | Git Bash (node launcher) | 0 | `Test Files 8 passed (8)`, `Tests 52 passed (52)` |
| I8 §8.1 | `npx vitest related --run --reporter=verbose <23 changed/new files>` | Git Bash | 1 | `Test Files 1 failed \| 474 passed (475)`, `Tests 1 failed \| 8198 passed (8199)`; the failure is `[SEC-T1-SRV-BUILT-PROXY]` (below) |
| I8 §8.1 | `grep -rlE "<paths, package.json, messages, TEXT_COLORS…>" src scripts --include=*.test.*` | Git Bash | 0 | 92 files; only by text: 6 `scripts/quality/*.test.mjs` and the 4 integration files of the Route |
| I8 §8.1 | `node --test scripts/quality/{agent-settings,build-lints,change-report,check-files,install-scripts,owasp}.test.mjs` | Git Bash | 0 | `# tests 83`, `# pass 83`, `# fail 0` |
| I8 | `npm run typecheck` | Git Bash | 2 | 80 errors, all in `.next/types/validator.ts` (stale generated file: old route paths such as `src/app/[locale]/[slug]/page.js`); **0 in `src`** |
| I8 | `npx eslint --no-warn-ignored --max-warnings 0 <17 changed code files>` | Git Bash | 0 | no output |
| AC6 | `node scripts/check-mobile-adaptation-contract.mjs --base main` | Git Bash | 0 | `PASS … no newly added text clipping primitive; every active kickoff record is complete.` |

`[SEC-T1-SRV-BUILT-PROXY]` (`src/__tests__/security/proxyFile.test.ts`): the local `.next/server/functions-config-manifest.json`
dates from 2026-11-21 and lacks the `vendor/[^/]+\.(?:js|txt)$` matcher part that `src/proxy.ts` has; this task does not change
`src/proxy.ts`. The I8 exception applies: only CI checks it (A5 forbids the local build).

## I9 — each control removed once, restored byte for byte

| Break | Test | Exit | Failing cases |
|---|---|---|---|
| `SEC-990-PAGE-FOOTER-DENY`: `deletePage` reads the footer before `assertPermission` | `pages-and-footer-validation.smoke.test.ts` | 1 | `[SEC-990-PAGE-FOOTER-DENY] a caller without legal.manage is refused before any read…`, `…the permission check runs before the footer read` (2 failed, 50 passed) |
| `SEC-990-CMS-COLOR`: the palette match replaced by `/.*/` | `sanitizeCmsHtml.security.test.ts` | 1 | the rgb exact-match case, outside palette, named colour, suffix, `url()`, `expression()` (6 failed, 49 passed) |
| the footer protection: the `page_in_footer` returns removed from `deletePage` and `updatePage` | `pages-and-footer-validation.smoke.test.ts` | 1 | delete linked from sq+uk, social link names every language, unpublish/rename linked page (3 failed, 49 passed) |

sha256 before = after: `index.ts` `ddd328a7…5625d4`, `sanitizeCmsHtml.ts` `751113ea…8756c` (`diff` of the two hash files empty).

## I8a — measured on the Storybook dev server (Chromium, Playwright)

Stories `Patterns/Mantine/RichTextEditor` Default and TextMode, `Patterns/Mantine/PageEditorDialogView` New; widths 320, 639,
640, 1440; locales sq, en, uk, it (48 renders):
- Visual toolbar: 21 buttons visible in every render, 0 outside the viewport, no horizontal overflow of the document or the
  toolbar; rows: 6 at 320, 3 at 639, 2 at 640 and 1440 (row 1 / row 2); every control 44×≥44px below 640px, 26×≥26px from
  640px; computed style of a control: radius 8px, colour `rgb(52, 64, 84)`, background `rgb(255, 255, 255)`, border none — the
  same Mantine `RichTextEditor.Control` the five menu triggers of `main` used, with the same `touch` sizes.
- "Add media" 44px high at every width; the Visual/Text tabs 44px (theme Tabs `minHeight`).
- Text mode: 12 quicktag buttons, 3 rows at 320, 2 at 639/640, 1 at 1440; 44px below 640, 26px from 640; no overflow.
- PageEditorDialogView New: selected tab is the Albanian one in all four locales ("Shqip", "Albanian", "Албанська",
  "Albanese"); Save enabled with an empty title; first label "Titulli"/"Title"/"Заголовок"/"Titolo"; dialog right edge 320/639 at
  the sheet widths, 608 at 640, 1110 at 1440; 21 tools in the dialog with the sizes above.
- Full screen (WithContent, uk, 320 and 1440): dialog 320×800 and 1440×800, text length 524 before, inside and after; Escape
  closes it; no console error.
- Not measured: the `/admin/pages` and `/admin/footer` app pages (the prompt names only the Stories; they need an admin session).

## Not done / BLOCKED (for Opus)

- `BLOCKED: scripts/rendered-interaction-states.json` holds 28 rows for `patterns-mantine-richtexteditor--*`: for each of
  `default`, `with-content` and `with-error` the nine rows `add-link`, `history`, `history-wide`, `insert`, `insert-wide`,
  `paragraph`, `paragraph-wide`, `text-format`, `text-format-wide`, whose selectors point at the five removed menu triggers, plus
  `image-uploading`; the new overlays (table menu, Paragraph select, colour palette, the "Add media" dialog, full screen) and the
  new `text-mode` Story have no rows. The file is outside the Scope and its rows come from the census probe, which A5
  forbids locally; CI's census job is expected to fail until the rows are renewed.
- Outside the Scope (A4, reported): the `PageEditorDialogView` Story `New` renders the switch on "Draft"
  (`initialPublished = false`), while production now starts a new page on "Published"; the Story file is not in the Scope.
- Outside the Scope (reported): `admin.pages.editor.menu_insert`, `menu_history`, `clear_formatting`, `columns_2`, `columns_3`,
  `columns_remove` are no longer read by the code (kept in the four message files; removing them is not in the Scope).
- `UNKNOWN`: full screen is a Mantine `Modal fullScreen` inside the pattern (the canonical `MantineModal` has no full-screen
  size and is not in the Scope); the reviewer decides whether that needs `MantineModal` extended.
- I7: every changed code file was read whole; the four `messages/*.json` (2,998 lines each) were read through their complete
  diff, not line by line from the first line to the last — `BLOCKED: 4 × 2,998 lines exceed this session's reading budget`; they
  parse (the tests import them) and `check-i18n` is a CI job.
- AC6 `locale-safety.mjs` and the census, AC7 `gh pr checks`: CI only (A5).

Raw outputs of the runs are in the session scratchpad (not committed): failing-first, the Route runs, `vitest related`, the
three breaks, typecheck, mobile contract.
