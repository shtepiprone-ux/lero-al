# Sprint 27 — Task 326B kickoff (Footer integration with CMS pages: create-page flow + select-existing-page picker + delete/unpublish/slug-change protection)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **Footer ↔ CMS integration** sub-task. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/component-rules.md`, `docs/ui-rules.md` (§0 Combobox-only), `docs/data-access-rules.md`, `docs/qa-rules.md`, `docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md` (Opus architecture — MANDATORY), `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326A.md` (DEPENDENCY — 326A must ship + owner must run migration first), `tasks/Sprints/Sprint_25_kickoff_prompt_Task_324.md` + `docs/sessions/2026-05-30-task-324-footer-internal-link-validation.md` (DEPENDENCY — Task 324 Footer validation infrastructure). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 326B is the second sub-task in Sprint 27. **BLOCKED until 326A ships + owner runs `scripts/task-326-pages-locale-jsonb.sql` + Task 324 ships.** Verify all three before starting.

---

```
Type:        feature (Footer ↔ CMS integration; UX + workflow guards)
Priority:    HIGH (closes the original "/test → 404" product gap by giving admins a real create-page flow + select-page picker)
Area:        admin/footer — admin/pages — server actions (footer + pages cross-validation)
```

## Architecture rule (preserve verbatim)

**Footer is not the source of truth for page content.** Pages live in the canonical `pages` table (326A); Footer only references published pages by slug. This task adds Footer-side UX (Create-page CTA + Select-existing-page picker) + cross-validation (Footer save blocked when slug is not a published CMS page; CMS delete/unpublish/slug-change blocked when used by Footer). Route-collision protection is inherited from 326A's reserved-slug helper; Sonnet MUST NOT duplicate or re-implement that helper.

## Why this task exists

326A delivered the CMS source-of-truth (`pages` table per-locale + `/admin/pages` + public `[locale]/[slug]` renderer + reserved-slug helper).

Task 324 delivered Footer link allowlist validation against STATIC routes only.

326B closes the loop:
1. **Footer link URL field** → if admin enters a non-existing internal slug AND not a reserved static route, surface a "Create page" CTA → opens `/admin/pages/new?slug=<slug>` with the slug prefilled. Admin creates + publishes the page → returns to Footer editor → save succeeds.
2. **Footer link URL field** → "Select existing page" canonical `Combobox` listing published CMS pages + the static-route list. Admin picks → URL field auto-fills. Free-text input remains.
3. **Task 324 allowlist** → extend `src/lib/footer-route-allowlist.ts` (or successor) to ALSO include published CMS page slugs (read from `pages` table at server-validation time). Reserved-slug helper from 326A is the single source.
4. **`/admin/pages` row** → if a page is referenced by `site_footer.nav_links` / `info_links`, mark it "Used in Footer" (Badge or column); BLOCK delete + BLOCK unpublish + BLOCK slug change while referenced unless admin confirms a destructive override (orchestrator default = BLOCK with no override; STOP & ASK if owner wants softer behavior).

## Current behavior to preserve (Notes 19 + 20 + 21 + 23)

326A delivered:
- `pages` table per-locale JSONB shape (post-migration)
- `/admin/pages` list + 4-locale editor
- public `[locale]/[slug]` renderer
- `src/lib/reserved-slugs.ts` + `slug-validator.ts`
- `AdminSidebar` entry `/admin/pages`
- redirect `/admin/legal` → `/admin/pages`

Task 324 (separately) delivered:
- `AdminFooterManager.tsx` inline warning per invalid internal link
- save-block on invalid internal links
- server-side `validateInternalLinkPath` in `actions/footer.ts`
- `src/lib/footer-route-allowlist.ts` helper

**EVERY existing control / behavior from 326A + 324 must remain** after 326B. New additions only:
- Footer editor: "Create page" CTA next to invalid-internal-link warning.
- Footer editor: "Select existing page" Combobox button + dropdown.
- `/admin/pages` row: "Used in Footer" Badge + count.
- `/admin/pages` editor: block delete/unpublish/slug-change with localized message when used by Footer.

Inventory in session log BEFORE editing:
- AdminFooterManager link-row layout (URL input + label input + enabled toggle + delete button + Task 324 warning).
- AdminPagesManager (326A) list-row layout + editor modal + delete confirmation flow.
- Server action `upsertFooterContent` validation path (Task 324 added `validateInternalLinkPath`).
- Server actions `updatePage` + `deletePage` (326A or pre-existing).

## Positive flow (happy path)

### Footer side — create new page from Footer
As an admin at `uk` locale, viewport 1280px:
1. `/uk/admin/footer` → add nav_link: label="Про нас", url="/about" → if `/about` is NOT a published CMS page AND NOT a static route → Task 324 warning appears + new "Створити сторінку" CTA appears.
2. Click "Створити сторінку" → opens `/uk/admin/pages/new?slug=about` in same tab (or new tab — STOP & ASK).
3. `/admin/pages/new` opens editor modal with slug "about" prefilled; admin fills 4 locales' title + body; toggles Published ON; saves.
4. Admin returns to `/uk/admin/footer` (back button or close-modal-redirect — STOP & ASK).
5. Footer editor re-validates → "/about" now passes (server query confirms `pages.slug='about' AND is_published=true`) → warning disappears → save succeeds.
6. Public `/uk/about` renders with Ukrainian content.

### Footer side — select existing page
1. `/uk/admin/footer` → click "Виберіть існуючу сторінку" Combobox button next to URL input.
2. Dropdown opens listing: static routes (`/`, `/listings`, `/listings/create`, `/contact`, `/favorites`) + all published CMS page slugs (e.g. `/about`, `/about-us`, `/team`).
3. Pick `/about` → URL input auto-fills → warning never appears → save succeeds.

### Pages side — protection while used by Footer
1. `/uk/admin/pages` → row "about" shows Badge "Used in Footer" + count (e.g. "×2" if appears in both nav_links + info_links).
2. Click delete on "about" row → confirmation dialog: "Cannot delete: page is used in Footer ×2. Remove the Footer references first." → delete blocked.
3. Open editor for "about" → toggle Published OFF → server error: "Cannot unpublish: page is used in Footer ×2." → toggle reverts → toast surfaces error.
4. Change slug "about" → "about-us" → server error: "Cannot change slug: page is used in Footer ×2. Update Footer links first." → save blocked.
5. Remove the Footer references in `/admin/footer` → return to `/admin/pages` → "Used in Footer" badge disappears → delete/unpublish/slug-change now allowed.

## Negative flow

- **Page exists but draft** → Footer save BLOCKED with warning "Page is draft — publish it before linking from Footer."
- **Slug exists in reserved list AND admin types it in Footer** → Task 324 warning still fires (reserved slugs never resolve as CMS pages anyway).
- **Footer link "Create page" CTA clicked but page already exists** (race condition) → server returns `slug_already_used` → CTA pivots to "Edit existing page" link.
- **Footer reference exists for unpublished page** (data anomaly from before 326B shipped) → admin sees inline warning in Footer editor + page row shows "Used in Footer (draft target!)" extra-warning Badge.
- **Bulk Footer-link references** (page used in multiple Footer rows) → `/admin/pages` Used-in-Footer count is total; clicking the Badge opens a modal listing every Footer reference with deep-links to `/admin/footer` rows.
- **Concurrent edit** (admin A unpublishes a page while admin B is mid-Footer-save) → server-side `validateInternalLinkPath` re-checks at write time → admin B's save rejected with localized error.
- **Reserved slug taken** (`auth`, `cabinet`, etc.) — slug-validator (326A) already blocks at /admin/pages; nothing extra in 326B.
- **Combobox dropdown overflow at 320** — canonical Combobox handles; verify per Task 305 spec when it ships, but 326B uses existing Combobox.
- **Slug change ALLOWED override** — if owner picks soft-block (STOP & ASK result), allow slug change BUT auto-update Footer references atomically in a single transaction; if transaction fails, ROLL BACK both.

## Required investigation (PASTE in session log)

```
# 1. Verify dependencies
test -f tasks/Sprints/Sprint_27_kickoff_prompt_Task_326A.md && echo "326A kickoff exists"
test -f src/app/admin/pages/page.tsx && echo "326A shipped" || echo "BLOCKED: 326A pending"
test -f src/lib/reserved-slugs.ts && echo "326A reserved-slug helper exists"
test -f src/lib/footer-route-allowlist.ts && echo "Task 324 allowlist exists" || echo "BLOCKED: Task 324 pending"

# 2. Owner action verification (manual): owner confirms `scripts/task-326-pages-locale-jsonb.sql` ran

# 3. Confirm AdminFooterManager + actions current shape
sed -n '1,80p' src/components/admin/AdminFooterManager.tsx | head -80
grep -n 'upsertFooterContent\|validateInternalLinkPath\|nav_links' src/modules/admin/actions/footer.ts

# 4. Confirm AdminPagesManager + actions (326A)
sed -n '1,80p' src/components/admin/AdminPagesManager.tsx | head -80
grep -n 'updatePage\|deletePage\|createPage' src/modules/admin/actions/index.ts

# 5. site_footer JSONB query path (for Footer-references-page query)
grep -n 'nav_links\|info_links\|FooterLink' src/types/database.ts src/modules/admin/actions/footer.ts | head -10

# 6. Confirm canonical Combobox primitive supports searchable mode + grouping
sed -n '1,60p' src/components/ui/combobox.tsx
```

After investigation, paste:
- Dependency verification matrix (326A shipped + Task 324 shipped + migration ran).
- Existing AdminFooterManager link-row layout narrative.
- Existing AdminPagesManager list-row layout narrative.
- Server action signatures + how `validateInternalLinkPath` is invoked + whether it currently queries pages table.
- Combobox API (search, groups, async source) confirmation.

## STOP & ASK before writing code

1. **Slug-change soft-block** — BLOCK (default) vs. auto-update Footer references (transactional). Default BLOCK.
2. **"Create page" CTA navigation** — same tab (lose Footer draft state) vs. new tab (keep Footer state). Recommend NEW TAB; on save, page is immediately available; admin returns to existing Footer tab and re-clicks save.
3. **"Select existing page" Combobox** — synchronous (load all published slugs at page load) vs. async (server search on type). Recommend SYNCHRONOUS (low-volume; bounded list).
4. **Draft pages in "Select existing page" picker** — INCLUDE with badge "Draft" (warns admin they need to publish) vs. EXCLUDE. Recommend EXCLUDE (cleaner UX; admin uses "Create page" CTA for new content).
5. **`updatePage` / `deletePage` server-side BLOCK shape** — error code `page_used_by_footer` returned with count; client surfaces localized toast. Confirm.
6. **Used-in-Footer query performance** — for each row in `/admin/pages` list, query `site_footer` JSONB; if 100+ pages, N+1 risk. Recommend bulk fetch + in-memory join (size of `site_footer` is bounded — 4 rows × ~10 links = ~40 link objects to scan). Confirm.

## Scope (files Sonnet may touch)

- `src/components/admin/AdminFooterManager.tsx` — add "Create page" CTA + "Select existing page" Combobox per link row; wire to existing Task 324 validation pathways.
- `src/components/admin/AdminPagesManager.tsx` — add "Used in Footer" Badge + count per row; block delete/unpublish/slug-change with localized error when used.
- `src/modules/admin/actions/footer.ts` — extend `validateInternalLinkPath` to ALSO accept published CMS slugs (query `pages` table); add helper `getPublishedCmsSlugs()` for picker source.
- `src/modules/admin/actions/index.ts` (`updatePage` + `deletePage`) — add Footer-reference check; return `page_used_by_footer` error code when blocked.
- `src/lib/footer-page-references.ts` (NEW) — canonical helper `getFooterPageReferences(slug?): Promise<{[slug]: {count, locations: ['nav_links'|'info_links', locale][]}}>` for bulk + single-slug query.
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — add new keys (see Localization section).
- `docs/sessions/2026-05-30-task-326B-footer-cms-integration.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- `src/components/layout/Footer.tsx` — frozen (Task 247 + 302)
- `scripts/task-302-site-footer-backfill.sql` — frozen
- `scripts/task-326-pages-locale-jsonb.sql` — frozen (326A)
- `src/lib/reserved-slugs.ts` — frozen (326A; only EXTEND if a new reserved segment surfaces, STOP & ASK)
- `src/lib/slug-validator.ts` — frozen (326A)
- `src/app/[locale]/[slug]/page.tsx` — frozen (326A)
- `src/app/admin/pages/page.tsx` — frozen (326A; only AdminPagesManager component changes)
- AdminSidebar — frozen (326A)
- 326A migration shape
- DB schema (no new columns/tables)
- RLS policies
- Any Sprint 21-26 file (except 326A counterpart)

Maximum SOURCE-FILE delta: **5 source files** + 4 locales + 1 doc. If more, STOP & ASK.

## Localization (sq/en/uk/it parity)

New keys under `admin.footer` + `admin.pages`:

`admin.footer.*`:
- `link_create_page_cta` — "Створити сторінку" / "Create page" / "Krijo faqe" / "Crea pagina"
- `link_select_page_cta` — "Виберіть існуючу сторінку" / "Select existing page" / "Zgjidh faqe ekzistuese" / "Seleziona pagina esistente"
- `link_picker_static_routes_group` — "Статичні маршрути" / "Static routes" / "Rrugë statike" / "Percorsi statici"
- `link_picker_cms_pages_group` — "CMS сторінки" / "CMS pages" / "Faqe CMS" / "Pagine CMS"
- `link_picker_no_results` — "Немає сторінок" / "No pages" / "Asnjë faqe" / "Nessuna pagina"
- `link_page_draft_warning` — "Сторінка є чернеткою — опублікуйте її перед посиланням з Footer" / "Page is a draft — publish before linking from Footer" / "Faqja është draft — publikoje para se ta lidhësh nga Footer" / "La pagina è una bozza — pubblicala prima di collegarla dal Footer"

`admin.pages.*`:
- `used_in_footer_badge` — "Використовується у Footer" / "Used in Footer" / "Përdoret në Footer" / "Usato nel Footer"
- `used_in_footer_count` — "×{count}"
- `delete_blocked_used_by_footer` — "Не можна видалити: сторінка використовується у Footer ({count}). Видаліть посилання у Footer спочатку." (+ 3 locale equivalents)
- `unpublish_blocked_used_by_footer` — analogous
- `slug_change_blocked_used_by_footer` — analogous
- `view_footer_references_link` — "Переглянути посилання у Footer" + locales

Total: 6 keys under `admin.footer` + 5 keys under `admin.pages` = **11 keys × 4 locales = 44 string additions**.

Verify locale parity via `npm run check:i18n` after edit.

## Responsive coverage

All 7 breakpoints (320 / 375 / 390 / 768 / 1280 / 1440 / 2560) in `uk`:
- Footer link row at 320: "Create page" CTA + "Select existing page" Combobox button reachable + 44px touch targets.
- Select-existing-page Combobox dropdown: does not clip; grouped sections readable; "Draft" badge visible if included.
- Used-in-Footer Badge in `/admin/pages` list: visible without overlap at 320.
- Blocked delete/unpublish/slug-change dialogs: localized message wraps properly.

Spot-check sq / en / it.

## Acceptance criteria (literal)

- AdminFooterManager link row shows "Create page" CTA when URL is non-existing internal slug (uses 326A reserved-slug helper + queries CMS pages); CTA opens `/admin/pages/new?slug=<slug>` in new tab.
- AdminFooterManager link row shows "Select existing page" Combobox button; dropdown lists static routes (grouped) + published CMS slugs (grouped); pick auto-fills URL field; free-text input still works.
- `validateInternalLinkPath` server-side allows: static routes (Task 324) + published CMS slugs (new in 326B); rejects everything else; returns `invalid_internal_link` with localized message (existing key from Task 324).
- `updatePage` server action checks Footer references when slug or `is_published` changes; returns `page_used_by_footer` with count if blocked; localized toast surfaces.
- `deletePage` server action checks Footer references; returns `page_used_by_footer` if blocked.
- AdminPagesManager list shows "Used in Footer ×N" Badge per affected row; clicking opens a modal listing every Footer reference with deep-links to `/admin/footer` editor.
- Removing a Footer reference in `/admin/footer` → row Badge disappears → delete/unpublish/slug-change allowed.
- All existing AdminFooterManager + AdminPagesManager + Task 324 behavior preserved (Note 20 inventory).
- `Footer.tsx` unchanged (`git diff src/components/layout/Footer.tsx` empty).
- All 11 new locale keys present in all 4 files with parity.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0/0. `npm run check:i18n` → passes. `npm run governance:tailwind` → C0/H0/M0.
- All 7 breakpoints verified at `uk` for Footer + Pages surfaces; spot-check sq/en/it.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · Footer Create-page CTA PASS · Footer Select-page picker PASS sq/en/uk/it · Pages Used-in-Footer protection PASS (delete/unpublish/slug-change blocked + override OFF) · 7 breakpoints PASS · existing controls preserved · Footer.tsx untouched · scope=clean · PASS`.

## Out of scope (deferred to 326C)

- Usage indicator visual polish + clickable "view references" modal (or include here — STOP & ASK).
- Preview button on `/admin/pages` (opens public page in new tab).
- SEO metadata extension.
- `admin.legal` namespace consolidation.
- Page archiving / revision history / image upload.
- Public navigation auto-update when slug changes (only Footer references covered here).
- Listing detail / cabinet / other admin surfaces referencing CMS pages (none today; future).

## STOP & ASK conditions

1. Slug-change BLOCK vs. auto-update (Decision default: BLOCK).
2. "Create page" CTA navigation (same tab vs. new tab; recommend new tab).
3. Combobox picker async vs. sync (recommend sync).
4. Draft pages in picker (include with badge vs. exclude; recommend EXCLUDE).
5. Error code shape (`page_used_by_footer` with count).
6. Used-in-Footer query strategy (bulk vs. per-row; recommend BULK).

## Final report required

1. Files Changed table.
2. Dependency verification (326A + Task 324 + migration).
3. Note 20 inventory (before/after) for AdminFooterManager + AdminPagesManager.
4. Server-action validation pathway narrative.
5. Used-in-Footer query strategy + sample query.
6. Locale × breakpoint validation matrix.
7. Footer.tsx untouched-confirmation.
8. AC self-audit table.
9. STOP & ASK transcript + resolutions.

Do NOT emit git commands. Do NOT run git. Do NOT touch Footer.tsx, reserved-slug helper, slug-validator, public renderer, or DB schema. STOP & ASK on the 6 design points BEFORE editing code.
