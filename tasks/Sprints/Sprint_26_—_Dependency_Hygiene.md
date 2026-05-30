# Sprint 26 — Dependency Hygiene (Turbopack `import-in-the-middle` warning)

> **Formed:** 2026-05-30 (owner-uploaded `issues2.md` 2026-05-30 — single-task chore explicitly NOT mixed with Admin UX / i18n work).
> **Status:** FORMED — one kickoff ready for Sonnet.

## Sprint goal

Investigate the repeated Next.js Turbopack warning:

```
Package import-in-the-middle can't be external
```

caused by version mismatch (3.0.1 vs 2.0.6) pulled in by different transitive deps (e.g. `@fastify/otel` and `@prisma/instrumentation`). Remove the warning IF and only IF the fix is trivially safe; otherwise document it as known dev-only noise.

## Tasks

### Task 325 — Turbopack `import-in-the-middle` version-mismatch warning [LOW]

- Kickoff: [`Sprint_26_kickoff_prompt_Task_325.md`](Sprint_26_kickoff_prompt_Task_325.md)
- Type: chore (dependency hygiene / dev-experience polish)
- Files (option-dependent): `docs/dependencies.md` (extend) + optional `package.json` (overrides entry if option B) + `package-lock.json` (regen if B/C) + session log + backlog.
- Investigation outcomes:
  - **A — document only** (orchestrator default): warning is harmless dev noise → add to "Known dev warnings" section in `docs/dependencies.md`.
  - **B — `npm overrides`** (only with explicit STOP & ASK approval): pin `import-in-the-middle` to a single version.
  - **C — direct dep bump** (only with explicit STOP & ASK approval): bump the offending direct dep if its newer version resolves the conflict cleanly.
  - **D — Turbopack config suppression** (only with explicit STOP & ASK approval): if a config flag exists for this specific noise.
- Dependency: confirm warning does NOT appear in `npm run build` first; if it does, escalate priority + STOP & ASK.
- Independence: standalone; no overlap with any other sprint.

## Exit criteria

Sprint 26 closes when:
- Task 325 investigation report shipped in session log + dependencies doc.
- Recommendation chosen (A/B/C/D) and either documented (A) or applied (B/C/D).
- All standard commands pass (`tsc`, `build`, `lint`, `vitest`).
- Backlog updated; Sprint 26 row in archive table.

## Out of scope for Sprint 26

- Any other dev-console warning.
- Any unrelated dep bump.
- Next.js version bump.
- Turbopack-to-webpack migration.
- Admin UX work.
- i18n work.
- Sprint 21 / 22 / 23 / 24 / 25 work.

## References

- `docs/dependencies.md` — canonical dep policy.
- Owner directive: explicitly NOT mixed with Admin UX or i18n fixes.
