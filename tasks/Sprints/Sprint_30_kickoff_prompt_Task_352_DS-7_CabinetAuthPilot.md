# Sprint 30 — Task 352 kickoff (Sonnet) — DS-7: Cabinet/auth pilot (ONE cabinet/auth surface only)

> **Status: BLOCKED + OWNER REVIEW REQUIRED.**
> - **BLOCKED:** runs only AFTER DS-6 (Task 351, public route pilot) has shipped, been reviewed, and been
>   **owner-approved + committed** — the public pilot must prove the primitives in a real route before the
>   cabinet/auth surface (which carries edit flows) is migrated. Do not start until the orchestrator confirms DS-6 is done.
> - **OWNER REVIEW REQUIRED (exact target):** the *phase* is canonical (Task 344 DS-7 = "Cabinet/auth pilot —
>   one cabinet/auth surface"), but the **exact surface is NOT yet owner-confirmed.** Candidate surfaces (from
>   `docs/design-system.md §16` — auth/cabinet have NO container today and must migrate): an **auth card**
>   (e.g. login / register / password) using `content-container`, OR a **cabinet/profile form** using
>   `form-container`. **The owner must confirm the exact surface before this task is released.** Until then this
>   file is a QUEUED proposal, not READY.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     UI / layout / design-system route migration (ONE cabinet/auth surface — carries EDIT FLOWS)
Priority: high
Area:     design-system / responsive / cabinet/auth migration
Phase:    DS-7 of the design-system foundation queue — Phase 2/3 (cabinet/auth migration)
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — the ONE owner-confirmed cabinet/auth surface ONLY; nothing else):
          src/app/[locale]/<OWNER-CONFIRMED-AUTH-OR-CABINET-SURFACE>/page.tsx  (UPDATE — adopt PageShell/Section/PageHeader; form-container/content-container)
          (the form/edit client component(s) of THAT surface, ONLY if strictly required and listed in your plan)
          messages/sq.json · messages/en.json · messages/uk.json · messages/it.json  (ONLY if user-facing strings legitimately change — at parity; usually NONE)
          docs/component-catalog.md                  (UPDATE — record the surface as migrated, IF tracked)
          docs/design-system.md §16                 (UPDATE — flip ONLY that surface's status/container row to migrated)
          docs/backlog.md                            (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-352-ds7-cabinet-auth-pilot.md (NEW — session log + Files Changed table)

Area (FORBIDDEN to touch):
          ANY surface other than the single owner-confirmed cabinet/auth surface
          src/components/layout/*.tsx                 (primitives are DONE — consume, do NOT edit)
          src/components/auth/** form primitives      (consume AS-IS; do NOT restyle/refactor — unless the surface's own form component is the confirmed target and listed)
          src/app/globals.css                         (no token change)
          src/components/admin/** · src/app/admin/**  (NO admin migration here — DS-8)
          public routes already handled in DS-6 / any other public route
          DB / Supabase / SQL / migrations / server actions / business logic / auth logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You migrate EXACTLY ONE owner-confirmed cabinet/auth surface to consume
the layout primitives, **preserving every edit flow end-to-end** (input → validation → save → loading →
success → error → persisted-after-refresh). You do NOT change auth/business logic, do NOT edit the primitives,
do NOT migrate any other surface, do NOT touch admin, do NOT change `globals.css`, and do NOT run git.
Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real before/after diff and emits git commands.

## Pre-read (load ONLY these — per `docs/rule-index.md` "UI / layout / route migration" + edit-flow rules)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — **§4 (containers — content-container/form-container), §5–§7, §16 (find the surface's row), §18 (Phase 2/3), §19–§21 (QA).**
2. `docs/ai-behavior.md` — **Note 19 (UX flow preservation), Note 21 (control relocation), Note 23 (edit-flow preservation)** — these govern this task.
3. `docs/ui-rules.md` (§17 pre-flight), `docs/component-rules.md`, `docs/qa-rules.md`, `docs/state-authority.md`.
4. `docs/rls-rules.md` IF the surface is auth (so you do NOT alter any auth/session/security behaviour — layout only).
5. DS-1..DS-6 session logs + the five primitives' source + the DS-6 pilot as the migration reference pattern.
6. The confirmed surface's current `page.tsx` + its form/edit component(s) IN FULL — inventory every field and state before changing anything.

## Problem

Auth and cabinet surfaces currently have **no canonical container** (`docs/design-system.md §16` flags
auth/cabinet/static pages as "no container — must migrate, Phase 2–3"). After DS-6 proved the primitives on a
simple public route, the next graduated step is ONE cabinet/auth surface — the first surface with a real **edit
flow**, where layout migration must not break input/validation/save/error/persistence behaviour.

## Goal

Migrate the single owner-confirmed cabinet/auth surface to `PageShell` (`content-container` for auth cards /
`form-container` for cabinet forms) + `PageHeader`/`Section`, with **identical** behaviour and **every edit
flow fully intact**. Prove the primitives work on an edit surface; surface any primitive gap as STOP & ASK.

## Current behavior to preserve (Note 19 + Note 20 + Note 21 + Note 23 — EDIT-FLOW CRITICAL)

**Before changing anything, inventory the surface in the session log:** every field/input/select/switch,
its validation rule, its save behaviour, loading state, success state, error state, the value persisted after
refresh, every button/link/action, empty/loading states, and mobile layout. Then preserve ALL of it:
- **Every field/action that was editable before remains editable** (Note 23). If editing moves from one
  component to another, the new component MUST include: editable input/select/switch/control + validation +
  save behaviour + loading state + success state + error state + persisted value after refresh + localization
  if text changed + mobile usability. **A read-only label is not a replacement for an editable control** (Note 21).
- **No control silently removed** (Note 20) — kept, relocated (capability preserved), or explicitly owner-removed.
- **Auth/session/security/business logic unchanged** — this is layout/markup only; do NOT touch server actions,
  RLS, validation logic, or data flow.
- **URL/search-param state, SSR/CSR authority, redirects, and post-submit navigation unchanged.**
- **Primitives byte-identical** (consume, don't edit). → `git diff src/components/layout/*.tsx` empty.
- **Only the confirmed surface changes** — `git diff --stat src/app` shows that surface only; admin empty.

## Required after behavior

The surface renders inside `PageShell` with the correct container (`content-container` auth / `form-container`
cabinet), title in `PageHeader`, blocks in `Section`s — and every edit flow works exactly as before across all
14 widths × 4 locales: submit succeeds, validation errors show + localize, loading/success/error states render,
and the saved value persists after a refresh.

## Positive flow (happy path)

- **Actor:** a logged-in user (cabinet) or a user authenticating (auth).
- **Steps & expected responses:** open the surface → same fields/actions as before, now in the primitives →
  fill + submit a valid form → save succeeds, success state shows, value persists after refresh → all identical
  to pre-migration, at every width/locale.
- **Success state:** `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; 14×4 live QA; every edit flow verified incl. persisted-after-refresh.
- **Post-conditions:** only the confirmed surface + its docs changed; primitives + globals.css + auth/business logic + other surfaces untouched.

## Negative flow (every off-happy-path branch)

- **Invalid submit:** each validation rule fires with the same localized error, mobile-usable, inside the new layout. → verify each rule.
- **Save failure (server/network error):** the error state renders correctly inside the primitives; the user can retry; no data loss. → verify.
- **Loading state:** in-flight submit shows the same loading affordance; controls disabled as before. → verify.
- **Persisted-after-refresh:** after a successful save, reloading the surface shows the saved value (Note 23). → verify explicitly.
- **Long-locale (uk/sq) at 320:** labels/inputs/buttons/errors wrap, never overflow; the form stays usable. → verify uk@320.
- **Auth edge (if auth surface):** wrong-password / already-authenticated / redirect behaviour unchanged. → verify.
- **A control/field has no clean home, or migration would make it read-only** → STOP & ASK; do NOT ship a read-only downgrade.

## Scope

Migrate the ONE owner-confirmed cabinet/auth surface's `page.tsx` (+ strictly-required form/edit component(s))
to the layout primitives; update `messages/*` ONLY if strings legitimately change (sq/en/uk/it parity); flip
that surface's §16 status row + catalog flag; update backlog (2–4 lines); write the session log with the full
edit-flow inventory + 14×4 QA. Nothing else.

## Out of scope (DO NOT)

- Do NOT migrate or touch any surface other than the single owner-confirmed cabinet/auth surface.
- Do NOT edit the layout primitives (`src/components/layout/*.tsx`) — consume them; surface gaps via STOP & ASK.
- Do NOT change auth/session/security logic, validation logic, server actions, DB/SQL, or data flow.
- Do NOT downgrade any editable control to read-only (Note 21/23).
- Do NOT migrate admin (DS-8 audit) or any other public route.
- Do NOT change `globals.css`. Do NOT run `git add` / `git commit`. Do NOT present code-level analysis as final responsive QA.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

- **AC-1** A full before-change inventory of the surface is in the session log: every field + validation + save + loading + success + error + persisted-after-refresh + every action/link + empty/loading + mobile layout. → session-log section.
- **AC-2** The surface's `page.tsx` consumes `PageShell` with the correct container (`content-container` auth / `form-container` cabinet) + `PageHeader`/`Section`. → file:line.
- **AC-3** **Every edit flow preserved (Note 23):** every previously-editable field/action remains editable with validation+save+loading+success+error+persisted-after-refresh+localization+mobile usability — cross-checked against AC-1. No control silently removed or downgraded to read-only. → AC-1 cross-check + QA notes.
- **AC-4** Auth/session/security + business logic + server actions + DB untouched. → `git diff` of those paths empty / not in scope, confirmed in log.
- **AC-5** Layout primitives **byte-identical** — `git diff src/components/layout/*.tsx` empty. → diff in log.
- **AC-6** **Only the confirmed surface changed** under `src/app` — `git diff --stat src/app` shows that surface only; admin empty. → diff in log.
- **AC-7** `messages/*` changed ONLY if strings legitimately changed, then at **sq/en/uk/it parity** + `check:i18n` PASS; otherwise no `messages/*` change. → diff + check:i18n in log.
- **AC-8** `globals.css` **byte-identical**. → diff in log.
- **AC-9** §16 status row for the surface flipped to migrated (that row only); catalog flag updated if tracked. → file:line.
- **AC-10** Self-validation block (Note 18): `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; `ui-rules.md §17` pre-flight; scope=clean.
- **AC-11** §19 responsive QA on the LIVE surface: **14 widths × 4 locales** rendered evidence incl. edit-flow states **OR** `OWNER QA REQUIRED`. Code-level analysis alone is NOT PASS.
- **AC-12** "Files Changed" table; **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx src/components/layout/ActionBar.tsx src/components/layout/FilterBar.tsx   # MUST be empty
git diff --stat src/app                            # MUST show ONLY the confirmed cabinet/auth surface
git diff --stat src/components/admin               # MUST be empty
git diff src/app/globals.css                       # MUST be empty
git diff --stat messages                            # empty UNLESS strings legitimately changed (then sq/en/uk/it parity)
npx tsc --noEmit
npm run build
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and use the closest canonical validation.

## Required responsive QA (MANDATORY — `docs/design-system.md §19`; rendered on the LIVE surface, not code-level)

- Render the LIVE surface at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells) in a real browser.
- **uk @ 320 is the longest-locale overflow stress check:** every label/input/button/error wraps, never overflows; the form stays usable + submittable.
- Exercise every edit-flow state (valid submit, each validation error, save failure, loading, success, persisted-after-refresh) at mobile + desktop widths.
- Run `ui-rules.md §17` pre-flight; paste output. **Real rendered browser QA is required — code-level analysis is NOT proof of responsive PASS** (§21).
- **Either** paste screenshot evidence **OR** write `OWNER QA REQUIRED` and STOP before claiming PASS.

## Required localization QA (sq / en / uk / it)

If the migration changes NO user-facing strings (expected), `check:i18n` is a no-op PASS and locale coverage =
proving the surface + all edit-flow states render correctly across **sq / en / uk / it** at all 14 widths (uk
longest, esp. uk@320, including localized validation/error messages). If strings DO change, update
`messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` at full parity and `npm run
check:i18n` MUST PASS. `en`-only proof is insufficient (§6).

## STOP & ASK triggers

- The exact cabinet/auth surface is not owner-confirmed → STOP (do not pick one yourself).
- DS-6 (public pilot) is not shipped + owner-approved + committed → STOP (gated).
- Migration would make any editable control read-only or drop a field/action → STOP & ASK (no read-only downgrade).
- Migration appears to require changing auth/session/security/validation/business logic or a server action → STOP (layout only).
- A primitive lacks a needed capability → STOP & ASK (do NOT edit the primitive).
- The migration appears to require touching another surface, admin, or `globals.css` → STOP.
- The live 14×4 QA (incl. edit-flow states) cannot be rendered → STOP and record `OWNER QA REQUIRED`.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; before/after edit-flow inventory with every field/action's post-migration status
+ explicit persisted-after-refresh confirmation; AC-by-AC self-audit; `ui-rules.md §17` pre-flight; 14×4
live-surface QA matrix incl. edit-flow states (or `OWNER QA REQUIRED`); confirmation auth/business logic +
primitives + other surfaces + globals.css untouched. End with the Files Changed table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + 1-line rationale — for
every file created/edited. The orchestrator validates it against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
