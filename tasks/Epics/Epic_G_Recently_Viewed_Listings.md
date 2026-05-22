# Epic G — Recently Viewed Listings

**Status:** CLOSED
**Opened:** 2026-05-19
**Closed:** 2026-05-22 (Tasks 138–140 delivery + Tasks 163–164 recovery/closure)

> Delivery required two recovery tasks: Task 163 (P0 — build restore + G.2 wiring) and
> Task 164 (P1 — scope fix, DB migration confirmation, locale parity).
> ⚠️ Responsive screenshots deferred: `RecentlyViewedSection` is auth/DB-dependent;
> Storybook story with fixture data needed before `screenshots:responsive` can run.
> Tracked as follow-up (register as Task 165 or fold into Epic H kickoff).

## Goal

Show users their recent listing-view history with privacy-respecting storage rules: server-side for authenticated users, cookie/localStorage for guests.

## Dependencies

- None blocking. Can run in parallel with Epic F.

## Tasks

### Task G.1 — Track recently viewed listings

**Type:** Feature / data model
**Priority:** Medium
**Area:** Recently-viewed tracking, server + client storage

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/data-access-rules.md`, `docs/rls-rules.md`
2. `docs/state-authority.md` (SSR vs client)
3. `docs/integrations.md` (analytics privacy)

**Localization coverage:** N/A (storage layer)
**Responsive coverage:** N/A (storage layer)

**Goal:**
- Authenticated users → server-side `recently_viewed` table, capped at N entries per user, deduped by listing.
- Guests → cookie or localStorage (decide based on privacy/analytics rules already in `docs/analytics-rules.md`).

**Acceptance criteria:**
- Cap (e.g. 25 entries) documented and enforced.
- RLS rules drafted for server-side table.
- Guest privacy approach documented in `docs/analytics-rules.md`.

### Task G.2 — Recently viewed UI block

**Type:** Feature
**Priority:** Medium
**Area:** Listing detail, user profile

**Pre-read:** G.1, plus `docs/ui-rules.md`, `docs/component-rules.md`
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Render the recent-views list as a horizontal scroller / grid on listing detail (excluding the current listing) and a dedicated section in the profile.

**Acceptance criteria:**
- Mobile-first layout; canonical responsive scaffolding.
- All four locales render labels/empty state.

### Task G.3 — Clear history

**Type:** Feature
**Priority:** Low
**Pre-read:** G.1, G.2
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** User can clear their recently viewed history from profile.

**Acceptance criteria:** Server entries deleted (auth users); cookie/localStorage cleared (guest). Confirmation dialog uses canonical `Dialog`.

## Epic-level acceptance

Recent views tracked, surfaced on listing detail and profile, clearable.
