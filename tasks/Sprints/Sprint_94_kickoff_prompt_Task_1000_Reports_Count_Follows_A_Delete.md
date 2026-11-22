# Task 1000 — The reports count follows a delete, and reads correctly in every language

Sprint 94. Priority P2. Owner decision: owner list item 27 (2026-11-19, translated): "In the admin, on the 'Reports'
page, after a report is deleted the number of reports is not updated without reloading the page." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

After the task: the number under the "Reports" heading drops by one as soon as a delete succeeds, with no reload, and it
is grammatical for every count in the four languages.

## Cause

Read at `dc5e3af66`
- The heading's number is rendered once on the server: `count: 'exact'` (`src/app/admin/reports/page.tsx:32-39`) becomes the static subtitle `t('reports_subtitle', { count })` (`:43-46`).
- A delete changes only the client list (`src/components/admin/AdminReportsManager.tsx:83-86`), whose tab badges follow it (`:65-69`); `deleteReportAction` revalidates nothing (`src/modules/listings/actions/reportListing.ts:270-296`), so the server-rendered number stays until a reload.
- The text has no plural: `"reports_subtitle": "{count} скарг"` (`messages/uk.json:994`) and `"{count} reports"` (`messages/en.json:994`) read "1 скарг", "2 скарг", "1 reports"; the file already uses the plural form elsewhere (`messages/uk.json:593`).
- Read-only 2026-11-19, `node reports-count.mjs` → `reports 0 {}`, so the owner's case is not visible in production data now; the code path above is the one every delete takes.

Fix: the manager owns the total (from the server's exact count) and lowers it on a successful delete; the subtitle is rendered from that state with a plural message.

## Scope

- `src/app/admin/reports/page.tsx`: passes `total={count ?? 0}` to `AdminReportsManager` and no longer renders the subtitle.
- `AdminReportsManager.tsx`: renders `AdminPageHeader` (title and subtitle) itself; `total` is state from the prop (`useStateFromProp`) and `handleDeleted` lowers it by one; the subtitle reads `t('reports_subtitle', { count: total })`. A failed delete leaves it unchanged (the dialog already returns before `onDeleted`).
- `messages/{sq,en,uk,it}.json` `admin.reports_subtitle`: the ICU plural of each language (`one`/`few`/`many`/`other` in uk, `one`/`other` in sq, en, it).
- Out of scope: the 200-row page size of the list (unchanged; the subtitle keeps the exact total).

## Attack surface

Attack surface: unchanged. The same page, data and action; only where the number is rendered changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Authorization: not applicable — the page's staff check and the action's permission check are unchanged.
- Authorization_Decisions_And_Output_Handling: not applicable — no decision changes; the page shows the same staff data.
- Authorization_Patterns: not applicable — the permission model and its enforcement points are unchanged.
- Authorization_Regression_Testing: not applicable — no authorization path is touched; the existing report tests stay green.
- Authorization_Testing_Automation: not applicable — the authorization matrix has no new row for this task.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the count renders through the message formatter as React text — AC3.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- JavaScript_and_TypeScript_Security: not applicable — a number in state; no merge, path setter or regular expression.
- Nextjs_Security: not applicable — no action, route or data read changes; the page still checks staff first.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results — AC4.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC1.

## UI

GR-0 queries: "page header subtitle count". Inspected: `AdminPageHeader`, `AdminReportsView` (tab badges) and its Story.
Decision: REUSE `AdminPageHeader` and `MantineBadge`; no new component. Reference research (GR-7): inherited canonical
design — owner decision 2026-10-20 (`AdminPageHeader`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminReportsManager.tsx — the reports heading and its count line
- Component families: structural-layout-and-feedback
- Pattern IDs: linear-flow
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-layout, android-adapt-layouts, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): heading and count line stacked as today; 640px transition unchanged
- Mobile order: heading → count line → tabs → list
- Required-content treatment: the count line wraps at full width; no truncation
- Story and verification: the AdminReportsView page Story at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 A delete lowers the number at once — test: `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` (extended): with `total` 3, a successful delete shows the subtitle for 2 and the tab badge for 2; a failed delete keeps 3.
- AC2 The page hands the exact total over — test: `src/app/admin/__tests__/reportsPage.test.tsx` (new): the page passes the query's `count` as `total` and renders no subtitle of its own.
- AC3 The number reads correctly — test: `src/i18n/__tests__/reportsSubtitle.test.ts` (new): uk 1 → "1 скарга", 2 → "2 скарги", 5 → "5 скарг", 21 → "21 скарга"; en 1 → "1 report", 2 → "2 reports"; sq and it singular and plural; and `node scripts/check-i18n-parity.mjs`.
- AC4 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read the reports page, `AdminReportsManager.tsx`, `ReportDetailDialog.tsx`, `AdminPageHeader.tsx`, the smoke test and the four message files.
2. Tests first (AC1-AC3); save each failing output.
3. The change. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5).
5. Report: each command, exit code, relevant output. After the merge Opus opens `/admin/reports` with `HYDRATION_ADMIN` in Ukrainian and reads the count line.

## Review
