# Sprint 30 — Task 338 kickoff (Opus) — Admin notification architecture + Phase 1 MVP Sonnet sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 338 = Opus architectural (renumbered from old "337"). Phase 1 MVP Sonnet sub-task ≥ 343. Phase 2–5 deferred. Wave 2.
>
> **Source:** `issues.md` 2026-05-31 — "Design admin notification architecture + produce phased Sonnet implementation tasks".

```
Type:     architecture / UX / admin / notifications / realtime
Priority: HIGH (moderation queue stalls without notification)
Area:     docs/admin-notification-architecture.md (NEW)
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW MVP Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-338-admin-notification-architecture.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20 / 22
3. `docs/admin-ux-rules.md`
4. `docs/component-rules.md` + `docs/component-governance.md`
5. `docs/data-access-rules.md` + `docs/rls-rules.md` + `docs/domain-rules.md`
6. `docs/integrations.md` → email + Albanian-only outbound policy (Epic GG)
7. `docs/state-authority.md` (realtime / cache invalidation)
8. `docs/qa-rules.md`
9. `tasks/Epics/Epic_HH_Admin_UX_System.md` + `Epic_R_Admin_Panel_2026.md` + `Epic_GG_Albanian_Only_Outbound_Email.md`
10. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_334.md` (cross-ref — owner-side post-edit redirect for pending listings)
11. `src/components/admin/AdminListingsTable.tsx` + `src/app/admin/listings/page.tsx`
12. `src/modules/listings/domain/listingTransitionEngine.ts` + `applyListingTransition.ts`
13. `src/modules/admin/actions/index.ts`
14. `src/components/admin/AdminSidebar.tsx` (new "Сповіщення" entry placement)
15. `src/modules/notifications/lib/emails/*` (existing email infra)
16. `messages/{sq,en,uk,it}.json`

## Owner-reported problem

Admins/moderators do NOT receive notification when listing enters «На модерації». Admin Listings page must be MANUALLY REFRESHED to see new pending listings. Owner wants:
- Proper architecture for all admin notifications triggered by user actions.
- Dedicated admin "Сповіщення" section where rules are viewed + role-controlled (which events, which roles, which channels, what is active).
- **Transparent + role-aware + manageable from admin panel — NOT hidden hardcoded behavior.**

## Critical MVP workflow (Phase 1 — Sonnet sub-task)

When listing transitions to `На модерації`:
- Eligible admin/moderator roles receive in-app notification.
- Email notification IF channel enabled (sq-only outbound per Epic GG).
- Admin Listings page updates WITHOUT manual refresh — realtime subscription OR "Нові оголошення — Оновити" banner.
- Notification links to relevant listing/moderation view.

## Required Phase 1 transparency rule (owner directive — per owner comment on Task 338)

Phase 3 ships the full settings UI. **Phase 1 (MVP) MUST NOT leave notification delivery as "hidden hardcoded magic"** because that directly contradicts the owner's "no hidden hardcoded behavior" requirement.

**Phase 1 MVP MUST:**
1. Seed protected default-settings rows in `notification_settings` (one row per event × role × channel; `is_system_protected=true`; `created_by='system_seed'`).
2. Expose the seed data via a **read-only "Сповіщення" admin section** in Phase 1 (NOT editable yet — Phase 3 adds edit UI). The read-only view answers "what is currently active?" — the owner-required transparency without requiring full settings UI.
3. Sidebar gets the "Сповіщення" entry in Phase 1.
4. Document seed values + rationale in the canonical doc so owner can audit defaults without code review.

This converts "hidden hardcoded magic" into "visible system-protected defaults" — meeting the transparency directive without overbuilding settings UI.

## Required Opus output

### 1. Canonical doc `docs/admin-notification-architecture.md`

Sections:

1. Purpose
2. Current architecture (from investigation)
3. Identified gaps
4. **Canonical notification event model:**
   - Event = `{ event_key, target_entity_type, target_entity_id, occurred_at, payload }`.
   - Recipients = resolved by event_key + role.
   - Deliveries = `notification_deliveries` per recipient with read state.
5. Required tables (propose; do NOT create migrations):
   - `notification_events` (audit log of fired events)
   - `notification_deliveries` (per-recipient delivery + read state)
   - `notification_settings` (per role × event × channel toggle + `is_system_protected` flag + `created_by`)
6. Recipient resolution by role (`admin` / `moderator` / `super_admin` if present).
7. Channel architecture: in-app bell + admin notification list + email via existing Resend infra (sq-only outbound).
8. Duplicate prevention + throttling.
9. Linking to target entity (deep link to admin listing review).
10. **Marketplace admin notification event catalog** — MVP vs Phase 2 vs deferred:
    - **MVP:** `listing.submitted_pending_moderation`.
    - **Phase 2:** `listing.edited_requires_remoderation`, `listing.reported_by_user`, `report.new`, `support_ticket.new`, `user.new_registration` (if admin needs).
    - **Deferred:** chat events (depends on Task 342), payment/premium events, system/audit events.
11. **Default recipient role matrix per event** (seed values).
12. **Phase 1 read-only "Сповіщення" admin section UX:**
    - Sidebar entry "Сповіщення".
    - Read-only table: event_key, description, default recipient role(s), default enabled channels, is_system_protected, last_triggered_at (if available).
    - Notice: "Phase 3 додасть налаштування. Зараз показано системні значення за замовчуванням."
    - States: empty / loading / error / permission-denied.
13. Phase 2 — admin notification inbox + bell + read/unread.
14. Phase 3 — role-based notification settings UI (editable).
15. Phase 4 — broader event catalog activation.
16. Phase 5 — email-template governance + delivery audit.
17. **Admin Listings realtime/new-items UX:**
    - Preferred: Supabase realtime subscription if existing stack supports it safely.
    - Else: "Нові оголошення — Оновити" banner that does `router.refresh()` without losing filters/sort/pagination.
    - Badge / count updates consistently.
    - Avoid aggressive polling; if polling, define interval + cleanup.
18. Localization sq/en/uk/it (UI + in-app notification titles/bodies; email subjects/bodies sq-only per Epic GG).
19. Responsive 14-width canon.
20. Accessibility — keyboard controls; unread state not color-only; realtime banner announced via `aria-live`.
21. **Phased Sonnet plan + Phase 1 transparency rule** (per Phase 1 transparency rule above).

### 2. MVP Sonnet sub-task kickoff (Opus writes file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Listing→pending notification event + Phase 1 read-only Сповіщення section + admin Listings realtime UX`.

The Sonnet sub-task MUST follow Canonical Task Template + include ALL: Pre-read · Current behavior to preserve (Note 22 admin-table preservation explicit) · Required after behavior · **Positive flow · Negative flow** (email-send fails / realtime subscription fails / no eligible recipients / duplicate fire / permission-denied / network offline / locale mismatch / admin viewing settings on mobile) · Implementation · AC (citing both flows) · Out of scope · Validation (pnpm + owner-SQL block) · Manual QA · Final report.

**MVP scope:**
- Inventory current listing status lifecycle.
- Inventory current admin roles / permissions.
- Inventory existing notification mechanisms.
- Minimal schema: `notification_events` + `notification_deliveries` + `notification_settings` (propose SQL; owner runs).
- **Seed protected default-settings rows for `listing.submitted_pending_moderation` event × admin/moderator role × in-app + email channels.**
- Emit notification when `applyListingTransition` writes pending status.
- In-app delivery for admin/moderator recipients.
- Email delivery via existing infra (sq-only per Epic GG); safe no-email fallback if infra not ready.
- Admin Listings realtime subscription OR refresh banner.
- **Phase 1 read-only "Сповіщення" admin section** with sidebar entry — shows seed defaults read-only.
- Localize sq/en/uk/it.
- Verify all 14 canonical widths.
- Preserve `AdminListingsTable` columns / row actions / filters / sort / pagination (Note 22).

### 3. Session log + backlog update

Standard.

## Required investigation

1. Read all Area files.
2. Identify current notification surface (bell? table? none?).
3. Identify whether Supabase realtime is used.
4. Identify role values + sidebar guards.
5. Run:
   ```
   rg -n "notification|notifications|сповіщ|notify|email|mail|moderation|pending|На модерації|listing status|admin listings|realtime|channel|role" docs tasks src messages
   rg -n "realtime|channel\\(|on\\(|subscribe|broadcast|postgres_changes" src
   ```

## Acceptance criteria for THIS Opus task

- Current architecture inspected + summarised.
- Owner-reported bug captured as critical MVP workflow.
- Canonical notification architecture defined.
- Event catalog defined (MVP / Phase 2 / deferred).
- Default recipient/channel matrix defined.
- Phase 1 read-only "Сповіщення" section UX defined.
- Admin Listings realtime UX defined.
- Phased Sonnet plan documented (+ Phase 1 transparency rule).
- MVP Sonnet sub-task kickoff written with ALL canonical sections + Note 22 admin-table preservation + protected default-settings seed requirement.
- Localization + 14-width canon required.
- `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes by Opus.

## Out of scope

- Do NOT implement code.
- Do NOT create migrations.
- Do NOT change permissions (Task 331).
- Do NOT overbuild full notification system.
- Do NOT assume non-existent roles.
- Do NOT require chat notifications (Task 342).
- Do NOT require payment notifications.
- Do NOT introduce external services.
- Do NOT design system that only handles listings + cannot scale.

## Validation

```
rg -n "notification|сповіщ|admin.*listing|realtime" docs tasks src messages
git status --short
```

## Final report

Files changed; current architecture; gaps; proposed architecture; event catalog; default role/channel matrix; Phase 1 read-only Сповіщення UX; realtime UX; phased plan + transparency rule; MVP Sonnet sub-task path; validation; no `src/` / `messages/` / DB changes confirmation; explicit-path owner git commands.
