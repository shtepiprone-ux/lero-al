# Sprint 30 — Task 340 kickoff (Opus) — Global Responsive Design System Contract v1 + phased migration plan

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **You do NOT write product code.** You do NOT create an admin-only or public-only task. You do NOT approve "code-level responsive analysis" as PASS. You do NOT let Sonnet invent new spacing/layout/width/card/table styles locally.
>
> **🚨 Explicit forbid (per owner comment on Task 340):** the first Sonnet sub-task produced by this Opus session MUST NOT be a single migration task that touches public + admin + cabinet at once. The first Sonnet sub-task is **Phase 1 foundation primitives only**. Migration of route groups (Phases 2–5) requires separate kickoffs after Phase 1 owner approval.
>
> **Numbering:** Task 340 = Opus architectural (renumbered from old "339"). Phase 1 Sonnet sub-task ≥ 343. Phases 2–6 Sonnet kickoffs produced in subsequent sessions. Wave 2.
>
> **Source:** `issues.md` 2026-05-31 — "Create Global Responsive Design System Contract v1 + produce Sonnet migration plan/task" + ADDENDUM (14-width × 4-locale canon supersedes 7/9-width canons).

```
Type:     architecture / governance / responsive / design-system (foundational)
Priority: high
Area:     docs/design-system.md (NEW — canonical global source of truth)
          docs/responsive-governance.md (UPDATE — point to design-system.md; mark 7/9-width SUPERSEDED)
          docs/ui-rules.md (UPDATE — §17 points to design-system.md)
          docs/admin-ux-rules.md (UPDATE — §14 inherits from global contract)
          docs/component-catalog.md (UPDATE if categories clarified)
          docs/rule-index.md (UPDATE — expose design-system.md)
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (Phase 1 Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-340-global-responsive-design-system-contract.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20 / 22
3. `docs/rule-index.md`
4. `docs/ui-rules.md`
5. `docs/responsive-governance.md`
6. `docs/component-rules.md` + `docs/component-governance.md` + `docs/component-catalog.md`
7. `docs/admin-ux-rules.md` (§1–§14)
8. `docs/governance-checklists.md`
9. `docs/qa-rules.md`
10. `docs/sessions/2026-05-31-task-306-admin-shell-primitives.md` + `docs/sessions/2026-05-31-task-306-fix-admin-responsive-contract.md`
11. `tasks/Sprints/Sprint_28_kickoff_prompt_Task_306_Fix.md`
12. `src/app/globals.css` + Tailwind config + `package.json`

## External reference requirement

Do NOT invent rules from memory. Use external references ONLY to derive concrete lero-al rules:
1. Tailwind official responsive design (mobile-first, breakpoint-prefixed progressive enhancement; Tailwind = implementation tooling).
2. Material adaptive layout principles (window-class adaptation).
3. IBM Carbon (enterprise product UI consistency).
4. NN/g mobile tables / data-table usability.

If internet unavailable: state in session log; use embedded contract content from `issues.md` (verbatim Sections 1–21 + ADDENDUM) as source of truth.

## Required outcome

One global responsive design-system contract that all future Sonnet tasks must follow. One **Phase 1 foundation Sonnet sub-task** that creates/normalises global primitives (containers + PageShell + PageHeader + Section + FilterBar + ActionBar) — **NOT a route migration**.

## Required Opus output

### 1. Canonical doc `docs/design-system.md`

Embed full contract content from `issues.md` Sections 1–21 + ADDENDUM:

1. One design system (public + cabinet/auth + admin + shared + future).
2. Mobile-first principle.
3. Canonical viewport bands (14 widths): **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560**.
4. Global container system (`page-container`, `content-container`, `data-container`, `form-container`, `admin-container`).
5. Global spacing system (named tokens / canonical utility patterns + rhythm).
6. Typography + text wrapping rules.
7. Component system ownership (primitive UI / global layout primitive / data-surface primitive / domain component).
8. Public site layout rules.
9. Admin layout rules (AdminPageShell / AdminTable / AdminCardList — Sprint 28 primitives).
10. Data tables / cards / lists — tableAt decisions (cardOnly / grid / tableAtLg / tableAtXl / detailLayout / formLayout / nonTabular).
11. Filters / search / tabs / actions — one global pattern.
12. Forms — global rules; 44px touch targets; dropdown menus fit viewport.
13. Cards + grids.
14. Dialogs / sheets / dropdowns — consistent across public/admin/cabinet.
15. Forbidden Tailwind patterns (per `issues.md` §15).
16. Required inventory (public / cabinet/auth / admin).
17. Required grep/audit.
18. Implementation planning rule — phased migration.
19. Responsive QA rule — real rendered layout verification; code-level analysis NOT proof.
20. Definition of PASS.
21. Definition of FAIL.
+ ADDENDUM — 14-width × 4-locale canon (verbatim).
+ Localization + wrapping contract (per ADDENDUM Sections 1–17).

### 2. Doc updates to point to the new canonical source

- `docs/responsive-governance.md` — UPDATE; 7/9-width lists marked SUPERSEDED with pointer to `docs/design-system.md`.
- `docs/ui-rules.md` §17 — UPDATE to reference `docs/design-system.md`.
- `docs/admin-ux-rules.md` §14 — UPDATE so admin rules INHERIT from global contract.
- `docs/rule-index.md` — UPDATE so future tasks find `docs/design-system.md` in "UI / layout / component task" bundle.
- `docs/component-catalog.md` — UPDATE if categories clarified by §7.

### 3. Required inventory

A. Public site: route/path · primary component files · current container/wrapper · current `max-w-*`/`mx-auto` usage · current grid/list/card/table/form pattern · current filters/search/actions · current responsive risks · current text clipping/truncation risks · target global primitive/container · migration complexity · proposed phase.

B. Cabinet/auth: same fields.

C. Admin: same fields + tableAt decision + required `cardRow` content.

### 4. Required grep/audit (paste results in session log)

```
rg -n "max-w-" src/app src/components src/modules
rg -n "mx-auto" src/app src/components src/modules
rg -n "container-wide|container-admin" src/app src/components src/modules
rg -n "overflow-x-auto" src/app src/components src/modules
rg -n "min-w-\\[" src/app src/components src/modules
rg -n "w-\\[" src/app src/components src/modules
rg -n "<table" src/app src/components src/modules
rg -n "truncate" src/app src/components src/modules
rg -n "line-clamp" src/app src/components src/modules
rg -n "hidden lg:block|lg:hidden" src/app src/components src/modules
rg -n "grid-cols-" src/app src/components src/modules
rg -n "columns-" src/app src/components src/modules
```

Classify each: `allowed global primitive usage` / `allowed form/content exception` / `must migrate` / `needs owner decision`.

### 5. Phased migration plan

- **Phase 1 — Global Design System Foundation (kickoff produced now).** Create/normalize global containers + PageShell/PageHeader/Section/FilterBar/ActionBar primitives if missing. Document spacing/container/typography rules. **NO large route migration** — only proves primitives. This is the only Sonnet kickoff produced by THIS Opus session.
- **Phase 2 — Public Site Critical Responsive Migration.** Homepage, listing grid/search, listing detail, public header/footer, auth entry points.
- **Phase 3 — Cabinet/Auth Responsive Migration.** Login/register, profile/cabinet, favorites/collections, create/edit listing flows.
- **Phase 4 — Admin Data Surfaces Migration.** Listings, users, tickets, support, sales, reports.
- **Phase 5 — Admin Config/Content Pages Migration.** Locations, popular-locations, companies, pages, property-types, currency, email-templates, footer, settings, permissions.
- **Phase 6 — Final Global Sweep.** Remove leftover hardcoded layout patterns; verify component catalog; verify docs; full QA matrix; owner visual approval.

Phase 2–6 kickoffs are NOT produced by this Opus session. They are produced one at a time after Phase 1 ships and owner approves the contract.

### 6. STOP & ASK triggers (per `issues.md`)

Opus stops + asks owner if: complete route inventory cannot be determined; existing docs conflict with global contract; current primitives insufficient + new global primitives needed; public + admin need different visual density requiring owner approval; full migration too large for one task; route requires justified container exception; business-critical mobile behavior unclear; cannot produce concrete pass/fail rules; cannot produce route-by-route implementation scope; component catalog has duplicate primitives that must be reconciled first.

### 7. Session log + backlog update

Standard.

## Acceptance criteria for THIS Opus task

- `docs/design-system.md` created with full contract from `issues.md` Sections 1–21 + ADDENDUM.
- `docs/responsive-governance.md` updated (7/9-width SUPERSEDED).
- `docs/ui-rules.md` §17 updated.
- `docs/admin-ux-rules.md` §14 updated.
- `docs/rule-index.md` updated.
- Contract covers public + cabinet/auth + admin.
- Contract defines containers, spacing, typography, mobile-first rules, data surfaces, forms, cards, filters, overlays, forbidden Tailwind patterns, QA rules, PASS/FAIL.
- Contract includes locales sq/en/uk/it.
- Contract includes 14 widths (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560).
- Public + cabinet/auth + admin inventories completed.
- Hardcoded layout-risk grep/audit completed + classified.
- **Only Phase 1 Sonnet sub-task produced** (foundation primitives; NO route migration).
- Phase 1 kickoff is concrete + route-scoped + pass/fail based.
- Phase 1 kickoff forbids local layout invention + code-level PASS.
- Phase 1 kickoff requires browser QA OR OWNER QA REQUIRED.
- Phase 1 kickoff includes ALL canonical sections (Positive flow · Negative flow · Current behavior to preserve · etc.).
- NO `src/` / `messages/` / migration changes by Opus.
- Orchestrator emits commit commands at end of session.

## Final line of Opus session must be exactly

```
OWNER REVIEW REQUIRED — do not start Sonnet implementation yet.
```

or

```
STOP & ASK — blocker found.
```

## Out of scope

- Do NOT edit runtime product code.
- Do NOT migrate components yourself.
- Do NOT edit `messages/*.json`.
- Do NOT touch DB / Supabase / SQL / schema / migrations / server actions / business logic.
- Do NOT create an admin-only / public-only task.
- Do NOT create another pilot-only task.
- Do NOT create a task that allows page-specific layout invention.
- Do NOT let "code-level analysis" count as final responsive QA.

## Final report

Verdict (OWNER REVIEW REQUIRED / STOP & ASK); files changed; external references used (or internet unavailable); summary of contract; public route inventory; cabinet/auth inventory; admin route inventory; hardcoded layout risk audit summary; Phase 1 Sonnet sub-task path; confirmation no `src/` / `messages/` / business-logic changes + no implementation starts before owner approval; validation performed; explicit-path owner git commands.
