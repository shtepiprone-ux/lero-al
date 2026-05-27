# Sprint 14 — Critical Follow-ups + Email Policy (owner directive 2026-05-27)

Owner: shtepiprone@gmail.com
Filed: 2026-05-27 (after Sprint 13 closure)
Tasks: **250, 251, 252, 262, 263, 244, 242, 248** (8 tasks)

> **All 8 tasks follow the Sprint 13 governance updates:**
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255)
> - `docs/agent-contract.md` **clause 10** (Sonnet emits "Files Changed" table; orchestrator emits commit commands during review, Task 264)
> - `docs/orchestrator-role.md` "Orchestrator-owned commit emission (Task 264)"
> - Notes 18 / 19 / 20 / 21 / 22 / 23 in `docs/ai-behavior.md`

## Tasks

| # | Task | Epic | Owner-action dependency | Source kickoff |
|---|---|---|---|---|
| 250 | R.3a — `role_permissions` hardening + `role_permission_events` audit log | R (Admin Panel) | **OWNER SQL required** (supersedes Task 197 SQL) | [`Epic_R_kickoff_prompt_Task_250.md`](../Epics/Epic_R_kickoff_prompt_Task_250.md) + Sprint 14 delta |
| 262 | X.3 — `market_type` DB column audit + `Listing` type alignment | X (Domain Type Integrity) | **OWNER SQL** may be required (depends on audit) | [`Epic_X_kickoff_prompt_Task_262.md`](../Epics/Epic_X_kickoff_prompt_Task_262.md) — already compliant |
| 263 | T.7 — Listing-detail contact card RLS cleanup (revert Task 258 admin-client bypass) | T (Global UX Polish) | **OWNER SQL required** (RLS policy) | [`Epic_T_kickoff_prompt_Task_263.md`](../Epics/Epic_T_kickoff_prompt_Task_263.md) — already compliant |
| 251 | GG.1 — Albanian-only outbound email policy | GG (Email Policy) | Owner confirms FROM/templates locale | [`Epic_GG_kickoff_prompt_Task_251.md`](../Epics/Epic_GG_kickoff_prompt_Task_251.md) + Sprint 14 delta |
| 252 | V.3 — Sales inbox split (admin reply routing) | V (Contacts & Inquiries) | Depends on 251 + Task 256 (done) | [`Epic_V_kickoff_prompt_Task_252.md`](../Epics/Epic_V_kickoff_prompt_Task_252.md) + Sprint 14 delta |
| 244 | CC.1 — Phone Combobox placeholder 9 digits across project | CC (Combobox v2) | None | Sprint 14 delta — replaces Sprint 12 kickoff |
| 242 | BB.1 — Listing report button broken on detail page | BB (Listing Inquiries) | None | Sprint 14 delta — replaces Sprint 12 kickoff |
| 248 | FF.1 — Header reactivity on profile name change | FF (UX Reactivity) | None | Sprint 14 delta — replaces Sprint 12 kickoff |

## Run order (owner-confirmed 2026-05-27)

**Owner-action-first** — so the owner can prepare SQL / verification in parallel while Sonnet works on the rest:

1. **250** (R.3a RBAC SQL) — emit SQL for owner immediately
2. **262** (X.3 market_type DB audit) — emit SQL if column missing
3. **263** (T.7 RLS cleanup) — emit RLS policy SQL; gate code revert on owner confirming SQL ran
4. **251** (GG.1 Albanian email) — blocks 252
5. **252** (V.3 sales inbox split) — depends on 251 + 256 (done)
6. **244** (CC.1 phone placeholder)
7. **242** (BB.1 report button)
8. **248** (FF.1 header reactivity)

## Exit criteria (Sprint 14)

- All 8 tasks closed with orchestrator-verified diff + "Files Changed" table + Positive/Negative flow parity in diff.
- `docs/backlog.md` updated; one session log per task under `docs/sessions/`.
- Pending Action Items table reduced to zero blocking owner items (owner-side SQL applied OR documented as deferred).
- No regression to Sprint 13 work (Tasks 255–261).

## Out of scope for Sprint 14

- Deferred polish (W.2–W.6, Y.2-Y.3, Z.1, AA.1, BB.2, CC.2, DD.1, EE.1, FF.2) — Sprint 15.
- Performance work beyond what's already shipped (Epic U is closed).
- New product features (this is a bug-debt + governance follow-up sprint).
