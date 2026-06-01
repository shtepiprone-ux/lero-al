# Session: Task 344 — Rebuild the Design System implementation path + produce DS-1 Sonnet task (Opus orchestrator/architect)

**Date:** 2026-06-01
**Type:** orchestration / architecture / planning (docs + tasks only — zero product code).
**Role:** Opus = orchestrator / architect / QA / reviewer. Opus does NOT write product code. Sonnet is the only executor.
**Parent:** Task 340 (`docs/design-system.md` — Global Responsive Design System Contract v1).

---

## 1. Verdict

**OWNER REVIEW REQUIRED — new design-system implementation path created; do not start Sonnet until owner approves the first Sonnet task (Task 345).**

Opus produced: (a) a rejection/freeze of Task 340-as-implementation and Task 343; (b) a graduated **DS-1..DS-8** foundation queue; (c) exactly ONE first Sonnet implementation task — **Task 345 (DS-1: PageShell + Section)** — smaller and stricter than Task 343; (d) doc/banner updates recording the freeze and the new path. No `src/`, `messages/`, DB, or business-logic change by Opus.

## 2. Status of Task 340

**Task 340 is REJECTED / NOT approved as an implementation path.** The *contract* `docs/design-system.md` (§4 containers, §5 spacing, §6 typography/wrapping, §7 Tier-1..4 ownership, §10 `tableAt`, §19–§21 QA/PASS/FAIL, ADDENDUM 14×4 canon) is **salvaged as the rule layer** — it remains the authoritative ruleset that the new tasks consume. What is rejected is Task 340's *delivery mechanism*: it produced only the contract + a single mega Phase-1 kickoff (Task 343), with no graduated, verifiable, owner-gated implementation path. Task 340 is NOT owner-approved architecture and is not to be presented as such.

## 3. Status of Task 343

**Task 343 is FROZEN / not executable as-is.** A FROZEN banner was added to the top of `tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md`. It is retained for provenance only; it must not be run. It is superseded by the DS-1..DS-4 graduated queue.

## 4. Diagnosis — why Task 340 / Task 343 fail as an implementation path

1. **Too much in one kickoff.** Task 343 asks Sonnet to create FIVE primitives at once (PageShell, PageHeader, Section, FilterBar, ActionBar), a barrel, and five Storybook story files in a single session. Breadth, not difficulty, is the failure mode — it is exactly the shape that has previously stalled/looped Sonnet (cf. Task 306 → 306-Fix → 306-Fix-2 cascade).
2. **The two hardest primitives are bundled with the two easiest.** FilterBar carries client `Sheet` open-state, a conditional 3-way Reset-render rule, 10+ filter overflow-collapse, Badge, and i18n-safe labels; ActionBar carries Button-height governance. These belong in isolated, individually-verifiable slices — not stapled to trivial structural wrappers.
3. **Unverifiable QA burden.** §19 requires a 14-width × 4-locale (56-cell) rendered matrix *per primitive*. Five primitives = ~280 cells of rendered proof in one task. That volume pressures the executor toward a code-level-only "PASS" — which §21 explicitly defines as FAIL.
4. **No owner approval gate between primitives.** A single kickoff cannot be approved primitive-by-primitive; a defect in one (likely FilterBar) blocks the whole slice and forces a large re-run.
5. **No smallest-safe entry point.** There was no slice small enough that Sonnet "cannot loop for hours" (the owner's explicit preference).

**Correction:** split Phase 1 into a graduated queue, smallest deterministic slice first, owner-approved between each; no route migration until the whole primitive foundation is shipped and approved.

## 5. Existing primitive inventory (read-only investigation)

### A. Global UI primitives — `src/components/ui/` (Tier-1, present, untouched)
Button (+stories), Badge (+stories), Sheet (+stories), Dialog (+stories), Card, Input (+stories), Input-group, Tabs (+stories), Checkbox, Radio-group, Select, Popover, DropdownMenu, Command, Navigation-menu, Pagination, Progress, Scroll-area, Separator, Skeleton (+stories), Slider, Switch, Table, Textarea, Avatar, Alert, Label, Sonner (toast), Password primitives, AppImage. → Tier-1 is well-covered; DS primitives compose these, never restyle them.

### B. Shared primitives — `src/components/shared/` (Tier-3/4 mix, untouched)
Combobox, LocationCombobox, PropertyTypeCombobox, YearCombobox, DatePicker, PhoneField, FiltersPanel, FilterMultiToggle, FilterRangeInputs, FilterRoomsRow, FilterToggleGroup, HeroSearch(+Client), LocaleSwitcher, Map(+Wrapper), RelativeTime, WebVitalsReporter, AvatarCropModal, `useHomepageFilters`. → These are domain/shared filter pieces; the **global FilterBar (DS-4) is NOT here** — it must be created in `layout/`. Existing filter pieces become its consumers in Phase 2, not edited now.

### C. Admin layout/data primitives — `src/components/admin/` (Tier-2/3 reference, DO NOT edit)
**AdminPageShell** (`.container-admin`, header+countBadge+actions+filterBar slot, `'use client'`), **AdminPageHeader** (title/subtitle/action, server), **AdminTable** (`lg:` table↔card switch + column-visibility + sticky col + right-edge fade), **AdminCardList** (StructuredCard + compact). All shipped (Sprint 28 / Task 306-Fix). These are the **reference** the public/cabinet siblings mirror — they are NOT edited by the DS queue.

### D. Public/cabinet layout primitives — `src/components/layout/` (THE GAP)
Currently ONLY `Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`. **Missing: PageShell, PageHeader, Section, FilterBar, ActionBar.** This gap is what the DS queue fills, smallest-first.

### Layout-risk facts confirmed in code
- `.container-wide` (public, `max-width:88rem`/1408px) and `.container-admin` (admin, full→1792px cap at 1536px+) defined in `src/app/globals.css` (≈L379–414). **No `.container-narrow` / `.container-form`** — narrow/form variants must be expressed with inline Tailwind `max-w-3xl`/`max-w-xl`, so DS-1 needs **zero `globals.css` change**.
- Storybook tooling supports the matrix: `.storybook/preview.tsx` exposes a **locale** global (sq/en/uk/it, with the uk "longest strings" label) and a **VIEWPORTS** set from 320px up. So 14×4 is renderable via toolbar; full 56-cell auto-capture is not automatic, hence the `OWNER QA REQUIRED` gate remains the realistic PASS path for DS-1.
- Scripts available (`package.json`): `build`, `lint` (eslint), `typecheck` (tsc --noEmit), `test` (vitest), `check:i18n`, `governance:*`, `build-storybook`, `screenshots:responsive`. The first Sonnet task references the canonical four (`build`, `tsc --noEmit`, `lint`, `check:i18n`) and tells Sonnet to report exact script names if they differ.

## 6. New design-system implementation queue (graduated — smallest first; no route migration until foundation approved)

| Slice | Scope | Client? | i18n strings? | Risk | Gate |
|---|---|---|---|---|---|
| **DS-1** | **PageShell + Section** + barrel + 2 stories (`Task 345`) | server-only | none (props) | low — smallest safe slice | owner approval |
| **DS-2** | **PageHeader** (+ extend barrel) + story | server-only | none (props) | low | owner approval |
| **DS-3** | **ActionBar** (+ extend barrel) + story; resolves Button-height governance in isolation | server-only | none (props) | medium | owner approval |
| **DS-4** | **FilterBar** (+ extend barrel) + story; client Sheet state, conditional Reset, 10+ filter collapse, i18n-safe `labels` prop | client | labels via props (no `messages/*` change) | high — isolated on purpose | owner approval |
| **DS-5** | Storybook responsive/locale **proof hardening** for all layout primitives (screenshot matrix / `screenshots:responsive`) | — | — | low | owner approval |
| **DS-6** | **Public route pilot** — adopt primitives on ONE public route (migration begins ONLY here) | — | per route | medium | owner approval |
| **DS-7** | **Cabinet/auth pilot** — one cabinet/auth surface | — | per route | medium | owner approval |
| **DS-8** | **Admin compatibility review only** (no admin rewrite unless needed) + public/cabinet/admin migration planning | — | — | low | owner approval |

**Hard rule:** **No route migration (DS-6+) starts until DS-1..DS-5 are implemented, reviewed, and owner-approved.** Each slice is a separate Sonnet kickoff produced one at a time after the prior slice ships and the owner approves. This refines `docs/design-system.md §18` Phase 1 into sub-slices; Phases 2–6 (route migration) are unchanged and still gated.

**Why PageShell + Section first (not FilterBar/ActionBar):** both are server-safe pure structural wrappers with **zero user-facing text**, consume the existing `.container-wide` (no new tokens, no `globals.css` change), have no client boundary and no governance ambiguity, and are trivially verifiable. FilterBar (Button/Badge/Sheet + Storybook proof complexity) and ActionBar (Button-height governance) are deliberately deferred to their own isolated slices, per the kickoff's "do NOT choose FilterBar/ActionBar first" guidance.

## 7. First Sonnet task produced

**Path:** `tasks/Sprints/Sprint_30_kickoff_prompt_Task_345.md` — **DS-1: PageShell + Section foundation.**

## 8. First Sonnet task scope (summary)

Create **only**: `src/components/layout/PageShell.tsx` (server; `container: wide|narrow|form`, `as: main|div`, §5 rhythm, `wide`→`.container-wide`, `narrow`→`+max-w-3xl mx-auto`, `form`→`+max-w-xl mx-auto`), `src/components/layout/Section.tsx` (server; optional `title`/`description`, `h2 text-xl sm:text-2xl 2xl:text-3xl` in `min-w-0`, heading→body one step, no own container), `src/components/layout/index.ts` (exports ONLY the two), and `PageShell.stories.tsx` + `Section.stories.tsx` (14×4 matrix via Storybook toolbar). Docs: `component-catalog.md` (register 2 Tier-2 primitives) + `backlog.md` + a new session log. **Forbidden:** PageHeader/FilterBar/ActionBar, any `src/app/**` route, `globals.css`, admin primitives, `ui/`/`shared/`/`listing/`/`auth/`, `src/modules/**`, `messages/*.json`, DB/server-actions/business-logic, and any `git` command. Includes all required lero-al sections: literal allowlist, Positive + Negative flow, Current-behavior-to-preserve, AC-1..AC-13, Out-of-scope, Required validation + grep checks, sq/en/uk/it longest-locale proof, all 14 widths, Storybook proof OR `OWNER QA REQUIRED`, zero-git rule, and STOP-&-ASK triggers (incl. "STOP & ASK if rendered QA cannot be completed").

## 9. Business-logic scope (owner clarification 2026-06-01)

Per owner clarification: **Opus MAY inspect existing business logic for planning/context but MUST NOT modify it.** Opus MAY include business-logic-preservation requirements in Sonnet tasks where relevant. For this design-system foundation path, **business-logic changes are out of scope for BOTH Opus AND the first Sonnet task** — Task 345's FORBIDDEN list and Out-of-scope section explicitly exclude DB/Supabase/SQL/migrations/server-actions/business-logic and `messages/*.json`. This session inspected code read-only; it modified none.

## 10. Confirmation — no code implementation by Opus

Opus wrote/edited only `docs/**` and `tasks/**`. No `src/`, no `messages/`, no DB/SQL/migration/server-action/business-logic change. The design system was NOT implemented in code by Opus; implementation is delegated to Sonnet via Task 345. No `git add`/`git commit` run by Opus.

## 11. Files changed (Opus — docs + tasks only)

| File | Change | Rationale |
|---|---|---|
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_345.md` | **NEW** | DS-1 first Sonnet task — PageShell + Section foundation (smallest safe slice) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md` | UPDATE — FROZEN banner at top | Mark Task 343 not-executable; point to DS-1..DS-4 queue |
| `docs/design-system.md` | UPDATE — §18 Phase 1 "Execution note" | Record Task 343 freeze + DS-1..DS-4 graduated queue; route migration still gated |
| `docs/sessions/2026-06-01-task-344-design-system-implementation-path.md` | **NEW** — this log | Diagnosis, inventory, queue, first-task summary, owner git commands |
| `docs/backlog.md` | UPDATE — Last Session block (2–4 lines) | Per agent-contract clause 10 |

## 12. Validation / checks performed (Opus, read-only)

- Confirmed `src/components/layout/` lacks PageShell/PageHeader/Section/FilterBar/ActionBar (only Header/Footer/MobileBottomNav) — DS queue = create, not duplicate.
- Confirmed admin reference primitives (AdminPageShell/AdminPageHeader/AdminTable/AdminCardList) exist and are untouched.
- Confirmed `.container-wide`/`.container-admin` in `globals.css` (≈L379–414); no narrow/form token → DS-1 needs zero `globals.css` change.
- Confirmed `.storybook/preview.tsx` provides sq/en/uk/it locale global + 320→ultrawide VIEWPORTS → 14×4 renderable; `OWNER QA REQUIRED` retained as realistic DS-1 PASS gate.
- Confirmed `package.json` scripts (`build`, `lint`, `typecheck`, `check:i18n`, `build-storybook`, `screenshots:responsive`) — referenced in the kickoff.
- Confirmed Task 345 is smaller than Task 343 (2 server-safe primitives vs 5 incl. client FilterBar + ActionBar governance), has no route migration, no admin edits, no `src/modules` edits, no `messages/*.json`, and carries every required section + the 14×4 / sq-en-uk-it / Storybook-or-OWNER-QA gates + STOP-&-ASK.
- Confirmed Opus changed only `docs/**` + `tasks/**`.

## 13. Owner git commands (single-writer — owner runs in PowerShell; Opus does NOT run git)

If `git status` shows phantom-corruption mods first run:
`Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`

```
git add tasks/Sprints/Sprint_30_kickoff_prompt_Task_345.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md docs/design-system.md docs/sessions/2026-06-01-task-344-design-system-implementation-path.md docs/backlog.md
git commit -m "docs(Task344): reject Task340-as-impl + freeze Task343; graduated DS-1..DS-8 queue + DS-1 Sonnet task (Task345)"
```

---

OWNER REVIEW REQUIRED — new design-system implementation path created; do not start Sonnet until owner approves the first Sonnet task.
