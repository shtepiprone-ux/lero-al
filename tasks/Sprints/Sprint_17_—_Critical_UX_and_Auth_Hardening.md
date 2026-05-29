# Sprint 17 — Critical UX Bugfixes + Auth Session Hardening

> **Filed by:** Orchestrator (Opus 4.7) on 2026-05-28 — after owner-uploaded
> issues batch (11 new tasks total; 5 Sonnet-ready Sprint 17 + 6 Opus
> meta-tasks queued for subsequent sessions as Tasks 282-287).
>
> **⚠️ Status update (2026-05-29): Sprint 17 is OPEN, not complete.** Original
> Tasks 277–281 shipped, but **Task 277 was over-scoped** (it exposed the seller
> WhatsApp number + `wa.me` link to anonymous visitors via a service-role
> `createAdminClient()` fetch) and now carries a **corrective Task 289**
> (authenticated-only re-scope). Two more tasks were filed into Sprint 17 on
> 2026-05-29: **Task 288** (i18n hardcode audit) and **Task 290** (project-wide
> no-ellipsis UX audit). **Open and not yet executed: 288, 289, 290.**

## Sprint goal

Land the **5 highest-priority Sonnet-executable items** from the
2026-05-28 owner issues batch:

- restore the missing WhatsApp CTA on listing detail and lay the
  click-event analytics foundation (no full analytics page yet);
- fix the broken favorite heart state sync that ships the wrong
  selected/unselected state across listing cards;
- ship the premium-only filter so the Home "Premium → View all" CTA
  stops duplicating the Latest CTA;
- unify every phone country-code combobox in the project into one
  global European selector — this is also the **precondition for
  Task 282 (Design System Lockdown)** because phone selectors are the
  most-violating local-copy surface;
- harden the auth session persistence model so clearing only
  `localStorage`/cache does not log the user out (only full Site Data +
  Cookies deletion may — and even then with a clean re-auth UX).

The remaining 6 meta-tasks from the 2026-05-28 batch (Design System
Lockdown, Governance burn-down, Admin surfaces unification + Support
page, Listing analytics spec, Favorites collections UX spec, Profile
email promotion) are filed in `docs/backlog.md` as Tasks **282-287** and
will be picked up in subsequent orchestrator sessions in that priority
order.

| # | Task | Theme | Priority | Status |
|---|---|---|---|---|
| **277** | WhatsApp CTA restore + click-event foundation (`listing_contact_events`) | UX bugfix + analytics groundwork | high | ⚠️ shipped but OVER-SCOPED → corrected by 289 |
| **278** | Premium home CTA → `/listings?premium=true` + Listings premium-only filter | feature | medium | ✅ done |
| **279** | Fix favorite heart state sync across listing cards (collection-aware) | UX bugfix | high | ✅ done |
| **280** | Unify phone country-code combobox into one global European selector | refactor (precondition for 282) | high | ✅ done |
| **281** | Auth session persistence hardening (Site Data cleanup recovery) | security + UX | high | ✅ done |
| **288** | Project-wide i18n hardcode audit + remediation (localized status/enum labels; fixes `sq` notification raw-English bug) — added 2026-05-29 | bugfix + refactor (i18n) | medium (non-critical; may slip to Sprint 18) | 📝 filed, not executed |
| **289** | **CORRECTIVE** — re-scope Task 277 WhatsApp CTA to authenticated users only; remove the service-role anon leak; ship `scripts/task-289-listing-contact-events-anon-revoke.sql` (owner confirmed Task 277 SQL already live) — added 2026-05-29 | security + UX bugfix | high | 📝 filed, not executed |
| **290** | Project-wide no-ellipsis UX audit — wrap localized UI text instead of truncating it (symptom: contact card `owner_name_unavailable` cut via `truncate`); classify + fix every unsafe truncation across site + admin — added 2026-05-29 | bugfix / UX / i18n / responsive | high | 📝 filed, not executed |

## Run order

Independent tasks can run in parallel; the run order below maximizes
review-friendliness and avoids surface conflicts:

1. **Task 281 (Auth session persistence)** — largest scope and highest
   security risk; start it first so the diff is reviewable in isolation
   without other auth-adjacent edits.
2. **Task 280 (Phone combobox)** — independent surface; clears the path
   for Task 282 (Design System Lockdown).
3. **Task 277 (WhatsApp CTA)** — listing-detail surface; pairs with the
   analytics foundation table migration.
4. **Task 279 (Favorite heart sync)** — listing-card surface; orthogonal
   to 277.
5. **Task 278 (Premium CTA)** — smallest scope; can run last or in
   parallel with 277/279.

**Tasks added 2026-05-29 (run after the originals):**

6. **Task 289 (CORRECTIVE — WhatsApp authenticated-only)** — must run before
   any further work on the listing-detail contact surface. Touches the same
   files as Task 277, so do not run it in parallel with other listing-detail
   edits. (An earlier `page.tsx` truncation flag was a false positive — `git
   diff` confirms the file is intact; standard `tsc`/build check still applies.)
7. **Task 290 (no-ellipsis UX audit)** — project-wide; touches `ListingContact.tsx`
   among many surfaces. Sequence **after Task 289** to avoid conflicting edits on
   the contact card; otherwise independent.
8. **Task 288 (i18n hardcode audit)** — non-critical; independent of 289/290;
   may slip to Sprint 18.

## Owner actions (per task, after Sonnet ships)

| Task | Owner action |
|---|---|
| 277 | Apply migration for `listing_contact_events` table + RLS (SQL emitted by Sonnet); verify via `npm run check:schema-drift`. **✅ done — owner confirmed the SQL is live in Supabase (2026-05-29).** |
| 278 | None — pure code change. |
| 279 | None unless RLS audit surfaces a problem (in which case Sonnet emits SQL). |
| 280 | None — pure code change. |
| 281 | Verify QA scenarios A-G on staging (covered in Task 281 kickoff). If `@supabase/ssr` is newly added, verify Vercel/Cloudflare env vars. |
| 289 | After Sonnet ships, run `scripts/task-289-listing-contact-events-anon-revoke.sql` in Supabase → SQL Editor (drops `events_insert_anon` + revokes anon SELECT), then re-run `node scripts/check-schema-drift.mjs` (no drift expected). Best applied together with the code deploy. (Earlier `page.tsx` truncation concern was a false positive — `git diff` confirms the file is intact.) |
| 290 | None — pure code change (audit + wrapping). |
| 288 | None — pure code change (i18n) + optional `check:i18n` guard the task adds. |

## Queued for subsequent orchestrator sessions (NOT Sprint 17)

Filed as backlog entries with task numbers but **NOT yet kickoff-ed**.
Each requires Opus orchestration work in a dedicated session before any
Sonnet implementation can begin:

| # | Task | Type | Priority | Source |
|---|---|---|---|---|
| **282** | **Design System Lockdown** — stop local one-off UI styles across site/admin (canonical control contract + scanner extension) | Opus → produces large Sonnet kickoff | **critical** | issues.txt 2026-05-28 §11 |
| **283** | Governance debt burn-down — HIGH entropy (button-like styling) + MEDIUM (`py-10`) + LOW (47 arbitrary font-sizes) | Opus → produces Sonnet kickoff | high | issues.txt 2026-05-28 §9 |
| **284** | Admin surfaces unification + Support page ambiguity resolution | Opus → produces Sonnet kickoff | high | issues.txt 2026-05-28 §4 |
| **285** | Listing analytics page + admin metric controls — full product/architecture spec | Opus → produces ~5 follow-up Sonnet tasks | high | issues.txt 2026-05-28 §2 |
| **286** | Favorites collections UX revamp — MVP + plan-aware roadmap (Free/Pro/Expert) | Opus → produces MVP Sonnet task + paid-plan epic | high | issues.txt 2026-05-28 §3 |
| **287** | Promote user email into profile identity card | Opus → produces Sonnet kickoff | medium | issues.txt 2026-05-28 §10 |

Recommended Sprint 18 thematic focus: **Design System** — pull Task 282
(Design System Lockdown) + Task 283 (Governance burn-down) together;
they reinforce each other and clear the design-system debt the owner
explicitly flagged as critical.

## Governance gates (apply to every kickoff in this sprint)

Same standing contract as Sprint 16 — restated for emphasis:

- **`docs/agent-contract.md` clause 6a** (Positive + Negative flow gate, Task 255 rule).
- **`docs/agent-contract.md` clause 10** (Files Changed table in session log; orchestrator emits commit commands per Task 264).
- **Note 14** (Global Change Verification — applies especially to Tasks 280 and 281 which touch shared primitives).
- **Note 18** (Pre-Completion Self-Validation — `tsc=0`, AC-by-AC audit table, runtime walk at `uk` 320px, scope=clean).
- **Note 19** (UX Flow Preservation).
- **Note 20** (Existing-Control Preservation — particularly relevant for Task 277 which adds a control to a card with several existing controls).
- **Note 23** (Edit-Flow Preservation — relevant for Task 281's auth flows + Task 280's profile/admin phone fields).

## Sprint exit criteria

**Originals 277–281 (shipped, but 277 has an open correction):**

- Premium filter URL-synced and clearable (Task 278). ✅
- Favorite heart state correct on all 4 surfaces (Task 279). ✅
- Zero local phone country-code combobox implementations remaining (Task 280). ✅
- `localStorage`-only auth dependency removed; valid-cookie refresh keeps user logged in; full Site Data deletion produces clean re-auth UX (Task 281). ✅
- `listing_contact_events` migration applied (Task 277) + drift check clean. ✅ (owner confirmed live)

**Still OPEN — Sprint 17 is NOT closed until these land + are orchestrator-approved on diff:**

- **Task 289 (corrective):** WhatsApp CTA is authenticated-only; anonymous visitors receive no WhatsApp number / `wa.me` / props; `createAdminClient()` removed from the listing-detail page; `scripts/task-289-listing-contact-events-anon-revoke.sql` applied (anon grant + `events_insert_anon` removed); `page.tsx` integrity confirmed.
- **Task 290 (no-ellipsis audit):** project-wide audit matrix produced; every unsafe user-facing truncation wrapped; retained truncation documented with accessible full text; verified ×4 locales + 7 breakpoints, site + admin separately.
- **Task 288 (i18n audit):** raw-English enum/status leakage root-fixed + `check:i18n` parity guard (may slip to Sprint 18).

**Closure bookkeeping:**

- `docs/backlog.md` updated with closure rows for 288, 289, 290; Sprint 17 marked CLOSED ✅ only after all three are approved (or 288 explicitly deferred to Sprint 18 and 289/290 closed).
- Sprint 18 candidates (282-287) re-prioritized based on Sprint 17 learnings.

## File index

- Kickoffs (one file per task):
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_277.md` — WhatsApp CTA
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_278.md` — Premium CTA
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_279.md` — Favorite heart sync
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_280.md` — Phone combobox
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_281.md` — Auth session persistence
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_288.md` — i18n hardcode audit + remediation (non-critical; added 2026-05-29)
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_289.md` — CORRECTIVE: WhatsApp CTA authenticated-only (added 2026-05-29)
  - `tasks/Sprints/Sprint_17_kickoff_prompt_Task_290.md` — project-wide no-ellipsis UX audit (added 2026-05-29)
- Corrective SQL: `scripts/task-289-listing-contact-events-anon-revoke.sql` (drops `events_insert_anon` + revokes anon SELECT; owner confirmed Task 277 SQL already live).
- Opus orchestration session logs: `docs/sessions/2026-05-29-task-289-opus-orchestration-whatsapp-correction.md`, `docs/sessions/2026-05-29-task-290-opus-orchestration-no-ellipsis-audit.md`.
- Source issues file: `uploads/issues.txt` (owner-uploaded 2026-05-28, 4600 lines, 11 tasks; 5 sprint-bound + 6 queued).
