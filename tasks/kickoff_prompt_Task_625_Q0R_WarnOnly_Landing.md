# Task 625 — Land Q0R Mantine-only CI scope + Task 624 locale fixes as one clean commit; locale-leak gate is warn-only during migration

- **Task number:** 625
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`)
- **Sprint:** 45 (Mantine-migration governance tail)
- **Parents / consolidates:** Task Q0R (`tasks/kickoff_prompt_Task_Q0R_MantineOnlyCIScope.md`, reviewed APPROVED WITH NOTES) and Task 624 (`tasks/kickoff_prompt_Task_624_LocaleLeak_MantineAllowlist.md`, reviewed NEEDS REVISION — only because it could not be committed in isolation from Q0R).

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **CI / governance infrastructure + i18n content.** High blast radius (changes what blocks every PR), low product-code surface.
- QA profile: **Q0 Docs/Governance + mandatory planted-violation gate proof** (agent-contract clause 13), same profile Q0R used.

## Why this task exists (verified context — read first)

Q0R and 624 are already implemented in the working tree, but they are **entangled in the same uncommitted files** and cannot be committed separately:

- `scripts/check-locale-leak.mjs` contains BOTH Q0R's `--mantine-only` scope machinery AND 624's allowlist blocks.
- `check-locale-leak.mjs` imports `scripts/lib/mantine-story-scope.mjs`, which is **untracked** (Q0R).
- The npm script `check:locale-leak:mantine-only` (used by 624's proof) lives only in the uncommitted `package.json` (Q0R).
- HEAD has none of this: `git show HEAD:scripts/check-locale-leak.mjs | grep -c mantine-only` → 0.

Two Q0R blockers are now resolved by current reality:

1. **`FooterView` now exists.** `src/components/layout/FooterView.tsx` and `src/stories/mantine/primitives/FooterView.stories.tsx` (title `Mantine/Primitives/FooterView`) landed in commit `7bc4550b9`, after Q0R was written. The story statically imports the component (verified). The Q0R manifest can now be completed to the full six.
2. **The 97/107 pre-existing leaks are cleared.** Task 624 drove `check:locale-leak:mantine-only` to **0 leaks / exit 0** (owner native run, 2026-07-19).

**Owner directive (2026-07-19):** the locale-leak gate must be **warn-only during migration** — it still runs and reports, but must not block a PR. Rationale: while legacy→Mantine story migration is active, newly migrated stories will keep surfacing loanword/fixture leaks; the owner does not want that churn to block merges. The gate passes today (0 leaks); this change is forward-looking, so future migration churn warns instead of blocking.

## Objective

Commit Q0R + 624 as **one coherent landing**, with the locale-leak CI job made **non-blocking (warn-only)**, the migration manifest completed to six components, and every gate still proven to detect a planted violation.

## Scope

1. **Warn-only wiring (R1).** In `.github/workflows/governance-pr.yml`, make the `Locale leak detection` step non-blocking by adding `continue-on-error: true` to that step, with a comment referencing this task and stating it is a migration-window policy to be reverted when migration completes. Keep the existing `Upload leak report` (`if: always()`) step so the report is still produced. Do **not** change the script's own exit code and do **not** touch `check:locale-leak:mantine-only`'s definition — the detector stays honestly strict for local/native runs; only the CI job is non-blocking.
2. **Complete the manifest (R2).** Add `src/components/layout/FooterView.tsx` as the 6th entry in `scripts/mantine-migration-scope.json`. Verify a canonical Mantine story statically imports it (it does: `FooterView.stories.tsx`). Coverage gate must still pass (now 6/6).
3. **Preserve all Q0R script/module work as-is (R3).** The shared scope module, `--mantine-only` scoping, the coverage-gate rewrite, the truthful banners, and both empty-set hard errors are reviewed-sound — do not modify them.
4. **Carry 624's content unchanged (R4).** The `LEAK_ALLOWLIST`/`PER_STORY_TOKENS` blocks in `check-locale-leak.mjs`, the 3 `messages/it.json` value fixes (`nav.home`/`app_shell_nav_home`→"Homepage", `badge_info`→"Informazioni"), and the 3 story fixes (PasswordInput, FilterControls, Table) are already in the tree and reviewed-correct — keep them.

## Out of scope

- The detector algorithm (`isEnglishish`, token-diff), the `--mantine-only` scope/prefixes, viewport/locale matrices, timeouts, sharding — all forbidden (Q0R Q9 still holds).
- Rendered-proof and coverage jobs stay **blocking** (unchanged). The warn-only directive applies to the locale-leak job only. Rationale: coverage failures are author-controlled (you enroll a component in the manifest when you migrate it), not churn-driven; rendered-proof's ambiguous cells are already non-failing. If the owner later wants those warn-only too, that is a separate task.
- Product components, `theme.ts`, styling — belong to other tasks.
- The old `scripts/story-coverage-exempt.json` — leave orphaned as Q0R did.

## Optional (recommended, non-blocking) — R5

Per the 624 review P2 finding: move `Studio`, `Penthouse`, `Max` (tokens that DO have real localized forms — it `Monolocale`/`Attico`, sq `Maks`) out of the global `LEAK_ALLOWLIST` into `PER_STORY_TOKENS`, scoped like `Gas`, so the (now warn-only) detector keeps an honest signal instead of globally masking a real future mistranslation. `Premium`/`Duplex` (genuine cognates in both sq+it) may stay global. If deferred, log it as a follow-up — do not let it block the landing.

## Requirements

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| R1 | `governance-pr.yml` locale-leak step is `continue-on-error: true`, commented as migration-window policy; report upload preserved | P0 | Workflow diff; the step no longer fails the job on a non-zero script exit |
| R2 | `mantine-migration-scope.json` has 6 entries incl. `src/components/layout/FooterView.tsx`; coverage passes 6/6 | P0 | `node scripts/check-story-coverage.mjs` → 6 covered, 0 missing, exit 0 |
| R3 | Q0R scope module, `--mantine-only`, coverage rewrite, banners, empty-set hard errors unchanged | P0 | Diff shows no edits to those regions beyond R2 |
| R4 | 624's allowlist blocks, 3 it.json fixes, 3 story fixes present and unchanged | P0 | Diff; `check:locale-leak:mantine-only` still 0 leaks |
| R5 | (Recommended) Studio/Penthouse/Max moved to per-story, or logged as a deferred follow-up | P3 | Diff or backlog note |
| R6 | Gate still detects a planted leak (prints + reports it) even though the CI step is now non-blocking | P0 | Planted-violation proof (below) |
| R7 | Whole change is committable as ONE commit; no file imports an untracked module; nothing else weakened | P0 | `git status` reconciliation; `npx tsc --noEmit` = 0 |

## Acceptance criteria

- `AC1` (R1) locale-leak CI step is warn-only; report still uploads; no other job weakened.
- `AC2` (R2) coverage gate passes 6/6 with FooterView enrolled.
- `AC3` (R4) `npm run build-storybook` then `npm run check:locale-leak:mantine-only` → 0 leaks, exit 0 (verbatim).
- `AC4` (R3/R4) i18n key parity 2203/2203 (`sq/en/uk/it`); `tsc --noEmit` = 0.
- `AC5` (R6) plant a raw English token into one `Mantine/Primitives/*` story, rebuild, confirm the detector **still names it** (script exits non-zero and the report lists it) — proving warn-only did not neuter detection, only its PR-blocking effect; restore, rebuild, confirm clean.
- `AC6` (R7) `git status` reconciles to exactly the Q0R + 624 + R1/R2 file set — no untracked-module import, no stray file.

## Verification plan (record actual output for each)

1. `node scripts/check-story-coverage.mjs` → 6/6, exit 0 (pre-build, no Storybook needed) — AC2.
2. `npm run build-storybook` → exit 0.
3. `npm run check:locale-leak:mantine-only` → 0 leaks, exit 0 (verbatim) — AC3.
4. `npm run check:i18n` → 2203/2203; `npx tsc --noEmit` → 0 — AC4.
5. Planted-violation round-trip (expression-child token, as in Q0R/624 to survive the static `check:stories` lint): fail naming exact story+locale+token, restore byte-identical, re-pass — AC5.
6. `npm run lint` (the check Q0R deferred) → record result.
7. `git status --short` reconciliation listing every intended path — AC6.

## Files expected to change (one commit)

New (currently untracked): `scripts/lib/mantine-story-scope.mjs`, `scripts/mantine-migration-scope.json`, `docs/sessions/2026-07-19-taskQ0R-mantine-only-ci-scope.md`, `docs/sessions/2026-07-19-task624-locale-leak-mantine-allowlist.md`, this kickoff, the new Task 625 session log.
Modified: `scripts/check-locale-leak.mjs`, `scripts/check-stories-rendered.mjs`, `scripts/check-story-coverage.mjs`, `package.json`, `.github/workflows/governance-pr.yml`, `docs/storybook-governance.md`, `messages/it.json`, `src/stories/mantine/primitives/{PasswordInput,FilterControls,Table}.stories.tsx`, `docs/backlog.md`.

## Completion report contract

Session log `docs/sessions/<date>-task625-q0r-624-warnonly-landing.md` + concise `docs/backlog.md` update (consolidate the separate Q0R and 624 lines into the landed state; keep ≤80 lines). Include: a Files Changed table matching the real diff; R1–R7 with evidence each; the verbatim 0-leak run; the planted-violation proof; confirmation warn-only affects only the locale-leak job; the lint result. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.
