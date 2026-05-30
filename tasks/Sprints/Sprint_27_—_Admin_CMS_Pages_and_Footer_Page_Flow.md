# Sprint 27 — Admin CMS Pages + Footer Page Flow (Epic-grade workstream split 326A → 326B → 326C)

> **Formed:** 2026-05-30 (Opus planning task per `issues3.md`-equivalent owner directive; Task 325 was occupied by Sprint 26 Turbopack chore → renumbered to 326 + split into A/B/C).
> **Status:** FORMED — 3 sub-task kickoffs ready for Sonnet.
> **Run order:** **Sprint 25 (Task 324) → 326A → owner runs migration SQL → 326B → 326C**.
> **Owner gate:** owner must run `scripts/task-326-pages-locale-jsonb.sql` in Supabase SQL editor between 326A and 326B.

## Sprint goal

Build the canonical Admin CMS Pages system + integrate it with the Footer link manager so that admins can create / edit / publish per-locale pages, reference them from Footer, and have automatic guard rails against broken links + accidental destruction of in-use pages.

**Strategic context:** Task 324 (Sprint 25) is a *temporary safety guard* — it BLOCKS Footer links to non-existing internal pages but does not give admins a way to create those pages. Sprint 27 delivers the real product solution by extending the existing mono-locale `pages` table to 4-locale JSONB content + rebuilding the de-facto `/admin/legal` page manager as the canonical `/admin/pages` section + adding a public `src/app/[locale]/[slug]/page.tsx` renderer + wiring Footer to a "Select existing page" picker + "Create page" CTA + delete/unpublish/slug-change protection when a page is used by Footer.

Owner architecture decision (preserved): **Footer is not the source of truth for page content.** Footer references pages by slug; pages live in the canonical `pages` table managed at `/admin/pages`.

## Numbering rationale

Backlog 2026-05-30 reservations BEFORE Sprint 27:
- 300–302 — Sprint 21 hotfixes
- 303–305 — Sprint 23 (Epic HH Phase 1)
- 306–313 — Epic HH Phase 2-6 (planned, deferred)
- 314 — Sprint 22 complaint-type
- 315 + 324 — Sprint 25 hotfixes 2
- 316–318 — Sprint 24 (Epic II Phase 1)
- 319–323 — Epic II Phase 2-3 (planned, deferred)
- **325 — Sprint 26 Turbopack chore (OCCUPIED, not free)**
- 326 — **this sprint** (next free)

**Task 326 split into 326A / 326B / 326C** (Opus Decision 5 in planning log) because the combined scope is too large for safe Sonnet review.

## Tasks

### Task 326A — Admin CMS pages source-of-truth + per-locale content + `/admin/pages` rebuild + public `[locale]/[slug]` renderer [HIGH]

- Kickoff: [`Sprint_27_kickoff_prompt_Task_326A.md`](Sprint_27_kickoff_prompt_Task_326A.md)
- Type: feature + schema reshape (JSONB-only, no new columns/tables) + new admin route + new public route
- Owner action required: run `scripts/task-326-pages-locale-jsonb.sql` in Supabase SQL editor between 326A diff approval and 326B start.
- Output: `scripts/task-326-pages-locale-jsonb.sql` (NEW) + `src/app/admin/pages/page.tsx` (NEW) + `AdminPagesManager.tsx` (NEW) + `src/lib/reserved-slugs.ts` + `slug-validator.ts` (NEW) + `src/app/[locale]/[slug]/page.tsx` (NEW) + types update + redirect `/admin/legal` → `/admin/pages` + delete `/admin/pages-admin` stub + sidebar update + 23 new locale keys × 4 locales = 92 string additions.
- 5 STOP & ASK design points (empty-locale publish policy / public-renderer fallback / migration-pending banner / sidebar key migration / namespace consolidation timing).
- Independence: foundational; no Footer changes; ships standalone after 326A diff approval.

### Task 326B — Footer integration with CMS pages: create-page flow + select-existing-page picker + delete/unpublish/slug-change protection [HIGH]

- Kickoff: [`Sprint_27_kickoff_prompt_Task_326B.md`](Sprint_27_kickoff_prompt_Task_326B.md)
- Type: feature (Footer ↔ CMS integration; UX + workflow guards)
- Dependency: **326A shipped + owner ran migration SQL + Task 324 shipped (Sprint 25)**. Verify all three before starting.
- Output: AdminFooterManager + AdminPagesManager extensions + `src/lib/footer-page-references.ts` (NEW canonical helper) + actions/footer.ts extension + actions/index.ts (`updatePage`+`deletePage`) edits + 11 new locale keys × 4 locales = 44 string additions.
- 6 STOP & ASK design points (slug-change BLOCK vs auto-update / CTA navigation / picker sync vs async / draft inclusion / error code shape / query strategy).
- Independence: depends on 326A + Task 324.

### Task 326C — CMS pages polish + SEO metadata + sidebar/namespace cleanup + 7-bp × 4-loc QA [MEDIUM]

- Kickoff: [`Sprint_27_kickoff_prompt_Task_326C.md`](Sprint_27_kickoff_prompt_Task_326C.md)
- Type: polish + QA + cleanup (small targeted edits)
- Dependency: 326A + 326B shipped.
- Output: Preview button + SEO `generateMetadata` extension + `meta_description` per locale + Used-in-Footer details modal + `admin.legal` namespace consolidation (STOP & ASK gated) + `/admin/legal` redirect removal (STOP & ASK gated) + vitest reserved-slugs spec + comprehensive 7-bp × 4-loc audit report.
- 6 STOP & ASK design points (cleanup timing / namespace removal / SEO suite scope / preview-for-draft behavior).
- Closes Sprint 27.

## Run order rationale

1. **Sprint 25 Task 324 first** (parallel-safe; not blocking 326A foundation but blocking 326B integration).
2. **326A** (CMS foundation; admin section + public renderer).
3. **Owner runs migration SQL** (between 326A and 326B; non-destructive JSONB reshape).
4. **326B** (Footer integration; depends on 326A + Task 324).
5. **326C** (polish; depends on 326A + 326B).

## Exit criteria

Sprint 27 closes when:
- All three tasks have approved diffs (orchestrator review).
- Owner ran `scripts/task-326-pages-locale-jsonb.sql` in Supabase SQL editor + confirms existing pages render at `/sq/<legacy-slug>` after migration.
- Owner runtime-verifies in all 4 locales:
  - `/admin/pages` list + 4-locale editor + draft/publish/delete works.
  - `/sq/<slug>`, `/en/<slug>`, `/uk/<slug>`, `/it/<slug>` render published pages.
  - Footer "Create page" CTA + "Select existing page" Combobox work.
  - Delete/unpublish/slug-change blocked when page is used by Footer.
  - SEO metadata emits per-locale title.
- All 7 breakpoints verified at `uk` for admin + public surfaces.
- Orchestrator emits explicit-path commit commands per sub-task at review.
- Backlog updated; Sprint 27 row in archive table.

## Out of scope for Sprint 27

- Page archiving / revision history / WYSIWYG editor.
- Image upload / media library.
- Sitemap.xml generation.
- Open Graph / alternates / hreflang (deferred to future SEO sprint).
- New canonical primitives.
- DB schema column add/drop (only JSONB reshape).
- `Footer.tsx` changes (frozen per Task 247 + 302).
- `scripts/task-302-site-footer-backfill.sql` changes (frozen).
- Any non-CMS/non-Footer admin surface.
- Epic HH Phase 2+ (Tasks 306+) — independent track.
- Epic II Phase 2+ (Tasks 319+) — independent track.
- Sprint 21-26 tasks — independent tracks.

## References

- Opus planning session log: [`../../docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md`](../../docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md)
- Task 324 (Footer link validation — Sprint 25, dependency for 326B): [`Sprint_25_kickoff_prompt_Task_324.md`](Sprint_25_kickoff_prompt_Task_324.md)
- Task 302 (Footer source-of-truth — Sprint 21, foundational): [`Sprint_21_kickoff_prompt_Task_302.md`](Sprint_21_kickoff_prompt_Task_302.md)
- Task 247 (original Footer Admin Manager): [`../../docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md`](../../docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md)
- Epic HH — Admin UX System (Sprint 27 is INDEPENDENT track; product feature, not admin-UX-system phase): [`../Epics/Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md)
