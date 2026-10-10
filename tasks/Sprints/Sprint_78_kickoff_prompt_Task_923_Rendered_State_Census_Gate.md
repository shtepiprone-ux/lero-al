# Task 923 — the rendered state census: every overlay state opened, the app root and every portal root measured

**Sprint 78** · **P1** · QA profile **Q4** (a new blocking gate: planted-failure proof required) · **blocks 859
Revision 15** (kickoff §31 R94) and every visible task whose surface opens an overlay (`BLOCKED — RENDERED STATE
CENSUS (923)`, `.claude/rules/shared/rendered-state-census.md`) · **Status: `KICKOFF FILED` 2026-10-10.**

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
| C12 | FACT | Playwright is installed. | source: `package.json:208-208`; observed: `"playwright": "^1.60.0",` |
| C13 | FACT | Storybook 10 is installed. | source: `package.json:211-211`; observed: `"storybook": "^10.4.2",` |
| C14 | FACT | The overlay owners are registered as one component family. | source: `scripts/mobile-adaptation-patterns.json:131-131`; observed: `"id": "overlay-and-disclosure",` |
| C15 | FACT | The touch-target token is 44px. | source: `src/design-system/mantine/theme.ts:739-739`; observed: `touchTarget: '2.75rem',` |
| C16 | FACT | The owner ruled that legacy components are migrated, not instrumented. | source: `docs/backlog-archive.md:68-68`; observed: `legacy components are migrated, not instrumented` |
| C17 | FACT | The contract names the registry file. | source: `.claude/rules/shared/rendered-state-census.md:19-19`; observed: `scripts/rendered-interaction-states.json` |
| C18 | FACT | The contract measures the app root and each portal root separately. | source: `.claude/rules/shared/rendered-state-census.md:26-26`; observed: `Separate targets** — the app root` |
| C19 | FACT | The contract counts a word split across lines as cut text. | source: `.claude/rules/shared/rendered-state-census.md:30-30`; observed: `a word split across lines because its box is` |
| C20 | FACT | The contract requires planted violations inside a portal root. | source: `.claude/rules/shared/rendered-state-census.md:42-42`; observed: `overflow only inside a portal root` |
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

## Rule-compliance ledger

| Rule | How this task complies |
|---|---|
| Owner decision D1 | registry, open every state, separate portal targets, full metrics, Story × state × root × locale × viewport evidence, planted portal-only violations (R1–R6) |
| GR-3j / `rendered-state-census.md` | the gate is its executable form; it changes no presentation |
| Retired `screenshots:assert` (C6) | not revived, not extended, not cited as evidence |
| Legacy not instrumented (C16) | in-scope titles only |
| No baseline / allowlist | none; a differing Story × state needs a dated owner decision in its row |
| Role boundaries | CI and policy edits are Opus's at closure (§9) |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20; owner decisions: D1; blocked claims: NONE.
