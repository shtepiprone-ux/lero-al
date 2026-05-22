# Session Archive: Task 154 — L.1 Dashboard Discovery — 2026-05-22

## Task

**Task 154 — Epic L.1 — Admin Dashboard 2026: KPI discovery + scope sign-off**
Type: Research / Product | Blocks L.2

---

## Current state audit

`src/app/admin/page.tsx` already has:

| Element | Status |
|---|---|
| Stat cards: total listings, active, premium, total users, new users (7d), open tickets | ✅ Working |
| Location Requests alert panel | ✅ Working |
| Recent Listings table (last 8) | ⚠️ NOT clickable — violates Epic K §11 |
| Hardcoded `'sq'` locale in `formatCount()` | ⚠️ Bug — should use admin locale |
| Missing: reports/moderation queue | ❌ Not shown |
| Missing: new listings count (separate from totals) | ❌ Not shown |
| Missing: user role breakdown | ❌ Not shown |

---

## KPI long-list + priority tiers

### P0 — Ship with L.2 (immediate operational value)

| # | Metric | Source | Query type |
|---|---|---|---|
| 1 | Active listings count | `listings WHERE status='active'` | COUNT |
| 2 | New listings (7d) | `listings WHERE created_at >= weekAgo` | COUNT |
| 3 | Total users (non-deleted) | `users WHERE deleted_at IS NULL` | COUNT |
| 4 | New users (7d) | `users WHERE created_at >= weekAgo AND deleted_at IS NULL` | COUNT |
| 5 | Open support tickets | `support_tickets WHERE status='open'` | COUNT |
| 6 | Pending reports | `reports WHERE status='pending'` | COUNT |
| 7 | Listing status breakdown | `listings GROUP BY status` | GROUP BY |
| 8 | Recent listings table (8 rows, Epic K clickable) | `listings ORDER BY created_at DESC LIMIT 8` | SELECT |
| 9 | Pending reports list (5 rows) | `reports WHERE status='pending' LIMIT 5` | SELECT |
| 10 | Location requests alert (existing) | `users WHERE location_request IS NOT NULL` | SELECT |

**Dropped from P0 (data unavailable or too complex):**
- Email delivery health → Resend doesn't expose webhook tracking in our current setup; no bounce table in DB.
- Conversion funnel (view → contact) → `listing_views` table exists but contact actions aren't tracked with a `contacts` event table yet; unreliable ratio.
- Active chats / messages → no `messages` table currently in the product.

### P1 — Follow-up sprint (valuable but not urgent)

| Metric | Why P1 |
|---|---|
| New users by role (agent vs user) | Useful but adds query complexity; P0 has total |
| Top locations by listing count | Informational; requires GROUP BY join |
| Premium listings revenue estimate | Price × premium count; approximation only |
| Inactivity email pipeline status | Cron log-based; needs structured cron audit log |

### P2 — Future / optional

| Metric | Blocker |
|---|---|
| Email delivery rate (opens/bounces) | Needs Resend webhook + `email_events` table |
| Conversion funnel (view → contact) | Needs `contact_events` tracking table |
| Popular search terms trend | Needs search query logging |
| Revenue dashboard | Needs payment integration |

---

## Wireframe sketch

### Mobile (320–390px) — single column, stacked

```
┌──────────────────────────────┐
│ 📊 Dashboard                 │
├─────────────┬────────────────┤
│ Active      │ New 7d         │
│ Listings    │ Listings       │
│  1 204      │   37           │
├─────────────┼────────────────┤
│ Total       │ New Users 7d   │
│ Users       │                │
│   892       │   14           │
├─────────────┼────────────────┤
│ Open        │ Pending        │
│ Tickets     │ Reports        │
│   3         │   5            │
├──────────────────────────────┤
│ Listing status breakdown     │
│ active ████ 1204             │
│ sold   ██   312              │
│ inactive ■  88               │
│ archived   ▫ 45              │
├──────────────────────────────┤
│ ⚠ Pending Reports (5)        │
│ ───────────────────────────  │
│ [reason] [listing] [time]    │
│ [reason] [listing] [time]    │
│ → View all reports           │
├──────────────────────────────┤
│ Recent Listings              │
│ ───────────────────────────  │
│ [title clickable] [status]   │
│ [owner]         [price][ago] │
│ ↕ (8 rows, Epic K pattern)  │
├──────────────────────────────┤
│ ⚠ Location Requests (2)      │
│ [name] [city]               │
└──────────────────────────────┘
```

### Desktop 1280px — 2-column below stats

```
┌────────────────────────────────────────────────────────────┐
│ 📊 Dashboard                 [Last updated: just now]      │
├──────────┬──────────┬──────────┬──────────┬──────┬────────│
│ Active   │ New      │ Total    │ New Users│ Open │Pending │
│ List.    │ List.7d  │ Users    │ 7d       │Tick. │Reports │
│  1,204   │   37     │  892     │   14     │  3   │   5   │
├──────────┴──────────┴──────────┴──────────┴──────┴────────│
│                                                            │
│ ┌─────────────────────────┐  ┌─────────────────────────┐  │
│ │ Recent Listings         │  │ Pending Reports          │  │
│ │ (clickable → Dialog)    │  │ (clickable → /reports)   │  │
│ │ title     status  price │  │ reason  listing   [ago]  │  │
│ │ title     status  price │  │ reason  listing   [ago]  │  │
│ │ title     status  price │  │ ─────────────────────── │  │
│ │ → View all              │  │ Location Requests (2)    │  │
│ │                         │  │ name     city            │  │
│ └─────────────────────────┘  └─────────────────────────┘  │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Listing Status Breakdown                            │   │
│ │ active: 1,204 ████████████████                      │   │
│ │ sold:     312 ████                                  │   │
│ │ inactive:  88 █                                     │   │
│ │ archived:  45 ▌                                     │   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### 2560px — wider stat row (6 cards in one row), panels expand

Same layout as 1280px but `max-w-6xl` caps content. Stats use `xl:grid-cols-6`.

---

## Aggregate query plan (P0)

All queries use `createAdminClient()` (service-role, bypasses RLS).

```typescript
// Batch via Promise.all:
[
  // 1-4: already in getStats() — reuse
  db.from('listings').select('*', {count:'exact',head:true}).eq('status','active'),
  db.from('listings').select('*', {count:'exact',head:true}).gte('created_at', weekAgo),
  db.from('users').select('*', {count:'exact',head:true}).is('deleted_at',null),
  db.from('users').select('*', {count:'exact',head:true}).gte('created_at',weekAgo).is('deleted_at',null),

  // 5-6: already partial, add reports
  db.from('support_tickets').select('*',{count:'exact',head:true}).eq('status','open'),
  db.from('reports').select('*',{count:'exact',head:true}).eq('status','pending'),  // NEW

  // 7: status breakdown (NEW)
  db.from('listings').select('status').neq('status','pending'),  // group in app

  // 8: recent listings (existing, fix Epic K clickability)
  db.from('listings').select('id,slug,title,status,is_premium,price,currency,created_at,owner:users!...(name)').order('created_at',{ascending:false}).limit(8),

  // 9: pending reports list (NEW)
  db.from('reports').select('id,reason,status,created_at,listing:listings(title,slug)').eq('status','pending').order('created_at',{ascending:false}).limit(5),

  // 10: location requests (existing)
]
```

**Status breakdown** — no GROUP BY in Supabase-js; fetch all statuses via `.select('status')` and group in JavaScript (< 2000 rows expected):
```typescript
const counts = listings.reduce((acc, l) => {
  acc[l.status] = (acc[l.status] ?? 0) + 1; return acc
}, {} as Record<string, number>)
```

---

## Index review

| Table | Column | Current index? | Needed for |
|---|---|---|---|
| `listings` | `status` | ⚠️ Likely none | Status breakdown, active count |
| `listings` | `created_at` | ⚠️ Likely none | New 7d count |
| `users` | `created_at` | ⚠️ Likely none | New users 7d |
| `users` | `deleted_at` | ⚠️ Likely none | Total users (IS NULL filter) |
| `reports` | `status` | ⚠️ Likely none | Pending reports count |
| `support_tickets` | `status` | ⚠️ Likely none | Open tickets count |

**Recommendation:** Add B-tree indexes for `listings(status)`, `listings(created_at)`, `reports(status)`, `users(created_at)`, `users(deleted_at)`. Ship migration SQL with L.2.

Draft migration (to be run in Supabase before L.2 deploys):
```sql
CREATE INDEX IF NOT EXISTS idx_listings_status    ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created   ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_users_created      ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at   ON users(deleted_at);
```

---

## L.3 decision

**L.3 is folded into L.2.** The recent listings table in L.2 will be rewritten from scratch (Epic K clickable). No standalone L.3 needed.

---

## Bug fix to carry into L.2

`formatCount(value ?? 0, 'sq')` — hardcoded `'sq'` locale. Fix: use `locale` from `getAdminLocale()`.

---

## Sign-off

**⚠️ Awaiting user sign-off before L.2 begins.**

Questions for user:
1. Do you agree with the P0 metric list? Any additions or removals?
2. Should the listing status breakdown be a visual bar chart or just a stat list?
3. Should "Pending Reports" panel show only when count > 0 (like Location Requests), or always?
