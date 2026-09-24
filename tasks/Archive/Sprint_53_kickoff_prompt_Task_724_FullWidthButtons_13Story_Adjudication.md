# Task 724 — Adjudicate and remediate the 13 stories `fullWidthButtonsAtMobile` now fails

**Sprint:** 53 (`tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md`). **Epic:** MM Phase-2 / Epic RS.
**Depends on:** Task **711** landed (its re-anchored assertion is this task's comparator — **D32**).
**Origin:** 711's R8 stop-and-report, escalated to the owner and adjudicated 2026-08-07.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **responsive UI remediation** (`docs/rule-index.md` → UI/responsive), under
  agent-contract **clause 11**.
- **Secondary type:** possible governance-registry change (§3.5) and possible gate repair (§3.6) — which of the
  three applies is **per story**, and R1 decides it from evidence.

> **Read this first.** You are not repairing a detector. Task 711 already did that, and it is correct — verified
> against the live DOM, planted-proof-tested, and reproduced natively by the owner. What you are handling is the
> **backlog of real UI it exposed**. The single most likely way to fail this task is to make the gate green by
> making it stop looking. §3.6 records the owner decision that forbids exactly that.

---

## 2. Objective

1. **Classify before changing anything** (R1). Each of the 12 in-scope stories gets exactly one of three
   dispositions, each with rendered evidence: **real defect → fix**, **real defect → track and defer**, or
   **gate over-reach → fix the gate**.
2. **Start with `HomepageListingGrids`** (R2) and settle the cross-gate question: does making its CTA full-width
   also clear Task 723's click-shield interception? This is the one case with measured evidence on both sides.
3. **Remediate every story classified "fix"** (R3) using Mantine layout mechanisms, not local overrides.
4. **Register every story classified "defer"** in `MANTINE_PATTERN_KNOWN_FAILURES` with a pinned signature and a
   real filed follow-up task (R4) — and prove the mechanism actually works for this failure class first (R5).
5. **Return `--mantine-only` to exit 0** (R6) without widening `FULL_WIDTH_TOLERANCE` and without a single
   allowlist entry for a confirmed true positive.

**Non-goals:** do **not** touch `HeroSearch` (§3.7 — Sprint 49); do **not** touch `MobileBottomNavView` (Task 713,
Sprint 50 closed); do **not** change `FULL_WIDTH_TOLERANCE`; do **not** re-anchor or re-scope the assertion itself
(711 owns it); do **not** implement 721 or 722.

---

## 3. Verified context

Every number below was measured on **2026-08-07** against
`.screenshots/rendered-assert/2026-08-07T05-24/manifest.json` — an **owner-run native** matrix (1184 cells, 852
applicable at `width < 640`), byte-identical on every assertion count to Sonnet's `2026-08-06T21-25`.

### 3.1 The current gate state

| Measure | Value |
|---|---:|
| `--mantine-only` result | 1014 PASS / **148 FAIL** / 22 AMBIGUOUS, **exit 1** |
| `fullWidthButtonsAtMobile` live | **384** of 852 applicable (236 `true`, 148 `false`) |
| `popupBottomSheetAtMobile` live | 156 of 852 (156 `true`, 0 `false`) |
| Distinct stories failing | **13** |
| `FULL_WIDTH_TOLERANCE` | **8** px (`check-stories-rendered.mjs:473`) — **do not change** |

The assertion compares each `.mantine-Button-root` (that has a `.mantine-Button-label` child and no
`[role="group"]` ancestor) against its parent's content width, failing when
`offsetWidth < parentContentWidth - 8`.

### 3.2 The 13 stories, with their failing labels

All fail in **all four locales** at **all three mobile widths** unless noted.

| # | Story | Story file | Failing labels (en) |
|---:|---|---|---|
| 1 | `Mantine/Primitives/Button/Default` | `src/stories/mantine/primitives/Button.stories.tsx` | Filled, Default, Subtle, Destructive, Link, Extra small, Small (default), Save changes, Cancel, Link, Link with icon, Logout |
| 2 | `Mantine/Primitives/FilterControls/Default` | `src/stories/mantine/primitives/FilterControls.stories.tsx` | New build, Good condition, 1, 2, 3, 4, 5+ |
| 3 | `Mantine/Primitives/FiltersPanelShell/Default` | `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` | 44 labels (all filter chips) |
| 4 | `Mantine/Primitives/NotificationBellView/Default` | `src/stories/mantine/primitives/NotificationBellView.stories.tsx` | Mark all as read — **mobile-390 only** |
| 5 | `Patterns/Mantine/FilterSection/Default` | `src/stories/patterns/mantine/FilterSection.stories.tsx` | View listings, Add New, View listings |
| 6 | `Patterns/Mantine/FormSectionStack/Default` | `src/stories/patterns/mantine/FormSectionStack.stories.tsx` | Cancel, Save |
| 7 | `Patterns/Mantine/HomeSection/Default` | `src/stories/patterns/mantine/HomeSection.stories.tsx` | View listings ×3 |
| 8 | `Patterns/Mantine/HomepageListingGrids/Default` | `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` | View all |
| 9 | `Patterns/Mantine/ListingContactPattern/Default` | `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | Share, Report listing |
| 10 | `Patterns/Mantine/ListingDetailPattern/Default` | `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | Share, Report listing |
| 11 | `Patterns/Mantine/PageHeaderWithActions/Default` | `src/stories/patterns/mantine/PageHeaderWithActions.stories.tsx` | Add New, Export, Filter |
| 12 | `Patterns/Mantine/TwoColumnForm/Default` | `src/stories/patterns/mantine/TwoColumnForm.stories.tsx` | Cancel, Submit |
| — | `Mantine/Primitives/HeroSearch/Default` | — | **OUT OF SCOPE — §3.7** |

Component sources verified present: `MantineFilterSection.tsx`, `MantineFormSectionStack.tsx`,
`MantineHomeSection.tsx`, `MantineListingContactPattern.tsx`, `MantineListingDetailPattern.tsx`,
`MantinePageHeaderWithActions.tsx`, `MantineTwoColumnForm.tsx` (all under
`src/design-system/mantine/patterns/`); `NotificationBellView.tsx`
(`src/modules/notifications/components/`); `FeaturedListingsView.tsx` / `LatestListingsView.tsx`
(`src/modules/listings/components/`, imported by story #8); `FilterRangeInputs` / `FilterMultiToggle` /
`FilterRoomsRow` (`src/components/shared/`, imported by story #2). **Story #3's component source was not located
during task design — find it before touching it, and report if it does not exist as a single component.**

### 3.3 The measured mechanism — and where 711's summary overstated it

`.screenshots/task711-evidence/R8-geometry-probe.json` measured 5 of the 13 directly at 375px:

| Story | Button | offsetWidth | parentContentWidth | Parent | Verdict |
|---|---|---:|---:|---|---|
| `Button/Default` | "Filled" | 73 | 343 | `mantine-Group-root` | fail |
| `Button/Default` | "Save changes" | **343** | 343 | `mantine-Stack-root` | pass |
| `Button/Default` | "Save changes" | 127 | 343 | `mantine-Group-root` | fail |
| `TwoColumnForm/Default` | "Cancel" / "Submit" | 182 | 375 | `mantine-Group-root` | fail |
| `HomepageListingGrids/Default` | "View all" | 88 | 343 | `mantine-Group-root` | fail |
| `ListingContactPattern/Default` | "Share" | 240 | 286 | `mantine-Group-root` | fail (deficit **46**) |
| `ListingContactPattern/Default` | "Report listing" | 106 | 286 | `mantine-Group-root` | fail |
| `ListingContactPattern/Default` | "Call" / "WhatsApp" | 286 | 286 | `mantine-Flex-root` | pass |
| `ListingContactPattern/Default` | "Send message" / "Sign in" | 286 | 286 | `mantine-Stack-root` | pass |
| `HeroSearch/Default` | "2" | 75 | 285 | **`_controls_blflv_68`** | fail |

Task 711's session log §6 states *"every failing button's parent is a Mantine `Group`."* **That is true for 4 of
the 5 probed stories and false for `HeroSearch`**, whose failing button sits in a CSS-module flex row. Do not
carry the generalisation into your fix. It is also why `HeroSearch` is routed elsewhere (§3.7).

Note the spread: `ListingContactPattern`'s "Share" misses by 46px while "Report listing" misses by 180px. These
are not one uniform defect and must not get one uniform fix.

### 3.4 The cross-gate evidence — story #8 only

Owner-run `npm run check:click-shield` against a production build, 2026-08-07: **16 cells, 221 elements checked,
9 interceptions, 0 empty-candidate cells.** Five of the nine are story #8's CTA:

```
/en × mobile-375  blocked:     <a class="… mantine-Button-root …"> "View all" @ (271,773 88x44)
                  interceptor: <button class="… MobileBottomNavView_navItem__q7rhi …"> @ (300,757 75x55)
```

Same element, same 88px width the geometry probe recorded. The remaining 4 interceptions are
`FavoriteButton`'s `mantine-ActionIcon-root`, which `fullWidthButtonsAtMobile` correctly does not match
(icon-only, no `.mantine-Button-label`) — **not this task's concern.**

**Hypothesis, explicitly unproven:** a full-width CTA moves its centre point away from the bottom-nav item and
clears the interception. R2 tests it. If it does not clear, say so — a negative result is the deliverable.

### 3.5 The tracked-defect mechanism, and its hard limit

`MANTINE_PATTERN_KNOWN_FAILURES` (`check-stories-rendered.mjs:335`) is currently `{}`. Its contract, written at
`:304-320`:

- It is for an **ALREADY-FILED, REAL** defect, filed as its own dedicated follow-up task — **never** a gate false
  positive. Owner decision, Task 607 review, 2026-07-15.
- An entry pins `expectedFailingCells` and `expectedFailReason`. A matching story still fails loudly and still
  shows `verdict: 'known-failure'` in the manifest; it is excluded from the blocking count **only** on an exact
  signature match. Any divergence — fewer, more, or a different reason — reverts to a hard blocking failure.

**The limit you must plan around:** the reconciliation loop at `:1609-1611` builds its prefix as
`` `Patterns/Mantine/${componentName}/` ``. **Stories #1–#4 are `Mantine/Primitives/*` and therefore cannot be
registered at all.** For those four, only "fix" or "fix the gate" is available. Do not widen the registry's
prefix as a convenience — if you conclude the mechanism genuinely needs to cover primitives, **stop and report**;
that is a governance change with its own blast radius.

**Second thing to verify, not assume:** `getPrimaryFailReason` (`:344`) derives its reason from a
`visualIntegrity` violation, else synthetic `'horizontal-overflow'`, else the render-check's `failReason`, else
`'unknown'`. A `fullWidthButtonsAtMobile === false` failure may fall through to `'unknown'`, which would make
every pinned signature indistinguishable. **R5 requires you to measure what it actually returns for this failure
class before registering anything.**

### 3.6 Fixing the gate is allowed — silencing it is not

Task 611's precedent (recorded at `:322-330`): when `AdminSurfacePattern` and `AppShellFoundation` were confirmed
from rendered pixels to be **gate heuristic** problems, the fix was to the **gate itself** — a bbox-containment
guard, and a trigger-visibility skip — *"never a per-story allowlist, which is reserved for confirmed real
defects only."*

So a "gate over-reach" classification is legitimate and has precedent. Story #1 is the obvious candidate: a
variant catalogue that exists to display buttons side by side is not a UI surface clause 11 was written about.
But that conclusion must come from **rendered evidence and the clause-11 text**, not from convenience — and the
remedy is a principled gate rule (e.g. an explicit, documented exemption condition), never a story-id list.

Agent-contract clause 11 is the governing text: *"For in-scope UI below 640px, text controls use the full
available width… Icon-only or domain-specific exemptions must be explicit."*

### 3.7 `HeroSearch` is not yours

Sprint 49 is open and **ordered**: 708 blocks 709 (**D32**). `HeroSearch/Default`'s failing button has a
CSS-module parent, not a Mantine `Group` (§3.3) — a different defect shape mid-de-Tailwind. **Zero diff** to
`HeroSearchView.tsx`, its module CSS, and its story. Its 12 failing cells stay red at the end of this task; §12's
AC6 accounts for them explicitly.

### 3.8 Worktree state

Assume **dirty**. Task 711's and Task 723's work may be committed or still uncommitted when you start. Take your
own pre-write `git status --porcelain` snapshot before the first edit and complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every entry it contains. For every path you claim
untouched, keep a before/after content witness — an equal porcelain line is not sufficient.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2-3.6, cl. 11 | **Classify before changing.** Each of the 12 in-scope stories receives exactly one disposition — `FIX`, `DEFER`, or `GATE` — each traced to a rendered screenshot at 375px and to the clause-11 text. Persist the classification table with its evidence paths. **No layout or gate edit before this exists.** | P0 | AC1 | Confirmed |
| R2 | §3.4 | **`HomepageListingGrids` first.** Make its CTA full-width, then re-run `check:click-shield` against a production build and state whether the 5 interceptions cleared. Report the result either way; a negative result is a valid, required outcome. | P0 | AC2 | Confirmed |
| R3 | R1, cl. 11, cl. 16 | Every `FIX` story is remediated using Mantine layout mechanisms (`fullWidth`, `Stack`, `grow`, responsive props) traced to `docs/mantine-responsive-design-system.md`; visual values trace to `docs/tailadmin-style-reference.md`. **No local utility chain, no inline width, no `!important`.** | P0 | AC3 | Confirmed |
| R4 | §3.5 | Every `DEFER` story has a `MANTINE_PATTERN_KNOWN_FAILURES` entry with an exact pinned signature **and** a real follow-up task number filed in `docs/backlog.md`. A registry entry without a filed task is forbidden. | P0 | AC4 | Confirmed |
| R5 | §3.5 | **Prove the registry mechanism works for this failure class before relying on it**: measure what `getPrimaryFailReason` returns for a `fullWidthButtonsAtMobile === false` cell, then plant a signature divergence and show the reconciliation reverts to a hard blocking failure with the mismatch message. Two transcripts. | P0 | AC5 | Confirmed |
| R6 | §3.1 | **CORRECTED 2026-08-07 (see §16).** `npm run screenshots:assert -- --mantine-only` reports **zero FAIL cells outside `HeroSearch/Default`**. `HeroSearch`'s 12 cells stay red by §3.7's mandate, so the run's **exit code is 1 and that is the accepted terminal state of this task** — returning the gate to exit 0 belongs to Sprint 49. Every residual non-pass cell is named. `FULL_WIDTH_TOLERANCE` unchanged at 8 — verify by hash. | P0 | AC6 | Corrected |
| R7 | §3.6, D32 | **Planted proof for any gate change.** If any story is classified `GATE`, plant a violation the corrected gate must still catch, show `false`, remove it, show restoration. Skipped only if no story is classified `GATE` — state that explicitly. | P0 | AC7 | Confirmed |
| R8 | cl. 7 | Any new or changed user-facing string is present in `sq`, `en`, `uk`, `it`, verified at runtime. If no strings change, state that. | P1 | AC8 | Confirmed |
| R9 | scope | **Zero diff** in `HeroSearchView.tsx` + its module CSS + story, `MobileBottomNavView.tsx`, `FULL_WIDTH_TOLERANCE`, `check-assertion-liveness.mjs`, `assertion-liveness-registry.json`, `fullWidthControlsAtMobile`, `MANTINE_VIEWPORTS`, `package.json`, `governance-pr.yml`, `docs/critical-flow-registry.md`. Verify by hash. | P0 | AC9 | Confirmed |
| R10 | cl. 9 | `npx tsc --noEmit` 0 errors and `npm run build` exit 0, transcript persisted with the exit code **inside** the file. | P0 | AC10 | Confirmed |
| R11 | cl. 14, `ai-behavior.md` **5a** | Counting gates run in **two passes** — the final one after every artifact exists, including the session log and `docs/backlog.md` — and reconcile to `git status`. | P1 | AC11 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the disposition is R1's output, not this kickoff's.** §3.3 deliberately stops at the measurements. This
  kickoff does **not** pre-decide that story #1 is a `GATE` case, even though it is the obvious candidate — that
  judgment needs rendered evidence and the clause-11 text, and pre-deciding it here would be the same error
  Task 711 was written to repair one layer up.
- **A2 — a `GATE` classification is legitimate but expensive.** It requires §3.6's principled condition plus R7's
  planted proof. If you find yourself writing a story-id list, you have taken the forbidden path.
- **A3 — the click-shield hypothesis may be wrong.** R2 does not require the interception to clear. It requires
  you to measure and report. If a full-width CTA does not clear it, that is a finding for a bottom-nav task.
- **A4 — `check:click-shield` needs a real production server.** `npm run build` then `npm start`, then run the
  gate with `BASE_URL`. A stale process on :3000 produces 16 × `EMPTY CANDIDATE SET`; the gate correctly refuses
  to exit 0 on that, and it is **not** a pass. Confirm the port is free first.
- **A5 — the matrix run is expensive.** 1184 cells over a real browser. Capture unpiped, budget for it, and do
  not substitute a partial run for AC6's final evidence. If the harness cannot run, **stop and report `BLOCKED`**
  with the exact failure.
- **A6 — story #3's component source was not located during task design.** Find it before editing; if
  `FiltersPanelShell` has no single component source, **stop and report** rather than editing the story to make
  the gate green.

### 5.1 Rejected alternatives — do not re-open

- **Widen `FULL_WIDTH_TOLERANCE`.** Rejected: it is the single change that would turn all 148 cells green while
  removing the assertion's meaning. Task 711 R8/§10.4 forbade it under a narrower scope; it stays forbidden.
- **Allowlist the failing stories.** Rejected by owner decision, Task 607 review, 2026-07-15
  (`check-stories-rendered.mjs:304-309`) — an allowlist is for false positives, never for a confirmed true
  positive.
- **Re-register the assertion as dead.** Rejected by **D33** and by Task 710, which registered it as *tracked
  dead*, explicitly not removable.
- **Re-anchor or re-scope the assertion.** Rejected: 711 owns it, it is verified, and changing it here would
  destroy this task's only comparator.
- **Fix `MobileBottomNavView` to clear the interception.** Rejected for this task: Task 713 landed it under
  closed Sprint 50, and moving the nav to fix a CTA is a different blast radius. File it if R2 shows it is needed.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 7, 9, 11, 12, 14, 16) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md`.

**Because this is responsive UI on migrated surfaces:** `docs/mantine-responsive-design-system.md` (the
behaviour/responsive source of truth) · `docs/tailadmin-style-reference.md` (the visual source of truth) ·
`docs/component-rules.md` (container/presentational split, no-duplicate rule).

**Because a governance registry and possibly a gate are in scope:** `docs/storybook-governance.md` **§14.9.27**
(711's re-anchor record) · `docs/orchestrator-ui-task-design.md`.

**Task-specific — read, and note which you may not edit:**

- `scripts/check-stories-rendered.mjs` — `:473` (`FULL_WIDTH_TOLERANCE`, **do not edit**), `:304-335`
  (the registry and its owner-decision contract), `:344` (`getPrimaryFailReason`), `:1606-1628` (the
  reconciliation loop and its `Patterns/Mantine/` prefix), `:1148-1195` (711's re-anchored assertion —
  **do not edit unless a story is classified `GATE`, and then only per R7**).
- The 12 story files and their component sources listed in §3.2.
- `.screenshots/task711-evidence/R8-geometry-probe.json` — the measured geometry.
- `docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` — §6 for the finding, **and §3.3 above
  for where its summary overstates the mechanism**.

---

## 7. Scope

- `src/design-system/mantine/patterns/**` — layout props on the pattern components behind `FIX` stories.
- `src/modules/listings/components/FeaturedListingsView.tsx` / `LatestListingsView.tsx` — story #8's CTA.
- `src/modules/notifications/components/NotificationBellView.tsx` — story #4, if classified `FIX`.
- `src/components/shared/Filter*.tsx` — stories #2/#3, if classified `FIX`.
- `src/stories/**` — only where a story's own layout wrapper (not the component) is the cause, and only when R1
  documents that.
- `scripts/check-stories-rendered.mjs` — `MANTINE_PATTERN_KNOWN_FAILURES` entries (R4), and the assertion itself
  **only** under a `GATE` classification with R7 proof.
- `docs/storybook-governance.md` — record the classification table and any gate change.
- `docs/backlog.md` — concise state only, plus any follow-up task numbers R4 files.
- `docs/sessions/2026-08-0X-task724-fullwidth-buttons-13-story-adjudication.md`.

## 8. Out of scope

- `HeroSearch` — Sprint 49 (§3.7). **Zero diff.**
- `MobileBottomNavView.tsx` — Task 713, Sprint 50 closed. **Zero diff.**
- `FULL_WIDTH_TOLERANCE` · `fullWidthControlsAtMobile` (**722**) · `MANTINE_VIEWPORTS` (**678**) ·
  `check-assertion-liveness.mjs` and `assertion-liveness-registry.json` (**721**) · `noHorizontalOverflow` ·
  `heroSearchWrapInBand` · `package.json` · `governance-pr.yml` · `docs/critical-flow-registry.md`.
- `FavoriteButton`'s `mantine-ActionIcon-root` interceptions (4 of the 9, §3.4) — icon-only, correctly unmatched.

---

## 9. Current and required behavior

**Current:** `fullWidthButtonsAtMobile` resolves `false` in 148 cells across 13 stories, all four locales, all
three mobile widths. `--mantine-only` exits 1, blocking CI. `MANTINE_PATTERN_KNOWN_FAILURES` is empty. Story #8's
CTA renders at 88px inside a 343px `Group` and is click-blocked by the bottom nav in 5 production cells.

**Required after:** every one of the 12 in-scope stories carries an evidenced disposition; every `FIX` story
renders its text buttons at full available width below 640px using Mantine layout mechanisms; every `DEFER` story
has a signature-pinned registry entry and a filed follow-up task; any `GATE` change is a principled condition
with planted proof, never a story list; `--mantine-only` has **no FAIL cell outside `HeroSearch`**, whose 12 cells
stay red under their Sprint-49 carve-out and hold the run at exit 1 (§16); `FULL_WIDTH_TOLERANCE` is still 8; and
R2 states plainly whether the full-width CTA cleared the click-shield interception.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`; complete the dirty-worktree manifest. Persist a fresh
  `screenshots:assert -- --mantine-only` transcript and its per-story failing-cell counts.
- **I2 — Classification (R1).** Rendered screenshots at 375px for all 12; write the disposition table with
  evidence paths. **Choose dispositions from this and the clause-11 text, nothing else.**
- **I3 — Story #8 first (R2).** Fix the CTA, rebuild, re-run the matrix, then `npm run build` + `npm start` +
  `check:click-shield`. Record whether the 5 interceptions cleared.
- **I4 — Remaining `FIX` stories (R3).** One story per commit-sized unit; re-run the matrix after the batch.
- **I5 — Registry proof, then entries (R5 then R4).** Measure `getPrimaryFailReason`'s actual output for this
  failure class. Plant a signature divergence, show the hard blocking failure, remove it. Only then add entries.
- **I6 — Any `GATE` change (R7).** Principled condition + planted proof, both arms.
- **I7 — Final matrix (R6).** No FAIL cell outside `HeroSearch`; every residual cell reconciled by name; exit code
  quoted as-is (expected 1, §16).
- **I8 — Docs** (`storybook-governance.md`), then `npx tsc --noEmit`, then `npm run build`.
- **I9 — Counting gates, two passes** per `ai-behavior.md` **5a** — the final one after the session log and
  backlog exist, reconciled to `git status`.

---

## 10. Implementation requirements

1. **Classify before you change** (I2, A1). A fix chosen before the evidence is the defect this sprint exists to
   avoid repeating.
2. **Never widen `FULL_WIDTH_TOLERANCE`** (§5.1). It is the one change that makes everything green and means
   nothing.
3. **Never allowlist a confirmed true positive** — owner decision, Task 607 review, 2026-07-15.
4. **A registry entry without a filed follow-up task is forbidden** (R4). The registry's own contract requires it.
5. **Prove the registry mechanism before relying on it** (R5). `getPrimaryFailReason` may return `'unknown'` for
   this failure class, which would make signatures meaningless — measure it.
6. **Mantine layout mechanisms only** (R3). No inline widths, no utility chains, no `!important`.
7. **Report R2's negative result if that is what you measure.** The hypothesis is not a requirement.
8. **Capture every transcript unpiped** (Task 710 R10; Task 711 F2 — a truncated transcript is a failed AC).
9. **No task number in any code identifier** (Task 701 F2). Comments may cite the task; identifiers may not.
10. **Counting gates in two passes, final one genuinely last** (`ai-behavior.md` 5a).
11. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.

---

## 11. Positive and negative flows

**Positive flow:** all 12 stories classified with rendered evidence; story #8 fixed and the click-shield result
recorded; remaining `FIX` stories remediated with Mantine layout props; the registry mechanism proven for this
failure class, then entries added with filed follow-up tasks; any gate change proven by plant-and-remove; final
matrix exits 0 with `HeroSearch`'s 12 cells reconciled; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Story is a real defect, fixable now | **Yes** | R3 | full-width at <640, cell turns `true` | AC3 |
| Story is a real defect, deferred | **Yes** | R4 | signature-pinned entry + filed task | AC4 |
| Story is gate over-reach | **Yes** | R7, §3.6 | principled gate condition + planted proof | AC7 |
| `Mantine/Primitives/*` story needs deferral | **Yes** | §3.5 | **impossible** — registry is `Patterns/` only → **stop and report** | AC4 |
| `getPrimaryFailReason` returns `'unknown'` | **Yes** | R5 | signatures indistinguishable → **stop and report** before registering | AC5 |
| Full-width CTA does not clear the interception | **Yes** | A3 | record the negative result; file a bottom-nav task | AC2 |
| Signature diverges after a later change | **Yes** | R5 | hard blocking failure + mismatch message | AC5 |
| Locale expansion changes button width | **Yes** | R8, cl. 7 | all four locales verified at all three mobile widths | AC8 |
| `HeroSearch` still fails at the end | **Yes** | §3.7 | expected; reconciled by name, not fixed | AC6 |
| Harness cannot run | **Yes** | A5 | **`BLOCKED`** with the exact failure | — |
| Stale process on :3000 | **Yes** | A4 | 16 × EMPTY CANDIDATE SET is **not** a pass — free the port, re-run | AC2 |
| `FavoriteButton` ActionIcon interceptions | **No** | §3.4 | icon-only, correctly unmatched | — |
| RLS / data access | **No** | layout-only change over Storybook + a static production build | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given rendered screenshots at 375px for all 12 in-scope stories, then a persisted table assigns
  each exactly one of `FIX` / `DEFER` / `GATE`, with the screenshot path and the clause-11 reasoning quoted for
  each. No layout or gate edit predates this file.
- **AC2 [R2]** Given story #8's CTA made full-width, then the matrix shows its cells `true`, **and** a
  `check:click-shield` run against a real production build (`Empty-candidate cells: 0`) states the interception
  count before and after. Both numbers quoted, whichever direction they moved.
- **AC3 [R3]** Given each `FIX` story, then its cells resolve `true` at all three mobile widths in all four
  locales, and the diff shows only Mantine layout props traced to `docs/mantine-responsive-design-system.md`.
  Quote each changed line.
- **AC4 [R4]** Given each `DEFER` story, then `MANTINE_PATTERN_KNOWN_FAILURES` holds a matching entry with
  `expectedFailingCells`, `expectedFailReason` and `followUpTask`, and that task number exists in
  `docs/backlog.md`. No `Mantine/Primitives/*` story appears — or the task stopped and reported.
- **AC5 [R5]** Given a `fullWidthButtonsAtMobile === false` cell, then the measured `getPrimaryFailReason` output
  is stated verbatim; and given a planted signature divergence, the reconciliation prints
  `TRACKED KNOWN-FAILURE SIGNATURE CHANGED` and the run blocks. Two transcripts, both unpiped.
- **AC6 [R6] — CORRECTED 2026-08-07 (§16).** Given the final matrix run, then the FAIL set contains **no story
  other than `Mantine/Primitives/HeroSearch/Default`**; every residual non-pass cell (FAIL and AMBIGUOUS) is named
  in the session log and reconciled to a registry entry, to `HeroSearch`'s §3.7 carve-out, or to a pre-existing
  unrelated cause; the run's **exit code is quoted as-is and is expected to be 1** while `HeroSearch` is red;
  and `FULL_WIDTH_TOLERANCE` is hash-identical to `HEAD`.
  **Do not attempt to force exit 0.** Any change that would produce exit 0 in this task necessarily violates
  §3.7's zero-diff mandate or widens the registry prefix §3.5 forbids. Both are rejected alternatives.
- **AC7 [R7]** Given any `GATE` classification, then a planted violation makes the corrected assertion report
  `false` and its removal restores the prior value — two transcripts. If no story is classified `GATE`, state
  that explicitly and mark AC7 `not applicable` with that reason.
- **AC8 [R8]** Given any changed user-facing string, then all four locale files carry it and the matrix verifies
  it at runtime. If none changed, state that.
- **AC9 [R9]** Given `git diff`, then every path in §8 is byte-identical to `HEAD`. Verify by
  `git hash-object` vs `git rev-parse HEAD:<path>` and quote the comparison.
- **AC10 [R10]** `npx tsc --noEmit` reports 0 errors and `npm run build` exits **0**, transcript at a stated path
  with the exit code inside it.
- **AC11 [R11]** Given two counting-gate passes, then the final one runs after every artifact exists and its
  numbers reconcile to `git status`. State the reconciliation and both pass numbers.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** Three independent reasons: `--mantine-only` is a hard-blocking CI gate;
the change touches shipped homepage, listing-detail and form surfaces in all four locales; and a governance
registry with a signature mechanism is being used for the first time, which Q4's planted-violation clause
covers directly (R5, R7). Rendered evidence is not supplementary here — AC1 is entirely rendered evidence, and
AC2 requires a real production build.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) + dirty-worktree manifest | every entry reconciled |
| 2 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` (I1) | baseline: exit 1, 148 fails, 13 stories |
| 3 | Rendered screenshots ×12 at 375px (I2) | persisted; classification table written |
| 4 | Story #8 fix + matrix (I3) | its cells `true` |
| 5 | `npm run build` · `npm start` · `BASE_URL=… npm run check:click-shield` (I3) | `Empty-candidate cells: 0`; interception count stated before/after |
| 6 | Remaining `FIX` stories + matrix (I4) | their cells `true` |
| 7 | `getPrimaryFailReason` measurement (I5) | actual return value quoted |
| 8 | Planted signature divergence + removal (I5) | `SIGNATURE CHANGED`, blocking; then clean |
| 9 | Any `GATE` change: plant → `false` → remove → restored (I6) | two transcripts, or `not applicable` stated |
| 10 | **`npm run screenshots:assert -- --mantine-only`** (I7) | **FAIL set ⊆ `HeroSearch/Default` — hard gate.** Exit 1 expected and accepted (§16) |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate** |
| 13 | `check:i18n` if strings changed | pass |
| 14 | `check:file-integrity` · `check:mojibake` — **pass 2, genuinely last** | pass; reconcile to `git status` |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. An unrunnable harness (steps 2/10)
is `BLOCKED`, never a theoretical pass. A `check:click-shield` run with any empty-candidate cell (step 5) is
**void**, not a pass. Evidence under `.screenshots/task724-evidence/` (local-only, **D6**). **Name every
artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task724-fullwidth-buttons-13-story-adjudication.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R11, each with its AC verdict.
3. **The classification table** (R1) — all 12 stories, disposition, screenshot path, clause-11 reasoning.
4. **Story #8's cross-gate result** (R2) — interception count before and after, stated plainly either way.
5. **Every layout change quoted**, with the `mantine-responsive-design-system.md` reference for each.
6. **The registry proof** (R5) — `getPrimaryFailReason`'s measured output, both signature transcripts.
7. **Every registry entry** (R4) with its filed follow-up task number.
8. **Any gate change** (R7) with both planted transcripts, or an explicit `not applicable`.
9. **The final matrix** (R6) — exit code, and every residual non-pass cell reconciled by name.
10. **Commands run and actual results** — real exit codes, including the step-12 build transcript.
11. **Evidence locations** — every artifact, named.
12. **Counting gates — both passes**, final numbers reconciled to `git status`.
13. **Standing findings not acted on** — **721** · **722** · **678** · **717** · `HeroSearch` (Sprint 49) ·
    `FavoriteButton` ActionIcon interceptions · any bottom-nav task R2 files.
14. **Assumptions, deviations, limitations, unresolved issues.**
15. Concise current state in `docs/backlog.md` — **state only**; flag `BACKLOG LIMIT BREACH` if you cannot hold
    the line count.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest,
or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ all 13 stories named with story-file paths and failing labels; component sources verified present (one gap flagged as such in §3.2/A6); the measured geometry table; the registry's exact contract with its line numbers; the click-shield numbers with the exact blocked/interceptor markup; every command |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R11 → AC1–AC11 → §13 steps 1–14 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC9; `HeroSearch` and `MobileBottomNavView` fenced off with their sprint provenance; `FULL_WIDTH_TOLERANCE` named three times |
| **No number is asserted that was not measured with the real tool** | ✅ 1184 cells · 852 applicable · 384 live (236/148) · 13 stories · 12 in scope · tolerance 8 · 221 elements / 9 interceptions / 5 attributable · every `offsetWidth`/`parentContentWidth` pair from `R8-geometry-probe.json` — all from the owner-run native manifest of 2026-08-07 and the worktree |
| **A claim that could NOT be measured is marked as such** | ✅ §3.4 states the click-shield hypothesis is unproven and R2 accepts a negative result; §3.5 states `getPrimaryFailReason`'s behaviour for this failure class is unverified and makes R5 measure it; §3.2 states story #3's component source was not located |
| **A prior task's summary was checked, not inherited** | ✅ §3.3 records that 711's "every failing button's parent is a `Group`" is false for `HeroSearch`, and routes it out on that basis rather than repeating the generalisation |
| The gate proves the changed behavior, not merely procedure | ✅ R5's signature-divergence proof, R7's planted arms, R2's real-production-build re-measurement, AC6's named reconciliation of every residual cell |
| No new blind spot is created silently | ✅ §3.6 forbids the allowlist path with its owner decision; R4 forbids a registry entry without a filed task; §3.5's `Patterns/` prefix limit is a stop-and-report, not a widening |
| Zero/empty input covered | ✅ AC7 has an explicit `not applicable` arm; A4 makes an empty-candidate click-shield run void rather than a pass; R8 has a "no strings changed" arm |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's classify-before-change + I5's measure-then-plant ordering + A5's `BLOCKED` + A6's stop + the `Mantine/Primitives` deferral stop |
| Ordering/dependency stated | ✅ 711 must land first (**D32**); I3 precedes I4; I5's measurement precedes any registry entry; 721/722 unaffected |
| Owner exceptions have traceable authorization | ✅ Task 607 review 2026-07-15 for the allowlist prohibition (quoted at `:304-309`); Task 611 for the fix-the-gate precedent (`:322-330`); the 2026-08-07 owner decision opening Sprint 53; D6 for the evidence dir |
| Exactly one active executable route | ✅ A1 makes the disposition an R1 output rather than a fork; §5.1 closes five alternatives; A3/A5/A6 and the two stop-and-report branches convert the remaining forks into stop conditions |
| Prior-review corrections folded in | ✅ 711 F2 → implementation requirement 8 (a truncated transcript is a failed AC) · 711 F1 → §3.1 uses 384, not 383 · 711 F3 → the `[role="group"]` breadth is not re-used as a fix mechanism · 719/720's counting-gate defect → R11 |
| Sprint assigned before creation | ✅ Sprint 53, opened with its own plan file before this kickoff was written |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none to start.** Three may arise mid-task, and each is a stop rather than a
judgment call: a `Mantine/Primitives/*` story needing deferral the registry cannot express (§3.5); a
`getPrimaryFailReason` value that makes signatures indistinguishable (R5); and story #3's missing component
source (A6).

---

## 16. Correction record — R6/AC6 was unsatisfiable as originally written (2026-08-07)

**This is an orchestrator task-design defect, not an executor failure.** The original R6/AC6 demanded
`--mantine-only` exit **0** while three other clauses of this same kickoff made exit 0 unreachable:

1. §3.7 mandates **zero diff** to `HeroSearchView.tsx`, its module CSS and its story, and states its 12 cells
   "stay red at the end of this task."
2. §3.5's reconciliation loop builds its prefix as `` `Patterns/Mantine/${componentName}/` ``, so
   `Mantine/Primitives/HeroSearch` **cannot** be registered in `MANTINE_PATTERN_KNOWN_FAILURES` — and §3.5
   forbids widening that prefix, making it a stop-and-report.
3. §3.2 marks `HeroSearch` OUT OF SCOPE, so no `GATE` disposition and no R7 planted proof can attach to it.

Twelve red cells that may not be fixed, may not be registered, and may not be exempted cannot yield exit 0.
§11's own flow table already specified `stop and report` for this branch, and the executor took it correctly.

**Correction applied:** R6/AC6 and QA step 10 now require the FAIL set to contain no story other than
`HeroSearch/Default`, with the exit code quoted as-is (expected 1). The gate's return to exit 0 is Sprint 49's
exit criterion, not this task's. Sprint 53's plan file exit criterion 2 is amended to match.

**Standing lesson for future kickoffs** (add to the recurring-failure-mode list in `docs/backlog.md`): when a
kickoff fences a failing artifact off as zero-diff, it must not simultaneously require the aggregate gate that
measures that artifact to go green. State the *scoped* pass condition — "no failure outside X" — and assign the
aggregate exit code to the task that owns X.

**This correction does not close Task 724.** The 2026-08-07 implementation review returned `NEEDS REVISION` on
findings unrelated to AC6; see `Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md`.
