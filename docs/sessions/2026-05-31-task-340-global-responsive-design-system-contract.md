# Session: Task 340 — Global Responsive Design System Contract v1 (Opus 4.7 orchestrator/architect)

> ⚠️ **SUPERSEDED FOR EXECUTION (Task 344, 2026-06-01):** This session is retained as historical provenance for the creation of `docs/design-system.md` and pointer-doc inheritance updates. `docs/design-system.md` remains the canonical rule layer, but Task 340 is **rejected as an implementation path**. Task 343 is **FROZEN / not executable**. The current executable path starts with Task 345 (DS-1 PageShell + Section only), per `docs/backlog.md` and `docs/sessions/2026-06-01-task-344-design-system-implementation-path.md`.

**Date:** 2026-05-31 (executed 2026-06-01)
**Task:** Sprint 30 — Task 340 (Opus architectural). Wave 2, priority order #8.
**Type:** architecture / governance / responsive / design-system (foundational; docs + task files only).
**Source of truth:** owner-uploaded `issues.md` (2026-05-31, ~6100 lines) Sections 1–21 + ADDENDUM. `issues.md` is NOT checked into the repo, so this session embodies its content as the repo-resident canonical doc `docs/design-system.md`, reconciled against the already-shipped Sprint 28 primitives.

---

## Verdict

**SUPERSEDED FOR EXECUTION BY TASK 344 — provenance only.**

Opus produced: (1) the canonical rule-layer contract `docs/design-system.md`; (2) pointer/inheritance updates to 5 existing docs; (3) the historical Phase 1 kickoff `Sprint_30_kickoff_prompt_Task_343.md`.

Current status after Task 344: `docs/design-system.md` is retained as the canonical rule layer, but the original Task 340 implementation path is rejected. Task 343 is FROZEN / not executable. Execution starts with Task 345 (DS-1 PageShell + Section only).

## External references

**Internet not used this session.** Per the kickoff's "External reference requirement" fallback, the contract was derived from the embedded `issues.md` Sections 1–21 + ADDENDUM outline (carried in the Task 340 kickoff) reconciled with the concrete, already-shipped repo facts: `.container-wide` (1408px public) / `.container-admin` (1792px admin) in `globals.css`; the AdminTable `lg:` table↔card switch and column-visibility tokens from Task 306-Fix; `ui-rules.md §15/§16/§17`; `admin-ux-rules.md §11/§14`; Tailwind v4 token set (`sm:640 md:768 lg:1024 xl:1280 2xl:1536`). The principles named in the kickoff (Tailwind mobile-first, Material window-classes, IBM Carbon enterprise consistency, NN/g mobile tables) were used only as the conceptual basis for the lero-al-specific rules; no rule was copied from memory of an external spec beyond these.

## Files changed (Opus — docs + tasks only; zero src/messages/migration)

| File | Change | Rationale |
|---|---|---|
| `docs/design-system.md` | **NEW** — Global Responsive Design System Contract v1 (§1–§21 + ADDENDUM) | Canonical single source of truth for all responsive/layout work |
| `docs/responsive-governance.md` | UPDATE — inheritance banner; 7/9-width verification block marked **SUPERSEDED** → 14-width canon | Point to design-system.md; retire old canon |
| `docs/ui-rules.md` | UPDATE — §17 inheritance banner; item 6 → **14-width × 4-locale** canon (was 9) | Pre-flight checklist uses the new canon |
| `docs/admin-ux-rules.md` | UPDATE — §14 inheritance banner; §14.6 verification gate → 14-width canon | Admin rules now a specialisation of the global contract |
| `docs/rule-index.md` | UPDATE — `design-system.md` added (Required) to "UI/layout/component" + "Admin table" bundles | Future tasks find the contract first |
| `docs/component-catalog.md` | UPDATE — header pointer to §7 Tier-1..4 ownership taxonomy | Catalog categories map to the four tiers |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md` | **NEW** — historical Phase 1 Sonnet foundation sub-task | **FROZEN by Task 344 / not executable**; retained for provenance only |
| `docs/sessions/2026-05-31-task-340-global-responsive-design-system-contract.md` | **NEW** — this log | Per Note 10 |
| `docs/backlog.md` | UPDATE — Last Session block | Per Note 10 |

**No `src/`, `messages/`, migration, script, server-action, or business-logic change by Opus.** Confirmed: this session touched only `docs/**` and `tasks/**`.

## Contract summary (`docs/design-system.md`)

One design system for public + cabinet/auth + admin + shared + future (§1). Mobile-first, CSS-driven, SSR-safe (§2). **14 canonical verification widths** 320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560 × **4 locales** sq/en/uk/it = 56 cells/screen (§3 + ADDENDUM). Five containers — page-container/content-container/data-container/form-container/admin-container mapped to `.container-wide` (1408px public) and `.container-admin` (1792px admin) (§4). Spacing rhythm + forbidden arbitrary values (§5). Typography + `min-w-0`/truncate/line-clamp wrapping rules, uk longest-locale (§6). Four-tier component ownership: Primitive UI / Global layout primitive / Data-surface primitive / Domain component (§7). Public layout (§8), admin layout (§9). `tableAt` decision set — cardOnly/grid/tableAtLg(default)/tableAtXl/detailLayout/formLayout/nonTabular (§10). One global FilterBar/Search/Tabs/ActionBar pattern (§11). Forms: form-container, 44px touch targets, viewport-fitting menus (§12). Cards + grids with mandatory `2xl:` step (§13). One overlay system: Dialog→bottom-Sheet at `<lg`, AlertDialog for destructive, no hand-rolled overlays, z-scale (§14). Forbidden Tailwind/responsive patterns (§15). Inventory entry point (§16). Required grep/audit + classification (§17). Phased migration rule — 6 phases, one kickoff at a time (§18). **Responsive QA: real rendered layout only; code-level analysis is NOT proof** (§19). PASS (§20) / FAIL (§21) definitions. ADDENDUM: 14×4 canon as superseding authority + 17-point localization/wrapping contract.

## Required inventory (snapshots; full tables in `design-system.md §16.A–C`)

### Public site (6 surfaces)
Home, listings index/search, listing detail, contact, static `[slug]`, header/footer. Most already on `.container-wide`. Gaps: listings filter uses a **custom overlay** (→ FilterBar/Sheet); card grids lack the `2xl:` column step; static `[slug]` + reading columns need content-container; Header has raw `<button>`. All → Phase 2.

### Cabinet / auth (4 groups)
Auth pages (login/register/reset/confirm/verified) have **no explicit container** → content-container + form-container. Cabinet uses **custom tabs + inline cards** → Tabs + Card primitives. Favorites grid needs `2xl:` step. Create/edit listing → form-container. All → Phase 3.

### Admin (per-surface `tableAt`)
`/admin/listings` = **migrated reference impl** (`tableAtLg`, Task 306-Fix pilot). `/admin/users`(+new/[id]), support, inquiries(+sales/support), reports → `tableAtLg` (Phase 4); users `[id]` = detailLayout. locations/popular-locations/companies/property-types/pages/legal/currency → `tableAtLg`/`nonTabular` + Tabs (Phase 5). email-templates/footer/settings/permissions → formLayout/nonTabular (Phase 5). dashboard `/admin` → AdminPageShell + Card grid (Phase 5).

## Hardcoded layout-risk audit (baseline 2026-05-31; `rg` over src/app + src/components + src/modules)

| Pattern | Hits | Classification |
|---|---|---|
| `max-w-` | 129 | mixed — container utilities + primitive caps = allowed; per-route content `max-w-*` without a §4 container = must migrate |
| `mx-auto` | 32 | allowed where paired with a §4 container; must migrate where ad-hoc centered width |
| `container-wide\|container-admin` | 32 | allowed — public on `.container-wide` ✅, admin on `.container-admin` ✅; gaps = auth/cabinet/static pages with NO container (must migrate, P2–3) |
| `overflow-x-auto` | 9 | table primitives + gallery/filter scroll-rows = allowed; verify none are toolbars |
| `min-w-[` | 7 | **all allowed** — dropdown/popover min-width, button min (80px), numeric badge (1rem/20px), sort/search control (140/180px). None are content-column width hacks. |
| `w-[` | 36 | mostly chrome (icons/avatars/fixed UI) = allowed; audit per phase for content-width hacks |
| `<table` | 27 | shadcn `ui/table.tsx` + `AdminTable` = allowed; **11 admin `*Manager` raw tables = must migrate** (Phases 4–5); 4 email/notification HTML templates = allowed (email layout) |
| `truncate` | 44 | allowed where in `min-w-0` parent; audit per phase for truncation masking overflow |
| `line-clamp` | 12 | allowed (multi-line card summaries) |
| `hidden lg:block\|lg:hidden` | 11 | allowed — canonical `lg:` switch (AdminTable etc.) |
| `grid-cols-` | 63 | catalog grids must migrate to add `2xl:` step; rest allowed |
| `columns-` | 0 | clean |

**11 raw admin tables to migrate (Phases 4–5):** AdminUsersTable, AdminSupportManager, AdminReportsManager, AdminPropertyTypesManager, AdminPopularLocationsManager, AdminPagesManager, AdminLocationsManager, AdminLegalManager, AdminExchangeProvidersManager, AdminCurrenciesManager, AdminCompaniesManager. (AdminListingsTable already migrated.)

## Historical Phase 1 Sonnet sub-task — FROZEN by Task 344

> Current status: Task 343 is retained for provenance only and MUST NOT be executed. Task 344 supersedes this implementation path with the graduated DS-1..DS-8 queue; Task 345 is the first executable DS-1 slice.

**`tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md`** — creates 5 global Tier-2 layout primitives (`PageShell`, `PageHeader`, `Section`, `FilterBar`, `ActionBar`) in `src/components/layout/` (public/cabinet siblings of the existing admin primitives), each with a Storybook story proving the 14×4 matrix. **Zero route migration; zero route adoption** (proof via Storybook only). Concrete, route-scoped, pass/fail based; Positive + Negative flows; forbids local layout invention and code-level-only PASS; requires browser/Storybook QA OR an explicit `OWNER QA REQUIRED` gate. Includes all canonical sections + AC mapping to flows + STOP & ASK triggers + Files-Changed/no-git contract.

Verified accurate against repo: admin primitives (AdminPageShell/AdminPageHeader/AdminTable/AdminCardList) already exist and are untouched; public side has NO global PageShell/PageHeader/Section/FilterBar/ActionBar (only listings-domain `ListingsFilterBar`/`ListingsShell`), so Phase 1 = create, not duplicate.

## STOP & ASK check

No blocker triggered. Route inventory determinable; existing docs reconcilable (pointer updates applied, no contradiction left); existing admin primitives sufficient as reference; public + admin density differences are container-width only (no owner decision needed); migration explicitly phased (not one task); no duplicate primitive needing reconciliation (admin vs public are intentional siblings). One item for owner awareness, not a blocker: `issues.md` is not in the repo, so the contract is the canonical embodiment of its outline rather than a verbatim copy — owner should confirm the §1–§21 coverage matches their uploaded document.

## Validation performed (Opus, read-only)

- Confirmed `design-system.md` covers public + cabinet/auth + admin and defines containers, spacing, typography, mobile-first, data surfaces, forms, cards, filters, overlays, forbidden patterns, QA rules, PASS/FAIL, locales sq/en/uk/it, and all 14 widths.
- Confirmed pointer docs updated: `responsive-governance.md` (SUPERSEDED), `ui-rules.md §17` (14 widths), `admin-ux-rules.md §14` (inherits + 14 widths), `rule-index.md` (exposed), `component-catalog.md` (taxonomy pointer).
- Confirmed Phase 1 kickoff is the ONLY Sonnet sub-task; it forbids public+admin+cabinet combined migration; it forbids local layout invention; it requires real rendered QA.
- Confirmed zero `src/`/`messages/`/migration changes by Opus (only `docs/**` + `tasks/**`).

## Historical owner git commands — DO NOT USE

These commands are historical output from the original Task 340 session and MUST NOT be used after Task 344. Task 344 already committed `docs/design-system.md`, frozen Task 343, Task 345, and the Task 344 session log. Commit only the remaining pointer-doc inheritance updates and this provenance log in a separate docs-only commit.

If `git status` shows phantom-corruption mods first run:
`Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`

```
git add docs/design-system.md docs/responsive-governance.md docs/ui-rules.md docs/admin-ux-rules.md docs/rule-index.md docs/component-catalog.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_343.md docs/sessions/2026-05-31-task-340-global-responsive-design-system-contract.md docs/backlog.md
git commit -m "docs(Task340): Global Responsive Design System Contract v1 + pointer-doc inheritance + Phase 1 Sonnet sub-task (Task 343)"
```

---

SUPERSEDED FOR EXECUTION BY TASK 344 — provenance only. Do not run Task 343.
