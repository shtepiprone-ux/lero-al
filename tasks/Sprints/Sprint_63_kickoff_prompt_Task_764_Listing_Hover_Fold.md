# Task 764 — Fold `listing`'s hover into the card pattern, and measure the two guards that never matched

**Sprint:** 63 — Homepage exits Tailwind · **Phase:** 2a · **Priority:** P1
**Filed:** 2026-08-21 against `main` @ `e2dc52f16` + the Task 763 worktree
**Status:** KICKOFF FILED — **blocked until Task 763 Revision 1 is `APPROVED`**

---

## 1. Mode and task type

`IMPLEMENTATION` · **UI / design-system migration (D28), behaviour-bearing.** Current Mantine path; the file being
edited is an already-migrated Mantine pattern's CSS Module, and the thing being deleted is the last Tailwind
utility on the homepage card.

**Owner decision, 2026-08-21, quoted:** *"Route C для D63-E виглядає найкращим, але реалізовувати його треба
окремою Phase 2 задачею після вимірювання coarse-pointer сценарію."*

That decision is this task's single active route. Route (a) — accepting 1.1025× → 1.05× — and route (b) — leaving
the Tailwind pair as permanent debt — are both rejected and must not be implemented.

**Owner decision, 2026-08-21, second half — the behaviour changes are pre-accepted:** *"приймаю зміну
coarse-pointer zoom і форму анімації як intentional behavior changes."* Both are therefore **decided, not
proposed**: this task records them and does not restore either. It is not authorization to accept any *other*
delta the comparator finds.

**Owner instruction, 2026-08-21, third half:** *"AC6/Phase C мають порівнювати ефективний масштаб або
bounding-rect ratio; зміни окремих computed `transform` та `scale` є очікуваними."* The first filing of this
kickoff had AC6 requiring the computed `transform` string to be byte-identical — **that criterion was wrong and
would have failed a correct implementation**, because the fold deliberately moves the effect from two properties
onto one (`matrix(1.05…)` + `scale: 1.05` → `matrix(1.1025…)` + `scale: none`). §10.4 and AC6/AC7 are
rewritten around the effective rendered scale. This is the ninth recorded instance of the standing kickoff-fact
failure mode and, like the sixth, it is the orchestrator's own.

## 2. Objective

Delete the last Tailwind utility from the homepage's primary card by moving the hover-zoom entirely into
`MantineListingCardPattern.module.css`, preserving the rendered result at the settled hover state exactly, and
**measuring — before the edit — the two behaviour dimensions where the two composed rules were never equivalent**:
coarse-pointer devices, and the transition itself.

On completion: `appImageConfig.ts` has zero Tailwind strings, `'group'` is gone from
`MantineListingCardPattern.tsx:304`, and R1/R7 of Task 763 are closed.

## 3. Verified context

Measured by the task author on `e2dc52f16` + the 763 worktree. Facts marked **I0** are re-measured by the executor
as freshness validation before any write.

### 3.1 What renders the hover today — two independent rules on two different CSS properties

| Half | Source | Selector | Declaration | Guard |
|---|---|---|---|---|
| A | `MantineListingCardPattern.module.css:67-69` | `.card:hover .imageSection img` | `transform: scale(1.05)` | `@media (hover: hover) and (pointer: fine)` |
| B | Tailwind, via `appImageConfig.ts:66` `hoverClass: 'group-hover:scale-105'` | `.group-hover\:scale-105:is(:where(.group):hover *)` | `--tw-scale-x/y/z: 105%; scale: var(--tw-scale-x) var(--tw-scale-y)` | `@media (hover:hover)` — **`pointer: fine` is NOT part of it** |

`transform` and `scale` are separate CSS properties. Individual transform properties (`translate`, `rotate`,
`scale`) apply before `transform`, so the two multiply: **1.05 × 1.05 = 1.1025**. Both halves fire from anywhere on
the `Card`, because `'group'` sits on the `Card` (`MantineListingCardPattern.tsx:304`), which wraps the image **and**
the title/price/badge area.

Half B's compiled form and its `@media (hover:hover)` wrapper were verified by a brace-depth walk backwards from the
selector in `.next/static/css/6fa64bb43d7d13c4.css` and `storybook-static/assets/iframe-ByNNtsru.css`. Both return
`["@media (hover:hover)","@layer utilities"]`.

### 3.2 The file's own header states the guards match. They do not.

`MantineListingCardPattern.module.css:22-24`, verbatim:

> `:hover` rules are scoped to `(hover: hover) and (pointer: fine)` **(same guard Tailwind's own `hover:` variant
> applies by default)** so a tap on a touch device never leaves the card "stuck" in its hovered/zoomed state — the
> effect only exists for a real mouse.

The parenthetical is **false**: the compiled `group-hover:` variant carries `(hover: hover)` only. That false belief
is the whole reason the two halves drifted apart on coarse-pointer devices, and it is why the owner asked for the
measurement before the fold. **The header is corrected in this task, in the same commit as the fold.**

Consequence, stated as `INFERENCE` to be measured at Phase A: on a device reporting `hover: hover` **and**
`pointer: coarse`, half A does not fire and half B does — so the card zooms **1.05×** today, and after the fold it
would zoom **not at all**.

### 3.3 The transition is the second place the halves were never equivalent

`MantineListingCardPattern.module.css:52-54`:

```
.imageSection img { transition: transform 300ms ease-out, opacity 300ms ease-out; }
```

`transform` is transitioned. **`scale` is not in that list.** So today, on a `priority` image (no `.fade`), the
hover is: half B snaps instantly to 1.05×, then half A eases from 1.05× to 1.1025× over 300ms `ease-out`.

On a non-priority image, `AppImage.module.css`'s `.fade` **does** list `scale`, at `300ms` with
`cubic-bezier(0.4, 0, 0.2, 1)` — so half B animates, on a different easing curve than half A.

After the fold there is one property, one duration, one curve.

**This is why a rest-state and settled-hover comparator is not sufficient for this task.** Both would report zero
delta while the animation's shape changed. Phase C requires mid-transition sampling.

### 3.4 The rendered matrix cannot currently produce a coarse-pointer cell — and the way to make one is a hypothesis, not a fact

**`FACT`.** `grep -rn "hasTouch\|isMobile\|pointer" scripts/responsive-screenshots.mjs scripts/check-stories-rendered.mjs`
returns **nothing**. No existing proof path emulates `pointer: coarse`, so Phase A needs a purpose-built probe.
`playwright@^1.60.0` is a devDependency and `scripts/` has precedent for unwired, task-numbered probes.

**`HYPOTHESIS` — the probe exists to test this, and the task author did not measure it.** A Playwright context
created with `hasTouch: true` at a desktop viewport is *expected* to report `(hover: hover)` and
`(pointer: coarse)` together. That expectation comes from how Chromium is documented to map touch emulation onto
the interaction media features; **it was not verified against this repository's installed Playwright and Chromium**,
and it is the single assumption the whole coarse-pointer measurement rests on. Emulation of the interaction media
features has changed across Chromium versions, and `hasTouch: true` alone may instead yield `(hover: none)`.

Treat §3.4 as the reason the probe is built, never as evidence of what it will report. A2 in §5 is the gate: if the
probe does not confirm both queries simultaneously, the task stops at `BLOCKED`. Do not adjust this section to match
whatever the probe returns — record the measurement in the report and leave the hypothesis visible, so the next
reader can see which of the two it was.

### 3.5 Consumers

`listing` is consumed by `ListingCard.tsx` only. `'group'` is supplied at exactly one site,
`MantineListingCardPattern.tsx:304`. `.imageSection img` is a tag selector, so it targets the real `AppImage`'s
`<img>` and the stories' `DemoImage` alike — `MantineListingCardPattern.module.css:16-20` says so explicitly, and
Task 763's review confirmed `ListingCardPattern.stories.tsx` renders the `DemoImage` stand-in while
`ListingCard.stories.tsx` renders the production component.

### 3.6 Reduced motion already covers the fold

`MantineListingCardPattern.module.css:74-83` resets `.card:hover .imageSection img { transform: none }` under
`@media (prefers-reduced-motion: reduce)`. Because route (c) keeps the effect on `transform`, that reset keeps
working with no change. **Half B has no such reset today** — Tailwind's `scale` is not covered by it, so a
reduced-motion user currently still gets a 1.05× jump. The fold removes that too.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner decision (route c) | `appImageConfig.ts`'s `listing` entry has no `hoverClass`, and the file contains zero Tailwind utility strings | P0 | AC1 | Confirmed |
| R2 | Owner decision (route c) | `MantineListingCardPattern.module.css:68` reads `transform: scale(1.1025)` | P0 | AC2 | Confirmed |
| R3 | Owner decision (route c) | `'group'` and its comment are removed from `MantineListingCardPattern.tsx:304` | P0 | AC3 | Confirmed |
| R4 | Owner decision (measure first) | The coarse-pointer delta is **measured before the edit**, with a persisted artifact, and its post-edit value is measured again | P0 | AC4 | Confirmed |
| R5 | §3.3 | The hover transition is sampled **mid-flight**, not only at rest and settled, for both a `priority` and a non-`priority` image | P0 | AC5 | Confirmed |
| R6 | §3.1, §10.4 | Settled hover on `(hover:hover) and (pointer:fine)` renders the identical **effective scale** before and after — `hoveredRect / restRect` from `getBoundingClientRect()`, width and height independently, agreeing to 4 decimals and rounding to 1.1025. The individual computed `transform` and `scale` values **are expected to change** and are diagnostics, never the pass input | P0 | AC6 | Confirmed |
| R7 | §3.1 | The trigger area is unchanged: hovering the title/price area still zooms the image | P0 | AC7 | Confirmed |
| R8 | §3.2 | The false parenthetical in `MantineListingCardPattern.module.css:22-24` is corrected, and the fold's rationale replaces it | P1 | AC8 | Confirmed |
| R9 | Sprint 63 rule 1 | Two-armed plant proves the Phase C comparator can fail | P0 | AC9 | Confirmed |
| R10 | Task 763 R8 | No new Tailwind-owned or `@theme inline` reference; `check:tailwind-runtime-tokens` unchanged | P0 | AC10 | Confirmed |
| R11 | Standing governance | `npm run build` exit 0 | P0 | AC11 | Confirmed |

## 5. Assumptions and open questions

- **A1 (`INFERENCE`, measured at Phase A; outcome already decided by the owner):** on `hover: hover` +
  `pointer: coarse`, the card zooms 1.05× today and 0× after the fold. The owner has **accepted this as an
  intentional behaviour change** (§1). It is measured and recorded, never restored. Do **not** add a
  `(pointer: coarse)` rule. The corroborating authority is the file's own stated intent (§3.2: *"the effect only
  exists for a real mouse"*) plus §3.6 — half B also escapes the reduced-motion reset.
- **A2 (`UNKNOWN` — and a hard stop, not a branch):** whether this Playwright version's `hasTouch: true` context
  actually reports `(hover: hover)` **and** `(pointer: coarse)` together. **Owner instruction, 2026-08-21:**
  *"Якщо probe не підтверджує саме `(hover:hover) and (pointer:coarse)`, задача має бути BLOCKED, а не
  продовжуватись."* If `matchMedia` in the coarse context does not return `true` for both queries simultaneously,
  **stop at Phase A and report `BLOCKED`** with the measured `matchMedia` values. Do not proceed to Phase B, do
  not substitute `hover: none`, and do not reason about what the delta "would" be. Without that exact media state
  the accepted change is unevidenced, and an unevidenced acceptance is what this whole sprint exists to prevent.
- **A3 (`UNKNOWN`):** whether `scale(1.1025)` reproduces the **effective rendered scale** exactly. Both are uniform
  scales about the same default origin on the same element, so the product is exact in principle; sub-pixel
  rounding in the reported box is the risk. The individual computed `transform` and `scale` values **are expected
  to change** and are not the comparator. If AC6's effective-scale ratio differs beyond §10.4's stated tolerance,
  report `BLOCKED` with the measured rectangles — do **not** tune the constant to make a comparator pass.
- **Q1 (open, does not block):** the residual `listing` items — `'flex flex-col'` and `'grayscale opacity-60'` at
  `MantineListingCardPattern.tsx:305-306`, and `LocaleSwitcher.tsx:55`'s `animate-spin` — are **Phase 2b**, a
  separate task. Do not touch them here.

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` (§18 on module-vs-utility for hover) ·
`docs/tailadmin-style-reference.md` · `docs/component-rules.md` · `docs/qa-rules.md`.

**Task-specific:** `tasks/Sprints/Sprint_63_Homepage_Exits_Tailwind.md` (five binding rules; D63-E) ·
`tasks/Sprints/Sprint_63_Task_763_revision_1_class_naming.md` §3 (why 763 stopped) ·
`docs/sessions/evidence/task763/i1-utility-extraction.md` §2 and §7 (the compiled half-B rule; do not re-extract) ·
`MantineListingCardPattern.module.css` header lines 1-25 and 86-115 (D34 disposition for this file: **unlayered**).

**Session protocol:** the auto-loaded `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

1. `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — line 68's value, the header
   correction at 22-24, and a rationale comment on the changed rule. **Nothing else in the file.**
2. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — removal of the `'group'` argument at line
   304 and its comment. **Lines 305-306 are out of scope.**
3. `src/components/ui/appImageConfig.ts` — removal of the `listing` entry's `hoverClass` field and its
   BLOCKED comment; the header note about the exception.
4. `src/components/ui/AppImage.module.css` — **only if** removing the last `hoverClass` consumer leaves a dead
   class. It does not: `.hoverBrightness` still serves the two gallery variants. Expect zero changes here.
5. `scripts/task764-pointer-probe.mjs` — the Phase A probe (task-numbered, unwired, matching `scripts/` precedent).
6. `docs/sessions/<date>-task764-*.md` and `docs/sessions/evidence/task764/**`.
7. `docs/backlog.md` — concise current state.

## 8. Out of scope

- `MantineListingCardPattern.tsx:305-306` and `LocaleSwitcher.tsx:55` — Phase 2b.
- Any change to `AppImage.tsx`, to the other 8 variants, or to `.hoverBrightness`'s mechanism.
- `hoverClass` as an API: the field stays on `VariantConfig` (`gallery-main`/`gallery-side` use it). Do not remove
  the type member.
- Restoring the coarse-pointer effect, or restoring the two-curve animation shape. Both are **owner-accepted
  outcomes** (§1, quoted), not open questions.
- Re-running Task 763's I1 extraction, I2 baseline, or I5 plants.
- `src/app/globals.css`.

## 9. Current and required behaviour

| Behaviour | Today | Required after |
|---|---|---|
| Settled hover zoom, `pointer: fine` | effective **1.1025×**, produced by two properties: computed `transform` `matrix(1.05…)` + computed `scale` `1.05` | effective **1.1025×**, produced by one: computed `transform` `matrix(1.1025…)` + computed `scale` `none`. **The effective scale is the invariant; the two property values are expected to change** |
| Trigger area | Anywhere on the `Card`, incl. title/price | **Unchanged** |
| Transition, `priority` image | Instant snap to 1.05×, then 300ms `ease-out` to 1.1025× | **Single 300ms `ease-out` to 1.1025×** — recorded intentional change |
| Transition, non-`priority` image | Two curves: `ease-out` (transform) + `cubic-bezier(.4,0,.2,1)` (scale) | **Single `ease-out` curve** — recorded intentional change |
| `prefers-reduced-motion` | `transform` reset; the `scale` half still jumps | **Fully reset** — recorded intentional fix |
| `hover:hover` + `pointer:coarse` | 1.05× (half B only) — pending A1 | **No zoom** — recorded intentional change, per §3.2's stated intent |
| Tailwind dependency of the card | `group` + `group-hover:scale-105` | **None** |

## 10. Implementation requirements

### 10.0 — I0 freshness

`git status --porcelain` (non-empty → `docs/orchestrator-dirty-worktree-manifest-template.md` first);
`git rev-parse HEAD`; confirm Task 763 Revision 1 is approved and landed; re-read §3.1's two rules and §3.3's
transition list at their current line numbers. Report drift before acting.

### 10.1 — Phase A: measure, before any source edit

Build the probe at `scripts/task764-pointer-probe.mjs`. It launches the story that renders the **production**
`ListingCard` (`src/stories/mantine/primitives/ListingCard.stories.tsx` — not `ListingCardPattern.stories.tsx`,
which renders `DemoImage`) in two Playwright contexts:

- **fine:** default desktop context.
- **coarse:** `hasTouch: true` at the same viewport.

In each, record **all three** of `matchMedia('(hover: hover)').matches`, `matchMedia('(pointer: coarse)').matches`
and `matchMedia('(pointer: fine)').matches` into the artifact — the A2 gate is asserted on `(pointer: coarse)`, and
`(pointer: fine)` is recorded alongside it so a context reporting neither, or both, is visible rather than inferred.
Then capture the
`<img>`'s computed `transform` **and** `scale` at rest and with the pointer over (i) the image and (ii) the
title/price area. Persist to `docs/sessions/evidence/task764/phase-a-pointer-matrix.json`.

**Phase A gate (A2, owner instruction).** If the coarse context does not report `true` for **both**
`(hover: hover)` and `(pointer: coarse)`, stop here: persist the measured `matchMedia` values and report
`BLOCKED`. Do not proceed to Phase A2 or Phase B. A different emulation trick may be proposed in the report, but
it is a new owner decision, not a substitution this task may make.

Capture `getBoundingClientRect()` alongside the computed values at every sample — it is the comparator's actual
input (§10.4), and a run that recorded only computed strings has to be redone.

### 10.2 — Phase A2: mid-transition capture

Extend the probe to sample the `<img>`'s computed `transform`/`scale` at ~0 ms, ~75 ms, ~150 ms, ~300 ms and
~600 ms after pointer-enter, for **one `priority` and one non-`priority`** card. Persist as
`phase-a-transition-curve.json`. This is the artifact §3.3 exists for; a comparator without it cannot see the change
this task makes.

### 10.3 — Phase B: the fold

1. `MantineListingCardPattern.module.css:68` — `transform: scale(1.05)` → `transform: scale(1.1025)`, with an inline
   comment naming Task 764, the two folded halves, and the measured product.
2. Correct lines 22-24: the guards were **not** the same. State that Tailwind's `group-hover:` carried
   `(hover: hover)` only, that this file's rules carry `(hover: hover) and (pointer: fine)`, and that the fold
   makes the pattern's stated intent actually true.
3. `appImageConfig.ts` — delete the `listing` entry's `hoverClass` field and its BLOCKED comment; update the file
   header note that named it as the one exception.
4. `MantineListingCardPattern.tsx:304` — delete `'group'` and its 691R comment. Leave 305-306 untouched.

### 10.4 — Phase C: comparator

Re-run the Phase A and A2 probes and diff.

**The comparator's metric is the effective rendered scale, not any individual CSS property.** Define, per sample:

```
effectiveScale = hoveredRect.width / restRect.width      (assert against .height independently)
```

using `getBoundingClientRect()` on the same `<img>` in the same context. Computed `transform` and `scale` are
recorded as diagnostics and are **expected to differ** before and after; they are never the pass/fail input.

Pass rule:

- **Settled hover, fine pointer:** `effectiveScale` before and after agree to **4 decimal places**, and both round
  to **1.1025**. Width and height ratios are asserted separately and must agree with each other to the same
  precision (a non-uniform result means the scale did not compose as assumed). Rest-state rectangles must be
  byte-identical, or the ratio is meaningless and the run is a FAIL.
- **Trigger area:** the title/price hover yields the same `effectiveScale` as the image hover, before and after.
- **Rest state:** identical rectangles and identical computed values, all contexts.
- **Transition curve and coarse-pointer rows:** deltas are **expected and owner-accepted** (§1). Each must be
  enumerated against §9's "Required after" column. An unexpected delta, or an expected one that did **not**
  appear, is a FAIL.
- **A sample whose rest rectangle has zero width, or whose computed value is an unresolved custom property on
  either side, is a FAIL, not a match** (Task 748's durable lesson: a witness that agrees with itself about a
  value neither side can resolve has proven nothing).

### 10.5 — Phase D: two-armed plant (Sprint 63 rule 1)

| Arm | Mutation | Required observation |
|---|---|---|
| P1 | `scale(1.1025)` → `scale(1.05)` | Phase C's settled-hover `effectiveScale` reads ≈1.0500 against a ≈1.1025 baseline, the row reports a non-zero delta, and the run exits non-zero |
| P2 | Delete `transform` from `.imageSection img`'s transition list (line 53) | Phase A2's mid-flight samples show the settled value at ~0 ms, and the run fails |

Both observed red, then reverted and re-run clean. Record the pre-plant census: which other gate would have caught
each arm. Expected: none — `check:design-tokens` does not resolve values, `check:tailwind-runtime-tokens` reads
names, and the rendered matrix has no mid-transition or coarse-pointer cell at all (§3.4).

## 11. Positive and negative flows

**Positive.** A mouse user on `/<locale>` moves the pointer onto a Featured card's price text. The image eases from
1× to 1.1025× over 300 ms on a single `ease-out` curve. Nothing in the DOM carries a Tailwind class.

| # | Flow | Applicable | Required |
|---|---|---|---|
| N1 | `prefers-reduced-motion: reduce` | **Yes** | No zoom at all — now fully covered by `:74-83` |
| N2 | `hover:hover` + `pointer:coarse` | **Yes** | No zoom. Intentional (A1) |
| N3 | Touch tap (`hover: none`) | **Yes** | No stuck hover state — the condition `:22-24` was written for |
| N4 | Archived card (`grayscale opacity-60` still Tailwind) | **Yes** | Unchanged; those classes are Phase 2b |
| N5 | `priority` vs non-`priority` image | **Yes** | Same settled value; single curve in both |
| N6 | Card with no image (`src` falsy) | **Yes** | No `<img>`; selector matches nothing; no error |
| N7 | Stories rendering `DemoImage` | **Yes** | Tag selector still matches; the demo zooms identically |
| N8 | RLS / auth / i18n | No | No data, auth or copy in scope |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `appImageConfig.ts`, when complete, then `VARIANTS.listing.hoverClass` is absent and a grep
  for Tailwind utility shapes across the file returns zero matches outside comments.
- **AC2 [R2]** — `MantineListingCardPattern.module.css:68` reads `transform: scale(1.1025)` with the Task 764
  rationale comment.
- **AC3 [R3]** — `MantineListingCardPattern.tsx:304` no longer contains `'group'`; lines 305-306 are byte-identical
  to their pre-task state.
- **AC4 [R4]** — `phase-a-pointer-matrix.json` exists with pre- and post-edit values for all four
  context × hover-target combinations, and the coarse rows are enumerated against §9.
- **AC5 [R5]** — `phase-a-transition-curve.json` exists with ≥5 samples per image type, pre and post, and the
  change from two curves to one is stated with its measured values.
- **AC6 [R6]** — Given the settled hover state at `pointer: fine`, when `effectiveScale` is computed from
  `getBoundingClientRect()` before and after the edit, then both agree to 4 decimal places and both round to
  1.1025, width and height ratios agree with each other, and the rest rectangles are identical. The computed
  `transform` and `scale` strings are recorded as diagnostics and their change (`matrix(1.05…)`→`matrix(1.1025…)`,
  `1.05`→`none`) is **expected**, not a failure.
- **AC7 [R7]** — Hovering the title/price area yields the same `effectiveScale` as hovering the image, post-edit,
  to the same precision.
- **AC8 [R8]** — `MantineListingCardPattern.module.css:22-24` no longer claims the guards match, and names what the
  compiled Tailwind guard actually was.
- **AC9 [R9]** — Plants P1 and P2 each observed failing with a retained transcript, then clean after revert.
- **AC10 [R10]** — `npm run check:tailwind-runtime-tokens` reports the same file count, reference count, 0 new debt
  and 0 stale entries as its I0 reading.
- **AC11 [R11]** — `npm run build` exit 0, transcript retained.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** A behaviour-bearing hover change on the homepage's primary card, touching a
migrated Mantine pattern. Q2 would not require the rendered matrix AC6/AC7 depend on. **Not Q4** unless the I0 scan
of `docs/critical-flow-registry.md` names an affected flow — if it does, escalate and add automated regression
evidence.

| Command | Purpose |
|---|---|
| `git status --porcelain` (pre-write, post-gate) | dirty-worktree comparator |
| `node scripts/task764-pointer-probe.mjs` (pre and post) | AC4-AC7 |
| `npm run check:tailwind-runtime-tokens` | AC10 |
| `npm run typecheck` · `npm run lint` | API/lint |
| `npm run test:listings` | `ListingCard` smoke |
| `npm run check:design-tokens -- --strict` | **Expect the same two 763 findings and no third.** `scale(1.1025)` is unitless — if the gate flags it, report a `CONFLICT`; do not add a marker |
| `npm run check:homepage-grid` | card geometry |
| `npm run build-storybook` + `npm run screenshots:responsive -- --mantine-only` | rendered matrix |
| `npm run check:mojibake` · `npm run check:file-integrity` | touched text files |
| `npm run build` | **AC11 hard gate** |

**Viewports:** 320 · 375 · 390 · 768 · 1024 · 1440. **Locales:** all four at 320 and 1440; `uk@320` mandatory.
Read each story's enrolled viewport set from the manifest before claiming a tier is covered.

## 14. Completion report contract

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

1. Changed files vs §7. 2. Requirement IDs completed and not. 3. Every command with actual output and exit code.
4. Evidence locations. 5. **The A1 answer**: what the coarse-pointer rows measured, pre and post, plus the raw `matchMedia` values that
cleared the A2 gate. 6. **The A3 answer**: `effectiveScale` pre and post to 4 decimals for width and height, the
raw rectangles behind them, and the computed `transform`/`scale` strings as diagnostics.
7. The enumerated intentional deltas from §9, each mapped to its measured value. 8. I0 drift. 9. Deviations and
limitations. 10. `docs/backlog.md` updated concisely; narrative in the session log.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | ✅ every rule, line, guard, command and owner quote is in the file |
| Every requirement has a binary AC and a verification method | ✅ R1-R11 → AC1-AC11 |
| Scope names what must not change | ✅ §8; §9 gives a before/after per behaviour |
| Exactly one active route | ✅ route (c). A1's outcome is an **owner decision quoted in §1**, not a task-authored pre-declaration, so no measurement result can fork the plan; A2 and A3 both fail to `BLOCKED`, never to a second route |
| Comparator measures the invariant, not a proxy that the change is designed to move | ✅ corrected after the first filing on owner instruction: `effectiveScale` from `getBoundingClientRect()`. The original AC6 required a byte-identical computed `transform`, which a correct implementation must change — it would have failed the right answer and passed nothing |
| Gates prove changed behaviour, not procedure | ✅ AC6 fixes the invariant, AC4/AC5 fix the *expected* deltas, and P1/P2 require observed failure first |
| Negative flows by applicability | ✅ N8 marked `No` with its reason |
| No uninspected claim | ✅ §3.1-§3.6 each carry their measurement; A1-A3 are labelled and routed to Phase A |
| Baselines account for task-created artifacts | ✅ the probe is created in Phase A and is not an input to any count it could distort |
| Permanent-story gate | ✅ no story added or extended; the probe is a script under `scripts/`, matching existing task-numbered precedent |
| Owner exception traceable | ✅ §1 quotes the 2026-08-21 decision verbatim |
| Kickoff's own facts re-measured after final revision | ✅ §3.1's compiled rule, §3.2's header text, §3.3's transition list and §3.4's tooling gap were each read at filing time; §10.0 re-measures them as freshness |

---

## Handoff

Execute from `tasks/Sprints/Sprint_63_kickoff_prompt_Task_764_Listing_Hover_Fold.md` following
`.claude/skills/execute-task/SKILL.md`. Read the §6 bundle and nothing else. Start at §10.0.
**Do not start until Task 763 Revision 1 is `APPROVED`** — this task edits `appImageConfig.ts`, which 763's
revision also edits.

**FACTS:** §3.1, §3.2, §3.3, §3.5, §3.6, and §3.4's first paragraph (no proof path emulates `pointer: coarse`).
**INFERENCES:** A1 — the coarse-pointer delta itself. Its **outcome is an owner-accepted decision quoted in §1**,
not a task-authored pre-declaration, so no measurement result can fork the route.
**UNKNOWNS:** A2, A3, Q1, and §3.4's `hasTouch: true` hypothesis — which A2 gates.
**CONFLICTS:** None at filing. §13 may produce one at `check:design-tokens`; report it, do not silence it.

**QA profile:** `Q3 Full Visual Matrix`. **Ambiguous requirements:** none.
**Owner decision still needed:** none. D63-E is decided (route c); D63-F remains open and is not this task's.
