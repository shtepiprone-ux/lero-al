## GR-6 — Every Opus task-design/review response that writes a task/doc artifact ends with the owner-run git block

Binds `CLAUDE.md` → Git policy. **Task design** ends with `git add` + `git commit`, explicit paths, **never** `git
push`. **An approved review** ends with `git add` + `git commit` + `git push <verified-remote> <verified-branch>`.
A **non-approved review** contains no git command **for the implementation** — and that does **not** suppress the
task-design block for documents the same response authored. Conflating the two is how the block went missing on
2026-09-10.

**Commit-identity ban:** an owner-run `git commit` handoff must contain only the intended commit subject and any
task-required body. It must never append a `Co-Authored-By:` trailer. This explicitly forbids the Claude/Anthropic
identity trailer; do not substitute a different Claude model or address to evade it.

**Role boundary:** GR-6 and `.claude/hooks/orchestrator-response-gate.ps1` are Opus-only. Sonnet's executor
handoff ends with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` and contains
no `git add`, `git commit`, or `git push` command. Missing or ambiguous hook role metadata fails open; it never
turns a Sonnet backlog/session-log write into a Git-handoff demand.

**Receipt:** `GR-6 HANDOFF EMITTED — <task-design | approved-review | none: no artifact written>.`

