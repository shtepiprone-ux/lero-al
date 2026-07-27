# Dirty-worktree integrity manifest

Complete this before publishing a non-trivial task or approving a review when the starting
`git status --porcelain` is non-empty and the work remains in that worktree. Its purpose is to prove that current
work does not alter pre-existing user or parallel-task content.

At task design, record the current manifest and require the executor to recapture or update it immediately before
its first write. At review, reconcile the executor's actual-start manifest, not only the design-time snapshot.

An actually isolated clean worktree may replace this manifest only when the preflight records its creation/location
and a zero-entry starting `git status --porcelain`. A task document must not merely call a dirty worktree "clean".

## Start-state inventory

Copy every line from the read-only starting `git status --porcelain` into exactly one row. This includes `M`, `??`,
`D`, renamed, staged, and conflict entries. There is no catch-all row and no discretionary "if concerned" exemption.

| Start porcelain entry | Path | Owner / classification | Current task action | Integrity witness | Start value | End value | Result |
|---|---|---|---|---|---|---|---|
| ` M` / `??` / etc. | | `OWNED` / `EXCLUDED AS UNRELATED` / `AMBIGUOUS` | edit / do not touch / blocked | SHA-256 / read-only snapshot / `MISSING` sentinel | | | `UNCHANGED` / `CHANGED` / `BLOCKED` |

Rules:

1. A readable file that the current task must not touch gets a SHA-256 or read-only source snapshot before and after
   execution. `M` and `??` are both content-bearing states; equal porcelain entries are not evidence of equality.
2. A deleted/missing path uses a documented `MISSING` sentinel before and after. A rename or conflict needs a
   path-aware source snapshot; do not collapse it to one status letter.
3. If a path changes while another task may own it, do not attribute the change. Stop for sequencing or run in an
   isolated clean worktree. Do not repair it with destructive Git commands.
4. The completion report records the completed manifest or the isolated-worktree evidence and reconciles it with the
   session's changed-files table. Any uncovered start entry makes the task `BLOCKED` or `NEEDS REVISION`.
