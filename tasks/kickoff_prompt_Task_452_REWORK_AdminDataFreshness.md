# Task 452 — REWORK (Epic KK Slice KK.1, Admin Data Freshness)

> **Executor:** Sonnet 4.6. **Read this file directly.** This is a SCOPED REWORK of the already-implemented
> Task 452 — do NOT re-do the whole task. The hook, the single `AdminShell` mount, the 4 priority manager
> re-syncs, the CI wiring, and the silent-UX decision are all CORRECT and stay. Fix ONLY the four items below.
> If anything is ambiguous, STOP and ASK the orchestrator (agent-contract clause 2).
>
> **Base kickoff:** `tasks/kickoff_prompt_Task_452_AdminDataFreshness.md` (all original rules still apply).
> **Orchestrator diff review 2026-06-17 found 2 quality blockers** — neither is visible from the session-log
> summary; both were found in the real files.

## Pre-read (load ONLY these)

- `docs/agent-contract.md` (clauses 1, 2, 9, 14, 15)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` (the Task 452 row — its planted-violation proof must become real)
- `tasks/Epics/Epic_KK_Admin_Data_Freshness.md` (KK.1 / KK.2 boundary)
- `docs/state-authority.md` (the `useEffect([prop])` Live-L3 re-sync pattern — for the verdict corrections)

## Blocker 1 — hook fires a spurious TRAILING refresh ~minInterval after a focus+visibility burst

**Defect (confirmed in `src/hooks/useAdminPageFreshness.ts`):** on a `focus`+`visibilitychange→visible` burst,
the first event takes the immediate branch (and never sets `timerRef`), so the second event finds `timerRef`
null, computes `remaining ≈ minIntervalMs`, and schedules a `setTimeout` that fires a **second** `router.refresh()`
~`minIntervalMs` later. Result: one burst = 1 immediate refresh **+ 1 spurious delayed refresh**. This violates
the kickoff's "collapse bursts into ONE refresh" + "debounce/min-interval-only coalescing" contract (base kickoff
Negative flow → "Scheduled/burst refresh already queued").

**Required fix — leading-edge-only throttle, NO trailing timer.** Drop the `setTimeout`/`timerRef` trailing
machinery entirely. The hook fires on the leading edge if (and only if) `minIntervalMs` has elapsed since the
last refresh; any event inside the interval is simply dropped (no deferred catch-up). Reference shape:

```ts
const scheduleRefresh = useCallback(() => {
  if (typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return
  const now = Date.now()
  if (now - lastRefreshRef.current < minIntervalMs) return
  lastRefreshRef.current = now
  router.refresh()
}, [router, minIntervalMs])
```

This is correct because returning to a tab after any real absence has `elapsed ≥ minIntervalMs` → leading
refresh fires; the only dropped refreshes are within-interval burst duplicates, which is exactly the intent. No
legitimate refresh is lost. Keep the `focus` + `visibilitychange→visible` listeners and the unmount cleanup.

## Blocker 1b — the throttle test passes for the WRONG reason; add a real trailing-refresh guard

**Defect (confirmed in `src/hooks/__tests__/useAdminPageFreshness.test.ts`):** the existing `throttles:` test
asserts `toHaveBeenCalledTimes(2)` after the final `focus`, but with the current code that 2nd call is the
**trailing refresh from the first burst** firing during `vi.advanceTimersByTime(...)` — the final `focus` only
re-armed a timer. The test therefore masks the bug.

**Required:** after the leading-only fix, **rewrite/repair the throttle test** so it asserts the burst collapses
to exactly one refresh AND no trailing refresh appears after the interval elapses with no new event. Add this
explicit case (and ensure the "2nd refresh after interval" case is driven by a NEW event, not a leaked timer):

```ts
it('does not fire a trailing refresh after a focus+visibility burst', () => {
  renderHook(() => useAdminPageFreshness(5000))
  act(() => {
    window.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(mockRefresh).toHaveBeenCalledTimes(1)
  act(() => { vi.advanceTimersByTime(5000) })
  expect(mockRefresh).toHaveBeenCalledTimes(1) // FAILS on the old trailing-timer code
})
```

**Planted-violation proof (clause 15):** there is ONE planted violation here — the trailing-refresh bug —
captured as two runs of the SAME new test: it FAILS on the pre-fix (trailing-timer) hook and PASSES after the
leading-only fix. Paste both run transcripts (old hook = FAIL, fixed hook = PASS). A test that is green on the
buggy code is a no-op gate.

## Blocker 2 — inventory has incomplete AND false re-sync verdicts

`docs/admin-data-freshness-inventory.md` must give a CONCRETE verdict per page. Two distinct problems:

**(a) "Needs check" is not a verdict.** Resolve these three rows to a definite verdict (inspect the component):
- `AdminPopularLocationsManager`
- `AdminSettings`
- `AdminFooterManager`

Each becomes either `✅ Re-syncs (useEffect([prop]) at file:line)` / `✅ Uses props directly, no local copy` /
or `❌ No re-sync → deferred KK.2 / Task 453`. No "if needed" / "needs check" wording survives.

**(b) FALSE ✅ — `router.refresh()`-after-own-mutation is NOT prop re-sync.** `AdminPagesManager` (`useState(init)`
at line 240, no `useEffect` re-sync) and `AdminLegalManager` (`useState(init)` at line 116, no `useEffect`
re-sync) are currently marked `✅ already re-syncs` with evidence "calls router.refresh() after mutation". That
evidence proves a **self-triggered** refresh after the operator's own edit — it does NOT prove the manager
re-syncs local state when an **external** `router.refresh()` (this hook) delivers new props. With the current
code both keep stale `items` after the freshness refresh = **false-green coverage**.

For each of these two: re-verify and record the TRUE verdict. Since both are **Reference** pages (low-frequency,
single-operator), the correct resolution is one of:
- if the trivial canonical `useEffect(() => setItems(init), [init])` re-sync is added now → mark `✅ FIXED (Task 452)`
  with file:line (this is in-scope-trivial, same one-liner already applied to the 4 priority managers); **OR**
- if you judge it should wait → mark `❌ No re-sync → deferred KK.2 / Task 453` (honest deferral, NOT ✅).

**Do not leave them marked ✅ "already re-syncs".** Pick FIX or DEFER, with accurate evidence. Update the
inventory Summary section to match. (The scope cap from the base kickoff still holds: priority surfaces =
Listings/Users/Reports/Inquiries/Support; if resolving these two would pull in >3 new non-trivial managers,
STOP and ASK — but a single `useEffect([init])` per Reference page is trivial, not a refactor.)

## Out of scope (do NOT touch)

- The 4 priority manager re-syncs already added (Users/Reports/Support/Inquiries) — correct, leave them.
- The single `AdminShell` mount, the no-route-detection design, the silent-UX/no-new-strings decision.
- No polling / `location.reload` / realtime / new UI control. No new locale strings.

## Acceptance criteria (each verifiable in the diff)

1. `useAdminPageFreshness.ts` uses a leading-edge-only throttle; `setTimeout`/`timerRef` trailing logic removed;
   `focus` + `visibilitychange→visible` listeners + unmount cleanup intact. — file:line.
2. Throttle test rewritten: burst → exactly 1 refresh; no trailing refresh after `advanceTimersByTime(minInterval)`
   with no new event; the "2nd refresh" case is driven by a NEW event. — test file:line.
3. Planted-violation transcript shows the new trailing-refresh test FAILS on the old hook, PASSES on the fixed
   hook. — transcript in session log.
4. Inventory: zero "Needs check"/"if needed" verdicts; the 3 rows resolved to a definite verdict. — inventory diff.
5. Inventory: `AdminPagesManager` + `AdminLegalManager` re-classified — either `✅ FIXED (Task 452)` with the
   `useEffect([init])` re-sync added (file:line), or `❌ deferred KK.2/453`; NOT `✅ already re-syncs`. Summary
   section updated to match. — inventory diff (+ component diff if fixed).
6. Self-validation (clause 9): `npx tsc --noEmit` = 0 errors; full freshness test lane green; file-integrity
   transcript (clause 14: 0 NUL bytes / parses / not truncated) for every touched file; final
   `Self-validation: …` verdict line.
7. `docs/backlog.md` + `docs/sessions/` updated; **Files Changed** table present; **no** `git add`/`git commit`
   emitted by you (orchestrator emits at review).

## Hard contract

- No scope change beyond the four fixes above; no invented architecture (STOP and ASK on ambiguity).
- No removed/relocated control (Notes 20/21); the 4 existing re-syncs untouched.
- Self-validate before claiming complete (clause 9); file-integrity clean (clause 14); regression proof real
  (clause 15 — the gate must FAIL on the buggy hook).
- Session log includes: Files Changed table, AC-by-AC audit, and the planted-violation transcript for the
  trailing-refresh bug — the SAME new test run twice: old hook = FAIL, fixed hook = PASS.
