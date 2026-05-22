# Session Archive: Task 138 — G.1 Track Recently Viewed Listings — 2026-05-22

## Task

**Task 138 — Epic G.1 — Track recently viewed listings (storage layer)**
Type: Feature / data model | Priority: Medium

## Summary

Implemented the storage layer for recently-viewed listings:
- Auth users → Supabase `recently_viewed` table (upsert + prune via RPC).
- Guests → `rv_listings` cookie (JSON array of UUIDs, 25-cap, dedupe-to-front).
- `RecentlyViewedTracker` client component fires 1 500 ms after page load (same StrictMode + Speculation Rules guards as `ViewTracker`).

## DB Migration SQL (run in Supabase dashboard — NOT yet applied)

```sql
-- Table
CREATE TABLE recently_viewed (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Efficient per-user ordered reads
CREATE INDEX recently_viewed_user_viewed_idx
  ON recently_viewed(user_id, viewed_at DESC);

-- RLS: owner-only read/write
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recently_viewed_owner_only" ON recently_viewed
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atomic upsert + prune (SECURITY DEFINER; uses auth.uid() from JWT — no p_user_id arg)
CREATE OR REPLACE FUNCTION record_recently_viewed(
  p_listing_id uuid,
  p_cap        int DEFAULT 25
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Upsert: insert new or refresh viewed_at on revisit
  INSERT INTO recently_viewed (user_id, listing_id, viewed_at)
  VALUES (v_user_id, p_listing_id, now())
  ON CONFLICT (user_id, listing_id) DO UPDATE SET viewed_at = now();

  -- Prune entries beyond cap (keep the p_cap most-recent by viewed_at)
  DELETE FROM recently_viewed
  WHERE user_id = v_user_id
    AND id NOT IN (
      SELECT id FROM recently_viewed
      WHERE user_id = v_user_id
      ORDER BY viewed_at DESC
      LIMIT p_cap
    );
END;
$$;
```

⚠️ **Pending ops action:** run the SQL above in Supabase before G.2 (UI block) can function for auth users.

## Guest Cookie Contract

- **Name:** `rv_listings`
- **Format:** `["uuid1","uuid2",…]` — JSON array of listing UUIDs, newest first
- **Cap:** 25 entries (prune from end on every write)
- **Dedupe:** existing entry moved to front, not duplicated
- **Size bound:** 25 × 36 chars ≈ 950 B — well within 4 KB limit
- **Attributes:** `path=/; max-age=2592000 (30 days); sameSite=lax; httpOnly=false`
- **`httpOnly: false`** rationale: allows G.2 to read via `document.cookie` for optimistic client updates if needed; SSR already reads all cookies from request headers regardless of httpOnly.
- **Privacy:** listing UUIDs only; no user IDs, prices, or content.

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/actions/recentlyViewedActions.ts` | **NEW** — `recordListingView(listingId)` server action |
| `src/modules/listings/components/RecentlyViewedTracker.tsx` | **NEW** — client tracker component |
| `src/app/[locale]/listings/[slug]/page.tsx` | Added `<RecentlyViewedTracker listingId={listing.id} />` |
| `src/types/database.ts` | Added `RecentlyViewed` interface |
| `docs/analytics-rules.md` | Documented guest cookie decision |

## Acceptance Criteria Verification

- [x] `recently_viewed` table + RLS — SQL documented above; pending Supabase run.
- [x] Cap (25) + dedupe enforced for both auth + guest paths.
- [x] `recordListingView` idempotent on rapid double-call: auth → UPSERT ON CONFLICT; guest → dedupes array before capping.
- [x] StrictMode safe: cleanup cancels first-mount timer; only second-mount fires the action.
- [x] Guest privacy choice documented in `docs/analytics-rules.md`.
- [x] 0 new lint errors / 0 new warnings.
- [x] 0 new TypeScript errors (2 pre-existing test-fixture errors from Task 126 unrelated to this task).
- [x] Localization N/A (storage layer).
- [x] Responsive N/A (storage layer).

## Out of scope

G.2 (UI block), G.3 (clear history).
