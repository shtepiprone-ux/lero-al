# Unwaivable rule-compliance ledger — Task 727

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_52_kickoff_prompt_Task_727_…md`; Sprint 52 lists it as the closing task | `COMPLIANT` |
| `create-task` → owner authorization must be **quoted**, not paraphrased | OQ2/OQ3 were open owner decisions | Quote the decision with its date and scope | §3.1 verbatim, 2026-08-09 | `COMPLIANT` |
| `create-task` → "An unresolved owner decision produces a blocked decision note, not a multi-route task" | Both OQs are now closed | Single route; anything the decision does not cover → `BLOCKED` | §5 OQ note, contract §1 | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | A gate becomes CI-blocking; exemption logic changes; a gate behaviour is claimed | Q1–Q3 as applicable **plus** planted-violation failure proof | §13 steps 5–7 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | The contextual rule replaces an unconditional one | The inside-dialog case must be shown to fail before and after | R3, Checkpoint 5 | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author applies is not one the gate owns | `.mantine-Overlay-root` is an author-appliable class | The replacement must key on measured context (where the candidate sits), not on the interceptor alone | R1, §7.1 | `COMPLIANT` |
| Task 723 N6 — "an unconditional gate that fires on every modal will be switched off within a week" | The fix could over-fire | The background-still-clears direction is a first-class requirement | R4, AC3, Checkpoint 7 | `COMPLIANT` |
| Task 725 §14.9.29 — transient vs permanent decided by measurement | `:276` is 725's scroll path | Both paths must agree by construction, one shared predicate | R2, §7.1 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | The gate has never hit-tested an overlay state | Scenarios must prove they reached the state; zero-violation runs pre-declared suspicious | A2, R5, Checkpoint 4 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | The defect claim drives the whole task | Confirmed in source at both call sites before being described | §3.2, line-cited | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | R3 plants an interception | `git hash-object` equal to pre-plant **and** absence from `git status --porcelain` | AC2, Checkpoint 6 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | Scenarios drive the real app, not stories | No story added or extended | §8 out-of-scope; no story in the write set | `NOT APPLICABLE` |
| **D6** — evidence is local-only | `.screenshots/task727-evidence/` | Must not appear in the diff; stated in the session log | Contract §1, §14 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC11, Checkpoint 9 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | §14 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R13, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, Checkpoints 0 and 9 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| UI task-design requirements | — | Visual source map + canonical UI decision record | No `src/` change; R11 forbids fixing a product defect here | `NOT APPLICABLE` |
