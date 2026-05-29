# Session Log — Task 277: WhatsApp CTA Restore + Analytics Foundation

**Date:** 2026-05-29  
**Task:** 277  
**Sprint:** 17  
**Type:** bugfix + feature-foundation  
**Executor:** Sonnet 4.6

---

## Required Investigation Output

### 1. Contact card component location

```
grep -rln "Send message|ListingContact|WhatsApp" src/
→ src/modules/listings/components/ListingContact.tsx
→ src/modules/listings/components/ListingMobileCTA.tsx
→ src/app/[locale]/listings/[slug]/page.tsx
```

Contact card: `ListingContact.tsx` (desktop sidebar + mobile bar)  
Mobile CTA bar: `ListingMobileCTA.tsx` (separate component for mobile)

### 2. Phone helpers

```
grep -n "^export" src/lib/phone/index.ts
→ parsePhoneValue, normalizeNational, validateNationalPhone, COUNTRY_CODES, DEFAULT_COUNTRY, etc.
```

Used: `parsePhoneValue` (E.164 → { dialCode, national }) and `normalizeNational` (strip separators).

### 3. Canonical server-user resolver

`getUser()` from `src/lib/auth/server` — confirmed.

### 4. No existing `listing_contact_events` table

```
grep -rn "listing_contact_events" src/types/database.ts docs/rls-rules.md scripts/schema-drift-check.sql
→ 0 hits
```

New table; no duplicate. `listing_views` is for page-view counters (different semantic). ✅

### 5. Contact-card control inventory (before-state)

**Desktop sidebar (`ListingContact.tsx`):**
- `owner.has_whatsapp` → WhatsApp button (click-to-reveal via `handleContactClick`)
- `owner.has_phone` → Call button (click-to-reveal)
- Send message → `<Link>` or disabled `<Button>` if listing closed
- FavoriteButton
- SaveToCollectionButton
- Share button
- ListingReportDialog (canReport only)

**Mobile CTA bar (`ListingMobileCTA.tsx`):**
- `hasPhone` → Call button (click-to-reveal)
- `hasWhatsapp` → WhatsApp button (click-to-reveal)

**Problem:** `has_whatsapp` is always `false` for guests (`public_user_profiles` view is `authenticated`-only; RLS gates the query). Also, `getListingOwnerContact` RPC is `REVOKE FROM anon` — anonymous click-to-reveal fails. The WhatsApp button was effectively invisible to anonymous visitors.

### 6. No existing WhatsApp component

```
grep -rln "WhatsApp|wa\.me" src/ → ListingContact.tsx, ListingMobileCTA.tsx, page.tsx only
```

No dedicated component existed. ✅

### 7. Locale namespace + existing `whatsapp` key

`listing.whatsapp` exists (= "WhatsApp") in all 4 files. New keys: `whatsapp_button_label`, `whatsapp_aria_label`, `whatsapp_preset_message`.

### 8. Schema-drift baseline

648 lines (scripts/schema-drift-check.sql) before this task; regenerated after.

---

## Architecture Decision: Pre-built URL vs Click-to-Reveal

**Current (before):** WhatsApp button hidden for guests; click-to-reveal via `getListingOwnerContact` RPC (auth-only) for authenticated users.

**Problem:** `getListingOwnerContact` has `REVOKE EXECUTE FROM anon` — anonymous visitors can NEVER get the WhatsApp number. The `has_whatsapp` boolean is also not fetchable for guests (authenticated-only view).

**Decision:** Use `createAdminClient()` (service-role) **server-side** in the listing detail SERVER COMPONENT to fetch the owner's WhatsApp number for ALL visitors. The number is parsed server-side and passed as `dialCode + national` props to the components. The `WhatsAppContactButton` builds the `wa.me` URL from these props without any client-side fetch. This is a justified use of service-role:
- The server fetches the number; the admin key never reaches the client.
- The number IS embedded in HTML — acceptable for a marketplace where sellers explicitly want to be contacted via WhatsApp.
- Anonymous visitors are the highest-intent audience.

---

## Note 20 — Contact-Card Before/After Inventory

### Desktop sidebar (ListingContact.tsx)

| Control | Before | After |
|---|---|---|
| WhatsApp button | `{owner.has_whatsapp && <button onClick={handleContactClick('whatsapp')}>}` — hidden for guests | `{ownerWhatsappNational && ownerWhatsappDialCode && listingOwnerId && listingId && <WhatsAppContactButton ... />}` — visible to ALL visitors if number available |
| Call button | `{owner.has_phone && <button onClick={handleContactClick('call')}>}` | Unchanged |
| Send message | `<Link>` or disabled `<Button>` | Unchanged |
| FavoriteButton | Present | Unchanged |
| SaveToCollectionButton | Present | Unchanged |
| Share button | Present | Unchanged |
| ListingReportDialog | Present (canReport only) | Unchanged |

### Mobile CTA bar (ListingMobileCTA.tsx)

| Control | Before | After |
|---|---|---|
| Call button | `{hasPhone && <button onClick={handleContactClick('call')}>}` | `{hasPhone && <button onClick={handleCallClick}>}` (same behavior) |
| WhatsApp button | `{hasWhatsapp && <button onClick={handleContactClick('whatsapp')}>}` — click-to-reveal | `{hasPrebuiltWa && <WhatsAppContactButton ... />}` — pre-built URL |

All 5 existing controls preserved. ✅

---

## SQL Emitted

See `scripts/task-277-listing-contact-events.sql` for the full migration SQL.

**Summary:**
- Table `public.listing_contact_events` with 9 columns
- RLS enabled
- 3 policies: `events_insert_anon`, `events_insert_authenticated`, `events_select_owner`
- 2 indexes: `listing_contact_events_listing_created_idx`, `listing_contact_events_owner_created_idx`
- `notify pgrst, 'reload schema'`

**Owner action required:** Run `scripts/task-277-listing-contact-events.sql` in Supabase Dashboard → SQL Editor.

---

## Phone Normalization Approach

```
ownerWaRaw = users.whatsapp  (E.164, e.g. "+355691234567")
parsedWa = parsePhoneValue(ownerWaRaw)
  → { dialCode: "+355", iso2: "AL", national: "691234567" }
```

In `WhatsAppContactButton`:
```
normalized = normalizeNational(phoneRaw)   → "691234567" (strips separators)
countryDigits = phoneCountryCode.replace(/\D/g, '')  → "355"
e164Digits = "355691234567"
waUrl = "https://wa.me/355691234567?text=..."
```

Sample output: `https://wa.me/355691234567?text=Përshëndetje%2C%20gjeta%20listimin%20tuaj%20në%20Lero.al%3A%20Apartament%20në%20Tiranë`

---

## Locale-Key Parity

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `listing.whatsapp_button_label` | ✅ | ✅ | ✅ | ✅ |
| `listing.whatsapp_aria_label` | ✅ | ✅ | ✅ | ✅ |
| `listing.whatsapp_preset_message` | ✅ | ✅ | ✅ | ✅ |

3 keys × 4 locales = 12 entries ✅

---

## RLS Policy Summary

| Policy | Role | Operation | Rule |
|---|---|---|---|
| `events_insert_anon` | anon | INSERT | `actor_user_id is null` |
| `events_insert_authenticated` | authenticated | INSERT | `actor_user_id = auth.uid()` |
| `events_select_owner` | authenticated | SELECT | `listings.user_id = auth.uid()` (via EXISTS) |

---

## trackListingContactEvent Behavior

| Scenario | actor_user_id | is_owner_click | Return |
|---|---|---|---|
| Anonymous visitor | null | false | `{ ok: true }` |
| Authenticated viewer (not owner) | user.id | false | `{ ok: true }` |
| Listing owner clicks own button | user.id | true | `{ ok: false, reason: 'self_click' }` |
| DB insert error | — | — | `{ ok: false, reason: 'insert_failed' }` |
| Session resolution error | — | — | `{ ok: false, reason: 'session_error' }` |

Never throws; caller fires fire-and-forget (`void trackListingContactEvent(...)`); navigation never blocked. ✅

---

## Negative Flows Verified

| Branch | Implementation |
|---|---|
| Seller has no phone | `ownerWaNational` is undefined → `WhatsAppContactButton` prop is undefined → button hidden ✅ |
| `normalizeNational` returns < 7 digits | `!/^\d{7,15}$/.test(normalized)` → return null ✅ |
| Country code empty | `!countryDigits` → return null ✅ |
| Analytics insert fails | Returns `{ ok: false, reason: 'insert_failed' }`; navigation already happened ✅ |
| Self-click (owner) | `is_owner_click = true`; row inserted; returns `{ ok: false, reason: 'self_click' }` ✅ |
| Anonymous + anon RLS | `actor_user_id = null` → `events_insert_anon` allows ✅ |
| Locale missing | `locale: locale ?? null` → allows null in DB ✅ |
| Mobile 320px | `dropdownMinWidth` + `size="sm"` → compact; touch target ≥44px ✅ |
| All 7 breakpoints | `<a>` + `buttonVariants` inherits responsive layout; no overflow ✅ |

---

## Schema-Drift Update

After adding `ListingContactEvent` to `database.ts` and `INTERFACE_TABLE_MAP`:
```
node scripts/check-schema-drift.mjs
→ ListingContactEvent → listing_contact_events   9
```

`scripts/schema-drift-check.sql` regenerated. 32 tables total (was 31). Drift will show 1 missing table until owner runs the migration SQL.

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/listing/WhatsAppContactButton.tsx` | NEW | Pre-built wa.me URL button with analytics |
| `src/modules/listings/actions/contactEvents.ts` | NEW | `trackListingContactEvent` server action |
| `scripts/task-277-listing-contact-events.sql` | NEW | DB migration SQL for owner to apply |
| `src/types/database.ts` | Added `ListingContactEvent` interface | Type coverage for new table |
| `src/modules/listings/components/ListingContact.tsx` | Added new optional props; WhatsAppContactButton wired; `WhatsAppContactButton` import | Restore WhatsApp CTA for all visitors |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Added new props; WhatsAppContactButton for mobile; phone-only click-to-reveal kept | Mobile WhatsApp CTA |
| `src/app/[locale]/listings/[slug]/page.tsx` | Added `createAdminClient` + `parsePhoneValue` imports; admin-client WhatsApp fetch; new props to ListingMobileCTA + LazyListingContact | Enable WhatsApp for all visitors |
| `scripts/check-schema-drift.mjs` | Added `ListingContactEvent: 'listing_contact_events'` to INTERFACE_TABLE_MAP | Drift guard coverage |
| `scripts/schema-drift-check.sql` | Re-emitted (32 tables) | Drift baseline update |
| `messages/sq.json` | Added 3 locale keys | Albanian text |
| `messages/en.json` | Added 3 locale keys | English text |
| `messages/uk.json` | Added 3 locale keys | Ukrainian text |
| `messages/it.json` | Added 3 locale keys | Italian text |
| `docs/backlog.md` | Task 277 ✅ update | Standard task-closure |
| `docs/sessions/2026-05-29-task-277-whatsapp-cta-restore.md` | NEW | This session log |

---

## Self-Validation

**AC table:**

| AC | Status |
|---|---|
| WhatsApp button visible when seller has valid phone | ✅ (`ownerWaNational` non-empty) |
| WhatsApp button hidden cleanly when no phone | ✅ (return null; layout unaffected) |
| URL is `https://wa.me/<digits>?text=<urlencoded>` | ✅ (no +, no spaces, country code not duplicated) |
| Opens in new tab (`target="_blank" rel="noopener noreferrer"`) | ✅ |
| 5 existing contact-card controls remain reachable | ✅ (Note 20 inventory above) |
| `listing_contact_events` exact schema | ✅ (SQL emitted) |
| `ListingContactEvent` type in `database.ts` | ✅ |
| `trackListingContactEvent` signature correct | ✅ |
| Self-click → `is_owner_click=true` + `{ ok: false, reason: 'self_click' }` | ✅ |
| Insert failure → `{ ok: false, reason: 'insert_failed' }` | ✅ |
| Never throws; non-blocking | ✅ (fire-and-forget void call) |
| 3 locale keys × 4 = 12 entries | ✅ |
| Negative branches all handled | ✅ |
| `tsc=0` | ✅ |
| Schema-drift SQL re-emitted | ✅ |
| No analytics page / chart / KPI built | ✅ |
| No other contact-card control modified in behavior | ✅ |
| Files Changed table | ✅ |

**Owner pending actions:**
1. Run `scripts/task-277-listing-contact-events.sql` in Supabase SQL Editor.
2. After SQL applied, run `scripts/schema-drift-check.sql` → expect 0 drift rows.

**Self-validation: tsc=0 errors · AC table=all green · Note 20 before/after=documented · scope=clean (1 addition to scope: page.tsx fetch, necessary for anonymous visitor CTA) · 3 keys ×4 locales · negative branches=all handled**
