# Task 749 — Revision 3: close AC-R2-5 and AC-R2-8 with evidence that a third party can re-derive

**Filed:** 2026-08-15. **Mode:** `TASK DESIGN`, execution state **`remediation`, evidence-only**. **QA:** `Q3`
(unchanged; no new rendered claim is made). **Preflight:** `Sprint_58_Task_749_revision_3_evidence_preflight.md` —
read §0 and §2 before starting.

**Supersedes:** the Revision 2 brief's §8 evidence-path instruction only. Every accepted result stands: the
implementation is not touched, and the rendered matrix is **not** re-run.

---

## 1. Why this revision exists

The review of Revision 2 is `NEEDS REVISION` on two rows, both of them **evidence** defects, neither of them a code
defect:

| Row | Why it is `UNVERIFIED` | Finding |
|---|---|---|
| **AC-R2-5** | S0 SHA-256 digests were never persisted; the session log retains only eight `<path>: OK` lines, so 7 of 8 witnesses cannot be re-derived by any reviewer | F4 (P2) |
| **AC-R2-8** | No `npm run build` transcript exists anywhere; `.next/BUILD_ID` mtime is freshness, not an exit code. The row was also missing from the first ledger entirely | F5 (P2) |

**Root cause, found while writing the preflight and owned by the orchestrator:** the Revision 2 brief sent the
executor to `.screenshots/task749-evidence/`, and **`.screenshots/` is gitignored** (`.gitignore:55`). The executor
complied; the directory exists and is empty; nothing could ever have been committed from it. All Revision 3
evidence therefore lands under `docs/reviews/artifacts/2026-08-15-task749/`, the repository's own tracked
convention (`docs/reviews/artifacts/2026-08-14-task741-review/` is committed and readable today).

## 2. AC-R2-5 cannot be recovered — do not try

The original observable was *"every `M` path untouched by Revision 2 is byte-identical to its content immediately
before Revision 2's first write."* **That moment has passed.** Computing SHA-256 digests now and labelling them S0
would be fabricated evidence. **Do not do it, and do not let a later reader mistake the replacement for a
recovery** — say so in the report, in one sentence.

What the witness was *for* — proving no unauthorized content slipped into the 8 accepted paths while Revision 2
edited three others — is addressable from evidence that exists. The replacement is **different, not a reconstruction**:
a hash proves equality to a past moment, while the accepted diff audit proves the current file contains only its
authorized edit. The owner accepted that substitution on 2026-08-16; neither artifact is presented as the other.

## 3. The work

### 3.1 AC-R2-5R (i) — authorized-content audit of the 8 accepted paths

For each path, run `git diff -- <path>`, read the whole hunk set, and record whether it contains **only** the
authorized edit. Persist every diff verbatim to
`docs/reviews/artifacts/2026-08-15-task749/authorized-content-audit.txt`, together with the `git diff --numstat`
line for each path.

| # | Path | Authorized edit — nothing else may appear | numstat must read |
|--:|---|---|---|
| 1 | `src/app/globals.css` | the `@theme` block and its 2-line comment removed | `0 6` |
| 2 | `src/components/admin/AdminUsersTable.tsx` | `Tabs.List` wrapped in `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}`; `grow` removed; the stale `:421` comment replaced | `10 5` |
| 3 | `src/components/shared/HeroSearchView.module.css` | `.filtersControl` gains `flex-basis:100%` + `min-height: var(--space-11)`, reset inside `@media (min-width: 40rem)` | `11 1` |
| 4 | `src/components/shared/HeroSearchView.tsx` | `iconOnlyAbove={640}` added — one line | `1 0` |
| 5 | `src/design-system/mantine/patterns/MantineCountButton.tsx` | `iconOnlyAbove?: number` prop, existing `useMediaQuery` narrowed into a range, composed `collapsed` | `15 2` |
| 6 | `…/patterns/__tests__/MantineCountButton.smoke.test.tsx` | additive cases, including the 640/860 range boundaries | `76 0` |
| 7 | `src/modules/notifications/components/NotificationCenter.tsx` | `notification-compact:` → `sm:` on `:37` and `:48`; the Task 593 comment updated | `10 7` |
| 8 | `tasks/Sprints/Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md` | SUPERSEDED/RETIRED markers only | `16 7` |

**Comparator:** any hunk outside the "authorized edit" column, or any numstat pair differing from the table, fails
the audit — stop and report rather than explaining it away. The table was measured by the reviewer on 2026-08-15;
drift means a path moved between review and execution.

**Note, not a defect:** `git diff --check` warns that
`…/__tests__/MantineCountButton.smoke.test.tsx` has CRLF endings that git will normalise to LF on commit. Record it
in the report so the owner is not surprised by a whitespace-only delta in the committed diff.

### 3.1a F7 — test-mock scope correction after S0′

The Task 749 `ScrollArea` usage exposed a new React warning in the existing `AdminUsersTable` smoke-test mock.
The owner authorised Codex to repair Task 749 directly on 2026-08-16. The mock now consumes Mantine-only
`type`, `scrollbars`, and `scrollbarSize` props before spreading the remainder onto a DOM node. Its exact final
diff is `9 3`; it is audited separately because it was first changed after S0′, and a native scoped Vitest run
must pass 21/21 without the warning. This is a test-only scope extension, not product or gate code.

### 3.2 AC-R2-5R (ii) — a real S0 for this revision

**Before the first write of this revision**, capture and persist:

```
sha256sum <the 12 pre-existing M paths> > docs/reviews/artifacts/2026-08-15-task749/S0-prime-witnesses.txt
git status --porcelain            > docs/reviews/artifacts/2026-08-15-task749/S0-prime-status.txt
```

At the end, all **12** stored digests must match. `sha256sum -c` is suitable where available; native Windows
verification uses `Get-FileHash` against the same standard two-column SHA-256 file. S0′ covers the 12 paths that
were already modified at its capture; the later, authorised F7 mock correction is separately audited and tested.
**The digests themselves are persisted this time**, not just the verdicts.

### 3.3 AC-R2-8R — the build transcript

```
npm run build 2>&1 | tee docs/reviews/artifacts/2026-08-15-task749/build-final.txt ; echo "EXIT=$?"
```

The retained file must contain the full output **and** a final `EXIT=0` line. On Windows PowerShell the owner's
equivalent is `npm.cmd run build *>&1 | Tee-Object …; "EXIT=$LASTEXITCODE"`. If the build does not exit 0, that is
the report — do not retry silently.

### 3.4 Session-log corrections

Append `§14 — Revision 3` with the results, and fix the stale sentence in §7 that still reads *"All transcripts
persisted under the scratchpad evidence directory (paths below)"*. Replace it with the real location and a one-line
note that `.screenshots/` is gitignored, so the earlier instruction was unfollowable.

## 4. No synthetic source plant

The owner waived P-R3 on 2026-08-16. This revision adds no detector or product behaviour; appending and reverting
a character in production source would create risk without increasing confidence in the standard SHA-256 primitive.
The durable controls are the persisted hashes, the exact final diff audit, and the native scoped mock test.

## 5. Acceptance criteria

- **AC-R3-1 [AC-R2-5R]** All 8 accepted diffs are persisted verbatim and contain only their authorized edit; their
  numstat pairs match §3.1. The separately authorised F7 mock diff is `9 3` and its native scoped suite passes.
- **AC-R3-2 [AC-R2-5R]** `S0-prime-witnesses.txt` exists **with 12 digests**, and a SHA-256 verifier reports 12/12
  matching paths at the end.
- **AC-R3-3 [AC-R2-8R]** `build-final.txt` exists, is non-empty, contains the full build output and `EXIT=0`.
- **AC-R3-5** `git status --porcelain` at the end differs from `S0-prime-status.txt` **only** by the new files under
  `docs/reviews/artifacts/2026-08-15-task749/`, the owned review/session documents, and the separately authorised
  F7 test-mock path. No product or gate path changes; the ledger is edited only by the reviewer.
- **AC-R3-6** The report states in one sentence that the original S0 is unrecoverable and was **not** reconstructed.

## 6. Verification plan

```
# BEFORE any write
sha256sum <12 M paths> > docs/reviews/artifacts/2026-08-15-task749/S0-prime-witnesses.txt
git status --porcelain > docs/reviews/artifacts/2026-08-15-task749/S0-prime-status.txt
git diff --numstat     > docs/reviews/artifacts/2026-08-15-task749/numstat.txt
# audit
git diff -- <each of the 8 paths>   >> docs/reviews/artifacts/2026-08-15-task749/authorized-content-audit.txt
# separately audit the F7 test-mock correction and run its scoped suite
# build
npm run build 2>&1 | tee docs/reviews/artifacts/2026-08-15-task749/build-final.txt ; echo "EXIT=$?"
# close
sha256sum -c docs/reviews/artifacts/2026-08-15-task749/S0-prime-witnesses.txt
git status --porcelain
```

**Not run:** `npm run build-storybook`, `screenshots:assert`, the plant suite from Revision 2, and every gate that
already exited 0. Nothing in this revision can change a rendered result; re-running the matrix would only risk the
`15-36` ≡ `18-14` reproducibility pair that AC-R2-6 rests on.

## 7. Report contract

Changed files (new artifacts, session-log correction, and the authorised F7 test mock) · AC-R3-1…6 with actual
results · the 8 diffs' audit verdicts · the native mock receipt · the CRLF note · the one-sentence statement about
S0 · SHA-256 verification and final `git status --porcelain`. Status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Do not edit the review
ledger** — Opus flips AC-R2-5 and AC-R2-8 at re-review, or does not.
