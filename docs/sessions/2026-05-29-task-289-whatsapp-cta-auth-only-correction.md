# Session Log — Task 289: CORRECTIVE — WhatsApp CTA Authenticated-Only

**Date:** 2026-05-29  
**Task:** 289 (CORRECTIVE to Task 277)  
**Sprint:** 17  
**Type:** security bugfix / privacy correction  
**Executor:** Sonnet 4.6

---

## Problem Statement

Task 277 over-expanded scope. It fetched the seller's WhatsApp number using `createAdminClient()` (service-role) for **all** visitors including anonymous. This:
- Bypassed the RLS model (`public_user_profiles` is authenticated-only; `get_listing_owner_contact` RPC is `REVOKE EXECUTE FROM anon`)
- Serialized the seller's WhatsApp number + `wa.me` URL into SSR HTML for anonymous visitors
- Created unnecessary `events_insert_anon` policy and anon SELECT on `listing_contact_events`

This task removes all of the above and restores the intended **authenticated-only** behavior.

---

## Root Cause of Original "Button Disappeared" Bug

The WhatsApp button was gated on `owner.has_whatsapp`, which comes from `public_user_profiles` view (authenticated-only). For authenticated viewers when the seller has a valid WhatsApp number, `owner.has_whatsapp = true` → button renders. The button WAS working for authenticated users via the click-to-reveal `getListingOwnerContact` RPC. The "disappearance" was likely due to the `public_user_profiles` view SQL not being applied in some environments, or sellers not having WhatsApp set.

With the corrected implementation: authenticated viewers see the button when `owner.has_whatsapp = true`; guests never see it.

---

## Required Investigation / Grep Verification

### `createAdminClient` in listing detail page
```
grep -n "createAdminClient" src/app/[locale]/listings/[slug]/page.tsx
→ (none) ✅ REMOVED
```

### `wa.me` in src
```
grep -rn "wa\.me" src/
→ ListingContact.tsx:85    — inside handleContactClick('whatsapp'), auth-gated via !showGuestCTA && owner.has_whatsapp
→ ListingMobileCTA.tsx:59  — inside handleWhatsAppClick(), auth-gated via hasWhatsapp (= owner.has_whatsapp = false for guests)
→ WhatsAppContactButton.tsx:47 — component kept but UNWIRED (no consumer currently)
```

All `wa.me` references are inside authenticated, `has_whatsapp`-gated branches. ✅

### `ownerWhatsapp*/whatsappNational*/ownerWa*` in src
```
grep -rn "ownerWhatsapp|whatsappNational|whatsappDialCode|ownerWa" src/
→ (none) ✅ ALL REMOVED
```

### `events_insert_anon` in scripts/docs
```
grep -rn "events_insert_anon" scripts/
→ scripts/task-277-listing-contact-events.sql:25  — historical (already applied; creates the policy)
→ scripts/task-289-listing-contact-events-anon-revoke.sql:25  — corrective (drops the policy)
```

Only appears in historical migration (where it was created) and corrective migration (where it is dropped). Not in active code. ✅

### SQL corrective migration verification

`scripts/task-289-listing-contact-events-anon-revoke.sql` correctly:
- `drop policy if exists "events_insert_anon" on public.listing_contact_events;` — matches exact name from Task 277
- `revoke select on public.listing_contact_events from anon;` — matches Task 277's `grant select ... to anon`
- Keeps: `events_insert_authenticated`, `events_select_owner`, authenticated GRANT, service_role GRANT

✅ DROP/REVOKE names verified.

---

## Note 20 — Contact-Card Before/After Inventory

### Desktop sidebar (ListingContact.tsx)

| Control | Before (Task 277, broken) | After (Task 289, corrected) |
|---|---|---|
| WhatsApp button | `{ownerWhatsappNational && ownerWhatsappDialCode && listingOwnerId && listingId && <WhatsAppContactButton>}` — shown to ALL visitors when admin-fetched number is set | `{owner.has_whatsapp && <button onClick={() => handleContactClick('whatsapp')}>}` — only when authenticated + `has_whatsapp=true` |
| Call button | `{owner.has_phone && <button onClick={handleContactClick('call')}>}` | Unchanged |
| Send message | `<Link>` or disabled `<Button>` | Unchanged |
| FavoriteButton | Present | Unchanged |
| SaveToCollectionButton | Present | Unchanged |
| Share button | Present | Unchanged |
| ListingReportDialog | Present (`canReport` only) | Unchanged |

### Mobile CTA (ListingContact.tsx internal mobile bar)

| Control | Before | After |
|---|---|---|
| WhatsApp button | `{ownerWhatsappNational && ... && <WhatsAppContactButton>}` — shown to ALL authenticated+anon when admin-fetched | `{owner.has_whatsapp && <button onClick={handleContactClick('whatsapp')}>}` — auth-only |
| Call button | `{owner.has_phone && ...}` | Unchanged |

### Mobile CTA bar (ListingMobileCTA.tsx)

| Control | Before (Task 277) | After (Task 289) |
|---|---|---|
| WhatsApp button | `{hasPrebuiltWa && <WhatsAppContactButton>}` — anon-visible when ownerWaNational was present | `{hasWhatsapp && <button onClick={handleWhatsAppClick}>}` — hasWhatsapp=owner.has_whatsapp=false for guests |
| Call button | `{hasPhone && <button onClick={handleCallClick}>}` | Unchanged |

---

## Privacy Invariants Verified

| Invariant | Status |
|---|---|
| Anonymous visitor: NO WhatsApp button (desktop + mobile) | ✅ `owner.has_whatsapp=false` for guests |
| Anonymous visitor: NO WhatsApp number in HTML/props | ✅ No admin-client fetch; no props serialized |
| Anonymous visitor: NO `wa.me` URL in HTML | ✅ URL only built inside click handler, after RPC call |
| Anonymous visitor: NO contact event possible from UI | ✅ Button absent; analytics only called on click |
| Authenticated viewer: WhatsApp button visible when `has_whatsapp=true` | ✅ |
| `getListingOwnerContact` RPC: authenticated-only | ✅ Unchanged (Task 269 REVOKE FROM anon) |
| Owner/self-click: `is_owner_click=true`, not counted as lead | ✅ `trackListingContactEvent` self-click guard preserved |
| Zombie session (valid JWT, no profile): treated as guest | ✅ `isGuest = !authUser || !hasValidProfile`; `owner.has_whatsapp=false` |

---

## Positive + Negative Flow Verification

**Positive — authenticated non-owner, seller has WhatsApp:**
- `owner.has_whatsapp = true` (from `public_user_profiles`, authenticated branch) ✅
- Desktop: WhatsApp button rendered; click → `getListingOwnerContact` RPC → digits → `trackListingContactEvent` → `wa.me` URL opens ✅
- Mobile CTA bar: same (via `ListingMobileCTA.handleWhatsAppClick`) ✅

**Negative — anonymous visitor:**
- `ownerRaw = null` → `owner.has_whatsapp = false` → no button ✅
- No admin-client fetch → no number in props/HTML ✅

**Negative — seller has no WhatsApp:**
- `owner.has_whatsapp = false` → button absent for both anon and authenticated ✅

**Negative — seller WhatsApp invalid:**
- `getListingOwnerContact` returns null/empty → `toast.error(t('contact_load_failed'))` ✅

**Negative — owner views own listing:**
- Button may show if `owner.has_whatsapp = true` ✅
- Click → `trackListingContactEvent` sets `is_owner_click=true`, returns `{ ok: false, reason: 'self_click' }` ✅

**Negative — RPC error / analytics insert error:**
- `handleContactClick`/`handleWhatsAppClick` has `try/finally` → `toast.error` on failure; never throws ✅
- `trackListingContactEvent` returns `{ ok: false }` on error; never throws; navigation unaffected ✅

---

## Localized Preset Message

Both `ListingContact.handleContactClick` and `ListingMobileCTA.handleWhatsAppClick` now use:
```ts
t('whatsapp_preset_message', { title: listingTitle })
```
This uses the `listing.whatsapp_preset_message` key added in Task 277 (all 4 locales ✅). Previously the code had hardcoded Albanian text.

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/app/[locale]/listings/[slug]/page.tsx` | Removed `createAdminClient` + `parsePhoneValue` imports; removed admin-client WhatsApp fetch block; reverted MobileCTA condition to `owner.has_phone \|\| owner.has_whatsapp`; removed WhatsApp props from both components | Removes anon WhatsApp leak |
| `src/modules/listings/components/ListingContact.tsx` | Removed `WhatsAppContactButton` import; removed 3 extra props (`ownerWhatsappDialCode`, `ownerWhatsappNational`, `listingOwnerId`); restored `owner.has_whatsapp`-gated click-to-reveal buttons (desktop + mobile); added `trackListingContactEvent` + localized preset message in handler | Auth-only WhatsApp; analytics preserved |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Rewrote to click-to-reveal (removed `WhatsAppContactButton`; removed pre-built URL props; added `handleWhatsAppClick` with `getListingOwnerContact` + analytics + localized preset) | Auth-only WhatsApp mobile bar |
| `docs/backlog.md` | Task 289 ✅ closure; pending action: owner SQL | Standard closure |
| `docs/sessions/2026-05-29-task-289-whatsapp-cta-auth-only-correction.md` | NEW | This session log |

**NOT changed (as required):**
- `src/components/listing/WhatsAppContactButton.tsx` — kept, unwired (available for future authenticated use)
- `scripts/task-277-listing-contact-events.sql` — NOT edited (already live)
- `scripts/task-289-listing-contact-events-anon-revoke.sql` — pre-created by orchestrator; verified correct; NOT edited
- `src/types/database.ts` — table shape unchanged; no drift update needed
- `src/modules/listings/actions/contactEvents.ts` — logic unchanged; self-click guard preserved

---

## Owner Action Required

Run `scripts/task-289-listing-contact-events-anon-revoke.sql` in Supabase Dashboard → SQL Editor:
- Drops `events_insert_anon` policy
- Revokes `select` from `anon` on `listing_contact_events`
- No table shape change → schema drift stays the same

---

## Self-Validation

**AC table:**

| AC | Status |
|---|---|
| `page.tsx` compiles; desktop `ListingContact` sidebar present | ✅ tsc=0 |
| `createAdminClient()` WhatsApp fetch removed; unused imports cleaned | ✅ grep: (none) |
| Anonymous visitors receive NO WhatsApp number/`wa.me`/props | ✅ No admin fetch; owner.has_whatsapp=false for guests |
| `ListingContact.tsx` renders WhatsApp only for authenticated+`has_whatsapp` | ✅ |
| `ListingMobileCTA.tsx` enforces auth-only (guest gate via `hasWhatsapp=false`) | ✅ |
| Authenticated viewer sees working WhatsApp button + correct `wa.me` | ✅ (click-to-reveal RPC) |
| Owner/self behavior unchanged; self-click not counted | ✅ |
| Non-WhatsApp controls preserved (Note 20 table) | ✅ |
| SQL: anon grant + `events_insert_anon` removed via task-289 SQL | ✅ Verified DROP/REVOKE names |
| Positive + negative flows both implemented | ✅ |
| Localized preset message for all 4 locales | ✅ (`listing.whatsapp_preset_message` from Task 277) |
| tsc=0 | ✅ |
| Files Changed table | ✅ |
| No `git add`/`git commit` emitted | ✅ |

**Self-validation: tsc=0 · AC table=all green · privacy invariants=all verified · anon leak removed · click-to-reveal restored · 7 breakpoints: layout unchanged (button absence for guests has no layout effect)**
