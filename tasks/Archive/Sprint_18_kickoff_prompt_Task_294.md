# Sprint 18 — Task 294 kickoff (Global multi-select filters + correct active-filter counter)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them in PowerShell).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **mixed UI + state + admin-table** task — pre-read: UI bundle (`ui-rules.md`, `component-rules.md`, `qa-rules.md`) + `docs/state-authority.md` (URL = single source of truth) + `docs/ai-behavior.md` Note 22 (Admin Table Preservation) + the Filter Architecture Anti-Patterns sections in `ai-behavior.md`. No scope change; STOP & ASK if ambiguous; literal AC; self-validate (Note 18).

> **This is a GLOBAL filter-architecture task, not a one-drawer fix.** The canonical engine is
> `src/modules/listings/domain/filterEngine.ts`. Do NOT add a second counting/parsing path —
> extend the canonical one.

---

```
Type:        feature / refactor / UX fix
Priority:    HIGH
Area:        filters / listings / admin / state management / design-system chips
```

## Why this task exists — measured root cause (confirmed in code 2026-05-29)

The owner observed inconsistent filter behavior + a wrong active-filter badge. Confirmed in
`src/modules/listings/domain/filterEngine.ts`:

- The canonical `ParsedFilters` type makes some groups **arrays** (multi-select) and others
  **scalars** (single-select), inconsistently:
  - Arrays today: `rooms: number[]`, `layoutFeatures: string[]`, `purchaseConditions: string[]`.
  - **Scalars today (the bug):** `condition: string` (Стан), `offerType: string` (Тип пропозиції),
    `heating: string`, `wallType: string`, `marketType: string`.
- `countActiveFilters()` (L344) counts **each array as 1 per section**
  (`filters.rooms.length > 0 ? 1 : undefined`, same for `layoutFeatures`, `purchaseConditions`) and
  each scalar as 1 — so selecting 3 purchase conditions counts as **1**, not 3. That is the wrong badge.
- Array URL encoding is **comma-separated** (`rawMulti()` at L98 splits on `,`). This is the
  project's existing convention — REUSE it; do NOT introduce repeated-param encoding.
- `applyListingFilters()` (L191) is the Supabase mapping; multi-value groups must use `.in(...)`
  (OR within a group), scalars currently use `.eq(...)`.

So this task: (A) make the logically-multi groups arrays, (B) fix counting to be **per selected
value**, (C) keep comma-encoding + back-compat parsing, (D) fix the Supabase mapping to `.in()` for
the newly-array groups, (E) propagate to every consumer (home batch + listings URL-immediate +
admin + API routes + cron saved-searches), (F) make the chip UI multi-select everywhere.

## Canonical decisions (orchestrator-set — implement these, do not re-litigate)

1. **Convert to arrays (multi-select):** `condition` → `conditions: string[]`,
   `offerType` → `offerTypes: string[]`. ALSO evaluate `heating`, `wallType`, `marketType`:
   `heating` and `wallType` are "acceptable-values" sets → make them arrays
   (`heatingTypes: string[]`, `wallTypes: string[]`). `marketType` (primary/secondary) — if product
   logic treats both as selectable acceptable values, make it `marketTypes: string[]`; if it is a
   mutually-exclusive mode, keep scalar AND document the reason in the session log. STOP & ASK only
   if the data model makes an array impossible.
2. **Keep single-select (document each in the log):** `sort`, `listingType` (sale/rent mode),
   `propertyType` (drives the schema/visibility — single), `tab` (active/closed), `currency`,
   `page`, `locationId` (single location), `isPremium` (boolean toggle).
3. **Counting rule (canonical, applied everywhere via `countActiveFilters`):**
   - array → `+ array.length` (each selected value counts);
   - scalar string → `+1` iff non-empty and not the default;
   - boolean → `+1` iff true;
   - range → **min counts +1 if filled & valid; max counts +1 if filled & valid** (a both-filled
     range = 2). This is the project's existing per-bound behavior (price/area/floor each count both
     bounds today) — keep it and document it as the canonical range rule.
   - empty array / empty string / undefined / null / default / hidden-inactive (a value for a filter
     section not visible for the current `propertyType` per `getFilterVisibility`) → 0.
4. **URL encoding:** comma-separated arrays (existing `rawMulti`). Parser must accept old single-value
   URLs (`condition=good`) as a 1-element array (back-compat — no shared URL breaks).
5. **Backend semantics:** OR inside a group (`.in(column, values)` / array-overlap for array
   columns), AND across groups (chained query). Do NOT require a listing to match ALL selected
   values within one group.

## Scope of surfaces (global — cover ALL; inventory each in the session log)

Canonical engine + its consumers (from grep 2026-05-29):
- `src/modules/listings/domain/filterEngine.ts` — `ParsedFilters`, `parseSearchParams`,
  `applyListingFilters`, `countActiveFilters`, `getFilterVisibility`.
- `src/modules/listings/domain/filterEngine.test.ts` — extend tests (counting + parsing + back-compat).
- Adapters: `src/modules/listings/hooks/useListingsUrlFilters.ts` (URL-immediate),
  `src/components/shared/useHomepageFilters.ts` (homepage batch + Apply).
- Chip/primitive UI: `src/components/shared/FilterMultiToggle.tsx`,
  `FilterToggleGroup.tsx`, `FilterRoomsRow.tsx`, `FilterRangeInputs.tsx`, `FiltersPanel.tsx`
  (homepage drawer — NOTE: Task 282 converts its overlay to `Sheet`; build on the post-282 tree),
  `src/modules/listings/components/ListingsFilters.tsx`, `ListingsFilterBar.tsx`,
  `ActiveFilterChips.tsx` (chip removal must remove ONE value, not the whole group),
  `FavoritesTypeFilter.tsx`.
- Pages/routes/server: `src/app/[locale]/listings/page.tsx`, `src/app/api/listings/route.ts`,
  `src/app/api/cron/saved-searches/route.ts` (saved-search matching MUST use the same parser/mapping).
- **Admin filters:** grep admin tables for filter chips/selects used as filters (listings/users/
  reports/support/requests). Apply the SAME canonical count model + multi-select where logical.
  Note 22: inventory each admin table (columns, row click, row actions, inline controls, filters,
  search, pagination, sort, empty/loading, mobile) BEFORE; prove every action still reachable AFTER.

## Positive flow (happy path)
Actor: visitor on `/[locale]/listings` (and homepage drawer). 
1. Open advanced filters (Sheet on mobile / panel on desktop).
2. In «Стан» click "Нова будівля" then "Хороший стан" → BOTH chips active (multi-select).
3. In «Умови купівлі» select 3 options → all 3 active.
4. Active badge shows **5** (2 + 3) plus any other active values (e.g. a filled price-min = +1).
5. Apply → drawer closes after state commit → URL has `conditions=new,good&purchaseConditions=...`.
6. Results show listings where (condition ∈ {new,good}) AND (purchase ⊇ any selected) AND other groups.
7. Refresh / share URL / back-forward → identical selections + identical badge restored.

## Negative flow (implement + verify each)
- **Deselect:** clicking an active chip removes ONLY that value; badge decrements by 1; other chips stay.
- **Reset «Скинути»:** clears every array + scalar + range + URL params; badge → 0; all chips inactive; no hidden stale value remains active.
- **Empty/partial range:** min only → +1; max only → +1; both → +2; cleared → 0.
- **Hidden section:** selecting values then switching `propertyType` so a section is no longer visible → those hidden values must NOT count and must be cleared (existing `handlePropertyTypeChange` rule — preserve it).
- **Invalid URL value:** unknown enum value in URL → dropped by the existing allowlist (no 22P02), not counted.
- **Back-compat URL:** old `condition=good` (singular) parses to `['good']`, badge = 1.
- **Mobile 320/375/390 `uk`:** chips wrap, no horizontal overflow, no ellipsis truncation of translated labels, 44px touch targets.
- **Admin:** multi-select status/type filters update the table; pagination/search/sort/row-actions still work; badge correct.

## Required investigation (PASTE in the session log) — the owner-supplied matrix
Fill this table for EVERY filter surface before editing:

| Area | File/component/hook | Current type | Current selection model | Should be multi-select? | Current count behavior | Required change |
|---|---|---|---|---|---|---|

Plus run (PowerShell/Git Bash):
```
grep -rn "countActiveFilters\|parseSearchParams\|applyListingFilters\|getFilterVisibility" src
grep -rn "condition\|offerType\|purchaseConditions\|layoutFeatures\|marketType\|heating\|wallType" src/modules/listings/domain
grep -rn "FilterMultiToggle\|FilterToggleGroup\|ActiveFilterChips\|FiltersPanel\|ListingsFilters" src
grep -rn "\.eq(\|\.in(\|\.overlaps(\|\.contains(" src/modules/listings/domain/filterEngine.ts
# admin filter inventory:
grep -rn "filter\|Filter\|status=\|role=" src/components/admin | grep -iE "select|chip|toggle|tab"
```

## Required implementation approach
Extend the **canonical** `filterEngine.ts` — do NOT duplicate counting/parsing in components.
The header badge, desktop badge, mobile drawer badge, Apply-button badge, and any admin badge MUST
all call `countActiveFilters(parseSearchParams(...))` (or the homepage adapter's equivalent over the
same canonical function). If any component currently has its own count math, delete it and route
through the canonical utility. Add unit tests in `filterEngine.test.ts` for: per-value counting,
each new array group, back-compat single-value parse, range counting, hidden-section exclusion,
OR-within/AND-across mapping.

## Current behavior to preserve
- Homepage batch model (local draft + Apply) and Listings URL-immediate model stay **separate**
  (do NOT merge them — `ai-behavior.md` filter anti-pattern). Both consume the same engine.
- Every existing filter remains; no filter category removed; no admin action removed (Note 20/22).
- `currency` is NOT counted as an active filter (existing rule — keep it excluded).
- No `window.location.href` navigation; use `router.push` (existing rule).

## Out of scope
- No visual redesign of the filter UI; no new filter categories; no listing-card / detail redesign.
- No DB schema change unless investigation PROVES a column type blocks array filtering (STOP & ASK first).
- No pricing/plan logic; no new saved-search feature (only keep existing saved-search matching consistent).
- No new UI library; no new URL-encoding convention.

## Acceptance criteria (literal)
- `conditions` (Стан) and `offerTypes` (Тип пропозиції) are multi-select globally; `purchaseConditions` stays multi; `heating`/`wallType` arrays; `marketType` array OR documented single-select reason.
- Every intentionally single-select filter is listed with a reason in the session log.
- Active count = total active **values** (3 in one group ⇒ +3); 2 in «Стан» + 3 in «Умови купівлі» ⇒ +5; empty range bound ⇒ 0; filled bound ⇒ +1 (both ⇒ 2, documented canonical rule).
- Header badge == Apply badge == desktop badge == mobile badge == admin badge (single canonical utility; no duplicated count math anywhere — grep proof in log).
- Reset → 0 and all chips inactive; Apply preserves all selected; refresh + back/forward + shared URL restore selections & count; comma-encoding used; old single-value URLs still parse (back-compat).
- Backend: OR within a multi-select group, AND across groups (verified in `applyListingFilters` + a test).
- Public site + admin both covered; existing admin table actions/search/sort/pagination intact (Note 22 before/after inventory).
- Multi-select chip UX: click selects, click-again deselects, multiple active at once, canonical selected/unselected styles, keyboard + 44px touch targets, labels wrap (no ellipsis) at 320/375/390.
- All user-facing text localized sq/en/uk/it (reuse existing namespaces; add keys only where needed); verified at 320/375/390/768/1280/1440/2560.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs Sprint-17 baseline. `filterEngine.test.ts` extended and green (`npx vitest run`).
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · vitest green · single count utility · multi-select global · admin covered · locales=4 · breakpoints=7 · scope=clean · PASS`.

## Final report required (owner's list)
1. Files changed. 2. Inventory of all filter components/hooks/utilities reviewed (the matrix). 3. Filters converted to multi-select. 4. Filters kept single-select + reasons. 5. Canonical counting rule. 6. URL array-serialization format + back-compat. 7. Backend OR-within/AND-across confirmation. 8. Site + admin both covered. 9. Confirmation no existing filter/control/admin action silently removed. 10. Localization changes by locale. 11. Responsive verification. 12. Validation command outputs. 13. Known limitations / follow-ups. 14. (No git commands — orchestrator emits them.)

Do NOT emit git commands. Do NOT run git. Do NOT merge the two filter state models. Do NOT duplicate count logic. Do NOT introduce a second URL convention. STOP & ASK before any schema change.
