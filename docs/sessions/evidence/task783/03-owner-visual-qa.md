# Task 783 — owner visual QA record (§13 matrix)

The `screenshots:assert` harness is retired (owner decision 2026-09-03). This file is the owner's
own rendered review, which is the only admissible visual evidence for this task.

## Reviewed and ACCEPTED — owner, 2026-09-04

Owner verdict, verbatim: **"Візуально все добре."** ("Visually everything is fine.")

Evidence: eight Storybook captures supplied in the review session, showing
`Patterns/Mantine/ListingsFilterBar` → `Many Active Filters`, `Light (Tailwind legacy)` theme,
viewport `W 320px / H 812px`, one capture per locale (two identical passes).

| Story | State | Viewport | Locale | Result |
|---|---|---|---|---|
| `Patterns/Mantine/ListingsFilterBar` | `ManyActiveFilters` (activeCount = 11) | 320 | `en` (GB English) | **ACCEPTED** |
| `Patterns/Mantine/ListingsFilterBar` | `ManyActiveFilters` (activeCount = 11) | 320 | `uk` (UA Ukrainian) | **ACCEPTED** — mandatory `uk@320` cell |
| `Patterns/Mantine/ListingsFilterBar` | `ManyActiveFilters` (activeCount = 11) | 320 | `sq` (SQ Albanian) | **ACCEPTED** |
| `Patterns/Mantine/ListingsFilterBar` | `ManyActiveFilters` (activeCount = 11) | 320 | `it` (IT Italian) | **ACCEPTED** |

### What the captures actually show (reviewer reading)

- The count badge reads **`11`**, matching the real `countActiveFilters(parseSearchParams(...))`
  result for the story's query — the rendered value confirms the source-level derivation and
  independently refutes the kickoff's stated "12".
- The badge sits **inside** the Advanced-filters button, immediately right of the label, at content
  size. It does not overhang the button border, is not clipped, and is not a corner overlay. This is
  the exact defect the task existed to fix, resolved at the narrowest supported viewport.
- No `Indicator` corner badge appears in any locale.
- Every control is full-width below `sm`, and the bar aligns to the story gutter.
- `uk@320` carries the longest label of the four (`Розширені фільтри`) and still leaves the badge
  in flow with no wrap or truncation — this is the worst case, and it passes.

### Unrelated observation, NOT a Task 783 defect

The property-type combobox renders the raw enum value `apartment` untranslated in all four locales.
That is the known raw-enum leak already tracked as backlog item **679** (`usePropertyTypes` fallback
localization, Sprint 56, folds 680). It is outside Task 783's scope, is present identically before
and after this diff, and must not be folded into this task.

## Not evidenced by the captures above

Kickoff §13 additionally names these tuples. They carry no recorded owner result yet:

| Story | States | Tuples with no recorded result |
|---|---|---|
| `Mantine/Primitives/CountButton` | filter-trigger 0 / 1 / 12 | `sq`/`en`/`uk`/`it` @ 320 and 1440; `en` @ 359, 390, 768, 1024 |
| `Patterns/Mantine/ListingsFilterBar` | `Default` (0), `OneActiveFilter` (1) | all listed tuples |
| `Patterns/Mantine/ListingsFilterBar` | `ManyActiveFilters` | 1440 (all locales); `en` @ 359, 390, 768, 1024 |

## Blanket acceptance — owner, 2026-09-04

Asked explicitly whether the acceptance covered only the four captured tuples or the whole matrix,
the owner answered: **"Так, все добре по всій матриці."** ("Yes, everything is fine across the whole
matrix.")

**AC9 is therefore ACCEPTED for the complete §13 matrix**, both stories, all states, all four locales
at 320 and 1440, and `en` at 359 / 390 / 768 / 1024 — including the 359px defect-reproduction cell
that opened the task. The four captures above remain the retained visual artifact; the rest of the
matrix is accepted on the owner's own recorded review, which is the only admissible visual evidence
under the retired-`screenshots:assert` policy.

The reviewer did not widen the original acceptance unilaterally — it was widened only after the owner
stated it in their own words, and that statement is quoted here.
