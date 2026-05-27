# Epic EE — Footer Admin Manager

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #103 (the public site footer is not manageable from
the admin panel at all today; the owner wants full admin control over the footer, including all
four locales — sq/en/uk/it).
**Kickoffs:** `Epic_EE_kickoff_prompts.md` (Task 247).

> Mid-effort. New admin manager + new persistence + footer reads from DB instead of hardcoded /
> i18n-only content. The locale-aware persistence model is the open question — see the kickoff
> decision gate.

## Goal

An admin (and possibly moderator, if the kickoff says so) can edit the footer from the admin
panel. Edits cover every section the footer renders today — link columns, social links, contact
info, copyright/legal — and they edit ×4 locales side by side. The public footer reads the
managed content (with a sensible fallback if the DB has no row yet).

## Dependencies

- The current footer component(s) under `src/components/shared/Footer*` or `src/modules/layout/
  Footer*` — confirm in the kickoff.
- `docs/integrations.md` (Resend / contact pattern — the footer links to the Contacts page from
  Epic V which already routes inquiries by topic).
- The admin shell + role gate (Epic L / Epic K pattern).
- The Epic V (Contacts) link is already in the footer (Task 222 session log) — the footer
  manager must not break that link.

## Tasks

### Task 247 — EE.1 — Footer fully manageable from admin × 4 locales

**Type:** feature
**Priority:** medium
**Area:** new `/admin/footer` manager + new `footer_*` tables (schema decision in kickoff) +
public footer component

**Pre-read:** the current footer source files; `docs/data-access-rules.md`; `docs/rls-rules.md`;
`docs/ai-behavior.md` Note 14 (Global Change Verification — every footer-rendering surface must
read from the new source); `docs/component-governance.md §11` (admin table canonical pattern,
used for the link columns / social links list); the admin sidebar pattern; the canonical
`Combobox` / `Input` / `Dialog`.
**Localization coverage:** sq, en, uk, it (the four columns of the editor + every public footer
string × 4).
**Responsive coverage:** all 7 breakpoints (public footer + admin manager).

**Goal:**

1. **Audit.** Document everything the current footer renders today — sections, items per section,
   labels, URLs, social-link list, contact info, copyright. The kickoff lists them.
2. **Schema (single-writer SQL — owner runs the exact SQL written to the session log).**
   Recommended model:
   - `footer_sections` (id uuid pk, key text unique, order_index int, created_at) — e.g.
     "main_links", "social", "contact", "legal".
   - `footer_items` (id uuid pk, section_id fk, order_index int, item_type text check in
     ('link', 'social', 'text'), url text null, icon text null, created_at, updated_at,
     updated_by uuid references users(id) on delete set null).
   - `footer_item_translations` (id uuid pk, item_id fk, locale text check in
     ('sq','en','uk','it'), label text not null, value text null, unique(item_id, locale)).
   - RLS: admin (and moderator if granted via `role_permissions` per Task 250) can
     SELECT/INSERT/UPDATE; everyone can SELECT (the public footer renders this).

   If the owner prefers a single JSON column over normalized rows, STOP and ask the orchestrator
   in the kickoff before code; do not invent the schema unilaterally.
3. **Admin manager** at `/admin/footer` — list sections (canonical AdminTableRow §11), each row
   click → modal that edits the four-locale labels side by side (one Input per locale, or one
   compact tab per locale per the modal canonical pattern from Epic Z). Reorder via the existing
   drag/order pattern if one already exists in admin; if not, simple up/down arrows.
4. **Public footer reads from DB** (with an in-memory cache + revalidate; do not run a DB query
   per request without caching — match the existing pattern used in other public-served content,
   e.g. popular locations from Epic J).

**Acceptance criteria:**
- Admin can edit every footer section / item / locale label from `/admin/footer`; changes
  appear on the public footer (with revalidation).
- Public footer renders the same set of sections / items it did pre-change (Note 20 — no
  silent removal) and in the same visual layout (Note 19 — flow preserved).
- Locale parity ×4 verified at runtime.
- Exact SQL written to the session log; owner runs it.
- Default-deny for moderator (unless permission granted); admin always allowed; RLS enforces.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** redesigning the footer's visual look; multi-region / per-country footers; a
versioned/draft workflow (single live version only — file follow-up if owner wants drafts).

## Epic-level acceptance

Full admin control of the footer across all four locales; public footer reads from the managed
source with cache + revalidate; current footer content is preserved as the initial seed.
