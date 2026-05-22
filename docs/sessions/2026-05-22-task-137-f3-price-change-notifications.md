# Session Archive: Task 137 — F.3 Price-Change Notifications — 2026-05-22

## Summary

Daily cron detects price changes on favorited listings and notifies users via email (admin-editable template `price_change_alert`) + in-app notification. Idempotent via `favorite_price_alerts` dedup table.

## DB Migration SQL (run in Supabase dashboard)

```sql
-- Tracks the last price at which each user was notified about a favorited listing
CREATE TABLE IF NOT EXISTS favorite_price_alerts (
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  last_notified_price NUMERIC(12, 2) NOT NULL,
  last_notified_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

-- RLS: users can read their own rows (service-role writes via cron)
ALTER TABLE favorite_price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_alerts_owner_read" ON favorite_price_alerts
  FOR SELECT USING (user_id = auth.uid());

-- If the notifications.type column is a DB enum, add the new value:
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'price_change';
-- (Skip if notifications.type is TEXT — TypeScript type already updated)
```

## Email Template (create in /admin/email-templates)

**Key:** `price_change_alert`  
**Available variables:** `{{listingTitle}}`, `{{oldPrice}}`, `{{newPrice}}`, `{{currency}}`, `{{listingUrl}}`

Example subject (sq): `Çmim i ri për {{listingTitle}}`  
Example subject (en): `Price update for {{listingTitle}}`

Create templates for all 4 locales (sq, en, uk, it) in the admin template manager.

## Files Changed

| File | Change |
|---|---|
| `src/app/api/cron/price-alerts/route.ts` | New — daily cron handler |
| `src/types/database.ts` | Added `'price_change'` to `NotificationType` |
| `src/modules/notifications/components/NotificationItem.tsx` | Added `price_change: '💰'` to TYPE_ICON |
| `vercel.json` | Added `"0 10 * * *"` cron for `/api/cron/price-alerts` |

## Algorithm

```
1. Fetch all (user_id, listing_id) from favorites (limit 5000)
2. Fetch current price + title + slug for non-archived listings
3. Fetch existing favorite_price_alerts rows for those users
4. For each (user, listing) pair:
   a. No alert row → INSERT baseline price, no notification
   b. Alert row, price unchanged → skip
   c. Alert row, price changed →
      i.  resolveUserLocale(userId) → locale
      ii. createNotification(type='price_change', inline locale strings)
      iii. sendTemplatedEmail(key='price_change_alert', variables)
      iv.  UPSERT last_notified_price = currentPrice
5. Bulk UPSERT all baseline (first-time) records
```

## Dedup Logic

`last_notified_price` is updated to `currentPrice` after every notification. On the next cron run, `currentPrice === lastPrice` → skipped. The same price change never triggers a second alert.

First-time pairs (no alert row) get a baseline record without sending a notification — prevents the first cron run from flooding users whose listings were already at a certain price before the feature launched.

## Cron Schedule

`0 10 * * *` — 10 AM UTC daily. Sequential with saved-searches (9 AM) and inactivity (8 AM) to avoid parallel admin client contention.

## Acceptance Criteria

- [x] `favorite_price_alerts` table defined with RLS (SQL in this log)
- [x] Price-change detection: comparing `listing.price` to `last_notified_price`
- [x] Dedup: same price change never triggers twice
- [x] Baseline: first cron run records current price without notifying
- [x] Email: `sendTemplatedEmail(key='price_change_alert')` — admin-editable, locale-correct via `resolveUserLocale`
- [x] In-app: `createNotification(type='price_change')` with inline sq/en/uk/it strings
- [x] `vercel.json` cron registered at `0 10 * * *`
- [x] `NotificationType` updated + `NotificationItem` TYPE_ICON entry added
- [x] 0 new lint/warnings; 0 new TypeScript errors in production code
- [x] **Epic F — CLOSED** (F.1 + F.4 + F.2 + F.3 all completed)
