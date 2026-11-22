# Mobile adaptation (checklist U5)

The compact composition is required below 640px and the 640px layout is the transition to the wider composition
(`theme.other.mobileGate = 40em` / `sm = 640px`). Mobile is a deliberate presentation, never a squeezed desktop row
(GR-3j). A ready canonical component's adaptation is inherited (`canonical-component-reuse.md`); the checks below apply
to what the task changes.

## Basis

[W3C WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) (320 CSS px without two-dimensional
scrolling), [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout),
[Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) (reflow,
reveal or change presentation; never stretch or squeeze), [WCAG 2.2 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
(this project keeps 44 px for mobile-reachable controls). Profiles and their sources: `mobile-adaptation-patterns.md`,
`scripts/mobile-adaptation-patterns.json`; allowed profiles per component: `mobile-adaptation-component-map.md`.

## Checks

- [ ] Mantine decides how a component adapts: its responsive and visibility props, `Flex`, `AppShell`. `useMediaQuery`
      only when those and the canonical owner cannot express it. Forbidden: `useWindowSize`, another media-query hook,
      a parallel mobile component, raw CSS breakpoints duplicating Mantine, overriding Mantine's focus, dismissal or
      keyboard behaviour, a Story-only layout repair.
- [ ] Below 640 px: one reading axis, no page-level horizontal overflow, no lost information or function; a genuinely
      two-dimensional object only with a written reason and its own scroll region.
- [ ] Required text wraps and its container grows, or a canonical, directly reachable disclosure is named; no new
      `truncate`, `lineClamp`, ellipsis, `nowrap`, fixed-height text box or hidden overflow on required content. A
      tooltip, `title` or hover is not a mobile disclosure.
- [ ] Reading and action order kept; all four locales and enlarged text are part of the layout input.
- [ ] Profiles: `linear-flow`, `record-card`, `key-value-stack` (label above its full value), `data-table-to-cards` (no
      horizontal table scroll), `form-stack`, `toolbar-priority`, `navigation-adaptive`, `overlay-adaptive` (bottom
      sheet), `grid-media-reflow`, `inline-control`, `data-visualization-reflow`, `editor-adaptive`. A label/value row
      on one line below 640 px needs a dated owner decision.
- [ ] A missing profile or component family is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`: Opus adds it to the
      catalogue before the task is published; Sonnet never invents one.
- [ ] Rendered proof: the CI jobs on GitHub and the owner's check of the Stories (checklist U9).

## The record in every kickoff

Non-visible work: `- Scope: none`. Visible work, every field, one value each (`scripts/check-mobile-adaptation-contract.mjs`
checks every kickoff outside `tasks/Archive/` in CI):

```md
## Mobile adaptation record
- Scope: visible
- Surfaces: <path and semantic region>
- Component families: <one or more IDs from scripts/mobile-adaptation-patterns.json>
- Pattern IDs: <one or more IDs from scripts/mobile-adaptation-patterns.json>
- Standards: <direct primary-source URLs or registry IDs for the selected profiles>
- Mantine mechanism: <one or more registry-listed IDs allowed by the selected component family>
- Mantine owner: <canonical `src/design-system/mantine/patterns/*.tsx` path in the selected family>
- Mobile range and switches: <640px (theme.other.mobileGate / sm); <actual component thresholds>; 640px transition
- Mobile order: <ordered content/actions>
- Required-content treatment: <wrap | named canonical directly reachable disclosure>; no clipping
- Story and verification: <direct Story>; <actual mobile thresholds and 640px transition>; <affected locales>
```

The reviewer rejects visible work whose record is incomplete or whose code differs from it.
