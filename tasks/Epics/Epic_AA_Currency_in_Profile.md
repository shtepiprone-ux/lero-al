# Epic AA — Currency in Profile (M.7 follow-up)

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator. Direct follow-up to Epic M
(Currency & Exchange-Rate Integrity) — closed 2026-05-23 with Tasks 175–178, 214–215.
**Source notes:** `issues.txt` 2026-05-25 — #98 (move the currency picker from the homepage /
`/listings` filter panels into the user profile; verify that after switching currency every listing
price across the project shows correctly using the iliria98.com source-of-truth rate and in the
selected currency; verify per-m² price likewise uses the user-selected currency with the same
rate; in the profile show a "приблизно" / ~ indicator next to the rate and a note that the rate
is from iliria98.com and may differ from the final price).
**Kickoffs:** `Epic_AA_kickoff_prompts.md` (Task 241).

> Epic M established iliria98.com as the canonical FX source (Task 175) and made the cards
> multi-currency aware (Task 215). This Epic moves the user-facing currency selector OUT of the
> filter UI (where it never made sense — it is a display preference, not a filter) and INTO the
> user profile, where it canonically lives.

## Goal

The user's preferred display currency lives ONLY in the user profile (cabinet → Profile tab). It
applies globally on every page that renders a price. The currency selector is removed from the
homepage filter drawer (`FiltersPanel`) and the `/listings` filter bar / drawer (`ListingsFilters`,
`ListingsFilterBar`). The profile clearly communicates that the FX rate is approximate and sourced
from iliria98.com.

## Dependencies

- Epic M closure: Tasks 175 (iliria98.com canonical source), 176 (price-per-m² currency fix), 177
  (single currency catalog + admin manager), 178 (currency selector → canonical Combobox), 214
  (dynamic FX engine), 215 (multi-currency cards).
- `users.preferred_currency` column + Task 216 (catalog-driven `preferred_currency` — already
  shipped on 2026-05-23). The Currency selector in `ProfileTab.tsx` is the canonical UI entry
  point for the preference.
- `useHomepageFilters.ts`, `FiltersPanel.tsx`, `ListingsFilters.tsx`, `ListingsFilterBar.tsx`
  (current sites of the to-be-removed currency picker).
- The card/detail price components (`ListingCard.tsx`, `PriceBlock.tsx` from Task 213, listing
  detail price block, the per-m² lines from Task 176).

## Tasks

### Task 241 — AA.1 — Currency selector → profile (with iliria98.com note); remove from filters

**Type:** feature + refactor
**Priority:** high
**Area:** cabinet ProfileTab + homepage filter drawer + `/listings` filter UI + every price-rendering
component

**Pre-read:** Epic M session logs (Tasks 175–178, 214–215); Task 213 session log (`PriceBlock`
unification); Task 216 session log (catalog-driven `preferred_currency`); `docs/ai-behavior.md`
Note 14 (Global Change Verification — every price-rendering site must be verified); `docs/ui-
rules.md`; `docs/state-authority.md` (preferred currency is server-authoritative once persisted);
`src/modules/cabinet/components/ProfileTab.tsx`; `src/modules/filters/components/FiltersPanel.tsx`;
`src/modules/listings/components/ListingsFilters.tsx`, `ListingsFilterBar.tsx`;
`src/lib/formatters.ts`; the FX engine modules from Task 214.
**Localization coverage:** sq, en, uk, it — the "approximate rate / source: iliria98.com" note,
plus any new helper labels × 4.
**Responsive coverage:** all 7 breakpoints.

**Goal:**

1. **Remove the currency picker from filter UI.** Delete the currency Combobox from
   `FiltersPanel.tsx`, `ListingsFilters.tsx`, and `ListingsFilterBar.tsx` (and any sibling that
   exposes it). The active currency for display is always `users.preferred_currency`
   (or the guest default — confirm with the owner; today the catalog default is `ALL`).
2. **Profile is the canonical selector.** Keep the existing `CurrencySelector` in
   `ProfileTab.tsx`. Next to the selector — or directly beneath it — show:
   - The current rate for the selected currency vs `ALL`, prefixed with "≈" (or the localized
     "приблизно" word — i18n × 4).
   - A short note (i18n × 4): "Курс взято з iliria98.com і може відрізнятись від фінальної
     ціни оголошення" (sq/en/uk/it).
3. **Global price reactivity.** Every component that renders a price (cards, listing detail,
   per-m², recently viewed, favorites, search results) reads from the unified currency-resolved
   value. After the user changes `preferred_currency` in the profile, EVERY price across the
   project shows in the selected currency on the next render — no manual reload. (Per Task 215
   the cards are already wired; verify per-m² is wired across all variants — Task 213 fixed the
   list view; confirm it still holds.)
4. **No regressions.** A guest user, or a user who hasn't set a preference, still sees prices
   exactly as today (default catalog currency). Saved filters / saved searches do not carry a
   currency anymore (was never a real filter dimension); removing the URL key is allowed only
   if it does not break any persisted saved-search row (check the schema before deleting; STOP
   and ask if any persistence path uses the URL currency).

**Acceptance criteria:**
- The currency Combobox is gone from the homepage drawer and from `/listings`; grep proves no
  remaining "currency selector" controls in those components.
- The profile shows the rate next to / under the selector with the "≈" prefix and the
  iliria98.com note (i18n × 4).
- Switching the profile currency immediately reflects across cards, listing detail, per-m²,
  recently viewed, favorites — verified at runtime in `uk` (UX-flow trace in the session log per
  Note 19).
- No regressions in saved searches or any other persisted state (verified explicitly in the
  session log; if anything persisted the currency, the migration is documented and coordinated
  with the owner per the single-writer SQL rule).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** changing the FX provider (Epic M decision is final — iliria98.com); changing
the catalog of supported currencies (admin manager from Task 177); guest vs auth defaults beyond
the "no preference → catalog default" rule already in place.

## Epic-level acceptance

Currency selector lives only in the profile; every price across the project reflects the
selected currency immediately and consistently; the profile communicates the approximation +
source clearly; no currency control remains in any filter UI.
