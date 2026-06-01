# Sprint 30 — Task 345 kickoff (Sonnet) — DS-1: PageShell + Section foundation (NO route migration)

> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Parent:** Task 340 (Opus) — `docs/design-system.md` (Global Responsive Design System Contract v1).
> **Replaces (for execution):** Task 343 is **FROZEN / not to be executed** (it bundled all five
> primitives + FilterBar Sheet state + ActionBar button-height governance into one kickoff — too large,
> low verifiability, loop-prone). This task is **DS-1**: the smallest safe foundation slice — **two
> server-safe structural primitives only**. PageHeader (DS-2), ActionBar (DS-3) and FilterBar (DS-4)
> are SEPARATE later kickoffs, produced one at a time after this slice ships and the owner approves.
>
> **🚨 Hard scope ceiling.** This task creates `PageShell`, `Section`, a barrel, and their Storybook
> stories ONLY. You MUST NOT create PageHeader/FilterBar/ActionBar. You MUST NOT touch `src/app/**`
> route files. You MUST NOT adopt the new primitives in any page. You MUST NOT touch admin or domain
> components. Touching anything outside the allowlist = scope violation = STOP & ASK.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system foundation (2 primitives only)
Priority: high
Phase:    DS-1 of the design-system foundation queue (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md)
          Maps to docs/design-system.md §18 "Phase 1 — Foundation", executed as graduated sub-slices DS-1..DS-4.

Area (ALLOWED to touch — nothing else):
          src/components/layout/PageShell.tsx        (NEW)
          src/components/layout/Section.tsx           (NEW)
          src/components/layout/index.ts              (NEW — barrel; export ONLY PageShell + Section for now)
          src/components/layout/PageShell.stories.tsx (NEW)
          src/components/layout/Section.stories.tsx   (NEW)
          docs/component-catalog.md                   (UPDATE — register the 2 new primitives under §7 Tier-2)
          docs/backlog.md                             (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-345-ds1-pageshell-section.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          src/components/layout/PageHeader.tsx · FilterBar.tsx · ActionBar.tsx   (NOT this task — DS-2/3/4)
          src/components/layout/Header.tsx · Footer.tsx · MobileBottomNav.tsx    (existing — do NOT edit)
          src/app/** (ANY route/page/layout)
          src/app/globals.css                                                    (do NOT add/modify ANY token this slice)
          src/components/admin/**   (Sprint 28 primitives are the REFERENCE, NOT to be edited)
          src/components/ui/** · src/components/shared/** · src/components/listing/** · src/components/auth/**
          src/modules/**  ·  messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
```

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / component task")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — your source of truth. Read **§4 (containers), §5 (spacing), §6 (typography/wrapping), §7 (ownership taxonomy — these are Tier-2), §13 (cards/grids context), §19–§21 (QA + PASS/FAIL).**
2. `docs/ui-rules.md` (esp. §0 single-source primitives, §17 pre-flight checklist).
3. `docs/component-rules.md`.
4. `docs/qa-rules.md`.

**Reference implementations to MIRROR (read, do NOT edit):**
- `src/components/admin/AdminPageShell.tsx` — the admin sibling. Your public `PageShell` is its analogue using `.container-wide` (NOT `.container-admin`). Mirror its prop/JSX style; do NOT copy its `'use client'` (yours is server-safe — it has no state).
- `src/components/admin/AdminPageShell.stories.tsx` — mirror this story shape (viewport + locale parameters, long-uk variant, no-header variant).

## What already exists (do not duplicate, do not edit)

- `src/components/layout/` currently contains ONLY `Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`. There is **no** global `PageShell`/`Section`. You are creating them — no duplication risk.
- Containers `.container-wide` (public, 1408px) and `.container-admin` (admin, 1792px) already exist in `globals.css`. **You consume `.container-wide` by class name. You do NOT modify `globals.css` at all this slice.**
- Admin has `AdminPageShell`/`AdminPageHeader`/`AdminTable`/`AdminCardList` — the admin reference, untouched.

## Required outcome

Two global **Tier-2 layout primitives** (`docs/design-system.md §7`) created in `src/components/layout/`, each:
- **Server-safe** — NO `'use client'` (they hold zero state; they are pure structural wrappers). If you believe either needs a client boundary, STOP & ASK — it does not.
- **Zero hardcoded user-facing strings** — `Section`'s `title`/`description` are consumer-supplied props; PageShell renders no text of its own. No `messages/*.json` change is expected or allowed this slice.
- Composes the existing `.container-wide` container and Tailwind defaults only — **invents no new container, no new spacing scale, no new breakpoint, no new color, no fixed pixel content width.**
- Adopted by **zero** routes (proof is via Storybook only).

### Primitive specs (literal)

**1. `PageShell`** — outermost public/cabinet page content wrapper (server component).
- Props: `children: ReactNode`; `as?: 'main' | 'div'` (default `'main'`); `container?: 'wide' | 'narrow' | 'form'` (default `'wide'`); `className?: string`.
- Container behaviour (composition only — NO new globals.css token):
  - `'wide'` → root element has class `container-wide` (the §4 public page-container, ≤1408px).
  - `'narrow'` → `container-wide` PLUS an inner wrapper `max-w-3xl mx-auto` (the §4 content/reading column) around `children`.
  - `'form'` → `container-wide` PLUS an inner wrapper `max-w-xl mx-auto` (the §4 form column) around `children`.
- Vertical rhythm: `py-8 sm:py-12 lg:py-16 2xl:py-20` (§5) applied on the root, overridable/extendable via `className` (merge, do not blow away — use the project's `cn`/class-merge helper exactly as admin primitives do).
- No fixed pixel width; never exceeds 1408px; never uses `.container-admin`.

**2. `Section`** — a titled content block that sits INSIDE a PageShell (server component).
- Props: `title?: string`; `description?: string`; `children: ReactNode`; `className?: string`.
- Renders NO container of its own (it relies on the enclosing PageShell — §4). It is a vertical block:
  - optional `title` → `h2` at `text-xl sm:text-2xl 2xl:text-3xl` (§6), in a `min-w-0` wrapper so long uk/sq headings wrap rather than overflow.
  - optional `description` → `p text-sm text-muted-foreground`, one rhythm step below the title (`mt-1`/`mt-2`).
  - heading block → body one step (`mb-4` or `mb-6`, §5) when a title/description is present; when neither is present, render `children` only with no empty heading wrapper and no layout shift.
- Section vertical rhythm between stacked sections is the consumer's concern (e.g. `space-y-*` on the PageShell child); Section itself does not add outer margins beyond the heading→body step.

> **No `globals.css` token this slice.** The owner rule for DS-1 is: narrow/form variants must be expressible with existing Tailwind `max-w-*` inline (they are). Do NOT add `.container-narrow` / `.container-form`. If you think a new token is unavoidable, STOP & ASK.

---

## Positive flow (happy path) — primitive rendering proof

Because this slice adds primitives with **no route adoption**, the happy path is correct rendering in Storybook + a clean typecheck/build.

- **Actor:** developer / Storybook.
- **Preconditions:** clean tree; admin primitives untouched; `globals.css` untouched.
- **Steps & expected responses:**
  1. `import { PageShell, Section } from '@/components/layout'` → both resolve from the barrel.
  2. Render `<PageShell container="wide"><Section title="..." description="...">…</Section></PageShell>` → a centered ≤1408px column with the §5 vertical rhythm; the Section heading sits one step above its body.
  3. Render `container="narrow"` and `container="form"` → children are bounded to `max-w-3xl` / `max-w-xl` and horizontally centered inside the 1408px container; at 2560px the column is centered with balanced margins (no full-bleed).
  4. PageShell + Section stories render at the §3 canon (14 widths × sq/en/uk/it) using the Storybook viewport + locale toolbar (mirror `AdminPageShell.stories.tsx`).
- **Success state:** `npx tsc --noEmit` = 0; `npm run build` ✅; `npm run lint` 0/0 new; both stories render; 14×4 evidence captured (or `OWNER QA REQUIRED` gate recorded — see QA gate).
- **Post-conditions:** zero route files changed; admin primitives byte-identical; `globals.css` byte-identical; catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch — each needs a story variant)

- **Empty/optional props:** `Section` with no `title` and no `description` → renders `children` only, no empty heading wrapper, no layout shift. → Story variant required.
- **Title only / description only:** `Section` with only `title`, and a second with only `description` → each renders correctly with the heading→body step. → Story variants.
- **Long locale (uk/sq) overflow:** `Section title` set to the longest uk string at **320px** → the heading wraps inside `min-w-0`, never causes horizontal overflow. → Story at uk 320 mandatory.
- **Container variants at extremes:** `narrow` and `form` at 320 (no wasted side gutters that clip content) AND at 2560 (centered, not full-bleed). → Story variants at both ends.
- **`as` prop:** `as="div"` renders a `<div>` root; default renders `<main>`. Passing a client child node into `children` must not error (PageShell/Section stay server components regardless of child type). → Confirm in session log.
- **className merge:** passing `className="py-4"` extends/overrides the default rhythm without dropping the container class (`container-wide` must survive). → Story or session-log note.

## Current behavior to preserve (Note 19 + Note 20)

- **Every existing route renders identically** — no route imports the new primitives. Prove with:
  `rg -n "from ['\"]@/components/layout['\"]|from ['\"]@/components/layout/(PageShell|Section)" src/app src/modules` → **0 hits**.
- **Admin primitives unchanged**, **`Header.tsx`/`Footer.tsx`/`MobileBottomNav.tsx` unchanged**, **`globals.css` unchanged** — confirm with `git status --short` / `git diff --stat` excerpts in the session log.
- No existing interactive control removed anywhere (trivially true — no route/domain file touched; confirm in log).

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** `PageShell.tsx` created: server component (NO `'use client'`); `container: 'wide'|'narrow'|'form'` (default `wide`); `as: 'main'|'div'` (default `main`); §5 rhythm `py-8 sm:py-12 lg:py-16 2xl:py-20`; `wide`→`container-wide`, `narrow`→`+max-w-3xl mx-auto` inner, `form`→`+max-w-xl mx-auto` inner; `className` merged via the project class-merge helper. → *Positive 2–3* — file:line.
- **AC-2** `Section.tsx` created: server component; optional `title` (`h2 text-xl sm:text-2xl 2xl:text-3xl`, in `min-w-0`) + optional `description` (`text-sm text-muted-foreground`); heading→body one step; no container of its own; empty-props renders children only. → *Negative "empty props" / "long locale"* — file:line.
- **AC-3** Barrel `src/components/layout/index.ts` exports **exactly** `PageShell` and `Section` (NOT PageHeader/FilterBar/ActionBar — they don't exist yet). → *Positive 1* — file:line.
- **AC-4** `globals.css` is **byte-identical** (no token added/changed). → `git diff src/app/globals.css` empty, pasted in log.
- **AC-5** Zero hardcoded user-facing strings in both primitives — `Section` text is consumer-supplied; PageShell renders no text. grep the 2 files for stray literals → none. **No `messages/*.json` change.** → grep proof in log.
- **AC-6** `PageShell.stories.tsx` + `Section.stories.tsx` created, each rendering the §3 canon (14 widths) × 4 locales via the Storybook viewport + locale toolbar (mirror `AdminPageShell.stories.tsx`). → *Positive 4* — file:line per story.
- **AC-7** Negative-flow story variants exist: Section empty-props; title-only; description-only; uk@320 long-title wrap; narrow@320 + narrow@2560; form@320 + form@2560. → *Negative flow* — file:line.
- **AC-8** **Zero route adoption:** the `rg` from "Current behavior to preserve" = 0 hits, pasted in log. → file:line.
- **AC-9** Admin primitives + `Header`/`Footer`/`MobileBottomNav` unchanged. → `git diff --stat` in log.
- **AC-10** `docs/component-catalog.md` registers `PageShell` + `Section` as §7 Tier-2 global layout primitives. → file:line.
- **AC-11** Self-validation block present (Note 18): `npx tsc --noEmit`=0; `npm run build` ✅; `npm run lint` 0/0 new; `npm run check:i18n` PASS (expected no-op — no message change); AC-by-AC table all green; `ui-rules.md §17` pre-flight output (control-height N/A note, z-index N/A, overflow@320 uk PASS, 14 widths, 4 locales, touch targets N/A — no controls); scope=clean.
- **AC-12** §19 responsive QA: **14 widths × 4 locales** rendered evidence per primitive (Storybook screenshots strongly preferred) **OR** an explicit `OWNER QA REQUIRED` gate recorded in the session log. **Code-level analysis alone is NOT PASS** (§19/§21).
- **AC-13** "Files Changed" table in the session log (one row/path + 1-line rationale). **No `git add`/`git commit` emitted by you.**

## QA / verification gate (MANDATORY — `docs/design-system.md §19`)

- Render each story at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells/primitive) using the Storybook viewport + locale toolbar (`.storybook/preview.tsx` already provides both).
- Walk **uk @ 320** for each primitive (longest-locale overflow guard): Section long title must wrap, never overflow horizontally.
- Run the `ui-rules.md §17` pre-flight checklist; paste output into the session log.
- **Either** paste browser/Storybook screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS. A code-level-only matrix is a §21 FAIL.

> **STOP & ASK if rendered QA cannot be completed.** If the Storybook locale/viewport tooling cannot render the 14×4 matrix for any reason, STOP and report `OWNER QA REQUIRED` — do NOT substitute structural/code-level analysis as PASS.

## Localization coverage (sq / en / uk / it)

These primitives ship **no runtime user-facing text** (Section labels are consumer props), so **no `messages/*.json` keys are added or changed**. Locale coverage for this slice = proving, in Storybook across **sq / en / uk / it**, that a consumer-supplied `Section title`/`description` in the **longest locale (uk, then sq/it)** wraps correctly at every width, especially **uk @ 320**. `en`-only proof is insufficient (§6 longest-locale rule).

## Required grep / checks (run, adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
rg -n "from ['\"]@/components/layout['\"]|from ['\"]@/components/layout/(PageShell|Section)" src/app src/modules
rg -n "PageShell|Section" src/components/layout
rg -n "'use client'" src/components/layout/PageShell.tsx src/components/layout/Section.tsx
rg -n "container-wide|container-admin|max-w-|mx-auto" src/components/layout
git diff src/app/globals.css        # MUST be empty
git diff --stat src/components/admin # MUST be empty
npm run build
npx tsc --noEmit
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and run the closest canonical validation (`typecheck` = `tsc --noEmit`; `lint` = `eslint`).

## STOP & ASK triggers

- A primitive cannot be built without adopting it in a route to prove it → STOP (do not migrate/adopt a route).
- `narrow`/`form` appears to need a `globals.css` token change → STOP (it does not; express with inline `max-w-*`).
- You believe `PageShell` or `Section` needs `'use client'` → STOP (they don't; report why you think so).
- The Storybook locale/viewport tooling cannot render the 14×4 matrix → STOP and record `OWNER QA REQUIRED`.
- Any required change would touch a FORBIDDEN path → STOP.

## Out of scope (DO NOT)

- Do NOT create PageHeader, FilterBar, or ActionBar (DS-2/DS-3/DS-4 — separate later kickoffs).
- Do NOT adopt the primitives in any page/route (`src/app/**`).
- Do NOT edit `globals.css`, admin primitives, `Header`/`Footer`/`MobileBottomNav`, `ui/**`, `shared/**`, `listing/**`, `auth/**`, or any `src/modules/**` component.
- Do NOT touch DB / Supabase / SQL / server actions / business logic / `messages/*`.
- Do NOT run `git add` / `git commit` (single-writer rule).
- Do NOT present code-level analysis as final responsive QA.

## Final report (write in the session log + a 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; AC-by-AC self-audit; `ui-rules.md §17` pre-flight output; 14×4 QA matrix (or `OWNER QA REQUIRED`); confirmation of zero route adoption + admin/containers/globals.css untouched; server-vs-client note (both server, why). End with the "Files Changed" table — **no git commands** (orchestrator emits them on review).
