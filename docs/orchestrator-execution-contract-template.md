# Executable task contract

Complete this contract for every non-trivial implementation kickoff. Keep the completed table as an appendix to the
kickoff or as a named evidence file saved with it. It is an executable model, not a prose self-check.

## 1. One active execution route

| Field | Value |
|---|---|
| Task | |
| Active route / owner decision | |
| Decision source, date, scope | |
| Starting worktree mode | clean isolated / dirty with manifest / remediation |
| Exact allowed final write set | |
| Blocked rule or decision, if any | |

An executable task has exactly one active route. Do not put alternative owner choices, write sets, or acceptance
criteria in its execution plan. If an owner decision is unresolved, publish only a `BLOCKED -- OWNER DECISION
REQUIRED` decision note: it must not be handed to an executor. After the decision, regenerate the active scope,
acceptance criteria, verification steps, report contract, and handoff together. Separate viable routes require
separate contracts.

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | | | | | |

Use one sequential row for every baseline, implementation, probe, verification, report, and final-state step.
For each asserted result, name the code or command that produces it, the exact artifact or output field, and how a
wrong result produces a non-zero exit or a required `BLOCKED` result. A sentence such as "compare", "quote", or
"confirm" is not a comparator.

For dynamic counts, write sets, or manifests, record the formula and test both a zero/empty value and a non-empty
value. A valid zero state must not be rejected as a missing artifact. List every task-created file that can enter a
baseline, scan, status set, or other input and place its creation after the affected measurement or in its formula.

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | Alternate route or extra required path | | blocked or separate contract | |
| Stateful baseline / manifest | missing baseline; valid empty baseline | | distinct, fail-closed outcomes | |
| Status or diff assertion | unexpected new path; changed pre-existing path | | comparator rejects it | |
| New gate | planted violation or no-op probe | | observed failure, then clean recovery | |
| Task-created artifact | created before baseline by mistake | | count/scope difference detected | |

Mark `EXECUTED` only for an observed run. `ANALYTICAL` must name the inspected source branch and cannot certify a
gate as tested.

## 4. Publication and review gate

The task author may not use this contract to approve their own work. Before handoff, a reviewer or a fresh,
final-document-only pass must rebuild the active route, expected write set, and checkpoint matrix without relying on
revision summaries. Any omitted checkpoint, ambiguous route, missing producer, non-failing comparator, or mismatch
between the matrix and the task makes the task `DRAFT`, `NEEDS REVISION`, or `BLOCKED`.

The completed contract and the rule-compliance ledger are evidence artifacts. A claim that they were completed in
private notes is not publication evidence.
