# Mobile adaptation pattern catalogue

Read only the rows selected by the component family in
`mobile-adaptation-component-map.md`. This catalogue is the human-readable counterpart of
`scripts/mobile-adaptation-patterns.json`; the JSON registry is the CI source of truth.

The project compact range is `<640px`; `640px` is its transition to the wider composition. A source below supports
the adaptation direction. The **project compact rule** is binding here and must not be misrepresented as quoted
Apple, Android, or W3C wording.

## Mantine is the mechanism; this catalogue supplies the missing semantic decision

The profiles below do not prescribe a second responsive system. Mantine's documented
[responsive props and visibility props](https://mantine.dev/styles/responsive/),
[Flex](https://mantine.dev/core/flex/), and [AppShell](https://mantine.dev/core/app-shell/?t=props) remain the first
implementation choice. The project theme and named canonical pattern own the breakpoint and reusable composition.

The catalogue answers only questions Mantine cannot infer from props alone: which information/action order is
required, whether a record changes presentation, how full content remains reachable, and what proof is necessary.
When responsive props cannot express a real presentation switch, the only permitted exception is the registry-listed
`media-query-exception`, using [Mantine `useMediaQuery`](https://mantine.dev/hooks/use-media-query/) with its SSR
behavior documented and the named canonical owner. Do not add parallel viewport logic, custom breakpoint CSS, or
alter Mantine focus/dismissal/keyboard behavior to implement a catalogue row.

| ID | Primary sources | Project compact rule | Reject |
|---|---|---|---|
| `linear-flow` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [W3C Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence), [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) | One semantic reading column; preserve meaningful DOM/read order when panes stack. | A squeezed multi-column desktop pane or CSS reordering that breaks reading/focus order. |
| `record-card` | [Apple Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Android Common layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/common-layouts), [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | A record shows identity/title, state/context, details, then actions in the recorded task order; the card grows rather than compresses columns. | A desktop table row kept as a narrow horizontal record. |
| `key-value-stack` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [W3C Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence), [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Content structure](https://developer.android.com/design/ui/mobile/guides/layout-and-content/content-structure) | For ordinary semantic fields, label then complete value below; rows grow and preserve the association. | A label and value competing for one line, a right-aligned desktop value column, or clipped value text. |
| `data-table-to-cards` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [Apple Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Android Common layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/common-layouts) | A data table is one `record-card` per row below the recorded switch; select the task's card anatomy. | Horizontal scrolling as a mobile data-table strategy. |
| `form-stack` | [W3C Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions), [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Content structure](https://developer.android.com/design/ui/mobile/guides/layout-and-content/content-structure) | Keep label, help/error, and control associated in one field flow; fields and text actions stack or use the canonical full-width treatment. | A two-column form squeezed to mobile, detached error/help text, or a hidden field label. |
| `toolbar-priority` | [Apple Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Android Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns), [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | Keep required actions reachable in declared priority; wrap/stack or move only secondary actions into a named accessible overflow. | A crowded single row, unlabeled icon overflow, or a clipped action label. |
| `navigation-adaptive` | [Apple Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search), [Android Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout), [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | Use the canonical compact navigation presentation while retaining every destination and logical focus/reading order. | Desktop navigation merely shrunk until labels or destinations disappear. |
| `overlay-adaptive` | [Apple Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Android Common layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/common-layouts), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout), [W3C Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | Use the canonical mobile sheet/full-width overlay; preserve trigger, dismissal, focus return, content reachability, and ordered actions. | A desktop popover/modal squeezed into the phone, hover-only essential content, or covered focus. |
| `grid-media-reflow` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Common layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/common-layouts), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) | Reduce tracks, stack, or change presentation while preserving media meaning and required controls. | Fixed desktop tracks that make media or adjacent text too narrow to understand or operate. |
| `inline-control` | [W3C Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Apple Menus](https://developer.apple.com/design/human-interface-guidelines/menus), [Android Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns) | Only an intrinsically short control may stay inline; it meets the project mobile target token and cannot force neighbouring semantic content to clip. | Declaring a long label/value/record row an inline control to avoid reflow. |
| `data-visualization-reflow` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [W3C Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence), [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) | Preserve the chart's intended comparison; reflow legend, controls, labels, and supporting values before reducing legibility. Provide an equivalent reachable textual value when a compact chart cannot convey it. | Cropping axes/legend/tooltips, unreadable labels, or treating a chart as a two-dimensional-scroll exception without an owner decision. |
| `editor-adaptive` | [W3C Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [Apple Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Android Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) | Keep the editable area, selection/focus, and required commands operable; compact the command bar by priority without hiding its only access path. | A desktop editor toolbar that clips, a nonreachable command, or a content area displaced by a fixed toolbar. |

## Extension is an Opus-only gate

A new visible component type is not covered merely because it renders with Mantine. Before publishing its kickoff,
Opus must add, in the same policy change:

1. a source-backed profile with direct primary-source URLs in this catalogue and in the JSON registry;
2. a component family in `mobile-adaptation-component-map.md` and every affected canonical pattern path in the JSON
   registry, including its allowed Mantine mechanism IDs;
3. required compact behavior, explicit rejected anti-patterns, a named canonical Mantine owner, and rendered proof
   requirements; and
4. a planted check proving that an unmapped new canonical Mantine pattern or an incompatible Mantine mechanism fails.

Until all four exist, the task is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`. Sonnet must not create, rename, or
classify a new canonical Mantine pattern; it reports this exact block to Opus. A reviewer rejects a change whose
component family, selected profile, source link, or proof is absent.
