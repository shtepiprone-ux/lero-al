# Epic M — Currency & Exchange-Rate Integrity

**Status:** REOPENED 2026-05-23 — Tasks 175–178 ✅ (Sprint 9); follow-ups **M.5 (214) + M.6 (215)** added after the owner found homepage conversion is EUR-only and requested admin-added iliria98 currencies to work service-wide. Kickoffs: `Epic_M_kickoff_prompts.md`.
**Source notes:** issues.txt #3 (price & price/m² wrong currency), #32 (all iliria98.com currencies in admin), #5 (advanced-filters drawer shows only 2 currencies), #21 (currency selector must be Combobox, not buttons).
**Kickoffs:** all four tasks are scheduled in **Sprint 9** (the critical-data batch) — individual kickoff files `Sprint_9_kickoff_prompt_Task_175..178.md`.

> **Single source of truth (Note 3, REMEMBER):** the authoritative currency-rate source for the
> Albanian market is **iliria98.com**. Today `src/lib/getExchangeRate.ts` scrapes iliria98 for
> **EUR/ALL only** and *derives* USD/GBP from a different provider (`open.er-api.com` ECB cross-rates).
> That split is the root of the inconsistency in Note 3 and must be reconciled to iliria98 as the
> canonical source.

## Goal

Make every price the platform shows correct and consistent: one rate source (iliria98.com), correct
price-per-m² in the displayed currency, the full currency set available everywhere, and a single
canonical `Combobox` for choosing currency (no button rows, no 2-currency drawers).

## Dependencies

- Builds on the existing FX layer: `src/lib/getExchangeRate.ts`, `src/hooks/useExchangeRate.ts`,
  `src/app/api/exchange-rate/route.ts`, `src/modules/currency/hooks/useCurrencies.ts`.
- Admin currency surface already exists: `src/app/admin/currency/page.tsx`,
  `src/components/admin/AdminCurrencyTabs.tsx`, `src/components/admin/AdminExchangeProvidersManager.tsx`,
  `src/modules/admin/actions/exchangeProviders.ts`.
- M.2 (price/m² display fix) depends on M.1 (rate source confirmed) only insofar as the rate must be
  trustworthy; the m² unit/label bug itself is independent and can ship in parallel.
- M.4 (Combobox selector) depends on M.3 (full currency list available to populate it).

## Tasks

### Task 175 — M.1 — iliria98.com as the single source of truth for FX rates

**Type:** refactor / data-integrity
**Priority:** critical
**Area:** `src/lib/getExchangeRate.ts`, `src/app/api/exchange-rate/route.ts`

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/integrations.md (external-service rules), docs/data-access-rules.md
4. `src/lib/getExchangeRate.ts`, `src/hooks/useExchangeRate.ts`, `src/app/api/exchange-rate/route.ts`

**Localization coverage:** N/A (no user-visible text changes; rates are numeric).
**Responsive coverage:** N/A.

**Goal:** Make iliria98.com the canonical rate source for ALL currencies the platform supports, not
only EUR. Decide and document one of: (a) scrape every currency iliria98 publishes; (b) if iliria98
only publishes a subset, document precisely which currencies are iliria98-sourced vs derived, and the
derivation rule — with iliria98 as the pivot. Remove the silent dependency on `open.er-api.com` as an
undocumented second source of truth, or demote it to an explicitly-documented fallback.

**Acceptance criteria:**
- One documented, deterministic rate pipeline with iliria98.com as the canonical source; any derived
  rate is explicitly labelled and pivots through an iliria98 figure.
- `ExchangeRates` type + cache contract updated to whatever currency set M.3 needs (coordinate).
- Behaviour documented in docs/integrations.md (rate source, cache TTL, fallback policy).
- 0 new lint/typecheck errors; `npm run build` passes; backlog + session log updated.

**Out of scope:** UI/selector changes (M.4); admin table population (M.3); the m² display bug (M.2).

### Task 176 — M.2 — Fix price & price-per-m² display (currency/unit mismatch)

**Type:** bug
**Priority:** critical
**Area:** listing detail price block + listing card price block

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (esp. **Global Change Verification Rule**)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/ui-rules.md, docs/state-authority.md
4. `src/app/[locale]/listings/[slug]/page.tsx` (lines ~253, ~262–269, ~383–390),
   `src/lib/getExchangeRate.ts` (`convertPrice`), `src/lib/formatters.ts` (`formatPrice`),
   `src/modules/listings/components/ListingCard.tsx` (uses `convertPrice as convertPriceMulti`),
   `src/modules/listings/components/ListingContact.tsx`

**Localization coverage:** sq, en, uk, it (price labels / `per_sqm` key already exist — verify all four).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Fix the observed bug — listing priced `88,000,000 ALL` shows price-per-m² as `352,000 EUR`
(value computed in ALL but labelled with the display currency). Root cause: in `page.tsx`,
`pricePerSqm = Math.round(listing.price / area_gross)` is computed in the **original** currency, then
rendered with `displayCurrencyCode` (the converted code). The per-m² figure must be derived from the
**displayed** price and labelled with the **displayed** currency. Apply the SAME fix to every place
that shows price-per-m² (ListingCard, detail, anywhere else — Global Change Verification Rule).

**Acceptance criteria:**
- Price and price-per-m² always use the same currency: value and label match in every state
  (guest, ALL default, switched to EUR/USD/GBP, authenticated preferred currency).
- Per-m² derived from the displayed/converted price (`displayPrice / area_gross`), not the raw price.
- Verified on detail page AND listing cards AND contact card; no other price surface left diverging.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales render; all 7 breakpoints OK.

**Out of scope:** changing the rate source (M.1); the selector UI (M.4).

### Task 177 — M.3 — Populate admin Currency table from iliria98.com; selectable everywhere

**Type:** feature
**Priority:** high
**Area:** admin currency surface + currency data layer

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/data-access-rules.md, docs/component-governance.md §11 (admin table pattern), docs/integrations.md
4. `src/app/admin/currency/page.tsx`, `src/components/admin/AdminCurrencyTabs.tsx`,
   `src/components/admin/AdminExchangeProvidersManager.tsx`, `src/modules/admin/actions/exchangeProviders.ts`,
   `src/modules/currency/hooks/useCurrencies.ts`

**Localization coverage:** sq, en, uk, it (any new admin labels / currency display names).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (admin table + any new dialog).

**Goal:** Add every currency iliria98.com publishes to the admin Currency table so admins can manage
them, and expose that list as the single currency catalog consumed by every currency picker (public
filters, advanced-filters drawer, cabinet preferred currency, admin). One catalog → all comboboxes.

**Acceptance criteria:**
- Admin Currency table lists all iliria98 currencies; managed via the §11 canonical admin pattern.
- A single currency-catalog source (hook/query) consumed by every selector — no per-surface hardcoded
  2/3-currency arrays remain anywhere (grep to prove).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the conversion math (M.1/M.2); replacing the selector control itself (M.4 — but M.4
consumes this catalog).

### Task 178 — M.4 — Currency selector = canonical Combobox everywhere (Notes 5, 21)

**Type:** UX / refactor
**Priority:** high
**Area:** every currency selector (public filters, advanced-filters drawer, cabinet, admin)

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/ui-rules.md **§0** (Combobox single-source), docs/component-governance.md
4. `src/components/shared/Combobox.tsx` (canonical primitive — `variant` prop),
   `src/components/shared/FiltersPanel.tsx` (advanced-filters drawer — only 2 currencies today),
   `src/modules/listings/components/ListingsFilters.tsx`, `src/modules/cabinet/components/ProfileTab.tsx`,
   `src/components/layout/Header.tsx`

**Localization coverage:** sq, en, uk, it (selector labels; currency CODES are never translated — see
docs/ai-behavior.md i18n rules).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Replace every button-based currency selector with the canonical `Combobox`, fed by the M.3
currency catalog. The advanced-filters drawer must show the full currency list (not 2). Currency codes
render as literal strings; never passed through `t()`.

**Acceptance criteria:**
- All currency selection is the canonical `Combobox` (correct `variant`); zero currency button-rows
  remain (grep to prove).
- Advanced-filters drawer shows the full currency catalog from M.3.
- Currency excluded from active-filter badge counts (existing rule — do not regress).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** conversion math (M.1/M.2); admin table data (M.3).

### Task 214 — M.5 — Dynamic FX engine over the currency catalog (REOPEN, found 2026-05-23)

**Type:** refactor / feature (data layer)
**Priority:** high
**Area:** `src/lib/getExchangeRate.ts`, exchange-rate API/hook, currency catalog

**Pre-read:** `getExchangeRate.ts` (fixed `{EUR,USD,GBP}`, hardcoded scrape list), `useCurrencies` catalog,
admin currency actions; Task 175/177 session logs; docs/integrations.md.
**Localization:** N/A (numeric). **Responsive:** N/A.

**Goal:** Make `ExchangeRates` an extensible record keyed by currency code; scrape iliria98 for every
ACTIVE catalog currency (no hardcoded list, no hardcoded cross-ratios). An admin-added currency that
iliria98 publishes becomes convertible service-wide automatically; one not on iliria98 is handled per a
documented policy (never faked). iliria98 stays the single source (Task 175). STOP & ask on derivation
ambiguity. Kickoff in `Epic_M_kickoff_prompts.md`.

**Acceptance criteria:** `rates` covers all active catalog currencies from iliria98; no hardcoded
list/ratios (grep `1.08`/`0.86`); admin-enable → convertible with no per-currency code; cache intact;
integrations.md updated.

### Task 215 — M.6 — Multi-currency conversion on every card surface (fix homepage EUR-only)

**Type:** bug
**Priority:** high
**Area:** `ListingCard` + all card surfaces (homepage especially)
**Dependencies:** Task 214 (full rates map)

**Pre-read:** `useHomepageFilters.ts` (line ~34 uses EUR-only `rate`), `ListingCard.tsx` (hardcoded
`/1.08`,`/0.86` fallback ~114; displayCurrency/rates props), `FeaturedListings`/`LatestListings`/
`SimilarListings`/`RecentlyViewedGrid` (pass no displayCurrency/rates), `ListingsShell` (reference),
`useExchangeRate` (`rates` vs `rate`).
**Localization:** sq, en, uk, it. **Responsive:** all 7 breakpoints.

**Goal:** Every card surface converts to the chosen display currency via the multi-currency `rates` map
(not the EUR-only `rate`). Fix the homepage so changing currency in the drawer converts all cards for any
active currency. Remove the hardcoded `/1.08`,`/0.86` fallback. If homepage cards are Server Components
that can't react to the client drawer, STOP & ask the orchestrator for the mechanism (URL vs context).
Kickoff in `Epic_M_kickoff_prompts.md`.

**Acceptance criteria:** changing currency converts every card for every active currency (verified for a
non-EUR currency); no hardcoded FX ratios remain; per-m² stays currency-consistent (Tasks 176/213);
4 locales; 7 breakpoints.

## Epic-level acceptance

iliria98.com is the documented single rate source; price and price/m² agree on currency everywhere;
the full currency catalog is admin-managed and consumed by one canonical `Combobox` across the app;
conversion works for **every active currency** (incl. admin-added iliria98 currencies) on **every**
card surface — not just EUR.
