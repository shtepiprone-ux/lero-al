# Task 651 — Doc correction: unlayered Mantine CSS beats Tailwind (session log)

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Files Changed

| File | Change |
|---|---|
| `docs/mantine-responsive-design-system.md` | Corrected 3 rows (§4 CSS-import-order, §4 Tailwind-v4-layer-coexistence, §6 Tailwind-boundary) that falsely claimed Tailwind overrides Mantine / `@layer mantine` exists; added the `unstyled`/`Box` practical rule after the §6 table |
| `docs/backlog.md` | Moved Task 651 from "Designed" to "Implemented — awaiting orchestrator review"; updated task-numbering footer |

No code file was touched (`layout.tsx`, `postcss.config.mjs`, components, `theme.ts` unchanged — confirmed via `git status --short`, only the doc + backlog changed).

## R1–R4 evidence

- **R1 (correctness)** — all three rows now state: `@mantine/core/styles.css` is imported UNLAYERED in `layout.tsx` (no `@layer mantine` wrapper), so Mantine component CSS beats Tailwind `@layer utilities`; Tailwind utilities do NOT override Mantine styling. `git diff` shows the rewritten rows.
- **R2 (practical rule)** — added directly after the §6 theme-architecture table (before `### §6.1`): "To make a Tailwind utility win... use the component's `unstyled` prop (Task 629) or use `Box` instead of a styled surface primitive like `Paper`/`Card` (Task 650)." Both tasks cited by number and by what they fixed.
- **R3 (no overreach)** — only `docs/mantine-responsive-design-system.md` (+ this session log/backlog per the completion-report contract) changed; searched the whole file for `override|@layer|unlayered|cascade layer` and confirmed no other row/sentence repeats the false claim (the other hits at lines 22/232/323/351/359/789/812/855/857/1178/1272 are unrelated: owner-override language, table-gate rule, width-override rule, form-field override, font-weight override, flex/height override, footer-button override — none concern the Mantine/Tailwind cascade).
- **R4 (integrity)** — `npm run check:mojibake` → `0 artifacts in 1846 files`. File remains valid Markdown (tables intact, no stray pipes introduced).

## Before / after of each corrected row + the new rule

**Row 1 (§4, was ~line 96):**
- Before: `@mantine/core/styles.css` before app CSS so Tailwind utilities can override | Both imports in `src/app/layout.tsx`; `@layer mantine` is below Tailwind `@layer utilities`
- After: `@mantine/core/styles.css` is imported UNLAYERED (plain import, no `@layer` wrapper) before app CSS — unlayered CSS always beats layered CSS, so Mantine component styling wins over Tailwind `@layer utilities`, not the reverse | Both imports in `src/app/layout.tsx`; there is no `@layer mantine` wrapper — confirmed unlayered (Task 651, 2026-07-20)

**Row 2 (§4, was ~line 105):**
- Before: Mantine uses `@layer mantine`; Tailwind v4 uses `@layer base, components, utilities` — separate cascade layers, no conflict | No `postcss-preset-mantine` needed; Mantine CSS imported directly
- After: Mantine CSS is imported directly and UNLAYERED — there is no `@layer mantine`. Tailwind v4 uses `@layer base, components, utilities`. Unlayered rules always beat layered rules, so Mantine component CSS overrides Tailwind utilities | `postcss-preset-mantine`'s layer option is NOT enabled (would wrap Mantine CSS in `@layer mantine`); Mantine CSS is imported directly, unlayered, by design

**Row 3 (§6, was ~line 144):**
- Before: `@layer mantine` is separate from `@layer utilities` | No conflict
- After: Mantine `styles.css` is imported UNLAYERED (no `@layer mantine`) — unlayered CSS beats Tailwind's `@layer utilities`, so Mantine component styling wins over Tailwind utility classes | Not "no conflict" — see the practical rule below

**New rule (inserted right after the §6 table, before `### §6.1`):**
> **Practical rule — when a Tailwind utility must win over a Mantine component's own CSS:** because Mantine's `styles.css` is unlayered and always beats Tailwind's `@layer utilities`, a plain Tailwind className on a styled Mantine component (e.g. `Paper`, `Card`) can be silently overridden by that component's own CSS (radius, shadow, border, background). To make the Tailwind utility win, either:
> 1. Use the component's `unstyled` prop to strip its own CSS (Task 629 — `HeaderView` chrome, fixed a silent Tailwind classname loss this way), or
> 2. Use `Box` instead of a styled surface primitive like `Paper`/`Card` — `Box` ships no component CSS of its own, so Tailwind classes apply cleanly (Task 650 — `HeroSearchView` container chrome; `Paper` was forcing 16px corners and collapsing `shadow-xl` until swapped for `Box`).

## Verification (Q0 profile)

1. `npm run check:mojibake` → `check:mojibake: 0 artifacts in 1846 files`. ✅
2. Read-back of the corrected rows + new rule confirms correct rendering, no contradicting statement left elsewhere (grep sweep above). ✅
3. `git status --short` → `M docs/mantine-responsive-design-system.md` only (before this session-log/backlog write); `git diff --stat` → 1 file, 14 insertions(+), 3 deletions(-). ✅

`npm run build` NOT run — Q0 governance doc-correction, no code changed, gate does not apply per task contract.

## Evidence trail

- `src/app/layout.tsx:6` — `import '@mantine/core/styles.css'` plain/unlayered import (verified unchanged, not touched by this task).
- `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md` — first confirmation (Header Tailwind classNames silently lost, fixed via `unstyled`).
- `docs/sessions/2026-07-20-task650-herosearchview-container-chrome-mantine.md` — second confirmation (`Paper` forced 16px corners + collapsed `shadow-xl`, fixed by switching to `Box`).

## Notes for orchestrator

- Do NOT "fix" the code to match the old doc — the unlayered `layout.tsx` import is the correct working state; this task only corrected the doc.
- No contradicting claim about the Mantine/Tailwind cascade remains anywhere else in `docs/mantine-responsive-design-system.md` (full-file grep swept and reviewed).
