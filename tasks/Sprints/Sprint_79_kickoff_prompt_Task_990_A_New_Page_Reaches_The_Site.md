# Task 990 — A page the admin creates in any admin language is saved, published and opened on the site, and the editor shows its tools as familiar icons

Sprint 79. Priority P1. Owner decisions: owner list item 20 (2026-11-19, translated): "The 'Pages' page in the admin. If
the admin creates a page, it must automatically be created on the site. Now this does not work. Also make a normal page
editor where font styles can be set and symbols inserted."; item 21's three checks already hold (plan file, measured
2026-11-19); D868-6 and D868-7 (2026-10-01, Task 868): the editor toolbar is five menus at every width, replaced from
640px by O990-1 (2026-11-19, translated): "It must be like this: 'B' – text styles, 'Paragraph' – heading styles, the
list icon – list styles, the quote icon – quoting, the align-left icon and so on – alignment of elements, the table icon
– table options, the image icon – add an image, the link icon – add a link, the back icon – undo/redo. I like the text
editor in WordPress very much, but there are several options we do not need (for example the omega icon, the eraser
icon, the T-with-case icon, the alignment icons with arrows, the question-mark-in-a-circle icon), but all the icons are
made the way we have been used to seeing them for years, namely which icon is responsible for what." The same day the
owner sent a screenshot of the WordPress classic editor (both modes) and wrote (translated): "I wrote not only about this
icon. Look at the screenshot, how many icons and functions there are." The toolbar below takes every tool of that
screenshot except the five the owner excluded and the one that has no function on this site. The owner confirmed the
text colour from the theme palette only, with no free colour (2026-11-19, translated): "yes!" Plan files: `tasks/Sprints/Sprint_79_The_CMS_Pages_Nobody_Can_Read.md`,
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Kickoff refreshed 2026-11-27 on `9b74f63a0` (after Tasks 988 and 989: the site
page moved under `(site)`, the footer actions and the Footer page rewritten, the social links shared by the four footers).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

An admin who works in Ukrainian opens "New page", fills the title and the text in Ukrainian and cannot save: the button
stays grey and nothing says why. A page that is saved starts as a draft, so the site answers 404. After the task: a new
page opens on the Albanian tab (the one language a page must have) with that title marked as required, a press on Save
without it says so on the field, the address is built from the Albanian title with its letters, and a new page is
published unless the admin switches it to draft; a page a footer link points to cannot silently disappear; from 640px
the editor shows every tool as a familiar icon in one toolbar (O990-1).

## Cause

Read at `9b74f63a0`
- The dialog opens on the admin's language: `src/components/admin/AdminPagesManager.tsx:36`; Save stays disabled until the Albanian title is filled (`src/components/admin/PageEditorDialogView.tsx:138`, `src/components/admin/AdminPagesManager.tsx:88`), and no text says so; the address comes only from the Albanian title (`src/components/admin/AdminPagesManager.tsx:54-56`) through `toSlug`, which keeps `a-z0-9` only (`src/components/admin/adminPagesContent.ts:11`). Measured 2026-11-19 on production with `HYDRATION_ADMIN` and the admin language `uk`, a Playwright run that saved nothing: `node pages-create-repro.mjs` → `dialog opens on tab: "Українська"`, then after a Ukrainian title and text `save disabled = true | slug = ""`. `node --experimental-strip-types -e "…toSlug('Çmimet e shtëpive')"` → `"mimet-e-shtpive"`.
- A new page starts as a draft (`src/components/admin/AdminPagesManager.tsx:47`) and the site serves published pages only (`src/app/[locale]/(site)/[slug]/page.tsx:47`).
- The footer check of published pages (`checkCmsSlugs`, `src/modules/admin/actions/footer.ts:62-79`) runs only when a footer is saved (`saveFooterShared` `:159`, `upsertFooterContent` `:216`); `updatePage` and `deletePage` never look at the footer (`src/modules/admin/actions/index.ts:339-381`), and the footer error names no link (`src/components/admin/AdminFooterManager.tsx:385`, `:395`, `:405`). Read-only 2026-11-19: the Ukrainian footer kept an enabled link `/test` ("Тестова") to no page, and `https://lero.al/uk/test` answered `404`. Read-only 2026-11-27: that link is gone; the four footers link `/about`, `/privacy-policy` and `/terms-of-service`, each a published page, and nothing stops deleting, unpublishing or renaming one of them.
- The toolbar offers bold, italic, underline, strikethrough, H2-H4, lists, quote, alignment, link, columns, table, image, undo and redo in five menus (`src/design-system/mantine/patterns/MantineRichTextEditor.tsx:241-287`), so every tool is two presses away, and the text menu holds clear formatting (`:253`), which O990-1 excludes. Of the screenshot's tools it lacks the horizontal line, text colour, the row toggle, full screen, H5, H6, preformatted text and the HTML ("Text") mode; the editor loads no colour extension (`:127-135`).
- The page sanitizer keeps no `del`, `ins` or `span` and only `text-align` as a style, on `p`, `h2`-`h4` and `li` (`src/modules/cms/lib/sanitizeCmsHtml.ts:40`, `:85`, `:87`), so a colour, `del`, `ins` or an aligned `h5` would be lost on the site.
- The "New page" button draws a plus icon and its text starts with "+ " (`src/components/admin/AdminPagesView.tsx:182-186`, `messages/uk.json:1043` `admin.pages.btn_new` "+ Нова сторінка"): the screenshot shows "+ + Нова сторінка".

Fix: a new page opens on the Albanian tab, Save always answers (a missing Albanian title is a field error), the address keeps Albanian letters, a new page is published by default; a page an enabled footer link names cannot be deleted, unpublished or renamed, and a footer error names its links; the editor gets the O990-1 toolbar and HTML mode, and the sanitizer keeps exactly the markup they add.

## Scope

- `src/components/admin/AdminPagesManager.tsx`, `PageEditorDialogView.tsx`: a new page opens on `sq`; the Albanian tab and title carry the required mark; Save is disabled only while saving or with a slug error; a press without the Albanian title switches to `sq` and shows `admin.pages.sq_title_required` on the field, no action call; a new page's switch starts on "Published" (owner item 20), an edited page keeps its stored state.
- `src/components/admin/adminPagesContent.ts` `toSlug`: Latin letters with marks lose the mark first (`normalize('NFD')`, combining marks removed), so `ç`→`c`, `ë`→`e`; other scripts give nothing as today, and the empty address keeps its existing format error.
- `src/modules/admin/actions/index.ts`: `deletePage`, and `updatePage` when it unpublishes or changes the slug, read `nav_links`, `info_links` and `social_links` of the four `site_footer` rows (Task 989: the social links are one list stored in each row) after `assertPermission('legal.manage')`; an enabled link to `/<old slug>` → `{ error: 'page_in_footer', locales }`, nothing written; a failed footer read refuses with `transient`. The dialog and the delete toast name the footer languages (`admin.pages.page_in_footer`).
- `src/modules/admin/actions/footer.ts`: `invalid_internal_link` of `saveFooterShared` and `upsertFooterContent` (shape and existence) returns the refused addresses (`links`); `AdminFooterManager.tsx` names them in its three toasts (`:385`, `:395`, `:405`, `admin.footer.error_invalid_internal_link_named`); the other results and the bounds of Task 989 unchanged.
- `src/design-system/mantine/patterns/MantineRichTextEditor.tsx` (EXTEND), O990-1, the WordPress classic layout at every
  width (the rows wrap below 640px; replaces D868-6/D868-7). Above the toolbar: "Add media" (today's image upload,
  Cloudinary only) and the tabs "Visual" and "Text". Each tool is an icon with its name as tooltip and accessible name
  and shows its active state. Row 1: bold, italic, strikethrough, bulleted list, numbered list, quote, horizontal line,
  align left, centre, right, link (add and edit), remove link, the table icon with its menu (insert, add and delete row,
  add and delete column, header row, delete table), the row toggle, full screen. Row 2 (shown or hidden by the toggle;
  starts shown): the "Paragraph" select (paragraph, heading 2-6, preformatted; heading 1 is the page title,
  `CmsPageView.tsx:25`), underline, justify, text colour (A with a palette), undo, redo.
- Text colour: a palette of the theme's text colours (`brand`, `gray`, `red`, `orange`, `green`, `blueLight` at one shade,
  one list in `src/design-system/mantine/richtext/textColors.ts` read from the theme) plus "default"; no free colour,
  because one semantic element has one visual contract. Dependency `@tiptap/extension-text-style@3.32.2` (`./color`):
  `npm view` 2026-11-19 → first release 2020-11-16, this version 2026-10-30, repository `ueberdosis/tiptap`, scripts
  `build` only, peer `@tiptap/core` 3.32.2 as installed.
- "Text" mode: the body's HTML in a monospace field with the buttons b, i, link, b-quote, del, ins, img, ul, ol, li,
  code, close tags; switching to "Visual" parses it through the editor schema (strike reads `del`, underline reads
  `ins`). Not offered: Read More and "more" (they split a post for an excerpt list; a page renders whole,
  `src/modules/cms/components/CmsPageView.tsx:32`); and the owner's five: special character, clear formatting, paste as
  text, indent and outdent, help. The columns tool, in neither list, leaves the toolbar: no production page uses it
  (read-only 2026-11-19: `privacy-policy`, `about`, `terms-of-service`) and the extension stays so a stored page renders.
- `src/modules/cms/lib/sanitizeCmsHtml.ts`: allows `del`, `ins`, and `span` with only `style="color: <palette value>"`
  (exact values from `textColors.ts`); `text-align` also on `h5`, `h6`; everything else unchanged.
- The Story `src/stories/patterns/mantine/RichTextEditor.stories.tsx` shows both modes at 320px, 640px and 1440px.
- `messages/{sq,en,uk,it}.json`: `admin.pages.btn_new` without the leading "+ "; the new keys above.
- Dependencies: `@tiptap/extension-text-style` 3.32.2 (above; `npm view` repeated 2026-11-27: the same dates, repository, scripts and peer; latest 3.35.1, the pin follows the installed Tiptap 3.32.2). Out of scope: the page bodies (O79-0); the synthetic draft pages `zz_synth_*` left in `pages` by an integration run (read-only 2026-11-27: 15 rows).
- Kept as on `main` (checklist A2): `AdminPagesManager.tsx`/`PageEditorDialogView.tsx` — the four language tabs, the fields, the slug field and its errors, the `sq` body rule (`sq_body_required`), the image upload, the edit of an existing page; `adminPagesContent.ts` — `validateSlug` and the reserved addresses; `index.ts` — `createPage`, the slug uniqueness check, the `legal.manage` permission first, `pickFields`; `footer.ts` — every check, bound and result of Task 989 other than the added `links`; `AdminFooterManager.tsx` — the form, its bounds and the other toasts; `MantineRichTextEditor.tsx` — the stored HTML format, the extensions (columns kept for stored pages), the image upload path; `sanitizeCmsHtml.ts` — every tag and attribute it keeps today; `CmsPageView.tsx` unchanged.

## Attack surface

Changed: two staff actions read one more table; staff can write raw HTML and colours that reach every visitor.
1. **What are we working on?** `deletePage`, `updatePage` (staff with `legal.manage`; service-role reads of
   `site_footer` after the permission check); the editor's "Text" mode and colour (staff input stored as page HTML,
   rendered to every visitor through `sanitizeCmsHtml`).
2. **What can go wrong?**
   - T1 I/E: the footer read runs for a caller without the permission → mitigate: `assertPermission` stays the first
     await → AC3, `SEC-990-PAGE-FOOTER-DENY`.
   - T2 T: a footer address in the toast becomes markup → mitigate: the toast renders the address as text → AC3.
   - T3 T/I: HTML typed in "Text" mode, or a forged colour style, runs in visitors' browsers or loads a resource →
     mitigate: the render sanitizer keeps only the allowlist; a colour must equal a palette value → AC5, `SEC-990-CMS-COLOR`.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: unchanged (same actions, same permission).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19; repeated 2026-11-27, which adds React_Security).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new footer read and the HTML mode — AC3, AC5.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — both page actions keep `legal.manage` as their first check — AC3.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed footer read refuses the delete or unpublish — AC3.
- Authorization_Patterns: not applicable — no rule moves; the permission stays in the action, next to the write.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-990-PAGE-FOOTER-DENY` fails if the footer read moves before the permission check — AC3.
- Authorization_Testing_Automation: not applicable — the authorization matrix gains no row.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — page HTML passes the allowlist sanitiser on render, colours only from the palette, the toast prints addresses as text — AC3, AC5.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — the sanitiser keeps its attribute allowlist: `span` gains only a palette `style`, `del` and `ins` none — AC5.
- Denial_of_Service: "Using validation that is cheap in resources first" — the editor and the sanitiser keep their limits; the colour check is an exact match against a fixed list — AC5.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the CI SBOM job regenerates and validates the document with the new package — AC7.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the "Text" mode is parsed by the editor schema and rendered only through the sanitiser — AC5.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — "Add media" keeps today's upload path and its checks; only Cloudinary images survive the sanitiser — AC5.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a missing Albanian title and a page the footer needs are refused with a named reason — AC1, AC3.
- Insecure_Direct_Object_Reference_Prevention: not applicable — staff with `legal.manage` act on every page by design; unchanged.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input (the slug change removes marks with `normalize`).
- Mass_Assignment: not applicable — `updatePage` keeps its field allow-list; no field is added.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — each page action checks the permission before any read, tested by direct call — AC3.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — `@tiptap/extension-text-style` is read on npm in Scope (age, repository, no install script, peer) — AC7.
- React_Security: "Writing to `.innerHTML`, `.outerHTML`, or `.insertAdjacentHTML()` through a ref is exactly as safe or unsafe as `dangerouslySetInnerHTML` with the same input" — the editor and Text mode write no HTML through a ref; the page body reaches `dangerouslySetInnerHTML` only through `sanitizeCmsHtml` (`CmsPageView.tsx:32`) — AC5.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — one dependency, read on npm in Scope; the reviewer reruns every claim of the report — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC3 and AC5.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — exact pin 3.32.2, the same version as the installed Tiptap packages, at least 14 days old — AC7.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC3, AC5.
- User_Privacy_Protection: not applicable — the pages, the footer and the toolbar read or show no personal data.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate break included — AC7.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit runs on the tree with the new package — AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the toast writes text only; the page body reaches `dangerouslySetInnerHTML` only after the sanitiser — AC3, AC5.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the sanitiser is one layer: React renders the toast as text and the colour is matched exactly, not filtered by pattern — AC5.

## UI

GR-0 queries: "rich text editor toolbar", "editor icons", "html source mode", "required field on a tab". Inspected:
`MantineRichTextEditor` (Story `RichTextEditor`), `PageEditorDialogView` and `AdminPagesView` (their Stories),
`MantineDropdownMenu`. Decision: EXTEND `MantineRichTextEditor` (O990-1 toolbar, Text mode) and its Story; REUSE the
dialog, tabs and field error. Reference research (GR-7): new decision (toolbar) — Lahomes `forms-editors.html`
and Kamr `form-ckeditor` read live 2026-11-19 (every tool visible in one wrapping toolbar), and the WordPress classic
editor the owner names in O990-1; the dialog and tabs are
inherited canonical design — owner decision 2026-10-20.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/design-system/mantine/patterns/MantineRichTextEditor.tsx — the toolbar; src/components/admin/PageEditorDialogView.tsx — the language tabs and the required Albanian title
- Component families: editor, overlay-and-disclosure
- Pattern IDs: editor-adaptive, toolbar-priority, overlay-adaptive
- Standards: w3c-reflow, w3c-focus-order, apple-hig-toolbars, android-adapt-layouts, android-layout-navigation, w3c-hover-focus, apple-hig-sheets, android-common-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineRichTextEditor.tsx, src/design-system/mantine/patterns/MantineDropdownMenu.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the two WordPress rows wrap, each button 44px, the row toggle and full screen stay in row 1; 640px transition: the same rows at the editor's width
- Mobile order: tabs → title → toolbar → text → address → publish switch → Save
- Required-content treatment: every tool stays visible and reachable; the rows wrap; no clipping
- Story and verification: RichTextEditor Default and TextMode, PageEditorDialogView create state at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 A page is created from any admin language — test: `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` (extended): with the admin language `uk`, "New page" opens on `sq`; Save pressed with only Ukrainian fields shows `sq_title_required` on the Albanian title and calls no action; with an Albanian title it calls `createPage` with `is_published: true`; editing a draft keeps it a draft; `src/components/admin/__tests__/adminPagesContent.test.ts`: `toSlug('Çmimet e shtëpive')` → `cmimet-e-shtepive`, `toSlug('Тестова')` → `''`.
- AC2 The button reads "New page" once — test: the same smoke file: the button text has no leading "+"; `node scripts/check-i18n-parity.mjs`.
- AC3 A page a footer names cannot vanish — test: `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` (extended): `deletePage`, `updatePage({ is_published: false })` and a slug change of a page an enabled footer link names → `page_in_footer` with its languages, no write; a disabled link or another slug → allowed; a failed footer read → `transient`, no write; `upsertFooterContent` with `/test` → `invalid_internal_link` with `links: ['/test']`;
  `SEC-990-PAGE-FOOTER-DENY`: a caller without `legal.manage` is refused before any read of `site_footer`.
- AC4 The toolbar follows O990-1 — test: `src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.toolbar.test.tsx` (new): every tool of both rows is a visible button in the stated order with its name and active state at 320px, 640px and 1440px; the toggle hides and shows row 2; the table menu holds its seven items; the "Paragraph" select offers paragraph, heading 2-6 and preformatted; the palette offers exactly the `textColors.ts` values; "Text" mode inserts each quicktag's markup and switching back keeps `del` as strike and `ins` as underline; no special-character, clear-formatting, paste-as-text, indent, outdent, help, more or columns tool exists.
- AC5 The site keeps only allowed markup — test: `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts` (extended): `del`, `ins`, `hr`, `pre`, an aligned `h5` and a palette colour survive; `SEC-990-CMS-COLOR`: a colour outside the palette, `background`, `url(...)`, `expression(...)`, a second style property and any other `span` attribute are removed.
- AC6 The Stories and four languages hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the changed Stories (raw output saved).
- AC7 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read the files of Scope, `footer.ts` and the two Stories.
2. Tests first (AC1-AC5); save each failing output.
3. The dialog, the slug, the page actions, the footer error, the toolbar and Text mode, the colour palette and the sanitiser, the messages, the Stories. One pass over every changed file (checklist I7).
4. Run (checklist A5, nothing else locally) every test both searches of `quality-gates.md` §8.1 find (2026-11-27,
   `9b74f63a0`, over the product files of the Scope), plus the new toolbar test, as listed under "Route tests" below:
   the default collection with `npm test --`, the integration files with `npm run test:security-integration --` (the
   environment of `project-facts.md`, "Supabase and test data"). CI on GitHub only (`gh pr checks <n>`); one deliberate
   break of the footer check, restored.
5. Report: each command, exit code, relevant output. After the merge Opus repeats the 2026-11-19 run with `HYDRATION_ADMIN` in Ukrainian, now saving a page `opus-990-check`, opens it on the site, deletes it.

### Route tests

Import graph, default collection (48): `src/__tests__/reactHooksV7Components.test.tsx`, `src/__tests__/security/staffActions.test.ts`, `src/app/[locale]/(site)/[slug]/__tests__/page.errors.test.ts`, `src/app/[locale]/admin/__tests__/adminSlug.test.tsx`, `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx`, `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx`, `src/app/[locale]/admin/users/__tests__/adminUserGone.security.test.ts`, `src/app/[locale]/admin/users/__tests__/adminUsersNotice.security.test.tsx`, `src/app/__tests__/serverNowProps.test.tsx`, `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`, `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`, `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`, `src/components/admin/__tests__/AdminPagesView.test.tsx`, `src/components/admin/__tests__/AdminSettings.seo.test.tsx`, `src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx`, `src/components/admin/__tests__/AdminUserCreate.watch.test.tsx`, `src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx`, `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`, `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`, `src/components/admin/__tests__/adminPagesContent.test.ts`, `src/components/admin/__tests__/adminPagesHydration.test.tsx`, `src/components/layout/__tests__/FooterView.security.test.tsx`, `src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx`, `src/design-system/mantine/patterns/__tests__/richTextRoundTrip.test.ts`, `src/lib/account/deleteAccount.security.test.ts`, `src/lib/auth/__tests__/moderatorKeys.security.test.ts`, `src/lib/auth/staffAccess.security.test.ts`, `src/modules/__tests__/noDbMessage.security.test.ts`, `src/modules/admin/actions/__tests__/adminActorRank.security.test.ts`, `src/modules/admin/actions/__tests__/adminCatalog.security.test.ts`, `src/modules/admin/actions/__tests__/adminOperations.security.test.ts`, `src/modules/admin/actions/__tests__/adminPermissions.security.test.ts`, `src/modules/admin/actions/__tests__/adminResults.security.test.ts`, `src/modules/admin/actions/__tests__/createAdminUser.security.test.ts`, `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts`, `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts`, `src/modules/admin/actions/__tests__/profileBounds.security.test.ts`, `src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts`, `src/modules/admin/actions/__tests__/userAdministration.security.test.ts`, `src/modules/admin/actions/__tests__/userWebsite.security.test.ts`, `src/modules/admin/actions/accountBan.security.test.ts`, `src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx`, `src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx`, `src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx`, `src/modules/cms/components/__tests__/CmsPageView.sanitize.test.tsx`, `src/modules/cms/lib/__tests__/isCmsBodyEmpty.test.ts`, `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`, `src/modules/cms/lib/__tests__/sanitizeCmsHtml.test.ts`.

Text search only, default collection (5): `src/__tests__/security/filterStrings.test.ts`, `src/__tests__/security/publicListingsTag.test.ts`, `src/components/admin/__tests__/adminFormsKit.test.ts`, `src/modules/admin/__tests__/adminOrphans.test.ts`, `src/modules/admin/actions/__tests__/footerContent.security.test.ts`.

Integration collection (8): `src/lib/account/deleteAccount.integration.test.ts`, `src/lib/auth/sessionEnd.integration.test.ts`, `src/lib/auth/staffAccess.integration.test.ts`, `src/modules/admin/actions/accountBan.integration.test.ts`, `src/modules/admin/actions/adminPermissions.integration.test.ts`, `src/modules/admin/actions/userProfileFields.integration.test.ts`, `src/tests/integration/adminPage.integration.test.ts`, `src/tests/integration/moderatorKeys.integration.test.ts`.

New: `src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.toolbar.test.tsx`.

## Revision 1 (Review 1, 2026-11-27)

The items are written in full in [Task_990_Review_1.md](../../docs/reviews/Task_990_Review_1.md), "Revision 1"; items F1 and F2 reach files the Scope did not name (`scripts/rendered-interaction-states.json`, `src/stories/patterns/mantine/PageEditorDialogView.stories.tsx`): owner's permission 2026-11-28 (translated): "Yes". F5 is Task 1078 (owner decision O1078-1, 2026-11-28). AC6 runs only on GitHub CI (checklist A5): `check-mobile-adaptation-contract.mjs`, `locale-safety.mjs` and the census are not run locally. Owner decision recorded in the executor's report (2026-11-27, translated): "By the 2026-06-26 policy" — no required mark; the en/uk/it titles read "(optional)".

- F1: the census rows of the RichTextEditor Stories (and the editor triggers inside the PageEditorDialogView Stories) follow the O990-1 toolbar: the 28 rows of the removed menus are replaced by one row per trigger that opens a portal (link, table, Paragraph, colour below and from 640px, full screen, "Add media", `TextMode` and its `img`); each selector checked on the Storybook dev server.
- F2: the `New` Story starts published; a `TitleRequired` Story shows `sqTitleError`, with its registry row.
- F3: the full-screen dialog's close control is the canonical 44px round close with a close name (`fullscreenClose` in the four languages); the toolbar test asserts both.
- F4: the six message keys no code reads leave the four message files.

## Revision 2 (Review 2, 2026-11-28)

The item is written in full in [Task_990_Review_2.md](../../docs/reviews/Task_990_Review_2.md), "Revision 2"; its two files are in the Scope. AC6 runs only on GitHub CI (checklist A5).

- F6: Escape in the editor's full-screen view or "Add media" dialog closes only that view or dialog; the page dialog and what was typed in it stay. `MantineRichTextEditor.tsx` reports its open dialogs (`onDialogChange`), `PageEditorDialogView.tsx` ignores the page dialog's close while one is open; tested in `AdminPagesManager.smoke.test.tsx` (`[F6]`).

## Revision 3 (Review 3, 2026-11-28)

The items are written in full in [Task_990_Review_3.md](../../docs/reviews/Task_990_Review_3.md), "Revision 3": the three red CI checks of PR #86 (run 46164462550) on code of the first implementation. Item 3 also reaches `package.json` and `package-lock.json` (a pinned `@tiptap/extension-underline` 3.32.2, already installed through `@tiptap/starter-kit`).

- F7: the computed `rgb(` spelling in `textColors.ts:23` carries the design-token allow marker with its reason.
- F8: `PALETTE_COLOR` in `sanitizeCmsHtml.ts` is renamed `PALETTE_COLOR_STYLE`.
- F9: the editor reads `ins` as underline through its schema (`Underline.extend` with an `ins` parse rule); `insAsUnderline` and its `DOMParser` leave.

## Review

- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_990_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_990_Review_2.md)
- [Review 3 — NEEDS REVISION](../../docs/reviews/Task_990_Review_3.md)
