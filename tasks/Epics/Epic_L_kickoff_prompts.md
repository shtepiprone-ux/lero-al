# Epic L — kickoff prompts (all 3 sub-tasks)

> Admin Dashboard 2026. Rebuild the vestigial Dashboard into a real operational tool with 2026 analytics best practices.
>
> **Global task numbering (fixed 2026-05-20):** L.1 = **Task 154**, L.2 = **Task 155**, L.3 = **Task 156**.
> (Order: L.1 → L.2; L.3 is INTERIM — fold into L.2 if both happen together.) See `docs/backlog.md` roadmap.
> ⚠️ **Dependencies (all CLOSED):** Epic C (Trust & Safety — complaint stats), Epic D (Email — delivery/error metrics), Epic K (Admin Tables Standardization).
> Each kickoff below is self-contained.

---

## L.1 — Discovery: pick KPIs + panels (sign-off REQUIRED before L.2)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic L — sub-task L.1. Document as Task 154 (verify against docs/backlog.md).
NATURE: research / product. This task BLOCKS L.2. The user must SIGN OFF the scope before L.2 begins.

Goal: Decide which metrics and panels the Admin Dashboard surfaces. Output is a written scope doc + a wireframe sketch.

Required pre-read:
1. tasks/Epics/Epic_L_Admin_Dashboard_2026.md — L.1 scope + Epic-level deps.
2. docs/ai-behavior.md — Canonical Task Template, Architecture Stability Rules, Pre-Task Mandatory Checklist.
3. docs/backlog.md (epics + recent tasks for context).
4. docs/analytics-rules.md (event tracking, conversion-funnel definitions live here).
5. docs/architecture.md (modular monolith — Dashboard reads aggregates, never owns them).
6. The current Dashboard route (src/app/[locale]/admin/dashboard/ or equivalent) — what's there now?
7. Reference: dom.ria admin dashboard + comparable 2026-era marketplace analytics products (mention sources in the doc).
8. Inspect package.json.

Localization coverage: N/A (research output).
Responsive coverage: N/A (research output).

Scope:
1. Inventory candidate KPIs (Epic L plan lists the long-list — refine):
   - Active listings (today / week / month).
   - New users by role (regular / agent / agency-admin).
   - Active chats / messages.
   - Reports + moderation queue size (Epic C feed).
   - Email delivery health (Epic D — bounces, opens, delivery rate).
   - Conversion funnel (view → save → contact).
   - Top locations / property types.
   - Currency mix.
   - Recent activity feed.
2. Group into priority tiers (P0 ship-with-L.2, P1 follow-up, P2 future).
3. Sketch wireframe (markdown ASCII or rough text layout) of the dashboard at the canonical breakpoints (mobile, tablet, desktop 1280, 2560).
4. Identify the SQL aggregate query for each P0 metric — confirm Supabase indexes exist or plan a migration.
5. Write the scope doc as docs/sessions/<date>-task-154-l1-dashboard-discovery.md.
6. ⚠️ STOP and ask the user to sign off before any L.2 work begins.

Acceptance criteria:
- Scope doc with metric list, priority tiers, panels, wireframe sketch, aggregate-query plan.
- Index review for P0 metrics documented.
- User explicitly signs off (record the sign-off in the doc).
- 0 code changes in this task.
- Session log + backlog updated. Commit + push (docs only).

Out of scope: building the dashboard (L.2), legacy listings clickable fix (L.3). Follow docs/ai-behavior.md.
```

---

## L.2 — Build the Dashboard

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic L — sub-task L.2. Document as Task 155 (verify against docs/backlog.md).
DEPENDENCY: L.1 (Task 154) MUST be signed off. Do NOT start without the L.1 scope doc + user sign-off.

Goal: Build the panels chosen in L.1 using canonical primitives only. Any tables follow the Epic K canonical pattern.

Required pre-read:
1. tasks/Epics/Epic_L_Admin_Dashboard_2026.md — L.2 scope.
2. The L.1 scope doc + wireframe + aggregate-query plan (docs/sessions/<date>-task-154-l1-dashboard-discovery.md).
3. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns, AI Governance Enforcement Rules.
4. docs/ui-rules.md, docs/component-rules.md, docs/component-governance.md (canonical primitives + AdminTableRow pattern §11).
5. docs/data-access-rules.md (aggregate query conventions; pagination if any list).
6. docs/state-authority.md (server-render stats by default; realtime only where L.1 specified).
7. docs/rls-rules.md (Dashboard is admin/moderator-only — guard the route + every query).
8. Existing admin shell (sidebar, header — Task 115/118 pattern) + Epic K canonical tables.
9. Inspect package.json.

Localization coverage: sq, en, uk, it (panel titles, axis labels, table headers, empty states → messages/*.json, all 4 files). Numbers locale-formatted via Intl.NumberFormat.
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. Implement every P0 panel from L.1 in src/app/[locale]/admin/dashboard/ (or canonical path from L.1).
2. Canonical primitives ONLY: Card, Tabs, Tables (Epic K pattern), Dialog, sonner. No raw <button>, no inline `div.fixed.inset-0`, no local primitive clones.
3. Server-render stats; revalidate per docs/state-authority.md. Realtime ONLY where L.1 specified.
4. Aggregate queries reviewed for performance — confirm Supabase indexes exist OR ship the index migration alongside.
5. New i18n keys × 4 locales; numbers via Intl.NumberFormat with the active locale.
6. If L.3 hasn't shipped yet, L.2 replaces the legacy listings table.

Acceptance criteria:
- All P0 panels render correctly in all 4 locales.
- All 7 breakpoints validated.
- Aggregate queries performant (timing recorded in session log); indexes confirmed.
- Admin/moderator-only route + queries (RLS verified).
- 0 new lint/warnings; typecheck no new errors; governance:localization + responsive + components + admin tables PASS.
- Session log + backlog updated. Commit + push.

Out of scope: P1/P2 panels (future), legacy listings interim fix (L.3 — folds in here if shipped together). Follow docs/ai-behavior.md.
```

---

## L.3 — Interim: make legacy Dashboard listings clickable (fold into L.2 if together)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic L — sub-task L.3. Document as Task 156 (verify against docs/backlog.md).
NATURE: interim bugfix. If L.2 is being done in the same session, fold this in and skip L.3 as a standalone task — note the fold in the L.2 session log.

Goal: If L.2 is delayed, make the current Dashboard listings table follow the Epic K canonical pattern at minimum (clickable name → preview Dialog with edit/delete). Mark as interim in code.

Required pre-read:
1. tasks/Epics/Epic_L_Admin_Dashboard_2026.md — L.3 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns.
3. docs/component-governance.md §11 (canonical AdminTableRow pattern).
4. Epic K closure sessions (sessions/2026-05-21-task-127…130-…) — pattern reference.
5. The current Dashboard listings table component.
6. Inspect package.json.

Localization coverage: sq, en, uk, it (any new column / dialog text → messages/*.json).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. Migrate the legacy Dashboard listings table to the Epic K canonical pattern: clickable title → preview Dialog with edit/delete actions; remove duplicate per-row action buttons.
2. Add a code/comment marker tagging this as INTERIM — to be replaced by L.2.
3. No new metrics / panels in this task.

Acceptance criteria:
- Legacy table follows Epic K canonical pattern.
- Clickable title opens preview Dialog; edit + delete actions accessible from the Dialog.
- Code marker `// INTERIM: replace when L.2 (Task 155) ships` present.
- All 4 locales; all 7 breakpoints.
- 0 new lint/warnings; governance:localization + components + admin tables PASS.
- Session log + backlog updated. Commit + push.

Out of scope: any new KPI / panel work (that's L.2). Follow docs/ai-behavior.md.
```
