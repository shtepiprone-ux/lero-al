# Epic E — kickoff prompts (remaining items only)

> Audit 2026-05-20: E.2 (filter chips) and E.3 (saved searches CRUD + notify-toggle) already exist.
> Only E.1, E.4, E.5 remain. Each kickoff below is self-contained.
>
> **Global task numbering (fixed 2026-05-20):** E.1 = **Task 131**, E.4 = **Task 132**, E.5 = **Task 133**.
> (Order: D 121–124 → C 125–126 → K 127–130 → E 131–133 → F 134–137 → …). See `docs/backlog.md` roadmap.
> Each kickoff below says "document as the next sequential number" — use the fixed number above; verify against backlog at start.

---

## E.1 — Horizontal filter bar redesign

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic E — Search, Filters & Saved Search UX. This is sub-task E.1.
Document this as the NEXT sequential global Task number — check docs/backlog.md for the last completed task; do not reuse a number.

Goal: Redesign the listings filters from the current sidebar/grid layout into a horizontal filter bar at the top of the listings page (reference UX: dom.ria — see the URL in tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md). Mobile keeps a drawer (canonical Sheet).

Required pre-read:
1. tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md — E.1 scope + the dom.ria reference URL.
2. docs/ai-behavior.md — Canonical Task Template, Filter Architecture Anti-Patterns (Tasks 50.2/50.4/53), UI Primitive Anti-Patterns, Pre-Task Mandatory Checklist.
3. docs/ui-rules.md, docs/component-governance.md, docs/responsive-audit.md.
4. Existing filter system (REUSE — do not duplicate logic):
   - src/modules/listings/domain/filterEngine.ts (canonical engine — parseSearchParams, countActiveFilters, getFilterVisibility)
   - src/modules/listings/components/ListingsFilters.tsx (current, 392 lines)
   - src/components/shared/FiltersPanel.tsx, FilterToggleGroup, FilterMultiToggle, FilterRoomsRow, FilterRangeInputs
   - src/modules/listings/hooks/useListingsUrlFilters.ts, src/components/shared/useHomepageFilters.ts
   - src/modules/listings/components/ActiveFilterChips.tsx (E.2, done)
5. Inspect package.json for validation scripts.

Localization coverage: sq, en, uk, it — Ukrainian strings are longest; test wrap/truncate in the horizontal bar.
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560 — horizontal bar on desktop/tablet; canonical Sheet drawer on mobile.

Scope:
1. Build a horizontal filter bar for the listings page using the EXISTING filter primitives + filterEngine — no parallel filter logic, no new serializer (Filter Architecture Anti-Patterns).
2. Keep homepage batch-state vs listings URL-immediate models isolated (do NOT merge them — see anti-patterns).
3. Mobile: filters open in a canonical Sheet (not a custom overlay).
4. Preserve ActiveFilterChips behavior.

Acceptance criteria:
- Horizontal bar on ≥768; canonical Sheet drawer <768.
- All filtering still routes through filterEngine.ts (no duplicate logic).
- All 4 locales render without overflow; all 7 breakpoints validated.
- 0 new lint errors / 0 new warnings; governance:tailwind + governance:responsive + governance:primitives no regression.
- Session log + docs/backlog.md updated. Commit + push when green.

Out of scope: saved-search notifications (E.4), state-architecture decision (E.5), favorites.
Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.
```

---

## E.4 — Saved-search match notifications

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic E — sub-task E.4. Document as the NEXT sequential global Task number (check docs/backlog.md).
DEPENDENCY: requires the email infra — Epic D.1 (send helper, done) + D.2 (admin template manager, Task 123). Do NOT start E.4 until D.2 is done, since saved-search alert emails are admin-editable templates per docs/integrations.md.

Goal: When new listings match a user's saved search, notify them (email + in-app), respecting the saved search's notify_email flag and a frequency setting.

Background already in place (REUSE):
- SavedSearch table has notify_email, filters_hash, last_checked_at, new_count.
- SavedSearchesTab toggles notify_email.
- NotificationType includes 'saved_search_match'.
- Email: src/modules/notifications/lib/emails/send.ts (sendEmail), resolveUserLocale.ts, Epic D.2 template manager.

Required pre-read:
1. tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md — E.4 scope.
2. docs/integrations.md — Email Template Architecture (saved-search alert = admin-editable) + Locale-aware sending.
3. docs/ai-behavior.md — Canonical Task Template, Data Fetching Rules, Pre-Task Mandatory Checklist.
4. docs/data-access-rules.md, docs/rls-rules.md, docs/domain-rules.md.
5. src/modules/cabinet/components/SavedSearchesTab.tsx, src/modules/listings/lib/savedSearchCanonicalize.ts, src/types/database.ts (SavedSearch).
6. The inactivity cron pattern from Task 124 (Vercel cron + CRON_SECRET) — reuse the same job infra approach.
7. Inspect package.json.

Localization coverage: sq, en, uk, it — email via resolveUserLocale (cron has no request context → preferred_locale). In-app notification text via messages/*.json.
Responsive coverage: email render + any in-app notification UI at all 7 breakpoints.

Scope:
1. A scheduled job (Vercel cron, same pattern as Task 124) that, per saved search with notify_email=true, detects new matching listings since last_checked_at (use filters_hash / canonical filters), updates new_count + last_checked_at.
2. On new matches: send the admin-editable "saved_search_alert" email (Epic D.2) via sendEmail in the recipient's locale, + create an in-app 'saved_search_match' notification.
3. Frequency control: per saved search (instant / daily digest / weekly) — add the field + UI in SavedSearchesTab if not present; default daily.
4. Deterministic + idempotent; deduplicate (don't re-alert the same listings).

Acceptance criteria:
- Job detects new matches per saved search and updates last_checked_at/new_count.
- Email (locale-correct, admin-editable template) + in-app notification fire on new matches, respecting notify_email + frequency.
- Idempotent; no duplicate alerts.
- 0 new lint errors / 0 new warnings; governance:localization PASS; typecheck no new errors.
- Session log + docs/backlog.md updated. Commit + push when green.

Out of scope: horizontal filters (E.1), price-change notifications (F.3 — separate but similar).
Follow every rule in docs/ai-behavior.md.
```

---

## E.5 — Architecture decision: URL-state vs server-state (documentation only)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic E — sub-task E.5. Document as the NEXT sequential global Task number (check docs/backlog.md).
This is a DOCUMENTATION/decision task — no feature code.

Goal: Decide and record the long-term direction for filter/search state:
(a) URL state → Server → UI (current model), or (b) Server state via React Query / SWR.

Required pre-read:
1. docs/state-authority.md (current SSR vs client authority rules).
2. docs/ai-behavior.md — State Management Rules, Filter Architecture Anti-Patterns.
3. src/modules/listings/domain/filterEngine.ts, useListingsUrlFilters.ts, useHomepageFilters.ts (how state flows today).

Scope:
1. Write an ADR-style entry in docs/state-authority.md: trade-offs of (a) vs (b) given the current architecture, a recommendation, and migration implications. No code changes.

Acceptance criteria:
- ADR committed to docs/state-authority.md with a clear recommendation.
- Session log + docs/backlog.md updated.

Out of scope: any implementation. Follow docs/ai-behavior.md.
```
