-- Atomic function: record a listing view with 24-hour dedup per fingerprint.
--
-- SECURITY DEFINER so the function can write to listing_views and increment
-- listings.views_count regardless of the caller's RLS context (anonymous or
-- authenticated). The function is intentionally narrow: it only inserts into
-- listing_views and increments views_count — nothing else.
--
-- Dedup key: (listing_id, user_id) for authenticated viewers;
--             (listing_id, ip_hash) for anonymous viewers.
-- Dedup window: 24 hours rolling (not calendar-day).
--
-- Called by: src/app/api/listings/[slug]/view/route.ts via supabase.rpc()

CREATE OR REPLACE FUNCTION record_listing_view(
  p_listing_id uuid,
  p_user_id     uuid    DEFAULT NULL,
  p_ip_hash     text    DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if this fingerprint already viewed within the last 24 hours
  IF EXISTS (
    SELECT 1
    FROM   listing_views
    WHERE  listing_id = p_listing_id
      AND  viewed_at  >= (now() AT TIME ZONE 'UTC') - INTERVAL '24 hours'
      AND  (
             (p_user_id IS NOT NULL AND user_id = p_user_id)
             OR
             (p_user_id IS NULL AND p_ip_hash <> '' AND ip_hash = p_ip_hash)
           )
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  -- Record the view in the ledger
  INSERT INTO listing_views (listing_id, user_id, ip_hash, viewed_at)
  VALUES (p_listing_id, p_user_id, p_ip_hash, now());

  -- Atomic increment — single UPDATE, no SELECT+UPDATE race
  UPDATE listings
  SET    views_count = views_count + 1
  WHERE  id = p_listing_id;
END;
$$;

-- Speed up the dedup check
CREATE INDEX IF NOT EXISTS listing_views_dedup_idx
  ON listing_views (listing_id, user_id, ip_hash, viewed_at);

-- Allow both anon and authenticated database roles to call this function
GRANT EXECUTE ON FUNCTION record_listing_view(uuid, uuid, text) TO anon, authenticated;
