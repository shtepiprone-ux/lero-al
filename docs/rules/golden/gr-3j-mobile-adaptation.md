## GR-3j — Mobile is an intentional semantic presentation, never a squeezed desktop layout

**Opus reuse precedence, owner decision 2026-10-20:** first apply
[canonical-component-reuse.md](../../../.claude/rules/shared/canonical-component-reuse.md). Inherit ready Mantine
adaptations and verify changed integration; fresh pattern research applies to named gaps/reproduced defects.
The source-selection requirements below govern new adaptations and do not reopen settled ready-component design.

**Owner rule, 2026-10-09.** A long reporter/user name and ordinary record details were visibly cut in the compact
composition in Task 859 even though the Story had previous responsive receipts. The root defect was broader than a
name slot: rules described widths and individual widgets, but did not force a chosen mobile presentation for a whole
component.

### Binding standard basis

- [W3C Reflow (SC 1.4.10)](https://www.w3.org/WAI/WCAG21/Understanding/reflow): ordinary vertical content fits at
  320 CSS px with no loss of information/function or two-dimensional scroll.
- [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout): compact layouts adapt to
  text size, locale and window changes; adjacent views may stack and rows grow instead of cropping text.
- [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout): use
  reflow, reveal or a presentation change at component/pane level; do not simply stretch or compress.
- [W3C Target Size (SC 2.5.8)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): pointer targets
  need at least 24 CSS px or sufficient spacing; project mobile controls retain the stricter 44px token rule.

These are the normative starting point. A current lero.al Story, screenshot, existing consumer, legacy utility, or
previous task is evidence of current behavior only — never evidence that a mobile pattern is correct.

### Mantine mechanism has precedence

This rule complements Mantine; it does not create a competing responsive system. Mantine's
[responsive/visibility props](https://mantine.dev/styles/responsive/), [Flex responsive API](https://mantine.dev/core/flex/),
and [AppShell responsive API](https://mantine.dev/core/app-shell/?t=props) decide implementation mechanism,
interaction, and accessibility behavior. The project theme and canonical pattern choose the project breakpoint and
reusable composition. GR-3j decides only the missing semantic presentation: reading/action order, full-content
treatment, and proof. A custom viewport branch is allowed only as the registry-listed Mantine
[`useMediaQuery` exception](https://mantine.dev/hooks/use-media-query/) with a documented SSR result and canonical
owner. It must not duplicate a Mantine prop, override Mantine keyboard/focus/dismissal behavior, or create a
Story/consumer-specific mobile component.

### Required decision before code

Every visible UI change selects one or more IDs from `scripts/mobile-adaptation-patterns.json` and records them in the
saved kickoff and the mobile preflight. The exact definitions live in
`.claude/rules/shared/mobile-adaptation-contract.md`; the minimum choices are `linear-flow`, `record-card`,
`key-value-stack`, `data-table-to-cards`, `form-stack`, `toolbar-priority`, `navigation-adaptive`,
`overlay-adaptive`, `grid-media-reflow`, and `inline-control`.

The task must state the compact reading/action order. If no listed profile fits, the designer researches a primary
standard for the actual interaction and obtains a dated owner decision. “Keep the desktop row but make it fit” is not
a profile and is `BLOCKED — MOBILE PATTERN DECISION REQUIRED`.

### Required compact behavior

1. **Full information and one reading axis.** Throughout the project's compact range (`<640px`), required semantic
   text wraps, long tokens break safely, containers grow, and all actions remain reachable. Verification covers the
   actual thresholds the component uses and the `640px` transition — not an invented handset matrix. New `truncate`,
   `lineClamp`, ellipsis, text `nowrap`, fixed-height text clipping or `overflow:hidden` used to conceal required
   content are forbidden. A tooltip/title/hover is not a mobile disclosure.
2. **Sections and records reflow.** Related panes/sections stack into a readable column. A desktop record/table row
   becomes the chosen card presentation; identity/title and state remain first, then description/details/actions in
   the documented priority order. A data table never scrolls horizontally on mobile.
3. **Fields stack semantically.** On compact screens, a label/value field is label first and complete value below it;
   the label never consumes the value’s line. A desktop left/right key-value row may return only at the selected
   wider breakpoint.
4. **Controls adapt, not disappear.** Forms become a single-field flow; toolbars wrap/stack by priority; navigation
   and overlays use their canonical compact presentation. An action may move to an accessible overflow only when the
   task proves it remains named, reachable, and operable.
5. **The exception is genuinely two-dimensional.** A map, canvas, spreadsheet-like spatial object or equivalent may
   retain local horizontal scrolling only with an owner rationale. Each contained panel/card still fits the project's
   documented minimum supported width, per
   [W3C technique G225](https://www.w3.org/WAI/WCAG22/Techniques/general/G225); a data table is not this exception.

### Proof and enforcement

- The executor and reviewer inspect the built direct Story throughout the applicable `<640px` range, at every actual
  component threshold, and on both sides of the `640px` transition, in all affected locales. They prove no
  viewport/component horizontal overflow; complete text (`scrollWidth <=
  clientWidth`, `scrollHeight <= clientHeight`, no ellipsis/line clamp); reachability; documented order; and mobile
  touch targets.
- That proof covers the app root and **every portal root** in every registered interaction state that opens an
  overlay — `.claude/rules/shared/rendered-state-census.md` (owner decision 2026-10-10; registry
  `scripts/rendered-interaction-states.json` and the blocking gate are built by task 923). A census of
  `#storybook-root` alone is not GR-3j proof for a dialog, sheet, popover, menu, dropdown or tooltip.
- The source diff gate `node scripts/check-mobile-adaptation-contract.mjs` rejects an added clipping primitive and a
  malformed changed kickoff mobile record. Its self-test is mandatory in CI. It is a floor, not a rendering oracle.
- The pre-write hook rejects an in-scope UI/Story edit without the exact mobile preflight. A green gate or screenshot
  cannot replace the rendered measurements.

**Receipt — execution and review alike, one per changed surface:**

`GR-3j MOBILE ADAPTATION — <surface>: patterns <IDs>; mobile range <640px; thresholds <actual thresholds + 640px transition>; mobile order <ordered content/actions>; direct Story <id>; locales <IDs>; viewport overflow NONE; semantic fields <n>, clipped/ellipsis/clamped NONE; controls reachable <result>; evidence <path>.`

Missing selection/proof, any lost semantic text, an inline desktop key/value row at mobile, or an undisclosed
two-dimensional exception means the executor returns `BLOCKED — GR-3j` and the reviewer returns `NEEDS REVISION`.
