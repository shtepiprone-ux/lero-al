### Task 374 — CORRECTIVE C: FilterBar desktop owner-hierarchy redesign (search row first)

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. F is the FINAL certification sweep (run after A–E all land), never a parallel task. **C follows B.**

Type:      corrective bugfix — layout primitive (owner-rejected 362/369)
Priority:  CRITICAL
Area:      src/components/layout/FilterBar.tsx · src/components/layout/FilterBar.stories.tsx

## Owner rejection context
Owner: "все ще присутнє хаотичне розміщення елементів. Пошук має бути окремим головним рядком зверху." The flex-wrap
patch approach (alignment tweak) is rejected. Replace it with an explicit vertical hierarchy. Must NOT break the
already-accepted mobile stacking logic.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/design-system.md` (§11.1 FilterBar, §12b mobile) · `docs/ui-rules.md`
· `docs/component-rules.md` · `docs/qa-rules.md` · `docs/ai-behavior.md` Note 14/19/20 · session logs
`docs/sessions/2026-06-02-task-362-*` and the Task 369 kickoff (superseded).

## Current broken behavior (file evidence — `layout/FilterBar.tsx:45-71`)
Single `flex flex-col gap-2 sm:flex-row sm:flex-wrap` row mixing inline filter cluster + search slot + count Badge +
Reset. On desktop the search floats mid-row and the count/Reset float disconnected from the active-filter state.

## Required after behavior — canonical DESKTOP vertical hierarchy
1. **Search row** = the primary query control, on its own row at the top, full content width.
2. **Active filters row** directly below search (the currently-applied filter chips).
3. **Available filters / refinement controls** row below active filters.
4. **Reset + count** are visually connected to the active-filter state (grouped with / adjacent to the active filters
   row), never floating as disconnected controls.
5. This hierarchy holds across sq/en/uk/it and ALL required breakpoints.
- **Mobile (<lg / <sm) accepted behavior preserved:** search and trigger/filters stack; filters collapse to the Sheet per
  Task 359/362. Do NOT regress mobile. Only the DESKTOP structure changes from flex-wrap to the explicit hierarchy.
- Replace the flex-wrap patch with a real structural layout (rows/grid), not another alignment band-aid.

## Required FilterBar slot/API model (amendment 3 — owner hierarchy, MANDATORY)
The redesign MUST be expressed through an explicit slot/API model in the component itself — not by visual nudging in
stories. Define and implement these four slots so the owner hierarchy is structural:
- **`search` row** — dedicated slot for the primary query control (top, full content width).
- **`activeFilters` row** — slot for the currently-applied filter chips.
- **`availableFilters` row** — slot for the refinement / available-filter controls.
- **`reset` + `count`** — attached to the active-filter state (rendered with / adjacent to the `activeFilters` slot),
  never a free-floating disconnected control.
If the CURRENT `FilterBar` props CANNOT express this slot model, Sonnet MUST **STOP & ASK** the orchestrator before
proceeding (any prop/API change requires owner approval — see "Out of scope"). **Do NOT fake the hierarchy in the
stories only** while leaving the component props/structure unchanged: the runtime `FilterBar.tsx` structure must embody
the slot model, and `FilterBar.stories.tsx` must exercise that real slot API. A stories-only mock of the hierarchy =
INCOMPLETE.

## Exact files to inspect
`layout/FilterBar.tsx`, `layout/FilterBar.stories.tsx`, consumers via `rg "FilterBar"` (verify props unchanged).
## Exact files allowed to edit
`layout/FilterBar.tsx`, `layout/FilterBar.stories.tsx`, `docs/design-system.md`, `docs/ui-rules.md`, `docs/backlog.md`,
new session log. NO consumer runtime changes (props API must stay stable; STOP&ASK if a prop change seems required).

## Current behavior to preserve
`labels` prop (no hardcoded strings), `mobileScroll`/Sheet mobile collapse, `activeCount`/Reset functionality, consumer API.

## Positive flow
Desktop (≥1024): row1 search (full width) → row2 active-filter chips → row3 available filters → reset+count grouped with
active filters. Mobile (<1024): search + filters stack; filters in Sheet; `[&>*]:max-sm:w-full` full-width controls.

## Negative flow
- No active filters → active-filters row empty/hidden cleanly; reset/count hidden; no floating leftovers.
- Many filters wrap → stay within their row, no scatter; hierarchy intact.
- uk long labels → wrap; no overflow at 320; hierarchy unchanged.
- Mobile → accepted stacking preserved (no desktop hierarchy leaking into mobile incorrectly).

## Acceptance criteria (visible + file-verifiable, negative branch each)
- AC1 Desktop search is its OWN top row, full width — verifiable at `FilterBar.tsx`:line + visible in `Default`/`With
  Active Filters` stories at 1024–2560. Negative: search never appears mid-row between chips.
- AC2 Active filters row sits directly below search; available filters below that — verifiable structurally + visible.
- AC3 Reset + count are visually grouped with the active-filter state, not floating — verifiable at `FilterBar.tsx`:line.
- AC4 Mobile accepted stacking + Sheet collapse preserved (Task 359/362) — visible at 320/375/390. Negative: desktop
  hierarchy does not break mobile.
- AC5 Works in sq/en/uk/it at all breakpoints; `labels` prop only (no hardcoded text).
- Grep gate: no hardcoded user-facing strings introduced in `FilterBar.tsx`.

## Out of scope
Tabs/Button/Dialog/Phone/Select; changing consumer business logic; new FilterBar props without owner approval.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Verify desktop hierarchy (search→active→available→reset/count) and preserved mobile stack at every cell.

## Final report requirements
Before/after structural description; AC table with file:line; consumer-API-unchanged proof; validation outputs; Files
Changed table. NO `git add`/`commit`.
