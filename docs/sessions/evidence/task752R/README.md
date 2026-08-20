# Task 752R evidence — FilterMultiToggle label centering

Rendered proof for `tasks/Sprints/Sprint_60_kickoff_prompt_Task_752_REWORK_FilterButtonLabelCentering.md`.

Story: `Mantine/Primitives/FilterControls` → `Default`, story id
`mantine-primitives-filtercontrols--default`. Both the horizontal branch (existing
`MultiToggleDemo`) and the vertical branch (new `MultiToggleDemo` fixture with
`className="flex-col gap-1.5"`) render on the same page; captures below isolate each
branch's own `[role="group"]` element.

"Before" = Task 752's originally-shipped code (`justify="flex-start"` present).
"After" = this rework (`justify` prop deleted). Both built via `npm run build-storybook`
against the same otherwise-unmodified working tree.

## AC2 — vertical branch (changed surface)

`vertical-branch/before/` vs `vertical-branch/after/`, 11 cells (320×{en,sq,uk,it},
390/768/1024×en, 1440×{en,sq,uk,it}). All 11 MD5s differ before→after — labels move from
left-aligned to centered. See `manifest-before.json` / `manifest-after.json` (`vMd5` field).
Visually confirmed via `Read` on `320-uk.png` in both dirs: before = left-aligned, after =
centered.

## AC3 — horizontal branch (no-delta control)

`horizontal-branch-control/before/` vs `horizontal-branch-control/after/`, same 11 cells.
All 11 MD5s are byte-identical before→after (`hMd5` field in the manifests) — the prop
removal has zero effect where the button is intrinsic-width, matching the task's mechanism
analysis (root is `display: inline-block`, so the removed `justify-content` declaration
never rendered there).

## Wrap-probe (AC2 "long label wrapping" requirement)

Current production `CONDITION_OPTIONS`/`CONDITIONS`/`OFFER_TYPES`/`PURCHASE_CONDITIONS`
copy (post Task 724R shortening) does not wrap to 2 lines at any required Q2 width/locale —
verified empirically, not assumed. To produce the wrap+center evidence AC2 requires, a
temporary reversible probe (long uk/sq labels, real language content, not part of the
reviewable diff) was added to the story, captured, then removed — restoration verified via
`git hash-object` returning the identical pre-probe value
(`10f1237430651e492327a6baacdc053f2610ece8`) and `git status --porcelain` showing no residual
probe content. See the rework session log's "Implementation validation notes" for the
full before/after hash trail.

`wrap-probe/before.png` — label wraps to 2 lines, both lines left-aligned (regression).
`wrap-probe/after.png` — same wrapped label, both lines centered (fixed) — proves
`theme.ts`'s `label: { whiteSpace: 'normal' }` wrap mechanism is real and that centering
applies per-line, not just to single-line labels.
