# Task 255 — V.4 — Admin inquiry detail: reply history visible

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** V — Contacts & Inquiries

---

## Audit (Scope 1)

### Root cause confirmed: **(b)** — local state divergence

The SSR page (`src/app/admin/inquiries/page.tsx`) DOES correctly load all replies via `createAdminClient()`:

```typescript
const { data: rawReplies } = await db
  .from('contact_inquiry_replies')
  .select('id, inquiry_id, body, created_at, replied_by, replier:users!replied_by(name)')
  .in('inquiry_id', inquiryIds)
  .order('created_at', { ascending: true })
replies = (rawReplies ?? []) as unknown as ReplyRow[]
```

The `replies` prop is passed to `AdminInquiriesManager`. **The bug:** the component destructures `replies: allReplies` — `allReplies` is a plain constant (the prop value), NOT state:

```typescript
export function AdminInquiriesManager({ inquiries: initialInquiries, replies: allReplies }: Props) {
  // ...
  const selectedReplies = selected
    ? allReplies.filter(r => r.inquiry_id === selected.id)
    : []
```

When `handleSendReply` succeeds, it updates `inquiries` state (reply_count, status) but never appends to `allReplies`, so `selectedReplies` stays stale after send. On re-open, `allReplies` is still the SSR snapshot — which is also why existing replies from BEFORE the page load would appear but replies sent in THIS session would not.

**Ruling out (a):** The SSR page fetches ALL replies for the loaded inquiry set. Verified: `inquiryIds.length > 0` guard is correct; the query runs; `rawReplies ?? []` is passed.

**Ruling out (c):** The page uses `createAdminClient()` (service role), which bypasses RLS entirely. RLS on `contact_inquiry_replies` is not the cause.

### Admin Table Preservation inventory

Controls on `/admin/inquiries`:
- Status filter row: `all / new / in_progress / closed` — button group
- Mailbox filter row: `all / support / sales` — button group (right-aligned)
- Inquiry list: each row shows status badge, mailbox, subject, name · email, date, reply_count icon
- Row click → opens Detail Dialog
- Detail Dialog: metadata grid (From, Topic, Received, Status Combobox), original message block, reply history block, reply composer (Textarea + Send button)
- Existing toasts: `status_updated`, `status_error`, `reply_success`, `reply_error`, `reply_email_failed`
- Empty state: `t('no_inquiries')`
- No pagination visible (limit 200 via SSR)
- Send button disabled when `body < 5 chars` OR `isPending`

All controls unchanged after this fix.

---

## Changes

### `src/modules/contacts/actions/index.ts`

- `sendInquiryReply` return type extended:
  ```typescript
  Promise<{
    error?: 'forbidden' | 'validation' | 'not_found' | 'save_failed' | 'reply_email_failed'
    reply?: { id, inquiry_id, body, created_at, replied_by, replier: { name } | null }
  }>
  ```
- Insert changed from `.insert({...})` to `.insert({...}).select('id, inquiry_id, body, created_at, replied_by')` — returns inserted row
- Guard: `if (insertError || !insertedRows?.[0]) return { error: 'save_failed' }` — covers null return
- Added `actor` fetch: `db.from('users').select('name').eq('id', actorId).single()` for `replier.name`
- `newReply` constructed from `insertedRow + actor.name`
- `reply_email_failed` path now returns `{ error: 'reply_email_failed', reply: newReply }`
- Success path now returns `{ reply: newReply }`

### `src/components/admin/AdminInquiriesManager.tsx`

- Renamed prop destructuring: `replies: allReplies` → `replies: initialReplies`
- Added state: `const [allReplies, setAllReplies] = useState<ReplyRow[]>(initialReplies)`
- `handleSendReply` — `reply_email_failed` branch: appends `result.reply` if present before updating counts
- `handleSendReply` — success branch: appends `result.reply` if present before updating counts
- Reply history section: changed from `{selectedReplies.length > 0 && ...}` to:
  - `selectedReplies.length === 0 && selected.reply_count > 0` → warning banner `t('reply_history_load_failed')`
  - `selectedReplies.length > 0` → renders the reply cards
  - else → `null`

### Locale files — 1 new key × 4 locales

| Key | sq | en | uk | it |
|-----|----|----|----|-----|
| `admin.inquiries.reply_history_load_failed` | ✅ | ✅ | ✅ | ✅ |

---

## Positive flow verification

- Admin lands on `/admin/inquiries` → SSR fetches all inquiries + all replies (for those inquiry IDs) using `createAdminClient()` → `replies` prop passed to `AdminInquiriesManager` → `useState(initialReplies)` seeds `allReplies`
- Admin clicks inquiry row → `openDetail(inquiry)` → `selectedReplies = allReplies.filter(r => r.inquiry_id === selected.id)` → reply history rendered ✅
- Admin sends a reply → `sendInquiryReply` inserts row, fetches actor name, returns `{ reply: newReply }` → `setAllReplies(prev => [...prev, newReply])` → `selectedReplies` updates → new reply appears immediately ✅
- Admin closes dialog → re-opens same inquiry → `allReplies` still contains the appended reply → history shown ✅
- Reply count badge on list row increments immediately ✅

## Negative flow verification

| Branch | Trigger | Result | UI |
|--------|---------|--------|-----|
| Cancel/Esc/backdrop | close dialog | no DB write, no state mutation | preserved ✅ |
| Reply body < 5 chars | `replyBody.trim().length < 5` | Send button disabled | preserved ✅ |
| `{ error: 'validation' }` | server-side validation fail | `toast.error(t('reply_error'))` | preserved ✅ |
| `{ error: 'forbidden' }` | role revoked mid-session | `toast.error(t('reply_error'))` | preserved ✅ |
| `{ error: 'not_found' }` | inquiry deleted concurrently | `toast.error(t('reply_error'))` | preserved ✅ |
| `{ error: 'save_failed' }` | DB insert error | `toast.error(t('reply_error'))` | preserved ✅ |
| `{ error: 'reply_email_failed' }` | DB OK, email fail | reply appended to `allReplies`; counts updated; `toast.warning(t('reply_email_failed'))` | ✅ NEW — reply now visible |
| Reply count > 0 but `allReplies` empty | SSR/RLS load failure | `t('reply_history_load_failed')` warning banner | ✅ NEW |
| Double-submit | `isPending` guard | Send disabled | preserved ✅ |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] All 4 JSON locale files valid — `reply_history_load_failed` present in sq/en/uk/it after `reply_email_failed`
- [x] `sendInquiryReply` return type includes `reply?` field — verifiable at `actions/index.ts:177`
- [x] `insertedRows[0]` guard prevents null-dereference — verifiable at `actions/index.ts:208`
- [x] `allReplies` now `useState(initialReplies)` — verifiable at `AdminInquiriesManager.tsx:75`
- [x] `setAllReplies` called in both success and `reply_email_failed` branches — verifiable at `AdminInquiriesManager.tsx:133,160`
- [x] Error banner condition: `selectedReplies.length === 0 && selected.reply_count > 0` — verifiable in reply history section
- [x] All existing toasts preserved — no toast keys removed
- [x] Send button disabled condition `isPending || replyBody.trim().length < 5` unchanged
- [x] Dialog close/Esc behavior unchanged — `closeDetail()` still called via `onOpenChange`

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows implemented.

---

## §17 UI pre-flight (responsive check)

Task 255 adds one new warning banner in the reply history section. Same `border-status-warning/40 bg-status-warning/5` token pattern already used in the admin area. No new layout classes. The 7 breakpoints (320/375/390/768/1280/1440/2560) are unaffected.

---

## Files changed

```
src/modules/contacts/actions/index.ts
src/components/admin/AdminInquiriesManager.tsx
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
```
