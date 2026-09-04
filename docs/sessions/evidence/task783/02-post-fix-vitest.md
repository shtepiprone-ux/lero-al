# Task 783 — post-fix targeted Vitest re-run (owner-native, Windows PowerShell)

Run by the owner on 2026-09-04 after the reviewer corrected T6's stale `md` assertions to `sm`.
This artifact **supersedes** the failing run recorded in `01-owner-native-gates.md`; only this one
may support AC7/AC8.

```
PS C:\Claude_Code_Projects\lero-al> npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al
 ✓ src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx (13 tests) 810ms
   ✓ ListingsFilterBar — T1 (AC2): listing-type change is one immediate push (3)
     ✓ preserves sort/currency, drops page, sets type — exactly one push 189ms
     ✓ selecting "All" deletes `type` rather than setting it to an empty string 76ms
     ✓ no useState holds a filter value in ListingsFilterBar.tsx 4ms
   ✓ ListingsFilterBar — T2 (AC2): premium toggle is one immediate push each way (2)
     ✓ turning premium on writes premium=true, one push 50ms
     ✓ turning premium off deletes the param, one push 60ms
   ✓ ListingsFilterBar — T3 (AC3): property-type change routes through handlePropertyTypeChange (2)
     ✓ switching from a type whose schema shows year_built to one that does not drops the dependent param in the same single push 83ms
     ✓ clearing to "All types" deletes property_type and drops nothing extra 73ms
   ✓ ListingsFilterBar — T4 (AC4): reset produces a bare pathname push (1)
     ✓ router.push is called with the pathname and no query string 55ms
   ✓ ListingsFilterBar — T5 (AC4): advanced filters calls onFiltersOpen, pushes nothing (1)
     ✓ clicking the advanced-filters control fires onFiltersOpen exactly once and 0 router.push calls 50ms
   ✓ ListingsFilterBar — T6 (AC5): route visibility lives in the ListingsShellView wrapper (3)
     ✓ theme.breakpoints.sm is 40em (640px) — the boundary the wrapper class must resolve to 3ms
     ✓ the wrapper root carries mantine-visible-from-sm; the bar's own root carries neither visibility class 51ms
     ✓ ListingsFilterBar.tsx contains no visibleFrom/hiddenFrom/hidden md: markup 3ms
   ✓ ListingsFilterBar — T7 (Task 783): Advanced filters count is the canonical MantineCountButton, in-flow, not Indicator (1)
     ✓ activeCount=0 hides reset + renders no count badge; activeCount>0 renders one badge in-flow inside the button; no Indicator overlay exists either way 97ms
 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  08:30:15
   Duration  3.71s (transform 410ms, setup 83ms, import 1.95s, tests 810ms, environment 658ms)
```

## Reviewer reading

- **13/13, 0 failed.** F1 is closed. The corrected T6 now asserts the real boundary
  (`theme.breakpoints.sm === '40em'`, wrapper class `mantine-visible-from-sm`), and both its
  positive and negative assertions moved together — the negative regex was changed from `md` to
  `sm` so it continues to assert something rather than passing vacuously.
- **T5 and T7 pass unchanged**, so the Task 783 behaviour itself (one `onFiltersOpen`, zero
  `router.push`; zero → no badge, non-zero → one in-flow `Badge` inside the trigger, no `Indicator`
  either way) is proven inside a fully green suite rather than alongside a failure.
- T6's third assertion still passes: `ListingsFilterBar.tsx` carries no `visibleFrom`/`hiddenFrom`
  markup of its own — the visibility gate remains in `ListingsShellView`, which this task never
  touched.
