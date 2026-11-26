# Task 988 — The interface speaks the language the person chose: the account language for a signed-in person, a language slug on every page, the admin included

Sprint 94. Priority P1. Owner list item 1 (2026-11-19, translated): "the language is not saved on the site and in the
admin (a regression): after a listing is created, and when 'Notifications' is clicked". Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Owner, 2026-11-26: the next task by priority. Implementer: Sonnet.
Reviewer: Opus. Human owner of the change: the owner.

Owner decisions of 2026-11-26 (translated), which replace the first design of this kickoff (Review 1 judged that design's tree):
- O988-1: "A signed-in user must always see their interface in the language they chose. A user who is not signed in sees
  the default language every time they close and reopen the browser." The 10-day language cookie of the first design is withdrawn.
- O988-2: a signed-in person who opens a link in another language (e.g. `/sq/listings/x` while the account says `uk`) sees
  their own language.
- O988-3: the account language, formerly Task 1066, is part of this task; 1066 is withdrawn.
- O988-4: "the language slug must be on every page of the interface, so that the page renders in exactly the language
  active in the interface"; the admin moves under the slug in this task ("everything in 988").
- O988-5: "if a guest is on the site and opens a link, for example from a social network, in the same browser, the
  language must stay the one in their other tab: a temporary cookie keeps the interface language current, even when the
  user pastes a link into the address bar".

## Goal

Today the language follows the address and a browser cookie only: a signed-in person who chose Ukrainian lands on Albanian
pages after a notification click, an address without a language, a new device or a browser restart; a new account forgets
the language it signed up in; the admin has no language in its address and takes it from a cookie. After the task:

| Who | The interface language |
|---|---|
| Signed in | Always the account language (`users.preferred_locale`): every page, every device, after any restart, on links in another language; the switcher changes the account language. |
| Not signed in | The language of this browser session: the language of the first page opened in the session, or the one the switcher chose; every later page, a pasted or followed link in another language and an address without a language open in it (all tabs of the browser share it). After the browser restarts: the language of the first page opened, the default for an address without a language. |
| Every page | Its address carries the language slug (`/uk/...`, `/uk/admin/...`) and the page renders in it. |

## Cause

Read at `aacf6ebce`.

The live database was read read-only on 2026-11-26.

- The account language exists but the interface never reads it. `users.preferred_locale` (text, not null, default `'sq'`, check `sq|en|uk|it`) is written by the site and admin switchers (`src/modules/admin/actions/locale.ts:18-25`, called from `src/components/layout/Header.tsx:77` and `src/components/admin/AdminLocaleSwitcher.tsx:28`) and read only for e-mail (`src/modules/notifications/lib/emails/resolveUserLocale.ts:32-35`). The request proxy refreshes the session (`src/lib/auth/middleware.ts:50`, called at `src/proxy.ts:70`) and routes the language by the address alone (next-intl, `localeDetection: false`, `src/i18n/routing.ts:9`).
- A new account forgets its sign-up language. The sign-up form sends `preferred_locale` in the metadata (`src/modules/auth/components/AuthSheet.tsx:483`, kept by `src/modules/auth/lib/signupMetadata.ts:7`), but the trigger `public.handle_new_user()` inserts `id, name, phone, avatar_url, role, user_type, is_verified, created_at` only (last written by `supabase/sql_migrations/task962/v8b2.sql:20-40`; live source read with `pg_get_functiondef`: no `preferred_locale`), so every new row gets `'sq'`. Live rows: 12 accounts (`sq` 6, `uk` 5, `en` 1); of 8 e-mail accounts whose metadata holds a language, 2 differ from the column (`uk` → `sq`, `uk` → `en`). Google sign-in (`src/lib/auth/browser.ts:29`, `signInWithIdToken`) sends no metadata: both Google accounts are `sq`.
- The site switcher does not wait for the account write: `setAdminLocale(newLocale)` is not awaited before `router.push` (`src/components/layout/Header.tsx:77-78`).
- Notification links: the bell rendered the stored link as it is (`NotificationItem.tsx:289` at `aacf6ebce`); the writers store paths without a language or `${SITE_URL}/sq/...` (`applyListingTransition.ts:155`, `reportListing.ts:115`, `:259`, `submitListingInquiry.ts:175`, `src/app/api/cron/saved-searches/route.ts:147`, `src/app/api/cron/price-alerts/route.ts:172`). Only the server writes them (`notifications`: `authenticated` has `SELECT` and `UPDATE (is_read)` only). Stored rows, read-only 2026-11-26: 134 links, every one a path without a language (`saved_search_match` 73, `listing_status_change` 57, `report_outcome` 4), 7 without a link; no absolute link is stored yet. A path without a language is the right stored form: the reader's language is applied when the bell renders, so a later switch of language is followed. The two cron writers break that form: they store the e-mail's absolute Albanian address in the notification (`src/app/api/cron/saved-searches/route.ts:147` → `:180`, `src/app/api/cron/price-alerts/route.ts:172` → `:212`).
- An address without a language goes to the default: `curl -s -o /dev/null -w "%{redirect_url}" -H "Cookie: NEXT_LOCALE=uk" "https://lero.al/cabinet?tab=listings"` → `https://lero.al/sq/cabinet?tab=listings` (2026-11-26). next-intl's `NEXT_LOCALE` is a session cookie (`curl -s -D - https://lero.al/uk` → `Set-Cookie: NEXT_LOCALE=uk; Path=/; SameSite=lax`, no `Max-Age`), and next-intl rewrites it to the language of every page opened (next-intl's own `syncCookie`, lines 8-23 of `middleware/syncCookie.js` in the installed package, which Git does not hold), so a followed link in another language changes a guest's language for the rest of the session (O988-5).
- The admin has no slug: its pages live in `src/app/admin/**` (22 `page.tsx`), outside `src/app/[locale]`; the proxy leaves `/admin` out of locale routing (`carriesNoLocale`, `src/proxy.ts:52-55`); its language is the `admin-locale` cookie (`src/app/admin/layout.tsx:38`, `src/lib/admin/getAdminLocale.ts:9-15`, also read by `src/app/layout.tsx:37`, `src/app/page.tsx:13`, `src/lib/auth/staff.ts:95-97`), default `en`. `src/app/admin/email-templates/page.tsx:15` and `src/app/admin/users/[id]/page.tsx:88` translated before reading it, and 17 admin pages had a fixed tab title (`export const metadata`).
- Admin paths are literal: 174 `'/admin…'` strings in 57 production files (a `grep -rhoE` for a quote followed by `/admin` and `/`, a quote or `?`, over `src`, `*.test.*`, `__tests__` and Stories excluded → 174 matches in 57 files), among them the page-access table `src/lib/auth/adminPages.ts:12-37`, the report-only script policy `src/lib/security/headers.ts:49`, 40 `revalidatePath('/admin…')` calls in 6 files, 4 `redirect('/admin…')` and 7 `router.push` or `router.replace('/admin…')`.

Fix: the proxy reads the account language of a signed-in person and sends every page request in another language (or none) to it; a guest's session language is kept in its own session cookie, written only by the first page of the session and by the switcher, and every page request in another language (or none) goes to it; a new account stores the language it signed up in; both switchers write the account language before they navigate; the admin moves to `src/app/[locale]/admin` and every admin path carries the slug; the notification link helper, the admin titles and the P-06 removal of the first tree stay.

## Scope

Kept from the reviewed tree of Review 1 (the executor's local commit "Task 988: the reviewed tree of Review 1, before Revision 1"):
- `src/modules/notifications/lib/notificationHref.ts` and `NotificationItem.tsx` (AC1); the stored rows are not rewritten (they already hold the stored form); the 18 `generateMetadata` titles and `admin.user_profile.header.title_fallback` (AC7); the P-06 entry of `scripts/quality/client-sinks.mjs` removed (Opus, F1, done).

Changed:
1. **Account language in the proxy.** `src/lib/auth/middleware.ts`: `refreshSession` returns `{ response, accountLocale }`; after `getUser()` (nothing is added between `createServerClient` and `getUser()`, `:47-49`), for a user it reads `preferred_locale` of the caller's own row with the same session client (`from('users').select('preferred_locale').eq('id', user.id).maybeSingle()`; RLS `users_self_read`, a blocked account gets no row) and gives it only when it is one of the four codes, else `null`. `src/proxy.ts`: for a `GET` or `HEAD` request outside `/api` with `accountLocale`, a first path segment different from it (or no language segment) answers 307 to `/${accountLocale}${the path without its language segment}${search}`, `Cache-Control: private, no-store`, the refreshed session cookies, through `withPolicy`; the same language passes to next-intl. Without `accountLocale` the guest rule (item 2) applies, also limited to `GET` and `HEAD`; the guest rule of the reviewed tree (`NEXT_LOCALE` for an address without a language) is replaced by it. With `accountLocale`, the response also sets the session language cookie of item 2 to it when it differs, so a person who signs out keeps the same language for the rest of the session. Every other method passes unchanged (a Server Action's `POST` is never redirected).
2. **The guest's session language (O988-1, O988-5).** `src/i18n/routing.ts`: the `localeCookie` line of the reviewed tree is removed. A new cookie `lero_ui_locale` (one constant, e.g. in `src/i18n/routing.ts`): a session cookie (no `Max-Age`, no `Expires`), `Path=/`, `SameSite=Lax` (it reaches a link followed from another site), `HttpOnly`, `Secure` in production; its value is one of the four codes, any other value is ignored. `src/proxy.ts`, for a `GET` or `HEAD` page request outside `/api` without `accountLocale`: with a valid `lero_ui_locale`, a first segment in another language or no language answers 307 to `/${cookie}${the path without its language segment}${search}` (`private, no-store`, the refreshed session cookies, `withPolicy`), the same language passes; without it, a path with a language passes and its response sets `lero_ui_locale` to that language, and a path without one gets next-intl's default answer. The cookie is written only there and by the switcher (item 4), never from `NEXT_LOCALE`. A request without cookies (a crawler) is never redirected away from the language of its address.
3. **A new account keeps its language.** `supabase/sql_migrations/task988/task988.sql` (+ `-preflight.sql`, `-verify.sql`, `-rollback.sql`, the files of `task991` as the pattern): `public.handle_new_user()` recreated from its live definition (read it with `pg_get_functiondef`; compare with `task962/v8b2.sql`) with one change: `preferred_locale` inserted as `new.raw_user_meta_data->>'preferred_locale'` when it is one of `sq|en|uk|it`, else `'sq'`; owner, search path, `security definer` and grants as they are. No existing row is changed (UNKNOWN which of them the person chose). Google: after `signInWithIdToken` succeeds for an account whose `created_at` equals its first `last_sign_in_at` (a new account), the browser calls the account-language action with the page language before it navigates (`src/lib/auth/browser.ts` caller, the Google button's success path).
4. **Switchers.** `src/modules/admin/actions/locale.ts`: `setAdminLocale` becomes `setAccountLocale(locale)` (four codes only; a signed-in caller's own row; returns whether it was written); it sets `lero_ui_locale` to the code for every caller, guest or signed in; the `admin-locale` cookie is no longer written. `Header.tsx:73-79` and `AdminLocaleSwitcher.tsx` await it, then navigate to the same path under the new slug.
5. **The admin under the slug.** `src/app/admin/**` moves to `src/app/[locale]/admin/**`. The site routes move into a route group `src/app/[locale]/(site)/` with a `(site)/layout.tsx` that holds what only the site renders (`Header`, `Footer`, the site frame of `src/app/[locale]/layout.tsx:46-56`); `src/app/[locale]/layout.tsx` keeps the locale check, `setRequestLocale` and `NextIntlClientProvider`; addresses of the site do not change (route groups add no segment; one root layout, so no full reloads). `src/app/[locale]/admin/layout.tsx` takes the language from the `[locale]` param (no cookie, no second message bundle) and keeps `requireViewer`, the allowed pages and `AdminShell`. `getAdminLocale()` returns next-intl's request locale (`getLocale()`), no cookie. Every admin path carries the slug: links and `router.push` through the current locale, `redirect` through the request locale, `revalidatePath` of the moved routes as `('/[locale]/admin/…', 'page')` or `'layout'`, `adminPages.ts` and `ADMIN_ONLY_PATHS` compared with the path after the slug, `headers.ts:49` matching `/(sq|en|uk|it)/admin`, `staff.ts:95-97` and the admin layout sending to `/${locale}/auth/login?next=/${locale}/admin`. `carriesNoLocale` keeps `/api` only; an old `/admin/...` address reaches the account or guest rule of item 1 and lands on `/<language>/admin/...`. `eslint.config.mjs:61` and every test path follow the move.
6. **One stored form for notification links.** `src/app/api/cron/saved-searches/route.ts:180` stores `/listings?<the same query>` and `src/app/api/cron/price-alerts/route.ts:212` stores `/listings/<slug>` in the notification; the e-mail keeps its absolute address (`:147`, `:172`, Albanian e-mail policy, Task 251).
7. **The `admin-locale` cookie leaves.** Its readers (`src/app/layout.tsx:37`, `src/app/page.tsx:13`, `staff.ts:88-97`, the admin layout, `getAdminLocale.ts`) read the request locale instead; `src/app/page.tsx` keeps the staff default of `site_settings`.
- Out of scope: the e-mail language and links (Albanian-only e-mail policy, Task 251); the stored notification rows; the language of an existing account (not rewritten); `localeDetection` (stays off); `src/app/auth/**` route handlers and the Google relay page `src/app/auth/google/callback` (a loader with no interface text, Task 927 D25), which stay outside the slug.
- Kept as on `main` (checklist A2): every page's look, texts and data; the site's addresses; each admin page's `requireStaffPage` as its first await, its access key and its heading; the session refresh and the banned-account sign-out of `refreshSession`; the report-only script policy on the same pages; next-intl's answer for a request with no account language and no guest rule; `NotificationItem`'s layout, read marking and click handler.

## Attack surface

Changed: the request proxy reads the caller's own profile row and redirects by it; the admin moves to new paths; the sign-up trigger writes one more column.
1. **What are we working on?** `src/proxy.ts` for every page request (guests and signed-in people); the admin routes and their access table; `public.handle_new_user()` (security definer, runs on every new account); `setAccountLocale` (a Server Action, a public POST endpoint).
2. **What can go wrong?**
   - T1 T/open redirect: a crafted `lero_ui_locale` cookie or a crafted account value steers the 307 → mitigate: only four exact codes, the target is a path of the same request → AC2, AC3, `SEC-988-PROXY-LOCALE-DENY`.
   - T8 T/cookie written from input: the guest cookie is set from the request → mitigate: written only with one of four codes, fixed attributes, `HttpOnly`; a crafted value is never echoed → AC2, `SEC-988-GUEST-COOKIE-DENY`.
   - T2 I/cache: a shared cache keeps a per-person redirect → mitigate: `private, no-store` on every 307 of the rule → AC2, AC3.
   - T3 T/off-site link from a notification → mitigate: `notificationHref` (`safeNextPath`) → AC1, `SEC-988-NOTIF-LINK-DENY`.
   - T4 D: a redirect loop or a redirected Server Action → mitigate: same language passes; only `GET` and `HEAD` → AC3.
   - T5 E/admin access through the new paths: an admin page or its access key no longer matched after the slug (a moderator reaches a page whose key is off, or the sidebar shows it) → mitigate: `adminPages.ts` compared after the slug, `requireStaffPage` unchanged on every page → AC6, `SEC-988-ADMIN-SLUG-DENY`.
   - T6 T/another person's language: `setAccountLocale` writes only the caller's own row, four codes → AC5, `SEC-988-ACCOUNT-LOCALE-DENY`.
   - T7 T/trigger input: the metadata value is chosen by the browser at sign-up → mitigate: inserted only when it is one of four codes, else `'sq'` (the column check stays) → AC4.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: no new role decision; every admin page keeps its `requireStaffPage` access; `setAccountLocale` is self-only (as `setAdminLocale` is on `main`).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (5254440ecf1a, 2026-11-26, the redesigned kickoff).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T7 name the crafted cookie and account value, the cached redirect, the off-site link, the loop, the admin key lookup, another person's row and the sign-up value — AC1-AC6.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the proxy's profile read, the moved admin routes, the trigger and the action — AC3, AC4, AC5, AC6.
- Business_Logic_Security: not applicable — the price alert keeps its rule; only the stored form of its link changes.
- Authentication: not applicable — sign-in, passwords and factors are unchanged; only the language after a sign-in is stored.
- Authentication_Patterns: not applicable — the session is still verified by the existing `getUser()` call, unchanged.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every moved admin page keeps `requireStaffPage`; `setAccountLocale` writes only the caller's row — AC5, AC6.
- Authorization_Decisions_And_Output_Handling: not applicable — no new authorization decision; the access keys stay as on main.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — each admin page checks its own key after the move, not the proxy — AC6.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the staff, moderator-key and admin page tests run on the moved paths, and `SEC-988-ADMIN-SLUG-DENY` fails when the slug breaks the key lookup — AC6.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — `moderatorKeys.integration.test.ts` and `staffAccess.integration.test.ts` pass on `/<locale>/admin` — AC6.
- Clickjacking_Defense: not applicable — frame headers come from next.config and stay unchanged.
- Content_Security_Policy: not applicable — the policy is unchanged; its report-only matcher follows the moved admin paths (AC6).
- Cookie_Theft_Mitigation: not applicable — the proxy reads no session cookie value; the `admin-locale` cookie is only removed.
- Credential_Stuffing_Prevention: not applicable — the task adds no login, password or recovery path.
- Cross-Site_Request_Forgery_Prevention: not applicable — no state changes on a cross-site request: once set, the session language is changed only by the switcher (a Server Action with Next's origin check); a followed link is redirected, never written.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the stored link passes `safeNextPath` before it reaches `href` — AC1, AC8.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the stored link reaches only an `href` after the helper — AC1.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the trigger keeps its owner, search path and grants; the proxy reads with the session client under RLS, never the service role — AC3, AC4.
- GraphQL: not applicable — the project exposes no GraphQL endpoint at all.
- HTTP_Headers: not applicable — the site-wide headers of next.config apply to the redirects unchanged.
- HTTP_Strict_Transport_Security: not applicable — the HSTS header stays in next.config, unchanged.
- Injection_Prevention: not applicable — the trigger compares the metadata value with four literals; no SQL is built.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the account value, the cookie value, the action's argument and the trigger's metadata value are each checked against the four codes on the server — AC2, AC3, AC4, AC5.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the proxy and `setAccountLocale` touch only the caller's own row (RLS own-row policies) — AC3, AC5.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over long input.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — `setAccountLocale` writes the one column `preferred_locale` of the caller's row — AC5.
- Multi_Tenant_Security: not applicable — accounts are not tenants here; each person reads only their own row.
- Multifactor_Authentication: not applicable — staff sign-in and its factors are unchanged (Task 960 carries MFA).
- Nodejs_Security: not applicable — the cron routes change one string they store; no new module or call.
- Nextjs_Security: "Use for optimistic redirects and request filtering. Do not make it the only authorization layer." — the proxy only redirects by language; every page keeps its own check — AC3, AC6.
- OAuth2: not applicable — the Google flow is unchanged; only its success path stores a language.
- OS_Command_Injection_Defense: not applicable — no process is started with any input.
- Prototype_Pollution_Prevention: not applicable — no object is built from request keys; one string is compared.
- Query_Parameterization: not applicable — the reads and writes go through the Supabase client by id.
- REST_Security: not applicable — no route handler is added or changed by this task.
- React_Security: "Where possible, render untrusted content as text using JSX expressions." — the checked link is a JSX attribute — AC1.
- SQL_Injection_Prevention: not applicable — the trigger uses the metadata value as data in a comparison, never as SQL.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC10.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC10.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T7 are AC1-AC6.
- Serverless_FaaS_Security: not applicable — the cron routes keep their secret check and schedule, unchanged.
- Session_Management: "Follow the session logging protections and session renewal guidance." — the session refresh, its cookies and the banned-account sign-out run as before; the redirects carry the refreshed cookies — AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1-AC6.
- Unvalidated_Redirects_and_Forwards: "A server-side mapping from an approved destination ID remains preferable to accepting arbitrary URLs." — the cookie or the account only selects one of four codes; the path is the request's own — AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and breaks — AC10.
- XS_Leaks: not applicable — the guest cookie is SameSite=Lax, so no cross-site frame or subresource request carries it, and a top-level redirect is not readable by the other site.
- Web_Cache_Security: "Prefer disabling shared caching for personalized responses." — every redirect of the language rules is `private, no-store` — AC2, AC3.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the link is an attribute, no HTML — AC1.
- Web_Service_Security: not applicable — no web service or API route changes in this task.

## UI

No component changes its look. Visible changes: the address carries the slug in the admin (`/uk/admin/...`), and the interface of a signed-in person is in the account language. Every admin page and the site pages that render the switchers are measured on the dev server (I8a, V5a) at 320, 640, 1024 and 1440px against `main`: the admin shell, sidebar and header must render exactly as on `main`.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A notification opens in the reader's language and stays internal — test: `src/modules/notifications/lib/__tests__/notificationHref.test.ts` and `NotificationItem.templateLocalization.smoke.test.tsx` (as in the reviewed tree), `SEC-988-NOTIF-LINK-DENY`; `src/app/api/cron/saved-searches/__tests__/route.notificationLink.test.ts` and `src/app/api/cron/price-alerts/__tests__/route.notificationLink.test.ts` (new): the notification's `link` is a path without a language and without an origin, and the e-mail still gets the absolute address.
- AC2 A guest keeps the session language across tabs and links — test: `src/__tests__/security/proxyLocale.test.ts` (rewritten): `/sq/listings/x?a=1` with `lero_ui_locale=uk` → 307 `/uk/listings/x?a=1`, `private, no-store`; `/cabinet` with `uk` → `/uk/cabinet`; `/uk/x` with `uk` → passes and sets no cookie; `/en/x` without the cookie → passes and sets `lero_ui_locale=en` with `Path=/`, `SameSite=Lax`, `HttpOnly`, no `Max-Age`, no `Expires`; `/cabinet` without cookies → next-intl's default; a `POST` to `/sq/x` with `uk` → passes; a `NEXT_LOCALE=sq` beside `lero_ui_locale=uk` → still `/uk`; `SEC-988-PROXY-LOCALE-DENY`: `lero_ui_locale` of `//evil.com`, `UK`, `uk/../x`, `https://evil.com` → no 307 of the rule; `SEC-988-GUEST-COOKIE-DENY`: no response sets `lero_ui_locale` to anything but the four codes; `src/i18n/__tests__/routing.test.ts` (new or extended): next-intl's `NEXT_LOCALE` has no `Max-Age`.
- AC3 A signed-in person always gets the account language — test: `src/__tests__/security/proxyAccountLocale.test.ts` (new; `proxy` with a session double whose row says `uk`): `/sq/listings/x?a=1` → 307 `/uk/listings/x?a=1`, `private, no-store`, the refreshed cookies; `/cabinet` → `/uk/cabinet`; `/admin/users` → `/uk/admin/users`; `/uk/listings/x` → passes; a `POST` to `/sq/listings/x` → passes; no row, `null`, `'UK'` or `'xx'` → the guest rule; `src/lib/auth/__tests__/middlewareAccountLocale.test.ts` (new): `refreshSession` reads only the caller's row after `getUser()`; and an integration test `src/tests/integration/accountLocale.integration.test.ts` (new, real project, synthetic person): the session client reads its own `preferred_locale`, and another person's row gives no row.
- AC4 A new account keeps its sign-up language — test: `src/tests/integration/accountLocale.integration.test.ts`: an e-mail sign-up of a synthetic person with metadata `uk` → `users.preferred_locale = 'uk'`; with `'xx'` or none → `'sq'`; `task988-verify.sql` checks the function definition; and `src/components/auth/__tests__/GoogleSignInButton.locale.test.tsx` (new or extended): a new Google account calls `setAccountLocale` with the page language before navigation, an existing one does not.
- AC5 The switchers write the account language first — test: `src/modules/admin/actions/__tests__/locale.security.test.ts` (new or extended): `setAccountLocale('uk')` updates only the caller's row; a guest writes no row; both set `lero_ui_locale=uk` (session cookie, the attributes of AC2); `SEC-988-ACCOUNT-LOCALE-DENY`: `'UK'`, `'xx'`, `'uk; x'`, an object → no write and no cookie; no `admin-locale` cookie is set; `Header` and `AdminLocaleSwitcher` tests: navigation happens after the action resolved.
- AC6 The admin lives under the slug and keeps its access — test: `src/app/[locale]/admin/__tests__/adminSlug.test.ts` (new): every admin `page.tsx` lies under `src/app/[locale]/admin`; no production file keeps a `'/admin…'` path literal outside the slug-aware helpers (scan); `adminPages.ts` gives the same key for `/uk/admin/users` as `main` gave for `/admin/users`, for every row; `headers.ts` puts the report-only policy on `/uk/admin/x` and not on `/uk/listings`; `SEC-988-ADMIN-SLUG-DENY`: a moderator without `page.users` gets `notFound()` on `/uk/admin/users` and the sidebar omits it; the existing staff and permission tests (`staffPage.security.test.ts`, `adminPage.integration.test.ts`, `moderatorKeys.integration.test.ts`, `staffAccess.integration.test.ts`) pass on the moved paths.
- AC7 Every admin page renders in the slug's language — test: `adminLanguage.test.ts` (moved with the admin): each `generateMetadata` and page translate after the request locale is set and after `requireStaffPage()`; the titles per language; no static metadata title.
- AC8 The P-06 render entry is gone — test: `node scripts/quality/client-sinks.mjs` exit 0 (done by Opus).
- AC9 Translations — test: `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs`.
- AC10 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (A5).

## Route

1. Start from the owner's local commit of the reviewed tree on `task/988-chosen-language-stays` (checklist I1). Read `src/proxy.ts`, `src/lib/auth/middleware.ts`, `src/i18n/*`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/admin/layout.tsx`, `src/lib/admin/getAdminLocale.ts`, `src/lib/auth/staff.ts`, `src/lib/auth/adminPages.ts`, `src/lib/auth/permissions.ts`, `src/lib/security/headers.ts`, `src/modules/admin/actions/locale.ts`, `Header.tsx`, `AdminLocaleSwitcher.tsx`, `AdminShell`, the Google sign-in button, `supabase/sql_migrations/task991/*` and `task962/v8b2.sql`; the live `pg_get_functiondef('public.handle_new_user()'::regprocedure)` (read-only, `project-facts.md`).
2. Tests first (AC2-AC7); save each failing output.
3. Items 1-7 of the Scope, then one pass over every changed file (I7). Move files with their history (`git mv` is a write: move them with the file system; Git sees the rename).
4. Run (`quality-gates.md` §8.1; at `aacf6ebce` the graph over the first tree reached 197 files, the integration graph 14; the move widens both):
   - `npm run typecheck`; ESLint on the changed code files (the pre-commit hook's command).
   - The import graph over every changed, moved and new file: `npx vitest related --run --reporter=verbose <files>`; the same with `--config vitest.integration.config.ts` and the integration environment (`project-facts.md`).
   - The text search of §8.1 for every moved path (`src/app/admin`, `src/app/[locale]/<each moved folder>`, `/admin` paths) and each renamed export (`setAdminLocale`, `refreshSession`'s return); run what it finds by §8.1's command.
   - `node --test scripts/quality/client-sinks.test.mjs scripts/quality/check-files.test.mjs`; `node scripts/quality/client-sinks.mjs`; `node scripts/check-i18n-parity.mjs`; `node scripts/quality/locale-safety.mjs`.
   - SQL: the four `task988*.sql` files are run by nobody in the session; Opus runs the preflight and rollback checks read-only (H4) and the owner applies; until then AC4's integration case reports `BLOCKED: task988.sql not applied`.
   - Deliberate breaks, each restored: the four-code check of the account value removed → AC3 DENY fails; the guest cookie read instead of being checked → `SEC-988-PROXY-LOCALE-DENY` fails; the first-page write of `lero_ui_locale` removed → AC2's `/en/x` case fails; the `GET`/`HEAD` limit removed → the `POST` case fails; the slug stripped from `adminPages.ts` matching → `SEC-988-ADMIN-SLUG-DENY` fails; `await` removed from the switcher → AC5 fails; the code check removed from the trigger's language → the `'xx'` case fails (on the real project after the owner's apply only).
   - I8a: every admin page and the switchers on the dev server (`HYDRATION_ADMIN`, `HYDRATION_MODERATOR`, `HYDRATION_AGENT1`), against `main` on production.
   - CI only on GitHub (A5).
5. Report: each command, exit code, relevant output; each failing-first run; each break; the moved files (`git status --short`); every deviation with its reason. After the merge Opus repeats on production: a signed-in agent with account `uk` on `/sq/...`, `/`, `/cabinet` and a notification; a guest on `/uk` who pastes `/sq/listings/<slug>` into another tab (lands on `/uk/listings/<slug>`); a guest after a browser restart; an admin on `/admin/users` → `/<account language>/admin/users`.

## Revision 1 (Review 1, 2026-11-26)

- The owner's redesign of 2026-11-26 (O988-1 to O988-4) replaces the first Scope; the items above are the revision. Review 1's F2 and F3 (the doubles of `adminUserGone.security.test.ts` and `adminPage.integration.test.ts`) are covered by AC6: both tests move with the admin and pass on the new code.
- F1 (the P-06 entry of `scripts/quality/client-sinks.mjs:44-45`) was removed by Opus on the owner's word.

## Revision 2 (Review 2, 2026-11-26)

Starts from the owner's local commit "Task 988: the reviewed tree of Review 2, before Revision 2". One item per finding of [Review 2](../../docs/reviews/Task_988_Review_2.md); the exact edits are its "Revision 2 (executor)" items.
- R2-1 (F1, Scope 5 "every test path follow the move"): the CI tables that still name the pre-move page files follow the move, paths only: `scripts/check-signed-in-pages.mjs` (rows, `AWAY_FROM_ADMIN` → `/sq`, the two `STAFF_REDIRECT` targets, `PAGE_ROOTS`, comments), `scripts/check-homepage-theme-runtime-deps.mjs`, `scripts/check-tailwind-runtime-tokens.mjs`, `scripts/type-responsive-baseline.json`, `scripts/governance/tailwind-entropy.allowlist.json`, `scripts/i18n-dynamic-manifest.json`, `scripts/surface-census-baseline.json`, `scripts/governance/reports/component-catalog.latest.json`. No entry, row or allowance added or removed.
- R2-2 (F2, AC8): done by Opus on the owner's word before the commit (the pre-commit hook refused the sink): `src/components/layout/Header.tsx` opens `adminHref(locale, '/admin')` inside the `window.open` call; `node scripts/quality/client-sinks.mjs` exit 0 without a `REVIEWED` entry.
- R2-3 (F3, checklist A2 and A4): `src/app/robots.ts:21` adds `'/*/admin'` (Task 923 R72 (h) kept for the admin under the slug); `src/app/__tests__/robots.test.ts:37` follows.
- R2-4 (F4, AC4): the crafted sign-up value of `src/tests/integration/accountLocale.integration.test.ts:71` becomes `"uk'; --"` (Supabase's edge refuses the `drop table` signature before the trigger runs); the file runs 2/2 on the real project, and the trigger break of the Route runs once (D91) and is restored with `task988.sql` and `task988-verify.sql`.
- `supabase/sql_migrations/task988/task988.sql` was applied by the owner on 2026-11-26 (preflight 0 problems, verify rows 1-4 `ok = true`).

## Revision 3 (Review 3, 2026-11-26)

Starts from the owner's local commit "Task 988: the reviewed tree of Review 3, before Revision 3". One item per finding of [Review 3](../../docs/reviews/Task_988_Review_3.md); the exact edits are its "Revision 3 (executor)" items. Checklist A4, for holes in what the move of Scope 5 changes:
- R3-1 (F5): Scope 5 and AC6 gain the reserved CMS slugs: `admin` is a static route under `[locale]` since the move, so `src/lib/reserved-slugs.ts` reserves it, and `src/lib/__tests__/pureLibs.test.ts` [reserved slugs] reads the static folders of `src/app/[locale]` and `src/app/[locale]/(site)`; the test fails without `admin` in the list.
- R3-2 (F6): `src/app/robots.ts:23` disallows the admin under the slug with `'/*/admin$'`, `'/*/admin/'` and `'/*/admin?'` in place of `'/*/admin'`, which also matched public addresses whose segment starts with `admin` (`/sq/listings/administrative-…`, `/sq/administrata`); `src/app/__tests__/robots.test.ts:37` follows. The same prefix match of `'/*/auth'` and `'/*/cabinet'` is on `main` already: Task 1067.

## Revision 4 (Review 4, 2026-11-26)

Starts from the owner's local commit "Task 988: the reviewed tree of Review 4, before Revision 4". One item per finding of [Review 4](../../docs/reviews/Task_988_Review_4.md); the exact edits are its "Revision 4 (executor)" item. Checklist A4, for a hole in what the move of Scope 5 changes:
- R4-1 (F7): the UI section's "the admin shell, sidebar and header must render exactly as on `main`" gains the Stories: `AdminSidebar` and `AdminHeader` read the route after the language slug (`adminRouteOf`), so every Story `pathname` of an admin address carries the Storybook locale's slug (`'/admin…'` → `'/en/admin…'`, 22 rows in 15 Story files); `src/lib/auth/__tests__/adminPages.test.ts` gains a case that reads every Story file and fails for an admin `pathname` that `adminRouteOf` does not resolve.

## Revision 5 (Review 6, 2026-11-26)

Starts from the pushed commit 7ba9ef38d (pull request #83). One item per finding of [Review 6](../../docs/reviews/Task_988_Review_6.md), which reads the red jobs of CI run 45877879937 (checklist V14). Its "Revision 5 (executor)" item holds the exact edits. Checklist A4 applies, for what the move of Scope 5 reaches:
- R5-1 (F8): the admin under `/sq/…` makes the permissions page format its dates in a browser with no Albanian date data, and React fails hydration (#418). The page formats the dates on the server with `getFormatter()` (`next-intl/server`) and passes them to `AdminPermissionsView`, which renders them verbatim and no longer calls `useFormatter`. The look stays: each locale shows the text Node renders today. A test renders the view in `sq` with `Intl.DateTimeFormat` throwing.
- R5-2 (F9): `src/components/layout/Header.tsx` keeps 7ba9ef38d's `window.open(adminHref(locale, '/admin'), '_blank', 'noopener,noreferrer')`. A variable there fails `client-sinks.mjs` K7, and a hand-built address fails `adminSlug.test.tsx` [AC6]. Instead, the checker in `src/__tests__/security/clientSinks.test.ts:36` reads one level of nested parentheses, and a planted case proves it still flags a nested call without `noopener`. The permissions page's test mock of `next-intl/server` gains `getFormatter` (R5-1).
- R5-3 (F10): the 20 doc lines that name the files Scope 5 moved point to the current files. The 2026-11-06 audit record keeps its paths and adds "(moved by Task 988 to …)".

## Review

- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_988_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_988_Review_2.md)
- [Review 3 — NEEDS REVISION](../../docs/reviews/Task_988_Review_3.md)
- [Review 4 — NEEDS REVISION](../../docs/reviews/Task_988_Review_4.md)
- [Review 5 — APPROVED](../../docs/reviews/Task_988_Review_5.md)
- [Review 6 — NEEDS REVISION](../../docs/reviews/Task_988_Review_6.md)
- [Review 7 — APPROVED](../../docs/reviews/Task_988_Review_7.md)
