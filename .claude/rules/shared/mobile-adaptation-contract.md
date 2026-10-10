# Mobile adaptation contract

This is the mandatory semantic-layout contract for every visible UI change. Read it **before**
`ui-token-contract.md`. It defines how content adapts; a current component, Story, screenshot, or legacy CSS is
never a normative mobile reference. Stories prove the result after the decision has been made.

## Normative basis and precedence

1. [W3C WCAG 2.2 SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow): ordinary vertical content
   must fit a 320 CSS-pixel viewport without loss of information/function or two-dimensional scrolling. This is an
   accessibility criterion, not this project's definition of the mobile breakpoint.
2. [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout): layouts must adapt to
   compact sizes, text-size changes, locales, rotation, and window resizing; adjacent views may stack and rows grow
   rather than crop text.
3. [Android — Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout):
   adapt a component or pane by reflow, reveal, or presentation change; do not merely stretch or squeeze it.
4. [W3C WCAG 2.2 SC 2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): an
   interactive target is at least 24 by 24 CSS px or has the defined spacing; this project keeps its stricter 44 px
   token rule for mobile-reachable controls.

The source above is the semantic accessibility/UX floor for a conflicting legacy instruction; it never replaces
Mantine's documented responsive mechanism, interaction, or accessibility behavior. The project's actual mobile gate is
`theme.other.mobileGate = 40em` / `sm = 640px`: the compact composition is required **below `640px`** and the
`640px` layout is the transition boundary to the wider composition. `docs/mantine-responsive-design-system.md` supplies
that implementation fact and the Mantine mechanism/tokens; it does not narrow this contract. Do not substitute a
handset list for this range. `scripts/mobile-adaptation-patterns.json` is the machine-readable source of truth;
`mobile-adaptation-patterns.md` gives every profile direct primary-source links, and
`mobile-adaptation-component-map.md` maps every current canonical Mantine pattern component to its allowed profiles.
Read only the relevant catalogue rows. A missing profile or component family is
`BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`: Opus adds it before a task is published; Sonnet must not invent it.

## Mantine precedence and complement-only boundary

This contract **does not replace or tune Mantine's responsive behavior**. The installed project dependency is
`@mantine/core ^8.3.18`; the registry pins the permitted mechanism, and
`docs/mantine-responsive-design-system.md` remains the project authority for its theme and canonical pattern owners.
The precedence is deliberately narrow:

1. Mantine's documented component behavior, interaction, accessibility behavior, and responsive API decide **how** a
   supported component adapts. Use [responsive props and visibility props](https://mantine.dev/styles/responsive/),
   [Flex responsive props](https://mantine.dev/core/flex/), and [AppShell's responsive API](https://mantine.dev/core/app-shell/?t=props)
   before adding custom logic.
2. The project theme and the named canonical Mantine pattern owner decide the actual project breakpoint and reusable
   composition. No task may introduce a competing breakpoint, a consumer-level duplicate, or a Story-only layout
   repair.
3. This contract supplements what a component API cannot decide: semantic reading/action order, full required-content
   treatment, profile selection, source-backed UX outcome, and rendered proof. It never authorizes changing a
   Mantine component's native interaction/a11y behavior merely to satisfy a local layout preference.

`useMediaQuery` is a narrow exception only when responsive/visibility props and the canonical owner cannot express
the required presentation. Its [SSR behavior](https://mantine.dev/hooks/use-media-query/) and a named canonical
owner are mandatory. `useWindowSize`, a non-Mantine media-query hook, parallel mobile components, raw CSS breakpoint
logic that duplicates Mantine, or rules that override Mantine's focus/dismissal/keyboard behavior are forbidden.
The selected component family may use only its registry-listed Mantine mechanism; review compares that declaration
with the actual code. A semantic profile is not an exemption from Mantine.

## Non-negotiable outcomes

- Across the project's whole compact range (`<640px`), ordinary vertical content has one reading axis, no page-level
  horizontal overflow, and no lost required semantic information or function. Verify the project's minimum supported
  width where it applies, every behavior-changing threshold used by the component, and the `640px` transition; do not
  replace that evidence with a hand-picked device trio. A genuinely two-dimensional object is the only exception; it
  requires a written reason, a local scroll region, and each panel/card still fits the project's minimum supported
  width (W3C G225).
- Mobile is a deliberate presentation, not a compressed desktop row. Preserve semantic reading/action order, then
  reflow, stack, wrap, reveal, or change the presentation at the component boundary.
- Required user-visible semantic content has a deliberate compact treatment: it wraps and its container grows, or a
  canonical, directly reachable disclosure is recorded before code. New `truncate`, `lineClamp`, ellipsis,
  single-line `nowrap`, clipped text, fixed-height text containers, and hidden-overflow masking are forbidden for
  required semantic content. A tooltip, `title`, hover, or desktop-only view is not a mobile disclosure.
- Breakpoints follow available content space, not a named handset. Base is the compact/mobile composition; wider
  layouts are enhancements. Use Mantine responsive props/tokens or the canonical owner, never viewport JS or a
  consumer/Story workaround.
- All four locales and enlarged text are part of the layout input. A string that fits English at one browser zoom is
  not proof.

## Select one or more semantic adaptation profiles before code

| Pattern ID | Required compact presentation |
|---|---|
| [`linear-flow`](mobile-adaptation-patterns.md#linear-flow) | Page sections/panes become one readable column; related blocks keep their order and rhythm. |
| [`record-card`](mobile-adaptation-patterns.md#record-card) | A record table/list row becomes a card: primary identity/title first, state/context next, then details and actions in priority order. The card grows; it does not compress columns. |
| [`key-value-stack`](mobile-adaptation-patterns.md#key-value-stack) | A semantic field is a vertical pair on mobile: label first, then its full value on the next line(s). Do not reserve a desktop right-aligned value column or make the label compete with the value. |
| [`data-table-to-cards`](mobile-adaptation-patterns.md#data-table-to-cards) | A data table becomes one record card per row below the switch. Horizontal scrolling is not a data-table mobile strategy. |
| [`form-stack`](mobile-adaptation-patterns.md#form-stack) | Label, help/error, and control remain associated; fields are one column and task actions wrap/stack or use the canonical full-width action treatment. |
| [`toolbar-priority`](mobile-adaptation-patterns.md#toolbar-priority) | Controls wrap or stack in action priority; no control label is clipped. A compact overflow action is allowed only when the full action is still reachable and named accessibly. |
| [`navigation-adaptive`](mobile-adaptation-patterns.md#navigation-adaptive) | Primary navigation changes to the canonical compact navigation/drawer presentation while retaining every reachable destination and focus/close behavior. |
| [`overlay-adaptive`](mobile-adaptation-patterns.md#overlay-adaptive) | A dialog/popover becomes the canonical mobile bottom sheet/full-width presentation, with reachable actions and no obscured focused content. |
| [`grid-media-reflow`](mobile-adaptation-patterns.md#grid-media-reflow) | Grid/media tracks use available width, preserve aspect/content meaning, and reduce columns or stack rather than create an unreadable narrow track. |
| [`inline-control`](mobile-adaptation-patterns.md#inline-control) | Only short, indivisible controls (icon + label, a badge, count, or one action) may remain inline; they still meet target size and may not force adjacent semantic content to clip. |
| [`data-visualization-reflow`](mobile-adaptation-patterns.md#data-visualization-reflow) | A chart preserves its intended comparison, supporting values and controls when it reflows; it is not silently cropped. |
| [`editor-adaptive`](mobile-adaptation-patterns.md#editor-adaptive) | An editable surface retains usable content, selection/focus and required commands as its command bar adapts by priority. |

`record-card` normally includes `key-value-stack`; a table normally includes `data-table-to-cards` and
`record-card`. A label/value exception needs a dated owner decision because it contradicts the compact presentation.
The component map narrows profiles per component family; choosing an allowed profile still requires a source-backed
decision in the saved kickoff.

## Required decision and proof

Before an in-scope UI/Story write, register exactly this receipt through the **PowerShell tool** (with real values,
not placeholders):

```powershell
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: <paths and semantic regions>; component families: <IDs from scripts/mobile-adaptation-patterns.json>; pattern IDs: <allowed IDs from those families>; standards: <direct catalogue source IDs>; mantine mechanism: <allowed registry IDs>; mantine owner: <canonical pattern path in selected family>; mobile range: <640px (theme.other.mobileGate / sm); mobile order: <ordered content/actions>; required content: no semantic loss; verification: <direct Story> across actual <640px thresholds and the 640px transition x <locales>.'
```

The tool call, rather than prose emitted beside another tool call, is the durable transcript evidence. `mobile order` is
free text: ordinary semicolons are permitted there, and it ends only at the required delimiter `; required content:`.
If any receipt value contains an apostrophe, escape it in the PowerShell single-quoted literal as `''`; the helper and
gate recover the original value before validation.
The helper checks receipt structure and prints it without writing project state. Immediately before a guarded write,
the phase gate separately checks the selected family, patterns, standards, Mantine mechanism, and single canonical
owner against the registry; the helper is not a bypass.

Every saved kickoff contains a `## Mobile adaptation record`. For non-visible work it says only `Scope: none`. For
visible work it contains these exact fields, one value each:

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

The record is a binding implementation route, not an optional design note.

Rendered verification is required at the project's minimum supported width where applicable, at every actual
behavior-changing threshold below `640px`, and on both sides of the `640px` transition, in every affected locale. It
proves: viewport and component have no horizontal overflow; every declared required semantic text field has
`scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`; computed text has no ellipsis or line clamp; all
content/actions remain reachable; and touch targets meet the project token rule. The executor saves raw probe output;
the reviewer independently reproduces it. A screenshot or a green static gate alone is insufficient.

This proof covers the app root **and every portal root** in every interaction state that opens an overlay (dialog,
sheet, popover, menu, dropdown, tooltip): `shared/rendered-state-census.md` is the binding rendered contract (owner
decision 2026-10-10). A census that reads only `#storybook-root` proves nothing about an overlay.

## Enforcement and stop states

- `.claude/hooks/phase-write-gate.ps1` rejects an in-scope UI/Story write without the mobile preflight, canonical
  preflight, and (for a Story) Storybook preflight.
- `scripts/check-mobile-adaptation-contract.mjs` is a fail-closed CI diff gate. It rejects added clipping/truncation
  primitives in changed UI source and malformed changed kickoff records; its planted self-test runs in CI.
- The task designer, executor, and reviewer must research a primary source when the selected profile does not cover
  a material interaction. Existing Stories may expose a defect but cannot justify retaining it. Only Opus may extend
  the profile catalogue/component map before an executable task is published. That extension also declares the
  permitted Mantine mechanism and canonical owner; it may not weaken or fork Mantine's responsive behavior.
- Missing source, profile, family mapping, Mantine mechanism/owner, direct Story, rendered proof, or required-content result is respectively
  `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`, `BLOCKED — MOBILE ADAPTATION`, or `NEEDS REVISION`; it is never an
  implementation detail deferred to Sonnet.
