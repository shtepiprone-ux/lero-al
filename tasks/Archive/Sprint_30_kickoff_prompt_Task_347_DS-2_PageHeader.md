# Sprint 30 — Task 347 kickoff (Sonnet) — DS-2: PageHeader primitive (NO route migration)

> **Status: READY — immediate next executable DS task.**
> **Precondition gate:** start ONLY after the owner has approved + committed **DS-1 (Task 345)** —
> `src/components/layout/PageShell.tsx` + `Section.tsx` + `index.ts` must already exist on disk.
> If they do not exist yet, **STOP & ASK** (DS-1 is the parent foundation).
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system foundation (1 primitive only)
Priority: high
Area:     design-system / responsive / layout
Phase:    DS-2 of the design-system foundation queue
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)
          Maps to docs/design-system.md §18 "Phase 1 — Foundation", executed as graduated sub-slices.

Area (ALLOWED to touch — nothing else):
          src/components/layout/PageHeader.tsx        (NEW)
          src/components/layout/index.ts              (UPDATE — ADD PageHeader to the existing barrel; keep PageShell + Section exports)
          src/components/layout/PageHeader.stories.tsx (NEW)
          docs/component-catalog.md                   (UPDATE — register PageHeader under §7 Tier-2)
          docs/backlog.md                             (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-347-ds2-pageheader.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          src/components/layout/PageShell.tsx · Section.tsx                       (DS-1 — do NOT edit; READ to mirror style)
          src/components/layout/FilterBar.tsx · ActionBar.tsx                     (NOT this task — DS-3/DS-4)
          src/components/layout/Header.tsx · Footer.tsx · MobileBottomNav.tsx     (existing — do NOT edit)
          src/app/** (ANY route/page/layout)
          src/app/globals.css                                                    (do NOT add/modify ANY token this slice)
          src/components/admin/**   (AdminPageHeader is the REFERENCE, NOT to be edited)
          src/components/ui/** · src/components/shared/** · src/components/listing/** · src/components/auth/**
          src/modules/**  ·  messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You implement EXACTLY the acceptance criteria below — one new
server-safe layout primitive plus its story and doc registration. You do NOT migrate any route, do NOT
adopt the primitive anywhere, do NOT touch admin/domain/ui/shared code, do NOT change `globals.css`, and
do NOT run git. Touching anything outside the allowlist = scope violation = STOP & ASK. Opus is the
orchestrator/reviewer and verifies the actual diff; Opus emits all git commands.

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / component task")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — source of truth. Read **§4 (containers), §5 (spacing), §6 (typography/wrapping), §7 (ownership taxonomy — PageHeader is Tier-2), §9 (page header anatomy, esp. line ~159), §19–§21 (QA + PASS/FAIL).**
2. `docs/ui-rules.md` (esp. §0 single-source primitives, §17 pre-flight checklist).
3. `docs/component-rules.md`, `docs/qa-rules.md`.
4. `docs/sessions/2026-06-01-task-345-ds1-pageshell-section.md` (the DS-1 sibling you mirror).

**Reference implementations to MIRROR (read, do NOT edit):**
- `src/components/admin/AdminPageHeader.tsx` — the admin sibling (title/subtitle/action, server). Your public `PageHeader` is its analogue. Mirror its prop/JSX style; it is server-safe (no `'use client'`).
- `src/components/layout/PageShell.tsx` + `Section.tsx` (DS-1) — match their file style, `cn`/class-merge usage, prop conventions, and story shape.
- `src/components/admin/AdminPageHeader.stories.tsx` (if present) — mirror the viewport + locale story shape.

## Problem

`src/components/layout/` has `PageShell` + `Section` (DS-1) but **no global `PageHeader`**. Public/cabinet
pages therefore have no canonical page-title/subtitle/action header primitive; admin has `AdminPageHeader`
but it is admin-only and must not be reused on public surfaces. Without a public `PageHeader`, route
migration (DS-6+) would force every page to re-invent its own header markup (the exact local-invention
entropy `docs/design-system.md §7` forbids).

## Goal

Create ONE server-safe Tier-2 layout primitive — `PageHeader` — that renders a canonical page header
(title + optional subtitle/description + optional count badge + optional action slot) composing existing
Tier-1 primitives and design tokens only. Register it in the barrel and catalog. **Zero route adoption.**
Proof is via Storybook only.

## Current behavior to preserve (Note 19 + Note 20)

- **DS-1 primitives unchanged.** `PageShell.tsx` and `Section.tsx` are byte-identical after this task
  (you only ADD a line to `index.ts`). Confirm with `git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx` → empty.
- **Existing barrel exports preserved.** `index.ts` must still export `PageShell` and `Section`; you ADD
  `PageHeader` — you do not remove or rename anything.
- **Every existing route renders identically** — no route imports `PageHeader`. Prove with the grep below = 0 hits.
- **Admin `AdminPageHeader` unchanged**, `Header`/`Footer`/`MobileBottomNav` unchanged, `globals.css` unchanged.
- No existing interactive control removed anywhere (trivially true — no route/domain file touched; confirm in log).

## Required after behavior

`import { PageShell, Section, PageHeader } from '@/components/layout'` resolves all three. `PageHeader`
renders a title (and any provided subtitle/description/countBadge/action) with §6 typography and §5 rhythm,
wraps long uk/sq strings at 320px without horizontal overflow, stacks the action cluster below the title at
`<md:` and right-aligns it at `md:+`, and adopts no container of its own (it sits inside a `PageShell`).

### Primitive spec (literal)

**`PageHeader`** — canonical page-level header block (server component), sits INSIDE a `PageShell`.
- **Server-safe — NO `'use client'`** (it holds zero state; it is a pure structural wrapper). If you
  believe it needs a client boundary, STOP & ASK — it does not.
- Props (final names may mirror `AdminPageHeader`; if a name conflict arises, STOP & ASK):
  - `title: string` (required) → `h1` at `text-2xl sm:text-3xl 2xl:text-4xl` (§6), inside a `min-w-0`
    wrapper so long uk/sq titles wrap rather than overflow. (Use `h1` for the public page title; confirm
    against §6 — if §6 mandates `h2`, follow §6 and note it.)
  - `description?: string` (a.k.a. subtitle) → `p text-sm sm:text-base text-muted-foreground`, one rhythm
    step below the title (`mt-1`/`mt-2`).
  - `countBadge?: ReactNode` → optional Badge-style slot next to the title (consumer passes the Badge
    primitive; PageHeader does NOT import/restyle Badge, it only provides the slot).
  - `action?: ReactNode` → optional action slot (consumer passes Buttons/links). Layout: stacked below the
    title block at `<md:` (`flex-col`), right-aligned on the same row at `md:+` (`md:flex-row md:items-center md:justify-between`).
  - `as?: 'header' | 'div'` (default `'header'`).
  - `className?: string` (merged via the project `cn`/class-merge helper — do not blow away defaults).
- **Renders NO container of its own** (it relies on the enclosing `PageShell` — §4). It invents no new
  container, no new spacing scale, no new breakpoint, no new color, no fixed pixel width.
- **Zero hardcoded user-facing strings** — `title`/`description`/`countBadge`/`action` are all
  consumer-supplied. No `messages/*.json` change is expected or allowed this slice.

> **No `globals.css` token this slice.** If you think a new token is unavoidable, STOP & ASK.

## Positive flow (happy path) — primitive rendering proof

- **Actor:** developer / Storybook. **Preconditions:** DS-1 present; clean tree; `globals.css` untouched.
- **Steps & expected responses:**
  1. `import { PageShell, Section, PageHeader } from '@/components/layout'` → all three resolve from the barrel.
  2. Render `<PageShell><PageHeader title="…" description="…" action={<Button/>} /> <Section>…</Section></PageShell>`
     → title sits above the description; the action cluster is right-aligned at `md:+`.
  3. At `<md:` the action cluster stacks below the title block; no horizontal overflow.
  4. Stories render the §3 canon (14 widths × sq/en/uk/it) via the Storybook viewport + locale toolbar.
- **Success state:** `npx tsc --noEmit` = 0; `npm run build` ✅; `npm run lint` 0/0 new; `npm run check:i18n` PASS (no-op); story renders; 14×4 evidence captured OR `OWNER QA REQUIRED` recorded.
- **Post-conditions:** zero route files changed; DS-1 + admin primitives byte-identical; `globals.css` byte-identical; catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch — each needs a story variant)

- **Title only:** `PageHeader` with only `title` (no description/countBadge/action) → renders the title alone, no empty slots, no layout shift. → Story variant.
- **Long locale (uk/sq) overflow:** `title` set to the longest uk string at **320px** → wraps inside `min-w-0`, never overflows horizontally. → uk@320 story mandatory.
- **Action present at extremes:** `action` slot with 2–3 buttons at **320** (stacked, full-width-friendly, no overflow) and at **2560** (right-aligned, not stranded). → Story variants at both ends.
- **countBadge present:** title + countBadge together → badge sits adjacent to the title without pushing it to overflow at 320 uk. → Story variant.
- **`as` prop:** `as="div"` renders a `<div>` root; default renders `<header>`. → Confirm in session log.
- **className merge:** passing `className="mb-2"` extends/overrides defaults without dropping required layout classes. → Story or session-log note.

## Scope

Create `PageHeader.tsx`, ADD it to the existing barrel `index.ts`, create `PageHeader.stories.tsx`,
register it in `component-catalog.md`, update `backlog.md` (2–4 lines), write the session log. Nothing else.

## Out of scope (DO NOT)

- Do NOT create FilterBar or ActionBar (DS-3/DS-4 — separate later kickoffs).
- Do NOT edit `PageShell.tsx` / `Section.tsx` (DS-1) beyond the single barrel-export addition in `index.ts`.
- Do NOT adopt `PageHeader` in any page/route (`src/app/**`) — zero route adoption this slice.
- Do NOT edit `globals.css`, admin primitives, `Header`/`Footer`/`MobileBottomNav`, `ui/**`, `shared/**`, `listing/**`, `auth/**`, or any `src/modules/**` component.
- Do NOT touch DB / Supabase / SQL / server actions / business logic / `messages/*`.
- Do NOT run `git add` / `git commit` (single-writer rule).
- Do NOT present code-level analysis as final responsive QA.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** `PageHeader.tsx` created: server component (NO `'use client'`); required `title` (`min-w-0` wrapper, §6 typography); optional `description`, `countBadge`, `action`; `as: 'header'|'div'` (default `header`); action stacked `<md:` / right-aligned `md:+`; `className` merged via the project class-merge helper. → *Positive 2–3*, file:line.
- **AC-2** Barrel `src/components/layout/index.ts` exports **PageShell, Section, AND PageHeader** (DS-1 exports preserved; only PageHeader added). → *Positive 1*, file:line.
- **AC-3** `globals.css` is **byte-identical** (no token added/changed). → `git diff src/app/globals.css` empty, pasted in log.
- **AC-4** Zero hardcoded user-facing strings — all text is consumer-supplied props. **No `messages/*.json` change.** → grep proof in log.
- **AC-5** `PageHeader.stories.tsx` created, rendering the §3 canon (14 widths) × 4 locales via the Storybook viewport + locale toolbar. → *Positive 4*, file:line.
- **AC-6** Negative-flow story variants exist: title-only; uk@320 long-title wrap; action@320 + action@2560; countBadge+title. → *Negative flow*, file:line.
- **AC-7** **Zero route adoption:** grep (below) = 0 hits, pasted in log. → file:line.
- **AC-8** DS-1 primitives + admin `AdminPageHeader` + `Header`/`Footer`/`MobileBottomNav` unchanged. → `git diff --stat` in log.
- **AC-9** `docs/component-catalog.md` registers `PageHeader` as §7 Tier-2 global layout primitive (Layout Components section; update the count). → file:line.
- **AC-10** Self-validation block present (Note 18): `npx tsc --noEmit`=0; `npm run build` ✅; `npm run lint` 0/0 new; `npm run check:i18n` PASS; AC-by-AC table all green; `ui-rules.md §17` pre-flight output; scope=clean.
- **AC-11** §19 responsive QA: **14 widths × 4 locales** rendered evidence (Storybook screenshots strongly preferred) **OR** an explicit `OWNER QA REQUIRED` gate recorded. **Code-level analysis alone is NOT PASS** (§19/§21).
- **AC-12** "Files Changed" table in the session log (one row/path + 1-line rationale). **No `git add`/`git commit` emitted by you.**

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
rg -n "from ['\"]@/components/layout['\"]|from ['\"]@/components/layout/PageHeader" src/app src/modules   # MUST be 0 hits (zero route adoption)
rg -n "'use client'" src/components/layout/PageHeader.tsx                                                 # MUST be 0 hits (server-safe)
rg -n "container-|max-w-|mx-auto" src/components/layout/PageHeader.tsx                                    # PageHeader owns NO container
git diff src/app/globals.css                       # MUST be empty
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx   # MUST be empty (DS-1 untouched)
git diff --stat src/components/admin               # MUST be empty
npx tsc --noEmit
npm run build
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and run the closest
canonical validation (`typecheck` = `tsc --noEmit`; `lint` = `eslint`).

## Required responsive QA (MANDATORY — `docs/design-system.md §19`; rendered, not code-level)

- Render the story at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560**
  × **sq / en / uk / it** (= 56 cells) using the Storybook viewport + locale toolbar.
- **Storybook preset note (from `.storybook/preview.tsx`):** presets exist for 320/375/390/480/768/1024/1440/1920/2560.
  **560 / 680 / 810 / 960 / 1200 have NO exact preset — resize the browser manually for those 5 widths** and cycle 4 locales.
- **uk @ 320 is the longest-locale overflow stress check:** the title must wrap, never overflow horizontally; the action cluster must stack without clipping.
- Run the `ui-rules.md §17` pre-flight checklist; paste output into the session log.
- **Real rendered browser/Storybook QA is required — code-level analysis is NOT proof of responsive PASS** (§19/§21).
- **Either** paste browser/Storybook screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS.

## Required localization QA (sq / en / uk / it)

This primitive ships **no runtime user-facing text** (all labels are consumer props), so **no `messages/*.json`
keys are added or changed** and `npm run check:i18n` is expected to be a no-op PASS. Locale coverage = proving,
in Storybook across **sq / en / uk / it**, that a consumer-supplied `title`/`description` in the **longest
locale (uk, then sq/it)** wraps correctly at every width, especially **uk @ 320**. `en`-only proof is
insufficient (§6 longest-locale rule). If — contrary to scope — any user-facing string is introduced, you
must add it to `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` at parity and
run `npm run check:i18n` — but introducing strings here is OUT OF SCOPE, so prefer STOP & ASK.

## STOP & ASK triggers

- DS-1 (`PageShell`/`Section`) does not exist on disk → STOP (this task depends on DS-1).
- You believe `PageHeader` needs `'use client'` → STOP (it does not; report why you think so).
- A `title`/`h1` vs `h2` ambiguity vs `docs/design-system.md §6` → STOP & ASK (follow §6; do not guess).
- `PageHeader` appears to need a `globals.css` token change → STOP (it does not; express with Tailwind utilities).
- The primitive cannot be proven without adopting it in a route → STOP (do not migrate/adopt a route).
- The Storybook locale/viewport tooling cannot render the 14×4 matrix → STOP and record `OWNER QA REQUIRED`.
- Any required change would touch a FORBIDDEN path → STOP.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; AC-by-AC self-audit; `ui-rules.md §17` pre-flight output; 14×4 QA matrix
(or `OWNER QA REQUIRED`); confirmation of zero route adoption + DS-1/admin/globals.css untouched;
server-vs-client note (server, why). End with the **Files Changed** table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + a 1-line rationale —
covering every file you created or edited. The orchestrator validates this table against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End the session with the Files Changed table only. The
ORCHESTRATOR (Opus) reads the real diff and emits explicit-path commit commands during review; the owner
runs them in PowerShell.
