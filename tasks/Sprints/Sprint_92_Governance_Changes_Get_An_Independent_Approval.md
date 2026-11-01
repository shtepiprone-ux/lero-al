# Sprint 92 — rule, hook and gate changes get an independent approval

**Opened:** 2026-11-01 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (935)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-11-01 (translated from Ukrainian):** *"Separately: the rule changes are still not
> formally approved... create a separate task."*

## The gap

On 2026-11-01 the PR-only publication policy (PR #11, one commit of 30 files: rules, hooks, settings and gate scripts)
was designed and implemented by Opus in one session and had no route to a formal approval. The task security contract
knows only `product` and `docs`; `product` refuses policy paths, `docs` accepts only Q0 Markdown, and CI asks for a
contract only when product paths change. Changes to the controls that guard publication can therefore reach main with
no contract, no regression-case mapping and no independent approval.

## Goal

A change to rules, hooks, settings, CI workflows or gate scripts carries a machine-checked governance contract with
runnable regression cases, is implemented by Opus in its own session, and is approved only by an Opus session that
wrote none of its files. CI refuses an executable policy change outside such a contract.

## Decisions

| ID | Question | Owner answer (translated from Ukrainian) | Binding consequence |
|---|---|---|---|
| **D1** | (2026-11-01, AskUserQuestion) Who implements governance tasks? | *"Opus, a separate session (Recommended)"* | 935 is executed by Opus in a fresh session; Sonnet is not routed. |
| **D2** | (2026-11-01, AskUserQuestion) Is approval independence enforced technically? | *"Yes, the hook blocks (Recommended)"* | The Stop hook refuses an approval from a session that wrote a scope file (935 R4). |
| **D3** | (2026-11-01, AskUserQuestion) Does 935 also approve the PR #11 changes? | *"Yes, cover PR #11 (Recommended)"* | 935's contract scope lists PR #11's 30 files; its PR replaces PR #11 (935 R8, R9). |
| **D4** | (2026-11-01) How is the gap filed? | *"create a separate task"* | Sprint 92 and Task 935. |
| **D6** | (2026-11-01, AskUserQuestion) PR #11's CI fails because a reviewed Task 923 contract's review hash includes rule files that PR #11 changed. How is a contract made stale only by rule files handled? | *"Rebase with an audit record (Recommended)"* | 935 R10: the independent governance approver writes `review.rulesRebase` with evidence; any non-rule change keeps the review stale. |

## Tasks

The single state source for this sprint's tasks.

| # | State | Scope |
|---|---|---|
| **935** | `KICKOFF FILED` 2026-11-01, P1, Q1; executor: Opus, fresh session (D1); approver: another fresh Opus session (D2) | **Governance contracts and independent approval.** Contract kind `governance`, its release phase, the `governance-report` command, the approval hook's independence check, CI's diff check for executable policy files, the audited rule-only rebase of reviewed contracts (D6), `GOV-935-*` cases and the PR #11 coverage → [kickoff](Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.md). |

## Exit criteria

1. 935 is approved by an Opus session that did not implement it, through the hook it adds.
2. The 935 PR is merged after green required checks, and PR #11 is closed unmerged.

## Security test contract

This sprint plan is a state and ordering record; it authorizes no runtime or gate change. Task 935's kickoff and its adjacent
`*.security.json` carry that task's governance cases (`.claude/rules/shared/security-testing.md`). The plan's own contract
(`Sprint_92_Governance_Changes_Get_An_Independent_Approval.security.json`) is Q0: runtime rows not applicable.
