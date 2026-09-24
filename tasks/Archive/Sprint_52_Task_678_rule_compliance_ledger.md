# Unwaivable rule-compliance ledger — Task 678

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_52_kickoff_prompt_Task_678_…md`; Sprint 52 §10 lists it 52.4 | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | Three CI-blocking gates change scope | Review inspects real files, diff, evidence | AC1–AC10 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | Scope of 3 blocking gates changes; a gate behaviour is claimed | Q1–Q3 as applicable **plus** planted-violation failure proof | §13 steps 5–7 | `COMPLIANT` |
| `create-task` → "An unresolved owner decision produces a blocked decision note, not a multi-route task" | Global-vs-surgical was genuinely the owner's call | Decide with the owner before writing, never hand Sonnet two routes | Owner decision 2026-08-08 quoted in §3.1 and the contract | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | Enrolment claims to change gating | The un-enrolled negative case must be shown | R6, Checkpoint 6 | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author applies is not one the gate owns | Newly-enrolled cells may fail | No tolerance/skip/allowlist to turn a cell green | R7, §10.4, negative-flow row | `COMPLIANT` |
| Task 722 ordering (Sprint 52 §10) | Denominator expansion under a vacuous assertion manufactures false green | 52.1 must precede 52.4 | 722 `APPROVED` 2026-08-08 and archived; §3.5 records the dependency | `COMPLIANT` |
| Agent-contract clause 12 (mobile stress cells) | `MANTINE_VIEWPORTS` is the enforced minimum set | Must remain intact | R8, AC8 | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | R6 plants a story | `git hash-object` equal to pre-plant **and** absence from `git status --porcelain` | AC6, Checkpoint 7 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | The plant is a story | Reversible probe in an inspected existing story; no permanent markup ships | §7.5, out-of-scope §8 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC10, Checkpoint 8 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | §14 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | Every count drives a scope decision | Counts from the manifest, the story files and the gates themselves | §3.1–3.4, each with its source | `COMPLIANT` |
| Orchestrator standing note (721 corollary) — read what a config keys on | §3.3/§3.4 derive counts from title prefixes and viewport config | Verify the keying, not the appearance | §3.2 quotes the module; §3.4 enumerates all 21 matches | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, Checkpoints 0 and 8 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| UI task-design requirements | Only if §7.4 chooses a story retitle | Visual source map + canonical decision record | Retitle is gated behind a recorded decision; otherwise no UI artifact changes | `NOT APPLICABLE` unless §7.4 elects retitle |
