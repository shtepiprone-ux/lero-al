# Epic I — kickoff prompts (all 3 sub-tasks)

> Listing Lifecycle & Status Rules. Fix "New" badge logic, prepare cleanly for a future ListingStateMachine, evolve helper API only when real lifecycle workflows arrive.
>
> **Global task numbering (fixed 2026-05-20):** I.1 = **Task 148**, I.2 = **Task 149**, I.3 = **Task 150**.
> (Order: I.1 → I.2 → I.3 — bugfix, then centralization, then deferred trigger doc.) See `docs/backlog.md` roadmap.
> Each kickoff below is self-contained.

---

## I.1 — Fix "New" badge logic (created_at only)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic I — sub-task I.1. Document as Task 148 (verify against docs/backlog.md).

Bug: The "New" badge on listing cards currently extends its visibility when a listing is EDITED (likely keyed off updated_at or a derived field). It must depend ONLY on created_at.

Required pre-read:
1. tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md — I.1 scope.
2. docs/ai-behavior.md — Canonical Task Template, Architecture Stability Rules, Pre-Task Mandatory Checklist.
3. docs/domain-rules.md (UPDATE this file — add the threshold + rule).
4. docs/data-access-rules.md.
5. Listing card component(s); the helper that computes the "New" badge condition; queries that read listings.
6. Inspect package.json.

Localization coverage: sq, en, uk, it (badge label — verify existing key, NO new keys expected; this is a bugfix).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560 (visual smoke of the badge on the card).

Required investigation:
1. Find where the badge condition is computed today (grep for the badge label / its translation key).
2. Confirm what drives it (updated_at? a derived "is_recent" field? a query filter?).
3. Bind it strictly to created_at: badge visible if Date.now() - created_at <= NEW_BADGE_DAYS days (constant).
4. Confirm updated_at no longer influences the badge anywhere (search + verify).

Scope:
1. Add NEW_BADGE_DAYS constant (default 7) in a single shared location — document.
2. Replace any updated_at / derived-recency logic with the created_at + NEW_BADGE_DAYS rule.
3. Document the rule + threshold in docs/domain-rules.md.

Acceptance criteria:
- Editing a listing does NOT extend the "New" badge.
- Threshold (7 days) documented in docs/domain-rules.md.
- Badge label renders in all 4 locales (regression check, no new keys).
- 0 new lint/warnings; typecheck no new errors; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: status helpers centralization (I.2), helper API evolution (I.3). Follow docs/ai-behavior.md.
```

---

## I.2 — Centralize status helpers (prepare for ListingStateMachine)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic I — sub-task I.2. Document as Task 149 (verify against docs/backlog.md).
DEPENDENCY: I.1 (Task 148) — fix the badge bug first.

Goal: Do NOT build a state machine yet. Centralize status-derived booleans so a future ListingStateMachine is not blocked by scattered `if (status === 'X')` blocks.

Required pre-read:
1. tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md — I.2 scope.
2. docs/ai-behavior.md — Architecture Stability Rules, Domain Integrity Rules, Pre-Task Mandatory Checklist.
3. docs/domain-rules.md (UPDATE — document the helpers + future-evolution path).
4. src/types/database.ts — listing status enum (source of truth).
5. Grep `status === 'active' | 'inactive' | 'draft' | 'published' | 'archived' | ...` across the codebase — every match is a candidate to be routed through a helper.
6. Inspect package.json.

Localization coverage: N/A (logic centralization — no user-visible text).
Responsive coverage: N/A.

Scope:
1. Create src/modules/listings/lib/statusHelpers.ts (or similar canonical path — confirm with existing module layout).
2. Implement: isPublishable(status), isVisibleToGuests(status), isEditableByOwner(status), isModerationVisible(status), … (write only the helpers that have actual scattered consumers — do not invent unused ones).
3. Replace every direct `status === 'X'` check at call sites with the helper. Use search-and-replace carefully; verify each site's intent matches the helper name.
4. Document the helpers + the future ListingStateMachine evolution path in docs/domain-rules.md.

Acceptance criteria:
- Single canonical status-helpers module.
- All scattered status checks routed through it (grep verification documented in session log).
- docs/domain-rules.md updated with helpers + future evolution path.
- 0 new lint/warnings; typecheck no new errors; existing behavior unchanged (regression smoke on listings page + listing detail + admin).
- Session log + backlog updated. Commit + push.

Out of scope: new helper API signature (I.3), behavior changes. Follow docs/ai-behavior.md.
```

---

## I.3 — Helper API evolution (deferred — document trigger)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic I — sub-task I.3. Document as Task 150 (verify against docs/backlog.md).
DEPENDENCY: I.2 (Task 149) — centralized helpers must exist.
NATURE: documentation-only task. Do NOT migrate the API in this task.

Goal: Define and document the trigger condition under which `(status) => boolean` helpers should migrate to `(listing) => boolean`. Do nothing else until the trigger fires.

Required pre-read:
1. tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md — I.3 scope.
2. docs/ai-behavior.md — Architecture Stability Rules.
3. docs/domain-rules.md (I.2 output — extend it).
4. The helper module from I.2.
5. Inspect package.json.

Localization coverage: N/A.
Responsive coverage: N/A.

Scope:
1. In docs/domain-rules.md, add a section "Listing helper API evolution trigger" that explicitly lists when the migration MUST happen:
   - Publishing workflows arrive (e.g. scheduled publish).
   - Moderation automation arrives (auto-hide, auto-flag).
   - Lifecycle transitions arrive (draft → review → published).
   - Listing automation arrives (auto-expire, auto-renew).
2. Add a placeholder backlog entry under "Follow-ups" in docs/backlog.md noting the deferred migration + its trigger.
3. Do NOT change any helper signatures.

Acceptance criteria:
- Trigger condition explicitly written in docs/domain-rules.md.
- Placeholder backlog entry added.
- 0 code changes; 0 new lint/warnings.
- Session log + backlog updated. Commit + push.

Out of scope: any helper API change. Follow docs/ai-behavior.md.
```
