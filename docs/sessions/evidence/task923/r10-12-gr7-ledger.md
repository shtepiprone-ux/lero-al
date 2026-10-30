# Task 923 Revision 10 - GR-7 execution audit and requirement / AC ledger (recorded BEFORE the first Revision 10 write)

Sonnet, 2026-10-19, win32, Node v22.22.3, Playwright from the repo, HEAD `564008e85` (`r10-11-i0.txt`, `r10-11-status-before.txt`).
Kickoff section 19 (R48, R49, R50). Library read: `docs/research/references/2026-10-04` (rows 059 Lahomes `/ui-offcanvas.html`, 008 / 009 Lahomes
`/property-grid.html` / `/property-list.html`, Kamr 052 `/table-filtering`; TailAdmin and Omah list pages). Live check in this session:
`r10-10-gr7-live.mjs` -> `r10-10-gr7/gr7-live.json`, run log `r10-10-gr7-live-run.txt` (EXIT_CODE=0).

## GR-7 live check

| Subject | Page (live) | Observed | Result |
|---|---|---|---|
| R48 modal focus containment | WAI-ARIA APG Dialog (Modal) pattern, HTTP 200 | literal: "modal dialogs contain their tab sequence. That is, Tab and Shift + Tab do not move focus outside the dialog" | supports the kickoff reason (C385) |
| R48 reflow | WCAG 2.2 Understanding SC 1.4.10 Reflow, HTTP 200 | literal: "Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions" | unchanged (mobile contract basis) |
| R48 drawer panel | Lahomes `/ui-offcanvas.html` at 390 and 1440 (6 panels operated each) | every Bootstrap offcanvas panel carries its header close control (1) at both widths; Tab stays inside 5 of 6 panels (the "Enable Body Scrolling" panel is Bootstrap's non-modal variant); no panel mounts a close control for one width only | reference shows an always-present close control, no compact-only one; not followed: the kickoff decision (D-record of R33 / R48) keeps the compact-only close of the bottom sheet |
| R48 filter apply | Lahomes `/property-grid.html` at 390 and 1440 | one offcanvas on the page, a button "Apply" at both widths | reference has an Apply control at every width |
| R48 filter search | Omah `/xhtml/property-list.html` at 390 and 1440 | a "Search" control, no offcanvas | not comparable |
| R49 table columns | TailAdmin `/basic-tables` at 768 and 390 (6 tables), Kamr `/table-filtering` at 768 and 390 (login `demo@example.com`), Lahomes `/property-list.html` at 768 and 390 | every table has `table-layout: auto` and 0 columns with a percentage width (`pct-cols 0` in all 10 table rows); at 768 Lahomes, Kamr and 3 of 6 TailAdmin tables scroll horizontally | confirms C405 (no production-like table carries percentage shares); the horizontal scroll is the rejected option (section 7.3 forbids it, D36) |

Not re-operated: Kamr and Omah filter or drawer pages (no drawer page exists in their library rows: only Kamr `/table-filtering`, a table page). No reference page
decides R48 or R49: section 19.4 records that Revision 10 makes no new visual decision (R48 changes no markup; R49 changes fixture data under D36).
Absent or unverified: a reference compact-only close control (none found live).

## Requirement and acceptance ledger (Revision 10)

| ID | What is written | Where | Proof (AC) |
|---|---|---|---|
| R48 (a) | `useMantineDrawerPresentation(): 'sheet' \| 'side' \| null`, a context provided around the children in both branches, value = the `isMobile` already read from `useResponsiveDropdown` | `src/design-system/mantine/patterns/MantineDrawer.tsx` | AC52 |
| R48 (a) export | "Export it from `patterns/index.ts`" | `src/design-system/mantine/patterns/index.ts` is NOT in the scope of `Sprint_78_Task_923_security_record_owner_fixes.security.json` (checked, `r10-11-i0.txt`) | BLOCKED, reported to Opus; `ListingsFilters.tsx` imports from `MantineDrawer.tsx` directly (it already imports `MantineBadge` that way) |
| R48 (b) | `useMediaQuery`, `belowMobileGateQuery`, `isCompact` removed; close icon and Apply mount when `onClose` is set and the presentation is `'sheet'`; no `hiddenFrom` / `visibleFrom` on them | `src/modules/listings/components/ListingsFilters.tsx` | AC52 |
| R48 (c) | new test: matchMedia matching the gate -> `'sheet'`, otherwise `'side'`, outside a drawer `null` | `src/design-system/mantine/patterns/__tests__/MantineDrawer.presentation.test.tsx` | AC52 |
| R48 (d) | T6 / T6b inside `<MantineDrawer opened onClose>`, comment at :446-447 states the R48 reason, two new top-level tests named exactly as SEC-R48-FE-ALLOW / -DENY | `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | AC52, contract cases SEC-R48-FE-* |
| R48 (e) | unchanged: `ListingsShellView`, the bottom sheet, the Story | read only | AC52 |
| R49 | `width` removed from the four columns of `makeArgs`, one comment line added | `src/stories/mantine/primitives/Table.stories.tsx` | AC53 |
| R50 | owner permissions quoted verbatim with the date, or `verbatim text not retained` | `docs/sessions/2026-10-10-task923-rendered-state-census.md` rows 1056-1057 | AC53 |
| AC51 rerun | vitest, census, fit check, `cli.mjs verify` on the owner-fixes contract, `npm run build` on the final code | evidence prefix `r10-` | AC51 |

Preserved behaviour: `ListingsShellView` hosts the panel in `MantineDrawer` at every width (C390); the bottom sheet has no close button of its own (C393); the Story renders the
panel in `MantineDrawer` (C397); T6 / T6b assertions are unchanged (C399); the close icon and Apply keep markup, order, tokens and touch targets, so nothing looks different at any
width. Negative flows: no `onClose` -> neither control; outside any drawer (`null`) -> neither control; side drawer -> neither control; sheet -> both; a CSS-hidden control is never in the DOM.
QA profile: Q4 (kickoff section 7, owner-fixes contract). Task-owned write scope: the six paths above plus evidence `docs/sessions/evidence/task923/r10-*`; `index.ts` excluded (scope).
Evidence prefix `r10-` is the executor's choice: section 19 names none; Revision 9 used `r9-` beside Opus's `review-9/`.
