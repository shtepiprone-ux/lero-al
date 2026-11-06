# Epic M — kickoff prompts (follow-up: full multi-currency conversion)

> Tasks 175–178 shipped in Sprint 9 (their kickoffs are the Sprint 9 individual files). Epic M is
> **REOPENED** for two follow-ups found 2026-05-23: (a) homepage currency conversion only uses EUR, and
> (b) an admin-added currency that exists on iliria98.com must become usable for conversion everywhere.
> Shared hard contract: no scope change; no invented architecture (STOP & ask if ambiguous); literal AC;
> update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors; governance PASS; locale parity
> sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global Change Verification Rule;
> commit + single `git add -A` then `git log -1` (owner runs git/SQL).

## Task 214 — M.5 — Dynamic FX engine over the currency catalog (iliria98 for every active currency)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). This is the DATA/ENGINE layer only — not the card wiring (Task 215). Source of
truth stays iliria98.com (Task 175). No hardcoded currency list, no hardcoded cross-ratios. If a currency
the admin enabled is NOT published on iliria98, do NOT silently fake a rate — STOP and ask the orchestrator
for the derivation/exclusion policy.

Pre-read:
- src/lib/getExchangeRate.ts (ExchangeRates = fixed {EUR,USD,GBP}; scrapeIliria98Rates(['EUR','USD','GBP'])
  HARDCODED list; ALL_RATE_BOUNDS; convertPrice; unstable_cache)
- src/app/api/exchange-rate/route.ts, src/hooks/useExchangeRate.ts
- src/modules/currency/hooks/useCurrencies.ts + the currencies catalog/table (Task 177),
  src/components/admin/AdminCurrenciesManager.tsx, src/modules/admin/actions/exchangeProviders.ts
- Task 175 + 177 session logs; docs/integrations.md ("Exchange Rate Pipeline")

Scope:
1. Make `ExchangeRates` extensible — a record keyed by currency code (ALL per 1 unit of each foreign code;
   ALL is the implicit pivot = 1). Keep `convertPrice(price, from, to, rates)` generic over any pair.
2. Drive the iliria98 scrape from the ACTIVE currency catalog (read active codes from the catalog/DB),
   not a hardcoded list. EUR/ALL remains the mandatory pivot; abort to null only if EUR/ALL is missing.
3. Admin-added currency: when an admin enables a currency in the catalog AND iliria98 publishes it, its
   rate is scraped and served automatically (no code change per currency). If iliria98 does NOT publish
   it, surface that deterministically (e.g. the catalog flags it / it's excluded from `rates`) — never a
   faked/derived hardcode. Decide+document the policy; STOP & ask if the derivation question is ambiguous.
4. Preserve the cache contract (1h). Update docs/integrations.md (catalog-driven scrape + the
   "not on iliria98" policy). If a DB read is needed inside the rate fetch, keep it within the existing
   Supabase client usage — no new deps.

Acceptance criteria:
- `rates` covers every active catalog currency sourced from iliria98 (EUR pivot); no hardcoded currency
  list and no hardcoded cross-ratios anywhere in the FX layer (grep `1.08`/`0.86`).
- Enabling a currency in admin that exists on iliria98 makes it convertible service-wide with no further
  code change; a currency not on iliria98 is handled per the documented policy (not faked).
- `/api/exchange-rate` + `useExchangeRate` return the full map; cache contract intact; integrations.md updated.
- 0 new lint/typecheck errors; npm run build passes; backlog + session log updated.

Out of scope: card/homepage wiring (Task 215); admin table UI beyond any "not on iliria98" flag.
```

## Task 215 — M.6 — Multi-currency conversion on every card surface (fix homepage EUR-only)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Depends on Task 214 (full `rates` map). Global Change Verification Rule: fix
EVERY card surface, not just the homepage. If the homepage cards are Server Components that can't react to
a client-side drawer currency change, STOP and ask the orchestrator which mechanism to use (URL param vs a
client currency context) — do NOT invent one silently.

Pre-read:
- src/components/shared/useHomepageFilters.ts (line ~34 `const { rate } = useExchangeRate()` — EUR-ONLY)
- src/modules/listings/components/ListingCard.tsx (effectiveRates fallback ~113-114 hardcodes /1.08, /0.86;
  displayCurrency/rates props; convertPriceMulti)
- homepage card sections that pass NO displayCurrency/rates: FeaturedListings.tsx, LatestListings.tsx,
  SimilarListings.tsx, RecentlyViewedGrid.tsx
- reference (already correct): ListingsShell.tsx (`displayCurrency` from `searchParams.get('currency')` +
  `rates`), FavoritesShell.tsx
- src/hooks/useExchangeRate.ts (`rates` map vs legacy `rate`), the homepage page + FiltersPanel currency

Scope:
1. Replace EUR-only `rate` with the multi-currency `rates` map wherever conversion/price preview happens
   (useHomepageFilters line 34 + any homepage price logic).
2. Thread `displayCurrency` + `rates` into ALL card surfaces currently missing them (Featured, Latest,
   Similar, RecentlyViewed) so conversion works for EVERY active currency, not just EUR.
3. Make the homepage drawer currency selection actually drive the displayed card currency (per the
   architecture decision from the STOP-and-ask above).
4. Remove ListingCard's hardcoded `/1.08`,`/0.86` fallback (line ~114); rely on the real `rates` from
   Task 214. Keep per-m² currency-consistent (Tasks 176 + 213).

Acceptance criteria:
- Changing currency on the homepage drawer (and listings + favorites) converts EVERY card to the chosen
  currency using real iliria98 rates for every active currency — verified for a non-EUR currency (e.g. USD,
  and an admin-added one if available).
- No hardcoded FX ratios remain anywhere (grep `1.08`/`0.86`); all surfaces use the `rates` map.
- Per-m² stays consistent with the displayed currency (no 176/213 regression).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: the FX engine itself (Task 214); price-range FILTER semantics (currency as a filter value).
```

## Orchestrator review verdicts (2026-05-23, Opus 4.7)

Reviewed against the working tree (read-only), not the executor reports. Independent `tsc --noEmit` = 0 errors.

### Task 214 — M.5 — **APPROVED**
- `ExchangeRates` is now `Record<string, number>` (extensible); `convertPrice` generic over any pair via the ALL pivot.
- Scrape is catalog-driven: `getActiveCurrencyCodes()` reads `currencies` (is_active, ≠ ALL) from the DB; `FALLBACK_CODES` only on DB failure. EUR/ALL pivot mandatory — aborts to `null` if missing (`getExchangeRate.ts:137,164`).
- No hardcoded currency list and no hardcoded cross-ratios — `grep 1.08/0.86` clean across `src/`.
- `/api/exchange-rate` + `useExchangeRate` return the full map (with backward-compat `rate: rates?.EUR`); cache contract intact (route `revalidate=3600`, hook singleton 1h TTL). `integrations.md` "Exchange Rate Pipeline" updated; session log + backlog updated.
- **Ratified deviation:** the kickoff said "STOP & ask" for the not-on-iliria98 derivation policy. Sonnet decided (per scope's "decide+document" latitude) to derive via the **open.er-api cross-rate** that was already the approved Task 175 USD/GBP fallback, and to silently exclude a currency only if that also fails (never a faked/hardcoded rate). No NEW external source was introduced. **Orchestrator ratifies this policy** — it is documented and architecturally consistent.

### Task 215 — M.6 — **APPROVED (data-correctness); one product decision pending owner**
- `useHomepageFilters` + `FiltersPanel` now use the multi `rates` map; the drawer exchange-rate hint reads `rates?.[currency]` — the literal reported bug ("conversion only from EUR") is fixed for every active currency.
- `displayCurrency` + `rates` threaded into **all** card surfaces (Featured, Latest, Similar, RecentlyViewed); reference shells (Listings/Favorites) unregressed; all 6 `ListingCard` callers covered; old `exchangeRate` prop fully removed; ListingCard hardcoded `/1.08`,`/0.86` fallback gone (`ListingCard.tsx:110`).
- Per-m² uses converted `displayPrice` + `activeCurrency` (no Task 176 regression). Locale parity OK (`exchange_rate` in sq/en/uk/it).
- **Open product fork (Sonnet bypassed the STOP-and-ask on a technicality):** scope item 3 asked for "the homepage **drawer** currency to drive the displayed card currency." Sonnet instead set homepage card currency = `user.preferred_currency` (guests → `ALL`) and treats the drawer currency as a navigation filter (→ `/listings?currency=X`), arguing the STOP only applied to Server Components. The data bug is fixed either way; whether the homepage cards should *live-react* to the drawer is a UX decision deferred to the owner. If "yes," open a small follow-up to lift drawer currency into the homepage card sections.
  - **Owner decision (2026-05-23): current behavior is intended** — homepage cards = profile currency; drawer = filter → /listings. No follow-up. **Task 215 fully APPROVED; Epic M closed (175 · 176 · 177 · 178 · 214 · 215).**
