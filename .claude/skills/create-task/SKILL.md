---
name: create-task
description: Design one Lero.al task kickoff as Opus — short, evidence-based, held against the OWASP Cheat Sheet Series through scripts/quality/owasp.mjs, with a threat model when the attack surface changes. Do not implement product code.
---

# Create a task (Opus)

1. Read `.claude/rules/flow.md` §1 and `.claude/rules/kickoff-template.md`. Then the OWASP reference, current:
   `node scripts/quality/owasp.mjs sync` (registry and cache from https://cheatsheetseries.owasp.org/index.html; a sheet
   added or changed upstream is listed) and `node scripts/quality/owasp.mjs check` exits 0. A finding is fixed first: an
   unmapped or changed sheet is read in full (`.cache/owasp/<sheet>.md`), its applicability, triggers, requirement quotes
   and the control or task that meets each are written into `docs/security/owasp/controls.json`, and a requirement no
   control meets becomes a scope line of an open task or a new numbered task in the same turn.
2. Read the code the task touches. Each fact in the kickoff names its source (`path:line`, command + output, or a dated
   owner decision). Unknown stays unknown; never invent an owner decision; ask the owner only for a real product decision.
3. Answer the attack-surface question of `.claude/rules/threat-model.md`. Unchanged → write "Attack surface: unchanged".
   Changed → the four-question threat model (mitigate / eliminate / transfer / accept), the authorization-matrix rows and
   the negative tests of `.claude/rules/security-testing.md`. The repository holds no complete schema: when the surface
   touches data, roles, authentication, uploads or SQL, run `node scripts/quality/db-catalog-audit.mjs` (and
   `node scripts/quality/cloudinary-config.mjs` for uploads) and cite the lines that concern the task as facts; a task
   that changes the database has "db-catalog-audit reports none of <its invariants>" as an acceptance criterion.
4. A dependency the task adds: `npm view <name> time repository scripts --json` first (exists, first release ≥ 30 days,
   version ≥ 14 days, install script understood); write the result into Scope.
5. Visible UI → `.claude/rules/shared/canonical-component-reuse.md` first, then the mobile, token and Storybook rules.
6. OWASP: write Goal, Scope and Attack surface, then run `node scripts/quality/owasp.mjs plan <kickoff>` and write
   "## OWASP" (`kickoff-template.md`): every required sheet with a verbatim quote, how the task meets it and the AC, or
   "not applicable" with a reason. Read the sheet text for each line. A requirement the task should meet and does not
   yet is added to Scope and the acceptance criteria now (add or upgrade the protection and its test), not left as a
   note.
7. Write the kickoff (≤ 200 lines) to `tasks/Sprints/`, add one row to `docs/backlog.md`. Every `- AC<n>` names its
   automated test (`.claude/rules/quality-gates.md` §8); revising a criterion revises its test in the same revision.
8. Quality check of the design, step by step and never in part (`flow.md`, completeness rule and Pipeline):
   `node scripts/quality/pipeline.mjs run design <kickoff>` exits 0. Its steps, in order: `owasp-sync`, `owasp-check`,
   `owasp-plan`, `kickoff-files` (`check-files.mjs <kickoff> docs/backlog.md`, the OWASP section check included),
   `route-paths` (every Route path exists or is created by the Scope) and `ac-names-test` (every criterion names its
   test). A stopped phase: fix the cause and run it again. Editing an existing kickoff runs the same phase on it, and the
   change that carries the edit must pass what CI applies to it (`ac-tests.mjs --base main <kickoff>` once implemented).
9. Golden rule (`flow.md`): every gap the design finds, inside or outside this task, is carried in the same turn by
   this kickoff or another open kickoff as scope plus a tested acceptance criterion; an audit finding gets its status
   in its ledger (`finding-status`). Nothing is left as a remark.
10. Tell the owner in Ukrainian: what the task does, the kickoff path, and the exact next step; a result the reply
    states names its source (`[pipeline: design]`, `[локально: \`<command>\`]`). The Stop hook refuses the reply while
    the design phase is not complete for the kickoff as it is now, or a result has no backed source.
