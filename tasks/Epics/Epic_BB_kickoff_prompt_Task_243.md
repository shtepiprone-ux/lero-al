# Epic BB — Task 243 kickoff — Listing inquiry / "Send message" flow (Path A minimal inquiry, default)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to
> the current P0 contract + Positive/Negative two-flow rule. Implements Epic BB Task 243 (source: `issues.txt` #101).
> **🚩 OWNER DECISION GATE (Path A vs Path B) — see below. Default = Path A. Do NOT build Path B (chat) without
> written owner approval — STOP & ASK first.**

```
Type:        bug + feature
Priority:    high
Area:        public listing detail — "Надіслати повідомлення" / Send message button + supporting backend
             src/modules/listings/components/ListingContact.tsx + ListingMobileCTA.tsx (where the button lives)
             reuse Epic V pattern: contact_inquiries table + admin inquiries + Resend reply
```

## Bug / Goal
The "Send message" button on the public listing detail returns a **404** — no inquiry/chat path is wired. Build the
smallest correct thing: a **listing-to-owner inquiry** that works for guest AND signed-in users, mirroring the Epic V
`contact_inquiries` pattern (table → admin view → Resend reply), NOT real-time chat.

## 🚩 Owner decision gate — investigate, then confirm the path
1. **Investigate FIRST (Note: no fake fixes).** Grep the repo for any existing chat/inquiry-to-owner infrastructure
   (`listing_inquiries`, `contact_inquiries`, message threads, realtime channels). Document findings in the session log
   BEFORE touching code. If something was started/abandoned, list it.
2. **Path A (recommended default, build this):** a `listing_inquiries` table (OR extend `contact_inquiries` with
   `listing_id` — pick based on the Epic V schema, document the choice + EXACT idempotent SQL in the session log,
   single-writer, owner runs it) + a server action + a **canonical `Dialog`** form on the listing detail (name, email,
   message; subject optional) + Resend notification to the listing owner with **Reply-To = inquirer's email**. Guest
   support with the same email validation + rate-limiting as Epic V. No admin inquiries page in THIS task (follow-up Epic
   if wanted).
3. **Path B (real-time chat):** significantly larger. **Forbidden without written owner approval.** If the owner wants
   it, STOP & ASK — the kickoff is revised, not silently extended.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "DB / server action / RLS task" + "Email / auth lifecycle task" + "UI / layout / component task"
   → `data-access-rules`, `rls-rules`, `domain-rules`, `integrations` (Resend + `docs/env.md` `NEXT_PUBLIC_SITE_URL`),
   `design-system.md` (§12 forms, §14 dialogs, §16), `qa-rules`.
3. `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md` (Task 243 spec) + Epic V session logs (Tasks 222/223
   `contact_inquiries` + Resend reply).
4. Read before editing: `ListingContact.tsx`, `ListingMobileCTA.tsx` (the Send-message button + guest/auth gating),
   the Epic V inquiry server action + Resend sender, the canonical `dialog.tsx`.
5. `package.json` validation scripts.

## Current behavior to preserve (Notes 19/20)
- The Report button + `ListingReportDialog` (Task 242, done) on the same surface — must keep working; do not regress it.
- Existing contact card controls (call/WhatsApp click-to-reveal RPC, owner info) — preserve.
- Guest vs signed-in gating already present on the contact surface — preserve and extend to the inquiry form.
- Inventory every contact-surface control before/after in the session log (Note 20).

## 🔴 Mobile <640 full-width gate (clause 11)
The inquiry `Dialog` renders as a **full-width bottom sheet at <640** (canonical Dialog: drag-handle, ≤90dvh scroll,
Esc + backdrop close, focus return). Form fields + submit are `max-sm:w-full`, ≥44px; labels wrap (sq/en/uk/it). The
"Send message" trigger itself is full-width at `max-sm`. No h-scroll at 320.

## Positive flow (happy path)
As a guest AND as a signed-in user at `uk` 375px on a published listing detail:
1. Click "Надіслати повідомлення" → the inquiry form opens (full-width bottom sheet).
2. Fill name + email (prefilled for signed-in) + message → Submit.
3. A `listing_inquiries` (or extended `contact_inquiries`) row is persisted with `listing_id` + inquirer fields.
4. The listing owner receives a Resend email with Reply-To = inquirer's email (CTA URLs use `NEXT_PUBLIC_SITE_URL`).
5. Success toast (i18n ×4); dialog closes.

## Negative flow (every branch needs a diff line)
- Invalid/empty email or message → inline validation + early return, no row, no email.
- Server error / Resend failure → error toast; if the row persisted but email failed, follow the Epic V contract
  (document which); no silent success.
- Rate-limit exceeded (same pattern as Epic V) → friendly toast, no spam row.
- Unauthenticated still allowed (guest) — but bot/abuse guarded as Epic V does.
- Cancel/dismiss (Esc/backdrop) → closes, no row, focus returns.
- Double-submit → submit disabled while pending.
- Owner is the viewer (self-inquiry) → guard per Epic V (no self-inquiry) or document allowed.
- Locale mismatch → all labels + email body resolve correctly (email is sq-only per Epic GG policy — confirm).

## Acceptance criteria
- "Send message" opens a canonical `Dialog` inquiry form; submit persists a row + notifies the owner via Resend with
  inquirer email as Reply-To. Guest + signed-in both work.
- Path B (chat) NOT implemented unless owner approved in writing.
- Report button (Task 242) + contact controls preserved (before/after inventory; Note 20).
- Positive + every Negative branch verifiable in diff.
- **Exact SQL** for any new table/columns in the session log (single-writer; owner runs it).
- **Rendered matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it; uk@320/375/390; bottom-sheet at <640 shown.
- `tsc=0`, `lint=0`, `check:i18n` parity PASS (form labels ×4), `npm run build` passes.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- Admin inquiry dashboard for listing inquiries (follow-up Epic). Real-time chat (Path B) unless approved.
- Changing the Report flow or the WhatsApp/contact-reveal RPC. Outbound email language policy (stays sq-only).
