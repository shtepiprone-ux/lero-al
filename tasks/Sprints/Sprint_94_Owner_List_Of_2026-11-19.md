# Sprint 94 — the owner's list of 2026-11-19

Opened 2026-11-19 by owner instruction (translated): "I collected a lot of bugs; they need to be structured and added to
the existing tasks, or new ones created if there is nowhere to attach a bug." Opus read the code, the live database
(read-only) and production (anonymous requests) for every item on 2026-11-19. Each item below names the task that
carries it, the facts read, and what is still `UNKNOWN`. A task here has a registry row in `docs/backlog.md`; its
kickoff is written by `create-task` (cause, OWASP plan, tested acceptance criteria) before it starts.

## Where each item went

| Owner item | Task | Sprint |
|---|---|---|
| 1 the chosen language is lost (site and admin) | 988 | 94 |
| 2 photo number in the top-left corner; 3 the price field | 997 | 94 |
| 4 `[slug]/loading.tsx` layout still Tailwind (Task 792 review note N1) | 1004 | 71 |
| 5 is `expired` publicly reachable? Owner: no, only admin, moderator and owner | decision recorded; 805 retired | 73 |
| 8 notifications page; 14 drawer buttons | 993 | 94 |
| 9 private person → agent as a one-way upgrade | 994 | 94 |
| 10 listing title 24px; 12 contact card first on a phone; 24 verified mark tooltip; 25 message length hint | 995 | 94 |
| 11 card price, price per m², ID and date at the bottom; 13 "View all" at the right edge on a phone | 996 | 94 |
| 15 sold and rented listings listed for search engines, behind an admin switch | 992 | 73 |
| 16 houses get the apartment filters; 17 parking attribute and filter | 1001 | 94 |
| 19 logo, favicon and the other site settings applied on the site | 989 | 94 |
| 20 a page the admin creates reaches the site; editor styles and symbols; 21 the three pages fixes | 990 | 79 |
| 22 verify a user from the admin profile; the owner's answer to O994-2: staff cannot give the badge today | 998 | 94 |
| 23 "the pre-existing unrelated task861 file" | answered, nothing open | — |
| 26 privacy policy and terms (two reference sites) | 1005 | 79 |
| 27 reports count after a delete | 1000 | 94 |
| 28 deep security review of the whole project, then security tests | 1003 | 93 |
| 29 slow pages on the site and in the admin | 1002 | 94 |
| 30 sign-up with an e-mail that already has an account | 991 | 94 |
| 31 premium period and end date in the admin listings table | 999 | 94 |
| 32 a blocked account asks for a password reset (with O991-2) | 991 | 94 |

## Facts per task

**988 — the chosen language.** `src/i18n/routing.ts:9` sets `localeDetection: false`, so the proxy
(`src/proxy.ts:75-76`) sends every address without a language prefix to the default `sq`. Four notification writers
store a link without the prefix: `src/modules/listings/actions/applyListingTransition.ts:149`,
`src/modules/listings/actions/reportListing.ts:115` and `:259`, `src/modules/listings/actions/submitListingInquiry.ts:175`;
the saved-search cron writes `/sq/` into the link (`src/app/api/cron/saved-searches/route.ts:147`); the bell renders the
stored link as it is (`src/modules/notifications/components/NotificationItem.tsx:289`). So every notification opens in
Albanian. The admin reads its own cookie `admin-locale` with the default `en` (`src/lib/admin/getAdminLocale.ts:6-12`).
`UNKNOWN`: the link that loses the language after a listing is created (the form itself keeps it:
`src/modules/listings/components/ListingFormShell.tsx:71,79,249,259,269`) and the admin's unstable case; the task
reproduces both with the `.env.local` test accounts first. Overlaps audit finding P-06 (Task 959 renders the link
through the URL guard): the two tasks change the same line and are ordered in the kickoff.

**989 — site settings.** The admin saves `logo_url`, `logo_dark_url`, `favicon_url`, `contact_email`,
`contact_phone`, `meta_title`, `meta_desc` and the general `tagline` (`src/modules/admin/actions/index.ts:287-288`),
and no page reads any of them: the header draws the text "Lero.al" (`src/components/layout/HeaderView.tsx:112-117`),
the favicon is the static `src/app/favicon.ico`, the footer tagline comes from the footer editor
(`src/components/layout/Footer.tsx:25`). The task applies each field on the site, or removes the field from the form.

**990 — CMS pages.** Measured 2026-11-19: an anonymous `select` on `pages` returns the 3 published rows, and
`/sq/about`, `/sq/privacy-policy` and `/sq/terms-of-service` answer 200 with their titles; so item 21 (1) already holds.
A publish without an Albanian body is refused (`sq_body_required`, `src/modules/admin/actions/index.ts:341,381`): item 21
(2) already holds. The footer accepts a page slug only when a published `pages` row has it
(`src/modules/admin/actions/footer.ts:115-124`): item 21 (3) already holds. The page route answers 404 when neither the
visitor's language nor `sq` has a title or body (`src/app/[locale]/[slug]/page.tsx:57-64`). `UNKNOWN`: why the owner's
new page did not appear; the task reproduces it with `HYDRATION_ADMIN` first. The editor offers bold, italic,
underline, strike, h2-h4, lists, quote, link, alignment, undo and redo in five menus
(`src/design-system/mantine/patterns/MantineRichTextEditor.tsx:241-353`); no special characters, no font size or colour.

**991 — sign-up with an existing e-mail.** `signUpWithCaptcha` returns `ok` whenever Supabase returns no error
(`src/modules/auth/actions/captcha.ts:34-41`). `INFERENCE:` Supabase answers an address that already has a confirmed
account without an error, to avoid revealing it; the task confirms this on the real Auth before the fix. A message
"this e-mail already has an account" tells anyone which addresses are registered (OWASP Authentication: account
enumeration). Owner decision O991-1 (2026-11-19): the same neutral message, plus an e-mail to the existing address ("you already
have an account: sign in or reset your password"). Owner decision O991-2 (2026-11-19, translated): "I agree with
sending the e-mail, but it is still poor UX when the user does not understand why they cannot get into their account.
The system cannot change their password through a reset request if the admin blocked them." So 991 also carries item
32: a blocked account that signs in with its right password is told that it is blocked and how to reach support, and a
reset or sign-up request for a blocked address sends a mail that says the account is blocked instead of a link. The
status is shown only to whoever proves the address or the password, never to a request that proves neither.
`UNKNOWN`: whether Supabase checks the password before it answers `user_banned`; the task measures it first, and if
the ban is answered before the password, the message comes from a check that runs after the password.

**992 — sold and rented listings listed.** Measured 2026-11-19 on production: an anonymous visitor opens a sold and a
rented listing by its address (200, the listing's title in the page, no `noindex`), and an expired one shows the closed
page (`noindex`); this is Task 956's rule (`src/modules/listings/lib/visibility.ts:38-42`). The sitemap lists only
active, unexpired listings (`src/app/sitemap.ts:61`). Sold and rented listings get `noindex` after
`archived_noindex_days` (`src/app/[locale]/listings/[slug]/page.tsx:93`). The admin switch puts sold and rented listings
into the sitemap. Owner decision O992-1 (2026-11-19, translated): "I agree with the recommendation. Sold and rented
are seen only in a separate tab." The site already lists them only in the "Sold and rented" tab of `/listings`
(`tab=closed`, `src/app/[locale]/listings/page.tsx:46`; measured anonymously 2026-11-19: both listings are on it), and
the main results stay without them. The switch changes the sitemap only; D73-1 holds for search.

**993 — notifications.** No notifications page exists (`src/app/[locale]/` has none); the drawer has a "mark all as
read" text button in the header row (`src/modules/notifications/components/NotificationCenter.tsx:49-74`) and no "show
all" control. The task adds the page (list on the left, the open notification on the right, read when opened) and the
drawer layout the owner described.

**994 — agent upgrade.** The profile switches private/agent both ways (`src/modules/cabinet/components/ProfileTab.tsx:295-309`,
saved at `src/modules/cabinet/actions/index.ts:225`), while agent statistics follow `users.role`, not the self-chosen
`user_type` (`src/modules/cabinet/statistics/access.ts:9`). Owner decision O994-1 (2026-11-19): the agency name and the
phone number are required. Owner decision O994-2 (2026-11-19): the agent functions open at once; the "Verified" badge
is given by an admin or a moderator (Task 998).

**995 — listing page.** The title uses `TITLE_FZ.h2` (`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:202`;
`src/design-system/mantine/typography.ts:39`: 20px below 640, 24, 30, then 36px); 24px is the `h4` token
(`src/design-system/mantine/theme.ts:660`). "Recently viewed" and "Similar listings" sit inside the left column
(`src/modules/listings/components/ListingDetailView.tsx:395-398`) and the contact card is the right column
(`MantineListingDetailPattern.tsx:310-312`), so on a phone the card comes after both. The verified mark is an icon with
an `aria-label` and no tooltip (`MantineListingContactPattern.tsx:302`). The send button stays disabled until the message
has 20 characters (`src/modules/listings/components/ListingInquiryDialog.tsx:45`), and nothing says so.

**996 — cards and "View all".** The grid card body is a `Stack` that does not grow, and its footer (price, price per m²,
ID and date) follows the content directly (`src/design-system/mantine/patterns/MantineListingCardPattern.tsx:212-239,301-305`),
so cards of one row put it at different heights. `ViewAllLink` is full width and centred below 640px
(`src/components/shared/ViewAllLink.tsx`: `w={{ base: '100%', sm: 'auto' }}`, `justifyContent: 'center'`).

**997 — listing form.** The photo number sits bottom-left (`src/modules/listings/components/ImageUpload.tsx:170-173`).
The price field already drops every character that is not a digit, dots and commas included
(`src/modules/listings/domain/priceDigits.ts:16`, used at `ListingFormShellView.tsx:226`); the only price message is
"Please enter a valid price" (`messages/en.json:273`). `UNKNOWN`: the input that produced the owner's error; the task
reproduces it. Owner decision O997-1 (2026-11-19, translated): "I agree with the recommendation. A comma would be
superfluous." The price is a whole number; a dot is the thousands separator, and a space or a comma is removed as it is
typed.

**998 — the "Verified" badge.** The users table toggles verification through `toggleUserVerified`
(`users.verify` key, `src/modules/admin/actions/index.ts:212-215`); the profile view only shows the badge
(`src/components/admin/AdminUserProfileView.tsx:506-510`). With O994-2 the owner reported (2026-11-19, translated): "as
admin or moderator I cannot give this badge now, the function in the admin does not work." Read 2026-11-19: the table's
handler ignores the action's answer and always shows the success message (`src/components/admin/AdminUsersTable.tsx:85-90`),
so a refused or failed change looks done; the moderator role holds `users.verify` (`role_permissions`, read-only);
3 accounts are verified. `UNKNOWN`: why the owner's change fails; the task reproduces it with `HYDRATION_ADMIN` and
`HYDRATION_MODERATOR` first, then fixes it, shows a failure as an error, and adds the control to the profile.

**999 — premium period.** The database keeps `is_premium` and `premium_until` only; the admin grants 30, 90, 180 or
365 days (`src/components/admin/PremiumDialog.tsx:28-31`), and the chosen period is not stored. The task stores it
(SQL, applied by the owner) and shows it. Related: Task 933 (the card badge ignores `premium_until`).

**1000 — reports count.** The tab counts are computed from the loaded rows (`src/components/admin/AdminReportsManager.tsx:66-70`)
and a delete removes the row (`:84`). `UNKNOWN`: which count the owner saw unchanged; the task reproduces it with
`HYDRATION_ADMIN` first.

**1001 — filters.** The house filters lack `layout_features` that apartments have
(`src/modules/listings/domain/propertyTypeSchema.ts`, `SCHEMA_HOUSE` and `SCHEMA_APARTMENT`). No listing column holds
parking, and the `amenities` table is empty and read by no code (read-only query 2026-11-19). The parking attribute
(private, street, none) is a new column (SQL, applied by the owner), a form field, a detail line and a filter.

**1002 — performance.** Measured 2026-11-19, anonymous, three requests each: `/uk` 0.33-0.45 s to the first byte and
299 KB of HTML; `/uk/listings` 0.45-0.58 s and 604 KB; `/uk/about` 0.25-0.36 s and 282 KB. Signed-in pages and the
admin are not measured yet. The proxy refreshes the session on every request it sees, the admin included
(`src/proxy.ts:69`). The task measures every role on real routes first, names the cause, then fixes it.

**1003 — security review.** The 2026-11-06 audit (`docs/security/audit-2026-11-06/findings.md`) is being closed by
Sprint 93's open security tasks. 1003 repeats the audit on the current `main` after them: every entry point (server
actions, routes, admin pages, policies per command), each finding fixed with its security test or handed to a task.

**1004 — loading skeleton.** Task 792 moved `[slug]/loading.tsx` to the Mantine `Skeleton` only; its layout classes stay
Tailwind (792 review note N1, archive ledger), and no open task carried it.

**1005 — legal pages.** The privacy policy and the terms are CMS pages (`privacy-policy`, `terms-of-service`); the
owner gave two reference sites. The task drafts both from what the site really processes (accounts, listings,
messages, Cloudinary, Sentry, the mail provider, Turnstile, Vercel), in the four languages, for the owner's approval.

**991 (item 32) — reset for a blocked account.** A blocked account is banned in Supabase Auth
(`src/lib/auth/accountAccess.integration.test.ts:30`: sign-in answers `user_banned`). The mail hook sends the reset
link without reading the account's status (`src/app/api/auth-email-hook/route.ts:303-311`). `UNKNOWN`: whether the
link then opens a session for a banned account; 991 measures it (see O991-2).

**Item 23.** The file was `docs/sessions/evidence/task861/storybook-dev.log`, a Storybook log of Task 861
(2026-09-20) that the Task 867 review saw as an unrelated change
(`docs/reviews/2026-09-23-task867-cms-read-path-footer-slug-validation.review-ledger.json`). The governance reset
(PR #19) deleted it; nothing is open.

## Owner decisions

All answered by the owner on 2026-11-19 and recorded above: O991-1, O991-2, O992-1, O994-1, O994-2, O997-1. No task of
this sprint waits for an owner decision before its kickoff.
