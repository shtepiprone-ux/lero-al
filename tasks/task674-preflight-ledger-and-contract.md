# Task 674 — preflight evidence artifact: rule-compliance ledger + executable-route contract

**Status: `BLOCKED — ONE UNRESOLVED OWNER DECISION (OQ4, global rule 7)`.
Sixth full recomputation, 2026-07-27**, against the current text of
`tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md`, the current governing rule files —
`orchestrator-evidence-first-preflight.md`, `orchestrator-execution-contract-template.md` §§1–4,
`orchestrator-rule-compliance-ledger-template.md` rules 1–7, `agent-contract.md` clauses 9/10/14, and
`ai-behavior.md` L670–703 — and a fresh inspection of `HEAD`. Recomputed from scratch per ledger rule 5, not
edited.

**What changed since the fifth recomputation.** Three defects in CP5b, the checkpoint carrying AC7. It masked
`SCAN_DIR_PREFIXES` away entirely, so a **replaced** entry (`'messages/'` → `'foo/'`) passed it — and passed
CP4 and CP5 too, since both compare against the *edited* constant. It also called itself "byte-for-byte" while
reading both sides through `Get-Content` + `-join`, which normalizes line endings and, in Windows PowerShell
5.1, decodes with the ANSI code page: a property asserted but not measured. CP5b is now three parts —
index-wise prefix preservation, an EOL precondition that **stops** rather than degrades, and a genuine
raw-byte masked comparison — and the same ANSI-decoding fault was swept out of every other repo-file read
(F41–F44). Ledger rows 1, 5, 10, 13, 22 and 25 recomputed against the new evidence; row totals unchanged.

**What changed in the fifth recomputation.** The owner issued a task-specific exception removing
`docs/backlog.md` from the write set (kickoff §3.6, quoted in full). That closes **OQ5** (which line metric
governs clause 10) and **OQ6** (`ai-behavior.md` L694's "replace the Last Session block") for this task, because
neither conflict has a subject once the file is out of scope. The write set drops from six paths to **five**;
AC9 and the old backlog checkpoint are deleted; a new content-witness pair (CP1 + CP14, AC9d) proves the file
is left byte-identical, because the preflight is explicit that an equal `git status` cannot carry that claim.
`docs/backlog-archive.md` and the session log remain mandatory by the owner's own wording.

Governs: `tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md`, a **blocked decision note**. It
must not be handed to an executor.

Retained per `orchestrator-execution-contract-template.md` §4.

Encoding note: every mojibake artifact in this file is named by codepoint, never reproduced, because `tasks/`
is inside the `check:mojibake` scanned set.

---

## A. The blocking item

### OQ4 — `orchestrator-rule-compliance-ledger-template.md` rule 7 phase semantics

> *"A disclosed limitation, planned future check, manual transcription, or statement that a risk is out of
> scope is not `COMPLIANT` evidence for a mandatory rule. The row stays `BLOCKED` unless its required
> observable has the required present-tense artifact and failure semantics."*

Read literally, **"planned future check" blocks every row whose observable is produced by an executor
command**, because at `TASK DESIGN` no executor command has run. L31–33 then forbids publication.

**No local reinterpretation is applied.** An earlier version proposed a design-obligation / runtime-outcome
phase distinction and re-scored rows against it — an unauthorized amendment of a global template by a local
file, barred by ledger rules 2 and 3. **Retracted and not restored.** Only the owner can settle it.

### Closed since the previous recomputation

| Was | Now | Basis |
|---|---|---|
| **OQ5** — `agent-contract.md` clause 10 "80 lines" vs `ai-behavior.md` L703 "~80 active-content lines" | **Closed for this task** | Owner exception 2026-07-27: `docs/backlog.md` is out of scope and is not measured. The conflict remains live for the deferred `BACKLOG LIMIT BREACH` work |
| **OQ6** — additive-only vs `ai-behavior.md` L694 | **Closed for this task** | Same exception: with no backlog edit, L694's replacement step has no subject here. Live for the deferred work |

The owner's exception is explicit that it does **not** reach `docs/backlog-archive.md` or the session log;
both remain mandatory and are enforced by CP10 and CP11.

### Totals under both readings of rule 7

| Reading | Rows resting on a planned executor check | `COMPLIANT` | `NOT APPLICABLE` | `BLOCKED` |
|---|---|---|---|---|
| **B — rule 7 as written today (operative)** | `BLOCKED` | **9** | 3 | **14** |
| A — proposed phase distinction (**not in force**) | design obligation satisfied; runtime outcome unproven | 22 | 3 | **1** (row 21, the question itself) |

Under reading A the only remaining `BLOCKED` row is rule 7 itself. **OQ4 is now the single gate between this
task and a publishable handoff.**

---

## B. Unwaivable rule-compliance ledger (full recomputation, 26 rows)

Result column: `B / A` where the two readings differ; a single value means both readings agree.

| # | Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|---|
| 1 | `agent-contract.md` P0.1 — scope stays bounded | task defines a write set | change only what the task requires; no drive-by edits | §7 names exactly five paths; CP15 rejects any other path **and explicitly rejects `docs/backlog.md`**; **CP5b.1** proves the `HEAD` prefix entries survive at their original indices with one append, and **CP5b.3** proves raw-byte identity outside the two permitted regions, under the **CP5b.2** EOL precondition. Bounded-ness is now measured inside the edited literal as well as outside it (F41) | `COMPLIANT` |
| 2 | `agent-contract.md` P0.2 — no invented architecture or facts | task asserts line numbers, counts, two owner decisions | do not invent; stop and ask when a decision is missing | line numbers re-confirmed at `HEAD`; counts re-derived; **both** owner decisions quoted in full with source and scope, and their interaction stated (§7.1 supersession note) rather than silently resolved | `COMPLIANT` |
| 3 | `agent-contract.md` clause 9 — validation evidence | non-Q0 task | final `npm run build`, exit 0, transcript | CP9 with a real `if ($LASTEXITCODE -ne 0) { throw }` and a persisted transcript | `BLOCKED` / `COMPLIANT` |
| 4 | `agent-contract.md` clause 10 — session evidence, backlog, git ownership | every completed implementation task | update `docs/backlog.md`; session log with a "Files Changed" table matching the real diff; flag `BACKLOG LIMIT BREACH` when it cannot keep the file at or below 80 lines; no mutating git | **The backlog and breach-flag obligations are waived for Task 674 by the owner exception of 2026-07-27** (row 26). The remaining obligations stand and are enforced: CP11 asserts the session log's existence, header, "Files Changed" table and coverage; §14 forbids mutating git. The waiver's own condition — the file must end byte-identical — is enforced by CP1 + CP14 | `BLOCKED` / `COMPLIANT` |
| 5 | `agent-contract.md` clause 14 — file integrity and encoding | task writes five text files | UTF-8, no BOM, no NUL, parseable | CP13 with the shared `$Utf8Strict` decoder over all five written paths, persisting a per-file record. **Every other repo-file read in the plan now uses the same strict decoder** (`Read-Utf8Text`/`Read-Utf8Lines`), so no comparator operates on ANSI-mangled text (F44). `docs/backlog.md` is not "touched" and is covered by AC9d instead | `BLOCKED` / `COMPLIANT` |
| 6 | `agent-contract.md` clause 15 — critical flows | — | regression proof if the registry is touched | §3.5: no `critical-flow-registry.md` entry involved | `NOT APPLICABLE` |
| 7 | `rule-index.md` — Docs/Governance/Task Template bundle | governance-script task | read the named minimal bundle | §6 names it exactly, with `docs/backlog.md` marked **read-only for project state**; UI bundle excluded with a reason | `COMPLIANT` |
| 8 | `qa-profiles.md` **L13** — `Q1 Targeted` | non-UI: one script, its allowlist, three docs | targeted commands, typecheck, final build exit 0, mojibake/file-integrity for touched text | CP3–CP15 | `BLOCKED` / `COMPLIANT` |
| 9 | `qa-profiles.md` **L16** — planted-violation failure proof when a gate is claimed | this task claims a gate | observed failure, then clean recovery | AC6(a)/(b) via CP6/CP7: exit exactly 1, the gate's own `FAILED` banner, a report line naming the probe, then exit 0 recovery | `BLOCKED` / `COMPLIANT` |
| 10 | `qa-rules.md` "Encoding hygiene" L68–82 | the rule this task changes | documented scope must match enforced scope | CP5 parses **only** that section — now read with the strict UTF-8 decoder, since the section is dense with non-ASCII and an ANSI read would have corrupted it (F44) — and compares its bare-directory tokens to `SCAN_DIR_PREFIXES` in both directions, plus required `SIGNATURES` and `L232` tokens. Note the scope this proves: agreement with the **edited** constant; that the constant itself is a faithful extension of `HEAD` is CP5b.1's job | `BLOCKED` / `COMPLIANT` |
| 11 | `execution-contract-template.md` §1 — one active execution route | owner chose route 2 | exactly one active route; **regenerate every route-dependent scope, AC, verification step, report requirement and handoff together** after an owner decision | The backlog exception is a route-affecting decision, so §7, §8, §10, §11, §12, §13, §14 and §15 were regenerated together, not patched; no alternative route appears in the execution plan | `COMPLIANT` |
| 12 | `execution-contract-template.md` §2 — zero/empty form of every dynamic count | `$expectedScripts`, scanned counts, final path set | test zero/empty and non-empty; a valid zero must not read as missing | CP2 runs an empty-set control and rejects a zero `$expectedScripts`; CP1 requires a valid empty start and persists a **zero-length** artifact | `BLOCKED` / `COMPLIANT` |
| 13 | `execution-contract-template.md` §2 — producer, persisted artifact, comparator, failure behavior per checkpoint | every asserted result | name producer and artifact; "compare"/"quote"/"confirm" is not a comparator; a comparator must be able to **reject the counterexample** | §D: **19 of 19** checkpoints have all four. CP5b is now three sub-checkpoints, each with its own persisted artifact (`cp5b1.txt`, `cp5b2.txt`, `cp5b3.txt`); the previous single form could not reject the `'messages/'` → `'foo/'` counterexample and so did not meet the template's own standard (F41) | `BLOCKED` / `COMPLIANT` |
| 14 | `execution-contract-template.md` §4 — fresh final-document-only pass | pre-handoff | rebuild route, write set and checkpoint matrix without relying on revision summaries | Performed 2026-07-27 against the regenerated document; §D and §E are its output; it found F40 | `COMPLIANT` (process; its output is `BLOCKED`) |
| 15 | `evidence-first-preflight.md` — verify write-scope viability | five required write paths, one required-untouched path | record status per path; never require and forbid the same path | All five `CLEAN` in a zero-entry worktree from `HEAD`; `$fivePaths` defined once at CP-E and reused by CP11, CP13, CP15; `$untouched` is named once and is forbidden in §7, §8, CP14 and CP15 consistently — no path is both required and forbidden | `COMPLIANT` |
| 16 | `evidence-first-preflight.md` — authorize exceptions with a traceable owner decision | route 2, and the `docs/backlog.md` waiver | quote or precisely reference the actual decision, date and scope; otherwise `BLOCKED -- OWNER DECISION REQUIRED` | Both decisions quoted in full at §7.1 and §3.6, each with source, date and Task-674-only scope. Neither is read as authorizing anything about rule 7 | `COMPLIANT` |
| 17 | `evidence-first-preflight.md` — stateful measurement timing | session log and both probes enter the scanned set | enumerate every task-created file that can enter a measurement and fix creation order | CP4 precedes the session log (CP11); probes exist only inside `try`/`finally`; AC1 states all three counts and the `+1`; the two already-tracked doc files are count-neutral; `docs/backlog.md` is not written at all; CP0.1 keeps the kickoff out; all evidence lives outside the worktree (CP-E) | `BLOCKED` / `COMPLIANT` |
| 18 | `evidence-first-preflight.md` — attempt falsification; label `EXECUTED` only for an observed run | material claims | record the counterexample and its result; do not relabel an untested assumption | §E: **13 rows, all `ANALYTICAL`**, each naming its inspected source | `BLOCKED` / `COMPLIANT` |
| 19 | `dirty-worktree-manifest-template.md` L10–11 — manifest replaceable by proven isolated clean execution | route 2 | record the worktree's creation and location **and** a zero-entry starting porcelain | CP0 (path, branch, sha with a `throw`, persisted) and CP1 (zero-length raw-byte porcelain via `Invoke-GitBytes`); CP0.1 proves the task artifacts were not copied in | `BLOCKED` / `COMPLIANT` |
| 20 | `CLAUDE.md` git policy | task needs `git worktree add` | mutating git is owner-only, native PowerShell | §7.1 assigns worktree creation to the owner; §14 forbids the executor from running, emitting or suggesting any mutating git command | `COMPLIANT` |
| 21 | `orchestrator-rule-compliance-ledger-template.md` **rule 7** | this ledger | a planned future check is not `COMPLIANT` evidence | **Unresolved (OQ4).** Determines rows 3, 4, 5, 8, 9, 10, 12, 13, 17, 18, 19, 22, 25 | **`BLOCKED`** |
| 22 | `ai-behavior.md` **L696 + L702** — archive ledger row | the task creates a session file | add a row at the TOP of `docs/backlog-archive.md`; *"DO NOT create a session file without adding a row to the ledger"* | §10.5 + CP10: exactly one added row, dated, naming `Task 674`, linking the session file, asserted to be the first data row after the separator. Both sides now read as UTF-8 (`Invoke-GitBytes` + `Read-Utf8Lines`); the ledger's existing rows are full of non-ASCII, so the previous ANSI-decoded `Compare-Object` could have reported spurious differences (F44). **Explicitly preserved by the owner exception** | `BLOCKED` / `COMPLIANT` |
| 23 | `ai-behavior.md` **L694** — replace the previous "Last Session" block | the task closes a session | replace that block with a 2–4 line summary | **`NOT APPLICABLE`** — `docs/backlog.md` is outside the write set by the owner exception of 2026-07-27 (row 26), so there is no backlog update for L694 to shape. The rule is unchanged and still applies to any task that does edit the file | `NOT APPLICABLE` |
| 24 | `agent-contract.md` clause 10 "80 lines" vs `ai-behavior.md` **L703** "~80 active-content lines" | the task edits `docs/backlog.md` | one threshold must govern the breach flag | **`NOT APPLICABLE`** — the task does not edit or measure the file. The owner deferred `BACKLOG LIMIT BREACH` to separate future work; the metric conflict is unresolved but is that work's problem, not this task's | `NOT APPLICABLE` |
| 25 | `ai-behavior.md` **L689–692, L697, L700** — session file shape | the task creates a session file | `docs/sessions/YYYY-MM-DD-<slug>.md`; header `# Session Archive: <Description> — YYYY-MM-DD`; full detail here; never paste session logs into a backlog file | §7 path 5, §10.6, and **CP11's comparator**: existence, exact path, L691 header regex, `Files Changed` table, all five paths named, the `byte-identical` backlog record, `CP0`–`CP15` and `R1`–`R12` coverage. The header regex tests an em dash (U+2014), so CP11 now reads the log with the strict UTF-8 decoder — under the previous ANSI read the header check could have failed on a correct file (F44) | `BLOCKED` / `COMPLIANT` |
| 26 | `orchestrator-rule-compliance-ledger-template.md` rule 2 + `evidence-first-preflight.md` "Authorize exceptions" — an owner-only rule may be waived only by a quoted owner decision | the task waives the clause-10 backlog obligation | quote or precisely reference the owner's actual decision, its date, exact scope, and any follow-up owner | §3.6 quotes the owner's message in full; date 2026-07-27; scope "Task 674 only"; the deferred `BACKLOG LIMIT BREACH` work is named as the follow-up. The waiver's condition (byte-identical) is enforced by CP1 + CP14, not assumed | `COMPLIANT` |

**Reading B (operative):** `COMPLIANT` 9 (rows 1, 2, 7, 11, 14, 15, 16, 20, 26), `NOT APPLICABLE` 3
(rows 6, 23, 24), `BLOCKED` 14.
**Reading A (not in force):** `COMPLIANT` 22, `NOT APPLICABLE` 3, `BLOCKED` 1 (row 21).

**Publication as an executor handoff remains forbidden — solely because of row 21.**

---

## C. Executable task contract — §1 one active execution route

| Field | Value |
|---|---|
| Task | 674 — `check:mojibake` `scripts/` coverage gap |
| Active route / owner decision | **Route 2 — clean isolated worktree from `HEAD`**, with `docs/backlog.md` **excluded** by the later owner exception |
| Decision source, date, scope | (1) Route: owner message, session "Task 668 revision 7 review", 2026-07-27, Task 674 only — kickoff §7.1. (2) Backlog exception: owner message to the orchestrator, 2026-07-27, Task 674 only — kickoff §3.6. Decision (2) supersedes decision (1)'s backlog clause; both are quoted in full |
| Starting worktree mode | **clean isolated** — `C:\Claude_Code_Projects\lero-al-task674` @ `f80550f35399a16d7c4df29f8a39a2d85ebe7d9e`, owner-created |
| Exact allowed final write set | `scripts/check-mojibake.mjs`, `scripts/mojibake-allowlist.json`, `docs/qa-rules.md`, `docs/backlog-archive.md`, `docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md` — five paths, defined once as `$fivePaths` at CP-E |
| Required-untouched path | `docs/backlog.md` — byte-identical, witnessed at CP1, re-checked at CP14, rejected by CP15 if present |
| Blocked rules or decisions | **OQ4** rule 7 phase semantics (row 21). Nothing else |

The route is unambiguous, the write set is determinate, and every route-dependent artifact was regenerated
together after the owner's decision, as §1 requires. The task is `BLOCKED` by row 21 alone.

---

## D. Executable task contract — §2 checkpoint matrix

All checkpoints run in `C:\Claude_Code_Projects\lero-al-task674` under Windows PowerShell 5.1.
`$EV = $env:TEMP\task674-evidence`, created and proven outside the worktree by CP-E.

**Helpers (definitions, not checkpoints):** `Save-Ev`, `Get-ScannedCount`, `Get-ScanPrefixes`, `Get-Sha256`,
`Invoke-GitBytes`.

| CP | Preconditions / preserved inputs | Writes allowed through this CP | Observable result | Producer → persisted artifact | Comparator → failure behavior |
|---|---|---|---|---|---|
| E | none | none | `$root`, `$EV`, `$fivePaths`, `$untouched` | `New-Item` → `$EV\cp-e.txt` | `$EV.StartsWith($root)` → `throw` |
| 0 | CP-E | none | path, branch, `HEAD` sha | `git rev-parse` → `$EV\cp0-provenance.txt` | sha mismatch → `throw`; git exit checked |
| 0.1 | CP0 | none | kickoff/preflight absent from the tree | `Test-Path` → `$EV\cp0.1.txt` | any stray present → `throw` |
| 1 | CP0.1 | none | **zero** start entries **and** the `docs/backlog.md` content witness | `Invoke-GitBytes` → `$EV\cp1-start.bin` (0 bytes); `Get-FileHash` → `$EV\cp1.txt` (SHA-256 + byte length) | byte length `-ne 0` → `throw`; missing file → `throw`. Witness captured **before any write**, as the preflight requires for an untouched-path claim |
| 2 | CP1 | none | `$expectedScripts`; empty-set control | parsed `BINARY_EXTS` + `git ls-files` → `$EV\cp2-expected-scripts.txt` | parse failure → `throw`; git exit → `throw`; control `-ne 0` → `throw`; `-lt 1` → `throw` |
| 3 | CP2 | none | pre-change scanned count, exit 0 | `npm run check:mojibake` → `$EV\cp3-before.log` + `cp3.txt` | exit `-ne 0` → `throw`; parser → `throw` |
| 4 | CP3, **no session log yet** | §7 paths 1–3 | count `= $scannedBefore + $expectedScripts`; banner names **every** prefix and no extra directory | `npm run check:mojibake` → `$EV\cp4-after.log` + `cp4.txt` | delta mismatch → `throw`; banner line count `-ne 1` → `throw`; per-prefix absence → `throw`; both-direction `Compare-Object` → `throw`; missing `untracked-not-ignored` → `throw` |
| 5 | CP4 | none | AC3/AC4/AC5 at source level | regex + index-wise comparison → `$EV\cp5.txt` | `Success` guards; allowlist compared index by index with `-cne`, append position asserted; Encoding-hygiene section parsed in isolation, both directions; missing `SIGNATURES`/`L232` → `throw` |
| 5b.1 | CP5 | none | `HEAD` prefix entries survive at their original indices; count `= HEAD + 1`; last element `'scripts/'` | `Invoke-GitBytes 'show HEAD:…'` + `Get-ScanPrefixes` on both sides → `$EV\cp5b1.txt` | count mismatch → `throw`; index-wise `-cne` → `throw`; wrong appended value → `throw`. **Rejects `'messages/'` → `'foo/'`, which every other comparator accepts** |
| 5b.2 | CP5b.1 | none | effective checkout EOL conversion for the file | `git check-attr eol/text` + `git config core.autocrlf` → `$EV\cp5b2.txt` | resolved conversion `crlf` → `throw` with a **stop-and-report** message; the checkpoint never degrades to a normalized comparison |
| 5b.3 | CP5b.2 | none | **raw-byte** identity outside the two permitted regions | raw bytes both sides + strict UTF-8 decode + masking + exit-site counts → `$EV\cp5b3.txt` | either mask failing to match → `throw`; `-cne` on the masked text → `throw` with the first differing line persisted; changed `process.exit` counts → `throw`. No line-splitting, no EOL normalization, no ANSI decode |
| 6 | CP5b | probe file only | **exit exactly 1**, gate `FAILED` banner, `probe_sig.tmp.mjs:line:col` | `npm run check:mojibake` → `$EV\cp6-*.log` + `cp6.txt` | probe invisible to `git ls-files` → `throw`; exit `-ne 1` → `throw`; no `FAILED` banner → `throw`; probe not named → `throw`; recovery `-ne 0` → `throw`; `finally` removes the probe |
| 7 | CP6, probe removed | probe file only | **exit exactly 1**, `Not valid UTF-8`, probe named | `npm run check:mojibake` → `$EV\cp7-*.log` + `cp7.txt` | same shape plus a branch assertion |
| 8 | CP7 | none | `npx tsc --noEmit` clean | tsc → `$EV\cp8-tsc.log` | `if ($LASTEXITCODE -ne 0) { throw }` |
| 9 | CP8 | none | `npm run build` exit 0 | next build → `$EV\cp9-build.log` | `if ($LASTEXITCODE -ne 0) { throw }` |
| 10 | CP9 | `docs/backlog-archive.md` | **exactly one** new ledger row, at the TOP | `Compare-Object` + separator-index lookup → `$EV\cp10.txt` | any `<=` → `throw`; added count `-ne 1` → `throw`; wrong date/task/link → `throw`; not the first data row (`-cne`) → `throw` |
| 11 | CP10 | session log | session file exists at the exact path with the L691 header, a `Files Changed` table, all five paths, the `byte-identical` backlog record, `CP0`–`CP15`, `R1`–`R12` | file tools + regex → `$EV\cp11.txt` | missing file, wrong header, missing table, any missing path/phrase/checkpoint/requirement id, or under-length → `throw` |
| 12 | CP11 | none | count `= $scannedBefore + $expectedScripts + 1`, exit 0 | `npm run check:mojibake` → `$EV\cp12-final.log` + `cp12.txt` | exit `-ne 0` → `throw`; arithmetic mismatch → `throw` |
| 13 | CP12 | none | five written files: no BOM, no NUL, **strictly** decodable | `UTF8Encoding($false,$true)` → `$EV\cp13.txt` | BOM/NUL/decode exception → `throw` |
| 14 | CP13, CP1 witness | none | **`docs/backlog.md` byte-identical** | `git diff --quiet` + `Get-FileHash` → `$EV\cp14.txt` | diff exit `-ne 0` → `throw`; SHA-256 `-ne` witness → `throw`. Two independent comparators, because an equal `git status` alone cannot prove a path untouched |
| 15 | CP14, probes removed | none | final path set is exactly `$fivePaths` | `Invoke-GitBytes` → `$EV\cp15-final.bin` + `cp15.txt` | `Compare-Object` non-empty → `throw`; `$untouched` present → `throw` (explicit, in addition to the set comparison) |

**21 of 21 checkpoints have a producer, a persisted artifact under `$EV`, a comparator and a failing
behavior** — CP5b was split into three, so the count rises from 19 to 21 without any checkpoint being
softened.

**Claim scope, stated once so it cannot drift.** CP5b proves (a) index-wise preservation of the `HEAD` prefix
entries and (b) raw-byte identity **outside** the two masked regions, conditional on (c) the LF checkout
policy. It does **not** prove whole-file byte identity — the file is expected to differ in exactly those two
places — and nothing in the kickoff may paraphrase it that way (§14 makes that explicit to the executor).

**Dynamic-value zero/non-empty coverage.** `$expectedScripts`: empty control at CP2, non-empty is the real
value, zero rejected as impossible. Starting status: empty required and persisted as zero bytes (CP1);
non-empty rejected. Final status: exact five-element comparison plus an explicit `$untouched` rejection
(CP15). Added archive row: exactly-one assertion rejects zero, two, and unrelated additions alike. Session
log: CP11 rejects absence, wrong shape and incomplete coverage. Untouched path: CP14 rejects any change at
both the git level and the byte level.

---

## E. §3 Required counterexample trace

`orchestrator-execution-contract-template.md` §3: *"Mark `EXECUTED` only for an observed run with its exact
command and output or persisted-artifact location recorded."*

**Every row below is `ANALYTICAL`**, and each names the source it inspected. Several rest on inspections
performed during task design, but this artifact records neither their exact command nor a persisted-output
location, so the `EXECUTED` label is not available to them. Promotion requires re-running with the exact
command recorded and the output persisted alongside this artifact.

| # | Contract claim | Counterexample | Inspected source | Required outcome | Result |
|---|---|---|---|---|---|
| CE-1 | The owner authorized route 2 | the quote is a reconstruction | the owner's message in session "Task 668 revision 7 review", 2026-07-27, compared with kickoff §7.1 | quote matches, or `BLOCKED -- OWNER DECISION REQUIRED` | **PASS (analytical)** |
| CE-2 | The owner waived the clause-10 backlog obligation | the waiver is inferred, over-broad, or read as covering the archive row and session log too | the owner's message of 2026-07-27, quoted at kickoff §3.6, which states *"Це НЕ скасовує docs/backlog-archive.md та session log"* | the waiver must be quoted and must not be widened | **PASS (analytical)** — archive row and session log kept mandatory (rows 22, 25); OQ4 explicitly not touched |
| CE-3 | AC8 can detect malformed UTF-8 | feed it invalid bytes | .NET `Encoding.UTF8` is constructed with `throwOnInvalidBytes = false`; only `UTF8Encoding(bool, bool)` with `$true` throws | the check must be able to fail | **FAIL of the old check** → CP13 |
| CE-4 | CP5 accepts a correct banner | the required text `"… tracked and untracked-not-ignored …"` | kickoff §10.3 versus the old predicate `match 'tracked'`, true on that text | comparator accepts correct text, rejects tracked-only | **FAIL of the old comparator** → CP4 |
| CE-5 | A non-zero exit proves detection | `npm` fails, or the script crashes | `check-mojibake.mjs` L251–265 — the only non-zero exit is `process.exit(1)` | only exit 1 **with** an identifying diagnostic counts | **FAIL of the old assertion** → CP6/CP7 |
| CE-6 | CP12's arithmetic is intact | a variable reused by an intervening checkpoint | the earlier plan assigned `$before` in both the count baseline and a backlog comparator | no variable may be reused across checkpoints | **FAIL of the old plan** → renamed variables; the backlog comparator no longer exists |
| CE-7 | The gap this task fixes is real | is `scripts/` genuinely unscanned today? | `SCAN_DIR_PREFIXES` L35 and `shouldScan()` L145–152 replicated over the `HEAD` tree listing — 1893 scanned, none under `scripts/`; +72 with the prefix | the gate ignores artifacts under `scripts/` | **PASS (analytical)** |
| CE-8 | Widening breaks nothing else | another `scripts/` file already contains an artifact | the 38 `SIGNATURES` patterns applied to the 72 `scripts/` text files at `HEAD`, plus BOM/NUL/decode — one offender, the detector itself | exactly one offender, handled by the allowlist | **PASS (analytical)** |
| CE-9 | A task-created artifact cannot enter a measurement unnoticed | the kickoff is copied into the worktree; an evidence file is written in-tree | `tasks/` and `docs/` are in the scanned set and L138 collects untracked-not-ignored files | the plan must detect or prevent both | **FAIL of the old plan** → CP0.1 and CP-E |
| CE-10 | Raw `--porcelain -z` bytes survive capture | a path containing a space, a quote, or a non-ASCII byte | Windows PowerShell 5.1 `>` is `Out-File` — decodes, re-encodes, appends a newline | capture must be byte-exact and check git's exit code | **FAIL of the old plan** → `Invoke-GitBytes` |
| CE-11 | AC7's preservation claim is checked | `SIGNATURES` rewritten as `\uXXXX` escapes, or the report format reworded | an earlier plan's only AC7 evidence was "given `git diff`", an inspection; ledger rule 4 forbids that substitution | a comparator must reject the rewrite | **FAIL of the old plan** → CP5b.3 |
| CE-11a | The prefix list is a faithful extension of `HEAD` | an existing entry is **replaced**, not appended: `'messages/'` → `'foo/'` | the masked region was substituted wholesale on both sides, so CP5b saw identical text; CP4 (banner) and CP5 (documentation) both compare against the **edited** constant, so a consistent rename satisfies them; only CP4's count delta might catch it, incidentally, and only if the two directories differ in file count | a comparator must reject the replacement directly | **FAIL of the old plan** (F41) → CP5b.1 index-wise `-cne`, throws at index 5 |
| CE-11b | CP5b measures what it claims | a trailing newline is added; LF is rewritten as CRLF; a non-ASCII byte differs | `Get-Content` + `-join "`n"` discards line endings and the trailing-newline distinction, and PS 5.1 decodes with the ANSI code page — so a "byte-for-byte" verdict was produced from normalized, potentially mangled text | either measure raw bytes or restate the claim | **FAIL of the old claim** (F42, F43) → CP5b.3 raw bytes + strict decode; CP5b.2 guards the precondition; AC7/R8/§10.8/§15 reworded |
| CE-12 | The session log exists and is usable as evidence | log absent, misnamed, or a two-line stub | an earlier CP was the prose "write the session log" | a comparator must reject absence and wrong shape | **FAIL of the old plan** → CP11 |
| CE-13 | **`docs/backlog.md` really is byte-identical** | an editor rewrites line endings; a tool normalizes trailing whitespace; the file is opened and saved unchanged in appearance | `orchestrator-evidence-first-preflight.md`: *"an equal porcelain entry proves only that the same path is still modified … Capture a content witness before and after"* — removing the backlog checkpoint without a witness would have left the owner's guarantee unverified | a witness pair must reject any byte change | **FAIL of the naive removal** (F40) → CP1 witness + CP14 double comparator + CP15 explicit rejection |
| CE-14 | The new gate detects a planted artifact under `scripts/` | AC6(a)/(b) probes | requires the post-change script; not run | observed failure, then clean recovery | **NOT TESTED.** Per §3 an `ANALYTICAL` counterexample cannot certify a gate as tested. Only execution closes this |

---

## F. §4 Publication and review gate

A fresh, final-document-only pass was performed on 2026-07-27 against the regenerated kickoff, rebuilding the
active route, the expected write set and the checkpoint matrix without relying on revision summaries.

Result: **one unambiguous route, a determinate five-path write set plus one witnessed untouched path, 21 of 21
checkpoints with producers, persisted artifacts and failing comparators, every acceptance criterion bound to a
checkpoint whose comparator can reject its counterexample, every asserted property matched to what the plan
actually measures, correctly labelled falsification evidence, and every route-dependent section regenerated
after each owner decision — against a single `BLOCKED` ledger row.**

**Decision: `BLOCKED — OQ4 only`.** No executor handoff.

---

## G. Findings and their state

F1–F39 are recorded in the kickoff §0 defect log (D1–D35) and earlier revisions of this artifact. Previously
open: **F26 (OQ5)** and **F32 (OQ6)** — both now **CLOSED for this task** by the owner exception of 2026-07-27,
and both explicitly handed to the deferred `BACKLOG LIMIT BREACH` work rather than declared solved. **F34
(OQ4)** remains open.

This pass:

| ID | Sev | Finding | State |
|---|---|---|---|
| F41 | `P1` | **CP5b masked `SCAN_DIR_PREFIXES` away and proved nothing about its contents.** `'messages/'` → `'foo/'` passed CP5b, CP4 and CP5 alike, because all three compare against the edited constant. The one comparator that might have caught it, CP4's scanned-count delta, would only do so by accident and only when the two directories hold different numbers of files | **CLOSED** — D36: CP5b.1 parses `HEAD` and current prefixes, requires `count = HEAD + 1`, index-wise `-cne` equality, and `'scripts/'` last. Ledger rows 1 and 13 recomputed |
| F42 | `P1` | **CP5b asserted "byte-for-byte" while measuring normalized text.** Both sides went through `Get-Content` + `-join "`n"`, which splits lines, discards the original line endings and the trailing-newline distinction. The artifact did not measure the property it claimed | **CLOSED** — D37: CP5b.3 reads raw bytes on both sides (`Invoke-GitBytes`, `[IO.File]::ReadAllBytes`) and decodes strictly; AC7, R8, §10.8 and §15 restate the claim with its exact scope |
| F43 | `P1` | The raw-byte claim has an unstated precondition: if git converts EOLs on checkout, the worktree file legitimately differs from the blob and the comparison fails for an unrelated reason | **CLOSED** — D38: CP5b.2 resolves the effective policy and **stops** on CRLF rather than degrading. §3.7 records the verified `HEAD` policy (`* text=auto eol=lf`, `core.autocrlf=false`) under which the guard passes |
| F44 | `P1` | **Windows PowerShell 5.1 `Get-Content` decodes with the ANSI code page**, so every repo-file read in the plan — detector source, `docs/qa-rules.md`, `docs/backlog-archive.md`, the session log — was mangled at any non-ASCII byte. The CP11 em-dash header regex could fail on a correct file, and the CP10 archive `Compare-Object` could report spurious differences | **CLOSED** — D39: `Read-Utf8Text`/`Read-Utf8Lines` plus `Invoke-GitBytes` for every `HEAD` side. The `*>` run logs deliberately keep BOM-detecting `Get-Content`, which is correct for them |
| F40 | `P1` | **Removing the backlog obligation would have removed its only verification.** The owner requires `docs/backlog.md` to end *byte-identical*; deleting AC9 and the old backlog checkpoint without replacement would have left that guarantee resting on the final `git status` alone, which `orchestrator-evidence-first-preflight.md` explicitly rejects as proof that a path was untouched | **CLOSED** — D32: CP1 captures a SHA-256 + byte-length witness before any write; CP14 re-checks with `git diff --quiet` **and** hash equality; CP15 rejects the path explicitly. Bound by the new AC9d |
| F34 | `P0` | Rule 7 phase semantics | **OPEN as OQ4 — the only blocker** |

---

## H. Required next actions

1. **OQ4 — rule 7.** Amend, confirm, or reject the phase semantics in
   `docs/orchestrator-rule-compliance-ledger-template.md`. Global-template change; no task artifact may make
   it. This is the only thing standing between Task 674 and a publishable handoff.
2. After it: re-run this preflight against the unchanged kickoff, re-score rows 3, 4, 5, 8, 9, 10, 12, 13, 17,
   18, 19, 22 and 25, and — only if every applicable row is then `COMPLIANT` — publish the executor handoff.
3. Optional, non-blocking: OQ1/OQ1a (allowlist versus `\uXXXX` escapes — route (b) would now fail CP5b by
   design, so it is a route change requiring a new contract), OQ2 (repo-wide BOM/NUL enforcement), OQ3
   (remaining unscanned trees).
4. Separately, when the owner schedules the deferred `BACKLOG LIMIT BREACH` work: OQ5 (which metric governs
   clause 10) and OQ6 (`ai-behavior.md` L694 versus additive-only) are still unresolved and will need answering
   there. They are out of Task 674's scope, not solved.
5. Until 1 is resolved: `tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md` is a **blocked
   decision note**. No executor handoff, no worktree creation, no commit-and-run.
