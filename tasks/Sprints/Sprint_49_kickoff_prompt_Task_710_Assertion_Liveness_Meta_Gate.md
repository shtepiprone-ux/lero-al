# Task 710 — Meta-gate: an assertion that is `null` in every one of its target cells is a dead gate, not a pass

**Sprint:** 49 (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`). **Epic:** MM Phase-2.
**Depends on:** nothing. 708 and 709 + 709-R are committed (`16960dc77`, `c1f9461bc`); this task closes Sprint 49.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — new CI check** (`docs/rule-index.md` → Validation/QA tooling).
- **Secondary type:** none. **No `src/` change. No product code. No change to any existing gate's logic.**

> **Read this first.** You are not fixing any dead assertion. You are building the detector that makes a dead
> assertion impossible to ignore, and registering the two that are dead **right now** as tracked, task-numbered
> exceptions. Two of the eight assertions in the CI-blocking matrix are `null` in **all 1184 cells** today. Your
> gate must fail on a *new* death, report a *known* death loudly, and — this is the part that stops the registry
> rotting — fail when a registry entry is *stale* because its assertion came back to life.

---

## 2. Objective

1. Add `scripts/check-assertion-liveness.mjs` + `check:assertion-liveness`: read a persisted
   `manifest.json` and fail when any boolean assertion is non-committal (`null`/absent) across **every** cell in
   its scope.
2. Add `scripts/assertion-liveness-registry.json` recording the two currently-dead assertions with a follow-up
   task number, so the gate lands green while still failing on a new death.
3. Make a **stale** registry entry (assertion now alive) a hard failure, so the registry cannot become the
   allowlist that hides the next 573.
4. Add a `--verify-gate` self-test proving all three arms genuinely fail, per the house pattern.
5. Add a structural regression test that `check-stories-rendered.mjs` still exits non-zero when cells fail, and
   record the unpiped-capture rule that Task 709 violated.
6. Wire the gate into the `rendered-proof` CI job and document it in `docs/storybook-governance.md`.

**Non-goals, stated as objectives so they are not silently attempted:** do **not** re-anchor
`fullWidthButtonsAtMobile` or `popupBottomSheetAtMobile` onto Mantine selectors (that is **Task 711**); do **not**
edit `scripts/check-stories-rendered.mjs`'s assertion logic, selectors, `hardPass` expression, or exit path; do
**not** touch `src/`; do **not** change any story.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` at HEAD
`d0286fcd3` on **2026-08-05**, during the 709-R review. Nothing is inferred from a filename or a prior report.

### 3.1 The eight assertions and their real value distributions — measured, not assumed

Read from `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json` (the 709-R post-revert green run,
`--mantine-only`, **1184 cells**) by direct enumeration on 2026-08-05:

| Assertion key | Present in | Value distribution | Live? |
|---|---:|---|---|
| `renderCheck` | 1184 | object ×1184 | n/a — object, not a boolean |
| `styleIntegrity` | 1184 | object ×1184 | n/a — object |
| `visualIntegrity` | 1184 | object ×1184 | n/a — object |
| `noHorizontalOverflow` | 1184 | `true` ×1184 | ✅ live |
| `fullWidthControlsAtMobile` | 1184 | `true` ×852 · `null` ×332 | ✅ live |
| `heroSearchWrapInBand` | 1184 | `true` ×4 · `null` ×1180 | ✅ live (repaired by 708) |
| **`fullWidthButtonsAtMobile`** | 1184 | **`null` ×1184** | ⛔ **DEAD** |
| **`popupBottomSheetAtMobile`** | 1184 | **`null` ×1184** | ⛔ **DEAD** |

**The backlog understated this.** It listed the three `null`-by-default assertions as merely *sharing the shape*
of 573's failure. Two of them are actually dead right now, in the CI-blocking scope.

### 3.2 Why those two are dead — root cause traced to source, and it is a known recurring defect

- `fullWidthButtonsAtMobile` (`scripts/check-stories-rendered.mjs:1161`) discovers candidates with
  `document.querySelectorAll('[data-slot="button"]:not([data-icon-only])')`.
- `popupBottomSheetAtMobile` (`:1185-1192`) uses six selectors, **all** `data-slot`:
  `dialog-content` · `sheet-content` · `select-content` · `popover-content` · `dropdown-menu-content` ·
  `navigation-menu-popup`.
- `data-slot` is a **shadcn** convention. It is emitted only by `src/components/ui/*` — **27 files** carry it
  (`grep -rl 'data-slot' src/components/ui/`), `data-slot="button"` is defined at `src/components/ui/button.tsx:57`.
- The CI-blocking scope is `--mantine-only`, which `scripts/lib/mantine-story-scope.mjs` defines as titles
  starting `Mantine/Primitives/` or `Patterns/Mantine/`. Those stories render Mantine components, which emit
  `m_*` / `mantine-*-root` classes and **no `data-slot`**. So `checkedAny` never becomes `true`, and both
  assertions write `null` unconditionally.
- **This exact defect is already documented for a different check.** `docs/storybook-governance.md` §14.9.9
  (Task 538) records that geometry's `PORTAL_SELECTOR` "only matches legacy shadcn `data-slot` names Mantine
  never renders", proven empirically on an opened `Mantine/Primitives/Select/Default` sheet where
  `document.querySelectorAll('#storybook-root button').length === 0` while 7 real buttons existed. Same cause,
  different check, never generalised — which is precisely the gap this task closes.
- Corroboration from the repo's own fixtures: `src/stories/PlantedVisualViolations.stories.tsx:11-13` states that
  its fixtures deliberately use `role="button"` **without** `data-slot="button"` so the button assertion "does
  NOT trip — proving the false-negative". The false negative was known and left uninstrumented.

### 3.3 Why `null` passes vacuously — the consumer contract

Every consumer tests `=== false`, never "is it a boolean":

| Line | Code |
|---:|---|
| `:673` | `if (cell.assertions.noHorizontalOverflow === false) return false;` |
| `:674` | `if (cell.assertions.fullWidthControlsAtMobile === false) return false;` |
| `:675` | `if (cell.assertions.fullWidthButtonsAtMobile === false) return false;` |
| `:676` | `if (cell.assertions.popupBottomSheetAtMobile === false) return false;` |
| `:680` | `if (cell.assertions.heroSearchWrapInBand === false) return false;` |
| `:1278` | `const hardPass = noOverflow && !geometryHardFail && heroSearchWrapInBand !== false && (viewport.width >= 640 \|\| (fullWidthOk && fullWidthButtonsOk && popupBottomSheetOk));` |

Note `:1278` reads the **raw local booleans**, which initialise to `true` (`:1148`, `:1180`) and stay `true` when
no candidate is found. So a dead selector yields `hardPass === true` through both paths. `:1241`'s own comment
already says it: *"every consumer only checks `=== false`, so the dead selector passed vacuously for ~5 weeks."*

**You are not changing any of this.** The meta-gate reads the persisted manifest instead.

### 3.4 The exit-code question from the 709 review — measured, and narrower than it looked

709's plant transcript persisted `EXIT_CODE=0` beside 4 genuine FAILs; 709-R captured the same plant unpiped and
got **`EXIT_CODE=1`**. Reviewer-verified in source on 2026-08-05:

- `:1861` — `process.exitCode = 1; return;` on the failure path (with a comment explaining `return` not
  `process.exit` so `finally` still closes the browser).
- `grep "exitCode *= *0\|process.exit(0)"` → **no matches.** Nothing resets it.
- `:62`, `:67` — `uncaughtException` / `unhandledRejection` set exit code **2**.

**So the code path is intact and the defect was in evidence capture, not in the gate.** A piped `$?`/`$LASTEXITCODE`
captured the pipe's status. That cannot be gated from inside the repo — but two things can, and R9/R10 do them.

### 3.5 House patterns you must follow, not invent

| Concern | Existing pattern | Files |
|---|---|---|
| Gate self-test | `--verify-gate` flag with a `PLANTS` array of `{id, describe, run, expectReason}` and a negative arm | `check-homepage-grid.mjs:655-760` (7 plants) · also `check:hydration:verify`, `check:header-id-parity:verify`, `check:listing-visibility:verify` |
| Machine-readable exception list | a JSON file in `scripts/` | 11 exist, e.g. `design-tokens-allowlist.json`, `story-coverage-exempt.json`, `mojibake-allowlist.json` |
| Stale-exception detection | `check:design-tokens` reports `N stale-marker(s)` alongside violations and fails on them | `scripts/check-design-tokens.mjs` |
| Known-failure registry with a follow-up task | `MANTINE_PATTERN_KNOWN_FAILURES` → `cell.knownFailureTask`, reported as "TRACKED KNOWN FAILURES … NOT fixed here" | `check-stories-rendered.mjs:335, 1586-1598, 1856` |
| Structural test asserting a script's own invariant | assert on source structure, not a full run | `scripts/__tests__/preview-clock-anchor.test.ts` · `overlay-dual-declaration.test.ts` |
| Manifest shape | `{ timestamp, summary, matrix }`; `summary` holds ~25 counters (`:1617-1637`); each `matrix` cell has `story`, `storyId`, `locale`, `viewport`, `verdict`, `pass`, `assertions` | `check-stories-rendered.mjs:1640` |
| CI wiring | `rendered-proof` job runs `npm run screenshots:assert -- --mantine-only` | `.github/workflows/governance-pr.yml:161` |

### 3.6 Worktree state — starts clean

`git status --short` at kickoff time is **empty**; HEAD `d0286fcd3` is pushed to
`origin/task/q0-ci-rendered-locale-split` (`git rev-list --count origin/…..HEAD` = 0). 182 commits ahead of
`origin/main`.

> Take your own pre-write `git status --porcelain` snapshot before your first edit. If it is not empty, complete
> `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry and **never** touch a foreign path.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | `scripts/check-assertion-liveness.mjs` exists, takes a manifest path, and classifies **every** boolean assertion key in that manifest as `LIVE`, `DEAD-NEW`, `DEAD-KNOWN`, or `STALE-ENTRY`. Object-valued keys (`renderCheck`/`styleIntegrity`/`visualIntegrity`) are excluded by shape, not by name-list. | P0 | AC1 |Confirmed|
| R2 | §3.1, 573 | A `DEAD-NEW` assertion — `null`/absent in every cell, no registry entry — makes the gate **exit non-zero**. | P0 | AC2 |Confirmed|
| R3 | §3.2 | `scripts/assertion-liveness-registry.json` records `fullWidthButtonsAtMobile` and `popupBottomSheetAtMobile` for scope `mantine-only`, each with `followUpTask: 711`, a root-cause `reason`, and `deadSince`. `DEAD-KNOWN` reports loudly and exits **0**. | P0 | AC3 |Confirmed|
| R4 | §3.5 | A `STALE-ENTRY` — a registered assertion that is now alive — makes the gate **exit non-zero**, naming the entry to delete. | P0 | AC4 |Confirmed|
| R5 | §3.1 | On the current tree the gate reports exactly **3 LIVE** (`noHorizontalOverflow`, `fullWidthControlsAtMobile`, `heroSearchWrapInBand`), **2 DEAD-KNOWN**, **0 DEAD-NEW**, **0 STALE-ENTRY**, and exits **0**. | P0 | AC5 |Confirmed|
| R6 | §3.5 | `--verify-gate` proves all three failing arms with planted manifests and a clean negative arm; every arm asserts the **specific** diagnostic, not merely "it failed". | P0 | AC6 |Confirmed|
| R7 | §3.5 | `check:assertion-liveness` + `check:assertion-liveness:verify` in `package.json`; the gate runs in the `rendered-proof` CI job **after** `screenshots:assert`, against the manifest that run produced. | P0 | AC7 |Confirmed|
| R8 | §3.1 | A scope with **zero** cells, a manifest with no `matrix`, and a malformed/missing manifest each fail **loudly and distinguishably** — never silently green. | P0 | AC8 |Confirmed|
| R9 | §3.4 | `scripts/__tests__/rendered-gate-exit-code.test.ts` asserts `check-stories-rendered.mjs` still contains a `process.exitCode = 1` on the `failed > 0` path and **no** later `exitCode = 0` / `process.exit(0)` reset. Planted-violation proof required. | P1 | AC9 |Confirmed|
| R10 | 709 review F2 | The unpiped-capture rule is written into `docs/storybook-governance.md` and `.claude/skills/execute-task/SKILL.md`. | P1 | AC10 |Confirmed|
| R11 | §3.2 | `docs/storybook-governance.md` gains a §14.9.x section: the meta-gate, the registry contract, the four states, and the shadcn-`data-slot`-vs-Mantine root cause cross-referenced to §14.9.9. | P1 | AC11 |Confirmed|
| R12 | scope | Zero diff in `src/`, in `scripts/check-stories-rendered.mjs`, and in every story file. | P0 | AC12 |Confirmed|
| R13 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code captured **inside** the file. | P0 | AC13 |Confirmed|
| R14 | agent-contract cl. 14, N6 | Counting gates run **last**, and their actual numbers appear in the session log under a heading that exists. | P2 | AC14 |Confirmed|

---

## 5. Assumptions and open questions

- **A1 — the classification must be shape-driven, not name-driven.** `renderCheck`/`styleIntegrity`/
  `visualIntegrity` are objects and must be skipped because they are objects, not because you hardcoded three
  names. A future object assertion must be skipped automatically; a future **boolean** assertion must be picked
  up automatically, or the meta-gate has the same blind spot it exists to fix. **Verify by adding a synthetic
  boolean key to a planted manifest and confirming it is classified without a code change.**
- **A2 — `null` and absent must be treated identically.** §3.1 shows all 8 keys present in all 1184 cells today,
  but `:1145`/`:1176`/`:1218` only assign inside a `viewport.width < 640` branch for some paths, and a future
  refactor could omit the key entirely. Absent must not read as live.
- **A3 — scope is part of the registry key.** The measurements in §3.1 are `--mantine-only`. The two dead
  assertions may well be live in the full matrix, where shadcn stories render `data-slot`. **This was not
  measured** (a full sweep is ~30 min and was out of review budget). So the registry keys on `scope`, and an
  entry is valid only for the scope it names. Do not claim anything about full-matrix liveness you have not run.
- **A4 — a manifest is the input, not a browser.** The gate must never launch Playwright. It reads a persisted
  manifest so it can re-run in seconds on a CI artifact. If you find yourself importing `playwright`, stop.

### 5.1 Naming — decided, do not re-litigate

Script `scripts/check-assertion-liveness.mjs`. Registry `scripts/assertion-liveness-registry.json`. Scripts
`check:assertion-liveness` and `check:assertion-liveness:verify`. Test
`scripts/__tests__/rendered-gate-exit-code.test.ts`. States exactly: `LIVE`, `DEAD-NEW`, `DEAD-KNOWN`,
`STALE-ENTRY`. No task number in any filename, script name or CI label (Task 701 F2).

### 5.2 Registry entry shape — decided

```json
{
  "$schema-note": "One entry per (scope, assertion). An entry is a TRACKED DEAD GATE, not an exemption.",
  "entries": [
    {
      "scope": "mantine-only",
      "assertion": "fullWidthButtonsAtMobile",
      "followUpTask": 711,
      "deadSince": "2026-08-05",
      "reason": "Selector `[data-slot=\"button\"]` (check-stories-rendered.mjs:1161) is a shadcn convention emitted only by src/components/ui/*; Mantine-scope stories render no data-slot, so checkedAny is never true. Same root cause as governance §14.9.9's PORTAL_SELECTOR defect."
    }
  ]
}
```

### 5.3 Rejected alternatives — do not re-open

- **Inline the check in `check-stories-rendered.mjs`.** Rejected: it would edit the gate 708 repaired and 709-R
  validated against, it would force a 30-minute sweep to re-run the meta-check, and it couldn't run on a CI
  artifact. §3.5's one-script-per-gate pattern applies.
- **Spawn the sweep with a planted failure to gate the exit code end-to-end.** Rejected: no per-story filter flag
  exists (`--fast`/`--check`/`--mantine-only` only, `:76-82`), so the cheapest arm is still the full matrix; and
  §3.4 shows the code path is intact — the real defect was capture-side. R9's structural test plus R10's written
  rule address the actual failure.
- **Fix the two dead assertions here.** Rejected: re-anchoring six popup selectors and the button selector onto
  Mantine DOM is its own measurement problem with its own planted proofs. **Task 711.**

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 50**).

**Because this is a governance gate:** `docs/qa-rules.md` · `docs/storybook-governance.md` **§14.3** (machine
gates), **§14.9** (the Mantine rendered gate), **§14.9.7** (its known limitations), **§14.9.9 in full** (the
identical shadcn-selector defect), **§14.11** (D26).

**Task-specific sources:** this file · `tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md` ·
`scripts/check-stories-rendered.mjs` **`:60-100`** (flags), **`:660-700`** (consumers), **`:1108-1300`** (the five
boolean assertions + `hardPass`), **`:1600-1650`** (summary/manifest), **`:1840-1870`** (reporting + exit) —
**read; do not edit** · `scripts/check-homepage-grid.mjs` **`:655-760`** (the `--verify-gate` pattern to copy) ·
`scripts/lib/mantine-story-scope.mjs` · `scripts/design-tokens-allowlist.json` (registry form) ·
`scripts/__tests__/preview-clock-anchor.test.ts` (structural-test form) ·
`.github/workflows/governance-pr.yml` **`:121-170`** (the `rendered-proof` job) ·
`docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md` **§7** (the exit-code capture history).

---

## 7. Scope

- `scripts/check-assertion-liveness.mjs` — **new.**
- `scripts/assertion-liveness-registry.json` — **new**, 2 entries.
- `scripts/__tests__/rendered-gate-exit-code.test.ts` — **new.**
- `package.json` — 2 script entries.
- `.github/workflows/governance-pr.yml` — 1 step in the existing `rendered-proof` job.
- `docs/storybook-governance.md` — new §14.9.x + the R10 capture rule.
- `.claude/skills/execute-task/SKILL.md` — the R10 capture rule.
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-0X-task710-assertion-liveness-meta-gate.md` — session log, real finish date.

---

## 8. Out of scope

- **`scripts/check-stories-rendered.mjs`** — zero diff. 708 repaired it, 709-R validated against it, D33 applies.
- **Re-anchoring the two dead assertions** — Task 711.
- **`src/`, every story file, every `.module.css`** — zero diff.
- Any other gate's logic, allowlist or CI job.
- The full-matrix liveness question (A3) — record it as unmeasured; do not run a 30-minute sweep to close it.
- The pre-existing `<div>`-in-`<p>` FiltersPanel hydration warning (Task 677) and the
  `LocationComboboxSubPanel` blank-canvas flake — record, do not fix.

---

## 9. Current and required behavior

**Current:** eight assertion keys are written per cell; five are booleans and three are objects. Two of the five
booleans (`fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`) are `null` in **all 1184** cells of the
CI-blocking `--mantine-only` matrix and have been since the shadcn→Mantine migration, because their candidate
selectors are shadcn `data-slot` names Mantine never renders. Every consumer tests `=== false`, so a wholly dead
assertion contributes `hardPass === true`. Nothing detects this; it is exactly how Task 573's assertion died
unnoticed for ~5 weeks. No gate asserts that `check-stories-rendered.mjs` exits non-zero on failure, and Task 709
persisted `EXIT_CODE=0` beside 4 genuine FAILs from a piped capture.

**Required after:** a manifest-reading gate classifies every boolean assertion into one of four states; a newly
dead assertion fails CI; the two known-dead ones are registered against Task 711 and reported loudly on every
run; a registry entry that has gone stale fails CI; the gate's own three failure arms are proven by planted
manifests; a structural test protects the sweep's non-zero exit path; and the unpiped-capture rule is written
where executors read it.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Take `git status --porcelain`. From
  `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json`, **reproduce §3.1's table yourself** and persist
  it as a file. If any distribution differs from §3.1, **stop and report** — the kickoff's measurement is then
  stale and the registry contents are in question.
- **I2 — Write the gate against fixtures, not the real manifest.** Build the classifier and a set of small
  planted manifests under your evidence dir: one all-`null` key (DEAD-NEW), one registered all-`null` key
  (DEAD-KNOWN), one registered key with a single `true` (STALE-ENTRY), one zero-cell scope, one `matrix`-less
  object, one unparseable file, and one **synthetic new boolean key** to prove A1's shape-driven classification.
- **I3 — Run against the real manifest.** Confirm R5's exact counts and exit 0.
- **I4 — `--verify-gate`.** Wire the I2 fixtures into a `PLANTS` array with per-arm `expectReason`, plus the
  negative arm on the real manifest. Persist the transcript **with the exit code captured unpiped**.
- **I5 — R9's structural test**, with a planted violation: temporarily mutate a **copy** of the sweep source (never
  the real file) so the test genuinely fails, then confirm it passes against the real one.
- **I6 — Docs, CI wiring, session log, backlog.**
- **I7 — Counting gates last** (`check:file-integrity`, `check:mojibake`), after the log and backlog row exist,
  **and write their real numbers into the log**.

---

## 10. Implementation requirements

1. **Classify by shape (A1).** A key is a candidate iff its value is `true`, `false` or `null` in at least one
   cell and never an object/array/string/number. Never a hardcoded name list.
2. **`null` and absent are the same thing (A2).** A key absent from a cell counts as non-committal for that cell.
3. **Never launch a browser (A4).** No `playwright` import. Input is a manifest path.
4. **A registry entry is a tracked defect, not an exemption.** Every entry must carry `followUpTask`; the report
   must print the task number, in the voice `check-stories-rendered.mjs:1856` uses for known failures
   ("TRACKED … NOT fixed here").
5. **Fail loudly on degenerate input (R8).** Zero cells, no `matrix`, missing file and unparseable JSON must each
   produce a distinct message and a non-zero exit. A gate that greens on an empty input is the defect this task
   exists to prevent, one level up.
6. **Exit codes:** `0` = all live or known-dead; `1` = DEAD-NEW or STALE-ENTRY; `2` = bad input. Set
   `process.exitCode` and return, or `process.exit(n)` at a top-level `main().catch` — follow
   `check-homepage-grid.mjs:810-819`.
7. **No task number in any filename, npm script name, or CI step label** (Task 701 F2).
8. **Capture every transcript unpiped** — redirect, then append `$LASTEXITCODE` as its own statement. This task's
   own evidence is the first thing R10's rule binds.
9. **Run `check:file-integrity` and `check:mojibake` LAST** (N6, 5th recurrence — a 6th is a P1).

---

## 11. Positive and negative flows

**Positive flow:** `npm run check:assertion-liveness` on the current tree reports 3 LIVE / 2 DEAD-KNOWN (both
naming Task 711) / 0 DEAD-NEW / 0 STALE-ENTRY and exits 0. `npm run check:assertion-liveness:verify` proves all
three failing arms and the negative arm, exiting 0 overall.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| New dead assertion appears | **Yes** | R2 | `DEAD-NEW`, exit 1, key named | AC2, AC6 |
| Known dead assertion stays dead | **Yes** | R3 | `DEAD-KNOWN`, exit 0, Task 711 printed | AC3, AC5 |
| Registered assertion comes back to life | **Yes** | R4 | `STALE-ENTRY`, exit 1, entry to delete named | AC4, AC6 |
| A new **boolean** assertion is added upstream | **Yes** | A1 | classified automatically, no code change | AC1 |
| A new **object** assertion is added upstream | **Yes** | A1 | skipped automatically, not misread as dead | AC1 |
| Zero-cell scope / no `matrix` / unparseable / missing file | **Yes** | R8 | distinct message each, exit 2 | AC8 |
| Sweep's non-zero exit path removed | **Yes** | R9 | structural test fails | AC9 |
| Manifest from a different scope | **Yes** | A3 | registry entry applies only to its named scope | AC3 |
| Locale expansion | **No** | the gate reads a manifest; no rendering, no strings | N/A | — |
| Small viewport / responsive | **No** | no rendering | N/A | — |
| RLS / authorization | **No** | build-time script, no data access | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given a planted manifest containing a synthetic **boolean** key and a synthetic **object** key
  neither of which the script names in source, when the gate runs, then the boolean is classified and the object
  is skipped. Quote the source showing no hardcoded key list.
- **AC2 [R2]** Given a manifest where an unregistered boolean is `null` in every cell, when the gate runs, then it
  prints `DEAD-NEW` naming that key and **exits 1**. Persist the transcript and the captured exit code.
- **AC3 [R3]** Given the real manifest and the 2-entry registry, when the gate runs, then both dead assertions
  report `DEAD-KNOWN` with `Task 711`, and the exit code is **0**. Quote the registry file in full.
- **AC4 [R4]** Given a registry entry for an assertion that is `true` in ≥1 cell, when the gate runs, then it
  prints `STALE-ENTRY`, names the entry to remove, and **exits 1**.
- **AC5 [R5]** Given `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json`, when the gate runs, then it
  reports exactly **3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY** and exits 0. Name the 3 live keys.
- **AC6 [R6]** Given `npm run check:assertion-liveness:verify`, when it runs, then the negative arm passes on the
  real manifest, all three failing arms fail with their **specific** diagnostics matched by `expectReason`, and
  the overall exit code is 0. Persist the transcript with the exit code inside it.
- **AC7 [R7]** Given `package.json` and `.github/workflows/governance-pr.yml`, when read, then both scripts exist
  and the gate runs inside `rendered-proof` **after** `screenshots:assert`, pointed at that run's manifest. Quote
  both diffs. No task number in any name or label.
- **AC8 [R8]** Given each of the four degenerate inputs, when the gate runs on each, then each produces a
  **distinct** message and **exit 2**. Show all four transcripts.
- **AC9 [R9]** Given `npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts`, then it passes against
  the real `check-stories-rendered.mjs`; and given a **copy** mutated to drop `process.exitCode = 1` or to append
  `process.exitCode = 0`, then it fails naming the missing/added path. Show both arms. **The real file must have
  zero diff** (AC12).
- **AC10 [R10]** Given `docs/storybook-governance.md` and `.claude/skills/execute-task/SKILL.md`, when read, then
  both state that an evidence transcript's exit code must be captured unpiped, citing Task 709's `EXIT_CODE=0`
  beside 4 genuine FAILs as the reason. Quote both.
- **AC11 [R11]** Given the new `docs/storybook-governance.md` section, when read, then it documents the four
  states, the registry contract including the `followUpTask` obligation, the §3.2 root cause, and a
  cross-reference to §14.9.9.
- **AC12 [R12]** Given `git diff` on `src/`, `scripts/check-stories-rendered.mjs` and every story file, when read,
  then all are **empty**. Verify by hash, not by assertion.
- **AC13 [R13]** Given the final state, when `npm run build` runs, then it exits **0**, with the transcript at a
  path you state and the exit code captured **inside** that file.
- **AC14 [R14]** Given `check:file-integrity` and `check:mojibake` run **after** the session log and backlog row
  exist, then both pass and their **actual numbers appear in the session log** under a heading that exists.
  Reconcile against your pre-write snapshot.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `docs/qa-profiles.md` routes to Q4 for changes to a CI-blocking gate,
and `docs/critical-flow-registry.md` row 50 depends on the very assertion family this gate polices. Q3 would
cover a visual matrix but would not compel the planted-arm proof — and a meta-gate that has not been shown to
fail is the exact defect it exists to detect. **A green run of this gate is explicitly not sufficient evidence.**

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | Reproduce §3.1's distributions from the real manifest (I1) | table matches exactly, persisted as a file |
| 3 | Build the classifier + 7 planted fixtures (I2) | fixtures persisted under `.screenshots/task710-evidence/` |
| 4 | `npm run check:assertion-liveness` on the real manifest (I3) | 3 LIVE / 2 DEAD-KNOWN / 0 / 0, **exit 0** |
| 5 | The gate on each of the 4 degenerate inputs | 4 distinct messages, **exit 2** each |
| 6 | `npm run check:assertion-liveness:verify` (I4) | negative arm + 3 failing arms, each matched by `expectReason`, **exit 0** |
| 7 | `npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts` (I5) | passes real, fails the mutated copy |
| 8 | `git diff` on `src/` · `check-stories-rendered.mjs` · stories | empty (hash-verified) |
| 9 | `npm run check:stories` | unchanged pass, `checksRan` unchanged |
| 10 | `npm run check:design-tokens` | unchanged (**0** as of `50c40c2f8`; report what you observe, do not assume 23) |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript persisted with the exit code inside it |
| 13 | `check:file-integrity` · `check:mojibake` — **last** | pass; numbers written into the session log |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task710-evidence/` (local-only per **D6**), referenced by path from the
session log. **Name every artifact you create.** Do not modify or overwrite any existing
`.screenshots/rendered-assert/` directory — they are 709/709-R's evidence.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task710-assertion-liveness-meta-gate.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled against your pre-write snapshot.
2. **Requirement IDs completed** — R1–R14, each with its AC verdict.
3. **Your own reproduction of §3.1's distribution table**, and whether it matched.
4. **The four states with the real counts**, and the registry file quoted in full.
5. **All four degenerate-input transcripts**, and the `--verify-gate` transcript with its captured exit code.
6. **The R9 test's both arms** — real file passing, mutated copy failing.
7. **Commands run and actual results** — real exit codes and real numbers, including the step-12 build transcript
   with its persisted path and captured exit code.
8. **Evidence locations** — every artifact and fixture, named.
9. **A real counting-gates section** with the actual `check:file-integrity` / `check:mojibake` numbers.
10. **The A3 limitation stated plainly** — full-matrix liveness of the two dead assertions is **unmeasured**, and
    the registry entries are scoped to `mantine-only` for that reason.
11. **Standing findings not acted on** — Task 711 (re-anchor the two dead assertions), Task 677 (the
    `<div>`-in-`<p>` hydration warning), the `LocationComboboxSubPanel` flake.
12. **Assumptions, deviations, limitations, unresolved issues.**
13. Concise current state appended to `docs/backlog.md` — **state only**, no history. The file was consolidated to
    **~98** lines on 2026-08-05 against a ~80-line target; **do not add net lines**, and flag a
    `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest,
or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, selector, distribution, exit code, npm script and CI job is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R14 → AC1–AC14 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus three hash-verified zero-diff ACs (AC12) and §5.3's rejected alternatives |
| No uninspected claim | ✅ the 8-key distribution table was enumerated from the real manifest, the two selectors read at `:1161`/`:1185-1192`, the 27 `data-slot` files counted, the consumer lines quoted, the exit path and the absence of any reset grepped, and every house pattern opened — all 2026-08-05 |
| The gate proves the changed behavior, not merely procedure | ✅ AC2/AC4/AC6 plant all three failing arms with per-arm `expectReason`; AC8 covers degenerate input; a green run is declared insufficient in §13 |
| The new gate cannot become an allowlist that hides the defect | ✅ R4's `STALE-ENTRY` arm plus R3's mandatory `followUpTask`, following `check:design-tokens`'s stale-marker precedent |
| The meta-gate cannot inherit the blind spot it fixes | ✅ A1 forces shape-driven classification and AC1 proves it with a synthetic key the source does not name |
| Critical flow named or excluded from evidence | ✅ §3.5/§13 name `critical-flow-registry.md` row 50 and argue Q4 from it, rejecting Q3 explicitly |
| Owner exceptions have traceable authorization | ✅ D6 cited with file and date; D33's no-touch boundary honoured in §8; no new owner decision is claimed |
| Canonical-source search performed before proposing a mechanism | ✅ §3.5 enumerates the four existing `--verify-gate` self-tests, all 11 JSON registries, both structural-test precedents and the known-failure registry; §5.3 records why inlining was rejected |
| Exactly one active executable route | ✅ §5.1 fixes every name; §5.2 fixes the registry shape; §5.3 closes the three alternatives |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I1's stop-and-report on a stale baseline + A1/A4's stop conditions + AC8's exit-2 contract |
| Zero/empty input covered | ✅ R8/AC8 — zero cells, absent `matrix`, missing file, unparseable JSON, each distinct |
| Worktree state established with a pre-write snapshot | ✅ §3.6 records the measured clean status and HEAD, and requires the executor's own snapshot |
| Prior-review corrections folded in | ✅ 709 review **F2** (R9/R10 + §10.8 unpiped capture, and this task's own evidence bound by it), **F3** (AC14 real heading + numbers), **F5** (I1 persists the extraction as a file), 707 **N6** (§10.9), 701 **F2** (no task number in names), and the stale-baseline lesson (§13 step 10 refuses to assume 23) |
| Sprint assigned before creation | ✅ Sprint 49; closes it |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.**
