# Task 223 — V.2: Admin Inquiries page (list + view + reply via Resend) + status

**Date:** 2026-05-24  
**Epic:** V — Contacts & Inquiries  
**Status:** ✅ Complete — **Epic V CLOSED**

## SQL for Owner (run in Supabase SQL Editor — AFTER Task 222 SQL)

```sql
-- contact_inquiry_replies: reply history for each inquiry
CREATE TABLE IF NOT EXISTS contact_inquiry_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  uuid NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  replied_by  uuid NOT NULL REFERENCES auth.users(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for loading all replies for a set of inquiries
CREATE INDEX IF NOT EXISTS contact_inquiry_replies_inquiry_idx
  ON contact_inquiry_replies (inquiry_id, created_at ASC);

-- Enable RLS
ALTER TABLE contact_inquiry_replies ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "contact_inquiry_replies_admin_all" ON contact_inquiry_replies
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Moderator: read + insert (can send replies; no update/delete)
CREATE POLICY "contact_inquiry_replies_moderator_select" ON contact_inquiry_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

CREATE POLICY "contact_inquiry_replies_moderator_insert" ON contact_inquiry_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );
```

> **Note on INSERT policy**: Even with the moderator INSERT policy, the server actions use `createAdminClient()` (service-role), so RLS is bypassed. The RLS policies here are defense-in-depth.

## Architecture

### Admin actions (src/modules/contacts/actions/index.ts)

| Action | What it does |
|---|---|
| `updateInquiryStatus(id, status)` | Updates `status`, `handled_by`, `handled_at` on the inquiry |
| `sendInquiryReply(id, body)` | Inserts into `contact_inquiry_replies`, increments `reply_count`, sets `handled_by`/`handled_at`, moves status `new→in_progress` if needed; sends reply email fire-and-forget |

### Reply email

- **To** = inquiry.email (the public user)
- **From** = `Lero.al <{inquiry.target_mailbox}>` — staff address as sender (requires `support@lero.al` and `sales@lero.al` to be verified senders in the Resend dashboard)
- **Reply-To** = inquiry.target_mailbox — user's reply goes to the staff mailbox
- Template: inline sq/en/uk/it strings in `contactInquiry.ts`

> **Owner infra**: verify `support@lero.al` and `sales@lero.al` in Resend Dashboard → Domains → Sending addresses. Until verified, the `from` in `sendEmail` falls back to the Resend API error (logged server-side). The DB state (reply inserted, reply_count, handled_by) is updated regardless of email delivery.

### send.ts extension

Added optional `from?: string` param to `sendEmail()`. Defaults to `FROM_ADDRESS` (`noreply@lero.al`) when absent. This is the only place that instantiates Resend — no other code creates `new Resend(...)`.

## Files Changed

| File | Change |
|---|---|
| `src/modules/notifications/lib/emails/send.ts` | Added `from?: string` to `SendEmailParams` |
| `src/modules/notifications/lib/emails/contactInquiry.ts` | Added `sendContactInquiryReply()` with reply HTML template (sq/en/uk/it inline) |
| `src/modules/contacts/actions/index.ts` | Added `updateInquiryStatus()` + `sendInquiryReply()` admin actions |
| `src/components/admin/AdminInquiriesManager.tsx` | NEW — list + filter + detail dialog + reply composer |
| `src/app/admin/inquiries/page.tsx` | NEW — admin page (server component, fetches inquiries + replies) |
| `src/components/admin/AdminSidebar.tsx` | Added "Inquiries" nav item (Inbox icon) to group_management |
| `src/types/database.ts` | Added `ContactInquiryReply` interface (5 cols) |
| `scripts/schema-drift-check.sql` | Added `contact_inquiry_replies` (5 cols) to both RESULT SETs |
| `messages/en.json` | Added `admin.sidebar.item_inquiries` + `admin.pages.inquiries_*` + `admin.inquiries.*` (18 keys) |
| `messages/sq.json` | Same (Albanian) |
| `messages/uk.json` | Same (Ukrainian) |
| `messages/it.json` | Same (Italian) |

## UI Pre-flight §17

- No native `<select>` — status uses `<Combobox variant="button">`, filter uses canonical `<Button>` chips ✅
- All Button sizes via canonical `size=` prop ✅
- Layout: `max-w-5xl mx-auto p-6 lg:p-8` — responsive at all 7 breakpoints ✅
- Dialog: `max-w-2xl max-h-[90vh] overflow-y-auto` — safe on mobile ✅
- Role guard: admin layout redirects non-admin/moderator; actions call `assertAdminOrModerator()` ✅
- `tsc --noEmit` → 0 errors ✅
