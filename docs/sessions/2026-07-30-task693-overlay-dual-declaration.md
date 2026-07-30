# Task 693 — Task 690 revision: dual `@theme`/`:root` declaration

**Status: `BLOCKED`** (second attempt, D20). Resumed at I5 per the D20 resume protocol — I0–I4 were
already complete and verified from the first attempt, re-confirmed cheaply here. I5's control was
re-pointed at `--color-black` (D20, replacing the first attempt's overlay-pair subject, which §3.8
proved was structurally immune). The re-pointed control **still cannot pass as literally scoped**:
the plant on `dialog.tsx:35`/`sheet.tsx:32` alone does not make `--color-black` disappear from the
bundle. Isolated by diagnostic: three stale governance-script files
(`scripts/governance/scan-tailwind.mjs:11,127`, `scripts/governance/tailwind-entropy.mjs:323`,
`scripts/governance/baseline.json`) contain the literal substring `bg-black` as part of their own
regex/baseline logic, and — unlike `docs/`/`tasks/` — `scripts/` is **not** excluded from
Tailwind's automatic content scan, so these three files independently keep `--color-black` alive.
With them *also* neutralized (diagnostic only), `--color-black` correctly disappears — proving
Tailwind's usage-contingent emission mechanism works exactly as claimed, and F1's premise is sound.
But the kickoff's I5.2 explicitly scopes the plant to "those two occurrences only… change nothing
else," and A4 does not name the three governance scripts as plantable. Expanding that scope is a
task-design decision, not an implementation one — so, per A3 ("stop and report, do not
rationalise it"), Sonnet stops here rather than unilaterally widening the plant.

**This is a narrower, more constructive finding than the first attempt's.** D19's fix is unaffected
and still verified clean (I2–I4). F1's premise is now *confirmed*, not called into question — the
only gap is that the kickoff's own §3.8 diagnostic grepped for the CSS custom-property name
(`--color-black`) instead of the Tailwind utility-class token (`bg-black`), and so missed three
stale tooling references that need including in the plant for the control to reach `ABSENT`.

## 1. Resume-protocol reconciliation (D20, I0)

`git status --porcelain` at the start of this attempt:

```
 M src/app/globals.css
 M src/modules/locations/components/PopularLocationsView.module.css
```

`git log -1 --oneline` → `1a43d8c05` (`docs(Task693): amend I5/AC2 per D20 …`), carrying the D20
kickoff amendment; `a9934c037` confirmed an ancestor. Both remaining `src/` files' content matched
§3.2 exactly:

- `src/app/globals.css` — inspected directly: `@theme inline` already carries the dual declaration
  (both `--overlay`/`--overlay-foreground` immediately above `--color-overlay*`, comment rewritten
  per R4) and the `:root` copy is retained with its own rewritten comment. md5 = `1f7690d0…` (the
  I2-state value recorded at the end of the first attempt).
- `src/modules/locations/components/PopularLocationsView.module.css` — md5 =
  `b721ecf9284f23a026d097b4012bdea4`, matching §3.2 exactly (unchanged).

Per the D20 resume protocol, **I2 is done; I0–I4 are not re-run.** I3 was re-confirmed cheaply
(one `rm -rf .next && npm run build` + selector-set diff): **empty**, matching the first attempt's
result. I4's prior evidence (`computed-after.json` diffCount 0, scrim byte-equal to §3.7's string)
survives unchanged in `.screenshots/task693-delta/` from the first attempt and was not
re-captured. **Branch taken: resume, straight to I5.**

## 2. I5 — the planted control on `--color-black` (D20's re-pointed subject)

### I5.1 — unplanted reference (AC2a)

Clean `rm -rf .next && npm run build`, then:

```
$ grep -ho -- "--color-black:[^;]*" .next/static/css/*.css | sort -u
--color-black:#000
```

**Present, as required.** This is the positive arm.

### I5.2 — the plant

Exact before/after lines, `dialog.tsx:35` (only this token changed):

```diff
- "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
+ "fixed inset-0 isolate z-50 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
```

`sheet.tsx:32` (only this token changed):

```diff
- "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
+ "fixed inset-0 z-50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
```

Nothing else in either file was touched. Verified: `grep -n "bg-black" src/components/ui/dialog.tsx
src/components/ui/sheet.tsx` → no hits after the plant.

### I5.3 — prove the risk was real (AC2b) — **did not reach `ABSENT`**

Clean `rm -rf .next && npm run build`, then the same grep:

```
$ grep -ho -- "--color-black:[^;]*" .next/static/css/*.css | sort -u
--color-black:#000
```

**Required: ABSENT. Actual: still present.** Per A3, this is the stop condition.

### Diagnostic isolation (beyond the kickoff's minimum, to characterize the finding precisely)

A repo-wide search for the bare token `bg-black` (not `--color-black`), excluding only `docs/` and
`tasks/` — the two paths `globals.css:11-12` actually excludes from Tailwind's scan — found three
files outside `dialog.tsx`/`sheet.tsx`:

```
scripts/governance/scan-tailwind.mjs:11    *     T4 - arbitrary hex / bg-white / bg-black backgrounds
scripts/governance/scan-tailwind.mjs:127   if (/bg-\[#[0-9a-fA-F]{3,6}\]|bg-white\b|bg-black\b/.test(line)) {
scripts/governance/tailwind-entropy.mjs:323  re: /fixed\s+inset-0.*bg-black\/[0-9]|bg-black\/[0-9].*fixed\s+inset-0/,
scripts/governance/baseline.json           (one stored "bg-black" token in recorded baseline data)
```

`scripts/` is not among the `@source not` exclusions (`globals.css:11-12` excludes only `../../docs`
and `../../tasks`), so these are ordinary, scannable content as far as Tailwind's automatic
detection is concerned. Temporarily neutralizing all three (diagnostic only, `bg-black` →
`PLANTEDDIAG` via `sed`, restored immediately after), with the `dialog.tsx`/`sheet.tsx` plant still
in place, then re-running the same clean-build+grep:

```
$ grep -ho -- "--color-black:[^;]*" .next/static/css/*.css | sort -u
(no output — 0 matches)
```

**`--color-black` disappears once all four sources are removed.** This confirms two things at
once: (1) Tailwind's usage-contingent `@theme` emission mechanism is real and works exactly as the
kickoff's §3.3/§3.8 describe — F1's underlying premise is sound; (2) the kickoff's own §3.8
diagnostic ("`grep -rn -- "--color-black" src/ scripts/ .storybook/` → no hits") searched for the
wrong string. It grepped for the CSS custom-property name (`--color-black`, with the double-dash
prefix), which is indeed absent everywhere except the unscanned `.module.css` — but Tailwind's
scanner looks for the **utility-class token** (`bg-black`, no prefix), which these three governance
files do contain. The two are different strings, and only the second is what Tailwind's content
detector actually matches on.

## 3. Restore verification (I5.4)

| Check | Result |
|---|---|
| `scripts/governance/scan-tailwind.mjs`, `tailwind-entropy.mjs`, `baseline.json` restored from `git show HEAD:` | `git diff --stat` on all three: empty |
| `dialog.tsx:35`, `sheet.tsx:32` reverted to the exact original line | confirmed by re-reading both files |
| `git status --porcelain` | exactly the 2 expected `src/` files (§3.2) — `dialog.tsx`, `sheet.tsx`, and all 3 governance files **absent** |
| `git diff --stat` | `src/app/globals.css` (+27/-3 lines — the I2 dual-declaration edit) and `PopularLocationsView.module.css` (+2/-2 — Task 690's scrim swap) only |
| md5 `src/app/globals.css` | `1f7690d0de50ed658fde83478a9c59f2` — unchanged from the post-I2 value |
| md5 `PopularLocationsView.module.css` | `b721ecf9284f23a026d097b4012bdea4` — unchanged, matches §3.2 exactly |
| `npm run typecheck` | exit 0 |
| Final `rm -rf .next && npm run build` + selector-set diff vs pre-690 baseline | exit 0, 40/40 pages; diff **empty** — I3's result still holds after the full I5 cycle |
| `npm run check:design-tokens` (sanity) | 43/0 stale, unchanged; module at 0 |
| `grep -rn 'color-black' src/` (sanity) | 0 hits |

## 4. R1–R10 mapped to AC1–AC9 (this attempt)

| Req | Status | Evidence |
|---|---|---|
| R1 [AC1] | MET (carried from attempt 1, re-confirmed by inspection) | §1 |
| R2 [AC1, AC2] | MET (declaration correct) — **AC2's specific proof still unmet**, see R5 | §1 |
| R3 [AC1] | MET | §1 — selector diff empty, twice (cheap I3 + the I5.4 final re-verification) |
| R4 [AC3] | MET (carried from attempt 1) | §1 |
| **R5** [AC2, D20] | **NOT MET — the (new) stop condition** | I5.1 (AC2a) passes. I5.3 (AC2b) **fails as literally scoped**: `dialog.tsx`/`sheet.tsx` plant alone leaves `--color-black` present, due to 3 unscoped governance-script leaks (§2 diagnostic). |
| R6 [AC4] | MET | Module md5 unchanged; `grep -rn 'color-black' src/` → 0 hits. |
| R7 [AC5] | MET (carried from attempt 1) | I4's prior `computed-diff.json`: 0 diffs; scrim matches §3.7. |
| R8 [AC6] | NOT RUN | Gated behind I5, which stopped again. |
| R9 [AC7] | MET | `check:design-tokens`: 43/0 stale, module at 0, both before and after this attempt's I5 cycle. |
| R10 [AC8] | NOT RUN in full | Two more clean builds this attempt both exit 0 (I5.3, and the I5.4 final re-verification); `typecheck` re-run, exit 0. `check:stories`/`check:story-coverage`/`check:i18n`/`vitest`/`check:file-integrity`/`check:mojibake` not re-run this attempt (only the attempt-1 I1 baseline is evidenced). |
| AC9 [§3.2] | MET | §3 — manifest fully reconciled; no A4-listed file (nor the 3 governance scripts) survives in the final diff. |

## 5. Commands actually run this attempt, with actual exit status

| Command | When | Result |
|---|---|---|
| `git status --porcelain` / `git log -1 --oneline` / ancestor check | I0 | as quoted §1 |
| inspection of both `globals.css` regions + both md5s | I0 | matched §3.2 exactly |
| `rm -rf .next && npm run build` (#1) | cheap I3 | exit 0, 40/40 |
| selector-set diff vs pre-690 baseline | cheap I3 | empty |
| `rm -rf .next && npm run build` (#2) | I5.1 | exit 0; `--color-black:#000` present |
| `dialog.tsx:35`/`sheet.tsx:32` plant applied | I5.2 | both lines quoted §2 |
| `rm -rf .next && npm run build` (#3) | I5.3 | exit 0; `--color-black:#000` **still present — the stop condition** |
| repo-wide `bg-black` search (excl. `docs/`/`tasks/`) | diagnostic | 3 governance files found |
| 3 governance files neutralized (diagnostic, `sed`) | diagnostic | — |
| `rm -rf .next && npm run build` (#4, diagnostic) | diagnostic | exit 0; `--color-black` **absent** — confirms the hypothesis |
| 3 governance files restored from `git show HEAD:` | I5.4 | `git diff --stat` empty on all 3 |
| `dialog.tsx`/`sheet.tsx` reverted to original lines | I5.4 | confirmed by re-read |
| `git status --porcelain` / `git diff --stat` | I5.4 | exactly the 2 expected files |
| md5 × 2 | I5.4 | both matched §3.2/post-I2 exactly |
| `npm run typecheck` | I5.4 | exit 0 |
| `rm -rf .next && npm run build` (#5, final re-verification) | I5.4 | exit 0, 40/40; selector diff still empty |
| `npm run check:design-tokens` (sanity) | post-I5 | 43/0 stale, unchanged |
| `grep -rn 'color-black' src/` (sanity) | post-I5 | 0 hits |

**Not run this attempt** (blocked before reaching them, same reasoning as attempt 1): I6's
`--mantine-only` 1184-cell proof, I7's gate re-runs beyond `typecheck`/`check:design-tokens`, I8's
completion-gate build (5 diagnostic/proof builds above all exit 0, but are not offered as that
specific gate).

## 6. Deviations

1. **Stopped at I5.3 again**, this time under D20's re-pointed subject, per the same A3 instruction
   ("stop and report, do not rationalise it"). The control's *logic* is now proven sound (§2's
   diagnostic shows `ABSENT` is reachable); only its *literal scope* — two named lines in two named
   files — is insufficient, because three files outside that scope also emit the token.
2. **Did not expand the plant to the 3 governance scripts**, even though doing so would make I5.3
   pass, because the kickoff's I5.2 text restricts the plant to "those two occurrences only …
   change nothing else in either file," and A4 authorizes planting only on `dialog.tsx`/`sheet.tsx`
   among files outside the core scope. Widening that is a task-design change, not an execution
   choice available to Sonnet.
3. **Ran one diagnostic cycle beyond the kickoff's I5 minimum** (neutralizing the 3 governance
   files) to determine whether the failure indicated F1 was a phantom (as A3 warns for) or whether
   it was a narrower scoping gap. This distinction matters enormously for what the orchestrator
   should do next, and the diagnostic answers it unambiguously: **F1 is real; the plant's named
   scope is just incomplete.**
4. **Restored every transient edit** (`dialog.tsx`, `sheet.tsx`, and the 3 diagnostic governance-
   script edits) and independently re-verified via `git diff --stat` (empty on all 5) plus a final
   clean rebuild reproducing I3's empty selector-set diff, before writing this report.
5. **Did not touch `scripts/governance/baseline.json`'s content further** than the single
   reversible `sed` substitution — it is a generated/recorded artifact, not hand-authored, and was
   restored byte-for-byte from `git show HEAD:`.

## 7. Limitations

- All limitations recorded in the first attempt's portion of this task (7-width proof path, the
  Chromium harness's blindness to the fallback tier, the four non-enrolled overlay consumers, the
  duplicated-literal dependency on Task 692, Tasks 689/691/692 deferred per §8) still apply
  unchanged.
- This attempt adds one new, narrow limitation: **the exact set of files that must be included in
  a `--color-black`-clean plant is now known to be at least 5** (`dialog.tsx`, `sheet.tsx`, and the
  3 named governance scripts) **but may not be exhaustively enumerated** — this session's
  repo-wide `bg-black` grep excluded only `docs/`/`tasks/` (Tailwind's actual exclusions) and found
  exactly these 3 beyond the two named consumers, but a different search tool or a future file
  addition could introduce a 6th. Whoever redesigns I5.2's scope should re-run that repo-wide grep
  fresh, not reuse this session's file list as a closed set.
- `scripts/governance/scan-tailwind.mjs` and `tailwind-entropy.mjs` appear to be *governance
  tooling that itself detects raw Tailwind utility usage* (arbitrary-hex / `bg-black` / `bg-white`
  anti-patterns) — their own detection regexes are, ironically, exactly the kind of literal text
  Tailwind's own scanner cannot distinguish from real usage. This may be worth a dedicated
  governance-side fix (e.g. adding `scripts/governance/` to `@source not`, or restructuring these
  detectors to avoid embedding literal utility-class substrings) independent of Task 693/692 — but
  that is a new, unscoped observation, not something to act on unilaterally here.

## Opus handoff

- **Primary question:** how should I5.2's plant scope be amended? The two live options are (a) add
  the 3 governance-script files to the authorized plant scope (they are not production consumers,
  not named in A4, and are cleanly reversible — this session's own diagnostic already proves the
  amended control would pass), or (b) accept the narrower "two occurrences only" plant as
  sufficient evidence in spirit, given the diagnostic already demonstrates the full mechanism
  independently, and re-scope AC2 to reference this session's diagnostic rather than requiring a
  literal re-run inside I5.3's exact wording.
- **Evidence to inspect directly:** §2's four build+grep results in sequence (present → present
  with narrow plant → absent with widened plant → restored/present again), which isolate the cause
  unambiguously.
- **Verify independently:** re-run the same repo-wide `grep -rn 'bg-black' --include=*.tsx
  --include=*.ts --include=*.mjs --include=*.js --include=*.json .` excluding only `docs/` and
  `tasks/`, confirm the same 5-file set (2 consumers + 3 governance scripts), then reproduce the
  diagnostic's present/absent build pair.
- **What is NOT in question:** R1–R4, R6, R7, R9 all remain verified clean; D19's dual-declaration
  fix is correct and unaffected. F1's premise is now *positively confirmed* by this session's
  diagnostic, not merely unfalsified — the sole open item is the plant's literal scope in I5.2/AC2.
