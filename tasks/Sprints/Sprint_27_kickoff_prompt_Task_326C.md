# Sprint 27 — Task 326C kickoff (CMS pages polish + SEO metadata + sidebar/namespace cleanup + 7-bp × 4-loc QA)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is **polish + QA + cleanup** — no major new features. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20), `docs/component-rules.md`, `docs/ui-rules.md`, `docs/analytics-rules.md` (SEO), `docs/qa-rules.md`, `docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md`, `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326A.md` + `_Task_326B.md` (DEPENDENCIES — both must ship). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 326C is the third sub-task in Sprint 27. **BLOCKED until 326A + 326B ship.**

---

```
Type:        polish + QA + cleanup (small targeted edits across CMS pages + Footer + sidebar + locale + SEO)
Priority:    MEDIUM (does not block users; closes the CMS pages workflow once 326A + 326B are stable)
Area:        admin/pages — Footer Used-in-Footer modal — public renderer SEO metadata — admin sidebar — admin.legal namespace cleanup
```

## Architecture rule (preserve verbatim)

**Footer is not the source of truth for page content.** Pages remain the canonical source; this polish task only adds Preview button, SEO metadata, Used-in-Footer modal polish, and namespace/sidebar cleanup. Route-collision protection (from 326A) is locked-in via a new vitest spec; Sonnet MUST NOT loosen the reserved-slug helper.

## Why this task exists

326A delivered the foundation; 326B delivered Footer integration. 326C closes residual debt:

1. **Preview button** on `/admin/pages` list/editor → opens public page in new tab.
2. **Used-in-Footer details modal** — clicking the Badge in `/admin/pages` opens a list of Footer references with deep-links to `/admin/footer` row (if 326B left this as basic text).
3. **SEO metadata** — extend `generateMetadata` in `[locale]/[slug]/page.tsx` to emit per-locale title + meta description + Open Graph; add `meta_description` field per locale in `pages.content[locale]`.
4. **Sidebar deduplication** — remove now-stale `admin.sidebar.item_legal` locale key + ensure no duplicate sidebar entries; remove `/admin/legal` redirect file if owner confirms transition window elapsed.
5. **`admin.legal` namespace cleanup** — consolidate into `admin.pages` (rename remaining `admin.legal.*` keys consumed by AdminLegalManager → AdminPagesManager); deprecate `admin.legal` namespace.
6. **7-bp × 4-loc full QA audit** — comprehensive runtime walk of admin/pages list + editor + public renderer + Footer integration at every breakpoint × every locale; produce findings doc.
7. **Route-collision integration test** — add a vitest unit test against `src/lib/reserved-slugs.ts` confirming every current static route segment is in the reserved list.

## Current behavior to preserve (Notes 19 + 20)

326A + 326B leave a fully-functional CMS + Footer workflow. 326C must NOT regress any of:
- `/admin/pages` list, editor, delete, publish-toggle, slug validation
- `/admin/pages` Used-in-Footer Badge + block-on-delete/unpublish/slug-change
- Public `[locale]/[slug]` rendering + 404 behavior
- Reserved-slug helper + slug-validator
- Footer "Create page" CTA + "Select existing page" Combobox
- Server-side validation for Footer + Pages

326C is ADDITIVE except for explicit cleanup steps (sidebar key removal, `/admin/legal` redirect removal, namespace rename). Every cleanup step requires explicit STOP & ASK before executing.

## Required investigation (PASTE in session log)

```
# 1. Confirm 326A + 326B shipped
test -f src/app/admin/pages/page.tsx && echo "326A shipped"
grep -n 'used_in_footer\|getPublishedCmsSlugs\|getFooterPageReferences' src/components/admin/AdminFooterManager.tsx src/components/admin/AdminPagesManager.tsx src/modules/admin/actions/footer.ts && echo "326B shipped"
test -f src/app/admin/legal/page.tsx && echo "326A redirect file still present" || echo "326A redirect file deleted"

# 2. Existing SEO patterns in project
grep -rn 'generateMetadata\|openGraph\|metaDescription' src/app/ | head -20

# 3. Existing admin.legal keys to consolidate
python3 -c "
import json
for loc in ['sq','en','uk','it']:
    with open(f'messages/{loc}.json') as f: data = json.load(f)
    al = data.get('admin', {}).get('legal', {})
    print(f'{loc} admin.legal keys ({len(al)}): {sorted(al.keys())}')
"

# 4. Existing public-page metadata precedent (listings detail)
grep -n 'generateMetadata' src/app/\[locale\]/listings/\[slug\]/page.tsx

# 5. Existing test pattern in repo
ls src/tests/ 2>&1 | head -20
grep -rn 'describe.*reserved\|RESERVED_SLUGS' src/tests/ 2>&1 | head -5
```

After investigation, paste:
- Dependency verification (326A + 326B).
- Existing SEO `generateMetadata` example from listings/[slug].
- Inventory of `admin.legal.*` keys to consolidate.
- Existing test runner pattern (vitest setup).

## STOP & ASK before executing cleanup steps

1. **`/admin/legal` redirect removal timing** — keep redirect (transition window still active) vs. remove file (admin team confirms no bookmarks). Default: KEEP redirect; remove in a separate later task.
2. **`admin.legal` namespace removal** — rename keys to `admin.pages.*` AND update AdminPagesManager imports (left from 326A migration). Alternative: leave both namespaces parallel. Default: RENAME + DEPRECATE.
3. **`admin.sidebar.item_legal` removal** — drop the key if nothing else consumes it. CHECK every consumer first via grep.
4. **SEO `meta_description` field per-locale** — extend `pages.content[locale]` JSONB shape with `meta_description`; backfill empty string; editor adds a 3rd field per locale tab. Requires migration SQL OR client-side default. Recommend: client-side default (empty string), no SQL change needed.
5. **Open Graph + canonical + alternates** — full SEO suite OR just title + meta_description? Default: title + meta_description + canonical (3 fields); OG + alternates deferred to future SEO sprint.

## Scope (files Sonnet may touch)

- `src/app/[locale]/[slug]/page.tsx` — extend `generateMetadata` (title + meta_description from `content[locale].meta_description` + canonical URL).
- `src/components/admin/AdminPagesManager.tsx` — add Preview button per row + per editor; add 3rd field per locale tab for `meta_description`; expand Used-in-Footer Badge into clickable modal (if 326B left it basic).
- `src/components/admin/AdminFooterManager.tsx` (if needed for Used-in-Footer deep-link reverse-direction) — minor edits only.
- `src/types/database.ts` — extend `PageLocaleContent` type to `{title: string; body: string; meta_description?: string}`.
- `src/modules/admin/actions/index.ts` (`updatePage`) — accept optional `meta_description` per locale in payload.
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — add new keys (see Localization); RENAME `admin.legal.*` keys → `admin.pages.*` if STOP & ASK #2 confirmed; REMOVE `admin.sidebar.item_legal` if STOP & ASK #3 confirmed.
- `src/components/admin/AdminSidebar.tsx` — remove the `item_legal` reference if STOP & ASK #3 confirmed.
- `src/app/admin/legal/page.tsx` — DELETE if STOP & ASK #1 confirms transition window elapsed; otherwise KEEP redirect.
- `src/tests/reserved-slugs.spec.ts` (NEW) — vitest unit test: every current static route segment under `src/app/[locale]/*/page.tsx` is in `RESERVED_SLUGS`.
- `docs/sessions/2026-05-30-task-326C-pages-polish-and-qa.md` (NEW; adjust date)
- `docs/governance-reports/2026-05-30-cms-pages-7bp-4loc-audit.md` (NEW) — comprehensive QA findings doc per breakpoint × per locale.
- `docs/backlog.md` (closure entry — Sprint 27 CLOSE)

**MUST NOT touch:**
- `src/components/layout/Footer.tsx` — frozen
- `scripts/task-302-site-footer-backfill.sql` — frozen
- `scripts/task-326-pages-locale-jsonb.sql` — frozen (326A)
- `src/lib/reserved-slugs.ts` — frozen (326A; only EXTEND if QA surfaces a new reserved segment)
- `src/lib/slug-validator.ts` — frozen
- `src/lib/footer-route-allowlist.ts` — frozen
- `src/lib/footer-page-references.ts` — frozen (326B)
- DB schema (no column add/drop)
- RLS policies
- Any Sprint 21-26 file
- Sprint 27 326A / 326B kickoff files
- Any feature beyond polish (no new components, no new pages, no new server actions beyond the listed minor edits)

Maximum SOURCE-FILE delta: **5 source files** + 4 locales + 1 test + 2 docs. If more, STOP & ASK.

## Localization (sq/en/uk/it parity)

New keys under `admin.pages.*`:
- `field_meta_description_label` — "Meta description" (locale variants)
- `field_meta_description_help` — "Description for search engines (~155 chars)"
- `btn_preview` — "Preview" / "Перегляд" / "Pamja" / "Anteprima"
- `used_in_footer_details_title` — "Footer references for this page" (locale variants)

Plus RENAMES (STOP & ASK #2 dependent): `admin.legal.*` → `admin.pages.*` for any key still in use after 326A.

Plus REMOVALS (STOP & ASK #3 dependent): `admin.sidebar.item_legal`.

Total new: **4 keys × 4 locales = 16 string additions** + rename / remove counts.

## Responsive coverage

This task includes the **canonical 7-breakpoint × 4-locale audit** for the entire CMS pages + Footer integration surface:
- `/admin/pages` list at 320/375/390/768/1280/1440/2560 × sq/en/uk/it.
- `/admin/pages` editor (4-tab modal + meta_description field) at all 7 × 4.
- Used-in-Footer Badge + clickable modal at all 7 × 4.
- Public `/sq/<slug>`, `/en/<slug>`, `/uk/<slug>`, `/it/<slug>` at all 7 breakpoints.
- Footer "Create page" CTA + "Select existing page" Combobox at all 7 × 4 (regression-check of 326B).

Findings → `docs/governance-reports/2026-05-30-cms-pages-7bp-4loc-audit.md` with severity tags (CRITICAL / HIGH / MEDIUM / LOW per Epic HH Task 303 convention).

## Acceptance criteria (literal)

- Preview button on `/admin/pages` opens the public page in a new tab; works for published pages; disabled / hidden for draft pages (or opens preview-as-draft if STOP & ASK approves a special preview route — default: disable).
- `generateMetadata` in `[locale]/[slug]/page.tsx` emits per-locale title + meta_description + canonical URL using `NEXT_PUBLIC_SITE_URL`.
- AdminPagesManager editor has a 3rd field per locale tab for `meta_description`; saved into `pages.content[locale].meta_description`.
- Used-in-Footer Badge in `/admin/pages` list is clickable; opens a modal listing every Footer reference (locale × list-name) with deep-links to `/admin/footer`.
- (If STOP & ASK confirms) `/admin/legal` redirect file deleted; `admin.sidebar.item_legal` key removed; `admin.legal` namespace renamed to `admin.pages`.
- `src/tests/reserved-slugs.spec.ts` vitest passes; test enumerates every static route segment under `src/app/[locale]/` and asserts it's in `RESERVED_SLUGS`.
- `docs/governance-reports/2026-05-30-cms-pages-7bp-4loc-audit.md` exists with full audit matrix + severity tags.
- All 326A + 326B behavior preserved (regression-tested).
- `Footer.tsx` unchanged.
- All new locale keys present in all 4 files; parity passes.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0/0. `npm run check:i18n` → passes. `npm run governance:tailwind` → C0/H0/M0. `npx vitest run` → all pass including the new reserved-slugs spec.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · vitest=PASS (+reserved-slugs spec) · admin/pages preview+meta_description+used-in-footer-modal PASS · public SEO metadata PASS · 7-bp × 4-loc audit complete (N findings, M severity tags) · admin.legal cleanup PASS or DEFERRED · scope=clean · PASS`.

## Out of scope

- Page archiving / revision history / WYSIWYG editor.
- Image upload / media library.
- Sitemap.xml generation.
- Open Graph / alternates / hreflang (deferred beyond this task unless owner expands scope).
- New Combobox / Dialog / Tab primitives.
- New public routes beyond `[locale]/[slug]`.
- DB schema changes.
- Footer.tsx changes.
- Any other Epic HH / Epic II / Sprint 21-26 work.

## STOP & ASK conditions

1. `/admin/legal` redirect removal timing.
2. `admin.legal` namespace removal.
3. `admin.sidebar.item_legal` removal.
4. SEO `meta_description` per-locale storage (client-side default vs. SQL backfill).
5. SEO suite scope (title + meta_description + canonical vs. full OG + alternates).
6. Preview-for-draft pages (disable button vs. special preview route).

## Final report required

1. Files Changed table.
2. Dependency verification (326A + 326B shipped).
3. Note 19 + 20 inventory delta (additive + cleanup confirmed).
4. SEO `generateMetadata` output sample (one published page in each of 4 locales).
5. Preview button behavior across published / draft rows.
6. Used-in-Footer modal narrative.
7. Vitest reserved-slugs spec output.
8. Full 7-bp × 4-loc audit matrix.
9. AC self-audit table.
10. STOP & ASK transcript + cleanup actions executed vs. deferred.

Do NOT emit git commands. Do NOT run git. Do NOT regress 326A/326B behavior. STOP & ASK on all 6 cleanup decisions BEFORE executing the cleanup steps.
