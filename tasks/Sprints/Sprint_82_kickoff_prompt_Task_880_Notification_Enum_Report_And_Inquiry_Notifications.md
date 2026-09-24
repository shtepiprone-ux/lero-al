# Task 880 — the notification enum accepts every type the code writes, and the listing owner is notified on a message, a report and its outcome

Sprint 82 · **P1** · QA profile **Q4** (critical flows: Report listing, Inquiry / send message, notification template
localization) · depends on **878 archived** · owner decisions **D82-1…D82-5** · owner actions **O82-1…O82-3** ·
**Status: 🔍 PARTIALLY VERIFIED (review 2, 2026-09-24) — §16 verified; O82-1 done (the live verify query returned 0 rows); no executor action. Approval waits on O82-2 and lands together with 878 (D82-6).**
The 878-first sequencing gate is overridden by owner decision **D82-6**.

Sprint plan: [`Sprint_82_Notifications_That_Were_Never_Delivered.md`](Sprint_82_Notifications_That_Were_Never_Delivered.md).

## 1. Mode and task type

`IMPLEMENTATION`. It combines three kinds of work:
- **DB / server action:** an owner-applied additive enum migration, three server actions, and one gate;
- **Critical-flow change:** Report listing, and Inquiry / send message;
- **A small UI rendering extension:** `NotificationItem` title params, locale keys, and fixture rows.

It creates no new component, Story file, Story export or theme token.

## 2. Objective

1. The live `public.notification_type` enum accepts every value of the TypeScript `NotificationType`, and CI fails
   the moment the two diverge again.
2. The listing owner gets an in-app notification:
   - when someone sends a message about the listing;
   - when the listing is reported;
   - when that report is resolved or dismissed.
3. The reporter's existing outcome notification actually arrives.
4. No notification failure ever changes the result of the action that caused it.

## 3. Verified context — measured 2026-09-24

- **F1 (FACT, live DB; owner-run read-only SQL, results pasted in chat 2026-09-24).**
  - `enum_range(null::public.notification_type)` =
    `["new_message","saved_search_match","listing_status_change","support_reply","listing_expires_soon","agent_verified","marketing"]`.
  - `notifications.type` is `USER-DEFINED` / `notification_type`.
  - The table's only constraints are its primary key and `user_id → users(id) on delete cascade`.
- **F2 (FACT).** `src/types/database.ts:50` declares
  `NotificationType = 'new_message' | 'saved_search_match' | 'listing_status_change' | 'support_reply' | 'listing_expires_soon' | 'agent_verified' | 'marketing' | 'report_outcome' | 'price_change'`.
  **`report_outcome` and `price_change` are missing from the live enum.**
- **F3 (FACT, live DB).** Row counts in `notifications`, grouped by type:

  | Type | Rows | Last written |
  |---|---:|---|
  | `listing_status_change` | 18 | 2026-09-20 |
  | `saved_search_match` | 3 | 2026-09-09 |
  | `support_reply` / `support_created` | 1 | 2026-05-30 |
  | `report_outcome` | **0** | — |
  | `price_change` | **0** | — |

  In `listing_reports` (live), the owner's two test reports of 2026-09-24 are:
  - `ca6ce5b1-…`: `pending→reviewed→resolved`;
  - `ccf27d22-…`: `pending→reviewed→resolved`.

  Both have a reporter.
- **F4 (FACT).** Who writes the two refused types:
  - **`report_outcome`:**
    - `notifyReporter` (`src/modules/listings/actions/reportListing.ts`, called at the end of
      `updateReportStatusAction` on `resolved`/`dismissed`);
    - `updateTicketStatus` (`src/modules/admin/actions/index.ts`, on `resolved`/`closed` of a ticket with
      `reported_user_id`).
  - **`price_change`:** `src/app/api/cron/price-alerts/route.ts:133`.

  All of them go through `createNotification` (`src/modules/notifications/lib/mutations.ts`). It inserts with the
  service-role client and, on error, only logs `console.error('[notifications] createNotification failed', …)`. It
  returns `void`, so no caller can know the insert failed.
- **F5 (FACT).** `updateReportStatusAction` calls `notifyReporter(...)` **without `await`**, as fire-and-forget with
  `.catch`, and then returns `{}`. **INFERENCE, not measured:** on Vercel, an un-awaited promise in a server action can
  be cut off when the function freezes after responding. This cannot be proven from the repository, and F1–F3 already
  explain the missing rows. Awaiting it (R6) removes the hazard whatever the answer.
- **F6 (FACT).** `reportListingAction` (`reportListing.ts:23-70`) inserts the report through the **user-scoped**
  client, with a duplicate guard, and returns `{}`. It notifies no one.
- **F7 (FACT).** `submitListingInquiry` (`src/modules/listings/actions/submitListingInquiry.ts:39-110`) does the
  following, in order:
  1. validates the input;
  2. rate-limits by IP;
  3. selects `id, user_id, title, status` from `listings` via the service role;
  4. applies the closed-listing and self-inquiry guards;
  5. resolves the owner's email;
  6. inserts into `listing_inquiries`;
  7. sends the email, returning `email_transient` if it fails.

  It has never created a notification: `git log -S createNotification` returns no commit on this file.
  `2744db1ac` (2026-05-17): *"`new_message` notifications require the messaging module (not yet built)"*.
- **F8 (FACT).** How notifications render (Task 319, model C). `NotificationItem.tsx` resolves
  `t('notifications.<template_id>_title', params)` and `t('…_body')` in the **viewer's** locale:
  - title params come from `resolveTitleParams(templateId, params)`, which today handles only `saved_search_match` and
    `price_change`;
  - the body resolver passes **no** params;
  - the stored `title`/`body` columns are the **Albanian fallback**, written by the producer. Precedent:
    `SUPPORT_NOTIFY_SQ` (`src/modules/admin/actions/index.ts:731-738`).

  Existing producers link without a locale, for example `link: \`/listings/${slug}\`` in `applyListingTransition.ts`.
  `NotificationItem` renders it as `<Anchor href={notification.link}>`.
- **F9 (FACT).** The live read path is healthy (live DB):
  - RLS `SELECT`/`UPDATE`/`DELETE` policies are `auth.uid() = user_id`, and `INSERT` is limited to `service_role`;
  - `notifications` is in `supabase_realtime`.

  The live grants give `anon`/`authenticated` every privilege. That is **881** (D82-4), not this task.
- **F10 (FACT).** Critical-flow registry rows touched (`docs/critical-flow-registry.md`):
  - "Report listing" (`:67`), run by `npm run test:listings`, which includes `reportListing.smoke.test.ts`;
  - "Inquiry / send message" (`:68`), `submitListingInquiry.smoke.test.ts`, also in `test:listings`;
  - "Notifications panel — template-driven title/body localization" (`:77`).
- **F11 (FACT).** The Storybook fixture `src/stories/fixtures/notifications.fixture.ts` builds `notificationRows(locale)`
  (8 rows: every producer plus legacy fallbacks). Its consumers:
  - `Mantine/Primitives/NotificationItem` → `Default`, which destructures `rows[0]`, `rows[1]` and maps all rows;
  - `Mantine/Primitives/NotificationCenter`;
  - after 878, the `HeaderView`/`HeaderActions` Stories, which pass `unreadCount = rows.filter(r => !r.is_read).length`,
    currently 3.
- **F12 (FACT).** GR-1 census, run 2026-09-24 on `src/modules/notifications/components/NotificationBellView.tsx`:
  5 nodes (NotificationBellView, MantinePopover, NotificationCenter, responsiveBottomSheet, NotificationItem), all
  `tier1 manifest:yes story:yes className:0 ui-imports:0`.

  The server actions render nothing, and `ListingReportDialog`/`ListingInquiryDialog` are not changed. Their legacy
  dialog migration is **795**, reserved in Sprint 71. This task edits no dialog file.
- **F13 (FACT).** SQL convention: there is no `supabase/` directory, so migrations ship as `scripts/task-NNN-*.sql` and
  the owner applies them (`scripts/task-460-listing-reports-authenticated-grants.sql`, `scripts/task-870-*.sql`).
  The static-gate precedent is `scripts/check-listing-reports-grants.mjs`, wired at
  `.github/workflows/governance-pr.yml:170`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F1, F2, D82-1 | `scripts/task-880-notification-type-enum.sql` adds `report_outcome` and `price_change` to `public.notification_type` with `alter type … add value if not exists`, one statement per value. Its header states that the change is additive, that enum values cannot be dropped, so there is no rollback, and that leaving the values is harmless. `scripts/task-880-verify.sql` returns every `NotificationType` value missing from the live enum, so the expected result is **zero rows**. | P0 | AC1, O82-1 | Confirmed |
| **R2** | F2, F3 | `scripts/notification-type-enum.json` records the enum values confirmed live. `npm run check:notification-type-enum` (`scripts/check-notification-type-enum.mjs`) parses the `NotificationType` union from `src/types/database.ts` and exits 1 when the two sets differ in either direction, naming each extra and each missing value. It exits 2 when either source cannot be parsed. Every run prints its scope: it compares the TS union with the committed record, it cannot see the live database, and O82-1's verify query closes that gap. The gate is wired into `governance-pr.yml` beside `check:listing-reports-grants`. | P1 | AC2 | Confirmed |
| **R3** | D82-1, D82-3, D82-5, F7 | After `listing_inquiries` is inserted successfully and the email has been attempted, `submitListingInquiry` awaits **exactly one** `createNotification` for `userId = listing.user_id`, `type 'new_message'`, `link '/listings/<slug>'` (add `slug` to the select). Which one depends on the email: <br>• **Email delivered** → `templateId 'listing_inquiry'`, `templateParams { listingName }`. <br>• **Email failed** (`emailResult.ok === false`, or `sendListingInquiryNotification` throws, which must be caught) → `templateId 'listing_inquiry_email_failed'`, `templateParams { listingName, senderName: name, senderEmail: email }`, so the owner can reply (D82-5). The action still returns `email_transient`. <br>The Albanian fallback goes in `title`/`body`. There is **no** notification on any return before the insert succeeds. | P1 | AC3 | Confirmed |
| **R4** | D82-2, F6 | After a successful report insert, `reportListingAction` reads the listing's `user_id, title, slug` through the **service-role** client and awaits `createNotification`: owner, `type 'report_outcome'`, `templateId 'listing_report_filed'`, `{ listingName }`, link to the listing. There is **no** reporter identity and no reason anywhere in the row. Skip it when the owner is the reporter or the listing lookup fails, and log `console.error` on a failed lookup. | P1 | AC4 | Confirmed |
| **R5** | D82-2 | On a transition into `resolved` or `dismissed`, `updateReportStatusAction` also notifies the listing owner: `type 'report_outcome'`, `templateId 'listing_report_resolved_owner'` / `'listing_report_dismissed_owner'`, `{ listingName }`, link to the listing. Skip it when the owner is the reporter, in which case the reporter notification alone is sent. There is no notification on any non-terminal transition, including reopen. | P1 | AC5 | Confirmed |
| **R6** | F5 | `notifyReporter` and the R5 owner notification are **awaited** before `updateReportStatusAction` returns. Every new `createNotification` call in R3–R5 is awaited inside a `try/catch` that logs with the flow's existing prefix: `[listing-inquiry]`, `[reportListing]`, `[updateReportStatus]`. A thrown or failed notification never changes the action's return value. | P1 | AC6 | Confirmed |
| **R7** | F8 | `messages/{sq,en,uk,it}.json` → `notifications` gains `listing_inquiry_title`/`_body`, `listing_report_filed_title`/`_body`, `listing_report_resolved_owner_title`/`_body` and `listing_report_dismissed_owner_title`/`_body` and `listing_inquiry_email_failed_title`/`_body`. Each title interpolates `{listingName}`. Four bodies take no params. `listing_inquiry_email_failed_body` interpolates `{senderName}` and `{senderEmail}` and says the email could not be delivered, and that the owner can reply to that address. `resolveTitleParams` returns `{ listingName }` for those five template ids, using the same string guard as `price_change`. The body is resolved by a new `listing_inquiry_email_failed` branch beside the `price_change` one. It returns `null` (the stored Albanian body) when either sender param is not a non-empty string. The Albanian fallbacks stored by R3–R5 are the exact `sq.json` strings, with `{listingName}` substituted, kept in one exported constant per producer module in the `SUPPORT_NOTIFY_SQ` style. | P1 | AC7 | Confirmed |
| **R8** | F11, 16c | `notifications.fixture.ts` appends **five** rows, one per new template, **after** the existing eight. All five are `is_read: true`, so the header Stories' unread count stays 3. The file's header comment says thirteen rows. The email-failed row uses an obviously fictional sender (`Arben Fixture`, `arben.fixture@example.com`). No Story file changes: `NotificationItem` `Default` and `NotificationCenter` `Default` render the new rows through the fixture. | P2 | AC8, O82-2 | Confirmed |
| **R9** | F10 | `docs/critical-flow-registry.md` rows `:67`, `:68` and `:77` are updated with the new behavior, their tests and the gate. | P2 | AC9 | Confirmed |

## 5. Assumptions and open questions

1. **Decided:** D82-2 (on filing + outcome), D82-3 (link to the listing) and D82-4 (grants → 881). They are quoted
   verbatim in the sprint file.
2. **`report_outcome` is reused for the owner's report-filed notification.** The type drives only the icon
   (`NotificationItem` `TYPE_ICON`, 🛡️, moderation). The template id carries the meaning. Adding a new enum value
   would be a second migration with no user-visible gain. **This is the orchestrator's choice, stated so review can
   check it.** It is not an owner decision, and it is reversible.
3. **Inquiry sender identity.** The notification does not name the sender (D82-3: *"the email stays the main channel
   for the message text"*). The email already carries the name and reply-to.
4. **Behavior change the owner should expect:** once O82-1 is applied, the price-alerts cron (enabled 2026-09-20)
   starts producing `price_change` notifications. It has been silently failing until now. That is the intended fix.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0 to GR-6.
- `docs/agent-contract.md`: clauses 1, 3, 5, 6a, 7, 9, 13, 14, 15, 16b, 16c, 16d.
- `docs/data-access-rules.md` and `docs/rls-rules.md`: the service-role read path, no new grant.
- `docs/domain-rules.md`: reports and inquiries.
- `docs/qa-rules.md`, and `docs/qa-profiles.md` (Q4 row).
- `docs/critical-flow-registry.md`: rows `:67`, `:68`, `:77`.
- `docs/i18n-rules.md`: four locales.

## 7. Scope

Files the executor may change:
- `scripts/task-880-notification-type-enum.sql`, `scripts/task-880-verify.sql` (new): R1
- `scripts/notification-type-enum.json`, `scripts/check-notification-type-enum.mjs` (new), `package.json` (one
  script), `.github/workflows/governance-pr.yml` (one step): R2
- `src/modules/listings/actions/submitListingInquiry.ts`: R3, R6, R7
- `src/modules/listings/actions/reportListing.ts`: R4–R7
- `src/modules/notifications/components/NotificationItem.tsx`: the `resolveTitleParams` cases only (R7)
- `messages/{sq,en,uk,it}.json`: the 8 R7 keys only
- `src/stories/fixtures/notifications.fixture.ts`: R8
- tests (new or extended):
  - `src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts`;
  - `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts`;
  - `src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx`
- `docs/critical-flow-registry.md`: R9
- `docs/sessions/2026-09-2?-task880-*.md`, `docs/sessions/evidence/task880/**`, and `docs/backlog.md` (the 880 state
  only)

## 8. Out of scope

- Any grant or RLS change on `notifications`: that is **881** (D82-4).
- `createNotification`'s signature, and the other producers: the crons, `applyListingTransition` and the admin ticket
  actions. The enum fix repairs `updateTicketStatus` and the price-alerts cron without a code change.
- An inquiries inbox (D82-3), and any dialog or UI chrome change. `ListingReportDialog`/`ListingInquiryDialog` belong
  to **795**.
- Any Story file, Story export or `NotificationBellView` change.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| `report_outcome` / `price_change` insert | refused by the enum, logged, lost | accepted |
| Reporter, report resolved/dismissed | nothing arrives | notification arrives (existing template) |
| Listing owner, report filed | nothing | "your listing was reported: {listingName}" |
| Listing owner, report resolved/dismissed | nothing | outcome notification for the listing |
| Listing owner, message sent | email only | email plus an in-app "new message: {listingName}" linking to the listing |
| Listing owner, message sent but the email failed | nothing; the owner never learns of it | an in-app "message not delivered to your email: {listingName}" with the sender's name and email (D82-5) |
| Notification failure | swallowed; in `updateReportStatusAction` possibly never executed | awaited, logged, and the action result is unchanged |
| TS type vs DB enum | can diverge silently | CI fails on divergence |

## 10. Implementation requirements

### 10.1 I0

1. Record `node.exe -p process.platform` (must be `win32`), `git --no-optional-locks status --porcelain`, and
   `git hash-object` of every ` M` path → `00-i0.txt`.
2. Confirm that **878 is archived**: `docs/backlog-archive.md` has an 878 row, and `NotificationItem.tsx` and the
   fixture carry no uncommitted diff. If not, return `BLOCKED — 878 FIRST`.
3. Re-read F4–F8 at their cited lines. Record any drift and use the current lines.

### 10.2 GR receipts before the related write

- **GR-0:**
  - `NotificationItem.tsx`: EXTEND `resolveTitleParams`;
  - the locale keys: EXTEND the `notifications` namespace;
  - new hardcoded visual values: NONE.
- **GR-3a:** `NotificationItem × five new template rows` (corrected in review 1: D82-5 made it five) → EXTEND the data of `Mantine/Primitives/NotificationItem`
  `Default` through the shared fixture. `CREATE` is not permitted.
- **GR-3:** `NotificationItem ← src/stories/mantine/primitives/NotificationItem.stories.tsx`.
- **GR-1**, at the end: re-run the F12 census. Expected: 5 nodes, all migrated+enrolled+story.

### 10.3 Gate and two-armed proof (R2)

1. Write the gate, then run it → `10-gate-pass.txt`. Expect exit 0.
2. **Plant A:** append `| 'plant_type'` to `NotificationType` → `11-gate-plant-a.txt`. Expect exit 1, naming
   `plant_type` as missing from the record.
3. **Plant B:** remove `price_change` from the JSON record → `12-gate-plant-b.txt`. Expect exit 1, naming it as
   missing from the record.
4. Restore both through Node `fs`, never PowerShell `Get-Content -Raw`. Re-run → `13-gate-restored.txt`, expect exit
   0. Record a `git hash-object` witness before and after for both files.
5. Capture each exit code as `$LASTEXITCODE` **immediately** after its command.

### 10.4 Tests (R3–R7), mocked like their existing neighbours

- **Inquiry:**
  - when the email succeeds, `createNotification` is called exactly once, with `templateId 'listing_inquiry'` and
    `templateParams { listingName }` only;
  - when the email returns `ok: false`, and again when it throws, it is called exactly once, with
    `'listing_inquiry_email_failed'` and `{ listingName, senderName, senderEmail }`, and the result is
    `email_transient`;
  - it is never called twice for one inquiry;
  - on `validation`, `rate_limited`, `not_found`, self-inquiry, `owner_unavailable` and `save_failed`, it is not
    called;
  - if `createNotification` rejects, the result is still `{}`.
- **Report filed:**
  - on success, the owner is notified with the R4 payload;
  - the row has no reporter id or reason field;
  - on `already_reported`, `save_failed`, `unauthorized` and `invalid_reason`, there is no call;
  - when the owner is the reporter, there is no call;
  - when the listing lookup errors, there is no call, `console.error` is logged, and the result is still `{}`.
- **Report status:**
  - on `resolved` and `dismissed`, both the reporter and the owner are notified with the correct template ids;
  - when owner equals reporter, only the reporter is notified;
  - `reviewed` and reopen produce no call;
  - the action's promise does not resolve before both notification promises resolve. Use a deferred mock and assert
    ordering.
- **Render:** extend `NotificationItem.templateLocalization.smoke.test.tsx`:
  - the same `listing_report_filed` row renders the `uk` and `sq` titles with the listing name interpolated;
  - a `listing_inquiry_email_failed` row renders the sender's name and email in its body in `uk`;
  - with `senderEmail` missing, it falls back to the stored body.
- **Planted proof, per new behavior group:**
  1. remove the R3 `await createNotification` call; the inquiry happy test fails;
  2. make `notifyReporter` un-awaited again; the ordering test fails;
  3. drop the `listing_report_filed` case from `resolveTitleParams`; the render test fails.

  Restore each one and re-run to a pass. Record a hash witness for each file.

### 10.5 Rules

- UTF-8 without BOM. Use the Edit tool or Node `fs`.
- No new component, Story, token or `className`.
- Do not change `createNotification`.

## 11. Positive and negative flows

**Positive.** Account 1 reports account 2's listing. Account 2 sees "your listing was reported". A moderator resolves
it, and account 2 sees the outcome while account 1 sees "your report has been resolved". Separately, a visitor sends
a message about account 2's listing; account 2 gets the email and an in-app "new message" linking to the listing.

| Branch | Applicable | Expected | Evidence |
|---|---:|---|---|
| Inquiry validation / rate limit / not found / closed / self / no owner email / insert fails | Yes | no notification | AC3 tests |
| Inquiry email fails after insert (returns not-ok, or throws) | Yes | one `listing_inquiry_email_failed` notification carrying the sender's contacts; `email_transient` returned | AC3 |
| Email-failed row with malformed params | Yes | body falls back to the stored Albanian text | AC7 |
| Duplicate report | Yes | `already_reported`, no notification | AC4 |
| Owner reports own listing | Yes | no owner notification; the reporter path is unchanged | AC4, AC5 |
| Listing lookup fails after report insert | Yes | report saved, `{}` returned, `console.error` | AC4 |
| Non-terminal transition, reopen | Yes | no notification | AC5 |
| Notification insert fails or throws | Yes | action result unchanged, error logged | AC6 |
| Reporter identity leak to owner | Yes | the row carries only the listing name and link | AC4 test asserts the payload keys |
| Enum drift in future | Yes | CI red | AC2 |
| Viewer locale ≠ sq | Yes | title rendered in the viewer's locale | AC7 |
| Auth / RLS change | No | no grant or policy is touched (881) | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given the two SQL files, when read:
  - the migration contains exactly two `alter type public.notification_type add value if not exists` statements, for
    `report_outcome` and `price_change`, plus the no-rollback header;
  - the verify query's expected-value list equals the TS union.

  Given O82-1, when the owner runs the verify query on the live database, it returns zero rows.
- **AC2 [R2]** Given `10`–`13`: the gate exits 0, then 1 (plant A names `plant_type`), then 1 (plant B names
  `price_change`), then 0. The hash witnesses match before and after. `governance-pr.yml` runs the gate.
- **AC3 [R3]** Given the inquiry tests, when run, then every §10.4 inquiry assertion passes, and plant 1 fails the
  happy test.
- **AC4 [R4]** Given the report-filing tests, when run, then every §10.4 report-filed assertion passes. The asserted
  payload's `templateParams` has only `listingName`, and no field holds the reporter id.
- **AC5 [R5]** Given the status tests, when run, then the resolved, dismissed, self and non-terminal assertions pass.
- **AC6 [R6]** Given the ordering test and the rejecting-mock tests, when run, then they pass, and plant 2 fails the
  ordering test.
- **AC7 [R7]** Given `check:i18n` and the render test:
  - the key parity holds at +10 per locale;
  - the `uk`/`sq` render assertions pass;
  - plant 3 fails.
- **AC8 [R8]** Given the fixture diff:
  - five rows are appended after row 8, all read;
  - `check:story-coverage` and `build-storybook` exit 0;
  - the header Stories' unread count is still 3, checked by reading the fixture filter.
- **AC9 [R9]** Given the registry diff, when read, then rows `:67`, `:68` and `:77` name the new behavior, the new
  tests and the gate.
- **AC10 [all]** Given the §13.2 block, when run, then every command exits 0. `test:listings` and the listed vitest
  files pass. The final status lists no path outside §7 beyond those in `00-i0.txt`.
- **AC11 [Objective] — owner:** O82-2 is accepted, and after deploy O82-3's observations match §13.3.

`GR-4 AC AUDIT — 11 criteria (R3/R7/R8 widened 2026-09-24 by D82-5); each states an observable property; absolutes: AC1's "zero rows" is the verify query's defined pass condition, not a repo-wide absolute.`

## 13. QA profile and verification plan

**Q4:** this changes two critical flows (Report listing, Inquiry / send message) and a schema enum. It needs
automated regression evidence with planted failures, the gate's two arms, the owner-applied SQL with its verify
result, and the owner's post-deploy flow check.

### 13.1 Re-entry

From scratch, after 878 is archived. Evidence root: `docs/sessions/evidence/task880/`.

### 13.2 Gate block (executor, Windows PowerShell, project root, after every §7 write)

```powershell
$ev = "docs\sessions\evidence\task880"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\20-platform.txt"
npm.cmd run test:listings *>&1 | Tee-Object "$ev\21-test-listings.txt"
npx.cmd vitest run src/modules/notifications *>&1 | Tee-Object "$ev\22-test-notifications.txt"
npm.cmd run check:notification-type-enum *>&1 | Tee-Object "$ev\23-gate.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\24-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\25-lint.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\26-i18n.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\27-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/modules/notifications/components/NotificationBellView.tsx *>&1 | Tee-Object "$ev\28-census.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\29-rendered-scope.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\30-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\31-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\32-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\33-build.txt"
git --no-optional-locks hash-object scripts/check-notification-type-enum.mjs scripts/notification-type-enum.json scripts/task-880-notification-type-enum.sql scripts/task-880-verify.sql src/modules/listings/actions/submitListingInquiry.ts src/modules/listings/actions/reportListing.ts src/modules/notifications/components/NotificationItem.tsx src/stories/fixtures/notifications.fixture.ts *>&1 | Tee-Object "$ev\34-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\35-status-after.txt"
```

After each command, run `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>` **immediately**. Expected: every command
exits 0, and `28` reports 5 nodes with no FAIL.

### 13.3 Owner steps

**O82-1: apply and verify the enum.** Run this in Supabase → SQL Editor, in this order:

1. Paste and run the whole content of `scripts/task-880-notification-type-enum.sql`.
2. Paste and run `scripts/task-880-verify.sql`. Expected: **zero rows**. Any returned row is a missing value; return
   it.

**O82-2: `OWNER VISUAL QA REQUIRED`**, toolbar locales `sq`, `en`, `uk`, `it`:

| Story | Export | Viewports | Look at |
|---|---|---|---|
| `Mantine/Primitives/NotificationItem` | `Default` | 320, 1440 | the five new rows: listing name in the title; the email-failed row shows the sender's name and a long email that wraps with no horizontal scroll at 320 |
| `Mantine/Primitives/NotificationCenter` | `Default` | 390, 1440 | the same five rows in the panel |

Record accepted, or returned with a concrete defect.

**O82-3: after deploy, on lero.al**, repeat D82-1 with two accounts:
1. Account 1 reports a listing owned by account 2. After a reload, account 2 sees "your listing was reported".
2. As a moderator, move the report to `reviewed`. There is no new notification.
3. Move it to `resolved`. After a reload, account 2 sees the outcome for the listing, and account 1 sees "your report
   has been resolved".
4. Signed out, or as account 1, send a message on account 2's listing. Account 2 gets the email **and**, after a
   reload, a "new message" notification whose click opens the listing.
5. The email-failed branch cannot be triggered on production on purpose. It is covered by AC3's tests and the O82-2
   Story row. If a real Resend failure ever happens, the row appears with the sender's contacts.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

Report:
- changed files with their hashes;
- R1–R9 and AC1–AC10 (AC11 = `MISSING EVIDENCE`, owed by the owner);
- every command with its exit code;
- the gate's four transcripts and the three planted-test proofs;
- the GR receipts;
- deviations.

Update the 880 backlog state cell. Write the session log with a Files Changed table. The executor applies no SQL.

## 15. Task quality gate

| Check | Result |
|---|---|
| Root cause | **measured on the live database** (F1, F3): the enum lacks 2 of 9 TS values; the swallowed error hid it; the owner's premise "regression" is recorded as unsupported in the sprint file |
| Two-armed controls | gate plants A/B (§10.3) plus three product-code plants (§10.4) |
| Detector scope stated | the gate compares TS with the committed record; the live side is closed by O82-1's verify query, and the gate prints this on every run (R2) |
| Critical flows | Report listing, Inquiry, and template localization: registry rows updated (R9); `test:listings` in the gate block |
| GR-1 | NotificationBellView census: 5 nodes, all enrolled with their own Stories (F12); no dialog or visual chrome is touched |
| Story | EXTEND through the fixture, no new Story or export (GR-3a); read rows, so the header's unread count is untouched (R8) |
| Owner decisions quoted | D82-1…D82-4, verbatim in the sprint file |
| Sequencing | after 878 (shared `NotificationItem.tsx` and fixture); I0 step 2 enforces it |

## 16. Revision 1 — review 1, 2026-09-24: `NEEDS REVISION`

Re-entry mode: **remediation**. Review 1 verified the following, and none of it may be redone:
- R1: the SQL files, whose value list equals the TS union;
- R3–R6: the code read against the diff;
- R7: the `sq` fallback strings equal `messages/sq.json` character for character;
- R8, R9;
- AC2's four gate transcripts;
- the three product plants;
- 65/65 tests re-run by the reviewer on win32, covering `reportListing`, `submitListingInquiry`, `deleteReport` and
  `src/modules/notifications`.

**Preserve, do not re-run:** `00-i0.txt`, `10`–`13`.

### 16.1 Sequencing: owner decision D82-6

The I0 step-2 gate (878 archived first) is **overridden by the owner**. The decision is recorded verbatim in the sprint
file. From now on, this task's diff and 878's still-open diff share `NotificationItem.tsx` and `messages/*.json`.
They land together: see D82-6's effect.

### 16.2 Finding R1-F1 (P2): the gate's record states the opposite of R2. Requirement: R2, AC2.

- **Where.** `scripts/notification-type-enum.json` → `_comment` reads: *"Update this file in the SAME commit as any
  NotificationType change. This file records what the TypeScript type declares, not the live database."*
- **Why it matters.** R2 defines the file as *"the enum values confirmed live"*. With the comment's instruction, a
  developer adds a TS value and the JSON value together, and the gate stays green while the live enum lacks the value.
  That is exactly the failure this task exists to stop. The gate code is correct, and its printed scope is correct.
  Only the record's rule is inverted.
- **Fix.** Replace `_comment` with this, wording free, meaning fixed: *this file lists the `notification_type` values
  confirmed on the live database by the owner-run verify query. Add a value here only after its `alter type`
  migration is applied and the verify query returns zero rows, and cite that evidence in the commit. A
  `NotificationType` change without that evidence must leave this gate red.*

### 16.3 Finding R1-F2 (P3): a failed report lookup is silent. Requirement: R6.

`updateReportStatusAction`'s terminal branch reads `const { data: reportRow } = await db.from('listing_reports')…`
and discards `error`. If that select fails, neither the reporter nor the owner is notified and nothing is logged.
Destructure `error` and, when it is set, `console.error('[updateReportStatus] report lookup failed', { reportId, error })`.
Behavior is otherwise unchanged. Add one test: the select returns an error → `console.error` is called, no
`createNotification` call happens, and the result is `{}`.

### 16.4 Re-validation

1. Re-run `npm.cmd run check:notification-type-enum` → `40-gate-after-r1.txt`. Expect exit 0.
2. Re-run the whole §13.2 block, writing to `20`–`35` through the BOM-free write the session log already uses.
3. Append `## Revision 1` to the session log. Set the backlog cell to
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.
