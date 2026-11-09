# Lero.al agent entry point

Lero.al is an Albanian real-estate marketplace: Next.js App Router, Supabase (Postgres RLS, Auth, Storage), Mantine
(active migration from legacy Tailwind/shadcn), deployed on Vercel.

## Communication language

Opus and Sonnet talk to the owner in Ukrainian only. Russian and mixed Ukrainian/Russian prose are forbidden. Project
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
  characters, secrets, syntax of each file type, links, kickoffs); the agent loop (file checks and ESLint after every
  write; every changed file, typecheck and related tests before finishing); the pre-commit hook; the CI gates (lint,
  types, all files, product checks, tests, authorization regression on real RLS, `npm audit`, change report, SBOM,
  CodeQL, gitleaks, zizmor, Storybook and end-to-end checks; daily). `CI Required` must be green before the owner merges.
- `secure-code-review.md`, `threat-model.md`, `security-testing.md`, `kickoff-template.md`.
- Skills: `create-task`, `execute-task`, `review-task`.

## Non-negotiable visual invariant

One semantic element has one visual contract. Use an existing semantic token and canonical component; if either is
missing, add it at the shared owner and its direct Story before a consumer uses it. Do not encode visual decisions in a
feature, route, wrapper, or Story. Stories pass data and documented public props only.

Mobile is a semantic presentation, not compressed desktop geometry: reflow/stack/wrap behaviour across the `<640px`
compact range and its `640px` transition follows `.claude/rules/shared/mobile-adaptation-contract.md`. Mantine and the
project theme stay authoritative for the responsive mechanism, interaction, accessibility and breakpoint.

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
  to run them and what they change.
- No `Co-Authored-By` (any spelling), AI/vendor identity or `--author` in any commit command, subject, body or trailer.

## Detailed sources

- `docs/governance-reset-2026-11-06.md` — why the rules changed, the OWASP sheets read, the task verdicts.
- `docs/backlog.md` — current tasks.
- `docs/design-system.md`, `docs/storybook-governance.md` — UI system detail.
