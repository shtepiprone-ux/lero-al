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
| 19 logo, favicon and the other site settings applied on the site | 989, 1006 | 94 |
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
| added 2026-11-19: the "Message" field can be made taller, as in the owner's screenshot | 1008 | 94 |

## Facts per task

**988 — the chosen language.** `src/i18n/routing.ts:9` sets `localeDetection: false`, so the proxy
(`src/proxy.ts:75-76`) sends every address without a language prefix to the default `sq`. Four notification writers
store a link without the prefix: `src/modules/listings/actions/applyListingTransition.ts:149`,
`src/modules/listings/actions/reportListing.ts:115` and `:259`, `src/modules/listings/actions/submitListingInquiry.ts:175`;
the saved-search cron writes `/sq/` into the link (`src/app/api/cron/saved-searches/route.ts:147`); the bell renders the
stored link as it is (`src/modules/notifications/components/NotificationItem.tsx:289`). So every notification opens in
Albanian. The admin reads its own cookie `admin-locale` with the default `en` (`src/lib/admin/getAdminLocale.ts:6-12`).
Measured 2026-11-19 on production (998/988 design): an address without a language prefix goes to `/sq/…` also when the
visitor's `admin-locale` or `NEXT_LOCALE` cookie says `uk` (`curl` of `/`, `/cabinet?tab=listings` and a listing →
307 to `/sq/…`), so the root page's cookie choice (`src/app/page.tsx:12-16`) is never reached; the stored links are
`/listings/<slug>` (55 status changes, 4 report outcomes) and `/cabinet?…` (34 saved-search rows). With the admin
language set to `uk`, `/admin/email-templates` renders its heading in Albanian: the page translates without
`getAdminLocale()` (`src/app/admin/email-templates/page.tsx:14`), so the default `sq` of `src/i18n/request.ts:7-9`
applies; `/admin/users/[id]` reads `getLocale()` the same way (`src/app/admin/users/[id]/page.tsx:88`); 17 admin pages
keep a fixed English or Ukrainian tab title (`export const metadata`). Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md`; it takes P-06's render part from 959.
The listing form keeps the language (`src/modules/listings/components/ListingFormShell.tsx:71,79,249,259,269`);
`INFERENCE:` the owner's "after a listing is created" is the moderation notification that follows, and Opus repeats the
flow on production after the merge. Audit finding P-06 planned the same `NotificationItem` line for Task 959: 988
renders the link through `safeNextPath`, and 959's revision drops that line.

**989 — site settings.** The admin saves `logo_url`, `logo_dark_url`, `favicon_url`, `contact_email`,
`contact_phone`, `meta_title`, `meta_desc` and the general `tagline` (`src/modules/admin/actions/index.ts:287-288`),
and no page reads any of them: the header draws the text "Lero.al" (`src/components/layout/HeaderView.tsx:112-117`),
the favicon is the static `src/app/favicon.ico`, the footer tagline comes from the footer editor
(`src/components/layout/Footer.tsx:25`). The task applies the logo and the favicon (only from the account's Cloudinary)
and, per the open owner decision O989-1, applies or removes the other eleven. Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md`.

Owner decision O989-1 (2026-11-19, translated): "I choose this option [keep the setting and apply it]. There is no talk
about the 'Contacts' page at all. The 'Contacts' page must be a separate page altogether, which must be fully
configured in the admin, namely: settings for showing this or that contact element (a switcher), the feedback form (it
is already implemented), editable text after the heading 'Contact us', which the admin can edit in the admin! You
researched the admin very poorly. Contact phone, contact e-mails (support, sales), social networks, footer text must be
configured in the admin 'Site settings - Footer'. There must also be a switch that turns off the display of this or
that element in the footer. For example, if the admin turns off 'Contact phone', it stops being displayed on the site in
the footer." Owner decision O989-3 (2026-11-19, translated): "I noticed duplicated footer settings in the admin. There
is a separate Footer page, and there is Site settings - Footer. All the settings must be merged into the Footer page in
the admin, and Site settings - Footer removed. You do not even see this! You started making mistakes again!" Read on
production the same day: the `sq` footer row links to the account's Facebook profile and to `https://instagram.com`, the
`en`, `uk` and `it` rows to `https://facebook.com` and `https://instagram.com`; the settings Footer tab holds the
account's Facebook and Instagram addresses, and its two "footer text" fields hold the support and sales addresses
because no sales field exists; the General tagline equals the `sq` footer text. The 989 kickoff was revised: the Footer
page is the one place for the footer (a shared block with the phone, the support and sales e-mails and one social list
for all languages, each with a switch, then the language tabs); the settings Footer tab and the General fields that
repeat it leave. The "Contacts" page part became Task 1006 (Sprint 94, P2, after 989): an admin "Contacts page" page
beside "Footer" with the text under the heading in four languages, a switch per contact and for the form, and the
address of each form topic (O1006-1, O1006-2); the values stay on the Footer page. Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_1006_The_Contacts_Page_Is_Set_In_The_Admin.md`.

**990 — CMS pages.** Measured 2026-11-19: an anonymous `select` on `pages` returns the 3 published rows, and
`/sq/about`, `/sq/privacy-policy` and `/sq/terms-of-service` answer 200 with their titles; so item 21 (1) already holds.
A publish without an Albanian body is refused (`sq_body_required`, `src/modules/admin/actions/index.ts:341,381`): item 21
(2) already holds. The footer accepts a page slug only when a published `pages` row has it
(`src/modules/admin/actions/footer.ts:115-124`): item 21 (3) already holds. The page route answers 404 when neither the
visitor's language nor `sq` has a title or body (`src/app/[locale]/[slug]/page.tsx:57-64`). Reproduced 2026-11-19 with
`HYDRATION_ADMIN` in Ukrainian (nothing saved): "New page" opens on the Ukrainian tab, and after a Ukrainian title and
text Save stays disabled with no reason and an empty address (the Albanian title is required and the address is built
from it only, `src/components/admin/AdminPagesManager.tsx:36,54-56,88`); a saved page starts as a draft (`:47`); the
Ukrainian footer links `/test`, which no page has (`/uk/test` → 404). Kickoff:
`tasks/Sprints/Sprint_79_kickoff_prompt_Task_990_A_New_Page_Reaches_The_Site.md` (owner decision O990-1, the
WordPress classic toolbar and its Text mode). The editor offers bold, italic,
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
Measured 2026-11-19 on the real Auth with `HYDRATION_AGENT2` (a 2-minute ban, lifted in the same run): `signUp` of the
existing address → no error, a user with no identities; a banned account → `user_banned` for the wrong and the right
password alike, an unknown address → `invalid_credentials`. So the blocked message comes from a server check of the
password that runs after Auth's refusal. Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md`.

**992 — sold and rented listings listed.** Measured 2026-11-19 on production: an anonymous visitor opens a sold and a
rented listing by its address (200, the listing's title in the page, no `noindex`), and an expired one shows the closed
page (`noindex`); this is Task 956's rule (`src/modules/listings/lib/visibility.ts:38-42`). The sitemap lists only
active, unexpired listings (`src/app/sitemap.ts:61`). Sold and rented listings get `noindex` after
`archived_noindex_days` (`src/app/[locale]/listings/[slug]/page.tsx:93`). The admin switch puts sold and rented listings
into the sitemap. Owner decision O992-1 (2026-11-19, translated): "I agree with the recommendation. Sold and rented
are seen only in a separate tab." The site already lists them only in the "Sold and rented" tab of `/listings`
(`tab=closed`, `src/app/[locale]/listings/page.tsx:46`; measured anonymously 2026-11-19: both listings are on it), and
the main results stay without them. The switch changes the sitemap only; D73-1 holds for search. Kickoff (after 989;
listed only while still indexable, inside `archived_noindex_days`):
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_992_Sold_And_Rented_In_The_Sitemap.md`.

**993 — notifications.** No notifications page exists (`src/app/[locale]/` has none); the drawer has a "mark all as
read" text button in the header row (`src/modules/notifications/components/NotificationCenter.tsx:49-74`) and no "show
all" control. The task adds the page (list on the left, the open notification on the right, read when opened) and the
drawer layout the owner described. Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_993_A_Page_To_Read_Every_Notification.md`
(after 988; references read live 2026-11-19: TailAdmin `/inbox-details`, `/notifications`, Lahomes `messages.html`).

**994 — agent upgrade.** The profile switches private/agent both ways (`src/modules/cabinet/components/ProfileTab.tsx:295-309`,
saved at `src/modules/cabinet/actions/index.ts:225`), while agent statistics follow `users.role`, not the self-chosen
`user_type` (`src/modules/cabinet/statistics/access.ts:9`). Owner decision O994-1 (2026-11-19): the agency name and the
phone number are required. Owner decision O994-2 (2026-11-19): the agent functions open at once; the "Verified" badge
is given by an admin or a moderator (Task 998). Read-only 2026-11-19: of 19 live accounts one has `role=user
user_type=agent` and one `role=agent user_type=private`. Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_994_Become_An_Agent_One_Way.md`.

**995 — listing page.** The title uses `TITLE_FZ.h2` (`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:202`;
`src/design-system/mantine/typography.ts:39`: 20px below 640, 24, 30, then 36px); 24px is the `h4` token
(`src/design-system/mantine/theme.ts:660`). "Recently viewed" and "Similar listings" sit inside the left column
(`src/modules/listings/components/ListingDetailView.tsx:395-398`) and the contact card is the right column
(`MantineListingDetailPattern.tsx:310-312`), so on a phone the card comes after both. The verified mark is an icon with
an `aria-label` and no tooltip (`MantineListingContactPattern.tsx:302`). The send button stays disabled until the message
has 20 characters (`src/modules/listings/components/ListingInquiryDialog.tsx:45`), and nothing says so. The contact card
is the right column, so on a phone it comes after both blocks; owner decision O995-1 keeps the desktop page as it is
with similar listings first, and on a phone the card moves before them (Mantine visibility props). Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_995_Listing_Page_Title_Contact_Order_Verified_Hint_Message_Length.md`.

**996 — cards and "View all".** The grid card body is a `Stack` that does not grow, and its footer (price, price per m²,
ID and date) follows the content directly (`src/design-system/mantine/patterns/MantineListingCardPattern.tsx:212-239,301-305`),
so cards of one row put it at different heights. `ViewAllLink` is full width and centred below 640px
(`src/components/shared/ViewAllLink.tsx`: `w={{ base: '100%', sm: 'auto' }}`, `justifyContent: 'center'`). Measured on
production 2026-11-19: footers of one `/uk/listings` row at 722, 649, 722 and 722px; the "View all" labels at 139-251 and
186-298 of a 390px viewport. No test measured the footer, so Task 741 (`7b4b81f8c`) brought the jump back unnoticed.
Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_996_Card_Footer_At_The_Bottom_And_View_All_At_The_Edge.md`.

**997 — listing form.** The photo number sits bottom-left (`src/modules/listings/components/ImageUpload.tsx:170-173`).
The price field already drops every character that is not a digit, dots and commas included
(`src/modules/listings/domain/priceDigits.ts:16`, used at `ListingFormShellView.tsx:226`); the only price message is
"Please enter a valid price" (`messages/en.json:273`). `UNKNOWN`: the input that produced the owner's error; the task
reproduces it. Owner decision O997-1 (2026-11-19, translated): "I agree with the recommendation. A comma would be
superfluous." The price is a whole number; a dot is the thousands separator, and a space or a comma is removed as it is
typed. Reproduced on production 2026-11-19 (`HYDRATION_AGENT1`, every POST aborted): a space gives no error on the current
build (`150 000` is shown as `150000`), `1500,50` becomes `150050` unseen, and one message covers a missing price and one
above the ceiling. Kickoff (after 957, which changes `ImageUpload.tsx`):
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_997_Photo_Number_Top_Left_And_A_Price_With_Thousands.md`.

**998 — the "Verified" badge.** The users table toggles verification through `toggleUserVerified`
(`users.verify` key, `src/modules/admin/actions/index.ts:212-215`); the profile view only shows the badge
(`src/components/admin/AdminUserProfileView.tsx:506-510`). With O994-2 the owner reported (2026-11-19, translated): "as
admin or moderator I cannot give this badge now, the function in the admin does not work." Read 2026-11-19: the table's
handler ignores the action's answer and always shows the success message (`src/components/admin/AdminUsersTable.tsx:85-90`),
so a refused or failed change looks done; the moderator role holds `users.verify` (`role_permissions`, read-only);
3 accounts are verified. Reproduced the same day on production with the test accounts: the admin and the moderator
verify an agent from the table (the mark then shows in the admin profile, the cabinet and the listing card), the
moderator's change on the administrator's account is refused while the table says "User verified", and the profile has
no control. Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_998_Staff_Verification_Shows_Its_Result.md`.

**999 — premium period.** The database keeps `is_premium` and `premium_until` only; the admin grants 30, 90, 180 or
365 days (`src/components/admin/PremiumDialog.tsx:28-31`), and the chosen period is not stored. The task stores it
(SQL, applied by the owner) and shows it. Related: Task 933 (the card badge ignores `premium_until`). Found by the 998
design: `setListingPremium` still revalidates `/admin/badges` (`src/modules/admin/actions/index.ts:127`), a page deleted
in `121401d77`; 999 removes it and changes its test (`adminOperations.security.test.ts:117`). Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_999_Premium_Period_And_End_Date_In_The_Admin.md` (a staff-only
`listing_premium_grants` table; the server computes the end; read-only 2026-11-19: 2 premium rows, both past their end).

**1000 — reports count.** The tab counts are computed from the loaded rows (`src/components/admin/AdminReportsManager.tsx:66-70`)
and a delete removes the row (`:84`). The number that stays is the heading's subtitle, rendered once on the server
(`src/app/admin/reports/page.tsx:32-46`), while `deleteReportAction` revalidates nothing; the text also lacks a plural
("1 скарг"). Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_1000_Reports_Count_Follows_A_Delete.md`.

**1001 — filters.** The house filters lack `layout_features` that apartments have
(`src/modules/listings/domain/propertyTypeSchema.ts`, `SCHEMA_HOUSE` and `SCHEMA_APARTMENT`). No listing column holds
parking, and the `amenities` table is empty and read by no code (read-only query 2026-11-19). The parking attribute
(private, street, none) is a new column (SQL, applied by the owner), a form field, a detail line and a filter. Found by
the design, read-only 2026-11-19: the `listings.layout_features` column the apartment filter queries does not exist on
production (error 42703), so that filter returns no listings and the page shows the failure as "no results". Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_1001_House_Filters_And_Parking.md`.

**1002 — performance.** Measured 2026-11-19, anonymous, three requests each: `/uk` 0.33-0.45 s to the first byte and
299 KB of HTML; `/uk/listings` 0.45-0.58 s and 604 KB; `/uk/about` 0.25-0.36 s and 282 KB. The 1002 design measured
every role the same day (whole HTML, medians of five): static file 42 ms, guest 202-338 ms, agent 343-405 ms, admin
289-484 ms; functions run in `fra1` and the database in `eu-west-2`; only two routes have a loading state; each page
carries the whole text catalogue of its language (the admin and Storybook texts included); the first click to
`/admin/users` starts 31 prefetches (1.6 s). The proxy refreshes the session on every request it sees, the admin
included (`src/proxy.ts:69`). Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_1002_Pages_Answer_Faster.md`.

**1003 — security review.** The 2026-11-06 audit (`docs/security/audit-2026-11-06/findings.md`) is being closed by
Sprint 93's open security tasks. 1003 repeats the audit on the current `main` after them: every entry point (server
actions, routes, admin pages, policies per command), each finding fixed with its security test or handed to a task.
Counted 2026-11-19: of the 63 findings of that audit, 47 are still held by open tasks, and `src` with `supabase` changed in
311 files since the tree it read. The audit starts after 955, 957, 959 and 991 are merged; a new
`scripts/quality/audit-coverage.mjs` fails when an entry point is missing from its ledger. Kickoff:
`tasks/Sprints/Sprint_93_kickoff_prompt_Task_1003_Whole_Project_Security_Review_Repeated.md`.

**1004 — loading skeleton.** Task 792 moved `[slug]/loading.tsx` to the Mantine `Skeleton` only; its layout classes stay
Tailwind (792 review note N1, archive ledger), and no open task carried it. The design found three local card
placeholders with their own geometry and the favorites chrome still on Tailwind; both go into 1004. Kickoff:
`tasks/Sprints/Sprint_71_kickoff_prompt_Task_1004_Loading_Shells_Leave_Tailwind.md`.

**1005 — legal pages.** The privacy policy and the terms are CMS pages (`privacy-policy`, `terms-of-service`); the
owner gave two reference sites. The task drafts both from what the site really processes (accounts, listings,
messages, Cloudinary, Sentry, the mail provider, Turnstile, Vercel), in the four languages, for the owner's approval.
The design also found Google sign-in, OpenStreetMap map tiles and four cookies plus one browser-storage key; a CI check
ties the inventory to the code. Kickoff:
`tasks/Sprints/Sprint_79_kickoff_prompt_Task_1005_Privacy_Policy_And_Terms_Drafted_From_Facts.md`.

**991 (item 32) — reset for a blocked account.** A blocked account is banned in Supabase Auth
(`src/lib/auth/accountAccess.integration.test.ts:30`: sign-in answers `user_banned`). The mail hook sends the reset
link without reading the account's status (`src/app/api/auth-email-hook/route.ts:303-311`). `UNKNOWN`: whether the
link then opens a session for a banned account; 991 measures it (see O991-2).

**Item 23.** The file was `docs/sessions/evidence/task861/storybook-dev.log`, a Storybook log of Task 861
(2026-09-20) that the Task 867 review saw as an unrelated change
(`docs/reviews/2026-09-23-task867-cms-read-path-footer-slug-validation.review-ledger.json`). The governance reset
(PR #19) deleted it; nothing is open.

**Task 1008 (owner request, 2026-11-19, translated): "The 'Message' field must have an option to extend the field's
height, as in the screenshot (at the bottom of the 'Message' field)".** The contact form switches resizing off
(`src/modules/contacts/components/ContactForm.tsx:178-183`); Mantine's `Textarea` has no resizing by default and the
theme adds none (`src/design-system/mantine/theme.ts:1083-1095`); the browser's own handle has no effect on an iPhone
(MDN browser-compat-data, `css.properties.resize`). One semantic element has one visual contract, so the handle lives
in a canonical `MantineTextarea` used by every Mantine multi-line field, guarded by a gate. Kickoff:
`tasks/Sprints/Sprint_94_kickoff_prompt_Task_1008_A_Message_Field_Can_Be_Made_Taller.md`.

**Legacy leaves with every change (owner, 2026-11-19, translated): "In tasks that concern front-end parts, legacy
components and elements must be migrated to Mantine right away, so that no additional work is needed later. We are
giving up Legacy and moving to Mantine step by step. Check the tasks in Sprints 93 and 94 so that this instruction is
carried out everywhere."** Rule: `.claude/rules/shared/canonical-component-reuse.md`. Every open kickoff of Sprints 93
and 94 was checked file by file (`@/components/ui` imports, Tailwind classes through `npm run check:enrolled-tailwind`,
the legacy admin page wrapper). Added: 957 (the listing form and photo widget; it takes over Task 906 and the shell of
907), 994 (the whole profile tab), 989 (both forms' legacy children), 1006 (the admin page frame and enrolment), 1007
and 988 (the admin page frames), 1008 (enrolment), 997 (after 957, on Mantine). 995 leaves the one `hidden` gallery
shell to Task 794, which removes the swap it serves. Already on `main` (PR #19), so not changed: 948, 951, 952, 953, 968.

## Owner decisions

All answered by the owner on 2026-11-19: O989-1, O989-2, O989-3, O990-1, O991-1, O991-2, O992-1, O994-1, O994-2,
O995-1, O997-1, O1001-1, O1005-1, O1006-1, O1006-2, O1006-3. None is open. Recorded the same day (translated), each also in its kickoff:
- O989-2 (Task 989): "I agree": `logo_dark_url` leaves the settings, the site has no dark theme.
- O990-1 (Task 990, Sprint 79): the WordPress classic editor's toolbar, from the owner's screenshot of both modes,
  without special characters, clear formatting, paste as text, indent and outdent, and help; the text colour comes
  from the theme palette only ("yes!").
- O995-1 (Task 995): description → features → contact card → similar listings → recently viewed; "the width must be as
  it is now"; "they need no change, only the display order": the desktop page stays, similar listings come first,
  and on a phone the contact card comes before them.
- O1001-1 (Task 1001): "I agree", with every type checked: parking for all types but garage, parking and land; read
  2026-11-19, no type has parking today, and six listing descriptions mention it in free text.
- O1005-1 (Task 1005, Sprint 79): "Yes, a lawyer will check the texts before publication. This will happen offline."
- O1006-1 (Task 1006): "this must be a setting on the 'Contacts' page, namely a field for entering the address to which
  the letters from the form will be sent."
- O1006-2 (Task 1006): each form topic has its own address, set on the "Contacts" page; a message goes to its topic's
  address, and the user's answer to a staff reply returns to the address the reply was sent from ("Right now the
  functionality works correctly"), so the reply path stays as it is.
- O1006-3 (Task 1006): the form's Send button stays disabled until a topic is chosen.
- O-L03 and O-P01 (Task 959, Sprint 93): the free-plan leaked-password residual is accepted and the password composition
  rule stays as the platform's own protection; the length is 8 to 128 ("The password length must be from 8 to
  128!"); a switch per admin page for the moderator on the Permissions page became
  Task 1007 (Sprint 93), with finding P-01.
