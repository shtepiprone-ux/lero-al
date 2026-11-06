## GR-6 — Completed Opus task-design/review cycles provide the owner-run Git handoff

> **Superseded in part (governance reset 2026-11-06).** The flow, the gates, review and security testing are defined in
> `.claude/rules/README.md` (`flow.md`, `quality-gates.md`, `secure-code-review.md`, `security-testing.md`). CI is
> `.github/workflows/ci.yml` with the single required check **CI Required**. The hooks, receipts, phase files,
> `workflow-gates`, `role-boundaries`, `git-publication` and the `governance-pr.yml`/`governance-scheduled.yml`
> workflows named below no longer exist; where this file conflicts with `.claude/rules/`, `.claude/rules/` wins.


Binds `CLAUDE.md` → Git policy. **Task design** ends with `git add` + `git commit`, explicit paths, **never** `git
push`. **An approved review** follows `.claude/rules/shared/git-publication.md` (removed 2026-11-06) (owner decision 2026-11-01):
task-branch commit, then the branch push and PR, a separate merge handoff only after green PR checks, and exact-SHA
main CI before publication is reported complete. Never a push to main. Automatic handoff requirements never waive these gates.
A **non-approved review** contains no git command **for the implementation** — and that does **not** suppress the
task-design block for documents the same response authored. Conflating the two is how the block went missing on
2026-09-10.

**Review completion takes precedence:** follow `.claude/rules/shared/role-boundaries.md` (removed 2026-11-06). Acceptance of an
intermediate stage still requires the next available Opus action, including designing and verifying the next
assigned route. Do not stop with a state-only commit while that route remains to be designed. Progress writes do
not complete the cycle. A genuine external dependency ends with plain `BLOCKED` and no Git handoff, even when
investigation changed task/doc artifacts. Once the next route is verified, give its commit-only task-design block;
whole-task approval retains the implementation handoff above. Never fabricate readiness to satisfy this rule.

**Commit-identity ban:** an owner-run `git commit` handoff must contain only the intended commit subject and any
task-required body. It must never append a `Co-Authored-By:` trailer. This explicitly forbids the Claude/Anthropic
identity trailer; do not substitute a different Claude model or address to evade it.

**Role boundary:** GR-6 and `.claude/hooks/orchestrator-response-gate.ps1` (removed 2026-11-06) are Opus-only. Sonnet's executor
handoff ends with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` and contains
no `git add`, `git commit`, or `git push` command. Missing role metadata never creates a Sonnet Git-handoff demand.
The separate publication guard checks push evidence for every role, including unknown roles, before any shortcut.

**Receipt:** `GR-6 HANDOFF EMITTED — <task-design | approved-review | none: no artifact written>.`

