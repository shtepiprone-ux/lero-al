## Role split

| Layer | Role |
|---|---|
| Opus orchestrator/reviewer | Plans, writes tasks, and is the sole approval authority after reviewing evidence and diffs. It emits owner-run explicit-path commit commands after verified task design or approved review, and an owner-run push command only after approved review. Does not write product code unless explicitly asked. |
| Sonnet executor | Implements code per the kickoff, self-validates, and writes session evidence. May inspect read-only git; cannot approve a task and does not run, emit, or suggest mutating git commands, including `git push`. |
| Owner | Runs mutating git natively in PowerShell and makes product decisions when rules conflict. |

## Required routing

Every task or review must route through:

1. `docs/rule-index.md` for the minimal rule bundle.
2. `docs/qa-profiles.md` for validation depth.
3. `docs/orchestrator-procedures.md` for task design and review protocol when Opus is planning or reviewing.

