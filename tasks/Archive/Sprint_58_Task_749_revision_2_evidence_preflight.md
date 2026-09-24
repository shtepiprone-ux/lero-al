# Task 749 Revision 2 — completed evidence-first preflight

**This artifact exists because I did not produce it for the original kickoff or for Revision 1.** That omission is
the single root cause of both blocked rounds. `.claude/skills/create-task/SKILL.md` and
`docs/orchestrator-procedures.md:43` both make
`docs/orchestrator-evidence-preflight-template.md` a **fail-closed gate** before publication. I completed the
execution contract and the rule-compliance ledger and skipped the preflight itself — and every one of the three
defects below is named, in advance, in the file I skipped.

---

## 0. The three defects, and the one rule that would have caught each

| # | Defect | The rule I did not apply | Where it is written |
|---|---|---|---|
| O-1 | Asserted `minWidth: 0` was inert; derived a **geometry** claim (byte-identical at 375/390/1024) from a **CSS rule** (`flex:1` + `min-width:auto`) with no measurement | *"Keep source rules, computed values, rendered geometry, and visual/pixel outcome distinct. **A CSS rule or computed value does not prove geometry.**"* | `orchestrator-evidence-first-preflight.md` → Separate UI evidence layers; `orchestrator-procedures.md:57-61` |
| O-2 | Declared `css-var-resolvability.test.ts` zero-diff after reading **one** of its two uses of the symbol | *"Read the enclosing block, not just the matching line."* + §2b's requirement to census **every** construction path before an absence claim | `orchestrator-evidence-first-preflight.md` → Trace API and data-flow absence claims |
| O-3 | Named two traps in `geometry-integrity.mjs` by reading Checks 2 and 3, and never enumerated the file's **other three checks**. Check 1 was 45 lines above Check 2 | *"when a requirement depends on a static checker recognizing source syntax… **read the detector and prove how it treats the target syntax before publishing the task**. A green gate proves only properties within that gate's actual detection scope."* | `orchestrator-procedures.md:76-82` (Requirement feasibility and detector scope) |

**The common shape of all three: I stopped searching at the first answer that fit, instead of enumerating the
space.** The publication-gate checkbox that catches it is *"No `Confirmed` requirement, AC, scope boundary, or
handoff fact has its first or only verification deferred to the executor."* My original requirement ledger marked
**all 15 rows `Confirmed`**. Not one of them had a falsification attempt. That uniformity was the tell.

**Process correction, applied in this revision and binding on every future kickoff I write in this repo:**

1. A requirement ledger row may be `Confirmed` **only** with a falsification recorded in §5 below. Everything else
   is `ASSUMED` / `UNKNOWN`, and an `ASSUMED` row may not carry a P0 acceptance criterion — it becomes a **probe
   checkpoint** instead.
2. Any claim about a **multi-branch detector** requires a table of **every** branch in that file with its downgrade
   path, not the branches that happen to be relevant (§2 below).
3. Any **geometry** claim is `ANALYTICAL` until a measurement exists. If it cannot be measured at design time, it
   is not an AC.

---

## 1. Scope and execution state

| Field | Value |
|---|---|
| Task / review | 749 Revision 2 |
| Mode | `TASK DESIGN` (revision of an in-flight task) |
| Execution state | **`remediation`** |
| Exact start step | The worktree as the executor left it after Revision 1. `AdminUsersTable.tsx` **already carries the correct `ScrollArea` edit** — it is not re-applied and not reverted. |
| Reused artifacts | `.screenshots/rendered-assert/2026-08-15T14-47/` (post-ScrollArea AFTER run) is the **live baseline** for this revision. `2026-08-15T12-42/` is the true pre-edit BEFORE. Both are read-only inputs. |
| Artifacts that must not be overwritten | `12-42/` and `14-47/`. The gate writes a **new** timestamped directory per run, so no re-run can destroy them — verified by reading the run-directory naming in the retained tree (three distinct dirs from three runs today). |
| Owner decision required? | **Resolved.** Owner authorised a gate diff on 2026-08-15 ("виправити гейт у 749"). Recorded as **D-8** in the revision brief. |

Phases that must **not** be re-run: Revision 1's A1 restore (done, hash-verified by the executor), and the
HeroSearch / NotificationBellView / `MantineCountButton` verification set (all exited 0; their inputs are unchanged
by this revision because no file they touch is in this revision's write set).

## 2. The full detector enumeration — every check in `geometry-integrity.mjs`

This is the table whose absence caused O-3. It is derived from `grep -n "── Check [0-9]\|failReason: '"` over the
whole file, then reading each branch — not from the checks that seemed relevant.

| # | Line | Hard `failReason` | Downgrade path | Scroll-aware? | Fires on a horizontal `ScrollArea`? |
|---:|---:|---|---|---|---|
| 1 | `:338` | `text-clipped` | `text-clipped-ellipsis` — **only** when `textOverflow: ellipsis` **and** (`aria-label`/`title` or `<a>`) | **NO** | **YES — measured, 3 cells** |
| 2 | `:383` | `offscreen-control` | `ambiguous-offscreen` via `hasHorizontalScrollAncestor` (`:249-261`) | **YES (R1)** | no — downgrades correctly, measured `offscreenControl: 0` |
| 3 | `:424` | `outside-container` | none | **NO** | **currently masked** — see the guard below |
| 4 | `:456` | `element-overlap` | `ambiguous-overlap` (library-internal, R1) + clip-aware rect intersection (Task 569) | partial | no |
| 5 | `:577` | `bottomsheet-overflow` | none | n/a (`<640` sheets only) | no |

**The finding Revision 1 would have needed and did not have:** Checks **1 and 3** are the only two with no
scroll-awareness, and **Check 3 is currently invisible because Check 1 masks it.** `:442-446` skips the
`outside-container` push when the same selector already has a `text-clipped` violation. So a fix to Check 1 alone
would hand Check 3 the same 3 cells and produce a **third** blocked round. Both halves must land together. This is
recorded as an `ANALYTICAL` prediction and is the subject of plant **P-G2**, which converts it to `EXECUTED`.

**Prior art in the same repo, which I also failed to find in two rounds:** `check-stories-rendered.mjs:635-640`
already carries a Task 529 `GEOMETRY_ALLOWLIST` entry — `{ storyId: 'mantine-primitives-tabs--default',
failReason: 'text-clipped', reason: 'intentional horizontal swipe-scroll tab bar — clipped tab is reachable by
scrolling, not a layout defect' }`. The project met this exact false positive in Task 529 and answered it with a
per-story allowlist. Revision 2 replaces that allowlist entry with the DOM-measured predicate — the same
allowlist→measured-predicate direction Tasks 724R and 726 already took the `role="group"` skip.

## 3. Command and artifact contract

| Command | Reads | Writes / can overwrite | Output schema inspected | Exit semantics | Safe at scheduled step? |
|---|---|---|---|---|---|
| `npm run build-storybook` | `src/**`, `.storybook/**` | `storybook-static/` (rebuilt each run) | n/a | 0 on success; runs `check:stories` pre-gate | yes |
| `npm run screenshots:assert -- --mantine-only` | `storybook-static/` | **new** `.screenshots/rendered-assert/<ts>/` | `manifest.json` → `summary.{passed,failed,ambiguousOnly,textClipped,outsideContainer,offscreenControl}`; `matrix[].{pass,verdict,assertions.visualIntegrity.{violations,ambiguous}}` | `exitCode = 1` **iff `failed > 0`** (`check-stories-rendered.mjs:1996`); the zero branch (`:2065-2073`) prints `All hard assertions PASSED` and leaves the code unset | yes — never overwrites a prior run dir |
| `npm run test` | `src/**`, `scripts/**` | none | vitest | 0 on green | yes |
| `npm run build` | whole tree | `.next/` | n/a | 0 required | yes, last |

Matrix scope, stated exactly: `--mantine-only` = `Mantine/Primitives/*` + `Patterns/Mantine/*`
(`scripts/lib/mantine-story-scope.mjs:15`) **plus** the exact-title enrolment `Admin/AdminUsersTable` (`:35-41`).
`1204` cells. It is **not** the full `screenshots:assert` matrix and must not be cited as one.

## 4. Rendered UI proof

| Visible artifact | Source rule | Computed-value evidence | Geometry evidence | Visual evidence | Result |
|---|---|---|---|---|---|
| AdminUsersTable tab strip, post-ScrollArea | `theme.ts:830` `flexWrap:'nowrap'`; `ScrollArea.mjs:234` root `overflow:hidden` | not separately captured | **EXECUTED** — manifest `14-47`: `scrollWidth=349, clientWidth=288` (sq@320), `349/343` (sq@375), `328/288` (uk@320) | before/after PNG pairs retained from `12-42` vs `13-14`; `14-47` PNGs on disk | geometry `VERIFIED`; no new pixel claim is made by this revision |
| Tab strip natural widths | — | — | **EXECUTED** — measured from retained PNGs + manifest `right=` values: **en 227 · it 267 · uk 323 · sq 344 px** | same PNGs | `VERIFIED` |
| Post-fix appearance after the gate change | — | — | — | — | **`ANALYTICAL` — the gate change alters no CSS, so zero rendered delta is expected; this revision does not assert it, it requires the executor to measure it (AC-R2-4)** |

## 5. Falsification log

| Claim | Counterexample inspected | Result | Consequence |
|---|---|---|---|
| "Check 2's downgrade is the only scroll-awareness in the file" | Read **all five** checks and every `failReason` push | Checks 1, 3, 5 have no scroll path; Check 4 has clip-awareness only | **EXECUTED** — drives the two-half fix |
| "Fixing Check 1 is sufficient" | Read Check 3's `alreadyReported` guard at `:442-446` | Check 3 is masked by Check 1 today and will fire once Check 1 downgrades | **ANALYTICAL** → plant P-G2 makes it `EXECUTED` |
| "No other cell in the matrix is affected" | `summary.textClipped` / `outsideContainer` across the retained runs | `05-29`: 0 / 0. `14-47`: **3** / 0, all three `admin-adminuserstable--default` | **EXECUTED** — blast radius is exactly these 3 cells |
| "`geometry-integrity.mjs` has no other consumer" | `grep -rn "geometry-integrity" scripts/*.mjs .github/workflows/*.yml package.json` | one import, `check-stories-rendered.mjs:53` | **EXECUTED** |
| "The Task 529 allowlist entry can be retired safely" | `Tabs/Default` is in the matrix; its 2 cells are currently `ambiguousOverlap` | If the structural rule does not cover it, retiring the entry turns those cells hard-red **immediately** | **ANALYTICAL** → plant P-G3 is exactly this arm, with real production data |
| "The ScrollArea route fixed the real defect" | `noHorizontalOverflow` and `offscreenControl` in `14-47` | `true` on all 16 AdminUsersTable cells; `offscreenControl: 0` | **EXECUTED** — the UX defect is fixed; what remains is gate false-positives |
| "AMBIGUOUS is not a green claim" | `check-stories-rendered.mjs:2073` | prints `ambiguous cells need owner triage — not citable as green proof` | **EXECUTED** — the 3 cells stay visible debt |

## 6. Write-scope viability

| Path | Classification | Constraint | Action |
|---|---|---|---|
| `scripts/geometry-integrity.mjs` | `CLEAN` (not in `git status --porcelain`) | none | edit — Checks 1 + 3 |
| `scripts/check-stories-rendered.mjs` | `CLEAN` | Sprint 58 exit criterion 3 forbade any diff — **amended by owner D-8** | edit — retire the Task 529 allowlist entry only |
| `scripts/__tests__/css-var-resolvability.test.ts` | `CLEAN` | — | edit — `257 -> 256` (Revision 1 §7, still pending) |
| `src/components/admin/AdminUsersTable.tsx` | `OWNED` (this task, ScrollArea applied) | — | **no further edit** |
| `src/{app/globals.css, components/shared/HeroSearchView*, design-system/**/MantineCountButton*, modules/notifications/**/NotificationCenter.tsx}` | `OWNED` (this task, accepted) | — | **no further edit**; content witnesses required |
| `docs/backlog.md` | `OWNED` (orchestrator) | **80-line cap — currently 82, BREACH** | index-sized entries only; corrective action named in the final response |
| `.click-shield-ci-fixture.{stdout,stderr}.log` | `EXCLUDED AS UNRELATED` (`??`, pre-existing since before this task) | — | leave |

### 6a. Exceptions and dirty-worktree comparison

| Check | Evidence | Status |
|---|---|---|
| Owner-only exception (gate diff) | Owner, 2026-08-15, verbatim: *"Виправити гейт у 749"*, chosen over three alternatives incl. reverting and label-shortening. Scope: `geometry-integrity.mjs` Checks 1/3 + the Task 529 allowlist retirement. | `VERIFIED` |
| Start-state comparator | The executor must capture `git status --porcelain` **before its first write** and compare against it, not a clean tree. Design-time snapshot: 8 `M` + 3 `??` (2 unrelated CI-fixture logs + the session log). | `VERIFIED` |
| Pre-modified path integrity | Every `M` path this revision does **not** touch needs a SHA-256 witness before and after (AC-R2-5). A porcelain `M` entry alone proves only that it is still modified. | `VERIFIED` (required in the brief) |
| Stateful measurement timing | The gate writes a new timestamped dir; the session log and evidence dir live outside `src/` and outside the matrix. No task-created file enters any measured input set. | `VERIFIED` |

## 7. Publication gate

- [x] Every AC has an observable artifact and a valid command.
- [x] No command overwrites irreplaceable evidence (per-run timestamped dirs).
- [x] Every enum/exit code/count comes from the producing code (`:1996`, `:2065-2073`, `summary.*`), not a report.
- [x] UI claims separate source / computed / geometry; the one un-measured claim is labelled `ANALYTICAL` and is an
      executor measurement, **not** an AC assertion.
- [x] Remediation start step and preserved artifacts named.
- [x] Every write path viable; scope, verification, report and handoff agree.
- [x] The gate diff has a traceable owner decision (D-8) with date and exact scope.
- [x] Dirty-worktree comparator and content witnesses required, not assumed.
- [x] Every material claim has a falsification row, each labelled `EXECUTED` or `ANALYTICAL` — **none uniformly
      `Confirmed`**.
- [x] No `Confirmed` fact defers its first verification to the executor; the two `ANALYTICAL` rows are carried by
      plants P-G2 and P-G3, not by acceptance criteria.
- [ ] **`docs/backlog.md` is within its 80-line cap — FALSE. 82 lines, `BACKLOG LIMIT BREACH`.** Corrective action
      named in the final response; no further historical detail added by this revision.
