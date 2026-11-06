---
name: create-task
description: Design one Lero.al task kickoff as Opus — short, evidence-based, with a threat model only when the attack surface changes (OWASP). Do not implement product code.
---

# Create a task (Opus)

1. Read `.claude/rules/flow.md` §1 and `.claude/rules/kickoff-template.md`.
2. Read the code the task touches. Each fact in the kickoff names its source (`path:line`, command + output, or a dated
   owner decision). Unknown stays unknown; never invent an owner decision; ask the owner only for a real product decision.
3. Answer the attack-surface question of `.claude/rules/threat-model.md`. Unchanged → write "Attack surface: unchanged".
   Changed → the four-question threat model (mitigate / eliminate / transfer / accept), the authorization-matrix rows and
   the negative tests of `.claude/rules/security-testing.md`.
4. A dependency the task adds: `npm view <name> time repository scripts --json` first (exists, first release ≥ 30 days,
   version ≥ 14 days, install script understood); write the result into Scope.
5. Visible UI → `.claude/rules/shared/canonical-component-reuse.md` first, then the mobile, token and Storybook rules.
6. Write the kickoff (≤ 200 lines) to `tasks/Sprints/`, add one row to `docs/backlog.md`. Every `- AC<n>` names its
   automated test (`.claude/rules/quality-gates.md` §8); revising a criterion revises its test in the same revision.
7. Quality check of the design: `node scripts/quality/check-files.mjs <kickoff> docs/backlog.md` exits 0, and every route
   step runs in Sonnet's session (paths exist, commands work).
8. Tell the owner in Ukrainian: what the task does, the kickoff path, and the exact next step.
