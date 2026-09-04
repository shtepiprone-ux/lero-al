# Task 783 — owner-native validation transcript (Windows PowerShell)

Captured by the owner on the real Windows checkout, 2026-09-04, and pasted verbatim into the
review session. Platform receipt `win32`, Node `v22.22.3`, working directory
`C:\Claude_Code_Projects\lero-al`. This is the **pre-fix** run: it is the run that proved
finding F1 (T6 stale assertion) empirically. The post-fix re-run of the single corrected test
file is to be recorded in `02-post-fix-vitest.md`; until it exists, AC8 is not closed.

```
PS C:\Claude_Code_Projects\lero-al> node.exe -p process.platform            # must print win32 - platform receipt
win32
PS C:\Claude_Code_Projects\lero-al> node.exe -v
v22.22.3
PS C:\Claude_Code_Projects\lero-al> npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al
 ❯ src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx (13 tests | 1 failed) 766ms
   ✓ ListingsFilterBar — T1 (AC2): listing-type change is one immediate push (3)
     ✓ preserves sort/currency, drops page, sets type — exactly one push 188ms
     ✓ selecting "All" deletes `type` rather than setting it to an empty string 72ms
     ✓ no useState holds a filter value in ListingsFilterBar.tsx 5ms
   ✓ ListingsFilterBar — T2 (AC2): premium toggle is one immediate push each way (2)
     ✓ turning premium on writes premium=true, one push 48ms
     ✓ turning premium off deletes the param, one push 54ms
   ✓ ListingsFilterBar — T3 (AC3): property-type change routes through handlePropertyTypeChange (2)
     ✓ switching from a type whose schema shows year_built to one that does not drops the dependent param in the same single push 75ms
     ✓ clearing to "All types" deletes property_type and drops nothing extra 68ms
   ✓ ListingsFilterBar — T4 (AC4): reset produces a bare pathname push (1)
     ✓ router.push is called with the pathname and no query string 52ms
   ✓ ListingsFilterBar — T5 (AC4): advanced filters calls onFiltersOpen, pushes nothing (1)
     ✓ clicking the advanced-filters control fires onFiltersOpen exactly once and 0 router.push calls 48ms
   ❯ ListingsFilterBar — T6 (AC5): route visibility lives in the ListingsShellView wrapper (3)
     ✓ theme.breakpoints.md is 48em (768px) — the boundary the wrapper class must resolve to 2ms
     × the wrapper root carries mantine-visible-from-md; the bar's own root carries neither visibility class 49ms
     ✓ ListingsFilterBar.tsx contains no visibleFrom/hiddenFrom/hidden md: markup 3ms
   ✓ ListingsFilterBar — T7 (Task 783): Advanced filters count is the canonical MantineCountButton, in-flow, not Indicator (1)
     ✓ activeCount=0 hides reset + renders no count badge; activeCount>0 renders one badge in-flow inside the button; no Indicator overlay exists either way 86ms
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx > ListingsFilterBar — T6 (AC5): route visibility lives in the ListingsShellView wrapper > the wrapper root carries mantine-visible-from-md; the bar's own root carries neither visibility class
AssertionError: expected 'mantine-visible-from-sm' to contain 'mantine-visible-from-md'
Expected: "mantine-visible-from-md"
Received: "mantine-visible-from-sm"
 ❯ src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx:268:31
    266|
    267|     const wrapper = barRoot.parentElement!
    268|     expect(wrapper.className).toContain('mantine-visible-from-md')
       |                               ^
    269|
    270|     expect(barRoot.className).not.toMatch(/mantine-(visible|hidden)-from-md/)
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
   Start at  08:17:25
   Duration  22.39s (transform 515ms, setup 1.36s, import 6.99s, tests 766ms, environment 12.66s)
PS C:\Claude_Code_Projects\lero-al> npx.cmd vitest run src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al
 ✓ src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx (12 tests) 537ms
   ✓ ListingsStatusTabs — C1: switchTab both directions (2)
     ✓ active -> closed: sets tab=closed, drops page, one push 113ms
     ✓ closed -> active: deletes tab (not empty string), drops page, one push 18ms
   ✓ ActiveFilterChips — C2: single-value and multi-value chip removal (3)
     ✓ single-value chip (premium) removal deletes the param, drops page 14ms
     ✓ multi-value chip (rooms) removal keeps the surviving value and untouched sibling params 9ms
     ✓ zero active filters renders nothing 6ms
   ✓ ListingsSortBar — C5: sort selection sets sort, drops page (1)
     ✓ selecting a new sort option pushes sort=price_asc with page dropped 105ms
   ✓ ListingsSortBar — C7: mobile filters trigger + count badge gating (2)
     ✓ clicking the mobile filters trigger calls onFiltersOpen, pushes nothing 41ms
     ✓ activeFiltersCount=0 renders no count badge; activeFiltersCount>0 renders one, in-flow inside the button (Task 782/F13 — canonical MantineCountButton, content-sized Badge in rightSection, not circle/Indicator overlay) 71ms
   ✓ SaveSearchButton — C10: server-action branches (3)
     ✓ already_exists: toast.info, modal closes, not treated as an error 53ms
     ✓ result.error: toast.error, modal STAYS open 37ms
     ✓ success: toast.success, modal closes, name cleared 31ms
   ✓ SaveSearchButton — C12: both actions disabled while isPending (1)
     ✓ Cancel and Save are both disabled during the pending transition 33ms
 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  08:17:49
   Duration  3.21s (transform 384ms, setup 78ms, import 1.85s, tests 537ms, environment 627ms)
PS C:\Claude_Code_Projects\lero-al> npm.cmd run typecheck
> lero-al@0.1.0 typecheck
> tsc --noEmit
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:stories
> lero-al@0.1.0 check:stories
> node scripts/check-stories.mjs
── Check 1: Banned layout values ──────────────────────────────────
── Check 2: Raw HTML controls ──────────────────────────────────────
── Check 3: Locale-NAME export families ─────────────────────────────
── Check 4: Hardcoded locale pins (globals + args + props) ─────────
── Check 5: Hardcoded title literals in fixtures ───────────────────
── Check 6: storybook.* namespace key parity ───────────────────────
  ✅ storybook.* sq — 655 keys (matches en)
  ✅ storybook.* uk — 655 keys (matches en)
  ✅ storybook.* it — 655 keys (matches en)
  ✅ storybook.* en  — 655 keys (reference)
── Check 7: Inline locale maps (uk:/sq:/it: in stories) ───────────────
── Check 8: uk.json Latin-only values (non-Cyrillic check) ────────────
  ✅ uk.json Cyrillic check complete
── Check 9: Runtime component hardcoded literals ────────────────────
── Check 10: English JSX string-prop literals in stories ───────────
── Check 11: sm:flex-row sm:flex-wrap (toolbar 640px overflow) ────────
── Check 12: Viewport/width-named exports ────────────────────────────
── Check 13: Duplicate-family export names ─────────────────────────────
── Check 14: Mantine Button size="lg"|"xl" (off-scale, Task 520) ──────
── Check 15: Unregistered Mantine colour prop (Task 685/686) ────────
── Check 16: Wall-clock fixture values (Task 697/698, §14.10) ─────────
── Stale allowlist entry check ──────────────────────────────────────
✅ check:stories PASSED — 140 files checked, 0 violations.
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:story-coverage
> lero-al@0.1.0 check:story-coverage
> node scripts/check-story-coverage.mjs
📖  check:story-coverage — pre-build, source-parsed (Task Q0R manifest gate)
    Canonical Mantine story files: 81 (of 135 total *.stories.tsx; prefixes: Mantine/Primitives/, Patterns/Mantine/)
    Manifest entries (migration scope): 27
    ✅ 27 covered (statically imported by ≥1 canonical Mantine story)
    ❌ 0 enrolled but unproven (no canonical Mantine story imports them)
✅  check:story-coverage PASSED — every manifest-enrolled component has a canonical Mantine story import.
PS C:\Claude_Code_Projects\lero-al> npm.cmd run build-storybook
> lero-al@0.1.0 prebuild-storybook
> node scripts/prepare-storybook-next15.mjs && node scripts/check-stories.mjs
[... check:stories re-run, identical to the block above: PASSED, 140 files, 0 violations ...]
> lero-al@0.1.0 build-storybook
> storybook build
┌  Building storybook v10.4.2
│
◇  Cleaning outputDir: storybook-static
│
◇  Loading presets
│
◇  Building manager..
│
●  Building preview..
│
●  Copying static files: public at storybook-static
│  Vite vite v6.4.2 building for production...
│
▲  Vite src/components/layout/FilterBar.stories.tsx (1:0): Error when using
│  sourcemap for reporting an error: Can't resolve original location of error.
│
│  448.17 kB │ gzip: 151.48 kB
│  Vite storybook-static/assets/DocsRenderer-LL677BLK-DBUSSapu.js
│  833.37 kB │ gzip: 266.39 kB
│  Vite storybook-static/assets/iframe-1THzHwp9.js
│  1,953.50 kB │ gzip: 556.38 kB
│
▲  Vite
│  (!) Some chunks are larger than 500 kB after minification. Consider:
│  - Using dynamic import() to code-split the application
│  - Use build.rollupOptions.output.manualChunks to improve chunking:
│  https://rollupjs.org/configuration-options/#output-manualchunks
│  - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
│  Vite ✓ built in 29.41s
│
◇  Output directory: C:/Claude_Code_Projects/lero-al/storybook-static
│
└  Storybook build completed successfully
PS C:\Claude_Code_Projects\lero-al> npm.cmd run build
> lero-al@0.1.0 build
> next build
   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata
   Creating an optimized production build ...
 ✓ Compiled successfully in 54s
   Skipping linting
 ✓ Checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (40/40)
 ✓ Collecting build traces
 ✓ Finalizing page optimization
[... full route manifest emitted; /[locale]/listings 14.2 kB, 627 kB First Load JS ...]
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:file-integrity
> lero-al@0.1.0 check:file-integrity
> node scripts/check-file-integrity.mjs
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 6 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 6 file(s) clean
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:mojibake
> lero-al@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs
check:mojibake — scanning 3728 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md
check:mojibake: 0 artifacts in 3728 files
```

## Reviewer reading of this transcript

| Command | Result | Bearing on the AC ledger |
|---|---|---|
| `node.exe -p process.platform` | `win32` | Windows-native evidence gate satisfied; this transcript is admissible. |
| `npx.cmd vitest run …listingsFilterBar.smoke.test.tsx` | **1 failed \| 12 passed** | **Confirms F1.** T5 and T7 both pass — the Task 783 behaviour is proven; the single failure is T6's pre-existing stale `md` assertion. Superseded once `02-post-fix-vitest.md` exists. |
| `npx.cmd vitest run …listingsMigratedControls.smoke.test.tsx` | 12/12 | The Task 782/F13 `MantineCountButton` precedent consumer is unaffected — no cross-consumer regression. |
| `npm.cmd run typecheck` | no output, no error | `tsc --noEmit` clean. AC8 typecheck met. |
| `npm.cmd run check:stories` | PASSED, 140 files, 0 violations | Check 6 storybook key parity 655×4 — AC6 corroborated: no locale file needed changing. |
| `npm.cmd run check:story-coverage` | PASSED, 27/27 | No manifest regression from the new story exports. |
| `npm.cmd run build-storybook` | "Storybook build completed successfully" | The Vite sourcemap warning names `src/components/layout/FilterBar.stories.tsx` — an unrelated legacy file, not in this diff. Chunk-size warnings are pre-existing framework noise. |
| `npm.cmd run build` | `✓ Compiled successfully`, `✓ Checking validity of types`, 40/40 static pages | **Mandatory non-Q0 production build gate met** for the reviewed diff. |
| `npm.cmd run check:file-integrity` | PASSED, 6 files clean | No NUL/BOM/truncation in the changed set. |
| `npm.cmd run check:mojibake` | 0 artifacts / 3728 files | No encoding damage. |
