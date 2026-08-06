# Session: Task 625 — Land Q0R + 624 as one commit, locale-leak gate warn-only during migration — 2026-07-19

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Task: `tasks/kickoff_prompt_Task_625_Q0R_WarnOnly_Landing.md`

## Requirement ledger (from the kickoff)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R1 | `governance-pr.yml` locale-leak step is `continue-on-error: true`, commented as migration-window policy; report upload preserved | ✅ VERIFIED | Diff below — `continue-on-error: true` added with comment; `Upload leak report` `if: always()` step untouched |
| R2 | `mantine-migration-scope.json` has 6 entries incl. `FooterView.tsx`; coverage passes 6/6 | ✅ VERIFIED | `node scripts/check-story-coverage.mjs` → "✅ 6 covered ... 0 missing", exit 0 |
| R3 | Q0R scope module, `--mantine-only`, coverage rewrite, banners, empty-set hard errors unchanged | ✅ VERIFIED | This session touched none of `scripts/check-locale-leak.mjs`, `scripts/check-stories-rendered.mjs`, `scripts/check-story-coverage.mjs`, `scripts/lib/mantine-story-scope.mjs` — `git diff` on those files is Q0R's original diff, untouched by this session |
| R4 | 624's allowlist blocks, 3 it.json fixes, 3 story fixes present and unchanged | ✅ VERIFIED | Not touched this session (see diffs in Validation evidence); confirmed present via `git diff` |
| R5 | (Recommended) Studio/Penthouse/Max moved to per-story, or logged as deferred follow-up | ⏸️ DEFERRED | Logged as follow-up in Backlog update below — not blocking per kickoff's own text |
| R6 | Gate still detects a planted leak even though the CI step is non-blocking | ✅ VERIFIED | Planted-violation round-trip below — 3 leaks named exact story+locale+token, exit path confirmed, restored byte-identical, re-verified 0 leaks |
| R7 | Whole change committable as ONE commit; no file imports an untracked module; nothing else weakened | ✅ VERIFIED | `git status --short` reconciliation below; `npx tsc --noEmit` → 0 errors |

## Current behavior to preserve / required after behavior

Current (start of session): Q0R + 624 fully implemented in the working tree but entangled — `governance-pr.yml`'s
`locale-leak` job step was still hard-blocking (no `continue-on-error`); `scripts/mantine-migration-scope.json`
had 5 of 6 intended entries (`FooterView` missing — its component/story did not exist when Q0R was written).
`check:locale-leak:mantine-only` already passed 0 leaks/exit 0 (Task 624's work).

Required after: `locale-leak` CI step non-blocking (`continue-on-error: true`) while still running, reporting,
and uploading its artifact; manifest at 6/6; Q0R's script/module work and 624's allowlist/i18n/story fixes carried
forward unchanged; gate still proven to catch a real violation.

**Applicability table (negative flows):**

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Empty canonical Mantine set | No (out of scope — Q9/R3, untouched) | Hard error, exit 1, both scripts | Not re-tested this session (no code changed in that path) |
| Planted locale-leak violation | Yes | Detector still names story+locale+token, exits non-zero | Round-trip below |
| CI step failure with `continue-on-error: true` | Yes | Step shows failed/warning in Actions UI but does not fail the overall required check | Cannot be observed outside a real GitHub Actions run; YAML semantics of `continue-on-error` verified against GitHub Actions docs behavior (job continues, `job.status` unaffected by this step) |
| Manifest entry with no covering story | No (out of scope — not touched, Q0R already proved this path) | FAIL, exit 1 | Not re-tested (R3 preservation, no code changed) |

## Files Changed

| File | Rationale |
|---|---|
| `.github/workflows/governance-pr.yml` | R1 — added `continue-on-error: true` + explanatory comment to the `locale-leak` job's detection step only; `rendered-proof` and `Upload leak report` (`if: always()`) steps untouched |
| `scripts/mantine-migration-scope.json` | R2 — added `src/components/layout/FooterView.tsx` as the 6th entry, completing the manifest now that its component and canonical story exist (landed in `7bc4550b9`, after Q0R was written) |
| `docs/storybook-governance.md` | New `§14.9.22` documenting the warn-only CI policy and the manifest completion (governance-doc accuracy, not scope creep — the shipped CI behavior changed) |
| `docs/backlog.md` | Consolidated Task Q0R + Task 624's separate "Open — needs action" bullets into one Task 625 entry reflecting the landed state; updated task-numbering line (`last used: 625`, `Next free: 626`) |

No other files were touched by this session. (`git status` also shows Q0R's and 624's own untouched diffs —
`scripts/check-locale-leak.mjs`, `scripts/check-stories-rendered.mjs`, `scripts/check-story-coverage.mjs`,
`scripts/lib/`, `messages/it.json`, `package.json`, the three story fixture files, and the two prior session
logs/kickoff — all pre-existing from Q0R/624, carried forward unchanged per R3/R4, not re-authored by this task.)

## Validation evidence

**1. `node scripts/check-story-coverage.mjs`** (R2/AC2):
```
📖  check:story-coverage — pre-build, source-parsed (Task Q0R manifest gate)
    Canonical Mantine story files: 60 (of 115 total *.stories.tsx; prefixes: Mantine/Primitives/, Patterns/Mantine/)
    Manifest entries (migration scope): 6
    ✅ 6 covered (statically imported by ≥1 canonical Mantine story)
    ❌ 0 enrolled but unproven (no canonical Mantine story imports them)

✅  check:story-coverage PASSED — every manifest-enrolled component has a canonical Mantine story import.
```

**2. `npm run build-storybook`** → exit 0, "Storybook build completed successfully" (run 3× this session: baseline,
post-plant, post-restore).

**3. `npm run check:locale-leak:mantine-only`** (AC3, verbatim, post-restore final run):
```
🔍  Locale leak detector — full mode (mantine-only)
Mantine selected: 60; non-Mantine excluded: 236
    Stories: 60 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 3
    Output: .screenshots/locale-leak/2026-07-19T12-10/

✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
    Report: .screenshots/locale-leak/2026-07-19T12-10/report.json
```
(An earlier baseline run at `.screenshots/locale-leak/2026-07-19T11-48/` — before the plant — also showed the
identical ZERO-leak result across 60 stories.)

**4. `npm run check:i18n`** (AC4) → `✅ Parity PASSED — all 4 locale files have identical key sets (2203 keys)`
(en/uk/it all 2203, matching sq). Re-confirmed after restore.

**5. `npx tsc --noEmit`** → 0 errors (silent exit). Re-confirmed after restore.

**6. Planted-violation round-trip (R6/AC5).** Planted `{'PlantedLeakViolationTask625'}` as a JSX expression-child
`<Text>` (not a plain literal — survives the static `check:stories` hardcode lint, same technique Q0R/624 used)
into `src/stories/mantine/primitives/Badge.stories.tsx`. Rebuilt Storybook (exit 0, lint did not flag the
expression-child form). Ran `node scripts/check-locale-leak.mjs --mantine-only --fast`:
```
🔍  Locale leak detector — fast mode (mantine-only)
Mantine selected: 60; non-Mantine excluded: 236
    Stories: 60 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 1

❌  Locale leak detector: 3 leak(s) found:

  Story: Mantine/Primitives/Badge/Default
    [sq] "PlantedLeakViolationTask625"
    [uk] "PlantedLeakViolationTask625"
    [it] "PlantedLeakViolationTask625"

    Report: .screenshots/locale-leak/2026-07-19T12-04/report.json
```
The detector's own process exits non-zero on this result (`process.exit(1)` in `check-locale-leak.mjs`'s leak
branch — confirmed by reading the script; the pipeline's reported "exit 0" reflects the `tail` pipe stage, not
the node process). This proves the CI step's new `continue-on-error: true` affects only whether the job is
marked failed — the detector's own detection and exit-code behavior are completely unaffected, exactly as R1
requires ("do not change the script's own exit code").

Restored `Badge.stories.tsx` (`git diff --stat -- src/stories/mantine/primitives/Badge.stories.tsx` → no output,
byte-identical to HEAD). Rebuilt Storybook (exit 0) and re-ran the full-mode detector — see evidence #3 above
(ZERO leaks, exit 0/success).

**7. File integrity** — `npm run check:file-integrity`:
```
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 16 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 16 file(s) clean
```

**8. `npm run lint`** (the check Q0R deferred, run this session per the verification plan): 47 problems (17
errors, 30 warnings), **all pre-existing and unrelated to this diff** — `storybook/no-renderer-packages` errors
in `Alert/Avatar/Badge/Card/Notification/Pagination/Progress/RangeDatePicker/ScrollArea/SegmentedControl/
Separator/Skeleton/Slider/Tabs.stories.tsx` (importing `@storybook/react` directly, a pre-existing SB10-migration
gap unrelated to this task), one empty-interface error in `MantineSelect.tsx`, one `@ts-ignore`/`@ts-expect-error`
error and unused-var warnings in test files, and an unescaped-entity error in `RangeDatePicker.stories.tsx`. None
of these files are in this task's scope (`check-locale-leak.mjs`, `check-stories-rendered.mjs`,
`check-story-coverage.mjs`, `package.json`, `governance-pr.yml`, `mantine-migration-scope.json`,
`docs/storybook-governance.md`, `messages/it.json`, `PasswordInput/FilterControls/Table.stories.tsx`, `Badge.stories.tsx`
transient plant/restore) — confirmed by cross-referencing the lint error file list against this diff's touched
files (zero overlap). Not a regression introduced by this task; recommend a follow-up SB10-migration cleanup task.

**9. `git status --short` reconciliation (R7/AC6):**
```
 M .github/workflows/governance-pr.yml
 M docs/backlog.md
 M docs/storybook-governance.md
 M messages/it.json
 M package.json
 M scripts/check-locale-leak.mjs
 M scripts/check-stories-rendered.mjs
 M scripts/check-story-coverage.mjs
 M src/stories/mantine/primitives/FilterControls.stories.tsx
 M src/stories/mantine/primitives/PasswordInput.stories.tsx
 M src/stories/mantine/primitives/Table.stories.tsx
?? docs/sessions/2026-07-19-task624-locale-leak-mantine-allowlist.md
?? docs/sessions/2026-07-19-taskQ0R-mantine-only-ci-scope.md
?? scripts/lib/
?? scripts/mantine-migration-scope.json
?? tasks/kickoff_prompt_Task_Q0R_MantineOnlyCIScope.md
```
Plus this session's own new file, `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`. This is exactly
the Q0R + 624 + R1/R2 file set the kickoff's "Files expected to change" section names — no stray file, no file
importing an untracked module beyond the already-reviewed `scripts/lib/mantine-story-scope.mjs` (Q0R's own,
carried forward).

## Acceptance-criteria self-audit

| AC | Verified | Result |
|---|---|---|
| AC1 (R1) locale-leak CI step warn-only; report still uploads; no other job weakened | `governance-pr.yml` diff — `continue-on-error: true` added to only the detection step; `Upload leak report` (`if: always()`) untouched; `rendered-proof`/`governance`/`locale-leak`'s own build/checkout/install steps untouched | ✅ |
| AC2 (R2) coverage gate passes 6/6 with FooterView enrolled | Evidence #1 above | ✅ |
| AC3 (R4) `build-storybook` then `check:locale-leak:mantine-only` → 0 leaks, exit 0 verbatim | Evidence #2/#3 above | ✅ |
| AC4 (R3/R4) i18n parity 2203/2203; `tsc --noEmit` = 0 | Evidence #4/#5 above | ✅ |
| AC5 (R6) planted token still named by detector; restored byte-identical; re-verified clean | Evidence #6 above | ✅ |
| AC6 (R7) `git status` reconciles to exactly Q0R+624+R1/R2 file set | Evidence #9 above | ✅ |

## Self-validation verdict

`Self-validation: tsc=0 errors · build-storybook=passes (×3) · AC table=all green · i18n parity=2203/2203 · story-coverage=6/6 · locale-leak(full, post-restore)=0 leaks/exit 0 · planted-violation=3 leaks naming exact story+locale+token, restored to byte-identical + re-verified 0 leaks · integrity=PASS (16/16 files) · lint=47 pre-existing/unrelated problems (0 in this diff's scope) · scope=clean (git status matches expected file set)`

## Self-review findings

- No detector-algorithm, `--mantine-only` scope, coverage-rewrite, banner, or empty-set-hard-error code was
  touched this session — confirmed by this session not editing `scripts/check-locale-leak.mjs`,
  `scripts/check-stories-rendered.mjs`, `scripts/check-story-coverage.mjs`, or `scripts/lib/mantine-story-scope.mjs`
  at all (R3 preserved by construction, not merely by claim).
- `continue-on-error: true` was added to exactly one step (`Locale leak detection`), not to `rendered-proof`'s
  `Rendered-proof gate` step or `check:story-coverage`'s step in the `governance` job — confirmed by reading the
  full diff of `governance-pr.yml` before finalizing.
- R5 (moving `Studio`/`Penthouse`/`Max` to per-story allowlist) was deliberately deferred rather than touched
  under time pressure — the kickoff explicitly authorizes deferring it as a non-blocking follow-up, and touching
  `LEAK_ALLOWLIST`/`PER_STORY_TOKENS` was out of this session's minimal-diff intent for a "land the commit" task.

## Assumptions, deviations, and limitations

- R5 deferred, not implemented — logged as a follow-up in the Backlog update below, per the kickoff's own
  "if deferred, log it as a follow-up — do not let it block the landing" instruction.
- `continue-on-error: true`'s effect on the overall PR-required-check status can only be fully confirmed by a
  real GitHub Actions PR run (the sandbox cannot open a PR). The YAML semantics are well-documented GitHub
  Actions behavior (the step is allowed to fail without failing the job/check), and the detector's own
  independent exit-1 behavior was directly verified in this sandbox (evidence #6) — the CI-level effect itself is
  a well-known, non-custom GitHub Actions primitive, not new logic this task authored.
- `npm run lint`'s pre-existing 47 problems are unrelated to this diff (verified by file-scope cross-reference,
  evidence #8) but are still real repo debt; flagged, not silently ignored, per Q0R's own precedent of recording
  a deferred lint result rather than fabricating a clean run.

## Opus handoff — what to inspect

1. **`continue-on-error: true` placement** — confirm it is scoped to only the `locale-leak` job's detection step
   (not `rendered-proof` or the `governance` job's `check:story-coverage` step), per `governance-pr.yml` diff.
2. **R5 deferral** — confirm deferring `Studio`/`Penthouse`/`Max` per-story reclassification (rather than doing it
   in this landing commit) is acceptable, or request it be picked up as its own follow-up task.
3. **Backlog consolidation** — confirm the single Task 625 bullet replacing the separate Q0R/624 bullets in
   `docs/backlog.md` "Open — needs action" section captures the landed state accurately, and that task numbering
   (`last used: 625`, `Next free: 626`) is correct.
4. Everything else (R1–R4, R6–R7, all planted-violation proofs) is fully implemented and directly evidenced above.

## Backlog update

`docs/backlog.md` updated: Task Q0R's and Task 624's separate bullets consolidated into one Task 625 bullet under
"Open — needs action" (status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`); task-numbering line updated to
`last used: 625` / `Next free: 626`. Resulting file is 69 physical lines — within the ~80-line active-state limit,
no `BACKLOG LIMIT BREACH`. R5 (Studio/Penthouse/Max per-story reclassification) is noted inside the Task 625
bullet as a deferred, non-blocking follow-up rather than a separate backlog row.
