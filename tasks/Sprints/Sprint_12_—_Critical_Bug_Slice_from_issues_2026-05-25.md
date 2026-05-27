# Sprint 12 — Critical Bug Slice (from issues.txt 2026-05-25)

**Filed by:** Opus 4.7 orchestrator 2026-05-25
**Triggered by:** owner `issues.txt` 2026-05-25 — 22 entries triaged into Epics W–FF + Task 250
(R.3a follow-up). Sprint 12 takes the production-critical slice; later sprints absorb the rest.
**Last task number before sprint:** 227 (Sprint 11 closed 2026-05-25).
**Tasks (first slice — others land in Sprint 13+):**
228 (W.1) · 234 (X.1) · 235 (X.2) · 236 (Y.1) · 239 (Y.4) · 242 (BB.1) · 244 (CC.1) · 248 (FF.1)
**Also active (separate file):** **250 (R.3a)** — `Epic_R_kickoff_prompt_Task_250.md`. Run FIRST
of the sprint — it blocks owner SQL for Task 197 and is a hard schema gate.

---

## Run order

1. **Task 250 (R.3a)** — schema gate; STOP on the SQL gate; owner confirms; resume code.
2. **Task 234 (X.1)** + **Task 235 (X.2)** — production-impacting bugs on `/listings` + `/admin/listings`.
3. **Task 228 (W.1)** + **Task 236 (Y.1)** — visible UX regressions in filters + listing form.
4. **Task 244 (CC.1)** — phone placeholder fleet-fix.
5. **Task 239 (Y.4)** + **Task 242 (BB.1)** — admin & listing-detail UX bugs.
6. **Task 248 (FF.1)** — header reactivity.

Each task ships independently; pause to commit before starting the next.

---

## Task table

| ID  | Tag   | Title                                                              | Pri      | Epic |
|-----|-------|--------------------------------------------------------------------|----------|------|
| 250 | R.3a  | role_permissions schema hardening (Task 197 follow-up)             | critical | R    |
| 234 | X.1   | `property_type=room` enum drift + global enum audit                | critical | X    |
| 235 | X.2   | Restore removed admin row actions on `/admin/listings`             | critical | X    |
| 228 | W.1   | Filter sections disappearing on property-type change               | critical | W    |
| 236 | Y.1   | Raw i18n keys exposed on listing form (`listing.offer_type` etc.)  | critical | Y    |
| 244 | CC.1  | Phone Combobox placeholder 9 digits across project                 | high     | CC   |
| 239 | Y.4   | Admin listing edit Cancel-confirm modal no-op                      | high     | Y    |
| 242 | BB.1  | Listing report button broken on detail page                        | high     | BB   |
| 248 | FF.1  | Header reactivity on profile name change                           | high     | FF   |

---

## Sprint-level acceptance

- All 9 tasks pass each Sonnet's Note 18 self-validation block, each orchestrator review checklist
  (`docs/orchestrator-role.md`), and the Note 19 + Note 20 clauses just added in this sprint.
- `docs/backlog.md` Active product backlog table reflects Epics W–FF and Task 250.
- The owner runs (in PowerShell) the single emitted SQL migration from Task 250 — superseding
  Task 197's pending SQL.

---

## Kickoff prompts

See `tasks/Sprints/Sprint_12_kickoff_prompts.md` for the per-task kickoff text the executor reads.
Task 250's kickoff is in its own file (referenced above).
