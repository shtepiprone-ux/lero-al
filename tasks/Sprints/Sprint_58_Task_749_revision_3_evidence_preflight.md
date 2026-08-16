# Task 749 Revision 3 — completed evidence-first preflight

Completed **before** publication, per the process correction recorded in
`Sprint_58_Task_749_revision_2_evidence_preflight.md` §0.

## 0. The defect this revision exists to repair — and a new one found while writing it

Revision 2 closed with two `UNVERIFIED` P0/P1 rows, **AC-R2-5** and **AC-R2-8**, both evidence defects rather than
code defects. Writing this preflight surfaced their shared root cause, which neither the executor nor the first
review named:

> **The Revision 2 brief §8 told the executor to persist evidence under `.screenshots/task749-evidence/`.
> `.screenshots/` is gitignored — `.gitignore:55`, `/.screenshots/`.**

Anything written there can never be committed, reviewed by a third party, or survive a clean checkout. The
directory exists and is empty; the executor followed the instruction and the evidence went nowhere. `docs/reviews/
artifacts/` is the repository's own tracked evidence convention (`docs/reviews/artifacts/2026-08-14-task741-review/`
is committed and readable today), and the brief should have named it.

**This is the sixth instance of one habit:** I named a path without checking the property of the path I was
relying on — the same shape as asserting `minWidth: 0` was inert, reading one of two symbol occurrences, enumerating
two of five detector checks, inferring "no directory" from an empty `ls`, and describing a field I had overwritten.

**Rule added to the three from Revision 2, binding on every brief I write here:** *any path named as retained
evidence must be proven tracked — `git check-ignore -v <path>` returns non-zero — before the brief is published.*
Verified for this revision: `git check-ignore -v docs/reviews/artifacts/...` → no match; `.screenshots/...` → match
at `.gitignore:55`.

## 1. Scope and execution state

| Field | Value |
|---|---|
| Task / review | 749 Revision 3 |
| Mode | `TASK DESIGN` |
| Execution state | **`remediation`** — evidence-only |
| Exact start step | The worktree exactly as the owner reported it natively (12 `M`, 5 `??`), ledger validating |
| Reused artifacts | The seven `.screenshots/rendered-assert/2026-08-15T*` run directories and the v4 ledger. **Read-only.** |
| Must not be overwritten | All seven run directories; `docs/reviews/2026-08-15-task749-revision2-geometry-scroll-awareness.review-ledger.json` |
| Owner decision required? | **Resolved.** The owner accepted the final-state diff audit as the replacement for unrecoverable AC-R2-5 evidence and authorised Codex to repair the F7 test mock on 2026-08-16. |

**No product code, gate code, or rendered re-run are in scope.** The one test-only F7 mock correction is in scope.
The 1204-cell matrix is not re-captured: nothing in this revision can change a rendered result, and re-running it
would only risk the reproducibility pair (`15-36` ≡ `18-14`) that AC-R2-6 rests on.

## 2. The honest problem with AC-R2-5, stated before proposing a fix

The original observable was: *every `M` path untouched by Revision 2 is byte-identical to its content immediately
before Revision 2's first write.* **That moment is gone.** Capturing SHA-256 digests now and presenting them as S0
would be fabricated evidence, and this preflight refuses it explicitly so that no later reader mistakes the
replacement for a recovery.

What the witness was actually *for*: proving no unauthorized content slipped into the 8 accepted paths while
Revision 2 edited three other files. The owner accepted the retained diffs as a replacement final-state audit.
It is a different assertion, not a reconstruction or automatic strengthening of the historical hash claim.

## 3. Requirement-to-evidence map

| Requirement | Observable claim | Source inspected | Producing command | Status |
|---|---|---|---|---|
| AC-R2-5R (i) | Each of the 8 accepted paths carries exactly its authorized edit and nothing else | the 8 diffs | `git diff -- <path>` + `git diff --numstat` | **`ASSUMED` — executor must produce.** Reviewer has independently confirmed **1 of 8** (`AdminUsersTable.tsx`, blob `3b0df9fd5`) |
| AC-R2-5R (ii) | The 12 paths already modified at Revision 3 start remain unchanged | S0' digests persisted at a tracked path | SHA-256 before first write and native re-verification after | `ASSUMED` |
| AC-R2-8R | `npm run build` exits 0, full transcript retained at a tracked path | build transcript | `npm run build` | `ASSUMED` |
| numstat comparator | The per-path insert/delete counts below are the current measured truth | working tree | `git diff --numstat` | **`VERIFIED`** — reviewer ran it 2026-08-15 |

Measured numstat, to be quoted back unchanged by the executor (any drift means a path moved between review and
execution and the audit must stop):

```
 4  1  scripts/__tests__/css-var-resolvability.test.ts
 8  6  scripts/check-stories-rendered.mjs
51  6  scripts/geometry-integrity.mjs
 0  6  src/app/globals.css
10  5  src/components/admin/AdminUsersTable.tsx
11  1  src/components/shared/HeroSearchView.module.css
 1  0  src/components/shared/HeroSearchView.tsx
17  2  src/design-system/mantine/patterns/MantineCountButton.tsx
78  0  src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx
10  7  src/modules/notifications/components/NotificationCenter.tsx
16  7  tasks/Sprints/Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md
```

## 4. Falsification log

| Claim | Counterexample inspected | Result |
|---|---|---|
| "`.screenshots/` is a usable evidence path" | `git check-ignore -v .screenshots/task749-evidence/x.log` | **EXECUTED** — matches `.gitignore:55`; the path is uncommittable. Root cause of F4 and F5 |
| "`docs/reviews/artifacts/` is tracked" | `git ls-files docs/reviews/artifacts/2026-08-14-task741-review` | **EXECUTED** — 3+ committed files listed |
| "S0 can be reconstructed" | attempted reasoning from retained artifacts | **ANALYTICAL — refuted.** No retained artifact records pre-Revision-2 content for the 7 unconfirmed paths. The AC must be replaced, not repaired |
| "A diff audit is weaker than a hash witness" | compared what each proves | **ANALYTICAL — refuted.** The hash proves equality to an unverifiable moment; the diff proves authorized-content-only, re-derivably |
| "Re-running the matrix is harmless" | `15-36` ≡ `18-14` is AC-R2-6's reproducibility evidence | **ANALYTICAL** — a third run could only weaken it; excluded from scope |

## 5. Write-scope viability

| Path | Classification | Action |
|---|---|---|
| `docs/reviews/artifacts/2026-08-15-task749/**` | new, tracked | create — all Revision 3 evidence lands here |
| `docs/sessions/2026-08-15-task749-rendered-proof-mobile-remediation.md` | `??`, owned | append §14 only; fix the stale §7 sentence naming the scratchpad dir |
| `docs/reviews/…revision2…review-ledger.json` | `??`, owned by the reviewer | **executor must not edit.** Opus flips AC-R2-5R/AC-R2-8R at re-review |
| the 12 pre-existing `M` paths | `OWNED`, accepted | **read-only in this revision** |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | clean at S0′ | permitted F7 test-only correction; separately diff-audited and scoped-tested |
| `.screenshots/**` | gitignored | never named as retained evidence again |

## 6. Publication gate

- [x] Every AC has an observable artifact and a valid command.
- [x] Every named evidence path is proven **tracked** before publication (the rule this revision adds).
- [x] The unrecoverable claim is declared unrecoverable rather than reconstructed.
- [x] No `Confirmed` fact defers its first verification to the executor; the one reviewer-verified row (numstat) is
      marked `VERIFIED`, the three executor rows are marked `ASSUMED`.
- [x] Remediation start step and preserved artifacts named; no command can overwrite them.
- [x] Falsification recorded for every material claim, each labelled `EXECUTED` or `ANALYTICAL`.
- [ ] `docs/backlog.md` within its 80-line cap — **FALSE, 82 lines, `BACKLOG LIMIT BREACH`**, unchanged by this revision.
