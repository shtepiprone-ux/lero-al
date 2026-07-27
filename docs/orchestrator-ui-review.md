# UI review requirements

Read this when the implementation task changes UI or claims a UI preservation boundary.

Apply the current Mantine/TailAdmin rule bundle only to current UI and the legacy shadcn/Tailwind bundle only to
legacy UI. Verify rendered behavior at every viewport and locale required by the task’s selected QA profile; source
inspection or a passing unit test cannot replace required rendered evidence.

Independently rebuild the visual source trace from the actual source and diff:

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Required disposition | Evidence |
|---|---|---|---|---|---|

Trace utilities to generated CSS semantics and variables to concrete tokens. Verify every task-named changed,
preserved, and out-of-scope sibling against source and rendered proof. Treat an unopened named markup, utility,
selector, or token as missing evidence.

Independently verify the canonical UI decision record for each changed artifact. Open the cited story and source,
repeat enough repository search to verify a claimed absence, and compare the record with the diff:

- `reuse` must consume the shared source without copied local styles.
- `extend` and `create canonical` must update the shared owner, its toolbar-reactive canonical Storybook proof, and
  required catalog/coverage registration in the same diff.

Treat a missing decision record, an uncited “no story” claim, a component-local raw value, or an allowlisted raw value
without shared provenance as `P1 HIGH`; it blocks approval even when other gates pass.

If an artifact marked preserved remains a plausible cause of the unresolved defect or blocks an acceptance criterion,
record `P1 HIGH — TASK SPECIFICATION DEFECT` and return `NEEDS REVISION` or `PARTIALLY VERIFIED`; do not approve an
implementation solely for following a flawed scope.
