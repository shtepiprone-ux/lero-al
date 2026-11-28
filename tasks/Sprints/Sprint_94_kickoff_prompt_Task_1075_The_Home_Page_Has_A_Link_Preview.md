# Task 1075 — A link to the home page shows a preview card the server draws in the link's language

Sprint 94. Priority P3. Owner request 2026-11-27 (translated): "make it a separate task", on Opus's note after Task 989
that the home page carries no Open Graph tags. Owner decision O1075-1 (2026-11-27, the option chosen, translated): "Auto
generation: the server draws a 1200×630 card for each page: the logo and the page title in the link's language.
Listings keep their photo. The admin field becomes unnecessary." Split by checklist D4: 1075 the card and the home page;
1076 the catalogue, contact and CMS pages; 1077 the admin field leaves and a listing without a photo gets the card.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal
A link to `https://lero.al/<language>` shared in a messenger or a social network shows no preview card: the home page
serves no `og:` and no `twitter:` tag (read 2026-11-27 on production, below). After the task the home page of each
language carries Open Graph and Twitter tags whose image is a 1200×630 PNG the server draws: the saved logo (or the site
name) and the title and description the administrator saved for that language (Task 989).

## Cause
Read at 9b74f63a0
- `curl -s https://lero.al/uk | grep -o '<meta property="og:[^>]*>'` → nothing (2026-11-27; the same for `/sq`, `/en`,
  `/it`).
- `src/app/[locale]/(site)/page.tsx:24` exports only the page component: no `metadata` and no `generateMetadata`.
- `src/app/[locale]/(site)/layout.tsx:36-45` `generateMetadata` returns `title`, `description` and `icons` only.
- `git grep -n "ImageResponse\|next/og" -- src` → nothing: no code draws a share image.
Fix: one route draws the card of a language; the home page's `generateMetadata` returns `openGraph` and `twitter` that
point at it.

## Scope
- `src/app/[locale]/(site)/siteSeo.ts` (new, not a route file): `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION` and `readSettings`
  moved unchanged from `layout.tsx:17-28`; `OG_LOCALE` moved unchanged from `listings/[slug]/page.tsx:53-55`;
  `siteLocale(raw)` (a locale of `SITE_LOCALES`, else `'sq'`, as `layout.tsx:38`); `siteTitleAndDescription(settings,
  locale)` (the trimmed `meta_title_<locale>` / `meta_desc_<locale>`, else the defaults, as `layout.tsx:41-42`).
- `src/app/[locale]/(site)/layout.tsx` `generateMetadata`: uses the helpers above; output unchanged.
- `src/app/[locale]/(site)/listings/[slug]/page.tsx:53-55`: the local `OG_LOCALE` leaves; imported from `../../siteSeo`.
- `src/app/[locale]/(site)/share.png/route.tsx` (new): `GET(_, { params })` → `new ImageResponse(<card>, { width: 1200,
  height: 630, headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } })` from `next/og`
  (part of `next`; its bundled font `Geist-Regular.ttf` covers Albanian `ë ç`, Ukrainian `і ї є ґ` and `—`, read
  2026-11-27). The locale passes `siteLocale`; one `readSettings([meta_title_<locale>, meta_desc_<locale>, 'logo_url',
  'site_name'])`. The card: background `theme.colors.brand[7]`, text white; the logo when `isBrandImageUrl(logo_url)`,
  fetched by the server as PNG (`/upload/` → `/upload/h_96,f_png/`) with `AbortSignal.timeout(3000)` and passed as a
  data URL, else `site_name` (else `Lero.al`) as text; the title, then the description, each cut to fit (title 90,
  description 200 characters). The path ends in `.png`, so `src/proxy.ts:133` does not run on it (no session, no cookie).
- `src/app/[locale]/(site)/page.tsx`: new `generateMetadata({ params })`: returns only `openGraph` (`type: 'website'`,
  `url: ${siteUrl}/${locale}`, `siteName: 'Lero.al'`, `locale: OG_LOCALE[locale]`, `title`, `description`, `images:
  [{ url: ${siteUrl}/${locale}/share.png, width: 1200, height: 630, alt: title }]`) and `twitter` (`card:
  'summary_large_image'`, `title`, `description`, `images: [that url]`); `siteUrl` as the listing page
  (`process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'`). The page body does not change.
- Dependencies: none (`next/og` ships with `next@16.4.5`).
- Out of scope: the catalogue, contact and CMS pages (Task 1076); the "OG image URL" field, `og_image`,
  `public/og-default.png` and a listing without a photo (Task 1077); `alternates` (Task 1036).
- Kept as on `main` (checklist A2): `layout.tsx` — the same title, description and single favicon for every language
  and the same fallbacks when the read fails; `listings/[slug]/page.tsx` — the same Open Graph and Twitter output (the
  four `OG_LOCALE` values unchanged, the cover photo); `page.tsx` — the page body, its sections, reads and favourites.

## Attack surface
1. Working on: a new anonymous `GET /<locale>/share.png`; it reads four public settings with the service-role reader
   `getSettings` (as the layout does) and fetches the saved logo from the account's Cloudinary.
2. What can go wrong, and the response:
   - T1 — D: requests that make the server draw a card each time → mitigate: the response carries
     `public, s-maxage=3600` (one draw per locale per hour at the CDN); the locale is one of four, so the cache holds at
     most four cards → AC3.
   - T2 — I/S: a server-side fetch to an address taken from a setting (SSRF) → mitigate: only a URL
     `isBrandImageUrl` accepts (https, the account's Cloudinary host, no credentials or port), with a 3 s timeout;
     anything else draws the text → AC3.
   - T3 — T: a setting that carries markup into the image → mitigate: the card renders text nodes only, cut to
     length; no HTML is parsed → AC2.
   - T4 — I: settings other than the four public ones leak → mitigate: the read lists exactly those keys → AC2.
   - T5 — D: the logo fetch fails or hangs → mitigate: the timeout and the text fallback; the card still answers 200 →
     AC3.
3. Authorization matrix: `GET /<locale>/share.png` — anonymous, signed-in, staff: allowed (public, read-only).

## OWASP
- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T5 of the attack surface, each with its test — AC2, AC3.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the new route is the one added entry point, listed with its reachers in the matrix row — AC3.
- Authorization: not applicable — the route is public by design and the settings keep their admin-only save.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is made; the four settings are meant for every visitor.
- Authorization_Patterns: not applicable — no protected resource or enforcement point is added or moved.
- Authorization_Regression_Testing: not applicable — no role, guard or permission check changes in this task.
- Authorization_Testing_Automation: not applicable — the matrix row is a public read with no role difference.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — the card is a cached public image: the CDN answers repeats, one draw per locale per hour — AC3.
- Clickjacking_Defense: not applicable — the response is an image, and `src/proxy.ts` is read, not changed.
- Content_Security_Policy: not applicable — no page or header policy changes; `src/proxy.ts` is not edited.
- Credential_Stuffing_Prevention: not applicable — the route takes no credentials and has no sign-in step.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the values pass the save rules, reach the page only through the Next.js Metadata API (escaped attributes) and the card only as text nodes — AC1, AC2.
- DOM_based_XSS_Prevention: not applicable — no client code changes; tags and card are made on the server.
- Denial_of_Service: "Using validation that is cheap in resources first" — the locale is checked against four values before any read, the texts are cut to length, the logo fetch has a 3 s timeout, and the CDN caches the card — AC3.
- File_Upload: not applicable — nothing is uploaded; the route only reads the logo the admin saved earlier.
- HTTP_Headers: "Repeat the security headers in each such block" — the image response keeps the site headers of `next.config` and adds only `Cache-Control` — AC3.
- HTTP_Strict_Transport_Security: not applicable — no response header policy changes; `src/lib/security/headers.ts` stays as on `main`.
- JavaScript_and_TypeScript_Security: not applicable — no merge helper, regular expression or dynamic evaluation is added.
- Key_Management: not applicable — no key is created, read or used beyond the existing settings reader.
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the route reads and draws exactly four public settings, no other field — AC2.
- React_Security: "Validate every argument as untrusted input" — the only argument, the locale, is reduced to one of four values; the setting texts are drawn as text — AC2, AC3.
- Secrets_Management: not applicable — no secret is added; the reader uses the existing server key.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the diff and reruns each claim and break — AC2, AC3.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added (`next/og` ships with `next`); the reviewer reruns every claim of the report — AC1, AC2, AC3, AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threats T1-T5 are acceptance criteria with tests — AC2, AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section answers them for the new route — AC2, AC3.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — the logo is fetched only over https (`isBrandImageUrl` refuses `http:`) — AC3.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — the logo is fetched by the server, not by the viewer's browser, and the card carries no personal data — AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and both deliberate breaks — AC2, AC3.
- Web_Cache_Security: "Default to preventing shared caching for authenticated, personalized, tenant-specific, or otherwise sensitive responses." — the card is the same for every visitor of a language, the proxy (session, cookies) does not run on `.png`, so the shared cache keeps only public data — AC3.
- Web_Frontend_Security: not applicable — no `innerHTML` or client rendering of the values is added.

## UI
No visible change on the site: the tags are in the `<head>`. The card is an image for other sites' previews; its colours
come from `src/design-system/mantine/theme.ts` (`brand[7]` `#EC5447`, `:614-615`).

## Mobile adaptation record
- Scope: none

## Acceptance criteria
- AC1 The home page of each language points at its own card and carries its own saved title and description — test:
  `src/app/[locale]/(site)/__tests__/homeMetadata.test.ts` (new): with `getSettings` mocked, for `sq`, `en`, `uk`, `it`
  the exact `openGraph` (`type`, `url`, `siteName`, `locale` from `OG_LOCALE`, `title`, `description`, `images[0]` =
  `${siteUrl}/<locale>/share.png` 1200×630) and `twitter` (`card`, `title`, `description`, `images`); no `title`,
  `description` or `icons` key; an unknown locale gives `sq`; a failed read gives the defaults.
- AC2 The card shows the language's title and description as text and reads only four settings — test:
  `src/app/[locale]/(site)/share.png/__tests__/shareCard.test.ts` (new), `next/og` mocked to capture the element and
  options: for each locale the keys read are exactly `meta_title_<locale>`, `meta_desc_<locale>`, `logo_url`,
  `site_name`; the element's text holds the saved title and description, cut at 90 and 200 characters; a value with
  `<script>` appears as text; empty settings give `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION` and `Lero.al`.
- AC3 The card is bounded and never fetches a foreign address — test: `src/app/[locale]/(site)/share.png/__tests__/shareCard.test.ts`: width 1200, height 630, the
  `Cache-Control` header exact; an unknown locale draws `sq`; a `logo_url` outside the account's Cloudinary
  (`SEC-1075-LOGO-HOST-DENY`: another host, `http:`, a port, credentials) is never fetched and the text is drawn; a
  fetch that rejects or times out draws the text and the response is still made (`SEC-1075-LOGO-FAIL-ALLOW`); an
  accepted logo is fetched once with a timeout signal and passed as a `data:image/png` URL.
- AC4 The layout and the listing page keep their metadata — test: `src/app/[locale]/(site)/__tests__/siteLayout.test.tsx`,
  `src/app/[locale]/__tests__/layoutBrand.test.ts`,
  `src/app/[locale]/(site)/listings/[slug]/__tests__/closedListing.security.test.ts`,
  `src/app/[locale]/(site)/listings/[slug]/__tests__/listingAccessRestricted.security.test.ts`, unchanged and passing.
- AC5 CI is green — test: `gh pr checks <n>`.

## Route
1. Branch from `main`. Read the files of the Scope, `src/proxy.ts:132-134`, `src/lib/uploads/imageUrl.ts:59-75` and
   the tests of AC4.
2. Write `homeMetadata.test.ts` and `shareCard.test.ts` first; save their failing output.
3. The Scope, then one pass over every changed file (checklist I7).
4. Run (checklist A5, nothing else locally): `npm test -- "src/app/[locale]/(site)/__tests__/homeMetadata.test.ts"
   "src/app/[locale]/(site)/share.png/__tests__/shareCard.test.ts" "src/app/[locale]/(site)/__tests__/siteLayout.test.tsx"
   "src/app/[locale]/__tests__/layoutBrand.test.ts"
   "src/app/[locale]/(site)/listings/[slug]/__tests__/closedListing.security.test.ts"
   "src/app/[locale]/(site)/listings/[slug]/__tests__/listingAccessRestricted.security.test.ts"`; the four existing files
   are every test both searches of `quality-gates.md` §8.1 find (2026-11-27, `9b74f63a0`). On the dev server open
   `http://localhost:3000/uk/share.png` and `/sq/share.png` and attach both images to the report. CI on GitHub after
   the owner's push: `gh pr checks <n>`.
5. Report: each command, exit code, relevant output; the failing-first output; the deliberate break of each `SEC-1075`
   check (the host check removed; the catch removed) and its failing output, restored.

## Review
