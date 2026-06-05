# Epic II — Task 317 kickoff — Missing-key scanner script + `check:i18n-dynamic` wiring (script only)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract. **SCRIPT-ONLY: a new governance script + npm wiring + docs. No product runtime-code changes.**
> Re-issue of `tasks/Sprints/Sprint_24_kickoff_prompt_Task_317.md`. **Depends on Task 316 audit output.**

```
Type:        chore (governance script)
Priority:    high (Epic II Phase 1 — makes the Task 316 audit a permanent guard)
Area:        scripts/governance/i18n-missing-keys.mjs (NEW) + package.json (script) + docs
Output:      a static scanner that resolves dynamic t() calls against their source enums and fails on any missing key
```

## Goal
Add `scripts/governance/i18n-missing-keys.mjs` that statically resolves dynamic `t()` calls (per the Task 316 audit
patterns) against the source enum/array/object and reports any key missing in any of `sq/en/uk/it`. Wire it as
`npm run check:i18n-dynamic` (and decide CI wiring — owner approves blocking behaviour). This catches the dynamic-key
gap that `check:i18n` parity (count-only) misses.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/ai-behavior.md` → "Localization (i18n) Rules" + `docs/qa-rules.md` + `docs/governance-enforcement.md`
   (how existing governance scripts are wired). Read `package.json` scripts (`check:i18n`, `check:stories`,
   `check:locale-leak`) for the canonical script shape + exit-code convention.
3. **`docs/governance-reports/2026-06-XX-i18n-dynamic-key-audit.md` (Task 316 output)** — the call-site + enum inventory
   the scanner must cover. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (Task 317 spec).
4. The existing `scripts/check-i18n-parity.mjs` + `scripts/check-locale-leak.mjs` (reuse patterns; do NOT duplicate the
   parity logic — compose).

## Required behavior
1. Scanner reads each dynamic `t()` call site from a maintainable source-of-truth (the enum/array it cites), enumerates
   all keys, and checks all 4 locale files. Exit non-zero with a clear per-key, per-locale report on any miss.
2. `npm run check:i18n-dynamic` runs it. Self-test: a **negative-flow proof** — temporarily remove one enumerated key from
   one locale, run the scanner, show it FAILS (paste transcript), then restore. (Proves the gate is real, not a no-op.)
3. Document the canonical rule in `docs/i18n-rules.md` (NEW) or extend `docs/ai-behavior.md` i18n section: every dynamic
   `t()` call MUST cite its source enum + every enum value MUST appear in a CI-checked list.
4. CI wiring decision (blocking vs advisory) — **STOP & ASK the owner** before making it a blocking CI gate (Task 323
   locks the combined gate; here just propose).

## Acceptance criteria
- `scripts/governance/i18n-missing-keys.mjs` exists; `npm run check:i18n-dynamic` runs and exits 0 on the current tree
  (or lists real gaps if the Task 316 audit found any — coordinate: gaps are filled by Task 320, scanner just reports).
- Negative-flow transcript: planted missing key → scanner FAILS → restored.
- Canonical dynamic-key rule documented (`docs/i18n-rules.md` or ai-behavior i18n section).
- **No product runtime-code changes** (`git diff --stat src` empty); only `scripts/**`, `package.json`, `docs/**`.
- Clauses 11/12/13 **N/A** (no UI/story rendered) — state explicitly in the session log.
- `tsc` N/A for a `.mjs` script; `lint` clean for the new file; `docs/backlog.md` + session log updated;
  **Files Changed table**; **no git from executor**.

## Out of scope
- Filling missing keys (Task 320). Making CI blocking without owner sign-off (Task 323). Notification render fix (Task 319).
- Rewriting `check:i18n` parity — compose with it, don't replace it.
