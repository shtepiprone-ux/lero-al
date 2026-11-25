# Task 1035 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_1035_Synthetic_Listings_Are_Never_Public_Or_Indexed.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_1035_Synthetic_Listings_Are_Never_Public_Or_Indexed.md) · OWASP record: [Task_1035.json](../security/owasp/reviews/Task_1035.json) · Previous: [Review 1](Task_1035_Review_1.md)

Review 2 of pull request #74 at 9cb38f45e (V14: CI run 45479979660) — NEEDS REVISION
Scope: no change since Review 1; this review reads the CI result.
Findings: Critical 0, High 0, Medium 1 (F1), Low 0
Overall risk: the change does not compile; nothing reaches production until it does.

## V14 — `gh pr checks 74` (every check concluded)

Failed: `Lint, types and product checks` (`npm run typecheck`), `Unit and component tests`, `Authorization regression` and `Click-shield` (each at
`npm run build`), `Vercel` (deployment build), hence `CI Required`; 17 passed. Every failed job stops at the same two errors (`gh run view 45479979660 --log-failed`):

```
src/app/admin/listings/visibilityFilter.ts(15,33): error TS2322: Type '{ eq: any; in: any; gte: any; not: any; }' is not assignable to type 'Q'.
src/app/admin/listings/visibilityFilter.ts(15,62): error TS2345: Argument of type 'Q' is not assignable to parameter of type '{ eq: any; in: any; gte: any; not: any; }'.
```

## Findings

F1 — The admin visibility wrapper's type constraint lacks `not`
Severity: Medium      Category: Tests / build      CWE: —
Location: `src/app/admin/listings/visibilityFilter.ts:10`
Description: `applyAdminListingsVisibility<Q extends { eq; in; gte; or; lt; is }>` passes its `Q` to `applyPublicVisibility`, whose constraint now
also requires `not` (`src/modules/listings/lib/visibility.ts:138`); it is the only generic wrapper over it (`grep -rn "extends { eq: any" src` → the two
helpers and this wrapper). The tests do not type-check, so Review 1's runs passed; the project's type check runs only in CI (checklist A5).
Impact: the build fails; the pull request cannot merge.
Recommendation: add `not: any` to the wrapper's constraint. Nothing else changes.
Status: open (Revision 1, R1-1)

## Revision 1 (executor)

- R1-1 (F1) `src/app/admin/listings/visibilityFilter.ts:10`: the generic constraint gains `not: any`
  (`Q extends { eq: any; in: any; gte: any; or: any; lt: any; is: any; not: any }`). No other line changes.
- Run: the kickoff's Route step 4 line (exit 0). The type check is CI-only (A5): the report says so; the reviewer reads it in `gh pr checks 74`.

## Open parts of Opus and the owner

- Owner: commit and push Revision 1 (PR #74 is open); Opus: V14 again.
