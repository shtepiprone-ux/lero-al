# Kickoff prompt — Task 178 (Sprint 9 — M.4: currency selector = canonical Combobox everywhere)

> Notes 5 + 21: the advanced-filters drawer (`src/components/shared/FiltersPanel.tsx`) still shows only
> 2 currencies, and currency is chosen with buttons rather than a Combobox. The canonical primitive is
> `src/components/shared/Combobox.tsx` (`variant: 'input' | 'button'`, `ComboboxOption`). Replace every
> button-based currency selector with the canonical Combobox fed by the Task 177 catalog. Governance for
> this is already codified in docs/ui-rules.md §0. Blocked-by Task 177.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: this is the SELECTOR CONTROL only — replace currency buttons with the canonical
  Combobox and feed it the Task 177 catalog. Not conversion math, not the catalog data itself.
- Do NOT invent architecture or a new dropdown. Use src/components/shared/Combobox.tsx ONLY
  (docs/ui-rules.md §0 — Combobox single-source). Pick `variant` appropriately (button for short, input
  for searchable). If a currency selector lives somewhere not listed below, fix it too (grep) — Global
  Change Verification Rule.
- Currency CODES render literally, never via t() (docs/ai-behavior.md i18n rules).
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-178-currency-combobox.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/components/shared/Combobox.tsx (canonical — variant, size, portal, ComboboxOption)
- src/components/shared/FiltersPanel.tsx (advanced-filters drawer — only 2 currencies today)
- src/modules/listings/components/ListingsFilters.tsx, src/modules/cabinet/components/ProfileTab.tsx,
  src/components/layout/Header.tsx (any currency control)
- src/modules/currency/hooks/useCurrencies.ts (the Task 177 catalog source)
- docs/ui-rules.md §0, docs/component-governance.md, docs/ai-behavior.md (Filter anti-patterns:
  currency must NOT count toward activeFiltersCount — do not regress)

Scope:
1. Replace every button-based currency selector with the canonical Combobox, options from the catalog.
2. The advanced-filters drawer must show the FULL currency list (not 2).
3. Keep behaviour identical otherwise: selecting a currency drives the same state it does today; currency
   stays excluded from active-filter badge counts (existing rule).

Acceptance criteria:
- All currency selection is the canonical Combobox; zero currency button-rows remain (grep proves it).
- Advanced-filters drawer shows the full catalog from Task 177.
- Currency excluded from active-filter counts (unchanged); codes rendered literally.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- Conversion math (175/176); catalog data (177); non-currency selectors (Epic Q handles general combobox
  consolidation).
```
