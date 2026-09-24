# Sprint 82 — notifications the code writes and the database has always refused

**Opened:** 2026-09-24 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (880)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by the owner's report, 2026-09-24** (verbatim): *"Не приходить сповіщення на сайт про те, що було
> надіслано повідомлення на пошту через кнопку "надіслати повідомлення" на сторінці оголошення. схоже регрессія,
> жодне сповіщення не приходить, ні коли користувач надсилає повідомлення через кнопку "надіслати повідомлення" на
> сторінці оголошення. Також якщо на користувача подали скаргу - користувач не отримує сповіщення."*
>
> Test method, verbatim: *"я залогінився під тестовим акаунтом 1 і подав скаргу на тестовий акаунт 2. Потім зайшов в
> адмінку і прийняв скаргу на розгляд. Потім її розглянув і натиснув "Вирішити". У іншому браузері я був залогінений
> під тестовим акаунтом 2 і після кожної зміни статусу скарги я оновлював сторінку … Але сповіщення так і не
> прийшло."*

## The defect

This was measured on the live database with owner-run read-only SQL on 2026-09-24. The grids are quoted in 880's
kickoff §3.

1. **The database refuses two of the nine notification types the code writes.** `enum_range(null::public.notification_type)` =
   `new_message, saved_search_match, listing_status_change, support_reply, listing_expires_soon, agent_verified,
   marketing`. `src/types/database.ts:50` also declares **`report_outcome`** and **`price_change`**.
   - Every insert of either value fails.
   - `createNotification` (`src/modules/notifications/lib/mutations.ts:36-38`) swallows the failure into
     `console.error`.
   - The live table therefore holds **zero** `report_outcome` rows and **zero** `price_change` rows. `report_outcome`
     was introduced by Task 125. The owner's test report is `resolved` twice in `report_actions`, and its reporter was
     never notified.
   - Every test mocks the database, so nothing in the repository could see the mismatch.
2. **Filing a listing report notifies no one.** `reportListingAction` (`src/modules/listings/actions/reportListing.ts:23-70`)
   inserts the report and returns. On a terminal status, only the **reporter** is addressed, and that insert is refused
   by (1). The listing owner is never told anything.
3. **"Send message" has never created an in-app notification.** `submitListingInquiry` (Task 243) stores the inquiry
   and emails the owner. `2744db1ac` (2026-05-17) recorded *"`new_message` notifications require the messaging module
   (not yet built)"*.

**The owner's "regression" premise is not supported.** (1) has been broken since `report_outcome` was introduced,
and (3) never existed. The notification system itself works: `listing_status_change` rows are still being written,
the last one on 2026-09-20; RLS is correct; and `notifications` is in the `supabase_realtime` publication.

## Owner decisions this sprint carries

| ID | Decision (verbatim) | Date | Effect |
|---|---|---|---|
| **D82-1** | The owner's report and test method, quoted above. | 2026-09-24 | Opens the sprint. |
| **D82-2** | Q: "When a listing is reported, when should its owner get a notification on the site?" → *"On filing + outcome (Recommended)"*. The option read: *"The owner learns a report was filed (without the reporter's identity) and learns the moderation decision."* | 2026-09-24 | 880 R4–R5: the owner is notified when a report is filed, and again when it is resolved or dismissed. The reporter's identity is never included. |
| **D82-3** | Q: "Where should the new 'you received a message' notification link?" → *"To the listing (Recommended)"*. The option read: *"The notification opens the listing the message was about; the email stays the main channel for the message text. The inquiries inbox becomes a separate task."* | 2026-09-24 | 880 R3 links to `/listings/<slug>`. There is no inquiries inbox, and none is built here. |
| **D82-5** | Added while 880 was being designed, verbatim: *"ітакож додай функціонал сповіщень про неадіслані повідомлення на пошту"*. Q: who is notified → *"Listing owner (Recommended)"*. The option read: *"The owner gets a separate on-site notification saying a message about the listing arrived but the email wasn't delivered. The sender's contact details (name and email) are included so the owner can reply, since there's no inbox on the site."* Q: which emails → *"Only the 'send message' button (Recommended)"*. | 2026-09-24 | 880 R3: when the inquiry email fails, the owner gets `listing_inquiry_email_failed` with the sender's name and email **instead of** the plain `listing_inquiry`. Other emails are out of scope. |
| **D82-4** | Q: the live `notifications` grants (`anon`/`authenticated` hold every privilege) → *"Separate task (Recommended)"*. The option read: *"Its own number in Sprint 80 (Data API privileges), so the notifications task stays narrow."* | 2026-09-24 | **881** is reserved in **Sprint 80**. 880 changes no grant. |

## Why a new sprint — goal fit checked against every open sprint

| Sprint | Its goal | Fits? |
|---|---|---|
| **46 · 55 · 56 · 57 · 61 · 62** | ListingCard de-Tailwind / ARIA / raw enum leaks / deletion / projection layer / Tailwind tokens | No. |
| **69 · 70 · 71 · 72 · 73 · 74** | `/listings`, site chrome, listing detail, similar listings, sold listings, card width | No — UI surfaces and listing visibility, not notification delivery. |
| **77** | The full test suite is red | No. |
| **78** | Admin and agent dashboards | No. |
| **79** | CMS pages nobody can read | No. |
| **80** | Data API privileges | **Closest, and still no.** The enum is a schema/type mismatch, not a privilege. 881 (the grants) **does** fit 80 and goes there (D82-4). |
| **81** | Sign-out, and the header's render tree proven | No. The bell displays notifications correctly; the defect is that they are never written. |

## Goal

1. Every value of the TypeScript `NotificationType` is accepted by the live `notification_type` enum, and a CI gate
   fails the next time the two diverge.
2. A listing owner gets an in-app notification when someone sends a message about the listing, when the listing is
   reported, and when that report is resolved or dismissed. The reporter still gets theirs, and now it actually
   arrives. When the "send message" email fails, the owner still learns about the message, with the sender's
   contacts (D82-5).
3. A notification failure never changes the result of the action that caused it.

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from a kickoff header.

| # | Title | Priority | QA | Depends on | State |
|---|---|---|---|---|---|
| **880** | The notification enum accepts every type the code writes (`report_outcome`, `price_change`), a CI gate keeps the two equal, and the listing owner is notified on a message (with the sender's contacts when its email fails, D82-5), a report and its outcome | **P1** | **Q4** | **878** archived (both touch `NotificationItem.tsx` and the shared fixture) | 📝 `KICKOFF FILED` 2026-09-24 → [`…Task_880…`](Sprint_82_kickoff_prompt_Task_880_Notification_Enum_Report_And_Inquiry_Notifications.md) |

## Owner actions this sprint needs

| ID | Action |
|---|---|
| **O82-1** | After 880's executor reports: apply `scripts/task-880-notification-type-enum.sql`, then run `scripts/task-880-verify.sql` and return its result (kickoff §13.3). It is additive, and it is safe to apply before the deploy. |
| **O82-2** | 880's `OWNER VISUAL QA REQUIRED` matrix (kickoff §13.3). |
| **O82-3** | After deploy, repeat the D82-1 test with two accounts, and also send a message on account 2's listing. Expected results are in kickoff §13.3. |

## Explicitly not in this sprint

- **An inquiries inbox in the cabinet** (D82-3). This is a candidate for a later task once the owner schedules it.
- **The `notifications` grants.** That is **881**, in Sprint 80 (D82-4).
- **Notifying the reported user about an admin-created `user_complaint` ticket.** The code already does this
  (`createSupportTicket`, type `support_reply`, which the enum accepts). The live table has **zero** `user_complaint`
  tickets, so this path was not what the owner tested. Its resolution notification uses `report_outcome`, and 880's
  enum fix repairs it without a code change.

## Exit criteria

1. O82-1's verify query reports no `NotificationType` value missing from the live enum.
2. `check:notification-type-enum` is in CI, fails on both planted arms, and passes restored.
3. `npm run test:listings` and 880's new tests pass, and `npm run build` exits 0.
4. O82-3: account 2 receives the report-filed, report-outcome and new-message notifications, and account 1 receives
   its report outcome.
