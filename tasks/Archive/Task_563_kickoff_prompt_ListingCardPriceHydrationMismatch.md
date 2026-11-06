# Task 563 — `ListingCard` / `PriceBlock` price-formatting hydration mismatch (`/sq|it/listings`)

**Type:** Bug-fix / hydration + i18n (product code). **Executor:** Sonnet 4.6.
**Origin:** Found during Task 559 round-2 rendered review (2026-07-08) — pre-existing, unrelated to the 559 diff.
**Critical flow:** listings display → **clause 15 regression coverage is in scope.**

## Goal

On `/sq/listings` and `/it/listings`, `ListingCard`'s `PriceBlock` triggers a **React hydration mismatch**: the
server and client render different number grouping for the same price (session-log symptom: server "45 000 ALL"
vs client "45,000 ALL"). It does NOT occur at `en`/`uk`, nor on the homepage. Eliminate the mismatch so the price
renders identically on server and client at every locale, with a clean console.

## Current state (READ + REPRODUCE first)

- `src/modules/listings/components/ListingCard.tsx` → `PriceBlock` (~L66–82) renders price via
  `formatPrice(displayPrice, activeCurrency, locale)` (and old/per-sqm variants). A separate `originalPriceStr`
  (~L165) hardcodes `new Intl.NumberFormat('en')` — deterministic, likely NOT the culprit; confirm.
- `src/lib/formatters.ts` → `formatPrice(price, currency, locale)` = `new Intl.NumberFormat(locale, {
  maximumFractionDigits: 0 })`. Its doc claims "explicit locale ⇒ SSR/client parity" — so the mismatch means the
  `locale` value (or the runtime's ICU data for it) DIFFERS between server and client for `sq`/`it`.
- **Diagnose which it is:** (a) the `locale` prop threaded into `PriceBlock` differs server vs client; OR (b) the
  Node server lacks full-ICU for `sq`/`it`, so `Intl.NumberFormat` grouping (space vs comma) diverges from the
  browser's full-ICU output. Reproduce on a plain `/sq/listings` load (filters untouched) and read the exact
  hydration-warning text + the two differing strings. A `Tabs`/`CompositeRoot` `id` mismatch was ALSO observed on
  the same page — note whether it is the same root cause or a separate follow-up (do not fix out of scope).

## Pre-read (rule-index → UI + state-authority)

- `docs/agent-contract.md` + `docs/backlog.md` + `docs/critical-flow-registry.md` (listings-display flow).
- `docs/state-authority.md` (SSR vs client authority, hydration determinism); `docs/qa-rules.md`;
  `docs/component-rules.md`; `docs/data-access-rules.md` (if the locale source is a server prop).

## Required after-behavior

- `PriceBlock` renders **byte-identical** price text on server and client at all four locales — no hydration
  warning in the console on `/sq|it/listings` (or anywhere). Prefer a deterministic fix consistent with
  `formatters.ts`'s stated contract: ensure the SAME `locale` reaches both runtimes AND that grouping is
  runtime-independent (e.g. guarantee full-ICU on the server, or pin a deterministic grouping locale, or format
  once on the server and pass the string down — pick per the diagnosed root cause and justify it).
- No visual change to correctly-rendered locales (`en`/`uk` unchanged); currency code handling unchanged.

## Positive flow

1) Load `/sq/listings`. 2) Each card's price renders in Albanian grouping, identical server↔client. 3) Console is
clean (no hydration warning). 4) Repeat `/it`, `/en`, `/uk`, plus the homepage listing cards.

## Negative flow

- **Currency conversion active** (`showConversion`) → converted price + `originalPriceStr` both hydration-stable.
- **Missing/zero price / null area (per-sqm)** → existing empty/`—` behavior unchanged, still hydration-stable.
- **Server lacks ICU for a locale** → the chosen fix still produces identical client output (no English fallback
  leak that then mismatches).

## Regression coverage (clause 15)

Add a test that fails on the mismatch: assert `formatPrice` (and/or a rendered `PriceBlock`) produces the SAME
string under the server-side and client-side locale/ICU conditions for `sq`/`it` (e.g. snapshot the formatted
output for a representative price at each locale and assert equality across the two code paths). Planted violation:
reintroduce a divergent-locale/ICU path → assertion FAILS. Register the fix on the listings-display flow row (add
the row if absent). Do not close without automated proof the price is hydration-stable.

## Acceptance criteria

1. No React hydration mismatch for `PriceBlock` at any locale (console-clean evidence on `/sq` + `/it/listings`).
2. Server and client price strings byte-identical at `en`/`it`/`sq`/`uk`; `en`/`uk` visually unchanged.
3. Root cause identified + stated; fix justified against `state-authority.md` determinism rules.
4. Regression test proves hydration-stable price formatting + planted-violation transcript; registry row updated.
5. Gates: `tsc=0`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`, `check:file-integrity`
   green; Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

The `Tabs`/`CompositeRoot` `id` mismatch (separate follow-up unless proven same root cause); `RangeDatePicker`
calendar localization (Task 562); Task 559 wiring; any listings-query or currency-conversion logic change.
