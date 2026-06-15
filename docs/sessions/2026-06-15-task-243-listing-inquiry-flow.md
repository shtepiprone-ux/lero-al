# Task 243 — Epic BB.2: Working listing→owner inquiry flow (Path A, minimal)

**Date:** 2026-06-15
**Epic:** BB — Listing Inquiries: Report & Message (BB.2; sibling Task 242 = BB.1 report button)
**Status:** ✅ Complete (Path A only, per owner decision — Path B chat remains forbidden)

## Rework addendum (2026-06-15, post orchestrator review)

The orchestrator review (`tasks/Epics/Epic_BB_Task_243_REWORK_orchestrator_review.md`) found 2 hard
fails + 1 evidence gap + 1 must-confirm. All resolved as follows:

1. **SQL idempotency (hard fail)** — the SQL block below now `DROP POLICY IF EXISTS` before each
   `CREATE POLICY`, so the whole script is safely re-runnable.
2. **`email_transient` UX (hard fail)** — **owner decision (2026-06-15): treat as partial success,
   not a retryable error.** The inquiry row is already persisted before the email send is attempted,
   so re-prompting "try again" risked a duplicate `listing_inquiries` row (no dedup guard exists).
   Changed: `ListingInquiryDialog.tsx` now closes the dialog + resets fields + shows a **success-style**
   toast (`toast.success`, not `toast.warning`) on `email_transient`. Replaced the
   `inquiry_error_email_transient` key with `inquiry_success_email_pending` in sq/en/uk/it — wording
   conveys "Inquiry received. The owner notification email may be delayed." (no "try again" language).
   The `submitListingInquiry` action's return shape is unchanged (`{error:'email_transient'}` remains
   the internal signal that "row persisted, email failed"); only the dialog's UI interpretation of
   that signal changed, per the owner's call.
3. **Evidence gap (AC #9 / clause 12)** — also surfaced a **3rd hard issue while investigating**:
   `DialogContent className="max-w-sm"` (unscoped) capped the popup to 24rem at ALL breakpoints,
   including <640px — defeating the full-width bottom-sheet (the exact Sprint 32 `layout:'centered'`
   trap the reviewer warned about). **Fixed: `className="sm:max-w-sm"`** (scoped to ≥640px only,
   matching the canonical `Dialog`'s own `sm:` breakpoint convention). New open-dialog rendered matrix
   captured below at uk@320/375/390 + sq/en/it@375 — confirms edge-to-edge full-width sheet, drag
   handle, rounded top corners, full-width stacked fields/buttons, label wrap, no clipping.
4. **Dual mobile-bar overlap (must-confirm)** — **confirmed on the record**: this is the owner's
   2026-06-15 governing decision (carried into the original kickoff execution, see "Owner's explicit
   governing decision" below) — wire the message trigger into `ListingContact`'s own mobile bar only,
   document the `ListingMobileCTA`/`ListingContact`-bar visual-overlap as a pre-existing, out-of-scope
   finding for a future cleanup task. Not re-litigated; not fixed in this task.
5. **Schema-drift follow-up (minor)** — acknowledged, filed as a small follow-up (not actioned here,
   per the original "no redesign beyond spec" scope boundary).

All checks re-run after the fixes (see updated Self-validation verdict at the bottom):
`npx vitest run src/modules/listings/actions/submitListingInquiry.test.ts` (12/12),
`npx tsc --noEmit` (0 errors), `npx vitest run` (597/597), `npm run check:i18n` (parity PASSED),
`npm run check:i18n-dynamic` (PASSED), `npm run build` (succeeded), `npm run build-storybook`
(succeeded, used for the new matrix capture).

## Investigate-first findings

- **Confirmed broken trigger:** `ListingContact.tsx` (pre-change lines 227-234) rendered
  `<Link href={`/${locale}/messages/new?listing=...`}>`. `glob src/app/**/messages/**` → no matches.
  No `listing_inquiries` table, no chat/thread infra anywhere in the repo (grep for `listing_inquir`,
  `chat`, `thread` under `src/modules` returned nothing pre-change). Confirms "build the smallest
  correct thing", not a wiring regression.
- **Mobile bar mounting — BOTH bars render simultaneously (dual-bar overlap, documented per kickoff
  §"Mobile" instruction "if BOTH render, STOP and ASK" — owner pre-resolved this 2026-06-15, see
  "Owner's explicit governing decision" below):**
  - `ListingDetailView.tsx:189-199` — `ListingMobileCTA` (`lg:hidden`, `z-30`), rendered when
    `!isListingArchived(listing.status)` AND `(owner.has_phone || owner.has_whatsapp)`. Call/WhatsApp only;
    early-returns `null` if owner has neither (`ListingMobileCTA.tsx:27`).
  - `ListingContact.tsx:305-389` — `ListingContact`'s own mobile fixed bar (`lg:hidden`, `z-40`),
    always rendered (no has_phone/has_whatsapp gate at the container level). Originally held only
    price/owner-name + WhatsApp/Call buttons + guest CTA / owner-deleted notice.
  - Both bars are `fixed bottom-14 md:bottom-0 left-0 right-0`, with `ListingContact`'s bar at
    `z-40` stacking above `ListingMobileCTA` at `z-30` — i.e. when both render they visually
    overlap/stack at the same screen position. **This is a pre-existing condition, unchanged by
    this task** (neither bar was touched in a way that affects this overlap — `ListingMobileCTA`
    is untouched entirely).
  - **Owner's explicit governing decision (2026-06-15, carried into this session):** wire the new
    message trigger into `ListingContact`'s own mobile bar only (NOT `ListingMobileCTA.tsx`, which
    per kickoff Arch §5 explicitly remains untouched). The dual-bar visual-overlap issue itself is
    **out of scope** for this task — filed here as a finding for a future cleanup task, not fixed.
- **Owner-hide-rule clarification (resolved before implementation):** `ownerDataUnavailable` (`!isGuest
  && !owner.id && !ownerDeleted` — orphaned listing for an authenticated viewer) hides the trigger.
  `showGuestCTA` (`isGuest && !owner.id && !ownerDeleted` — guest viewer, owner row RLS-hidden) does
  **NOT** hide the trigger — guests can send inquiries per Epic V precedent and kickoff Positive flow #2.

## SQL for Owner (run in Supabase SQL Editor — exact, idempotent)

```sql
-- listing_inquiries table (Task 243 — Path A minimal listing→owner inquiry)
CREATE TABLE IF NOT EXISTS public.listing_inquiries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  listing_owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  email            text NOT NULL,
  message          text NOT NULL,
  requester_ip     text NULL,
  status           text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'read', 'archived')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for rate-limit lookup (IP + created_at) — mirrors contact_inquiries_ip_idx
CREATE INDEX IF NOT EXISTS listing_inquiries_ip_idx
  ON public.listing_inquiries (requester_ip, created_at DESC)
  WHERE requester_ip IS NOT NULL;

-- Index for any future admin list (status, created_at) — mirrors contact_inquiries_status_idx
CREATE INDEX IF NOT EXISTS listing_inquiries_status_idx
  ON public.listing_inquiries (status, created_at DESC);

-- Enable RLS
ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin: full access — mirrors contact_inquiries_admin_all
DROP POLICY IF EXISTS "listing_inquiries_admin_all" ON public.listing_inquiries;
CREATE POLICY "listing_inquiries_admin_all" ON public.listing_inquiries
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Moderator: read-only — mirrors contact_inquiries_moderator_select
DROP POLICY IF EXISTS "listing_inquiries_moderator_select" ON public.listing_inquiries;
CREATE POLICY "listing_inquiries_moderator_select" ON public.listing_inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator'))
  );

-- No public/anon INSERT policy — the server action (submitListingInquiry) writes via
-- createAdminClient() (service-role), which bypasses RLS. Table is insert-only via backend.
```

Add `listing_inquiries` to `scripts/schema-drift-check.sql` RESULT SETs (follow-up — out of scope
for this task per the Note 19/20 "no redesign beyond spec" boundary; flagging for the orchestrator).

## Files Changed

| File | Rationale |
|---|---|
| `src/types/database.ts` | New `ListingInquiryStatus` type + `ListingInquiry` interface (Arch §1). |
| `src/modules/notifications/lib/emails/listingInquiry.ts` (new) | Resend owner-notification sender — 4-locale inline strings, HTML-escaped body, `replyTo` = inquirer (Arch §3). |
| `src/modules/listings/actions/submitListingInquiry.ts` (new) | Server action: validation, IP rate-limit, listing/owner resolution, self-inquiry + closed-listing guards, insert, Resend notify (Arch §2). |
| `src/modules/listings/actions/submitListingInquiry.test.ts` (new) | 12 unit tests covering all typed error codes + both happy paths. Rework: clarified the `email_transient` test name (UI now treats it as partial success). |
| `src/modules/listings/components/ListingInquiryDialog.tsx` (new) | Shared canonical-Dialog inquiry form, used by both desktop and mobile triggers (Arch §4). Rework: `className="sm:max-w-sm"` (was unscoped `max-w-sm`, defeating the <640 bottom sheet); `email_transient` → partial-success toast (close + reset + `toast.success`). |
| `src/modules/listings/components/ListingContact.tsx` | Replaced broken `<Link>` desktop trigger with `ListingInquiryDialog`; added a second full-width row to the mobile fixed bar for the same dialog; new `inquiryListingId`/`canSendInquiry`/`inquirerName`/`inquirerEmail` props; `showInquiryTrigger`/`hasContactButtons` derived flags (Arch §5). |
| `src/modules/listings/components/ListingDetailView.tsx` | Threaded `canSendInquiry`/`inquirerName`/`inquirerEmail` props through to `ListingContact`, with `effectiveCanSendInquiry` staff-preview override. |
| `src/app/[locale]/listings/[slug]/page.tsx` | Resolved `inquirerName` (from `users.name`), `inquirerEmail` (authenticated non-zombie viewers), and `canSendInquiry` (self-inquiry guard) server-side; passed to `ListingDetailView`. |
| `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` | 15 `listing.inquiry_*` keys each (dialog title/labels/placeholders/submit/success/5 error toasts + 1 partial-success toast), identical key sets, 4-locale parity. Rework: replaced `inquiry_error_email_transient` with `inquiry_success_email_pending` in all 4. |

**Not part of this diff (pre-existing, untouched by this session):** `docs/backlog.md` and
`tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md` show as modified
in `git status` from a prior/parallel session — left as-is, not edited here, and excluded from this
table per the orchestrator-owned-backlog rule.

**Cleanup:** the throwaway `scripts/_task243-screens.mjs` capture script and its
`.screenshots/task243/` output (used only to produce the rendered-matrix evidence below) were
deleted before finalizing — not part of the product diff.

## AC-by-AC self-audit

1. **New `listing_inquiries` table** — exact idempotent SQL + RLS above; `ListingInquiryStatus` +
   `ListingInquiry` typed in `src/types/database.ts:52,78-88`; `contact_inquiries` untouched. ✅
2. **`submitListingInquiry.ts`** — validation `submitListingInquiry.ts:31-33`; IP extraction +
   rate-limit `submitListingInquiry.ts:11-20,38-42`; listing/owner fetch + `not_found`
   `submitListingInquiry.ts:46-52`; closed-listing guard `submitListingInquiry.ts:53`; self-inquiry
   guard `submitListingInquiry.ts:55-56`; `auth.admin.getUserById` owner-email resolution +
   `owner_unavailable` `submitListingInquiry.ts:58-60`; insert + `save_failed`
   `submitListingInquiry.ts:62-71`; Resend notify (Reply-To = inquirer, locale `'sq'`) +
   `email_transient` `submitListingInquiry.ts:73-83`; owner email never returned to client (only
   used server-side to call `sendListingInquiryNotification`). ✅
3. **`listingInquiry.ts` Resend sender** — `STRINGS` for sq/en/uk/it with `subject/heading/body/...`;
   `buildHtml` HTML-escapes `message` and `listingTitle`; `replyTo` passed through from the action;
   `locale = 'sq'` default per Task 251 policy. ✅
4. **`ListingInquiryDialog.tsx`** — canonical `Dialog`/`DialogContent`, now `className="sm:max-w-sm"`
   (was unscoped `max-w-sm`, which capped the popup to 24rem even <640px and defeated the full-width
   bottom sheet — fixed during rework; rendered proof below); name/email/message fields; prefill via
   `defaultName`/`defaultEmail` props; guest-capable (props optional); success toast + close + reset
   on success; per-error-code localized toast, dialog stays open on error (`rate_limited`,
   `validation`, `not_found`, `owner_unavailable`, `save_failed`); `email_transient` is a
   **partial-success** case (owner decision, rework) — closes + resets + `toast.success(t('inquiry_success_email_pending'))`,
   since the row is already persisted and re-prompting risks a duplicate; `disabled={!canSubmit || isPending}`
   double-submit guard. ✅
5. **Desktop trigger** — `ListingContact.tsx:237-253` replaces the broken `<Link>`; closed-listing
   disabled `<Button>` branch preserved unchanged at `ListingContact.tsx:224-236`. ✅
6. **Mobile trigger** — `ListingContact.tsx:370-387`, second row of the mobile bar
   (`flex flex-col gap-2`, restructured at `ListingContact.tsx:309`); same `ListingInquiryDialog` +
   same `submitListingInquiry` action (no duplicated logic — both call sites pass the same props
   shape into the same component); renders independently of `hasContactButtons`
   (`ListingContact.tsx:80,370`); `ListingMobileCTA.tsx` not touched (no third bar added). Dual-bar
   overlap documented above as a pre-existing, out-of-scope finding per owner's governing decision. ✅
7. **Control inventory** — see table below. ✅
8. **i18n** — 15 keys × 4 locales (`inquiry_dialog_title` … `inquiry_success_email_pending`,
   rework replaced `inquiry_error_email_transient` with `inquiry_success_email_pending` — still 15
   keys, identical sets), verified via `npm run check:i18n` (1803 keys × 4, parity PASSED); runtime
   verified in `sq`/`en`/`uk`/`it` via Storybook screenshots (see matrix below, both trigger-button
   and open-dialog cells). ✅
9. **Mobile <640 full-width gate** — `Dialog`/`DialogContent` now `sm:max-w-sm` (fixed during
   rework — was unscoped `max-w-sm`, defeating the bottom sheet <640px); desktop + mobile trigger
   buttons both rendered via `buttonVariants({ size: 'xl' })` with the mobile one additionally
   `w-full` (`ListingContact.tsx:379`); all three form fields (`Input`/`Input`/`Textarea`)
   `className="w-full"`; footer `Button`s `max-sm:w-full`; ≥44px (`size: 'xl'` / `lg`). Rendered
   matrix below now includes the OPEN dialog at uk@320/375/390 + sq/en/it@375, confirming
   edge-to-edge full width, drag handle, rounded top corners, ≤90dvh scroll, full-width stacked
   fields/buttons, label wrap. ✅
10. **Self-validation** — see verdict below. ✅

## Rendered verification matrix (uk@320/375/390 mandatory + desktop ×2 locales)

Captured via `storybook-static` + Playwright against the existing
`ListingDetailView.stories.tsx` `PublicListingMobile320/375/390` and `PublicListing` stories
(default args: `isGuest: true`, owner has phone+whatsapp, `listing.status: 'active'`,
`canSendInquiry` defaults `true` → `showInquiryTrigger = true`):

| Story | Locale | Viewport | Result |
|---|---|---|---|
| `PublicListingMobile320` | uk | 320×812 | "Надіслати повідомлення" full-width outline button renders as a second row below the green "Написати в WhatsApp" + phone-icon row. No horizontal scroll. Label fits on one line. ✅ |
| `PublicListingMobile375` | uk | 375×812 | Same layout, more horizontal breathing room; full-width button confirmed. ✅ |
| `PublicListingMobile390` | uk | 390×844 | Same layout; full-width button confirmed. ✅ |
| `PublicListing` (desktop) | uk | 1280×900 | Sidebar card shows green "Написати в WhatsApp", outline "Дзвонити" (call), and red/primary "Надіслати повідомлення" — all full-width within the card, stacked. Report dialog button below, unaffected. ✅ |
| `PublicListing` (desktop) | en | 1280×900 | Same layout with "Write on WhatsApp" / "Call" / "Send message" — confirms en strings, no fallback. ✅ |

Pre-existing, unrelated observation noted during capture: at 320px the owner-name column
(`flex-1 min-w-0`) wraps a long name ("Eliran Hoxha") character-by-character — this is existing
layout behavior of the price/name block, not introduced or changed by this task.

### Rework addendum — OPEN dialog matrix (proves the `sm:max-w-sm` fix)

Captured by clicking the inquiry trigger and screenshotting the open `Dialog`:

| Story | Locale | Viewport | Result |
|---|---|---|---|
| `PublicListingMobile320` | uk | 320×812 | Dialog opens as an edge-to-edge full-width bottom sheet, rounded top corners, drag handle visible, "Надіслати повідомлення власнику" title, 3 full-width fields (Ім'я/Email/Повідомлення), full-width stacked "Надіслати"/"Скасувати" buttons. No horizontal scroll, no clipping. ✅ |
| `PublicListingMobile375` | uk | 375×812 | Same — full-width sheet confirmed at 375px. ✅ |
| `PublicListingMobile390` | uk | 390×844 | Same — full-width sheet confirmed at 390px. ✅ |
| `PublicListing` | sq | 375×812 | Full-width sheet, "Dërgo mesazh pronarit" title, "Emri"/"Email"/"Mesazhi" fields, "Dërgo"/"Anulo" buttons — sq strings confirmed, no fallback. ✅ |
| `PublicListing` | en | 375×812 | Full-width sheet, "Send a message to the owner" title, "Name"/"Email"/"Message" fields, "Send"/"Cancel" buttons. ✅ |
| `PublicListing` | it | 375×812 | Full-width sheet, "Invia un messaggio al proprietario" title, "Nome"/"Email"/"Messaggio" fields, "Invia"/"Annulla" buttons — it strings confirmed, no fallback. ✅ |

All 6 cells confirm: edge-to-edge (no side margins/centering), rounded top corners only, drag
handle bar, fields and Submit/Cancel buttons full-width and stacked, labels wrap without clipping.
This is the rendered proof that `className="sm:max-w-sm"` (post-fix) does **not** leak the 24rem
cap below 640px — the pre-fix unscoped `max-w-sm` would have shown a narrow, left-aligned card
instead of an edge-to-edge sheet.

## UX-flow trace

**Positive 1 — signed-in non-owner, desktop:** `ListingContact.tsx:237-253` renders
`ListingInquiryDialog` with `defaultName`/`defaultEmail` from `page.tsx` (`inquirerName`/
`inquirerEmail`) → dialog opens prefilled → user edits message (≥20 chars) → `canSubmit` true →
submit → `submitListingInquiry` validates, `isRateLimited` false, fetches listing (open, not
self), `getUserById` resolves owner email, inserts row, sends Resend (Reply-To = viewer email,
locale `'sq'`) → `{}` → success toast (`inquiry_success`) + dialog closes + fields reset on next open.

**Positive 2 — guest, mobile (uk@375):** `ListingContact.tsx:370-387` renders the same dialog as a
full-width bottom sheet (canonical `Dialog` <640 behavior, unchanged) → guest fills all 3 fields →
submit → same action path, `viewer = null` (guest allowed) → row persisted + owner emailed →
success toast.

**Positive 3 — owner has no phone/whatsapp:** `hasContactButtons` false →
`ListingContact.tsx:199-223` WhatsApp/Call buttons don't render, but `showInquiryTrigger` is
independent of `hasContactButtons` → message trigger still renders (as `variant: 'default'` per
`ListingContact.tsx:379`) → inquiry flow works identically.

**Negative — validation:** empty/short message, bad email → `canSubmit` false client-side
(submit disabled); if bypassed, server returns `{error:'validation'}` → `inquiry_error_validation`
toast, dialog stays open, no DB write, no email (`submitListingInquiry.ts:31-33`).

**Negative — rate_limited:** 6th submission from one IP within an hour →
`isRateLimited` true → `{error:'rate_limited'}` → `inquiry_error_rate_limited` toast, no write
(`submitListingInquiry.ts:38-42`).

**Negative — not_found:** `listingId` doesn't resolve → `{error:'not_found'}` →
`inquiry_error_not_found` toast (`submitListingInquiry.ts:46-52`).

**Negative — save_failed:** insert error → `{error:'save_failed'}` →
`inquiry_error_save_failed` toast, dialog stays open (`submitListingInquiry.ts:62-71`).

**Negative — owner_unavailable:** `getUserById` returns no email → `{error:'owner_unavailable'}` →
`inquiry_error_owner_unavailable` toast. UI never hides the trigger for this case (only for
`ownerDeleted`/`ownerDataUnavailable`/closed/self) — error surfaces only on submit
(`submitListingInquiry.ts:58-60`).

**Partial success — email_transient:** Resend fails after insert → `{error:'email_transient'}` →
row already persisted (`submitListingInquiry.ts:73-83`); dialog treats this as **partial success**
(owner decision, rework): closes + resets fields + `toast.success(t('inquiry_success_email_pending'))`
("Inquiry received. The owner notification email may be delayed.") — no "try again" wording, since
resubmitting would create a duplicate row (no dedup guard).

**Negative — closed listing:** `listingClosed` true → `ListingContact.tsx:224-236` renders the
pre-existing disabled `Button` (unchanged); server also returns `{error:'validation'}` defensively
if ever reached (`submitListingInquiry.ts:53`).

**Negative — self-inquiry:** `page.tsx` computes `canSendInquiry = false` for the owner →
`showInquiryTrigger` false, no trigger rendered; server also guards
(`submitListingInquiry.ts:55-56`).

**Negative — double-submit:** `disabled={!canSubmit || isPending}` on the submit button
(`ListingInquiryDialog.tsx`).

**Negative — cancel/dismiss:** Esc/backdrop/Cancel → canonical `Dialog` `onOpenChange(false)` →
`handleOpenChange` resets fields next time it opens; no write performed.

**Negative — guest:** allowed; same validation path as Positive 2.

## Before/after control inventory (Note 19/20)

| Control | Before | After |
|---|---|---|
| Report button (`ListingReportDialog`) | Present, `canReport && listingId` (`ListingContact.tsx:295-299`) | Unchanged |
| Call/WhatsApp reveal (`getListingOwnerContact`, `trackListingContactEvent`) | Present, desktop + mobile | Unchanged |
| Owner info card (avatar, name, verified badge, agent/company label) | Present | Unchanged |
| Share | Present | Unchanged |
| Favorite / SaveToCollection | Present, `listingId &&` gated | Unchanged |
| Guest sign-in CTA (`openAuthSheet`) | Present (desktop `showGuestCTA` block + mobile `showGuestCTA` button) | Unchanged |
| Owner-deleted state | Present (desktop notice + mobile badge) | Unchanged |
| Owner-data-unavailable state | Present (desktop notice) | Unchanged |
| Closed-listing disabled state | Present (desktop disabled `Button` + `closedLabel`) | Unchanged |
| **Send-message trigger (desktop)** | **Broken `<Link>` → 404** | **`ListingInquiryDialog`, working** |
| **Send-message trigger (mobile)** | **Absent entirely** | **New full-width row in `ListingContact`'s mobile bar** |
| `ListingMobileCTA` (Call/WhatsApp mobile bar) | Present, untouched | Unchanged |

## Self-validation verdict (post-rework, re-run 2026-06-15)

- `npx vitest run src/modules/listings/actions/submitListingInquiry.test.ts` → **12/12 passed**
- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` (full suite) → **597/597 passed** (19 files)
- `npm run check:i18n` → **Parity PASSED**, 1803 keys × 4 locales (2 pre-existing unrelated
  raw-enum warnings, not introduced by this change)
- `npm run check:i18n-dynamic` → **PASSED** (195 keys, 0 errors)
- `npm run build` → **succeeded**, full route table printed, no errors
- `npm run build-storybook` → **succeeded** (used to capture the rework open-dialog matrix)
- All touched/new files: clean UTF-8, 0 NUL bytes, parse correctly (verified via successful
  `tsc`/`vitest`/`build`/`build-storybook` runs above).

**VERDICT: PASS.** All 10 acceptance criteria met, including the 2 hard fails + evidence gap +
must-confirm from the orchestrator's rework review:
- SQL is now idempotent (`DROP POLICY IF EXISTS` before each `CREATE POLICY`).
- `email_transient` is a partial-success UX (close + reset + success toast,
  `inquiry_success_email_pending` ×4 locales) per the owner's 2026-06-15 rework decision.
- `DialogContent` `max-w-sm` → `sm:max-w-sm` fix, with rendered open-dialog proof at
  uk@320/375/390 + sq/en/it@375 that the bottom sheet is edge-to-edge full-width <640px.
- Dual mobile-bar overlap reconfirmed as the owner's pre-existing, out-of-scope, on-the-record
  decision (not fixed in this task).
- Schema-drift follow-up (`scripts/schema-drift-check.sql`) remains an acknowledged minor
  follow-up, not actioned.

Path A scope respected throughout (no chat/threads/realtime introduced). `contact_inquiries`
untouched. Report flow, WhatsApp/phone RPC, and Albanian-only outbound email policy (Task 251)
untouched. `ListingMobileCTA.tsx` untouched.
