# Task 691 — De-Tailwind `MantineListingCardPattern`

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** Mantine-migration slice — de-Tailwind of a canonical pattern
  (`docs/rule-index.md` → "Storybook / Visual Proof" + UI rules).
- **Secondary type:** none. No behavior, no data path, no new component.
- **Origin:** backlog reservation **691**, blocked on Task 693 (overlay dual declaration) — now **APPROVED**.
  Owner sequence 2026-07-31 placed it after step 2 (Task 701 grid gate), which is **APPROVED and landed**.

> **Scope decision, orchestrator, 2026-07-31.** The reservation named `MantineListingCardPattern` (25 className
> sites) **and** `ListingCard.tsx` (8 sites) as one slice. This task takes **only the pattern**;
> `ListingCard.tsx` is reserved as **Task 702**. The cut is at the file boundary precisely because the two files
> communicate through `className` string contracts (§3.4) — slicing here means those contracts do not change in
> either task, so neither can break the other. Task 668 needed seven kickoff revisions at a smaller blast radius;
> this is the bound that avoids repeating it.

---

## 2. Objective

De-Tailwind `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` onto Mantine props and its
**existing** CSS module, preserving every rendered pixel, every marker class, and every cross-file `className`
contract.

---

## 3. Verified context

Every fact below was read in this worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-31.

### 3.1 The file

`src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — **397 lines**, two independent layouts:

| Layout | Lines | Entry |
|---|---|---|
| horizontal | ~162–280 | `className={cn(...)}` at `:162` |
| vertical | ~290–380 | `className={cn(...)}` at `:290` |

### 3.2 The landing zone already exists — do not create a new one

`MantineListingCardPattern.module.css` was created by **Task 602** and carries a documented rationale that is the
governing constraint for this task:

> Mantine's `Card` sets box-shadow/border-color via its **own unlayered CSS**. Tailwind v4 wraps all utilities in
> `@layer utilities`, and per the CSS Cascade Layers spec an unlayered declaration **always** wins over a layered
> one regardless of specificity or source order — so a Tailwind `hover:shadow-*` on a Mantine `Card` can never
> override Mantine's own box-shadow (verified empirically by computed-style diffing). A plain CSS module is
> unlayered too, so it competes on equal footing.

It already holds `.card` (with the TailAdmin §5 flat-border resting state) and `.imageSection`, and scopes `:hover`
to `(hover: hover) and (pointer: fine)`. **Extend this file. Do not add a second module and do not reach for
Tailwind for anything that must beat Mantine's own CSS.**

### 3.3 Marker classes are load-bearing — preserving them is a P0, not a nicety

`.listing-card` is consumed as a **rendered-gate anchor** in two places:

- `scripts/check-stories-rendered.mjs` — the anchor for `system-featuredlistings--default`,
  `system-latestlistings--default`, `system-similarlistings--default` and
  `patterns-mantine-homepagelistinggrids--default` (`:173-181`).
- `scripts/check-homepage-grid.mjs` (Task 701, just landed) — the mechanism-agnostic grid locator is *"first
  `display:grid` inside `#storybook-root` with ≥1 `.listing-card` descendant"*.

These classes are emitted by `ListingCard.tsx` (`listing-card listing-card--horizontal block`,
`listing-card listing-card--vertical block h-full`), **not** by the pattern — so this task does not touch them.
The pattern must keep accepting and forwarding an incoming `className` unchanged (§3.4).

### 3.4 The cross-file `className` contracts — all three must survive byte-identical

| Contract | Producer | Consumer | Current value |
|---|---|---|---|
| Card root class | `ListingCard.tsx` `:201`/`:297` | pattern `className` prop → `cn(...)` at `:162`/`:290` | `listing-card listing-card--horizontal block`, `listing-card listing-card--vertical block h-full` |
| FavoriteButton positioning | `ListingCard.tsx` `:166` | documented at pattern `:73` as a contract | `shrink-0 -mt-0.5 -mr-1` |
| Closed-overlay style | `ListingCard.tsx` `CLOSED_OVERLAY_STYLE[status]` | pattern `:315` `overlay.className` | passed through `cn()` |

The pattern's `className?: string` prop and all three pass-throughs stay. Changing any of them belongs to Task 702.

### 3.5 The 25 className sites, by disposition

Read from source. Every site must appear in the session log with its outcome.

**Group A — Mantine prop equivalents (migrate):** `:178` `absolute top-2 left-2 flex flex-col gap-1`; `:195`
`flex-1 min-w-0`; `:210` `w-full mt-2`; `:270` `min-w-0 max-w-full shrink-0`; `:272`/`:343` `min-w-0`; `:302`
`absolute top-2 left-2 flex flex-wrap gap-1`; `:375` `ml-auto whitespace-nowrap`. `Box`/`Group`/`Stack` already
expose `pos`, `inset`, `flex`, `miw`, `maw`, `w`, `mt`, `ta`, `wrap`, `gap`.

**Group B — icon sizing (migrate):** `:189`/`:271`/`:324`/`:342` `h-3 w-3`, `:342` `shrink-0`. `lucide-react`
takes a numeric `size` prop; `h-3 w-3` = 12px. Prefer `size={12}` over a class.

**Group C — typography (migrate to props or the module):** `:205`/`:338` `leading-snug`; `:229`
`text-2xs text-muted-foreground/70 leading-tight`; `:235`/`:268`/`:348`/`:372` `text-xs text-muted-foreground`,
`text-2xs text-muted-foreground/70`. Mantine `size`/`c`/`lh` cover most; `text-2xs` has no Mantine equivalent and
belongs in the module.

**Group D — overlay chips (migrate to the module):** `:188`/`:323`
`bg-overlay/60 text-overlay-foreground text-xs px-2 py-0.5 rounded-full`; `:312` `bg-overlay/30`. These consume the
overlay token pair now gated by **Task 692**. Moving them to `var(--overlay)`/`var(--overlay-foreground)` in the
module is the correct direction and **does not** break 692's gate — but see §8 on Task 695.

**Group E — must stay in the module, cannot be Mantine props:** `:205`/`:338`
`group-hover:[--text-color:var(--primary)] transition-colors` — a group-hover custom-property assignment;
`:172` `relative w-32 shrink-0 sm:w-44 self-stretch min-h-20 overflow-hidden bg-muted` (responsive width, already
adjacent to `styles.imageSection`); `:348` `border-t pt-2`.

**Group F — do not touch:** the three §3.4 contracts, and `cn()` itself (§8).

### 3.6 Story coverage — canonical, enrolled, and it is the comparator

`src/stories/patterns/mantine/ListingCardPattern.stories.tsx` renders the real pattern and is enrolled in the
`--mantine-only` matrix. `src/stories/mantine/primitives/ListingCard.stories.tsx`,
`FeaturedListings.stories.tsx`, `LatestListings.stories.tsx` and `HomepageListingGrids.stories.tsx` all render it
transitively. Clause 16c applies: the canonical story exists and must keep rendering the real production
component.

### 3.7 What now protects this change — both landed in the last 24h

- **Task 692** `check:homepage-grid`… no: **Task 692** gates the `--overlay`/`--overlay-foreground` dual
  declaration, so Group D cannot silently lose its token source.
- **Task 701** `npm run check:homepage-grid` asserts Featured/Latest column steps at 1440, the 16px/12px gaps, the
  header-row geometry, no-horizontal-scroll and the 1408px container cap — with a per-invariant planted-violation
  self-test. This card sits **inside** those grids. Run it.

### 3.8 Start state

`git status --porcelain` expected **empty**. Anything else is a **stop and report** plus
`docs/orchestrator-dirty-worktree-manifest-template.md`.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.5 | Every Group A/B/C/D site moves off Tailwind onto a Mantine prop or `MantineListingCardPattern.module.css`. `grep -c className` on the file drops to the Group E/F residue only, and every remaining site is justified in the log by group. | P0 | AC1 | Confirmed |
| R2 | §3.2 | New styling lands in the **existing** module. No second `.module.css`, no new global CSS, no `@layer` workaround. | P0 | AC1 | Confirmed |
| R3 | §3.3, §3.4 | `ListingCard.tsx` is **not edited**. The pattern keeps `className?: string` and forwards it, keeps the FavoriteButton positioning contract, and keeps `overlay.className` pass-through — all byte-identical. | P0 | AC2, AC5 | Confirmed |
| R4 | §3.5 D | Overlay chips consume `var(--overlay)`/`var(--overlay-foreground)` directly in the module. No `bg-overlay*`/`text-overlay-foreground*` utility remains in this file. | P0 | AC1 | Confirmed |
| R5 | cl. 12, D26 | Rendered proof vs a baseline captured **in this session**: 0 FAIL, 0 verdict changes across the enrolled matrix; every md5-changed cell attributed under `docs/storybook-governance.md` §14.11 (D26) or the documented noise set, with a same-tree stability control (D26 condition 4). | P0 | AC3 | Confirmed |
| R6 | §3.7 | `npm run check:homepage-grid` exits 0 **after** the change. | P0 | AC3 | Confirmed |
| R7 | cl. 16 | Every value written is traced to `docs/tailadmin-style-reference.md` or preserved verbatim from the Tailwind utility it replaces. A value with neither is a **stop and report** (clause 16a). | P0 | AC4 | Confirmed |
| R8 | cl. 9, 14 | `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` **28**/0/0 or lower with the delta explained per file; `vitest` no new failure; `check:file-integrity`/`check:mojibake` clean after the records; `npm run build` exit 0 with the full 54-row route table. | P0 | AC5 | Confirmed |
| R9 | cl. 10 | Session log + `docs/backlog.md`, backlog at **80 lines**. | P1 | AC6 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — zero rendered change is the whole claim.** This is a mechanism swap. Any perceptual pixel difference is a
  **stop and report**, not something to explain.
- **A2 — the cascade-layer constraint is settled (§3.2).** If a migrated value appears not to apply, the cause is
  almost certainly Mantine's unlayered CSS winning. Move it into the module; do not add `!important`, do not add a
  Tailwind layer override, do not raise specificity artificially. If neither prop nor module works, **stop**.
- **A3 — `cn()` stays.** It is `twMerge(clsx())` and a residual Tailwind dependency (recorded as `P3` in the Task
  662 review), but removing it changes the `className` merge semantics the §3.4 contracts rely on. Out of scope.
- **A4 — `text-2xs` has no Mantine equivalent.** Preserve its computed value in the module; do not round it to
  `size="xs"`.
- **A5 — do not migrate `ListingCard.tsx`,** even for a one-line icon size. Task 702.

**Open questions — none.**

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 3, 5, 9, 11, 12, 14, 16/16a/16b/16c.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row.
4. `docs/mantine-responsive-design-system.md` — style props, responsive props, §18.
5. `docs/tailadmin-style-reference.md` — card chrome §5, typography.
6. `docs/storybook-governance.md` §14.11 (D26) and §8.1's noise set via the Task 698 session log.
7. `docs/backlog.md` — **80 lines**.

**Source pre-read**

8. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — **in full**.
9. `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — in full; §3.2 is its header.
10. `src/modules/listings/components/ListingCard.tsx` `:160-210`, `:240-300` — the three contracts, read-only.
11. `src/modules/locations/components/PopularLocationsView.tsx` + `.module.css` — the Task 688 de-Tailwind
    precedent for this exact shape.
12. `scripts/check-homepage-grid.mjs` — the locator that depends on `.listing-card`.

## 7. Scope

| Path | Action |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | modify |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | modify — extend |
| `docs/backlog.md` | modify — **80 lines** |
| `docs/sessions/2026-08-01-task691-listingcardpattern-detailwind.md` | create |

Nothing else. `src/modules/listings/components/ListingCard.tsx` is **read-only**.

## 8. Out of scope

- **`ListingCard.tsx`** — Task 702.
- **`cn()` removal** — A3.
- **Task 695** (deleting the `@theme` overlay copy). This task *reduces* `bg-overlay*` utility usage, moving 695
  closer, but does not trigger it. If this task removes the **last** `bg-overlay*`/`text-overlay-foreground*`
  utility in the repository, that is a finding to **report**, not to act on — 695 must then update Task 692's gate.
- **Any behavior, prop-shape, DOM-structure or accessibility change.**
- **`SimilarListings`' unmigrated grid** (Task 701 A4).
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** The canonical listing-card pattern mixes Mantine components with ~25 Tailwind `className` sites —
layout, icon sizing, typography, overlay chips and a group-hover custom-property trick — alongside a CSS module
that already exists because Tailwind provably cannot override Mantine's unlayered card CSS. It renders inside the
homepage Featured/Latest grids and the listings surfaces.

**Required after.** Layout, icon sizing, typography and overlay chips come from Mantine props or the existing
module. Only the Group E residue and the three §3.4 contracts keep a `className`, each justified. Every rendered
pixel is unchanged, proven against a same-session baseline. `ListingCard.tsx` is untouched, so both contracts and
the load-bearing `.listing-card` anchors are intact.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain` verbatim (§3.8). Record md5 of `ListingCard.tsx`.

**I1 — baselines.** `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`, `check:design-tokens`,
`vitest`. Then `build-storybook` + `screenshots:assert -- --mantine-only` as the R5 baseline, and a **second** run
on the identical tree as the D26 stability control. Then `npm run check:homepage-grid` — record it passing
**before** any edit.

**I2 — inventory.** Write the §3.5 table into the session log with all 25 sites and a planned disposition each,
**before** editing. A site with no disposition is a stop.

**I3 — migrate Groups A–D.** Prop first, module second. Cite the §3.5 group per site.

**I4 — Group E into the module.** Reproduce the computed values, not the utility names. `group-hover:` becomes a
`:hover` rule on the card scoped like the existing `.card` rules (§3.2's `(hover: hover) and (pointer: fine)`
guard).

**I5 — contracts intact (R3).** `git diff` must show **no** change to `ListingCard.tsx`; re-verify its md5. Confirm
the pattern still declares `className?: string` and still forwards it, the FavoriteButton contract string is
untouched, and `overlay.className` still reaches `cn()`.

**I6 — grid gate (R6).** `npm run check:homepage-grid` → exit 0. This is the fastest signal that the card still
sits correctly inside the grids.

**I7 — rendered proof (R5).** Fresh `build-storybook` + `screenshots:assert -- --mantine-only` vs I1's baseline.
0 FAIL, 0 verdict changes; partition every md5-changed cell under D26 or the noise set, recording "0 changed
cells" rows rather than omitting a noise story.

**I8 — gates (R8).** Re-run the I1 suite. For `check:design-tokens`, quote the per-file before/after — this task
should not raise the count, and any reduction must be attributed.

**I9 — `npm run build` last**, exit 0, full 54-row route table verbatim.

**I10 — records, then encoding gates.** Session log per §14; `docs/backlog.md` (**80 lines**). Then
`check:file-integrity` and `check:mojibake`; quote the counts.

**Order:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

## 11. Positive and negative flows

### Positive flow

A developer changes card chrome once, in the module or a Mantine prop, and both layouts follow. `check:stories`
finds no forbidden raw control, `check:design-tokens` finds no new raw value, `check:homepage-grid` confirms the
card still yields 4/3 columns at 1440 with 16px/12px gaps, and the rendered matrix is byte-identical.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **A migrated value silently does not apply** | **Yes** | §3.2, A2 | cascade-layer cause; move to the module, never `!important` | AC1, AC3 |
| **A marker class is dropped or renamed** | **Yes** | §3.3 | `ListingCard.tsx` untouched; `check:homepage-grid` would fail loudly | AC2, AC3 |
| **A `className` contract changes shape** | **Yes** | §3.4 | all three byte-identical | AC2 |
| **Overlay chip loses its token source** | **Yes** | §3.5 D, R4 | `var(--overlay*)` in the module; Task 692's gate stays green | AC1 |
| **The last `bg-overlay*` utility disappears** | **Yes** | §8 | report as a finding; do not act — it is Task 695's trigger | AC4 |
| **A value invented rather than traced** | **Yes** | R7, cl. 16a | stop and report | AC4 |
| **Small viewport (<640)** | **Yes** | cl. 11 | `noHorizontalOverflow` true at 320/375/390; horizontal layout is the mobile one | AC3 |
| **All four locales** | **Yes** | cl. 7 | zero new keys; parity 2215×4 | AC5 |
| **Hover on touch** | **Yes** | §3.2 | keep the `(hover: hover) and (pointer: fine)` guard | AC1 |
| Validation / RLS / data path | No | Presentational pattern only | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers card chrome | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2, R4]** — every Group A–D site is off Tailwind, new styling is in the **existing** module, overlay
  chips read `var(--overlay*)`, the hover guard survives, and each remaining `className` is justified by group.
- **AC2 [R3]** — `git diff` shows `ListingCard.tsx` unchanged (md5 match), and all three §3.4 contracts are
  byte-identical.
- **AC3 [R5, R6]** — `check:homepage-grid` exits 0; the rendered run shows 0 FAIL and 0 verdict changes with every
  changed cell attributed under D26 or the noise set, plus a same-tree stability control.
- **AC4 [R7]** — every written value traces to TailAdmin or to the utility it replaces; the §8 last-utility case
  is reported if it occurs.
- **AC5 [R3, R8]** — `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4;
  `check:design-tokens` per-file before/after quoted; `vitest` no new failure; integrity/mojibake 0 after the
  records; `npm run build` exit 0 with the full 54-row route table.
- **AC6 [R9]** — session log exists; `docs/backlog.md` at exactly 80 lines.

## 13. QA profile and verification plan

**`Q3 — Full Visual Matrix`.** Card chrome and typography are in scope on a surface rendered by five stories and
both homepage grids. The comparator is the enrolled `--mantine-only` matrix under **D26** (§14.11), plus
`check:homepage-grid` as a second, independent structural check that the card still behaves inside the grid. Both
must pass. TailAdmin side-by-side evidence is required for any chrome value written (R7, clause 16).

**Not Q4.** No gate is authored and no critical-flow row is touched.

## 14. Completion report contract

Session log at `docs/sessions/2026-08-01-task691-listingcardpattern-detailwind.md`:

1. `Files Changed` matching the real diff. If a file is modified, say **modified** (Task 693 review F3).
2. I0/final `git status --porcelain` plus `ListingCard.tsx` md5 at both ends.
3. R1–R9 → AC1–AC6 with evidence.
4. **The §3.5 inventory with all 25 sites and their actual outcome**, group by group.
5. The full diff of both changed files.
6. The rendered comparison with the changed-cell partition including "0 changed cells" rows, and the stability
   control.
7. `check:homepage-grid` output before and after.
8. `check:design-tokens` per-file before/after.
9. Every command with its actual exit code; the build tail verbatim with the full 54-row route table.
10. Deviations and limitations — at minimum whether any `bg-overlay*` utility survives elsewhere in the repo (§8).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. No
self-approval; no mutating git.

**Handoff:** execute from `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md` under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — all 25 sites grouped with line numbers, the module's governing rationale quoted, the three cross-file contracts tabulated, the two protecting gates named, and the story set listed |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC6 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, §3.3, §3.4, R3, and A5's explicit ban on touching `ListingCard.tsx` |
| QA profile + canonical decision record | **Yes** — §13 Q3 under D26 plus the independent grid gate; clause 16c satisfied by §3.6 |
| Negative flows selected by applicability | **Yes** — §11, incl. the cascade-layer branch, the marker-class branch and the last-overlay-utility branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1/§3.5 are read from source with line numbers; §3.2 quotes the module header; §3.3 quotes both gate consumers; §3.6 lists real story files |
| Gates prove the changed behavior | **Yes** — byte-level rendered comparison under D26 **and** a structural grid gate that fails if the card stops yielding the expected columns |
| Single active owner route | **Yes** — forks are only stop conditions: non-empty I0, an unstyleable value, an invented value, a perceptual pixel change, the last `bg-overlay*` disappearing |
| Baselines account for task-created artifacts | **Yes** — I1 captures the rendered baseline, its stability control and a passing `check:homepage-grid` *before* any edit |
| Dirty-worktree handling | **Yes, declared** — §3.8 |

**Known-risk note for the reviewer.** Three likely defects. First, **fighting the cascade** — a migrated hover or
border value will appear not to apply, and the tempting fixes (`!important`, a Tailwind layer override, an
artificially specific selector) all mask the real cause that §3.2 already diagnosed for this exact file. Second,
**quietly editing `ListingCard.tsx`** for a one-line icon size — that file emits the `.listing-card` anchors two
CI gates depend on, and it is Task 702's subject. Third, **rounding `text-2xs` to `size="xs"`** — it has no
Mantine equivalent, and the substitution is invisible in a diff review but visible on screen.
