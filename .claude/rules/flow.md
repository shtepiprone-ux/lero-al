# Task flow

Owner, 2026-11-22 (translated): "all rules must be rewritten into small files and formed clearly into checklists, so
that a model creating a task goes strictly by the checklist and does the necessary steps or checks; the same for the
executor and the reviewer". The gates are the GitHub workflow (`.github/workflows/ci.yml`, required check
`CI Required`) and the OWASP workflow (`scripts/quality/owasp.mjs`); the basis is the OWASP Cheat Sheet Series.

## Roles and their checklists

| Role | Does | Checklist | Never does |
|---|---|---|---|
| Every model | — | `checklists/common.md` (A0-A16), every turn | — |
| Opus | creates a task | `checklists/design.md` (D1-D13) | implements it |
| Sonnet | implements one saved task | `checklists/execute.md` (I1-I12) | designs, reviews, approves; edits `.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.github/**`, `.githooks/**`, `scripts/quality/**` |
| Opus | reviews and sets the verdict | `checklists/review.md` (V1-V14) | approves its own implementation |
| Opus | hands Git commands to the owner | `checklists/handoff.md` (H1-H6) | runs a mutating command |
| Any role, visible UI | — | `checklists/ui.md` (U1-U12) | — |
| Owner | product decisions, reads the diff, merges, all mutating Git, GitHub and Vercel settings | — | — |

Each checklist item is done, or reported as not done with the fact that stopped it (the tool's own message). A step
left out is the rule broken. A file a checklist line names is opened for that line's detail only.

## Order

1. Opus: D1-D13 → kickoff in `tasks/Sprints/`, row in `docs/backlog.md`.
2. Sonnet: I1-I12 in its own session → report.
3. Opus: V1-V14 in its own session → review file and verdict. `NEEDS REVISION` → a "Revision <k>" block with one item
   per finding (D, last paragraph) → back to 2.
4. Opus: H1-H6 → the owner commits, pushes and opens the pull request → `gh pr checks <n>` → the owner merges.

Every change reaches `main` only through a pull request the owner reads and merges after `CI Required` is green. AI
review never replaces the owner's review of the diff.

## Records

- One kickoff per task in `tasks/Sprints/` (closed: `tasks/Archive/`), one row in `docs/backlog.md`. Each review is one
  file `docs/reviews/Task_<n>_Review_<k>.md`, linked from the kickoff's "## Review"; `check-files.mjs` refuses review
  text written into a kickoff and a link to a missing file, and `owasp.mjs` reads the verdicts from the linked files.
  The JSON review ledgers before 2026-11-06 and the inline reviews of `INLINE_REVIEW_GRANDFATHERED`
  (`scripts/quality/check-files.mjs`) stay as records.
- Never commit `test-results/`, screenshots of passing checks, transcripts, logs or files over 20 MB.
- A baseline secure review of the whole code base (project start, legacy code, after an incident, or at the owner's
  request) reads every Server Action, every route under `src/app/api` and `src/app/auth`, `src/lib/auth`, the request
  proxy and every admin page, and checks each Data API path against the live policies (`db-catalog-audit.mjs`).

## Owner decisions behind the checklists (translated)

| Date | Item | Owner's words |
|---|---|---|
| 2026-10-17, 2026-11-15 | A3 | "no assumptions; only facts; always audit the project first, then propose a solution" |
| 2026-11-07, 2026-11-22 | A4 | "you are forbidden to walk past the gaps you find"; "if holes are found, close them at once during the task" |
| 2026-11-14, 2026-11-20 | A6 | "the tasks that verify your code went into deep over-engineering"; "no over-engineering, only facts within the task" |
| 2026-11-16 | D3 | "a kickoff always states the cause of the problem, by fact, and how to solve it" |
| 2026-11-18 | A8 | "commands are given, but no model has the right to run them (commit and push)" |
| 2026-11-19 | U2 | "legacy components and elements must be migrated to Mantine right away" |
| 2026-11-21 | A2 | "Sonnet started changing approved functionality on its own. This must be forbidden directly" |
| 2026-11-21 | V9 | "do not run the Stories check, I will check it by hand much faster" |
| 2026-11-22 | A5 | "CI must now be checked only on GitHub! Because locally it is checked for very long!" |
| 2026-11-22 | I7, V4 | "one pass over the changed files within the task" (the three full passes were removed) |
| 2026-11-22 | H6 | "two merge commands for two branches must never be given at once; they go one after the other, only after the full CI check on GitHub" |
| 2026-11-22 | A1, I6, V2, D4 | "where one or two lines need fixing, the model changes dozens of files"; no file or revision count limit (owner: "remove the limits from the rules") |
| 2026-11-22 | H1 | "pushing only changed documents and running the full CI is a waste of time"; "it must be written in the rules so that this does not happen again" |
