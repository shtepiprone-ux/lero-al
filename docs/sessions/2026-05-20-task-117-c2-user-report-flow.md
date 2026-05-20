# Session Archive: Task 117 — Epic C.2 — User Report Flow — 2026-05-20

**Epic:** C — Trust, Safety & Moderation  
**Task:** 117 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED (requires DB migration)

---

## ⚠️ Required Database Migration

Run in Supabase SQL editor before deploying:

```sql
CREATE TABLE public.listing_reports (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason     text NOT NULL CHECK (reason IN ('spam','fraud','duplicate','wrong_category','offensive','other')),
  comment    text CHECK (char_length(comment) <= 500),
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (listing_id, user_id)
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_reports_insert_own"
  ON listing_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "listing_reports_select_own"
  ON listing_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "listing_reports_admin_select"
  ON listing_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));

CREATE POLICY "listing_reports_admin_update"
  ON listing_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

---

## Changes

### `src/modules/listings/actions/reportListing.ts` (new)
- Auth guard via `getUser()`
- Validates reason against ReportReason enum
- One-report-per-user-per-listing guard via `.maybeSingle()` lookup
- Inserts with `status: 'pending'` (eslint-disable justified — report status ≠ listing status transition)

### `src/modules/listings/components/ListingReportDialog.tsx` (new)
- Dialog trigger: small ghost button with Flag icon + `report_listing` label
- 6 reason toggle buttons (full-width, single-select)
- Optional Textarea (max 500 chars) with character counter
- Toast: success / already_reported (info) / error

### `src/modules/listings/components/ListingContact.tsx`
- Added `canReport?: boolean` prop
- Imported `ListingReportDialog`
- Renders `<ListingReportDialog>` (right-aligned) when `canReport && listingId`

### `src/app/[locale]/listings/[slug]/page.tsx`
- Passes `canReport={!!authUser && authUser.id !== owner.id}`
- Bonus: removed dead `CLOSED_LABEL` and `isFavoriteClosed` unused vars; removed `isListingClosed` unused import

### `messages/{sq,en,uk,it}.json`
14 new keys in `listing` namespace: `report_dialog_title`, `report_reason_label`, 6 `report_reason_*`, `report_comment_label/placeholder`, `report_submit`, `report_success`, `report_already_reported`, `report_error`

---

## Acceptance Criteria

- [x] Report dialog opens from listing detail page for authenticated non-owners
- [x] 6 reason categories, optional comment
- [x] Server-side: auth check + one-report guard + INSERT
- [x] All 4 locales · lint 0/0 · governance PASS
- [ ] DB migration required (listing_reports table + RLS)
- [ ] npm run build — user's manual step
