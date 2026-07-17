# Task 618 — Premium listing card: uniform 1px border, remove outer ring step

## Mode and task type

Implementation task. Type: UI visual fix (Mantine current surface + one legacy story fixture). Owner-requested.

## Objective

Make the **premium** listing card read as a clean, uniform **1px solid gold border** at rest, with the
photo edge flush to that border. Remove the faint outer gold ring that currently sits one pixel outside the
1px border and produces a visible "step" / mis-cropped-photo look on premium cards.

## Verified context

All facts below were inspected in the working tree (read-only git + file reads), not assumed.

- Live premium chrome lives in `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`, rule `.premium`:
  - `border-color: color-mix(in oklch, var(--color-badge-premium) 50%, transparent);`
  - `box-shadow: var(--shadow-listing-card-ring);`  ← the resting outer ring (root cause)
- `--shadow-listing-card-ring: 0 0 0 1px oklch(0.700 0.162 65 / 0.2);` (`src/app/globals.css:229`) — a 1px spread box-shadow drawn **outside** the card border, at ~20% gold, slightly different radius than the photo's clipped corners → the visible double-edge.
- `--color-badge-premium: var(--badge-premium)` (`globals.css:61`); `--badge-premium: oklch(0.700 0.162 65)` "Gold ≈ #D97706" (`globals.css:374`, dark-theme value `globals.css:463`). Already provenance-backed; no new color is introduced by this task.
- `.card` resting state is already `box-shadow: none;` (flat). Premium at rest currently overrides that with the ring.
- Premium hover: `.premium:hover { box-shadow: var(--shadow-listing-card-elevation-lg); }` — a downward drop-shadow (`0 8px 24px …`), NOT a ring; it does not cause the step and must be preserved.
- The premium top gold stripe is separate markup in the component (`MantineListingCardPattern.tsx`, grid branch: `<div className="h-0.5 bg-gradient-to-r from-badge-premium/0 via-badge-premium to-badge-premium/0 shrink-0" />`). **~~stays as-is~~ — SUPERSEDED by owner amendment 2026-07-17 (see below): the stripe is REMOVED.** Task-design defect: with the border now full-opacity gold, the stripe sat 1px inside the border and read as a doubled gold line at the header — i.e. it was part of the very ring/double-edge artifact this task removes. Marking it "preserve" was an orchestrator specification error, not an executor deviation.
- Mantine `Card withBorder` sets a 1px border; both premium and non-premium keep 1px width (only premium's color differs). No width change is needed to make it "uniform" — only the ring removal + full-opacity color.
- Story that renders premium cells: `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` — grid card id `2` (`premium favorited`) and list card id `8` (`layout="list" premium`).
- **Cross-scope duplicate:** `src/stories/StoryListingCard.tsx:88` applies the same pattern via Tailwind classes: `data.is_premium ? 'border-badge-premium/50 shadow-listing-card-ring' : ''`. Used by `src/stories/FeaturedListings.stories.tsx` and `src/stories/ListingGrid.stories.tsx`. `globals.css:228` explicitly records this as the same cross-scope premium pattern. Leaving it unfixed reproduces the exact inconsistency this task removes.
- `tsc --noEmit -p tsconfig.json` currently = 0 errors (baseline, verified this session).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | Premium card at rest shows a solid 1px `--badge-premium` (full-opacity gold) border and **no** outer ring/halo (resting `box-shadow` resolves to none). | P1 | Rendered premium cell + computed-style/inspection | Confirmed |
| R2 | Owner intent | Photo top corners are flush to the premium border — no visible step between border and photo. | P1 | Rendered premium cell at 320 + desktop | Confirmed |
| R3 | agent-contract §3/§5 | Premium hover elevation still applies; the ring does not reappear on hover. | P1 | Rendered/inspection on fine-pointer | Confirmed |
| R4 | agent-contract §1 scope | Non-premium, archived, reduced, and sold cards are visually unchanged. | P1 | Rendered comparison | Confirmed |
| R5 | Owner 2026-07-17 | Storybook must show the uniform 1px gold premium border everywhere the premium card appears — the `ListingCardPattern` story (shared pattern) AND the `StoryListingCard`-based `FeaturedListings`/`ListingGrid` stories. No story may keep the old ring. | P1 | Rendered premium cells across all three stories | Confirmed — required |
| R7 | Owner 2026-07-17 (component-rules Storybook-First) | The change is made and proven in Storybook FIRST, then confirmed to flow to the live site; no site-only change. | P1 | Story rendered proof precedes/anchors the site check | Confirmed |
| R6 | qa-profiles Q2 | Q1 gates green + targeted rendered evidence; `screenshots:assert --mantine-only` stays 0 FAIL. | P1 | Named commands below | Confirmed |

## Assumptions and open questions

- Owner decision already captured: premium border = **solid full-gold 1px** (not the previous 50% opacity, no extra ring).
- Owner decision 2026-07-17: `StoryListingCard.tsx` **is in scope** (R5) — Storybook must show the 1px premium border everywhere, so both the shared pattern story and the `StoryListingCard`-based stories are fixed in this task. Not vetoable.
- Owner decision 2026-07-17: **Story-first** (R7) — the change is made and proven in Storybook first, then confirmed on the site. No open questions remain.
- No new color token or TailAdmin reference is introduced — the task only removes a ring and sets the border to the already-cited `--badge-premium` at full opacity. No §16a provenance row is required.

## Pre-read rule bundle

- `CLAUDE.md`, `docs/agent-contract.md` (§1 scope, §3 capability preservation, §16 TailAdmin visual source).
- `docs/component-rules.md` → "Storybook-First Implementation (MANDATORY — OWNER P0, 2026-07-17)" — the governing ordering rule for this task.
- `docs/storybook-governance.md` (rendered-proof layers a story must pass).
- `docs/qa-profiles.md` (Q2 definition + viewport policy).
- `docs/mantine-responsive-design-system.md` §18 (CSS-module vs Tailwind cascade-layer rationale — already relied on by this module).
- `docs/tailadmin-style-reference.md` (confirm `--badge-premium` gold is the sanctioned accent; no new value).
- Do NOT read the full docs set.

## Scope

- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — `.premium` rule only.
- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — remove the premium top-stripe `<div>` + update the `isPremium` jsdoc (owner amendment 2026-07-17).
- `src/stories/StoryListingCard.tsx` — line ~88 premium className AND the parallel premium top-stripe `<div>` (R5 + owner amendment 2026-07-17).

## Out of scope

- No changes to badge colors, hover elevation, archived dimming, list-vs-grid structure, or any non-premium chrome. (~~top gold stripe~~ — moved to scope by owner amendment 2026-07-17; the stripe is removed, see Verified context + Owner amendment.)
- No changes to `--shadow-listing-card-ring` / `--shadow-listing-card-elevation-lg` token definitions (the ring token may still be used elsewhere; only stop consuming it on the resting premium card). Confirm no other consumer regresses (grep before editing).
- No new tokens, no border-width changes, no radius changes.
- `ListingCard.tsx` (production consumer) needs no edit — it passes `isPremium` through; the styling is entirely in the module CSS.

## Current and required behavior

Current: premium card at rest = 1px gold-50% border **plus** a 1px 20%-gold ring box-shadow one pixel outside it → faint double-edge / step; the photo's rounded top corners do not align with the outer ring edge, so the photo looks mis-cropped.

Required: premium card at rest = **solid 1px `--badge-premium` gold border, box-shadow none** (flat, same width as non-premium); photo edge flush to the border; premium still distinguished by the gold border + existing top gold stripe. Hover elevation unchanged.

## Implementation requirements

0. **Story-first sequence (R7):** land the change in the story-rendered surfaces and confirm every affected premium state renders correctly in Storybook (`ListingCardPattern` premium grid #2 + list #8; `FeaturedListings`/`ListingGrid` premium cells) BEFORE treating the live site as done. Because the Mantine pattern is a shared single source of truth, editing its module CSS updates the story and `ListingCard.tsx` together — the Storybook render is the proof; then confirm the live consumer inherits it. `StoryListingCard` is fixed in the same pass so no story keeps the old ring.
1. In `.premium`: set `border-color: var(--color-badge-premium);` (full opacity) and **remove** the resting `box-shadow: var(--shadow-listing-card-ring);` line so premium inherits `.card`'s `box-shadow: none` at rest.
2. Keep `.premium:hover { box-shadow: var(--shadow-listing-card-elevation-lg); }` exactly.
3. (R5) In `StoryListingCard.tsx`, change the premium branch from `'border-badge-premium/50 shadow-listing-card-ring'` to `'border-badge-premium'` (drop the ring utility; full-opacity gold border). Leave the generic `hover:shadow-lg hover:-translate-y-0.5` base classes intact.
4. Before editing the ring token consumption, `grep -rn "shadow-listing-card-ring" src/` and confirm the only two consumers are the two files above; if a third consumer exists, stop and report rather than expanding scope.

## Positive and negative flows

Positive: render `Patterns/Mantine/ListingCardPattern` → premium grid cell (#2) and premium list cell (#8) show a uniform 1px gold border, flat at rest, photo flush, no halo.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Premium + archived combined | Yes | Existing `isArchived` grayscale/opacity path | Grayscale desaturates the gold border (existing behavior); no new artifact/step | Rendered archived cell |
| Hover (fine pointer) | Yes | `.premium:hover` | Downward elevation shadow applies; ring does not return | Rendered/inspection |
| Reduced-motion | Yes | `@media (prefers-reduced-motion)` | No transform/transition regressions | Inspection |
| Validation / Authorization-RLS / Offline / Concurrent writer | No | Pure presentational CSS, no data path | N/A | — |

## Acceptance criteria

- **AC1 [R1]** Given a premium card at rest, when rendered, then computed `box-shadow` is `none` and the border is a solid 1px `--badge-premium` gold with no outer ring.
- **AC2 [R2]** Given a premium card at 320 and a desktop width, when rendered, then the photo's top corners are flush to the border with no visible step/halo.
- **AC3 [R3]** Given a premium card hovered on a fine-pointer device, when hovered, then the elevation drop-shadow applies and no resting ring reappears.
- **AC4 [R4]** Given non-premium, archived, reduced, and sold cards, when rendered, then their chrome is byte-for-byte unchanged from baseline (diff limited to `.premium` + the one StoryListingCard line).
- **AC5 [R5]** Given `FeaturedListings` and `ListingGrid` stories, when rendered, then their premium cards show the same uniform 1px gold border with no ring.
- **AC6 [R6]** `tsc`, `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:stories` clean; `screenshots:assert --mantine-only` remains 0 FAIL.

## QA profile and verification plan

**Profile: Q2 Standard UI.** Rationale: a targeted chrome (border/shadow) change on an existing surface; no primitive/overlay/layout migration, and the premium look does not vary by viewport, so the full Q3 matrix is not warranted. Because the risk is chrome color/halo rather than responsive layout, the required rendered evidence is focused on the premium cells at one mobile + one desktop width rather than the full matrix.

Commands / evidence:
- `npx tsc --noEmit -p tsconfig.json` → 0 errors.
- `npm run check:i18n`, `check:mojibake`, `check:file-integrity`, `check:stories` → clean.
- `screenshots:assert --mantine-only` → still 0 FAIL (no geometry regression).
- Rendered before/after (Mantine surface): `Patterns/Mantine/ListingCardPattern` premium grid #2 and list #8 at **320** and **1440**, showing uniform 1px gold border, flat rest, photo flush, no halo.
- Rendered (R5): `FeaturedListings` + `ListingGrid` premium cells at 320 and 1440.
- TailAdmin note: state explicitly that no new visual value is introduced (reuses `--badge-premium`); ring removed only.

## Completion report contract

Sonnet must report: exact changed files + line-level diff, completed requirement IDs, every command run with actual output, rendered-evidence locations (before/after for premium cells), the `grep shadow-listing-card-ring` consumer check result, any assumption/deviation, and confirmation that non-premium chrome is unchanged. The report is an index for review, not proof.

## Task quality gate

- Executable by a fresh Sonnet session without chat context: yes (files, lines, tokens, commands all named).
- Every primary requirement has a binary AC + a verification method: yes.
- Scope names what must not change (non-premium chrome, tokens, stripe, hover): yes.
- Current/legacy boundary explicit: Mantine module (current) + StoryListingCard (legacy fixture) called out; QA profile, viewports, and Storybook cells explicit.
- Negative flows selected by applicability, not a generic checklist: yes.
- No uninspected command/file/behavior claimed: all citations verified this session.
- Gate proves changed behavior (rendered premium cells), not just procedure: yes.
- Open decision (R5 scope) visible to executor and reviewer: yes.

---

## Owner amendment — 2026-07-17 (post-implementation, ratified in review)

- **Top gold stripe REMOVED** in both `MantineListingCardPattern.tsx` and `StoryListingCard.tsx` (was originally scoped as "preserve"). Reason: with the premium border now full-opacity gold, the 1px-inside stripe read as a doubled gold line — it was itself part of the residual double-edge/ring artifact this task exists to remove. Confirmed live by owner via DevTools + zoomed screenshots across breakpoints; owner directed the removal. Root cause = orchestrator task-specification defect (P1), not an executor scope violation. Requirement ledger and AC4 are read with the stripe reclassified change → remove.
- **`screenshots:assert --mantine-only` (AC6) waived** by explicit owner visual confirmation across all breakpoints (gradient ring/step confirmed gone). Recorded owner decision; the automated geometry gate was not run to completion for this task.

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_618_PremiumCardUniformBorder.md`
**QA profile:** Q2 Standard UI
**Ambiguous/conflicting requirements:** none.
**Owner decisions:** all captured — premium = solid 1px full-gold; `StoryListingCard` in scope (R5); Story-first ordering (R7); **top stripe removed + `screenshots:assert` waived (owner amendment 2026-07-17).**
