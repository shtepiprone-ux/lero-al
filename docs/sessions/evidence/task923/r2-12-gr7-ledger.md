# Task 923 Revision 1 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 1 write)

Sonnet, 2026-10-10, win32, Node v22.22.3, Playwright from the repo. Kickoff section 10 (R10-R14, AC6-AC10). D1 of
Revision 1 (ordering) is honoured: this file, `r2-10-gr7-live.json` and `r2-11-i0.txt` precede every edit below.

## GR-7 (moment: execution)

Subject: how an overlay behaves at open / Escape and whether a page scrolls sideways (the behaviours R10-R14 measure).
Library: `docs/research/references/2026-10-04`. Live check, this session, 390x844 (`r2-10-gr7-live.json`):

| Reference | Page | Observed | vs library / first pass |
|---|---|---|---|
| Lahomes | /ui-modal.html "Launch demo modal" | page scrollWidth 390 = clientWidth 390; focus lands on the dialog (`DIV.modal`); Escape closes it | unchanged |
| TailAdmin | /modals "Open Modal" | page scrollWidth 390 = clientWidth 390; focus stays on the trigger button; no dialog matched `[role=dialog]` after open | unchanged (first pass: Escape does not close) |
| Kamr | /ui-modal (login) | NOT re-operated in this revision | first-pass record `research-exec/r1-gr7-live.json` stands, not relied on for R10-R14 |
| Omah | no modal page in the library | not opened | UNVERIFIED, not relied on |

Chosen practice: WCAG 2.2 SC 1.4.10 Reflow (no two-dimensional scrolling of ordinary content - R10 measures the
page itself) and the WAI-ARIA modal-dialog pattern (R13 records where it does not apply). No reference contradicts R10-R14.
Absent or unverified: Kamr live re-operation, Omah modals.

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R10 | page scroll measured; target root's own box measured; off-canvas = closed fixed panel only; names the deepest cause | `in-page.mjs` `measure` | AC6 fixtures `page-scroll-only`, `in-flow-transform-overflow` |
| R11 | bounded exemptions; table cell fixed-layout; exemption pairs | `in-page.mjs` | AC6 fixtures (benign + violating pair per exemption) |
| R12 | `widths` bounds = theme breakpoints (or -1); validator takes the list; `widths-mismatch` rule; in-range bound runs | `registry.mjs`, `runner.mjs`, CLI, registry JSON | AC7 |
| R13 | `notApplicable` on every row; summary counts + no-pointer-dismissal list | `runner.mjs`, CLI | AC8 |
| R14 | discovery clicks every candidate, registered or not, at 390 / 1440 / widths bounds; list (c); exit 1 unless (a)(b)(c) empty | `discover.mjs`, `in-page.mjs` candidates | AC9 |

## Preserved / required behaviour

Preserved: product sources, Stories, theme, tokens, CI and policy files, `check-stories-rendered.mjs`; the first-pass
rule keys, the evidence row shape (plus `notApplicable`), the self-test cases of R6 (must still behave as stated).
Required: kickoff section 10.

## Task-owned write scope (section 4 + section 10)

`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json`;
`scripts/__fixtures__/rendered-state-census/*.html`; `scripts/__tests__/rendered-state-census.test.ts`; `package.json`
(three script entries only - unchanged); `docs/sessions/evidence/task923/*` (this revision: `r2-1x`+; the first pass
already owns `r2-00..r2-09`); the session log; the 923 backlog cell. `review-1/` stays unchanged.

Non-visible task (`Scope: none`): no UI/mobile/GR-0/Storybook-proof receipt applies; none of the write set is a UI path.
