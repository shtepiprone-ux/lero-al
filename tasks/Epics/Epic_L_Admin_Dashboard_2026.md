# Epic L — Admin Dashboard 2026

**Status:** OPEN
**Opened:** 2026-05-19
**Origin:** Task in 2026-05-19 review of `ideas.txt` — admin Dashboard needs a real redesign

## Goal

Rebuild the admin Dashboard page from a vestigial listings list into a real operational dashboard following 2026 analytics best practices: KPIs, user activity, complaints, chats, alerts. The current page is non-functional for analytics or QA.

## Dependencies

- Epic K (Admin Tables Standardization) — any tables on the Dashboard follow the canonical pattern.
- Epic C (Trust & Safety) — feeds complaint stats.
- Epic D (Email) — feeds delivery/error metrics for inactivity workflows.

## Tasks

### Task L.1 — Discovery: pick the KPIs and panels

**Type:** Research / product
**Priority:** High (blocks L.2)
**Area:** Admin dashboard scope

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/backlog.md`
2. `docs/analytics-rules.md`
3. `docs/architecture.md`
4. Reference dashboards (dom.ria admin / similar 2026-era marketplace analytics products)

**Localization coverage:** N/A (research)
**Responsive coverage:** N/A (research)

**Goal:** Decide which metrics the Dashboard surfaces. Candidates:
- Active listings (today / week / month)
- New users (per role)
- Active chats / messages
- Reports / moderation queue size
- Email delivery health (Epic D)
- Conversion funnel (view → save → contact)
- Top locations / property types
- Currency mix
- Recent activity feed

Output: a written scope in `docs/sessions/` + a wireframe sketch (text or rough markdown) signed off by the user before L.2 begins.

**Acceptance criteria:** Scope doc with metrics + panels + priority tiers; user explicitly signs off.

### Task L.2 — Build the Dashboard

**Type:** Feature
**Priority:** High
**Area:** `src/app/[locale]/admin/dashboard/` (or equivalent)

**Pre-read:** L.1, plus
1. `docs/ai-behavior.md`, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`
2. `docs/data-access-rules.md` (aggregate queries)
3. `docs/state-authority.md` (server-side render of stats vs realtime)
4. Epic K canonical table pattern

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Build the panels chosen in L.1. Use canonical primitives only (Cards, Tabs, Tables, Dialogs). Any tables follow Epic K canonical pattern. Numbers locale-formatted.

**Acceptance criteria:**
- All panels render in all four locales.
- All seven breakpoints validated.
- 0 new lint errors / 0 new warnings; governance passes.
- Aggregate queries reviewed for performance (Supabase indexes confirmed).

### Task L.3 — Make existing legacy listings list clickable (interim fix)

**Type:** Interim bugfix
**Priority:** Medium (can be folded into L.2 if L.2 happens immediately)
**Area:** Current Dashboard "listings" table

**Pre-read:** L.1, plus Epic K
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** If L.2 is delayed, at minimum make the existing Dashboard listings table follow Epic K canonical (clickable name → preview dialog). When L.2 lands, this section is replaced by the redesigned Dashboard.

**Acceptance criteria:** Listing rows clickable per Epic K; Dialog renders preview with edit/delete; flagged in code/comment as interim.

## Epic-level acceptance

Dashboard is a real operational tool; legacy listings table replaced or fixed; KPIs accurate, fast, locale-correct.
