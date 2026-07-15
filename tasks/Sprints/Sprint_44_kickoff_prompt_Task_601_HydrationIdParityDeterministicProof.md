# Task 601 — Deterministic, noise-immune proof that the authenticated-header `useId` hydration mismatch is caught

Sprint 44 (Epic MM Phase-2 / Epic RS — Regression Shield). Follow-up from the Task 600 native run.

> **Why this exists (owner native run, 2026-07-15).** After Task 600 hardened `check:hydration`, the owner
> ran the AC5 native proof against `next dev` with a real captured session. The result was **confounded, not
> clean**: with the FIX applied the gate FAILed on *unrelated bell-less routes* (`/en/listings`, `/sq`, `/uk`)
> with a generic React "some attributes… didn't match" warning; with the bug (`ssr:false`) replanted it went
> **all-PASS**. The FAILs anti-correlated with the code and tracked server warmth (cold first-compile runs
> FAILed, warm runs passed). Conclusion: **`check:hydration`'s console-scan has a dev-mode Turbopack noise
> floor — confirmed NATIVELY, not just in the sandbox — that cannot isolate the specific Task 599 header
> `useId` mismatch.** So the Task 599 / 600 registry row is still 🟡: we have no deterministic automated proof
> the mismatch is caught. This task builds one that is immune to dev noise, then flips the row.

## Pre-read (rule-index → regression/critical-flow + governance)
**Always:** `docs/agent-contract.md` (clauses 1–16, esp. 14 file-integrity + 15 regression), `docs/backlog.md`, `docs/critical-flow-registry.md` (the "Authenticated header hydration — NotificationBell SSR shell" row).
**Regression:** `tasks/Epics/Epic_RS_Regression_Shield.md`, `docs/qa-rules.md`.
**Context:** `docs/sessions/2026-07-15-task600-hydration-gate-harden-error-page.md`, `docs/sessions/2026-07-15-task599-header-auth-hydration-ssr-bell-fix.md`, `tasks/Sprints/Sprint_44_kickoff_prompt_Task_600_HydrationGateHardenErrorPage.md`.

## Root cause of the noise (already diagnosed — do NOT re-litigate)
`check:hydration` decides PASS/FAIL by scanning `page.on('console')` for React hydration warnings. In `next dev`
+ Turbopack those warnings fire transiently on first-compile / HMR for routes that have nothing to do with the
header (bell-less guest routes), and are suppressed once a route is warm. React ALSO strips hydration-mismatch
warnings from production builds entirely (documented in the script header + Task 599). So **neither dev (too
noisy) nor prod (warnings stripped) console-scanning can be the source of truth for this specific bug.**

The bug itself is a `useId` counter offset: `dynamic(..., { ssr:false })` on `NotificationBell` means the bell
is absent from the SERVER tree but present on the CLIENT tree, shifting React's `useId` sequence, so the
`LocaleSwitcher` / `UserMenu` Mantine Menu **target ids differ between the server HTML and the hydrated DOM**.
That id divergence is a *physical, deterministic artifact in the DOM* — it exists regardless of whether React
emits a console warning. **Detect the id divergence directly; do not rely on the console warning.**

## Scope (ONLY these files)
- A NEW deterministic test/harness (preferred: `scripts/check-header-id-parity.mjs` + a `package.json` alias, mirroring the existing `check:hydration:*` self-tests). If you judge a vitest/RTL `renderToString`+`hydrateRoot` test can reproduce the Next `dynamic(ssr:false)` offset faithfully, propose it in a STOP-AND-ASK first — do NOT assume RTL reproduces the Next dynamic-import boundary.
- `package.json` — the new script alias.
- `docs/critical-flow-registry.md` — flip the 599/600 row to ✅ once the new test genuinely catches the mismatch (planted-violation proof) AND passes on the fixed code.
- Session log + `docs/backlog.md`.
- **Do NOT touch product code (`src/`).** This is a test/tooling task only. The `ssr:false` replant used to prove the gate is a throwaway edit you make, capture, and revert within the session (confirm `git status --porcelain -- src/` is clean before writing the "Files Changed" table).

## Implementation (literal — primary approach)
A server-HTML-vs-hydrated-DOM **id-parity** check, run against a **production build** (`next build` + `next start`) so there is ZERO Turbopack dev noise, using a real captured session:
1. With a captured `storageState` (reuse `npm run capture:admin-session` → `playwright/.auth/admin-storage-state.json`), issue an authenticated **request** to `/en` and get the **raw SSR HTML** (Playwright `request.get` with the storage-state cookies, OR `page.goto` then read `await response.text()` before hydration).
2. Parse the header Menu **target ids** from the SSR HTML — the `id` / `aria-controls` / `data-*` attributes on the `LocaleSwitcher` and `UserMenu` Mantine Menu targets. If the exact attribute/selector carrying the Mantine `useId` target id is uncertain, **STOP and ASK** — do not guess a selector that silently never matches (that is a no-op gate, the exact failure Task 600 fixed).
3. Load the same `/en` authenticated in a real browser context, let it fully hydrate, and read the SAME elements' ids from the live DOM.
4. **Assert server id === client id** for every header Menu target. Any divergence → FAIL, with the specific server-vs-client id pair printed. This is warning-independent and prod-noise-free.
5. Repeat for `/uk` (locale parity). Optionally `/sq`/`/it` if cheap.

## Positive flow (happy path)
Actor: CI / owner runs the new `check:header-id-parity` against a prod build with a captured session.
1. Fixed code (`Header.tsx` static import of `NotificationBell`, current HEAD) → server ids === client ids on `/en`+`/uk` → **PASS**, deterministically, on ≥3 consecutive runs with no flakiness.

## Negative flow (every off-happy-path branch)
- **`ssr:false` replanted on `NotificationBell` import in `Header.tsx`:** bell absent server-side, present client-side → header Menu target ids diverge → **FAIL** with the printed server/client id pair. This is the planted-violation proof (clause 15) — the test MUST FAIL here or it is a no-op.
- **No session provided:** the authenticated header shape never renders → mark NOT-REAL-COVERAGE / skip, never a false PASS (same discipline as `check:hydration`).
- **Selector for the Menu target id uncertain:** STOP and ASK — do not ship a selector that never matches.
- **Prod build not running / wrong port:** fail-fast with a clear message (mirror `check:hydration`'s "is the server running?").

## Acceptance criteria (each verifiable in the diff)
1. New deterministic id-parity check exists, is CI-describable, and reads server SSR ids + hydrated DOM ids and asserts equality on the header Menu targets. (file:line)
2. Runs against a **production** build (or otherwise proven immune to the dev Turbopack noise floor documented in Task 600) — NOT dependent on React console warnings. (file:line / session-log rationale)
3. `package.json` alias added, mirroring `check:hydration:*`. (file:line)
4. **Planted-violation proof (clause 15):** with `ssr:false` replanted the new check FAILs on `/en`+`/uk` (paste transcript with the diverging id pair); reverted → PASS ≥3/3 consecutive, zero flakiness (paste transcript). `git status --porcelain -- src/` clean afterward.
5. `docs/critical-flow-registry.md` 599/600 row flipped to ✅ **only** after AC4 is genuinely green both directions; the command recorded.
6. Gates: `node --check` (if `.mjs`), `tsc`=0, eslint clean, `check:file-integrity`, `check:mojibake` green. Existing `check:hydration:*` self-tests still green (this task does not touch `check-hydration-console.mjs`).
7. Session log: AC-by-AC self-audit, "Files Changed" table, both planted/reverted transcripts. `docs/backlog.md` + registry updated. NO `git add`/`git commit` (orchestrator emits at review).

## Hard contract
No product-code (`src/`) change in the final diff (the `ssr:false` replant is throwaway, reverted, verified clean). Detect the id divergence DIRECTLY — do NOT reintroduce or lean on React console-warning scanning for this bug (that path is proven noisy in dev and stripped in prod). Do NOT guess the Menu-target-id selector — verify it against the real rendered header or STOP and ASK. If, after investigation, the `dynamic(ssr:false)` offset cannot be reproduced deterministically by ANY id-parity approach, STOP and ASK the orchestrator before writing a weaker proof. Self-validate before "complete"; "Files Changed" table required; executor emits NO git.
