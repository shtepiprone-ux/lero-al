# Task 251 — GG.1 — Albanian-only outbound email policy

**Date:** 2026-05-28  
**Sprint:** 14  
**Type:** chore (email policy)  
**Status:** ✅ Complete

---

## Problem Statement

Every outbound email via Resend must be sent in Albanian (`sq`) regardless of the recipient's `preferred_locale` or site locale. Owner directive 2026-05-25.

**Trigger bug:** `src/modules/contacts/actions/index.ts` lines 124 and 262 hardcoded `locale: 'en'` in calls to `sendContactInquiryNotification` and `sendContactInquiryReply`.

---

## Audit — All Outbound Email Senders

| File | Before | After | Method |
|------|--------|-------|--------|
| `src/modules/contacts/actions/index.ts:124` | `locale: 'en'` | `locale: 'sq'` | Direct fix (trigger bug) |
| `src/modules/contacts/actions/index.ts:262` | `locale: 'en'` | `locale: 'sq'` | Direct fix (trigger bug) |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | `resolveUserLocale(userId)` → fallback cascade `[locale, 'sq']` | `const locale = 'sq'` always; missing sq → `template_not_found` error (no silent fallback) | Remove resolveUserLocale |
| `src/modules/notifications/lib/emails/emailChange.ts` | `getStrings(opts.locale)` | `getStrings('sq')` — ignores `opts.locale` at helper layer | Force at helper layer |
| `src/modules/cabinet/actions/index.ts:394` | verificationUrl = `${siteUrl}/${data.locale}/auth/confirm-email?token=…` | `${siteUrl}/sq/auth/confirm-email?token=…` | CTA URL → /sq/ |
| `src/modules/cabinet/actions/index.ts:451` | verificationUrl = `${siteUrl}/${data.locale}/auth/confirm-email?token=…` | `${siteUrl}/sq/auth/confirm-email?token=…` | CTA URL → /sq/ |
| `src/modules/listings/actions/reportListing.ts` | `resolveUserLocale(reporterUserId)` | `const locale = 'sq'` | Remove resolveUserLocale |
| `src/app/api/auth-email-hook/route.ts` | `resolveUserLocale(user.id)` | `const locale = 'sq'` | Remove resolveUserLocale |
| `src/app/api/cron/inactivity/route.ts` ×2 | `resolveUserLocale(user.id)` | `const locale = 'sq'` (×2) | Remove resolveUserLocale |
| `src/app/api/cron/saved-searches/route.ts` | `resolveUserLocale(search.user_id)` | `const locale = 'sq'`; searchUrl → `/sq/listings?…` | Remove resolveUserLocale + CTA URL |
| `src/app/api/cron/price-alerts/route.ts` | `resolveUserLocale(fav.user_id)` | `const locale = 'sq'`; listingUrl → `/sq/listings/${slug}` | Remove resolveUserLocale + CTA URL |

---

## resolveUserLocale.ts — Remaining Consumers After Sweep

```
grep -rn "resolveUserLocale" src/ --include="*.ts" --include="*.tsx" | grep -v resolveUserLocale.ts
```

Result:
- `src/modules/admin/actions/index.ts:12,788,851` — **IN-APP notifications only** (for `createNotification` title/body locale), NOT email. Intentionally preserved — in-app notifications may remain user-locale-aware. These are out of scope for the email-only policy.
- `InactivityWarningEmail.tsx:8`, `ReporterNotificationEmail.tsx:7`, `sendTemplatedEmail.ts:4` — JSDoc comment mentions only (no function calls). Fine.

`resolveUserLocale.ts` is marked `@deprecated` with explanation. NOT deleted (reversible).

---

## Admin Email Templates Editor — Control Inventory (Note 22)

**Before (Task 251):**
| Control | State |
|---------|-------|
| 4 locale tabs (sq/en/uk/it) | Visible + clickable |
| Subject field | Editable per locale |
| HTML body textarea | Editable per locale |
| Variables field | Editable per locale |
| Active checkbox | Editable per locale |
| Save button | Active |
| Cancel button | Active |
| Delete button (admin only) | Active |

**After (Task 251):**
| Control | State |
|---------|-------|
| 1 locale tab (sq only) — **other tabs hidden** | Visible + clickable |
| Albanian-only notice (Alert) | New — shown at top of manager |
| Subject field | Unchanged (editing sq only) |
| HTML body textarea | Unchanged (editing sq only) |
| Variables field | Unchanged (editing sq only) |
| Active checkbox | Unchanged |
| Save button | Unchanged — still saves sq (and any non-empty non-sq locales if form state has content) |
| Cancel button | Unchanged |
| Delete button | Unchanged |

Form state for `en/uk/it` in `localeData` still exists in memory. DB rows for other locales are untouched. Reversal: remove `.filter(loc => loc === 'sq')` from the TabsList.

---

## Positive Flow Verification

1. Admin opens `/admin/email-templates` → sees Albanian-only notice (sq/en/uk/it site locales all show the Alert).
2. Admin clicks Edit on a template → only sq tab visible → edits sq body → Save → toast.success → DB persisted.
3. Contact form submitter (any app locale) → staff notification email → Albanian.
4. Admin replies to inquiry → reply email → Albanian.
5. User requests password recovery (preferred_locale=uk) → auth-email-hook fires → locale='sq' → RecoveryEmail renders Albanian.

---

## Negative Flow — Branch Responses

| Branch | Response |
|--------|----------|
| Caller passes non-sq locale to email helper | Helper forces 'sq' — defensive comment in each file |
| sq template row missing in `email_templates` | `sendTemplatedEmail` returns `{ error: 'template_not_found' }` — no silent en/uk/it fallback |
| Recipient has no preferred_locale (contact form) | Already forced to 'sq' — no behavior change |
| Re-send of email after policy change | Next send is 'sq' — no legacy locale path exists |
| Site UI locale: admin on /admin/email-templates in uk locale | Albanian-only notice shows in Ukrainian (via messages/uk.json key) |

---

## Locale Key Added (×4)

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `admin.email_templates.albanian_only_notice` | ✅ | ✅ | ✅ | ✅ |

Site UI messages/*.json key count: +1 per file. No other keys added or removed.

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `locale: 'en'` grep in email contexts | ✅ CLEAN (0 hits) |
| resolveUserLocale in email callers | ✅ 0 email callers remain |
| resolveUserLocale.ts marked deprecated | ✅ |
| sendTemplatedEmail always uses sq | ✅ |
| emailChange.ts forces sq at helper layer | ✅ |
| verificationUrl uses /sq/ path | ✅ (×2 in cabinet/actions) |
| CTA URLs in cron emails use /sq/ | ✅ (saved-searches, price-alerts) |
| Admin editor sq tab only | ✅ `.filter(loc => loc === 'sq')` in TabsList |
| Alert notice in admin editor | ✅ `t('albanian_only_notice')` |
| 4 locale files updated with new key | ✅ sq/en/uk/it |
| docs/integrations.md — Albanian-only policy section | ✅ added |
| docs/ai-behavior.md — cross-reference in Localization Rules | ✅ added |
| No messages/*.json deleted or modified beyond +1 key | ✅ |

**Final verdict:** ✅ PASS — all email senders use 'sq', tsc=0, resolveUserLocale deprecated, admin editor updated, 4 locales, docs updated.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/modules/contacts/actions/index.ts` | `locale: 'en'` → `locale: 'sq'` (×2) | Trigger bug fix |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | Removed `resolveUserLocale` import; always fetches 'sq' template; no silent fallback | Albanian-only policy at DB-driven template layer |
| `src/modules/notifications/lib/emails/emailChange.ts` | `getStrings('sq')` forced at helper layer; comment explaining ignored `opts.locale` | Albanian-only policy at helper layer |
| `src/modules/cabinet/actions/index.ts` | verificationUrl → `/sq/…` (×2) | CTA link policy |
| `src/modules/listings/actions/reportListing.ts` | Removed `resolveUserLocale` import; `const locale = 'sq'` | Reporter notification email → sq |
| `src/app/api/auth-email-hook/route.ts` | Removed `resolveUserLocale` import; `const locale = 'sq'` | Auth emails (verify/recovery/magic/reauth) → sq |
| `src/app/api/cron/inactivity/route.ts` | Removed `resolveUserLocale` import; `const locale = 'sq'` (×2) | Inactivity emails → sq |
| `src/app/api/cron/saved-searches/route.ts` | Removed `resolveUserLocale` import; `const locale = 'sq'`; searchUrl → `/sq/listings?…` | Saved-search alert email → sq; CTA URL |
| `src/app/api/cron/price-alerts/route.ts` | Removed `resolveUserLocale` import; `const locale = 'sq'`; listingUrl → `/sq/listings/${slug}` | Price-alert email → sq; CTA URL |
| `src/modules/notifications/lib/emails/resolveUserLocale.ts` | Added `@deprecated` JSDoc header explaining policy; file NOT deleted | Reversible deprecation |
| `src/components/admin/AdminEmailTemplatesManager.tsx` | Added `Alert` import; `Alert` notice at top of manager; `LOCALES.filter(loc => loc === 'sq')` in TabsList of editor dialog | Admin UI: sq-only tab + notice |
| `messages/sq.json` | Added `admin.email_templates.albanian_only_notice` | Alert notice — sq |
| `messages/en.json` | Added `admin.email_templates.albanian_only_notice` | Alert notice — en |
| `messages/uk.json` | Added `admin.email_templates.albanian_only_notice` | Alert notice — uk |
| `messages/it.json` | Added `admin.email_templates.albanian_only_notice` | Alert notice — it |
| `docs/integrations.md` | Added "Outbound email language policy (Albanian-only, 2026-05-25)" section | Policy documentation |
| `docs/ai-behavior.md` | Added cross-reference line in Localization Rules block | Site UI = 4-locale; email = sq-only |
