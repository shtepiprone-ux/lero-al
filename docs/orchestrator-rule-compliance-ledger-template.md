# Unwaivable rule-compliance ledger

Complete this ledger for every rule selected by the task's pre-read bundle before publishing a kickoff or issuing a
review decision. Rules are invariants, not proposals: an agent may report a conflict, but may not weaken,
reinterpret, bypass, or declare an equivalent replacement for a mandatory rule.

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| file + heading/line | why it applies or a concrete source-based `NOT APPLICABLE` reason | verbatim operational requirement | inspected artifact, command, exit semantics | `COMPLIANT` / `BLOCKED` / `NOT APPLICABLE` |

Rules:

1. Copy every applicable rule into one row. `NOT APPLICABLE` requires a concrete reason from the rule's scope; a
   missing row is not an implicit exemption.
2. A task, completion report, self-check, or agent reasoning is never evidence that it may waive a rule. Only the
   owner may change a project rule or authorize an exception, and the ledger must quote or precisely reference that
   actual decision, date, and scope.
3. An alternative mechanism is permitted only when the original rule explicitly permits that alternative and the row
   proves every required observable. Otherwise the row is `BLOCKED`, even if the alternative seems safer or easier.
4. A mandatory rule may not be changed into "if concerned", "where practical", a warning, a diagnostic, or a
   manual interpretation. Its evidence must have the required artifact and failure semantics.
5. After every revision, recompute all rows from the current text and current worktree. A prior `COMPLIANT` result
   does not survive a changed plan, scope, command, baseline, or owner decision automatically.

Publication and approval are forbidden unless every applicable row is `COMPLIANT`; otherwise return `BLOCKED` or
`NEEDS REVISION` and name the exact unresolved rule row.
