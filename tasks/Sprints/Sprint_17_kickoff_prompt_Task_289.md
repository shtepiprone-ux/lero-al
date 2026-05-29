# Sprint 17 — Task 289 kickoff (CORRECTIVE: re-scope Task 277 WhatsApp CTA to authenticated users only + remove service-role leak)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 1** (no scope change), **clause 2** (do not invent architecture — STOP & ASK), **clause 3** (no silent control removal), **clause 5** (UX flow preservation), **clause 6** (current + after behavior documented).
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 7** (every new/changed user-facing string covers all four locales `sq`/`en`/`uk`/`it` in the same key set; runtime locale switching visually confirmed).
> - `docs/agent-contract.md` **clause 8** (7 breakpoints: 320, 375, 390, 768, 1280, 1440, 2560).
> - `docs/agent-contract.md` **clause 9** (validation before complete: `tsc=0`, build, AC-by-AC self-audit).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. **Sonnet MUST NOT emit `git add` / `git commit` and MUST NOT run git.** The owner runs git in PowerShell; the orchestrator emits the commit commands during review.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **MIXED task: "DB / server action / RLS task" bundle + "UI / layout / component task" bundle** (this touches RLS/SQL/server-action privacy *and* the listing contact-card components). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI surface → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

> **This is a CORRECTIVE task.** Task 277 over-expanded scope. It was meant to *restore the WhatsApp button for authenticated users*; instead it exposed the seller's WhatsApp number and `wa.me` link to **anonymous visitors** by fetching the owner phone with `createAdminClient()` (service-role) for **all** visitors. Your job is to restore the intended **authenticated-only** behavior and remove the privacy/RLS bypass — without removing any unrelated contact-card control.

---

## Pre-read (in this order)

1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/rule-index.md`
4. `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md` (DB/RLS bundle)
5. `docs/ui-rules.md`, `docs/component-rules.md` (UI bundle)
6. `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18, 19, 20)
7. `tasks/Sprints/Sprint_17_kickoff_prompt_Task_277.md` (the original, under-specified kickoff)
8. `docs/sessions/2026-05-29-task-277-whatsapp-cta-restore.md` (where Sonnet documented the wrong decision verbatim)
9. Current implementation files changed by Task 277 (listed in §"Files in scope").

---

## ⚠️ PREREQUISITE — page.tsx integrity (BLOCKER, verify FIRST)

The orchestrator found that in the current working tree, `src/app/[locale]/listings/[slug]/page.tsx`
**appears truncated** — it ends mid-JSX around line 513 at `<SimilarListings` with no closing tags,
and `LazyListingContact` is **imported (lines 47–48) but never rendered** (the desktop sidebar /
right column of the `lg:grid-cols-[1fr_320px]` layout is missing). A truncated file cannot compile,
which contradicts the Task 277 session log's `tsc=0` claim.

**Before any other work:**

1. Run `npx tsc --noEmit` and `pnpm build`. If they fail on `page.tsx`, the file is genuinely broken
   in the working tree.
2. **STOP & ASK the orchestrator/owner** if the file is truncated — this may be working-tree
   corruption from the dual-writer git issue (`CLAUDE.md` → "Git safety"), and the owner may need to
   restore the file from a clean commit in PowerShell *before* you proceed. Do **not** silently
   reconstruct large amounts of JSX you cannot verify.
3. Only once `page.tsx` is confirmed complete and compiling (with the desktop `ListingContact`
   sidebar render present) do you continue with the corrective work below. The desktop sidebar
   contact card MUST exist in the final file.

---

## Problem statement (what Task 277 got wrong)

**Intended product rule:** the WhatsApp button on the listing details contact card is visible
**only to authenticated users** (when the listing owner has a valid WhatsApp number). The reported
bug was that the button *disappeared / did not show where it should have* — for authenticated users.
The bug was **NOT** "show WhatsApp to anonymous visitors."

**What Task 277 actually did** (confirmed in code + session log):

- `src/app/[locale]/listings/[slug]/page.tsx` lines 217–225 call `createAdminClient()` (service-role)
  to read `users.whatsapp` for **every** visitor (the log states: "Fetch owner's WhatsApp number for
  ALL visitors (incl. anonymous) using service-role … Anonymous visitors are the highest-intent
  audience"). The parsed `dialCode` + `national` are passed as props to the client components.
- `ListingMobileCTA.tsx` renders `WhatsAppContactButton` whenever `hasPrebuiltWa` (= props present),
  with **no `isGuest` check** → the WhatsApp button and the `wa.me` URL are rendered into the SSR
  HTML **for anonymous users** on mobile.
- `ListingContact.tsx` (desktop) gates the visible button behind `!showGuestCTA`, but the raw
  WhatsApp number is still **serialized into the client-component props / SSR payload for guests** —
  PII leak even when the button is hidden.

This bypasses RLS (`public_user_profiles` is authenticated-only; `get_listing_owner_contact` RPC is
`REVOKE EXECUTE FROM anon` per Task 269) and changes the privacy model. It must be reverted.

---

## Correct business rule (enforce exactly)

**Anonymous visitor:**
- MUST NOT see the WhatsApp button (desktop sidebar AND mobile CTA bar).
- MUST NOT receive a `wa.me` URL.
- MUST NOT receive the seller's WhatsApp number in HTML, component props, JSON payload, or any
  server-preloaded data.
- MUST NOT be able to trigger WhatsApp contact analytics (the CTA is simply absent).
- MUST NOT gain access via `createAdminClient()`, `public_user_profiles`, or any fallback path.

**Authenticated visitor (non-owner):**
- MUST see the WhatsApp button **if** the listing owner has a valid WhatsApp number.
- MUST NOT see it if the owner has no WhatsApp number or the number is invalid.
- MUST be able to click it and open the correct `https://wa.me/<digits>?text=<encoded>` link.
- MUST have the click tracked (analytics foundation stays in scope — authenticated path only).
- MUST NOT be hit by the old bug where the button failed to appear.

**Listing owner / self-click:**
- Decision (orchestrator): **keep current owner/self behavior — do not change it silently.**
  The owner may still see their own contact card per existing pre-277 behavior. If `has_whatsapp`
  is true for the owner viewing their own listing, the button may render, but a self-click MUST NOT
  count as a real lead: `trackListingContactEvent` already returns `{ ok: false, reason: 'self_click' }`
  and sets `is_owner_click=true` — preserve that exactly. Document the final owner/self behavior
  explicitly in your session log AC table.

---

## Required architecture correction — CHOSEN APPROACH

The orchestrator has chosen **Option B (restore the existing authenticated-only click-to-reveal RPC
path)** as the primary approach, because the infrastructure already exists and is the strongest
privacy posture:

- `get_listing_owner_contact` RPC already exists (`src/modules/listings/actions/getListingOwnerContact.ts`),
  is authenticated-only (`REVOKE EXECUTE FROM anon`, Task 269), and is **still imported and used** by
  both `ListingContact.tsx` (line 81) and `ListingMobileCTA.tsx` (line 38). The original
  `handleContactClick('whatsapp')` reveal handler is intact in `ListingContact.tsx` (lines 77–88).
- With Option B, the WhatsApp number is **never** placed in SSR HTML/props for anyone — it is fetched
  on click, only for authenticated users, only through the RLS-protected RPC.

**What this means concretely:**

1. **Remove** the `createAdminClient()` WhatsApp fetch block in `page.tsx` (lines ~214–225) and stop
   passing `ownerWaDialCode` / `ownerWaNational` (and the `whatsappDialCode` / `whatsappNational`
   props) down to the components. Remove the now-unused `createAdminClient` and `parsePhoneValue`
   imports from `page.tsx` if nothing else uses them (verify with grep before deleting).
2. **Drive WhatsApp visibility from `owner.has_whatsapp`** — which is populated only for authenticated
   viewers via `public_user_profiles` (the `authUser` branch, lines ~234–248). For guests `owner` is
   the fallback object with `has_whatsapp:false`, so the button is correctly absent.
3. **Diagnose the original "button disappeared" root cause for authenticated users** before assuming a
   fix. Confirm `owner.has_whatsapp` is actually true for an authenticated viewer when the seller has
   a WhatsApp number, that the render condition references it, and that the click-to-reveal RPC path
   works. State the root cause in the session log. If the root cause is ambiguous, STOP & ASK.
4. **`WhatsAppContactButton` component:** keep it ONLY if you can feed it without leaking — i.e. it is
   rendered only inside an authenticated, `has_whatsapp`-gated branch and the number reaches it only
   via the click-to-reveal RPC (not via SSR props). If retaining the prebuilt-URL UX (deep link +
   preset message) cannot be done without serializing the number into anon-visible HTML, **revert to
   the pre-277 click-to-reveal handler** (`handleContactClick('whatsapp')`) instead, and remove
   `WhatsAppContactButton` wiring. Preserve the localized preset message if it can be applied on the
   client after reveal.

**Acceptable alternative — Option A (only if click-to-reveal UX is explicitly undesired):** resolve
`getUser()` on the server first; for authenticated viewers ONLY, fetch the WhatsApp number via the
**auth-scoped** client/RPC (NEVER `createAdminClient()`), and only then build the `wa.me` URL and pass
it down. For anonymous viewers: no fetch, no props, no URL. The privacy invariants in "Correct
business rule" are identical and non-negotiable under either option. If you believe Option A is
clearly better for this codebase, STOP & ASK before switching.

**Forbidden (architecture):** Do NOT use `createAdminClient()` / service-role in the public listing
details Server Component to read owner contact data. Do NOT grant `anon` EXECUTE on contact-reveal
RPCs. Do NOT modify `public_user_profiles` RLS to expose WhatsApp data to anon. Do NOT add a new
public endpoint that reveals contact data without authentication.

---

## SQL / RLS decision for `listing_contact_events` (orchestrator ruling)

The Task 277 migration (`scripts/task-277-listing-contact-events.sql`) currently includes
`grant select on public.listing_contact_events to anon;` and a policy `events_insert_anon`
(`for insert to anon with check (actor_user_id is null)`). Under the corrected auth-only rule,
**anonymous users can never trigger a WhatsApp contact event**, so these are unnecessary attack
surface and must go.

**Required changes to the analytics layer:**
- **Keep** the `listing_contact_events` table, the `events_insert_authenticated` policy, the
  `events_select_owner` policy, the two indexes, and the `authenticated` GRANT (`select, insert`).
- **Remove** `grant select ... to anon;` and the `events_insert_anon` policy.
- Keep `service_role` grants as-is.

**SQL run state — RESOLVED (owner confirmation, 2026-05-29):** the owner has confirmed that
`scripts/task-277-listing-contact-events.sql` has **already been applied in Supabase**. Therefore the
corrective migration path applies (NOT an in-place edit of the original file):

- A corrective migration **`scripts/task-289-listing-contact-events-anon-revoke.sql` already exists**
  (created by the orchestrator). It runs:
  `drop policy if exists "events_insert_anon" on public.listing_contact_events;` +
  `revoke select on public.listing_contact_events from anon;` + `notify pgrst, 'reload schema';`
  and keeps the table, indexes, `events_insert_authenticated`, `events_select_owner`, the
  `authenticated` GRANT, and the `service_role` GRANT intact.
- **Do NOT edit `scripts/task-277-listing-contact-events.sql`** (it is already live; editing it would
  be misleading). Verify the corrective file's DROP/REVOKE names exactly match what Task 277 created
  (policy `events_insert_anon`, `grant select … to anon`). If they do not match the live schema,
  STOP & ASK before changing the migration.
- **Owner action after this task ships:** run `scripts/task-289-listing-contact-events-anon-revoke.sql`
  in Supabase Dashboard → SQL Editor; then re-run `node scripts/check-schema-drift.mjs` (expect no
  drift — only grants/policies changed, not table shape).
- Update `src/types/database.ts` / `scripts/check-schema-drift.mjs` / `scripts/schema-drift-check.sql`
  **only** if the SQL decision changes the table shape (it does not — only grants/policies change, so
  the generated drift baseline likely stays the same; verify and leave untouched if unchanged).

---

## Mandatory control-preservation rule (clause 3 — restated verbatim for this task)

Any existing contact-card control must either **remain**, **move to a specified new place**, or be
**explicitly listed as removed** with justification. **Silent removal is forbidden.** The following
must remain reachable unless the owner explicitly approves otherwise:

- WhatsApp button — **for authenticated users when seller has a valid WhatsApp number**;
- Call button behavior;
- Send message behavior;
- `FavoriteButton`;
- `SaveToCollectionButton`;
- Share button;
- `ListingReportDialog` where `canReport` is true;
- the desktop sidebar contact card;
- the mobile CTA bar.

Produce a before/after control inventory table (Note 20) in the session log for BOTH the desktop
sidebar and the mobile CTA bar.

---

## What Sonnet must do (work items)

1. Verify `page.tsx` integrity per the PREREQUISITE section; STOP & ASK if truncated.
2. Remove / gate the `createAdminClient()` WhatsApp fetch in `page.tsx`; stop passing the WhatsApp
   number props to the client components for any visitor.
3. Ensure anonymous visitors never receive `ownerWhatsappNational`, `ownerWhatsappDialCode`,
   `whatsappNational`, `whatsappDialCode`, `hasPrebuiltWa`, a `wa.me` URL, or any equivalent WhatsApp
   payload — in HTML, props, or preloaded server data.
4. `ListingContact.tsx`: render WhatsApp only when viewer is authenticated AND owner has a valid
   WhatsApp number AND contact state allows it. Restore reliance on `owner.has_whatsapp` + the
   auth-only reveal path.
5. `ListingMobileCTA.tsx`: apply the **same** auth-only WhatsApp visibility rule (it currently has no
   guest gate — add one). The mobile bar must not render the WhatsApp button for guests, and `page.tsx`
   must not render the mobile bar *solely because* a WhatsApp number exists for an anon viewer.
6. Keep the WhatsApp button hidden cleanly for anonymous users with no layout breakage at all 7
   breakpoints.
7. Keep the WhatsApp button visible + working for authenticated users when the seller has a valid
   WhatsApp number.
8. Preserve valid `wa.me` generation (no `+`, no spaces, country code not duplicated) for the
   authenticated path; preserve the localized preset message if it survives the chosen approach.
9. Preserve every non-WhatsApp contact-card control (inventory table required).
10. Apply the SQL/RLS decision above. Owner has confirmed the Task 277 migration is already live, so
    the fix ships as `scripts/task-289-listing-contact-events-anon-revoke.sql` (already created):
    verify its DROP POLICY / REVOKE names match the live schema; do NOT edit the original Task 277 SQL.
11. Update `src/types/database.ts` / schema-drift artifacts only if the table shape changes (it should
    not).
12. Update `docs/backlog.md` (Task 289 closure row + Task 277 corrected note).
13. Add a corrective session log `docs/sessions/2026-05-29-task-289-whatsapp-cta-auth-only-correction.md`
    with the required investigation table, root-cause finding, Note 20 inventories, and Files Changed
    table.

---

## Critical privacy / security requirements (forbidden list)

The implementation MUST NOT:
- expose seller WhatsApp numbers to anonymous users (HTML, props, JSON, preload);
- embed anon-visible `wa.me` links in HTML;
- use service-role / admin client to bypass RLS for public visitors;
- grant `anon` EXECUTE on contact-reveal RPCs;
- change `public_user_profiles` RLS to make WhatsApp data available to anon;
- introduce any new public endpoint that reveals contact data without authentication.

---

## Positive flow (happy path)

- Authenticated non-owner opens a listing whose seller has a valid WhatsApp number → WhatsApp button
  visible in desktop sidebar AND mobile CTA bar → click reveals/opens correct
  `https://wa.me/<digits>?text=<encoded>` → authenticated contact event inserted.

## Negative flow (every off-happy-path branch — clause 6a)

- **Anonymous visitor:** no WhatsApp button (desktop + mobile); no number/`wa.me` in HTML or props;
  no contact event possible from UI.
- **Seller has no WhatsApp number:** button absent for both anon and authenticated; layout stable.
- **Seller WhatsApp number invalid** (fails `^\d{7,15}$` after normalization, or empty dial code):
  button absent / `WhatsAppContactButton` returns null; no broken link.
- **Owner views own listing (self-click):** behavior unchanged; if button shows, self-click sets
  `is_owner_click=true` and returns `{ ok:false, reason:'self_click' }` (not a real lead).
- **Zombie session** (valid JWT, no profile row → treated as guest): no WhatsApp button, no number.
- **Reveal RPC error / analytics insert error:** no throw; navigation never blocked; graceful no-op.
- **Locale mismatch / missing locale:** preset message + aria/label resolve in all 4 locales; no raw
  English leakage in `sq`/`uk`/`it`.

---

## Required validation / tests (run and report all)

**Guest / anonymous (listing with seller WhatsApp):**
- WhatsApp button NOT visible in desktop sidebar.
- WhatsApp button NOT visible in mobile CTA bar.
- Page HTML/props do NOT include the seller WhatsApp number.
- Page HTML/props do NOT include a `wa.me` URL for that seller.
- No anonymous WhatsApp contact event can be triggered from the UI.

**Authenticated non-owner (same listing):**
- WhatsApp button visible in desktop sidebar AND mobile CTA bar.
- Click opens correct `https://wa.me/<digits>?text=<encoded>` (no `+`, no spaces, no duplicated code).
- Contact event inserted (analytics table in scope).

**Seller has no WhatsApp:** anon and authenticated both see no WhatsApp button; layout stable.

**Owner/self:** per the owner/self behavior documented above; self-click not counted as a real lead.

**Regression:** Call, Send message, `FavoriteButton`, `SaveToCollectionButton`, Share, and
`ListingReportDialog` (when `canReport`) all unchanged on desktop and mobile; all 7 breakpoints pass.

**Commands to run (or document why impossible):**
```
pnpm lint
pnpm typecheck      # or: npx tsc --noEmit
pnpm build
node scripts/check-schema-drift.mjs
```

**Grep checks (paste results or a one-line explanation per result in the final report):**
```
grep -R "createAdminClient" -n src/app src/modules src/components
grep -R "wa.me" -n src/app src/modules src/components
grep -R "ownerWhatsapp\|whatsappNational\|whatsappDialCode\|ownerWa" -n src/app src/modules src/components
grep -R "events_insert_anon" -n scripts src docs
grep -R "getListingOwnerContact\|get_listing_owner_contact" -n src scripts docs
```
Expectation after the fix: `createAdminClient` no longer appears in the listing details page;
`wa.me` / WhatsApp number props appear only inside authenticated, `has_whatsapp`-gated branches (or
not at all in SSR if using pure click-to-reveal); `events_insert_anon` appears only in historical
session logs, not in active SQL.

---

## Out of scope

- Do NOT build the future listing analytics page; no charts, dashboards, KPIs, or admin analytics UI.
- Do NOT expose WhatsApp to guests.
- Do NOT change the listing details layout beyond what is necessary to correct WhatsApp visibility
  (restoring a truncated `page.tsx` to its known-good state is allowed only after STOP & ASK).
- Do NOT rewrite unrelated contact-card controls.
- Do NOT change unrelated RLS policies.
- Do NOT make `public_user_profiles` expose WhatsApp data to anon.
- Do NOT grant anon access to contact-reveal RPCs.
- Do NOT start a global design-system refactor here.
- Do NOT rewrite unrelated locale namespaces.

---

## Acceptance criteria (orchestrator will verify against the diff, not the report)

- [ ] `page.tsx` integrity confirmed (compiles; desktop `ListingContact` sidebar present); STOP & ASK was used if it was truncated.
- [ ] `createAdminClient()` WhatsApp fetch removed from `page.tsx`; unused imports cleaned.
- [ ] Anonymous visitors receive NO WhatsApp number / `wa.me` URL / WhatsApp props in HTML or props (verified via view-source / network).
- [ ] `ListingContact.tsx` renders WhatsApp only for authenticated viewers with a valid-WhatsApp owner.
- [ ] `ListingMobileCTA.tsx` enforces the same auth-only WhatsApp rule (guest gate added).
- [ ] Authenticated viewer sees a working WhatsApp button + correct `wa.me` link; root cause of the original disappearance documented.
- [ ] Owner/self behavior unchanged and documented; self-click not counted as a real lead.
- [ ] All non-WhatsApp contact-card controls preserved (Note 20 before/after table for desktop + mobile).
- [ ] SQL/RLS: anon grant + `events_insert_anon` removed via `scripts/task-289-listing-contact-events-anon-revoke.sql` (owner confirmed Task 277 SQL already live); DROP/REVOKE names verified against live schema; original Task 277 SQL left unedited.
- [ ] Positive + every negative flow implemented and cited by name in the AC self-audit table.
- [ ] 4 locales intact; 7 breakpoints verified; `tsc=0`; `pnpm build` clean; drift check addressed.
- [ ] `docs/backlog.md` updated; corrective session log added with Files Changed table.
- [ ] Session log contains NO `git add` / `git commit`; executor did NOT run git.

---

## Files in scope (touch only what the correction requires)

- `src/app/[locale]/listings/[slug]/page.tsx` — remove admin-client WhatsApp fetch + props; integrity.
- `src/modules/listings/components/ListingContact.tsx` — auth-only WhatsApp gating (desktop).
- `src/modules/listings/components/ListingMobileCTA.tsx` — auth-only WhatsApp gating (mobile; add guest gate).
- `src/components/listing/WhatsAppContactButton.tsx` — keep only if fed without leaking; else remove wiring.
- `src/modules/listings/actions/contactEvents.ts` — authenticated/self-click analytics; remove any anon-click assumption.
- `scripts/task-289-listing-contact-events-anon-revoke.sql` — corrective migration (ALREADY CREATED; owner confirmed Task 277 SQL is live). Do NOT edit `scripts/task-277-listing-contact-events.sql`.
- `src/types/database.ts`, `scripts/check-schema-drift.mjs`, `scripts/schema-drift-check.sql` — only if table shape changes (it should not).
- `messages/sq.json` / `en.json` / `uk.json` / `it.json` — only if user-facing strings change.
- `docs/backlog.md`, `docs/sessions/2026-05-29-task-289-whatsapp-cta-auth-only-correction.md`.

Do not modify files outside this list. If the correction appears to require a file not listed here,
STOP & ASK the orchestrator.
