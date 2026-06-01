# Sprint 30 — Task 351 kickoff (Sonnet) — DS-6: Public route pilot (FIRST route migration — ONE route only)

> **Status: BLOCKED + OWNER REVIEW REQUIRED.**
> - **BLOCKED:** route migration must NOT begin until the entire primitive foundation (DS-1..DS-5,
>   Tasks 345/347/348/349/350) is shipped, reviewed, and **owner-approved + committed**. This is the
>   `docs/design-system.md §18` / Task 344 hard rule. Do not start until the orchestrator confirms DS-1..DS-5 are done.
> - **OWNER REVIEW REQUIRED (exact target):** the *phase* is canonical (Task 344 DS-6 = "adopt primitives
>   on ONE public route"), but the **exact pilot route is NOT yet owner-confirmed**. Proposed candidate:
>   **`/[locale]/contact`** (simplest — a `form-container` page, lowest blast radius per `docs/design-system.md §16.A`).
>   Alternative candidates: `/[locale]/listings/[slug]` (content-container) — heavier. **The owner must confirm the
>   exact route before this task is released.** Until then this file is a QUEUED proposal, not READY.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system route migration (FIRST migration — exactly ONE public route)
Priority: high
Area:     design-system / responsive / public route migration
Phase:    DS-6 of the design-system foundation queue — Phase 2 (route migration) BEGINS here
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — the ONE owner-confirmed pilot route ONLY; nothing else):
          src/app/[locale]/<OWNER-CONFIRMED-ROUTE>/page.tsx        (UPDATE — adopt PageShell/Section/PageHeader[/ActionBar/FilterBar as the page needs])
          (any co-located client/server sub-components of THAT route, ONLY if strictly required and listed in your plan)
          messages/sq.json · messages/en.json · messages/uk.json · messages/it.json  (ONLY if the migration legitimately changes user-facing strings — at parity; usually NONE)
          docs/component-catalog.md                  (UPDATE — record the pilot route as migrated, IF the catalog tracks route adoption)
          docs/design-system.md §16.A               (UPDATE — flip the pilot route's "Phase" / status row to migrated; ONLY that row)
          docs/backlog.md                            (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-351-ds6-public-route-pilot.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          ANY route other than the single owner-confirmed pilot route (no "while I'm here" migrations)
          src/components/layout/*.tsx                 (the primitives are DONE — consume them, do NOT edit them)
          src/app/globals.css                         (no token change)
          src/components/admin/** · src/app/admin/**  (NO admin migration in this phase)
          cabinet/auth surfaces                       (DS-7 — not this task)
          DB / Supabase / SQL / migrations / server actions / business logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You migrate EXACTLY ONE owner-confirmed public route to consume the
DS-1..DS-4 layout primitives — preserving every existing control, link, action, form, and behaviour on that
page. You do NOT edit the primitives, do NOT migrate any other route, do NOT touch admin or cabinet/auth, do
NOT change `globals.css` or business logic, and do NOT run git. Outside-allowlist = scope violation = STOP &
ASK. Opus reviews the real before/after diff and emits git commands.

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / route migration")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — **§4 (containers), §5 (spacing), §6 (typography), §7 (Tier ownership), §16.A (public route snapshot — find the pilot route's row, its container + target), §18 (phased migration — Phase 2), §19–§21 (QA).**
2. `docs/ui-rules.md` (§17 pre-flight), `docs/component-rules.md`, `docs/qa-rules.md`.
3. `docs/state-authority.md` (SSR vs client authority — preserve the route's existing rendering authority).
4. DS-1..DS-5 session logs + the five primitives' source (READ — to use them correctly).
5. The pilot route's current `page.tsx` (+ its sub-components) IN FULL — you must inventory everything it renders before changing it.

## Problem

DS-1..DS-5 shipped the public layout primitives but **no public route consumes them yet** (DS-1..DS-5 were
all zero-route-adoption). Route migration (`docs/design-system.md` Phase 2) must begin with ONE small, explicit
public route to prove the primitives in a real page before any broader migration — exactly the graduated,
owner-gated approach Task 344 mandates (no big-bang migration).

## Goal

Migrate the single owner-confirmed pilot public route to use `PageShell` (+ `Section`/`PageHeader`, and
`ActionBar`/`FilterBar` only if the page genuinely has those clusters) instead of its bespoke container/header
markup — with **identical** rendered behaviour, all controls preserved, and full 14×4 rendered QA. Prove the
primitives work in production layout on one route; surface any primitive gap as a STOP & ASK (do not patch the
primitive here).

## Current behavior to preserve (Note 19 + Note 20 + Note 21 control-relocation)

**Before changing anything, inventory the pilot route in the session log:** every heading, paragraph, link,
button, form field + its validation/save/loading/success/error states, filter, search, tab, image, empty
state, loading state, and mobile layout. Then preserve ALL of it:
- **Every existing control must remain** — or move to a specified new place (relocation), or be explicitly
  listed as removed by the owner. **Silent removal is forbidden** (Note 20).
- **Control relocation (Note 21):** this task may change WHERE a control appears (e.g. a page action moving
  into `PageHeader`'s `action` slot / `ActionBar`), but it must NOT remove the underlying capability. If a
  control's old location becomes read-only, the new editable location must be implemented in the SAME task. A
  read-only label is not a replacement for an editable control. The task is incomplete if the user can no
  longer perform any action they could before.
- **Edit-flow preservation (Note 23):** if the pilot route contains a form/edit flow, every field/action that
  was editable before remains editable, with validation + save + loading + success + error states + persisted
  value after refresh + localization + mobile usability intact.
- **URL/search-param state, SSR/CSR authority, data fetching, and business logic are unchanged** — this is a
  layout/markup migration, not a behavioural rewrite.
- **The primitives are byte-identical** (you consume them; you do not edit them). → `git diff src/components/layout/*.tsx` empty.
- **No other route changes** — `git diff --stat src/app` shows ONLY the pilot route. → in log.

## Required after behavior

The pilot route renders inside `PageShell` (correct container per its §16.A row: `wide`/`narrow`/`form`),
with its title/intro in a `PageHeader` and content blocks in `Section`s, page actions in `ActionBar` (if any),
filters in `FilterBar` (if any) — and behaves EXACTLY as before across all 14 widths × 4 locales, with every
control reachable and every flow working.

## Positive flow (happy path)

- **Actor:** end user on the pilot route.
- **Steps & expected responses:** the user loads the route → sees the same content, header, and actions as
  before, now laid out via the primitives; performs every action that was available before (submit form /
  follow links / use filters / etc.) → all succeed identically; layout is correct at every width/locale.
- **Success state:** `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; 14×4 rendered QA on the live route; every inventoried control verified working.
- **Post-conditions:** only the pilot route + its docs changed; primitives + globals.css + other routes untouched.

## Negative flow (every off-happy-path branch)

- **Form validation errors** (if the route has a form): invalid input → same error states as before, localized, mobile-usable. → verify.
- **Empty / loading / error data states:** the route's empty/loading/error UI renders correctly inside the new primitives. → verify each.
- **Long-locale (uk/sq) content at 320:** headings/labels/buttons wrap, never overflow. → verify uk@320.
- **A control has no obvious home in the primitives** → do NOT drop it; STOP & ASK (relocation decision is the owner's). 
- **A primitive lacks a capability the route needs** → do NOT edit the primitive; STOP & ASK for a follow-up primitive task.

## Scope

Migrate the ONE owner-confirmed public route's `page.tsx` (+ strictly-required co-located sub-components) to
the layout primitives; update `messages/*` ONLY if strings legitimately change (at sq/en/uk/it parity); flip
that route's §16.A status row + catalog adoption flag; update backlog (2–4 lines); write the session log with
the full before/after control inventory + 14×4 QA. Nothing else.

## Out of scope (DO NOT)

- Do NOT migrate, "tidy", or touch ANY route other than the single owner-confirmed pilot route.
- Do NOT edit the layout primitives (`src/components/layout/*.tsx`) — consume them; surface gaps via STOP & ASK.
- Do NOT migrate admin or cabinet/auth surfaces (admin is out of all DS route phases except DS-8 audit; cabinet/auth is DS-7).
- Do NOT change `globals.css`, data fetching, business logic, server actions, DB/SQL.
- Do NOT remove any existing control/link/action/field silently (Note 20/21/23).
- Do NOT run `git add` / `git commit`. Do NOT present code-level analysis as final responsive QA.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** A full before-change control inventory of the pilot route is in the session log (headings, links, buttons, form fields + states, filters, search, tabs, images, empty/loading/error states, mobile layout). → session-log section.
- **AC-2** The pilot route's `page.tsx` consumes `PageShell` with the correct container per its §16.A row, plus `PageHeader`/`Section`/(`ActionBar`/`FilterBar` as applicable). → file:line.
- **AC-3** **Every inventoried control remains reachable + functional** (or relocated per an explicit owner decision; none silently removed). Edit/forms keep validation+save+loading+success+error+persisted-after-refresh. → AC-1 inventory cross-checked, file:line + QA notes.
- **AC-4** Layout primitives **byte-identical** — `git diff src/components/layout/*.tsx` empty. → diff in log.
- **AC-5** **Only the pilot route changed** under `src/app` — `git diff --stat src/app` shows that route only. → diff in log.
- **AC-6** `messages/*` changed ONLY if strings legitimately changed, and then at **sq/en/uk/it parity** with `npm run check:i18n` PASS; otherwise no `messages/*` change. → diff + check:i18n in log.
- **AC-7** `globals.css` **byte-identical**; business logic / server actions / DB untouched. → diff in log.
- **AC-8** §16.A status row for the pilot route flipped to migrated (that row only); catalog adoption flag updated if tracked. → file:line.
- **AC-9** Self-validation block (Note 18): `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; `ui-rules.md §17` pre-flight; scope=clean.
- **AC-10** §19 responsive QA on the LIVE route: **14 widths × 4 locales** rendered evidence **OR** `OWNER QA REQUIRED`. Code-level analysis alone is NOT PASS.
- **AC-11** "Files Changed" table; **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx src/components/layout/ActionBar.tsx src/components/layout/FilterBar.tsx   # MUST be empty (primitives consumed, not edited)
git diff --stat src/app                            # MUST show ONLY the pilot route
git diff src/app/globals.css                       # MUST be empty
git diff --stat src/components/admin               # MUST be empty
git diff --stat messages                            # empty UNLESS strings legitimately changed (then sq/en/uk/it parity)
npx tsc --noEmit
npm run build
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and use the closest canonical validation.

## Required responsive QA (MANDATORY — `docs/design-system.md §19`; rendered on the LIVE route, not code-level)

- Render the LIVE pilot route at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells) in a real browser (dev server).
- **uk @ 320 is the longest-locale overflow stress check:** every heading/label/button/field wraps, never overflows; the form (if any) stays usable.
- Exercise every flow (submit/links/filters/empty/loading/error) at mobile + desktop widths.
- Run `ui-rules.md §17` pre-flight; paste output. **Real rendered browser QA is required — code-level analysis is NOT proof of responsive PASS** (§21).
- **Either** paste screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS.

## Required localization QA (sq / en / uk / it)

If the migration changes NO user-facing strings (the expected case), `check:i18n` is a no-op PASS and locale
coverage = proving the route renders correctly across **sq / en / uk / it** at all 14 widths (uk longest, esp.
uk@320). If the migration DOES change user-facing strings, you MUST update `messages/sq.json`, `messages/en.json`,
`messages/uk.json`, `messages/it.json` at full parity and `npm run check:i18n` MUST PASS. `en`-only proof is
insufficient (§6).

## STOP & ASK triggers

- The exact pilot route is not owner-confirmed → STOP (this file proposes `/[locale]/contact`; do not pick one yourself).
- DS-1..DS-5 are not all shipped + owner-approved + committed → STOP (route migration is gated).
- A control has no clean home in the primitives, or a relocation would change capability → STOP & ASK (owner decides).
- A primitive lacks a needed capability → STOP & ASK (do NOT edit the primitive).
- The migration appears to require touching another route, admin, cabinet/auth, business logic, or `globals.css` → STOP.
- The live-route 14×4 QA cannot be rendered → STOP and record `OWNER QA REQUIRED`.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; before/after control inventory with every control's post-migration status
(kept / relocated-to / removed-by-owner); AC-by-AC self-audit; `ui-rules.md §17` pre-flight; 14×4 live-route QA
matrix (or `OWNER QA REQUIRED`); confirmation primitives + other routes + globals.css + business logic
untouched. End with the Files Changed table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + 1-line rationale — for
every file created/edited. The orchestrator validates it against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
