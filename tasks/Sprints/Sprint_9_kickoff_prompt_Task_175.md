# Kickoff prompt — Task 175 (Sprint 9 — M.1: iliria98.com as the single source of truth for FX rates)

> Note 3 includes a standing rule: "the single source of truth for exchange rates is iliria98.com."
> Today `src/lib/getExchangeRate.ts` scrapes iliria98 for **EUR/ALL only** (`scrapeEurAllRate`) and
> *derives* USD/GBP from a DIFFERENT provider, `open.er-api.com` (`fetchCrossRates`). That undocumented
> second source is the integrity problem. This task makes iliria98 canonical and documents the pipeline.
> No UI changes here. Coordinate the `ExchangeRates` shape with Task 177 (currency catalog).

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope. This task is the RATE PIPELINE + its documentation only — no UI, no selector,
  no admin table, no price/m² display changes (those are Tasks 176/177/178).
- Do NOT invent architecture. If iliria98.com does NOT publish a rate for a currency we need, STOP and
  ask the orchestrator how to handle it — do NOT silently keep open.er-api.com as a hidden source.
- Follow docs/ai-behavior.md (esp. the Global Change Verification Rule) and docs/integrations.md.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-175-iliria98-fx-source.md.
- 0 new lint/typecheck errors; relevant governance PASS.
- Commit + push: SINGLE `git add -A` (no `^`/backtick continuations), then `git log -1`, paste the real
  output. The OWNER runs git — if you cannot run git, output the staged file list + message for the owner.

Pre-read:
- src/lib/getExchangeRate.ts  (scrapeEurAllRate → iliria98; fetchCrossRates → open.er-api.com;
  fetchAllRates derives USD/GBP; ExchangeRates = { EUR; USD; GBP }; unstable_cache 1h; convertPrice())
- src/hooks/useExchangeRate.ts, src/app/api/exchange-rate/route.ts
- docs/integrations.md (external-service rules), docs/env.md

Scope:
1. Make iliria98.com the canonical source for every currency rate the platform shows. Determine which
   currencies iliria98 actually publishes (read the page structure used by scrapeEurAllRate). Two cases:
   (a) iliria98 publishes a full currency table → scrape all of them, keyed to ALL, as the source of truth.
   (b) iliria98 publishes only a subset → keep iliria98 as the canonical pivot; any currency NOT on
       iliria98 must be EITHER dropped from the supported set OR derived via an EXPLICITLY DOCUMENTED
       fallback that pivots through an iliria98 figure. If you reach case (b), STOP and confirm the
       supported-currency set with the orchestrator before coding the fallback.
2. Remove the *silent* dependency on open.er-api.com as a co-equal source of truth. Either delete it or
   demote it to a clearly-labelled, documented fallback only (with a comment + integrations.md entry).
3. Keep `convertPrice()` and the 1-hour cache contract intact (Task 176/Card consumers depend on them).
   If `ExchangeRates` must grow beyond { EUR, USD, GBP } for Task 177, design it as an extensible
   record (e.g. Record<CurrencyCode, number>) but DO NOT wire new currencies into UI here.
4. Document the final pipeline in docs/integrations.md: canonical source (iliria98.com), what is scraped
   vs derived, cache TTL, and the fallback policy.

Acceptance criteria:
- iliria98.com is the documented canonical rate source; any derived rate is explicitly labelled and
  pivots through an iliria98 value; no undocumented second source remains.
- The exchange-rate API route + useExchangeRate still return valid rates (manually verify the route
  responds with the expected shape).
- docs/integrations.md updated with the rate-source contract; backlog + session log updated.
- 0 new lint/typecheck errors; npm run build passes.

Out of scope:
- Any UI/selector change (Task 178), admin currency table (Task 177), price/m² display (Task 176).
- Adding new dependencies or a paid FX API.
```
