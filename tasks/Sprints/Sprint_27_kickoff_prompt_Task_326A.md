# Sprint 27 — Task 326A kickoff (Admin CMS pages source-of-truth + per-locale content + `/admin/pages` rebuild + public `[locale]/[slug]` renderer)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **foundational CMS feature** — schema reshape (JSONB only, no new columns/tables) + new admin section + new public renderer + sidebar update + 4-locale parity. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/component-rules.md`, `docs/ui-rules.md`, `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/qa-rules.md`, `docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md` (Opus architecture decisions — MANDATORY), `docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md`, `tasks/Sprints/Sprint_21_kickoff_prompt_Task_302.md` (Footer source-of-truth precedent). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 326A is the first sub-task in Sprint 27. Owner-assigned (rev'd from 325 to 326 — Task 325 already occupied by Sprint 26 Turbopack chore). Foundational; 326B + 326C blocked until 326A ships + owner runs migration SQL.

---

```
Type:        feature + schema reshape + new admin route + new public route (large-but-bounded)
Priority:    HIGH (unblocks Task 324 Footer link validation real-world utility — Footer can finally point at real published pages)
Area:        admin/pages — pages table content JSONB shape — public [locale]/[slug] renderer — admin sidebar
```

## Architecture rule (preserve verbatim)

**Footer is not the source of truth for page content.** Pages live in the canonical `pages` table managed at `/admin/pages`; Footer only references published pages by slug. This task builds the source of truth + the public renderer + reserved-slug / route-collision protection. Footer integration is Task 326B; Sonnet MUST NOT touch Footer files in 326A.

## Why this task exists

Opus planning session (`docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md`) identified:

1. **`pages` table exists but is mono-locale** — `title` (text) + `content` (JSONB, currently shape `{body: '<html>'}`) — does NOT support sq/en/uk/it page content.
2. **`/admin/legal`** is the de-facto pages manager but mis-named; reads all `pages` rows.
3. **`/admin/pages-admin`** is a stub ("coming soon"); no users; safe to delete.
4. **No public `[locale]/[slug]` renderer** — `/about`, `/privacy-policy`, `/terms-of-service` etc. unconditionally 404. Task 324 Footer validation guards Footer-side input but cannot make these slugs work without a renderer.
5. **Admin sidebar** has only `/admin/legal`.

Task 326A delivers the foundation:
- Extend `pages.content` to per-locale JSONB (no new columns/tables — Opus Decision 1).
- Build canonical `/admin/pages` admin section with 4-locale list + editor + draft/published lifecycle + slug validation + reserved-slug helper (Decision 2).
- Build public `src/app/[locale]/[slug]/page.tsx` renderer (Decision 3) with notFound + locale-content fallback + reserved-slug protection (Decision 3 + 7).
- Rebuild sidebar with `/admin/pages`; redirect `/admin/legal` → `/admin/pages`; delete `/admin/pages-admin` stub.
- Provide owner-run migration SQL `scripts/task-326-pages-locale-jsonb.sql` (Decision 6) — non-destructive backfill.

326B + 326C are SEPARATE follow-up sub-tasks (Footer integration + polish). DO NOT touch Footer in 326A.

## Current behavior to preserve (Notes 19 + 20 + 22 + 23)

Inventory in session log BEFORE editing:

**`/admin/legal` surface (will become `/admin/pages`):**
- Page header (`admin.pages.legal_title` + `legal_subtitle`)
- Page list: title, slug, is_published badge, updated_at, row actions (edit / delete / publish-toggle)
- Create modal: title (auto-generates slug), slug (editable), content body (Textarea, raw HTML), publish/draft toggle, save / cancel
- Edit modal: same fields prefilled
- Delete confirmation
- Empty / loading / error states

**EVERY one of the above MUST remain reachable** in the new `/admin/pages` surface. Adding 4 locale tabs to the editor is the only structural change to the modal; deleting a control is forbidden.

**`/admin/pages-admin` surface:** stub only ("coming soon"); no users; no sidebar entry. Delete is safe; document in session log.

**`AdminSidebar.tsx`:**
- Existing entry `{ href: '/admin/legal', label: t('item_legal'), icon: FileText }` → REPLACE with `{ href: '/admin/pages', label: t('item_pages'), icon: FileText }`.
- New locale key `admin.sidebar.item_pages` in all 4 files.
- `admin.sidebar.item_legal` key may be RETAINED for the locale fallback during the redirect transition period; document in session log.

**`pages` table data:** existing rows MUST migrate cleanly. The SQL backfill (Decision 6) preserves the legacy `title` + `content.body` by copying them into `content.sq.title` + `content.sq.body`; en/uk/it start empty (admin fills later). Existing public-facing fallbacks (i.e. owner reading `/admin/legal`) MUST continue to show the original content for the `sq` locale on first load.

## Positive flow (happy path)

As an admin at `uk` locale, viewport 1280px:

### Admin side
1. Click "Pages" in admin sidebar (`/uk/admin/pages`) → list renders 4 columns: slug, title preview (sq fallback), status badge (Published / Draft), updated_at.
2. Click "+ New page" → editor modal opens with 4 locale tabs (sq / en / uk / it), one Title + one Body field per tab, plus shared Slug + Published toggle.
3. Fill all 4 locales' Title + Body; type slug `about-us`; toggle Published OFF (draft); click Save → success toast → modal closes → list refreshes → row appears with Draft badge.
4. Re-open the row → edit → toggle Published ON → save → row badge becomes Published.
5. Click "Preview" link (opens `/uk/about-us` in new tab) → public page renders with Ukrainian title + body inside normal app layout.
6. Switch admin locale to `sq` → list refreshes with Albanian title preview; row click opens editor with Albanian tab pre-active.
7. Edit slug `about-us` → enter reserved slug `auth` → inline validation error appears; Save blocked.
8. Repeat with `sq/about` → same blocked.
9. Edit slug back to `about-us` → Save succeeds.
10. Click Delete on a Draft row → confirmation dialog → confirm → row removed.

### Public side
1. As anon visitor, navigate to `/uk/about-us` → page renders with Ukrainian content + app shell.
2. Navigate to `/sq/about-us` → Albanian content.
3. Navigate to `/uk/about-us` for a Draft page → 404 (notFound).
4. Navigate to `/uk/nonexistent` → 404.
5. Navigate to `/uk/auth` → existing auth route still works (reserved slug never routes to CMS).
6. Navigate to `/uk/listings` → existing listings route still works.

### Migration runtime (owner action)
1. Owner runs `scripts/task-326-pages-locale-jsonb.sql` in Supabase SQL editor → existing rows' content reshapes to `{sq:{title,body}, en:{title:'',body:''}, uk:..., it:...}` for `sq` only; en/uk/it are empty placeholders.
2. Admin opens `/uk/admin/pages` → existing rows render with the legacy title in the sq tab; en/uk/it tabs are empty and admin can fill them.
3. Public `/sq/<legacy-slug>` continues to render the legacy content; `/en/<legacy-slug>` shows the same content via sq-fallback (see Decision 3) OR returns 404 if locale-specific content is empty AND fallback is disabled — STOP & ASK on this policy below.

## Negative flow (every off-happy-path branch)

- **Reserved slug** (`auth`, `cabinet`, `contact`, `favorites`, `listings`, `sq`, `en`, `uk`, `it`) → client + server reject; localized toast; no DB write.
- **Locale-prefixed slug** (`sq/about`, `/en/foo`, `uk/`) → reject (slugs are flat + locale-agnostic).
- **Slug containing `/`** → reject (flat slugs only).
- **Slug with uppercase / spaces / non-ASCII** → auto-lowercase + replace spaces with `-` + strip non-`[a-z0-9-]` (existing `toSlug` helper preserved).
- **Duplicate slug** — INSERT must use `ON CONFLICT (slug) DO NOTHING` server-side OR pre-check; admin gets `slug_already_used` localized toast.
- **Empty content for a locale** — allowed at draft stage; warning shown in editor that this locale will fallback to sq on the public site (or 404 if Decision 3 STOP & ASK chooses no-fallback).
- **Publish with at least one locale empty** — STOP & ASK on policy: allow publish (with sq-fallback for empty locales) OR block publish until all 4 filled. Default recommendation: ALLOW publish + sq-fallback (matches Footer.tsx fallback pattern).
- **Delete a Published page** — confirmation dialog with extra warning; 326A does NOT yet check Footer references (that's 326B).
- **Public page with empty locale content** — Decision 3 fallback policy applies (sq-fallback OR 404). STOP & ASK.
- **Migration not yet applied** — admin UI must DETECT old shape (`content.body` exists, `content.sq` does NOT) and either auto-migrate per-row on edit OR show a "Migration pending" banner. Recommended: detect + show banner + block edits until owner runs SQL.
- **Slug change** — 326A allows slug change for any page (326B adds Footer-reference protection). In 326A, simply update + warn admin "URLs for this page change".
- **Server error on save** — existing toast pattern (`save_error`); no partial write; transactional INSERT/UPDATE.
- **Old `/admin/legal` URL accessed** — server-side `redirect('/admin/pages')` (308 permanent). Sidebar item already updated.
- **Old `/admin/pages-admin` URL accessed** — file deleted → 404 (acceptable; no users; document in session log).

## Required investigation (PASTE in session log BEFORE writing code)

```
# 1. Confirm pages table schema + data
grep -n "'pages'," scripts/schema-drift-check.sql | head -20
# Owner-runnable in Supabase:
#   SELECT id, slug, title, is_published, jsonb_pretty(content) FROM pages ORDER BY updated_at DESC LIMIT 5;

# 2. Confirm current AdminLegalManager + actions
sed -n '1,120p' src/components/admin/AdminLegalManager.tsx
grep -n 'createPage\|updatePage\|deletePage' src/modules/admin/actions/index.ts

# 3. Confirm admin sidebar
grep -n 'admin/legal\|item_legal\|item_pages' src/components/admin/AdminSidebar.tsx messages/sq.json messages/en.json messages/uk.json messages/it.json

# 4. Static route inventory (for reserved-slug list)
find 'src/app/[locale]' -name 'page.tsx' -not -path '*node_modules*'

# 5. Existing admin.legal + admin.pages locale keys
python3 -c "
import json
for loc in ['sq','en','uk','it']:
    with open(f'messages/{loc}.json') as f: data = json.load(f)
    print(f'== {loc} ==')
    print('  admin.legal keys:', sorted((data.get('admin', {}).get('legal', {}) or {}).keys())[:25])
    print('  admin.pages keys:', sorted((data.get('admin', {}).get('pages', {}) or {}).keys())[:25])
    print('  admin.sidebar.item_legal:', data.get('admin', {}).get('sidebar', {}).get('item_legal', '<<MISSING>>'))
"

# 6. RLS posture on pages table (owner-runnable in Supabase):
#   SELECT polname, polcmd, polqual FROM pg_policies WHERE schemaname='public' AND tablename='pages';

# 7. Existing public route precedent for slug-based rendering (listings/[slug] is closest)
sed -n '1,40p' src/app/\[locale\]/listings/\[slug\]/page.tsx

# 8. Confirm canonical Combobox / Tabs / Dialog primitives available
ls src/components/ui/tabs.tsx src/components/ui/dialog.tsx src/components/ui/combobox.tsx
```

After investigation, paste:
- pages table existing-row count + sample of legacy `content` shape.
- Current `admin.legal` vs `admin.pages` locale-key drift inventory.
- Sidebar nav entry verbatim.
- Confirmed static route list (input for reserved-slug helper).
- Existing pages RLS policies.

## STOP & ASK before writing code

1. **Empty-locale publish policy** — allow publish with sq-fallback for empty locales OR block publish? (Recommend: ALLOW + sq-fallback; matches Footer.tsx pattern.)
2. **Public-renderer empty-locale fallback** — render sq content if requested locale is empty OR return 404? (Recommend: sq-fallback at render; admin clearly sees the empty locale tab to fill.)
3. **Migration-pending detection** — show admin banner + block edits OR auto-migrate per-row on edit? (Recommend: banner + block; owner runs SQL once, then unblocked.)
4. **Sidebar key migration** — keep `admin.sidebar.item_legal` key in locale files OR remove and add new `item_pages`? (Recommend: ADD `item_pages`, KEEP `item_legal` for one release cycle; remove in 326C.)
5. **`admin.legal` vs `admin.pages` namespace** — consolidate now (rename modal keys) OR leave drift for 326C? (Recommend: leave drift; rename in 326C.)

## Scope (files Sonnet may touch)

- `scripts/task-326-pages-locale-jsonb.sql` (NEW) — owner-run migration: non-destructive JSONB reshape per Decision 6.
- `scripts/schema-drift-check.sql` (EXTEND) — document the canonical `content` JSONB shape comment; columns unchanged (no add/drop).
- `src/types/database.ts` — extend `Page.content` shape from `Record<string, unknown>` to a concrete `PageContent = { sq: PageLocaleContent; en: ...; uk: ...; it: ... }` type with `PageLocaleContent = { title: string; body: string }`.
- `src/app/admin/pages/page.tsx` (NEW) — server component reading `pages` table; admin-auth gate; renders `AdminPagesManager`.
- `src/app/admin/legal/page.tsx` — REPLACE with `redirect('/admin/pages')` (server-side `next/navigation` redirect).
- `src/app/admin/pages-admin/page.tsx` — DELETE the file.
- `src/components/admin/AdminPagesManager.tsx` (NEW) — list + editor with 4 locale tabs, shared slug/published, save/cancel/delete, modal + table; reuses canonical `<Button>`, `<Dialog>`, `<Tabs>`, `<Textarea>`, `<Input>`/`<AdminInput>`, `<Badge>`. NO new primitive.
- `src/components/admin/AdminSidebar.tsx` — replace `/admin/legal` entry with `/admin/pages`.
- `src/lib/reserved-slugs.ts` (NEW) — canonical reserved-slug helper exporting `RESERVED_SLUGS: readonly string[]` + `isReservedSlug(slug): boolean` + `LOCALE_CODES: readonly string[]`. Shared with Task 324 Footer validator (replace any duplication if Task 324 has already shipped a copy).
- `src/lib/slug-validator.ts` (NEW or extend if exists) — `validateSlug(slug): {ok: true} | {ok: false; reason: string}` using the reserved helper + format rules (flat, lowercase, `[a-z0-9-]`).
- `src/modules/admin/actions/index.ts` (EDIT `createPage` + `updatePage`) — extend signatures to accept `PageContent` (4-locale shape); server-validate slug via helper; return localized error codes (`slug_reserved`, `slug_invalid_format`, `slug_already_used`, `page_locale_required` if applicable).
- `src/app/[locale]/[slug]/page.tsx` (NEW) — public renderer: load `pages.findOne({slug, is_published: true})`; if missing OR slug is reserved → `notFound()`; render `content[locale].title || content.sq.title` + `content[locale].body || content.sq.body`; baseline `generateMetadata` (`title` only — SEO meta_description deferred to 326C).
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — add the new keys (see Localization section).
- `docs/sessions/2026-05-30-task-326A-admin-pages-foundation.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)
- OPTIONAL: `docs/component-rules.md` or `docs/data-access-rules.md` — 1-paragraph addition documenting the canonical reserved-slug helper for future reuse.

**MUST NOT touch:**
- `src/components/admin/AdminFooterManager.tsx` — 326B territory
- `src/components/layout/Footer.tsx` — frozen (Task 247 + 302)
- `scripts/task-302-site-footer-backfill.sql` — frozen
- `src/modules/admin/actions/footer.ts` — 326B territory (except if Task 324 already extended it and 326A's reserved-slug helper replaces a local duplicate; STOP & ASK)
- Any Sprint 21-26 file
- Any other admin component
- RLS policies beyond confirming current pages RLS is correct (no policy changes in 326A unless a critical gap exists; STOP & ASK)
- Listings / favorites / cabinet / auth / contact public routes
- DB schema column add/drop (only JSONB reshape via owner SQL)

Maximum SOURCE-FILE delta: **~10 source files** (admin/pages page, AdminPagesManager, sidebar, redirect for legal, delete pages-admin, reserved-slugs helper, slug-validator, actions edit, types edit, public [locale]/[slug] page) + 4 locale JSONs + 2 SQL files + 2 docs. If more, STOP & ASK.

## Localization (sq/en/uk/it parity)

New keys under `admin.pages` (extend; do NOT touch `admin.legal` in 326A — leave for 326C):

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `title` | Faqe CMS | CMS pages | CMS-сторінки | Pagine CMS |
| `subtitle` | Menaxho faqet publike të faqes | Manage public site pages | Керування публічними сторінками сайту | Gestisci le pagine pubbliche del sito |
| `btn_new` | + Faqe e re | + New page | + Нова сторінка | + Nuova pagina |
| `col_slug` | Slug | Slug | Slug | Slug |
| `col_title` | Titulli | Title | Заголовок | Titolo |
| `col_status` | Statusi | Status | Статус | Stato |
| `col_updated` | Përditësuar | Updated | Оновлено | Aggiornato |
| `status_draft` | Draft | Draft | Чернетка | Bozza |
| `status_published` | Publikuar | Published | Опубліковано | Pubblicato |
| `editor_locale_sq` | Shqip | Albanian | Албанська | Albanese |
| `editor_locale_en` | Anglisht | English | Англійська | Inglese |
| `editor_locale_uk` | Ukrainisht | Ukrainian | Українська | Ucraino |
| `editor_locale_it` | Italisht | Italian | Італійська | Italiano |
| `field_title_label` | Titulli | Title | Заголовок | Titolo |
| `field_body_label` | Përmbajtja | Content | Контент | Contenuto |
| `slug_reserved` | Slug i rezervuar — nuk mund të përdoret | Reserved slug — cannot be used | Зарезервований slug — не можна використати | Slug riservato — non utilizzabile |
| `slug_invalid_format` | Format i pavlefshëm i slug-ut | Invalid slug format | Невірний формат slug | Formato slug non valido |
| `slug_already_used` | Slug-u është i përdorur tashmë | Slug already used | Slug вже використовується | Slug già utilizzato |
| `empty_locale_warning` | Kjo lokale është bosh — do të përdoret përmbajtja Shqip si fallback | This locale is empty — Albanian content will be used as fallback | Ця локаль порожня — буде використано албанський контент як fallback | Questa lingua è vuota — verrà usato il contenuto albanese come fallback |
| `migration_pending_banner` | Migrim i pa-aplikuar — kontaktoni administratorin | Migration pending — contact admin | Міграція не застосована — зверніться до адміністратора | Migrazione in sospeso — contatta l'admin |
| `delete_confirm` | A jeni i sigurt që doni ta fshini këtë faqe? | Are you sure you want to delete this page? | Ви впевнені, що хочете видалити цю сторінку? | Sei sicuro di voler eliminare questa pagina? |
| `preview_open` | Hap pamjen | Open preview | Відкрити перегляд | Apri anteprima |

Plus `admin.sidebar.item_pages`:
- sq: `Faqe`
- en: `Pages`
- uk: `Сторінки`
- it: `Pagine`

Total: 22 keys under `admin.pages` + 1 under `admin.sidebar` = **23 keys × 4 locales = 92 string additions**.

If Sonnet disagrees with any label, STOP & ASK before editing — do not silently substitute.

## Responsive coverage (all 7 breakpoints — owner directive)

Verify in running app at all of: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 in `uk` locale (longest labels). Specifically:
- `/admin/pages` list — table or card-row layout per Epic HH Decision 1 (Hybrid; Task 303 will codify per-route; 326A may use either pattern but must be readable + actionable at 320).
- Editor modal with 4 locale tabs — tabs do not clip; tab content scrolls if too tall; Save + Cancel buttons reachable at 320 with 44px touch targets.
- Public `/uk/<slug>` page — content readable at 320; no horizontal scroll; localized titles wrap.
- Repeat editor + public spot-check at `sq` / `en` / `it`.

## Security / RLS

- Admin mutations server-side via `createAdminClient()` (existing pattern in `/admin/legal`).
- Public renderer uses anon Supabase client; `pages` RLS MUST allow SELECT only when `is_published = true`. CONFIRM current policy in investigation; if it grants broader SELECT, propose tightening + STOP & ASK.
- No service-role on public path.
- `is_published = false` rows MUST NOT be exposed publicly even via direct slug navigation.
- Admin auth: existing `getAdminLocale()` / `assertAdminUser()` pattern (used in `/admin/legal`).

## Acceptance criteria (literal)

- `pages.content` JSONB shape is per-locale `{sq:{title,body}, en:{...}, uk:{...}, it:{...}}` after `scripts/task-326-pages-locale-jsonb.sql` runs; legacy rows backfilled non-destructively.
- `src/types/database.ts` `Page.content` is typed as `PageContent` with concrete per-locale shape.
- `/admin/pages` route + sidebar entry exist; list + editor + delete/publish-toggle all work; 4 locale tabs in editor render with localized labels.
- `/admin/legal` server-redirects to `/admin/pages` (308).
- `/admin/pages-admin` file deleted.
- `AdminSidebar.tsx` shows the new "Pages" entry in all 4 locales.
- `src/app/[locale]/[slug]/page.tsx` public renderer exists; resolves published pages by slug + locale; 404s on missing/draft/reserved.
- `src/lib/reserved-slugs.ts` is the canonical single source of reserved slugs; `src/lib/slug-validator.ts` enforces format + reserved checks; server actions validate before INSERT/UPDATE.
- Existing legacy pages render at `/sq/<legacy-slug>` immediately after owner runs migration SQL; en/uk/it fallback to sq if those locales are empty (per Decision 3 STOP & ASK answer).
- All 23 new locale keys present in all 4 files with parity; `npm run check:i18n` passes.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → 0/0 (Task 295 baseline preserved).
- `npm run governance:tailwind` → C0/H0/M0.
- All 7 breakpoints verified for admin editor + public renderer in `uk`; spot-check sq / en / it.
- All existing `/admin/legal` controls preserved (list / create / edit / delete / publish toggle) — Note 22 inventory + after-state in session log.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · admin/pages list + 4-loc editor PASS sq/en/uk/it · public [locale]/[slug] PASS · /admin/legal redirect PASS · /admin/pages-admin removed · sidebar updated · reserved-slug helper canonical · 7 breakpoints PASS · existing controls preserved · scope=clean · owner-SQL PENDING · PASS`.

## Out of scope (deferred to 326B / 326C / future)

- Footer integration ("Create page" CTA + "Select existing page" picker) → 326B.
- Usage indicator on `/admin/pages` ("Used in Footer N×") → 326C.
- Delete/unpublish/slug-change protection when used by Footer → 326B.
- SEO `meta_description` per-locale + canonical/alternates → 326C.
- Old `/admin/legal` redirect removal + 410 → 326C.
- `admin.legal` namespace consolidation/rename → 326C.
- Page archiving (archived status) — defer unless owner asks.
- Page revision history.
- Page preview-as-draft (preview a draft page server-side).
- Image upload / media management.
- Markdown / WYSIWYG editor — body remains raw HTML Textarea (matches existing `/admin/legal` pattern).
- Sitemap.xml generation.

## STOP & ASK conditions (must resolve before completing)

1. Empty-locale publish policy (allow + sq-fallback vs. block).
2. Public-renderer empty-locale fallback (sq-fallback vs. 404).
3. Migration-pending detection (banner-block vs. auto-migrate).
4. Sidebar key migration (keep `item_legal` for one cycle vs. remove now).
5. `admin.legal` vs `admin.pages` namespace consolidation timing (now vs. 326C).
6. `pages` RLS policy if missing or broader-than-required.
7. If any existing static route segment is missing from the reserved-slug list (investigation must produce the canonical list).

## Final report required

1. Files Changed table.
2. Migration SQL verbatim + verification SELECT.
3. Reserved-slug list inventory.
4. Note 22 inventory: `/admin/legal` before-state + `/admin/pages` after-state (every control preserved).
5. Editor 4-tab screenshot or DOM narrative at 320 in `uk`.
6. Public renderer 4-locale spot-check.
7. Sidebar update + redirect verification.
8. Locale key parity check output.
9. Validation commands + results.
10. AC self-audit table.
11. STOP & ASK transcript + resolutions.
12. Confirmation `Footer.tsx` / `AdminFooterManager.tsx` / Task 302 SQL untouched.

Do NOT emit git commands. Do NOT run git. Do NOT run SQL. STOP & ASK on the 5 listed design points BEFORE editing code.
