# Task 452 — Admin-wide Data Freshness / Synchronization (Epic KK, Slice KK.1)

**Date:** 2026-06-17
**Type:** Feature — admin data freshness (silent refresh on focus/visibility)
**Status:** IMPLEMENTED + REWORK DONE — awaiting orchestrator review

## Summary

Built `useAdminPageFreshness` hook (leading-edge-only throttled `router.refresh()` on focus/visibility),
mounted once in `AdminShell`. Fixed prop re-sync for 6 client managers (4 priority + 2 rework corrections).
22-page inventory with every verdict resolved. 6-test regression suite with planted-violation proof.

## Rework (orchestrator-routed, 2026-06-17)

### B1 — Trailing-timer bug fixed
**Defect:** on a focus+visibility burst, the first event took the immediate branch, the second
scheduled a `setTimeout` that fired a SPURIOUS second `router.refresh()` ~minInterval later.

**Fix:** replaced `setTimeout`/`timerRef` trailing logic with leading-edge-only throttle. The hook
fires on the leading edge if `minIntervalMs` has elapsed; events inside the interval are dropped
(no deferred catch-up). Simplified from 22 lines to 6.

### B1b — Throttle test fixed + trailing-refresh guard added
The old throttle test masked the bug (its `toHaveBeenCalledTimes(2)` after final focus was actually
the trailing timer firing). New test:
- Burst → exactly 1 refresh
- `advanceTimersByTime(5000)` with no new event → still 1 refresh (no trailing)
- 2nd refresh only after a NEW event past the interval

### B2 — Inventory corrected
- **3 "Needs check" resolved:** `AdminPopularLocationsManager` → uses props directly (no local list copy);
  `AdminSettings` → `❌ No re-sync (nested form = non-trivial) → KK.2`;
  `AdminFooterManager` → `❌ No re-sync (nested form = non-trivial) → KK.2`
- **2 FALSE ✅ corrected:** `AdminPagesManager` (L240) + `AdminLegalManager` (L116) — marked
  "✅ calls router.refresh() after mutation" but that was self-triggered, NOT prop re-sync → both
  had `useState(init)` with no `useEffect`. Fixed with trivial `useEffect([init])` re-sync.

## Planted-violation transcript (B1 — the trailing-refresh bug)

**Same new test, run twice:**

**Old hook (trailing-timer code) → FAIL:**
```
FAIL  does not fire a trailing refresh after a focus+visibility burst
AssertionError: expected "vi.fn()" to be called 1 times, but got 2 times
 → useAdminPageFreshness.test.ts:99
EXIT: 1
```

**Fixed hook (leading-edge-only) → PASS:**
```
Tests  6 passed (6)
EXIT: 0
```

## Hook implementation (final)

`src/hooks/useAdminPageFreshness.ts` — leading-edge-only throttle:
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

No `setTimeout`, no `timerRef`, no trailing logic. Listeners: `window.focus` + `document.visibilitychange`.
Unmount cleanup removes both listeners.

## Prop re-sync fixes (all 6)

| Component | Line | When fixed | Evidence |
|---|---|---|---|
| `AdminUsersTable` | :78 | Task 452 initial | `useEffect(() => setItems(init), [init])` |
| `AdminReportsManager` | :219 | Task 452 initial | `useEffect(() => setReports(initial), [initial])` |
| `AdminSupportManager` | :665-666 | Task 452 initial | `useEffect` for `items` + `allEvents` |
| `AdminInquiriesManager` | :81-82 | Task 452 initial | `useEffect` for `inquiries` + `allReplies` |
| `AdminPagesManager` | :241 | Task 452 rework | `useEffect(() => setItems(init), [init])` — FALSE ✅ corrected |
| `AdminLegalManager` | :117 | Task 452 rework | `useEffect(() => setItems(init), [init])` — FALSE ✅ corrected |

## Self-validation (AC6)

- `npx tsc --noEmit` = 0 errors
- `npm run test:admin-freshness` = 6/6 PASS
- `npm run check:file-integrity:all` = 968 files clean

Self-validation: **PASS** — all gates green, planted-violation real, inventory complete.

## AC-by-AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — Leading-edge-only throttle, no trailing timer | DONE | `useAdminPageFreshness.ts` — no `setTimeout`/`timerRef` |
| AC2 — Throttle test rewritten + no-trailing test | DONE | 6 tests; trailing-refresh test explicit |
| AC3 — Planted-violation: old hook FAIL / fixed hook PASS | DONE | Transcript above |
| AC4 — Inventory: zero "Needs check" | DONE | All 3 resolved to concrete verdicts |
| AC5 — Inventory: Pages + Legal re-classified → FIXED | DONE | Both `useEffect([init])` added; FALSE ✅ corrected |
| AC6 — Self-validation (tsc, tests, file-integrity) | DONE | tsc=0, 6/6 green, 968 clean |
| AC7 — Backlog + session log + Files Changed | DONE | This file |

## Files Changed

| Path | Why |
|------|-----|
| `src/hooks/useAdminPageFreshness.ts` | REWORK: leading-edge-only throttle, trailing timer removed |
| `src/hooks/__tests__/useAdminPageFreshness.test.ts` | REWORK: trailing-refresh test added, throttle test fixed (6 total) |
| `src/components/admin/AdminPagesManager.tsx` | REWORK: added `useEffect([init])` re-sync (FALSE ✅ corrected) |
| `src/components/admin/AdminLegalManager.tsx` | REWORK: added `useEffect([init])` re-sync (FALSE ✅ corrected) |
| `docs/admin-data-freshness-inventory.md` | REWORK: all verdicts resolved, FALSE ✅ corrected, Summary updated |
| `docs/backlog.md` | Task 452 status → REWORK DONE |
| `docs/sessions/2026-06-17-task452-admin-data-freshness.md` | This session log (updated with rework) |
