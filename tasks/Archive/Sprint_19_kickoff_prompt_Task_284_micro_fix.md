# Task 284 — Micro-fix (sidebar naming → "Internal Tickets")

> **Mandatory rules:** `docs/agent-contract.md` clause 6a + clause 10 (commit hand-off). You write code; orchestrator emits git commands; owner runs them.

> **Hard contract:** Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a TARGETED locale + docs fix. No scope change. No new refactors. STOP & ASK if anything beyond this list seems to need changing.

---

```
Type:        product naming fix (locale + docs)
Priority:    HIGH (blocks Task 284 commit hand-off)
Area:        admin sidebar labels, domain docs
Parent:      Task 284 (already validated technically; awaits this fix before commit)
```

## Why this fix exists

Orchestrator review of Task 284 found two issues with the sidebar label "Complaint Tickets" for `/admin/support`:

1. **Domain underspecification.** `support_tickets.ticket_type` is `'support' | 'user_complaint'`. "Complaint Tickets" excludes the `support` subtype and over-narrows the surface. Owner wants future-proof naming.
2. **UK locale collision + calque.** `uk.json` now reads `item_support: "Квитки скарг"` next to pre-existing `item_reports: "Скарги"` — both contain root "скарг". Plus "Квитки" is a calque (means event/bus ticket in Ukrainian, not a support ticket).

Owner decision: rename to **"Internal Tickets"** across ALL 4 locales.

## Required changes (literal — no expansion)

### 1. Locale files (4 files, 1 key each)
- `messages/en.json` → `admin.sidebar.item_support`: `"Complaint Tickets"` → `"Internal Tickets"`
- `messages/sq.json` → `admin.sidebar.item_support`: `"Biletat e Ankesave"` → `"Tiketat e brendshme"`
- `messages/uk.json` → `admin.sidebar.item_support`: `"Квитки скарг"` → `"Внутрішні тікети"`
- `messages/it.json` → `admin.sidebar.item_support`: `"Ticket reclami"` → `"Ticket interni"`

DO NOT touch `item_inquiries_support` / `item_inquiries_sales` / `item_reports` in any locale. They are correct.

### 2. `docs/domain-rules.md`
In the "Admin: Support Tickets vs Contact Inquiries (Task 284, 2026-05-29)" section:
- Heading `/admin/support — Internal Complaint Tickets (...)` → `/admin/support — Internal Tickets (...)`
- Body: replace the line `Sidebar label: "Complaint Tickets" (was ambiguously "Support")` with:
  ```
  Sidebar label: "Internal Tickets" (was ambiguously "Support"; broader name because ticket_type spans support + user_complaint and the surface is future-proofed for additional internal-admin ticket types).
  ```
- In the description, clarify: "Ticket types: `support` (general platform issue created internally) | `user_complaint` (one user reports another). UI currently defaults to `user_complaint` on create, but the surface is the universal internal-ticket workbench and may grow new subtypes."

### 3. `docs/sessions/2026-05-29-task-284-admin-unification.md`
- Update the decision table: rows for `/admin/support` should show `"Complaint Tickets"` → `"Internal Tickets"` (After column), and update the Domain column to `"Internal admin ticket system (universal — current subtypes: support, user_complaint)"`.
- Update the "Locale changes" table: replace all 4 rows for `item_support` with the new values (After column = Internal Tickets / Tiketat e brendshme / Внутрішні тікети / Ticket interni).
- Append a "Micro-fix 2026-05-29 (post-review)" subsection at the bottom of the log explaining:
  - Orchestrator review surfaced: (a) "Complaint Tickets" underspecifies domain vs ticket_type union; (b) UK calque + collision with `item_reports` "Скарги".
  - Owner decision: keep surface universal; rename to "Internal Tickets" across all 4 locales.
- Update "Files Changed" table to reflect the new values (replace the en/sq/uk/it rationale text — say "Universal sidebar name 'Internal Tickets' (post-orchestrator-review)").

### 4. `docs/backlog.md`
- In the Last Session bullet for Task 284, replace `EN: "Complaint Tickets"/...` with `EN: "Internal Tickets"/"Support Inbox"/"Sales Inbox"; sq/uk/it analogues`.
- In the history table row for Task 284, replace `"Complaint Tickets"` mention with `"Internal Tickets"`.

## Out of scope (do NOT touch)
- No source code changes (no `.tsx`, no `.ts`).
- No new primitive conversions, no Button refactors.
- No changes to `support_tickets.ticket_type` schema or DB.
- No changes to AdminSupportManager creation default (`user_complaint`) — that may evolve separately.
- No changes to `item_inquiries_support`, `item_inquiries_sales`, `item_reports`.
- No git commands. No commits.

## Acceptance criteria (literal)
- 4 locale files updated (1 key each, exact strings above).
- `docs/domain-rules.md` heading + label line + ticket-type clarification updated.
- `docs/sessions/2026-05-29-task-284-admin-unification.md` updated (decision table + locale table + Files Changed) AND has a "Micro-fix" subsection explaining the rename rationale.
- `docs/backlog.md` Task-284 mentions updated.
- `npx tsc --noEmit` → 0.
- `npm run lint` → 7E/10W baseline (no new errors/warnings — these are docs/JSON only).
- `npx vitest run` → 390/390.
- Files Changed table at end of session log includes ALL 4 locale files + 3 docs files.
- No source `.tsx`/`.ts` files in the Files Changed table.
- Self-validation verdict: `tsc=0 · lint=baseline · vitest=390/390 · scope=docs+locales only · PASS`.

## Final report required
1. Files Changed table (with rationale per file).
2. Show the exact 4 locale diffs (1 line per file).
3. Confirm no source code touched.
4. Note 18 self-validation block.

Do NOT emit git commands. Do NOT run git. Orchestrator handles commit hand-off after this fix lands.
