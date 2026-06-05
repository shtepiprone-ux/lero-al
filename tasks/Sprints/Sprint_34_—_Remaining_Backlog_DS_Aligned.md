# Sprint 34 — Remaining Backlog, Design-System-Aligned (kickoff index)

> **Formed:** 2026-06-05 (Opus orchestrator, after the Design System baseline closed-and-committed at commit `923827b2d`/`47679ae52`).
> **Purpose:** one current, per-task, Sonnet-ready kickoff for EVERY remaining open task, each conforming to the
> present P0 contract — `docs/agent-contract.md` clauses **1–13** (incl. 11 mobile <640 full-width, 12 rendered
> matrix, 13 no-hardcode/Storybook gate) + the Positive/Negative two-flow rule (clause 6a).
> **Standing input:** every UI/overlay surface consumes `docs/design-system.md` (Task 340 contract) and the
> now-committed canonical primitives (Button/Tabs/Dialog/Sheet/all-popups-bottom-sheet + `AdminPageShell` /
> `AdminTable` / `AdminCardList` / `StatusChangeControl` / `StatusChangeHistory`). No surface re-invents these.

## Why a fresh kickoff set

The Design System (Sprint 32→33, Tasks 372–392) shipped + committed the canonical primitives and the
machine-enforced gates (`check:stories`, `check:locale-leak`, `screenshots:assert`). Every task below predates
that baseline in its original planning, so each kickoff is re-issued to: (a) point at the committed primitives
instead of re-building them; (b) carry the clause-11/12/13 gates that did not exist when the originals were
written; (c) keep the original behavioral inventories (which remain accurate) by mandatory pre-read reference.

## Run order + dependencies

| # | Task | Title | Kickoff file | Depends on | Owner decision needed first? |
|---|------|-------|--------------|-----------|------------------------------|
| **0** | **394** | **🔴 PREREQUISITE — Upgrade Storybook to latest stable + retire <640 workarounds + re-prove every gate** | `Sprint_34_kickoff_prompt_Task_394_StorybookUpgrade.md` | — | confirm target SB major (rec: latest stable) |
| 1 | **308** | Admin Listings + Users → canonical shell/table + sort URL-state | `Sprint_34_kickoff_prompt_Task_308_DS_Rescope.md` | DS committed ✅ | no |
| 2 | **309** | Admin Support + Inquiries → shell/card-list + StatusChangeControl + Sheet detail | `Sprint_34_kickoff_prompt_Task_309_DS_Rescope.md` | DS committed ✅ | no |
| 3 | **237** | Admin moderation preview (no more 404) | `Epic_Y_kickoff_prompt_Task_237.md` | — | no |
| 4 | **238** | Listing form side-panel + status control + dirty-state Save | `Epic_Y_kickoff_prompt_Task_238.md` | 237 (shared form) | no |
| 5 | **243** | Listing inquiry / "Send message" flow | `Epic_BB_kickoff_prompt_Task_243.md` | — | **YES — Path A vs B (chat)** |
| 6 | **316** | i18n dynamic-key + missing-key audit (audit only) | `Epic_II_kickoff_prompt_Task_316.md` | — | no |
| 7 | **317** | Missing-key scanner script + CI wiring | `Epic_II_kickoff_prompt_Task_317.md` | 316 | no |
| 8 | **318** | Notification locale-binding audit (audit only) | `Epic_II_kickoff_prompt_Task_318.md` | — | no |
| 9 | **246** | Admin clear change history (gated + audited) | `Epic_DD_kickoff_prompt_Task_246.md` | 250 ✅ | confirm second-audit-table vs reuse |
| 10 | **310** | Content/settings admin routes → canonical shell (Epic HH P4) | `Epic_HH_kickoff_prompt_Task_310.md` | 308/309 reference impls | no (may split 310a/b/c) |
| 11 | **311** | Residual admin modal standardisation (Epic HH P5) | `Epic_HH_kickoff_prompt_Task_311.md` | 309 Sheet pattern | no |
| 12 | **313** | Verified Agents workflow (Epic HH P6) | `Epic_HH_kickoff_prompt_Task_313.md` | — | **YES — DB schema sign-off** |

**🔴 Task 394 (Storybook upgrade) ships and is approved FIRST — it BLOCKS every task below**, because the rendered gates
(`check:stories`, `check:locale-leak`, `screenshots:assert`) are the only accepted proof (clause 13) and they run on a
built Storybook. The current SB 8.6 + hand-rolled <640 workarounds make that proof unreliable; no follow-on task is
approvable until the gates are re-proven on the upgraded Storybook.

Recommended execution: **394 (prerequisite)** → **308 → 309** (admin mobile, highest owner-pain) → **237 → 238** (listing
form) → **316 → 317 → 318** (i18n, independent) → **243 / 246** → **310 → 311** → **313** (after DB-schema sign-off).
308 and 309 are parallel-safe; 316 and 318 are parallel-safe.

## Universal gate embedded in every kickoff below (orchestrator verifies on return)

- Clauses 1–13 of `docs/agent-contract.md`, verified against the **real diff**, not the report.
- **Positive flow + every Negative branch** (6a) has a verifiable line in the diff.
- **Mobile <640 full-width (11):** every text/container surface in scope full-width at `max-sm`; all popups =
  full-width bottom sheet; icon-only exemptions each listed. A non-full-width text surface at <640 = REJECT.
- **Rendered matrix (12):** breakpoints × sq/en/uk/it with real per-cell evidence; uk@320/375/390 mandatory.
  For story/primitive-touching tasks, the only accepted proof is `screenshots:assert` + `check:locale-leak`
  (clause 13) — tsc/build is never proof.
- **No hardcode (13):** every visible string + aria-label via `t()`/`storyT()` with sq/en/uk/it parity; no raw
  `<button>/<input>/<select>`; no `parameters.layout:'centered'|'padded'`; no `globals:{locale}` pin.
- **Files Changed table** in the session log; **executor NEVER runs git** — the orchestrator emits explicit-path
  commits on review (single-writer rule).
