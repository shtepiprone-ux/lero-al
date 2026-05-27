# Epic V — kickoff prompt — Task 252 — V.3 — Admin "Sales" inbox split

**Filed by:** Opus 4.7 orchestrator 2026-05-25
**Source:** owner directive 2026-05-25.
**Concrete request:** "коли я відправляю лист на адресу sales@lero.al то в адмінці я не знаю де
цей лист читати, має бути реалізований розділ «Продажі», де адмін/модератор зможуть читати
листи та надсилати відповіді з адреси sales@lero.al."

---

You are Claude Code Sonnet 4.6 working in `lero-al`.

**Hard contract** (`docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt"):
no scope change; no invented architecture (STOP & ask the orchestrator if anything is ambiguous);
literal AC; **self-validate BEFORE claiming complete** (Note 18 in `docs/ai-behavior.md` — tsc=0
in shell, AC-by-AC table, diff self-review, runtime check at `uk` 320px); **preserve UX flow**
(Note 19 — every existing Inquiries control remains reachable); **preserve existing controls**
(Note 20 — before/after sidebar + inquiries-page inventory); update `docs/backlog.md` + add
session log under `docs/sessions/`; 0 new lint/typecheck errors; `npm run build` passes;
governance PASS; **outbound emails MUST be Albanian-only** (Task 251 / Epic GG policy — do NOT
introduce any new English email language); responsive 320/375/390/768/1280/1440/2560; **owner
runs all git + SQL** — emit ready-to-run commit commands as plain text + any SQL into the
session log; the executor NEVER runs git or SQL.

## Pre-read

1. `docs/agent-contract.md` (P0 contract — read first)
2. `docs/backlog.md`
3. Task-relevant docs from `docs/rule-index.md` → **"Admin table / admin control task"** + **"Control-relocation task"** (the existing mailbox-filter dropdown is being replaced by route-level scoping):
   - `docs/ui-rules.md`
   - `docs/component-rules.md`
   - `docs/component-governance.md` (canonical `AdminTableRow` §11)
   - `docs/domain-rules.md`
   - `docs/rls-rules.md`
   - `docs/qa-rules.md`
4. `docs/ai-behavior.md` — Note 18 (self-validation), Note 19 (UX flow), Note 20 (control preservation), **Note 21 (Control Relocation Rule)**, **Note 22 (Admin Table Preservation Rule)**.
5. Task 222 session log (`docs/sessions/2026-05-24-task-222-contact-page.md` — public form + `contact_inquiries` shape + topic→mailbox map)
6. Task 223 session log (`docs/sessions/2026-05-24-task-223-admin-inquiries.md` — admin manager + `contact_inquiry_replies` + `sendInquiryReply` action)
7. `src/components/admin/AdminInquiriesManager.tsx` (already filters by `target_mailbox` via a dropdown — see lines 81–88, 183 — this is the basis for the split)
8. `src/app/admin/inquiries/page.tsx` (current single route)
9. The admin Sidebar component (find via grep — `Sidebar` / `AdminSidebar`); add the new entry matching the existing entries' shape (label + icon + href + role gate)
10. `src/modules/contacts/actions/index.ts` (server actions — `sendInquiryReply` + status update); these already route the From address by inbox via the topic → mailbox map; verify nothing else needs to change
11. `messages/sq.json` / `en.json` / `uk.json` / `it.json` — `admin.inquiries.*` namespace + sidebar labels
12. Inspect `package.json` for current validation scripts.

## Localization coverage

- sq, en, uk, it for the two new sidebar labels + the two page titles ("Підтримка" / "Продажі" and equivalents). All four `messages/*.json` updated in the same key set.
- **EMAIL** outbound transport stays Albanian-only (Task 251 / Epic GG policy is the standing rule — do not introduce any new non-`sq` email language).

## Responsive coverage

- 320, 375, 390, 768, 1280, 1440, 2560 for both `/admin/inquiries/support` and `/admin/inquiries/sales`.

## Current behavior to preserve

Before editing, inspect the current `/admin/inquiries` surface + admin Sidebar and list in the session log:

- Affected routes: `/admin/inquiries` (existing single route).
- Affected components: `AdminInquiriesManager.tsx`, `src/app/admin/inquiries/page.tsx`, the admin Sidebar.
- Existing controls on `/admin/inquiries`: every column header, every row click target, every row action (reply, status switcher, etc.), the `target_mailbox` filter dropdown, the status filter (new / in_progress / closed), search, pagination, sort, empty state, loading state, mobile layout.
- Existing editable controls: reply composer, status switcher.
- Existing server actions: `sendInquiryReply`, status-update action in `src/modules/contacts/actions/index.ts`.
- Existing success / error / loading behavior of the reply composer and status switcher.

Any existing control must either remain, move to a specified new place (which this kickoff names AND requires implementing in the same task), or be explicitly listed as removed.
**The only legitimate removal authorised by this kickoff:** the `target_mailbox` filter dropdown inside `AdminInquiriesManager` when `mailboxScope` is set — because the route IS the filter (control relocation, not loss).

**Control relocation rule (Note 21):**
The mailbox filter capability is moving from a dropdown inside one route to TWO route paths (`/support` and `/sales`). The new editable / interactive equivalent (the sidebar entries that route to scoped pages) MUST be implemented in the same task. A read-only label is not a substitute. The user must still be able to switch between "support" and "sales" views — now via the sidebar instead of the dropdown.

**Admin table preservation rule (Note 22):**
Inventory before editing AdminInquiriesManager: columns; row click behavior; row actions; inline controls; filters (`target_mailbox` dropdown + status filter); search; pagination; sort; empty state; loading state; mobile layout. After the change, every existing admin action must remain reachable on both `/support` and `/sales` — except the `target_mailbox` filter, which is intentionally replaced by the route split (documented).

## Required after behavior

As an admin or moderator, on the admin sidebar:
1. See TWO sidebar entries — "Підтримка" / "Support" / "Mbështetje" / "Supporto" AND "Продажі" / "Sales" / "Shitje" / "Vendite".
2. Click "Підтримка" → land on `/admin/inquiries/support`; only support-mailbox rows are loaded server-side; row count and pagination reflect only that scope.
3. Click "Продажі" → land on `/admin/inquiries/sales`; only sales-mailbox rows are loaded server-side; row count and pagination reflect only that scope.
4. Status filter (new / in_progress / closed) and every existing row action / reply composer / status switcher work inside each scope.
5. Open an inquiry on `/admin/inquiries/sales` → reply → email lands in the contact's inbox **from `sales@lero.al`**, in Albanian.
6. Open an inquiry on `/admin/inquiries/support` → reply → email lands **from `support@lero.al`**, in Albanian.
7. After `router.refresh()` / page reload, the status changes persist.
8. The old `/admin/inquiries` URL either redirects to `/support` (preserving external links) OR is removed — the choice is documented in the session log.



## Goal

Split the existing single `/admin/inquiries` page into TWO sidebar entries — "Підтримка" and
"Продажі" — each rendering AdminInquiriesManager pre-scoped to its target_mailbox. Reply
From-address remains routed per the topic→mailbox map (already correct in V.2). No schema
change.

## Scope — exact changes

1. **Two admin routes.** Create:
   - `src/app/admin/inquiries/support/page.tsx` — renders `AdminInquiriesManager`
     pre-scoped to `target_mailbox = support@*`.
   - `src/app/admin/inquiries/sales/page.tsx` — renders `AdminInquiriesManager` pre-scoped to
     `target_mailbox = sales@*`.

   The existing `src/app/admin/inquiries/page.tsx` either redirects to `/admin/inquiries/support`
   (the default historic view) OR is removed in favour of the two new routes. Pick redirect —
   preserves any external link to the old URL; document the choice in the session log.

2. **Sidebar.** Replace the existing single "Inquiries" / "Запити" sidebar entry with TWO entries:
   - "Підтримка" / "Support" / "Mbështetje" / "Supporto" — `href="/admin/inquiries/support"`
     — icon: same family as the current entry (or `LifeBuoy` from `lucide-react`).
   - "Продажі" / "Sales" / "Shitje" / "Vendite" — `href="/admin/inquiries/sales"` — icon:
     `BadgeDollarSign` or `TrendingUp` from `lucide-react` (pick the one matching the rest of
     the sidebar's icon vocabulary).

   Both entries are admin + moderator (same role gate as the current Inquiries entry).

3. **AdminInquiriesManager scope prop.** Add a `mailboxScope: 'support' | 'sales'` prop. When
   set, the component:
   - hides the existing `target_mailbox` filter dropdown (no longer needed — the route IS the
     filter);
   - applies the corresponding `target_mailbox` predicate on the initial inquiries fetch (NOT
     just a client-side filter — the row count, pagination, status counts must reflect only
     that scope);
   - the status filter (new / in_progress / closed) still works inside each scope.

   Status filter and ALL existing controls (reply composer, status switcher, row selection,
   etc.) MUST remain — Note 20 control-preservation. Inventory before/after in session log.

4. **Reply From-address.** Unchanged from V.2 — `sendInquiryReply` already derives the
   From-address from the inquiry row's `target_mailbox`. Verify this still works correctly
   under the split; no code change expected; verification step in the session log.

5. **Albanian-only outbound emails (Epic GG cross-reference).** When V.3 ships, every reply
   email goes out in `sq` only. Either Task 251 has already shipped (caller fixed) OR Task 251
   ships in parallel — confirm Task 251 status with the orchestrator before testing the
   reply-email language; the runtime verification in this task MUST land Albanian replies
   regardless of test user `preferred_locale`.

6. **i18n.** Add the two new sidebar labels under the existing admin sidebar namespace, ×4
   locales (sq/en/uk/it). Page titles "Підтримка" + "Продажі" likewise ×4 (note: SITE UI is
   4-locale; only EMAIL is `sq`-only — this is the standing rule from Task 251).

7. **Counts in sidebar (optional polish — STOP and ask if scope unclear).** If the existing
   sidebar already shows badge counts for the Inquiries entry, the two new entries each show
   their own scoped count (support count + sales count). If no count exists today, this is OUT
   OF SCOPE.

## Out of scope

- Any schema change to `contact_inquiries` / `contact_inquiry_replies` (no new columns; no
  rename of `target_mailbox`).
- Changing the topic → mailbox routing map.
- Changing the reply email body / template.
- The Albanian-only email collapse itself — that's Task 251 / Epic GG, separate.

## Acceptance criteria

- TWO new admin routes exist: `/admin/inquiries/support` and `/admin/inquiries/sales`. The old
  `/admin/inquiries` either redirects to `/support` or is removed (documented choice).
- Sidebar shows TWO entries; both reachable as admin + moderator; old single "Inquiries"
  entry is replaced.
- `AdminInquiriesManager` accepts `mailboxScope` prop; the dropdown filter is hidden when the
  prop is set; only the scope's rows are loaded (server-side, not client filter).
- Replying to an inquiry from `/sales` sends from `sales@lero.al`; replying from `/support`
  sends from `support@lero.al`. Verified at runtime + screenshots / runtime notes in the session
  log.
- Replies arrive in Albanian (Task 251 / Epic GG policy). Tested with a user whose
  `preferred_locale = 'uk'` — the email still lands in `sq`.
- Locale parity ×4 for the two new sidebar labels + page titles (key-count audit in session log).
- §17 UI pre-flight output for both admin pages (canonical-control alignment, z-index, overflow
  in `uk` at 320, 7 breakpoints).
- **Self-validation block** per Note 18.
- UX-flow trace per Note 19: sidebar → /support → status filter → row → reply → email lands;
  same for /sales.
- Control inventory per Note 20: every control that existed on `/admin/inquiries` BEFORE is
  still reachable somewhere AFTER the split (mailbox-filter dropdown is the only legitimate
  removal — replaced by the route split, documented).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- `docs/backlog.md` updated (Last Session for Task 252); session log:
  `docs/sessions/2026-05-25-task-252-v3-admin-sales-inbox-split.md`.

## Hard contract reminder (single-writer)

- Do NOT run git; emit ready-to-run commit commands as plain text at the end (single `git add`
  with explicit paths or `git add -A`; do NOT use `^` / backtick continuations).
- Do NOT modify the schema; no SQL.
