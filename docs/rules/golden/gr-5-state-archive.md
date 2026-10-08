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
approvals from earlier sessions piled into "Last Session". His words: *"якщо ці спринти 80,81 і 82 закриті, чому
backlog.md не актуалізований? Мені тобі кожного разу нагадувати, що ти слідкуєш за беклогом? Чому ти ігноруєш свої
правила? Виправ правила, щоб більше не ігнорував!"*. The old check read only the lines a response *added*, so stale
state that was already in the file, or any response that wrote no file, passed unseen. Now
`npm run check:backlog-active` (`scripts/check-backlog-active.mjs`) checks the whole file. It fails on:
- any closed-state marker outside "Last Session" (`✅`, `CLOSED`, `APPROVED`, `ARCHIVED`, `FOLDED`, "archived
  <date>", "was archived", "folded into");
- a "Last Session" longer than 4 lines or 1200 characters;
- a named sprint plan that is closed or missing;
- a registry number the archive ledger already closed.

The Opus `Stop` hook runs it on **every** Opus response and blocks while it fails. Cleaning the backlog is therefore
the first step of the next response, whatever the owner asked.

**Receipts:** `GR-5 STATE SYNCED — <task> = <status> in: <every file touched>.` For an approved verdict also emit
`GR-5 BACKLOG CLEAN — archived: <task IDs>; active backlog: <n> lines.` Every task-design or review response also emits
`GR-5 BACKLOG ACTIVE — check:backlog-active exit 0.`

**Role boundary:** this rule's approval/archive obligations belong to Opus. Sonnet records only the task's concise
current state and its implementation evidence; it must not approve, archive, or emit Git commands.

