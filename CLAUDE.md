# Lero.al agent entry point

Lero.al is an Albanian real-estate marketplace: Next.js App Router, Supabase (Postgres RLS, Auth, Storage), Mantine
(active migration from legacy Tailwind/shadcn), deployed on Vercel.

## Communication language

Opus and Sonnet talk to the owner in Ukrainian only. Everything the owner can see counts: replies, progress lines and
the visible thinking (thinking in English or Ukrainian, never Russian). Russian and mixed Ukrainian/Russian prose are
forbidden. Project
files are English only (owner quotes translated faithfully); only product localization data is in other languages
(`.claude/rules/shared/project-language.md`).

## Roles

| Role | Authority |
|---|---|
| Owner | product decisions, reading the PR diff, merging, all mutating Git, GitHub settings |
| Opus | task design, secure code review, the verdict; rules, hooks and CI when the owner asks |
| Sonnet | implements one saved task and reports what ran |

## Rules

Start at `.claude/rules/README.md` (rewritten 2026-11-06 on the basis of the OWASP Cheat Sheet Series):

- `flow.md` — design → implementation → review → merge; at most two `NEEDS REVISION` per task.
- `quality-gates.md` — every file in the repository is checked (`scripts/quality/check-files.mjs`: encoding, invisible
  characters, secrets, syntax of each file type, links, kickoffs); the pre-commit hook; the CI gates (lint,
  types, all files, product checks, tests, authorization regression on real RLS, `npm audit`, change report, SBOM,
  CodeQL, gitleaks, zizmor, Storybook and end-to-end checks; daily). `CI Required` must be green before the owner merges.
- `secure-code-review.md`, `threat-model.md`, `security-testing.md`, `kickoff-template.md`.
- Skills: `create-task`, `execute-task`, `review-task`.

## Non-negotiable visual invariant

One semantic element has one visual contract. Use an existing semantic token and canonical component; if either is
missing, add it at the shared owner and its direct Story before a consumer uses it. Do not encode visual decisions in a
feature, route, wrapper, or Story. Stories pass data and documented public props only.

Legacy leaves with every change (owner, 2026-11-19): a task that changes a front-end file migrates that file's legacy
parts (`@/components/ui`, Tailwind classes, the legacy admin page wrapper) to canonical Mantine in the same task, with
the enrolment gates as proof (`.claude/rules/shared/canonical-component-reuse.md`).

Mobile is a semantic presentation, not compressed desktop geometry: reflow/stack/wrap behaviour across the `<640px`
compact range and its `640px` transition follows `.claude/rules/shared/mobile-adaptation-contract.md`. Mantine and the
project theme stay authoritative for the responsive mechanism, interaction, accessibility and breakpoint.

## Completeness rule: nothing is done partially

Owner, 2026-11-10 (translated): "you must never do your work partially, it is strictly forbidden! Creating, editing and
reviewing tasks and checking CI are forbidden to be done partially!" Every step of each phase of `flow.md` is done. The
gates are the GitHub workflow (`.github/workflows/ci.yml`), the pre-commit hook and the OWASP workflow
(`scripts/quality/owasp.mjs`); owner, 2026-11-14: the local agent machinery that re-checked the agent (phase ledgers,
the self-review hook, reply-wording checks, the local CI replica) was removed as over-engineering. A PR's CI is stated
only from GitHub (`gh pr checks <n>`) after every check has concluded; a local result names its command. Details:
`.claude/rules/flow.md` (completeness rule).

## Self-review rule: every changed file read in full, three clean passes before any test

Owner, 2026-11-13 (translated): "it is forbidden to run tests until you have checked the code you wrote three times,
thoroughly"; "if a pass found a problem, that pass does not count … until all three passes are clean"; "depth is
checking every line of code that is written"; "all models must read the code in a changed file completely, without
exceptions; code not read completely in a file is a breach of the rules". Every model, implementer and reviewer, reads
every changed file with the Read tool from its first line to its last in each pass and checks every changed line; a
pass that finds a problem does not count and its fix starts the count again; the order is failing runs of the new tests
→ the change → three clean passes → the green runs. No tool or hook enforces it (owner, 2026-11-17: the read-coverage
tool was removed); a file that was not read in full is reported as not read, never as read. Details:
`.claude/rules/flow.md` §2 step 4.

## Cause rule: a kickoff names the cause and its fix

Owner, 2026-11-16 (translated): "a kickoff always states the cause of the problem, by fact, and how to solve it; the
implementer removes that cause"; "where a couple of lines need fixing, the kickoff must not read as if half the project
does". "## Cause" (the fact with its sources, each `path:line` a file with that line and each command followed by
"→ <its output>", and a "Fix:" line) is required by `check-files.mjs`, which checks it on every run; an optional
"Read at <commit>" line makes the sources be looked up in that commit. Details: `.claude/rules/flow.md` §1.

## Facts rule: no assumptions, only facts

Owner, 2026-10-17 (translated): "no assumptions; only facts; always audit the project first, then propose a solution"
(restated 2026-11-15). Every model states about code, data, the database, a tool or a cause only what it read in this
session, with its source; a fact that can be read is read before it is used; anything else is written `UNKNOWN` or
`INFERENCE:` and never shortens, skips or stops a step, nor explains a failure. Details: `.claude/rules/flow.md` (facts rule).

## Golden rule: no gap is only reported

Owner, 2026-11-07 (translated): "you are forbidden to walk past the gaps you find and only give me a report that you
found something but did not fix it; this must be a golden, inviolable rule, always". Every gap found is closed in the
same turn: fixed with its automated test, or handed to an open task whose kickoff carries it as scope and a tested
acceptance criterion. Only the owner accepts a risk. Details and enforcement: `.claude/rules/flow.md` (Golden rule).

Every task, existing or created later, and every change is held to the OWASP Cheat Sheet Series by
`scripts/quality/owasp.mjs` (plan at design, review at verdict, the CI task gate on every change, the mapping check,
the session start).

## Git

- `main` changes only through a PR whose `CI Required` check is green, merged by the owner after reading the diff.
- Agents run read-only Git only (`.claude/settings.json` denies the rest). Opus gives the owner exact commands, says where
  to run them and what they change, after reading the state they act on (`git status --short --branch`; for a merge or
  switch also the files the incoming branch changes): an uncommitted file the merge would overwrite is committed first
  (`.claude/rules/flow.md` §4 step 1, owner 2026-11-17).
- No `Co-Authored-By` (any spelling), AI/vendor identity or `--author` in any commit command, subject, body or trailer.

## Detailed sources

- `docs/governance-reset-2026-11-06.md` — why the rules changed, the OWASP sheets read, the task verdicts.
- `docs/backlog.md` — current tasks.
- `docs/design-system.md`, `docs/storybook-governance.md` — UI system detail.
