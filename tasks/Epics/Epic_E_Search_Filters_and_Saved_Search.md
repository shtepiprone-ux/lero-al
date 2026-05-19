# Epic E — Search, Filters & Saved Search UX

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Modernize search and filters: horizontal filter bar (per dom.ria reference), improved active filter chips (Sprint 1 Task 95 only quick-fixes the click target — this epic completes the broader UX), saved searches with notifications, and a future architectural decision on URL-state vs server-state.

## Dependencies

- Sprint 1 Task 95 (chip click target) closes first.
- Epic A (locale consistency) reduces noise in filter labels.
- Epic D.1 (email) is required for E.4 (saved-search notifications).

## Tasks

### Task E.1 — Horizontal filter bar redesign

**Type:** Feature / UX redesign
**Priority:** High
**Area:** Public listings search page, filter panel

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/ui-rules.md`, `docs/component-rules.md`
2. `docs/component-governance.md`, `docs/responsive-audit.md`
3. `docs/ai-behavior.md` Filter Architecture Anti-Patterns (Task 50.2 / 50.4 / 53)
4. `src/lib/filters/filterEngine.ts`
5. `src/components/filters/`, `src/components/listings/`

**Reference UX:** https://dom.ria.com/uk/search?excludeSold=1&category=1&realty_type=0&operation=1&price_cur=1&wo_dupl=1&sort=inspected_sort&newbuildings=1&firstIteraction=false&client=searchV2&limit=20&type=list&ch=242_239,247_252

**Localization coverage:** sq, en, uk, it (Ukrainian strings are longest — test wrap/truncate)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Horizontal filter bar at the top of the listings page. Mobile drawer pattern preserved via canonical `Sheet`. No filter logic duplication — extend `filterEngine.ts`.

**Acceptance criteria:**
- Horizontal layout at desktop / tablet; mobile drawer.
- No mixing of homepage batch state with listings URL-immediate state (anti-pattern in `docs/ai-behavior.md`).
- All locales render without overflow.
- All seven breakpoints validated.

### Task E.2 — Active filter chip UX (complete redesign)

**Type:** UX
**Priority:** Medium
**Pre-read:** Same as E.1
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Build on Sprint 1 Task 95: in addition to whole-chip click target, refine chip typography, group separators, "Clear all" affordance.

**Acceptance criteria:**
- Visual parity across all locales (no truncation surprises).
- "Clear all" works deterministically and respects filter visibility rules.

### Task E.3 — Saved searches

**Type:** Feature
**Priority:** Medium-High
**Area:** User profile, saved_searches table

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/data-access-rules.md`, `docs/rls-rules.md`
2. `docs/state-authority.md`
3. `src/lib/filters/filterEngine.ts` (serialization rules)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** User can save a search (URL state serialized + named) to a `saved_searches` table, view list in profile, re-run with one click.

**Acceptance criteria:**
- Name + URL serialization persisted.
- List view, rename, delete.
- RLS enforces ownership.

### Task E.4 — Saved search notifications

**Type:** Feature
**Priority:** Medium
**Area:** Background job, notification pipeline
**Dependencies:** Epic D.1 (email infrastructure)
**Pre-read:** E.3, plus Epic D
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email render + in-app indicators

**Goal:** When new listings match a saved search, notify the user (email + in-app). Respect user-set frequency (instant / daily digest / weekly).

**Acceptance criteria:**
- Job runs deterministically and idempotently.
- Recipients receive locale-correct emails.
- Frequency control persisted per saved search.

### Task E.5 — Architecture decision: URL state vs Server state

**Type:** Architectural decision
**Priority:** Medium (deferred — not blocking)
**Area:** State authority for filters

**Pre-read:** `docs/state-authority.md`, `docs/ai-behavior.md` State Management Rules
**Localization coverage:** N/A
**Responsive coverage:** N/A

**Goal:** Pick a long-term direction:
- (a) URL state → Server → UI (current model)
- (b) Server state via React Query / SWR

Document chosen direction in `docs/state-authority.md`; no implementation in this task — only the written decision.

**Acceptance criteria:** ADR-style entry committed to `docs/state-authority.md`.

## Epic-level acceptance

Horizontal filters live, saved searches functional with notifications, architectural direction documented.
