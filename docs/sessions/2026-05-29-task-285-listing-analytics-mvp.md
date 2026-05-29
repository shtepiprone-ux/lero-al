# Task 285 — Listing Analytics MVP read/display slice

**Date:** 2026-05-29  
**Sprint:** 20 — Listing Analytics + Favorites Collections  
**Type:** feature (analytics read/display) — MVP slice

---

## Required investigation outputs

### Existing analytics write-side foundation

- **Views:** `record_listing_view` RPC (SECURITY DEFINER) → `listing_views` table (deduplicated, owner-excluded). `views_count` column on `listings` is incremented atomically. Already shown in ListingsTab at line 333 and listing detail page.
- **Contact events:** `listing_contact_events` table (`id`, `listing_id`, `listing_owner_id`, `actor_user_id`, `channel`, `source`, `locale`, `is_owner_click`, `created_at`). Write via `trackListingContactEvent()` in `src/modules/listings/actions/contactEvents.ts`.

### RLS posture on `listing_contact_events` (Task 289)

- `events_insert_authenticated` — authenticated users INSERT (own events)
- `events_select_owner` — `listing_owner_id = auth.uid()` → owner can SELECT their listings' events
- Anonymous INSERT policy + anon SELECT grant both revoked (Task 289)

This means: a `createClient()` (user-auth) query with `.eq('listing_owner_id', authUser.id)` is automatically RLS-filtered. No admin client needed.

### Cabinet listing display

- `ListingsTab.tsx` receives `CardListingData[]` from `CabinetShell`
- `CABINET_LISTING_SELECT` already includes `views_count`
- Stats row at line 328–337: price | views | RelativeTime
- `contactCountMap` was NOT present — added by this task

---

## Read query / RLS design

**No new DB objects needed.** Direct query using the existing `events_select_owner` RLS:

```ts
supabase
  .from('listing_contact_events')
  .select('listing_id')
  .eq('listing_owner_id', authUser.id)   // defense-in-depth (RLS already enforces this)
  .eq('is_owner_click', false)            // exclude owner self-clicks
```

**Aggregation:** Server-side JS loop in the RSC (cabinet page.tsx) builds `Record<string, number>` map. For MVP scale (typical owner has tens of listings, hundreds of events) this is performant. A DB-side aggregate can be added in a follow-up RPC.

**RLS enforcement:** `createClient()` uses the authenticated session. `events_select_owner` policy (`USING (listing_owner_id = auth.uid())`) automatically limits rows to the authenticated user's listings. Non-owner/unauthenticated requests get 0 rows.

**No SQL script needed** — no new DB objects, no RLS changes.

---

## Where stats display (file:line)

`src/modules/cabinet/components/ListingsTab.tsx` ~line 338–341:

```tsx
<span className="flex items-center gap-1">
  <Phone className="h-3 w-3" />
  {contactCountMap?.[listing.id] ?? 0} {t('contacts')}
</span>
```

Added immediately after the existing `views_count` span.

---

## Owner-only enforcement evidence

1. Cabinet page `getUser()` → redirects to login if not authenticated (line 45)
2. `createClient()` → RLS-session-bound
3. `.eq('listing_owner_id', authUser.id)` → explicit filter (defense in depth)
4. `events_select_owner` policy → DB-level enforcement: `USING (listing_owner_id = auth.uid())`
5. A different authenticated user would get `0` rows from the RLS policy

---

## Negative flow verification

| Scenario | Result |
|---|---|
| Not authenticated | `getUser()` → redirect; never reaches the query |
| Authenticated but not owner of a listing | RLS returns 0 rows for that listing_id; `contactCountMap?.[listing.id] ?? 0` = 0 ✅ |
| Listing with zero events | `0 contacts` displays cleanly ✅ |
| Query error (`contactEvents` = null) | `for (const e of contactEvents ?? [])` → empty loop → all listings show `0 contacts` ✅ |
| Mobile 320px `uk` | Stats row uses `flex flex-wrap gap-x-4 gap-y-1` → wraps cleanly, no overflow ✅ |

---

## Deferred follow-ups for orchestrator (file as Task 295+)

1. **DB-side aggregate RPC** — `get_listing_contact_counts(p_owner_id uuid)` returning `TABLE(listing_id uuid, contact_count bigint)` for O(1) DB work instead of fetching all event rows.
2. **Full analytics dashboard** — per-listing time-series, charts, date-range filter.
3. **Admin-side global metrics** — admin dashboard view count + contact funnel.
4. **Date-range filtering** — last 7d / 30d / all-time selector on analytics.
5. **Funnel / conversion rates** — views→contacts rate per listing.
6. **Export** — CSV download of analytics data.
7. **Event-type breakdown** — contacts by channel (WhatsApp, phone, etc.) when more channels are added.

---

## New locale keys ×4

| Key | Namespace | en | sq | uk | it |
|---|---|---|---|---|---|
| `contact_count` | `cabinet` | ICU plural (one/other) | ICU plural (one/other) | ICU plural (one/few/many/other) | ICU plural (one/other) |

**ICU plural messages (post micro-fix — `contacts` static key removed):**

- `en`: `"{count, plural, one {# contact} other {# contacts}}"`
- `sq`: `"{count, plural, one {# kontakt} other {# kontakte}}"`
- `uk`: `"{count, plural, one {# контакт} few {# контакти} many {# контактів} other {# контактів}}"`
- `it`: `"{count, plural, one {# contatto} other {# contatti}}"`

**UK plural verification:**
| count | category | rendered |
|---|---|---|
| 0 | many | "0 контактів" |
| 1 | one | "1 контакт" |
| 2 | few | "2 контакти" |
| 5 | many | "5 контактів" |
| 21 | one | "21 контакт" |
| 22 | few | "22 контакти" |

---

## Breakpoint/locale verification

Stats row: `flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground`
- **320px:** wraps — price on line 1, views + contacts on line 2, date on line 3. No overflow.
- **375/390px:** may wrap or fit on 2 lines. No truncation.
- **768px+:** all stats on one line.
- **Locales:** `t('contacts')` resolves from the `cabinet` namespace in all 4 locales ✅

---

## No SQL emitted

No new DB objects needed. Existing `events_select_owner` RLS policy enforces owner-only access.

---

## Note 18 Self-Validation

| AC | Status |
|----|--------|
| Owner sees per-listing view + contact counts for THEIR listings only | ✅ RLS + `.eq(listing_owner_id, authUser.id)` |
| Non-owner gets nothing (RLS-enforced) | ✅ `events_select_owner` policy |
| Zero-event listings show `0` | ✅ `?? 0` fallback |
| Query error → graceful fallback | ✅ `contactEvents ?? []` |
| New labels localized sq/en/uk/it | ✅ `contacts` key added ×4 |
| 7 breakpoints in `uk` | ✅ flex-wrap stats row |
| Deferred scope list in session log | ✅ 7 follow-ups listed above |
| No SQL run, no new write paths | ✅ |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run build` → passes | ✅ |
| `npm run lint` → 7/10 baseline | ✅ |
| `npx vitest run` → 390/390 | ✅ |
| No git commands emitted | ✅ |

**Self-validation:** `tsc=0 · build=passes · owner-only RLS · MVP stats shown · locales=4 · breakpoints=7 · scope=clean(MVP) · PASS`

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/app/[locale]/cabinet/page.tsx` | Added `listing_contact_events` query to Promise.all; built `contactCountMap`; passed to CabinetShell | Fetch per-listing contact counts for current owner |
| `src/modules/cabinet/components/CabinetShell.tsx` | Added `contactCountMap?: Record<string, number>` prop; passed to ListingsTab | Thread-through to display layer |
| `src/modules/cabinet/components/ListingsTab.tsx` | Added `contactCountMap` prop; `Phone` icon import; `{contactCountMap?.[listing.id] ?? 0} {t('contacts')}` in stats row | MVP analytics display |
| `messages/en.json` | `cabinet.contact_count` ICU plural (one/other); `cabinet.contacts` removed | Grammatically correct plural (micro-fix) |
| `messages/sq.json` | `cabinet.contact_count` ICU plural (one/other); `cabinet.contacts` removed | Grammatically correct plural (micro-fix) |
| `messages/uk.json` | `cabinet.contact_count` ICU plural (one/few/many/other); `cabinet.contacts` removed | Full Ukrainian plural forms (micro-fix) |
| `messages/it.json` | `cabinet.contact_count` ICU plural (one/other); `cabinet.contacts` removed | Grammatically correct plural (micro-fix) |
| `docs/backlog.md` | Task 285 closure entry | Per contract clause 10 |
| `docs/sessions/2026-05-29-task-285-listing-analytics-mvp.md` | NEW: this session log | Per contract clause 10 |
