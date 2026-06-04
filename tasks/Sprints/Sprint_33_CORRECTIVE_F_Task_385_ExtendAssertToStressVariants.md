### Task 385 — CORRECTIVE F (follow-up): extend the rendered assert to the LocaleStress / long-label story variants

> # 🔴 WHY. `scripts/check-stories-rendered.mjs` `ASSERT_STORIES` covers exactly ONE export per file (the first /
> `Default`). But the owner's WORST rendered failures were the long-label / locale-stress variants:
> `Tabs/WithLongLocaleLabels` (first tab clipped on the left at 320), `Select/LongLabelLocaleStress` (label clipped
> by the chevron), AdminTable/AdminCardList long-Ukrainian-title stress. Those exact cells are currently verified
> only by orchestrator eyeballing, NOT machine-asserted. This task makes the stress variants part of the gate so the
> clip/overflow cases can never silently regress. Orchestrator review:
> `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md` (FU-2).

Type:      corrective test-coverage extension (follow-up to Task 380/383)
Priority:  HIGH
Area:      `scripts/check-stories-rendered.mjs` (`ASSERT_STORIES` set + possibly a stress-specific assertion)

## Required pre-read
`docs/agent-contract.md` (clauses 11, 12, 13) · `docs/backlog.md` · `docs/storybook-governance.md` (§14.3) ·
`scripts/check-stories-rendered.mjs` (current `ASSERT_STORIES`, `VIEWPORTS_*`, the `noHorizontalOverflow` +
`fullWidthControlsAtMobile` assertions) · Task 383 session log + its manifest.

## Current behavior (file evidence)
`ASSERT_STORIES` = 29 entries, one `--default`-class export per file (e.g. `primitives-tabs--default`,
`primitives-select--default`, `admin-admintable--default`). The long-label / `LocaleStress` exports that exhibited
the owner's clips are NOT in the set, so they are never rendered-asserted.

## Required after behavior
1. **Add the stress/long-label export of each component that has one** to `ASSERT_STORIES`, including at minimum:
   - `primitives-tabs--with-long-locale-labels` (or the actual storyId of the long-label Tabs export)
   - `primitives-select--long-label-locale-stress`
   - `shared-combobox--long-label-locale-stress`
   - `admin-admintable--locale-stress`, `admin-admincardlist--locale-stress`, `admin-adminpageshell--locale-stress`
   - `layout-pageheader--locale-stress`, `layout-pageshell--locale-stress`, `layout-section--locale-stress`,
     `layout-filterbar--locale-stress`
   - `primitives-button--locale-stress`, `primitives-input--*` long variant, `primitives-passwordinput--*` stress
   - `system-recentlyviewedsection--*` stress (longest titles), `system-listinggrid--locale-stress`,
     `system-emptystate--*` stress
   Discover the exact storyIds from the built Storybook `index.json` / `stories.json` (do not guess — list the
   resolved ids in the session log). If a component has no stress export, note it explicitly.
2. **Keep `uk` mandatory** for these (uk = longest strings) and assert at 320/375/390 at minimum.
3. The existing assertions (`noHorizontalOverflow`, `fullWidthControlsAtMobile`) apply. **Additionally**, for the
   Tabs stress case add (or confirm) an assertion that the FIRST interactive tab's left edge is within the
   container (not negative / not clipped) at 320 — the specific defect the owner hit. If implementing the left-edge
   assertion is non-trivial, STOP&ASK rather than shipping a weaker check that would pass a clipped tab.
4. Re-run the full assert; every added cell must PASS (or, if any FAILs, that is a real regression → STOP&ASK +
   follow-up against the owning primitive task, do not silently patch a story).

## Exact files allowed to edit
`scripts/check-stories-rendered.mjs`, `docs/storybook-governance.md` (§14.3 — note the stress coverage),
`docs/backlog.md`, new session log. NO story/component edits (if a stress cell FAILs, STOP&ASK — it means a real
layout regression to route back).

## Current behavior to preserve
The existing 29 Default cells stay in the set; the manifest schema (`matrix`/`assertions`/`pass`) is unchanged so
prior tooling keeps working; `--fast` mode still runs in reasonable time (stress variants may be gated to the full
run if `--fast` would become too slow — document the choice).

## Positive flow
`npm run screenshots:assert` → matrix now includes the stress/long-label cells at uk@320/375/390 → all PASS →
the manifest shows the Tabs/Select/AdminTable stress cells with `pass:true` and the new left-edge assertion green.

## Negative flow (demonstrate in the session log)
- Temporarily re-introduce `justify-center` (or revert the Task 382 Tabs fix) locally → the new Tabs stress
  assertion FAILs at 320 (proves the added check actually catches the original clip) → revert.
- A stress label that overflows → `noHorizontalOverflow:false` FAILs the cell.

## Acceptance criteria
- AC1 `ASSERT_STORIES` includes the resolved stress/long-label storyId for every component that has one; the list
  of resolved ids (and any "no stress export" notes) is in the session log — file:line.
- AC2 The full assert run passes for all added cells (manifest references), uk@320/375/390 present per added story.
- AC3 A Tabs-stress left-edge / no-clip assertion exists and is demonstrated catching the original defect
  (negative-flow transcript) — or a STOP&ASK is logged if it could not be implemented robustly.
- AC4 No story/component edited by this task; any failing stress cell routed back as STOP&ASK + follow-up.

## Out of scope
CI wiring (Task 384); gate-script `check:stories` static checks (Task 380); story/component layout (Tasks 381/382).

## Required validation
`npm run build-storybook` · `npm run screenshots:assert` (paste the summary: passed/failed counts) · the resolved
storyId list · negative-flow transcript · AC self-audit.

## Required Sonnet evidence format
Sprint 33 standard: the manifest + per-cell PNG artifacts are the proof. Report = AC table (storyId + manifest/PNG
ref) + the assert run summary transcript + the negative-flow proof that the new check catches the original clip +
STOP&ASK log + Files Changed table. INCOMPLETE if the stress cells are not machine-evidenced. NO `git add`/`commit`.
