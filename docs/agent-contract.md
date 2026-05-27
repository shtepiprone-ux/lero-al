# Agent Contract — P0 source of truth for Sonnet 4.6

> **Read this first on every task.** This is the short, non-negotiable P0 contract.
> Long-form rules live in the docs listed under each clause.
> If a longer doc appears to contradict this P0 contract, STOP and ask the orchestrator.
> Do not use a longer doc to weaken or bypass the P0 contract.

## P0 Sonnet Contract

These ten clauses apply to **every** task. The orchestrator verifies each one against the actual diff on return.

1. **Do not change scope.** Only modify files needed for the kickoff. No drive-by refactors, no "while I'm here" cleanups. Full rule: `docs/ai-behavior.md` → "Scope Isolation Rules" and `docs/orchestrator-role.md` → "Hard contract".

2. **Do not invent architecture.** If something is ambiguous or missing, **stop and ask** — do not invent your own solution. Full rule: `docs/orchestrator-role.md` → "Hard contract".

3. **Do not remove existing functionality unless the kickoff explicitly authorises it.** Silent removal of any interactive control (button, row action, dropdown item, status switcher, filter chip, sidebar entry, …) is a TASK FAILURE. Full rule: `docs/ai-behavior.md` → "Existing-Control Preservation (Note 20)".

4. **Do not replace an editable control with a read-only label unless the new editable location is implemented in the same task.** A read-only label is not a replacement for an editable control. Full rule: `docs/ai-behavior.md` → "Control Relocation Rule (Note 21)".

5. **Preserve existing UX flow unless the task explicitly changes it.** Entry points, sibling controls, downstream steps, every empty/loading/error/success/cancel state in the affected flow must keep working end-to-end. Full rule: `docs/ai-behavior.md` → "UX Flow Preservation (Note 19)".

6. **Every UI/control change must define current behavior and required after-behavior in the kickoff and the session log.** No abstract task wording — the kickoff template enforces this; do not skip the "Current behavior to preserve" or "Required after behavior" sections. Full rule: `docs/ai-behavior.md` → "Canonical Task Template".

7. **Every new/changed user-facing string must cover all four locales — `sq`, `en`, `uk`, `it` — in the same key set.** Runtime locale switching must be visually confirmed (matching key counts is not enough). Full rule: `docs/ai-behavior.md` → "Localization (i18n) Rules".

8. **Every UI change must be verified at the seven canonical breakpoints — 320, 375, 390, 768, 1280, 1440, 2560.** Full rule: `docs/responsive-governance.md` and `docs/ai-behavior.md` → "Responsive Governance Enforcement".

9. **Run required validation before claiming complete.** `npx tsc --noEmit` → 0 errors. `npm run build` if the change is non-trivial. AC-by-AC self-audit table in the session log. Final "Self-validation: …" verdict line. Full rule: `docs/ai-behavior.md` → "Pre-Completion Self-Validation (Note 18)".

10. **Update `docs/backlog.md` and add a session log under `docs/sessions/`.** Then provide ready-to-run git commit commands as plain text — the OWNER runs them in PowerShell. **The executor NEVER runs git itself** (single-writer rule). Full rule: `docs/orchestrator-role.md` → "Environment & git safety" and `docs/ai-behavior.md` → "Commit Rules".

## Where the full rules live

- **Long-form executor rules:** `docs/ai-behavior.md` (Notes 14, 18, 19, 20, 21, 22, 23 are the behavior-preservation core).
- **Long-form orchestrator rules:** `docs/orchestrator-role.md`.
- **Task-type-specific pre-read selection:** `docs/rule-index.md` — every Sonnet kickoff must use this to load only the relevant docs (no more "read all docs").
- **Canonical Task Template:** `docs/ai-behavior.md` → "Canonical Task Template" — every task in `/tasks/Sprints/*.md` and `/tasks/Epics/*.md` must follow it.

## What "Sonnet's report is not proof" means

The orchestrator approves work only after reading the actual `git diff` — not the executor's session log claim. Self-validation in the session log is required (see clause 9) but it is the executor's *claim*, not the *proof*. If a diff disagrees with the session log, the diff wins and the task is routed back as a follow-up.
