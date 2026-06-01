> # ⛔ FROZEN — DO NOT EXECUTE (owner decision, 2026-06-01, Task 344)
> **Task 343 is NOT approved for implementation and must NOT be run by Sonnet.** It bundled all five
> primitives (PageShell + PageHeader + Section + FilterBar + ActionBar) — including FilterBar's client
> Sheet state / conditional-Reset logic and ActionBar's Button-height governance — plus a 5×56-cell
> Storybook QA burden into a single kickoff. That breadth is loop-prone and low-verifiability (the exact
> failure mode that stalled prior Sonnet sessions). **Superseded by the graduated DS-1..DS-4 queue.**
> The foundation is now built in small slices, smallest first:
> **DS-1 = `tasks/Sprints/Sprint_30_kickoff_prompt_Task_345.md` (PageShell + Section only)** ← run this instead.
> DS-2 PageHeader · DS-3 ActionBar · DS-4 FilterBar follow one at a time after owner approval.
> Full rationale + queue: `docs/sessions/2026-06-01-task-344-design-system-implementation-path.md`.
> This file is retained for reference/provenance only. Do not delete; do not execute.
>
> ---

# Sprint 30 — Task 343 kickoff (Sonnet) — Phase 1: Global Design System Foundation primitives (NO route migration) — ⛔ FROZEN, see banner above

> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Parent:** Task 340 (Opus) — `docs/design-system.md` (Global Responsive Design System Contract v1).
> This is **Phase 1** of the §18 phased migration: *foundation primitives only*. Phases 2–6 (route
> migration) are SEPARATE kickoffs produced later, one at a time, after owner approval. **You migrate
> ZERO routes in this task.**
>
> **🚨 Hard scope ceiling (owner rule on Task 340):** this task creates/normalizes global layout
> primitives + Storybook proof ONLY. You MUST NOT touch `src/app/**` route files, you MUST NOT adopt
> the new primitives in any page, and you MUST NOT touch admin/public/cabinet route layouts. Touching
> a route file = scope violation = STOP & ASK.
>
> **Single-writer git:** you do NOT run `git add`/`git commit`. End your session with a "Files Changed"
> table only; the orchestrator emits commit commands.

```
Type:     UI / layout / design-system foundation (primitives only)
Priority: high
Phase:    1 of 6 (docs/design-system.md §18)
Area (ALLOWED to touch):
          src/components/layout/PageShell.tsx        (NEW)
          src/components/layout/PageHeader.tsx        (NEW)
          src/components/layout/Section.tsx           (NEW)
          src/components/layout/FilterBar.tsx         (NEW — global; distinct from listings-only ListingsFilterBar)
          src/components/layout/ActionBar.tsx         (NEW)
          src/components/layout/index.ts              (NEW or UPDATE — barrel export)
          src/components/layout/*.stories.tsx         (NEW — one story file per primitive)
          src/app/globals.css                         (UPDATE — ADDITIVE only: optional .container-narrow / .container-form helpers if §4 composition needs them; do NOT change .container-wide / .container-admin)
          messages/sq.json · en.json · uk.json · it.json (NOT expected — primitives take all labels via props; Storybook labels are story-only local strings — see AC-7)
          docs/component-catalog.md                   (UPDATE — register the 5 new primitives under §7 Tier-2)
          docs/backlog.md                             (UPDATE — Last Session block)
          docs/sessions/2026-05-31-task-343-phase1-foundation-primitives.md (NEW — session log)
Area (FORBIDDEN to touch):
          src/app/** (any route/page/layout)  ·  any src/modules/** domain component  ·
          src/components/admin/** (Sprint 28 primitives are the reference, NOT to be edited)  ·
          DB / Supabase / SQL / migrations / server actions / business logic
```

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / component task")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` ← **the contract. §4 (containers), §5 (spacing), §6 (typography), §7 (ownership taxonomy), §11 (FilterBar/ActionBar pattern), §13 (cards/grids), §19–§21 (QA + PASS/FAIL).** This is your source of truth.
2. `docs/ui-rules.md` (esp. §0 single-source primitives, §15 control height, §16 z-index, §17 pre-flight).
3. `docs/component-rules.md`.
4. `docs/qa-rules.md`.

**Only if relevant:** `docs/component-governance.md`, `docs/responsive-governance.md`, `docs/tailwind-canonical-fragments.md`.

**Reference implementations to MIRROR (read, do NOT edit):**
- `src/components/admin/AdminPageShell.tsx` — the admin equivalent of PageShell (uses `.container-admin`). Your public `PageShell` is its sibling using `.container-wide`.
- `src/components/admin/AdminPageHeader.tsx` — the admin equivalent of PageHeader.
- `src/components/admin/AdminTable.tsx` / `AdminCardList.tsx` — the `lg:` switch + `compact` prop conventions to match in your primitives' API style.

## What already exists (do not duplicate)

- Admin side has `AdminPageShell`, `AdminPageHeader`, `AdminTable`, `AdminCardList` (Sprint 28 / Task 306-Fix). **Keep them untouched.** Your new primitives are the **public/cabinet/global** siblings.
- Containers `.container-wide` (public, 1408px) and `.container-admin` (admin, 1792px) already exist in `globals.css`. **Do not modify them.** Your primitives consume `.container-wide` (public default).
- `ListingsFilterBar` and `ListingsShell` are **listings-domain** components (Tier 4). They are NOT the global `FilterBar`. Do not edit or delete them in this task; Phase 2 reconciles them onto the global `FilterBar`.

## Required outcome

Five global Tier-2 layout primitives (`docs/design-system.md §7`) created in `src/components/layout/`, each:
- API-typed (props interface exported), `'use client'` only if it needs interactivity. **FilterBar** is client (Sheet open state). **ActionBar, PageShell, PageHeader, Section are server-safe** — keep them server components; do NOT add `'use client'` to ActionBar (see spec #5) unless orchestrator-approved.
- Composes existing Tier-1 primitives (Button, etc.) and the §4 containers — **invents no new container/spacing/width**.
- Carries a Storybook story proving the §19 QA matrix (14 widths × 4 locales) for that primitive.
- Adopted by **zero** routes (proof is via Storybook only).

### Primitive specs (literal)

**1. `PageShell`** — outermost public/cabinet page wrapper.
- Props: `children`, `as?` (default `<main>` vs `<div>`), `container?: 'wide' | 'narrow' | 'form'` (default `'wide'`), `className?`.
- Renders `.container-wide` (default). `'narrow'` = `.container-wide` + inner `max-w-3xl mx-auto` (content-container, §4). `'form'` = inner `max-w-xl mx-auto` (form-container, §4). Vertical rhythm `py-8 sm:py-12 lg:py-16 2xl:py-20` (§5) — overridable via `className`.
- No fixed pixel width; never exceeds 1408px.

**2. `PageHeader`** — page title cluster (public/cabinet sibling of AdminPageHeader).
- Props: `title: string`, `subtitle?: string`, `countBadge?: ReactNode`, `actions?: ReactNode`, `className?`.
- Layout: title (`text-xl sm:text-2xl 2xl:text-3xl`, §6) + optional badge inline; subtitle below; `actions` right-aligned at `md:+`, stacked `<md` (mirror AdminPageHeader). Title row carries `min-w-0` + `truncate`-safe so long uk/sq titles don't push `actions` off-screen (§6).

**3. `Section`** — a titled content block inside a page.
- Props: `title?: string`, `description?: string`, `children`, `className?`.
- Vertical rhythm per §5; heading → body one step (`mb-4`/`mb-6`). No own container (sits inside PageShell).

**4. `FilterBar`** — global filter/search/reset cluster (§11).
- Props: `children` (filter chips/controls), `search?: ReactNode`, `onReset?: () => void`, `activeCount?: number`, `labels: { filters: string; reset?: string }`, `className?`.
- **No hardcoded user-facing labels.** FilterBar MUST NOT hardcode `"Filters"`, `"Reset"`, `"Clear"`, or any other user-facing string. The mobile Sheet trigger label MUST come from `labels.filters`. All visible text is consumer-supplied via `labels`.
- Layout: `flex flex-wrap items-center gap-2`; search slot `min-w-0 flex-1`; at `<lg:` overflow filters collapse into a Sheet triggered by a Button whose label is `labels.filters`, with the `activeCount` badge. Uses canonical `Sheet`, `Button`, `Badge` — no hand-rolled overlay (§14/§15). Never `overflow-x-auto` on the bar (§11/§15).
- **Reset rendering rule:** the Reset Button renders **only when ALL of**: `activeCount > 0` **AND** `onReset` is provided **AND** `labels.reset` is provided. If any is missing, no Reset button is shown (no crash, no placeholder, no default English label). A consumer that wants Reset visible MUST pass `labels.reset` from i18n / domain copy.
- `'use client'` (it manages the Sheet open state — this is the concrete interactive state that justifies the client boundary).

**5. `ActionBar`** — page-level action cluster (§11).
- Props: `children` (Buttons), `align?: 'start' | 'end'` (default `'end'`), `className?`.
- Layout: `flex items-center gap-2`; right-aligned `md:+`, stacked `<md`; all Buttons share one height (§ `ui-rules.md §15`); wraps rather than horizontally scrolls (§15).
- **ActionBar MUST remain a server-safe component.** Do NOT add `'use client'` to ActionBar — it holds no state (it is a pure layout wrapper around consumer-passed Buttons). A client boundary may only be introduced if a concrete interactive state is added AND the orchestrator approves it (STOP & ASK first).

### Optional `globals.css` additive helpers (only if needed)

If, and only if, the `'narrow'`/`'form'` container variants are cleaner as named utilities than inline `max-w-*`, you MAY add ADDITIVE `.container-narrow` (`max-w-3xl`) / `.container-form` (`max-w-xl`) utilities. **Do not modify `.container-wide` / `.container-admin` / existing tokens.** If you can express them with existing Tailwind `max-w-*` inline, prefer that (fewer utilities — §4 "avoid utility proliferation"). State your choice in the session log.

---

## Positive flow (happy path) — primitive rendering proof

Because this task adds primitives with **no route adoption**, the "happy path" is the primitives rendering correctly in Storybook and in a typecheck/build.

- **Actor:** developer / Storybook.
- **Preconditions:** clean `main`; admin primitives untouched; containers unchanged.
- **Steps & expected responses:**
  1. Import `{ PageShell, PageHeader, Section, FilterBar, ActionBar }` from `@/components/layout` → all resolve from the barrel.
  2. Render `PageShell container="wide"` with a `PageHeader` (title + actions=ActionBar) + a `Section` + a `FilterBar` → renders a centered ≤1408px column, header title left + actions right at `md:+`, stacked `<md`.
  3. Storybook story for each primitive renders at the 14 canon widths × sq/en/uk/it (use the existing Storybook viewport/locale tooling; mirror `AdminPageShell.stories.tsx` / `AdminTable.stories.tsx`).
  4. `FilterBar` at `<lg:` shows the Sheet trigger labelled `labels.filters` with `activeCount` badge; opening the Sheet reveals the filter children; Reset (rendered only when `activeCount > 0` + `onReset` + `labels.reset`) calls `onReset`.
  5. `ActionBar` with 3 long-label Buttons at 320px uk → wraps, no horizontal overflow, all buttons same height.
- **Success state:** `npx tsc --noEmit` = 0; `npm run build` ✅; `npm run lint` 0/0 new; all stories render; 14×4 matrix PASS per primitive.
- **Post-conditions:** zero route files changed; admin primitives byte-identical; `.container-wide`/`.container-admin` byte-identical; component catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch)

For each primitive prop edge, the primitive must degrade gracefully — verified in a story variant:

- **Empty/optional props:** `PageHeader` with no `subtitle`/`actions`/`countBadge` → renders title only, no empty wrappers, no layout shift. `Section` with no `title`/`description` → renders children only. `FilterBar` with `activeCount=0` → no Reset button shown. → Story variant required for each.
- **Overflow / long locale:** longest uk/sq title in `PageHeader` at 320 → truncates within `min-w-0`, never pushes `actions` off-screen; `ActionBar` long labels at 320 → wraps. → Story at uk 320 mandatory.
- **Many filters:** `FilterBar` with 10+ filter children at 768 → overflow collapses into the Sheet, bar itself never horizontally scrolls. → Story variant.
- **Sheet dismiss paths (FilterBar):** Esc, backdrop click, and the `labels.filters` toggle all close the Sheet (delegated to the canonical `Sheet` primitive — verify, do not re-implement). → Story + manual note.
- **Reset absence paths (FilterBar):** Reset must NOT render when any of `activeCount > 0` / `onReset` / `labels.reset` is missing — verify all three negative combinations (activeCount=0; onReset undefined; labels.reset undefined) render no Reset button and do not crash. → Story variants.
- **Server/client boundary:** PageShell/PageHeader/Section/**ActionBar** MUST stay server components (no `'use client'`) unless a passed child forces client; passing a client `actions`/`children` node must not error. **Only FilterBar** is client (Sheet open state). → Confirm in session log which are client and why (no client-boundary sprawl — `responsive-governance.md §4`).
- **No-locale-string path:** primitives take ALL user-facing labels via props (FilterBar via `labels.filters` / `labels.reset`), so they ship **zero hardcoded user-facing strings**. No `messages/*.json` change is expected — Storybook/test labels are local story-only strings, not runtime app strings. → grep proof in session log.

## Current behavior to preserve (Note 19 + Note 20)

- **Every existing route renders identically** — because no route imports the new primitives. Prove with: `rg -n "from '@/components/layout/(PageShell|PageHeader|Section|FilterBar|ActionBar)'" src/app src/modules` → **0 hits** (no adoption).
- **Admin primitives unchanged:** `git diff --stat` shows no `src/components/admin/**` changes.
- **Containers unchanged:** `git diff src/app/globals.css` shows ONLY additive helper lines (if any); `.container-wide`/`.container-admin`/`.max-w-*` blocks untouched.
- **`ListingsFilterBar` / `ListingsShell` untouched** (Phase 2 reconciles them).
- No existing interactive control removed anywhere (trivially true — no route touched; confirm in log).

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** `PageShell.tsx` created with `container: 'wide'|'narrow'|'form'` + §5 rhythm. → *Positive step 2* — verifiable at `src/components/layout/PageShell.tsx:line`.
- **AC-2** `PageHeader.tsx` created (title/subtitle/countBadge/actions; `min-w-0` title; actions right `md:+`/stacked `<md`). → *Positive step 2 + Negative "long locale"* — file:line.
- **AC-3** `Section.tsx` created (§5 rhythm; optional title/description). → *Negative "empty props"* — file:line.
- **AC-4** `FilterBar.tsx` created (flex-wrap; search `min-w-0 flex-1`; `<lg:` Sheet collapse with trigger label = `labels.filters`; `labels: { filters; reset? }` prop; **no hardcoded "Filters"/"Reset"/"Clear"**; Reset renders ONLY when `activeCount > 0` AND `onReset` AND `labels.reset`; canonical Sheet/Button/Badge; no overlay; no `overflow-x-auto`). → *Positive step 4 + Negative "many filters"/"dismiss"/"reset absence"* — file:line.
- **AC-5** `ActionBar.tsx` created (right `md:+`/stacked `<md`; one Button height; wraps not scrolls). **Server-safe — NO `'use client'`.** → *Positive step 5 + Negative "overflow"/"boundary"* — file:line.
- **AC-6** Barrel `src/components/layout/index.ts` exports all five. → *Positive step 1* — file:line.
- **AC-7** Primitives ship **zero hardcoded user-facing strings** — all labels via props (FilterBar via `labels`). grep the 5 primitive files for literal `"Filters"`/`"Reset"`/`"Clear"` → 0 hits. **No `messages/*.json` change expected** (Storybook labels are story-only local strings). → grep proof in session log.
- **AC-8** One Storybook story per primitive, each rendering the **14-width × 4-locale** matrix (mirror `AdminPageShell.stories.tsx`). → *Positive step 3* — file:line per story.
- **AC-9** Negative-flow story variants exist: empty-props, uk@320 overflow, 10+ filters collapse, FilterBar dismiss, **FilterBar reset-absence (3 combos: activeCount=0 / no onReset / no labels.reset)**, ActionBar wrap. → *Negative flow* — file:line.
- **AC-10** **Zero route adoption:** `rg` for imports of the new primitives in `src/app`/`src/modules` = 0 hits. → *Current behavior to preserve* — pasted grep in log.
- **AC-11** `.container-wide`/`.container-admin` unchanged; any `globals.css` change is additive-only. → `git diff` excerpt in log.
- **AC-12** Admin primitives + `ListingsFilterBar`/`ListingsShell` unchanged. → `git diff --stat` in log.
- **AC-13** `docs/component-catalog.md` registers the 5 primitives as §7 Tier-2 global layout primitives. → file:line.
- **AC-14** Self-validation block present (Note 18): `npx tsc --noEmit`=0, `npm run build` ✅, `npm run lint` 0/0, `npm run check:i18n` PASS, AC-by-AC table all green, `ui-rules.md §17` pre-flight output (non-canonical-dropdown grep, control-height, z-index, overflow@320 uk, 14 widths, touch targets, 4 locales), scope=clean.
- **AC-15** §19 responsive QA: **14 widths × 4 locales** rendered evidence per primitive (Storybook screenshots strongly preferred) OR an explicit `OWNER QA REQUIRED` gate recorded. Code-level analysis alone is NOT PASS (§19/§21).
- **AC-16** "Files Changed" table in the session log (one row/path + rationale). **No `git add`/`git commit` emitted by you.**

## QA / verification gate (MANDATORY — from `docs/design-system.md §19`)

- Render each primitive's Storybook story at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells/primitive).
- Walk **uk @ 320** for each primitive end-to-end (longest-locale overflow guard).
- Run the `ui-rules.md §17` pre-flight checklist and paste output into the session log.
- **Either** paste browser/Storybook screenshot evidence **OR** write `OWNER QA REQUIRED` and stop before claiming PASS. A code-level-only matrix is a §21 FAIL.

## STOP & ASK triggers

- A primitive cannot be built without adopting it in a route to prove it → STOP (do not migrate a route).
- The `'narrow'`/`'form'` container needs a change to `.container-wide`/`.container-admin` → STOP.
- A required canonical Tier-1 primitive (Sheet/Button/Badge) is missing or insufficient → STOP.
- A primitive appears to need a hardcoded user-facing string (it should not — all labels come via props, e.g. FilterBar `labels`) → STOP rather than hardcode.
- Storybook locale/viewport tooling cannot render the 14×4 matrix → STOP (report; do not substitute code-level analysis as PASS).

## Out of scope (DO NOT)

- Do NOT adopt the primitives in any page/route (`src/app/**`).
- Do NOT edit admin primitives, `ListingsFilterBar`, `ListingsShell`, or any `src/modules/**` component.
- Do NOT modify `.container-wide` / `.container-admin` / existing `globals.css` tokens.
- Do NOT touch DB / Supabase / SQL / server actions / business logic / `messages/*` beyond AC-7.
- Do NOT run `git add` / `git commit` (single-writer rule).
- Do NOT present code-level analysis as final responsive QA.

## Final report (write in session log + `docs/backlog.md`)

Verdict; Files Changed table; AC-by-AC self-audit; `ui-rules.md §17` pre-flight output; 14×4 QA matrix (or `OWNER QA REQUIRED`); confirmation of zero route adoption + admin/containers untouched; client-vs-server boundary note per primitive. End with the "Files Changed" table — **no git commands** (orchestrator emits them on review).
