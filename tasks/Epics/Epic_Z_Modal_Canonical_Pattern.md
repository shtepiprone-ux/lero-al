# Epic Z — Modal Canonical Pattern (global audit + single template)

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #97 (modals/popups across the project all have
different visual treatments; bring them to ONE canonical look and an extensible options template,
mirroring how `Combobox` + options / variants work as a single primitive).
**Kickoffs:** `Epic_Z_kickoff_prompts.md` (Task 240).

> This Epic is the modal sibling of Epic Q (Combobox single-source). Once it ships, every modal /
> dialog / confirmation popup in the project must come from one primitive with documented
> variants — the Note-14 (Global Change Verification) standard applied to modals.

## Goal

A single canonical Modal/Dialog primitive (shadcn `Dialog`-based, already present in `src/
components/ui/dialog.tsx`) with documented variants (default, confirm, form, full-screen-on-mobile),
adopted across every modal surface in the app. Anything currently rendered as raw `div.fixed.inset-0`
or as a bespoke modal wrapper is replaced or absorbed.

## Dependencies

- `src/components/ui/dialog.tsx` (the shadcn `Dialog` — already canonical per `docs/ai-behavior.md`
  → UI Primitive Anti-Patterns: "DO NOT add confirmation popups as raw `div.fixed.inset-0` — use
  `Dialog`"). The audit confirms how far that rule has actually been adopted in the codebase.
- Existing modal sites — at minimum:
  - admin Email Templates editor (`AdminEmailTemplatesManager.tsx`) — touched in Task 201 (modal
    width fix);
  - admin Locations / Property Types modals — touched in Task 200 (delete-into-modal);
  - admin Inquiries detail/reply modal (Task 223);
  - cabinet self-delete confirmation, signOut confirmation, report-listing dialog
    (`ListingReportDialog`), save-to-collection inline create dialog (Task 212), filter drawer
    on mobile (uses `Sheet`, not Dialog — out of scope here);
  - any current `div.fixed.inset-0` left in the tree (grep target).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`, the catalog
  (`docs/component-catalog.md`).

## Tasks

### Task 240 — Z.1 — Global modal audit + canonical Modal pattern

**Type:** feature + refactor
**Priority:** high
**Area:** every modal/dialog surface in the project (site + admin)

**Pre-read:** `docs/ai-behavior.md` (UI Primitive Anti-Patterns + Component Catalog Rules);
`docs/ui-rules.md`; `docs/component-governance.md`; `docs/component-catalog.md`;
`src/components/ui/dialog.tsx`; Task 200, 201, 212, 223 session logs (recent modal work);
`src/components/ui/sheet.tsx` (the mobile drawer primitive — out of scope but referenced for
boundary).
**Localization coverage:** sq, en, uk, it (every modal title / body / button × 4).
**Responsive coverage:** all 7 breakpoints (this is the explicit "extensible options" surface —
size variants must work at 320 and at 2560).

**Goal:**

1. **Audit.** Grep the repo for every modal surface — `Dialog`, `AlertDialog`, raw
   `div.fixed.inset-0`, and any local modal wrapper. List in the session log: file, current
   primitive, current visual treatment (size, header style, footer style), and call site.
2. **Canonical contract.** In `src/components/ui/dialog.tsx` (and a thin Modal wrapper if needed
   — STOP and ask the orchestrator before adding a new wrapper file; the goal is to ride the
   existing `Dialog`), document the canonical variants:
   - `size`: `sm | default | lg | xl | full` (mobile full-screen on `sm:` and below).
   - `variant`: `default | confirm | destructive | form`.
   - Header pattern: title + optional subtitle + close button (canonical position).
   - Footer pattern: actions right-aligned on desktop, stacked on mobile, primary on top.
   - Body padding scale per `docs/ui-rules.md §1`.
3. **Adopt.** Migrate every modal site found in step 1 to the canonical contract. Each migration
   is a separate sub-change in the diff but lives under this one task (the kickoff lists the
   migration order so review is tractable).
4. **Document.** Update `docs/ui-rules.md` with a "Modal canonical pattern" section that
   references the variants + size scale + header/footer rules. Add a row to
   `docs/component-catalog.md` if the audit reveals a new wrapper is justified (default is to
   reuse `Dialog` directly).
5. **Governance.** Add (or extend) a governance check that fails the build when a new
   `div.fixed.inset-0` lands in `src/` (the rule already exists in `docs/ai-behavior.md` as text;
   verify it has a runtime check; if not, add one — STOP and ask before adding new check infra).

**Acceptance criteria:**
- Audit table in the session log: BEFORE list of every modal site; AFTER list with each migrated
  to the canonical variant.
- Zero `div.fixed.inset-0` modal/popup outside library primitives (grep proof in the session log).
- `docs/ui-rules.md` has a "Modal canonical pattern" section documenting variants, sizes, header,
  footer.
- Every migrated modal renders correctly in all four locales at all seven breakpoints (UI
  pre-flight output in the session log per §17).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints; governance PASS.

**Out of scope:** sheet/drawer mobile filter UI (uses `Sheet`); replacing the popover/menu
primitives; restructuring any one modal's content (only its frame).

### Task 329 — Z.2 — Mobile + Tablet bottom-sheet modal pattern (canonical)

**Type:** feature + refactor
**Priority:** high
**Area:** `src/components/ui/dialog.tsx` (primitive); 2 admin bespoke modals; responsive + UI docs
**Status:** OPEN — opened 2026-05-31 by Opus 4.7 orchestrator. Owner request (2026-05-31, Ukrainian
chat): "модальні вікна на всю ширину екрану, виїзджають знизу" on mobile + tablet. Owner decision
captured in kickoff: apply universally (site + admin, including bespoke `div.fixed.inset-0`); active
at `<lg` (<1024px); centered at `lg+`.

**Kickoff:** `tasks/Epics/Epic_Z_kickoff_prompt_Task_329.md` (the literal, scoped Sonnet prompt —
read it as the single source of truth for this task).

**Sprint:** 29 — `tasks/Sprints/Sprint_29_—_Modal_Pattern_and_Sprint_27_Closure.md`. Runs after
Sprint 28 closes. Parallel-safe with Task 326B inside Sprint 29.

**One-line goal:** `DialogContent` renders as bottom-sheet at `<lg:` (full-width, slide-up,
rounded-top, drag-handle, stacked footer) and as centered dialog at `lg:+`. Two bespoke
`div.fixed.inset-0` admin form modals (CurrencyFormDialog + ProviderFormDialog) migrated to
`Dialog` so they auto-inherit. Docs rewritten (`responsive-governance.md` §"Modal Behavior
Philosophy", `ui-rules.md`, `admin-ux-rules.md` §11.2, `component-governance.md`,
`component-catalog.md`).

**Acceptance criteria:** see kickoff §"Acceptance criteria" — primitive change + 2 migrations + 5
doc updates + 4 locales × 7 breakpoints × 4 representative modals + UI pre-flight + Files Changed
table + zero `git add`/`git commit` from executor (orchestrator emits commit commands at review).

**Reuses:** the 26-row inventory in `docs/governance-reports/2026-05-30-admin-modal-audit.md`
produced by Task 305 — Sonnet does NOT re-audit admin modals.

**Out of scope (explicit):** `Sheet` primitive (unchanged); `ListingGallery` lightbox (separate
concern); `AlertDialog` introduction (Phase 5); drag-to-dismiss gesture (follow-up); per-modal
content restructuring; adding new opt-in props on `DialogContent`.

## Epic-level acceptance

One canonical Modal/Dialog primitive used by every modal surface; documented variants + sizes;
runtime governance check rejects future `div.fixed.inset-0` regressions; visual treatment is
consistent on site and admin at every breakpoint and locale.
