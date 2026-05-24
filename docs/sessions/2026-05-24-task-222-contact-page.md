# Task 222 — V.1: Public Contacts page + inquiry form + routing + persistence

**Date:** 2026-05-24  
**Epic:** V — Contacts & Inquiries  
**Status:** ✅ Complete

## SQL for Owner (run in Supabase SQL Editor)

```sql
-- contact_inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  topic          text NOT NULL,
  custom_subject text NULL,
  name           text NOT NULL,
  email          text NOT NULL,
  message        text NOT NULL,
  target_mailbox text NOT NULL,
  requester_ip   text NULL,
  status         text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'in_progress', 'closed')),
  handled_by     uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at     timestamptz NULL,
  reply_count    int NOT NULL DEFAULT 0
);

-- Index for rate-limit lookup (IP + created_at)
CREATE INDEX IF NOT EXISTS contact_inquiries_ip_idx
  ON contact_inquiries (requester_ip, created_at DESC)
  WHERE requester_ip IS NOT NULL;

-- Index for admin list (status, created_at)
CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx
  ON contact_inquiries (status, created_at DESC);

-- Enable RLS
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "contact_inquiries_admin_all" ON contact_inquiries
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Moderator: read + update (no insert, no delete)
CREATE POLICY "contact_inquiries_moderator_select" ON contact_inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

CREATE POLICY "contact_inquiries_moderator_update" ON contact_inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- Public INSERT is intentionally BLOCKED — the server action uses service-role (createAdminClient).
-- No anon/authenticated INSERT policy = table is insert-only via backend.
```

## Required Env Vars (add to .env.local + Vercel/Cloudflare)

```
CONTACT_SUPPORT_EMAIL=support@lero.al   # Recipient for general/support/other topics
CONTACT_SALES_EMAIL=sales@lero.al       # Recipient for sales/partnership/press topics
```

`CONTACT_SALES_EMAIL` falls back to `CONTACT_SUPPORT_EMAIL` if absent. If `CONTACT_SUPPORT_EMAIL` is missing, the server action returns `no_mailbox` and logs an error (graceful degradation — form submits but no email is sent; the row is still persisted).

## Architecture

### Topic → mailbox routing

| Topic | Mailbox |
|---|---|
| general | support |
| sales | sales |
| support | support |
| partnership | sales |
| press | sales |
| other | support |

### Rate limiting

IP-based: count rows in `contact_inquiries` with matching `requester_ip` in the last hour. Max 5 per hour per IP. If IP is `unknown` (header absent), rate limit is bypassed (edge case, not common).

### Email flow

Server action uses `createAdminClient()` (service-role) to INSERT the row — no public INSERT RLS policy needed. On success, fires a staff notification email via `sendContactInquiryNotification()`:
- To = `target_mailbox` (staff email from env)
- Reply-To = submitter's email (staff reply goes directly to user)
- From = `noreply@lero.al` (FROM_ADDRESS)

No acknowledgement email to the submitter (consistent with spec; "if it adds risk, STOP").

`sendEmail()` extended with optional `replyTo?: string` field → passed to Resend SDK as `replyTo`.

## Files Changed

| File | Change |
|---|---|
| `src/modules/notifications/lib/emails/send.ts` | Added `replyTo?: string` to `SendEmailParams`; passed to Resend `.send()` |
| `src/modules/notifications/lib/emails/contactInquiry.ts` | NEW — staff notification email template (inline sq/en/uk/it strings) |
| `src/modules/contacts/actions/index.ts` | NEW — `submitContactInquiry` server action |
| `src/modules/contacts/components/ContactForm.tsx` | NEW — RHF form with Combobox topic selector + conditional custom subject |
| `src/app/[locale]/contact/page.tsx` | NEW — public contact page (server component, metadata, all 4 locales) |
| `src/components/layout/Footer.tsx` | Added `/{locale}/contact` "Contacts" link in Information nav column |
| `src/types/database.ts` | Added `ContactStatus` type + `ContactInquiry` interface (14 cols) |
| `scripts/schema-drift-check.sql` | Added `contact_inquiries` (14 cols) to both RESULT SETs |
| `docs/env.md` | Documented `CONTACT_SUPPORT_EMAIL` + `CONTACT_SALES_EMAIL` |
| `messages/en.json` | Added `nav.contacts` + `contact.*` namespace (29 keys + 6 topic keys) |
| `messages/sq.json` | Same (Albanian) |
| `messages/uk.json` | Same (Ukrainian) |
| `messages/it.json` | Same (Italian) |

## UI Pre-flight §17

- No native `<select>` — topic uses `<Combobox variant="button">` ✅
- All Button sizes via canonical `size=` prop (no ad-hoc `h-*`) ✅
- All breakpoints: container-wide + max-w-2xl → responsive at 320/375/390/768/1280/1440/2560 ✅
- Touch targets: Submit button `size="lg"` = h-9 (form context, not primary CTA) ✅
- z-index: no new layers ✅
- `tsc --noEmit` → 0 errors ✅
