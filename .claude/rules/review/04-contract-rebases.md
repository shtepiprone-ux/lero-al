# Opus review: governance approval and contract rebases

Read from R7 of [03-decision-closure.md](03-decision-closure.md) before approving a `governance` contract or writing a
rebase entry into another reviewed contract.

Governance approval path (owner decisions 2026-11-01, Task 935): a `governance` contract is approved only by an Opus
session that wrote none of its scope files; the Stop hook refuses `APPROVED` from an implementing session. Rerun
`cli.mjs governance-report`, then write the `review` block and stage `reviewed`. A reviewed contract stale only through
rule files of this change gets a `rules` entry in `review.rebases` (`## Changed rule files` evidence; an existing
`review.rulesRebase` is never rewritten) from you, never from the implementer; then recompute the review hashes and
run `cli.mjs diff --phase release` before the publication handoff.
Scope rebase (owner D9, Task 940): when an approved task changed files of another reviewed contract's scope, the
approver of that task (never its implementer) appends a `scope` entry to that contract's `review.rebases` after its
own review block, with `## Changed scope files` evidence, then runs `cli.mjs diff --phase release`. Tests of that
contract's cases and runtime files are never rebased.

Case-test rebase (owner D12, Task 943): when an approved task changed a case test file of another reviewed contract
and every case of that file keeps its `[<id>]` and test name, the approver of that task (never its implementer)
appends a `tests` entry `{ kind, by, evidence, evidenceSha256, originalScopeSha256, rebasedScopeSha256 }` to that
contract's `review.rebases`. Its evidence under `docs/sessions/evidence/` has two sections: `## Changed case test
files` (one `` - `path` `` line per file) and `## Case assertions` (one line per affected case,
`- <CASE-ID>: <what each changed assertion checked before> -> <after>`). After writing the entry the approver runs
`node scripts/workflow-gates/cli.mjs verify --contract <rebased contract>`, with the development project identity
(`SECURITY_TEST_TARGET=development`, `SECURITY_TEST_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`) when it has integration
cases, and keeps the entry only when that run exits 0: the rerun binds each exact test name, which the entry check
cannot. Removing, renaming or weakening a case is never rebased; it needs a revision of the task that owns the case.
