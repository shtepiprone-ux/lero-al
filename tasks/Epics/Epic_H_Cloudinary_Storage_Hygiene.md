# Epic H — Cloudinary Storage Hygiene

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Organize all user-uploaded assets in Cloudinary by user / context. Clean up unused images deterministically and safely.

## Dependencies

- None blocking. Migrations of existing assets should be planned carefully.

## Tasks

### Task H.1 — User-based folder structure

**Type:** Refactor / infrastructure
**Priority:** Medium-High
**Area:** Cloudinary upload paths, server actions, env config

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/integrations.md`, `docs/env.md`
2. `docs/data-access-rules.md` (any references to assets in DB)
3. Cloudinary helper(s) in `src/lib/` and any direct uploads in components

**Localization coverage:** sq, en, uk, it (upload UI messages)
**Responsive coverage:** Upload UI at all 7 breakpoints

**Goal:** All assets uploaded by a user go to `<user_id>/...`.

**Acceptance criteria:** All new uploads land in `<user_id>/`; existing assets migration plan documented.

### Task H.2 — Avatar folder structure

**Type:** Refactor
**Priority:** Medium
**Goal:** Avatars at `<user_id>/avatars/`.
**Pre-read:** H.1
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Acceptance criteria:** New avatars land in correct path; profile picture displays correctly.

### Task H.3 — Avatar replacement cleanup

**Type:** Feature
**Priority:** Medium
**Goal:** When a user replaces their avatar, the old avatar that is no longer referenced is deleted from Cloudinary.
**Pre-read:** H.2, plus `docs/qa-rules.md`

**Acceptance criteria:**
- Old avatar deleted via Cloudinary API after successful replacement.
- Dry-run / logging mode documented (see H.6).
- No deletion of an avatar still referenced elsewhere.

### Task H.4 — Listing image folder structure

**Type:** Refactor
**Priority:** Medium-High
**Goal:** Listing photos at `<user_id>/listings/<listing_id>/`.
**Pre-read:** H.1
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Acceptance criteria:** New uploads land in `<user_id>/listings/<listing_id>/`; data model references updated.

### Task H.5 — Listing image replacement cleanup

**Type:** Feature
**Priority:** Medium
**Goal:** When a listing image is replaced or removed, delete its Cloudinary asset.
**Pre-read:** H.4, plus H.6
**Acceptance criteria:** Same safety guarantees as H.3.

### Task H.6 — Safety audit / dry-run

**Type:** Tooling / safety
**Priority:** High (blocks H.3 + H.5)
**Goal:** Build a dry-run mode + log of every destructive Cloudinary delete before enabling real delete. Never delete an asset that is still referenced by the database.

**Acceptance criteria:** Dry-run mode produces a log; real-delete mode behind env flag; integration test that asserts referenced assets are skipped.

### Task H.7 — Other photos (non-listing, non-avatar) — added 2026-05-19

**Type:** Refactor
**Priority:** Medium
**Area:** Any photo upload outside listings/avatars (e.g. company logos, blog images, marketing media)

**Pre-read:** H.1, H.6
**Localization coverage:** sq, en, uk, it (upload UI)
**Responsive coverage:** All 7 breakpoints

**Goal:** All other photos uploaded anywhere in the site or admin must be organized under a canonical folder structure named after what they belong to (e.g. `companies/<company_id>/logo.<ext>`, `marketing/<slug>/...`).

**Acceptance criteria:**
- Folder rule documented in `docs/integrations.md`.
- All upload paths in code reviewed and migrated.
- Migration plan for existing assets.

## Epic-level acceptance

Cloudinary fully organized; cleanup is safe; documentation up to date in `docs/integrations.md`.
