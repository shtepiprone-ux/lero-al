# Task 708 — Repair the dead `heroSearchWrapInBand` gate and re-anchor it de-Tailwind-stably

**Sprint:** 49 (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`). **Epic:** MM Phase-2.
**Blocks:** Task 709 (`HeroSearchView` de-Tailwind) — per **D32**, 709 may not start until this task lands.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance / gate repair** (`docs/rule-index.md` → "Validation & gates").
- **Secondary type:** a two-attribute, zero-render product edit in `HeroSearchView.tsx` that exists only to give the
  gate a stable anchor.
- **This is not a UI task.** No visual value, class, prop, token or layout changes. If you find yourself changing how
  something *looks*, you have left scope — stop and report.

> **Read this first.** You are repairing a gate that has been silently passing for ~5 weeks. The entire point of the
> task is that the repaired gate **can genuinely fail**. A green run proves nothing here; only a planted violation
> that turns the run red proves the repair. If you cannot make it fail, the task is `BLOCKED`, not `IMPLEMENTED`.

---

## 2. Objective

1. Re-anchor the `heroSearchWrapInBand` DOM assertion (`scripts/check-stories-rendered.mjs:1237-1259`) off the three
   Tailwind classes Task 652 deleted, onto hooks that survive Task 709's de-Tailwind (**D33**).
2. Add exactly two `data-testid` hooks to `HeroSearchView.tsx` — one on the search-bar card, one on the control row —
   with **zero** rendered delta.
3. Re-anchor the one class-coupled assertion in `heroSearch.smoke.test.tsx:178` onto the same hook, so 709's diff is
   purely a module swap and does not have to touch a test.
4. **Prove the repaired gate fails** on a planted violation, and prove the repaired smoke assertion fails on a planted
   violation. Persist both transcripts.

**Non-goals, stated as objectives so they are not silently attempted:** no `className` edit in `HeroSearchView.tsx`;
no change to any other assertion in the harness; no new viewport, story, or locale; no change to
`MANTINE_STORY_EXTRA_VIEWPORTS`; `check:design-tokens` must still read **23**.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on **2026-08-03**.
Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 The defect, at source

`scripts/check-stories-rendered.mjs`, inside `captureCell`:

```js
1235    let heroSearchWrapInBand = null;
1236    if (story.componentName === 'HeroSearch' && viewport.width >= 640 && viewport.width < 768) {
1237      heroSearchWrapInBand = await page.evaluate(() => {
…
1246        const card = Array.from(document.querySelectorAll('#storybook-root .bg-background'))
1247          .find((el) => el.classList.contains('border') && el.classList.contains('shadow-xl'));
1248        const container = card?.querySelector(':scope > .flex.flex-wrap');
1249        if (!container) return null;
…
1254        if (controls.length !== 4) return null;   // late/partial render — not a layout verdict
1258        return searchTop > locationTop + 1;
1259      });
1260    }
1261    cell.assertions.heroSearchWrapInBand = heroSearchWrapInBand;
```

**`.bg-background`, `.border` and `.shadow-xl` no longer exist on that element.** `HeroSearchView.tsx:91-95` is now:

```jsx
<Box
  bg="gray.1"
  bd="1px solid var(--mantine-color-gray-2)"
  className="rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3"
>
```

Task 652 replaced the colour/border classes with Mantine style props. The gate's own in-file comment still quotes the
pre-652 string `"bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3"` — the comment is the fossil that
dates the breakage. `grep -n "bg-background\|shadow-xl" src/components/shared/HeroSearchView.tsx` returns **only** a
prose comment at `:77`, no live class.

So `card` is `undefined` → `container` is `undefined` → the function returns `null`.

### 3.2 Why `null` is silently a pass — both consumers, read at source

```js
 680    if (cell.assertions.heroSearchWrapInBand === false) return false;      // isTransientFailure
1276    const hardPass = noOverflow && !geometryHardFail && heroSearchWrapInBand !== false && …
1822    if (cell.assertions.heroSearchWrapInBand === false) console.error('    ✗ HeroSearch: …');
```

Every consumer tests `=== false` / `!== false`. `null` satisfies all three. The gate cannot fail while it returns
`null`, and it returns `null` unconditionally.

### 3.3 Measured proof that it is dead — not inferred

From the official run `.screenshots/rendered-assert/2026-08-03T15-13/manifest.json` (1184 cells):

| Fact | Value |
|---|---|
| `herosearch` cells total | **40** — `mantine-primitives-herosearch--default` 20 + `--fallback` 20 |
| Viewports per story | `mobile-320` · `mobile-375` · `mobile-390` · `desktop-1024` · **`band-700`** |
| `band-700` cells | **8** (2 stories × sq/en/uk/it) — the only cells where the assertion can produce a verdict |
| `heroSearchWrapInBand` values across all 40 cells | **`null` × 40**, including all 8 `band-700` |
| Verdicts | `pass` × 40 |

**Re-verify this yourself before your first edit** with the §9 I1 command. If your baseline shows anything other than
`null` in all 8 `band-700` cells, stop and report — the premise of this task has changed.

The extra viewport itself is healthy: `MANTINE_STORY_EXTRA_VIEWPORTS` (`:417`) keys `HeroSearch → band-700 (700×812)`
at `:418`, off the `componentName` derived at `:457` (`e.title.slice(matchedPrefix.length)`), and the 8 cells are
genuinely captured. **Only the DOM assertion inside is dead.** Do not touch the viewport wiring.

### 3.4 The anchor targets in `HeroSearchView.tsx`

| Role | Line | Current element | What the gate needs from it |
|---|---:|---|---|
| Search-bar card | **:91-95** | `<Box bg="gray.1" bd="…" className="rounded-b-[…] sm:rounded-tr-[…] p-3">` | Uniquely identify it inside `#storybook-root` |
| Control row | **:103** | `<Box className="flex flex-wrap md:flex-nowrap gap-2">` | Its 4 element children, in source order |

The original comment's warning is still valid and is why the card needs a *unique* hook: `.storybook/preview.tsx`'s
`withTheme` wraps **every** story in an outer `<div class="min-h-screen bg-background text-foreground">`, so a
non-specific selector resolves to the theme wrapper first. A `data-testid` cannot collide with it.

**Both are Mantine `Box`.** `Box` forwards unknown props to the underlying DOM element, so `data-testid` lands as a
real attribute (same mechanism `AgentCtaButton`'s `data-track="register"` already relies on, and
`HeroSearchFallback.tsx:23`'s `data-testid="hero-search-fallback"`, which is itself a live gate anchor at
`check-stories-rendered.mjs:185`). **Verify this in the rendered DOM (§9 I3), do not assume it.**

### 3.5 `data-testid` is the precedented anchor, and it is de-Tailwind-stable

| Candidate anchor | Verdict |
|---|---|
| **`data-testid`** | ✅ **Use this.** Already the harness's anchor mechanism (`ASSERT_STORIES` `anchors: [{type:'testid'}]`, `:185`). Invisible, unstyled, untouched by any de-Tailwind. |
| `.hero-search` marker class (`:49`) | Only on the **outer** wrapper, not the card or the row; and it is 709's job to preserve it, not this task's to depend on it. Not sufficient alone. |
| Any other Tailwind class | ❌ **Forbidden by D33.** Re-anchoring onto `.p-3` or `.gap-2` would move the same time-bomb three lines down and 709 would re-break it. |
| A Mantine generated class | ❌ Hashed and version-coupled. |

### 3.6 The one class-coupled test — repair it here, not in 709

`src/components/shared/__tests__/heroSearch.smoke.test.tsx:178`, inside the Task 572 structural test:

```js
176    const container = searchButton.parentElement
177    expect(container).not.toBeNull()
178    expect(container).toHaveClass('flex', 'flex-wrap', 'gap-2')
181    expect(filtersButton.parentElement).toBe(container)
183    expect(container?.children.length).toBe(4)
```

`:178` asserts literal Tailwind class names and **will break in 709**. Re-anchor it onto the control-row
`data-testid` in this task, so 709's diff is a pure module swap. `:181` and `:183` assert real structure and must be
kept **unchanged** — they are the actual value of this test.

**Precedent:** Task 671 hit exactly this in `filtersPanelShell.smoke.test.tsx:203` and rewrote the class-coupled
assertion onto the real mechanism rather than deleting it. Follow that, not deletion. The file has **6** tests; it must
still have 6 and they must all pass.

### 3.7 Gate exposure — measured

| Gate / registry | Exposure | Evidence |
|---|---|---|
| `docs/critical-flow-registry.md` row 50 | **Applies.** It names `HeroSearchView` and Tasks 566/567/568/571/572 explicitly, and cites Task 573's band gate as the authoritative persisted proof for the 640–767 behaviour. This task repairs that proof. Its named command is `npx vitest run … heroSearch.smoke.test.tsx` + `npm run screenshots:assert -- --mantine-only`. | read 2026-08-03 |
| `check:design-tokens` | Live `--strict` total **23**. `HeroSearchView.tsx` contributes **0** and must continue to. A `data-testid` is not a style value. | live run 2026-08-03 |
| `scripts/mantine-migration-scope.json` | `HeroSearchView.tsx` enrolled at `:6`. Membership must not change. | read 2026-08-03 |
| `screenshots:assert` plant mode | **None exists.** Unlike `check:homepage-grid:verify` / `check:hydration:verify` / `check:header-id-parity:verify` / `check:listing-visibility:verify`, there is no `--verify-gate` for this harness. Your AC2 plant is therefore **manual and must be persisted**; do not invent a script flag. | `package.json` read 2026-08-03 |

### 3.8 Worktree state at design time

At design time HEAD is `7852a183e` with Task 707's **7** paths modified/untracked and approved, pending owner commit.
**Re-verify with your own pre-write `git status --porcelain` snapshot before your first edit.** If 707 is already
committed your tree should be clean; if it is not, reconcile against the snapshot and do not touch any 707 path.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | The `heroSearchWrapInBand` assertion returns a real boolean — not `null` — in all **8** `band-700` cells. | P0 | AC1 |Confirmed|
| R2 | D32, §3.7 | The repaired gate is shown to genuinely FAIL on a planted layout violation, with the run's non-zero result persisted. | P0 | AC2 |Confirmed|
| R3 | D33, §3.5 | Neither the gate nor the test re-anchors onto any Tailwind class. Both anchors survive a `className` swap. | P0 | AC3 |Confirmed|
| R4 | §3.4 | `HeroSearchView.tsx` gains exactly two `data-testid` attributes and **nothing else** — no class, prop, element, or ordering change. | P0 | AC4 |Confirmed|
| R5 | D26 | All **40** enrolled `herosearch` cells keep their pre-task PNG md5 and verdict. A `data-testid` renders nothing. | P0 | AC5 |Confirmed|
| R6 | §3.6 | `heroSearch.smoke.test.tsx` still has 6 tests, all passing, with `:181`/`:183` unchanged and `:178` re-anchored. | P0 | AC6 |Confirmed|
| R7 | §3.6 | The re-anchored smoke assertion is itself shown to fail on a planted structural violation. | P1 | AC7 |Confirmed|
| R8 | §3.3 | No other `cell.assertions.*` value changes for any cell in the run. | P0 | AC8 |Confirmed|
| R9 | §3.7 | `check:design-tokens` still totals **23**, with no entry for any touched file. | P1 | AC9 |Confirmed|
| R10 | agent-contract cl. 9 | `npm run build` exits 0, with the actual transcript persisted to a named path. | P0 | AC10 |Confirmed|
| R11 | agent-contract cl. 14 | Touched files stay UTF-8 without BOM, no mojibake. | P2 | AC11 |Confirmed|

---

## 5. Assumptions and open questions

- **A1.** Mantine `Box` forwards `data-*` to the DOM element. Precedented by `AgentCtaButton`'s `data-track` and
  `HeroSearchFallback`'s `data-testid`, **but verify it on the rendered DOM at I3 before relying on it.**
- **A2.** `data-testid` attributes are inert for layout and paint, so AC5's md5 identity should hold exactly. If any
  cell's md5 moves, that is a finding to report with per-cell attribution — **not** something to absorb into a
  tolerance.
- **A3.** The gate's existing `controls.length !== 4` and `searchTop > locationTop + 1` logic is **correct** and is not
  in scope. You are changing *how the container is found*, not *what is asserted about it*.

### 5.1 Naming — decided, do not re-litigate

Use `data-testid="hero-search-card"` on the card (`:91`) and `data-testid="hero-search-controls"` on the control row
(`:103`). Both are unused repo-wide (`grep -rn "hero-search-card\|hero-search-controls" src scripts` returns nothing —
**re-verify before adding them**), and both match the existing `hero-search-fallback` naming shape.

### 5.2 Nothing is left ambiguous

There is no unresolved owner decision. D32 fixes the sequencing, D33 fixes the anchor class.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 50 in full** — §3.7 argues its applicability from it; verify that yourself).

**Because this is a gate change:** `docs/storybook-governance.md` §14.11 (D26) and §14.9.17 · `docs/qa-rules.md`.

**Task-specific sources:** this file · `tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md` ·
`scripts/check-stories-rendered.mjs` (the `captureCell` region `:1220-1280`, the consumers at `:678-682` and `:1822`,
and the viewport wiring at `:399-445` incl. the `:417-418` declaration — read it, do **not** edit the viewport wiring) ·
`src/components/shared/HeroSearchView.tsx` · `src/components/shared/__tests__/heroSearch.smoke.test.tsx` ·
`src/stories/mantine/primitives/HeroSearch.stories.tsx` (the proof story — read it, do not edit it).

---

## 7. Scope

- `scripts/check-stories-rendered.mjs` — the `page.evaluate` body at `:1246-1248` only, plus its stale comment.
- `src/components/shared/HeroSearchView.tsx` — two `data-testid` attributes only (`:91` card, `:103` control row).
- `src/components/shared/__tests__/heroSearch.smoke.test.tsx` — line `:178` only.
- Nothing else.

---

## 8. Out of scope

- **Every story file**, including `src/stories/mantine/primitives/HeroSearch.stories.tsx`. A story diff means scope
  leaked.
- `MANTINE_STORY_EXTRA_VIEWPORTS`, `MANTINE_VIEWPORTS`, `ASSERT_STORIES`, `discoverMantinePrimitiveStories`, and every
  other assertion in the harness (`fullWidthControlsAtMobile`, `fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`,
  `visualIntegrity`, `styleIntegrity`). Their identical `null`-by-default shape is **Task 710's** subject, not yours —
  record anything you notice as a finding.
- Any `className` in `HeroSearchView.tsx` — that is **Task 709**.
- `PropertyTypeCombobox.tsx`, `LocationCombobox.tsx`, `MantineCountButton.tsx`, `FiltersPanel.tsx`, `HeroSearch.tsx`,
  `HeroSearchFallback.tsx`, `page.tsx`.
- Adding a `--verify-gate` mode to this harness (§3.7). Tempting, larger blast radius, not this task.

---

## 9. Current and required behavior

**Current:** the 640–767px band assertion the critical-flow registry names as its authoritative proof returns `null`
in every cell and cannot fail. `HeroSearchView.tsx` has no stable test hook; both the harness and one smoke assertion
identify its DOM by Tailwind class name.

**Required after:** the assertion returns a real boolean in all 8 `band-700` cells and is demonstrably capable of
failing; both the harness and the smoke test identify the DOM by `data-testid`; the rendered output is byte-identical.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Run `npm run screenshots:assert -- --mantine-only`. Persist (a) the
  `heroSearchWrapInBand` value for all 40 `herosearch` cells — expect `null` × 40 — and (b) the PNG md5 + verdict for
  all 40. Record `check:design-tokens` (expect **23**) and `git status --porcelain`. **A baseline captured after an
  edit is not a baseline.**
- **I2 — Confirm the anchors are unused.** `grep -rn "hero-search-card\|hero-search-controls" src scripts .storybook`
  → expect zero hits. Quote the result.
- **I3 — Add the two hooks, then witness them in the real DOM.** Add both `data-testid`s, rebuild Storybook, and
  capture the rendered `band-700` DOM proving both attributes are present on the expected elements and that the
  control row still has exactly 4 element children. This is the A1 verification.
- **I4 — Re-anchor the gate**, then the smoke assertion. Rewrite the now-fossil comment at `:1238-1245` (it explains
  why `.bg-background` alone was ambiguous — a warning about classes that no longer exist) to describe the new anchor
  and to state why a class-based anchor is forbidden (D33).
- **I5 — Prove both can fail (AC2, AC7).** See below.
- **I6 — Re-run** the full evidence set and diff against I1.

---

## 10. Implementation requirements

1. **The gate must return `false`, not `null`, when the layout is wrong.** After the repair, a missing container is
   still legitimately `null` (late render). But with the story rendering normally at 700px, the result must be a
   boolean. If your repaired selector cannot find the container on a healthy render, you have not repaired it.
2. **Do not change what is asserted** — `controls.length !== 4` and `searchTop > locationTop + 1` stay byte-identical
   (A3).
3. **Do not re-anchor onto a Tailwind class** (D33). This includes `.p-3`, `.gap-2`, `.flex`, `.flex-wrap`.
4. **`HeroSearchView.tsx` gets attributes only.** Not a class, not a prop, not an element, not a reordering. The
   correct diff for that file is exactly two changed lines.
5. **Keep `:181` and `:183` of the smoke test unchanged.** Only `:178` moves onto the hook.
6. **Preserve `'use client'`** and every existing prop, comment block, and `styles={{…}}` object.
7. **Run `check:file-integrity` and `check:mojibake` LAST**, after the session log and backlog row exist — otherwise
   they report a stale denominator (707 finding N6, third recurrence; a fourth is a P2).

---

## 11. Positive and negative flows

**Positive flow:** `npm run screenshots:assert -- --mantine-only` runs the Mantine gate; the 8 `band-700` HeroSearch
cells now evaluate the row structure and report `true`; all other cells and assertions are unchanged; the run's
summary totals are identical to I1.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Healthy render at 700px | **Yes** | The 8 `band-700` cells | assertion returns `true` | AC1 |
| Planted layout violation | **Yes** | I5 Arm A | assertion returns `false`; run reports a FAIL and the `:1822` message | AC2 |
| Late / partial render | **Yes** | `:1249`, `:1254` — unchanged | still returns `null`, still not a verdict | AC8 — no new failures across the other 1144 cells |
| Outside the band (<640, ≥768) | **Yes** | `:1236` width guard — unchanged | `null`, as designed | AC1 — the other 32 herosearch cells stay `null` |
| Planted structural violation in jsdom | **Yes** | I5 Arm B | the re-anchored smoke assertion FAILS | AC7 |
| `--fallback` story | **Yes** | It has no search card | `null` at every viewport, including `band-700` | AC1 — `--fallback` must not start returning a boolean |
| Locale expansion | **Yes** | sq/en/uk/it | identical verdict in all 4 | AC1 — all 8 band cells |
| Small viewport / touch targets | **No** | No layout, class or size changes | N/A | — |
| RLS / authorization | **No** | Presentational; the harness reads static stories | N/A | — |
| Hydration | **No** | `data-*` attributes are identical server and client | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the post-change `--mantine-only` run, when the 40 `herosearch` cells are read from
  `manifest.json`, then `heroSearchWrapInBand` is `true` in **all 8** `…--default × band-700` cells, and `null` in the
  32 non-band cells **and** in `--fallback`'s band cells. Report the actual per-cell values from a real run.
- **AC2 [R2]** Given a **planted layout violation** — force the Search button back onto row 1 in the band, e.g. by
  overriding its `flex-basis` so it no longer wraps — when `npm run screenshots:assert -- --mantine-only` re-runs,
  then `heroSearchWrapInBand` is **`false`** in the 4 `--default × band-700` cells, the run reports a genuine FAIL,
  and `:1822`'s message appears in the transcript. **Persist the failing transcript and the `manifest.json`.** Then
  revert the plant exactly and re-run to green. If the run stays green with the plant in place, the gate is still
  blind and the task is **`BLOCKED`**, not `IMPLEMENTED`.
- **AC3 [R3]** Given the final `check-stories-rendered.mjs` and `heroSearch.smoke.test.tsx`, when the changed
  selectors are read, then neither contains a Tailwind class token, and both would still resolve if every `className`
  in `HeroSearchView.tsx` were replaced with a CSS-module class. State how you verified the second half.
- **AC4 [R4]** Given `git diff src/components/shared/HeroSearchView.tsx`, when it is read, then it shows exactly two
  changed lines, both adding only a `data-testid` attribute, and no other hunk.
- **AC5 [R5]** Given the post-change run, when its 40 `herosearch` PNG md5s and verdicts are compared against I1 under
  the `docs/storybook-governance.md` §14.11 (D26) comparator, then **all 40 are identical**. A changed cell is a
  finding with per-cell attribution, never absorbed into a tolerance.
- **AC6 [R6]** Given `npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx`, when it runs, then
  **6/6 PASS**, and `git diff` on that file shows a single changed line (`:178`).
- **AC7 [R7]** Given a planted structural violation (re-nest filters+Search inside an intermediate wrapper, the exact
  pre-572 shape), when the suite re-runs, then the re-anchored test genuinely FAILS; reverted, 6/6 PASS. Persist both
  transcripts.
- **AC8 [R8]** Given the pre- and post-change `manifest.json`s, when every cell's `assertions` object is compared
  field by field **excluding** `heroSearchWrapInBand`, then they are identical for all 1184 cells, and the run
  summary (`total`/`passed`/`failed`/`ambiguousOnly`) is unchanged.
- **AC9 [R9]** Given `npm run check:design-tokens`, when it runs, then the total is **23** — unchanged — with no entry
  for any of the three touched files.
- **AC10 [R10]** Given the final state, when `npm run build` runs, then it exits **0** and **the transcript is written
  to a real file whose path you state**. A transcript claimed but not persisted is a review finding (707 N7).
- **AC11 [R11]** Given the touched files, when `npm run check:file-integrity` and `npm run check:mojibake` run
  **after** the session log and backlog row are written, then both pass and the reported file counts match the real
  changed-file set.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `docs/qa-profiles.md:16` routes work claiming a gate to Q4 and requires
"planted-violation failure proof when a gate is claimed". Both conditions hold: this task changes a gate, and
`docs/critical-flow-registry.md` row 50 names Task 573's band assertion as the authoritative persisted proof for the
640–767 behaviour of a registry flow. **Q3 is not sufficient here** — a full visual matrix would be green in every
world, including the current broken one, which is precisely the failure this task exists to correct.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `npm run build-storybook`, then `npm run screenshots:assert -- --mantine-only` (pre-edit, I1) | baseline persisted: 40 cells, `heroSearchWrapInBand` `null` × 40, md5 + verdict list, `manifest.json` path recorded |
| 2 | `npm run check:design-tokens` (pre-edit) | **23** |
| 3 | `npx vitest run … heroSearch.smoke.test.tsx` (pre-edit) | 6/6 PASS — the AC6 baseline |
| 4 | `grep -rn "hero-search-card\|hero-search-controls" src scripts .storybook` (I2) | zero hits |
| 5 | Rendered DOM witness at `band-700` (I3) | both `data-testid`s present on the expected elements; control row has exactly 4 element children |
| 6 | `npm run screenshots:assert -- --mantine-only` (post-edit) | 8 band cells `true`, 32 `null`; 40/40 md5 identical to step 1 (AC1, AC5) |
| 7 | **Planted layout violation + re-run** (AC2) | `false` × 4, run FAILs, `:1822` message present, transcript + manifest persisted; reverted → green |
| 8 | **Planted structural violation + `vitest` re-run** (AC7) | the re-anchored test FAILs; reverted → 6/6 PASS |
| 9 | Field-by-field `manifest.json` diff excluding `heroSearchWrapInBand` (AC8) | identical across all 1184 cells; summary unchanged |
| 10 | `npm run check:design-tokens` (post-edit) | **23**, no entry for the three touched files |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript written to a stated path (AC10) |
| 13 | `npm run check:file-integrity` · `npm run check:mojibake` — **run these last** | pass, counts matching the real changed set (AC11) |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task708-*/` (local-only per **D6**) with assets referenced by path from the
session log.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-03-task708-herosearch-band-gate-repair.md` containing:

1. **Files changed** — a table matching the real `git diff --stat` exactly, reconciled against your own pre-write
   `git status --porcelain` snapshot (§3.8).
2. **Requirement IDs completed** — R1–R11, each with its AC verdict.
3. **Commands run and their actual results** — real exit codes and real numbers, including both planted-violation
   transcripts and the step-12 build transcript **with its persisted path**.
4. **Evidence locations** — I1 baseline (40 cells, both the `heroSearchWrapInBand` values and the md5 list), the I3
   DOM witness, both plant transcripts + the failing `manifest.json`, and the final run's `manifest.json`.
5. **The before/after selector**, quoted, with the D33 argument for why the new anchor survives Task 709.
6. **Any other assertion you noticed with the same `null`-by-default shape** — recorded as a finding for Task 710,
   **not acted on**.
7. **Assumptions, deviations, limitations, unresolved issues.**
8. Concise current state appended to `docs/backlog.md` — **state only**, no history. The file is at its documented
   pre-existing **108**-line breach; do not add net lines, and flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, count and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R11 → AC1–AC11 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8, plus §10.2's "do not change what is asserted" and §10.5's untouched test lines |
| Negative flows selected by applicability, not copied | ✅ §11 — 7 applicable, 3 marked `No` with the reason that makes them inapplicable |
| No uninspected claim | ✅ every line number, count and gate in §3 was read or run on 2026-08-03; the 40-cell `null` census comes from a real manifest, not from reasoning about the code |
| The gate proves the changed behavior, not merely procedure | ✅ AC2 is the whole task — a green run is explicitly declared insufficient, and a still-blind gate is `BLOCKED` |
| Critical flow named or excluded from evidence | ✅ §3.7 names registry row 50 and §13 argues Q4 from it, with Q3 explicitly rejected as unable to distinguish the broken world from the fixed one |
| Owner exceptions have traceable authorization | ✅ D32/D33 recorded in Sprint 49 with date and scope; D26/D6 cited with file and date |
| Exactly one active executable route | ✅ `data-testid` anchoring; §3.5 records the three rejected alternatives so they are not re-litigated mid-execution |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 table + AC2's `BLOCKED` clause + AC5's D26 comparator + AC8's field-by-field exclusion diff |
| Zero/empty input covered | ✅ §11 — late/partial render and the `--fallback` story (no card at all) are applicable branches with named evidence |
| Worktree state established with a pre-write snapshot | ✅ §3.8 — 707's 7 paths named, with an explicit re-verify-and-reconcile instruction |
| Prior-review corrections folded in | ✅ 707's **N7** (AC10 demands a persisted transcript path) and **N6** (§10.7 + AC11 order the counting gates last) |
| Sprint assigned before creation | ✅ Sprint 49, opened first per the 2026-08-01 owner rule |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D32 and D33 close both.
