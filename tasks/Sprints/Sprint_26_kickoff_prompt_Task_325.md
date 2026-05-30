# Sprint 26 — Task 325 kickoff (LOW chore: Investigate Turbopack `import-in-the-middle` version-mismatch warning)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **dependency hygiene chore — investigation-first, fix-only-if-safe**. Pre-read `docs/dependencies.md`, `docs/qa-rules.md`, `docs/performance.md`, `package.json`. No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 325 is the next free global number after Task 324 (Sprint 25). Owner-assigned in `issues2.md` 2026-05-30. Explicitly NOT mixed with Admin UX or i18n work per owner directive.

---

```
Type:        chore (dependency hygiene / dev-experience polish)
Priority:    LOW — does not block any product work; only removes a repeated dev-console warning
Area:        package.json — npm install resolution — Next.js dev (--turbopack) noise
```

## Why this task exists (2026-05-30 owner observation)

Running `npm run dev` (Next.js with `--turbopack`) prints a repeated warning:

```
Package import-in-the-middle can't be external
```

Caused by version mismatch:
- `import-in-the-middle` 3.0.1 (pulled in by one transitive dependency)
- `import-in-the-middle` 2.0.6 (pulled in by another transitive dependency, e.g. `@fastify/otel` or `@prisma/instrumentation`)

Both packages exist in the dep tree → npm resolves two different versions → Turbopack reports the conflict.

This is noise, not breakage:
- App runs fine in dev.
- Production `npm run build` likely unaffected (TASK MUST CONFIRM).
- Warning is annoying + clutters dev console output, hiding more meaningful diagnostics.

## Goal

Investigate and either:

A) **Document only** — confirm the warning is dev-only (Turbopack) and does NOT affect `npm run build` / production runtime; document the upstream issue + workaround status; add to a "known dev warnings" section in `docs/dependencies.md`. No package change.

B) **Resolve via overrides** — add an `npm overrides` entry to `package.json` to pin `import-in-the-middle` to a single version (e.g. `3.0.1`); verify dev + build + tests still pass; remove warning. **STOP & ASK before adding `overrides` — orchestrator preference is option A unless fix is trivially safe.**

C) **Resolve via dep bump** — if a direct dep upgrade resolves the conflict cleanly (e.g. `@prisma/instrumentation` ships a newer version that pulls in 3.x), bump that direct dep; verify nothing else breaks. STOP & ASK before bumping.

D) **Suppress warning** — only if Turbopack provides a config flag for this specific noise. DOCUMENT only; no config change unless explicitly approved.

**Default recommendation: option A** — document + accept as known noise unless investigation reveals option B or C is trivially safe.

## Current behavior to preserve (Note 19)

- `npm run dev` works.
- `npm run build` works.
- `npm run test` / `vitest` works.
- `npm run lint` works.
- No new dependencies (option B/C only if a single explicit dep version change with zero side effects).

If any of the four commands above regresses, ROLL BACK and switch to option A (document only).

## Required investigation (PASTE in session log)

```
# 1. Reproduce the warning
npm run dev 2>&1 | grep -A 2 'import-in-the-middle' | head -20
# (capture verbatim warning text + line context)

# 2. Inspect dependency tree for import-in-the-middle
npm ls import-in-the-middle 2>&1 | head -40
# (identify all paths that pull it in + version per path)

# 3. Identify which transitive deps own each version
npm why import-in-the-middle 2>&1 | head -40
# OR: cat package-lock.json | jq '.packages | to_entries | map(select(.key | contains("import-in-the-middle")))' | head -60

# 4. Confirm build is unaffected
npm run build 2>&1 | tail -30
# (look for the same warning OR any new errors)

# 5. Confirm tests + lint
npm run lint 2>&1 | tail -5
npx vitest run 2>&1 | tail -10

# 6. Search upstream for known issue
# (do NOT use web search if restricted; document the version + ownership info from npm; leave issue-tracker URL hunt to owner)

# 7. Check if Next.js Turbopack docs mention this specific warning
grep -rn 'import-in-the-middle' node_modules/next/ 2>&1 | head -5

# 8. Confirm dep policy (docs/dependencies.md)
cat docs/dependencies.md | head -60
```

After investigation, paste:
- Verbatim warning text + line context.
- `npm ls import-in-the-middle` output (showing both versions + their owners).
- Whether `npm run build` reproduces the warning (Turbopack vs. Webpack distinction matters).
- Whether tests / lint regress.
- Recommendation: A (document) / B (overrides) / C (dep bump) / D (suppress) with 2-line rationale.

## STOP & ASK before changing any package

1. **If recommendation is B (overrides)** — STOP & ASK with the proposed `package.json` diff + the version pinned + the chain of deps affected.
2. **If recommendation is C (dep bump)** — STOP & ASK with the proposed dep + version + changelog summary if available.
3. **If recommendation is A (document only)** — proceed without asking; the document-only path is owner-default-approved.
4. **If the warning is present in `npm run build` too** — STOP & ASK; the priority shifts because build noise is more serious than dev noise.

## Scope (files Sonnet may touch)

- `docs/dependencies.md` (EXTEND with new "Known dev warnings" section if option A) — OR with an `overrides` documentation entry if option B
- `package.json` (ONLY if option B/C and owner-approved via STOP & ASK)
- `package-lock.json` (regenerated by `npm install` if option B/C)
- `docs/sessions/2026-05-30-task-325-import-in-the-middle-investigation.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any file under `src/`
- Any file under `messages/`
- Any file under `scripts/`
- Any other admin / public / DB file
- Sprint 21 / 22 / 23 / 24 / 25 files
- Admin UX work (Epic HH)
- i18n work (Epic II)
- Any new dependency
- Next.js config (`next.config.ts` / `next.config.mjs`) unless owner-approved via STOP & ASK

Maximum SOURCE-FILE delta: **0** (zero `src/`). Allowed deltas: 1 doc + 1 session log + 1 backlog + OPTIONALLY 2 package files (only with owner approval).

## Acceptance criteria (literal)

- Investigation output pasted in session log (verbatim warning + `npm ls import-in-the-middle` + build/test/lint status).
- Recommendation (A/B/C/D) selected with rationale.
- If option A: `docs/dependencies.md` has a new "Known dev warnings" section listing this warning + its harmless status + the upstream tracking note.
- If option B: `package.json` has a single new `overrides` entry; `npm install` ran; warning disappears in `npm run dev`; all commands still pass.
- If option C: `package.json` has a single dep bump; same verification.
- If option D: Next.js / Turbopack config change ONLY with explicit STOP & ASK approval; same verification.
- `npm run dev` runs (warning either gone or documented as known).
- `npm run build` → passes.
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0/0 (Task 295 baseline preserved).
- `npx vitest run` → no new failures.
- `npm run governance:tailwind` → C0/H0/M0.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · vitest=passes · governance:tailwind=C0/H0/M0 · option=<A/B/C/D> · warning <gone | documented> · src diff=empty · scope=clean · PASS`.

## Out of scope

- Any other dev-console warning (this task is laser-focused on `import-in-the-middle`).
- Any other dep bump.
- Turbopack-to-webpack migration.
- Next.js version bump.
- Any change to `next.config.*` beyond the specific warning suppression (and only with owner approval).
- Admin UX / i18n / responsive work.
- New monitoring / telemetry deps.

## Final report required

1. Files Changed table.
2. Verbatim warning + `npm ls` output.
3. Build / test / lint / vitest status.
4. Recommendation chosen + rationale.
5. (If B/C) before/after `package.json` diff + verification commands.
6. AC-by-AC self-audit table.
7. Confirmation no `src/` / `messages/` / `scripts/` file edited.
8. Confirmation no other dep bump performed.

Do NOT emit git commands. Do NOT run git. Do NOT bump any package without STOP & ASK approval. Document-only (option A) is the safe default.
