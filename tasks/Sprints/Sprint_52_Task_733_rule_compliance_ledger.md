# Unwaivable rule-compliance ledger — Task 733

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_52_kickoff_prompt_Task_733_…md`; Sprint 52 §10 lists it 52.5 | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | CI-blocking gate changes measurement scope | Review inspects real files, diff, evidence | AC1–AC10 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | Blocking gate scope changes; `critical-flow-registry.md:50` is among the newly-measured stories; a gate behaviour is claimed | Q1–Q3 as applicable **plus** planted-violation failure proof | §13 steps 4–6 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | The skip is being removed or narrowed | The blind cells must be shown blind first, and the plant must fail | R1, R5; Checkpoints 1 and 5 | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author applies is not one the gate owns | The skip keys on `[role="dialog"]`, an author-appliable attribute | Any replacement must be a condition the gate evaluates | R3, §7.3, negative-flow row | `COMPLIANT` |
| Task 722 (`checkedAny`) must not regress | This task edits the same block | A control-free cell still resolves `null` | Checkpoint 7, negative-flow row | `COMPLIANT` |
| **D33** — re-anchor onto a de-Tailwind-stable hook, never another utility class | A narrowed condition would need a hook | Structural, measured, not a utility class | §7.3 + R2's census | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | The subject is a control that has never measured 120 cells | Two-armed plant, and a zero-delta result pre-declared suspicious | R5, A3, Checkpoint 4 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | Every figure drives the scope decision | Counts from the manifest and the source | §3.1–3.4, each with its source | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | R5 plants a control | `git hash-object` equal to pre-probe **and** absence from `git status --porcelain` | AC5, Checkpoint 6 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | The plant is story markup | Reversible probe in an **inspected existing** story; no permanent markup ships | §7.4, out-of-scope §8 | `COMPLIANT` |
| **D6** — evidence is local-only | `.screenshots/task733-evidence/` | Must not appear in the diff; stated in the session log | Contract §1, §14 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC10, Checkpoint 8 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | §14 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read it from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R12, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, Checkpoints 0 and 8 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| UI task-design requirements | — | Visual source map + canonical UI decision record | No `src/` change; §8 forbids fixing a product component here | `NOT APPLICABLE` |
