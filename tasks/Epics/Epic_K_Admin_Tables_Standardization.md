# Epic K — Admin Tables Standardization

**Status:** OPEN
**Opened:** 2026-05-19
**Origin:** Bug 3 in 2026-05-19 review of `ideas.txt`

## Goal

Unify behavior of every admin table (Listings, Users, future Companies, Reports, Popular Locations) to a single canonical pattern:
1. Row title (listing name, user name, company name…) is the **clickable** affordance.
2. Clicking the title opens a **preview dialog** with edit/delete actions inside.
3. The legacy duplicate "actions" column (with the same edit/delete buttons) is **removed**.

## Dependencies

- Sprint 1 Task 97 (Listings "Тип" column localization) closes first — exposes the Listings table file.
- Epic A (locale consistency) reduces translation noise during the audit.

## Tasks

### Task K.1 — Define canonical AdminTableRow pattern

**Type:** Architectural / design system
**Priority:** High (blocks K.2 / K.3)
**Area:** Shared admin table primitive(s)

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/component-rules.md`, `docs/component-governance.md`
2. `docs/ui-rules.md`
3. `docs/qa-rules.md`
4. Existing admin tables in `src/components/admin/` (Listings, Users)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Document and (if needed) extract a canonical admin row pattern:
- Title is clickable → opens preview dialog
- Inside the dialog: edit + delete + close
- No duplicate actions column
- Confirmation for destructive actions via canonical `Dialog`

**Acceptance criteria:**
- Pattern documented in `docs/component-catalog.md` or `docs/component-governance.md`.
- Reusable primitive (if appropriate) lives in `src/components/admin/` and is referenced by Listings + Users.

### Task K.2 — Migrate Listings admin table to canonical pattern

**Type:** Refactor
**Priority:** High
**Area:** `src/components/admin/listings/`

**Pre-read:** K.1 plus the existing Listings admin code
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:**
- Make listing name clickable.
- Open a preview dialog with edit + delete.
- Remove the legacy duplicate "actions" column.

**Acceptance criteria:** Behavior parity with Users admin table; "Тип" column translates (Sprint 1 Task 97 verified); all locales / breakpoints pass.

### Task K.3 — Migrate Users admin table to canonical pattern (remove actions duplication)

**Type:** Refactor
**Priority:** High
**Area:** `src/components/admin/users/`

**Pre-read:** K.1 plus the existing Users admin code

**Goal:** Users name is already clickable — remove the duplicate edit/delete in the "actions" column. Confirm parity with K.2's Listings migration.

**Acceptance criteria:** Single canonical click target; no orphaned actions column; all locales / breakpoints pass.

### Task K.4 — Audit every other admin table to the canonical pattern

**Type:** Audit / migration
**Priority:** Medium
**Area:** All remaining admin tables (Companies, Reports, Popular Locations, future tables)

**Pre-read:** K.1, K.2, K.3, plus all admin pages

**Goal:** Inventory every admin table; verify each conforms to K.1; migrate any non-conformant ones.

**Acceptance criteria:** All admin tables follow the canonical pattern; `docs/component-catalog.md` updated.

## Epic-level acceptance

Every admin table follows the same row-interaction pattern; the canonical pattern is documented; no admin table has duplicated row actions.
