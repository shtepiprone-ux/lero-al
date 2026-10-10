# Storybook proof contract

Read this for visible UI after `ui-token-contract.md` and before adding, changing, or accepting a Story.

## Hierarchy

1. A direct canonical Story proves the real production component and all changed states.
2. A composition Story proves that the parent consumes that real component.
3. Route proof is integration evidence only. It never replaces either Story above.

Before a Story write, search direct imports and equivalent canonical compositions. Reuse/extend the matching Story;
create a Story only when no canonical candidate exists. A parent, slot, demo stand-in, alternate title, locale, or
viewport is not a distinct proof surface. Probe-only Story markup must be reversible and byte-for-byte restored.

## Story constraints

- Stories pass fixture data and documented props; they never repair width, gutter, chrome, or behavior locally.
- Reproduce the real production width contract or leave it fluid. No fixed/max-width decorator, viewport pin, inline
  style, or Story-written gutter. Check 320/390/1024/1440 as applicable.
- Add the task's responsive type-scale requirements; below 640px ordinary headings are at most 20px and no child
  heading exceeds its page title. Use canonical rich-text scaling.
- A popup with two or more text actions stacks them one per row. Circles and rounded-edge lines are fixed in the
  canonical owner, proved with required DPR-1 crops, never patched by a consumer.
- Every block keeps its container's vertical rhythm — one spacing token between blocks, dividers included, so a badge
  row sits as far from its title as from the divider below — and a person's name wraps instead of being cut (GR-3h,
  GR-3i). A rhythm break means the task is not done. Measure both on the built Storybook at every width of the
  canonical matrix and on both sides of every layout switch, in all four locales. Apply the chosen compact semantic
  pattern from `shared/mobile-adaptation-contract.md`: throughout the applicable `<640px` range, semantic content
  follows its recorded treatment and order and has no horizontal overflow or clipping. Verify every actual component
  threshold and the `640px` transition; a hand-picked sample does not prove either rule.
- A Story whose component opens an overlay has a row per opening state in `scripts/rendered-interaction-states.json`,
  and its proof is the rendered state census over the app root and each portal root (`shared/rendered-state-census.md`).
- Operate every Story control at 390 and 1440. If a real action fails or the control does nothing, provide a proper
  presentational view/stateful harness rather than handing over a broken Story.

For each changed Story, apply its relevant GR-3b…GR-3j and GR-9 receipts from `docs/golden-rules.md`. A visual
change also needs the owner matrix of exact Story/state/locale/viewport tuples; `screenshots:assert` is retired and
cannot replace owner visual QA.
