# Session Archive: Task 116 — Epic C.1 — Anti-scam Research & Decision — 2026-05-20

**Epic:** C — Trust, Safety & Moderation  
**Task:** 116 (global numbering)  
**Type:** Research / Architecture  
**Status:** ✅ CLOSED

---

## Codebase Inventory

### Existing schema (already typed in `src/types/database.ts`)

| Type | Status |
|---|---|
| `ReportReason` | `'spam' \| 'fraud' \| 'duplicate' \| 'wrong_category' \| 'offensive' \| 'other'` |
| `ReportStatus` | `'pending' \| 'reviewed' \| 'resolved' \| 'dismissed'` |
| `ListingReport` | Full interface: `id, listing_id, user_id, reason, comment, status, created_at` |
| `Conversation` | `id, listing_id, buyer_id, seller_id, created_at` |
| `Message` | `id, conversation_id, sender_id, content, created_at, read_at` |
| `User.status` | `'active' \| 'blocked' \| 'inactive'` — blocking already in schema |
| `User.block_reason` | `string \| null` — reason field exists |

### Existing UI state

| Feature | State |
|---|---|
| "Send message" button | Placeholder link to `/${locale}/messages/new` — **no messages module** |
| "Report" button | Mentioned in Epic C spec as "Поскаржитись" — **not implemented** |
| Admin blocking | `User.status = 'blocked'` exists but no admin UI for setting it with reason |
| Notification bell | Handles `new_message` type — wired but messages don't exist yet |

---

## Protection Model Decision

### Chosen layers for Epic C (this phase)

**Layer 1 — Listing report flow (→ Task C.2)**
- Users can report any listing from the listing detail page
- Report categories: `spam`, `fraud`, `duplicate`, `wrong_category`, `offensive`, `other`
- Optional free-text comment (max 500 chars)
- Requires authentication (anonymous reports rejected)
- DB: `listing_reports` table (type already defined — verify table existence; create migration if needed)
- RLS: authenticated INSERT own reports; admin/moderator SELECT all; users SELECT own

**Layer 2 — Admin moderation dashboard (→ Task C.3)**
- Page at `/admin/reports` listing all `listing_reports` with status/filter
- Status transitions: `pending → reviewed → resolved | dismissed`
- Each transition logged with `actor_id`, `actor_role`, `timestamp`, `notes`
- Moderators can act on reports; admins see everything
- Follows Epic K canonical table pattern

**Layer 3 — Reporter notification (→ Task C.4)**
- When moderator sets status → `resolved` or `dismissed`, reporter receives in-app notification
- Email notification deferred until Epic D (email infrastructure) ships
- Notification type: reuse existing `NotificationType` enum (may need new value)
- Dependency: Epic D.1 must exist for email path

**Layer 4 — Account blocking tools (→ Task C.5)**
- `User.status = 'blocked'` already scaffolded with `block_reason`
- C.5 adds: admin UI to set block with reason, duration, and audit log entry in `user_status_history`
- RLS enforcement: blocked users cannot create listings or initiate conversations
- Regression check: `ListingContact` already handles `deleted_at`; must also handle `blocked` status

### NOT chosen for this phase (deferred)

| Protection | Decision | Rationale |
|---|---|---|
| User-to-user blocking | Deferred | No messaging system exists yet; implement after Epic messaging |
| Automated text filtering | Deferred | No message content to filter; premature for current scale |
| Rate limits per sender | Deferred | No message volume to justify; add when messaging ships |
| Anonymous reports | Rejected | Auth required — prevents spam reporting; Albanian market is small |
| LLM moderation | Rejected | Operational cost and complexity exceed current scale |

---

## Database Requirements

### Task C.2 will need:

```sql
-- listing_reports table (likely already exists since types are defined)
-- Verify existence; if not, create:
CREATE TABLE public.listing_reports (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason     text NOT NULL CHECK (reason IN ('spam','fraud','duplicate','wrong_category','offensive','other')),
  comment    text,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users: insert own report (one per listing per user)
CREATE POLICY "listing_reports_insert" ON listing_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users: read own reports only
CREATE POLICY "listing_reports_own_select" ON listing_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin/moderator: full read + update status
CREATE POLICY "listing_reports_admin_select" ON listing_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));

CREATE POLICY "listing_reports_admin_update" ON listing_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

### Task C.3 will need:

```sql
-- report_actions audit log
CREATE TABLE public.report_actions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id   uuid NOT NULL REFERENCES public.listing_reports(id) ON DELETE CASCADE,
  actor_id    uuid NOT NULL REFERENCES public.users(id),
  actor_role  text NOT NULL,
  old_status  text NOT NULL,
  new_status  text NOT NULL,
  notes       text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_actions_admin" ON report_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

### Task C.5 will use existing schema:
- `users.status` (already: `'active' | 'blocked' | 'inactive'`)
- `users.block_reason` (already: `string | null`)
- `user_status_history` (already: service-role INSERT only)

---

## RLS Boundary Decisions

| Actor | listing_reports | report_actions | user blocking |
|---|---|---|---|
| Anonymous | ❌ no access | ❌ no access | ❌ |
| Authenticated user | INSERT own + SELECT own | ❌ | ❌ |
| Moderator | SELECT all + UPDATE status | SELECT + INSERT | UPDATE status |
| Admin | Full | Full | Full |

---

## Task Numbering (Epic C)

| Task | Global # | Scope |
|---|---|---|
| C.1 — Research (this) | 116 | ✅ Done |
| C.2 — User report flow | 117 | Report Sheet + DB + server action |
| C.3 — Admin complaint dashboard | 118 | `/admin/reports` page + status actions |
| C.4 — Reporter notification | 119 | In-app notification on resolution |
| C.5 — Account blocking tools | 120 | Admin UI + RLS enforcement |
