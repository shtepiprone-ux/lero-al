# Sprint 17 — Task 277 kickoff (Restore WhatsApp CTA on listing detail contact card + click-event analytics foundation)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: **"UI / layout / component" + "DB / server action / RLS" + "Schema / migration" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check at `uk` 320px). UI task → ×4 locales (sq/en/uk/it) AND 7 breakpoints (320/375/390/768/1280/1440/2560) REQUIRED. Owner runs git; executor never runs git.

---

## Task 277 — Restore WhatsApp CTA on listing detail contact card (+ analytics-ready click-event foundation)

```
Hard contract: see top.

Type:        bugfix + feature-foundation
Priority:    high
Area:        listing detail / contact card / analytics groundwork / DB migration

GOAL: Two coupled changes shipped together:

  (a) Restore the missing "Write on WhatsApp" CTA on the listing detail
      contact card. The button was present in earlier versions and is now
      gone; current contact-card actions include only Send message / Save
      to collection / Favorite / Share / Complain-report. Users lost a
      high-intent contact channel.

  (b) Lay a MINIMAL click-event analytics foundation: a new
      `listing_contact_events` table + a `trackListingContactEvent(...)`
      utility that the WhatsApp button (and any future contact CTA)
      records through. This is NOT the full analytics page (that's Task
      285 spec). It's the data foundation so the page can be built later
      without back-migrating events.

These two MUST ship in the same diff. (a) without (b) means future
analytics work has no historical data; (b) without (a) means recording
infrastructure with no producer.

Owner-flagged scope discipline (issues.txt 2026-05-28):
- Do NOT build the listing analytics page in this task.
- Do NOT build admin analytics settings.
- Do NOT add date-range filters / charts / KPI cards.
- Do NOT add paid-plan gating.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 from owner-uploaded
issues.txt §1.

Pre-read (UI + DB/RLS + Schema/migration bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md        → button/icon-button patterns, contact CTA
                             alignment, 44px touch targets, focus state.
- docs/component-rules.md → reusable component standards; i18n.
- docs/qa-rules.md        → schema-drift check workflow.
- docs/data-access-rules.md → server-action patterns; table creation
                              conventions.
- docs/rls-rules.md       → "Public Schema GRANT Discipline" + "Per-role
                              GRANT discipline" — new table MUST follow
                              the canonical pattern.
- docs/domain-rules.md    → listing detail / contact-card conventions.
- docs/integrations.md    → phone normalization helpers from Tasks 187 /
                             244 / 267 (CC.3 — 9-digit Albanian format);
                             Resend not relevant.
- docs/ai-behavior.md → Note 19 (UX Flow Preservation — every existing
                        contact action must remain), Note 20
                        (Existing-Control Preservation — preserve Send
                        message / Save / Favorite / Share / Report
                        buttons), Note 14 (Global Change Verification —
                        the analytics utility must be designed so the
                        FUTURE Premium CTA / Share CTA / Phone reveal
                        CTA can reuse it without refactor).
- src/components/listing/ListingContact.tsx (or wherever the contact
  card lives — confirm via grep).
- src/lib/phone/index.ts — for the existing `normalizeNational` helper.
- src/types/database.ts — for adding the new `ListingContactEvent` row
  type after the migration ships.

Current behavior to preserve:
- Every existing contact-card control reachable:
  - Send message;
  - Save to collection;
  - Favorite (heart);
  - Share;
  - Complain / Report.
- Contact card layout, spacing, alignment at all 7 breakpoints.
- Existing phone normalization helpers (do NOT duplicate; consume
  from `src/lib/phone`).
- Albanian 9-digit phone format (Task 244 / Task 267 — see backlog).
- Existing European country codes (45 entries per Task 187).
- Listing detail page layout (gallery, info, related, etc.) — UNCHANGED.
- Existing schema-drift baseline (per Task 247: 30 tables / 284 cols).
  After this task: 31 tables / +N cols.

Required after behavior:

1. NEW DB migration (SQL emitted in the session log for the owner to
   apply via Supabase SQL editor):

   ```sql
   -- Table: public.listing_contact_events
   create table public.listing_contact_events (
     id uuid primary key default gen_random_uuid(),
     listing_id uuid not null references public.listings(id) on delete cascade,
     listing_owner_id uuid not null references public.users(id) on delete cascade,
     actor_user_id uuid references public.users(id) on delete set null,
     channel text not null check (channel in ('whatsapp')),  -- extend later via ALTER + enum
     source text not null,                                   -- e.g. 'listing_detail_contact_card'
     locale text,                                            -- 'sq' | 'en' | 'uk' | 'it' | null
     is_owner_click boolean not null default false,
     created_at timestamptz not null default now()
   );

   alter table public.listing_contact_events enable row level security;

   -- Data API exposure:
   grant select on public.listing_contact_events to anon;        -- denied by RLS; explicit GRANT keeps PostgREST happy
   grant select, insert on public.listing_contact_events to authenticated;
   grant select, insert, update, delete on public.listing_contact_events to service_role;

   -- Policies:
   create policy "events_insert_anon" on public.listing_contact_events
     for insert to anon
     with check (actor_user_id is null);                        -- anonymous can only insert anon rows

   create policy "events_insert_authenticated" on public.listing_contact_events
     for insert to authenticated
     with check (actor_user_id = auth.uid());                   -- authenticated can only insert their own rows

   create policy "events_select_owner" on public.listing_contact_events
     for select to authenticated
     using (
       exists (
         select 1 from public.listings l
         where l.id = listing_contact_events.listing_id
           and l.owner_id = auth.uid()
       )
     );                                                          -- only listing owner reads their listing's events

   -- Indexes for the future analytics page:
   create index listing_contact_events_listing_created_idx
     on public.listing_contact_events (listing_id, created_at desc);
   create index listing_contact_events_owner_created_idx
     on public.listing_contact_events (listing_owner_id, created_at desc);

   notify pgrst, 'reload schema';
   ```

   - All SQL is emitted in the session log for the owner to run.
   - Schema-drift type added to `src/types/database.ts` BEFORE the
     owner-run SQL ships (so the type compiles even if drift check is
     run between emission and apply).

2. NEW server action `trackListingContactEvent({ listingId, listingOwnerId, channel, source, locale })`
   at `src/modules/listings/actions/contactEvents.ts`:
   - Signature:
     ```ts
     type ListingContactChannel = 'whatsapp'  // extend later: 'phone' | 'share' | 'message'
     type ListingContactSource = 'listing_detail_contact_card'  // extend later
     interface TrackArgs { listingId: string; listingOwnerId: string; channel: ListingContactChannel; source: ListingContactSource; locale?: string }
     async function trackListingContactEvent(args: TrackArgs): Promise<{ ok: true } | { ok: false; reason: 'self_click' | 'insert_failed' | 'session_error' }>
     ```
   - Resolves the current user via `getServerUser()` (or whatever the
     project's canonical resolver is — confirm via grep). If no session,
     proceeds with `actor_user_id = null` (anonymous row).
   - Self-click rule: if `actor_user_id === listingOwnerId`, set
     `is_owner_click = true` AND return `{ ok: false, reason: 'self_click' }`
     — the row is STILL inserted (so the listing owner sees that their
     own clicks are happening if they audit raw data via admin), but
     the result signals to the caller that this is non-countable for
     owner analytics.
   - Insert via the canonical server-side Supabase client (NOT
     service-role — RLS handles auth).
   - Wrap any error → `{ ok: false, reason: 'insert_failed' }`; Sentry
     breadcrumb logged.
   - Non-throwing; callers can fire-and-forget.

3. WhatsApp CTA component at
   `src/components/listing/WhatsAppContactButton.tsx`:
   - Props: `{ listingId: string; listingOwnerId: string; listingTitle: string; phoneRaw: string; phoneCountryCode: string; locale: string }`.
   - Visibility logic: render ONLY IF `phoneRaw` is non-empty AND
     `normalizeNational(phoneCountryCode, phoneRaw)` returns a valid
     result. Otherwise return `null` (hidden); the card layout MUST
     accommodate either presence (no empty slot).
   - URL build: `https://wa.me/<E164_DIGITS>?text=<URL_ENCODED_PRESET_TEXT>`
     - `E164_DIGITS` = country code (digits only, no `+`) + national
       number (digits only). Use existing phone helpers; do NOT
       duplicate logic.
     - Preset text: `t('listing.whatsapp_preset_message', { title: listingTitle })`
       → e.g. (sq) "Përshëndetje, gjeta listimin tuaj në Lero.al: {title}".
   - Renders as a canonical `<Button>` (link variant — `asChild` +
     `<a target="_blank" rel="noopener noreferrer">`).
   - Icon: WhatsApp icon (lucide-react has `MessageCircle` — acceptable
     as visual approximation; OR add a dedicated WhatsApp svg if the
     project has one). STOP & ASK if neither is suitable.
   - aria-label: `t('listing.whatsapp_aria_label')`.
   - On click: fire-and-forget `void trackListingContactEvent({ listingId, listingOwnerId, channel: 'whatsapp', source: 'listing_detail_contact_card', locale })`. Do NOT await; navigation must not be blocked by the analytics call.

4. Wire `<WhatsAppContactButton>` into the listing detail contact card
   (locate via grep — likely `ListingContact.tsx`). Placement:
   - Near the existing Send message button (both are direct contact
     CTAs — visually grouped).
   - NOT in the secondary-action row (Share / Report / Save) — those
     are utility actions.
   - Existing controls (Send message / Save / Favorite / Share /
     Report) STAY in place — no reorder, no removal. Per Note 20:
     paste before/after inventory in the session log.

5. New locale keys (×4 locales, same key set):
   - `listing.whatsapp_button_label` ("Write on WhatsApp" / "Напиши на WhatsApp" / "Scrivi su WhatsApp" / "Shkruani në WhatsApp")
   - `listing.whatsapp_aria_label` ("Contact via WhatsApp" / etc.)
   - `listing.whatsapp_preset_message` (templated; sq: "Përshëndetje, gjeta listimin tuaj në Lero.al: {title}"; en: "Hello, I found your listing on Lero.al: {title}"; etc.)
   - = 3 new keys × 4 = 12 entries.

6. `src/types/database.ts` — add:
   ```ts
   export interface ListingContactEvent {
     id: string
     listing_id: string
     listing_owner_id: string
     actor_user_id: string | null
     channel: 'whatsapp'  // extend later
     source: string
     locale: string | null
     is_owner_click: boolean
     created_at: string
   }
   ```

7. NO change to other contact-card controls.
8. NO admin UI for analytics in this task (Task 285 will spec the full page).
9. NO `is_owner_click` exposure on public surfaces (RLS already gates;
   verify via the policy `events_select_owner`).

Positive flow (happy path):
- Anonymous visitor lands on `/listings/<slug>` → contact card renders
  with WhatsApp button (seller has valid phone).
- Visitor clicks → new tab opens to
  `https://wa.me/35569XXXXXXX?text=Përshëndetje%2C%20gjeta%20listimin%20tuaj%20në%20Lero.al%3A%20Apartament%20në%20Tiranë`.
- Background: `trackListingContactEvent(...)` inserts a row with
  `actor_user_id = null`, `channel = 'whatsapp'`, `source = 'listing_detail_contact_card'`,
  `locale = 'sq'`, `is_owner_click = false`. Returns `{ ok: true }`.
- The visitor's WhatsApp opens with the preset message ready to send.

Positive flow (happy path) — authenticated viewer:
- Same as anonymous, but `actor_user_id = <viewer.id>` in the inserted row.

Positive flow (happy path) — listing owner viewing own listing:
- Owner clicks own WhatsApp button. WhatsApp still opens (the button is
  visible to the owner; the owner may want to test it).
- Background: insert with `is_owner_click = true`. Returns
  `{ ok: false, reason: 'self_click' }` — non-countable for analytics,
  but the row exists for audit purposes.

Negative flow (every off-happy-path branch):
- **Seller has no phone** — `phoneRaw` empty → `<WhatsAppContactButton>` returns `null` → button is hidden → contact card layout collapses cleanly (Send message + secondary row still in place). No analytics call.
- **Seller has phone but invalid format** — `normalizeNational(...)` returns null → button hidden → same as above.
- **Seller phone normalizes but country code missing** — defensive: if either is null, button hidden. STOP & ASK only if this state is unexpected after grep.
- **WhatsApp not installed on visitor's device** — `wa.me` URL fallback: opens WhatsApp Web in browser. Standard behavior; no special handling needed.
- **Analytics insert fails (network, RLS, server error)** — `trackListingContactEvent` returns `{ ok: false, reason: 'insert_failed' }`; Sentry logged; WhatsApp navigation already happened (fire-and-forget); user-facing behavior UNCHANGED.
- **Self-click (owner clicks own button)** — `is_owner_click = true` inserted; `{ ok: false, reason: 'self_click' }` returned (caller doesn't care, navigation already happened).
- **Anonymous visitor + RLS rejects** — `events_insert_anon` policy requires `actor_user_id is null`; the action sets it to null for anonymous; no rejection expected. If it happens (e.g. session edge case): logged, navigation unaffected.
- **Locale missing** (rare — `locale` param is optional) — column allows null; row inserted with `locale = null`. No error.
- **Listing soft-deleted (deleted_at IS NOT NULL)** — listing detail page itself should not render for soft-deleted listings; if it does, button is rendered (out of scope to guard here — existing page-level logic owns this).
- **Double-click rapid** — each click fires one analytics call; no debounce needed (each click is a real event). The browser opens one WhatsApp instance.
- **Mobile viewport at 320px** — button must not overflow the contact card; icon + label must remain readable; touch target ≥44×44.
- **All 7 breakpoints (320/375/390/768/1280/1440/2560)** — walked; no overflow, no clipping.
- **Locale switch mid-page** — server re-renders with new locale; button label + aria + preset text update; phone normalization unchanged.

Required investigation (paste outputs into session log):

1. Locate the contact card component:
   ```
   grep -rln "Send message\|ListingContact\|contact-card\|WhatsApp" src/components/listing src/modules/listings 2>/dev/null
   ```

2. Confirm the phone helpers:
   ```
   grep -n "^export" src/lib/phone/index.ts
   ```

3. Confirm the canonical server-user resolver:
   ```
   grep -rn "getServerUser\|createServerClient\|getUser()" src/modules/listings/actions src/lib/auth 2>/dev/null | head -10
   ```

4. Confirm there is no existing `listing_contact_events` table or
   equivalent (avoid duplicate):
   ```
   grep -rn "listing_contact_events\|contact_events\|listing_views" src/types/database.ts docs/rls-rules.md scripts/schema-drift-check.sql
   ```
   Note: `listing_views` already exists; do NOT reuse it (different
   semantic — views are page-view counters, not contact clicks).

5. Confirm current contact-card control inventory (before-state for
   Note 20):
   ```
   grep -nE "<(Button|button|a)\s" src/components/listing/ListingContact.tsx 2>/dev/null
   ```
   (Adjust path if grep above identified a different file.)

6. Confirm there is no existing WhatsApp component:
   ```
   grep -rln "WhatsApp\|wa\.me" src/ | grep -v node_modules
   ```

7. Confirm the existing locale namespace + 4 files:
   ```
   grep -n "\"listing\":" messages/sq.json
   ls messages/
   ```

8. Confirm the schema-drift baseline:
   ```
   wc -l scripts/schema-drift-check.sql
   ```

Scope (files Sonnet may touch):

1. `src/components/listing/WhatsAppContactButton.tsx` — NEW.
2. `src/modules/listings/actions/contactEvents.ts` — NEW.
3. `src/components/listing/ListingContact.tsx` (or actual contact-card file from grep #1) — wire the new button in.
4. `src/types/database.ts` — add `ListingContactEvent` interface.
5. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 3 new keys each.
6. `scripts/schema-drift-check.sql` — re-emit via `npm run check:schema-drift` after type added (drift count will rise by +1 table / +9 cols).
7. `docs/backlog.md` — standard task-closure update.
8. `docs/sessions/2026-05-28-task-277-whatsapp-cta-restore.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- Other contact-card controls (Send message / Save / Favorite / Share / Report) — keep as-is.
- Listing detail page layout (gallery, info, related, etc.).
- Phone normalization helpers (consume; do NOT modify).
- European country codes data (Task 187 — consume as-is).
- Analytics page / charts / KPI cards — Task 285 spec will cover.
- Admin analytics settings — Task 285 will spec.
- Paid-plan gating — out of scope.
- Phone verification — out of scope.
- Existing messaging system.
- Favorite / save / share / report behavior.
- RLS policies on other tables.
- Service-role usage.
- Owner runs the SQL — do NOT execute SQL from Sonnet.

Acceptance criteria (literal):
- WhatsApp button visible on listing detail when seller has valid phone; hidden cleanly otherwise.
- URL is `https://wa.me/<digits>?text=<urlencoded>`; no `+`, no spaces, no `(` `)` `-`; country code not duplicated.
- Localized button label, aria-label, preset message (12 entries across 4 locales).
- Opens in new tab (`target="_blank" rel="noopener noreferrer"`).
- All 5 existing contact-card controls remain reachable (Note 20 before/after inventory in session log).
- `listing_contact_events` table created with the exact schema above; RLS enabled; 3 policies applied; 2 indexes added.
- `ListingContactEvent` type added to `src/types/database.ts`.
- `trackListingContactEvent({ ... })` action exists with the documented signature; self-click sets `is_owner_click=true` and returns `{ ok: false, reason: 'self_click' }`; insert failure returns `{ ok: false, reason: 'insert_failed' }`; never throws; non-blocking from the caller's POV.
- Click fires the action fire-and-forget; navigation is NEVER blocked by analytics.
- `npm run check:schema-drift` clean post-migration apply (owner runs SQL; verifies).
- Every negative branch listed above → verifiable diff line.
- `tsc=0` errors.
- 7 breakpoints walked, no overflow at 320px `uk`.
- Note 18 self-validation block + Note 20 before/after inventory in session log.
- "Files Changed" table per Task 264 lists 8-9 paths (6 modified/new + locales).
- Self-validation verdict line.

Final report required from Sonnet:
1. Files Changed table.
2. SQL emitted (paste in session log + as artifact in `scripts/`).
3. Contact-card before/after control inventory.
4. Phone normalization approach (which helper + sample E.164 output).
5. Locale-key parity (3 × 4 = 12 entries; per-file count).
6. RLS policy summary (3 policies).
7. Self-click guard runtime evidence (manual test as owner of own listing).
8. Note 18 self-validation verdict line.
9. Confirmation that no other contact-card control was modified.
10. Confirmation that no analytics page / chart / KPI was built.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
apply the SQL. Do NOT build the analytics page. Do NOT touch any
out-of-scope file.
```
