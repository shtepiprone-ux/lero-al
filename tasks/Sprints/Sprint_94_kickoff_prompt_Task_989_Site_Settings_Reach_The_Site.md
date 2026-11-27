# Task 989 — The logo and the favicon reach the site, and every footer setting lives on the admin "Footer" page, each with a show switch

Sprint 94. Priority P1. Owner decisions: owner list item 19 (2026-11-19, translated): "the admin site settings (logo,
favicon) are not applied"; the brand files are in the Cloudinary folder `Lero` (2026-11-18, recorded in Task 957);
O989-1 (2026-11-19, translated): "I choose this option [keep the setting and apply it]. … Contact phone, contact e-mails
(support, sales), social networks, footer text must be configured in the admin … There must also be a switch that turns
off the display of this or that element in the footer. For example, if the admin turns off 'Contact phone', it stops
being displayed on the site in the footer." O989-3 (2026-11-19, translated): "I noticed duplicated footer settings in
the admin. There is a separate Footer page, and there is Site settings - Footer. All the settings must be merged into the
Footer page in the admin, and Site settings - Footer removed." (The "Contacts" page part of O989-1 is Task 1006.)
O989-2 (2026-11-19, translated): "I agree" [remove the dark logo, the site has no dark theme]. Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer:
Opus. Human owner of the change: the owner.

## Goal

After the task: the header shows the saved logo and the tab the saved favicon, both only from the account's Cloudinary;
the admin "Footer" page is the one place for everything the footer shows — brand, text, links, phone, support and sales
e-mails, social links — each element with a show switch, and the footer shows exactly that; "Site settings" has no
footer tab and no field that repeats the Footer page; no setting the admin saves is ignored by the site.

## Cause

Read at `8896ef0d7`
- Two editors for the footer: the settings Footer tab saves social links and two "footer text" fields (`src/components/admin/AdminSettings.tsx:19`), and the General tab a tagline, an e-mail and a phone (`:17`); the Footer page saves per language a brand title, a tagline and social links (`src/components/admin/AdminFooterManager.tsx:170-175`, `:207-218`). The site reads only the Footer page's tagline and social links (`src/components/layout/Footer.tsx:25`, `:38`) and none of the settings fields (`grep -rln "contact_phone\|social_facebook\|about_al" src --include=*.tsx --include=*.ts` → the settings page, the form, the action file, tests, one Story fixture).
- Production, read-only 2026-11-27: all four footer rows link to the account's Facebook and Instagram pages (`www.facebook.com/…`, `www.instagram.com/…`, both on); the settings hold the same two addresses, `social_linkedin` is empty; `about_al` and `about_uk` hold the support and sales addresses (no sales field exists); the General tagline equals the `sq` footer text; `contact_phone` is empty; `logo_url`, `logo_dark_url` and `favicon_url` hold `res.cloudinary.com` addresses that nothing renders.
- The Footer page's brand title is never read: the footer brand is `site_name` (`src/components/layout/Footer.tsx:15`, `:20-22`). `contact_email` and `contact_phone` take any text (`validSettingValue`, `src/modules/admin/actions/index.ts:291-297`).
- The header draws a fixed wordmark (`src/components/layout/HeaderView.tsx:112-117`); the favicon is the fixed `src/app/favicon.ico`; title and description are fixed in `src/app/[locale]/(site)/layout.tsx:14-17` (Task 988 moved the site frame there; the admin's title is `src/app/[locale]/admin/layout.tsx:10`) while `meta_title` and `meta_desc` are saved and unread; the theme is light only (`src/design-system/mantine/MantineRootProvider.tsx:20-22`).
- The image check the site has does not mean "the account's Cloudinary" any more: `isTrustedImageUrl` (`src/lib/uploads/imageUrl.ts:49-60`) also accepts a listing photo on the media host `media.lero.al` (`:51`, Task 1038).
- Both forms are built from the legacy `@/components/ui` kit (`src/components/admin/AdminSettings.tsx:6-8`, `src/components/admin/AdminFooterManager.tsx:7-10`).

Fix: one Footer page with a shared block (contacts, social links, switches) and language tabs; the footer reads only it; the settings lose the footer fields and apply logo, favicon, title and description; validators per key; both forms on Mantine; a test fails for any saved key nothing reads.

## Scope

- `src/modules/admin/lib/settingKeys.ts` (new; the lists leave the `'use server'` file): the keys of the settings form and of the Footer page, each with its validator. E-mail: one address, no spaces, no `?`, `&`, `,`, `;` or line break, at most 254 characters; phone: `+`, digits, spaces, `(`, `)`, `-`, 6 to 20 characters; switch: `'true'` or `'false'`; addresses as today (`resolveLinkTarget`).
- Footer page (`/admin/footer`; `AdminFooterManager.tsx` on Mantine, no `@/components/ui`): a shared block above the language tabs — phone, support e-mail (`contact_email`, its value kept), sales e-mail (`contact_email_sales`, new), each with a `Switch` (`footer_show_phone`, `footer_show_email_support`, `footer_show_email_sales`; absent = on); the social links as one list for all languages, each link with its switch (the existing `enabled`), first shown from the `sq` row; a `Switch` `footer_show_text`. Language tabs: brand title, footer text, section titles, navigation and information links, copyright.
- `src/modules/admin/actions/footer.ts`: `saveFooterShared` (new): the same admin check as `upsertFooterContent`, before any read; the validators; writes the contact keys and switches to `site_settings` and the social list to all four `site_footer` rows; revalidates the layout. `upsertFooterContent` no longer takes social links.
- The footer (`Footer.tsx` → `FooterView.tsx`): the brand title of the page's language (`site_name` when empty); the footer text when filled and on; a contacts column (phone as `tel:`, e-mails as `mailto:`, encoded) and the social links, each only when filled and on.
- Both forms leave legacy whole (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`): `AdminInput` gives way to `TextInput` and the shared `Combobox` to `MantineSelect`; `AdminFooterManager.tsx` and `AdminSettings.tsx` join `scripts/mantine-migration-scope.json` with their Stories. Both pages already render inside `AdminPageFrame` (`src/app/[locale]/admin/footer/page.tsx:25`, `src/app/[locale]/admin/settings/page.tsx:67`) and stay so.
- Settings (`AdminSettings.tsx` on Mantine): the Footer tab leaves; the General tab keeps `site_name` (its tagline, e-mail and phone are on the Footer page); SEO: `meta_title_<locale>` and `meta_desc_<locale>` for the four languages become the site's default title and description (`src/app/[locale]/(site)/layout.tsx`: its `metadata` becomes `generateMetadata`; empty → today's text). `tagline`, `logo_dark_url`, `social_facebook`, `social_instagram`, `social_linkedin`, `about_al`, `about_uk`, `meta_title`, `meta_desc` leave the key lists; `saveSettings` refuses them; their rows stay unread (no SQL).
- Logo and favicon: `getSettings(keys)` in `src/modules/admin/lib/settings.ts` (one query); `isBrandImageUrl` (new, `src/lib/uploads/imageUrl.ts`): the Cloudinary branch of `isTrustedImageUrl` alone (https, `res.cloudinary.com`, the project's cloud; the media host refused), which `isTrustedImageUrl` then calls, its answers unchanged; `src/app/[locale]/(site)/layout.tsx` passes `logoUrl` to `<Header />` (`:28`, a client component that hands it to `HeaderView`) and `icons` to the metadata only when `isBrandImageUrl` accepts them, else the wordmark and `src/app/favicon.ico`; `src/app/[locale]/admin/layout.tsx` the same favicon; `HeaderView` `logoUrl` → `AppImage variant="brand-logo"` (EXTEND `src/design-system/media/appImageConfig.ts`, `AppImage.module.css`; height token `theme.other.boxSize.siteLogo` = the wordmark line height `lineHeight.siteWordmark`, `src/design-system/mantine/theme.ts:825`; natural width, `contain`), `alt` the site name.
- `logo_dark_url` leaves the Brand tab (O989-2: the site has no dark surface).
- `src/modules/admin/actions/__tests__/settingsReach.test.ts` (new): every key of both lists has a reader outside the admin pages, the forms, the action files and tests.
- Stories: `HeaderView` `WithLogo`, `AppImage` `BrandLogo`, `FooterView` `ContactsAndSocial` (all on; some off; empty values). Dependencies: none. Task 990 changes the same editor's refused-link message (`footer.ts`, its toast): whichever merges second keeps the other's change and its test.

## Attack surface

Changed: staff-saved values are output on every public page; a new admin action.
1. **What are we working on?** Settings and footer rows written by staff (`saveSettings` with `settings.manage`, the
   Footer page actions with the admin check), read with the service role, rendered to every visitor as an image `src`, an
   icon link, `tel:`, `mailto:`, outside links and text.
2. **What can go wrong?**
   - T1 I/T: a logo or favicon on another host tracks visitors or swaps the brand → mitigate: rendered only when `isBrandImageUrl` accepts it → AC2, `SEC-989-BRAND-URL-DENY`.
   - T2 T: an e-mail with `?cc=` or a line break, a phone with a scheme, a social link `javascript:` → mitigate: refused on save and checked again before output → AC3, AC4, `SEC-989-FOOTER-LINK-DENY`.
   - T3 E: anyone calls `saveFooterShared` → mitigate: the admin check before any read or write → AC4, `SEC-989-FOOTER-SAVE-DENY`.
   - T4 D: a failed read breaks every page → mitigate: the wordmark, the fixed favicon, a footer without the failed elements → AC2, AC3.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: `SEC-989-FOOTER-SAVE-DENY` — `saveFooterShared` as anonymous, user, agent and moderator → refused, nothing written; as admin → saved.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19, revised with O989-1 and O989-3; rerun 2026-11-27 on `8896ef0d7`).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — a forged call of the new footer action and hostile stored values are the abuse cases of the threat model — AC3, AC4.
- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new action and every value now output to visitors — AC2, AC3, AC4.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — `saveFooterShared` checks the admin before any read; `saveSettings` keeps `settings.manage` — AC4.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed admin check refuses and writes nothing — AC4.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the check runs inside the action, not in the page — AC4.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-989-FOOTER-SAVE-DENY` fails if the check is removed — AC4.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix row runs for anonymous, user, agent, moderator and admin — AC4.
- Bot_Management_and_Anti-Automation: not applicable — both writes are staff-only actions; no anonymous form is added.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path is touched by this task.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — each value is checked on save and again before output, and React writes it as text or an attribute — AC2, AC3.
- Database_Security: not applicable — "migration" names the Mantine UI migration; no schema, grant or SQL file changes.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the values reach only `src`, `href` and text — AC2, AC3.
- Denial_of_Service: "Using validation that is cheap in resources first" — one read of the named keys per request; a failed read drops the elements without retry — AC2, AC3.
- File_Upload: not applicable — nothing is uploaded; the owner pastes the address of a file already in Cloudinary.
- GraphQL: not applicable — the project has no GraphQL endpoint; "migration" names the Mantine UI migration.
- HTTP_Strict_Transport_Security: not applicable — no response header changes; the site's HSTS header (`src/lib/security/headers.ts`) stays as on `main`.
- Identity_Propagation_Patterns: not applicable — the service-role read of public settings carries no identity, as today.
- Injection_Prevention: not applicable — the migration manifest is a JSON list of paths; no interpreter receives input.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — one invalid value refuses the whole save, nothing written — AC4.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the action writes the fixed four language rows; no row is chosen by a client identifier.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the e-mail and phone checks are single character classes with bounded length — AC4.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — both writes keep allow-lists of keys, and AC1 fails for a listed key nothing reads — AC1, AC4.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: not applicable — "migration" names the Mantine UI migration; no tenant data path changes.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `saveFooterShared` is tested by direct call without a session and with forged values — AC4.
- OS_Command_Injection_Defense: not applicable — editing the migration manifest starts no operating system process at all.
- Prototype_Pollution_Prevention: not applicable — the actions read named fields; no object is merged from client keys.
- Query_Parameterization: not applicable — "migration" names the Mantine UI migration; no query text is built here.
- React_Security: "Where possible, render untrusted content as text using JSX expressions." — each value is checked on save and again before output, and React writes it as text or an attribute — AC2, AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC2-AC4.
- SQL_Injection_Prevention: not applicable — "migration" names the Mantine UI migration; no SQL is written or built.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC2, AC3, AC4.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — the logo and the favicon load only over https: `isBrandImageUrl` refuses `http://res.cloudinary.com/…` — AC2.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — every visitor's browser fetches the logo, so only the account's own Cloudinary is allowed — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate breaks included — AC7.
- Web_Cache_Security: not applicable — the layout revalidation refreshes public content only; no per-user data enters a cached page.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the logo is an `<img>` through `AppImage` and the footer values are text and attributes, no HTML — AC2, AC3.

## UI

GR-0 queries: "brand logo in the header", "settings form with switches", "footer contacts". Inspected: `HeaderView`,
`AppImage`, `FooterView` and their Stories, `Mantine/Primitives/Switch`, `MantineFormSectionStack`, `MantineDetailList`.
Decision: EXTEND `AppImage` (`brand-logo`) and `FooterView` (contacts column, switches); REUSE `Switch`,
`MantineFormSectionStack`, Mantine `Tabs`, `TextInput`, `Textarea`. Reference research (GR-7): inherited canonical
design — owner decision 2026-10-20 (`HeaderView`, `FooterView`, `Mantine/Primitives/Switch`, `MantineFormSectionStack`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/layout/HeaderView.tsx — logo or wordmark; src/components/layout/FooterView.tsx — brand, text, contacts and social links; src/components/admin/AdminFooterManager.tsx and AdminSettings.tsx — the two forms
- Component families: navigation-and-pagination, form-picker-and-choice, record-list-and-data
- Pattern IDs: inline-control, form-stack, linear-flow
- Standards: w3c-target-size, apple-hig-menus, android-layout-navigation, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-meaningful-sequence, android-adapt-layouts, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineNavigationMenu.tsx, src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineDetailList.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): footer columns stack, each contact on its own line; each form field full width with its switch on the label row; 640px transition as `FooterView` today
- Mobile order: footer — brand → text → navigation → information → contacts → copyright → social; form — shared block → language tabs; field label → switch → input → hint
- Required-content treatment: addresses and phone wrap at any character, never truncated; footer text wraps
- Story and verification: the four Stories at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 Every saved setting reaches the site — test: `src/modules/admin/actions/__tests__/settingsReach.test.ts` (new): fails for a key of either list that no file outside the admin pages, the forms and the action files reads.
- AC2 Logo and favicon follow the setting, only from the account's Cloudinary — test: `src/components/layout/__tests__/HeaderView.logo.test.tsx` (new) and `src/app/[locale]/__tests__/layoutBrand.test.ts` (new: also the title and description of each language, today's text when empty); `SEC-989-BRAND-URL-DENY`: `http://res.cloudinary.com/…`, another cloud, a listing photo `https://media.lero.al/<owner>/listings/<uuid>/full.webp`, `https://evil.com/x.png`, `javascript:…` and a failed read → no logo, no `icons`; `src/lib/uploads/__tests__/imageUrl.security.test.ts` passes unchanged (every answer of `isTrustedImageUrl` kept).
- AC3 The footer follows the Footer page — test: `src/components/layout/__tests__/Footer.settings.test.tsx` (new): brand title, text, each contact and each social link shown when filled and on, hidden when off or empty; `SEC-989-FOOTER-LINK-DENY`: a stored `javascript:` social link, an e-mail with `?cc=` and a phone with letters are not rendered as links.
- AC4 The writes refuse bad values, removed keys and non-admins — test: `src/__tests__/security/staffActions.test.ts` (extended): `saveSettings` refuses each removed key; `saveFooterShared` refuses each invalid e-mail, phone, switch and link, and `SEC-989-FOOTER-SAVE-DENY`; a valid admin save writes the social list to all four rows.
- AC5 One editor for the footer, on Mantine — test: `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx` (new: the shared block with its switches above the language tabs; saving sends its fields) and `src/components/admin/__tests__/adminFormsKit.test.ts` (new: neither form imports `@/components/ui` or renders `AdminInput` or `Combobox`; the settings form offers no key of the Footer page), and `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass with both forms enrolled in `scripts/mantine-migration-scope.json` and no baseline entry for them.
- AC6 Stories, widths and languages hold — test: `node scripts/check-i18n-parity.mjs`, `node scripts/check-mobile-adaptation-contract.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the four Stories.
- AC7 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read the settings action, page, form and read helper, the footer container, view, editor and action, both layouts, `HeaderView`, `AppImage`.
2. Tests first (AC1-AC5); save each failing output.
3. Key lists and validators, the Footer page and its action, the footer render, the settings form, logo, favicon, title and description, Stories. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); one deliberate break of each `SEC-989` check, restored.
5. Report: each command, exit code, relevant output. After the merge the owner fills on the Footer page the sales e-mail and the phone, and in the settings the titles and descriptions of the four languages (the logo and the favicon are already saved, read 2026-11-27); Opus checks the header, the tab icon and the footer in four languages on production.

## Revision 1 (Review 1, 2026-11-27)

The items are written in full in [Task_989_Review_1.md](../../docs/reviews/Task_989_Review_1.md), "Revision 1"; items 1 and 2 reach files the Scope did not name: allowed by the owner on 2026-11-27 (translated): "I allow". The owner's instructions of 2026-11-27 recorded in the executor's report §3 (SEO language tabs, the Footer page layout, the translations of "Footer", link reordering with `@dnd-kit`) are owner decisions (owner, 2026-11-27, translated: "these were my instructions").

- F1: the six existing tests (`siteLayout.test.tsx`, `pages-and-footer-validation.smoke.test.ts`, `FooterView.security.test.tsx`, `headerFooterContainers.test.tsx`, `userAdministration.security.test.ts`, `adminOrphans.test.ts`) follow the kickoff; each security assertion moves to `saveFooterShared` or to a key the settings form still holds; none is removed.
- F2: one tab icon: `src/app/favicon.ico` → `public/favicon.ico`; both layouts set `icons` to the accepted saved favicon or `/favicon.ico`; `layoutBrand.test.ts` asserts exactly one.
- F3: the link row's handle, up, down and delete take `theme.other.touchTarget` below 640px and at least 32px from 640px; a test checks the props.
- F4: both footer actions: at most 50 links per list, `id` ≤ 64, `label` ≤ 200, `url` ≤ 2048, each text field ≤ 5000 characters; over a bound → `validation`, nothing written; tests at and over each bound.
- F5: the report quotes each command's summary lines and exit code as printed.
- F6: `AppImage.stories.tsx:139` states the `h_84,c_fit` fit of a Cloudinary logo.

## Revision 2 (Review 2, 2026-11-27)

The items are written in full in [Task_989_Review_2.md](../../docs/reviews/Task_989_Review_2.md), "Revision 2"; F1-F6 are fixed.

- F7: the Footer page form carries the bounds of the actions from `settingKeys.ts` (`maxLength` on the link label, the link address and the six text fields; "add link" disabled at 50 links); a language-tab save refused with `validation` shows `error_save`, the shared save keeps the contacts message; tests in `AdminFooterManager.shared.test.tsx`.
- The report quotes each command's summary lines and exit code and names the shell.

## Revision 3 (Review 4, 2026-11-27)

The items are written in full in [Task_989_Review_4.md](../../docs/reviews/Task_989_Review_4.md), "Revision 3": the CI of pull request #85 (run 46011294336) failed on gates not run locally (A5).

- F8: `scripts/ui-contract-registry.json` entries for `AdminFooterManager.tsx` and `AdminSettings.tsx`.
- F9, F11: the Story list of the Scope ("Stories:") changes — `AppImage` `BrandLogo` leaves (the `brand-logo` variant's height belongs to its one consumer, `HeaderView`); `HeaderView` `WithLogo` (guest) and `WithLogoSignedIn` replace the captioned `WithLogo`.
- F10: `MantineBadge` for the default-language mark in `AdminSettings.tsx`.
- F12: the surface-census baseline drops the 12 paid-off rows; tests run `getSettings` and the two admin pages.

## Revision 4 (Review 5, 2026-11-27)

The item is written in full in [Task_989_Review_5.md](../../docs/reviews/Task_989_Review_5.md), "Revision 4"; F8-F12 are fixed.

- F13: each `LinkGroupEditor` gives its `DndContext` a stable `id` from React's `useId`, so the drag handles' `aria-describedby` is the same in the server HTML and after hydration (owner's dev-server log, 2026-11-27); a server-render-then-hydrate test.

## Review

- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_989_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_989_Review_2.md)
- [Review 3 — APPROVED](../../docs/reviews/Task_989_Review_3.md)
- [Review 4 — NEEDS REVISION (CI of PR #85)](../../docs/reviews/Task_989_Review_4.md)
- [Review 5 — NEEDS REVISION](../../docs/reviews/Task_989_Review_5.md)
- [Review 6 — APPROVED](../../docs/reviews/Task_989_Review_6.md)
