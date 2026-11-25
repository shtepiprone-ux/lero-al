# Task 1037 — One SEO section in the admin, switchable for moderators in Permissions

Sprint 94. Priority P2. Owner request 2026-11-24 (translated): "a separate SEO section in the admin with all the SEO settings; the duplicates of
those settings are then removed; add the section to Permissions so the administrator can open or close it for moderators".
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner. Depends on Task 1036 (merged first: it adds the `seo` message namespace).

## Goal

SEO settings live inside Site settings as a tab, and half of them do nothing: `meta_title` and `meta_desc` are stored but no page reads them,
and they hold one language. After the task the admin has its own SEO page (`/admin/seo`), the single place for the site's title and
description in each of the four languages, the default social image and the noindex delay of sold and rented listings; Site settings no
longer carries them; Permissions has a switch for the page.

## Cause

Read at `f36b68bad`
- The SEO fields sit in a tab of Site settings (`src/components/admin/AdminSettings.tsx:14`, `:20`, `:206-231`) and are saved by `saveSettings` with the general settings (`src/modules/admin/actions/index.ts:288`, `:302-303`, guarded by `settings.manage`), so they cannot be given to a moderator apart from the rest.
- `meta_title` and `meta_desc` are never read by the site: `grep -rn "meta_title\|meta_desc" src` → only the settings page (`src/app/admin/settings/page.tsx:26-27`, `:53-54`), the save allowlist and a fixture; the site's description is a constant (`src/app/[locale]/layout.tsx:16-19`), and Task 1036 gives it one per language in `messages` (a second copy). Stored today (read 2026-11-24): `meta_title` 32 characters, `meta_desc` 44, `og_image` empty, `archived_noindex_days` set.
- `og_image` is read by the listing page (`src/app/[locale]/listings/[slug]/page.tsx:85`) and `archived_noindex_days` by `getArchivedNoindexDays` (`src/modules/admin/lib/settings.ts:32-35`).
- The admin pages a moderator can be given are the list `ADMIN_PAGES` (`src/lib/auth/adminPages.ts:11-27`); Permissions, the sidebar and every page and loader check read it (`src/components/admin/AdminPermissionsView.tsx:147`, `src/lib/auth/permissions.ts:51`).

Fix: a page key `page.seo` and the page `/admin/seo` with its own save action; per-language title and description settings that the site reads (the `messages` texts of Task 1036 stay as the default when a setting is empty); `og_image` and `archived_noindex_days` move there; the SEO tab and the dead `meta_title`/`meta_desc` leave Site settings.

## Scope

- `src/lib/auth/adminPages.ts`: `{ key: 'page.seo', labelKey: 'item_seo', paths: ['/admin/seo'] }` after `page.settings`.
- `src/app/admin/seo/page.tsx` (new): `requireStaffPage({ page: 'page.seo' })`, reads the SEO settings, renders `AdminSeoManager`.
- `src/components/admin/AdminSeoManager.tsx` (container, new) and `src/components/admin/AdminSeoView.tsx` (view, new): language tabs (sq, en, uk, it) with a title (`TextInput`, at most 120 characters) and a description (`Textarea`, at most 320), then the social image URL and the noindex days; one Save; built only from the canonical admin patterns the Footer page uses (Task 989).
- `src/modules/admin/actions/seo.ts` (new): `saveSeoSettings(entries)` — `assertPermission('page.seo')`; allowlist `seo_site_title_<locale>`, `seo_site_description_<locale>` (the four locales), `og_image` (empty or a link `resolveLinkTarget` accepts), `archived_noindex_days` (a whole number 1-3650); lengths as above; upsert into `site_settings`; errors as codes only.
- `src/app/[locale]/layout.tsx` and `src/app/[locale]/page.tsx` `generateMetadata` (from Task 1036): the title and description read `seo_site_title_<locale>` / `seo_site_description_<locale>` first, the `messages` text when the setting is empty or the read fails.
- Site settings: the `seo` tab and its fields leave `AdminSettings.tsx` and `src/app/admin/settings/page.tsx`; `meta_title`, `meta_desc`, `og_image`, `archived_noindex_days` leave `SETTING_KEYS` of `saveSettings`.
- `src/components/admin/AdminSidebar.tsx`: the item SEO in the System group, after Site settings.
- `supabase/sql_migrations/task1037/` (owner-applied, with preflight, rollback and verify): `seo_site_title_sq` and `seo_site_description_sq` take today's `meta_title` and `meta_desc` values when those are set; the rows `meta_title` and `meta_desc` are deleted.
- `messages/{sq,en,uk,it}.json`: `admin.sidebar.item_seo` and the page's labels, hints and errors (namespace `admin.seo`).
- `src/stories/patterns/mantine/AdminSeoView.stories.tsx` (new): Default, Filled, Saving, Error; the Site settings Story loses its SEO tab.
- Dependencies: Task 1036 merged.
- Out of scope: the listing title and description templates (`messages`, Task 1036, system texts); CMS page titles; robots and the sitemap.
- Kept as on `main` (checklist A2): every other Site settings tab and field and their save; `og_image` and `archived_noindex_days` keep their keys, values and readers; a moderator sees the SEO page only when the administrator switches it on.

## Attack surface

Changed: a new staff page and Server Action.
1. **What are we working on?** `/admin/seo` and `saveSeoSettings` (staff with `page.seo`; an administrator always).
2. **What can go wrong?** T1 E: a moderator without the switch, or any caller, writes the site's SEO settings through the action → mitigate: `assertPermission('page.seo')` in the action and `requireStaffPage` on the page → AC2, AC1. T2 T: a value outside the allowlist or an unsafe social-image link is stored → mitigate: key allowlist, lengths, `resolveLinkTarget`, whole-number range → AC2.
3. Authorization matrix: `SEC-1037-SEO-ALLOW` (administrator; moderator with `page.seo`), `SEC-1037-SEO-DENY` (moderator without it; no session).

## OWASP

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new page and action — AC1, AC2.
- Authentication: not applicable — sign-in and credentials are untouched; the page uses the existing staff session.
- Authentication_Patterns: not applicable — no authentication mechanism is added or changed.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the page and the action each check `page.seo` themselves — AC1, AC2.
- Authorization_Decisions_And_Output_Handling: not applicable — the decision is the existing page-key check of Task 1007.
- Authorization_Patterns: not applicable — the page follows the existing page-key pattern without change.
- Authorization_Regression_Testing: not applicable — AC1 and AC2 carry the new rows; no existing rule changes.
- Authorization_Testing_Automation: not applicable — the rows run in unit tests; no new database grant.
- Cookie_Theft_Mitigation: not applicable — no cookie is set or read by the task.
- Credential_Stuffing_Prevention: not applicable — the sign-in path is not touched.
- Cross_Site_Scripting_Prevention: not applicable — the values are rendered as text and through Next metadata.
- DOM_Clobbering_Prevention: not applicable — no raw HTML is rendered from the settings.
- DOM_based_XSS_Prevention: not applicable — no DOM sink; form fields only.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the action writes with the service role after the page-key check; no grant changes — AC2.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — key allowlist, lengths, link check and number range in the action — AC2.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the settings are site-wide rows by fixed keys.
- JavaScript_and_TypeScript_Security: not applicable — no merge or regular expression over input.
- Mass_Assignment: not applicable — the action writes only allowlisted keys (AC2 covers it).
- Multi_Tenant_Security: not applicable — the site has one tenant for these settings.
- Multifactor_Authentication: not applicable — the factors of sign-in are unchanged.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `saveSeoSettings` checks the key and validates by itself, tested by direct call — AC2.
- Prototype_Pollution_Prevention: not applicable — entries are checked against a fixed allowlist.
- Query_Parameterization: not applicable — writes go through the Supabase client upsert.
- React_Security: not applicable — standard controlled inputs; no raw HTML or spread props.
- SQL_Injection_Prevention: not applicable — the SQL file has fixed statements, no input.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this diff — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1 and T2 are AC1 and AC2 — AC1, AC2.
- Session_Management: not applicable — no session is created or changed by the task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Web_Frontend_Security: not applicable — no HTML sink or script is added.
- XSS_Filter_Evasion: not applicable — no filter is written; values render as text.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the dead settings were found by search and by the stored rows, not assumed — AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests, breaks and the Story measurement — AC1-AC6.

## UI

GR-0 queries: "settings form with language tabs", "admin page frame". Inspected: the Footer page of Task 989 (shared block and language tabs),
`MantineFormSectionStack`, `AdminPageFrame`, `AdminPageHeader`, `Mantine/Primitives/Tabs`, `TextInput`, `Textarea`. Decision: REUSE them; the SEO
page composes only these, in the Footer page's order (header → language tabs → fields → shared fields → Save). Reference research (GR-7):
inherited canonical design — owner decision 2026-10-20 (`MantineFormSectionStack`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminSeoView.tsx — the SEO page; src/components/admin/AdminSettings.tsx — Site settings without the SEO tab
- Component families: form-picker-and-choice
- Pattern IDs: form-stack
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): one column at full width, the language tabs scroll; 640px transition: the same column at the page's content width
- Mobile order: header → language tabs → title → description → social image → noindex days → Save
- Required-content treatment: labels and hints wrap; values are never truncated in the fields
- Story and verification: AdminSeoView (Default, Filled, Saving, Error) at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 The page key opens and closes the page — test: `src/lib/auth/__tests__/staffPage.security.test.ts` (extended): `/admin/seo` answers an administrator and a moderator with `page.seo`, and `notFound` to a moderator without it (`SEC-1037-SEO-ALLOW`/`-DENY`); `src/lib/auth/__tests__/adminPages.test.ts` (extended): `page.seo` is in `ADMIN_PAGES` and in the page census.
- AC2 The action writes only what it should — test: `src/modules/admin/actions/__tests__/seo.security.test.ts` (new): no session and a moderator without `page.seo` → refused before any write; an unknown key, a 121-character title, a 321-character description, a `javascript:` image link, `0` and `3651` days → `validation`; a valid set → one upsert with exactly those keys.
- AC3 Site settings no longer carries SEO — test: `src/components/admin/__tests__/AdminSettings.seo.test.tsx` (new): no SEO tab in Site settings; `src/modules/admin/actions/__tests__/adminCatalog.security.test.ts` (extended): `saveSettings` refuses `meta_title`, `meta_desc`, `og_image`, `archived_noindex_days` with `validation`.
- AC4 The site reads the setting, with the message as default — test: `src/app/[locale]/__tests__/localeMetadata.test.ts` (extended, Task 1036's file): a stored `seo_site_title_en` is the `en` title; an empty or failed read gives the `messages` text.
- AC5 The data move is applied and the duplicates are gone — test: `src/tests/integration/seoSettings.integration.test.ts` (new, CI `authz` job, after the owner applies `task1037.sql`): no `site_settings` row `meta_title` or `meta_desc` remains; `anon` and `authenticated` cannot write `site_settings` (42501). Opus proves the SQL's preflight and rollback (checklist H4).
- AC6 Texts and Stories hold — test: the CI i18n parity and Storybook jobs (`gh pr checks <n>`); the executor measures `AdminSeoView` at the widths and locales of the mobile record (I8a); `npm run typecheck` (I8).
- AC7 The CI jobs pass — test: `gh pr checks <n>` after every check has concluded.

## Route

1. Work on the branch the owner created from `main` after Task 1036's merge (checklist H1).
2. Tests first (AC1-AC4); save each failing output.
3. The page key, page, view, action, layout read, Site settings removal, SQL, messages, Stories.
4. Run: `npm run typecheck`, then `npm test -- src/lib/auth/__tests__/staffPage.security.test.ts src/lib/auth/__tests__/adminPages.test.ts src/modules/admin/actions/__tests__/seo.security.test.ts src/components/admin/__tests__/AdminSettings.seo.test.tsx src/modules/admin/actions/__tests__/adminCatalog.security.test.ts "src/app/[locale]/__tests__/localeMetadata.test.ts" src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx`; the I8a measurement on the Storybook dev server. Deliberate breaks: drop `assertPermission` → AC2 fails; put `meta_title` back in `SETTING_KEYS` → AC3 fails; ignore the setting in the layout → AC4 fails; each restored.
5. Report: each command, exit code, relevant output, each break and its result, the measurements; the SQL is for Opus (H4).

## Review
