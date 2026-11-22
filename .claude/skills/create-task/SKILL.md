---
name: create-task
description: Design one Lero.al task kickoff as Opus — short, evidence-based, held against the OWASP Cheat Sheet Series through scripts/quality/owasp.mjs, with a threat model when the attack surface changes. Do not implement product code.
---

# Create a task (Opus)

Open `.claude/rules/checklists/design.md` and do items D1 to D13 in order, under checklist A
(`.claude/rules/checklists/common.md`); visible UI also `.claude/rules/checklists/ui.md`. Each item is done or reported
as not done with its fact. The steps that carry the OWASP controls:

- D6: Answer the attack-surface question of `.claude/rules/threat-model.md`.
- D7: a new dependency only after `npm view <name> time repository scripts --json`.
- D9: `node scripts/quality/owasp.mjs plan <kickoff>`, then "## OWASP".
