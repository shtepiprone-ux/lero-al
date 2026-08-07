# Task 726 — completed executable task contract

Companion artifact to `Sprint_53_kickoff_prompt_Task_726_ButtonGroupExclusion_And_ChipRowAria.md`.
Completed 2026-08-07 by the Opus orchestrator. Recompute every row after any revision.

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 726 — remove the author-appliable `[role="group"]` exclusion; restore a conditional **named** `role="group"` on the chip rows |
| Active route / owner decision | **probe → delete → re-measure → restore → ship the ARIA fix.** Single route, no elections |
| Decision source, date, scope | Owner review findings 2026-08-07: the permanent `Button.Group` story arm is rejected; use a reversible probe; one active route. Everything below beyond those findings is an **orchestrator correction based on the review findings**, not owner approval |
| Starting worktree mode | **dirty with manifest** — two classes, see kickoff §2.0 |
| Exact allowed final write set | `scripts/check-stories-rendered.mjs` · `src/components/shared/FilterMultiToggle.tsx` · `src/components/shared/FilterRoomsRow.tsx` · `src/components/shared/FiltersPanel.tsx` (only if a prop rename is required) · `src/modules/listings/components/ListingsFilters.tsx` · `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` · `docs/storybook-governance.md` · `docs/backlog.md` · `docs/sessions/2026-08-0X-task726-role-group-exclusion-and-chiprow-aria.md`. **`src/stories/mantine/primitives/Button.stories.tsx` is a probe surface and must NOT appear in the final write set.** |
| Blocked rule or decision, if any | **None outstanding.** The one precondition — removal of the agent-created `Button.Group` hunk — was satisfied by the owner 2026-08-07 and verified: probe path absent from `git status`, `git hash-object` == `HEAD` `a2279cd137a31643be9c883e9bebae3a405544ac`. Kickoff R1 still re-confirms at J1 and fails closed on reappearance |

## 2. Checkpoint matrix

| # | Preconditions and preserved inputs | Writes allowed | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | none | none | `Button.stories.tsx` absent from status; both Class-A skill hashes match; every Class-B hash recorded | `git status --porcelain`, `git hash-object` per entry → `K0-baseline.txt` | Probe path present in status, a Class-A hash mismatch, or a status path in neither class → **stop and report**, exit before any write. A Class-B difference is recorded, never a stop |
| 1 | ckpt 0 | `Button.stories.tsx` (probe) | probe applied: one existing Button narrowed + wrapped in `role="group"` | `git diff -- src/stories/mantine/primitives/Button.stories.tsx` → quoted in the session log | That path-scoped diff must contain only the probe; a global `git diff` proves nothing in a dirty worktree. Any other content → stop |
| 2 | ckpt 1, skip still present | none | `Button/Default` cells resolve **`true`** | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` → `K2-probe-before.log` | Cells read `false` → the probe is not being skipped (check the wrapper is an ancestor and N<3 so `isChipSetMember` cannot apply); fix the probe, do not proceed |
| 3 | ckpt 2 captured | `check-stories-rendered.mjs` | **exactly six deleted lines, zero added lines** — the one-line `:1238` selector plus the five-line `:1160-1164` comment paragraph; no substitute selector | `git diff -- scripts/check-stories-rendered.mjs` → `K3-gate-diff.txt` | Any added line at all, or a deleted-line count ≠ 6 → stop |
| 4 | ckpt 3 | none | same cells resolve **`false`**, planted button named | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` → `K4-probe-after.log` | Cells still `true` → deletion ineffective; **stop**, do not paper over |
| 5 | ckpt 4 captured | `Button.stories.tsx` (revert) | file equals `HEAD` and is absent from status | `git hash-object src/stories/mantine/primitives/Button.stories.tsx` and `git status --porcelain -- src/stories/mantine/primitives/Button.stories.tsx` → `K5-probe-restored.txt` | Hash ≠ `a2279cd137a31643be9c883e9bebae3a405544ac`, or the path-scoped status is non-empty → **stop**; no later verification runs against a polluted story file |
| 6 | ckpt 5 | the two leaf components + `ListingsFilters` (+ `FiltersPanel` if needed) | `role="group"` renders **only** with a name; 7 sites threaded | `git diff -- src/components/shared/FilterMultiToggle.tsx src/components/shared/FilterRoomsRow.tsx src/components/shared/FiltersPanel.tsx src/modules/listings/components/ListingsFilters.tsx` + the R6 site table | Any unconditional role, or any site without a name → stop |
| 7 | ckpt 6 | smoke test | 2 new arms green | `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` → `K7-smoke.log` | Non-zero exit → fix component or expectation, state which |
| 8 | ckpt 5 + 6 | none | **1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1**; `FAIL ⊆ {HeroSearch × 12, NotificationBellView/mobile-390 × 4}` | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` → `K8-final-matrix.log` | Any other count or any FAIL outside the set → **report as a regression**, never absorb into a new bound |
| 9 | ckpt 8 | `docs/storybook-governance.md` | §14.9.28 states the median sensitivity with verified arithmetic | the amended section | Example arithmetic disagrees with the shipped constants → recompute, do not quote |
| 10 | ckpt 9 | none | i18n parity, 0 errors, build exit 0 | `npm run check:i18n` → `K10-i18n.log`; `npx tsc --noEmit` → `K10-tsc.log`; `npm run build` → `K10-build.log`, each with `EXIT_CODE=` appended inside | Any non-zero → `PARTIALLY IMPLEMENTED` or `BLOCKED`; never `IMPLEMENTED` |
| 11 | ckpt 10 | session log, `docs/backlog.md` | both artifacts exist | the two files | — |
| 12 | ckpt 11, **genuinely last** | none | file-integrity count == `git status` entry count; mojibake 0 | `npm run check:file-integrity` → `K12-file-integrity.log`; `npm run check:mojibake` → `K12-mojibake.log` | Count mismatch → recount and reconcile; any later write to a tracked file invalidates this pass and requires a re-run |

**Dynamic-count formula (ckpt 12).** `file-integrity count == (git status --porcelain | wc -l)`. Both the non-empty
case (expected: the write set above, plus whichever Class-B design docs are still modified) and the **zero case** are valid: if the
executor's own write set were empty the gate must still exit 0 on 0 changed files, and that is not a missing
artifact. Every task-created file (`.screenshots/task726-evidence/*`) is `.gitignore`d (**D6**) and therefore never
enters this count; the session log and backlog are created at ckpt 11, i.e. **before** the ckpt-12 measurement.

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | `Button.stories.tsx` appears in the final diff | ckpt 5 comparator (`git hash-object` vs `HEAD`) + kickoff AC5 | blocked — the permanent-Storybook gate forbids it | `ANALYTICAL` — inspected `.claude/skills/create-task/SKILL.md` "Permanent Storybook story creation gate" and `execute-task/SKILL.md` start-gate item 6 |
| Stateful baseline / manifest | baseline missing; baseline valid but Class-B doc changed since design | ckpt 0 splits Class A (stop) from Class B (record only) — orchestrator correction based on the review findings | distinct, fail-closed outcomes | `ANALYTICAL` — the prior draft's single-class rule was proven wrong when three design docs the orchestrator itself edited went stale |
| Status or diff assertion | a pre-existing modified path silently changes | ckpt 0 records a `git hash-object` witness per entry; ckpt 12 re-reconciles | comparator rejects it | `ANALYTICAL` |
| New gate | the exclusion is deleted but nothing proves it mattered | ckpt 2 captures `true` **before** the delete; ckpt 4 requires `false` after | observed failure, then clean recovery via ckpt 5 + ckpt 8 | `ANALYTICAL` — the shape is executed precedent: Task 711 §8 ran the identical plant/restore cycle |
| Task-created artifact | evidence logs counted into the file-integrity total | `.screenshots/` is `.gitignore`d (**D6**); ckpt 12's formula reads `git status`, which excludes ignored paths | count/scope difference detected | `EXECUTED` — `git status --porcelain` during design listed only tracked/untracked non-ignored paths, with `.screenshots/task725-evidence/*` present on disk and absent from that list |

## 4. Publication and review gate

This contract does not itself approve the task. Both gating conditions are now met: the ckpt-0 precondition (the
agent-created `Button.Group` hunk removed) is satisfied and verified 2026-08-07, and the owner approved the
revision 2026-08-07 after a final document-only review. Task 726 is `KICKOFF FILED`. This contract governs
execution only; approval of the resulting *implementation* remains a separate Opus review after the executor's
handoff.
