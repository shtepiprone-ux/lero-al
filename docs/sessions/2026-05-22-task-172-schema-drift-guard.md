# Task 172 — Sprint 8 — Schema-drift guard: database.ts ↔ live DB

**Date:** 2026-05-22  
**Status:** ✅ Complete

## Problem
`src/types/database.ts` is hand-maintained; DB migrations are applied manually in Supabase.
A column that exists in the types but not in the live DB causes a `PGRST204` error at runtime
(root cause of the `suspended_until` outage, Sprint 7 Issue A).

## Approach (fixed by orchestrator)
Codegen + owner-run SQL. The script never connects to the DB. No new dependencies.

## Files changed

| File | Change |
|---|---|
| `scripts/check-schema-drift.mjs` | New — parser + SQL emitter |
| `scripts/schema-drift-check.sql` | Generated — run in Supabase SQL Editor |
| `package.json` | Added `"check:schema-drift": "node scripts/check-schema-drift.mjs"` |
| `docs/qa-rules.md` | Added §Schema drift check |
| `docs/integrations.md` | Added reference to qa-rules.md §Schema drift check |

## Interface→table map (21 tables, 204 columns)

| Interface | Table | Cols |
|---|---|---|
| User | users | 27 |
| UserChangeLog | user_change_log | 7 |
| UserStatusHistory | user_status_history | 7 |
| EmailChangeToken | email_change_tokens | 7 |
| EmailTemplate | email_templates | 10 |
| Location | locations | 12 |
| Listing | listings | 36 |
| ListingImage | listing_images | 5 |
| Favorite | favorites | 4 |
| SavedSearch | saved_searches | 12 |
| ListingReport | listing_reports | 7 |
| SupportTicket | support_tickets | 6 |
| Notification | notifications | 8 |
| DBCurrency | currencies | 12 |
| DBExchangeProvider | exchange_providers | 11 |
| DBPropertyType | property_types | 10 |
| Page | pages | 7 |
| SiteSetting | site_settings | 3 |
| Company | companies | 4 |
| Collection | collections | 5 |
| RecentlyViewed | recently_viewed | 4 |

## Excluded interfaces

- **No `.from()` call found in src/:** Amenity, ListingAmenity, ListingView, AgentReview, Language, CurrencyRate, NotificationSettings, SupportMessage, Conversation, Message, VerificationRequest — intentionally excluded per kickoff contract (no auto-pluralization guessing).
- **Non-table types:** union/enum types, LocationRequest (JSONB), CollectionWithCount (computed view).

## SQL output path
`scripts/schema-drift-check.sql` — two result sets:
1. Expected-but-missing columns (PGRST204 risk)
2. Informational: DB columns absent from types

## Owner next step
Run `scripts/schema-drift-check.sql` in the Supabase SQL Editor to check current drift state.
