# Epic J — Popular Locations Management

**Status:** OPEN
**Opened:** 2026-05-19
**Origin:** Bug 2 in 2026-05-19 review of `ideas.txt`

## Goal

The public site has a "Popular Locations" section that currently does not render. Build it as a real product surface: admin/moderator CRUD of locations, auto-generated link-filter per location, manual photo upload per location.

## Dependencies

- Epic A (locale consistency) — location names appear in all four locales.
- Epic H.7 (Cloudinary for non-listing/non-avatar photos) — defines folder structure for location photos.
- Epic K (Admin Tables Standardization) — admin CRUD page follows the canonical table behavior.

## Tasks

### Task J.1 — Schema and admin CRUD for popular locations

**Type:** Feature
**Priority:** Medium-High
**Area:** New `popular_locations` table, admin page

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/data-access-rules.md`, `docs/rls-rules.md`
2. `docs/domain-rules.md` (location modeling — must match existing city/location enum or table)
3. `docs/integrations.md` (Cloudinary), Epic H.7

**Localization coverage:** sq, en, uk, it (display name per locale)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (admin CRUD UI)

**Goal:** New `popular_locations` table with: id, slug, name per locale (or FK to canonical locations table), photo URL, sort order, active flag.

**Acceptance criteria:**
- Schema + RLS rules (only admin/moderator can mutate).
- Admin CRUD page following Epic K canonical table pattern.
- Photo upload follows Epic H.7 folder rules.

### Task J.2 — Render "Popular Locations" section on the public site

**Type:** Feature
**Priority:** Medium-High
**Area:** Homepage section, listing filter linking

**Pre-read:** J.1, plus `docs/ui-rules.md`, `docs/component-rules.md`, `docs/architecture.md`
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Public section that lists popular locations with photo and clickable link. The link is auto-generated as a search-filter URL using the location's slug/id.

**Acceptance criteria:**
- Section renders only when at least one active location exists (else hidden, à la Sprint 1 Task 101 pattern).
- Each card links to the listings page pre-filtered by that location.
- Mobile-first layout; all seven breakpoints validated.
- All four locales render the location names.

### Task J.3 — Auto-generated link-filter per location

**Type:** Feature
**Priority:** Medium
**Area:** Filter URL serialization, slug resolution

**Pre-read:** J.2, plus `src/lib/filters/filterEngine.ts` and Filter Architecture Anti-Patterns
**Localization coverage:** sq, en, uk, it (URL slugs language strategy must be decided)
**Responsive coverage:** N/A

**Goal:** Resolve the location to the canonical filter param (e.g. `?location=<slug>` or `?city_id=<id>`). Use the project's canonical filter engine — no parallel serializer.

**Acceptance criteria:** Link follows the canonical pattern; clicking the card lands on listings filtered by that location.

## Epic-level acceptance

Admin manages popular locations end-to-end; public section renders; clicking a card filters listings correctly.
