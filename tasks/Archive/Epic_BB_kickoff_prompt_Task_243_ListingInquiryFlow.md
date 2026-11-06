# Epic BB — Task 243 kickoff (Sonnet) — BB.2: working listing→owner inquiry flow (Path A, minimal inquiry)

> **Status: READY.** Epic: BB — Listing Inquiries: Report & Message (`tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md`).
> Task 242 (BB.1, report button) is the sibling; this is BB.2.
>
> **You are Sonnet 4.6 executor.** Implement Path A exactly as specified. Do NOT change scope. Do NOT invent
> architecture beyond this spec. If a required detail is ambiguous, **STOP and ASK the orchestrator** — do not guess.
>
> **Single-writer git:** you do NOT run git. End with a "Files Changed" table; the orchestrator reads the real diff
> and emits commit commands at review. **Single-writer SQL:** you do NOT run migrations — write the EXACT idempotent
> SQL into the session log; the owner runs it natively.
>
> **🔴 OWNER DECISION — Path A only (no chat).** Implement the minimal listing→owner inquiry. **Path B (realtime
> chat / threads / realtime channel / inbox) is FORBIDDEN in this task without separate written owner approval.** If
> you find yourself reaching for a chat thread, STOP and ASK.

```
Type:     bug + feature (broken Send-message button + minimal inquiry backend)
Priority: high
Area:     public listing detail — Send-message button (desktop + mobile) + inquiry server action + Resend owner notification + new listing_inquiries table
```

## Required pre-read (rule-index: "DB / server action / RLS" + "UI / layout / component")

**Always:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md`,
`docs/integrations.md` (Resend), `docs/env.md`; `docs/design-system.md` §26 (mobile <640 full-width + bottom-sheet),
`docs/ui-rules.md`, `docs/component-rules.md`; `docs/ai-behavior.md` Note 18 (self-validation), Note 19 (UX-flow),
Note 20 (control preservation).
**Reference (the Epic V pattern to MIRROR, do not import its semantics):** `src/modules/contacts/actions/index.ts`
(`submitContactInquiry` — validation, IP rate-limit, insert, Resend), `src/modules/notifications/lib/emails/contactInquiry.ts`
(Resend sender, inline 4-locale strings, Reply-To), `src/modules/contacts/components/ContactForm.tsx` (form pattern).

## Problem (verified by orchestrator audit, 2026-06-15)

The "Надіслати повідомлення" / Send-message button on the public listing detail is broken. Root cause:
`src/modules/listings/components/ListingContact.tsx:227-234` renders the button as
`<Link href={`/${locale}/messages/new?listing=...`}>` — **the `/[locale]/messages/...` route does not exist** anywhere
under `src/app/**` (confirmed: glob `src/app/**/messages/**` returns nothing) → **404**. There is NO listing-inquiry
backend in the repo (grep confirms only the Epic V `contact_inquiries` support/sales pattern exists; no
`listing_inquiries`, no chat infra). So this is a "build the smallest correct thing" task, not a wiring regression.

**Mobile gap:** the Send-message button exists ONLY in the desktop sidebar (`ListingContact.tsx:110`, `hidden lg:block`).
The mobile surfaces (`ListingContact.tsx:285+` mobile bottom bar, and `ListingMobileCTA.tsx`) currently expose ONLY
Call/WhatsApp — there is **no inquiry entry point on phones at all**. Owner decision (2026-06-15): fix the WHOLE
public-detail send-message surface, desktop AND mobile.

## Owner decisions (captured 2026-06-15 — do NOT re-litigate)

- **Path A — minimal inquiry.** Mirror Epic V as an *implementation pattern* only (validation, IP rate-limit, server
  action insert, Resend sender, Reply-To = inquirer email, RLS, exact idempotent SQL in the session log). **Path B
  (chat) forbidden** without separate written approval.
- **New table `listing_inquiries`** — do NOT extend `contact_inquiries` (that is the support/sales inbox model with
  `target_mailbox`/`topic` routing and admin reply semantics; listing inquiry has a *dynamic recipient = the listing
  owner's email* and must not be mixed into the support/sales inbox).
- **Recipient = listing owner's email, resolved SERVER-SIDE ONLY**, never exposed to the client. Use the canonical
  pattern already in the repo: `createAdminClient().auth.admin.getUserById(listing.user_id)` → `data.user.email`
  (same approach as `reportListing.ts:172` and the cron senders). The client never receives the owner email.
- **Desktop and mobile triggers share ONE inquiry flow/component** — do NOT duplicate the business logic.
- **No admin inquiry dashboard** for listing inquiries in this task (out of scope; file a follow-up Epic if wanted).
- **No changes** to the report flow, the WhatsApp/phone reveal RPC (`get_listing_owner_contact`), or the outbound
  email language policy (Albanian-only, Task 251) — follow the existing policy, do NOT invent a new one.

## Architecture to implement (specified — do NOT invent an alternative)

### 1. New table `listing_inquiries` (SQL → session log; owner runs it)

Write EXACT idempotent SQL (`create table if not exists`, `create index if not exists`, RLS enable + policies) in the
session log. Suggested columns (adjust types to match repo conventions — verify against an existing table):
`id uuid pk default gen_random_uuid()`, `listing_id uuid not null references public.listings(id) on delete cascade`,
`listing_owner_id uuid not null references public.users(id) on delete cascade`, `name text not null`,
`email text not null`, `message text not null`, `requester_ip text null`, `status text not null default 'new'`
(check in `('new','read','archived')` — minimal, no admin UI), `created_at timestamptz not null default now()`.
**RLS:** enable RLS; mirror `contact_inquiries` exactly — the server action writes via the service-role admin client
(bypasses RLS), and SELECT is restricted to admin/moderator (no public/anon select, no public insert policy). Document
the precise policies. Add the table to `src/types/database.ts` (mirror how `contact_inquiries` is typed).

### 2. Server action `submitListingInquiry` (new — `src/modules/listings/actions/submitListingInquiry.ts`)

Mirror `submitContactInquiry` structure. Signature: `submitListingInquiry(input: { listingId: string; name: string;
email: string; message: string }): Promise<{ error?: 'rate_limited'|'validation'|'not_found'|'save_failed'|'owner_unavailable'|'email_transient' }>`.
- **Validate:** trim + length-cap name (≤200), email (≤200, lowercase, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`), message
  (≤5000, **min 20 chars** — same threshold as Epic V). Invalid → `{error:'validation'}`.
- **Rate-limit by IP:** 5 / hour. Mirror `submitContactInquiry` EXACTLY — same IP-extraction
  (`x-forwarded-for`→split first→`x-real-ip`→`'unknown'`) and the same `isRateLimited` shape (count rows in
  `listing_inquiries` by `requester_ip` in the last hour). **Unresolved IP (`'unknown'`):** mirror Epic V's fallback
  exactly — `isRateLimited` returns `false` (not rate-limited) and the row is stored with `requester_ip = null`.
  Document this unresolved-IP behavior explicitly in the session log. Over limit → `{error:'rate_limited'}`.
- **Resolve listing + owner:** fetch the listing by `listingId` (admin client) → if missing → `{error:'not_found'}`.
  Resolve owner email via `auth.admin.getUserById(listing.user_id)` → if no email → `{error:'owner_unavailable'}`.
  **Do NOT allow inquiries on a closed listing** (`sold`/`rented`) — mirror the existing closed-listing disable; if
  the listing is closed, return `{error:'validation'}` (the UI already hides/disables the trigger when closed, but the
  server must enforce it too). **Self-inquiry guard — viewer resolved SERVER-SIDE:** resolve the current viewer inside
  the action using the repo's canonical server auth helper (`getUser()` from `@/lib/auth/server`), NEVER from a
  client-supplied `viewerId` (the signature carries no viewer field — do not add one). If the resolved viewer's id ===
  `listing.user_id`, return `{error:'validation'}` defensively (the UI also hides the trigger for the owner). If there
  is no signed-in viewer, a guest submission is allowed (Epic V guest support).
- **Insert** the row into `listing_inquiries` (DB first). Insert fails → `{error:'save_failed'}`.
- **Notify owner via Resend** (new sender, §3) with `to = ownerEmail`, `replyTo = inquirer email`. Email send fails →
  `{error:'email_transient'}` (row already persisted). Follow the Albanian-only outbound policy (locale `'sq'`, Task
  251) — do NOT change it.
- Do NOT throw on expected failures; return the typed error. Use `createAdminClient()` server-side only.

### 3. Resend owner-notification sender (new — `src/modules/notifications/lib/emails/listingInquiry.ts`)

Mirror `sendContactInquiryNotification` (inline `sq/en/uk/it` STRINGS, `buildHtml` with HTML-escaping of the message,
`sendEmail({ to, subject, replyTo, html })`). Content: heading "new inquiry about your listing", the listing title,
inquirer name + email, the message, and a reply hint ("click Reply — your email goes directly to the inquirer").
`replyTo` = inquirer email so the owner can reply directly. Return `{ok:true,id?}|{ok:false,reason}` like the Epic V
sender. Locale = `'sq'` (Task 251 policy) unless the orchestrator later directs owner-locale binding (do NOT add it now).

### 4. Inquiry Dialog component (new — `src/modules/listings/components/ListingInquiryDialog.tsx`)

A canonical `Dialog` (full-width bottom sheet at <640 per design-system §26 — reuse the canonical `Dialog`, do NOT
reimplement) containing the inquiry form: **name, email, message** (textarea). Props: `listingId`, `listingTitle`,
and an optional `trigger` render or an `open`/`onOpenChange` controlled API. **Both entry points must use the same
`ListingInquiryDialog` component and the same `submitListingInquiry` action — do NOT duplicate the business logic.**
One mounted dialog instance per rendered surface is acceptable if the existing component structure requires it (do not
force awkward state-lifting to share a single mounted instance). **Prefill** name + email for a signed-in viewer (pass them in as props resolved on
the server detail page; never fetch owner data); a guest fills all fields. On submit → `submitListingInquiry` →
success: success toast + close dialog + reset; error: localized toast mapped per error code, keep dialog open, do not
clear. Disable submit while pending (double-submit guard). All labels/placeholders/toasts via `t()` in all 4 locales.

### 5. Wire the desktop + mobile triggers (no logic duplication)

- **Desktop** (`ListingContact.tsx:227-234`): replace the broken `<Link href=".../messages/new">` with a button that
  opens `ListingInquiryDialog`. Keep the existing **closed-listing** branch (lines 213-225) — when
  `isListingClosed(listingStatus)`, keep the disabled Button (no inquiry on sold/rented), unchanged.
- **Mobile:** add a "Send message" trigger to the mobile contact surface that opens the same `ListingInquiryDialog`
  (same component + same `submitListingInquiry` action, no duplicated logic). **First confirm
  which mobile bar actually mounts on the listing detail** (grep `ListingDetailView.tsx` — both `ListingContact`'s
  mobile bar at `:285+` and `ListingMobileCTA.tsx` exist; wire into the one that renders, do NOT add a third bar; if
  BOTH render, STOP and ASK). **Important:** `ListingMobileCTA.tsx:27` early-returns `null` when the owner has neither
  phone nor whatsapp — the message trigger must render **independently** of that guard (an owner with no phone/whatsapp
  must still be reachable by message). Refactor so Call/WhatsApp stay conditional but the message CTA always shows
  (when the listing is open and the viewer is not the owner).
- Both triggers import the one `ListingInquiryDialog` and the one `submitListingInquiry` action — no copied logic.

## Status / domain rules to PRESERVE (Note 19 + Note 20)

Do NOT regress or remove: the Report button (`ListingReportDialog`), the Call/WhatsApp reveal flow
(`getListingOwnerContact` RPC, `trackListingContactEvent`), owner info card, verified badge, Share, Favorite,
SaveToCollection, the guest sign-in CTA (`openAuthSheet`), the owner-deleted / owner-data-unavailable states, and the
closed-listing disabled state. The before/after control inventory in the session log must show every one of these is
intact. A guest IS allowed to send (per Epic V guest support). The trigger must NOT render only for the page's already-known
states: owner-deleted (`owner.deleted_at`) and owner-profile-unavailable (`!owner.id`), and for the listing's own
owner (self-inquiry). A missing auth email is NOT a client-known state — it is handled server-side via
`owner_unavailable` (see Negative flow), not by hiding the trigger.

## Localization (sq / en / uk / it — full parity, no English fallback)

Every new user-facing string — dialog title, field labels (name/email/message), placeholders, submit label, success
toast, and one toast per error code (`rate_limited`, `validation`, `not_found`, `owner_unavailable`, `save_failed`,
`email_transient`) — added to ALL four `messages/{sq,en,uk,it}.json` under the existing `listing.*` (or a new `listing.inquiry.*`)
namespace with identical key sets. The Resend email body strings are inline in the sender (sq/en/uk/it), mirroring
`contactInquiry.ts`. Long labels wrap, never clip. Verify runtime in `uk`.

## Mobile <640 full-width gate (OWNER P0 — MANDATORY)

The inquiry `Dialog` renders as a **full-width bottom sheet at <640** (canonical `Dialog`, drag handle, edge-to-edge,
≤90dvh internal scroll, closes on backdrop tap + Esc). The desktop trigger and the mobile trigger are **full-width at
`max-sm` (`max-sm:w-full`)**; every form field + the submit button is full-width at `max-sm`; touch targets ≥44px;
sq/en/uk/it labels wrap. No horizontal scroll at 320. Reuse canonical primitives — do NOT reimplement Dialog/Input/
Textarea/Button. If any surface's correct mobile pattern is genuinely ambiguous, STOP & ASK.

## Positive flow (happy path)

1. **Signed-in non-owner, open listing, desktop:** clicks Send-message in the sidebar → `ListingInquiryDialog` opens
   with name+email prefilled → edits message (≥20 chars) → Submit → `submitListingInquiry` validates, rate-limit OK,
   resolves owner email server-side, inserts `listing_inquiries` row, sends Resend to owner (Reply-To = user's email)
   → success toast, dialog closes. Owner receives the email and can hit Reply to reach the inquirer.
2. **Guest, open listing, mobile (uk@375):** taps Send-message in the mobile bar → same Dialog opens as a full-width
   bottom sheet → fills name/email/message → Submit → row persisted + owner emailed → success toast.
3. **Owner has no phone/whatsapp:** mobile message CTA still renders (Call/WhatsApp hidden) → inquiry works.

## Negative flow (implement each; cite in the AC table)

- **Validation** (empty field, bad email, message <20 chars) → `{error:'validation'}` → localized field/toast error,
  dialog stays open, no DB write, no email.
- **Rate-limited** (>5 inquiries/hour from one IP) → `{error:'rate_limited'}` → localized toast, no write.
- **not_found** (listing id missing/deleted) → `{error:'not_found'}` → localized toast.
- **save_failed** (DB insert error) → `{error:'save_failed'}` → localized toast asking the user to try again; no email
  sent; dialog stays open.
- **owner_unavailable** (server-side: `auth.admin.getUserById` yields no email) → `{error:'owner_unavailable'}` →
  localized toast. **UI clarification:** the client cannot know the auth email is missing (email is server-only), so
  the UI hides the trigger ONLY for the page's already-known states — owner-deleted (`owner.deleted_at`) and
  owner-profile-unavailable (`!owner.id`). A missing auth email on an otherwise-present owner is handled exclusively by
  the server action returning `owner_unavailable`; the trigger may render and the error surfaces on submit.
- **email_transient** (Resend fails after the row is written) → `{error:'email_transient'}` → localized toast telling
  the user to try again; the row exists (document this behavior).
- **Closed listing** (`sold`/`rented`) → trigger disabled in UI (existing) AND server returns `{error:'validation'}`.
- **Self-inquiry** (viewer is the listing owner) → no trigger shown; server returns `{error:'validation'}` defensively.
- **Double-submit** → submit disabled while pending.
- **Cancel/dismiss** (Esc / backdrop / Cancel) → dialog closes, no write, fields reset.
- **Guest** → allowed to submit (Epic V guest support); same validation.

## Acceptance criteria (each maps to a flow + file:line in the diff)

1. New `listing_inquiries` table: exact idempotent SQL + RLS policies in the session log; typed in `database.ts`;
   does NOT touch `contact_inquiries`. (Arch §1)
2. `submitListingInquiry.ts`: validation + IP rate-limit + server-side owner-email resolution
   (`auth.admin.getUserById`) + insert + Resend notify (Reply-To = inquirer); all typed error codes; closed-listing +
   self-inquiry guarded server-side; owner email never returned to client. (Arch §2, Pos 1, Neg: all)
3. `listingInquiry.ts` Resend sender: 4-locale inline strings, HTML-escaped message, `replyTo` = inquirer, follows
   Albanian-only policy. (Arch §3)
4. `ListingInquiryDialog.tsx`: canonical Dialog + form (name/email/message), prefill for signed-in, guest-capable,
   success/error handling, double-submit guard. (Arch §4, Pos 1/2, Neg: validation/cancel/double-submit)
5. Desktop trigger (`ListingContact.tsx`) replaces the broken Link with the Dialog; closed-listing disabled branch
   preserved. (Arch §5, Pos 1)
6. Mobile trigger wired into the actually-mounted mobile bar, opening the SAME flow; renders independently of the
   phone/whatsapp guard; no third bar; no duplicated logic. (Arch §5, Pos 2/3)
7. Control inventory before/after (Note 20): Report, Call/WhatsApp reveal, owner info, Share, Favorite, SaveToCollection,
   guest CTA, owner-deleted/unavailable, closed-state all intact. (Note 19/20)
8. i18n: all new keys in sq/en/uk/it (identical key sets) + inline email strings ×4; runtime-verified in uk. (Neg: locale)
9. Mobile <640 full-width gate: Dialog = full-width bottom sheet; triggers + fields + submit full-width at max-sm;
   ≥44px; rendered verification matrix in the session log (breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**). (Pos 2)
10. Self-validation: `npx tsc --noEmit` = 0; `npm run build` passes (non-trivial); `npx vitest run` green incl. new
    `submitListingInquiry` tests (validation, rate-limit, not_found, owner_unavailable, save_failed, email_transient,
    closed-listing, self-inquiry, happy path); AC-by-AC self-audit table; file-integrity transcript (0 NUL, parses)
    for every touched file; UX-flow trace; before/after control inventory.

## Out of scope

Admin inquiry dashboard for listing inquiries (follow-up Epic); realtime chat / threads (Path B — forbidden without
approval); changes to the report flow, the WhatsApp/phone RPC, or the outbound email language policy; redesign of the
contact card or mobile bars beyond adding the message trigger.

## Deliverables on return

A session log under `docs/sessions/` with: the "Investigate first" findings (confirm no chat/inquiry infra; which
mobile bar mounts), the exact `listing_inquiries` SQL + RLS, Files Changed table (one row per path + rationale),
AC-by-AC self-audit (file:line each), the rendered verification matrix, positive + negative flow verification, the
before/after control inventory, and the self-validation verdict line. Update `docs/backlog.md`'s Task 243 line is
the ORCHESTRATOR's job — do NOT edit `docs/backlog.md` yourself (it is orchestrator-owned); just add the session log.
Do NOT emit git or SQL commands — the orchestrator emits commits and the owner runs the SQL.
