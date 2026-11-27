# Task 989: executor report (Sonnet)

Date: 2026-11-27. Branch: `task/989-site-settings-reach-the-site`, base `8896ef0d7` (the owner switched to it). Every change is in the working tree; nothing is committed or pushed (no mutating Git command was run).
Sources: the kickoff `tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md`, checklists A, I and U, `.claude/rules/quality-gates.md` §1-§5 and §8.1, and the owner's later instructions in this session.
Anything not read or not measured is marked UNKNOWN or "not done". The report to the owner was given in Ukrainian; this file is its record in English.

---

## 1. Summary

| Block | State |
|---|---|
| AC1 every saved setting has a reader | Done (`settingsReach.test.ts`). |
| AC2 logo, favicon, title, description | Done; logo and favicon only from the project's Cloudinary (`isBrandImageUrl`). |
| AC3 footer follows the Footer page | Done; contacts column, show switches, values checked again before output. |
| AC4 writes refuse bad values, removed keys, non-admins | Done (`staffActions.test.ts` extended). |
| AC5 one editor, on Mantine | Done in code and tests; the `check:*` parts run only in CI. |
| AC6, AC7 | CI only (A5). |
| Owner instructions during the session | SEO language tabs, Footer page in three columns, "Footer" translated, link reordering with `@dnd-kit` (section 3). |
| **State** | **BLOCKED**: six existing tests outside the Scope pin behaviour the kickoff changes (section 4.1). |

---

## 2. What changed

- **Header.** The saved logo, only when `isBrandImageUrl` accepts it: https, the project's cloud, no credentials. A listing photo on `media.lero.al` and any other host are refused. Otherwise the wordmark of `main`. The logo is drawn through `AppImage` variant `brand-logo` at the height token `theme.other.boxSize.siteLogo` (28px), its own width, `contain`.
- **Favicon** of the site and the admin, by the same rule; otherwise `src/app/favicon.ico`.
- **Title and description.** Per language (`meta_title_<locale>`, `meta_desc_<locale>`) through `generateMetadata`; an empty value gives the text of `main`.
- **Site footer.**
  - The brand is the brand title of the page's language, else `site_name`.
  - A new contacts column: phone as `tel:`, support and sales e-mails as `mailto:`.
  - Each contact and each social link is shown only when filled and switched on.
  - Values are checked again before output: an e-mail with `?cc=`, a line break or two addresses, a phone with letters or a scheme, and a `javascript:` social link are not rendered as links.
- **Admin "Footer" page, the one editor (O989-3).**
  - Shared block for all languages: phone, support and sales e-mails, each with a switch; the footer-text switch; one social list, each link with its switch.
  - New action `saveFooterShared`. It checks the admin first, then every value; one invalid value refuses the whole save. It writes `site_settings` and all four `site_footer` rows.
  - Language tabs: brand title, footer text, copyright, section titles, navigation and information links.
  - `upsertFooterContent` no longer takes social links.
- **Admin "Site settings".**
  - The Footer tab left; the General tab keeps only `site_name`.
  - `saveSettings` refuses the removed keys (`tagline`, `logo_dark_url`, `social_*`, `about_*`, `meta_title`, `meta_desc`, `contact_*`).
  - Key lists and validators moved to `src/modules/admin/lib/settingKeys.ts`.
- Both forms left the legacy kit (no `@/components/ui`, `AdminInput` or shared `Combobox`) and are enrolled in `scripts/mantine-migration-scope.json`. Their Stories are `Patterns/Mantine/AdminSettings` and `Patterns/Mantine/AdminFooterManager`; the legacy `src/components/admin/AdminSettings.stories.tsx` was deleted.
- New Stories: `HeaderView/WithLogo`, `AppImage/BrandLogo`, `FooterView/ContactsAndSocial`.

---

## 3. Owner decisions in this session (2026-11-27)

1. **SEO.** "Default SEO" holds one tab per language, each with that language's meta title and description only. A tab whose title is filled carries a check, as the page editor's tabs do. The OG image stays below a divider.
2. **Footer page.**
   - The Brand, Navigation and Information cards sit in three columns from 1280px, two from 768px, and stack on a phone.
   - The social links title moved into the Brand card.
   - In the shared block the contacts sit beside the social list.
3. **"Footer" was English in every language.** Now Ukrainian "Футер", Albanian "Fundfaqja", Italian "Piè di pagina". Translated: the page title and subtitle, the sidebar item, the browser tab title, the messages and the labels. The field "Tagline" is now "Footer text", the same name as its switch.
4. **Link order.**
   - The six-dot handle drags with a mouse or a finger, and with the keyboard (Space, arrows, Space).
   - Screen-reader instructions and announcements are translated into the four languages.
   - Up and down buttons are the single-tap way (WCAG 2.2, 2.5.7).
   - The owner allowed `npm install` in this session for `@dnd-kit` (section 5).

---

## 4. Open items

### 4.1 BLOCKED: existing tests outside the Scope contradict the kickoff

| Test | Conflict | Result |
|---|---|---|
| `src/app/[locale]/(site)/__tests__/siteLayout.test.tsx` | imports `metadata`; the kickoff replaces it with `generateMetadata` | 1 failure, TS2614 |
| `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` | sends `social_links` to `upsertFooterContent` | 9 failures, 4 × TS2353 |
| `src/components/layout/__tests__/FooterView.security.test.tsx` `[SEC-S09-SRV-DENY]` | checks social links through `upsertFooterContent` | 1 failure |
| `src/components/layout/__tests__/headerFooterContainers.test.tsx` | expects the built-in social links when all are switched off (against O989-1) | 1 failure |
| `src/modules/admin/actions/__tests__/userAdministration.security.test.ts` | saves the removed `social_facebook` and `about_al` | 2 failures |
| `src/modules/admin/__tests__/adminOrphans.test.ts` | parses `SETTING_KEYS` from the text of `actions/index.ts`; the list moved to `settingKeys.ts` | 2 failures |

Not edited (I8). The social-link scheme refusal now lives in `saveFooterShared` and is tested in `staffActions.test.ts` (AC4).

### 4.2 Other open items

1. **Integration collection not run.** 17 reached files refuse to start without `SECURITY_TEST_TARGET=development` and `SECURITY_TEST_PROJECT_REF`. That guard confirms the project and was not bypassed; it needs the owner's decision.
2. **New dependency.** The kickoff's OWASP section says "no dependency added"; `@dnd-kit` is now added. Opus updates the kickoff and the OWASP record. CI's change report lists the added packages with their age.
3. **No length bound in `saveFooterShared`.** There is no limit on the number of social links or the label length; the kickoff names none. The value is Opus's decision (A2, A4).
4. **Favicon.** Next outputs `/favicon.ico` first and the Cloudinary icon second. UNKNOWN which one the browser shows; to check on production.
5. **Admin pages on the dev server not opened**: they need an admin session. Both forms were measured in Stories.
6. **Outside the task (A4).** `/en` at 320px overflows horizontally by 6px, from the listing card rail on the home page.

---

## 5. Dependencies

- Installed exact versions: `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2; transitively `@dnd-kit/accessibility` 3.1.1.
  - Published 2023-2024, older than 30 days. Peer `react >=16.8`; no native modules.
  - Install scripts are off (`.npmrc` `ignore-scripts=true`).
- npm 11.16 itself also dropped 37 optional peer entries from the lockfile (`webpack`, `terser`, `@webassemblyjs/*` and others; on `main` they are marked `"peer": true, "optional": true`).
  - The lockfile was rebuilt as `main`'s plus the four `@dnd-kit` entries only, each checked for a `registry.npmjs.org` address and an integrity hash.
  - Result: `package-lock.json` +56 lines, `package.json` +3.
- Side effect: those 37 packages were removed from the local `node_modules`.
  - INFERENCE: no effect on `next dev` or Storybook, since they are optional.
  - CI installs from the lockfile, so they will be there.
  - The running Storybook reloaded once to pick up the new dependency.

---

## 6. Checklist I

- **I1.** `git log --oneline -1` → `8896ef0d7`. Only Opus's documents were uncommitted.
- **I2.** Kickoff read in full; Scope and Route tests (AC1-AC5) listed.
- **I3.** Every Scope file read at `8896ef0d7`.
- **I4.** Tests written first; on the unchanged code they all failed:
  - settingsReach, adminFormsKit: `Cannot find package '@/modules/admin/lib/settingKeys'`;
  - HeaderView.logo 1/3, layoutBrand 28/36, Footer.settings 6/9, staffActions 38/238, AdminFooterManager.shared 5/5;
  - the reorder tests 2/7 before their implementation.
  - Exception: `AdminSettings.seo.test.tsx` was written after the change, so its failure on the old code was not shown.
- **I5-I6.** Changes stay in Scope files.
  - Read as implied by the Scope: `messages/*.json` (AC6), `FooterView.module.css`, `Header.tsx`, `src/app/[locale]/admin/footer/page.tsx`, `src/stories/fixtures/admin.fixtures.ts`.
  - `package.json` and `package-lock.json` changed with the owner's permission.
- **I7.** One pass over every changed file. Found and closed, each with its test:
  - `l.url.trim()` threw for a stored link without `url`;
  - the `brand-logo` variant broke the AppImage invariants (`appImageConfig.test.ts`);
  - the refusals of `getAllFooterContent` were returned to their `main` shape.
- **I8.**

| Command | Exit | Result |
|---|---|---|
| `npm test --` the task tests (12 files, with `imageUrl.security.test.ts` and the admin sidebar and language tests) | 0 | 423 tests; `imageUrl.security.test.ts` unchanged |
| `npm test --` the forms and the tests that read `package.json` (7 files) | 0 | 173 tests |
| `node --test` the 6 `scripts/quality/*.test.mjs` files that read `package.json` | 0 | 83 tests |
| `node --test scripts/quality/check-files.test.mjs scripts/quality/codeql-models.test.mjs` | 0 | 34 tests |
| `npx vitest related --run` (every changed file) | 1 | 14 failures, all in section 4.1 |
| Text search of §8.1, then `npm test --` the 10 files only it found | 1 | only `adminOrphans` (2) |
| `npx vitest related --run --config vitest.integration.config.ts` | 1 | 17 files refuse to start (section 4.2) |
| `npm run typecheck` | 2 | in `src/`, only the 5 errors of section 4.1; 80 more lines from the stale local `.next/types` (paths `src/app/admin/*` from before Task 988) |
| `npx eslint --no-warn-ignored --max-warnings 0` (every changed code file) | 0 | — |

- **I8a.** Measured in Storybook and on the dev server.
  - Stories at 320/639/640/1440 × sq/en/uk/it: `HeaderView/WithLogo`, `AppImage/BrandLogo`, `FooterView/ContactsAndSocial`, `AdminFooterManager/Default`, `AdminSettings/Default`. No error and no horizontal overflow.
  - Logo 28px high, `contain`.
  - Contact links match the footer navigation links: 14px/20px, same colour.
  - Form inputs match the canonical `TextInput` Story: 44px, 14px, 1px `#d0d5dd` border, 8px radius. `Switch` track 20×38, as its Story.
  - Footer page layout: three columns from 1280px, two at 768-1024px, one at 320px. The SEO language tabs swipe at 320px.
  - Pointer and keyboard dragging checked on the Story. The keyboard drop announced "Посилання 1 поставлено на позицію 2."
  - Dev server `/en`: Cloudinary logo, Cloudinary favicon, `mailto:support@lero.al`, header 65px as before.
  - No census rows: no changed Story opens an overlay.
- **I9.** Each SEC-989 control was removed once, its test run, then restored:
  - BRAND-URL-DENY: without `isBrandImageUrl` in the layouts → 12 failures;
  - FOOTER-LINK-DENY: without `telHref`/`mailtoHref` → 2 failures;
  - FOOTER-SAVE-DENY: without the admin check → 7 failures (anonymous, user, agent, moderator).
- **I10.** The kickoff names none of these scripts.
- **I11.** No CI check run locally: `check:*`, `check:i18n`, `check-mobile-adaptation-contract`, full run, build.
- **I12.** This report.

---

## 7. Deviations for the reviewer

- **Footer text.** Empty shows the translation, as on `main` (A2); only the switch hides it.
- **Built-in social links** appear only when the footer row could not be read.
- **Form look.** The link address field lost its monospace font (U3); the phone and e-mail placeholders were dropped; "Saving..." became the `loading` state.
- **Inline styles.** `AdminFooterManager.tsx` has two: the row `transform` while dragging and `touch-action: none` on the handle. `@dnd-kit` needs both; neither is a visual value.
- **Unused message keys** (`tab_footer`, `section_social` and others) were left.
- **A12 breach.** One multi-line edit of `staffActions.test.ts` was made through Python in the shell instead of Edit; the result was read back.

---

## 8. Working tree

`git diff --stat`, Opus's documents included: `40 files changed, 1292 insertions(+), 731 deletions(-)`.

New files:
- `src/modules/admin/lib/settingKeys.ts`;
- seven tests: `layoutBrand`, `AdminFooterManager.shared`, `AdminSettings.seo`, `adminFormsKit`, `Footer.settings`, `HeaderView.logo`, `settingsReach`;
- two Stories: `Patterns/Mantine/AdminFooterManager`, `Patterns/Mantine/AdminSettings`;
- this report.
