# Task 721 — Liveness-gate arms and citation residue (Sprint 52.3, folds 728)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_721_LivenessGate_Arms_And_Citations.md` +
`Sprint_52_Task_721_execution_contract.md` + `Sprint_52_Task_721_rule_compliance_ledger.md`. Branch
`task/q0-ci-rendered-locale-split`, pre-write HEAD `2089afb8c` (worktree clean at start, confirmed via
`git status --porcelain` — checkpoint 0 artifact `.screenshots/task721-evidence/J0-status.txt`).

---

## 1. Files changed

| Path | Change | Reason |
|---|---|---|
| `scripts/check-assertion-liveness.mjs` | +161/-20 | R1 (`no-boolean-assertions` exit-2 arm), R2 (`ORPHAN-ENTRY` exit-1 arm, distinguishable wording from `STALE-ENTRY`), R3 (`LIVE-THIN` advisory ratio, viewport-scoped denominator), R4 (3 new `PLANTS` entries), R8 (no functional change here — CI wiring is in the workflow file). |
| `scripts/assertion-liveness-registry.json` | 1 line | `$schema-note` updated to describe the new `ORPHAN-ENTRY` failure mode (Implementation requirement 5). |
| `docs/design-system.md` | 1 line | R5 — repointed the `2026-08-0X-task715-…` citation to the real filename. |
| `docs/storybook-governance.md` | 2 lines | R5 — repointed both `2026-08-0X-task710-…` and `2026-08-0X-task724-…` citations (three sites, not the two the backlog originally recorded). |
| `.github/workflows/governance-pr.yml` | +9 lines | R8 — wired `check:assertion-liveness:verify` into the `rendered-proof` job immediately after `check:assertion-liveness`. |
| `docs/backlog.md` | replaced "Last Session" block + task-registry row 721 + Sprint 52 status line | R9–R11, state-only. |
| `docs/sessions/2026-08-08-task721-liveness-gate-arms-and-citations.md` | **new** | This file. |

**Local-only, gitignored (D6), never in the diff:** `.screenshots/task721-evidence/*` (all transcripts
below) and `.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` (R7's reconstruction — confirmed
via `git check-ignore -v`, §7 below).

**Out-of-scope confirmed clean:** no `src/` file, no `check-stories-rendered.mjs`, no `*.stories.{ts,tsx}`
file appears in `git status --porcelain` at any point in this session (§9).

---

## 2. Requirement IDs completed

| Req | AC | Verdict | Evidence |
|---|---|---|---|
| R1 | AC1 | ✅ | `[no-boolean-assertions]` plant → exit 2. `.screenshots/task721-evidence/K4-verify.log`. |
| R2 | AC2 | ✅ | `ORPHAN-ENTRY` plant → exit 1, wording distinct from `STALE-ENTRY` (`.../K4-verify.log`), and the R8 deliberate-break proof independently re-confirms it fails closed (`K7-r8-deliberate-break.log`). |
| R3 | AC3 | ✅ | Every real assertion's `LIVE-THIN` value printed; `heroSearchWrapInBand` = 50.0% (OK), not flagged. `.screenshots/task721-evidence/K3-livethin-real-manifest.log`, restated in §5. |
| R4 | AC4 | ✅ | `npm run check:assertion-liveness:verify` — 6/6 arms pass (negative + `DEAD-NEW` + `STALE-ENTRY` + `BAD-INPUT` + `NO-BOOLEAN-ASSERTIONS` + `ORPHAN-ENTRY` + `LIVE-THIN`), exit 0. `.screenshots/task721-evidence/K4-verify.log`. |
| R5 | AC5 | ✅ | `grep -rn "2026-08-0X" docs/` → only prose mentions in `backlog.md`/`backlog-archive.md` describing the historical defect, zero remaining as an actual citation path; all three repointed targets confirmed on disk before editing. `.screenshots/task721-evidence/K5-citations.log`. |
| R6 | AC6 | **`BLOCKED`** (sub-item only — does not block the task) | No source states what row-50 requires; full search trail in `.screenshots/task721-evidence/K6-row50.md`. |
| R7 | AC7 | ✅ | `I6f-plant-popup-matrix.txt` reconstructed from `20-17/manifest.json`, 12 `false` cells + `failingPopupSlots`, self-labelled as a reconstruction in its first two lines. |
| R8 | AC8 | ✅ | Wired into `governance-pr.yml`; deliberate-break-then-fix proof: broken → `EXIT_CODE=1` (`K7-r8-deliberate-break.log`), restored → `EXIT_CODE=0` (`K7-r8-restored.log`). |
| R9 | AC9 | ✅ | Real manifest exits 0 at every checkpoint after the first edit, incl. the final pass. `.screenshots/task721-evidence/i8-final-real-manifest.log`. |
| R10 | AC10 | ✅ | `npx tsc --noEmit` → 0 errors (`i8-tsc.log`); `npm run build` → exit 0 (`i8-build.log`). |
| R11 | AC11 | ✅ | Two counting-gate passes, §9. |

---

## 3. Current versus required behavior

**Current (before this task):** `check-assertion-liveness.mjs` classified `LIVE`/`DEAD-NEW`/`DEAD-KNOWN`/`STALE-ENTRY`
only. A manifest with zero boolean-shaped keys reported "0 assertions, exit 0" — indistinguishable from a
healthy run. A registry entry naming a `(scope, assertion)` pair absent from the manifest was silently
ignored — never checked, never reported, never failed. An assertion resolving in 4 of 1184 cells and one
resolving in 1184 of 1184 were both simply `LIVE`, with no way to tell a narrow-by-design assertion from
a rotting one. Three documentation citations named session files that never existed
(`2026-08-0X` placeholder never substituted). `.screenshots/task711-evidence/I6f-plant-popup-matrix.txt`
was a 460-byte truncated crash from the wrong run (`20-16`, not `20-17`). `check:assertion-liveness:verify`
existed but ran in no workflow — a broken arm in the gate itself could ship silently.

**Required after (implemented):** A manifest with no boolean-shaped assertion key exits 2 with a
`[no-boolean-assertions]` diagnostic, the same bad-input class as a missing/unparseable manifest. A
registry entry matching no boolean-shaped key anywhere in the manifest exits 1 with an `ORPHAN-ENTRY`
diagnostic, worded distinctly from `STALE-ENTRY` ("names a pair that matches NO … key" vs "claims dead
… but resolved true/false"). Every `LIVE` (and dead) assertion prints a `LIVE-THIN` ratio measured against
cells sharing its own resolved viewport(s) across the whole matrix — not the manifest total — so a
story-specific extra-viewport assertion (`heroSearchWrapInBand`) is judged against its own tiny natural
denominator (8 cells) rather than the 1184-cell total that would flag it as the frailest entry in the
table. `LIVE-THIN` is advisory only (OQ1, §6). All three arms have `PLANTS` entries in `--verify-gate`.
The three citations resolve to real files. `I6f` is a reconstruction, self-labelled as such, containing
the real 12-cell/`failingPopupSlots` data. `check:assertion-liveness:verify` runs in CI immediately after
`check:assertion-liveness`, proven to fail on a deliberately broken arm before being restored.

**Applicable negative flows** (kickoff §11, all "Yes" rows implemented and evidenced): new arm firing on
the real manifest and turning CI red — did not happen, R9 confirms exit 0 throughout (§9's real-manifest
runs) · `LIVE-THIN` flagging `heroSearchWrapInBand` — did not happen, 50.0% > 10% threshold (§5) ·
`LIVE-THIN` implemented as a name allowlist — not implemented that way; the denominator is a measured
viewport-membership property, verified generically against a synthetic 10-story fixture in the `PLANTS`
harness, not against the string `"heroSearchWrapInBand"` anywhere in the source (grepped, §5) ·
`ORPHAN-ENTRY` indistinguishable from `STALE-ENTRY` — distinct wording verified in the plant transcript
(§2, R2) · an arm shipping without a plant — all three have `PLANTS` entries (§2, R4) · "row 50" adopted
from the lead without a source — not adopted; reported `BLOCKED` with the full search trail (`K6-row50.md`)
· `I6f` reconstruction presented as a captured transcript — the file's first two lines state
"RECONSTRUCTION — NOT A CAPTURED TRANSCRIPT" before any data. Locale/i18n and visual regression are
correctly N/A — no `messages/*` change, no `src/` change, no rendered surface touched (`check:i18n` run
anyway as the standing guard, §8).

---

## 4. The LIVE-THIN rule, stated once

**Rule:** for each boolean-shaped assertion, compute the set of manifest viewports at which it ever
resolved non-null (`true`/`false`); the denominator is every cell in the WHOLE manifest (any story) whose
viewport is in that set; the ratio is `liveCount / denominator`. An assertion below **10%** is printed
`⚠️ THIN (advisory, non-blocking)`; the rest print `OK`. This keys on a measurable, per-assertion property
of its own resolved cells — never on the assertion's name — so a story-specific extra viewport (used by
essentially no other story) naturally gets a small, honest denominator instead of being compared against
the manifest's unrelated 1184-cell total.

**OQ1 (severity), decided:** **advisory, non-blocking.** Unlike `DEAD-NEW`/`STALE-ENTRY`/`ORPHAN-ENTRY`
(binary: zero live cells, or a registry entry pointing at nothing), "thin but nonzero" liveness is a
judgment call and the 10% cut line is itself a chosen constant with no historical baseline yet. Making it
CI-blocking today risks a false-positive turning CI red on legitimate variance in a real deployment
(`popupBottomSheetAtMobile` already sits at 18.3%, `fullWidthControlsAtMobile` at 19.7% — both comfortably
above 10% today, but neither so far above it that normal story-count/component-composition churn couldn't
tip one below a blocking line before anyone reviews the change). Advisory keeps the arm honest — it prints,
every run, for every assertion — without that risk. Revisiting to blocking after some real run history
establishes threshold stability is a reasonable follow-up, not raised here as a numbered task.

**Every assertion's value against the real manifest** (`.screenshots/task721-evidence/i8-final-real-manifest.log`):

| Assertion | liveCount | LIVE-THIN denom | Viewport(s) | Ratio | Verdict |
|---|---:|---:|---|---:|---|
| `fullWidthButtonsAtMobile` | 372/1184 | 852 | mobile-320/375/390 | 43.7% | OK |
| `fullWidthControlsAtMobile` | 168/1184 | 852 | mobile-320/375/390 | 19.7% | OK |
| `heroSearchWrapInBand` | 4/1184 | 8 | band-700 | 50.0% | **OK — not flagged** |
| `noHorizontalOverflow` | 1184/1184 | 1184 | all 9 viewports | 100.0% | OK |
| `popupBottomSheetAtMobile` | 156/1184 | 852 | mobile-320/375/390 | 18.3% | OK |

Zero assertions are `THIN` today (proves OQ1's "no current assertion trips it" for the advisory choice too).

---

## 5. R6 — "row 50", BLOCKED

Full search trail: `.screenshots/task721-evidence/K6-row50.md`. Summary: `critical-flow-registry.md` has
0 numbered rows (`grep -c '^| [0-9]* |'`); its physical line 50 ("Listings filter controls") is the same
plausible-but-unconfirmed lead already recorded in `docs/backlog.md`; that line's own text does not
mention either dead assertion this task concerns, does not describe a defect, and does not need a
correction; no standalone Task 710 review document exists anywhere in the repository (only the executor's
implementation session log, which never mentions "row 50"); the sole surviving review-time record
(`docs/backlog-archive.md:22`) states a row-50 fix was requested without stating what it is. Per the
kickoff's own design (§3.5, §15), this sub-item closes `BLOCKED` without failing the task.

---

## 6. R7 — the reconstructed I6f

`.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` replaced (its predecessor was a 460-byte
truncated crash from run `20-16`, the wrong run — see the file's own first paragraph). Source:
`.screenshots/rendered-assert/2026-08-06T20-17/manifest.json` (confirmed present on disk, 1184 cells).
Extraction: `matrix.filter(c => c.assertions.popupBottomSheetAtMobile === false)` → exactly 12 cells, all
`Mantine/Primitives/CopyIdButton/Default`, 4 locales × 3 mobile viewports, all
`failingPopupSlots: ["mantine-Drawer-content[role=\"dialog\"]"]` — matches the kickoff §3.6 description
exactly. First two lines of the file: `RECONSTRUCTION — NOT A CAPTURED TRANSCRIPT.` / reconstruction date
+ source path, before any data line. `git check-ignore -v` confirms the path matches `.gitignore:55`
(`/.screenshots/`) — local-only, never in the diff.

---

## 7. R8 — CI wiring, decided and proven

**Decided: wired.** `check:assertion-liveness:verify` runs entirely in memory against synthetic fixture
manifests — no browser, no dependency on the preceding `screenshots:assert` step's output — so the CI cost
is sub-second (confirmed: `.screenshots/task721-evidence/K4-verify.log` completes near-instantly). This
task adds three new arms to the gate; leaving its own self-test unwired means a future edit could silently
break any of the five arms and CI would never notice — the exact "stopped checking" failure class this
whole gate exists to catch, one layer up (Sprint 52's own thesis).

**Deliberate-break proof (§7.5's requirement):** temporarily replaced the `ORPHAN-ENTRY` exit-code
contribution (`hasBlocking = ... || orphanEntries.length > 0`) with a version that drops the `orphanEntries`
term, ran `check:assertion-liveness:verify` → **`EXIT_CODE=1`**, the `ORPHAN-ENTRY` plant reporting
"expected exit 1, got 0" (`.screenshots/task721-evidence/K7-r8-deliberate-break.log`) — the self-test
genuinely caught the break. Reverted via the exact inverse edit, re-ran → **`EXIT_CODE=0`**
(`.screenshots/task721-evidence/K7-r8-restored.log`), confirmed via `git diff --stat` that the file returned
to its intended shape (161 insertions / 20 deletions relative to the pre-task original — the R1–R4 additions
only, no residue from the break-then-fix cycle) and `node --check` passes.

---

## 8. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` + `git log -1` (pre-write) | clean, HEAD `2089afb8c` | `J0-status.txt` |
| 2 | `npm run check:assertion-liveness` (baseline) | 5 LIVE/0/0/0, `EXIT_CODE=0` | `I1-baseline-liveness.log` |
| 3 | `npm run check:assertion-liveness` (post-R1-R4 real manifest) | 5 LIVE/0/0/0/0, LIVE-THIN printed, `EXIT_CODE=0` | `K3-livethin-real-manifest.log` |
| 4 | `npm run check:assertion-liveness:verify` (post-R1-R4) | 6/6 arms pass, `EXIT_CODE=0` | `K4-verify.log` |
| 5 | `grep -rn "2026-08-0X" docs/` + existence checks | 0 broken citations remain; 3 targets exist | `K5-citations.log` |
| 6 | R8 deliberate-break run | `EXIT_CODE=1`, ORPHAN-ENTRY plant caught it | `K7-r8-deliberate-break.log` |
| 7 | R8 restored run | `EXIT_CODE=0` | `K7-r8-restored.log` |
| 8 | `node --check scripts/check-assertion-liveness.mjs` | 0 errors | inline, this log §"file integrity" |
| 9 | `node -e "JSON.parse(...)"` on registry.json | parses | inline |
| 10 | `npx tsc --noEmit` | 0 errors, `EXIT_CODE=0` | `i8-tsc.log` |
| 11 | `npm run check:i18n` (guard) | parity PASSED, 2218 keys × 4, `EXIT_CODE=0` | `i8-check-i18n.log` |
| 12 | `npm run build` | `EXIT_CODE=0` | `i8-build.log` |
| 13 | `npm run check:assertion-liveness` (final, post all edits incl. R8 workflow wiring) | 5 LIVE/0/0/0/0, `EXIT_CODE=0` | `i8-final-real-manifest.log` |
| 14 | `npm run check:assertion-liveness:verify` (final) | 6/6 arms, `EXIT_CODE=0` | `i8-final-verify.log` |
| 15 | `npm run check:file-integrity` — pass 1 | 5 files clean, `EXIT_CODE=0` | `i8-pass1-file-integrity.log` |
| 16 | `check:file-integrity` + `check:mojibake` — pass 2, last | see §9 | `i9-final-file-integrity.log`, `i9-final-mojibake.log` |

---

## 9. Counting gates (run twice — Task 720 review correction)

**Pass 1** (§8 #15, before this log and the backlog update existed): 5 files clean.

**Pass 2 — after this session log and the `docs/backlog.md` update both exist, path set final:**

**`BACKLOG LIMIT BREACH`:** `docs/backlog.md` was already at 92 lines (against the ~80-line target)
before this session touched it — a pre-existing breach, same as the one Task 710's session flagged and
was not consolidated. This session's edits are net **+2 lines** (92 → 94): the "Last Session" block
replacement and the collapsed task-registry row 721 (long stale detail replaced with a session-log
pointer, shrinking that row) were more than offset by the Sprint 52 status-line and header-date edits.
Flagging for Opus to validate and consolidate during review, per protocol; not fixed here.

`npm run check:file-integrity` — **7 file(s) clean**, `EXIT_CODE=0`
(`.screenshots/task721-evidence/i9-final-file-integrity.log`). `npm run check:mojibake` — **2116** text
files scanned, **0 artifacts**, `EXIT_CODE=0` (`.screenshots/task721-evidence/i9-final-mojibake.log`).

**Reconciliation:** `git status --porcelain` at this point lists exactly **7** paths — 6 modified
(`.github/workflows/governance-pr.yml`, `docs/backlog.md`, `docs/design-system.md`,
`docs/storybook-governance.md`, `scripts/assertion-liveness-registry.json`,
`scripts/check-assertion-liveness.mjs`) + 1 untracked (this session log) — matching
`check:file-integrity`'s "Checking 7 file(s)" exactly. No third pass needed: the path set did not change
between capture and this write-up.

---

## 10. Acceptance-criteria self-audit

| AC | Result | Where verified |
|---|---|---|
| AC1 `[no-boolean-assertions]` exits 2 | ✅ | §2, §8 #4 |
| AC2 `ORPHAN-ENTRY` exits 1, wording distinct | ✅ | §2, §7, §8 #4/#6 |
| AC3 every assertion's LIVE-THIN printed, `heroSearchWrapInBand` not flagged | ✅ | §4 |
| AC4 `:verify` passes with a plant per new arm | ✅ | §8 #4/#14 |
| AC5 no `2026-08-0X` citation, targets exist | ✅ | §8 #5 |
| AC6 "row 50" resolved or `BLOCKED` with searches | ✅ (`BLOCKED`, by design) | §5 |
| AC7 `I6f` = 12 cells + `failingPopupSlots`, self-labelled reconstruction | ✅ | §6 |
| AC8 `:verify` CI question answered | ✅ (wired + proven) | §7 |
| AC9 real manifest exit 0 | ✅ | §8 #3/#13 |
| AC10 `tsc`/`build` exit 0 | ✅ | §8 #10/#12 |
| AC11 two counting passes reconcile to `git status` | ✅ | §9 |

## 11. Assumptions, deviations, limitations

- R6 ("row 50") closes `BLOCKED` per the kickoff's own explicit allowance (§3.5/§15) — this does not
  block the rest of the task.
- `LIVE_THIN_THRESHOLD = 0.10` (10%) is a chosen constant, not derived from any historical baseline
  beyond "below every real assertion's ratio today" — stated as advisory precisely because of this (§4,
  OQ1).
- `BACKLOG LIMIT BREACH` — pre-existing (92 → 94 lines), flagged not fixed (§9).
- No other deviations from the kickoff. R1–R11 all evidenced above.

## 12. Self-validation verdict

`Self-validation: tsc=0 errors · build=passes · AC table=all green (R6 sub-item correctly BLOCKED per
kickoff design) · scope=clean (7 paths, all task-owned, zero src/ or story files) · integrity=PASS
(file-integrity 7/7, mojibake 0/2116) · gate self-proof=PASS (6/6 verify-gate arms + R8 deliberate-break
round trip)`

---

## 13. Opus handoff

**Evidence root:** `.screenshots/task721-evidence/` (local-only, gitignored per D6) — every transcript
named in §§2–9 lives there. R7's reconstruction lives at its original path,
`.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` (also gitignored).

**Questions/risks for review:**
1. Confirm the `LIVE-THIN` denominator design (viewport-membership across the whole matrix, §4) is the
   intended reading of the kickoff's "measurable property, not name" requirement — it is one valid
   construction, not the only one the kickoff's withheld mechanism could have meant.
2. Confirm OQ1's advisory/non-blocking decision (§4) is the right call versus making it blocking with the
   10% floor — both are defensible; I chose the lower-risk option given no historical threshold data.
3. R6 "row 50" is `BLOCKED` (§5) — confirm this is acceptable per the kickoff's own design rather than a
   gap needing a follow-up task.
4. `docs/backlog.md`'s pre-existing `BACKLOG LIMIT BREACH` (94 lines) needs Opus consolidation — not
   introduced by this session, not fully resolved by it either (§9).
5. The R8 deliberate-break-then-restore cycle touched `scripts/check-assertion-liveness.mjs` twice more
   after the R1–R4 edits — `git diff --stat` was checked immediately after the revert (161 insertions/20
   deletions, matching only the intended R1–R4 additions) but an independent read of the final file is
   worth the extra minute given how easy a stray planted-break line would be to miss.

