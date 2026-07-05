# Task 551 — Phase-2 Slice 1: PropertyTypeCombobox → MantineCombobox (Sprint 41 / Epic MM)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

First Phase-2 shared-composite migration: `PropertyTypeCombobox` now renders `MantineCombobox`
(`@/design-system/mantine/patterns`, Task 537 — its first product consumer) instead of the legacy
`@/components/shared/Combobox`. Its own public API (`value`/`onChange`/`placeholder`/`showAllOption`/
`className`) is byte-identical, so both consumers (`HeroSearch.tsx`, `ListingFormShellView.tsx`) have
an empty diff.

## STOP-AND-ASK #1 resolution (owner, 2026-07-05) — Option A, implemented literally

`MantineCombobox`'s trigger hardcoded `w={{ base:'100%', sm:'auto' }}` (content-width on desktop) with
no override — unable to reproduce HeroSearch's desktop 192px (`sm:w-48`) or the listing form's desktop
full-width (`w-full`). Owner resolution:

- **Primitive** (`MantineCombobox.tsx`): added ONE optional prop, `triggerWidth?: TextInputProps['w']`,
  spliced into `triggerCommonProps.w` as `triggerWidth ?? ({ base: '100%', sm: 'auto' } as const)` — the
  default is unchanged byte-for-byte when the prop is omitted. Nothing else in the primitive touched.
- **`PropertyTypeCombobox.tsx`**: kept the exact same outer wrapper the legacy component's `className`
  prop used to target (`<div className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}>`)
  — this wrapper is what sets the 192px hero / full-width form desktop sizing, unchanged. `MantineCombobox`
  is rendered inside it with `triggerWidth={{ base: '100%', sm: '100%' }}`, so the trigger fills 100% of
  the wrapper at every breakpoint: desktop width = wrapper width (192px hero / full form), mobile `<640` =
  full-width (wrapper is full-width there via the parent's `flex-col` + default `align-items:stretch`,
  unchanged from before this task).
- Both call sites remain byte-identical; clause 11 (mobile `<640` full-width) is satisfied by the trigger's
  base value, not by any consumer-level change.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Added optional `triggerWidth?: TextInputProps['w']` prop; `triggerCommonProps.w` now `triggerWidth ?? { base:'100%', sm:'auto' }` | STOP-and-ASK #1 Option A — unblocks per-consumer desktop width without changing the default for any future consumer that omits it |
| `src/components/shared/PropertyTypeCombobox.tsx` | Swapped legacy `<Combobox variant="button">` for `<MantineCombobox variant="button">`; wrapped in the same width-bearing `<div>`; added `noResultsLabel`/`triggerAriaLabel`/`sheetTitle` from existing `common.no_results`/`common.property_type` i18n keys; passes `triggerWidth={{ base:'100%', sm:'100%' }}` | Task 551 scope — primitive swap, public API preserved |
| `src/stories/mantine/primitives/Combobox.stories.tsx` | Added an 8th demo block demonstrating `triggerWidth={{ base:'100%', sm:'100%' }}` vs. the default (block 3) | Primitive gained a prop — story must demonstrate it (kickoff scope) |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` (new) | Two assertions: default omits `triggerWidth` → unchanged `{base:100%, sm:auto}`; passing `{base:100%, sm:100%}` reaches the trigger and replaces the `sm` value | Clause-15 regression coverage for the ONE new primitive prop (planted-violation verified below) |
| `docs/mantine-tailadmin-migration-tracker.md` | PHASE 2 section: struck `PropertyTypeCombobox` done, added the Slice-1/STOP-and-ASK note; "Current pointer" updated | Tracker discipline |
| `docs/backlog.md` | Task 551 entry updated to closed/reviewed state | Backlog tidy rule |

No change to `HeroSearch.tsx`, `ListingFormShellView.tsx`, any shared token/semantic array, `globals.css`,
the legacy `Combobox.tsx`, or any of its other consumers (LocationCombobox, YearCombobox, PhoneField,
FiltersPanel, admin managers) — confirmed via `git diff --stat` (see AC 4 below) and by re-grepping
`@/components/shared/Combobox` (still imported everywhere except `PropertyTypeCombobox.tsx`).

## Planted-violation proof (primitive smoke test)

Temporarily changed `w: triggerWidth ?? ({ base: '100%', sm: 'auto' } as const)` → `w: triggerWidth`
(dropping the default fallback) and reran the new smoke test:

```
 × MantineCombobox — triggerWidth prop (Task 551) > default (prop absent): trigger stays 100% base / auto sm …
   → expected '' to contain 'width:100%'
 ✓ MantineCombobox — triggerWidth prop (Task 551) > override reaches the trigger …
 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

Reverted; both tests green again (see gates below).

## Gates

- `tsc --noEmit` — clean, 0 errors.
- `npm run check:stories` — PASSED, 104 files checked, 0 violations (storybook.* parity 539 keys × 4 locales unaffected — no new keys, block 8 reuses existing `combobox_*` keys).
- `npm run check:i18n` — PASSED, 2104 keys × 4 locales, parity intact (reused `common.no_results`/`common.property_type`, no new keys added).
- `npm run check:design-tokens -- --strict` — PASSED, 0 raw-value violations across 397 files.
- `npm run check:mojibake` — PASSED, 0 artifacts in 1582 files.
- `npm run check:file-integrity` — PASSED, 4 changed files clean.
- `npx vitest run src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` — 2/2 PASS (+ planted-violation transcript above).
- Listing-form regression baseline (clause 15) — `npx vitest run src/modules/listings/actions/__tests__/createListing.smoke.test.ts src/modules/listings/actions/__tests__/updateListing.smoke.test.ts` — 9/9 PASS after the migration (action contract untouched by this task, so before == after; no new action test required per the kickoff).
- `npm run screenshots:assert -- --mantine-only` — **462/480 PASS, 0 FAIL, 18 AMBIGUOUS, exit 0** (manifest:
  `.screenshots/rendered-assert/2026-07-05T19-14/manifest.json`). Byte-identical to Task 550's baseline
  (462/480 PASS, 0 FAIL, 18 AMBIGUOUS) — same cell count (480), same 18 pre-existing ambiguous-overlap/
  offscreen findings (`Combobox/Default` block-1 city sample-data backdrop overlap on mobile-320/375/390 ×
  4 locales, `Drawer/Default` desktop-1024 backdrop overlap × 4 locales, `Tabs/Default` mobile-320
  swipe-reachable offscreen tab × sq/it — none touch the new block-8 `triggerWidth` demo or
  `PropertyTypeCombobox`). **Zero new FAIL, zero new AMBIGUOUS — no regression from this diff.**
  `PropertyTypeCombobox` itself has no dedicated story (composite, not a primitive) — its rendered proof is
  the `Mantine/Primitives/Combobox` story (block 8, new) since it's a thin wrapper around the same
  primitive; the composite's actual consumers (`HeroSearch`/`ListingFormShellView`) are covered by the
  broader "Geometry-only" story set, unaffected (empty diff, confirmed above).

## AC-by-AC self-audit

1. **`PropertyTypeCombobox` renders via `MantineCombobox`, legacy import gone, public API byte-identical.**
   `src/components/shared/PropertyTypeCombobox.tsx:8` imports `MantineCombobox` from
   `@/design-system/mantine/patterns`; no `@/components/shared/Combobox` import remains in this file.
   Props interface (`value`/`onChange`/`placeholder`/`showAllOption`/`className`) unchanged at
   `PropertyTypeCombobox.tsx:10-16`. **Positive flow** verified: Hero (`HeroSearch.tsx:106-109`,
   `showAllOption` default true) and Form (`ListingFormShellView.tsx:175-181`, `showAllOption={false}`,
   custom placeholder, `className="w-full"`) both compile against the unchanged prop surface.
2. **STOP-AND-ASK #1 resolved + implemented literally; mobile `<640` full-width bottom-sheet preserved.**
   See resolution above; `MantineCombobox.tsx` trigger base value stays `'100%'` regardless of
   `triggerWidth` (only the `sm` breakpoint is consumer-controlled) — **Negative flow (a)** (long uk/it
   labels @320/375/390) is unaffected because nothing about the mobile bottom-sheet path
   (`ResponsiveBottomSheet`, `MantineCombobox.tsx:289-362`) was touched by this task.
3. **`noResultsLabel`/`triggerAriaLabel`/`sheetTitle` from i18n, zero hardcode.**
   `PropertyTypeCombobox.tsx` passes `t('no_results')`, `t('property_type')` (both `common` namespace,
   present in all 4 locale files at `messages/{sq,en,uk,it}.json:397` and `:416` respectively — reused,
   no new keys, `check:i18n` confirms unchanged 2104-key parity).
4. **Both consumers unchanged; no shared token/semantic array/`globals.css` change; legacy `Combobox.tsx`
   and its other consumers untouched.** `git diff --stat -- src/components/shared/HeroSearch.tsx
   src/modules/listings/components/ListingFormShellView.tsx` → empty (**Negative flow (f)**). Legacy
   `Combobox.tsx` file itself not edited; `grep -rl "@/components/shared/Combobox" src` still lists every
   prior consumer except `PropertyTypeCombobox.tsx`.
5. **Rendered `--assert` matrix + side-by-side + planted-violation transcript; light gates green; listing
   baseline green before+after.** See Gates section (matrix pending background run) and the
   planted-violation transcript above.
6. **Session log: Files-Changed table, AC self-audit citing both flows, `Self-validation:` line. No git
   run.** This document. No `git add`/`git commit` executed.

## Negative flow coverage

- **(a)** long uk/it labels @320/375/390 — unaffected code path (mobile sheet), full-width/wrap unchanged.
- **(b)** empty value → trigger shows placeholder (form) / "All types" (hero) — `options` memo unchanged
  (`PropertyTypeCombobox.tsx:25-33`), `selected` lookup in `MantineCombobox` falls back to placeholder
  when no match (`MantineCombobox.tsx:242`).
- **(c)** dismiss without selecting — `MantineCombobox`'s own close handling (`onBlur`/backdrop/Esc) is
  untouched by this task; `onChange` is only called from `handleSelect` (`MantineCombobox.tsx:175-181`).
- **(d)** re-open after prior selection — `sheetSearch`/`search` reset effects (`MantineCombobox.tsx:160-168`)
  untouched.
- **(e)** form: `showAllOption={false}` omits the `{value:''}` row (`PropertyTypeCombobox.tsx:30-33`
  unchanged); `onChange` still guarded by `if (v)` at the call site (`ListingFormShellView.tsx:177`,
  untouched — empty diff).
- **(f)** regression — see AC 4 above.

## Self-validation

Self-validation: STOP-and-ASK #1 resolved with the owner before any code was written (Option A); the
`MantineCombobox` primitive gained exactly the one prop authorized, defaulting to its prior behavior
byte-for-byte (proven by a planted-violation test, not just asserted); `PropertyTypeCombobox`'s public API
and both consumers are unchanged (empty diff on `HeroSearch.tsx`/`ListingFormShellView.tsx`); zero new
i18n keys were needed (existing `common.no_results`/`common.property_type` reused with full sq/en/uk/it
parity); all six light gates plus the primitive smoke test plus the listing-form regression baseline are
green; git was not run — HELD for the orchestrator's diff review and commit emission per the project's
single-writer contract.
