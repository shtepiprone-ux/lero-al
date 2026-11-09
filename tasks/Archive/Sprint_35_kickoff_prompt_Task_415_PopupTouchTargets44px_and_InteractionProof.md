# Sprint 35 — Task 415 — Popup §26.2 completion: ≥44px option/item rows + interaction (backdrop/Esc/focus-return) proof

**Type:** UI / overlay primitive touch-target + interaction-proof (PRODUCT CODE + QA) — completes the §26.2 items Slice 2 (Task 414) explicitly deferred
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off AFTER Task 414 (+ its REWORK) is committed
**Created by:** orchestrator, 2026-06-10, from the two §26.2 follow-up candidates surfaced by the Task 414 review
**Reviewer:** Opus 4.7 orchestrator (rendered + manual §26.2 review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then `docs/design-system.md §26` (esp. §26.2: "Touch targets: ≥44px (`min-h-11`) for all items inside the bottom sheet"). This task closes the two §26.2 gaps Task 414 proved but deferred: sub-44px option/item rows, and untested backdrop/Esc/focus-return dismissal.

---

## Background (from the Task 414 manual §26.2 QA matrix)

Task 414 proved bottom-sheet **positioning** (anchor/width/corners/drag-handle/scroll-cap) on 10
popup stories but flagged two §26.2 items as OUTSTANDING:

1. **Option/item rows below the ≥44px touch-target floor** inside the mobile bottom sheet:
   - `Command` result rows ≈ **32px**
   - `Combobox` option rows ≈ **36px** (and everything built on it: `StatusChangeControl`
     `variant="select"`, the Location/PropertyType/Year comboboxes)
   - `Select` / `DropdownMenu` items — audit for the same.
   These were confirmed **pre-existing** (Task 414 touched no primitive), so they are a real,
   separate task — not a Task 414 regression.

2. **Interaction dismissal not proven for this slice:** backdrop tap + Esc close + focus-return to
   trigger is owned by the Base-UI primitives and was assumed-from-prior-tasks, never rendered/tested
   in the §26.2 mobile bottom-sheet context. §26.2 requires it explicitly.

---

## Part A — Raise mobile bottom-sheet item rows to ≥44px (`min-h-11`)

These ARE primitive edits — that is the whole point of this task (Task 414 was forbidden from
touching primitives; this task is authorised to). For each, add the ≥44px floor **only where it
does not regress the ≥640 desktop density** — prefer a `max-sm:min-h-11` (mobile-only) floor so the
desktop compact rows are unchanged, unless the owner wants a global 44px floor (STOP & ASK if the
desktop row would grow).

Target primitives (audit each, fix the ones below 44px at `<640`):
- `src/components/ui/command.tsx` — result/`CommandItem` rows (≈32px → `max-sm:min-h-11`).
- `src/components/shared/Combobox.tsx` — option rows (≈36px → `max-sm:min-h-11`); this propagates
  to `StatusChangeControl` `variant="select"` and the Location/PropertyType/Year comboboxes.
- `src/components/ui/select.tsx` — `SelectItem` rows (audit).
- `src/components/ui/dropdown-menu.tsx` — `DropdownMenuItem` rows (audit).

Keep label wrap (`whitespace-normal break-words`) intact; do not introduce arbitrary heights
(§24 — use `min-h-11`, not `h-[44px]`). Vertically center the row content.

## Part B — Interaction proof (backdrop tap + Esc + focus-return) for the mobile bottom sheet

Add a rendered/interaction proof (Playwright, in the QA-script style of
`scripts/task414-qa-screenshots.mjs`, untracked QA tooling — not product code) that, for each popup
category open as a `<640` bottom sheet, asserts:
- **Esc** closes the sheet;
- **backdrop tap** closes the sheet;
- on close, **focus returns to the trigger** element.
Capture before/after for at least one Dialog-based modal + one Select/Combobox/DropdownMenu/Command.
Record PASS/FAIL per category in the session log. If a category genuinely cannot dismiss/return
focus, that is a real defect → fix at the consumer or STOP & ASK if it would require an out-of-scope
primitive rewrite.

## NOT in scope

- No §26.1 button/full-width work (Slice 4). No `tableAt` (Slice 3). No new modal migrations.
- Do not change the §26.6 ListingGallery/AdminSidebar exceptions.

---

## Current behavior to preserve

Every popup keeps its current desktop (`≥640`) density and behavior; the row-height change is
mobile-only (`max-sm:`) unless owner authorises a global floor. No option removed, no keyboard
nav (↑/↓/Enter/Esc) broken, no selection behavior changed.

## Positive flow (happy path)

1. Audit the four primitives for `<640` row height; apply `max-sm:min-h-11` where below 44px.
2. Verify propagation: `StatusChangeControl` select variant + Location/PropertyType/Year comboboxes
   now show ≥44px rows at `<640`.
3. Add the Part B interaction proof; record per-category PASS.
4. Re-render the Task 414 §26.2 stories: rows now ≥44px at uk@320/375/390, no clip, no h-scroll.
5. Run the full gate set + file-integrity (clause 14). Owner native `screenshots:assert` → no
   regression / no new FAIL / no error screens.
6. Update `docs/backlog.md` + session log (before/after row-height table per primitive, the §26.2
   matrix re-render with ≥44px confirmed, the interaction-proof results, Files-Changed table).

## Negative flow (every off-happy-path branch)

- **Desktop row would grow** if a global `min-h-11` were applied → use `max-sm:min-h-11`; STOP & ASK
  before any global density change.
- **Raising row height reintroduces h-scroll or breaks `≤90dvh` cap at 320** → adjust internal
  scroll, never widen; re-verify no h-scroll at 320 in all 4 locales.
- **A category cannot return focus to trigger** → real defect; fix at consumer or STOP & ASK if
  primitive-internal.
- **Label no longer wraps after the height change** → restore `whitespace-normal break-words`.
- **Arbitrary height temptation (`h-[44px]`)** → forbidden (§24); use `min-h-11`.

---

## Mobile <640 §26.2 gate (RENDERED + MANUAL + INTERACTION proof required)

Per migrated/affected popup at `<640`: rows ≥44px (`min-h-11`) ✓, labels wrap ✓, no h-scroll@320 ✓,
bottom-anchored/edge-to-edge/rounded-top/drag-handle/≤90dvh (unchanged from Task 414) ✓, **backdrop
tap + Esc close + focus-return proven** ✓. Rendered PNG evidence at uk@320/375/390 + the interaction
transcript in the session log.

## Acceptance criteria

- `Command`/`Combobox`/(audited `Select`/`DropdownMenu`) option/item rows ≥44px at `<640`
  (`max-sm:min-h-11`), desktop density unchanged; propagation to StatusChangeControl-select +
  Location/PropertyType/Year comboboxes verified in rendered PNGs.
- No arbitrary heights (§24); labels still wrap; no h-scroll@320 in any of sq/en/uk/it.
- Interaction proof (backdrop + Esc + focus-return) recorded PASS per popup category.
- `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`build-storybook`
  green; file-integrity GREEN; owner native `screenshots:assert` no regression.
- 4-locale parity; no hardcode; no governance gate weakened. `docs/backlog.md` + session log
  updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Final report required from Sonnet

1. Per-primitive before/after row-height table.
2. Propagation confirmation (StatusChangeControl-select + the 3 comboboxes) with PNG paths.
3. Interaction-proof results (backdrop/Esc/focus-return) per category.
4. Validation + file-integrity transcripts; owner native `screenshots:assert` transcript.
5. Files-Changed table.
6. Confirmations: desktop density preserved; no §26.1/`tableAt` work; no git commands.
