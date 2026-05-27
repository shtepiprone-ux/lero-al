# Task 257 — V.6 — Admin inquiry topic translated in detail + list

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** V — Contacts & Inquiries

---

## Audit (Scope 1)

### Root cause confirmed

`AdminInquiriesManager.tsx` — `displaySubject` function (line 113):

```typescript
function displaySubject(inq: InquiryRow): string {
  return inq.topic === 'other' && inq.custom_subject ? inq.custom_subject : inq.topic
}
```

For any topic other than `'other'` with a `custom_subject`, this returns the raw enum string (e.g., `"general"`, `"sales"`). There was no call to `useTranslations` for the topic labels.

### Key namespace decision

Orchestrator pre-decided: **(A)** reuse existing `contact.topics.*` keys. Verified present in all 4 locales:

| Key | en | sq | uk | it |
|-----|----|----|----|----|
| `contact.topics.general` | "General question" | ✅ | ✅ | ✅ |
| `contact.topics.sales` | "Sales" | ✅ | ✅ | ✅ |
| `contact.topics.support` | "Technical support" | ✅ | ✅ | ✅ |
| `contact.topics.partnership` | "Partnership" | ✅ | ✅ | ✅ |
| `contact.topics.press` | "Press" | ✅ | ✅ | ✅ |
| `contact.topics.other` | "Other" | ✅ | ✅ | ✅ |

**0 new locale entries required.**

### Admin Table Preservation inventory

Unchanged controls:
- Status filter row, mailbox filter row, inquiry list, detail dialog, status Combobox, reply Textarea, Send button
- List row subject line (`displaySubject(inq)`) — line 243
- Detail dialog topic field (`displaySubject(selected)`) — line 279
- `topic === 'other'` path: renders `custom_subject` (user text) — preserved

---

## Changes

### `src/components/admin/AdminInquiriesManager.tsx`

1. Added module-level constants:
   ```typescript
   const KNOWN_TOPICS = ['general', 'sales', 'support', 'partnership', 'press', 'other'] as const
   type KnownTopic = typeof KNOWN_TOPICS[number]
   ```

2. Added `useTranslations` call in component body:
   ```typescript
   const tc = useTranslations('contact.topics')
   ```

3. Updated `displaySubject`:
   ```typescript
   function displaySubject(inq: InquiryRow): string {
     if (inq.topic === 'other') {
       return inq.custom_subject ?? tc('other')
     }
     if ((KNOWN_TOPICS as readonly string[]).includes(inq.topic)) {
       return tc(inq.topic as KnownTopic)
     }
     console.warn('[admin] unknown contact topic:', inq.topic)
     return inq.topic
   }
   ```

Both render sites unchanged — they already call `displaySubject(inq)` / `displaySubject(selected)`.

---

## Positive flow verification

- Admin opens `/admin/inquiries` in `en` → list rows show "General question", "Sales", "Technical support", etc. ✅
- Admin opens the detail dialog → topic field shows the localized label ✅
- Same for `sq`, `uk`, `it` locales — `tc` resolves the correct locale at runtime ✅
- Inquiry with `topic = 'other'` + `custom_subject = "Custom text"` → shows "Custom text" in both list + detail ✅

## Negative flow verification

| Branch | Trigger | Result | UI |
|--------|---------|--------|-----|
| `topic === 'other'` + `custom_subject` non-null | normal other inquiry | renders `custom_subject` verbatim | ✅ preserved |
| `topic === 'other'` + `custom_subject` null | data bug | renders `tc('other')` = "Other" | ✅ NEW defensive fallback |
| Unknown topic value | future enum or DB bug | `console.warn` + renders raw value | ✅ NEW defensive fallback |
| Locale switch mid-session | user changes locale | `tc` re-resolves, labels update | ✅ next-intl handles |
| Empty inquiry list | no inquiries | `t('no_inquiries')` empty state | ✅ preserved |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] No new locale entries — `contact.topics.*` already present ×4 (key delta = 0)
- [x] `KNOWN_TOPICS` and `KnownTopic` type defined at module level — verifiable at `AdminInquiriesManager.tsx:62`
- [x] `tc = useTranslations('contact.topics')` — verifiable at `AdminInquiriesManager.tsx:73`
- [x] `displaySubject` updated — verifiable at `AdminInquiriesManager.tsx:113`
- [x] Both render sites (line 243 list, line 279 detail) still call `displaySubject` unchanged
- [x] `topic === 'other'` with non-null `custom_subject` returns `custom_subject` (preserved)
- [x] `topic === 'other'` with null `custom_subject` returns `tc('other')` (new defensive branch)
- [x] Unknown topic returns raw + `console.warn` (no crash)
- [x] No existing controls removed or moved

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows implemented.

---

## §17 UI pre-flight (responsive check)

Task 257 changes only the string returned by `displaySubject` — the rendered element is an existing `<p>` with `truncate`. No new layout classes. The 7 breakpoints (320/375/390/768/1280/1440/2560) are unaffected.

---

## Files changed

```
src/components/admin/AdminInquiriesManager.tsx
```
