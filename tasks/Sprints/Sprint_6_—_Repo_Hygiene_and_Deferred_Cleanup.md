# Sprint 6 — Repo Hygiene & Deferred Cleanup

> Opened 2026-05-22 by the Opus 4.7 orchestrator. Cleanup work surfaced after the post-deploy
> verification + Sprint 5. Both stashes were inspected read-only by the orchestrator and found
> redundant (details in the Task 169 kickoff).

## Tasks

| Task | Type | Summary | Kickoff file |
|---|---|---|---|
| 169 | Chore (git hygiene) | Drop the two redundant `git stash` entries after re-verifying they hold nothing unique | `Sprint_6_kickoff_prompt_Task_169.md` |

## Note on I.3 (deferred — owner decision 2026-05-22: STAY DEFERRED)

Per `docs/sessions/2026-05-22-task-150-i3-helper-api-evolution.md` and `docs/domain-rules.md`, the
status-helper API migration (`(status) => boolean` → `(listing: ListingSnapshot) => boolean`) is
**intentionally trigger-gated**: it should only happen once publishing workflows, moderation
automation, lifecycle context beyond `status`, or listing automation actually arrive. None has.
Writing an "implement I.3 now" task would push speculative architecture onto the executor, which
the hard contract forbids.

**Decision (owner, 2026-05-22): keep I.3 deferred — no Sonnet task created.** The existing
`docs/backlog.md §Follow-ups` placeholder stays; revisit when a real trigger feature lands.

## Out of scope

Any runtime behavior change; the I.3 migration itself (deferred).
