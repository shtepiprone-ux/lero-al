# Task 887 — `check:listing-visibility` exits 0 again: the contact-event lookup is allowlisted, not rewritten

**Sprint 78** (hosted next to 850, whose change it follows) · **P2** · **Q2** · Track B (non-UI) · filed 2026-09-26 by
Task 853's review 1 · kickoff written 2026-09-29 · **Status: 📝 `KICKOFF FILED`**

Executor: run this file through the `execute-task` workflow. Your strongest permitted completion status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. You never approve, and you never emit or run a mutating Git command.

## 1. Mode and task type

- Mode: `TASK DESIGN` → implementation handoff.
- Task type: **Regression / Critical Flow Coverage** (the gate registered for "Listing public visibility invariant")
  + governance script data. No UI, no visible text, no database, no product behaviour change.
- Execution state: `from-scratch`.
- GR-1 / GR-3 / GR-3a / GR-3b / GR-3c / GR-3d: **not applicable** — no visible surface, Story or text changes.

## 2. Objective

The gate has been red on `main` since Task 850 (2026-09-20) on one line. Make it green **without changing what the
line does**: add one fingerprinted allowlist entry with a reason, prove with a two-armed plant that the gate still
fails on a new inline literal in the same file, and leave the product code byte-identical.

## 3. Verified context (measured 2026-09-29, win32, Node v22.22.3)

### 3.1 The red line

`npm.cmd run check:listing-visibility` → exit 1, one violation (FACT, executed this session):

```
src/modules/listings/actions/contactEvents.ts:50  .in('status', ['active', 'sold', 'rented', 'archived'])
```

`contactEvents.ts:45-52` (FACT, read): inside the `'use server'` action `trackListingContactEvent`, the service-role
client resolves **one** listing by id (`.eq('id', listingId)` → `.in('status', […])` → `.maybeSingle()`). The comment at
`:45` reads *"Same publicly-viewable status set as the detail page query and the view tracker."* The result feeds only
the WhatsApp-click insert (`listing_contact_events`), never a list, never a render.

### 3.2 The same literal is already allowlisted three times

`scripts/check-listing-visibility.mjs:49-59` (`ALLOWLIST`, FACT, read) carries the identical fingerprint
`.in('status', ['active', 'sold', 'rented', 'archived'])` for:

| Path | Reason recorded |
|---|---|
| `src/app/api/listings/[slug]/view/route.ts` (`:30`) | single-row view-count increment, multi-status display filter |
| `src/app/[locale]/listings/[slug]/page.tsx` (`:153`) | single-row detail page, multi-status display filter |
| `src/modules/listings/lib/recentlyViewedQueries.ts` (`:34`, `:60`) | recently-viewed resolution by saved IDs, not a public list read |

`isAllowlisted` (`:61-64`) matches **path + substring**, not line. FACT.

### 3.3 Why the canonical helper is the wrong route (decision, taken here)

`applyPublicVisibility` (`src/modules/listings/lib/visibility.ts:99`) restricts to `status='active'` **and** a future or
null `expires_at` (its contract; `PUBLIC_VISIBLE_STATUSES` at `:15`). Routing `:50` through it would stop recording a
WhatsApp click on a `sold`, `rented` or `archived` listing — pages the owner ruled **publicly reachable by link**
(Task 805 row, owner decision 2026-09-09) — and on an `active` listing whose `expires_at` has passed. That is a product
behaviour change (fewer counted clicks, AGT/ADM WhatsApp totals move). The reserved row allowed either route; this
kickoff selects the **allowlist** route because it is the only one that preserves behaviour. INFERENCE from the two
source readings above; no owner decision is needed because nothing observable changes.

### 3.4 Task 863 interaction

Task 863 (`KICKOFF FILED`, not landed) adds two allowlist entries (`queries.ts`, `data.ts`) and states it will not touch
`contactEvents.ts`. Both tasks edit `ALLOWLIST`. Whichever lands second rebases on the first: its I0 re-reads the array
and appends; neither removes the other's entries. FACT (863 kickoff §3.2, §8).

### 3.5 Worktree at design time

`git --no-optional-locks status --porcelain` (2026-09-29): four paths modified and one untracked evidence directory,
all Task 893 (in progress) — `EXCLUDED AS UNRELATED`. None is in this task's write set.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row; §3.1 | `ALLOWLIST` gains exactly one entry: path `src/modules/listings/actions/contactEvents.ts`, fingerprint `.in('status', ['active', 'sold', 'rented', 'archived'])`, reason `single-row WhatsApp contact-event lookup by id (service role, Task 850) — link-reachable status set, not a public list read`. No other entry changes. | P1 | AC1, diff | Confirmed |
| R2 | §3.3 | `src/modules/listings/actions/contactEvents.ts` is byte-identical before and after (`git hash-object` equal). | P0 | AC2 | Confirmed |
| R3 | reserved row ("two-armed plant") | A **new** inline literal in the same file, one the fingerprint does not cover, still fails the gate naming its line; restoring clears it; the hash returns. | P0 | AC3 | Confirmed |
| R4 | agent-contract 15 | `--verify-gate` self-test still passes with its current count; nothing in it is removed. | P1 | AC4 | Confirmed |
| R5 | GR-2 | The session log states the allowlist's blind spot: a path+substring entry also silences any later identical literal in the same file. | P2 | session log | Confirmed |
| R6 | agent-contract 10 | Session log with a "Files Changed" table; `docs/backlog.md` 887 cell updated; backlog ≤ 80 lines. | P2 | read-after-write | Confirmed |

## 5. Assumptions and open questions

- A1 (INFERENCE, §3.3): WhatsApp clicks on sold/rented/archived pages are meant to count. If the owner later decides
  otherwise, that is a product change in its own task, not this gate fix.
- Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (9, 10, 14, 15) · `docs/rule-index.md` → "Regression / Critical
Flow Coverage" · `docs/qa-profiles.md` (Q2) · `docs/critical-flow-registry.md` row "Listing public visibility
invariant" · `docs/orchestrator-procedures.md` → the 818/819 encoding corollary · this kickoff.

## 7. Scope — the exact allowed write set

1. `scripts/check-listing-visibility.mjs` — `ALLOWLIST` only (R1).
2. `docs/sessions/2026-MM-DD-task887-listing-visibility-green.md` (new; execution date).
3. `docs/sessions/evidence/task887/` — new files only.
4. `docs/backlog.md` — the 887 text only.

Temporary, restored byte-identical and absent from the final status: `src/modules/listings/actions/contactEvents.ts`
(plant P1 only).

## 8. Out of scope

- Any edit to `contactEvents.ts` beyond the restored plant; `visibility.ts`; the other three allowlisted files.
- The dead guest-contact column/branch (P3 unnumbered follow-up in `docs/backlog.md`).
- Task 863's extractor change.

## 9. Current and required behavior

| | Current | Required after |
|---|---|---|
| Gate on `main` | exit 1, the `:50` line | exit 0 (or only a violation a newer commit introduced — reported, never allowlisted here) |
| WhatsApp click on a sold/rented/archived listing | recorded | recorded (unchanged) |
| New inline literal elsewhere in `contactEvents.ts` | would be reported | still reported (R3) |
| Allowlist | 6 entries (8 if 863 landed) | +1 |

## 10. Implementation requirements

### 10.1 I0 — before any write

1. `node.exe -p "process.platform + ' ' + process.version"` → must print `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task887/00-status.txt`. A §7 path already
   modified → `BLOCKED — WRITE PATH NOT CLEAN`.
3. `git hash-object src/modules/listings/actions/contactEvents.ts scripts/check-listing-visibility.mjs` → `01-hash-before.txt`.
4. Run the gate and `--verify-gate` unchanged → `02-gate-before.txt`, `03-verify-before.txt`. Expected: exit 1 with only
   the §3.1 line; self-test 0 failed. Any other violation → STOP and report it; do not allowlist it.

### 10.2 Order

I0 → P1/P2 plant on the unmodified allowlist (proves the file is scanned) → R1 → P3/P4 plant (proves R1 did not blind
the file) → final gates → session log → backlog cell.

### 10.3 Plants (Node `fs` I/O only; hash before and after each)

| Plant | Edit in `contactEvents.ts` | Expected |
|---|---|---|
| P1 | after `:50`, insert a line `      .eq('status', 'active')` | gate exit 1 naming `contactEvents.ts:51` **and** `:50` |
| P2 | restore P1 | hash equals `01`; gate back to the §3.1 line only |
| P3 (after R1) | same insertion as P1 | gate exit 1 naming only `contactEvents.ts:51` |
| P4 | restore P3 | hash equals `01`; gate exit 0 |

`.eq('status', 'active')` is not the R1 fingerprint, so P3 fails for the right reason. Save every transcript and hash
under `docs/sessions/evidence/task887/`.

## 11. Positive and negative flows

**Positive flow.** CI's `check:listing-visibility` step exits 0 on the PR; a developer who later writes a new
`.eq('status', 'active')` in the contact-event action gets exit 1 naming the line.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| New literal in the same file | Yes | reported | P3 |
| Identical literal added to the same file | Yes (blind spot) | silenced by R1 — stated, not fixed | R5 |
| Stale entry after a later rewrite of `:50` | Yes | gate reports the entry as stale (existing `:317-331`) | reviewer reads the code path |
| RLS / network / UI | No | static CLI | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given the final script, when the diff of `scripts/check-listing-visibility.mjs` is read, then it adds
  exactly the R1 entry and changes no other line; the gate prints `Allowlist: N entries, 0 stale.` with N one higher
  than in `02`.
- **AC2 [R2]** Given `01` and the final hash, when compared, then `contactEvents.ts`'s hash is unchanged and the path
  is absent from the final `git status --porcelain`.
- **AC3 [R3]** Given P1–P4, when the gate runs, then P1 and P3 exit 1 naming the planted line, P2 and P4 restore the
  `01` hash, and P4's gate run exits 0.
- **AC4 [R4]** Given the final tree, when `check:listing-visibility:verify` runs, then it reports 0 failed and the same
  passed count as `03`.
- **AC5 [R5, R6]** Given the session log, then it states the R5 blind spot, and its Files Changed table equals the real
  diff of §7's paths; `docs/backlog.md` ≤ 80 lines.

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: AC2's unchanged hash (the declared R2 deliverable, measured by hash).`

`GR-2 SCOPE STATED — check:listing-visibility inspects inline status/expiry literals on from('listings') blocks in non-excluded src files; a path+substring allowlist entry cannot tell two identical literals in one file apart; the criteria are closed by the P1–P4 transcripts and hashes, never by a green line alone.`

## 13. QA profile and verification plan

**Q2** — a gate data change with no product change; the planted-failure pair is the targeted evidence.

### 13.1 Final gate block (executor, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task887"
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run check:listing-visibility *> "$ev\20-gate-final.txt"; "gate exit=$LASTEXITCODE"
npm.cmd run check:listing-visibility:verify *> "$ev\21-verify-final.txt"; "verify exit=$LASTEXITCODE"
npm.cmd run check:listing-visibility:report *> "$ev\22-report-final.txt"; "report exit=$LASTEXITCODE"
npm.cmd run typecheck *> "$ev\23-typecheck.txt"; "typecheck exit=$LASTEXITCODE"
npm.cmd run lint *> "$ev\24-lint.txt"; "lint exit=$LASTEXITCODE"
npm.cmd run check:file-integrity *> "$ev\25-file-integrity.txt"; "file-integrity exit=$LASTEXITCODE"
npm.cmd run check:mojibake *> "$ev\26-mojibake.txt"; "mojibake exit=$LASTEXITCODE"
npm.cmd run build *> "$ev\27-build.txt"; "build exit=$LASTEXITCODE"
git hash-object scripts\check-listing-visibility.mjs src\modules\listings\actions\contactEvents.ts
git --no-optional-locks status --porcelain
```

Expected: `win32`; every exit 0; `contactEvents.ts` hash equals `01`; porcelain = `00` plus only §7's paths.

## 14. Completion report contract

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Include: changed files and
their hashes; R1–R6 and AC1–AC5 with evidence paths; every command's real exit code; the P1–P4 table with hashes;
deviations and limitations (R5). Update the 887 cell of `docs/backlog.md` (≤ 2 lines) and write the session log. No Git
commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1 · R2→AC2 · R3→AC3 · R4→AC4 · R5/R6→AC5 |
| Two-armed plant that can fail | P1/P3 use a literal the fingerprint does not cover |
| Behaviour preserved | R2 hash; §3.3 rejects the behaviour-changing route |
| Owner decision needed | none |

## Appendix A — Evidence preflight

| Claim | Evidence | Status |
|---|---|---|
| Gate red on exactly `:50` | gate run 2026-09-29 | VERIFIED (EXECUTED) |
| Identical fingerprint allowlisted for three files | `check-listing-visibility.mjs:49-59` | VERIFIED |
| Helper route changes behaviour | `visibility.ts:15,:99` vs the link-reachable set | INFERENCE (source read) |
| Allowlist is path+substring | `:61-64` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| agent-contract 9 | final build exit 0 | COMPLIANT (§13.1) |
| agent-contract 14 | Node I/O + hash witnesses for the plant | COMPLIANT (§10.3) |
| agent-contract 15 | critical-flow gate keeps a failing arm | COMPLIANT (P3) |
| GR-1…GR-3d | no visible surface | NOT APPLICABLE |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0: `win32`, clean write set, only the §3.1 violation | `BLOCKED` |
| 1 | P1/P2 before R1 | P1 not failing → the file is not scanned; STOP |
| 2 | R1 + P3/P4 | P3 passing → R1 is too broad; fix the fingerprint |
| 3 | Final gates | any non-zero → `PARTIALLY IMPLEMENTED` |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **887** | reserved 2026-09-26 — **Sprint 78** (hosted next to 850, whose change it follows; the owner may move it), **P2**, **Q2**, filed by Task 853's review 1 | **`check:listing-visibility` has been red on `main` since Task 850 (2026-09-20) and nothing tracked it.** Reviewer re-run 2026-09-26 (win32 v22.22.3): `❌ 1 inline visibility literal(s) on listings reads: src/modules/listings/actions/contactEvents.ts:50  .in('status', ['active', 'sold', 'rented', 'archived'])`, exit 1. Task 850 rewrote `trackListingContactEvent` to resolve the listing through the service-role client, and its comment says the status set matches *"the detail page query and the view tracker"*. The gate is the registered regression command for the critical flow "Listing public visibility invariant" (`docs/critical-flow-registry.md`), so a permanently red gate hides every new violation. Kickoff first: read how the detail page and `api/listings/[slug]/view/route.ts` express the same set, and whether the gate already allowlists them. Then choose one route: consume the shared helper, or add a fingerprinted allowlist row with its reason (a service-role write-path lookup, not a public list read). Acceptance: the gate exits 0, with a two-armed plant proving it still fails on a new inline literal. Interim: 853's §13.2 records this as `exit 1 — expected, 887`. |
