# Task 923 — the rendered state census: every overlay state opened, the app root and every portal root measured

**Sprint 78** · **P1** · QA profile **Q4** (a new blocking gate: planted-failure proof required) · **blocks 859
Revision 15** (kickoff §31 R94) and every visible task whose surface opens an overlay (`BLOCKED — RENDERED STATE
CENSUS (923)`, `.claude/rules/shared/rendered-state-census.md`) · **Status: review 1 `NEEDS REVISION` 2026-10-10 →
Revision 1 = §10 (R10–R14, AC6–AC10); review 2 `NEEDS REVISION` 2026-10-14 → Revision 2 = §11 (R15–R18,
AC11–AC15).** Executor: §1–§10 stay binding; §11 adds to them and wins where they differ.

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Precedents, read-only: the card-track gate (`scripts/check-card-track-monotonicity.mjs`, a rendered gate on the built
Storybook with a `--verify-gate` self-test, blocking in CI) and 859 review 16's probe
`docs/sessions/evidence/task859/review-16/r16-dialogs.mjs` (diagnosis only — it is the defect this task removes, not a
template to copy unchanged).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode, task type and rule bundle

`IMPLEMENTATION`, governance tooling (a new rendered gate and its registry); no product UI, Story or token changes.
Bundles: **Storybook / Visual Proof**, **Regression / Critical Flow Coverage** (gate with planted-failure proof).
Read: `.claude/rules/shared/role-boundaries.md`, `.claude/rules/shared/rendered-state-census.md` (the contract this
task implements), `.claude/rules/shared/mobile-adaptation-contract.md` ("Required decision and proof"),
`docs/qa-profiles.md`, `docs/storybook-governance.md` §14.9.18 (the retired overlay click list, for contrast only).

## 2. Objective

The owner rejected a task-local fix for a census that could not see dialogs (D1). Build the project-wide contract
`rendered-state-census.md` as executable tooling: a registry of every interaction state that opens a portal, a runner
that opens each state on the built Storybook and measures the app root and every portal root separately, JSONL
evidence per Story × state × root × locale × viewport, and a self-test whose planted violations live only inside a
portal while the app root is green.

## 3. Verified context

Every fact below is a ledger row; nothing else sets scope.

- Mantine renders every overlay into `<div data-portal="true">` under `<body>` (C1). Both GR-3j censuses of 859 read
  `#storybook-root` only (C2): the app root was green (C3) while the ticket sheet header was squeezed (C4) and a picker
  name rendered one letter per line with the id past the screen (C5).
- The repository's only overlay-opening rendered tool is the retired `screenshots:assert` engine (C6); it clicks the
  first button or input of the app root (C7) and measures nothing per portal. It is not revived or extended here.
- A Story can need a click to open its overlay: `Mantine/Primitives/Modal` `Default` shows no dialog on mount (C8).
- CI already builds Storybook and runs rendered gates with a self-test (C9, C10, C11). Playwright and Storybook are
  installed (C12, C13).
- Overlay owners are registered as the `overlay-and-disclosure` family (C14); the touch token is 44px (C15).
- Legacy components are migrated, not instrumented (C16): the registry covers `Mantine/Primitives/*` and
  `Patterns/Mantine/*` Stories only.

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | Mantine's Portal marks its node with data-portal="true". | source: `node_modules/@mantine/core/esm/components/Portal/Portal.mjs:20-20`; observed: `node.setAttribute("data-portal", "true");` |
| C2 | FACT | The 859 GR-3j census reads only the Storybook root. | source: `docs/sessions/evidence/task859/review-15/r15-mobile.mjs:33-33`; observed: `const root = document.querySelector('#storybook-root') ?? document.body` |
| C3 | FACT | The record-card app roots were green in review 16. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:5-5`; observed: `record cards: label and value on one line 0` |
| C4 | FACT | The ticket sheet header was squeezed inside a portal. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:13-13`; observed: `ticketdetaildialogview--support 320 en 86<88` |
| C5 | FACT | A picker name was 0px wide on 12 lines and the id ran past the screen inside a portal. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:17-17`; observed: `320 uk Blerina Hoxha: nameW=0 lines=12 rightW=445 spillOpt=153 spillVp=153` |
| C6 | FACT | screenshots:assert is retired as QA evidence. | source: `docs/qa-profiles.md:24-24`; observed: `and all of its aliases are retired as QA evidence` |
| C7 | FACT | The retired engine opens an overlay by clicking the first button or input of the app root. | source: `scripts/check-stories-rendered.mjs:927-927`; observed: `page.locator('#storybook-root button, #storybook-root input').first()` |
| C8 | FACT | The Modal primitive's Default Story shows no dialog on mount. | source: `docs/sessions/evidence/task859/review-16/r16-dialogs.jsonl:1-1`; observed: `"id":"mantine-primitives-modal--default","w":320,"loc":"sq","dialogs":0` |
| C9 | FACT | CI builds Storybook in the rendered-gate job. | source: `.github/workflows/governance-pr.yml:308-308`; observed: `run: npm run build-storybook` |
| C10 | FACT | CI runs the card-track gate and its self-test after the build. | source: `.github/workflows/governance-pr.yml:311-314`; observed: `run: npm run check:card-track-monotonicity:verify` |
| C11 | FACT | The card-track gate exposes a --verify-gate self-test script. | source: `package.json:118-119`; observed: `node scripts/check-card-track-monotonicity.mjs --verify-gate` |
| C12 | FACT | Playwright is installed. | source: `package.json:211-211`; observed: `"playwright": "^1.60.0",` |
| C13 | FACT | Storybook 10 is installed. | source: `package.json:214-214`; observed: `"storybook": "^10.4.2",` |
| C14 | FACT | The overlay owners are registered as one component family. | source: `scripts/mobile-adaptation-patterns.json:131-131`; observed: `"id": "overlay-and-disclosure",` |
| C15 | FACT | The touch-target token is 44px. | source: `src/design-system/mantine/theme.ts:739-739`; observed: `touchTarget: '2.75rem',` |
| C16 | FACT | The owner ruled that legacy components are migrated, not instrumented. | source: `docs/backlog-archive.md:68-68`; observed: `legacy components are migrated, not instrumented` |
| C17 | FACT | The contract names the registry file. | source: `.claude/rules/shared/rendered-state-census.md:19-19`; observed: `scripts/rendered-interaction-states.json` |
| C18 | FACT | The contract measures the app root and each portal root separately. | source: `.claude/rules/shared/rendered-state-census.md:26-26`; observed: `Separate targets** — the app root` |
| C19 | FACT | The contract counts a word split across lines as cut text. | source: `.claude/rules/shared/rendered-state-census.md:30-30`; observed: `a word split across lines because its box is` |
| C20 | FACT | The contract requires planted violations inside a portal root. | source: `.claude/rules/shared/rendered-state-census.md:42-42`; observed: `overflow only inside a portal root` |
| C21 | FACT | Since Revision 1 a negative margin exempts at most its own size (review 1 finding 2; the unbounded form is shown by C23). | source: `scripts/rendered-state-census/in-page.mjs:124-124`; observed: `const overBeyond = (over, margin) => over > 0.5 && !(margin < 0 && over <= -margin + 0.5);` |
| C22 | FACT | Since Revision 1 a table-box parent exempts its child unless it is a control or media in a fixed-layout table cell (review 1 finding 2). | source: `scripts/rendered-state-census/in-page.mjs:193-193`; observed: `const tableExempt = tableBox && !(pcs.display === 'table-cell' && fixedLayoutTable(parent) && isMediaOrControl(e));` |
| C23 | FACT | A planted negative-margin element overflowing its parent inside a portal is green. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:3-3`; observed: `FIXTURE neg-margin: app green` |
| C24 | FACT | A page scrollable to 616px at a 390px viewport is green. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:4-4`; observed: `[page scrollWidth 616 clientWidth 390]` |
| C25 | FACT | Since Revision 1 a width outside a state's `widths` runs a range job instead of being skipped (review 1 finding 3; the skip is shown by C26, C27). | source: `scripts/check-rendered-state-census.mjs:174-174`; observed: `runRangeJob(page, ctx, state, locale, width, { inRangeWidth, siblings })` |
| C26 | FACT | A state registered `widths: {min: 1440}` opens at 1024. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:6-6`; observed: `widths {"min":1440} trigger BUTTON "AKAlba Krasniqi" -> 320:absent 390:absent 639:absent 640:absent 1024:OPENS` |
| C27 | FACT | 41 sampled `widths` states open at a width the runner skips. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:46-46`; observed: `states whose same-named trigger opens a portal at a skipped width: 41` |
| C28 | FACT | The theme's breakpoints include `sm` 640, `lg` 1024 and `xxl` 1440. | source: `src/design-system/mantine/theme.ts:637-641`; observed: `lg: '64em',   // 1024px — desktop` |
| C29 | FACT | Since Revision 1 a not-applicable dismissal returns its reason for the row's `notApplicable` (review 1 finding 5). | source: `scripts/rendered-state-census/runner.mjs:203-203`; observed: `a bottom sheet renders no close control of its own` |
| C30 | FACT | Since Revision 1 discovery click-checks every in-scope Story, registered or not (review 1 finding 4; the miss is shown by C31). | source: `scripts/rendered-state-census/discover.mjs:162-162`; observed: `const clickJobs = stories.map((story) => ({` |
| C31 | FACT | A registered Story has triggers that open a portal with no registry row. | source: `docs/sessions/evidence/task923/review-1/rv-probe2.txt:4-4`; observed: `UNREGISTERED patterns-mantine-admindashboardview--adm-09-zero @390: button "AKModern Apartment in Tirana C" opens 1 portal(s)` |
| C32 | FACT | Since Revision 1 the discovery candidate list has no cap (review 1 finding 4). | source: `scripts/rendered-state-census/in-page.mjs:380-380`; observed: `NO cap: discovery clicks every one (Task 923 R14)` |
| C33 | FACT | The self-test behaves as stated at review. | source: `docs/sessions/evidence/task923/review-1/rv-verify.txt:19-19`; observed: `verify-gate: every case behaves as stated.` |
| C34 | FACT | The AC4 targets fail on the portal root only at review: 24 of 48 rows fail. | source: `docs/sessions/evidence/task923/review-1/rv-ac4.txt:5-5`; observed: `rows 48 (failing 24)` |
| C35 | FACT | `component-overflow` measures no absolutely positioned, fixed or transformed element. | source: `scripts/rendered-state-census/in-page.mjs:166-166`; observed: `if (pos !== 'absolute' && pos !== 'fixed' && cs.transform === 'none'` |
| C36 | FACT | A planted absolutely positioned text past the dialog box is green on its portal root. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:7-7`; observed: `rv2-abs-past-dialog portal:0 GREEN` |
| C37 | FACT | A planted transformed text past the dialog box is green on its portal root. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:9-9`; observed: `rv2-transform-past-dialog portal:0 GREEN` |
| C38 | FACT | The planted text paints 22px past the dialog box, inside the viewport. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:10-10`; observed: `dialog x 16..310; planted text x 212..332` |
| C39 | FACT | An open click has one 4 s attempt and no retry. | source: `scripts/rendered-state-census/runner.mjs:151-151`; observed: `if (open.kind === 'click') await loc.click({ timeout: 4000 });` |
| C40 | FACT | The final full run has two open failures at 639. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:5-5`; observed: `"open-failed @639":2` |
| C41 | FACT | The executor could not reproduce the 639 open failures in isolation. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:211-211`; observed: `not reproducible` |
| C42 | FACT | A whole first full run of Revision 1 was lost to network suspension. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:200-200`; observed: `951 of its rows are` |
| C43 | FACT | The theme's mobile gate is 40em (640px). | source: `src/design-system/mantine/theme.ts:740-740`; observed: `mobileGate: '40em',` |
| C44 | FACT | `AdminListingsView` switches to compact with an inclusive max-width of the gate. | source: `src/components/admin/AdminListingsView.tsx:82-82`; observed: `(max-width: ${theme.other.mobileGate})` |
| C45 | FACT | `RangeDatePicker` switches to compact with an inclusive `max-width: 40em`. | source: `src/design-system/mantine/patterns/RangeDatePicker.tsx:922-922`; observed: `useMediaQuery('(max-width: 40em)')` |
| C46 | FACT | The canonical bottom sheet switches with the same inclusive query. | source: `src/design-system/mantine/patterns/responsiveBottomSheet.tsx:52-52`; observed: `(max-width: ${theme.other.mobileGate})` |
| C47 | FACT | The AppShell owner already uses an exclusive max-width (minus 0.1px). | source: `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx:96-96`; observed: `(max-width: ${collapseBreakpointPx - 0.1}px)` |
| C48 | FACT | The mobile contract requires the compact composition below 640px. | source: `.claude/rules/shared/mobile-adaptation-contract.md:23-23`; observed: `the compact composition is required **below` |
| C49 | FACT | The final full run has 44 `widths-mismatch` cells, all at 640. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:5-5`; observed: `"widths-mismatch @640":44` |
| C50 | FACT | Discovery skips a candidate it cannot click without recording it. | source: `scripts/rendered-state-census/discover.mjs:102-102`; observed: `if (!(await clickPath(page, c.sel))) continue;` |
| C51 | FACT | 148 of 4 236 discovery candidates cannot be operated at first load. | source: `docs/sessions/evidence/task923/review-2/rv2-unclickable-probe.txt:4-4`; observed: `candidates 4236; not operable at first load 148` |
| C52 | FACT | Only one of them is in a Story with no mount row. | source: `docs/sessions/evidence/task923/review-2/rv2-unclickable-probe.txt:5-5`; observed: `of which in Stories with no mount row: 1` |
| C53 | FACT | One Story renders the Storybook error display on the final build. | source: `docs/sessions/evidence/task923/r2-81-discover.txt:42-42`; observed: `dashboardperiodcontrol--custom-range-too-long` |
| C54 | FACT | That Story throws its play-function exceptions. | source: `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx:90-90`; observed: `parameters: { throwPlayFunctionExceptions: true },` |
| C55 | FACT | The Revision 1 self-test reproduces at review 2. | source: `docs/sessions/evidence/task923/review-2/rv2-verify.txt:41-41`; observed: `verify-gate: every case behaves as stated.` |
| C56 | FACT | Every full-run row carries every rule key and `notApplicable`, and the rows are unique. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:4-4`; observed: `rows missing a rule key 0; rows without notApplicable 0; unique 22738` |
| C57 | FACT | AC4's picker target fails on its portal root while its app root passes. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:8-8`; observed: `failing 4 [word-split, viewport-overflow, component-overflow]; app rows failing 0 of 8` |
| C58 | FACT | A hover over the sampled non-candidate elements opens no portal. | source: `docs/sessions/evidence/task923/review-2/rv2-hover-probe.txt:7-7`; observed: `0 open a portal` |
| C59 | FACT | The 26 overlay-importing Stories without a row were all clicked through, and none opens a portal. | source: `docs/sessions/evidence/task923/r2-81-discover.txt:13-13`; observed: `26 of the 26 Stories that import an overlay component and have no row render no trigger that opens a portal` |
| D1 | OWNER DECISION | The census of overlays is a project-wide contract with a registry, separate portal targets, full metrics, a Story × state × root × locale × viewport record and a planted portal-only violation. | owner: 2026-10-10; decision: `R94 буде достатнім лише якщо він робить це загальним контрактом, а не латкою Task 859` |

## Mobile adaptation record
- Scope: none

(Tooling only: the task writes no product UI, Story, token or style. It measures GR-3j; it does not change a
presentation.)

## 4. Scope and out of scope

**In scope (the exact write set):**
`scripts/check-rendered-state-census.mjs` (runner, CLI, self-test) and, if it is split, modules under
`scripts/rendered-state-census/`; `scripts/rendered-interaction-states.json` (registry);
`scripts/__fixtures__/rendered-state-census/*.html` (self-test fixtures); `scripts/__tests__/rendered-state-census.test.ts`
(registry validator unit tests); `package.json` (three script entries only); evidence `docs/sessions/evidence/task923/*`;
the session log `docs/sessions/2026-10-10-task923-rendered-state-census.md`; the 923 backlog cell.

**Out of scope:** any product source, Story, fixture, theme or token file (an overlay that cannot be opened without
editing its Story is reported, not repaired); `scripts/check-stories-rendered.mjs` and every retired alias (C6);
legacy Stories (C16); the CI workflow and the policy documents (Opus adds the CI steps and the governance doc rows at
review closure, §9); fixing any violation the gate finds (each is owned by a numbered task, R9).

## 5. Current and required behaviour

| | Current | Required |
|---|---|---|
| Overlay states | opened ad hoc by task probes, often not at all | every opening state registered and opened by the gate |
| Roots measured | `#storybook-root` only (C2) | the app root and each `[data-portal="true"]` root, separately |
| Text | clamp / ellipsis / overflow in the app root | the same per root, plus a word split across lines (C19) |
| Proof of the gate | none | planted portal-only violations fail while the app root is green |

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C8; C14; C16; C17; D1] | **Registry** `scripts/rendered-interaction-states.json`: `{ "version": 1, "states": [...] }`; each state `{ id, story, open, portals, focus, dismiss, trigger?, closeSelector?, reason?, ownerDecision? }`. `story` = a Storybook id whose title starts `Mantine/Primitives/` or `Patterns/Mantine/`; `open` = `{ "kind": "mount" }`, `{ "kind": "click", "selector": "<css inside #storybook-root>" }` or `{ "kind": "keys", "selector": "…", "keys": ["ArrowDown"] }`; `portals` ≥ 1; `focus` = `trap` (Modal, Drawer, bottom sheet), `trigger` (focus stays on the trigger: Combobox / Select dropdown, Tooltip) or `inside` (Menu); `dismiss` ⊆ `escape`, `close-control`, `outside` — empty only with a `reason` (e.g. a View Story whose `onClose` is a no-op); `trigger` = the selector focus returns to (absent for `mount`). `id` unique; the validator rejects an unknown key, a duplicate id, a Story id absent from the build index and an out-of-scope title. | P1 | AC2 |
| R2 [C1; C14; C16; D1] | **Discovery** `--discover` on the built Storybook: every in-scope Story opened closed at 390 / en; reports (a) a Story that shows a `[data-portal="true"]` root on mount with no `mount` row, (b) an in-scope Story whose `importPath` file imports `Modal`, `Drawer`, `Popover`, `Menu`, `Combobox`, `Select`, `Tooltip` or `HoverCard` from `@mantine/core`, or any member of the `overlay-and-disclosure` family, `MantineCombobox`, `MantineSelect` or `RangeDatePicker`, with no row. The executor populates the registry until both lists are empty, reading each Story's source for its real triggers. | P1 | AC2 |
| R3 [C9; C12; C13; C18; D1] | **Runner** `check-rendered-state-census.mjs`: serves `storybook-static` read-only; for each registry state × locale × viewport (default widths 320 / 390 / 639 / 640 / 1440, locales sq / en / uk / it; `--stories <id,…>`, `--widths`, `--locales` narrow a run for a task) opens the state through its `open` action (never by editing a Story), asserts exactly `portals` new `[data-portal="true"]` roots with visible content, then measures the app root and each portal root as separate targets (the metrics of the next row); also sweeps every in-scope Story closed at 390 / en for an unregistered portal. Exit 1 on any violation, any open failure or any unregistered portal; exit 0 only when every job passes. | P1 | AC3 |
| R4 [C15; C18; C19; D1] | **Metrics per target**, each a named rule: `text-clamp` (computed `-webkit-line-clamp` ≠ none on a visible text element); `text-ellipsis` (`text-overflow: ellipsis` with hidden/clip overflow and `white-space: nowrap`, or active overflow); `text-hidden` (hidden/clip overflow with scroll size > client size + 0.5); `word-split` (a text element narrower than its longest word, measured with the element's computed font); `viewport-overflow` (page horizontal scroll, or the target's box past the viewport); `component-overflow` (an element whose box extends past its nearest clipping or target ancestor by > 0.5px, inside no scroll region that contains it); `action-hidden` / `action-covered` (a button, link with an icon, input, select or `[role=button]` outside the viewport and every scroll region, or not the hit element at its centre); `target-small` (below 768px: an action's smaller side < 44px, inline text links excluded); `focus-*` (`trap` / `inside`: on open the active element is inside the portal root, and for `trap` 1 + n Tab and Shift+Tab presses keep it inside; `trigger`: it stays on the trigger); `dismiss-*` (per declared mechanism: the portal content is hidden within 1 s and, for `trap` / `inside` with a `trigger`, focus returns to it). | P1 | AC3, AC4 |
| R5 [D1] | **Evidence**: one JSONL row per Story × state × root × locale × viewport: `{ story, state, root: "app" \| "portal:<n>", locale, width, rules: { <rule>: [<detail>] }, pass }`; a summary file with per-rule and per-Story × state counts. Paths from `--out`. | P1 | AC3 |
| R6 [C10; C11; C20; D1] | **Self-test** `--verify-gate` runs the same measuring code on `scripts/__fixtures__/rendered-state-census/*.html` served locally (no Storybook build), each with an inline registry: `clean` passes; `portal-overflow-only`, `portal-clamp-only`, `portal-word-split-only` (app root green in each) fail with `component-overflow` / `viewport-overflow`, `text-clamp`, `word-split`; `app-root-only` fails; `unregistered-portal` and `registered-opens-nothing` fail; `focus-escapes-trap` and `escape-does-not-close` fail with their focus / dismiss rule. The output names every case and its rule; exit 0 only when every case behaves as stated. | P1 | AC1 |
| R7 [C11] | **Scripts** in `package.json`: `check:rendered-state-census`, `check:rendered-state-census:verify`, `check:rendered-state-census:discover`. | P2 | AC5 |
| R8 [D1] | **Unit tests** `scripts/__tests__/rendered-state-census.test.ts` for the registry validator: a valid registry passes; a duplicate id, an unknown key, an out-of-scope title, an empty `dismiss` without `reason`, `portals: 0` each fail with its message. | P2 | AC5 |
| R9 [C4; C5; D1] | **First full run and owners**: the full registry on the final build; every violation listed by Story × state × root × rule with its owner — 859 §31 (its sheet-header, dialog-title and combobox-option requirements), 921, 922, or "new — Opus to file". The run is expected to exit 1; the report is the deliverable, never a reason to weaken a rule. | P1 | AC4 |

## Acceptance criteria

- **AC1 [R6; C20; D1].** `npm run check:rendered-state-census:verify` exit 0; the transcript lists `clean` PASS and each of the eight planted cases FAIL with the rule named in R6.
- **AC2 [R1; R2; C17].** `npm run check:rendered-state-census:discover` on the final build: 0 Stories with an unregistered mount portal, 0 overlay-importing in-scope Stories without a row; the registry validator accepts the saved registry; the registry row count and the per-family counts are in the report.
- **AC3 [R3; R4; R5; C18].** The full run on the final build writes one JSONL row per Story × state × root × locale × viewport (row count = the product the summary prints), every row carries every R4 rule key, 0 jobs fail to open.
- **AC4 [R4; R9; C4; C5].** In the first full run, `patterns-mantine-ticketdetaildialogview--support` at 320 / 390 reports a violation on its portal root, `patterns-mantine-userpickerfieldview--results` at 320 reports `word-split` and `viewport-overflow` on its portal root while its app root passes, `patterns-mantine-listingpreviewdialogview--active` at 320 reports `text-clamp` on its portal root; every violation is listed with an owner.
- **AC5 [R7; R8; C11].** The three scripts exist; vitest twice green (the new test file included); `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity`, `check:mojibake` exit 0.

## 6. Flows

**Positive:** build Storybook → `--discover` (empty) → full run → JSONL + summary → `--verify-gate` green.

| Branch | Applicable? | Expected behaviour | Evidence |
|---|---:|---|---|
| A click selector matches nothing | Yes | the job fails `open-failed` with the selector | AC3 / R6 |
| A state opens more or fewer portals than declared | Yes | the job fails `portal-count` | R6 `registered-opens-nothing` |
| A Story errors on render | Yes | the job fails `error-screen` | AC3 |
| No `storybook-static` | Yes | exit 1 with "build Storybook first" | transcript |
| Validation / authorization / network / concurrent writer | No | tooling on a static build | — |

## 7. QA profile and verification

**Q4.** In order, each after the last write (`r1-60-hashes-end.txt`): `npm run build-storybook`;
`check:rendered-state-census:discover`; `check:rendered-state-census -- --out docs/sessions/evidence/task923/full`;
`check:rendered-state-census:verify`; vitest twice; `typecheck`; `lint`; `build`; `check:file-integrity`;
`check:mojibake`; `git status --porcelain` before and after. Each transcript ends with `EXIT_CODE=`. Platform line
(`win32`, Node version) first. Runtime of the full run is recorded (CI job budget).

## 8. Completion report

Session log with: I0 hashes; the registry summary; R1–R9 → evidence; AC1–AC5 with transcripts; the first-run
violation table with owners; deviations; a `Files Changed` table. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR
REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No Git. A Story that cannot be opened without editing it, or a rule
that cannot be measured as written, is a stop and report, not a local reinterpretation.

## 9. Opus at review closure (not the executor)

Add to `.github/workflows/governance-pr.yml`, in the job that builds Storybook (C9): `check:rendered-state-census:verify`
blocking at once; `check:rendered-state-census` blocking the day the full run is green (until then the first-run
violations are owned tasks, and the contract's per-task rule applies). Add the gate to `docs/storybook-governance.md`
and `docs/rules/golden/enforcement-status.md`.

## 10. Revision 1 — review 1, 2026-10-10 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-1/` (native Windows, Node v22.22.3). The self-test and AC4
reproduce (C33, C34). The gate still passes four kinds of violation, which R4 and the contract require it to catch.

**Findings.**

1. **P1, R4 viewport-overflow.** The page's own horizontal scroll is never measured, and the target root's own box
   is skipped. A page scrollable to 616px at 390 passes (C24).
2. **P1, R4 component-overflow, deviation D5.** The exemptions have no bound. Any negative margin exempts its side
   whatever the overflow (C21), and any child of a table box is skipped (C22). A 140px planted overflow passes (C23).
   Without a bound, an exemption works as an allowlist written into the metric.
3. **P1, R3, deviation D2.** `widths` bounds come from the five probe widths, not from the component's switch, and
   the runner skips a state outside them without checking anything (C25). 41 of 41 sampled `min: 1440` states open
   at 1024 (C26, C27), so a task run at 768 or 1024 would never measure them.
4. **P1, R2, deviation D3.** Discovery only click-checks Stories that have no row at all (C30), and stops after 12
   candidates (C32). A registered Story has row triggers that open an unregistered portal (C31). Registry
   completeness is therefore unproven, and the generator that produced it is not in the repository.
5. **P2, R5, deviation D4.** A "not applicable" dismissal or focus check leaves no trace in its row (C29), so the
   evidence cannot be audited.

**Opus rulings on the deviations.** D1 (ordering): recorded; in this revision the GR-7 receipt and ledger come
before the first write. D2 (`widths`): kept, but bounded by R12. D3: replaced by R14. D4: accepted as Mantine's
native behaviour (a `Modal` / `Drawer` traps focus, and the app behind it is inert), on condition of R13. D5:
accepted only within R11. D6 (structural selectors): accepted; a broken selector fails `open-failed`. D7 (CI scope):
Opus decides at closure (§9). D8: matches R3.

**Write set.** As §4, plus the new fixtures under `scripts/__fixtures__/rendered-state-census/` and the evidence
directory `docs/sessions/evidence/task923/r2-*`. Out of scope: as §4. The review probes and fixtures in
`review-1/` are diagnosis only and stay unchanged.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R10 [C24; D1] | **viewport-overflow measures the page.** In every job, the app row fails `viewport-overflow` when `document.documentElement.scrollWidth > clientWidth + 0.5` after the open action, and names the deepest element that causes it. The target root's own box is measured like its descendants. The off-canvas exemption covers only a closed `position: fixed` panel. An in-flow transformed element past the edge fails (it scrolls the page). | P1 | AC6 |
| R11 [C21; C22; C23; D1] | **Every component-overflow exemption has a bound and a proof.** A negative margin exempts at most its own size: an overflow larger than the margin's absolute size plus 0.5px fails. A table-box parent is not exempt: a non-text child past the padding box of a cell in a `table-layout: fixed` table fails. Every remaining exemption from deviation D5 (clipped-away slide, `text-hidden` inner box, off-canvas, hidden-away, stacked dialog) gets a pair of self-test fixtures: the benign layout passes, and the same shape with a real violation fails. | P1 | AC6 |
| R12 [C25; C26; C27; C28] | **`widths` is a real switch and is checked.** Each `min` is a theme breakpoint in px and each `max` is a theme breakpoint minus 1 (`theme.ts` `breakpoints`, C28); the validator receives the breakpoint list and rejects any other value. In the full run, each `widths` state is also measured at its in-range bound (`min`, or `max`). At the first out-of-range width (`min − 1`, `max + 1`), and at every requested width outside the range, the runner fails `widths-mismatch` if a visible app-root element with the trigger's role and accessible name opens a portal, unless another row of the same Story covers that width. The trigger's role and name are captured at an in-range width. `widths-mismatch` becomes a rule key of every row. | P1 | AC7 |
| R13 [C29; D1] | **Not-applicable is evidence.** Every row carries `notApplicable: { <rule>: "<reason>" }` for each D4 skip: close-control on a sheet without one, outside on a full-bleed overlay, focus return to a trigger that cannot take focus, focus mode overridden to `trap` by a modal presentation, and app actions not measured behind a modal. The summary prints the n/a count per rule, and lists every Story × state × width where neither `close-control` nor `outside` applies (no pointer dismissal). That list is a report for Opus, not a new violation rule. | P2 | AC8 |
| R14 [C30; C31; C32; D1] | **Discovery proves completeness.** `--discover` clicks every candidate trigger (no cap) of every in-scope Story, registered or not, at 390, at 1440 and at each `widths` bound of the Story's rows. It lists (c) every candidate that opens a portal and is not the trigger of an in-range row of that Story at that width, and exits 1 unless (a), (b) and (c) are all empty. The executor registers rows until all three lists are empty. | P1 | AC9 |

- **AC6 [R10; R11; C23; C24].** `npm run check:rendered-state-census:verify` exits 0. Its transcript shows the nine R6 cases as stated, plus:
  - `page-scroll-only` fails `viewport-overflow` on the app root;
  - `neg-margin-overflow` fails `component-overflow` on `portal:0` while the app root is green;
  - its benign twin, a `margin: 0 -16px` full-bleed divider, passes;
  - `table-cell-overflow` fails `component-overflow`;
  - `widths-contradicted` fails `widths-mismatch`;
  - every R11 exemption pair behaves as stated.
- **AC7 [R12; C26; C27; C28].** The validator accepts the registry with the theme breakpoint list. Every `widths` bound is a breakpoint, or a breakpoint minus 1. The full run has 0 `widths-mismatch` and lists each `widths` state at its in-range bound. The 75 former `min: 1440` rows carry the switch that the R12 check confirms.
- **AC8 [R13; C29].** Every row of `full/rows.jsonl` has `notApplicable`. The summary prints the n/a counts per rule and the no-pointer-dismissal list.
- **AC9 [R14; C31; C32].** `npm run check:rendered-state-census:discover` exits 0 with (a), (b) and (c) all 0. The `admindashboardview` recent-listing triggers of C31 and the `adminuserprofileview--create` input of the same probe file have rows, and the report gives the row count, per-family counts and runtime.
- **AC10 [R10; R11; R12; R13; R14; C34].** The full run is repeated on the final build; AC3 and AC4 still hold. A new owner table is written, with the same counts in the session log and in its evidence file. Vitest passes twice. `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0.

**Verification order:** as §7, with evidence prefix `r2-`. The session log gets a `# Revision 1` section: R10–R14 →
evidence, AC6–AC10 with transcripts, the new owner table, and deviations. Strongest status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

## 11. Revision 2 — review 2, 2026-10-14 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-2/` (native Windows, Node v22.22.3). Verified: R10–R14 are in
the code; the self-test reproduces with 30 cases (C55); every full-run row carries all 20 rule keys and
`notApplicable` (C56); AC4 holds (C57); the end hashes match the files. The executor reported `PARTIALLY
IMPLEMENTED` correctly: AC3 and AC7 are not 0.

**Findings.**

1. **P1, R4 / R11.** `component-overflow` skips every absolutely positioned, fixed or transformed element (C35). This
   exemption was never declared in D5 and has no bound. Text planted 22px past a dialog's box inside a portal is green,
   whether it is positioned (C36) or transformed (C37, C38). This is the same defect class as review 1 finding 2: an
   exemption with no bound works as an allowlist written into the metric.
2. **P1, R3, gate determinism.** An open click gets one 4 s attempt (C39). The final run has two open failures at 639
   that do not reproduce in isolation (C40, C41), and a whole first run was lost to a network suspension (C42). A
   blocking CI gate that fails on a transient is not usable, and "run it again" is not a rule.
3. **Ruling, not an executor defect: the 640 cells are a product off-by-one.** The canonical owners switch to compact
   with an inclusive `max-width` of the 40em gate (C43–C46). At exactly 640 that query still matches, while the
   contract requires compact only below 640 (C48). The AppShell owner already uses the exclusive form (C47). The
   registry keeps the contract ranges. A tolerance in R12 would be an allowlist, which the contract forbids, so D14 is
   upheld. The cells (C49, `r2-85-width-640-findings.txt` lines 3–6 and 9–11) are owned by new task **924**.
4. **Ruling: the error screen** of `dashboardperiodcontrol--custom-range-too-long` (C53) is a Story whose play
   function throws (C54). It predates 923 and is owned by new task **925**.
5. **P3, R14.** Discovery skips a candidate it cannot click without recording it (C50). 148 of 4 236 candidates are
   not operable (C51). 147 are under an overlay their Story opens on mount, and one is in a Story with no mount row
   (C52). The completeness claim holds, but the evidence cannot show it.

**Opus rulings on the deviations.** D9, discovery (b): accepted. The 26 Stories were all clicked through and none
opens a portal (C59), and a hover over non-candidate elements opened nothing in the sample (C58). D10 (bisect
overrides), D11 (stricter bounds), D12 (sibling = the sibling's own trigger) and D13 (bound cells only in a full run):
accepted. D14: upheld, owned by 924. D15: replaced by R16. D7 (CI scope, worker count): decided at closure (§9). Until
the full run is green, CI adds only `check:rendered-state-census:verify` as blocking (the contract's rule), so neither
the runtime nor the worker count blocks this revision. The executor's backlog cell said `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW` while its log said `PARTIALLY IMPLEMENTED`; Opus corrected the cell.

**Write set.** As §10. New fixtures go under `scripts/__fixtures__/rendered-state-census/`; the review fixtures in
`review-2/fixtures/` may serve as their basis. Evidence prefix `r3-`; the first-pass directory `r3-sample6/` is left
untouched. `review-1/` and `review-2/` are diagnosis only and stay unchanged. Out of scope: as §4, and the product
fixes of 924 and 925.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R15 [C35; C36; C37; C38; D1] | **`component-overflow` measures positioned and transformed content.** An absolutely positioned, fixed or transformed element that holds content is no longer skipped. Its bound is its nearest ancestor inside the target that either clips its overflow (`overflow` other than `visible`) or is an overlay panel (`[role=dialog]`, `[role=listbox]`, `[role=menu]`, `[role=tooltip]`, `.mantine-Modal-content`, `.mantine-Drawer-content`, `.mantine-Popover-dropdown`, `.mantine-Combobox-dropdown`, `.mantine-Menu-dropdown`, `.mantine-Tooltip-tooltip`). It fails when its box extends past that ancestor's padding box by more than 0.5px. An element with no such ancestor (the panel itself, or the full-viewport wrapper that holds the panel) is left to `viewport-overflow`. Self-test pairs: `abs-past-panel` fails `component-overflow` on `portal:0` with the app root green, and its twin `abs-badge-inside` (a badge offset over its avatar's edge, inside the panel) passes; `transform-past-panel` fails the same way, and its twin `transform-inside` passes. The mutation proof gains both new bounds. | P1 | AC11 |
| R16 [C39; C40; C41; C42] | **One recorded retry for a transient.** A job is run once more, on a fresh page, when its load fails with a navigation error (`net::ERR_*`, `navigation failed`) or its open action times out. The row then carries `retry: "<first failure>"`; rows without a retry carry no `retry` key. The summary prints the retry count and lists each retried Story × state × locale × width. A second failure is the violation, as before. No measured rule is retried, and a retry never clears a violation of a measured rule. Self-test: `open-flaky-once` (its trigger is absent on the first load and present on the next one; the executor chooses the mechanism, and the self-test resets it) passes with `retry` recorded; `open-never` (its selector matches nothing) still fails `open-failed`. | P1 | AC12 |
| R17 [C50; C51; C52] | **Discovery records what it cannot operate.** For each Story × width, `--discover` counts the candidates found, clicked and not operable, with Playwright's reason. The report prints the three totals and lists every non-operable candidate, marking those in a Story with no `mount` row at that width. The list is informational, not a fourth failing list; `discover.json` holds it. | P3 | AC13 |
| R18 [C43; C44; C45; C46; C48; C49; C53; C54] | **Product findings have owners.** The owner table and its evidence file map every 640 cell of `r2-85-width-640-findings.txt` lines 3–6 and 9–11 to **924**, and the `custom-range-too-long` error screen to **925**. The registry keeps the contract ranges (`max: 639` / `min: 640`); no tolerance, no width override. | P2 | AC14 |

- **AC11 [R15; C36; C37].** `npm run check:rendered-state-census:verify` exits 0 with every Revision 1 case as stated,
  plus `abs-past-panel` FAIL and `transform-past-panel` FAIL, each on `component-overflow` at `portal:0` with the app
  root green, and their twins `abs-badge-inside` PASS and `transform-inside` PASS. The mutation proof shows the two new
  bounds load-bearing, so 9 of 9 are proved.
- **AC12 [R16; C39; C40].** The same transcript shows `open-flaky-once` PASS with `retry` recorded and `open-never`
  FAIL with `open-failed`. The full run's `summary.txt` prints the retry count and its list.
- **AC13 [R17; C51].** `npm run check:rendered-state-census:discover` exits 0 with (a), (b) and (c) all 0. It prints
  the found / clicked / not-operable totals and the not-operable list.
- **AC14 [R15; R16; R18; C49; C53; C56; C57].** The full run is repeated on the final build. Every row carries all 20
  rule keys and `notApplicable`. AC4 still holds. Every `open-failed`, `portal-count` and `widths-mismatch` cell is at
  640, on a state of `r2-85-width-640-findings.txt` lines 3–6 or 9–11 (924). Every `error-screen` cell is
  `custom-range-too-long` (925). There are 0 such cells anywhere else, in particular at 639. This replaces the literal
  "0" of AC3 and AC7 until 924 and 925 land. A new owner table names 924 and 925 and reports the `component-overflow`
  change against Revision 1 per component, with the same counts in the session log and its evidence file.
- **AC15 [R15; R16; R17].** Vitest passes twice (the new file and the whole suite). `typecheck`, `lint`, `build`,
  `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0. `git status --porcelain` is captured before
  and after.

**Verification order:** as §7, with evidence prefix `r3-`. The session log gets a `# Revision 2` section: R15–R18 →
evidence, AC11–AC15 with transcripts, the new owner table, and deviations. Strongest status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

## Rule-compliance ledger

| Rule | How this task complies |
|---|---|
| Owner decision D1 | registry, open every state, separate portal targets, full metrics, Story × state × root × locale × viewport evidence, planted portal-only violations (R1–R6) |
| GR-3j / `rendered-state-census.md` | the gate is its executable form; it changes no presentation |
| Retired `screenshots:assert` (C6) | not revived, not extended, not cited as evidence |
| Legacy not instrumented (C16) | in-scope titles only |
| No baseline / allowlist | none; a differing Story × state needs a dated owner decision in its row |
| Role boundaries | CI and policy edits are Opus's at closure (§9) |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59; owner decisions: D1; blocked claims: NONE.
