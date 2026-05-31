# Sprint 29 — Modal Pattern + Sprint 27 Closure

> **Formed:** 2026-05-31 (Opus orchestrator after owner directive: assign Task 329 to a sprint; observe that Task 326B + Task 326C in Sprint 27 unblock the moment Sprint 28 ships → cleaner to track them in one sprint than to leave Sprint 27 perpetually half-done).
> **Status:** FORMED — 3 task kickoffs ready for Sonnet. **Sprint 29 starts AFTER Sprint 28 ships (Tasks 308 + 309 committed).**
> ⚠️ **Sprint 28 timeline updated 2026-05-31:** Task 306 owner re-QA FAILED → Task 306-Fix inserted before Tasks 308/309. Sprint 29 start is now gated on Task 306-Fix → 308 → 309 sequence rather than the original 308/309 parallel finish. No change to Sprint 29 task list; only its earliest-start date shifts.
> **Run order:** **Task 329 ‖ Task 326B → Task 326C**
> **Owner gates:**
> 1. Sprint 28 closure (308 + 309 visual QA PASS + committed) — gates Sprint 29 start.
> 2. Owner-run `scripts/task-326-pages-locale-jsonb.sql` (Task 326A migration — DONE 2026-05-30).
> 3. Owner reviews Task 329 primitive change visually at 320/375/390/768/1280/1440/2560 before approval (`DialogContent` bottom-sheet behavior touches every modal in the app — cross-cutting visual gate).

## Sprint goal

Close two outstanding work streams that were either blocked or unassigned:

1. **Universal bottom-sheet modal pattern for `<lg` (mobile + tablet).** Owner request 2026-05-31 (Ukrainian chat): all modals on mobile + tablet must render as full-width bottom-sheet (slide-up, rounded-top, drag-handle, stacked footer). Strategy: extend `DialogContent` className with responsive variants so every Dialog consumer auto-inherits; migrate the 2 remaining `div.fixed.inset-0` admin form modals so they go through `Dialog`.
2. **Footer ↔ CMS pages integration (Task 326B) + CMS pages polish (Task 326C).** Both kickoffs already exist in Sprint 27 and have been BLOCKED since 2026-05-30 by Sprint 28's existence. Sprint 29 re-homes them logically (they remain in `tasks/Sprints/Sprint_27_kickoff_prompt_Task_326B.md` / `_326C.md` — kickoff files are not renamed) and tracks them to completion.

## Scope tasks

| # | Task | Type | Kickoff | Status |
|---|------|------|---------|--------|
| 1 | **329 — Epic Z.2 — Mobile + Tablet bottom-sheet modal pattern** | feature + refactor (UI primitive change + 2 admin migrations + 5 doc updates) | [`Epic_Z_kickoff_prompt_Task_329.md`](../Epics/Epic_Z_kickoff_prompt_Task_329.md) | READY |
| 2 | **326B — Footer ↔ CMS Create-page CTA + Select-existing-page picker + delete/unpublish/slug-change protection** | feature (Footer ↔ CMS integration; UX + workflow guards) | [`Sprint_27_kickoff_prompt_Task_326B.md`](Sprint_27_kickoff_prompt_Task_326B.md) | UNBLOCKED on Sprint 28 close |
| 3 | **326C — CMS pages polish + SEO metadata + sidebar/namespace cleanup + 7-bp × 4-loc QA** | polish + QA + cleanup | [`Sprint_27_kickoff_prompt_Task_326C.md`](Sprint_27_kickoff_prompt_Task_326C.md) | BLOCKED until 326B ships |

## Run order

```
Sprint 28 ships (308 + 309 committed)
        │
        ├── Task 329  (independent primitive change — `src/components/ui/dialog.tsx` + 2 admin form modals)
        │
        └── Task 326B (Footer ↔ CMS integration — `AdminFooterManager` + `AdminPagesManager`)
                 │
                 └── Task 326C (CMS polish + SEO + sidebar cleanup + final 7-bp × 4-loc QA)
```

Task 329 and Task 326B touch **disjoint file sets** (verified — see "File overlap analysis" below); they may run in parallel. Task 326C is sequentially gated by 326B because 326C polishes 326B's deliverable.

## Dependencies + blocking relationships

- **Sprint 28 must close before Sprint 29 starts.** Sprint 28 Task 309 ships Sheet-bottom-drawer at `<md` for `AdminSupportManager` + `AdminInquiriesManager` detail modals; Sprint 29 Task 329 changes the `Dialog` primitive's mobile+tablet rendering. Running Task 329 mid-Sprint-28 risks `dialog.tsx` merge conflicts and invalidates Sprint 28's visual QA — Task 329's own kickoff has a STOP&ASK trigger for in-flight `dialog.tsx` edits.
- **Task 326A is DONE** (code/build/sql 2026-05-30) — Sprint 29 inherits the canonical `pages` table + `/admin/pages` editor + public `[locale]/[slug]` renderer + reserved-slug helper. 326A's reduced visual-QA gate (`/admin/pages` + `[locale]/[slug]` only) is owner-verified independently of Sprint 28; if not yet verified at Sprint 29 start → owner verifies BEFORE 326B starts.
- **Task 324 is DONE** — Footer link allowlist validation is in place; 326B extends it.
- **Sprint 27 stays open as a Sprint shell** until 326B + 326C ship; Sprint 29 plan supersedes its scheduling but does not delete the Sprint 27 plan file.

## File overlap analysis (no conflict between Task 329 ‖ Task 326B)

| File | Task 329 touches? | Task 326B touches? | Task 326C touches? |
|------|-------------------|--------------------|--------------------|
| `src/components/ui/dialog.tsx` | ✅ (primitive — bottom-sheet at `<lg`) | ❌ | ❌ |
| `src/components/admin/AdminCurrenciesManager.tsx` | ✅ (bespoke → Dialog migration) | ❌ | ❌ |
| `src/components/admin/AdminExchangeProvidersManager.tsx` | ✅ (bespoke → Dialog migration) | ❌ | ❌ |
| `src/components/admin/AdminFooterManager.tsx` (or successor) | ❌ | ✅ (Create-page CTA + Select-page picker) | ⚠️ may touch Used-in-Footer modal polish |
| `src/components/admin/AdminPagesManager.tsx` | ❌ | ✅ (delete/unpublish/slug-change guards) | ✅ (Preview button + Used-in-Footer details modal polish) |
| `src/lib/footer-route-allowlist.ts` | ❌ | ✅ (extend with published-CMS-slugs) | ❌ |
| `src/app/[locale]/[slug]/page.tsx` | ❌ | ❌ | ✅ (generateMetadata SEO) |
| `messages/{sq,en,uk,it}.json` | ❌ (zero new strings) | ✅ (new keys per 326B kickoff) | ✅ (sidebar + namespace cleanup) |
| `docs/responsive-governance.md` | ✅ (§"Modal Behavior Philosophy" rewrite) | ❌ | ❌ |
| `docs/ui-rules.md` | ✅ (Modal canonical pattern subsection) | ❌ | ❌ |
| `docs/admin-ux-rules.md` | ✅ (§11.2 update) | ❌ | ❌ |
| `docs/component-governance.md` + `docs/component-catalog.md` | ✅ (one-line notes) | ❌ | ❌ |

Zero file overlap between Task 329 and Task 326B. 326C touches `AdminPagesManager.tsx` AFTER 326B — sequential by design.

## Architectural notes (orchestrator)

### Task 329 ↔ Sprint 28 Task 309 interaction (important — review-time fact)

Sprint 28 Task 309 ships a `Sheet side="bottom"` wrapper for `AdminSupportManager::TicketDetail` and `AdminInquiriesManager::InquiryDetail` at `<md`. Sprint 28 Task 309 keeps Dialog (or inline panel) at `≥md`.

Sprint 29 Task 329 changes the `DialogContent` className so EVERY Dialog renders as bottom-sheet at `<lg` (0–1023px) and as centered dialog at `lg+` (1024+).

After both ship, the effective behavior for support + inquiries detail panels is:

| Width | Support / Inquiries detail | Source |
|-------|----------------------------|--------|
| 0–767px (`<md`) | `Sheet side="bottom"` | Task 309 |
| 768–1023px (`md-lg`) | `Dialog` rendering as bottom-sheet (Task 329 override) | Task 329 |
| 1024px+ (`lg+`) | Centered `Dialog` | Task 329 |

For every OTHER modal in the app:

| Width | All other modals | Source |
|-------|------------------|--------|
| 0–1023px (`<lg`) | `Dialog` rendering as bottom-sheet | Task 329 |
| 1024px+ (`lg+`) | Centered `Dialog` | Task 329 |

Task 329's kickoff explicitly mirrors `sheet.tsx side="bottom"` className tokens for the slide-up animation, so the visual treatment of support/inquiries at `<md` (Sheet primitive) and the visual treatment of all other modals at `<md` (Dialog rendering as bottom-sheet) are **visually consistent**. The split-primitive arrangement is acceptable; it preserves Task 309's already-shipped Sheet integration without re-migration.

**Review hook:** during Sprint 29 visual QA, capture screenshots at 768px (md) for support/inquiries detail → confirm they render as bottom-sheet (the Task 329 Dialog override should kick in there, not Sheet). This is the only width where Task 309's choice of "Dialog at `≥md`" becomes visible behavior shaped by Task 329.

### Task 311 (Epic HH Phase 5 — modal standardization generalization) — scope reduced

`tasks/Epics/Epic_HH_Admin_UX_System.md` Phase 5 reserves Task 311 for "modal standardization — generalize Sheet-bottom-drawer pattern from Sprint 28 to remaining admin modals after Sprint 28 ships." With Task 329 shipping a primitive-level change that auto-applies bottom-sheet at `<lg` to every Dialog consumer, Task 311's scope is substantially reduced. **Action: Sprint 29 does NOT activate Task 311.** Post-Sprint 29, the orchestrator re-evaluates whether Task 311 is still needed (likely a thin closure task: verify post-329 modal landscape + close Phase 5 as superseded), or whether Phase 5 closes outright.

### Test surfaces — locked, not negotiable

Per the Task 329 kickoff, the 4 representative modals to verify at 7 × 4:

1. Simple confirmation: `AdminLocationsManager::DeleteConfirmDialog` (sm Dialog).
2. Form modal: `AdminCurrenciesManager::CurrencyFormDialog` (post-migration — verify bespoke→Dialog migration didn't regress).
3. Action-heavy detail: `AdminListingsTable::ListingPreviewDialog` (button-row stress test).
4. Site-side user-facing: `ListingReportDialog` (uk locale = longest strings).

For Task 326B: verify Footer Create-page CTA + Select-existing-page Combobox per the 326B kickoff at 320/375/390 × sq/en/uk/it minimum.

For Task 326C: 7-bp × 4-loc full audit of `/admin/pages` list + editor + public `[locale]/[slug]` renderer + Footer integration per the 326C kickoff.

## Exit criteria (sprint ships when ALL of these are met)

- Task 329 PASSes review: `dialog.tsx` updated; 2 bespoke admin modals migrated; 5 doc files updated; `npm run build` + `lint` + `tsc` + `check:i18n` + `governance:tailwind` green; 4 representative modals verified at 7 × 4; Files Changed table matches diff.
- Task 326B PASSes review: Footer Create-page CTA + Select-page Combobox shipped; delete/unpublish/slug-change guards in place; allowlist extended with CMS slugs; all 326B kickoff AC met.
- Task 326C PASSes review: Preview button + Used-in-Footer modal + SEO metadata + sidebar/namespace cleanup + 7-bp × 4-loc audit findings documented; all 326C kickoff AC met.
- `docs/backlog.md` Last Session updated for each task per the 2–4-line rule.
- Sprint 29 closure entry in `docs/sessions/2026-MM-DD-sprint-29-closure.md` (Opus-authored at sprint end) — also closes Sprint 27 logically.
- Epic Z marked complete (or status updated): Z.1 (Task 240) + Z.2 (Task 329) both shipped.
- Epic HH Phase 5 re-evaluated: either Task 311 activated or closed-as-superseded by Task 329.

## Out of scope (HARD)

- Touching Sprint 28 surfaces (`AdminSupportManager`, `AdminInquiriesManager`, `AdminListingsTable`) beyond what Tasks 326B/326C/329 minimally require. Specifically, **DO NOT** re-migrate support/inquiries detail panels from Sheet back to Dialog — Task 309's choice stays.
- Activating Task 311 (Epic HH Phase 5).
- Activating Task 310 (Epic HH Phase 4 — remaining 12 admin routes content/settings migration).
- Adding drag-to-dismiss gesture for bottom-sheet modals (flagged as Task-329 follow-up).
- Introducing `AlertDialog` primitive (still deferred to Task 305 Phase 5 follow-up).
- Touching `Sheet` primitive (unchanged in Sprint 29).
- Touching `ListingGallery.tsx` fullscreen image viewer (separate concern).

## Sprint-level commit emission rule (reminder per Task 264)

Sonnet does NOT run `git add` / `git commit`. After EACH task PASSes orchestrator review, Opus emits explicit-path commit commands grouped logically:

- Task 329: 3 commits (primitive change; 5 doc updates; session log + backlog + Epic Z closure mark).
- Task 326B: commits per 326B kickoff convention.
- Task 326C: commits per 326C kickoff convention.

Owner runs the orchestrator's commands in PowerShell. Never `git add -A` / `git add -u` / wildcards.

## Cross-references

- Epic Z (Modal Canonical Pattern): [`tasks/Epics/Epic_Z_Modal_Canonical_Pattern.md`](../Epics/Epic_Z_Modal_Canonical_Pattern.md) — Task 329 = Z.2.
- Sprint 27 plan: [`Sprint_27_—_Admin_CMS_Pages_and_Footer_Page_Flow.md`](Sprint_27_—_Admin_CMS_Pages_and_Footer_Page_Flow.md) — 326B + 326C kickoffs.
- Sprint 28 plan: [`Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`](Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md) — must close before Sprint 29 starts.
- Task 305 admin modal audit: [`docs/governance-reports/2026-05-30-admin-modal-audit.md`](../../docs/governance-reports/2026-05-30-admin-modal-audit.md) — 26-row inventory, reused by Task 329.
- Epic HH (Admin UX System): [`tasks/Epics/Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md) — Phase 5 Task 311 re-evaluation pending.
