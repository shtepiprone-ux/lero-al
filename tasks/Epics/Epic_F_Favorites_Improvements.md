# Epic F — Favorites Improvements

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Promote favorites from a single heart button into a real product area: pagination, folders/collections, realtime price-change notifications, and a future API refactor.

## Dependencies

- Sprint 1 (no specific Sprint 1 task blocks this, but Task 88 baseline is in place).
- Epic D.1 (email) blocks F.3 (price-change notifications via email).

## Tasks

### Task F.1 — Favorites pagination (25 per page)

**Type:** Feature
**Priority:** Medium-High
**Area:** Favorites page, pagination component

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/ui-rules.md`, `docs/component-rules.md`
2. `docs/data-access-rules.md` (pagination conventions)
3. `docs/state-authority.md`

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Paginate favorites at 25/page. Cover empty / loading / error states.

**Acceptance criteria:**
- Pagination follows existing project conventions (`docs/data-access-rules.md`).
- Empty / loading / error states all four locales.

### Task F.2 — Folders / collections

**Type:** Feature
**Priority:** Medium
**Area:** Favorites schema, collection CRUD UI

**Pre-read:** F.1, plus `docs/rls-rules.md` (collection ownership), `docs/data-access-rules.md`
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Users create named collections; add a listing to one or more collections; rename / delete collections.

**Acceptance criteria:**
- `collections` and `collection_items` tables with RLS.
- UI to manage from favorites page and listing detail "Save to…" picker.

### Task F.3 — Realtime price-change notifications

**Type:** Feature
**Priority:** Medium
**Area:** Notifications, price-change watcher
**Dependencies:** Epic D.1 (email)
**Pre-read:** F.1, F.2, plus Epic D
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email + in-app indicators

**Goal:** If a favorited listing's price changes, notify the user (email + in-app).

**Acceptance criteria:** Deterministic, deduplicated, locale-correct.

### Task F.4 — API refactor: explicit add/remove

**Type:** Refactor (future)
**Priority:** Low (deferred)
**Area:** Favorites toggle API

**Pre-read:** `docs/ai-behavior.md` Architecture Stability Rules
**Localization coverage:** N/A
**Responsive coverage:** N/A

**Goal:** When timing is right, migrate from `toggleFavorite(listingId, currentlyFavorited)` to explicit `addFavorite(listingId)` / `removeFavorite(listingId)`. Race conditions disappear; intent is explicit.

**Acceptance criteria:** API migrated; all call sites updated; no behavioral regressions.

## Epic-level acceptance

Pagination live, collections live, price-change notifications operational, API refactor scheduled with a backlog placeholder.
