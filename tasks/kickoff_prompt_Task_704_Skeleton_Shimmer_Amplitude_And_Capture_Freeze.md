# Task 704 — Restore the skeleton shimmer amplitude, and freeze animation at capture time

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI defect fix (visual) + rendered-harness determinism.
- **Secondary type:** none. No behavior, no data path, no new component.
- **Origin:** owner observation 2026-07-31 — *"наразі він статичний і це в 2026 році взагалі не дуже добре"*.
  Orchestrator investigation reframed it: the shimmer is **not missing, it was flattened** (§3.1).

> **Read this first.** This task is not "add an animation". Mantine's pulse is already enabled by an explicit
> owner ruling. A later, unrelated correction pinned the animated pseudo-element to a colour almost identical to
> its own base, collapsing the amplitude to the point of invisibility. Two decisions from the same week collided
> and nobody noticed. The fix is to restore visible amplitude **without** losing the TailAdmin fill correction —
> and to stop the restored motion from wrecking the rendered comparator.

---

## 2. Objective

1. Restore a visible — deliberately subtle — pulse on `Skeleton`, preserving Task 550's TailAdmin-sourced fill.
2. Freeze animation at Storybook capture time so the rendered matrix stays comparable.
3. Prove both: the pulse is visible in the product, and the capture is deterministic.

---

## 3. Verified context

Read in this worktree on 2026-07-31.

### 3.1 The collision — this is the defect

**Decision A — `src/design-system/mantine/theme.ts:619-622`:**

> animation — **OWNER RULED (2026-07-05): KEEP Mantine's own shimmer/pulse** (`animate:true` default) applied OVER
> these corrected tokens. TailAdmin's own placeholder is static, but the owner chose to retain Mantine's shimmer
> rather than match the live capture's stillness — an explicit, documented deviation, not an oversight.

**Decision B — `src/design-system/mantine/skeleton-chrome.css`** (Task 550), whose own header states that Mantine
hardcodes the pulse colour to `--mantine-color-gray-3` inside a `::after` pseudo-element and that only this
stylesheet can reach it:

```css
.mantine-Skeleton-root::after {
  background-color: var(--mantine-color-gray-0); /* §6n-LIVE — gray-50 #f9fafb */
}
```

**The actual mechanism — read from `node_modules/@mantine/core/styles/Skeleton.css`, not inferred.** Mantine's
pulse animates **`opacity`, not colour**:

```css
@keyframes m_299c329c { 0%, 100% { opacity: 0.4 } 50% { opacity: 1 } }
.m_18320242:where([data-animate])::after  { animation: m_299c329c 1500ms linear infinite }
.m_18320242:where([data-visible])::before { inset: 0; z-index: 10; background-color: var(--mantine-color-body) }
.m_18320242:where([data-visible])::after  { inset: 0; z-index: 11; background-color: var(--mantine-color-gray-3) }
```

`::after` **is** the grey placeholder fill, stacked over a `::before` layer painted in
`--mantine-color-body` (white). The pulse fades that fill between 40% and 100% opacity. The visible amplitude is
therefore a function of **the fill's contrast against the body colour**, not of any colour-to-colour transition.

**The measured consequence** of Decision B switching that fill from `gray-3` to `gray-0`:

| Fill | at `opacity: 1` | at `opacity: 0.4` (composited over white) | visible swing |
|---|---|---|---|
| Mantine stock `--mantine-color-gray-3` = `#dee2e6` | `#dee2e6` | ≈ `#f5f6f7` | **≈ 23/255** |
| Current `--mantine-color-gray-0` = `#f8f9fa` | `#f8f9fa` | ≈ `#fcfdfd` | **≈ 4/255** |

`animate: true` is still in effect and the animation genuinely runs — it modulates a fill already
indistinguishable from the page background. At ~4/255 the pulse is below the threshold of perception, which is why
the owner reports it as **absent** rather than faint (owner confirmation 2026-07-31, Storybook
`Mantine/Primitives/Skeleton/Default`).

**Two independent levers exist.** Amplitude can be restored by darkening the fill (Decision B's value) **or** by
widening the keyframe's opacity range — or both. D27 must choose between them (§5 A1); do not assume the fill is
the only knob.

**Do not resolve this by reverting Decision B.** Its fill value is a live TailAdmin capture
(`demo.tailadmin.com/layout-one`, `bg-gray-50`) ratified under clause 16a. Both decisions must survive.

### 3.2 The consumers

`Skeleton` is used by `FeaturedListingsView.tsx` (`CardSkeleton`, 5 elements per card),
`LatestListingsView.tsx` (`RowSkeleton`, 4 per row), and the route-level `loading.tsx` files for
`favorites` and `listings/[slug]`. Every one inherits from the theme + this stylesheet; there is no per-site
override to hunt.

### 3.3 The determinism problem this task must solve, not create

`scripts/check-stories-rendered.mjs` contains **no animation handling at all** — grep for `animation`,
`transition`, `reduced-motion` returns nothing. Consequently the two animating stories are the noisiest in the
matrix. Measured by the reviewer under **zero-code-diff** controls during the Task 699 review:

| Story | md5-changed cells with no code change |
|---|---|
| `Mantine/Primitives/Skeleton/Default` | **12** |
| `Patterns/Mantine/HomepageListingGrids/Loading` | **10** |

Both are catalogued in the Task 698 §8.1 noise set. **Restoring amplitude makes this strictly worse** — deltas
that today sit near the D26 `≤2/255` bound (`docs/storybook-governance.md` §14.11) will grow with the contrast.
Shipping the fix without the freeze would degrade the comparator for the whole matrix.

### 3.4 The freeze precedent to copy

Task 698 (**D25**) froze the Storybook clock with an inline `<script>` in `.storybook/preview-head.html` (54
lines) that runs before the story bundle. The same file is the right home for a `<style>` block disabling
animations and transitions inside the preview iframe. **Reuse that placement and that reasoning.** The freeze must
apply to the capture context only — never to the product.

### 3.5 Start state

`git status --porcelain` expected **empty**. Anything else is a **stop and report** plus
`docs/orchestrator-dirty-worktree-manifest-template.md`.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, A1 | The pulse regains a visible amplitude via the **D27-ratified lever** (fill colour, opacity range, or both). Any value is traced to a `docs/tailadmin-style-reference.md` row or to the ratified decision; inventing one is a **stop and report**. | P0 | AC1 | **Ambiguous — see A1** |
| R2 | §3.1 | Task 550's TailAdmin fill correction is **not reverted**. The Skeleton's **resting** appearance at `opacity: 1` — fill, 1px gray-200 border, 12px radius — is unchanged unless D27 explicitly selects Lever 1 and ratifies the new resting value. | P0 | AC1, AC2 | Confirmed |
| R3 | §3.1 | `animate: true` stays; no `animate={false}`, no JS-driven animation. Mantine's own `m_299c329c` pulse remains the mechanism — a replacement keyframe is permitted **only** if D27 selects Lever 2, and then only to widen the opacity range, never to animate a different property. | P0 | AC1 | Confirmed |
| R4 | §3.3, §3.4 | Animations and transitions are disabled inside the Storybook preview iframe via `.storybook/preview-head.html`, so captured cells are deterministic. Product code is unaffected. | P0 | AC3 | Confirmed |
| R5 | R4 | Proven by a **same-tree, zero-code-diff double capture** after the freeze: `Skeleton/Default` and `HomepageListingGrids/Loading` show **0 md5-changed cells** between the two runs — against the 12 and 10 recorded in §3.3. | P0 | AC3 | Confirmed |
| R6 | cl. 11, 12 | `prefers-reduced-motion: reduce` suppresses the pulse in the product. If Mantine already honours it, verify and record; if not, add it. A restored animation that ignores the OS setting is an accessibility regression. | P0 | AC4 | Confirmed |
| R7 | cl. 12 | Rendered proof vs a baseline captured in this session: 0 FAIL, 0 verdict changes. Cells for the two animating stories are expected to change (the fix is visual) — they must be **attributed as intended**, not as noise. Every other changed cell is attributed under D26 or the documented noise set. | P0 | AC5 | Confirmed |
| R8 | cl. 9, 14 | `check:homepage-grid` exit 0; `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` 28/0/0 or lower with the delta attributed; `vitest` no new failure; integrity/mojibake clean after the records; `npm run build` exit 0 with the full 54-row route table. | P0 | AC6 | Confirmed |
| R9 | cl. 10 | Session log + `docs/backlog.md` at **80 lines**. | P1 | AC7 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — OPEN, OWNER DECISION REQUIRED BEFORE I3.** How to restore amplitude is **not settled**, and there are
  **two independent levers** (§3.1):
  - **Lever 1 — the fill colour** (`skeleton-chrome.css`'s `::after` `background-color`). `gray-3` `#dee2e6` is
    Mantine's stock and yields ≈23/255, but Task 550 replaced it precisely because TailAdmin's placeholder is
    `gray-50`; `gray-1` `#f1f3f5` and `gray-2` are intermediate stops trading visibility against fidelity.
    Darkening this changes the skeleton's **resting** appearance, which is what R2 protects.
  - **Lever 2 — the opacity range.** Overriding the animation with a wider range (e.g. `0.15 → 1`) on the existing
    `gray-0` fill increases the swing **without touching the resting look at `opacity: 1`** — the TailAdmin value
    stays exactly as captured. This lever did not exist in the original framing and may well be the better answer.
  `docs/tailadmin-style-reference.md` has **no row for an animated placeholder** — TailAdmin's is static — so
  clause 16a applies: **the executor must stop and present both levers with the amplitude each candidate yields,
  rather than choosing.** Record the outcome as **D27**.
- **A2 — subtle, per the owner.** The request was a weak blink, not a marketing shimmer. Whatever D27 selects,
  the resting appearance must stay TailAdmin-faithful; only the moving target changes.
- **A3 — the freeze is capture-only.** A product-wide animation kill would satisfy R5 and destroy R1. If the
  implementation cannot keep them separate, **stop and report**.
- **A4 — do not touch the counts.** How many skeletons render is Task 703's invariant.
- **A5 — no `animate={false}` anywhere.** R3.

**Open question — A1/D27 is unresolved and blocks I3.** Everything before I3 can proceed without it.

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 11, 12, 14, 16/16a.
2. `docs/qa-profiles.md` — the **Q3** row.
3. `docs/storybook-governance.md` §14.10 (the D25 freeze precedent) and §14.11 (D26).
4. `docs/tailadmin-style-reference.md` — §6n / the skeleton placeholder rows.
5. `docs/mantine-responsive-design-system.md` §18.
6. `docs/backlog.md` — **80 lines**.

**Source pre-read**

7. `src/design-system/mantine/skeleton-chrome.css` — in full; its header is §3.1's Decision B.
8. `src/design-system/mantine/theme.ts` `:600-625` — the Skeleton block and Decision A.
9. `.storybook/preview-head.html` — in full; the D25 freeze placement.
10. `src/modules/listings/components/FeaturedListingsView.tsx` `:11-27`,
    `src/modules/listings/components/LatestListingsView.tsx` `:9-22` — consumers, read-only.

## 7. Scope

| Path | Action |
|---|---|
| `src/design-system/mantine/skeleton-chrome.css` | modify — the D27-ratified lever (fill colour and/or opacity range) + a reduced-motion rule if R6 needs one |
| `.storybook/preview-head.html` | modify — capture-time animation freeze |
| `docs/backlog.md` | modify — **80 lines** |
| `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` | create |

Nothing else. `theme.ts`, the Views and the route `loading.tsx` files are **read-only**.

## 8. Out of scope

- **Reverting Task 550's fill correction** (R2) — it is a ratified live TailAdmin capture.
- **Changing skeleton counts, sizes, radius or border** — Task 703 owns the counts; the rest is Task 550's.
- **A new animation mechanism** — no `@keyframes`, no JS (R3).
- **Disabling animation in the product** (A3).
- **Re-cataloguing the §8.1 noise set** — if the freeze removes these two stories from it, that is a finding to
  **report**; updating `docs/storybook-governance.md` §8.1 is a follow-up.
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** `animate: true` is set and Mantine's `opacity: 0.4 ↔ 1` pulse runs, but the `::after` fill it
modulates was pinned to `gray-0` `#f8f9fa` — near-identical to the `--mantine-color-body` layer beneath it — so
the visible swing is ≈4/255, below the threshold of perception. The owner reports the skeleton as static
(confirmed 2026-07-31). Separately, the harness disables no animation, so the
two animating stories are the matrix's noisiest, at 12 and 10 md5-changed cells under zero-code-diff controls.

**Required after.** The pulse is visibly present and deliberately subtle, at a colour ratified as **D27**, with
Task 550's resting appearance intact and `prefers-reduced-motion` honoured. Storybook captures are deterministic:
both animating stories show 0 changed cells across a same-tree double capture.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain` verbatim (§3.5).

**I1 — baselines.** `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`, `check:design-tokens`,
`vitest`, `check:homepage-grid`. Then `build-storybook` + `screenshots:assert -- --mantine-only` **twice on the
identical tree** and record the md5-changed cell counts for `Skeleton/Default` and `HomepageListingGrids/Loading`.
Expect roughly the §3.3 figures — this is the "before" for R5.

**I2 — measure the current amplitude.** The pulse animates **opacity** (§3.1), so sample the `::after` at both
keyframe extremes — `getComputedStyle(el, '::after')` for `opacity` and `background-color`, composited over the
`::before` body colour — and record the resulting per-channel swing. Expect ≈4/255. This converts §3.1's
arithmetic into a measurement on the real render.

**I3 — BLOCKED ON D27.** Present the owner with **both levers** (§5 A1) and the amplitude each candidate yields,
computed by I2's method: for Lever 1, the candidate fill colours; for Lever 2, the candidate opacity ranges on the
existing `gray-0` fill. State for each whether it changes the **resting** appearance. **Do not choose.** Then apply
the ratified option and quote the decision, its date and its scope in the file comment.

**I4 — reduced motion (R6).** Verify whether Mantine's pulse already respects `prefers-reduced-motion: reduce`.
Record the result; add a suppression rule only if it does not.

**I5 — capture freeze (R4).** Add a `<style>` block to `.storybook/preview-head.html` disabling animations and
transitions inside the preview iframe, alongside the D25 clock script. Comment it with the §3.3 measurements as
its justification.

**I6 — determinism proof (R5).** `build-storybook`, then `screenshots:assert -- --mantine-only` **twice on the
identical post-change tree**. Required: **0** md5-changed cells for both stories. Quote both runs.

**I7 — rendered proof (R7).** Compare against I1's baseline. 0 FAIL, 0 verdict changes. The two animating
stories' cells are expected to differ — attribute them as **intended** with the D27 reference. Partition every
other changed cell under D26 or the noise set, recording "0 changed cells" rows.

**I8 — product check.** Confirm the pulse is visible in the real product, not just Storybook — the freeze must not
have leaked. Record how it was checked.

**I9 — gates (R8).** Re-run the I1 suite.

**I10 — `npm run build` last**, exit 0, full 54-row route table verbatim.

**I11 — records, then encoding gates.** Session log per §14; `docs/backlog.md` (**80 lines**); then
`check:file-integrity` and `check:mojibake` with counts quoted.

**Order:** I0 → I1 → I2 → **I3 (owner gate)** → I4 → I5 → I6 → I7 → I8 → I9 → I10 → I11.

## 11. Positive and negative flows

### Positive flow

A user on a slow connection sees the homepage loading grid breathe gently instead of sitting dead. A developer
re-runs the rendered matrix twice and gets byte-identical results, because the preview iframe freezes motion. Both
properties hold at once, which is the whole point of the task.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **Amplitude restored by reverting the TailAdmin fill** | **Yes** | R2, §3.1 | resting appearance unchanged; only the `::after` target moves | AC1, AC2 |
| **A colour chosen without owner ratification** | **Yes** | A1, cl. 16a | stop at I3 and request D27 | AC1 |
| **The freeze leaks into the product** | **Yes** | A3, R4 | I8 confirms the pulse still runs live | AC3 |
| **The freeze does not actually work** | **Yes** | R5 | 0 changed cells across a same-tree double capture | AC3 |
| **Motion ignores `prefers-reduced-motion`** | **Yes** | R6, cl. 11 | verified or added | AC4 |
| **New matrix noise attributed as D26 "noise"** | **Yes** | R7 | the two stories' changes are **intended**, and must be labelled so | AC5 |
| **`animate={false}` used as the fix** | **Yes** | R3, A5 | forbidden | AC1 |
| All four locales | **Yes** | cl. 7 | no user-facing string; parity 2215×4 unchanged | AC6 |
| RLS / data path / validation | No | Presentational only | N/A | — |
| Critical-flow regression | No | No registry row covers skeleton animation | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R3]** — the `::after` target is the **D27-ratified** colour, quoted with date and scope in the file;
  `animate: true` retained; no `@keyframes`, no JS, no `animate={false}`.
- **AC2 [R2]** — the Skeleton's resting fill, border and radius are unchanged; only the animated pseudo-element's
  target moved.
- **AC3 [R4, R5]** — the freeze lives in `.storybook/preview-head.html`; a same-tree double capture shows **0**
  md5-changed cells for `Skeleton/Default` and `HomepageListingGrids/Loading`, against §3.3's 12 and 10; and I8
  confirms the product still animates.
- **AC4 [R6]** — `prefers-reduced-motion: reduce` suppresses the pulse, verified or implemented, with evidence.
- **AC5 [R7]** — 0 FAIL, 0 verdict changes; the two animating stories' changed cells are attributed as intended
  with the D27 reference; every other changed cell partitioned under D26 or the noise set.
- **AC6 [R8]** — all gates green as listed; `npm run build` exit 0 with the full 54-row route table.
- **AC7 [R9]** — session log exists; `docs/backlog.md` at exactly 80 lines.

## 13. QA profile and verification plan

**`Q3 — Full Visual Matrix`.** A deliberate visual change to a component rendered on the homepage and two route
loading states. Comparator: the enrolled `--mantine-only` matrix under **D26** (§14.11), with the two animating
stories' deltas labelled intended rather than tolerated, plus the R5 determinism proof — which is the stronger
artifact here, since it is a falsifiable 12→0 and 10→0.

**Not Q4** — no gate is authored. **TailAdmin side-by-side is required** for the D27 colour (clause 16).

## 14. Completion report contract

Session log at `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md`:

1. `Files Changed` matching the real diff — say **modified** if modified (Task 693 review F3).
2. I0/final `git status --porcelain`.
3. R1–R9 → AC1–AC7 with evidence.
4. **The I2 amplitude measurement**, before and after, per channel.
5. **The D27 decision quoted verbatim** with date and scope.
6. **Both same-tree double captures** — before (§3.3 figures reproduced) and after (0/0).
7. The rendered comparison with the full changed-cell partition, intended vs attributed.
8. The I4 reduced-motion result and the I8 product check.
9. Every command with its actual exit code; the build tail verbatim with the full 54-row route table.
10. Deviations and limitations — at minimum whether the freeze makes the two stories eligible to leave the §8.1
    noise set (report only, §8).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Expect `BLOCKED` at I3 until D27 is ratified** — that is the designed path, not a failure. No self-approval; no
mutating git.

**Handoff:** `tasks/kickoff_prompt_Task_704_Skeleton_Shimmer_Amplitude_And_Capture_Freeze.md` under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | **Yes** — both colliding decisions quoted, the three token values tabulated, the measured noise figures, the freeze precedent and the consumer list are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC7 |
| Scope protects existing behavior | **Yes** — §8 plus R2's untouched resting appearance and A3's product/capture separation |
| QA profile + canonical decision record | **Yes** — §13 Q3 with the determinism proof named as the stronger artifact; D27 required before implementation |
| Negative flows by applicability | **Yes** — §11, incl. the revert-the-fill branch, the leaked-freeze branch and the mislabelled-noise branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes `theme.ts` and `skeleton-chrome.css` directly, the token values come from the shipped bundle, §3.3's figures were measured by the reviewer during the Task 699 review, §3.4 cites the real file |
| Gates prove the changed behavior | **Yes** — a falsifiable 12→0 / 10→0 determinism proof plus an amplitude measurement, not "looks better" |
| Single active owner route | **Yes** — one route with one declared owner gate at I3; forks are stop conditions |
| Baselines account for task-created artifacts | **Yes** — I1 captures the double-run "before" *and* the amplitude baseline at I2, both prior to any edit |
| Dirty-worktree handling | **Yes, declared** — §3.5 |
| Unresolved decision visible | **Yes** — A1/D27 is marked open, blocks I3, and the report contract expects `BLOCKED` there |

**Known-risk note for the reviewer.** Four likely defects. First, **reverting Task 550** — the fastest way to
restore amplitude is to delete the `::after` override, which silently discards a clause-16a-ratified TailAdmin
capture; R2 forbids it. Second, **killing animation globally to satisfy the determinism proof** — R5 becomes
trivially true and R1 becomes false, and a diff review would not obviously show which happened; I8 exists for
that. Third, **labelling the two animating stories' new deltas as D26 noise** — they are an intended visual
change, and filing them under the sub-perceptual clause would both misuse D26 and hide the only rendered evidence
that the fix did anything. Fourth, **treating the fill colour as the only lever** — this kickoff originally
described the pulse as a colour-to-colour transition, which was wrong (§3.1 corrected 2026-07-31 against
`node_modules/@mantine/core/styles/Skeleton.css`); it animates opacity, and Lever 2 can restore visibility without
touching the resting appearance at all. An executor who only considers the fill will present the owner half the
decision.
