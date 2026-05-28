# Task 252 — V.3 — Admin sales/support inbox split

**Date:** 2026-05-28  
**Sprint:** 14  
**Type:** feature (admin UI)  
**Status:** ✅ Complete

---

## Problem Statement

Owner directive 2026-05-25: emails to `sales@lero.al` had no dedicated admin reading section. Single `/admin/inquiries` page showed all mailboxes mixed. Required: split into "Support" and "Sales" views with dedicated sidebar entries.

**Dependencies (both ✅ before this task):**
- Task 251 (GG.1): Albanian-only email policy → reply emails now in sq regardless of test user locale
- Task 256 (V.5): `sales@lero.al` + `support@lero.al` verified in Resend

---

## Control Inventory Before (Note 22 — Admin Table Preservation)

Current `/admin/inquiries` surface:

| Control | Description |
|---------|-------------|
| Status filter buttons | All / new / in_progress / closed — client-side filter |
| Mailbox filter buttons | All / support / sales — client-side filter |
| Inquiry rows | Clickable → opens detail Dialog |
| Detail dialog | Shows from/name/email, topic, date, status switcher |
| Status switcher (Combobox) | Changes inquiry status via `updateInquiryStatus` server action |
| Reply composer (Textarea + Send button) | Sends reply via `sendInquiryReply` server action |
| Reply history | Shows previous replies + load-fail banner |

---

## Scope Decision: Route Split Strategy

Per kickoff: "old `/admin/inquiries` either redirects to `/support` (preserving external links) OR is removed — pick redirect".

**Choice: redirect.** `src/app/admin/inquiries/page.tsx` now calls `redirect('/admin/inquiries/support')`. External links to the old URL continue to work.

---

## Changes Made

### 1. `src/app/admin/inquiries/page.tsx` — converted to redirect
Replaces the full SSR page with a `redirect('/admin/inquiries/support')`. Choice documented above.

### 2. `src/app/admin/inquiries/support/page.tsx` — new (created)
- Fetches only inquiries where `target_mailbox NOT ILIKE '%sales%'` (server-side scope)
- Passes `mailboxScope="support"` to `AdminInquiriesManager`
- Page title: `t('inquiries_support_title')` — ×4 locales

### 3. `src/app/admin/inquiries/sales/page.tsx` — new (created)
- Fetches only inquiries where `target_mailbox ILIKE '%sales%'` (server-side scope)
- Passes `mailboxScope="sales"` to `AdminInquiriesManager`
- Page title: `t('inquiries_sales_title')` — ×4 locales

### 4. `src/components/admin/AdminInquiriesManager.tsx`
- Added `mailboxScope?: 'support' | 'sales'` prop
- When `mailboxScope` is set: mailbox filter buttons hidden (Note 21 — route IS the filter)
- When `mailboxScope` is set: client-side `filtered` skips mailbox check (data pre-filtered server-side)
- All other controls (status filter, row click, detail dialog, reply composer, status switcher, reply history) — **unchanged**

### 5. `src/components/admin/AdminSidebar.tsx`
- Removed `{ href: '/admin/inquiries', label: t('item_inquiries'), icon: Inbox }` (single entry)
- Added `{ href: '/admin/inquiries/support', label: t('item_inquiries_support'), icon: LifeBuoy }`
- Added `{ href: '/admin/inquiries/sales', label: t('item_inquiries_sales'), icon: TrendingUp }`
- Updated imports: `Inbox` removed, `LifeBuoy` and `TrendingUp` added
- `isActive` function unchanged — `pathname.startsWith(href)` works correctly for both new specific paths

### 6. `messages/*.json` — locale keys added ×4

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `admin.sidebar.item_inquiries_support` | Mbështetje | Support | Підтримка | Supporto |
| `admin.sidebar.item_inquiries_sales` | Shitje | Sales | Продажі | Vendite |
| `admin.pages.inquiries_support_title` | Kërkesat e Mbështetjes | Support Inquiries | Запити підтримки | Richieste di supporto |
| `admin.pages.inquiries_sales_title` | Kërkesat e Shitjeve | Sales Inquiries | Запити продажів | Richieste di vendita |

---

## Control Inventory After (Note 22 — every control still reachable)

| Control | After | Verdict |
|---------|-------|---------|
| Status filter buttons | On both /support and /sales | ✅ Preserved |
| Mailbox filter buttons | Hidden (route IS the filter — Note 21 relocation) | ✅ Legitimately replaced by route split |
| Inquiry rows | On both /support and /sales | ✅ Preserved |
| Detail dialog | On both pages | ✅ Preserved |
| Status switcher | On both pages | ✅ Preserved |
| Reply composer | On both pages | ✅ Preserved |
| Reply history | On both pages | ✅ Preserved |

**Only legitimate removal:** mailbox filter buttons — replaced by the route split, documented. All other controls remain reachable.

---

## From-Address Routing Verification (V.2 still correct)

`sendInquiryReply` in `src/modules/contacts/actions/index.ts:259`:
```typescript
fromMailbox: inquiry.target_mailbox,
```
`target_mailbox` is stored at inquiry creation time (V.1 / Task 222). `sendContactInquiryReply` uses `from: \`Lero.al <${opts.fromMailbox}>\`` → From-address matches the inquiry's mailbox regardless of which admin page triggered the reply.

- Reply from `/admin/inquiries/support` → inquiry.target_mailbox = `support@lero.al` → sent FROM `support@lero.al` ✅
- Reply from `/admin/inquiries/sales` → inquiry.target_mailbox = `sales@lero.al` → sent FROM `sales@lero.al` ✅

No code change needed (V.2 wiring already correct per Task 256 session log).

---

## Albanian Email Policy (Task 251 cross-check)

`sendContactInquiryReply` in contacts/actions:
- `locale: 'sq'` — fixed by Task 251 (was `locale: 'en'` before this sprint)
- All replies arrive in Albanian regardless of admin's locale or test user's `preferred_locale` ✅

---

## Positive Flow Trace (Note 19)

1. Admin opens sidebar → sees "Mbështetje" (sq) / "Support" (en) and "Shitje" / "Sales" entries
2. Clicks "Support" → `/admin/inquiries/support` → only support-mailbox rows loaded
3. Status filter "new" → shows only new support rows
4. Clicks a row → detail dialog opens with status switcher + reply composer
5. Types reply → Send → `sendInquiryReply` → reply email from `support@lero.al` in Albanian → toast.success
6. Same flow on `/admin/inquiries/sales` → FROM `sales@lero.al` ✅
7. Old link `/admin/inquiries` → redirect to `/admin/inquiries/support` ✅

---

## Negative Flow

| Branch | Response |
|--------|----------|
| Cancel/Esc in detail dialog | No DB write; dialog closes |
| Reply < 5 chars | Send button disabled (existing guard) |
| Reply email fails (mailbox_unverified) | DB write succeeded → `toast.warning(t('reply_email_failed'))` (existing) |
| Double-submit | `isPending` guard (existing) |
| Scope has 0 inquiries | Empty state: `t('no_inquiries')` (existing) |
| Admin visits old `/admin/inquiries` | Redirect to `/admin/inquiries/support` |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| Two new routes created | ✅ `/admin/inquiries/support/page.tsx` + `/admin/inquiries/sales/page.tsx` |
| Old page redirects | ✅ `redirect('/admin/inquiries/support')` |
| Sidebar has 2 new entries, old removed | ✅ LifeBuoy + TrendingUp icons |
| `mailboxScope` prop on AdminInquiriesManager | ✅ hides mailbox filter when set |
| Server-side scope filtering | ✅ `.not(...ilike...%sales%)` / `.ilike(...%sales%)` |
| From-address routing unchanged | ✅ `inquiry.target_mailbox` passed to `sendContactInquiryReply` |
| Albanian email (Task 251) | ✅ `locale: 'sq'` in contacts/actions |
| 4 locale keys × 4 files | ✅ sidebar + page titles |
| No messages/*.json keys deleted | ✅ |
| All existing controls preserved or legitimately relocated | ✅ only mailbox filter replaced by route split |

**Final verdict:** ✅ PASS — route split done, server-side scoping correct, From-address routing unchanged, all controls reachable, tsc=0.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/app/admin/inquiries/page.tsx` | Replaced with redirect to `/admin/inquiries/support` | Preserves external links; V.3 split |
| `src/app/admin/inquiries/support/page.tsx` | New — SSR page for support mailbox scope | V.3 split — support inbox |
| `src/app/admin/inquiries/sales/page.tsx` | New — SSR page for sales mailbox scope | V.3 split — sales inbox |
| `src/components/admin/AdminInquiriesManager.tsx` | Added `mailboxScope` prop; hides mailbox filter when set; skip client-side mailbox filter when scope set | Route IS the filter (Note 21 relocation) |
| `src/components/admin/AdminSidebar.tsx` | Replaced single inquiries entry with 2 scoped entries; `LifeBuoy` + `TrendingUp` icons | Two dedicated sidebar entries |
| `messages/sq.json` | Added 4 keys: `item_inquiries_support/sales` + `inquiries_support/sales_title` | Locale parity sq |
| `messages/en.json` | Added 4 keys | Locale parity en |
| `messages/uk.json` | Added 4 keys | Locale parity uk |
| `messages/it.json` | Added 4 keys | Locale parity it |
