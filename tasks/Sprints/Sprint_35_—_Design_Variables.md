# Sprint 35 — Design Variables (single-source tokens)

> Implements **Epic JJ** (`tasks/Epics/Epic_JJ_Design_Variables_Single_Source.md`).
> Owner decisions (2026-06-06): **code-only single source** · **all four token categories** (spacing, typography,
> elevation+z-index+motion, breakpoints+sizing) · **strict gate, no baseline** (lands report-mode, flips to blocking
> at the end when the tree is clean).

## Task list

| # | Task | Type | Status | Kickoff file |
|---|------|------|--------|--------------|
| **401** | Token foundation — complete `@theme` variable layer + `design-system.md` registry (visually inert) | tooling/styling + governance | ✅ APPROVED (commit emitted) — inertness proven vs TW 4.3 engine source | `Sprint_35_kickoff_prompt_Task_401_TokenFoundation.md` |
| **402** | `check:design-tokens` detector — report mode; raw hex/rgb/hsl/px/rem/z/shadow/duration scan + non-blocking CI report step. **Folds in:** `--container-max`→`--width-page-max` cleanup (401 footgun fix) | tooling/governance + tiny token fix | ✅ APPROVED + COMMITTED | `Sprint_35_kickoff_prompt_Task_402_DesignTokensDetector.md` |
| **403** | Refactor `src/components/ui/**` to tokens (visually inert) + exact-value suppression for off-scale bespoke values (policy A) | UI/styling | ✅ **APPROVED + commit emitted** — native proof: computed Group A identical · duration 350→300ms only · `screenshots:assert` 812/812 · `check:file-integrity` 15/15 · `check:design-tokens` UI=0 · `translate-y` fix applied | `Sprint_35_kickoff_prompt_Task_403_UIPrimitivesTokenRefactor.md` |
| **404** | Refactor `src/components/shared/**` + `src/components/layout/**` to tokens | UI/styling | TO DRAFT | (after 403) |
| **405** | Refactor `src/components/admin/**` to tokens | UI/admin/styling | TO DRAFT | (after 404) |
| **406** | Refactor `src/components/listing/**` + `auth/**` + remaining `src/**` to tokens | UI/styling | TO DRAFT | (after 405) |
| **408** | Detector hardening — extend `check:design-tokens` to negative arbitrary values (`[-Nrem]`), `calc()`/`min()`/`max()`/`clamp()` + other bracket forms, OR explicitly document out-of-scope bracket forms. **MUST precede 407.** | tooling/governance | TO DRAFT (raised by 403 review) | (before 407) |
| **407** | Flip `check:design-tokens` to BLOCKING (strict, no baseline) + justified exemptions + CI/pre-commit + final doc. **Depends on 408** (no "strict raw-value gate" claim while blind spots undocumented). Stale allowlist/exemption entries must FAIL, not warn. | governance | TO DRAFT | (after 406 + 408) |

## Rollout rule

Draft each kickoff only after the previous task is approved + committed — the detector inventory (402) defines the
real refactor surface for 403–406, and the strict flip (407) requires a clean tree. Do NOT pre-write 403–406 against
guessed surfaces; use the 402 report.

## Standing gates (every task)

`agent-contract.md` clauses 1–14, the mobile <640 full-width gate, rendered-evidence matrix for any UI-rendering task,
4-locale parity for any user-facing change, file-integrity check, Files-Changed table, orchestrator-emitted commits.

**Per-change proof model (policy A — NOT a blanket "zero visual diff"):**
- **Exact token swaps** must prove **zero visual/layout diff** (browser-computed target-property equality, corroborated by the rendered matrix).
- **Owner-approved motion harmonizations** must prove the **computed timing change** (e.g. `transition-duration` before/after) and **no layout/color/position regression** (screenshots prove only the latter).
- **Inline-suppressed / path-allowlisted values** must remain **explicitly justified** (a stale/unjustified marker is a violation, not a warning).

## Deferred governance cleanups (NON-BLOCKING — apply at Task 404 or Task 407 review; do NOT block 403)

> Owner directive 2026-06-06: carry these forward; no separate corrective task unless they affect Sonnet execution.

1. **Task 402 count mismatch** — the clean inventory is **140** raw violations; the negative probe reportedly adds **5**
   (→ expected 145), but the strict transcript in the 402 session log reads **165**. Correct or explain this in the Task 402
   session log at the next JJ-logs touch. Non-blocking: each consumer task (403–406) re-runs `check:design-tokens`
   before/after and proves its OWN delta, so the 402 headline count does not gate them.
2. **Policy-A wording sweep** — ensure Sprint 35 + Epic JJ say **"zero unjustified / unsuppressed raw style-value
   violations"**, never "zero raw values exist"; and replace any remaining blanket "every refactor task proves zero visual
   diff" with the per-change proof model above. (Epic JJ acceptance + this file's Standing gates already updated; sweep the
   Epic JJ "Goal"/"Risks" prose for leftover blanket wording.)
3. **Task 407 guardrail** — in the final strict gate, **stale allowlist / stale exemption entries must FAIL**, not merely
   warn, where they can hide drift (403 already makes stale inline-suppression markers a violation — carry that spirit into
   407's path-allowlist + design-tokens-exempt handling).
