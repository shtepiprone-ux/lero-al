---
name: review-task
description: Review a Lero.al implementation as Opus — scope first, tools, then the OWASP diff-based secure code review held against the current Cheat Sheet Series (scripts/quality/owasp.mjs review), and the acceptance criteria; issue the verdict. Do not implement product code during review.
---

# Review a task (Opus)

Open `.claude/rules/checklists/review.md` and do items V1 to V14 in order, under checklist A
(`.claude/rules/checklists/common.md`); visible UI also `.claude/rules/checklists/ui.md`; commands for the owner:
`.claude/rules/checklists/handoff.md`. Each item is done or reported as not done with its fact. The steps that carry
the OWASP controls:

- V3: The executor's report is a supplier assertion: rerun each claim; a claim that does not reproduce is a finding.
- V7: The six diff-based steps and the category checklists of `.claude/rules/secure-code-review.md`.
