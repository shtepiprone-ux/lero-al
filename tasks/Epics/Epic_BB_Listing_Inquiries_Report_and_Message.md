# Epic BB — Listing Inquiries: Report & Message

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #100 (the "Поскаржитись" / Report button on the public
listing detail does not work, even though the reporting backend was built in Epic C); #101 (the
"Надіслати повідомлення" / Send message button on the public listing detail returns a 404 —
verify whether a chat / inquiry path exists inside the service, and if it does not, implement one
per 2026 UI/UX best practice).
**Kickoffs:** `Epic_BB_kickoff_prompts.md` (Tasks 242–243).

> Both surfaces live on the public listing detail page. Both already have a visible button. Both
> are broken in different ways. Y.1 (raw-key labels) is a separate Epic — these two tasks are
> about wiring, not labels.

## Goal

A working report button on the listing detail (Epic C is the backend); and a working
listing-to-owner inquiry path that works whether the user is a guest or signed in. If the
inquiry path does not yet exist in the service, implement a minimal viable version aligned with
the contact-inquiries pattern from Epic V (table → admin view → reply via Resend) rather than a
real-time chat — unless the owner explicitly asks for chat.

## Dependencies

- Epic C — Trust & Safety / Moderation (CLOSED): `ListingReportDialog` + `reportListingAction`
  shipped in Task 117; admin reports dashboard in Task 118; reporter notification in Task 125.
  The report button wiring should already exist — BB.1 is a regression / wiring bug.
- Epic V — Contacts & Inquiries (CLOSED): `contact_inquiries` table + admin inquiries page +
  Resend reply. BB.2 should reuse this pattern (or — if the owner wants a different model — STOP
  and ask before inventing a new table/architecture).
- Resend integration (`docs/integrations.md`), `docs/rls-rules.md`, `docs/env.md`.

## Tasks

### Task 242 — BB.1 — Listing report button broken on detail page

**Type:** bug
**Priority:** high
**Area:** public listing detail — Report button + `ListingReportDialog`

**Pre-read:** Task 117 session log (`ListingReportDialog` + `reportListingAction`); Task 118
(admin reports dashboard); Task 125 (reporter notification); `src/modules/listings/components/
ListingContact.tsx` (or wherever the Report button lives on the detail page);
`src/modules/listings/components/ListingReportDialog.tsx` (if present); `docs/ai-behavior.md`
Note 19 (UX flow preservation — the existing dialog should still mount).
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** The Report button is visible on the listing detail but clicking it does nothing /
errors. Reproduce, root-cause, and fix:
- Is the dialog mounted? Is the trigger correctly wired (`onClick`, `aria-controls`, `Dialog`
  open state)?
- Does the server action still resolve (`reportListingAction`)?
- Is there a regression from Note 20 (control removal) elsewhere — e.g. the trigger was lost in
  a recent refactor?

**Acceptance criteria:**
- Clicking Report on the listing detail opens the canonical `ListingReportDialog`; submitting
  creates a `reports` row reaching the admin reports dashboard exactly like Task 117 intended.
- Reporter notification (Task 125) still fires on status change.
- UX-flow trace in the session log: signed-in user reports → row appears in admin → status
  changes → notification email reaches reporter; guest behaviour matches Task 117 contract.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** redesigning the reports schema or admin dashboard; changing the email content
(Task 125 is closed).

### Task 243 — BB.2 — Listing inquiry / message flow

**Type:** bug + feature (depends on owner decision)
**Priority:** high
**Area:** public listing detail — "Send message" button + supporting backend

**Pre-read:** Epic V session logs (Tasks 222 + 223 — `contact_inquiries` pattern + Resend reply);
`src/modules/listings/components/ListingContact.tsx`; `src/modules/notifications/lib/emails/*`
(Resend senders); `docs/ai-behavior.md` (no fake fixes — if chat doesn't exist, build the smallest
correct thing, do not stub); `docs/data-access-rules.md`; `docs/rls-rules.md`.
**Localization coverage:** sq, en, uk, it (every form label + email body × 4).
**Responsive coverage:** all 7 breakpoints.

**Goal:**

1. **Investigate first.** Grep the repo for any existing chat / inquiry-to-owner infrastructure.
   Document the findings in the session log BEFORE touching code. If anything was started and
   abandoned, the kickoff lists what was found.
2. **Owner decision gate.** Two viable paths:
   - **Path A — minimal inquiry (recommended default):** mirror Epic V exactly — a
     `listing_inquiries` table (or extend `contact_inquiries` with `listing_id`), a server action,
     a Dialog form on the listing detail (subject? — optional; name; email; message), Resend
     notification to the listing owner with Reply-To = inquirer's email. No real-time chat. No
     admin inquiries page in this task — that can be a follow-up Epic if needed.
   - **Path B — real-time chat:** a chat thread between inquirer and owner persisted in the DB
     + realtime channel. This is significantly larger and Sonnet MUST stop and ask before
     starting it. The kickoff explicitly forbids inventing this without owner approval.
3. **Implement Path A** unless the owner directs otherwise during the kickoff.
4. **Guest support.** A guest can send an inquiry; the email validation is the same as Epic V;
   rate-limiting matches the existing pattern.

**Acceptance criteria:**
- Clicking "Send message" on the listing detail opens an inquiry form (canonical `Dialog`); on
  submit, a row is persisted, the owner is notified via Resend with the inquirer's email as
  Reply-To.
- Path B (chat) is NOT implemented unless the owner has approved it in writing — if approved,
  the kickoff is revised, not silently extended.
- UX-flow trace + control-inventory before/after; 4 locales; 7 breakpoints.
- Exact SQL for any new table/columns written to the session log (single-writer SQL — owner
  runs it).
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** admin inquiry dashboard for listing inquiries (file as a follow-up Epic if
owner wants it); real-time chat unless Path B is approved.

## Epic-level acceptance

Report button works end-to-end (existing Epic C wiring restored). Send-message works end-to-end
either as a minimal inquiry (Path A, default) or as chat (Path B, only if explicitly approved).
Both surfaces ship with a session-log UX-flow trace per Note 19 and a before/after control
inventory per Note 20.
