# Task 609 — `MantineListingDetailPattern` Grid-gutter horizontal-overflow fix (clears the Task 607 tracked xfail)

Sprint 44 (Epic MM Phase-2). Orchestrator-opened 2026-07-16 from the **Task 607 review**. `ListingDetailPattern`
is the ONE remaining non-green cell group in `--mantine-only` — 16 tracked KNOWN-FAILURE cells
(`horizontal-overflow`, 320/375/390/1024 × sq/en/uk/it), pinned in `MANTINE_PATTERN_KNOWN_FAILURES` with
`followUpTask: 609`. This task fixes the real defect and removes the registry entry so the gate goes fully green
with zero tracked failures.

## Pre-read (rule-index: UI/layout task + Storybook gate)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this touches
  the "Listing card / detail rendering" flow group).
- **Required:** `docs/mantine-responsive-design-system.md` (FIRST — §7 mobile gate, §18 Mantine CSS pitfalls),
  `docs/tailadmin-style-reference.md` (visual parity — the fix must be visually byte-identical), `docs/ui-rules.md`,
  `docs/component-rules.md`, `docs/qa-rules.md`.
- **Storybook gate:** `docs/storybook-governance.md` §14 + §14.9.18 (the coverage extension that surfaced this) +
  §14.4 (geometry `horizontal-overflow` check).

## Root cause (from the Task 607 review — confirmed, owner-adjudicated as a REAL defect)
`MantineListingDetailPattern.tsx:50` is `<Grid gutter="lg">` at the pattern ROOT. Mantine `Grid` implements its
gutter by putting a **negative horizontal margin** on `.mantine-Grid-inner` (half the gutter ≈ 10px per side) and a
matching **positive padding** on each `.mantine-Grid-col`. The visible content lines up, but the intermediate
`.mantine-Grid-inner` wrapper's own bounding box extends ~10px past each viewport edge — at 320px it measures
`scrollWidth ≈ 340` vs `clientWidth = 320`. On a real app page an ancestor with `overflow-x` clipping usually
hides this; the pattern in isolation (its Storybook story) has no such ancestor, so the geometry gate correctly
reports `horizontal-overflow` on all 16 cells. It is invisible to the eye (no visible clipping) but a literal
`scrollWidth > clientWidth` violation — exactly the class of bug the gate exists to catch (owner-confirmed
2026-07-15).

## Current behavior to preserve (do NOT regress)
- Two-column layout at `sm+` (gallery `span 8` left, contact `span 4` right); single column stacked at `<sm`.
- The contact `Paper` is `position:sticky; top:80` (`MantineListingDetailPattern.tsx:100`) — the sticky behavior
  MUST still work after the fix.
- Contact CTAs full-width stacked at base, row at `sm+` (P0 mobile gate). Gallery `minHeight:320`. Features
  `SimpleGrid cols={{base:2, sm:3}}`. All visible spacing/gutter must look byte-identical (TailAdmin gate).

## Required after-behavior (the delta)
1. **No `scrollWidth > clientWidth` at any of 320/375/390/1024 × 4 locales** for the `ListingDetailPattern` story —
   the pattern's own box must not bleed past the viewport. Recommended fix: contain the `Grid`'s negative-margin
   gutter at the pattern root (e.g. wrap the `<Grid>` in a `<Box style={{ overflowX: 'clip' }}>` — **`clip`, NOT
   `hidden`**). **Constraint:** `overflow-x: hidden` establishes a scroll container and can BREAK the descendant
   `position:sticky` contact panel; `overflow-x: clip` does not. If the only fix that clears the overflow also
   breaks the sticky contact panel, **STOP and ASK** — do not silently drop the sticky behavior. An equally
   acceptable alternative if it renders visually byte-identical: neutralize the root Grid's negative margin (e.g.
   remove the root `gutter` and express the inter-column gap another way) — but the visible two-column gap must be
   preserved and cited.
2. **Visible layout byte-identical** — same column split, same gap, same sticky, same CTA behavior, all 4 locales.
   Prove side-by-side with the pre-fix render (TailAdmin conformance gate — this is a geometry fix, not a restyle).
3. **Remove the `ListingDetailPattern` entry from `MANTINE_PATTERN_KNOWN_FAILURES`** in
   `scripts/check-stories-rendered.mjs` — the defect is fixed, so the tracked-xfail pin is no longer needed (leaving
   it inert would be dead governance state). After removal + fix, the 16 cells flip FAIL→PASS and
   `--mantine-only` reports **0 KNOWN-FAILURE, 0 FAIL, exit 0**.

## Positive flow
`npm run screenshots:assert -- --mantine-only` → `ListingDetailPattern` 16/16 PASS (no `horizontal-overflow`);
overall 873/900 PASS, 0 FAIL, 0 KNOWN-FAILURE, 27 AMBIGUOUS (pre-existing, unchanged), exit 0. Real
`/[locale]/listings/[slug]` page (once wired) and the Storybook story both render the two-column→single-column
layout with the sticky contact panel intact at every breakpoint × locale.

## Negative flow
- Fix clears overflow but breaks `position:sticky` on the contact panel → **STOP and ASK** (do not ship a
  non-sticky contact panel to clear a geometry number).
- Fix changes the visible column gap / layout → REJECT-worthy; the gutter's *visible* result must be preserved.
- `overflow-x: clip` unsupported target → note it; `clip` is broadly supported in current evergreen browsers, but if
  a support concern is raised, STOP and ASK rather than fall back to `hidden` (which breaks sticky).
- Removing the registry entry but the fix is incomplete (some cells still fail) → the gate reverts to a hard
  BLOCKING fail (by design — `MANTINE_PATTERN_KNOWN_FAILURES` no longer masks it). Do not re-add the pin to hide an
  incomplete fix.

## Acceptance criteria
1. `ListingDetailPattern` story: 0 `horizontal-overflow` at 320/375/390/1024 × sq/en/uk/it. (transcript + file:line)
2. Sticky contact panel (`position:sticky; top:80`) still works post-fix — rendered proof (scroll capture or a
   computed-style/position assertion). (evidence)
3. Visible layout byte-identical to pre-fix — side-by-side rendered proof at the 4 stress viewports × 4 locales
   (clause 12 + TailAdmin clause 16). tsc/build green is NOT style proof.
4. `ListingDetailPattern` removed from `MANTINE_PATTERN_KNOWN_FAILURES`; `--mantine-only` → 0 KNOWN-FAILURE, 0 FAIL,
   exit 0; full transcript. Every OTHER cell byte-unchanged vs the Task 611 baseline (857 PASS → 873 PASS = +16 only).
5. Anti-regression: the geometry `horizontal-overflow` check still FAILS on a planted real overflow (planted-then-
   reverted transcript) — proves the fix didn't neuter the check. (clause 13)
6. `node --check`, `check:stories`, `check:file-integrity`, `check:mojibake`, `npx tsc --noEmit` all clean. Session
   log + `docs/backlog.md` (mark 609 done, tidy) + "Files Changed" table. NO git commands (single-writer).

## Scope (files)
**In scope:** `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` (the overflow-containment fix),
`scripts/check-stories-rendered.mjs` (remove the `ListingDetailPattern` registry entry only), the persisted assets
dir, `docs/storybook-governance.md` (resolution note), `docs/backlog.md`, session log.
**Out of scope:** every other pattern/primitive; the discovery/prefix-list/reconciliation mechanism (Task 607,
unchanged); `ListingDetailView.tsx` live-page wiring (separate later task); the lightbox (Task 612).

## Hard contract
No scope creep. The visible layout must stay byte-identical (geometry-only fix). Preserve the sticky contact panel —
STOP and ASK if the overflow fix would break it. No hardcoded story-id exceptions. Mandatory planted-violation
anti-regression proof (AC5). Rendered matrix at 320/375/390/1024 × sq/en/uk/it. Executor emits NO git.
