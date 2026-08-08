# Unwaivable rule-compliance ledger — Task 722

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved as `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md`, row added to the sprint | `Sprint_52_kickoff_prompt_Task_722_FullWidthControls_VacuousAssertion.md`; Sprint 52 §10 lists it as 52.1 | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | Q4 task | Review inspects real files, diff and evidence | AC1–AC12 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | `docs/critical-flow-registry.md:50` in scope; blocking gate logic changes | Q1–Q3 as applicable **plus** regression baseline, changed-behavior test, planted-violation failure proof | §13 plan steps 2–11 | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q1` evidence | Non-UI code changes | Final `npm run build` exit 0 | §13 step 10, mandatory | `COMPLIANT` |
| **D32** — a migration may not be proven against a comparator not shown to fail | Two arms are re-anchored | The dead arm must be *shown* dead before replacement | R1 census, Checkpoint 1 | `COMPLIANT` |
| **D33** — re-anchor onto a de-Tailwind-stable hook, never another utility class | Re-anchor in scope | Hook must be structural, not a utility class | §7.2 requires a live DOM census; §10.3 requires the census cited in-file | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author can apply is not an exemption the gate owns | Guard + arms touch exemption logic | No new author-appliable skip | §10.5, out-of-scope list | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | A probe is required for AC5 | Reversible probe in an **inspected existing** story; no permanent markup | §7.3.2, out-of-scope §8 | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | AC6 | `git hash-object` equal to pre-probe **and** absence from `git status --porcelain` | AC6, Checkpoint 4 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second counting pass after both exist | AC12, Checkpoint 8 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | The subject *is* a control that cannot | Two-armed plant that can demonstrably fail | R4, three transcripts, §7.3 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write porcelain snapshot + per-entry classification + content witnesses | A1, Checkpoint 0 and 8 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff emitted at review | `COMPLIANT` |
| `docs/rule-index.md` → named pre-read bundle, never "read all docs" | Kickoff must name it | Exact bundle listed | §6, 10 entries + 2 binding decisions | `COMPLIANT` |
| UI task-design requirements (`orchestrator-ui-task-design.md`) | — | Visual source map + canonical UI decision record | No `src/` or UI artifact changes; §8 asserts zero `src/` diff | `NOT APPLICABLE` |
| i18n key parity | No `messages/*` change | Parity gate still run as a guard | §13 step 9 | `COMPLIANT` |
