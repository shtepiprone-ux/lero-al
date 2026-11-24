# Task 1007 — A moderator opens only the admin pages the administrator switched on, set in a "Admin panel pages" section of "Permissions"

Sprint 93. Priority P1. Owner decision O-P01 (2026-11-19, translated): "On the 'Permissions' page a setting must be
added: the list of pages with a switcher that turns the moderator's access to the page on or off (a separate section
'Admin panel pages')." Owner decision O1007-1 (2026-11-24, translated: "administrator only"): Footer and
Permissions are administrator-only pages: a moderator gets 404 and neither item in the sidebar (on `main` a moderator
sees both items, opens Footer and gets its loader's refusal, `src/app/admin/footer/page.tsx:12`,
`src/modules/admin/actions/footer.ts:16`, and gets 404 on Permissions). Filed from Task 959 (O-P01 was its open question) and carries audit finding P-01
(`docs/security/audit-2026-11-06/findings.md`). Implementer: Sonnet. Reviewer: Opus (also the SQL round trip). The
owner applies the SQL before the merge. Human owner of the change: the owner.

## Goal

After the task: "Permissions" has a section "Admin panel pages" with one switch per admin page a moderator can be given;
a moderator opens, sees in the sidebar and reads through the page's server functions only the pages switched on; an
administrator keeps every page; the administrator-only pages (Permissions, Footer, and the Contacts page of Task 1006)
are administrator-only (O1007-1) and are not in the list; the release keeps today's access until the administrator changes a
switch.

## Cause

Read at `1d625874c`; re-read at `7758acb29` (2026-11-24): every line cited here is unchanged.
- The page guard takes no key: `requireStaffPage()` admits every active moderator (`src/lib/auth/staff.ts:84`, `:94`); `grep -rl "requireStaffPage()" src/app/admin | wc -l` → `22`.
- The switches exist only for actions: `src/lib/auth/permissionKeys.ts:1-24` lists action keys, and the Permissions screen offers only those (`src/components/admin/AdminPermissionsManager.tsx:12`, `:46`; `src/modules/admin/actions/permissions.ts:153`).
- Every key check takes only an action key: `roleHasPermission`, `hasPermission`, `assertPermission` (`src/lib/auth/permissions.ts:8`, `:33`, `:41`), `checkStaff({ permission })` (`src/lib/auth/staff.ts:39`) and `resolveAdminActor` / `assertAdminAccess` (`src/modules/admin/actions/index.ts:33`, `:41`) are typed `PermissionKey`, and the Permissions screen holds `Record<PermissionKey, PermissionData>` (`src/modules/admin/actions/permissions.ts:41`, `src/components/admin/AdminPermissionsManager.tsx:15`, `src/components/admin/AdminPermissionsView.tsx:13`).
- The sidebar lists every item for every staff role (`src/components/admin/AdminSidebar.tsx:27`), Permissions included, which answers 404 to a moderator (`src/app/admin/permissions/page.tsx:16`).
- Two page loaders a browser can call read under a write key: `getAllCurrenciesAdmin` and `getAllPropertyTypesAdmin` check `catalog.manage` (`src/modules/admin/actions/currencies.ts:20`, `src/modules/admin/actions/propertyTypes.ts:14`); `searchUsersForPicker` checks `support.manage` (`src/modules/admin/actions/index.ts:826`); the Footer loader is administrator-only (`src/modules/admin/actions/footer.ts:16`).
- The store already fits: `role_permissions.permission_key` is text with no list check (`supabase/catalog.json`: only `role_permissions_role_check`), and a key with no row is off (`src/lib/auth/permissions.ts:26`).

Fix: page keys in the same store with their own section and switches; `requireStaffPage` requires a page key or "administrator only"; the sidebar, the landing page and the page loaders follow the same keys; SQL seeds today's access.

## Scope

- `src/lib/auth/adminPages.ts` (new): `ADMIN_PAGES` in sidebar order — `page.dashboard` (`/admin`), `page.listings` (`/admin/listings`, `/admin/listings/[id]/preview`), `page.users` (`/admin/users`, `/admin/users/[id]`, `/admin/users/new`), `page.support`, `page.inquiries_support` (also the `/admin/inquiries` redirect), `page.inquiries_sales`, `page.reports`, `page.locations`, `page.popular_locations`, `page.companies`, `page.pages` (also the `/admin/legal` redirect), `page.property_types`, `page.currency`, `page.email_templates`, `page.settings` — each with its sidebar label key and paths; `ADMIN_PAGE_KEYS`, `AdminPageKey`, and `AccessKey = PermissionKey | AdminPageKey` (a type import from `permissionKeys.ts`, which stays unchanged).
- `src/lib/auth/permissions.ts`: `roleHasPermission`, `hasPermission`, `assertPermission` (`:8`, `:33`, `:41`) take `AccessKey`; the bodies are unchanged.
- `src/lib/auth/staff.ts`: `checkStaff` takes `permission?: AccessKey` (`:39`). `requireStaffPage(access: { page: AdminPageKey } | { adminOnly: true })` (required argument): after the role check, a moderator without the page key, or for an administrator-only page, gets `notFound()`; the key is read at this call (`roleHasPermission`, never cached); a failed read is `notFound()`. Every page under `src/app/admin` passes its key; Permissions and Footer pass `adminOnly` (Task 1006's page too, whichever merges second).
- Legacy page frames leave with the guard change (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`): the pages that still wrap
  themselves in `<div className="p-6 lg:p-8 ...">` — `src/app/admin/companies/page.tsx:44`, `src/app/admin/email-templates/page.tsx:30`
  (unless Task 988 merged first), `src/app/admin/footer/page.tsx:18`, `src/app/admin/locations/page.tsx:37`,
  `src/app/admin/popular-locations/page.tsx:33`, `src/app/admin/property-types/page.tsx:24`, `src/app/admin/settings/page.tsx:60`
  (unless Task 989 did it) — render `AdminPageFrame` (`src/components/admin/AdminPageFrame.tsx:34-43`) as
  `src/app/admin/currency/page.tsx:20` does, each with the width it has on `main`: `max-w-5xl` → `width="page"`
  (`adminPageMaxWidth` 64rem, `src/design-system/mantine/theme.ts:879`: companies, email-templates, locations,
  popular-locations, property-types); `max-w-4xl` → `width="narrow"` (56rem, `theme.ts:881`: footer); `max-w-3xl` →
  `width="form"` (48rem, `theme.ts:880`: settings); the default gutter `responsive` (`xl` 24px, `2xl` 32px from `lg`
  1024px, `theme.ts:679`, `:684`, `:646`) equals `p-6 lg:p-8`; the default `centered` equals `mx-auto`. Two rendering
  pages take no frame and keep their layout (A2): `src/app/admin/page.tsx` renders `AdminDashboardView`, which owns its
  `MantineDashboardGrid` (`src/modules/admin/dashboard/components/AdminDashboardView.tsx:298`), and
  `src/app/admin/listings/[id]/preview/page.tsx:95` renders `ListingDetailView`, the public listing page.
- `src/app/admin/page.tsx`: a moderator without `page.dashboard` is redirected to the first page switched on in `ADMIN_PAGES` order; with none, the canonical empty state (`MantineEmptyLoadingErrorState`, `admin.pages_access.none`) and sign-out.
- `src/app/admin/layout.tsx` reads the moderator's page keys once and passes the allowed paths to `src/components/admin/AdminShell.tsx` (a new prop, handed to `AdminSidebar` at `:27`), and `src/components/admin/AdminSidebar.tsx` (`AdminSidebarProps` `:15`, the items `:27-66`) shows only those items (an administrator: every item; a failed read: none); Permissions and Footer are never shown to a moderator.
- Loaders: `src/modules/admin/actions/currencies.ts` `getAllCurrenciesAdmin` (`:41`) and `src/modules/admin/actions/propertyTypes.ts` `getAllPropertyTypesAdmin` (`:207`) check `checkStaff({ permission: 'page.currency' })` and `'page.property_types'` instead of `assertAdmin()` (the writes keep `assertAdmin()` with `catalog.manage`); `src/modules/admin/actions/index.ts`: `resolveAdminActor` and `assertAdminAccess` take `AccessKey` (`:33`, `:41`), and `searchUsersForPicker` calls `assertAdminAccess('page.support')` before `assertAdminAccess('support.manage')` (`:826`).
- Permissions: `src/modules/admin/actions/permissions.ts` `getModeratorPermissions` (`:41-60`, `:84-85`) and `setModeratorPermission` (`:145`, `:153`) read and switch `PERMISSION_KEYS` and `ADMIN_PAGE_KEYS` as `AccessKey` (an unknown key is still `validation`); `src/components/admin/AdminPermissionsManager.tsx` (`:15`, `:23`, `:25`, `:46`) and `src/components/admin/AdminPermissionsView.tsx` (`:13`, `:16-19`) take `Record<AccessKey, PermissionData>` and `AccessKey`, and the manager counts actions over `PERMISSION_KEYS` and pages over `ADMIN_PAGE_KEYS`, passed separately; `AdminPermissionsView` gains the section "Admin panel pages" (`MantineFormSection`, one `Switch` per page, its sidebar label, its path as the description); the audit log names a page key by its label; the count shows actions and pages separately.
- SQL `supabase/sql_migrations/task1007/` (`task1007-preflight.sql`, `task1007.sql`, `task1007-rollback.sql`): one row `('moderator', '<page key>', true)` per page key, `on conflict do nothing` (today every listed page is open to moderators); the rollback deletes the `page.%` rows; the preflight lists existing `page.%` rows and the moderator count.
- Messages in four locales (`admin.permissions.pages_section_title`, `pages_section_description`, `admin.pages_access.none`). Story `src/stories/patterns/mantine/AdminPermissionsView.stories.tsx` gains `WithPagesSection`; `src/stories/patterns/mantine/AdminSidebar.stories.tsx` gains `ModeratorPages` (a moderator's filtered items).
- `scripts/mantine-migration-scope.json`: the seven pages of the frame line enrolled, no baseline entry (checklist U2).
- Dependencies: none.
- Out of scope: the content, loaders and controls of every admin page; the action keys and their writes; Task 1006's
  Contacts page (it takes `adminOnly` in whichever task merges second); Tasks 988 and 989.
- Kept as on `main` (checklist A2):
  - `staff.ts`: a guest goes to sign-in with the admin locale and `session=lost`; a user or agent gets `notFound()`; an
    administrator opens every page (`src/lib/auth/staff.ts:84-96`); `checkStaff` decides as today for every action key.
  - `permissions.ts` (lib): an administrator holds every key; a moderator's key is read from `role_permissions` at each
    call; no row or a failed read is `false` (`src/lib/auth/permissions.ts:8-31`).
  - `index.ts`: `searchUsersForPicker`'s query and result shape; every other action keeps its key.
  - `AdminShell`: header, drawer, presence and freshness (`src/components/admin/AdminShell.tsx:12-33`).
  - every page under `src/app/admin`: its header, content, loaders and controls; only the guard argument changes, and
    on the seven pages of the frame line the wrapper, with the width and gutter named there.
  - `src/app/admin/page.tsx`: an administrator, and a moderator with `page.dashboard`, see the dashboard as today.
  - `AdminSidebar`: groups, order, labels, icons, active state, sign-out and the locale switcher
    (`src/components/admin/AdminSidebar.tsx:27-66`); an administrator sees every item; a moderator loses only the
    items switched off and Footer and Permissions (O1007-1).
  - the three loaders: their return shapes; the writes keep `catalog.manage` and `support.manage`.
  - `permissions.ts`, `AdminPermissionsView`: the administrator card, the action-key rows (label, change line, icon,
    `Switch`, `aria-label`), the audit log and its unavailable state (`src/components/admin/AdminPermissionsView.tsx:46-169`),
    the toasts of `AdminPermissionsManager.tsx:30-34`; the page stays administrator-only (`src/app/admin/permissions/page.tsx:16`).
  - access: the SQL seeds every listed page on for moderators, so no moderator loses a page at release.

## Attack surface

Changed: every admin page entry, three page loaders, the sidebar, the permissions write.
1. **What are we working on?** Pages under `src/app/admin` and their service-role reads; the loaders in `'use server'`
   files; `setModeratorPermission` (administrator only); `role_permissions` page rows.
2. **What can go wrong?**
   - T1 E/I: a moderator opens a switched-off page, or calls its loader directly → mitigate: the page key in the page guard before any read and in each loader → AC2, AC4, `SEC-1007-PAGE-DENY`.
   - T2 E: a moderator switches pages on → mitigate: `setModeratorPermission` stays administrator-only → AC3.
   - T3 E: a failed key read opens a page → mitigate: fail closed (`notFound`, no sidebar item) → AC2, AC5.
   - T4 E: a new admin page ships without a key → mitigate: the required argument and the page census → AC1.
   - T5 R: a switch change is untraced → mitigate: the existing `role_permission_events` row with the actor → AC3.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix, per page of `ADMIN_PAGES`: administrator → 200; moderator with the key → 200; moderator without it → 404; user, agent → 404; guest → sign-in. Administrator-only pages: moderator → 404.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19; re-run 2026-11-24).

- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names every page entry, the three loaders and the write — AC1, AC2, AC4.
- Authentication: not applicable — sign-in and sessions are unchanged; a guest is sent to sign-in as today.
- Authentication_Patterns: not applicable — no authentication scheme is added or changed by this task.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — each page and each loader checks its page key on every request — AC2, AC4.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed key read is `notFound()` and no sidebar item — AC2, AC5.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the key is checked in the page and in the loader, not only in the sidebar — AC2, AC4.
- Authorization_Policy_And_Data_Distribution: "Deny affected operations when a required attribute cannot be obtained reliably." — the key is read at each request, never cached, and an unreadable key denies — AC2.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the page census fails for a new page without a key — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — one matrix row per page key, and the switch on the real database — AC2, AC3.
- Cookie_Theft_Mitigation: not applicable — no cookie is added or changed by this task.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path is touched by this task.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — page labels and paths are message keys and constants rendered as React text — AC6.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — no grant changes; the rows go to the existing service-only table — AC7.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Injection_Prevention: not applicable — keys are compared against a fixed list; nothing is interpreted.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — an unknown key or a non-boolean value is `validation`, nothing written — AC3.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — the three administrative reads (currencies, property types, the user picker) check the page key at the call, not only the page — AC4.
- JavaScript_and_TypeScript_Security: not applicable — a constant list; no merge, path setter or new regular expression.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Logging: "User administration actions such as addition or deletion of users, changes to privileges, assigning users to tokens, adding or deleting tokens" — every switch change writes a `role_permission_events` row with the actor — AC3.
- Logging_Vocabulary: "All activity by privileged users such as admin should be recorded." — the same event row names the administrator and the page key — AC3.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the write accepts only the listed action and page keys — AC3.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: not applicable — one platform, no tenants; the keys are per role.
- Multifactor_Authentication: not applicable — staff MFA is Task 960; no factor changes here.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the loaders in `'use server'` files check the page key themselves — AC4.
- OAuth2: not applicable — no OAuth flow or return path is touched.
- OS_Command_Injection_Defense: not applicable — the scope file gains seven path strings; no OS command is called.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys; the list is a constant.
- Query_Parameterization: not applicable — the SQL inserts fixed rows; the code uses the client library's builders.
- Server_Side_Template_Injection_Prevention: not applicable — only the email-templates page frame changes; template rendering is untouched.
- SQL_Injection_Prevention: not applicable — the SQL is a fixed data change; no statement is built from input.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC9.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC9.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1-AC5.
- Session_Management: not applicable — no session is created or changed; the role comes from the existing viewer read.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1-AC5.
- Unvalidated_Redirects_and_Forwards: "Where possible, have the user provide short name, ID or token which is mapped server-side to a full target URL." — the landing redirect picks a path from the fixed page list; no address comes from input — AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate break included — AC9.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC6.

## UI

GR-0 queries: "permission switches", "sidebar items by role", "no access state". Inspected: `AdminPermissionsView` and
its Story, `MantineFormSection`, `Mantine/Primitives/Switch`, `AdminSidebar`, `MantineEmptyLoadingErrorState`. Decision:
EXTEND `AdminPermissionsView` (a second switch section like the first) and `AdminSidebar` (filtered items); REUSE the
rest. Reference research (GR-7): inherited canonical design — owner decision 2026-10-20 (`AdminPermissionsView`,
`Mantine/Primitives/Switch`, `MantineEmptyLoadingErrorState`).
- U2: the seven pages of the Scope frame line lose `className` and take `AdminPageFrame`; enrolled in `scripts/mantine-migration-scope.json` with no baseline entry.
- U3: no `style`, `styles`, `className` or literal in the changed pages, `AdminPermissionsView`, `AdminSidebar` or their Stories (AC10 for the pages).
- U4: a page row takes the tokens of an action row (`AdminPermissionsView.tsx:72-118`: `Group` `justify="space-between"`, `Divider` between rows, the icon and `Switch` group); compared Stories: `AdminPermissionsView.stories.tsx:76` `Default` and the new `WithPagesSection`.
- U6: `WithPagesSection` (some pages off, one saving) and `AdminSidebar` `ModeratorPages`; the no-pages state reuses `EmptyLoadingErrorState.stories.tsx`.
- U7: GR-8 not applicable — the section is a switch list, not a table of records; GR-3i met as today — the audit log actor (`AdminPermissionsView.tsx:143-168`); GR-3h — the new `MantineFormSection` sits in the same `Stack` as the others; GR-3e not applicable — no popup; GR-3c — the section title is `MantineFormSection`'s, as the two sections above it.
- U11: default built (`WithPagesSection`); loading not needed — server-rendered page, as today; empty not needed — the list is the constant `ADMIN_PAGES`; error built — the audit log's unavailable state as today, a failed key read denies (AC2); saving and disabled built — `savingKey` disables that switch; no permission built — 404 (AC2) and the no-pages state (AC5); a failed toggle built — the toasts of `AdminPermissionsManager.tsx:30-34`; longest locale and 320px — the mobile record.
- U12: each page `Switch` has a visible label and the `aria-label` of that label, as `AdminPermissionsView.tsx:113`; the icon colour repeats the switch state, never alone; colours `green` and `dimmed` from the theme as today; focus is Mantine's `Switch` ring, unchanged; a failed toggle names the error in a toast as today.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminPermissionsView.tsx — the "Admin panel pages" section; src/components/admin/AdminSidebar.tsx — the filtered items; src/app/admin/page.tsx — the no-pages state
- Component families: form-picker-and-choice, navigation-and-pagination
- Pattern IDs: form-stack, inline-control
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineNavigationMenu.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): each page row full width, label and path above, the switch at the row's end; 640px transition as the first section today
- Mobile order: action permissions → admin panel pages → audit log; each row label → path → switch
- Required-content treatment: labels and paths wrap, never truncated; each switch keeps the 44px target
- Story and verification: AdminPermissionsView `WithPagesSection` and AdminSidebar `ModeratorPages` at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 Every admin page names its access — test: `src/lib/auth/__tests__/adminPages.test.ts` (new): each `src/app/admin/**/page.tsx` calls `requireStaffPage` with a key of `ADMIN_PAGES` or `adminOnly`; every key's paths exist; the keys equal the sidebar items that are not administrator-only. The type check of the required argument runs in CI (AC9).
- AC2 The guard follows the switch — test: `src/lib/auth/__tests__/staffPage.security.test.ts` (extended): `SEC-1007-PAGE-DENY` for every key: a moderator without it → `notFound()` before any read; with it → the page; a failed read → `notFound()`; an administrator → the page; a moderator on an administrator-only page → `notFound()`; user and agent → `notFound()`; guest → sign-in. The census of `[SEC-X-SRV-ADMINPAGE-GUARD]` (`:122`, `:124`) now requires the first await to be `requireStaffPage(` with a key of `ADMIN_PAGES` or `adminOnly` (stricter, never loosened: A9).
- AC3 The switches are the administrator's — test: `src/tests/integration/moderatorKeys.integration.test.ts` (extended, CI `authz` job, real database): an administrator switches `page.users` off and on and each change writes an event with the actor; a moderator's call is refused and nothing changes; an unknown key is `validation`.
- AC4 The loaders follow the page keys — test: `src/__tests__/security/staffActions.test.ts` (extended): without its page key a moderator gets `[]` from `getAllCurrenciesAdmin` and `getAllPropertyTypesAdmin` and a refusal from `searchUsersForPicker`; with it, the data.
- AC5 The sidebar and the landing follow the keys — test: `src/components/admin/__tests__/AdminSidebar.pages.test.tsx` (new: a moderator sees only allowed items and never Permissions or Footer; an administrator sees all) and `src/app/admin/__tests__/dashboardLanding.test.tsx` (new: the redirect to the first allowed page; the empty state with none).
- AC6 The section works — test: `src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx` (extended): fifteen page switches with their labels; a toggle calls `setModeratorPermission` with the page key.
- AC7 The SQL holds — test: `node scripts/quality/db-sql-roundtrip.mjs` over the three `task1007` files exits 0; after the apply `node scripts/quality/db-catalog-audit.mjs --snapshot supabase/catalog.json` reports none of its invariants.
- AC8 Stories, widths and languages hold — test: the CI product checks (i18n parity, mobile adaptation contract) and Storybook jobs, read with `gh pr checks <n>` (checklist A5: never run locally); before the push the executor measures `WithPagesSection` and `ModeratorPages` on the Storybook dev server at the widths and locales of the mobile record (I8a).
- AC9 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).
- AC10 Every admin page sits in the canonical frame (owner rule 2026-11-19) — test: `src/app/admin/__tests__/adminPageFrame.test.ts` (new or extended): every `src/app/admin/**/page.tsx` has no `className`, and every one that renders (not a redirect) renders `AdminPageFrame`, except `src/app/admin/page.tsx` and `src/app/admin/listings/[id]/preview/page.tsx`, named in the test with their reason (a whole view that owns its layout, Scope frame line).

## Route

1. Work on the branch the owner created from `main` (checklist H1; no model creates it). Read `staff.ts`, `permissions.ts` (both), `permissionKeys.ts`, every page under `src/app/admin`, the layout, `AdminShell`, `AdminSidebar`, `AdminPermissionsManager`, `AdminPermissionsView` and its Story, the three loaders (`currencies.ts`, `propertyTypes.ts`, `index.ts`).
2. Tests first (AC1-AC6, AC10); save each failing output.
3. The page list, the guard and every page, the landing, the sidebar, the loaders, the section, the SQL set (handed to Opus for AC7; the owner applies it before the merge), the messages, the Story. One pass over every changed file (checklist I7).
4. Run: `npm test -- src/lib/auth/__tests__/adminPages.test.ts src/lib/auth/__tests__/staffPage.security.test.ts src/__tests__/security/staffActions.test.ts src/components/admin/__tests__/AdminSidebar.pages.test.tsx src/app/admin/__tests__/dashboardLanding.test.tsx src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx src/app/admin/__tests__/adminPageFrame.test.ts` (AC3 runs in the CI `authz` job against the real database; AC7 is Opus's in the review) · the I8a measurement on the dev servers · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate break: the key check removed from `requireStaffPage` → `SEC-1007-PAGE-DENY` fails; restored.
5. Report: each command, exit code, relevant output; the finding P-01 row moves to fixed with this test. After the merge Opus opens the admin as `HYDRATION_MODERATOR` with one page switched off and checks the sidebar and the address.

## Review
