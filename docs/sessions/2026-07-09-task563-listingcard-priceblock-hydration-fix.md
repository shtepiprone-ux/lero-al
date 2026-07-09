# Session Archive: `ListingCard`/`PriceBlock` price-formatting hydration mismatch (Task 563) — 2026-07-09

## Context

Task 563, `tasks/Sprints/Task_563_kickoff_prompt_ListingCardPriceHydrationMismatch.md`. Origin: found
during the Task 559 round-2 rendered review (2026-07-08) — pre-existing, unrelated to the 559 diff.
`ListingCard`'s `PriceBlock` triggered a React hydration mismatch on `/sq/listings` and `/it/listings`
(session-log symptom: server "45 000 ALL" vs client "45,000 ALL").

## Root cause (verified directly, not assumed)

Reproduced with Node (`Intl.NumberFormat`, full ICU) vs a real headless-Chromium page
(`page.evaluate(() => Intl.NumberFormat.supportedLocalesOf(['sq']))`):

- **Node** (`new Intl.NumberFormat('sq').format(45000)`) → `"45 000"` — correct Albanian grouping,
  full ICU data present server-side.
- **Chromium** → `Intl.NumberFormat.supportedLocalesOf(['sq'])` returns `[]` — the browser's bundled
  ICU has **no Albanian locale data at all**, so `new Intl.NumberFormat('sq', ...)` silently falls
  back to a different locale (`resolvedOptions().locale` → `"en-GB"`), producing comma grouping
  (`"45,000"`) instead of the server's space grouping. This is the exact same class of gap as Task
  562's calendar-name fix (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]`), but for
  `Intl.NumberFormat`'s digit grouping instead of month/weekday names.
- `it` was verified directly to be **fully supported** in Chromium
  (`Intl.NumberFormat.supportedLocalesOf(['it'])` → `['it']`, `format(45000)` → `"45.000"`, matching
  Node exactly) — `it` was never actually broken for price formatting, mirroring the exact same `it`
  finding from Task 562.

Since `ListingCard` is a `'use client'` component, the same locale value reaches both runtimes (ruling
out diagnosis (a) from the kickoff) — the divergence is entirely runtime ICU-completeness (diagnosis
(b)), scoped to the browser specifically.

## Implementation

`src/lib/formatters.ts`:
- Added `NUMBER_GROUPING`: a static per-locale table (`separator` + `minimumGroupingDigits`) extracted
  from Node's full-ICU `Intl.NumberFormat` output — the authoritative reference. `en`: `,`/1· `uk`:
  U+00A0 NBSP/1 · `sq`: U+00A0 NBSP/2 · `it`: `.`/2.
- Added `groupDigits(value, locale)` — a pure function that manually inserts grouping separators
  (no `Intl.NumberFormat` call at all), replicating real CLDR behavior including the `sq`/`it`
  quirk where grouping is omitted entirely below a 5-digit total (`4500` stays `"4500"`, never
  `"4.500"`/`"4 500"`, but `10000` groups normally) — verified byte-for-byte against Node's
  `Intl.NumberFormat` across 76 value/locale combinations (0, small numbers, 3/4/5/7/8/9-digit,
  negatives) via a standalone comparison script, all matching exactly.
- `formatPrice`/`formatCount` now call `groupDigits()` instead of `new Intl.NumberFormat(locale, ...)`
  — output is identical on every runtime regardless of that runtime's own ICU locale-data
  completeness, closing the gap at its root rather than special-casing `sq`.

`src/modules/listings/components/ListingCard.tsx`:
- `originalPriceStr` (the converted-currency original-price string) previously called
  `new Intl.NumberFormat('en').format(...)` directly — routed through the same deterministic
  `formatCount(listing.price, 'en')` path for consistency (this call site was never actually broken,
  since `en` is universally supported, but it's the same class of Intl dependency this fix removes
  project-wide).

## Files Changed

| File | Rationale |
|---|---|
| `src/lib/formatters.ts` | `formatPrice`/`formatCount` no longer depend on `Intl.NumberFormat` — digit grouping computed from a static per-locale table (`NUMBER_GROUPING` + `groupDigits()`), removing the runtime-ICU dependency that caused the `sq` hydration mismatch. |
| `src/modules/listings/components/ListingCard.tsx` | `originalPriceStr` routed through `formatCount(..., 'en')` instead of a direct `new Intl.NumberFormat('en')` call — same deterministic path, no behavior change (en always fully supported). |
| `src/lib/__tests__/price-format-ssr-parity.smoke.test.ts` | New — literal-byte assertions for `formatPrice`/`formatCount` across all 4 locales (incl. the sq/it 4-digit-ungrouped CLDR quirk) + a direct "Intl.NumberFormat throws" simulation proving no dependency on it. |
| `docs/critical-flow-registry.md` | New row: "Listings display — price formatting (SSR/CSR parity)" under the Listings lifecycle table. |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. No hydration mismatch for `PriceBlock` at any locale (console-clean on `/sq`+`/it/listings`) | Live Playwright run against the real dev server: `/sq/listings` price = `"45 000 ALL"`, no price-related line in the hydration diff; `/it/listings` price = `"45.000 ALL"`, same. Remaining hydration warnings on those two routes are unrelated, pre-existing, out-of-scope (see "Scope note" below) | ✅ (price-specific) |
| 2. Server/client price strings byte-identical at en/it/sq/uk; en/uk unchanged | `groupDigits()` verified to match Node's `Intl.NumberFormat` output exactly across 76 combinations (includes en/uk, confirming zero visual change); live-app en=`"45,000 ALL"`, uk=`"45 000 ALL"` unchanged | ✅ |
| 3. Root cause identified + stated; justified against `state-authority.md` | See "Root cause" above — verified directly via Node vs. real headless-Chromium `Intl.NumberFormat.supportedLocalesOf` probe, not assumed. Fix is the "format once, deterministically, independent of runtime ICU" pattern `formatters.ts` already documents (extended from date formatting to number grouping), consistent with `state-authority.md`'s hydration-determinism principle | ✅ |
| 4. Regression test proves hydration-stable price formatting + planted-violation transcript; registry row updated | `price-format-ssr-parity.smoke.test.ts`, 22/22 PASS; planted-violation below; registry row added (was absent) | ✅ |
| 5. Gates green; Files-Changed table present; git NOT run | See Self-validation | ✅ |

## Regression coverage (clause 15)

Registry row: `docs/critical-flow-registry.md` → "Listings display — price formatting (SSR/CSR
parity)" (new row, Listings lifecycle table).

`npx vitest run src/lib/__tests__/price-format-ssr-parity.smoke.test.ts` → **22/22 PASS**:
- Literal-byte assertions: `formatPrice`/`formatCount` for a 5-digit grouped value, the sq/it
  4-digit-ungrouped CLDR quirk, a 7-digit multi-group value, negatives, and an unknown-locale
  fallback — all 4 locales.
- **Hydration-mismatch simulation**: `Intl.NumberFormat` monkey-patched to throw (simulating a
  runtime whose ICU cannot construct a `NumberFormat` for the locale at all) — `formatPrice`/
  `formatCount` still produce the exact expected literal for every locale, proving zero dependency
  on `Intl.NumberFormat` succeeding.

**Planted-violation (verified live, reverted):** temporarily reverted `formatPrice` to call
`new Intl.NumberFormat(locale, {maximumFractionDigits:0}).format(...)` directly (the pre-fix code).
Result: 2/22 tests genuinely **FAIL**:
```
formatPrice for sq/it still produces the correct literal when Intl.NumberFormat throws for every locale
  → Error: simulated broken/incomplete ICU locale data (thrown from new Intl.NumberFormat)
unknown locale falls back to the en grouping table (never throws)
  → expected '45,000 EUR', received '45 000 EUR' (Node's real Intl.NumberFormat('fr') output — not en fallback)
```
Reverted → 22/22 PASS again.

**No existing suite regressed**: `formatters.test.ts` (formatPrice single-currency-marker contract,
33 tests) re-verified green — the new `groupDigits`-based `formatPrice` still passes every existing
assertion (currency marker, rounding, zero-price). `date-format-ssr-parity.smoke.test.ts` (27 tests,
unrelated formatters in the same file) unaffected.

**Full suite**: `npx vitest run` → 1059/1063 PASS. The 4 failures (`check-stories.test.ts`
"checksRan===13", 2 `RangeDatePicker.smoke.test.tsx` mobile tests, `saveSavedSearch.dedup.test.ts`)
are pre-existing/environmental — confirmed by stashing this diff's changes and re-running: the exact
same 2 `RangeDatePicker` tests fail identically on HEAD without this diff (timeouts, unrelated to
any file this diff touches). `git diff --stat` confirms none of their subject files are in this diff.

## Scope note — two additional hydration findings, NOT fixed here (out of scope)

Live rendered evidence surfaced two *other*, unrelated hydration issues still present on these routes
after this fix — flagged here per the kickoff's instruction to note but not fix them:

1. **`/it/listings`**: the pre-existing Base-UI `Tabs`/`CompositeRoot`/`DropdownMenu` random-`id`
   mismatch, exactly as the kickoff anticipated ("A `Tabs`/`CompositeRoot` `id` mismatch was ALSO
   observed on the same page... do not fix out of scope"). Confirmed unrelated to price/`PriceBlock`.
2. **`/sq/listings`** (NEW finding): `formatListingDate` (`src/lib/formatters.ts`) calls
   `Intl.DateTimeFormat(locale, {month:'short', ...})` live at render time. This has the **identical**
   Chromium-lacks-`sq`-ICU root cause as Task 562's calendar-name fix, but at a different call site —
   the listing-card date stamp (`17 qer 2026` server vs `17 Jun 2026` client), not the
   `RangeDatePicker` calendar body. `formatListingDate` is untouched by this diff (confirmed via
   `git diff` — not in the kickoff's scope, which was `PriceBlock`/price formatting only).
   **Recommend a follow-up task** (same shape as Task 562: replace the live `Intl.DateTimeFormat`
   month/weekday-name calls in `formatListingDate` with static `common.calendar_*` i18n data, which
   already exists from Task 562).

## Self-validation

`Self-validation: tsc=0 errors · check:i18n=PASS (2122 keys ×4, unchanged) · check:design-tokens
--strict=PASS (0 violations) · check:mojibake=PASS (0 artifacts/1615 files) · check:file-integrity=
PASS (5 files clean) · npx vitest run=1059/1063 (4 pre-existing/environmental failures, verified
identical on HEAD without this diff — zero regression) · new test file 22/22 PASS · planted-violation
2/22 genuinely FAIL then reverted → 22/22 PASS · groupDigits() verified byte-identical to Node's
Intl.NumberFormat across 76 value/locale combinations · runtime evidence: real dev server + Playwright,
`/sq/listings` price = "45 000 ALL" (fixed, was "45,000 ALL"), `/it/listings` price = "45.000 ALL"
(unchanged, was never broken) · registry row added · scope=clean (git diff touches exactly the 2
source files + 1 new test file + 1 registry-doc row listed above) · root cause stated and verified
directly via a live Chromium probe (not assumed) · zero regression to en/uk (byte-identical
before/after, verified via the 76-combination comparison)`. **Git was NOT run** — held for
orchestrator review per the kickoff's AC 5.
