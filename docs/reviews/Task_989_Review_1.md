# Task 989 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json)

Review 1 of the working tree on 8896ef0d7 (branch `task/989-site-settings-reach-the-site`, uncommitted) — NEEDS REVISION
Scope: diff-based; 31 code files, 2 CSS modules, 4 message files, `package.json`, `package-lock.json`, `scripts/mantine-migration-scope.json`; entry points: the new Server Action `saveFooterShared` (admin), the changed `upsertFooterContent`, `getAllFooterContent`, `saveSettings`, the site and admin layouts' `generateMetadata`; the executor's report `docs/sessions/2026-11-27-task989-executor-report.md`
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45977310002 green; ESLint → exit 0; typecheck → exit 1 (5 errors in `src`, F1); `vitest related` → exit 1, 17 failed of 8109 (F1, F5); `db-catalog-audit.mjs` → exit 0; integration collection 195 passed, 1 failed on the stale local `.next` (not this diff)
Findings: Critical 0, High 0, Medium 2, Low 4
Overall risk: the code removes the Cause and its security controls hold under deliberate breaks; CI would be red on six existing tests the kickoff did not name, and the tab icon is not proven to be the saved one.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45977310002 success (Task 1022 merge), Scorecard success.
- V2: `git diff --stat HEAD` + untracked files on `8896ef0d7`. Scope files and the files the Scope implies (`Header.tsx` passes `logoUrl`, `FooterView.module.css`, `footer/page.tsx` passes `initialShared`, `settings/page.tsx`, fixtures, `messages/*.json`). Outside the kickoff's Scope, each with the owner's decision of 2026-11-27 as the report (§3) records it: `package.json`, `package-lock.json` (`@dnd-kit`, link reordering), the "Footer" translations, the SEO language tabs, the three-column Footer page. No other file outside the Scope.
- V3: claims rerun.
  - Task tests: in the `vitest related` run, `settingsReach` 22, `HeaderView.logo` 3, `layoutBrand` 36, `Footer.settings` 9, `staffActions` 238, `AdminFooterManager.shared` 8, `adminFormsKit` 7, `AdminSettings.seo` 3, `imageUrl.security` 83 (file unchanged), `appImageConfig` 34: all passed.
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 31 changed and new code files → exit 0.
  - `npm run typecheck` → exit 1 (the report says 2): 85 errors; 80 in the untracked `.next/types/validator.ts` (build output of 2026-11-21, not this diff); 5 in `src`: `siteLayout.test.tsx:19` TS2614, `pages-and-footer-validation.smoke.test.ts:167,185,472,488` TS2353 (F1).
  - §8.1 import graph: `npx vitest related --run --reporter=verbose` over every changed and new file (code, CSS modules, messages, `package.json`, the migration scope) → exit 1, 472 files, 17 failed: the six files of F1 (14 tests) plus `adminOrphans.test.ts` (2, also found by the graph) and `proxyFile.test.ts` `[SEC-T1-SRV-BUILT-PROXY]` (1; it reads the stale local build manifest, `src/proxy.ts` is unchanged, CI builds first). The report's "14 failures, all in section 4.1" does not reproduce (F5).
  - §8.1 text search (paths and every added, moved or removed export) → 174 test files; not in the graph's set: six `scripts/quality/*.test.mjs` and four `*.integration.test.ts`. `node --test` on the six → 81 passed, exit 0.
  - Integration collection: see "Integration collection" below (run on the owner's instruction).
  - Browser claims: keyboard drag (Space, ArrowDown, Space) moved link 1 to position 2 and announced "Посилання 1 поставлено на позицію 2."; pointer drag and the "down" button moved it back and forth. Reproduced.
- V4: every changed file read once, tests included. The Cause's six points are removed: one Footer page with a shared block; the footer reads brand title, text, contacts and social links with their switches; the settings lose the footer fields; logo, favicon, title and description are applied; validators per key in `settingKeys.ts`; both forms on Mantine.
- V5: against `git show main:<path>` and production (main): header 97px at 320, 65px from 640 on both; the logo 28×28 `contain` at the wordmark's 28px line height; footer links 14px/20px `lab(48.496 0 0)` on both, the new `mailto:` link the same; footer grid 1/2/3 columns on `main`, 1/2/4 with the contacts column (kickoff). The built-in social links now show only when the footer row could not be read (O989-1). Footer text: empty gives the translation as on `main`, the switch hides it. The row icon controls of the link editor shrank from 32px (`h-8 w-8`, `main` `AdminFooterManager.tsx:78,91`) to 22px (F3). The rest of the forms' look is the Mantine migration the kickoff orders.
- V5a:
  - Pages, dev server. Playwright (no owner session) at 320, 640, 1024, 1440: `/sq /en /uk /it` (the language cookie sent each to `/en`), no horizontal overflow, header and footer as in V5. Owner's Chrome at 1914px (the window would not resize): `/uk` — logo from the project's Cloudinary, `mailto:support@lero.al`, two `rel="icon"` links (F2); `/uk/admin/footer` — title "Футер", input 44px / 8px / 1px `rgb(208,213,221)` / 14px, label 14px 600, Switch 20×38, tab 44px, save 44px, row icon controls 22×22 (F3), no overflow, server HTML with two icon links (F2); `/uk/admin/settings` — tabs "Загальне, Бренд, SEO, Локалізація" (no Footer tab), input and tab as above. Production (`main`, Playwright): header 97/65px, footer grid 1/2/3, one icon link.
  - Stories, Storybook dev server, Playwright: the 14 Stories of the changed components (`AppImage` Default, BrandLogo, Placeholder; `FooterView` Default, ContactsAndSocial; `HeaderView` Default, SigningOut, WithLogo; `AdminSettings` Default, Empty; `AdminFooterManager` Default, Empty, NotInitialized, Forbidden) × sq, en, uk, it × 320, 640, 1024, 1440 = 224 measurements: no document overflow, no element past the viewport outside a scroll container, no error display, no page error.
  - Element values against the canonical Stories at 1440: `TextInput` 44px, 8px, 1px `rgb(208,213,221)`, padding 10px 16px, 14px 400, shadow `rgba(16,24,40,0.05) 0 1px` — identical in both forms; label 14px 600 `rgb(52,64,84)` — identical; `Switch` track 20×38, radius 1000px — identical; `Tabs.Tab` 44px, 6px, 14px 500 — identical; `Button` 44px, 8px, 14px 500 — identical; `ActionIcon` canonical 28×28, the link row's 22×22 (F3).
  - Firefox: not reachable in this session; the owner's look covers it (V9).
- V6: the diff adds or removes no `eslint-disable`, `.skip`, `.only`, `.todo`, `@ts-*`, allowlist, baseline or registry row (grep over the whole diff, new files included).
- V7: below.
- V8: each product change put back to `main` (copy, `git show main:<path>`, test, copy back; `git diff HEAD | sha1sum` identical after each): AC1 and AC2 (site layout) → `settingsReach` + `layoutBrand` 28 failed; AC2 (`HeaderView.tsx`) → `HeaderView.logo` 1 failed; AC3 (`Footer.tsx`, `FooterView.tsx`) → `Footer.settings` 6 failed; AC4 (`footer.ts`, `actions/index.ts`) → `staffActions` 38 failed; AC5 (both forms) → `AdminFooterManager.shared` + `adminFormsKit` 11 failed. AC6 and AC7: CI only (A5).
- V9: below, "Stories for the owner".
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 48 sheets triggered by the diff; 11 of them are not in the kickoff's "## OWASP" (the package files and the Opus documents of the tree trigger them). The record holds a verdict for each.
- V11: six findings, below.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: NEEDS REVISION.

Reviewer's own deviation (A5): `node scripts/check-i18n-parity.mjs` (AC6, a CI check) was started once by mistake in V4 with its output discarded; its result is not used here.

## V7 — secure code review

Six steps: (1) controls kept: `saveSettings` keeps `settings.manage` and its allow-list (now `validSettingValue` refuses any key outside `SETTINGS_FORM_KEYS`, `settingKeys.ts:62`); `upsertFooterContent` keeps its order of checks; `isTrustedImageUrl` answers unchanged (`imageUrl.security.test.ts` unchanged, 83 passed). (2) New entry point: `saveFooterShared` (`footer.ts:138`), a client-callable POST; new sinks: `tel:`/`mailto:` hrefs (`FooterView.tsx:12-16`), logo `src`, icon `href`. (3) Trust boundary: staff-saved values, read with the service role, reach every visitor; each is checked again before output. (4) New packages `@dnd-kit/core` 6.3.1 (2024-12-05), `sortable` 10.0.0 (2024-12-04), `utilities` 3.2.2 (2023-11-06), `accessibility` 3.1.1 (2024-11-23): `npm view` → no install script; lockfile +4 entries from `registry.npmjs.org` with integrity. (5) Tests: six existing tests fail (F1); two cases of `userAdministration.security.test.ts:256` still pass but now for the removed key, not for the scheme and length checks they were written for (F1). (6) Categories:

- Authorization: touched. `saveFooterShared` calls `assertAdminUser()` before any read (`footer.ts:142-143`); `[SEC-989-FOOTER-SAVE-DENY]` for anonymous, user, agent, moderator; the admin path writes (`staffActions.test.ts`). `getAllFooterContent` reads `site_settings` only after its admin check (`footer.ts:90-91`). Identity from the session (`checkStaff`). Service role only after the check.
- Input and output: touched. Keys allow-listed, values validated per key; social links rebuilt field by field (`socialLinkFrom`, `footer.ts:126-132`), extra keys and `__proto__` dropped (tested). No bound on the number of links or the length of a label, address or id, and none on the text fields of `upsertFooterContent` (F4). Output: React text and attributes; `telHref`/`mailtoHref` rebuild the address (`settingKeys.ts:80-93`); social links through `resolveLinkTarget` as on `main`.
- Authentication and sessions; Requests and redirects; Files: not touched (`git diff --name-only` shows no file of `src/app/auth`, `src/lib/auth`, no route handler, no upload).
- Next.js entry points: touched. `saveFooterShared` admin-only; `getSettings` lives in the `server-only` module `settings.ts`; `revalidatePath('/', 'layout')` reachable only after the admin check. The settings keys moved out of the `'use server'` file, so no list is exported as an action.
- Business logic: touched. Invariant "absent switch = on" (`isSwitchOn`) tested; one invalid value refuses the whole save before any write (tested). A transient failure between the `site_settings` upsert and the `site_footer` update leaves the contacts saved and the links not; the action answers `transient` and the admin saves again (no invariant broken).
- JavaScript and TypeScript: touched. `EMAIL` and `PHONE` are single character classes with a bounded length check first for the e-mail; no nested quantifier.
- Data exposure, errors, logging: touched. Errors to the client are codes; `console.error` logs the Supabase error object on the server only, as the existing branches.
- Dependencies and configuration: touched (`@dnd-kit`, above). No header, CSP or workflow change.
- Agent and tool output: `check-files.mjs` runs at commit; rule files changed in the tree are Opus's, at the owner's request.
- Tests: every AC test fails without its change (V8); the deliberate breaks of the report were not repeated beyond V8.
- Data: `node scripts/quality/db-catalog-audit.mjs` → "no finding", exit 0. Uploads: not touched (no upload path in the diff).

## Findings

F1 — Six existing tests the change reaches fail; two security cases now prove nothing
Severity: Medium      Category: Tests      CWE: —
Location: `src/app/[locale]/(site)/__tests__/siteLayout.test.tsx:19`; `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts:159-188,472,488`; `src/components/layout/__tests__/FooterView.security.test.tsx:124`; `src/components/layout/__tests__/headerFooterContainers.test.tsx:236`; `src/modules/admin/actions/__tests__/userAdministration.security.test.ts:249-250,256,278`; `src/modules/admin/__tests__/adminOrphans.test.ts:19-22,156-166`
Description: the kickoff changes what these tests pin (`metadata` → `generateMetadata`; social links leave `upsertFooterContent`; the built-in social links stand only for an unread footer, O989-1; the removed settings keys; the key list leaves `actions/index.ts`), and its Route did not list them (a D10 gap of the kickoff, not of the implementation). The executor reported them as BLOCKED, as I8 requires.
Impact: CI's test and type-check jobs fail; the scheme refusal of social links and the 5000-character bound would stay tested only through removed keys.
Reproduction: `npx vitest related --run --reporter=verbose <changed files>` → 14 failed in these six files; `npm run typecheck` → 5 errors in two of them.
Recommendation: Revision 1, item 1.
References: `quality-gates.md` §8.1; checklist D10; A9.
Status: open

F2 — Two tab icons are output; the saved favicon is not proven to be the one shown
Severity: Medium      Category: Input and output (AC2)      CWE: —
Location: `src/app/[locale]/(site)/layout.tsx:44`, `src/app/[locale]/admin/layout.tsx:15`, `src/app/favicon.ico`
Description: Next.js always outputs the `favicon` file convention of `src/app/` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md:28-34`). With an accepted saved favicon the server HTML holds `<link rel="icon" href="/favicon.ico?…" sizes="256x256">` and then the Cloudinary icon (read on `/uk` and `/uk/admin/footer`). Which one the browser puts on the tab is UNKNOWN; `layoutBrand.test.ts` checks only `metadata.icons`.
Impact: AC2 ("the tab the saved favicon") is not shown to hold; production may keep the old icon.
Reproduction: `fetch('/uk/admin/footer')` on the dev server → two `rel="icon"` links.
Recommendation: Revision 1, item 2.
References: kickoff AC2; A3.
Status: open

F3 — The link row's icon controls shrank to 22px
Severity: Low      Category: Approved behaviour, mobile adaptation (inline-control)      CWE: —
Location: `src/components/admin/AdminFooterManager.tsx:72,79,83,93`
Description: the drag handle, "up", "down" (`ActionIcon size="sm"`) and the delete control measure 22×22px at every width (Storybook 320 and 1440, dev server 1914). On `main` the row's eye and delete controls were 32×32 (`h-8 w-8`). The kickoff's mobile record names the `inline-control` pattern and `w3c-target-size`; the pattern requires the project's mobile target token (`theme.other.touchTarget`, 44px, `theme.ts:737`), which the canonical `MantineDeleteIconButton` applies with `touch`.
Impact: four 22px targets side by side in a row on a phone; smaller than `main` on the desktop.
Reproduction: Story `patterns-mantine-adminfootermanager--default` at 320px: `[data-testid=footer-link-row] button` → 22×22 each.
Recommendation: Revision 1, item 3.
References: `.claude/rules/shared/mobile-adaptation-patterns.md:36`; A2; WCAG 2.2 2.5.8.
Status: open

F4 — The footer writes have no length or count bound
Severity: Low      Category: Input and output      CWE: CWE-770
Location: `src/modules/admin/actions/footer.ts:126-132,150-155,194-197,214-226`
Description: `saveFooterShared` accepts any number of social links and any length of `id`, `label` and `url`; `upsertFooterContent`, changed by this diff, the same for the navigation and information links and for its six text fields. `saveSettings` bounds each value at 5000 characters (`settingKeys.ts:33`); the footer actions bound nothing.
Impact: an administrator's (or a stolen admin session's) single request can store an unbounded row that every public page then reads and renders.
Reproduction: `saveFooterShared({ settings: {}, social_links: [ …10 000 valid links… ] })` as admin → `{}` (no check refuses it; read from the code).
Recommendation: Revision 1, item 4.
References: OWASP Input_Validation; secure-code-review.md §3 "lengths and ranges bounded".
Status: open

F5 — The report's test counts do not reproduce
Severity: Low      Category: Agent and tool output (supplier assertion)      CWE: —
Location: `docs/sessions/2026-11-27-task989-executor-report.md:130,133`
Description: the report gives `vitest related` "14 failures, all in section 4.1" and typecheck exit 2. Rerun: 17 failed (adds `adminOrphans.test.ts` 2, found by the graph, and `proxyFile.test.ts` `[SEC-T1-SRV-BUILT-PROXY]` 1, from the stale local `.next`), typecheck exit 1.
Impact: the reviewer cannot take the report's numbers as evidence.
Reproduction: V3 above.
Recommendation: Revision 1, item 5.
References: OWASP Verifying_Third_Party_Agent_Execution_Evidence.
Status: open

F6 — The `BrandLogo` Story says the logo is served without a transform
Severity: Low      Category: Facts (A3)      CWE: —
Location: `src/stories/mantine/primitives/AppImage.stories.tsx:139`
Description: the comment says "served as saved (no transform)"; `brand-logo` has `cloudinaryTransform: 'h_84,c_fit,f_auto,q_auto'` (`appImageConfig.ts:99`), and the dev server's header logo is `…/upload/h_84,c_fit,f_auto,q_auto/…`.
Impact: the Story misstates the variant for the next reader.
Reproduction: read the two lines; `/uk` header `img.src`.
Recommendation: Revision 1, item 6.
References: A3.
Status: open

## Revision 1 (for the implementer)

1. F1 — the six tests follow the kickoff; no assertion is removed (A9), each moves to the code that now holds it:
   - `siteLayout.test.tsx`: import `generateMetadata`; with `getSettings` mocked to answer nothing, the title is `Lero.al — Real estate marketplace in Albania`.
   - `pages-and-footer-validation.smoke.test.ts`: drop `social_links` from the `upsertFooterContent` payloads (`:167`, `:185`, `:472`, `:488`); the positive case asserts the upsert carries no `social_links`; the nine scheme cases (`javascript:`, `JaVaScRiPt:`, `java\tscript:`, `java\nscript:`, leading space, `data:`, `vbscript:`, `file:`) call `saveFooterShared` with that link and expect a refusal and no write.
   - `FooterView.security.test.tsx` `[SEC-S09-SRV-DENY]`: the same refusal through `saveFooterShared`.
   - `headerFooterContainers.test.tsx:236`: none enabled → no social link; the built-in links only when `getFooterContent` fails.
   - `userAdministration.security.test.ts`: `:249-250` save and expect only keys of `SETTINGS_FORM_KEYS`; `:256` the script case on `logo_url`, the 5000+ case on `site_name`; `:278` `site_name` of exactly 5000 characters.
   - `adminOrphans.test.ts`: read the keys from `SETTINGS_FORM_KEYS` and `FOOTER_SETTING_KEYS` of `@/modules/admin/lib/settingKeys` (21 keys); `TASK_930_KEYS` becomes empty, since every key now has a reader (AC1); the planted-input cases stay.
2. F2 — one tab icon: move `src/app/favicon.ico` to `public/favicon.ico` (served at the same `/favicon.ico`, which the proxy matcher already skips); both `generateMetadata` return `icons: { icon: <the accepted saved favicon> }`, else `icons: { icon: '/favicon.ico' }`. `layoutBrand.test.ts`: `icons` is always set, to the saved one or to `/favicon.ico`, never both.
3. F3 — the four icon controls of a link row (handle, up, down, delete) take `theme.other.touchTarget` below 640px (`mih`/`miw` responsive style props, `{ base: theme.other.touchTarget, sm: … }`; `MantineDeleteIconButton` with `touch` there, as `AdminPagesView.tsx:81-115`) and at least `main`'s 32px from 640px. A test in `AdminFooterManager.shared.test.tsx` checks the props; the report gives the measured sizes at 320 and 1440.
4. F4 — one helper in `src/modules/admin/lib/settingKeys.ts` used by both actions: at most 50 links per list; `id` ≤ 64, `label` ≤ 200, `url` ≤ 2048 characters; each text field of `upsertFooterContent` ≤ 5000 (`SETTING_MAX_LENGTH`). Over a bound → `validation`, nothing written. Tests in `staffActions.test.ts`: one case per bound for `saveFooterShared` and for `upsertFooterContent`, each at the bound (saved) and one over (refused).
5. F5 — the report quotes each command's last summary lines (`Test Files`, `Tests`, exit code) as printed.
6. F6 — `AppImage.stories.tsx:139`: "a Cloudinary logo is fitted into 84px of height (`h_84,c_fit`), its width kept".

Tests to run: the Route's tests, the six files of item 1, then V3's commands (`npm run typecheck`, ESLint on every changed code file, `vitest related` over every changed file, the §8.1 text search). Nothing else changes.

## Integration collection

Run on the owner's instruction (2026-11-27, translated: "run it yourself"), on the approved development project (D91), `SECURITY_TEST_PROJECT_REF` taken from `.env.local`, where it equals the configured project:
- `SECURITY_TEST_TARGET=development npx vitest related --run --reporter=verbose --config vitest.integration.config.ts <every changed file>` → 36 files reached (they include the four of the text search); the first run stopped at the guard, which reads the ref from the process environment only.
- `npm run test:security-integration -- --reporter=verbose <the 36 files>` → exit 1: 35 files passed, 195 tests passed, 1 failed: `src/__tests__/security/serverActionManifest.integration.test.ts` `[SEC-S28-INT-DENY]`, ".next is older than src/modules/listings/actions/applyListingTransition.ts: run npm run build again". The file is not in this diff; the local `.next` is from 2026-11-21 and A5 forbids the local build; CI builds before this job. Not a finding of this diff; V14 reads it.

## Stories for the owner (V9)

Check by hand, at 320, 640, 1024, 1440 in sq, en, uk, it (V5a measured them first; values above):
- `Mantine/Primitives/HeaderView` — Default, SigningOut, WithLogo (guest and signed in, the logo at 28px).
- `Mantine/Primitives/AppImage` — Default, BrandLogo, Placeholder.
- `Mantine/Primitives/FooterView` — Default, ContactsAndSocial (all on; text, sales e-mail and Instagram off; no contact).
- `Patterns/Mantine/AdminSettings` — Default, Empty (the SEO language tabs swipe at 320).
- `Patterns/Mantine/AdminFooterManager` — Default, Empty, NotInitialized, Forbidden (drag with mouse, finger and keyboard; Firefox too).

## Open for Opus and the owner

- Owner, 2026-11-27 (translated): "I allow" — the Scope of Revision 1 reaches files the kickoff did not name (item 1: six test files; item 2: `src/app/favicon.ico` → `public/favicon.ico`), while checklist D says a revision does not grow the Scope. Allowed for this revision.
- Owner, 2026-11-27 (translated): "run it yourself" — the integration collection (17 files reached by the graph, 4 by the text search) with `SECURITY_TEST_TARGET=development`; the result is in "Integration collection" below.
- Owner, 2026-11-27 (translated): "these were my instructions" — the decisions of the executor's report §3 (SEO language tabs, the Footer page layout, the translations of "Footer", link reordering, the `@dnd-kit` install) are the owner's decisions of 2026-11-27 (A2).
- Opus: after the merge, Task 930 (no reader for the settings keys) is removed by AC1; its backlog row is closed in H7. The production check of Route step 5 stays.
