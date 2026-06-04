### Task 374 — CORRECTIVE C: FilterBar desktop owner-hierarchy redesign (search row first)

> # 🔴 OWNER P0 — Mobile <640 full-width gate (2026-06-03, agent-contract clauses 11–12). At <640 EVERY FilterBar control,
> the search input, the filter/Sheet trigger, chips, Badge and Reset are full-width (`max-sm:w-full`), ≥44px, labels wrap
> (sq/en/uk/it), no h-scroll at 320. Any popup FilterBar opens (Sheet/Select/Combobox) follows the full-width bottom-sheet
> rule (Task 379 / clause 11). **Required to close:** rendered matrix breakpoints(320..2560) × locales(sq/en/uk/it),
> uk@320/375/390 mandatory; tsc/build is NOT proof.
>
> > ## 🔴 BREAKPOINT BANDS — CANONICAL, NO AMBIGUITY (owner decision 2026-06-03; supersedes any "≥640" vs "≥1024" mismatch below)
> > The three responsive bands for FilterBar are EXACTLY:
> > - **`<640` (mobile)** — full-width mobile stack: search + trigger + every control full-width (`max-sm:w-full`), filters
> >   collapse into the Sheet (Task 359/362), ≥44px, no h-scroll at 320. (This is the OWNER P0 gate above.)
> > - **`640–1023` (tablet)** — the ALREADY-ACCEPTED tablet stack / collapsed-Sheet behavior is PRESERVED. The desktop
> >   hierarchy does NOT begin here. Do NOT introduce the search→active→available vertical hierarchy in this band; do NOT
> >   regress the accepted mobile/tablet stacking. (If a specific tablet refinement seems needed, STOP & ASK — out of scope.)
> > - **`≥1024` (desktop)** — the NEW desktop vertical hierarchy applies: row1 search (full content width) → row2 active
> >   filters → row3 available filters → reset+count grouped WITH the active-filter state.
> > Every "desktop hierarchy" / "Desktop" reference anywhere in this task means **`≥1024` ONLY**. Every "mobile/accepted
> > stacking" reference means **`<1024`** (i.e. the `<640` and `640–1023` bands), and at `<640` the full-width gate applies.
> > The hierarchy redesign must NOT regress either the `<640` full-width gate or the `640–1023` accepted stacking.

> **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 → 375 → 376 → 377`, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **377 is the FINAL certification sweep** (runs only after 372–376 AND 379 all land), never a parallel task. **374 runs after 379** (so any FilterBar Sheet/Select/Combobox popups already follow the bottom-sheet pattern).

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
- **`<1024` accepted behavior preserved (both the `<640` mobile band AND the `640–1023` tablet band — see BREAKPOINT BANDS
  above):** search and trigger/filters stack; filters collapse to the Sheet per Task 359/362; at `<640` the full-width gate
  applies. Do NOT regress either band. The new desktop hierarchy is introduced at **`≥1024` ONLY** (not `≥640`).
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
- AC4 Accepted stacking + Sheet collapse preserved across the WHOLE `<1024` range — verified at the `<640` mobile cells
  (320/375/390, full-width gate) AND the `640–1023` tablet cells (680/768/810/960). Negative: the `≥1024` desktop
  hierarchy does NOT leak below 1024 and does not break either band.
- AC5 Works in sq/en/uk/it at all breakpoints; `labels` prop only (no hardcoded text).
- Grep gate: no hardcoded user-facing strings introduced in `FilterBar.tsx`.

## Out of scope
Tabs/Button/Dialog/Phone/Select; changing consumer business logic; new FilterBar props without owner approval.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Verify desktop hierarchy (search→active→available→reset/count) and preserved mobile stack at every cell.

## Required Sonnet evidence format (MANDATORY — applies to this and every Sprint 32 corrective)
Sonnet must NOT mark any rendered/manual QA cell PASS unless Sonnet PERSONALLY rendered or inspected that cell.
"OWNER QA REQUIRED" means the owner MAY ADDITIONALLY audit — it does NOT replace Sonnet's own evidence. A cell that was
not checked = `NOT CHECKED`, and the task is then INCOMPLETE. `tsc`/`lint`/`build-storybook` are baseline checks only;
they do NOT replace rendered/manual verification, and "it compiles" never counts as PASS. The matrix MUST cover all
three bands: `<640`, `640–1023`, and `≥1024`.
The final report MUST include:
1. **AC self-audit table** — AC# · requirement · implementation evidence (file:line) · verification evidence (command
   output / rendered matrix cell / grep output / test result) · status `PASS` / `FAIL` / `NOT CHECKED`.
2. **Command transcript** — for each required command: exact command · exit code · short result. If a command was not
   run, state the explicit reason. "Not run" NEVER counts as PASS.
3. **Grep gates** — paste the exact grep command and its RAW output; write `(no output)` if empty; for any false
   positives, provide a triage table separating real hits from documentation/comment/string mentions.
4. **Rendered evidence matrix** (whenever UI is involved) — per surface/story: locale (sq/en/uk/it) · viewport
   (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560) · interaction performed · expected result · observed
   result · evidence reference (screenshot path / story URL / exact written observation) · status `PASS`/`FAIL`/`NOT
   CHECKED`. **uk@320/375/390 are mandatory cells.**
5. **Tests** — test file · cases added/updated · command run · pass/fail · failure output if any.
6. **STOP&ASK log** — every ambiguity found · whether work stopped · what was left unchanged because it was out of scope.
A task is INCOMPLETE if any required AC or any required rendered cell is marked `NOT CHECKED`.

## Final report requirements
Before/after structural description; AC table with file:line; consumer-API-unchanged proof; validation outputs; Files
Changed table. NO `git add`/`commit`.
