# Session Log — Task 289 (Opus 4.7 orchestration): Corrective re-scope of Task 277 WhatsApp CTA → authenticated-only

**Date:** 2026-05-29
**Task:** 289 (corrective orchestration / bugfix planning)
**Sprint:** 17
**Role:** Opus 4.7 — orchestrator / architect / reviewer (no production code written; read-only verification + kickoff authoring)
**Trigger:** Owner report — Task 277 changed the business rule; WhatsApp CTA exposed to anonymous visitors via service-role fetch.

---

## Task number selection

Backlog task numbers run through 288 (`Sprint_17_kickoff_prompt_Task_288.md`, i18n audit, already filed).
The owner's draft suggested "Task 278", but 278 is already used (Premium CTA). **Next free global number = 289.**

---

## Summary of Task 277 mis-scope

Task 277 was meant to **restore the WhatsApp button for authenticated users** (it had stopped appearing
where it should). Instead, Sonnet re-interpreted the bug as "WhatsApp not reaching anonymous visitors"
and implemented a **service-role (`createAdminClient()`) server-side fetch of `users.whatsapp` for ALL
visitors**, passing the parsed number to the client components. The session log states this verbatim:
"Fetch owner's WhatsApp number for ALL visitors (incl. anonymous) using service-role … Anonymous
visitors are the highest-intent audience." This bypasses RLS (`public_user_profiles` is
authenticated-only; `get_listing_owner_contact` is `REVOKE EXECUTE FROM anon` per Task 269) and leaks
seller PII to anonymous users.

**Root cause on the orchestrator side:** the Task 277 kickoff under-specified the auth-gating rule —
it did not state "authenticated-only" as a hard invariant, nor forbid service-role/admin-client fetching
of contact data, nor require an anon-visibility negative-flow test. That gap let the executor invent the
wrong architecture. Task 289's kickoff closes that gap with explicit anon/authenticated invariants, a
forbidden-list, and anon-leak verification steps.

---

## Required investigation table

| Area | File | Current Task 277 behavior | Intended behavior | Needs correction? |
|---|---|---|---|---|
| Desktop contact card | `src/modules/listings/components/ListingContact.tsx` | WhatsApp button gated behind `!showGuestCTA`; but WhatsApp number is passed in as props (`ownerWhatsappNational/DialCode`) for guests → PII in client payload even when button hidden | WhatsApp visible only to authenticated viewers with valid-WhatsApp owner; number never in anon payload | **Yes** |
| Mobile CTA bar | `src/modules/listings/components/ListingMobileCTA.tsx` | `hasPrebuiltWa = !!(whatsappNational && whatsappDialCode)`; renders `WhatsAppContactButton` with **no `isGuest` check** → button + `wa.me` URL shown to anon on mobile | Same auth-only rule as desktop; guest gate added | **Yes (functional leak)** |
| Listing page data fetch | `src/app/[locale]/listings/[slug]/page.tsx` | Lines 217–225 `createAdminClient().from('users').select('whatsapp')` for ALL visitors; passes number props to both components; renders mobile bar when `owner.has_phone || !!ownerWaNational` | Remove admin fetch; gate via `owner.has_whatsapp` (authenticated branch only); no WhatsApp props for anon | **Yes** |
| WhatsApp button component | `src/components/listing/WhatsAppContactButton.tsx` | Builds `wa.me` URL from props at render; fires fire-and-forget analytics on click | Keep only if fed via auth path without SSR-leaking the number; else revert to click-to-reveal | **Conditional** |
| Contact analytics action | `src/modules/listings/actions/contactEvents.ts` | Resolves `getUser()`; inserts row; `actor_user_id=null` for anon allowed; self-click → `{ok:false,'self_click'}` | Authenticated + self-click only; no anon-click assumption | **Minor** |
| Contact analytics SQL | `scripts/task-277-listing-contact-events.sql` | `grant select to anon` + `events_insert_anon` policy (`actor_user_id is null`) | Remove anon grant + anon-insert policy; keep authenticated insert + owner select | **Yes** |
| RLS / anon behavior | SQL + `get_listing_owner_contact` RPC | RPC already `REVOKE FROM anon` (Task 269) — correct; but admin-client fetch bypasses it | Rely on RPC for reveal; no service-role bypass | **Yes (page.tsx only)** |
| Locale keys | `messages/*.json` | 3 keys ×4 added (`whatsapp_button_label/aria_label/preset_message`) | Keep; edit only if strings change | No (unless approach changes text) |

### Direct answers to the 7 required questions

1. **Renders WhatsApp for anonymous users?** Yes — mobile CTA renders the button + `wa.me` for anon (no guest gate). Desktop hides the visible button via `showGuestCTA` but still serializes the number into client props for guests.
2. **Fetches owner WhatsApp with `createAdminClient()`?** Yes — `page.tsx` lines 217–225.
3. **Embeds number / `wa.me` in HTML/props for anon?** Yes — props passed to both client components for all visitors; mobile builds the `wa.me` `href` into SSR HTML.
4. **Preserves existing controls (Call, Send message, Favorite, Save, Share, Report)?** Per the Task 277 log, yes — but the **working-tree `page.tsx` is currently truncated** (see blocker below), so the desktop sidebar render is missing right now and must be restored/verified.
5. **Is the Task 277 SQL still needed?** The table + authenticated insert + owner select: yes (analytics foundation stays). The anon GRANT + `events_insert_anon` policy: no — remove.
6. **Anon insert policy — remain / remove / narrow?** **Remove.** Auth-only contact = no anon contact events from this surface.
7. **Existing authenticated-only RPC to reuse?** **Yes — `get_listing_owner_contact`** (`src/modules/listings/actions/getListingOwnerContact.ts`), already anon-revoked (Task 269), still imported by both components. This is the basis for the chosen Option B.

---

## ⚠️ Additional critical finding — `page.tsx` truncated in working tree

`src/app/[locale]/listings/[slug]/page.tsx` (25,545 bytes, 514 lines) ends mid-JSX at line 513
(`<SimilarListings` + trailing whitespace) with no closing tags, and `LazyListingContact` is imported
(lines 47–48) but **never rendered** — the `lg:grid-cols-[1fr_320px]` right column (desktop contact
sidebar) is absent. A truncated file cannot compile, which contradicts the Task 277 log's `tsc=0` claim.

The working tree also has ~28 uncommitted modified files spanning Tasks 277/279/280/281, consistent with
the dual-writer git hazard documented in `CLAUDE.md` ("two git processes on the same `.git` corrupt
`.git/index`"). **This is likely working-tree corruption, not an intentional Task 277 change.** The
corrective kickoff makes "verify `page.tsx` integrity, STOP & ASK if truncated" the first prerequisite,
and the owner should verify/restore the file from a clean commit in PowerShell before Sonnet proceeds.

---

## Chosen corrective architecture (for Sonnet)

**Option B (primary): restore the existing authenticated-only click-to-reveal RPC path.** Rationale:
`get_listing_owner_contact` already exists, is RLS-protected, anon-revoked, and still wired into both
components; the original `handleContactClick('whatsapp')` handler is intact. This keeps the WhatsApp
number out of SSR HTML/props entirely (revealed on click, authenticated-only). Visibility driven by
`owner.has_whatsapp` (populated only for authenticated viewers via `public_user_profiles`).

**Option A (acceptable alternative, only if click-to-reveal UX is rejected):** resolve `getUser()`
server-side first; for authenticated viewers only, fetch the number via the **auth-scoped** client/RPC
(never admin client) and build the `wa.me` URL; anon → no fetch/props/URL. Privacy invariants identical.

`createAdminClient()` for public contact data is forbidden under either option.

---

## SQL / `listing_contact_events` decision

Keep the table, `events_insert_authenticated`, `events_select_owner`, both indexes, and the
`authenticated` GRANT. **Remove** `grant select ... to anon` and the `events_insert_anon` policy.

**RESOLVED — owner confirmation (2026-05-29):** the owner confirmed that
`scripts/task-277-listing-contact-events.sql` has **already been applied in Supabase**. So the fix
ships as a follow-up corrective migration, **not** an edit to the original file. The orchestrator
created `scripts/task-289-listing-contact-events-anon-revoke.sql`:
```sql
drop policy if exists "events_insert_anon" on public.listing_contact_events;
revoke select on public.listing_contact_events from anon;
notify pgrst, 'reload schema';
```
This keeps the table, indexes, `events_insert_authenticated`, `events_select_owner`, the
`authenticated` GRANT and the `service_role` GRANT intact.

**Owner action:** run `scripts/task-289-listing-contact-events-anon-revoke.sql` in Supabase →
SQL Editor (after Task 289 ships), then re-run `node scripts/check-schema-drift.mjs` (no drift
expected — only grants/policies changed).

---

## Files changed by Opus (this orchestration task)

| File | Change | Rationale |
|---|---|---|
| `tasks/Sprints/Sprint_17_kickoff_prompt_Task_289.md` | NEW | Full corrective Sonnet 4.6 kickoff (contract, AC, privacy invariants, validation + grep checks, SQL decision, control-preservation, page.tsx blocker). |
| `docs/backlog.md` | Added Task 289 archive row; annotated Task 277 row as over-scoped/corrected | Task closure tracking + traceability. |
| `docs/sessions/2026-05-29-task-289-opus-orchestration-whatsapp-correction.md` | NEW | This session log. |
| `scripts/task-289-listing-contact-events-anon-revoke.sql` | NEW | Corrective migration — drops `events_insert_anon` + revokes anon SELECT (owner confirmed Task 277 SQL already live). Created at owner's explicit request. |

No application/product code modified by Opus (orchestrator role). The only SQL is the corrective
migration explicitly requested by the owner.

---

## Validation performed by Opus

- Read Task 277 session log + all in-scope implementation files (page.tsx, ListingContact, ListingMobileCTA, WhatsAppContactButton, contactEvents, SQL).
- Confirmed the anon-exposure path in code (mobile CTA has no guest gate; admin-client fetch for all visitors; number in props for guests).
- Confirmed `get_listing_owner_contact` exists, is anon-revoked, and is still wired — basis for Option B.
- Confirmed Task 277 SQL grants anon SELECT + `events_insert_anon`.
- Confirmed next free task number = 289.
- Flagged truncated `page.tsx` (blocker) and the dual-writer working-tree risk.

---

## Ready-to-run git commands for the owner (run ONLY in PowerShell)

> Explicit paths only — never `git add -A`/`-u`/wildcards (phantom-corruption mode on the Cowork
> sandbox). If `git status` shows phantom mods first run:
> `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`

```
git add tasks/Sprints/Sprint_17_kickoff_prompt_Task_289.md docs/backlog.md "docs/sessions/2026-05-29-task-289-opus-orchestration-whatsapp-correction.md" scripts/task-289-listing-contact-events-anon-revoke.sql
git commit -m "docs(Task289): corrective kickoff (WhatsApp CTA authenticated-only) + anon-revoke migration for listing_contact_events"
```

**Run the SQL in Supabase** (owner confirmed Task 277 migration already live):
`scripts/task-289-listing-contact-events-anon-revoke.sql` → Supabase Dashboard → SQL Editor.

> Note: the working tree currently contains uncommitted Task 277/279/280/281 changes and a possibly
> truncated `page.tsx`. Verify `page.tsx` integrity (and commit/triage the other tasks) separately
> before handing Task 289 to Sonnet.
