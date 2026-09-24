# Task 721 — Give the liveness meta-gate its three missing arms, and close 710's citation residue

**Sprint 52 — Gates that stopped checking, position 52.3.** Folds Task **728**.
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_52_Task_721_execution_contract.md` · `Sprint_52_Task_721_rule_compliance_ledger.md`.

> Task 710 built a meta-gate that detects a *dead* assertion. Its own review named three states it cannot detect
> and one class of stale citation it left behind. This task closes all four, plus 728's lost transcript.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate extension (non-product script) + documentation citation fixes
+ one evidence re-capture. No `src/` change. No Storybook story ships.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`check-assertion-liveness.mjs` currently answers one question — "is this assertion dead?" Teach it the three
adjacent questions 710's review raised, prove each with a plant, repoint three citations that name files which do
not exist, and close 728 by reconstructing the one transcript that was lost.

---

## 3. Verified context — read from the repository 2026-08-08

### 3.1 The gate, and where it runs

`scripts/check-assertion-liveness.mjs` classifies each boolean assertion `LIVE` / `DEAD-NEW` / `DEAD-KNOWN` /
`STALE-ENTRY` (header comment, `:18-23`). Exit codes today: **0** clean · **1** blocking state · **2** bad input.

It **is CI-blocking**: `.github/workflows/governance-pr.yml:168` runs `npm run check:assertion-liveness`.

**Its own self-test is not.** `check:assertion-liveness:verify` (`--verify-gate`, the `PLANTS` harness at `:304`)
appears in **no** workflow. A broken arm would therefore pass CI silently. §7.5 makes this a measured decision
rather than an assumption.

### 3.2 The three states it cannot detect — none exists in the file today

`grep` for `no-boolean-assertions`, `ORPHAN-ENTRY` and `LIVE-THIN` across the script returns **0**. All three are
new.

| Arm | Required exit | What it must catch |
|---|---|---|
| `[no-boolean-assertions]` | **2** (bad input) | A manifest in which *no* key is boolean-shaped at all — today that scans clean and reports "0 assertions", which is indistinguishable from a healthy run |
| `ORPHAN-ENTRY` | **1** (blocking) | A registry entry naming a `(scope, assertion)` pair that does not appear in the manifest at all — distinct from `STALE-ENTRY`, which is an entry whose assertion came *back to life* |
| `LIVE-THIN` | owner-decided, see §7.3 | An assertion technically `LIVE` but resolving in so few cells that its liveness is not meaningful coverage |

`scripts/assertion-liveness-registry.json` is currently `{"entries": []}`. **ORPHAN-ENTRY has nothing live to fire
on**, so it can only be proven by a plant.

### 3.3 LIVE-THIN's live ratios now exist — and they contain a trap

The backlog blocked this sub-item on "needs 711's live ratios first". Task **722**'s run produced them
(`.screenshots/task722-evidence/K6-liveness.log`, 2026-08-08):

| Assertion | Resolved | of 1184 |
|---|---:|---:|
| `noHorizontalOverflow` | 1184 | 100% |
| `fullWidthButtonsAtMobile` | 372 | 31.4% |
| `fullWidthControlsAtMobile` | 168 | 14.2% |
| `popupBottomSheetAtMobile` | 156 | 13.2% |
| **`heroSearchWrapInBand`** | **4** | **0.34%** |

**The trap: `heroSearchWrapInBand` is narrow by design, not by rot.** Task 573 added exactly one extra viewport for
exactly one story — `MANTINE_STORY_EXTRA_VIEWPORTS.HeroSearch = [{ name: 'band-700', width: 700, height: 812 }]`
(`check-stories-rendered.mjs:417`) — and the assertion is `640<=width<768`-only. Its applicable set is 4 locales ×
1 viewport = **4 cells**, so it resolves in **4 of 4 applicable**, i.e. 100%.

Any threshold keyed to the 1184 total flags the healthiest assertion in the table. A threshold that does not flag
it must be keyed to something else. **This kickoff does not say what** — §7.3 assigns that derivation to you.

### 3.4 The stale citations — the backlog says two, there are three

All three name a session file that does not exist (`2026-08-0X` was never substituted). The real filenames are in
`docs/sessions/` and were confirmed 2026-08-08:

| Citation site | Names | Actual file |
|---|---|---|
| `docs/design-system.md:1086` | `2026-08-0X-task715-…` | `2026-08-06-task715-design-tokens-strict-flip-and-remediation.md` |
| `docs/storybook-governance.md:1586` | `2026-08-0X-task710-…` | `2026-08-05-task710-assertion-liveness-meta-gate.md` |
| `docs/storybook-governance.md:1883` | `2026-08-0X-task724-…` | `2026-08-07-task724-fullwidth-buttons-13-story-adjudication.md` |

Verify each target exists before repointing; do not trust this table over the filesystem.

### 3.5 F3's "row 50" — a concrete lead, not an answer

710's review named a `critical-flow-registry` "row 50" that the backlog records as unresolvable. Measured
2026-08-08: `docs/critical-flow-registry.md` has **0** numbered table rows (`grep -c '^| [0-9]* |'`), but its
**line 50** is the "Listings filter controls — leaf sub-components + shell (Mantine)" entry.

That is a plausible referent and nothing more. Confirm it against 710's own review text or session log. If it
cannot be confirmed from a source, report `BLOCKED` on this sub-item — **do not adopt the lead as the answer
because it is convenient.** The rest of the task proceeds regardless; this sub-item alone may close as `BLOCKED`.

### 3.6 Folded 728 — the lost transcript

`.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` is a **460-byte truncated crash** from manifest run
`2026-08-06T20-16`. The run Task 711 actually cites is `20-17`, whose transcript never existed.
**`.screenshots/rendered-assert/2026-08-06T20-17/` still exists on this machine** (confirmed 2026-08-08).

**The claim itself is not in doubt** — 711's reviewer read `popupBottomSheetAtMobile = false × 12` with
`failingPopupSlots: ["mantine-Drawer-content[role=\"dialog\"]"]` straight out of `20-17/manifest.json`. R7 asked for
four transcripts and three exist. This is bookkeeping, and it is cheap.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2 | `[no-boolean-assertions]` exits **2** on a manifest with no boolean-shaped key | P0 | Plant + transcript | Confirmed |
| R2 | §3.2 | `ORPHAN-ENTRY` exits **1** on a registry entry absent from the manifest, and is distinguishable from `STALE-ENTRY` in the output | P0 | Plant + transcript | Confirmed |
| R3 | §3.3 | A `LIVE-THIN` rule exists whose threshold **does not** flag `heroSearchWrapInBand`, with the reason stated | P0 | Real-manifest run | Confirmed |
| R4 | §3.2 | Each new arm is added to the `--verify-gate` `PLANTS` harness with its expected exit code | P0 | `:verify` transcript | Confirmed |
| R5 | §3.4 | All three `2026-08-0X` citations point at files that exist | P0 | Grep + existence check | Confirmed |
| R6 | §3.5 | "row 50" is resolved against a source, or reported `BLOCKED` with what was searched | P1 | Session log | Confirmed |
| R7 | §3.6 | `I6f` is re-captured from the surviving `20-17` data, and the artifact states it is a reconstruction with its source | P1 | The file itself | Confirmed |
| R8 | §3.1 | Whether `:verify` should be CI-wired is answered in writing — wired, or reasoned and reserved | P1 | Workflow diff or session log | Confirmed |
| R9 | Standing | The real manifest still exits 0 after every change; CI is never left red | P0 | Transcript | Confirmed |
| R10 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R11 | Standing | Counting gates run last, after the session log and backlog row exist | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: snapshot `git status --porcelain` before the first write, classify every entry,
  before/after content witnesses for pre-existing modified paths.
- **A2.** `.screenshots/` is gitignored (D6, `.gitignore:55`), so R7's artifact is **local-only** and will not
  appear in the diff. Say so in the session log rather than letting a reviewer hunt for it in `git status`.
- **A3.** The 722 ratios in §3.3 are a **2026-08-08 snapshot**. Re-run the gate and use your own numbers; if they
  differ, yours win and the difference is reported.
- **OQ1 — genuinely open, decide and record.** `LIVE-THIN` may be advisory (report-only) or blocking. It is the
  only new arm whose severity is not already implied by an exit code, and this gate is CI-blocking. Choose, state
  the reason, and if blocking, prove no current assertion trips it.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q4` row
- `scripts/check-assertion-liveness.mjs` — the whole file, especially `:18-23`, `:250-300` (exit assembly),
  `:304-365` (`PLANTS` / `--verify-gate`)
- `scripts/assertion-liveness-registry.json`
- `scripts/check-stories-rendered.mjs:404-425` — `MANTINE_STORY_EXTRA_VIEWPORTS`, the source of §3.3's trap
- `.github/workflows/governance-pr.yml:160-175`
- `docs/sessions/2026-08-05-task710-assertion-liveness-meta-gate.md` — the four findings, in their original words
- `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md` — §10

---

## 7. Scope

### 7.1 R1/R2 — the two exit-code arms

Both are new states, not re-labelled existing ones. `ORPHAN-ENTRY` must be distinguishable from `STALE-ENTRY` in
the printed output: one says "your entry names something that isn't there", the other says "your entry's assertion
came back to life". A reader who cannot tell them apart from the log has an arm that does not help.

### 7.2 R4 — extend the self-test, do not bypass it

`--verify-gate` already runs plants with `expectExitCode` (`:347-362`). Every new arm gets an entry there. An arm
with no plant in that harness is not shipped.

### 7.3 R3 — derive the LIVE-THIN rule, and defend it against §3.3

**The mechanism is deliberately not specified here.** What is specified is the test it must pass: it must not flag
`heroSearchWrapInBand`, and the reason must be a property of the assertion, not an exception carved for its name.
An allowlist entry naming `heroSearchWrapInBand` is a fail — that is the author-appliable exemption 724 F1 closed
and 726 removed. Whatever you derive, state the rule, run it against the real manifest, and show every assertion's
value under it.

### 7.4 R5/R6 — the documentation residue

Repoint the three citations after confirming each target exists. For "row 50", search 710's review text and
session log; §3.5's lead is a candidate to test, not a conclusion to adopt.

### 7.5 R8 — the self-test's own CI status

Answer it. Wiring `check:assertion-liveness:verify` into `governance-pr.yml` is a one-line addition next to
`:168`, and this task is the moment the question is live because it is adding three arms the self-test protects.
If you wire it, prove it fails on a deliberately broken arm before you fix it back. If you do not, record why and
reserve a number.

### 7.6 R7 — the folded 728

Reconstruct `I6f` from `20-17`'s surviving manifest. The artifact must state, in its own first lines, that it is a
**reconstruction dated 2026-08-08 from `20-17/manifest.json`**, not a captured run transcript. A reconstruction
labelled as a transcript is how the original defect happened.

---

## 8. Out of scope

Any `src/` file · `check-stories-rendered.mjs`'s assertions (52.1 closed, 52.4 and 52.5 own the rest) · the
`--mantine-only` matrix and its 16 pre-existing FAIL cells · remediating anything 734 reserved · wiring
`check:click-shield` (727, parked on OQ2/OQ3) · re-running the 1184-cell sweep, which this task does not need.

---

## 9. Current and required behavior

**Current.** The meta-gate detects dead assertions and nothing else. A manifest with no boolean keys reads as
healthy. A registry entry pointing at nothing is silent. An assertion alive in 4 cells and one alive in 1184 are
both simply `LIVE`. Three documentation citations name files that do not exist, and one 711 transcript is a
truncated crash from the wrong run.

**Required.** Each of the three states is detected, exits with its own code, and is provable by a plant in the
gate's own harness. The real manifest still exits 0. The citations resolve. `I6f` exists and is honestly labelled.

---

## 10. Implementation requirements

1. No new state silently reuses an existing exit code where its severity differs — say which code and why.
2. `LIVE-THIN` keys on a measurable property, never on an assertion's name.
3. The real-manifest run stays exit 0 at every checkpoint after the first edit.
4. Every new arm has a `PLANTS` entry; `check:assertion-liveness:verify` passes.
5. The registry file's `$schema-note` is updated if the entry semantics change; a note that no longer describes the
   behaviour is worse than none.

---

## 11. Positive and negative flows

**Positive.** A healthy manifest exits 0 with five `LIVE` assertions; a manifest with no boolean keys exits 2; an
orphan registry entry exits 1 naming the entry to delete; `heroSearchWrapInBand` is not flagged.

| Negative flow | Applicable | Why |
|---|---|---|
| A new arm fires on the real manifest and turns CI red | **Yes** | R9 — the gate is CI-blocking at `:168` |
| `LIVE-THIN` flags `heroSearchWrapInBand` | **Yes** | §3.3 — the assertion is narrow by design |
| `LIVE-THIN` is implemented as a name allowlist | **Yes** | 724 F1: an exemption the author applies, not one the gate evaluates |
| `ORPHAN-ENTRY` indistinguishable from `STALE-ENTRY` in output | **Yes** | An arm nobody can act on |
| An arm ships without a plant | **Yes** | R4; the gate's own harness exists precisely for this |
| "row 50" adopted from §3.5's lead without a source | **Yes** | R6 requires a source or `BLOCKED` |
| `I6f` reconstruction presented as a captured transcript | **Yes** | Repeats the exact defect 728 exists for |
| Locale / i18n regression | No | No `messages/*` change; parity run as a guard |
| Visual / layout regression | No | No `src/` change; no rendered surface touched |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given a manifest with no boolean-shaped key, then the gate exits **2** with a `[no-boolean-assertions]` diagnostic.
- **AC2 [R2]** Given a registry entry naming a pair absent from the manifest, then the gate exits **1** with an `ORPHAN-ENTRY` diagnostic distinguishable in wording from `STALE-ENTRY`.
- **AC3 [R3]** Given the real manifest, then every assertion's `LIVE-THIN` value is printed, `heroSearchWrapInBand` is **not** flagged, and the rule keys on a measurable property named in the session log.
- **AC4 [R4]** Given `npm run check:assertion-liveness:verify`, then it passes with a `PLANTS` entry for each new arm.
- **AC5 [R5]** Given a repo-wide grep, then `2026-08-0X` appears in no citation, and each repointed target exists on disk.
- **AC6 [R6]** Given the "row 50" investigation, then it is resolved with a quoted source, or `BLOCKED` with the exact searches run.
- **AC7 [R7]** Given `I6f-plant-popup-matrix.txt`, then it contains the 12 `false` cells with their `failingPopupSlots`, and its first lines state it is a 2026-08-08 reconstruction from `20-17/manifest.json`.
- **AC8 [R8]** Given the session log, then the `:verify` CI question is answered — wired with a proven failing arm, or reasoned and reserved under a number.
- **AC9 [R9]** Given the real manifest, then `npm run check:assertion-liveness` exits **0** at the end.
- **AC10 [R10]** `npx tsc --noEmit` exit 0 and `npm run build` exit 0.
- **AC11 [R11]** Two counting-gate passes, the second after the session log and backlog row exist, reconciling exactly to `git status --porcelain`.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** The gate is CI-blocking (`governance-pr.yml:168`) and the task's entire
substance is planted-violation proof of new blocking arms — the clause Q4 owns.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` (pre-write) | A1 manifest |
| 2 | `npm run check:assertion-liveness` (baseline) | exit 0, five `LIVE` |
| 3 | Plant: no-boolean manifest → gate | exit **2**, `[no-boolean-assertions]` |
| 4 | Plant: orphan registry entry → gate | exit **1**, `ORPHAN-ENTRY` |
| 5 | `npm run check:assertion-liveness` (real, post-change) | exit 0; `LIVE-THIN` values printed; `heroSearchWrapInBand` clean |
| 6 | `npm run check:assertion-liveness:verify` | passes, incl. the new plants |
| 7 | `grep -rn "2026-08-0X" docs/` + existence check on each target | no citation hits; all targets exist |
| 8 | `npx tsc --noEmit` | exit 0 |
| 9 | `npm run check:i18n` | exit 0 (guard) |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `check:file-integrity` + `check:mojibake`, twice | AC11 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R11 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root (`.screenshots/task721-evidence/`, local-only per D6) · assumptions,
deviations, limitations · unresolved issues. State the `LIVE-THIN` rule in one sentence and every assertion's value
under it. Then update `docs/backlog.md` — **replacing** the "Last Session" block, not appending to it — and write
`docs/sessions/<date>-task721-liveness-gate-arms-and-citations.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **every count, line number and filename here was read from the repository on
2026-08-08** · the one value that must not come from the orchestrator (§7.3's `LIVE-THIN` mechanism) is explicitly
withheld, with the test it must pass stated instead · §3.5's "row 50" lead is framed as a candidate with an
explicit instruction not to adopt it for convenience, and its sub-item may close `BLOCKED` without failing the task ·
the backlog said two stale citations and the measured number is three · the `:verify`-not-in-CI gap was measured,
not assumed · both the empty-registry and populated-registry cases are covered by distinct ACs · the dirty-worktree
manifest is required rather than assumed · the report contract names the append-vs-replace defect 717 hit.
