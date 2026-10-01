# Task 858 — `/admin/reports` honours `?status=` and moves to canonical Mantine — session log

**Date:** 2026-10-01 · **Executor:** Sonnet · **Kickoff:** `tasks/Sprints/Sprint_78_kickoff_prompt_Task_858_Admin_Reports_Status_Landing_On_Mantine.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` · QA Q4 · owner visual QA O78-11 owed (30 tuples, kickoff §13.3).
Evidence: `docs/sessions/evidence/task858/` (exit codes appended unpiped; BOM-free).

## Receipts

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/reports (list View, detail dialog View, page wrapper, URL filter); semantic queries: status tabs with counts, admin data table to cards, modal confirm, status select, textarea, admin page header, admin page width; inspected candidates: Tabs (AdminUsersTable.tsx:426-441, Mantine/Primitives/Tabs), AdminTable (components/admin/AdminTable.tsx → Patterns/Mantine/AdminTable), MantineDataTableToCards, MantineModal (patterns/MantineModal.tsx), MantineSelect (patterns/MantineSelect.tsx), AdminPagesView (868 precedent), AdminPageHeader, adminPageMaxWidth (src/app/admin/currency/page.tsx); decision: REUSE + COMPOSE (two Views with own Stories); selected canonical owner: components/admin/AdminTable.tsx, patterns/MantineModal.tsx, patterns/MantineSelect.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing sm/md/xl/2xl, fz sm/xs, iconSize badge/compact/standard, touchTarget; new hardcoded visual values: NONE; rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — AdminReportsView / ReportDetailDialogView × R7 states; canonical candidates: NONE (Admin/AdminReportsManager rendered the legacy component; deleted); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views.`

`GR-1 CENSUS COMPLETE — 14 nodes after (13 before); tier1 2 Views migrated+enrolled+story + 2 container-exempt (AdminReportsManager, ReportDetailDialog) + page.tsx root; AdminPageHeader/RelativeTime/AdminTable/MantineDataTableToCards/MantineModal/MantineSelect reused; tier2 6 imports removed; tier3 none — filed as none.`
Before: `02-census-before.txt` (13 nodes, 75 + 15 `ui/*`). After: `11-census-after.txt` — FAIL lines are exactly `page.tsx`, `AdminReportsManager.tsx`, `ReportDetailDialog.tsx` (the §3.1 calibration), all `className:0 ui-imports:0`.

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled components only; it cannot see an unenrolled one; the criterion is closed by the census (11-census-after.txt) and the two own Stories.`

`GR-3 STORY PROVEN — AdminReportsView ← src/stories/patterns/mantine/AdminReportsView.stories.tsx; ReportDetailDialogView ← src/stories/patterns/mantine/ReportDetailDialogView.stories.tsx.`

Measured with the repo's Playwright against `storybook-static` (`30-measurements.json`; locale via `globals=locale:`), after the final Storybook build.

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminreportsview--{default,all-tab,empty}: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440 (component = the R6-less Story root, fluid; parent = viewport; 768 720/768); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-reportdetaildialogview--{pending,full-management,terminal-reopen,owner-missing,delete-confirm,saving}: 320 sheet 320/320 · 390 390/390 · 1024 modal 440/1024 · 1440 440/1440 (768 440/768); overflow: none (document and dialog); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — AdminReportsView (all exports): tab label 320 14 · 390 14 · 768 14 · 1440 14; table cell 768 14 · 1440 14; card title (<640) 14, badge/meta 12; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — ReportDetailDialogView (all exports): dialog title 320 16 · 390 16 · 768 16 · 1440 16; row/body text 14 at every width; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

`GR-3d STORY GUTTER CHECK — patterns-mantine-adminreportsview--{default,all-tab,empty}: gutter StoryPageGutter all (the View root sets no page gutter; the page `Box` of page.tsx does); top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32 (768 24/24/24/24) (expected 24 · 16/16/32/32 · 24); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.` Bottom: measured at the end of the document where the content is taller than the viewport (`all-tab` 320/390 = 24); where shorter, the document's remainder is viewport whitespace and the wrapper's `py` is 24 by construction.
`GR-3d STORY GUTTER CHECK — patterns-mantine-reportdetaildialogview--*: gutter n/a: overlay-only; no page content.`
`AdminPageHeader` (blast-radius row): not changed; its Story was not touched or re-measured (kickoff §12.2: "profile present").

## Plants (hash before = after restore on all four)
P1 (initialFilter ignored) → T1 fails · P2 (no `router.replace`) → T2 fails · P3 (Delete without `canDeleteReports`) → "both caps false → no Delete" fails · P4 (re-added `ui/badge` in the View) → census exit 1 naming `src/components/ui/badge.tsx`. Files `P1.txt`–`P4.txt` carry the three hashes and exit codes.

## Where the 11 original tests select now
Rows: `tbody tr` (unchanged). Dialog: `getByRole('dialog', { name: 'Report detail' })`. Owner link: `within(dialog).getByRole('link', { name: 'Open profile' })`. Tabs: `getByRole('tab', { name: /^Resolved/ })`. Delete / reopen / override: preserved testids inside the dialog. Delete confirm: `findByTestId('delete-confirm-dialog')` then `confirm-delete-btn` / Cancel by role. Esc test now sends a real `Escape` keydown (previously it clicked Cancel). Resolve: `getByRole('button', { name: 'Resolve' })`. Toast assertions use the real `en` strings.

## Deviations and questions for Opus
1. **New file `src/components/admin/reportStatusFilter.ts`** (outside kickoff §7). `parseReportStatusParam` must be callable from the server `page.tsx`; a `'use client'` module's exports are client references, and a Next page file may not export it. The type and the tab list moved there with it. T3 imports it from there, not from `page.tsx`.
2. **R10 "no key added" vs R3.** The baseline diff (`20-baseline-diff.txt`) removes the six `ui/*` tier-2 keys and **adds one** tier-1 key, `page.tsx :: ReportDetailDialog.tsx :: tier1-unenrolled-or-unstoried` — unavoidable with R3's separate container file and the §3.1 calibration that names it. The manager's own key is unchanged.
3. **AC5's grep is not empty.** `20b-reference-audit.txt` lists only historical records (review log artifacts, Epic/Sprint kickoffs including this one). Zero hits in `src`, `scripts`, `.github`, `.storybook`, `package.json`.
4. **Anchors in `check-stories-rendered.mjs`.** The `dialog-content` slot is the dead shadcn `data-slot` convention (the script's own comments); Mantine modals render no such attribute. The Pending entry anchors on the owner link selector, DeleteConfirm on `delete-confirm-dialog` + `delete-btn`. `MantineModal` has no testid prop, so `delete-confirm-dialog` sits on a `Stack` that wraps the body and its buttons.
5. Added a third i18n-dynamic entry (`admin-reports-status-dialog`) for the dialog's status keys; the two existing sites now point at `AdminReportsView.tsx:34` / `:88`.
6. Beyond R2: `useEffect(() => setFilter(initialFilter), [initialFilter])`, so a navigation to another `?status=` while the page stays mounted updates the tab.
7. `check:stories` Check 4 rejected a hard-coded `locale="sq"` in the dialog Story; it now uses `useLocale()`.
8. Plants were not run for GR-3 receipts; no automated gate reads computed sizes or edge gaps (GR-2).

## Gates (all exit 0 after the last edit)
tests 52/52 (3 files) · typecheck · lint · check:story-coverage · check:rendered-scope · check:surface-census:changed (`--base HEAD`; the npm script needs a base) · check:design-tokens · check:enrolled-tailwind · check:i18n · check:i18n-dynamic · check:file-integrity · check:mojibake · build-storybook · build. The census-changed baseline was regenerated with `node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline` (the npm alias fails without `--base`).

## Not done / owed
O78-11 (30 tuples) and the post-deploy ADM-02 click-through are the owner's. No visual verdict is claimed.

## Files Changed (every task path in the working-tree status, after revision 1)

| Path | Change | Reason |
|---|---|---|
| `src/app/admin/reports/page.tsx` | M | R1 `searchParams` → `initialFilter`; R6 Mantine `Box` wrapper |
| `src/components/admin/AdminReportsManager.tsx` | M | R2 container (tab ↔ `?status=`, `router.replace`) |
| `src/components/admin/ReportDetailDialog.tsx` | A | R3 container extracted |
| `src/components/admin/AdminReportsView.tsx` | A | R4 list View |
| `src/components/admin/ReportDetailDialogView.tsx` | A, reworked in rev 1 | R5 → R11–R16 detail dialog View |
| `src/components/admin/reportStatusFilter.ts` | A | server-callable `parseReportStatusParam` (review 1 §16) |
| `src/stories/patterns/mantine/AdminReportsView.stories.tsx` | A | R7 |
| `src/stories/patterns/mantine/ReportDetailDialogView.stories.tsx` | A; rev 1: fixture date | R7, R18 |
| `src/components/admin/AdminReportsManager.stories.tsx` | D | legacy Story removed (R7) |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | M | R9 migration; rev 1: delete-confirm selectors (AC14) |
| `messages/{en,uk,sq,it}.json` | M (rev 1) | R17 `comment_label`, `section_moderation` |
| `scripts/mantine-migration-scope.json`, `story-coverage-exempt.json`, `check-stories-rendered.mjs`, `i18n-dynamic-manifest.json`, `surface-census-baseline.json` | M | R8, R10; rev 1: manifest lines only |
| `docs/critical-flow-registry.md` | M | R9 row `:67` |
| `docs/backlog.md` | M | the 858 cell |
| `docs/sessions/2026-10-01-task858-admin-reports-mantine.md`, `docs/sessions/evidence/task858/**` | A | this log and evidence |

## Revision 1 — the detail dialog gets an order (kickoff §17)

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence: `docs/sessions/evidence/task858/rev1/`. Not touched: `AdminReportsView`, its Story, the containers, `page.tsx`, the census baseline. P1, P2, P4 not re-run.

`GR-0 CANONICAL REUSE PREFLIGHT — request: ReportDetailDialogView body/footer re-layout (rev 1); semantic queries: dialog facts grid, modal action footer, confirm footer, subtle destructive button, labelled divider; inspected candidates: MantineModal footer slot, AdminUserProfileDialogsView.tsx ConfirmFooter (Patterns/Mantine/AdminUserProfileDialogsView), AdminPagesView delete footer; decision: EXTEND/COMPOSE; selected canonical owner: patterns/MantineModal.tsx; Mantine/TailAdmin token path: spacing tight/sm/md/lg, fz xs/sm, iconSize badge/compact/standard; new hardcoded visual values: NONE; rationale: all values are theme keys.`
`GR-3a STORY PREFLIGHT — ReportDetailDialogView × rev-1 layout; canonical candidates: Patterns/Mantine/ReportDetailDialogView; direct-import evidence: src/stories/patterns/mantine/ReportDetailDialogView.stories.tsx:2; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND; target: patterns-mantine-reportdetaildialogview--*; rationale: same Story, fixture date only.`
`GR-3 STORY PROVEN — ReportDetailDialogView ← src/stories/patterns/mantine/ReportDetailDialogView.stories.tsx.`
`GR-3d STORY GUTTER CHECK — patterns-mantine-reportdetaildialogview--*: gutter n/a: overlay-only; no page content.`
`GR-2 SCOPE STATED — the vitest suite sees behaviour, not geometry; it cannot see layout or font sizes; AC9–AC12 are closed by 20-layout.json (Chromium over storybook-static, 30 measurements).`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-reportdetaildialogview--{pending,full-management,terminal-reopen,owner-missing,delete-confirm}: 320 sheet 320/320 · 390 390/390 · 1024 modal 440/1024 · 1440 440/1440; overflow: none (document and dialog, 30/30); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-reportdetaildialogview--{same five}: modal title 320 16 · 390 16 · 1024 16 · 1440 16; body text nodes 12 and 14 only at every width (captions and divider label 12, values/buttons/notes 14), date value 14; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

Acceptance (all from `20-layout.json`: sq+uk at 390/1440, en at 320/1024, 30 measurements, 0 failing):
- AC9: four facts in two rows of two, tops equal, column widths equal, each value's left edge = its caption's. ✔
- AC10: footer = `report-dialog-footer`; the last button's right edge = the footer's at every width; at 320/390 every footer button is footer width and the first in visual order is Resolve (`Pending`, `FullManagement`, `OwnerMissing`) or `reopen-btn` (`TerminalReopen`). **Open point:** AC10 says every visible button except the modal close and the `MantineSelect` input is in the footer, but R14 puts `Apply` in the moderation section (`FullManagement`, `TerminalReopen`), so `Apply` is the one body button. I kept R14 (also the unchanged behaviour and testid placement).
- AC11: body text 12/14 only, date 14 (the 16px readings in a raw text walk are Mantine `<style>` tags and the modal title, excluded). ✔
- AC12: the last body element is the moderation section; exactly one divider, labelled, 12px. Every current Story export has override or open status, so the "comment block last" case is not exercised. ✔
- AC13: `check:i18n` exit 0; `report_comment_label` 0 hits, `comment_label` 1 hit in the View. ✔
- AC14: 14 tests, names unchanged, 52/52 in the 3-file run. Selector change: the delete-confirm buttons moved into the modal footer, outside `delete-confirm-dialog`, so three tests resolve them through `findByRole('dialog', { name: 'Delete report?' })` instead of `within(confirmDialog)`. Everything else unchanged. P3 re-run on the final hash: `P3.txt` — hash before = after restore; "both caps false → no status Select, no Reopen, no Delete" fails.

Gates (`rev1/00`–`14`): tests 52/52 · census = the three calibration FAIL lines (exit 1) · typecheck · lint · design-tokens · enrolled-tailwind · i18n · i18n-dynamic · story-coverage · mojibake · build-storybook (`check:stories` 0 violations) · build — all exit 0. `check:file-integrity`: `10-file-integrity.txt`.

Final hashes: `rev1/21-hash-object.txt` (View `d30c5bd5…`; pre-revision `af86f8e2…`).
Notes: the footer's empty `Box visibleFrom="sm"` (no delete) is hidden below 640 so it adds no phantom gap. The listing `Anchor` wraps a `Group` with the title (`lineClamp={2}`) and the icon in a `flex="none"` box, so the icon cannot wrap alone. O78-11 (16 tuples, kickoff §17.8) is owed.
