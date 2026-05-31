# Sprint 30 — Owner-Reported Issues Batch (2026-05-31)

> **Origin:** Owner uploaded `issues.md` (~6100 lines, 13 issues) on 2026-05-31. Orchestrator (Opus 4.7) batched all 13 into Sprint 30.
>
> **Corrective pass (2026-05-31, post-owner-review):** original Sprint 30 used numbers 329–341 which COLLIDED with Sprint 29 Task 329 (Epic Z.2 modal pattern). Renumbered 329→330, 330→331, …, 341→342. Wave-1 dependency error fixed (Task 337 moved out of Wave 1 because it is gated on Task 336). Task count corrected (4 direct Sonnet + 9 Opus, not 5+8). Other 7 owner-listed corrections propagated into kickoffs.
>
> **Source-of-truth for each task body:** the corresponding kickoff file under `tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NNN>.md`.
>
> **Numbering:** Tasks **330–342** (13). Last task number 328 → **342**. Sub-tasks produced by Opus architectural kickoffs (Tasks 331/332/333/336/338/339/340/341/342) consume numbers from the free pool **starting at 343** — orchestrator assigns each sub-task number when the Opus kickoff is executed and the Sonnet sub-task file is written.
>
> **Single-writer git (Cowork + Windows):** Opus does NOT run mutating git. Owner runs every git command emitted by the orchestrator from PowerShell. See `docs/orchestrator-role.md` → "Environment & git safety" + "Orchestrator-owned commit emission (Task 264)".

## Sprint goal

Convert 13 owner-reported defects + architecture gaps from `issues.md` into Sonnet-executable kickoff files: **4 direct Sonnet tasks** (production bugfix + UX copy) and **9 Opus architectural tasks** (each produces, in a subsequent Opus session, a canonical contract doc under `docs/` + one Sonnet sub-task kickoff consuming a number from the free pool ≥ 343).

## Task inventory (4 Sonnet + 9 Opus = 13)

| # | Type | Title | Kickoff file |
|---|---|---|---|
| 330 | Sonnet | Homepage agent CTA copy — early-launch positioning | [`Sprint_30_kickoff_prompt_Task_330.md`](./Sprint_30_kickoff_prompt_Task_330.md) |
| 331 | Opus | Admin Permissions Role Model Contract v1 + Sonnet fix task | [`Sprint_30_kickoff_prompt_Task_331.md`](./Sprint_30_kickoff_prompt_Task_331.md) |
| 332 | Opus | Admin Dashboard UX/Layout Contract v1 + Sonnet redesign task | [`Sprint_30_kickoff_prompt_Task_332.md`](./Sprint_30_kickoff_prompt_Task_332.md) |
| 333 | Opus | Password recovery link lifetime + resend audit + Sonnet fix task | [`Sprint_30_kickoff_prompt_Task_333.md`](./Sprint_30_kickoff_prompt_Task_333.md) |
| 334 | Sonnet | Owner post-edit redirect for "На модерації" listings | [`Sprint_30_kickoff_prompt_Task_334.md`](./Sprint_30_kickoff_prompt_Task_334.md) |
| 335 | Sonnet | Password change flow root-cause + forced re-auth verification | [`Sprint_30_kickoff_prompt_Task_335.md`](./Sprint_30_kickoff_prompt_Task_335.md) |
| 336 | Opus | Deleted-account cleanup + mailing DB architecture + MVP Sonnet sub-task | [`Sprint_30_kickoff_prompt_Task_336.md`](./Sprint_30_kickoff_prompt_Task_336.md) |
| 337 | Sonnet | Delete-account copy clarity — **GATED on Task 336 MVP** | [`Sprint_30_kickoff_prompt_Task_337.md`](./Sprint_30_kickoff_prompt_Task_337.md) |
| 338 | Opus | Admin notification architecture (Phase 1 = listing→pending event + protected default settings + realtime admin Listings) | [`Sprint_30_kickoff_prompt_Task_338.md`](./Sprint_30_kickoff_prompt_Task_338.md) |
| 339 | Opus | Global clickable-area / hover-target consistency audit + Sonnet fix task | [`Sprint_30_kickoff_prompt_Task_339.md`](./Sprint_30_kickoff_prompt_Task_339.md) |
| 340 | Opus | Global Responsive Design System Contract v1 (supersedes 7/9-width canons → 14×4) + phased migration | [`Sprint_30_kickoff_prompt_Task_340.md`](./Sprint_30_kickoff_prompt_Task_340.md) |
| 341 | Opus | Admin listing preview (no public exposure) + "Початкова ціна" → "Оригінальна ціна" | [`Sprint_30_kickoff_prompt_Task_341.md`](./Sprint_30_kickoff_prompt_Task_341.md) |
| 342 | Opus | In-service listing chat architecture — **extends Epic BB** (not new Epic; `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md`) | [`Sprint_30_kickoff_prompt_Task_342.md`](./Sprint_30_kickoff_prompt_Task_342.md) |

## Run order

### Wave 1 — direct Sonnet tasks (parallel-safe, disjoint file scope)

3 parallel-safe Sonnet tasks. **Dependency: none between these three.**

- **Task 330** (homepage agent CTA): `src/app/[locale]/page.tsx` + `messages/*.json` (3 keys × 4 locales = **12 string changes**).
- **Task 334** (owner post-edit redirect): listing edit page + server action + listing public-route status guard (no weakening of the 404 guard).
- **Task 335** (password change root cause): `src/modules/cabinet/components/CabinetPasswordSection.tsx` + `src/modules/cabinet/actions/index.ts` + `src/lib/passwordRules.ts` + `src/lib/auth/browser.ts`.

**Wave 1 owner gate G1:** all 3 PASS owner manual QA in `uk` 320–2560 across sq/en/uk/it.

### Wave 1a — gated direct Sonnet (runs AFTER Task 336 MVP ships)

- **Task 337** (delete-account copy clarity) is **GATED on Task 336 MVP** because the truthful copy depends on the actual deletion behavior, which Task 336 documents + the Task 336 MVP Sonnet sub-task implements. Task 337 includes a STOP & ASK clause: if Task 336 MVP has not yet aligned backend behavior with the new copy, Task 337 reports the mismatch and waits. **Task 337 is NOT a Wave 1 parallel-safe task.**

### Wave 2 — Opus architectural kickoffs (sequential, one per session)

Each Opus kickoff produces a canonical doc + one Sonnet sub-task consuming a number ≥ 343 from the free pool. Recommended execution order by owner-impact priority:

| Order | Task | Reason |
|---|---|---|
| 1 | **333** Password recovery + resend | Users locked out of password reset → critical production auth defect |
| 2 | **336** Account deletion + mailing DB | Same-email re-registration broken in production; gates Task 337 |
| 3 | **338** Admin notifications | Moderation queue stalls without listing-pending notifications |
| 4 | **341** Admin listing preview + price label | Two co-located bugs in listing detail / admin moderation UX |
| 5 | **331** Admin permissions role model | Permissions page misleading and unsafe to use |
| 6 | **332** Admin dashboard UX | Quality issue — sparse, low-polish; affects operator UX |
| 7 | **339** Global clickable-area audit | Affects many surfaces; bundle into single global audit |
| 8 | **340** Global responsive design system | Foundational; biggest scope; supersedes 7/9-width lists with the 14-width × 4-locale canon |
| 9 | **342** In-service listing chat | Largest new-feature architecture; extends Epic BB; must be split into ≥ 5 phases |

**Wave 2 cadence:** owner executes one Opus kickoff per session, reviews the contract + Sonnet sub-task, then approves before the corresponding Sonnet sub-task runs.

### Critical dependency notes

- **Task 334 ↔ Task 341.** Both share root: published-only public route 404s for non-published listings. Task 334 = owner-side redirect (status-aware after save). Task 341 = admin-side preview architecture. Disjoint scope.
- **Task 337 ↔ Task 336.** Copy gated on architecture decision (see Wave 1a). Task 337 STOP & ASK if backend ≠ copy.
- **Task 338 ↔ Task 334.** Independent.
- **Task 340 ↔ everything.** The 14-width × 4-locale canon (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560) supersedes older 7/9-width lists in `docs/responsive-governance.md` + `docs/ui-rules.md` §17 + `docs/admin-ux-rules.md` §14. Until Task 340 propagates the canon to those docs, individual Sprint 30 kickoffs cite the canon inline as authoritative.
- **Task 342 ↔ Epic BB.** Chat architecture EXTENDS existing `Epic_BB_Listing_Inquiries_Report_and_Message.md`. No new `Epic_Z2` (collision with Epic Z.2 modal pattern).

## Owner gates

- **G1 (Wave 1 close)** — Owner manual QA PASS on Tasks 330 + 334 + 335.
- **G1a (Wave 1a close)** — Owner manual QA PASS on Task 337 AFTER Task 336 MVP ships.
- **G2 (per Opus kickoff)** — Owner reviews each contract doc + Sonnet sub-task kickoff BEFORE the Sonnet sub-task runs. 9 gates total.
- **G3 (Sprint 30 close)** — all 13 tasks + 9 produced Sonnet sub-task implementations committed to `main`.

## What this sprint does NOT change (orchestrator scope)

- No locale message changes by Opus.
- No production code changes by Opus.
- No new sprints created; all 13 issues fit in Sprint 30.
- No global-counter restart.

## References

- Orchestrator role: `docs/orchestrator-role.md`
- Agent contract: `docs/agent-contract.md`
- Pre-read selection: `docs/rule-index.md`
- Canonical Task Template: `docs/ai-behavior.md` → "Canonical Task Template"
- Owner source document: `issues.md` (uploaded 2026-05-31; not checked into repo)
