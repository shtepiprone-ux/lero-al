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
| Opus | hands Git commands to the owner | `checklists/handoff.md` (H1-H7) | runs a mutating command |
| Any role, visible UI | — | `checklists/ui.md` (U1-U12) | — |
| Owner | product decisions, reads the diff, merges, all mutating Git, GitHub and Vercel settings | — | — |

Each checklist item is done, or reported as not done with the fact that stopped it (the tool's own message). A step
left out is the rule broken. A file a checklist line names is opened for that line's detail only.

## Order

1. Opus: D1-D13 → kickoff in `tasks/Sprints/`, row in `docs/backlog.md`.
2. Sonnet: I1-I12 in its own session → report.
3. Opus: V1-V14 in its own session → review file and verdict. `NEEDS REVISION` → a "Revision <k>" block with one item
   per finding (D, last paragraph) → back to 2.
4. Opus: H1-H7 → the owner commits, pushes and opens the pull request → `gh pr checks <n>` → the owner merges → Opus archives the task (H7).

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
| 2026-11-23 | I4, I8 | "fix the text": `scripts/quality/*.test.mjs` runs with `node --test`, not `npm test --` (Task 1013 Review 1) |
| 2026-11-23 | H7 | "I see that you keep the backlog very badly"; "all the other sections must also be checked for relevance" (the step after a merge was in no checklist) |
| 2026-11-23 | H7, GR-5 | "run check:backlog-active only after the task gets the status Approve; before that there is no sense at all in running this check again and again" (GR-5 asked for it on every design and review response, A5 forbids a product gate locally: the contradiction found in Task 957 Review 5) |
| 2026-11-23 | A5, A6, I8a, I11, U9, V5a, V9 | "this rule must apply only to the CI tests, not a general ban on running Storybook"; "all these rules should concern the local run of the CI tests, not a total ban on running the dev or Storybook servers"; "you must check not only pages but also components, the Stories in Storybook" (the CI-only rules of 2026-11-21 and 2026-11-22 had been written as a ban on the servers themselves) |
| 2026-11-23 | V5a, D5, U9 | "your reviews cannot be trusted at all, because you ignore very many points and simply do not check them; this especially concerns front-end regressions"; "add them" (Task 957: the number fields lost the canonical field look, the form buttons grew to 18px, the Firefox arrows were missing, each passed a review read from code and jsdom only) |
| 2026-11-23 | V13 | "If the status of the task is Needs Revision, you must always give the prompt for the executor at once" (Task 957 Review 5 ended without it) |
| 2026-11-24 | H7 | "add it to the rules checklist" (28 merged or closed branches were left on GitHub and 39 locally: H7 had no step that deletes the merged branch, and `delete_branch_on_merge` is `false`) |
| 2026-11-24 | I1, V13 | "fix the rules as you recommend" (Task 991 Revision 1: I1 asked for an empty tree, while H1 keeps Opus's documentation uncommitted until the task branch's first commit and V2 diffs against the commit a revision starts from; the executor stopped at I1. Now the reviewed tree is committed locally before the revision, and the prompt names that commit) |
| 2026-11-24 | H3 | "next time you must give all the commands right at once, not with errors again and again! Write it into a rule for yourself, so that it does not repeat every time" (Task 991: a bare `git push` was handed over, and the publication hook refused it after the owner had run it) |
