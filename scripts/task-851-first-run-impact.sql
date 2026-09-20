-- ═════════════════════════════════════════════════════════════════════════════
-- Task 851 (Sprint 78) — FIRST-RUN IMPACT REPORT for the four /api/cron/* jobs.
--
-- READ-ONLY: SELECT only. Run it in the Supabase SQL editor BEFORE deploying
-- Task 851. It returns one grid: what each job would act on if it ran right now.
--
-- WHY: every route exported only POST while Vercel calls GET (405, INFERENCE
-- pending owner action O78-2). If they really have not run, the first successful
-- run of each job acts on its whole backlog at once. The owner decides the enable
-- order from this grid.
--
-- Every predicate below is COPIED from the route it names; the file:line cites the
-- query in the route as of Task 851's edit. `now()` here plays the role of the
-- route's `new Date()`.
--
-- LIMITS: the routes cap each run (inactivity 200 + 200 users, saved-searches 500,
-- price-alerts 5000 favorites). Counts below are UNCAPPED; the "per-run cap" column
-- says how many the first run would actually process. Saved-search MATCHES cannot
-- be counted in SQL (the filters are applied in TypeScript by applyListingFilters),
-- so that block counts searches that are DUE, not emails that will be sent.
-- ═════════════════════════════════════════════════════════════════════════════

WITH
-- inactivity/route.ts:71-77 (final step) — COALESCE(last_seen_at, created_at) < now-365d
inactivity_final AS (
  SELECT u.id
  FROM users u
  WHERE u.deleted_at IS NULL
    AND u.status NOT IN ('blocked', 'inactive', 'self_deleted')
    AND COALESCE(u.last_seen_at, u.created_at) < now() - interval '365 days'
),
-- inactivity/route.ts:133-141 (warning step) — 91d <= inactive < 365d, warning never sent
inactivity_warn AS (
  SELECT u.id
  FROM users u
  WHERE u.deleted_at IS NULL
    AND u.inactivity_warning_sent_at IS NULL
    AND u.status NOT IN ('blocked', 'inactive', 'self_deleted')
    AND COALESCE(u.last_seen_at, u.created_at) < now() - interval '91 days'
    AND COALESCE(u.last_seen_at, u.created_at) >= now() - interval '365 days'
),
-- saved-searches/route.ts:59-62 + shouldCheck() at :35-43
saved_searches_due AS (
  SELECT s.id, s.last_checked_at
  FROM saved_searches s
  WHERE s.notify_email = true
    AND (
      s.last_checked_at IS NULL
      OR COALESCE(s.notify_frequency, 'daily') = 'instant'
      OR (COALESCE(s.notify_frequency, 'daily') = 'weekly'
          AND now() - s.last_checked_at > interval '6.5 days')
      OR (COALESCE(s.notify_frequency, 'daily') NOT IN ('instant', 'weekly')
          AND now() - s.last_checked_at > interval '23 hours')
    )
),
-- price-alerts/route.ts:50-64 — favorites whose listing is not archived
price_pairs AS (
  SELECT f.user_id, f.listing_id, l.price AS current_price, a.last_notified_price
  FROM favorites f
  JOIN listings l ON l.id = f.listing_id AND l.status <> 'archived'
  LEFT JOIN favorite_price_alerts a
         ON a.user_id = f.user_id AND a.listing_id = f.listing_id
)
SELECT job, what, would_act_on, per_run_cap, mirrors
FROM (
  -- ── listings-expiry ───────────────────────────────────────────────────────
  SELECT 1 AS ord, 'listings-expiry' AS job,
         'active listings with expires_at < now() → set to expired' AS what,
         (SELECT count(*) FROM listings WHERE status = 'active' AND expires_at < now()) AS would_act_on,
         'none' AS per_run_cap,
         'src/app/api/cron/listings-expiry/route.ts:35-38' AS mirrors
  UNION ALL
  SELECT 2, 'listings-expiry',
         'active listings with NULL expires_at (REPORTED only, never mutated — owner decision #3)',
         (SELECT count(*) FROM listings WHERE status = 'active' AND expires_at IS NULL),
         'none',
         'src/app/api/cron/listings-expiry/route.ts:41-44'
  -- ── inactivity ────────────────────────────────────────────────────────────
  UNION ALL
  SELECT 3, 'inactivity',
         'users past 365 days → soft-deleted, listings archived, final email sent',
         (SELECT count(*) FROM inactivity_final),
         '200',
         'src/app/api/cron/inactivity/route.ts:71-77'
  UNION ALL
  SELECT 4, 'inactivity',
         'active listings those users own (would be archived through the gateway; sold/rented/archived excluded)',
         (SELECT count(*) FROM listings l
            WHERE l.user_id IN (SELECT id FROM inactivity_final)
              AND l.status NOT IN ('sold', 'rented', 'archived')),
         'none',
         'src/app/api/cron/inactivity/route.ts:93-97'
  UNION ALL
  SELECT 5, 'inactivity',
         'users between 91 and 365 days, never warned → warning email sent',
         (SELECT count(*) FROM inactivity_warn),
         '200',
         'src/app/api/cron/inactivity/route.ts:133-141'
  -- ── saved-searches ────────────────────────────────────────────────────────
  UNION ALL
  SELECT 6, 'saved-searches',
         'saved searches with notify_email = true that are DUE (email only if new matches — not countable in SQL)',
         (SELECT count(*) FROM saved_searches_due),
         '500',
         'src/app/api/cron/saved-searches/route.ts:59-62 + shouldCheck :35-43'
  UNION ALL
  SELECT 7, 'saved-searches',
         'of those, NEVER checked (last_checked_at IS NULL → cutoff is the epoch, so every match in the catalogue counts as new)',
         (SELECT count(*) FROM saved_searches_due WHERE last_checked_at IS NULL),
         '500',
         'src/app/api/cron/saved-searches/route.ts:36 + :76'
  -- ── price-alerts ──────────────────────────────────────────────────────────
  UNION ALL
  SELECT 8, 'price-alerts',
         'favorite pairs on non-archived listings',
         (SELECT count(*) FROM price_pairs),
         '5000 favorites',
         'src/app/api/cron/price-alerts/route.ts:50-64'
  UNION ALL
  SELECT 9, 'price-alerts',
         'pairs with NO alert row → silent baseline insert, no notification',
         (SELECT count(*) FROM price_pairs WHERE last_notified_price IS NULL),
         '5000 favorites',
         'src/app/api/cron/price-alerts/route.ts:103-113'
  UNION ALL
  SELECT 10, 'price-alerts',
         'pairs whose price differs from last_notified_price → in-app notification + email',
         (SELECT count(*) FROM price_pairs
            WHERE last_notified_price IS NOT NULL AND current_price::numeric <> last_notified_price::numeric),
         '5000 favorites',
         'src/app/api/cron/price-alerts/route.ts:115-174'
) impact
ORDER BY ord;
