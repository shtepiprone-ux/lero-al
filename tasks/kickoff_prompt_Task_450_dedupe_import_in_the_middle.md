# Task 450 — Chore: dedupe `import-in-the-middle` to clear OpenTelemetry dev warnings

**Type:** Dependency hygiene / chore (no product code, no UI).
**Severity:** Low (non-blocking dev noise) — filed proactively so it does not grow into a real
instrumentation/observability problem later (owner directive, 2026-06-17).
**Status:** FILED — awaiting scheduling. Not yet handed to Sonnet for execution.

## Pre-read (per `docs/rule-index.md`)

- Always required: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md`
  (scan — this chore touches no registered critical flow; confirm and note that in the log).
- Relevant: `docs/dependencies.md` (package-selection / override policy), `docs/integrations.md`
  (Sentry / OpenTelemetry wiring — confirm the dedupe does not change observability behavior).

## Background / current behavior

On `npm run dev` (Next.js 15.5.18 + Turbopack), the terminal repeats, on essentially every
compile/request:

```
⚠ ./node_modules/@fastify/otel/node_modules/@opentelemetry/instrumentation/build/esm/platform/node
Package import-in-the-middle can't be external
The request import-in-the-middle matches serverExternalPackages (or the default list).
The package resolves to a different version when requested from the project directory (3.0.1)
compared to the package requested from the importing module (2.0.6).
Make sure to install the same version of the package in both locations.
```

…and the identical warning for `@prisma/instrumentation/node_modules/@opentelemetry/instrumentation`.

Root cause: `import-in-the-middle` (IITM, the ESM hook used by OpenTelemetry instrumentation) is
installed at **two** versions — `3.0.1` hoisted at the project root, and `2.0.6` nested inside
`@fastify/otel` and `@prisma/instrumentation`. Next/Turbopack's `serverExternalPackages` handling
warns on the mismatch. It is **dev-only noise**: compilation succeeds, all routes return 200, runtime
is unaffected. It is NOT related to the Task 449 auth `/api/auth/me` storm (owner confirmed the storm
is gone after applying Task 449); these warnings persist independently.

## Goal

Resolve `import-in-the-middle` to a **single** version across the tree so the warnings disappear,
without altering OpenTelemetry / Sentry / Prisma instrumentation behavior.

## Positive flow (happy path)

1. Inspect the dependency tree to confirm the two versions and which packages pin the nested `2.0.6`
   (`npm ls import-in-the-middle`).
2. Pick the single target version. Default approach: add a `package.json` `overrides` entry
   pinning `import-in-the-middle` to one version (prefer the version both `@opentelemetry/instrumentation`
   copies are compatible with — verify their peer/version ranges before choosing; do NOT blindly force
   `3.0.1` if the nested instrumentation requires `2.x`). **If the two consumers require incompatible
   major ranges, STOP and ASK the orchestrator — do not force a version that breaks instrumentation.**

   **Record the exact ranges before choosing — a one-line "I verified compatibility" claim is NOT
   acceptable.** Read the installed `package.json` of each consumer and put a table in the session log with:
   - each consumer package + its installed version: root `@opentelemetry/instrumentation`, the nested
     copy under `@fastify/otel`, and the nested copy under `@prisma/instrumentation`;
   - each one's declared `import-in-the-middle` dependency range;
   - the chosen target version;
   - an explicit one-line justification of why that target satisfies **every** listed range.
3. `npm install`, confirm `npm ls import-in-the-middle` now resolves to one version.
4. `npm run dev` → confirm the `import-in-the-middle can't be external` warnings no longer appear.
   The warning fires on server **compilation**, not just startup, so a clean startup excerpt alone is
   NOT sufficient proof. Capture terminal output covering ALL of: (a) dev-server startup; (b) one
   public page request; (c) one route/API request that triggers fresh server compilation; (d) one
   repeated request after the initial compile. The pasted excerpt must show zero
   `import-in-the-middle can't be external` lines across all four.
5. `npx tsc --noEmit` → 0 errors; `npm run build` → passes.
6. Confirm Sentry/OTel still initialize (instrumentation files compile; no new runtime error on boot).

## Negative flow (off-happy-path branches)

- **Incompatible version ranges** between the two `@opentelemetry/instrumentation` copies → STOP and
  ASK; do not ship a forced override that downgrades/breaks either consumer.
- **Override clears the warning but breaks instrumentation init** (Sentry/OTel error on boot, or a
  missing IITM hook) → revert the override, report findings, do not close.
- **`npm install` produces unrelated lockfile churn** → keep the diff to `package.json` +
  `package-lock.json` only; no drive-by dependency bumps (clause 1, scope isolation).
- **Warning persists after dedupe** (e.g. a third nested copy) → document the remaining source; do not
  claim resolved.

## Acceptance criteria

- AC1: `npm ls import-in-the-middle` shows only ONE effective resolved version, with NO second
  installed IITM version remaining under `@fastify/otel` or `@prisma/instrumentation` (a `deduped`/
  overridden tree that still lists a distinct second version does NOT satisfy this). Full transcript
  in the log. → maps to Positive flow step 3.
- AC2: the `npm run dev` excerpt — covering startup + public-page request + a compile-triggering
  route/API request + a repeated post-compile request — shows zero `import-in-the-middle can't be
  external` warnings across all four. → Positive flow step 4.
- AC3: `npx tsc --noEmit` = 0 errors and `npm run build` passes. → Positive flow step 5.
- AC4: Sentry/OpenTelemetry instrumentation still initializes with no new boot error. → Positive flow step 6.
- AC5: Diff limited to `package.json` + `package-lock.json` (no product code, no unrelated bumps).
  **Prove it in the log** by pasting the output of `git diff --stat` and
  `git diff -- package.json package-lock.json` (read-only git only — do NOT stage/commit). The
  `--stat` output must list ONLY those two paths.
- AC6: Session log under `docs/sessions/` with a "Files Changed" table. Executor does NOT run git;
  orchestrator emits the commit at review.

## Out of scope (do NOT touch)

- Do NOT edit product/runtime code.
- Do NOT edit UI, routes, server actions, auth code, admin code, or listing code.
- Do NOT remove or disable Sentry, OpenTelemetry, Prisma instrumentation, `@fastify/otel`, or
  `@prisma/instrumentation`.
- Do NOT suppress the warning by editing `next.config` `serverExternalPackages` (or any other Next
  config) unless the orchestrator explicitly approves it — STOP and ASK first.
- Do NOT replace the targeted `import-in-the-middle` dedupe with broad/unrelated dependency upgrades.
- Do NOT run mutating git commands (single-writer rule — orchestrator emits commits, owner runs them).

## Notes

- No UI surface → no mobile <640 full-width gate, no rendered matrix, no locale parity needed.
- No critical-flow-registry flow touched → no regression-coverage gate (confirm in the log).
- If `overrides` proves insufficient (Turbopack still warns because the nested copy is bundled), the
  fallback is to wait for upstream `@fastify/otel` / `@prisma/instrumentation` to align their pin —
  in that case downgrade this to "blocked on upstream" rather than forcing a fragile patch.
