# Task 727 — Make the click-shield gate blocking in CI, and fix the exemption that lets a broken modal pass

**Sprint 52 — Gates that stopped checking, the final task. Closes the sprint.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_52_Task_727_execution_contract.md` · `Sprint_52_Task_727_rule_compliance_ledger.md`.

> **OQ2 and OQ3 are closed.** Owner decision 2026-08-09, quoted verbatim in §3.1. No further owner decision is
> required to execute this task, and none may be invented inside it.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate correctness + new CI infrastructure. No `src/` product
change — a defect the new scenarios expose is escalated, never fixed here.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`check-click-shield` exists, exits non-zero, and runs in no workflow. Worse, its overlay exemption is keyed to the
wrong element, so a modal whose own backdrop covers its own button passes silently. Fix the rule, drive the gate
against real overlays, and wire it into CI as a blocking job.

---

## 3. Verified context — read from the repository 2026-08-09

### 3.1 The owner decision, verbatim (closes OQ2 and OQ3)

> **OQ2: CI запускає gate на локальному production build і він blocking.** Не на production URL. У PR CI:
> `npm ci → Playwright Chromium → npm run build → npm start → wait-for-ready → check:click-shield`.
> Команда має йти з `BASE_URL=http://127.0.0.1:3000`, без `continue-on-error`; ненульовий exit code блокує merge.
> Production URL можна додати пізніше як окремий post-deploy monitor, але він не може бути PR-gate через
> залежність від деплою, CDN і зовнішніх даних.
>
> **OQ3: модалки й drawer не виключаються з gate. Вони теж blocking.** … Правильне правило: backdrop може
> перекривати елементи фонової сторінки — це допустимо; будь-який інтерактивний елемент усередині
> `[role="dialog"]` / `[role="alertdialog"]` має залишатися клікабельним; якщо його перехоплює навіть
> `.mantine-Overlay-root`, це violation і CI падає. Тобто exemption має бути **контекстним**: лише для candidate
> поза діалогом, а не глобальним allowlist для overlay.

### 3.2 The defect, confirmed in source

`scripts/check-click-shield.mjs:223`:

```js
// N6 — genuinely intentional overlay exemption (Mantine Modal/Drawer backdrop).
if (hit.closest(overlaySelector)) continue;
```

The condition tests **only the interceptor** (`hit`). It never asks where the **candidate** (`el`) is. So a button
*inside* an open Modal, intercepted by that Modal's own `.mantine-Overlay-root`, is skipped — the gate reports
clean on a modal nobody can use.

**The same unconditional form is duplicated at `:276`**, inside Task 725's scroll-and-re-hit-test path:

```js
if (hit.closest(overlaySelector)) return { cleared: true };
```

Both call sites must be fixed. Fixing one leaves the defect reachable through the other.

`grep -c 'role="dialog"\|alertdialog'` over the gate returns **0** — it has no concept of a dialog today.

### 3.3 What the gate can and cannot do today

| | Today |
|---|---|
| Candidate selector | `a, button, [role="button"], input, select` (`:84`) |
| Matrix | 4 viewports × 4 locales = **16 cells**, deliberately the same set as `MANTINE_VIEWPORTS` (`:16-23`) |
| Routes | `LOCALES.map(l => '/' + l)` — the **homepage only** (`:451`); `--route=` overrides |
| Base URL | `process.env.BASE_URL ?? 'http://localhost:3000'` (`:58`) |
| Overlay states | **None.** The gate loads a route and hit-tests. It has no mechanism to open a Modal or Drawer |
| Self-test | `--verify-gate`, synthetic fixtures only (`:300+`) |

**The gate cannot currently reach the state OQ3 is about.** Adding real overlay scenarios means teaching it to
drive the app — open a trigger, wait for the overlay, then hit-test. `check-stories-rendered.mjs` already does
exactly this (its `openTrigger` handling, used for Modal/Drawer/LightboxView); that is the in-repo precedent to
follow rather than inventing a second mechanism.

### 3.4 CI has no precedent for this job

`.github/workflows/governance-pr.yml` has four jobs — `governance`, `rendered-proof`, `homepage-grid`,
`locale-leak`. **None builds and starts the Next.js app**; every one of them uses `build-storybook`. Searching all
workflows for `npm start`, `next start`, `wait-on` or `127.0.0.1` returns nothing. This job is new infrastructure,
not a copy of an existing one.

### 3.5 `alertdialog` is not live today

`grep -rc alertdialog src/` returns no match — only `role="dialog"` renders (Mantine's Modal/Drawer, per Task
711's convergence census). The rule must still cover `[role="alertdialog"]` per §3.1, but the task must state that
only the `dialog` half is exercised by a live scenario, and must not claim coverage it did not run.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 OQ3 | The exemption becomes **contextual**: it may clear a candidate only when that candidate is **outside** an active `[role="dialog"]`/`[role="alertdialog"]` | P0 | Diff + plant | Confirmed |
| R2 | §3.2 | **Both** call sites (`:223` and `:276`) carry the new rule; neither retains the unconditional form | P0 | Diff | Confirmed |
| R3 | §3.1 OQ3 | A candidate **inside** a dialog intercepted by `.mantine-Overlay-root` is a **violation**, proven by a plant that fails and then recovers | P0 | Two transcripts | Confirmed |
| R4 | §3.1 OQ3 | A backdrop covering a **background-page** element still clears — proven, so the fix does not turn every open modal red | P0 | Transcript | Confirmed |
| R5 | §3.1, §3.3 | Real scenarios drive the running app: base route, **open Mantine Modal**, **open Mantine Drawer** — not the synthetic self-test | P0 | Scenario transcripts | Confirmed |
| R6 | §3.1 | Every scenario runs the full **16-cell** locale × viewport matrix. No route-level or manual bypass | P0 | Cell counts | Confirmed |
| R7 | §3.1 OQ2 | A new **blocking** PR job: `npm ci` → Playwright Chromium → `npm run build` → `npm start` → wait-for-ready → `check:click-shield` with `BASE_URL=http://127.0.0.1:3000`. **No `continue-on-error`** | P0 | Workflow diff | Confirmed |
| R8 | §3.1 OQ2 | The gate's logs upload as an artifact **on any outcome** (`if: always()`) | P0 | Workflow diff | Confirmed |
| R9 | §3.1 OQ2 | The remote production URL is **not** used as a merge gate. If a post-deploy monitor is desirable, it is reserved, not built here | P1 | Diff + backlog | Confirmed |
| R10 | §3.3 | `--verify-gate`'s synthetic plants still pass, extended to cover the contextual rule | P0 | `:verify` transcript | Confirmed |
| R11 | 724 lesson | Any real defect the new scenarios expose is named and **escalated**, not fixed and not exempted | P0 | Session log | Confirmed |
| R12 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R13 | Standing | Counting gates last; backlog baseline from `git show HEAD:docs/backlog.md \| wc -l` **before** the first edit, quoted | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: pre-write `git status --porcelain` snapshot, per-entry classification, before/after
  content witnesses for pre-existing modified paths.
- **A2.** **Expect the new scenarios to find something.** No overlay state has ever been hit-tested in this repo.
  A run that reports zero violations across all three scenarios × 16 cells is a result to *distrust* until you have
  shown the scenario genuinely reached the open state — see R5's transcript requirement.
- **A3.** §3.5: only `role="dialog"` is live. Implement both roles; claim coverage only for what a scenario ran.
- **OQ — none.** OQ2 and OQ3 are closed by §3.1. If executing reveals a question the decision does not cover,
  report `BLOCKED — OWNER DECISION REQUIRED` rather than choosing; do not widen the quoted decision by inference.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q4` row
- `scripts/check-click-shield.mjs` — the whole file, especially `:84-90`, `:140-300` (both hit-test paths),
  `:300-460` (`--verify-gate`, route sweep)
- `scripts/check-stories-rendered.mjs` — its `openTrigger` handling, the precedent for driving an overlay open
- `.github/workflows/governance-pr.yml` — all four existing jobs, for shape and naming conventions
- `docs/storybook-governance.md` §14.9.29 — Task 725's transient-vs-permanent distinction, which `:276` implements
- `docs/sessions/2026-08-06-task723-notifications-click-shield.md` — §6.6 the self-test, and the N6 limitation note
- `docs/sessions/2026-08-07-task725-bottomnav-overlay-collision.md` — why the scroll path exists

---

## 7. Scope

### 7.1 R1/R2 — the contextual rule, at both sites

The shape the owner specified: the exemption clears a candidate **only when that candidate is not inside an active
dialog**. Where the candidate *is* inside one, an `.mantine-Overlay-root` interception is a violation.

Implement it once and use it at both `:223` and `:276`. A rule written twice will drift; 725's scroll path and
723's direct path must agree by construction, not by coincidence.

### 7.2 R5 — drive the real app, do not simulate it

Three scenarios against the running build: base route, Modal open, Drawer open. Each must **prove it reached the
state** — record the dialog's presence in the DOM at hit-test time, not merely that a click was dispatched. A
scenario that silently failed to open the overlay reports zero violations and looks like success; that is the
failure mode this task is most exposed to (A2).

Use `check-stories-rendered.mjs`'s existing open-trigger approach. Do not invent a second mechanism.

### 7.3 R7/R8 — the CI job

`.github/workflows/governance-pr.yml`, a new job with no `continue-on-error`, exactly the owner's sequence, with
`BASE_URL=http://127.0.0.1:3000` and `if: always()` artifact upload. §3.4 records there is no existing job to copy:
the wait-for-ready step in particular must be a real readiness check, not a fixed `sleep`.

### 7.4 R3/R4 — prove both directions

The fix is only correct if it changes one verdict and preserves the other:

1. **Must fail:** a candidate inside an open dialog intercepted by the overlay → violation. Plant it, watch the
   gate fail, remove it, watch it recover.
2. **Must still clear:** a background-page element under an open modal's backdrop → cleared, not a violation.

A change that makes (1) fail but also makes (2) fail has produced the gate N6 warned would be "switched off within
a week".

### 7.5 R11 — escalate, do not fix

If a real overlay in this app turns out to intercept its own control, that is a product defect with its own
number. Name it, attribute it, reserve it. Do not fix it here and do not exempt it.

---

## 8. Out of scope

Any `src/` product fix (R11 escalates) · a production-URL monitor (R9 reserves it) · `check-stories-rendered.mjs`'s
assertions — Sprint 52's other five tasks are closed and archived · the 18 pre-existing matrix FAILs · anything
reserved under 733's successors, 734, 735 or 736.

---

## 9. Current and required behavior

**Current.** The gate runs in no workflow. Its overlay exemption keys on the interceptor alone, at two call sites,
so any control inside an open Modal or Drawer is unreachable-but-unreported. No overlay state has ever been
hit-tested, and CI has no job that starts the application.

**Required.** A candidate outside a dialog is still cleared by a backdrop; a candidate inside one is not. Three
real scenarios run the full 16-cell matrix against a locally-built production server, in a blocking PR job whose
logs upload either way.

---

## 10. Implementation requirements

1. One shared predicate for the contextual rule, used at both call sites.
2. The rule covers `[role="dialog"]` and `[role="alertdialog"]`; the session log states which was exercised live.
3. No `continue-on-error`, no route-level skip, no manual bypass, no allowlist. The gate is blocking or it is not wired.
4. Wait-for-ready is a readiness probe, not a sleep.
5. A newly-found real defect is a **finding**: named, attributed, reserved. Never fixed, never exempted here.

---

## 11. Positive and negative flows

**Positive.** Base route: 16 cells, unchanged verdicts. Modal open: the modal's own controls are hit-tested and
clear; background elements under the backdrop still clear. Drawer open: same. A planted overlay-covered control
inside the dialog fails the gate; removing it recovers.

| Negative flow | Applicable | Why |
|---|---|---|
| A scenario never opens the overlay and reports clean | **Yes** | A2 — the failure mode most likely to look like success |
| The fix makes every open modal a violation | **Yes** | R4; N6's own warning about a gate switched off within a week |
| Only one of the two call sites is fixed | **Yes** | §3.2 — the defect stays reachable through the other |
| The job is added with `continue-on-error` | **Yes** | Explicitly forbidden by the quoted decision |
| Wait-for-ready is a fixed sleep | **Yes** | Flaky CI is how a blocking gate gets removed |
| A real defect is fixed inside this task | **Yes** | R11 — that is a product change with no visual QA here |
| Locale / i18n regression | No | No `messages/*` change; parity run as a guard |
| Visual / layout regression | No | No `src/` change |

---

## 12. Acceptance criteria

- **AC1 [R1, R2]** Given the diff, then a single shared predicate implements the contextual rule and is used at both `:223` and `:276`, with neither retaining the unconditional form.
- **AC2 [R3]** Given a planted overlay-covered control **inside** an open dialog, then the gate reports a violation naming it and exits non-zero; removing the plant returns the gate to its prior verdict, with `git hash-object` and porcelain evidence.
- **AC3 [R4]** Given a background-page element under an open modal's backdrop, then it is still **cleared**, proven by transcript.
- **AC4 [R5]** Given each of the three scenarios, then its transcript records the dialog present in the DOM at hit-test time, not merely a dispatched click.
- **AC5 [R6]** Given each scenario, then it ran all 16 locale × viewport cells, stated as a count.
- **AC6 [R7, R8]** Given the workflow diff, then the job runs the owner's exact sequence with `BASE_URL=http://127.0.0.1:3000`, carries no `continue-on-error`, and uploads logs with `if: always()`.
- **AC7 [R9]** Given the diff and backlog, then no production URL is used as a merge gate, and the monitor idea is reserved rather than built.
- **AC8 [R10]** Given `npm run check:click-shield:verify`, then it passes, including a plant for the contextual rule.
- **AC9 [R11]** Given any real defect surfaced, then it is named, attributed and reserved under a number — and not fixed in this diff.
- **AC10 [R12]** `tsc` exit 0 and `npm run build` exit 0.
- **AC11 [R13]** Two counting passes, the second after the session log and backlog row exist; the backlog baseline quoted from `git show HEAD:docs/backlog.md | wc -l`.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A gate becomes CI-blocking for the first time, its exemption logic changes,
and the planted-violation clause is Q4-owned.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` + `git show HEAD:docs/backlog.md \| wc -l` | A1 manifest + R13 baseline |
| 2 | `npm run build` · `npm start` · `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` | Pre-change baseline, 16 cells |
| 3 | Implement R1/R2, re-run base scenario | Base verdicts unchanged (R4 direction) |
| 4 | Modal + Drawer scenarios, 16 cells each | AC4, AC5 |
| 5 | Plant inside-dialog interception · re-run | AC2 — gate fails, names it |
| 6 | Remove plant · `git hash-object` · porcelain | AC2 recovery |
| 7 | `npm run check:click-shield:verify` | AC8 |
| 8 | `npx tsc --noEmit` · `npm run check:i18n` | exit 0 |
| 9 | `npm run build` | **exit 0, mandatory** |
| 10 | `check:file-integrity` + `check:mojibake`, twice | AC11 |

A failed or unrun step 9 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R13 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root (`.screenshots/task727-evidence/`, local-only per D6) · assumptions,
deviations, limitations · unresolved issues. State, per scenario, the cell count and the proof the overlay was
actually open. Then update `docs/backlog.md` — **replacing** the "Last Session" block, never appending — and write
`docs/sessions/<date>-task727-click-shield-ci-and-contextual-n6.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **the owner decision closing OQ2 and OQ3 is quoted verbatim rather than
paraphrased**, and §5 forbids widening it by inference · the defect was confirmed in source at both call sites
before being described, and the duplicate at `:276` has its own requirement so fixing one is not mistaken for
fixing it · §3.4 records that no CI job builds and starts the app, so the executor is not told to copy a precedent
that does not exist · the "must still clear" direction (R4) is a first-class requirement, because a fix that reddens
every modal is the failure N6 predicted · the scenario-never-opened case is pre-declared as the likeliest
false success (A2) · `alertdialog` is recorded as implemented-but-unexercised rather than claimed as covered · the
backlog-baseline command is named in R13, per the corollary earned across 717, 721 and 722.
