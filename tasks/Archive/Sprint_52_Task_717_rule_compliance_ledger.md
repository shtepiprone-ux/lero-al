# Unwaivable rule-compliance ledger — Task 717

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_52_kickoff_prompt_Task_717_…md`; Sprint 52 §10 lists it as 52.2 | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | Governance-gate task | Review inspects real files, diff, evidence | AC1–AC11 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q1` row | Non-UI config + comment-only source edits; R7 makes a rendered-value change structurally impossible | Targeted commands, typecheck, final build exit 0, i18n parity guard, integrity/mojibake | §13 steps 6–11 | `COMPLIANT` |
| `docs/qa-profiles.md` → profile selection | A visual change would demand Q2/Q3 | Profile must match real risk | R7 + AC7 filtered diff; §13 states the task stops if R7 breaks rather than continuing under Q1 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | Exemptions are being narrowed | The gate must be shown to catch what it previously missed | R5 plant, Checkpoint 5 | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author can apply is not one the gate owns | The task's entire subject is exemptions | Replace a blanket with per-item reasoned exemptions; no new directory key | R3, §10.1 | `COMPLIANT` |
| Task 715 §23.6.b strict flip (`docs/design-system.md`) | `css-length`/`css-duration`/`css-zindex` are blocking | Surfaced literals must not leave CI red | R6, §10.4 | `COMPLIANT` |
| Task 716 taxonomy (`N1-VIOLATION` / `COMPILED-ARTIFACT`) | Classification required | Reuse the existing taxonomy, do not invent one | R2, §7.2 | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | R5 plants a literal | `git hash-object` equal to pre-plant **and** absence from `git status --porcelain` | AC5, Checkpoint 6 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | — | No story is added or extended | §8 out-of-scope; no story in the write set | `NOT APPLICABLE` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC11, Checkpoint 8 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | The 206/15 baseline drives every downstream decision | Counts from the detector's own exported functions | §3.2 method; R1 re-derivation | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + per-entry classification + content witnesses | A1, Checkpoints 0 and 8 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| `docs/rule-index.md` → named pre-read bundle, never "read all docs" | Kickoff must name it | Exact bundle listed | §6, 8 entries | `COMPLIANT` |
| UI task-design requirements | — | Visual source map + canonical UI decision record | R7 forbids any rendered-value change; no UI artifact in the write set | `NOT APPLICABLE` |
