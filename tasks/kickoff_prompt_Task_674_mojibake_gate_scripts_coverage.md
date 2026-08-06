# Task 674 — `check:mojibake` never scans `scripts/`

> # STATUS: `BLOCKED — ONE UNRESOLVED OWNER DECISION (OQ4, global rule 7)`
>
> **This file is NOT an executor handoff. Do not give it to Sonnet. Do not commit-and-run it.**
>
> | # | Blocker | Where |
> |---|---|---|
> | **OQ4** | `orchestrator-rule-compliance-ledger-template.md` **rule 7** phase semantics. Read as written, "planned future check" denies `COMPLIANT` to every task-design row whose observable is produced by an executor command; L31–33 then forbids publication | §5, ledger row 21 |
>
> **OQ5 and OQ6 are CLOSED** by the owner's `docs/backlog.md` exception of 2026-07-27 (§3.6, quoted in full).
> That exception removes `docs/backlog.md` from the write set entirely, so the metric conflict and the L694
> "replace the Last Session block" conflict no longer have a subject in this task.
>
> A kickoff cannot declare rule 7 non-blocking for itself. Ledger rule 2 (agent reasoning is never waiver
> evidence) and rule 3 (an alternative is permitted only where the original rule explicitly permits it) forbid
> that move; only an owner decision can, and the owner has not made one about rule 7. A previous revision made
> that move; it is **retracted and not restored**.
>
> Everything below §1 is a **complete single-route contract** held ready for the moment OQ4 lands. It is
> published as a blocked decision note under `orchestrator-execution-contract-template.md` §1.
>
> **Fourth full recomputation, 2026-07-27**, against the current text of every governing rule and a fresh
> inspection of `HEAD`. Corrections in §0.
>
> ⚠️ **Encoding note.** `tasks/` and `docs/` are inside the `check:mojibake` scanned set. Every mojibake
> artifact in this file is named by **codepoint**, never reproduced. Do the same in the session log and the
> archive row, or your own evidence will fail the gate.

## 0. What changed in this recomputation (defect log)

D1–D29 are retained in `tasks/task674-preflight-ledger-and-contract.md` §G. This pass applies the owner's
`docs/backlog.md` exception and regenerates every dependent part of the contract.

| # | Change | Effect |
|---|---|---|
| D30 | **`docs/backlog.md` removed from the write set** under the owner exception of 2026-07-27 (§3.6). The file must end **byte-identical** to its starting state | §7 is now **five** paths. `$fivePaths` replaces `$sixPaths` and is still defined once at CP-E and reused by CP11, CP13 and CP15 |
| D31 | **AC9 and the old CP10 deleted**, together with every physical/active-content line count, both per-metric verdicts, the additive-only entry comparator, and the conditional `BACKLOG LIMIT BREACH` flag | §3.6, §4 R10, §10, §11, §12, §13, §14 and §15 regenerated. `BACKLOG LIMIT BREACH` is **deferred by owner decision** to separate future work and is not this task's concern |
| D32 | **A byte-identity guarantee must itself be proven.** `orchestrator-evidence-first-preflight.md` is explicit: an untouched-path claim needs a **content witness before and after**, and an equal `git status` alone is insufficient. Deleting the backlog checkpoint without adding a witness would have left the owner's "byte-identical" requirement unverified | New **CP1** witness capture (SHA-256 + `git diff --quiet` baseline) and new **CP14** re-check, bound by new **AC9d** |
| D33 | Checkpoints renumbered after the removal: the archive comparator moves CP11 → **CP10**, the session log CP12 → **CP11**, the final gate run CP13 → **CP12**, the encoding sweep CP14 → **CP13**, the new backlog witness re-check is **CP14**, and the final path set stays **CP15** | Every cross-reference in §12, §13, §14 and §15 re-derived. CP11's own id list (`CP0`–`CP15`) updated so the session log must report the current numbering, not the old one |
| D34 | **Acceptance-criterion ids are not reused.** AC9 is gone; AC9b (archive) and AC9c (session log) keep their existing meanings, and the new backlog witness is **AC9d** | A reader comparing revisions cannot mistake a renumbered id for a changed requirement |
| D35 | Ledger rows 23 (L694) and 24 (metric) become `NOT APPLICABLE` with a source-based reason rather than `BLOCKED`; a new row records the exception itself under ledger rule 2 and the preflight's "Authorize exceptions" clause | §B of the preflight artifact; totals recomputed |
| D36 | **CP5b masked `SCAN_DIR_PREFIXES` away entirely and therefore proved nothing about its contents.** Replacing an existing entry — `'messages/'` → `'foo/'` — produced identical masked text on both sides and **passed**. Neither CP4 nor CP5 caught it either: both compare the banner and the documentation against the *edited* constant, so a consistent rename satisfied all three. Only CP4's scanned-count delta might have caught it, by accident, and only when the two directories differ in file count | New **CP5b.1**: parse `SCAN_DIR_PREFIXES` from the `HEAD` blob and from the edited file, require `count = HEAD + 1`, require every `HEAD` entry to equal the current entry **at the same index** with the case-sensitive `-cne`, and require the **last** element to be exactly `'scripts/'`. The `messages/` → `foo/` counterexample now throws at index 5 |
| D37 | **CP5b claimed "byte-for-byte" while reading both sides through `Get-Content` and `-join "`n"`**, which splits lines, discards the original line endings and the trailing-newline distinction, and — in Windows PowerShell 5.1 — decodes with the ANSI code page rather than UTF-8. The artifact did not measure the property it asserted | CP5b now reads **raw bytes** on both sides (`Invoke-GitBytes 'show HEAD:…'` and `[IO.File]::ReadAllBytes`), decodes each with a **strict** UTF-8 decoder, and compares without any normalization. AC7, R8, §10.8 and §15 are reworded to state exactly that, with its precondition |
| D38 | The raw-byte claim is only valid if git applies **no EOL conversion** on checkout; otherwise the worktree file legitimately differs from the blob and the comparison would fail for an unrelated reason | New **CP5b.2** resolves the effective policy from `git check-attr eol/text` and `core.autocrlf` and **stops** if CRLF conversion is in effect, rather than silently degrading to a normalized comparison. §3.7 records the policy verified at `HEAD` (`* text=auto eol=lf`, `core.autocrlf=false`), under which the guard passes |
| D39 | **Windows PowerShell 5.1 `Get-Content` decodes with the ANSI code page**, so every repo file read — the detector source, `docs/qa-rules.md`, `docs/backlog-archive.md`, the session log — was being mangled at any non-ASCII byte. `-cne` comparisons, the `—` header regex at CP11 and the archive row comparison were all built on corrupted strings | New `Read-Utf8Text` / `Read-Utf8Lines` helpers (raw bytes + strict UTF-8) replace every `Get-Content` read of a repo file, and every `HEAD` side is read through `Invoke-GitBytes`. The `*>` run logs keep `Get-Content -Raw`, which is correct for them: PS 5.1 writes those with a BOM and `Get-Content` detects it — this is deliberate, not an oversight |

## 1. Mode and task type

- **Mode:** implementation (blocked; see the status banner).
- **Task type:** governance / validation gate, non-UI. No Mantine or legacy UI surface is touched.
- **Execution state:** `from-scratch`, in a **clean isolated worktree**. No remediation, no reused artifacts, no
  forbidden re-runs.
- **Why it matters:** every governance and QA harness in this repo lives in `scripts/` — 72 text files at
  `HEAD`, dense with non-ASCII (check marks, arrows, dashes, box drawing, locale samples), i.e. exactly the
  mojibake-prone class. `agent-contract.md` clause 14 claims an integrity protection that the gate does not
  currently provide for any of them.

## 2. Objective

Bring `scripts/` inside the `check:mojibake` scanned set, resolve the detector self-reference that widening
exposes, and prove by planted violation that the widened gate actually rejects a corrupt file under `scripts/`.

Be precise about drift. `SCAN_DIR_PREFIXES` becomes the **single executable source of truth** and the stdout
banner becomes **derived** from it, so the two in-script copies can no longer disagree. `docs/qa-rules.md`
remains a **manual documentation mirror** — prose cannot be derived from a JS constant — so it stays a third
copy by nature; it is brought back into agreement and separately verified. This task does **not** eliminate all
duplication.

## 3. Verified context

Every fact below was inspected **at `HEAD` = `f80550f35399a16d7c4df29f8a39a2d85ebe7d9e`** (branch
`task/q0-ci-rendered-locale-split`) and re-derived on 2026-07-27, via `git show HEAD:<path>` and
`git ls-tree -r HEAD` — i.e. against the exact tree your isolated worktree will contain, never against the
owner's dirty worktree. Re-verify only where a step says so.

### 3.1 How the gate selects files (exact current behavior at `HEAD`)

`scripts/check-mojibake.mjs`, 268 lines. Every line number re-confirmed.

| Line | Current code | Consequence |
|---|---|---|
| L35 | `const SCAN_DIR_PREFIXES = ['docs/', 'src/', 'app/', 'components/', 'modules/', 'messages/', 'tasks/'];` | `scripts/` absent, so it is never scanned |
| L38–44 | `BINARY_EXTS` — 23 extensions | rejected before the prefix match |
| L49–93 | `SIGNATURES` — **38** entries, each `{ pattern, name, hint }` | the detector table |
| L97 | `const ALLOWLIST_PATH = resolve(ROOT, 'scripts/mojibake-allowlist.json');` | existing per-path exemption mechanism |
| L103 | `if (!Array.isArray(list)) throw …` | allowlist must be a flat JSON array |
| L107–132 | minimal glob to RegExp: `**` = any segments, `*` = any chars except `/` | allowlist matcher |
| L130 | `function isAllowlisted(relPath, allowlist)` | |
| L138 | `spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], …)` | **tracked *and* untracked-not-ignored are both collected** — the omission is not a tracked/untracked issue |
| L145–152 | `shouldScan()`: binary-ext reject, then `SCAN_DIR_PREFIXES` prefix match, then root-level `*.md` | the sole coverage filter |
| L161–163 | `new TextDecoder('utf-8', { fatal: true })` | invalid UTF-8 produces the `Not valid UTF-8` error; **BOM and NUL both decode legally and are NOT rejected** |
| L206–212 | `missing[]` partition for tracked-but-absent paths | Task 666's deletion tolerance |
| **L214** | ``console.log(`check:mojibake — scanning ${files.length} tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md`)`` | **hardcoded duplicate of L35**, and "tracked" is inaccurate per L138. This line is what misled the Task 668 review |
| **L232** | `if (isAllowlisted(rel, allowlist)) continue;` — inside the **`invalid-UTF-8`** branch | allowlisting also exempts encoding validity |
| **L240** | `if (isAllowlisted(rel, allowlist)) continue;` — inside the **signature-hit** branch | |
| L251–254 | `if (total === 0) { console.log('check:mojibake: 0 artifacts in ${files.length} files'); process.exit(0); }` | the success summary CP-P cross-checks against the banner; the **only** `process.exit(0)` site |
| L256–265 | `console.error('check:mojibake FAILED — …')` per-hit report, then `process.exit(1)` | the **only** non-zero exit the script produces |

Consumers: `package.json` L60 (`"check:mojibake": "node scripts/check-mojibake.mjs"`) and
`.github/workflows/governance-pr.yml` L91 — a **blocking** CI step.

### 3.2 Measured coverage gap at `HEAD` — design-time observations, NOT acceptance criteria

Re-derived by replicating `shouldScan()` over `git ls-tree -r HEAD --name-only`.

| Quantity at `HEAD` | Value | Status |
|---|---|---|
| `scripts/` text files that `shouldScan()` would newly accept | **72** | design-time observation |
| Files currently scanned (tracked tree at `HEAD`) | **1893** | design-time observation |
| Files scanned after adding `scripts/` (tracked tree at `HEAD`) | **1965** | design-time observation |
| Signature patterns in the `SIGNATURES` table | **38** | design-time observation |
| Entries in `scripts/mojibake-allowlist.json` | **10** | design-time observation |
| `docs/backlog-archive.md` | **487 lines**, ledger table `\| Date \| Description \| Tasks \| File \|`, newest first | design-time observation, see §10.5 |

⚠️ **None of these numbers is an acceptance criterion.** §13 re-derives every count inside your worktree and
every assertion compares against the re-derived value. If your figures differ, report the difference and
continue; a mismatch is not a failure.

`docs/backlog.md` no longer appears in this table: it is not measured, not edited and not asserted against any
threshold (§3.6).

### 3.3 The detector's own source is the only blocker under `scripts/` — re-verified at `HEAD`

Applying the 38-signature table to all 72 `scripts/` text files at `HEAD` yields **exactly one offender**:

- **`scripts/check-mojibake.mjs` itself**, matching **38 of 38** patterns, because `SIGNATURES` (L49–93)
  necessarily contains every artifact string as a literal.

**No other file under `scripts/` at `HEAD` has a signature hit, invalid UTF-8, a BOM, or a NUL byte.** So a
naive one-line edit to L35 turns a green blocking CI gate red on its own source.

**In-repo precedent:** `scripts/mojibake-allowlist.json` already exempts `docs/qa-rules.md` for exactly this
reason — that document quotes the same literals while documenting the gate — alongside the Task 428/429
kickoffs and three session logs.

### 3.4 Documentation mirror that will go stale

`docs/qa-rules.md` L68 (`### Encoding hygiene (UTF-8, mojibake gate — Task 428)`); L70–73 enumerate the scanned
directories in prose: *"scans `docs/`, `src/`, `app/`, `components/`, `modules/`, `messages/`, `tasks/`, and
root `*.md`"*. Third copy of the L35 list; must be updated in this change.

⚠️ This file **is allowlisted** and **does contain artifact literals** in its "What it catches" paragraph. That
constrains §14 — see D15 in the preflight artifact.

### 3.5 Critical-flow scan

`docs/critical-flow-registry.md` — **no entry touched**. Text-encoding governance gate only: no auth, RLS, write
path, payment, moderation, or reporting flow. No automated regression evidence beyond §13 is required.

### 3.6 `docs/backlog.md` — owner exception, byte-identical, out of scope

**Owner decision. Source: owner message to the orchestrator, 2026-07-27. Scope: Task 674 only. Quoted in
full:**

> *"Для Task 674 docs/backlog.md має лишитися byte-identical:
> — не оновлюй Last Session;
> — не додавай Task 674 entry;
> — не чисти, не консолідуй і не переписуй backlog;
> — не блокуй задачу через 80 physical lines.
> BACKLOG LIMIT BREACH усвідомлено відкладається для окремої майбутньої роботи, яку я доручу пізніше.
> Це закриває OQ5 і OQ6. Це НЕ скасовує docs/backlog-archive.md та session log: archive row і session log
> лишаються обов'язковими."*

This is a traceable owner exception under `orchestrator-rule-compliance-ledger-template.md` rule 2 and
`orchestrator-evidence-first-preflight.md` ("Authorize exceptions"). It is the owner's, not the task's; the
task quotes it and does not extend it.

What it settles:

- `docs/backlog.md` is **out of the write set** (§7, §8). No entry, no "Last Session" update, no consolidation,
  no reflow.
- The file must end **byte-identical** to its starting state. That is not assumed — CP1 captures a content
  witness and CP14 re-checks it (AC9d), because an equal `git status` alone cannot prove a path was untouched.
- The `agent-contract.md` clause 10 backlog obligation is **waived for this task only**.
- **`BACKLOG LIMIT BREACH` is deferred by owner decision** to separate future work. This task neither measures
  the file, nor flags a breach, nor blocks on one. No physical or active-content count appears anywhere in
  this contract.
- **OQ5** (which metric governs clause 10) and **OQ6** (`ai-behavior.md` L694's "replace the Last Session
  block") are **closed**: with `docs/backlog.md` out of scope, neither conflict has a subject here. Both remain
  live questions for the deferred work, and neither is answered by this task.

What it explicitly does **not** settle, per the owner's own wording:

- `docs/backlog-archive.md` — the ledger row remains **mandatory** (`ai-behavior.md` L696, L702). §10.5, CP10.
- The session log remains **mandatory** (`ai-behavior.md` L689–692; `agent-contract.md` clause 10). §10.6, CP11.
- Rule 7 (OQ4) is untouched by this exception and remains the single blocker.

### 3.7 Line-ending policy at `HEAD` — the precondition for CP5b's raw-byte proof

Verified 2026-07-27:

| Setting | Value at `HEAD` | Consequence |
|---|---|---|
| `.gitattributes` | `* text=auto eol=lf` (plus `*.bat`/`*.cmd` → `crlf`) | every non-batch file is checked out with **LF**, on every platform |
| `git check-attr text eol -- scripts/check-mojibake.mjs` | `text: auto`, `eol: lf` | LF in the worktree |
| `core.autocrlf` | `false` | no additional conversion |
| `git show HEAD:scripts/check-mojibake.mjs` | 0 CR bytes, valid UTF-8, no BOM | the blob is LF-only |

Therefore **the worktree bytes equal the blob bytes**, and a raw-byte comparison against `HEAD` is a valid
invariant for this file. CP5b.2 re-derives this at run time and **stops** if the policy has changed, rather
than quietly falling back to a line-ending-normalized comparison. This matters because the strength of AC7's
claim depends on it: without the guard, "raw-byte identity" would be an assertion the checkpoint cannot
support.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, §3.2 | `scripts/` is inside the scanned set; the newly-accepted `scripts/` files are scanned | P0 | AC1 | Confirmed |
| R2 | §3.3 | `npm run check:mojibake` still exits 0 on the otherwise-unmodified worktree after R1 | P0 | AC2 | Confirmed |
| R3 | §3.3 | The detector's exemption is **declared** with its reason **and its breadth** (§5 OQ1a), using the existing allowlist mechanism | P0 | AC3, AC5 | Confirmed |
| R4 | §3.1 L214 | The scanned-directory list exists in exactly **one** place in the script; the banner is derived from `SCAN_DIR_PREFIXES` and names every entry and no other | P1 | AC4 | Confirmed |
| R5 | §3.1 L138/L214 | The banner no longer makes a **tracked-only** claim; it states tracked **and** untracked-not-ignored | P1 | AC4 | Confirmed |
| R6 | §3.4 | The `### Encoding hygiene` section of `docs/qa-rules.md` matches `SCAN_DIR_PREFIXES` entry-for-entry, with no extra directory, and records the allowlist reason and breadth | P1 | AC5 | Confirmed |
| R7 | Task 668 F8 | The widened coverage is proven by **planted violations under `scripts/`** that make the gate exit **exactly 1** with a diagnostic identifying the probe, in both branches, followed by clean recovery | P0 | AC6 | Confirmed |
| R8 | `agent-contract.md` P0.1 | `scripts/check-mojibake.mjs` is **raw-byte identical to its `HEAD` blob outside two regions** — the `SCAN_DIR_PREFIXES` array literal and the single banner `console.log` statement — and inside the first of those, the `HEAD` entries survive **at their original indices** with `'scripts/'` appended last. No behavior change to signature matching, allowlist glob semantics, exit codes or report format; no product code touched. Proven by comparators, not by inspection | P0 | AC7 | Confirmed |
| R9 | `agent-contract.md` clause 14 | Every file this task writes is UTF-8, **no BOM, no NUL**, strictly decodable — asserted by a fail-closed check, since the gate itself does not test BOM/NUL (§3.1 L161–163) | P0 | AC8 | Confirmed |
| R10 | `ai-behavior.md` L696/L702, L689–692; `agent-contract.md` clause 10; owner exception §3.6 | `docs/backlog-archive.md` carries **exactly one** new ledger row at the TOP linking the session file; the session log exists with the required header, "Files Changed" table and checkpoint/requirement coverage; **`docs/backlog.md` is byte-identical to its starting state** | P0 | AC9b, AC9c, AC9d | Confirmed |
| R11 | Route 2 | Work happens in a **clean isolated worktree**; starting `git status` has zero entries; this kickoff is never copied into it; final state is exactly the §7 **five**-path write set | P0 | AC10 | Confirmed |
| R12 | `agent-contract.md` clause 9 | `npx tsc --noEmit` clean and `npm run build` exit 0, both fail-closed | P0 | AC11 | Confirmed |

## 5. Assumptions and open questions

**Blocking (owner decision):**

- **OQ4 — `orchestrator-rule-compliance-ledger-template.md` rule 7 phase semantics.** Does a task-design row
  that specifies a producer, a persisted artifact, a comparator and a failure behavior satisfy rule 7, or is it
  a "planned future check" and therefore `BLOCKED`? Determines whether this task can ever be published as a
  design handoff. Owner-only; a task artifact may not answer it. **The only blocker.**

**Closed by owner decision, 2026-07-27 (§3.6):**

- **OQ5 — which backlog metric governs clause 10.** Closed for this task: `docs/backlog.md` is out of scope
  and is not measured. Still open for the deferred `BACKLOG LIMIT BREACH` work.
- **OQ6 — additive-only versus `ai-behavior.md` L694.** Closed for this task for the same reason. Still open
  for the deferred work.

**Non-blocking (disclosed, with defaults):**

- **OQ1 — how to exempt the detector. Default: add `"scripts/check-mojibake.mjs"` to
  `scripts/mojibake-allowlist.json`.** Reuses the established mechanism and matches the existing
  `docs/qa-rules.md` precedent (§3.3). Alternatives, **not** to be chosen unilaterally: (b) rebuild
  `SIGNATURES` from `\uXXXX` escapes so the source holds no literal artifact — keeps the file scannable but
  rewrites a governance table, and **would fail CP5b**, which is deliberate: that is a route change, not an
  implementation detail; (c) a hardcoded self-path skip in `shouldScan()` — least visible, no declared reason.
  If you believe (b) or (c) is required, **stop and report**; do not switch routes yourself.
- **OQ1a — the allowlist entry is broader than "just the signature table".** `isAllowlisted()` is consulted at
  **L232** (invalid-UTF-8 branch) as well as **L240** (signature branch), so allowlisting the detector exempts
  it from **encoding-validity checking too**. If its source were ever saved as CP1252 or truncated
  mid-sequence, its own gate would stay green. **No compensating control is claimed** — in particular, do
  **not** argue that `node` importing the file would catch it: Node decodes module source as UTF-8 with U+FFFD
  substitution rather than throwing, so corruption inside a comment or string literal can load and run
  normally. This breadth must be written into `docs/qa-rules.md` (§10.3). Route (b) avoids it; owner's call.
- **OQ2 — BOM/NUL are not enforced by the gate (verified; gate-widening is out of scope).** L161–163 rejects
  only invalid UTF-8; a BOM decodes to U+FEFF and NUL to U+0000, both legal. **R9/AC8 therefore add a
  fail-closed BOM/NUL/strict-decode check over this task's own written files.** Extending that enforcement to
  the whole scanned set is a separate owner decision and is **out of scope** (§8).
- **OQ3 — files still outside the scanned set after this task.** Root-level non-`.md`, `.storybook/`,
  `.github/` remain unscanned; `.claude/` is git-ignored and therefore invisible to the collector at L138. Not
  measured for artifacts. **Out of scope — owner decision.**
- **Assumption:** allowlist glob semantics (L107–132) are unchanged and a plain relative path is a valid
  exact-match entry — consistent with all 10 existing entries.
- **Assumption:** the executor runs **Windows PowerShell 5.1**. Every checkpoint is written for it. Under
  PowerShell 7 the same code is valid; the reverse is not true, which is why 5.1 is the target.

## 6. Pre-read rule bundle (exact — do not read all docs)

Always required: `docs/agent-contract.md`, `docs/rule-index.md`, `docs/qa-profiles.md`, `docs/backlog.md`
(**read-only, for current project state — never edited on this route, §3.6**), `docs/critical-flow-registry.md`
(scan only — §3.5 already recorded no hit).

Task-specific (`docs/rule-index.md` → *Docs / Governance / Task Template*, plus the encoding and session-close
rules):

- `docs/qa-rules.md` — **"Encoding hygiene" L68–82 is the rule this task changes.**
- `docs/ai-behavior.md` **L670–703** — "Backlog & Session Log Rules". Steps 1 and 3 of "When closing a session"
  apply (session file, archive row); step 2 is waived by the §3.6 owner exception.
- `docs/backlog-archive.md` — the ledger table header and its newest-first ordering only.
- `docs/governance-enforcement.md` — only if the change affects how CI consumes the gate.

Do **not** read the UI/Mantine/TailAdmin bundle. No UI surface is in scope.

## 7. Scope — exactly five paths

| # | Path | Change | Already scanned? |
|---|---|---|---|
| 1 | `scripts/check-mojibake.mjs` | L35 add `'scripts/'`; L214 derive the banner from the constant and drop the tracked-only claim. **Nothing else may differ from `HEAD`** (CP5b) | no → yes, after the edit |
| 2 | `scripts/mojibake-allowlist.json` | append one entry at the **end**, existing entries verbatim and unreordered (OQ1 default) | no → yes, after the edit |
| 3 | `docs/qa-rules.md` | `### Encoding hygiene` scope sentence + OQ1a breadth statement | yes (tracked) |
| 4 | `docs/backlog-archive.md` | exactly one new ledger row at the TOP (`ai-behavior.md` L696/L702) | yes (tracked) |
| 5 | `docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md` | new session log, L691 header | **no — the only new file, and the only `+1` in AC1** |

**`docs/backlog.md` is deliberately absent** (§3.6, owner exception). It must end byte-identical; CP1 and CP14
prove it, and CP15 rejects it as an unexpected path if it is modified.

Nothing else may appear in the final `git status`. All checkpoint evidence is written **outside** the worktree
(CP-E).

### 7.1 Execution environment — clean isolated worktree (ACTIVE ROUTE)

**Owner decision. Source: owner message in session "Task 668 revision 7 review", 2026-07-27. Quoted in full:**

> *"Для Task 674 обираю §7.1 route 2 через clean isolated worktree від поточного HEAD.
> Не чекаємо закриття Tasks 665/666/668. У цьому isolated worktree застосовуємо нормальну вимогу clause 10:
> docs/backlog.md входить у scope і оновлюється, session log також обов'язковий.
> Перегенеруй Task 674 цілком для одного active route. Не перенось 48-path manifest,
> старі count values або route-1 path expectations із поточного dirty worktree."*

Scope: Task 674 only. This decision authorizes **route 2**. Its `docs/backlog.md` clause is **superseded by the
later owner exception of 2026-07-27 quoted at §3.6**, which removes that file from the write set; the session
log requirement in both messages stands. Neither message authorizes any exception to rule 7, and no part of
either is read as doing so.

Revisions 1–6 were a multi-route draft and are **superseded in full**. No count, manifest, or path expectation
from that draft is carried forward.

This replaces the dirty-worktree integrity manifest entirely, as
`docs/orchestrator-dirty-worktree-manifest-template.md` L10–11 permits — **but only** when the preflight
records the worktree's creation and location **and** a zero-entry starting `git status --porcelain`. Both are
mandatory checkpoints below (CP0, CP1).

**The worktree is created by the owner.** `git worktree add` is a mutating Git command and is owner-only,
native PowerShell (`CLAUDE.md`). Do not create, move, or remove it yourself.

Owner-run, once, before the executor starts:

```powershell
git worktree add -b task/674-mojibake-scripts-coverage `
  C:\Claude_Code_Projects\lero-al-task674 f80550f35399a16d7c4df29f8a39a2d85ebe7d9e
cd C:\Claude_Code_Projects\lero-al-task674
git status --porcelain    # must print nothing
npm ci                    # node_modules is NOT shared between worktrees; required for `npm run build`
```

Everything in §13 runs inside `C:\Claude_Code_Projects\lero-al-task674`. **Never** run any command from this
task against the main worktree — it carries uncommitted Task 665/666/668 work that this task must not see or
touch.

### 7.2 This kickoff must stay out of the isolated worktree

`tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md` and
`tasks/task674-preflight-ledger-and-contract.md` are untracked in the main worktree and absent from `HEAD`, so
they will **not** exist in the isolated worktree. Read them **read-only from the main worktree path**. Copying
either into the isolated worktree would break CP1's zero-entry start, add scanned files to every count, and
fail CP15. **CP0.1 asserts their absence.**

## 8. Out of scope

- **Any edit to `docs/backlog.md`**, including the `agent-contract.md` clause 10 entry, the `ai-behavior.md`
  L694 "Last Session" replacement, consolidation, reflow, and any line-count measurement or
  `BACKLOG LIMIT BREACH` flag. Owner exception, §3.6. The file must end byte-identical (AC9d).
- Widening BOM/NUL enforcement to the whole scanned set (OQ2) — AC8 covers only this task's written files.
- Adding root non-`.md`, `.storybook/`, `.github/` to the scanned set, or reaching git-ignored trees (OQ3).
- Any change to `SIGNATURES`, the allowlist glob engine, `isAllowlisted`, `scanFile`, `gitTrackedFiles`, the
  exit codes, or the report format (R8, enforced by CP5b).
- Any product code.
- Fixing mojibake anywhere. Verified at `HEAD`: none exists under `scripts/` except the detector's own table.
- Tasks 665/666/668 and the main worktree.
- Amending `orchestrator-rule-compliance-ledger-template.md` rule 7 (OQ4). Owner-only.

## 9. Current and required behavior

**Current.** `npm run check:mojibake` exits 0 and reports `scanning <N> tracked text file(s) under docs/ src/
app/ components/ modules/ messages/ tasks/ + root *.md`. Every `scripts/` text file is silently unscanned: a
corrupted harness script passes CI. The banner's directory list and its tracked-only wording are both
inaccurate.

**Required after.** The same command still exits 0 on the otherwise-unmodified worktree, now reporting a
scanned-file count higher by exactly the re-derived `$expectedScripts` (CP2), with a banner built from
`SCAN_DIR_PREFIXES` that names every prefix including `scripts/`, no other directory, and describes the
collection as tracked **and** untracked-not-ignored. A planted artifact or invalid-UTF-8 file under `scripts/`
makes it exit **exactly 1** with a report naming that file. The `### Encoding hygiene` section matches the
enforced scope and records the allowlist breadth. **Every other byte of the script is unchanged from `HEAD`,
and `docs/backlog.md` is unchanged from its starting state.**

## 10. Implementation requirements

1. **L35** — append `'scripts/'` to `SCAN_DIR_PREFIXES`. Keep the existing entries and their order.
2. **`scripts/mojibake-allowlist.json`** — append `"scripts/check-mojibake.mjs"` as the **last** element
   (OQ1 default). Keep the file a flat JSON array of strings (L103 throws otherwise). The existing 10 entries
   must remain **verbatim, in their original order, at their original indices** — CP5 compares index by index,
   case-sensitively.
3. **L214** — build the banner from the constant (for example `SCAN_DIR_PREFIXES.join(' ')`) and describe the
   collection honestly.
   Three constraints, all enforced by comparators:
   - the banner **must contain the exact token `untracked-not-ignored`** (CP4). A `tracked` claim without that
     token is a failure;
   - the banner's set of bare-directory tokens (`<name>/`) must equal `SCAN_DIR_PREFIXES` **exactly, in both
     directions** (CP4) — no missing prefix, no extra directory;
   - the banner must remain **one `console.log(...)` statement containing the word `scanning`, with no
     semicolon inside it** (CP5b masks exactly that statement; any other shape fails the preservation check).

   No second in-script copy of the directory list may remain.
4. **`docs/qa-rules.md`, `### Encoding hygiene` section only** — add `scripts/` to the enumerated scope, and
   record the allowlist entry with **both** its reason (the `SIGNATURES` table holds every artifact as a
   literal) **and** its breadth (OQ1a: consulted at **L232** as well as L240, so the detector is exempt from
   the invalid-UTF-8 check too).
   ⚠️ **Wording constraint enforced by CP5.** Inside that section, the set of backticked tokens matching
   `` `<name>/` `` (a bare directory ending in `/`, first character a letter) must equal `SCAN_DIR_PREFIXES`
   **exactly** — no missing entry and no extra directory. Longer paths (`` `scripts/check-mojibake.mjs` ``) and
   dot-prefixed paths (`` `.github/workflows/governance-pr.yml` ``) are unaffected. The section must also
   contain the literal tokens `SIGNATURES` and `L232`.
5. **`docs/backlog-archive.md`** — **exactly one** added line: a new ledger row inserted **immediately after
   the table separator row**, i.e. at the TOP of the newest-first table, per `ai-behavior.md` L696 and the
   prohibition at L702. Shape: `| 2026-07-27 | <concise description> | Task 674 |
   [sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md](sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md) |`.
   Do not paste session content into the ledger (L697, L700).
6. **Session log** — `docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md`, first line exactly
   `# Session Archive: <Description> — 2026-07-27` (em dash U+2014, `ai-behavior.md` L691), containing a
   `Files Changed` table naming all five §7 paths, an explicit record that **`docs/backlog.md` was left
   byte-identical under the §3.6 owner exception**, and the full §14 content. CP11 asserts all of it.
7. **`docs/backlog.md` — do not open for writing.** No entry, no reflow, no whitespace change, no line-ending
   change. It is byte-identical at the end (AC9d, CP1 + CP14).
8. **No other change.** Do not touch `SIGNATURES`, `globToRegExp`, `isAllowlisted`, `scanFile`,
   `gitTrackedFiles`, the exit codes, or the report format (R8). CP5b proves this in three parts, all
   fail-closed:
   - **CP5b.1** — the `HEAD` `SCAN_DIR_PREFIXES` entries must survive **at their original indices**,
     case-sensitively, with `'scripts/'` appended **last**. Editing an existing entry (for example
     `'messages/'` → `'foo/'`) is rejected here; the masked comparison alone cannot see it (D36);
   - **CP5b.2** — the effective EOL policy must be LF, or the checkpoint **stops**: without that, the
     raw-byte comparison below is not a valid invariant (§3.7);
   - **CP5b.3** — everything outside the two permitted regions must be **raw-byte identical** to the `HEAD`
     blob.

   So an "equivalent rewrite" of any protected symbol is a failure, not a judgement call.

## 11. Positive and negative flows

**Positive flow.** In the isolated worktree, run `npm run check:mojibake` → exit 0, banner names every prefix
including `scripts/` plus `untracked-not-ignored`, scanned count up by `$expectedScripts`, `0 artifacts`.

| Negative flow | Applicable | Handling / reason |
|---|---|---|
| Artifact planted in a `scripts/` file | **Yes** | must exit **exactly 1** naming `file:line:col` — AC6(a), the core proof |
| Invalid-UTF-8 file under `scripts/` | **Yes** | must exit **exactly 1** with `Not valid UTF-8` naming the probe — AC6(b) |
| Gate fails for a reason **other** than the probe | **Yes** | CP6/CP7 require the probe path in the report; a non-identifying failure is a distinct failure, not proof |
| Non-zero exit that is not 1 (npm error, crash) | **Yes** | rejected: the script's only non-zero exit is 1 (L265) |
| Detector's own source re-triggers the gate | **Yes** | allowlisted per R3; AC2 proves exit 0 |
| Probe file silently git-ignored | **Yes** | CP6/CP7 assert the collector sees the probe **before** interpreting the exit code |
| `SIGNATURES`, `scanFile`, `globToRegExp`, `gitTrackedFiles`, an exit code or the report format is edited | **Yes** | CP5b.3 raw-byte masked comparison against `HEAD` → `throw` |
| **An existing prefix replaced rather than appended** (`'messages/'` → `'foo/'`) | **Yes** | CP4, CP5 and CP5b.3 all compare against the *edited* constant and would pass; **CP5b.1** compares `HEAD` and current entries index-wise → `throw` |
| Checkout EOL policy changed so the worktree no longer matches the blob | **Yes** | CP5b.2 stops and reports; it does not fall back to a normalized comparison |
| A prefix silently dropped from, or a directory added to, the runtime banner | **Yes** | CP4 compares the banner's directory set to the constant in both directions |
| An existing allowlist entry swapped, reordered, or re-cased | **Yes** | CP5 compares index by index with `-cne` |
| A directory added to the documented scope but not to `SCAN_DIR_PREFIXES` | **Yes** | CP5 compares entry-for-entry in **both** directions |
| **`docs/backlog.md` edited, reflowed, or re-line-ended by habit or by tooling** | **Yes** | AC9d: CP1 content witness, CP14 re-check (`git diff --quiet` **and** SHA-256 equality); CP15 also rejects it as an unexpected path |
| Session file created without an archive row | **Yes** | forbidden by `ai-behavior.md` L702; CP10 requires exactly one new TOP row |
| Session log missing, misnamed, or missing its header / "Files Changed" table / checkpoint coverage | **Yes** | CP11 comparator |
| `git` fails inside a byte capture | **Yes** | CP-G asserts git's own exit code before persisting bytes |
| Allowlist malformed / not an array | **Yes** | existing L103 throw must still fire — do not weaken it |
| Binary file under `scripts/` | **Yes** | `BINARY_EXTS` rejects before the prefix match — unchanged, proven by CP5b |
| Deleted-but-tracked path under `scripts/` | **Yes** | existing L206–212 `missing[]` branch must not crash — unchanged, proven by CP5b |
| A written file gains a BOM or NUL | **Yes** | AC8 fail-closed strict-decode check; the gate itself cannot detect these |
| This kickoff copied into the worktree | **Yes** | CP0.1 rejects it before any measurement |
| Backlog line count / `BACKLOG LIMIT BREACH` | **No** | deferred by owner decision (§3.6); not measured, not flagged, not blocking |
| Locale / i18n behavior | No | no user-facing string; `messages/` untouched |
| RLS / auth / data-write | No | §3.5 — no critical flow touched |
| Responsive / viewport / overlay | No | non-UI task; nothing renders |

## 12. Acceptance criteria

- **AC1 [R1]** Given the CP4 run (**before the session log exists**), the parsed scanned count is higher than
  the CP3 pre-change count by **exactly `$expectedScripts`** as re-derived at CP2. The CP12 run is
  **`$expectedScripts + 1`** — the same set plus the session log. Report all four numbers with the arithmetic
  shown. *(`docs/qa-rules.md` and `docs/backlog-archive.md` are already tracked and scanned, so editing them
  changes no count; `docs/backlog.md` is not edited at all; only the new session log adds one.)*
- **AC2 [R2,R3]** Given the same CP4 run, it **exits 0** with `0 artifacts`, and `scripts/check-mojibake.mjs`
  is present in `scripts/mojibake-allowlist.json`.
- **AC3 [R3]** Given `scripts/mojibake-allowlist.json`, CP5 finds the `HEAD` entries **at their original
  indices, byte-identical and case-identical**, exactly one additional element, and that element is
  `scripts/check-mojibake.mjs` in **last** position; the file parses as a flat array of strings.
- **AC4 [R4,R5]** Given the CP4 runtime banner and the CP5 source comparator: the banner's bare-directory
  token set **equals `SCAN_DIR_PREFIXES` in both directions**, it contains the token `untracked-not-ignored`,
  and the source holds **no** second hardcoded copy of the directory list.
- **AC5 [R3,R6]** Given the `### Encoding hygiene` section of `docs/qa-rules.md` **in isolation**, its
  backticked bare-directory token set equals `SCAN_DIR_PREFIXES` **exactly in both directions**, and the
  section contains both the `SIGNATURES` reason and the `L232` breadth statement.
- **AC6 [R7] — planted-violation proof, both branches. This AC cannot be met by a passing run.**
  - **(a)** Create `scripts/__mojibake_probe_sig.tmp.mjs` containing the 3-codepoint sequence
    **U+00D4 U+00A3 U+00E0** — construct it from the codepoints; do **not** copy the literal out of the
    `SIGNATURES` table into any file. Run the gate → **exit exactly 1**, output contains
    `check:mojibake FAILED` and a report line matching `__mojibake_probe_sig\.tmp\.mjs:\d+:\d+`. Quote the
    failing output **with the artifact redacted**. Delete the probe → re-run → **exit 0**.
  - **(b)** Create `scripts/__mojibake_probe_utf8.tmp.mjs` containing a lone `0x80` byte → **exit exactly 1**,
    output names the probe path and `Not valid UTF-8`. Delete → re-run → **exit 0**.
  - Both probes are created and removed inside a PowerShell `try`/`finally` (CP6/CP7) so an aborted run cannot
    leave one behind. Deletion is by file removal only — **never** `git clean`/`restore`/`checkout --`.
- **AC7 [R8]** Three comparators, all in CP5b:
  - **(a) Prefix preservation.** The `SCAN_DIR_PREFIXES` entries parsed from the `HEAD` blob appear in the
    edited file **at the same indices**, compared case-sensitively; the count is `HEAD + 1`; the **last**
    element is exactly `'scripts/'`. A replaced entry such as `'messages/'` → `'foo/'` fails here.
  - **(b) EOL precondition.** The effective checkout policy for this file is LF (§3.7). If CRLF conversion is
    in effect the checkpoint **stops and reports**; it does not substitute a weaker comparison.
  - **(c) Raw-byte identity outside two regions.** With (b) satisfied, the `HEAD` blob bytes and the worktree
    file bytes — both read raw and decoded with a **strict** UTF-8 decoder, with **no** line-ending or
    trailing-newline normalization — are identical after masking exactly the `SCAN_DIR_PREFIXES` array literal
    and the single banner `console.log` statement; and the `process.exit(0)`/`process.exit(1)` site counts are
    unchanged. `SIGNATURES`, `globToRegExp`, `isAllowlisted`, `scanFile`, `gitTrackedFiles`, the exit codes and
    the report format are therefore untouched **by comparator, not by inspection**.

  The claim is exactly this and no more: raw-byte identity **outside the two masked regions**, plus an
  index-wise content check **inside** the first of them. Nothing here asserts identity of the masked regions
  themselves beyond (a).
- **AC8 [R9]** Given the CP13 fail-closed check over **all five §7 paths**, every file has **no BOM**, **no NUL
  byte**, and decodes under a **strict** UTF-8 decoder that throws on malformed input.
- **AC9b [R10]** Given `docs/backlog-archive.md`, CP10 finds **exactly one** added line, no removed line, the
  added line is a ledger row dated `2026-07-27` naming `Task 674` and linking the session file, and it is the
  **first data row** immediately after the table separator (`ai-behavior.md` L696).
- **AC9c [R10]** Given the session log, CP11 finds it **exists at the exact §7 path**, its first line matches
  `# Session Archive: <Description> — 2026-07-27` (`ai-behavior.md` L691), it contains a `Files Changed`
  table, it names **all five** §7 paths, it records that `docs/backlog.md` was left **byte-identical** under
  the §3.6 exception, and it reports **every** checkpoint id `CP0`–`CP15` and **every** requirement id
  `R1`–`R12` required by §14.
- **AC9d [R10]** Given the CP1 content witness and the CP14 re-check, **`docs/backlog.md` is byte-identical**:
  `git diff --quiet -- docs/backlog.md` exits 0 **and** the file's SHA-256 equals the witness captured before
  any write. An equal `git status` alone is not accepted as proof
  (`orchestrator-evidence-first-preflight.md`).
- **AC10 [R11]** Given the CP1 zero-entry starting snapshot and the CP15 final
  `git status --porcelain=v1 -z -uall`, captured as raw bytes, the final set is **exactly the five §7 paths and
  nothing else** — `docs/backlog.md` among the paths that must **not** appear. Both probe files are absent; no
  evidence artifact is in-tree; this kickoff is not in the tree (CP0.1).
- **AC11 [R12]** `npx tsc --noEmit` clean and **`npm run build` exits 0**, each asserted by an explicit
  `if ($LASTEXITCODE -ne 0) { throw … }` with the transcript persisted (mandatory non-Q0 hard gate).

## 13. QA profile and verification plan

**Profile: `Q1 Targeted`** — `docs/qa-profiles.md` **L13**: *"Non-UI code … internal helpers"*, requiring
targeted commands, typecheck, the final `npm run build` at exit 0, and file-integrity/mojibake checks for
touched text files. Not Q2/Q3: nothing renders, no primitive, no responsive surface, no locale string. Not Q4:
no critical-flow registry entry (§3.5).

⚠️ **One Q4-row requirement is deliberately imported.** The *planted-violation failure proof when a gate is
claimed* clause lives in the `Q4` row at **L16**, not in Q1. It is imported into AC6 because this task claims a
gate, and because of Task 668 finding F8: a gate that has only ever reported PASS has not been shown to detect
anything. This does not reclassify the task as Q4.

**Order is mandatory and strictly sequential.** All commands run in `C:\Claude_Code_Projects\lero-al-task674`,
under **Windows PowerShell 5.1**. Relative paths resolve against the worktree root; do not change directory
mid-plan. **Every checkpoint persists its own artifact under `$EV`** — console output alone is not evidence.

### Helpers — define before any checkpoint

⚠️ **Encoding discipline.** Windows PowerShell 5.1 `Get-Content` decodes with the **ANSI code page**, not
UTF-8, so it silently mangles every non-ASCII byte in this repo's files. Every read of a **repo file** below
therefore goes through `Read-Utf8Text` / `Read-Utf8Lines` (raw bytes + strict UTF-8), and every `HEAD` side
goes through `Invoke-GitBytes`. The `*>` **run logs** are the deliberate exception: PS 5.1 writes them with a
BOM and `Get-Content -Raw` detects it correctly — do not "fix" those to a strict UTF-8 read, it would break
them.

```powershell
$Utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)   # (emitBOM=false, throwOnInvalidBytes=true)

function Read-Utf8Text([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Read-Utf8Text: $Path missing" }
  $Utf8Strict.GetString([IO.File]::ReadAllBytes($Path))
}

function Read-Utf8Lines([string]$Path) { (Read-Utf8Text $Path) -split "`r?`n" }

function Save-Ev([string]$name, [object]$content) {
  $p = Join-Path $EV $name
  $content | Out-File -LiteralPath $p -Encoding utf8 -Width 4096
  "persisted -> $p"
}

function Get-ScannedCount([string]$logPath) {          # CP-P
  $t  = Get-Content -LiteralPath $logPath -Raw
  $m1 = [regex]::Match($t, 'scanning\s+(\d+)\s')
  $m2 = [regex]::Match($t, '0 artifacts in\s+(\d+)\s+files')
  if (-not $m1.Success) { throw "CP-P: banner scanned-count not found in $logPath (parser drift)" }
  if (-not $m2.Success) { throw "CP-P: success summary not found in $logPath (run did not exit clean)" }
  $a = [int]$m1.Groups[1].Value
  $b = [int]$m2.Groups[1].Value
  if ($a -ne $b) { throw "CP-P: banner count $a disagrees with summary count $b in $logPath" }
  return $a
}

function Get-ScanPrefixes([string]$Source) {           # shared by CP4 and CP5
  $m = [regex]::Match($Source, 'SCAN_DIR_PREFIXES\s*=\s*\[(.*?)\]')
  if (-not $m.Success) { throw "SCAN_DIR_PREFIXES not found - parser drift, stop." }
  $p = @([regex]::Matches($m.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value })
  if ($p.Count -lt 1) { throw "SCAN_DIR_PREFIXES parsed empty" }
  return $p
}

function Get-Sha256([string]$Path) {                   # content witness for the untouched path
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Get-Sha256: $Path missing" }
  (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Invoke-GitBytes([string]$ArgString, [string]$OutFile) {   # CP-G
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName               = 'git'
  $psi.Arguments              = $ArgString
  $psi.WorkingDirectory       = $root
  $psi.UseShellExecute        = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $p = [System.Diagnostics.Process]::Start($psi)
  $errTask = $p.StandardError.ReadToEndAsync()   # drained concurrently - a full stderr buffer would deadlock
  $ms = New-Object System.IO.MemoryStream
  $p.StandardOutput.BaseStream.CopyTo($ms)
  $p.WaitForExit()
  $stderr = $errTask.Result
  if ($p.ExitCode -ne 0) { throw "CP-G: 'git $ArgString' exited $($p.ExitCode) - $stderr" }
  $bytes = $ms.ToArray()
  [IO.File]::WriteAllBytes($OutFile, $bytes)
  return ,$bytes
}
```

`>` must **not** be used for `--porcelain -z`: in Windows PowerShell 5.1 `>` is `Out-File`, which decodes,
re-encodes and appends a trailing newline, corrupting the NUL-separated byte stream. `*>` is used only for text
run logs consumed by regex, never by byte position.

**CP-E — evidence directory, created first and proven outside the worktree. Fail-closed.**

```powershell
$root = (Resolve-Path .).Path
$EV   = Join-Path $env:TEMP 'task674-evidence'
New-Item -ItemType Directory -Force -Path $EV | Out-Null
if ($EV.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
  throw "CP-E: evidence directory must live outside the worktree, got $EV"
}
$fivePaths = @('scripts/check-mojibake.mjs','scripts/mojibake-allowlist.json','docs/qa-rules.md',
               'docs/backlog-archive.md',
               'docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md')
$untouched = 'docs/backlog.md'          # owner exception, section 3.6 - must end byte-identical
Save-Ev 'cp-e.txt' (@("root=$root", "EV=$EV", "fivePaths:") + $fivePaths + @("untouched=$untouched"))
"CP-E OK - evidence at $EV"
```

**CP0 — worktree provenance (owner-created; executor records).**

```powershell
$sha = (git rev-parse HEAD).Trim();             if ($LASTEXITCODE -ne 0) { throw "CP0: git rev-parse failed" }
$brn = (git rev-parse --abbrev-ref HEAD).Trim()
if ($sha -ne 'f80550f35399a16d7c4df29f8a39a2d85ebe7d9e') {
  throw "CP0: HEAD is $sha - the verified context in section 3 does not describe this tree. Stop."
}
Save-Ev 'cp0-provenance.txt' @("worktree=$root", "branch=$brn", "head=$sha")
"CP0 OK - $root @ $brn @ $sha"
```

**CP0.1 — task artifacts must not be inside the worktree (§7.2). Fail-closed.**

```powershell
$strays = @('tasks/kickoff_prompt_Task_674_mojibake_gate_scripts_coverage.md',
            'tasks/task674-preflight-ledger-and-contract.md') |
          Where-Object { Test-Path -LiteralPath $_ }
if ($strays) {
  Save-Ev 'cp0.1-strays.txt' $strays
  throw "CP0.1: $($strays -join ', ') copied into the isolated worktree - poisons CP1, every scanned count and CP15. Remove and restart."
}
Save-Ev 'cp0.1.txt' 'CP0.1 OK - task artifacts are outside the tree'
"CP0.1 OK"
```

**CP1 — zero-entry starting snapshot **and** the `docs/backlog.md` content witness. Fail-closed.**

Captured **before the task writes anything**, as `orchestrator-evidence-first-preflight.md` requires for an
untouched-path claim.

```powershell
$startBytes = Invoke-GitBytes 'status --porcelain=v1 -z -uall' "$EV\cp1-start.bin"
if ($startBytes.Length -ne 0) {
  Save-Ev 'cp1-dirty.txt' ([Text.Encoding]::UTF8.GetString($startBytes) -split "`0" | Where-Object { $_ })
  throw "CP1: worktree is NOT clean ($($startBytes.Length) bytes) - stop."
}
$backlogWitness = Get-Sha256 $untouched
$backlogLen     = (Get-Item -LiteralPath $untouched).Length
Save-Ev 'cp1.txt' @('CP1 OK - zero starting entries; cp1-start.bin is 0 bytes',
                    "witness $untouched SHA256=$backlogWitness bytes=$backlogLen")
"CP1 OK - witness captured for $untouched"
```

A valid empty state is persisted as a zero-length artifact; it is never read as a missing artifact. CP1 is the
evidence that replaces the dirty-worktree manifest, and the witness is the evidence for AC9d.

**CP2 — re-derive `$expectedScripts`. Do not reuse 72. `BINARY_EXTS` is parsed, not copied.**

```powershell
$srcPre = Read-Utf8Text 'scripts/check-mojibake.mjs'
$mBin = [regex]::Match($srcPre, 'BINARY_EXTS = new Set\(\[(.*?)\]\)',
                       [Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $mBin.Success) { throw "CP2: BINARY_EXTS not parseable - script shape changed, stop." }
$bin = @([regex]::Matches($mBin.Groups[1].Value, "'([^']+)'") |
         ForEach-Object { $_.Groups[1].Value.ToLower() })
if ($bin.Count -lt 1) { throw "CP2: BINARY_EXTS parsed empty" }

# zero/empty control - proves the pipeline reports empty as empty, not as a missing artifact
$zeroCtl = @(git ls-files --cached --others --exclude-standard -- 'scripts/__nonexistent__/')
if ($LASTEXITCODE -ne 0)  { throw "CP2: git ls-files failed on the zero control" }
if ($zeroCtl.Count -ne 0) { throw "CP2: zero-form control returned $($zeroCtl.Count), expected 0" }

$scriptFiles = @(git ls-files --cached --others --exclude-standard -- 'scripts/')
if ($LASTEXITCODE -ne 0) { throw "CP2: git ls-files failed" }
$kept = @($scriptFiles |
  Where-Object { ($bin -notcontains [IO.Path]::GetExtension($_).ToLower()) -and
                 (Test-Path -LiteralPath $_ -PathType Leaf) } | Sort-Object -Unique)
$expectedScripts = $kept.Count
if ($expectedScripts -lt 1) { throw "CP2: expectedScripts=$expectedScripts - impossible for this repo, investigate." }
Save-Ev 'cp2-expected-scripts.txt' (@("expectedScripts=$expectedScripts", "binaryExts=$($bin -join ',')", '--- files ---') + $kept)
"CP2 OK - expected scanned-count delta: $expectedScripts   (design-time reference: 72 at HEAD)"
```

**CP3 — pre-change baseline.**

```powershell
npm run check:mojibake *> "$EV\cp3-before.log"; $c = $LASTEXITCODE
if ($c -ne 0) { throw "CP3: baseline must exit 0, got $c" }
$scannedBefore = Get-ScannedCount "$EV\cp3-before.log"
Save-Ev 'cp3.txt' "scannedBefore=$scannedBefore exit=$c"
"CP3 OK - scannedBefore = $scannedBefore   (design-time reference: 1893 at HEAD)"
```

**CP4 — apply §10.1 to §10.4, then re-run.** ⚠️ **Do not create the session log yet** (CP11) — `docs/sessions/`
is inside the scanned set and an early file breaks this arithmetic. The two doc edits touch already-tracked,
already-scanned files, so their position does not affect any count.

```powershell
npm run check:mojibake *> "$EV\cp4-after.log"; $c = $LASTEXITCODE
if ($c -ne 0) { throw "CP4: post-change run must exit 0, got $c" }
$scannedAfterEdit = Get-ScannedCount "$EV\cp4-after.log"
if ($scannedAfterEdit -ne $scannedBefore + $expectedScripts) {
  throw "CP4: delta $($scannedAfterEdit - $scannedBefore) != expected $expectedScripts"
}

# --- AC4 on the RUNTIME banner: every prefix, no extra directory, honest collection wording
$prefixes = Get-ScanPrefixes (Read-Utf8Text 'scripts/check-mojibake.mjs')
if ($prefixes -notcontains 'scripts/') { throw "AC4: scripts/ missing from SCAN_DIR_PREFIXES" }
$bannerLines = @(Get-Content -LiteralPath "$EV\cp4-after.log" | Where-Object { $_ -match 'scanning\s+\d+' })
if ($bannerLines.Count -ne 1) { throw "AC4: expected exactly 1 banner line, got $($bannerLines.Count)" }
$b = $bannerLines[0]
foreach ($p in $prefixes) {
  if ($b -notmatch [regex]::Escape($p)) { throw "AC4: runtime banner does not name $p -- banner: $b" }
}
$bannerDirs = @([regex]::Matches($b, '(?<![\w./])([A-Za-z][A-Za-z0-9._-]*/)') |
                ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$dBanner = Compare-Object @($prefixes | Sort-Object -Unique) $bannerDirs
if ($dBanner) {
  Save-Ev 'cp4-banner-diff.txt' ($dBanner | Format-Table -AutoSize | Out-String)
  throw "AC4: banner directory set != SCAN_DIR_PREFIXES ('<=' missing from the banner, '=>' extra in the banner)"
}
if ($b -notmatch 'untracked-not-ignored') { throw "AC4: banner lacks the required 'untracked-not-ignored' token: $b" }
Save-Ev 'cp4.txt' @("scannedAfterEdit=$scannedAfterEdit", "delta=$($scannedAfterEdit-$scannedBefore)", "banner=$b",
                    "prefixes=$($prefixes -join ' ')", "bannerDirs=$($bannerDirs -join ' ')")
"CP4 OK - scannedAfterEdit = $scannedAfterEdit (+$expectedScripts); banner matches the prefix set exactly"
```

The banner **must** contain the word `tracked` as part of `tracked and untracked-not-ignored`. Only a
tracked-only claim is rejected, and it is rejected by the **absence** of `untracked-not-ignored`, never by the
presence of `tracked`.

**CP5 — source comparators for AC3/AC4/AC5. Fail-closed, no-match guards, ordered allowlist.**

```powershell
$src = Read-Utf8Text 'scripts/check-mojibake.mjs'
$prefixes = Get-ScanPrefixes $src

# --- AC4: no second hardcoded copy of the list anywhere in the source
$docsOccurrences = ([regex]::Matches($src, "'docs/'")).Count
if ($docsOccurrences -ne 1) { throw "AC4: 'docs/' appears $docsOccurrences times; the list must exist once (L35)" }
if ($src -match 'docs/ src/') { throw "AC4: a space-joined hardcoded directory list is still present" }

# --- AC3: HEAD entries at their original indices, verbatim and case-identical; one append at the END
$headAllowBytes = Invoke-GitBytes 'show HEAD:scripts/mojibake-allowlist.json' "$EV\cp5-head-allowlist.json"
$headAllow = @($Utf8Strict.GetString($headAllowBytes) | ConvertFrom-Json)
$nowAllow  = @((Read-Utf8Text 'scripts/mojibake-allowlist.json') | ConvertFrom-Json)
if (@($nowAllow | Where-Object { $_ -isnot [string] }).Count -ne 0) { throw "AC3: allowlist is not a flat array of strings" }
if ($nowAllow.Count -ne $headAllow.Count + 1) {
  throw "AC3: allowlist has $($nowAllow.Count) entries, expected $($headAllow.Count) + 1"
}
for ($i = 0; $i -lt $headAllow.Count; $i++) {
  if ($nowAllow[$i] -cne $headAllow[$i]) {
    throw "AC3: entry $i changed, re-cased or reordered - HEAD '$($headAllow[$i])' vs now '$($nowAllow[$i])'"
  }
}
if ($nowAllow[$headAllow.Count] -cne 'scripts/check-mojibake.mjs') {
  throw "AC3: the appended entry must be exactly 'scripts/check-mojibake.mjs' in last position, got '$($nowAllow[$headAllow.Count])'"
}

# --- AC5: the Encoding hygiene section in isolation, entry-for-entry, both directions
$qaAll = Read-Utf8Text 'docs/qa-rules.md'
$mSec  = [regex]::Match($qaAll, '(?ms)^### Encoding hygiene.*?(?=^#{2,3} |\z)')
if (-not $mSec.Success) { throw "AC5: '### Encoding hygiene' section not found in docs/qa-rules.md" }
$sec = $mSec.Value
$listed = @([regex]::Matches($sec, '`([A-Za-z][A-Za-z0-9._-]*/)`') |
            ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$dScope = Compare-Object @($prefixes | Sort-Object -Unique) $listed
if ($dScope) {
  Save-Ev 'cp5-scope-diff.txt' ($dScope | Format-Table -AutoSize | Out-String)
  throw "AC5: documented scope != SCAN_DIR_PREFIXES entry-for-entry ('<=' missing from the doc, '=>' extra in the doc)"
}
if ($sec -notmatch 'SIGNATURES') { throw "AC5: the allowlist reason (the SIGNATURES table) is not stated in the section" }
if ($sec -notmatch 'L232')       { throw "AC5: the OQ1a breadth statement (L232) is not stated in the section" }

Save-Ev 'cp5.txt' @("prefixes=$($prefixes -join ' ')", "allowlistHead=$($headAllow.Count) now=$($nowAllow.Count)",
                    "appended=$($nowAllow[$headAllow.Count])", "docScope=$($listed -join ' ')")
"CP5 OK - ordered allowlist, single prefix list, Encoding-hygiene section in exact agreement"
```

**CP5b — AC7 preservation. Three fail-closed parts.**

Inspection is not a comparator (ledger rule 4). Together these prove that the `HEAD` prefix entries survive at
their original indices **and** that everything outside the two permitted regions is raw-byte identical to the
`HEAD` blob — which covers `SIGNATURES`, `globToRegExp`, `isAllowlisted`, `scanFile`, `gitTrackedFiles`, the
exit codes and the report format without enumerating them.

**CP5b.1 — the masked region's contents. The masked comparison below cannot see inside it.**

```powershell
$headBytes = Invoke-GitBytes 'show HEAD:scripts/check-mojibake.mjs' "$EV\cp5b-head.bin"
$headSrc   = $Utf8Strict.GetString($headBytes)
$nowSrc    = Read-Utf8Text 'scripts/check-mojibake.mjs'

$headPrefixes = Get-ScanPrefixes $headSrc
$nowPrefixes  = Get-ScanPrefixes $nowSrc
if ($nowPrefixes.Count -ne $headPrefixes.Count + 1) {
  throw "AC7a: SCAN_DIR_PREFIXES has $($nowPrefixes.Count) entries, expected $($headPrefixes.Count) + 1"
}
for ($i = 0; $i -lt $headPrefixes.Count; $i++) {
  if ($nowPrefixes[$i] -cne $headPrefixes[$i]) {
    throw "AC7a: prefix $i changed, re-cased or reordered - HEAD '$($headPrefixes[$i])' vs now '$($nowPrefixes[$i])'"
  }
}
if ($nowPrefixes[$headPrefixes.Count] -cne 'scripts/') {
  throw "AC7a: the appended prefix must be exactly 'scripts/' in last position, got '$($nowPrefixes[$headPrefixes.Count])'"
}
Save-Ev 'cp5b1.txt' @("HEAD prefixes: $($headPrefixes -join ' ')", "now prefixes: $($nowPrefixes -join ' ')",
                      "index-wise equality OK; appended='scripts/' last")
"CP5b.1 OK - HEAD entries preserved at their indices, scripts/ appended last"
```

Counterexample this exists for: `'messages/'` → `'foo/'`. CP4, CP5 and CP5b.3 all compare the banner, the
documentation and the masked source against the **edited** constant, so a consistent rename satisfies every one
of them. CP5b.1 throws at index 5.

**CP5b.2 — EOL precondition for the raw-byte proof (§3.7). Stop, do not degrade.**

```powershell
$eolAttr  = (((git check-attr eol  -- scripts/check-mojibake.mjs) -split ':')[-1]).Trim()
$textAttr = (((git check-attr text -- scripts/check-mojibake.mjs) -split ':')[-1]).Trim()
$autocrlf = (git config --get core.autocrlf); if (-not $autocrlf) { $autocrlf = 'unset' }
$conv = if     ($eolAttr  -eq 'crlf')  { 'crlf' }
        elseif ($eolAttr  -eq 'lf')    { 'lf'   }
        elseif ($textAttr -eq 'unset') { 'none' }
        elseif ($autocrlf -eq 'true')  { 'crlf' }
        else                           { 'lf'   }
Save-Ev 'cp5b2.txt' @("check-attr eol=$eolAttr", "check-attr text=$textAttr",
                      "core.autocrlf=$autocrlf", "effective checkout conversion=$conv")
if ($conv -eq 'crlf') {
  throw "AC7b: CRLF checkout conversion is in effect (eol=$eolAttr, text=$textAttr, autocrlf=$autocrlf). The worktree file then legitimately differs from the HEAD blob, so raw-byte identity is NOT a valid invariant here. STOP and report - do not substitute a normalized comparison."
}
"CP5b.2 OK - effective conversion '$conv'; raw-byte comparison is valid"
```

Design-time reference (§3.7): `.gitattributes` pins `* text=auto eol=lf` and `core.autocrlf=false`, so `$conv`
resolves to `lf` and this guard passes. It exists so that a future change to that policy surfaces as an
explicit stop rather than as a silent weakening of AC7.

**CP5b.3 — raw-byte identity outside the two permitted regions.**

Both sides are raw bytes decoded with the strict UTF-8 decoder: **no** line splitting, **no** line-ending
normalization, **no** trailing-newline loss, **no** ANSI code-page decoding.

```powershell
$maskPrefixes = 'SCAN_DIR_PREFIXES\s*=\s*\[[^\]]*\]'
$maskBanner   = '(?s)console\.log\(`check:mojibake[^;]*?scanning[^;]*?\);'
function Mask-Src([string]$s) {
  $s = [regex]::Replace($s, $maskPrefixes, '<<<PREFIXES>>>')
  [regex]::Replace($s, $maskBanner, '<<<BANNER>>>')
}
$hMask = Mask-Src $headSrc
$nMask = Mask-Src $nowSrc
if ($hMask -notmatch '<<<PREFIXES>>>' -or $hMask -notmatch '<<<BANNER>>>') {
  throw "AC7c: masks did not match the HEAD source - parser drift, stop."
}
if ($nMask -notmatch '<<<PREFIXES>>>' -or $nMask -notmatch '<<<BANNER>>>') {
  throw "AC7c: masks did not match the edited source - the banner must remain ONE console.log statement containing 'scanning', with no semicolon inside it (section 10.3)"
}
if ($hMask -cne $nMask) {
  $hl = $hMask -split "`n"; $nl = $nMask -split "`n"; $report = @()
  for ($i = 0; $i -lt [Math]::Max($hl.Count, $nl.Count); $i++) {
    if ($hl[$i] -cne $nl[$i]) { $report += "masked line $($i+1):"; $report += "  HEAD: $($hl[$i])"; $report += "  NOW : $($nl[$i])" }
  }
  Save-Ev 'cp5b-diff.txt' $report
  throw "AC7c: the script differs from HEAD outside the two permitted regions - SIGNATURES / globToRegExp / isAllowlisted / scanFile / gitTrackedFiles / exit codes / report format must be untouched. See cp5b-diff.txt"
}
$e0h = ([regex]::Matches($headSrc, 'process\.exit\(0\)')).Count
$e1h = ([regex]::Matches($headSrc, 'process\.exit\(1\)')).Count
$e0n = ([regex]::Matches($nowSrc,  'process\.exit\(0\)')).Count
$e1n = ([regex]::Matches($nowSrc,  'process\.exit\(1\)')).Count
if ($e0h -ne $e0n -or $e1h -ne $e1n) { throw "AC7c: exit-code sites changed - HEAD ($e0h,$e1h) vs now ($e0n,$e1n)" }
Save-Ev 'cp5b3.txt' @("raw-byte masked comparison: IDENTICAL",
                      "HEAD bytes=$($headBytes.Length)", "now bytes=$((Get-Item -LiteralPath 'scripts/check-mojibake.mjs').Length)",
                      "exit0 sites=$e0n", "exit1 sites=$e1n",
                      "permitted regions: SCAN_DIR_PREFIXES literal, banner console.log statement",
                      "claim scope: raw-byte identity OUTSIDE the two masked regions only")
"CP5b.3 OK - raw-byte identical to HEAD outside the two permitted regions"
```

**What CP5b does and does not claim.** It claims (1) the `HEAD` prefix entries at their original indices with
`'scripts/'` appended last, and (2) raw-byte identity everywhere **outside** the `SCAN_DIR_PREFIXES` literal
and the banner statement. It does **not** claim anything about the byte content of the banner statement beyond
what CP4 asserts at run time, and it does not claim whole-file byte identity — the file is expected to differ,
in exactly those two places.

**CP6 — AC6(a) planted signature probe. Exactly exit 1, and the diagnostic must identify the probe.**

```powershell
$p = 'scripts/__mojibake_probe_sig.tmp.mjs'
try {
  # U+00D4 U+00A3 U+00E0 written as UTF-8 bytes; never copied from the SIGNATURES table
  [IO.File]::WriteAllBytes((Join-Path $root $p), [byte[]](0xC3,0x94,0xC2,0xA3,0xC3,0xA0))

  $seen = @(git ls-files --others --exclude-standard -- 'scripts/') -contains $p
  if (-not $seen) { throw "AC6a: probe is invisible to git ls-files (ignored?) - the run would prove nothing" }

  npm run check:mojibake *> "$EV\cp6-probe-sig.log"; $code = $LASTEXITCODE
  $out = Get-Content -LiteralPath "$EV\cp6-probe-sig.log" -Raw
  if ($code -ne 1) { throw "AC6a: expected exit exactly 1, got $code - not a gate rejection" }
  if ($out -notmatch 'check:mojibake FAILED') { throw "AC6a: exit 1 did not come from the gate's own failure path" }
  if ($out -notmatch '__mojibake_probe_sig\.tmp\.mjs:\d+:\d+') {
    throw "AC6a: the report does not identify the probe with file:line:col - the failure is not attributable to it"
  }
  Save-Ev 'cp6.txt' "AC6a exit=$code; probe named with file:line:col; see cp6-probe-sig.log"
  "AC6a OK - exit 1, probe named with file:line:col"
} finally { Remove-Item -LiteralPath $p -ErrorAction SilentlyContinue }
npm run check:mojibake *> "$EV\cp6-recovery.log"
if ($LASTEXITCODE -ne 0) { throw "AC6a: recovery run must exit 0" }
"CP6 OK"
```

**CP7 — AC6(b) invalid-UTF-8 probe. Same shape.**

```powershell
$p = 'scripts/__mojibake_probe_utf8.tmp.mjs'
try {
  [IO.File]::WriteAllBytes((Join-Path $root $p), [byte[]](0x80))
  $seen = @(git ls-files --others --exclude-standard -- 'scripts/') -contains $p
  if (-not $seen) { throw "AC6b: probe is invisible to git ls-files (ignored?)" }

  npm run check:mojibake *> "$EV\cp7-probe-utf8.log"; $code = $LASTEXITCODE
  $out = Get-Content -LiteralPath "$EV\cp7-probe-utf8.log" -Raw
  if ($code -ne 1) { throw "AC6b: expected exit exactly 1, got $code" }
  if ($out -notmatch 'check:mojibake FAILED')           { throw "AC6b: exit 1 did not come from the gate" }
  if ($out -notmatch '__mojibake_probe_utf8\.tmp\.mjs') { throw "AC6b: the report does not name the probe" }
  if ($out -notmatch 'Not valid UTF-8')                 { throw "AC6b: wrong branch - expected the invalid-UTF-8 error" }
  Save-Ev 'cp7.txt' "AC6b exit=$code; probe named; invalid-UTF-8 branch; see cp7-probe-utf8.log"
  "AC6b OK - exit 1, probe named, invalid-UTF-8 branch"
} finally { Remove-Item -LiteralPath $p -ErrorAction SilentlyContinue }
npm run check:mojibake *> "$EV\cp7-recovery.log"
if ($LASTEXITCODE -ne 0) { throw "AC6b: recovery run must exit 0" }
"CP7 OK"
```

**CP8 — typecheck. Fail-closed.**

```powershell
npx tsc --noEmit *> "$EV\cp8-tsc.log"
if ($LASTEXITCODE -ne 0) { Get-Content "$EV\cp8-tsc.log" -Tail 40; throw "CP8: tsc exited $LASTEXITCODE" }
"CP8 OK - tsc clean (transcript: cp8-tsc.log)"
```

**CP9 — production build. Mandatory non-Q0 hard gate. Fail-closed.**

```powershell
npm run build *> "$EV\cp9-build.log"
if ($LASTEXITCODE -ne 0) { Get-Content "$EV\cp9-build.log" -Tail 60; throw "CP9: npm run build exited $LASTEXITCODE" }
"CP9 OK - build exit 0 (transcript: cp9-build.log)"
```

A failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

**CP10 — apply §10.5, then the archive comparator. Exactly one new TOP row.**

```powershell
$archHeadBytes = Invoke-GitBytes 'show HEAD:docs/backlog-archive.md' "$EV\cp10-head-archive.md"
$archHead = @($Utf8Strict.GetString($archHeadBytes) -split "`r?`n")
$archNow  = @(Read-Utf8Lines 'docs/backlog-archive.md')

$archRemoved = @(Compare-Object $archHead $archNow | Where-Object SideIndicator -eq '<=')
if ($archRemoved) {
  Save-Ev 'cp10-removed.txt' ($archRemoved | Format-Table -AutoSize | Out-String)
  throw "AC9b: existing archive rows were removed or reflowed"
}
$archAdded = @(Compare-Object $archHead $archNow | Where-Object SideIndicator -eq '=>')
if ($archAdded.Count -ne 1) {
  Save-Ev 'cp10-added.txt' ($archAdded | Format-Table -AutoSize | Out-String)
  throw "AC9b: expected exactly 1 added archive row, got $($archAdded.Count)"
}
$row = [string]$archAdded[0].InputObject
if ($row -notmatch '^\|\s*2026-07-27\s*\|') { throw "AC9b: the row must start with the session date: $row" }
if ($row -notmatch '\|\s*Task 674\s*\|')    { throw "AC9b: the row must name 'Task 674' in the Tasks column" }
if ($row -notmatch 'sessions/2026-07-27-task674-mojibake-gate-scripts-coverage\.md') { throw "AC9b: the row must link the session file" }

$sepIdx = @(0..($archNow.Count - 1) | Where-Object { $archNow[$_] -match '^\|\s*-+\s*\|' })[0]
if ($null -eq $sepIdx) { throw "AC9b: ledger separator row not found" }
if ($archNow[$sepIdx + 1] -cne $row) { throw "AC9b: the new row is not the first data row (TOP) of the ledger - ai-behavior.md L696" }
Save-Ev 'cp10.txt' @("separatorIndex=$sepIdx", "newTopRow: $row")
"CP10 OK - exactly 1 new ledger row, at the TOP"
```

**CP11 — write the session log, then assert its existence and shape. Fail-closed.**

```powershell
$logPath  = 'docs/sessions/2026-07-27-task674-mojibake-gate-scripts-coverage.md'
if (-not (Test-Path -LiteralPath $logPath -PathType Leaf)) { throw "CP11: session log $logPath does not exist" }
$logRaw   = Read-Utf8Text $logPath          # strict UTF-8: the L691 header contains an em dash (U+2014)
$logLines = @($logRaw -split "`r?`n")
if ($logLines.Count -lt 60) { throw "CP11: session log has $($logLines.Count) lines - cannot satisfy the section 14 contract" }
if ($logLines[0] -notmatch '^# Session Archive: .+\u2014 2026-07-27\s*$') {
  throw "CP11: first line must be '# Session Archive: <Description> [em dash] 2026-07-27' per ai-behavior.md L691, got: $($logLines[0])"
}
if ($logRaw -notmatch 'Files Changed') { throw "CP11: no 'Files Changed' table - agent-contract.md clause 10" }
foreach ($sp in $fivePaths) {
  if ($logRaw -notmatch [regex]::Escape($sp)) { throw "CP11: session log does not name $sp in its Files Changed evidence" }
}
if ($logRaw -notmatch [regex]::Escape($untouched)) { throw "CP11: session log does not record the $untouched exception" }
if ($logRaw -notmatch 'byte-identical') { throw "CP11: session log does not state that $untouched was left byte-identical (section 3.6)" }
foreach ($cp in @('CP0','CP1','CP2','CP3','CP4','CP5','CP5b','CP6','CP7','CP8','CP9','CP10','CP11','CP12','CP13','CP14','CP15')) {
  if ($logRaw -notmatch ('\b' + [regex]::Escape($cp) + '\b')) {
    throw "CP11: session log does not report $cp - section 14 requires every checkpoint in order"
  }
}
foreach ($n in 1..12) {
  if ($logRaw -notmatch ('\bR' + $n + '\b')) { throw "CP11: session log does not report requirement R$n" }
}
Save-Ev 'cp11.txt' @("logPath=$logPath", "lines=$($logLines.Count)", "header=$($logLines[0])",
                     "all five paths named; backlog exception recorded; CP0-CP15 present; R1-R12 present")
"CP11 OK - session log exists with the required header, table and coverage"
```

**CP12 — final gate run.**

```powershell
npm run check:mojibake *> "$EV\cp12-final.log"; $c = $LASTEXITCODE
if ($c -ne 0) { throw "CP12: final run must exit 0, got $c" }
$scannedFinal = Get-ScannedCount "$EV\cp12-final.log"
if ($scannedFinal -ne $scannedBefore + $expectedScripts + 1) {
  throw "CP12: final count $scannedFinal != $scannedBefore + $expectedScripts + 1 (the session log is the only new file)"
}
Save-Ev 'cp12.txt' "scannedFinal=$scannedFinal = $scannedBefore + $expectedScripts + 1"
"CP12 OK - scannedFinal = $scannedFinal"
```

Report the figure and this explanation; never retro-fit CP4's count.

**CP13 — AC8 strict UTF-8 / BOM / NUL over all five §7 paths. Fail-closed.**

```powershell
$cp13 = @()   # $Utf8Strict is the shared strict decoder defined with the helpers
foreach ($f in $fivePaths) {
  if (-not (Test-Path -LiteralPath $f -PathType Leaf)) { throw "AC8: $f missing" }
  $bytes = [IO.File]::ReadAllBytes($f)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { throw "AC8: BOM in $f" }
  if ($bytes -contains 0) { throw "AC8: NUL byte in $f" }
  try { $Utf8Strict.GetString($bytes) | Out-Null }
  catch { throw "AC8: $f is not valid UTF-8 - $($_.Exception.Message)" }
  $cp13 += "$f : $($bytes.Length) bytes, no BOM, no NUL, strict-decode OK"
}
Save-Ev 'cp13.txt' $cp13
"CP13 OK - $($fivePaths.Count) files clean"
```

`docs/backlog.md` is deliberately **not** in this list: the task does not write it, so clause 14's
"touched files" obligation does not reach it. Its integrity is covered by AC9d instead.

**CP14 — AC9d `docs/backlog.md` byte-identity. Two independent comparators. Fail-closed.**

```powershell
git diff --quiet -- $untouched
$diffCode = $LASTEXITCODE
$backlogNowHash = Get-Sha256 $untouched
$backlogNowLen  = (Get-Item -LiteralPath $untouched).Length
if ($diffCode -ne 0) { throw "AC9d: git reports $untouched as modified (diff exit $diffCode) - the owner exception requires it byte-identical" }
if ($backlogNowHash -ne $backlogWitness) {
  throw "AC9d: SHA-256 changed - witness $backlogWitness vs now $backlogNowHash ($backlogLen -> $backlogNowLen bytes)"
}
Save-Ev 'cp14.txt' @("$untouched byte-identical",
                     "witness=$backlogWitness now=$backlogNowHash",
                     "bytes=$backlogLen -> $backlogNowLen", "git diff --quiet exit=$diffCode")
"CP14 OK - $untouched unchanged (git + SHA-256)"
```

An equal `git status` alone is **not** accepted as proof that a path was untouched
(`orchestrator-evidence-first-preflight.md`); that is why both a git-level and a byte-level comparator run
here, and why the witness was captured at CP1 before any write.

**CP15 — AC10 final state, raw bytes. Fail-closed.**

```powershell
$finalBytes = Invoke-GitBytes 'status --porcelain=v1 -z -uall' "$EV\cp15-final.bin"
$expected = @($fivePaths | Sort-Object)
$actual   = @([Text.Encoding]::UTF8.GetString($finalBytes) -split "`0" |
              Where-Object { $_ } | ForEach-Object { $_.Substring(3) } | Sort-Object)
$diff = Compare-Object $expected $actual
if ($diff) {
  Save-Ev 'cp15-diff.txt' ($diff | Format-Table -AutoSize | Out-String)
  throw "CP15: final path set does not match the section 7 write set"
}
if ($actual -contains $untouched) { throw "CP15: $untouched appears in the final status - the owner exception forbids any change to it" }
Save-Ev 'cp15.txt' (@("final path set ($($actual.Count)):") + $actual)
"CP15 OK - exactly $($actual.Count) paths"
```

⚠️ `-z` is required: it emits raw NUL-separated paths, whereas the default porcelain quotes and octal-escapes
any path containing a space, quote or non-ASCII byte, and collapses an untracked directory to a single entry.
`-uall` expands directories to files. A rename would appear as two NUL-separated fields; none is expected here,
and an unexpected field shape surfaces as an extra entry that the comparator rejects.

**Exit-code expectations.** Every checkpoint exits 0 **except** the two planted probe runs inside CP6/CP7,
which must exit **exactly 1** with a diagnostic naming the probe — that specific failure *is* the evidence. An
exit code other than 0 or 1, or an exit 1 that does not name the probe, is a failure of the checkpoint, not
proof of coverage. Never report a probe run as exit 0, never leave a probe behind, and never run any of this
against the main worktree. If a required gate cannot run (sandbox, native binary, timeout), record it as
missing evidence with the exact native command and return `PARTIALLY IMPLEMENTED` or `BLOCKED` — never a
confidence claim.

## 14. Completion report contract

**Dormant while the status banner reads `BLOCKED`.** It defines what will be required once OQ4 lands; it is not
an instruction to start.

The session log must include — **with every mojibake artifact named by codepoint, never pasted literally, or
your own evidence will fail the gate**:

- the L691 header line and the worktree path, branch and `HEAD` sha (CP0), the CP0.1 isolation assertion, and
  the **zero-entry CP1 snapshot** as the isolation evidence that replaces a dirty-worktree manifest;
- a **`Files Changed`** table matching the real diff (`agent-contract.md` clause 10), naming all five §7 paths,
  with `git diff` quoted for `scripts/check-mojibake.mjs`, `scripts/mojibake-allowlist.json` and
  `docs/backlog-archive.md`. **Do not quote the `docs/qa-rules.md` diff verbatim** — that file is allowlisted
  precisely because it contains artifact literals, the session log is not, and pasting it would plant artifacts
  in a scanned file and make CP12 exit 1. Describe that change in prose with codepoints instead;
- an explicit record that **`docs/backlog.md` was left byte-identical** under the §3.6 owner exception, quoting
  or precisely referencing that decision, with the CP1 witness hash, the CP14 result, and the note that
  `BACKLOG LIMIT BREACH` is **deferred by owner decision** to separate future work (CP11 asserts the path and
  the phrase `byte-identical` are both present);
- requirement IDs **R1–R12** each with evidence (CP11 asserts each id appears);
- every checkpoint **CP0 through CP15** in order with its **actual exit code**, comparator output, and the
  `$EV` artifact filename it produced (CP11 asserts each id appears);
- the AC7 evidence as **three** results, not a `git diff` eyeball: CP5b.1's `HEAD`-versus-current prefix list
  with the index-wise verdict, CP5b.2's resolved EOL policy (`check-attr eol`/`text`, `core.autocrlf`, the
  effective conversion), and CP5b.3's raw-byte masked comparison with both byte lengths. State the claim in
  the log exactly as §12 AC7 states it — raw-byte identity **outside** the two masked regions — and do not
  paraphrase it as whole-file byte identity;
- `$expectedScripts` and all three scanned counts (CP3, CP4, CP12) with the delta arithmetic shown;
- the **quoted failing output of both planted probes** (artifact redacted), including the exact exit code and
  the report line that names the probe, plus their clean recovery runs;
- the CP15 final path set;
- the archive row added and its TOP placement (`ai-behavior.md` L696/L702);
- the OQ1 route taken and the OQ1a breadth statement;
- assumptions, deviations, limitations;
- the AC1–AC11 self-audit, including AC9b, AC9c and AC9d. **There is no AC9** on this route (D34).

Set status to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Do not
self-approve. Do not run, emit, or suggest any mutating Git command — including `git worktree`.

## 15. Task quality gate

Recomputed from the current text; not carried over.

| Check | Result |
|---|---|
| One active route, no alternatives in the execution plan | **Pass** — §7.1, owner decision quoted in full with source, date and scope |
| Owner authorizations are real, quoted, and traceable | **Pass** — two owner decisions, both quoted in full: route 2 (§7.1) and the `docs/backlog.md` exception (§3.6). The later one supersedes the earlier one's backlog clause, stated explicitly rather than silently. Neither is read as touching rule 7 |
| Write set complete and viable | **Pass** — five paths, all `CLEAN` at `HEAD`; evidence written outside the tree (CP-E) |
| Write set identical across §7, §10, §12, §13, §14 | **Pass** — `$fivePaths` is defined once at CP-E and reused by CP11, CP13 and CP15, so the three cannot drift apart |
| **An excluded path's guarantee is proven, not assumed** | **Pass** — `docs/backlog.md` byte-identity rests on a CP1 content witness and a CP14 two-comparator re-check, plus CP15's explicit rejection. The preflight rule that an equal `git status` cannot prove a path untouched is honoured (D32) |
| Every acceptance criterion has a checkpoint behind it | **Pass** — AC1→CP4/CP12, AC2→CP4, AC3/AC4/AC5→CP4/CP5, AC6→CP6/CP7, AC7→CP5b.1/.2/.3, AC8→CP13, AC9b→CP10, AC9c→CP11, AC9d→CP1/CP14, AC10→CP15, AC11→CP8/CP9 |
| **A masked region's own contents are still checked** | **Pass after correction** — masking `SCAN_DIR_PREFIXES` made CP5b blind to a replaced entry, and CP4/CP5 both compare against the *edited* constant, so `'messages/'` → `'foo/'` passed everywhere. CP5b.1 compares `HEAD` and current entries index-wise (D36) |
| **No claimed property exceeds what the artifact measures** | **Pass after correction** — the previous "byte-for-byte" claim was produced by `Get-Content` + `-join`, which normalizes line endings and decodes with the ANSI code page. CP5b.3 now reads raw bytes on both sides and decodes strictly; AC7, R8 and §10.8 state the claim with its exact scope and its EOL precondition (D37, D38) |
| **Text is read in the encoding it was written in** | **Pass after correction** — PS 5.1 `Get-Content` decodes with the ANSI code page, corrupting every non-ASCII byte. `Read-Utf8Text`/`Read-Utf8Lines` and `Invoke-GitBytes` now cover every repo-file and `HEAD` read; the `*>` run logs deliberately keep BOM-detecting `Get-Content` (D39) |
| Every checkpoint persists an artifact | **Pass** — all 19 checkpoints write to `$EV` via `Save-Ev` or a redirected transcript |
| Every asserted gate can actually fail | **Pass** — CP-E, CP0, CP0.1, CP1–CP15 all `throw`; CP8/CP9 use real `$LASTEXITCODE` tests |
| Byte-level captures are actually byte-level | **Pass** — `Invoke-GitBytes` replaces `>`/`Out-File` for `--porcelain -z` and asserts git's exit code |
| No comparator can pass vacuously | **Pass** — every regex has a `Success` guard; CP5b.3 fails closed if either mask stops matching; CP5b.2 stops rather than degrading when its precondition fails; banner, doc scope and prefix sets are compared in **both** directions |
| Order and verbatim-ness have a comparator | **Pass** — CP5 compares the allowlist index by index with `-cne` |
| No removed obligation left an unverified claim behind | **Pass** — deleting the backlog entry requirement did not delete the need to prove the file unchanged; CP14 replaces CP10's old role (D31, D32) |
| No historical number is a runtime threshold | **Pass** — 72, 1893, 1965, 38, 10, 487 appear only in §3.2 as design-time observations; the allowlist expectation is derived from `HEAD`. No backlog line count appears anywhere |
| Zero and non-empty forms both handled | **Pass** — CP1 requires and persists a valid empty state; CP2 runs an empty-set control and rejects a zero `$expectedScripts`; CP15 compares an explicit five-element set |
| Task-created artifacts placed relative to each measurement | **Pass** — probes after CP4 and removed in `finally`; session log at CP11; the two already-scanned doc files noted as count-neutral; kickoff excluded by CP0.1 |
| PowerShell 5.1 correctness | **Pass** — `ConvertFrom-Json` fed a joined string; no `ArgumentList`; no `>` on binary streams; `-cne` for case-sensitive comparison |
| Rule citations verified | **Pass** — `qa-profiles.md` L13/L16; `agent-contract.md` clauses 9/10/14; `ai-behavior.md` L688–703 read in full and cited by line; every `check-mojibake.mjs` line number re-confirmed |
| Evidence cannot poison the artifact it measures | **Pass** — §14 forbids verbatim quotation of the allowlisted `docs/qa-rules.md` diff into the non-allowlisted session log |
| Negative flows selected by applicability | **Pass** — `BACKLOG LIMIT BREACH` moved to `No` with the owner-decision reason; a new applicable row covers accidental modification of `docs/backlog.md` |
| Assumptions and unresolved decisions visible | **Pass** — OQ1, OQ1a, OQ2, OQ3 disclosed; OQ5 and OQ6 recorded as closed with their reason; OQ4 in the status banner |
| Rule-compliance ledger complete with every applicable row `COMPLIANT` | **FAIL — `BLOCKED`.** One unresolved owner decision: rule 7 phase semantics (OQ4). L31–33 forbids publication |
| Publishable as an executor handoff | **No.** Blocked decision note only |

**Overall: `BLOCKED — OQ4 (global rule 7 clarification) ONLY`. No Sonnet handoff. No commit-and-run.**
The full recomputed ledger and executable-route contract live in
`tasks/task674-preflight-ledger-and-contract.md`.
