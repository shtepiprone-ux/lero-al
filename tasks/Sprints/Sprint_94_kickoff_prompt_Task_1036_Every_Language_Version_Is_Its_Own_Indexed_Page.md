# Task 1036 — Every language version of a public page is its own indexed page

Sprint 94. Priority P2. Owner request 2026-11-24 (translated): "the interface is localised in sq, en, uk, it; only the listing's title and
description are user content in the author's language: keep them as written, no automatic translation, no external or AI service; localise the
SEO title and meta description from system templates and the structured characteristics; a self-referencing canonical per language version;
reciprocal hreflang sq, en, uk, it and x-default (sq if that is what the platform does); html lang equal to the interface language; keep all
four versions in the sitemap; no noindex for a real listing because its text is not translated; keep the protection of test listings; change no
listing flow; no new external cost; after indexing, watch the Google-selected canonical in Search Console".
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The public pages tell search engines nothing about their language versions: no canonical, no hreflang, and the meta description of the home
and catalogue is Albanian on every language. After the task each public page names itself as canonical and all four language versions plus
`x-default` (sq), and the SEO title and description of the home, the catalogue and every listing are written in the page's language from
templates and the listing's characteristics, while the listing's own title and description stay as the author wrote them.

## Cause

Read at `f36b68bad`
- No public page sets `alternates`: `grep -rn "alternates" "src/app/[locale]"` → nothing; the listing page uses its canonical address only for Open Graph (`src/app/[locale]/listings/[slug]/page.tsx:122`, `:134`). Live, 2026-11-24: `curl https://lero.al/en/listings/qera-apartament-11-lqeni-i-tiranes-kompleksi-nobis-mwtdj43u` → no `rel="canonical"`, no `rel="alternate" hreflang`.
- The site description is one Albanian string for every language (`src/app/[locale]/layout.tsx:16-19`), so `https://lero.al/en` and `/en/listings` serve `content="Gjeni shtëpinë tuaj të ëndrrave në Shqipëri"`; the catalogue sets a title only (`src/app/[locale]/listings/page.tsx:17-22`).
- A listing's SEO title and description are its user content (`page.tsx:104-127`: `${data.title} | Lero.al`, the description built from `data.description`), the same text on all four languages.
- Facts the Fix relies on: `<html lang={locale}>` (`src/app/layout.tsx:40`) already follows the language; `/` answers 307 to `/sq` (`curl -s -o /dev/null -w "%{redirect_url}" https://lero.al/` → `https://lero.al/sq`), so sq is the platform default; `property_types` has `name_sq`, `name_en`, `name_uk`, `name_it`; `locations` has `name_al` and `name_en` (215 of 216 set); `listing.sale` and `listing.rent` are translated in `messages/*.json`; the sitemap lists every public listing in all four languages (`src/app/sitemap.ts:61-73`).
- Google (Search Central, read 2026-11-24): "If two pages don't both point to each other, the tags will be ignored." and "Each language version must list itself as well as all other language versions." (localized-versions); "make sure to specify a canonical page in the same language" (consolidate-duplicate-urls); pages are "only considered duplicates if the main content of the page remains untranslated" (localized-versions).

Fix: one helper builds the alternates of a public path (self canonical, sq/en/uk/it, `x-default` = sq); the home, catalogue, listing, contact and CMS pages return it; the site and catalogue descriptions and the listing's SEO title and description come from message templates in the page's language.

## Scope

- `src/lib/seo/alternates.ts` (new): `localeAlternates(locale, path)` → `{ canonical: SITE_URL/<locale><path>, languages: { sq, en, uk, it, 'x-default': SITE_URL/sq<path> } }` (absolute URLs from `src/lib/siteUrl.ts`; `path` already encoded by the caller; the locales from `src/i18n/routing.ts`).
- `src/app/[locale]/layout.tsx`: `export const metadata` becomes `generateMetadata`: title and description from `seo.site_title` and `seo.site_description` in the locale.
- `src/app/[locale]/page.tsx` (home): `generateMetadata` with `alternates: localeAlternates(locale, '')`.
- `src/app/[locale]/listings/page.tsx` `generateMetadata`: adds `description` (`seo.listings_description`) and `alternates: localeAlternates(locale, '/listings')`; the canonical carries no query string, so filtered and paged catalogue addresses consolidate to the catalogue.
- `src/app/[locale]/listings/[slug]/page.tsx` `generateMetadata`, indexable branch only: `title` and `description` from `seo.listing_title` and `seo.listing_description` (property type in the locale from `property_types.name_<locale>`, `listing.sale`/`listing.rent`, the city `name_al` for sq and `name_en` otherwise falling back to `name_al`, rooms, area, price with currency; a part with no value is left out) plus `alternates: localeAlternates(locale, '/listings/' + encodeURIComponent(slug))`. Open Graph and Twitter keep the author's title and text as today. The noindex branches (hidden, non-public, closed past `archived_noindex_days`, synthetic) are unchanged and get no alternates.
- `src/app/[locale]/contact/page.tsx` and `src/app/[locale]/[slug]/page.tsx` (CMS): `alternates` for their own path; the CMS title keeps its sq fallback.
- `messages/{sq,en,uk,it}.json`: the namespace `seo` with `site_title`, `site_description`, `listings_description`, `listing_title`, `listing_description` (ICU placeholders), written for each language.
- Dependencies: none (no external service).
- Out of scope: the listing's title and description (user content, unchanged); the sitemap (keeps four versions; hreflang is given in HTML, which Google treats as equivalent); cabinet, auth and favorites pages (not public); robots; Search Console monitoring (the owner's, after indexing).
- Kept as on `main` (checklist A2): every page's content, routes, redirects and `<html lang>`; the noindex rules of Tasks 923 and 1035; the sitemap; the visible page title inside the page; Open Graph images and titles.

## Attack surface

Unchanged: the pages render the same data; the new metadata takes the locale from the route, a slug already validated by the page's read, and characteristics from the listing row; values are escaped by Next's metadata rendering; no entry point, role or data access changes.

## OWASP

- Abuse_Case: not applicable — head metadata only; no action, limit or business step changes.
- Business_Logic_Security: not applicable — no listing flow, status or publication rule changes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — values reach the head only through Next's metadata API, which escapes them; the user's text no longer enters the SEO title and description — AC2.
- DOM_based_XSS_Prevention: not applicable — server metadata only; no client code or DOM sink.
- Input_Validation: not applicable — the locale comes from the route list and the slug from the page's own read.
- JavaScript_and_TypeScript_Security: not applicable — string templates only; no merge or regular expression over input.
- Mass_Assignment: not applicable — nothing is written by the task.
- Nextjs_Security: not applicable — no Server Action or route handler changes; page metadata only.
- OAuth2: not applicable — sign-in and its tokens are untouched; head metadata only.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys.
- React_Security: not applicable — no component or prop changes in the task.
- Unvalidated_Redirects_and_Forwards: not applicable — no redirect changes; canonical and alternate URLs are built from SITE_URL and the route.
- Web_Frontend_Security: not applicable — no HTML sink or script is added by the task.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the Cause is measured on the live site and cites Google's pages read the same day — AC1-AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the type check, the tests and the breaks and reads the rendered head — AC1-AC3.

## UI

No visible change: head metadata only (title tag, meta description, link tags).

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The alternates are complete and reciprocal — test: `src/lib/seo/__tests__/alternates.test.ts` (new): for each locale the canonical is its own absolute URL, `languages` has sq, en, uk, it and `x-default` = the sq URL, every URL starts with `SITE_URL`.
- AC2 A listing's metadata is localised and self-canonical — test: `src/app/[locale]/listings/[slug]/__tests__/listingSeoMetadata.test.ts` (new): an active listing in `en` and in `uk` → the title and description come from the templates in that language with the property type of that language, contain neither the author's description text nor Albanian template text, and `alternates` is `localeAlternates(locale, '/listings/<slug>')`; a hidden, a closed-past-limit and a synthetic listing keep their noindex metadata and have no alternates (`closedListing.security.test.ts` stays green).
- AC3 The site and catalogue metadata follow the language — test: `src/app/[locale]/__tests__/localeMetadata.test.ts` (new): the layout's description in `en` is the `en` template (not the Albanian string); home and catalogue return their alternates; the catalogue's canonical has no query string.
- AC4 The texts exist in four languages — test: the CI i18n parity check, read with `gh pr checks <n>`; locally `npm run typecheck` (checklist I8).
- AC5 The CI jobs pass — test: `gh pr checks <n>` after every check has concluded.

## Route

1. Work on the branch the owner created from `main` (checklist H1); Task 1038 runs first (owner, 2026-11-25: "1038 has priority").
2. Tests first (AC1-AC3); save each failing output.
3. The helper, the metadata, the messages.
4. Run: `npm run typecheck`, then `npm test -- src/lib/seo/__tests__/alternates.test.ts "src/app/[locale]/listings/[slug]/__tests__/listingSeoMetadata.test.ts" "src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts" "src/app/[locale]/listings/[slug]/__tests__/listingAccessRestricted.security.test.ts" "src/app/[locale]/[slug]/__tests__/page.errors.test.ts" "src/app/[locale]/__tests__/localeMetadata.test.ts" src/app/__tests__/sitemap.security.test.ts`; then the 54 existing tests that import `messages/<locale>.json` (checklist D10, found 2026-11-25 by `grep -rlE "messages/(sq|en|uk|it)(\.json)?['\"]" src --include=*.test.ts --include=*.test.tsx`): `npm test -- src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx src/components/admin/__tests__/AdminCompaniesManager.logo.security.test.tsx src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/adminDeleteDialog.security.test.tsx src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/components/admin/__tests__/adminPagesHydration.test.tsx src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/components/admin/__tests__/AdminShell.pages.test.tsx src/components/admin/__tests__/AdminSidebar.pages.test.tsx src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx src/components/admin/__tests__/AdminUserCreate.watch.test.tsx src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/components/admin/__tests__/savedRowRelativeTime.test.tsx src/components/admin/__tests__/StackedConfirmDialogs.test.tsx src/components/admin/__tests__/StatusChangeSelect.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx src/components/shared/__tests__/Combobox.portal.test.tsx src/components/ui/__tests__/overlays.test.tsx src/components/ui/__tests__/primitives.test.tsx src/components/ui/__tests__/uiPrimitivesExtra.test.tsx src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/__tests__/badgeTones.test.ts src/modules/admin/dashboard/components/__tests__/AdminDashboardView.axis.test.tsx src/modules/auth/components/AuthSheet.banned.security.test.tsx src/modules/auth/components/ResetPasswordClient.security.test.tsx src/modules/auth/components/__tests__/authClientParts.test.tsx src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx src/modules/auth/components/__tests__/AuthSheet.registerAgent.test.tsx src/modules/auth/components/__tests__/AuthSheet.test.tsx src/modules/auth/components/__tests__/resetPassword.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/modules/cabinet/statistics/components/__tests__/AgentStatisticsView.axis.test.tsx src/modules/listings/components/form/__tests__/fieldContracts.test.tsx src/modules/listings/components/ListingInquiryDialog.session.security.test.tsx src/modules/listings/components/listingStatusOptions.security.test.tsx src/modules/listings/components/__tests__/ListingAccessRestrictedView.security.test.tsx src/modules/listings/components/__tests__/ListingCard.hydration.test.tsx src/modules/listings/components/__tests__/ListingContact.bot.security.test.tsx src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx src/modules/listings/components/__tests__/ListingInquiryDialog.bot.security.test.tsx src/stories/fixtures/__tests__/ListingFormHarness.test.tsx src/__tests__/reactHooksV7Components.test.tsx src/__tests__/reactHooksV7Shells.test.tsx`, each one green. Deliberate breaks: drop `x-default` → AC1 fails; the author's description back into the listing description → AC2 fails; the Albanian layout description back → AC3 fails; each restored.
5. Report: each command, exit code, relevant output, each break and its result. The reviewer reads the head of the four language versions of one listing, the home and the catalogue on `localhost:3000`.

## Review
