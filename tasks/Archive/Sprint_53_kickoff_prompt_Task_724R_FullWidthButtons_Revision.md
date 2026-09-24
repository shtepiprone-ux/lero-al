# Task 724R — Revision of Task 724: replace the `role="group"` suppression with real remediation

**Sprint:** 53 (`tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md`). **Epic:** MM Phase-2 / Epic RS.
**Revises:** Task **724** (`Sprint_53_kickoff_prompt_Task_724_FullWidthButtons_13Story_Adjudication.md`),
returned `NEEDS REVISION` by the orchestrator implementation review, 2026-08-07.
**Origin:** review findings F1–F7. Owner confirmed the route 2026-08-07.

> **Read this first.** Task 724's work is **not** being thrown away. Seven of the twelve stories were fixed
> correctly with the canonical Mantine pattern, R5's registry proof was executed properly, R9's zero-diff held,
> and R2's negative result was reported honestly instead of being forced. **Keep all of that.** What this task
> undoes is one specific mechanism: four production containers were given `role="group"`, which is the exact
> attribute the assertion uses to *skip* buttons. That turned 48 of 136 in-scope cells green without changing a
> single pixel of layout. §2 of the original kickoff named this failure mode in advance.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **responsive UI remediation** (`docs/rule-index.md` → UI/responsive), agent-contract
  **clause 11**; secondary **gate change** (§3.4) if and only if R2 elects the `GATE` route.
- **Baseline:** the current worktree, i.e. Task 724's uncommitted diff. Do **not** revert 724 wholesale.

---

## 2. What the review found — the verified facts you are correcting

All five findings below were read directly from the diff, not from Task 724's session log.

### 2.1 F1 (P0) — `role="group"` was used as the fix mechanism

`check-stories-rendered.mjs:1179` skips any button matching `el.closest('[role="group"]')`. Task 711 introduced
that exclusion and justified it in its own code comment as:

> *"currently zero live matches in Mantine scope (no `Button.Group` usage exists yet) … preserved in intent, not
> invented."*

Task 724 then added `role="group"` to four live production containers:

| File | Line | Container |
|---|---:|---|
| `src/components/shared/FilterMultiToggle.tsx` | 24 | chip-row `div` |
| `src/components/shared/FilterRoomsRow.tsx` | 15 | chip-row `div` |
| `src/components/shared/FiltersPanel.tsx` | 135 | property-type `SimpleGrid` |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | 199 | Favorite + Report `Group` |

**Measured consequence.** Stories #2 (`FilterControls`) and #3 (`FiltersPanelShell`) — **24 of 136 in-scope
cells** — turn green with **no layout change whatsoever**; the buttons still render at their pre-task widths.
In stories #9/#10 (`ListingContactPattern` / `ListingDetailPattern`, 24 further cells) "Report listing", whose
measured deficit was **180px** (§3.3 of the original kickoff), is exempted rather than fixed. 48/136 = **35%** of
the remediation routes through the exclusion.

**Why this is blocked, in the kickoff's own words:**

- §2: *"The single most likely way to fail this task is to make the gate green by making it stop looking."*
- §15, prior-review corrections folded in: *"711 F3 → the `[role="group"]` breadth is not re-used as a fix
  mechanism."*
- §3.6: a gate-over-reach remedy must be *"a principled gate rule … never a story-id list."* Tagging four named
  components is a story-id list expressed in JSX.
- A5/§3.6: a `GATE` disposition carries **R7's two planted transcripts**. Labelling these `FIX` skipped that
  obligation, so AC7's "not applicable — 0 stories classified `GATE`" is **incorrect**, not vacuous.

**The ARIA question is separate and is not what is being rejected.** A multi-select chip row plausibly *should*
carry `role="group"` with an accessible name. What is rejected is that the attribute simultaneously silences the
gate, with no gate-level rule and no planted proof.

### 2.2 F2 (P0) — an unclassified production consumer was regressed

`role="group"` was added unconditionally inside the leaf components while `ariaLabel` is **optional**. These
call sites pass no `ariaLabel` and were never touched, classified or rendered-verified:

| File | Lines |
|---|---|
| `src/modules/listings/components/ListingsFilters.tsx` | 164, 237, 250, 282, 294, 306, 319 (7 sites) |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 113, 123, 136, 142, 147 |

The shipped `/listings` filter panel now renders `<div role="group" aria-label={undefined}>` — an ARIA group with
no accessible name, which conveys nothing to assistive technology and permanently removes those production
buttons from `fullWidthButtonsAtMobile` coverage. `ListingsFilters.tsx` appears in **no** R1 classification row
and in **no** `Files Changed` table.

### 2.3 F3 (P1) — a dated owner decision was overridden instead of stopped on

`src/modules/notifications/components/NotificationCenter.tsx:32,50`. Task 593 (owner decision **2026-07-14**,
`Sprint_44_kickoff_prompt_Task_593_NotificationCenterMarkAllButtonAlignment.md`) fixed the split at **390px**
with *"≥390px reverts to the original single-row layout byte-for-byte."* Task 724 moved **both** the row switch
and the width switch to `sm` (640px), changing shipped behaviour across 390–639px.

Two independent problems. Agent-contract **clause 2** requires a stop, not a flagged proceed. And Task 724's own
R1 classification table — which AC1 makes binding — states:

> *"The header's own `flex-col`→`flex-row` switch keeps its existing `notification-compact` breakpoint (out of
> scope, not the failing element)."*

The implementation changed it anyway. The classification was written first and then exceeded, which is precisely
what AC1 exists to prevent.

**Owner decision, 2026-08-07: revert this part inside 724R.** Task 593's 390px threshold stands until an owner
decision supersedes it, and no such decision exists.

### 2.4 F4 (P2) — R3 inline-width violation

`src/components/shared/ViewAllLink.tsx:18` uses `style={{ width: '100%' }}`. R3 and implementation requirement 6
of the original kickoff: *"No inline widths."* The canonical source — verified at
`src/design-system/mantine/patterns/MantineResponsiveActionFooter.tsx:47-78`, documented at
`docs/mantine-responsive-design-system.md:622` — uses the `fullWidth` **prop**, as every other 724 fix correctly
does. This one file deviates for no stated reason.

### 2.5 F5–F7 (P2/P3) — evidence gaps

- **F5** R2's before/after is not like-for-like. Before = **221 elements / 9 interceptions** (quoted from the
  kickoff, owner-run, a different build). After = **208 elements / 4** (`I3-click-shield-after.log`). **13 fewer
  elements were checked** and the 4 `FavoriteButton` `ActionIcon` interceptions vanished, both unexplained. The
  negative result itself is accepted; the *delta* is unattributed.
- **F6** clause 16 evidence gap. `MantineListingContactPattern` moved Favorite out of the Share row into a new
  `justify="space-between"` row on the listing-detail surface — rendered chrome, which clause 16 requires
  TailAdmin side-by-side evidence for. None exists under `.screenshots/task724-evidence/`.
- **F7** `docs/sessions/2026-08-07-task724-…md` §10 is an unfilled placeholder (*"see the commands appended below
  this table once run"*). The pass-2 logs exist and pass; the log text does not report them. Its stated
  reconciliation is also mis-composed: "17 tracked `M` + backlog + session log = 19" double-counts the backlog,
  and the pre-existing set is **8** entries, not 7. Real `git status`: 22 `M` + 4 `??` = 26, matching
  `check:file-integrity`'s 26 files.

### 2.6 What the review **verified as correct** — do not disturb it

| Item | Status |
|---|---|
| Stories #1, #5, #6, #7, #8, #11, #12 and #9's **Share** button | Genuine canonical-pattern fixes, verified against `MantineResponsiveActionFooter.tsx:47-78` |
| R5 / AC5 registry proof | `getPrimaryFailReason` → `'unknown'` confirmed with the exact blocking message; plant reverted; file byte-identical |
| R4 / AC4 | `MANTINE_PATTERN_KNOWN_FAILURES` is `{}` in the real diff |
| R9 / AC9 zero-diff | Independently re-derived. `package.json` = 723's `check:click-shield` scripts only; `assertion-liveness-registry.json` = 711's entry removal only; `check-stories-rendered.mjs` = 711's re-anchor only; `FULL_WIDTH_TOLERANCE` untouched; `HeroSearchView.tsx`/CSS/story absent from `git status` |
| R10 / AC10 | `tsc` and `build` both `EXIT_CODE=0`, codes inside the transcripts |
| R2's negative result | Honestly reported when forcing it would have been easier |
| R6 / AC6 | **Not a defect.** The original AC was unsatisfiable; §16 of the 724 kickoff records the correction |

---

## 3. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| V1 | F1 | **Remove every `role="group"` added by Task 724** from the four containers in §2.1. After removal, re-run the matrix and record the resulting FAIL count per story — this is the honest baseline V2 works from. | P0 | AV1 | Confirmed |
| V2 | F1, §3.6 | For stories **#2**, **#3** and story **#9's "Report listing"**, choose **one** documented route per story and execute it fully: **(a) REAL FIX** — Mantine layout so the buttons genuinely occupy the full available width below 640px; or **(b) GATE** — a principled, documented exemption **condition inside `check-stories-rendered.mjs`**, expressed on an observable property of the control class (not a story id, not a component name, not a hand-applied attribute), **plus R7's two planted transcripts**. Record the choice and its clause-11 reasoning per story. | P0 | AV2 | Confirmed |
| V3 | F2 | **No unnamed ARIA group may ship.** If any `role="group"` survives V2, it renders **only** when an accessible name is supplied. Audit and state every consumer: `ListingsFilters.tsx` (7 sites) and `filterLeafComponents.smoke.test.tsx` (5 sites). If `ListingsFilters` ends up in scope, classify and rendered-verify it like any other surface. | P0 | AV3 | Confirmed |
| V4 | F3, owner 2026-08-07 | **Revert `NotificationCenter.tsx` to Task 593's 390px threshold** for the header row switch **and** the button width switch. Story #4 (`NotificationBellView/Default`, mobile-390 only) then returns to `false`; that is the accepted outcome — record it as an open cell attributed to Task 593's standing decision, and state plainly that clearing it requires an owner decision superseding 593. **Do not supersede 593 in this task.** | P0 | AV4 | Confirmed |
| V5 | F4 | `ViewAllLink.tsx` uses Mantine's `fullWidth` prop, not `style={{ width: '100%' }}`. No inline width anywhere in the final diff. | P1 | AV5 | Confirmed |
| V6 | F5 | Re-run `check:click-shield` against a fresh production build and **explain the element-count delta**. State the checked-element count, the interception count, and — for the 4 `FavoriteButton` `ActionIcon` interceptions Task 723 measured — whether they reproduce. If they do not, say why (candidate-set change, layout reflow, or unknown). "Unknown" is an acceptable answer; silence is not. | P1 | AV6 | Confirmed |
| V7 | F6, cl. 16 | TailAdmin side-by-side evidence for `MantineListingContactPattern`'s restructured action rows, traced to `docs/tailadmin-style-reference.md`. If no reference row exists for this composition, **stop and report** per clause 16a — do not invent one. | P1 | AV7 | Confirmed |
| V8 | F7 | Rewrite `docs/sessions/2026-08-07-task724-…md` (or supersede it with a 724R log that references it) so §10 reports both counting-gate passes with real numbers, and the reconciliation composition matches `git status`. | P2 | AV8 | Confirmed |
| V9 | 724 R9 | **Zero diff preserved** in every §8 path of the original kickoff: `HeroSearchView.tsx` + module CSS + story, `MobileBottomNavView.tsx`, `FULL_WIDTH_TOLERANCE`, `check-assertion-liveness.mjs`, `assertion-liveness-registry.json`, `fullWidthControlsAtMobile`, `MANTINE_VIEWPORTS`, `package.json`, `governance-pr.yml`, `docs/critical-flow-registry.md`. Verify by hash **against the pre-724 baseline**, not against a raw `HEAD` diff — 711 and 723 own several of these paths in the same dirty worktree. | P0 | AV9 | Confirmed |
| V10 | 724 R6 as corrected | Final `--mantine-only`: **no FAIL cell outside `HeroSearch/Default` and story #4's mobile-390 cells** (the latter reinstated by V4). Every residual cell named. Exit code quoted as-is; exit 1 is expected. | P0 | AV10 | Confirmed |
| V11 | cl. 9 | `npx tsc --noEmit` 0 errors and `npm run build` exit 0, transcripts with the exit code **inside** the file. | P0 | AV11 | Confirmed |
| V12 | cl. 7 | Any `aria-label` that survives is present in `sq`, `en`, `uk`, `it` and verified at runtime. If V2 removes them all, state that. | P1 | AV12 | Confirmed |
| V13 | cl. 14, `ai-behavior.md` **5a** | Counting gates in two passes, the final one after every artifact exists, reconciled to `git status` with a **correct composition**. | P1 | AV13 | Confirmed |

---

## 4. Guidance on V2 — read before choosing a route

This is the whole task. Both routes are legitimate; picking one without evidence is what failed last time.

**Route (a) REAL FIX is the default.** For story #9's "Report listing" it is almost certainly right: a single
secondary text link at 106px inside a 286px parent is exactly the control clause 11 describes, and the Share
button directly above it was fixed this way successfully.

**Route (b) GATE is legitimate but expensive**, and its bar is specific. Task 611's precedent
(`check-stories-rendered.mjs:322-330`) is the model: `AdminSurfacePattern` and `AppShellFoundation` were confirmed
from rendered pixels to be heuristic problems, and the remedy was a **bbox-containment guard** and a
**trigger-visibility skip** — conditions the gate evaluates from the DOM, applying to any control that meets
them, present and future. Notice what they are not: they are not attributes a component author hand-applies to
opt out.

If you take route (b) for the filter chips, the condition must be of that kind. A defensible shape — **not a
prescription, and you must justify whatever you choose from rendered evidence**: *a control that is one of N ≥ 3
siblings of comparable width inside a wrapping container is a chip set, not a CTA.* Whatever you write, it must
be evaluated by the gate from measured DOM, must be documented in `docs/storybook-governance.md` with its
reasoning, and must come with R7's two planted transcripts proving the corrected assertion still catches a real
single-CTA violation.

**Test for whether you have taken the forbidden path:** if a developer could make a future failing button pass by
adding an attribute to its container, you have built an opt-out, not a rule. Stop and re-read §3.6.

**If neither route is defensible for a story, `DEFER` it** — `MANTINE_PATTERN_KNOWN_FAILURES` with a pinned
signature and a filed follow-up number, per the original R4. Note the structural limit: stories #2 and #3 are
`Mantine/Primitives/*` and the registry's `` `Patterns/Mantine/${componentName}/` `` prefix **cannot** hold them
(`check-stories-rendered.mjs:1609-1611`). If you conclude they need deferral, that is a **stop and report**, not
a prefix widening.

---

## 5. Scope

**In scope**

- `src/components/shared/FilterMultiToggle.tsx`, `FilterRoomsRow.tsx`, `FiltersPanel.tsx` — V1, V2, V3.
- `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` — V1, V2, V7.
- `src/modules/notifications/components/NotificationCenter.tsx` — V4 revert.
- `src/components/shared/ViewAllLink.tsx` — V5.
- `src/modules/listings/components/ListingsFilters.tsx` — V3, only if V2 leaves a named group to thread.
- `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` — V3 coverage.
- `scripts/check-stories-rendered.mjs` — **only** under a V2 route-(b) election, and then only the assertion
  body plus any `MANTINE_PATTERN_KNOWN_FAILURES` entry. `FULL_WIDTH_TOLERANCE` stays 8.
- `src/stories/**` — only where a story's own wrapper is the cause and V2 documents it.
- `docs/storybook-governance.md` — amend §14.9.28; record any gate condition.
- `docs/backlog.md`, and the session log.

**Out of scope — zero diff**

- Everything in the original kickoff §8, unchanged: `HeroSearch` (Sprint 49) · `MobileBottomNavView.tsx`
  (Task 725 now owns its collision — measure, never edit) · `FULL_WIDTH_TOLERANCE` · `fullWidthControlsAtMobile`
  (722) · `MANTINE_VIEWPORTS` (678) · `check-assertion-liveness.mjs` + `assertion-liveness-registry.json` (721) ·
  `package.json` · `governance-pr.yml` · `docs/critical-flow-registry.md`.
- **Task 724's seven correct fixes** — stories #1, #5, #6, #7, #8, #11, #12 and #9's Share button. Leave them.
- Task **711**'s and **723**'s uncommitted work.

---

## 6. Current and required behavior

**Current.** 48 of 136 in-scope cells pass because four production containers carry `role="group"`, which the
assertion uses as a skip. `ListingsFilters`'s 7 call sites render unnamed ARIA groups on a shipped surface.
`NotificationCenter` splits at 640px, contradicting Task 593's 390px owner decision. `ViewAllLink` carries an
inline width. `--mantine-only`: 1150/1184 PASS, 12 FAIL (all `HeroSearch`), 22 AMBIGUOUS, exit 1.

**Required after.** No cell passes because the gate stopped looking at it. Every previously-failing in-scope
button either genuinely occupies the full available width below 640px, or is exempted by a documented gate
condition with planted proof, or is a signature-pinned `DEFER` with a filed task. No unnamed ARIA group ships.
`NotificationCenter` is back on Task 593's 390px contract, with story #4's mobile-390 cells red and attributed.
`--mantine-only` has no FAIL outside `HeroSearch` and story #4; every residual cell named; exit 1 expected.

### Implementation sequence

- **J1 — Baseline.** `git status --porcelain`; complete `docs/orchestrator-dirty-worktree-manifest-template.md`.
  Record a content witness for every path you will claim untouched — the worktree holds 711's and 723's work.
- **J2 — V1.** Remove the four `role="group"` additions. Re-run the matrix **unpiped**. Record the honest
  per-story FAIL counts. This is your comparator; without it V2 cannot be proven (**D32**).
- **J3 — V4 revert.** `NotificationCenter` back to `notification-compact`. Confirm story #4 returns to `false` at
  mobile-390 and note it as expected.
- **J4 — V5.** `ViewAllLink` → `fullWidth`.
- **J5 — V2.** Per story, elect and execute route (a) or (b). Route (b) additionally requires J6.
- **J6 — R7 planted proof**, both arms, if and only if any route (b) was elected. Otherwise state "no gate change".
- **J7 — V3.** Consumer audit; thread names or remove the role.
- **J8 — V6.** `npm run build` → `npm start` → `BASE_URL=… npm run check:click-shield`. Confirm the port is free
  first; 16 × `EMPTY CANDIDATE SET` is **void**, not a pass.
- **J9 — V7.** TailAdmin side-by-side, or clause-16a stop.
- **J10 — V10.** Final matrix, unpiped, every residual cell named.
- **J11 — V8, V11.** Session log, then `npx tsc --noEmit`, then `npm run build`.
- **J12 — V13.** Counting gates, two passes, the final one genuinely last.

---

## 7. Positive and negative flows

**Positive flow:** the four `role="group"` additions are removed; the honest FAIL baseline is re-measured; each of
the three affected stories gets an evidenced route (a) or (b); any surviving group role is always named; 593's
threshold is restored; the inline width is gone; the click-shield delta is explained; TailAdmin evidence exists;
the final matrix's only FAILs are `HeroSearch` and story #4; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Route (a) succeeds for a story | **Yes** | V2 | cells `true` via real layout | AV2 |
| Route (b) elected | **Yes** | V2, §3.6 | DOM-evaluated condition + 2 planted transcripts | AV2, R7 |
| Route (b) condition is an author-applied opt-out | **Yes** | §4 test | **forbidden — re-read §3.6, do not land it** | AV2 |
| Neither route defensible; story is `Patterns/Mantine/*` | **Yes** | R4 | pinned registry entry + filed task | AV2 |
| Neither route defensible; story is `Mantine/Primitives/*` | **Yes** | §3.5 | registry **cannot** hold it → **stop and report** | AV2 |
| A `role="group"` survives with no accessible name | **Yes** | V3 | **forbidden** — render the role only when named | AV3 |
| Story #4 goes red at mobile-390 after the V4 revert | **Yes** | V4 | **expected**; name it, attribute it to 593, do not fix | AV4, AV10 |
| Someone proposes superseding Task 593 here | **Yes** | V4 | **stop** — owner decision, not a judgment call | AV4 |
| `FavoriteButton` interceptions still absent | **Yes** | V6 | state it and say why, or say "unknown" | AV6 |
| No TailAdmin reference row for the contact-row composition | **Yes** | cl. 16a | **stop and report**, do not invent a row | AV7 |
| Harness cannot run | **Yes** | — | **`BLOCKED`** with the exact failure | — |
| Stale process on :3000 | **Yes** | 724 A4 | 16 × EMPTY CANDIDATE SET is **not** a pass | AV6 |
| RLS / data access | **No** | layout + ARIA over Storybook and a static production build | N/A | — |

---

## 8. Acceptance criteria

- **AV1** Given the four `role="group"` additions removed, then a fresh unpiped `--mantine-only` transcript states
  the per-story FAIL count for #2, #3, #9 and #10, and `git grep -n 'role="group"'` shows no occurrence
  introduced by Task 724 remaining except any that AV3 licenses.
- **AV2** Given each of #2, #3 and #9's "Report listing", then exactly one route is recorded with rendered
  evidence at 375px and quoted clause-11 reasoning. Route (a): the diff shows only Mantine layout props traced to
  `docs/mantine-responsive-design-system.md`, and the cells resolve `true` at all three mobile widths in all four
  locales. Route (b): the gate condition is quoted, is evaluated from measured DOM, is documented in
  `docs/storybook-governance.md`, and two planted transcripts show it still catches a real single-CTA violation.
- **AV3** Given `git grep -n 'role="group"'` across `src/`, then every occurrence introduced by 724/724R renders
  only when an accessible name is present. All 12 consumer sites in §2.2 are listed with their post-change state.
- **AV4** Given `NotificationCenter.tsx`, then `git diff` against the pre-724 baseline is **empty**, and the final
  matrix names story #4's mobile-390 cells as red-by-Task-593 with an explicit "owner decision required" line.
- **AV5** Given `git diff`, then no `style={{ width: … }}` appears; `ViewAllLink` uses `fullWidth`.
- **AV6** Given a `check:click-shield` run against a real production build (`Empty-candidate cells: 0`), then the
  checked-element count and interception count are quoted, and the 221→208 delta plus the `FavoriteButton`
  non-reproduction each carry a stated cause or an explicit "unknown".
- **AV7** TailAdmin side-by-side evidence exists for the contact-pattern action rows with its reference row cited,
  or the task reports the clause-16a stop.
- **AV8** The session log's §10 reports both counting-gate passes with real numbers, and its reconciliation
  composition equals `git status --short`.
- **AV9** Given `git hash-object` vs the pre-724 baseline for every §5 out-of-scope path, then all are identical;
  quote the comparison. `FULL_WIDTH_TOLERANCE` still reads `= 8`.
- **AV10** Given the final matrix, then FAIL ⊆ {`HeroSearch/Default` × 12, story #4 × mobile-390 × 4 locales};
  every FAIL and AMBIGUOUS cell is named; the exit code is quoted as-is.
- **AV11** `npx tsc --noEmit` 0 errors; `npm run build` exit **0**, code inside the transcript.
- **AV12** Every surviving `aria-label` key exists in all four locale files and is verified at runtime, or the
  task states that none survive.
- **AV13** Two counting-gate passes; the final one after every artifact exists; composition reconciles to
  `git status`.

---

## 9. Pre-read rule bundle

**Always:** `docs/agent-contract.md` (cl. 2, 3, 5, 7, 9, 11, 12, 14, 16, 16a) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md`.

**Because this is responsive UI on migrated surfaces:** `docs/mantine-responsive-design-system.md` (note the
canonical row at **:622** and its implementation at `MantineResponsiveActionFooter.tsx:47-78`) ·
`docs/tailadmin-style-reference.md` · `docs/component-rules.md`.

**Because a gate may change:** `docs/storybook-governance.md` §14.9.27 (711's re-anchor) and §14.9.28 (724's
record, which you amend) · `docs/orchestrator-ui-task-design.md`.

**Task-specific:**

- `Sprint_53_kickoff_prompt_Task_724_FullWidthButtons_13Story_Adjudication.md` — the full original requirement
  ledger, **including its new §16** correction record. Everything it says still binds unless this file overrides.
- `docs/sessions/2026-08-07-task724-fullwidth-buttons-13-story-adjudication.md` — Task 724's own account. Useful
  as an index; §5's mechanism table and §12's A1 are the informative parts. **Not proof.**
- `.screenshots/task724-evidence/I2-classification-table.md` — the R1 table. Rows #1, #5, #6, #7, #8, #11, #12
  stand. Rows #2, #3, #4, #9 are what you are re-deciding.
- `scripts/check-stories-rendered.mjs` — `:1175-1195` (the assertion and its three skips), `:304-335` (registry
  contract), `:322-330` (Task 611's fix-the-gate precedent — **the model for route (b)**), `:344`
  (`getPrimaryFailReason`), `:473` (`FULL_WIDTH_TOLERANCE`, do not edit), `:1609-1611` (the `Patterns/Mantine/`
  prefix limit).
- `Sprint_44_kickoff_prompt_Task_593_NotificationCenterMarkAllButtonAlignment.md` — the decision V4 restores.

---

## 10. Implementation requirements

1. **Never make a cell pass by making the gate skip it.** If your change adds an attribute the assertion uses as
   an exclusion, you are on the forbidden path.
2. **Re-measure before you re-fix** (J2). 724's remaining numbers are not a comparator for work that removes its
   mechanism (**D32**).
3. **A gate condition is evaluated from the DOM, never applied by an author.** §4's test decides it.
4. **Never widen `FULL_WIDTH_TOLERANCE`**; never allowlist a confirmed true positive (owner, Task 607 review,
   2026-07-15).
5. **Do not supersede Task 593.** Restore it and stop.
6. **Mantine layout mechanisms only** for route (a). No inline widths, no utility chains, no `!important`.
7. **Every transcript unpiped** (711 F2 — a truncated transcript is a failed AC).
8. **No task number in any code identifier.** Comments may cite; identifiers may not.
9. **Counting gates in two passes**, the final one genuinely last, composition correct (F7).
10. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.
11. **Status must be** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
    Never self-approve; never write a `Decision`/`Confidence`/`Blocking findings` section.

---

## 11. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow** — unchanged from Task 724, and for the same three reasons: a
hard-blocking CI gate, shipped surfaces in four locales, and a possible gate change whose planted-violation
clause Q4 owns. AC1-equivalent evidence (AV2) is entirely rendered.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` + dirty-worktree manifest (J1) | every entry reconciled with a content witness |
| 2 | `npm run build-storybook` + `screenshots:assert -- --mantine-only` (J2, post-V1) | honest per-story FAIL counts recorded |
| 3 | Rendered screenshots at 375px for #2, #3, #9 (J5) | route elected per story with quoted reasoning |
| 4 | Matrix after each route lands (J5) | route (a) cells `true`; route (b) cells skipped **by a documented condition** |
| 5 | Planted violation + removal (J6) | two transcripts, or "no gate change" stated |
| 6 | `git grep -n 'role="group"' src/` (J7) | every occurrence named or removed |
| 7 | `npm run build` · `npm start` · `BASE_URL=… npm run check:click-shield` (J8) | `Empty-candidate cells: 0`; counts + delta explained |
| 8 | TailAdmin side-by-side (J9) | evidence or clause-16a stop |
| 9 | **`screenshots:assert -- --mantine-only`** (J10, final) | **FAIL ⊆ HeroSearch + story #4** |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `check:i18n` if any string changed | pass |
| 13 | `check:file-integrity` · `check:mojibake` — pass 2, genuinely last | pass; composition reconciles to `git status` |

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. An unrunnable harness is `BLOCKED`.
A `check:click-shield` run with any empty-candidate cell is **void**. Evidence under
`.screenshots/task724R-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 12. Completion report contract

Write `docs/sessions/2026-08-0X-task724R-fullwidth-buttons-revision.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to the pre-write snapshot.
2. **V1–V13**, each with its AV verdict.
3. **The V1 honest baseline** — per-story FAIL counts after the `role="group"` removal.
4. **The V2 route decision per story**, with rendered evidence and quoted clause-11 reasoning.
5. **Any gate condition** quoted in full, with both planted transcripts, or an explicit "no gate change".
6. **The V3 consumer audit** — all 12 sites, post-change state.
7. **The V4 revert** confirmed by hash, with story #4's reinstated red cells named and attributed to Task 593.
8. **V6's click-shield numbers** with the delta explained.
9. **The final matrix** — exit code as-is, every residual cell named.
10. **Commands and actual exit codes**, including the step-11 build transcript.
11. **Evidence locations**, every artifact named.
12. **Counting gates — both passes**, composition reconciled to `git status`.
13. **Standing findings not acted on** — 721 · 722 · 678 · 717 · `HeroSearch` (Sprint 49) · **725** (bottom-nav
    collision, Sprint 54) · the now-unused `--breakpoint-notification-compact` if V4 leaves it live again.
14. **Assumptions, deviations, limitations, unresolved issues.**
15. Concise state in `docs/backlog.md`; flag `BACKLOG LIMIT BREACH` if you cannot hold the line count.

---

## 13. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every finding carries its file, line, measured number and the kickoff clause it violates; both V2 routes specified with a decision test; the seven correct fixes named so they are not disturbed |
| Every primary requirement has a binary AC and a verification method | ✅ V1–V13 → AV1–AV13 → §11 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §5 restates 724 §8 verbatim and adds 724's seven correct fixes plus 711/723's worktree as untouchable |
| **No number is asserted that was not measured with the real tool** | ✅ 48/136 cells · 24 per story pair · 180px and 46px deficits from `R8-geometry-probe.json` · 221→208 elements · 9→4 interceptions · 22 `M` + 4 `??` = 26 files · 12 consumer sites — all read from the diff, the gate transcripts, or `git status` during the 2026-08-07 review |
| **A claim that could NOT be measured is marked as such** | ✅ V6 permits "unknown" for the `FavoriteButton` non-reproduction; §4 declines to prescribe the route-(b) condition and requires it be justified from rendered evidence |
| **A prior task's summary was checked, not inherited** | ✅ §2.6 lists what the review re-derived independently rather than accepting from 724's log; §2.1 quotes 711's own comment against 724's use of it |
| The gate proves the changed behavior, not merely procedure | ✅ J2's honest re-baseline before any re-fix; route (b)'s two planted arms; §4's opt-out test; AV3's `git grep` |
| No new blind spot is created silently | ✅ the whole task exists to close one; AV3 forbids an unnamed group; §4's test forbids an author-applied opt-out; AV10 names every residual cell |
| Zero/empty input covered | ✅ AV12 has a "none survive" arm; V6 has an "unknown" arm; J6 has a "no gate change" arm; AV4 expects story #4 to go red |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §11 + J2's comparator + §7's five stop-and-report branches |
| Ordering/dependency stated | ✅ J2 precedes J5 (**D32**); J5 precedes J6; J8 needs a real prod build; J12 genuinely last |
| Owner exceptions have traceable authorization | ✅ Task 607 review 2026-07-15 (allowlist ban) · Task 611 (`:322-330`, the route-(b) model) · Task 593 2026-07-14 (V4's restored decision) · owner 2026-08-07 (revert-in-724R, and 725 split out) · D6 |
| Exactly one active executable route | ✅ V2's two routes are a per-story election with a stated decision test and a documented output, not an open fork; every other requirement is single-valued |
| Prior-review corrections folded in | ✅ 724 F1–F7 are the task's content · 724 §16's AC6 correction is inherited, not re-litigated · 711 F2 → requirement 7 · the "gate green by not looking" lesson is now an explicit forbidden-path test rather than a warning |
| Sprint assigned before creation | ✅ Sprint 53, already open; this is its second task |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none to start.** Three are stops rather than judgment calls: a
`Mantine/Primitives/*` story needing deferral the registry cannot express (§3.5); a missing TailAdmin reference
row (clause 16a); and any proposal to supersede Task 593 (V4).
