# Session — Task 435: Report-listing submit failure diagnosis

**Date:** 2026-06-18  
**Epic:** BB · **Type:** Diagnosis only (no code edits)  
**Executor:** Sonnet 4.6

## Summary

Diagnosed the "Report this listing" submit failure. The browser error signature (`Fetch failed loading: POST`) is a transport-layer failure, not an RLS/DB error. Primary probable cause (pending D1/D2/D3 confirmation): **`next-intl/middleware` (`handleI18nRouting`) processing server-action POSTs as locale-routing requests** (co-primary with dev-only stale-action-ID from hot-reload). RLS (Task 270) is verified correct and demoted. D1 (server terminal) is the single decisive artifact to distinguish the two co-primary hypotheses; the follow-up FIX task must capture D1/D2/D3 before applying or approving the fix.

## Diagnosis path

1. **Traced the call chain**: `ListingReportDialog.tsx:53` → `startTransition` → `reportListingAction` → Next.js dispatches `POST /{locale}/listings/{slug}` with `Next-Action` header.
2. **Identified middleware interception**: `src/middleware.ts` matcher catches `/{locale}/listings/{slug}` for ALL methods. Line 11: `handleI18nRouting(request)` runs on the POST — processes it as navigation, not as a server action.
3. **Verified RLS is NOT the cause**: Task 270 session confirms `listing_reports_insert_own` policy is `TO authenticated WITH CHECK (auth.uid() = user_id)` — correctly applied. An RLS denial would produce HTTP 200 + `{ error: 'save_failed' }`, not "Fetch failed loading".
4. **Verified the action code is correct**: `reportListingAction` guards (unauthorized → blocked → invalid_reason → already_reported → insert), error logging at L60-61. The available evidence is consistent with the POST failing before the action runs; the server terminal (D1) is required to confirm.
5. **Identified UX messaging gap (AC6)**: `ListingReportDialog.handleSubmit` collapses ALL non-`already_reported` errors into one catch-all toast. Recommended per-branch 4-locale message map in the report.

## Primary probable cause (pending D1/D2/D3 confirmation)

**Co-primary hypothesis 1:** Middleware intercepts server-action POSTs on localized routes (`src/middleware.ts:11` — `handleI18nRouting(request)` on a POST with `Next-Action` header). Proposed fix: detect `POST` + `Next-Action` header and skip locale routing.

**Co-primary hypothesis 3:** Dev-only stale action ID from `[Fast Refresh] rebuilding` — would not reproduce under `npm run build && npm start`.

D1 (server terminal at Submit click) is the single decisive artifact. The follow-up FIX task must capture D1/D2/D3 before applying or approving the fix.

Full report: `docs/governance-reports/2026-06-15-task435-report-listing-submit-rootcause.md`

## Files Changed

| Path | Rationale |
|---|---|
| `docs/governance-reports/2026-06-15-task435-report-listing-submit-rootcause.md` | Root-cause report with evidence, classification, recommended fix |
| `docs/sessions/2026-06-18-task-435-report-listing-diagnosis.md` | This session log |
