# Session Archive: Task 153 — J.3 Auto-generated Filter Link — 2026-05-22

## Task

**Task 153 — Epic J.3 — Auto-generated filter link per location**
Type: Feature / Documentation | Depends on: J.2 (Task 152)

## Verdict: J.2 placeholder is already canonical

Investigation of `filterEngine.ts`:
```
parseSearchParams(sp: RawParams) → locationId: n('location_id')   (line 119)
applyListingFilters → .eq('location_id', locationId)               (line 178)
```

The J.2 `PopularLocations` link `/${locale}/listings?location_id=${loc.id}` already uses
the canonical param. **No code change required.**

Cross-check: `src/app/[locale]/listings/[slug]/page.tsx` breadcrumb also uses
`?location_id=${listing.location.id}` — confirming the project-wide convention.

Navigation uses `<Link href="...">` (correct; never `window.location.href`).

## URL slug strategy decision

**Use numeric `id` (not slug).** One canonical URL per location across all 4 locales.
Rationale:
- `filterEngine.ts` reads `location_id` as a number — no slug-to-id join needed.
- Avoids per-locale slug disambiguation and redirect complexity.
- Consistent with the listing detail breadcrumb convention already in production.

## Documentation

`docs/domain-rules.md` — new section "Popular Locations — Filter URL Contract":
- Canonical param: `?location_id=<numeric_id>`
- Why id not slug
- Navigation rule (Link / router.push, never window.location.href)
- Source of truth: filterEngine.ts

## Files changed

| File | Change |
|---|---|
| `docs/domain-rules.md` | New "Popular Locations — Filter URL Contract" section |

## Acceptance criteria

- [x] Card link uses `?location_id=<id>` — canonical per filterEngine.ts.
- [x] URL slug strategy documented in domain-rules.md.
- [x] Navigation uses `<Link href>`, not `window.location.href`.
- [x] 0 code changes; 0 new lint/warnings. **Epic J — CLOSED.**
