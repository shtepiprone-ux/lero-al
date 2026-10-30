# Task 923 Revision 2 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 2 write)

Sonnet, 2026-10-14, win32, Node v22.22.3, Playwright from the repo. Kickoff section 11 (R15-R18, AC11-AC15).
Evidence prefix `r3-`; `r3-sample6/` (first-pass directory) and `review-1/`, `review-2/` stay untouched.

## GR-7 (moment: execution)

Subject: positioned / transformed content inside an overlay (R15) and transient load / open failures (R16).
Library read: `docs/research/references/2026-10-04` (Lahomes 057 `/ui-modal.html`, TailAdmin 074 `/modals`).
Live check, this session, 390x844 (`r3-10-gr7-live.json`):

| Reference | Page | Observed | vs library / earlier passes |
|---|---|---|---|
| Lahomes | /ui-modal.html "Launch demo modal" | page scrollWidth 390 = clientWidth 390; dialog `div.modal-content` x 8..382; 0 absolutely positioned / fixed / transformed descendants, so 0 past the box; Escape closes it | unchanged |
| TailAdmin | /modals "Open Modal" | page scrollWidth 390 = clientWidth 390; no `[role=dialog]` / `.modal-content` matched after open (visual-only modal, as in the first pass and Revision 1); Escape: 0 dialogs | unchanged |
| Kamr | /ui-modal (login) | NOT re-operated this revision | earlier record stands; not relied on for R15-R18 |
| Omah | no modal page in the library | not opened | UNVERIFIED, not relied on |

Chosen practice: WCAG 2.2 SC 1.4.10 Reflow plus the WAI-ARIA modal-dialog pattern, as before. The references show no
positioned content past a dialog box (Lahomes 0 of 0), so a positioned element past the panel is a defect everywhere,
not a layout the references sanction; R15 stands. The references say nothing on gate retries (a tooling subject).
Absent or unverified: Kamr live re-operation, Omah modals. No reference contradicts R15-R18.

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R15 | `component-overflow` measures absolute / fixed / transformed content-holding elements against the nearest clipping ancestor or overlay panel; no such ancestor -> left to `viewport-overflow` | `in-page.mjs` `measure` | fixtures `abs-past-panel` FAIL, `abs-badge-inside` PASS, `transform-past-panel` FAIL, `transform-inside` PASS; mutation proof for the two new bounds (9 of 9) |
| R16 | one recorded retry on a fresh page for a navigation error (`net::ERR_*`, `navigation failed`) or an open-action timeout; row carries `retry`; summary prints count and list; no measured rule is retried | `runner.mjs` (`runPool` / job wrapper), `check-rendered-state-census.mjs`, `verify.mjs` | fixtures `open-flaky-once` PASS with `retry`, `open-never` FAIL `open-failed` |
| R17 | `--discover` counts found / clicked / not operable (Playwright reason) per Story x width, prints three totals and the list, marks Stories with no `mount` row at that width; `discover.json` holds it; informational | `discover.mjs`, CLI | discover transcript |
| R18 | owner table maps the 640 cells (`r2-85-width-640-findings.txt` lines 3-6, 9-11) to 924 and `custom-range-too-long` to 925; registry unchanged | `r3-*` owner table | owner table + session log |

## Preserved / required behaviour

Preserved: every Revision 1 rule key and the 30 self-test cases as stated; the evidence row shape (a `retry` key appears
only on retried rows); the registry (contract ranges `max: 639` / `min: 640`); product sources, Stories, theme, CI and
policy files. Required: kickoff section 11.

## Task-owned write scope (sections 4, 10, 11)

`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json`
(only if a state needs a row; none expected); `scripts/__fixtures__/rendered-state-census/*.html`;
`scripts/__tests__/rendered-state-census.test.ts`; `package.json` (script entries only; none expected);
`docs/sessions/evidence/task923/r3-*`; the session log `docs/sessions/2026-10-10-task923-rendered-state-census.md`
(`# Revision 2` section); the 923 backlog cell.

Non-visible task (`Scope: none`): no mobile / UI / Storybook-proof receipt applies; no write-set path is a UI path.

## Requirement / AC ledger

R15 -> AC11, AC14 | R16 -> AC12, AC14, AC15 | R17 -> AC13 | R18 -> AC14.
AC11 verify: Revision 1 cases + 4 new, 9 of 9 mutation proofs. AC12 verify: `open-flaky-once`, `open-never`, summary retries.
AC13 discover: (a)(b)(c) = 0, totals printed. AC14 repeated full run + new owner table (924 / 925). AC15 vitest x2, typecheck,
lint, build-storybook, build, file-integrity, mojibake, `git status --porcelain` before / after.

GR-7 RESEARCH (execution) COMPLETE - references: Lahomes, TailAdmin live at 390; Kamr and Omah not relied on; no conflict with section 11.
