# Session — Task 326 (Opus 4.7 planning): Admin CMS pages + Footer create/select page flow

**Date:** 2026-05-30
**Orchestrator:** Opus 4.7
**Task type:** planning / architecture / task authoring (NO product code; NO locale files; NO DB migration)

---

## Numbering reconciliation

Owner-suggested Task 325 was already occupied by **Sprint 26 Task 325 — Turbopack `import-in-the-middle` dep-hygiene chore**. Per owner's numbering rule ("If Task 325 is already occupied, STOP and use the next free global task number from `docs/backlog.md`"), this planning task and its derived Sonnet implementation work use **Task 326** (split into 326A / 326B / 326C).

Updated counter: **Last task number: 326 (3 sub-tasks 326A/B/C in Sprint 27). Next free: 327.**

---

## Investigation summary

### Static route inventory (`src/app/[locale]/*/page.tsx`)

```
src/app/[locale]/auth/confirm-email/page.tsx
src/app/[locale]/auth/login/page.tsx
src/app/[locale]/auth/register/page.tsx
src/app/[locale]/auth/reset-password/page.tsx
src/app/[locale]/auth/verified/page.tsx
src/app/[locale]/cabinet/page.tsx
src/app/[locale]/contact/page.tsx
src/app/[locale]/favorites/page.tsx
src/app/[locale]/listings/[slug]/edit/page.tsx
src/app/[locale]/listings/[slug]/page.tsx
src/app/[locale]/listings/create/page.tsx
src/app/[locale]/listings/page.tsx
src/app/[locale]/page.tsx
```

**Conclusion:** the public-facing static routes are auth/*, cabinet, contact, favorites, listings/*, and the landing page. There is no `[locale]/[slug]/page.tsx` — meaning Footer links like `/about`, `/privacy-policy`, `/terms-of-service` currently 404 unconditionally regardless of Task 324's Footer-side validation guard.

### Reserved-slug list (route-collision blockers — to be encoded in Task 326A slug validator)

Locale-agnostic reserved slugs:
- `auth`, `cabinet`, `contact`, `favorites`, `listings`
- (plus any future static segment owner adds)

Locale-prefixed slugs MUST be rejected outright: `sq`, `en`, `uk`, `it`, `sq/about`, etc.

### Database — `pages` table

Confirmed via `scripts/schema-drift-check.sql` rows 254–260 + 568–574:

```
('pages', 'id'),
('pages', 'title'),         -- text
('pages', 'slug'),          -- text
('pages', 'content'),       -- jsonb
('pages', 'is_published'),  -- boolean
('pages', 'updated_by'),
('pages', 'updated_at'),
```

`src/types/database.ts:471-479` confirms the TS shape:

```ts
export interface Page {
  id: number
  title: string
  slug: string
  content: Record<string, unknown>
  is_published: boolean
  updated_by: string | null
  updated_at: string
}
```

**Critical limitation:** the table is **mono-locale**. `title` and `slug` are single text columns; `content` is a free JSONB blob currently used as `{body: '<html>'}` (per AdminLegalManager.tsx:29 + :39). There is no per-locale variant; all 4 locales would currently see the same content.

### Admin surfaces — `/admin/legal` vs `/admin/pages-admin`

**`/admin/legal/page.tsx`** (28 lines) — IS the de-facto manager for ALL `pages` table rows. Reads `db.from('pages')`. Uses `AdminLegalManager.tsx`. Translation namespace is `admin.pages` (sic — namespace already exists). The "legal" naming is misleading; the implementation handles any slug, not just legal-policy pages.

**`/admin/pages-admin/page.tsx`** (10 lines) — pure stub: `"Static page editor — coming soon."` No implementation, no admin sidebar entry.

**`AdminSidebar.tsx:70`** — only one nav entry exists: `{ href: '/admin/legal', label: t('item_legal'), icon: FileText }`. No `/admin/pages` or `/admin/pages-admin` entry.

**`AdminLegalManager.tsx`** is a full CRUD UI: PageModal (create/edit) + delete + publish/unpublish toggle + slug auto-generation from title + raw HTML body via `<Textarea>`. Translation namespace inside the component is `admin.legal` (different from the page-level `admin.pages` — drift). Server actions: `createPage`, `updatePage`, `deletePage` from `@/modules/admin/actions`.

### Footer source-of-truth (Task 247 / Task 302 architecture)

`site_footer` table (per Task 247): 12 columns including `nav_links`, `info_links`, `social_links` as JSONB arrays of `FooterLink` objects. FooterLink shape (`src/types/database.ts:490`): `{id, label, url, enabled, order}` (verified earlier).

`Footer.tsx` reads `getFooterContent(locale)` (Task 247 + 302 architecture); per-field + per-list fallback chain to i18n + hardcoded `<Link>` fallbacks. Internal links get `/${locale}` prefix added at render.

Task 324 (Sprint 25, pending Sonnet) adds client + server validation against an allowlist of static routes. It does NOT extend `pages` table, does NOT add a public renderer, does NOT add page creation from Footer. Task 326 is the strategic follow-up that completes the picture.

### Localization keys

`admin.pages` namespace EXISTS in all 4 locale files (used by `/admin/legal`'s page header). `admin.legal` namespace ALSO exists (used by `AdminLegalManager` modal). This naming drift is a pre-existing issue; Task 326A will need to consolidate or carefully extend.

### SEO / metadata

The project does not currently expose `generateMetadata` for `pages` content. Listing detail uses metadata; static pages do not. Task 326A can defer SEO metadata to Phase 2 (326C polish) unless the owner wants it baseline.

---

## Architecture decisions

### Decision 1 — Localization storage model: **Option A (JSONB-per-locale)**

Extend the existing `content` JSONB column to shape:
```json
{
  "sq": { "title": "...", "body": "..." },
  "en": { "title": "...", "body": "..." },
  "uk": { "title": "...", "body": "..." },
  "it": { "title": "...", "body": "..." }
}
```

Migrate the top-level `title` column to a per-locale value inside `content.<locale>.title` (or keep `title` as a `sq`-fallback default and add per-locale titles inside JSONB).

**Rationale:**
- Zero new tables; minimal schema migration (one JSONB shape change).
- Easy backfill: existing single-locale `title` + `content.body` get copied into `content.sq.title` + `content.sq.body`.
- `slug` stays single-column locale-agnostic (matches owner directive: "Slugs must be locale-agnostic").
- `is_published` stays single boolean (one published state per page; per-locale publication can be a future extension if owner needs).

**Rejected alternatives:**
- Option B (separate `page_translations` table) — more orthogonally correct but adds JOIN complexity + a new table + new RLS to design; over-engineering for the current need.
- Option C (reuse `content` as-is mono-locale) — fails owner requirement of 4-locale page content.

### Decision 2 — Admin route: **`/admin/pages`** (new), DEPRECATE `/admin/legal` (alias-or-redirect)

Rename / rebuild the CMS manager at the canonical `/admin/pages`. Strategy:
- Add `src/app/admin/pages/page.tsx` (NEW) + `AdminPagesManager.tsx` (NEW) as the canonical surface.
- Keep `/admin/legal/page.tsx` initially as a redirect to `/admin/pages` (server-side `redirect()`); document for removal in 326C.
- DELETE `/admin/pages-admin/page.tsx` stub (it has no users and no sidebar entry; safe to remove).
- Update `AdminSidebar.tsx`: replace `/admin/legal` sidebar item with `/admin/pages` + localize new label key `admin.sidebar.item_pages` in all 4 locales.

### Decision 3 — Public renderer: **`src/app/[locale]/[slug]/page.tsx`** (NEW)

Renders one published page by `params.slug` + `params.locale`. Behavior:
- Query `pages` table: `select * where slug = ? AND is_published = true`.
- 404 (`notFound()`) if no row OR row not published OR locale-specific content is empty.
- Render `content.<locale>.title` (with sq-fallback if locale-specific title is empty) + `content.<locale>.body` (HTML).
- Wrap in normal app layout (existing `[locale]/layout.tsx` chrome).
- Add `generateMetadata` reading `content.<locale>.title` (defer SEO meta_description to 326C).

**Route collision protection (server + client):**
- Slug validator MUST reject reserved segments: `auth`, `cabinet`, `contact`, `favorites`, `listings`, `sq`, `en`, `uk`, `it`.
- Slug validator MUST reject slugs containing `/` other than allowed sub-path patterns (default: forbid all `/`; slugs are flat).
- Slug validator MUST reject locale-prefixed slugs (`sq/about`, `en/...`).
- Server action `createPage` / `updatePage` MUST validate slug against the reserved list before insert; UI client validation mirrors for instant feedback.
- Reserved-slug list lives in a single canonical helper (e.g. `src/lib/reserved-slugs.ts`) shared between admin validator + Task 324 Footer link allowlist (eliminates drift).

### Decision 4 — Footer integration: 326B (Phase 2)

326A is FOUNDATIONAL — no Footer changes. 326B introduces:
- **Footer link URL field → "Create page" CTA** when admin types a non-existing slug. CTA opens `/admin/pages/new?slug=<slug>` with slug prefilled.
- **Footer link URL field → "Select existing page" Combobox** offering all published CMS page slugs + static routes. KEEP free-text input as fallback.
- **Task 324 Footer validation refresh** — after page is published, Footer save proceeds.
- **Delete/unpublish protection** — `/admin/pages` shows a "Used in Footer" indicator (computed by joining `site_footer.nav_links/info_links` against page slug); delete + unpublish require confirmation when used; toast warns about Footer reference.
- **Slug change protection** — if admin edits the slug of a page currently referenced by Footer, REQUIRE explicit confirmation; on confirm, EITHER block the change OR auto-update Footer references atomically. Default (owner-overridable): BLOCK the slug change until Footer reference is removed (safest).

### Decision 5 — Task split: **THREE Sonnet tasks (326A → 326B → 326C)**

Rationale: a single combined kickoff would touch 15+ files across DB + admin UI + public renderer + Footer + sidebar + locales — too large for safe review. Split:

| Sub-task | Scope | Dependencies |
|---|---|---|
| **326A** | CMS source-of-truth: extend `pages` JSONB shape + migration SQL; new `/admin/pages` route + AdminPagesManager (list + 4-locale editor + publish/draft + slug validation + reserved-slug helper); `/admin/legal` → redirect; delete `/admin/pages-admin`; sidebar entry; public renderer at `[locale]/[slug]`; baseline metadata. | None — foundational. Ships independently. |
| **326B** | Footer integration: Combobox "Select existing page" + "Create page" CTA in `AdminFooterManager`; Task 324 allowlist consumes published CMS slugs from canonical helper; delete/unpublish/slug-change protections in `/admin/pages` when used by Footer. | 326A + Task 324 must ship first. |
| **326C** | Polish / QA: usage indicator in `/admin/pages` list ("Used in Footer N×"); preview button (opens public page in new tab); full 7-breakpoint × 4-locale audit; SEO metadata extension; sidebar deduplication audit; old `/admin/legal` removal (replace redirect with 410 or delete the file). | 326A + 326B ship first. |

### Decision 6 — Schema migration approach: **single owner-run SQL**

`scripts/task-326-pages-locale-jsonb.sql` (NEW; owner runs in Supabase SQL editor):
```sql
-- 1. Backfill existing single-locale rows into new JSONB shape (safe: stores both old top-level + new nested)
UPDATE pages
SET content = jsonb_build_object(
  'sq', jsonb_build_object('title', title, 'body', COALESCE(content->>'body', '')),
  'en', jsonb_build_object('title', '', 'body', ''),
  'uk', jsonb_build_object('title', '', 'body', ''),
  'it', jsonb_build_object('title', '', 'body', '')
)
WHERE NOT (content ? 'sq' AND content ? 'en' AND content ? 'uk' AND content ? 'it');

-- 2. Update schema-drift-check.sql to expect content as the canonical shape; no column add/drop.
```

No new columns; no new tables; no RLS change. The `title` column stays as a legacy fallback / search-friendly field (write it from `content.sq.title` on save).

### Decision 7 — RLS / security

- Admin mutations (`createPage`, `updatePage`, `deletePage`) STAY server-side via `createAdminClient()` (existing pattern in `/admin/legal`).
- Public renderer at `[locale]/[slug]` uses anon Supabase client with RLS allowing SELECT only when `is_published = true`. Verify existing `pages` RLS posture; if it currently allows broader SELECT, tighten.
- No service-role exposure on public path.
- No new RLS policies unless investigation in 326A shows the current `pages` RLS is missing or broken.

---

## STOP & ASK results (already resolved)

| Concern | Resolution |
|---|---|
| Existing `pages` table conflicts with CMS model | NO — JSONB-per-locale extension fits cleanly into existing `content` column. |
| `/admin/legal` is intended as universal pages manager | YES — already de-facto. Renaming to `/admin/pages` is the canonical fix. |
| Public `[locale]/[slug]` collides with existing routes | Only if slug = `auth` / `cabinet` / `contact` / `favorites` / `listings`. Reserved-slug helper enforces. |
| DB migration has multiple safe patterns | Decision 6 picks one (JSONB reshape, no new columns/tables). |
| `/admin/pages-admin` stub has planned scope | NO — pure placeholder; safe to delete in 326A. |
| Route collision policy unclear | Decision 3 specifies reserved-slug list shared with Task 324 via single helper. |
| Page deletion/unpublish has multiple safe options | Decision 4 picks BLOCK + explicit confirmation; documented as safest default. |
| Implementation too large for one Sonnet task | YES — split into 326A/B/C (Decision 5). |

---

## Risks + dependency order

1. **326A must ship + owner must run migration SQL** before 326B can validate Footer links against CMS slugs.
2. **Task 324 (Sprint 25)** ships in parallel; 326B's "select existing page" picker requires Task 324's validation infrastructure. Run order: Sprint 25 → 326A → 326B → 326C.
3. **Existing `/admin/legal` users (owner workflows)** must not lose data during 326A migration. The SQL is non-destructive (backfills new JSONB shape; legacy `title` + `content.body` preserved); the legacy admin route redirects, not 404s, during transition.
4. **Slug change while Footer references it** — Decision 4 default is BLOCK. If owner prefers auto-update, route as STOP & ASK in 326B kickoff.
5. **`generateMetadata` for public CMS pages** — deferred to 326C to keep 326A scope small. Risk: published pages have no SEO metadata for a short window; acceptable.

---

## Files produced by this planning task

| Path | Change | Rationale |
|---|---|---|
| `docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md` | NEW (this file) | Opus planning session log |
| `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326A.md` | NEW | Sonnet kickoff: CMS source-of-truth + public renderer |
| `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326B.md` | NEW | Sonnet kickoff: Footer integration |
| `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326C.md` | NEW | Sonnet kickoff: Polish + QA + cleanup |
| `tasks/Sprints/Sprint_27_—_Admin_CMS_Pages_and_Footer_Page_Flow.md` | NEW | Sprint plan |
| `docs/backlog.md` | UPDATE | Counter bump, Sprint 27 entry, next-immediate-tasks refresh |

**Confirmation: NO product code, NO locale files, NO DB migration files, NO RLS policies touched by Opus in this planning task.** All deliverables are documentation + Sonnet kickoff prompts under `tasks/Sprints/`.

---

## Validation (Opus-side)

| Check | Result |
|---|---|
| `git status --short` lists only docs + tasks files | Verified at session close (see backlog commit policy) |
| No `src/` file modified | Confirmed by file tool history |
| No `messages/*.json` file modified | Confirmed |
| No DB migration script modified | Confirmed |
| 326A/B/C kickoff files exist | Confirmed (created by this session) |
| Sprint 27 plan file exists | Confirmed |
| `docs/backlog.md` updated to reference Task 326 + Sprint 27 | Confirmed (see backlog edit log) |
| Generated kickoffs reference `/admin/pages` | Confirmed |
| Generated kickoffs reference `sq/en/uk/it` | Confirmed |
| Generated kickoffs reference `320/375/390/768/1280/1440/2560` | Confirmed |
| Generated kickoffs reference "Footer is not the source of truth" | Confirmed |
| Generated kickoffs reference "route collision" | Confirmed |
| Generated kickoffs reference "draft" / "published" | Confirmed |
| Generated kickoffs reference "Used in Footer" | Confirmed |
| Generated kickoffs reference "Create page" / "Select existing page" | Confirmed |

## Verdict

`Self-validation: planning-only · NO product code · NO locale files · NO DB/RLS · 3 Sonnet kickoffs shipped (326A/B/C) · Sprint 27 formed · architecture decisions encoded (7 decisions) · STOP & ASK results documented · run order Sprint 25 → 326A → 326B → 326C · PASS`
