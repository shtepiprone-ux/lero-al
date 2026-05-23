# Kickoff prompt — Task 177 (Sprint 9 — M.3: admin Currency table from iliria98.com; one catalog everywhere)

> Note 32: add all iliria98.com currencies into the admin Currency table so they can be chosen in the
> currency comboboxes everywhere (filters, exchange-rate math, cabinet, admin). The admin currency
> surface already exists: `src/app/admin/currency/page.tsx`, `AdminCurrencyTabs.tsx`,
> `AdminExchangeProvidersManager.tsx`, `src/modules/admin/actions/exchangeProviders.ts`,
> `src/modules/currency/hooks/useCurrencies.ts`. The goal is ONE currency catalog consumed by every
> selector — kill the per-surface hardcoded 2/3-currency arrays. Blocked-by Task 175 (canonical source);
> blocks Task 178 (selector consumes this catalog).

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: admin currency CRUD + a single currency-catalog source. NOT the selector control
  swap (Task 178) and NOT conversion math (Task 175/176) beyond consuming the catalog.
- Do NOT invent architecture. Use the §11 canonical admin-table pattern (docs/component-governance.md).
- Any DB schema/seed needed: the OWNER runs SQL (single-writer-SQL rule). Provide idempotent SQL in the
  session log; update src/types/database.ts AND scripts INTERFACE_TABLE_MAP (schema-drift, Sprint 8) for
  any new/changed table. If you are unsure whether a currency table exists vs needs creating, STOP and ask.
- Global Change Verification Rule: after introducing the single catalog, remove EVERY hardcoded
  per-surface currency array (grep) and point it at the catalog.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-177-currency-catalog.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/app/admin/currency/page.tsx, src/components/admin/AdminCurrencyTabs.tsx,
  src/components/admin/AdminExchangeProvidersManager.tsx, src/modules/admin/actions/exchangeProviders.ts
- src/modules/currency/hooks/useCurrencies.ts, src/lib/getExchangeRate.ts (ExchangeRates shape post-175)
- docs/component-governance.md §11, docs/data-access-rules.md, docs/rls-rules.md, docs/integrations.md

Scope:
1. Ensure a currency catalog (table or canonical config) holds every currency iliria98.com publishes
   (coordinate the set with Task 175). Admins manage it via the §11 admin pattern (row click → Dialog,
   no Actions column). Include code + display name + (where relevant) the iliria98 rate linkage.
2. Expose ONE catalog source (extend `useCurrencies` / a query) that every currency picker consumes:
   public filters, advanced-filters drawer, cabinet preferred currency, admin. No surface keeps its own
   2/3-currency literal array.
3. Currency CODES are domain identifiers — render literally, never via t() (docs/ai-behavior.md). Use
   t('currency_<CODE>') ONLY for full display names, never to render the code alone.

Acceptance criteria:
- Admin Currency table lists all iliria98 currencies, managed via §11; localized labels × 4.
- A single catalog source is the only place currencies are enumerated; grep finds no remaining hardcoded
  per-surface currency arrays.
- Idempotent SQL (if any) in the session log; database.ts + schema-drift map updated for new tables/cols.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- Swapping selector controls to Combobox (Task 178 — but it consumes this catalog); conversion math.
```
