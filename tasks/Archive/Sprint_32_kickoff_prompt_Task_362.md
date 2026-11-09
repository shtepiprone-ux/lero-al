### Task 362 — FilterBar alignment + responsive filter grid

Type:        bug (layout)
Priority:    high
Area:        Layout component — `src/components/layout/FilterBar.tsx` (+ `FilterBar.stories.tsx`)

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "UI / layout / component task": docs/design-system.md, docs/ui-rules.md, docs/component-rules.md, docs/qa-rules.md
4. docs/rule-index.md → "Storybook / visual snapshot task": docs/storybook-governance.md, docs/storybook-visual-snapshots.md
5. Prior art: Task 359 added `[&>*]:max-sm:w-full` to FilterBar's outer container — read `docs/sessions/2026-06-02-task-359-mobile-control-tab-fullwidth-contract.md`; extend, do not undo.
6. Inspect package.json validation scripts.

Localization coverage:
- sq, en, uk, it. Filter labels must fit/align in all four; verify uk worst case. New demo strings → all four `messages/*.json`.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560. The grid behaviour with "many filter buttons" must be verified at narrow + wide.

Current behavior to preserve:
- `FilterBar.tsx` existing API/props and consumers. The Task 359 `[&>*]:max-sm:w-full` outer-container contract MUST remain.
- Every existing filter control (buttons/chips/selects rendered through FilterBar) stays — nothing removed.
- `FilterBar.stories.tsx`: scenario-named exports (§8b) preserved.

Bug / Goal:
- Styles are incorrect: elements are **scattered/misaligned**. Everything must be **aligned**, and a
  **grid** must organise the filter buttons **evenly and structured** when there are many of them
  (graceful wrap into rows rather than chaotic placement), responsive across breakpoints.

Required after behavior:
1. All FilterBar children align on a consistent baseline/row with consistent gaps (canonical spacing scale; no arbitrary px gaps).
2. With many filter buttons, they lay out in an **even responsive grid/auto-wrap** — consistent column rhythm at desktop, graceful stacking to full-width rows at <640 (per Task 359). No overlapping, no ragged single-item rows that look "scattered."
3. Alignment holds at all 7 breakpoints and in all 4 locales (uk longest).

Required investigation:
1. Read `FilterBar.tsx` — identify current flex/gap classes causing the scatter; decide grid vs flex-wrap with a canonical fragment (prefer the design-system grid fragment for "many controls").
2. Read `FilterBar.stories.tsx` — ensure a "ManyFilters" scenario exists to prove the even grid; add if missing (scenario-named, not per-width).
3. Confirm no consumer depended on the old scattered layout.

Acceptance criteria:
- AC1 = children aligned, consistent gaps — verifiable at `FilterBar.tsx`:line.
- AC2 = even responsive grid for many filters — verifiable at `FilterBar.tsx`:line + `ManyFilters` story.
- AC3 = alignment correct at 7 breakpoints × 4 locales.
- Positive + Negative flow parity in diff.
- Existing filter controls preserved; Task 359 mobile contract intact.
- 0 new lint/warnings; `tsc` → 0; `build-storybook` passes; `check:i18n` PASS.
- design-system.md/ui-rules.md updated with the FilterBar grid canonical fragment. backlog.md updated. Session log with Note 18 block + §17 UI pre-flight + Files Changed table.
- No `git add`/`git commit` from executor.

Positive flow (happy path):
- Actor: developer in Storybook + user on listings page.
- Steps: (1) render FilterBar with a few filters → aligned row, consistent gaps; (2) render with many filters at 1280 → even grid/rows; (3) shrink to 768 → reflows evenly; (4) at 320 uk → children stack full-width (Task 359), still aligned, no overflow.
- Success: structured, even layout at every width.

Negative flow:
- **Single filter only:** trigger = 1 child → does not look orphaned/misaligned; left-aligned per contract.
- **Very long filter label (uk):** trigger = long label → wraps/truncates safely, does not break the grid rhythm or overflow.
- **Odd number of filters:** trigger = e.g. 5 in a 4-col grid → last row aligns left (no centered/scattered stragglers).
- **Empty FilterBar:** trigger = no filters → renders nothing or a stable empty container, no layout artifact.

Out of scope:
- Do NOT change filter business logic / URL state.
- Do NOT touch Tabs/Button/Sheet/Dialog/Select/Combobox.
- Do NOT undo Task 359.
