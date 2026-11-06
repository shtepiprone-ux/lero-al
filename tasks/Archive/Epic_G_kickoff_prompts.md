# Epic G — kickoff prompts (all 3 sub-tasks)

> Recently Viewed Listings. None of the 3 features are built. Each kickoff below is self-contained.
>
> **Global task numbering (fixed 2026-05-20):** G.1 = **Task 138**, G.2 = **Task 139**, G.3 = **Task 140**.
> (Order: G.1 → G.2 → G.3 — storage first, then UI, then clear-history.) See `docs/backlog.md` roadmap.
> Each kickoff says "document as the next sequential number" — use the fixed number above; verify against backlog at start.

---

## G.1 — Track recently viewed listings (storage layer)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G — sub-task G.1. Document as Task 138 (verify against docs/backlog.md).

Hard contract (do NOT violate): do not change the scope below; do not add new architectural decisions on your own; execute the acceptance criteria literally; if something seems missing or ambiguous, stop and ask — do not invent scope.

Goal: Persist a per-user recently-viewed listings history with privacy-respecting storage rules:
authenticated users → server-side table; guests → cookie or localStorage.

Required pre-read:
1. tasks/Epics/Epic_G_Recently_Viewed_Listings.md — G.1 scope.
2. docs/ai-behavior.md — Canonical Task Template, Pre-Task Mandatory Checklist, Data Fetching Rules, State Management Rules.
3. docs/data-access-rules.md, docs/rls-rules.md (server-side table + RLS).
4. docs/state-authority.md (SSR vs client authority decision).
5. docs/analytics-rules.md (guest privacy approach — decide cookie vs localStorage based on this).
6. src/app/[locale]/listing/[id]/page.tsx (where a view happens) + src/modules/listings — find an existing analytics/event hook to piggyback on, or add a thin write-only action.
7. Confirm where DB migrations are applied (no supabase/ folder — Supabase dashboard SQL, per Task 119 pattern).
8. Inspect package.json.

Localization coverage: N/A (storage layer — no user-visible text in this task).
Responsive coverage: N/A (storage layer).

Scope:
1. DB: recently_viewed table — (user_id, listing_id, viewed_at). RLS: owner-only read/write. Document migration SQL in the session log.
2. Cap at 25 entries per user (configurable constant); on insert, dedupe by listing_id (update viewed_at, do not duplicate rows) and prune older entries beyond the cap.
3. Guest storage: use a **cookie** (NOT localStorage) so the G.2 recently-viewed section can render SSR-first without hydration flicker — the server reads it from request cookies; the client updates it on view. Listing IDs only (non-sensitive), so a regular non-HttpOnly cookie is acceptable; document the cookie name + JSON format + size guard in the session log. Same 25-cap + dedupe semantics. (Decision fixed here — do not switch to localStorage.)
4. Server action recordListingView(listingId) — RLS-safe; called from listing detail page after first render (no double-fire on hydration).
5. No PII in logs; do not log listing content.

Acceptance criteria:
- recently_viewed table + RLS deployed (migration SQL in session log).
- Cap (25) + dedupe enforced for both auth + guest paths.
- recordListingView idempotent on rapid double-call; no duplicate rows / cookie entries.
- Guest privacy choice documented in docs/analytics-rules.md.
- 0 new lint errors / 0 new warnings; typecheck no new errors; governance gates relevant to scope PASS.
- Session log + backlog updated. Commit + push.

Out of scope: UI block (G.2), clear history (G.3). Follow docs/ai-behavior.md.
```

---

## G.2 — Recently viewed UI block

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G — sub-task G.2. Document as Task 139 (verify against docs/backlog.md).

Hard contract (do NOT violate): do not change the scope below; do not add new architectural decisions on your own; execute the acceptance criteria literally; if something seems missing or ambiguous, stop and ask — do not invent scope.
DEPENDENCY: G.1 (Task 138) must be done — storage layer must exist.

Goal: Render the user's recent-views as a horizontal scroller / grid on listing detail (excluding the current listing) and a dedicated section in the profile.

Required pre-read:
1. tasks/Epics/Epic_G_Recently_Viewed_Listings.md — G.2 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns, Pre-Task Mandatory Checklist.
3. docs/ui-rules.md, docs/component-rules.md, docs/component-governance.md.
4. docs/state-authority.md (SSR-first for the section; how to read auth + guest sources without flicker).
5. src/app/[locale]/listing/[id]/page.tsx, src/modules/listings/components/* (listing card primitives), src/app/[locale]/profile/ (or equivalent profile route).
6. Existing horizontal-scroller / carousel patterns in the project — REUSE; do not create a new one.
7. Inspect package.json.

Localization coverage: sq, en, uk, it (section title + empty state → messages/*.json, all 4 files).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. On listing detail: render "Recently viewed" section beneath the main content, excluding the current listing. Auth → from server; guest → from cookie/localStorage (read SSR-safely or hydrate without layout shift — pick + document).
2. On profile: dedicated section with the same data source, no exclusion filter.
3. Use canonical listing card; no inline card clones.
4. Empty state localized; loading state localized.

Acceptance criteria:
- Section renders on listing detail and profile in all 4 locales; current listing excluded on detail.
- Mobile-first; all 7 breakpoints validated; horizontal scroller / grid follows existing canonical pattern.
- No hydration mismatch; no flicker when switching auth ↔ guest.
- 0 new lint/warnings; governance:localization + responsive PASS.
- Session log + backlog updated. Commit + push.

Out of scope: clear history (G.3). Follow docs/ai-behavior.md.
```

---

## G.3 — Clear recently viewed history

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G — sub-task G.3. Document as Task 140 (verify against docs/backlog.md).

Hard contract (do NOT violate): do not change the scope below; do not add new architectural decisions on your own; execute the acceptance criteria literally; if something seems missing or ambiguous, stop and ask — do not invent scope.
DEPENDENCY: G.1 (storage), G.2 (UI surface). Both must be done.

Goal: User can clear their recently viewed history from profile, with canonical confirmation dialog.

Required pre-read:
1. tasks/Epics/Epic_G_Recently_Viewed_Listings.md — G.3 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns.
3. docs/ui-rules.md, docs/component-rules.md.
4. src/components/ui/dialog.tsx, src/components/ui/sonner.tsx (canonical Dialog + toast).
5. The G.1 storage actions; profile section from G.2.
6. Inspect package.json.

Localization coverage: sq, en, uk, it (button label, dialog title/body, confirm/cancel, success toast → messages/*.json).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. "Clear history" button in the profile section (G.2).
2. Canonical Dialog confirmation; on confirm → clearRecentlyViewed() server action (auth) AND clear cookie/localStorage (guest).
3. Success toast via sonner; section re-renders empty.

Acceptance criteria:
- Server entries deleted (auth) AND cookie/localStorage cleared (guest) on confirm.
- Canonical Dialog + sonner toast; no raw <button> / div.fixed.inset-0.
- All 4 locales; all 7 breakpoints.
- 0 new lint/warnings; governance:localization + components PASS.
- Session log + backlog updated. Commit + push.

Out of scope: per-item delete (not in epic). Follow docs/ai-behavior.md.
```
