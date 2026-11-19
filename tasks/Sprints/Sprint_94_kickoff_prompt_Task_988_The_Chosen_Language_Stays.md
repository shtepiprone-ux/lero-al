# Task 988 — The language a person chose stays: notification links, addresses without a language, and every admin page

Sprint 94. Priority P1. Owner decision: owner list item 1 (2026-11-19, translated): "the language is not saved on the
site and in the admin (a regression): after a listing is created, and when 'Notifications' is clicked". Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

A person who reads the site in Ukrainian and clicks a notification lands on the Albanian page, and so does anyone who
opens an address without a language (`/`, `/cabinet…`, `/listings/…`), whatever language they used last. In the admin
with Ukrainian chosen, the e-mail templates page shows its heading in Albanian and every tab title is a fixed English or
Ukrainian string. After the task: a notification opens in the reader's current language; an address without a language
opens in the language the visitor last used on the site (the default only for a first visit); every admin page renders
its heading, dates and tab title in the admin language.

## Cause

Read at `dc5e3af66`
- The bell renders the stored link as it is: `src/modules/notifications/components/NotificationItem.tsx:289`; the writers store paths without a language (`src/modules/listings/actions/applyListingTransition.ts:149`, `src/modules/listings/actions/reportListing.ts:115`, `src/modules/listings/actions/reportListing.ts:259`, `src/modules/listings/actions/submitListingInquiry.ts:175`) or an absolute Albanian address (`src/app/api/cron/saved-searches/route.ts:147`, `src/app/api/cron/price-alerts/route.ts:172`). Read-only count of production rows 2026-11-19: 55 `listing_status_change` and 4 `report_outcome` links `/listings/<slug>`, 34 `saved_search_match` links `/cabinet?…`.
- An address without a language goes to the default because detection is off (`src/i18n/routing.ts:9`), and the proxy hands every such address to next-intl (`src/proxy.ts:75-76`). Measured 2026-11-19: `curl -s -o /dev/null -w "%{redirect_url}" -H "Cookie: NEXT_LOCALE=uk" https://lero.al/cabinet?tab=listings` → `https://lero.al/sq/cabinet?tab=listings`; the same for `/` with `NEXT_LOCALE=uk` or `admin-locale=uk` → `https://lero.al/sq`. next-intl itself records the last language: `curl -s -D - https://lero.al/uk` → `Set-Cookie: NEXT_LOCALE=…; Path=/; SameSite=lax`.
- The listing form keeps the language to the end (`src/modules/listings/components/ListingFormShell.tsx:249`, `src/modules/listings/domain/listingSemanticHelpers.ts:102-105`); what follows the creation is the moderation notification above. `INFERENCE:` that is the owner's "after a listing is created"; the post-merge check (Route 5) repeats the flow.
- Admin: a page that translates without `getAdminLocale()` gets the default `sq` of `src/i18n/request.ts:7-8`: `src/app/admin/email-templates/page.tsx:14` and `src/app/admin/users/[id]/page.tsx:88`. Measured 2026-11-19 with `HYDRATION_ADMIN` and `admin-locale=uk`: `/admin/email-templates` heading "Shablonet e emailit", the other seven pages read in Ukrainian. 18 admin files keep a fixed tab title (`src/app/admin/users/page.tsx:14` "Users — Admin", `src/app/admin/settings/page.tsx:10` "Налаштування — Admin", `src/app/admin/layout.tsx:31`), and the profile title falls back to a fixed "Профіль" (`src/app/admin/users/[id]/page.tsx:19`).

Fix: the bell renders a link through one helper that keeps it internal and puts the reader's language in front; the proxy sends an address without a language to the language of the visitor's `NEXT_LOCALE` cookie when it is one of the four; every admin page and `generateMetadata` that translates reads the admin language first, and the tab titles come from the page heading keys.

## Scope

- `src/modules/notifications/lib/notificationHref.ts` (new): `notificationHref(link, locale)`: an absolute address of the site's own origin (`NEXT_PUBLIC_SITE_URL`) keeps its path, query and hash; the result must pass `safeNextPath` (`src/lib/auth/safeRedirect.ts:9`; internal only, no `//`, backslash or control character); a leading `/sq|en|uk|it` segment is dropped; the answer is `/${locale}${path}`, or `null` for an empty, foreign or unsafe link.
- `src/modules/notifications/components/NotificationItem.tsx`: the anchor's `href` is `notificationHref(notification.link, locale)` (the `locale` of `:154`); `null` renders the item without an anchor, as a missing link does today. This is the application part of audit finding P-06 that Task 959 planned for the same line (`safeNextPath`): 988 lands it and removes the P-06 `REVIEWED` entry of `scripts/quality/client-sinks.mjs`; 959's kickoff revision drops that line (backlog row of 959).
- `src/proxy.ts`: before next-intl, an address whose first segment is not one of the four languages, outside `carriesNoLocale`, with a `NEXT_LOCALE` cookie equal to one of the four, answers 307 to `/${cookie}${pathname}${search}` with `Cache-Control: private, no-store`, returned through `withPolicy` like every other answer of the proxy; any other cookie value, or none, leaves next-intl's answer unchanged (the staff default of `site_settings`).
- `src/app/admin/email-templates/page.tsx`, `src/app/admin/users/[id]/page.tsx` (page and `generateMetadata`): `await getAdminLocale()` after `requireStaffPage()` and before the first translation or `getLocale()`; the email-templates page's legacy wrapper (`src/app/admin/email-templates/page.tsx:30`, `<div className="p-6 lg:p-8 max-w-5xl mx-auto">`) becomes `AdminPageFrame` as `src/app/admin/currency/page.tsx:20` (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`).
- The 17 pages with `export const metadata` (`grep -rln "export const metadata" src/app/admin --include=page.tsx`): a `generateMetadata` that calls `requireStaffPage()` first (Task 923 R68 (a)), then `getAdminLocale()`, and returns the key the page heading already renders plus " — Admin"; the profile title falls back to `admin.user_profile.header.title_fallback` (new key, four locales). The layout's "Admin — Lero.al" is the brand name in every language and stays.
- `messages/{sq,en,uk,it}.json`: `admin.user_profile.header.title_fallback` only.
- Dependencies: none.
- Out of scope: the e-mail links (Albanian-only e-mail policy, Task 251, `src/modules/notifications/lib/sendTemplatedEmail.ts:96`); the stored rows (read through the helper, never rewritten); `src/app/page.tsx` (the proxy answers `/` before it, unchanged).

## Attack surface

Changed: the request proxy gains a redirect, and a stored link gains a render guard.
1. **What are we working on?** `src/proxy.ts` for every visitor (anonymous included) on every address with no language;
   `NotificationItem` for a signed-in person reading their own notifications. Input crossing the boundary: the
   `NEXT_LOCALE` cookie (set by the browser, so attacker-controlled), the stored `link` (written by the server today;
   P-06: a person may update their own rows).
2. **What can go wrong?**
   - T1 T/open redirect: a crafted cookie (`//evil.com`, `uk/../x`, `UK`, an URL) steers the 307 → mitigate: only the
     four exact values are accepted, the target is a path of the same request → AC2, `SEC-988-PROXY-LOCALE-DENY`.
   - T2 I/cache: a shared cache stores a cookie-dependent redirect for the next visitor → mitigate: `private, no-store`
     on that answer → AC2.
   - T3 T/off-site link: a notification link to another origin, `javascript:` or `//host` → mitigate: `notificationHref`
     returns `null`, no anchor renders → AC1, `SEC-988-NOTIF-LINK-DENY`.
   - T4 D: a redirect loop → mitigate: a path whose first segment is a language never redirects → AC2.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: unchanged (no new action or role decision; the proxy's session refresh and `carriesNoLocale`
   stay as they are).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (c12dd22e17ce, 2026-11-19).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T4 name the crafted cookie, the cached redirect, the off-site link and the loop — AC1, AC2.
- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the proxy rule, its cookie input and the stored link — AC1, AC2.
- Authentication: not applicable — no sign-in, password or identity check changes.
- Authentication_Patterns: not applicable — the helper only reuses the internal-path check of `safeRedirect.ts`.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every new admin `generateMetadata` checks the viewer first, like its page — AC3.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is added or changed.
- Authorization_Patterns: not applicable — staff pages keep `requireStaffPage` as their only gate, unchanged.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — AC3 fails when a page or title function translates before the viewer check, and the staff page test stays green — AC3.
- Authorization_Testing_Automation: not applicable — the matrix gains no row; no entry point changes its rule.
- Bot_Management_and_Anti-Automation: not applicable — no counter, limit or challenge changes here.
- Clickjacking_Defense: not applicable — frame headers come from `next.config` and stay unchanged.
- Content_Security_Policy: not applicable — the policy and its nonce are untouched; the new answer passes `withPolicy`.
- Cookie_Theft_Mitigation: not applicable — the proxy reads only the language cookie, never a session cookie.
- Credential_Stuffing_Prevention: not applicable — the task adds no login, password or recovery path.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the link is checked by `safeNextPath` before it reaches `href`, on top of React's own URL handling — AC1, AC4.
- Cryptographic_Storage: not applicable — "hash" here is the URL fragment; nothing is stored or encrypted.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the stored link reaches only an `href` after the helper, never a script sink — AC1, AC4.
- Denial_of_Service: "Using validation that is cheap in resources first" — the proxy compares one cookie with four strings before any other work — AC2.
- HTTP_Headers: not applicable — the site-wide headers of `next.config` apply to proxy redirects already (measured: `Permissions-Policy` on the 307 of `/cabinet`).
- HTTP_Strict_Transport_Security: not applicable — the HSTS header stays in `next.config`, unchanged.
- Injection_Prevention: not applicable — no query, command or interpreter input is built.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input.
- Key_Management: not applicable — no key, secret or token is read or written.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: not applicable — no row of any person is read or written by this task.
- Multifactor_Authentication: not applicable — staff sign-in and its factors are unchanged (Task 960 carries MFA).
- Nextjs_Security: "Use for optimistic redirects and request filtering. Do not make it the only authorization layer." — the proxy rule only redirects; every page keeps its own check — AC2, AC3.
- OAuth2: not applicable — no OAuth flow, client or token handling changes.
- OS_Command_Injection_Defense: not applicable — no process is started with any input.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1 and AC2.
- Server_Side_Template_Injection_Prevention: not applicable — the e-mail templates are out of scope and untouched.
- Session_Management: not applicable — the session refresh of the proxy runs as before, unchanged.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Unvalidated_Redirects_and_Forwards: "A server-side mapping from an approved destination ID remains preferable to accepting arbitrary URLs." — the cookie only selects one of four language codes, and the path is the request's own — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate breaks included — AC6.
- Web_Cache_Security: "Prefer disabling shared caching for personalized responses." — the cookie-dependent 307 is `private, no-store` — AC2.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the item renders the link as an attribute through the helper, no HTML — AC1.

## UI

No visible change of any component: the same anchor, heading and tab title elements render text in the chosen language.
The email-templates page moves into the canonical `AdminPageFrame` and inherits its adapted width and padding.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A notification opens in the reader's language and stays internal — test: `src/modules/notifications/lib/__tests__/notificationHref.test.ts` (new): `/listings/a` with `uk` → `/uk/listings/a`; `/sq/listings/a` with `en` → `/en/listings/a`; `https://lero.al/sq/listings?x=1#h` with `it` → `/it/listings?x=1#h`; `/cabinet?tab=x` with `uk` → `/uk/cabinet?tab=x`;
  `SEC-988-NOTIF-LINK-DENY`: `https://evil.com/x`, `//evil.com`, `javascript:alert(1)`, `/\evil.com`, a control character, `''`, `null` → `null`; and `src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx` (extended: the rendered `href` carries the provider's locale; a `null` result renders no anchor).
- AC2 An address without a language keeps the visitor's language — test: `src/__tests__/security/proxyLocale.test.ts` (new; calls `proxy` with `NextRequest`): `/cabinet?tab=x` with `NEXT_LOCALE=uk` → 307 to `/uk/cabinet?tab=x` with `Cache-Control: private, no-store`; `/` with `it` → `/it`; no cookie → next-intl's default answer;
  `SEC-988-PROXY-LOCALE-DENY`: `NEXT_LOCALE` of `//evil.com`, `UK`, `uk/../x`, `https://evil.com` → no 307 of this rule; `/uk/x` with `NEXT_LOCALE=en` → no redirect (no loop); `/admin` and `/api/x` untouched.
- AC3 Every admin page reads the admin language before it translates — test: `src/app/admin/__tests__/adminLanguage.test.ts` (new): every `page.tsx` and `layout.tsx` under `src/app/admin` that calls `getTranslations`, `getLocale` or `getMessages` awaits `getAdminLocale()` before it, in the page and in `generateMetadata`, and `requireStaffPage()` stays the first await of each page and `generateMetadata` (Task 923 R68 (a)); `src/lib/auth/__tests__/staffPage.security.test.ts` stays green; no `page.tsx` under `src/app/admin` keeps `export const metadata` with a literal `title`.
- AC4 The P-06 render entry is gone — test: `node scripts/quality/client-sinks.mjs` exits 0 with the P-06 `REVIEWED` entry removed.
- AC5 The new key exists in four languages — test: `node scripts/check-i18n-parity.mjs` and `node scripts/quality/locale-safety.mjs`.
- AC6 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.
- AC7 The email-templates page sits in the canonical frame (owner rule 2026-11-19) — test: `src/app/admin/__tests__/adminPageFrame.test.ts` (new or extended): the page renders `AdminPageFrame` and has no `className`.

## Route

1. Branch from `main`. Read `src/proxy.ts`, `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/lib/admin/getAdminLocale.ts`, `NotificationItem.tsx`, `src/lib/auth/safeRedirect.ts`, `scripts/quality/client-sinks.mjs`, and each admin page with `export const metadata`.
2. Tests first (AC1-AC3, AC7); save each failing output.
3. The helper, the bell, the proxy rule, the two admin pages, the 17 titles, the key. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; one deliberate break per security test (the four-value check of the cookie, `safeNextPath` in the helper), restored.
5. Report: each command, exit code, relevant output. After the merge Opus repeats the 2026-11-19 production checks: the `curl` redirects with `NEXT_LOCALE=uk`; with `HYDRATION_AGENT1` in Ukrainian, a notification opens in Ukrainian; with `HYDRATION_ADMIN` and `admin-locale=uk`, every admin page heading and tab title are Ukrainian.

## Review
