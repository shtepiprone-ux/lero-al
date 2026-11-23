## GR-5 — The verdict, the archive and every state record change together

Binds `orchestrator-role` → Backlog discipline. **Forbidden:** recording a verdict in one place and leaving another
stale. Enumerate every artifact naming the task's state — `docs/backlog.md`, the sprint Tasks table, the sprint
execution-order note, `docs/backlog-archive.md`, the kickoff — and change them in the same response. For `APPROVED`
or `APPROVED WITH NOTES`, this means removing the closed task and every confirmed stale closed/superseded record from
the active backlog and adding concise newest-first archive rows before the handoff. An open note becomes a separate
active owner action or numbered task; it never keeps an approved task active. This has recurred four times (661,
703/704/705, 702 twice).

**The whole backlog, on every Opus response — not only the lines this response changed (owner rule, 2026-09-27).**
The owner found closed Sprints 68 (2026-09-18) and 80–82 (2026-09-25) still listed in `docs/backlog.md`, with
approvals from earlier sessions piled into "Last Session". Their words: *"if these sprints 80, 81 and 82 are closed, why is backlog.md not up to date? Do
I have to remind you every time that you keep track of the backlog? Why do you
ignore your own rules? Fix the rules so that you do not ignore them any more!"*. The old check read only the lines a response *added*, so stale
state that was already in the file, or any response that wrote no file, passed unseen. Now
`npm run check:backlog-active` (`scripts/check-backlog-active.mjs`) checks the whole file. It fails on:
- any closed-state marker outside "Last Session" (`✅`, `CLOSED`, `APPROVED`, `ARCHIVED`, `FOLDED`, "archived
  <date>", "was archived", "folded into");
- a "Last Session" longer than 4 lines or 1200 characters;
- a named sprint plan that is closed or missing;
- a registry number the archive ledger already closed.

No hook runs it any more (the agent hooks were removed on 2026-11-06); it runs in CI (`scripts/quality/product-gates.mjs`)
and locally only in checklist H7, once the task is approved and the backlog is brought to its current state for the commit.
It cannot see a stale row, so H7 also reads every section of the backlog.

**When it runs locally (owner rule, 2026-11-23, translated):** *"Run check:backlog-active only after the task gets the
status Approve. Before that there is no sense at all in running this check again and again. The backlog must be checked
when the task is done and approved; only then is the backlog brought to its current state and goes into the commit!"*
A task design, a review with `NEEDS REVISION` or a backlog row filed in between does not run it; CI checks the file on
every pull request.

**Receipts:** `GR-5 STATE SYNCED — <task> = <status> in: <every file touched>.` For an approved verdict also emit
`GR-5 BACKLOG CLEAN — archived: <task IDs>; active backlog: <n> lines.` and, from the H7 run,
`GR-5 BACKLOG ACTIVE — check:backlog-active exit 0.`

**Role boundary:** this rule's approval/archive obligations belong to Opus. Sonnet records only the task's concise
current state and its implementation evidence; it must not approve, archive, or emit Git commands.

