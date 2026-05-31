# Sprint 30 — Task 332 kickoff (Opus) — Admin Dashboard UX/Layout Contract v1 + Sonnet redesign sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 332 = Opus architectural (renumbered from old "331"). Sonnet sub-task ≥ 343. Wave 2.
>
> **Source:** `issues.md` 2026-05-31 — "Create Admin Dashboard UX/Layout Contract v1 + produce Sonnet redesign task".

```
Type:     architecture / UX / admin / dashboard
Priority: high
Area:     docs/admin-dashboard-ux-layout-contract.md (NEW)
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-332-admin-dashboard-ux-layout-contract.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20 / 22
3. `docs/ui-rules.md` + `docs/component-rules.md` + `docs/component-governance.md` §1, §11
4. `docs/admin-ux-rules.md` (§1–§14)
5. `docs/responsive-governance.md` (will be superseded by Task 340 — until then cite 14-width canon inline)
6. `docs/qa-rules.md`
7. `tasks/Epics/Epic_HH_Admin_UX_System.md` + `tasks/Epics/Epic_L_Admin_Dashboard_2026.md`
8. `src/app/admin/page.tsx` (current Dashboard)
9. `src/components/admin/AdminDashboardRecentListings.tsx`
10. `src/components/admin/AdminSidebar.tsx`
11. Sprint 28 primitives: `src/components/admin/AdminPageShell.tsx` + `AdminTable.tsx` + `AdminCardList.tsx` (REUSE)
12. `messages/{sq,en,uk,it}.json` — `admin.dashboard.*`

## Owner-reported problem

Current admin Dashboard UI is sparse and low-polish — KPI cards disconnected, weak hierarchy, no strong grid, basic listing/status blocks. Owner provided a modern dashboard reference as **quality benchmark ONLY** — not for literal clone (`issues.md` explicitly forbids ecommerce-widget copying). Dashboard must be a real-estate marketplace / moderation command center.

## Current behavior to preserve (Notes 19/20)

Inventory in session log: existing cards, links, statistics, recent-listings block, complaints/reports block, listing-status block, role/permission checks, loading/error/empty states, mobile layout. After redesign: every working admin route link remains reachable; every real metric remains OR is intentionally replaced by a better equivalent; NO dashboard data may become fake / hardcoded.

## Required after behavior

Admin loads `/admin` → sees a polished dashboard with KPI cards, moderation queue card, recent listings card, reports/support summary, listing-status distribution, quick actions. Every displayed metric comes from real data. Every section is responsive at all 14 widths × 4 locales. Every card with hover behavior is fully clickable (cross-ref Task 339).

## Required Opus output

### 1. Canonical doc `docs/admin-dashboard-ux-layout-contract.md`

Sections:

1. Purpose
2. Current problems (verbatim from investigation)
3. Target UX principles
4. Marketplace-specific information hierarchy — answers: what requires attention now? pending count? new users? trending up/down? next click?
5. **Dashboard widget inventory** — split MVP vs deferred based on real data availability.
   - **MVP** (only if real data source exists): page header + subtitle, KPI row (active listings, pending moderation, total users, new users 7d, open tickets, open reports), moderation queue card, recent listings, reports/support summary, listing status distribution, quick actions.
   - **Deferred** (mark explicitly): activity/trend chart (only if real chart data — NO fake numbers), full realtime, role-personalised dashboard if model too simple.
6. **Data-source contract per widget** (mandatory per owner comment): every widget MUST specify `metric · source table/module · required filters · required role/permission · loading state · empty state · error state · click target · realtime-or-polling decision · fallback if data unavailable`. **If a widget has no real data source, it is DEFERRED, not a placeholder. NO fake numbers in production.**
7. Role / permission behavior — which roles see which widgets; preserve current behavior if model too simple; document future role-aware personalisation.
8. Layout grid contract per band:
   - Mobile (320–680): single-column stacked, alerts/queues first.
   - Tablet (768–1024): 2-column KPI grid.
   - Desktop (1200–1440): polished grid; KPI row + primary/secondary columns.
   - Wide (1920–2560): controlled max-width container; no stretched-card waste.
   - Reuse `AdminPageShell` + `AdminTable` + `AdminCardList`.
9. Visual style contract — soft rounded cards, consistent border/shadow, compact KPI cards, polished status badges, semantic color only.
10. Responsive 14-width × 4-locale canon.
11. Localization — no hardcoded strings; KPI labels wrap; no ellipsis for status/action.
12. Accessibility — semantic headings; keyboard cards; icon-only actions have accessible names; status not color-only.
13. Loading / empty / error states per widget.
14. **Click-target rules** — full visible area clickable when card visually appears interactive (cross-ref Task 339).
15. Out-of-scope.
16. Sonnet sub-task scope.
17. Manual QA checklist.
18. Validation checklist.

### 2. Sonnet sub-task kickoff (Opus must write to file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Redesign Admin Dashboard per Dashboard UX/Layout Contract v1`.

The Sonnet sub-task MUST include ALL canonical-template sections: Pre-read · Current behavior to preserve · Required after behavior · **Positive flow · Negative flow** (cancel/dismiss · server error · empty state · permission-denied · loading · double-fetch race) · Implementation · AC (each citing Positive/Negative flow) · Out of scope · Validation (pnpm) · Manual QA · Final report.

**MVP scope:** polished page header (AdminPageShell), KPI grid (real data only), pending moderation queue card, recent listings card, reports/support summary, listing status distribution (real counts), quick-action cluster, responsive at all 14 widths × 4 locales, loading/empty/error states, locale keys in `admin.dashboard.*`.

**NOT in MVP:** fake chart data, fake sales analytics, new chart-library migration, full realtime, role-personalised dashboard, admin layout redesign beyond Dashboard.

### 3. Session log + backlog update

Standard.

## Required investigation

1. Read `src/app/admin/page.tsx` end-to-end. Document widgets + which values are real vs placeholder/hardcoded.
2. Read `AdminDashboardRecentListings.tsx`.
3. Read Sprint 28 primitives (reuse mandatory).
4. Identify available data sources (queries for active count, pending count, users count, open tickets, etc.). Classify per data-source contract.
5. Run:
   ```
   rg -n "Dashboard|admin dashboard|AdminDashboard|active listings|pending|moderation|reports|complaints|tickets|recent listings|status distribution" docs tasks src messages
   rg -n "Card|Badge|Table|Skeleton|Chart|recharts|stats|analytics|KPI|metric|quick action" docs tasks src messages package.json
   ```

## Acceptance criteria for THIS Opus task

- Current Dashboard inspected + widgets + data sources documented.
- MVP vs deferred split per real-data-availability test.
- **No-fake-data policy stated explicitly + per-widget data-source contract enforced.**
- Role/permission behavior defined.
- Layout grid contract covers all 14 widths.
- Localization sq/en/uk/it required.
- Click-target rules included (Task 339 cross-ref).
- Sprint 28 primitives required for reuse.
- Sonnet sub-task kickoff written with ALL canonical sections.
- `docs/rule-index.md` + `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes.

## Out of scope

- Do NOT implement code.
- Do NOT copy owner reference UI literally.
- Do NOT create fake ecommerce analytics.
- Do NOT redesign entire admin panel.
- Do NOT merge with Tasks 338 / 331 / 342.
- Do NOT change admin permissions directly (Task 331).
- Do NOT remove existing dashboard functionality without documenting replacement.

## Validation

```
rg -n "Dashboard|stats|KPI|metric|quick action" docs tasks src messages
git status --short        # read-only
```

## Final report

1. Files Changed.
2. Current problems found.
3. Current data sources found.
4. Contract path.
5. MVP widget list (with per-widget data-source row).
6. Deferred widget list.
7. Role/permission summary.
8. Responsive summary.
9. Localization summary.
10. Click-target summary.
11. Sonnet sub-task path.
12. Validation performed.
13. Confirmation no `src/` / `messages/` / DB changes.
14. Ready-to-run owner git commands.
