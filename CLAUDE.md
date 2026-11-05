# Lero.al agent entry point

Lero.al is an Albanian real-estate marketplace using Next.js App Router, Supabase, legacy Tailwind/shadcn surfaces,
and an active Mantine migration.

## Communication language

Opus and Sonnet communicate with the owner in Ukrainian only, including progress, questions, reports and review
explanations. Russian replies and mixed Ukrainian/Russian prose are forbidden, regardless of input or prior messages.
Preserve literal technical text; project files remain English under `.claude/rules/shared/project-language.md`.

## Roles

| Role | Authority |
|---|---|
| Opus | task design, adversarial implementation review, sole approval authority |
| Sonnet | implement one saved task and provide factual evidence |
| Owner | product decisions when evidence/rules conflict and all mutating Git |

## Start here — compact workflow tree

Read [`.claude/rules/README.md`](.claude/rules/README.md), then use exactly one role parent:

- Opus task design: `.claude/skills/create-task/SKILL.md` → `.claude/rules/create/`
- Opus review/QA/release readiness: `.claude/skills/review-task/SKILL.md` → `.claude/rules/review/`
- Sonnet execution: `.claude/skills/execute-task/SKILL.md` → `.claude/rules/execute/`

Each parent is a short, ordered checklist. Read its numbered phase file immediately before the named phase. For visible
UI, tokens, Stories, or visual review, Opus first reads `.claude/rules/shared/canonical-component-reuse.md`:
inspect ready components/Stories before references; reuse, extend, or create with a direct Story. Then read
`.claude/rules/shared/mobile-adaptation-contract.md`, then
`.claude/rules/shared/ui-token-contract.md`, then `.claude/rules/shared/enforcement-model.md`, and, before Story
work, `.claude/rules/shared/storybook-proof.md`. The parent workflow tells each role when to do this.

Opus follows C1-C7 for task design and R1-R7 for implementation review, retaining each step's actual evidence before
continuing. A startup receipt is only a reading receipt. Every new or revised executor route passes
`.claude/rules/shared/task-readiness.md`; a review finding does not authorize an unverified replacement kickoff.
A Sonnet report or pending owner-validation result starts/resumes the full review cycle under
`shared/role-boundaries.md`. A passed stage includes preparing its next assigned route before the final handoff;
do not request another go-ahead or restart unchanged checks on "continue".

Do not load all rules by default. Select the exact detailed documents using `docs/rule-index.md`; the longer `docs/`
files remain the complete policy record and historical evidence, while the `.claude/rules/` tree is the executable
workflow.

## Non-negotiable visual invariant

One semantic element has one visual contract. Use an existing semantic token and canonical component; if either is
missing, add it at the shared owner and its direct Story before a consumer uses it. Do not encode visual decisions in a
feature, route, wrapper, or Story. Stories pass data and documented public props only. All same-meaning Story variants
must pass the built-Storybook parity census, or have a dated owner decision explaining the difference.

Mobile is a semantic presentation, not compressed desktop geometry: source-backed reflow/stack/wrap behavior across
the project's `<640px` compact range and its `640px` transition is mandatory under
`shared/mobile-adaptation-contract.md`. Mantine and the project theme remain authoritative for responsive mechanism,
interaction, accessibility, canonical owner, and breakpoint; the contract adds semantic order/content treatment and
proof only. Opus inherits ready components' adapted design under `shared/canonical-component-reuse.md`;
new adaptation decisions require the mobile contract's source basis.

## Evidence, scope, and Git

- Before any Git handoff read `.claude/rules/shared/git-publication.md`. Owner decision 2026-11-01: main changes
  only through a PR. Commit on a task branch, push that branch after `APPROVED`, merge only after
  `ci-status.mjs --pr` confirms green PR checks, then confirm the main push run with `ci-status.mjs`.
- A report is not proof. Before publishing or revising a kickoff, use the claim-to-evidence contract: a material fact
  has a current source/artifact locator and literal observation; uncertainty is `BLOCKED`, never a plausible route.
- Project files are English only, owner quotes included (faithful translation); only product localization data may
  be in another language (`.claude/rules/shared/project-language.md`).
- Every task has one saved kickoff, selected QA profile, explicit acceptance criteria, and one implementation route.
- New/migrated UI uses canonical Mantine behavior plus the approved token/provenance path; legacy styling may be
  preserved only when the selected task explicitly retains the legacy surface.
- Agents use read-only Git inspection only. The owner makes mutations. Sonnet never emits mutating Git commands;
  Opus emits explicit owner commands only when its selected workflow permits them.
- An owner-run commit handoff is an ordinary owner commit, never an agent attribution. No agent may emit, suggest, or
  include `Co-Authored-By` (in any spelling), an AI/vendor identity, or `--author` in a commit command, subject,
  body, or trailer.
- Sonnet cannot edit policy/governance or `.claude/**`; it reports a policy issue to Opus. Opus does not implement
  product code while designing or reviewing.

## Automation

The project router injects the compact `create-task` or `review-task` parent for Opus. The SessionStart hook injects
the compact `execute-task` parent for ordinary Sonnet sessions. The dedicated executor agent preloads the same skill.
These injections never replace the current-session reads required by a phase file.

`scripts/workflow-gates/code-check.mjs` runs by itself after every write and before an agent or subagent finishes: the
quality of the written files, then their effect on other code, then whether the tests notice the written lines broken on
purpose, in memory only. A failure is fixed at once, never reported as done. A green tool is no proof of behaviour no
check reaches. `.claude/rules/shared/secure-code-review.md` is the flow of every task and model, and
`scripts/workflow-gates/change-review.mjs` reviews a whole change in CI, whichever tool wrote it.

## Detailed sources

- `docs/golden-rules.md` — compact index for GR-0…GR-12 receipt fragments.
- `docs/agent-contract.md` — compact index for P0 invariant and role-authority fragments.
- `docs/orchestrator-role.md` / `docs/orchestrator-procedures.md` — Opus evidence and handoff protocol.
- `docs/rule-index.md` — task-specific policy routing.
- `docs/qa-profiles.md` — validation depth.
- `docs/backlog.md` / `docs/backlog-reserved.md` — current task and reservation state.

When changing rules, keep the role parent short; put phase-specific policy in the smallest `.claude/rules/` file that
owns it, update affected workflows together, and avoid duplicating detailed rules across roles.
