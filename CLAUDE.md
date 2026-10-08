# Lero.al agent entry point

Lero.al is an Albanian real-estate marketplace using Next.js App Router, Supabase, legacy Tailwind/shadcn surfaces,
and an active Mantine migration.

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
UI, tokens, Stories, or visual review, always read `.claude/rules/shared/ui-token-contract.md`, then
`.claude/rules/shared/enforcement-model.md`, and, before Story work, `.claude/rules/shared/storybook-proof.md`. The
parent workflow tells each role when to do this.

Do not load all rules by default. Select the exact detailed documents using `docs/rule-index.md`; the longer `docs/`
files remain the complete policy record and historical evidence, while the `.claude/rules/` tree is the executable
workflow.

## Non-negotiable visual invariant

One semantic element has one visual contract. Use an existing semantic token and canonical component; if either is
missing, add it at the shared owner and its direct Story before a consumer uses it. Do not encode visual decisions in a
feature, route, wrapper, or Story. Stories pass data and documented public props only. All same-meaning Story variants
must pass the built-Storybook parity census, or have a dated owner decision explaining the difference.

## Evidence, scope, and Git

- A report is not proof. Inspect current source/diff/evidence before claiming a fact or approving work.
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

## Detailed sources

- `docs/golden-rules.md` — compact index for GR-0…GR-12 receipt fragments.
- `docs/agent-contract.md` — compact index for P0 invariant and role-authority fragments.
- `docs/orchestrator-role.md` / `docs/orchestrator-procedures.md` — Opus evidence and handoff protocol.
- `docs/rule-index.md` — task-specific policy routing.
- `docs/qa-profiles.md` — validation depth.
- `docs/backlog.md` / `docs/backlog-reserved.md` — current task and reservation state.

When changing rules, keep the role parent short; put phase-specific policy in the smallest `.claude/rules/` file that
owns it, update affected workflows together, and avoid duplicating detailed rules across roles.
