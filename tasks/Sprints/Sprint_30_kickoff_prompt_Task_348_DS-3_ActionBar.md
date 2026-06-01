# Sprint 30 — Task 348 kickoff (Sonnet) — DS-3: ActionBar primitive (NO route migration)

> **Status: QUEUED.** Runs only AFTER DS-2 (Task 347, PageHeader) has shipped, been reviewed, and been
> **owner-approved + committed**. Do not start until the orchestrator releases this slice.
> **Dependency:** DS-1 (`PageShell`/`Section`) + DS-2 (`PageHeader`) must exist on disk. If missing → STOP & ASK.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system foundation (1 primitive only — resolves Button-height governance in isolation)
Priority: high
Area:     design-system / responsive / layout
Phase:    DS-3 of the design-system foundation queue
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — nothing else):
          src/components/layout/ActionBar.tsx         (NEW)
          src/components/layout/index.ts              (UPDATE — ADD ActionBar; keep PageShell + Section + PageHeader exports)
          src/components/layout/ActionBar.stories.tsx (NEW)
          docs/component-catalog.md                   (UPDATE — register ActionBar under §7 Tier-2)
          docs/backlog.md                             (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-348-ds3-actionbar.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          src/components/layout/PageShell.tsx · Section.tsx · PageHeader.tsx      (DS-1/DS-2 — READ to mirror; do NOT edit)
          src/components/layout/FilterBar.tsx                                     (NOT this task — DS-4)
          src/components/layout/Header.tsx · Footer.tsx · MobileBottomNav.tsx     (existing — do NOT edit)
          src/components/ui/button.tsx (+ any ui primitive)                       (Button is consumed AS-IS; do NOT restyle the Button primitive)
          src/app/** (ANY route/page/layout)  ·  src/app/globals.css             (no token change this slice)
          src/components/admin/**  ·  src/components/shared/** · listing/** · auth/**  ·  src/modules/**
          messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You implement EXACTLY the acceptance criteria — one new server-safe
layout primitive (`ActionBar`) that standardises the page-level action cluster and its single shared button
height, plus its story and doc registration. You do NOT migrate or adopt any route, do NOT restyle the
Button primitive itself, do NOT touch admin/domain/ui/shared code, do NOT change `globals.css`, do NOT run
git. Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real diff and emits git commands.

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / component task")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — source of truth. Read **§5 (spacing), §7 (Tier-2 ownership), §9 (header/action anatomy ~line 159), §11.4 (ActionBar rule ~line 189: right-aligned `md:+`, stacked `<md`, one shared Button height per row, toolbars never overflow), §12 (touch ≥44px), §19–§21 (QA + PASS/FAIL).**
2. `docs/ui-rules.md` — esp. **§15 (Button-height governance — THE governance this slice resolves in isolation)** + §17 pre-flight checklist.
3. `docs/component-rules.md`, `docs/qa-rules.md`.
4. `docs/sessions/2026-06-01-task-345-ds1-pageshell-section.md` + the DS-2 session log (sibling style).

**Reference implementations to MIRROR (read, do NOT edit):**
- `src/components/ui/button.tsx` — the Button primitive (sizes/heights). ActionBar CONSUMES it; you must NOT change it. ActionBar enforces ONE shared height per row by composition (e.g. a single `size` applied to its children slot / documented contract), not by editing Button.
- `src/components/layout/PageShell.tsx` / `Section.tsx` / `PageHeader.tsx` — match file style, `cn` usage, story shape.

## Problem

There is no global primitive for the page-level action cluster. `docs/design-system.md §11.4` requires one:
right-aligned at `md:+`, stacked at `<md:`, all buttons at **one shared height per row** (the §15
Button-height governance), and **toolbars must never overflow horizontally** (they wrap or move overflow
actions into a menu; `overflow-x-auto` is acceptable for tables, NOT for toolbars). Today this is re-invented
per surface — the local-invention entropy `§7` forbids. ActionBar is deliberately isolated in its own slice
because Button-height governance is a known governance ambiguity that should be resolved once, verifiably.

## Goal

Create ONE server-safe Tier-2 primitive — `ActionBar` — that lays out a row/cluster of action controls
(Button primitives passed as children/slot) with the canonical responsive behaviour and one shared button
height, composing existing primitives and tokens only. Register it in the barrel + catalog. **Zero route adoption.**

## Current behavior to preserve (Note 19 + Note 20)

- **DS-1/DS-2 primitives unchanged** (`PageShell`/`Section`/`PageHeader` byte-identical; you only ADD a barrel line). → `git diff` empty.
- **Button primitive unchanged** — `src/components/ui/button.tsx` byte-identical. → `git diff src/components/ui/button.tsx` empty.
- **Existing barrel exports preserved** — `index.ts` still exports PageShell/Section/PageHeader; you ADD ActionBar.
- **Every existing route renders identically** — no route imports `ActionBar`. → grep = 0 hits.
- Admin primitives, `Header`/`Footer`/`MobileBottomNav`, `globals.css` unchanged. No existing control removed anywhere.

## Required after behavior

`import { ..., ActionBar } from '@/components/layout'` resolves. `ActionBar` renders its action children
right-aligned at `md:+` and stacked (column, full-width-friendly) at `<md:`; all buttons in a row share one
height; the toolbar never overflows horizontally at any of the 14 widths in any of the 4 locales — it wraps
or, when a `overflow`/`menu` affordance is provided by the consumer, defers overflow actions to it. Touch
targets stay ≥44px on touch widths (§12).

### Primitive spec (literal)

**`ActionBar`** — page-level action cluster (server component), typically rendered inside `PageHeader`'s
`action` slot or directly inside a `PageShell`/`Section`.
- **Server-safe — NO `'use client'`** (pure layout wrapper; no state). If you believe it needs a client boundary, STOP & ASK — it does not.
- Props (final shape to confirm against §11.4; if a decision is genuinely missing, STOP & ASK):
  - `children: ReactNode` — the action controls (Button primitives passed by the consumer).
  - `align?: 'start' | 'end'` (default `'end'`) — horizontal alignment at `md:+`.
  - `size?: <Button size union>` (default the canonical row height per §15) — the ONE shared height applied
    to the row; document how it is enforced (a single source of truth per row, NOT per-child ad-hoc heights).
    If §15 specifies the exact canonical height token, use it verbatim and cite it.
  - `as?: 'div' | 'nav'` (default `'div'`).
  - `className?: string` (merged via `cn`; defaults not blown away).
- Layout: `flex flex-wrap items-center gap-2`; `<md:` → `flex-col` (stacked, items stretch for full-width-friendly buttons); `md:+` → row, aligned per `align`. **Never `overflow-x-auto` on the toolbar** (§11.4); wrap instead.
- Composes existing Button primitive + tokens only — invents no new height, no new spacing scale, no new breakpoint, no new color.
- **Zero hardcoded user-facing strings** — all labels live in the consumer's Button children. No `messages/*.json` change.

> **No `globals.css` token this slice.** If you think a new token/height is unavoidable, STOP & ASK (the canonical height already exists per §15).

## Positive flow (happy path) — primitive rendering proof

- **Actor:** developer / Storybook. **Preconditions:** DS-1/DS-2 present; clean tree; `globals.css` + Button untouched.
- **Steps & expected responses:**
  1. `import { ActionBar } from '@/components/layout'` → resolves.
  2. `<ActionBar><Button>Save</Button><Button variant="outline">Cancel</Button></ActionBar>` → at `md:+` the two buttons sit in a right-aligned row at one shared height; at `<md:` they stack full-width.
  3. With 4–5 buttons at 320px → the row wraps (no horizontal scroll, no clipping); buttons keep ≥44px touch height.
  4. Stories render the §3 canon (14 widths × sq/en/uk/it) via the Storybook toolbar.
- **Success state:** `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; story renders; 14×4 evidence captured OR `OWNER QA REQUIRED`.
- **Post-conditions:** zero route files changed; DS-1/DS-2 + Button + admin byte-identical; `globals.css` byte-identical; catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch — each needs a story variant)

- **Single action:** one Button only → renders correctly aligned, no empty wrap artifacts. → Story.
- **Overflow / many actions at 320:** 4–5 buttons at 320px (longest-locale labels) → wraps, NEVER `overflow-x-auto`, no horizontal scroll, no clipping. → uk@320 story mandatory.
- **Long-locale buttons:** uk/sq long button labels at 320 and 480 → buttons grow/wrap without breaking the row or exceeding viewport. → Story variants.
- **`align="start"`:** left-aligned at `md:+`. → Story.
- **At 2560:** cluster stays at its aligned edge, not stranded/centered oddly. → Story.
- **className merge:** `className="mt-4"` extends without dropping flex/align classes. → Story or log note.

## Scope

Create `ActionBar.tsx`, ADD it to the barrel `index.ts`, create `ActionBar.stories.tsx`, register it in
`component-catalog.md`, update `backlog.md` (2–4 lines), write the session log. Nothing else.

## Out of scope (DO NOT)

- Do NOT create FilterBar (DS-4 — separate later kickoff).
- Do NOT edit the Button primitive (`src/components/ui/button.tsx`) or any `ui/**` primitive — ActionBar enforces one shared height by composition, not by restyling Button.
- Do NOT edit DS-1/DS-2 primitives beyond the single barrel-export addition.
- Do NOT adopt `ActionBar` in any page/route (`src/app/**`) — zero route adoption.
- Do NOT edit `globals.css`, admin primitives, `Header`/`Footer`/`MobileBottomNav`, `shared/**`, `listing/**`, `auth/**`, `src/modules/**`.
- Do NOT touch DB / Supabase / SQL / server actions / business logic / `messages/*`.
- Do NOT run `git add` / `git commit`.
- Do NOT use `overflow-x-auto` on the toolbar (§11.4). Do NOT present code-level analysis as final responsive QA.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** `ActionBar.tsx` created: server component (NO `'use client'`); `flex flex-wrap items-center gap-2`; `<md:` stacked column, `md:+` row aligned per `align` (default `end`); one shared button height per row (cite §15); NO `overflow-x-auto`; `className` merged via `cn`. → *Positive 2–3*, file:line.
- **AC-2** Button primitive **byte-identical** — `git diff src/components/ui/button.tsx` empty. ActionBar enforces shared height by composition only. → diff in log.
- **AC-3** Barrel exports PageShell, Section, PageHeader, **AND ActionBar** (prior exports preserved). → file:line.
- **AC-4** `globals.css` **byte-identical**. → `git diff src/app/globals.css` empty, in log.
- **AC-5** Zero hardcoded user-facing strings (labels live in consumer Buttons). **No `messages/*.json` change.** → grep proof.
- **AC-6** `ActionBar.stories.tsx` renders the §3 canon (14 widths) × 4 locales via the Storybook toolbar. → file:line.
- **AC-7** Negative-flow story variants: single-action; many-actions@320 (wrap, no scroll); uk/sq long labels@320+480; `align="start"`; @2560. → file:line.
- **AC-8** **Zero route adoption:** grep = 0 hits, in log. → file:line.
- **AC-9** DS-1/DS-2 primitives + Button + admin + `Header`/`Footer`/`MobileBottomNav` unchanged. → `git diff --stat` in log.
- **AC-10** `docs/component-catalog.md` registers `ActionBar` as §7 Tier-2 (update count). → file:line.
- **AC-11** Self-validation block (Note 18): `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; AC table all green; `ui-rules.md §17` pre-flight (incl. touch-target ≥44px PASS, toolbar-no-overflow PASS); scope=clean.
- **AC-12** §19 responsive QA: **14 widths × 4 locales** rendered evidence **OR** `OWNER QA REQUIRED`. Code-level analysis alone is NOT PASS.
- **AC-13** "Files Changed" table; **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
rg -n "from ['\"]@/components/layout['\"]|from ['\"]@/components/layout/ActionBar" src/app src/modules   # MUST be 0 hits
rg -n "'use client'" src/components/layout/ActionBar.tsx                                                  # MUST be 0 hits
rg -n "overflow-x-auto" src/components/layout/ActionBar.tsx                                               # MUST be 0 hits (toolbars wrap, not scroll)
git diff src/components/ui/button.tsx              # MUST be empty (Button untouched)
git diff src/app/globals.css                       # MUST be empty
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx  # MUST be empty
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
- **uk @ 320 is the longest-locale overflow stress check:** with multiple long-label buttons, the toolbar must wrap, never overflow horizontally, never `overflow-x-auto`.
- Confirm touch targets ≥44px at touch widths (§12). Run `ui-rules.md §17` pre-flight; paste output.
- **Real rendered browser/Storybook QA is required — code-level analysis is NOT proof of responsive PASS.**
- **Either** paste screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS.

## Required localization QA (sq / en / uk / it)

No runtime user-facing text ships in `ActionBar` (labels are in consumer Buttons), so **no `messages/*.json`
keys are added/changed** and `check:i18n` is a no-op PASS. Locale coverage = proving in Storybook across
**sq / en / uk / it** that long-locale button labels (uk, then sq/it) wrap/grow without breaking the row or
overflowing, especially **uk @ 320**. `en`-only proof is insufficient (§6). Introducing user-facing strings
is OUT OF SCOPE — prefer STOP & ASK; if unavoidable, full sq/en/uk/it parity + `check:i18n` is mandatory.

## STOP & ASK triggers

- DS-1/DS-2 primitives not on disk → STOP.
- The single shared Button height per `docs/ui-rules.md §15` is ambiguous or appears to require editing the Button primitive → STOP & ASK (do NOT restyle Button).
- You believe `ActionBar` needs `'use client'` → STOP (it does not).
- A toolbar appears to need `overflow-x-auto` to fit → STOP (it must wrap; §11.4).
- The primitive cannot be proven without adopting it in a route → STOP.
- The Storybook tooling cannot render the 14×4 matrix → STOP and record `OWNER QA REQUIRED`.
- Any required change would touch a FORBIDDEN path → STOP.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; AC-by-AC self-audit; `ui-rules.md §17` pre-flight output; 14×4 QA matrix
(or `OWNER QA REQUIRED`); confirmation Button + DS-1/DS-2 + admin + globals.css untouched; server-vs-client
note; explicit note on how the one-shared-height contract is enforced by composition. End with Files Changed table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + 1-line rationale — for
every file created/edited. The orchestrator validates it against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
