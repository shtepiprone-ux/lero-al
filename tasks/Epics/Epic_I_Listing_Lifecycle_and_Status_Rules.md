# Epic I — Listing Lifecycle & Status Rules

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Unify listing lifecycle rules: fix the "New" badge logic now, prepare cleanly for a future `ListingStateMachine`, evolve the helper API only when real lifecycle workflows arrive.

## Dependencies

- Sprint 0 Task 84 (contact card by owner status) — already done; informs the canonical state model.
- Epic C.5 (account blocking) — interacts with listing visibility.

## Tasks

### Task I.1 — Fix "New" badge logic

**Type:** Bugfix / domain rules
**Priority:** Medium-High
**Area:** Listing card, "New" badge, listing creation/edit metadata

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/domain-rules.md`
2. `docs/data-access-rules.md`
3. Listing card and badge rendering code

**Localization coverage:** sq, en, uk, it (badge label)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:** The "New" badge currently extends its visibility on listing edits. It must depend only on `created_at`.

**Required investigation:**
1. Identify where the badge condition is computed.
2. Bind it to `created_at` (e.g. created within last N days; N is a config constant).
3. Confirm `updated_at` no longer influences the badge.

**Acceptance criteria:**
- Badge visibility based only on `created_at`.
- Threshold (e.g. 7 days) documented in `docs/domain-rules.md`.
- Badge label translated in all four locales.

### Task I.2 — Prepare for future ListingStateMachine

**Type:** Architectural alignment
**Priority:** Low (preparation only)
**Area:** Listing status enum, helper utilities

**Pre-read:** I.1, plus `docs/ai-behavior.md` Architecture Stability Rules
**Localization coverage:** N/A
**Responsive coverage:** N/A

**Goal:** Do NOT build a full state machine yet. But ensure the current code does not block a future state machine: keep status as an enum, centralize status-derived booleans (`isPublishable`, `isVisibleToGuests`, etc.) in a single module, no scattered `if (status === 'X')` blocks.

**Acceptance criteria:**
- Single status-helpers module.
- All scattered status checks routed through it.
- Document the future evolution path in `docs/domain-rules.md`.

### Task I.3 — Helper API evolution (deferred trigger)

**Type:** Refactor (future)
**Priority:** Low — deferred until lifecycle workflows actually exist
**Area:** Status helpers signature

**Pre-read:** I.1, I.2

**Goal:** Migrate from `(status) => boolean` to `(listing) => boolean` only when one of these arrives:
- Publishing workflows
- Moderation automation
- Lifecycle transitions
- Listing automation

Document the trigger condition; do nothing else until the trigger fires.

**Acceptance criteria:** Trigger condition explicitly written in `docs/domain-rules.md`; placeholder backlog entry.

## Epic-level acceptance

"New" badge fixed; status helpers centralized; future state machine work unblocked but not built.
