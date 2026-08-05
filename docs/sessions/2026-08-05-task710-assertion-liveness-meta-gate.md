# Task 710 — Assertion-liveness meta-gate (Sprint 49, closes the sprint)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Kickoff: `tasks/Sprints/Sprint_49_kickoff_prompt_Task_710_Assertion_Liveness_Meta_Gate.md`. Branch
`task/q0-ci-rendered-locale-split`, pre-write HEAD `c55c7d183` (worktree clean at start, confirmed
via `git status --porcelain`).

---

## 1. Files changed

| Path | Change | Reason |
|---|---|---|
| `scripts/check-assertion-liveness.mjs` | **new** | The meta-gate itself — reads a manifest, classifies every boolean assertion key (shape-driven, A1) into `LIVE`/`DEAD-NEW`/`DEAD-KNOWN`/`STALE-ENTRY`. |
| `scripts/assertion-liveness-registry.json` | **new** | 2 entries (`fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`, scope `mantine-only`, `followUpTask: 711`). |
| `scripts/__tests__/rendered-gate-exit-code.test.ts` | **new** | R9 — structural test protecting `check-stories-rendered.mjs`'s `if (failed > 0)` → `process.exitCode = 1` path, with two planted-mutation arms. |
| `package.json` | +2 lines | `check:assertion-liveness` + `check:assertion-liveness:verify` scripts. |
| `.github/workflows/governance-pr.yml` | +7 lines | New step in the `rendered-proof` job, after `screenshots:assert -- --mantine-only`. |
| `docs/storybook-governance.md` | +88 lines | New §14.9.23 (the meta-gate, states, registry contract, root cause, unpiped-capture rule). |
| `.claude/skills/execute-task/SKILL.md` | +7 lines | R10 — new item 3a: capture every evidence transcript unpiped. |
| `docs/backlog.md` | net 0 lines (99→99) | State-only update: 710 → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **Already over the ~80-line target before this session (was 99); this session did not add net lines — flagging `BACKLOG LIMIT BREACH` per protocol, for Opus to consolidate.** |
| `docs/sessions/2026-08-05-task710-assertion-liveness-meta-gate.md` | **new** | This file. |

**Zero diff (verified, AC12):** `git status --porcelain` shows no entry for any path under `src/`,
no entry for `scripts/check-stories-rendered.mjs`, and no entry for any `*.stories.{ts,tsx}` file —
confirmed by the full changed/untracked-file listing above, not merely asserted.

---

## 2. Requirement IDs completed

| Req | AC | Verdict | Evidence |
|---|---|---|---|
| R1 | AC1 | ✅ | Classification is shape-driven (`check-assertion-liveness.mjs`'s `classifyAssertions`); source has no hardcoded key list (grepped, §5 below); synthetic-key proof in §5. |
| R2 | AC2 | ✅ | DEAD-NEW plant → exit 1, `.screenshots/task710-evidence/i4-verify-gate.log`. |
| R3 | AC3 | ✅ | Real manifest + real registry → 2 DEAD-KNOWN, both naming Task 711, exit 0. `.screenshots/task710-evidence/i3-real-manifest-run.log`. |
| R4 | AC4 | ✅ | STALE-ENTRY plant → exit 1, names the entry to delete. `.screenshots/task710-evidence/i4-verify-gate.log`. |
| R5 | AC5 | ✅ | Real manifest → exactly 3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY, exit 0. |
| R6 | AC6 | ✅ | `npm run check:assertion-liveness:verify` — negative arm + 3 planted arms, each matched on exit code AND specific diagnostic, overall exit 0. `.screenshots/task710-evidence/i7-npm-run-check-assertion-liveness-verify.log`. |
| R7 | AC7 | ✅ | `package.json` (2 scripts) + `governance-pr.yml` (new step after `screenshots:assert`) diffs quoted in §6. No task number in any script/CI-step name. |
| R8 | AC8 | ✅ | 4 degenerate inputs, 4 distinct messages, all exit 2. `.screenshots/task710-evidence/i5-degenerate-*.log`. |
| R9 | AC9 | ✅ | `npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts` — 3/3 pass (real file passes; both mutated-copy arms fail with the expected message). `.screenshots/task710-evidence/i5-r9-vitest.log`. Real `check-stories-rendered.mjs` has zero diff. |
| R10 | AC10 | ✅ | `docs/storybook-governance.md` §14.9.23 + `.claude/skills/execute-task/SKILL.md` item 3a — both state the unpiped-capture rule, both cite Task 709's `EXIT_CODE=0`/4-genuine-FAILs incident. |
| R11 | AC11 | ✅ | §14.9.23 documents the 4 states, the registry contract (`followUpTask` obligation), the §3.2/root-cause explanation, and cross-references §14.9.9. |
| R12 | AC12 | ✅ | `git status --porcelain` (below) — no `src/`, no `check-stories-rendered.mjs`, no story file touched. |
| R13 | AC13 | ✅ | `npm run build` — exit 0. `.screenshots/task710-evidence/i7-build.log`. |
| R14 | AC14 | ✅ | §9 below — counting gates run last, real numbers recorded, after this log + the backlog row existed. |

---

## 3. Current versus required behavior

**Current (before this task):** `check-stories-rendered.mjs` writes 8 assertion keys per cell; 3
are objects, 5 are booleans. Every consumer of a boolean key tests only `=== false`
(`isTransientFailure`, `hardPass`). Two of the five booleans
(`fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`) are `null` in **all 1184 cells** of the
CI-blocking `--mantine-only` matrix — their shadcn `data-slot` selectors never match Mantine DOM —
and have been since the migration, unnoticed, exactly as Task 573's assertion died unnoticed for
~5 weeks. Nothing detects a `null`-everywhere assertion. `check-stories-rendered.mjs`'s own
non-zero exit path was undocumented as a protected invariant; Task 709 captured `EXIT_CODE=0`
beside 4 genuine FAILs via a piped command.

**Required after (implemented):** `scripts/check-assertion-liveness.mjs` reads the persisted
manifest a `screenshots:assert` run produces and classifies every boolean assertion key into
`LIVE`/`DEAD-NEW`/`DEAD-KNOWN`/`STALE-ENTRY`, shape-driven. A newly-dead assertion (`DEAD-NEW`)
fails CI. The two currently-dead assertions are registered (`DEAD-KNOWN`) against Task 711 and
reported loudly every run, non-blocking. A registry entry whose assertion has come back to life
(`STALE-ENTRY`) fails CI, naming the entry to delete — the registry can never rot into a silent
allowlist. `scripts/__tests__/rendered-gate-exit-code.test.ts` structurally protects
`check-stories-rendered.mjs`'s own `process.exitCode = 1` failure path. The unpiped-capture rule is
now written where executors read it.

**Applicable negative flows** (from kickoff §11 — all "Yes" rows implemented and evidenced above):
new dead assertion (R2) · known dead assertion stays dead (R3) · registered assertion resurrects
(R4) · new boolean assertion added upstream, classified automatically (A1/AC1) · new object
assertion added upstream, skipped automatically (A1/AC1) · zero-cell / no-`matrix` / unparseable /
missing manifest (R8) · sweep's non-zero exit path removed (R9) · manifest from a different scope
(A3 — registry entry applies only to its named scope; not independently re-tested with a second
scope value beyond the fixture-scope arms, since A3 is a key-shape property already exercised by
every fixture using `scope: "fixture-scope"` against a `mantine-only`-scoped registry entry with no
match). Locale expansion / small-viewport / RLS: correctly N/A — this gate reads a manifest, never
renders or touches data.

---

## 4. My own reproduction of §3.1's distribution table

Read `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json` (1184 cells) by direct
enumeration, persisted at `.screenshots/task710-evidence/i1-distribution-table.txt`:

| Assertion key | Present in | Value distribution | Live? |
|---|---:|---|---|
| `renderCheck` | 1184 | object ×1184 | n/a — object |
| `styleIntegrity` | 1184 | object ×1184 | n/a — object |
| `visualIntegrity` | 1184 | object ×1184 | n/a — object |
| `noHorizontalOverflow` | 1184 | `true` ×1184 | ✅ live |
| `fullWidthControlsAtMobile` | 1184 | `true` ×852 · `null` ×332 | ✅ live |
| `heroSearchWrapInBand` | 1184 | `true` ×4 · `null` ×1180 | ✅ live |
| `fullWidthButtonsAtMobile` | 1184 | `null` ×1184 | ⛔ dead |
| `popupBottomSheetAtMobile` | 1184 | `null` ×1184 | ⛔ dead |

**Matches §3.1 exactly — no discrepancy, kickoff baseline still valid.**

---

## 5. The four states with the real counts, and the registry file in full

Real manifest run (`.screenshots/task710-evidence/i3-real-manifest-run.log`):
`Results: 3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY`, `EXIT_CODE=0`. The 3 LIVE keys:
`fullWidthControlsAtMobile`, `heroSearchWrapInBand`, `noHorizontalOverflow`.

**Shape-driven proof (AC1)** — `grep` for every real assertion key name in the classifier source
returns matches only inside doc-comment prose (lines 11/29-30), never inside executable code — no
hardcoded key list exists. A synthetic manifest
(`.screenshots/task710-evidence/fixtures/synthetic-shape-proof.json`) containing
`myBrandNewBooleanAssertion` (boolean, never named by the script) and `myBrandNewObjectAssertion`
(object, never named by the script) was run standalone
(`.screenshots/task710-evidence/i2-ac1-synthetic-shape-proof.log`): the boolean key is classified
`LIVE`; the object key does not appear in the report at all — skipped by shape.

**Registry file in full** (`scripts/assertion-liveness-registry.json`):

```json
{
  "$schema-note": "One entry per (scope, assertion). An entry is a TRACKED DEAD GATE, not an exemption. check-assertion-liveness.mjs fails the build (STALE-ENTRY) if an entry's assertion resolves true/false in any cell of its named scope again.",
  "entries": [
    {
      "scope": "mantine-only",
      "assertion": "fullWidthButtonsAtMobile",
      "followUpTask": 711,
      "deadSince": "2026-08-05",
      "reason": "Selector `[data-slot=\"button\"]` (check-stories-rendered.mjs:1161) is a shadcn convention emitted only by src/components/ui/*; Mantine-scope stories render no data-slot, so checkedAny is never true. Same root cause as governance §14.9.9's PORTAL_SELECTOR defect."
    },
    {
      "scope": "mantine-only",
      "assertion": "popupBottomSheetAtMobile",
      "followUpTask": 711,
      "deadSince": "2026-08-05",
      "reason": "Six candidate selectors (check-stories-rendered.mjs:1185-1192), all `data-slot` names, are a shadcn convention emitted only by src/components/ui/*; Mantine-scope stories render no data-slot, so checkedAny is never true. Same root cause as governance §14.9.9's PORTAL_SELECTOR defect."
    }
  ]
}
```

---

## 6. All four degenerate-input transcripts, and the `--verify-gate` transcript

| Case | Command | Result | Transcript |
|---|---|---|---|
| missing-file | `--manifest .../does-not-exist.json` | `❌ BAD INPUT [missing-file]: Manifest not found: …` — `EXIT_CODE=2` | `.screenshots/task710-evidence/i5-degenerate-missing-file.log` |
| zero-cells | `--manifest .../zero-cells.json` (`matrix: []`) | `❌ BAD INPUT [zero-cells]: … empty (0 cells) …` — `EXIT_CODE=2` | `.screenshots/task710-evidence/i5-degenerate-zero-cells.log` |
| no-matrix | `--manifest .../no-matrix.json` (no `matrix` key) | `❌ BAD INPUT [no-matrix]: … has no "matrix" array …` — `EXIT_CODE=2` | `.screenshots/task710-evidence/i5-degenerate-no-matrix.log` |
| unparseable | `--manifest .../unparseable.json` (`{ this is not valid JSON ,,,`) | `❌ BAD INPUT [unparseable]: … not valid JSON …` — `EXIT_CODE=2` | `.screenshots/task710-evidence/i5-degenerate-unparseable.log` |

All four messages are textually distinct (`[missing-file]` / `[zero-cells]` / `[no-matrix]` /
`[unparseable]`), all exit 2 — never a silent green on degenerate input.

**`npm run check:assertion-liveness:verify`** (`.screenshots/task710-evidence/i7-npm-run-check-assertion-liveness-verify.log`,
also standalone at `.screenshots/task710-evidence/i4-verify-gate.log`): negative arm (latest real
manifest + real registry) → exit 0, `PASS`; `DEAD-NEW` plant → exit 1, message matches
`/DEAD-NEW\s+neverTrueAssertion/`; `STALE-ENTRY` plant → exit 1, message matches
`/STALE-ENTRY\s+resurrectedAssertion/`; `BAD-INPUT` plant (nonexistent manifest path) → exit 2,
message matches `/BAD INPUT \[missing-file\]/`. **Overall `EXIT_CODE=0`** (all four arms behaved as
expected).

---

## 7. R9's test — both arms

`npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts` —
`.screenshots/task710-evidence/i5-r9-vitest.log`, **3/3 pass, `EXIT_CODE=0`**:

1. **Real file passes:** `check-stories-rendered.mjs`'s `if (failed > 0) { … }` branch (bracket-
   counted, not line-numbered, so it survives reformatting) still contains `process.exitCode = 1`,
   and no line anywhere in the file resets it (`exitCode = 0` / `process.exit(0)`) — both greps
   return zero matches on the real file.
2. **Planted violation A (drop):** a temp copy with the exact `process.exitCode = 1;` statement
   inside that branch replaced by a block comment (`/* PLANTED REMOVAL — Task 710 R9 */`, anchored
   on the unique preceding "Task 418 REWORK (P1-a)" comment so the mutation targets the ONE correct
   occurrence among four textually-identical `process.exitCode = 1;\n return;` sites in the file) →
   the assertion throws `"the "if (failed > 0)" branch no longer sets process.exitCode = 1 …"`.
3. **Planted violation B (reset):** a temp copy with `process.exitCode = 0; // PLANTED RESET` appended
   at end-of-file → the assertion throws `"found a process.exitCode = 0 …"`.

Both mutations are written to a `mkdtempSync` temp directory (never the real file) and cleaned up
in a `finally`. `git status --porcelain` after this test suite ran shows zero diff on
`scripts/check-stories-rendered.mjs`.

---

## 8. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (pre-write) | empty | this log, §1 |
| 2 | Reproduce §3.1 from the real manifest (I1) | matches exactly | `.screenshots/task710-evidence/i1-distribution-table.txt` |
| 3 | `node scripts/check-assertion-liveness.mjs --manifest <real>` | 3 LIVE/2 DEAD-KNOWN/0/0, `EXIT_CODE=0` | `i3-real-manifest-run.log` |
| 4 | Same, default manifest discovery (no `--manifest`) | identical result, resolves the same file | `i3-default-discovery-run.log` |
| 5 | `--verify-gate` (direct) | 4/4 arms correct, `EXIT_CODE=0` | `i4-verify-gate.log` |
| 6 | 4 degenerate-input runs | 4 distinct messages, `EXIT_CODE=2` each | `i5-degenerate-*.log` |
| 7 | AC1 synthetic-shape fixture | boolean classified LIVE, object skipped | `i2-ac1-synthetic-shape-proof.log` |
| 8 | DEAD-KNOWN / STALE-ENTRY fixtures (standalone, file-based) | DEAD-KNOWN exit 0, STALE-ENTRY exit 1 | `i2-fixture-dead-known-standalone.log`, `i2-fixture-stale-entry-standalone.log` |
| 9 | `npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts` | 3/3 pass, `EXIT_CODE=0` | `i5-r9-vitest.log` |
| 10 | `git diff` — `src/`, `check-stories-rendered.mjs`, stories | empty (verified via full `git status --porcelain`) | §1 |
| 11 | `npm run check:assertion-liveness` (npm script) | 3/2/0/0, `EXIT_CODE=0` | `i7-npm-run-check-assertion-liveness.log` |
| 12 | `npm run check:assertion-liveness:verify` (npm script) | all 4 arms correct, `EXIT_CODE=0` | `i7-npm-run-check-assertion-liveness-verify.log` |
| 13 | `npm run check:stories` | 127 files, 0 violations, `EXIT_CODE=0` | `i7-check-stories.log` |
| 14 | `npm run check:design-tokens` | 0 violations (not the kickoff's stale 23 — reported as observed, not assumed) | `i7-check-design-tokens.log` |
| 15 | `npx tsc --noEmit` | 0 errors, `EXIT_CODE=0` | `i7-tsc.log` |
| 16 | **`npm run build`** | **`EXIT_CODE=0`** | `i7-build.log` |
| 17 | `check:file-integrity` / `check:mojibake` — **last** | see §9 | `i9-file-integrity.log`, `i9-mojibake.log` |

---

## 9. Counting gates (run last)

Run **after** this session log and the `docs/backlog.md` update both existed, per N6/§10.8.
**Real, actual numbers** (`.screenshots/task710-evidence/i9-file-integrity.log`,
`.screenshots/task710-evidence/i9-mojibake.log`):

- `npm run check:file-integrity` — scope: git-changed + untracked (default). **Checked 9 file(s)**
  (NUL bytes · BOM · JSON parse · `node --check` · truncation). **PASSED — all 9 file(s) clean.**
  `EXIT_CODE=0`.
- `npm run check:mojibake` — scanned **2060** text file(s) under `docs/ src/ app/ components/
  modules/ messages/ tasks/ scripts/` + root `*.md`. **0 artifacts in 2060 files.** `EXIT_CODE=0`.

Reconciled against §1's Files Changed table: the 9 files `check:file-integrity` scoped to are
exactly this session's tracked-modified + untracked-new set (5 modified + 4 new: the gate script,
the registry, the R9 test, this session log — `docs/backlog.md`'s edit is the 5th modified file).
The mojibake count (2060) is 5 higher than the 709-R session's 2055, consistent with the 5 new
text files this session adds (4 new + this log itself, since mojibake scans `scripts/` and `docs/`
in full, tracked and untracked-not-ignored).

---

## 10. The A3 limitation, stated plainly

**Full-matrix liveness of `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` is UNMEASURED.**
Every measurement in this task — §3.1's baseline, the registry's 2 entries — is against the
`--mantine-only` CI-blocking matrix only. The two assertions' selectors are shadcn `data-slot`
conventions; the FULL (non-Mantine) matrix DOES render `data-slot` on shadcn stories, so those
same assertions may well be LIVE there. That sweep was not run (kickoff explicitly rejects it —
§5.3, out of budget, and CI only ever runs `--mantine-only` per §14.9.5). The registry entries are
therefore correctly scoped to `"scope": "mantine-only"` and make no claim beyond it — a future full
sweep would need its own registry entries (or none, if the assertions turn out live there).

---

## 11. Standing findings not acted on

- **Task 711** (re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM)
  — this task's entire purpose was to TRACK these two dead assertions, not fix them. Needs its own
  sprint per the backlog (open 51 or fold into 50) before its kickoff.
- **Task 677** (pre-existing `<div>`-in-`<p>` hydration warning in the FiltersPanel drawer) —
  unrelated to this task, not re-triaged, not touched.
- **`LocationComboboxSubPanel` blank-canvas capture flake** — a known, pre-existing, documented
  capture-flake pattern (§8.1 story list), not re-triaged as a defect, not touched by this task.

---

## 12. Assumptions, deviations, limitations, unresolved issues

- **Manifest scope is supplied by the caller, not self-reported by the manifest.** The manifest
  JSON itself carries no `"scope"` field; `--scope` defaults to `"mantine-only"` since that is the
  only scope CI ever produces and the only scope this task measured (A3). A future full-matrix run
  would need `--scope <name>` passed explicitly with its own registry entries.
- **Default `--manifest` discovery is "latest directory under `.screenshots/rendered-assert/`
  by lexicographic sort."** Directory names are `YYYY-MM-DDTHH-MM`, so string sort is chronological
  sort — verified this resolves to the correct, most-recent run both via direct enumeration and via
  the CI-wiring design (a fresh checkout's `.screenshots/` contains only the run
  `screenshots:assert -- --mantine-only` just produced).
- **AC1's "no hardcoded key list" was verified by `grep`,** not by a stronger static-analysis
  guarantee — a future edit that reintroduces a name-based branch would not be caught by any gate
  beyond this task's own synthetic-key regression fixture (`fixtures/synthetic-shape-proof.json`),
  which is not itself wired into a persistent CI assertion (the fixture and its log are local
  evidence, not a committed test). If this needs its own standing regression test, that is a
  candidate follow-up, not raised as a numbered task here.
- **`BACKLOG LIMIT BREACH`:** `docs/backlog.md` was already at 99 lines (against the ~80-line
  target) before this session touched it. This session's edits are net-0 lines (99 → 99) — I did
  not add history or grow the file — but I could not bring it under target either. Flagging for
  Opus to validate and consolidate during review, per protocol.
- No other deviations from the kickoff. All 14 requirements (R1–R14) are evidenced above with
  their AC verdicts.

---

## 13. Opus handoff

**Evidence root:** `.screenshots/task710-evidence/` (local-only, gitignored per D6) — every
transcript and fixture named in §6/§7/§8 lives there, plus:
`i1-distribution-table.txt`, `fixtures/*.json` (7 fixtures: `dead-new.json`, `dead-known.json`,
`stale-entry.json`, `registry-stale-entry.json`, `zero-cells.json`, `no-matrix.json`,
`unparseable.json`, `synthetic-shape-proof.json` — 8 files, since `stale-entry.json` needed its own
registry fixture).

**Questions/risks for review:**
1. Confirm the `if (failed > 0)` bracket-counting extraction in the R9 test is robust to a future
   reformat of `check-stories-rendered.mjs` that changes the branch's opening text — the test would
   then fail LOUD (its own `throw` on "could not find … in source"), not silently pass, but worth an
   independent read.
2. Confirm the CI step ordering (`screenshots:assert -- --mantine-only` → `check:assertion-liveness`
   → upload-artifact) is correct in `governance-pr.yml` — the new step reads the manifest the
   preceding step just wrote, with no explicit path threading between steps (relies on default
   discovery, §"Assumptions" above).
3. `docs/backlog.md`'s pre-existing `BACKLOG LIMIT BREACH` (99 lines) needs Opus consolidation —
   not introduced by this session, but not fixed by it either.

