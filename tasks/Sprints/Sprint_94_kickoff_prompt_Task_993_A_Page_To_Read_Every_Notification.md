# Task 993 — A page to read every notification in full, and the drawer's two buttons where the owner placed them

Sprint 94. Priority P2. Owner decisions: owner list item 8 (2026-11-19, translated): "A notification such as 'A report on
your account | An administrator opened a report about your account. Our team…' cannot be read in full. Make a separate
page where notifications are read in full. A click on a notification takes the user to the page with all notifications:
the list on the left, the text of the active notification on the right. A notification counts as read as soon as the user
opened it in full on that page. Build it by the UX best practices of 2026."; item 14 (translated): "the 'Mark all as read'
text button in the notifications drawer: make it a centred canonical Mantine button under the drawer title, before all
notifications; a 'Show all notifications' button under the list, at the very bottom of the drawer." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

A notification longer than two lines can never be read in full, because the site has no notifications page and the drawer
clips each item. After the task: `/<locale>/notifications` lists the signed-in person's notifications with a reading pane
(two panes from 640px, one pane at a time below it); a click on a drawer item opens that page on the item; an item counts
as read when its full text is shown in the pane; the drawer has a centred "Mark all as read" button under its title and a
"Show all notifications" button at its bottom.

## Cause

Read at `dc5e3af66`
- No page: `ls src/app/[locale]` → `[slug] __ci auth cabinet ci contact favorites layout.tsx listings page.tsx`; measured 2026-11-19 with `HYDRATION_AGENT1`: `node perf-server.mjs` → `agent html /uk/notifications status 404`.
- The drawer item is the only reader and opens the stored link, or nothing when there is none (`src/modules/notifications/components/NotificationItem.tsx:289`, read on click at `:160-166`).
- The drawer header holds a transparent text button next to the title (`src/modules/notifications/components/NotificationCenter.tsx:49-74`) and the drawer has no link to a full list.

Fix: a new page with a canonical list-and-reading-pane pattern; the drawer item opens that page; the read mark moves to the pane; the drawer header and footer get the two canonical buttons.

## Scope

- Dependencies: Task 988 (the reading pane's "Open" action uses `notificationHref`, the same line of `NotificationItem`).
- `src/design-system/mantine/patterns/MantineListDetailPattern.tsx` (CREATE, no existing owner covers it: `MantineDetailList` is a key-value list, `MantineNavRowList` a link list) and its Story `src/stories/patterns/mantine/ListDetailPattern.stories.tsx`: props `list`, `detail`, `hasSelection`, `backLabel`, `onBack`; from 640px a list column (`theme.other` width token, new) and the pane side by side, each scrolling on its own; below 640px the list, or the pane with a "Back" button when an item is selected; registered in `scripts/mobile-adaptation-patterns.json` under `navigation-and-pagination`, and added to this kickoff's "Mantine owner" line in the same change (the gate accepts only registered owners).
- `src/app/[locale]/notifications/page.tsx` (new): signed-in only (guest → sign-in with `next`); reads the viewer's own rows through the session client (row security), 20 per page with `MantinePagination`; `?id=<uuid>` selects an item; an id that is not the viewer's row shows the pane's "not found" state.
- `src/modules/notifications/components/NotificationsPageView.tsx` (new): the list rows reuse `NotificationItem`'s localized title and body resolution (extracted into `src/modules/notifications/lib/notificationText.ts`, no second copy); the pane shows title, full body, date in the reader's locale and an "Open" button with `notificationHref` (988) when it gives a path; showing an unread item calls `markNotificationRead` once and refreshes the bell count.
- `NotificationItem.tsx`: a click opens `/<locale>/notifications?id=<id>` and closes the drawer; it no longer marks read.
- `NotificationCenter.tsx`: the title, then a centred `Button variant="default"` "Mark all as read" (only with unread items), the list, and a footer `Button` "Show all notifications" at the bottom of the drawer (`/<locale>/notifications`).
- Stories: `NotificationCenter` (both buttons, no unread, empty), `ListDetailPattern` (list, selected, not found, empty) and the page view. Messages in four locales (`notifications.page_*`, `notifications.show_all`).

## Attack surface

Changed: a new signed-in page that reads notifications by an id from the address.
1. **What are we working on?** `/<locale>/notifications` (any signed-in person) reading `notifications` with the
   session client; `?id=` is caller input; `markNotificationRead` (existing action).
2. **What can go wrong?**
   - T1 I (direct object reference): `?id=` of another person's notification is shown or marked → mitigate: the session client under the
     existing row security; an id outside the viewer's rows renders "not found" and marks nothing → AC2,
     `SEC-993-NOTIF-READ-DENY`.
   - T2 I: a guest or a blocked session reaches the page → mitigate: the viewer check of `requireViewer` before any read
     → AC2.
   - T3 T: the stored link of a row becomes an off-site action → mitigate: `notificationHref` of 988 → AC3.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: row `SEC-993-NOTIF-READ-DENY` (a signed-in person, another person's id → not found, no update).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new page and its `?id=` input — AC2.
- Authentication: not applicable — sign-in is unchanged; the page only sends a guest to it.
- Authentication_Patterns: not applicable — the page uses the existing session and viewer check.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the page checks the viewer before any read and reads under row security — AC2.
- Authorization_Decisions_And_Output_Handling: not applicable — no decision is added; the output is the viewer's own rows.
- Authorization_Patterns: not applicable — row security of `notifications` stays the enforcement point, unchanged.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-993-NOTIF-READ-DENY` fails if the page reads with a client that skips row security — AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the own-rows case runs on the real development project — AC2.
- Cookie_Theft_Mitigation: not applicable — no cookie is set or read beyond the existing session.
- Credential_Stuffing_Prevention: not applicable — no sign-in path is added.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — titles and bodies render as text through the existing resolution; the action link passes `notificationHref` — AC3.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — `?id=` only selects a row; it reaches no sink — AC2.
- Injection_Prevention: not applicable — the registry edit is data read by a check script; no interpreter input is built.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the id is looked up only among the viewer's rows — AC2.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — `?id=` selects within the viewer's own rows, never across them — AC2.
- Multifactor_Authentication: not applicable — the factors of sign-in are unchanged.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — `markNotificationRead` keeps its own viewer check and row filter — AC3.
- OS_Command_Injection_Defense: not applicable — no operating system process is started.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC2 and AC3.
- Session_Management: not applicable — no session is created or renewed by the page.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate break included — AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the pane renders text nodes only — AC3.

## UI

GR-0 queries: "list with a reading pane", "master detail", "inbox". Inspected: `MantineDetailList`, `MantineNavRowList`,
`MantineNotificationPattern`, `NotificationCenter` and `NotificationItem` with their Stories, `MantineDialogDrawerPattern`.
Decision: CREATE `MantineListDetailPattern` (no owner holds two coordinated panes); EXTEND `NotificationCenter`; REUSE
`NotificationItem`, `MantinePagination`, `Button`. Reference research (GR-7), live 2026-11-19 at 1440 and 390: TailAdmin
`/inbox-details` (list column and reading pane, a back arrow and "4 of 120" in the pane toolbar), TailAdmin
`/notifications`, Lahomes `messages.html` (at 390 one pane at a time, the list behind a button). Primary source of the
adaptive pattern: Android "Adapt layouts" list-detail and Apple HIG split views (catalogue rows of `navigation-adaptive`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/app/[locale]/notifications/page.tsx — the list and the reading pane; src/modules/notifications/components/NotificationCenter.tsx — the drawer header button and footer button
- Component families: navigation-and-pagination, overlay-and-disclosure
- Pattern IDs: navigation-adaptive, overlay-adaptive
- Standards: w3c-focus-order, apple-hig-navigation-search, android-layout-navigation, android-adapt-layouts, w3c-hover-focus, apple-hig-sheets, android-common-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantinePagination.tsx, src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): one pane at a time, the pane with a Back button; 640px transition to the list column and the pane side by side
- Mobile order: page — heading → list → pagination; selected — Back → title → date → body → Open; drawer — title → Mark all as read → items → Show all notifications
- Required-content treatment: the full body wraps in the pane; list rows keep their two-line clamp and open the full text in the pane, a canonical directly reachable disclosure
- Story and verification: ListDetailPattern and NotificationCenter Stories and the page at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 The pattern adapts — test: `src/design-system/mantine/patterns/__tests__/MantineListDetailPattern.test.tsx` (new): below 640px the list alone, or the pane with Back when `hasSelection`; from 640px both; Back calls `onBack`.
- AC2 The page shows only the viewer's notifications — test: `src/app/[locale]/notifications/__tests__/notificationsPage.security.test.tsx` (new): a guest is sent to sign-in with `next`; the list reads through the session client; `SEC-993-NOTIF-READ-DENY`: an id that the read does not return → "not found", `markNotificationRead` not called; and `src/tests/integration/notificationsOwnRows.integration.test.ts` (new, CI `authz` job): another person's id returns no row.
- AC3 Reading marks read and opens safely — test: `src/modules/notifications/components/__tests__/NotificationsPageView.test.tsx` (new): showing an unread item calls `markNotificationRead` once, a read one never; the full body renders unclipped; "Open" uses `notificationHref` and is absent for `null`.
- AC4 The drawer follows item 14 and item 8 — test: `src/modules/notifications/components/__tests__/NotificationCenter.layout.test.tsx` (new): "Mark all as read" is a centred `Button` after the title and before the first item, absent without unread items; "Show all notifications" is the last element and links to `/<locale>/notifications`; an item click goes to `/<locale>/notifications?id=<id>` and marks nothing.
- AC5 One text resolution — test: `src/modules/notifications/lib/__tests__/notificationText.test.ts` (new) carries the cases of `NotificationItem.templateLocalization.smoke.test.tsx`, which stays green.
- AC6 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the new and changed Stories.
- AC7 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Starts after Task 988 is merged. Branch from `main`. Read `NotificationItem`, `NotificationCenter`, `useNotifications`, `mutations.ts`, `requireViewer`, `MantinePagination`, the two Stories, the reference screenshots of the design (evidence).
2. Tests first (AC1-AC5); save each failing output.
3. The pattern and its Story, the text helper, the page and its view, the drawer. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; one deliberate break of the own-row check (a query without the session), restored.
5. Report: each command, exit code, relevant output. After the merge Opus opens the page with `HYDRATION_AGENT1` at 390 and 1440 in Ukrainian, reads a long report notification in full and checks the bell count.

## Review
