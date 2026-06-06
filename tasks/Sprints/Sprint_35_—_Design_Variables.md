# Sprint 35 — Design Variables (single-source tokens)

> Implements **Epic JJ** (`tasks/Epics/Epic_JJ_Design_Variables_Single_Source.md`).
> Owner decisions (2026-06-06): **code-only single source** · **all four token categories** (spacing, typography,
> elevation+z-index+motion, breakpoints+sizing) · **strict gate, no baseline** (lands report-mode, flips to blocking
> at the end when the tree is clean).

## Task list

| # | Task | Type | Status | Kickoff file |
|---|------|------|--------|--------------|
| **401** | Token foundation — complete `@theme` variable layer + `design-system.md` registry (visually inert) | tooling/styling + governance | ✅ APPROVED (commit emitted) — inertness proven vs TW 4.3 engine source | `Sprint_35_kickoff_prompt_Task_401_TokenFoundation.md` |
| **402** | `check:design-tokens` detector — report mode; raw hex/rgb/hsl/px/rem/z/shadow/duration scan + non-blocking CI report step. **Folds in:** `--container-max`→`--width-page-max` cleanup (401 footgun fix) | tooling/governance + tiny token fix | KICKOFF READY | `Sprint_35_kickoff_prompt_Task_402_DesignTokensDetector.md` |
| **403** | Refactor `src/components/ui/**` to tokens (visually inert) + exact-value suppression for off-scale bespoke values (policy A) | UI/styling | KICKOFF READY | `Sprint_35_kickoff_prompt_Task_403_UIPrimitivesTokenRefactor.md` |
| **404** | Refactor `src/components/shared/**` + `src/components/layout/**` to tokens | UI/styling | TO DRAFT | (after 403) |
| **405** | Refactor `src/components/admin/**` to tokens | UI/admin/styling | TO DRAFT | (after 404) |
| **406** | Refactor `src/components/listing/**` + `auth/**` + remaining `src/**` to tokens | UI/styling | TO DRAFT | (after 405) |
| **407** | Flip `check:design-tokens` to BLOCKING (strict, no baseline) + justified exemptions + CI/pre-commit + final doc | governance | TO DRAFT | (after 406) |

## Rollout rule

Draft each kickoff only after the previous task is approved + committed — the detector inventory (402) defines the
real refactor surface for 403–406, and the strict flip (407) requires a clean tree. Do NOT pre-write 403–406 against
guessed surfaces; use the 402 report.

## Standing gates (every task)

`agent-contract.md` clauses 1–14, the mobile <640 full-width gate, rendered-evidence matrix for any UI-rendering task,
4-locale parity for any user-facing change, file-integrity check, Files-Changed table, orchestrator-emitted commits.
Every refactor task additionally MUST prove **zero visual diff** (before/after rendered matrix) — tokens mirror values.
