# Task 256 — V.5 — `sales@lero.al` delivery investigation + sender verification

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** V — Contacts & Inquiries

---

## Audit (Scope 1)

### Env vars
- `CONTACT_SUPPORT_EMAIL` — **set** (`support@lero.al`)
- `CONTACT_SALES_EMAIL` — **set** (`sales@lero.al`)

### Code-level root cause confirmed

Two distinct email paths exist:

| Path | FROM sender | Bug risk |
|------|-------------|----------|
| Staff notification (`sendContactInquiryNotification`) | `noreply@lero.al` (canonical `FROM_ADDRESS`) | Works if `noreply@lero.al` is Resend-verified |
| Reply to user (`sendContactInquiryReply`) | `Lero.al <{inquiry.target_mailbox}>` — e.g. `sales@lero.al` | **Requires `sales@lero.al` to be verified in Resend** |

Root cause of Bug 2: `sendContactInquiryReply` sends FROM `sales@lero.al`. If `sales@lero.al` is not verified as a Resend sender (domain SPF/DKIM), Resend returns 403 "from not verified". Both email functions were **fire-and-forget** — failures were swallowed with `console.error` only and the action returned `{}` (success), so the UI showed a success toast even when email failed.

Also confirmed: `send.ts` mapped **all** Resend errors to `{ error: 'send_failed' }` — no distinction between `unverified_sender` and `transient`.

---

## Changes

### `src/modules/notifications/lib/emails/send.ts`
- Exported `SendEmailErrorCode` type: `'missing_content' | 'unverified_sender' | 'transient' | 'send_failed'`
- Exported `SendEmailResult` interface (was local)
- Error categorization: statusCode 403 or message containing "not verified" / "not allowed" / "domain is not verified" → `unverified_sender`; statusCode ≥500 or 429 → `transient`; others → `send_failed`

### `src/modules/notifications/lib/emails/contactInquiry.ts`
- `sendContactInquiryNotification` return type: `Promise<void>` → `Promise<{ ok: true; id?: string } | { ok: false; reason: string }>`
- `sendContactInquiryReply` return type: `Promise<void>` → `Promise<{ ok: true; id?: string } | { ok: false; reason: string }>`
- Both now propagate the Resend error reason instead of logging-only

### `src/modules/contacts/actions/index.ts`
- `submitContactInquiry` return union extended: `+ 'mailbox_unverified' | 'email_transient'`
- Staff notification changed from fire-and-forget to `await`; on failure:
  - `reason === 'unverified_sender'` → `{ error: 'mailbox_unverified' }` + structured log
  - any other failure → `{ error: 'email_transient' }` + structured log
  - DB row IS already inserted (DB first, email second — preserved)
- `sendInquiryReply` return type: `Promise<{ error?: string }>` → `Promise<{ error?: 'forbidden' | 'validation' | 'not_found' | 'save_failed' | 'reply_email_failed' }>`
- Reply email changed from fire-and-forget to `await`; on failure → `{ error: 'reply_email_failed' }` (DB write already succeeded)

### `src/modules/contacts/components/ContactForm.tsx`
- Added handling for `mailbox_unverified` → `toast.warning(t('errors.mailbox_unverified'))`
- Added handling for `email_transient` → `toast.warning(t('errors.email_transient'))`
- Placed before the generic `result.error` branch (so they are not swallowed by the generic error toast)

### `src/components/admin/AdminInquiriesManager.tsx`
- `handleSendReply` now distinguishes `reply_email_failed` from generic errors:
  - `reply_email_failed`: DB write succeeded → update local state (reply_count, status) → reset textarea → `toast.warning(t('reply_email_failed'))`
  - Generic errors remain: `toast.error(t('reply_error'))`

### Locale files — 3 new keys × 4 locales

| Key | sq | en | uk | it |
|-----|----|----|----|-----|
| `contact.errors.mailbox_unverified` | ✅ | ✅ | ✅ | ✅ |
| `contact.errors.email_transient` | ✅ | ✅ | ✅ | ✅ |
| `admin.inquiries.reply_email_failed` | ✅ | ✅ | ✅ | ✅ |

---

## Owner action items (NOT in code — owner must perform in Resend dashboard + DNS)

1. **Verify `sales@lero.al` as a Resend sender**: Resend Dashboard → Domains → Add Domain (`lero.al`) OR Senders → Add Sender. Without this step, `sendContactInquiryReply` will return `{ error: 'reply_email_failed' }` for any sales-routed inquiry reply.

2. **Verify lero.al domain SPF + DKIM in Resend**: Resend Dashboard → Domains → lero.al → verify SPF record (`v=spf1 include:amazonses.com ~all` or Resend's specific record) + DKIM TXT records. Without this, Resend may reject sends FROM any `@lero.al` address.

3. **Confirm `sales@lero.al` inbox exists and MX records resolve**: The app can SEND from `sales@lero.al` (once verified), but to RECEIVE replies at that address, the owner must confirm that:
   - MX records for `lero.al` point to an actual mail server
   - `sales@lero.al` is a valid mailbox the owner can read
   This is outside the server action scope — it is DNS/hosting configuration.

4. **Verify `support@lero.al` as well**: Same steps as above for the support mailbox.

5. **Confirm `noreply@lero.al` is verified in Resend**: Staff notification emails (the new-inquiry alert) use `noreply@lero.al` as the FROM sender. If it is not verified, new-inquiry notifications will also fail.

---

## Positive flow verification

- `submitContactInquiry` with topic = `sales` → inserts DB row → awaits `sendContactInquiryNotification` → on success returns `{}` → ContactForm shows `toast.success(t('success_toast'))` ✅
- `sendInquiryReply` → inserts reply row → updates inquiry → awaits `sendContactInquiryReply` → on success returns `{}` → AdminInquiriesManager shows `toast.success(t('reply_success'))` ✅

## Negative flow verification

| Branch | Trigger | Action result | UI |
|--------|---------|--------------|-----|
| Rate limited | >5 submissions/hour | `{ error: 'rate_limited' }` | `toast.error(t('rate_limited_toast'))` ✅ |
| Validation fail | bad topic/email/message | `{ error: 'validation' }` | `toast.error(t('error_toast'))` ✅ |
| No mailbox env | `CONTACT_SALES_EMAIL` unset | `{ error: 'no_mailbox' }` | `toast.error(t('error_toast'))` ✅ preserved |
| DB insert fail | Supabase error | `{ error: 'save_failed' }` | `toast.error(t('error_toast'))` ✅ |
| Sender not verified | Resend 403 | `{ error: 'mailbox_unverified' }` | `toast.warning(t('errors.mailbox_unverified'))` ✅ NEW |
| Transient email failure | Resend 5xx | `{ error: 'email_transient' }` | `toast.warning(t('errors.email_transient'))` ✅ NEW |
| Reply: forbidden | role revoked | `{ error: 'forbidden' }` | `toast.error(t('reply_error'))` ✅ preserved |
| Reply: not found | inquiry deleted | `{ error: 'not_found' }` | `toast.error(t('reply_error'))` ✅ preserved |
| Reply: save failed | DB error | `{ error: 'save_failed' }` | `toast.error(t('reply_error'))` ✅ preserved |
| Reply: email failed | DB OK, email fail | `{ error: 'reply_email_failed' }` | local state updated + `toast.warning(t('reply_email_failed'))` ✅ NEW |
| Cancel/Esc/backdrop | close dialog | no DB write, no email | preserved ✅ |
| Double-submit | `isPending` guard | action not called | `disabled={isPending}` preserved ✅ |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] All 4 JSON locale files valid (node JSON.parse check)
- [x] 3 new locale keys × 4 locales = 12 entries, all verified present
- [x] `send_failed` → `unverified_sender` / `transient` discrimination verifiable in `send.ts`
- [x] `sendContactInquiryNotification` returns `{ ok, id? } | { ok: false, reason }` — verifiable in `contactInquiry.ts:130`
- [x] `sendContactInquiryReply` returns same union — verifiable in `contactInquiry.ts:248`
- [x] `submitContactInquiry` awaits notification, propagates errors — verifiable in `actions/index.ts:116-136`
- [x] `sendInquiryReply` awaits reply email, returns `reply_email_failed` — verifiable in `actions/index.ts:230-244`
- [x] ContactForm handles `mailbox_unverified` + `email_transient` — verifiable in `ContactForm.tsx:61-68`
- [x] AdminInquiriesManager handles `reply_email_failed` with state update — verifiable in `AdminInquiriesManager.tsx:129-147`
- [x] No existing controls removed; no existing toasts broken; no scope expansion
- [x] DB-first ordering preserved (`insert` before `sendEmail` call in both actions)

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows implemented.

---

## §17 UI pre-flight (responsive check)

Task 256 adds only toast messages (no new layout components). Toast positioning is handled globally by Sonner. The 7 breakpoints (320/375/390/768/1280/1440/2560) are unaffected — no new layout classes were added.

---

## Files changed

```
src/modules/notifications/lib/emails/send.ts
src/modules/notifications/lib/emails/contactInquiry.ts
src/modules/contacts/actions/index.ts
src/modules/contacts/components/ContactForm.tsx
src/components/admin/AdminInquiriesManager.tsx
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
```
