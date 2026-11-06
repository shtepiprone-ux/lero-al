# Epic F — kickoff prompts (all 4 sub-tasks)

> Audit 2026-05-20: baseline favorites exist; none of the 4 features are built. Each kickoff below is self-contained.
>
> **Global task numbering (fixed 2026-05-20):** F.1 = **Task 134**, F.4 = **Task 135**, F.2 = **Task 136**, F.3 = **Task 137**.
> (Order: F.1 → F.4 → F.2 → F.3 — F.4 refactor before collections/notifications.) See `docs/backlog.md` roadmap.
> Each kickoff below says "document as the next sequential number" — use the fixed number above; verify against backlog at start.

---

## F.1 — Favorites pagination (25 per page)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic F — sub-task F.1. Document as the NEXT sequential global Task number (check docs/backlog.md).

Goal: Paginate the favorites page at 25 listings per page, with empty / loading / error states.

Required pre-read:
1. tasks/Epics/Epic_F_Favorites_Improvements.md — F.1 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns, Pre-Task Mandatory Checklist.
3. docs/data-access-rules.md (pagination conventions used elsewhere — match them), docs/ui-rules.md.
4. src/app/[locale]/favorites/page.tsx, src/modules/listings/components/FavoritesShell.tsx, src/modules/listings/lib/favoritesQueries.ts, src/modules/listings/hooks/useFavoritesRealtime.ts.
5. Look at how listings pagination is done elsewhere (admin tables / listings page) and reuse the pattern.
6. Inspect package.json.

Localization coverage: sq, en, uk, it (pagination + empty/loading/error text → messages/*.json, all 4 files).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. Paginate favorites at 25/page following the project's existing pagination convention.
2. Empty / loading / error states, all localized.
3. Keep realtime favorite counts working (useFavoritesRealtime) across pages.

Acceptance criteria:
- 25/page pagination matching the project convention; empty/loading/error states in all 4 locales; all 7 breakpoints.
- Realtime favorites still work.
- 0 new lint/warnings; governance:localization + responsive PASS. Session log + backlog updated. Commit + push.

Out of scope: collections (F.2), notifications (F.3), API refactor (F.4). Follow docs/ai-behavior.md.
```

---

## F.4 — API refactor: explicit add/remove

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic F — sub-task F.4. Document as the NEXT sequential global Task number (check docs/backlog.md).
Recommended to do BEFORE F.2/F.3 so collections + notifications build on the explicit API.

Goal: Migrate from toggleFavorite(listingId, currentlyFavorited) to explicit addFavorite(listingId) / removeFavorite(listingId). Eliminates the race-condition-prone toggle; intent is explicit.

Required pre-read:
1. tasks/Epics/Epic_F_Favorites_Improvements.md — F.4 scope.
2. docs/ai-behavior.md — Architecture Stability Rules, State Management Rules, Async/Effects Rules, Pre-Task Mandatory Checklist.
3. docs/data-access-rules.md, docs/rls-rules.md.
4. src/modules/listings/actions/toggleFavorite.ts (current), src/modules/listings/components/FavoriteButton.tsx (caller), tests in __tests__.
5. Inspect package.json.

Localization coverage: sq, en, uk, it (any error messages via Epic A error-code contract). 
Responsive coverage: N/A (logic change); verify FavoriteButton still renders/behaves at all breakpoints.

Scope:
1. Add addFavorite(listingId) + removeFavorite(listingId) server actions (RLS-safe). Keep optimistic UI correct; no double-writes.
2. Update FavoriteButton + all callers; remove toggleFavorite once no callers remain (or keep as thin wrapper if external callers exist — document).
3. Update tests (FavoriteButton.test.tsx, favoritesShell.liveCounts.test.ts).

Acceptance criteria:
- addFavorite/removeFavorite exist + used everywhere; toggleFavorite removed or documented as deprecated wrapper.
- No race conditions / double-writes; optimistic state correct.
- Tests updated + passing; 0 new lint/warnings; typecheck no new errors. Session log + backlog updated. Commit + push.

Out of scope: pagination (F.1), collections (F.2), notifications (F.3). Follow docs/ai-behavior.md.
```

---

## F.2 — Favorites folders / collections

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic F — sub-task F.2. Document as the NEXT sequential global Task number (check docs/backlog.md).
Best done AFTER F.4 (explicit add/remove API).

Goal: Users create named collections, add a listing to one or more collections, rename/delete collections.

Required pre-read:
1. tasks/Epics/Epic_F_Favorites_Improvements.md — F.2 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns, Pre-Task Mandatory Checklist.
3. docs/rls-rules.md (collection ownership), docs/data-access-rules.md, docs/ui-rules.md.
4. src/modules/listings/components/FavoriteButton.tsx, FavoritesShell.tsx, favoritesQueries.ts; src/components/ui/dialog.tsx, sonner.tsx.
5. Confirm where DB migrations are applied (no supabase/ folder — Supabase dashboard SQL, per Task 119).
6. Inspect package.json.

Localization coverage: sq, en, uk, it (collection UI → messages/*.json, all 4 files).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. DB: collections + collection_items tables with RLS (owner-only). Document migration SQL.
2. UI: manage collections from the favorites page + a "Save to…" picker on listing detail / FavoriteButton (canonical Dialog + sonner toast).
3. Rename / delete collections (confirm via canonical Dialog).

Acceptance criteria:
- collections + collection_items tables with RLS; migration SQL documented.
- Create/add-to/rename/delete works; canonical primitives only (Dialog/Button/Input).
- All 4 locales; all 7 breakpoints. 0 new lint/warnings; governance:localization + responsive + components PASS. Session log + backlog updated. Commit + push.

Out of scope: pagination (F.1), notifications (F.3). Follow docs/ai-behavior.md.
```

---

## F.3 — Realtime price-change notifications

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic F — sub-task F.3. Document as the NEXT sequential global Task number (check docs/backlog.md).
DEPENDENCY: requires email infra — Epic D.1 (done) + D.2 (admin template manager, Task 123). Price-change alert is an admin-editable template per docs/integrations.md. Do NOT start before D.2.

Goal: When a favorited listing's price changes, notify the user (email + in-app).

Required pre-read:
1. tasks/Epics/Epic_F_Favorites_Improvements.md — F.3 scope.
2. docs/integrations.md — Email Template Architecture (price-change = admin-editable) + Locale-aware sending.
3. docs/ai-behavior.md — Canonical Task Template, Data Fetching Rules, Pre-Task Mandatory Checklist.
4. docs/data-access-rules.md, docs/rls-rules.md, docs/domain-rules.md.
5. src/modules/listings/lib/favoritesQueries.ts, useFavoritesRealtime.ts; listing price field in src/types/database.ts.
6. Email: src/modules/notifications/lib/emails/send.ts, resolveUserLocale.ts; Epic D.2 template manager + sending helper.
7. The cron pattern from Task 124 (Vercel cron + CRON_SECRET) OR a DB trigger approach — choose + document.
8. Inspect package.json.

Localization coverage: sq, en, uk, it — email via resolveUserLocale; in-app text via messages/*.json.
Responsive coverage: email render + in-app notification UI at all 7 breakpoints.

Scope:
1. Detect price changes on favorited listings (cron diff vs last-known price, or DB trigger — decide + document; needs a last-notified-price tracking to dedupe).
2. On change: send admin-editable "price_change_alert" email (D.2) via sendEmail in recipient's locale + in-app notification.
3. Deterministic, idempotent, deduplicated (don't re-alert the same price).

Acceptance criteria:
- Price-change detected for favorited listings; dedup tracking in place.
- Email (locale-correct, admin-editable) + in-app notification fire on change.
- Idempotent; no duplicate alerts. 0 new lint/warnings; governance:localization PASS; typecheck no new errors. Session log + backlog updated. Commit + push.

Out of scope: pagination (F.1), collections (F.2), API refactor (F.4). Follow docs/ai-behavior.md.
```
