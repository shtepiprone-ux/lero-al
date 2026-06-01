# Sprint 30 — Task 349 kickoff (Sonnet) — DS-4: FilterBar primitive (NO route migration) — HIGH RISK, ISOLATED

> **Status: QUEUED — HIGH risk, isolated on purpose.** Runs only AFTER DS-3 (Task 348, ActionBar) has
> shipped, been reviewed, and been **owner-approved + committed**. Do not start until the orchestrator
> releases this slice. This is the hardest foundation primitive (client `Sheet` state + conditional Reset +
> overflow collapse + i18n-safe labels) and is deliberately alone in its own slice.
> **Dependency:** DS-1/DS-2/DS-3 (`PageShell`/`Section`/`PageHeader`/`ActionBar`) must exist on disk. If missing → STOP & ASK.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system foundation (1 primitive only — CLIENT component, highest risk)
Priority: high
Area:     design-system / responsive / layout / filters
Phase:    DS-4 of the design-system foundation queue
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — nothing else):
          src/components/layout/FilterBar.tsx          (NEW — 'use client')
          src/components/layout/index.ts               (UPDATE — ADD FilterBar; keep PageShell/Section/PageHeader/ActionBar exports)
          src/components/layout/FilterBar.stories.tsx  (NEW)
          docs/component-catalog.md                    (UPDATE — register FilterBar under §7 Tier-2)
          docs/backlog.md                              (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-349-ds4-filterbar.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          src/components/layout/PageShell.tsx · Section.tsx · PageHeader.tsx · ActionBar.tsx  (DS-1..3 — READ; do NOT edit)
          src/components/layout/Header.tsx · Footer.tsx · MobileBottomNav.tsx     (existing — do NOT edit)
          src/components/ui/sheet.tsx · input.tsx · badge.tsx · button.tsx (+ any ui primitive)  (CONSUMED AS-IS; do NOT restyle)
          src/components/shared/FiltersPanel.tsx · ListingsFilters · Filter*      (these are MIGRATION TARGETS for a LATER phase — do NOT edit/adopt now)
          src/app/** (ANY route/page/layout)  ·  src/app/globals.css             (no token change this slice)
          src/components/admin/**  ·  listing/** · auth/**  ·  src/modules/**
          messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You implement EXACTLY the acceptance criteria — ONE new **client**
layout primitive (`FilterBar`) that provides the canonical filter-chip + search + reset row with `<lg:`
overflow collapse into a Sheet, an active-filter count badge, and a single global Reset, with all labels
supplied via an i18n-safe `labels` prop (NO `messages/*.json` change). You consume `Sheet`/`Input`/`Badge`/
`Button` AS-IS. You do NOT migrate or adopt any route, do NOT edit the existing `shared/` filter pieces
(they are migration targets for a later phase, not now), do NOT change `globals.css`, do NOT run git.
Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real diff and emits git commands.

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / component task")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — source of truth. Read **§5 (spacing), §7 (Tier-2 ownership), §11.1 (FilterBar rule ~line 186: `flex flex-wrap items-center gap-2`; `<lg:` collapses overflow filters into a Sheet "Filters" trigger; active-filter count badge + single global Reset; no per-route custom accordion/overlay), §11.2 (Search: Input primitive inside FilterBar, `min-w-0 flex-1`), §12 (touch ≥44px), §19–§21 (QA + PASS/FAIL).**
2. `docs/ui-rules.md` (§0 single-source primitives, §15 Button height, §17 pre-flight checklist).
3. `docs/component-rules.md`, `docs/qa-rules.md`, `docs/state-authority.md` (client-state authority — FilterBar holds only local UI state: Sheet open + nothing route-owned).
4. DS-1/DS-2/DS-3 session logs (sibling style) + `src/components/admin/AdminPageShell.tsx` (its FilterBar slot is the reference placement).

**Reference primitives to CONSUME (read, do NOT edit):**
- `src/components/ui/sheet.tsx` — the `<lg:` overflow container ("Filters" trigger → Sheet). Use as-is.
- `src/components/ui/input.tsx` — the canonical search input (`min-w-0 flex-1`). Use as-is.
- `src/components/ui/badge.tsx` — the active-filter count badge. Use as-is.
- `src/components/ui/button.tsx` — Reset + Filters trigger buttons. Use as-is.
- `src/components/shared/FiltersPanel.tsx` / `ListingsFilters` — **MIGRATION TARGETS for a later phase; READ for context only, do NOT edit or import.** FilterBar is a NEW generic primitive in `layout/`, not a refactor of these.

## Problem

`docs/design-system.md §11.1` mandates ONE global FilterBar primitive (chips + search + reset; `<lg:` Sheet
collapse; count badge; single Reset). Today filtering is a per-route custom accordion/overlay
(`ListingsFilters`) — exactly the local invention `§7`/`§11.1` forbid. FilterBar is the highest-risk
foundation primitive: it is the only one with a client boundary (Sheet open-state), a conditional 3-way
Reset render, 10+ filter overflow-collapse, a Badge count, and i18n-safe labels. It is isolated in its own
slice so a defect here cannot block the trivial structural primitives, and so its 14×4 proof is reviewable alone.

## Goal

Create ONE **client** Tier-2 primitive — `FilterBar` — implementing the §11.1/§11.2 canonical filter row by
COMPOSING existing `Sheet`/`Input`/`Badge`/`Button` primitives, with all user-facing text injected via an
i18n-safe `labels` prop (no `messages/*.json` change). Register it in the barrel + catalog. **Zero route adoption.**

## Current behavior to preserve (Note 19 + Note 20)

- **DS-1/DS-2/DS-3 primitives unchanged** (you only ADD a barrel line). → `git diff` empty.
- **Consumed ui primitives unchanged** — `sheet.tsx`/`input.tsx`/`badge.tsx`/`button.tsx` byte-identical. → `git diff` empty.
- **`shared/` filter pieces unchanged** — `FiltersPanel`/`ListingsFilters`/`Filter*` byte-identical (they are a LATER migration target). → `git diff --stat src/components/shared` empty.
- **Existing barrel exports preserved** — `index.ts` still exports PageShell/Section/PageHeader/ActionBar; you ADD FilterBar.
- **Every existing route renders identically** — no route imports `FilterBar`; the legacy `ListingsFilters` filtering on `/listings` still works untouched. → grep = 0 hits.
- Admin primitives, `Header`/`Footer`/`MobileBottomNav`, `globals.css` unchanged. No existing control removed anywhere.

## Required after behavior

`import { ..., FilterBar } from '@/components/layout'` resolves. At `lg:+` FilterBar renders filter chips +
search + reset inline (`flex flex-wrap items-center gap-2`); at `<lg:` overflow filters collapse behind a
"Filters" Sheet trigger that opens a Sheet containing them; an active-filter **count Badge** appears when ≥1
filter is active; a **single global Reset** renders only when ≥1 filter is active (conditional 3-way: hidden
when 0 active, inline at `lg:+`, inside the Sheet at `<lg:` — confirm exact placement against §11.1, STOP &
ASK if ambiguous); the search Input is `min-w-0 flex-1` so it shrinks and never pushes the row; all labels
come from the `labels` prop; nothing overflows horizontally at any of the 14 widths × 4 locales.

### Primitive spec (literal)

**`FilterBar`** — global filter/search/reset row (**client component — `'use client'`** because it owns
Sheet open-state). Generic and route-agnostic: it lays out filter controls passed by the consumer; it does
NOT own filter business logic or URL state (that stays with the consumer / a later migration).
- Props (confirm exact shape against §11.1; if a required decision is genuinely missing, STOP & ASK):
  - `filters: ReactNode` — the filter controls (chips/comboboxes/toggles) supplied by the consumer.
  - `search?: ReactNode` — the search Input (consumer passes the Input primitive) OR a `searchSlot`; the search element must be `min-w-0 flex-1` so it shrinks (§11.2).
  - `activeCount?: number` — number of active filters; when `> 0`, render the count Badge and the global Reset.
  - `onReset?: () => void` — single global Reset handler; Reset control rendered only when `activeCount > 0`.
  - `labels: { filters: string; reset: string; activeCount?: string; ... }` — **i18n-safe; ALL user-facing
    text comes from here** (consumer supplies translated strings via `useTranslations` at the call site). FilterBar
    contains NO literal user-facing strings. No `messages/*.json` change in this slice.
  - `collapseAt?: 'lg'` (default `'lg'`) — the breakpoint at/below which overflow filters collapse into the Sheet (§11.1 default `<lg:`).
  - `className?: string` (merged via `cn`).
- Behaviour: `lg:+` inline row; `<lg:` "Filters" Button trigger opens a `Sheet` containing the overflow
  filters + (conditionally) the Reset; active-filter count Badge shown when `activeCount > 0`; toolbars never
  `overflow-x-auto` — they wrap or collapse to the Sheet. Touch targets ≥44px (§12).
- Composes existing `Sheet`/`Input`/`Badge`/`Button` + tokens only — invents no new container, spacing,
  breakpoint, color, or overlay pattern.

> **No `globals.css` token this slice.** If you think one is unavoidable, STOP & ASK.

## Positive flow (happy path)

- **Actor:** developer / Storybook. **Preconditions:** DS-1..3 present; clean tree; consumed ui primitives + `globals.css` untouched.
- **Steps & expected responses:**
  1. `import { FilterBar } from '@/components/layout'` → resolves.
  2. At `lg:+`, render FilterBar with 3 filters + search + `activeCount={2}` → chips + search inline; count Badge "2"; single Reset visible; search shrinks (`min-w-0 flex-1`), never pushes the row.
  3. At `<lg:` (e.g. 768/390/320) → overflow filters collapse behind a "Filters" trigger; clicking it opens a Sheet containing them; count Badge still visible on the trigger; Reset appears inside the Sheet (or per §11.1 placement).
  4. `activeCount={0}` → no count Badge, **no Reset** (conditional render).
  5. Stories render the §3 canon (14 widths × sq/en/uk/it) via the Storybook toolbar; the Sheet opens/closes in the `<lg:` stories.
- **Success state:** `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS (no-op); story renders incl. Sheet open/close; 14×4 evidence captured OR `OWNER QA REQUIRED`.
- **Post-conditions:** zero route files changed; DS-1..3 + consumed ui + shared/ + admin byte-identical; `globals.css` byte-identical; catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch — each needs a story variant)

- **Zero active filters:** `activeCount={0}` → no Badge, NO Reset rendered. → Story.
- **Many filters (10+) at <lg:** overflow collapses into the Sheet; trigger shows count Badge; nothing overflows the row. → Story at 768 + 390.
- **uk/sq long labels at 320:** "Filters"/"Reset"/filter labels in the longest locale → wrap/fit, never overflow horizontally; Sheet content scrolls vertically, never horizontally. → uk@320 story mandatory.
- **Search-only (no filters):** search Input alone → `min-w-0 flex-1`, fills the row, no empty chip area. → Story.
- **Reset interaction:** with `activeCount>0`, clicking Reset calls `onReset` (Storybook action/arg) → state cleared in the story harness. → Story with an action arg.
- **Sheet open at 320:** Sheet opens full-height, content reachable, close affordance ≥44px, no horizontal overflow. → Story.
- **className merge:** `className="mb-4"` extends without dropping flex/wrap classes. → Story or log note.

## Scope

Create `FilterBar.tsx` (client), ADD it to the barrel, create `FilterBar.stories.tsx`, register it in
`component-catalog.md`, update `backlog.md` (2–4 lines), write the session log. Nothing else.

## Out of scope (DO NOT)

- Do NOT migrate/refactor/adopt `ListingsFilters`, `FiltersPanel`, or any `shared/` filter piece — they are a LATER phase's migration target; READ only.
- Do NOT adopt `FilterBar` in any page/route (`src/app/**`) — zero route adoption.
- Do NOT own filter business logic or URL/search-param state inside FilterBar (consumer's concern; a later phase wires it).
- Do NOT edit consumed ui primitives (`sheet`/`input`/`badge`/`button`) or any `ui/**`.
- Do NOT edit DS-1..3 primitives beyond the single barrel-export addition.
- Do NOT edit `globals.css`, admin primitives, `Header`/`Footer`/`MobileBottomNav`, `listing/**`, `auth/**`, `src/modules/**`.
- Do NOT touch DB / Supabase / SQL / server actions / business logic / `messages/*`.
- Do NOT run `git add` / `git commit`. Do NOT use `overflow-x-auto` on the toolbar. Do NOT present code-level analysis as final responsive QA.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** `FilterBar.tsx` created as a **client component (`'use client'` present)** — justified by Sheet open-state; `flex flex-wrap items-center gap-2`; `lg:+` inline / `<lg:` Sheet collapse; search slot `min-w-0 flex-1`; no `overflow-x-auto`; `className` merged via `cn`. → *Positive 2–3*, file:line.
- **AC-2** Conditional Reset + count Badge: rendered only when `activeCount > 0`; `activeCount={0}` → neither rendered. → *Negative "zero active"*, file:line.
- **AC-3** `<lg:` overflow collapse: a "Filters" trigger opens a `Sheet` containing overflow filters (+ Reset per §11.1). → *Positive 3*, file:line.
- **AC-4** All user-facing text comes from the `labels` prop; **zero literal user-facing strings** in the file; **no `messages/*.json` change**. → grep proof in log.
- **AC-5** Consumed ui primitives byte-identical — `git diff src/components/ui/{sheet,input,badge,button}.tsx` empty. → diff in log.
- **AC-6** `shared/` filter pieces byte-identical — `git diff --stat src/components/shared` empty. → diff in log.
- **AC-7** Barrel exports PageShell/Section/PageHeader/ActionBar **AND FilterBar** (prior exports preserved). → file:line.
- **AC-8** `globals.css` **byte-identical**. → `git diff src/app/globals.css` empty, in log.
- **AC-9** `FilterBar.stories.tsx` renders the §3 canon (14 widths) × 4 locales via the Storybook toolbar, including Sheet open/close at `<lg:`. → file:line.
- **AC-10** Negative-flow story variants: zero-active; 10+ filters@768+390; uk@320 long labels; search-only; Reset action; Sheet-open@320. → file:line.
- **AC-11** **Zero route adoption:** grep = 0 hits, in log. → file:line.
- **AC-12** DS-1..3 primitives + admin + `Header`/`Footer`/`MobileBottomNav` unchanged. → `git diff --stat` in log.
- **AC-13** `docs/component-catalog.md` registers `FilterBar` as §7 Tier-2 (note it is the only client Tier-2; update count). → file:line.
- **AC-14** Self-validation block (Note 18): `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; AC table green; `ui-rules.md §17` pre-flight (touch ≥44px PASS, overflow@320 uk PASS, Sheet reachable); scope=clean.
- **AC-15** §19 responsive QA: **14 widths × 4 locales** rendered evidence incl. Sheet states **OR** `OWNER QA REQUIRED`. Code-level analysis alone is NOT PASS.
- **AC-16** "Files Changed" table; **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
rg -n "from ['\"]@/components/layout['\"]|from ['\"]@/components/layout/FilterBar" src/app src/modules   # MUST be 0 hits
rg -n "'use client'" src/components/layout/FilterBar.tsx                                                  # MUST be 1 hit (client — Sheet state)
rg -n "overflow-x-auto" src/components/layout/FilterBar.tsx                                               # MUST be 0 hits
git diff src/components/ui/sheet.tsx src/components/ui/input.tsx src/components/ui/badge.tsx src/components/ui/button.tsx  # MUST be empty
git diff --stat src/components/shared              # MUST be empty (migration targets untouched)
git diff src/app/globals.css                       # MUST be empty
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx src/components/layout/ActionBar.tsx  # MUST be empty
git diff --stat src/components/admin               # MUST be empty
npx tsc --noEmit
npm run build
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and run the closest canonical validation.

## Required responsive QA (MANDATORY — `docs/design-system.md §19`; rendered, not code-level)

- Render the story at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells) via the Storybook viewport + locale toolbar.
- **Storybook preset note:** 560 / 680 / 810 / 960 / 1200 have NO exact preset in `.storybook/preview.tsx` — resize the browser manually for those 5 widths and cycle 4 locales.
- **Cross the `lg` boundary explicitly:** verify inline layout at 1024+ and Sheet-collapse below 1024 (768/810/960 are the critical band); open the Sheet at `<lg:` widths and confirm reachability + no horizontal overflow.
- **uk @ 320 is the longest-locale overflow stress check:** "Filters"/"Reset"/filter labels wrap/fit; Sheet content scrolls only vertically.
- Run `ui-rules.md §17` pre-flight; paste output. **Real rendered browser/Storybook QA is required — code-level analysis is NOT proof of responsive PASS.**
- **Either** paste screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS.

## Required localization QA (sq / en / uk / it)

FilterBar contains NO literal user-facing strings — all text arrives via the `labels` prop, so **no
`messages/*.json` keys are added/changed** and `check:i18n` is a no-op PASS. The story harness must supply
translated `labels` for **sq / en / uk / it** and prove that the longest locale (uk, then sq/it) does not
overflow at any width, especially **uk @ 320** and across the `lg` collapse boundary. `en`-only proof is
insufficient (§6). If — contrary to scope — a literal string is introduced, full sq/en/uk/it parity +
`npm run check:i18n` is mandatory — but prefer STOP & ASK, since strings belong in the consumer's `labels`.

## STOP & ASK triggers

- DS-1/DS-2/DS-3 primitives not on disk → STOP.
- The exact conditional-Reset placement (`<lg:` inside Sheet vs inline) is ambiguous vs §11.1 → STOP & ASK.
- The overflow-collapse threshold or which filters are "overflow" vs "always inline" is undefined → STOP & ASK.
- Proving FilterBar appears to require real filter business logic or URL state → STOP (out of scope; harness with story args/actions instead).
- Building it appears to require editing a consumed ui primitive or a `shared/` filter piece → STOP.
- You believe FilterBar can be server-only (no `'use client'`) → STOP & ASK (Sheet open-state needs client; confirm before deviating).
- The Storybook tooling cannot render the 14×4 matrix (incl. Sheet states) → STOP and record `OWNER QA REQUIRED`.
- Any required change would touch a FORBIDDEN path → STOP.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; AC-by-AC self-audit; `ui-rules.md §17` pre-flight output; 14×4 QA matrix
incl. Sheet open/close + `lg` boundary (or `OWNER QA REQUIRED`); confirmation consumed ui + shared/ + DS-1..3 +
admin + globals.css untouched; client-boundary justification (why `'use client'` is required). End with Files Changed table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + 1-line rationale — for
every file created/edited. The orchestrator validates it against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
