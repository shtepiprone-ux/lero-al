# Kickoff — Task 454 REWORK-2 (Epic LV / Sprint 36, LV.1)
## AC1 not actually satisfied: the drift-guard guards a decoy copy, not the real audit script

> **Executor:** Sonnet 4.6. **Status:** REWORK round 1 closed B2/B3/B4; **B1 is still open.** This is the ONLY
> remaining blocker for Task 454. Do not touch anything else. Prior kickoffs:
> `Sprint_36_kickoff_prompt_Task_454.md` + `…_REWORK.md` (contract still applies; no write-path; no git).

## What the round-1 rework actually produced (verified in the real diff)

There are now **three** copies of the visibility policy:
1. `src/modules/listings/lib/visibility.ts` → `PUBLIC_VISIBLE_STATUSES` (canonical).
2. `scripts/audit-listing-visibility.mjs` → its **own** `PUBLIC_VISIBLE_STATUSES` + `classifyHiddenReason`
   (this is the copy the audit run actually executes).
3. `src/modules/listings/lib/__tests__/visibility.test.ts` (lines ~131–182) → a **third**, hand-typed
   `SCRIPT_POLICY` + `scriptClassifyHiddenReason`, with the comment "Mirror from scripts/… — must stay in sync."

The "drift guard" test asserts **#3 deep-equals #1**. But the audit runs on **#2**, and the test never imports
from the `.mjs` (which exports nothing). **Result: if the real audit script (#2) drifts from canonical, the test
still passes** — it only compares the test's own decoy literal (#3) to canonical (#1). The guard protects a copy
that nothing executes. This is a false-green / no-op gate (agent-contract clause 15) — **AC1 is not met.**

## Required fix — bind the guard to the REAL script artifact

> **🔵 OWNER-DIRECTED 2026-06-18: implement Option A.** It is the smaller, controlled patch (no loader/tsx/devDep).
> Use Option B ONLY if Option A turns out infeasible — and if so, **STOP and ASK** before taking it; do not pick B
> on your own.

**Option A (DIRECTED) — make the audit script importable and have the test assert against ITS exports.**
1. In `scripts/audit-listing-visibility.mjs`: `export const PUBLIC_VISIBLE_STATUSES = …` and
   `export function classifyHiddenReason(…)` (the real ones the script uses).
2. Make the module **safe to import** (importing it must NOT run the audit / hit the network / call `process.exit`):
   move the supabase client creation + query into `main()`, and gate execution behind an entry-point check, e.g.
   ```js
   import { fileURLToPath } from 'node:url'
   if (process.argv[1] === fileURLToPath(import.meta.url)) main()
   ```
   (top-level `config({path:'.env.local'})` is fine; just don't create the client or read required env at import time).
3. In `visibility.test.ts`: **delete** the hand-typed `SCRIPT_POLICY`/`scriptClassifyHiddenReason` (#3) and instead
   `import { PUBLIC_VISIBLE_STATUSES as SCRIPT_POLICY, classifyHiddenReason } from '../../../../scripts/audit-listing-visibility.mjs'`
   (fix the relative path), then assert `SCRIPT_POLICY` deep-equals the canonical policy AND `classifyHiddenReason`
   agrees with `isListingPubliclyVisible` across all 6 statuses × {future, past, null}. Now the test fails if the
   **actual script** drifts.

**Option B — eliminate copy #2 entirely.** Extract the policy + classifier into a single runtime-safe module
(`.mjs` or dependency-free `.ts` consumed via a `tsx`/loader) that BOTH `visibility.ts` and the audit script
import. Then there is one source, the script has no mirror, and the drift test is unnecessary (a single import-path
test suffices). Only do this if it stays `tsc`/lint/build green; if it needs a new devDep, STOP and ASK first.

Either way: **after this fix there must be no policy copy that can drift undetected.** A hand-typed literal in the
test that mirrors a hand-typed literal in the script is not acceptable.

## Acceptance criteria (orchestrator re-checks against the real diff)

1. **AC1-real:** the drift test imports the policy/classifier from the **actual** `audit-listing-visibility.mjs`
   exports (Option A) OR copy #2 no longer exists because script + `visibility.ts` share one module (Option B).
   The test in `visibility.test.ts` no longer contains an independent hand-typed `SCRIPT_POLICY`/classifier.
2. **Proof it's real (planted-violation):** in the session log, paste a transcript where you temporarily change
   the script's `requiresUnexpired` for one status (or a status's `publicEligible`) and the drift test **FAILS**;
   then revert and it passes. A guard that can't be made to fail is still a no-op.
3. Importing the script in the test does **not** execute the audit (no network, no `process.exit`) — confirmed by
   the test suite running offline with no `.env.local`.
4. Untouched: `applyPublicVisibility` mixed-policy throw (B2), `getSiteStats` recorded decision (B3), the audit
   report + run result (B4), all existing visibility + regression tests. Re-run them: still green.
5. `npx tsc --noEmit`=0, lint clean, file-integrity transcript, no write-path calls (grep). No git emitted.

## Reminder

Still LV.1 only. Even once AC1-real lands, the production bug remains until LV.2 + LV.3 + LV.4. Do not mark the
Epic complete.
