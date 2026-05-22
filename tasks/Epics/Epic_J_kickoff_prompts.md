# Epic J — kickoff prompts (all 3 sub-tasks)

> Popular Locations Management. The public site has a "Popular Locations" section that currently does not render. Build it end-to-end: admin CRUD, public render, auto-generated filter link.
>
> **Global task numbering (fixed 2026-05-20):** J.1 = **Task 151**, J.2 = **Task 152**, J.3 = **Task 153**.
> (Order: J.1 → J.2 → J.3 — schema/admin first, then public, then filter link.) See `docs/backlog.md` roadmap.
> ⚠️ **Dependencies:** Epic A (locale consistency — done), Epic H.7 (Task 147 — folder rule for location photos), Epic K (admin table pattern — closed).
> Each kickoff below is self-contained.

---

## J.1 — Schema + admin CRUD for popular locations

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic J — sub-task J.1. Document as Task 151 (verify against docs/backlog.md).
DEPENDENCY: Epic H.7 (Task 147) — defines `popular_locations/<id>/...` folder rule for photos. Confirm H.7 is done OR coordinate the folder name with it now.
DEPENDENCY: Epic K (closed) — admin CRUD page must follow the canonical AdminTableRow pattern in docs/component-governance.md §11.

Goal: New `popular_locations` table + admin CRUD page following the Epic K canonical pattern. Photo upload via H.7 folder rule.

Required pre-read:
1. tasks/Epics/Epic_J_Popular_Locations_Management.md — J.1 scope + Epic-level deps.
2. docs/ai-behavior.md — Canonical Task Template, Pre-Task Mandatory Checklist, UI Primitive Anti-Patterns.
3. docs/data-access-rules.md, docs/rls-rules.md (admin/moderator-only mutate).
4. docs/domain-rules.md (location modeling — match existing city/locations table, do NOT create a parallel one).
5. docs/integrations.md (Cloudinary folder rule from H.7).
6. docs/component-governance.md §11 (canonical admin table pattern — clickable title → preview Dialog, no duplicate actions).
7. Existing admin CRUD pages (e.g. /admin/companies from Task 115) — reuse the shell, sidebar entry pattern, and Dialog modals.
8. Locations source of truth: src/modules/locations/ (or wherever LocationCombobox lives) — popular_locations must FK or slug-match the canonical location row.
9. Confirm where DB migrations are applied (Supabase dashboard SQL, per Task 119 pattern).
10. Inspect package.json.

Localization coverage: sq, en, uk, it (admin UI + display name per locale → messages/*.json, all 4 files).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560 (admin CRUD page).

Scope:
1. DB: popular_locations — id, location_id (FK to canonical locations) OR slug, photo_url (Cloudinary URL/public_id), sort_order (int), is_active (bool), created_at/updated_at. RLS: admin/moderator-only mutate; public read for active rows.
2. Display name: prefer FK to canonical locations (which already has per-locale names per Epic A); document the choice.
3. Admin page /admin/popular-locations following Epic K pattern: list (sortable by sort_order), Dialog for create/edit (Combobox for location, photo upload, sort_order, active flag), Dialog confirm for delete.
4. Sidebar nav entry + mobile header title (follow Task 115/118 patterns).
5. Photo upload: use H.7 folder rule `popular_locations/<id>/...`; reuse existing logo-upload pattern (Task 114).
6. New i18n keys × 4 locales.

Acceptance criteria:
- popular_locations table + RLS deployed (migration SQL in session log).
- /admin/popular-locations renders, list + Dialog CRUD work, follows Epic K canonical pattern.
- Photo upload lands in `popular_locations/<id>/...`.
- All 4 locales; all 7 breakpoints.
- 0 new lint/warnings; governance:localization + components + responsive PASS.
- Session log + backlog updated. Commit + push.

Out of scope: public render (J.2), filter linking (J.3). Follow docs/ai-behavior.md.
```

---

## J.2 — Render "Popular Locations" section on the public site

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic J — sub-task J.2. Document as Task 152 (verify against docs/backlog.md).
DEPENDENCY: J.1 (Task 151) — schema + at least one row needed.

Goal: Public section listing popular locations with photo and clickable card; section hides when no active rows exist (Sprint 1 Task 101 pattern).

Required pre-read:
1. tasks/Epics/Epic_J_Popular_Locations_Management.md — J.2 scope.
2. docs/ai-behavior.md — Canonical Task Template, UI Primitive Anti-Patterns.
3. docs/ui-rules.md, docs/component-rules.md, docs/component-governance.md.
4. docs/architecture.md (page section conventions).
5. src/app/[locale]/page.tsx (homepage) — find the right place to mount the section; check existing section primitives.
6. src/components/ui/* + AppImage (for the location photo).
7. The Sprint 1 Task 101 pattern for hiding when empty (sessions/2026-05-19-task-101-hide-view-all-empty.md).
8. Inspect package.json.

Localization coverage: sq, en, uk, it (section title + per-location name → messages or DB-per-locale).
Responsive coverage: 320, 375, 390, 768, 1280, 1440, 2560.

Scope:
1. Server-render the active popular_locations (sorted by sort_order) on the homepage.
2. Section component: heading + grid/carousel of location cards (photo + name + click target). Reuse existing card primitive if one exists; otherwise compose from canonical Card/AppImage.
3. Hide the entire section when zero active rows (no empty-state header).
4. Mobile-first; canonical responsive scaffolding; 2xl: grid column step.

Acceptance criteria:
- Section renders only when ≥1 active row; hidden cleanly otherwise.
- Each card displays photo + locale-correct name; click target wired (target URL = J.3 — for now navigate to /listings with a placeholder param, J.3 will finalize).
- All 4 locales; all 7 breakpoints.
- 0 new lint/warnings; governance:localization + responsive + components PASS.
- Session log + backlog updated. Commit + push.

Out of scope: canonical filter URL serialization (J.3). Follow docs/ai-behavior.md.
```

---

## J.3 — Auto-generated link-filter per location

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic J — sub-task J.3. Document as Task 153 (verify against docs/backlog.md).
DEPENDENCY: J.2 (Task 152) — public section must exist; J.3 only finalizes the link target.

Goal: Resolve each popular-location card to a canonical listings filter URL via the project's canonical filter engine. NO parallel serializer.

Required pre-read:
1. tasks/Epics/Epic_J_Popular_Locations_Management.md — J.3 scope.
2. docs/ai-behavior.md — Filter Architecture Anti-Patterns (enforced after Task 50.2 + Task 50.4 / Task 53). NO `window.location.href`. NO URL logic inside reusable primitives.
3. src/lib/filters/filterEngine.ts (canonical parseSearchParams + URL building helpers).
4. Existing listing-page filter URL patterns (where does a "filter by city" link come from elsewhere?).
5. The locations schema — confirm canonical filter param (?location=<slug> vs ?city_id=<id>); pick + document.
6. Inspect package.json.

Localization coverage: sq, en, uk, it — URL slugs language strategy must be DECIDED + DOCUMENTED (English slug? per-locale slug? id-only?). Default to id/slug-once approach to keep one canonical URL per location.
Responsive coverage: N/A (logic / link target).

Scope:
1. Use filterEngine.ts utility to build the listings URL from a location (slug or id).
2. Replace the J.2 placeholder link with the canonical filter URL.
3. Verify navigation via router.push() from next/navigation (or proper Link `href`) — NOT window.location.href.
4. Document the canonical filter param + slug strategy in docs/domain-rules.md (or wherever the existing filter contract lives).

Acceptance criteria:
- Card link follows the canonical filter pattern; clicking lands on listings filtered by that location.
- One canonical URL per location across all 4 locales (or per-locale by design — must be explicit).
- 0 new lint/warnings; typecheck no new errors; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: schema or admin (J.1), section rendering (J.2). Follow docs/ai-behavior.md.
```
