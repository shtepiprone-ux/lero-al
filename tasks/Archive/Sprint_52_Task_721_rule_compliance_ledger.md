# Unwaivable rule-compliance ledger — Task 721

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_52_kickoff_prompt_Task_721_…md`; Sprint 52 §10 lists it 52.3 | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | Blocking-gate task | Review inspects real files, diff, evidence | AC1–AC11 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | `check:assertion-liveness` is CI-blocking at `governance-pr.yml:168`; new blocking arms are claimed | Q1–Q3 as applicable **plus** planted-violation failure proof per claimed gate | §13 steps 3–6 | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q1` evidence | Non-UI script changes | Final `npm run build` exit 0 | §13 step 10, mandatory | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author applies is not one the gate owns | `LIVE-THIN` could be implemented as a name list | Must key on a measurable property | R3, §7.3, and the negative-flow row that names the failure | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | Three new arms | Each arm proven by a plant that fails, then recovers | R1, R2, R4; Checkpoints 2, 3, 5 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | The subject is a control with three blind spots | Two-armed plant per arm, in the gate's own `PLANTS` harness | R4, §7.2 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | Ratios, citation counts, registry state, CI wiring | All read from the repo/gate on 2026-08-08 | §3.1–3.6, each with its source | `COMPLIANT` |
| **D6** — evidence is local-only (`.gitignore:55`) | R7's reconstruction and the evidence root | Must not appear in the diff; stated in the session log | A2, Checkpoint 8, §14 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | — | No story added or extended | §8 out-of-scope; no story in the write set | `NOT APPLICABLE` |
| `create-task` → probe restoration must be evidenced | Plants are manifest/registry fixtures, not repo files under test | Plants must not persist into the final tree | Checkpoints 2–3 recover; Checkpoint 9 status reconciliation | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC11, Checkpoint 9 | `COMPLIANT` |
| Backlog rules → "Last Session" is replaced, not appended | Task 717 appended and produced two identical headings | Replace the block | §14 report contract says so explicitly | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + content witnesses | A1, Checkpoints 0 and 9 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| `docs/rule-index.md` → named pre-read bundle, never "read all docs" | Kickoff must name it | Exact bundle listed | §6, 8 entries | `COMPLIANT` |
| UI task-design requirements | — | Visual source map + canonical UI decision record | No `src/` or UI artifact in the write set | `NOT APPLICABLE` |
