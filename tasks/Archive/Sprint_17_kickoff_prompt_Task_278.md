# Sprint 17 — Task 278 kickoff (Premium home CTA → `/listings?premium=true` + Listings premium-only filter)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — for this task: **"UI / layout / component task" bundle + "DB / server action / RLS task" bundle** (listing query side). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI task → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

---

## Task 278 — Premium home CTA → `/listings?premium=true` + Listings premium-only filter

```
Hard contract: see top.

Type:        feature
Priority:    medium
Area:        public listings / home page / filters / URL routing

GOAL: Three coupled changes:

  (a) The Home page "Premium → View all / Переглянути всі" CTA must
      navigate to /listings?premium=true (not to plain /listings, which
      currently duplicates the Latest CTA).
  (b) The Listings page must support a visible, clearable "Premium only"
      filter. The filter state lives in the URL query param
      ?premium=true so refresh / share / back-nav preserves it.
  (c) The Home page "Latest / Останні" CTA MUST keep opening plain
      /listings (no premium filter) — unchanged behavior.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 from owner-uploaded
issues.txt §5.

Pre-read (UI + DB/RLS bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md        → filter chip/segmented-control patterns
- docs/component-rules.md → reusable component standards; locale rules
- docs/qa-rules.md
- docs/data-access-rules.md → server query patterns
- docs/domain-rules.md    → listing premium semantics (`is_premium`,
                             `premium_until`)
- docs/ai-behavior.md     → Note 19 (UX Flow Preservation — every
                             existing listings filter must keep working),
                             Note 20 (Existing-Control Preservation —
                             new filter is ADDITION; existing filters
                             stay)
- src/modules/listings/ — listing query / filter / page logic
- src/app/[locale]/listings/page.tsx — server page entry
- src/app/[locale]/listings/route.ts (if present) — API route entry
- src/modules/home/ — Home page Premium + Latest sections

Current behavior to preserve:
- Listings page: existing filters (deal type / property type / location /
  market type / advanced drawer / sort / pagination) all work.
- Listings sort: existing sort options (Task 230 — area_asc, etc.).
- Listings URL query parsing: existing params (`q`, `category`, `city`,
  `region`, `sort`, etc.) preserved.
- Active filter chips bar (Task 229): existing chips work + the global
  reset button works.
- Home Latest section CTA: plain /listings (UNCHANGED).
- Home Premium section: lists premium listings (UNCHANGED layout).
- Listing card rendering: UNCHANGED.

Required after behavior:

1. Home Premium section CTA:
   - The href changes from /listings (or whatever it currently is) to
     /<locale>/listings?premium=true.
   - The label text unchanged ("View all" / "Переглянути всі" /
     "Vedi tutto" / "Shiko të gjitha").

2. Listings page server-side query:
   - Parses `premium` from query params alongside existing params.
   - Validates: only `'true'` (string) is accepted; anything else is
     ignored (defensive — defaults to no filter).
   - When premium=true, the listing query adds:
     `.eq('is_premium', true)` AND
     `.or('premium_until.is.null,premium_until.gt.now()')` — exclude
     premium listings whose paid window has expired. (STOP & ASK if
     `premium_until` semantics differ — confirm via grep on the table
     definition.)
   - Applied in BOTH the page.tsx server query AND any route.ts API
     route — both paths must produce the same result set (Note 14
     Global Change Verification).

3. Listings page UI — visible "Premium only" filter:
   - Placement: in the existing filter bar (`ListingsFilterBar.tsx`),
     either as a new toggle/chip or as a new option in the existing
     scope/segmented control. Sonnet decides based on the current
     filter bar architecture; STOP & ASK if neither slot is obviously
     correct.
   - When active: visually highlighted (selected state) + appears in
     the active-filter chips bar (so the user can see it AND clear it).
   - When clicked OFF: query param removed; URL updates via existing
     `router.push(...)`/`useSearchParams` pattern.
   - When the global reset button is clicked (Task 229), the premium
     filter is also reset (along with all others) — per the
     `resetFilters` hook from Task 229.
   - Tab-based status filters (Task 193) work IN COMBINATION with the
     premium filter (e.g. premium=true + status=approved is valid).

4. URL query sync:
   - Initial render reads `?premium=true` from `searchParams` and sets
     the filter as active.
   - Refresh preserves it.
   - Browser Back/Forward preserves it.
   - Share link with `?premium=true` lands the recipient on the
     premium-only view.

5. Active-filter chips bar:
   - When premium=true, a chip appears: `t('listings.filter_chip_premium_only')`
     ("Premium only" / "Преміум" / etc.).
   - Clicking the chip's × removes the filter (same pattern as other
     chips).

6. New locale keys (×4 locales):
   - `listings.filter_chip_premium_only` ("Premium only" / "Преміум" / "Solo premium" / "Vetëm premium")
   - `listings.filter_premium_toggle_label` ("Premium only" — label of the toggle/chip in the filter bar; can be same as above OR more descriptive if Sonnet's design choice differs)
   - = 1-2 new keys × 4 = 4-8 entries (depends on whether the toggle label and chip label are unified).

7. NO change to: Latest CTA, listing card layout, listing detail page,
   premium activation flow (Task 260), homepage Premium section query
   (it already returns premium listings).

Positive flow (happy path) — Home Premium CTA:
- User on Home page, sees "Premium" section with 4-8 premium listing cards.
- Clicks "Переглянути всі" → navigates to /uk/listings?premium=true.
- Listings page server-side reads ?premium=true → query adds `.eq('is_premium', true).or('premium_until.is.null,premium_until.gt.now()')`.
- Page renders only premium listings; filter bar shows "Premium only" toggle as ACTIVE; active-filter chip bar shows "Premium only" chip.
- User can combine with deal type / city / sort → URL becomes e.g. /uk/listings?premium=true&city=tirana&sort=area_asc.

Positive flow (happy path) — Home Latest CTA (preservation):
- User clicks "Останні" → navigates to /uk/listings (no premium param).
- Listings page renders all listings, no premium filter active. Existing behavior unchanged.

Positive flow (happy path) — manual filter activation:
- User on /uk/listings (no premium filter) → clicks "Premium only" toggle/chip → URL updates to /uk/listings?premium=true → page re-renders with premium-only.

Positive flow (happy path) — filter clear:
- User clicks the × on the "Premium only" chip → URL becomes /uk/listings (no premium) → all listings re-render.
- OR user clicks the global reset button (Task 229) → all filters reset including premium.

Negative flow (every off-happy-path branch):
- **`?premium=false`** — ignored (only `true` activates the filter). All listings render.
- **`?premium=anything-else`** — ignored. Defensive validation prevents URL injection from changing behavior.
- **No premium listings in DB** — page renders empty state (existing empty-state UI applies); filter UI still shows the toggle as active so user can clear it.
- **Premium listing whose `premium_until` has expired** — excluded from the result set. User sees fewer listings than expected if they paid for premium that has since expired. UX-side: existing premium expiration flow (Task 260) handles owner notification; this task only filters the visible result.
- **User combines premium=true + status=archived** — server query honors both; result set might be empty (archived premium listings probably don't exist). Empty state renders.
- **JS disabled** — server-side rendering still applies the filter (`searchParams` is server-readable); no JS-only filter logic.
- **Locale switch mid-page** — URL preserved; new locale strings render; filter remains active.
- **Browser Back from /listings?premium=true to /** — Home Premium section renders as before.
- **Direct deep-link to /listings?premium=true** — same as Home CTA navigation; filter active on first render.
- **Mobile 320px** — toggle/chip does not overflow the filter bar (which uses `flex-wrap` since Task 232).
- **All 7 breakpoints walked.**
- **Active-filter chip's × click double-fired** — `router.push` deduplicates; one navigation only.
- **Combined with the existing search query `?q=...`** — both filters apply; URL preserves both.

Required investigation (paste outputs in session log):

1. Locate Home Premium + Latest section CTAs:
   ```
   grep -rln "Premium\|Latest\|View all\|Переглянути\|Vedi tutto\|Shiko të gjitha" src/modules/home src/app/\[locale\]/page.tsx 2>/dev/null
   ```

2. Locate Listings page server query + filter bar:
   ```
   grep -rn "is_premium\|premium_until\|ListingsFilterBar\|parseSearchParams" src/app/\[locale\]/listings src/modules/listings 2>/dev/null | head -30
   ```

3. Confirm `is_premium` + `premium_until` columns exist:
   ```
   grep -nE "is_premium|premium_until" src/types/database.ts
   ```

4. Confirm the `resetFilters` hook (Task 229) is in place:
   ```
   grep -n "resetFilters" src/modules/listings/hooks 2>/dev/null
   ```

5. Confirm active-filter-chips component:
   ```
   grep -rln "ActiveFilterChips" src/ 2>/dev/null
   ```

6. Confirm `useListingsFilters` hook signature for adding a new filter:
   ```
   grep -n "useListingsFilters\|setPremium" src/modules/listings/hooks 2>/dev/null
   ```

Scope (files Sonnet may touch):

1. `src/modules/home/components/PremiumListings*.tsx` (or wherever the Premium CTA lives — confirm via grep #1) — update the CTA href.
2. `src/modules/listings/hooks/useListingsFilters.ts` (or equivalent — confirm via grep #6) — add `premium` to filter state + reset.
3. `src/modules/listings/components/ListingsFilterBar.tsx` — add the new toggle/chip.
4. `src/modules/listings/components/ActiveFilterChips.tsx` — add the premium chip.
5. `src/app/[locale]/listings/page.tsx` — parse + apply the premium filter in the server query.
6. `src/app/[locale]/listings/route.ts` (if it exists) — same.
7. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 1-2 new keys each.
8. `docs/backlog.md` — standard task-closure update.
9. `docs/sessions/2026-05-28-task-278-premium-cta-and-filter.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- Home Latest section CTA (must keep current /listings behavior).
- Home Premium section query (already returns premium listings — only the CTA changes).
- Listing card layout.
- Listing detail page.
- Premium activation flow (Task 260).
- Premium pricing / plan logic.
- New analytics events (Task 277 lays the foundation; do NOT add a `premium_filter_used` event here).
- Listing detail premium badge.
- Admin premium toggle UI.

Acceptance criteria (literal):
- Home Premium "View all" CTA navigates to /<locale>/listings?premium=true (verifiable via grep + click test).
- Home Latest "View all" CTA still navigates to /<locale>/listings without premium param (unchanged; grep evidence).
- Listings page server query applies `.eq('is_premium', true).or('premium_until.is.null,premium_until.gt.now()')` when ?premium=true.
- Listings page UI shows a clearly-visible Premium-only filter toggle/chip in the filter bar.
- Active-filter chips bar shows a "Premium only" chip when active.
- Clicking the chip × removes the filter; clicking the global reset (Task 229) also removes it.
- URL roundtrip works: refresh, Back/Forward, share link all preserve the filter state.
- Filter combines correctly with existing filters (city, deal type, status, sort, pagination, q).
- Defensive: only `?premium=true` activates; other values ignored.
- 1-2 new locale keys × 4 locales (4-8 entries).
- Mobile 320px walked; filter bar wraps cleanly.
- All 7 breakpoints walked.
- Every negative branch above → diff line.
- Note 18 self-validation + Note 20 before/after filter-bar inventory in session log.
- `tsc=0` errors.
- "Files Changed" table per Task 264.

Final report required from Sonnet:
1. Files Changed table.
2. Before/after filter-bar inventory (Note 20).
3. URL roundtrip evidence (text walk or screenshots).
4. Premium query: paste the actual query as built post-edit.
5. Locale-key parity (per-file count).
6. Note 18 self-validation verdict line.
7. Confirmation that Latest CTA is unchanged (grep evidence).

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
modify the Latest CTA. Do NOT add new analytics events. Do NOT change
listing card / detail / premium-activation logic.
```
