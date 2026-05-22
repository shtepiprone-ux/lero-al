# Kickoff prompt — Task 162 (E.5 follow-up — commit URL-state ADR + clarify scope)

> Follow-up to Task 133. Review: ADR session log was untracked and `useListingsUrlFilters.ts`
> was modified-uncommitted while backlog marked 133 done. E.5 was "doc only".

```
You are Claude Code Sonnet 4.6 working in `lero-al` (run on the Windows checkout, clean EOL).
Hard contract: do NOT change scope; no new architecture; AC literally; update backlog + sessions.

Scope:
1. Commit the Task 133 ADR so the deliverable is versioned.
2. Inspect the useListingsUrlFilters.ts change. E.5 was doc-only → EITHER revert it (if
   accidental) OR split it into its own task with AC (if intended). Do not let code ride a doc task.
3. Make the backlog 133 entry reflect what was actually committed.

Acceptance criteria:
- ADR committed; working tree clean of unintended edits; 133 entry accurate.
- Hook change reverted or documented with AC. No EOL-only noise in the commit.
Out of scope: implementing new URL-state behavior.
```
