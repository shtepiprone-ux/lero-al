# Task 725 — The fixed bottom nav overlays and intercepts homepage content

**Sprint:** 54 (`tasks/Sprints/Sprint_54_MobileBottomNav_Overlay_Collision.md`). **Epic:** MM Phase-2.
**Depends on:** Task **723** landed — its `scripts/check-click-shield.mjs` is this task's only comparator
(**D32**). **Origin:** Task 723 §7's out-of-scope finding, re-measured by Task 724's R2; owner split it out
2026-08-07.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **layout / responsive defect on a shipped route** (`docs/rule-index.md` → UI/responsive),
  agent-contract **clause 11** (mobile-reachable controls) and **clause 5** (existing UX flows intact).

> **Read this first.** Two tasks have already measured this and neither fixed it, on purpose. Task 723 found it
> and scoped it out under clause 1. Task 724 tested one hypothesis about it and **disproved** it. You are not
> re-discovering a defect; you are root-causing a known one whose geometry is already on record. The failure mode
> to avoid is fixing the one element that happens to be reported — the "View all" CTA — instead of the condition
> that lets any content sit under a fixed nav.

---

## 2. Objective

1. **Root-cause the collision** (R1) from measured DOM on a real production build, not from the gate's summary.
2. **Fix the condition, not the symptom** (R2) — no content in the fixed nav's viewport band may be unreachable,
   at any scroll position, at any of the three mobile widths, in all four locales.
3. **Prove it with the gate that found it** (R3): 0 interceptions across all 16 cells, plus the gate's own
   planted round trip still passing.
4. **State the regression-guard truth** (R6): `check:click-shield` is currently in **no** CI workflow.

**Non-goals:** do **not** re-hybridise `MobileBottomNavView` (Task 713, **D28**/**D34**); do **not** widen scope
to `FavoriteButton`'s own layout; do **not** fix Task 724/724R's full-width work; do **not** wire the gate into
CI in this task unless §3.5 says Task 723's review already did.

---

## 3. Verified context

Every number below was measured with the real tool. Provenance is named for each.

### 3.1 The nav's geometry — read from source, 2026-08-07

`src/components/layout/MobileBottomNavView.module.css`:

| Property | Value | Line |
|---|---|---:|
| `position` | `fixed` | 51 |
| `bottom` | `var(--space-0)` | 52 |
| `z-index` | `30` | 55 |
| `height` | `var(--space-14)` = **56px** (`globals.css:164`) | 64 |

Plus an inline `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` at `MobileBottomNavView.tsx:38`, so the
occupied height is 56px **plus** the safe-area inset — which is 0 in a headless browser and non-zero on real
hardware. **Your measurements will understate the real-device footprint. Say so.**

### 3.2 The three runs

| When | Run | Result |
|---|---|---|
| 2026-08-06 | 723 pre-fix baseline at `081c03e7f` | 3 of 36 interceptions name `span.navItemLabel` at mobile-390 — **predates 723** |
| 2026-08-07 | 723 owner-run, production build | 16 cells, **221 elements, 9 interceptions**, 0 empty-candidate. All interceptors `MobileBottomNavView_navItem*` or `span.navItemLabel`. Blocked: "View all" (5) + favorites heart icon (4). `desktop-1024` 4/4 clean; `mobile-320` 3/4 clean (`it@320` fails on longer localized text) |
| 2026-08-07 | 724 post-CTA-fix (`.screenshots/task724-evidence/I3-click-shield-after.log`) | 16 cells, **208 elements, 4 interceptions**, 0 empty-candidate. All 4 at `mobile-390`, one per locale |

### 3.3 The arithmetic — why mobile-390 only

`check-click-shield.mjs:75-79` and `check-stories-rendered.mjs:392-397` both use **320×812, 375×812, 390×844,
1024×768**. A 56px nav fixed to `bottom: 0` occupies:

| Viewport | Nav band (y) | 724's post-fix CTA (y) | Overlap |
|---|---|---|---|
| mobile-320 / 375 | 756 – 812 | reflows clear | none — cells **pass** |
| **mobile-390** | **788 – 844** | **782 – 826**, centre **804** | **38 of 44px covered → centre inside the band** |
| desktop-1024 | nav hidden | — | none |

724's measured interceptor y-coordinates — 798 (`sq`/`en`) and 793 (`uk`/`it`) — both fall inside 788–844,
consistent with this. **Confirm this arithmetic yourself at J1; do not inherit it.**

### 3.4 Two diagnostic defects in the gate's output — verified, and they will mislead you

`check-click-shield.mjs:97-105` and `:113-121` both build their description as
`(el.className ?? '').toString().slice(0, 120)`.

1. For **SVG elements** `className` is an `SVGAnimatedString`, not a string, so `.toString()` yields the literal
   `"[object SVGAnimatedString]"`. That is why 724's log reports
   `interceptor: <path class="[object SVGAnimatedString]">` — the interceptor is **not** anonymous, the gate just
   cannot print its class.
2. The printed `rect` is `getBoundingClientRect()`, which for a `<path>` is its bbox — 724's log shows
   `0x14`, a **zero-width** box. A zero-width bbox does not mean a zero-width hit area.
   **The reported interceptor geometry cannot be used to reason about the overlap.** Walk up to the nav
   container and measure *that* rect.

Both are real defects in a gate this task depends on. R5 decides whether to fix them here.

### 3.5 The regression-guard gap — surfaced during the 724 review

`grep -n "click-shield" .github/workflows/*.yml` returns **nothing**. `check:click-shield` and
`check:click-shield:verify` exist in `package.json` (`:83-84`) and in no workflow. Task 723's session log
describes it as a "new blocking gate"; it is currently blocking **locally only**.

**Check Task 723's review outcome at J1.** If that review landed the CI wiring, inherit it and say so. If it did
not, R6 requires you to state plainly that this task's fix has no automated regression guard, and name the gap.
**Do not wire it yourself** — `governance-pr.yml` has its own blast radius and belongs to whoever owns 723.

### 3.6 The clearance that exists, and where it is

`FooterView.module.css:35` reserves `padding-bottom: var(--space-14)` below `md`, dropping to `0` at `md`
(`:39`). `MobileBottomNavView.module.css:42-45` documents the coupling: *"the bar-height / clearance-padding
coupling is expressed by both this file's `.navBar` and … equal by construction, confirmed I1: bar height 56px ==
`--space-14`."*

**Hypothesis, explicitly unproven — R1 confirms or refutes it.** A footer reserves space at the bottom of the
**document**. A `position: fixed` nav overlays the bottom of the **viewport** at every scroll position. Content
that lands in that band before the footer is reached — the Featured CTA at scroll 0 — has no clearance at all.
If that is right, the defect is a missing *viewport-level* clearance contract, and the footer's padding is a
local patch that was mistaken for the general one. **Measure it. Do not assume it.**

### 3.7 What is unresolved and must not be quietly closed

Task 723 measured **4** `FavoriteButton` `ActionIcon` interceptions. Task 724's run shows **0**, with **13 fewer
elements checked** overall (221 → 208), and Task 724's own log records this as *"not independently investigated …
flagged as an observation, not a claim of a fix."* Treat `FavoriteButton` as **unresolved**. R4 requires you to
re-measure it and state whether it reproduces.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.3, §3.6 | **Root-cause from measured DOM.** On a real production build, for every interception the gate reports, walk from the reported interceptor up to its nearest positioned ancestor and record: that element's `getBoundingClientRect()`, its computed `position`/`z-index`, the blocked element's rect, and the viewport height. State whether §3.6's hypothesis holds. Persist the raw measurements as JSON. | P0 | AC1 | Confirmed |
| R2 | R1, cl. 11, cl. 5 | **Fix the condition, not the element.** The remedy must make *any* content in the fixed nav's viewport band reachable — not only the "View all" CTA. State the chosen mechanism, the surface it applies to, and its blast radius (which routes and breakpoints change). Existing UX — nav position, nav height, footer spacing, scroll behavior — is preserved unless the fix explicitly changes it and says so. | P0 | AC2 | Confirmed |
| R3 | §3.2 | **0 interceptions**, all 16 cells, `Empty-candidate cells: 0`, against a real production build. Quote the before and after summary lines verbatim. | P0 | AC3 | Confirmed |
| R4 | §3.7 | **Re-measure `FavoriteButton`.** State the checked-element count and whether its 4 interceptions reproduce. If the count still differs from 723's 221, explain it or record `unknown` explicitly. | P0 | AC4 | Confirmed |
| R5 | §3.4 | **Decide the two diagnostic defects.** Either fix them in `check-click-shield.mjs` (SVG `className` via `el.getAttribute('class')`; report the nearest positioned ancestor's rect alongside the raw interceptor's) and show a before/after output pair, **or** state explicitly why you left them and file the follow-up. Not fixing is acceptable; not deciding is not. | P1 | AC5 | Confirmed |
| R6 | §3.5 | **State the regression-guard truth.** Report whether `check:click-shield` runs in CI as of this task. If it does not, say so plainly and name the gap. Do not wire it. | P0 | AC6 | Confirmed |
| R7 | cl. 15, D32 | **Planted round trip.** `npm run check:click-shield:verify` passes after the fix — the gate that proves the fix can still fail. Quote the transcript. | P0 | AC7 | Confirmed |
| R8 | D28, D34 | **`MobileBottomNavView`'s de-Tailwind mechanism survives.** If the fix touches it at all, its module-CSS structure and `@layer` wrapping are preserved; quote the diff. If untouched, verify by hash. | P0 | AC8 | Confirmed |
| R9 | cl. 7 | Any new or changed user-facing string exists in `sq`, `en`, `uk`, `it`. If none changed, state that. | P1 | AC9 | Confirmed |
| R10 | cl. 9 | `npx tsc --noEmit` 0 errors and `npm run build` exit **0**, transcripts with the exit code **inside** the file. | P0 | AC10 | Confirmed |
| R11 | cl. 14, `ai-behavior.md` **5a** | Counting gates in two passes, the final one after every artifact exists, reconciled to `git status` with a correct composition. | P1 | AC11 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the root cause is R1's output, not this kickoff's.** §3.6 states a hypothesis and stops there
  deliberately. Pre-deciding it would repeat the error this sprint exists to correct.
- **A2 — the safe-area inset is 0 in headless and non-zero on device** (§3.1). Every measurement you take
  understates the real footprint. Record that as a limitation; do not silently treat headless as ground truth.
- **A3 — `check:click-shield` needs a real production server.** `npm run build`, then `npm start`, then the gate
  with `BASE_URL`. **Confirm port 3000 is free first** — a stale process yields 16 × `EMPTY CANDIDATE SET`, which
  the gate correctly refuses to pass and which is **not** a pass (Task 724 A4/A5).
- **A4 — the blast radius may exceed the homepage.** If the fix is a route-shell clearance, it changes every
  mobile page below `md`. That is potentially correct and potentially too much. Measure which routes change,
  state it, and if the right answer needs an owner call, **stop and report** rather than choosing for them.
- **A5 — 723 must land first.** If `scripts/check-click-shield.mjs` is still uncommitted when you start, say so
  in the dirty-worktree manifest and treat it as read-only input unless R5 elects to fix it.

### 5.1 Rejected alternatives — do not re-open

- **Making the CTA full-width.** Already tried and **disproven** — Task 724 R2. The collision is vertical.
- **Moving or shrinking the nav to clear the CTA.** Rejected as the default: the nav is Task 713's landed work
  and moving chrome to fix content is the larger blast radius. Permitted only if R1's measurement shows the nav
  itself is mis-positioned, and then only with R8's mechanism-preservation proof.
- **Exempting `MobileBottomNavView` in the gate's overlay allowlist.** Rejected — the nav genuinely covers a
  control; an exemption would make the gate stop reporting a real, reproducible defect.
- **Fixing only the "View all" element.** Rejected by R2. It is the element that happened to be measured, not the
  condition.

---

## 6. Pre-read rule bundle

**Always:** `docs/agent-contract.md` (cl. 1, 3, 5, 7, 9, 11, 12, 14) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md`.

**Because this is responsive layout on a shipped route:** `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` · `docs/design-system.md` §22 (spacing scale, `--space-14`) ·
`docs/state-authority.md` if the fix touches the route shell.

**Task-specific:**

- `scripts/check-click-shield.mjs` — `:75-79` (viewports), `:95-140` (`describe`/`describeElement` and the
  `elementFromPoint` core), `:160-190` (the three self-test fixtures R7 exercises).
- `src/components/layout/MobileBottomNavView.module.css` — `:42-45` (the clearance-coupling note), `:49-64`
  (`.navBar`), and `MobileBottomNavView.tsx:37-38`.
- `src/components/layout/FooterView.module.css:35,:39` — the existing local clearance.
- `src/app/[locale]/layout.tsx:54` — where the nav is mounted.
- `docs/sessions/2026-08-06-task723-notifications-click-shield.md` §7 — the original finding. **Its numbers are
  an index, not proof; re-measure.**
- `.screenshots/task724-evidence/I3-click-shield-after.log` — the current measured state.

---

## 7. Scope

- `src/app/[locale]/layout.tsx` and/or the route shell — R2's clearance, if that is what R1 indicates.
- `src/app/globals.css` — only if the fix needs a named clearance token beside `--space-14`.
- `src/components/layout/MobileBottomNavView.module.css` / `.tsx` — only under R1 evidence + R8 proof.
- `src/components/layout/FooterView.module.css` — only if R1 shows its padding now double-counts.
- `scripts/check-click-shield.mjs` — R5 only, and only if 723 has landed.
- `docs/storybook-governance.md` — record the root cause and the fix.
- `docs/backlog.md` and `docs/sessions/2026-08-0X-task725-bottomnav-overlay-collision.md`.

## 8. Out of scope — zero diff

- `.github/workflows/governance-pr.yml` — R6 reports the gap; it does not close it.
- `FavoriteButton`'s own layout — R4 measures it; it does not change it.
- `HeroSearchView.tsx` + module CSS + story (Sprint 49) · `FULL_WIDTH_TOLERANCE` · `MANTINE_VIEWPORTS` (678) ·
  `check-assertion-liveness.mjs` + `assertion-liveness-registry.json` (721) · `fullWidthControlsAtMobile` (722).
- **Task 724/724R's full-width work** — Sprint 53. If both are uncommitted when you start, treat every path in
  their diffs as read-only and record a content witness for each.

---

## 9. Current and required behavior

**Current.** `MobileBottomNavView` is `position: fixed; bottom: 0; height: 56px; z-index: 30` and the route shell
reserves no viewport-level clearance for it. At mobile-390 (viewport height 844) it occupies y 788–844 and covers
38 of the 44px of the homepage Featured CTA, whose centre at y 804 falls inside the band. `check:click-shield`
reports 4 interceptions across 16 cells, one per locale, all at mobile-390. The defect predates Task 723, was
masked by the notifications shield until 723 removed it, and survived Task 724's full-width fix.

**Required after.** No content in the fixed nav's viewport band is click-intercepted at any of the three mobile
widths in any of the four locales. `check:click-shield` reports 0 interceptions across 16 cells with
`Empty-candidate cells: 0`; `check:click-shield:verify` still passes. The root cause is stated from measurement
and the fix addresses it generally. `FavoriteButton`'s status is stated either way. The CI regression-guard gap is
recorded. `MobileBottomNavView`'s de-Tailwind mechanism is intact.

### Implementation sequence

- **K1 — Baseline.** `git status --porcelain`; complete `docs/orchestrator-dirty-worktree-manifest-template.md` —
  711, 723, 724/724R may all be uncommitted. Check Task 723's review outcome (§3.5). Confirm port 3000 is free.
  `npm run build` → `npm start` → `check:click-shield`. Persist the unpiped transcript. Verify §3.3's arithmetic.
- **K2 — R1.** Instrumented DOM measurement at every reported interception. Persist raw JSON. State whether
  §3.6's hypothesis holds.
- **K3 — R2.** Implement the fix R1 indicates. State the mechanism, the surface, and the blast radius.
- **K4 — R3/R4.** Rebuild, restart, re-run. 0 interceptions, 16 cells, `Empty-candidate cells: 0`. Record the
  element count and `FavoriteButton`'s status.
- **K5 — R7.** `check:click-shield:verify`, transcript quoted.
- **K6 — R5.** Fix the two diagnostic defects with a before/after output pair, or state why not and file it.
- **K7 — R8.** Hash-verify `MobileBottomNavView` untouched, or quote the diff with its layer/module structure.
- **K8 — Docs**, then `npx tsc --noEmit`, then `npm run build`.
- **K9 — R11.** Counting gates, two passes, the final one genuinely last.

---

## 10. Implementation requirements

1. **Measure before you fix** (K2). §3.6 is a hypothesis; treating it as the answer is the failure this sprint
   exists to correct.
2. **Fix the condition, not the reported element** (R2). If your diff names "View all", re-read §5.1.
3. **Never exempt the nav in the gate** (§5.1). It really does cover the control.
4. **Preserve Task 713's mechanism** (R8, D28/D34).
5. **Every transcript unpiped** (711 F2 — a truncated transcript is a failed AC).
6. **An empty-candidate cell voids the run** (A3). 16 × `EMPTY CANDIDATE SET` is not a pass.
7. **State the safe-area limitation** (A2). Headless is not the device.
8. **No task number in any code identifier.** Comments may cite; identifiers may not.
9. **Stop and report** if R2's blast radius needs an owner call (A4), if the harness cannot run, or if 723's
   comparator is missing (A5).
10. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.
11. **Status must be** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
    Never self-approve; never write a `Decision`/`Confidence`/`Blocking findings` section.

---

## 11. Positive and negative flows

**Positive flow:** baseline re-measured on a production build; every interception instrumented and root-caused;
a general clearance fix landed with its blast radius stated; 0 interceptions across 16 cells; the gate's planted
round trip still passing; `FavoriteButton` stated; the CI gap recorded; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| §3.6's hypothesis confirmed | **Yes** | R1 | viewport-level clearance is the fix | AC1, AC2 |
| §3.6's hypothesis refuted | **Yes** | R1, A1 | state the real cause and fix that instead | AC1 |
| Fix's blast radius exceeds the homepage | **Yes** | A4 | enumerate affected routes; **stop and report** if it needs an owner call | AC2 |
| Interceptions drop but do not reach 0 | **Yes** | R3 | **not a pass** — report the residue by cell and interceptor | AC3 |
| `FavoriteButton` reproduces | **Yes** | R4 | fix it under R2's general condition, or file it | AC4 |
| `FavoriteButton` still absent | **Yes** | R4, §3.7 | state the element-count delta or record `unknown` | AC4 |
| Stale process on :3000 | **Yes** | A3 | 16 × EMPTY CANDIDATE SET is **void** — free the port, re-run | AC3 |
| Task 723 not yet landed | **Yes** | A5, D32 | manifest it; treat the gate as read-only, or **`BLOCKED`** | — |
| 723's review already wired CI | **Yes** | §3.5 | inherit and say so; do not re-wire | AC6 |
| Nav itself measured mis-positioned | **Yes** | §5.1 | permitted, with R8's mechanism proof | AC8 |
| Harness cannot run | **Yes** | A3 | **`BLOCKED`** with the exact failure | — |
| Real-device safe-area inset | **Yes** | A2 | record as a stated limitation, not a measured pass | AC2 |
| RLS / data access | **No** | layout-only change over a static production build | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given every interception in K1's baseline, then a persisted JSON records the blocked element's
  rect, the raw interceptor, its nearest positioned ancestor's rect, that ancestor's computed
  `position`/`z-index`, and the viewport height; and the session log states whether §3.6's hypothesis holds,
  with the measurement that decided it.
- **AC2 [R2]** Given the fix, then the session log names the mechanism, the surface it applies to, and every
  route and breakpoint whose rendering changes; and states the safe-area limitation from A2. The diff shows no
  change keyed to a single element id or a single component's label.
- **AC3 [R3]** Given `BASE_URL=… npm run check:click-shield` against a real production build, then the summary
  reads `Interceptions: 0` and `Empty-candidate cells: 0` across 16 cells. Before and after summary lines quoted
  verbatim, unpiped.
- **AC4 [R4]** The checked-element count is quoted for both runs, and `FavoriteButton`'s 4 interceptions are
  recorded as reproduced, not reproduced with a stated cause, or `unknown` — explicitly one of the three.
- **AC5 [R5]** Either `check-click-shield.mjs` prints a real class for an SVG interceptor and its nearest
  positioned ancestor's rect, shown by a before/after output pair — or the session log states why not and names
  the filed follow-up.
- **AC6 [R6]** The session log states whether `check:click-shield` runs in any `.github/workflows/*.yml` as of
  this task, quoting the grep, and names the gap if it does not.
- **AC7 [R7]** `npm run check:click-shield:verify` transcript quoted, all three fixtures passing.
- **AC8 [R8]** `MobileBottomNavView.module.css` and `.tsx` are hash-identical to their pre-task state, quoted —
  or the diff is quoted and its `@layer` wrapping and module structure shown intact.
- **AC9 [R9]** Every new or changed string exists in all four locale files, or the task states none changed.
- **AC10 [R10]** `npx tsc --noEmit` 0 errors; `npm run build` exit **0**, code inside the transcript.
- **AC11 [R11]** Two counting-gate passes, the final one after every artifact exists, composition reconciled to
  `git status`.

---

## 13. QA profile and verification plan

**Profile: `Q3` Visual/Responsive on a shipped route.** Not Q4: no governance registry, no new signature
mechanism, and the change is layout-only over an existing gate. Q3 is nonetheless the floor, not a courtesy — the
defect is a **click-blocked control on the homepage in all four locales**, and the only proof that counts is a
hit-test against a real production build.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` + dirty-worktree manifest (K1) | every entry reconciled with a content witness |
| 2 | `grep -n "click-shield" .github/workflows/*.yml` (K1, R6) | result quoted either way |
| 3 | `npm run build` · `npm start` · `BASE_URL=… npm run check:click-shield` (K1) | baseline captured; `Empty-candidate cells: 0` |
| 4 | Instrumented DOM measurement (K2) | raw JSON persisted; hypothesis decided |
| 5 | Fix + rebuild + restart + re-run (K3, K4) | **`Interceptions: 0`, 16 cells — hard gate** |
| 6 | `npm run check:click-shield:verify` (K5) | 3/3 fixtures pass |
| 7 | Diagnostic before/after pair, or stated deferral (K6) | one or the other, explicitly |
| 8 | `git hash-object` on `MobileBottomNavView.*` (K7) | identical, or diff quoted with layers intact |
| 9 | `npx tsc --noEmit` | 0 errors |
| 10 | **`npm run build`** | **exit 0 — hard gate** |
| 11 | `check:i18n` if strings changed | pass |
| 12 | `check:file-integrity` · `check:mojibake` — pass 2, genuinely last | pass; composition reconciles to `git status` |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. An unrunnable harness is `BLOCKED`.
Any empty-candidate cell **voids** step 3 or 5. Evidence under `.screenshots/task725-evidence/` (local-only,
**D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task725-bottomnav-overlay-collision.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to the pre-write snapshot.
2. **R1–R11**, each with its AC verdict.
3. **The root cause** (R1) with the measurement that established it, and the §3.6 hypothesis marked confirmed or
   refuted.
4. **The fix** (R2) — mechanism, surface, blast radius by route and breakpoint, and A2's safe-area limitation.
5. **Before/after click-shield summary lines** quoted verbatim (R3), with element counts.
6. **`FavoriteButton`'s status** (R4) — one of the three permitted answers.
7. **The diagnostic decision** (R5) — before/after pair, or the stated deferral and its filed number.
8. **The CI regression-guard statement** (R6) with the grep quoted.
9. **The planted round trip** (R7).
10. **`MobileBottomNavView` integrity** (R8).
11. **Commands and actual exit codes**, including the step-10 build transcript.
12. **Evidence locations**, every artifact named.
13. **Counting gates — both passes**, composition reconciled to `git status`.
14. **Standing findings not acted on** — 721 · 722 · 678 · 717 · `HeroSearch` (Sprint 49) · 724/724R (Sprint 53) ·
    the CI wiring gap (§3.5, owned by 723's review).
15. **Assumptions, deviations, limitations, unresolved issues.**
16. Concise state in `docs/backlog.md`; flag `BACKLOG LIMIT BREACH` if you cannot hold the line count.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ nav geometry with file+line, the three runs with their provenance, the viewport arithmetic, both gate diagnostic defects, the existing footer clearance, the CI gap, and every command |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R11 → AC1–AC11 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus R8's D28/D34 mechanism preservation; 724/724R's uncommitted diff fenced as read-only |
| **No number is asserted that was not measured with the real tool** | ✅ 56px / `z-index: 30` / `position: fixed` read from `MobileBottomNavView.module.css:51-64` · viewport heights from `check-click-shield.mjs:75-79` · 221/9 and 208/4 from the two gate transcripts · 3-of-36 from 723's baseline · the CTA's (16,782) 358×44 from `I3-click-shield-after.log` · the 788–844 band derived from those, and R1 re-verifies it |
| **A claim that could NOT be measured is marked as such** | ✅ §3.6 is labelled a hypothesis and A1 forbids pre-deciding it; A2 states headless understates the safe-area footprint; §3.7 leaves `FavoriteButton` open with an `unknown` arm in AC4 |
| **A prior task's summary was checked, not inherited** | ✅ §3.1 re-reads the nav geometry from source rather than repeating 723's §7 description of it; §3.4 explains why 724's `[object SVGAnimatedString]` interceptor is a printing defect, not an anonymous element; §6 marks 723's numbers as an index |
| The gate proves the changed behavior, not merely procedure | ✅ R3's 0-interception hard gate on a real production build, R7's planted round trip, R1's instrumented measurement, R5's before/after output pair |
| No new blind spot is created silently | ✅ §5.1 forbids a gate exemption for the nav; R2 forbids an element-specific fix; R6 forces the CI gap into the record instead of leaving it implied |
| Zero/empty input covered | ✅ A3 voids an empty-candidate run; AC4 has an explicit `unknown` arm; AC5 has a stated-deferral arm; AC8 has an untouched arm; R9 has a "no strings changed" arm |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + K1's baseline-before-fix + K2's measure-before-K3 + four stop-and-report branches |
| Ordering/dependency stated | ✅ 723 must land first (**D32**, A5); K1 precedes K2 precedes K3; K9 genuinely last; 724/724R run in parallel on a different sprint and are fenced |
| Owner exceptions have traceable authorization | ✅ owner 2026-08-07 (split this out of 724's R2 and opened Sprint 54) · Task 713 / D28 / D34 for the nav's mechanism · D6 for the evidence dir |
| Exactly one active executable route | ✅ A1 makes the root cause R1's output rather than a fork; §5.1 closes four alternatives; A4/A5 and the harness branch convert the rest into stop conditions |
| Prior-review corrections folded in | ✅ 724 F5 → R4's mandatory element-count reconciliation with an `unknown` arm · 724 F7 → R11's "correct composition" wording · 724's AC6 contradiction → R6 reports the CI gap rather than requiring this task to close it · 711 F2 → requirement 5 |
| Sprint assigned before creation | ✅ Sprint 54, opened with its own plan file before this kickoff was written, with the five-sprint fit check recorded there |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none to start.** Two may arise mid-task and each is a stop: a fix whose blast
radius extends beyond the homepage in a way that needs a product call (A4), and a missing 723 comparator (A5).

---

## 16. Scope correction — owner decision 2026-08-07 (supersedes R2/R3/R5 and §7/§8)

**Status of the first round: the `BLOCKED` return was correct and is accepted.** R1, R4, R6, R8, R9 and R10 are
complete and verified at review; their evidence stands and is **not** re-run. Only the remedy changes.

### 16.1 §3.6's hypothesis is REFUTED — measured, not argued

R1 (`.screenshots/task725-evidence/K2-instrumented-measurement.json`) settles it, and the answer is not the one
§3.6 guessed:

| Measured | Value |
|---|---|
| Blocked element | `FeaturedListingsView` header "View all", document y **782–826** |
| Nav band | `position: fixed`, z-index 30, y **788–844** |
| Viewport height | **844** (mobile-390 only; 320/375 are 812 and never render it in-viewport at all) |
| `documentScrollHeight` | **4149** |
| `scrollY` at measurement | **0** |

Two consequences the kickoff did not anticipate:

1. **The element is not occluded — it is transiently overlapped.** Maximum scroll is `4149 − 844 = 3305px`. The
   element clears the nav band once `scrollY > 38`. It is unreachable across roughly **38 of 3305 scroll
   positions (~1.1%)** and reachable across the rest. `check-click-shield.mjs` hit-tests only at `scrollY = 0`
   and cannot tell those two states apart.
2. **The trailing-edge case — the one that *is* permanent — is already solved.** `FooterView.module.css:35`
   reserves `padding-bottom: var(--space-14)`, and `MobileBottomNavView.module.css`'s A5 note records that the
   bar height is `56px == --space-14`, consumed by both sides. Content at the document end cannot be stuck under
   the nav. §3.6 called the footer's padding "a local patch mistaken for the general one"; it is in fact the
   correct and sufficient guard for the only class of collision a user cannot escape.

**Therefore a layout remedy would be treating a gate defect as a product defect.** A `position: fixed` bottom nav
overlays whatever occupies the bottom of the viewport at every scroll position — that is the pattern working as
designed. Moving content merely changes *which* element lands in the band at `scrollY = 0`, and re-opens on the
next layout change or viewport height.

### 16.2 Owner decision

Presented as three options 2026-08-07 (targeted homepage spacing · sitewide app-shell restructure · gate fix).
**Owner selected the gate fix.** Neither production-layout route is authorized. `page.tsx`,
`FeaturedListingsView.tsx`, `MobileBottomNavView.*`, `FooterView.module.css`, `layout.tsx` and `globals.css` are
now **zero-diff** for this task.

Precedent for the disposition: `check-stories-rendered.mjs` already classifies the analogous case as
`ambiguous-offscreen` — *"element reachable by horizontal scrolling (carousel/scroll-tabs)"* — an AMBIGUOUS
needs-owner-decision, not a FAIL. This task extends the same distinction to vertical scrolling.

### 16.3 Superseding requirements

| ID | Supersedes | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| **R2a** | R2 | **The gate distinguishes transient overlap from permanent occlusion.** When a candidate fails the hit-test at the current scroll position, the gate must determine whether *any* reachable scroll offset clears it of all `position: fixed`/`sticky` chrome, and re-hit-test there. `FAIL` only when no reachable offset clears it. A cleared candidate is reported as `PASS` or as an explicit non-failing diagnostic class — never silently dropped from `checked`. | P0 | AC2a |
| **R2b** | — | **The condition is computed, never declared.** It must derive from measured DOM (computed `position` of ancestors, real rects, real scroll extent). A component allowlist, a story/route id list, or any attribute an author hand-applies to opt out is **forbidden** — Task 724 F1 is the precedent, and its test applies verbatim: *if a developer could make a future failing control pass by adding an attribute to its container, it is an opt-out, not a rule.* | P0 | AC2b |
| **R3a** | R3 | Final `check:click-shield` against a real production build: **0 FAIL**, `Empty-candidate cells: 0`, before/after summary lines quoted verbatim. The 4 mobile-390 "View all" cells must resolve as **transient/cleared**, with the clearing scroll offset stated. | P0 | AC3a |
| **R5a** | R5 | **Both §3.4 diagnostic defects are now fixed here, not deferred** — the file is in scope regardless. SVG `className` via `el.getAttribute('class')`; report the nearest positioned ancestor's rect alongside the raw interceptor's. Show a before/after output pair on the same real interception. | P1 | AC5a |
| **R12** | new | **Planted proof, three arms, D32/Q4.** ① Plant a genuinely permanent occlusion — e.g. temporarily remove `FooterView.module.css`'s `padding-bottom` so trailing content sits under the nav at maximum scroll — and show the gate still **FAILs**. ② Show the transient "View all" case **passes** under the same build. ③ `npm run check:click-shield:verify` still exits 0 (its synthetic fixed shield is unscrollable and must stay caught). Revert every plant and prove it by hash. | P0 | AC12 |

R1, R4, R6, R7, R8, R9, R10, R11 stand unchanged. R7 is now partly subsumed by R12③ but is still reported.

### 16.4 Revised scope

**In scope:** `scripts/check-click-shield.mjs` · `docs/storybook-governance.md` (record the transient-vs-permanent
rule and its reasoning) · `docs/backlog.md` · the session log.

**Out of scope — zero diff:** everything in §8, **plus** `src/app/[locale]/layout.tsx` · `src/app/globals.css` ·
`src/app/[locale]/page.tsx` · `src/modules/listings/components/FeaturedListingsView.tsx` ·
`src/components/layout/MobileBottomNavView.*` · `src/components/layout/FooterView.module.css`. Verify by hash.

### 16.5 Acceptance criteria for the superseding requirements

- **AC2a** The clearing logic is quoted in full, evaluated from measured DOM, and documented in
  `docs/storybook-governance.md` with its reasoning.
- **AC2b** `grep` the final diff: no component name, story id, route path or opt-out attribute appears in the
  condition. State the §4-style opt-out test and its result explicitly.
- **AC3a** Final transcript quoted; the 4 mobile-390 cells named with their clearing offset.
- **AC5a** Before/after pair on a real interception, showing a readable SVG class and the nav's own rect.
- **AC12** Three transcripts. Arm ① **must fail** — a plant that does not fail proves nothing.

### 16.6 Standing note for the orchestrator's own record

§3.6 was an orchestrator hypothesis that measurement refuted, and A1 existed precisely so the executor would test
it rather than implement it. That worked. The residual lesson is narrower and worth carrying: **a hit-test gate
that samples one scroll position measures reachability at that position, not reachability.** Task 723 built the
gate correctly for the defect it was chasing — a full-viewport shield, where scroll position is irrelevant — and
the limitation only became visible when the same gate was pointed at fixed chrome.
