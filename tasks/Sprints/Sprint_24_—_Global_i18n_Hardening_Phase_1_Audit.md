# Sprint 24 — Global i18n Hardening Phase 1 (Audit + Scanner)

> **Formed:** 2026-05-30 (Epic II Phase 1; NOT blocked on Epic HH owner decisions per Epic II directive).
> **Status:** FORMED — three audit/scanner kickoffs ready for Sonnet.
> **Run order:** 316 → 317 (sequential — 317 formalises 316 audit as a script) · 318 parallel (independent).
> **Owner gate after sprint closes:** Phase 2 (Tasks 319/320/321/322) blocked until owner reviews the three audit reports.

## Sprint goal

Produce three artefacts that unblock Epic II Phase 2 remediation:

1. **Project-wide dynamic-key + missing-key audit** (Task 316) — every `t(\`...${var}\`)` call site enumerated against source enums; per-locale missing-key matrix; Phase 2 remediation buckets.
2. **Missing-key scanner script** (Task 317) — `scripts/governance/i18n-missing-keys.mjs` + `npm run check:i18n-dynamic` — formalises Task 316 audit as a CI-runnable guard.
3. **Notification locale-binding audit** (Task 318) — every notification creation path classified by locale-resolution; root-cause hypothesis for the wrong-locale "Скарга на ваш аккаунт..." bug; Phase 2 remediation roadmap.

Plus seed `docs/i18n-rules.md` (NEW; Task 316 creates, Tasks 317 + 318 extend).

**No production code in this sprint** (except the one governance script Task 317 ships — script-only, no `src/` changes).

## Tasks

### Task 316 — Project-wide dynamic-key + missing-key i18n audit

- Kickoff: [`Sprint_24_kickoff_prompt_Task_316.md`](Sprint_24_kickoff_prompt_Task_316.md)
- Type: audit/spec (docs only)
- Output: `docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md` (NEW) + `docs/i18n-rules.md` (NEW); session log; backlog entry.
- Scope: every `t(\`...${var}\`)` in `src/`; per-locale missing-key matrix; remediation buckets for Task 320.
- STOP & ASK on: any call-site source enum that cannot be statically resolved.
- Independence: ships standalone; foundational doc for Tasks 317 + 318.

### Task 317 — Missing-key scanner script + `check:i18n-dynamic` wiring

- Kickoff: [`Sprint_24_kickoff_prompt_Task_317.md`](Sprint_24_kickoff_prompt_Task_317.md)
- Type: governance script + npm script entry (NO production code, NO locale data)
- Output: `scripts/governance/i18n-missing-keys.mjs` (NEW) + config + allowlist + `package.json` script entry; `docs/i18n-rules.md` (EXTEND with "Missing-key scanner" section); session log; backlog.
- Scope: Strategy A (TS parser) or B (hand-maintained config map) — STOP & ASK; orchestrator recommends B.
- Dependency: Task 316 ships first (the audit provides the expected call-site set + the missing-key counts the scanner must match).

### Task 318 — Notification locale-binding audit

- Kickoff: [`Sprint_24_kickoff_prompt_Task_318.md`](Sprint_24_kickoff_prompt_Task_318.md)
- Type: audit/spec (docs only)
- Output: `docs/governance-reports/2026-05-31-notification-locale-audit.md` (NEW) + `docs/i18n-rules.md` (EXTEND with "Notification locale-binding canonical rule" placeholder); session log; backlog.
- Scope: every notification creation path; per-path locale-resolution map; root-cause hypothesis for "Скарга на ваш аккаунт" bug; Phase 2 remediation roadmap for Task 319.
- STOP & ASK on: `users.preferred_locale` column missing/unreliable; helper-signature breaking-change scope; unfindable bug string.
- Independence: parallel to 316 + 317; can run concurrently.

## Run order rationale

- **316 first** — produces the call-site inventory + per-locale missing-key matrix that Task 317's scanner must match.
- **317 after 316** — scanner formalises the manual audit; verification = "running the scanner reports the same missing-key count as the manual audit".
- **318 parallel** — independent of 316/317 (different bug class: locale-binding vs. key-existence). Can run concurrently with 316 or 317.

## Exit criteria

Sprint 24 closes when:
- All three tasks have approved diffs (orchestrator review).
- `docs/governance-reports/` contains the two audit reports.
- `docs/i18n-rules.md` exists with the three seeded sections (dynamic-key rules / missing-key scanner / notification locale-binding placeholder).
- `npm run check:i18n-dynamic` runs and reports the same missing-key count Task 316 audit identified.
- Owner reviews the audit reports and provides explicit Phase 2 sign-off (separate Sprint 27 / Sprint 28 / etc. kickoffs for Tasks 319/320/321/322).
- Orchestrator emits explicit-path commit commands per task.
- Backlog updated; Sprint 24 row in archive table.

## Out of scope for Sprint 24

- Filling missing locale keys — Task 320 (Phase 2).
- Notification fix implementation — Task 319 (Phase 2).
- Email template i18n correctness — Task 321 (Phase 2).
- Toast / modal i18n audit — Task 322 (Phase 2).
- CI gate wiring as blocking — Task 323 (Phase 3).
- Adding new dependencies (Task 317 uses Node built-ins + existing deps).
- Any production source code edit.
- Any `messages/*.json` edit.
- DB schema (including `users.preferred_locale` if missing — flag in audit, do not migrate in this sprint).
- Public-site UX changes.

## Independence from Epic HH

Per `tasks/Epics/Epic_II_Global_i18n_Hardening.md` → "Dependencies / sequencing": Sprint 24 is **NOT blocked** on Epic HH owner decisions. Phase 1 i18n audit ships standalone. Phase 2+ remediation tasks (319/320/321/322) are NOT pre-written — they will be drafted only after Sprint 24 audit outputs land.

## References

- Epic II — Global i18n Hardening: [`../Epics/Epic_II_Global_i18n_Hardening.md`](../Epics/Epic_II_Global_i18n_Hardening.md)
- Task 300 (Phase 0 — Admin Support i18n hotfix, Sprint 21): [`Sprint_21_kickoff_prompt_Task_300.md`](Sprint_21_kickoff_prompt_Task_300.md)
- Task 288 (static i18n hardcode audit — 2026-05-29, COMMITTED): in Session Archive.
- `docs/integrations.md` → "Outbound email language policy (Albanian-only, 2026-05-25)" — Epic GG; out of Epic II scope but referenced.
