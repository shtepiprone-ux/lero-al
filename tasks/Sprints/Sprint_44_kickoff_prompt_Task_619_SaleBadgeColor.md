# Task 619 — Dedicated `sale` theme color (#dd0939) for the price-reduced badge, applied on BOTH surfaces (card + detail)

## Mode and task type

Implementation task. Type: UI visual — design-system token addition + badge-color remap on two Mantine surfaces. Owner-requested (2026-07-17). Resolves the Task 616 review P2 finding (cross-surface `reduced`-badge color inconsistency) at its root.

## Objective

Introduce ONE new Mantine theme color named **`sale`** whose authoritative stop is the owner-provided **`#dd0939`**, and map the **price-reduced** badge to it **everywhere that badge renders** — the live listing card (Task 617) AND the listing-detail pattern (Task 616) — so the "price reduced" signal reads as the same dedicated crimson across the whole product, distinct from both `brand` (coral, primary/price text) and `red` (error/`Blocked`).

## Verified context

All facts below inspected in the working tree this session (read-only git + file reads), not assumed.

- Theme colors registered at `src/design-system/mantine/theme.ts:114`: `colors: { brand, gray, green, yellow, red, blueLight, purple }`.
- Color methodology (model to copy): each color is a `MantineColorsTuple` (10 hex stops). `brand` (`theme.ts:5-16`) and `purple` (added Task 617) use **one authoritative cited stop + nine approximated** slots. Badge `variant='light'` reads **index 0** for background and **index 6** for text (`theme.ts:33` comment: "Badge variant='light' uses index 0 for bg, index 6 for text"). `purple` placed its authoritative `#7a5af8` at **index 6** for exactly this reason.
- Current `reduced`/price-reduced mappings (the two consumers to change):
  - **Detail (Task 616, UNCOMMITTED working tree):** `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:63-67` `BADGE_TONE_COLOR = { new:'green', premium:'yellow', reduced:'red' }`. Detail story renders a `reduced` badge (`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx:88`, `tone:'reduced'`).
  - **Card (Task 617, COMMITTED `99099c664`):** `src/modules/listings/components/ListingCard.tsx` `getBadges()` → `price_reduced` pushes `{ label:'price_reduced', color:'brand' }`; the story mirror `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` `DemoCard` uses `color: reduced ? 'brand' : 'green'`.
- Badge rendering idiom per surface (preserve): the **card** hardcodes `variant="filled"` (opaque, photo-overlay legibility, Task 617) → a `filled` badge reads the solid family shade; the **detail** badge uses the theme-default `variant='light'` (soft, off-photo) → reads index-0 bg + index-6 text. Both must read as the SAME `sale` color family, differing only by variant (established idiom).
- Canonical primitive story: `src/stories/mantine/primitives/Badge.stories.tsx` — has a light `Default` swatch row AND a `variant="filled"` demo row (Task 617). New colors are added here FIRST (the `blueLight`/`purple` precedent), each labeled from a `storybook.mantine.badge_*` i18n key.
- i18n: `messages/{en,sq,uk,it}.json`. `check:stories` Check 8 forbids Latin-only values in `uk.json` (proper nouns excepted) — a `uk` swatch label must be Cyrillic (precedent: Task 617 `badge_purple` uk = a Cyrillic word).
- `#dd0939` has **no** TailAdmin provenance — it is an explicit **owner-provided** value (2026-07-17). This is valid provenance recorded as owner-directive, NOT a §4 citation; the tuple comment must say so (do not fabricate a TailAdmin cite).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-07-17 | A new `sale` `MantineColorsTuple` exists in `theme.ts`, authoritative stop `#dd0939` at index 6 (Badge light-text), 9 approximated slots (brand/purple methodology), registered in `colors`. | P1 | Source inspection + rendered swatch | Confirmed |
| R2 | Owner 2026-07-17 | The `sale` color is demoed in the canonical `Badge` primitive story (light + filled rows) BEFORE any pattern use, labeled from a new `storybook.mantine.badge_sale` key (×4 locales, `uk` Cyrillic). | P1 | Rendered `Badge/Default` + `check:stories` | Confirmed |
| R3 | Owner 2026-07-17 | Detail pattern `reduced` badge maps to `sale` (`MantineListingDetailPattern.tsx` `BADGE_TONE_COLOR.reduced: 'red' → 'sale'`; JSDoc updated). | P1 | Rendered `ListingDetailPattern` reduced badge | Confirmed |
| R4 | Owner 2026-07-17 | Card `price_reduced` badge maps to `sale` on BOTH the app consumer (`ListingCard.tsx getBadges`) and the story mirror (`ListingCardPattern.stories.tsx DemoCard`); no residual `'brand'` for reduced. | P1 | Rendered `ListingCardPattern` reduced cell + grep | Confirmed |
| R5 | Task 616 review | After the change, NO surface maps the price-reduced badge to `brand` or `red`; the same `sale` color renders on card (filled) and detail (light). | P1 | grep + rendered comparison | Confirmed |
| R6 | agent-contract §1 scope | `new=green`, `premium=yellow`, `type=gray/outline`, and every non-reduced badge/color are unchanged. | P1 | Diff isolation + rendered | Confirmed |
| R7 | qa-profiles Q2 | Q1 gates green + targeted rendered evidence; `screenshots:assert --mantine-only` stays 0 FAIL. | P1 | Named commands below | Confirmed |

## Assumptions and open questions

- Owner decision captured (2026-07-17): color name = **`sale`**; value = **`#dd0939`**; applied to **both** surfaces (detail + card). No open questions.
- Assumption (executor may adjust with evidence): `#dd0939` sits at **index 6** (Badge light-variant text + the shade the `filled` badge reads). If a rendered check shows the `filled` card badge or the `light` detail badge does not legibly read as `#dd0939`, STOP and report the computed values rather than silently shifting the index.
- No change to badge **variant** on either surface (card stays `filled`, detail stays default `light`) — only the color token changes.

## Pre-read rule bundle

- `CLAUDE.md`, `docs/agent-contract.md` (§1 scope, §16/§16a visual-source + provenance).
- `docs/mantine-responsive-design-system.md` §18 (cascade-layer/Badge idiom — why native `color` not className).
- `docs/tailadmin-style-reference.md` (confirm no existing sanctioned token already covers this; `#dd0939` is owner-provided, not §4 — record as such).
- `docs/component-rules.md` ("add missing color to the canonical primitive story first").
- `docs/qa-profiles.md` (Q2 definition + viewport policy).
- Do NOT read the full docs set.

## Scope

- `src/design-system/mantine/theme.ts` — add `sale` tuple + register in `colors`.
- `src/stories/mantine/primitives/Badge.stories.tsx` — add `sale` swatch to the light `Default` row and the `filled` row.
- `messages/{en,sq,uk,it}.json` — add `storybook.mantine.badge_sale` (×4; `uk` Cyrillic). Read-back + `JSON.parse` per write.
- `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` — `BADGE_TONE_COLOR.reduced` → `'sale'`; update the tone-color JSDoc.
- `src/modules/listings/components/ListingCard.tsx` — `getBadges()` `price_reduced` color → `'sale'`.
- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` — `DemoCard` reduced color → `'sale'`.
- `docs/backlog.md`, session log under `docs/sessions/`.

## Out of scope

- No change to `new`/`premium`/`type` badge colors, to any other theme color, to badge **variant** on either surface, or to any non-reduced chrome.
- No new tokens beyond `sale`. No TailAdmin citation invented for `#dd0939` (owner-provided).
- No change to `--badge-reduced` CSS token in `globals.css` (this task moves the Mantine badge to the new theme color; the legacy CSS token is used by legacy surfaces, out of scope — confirm no in-scope file depends on it after the change).
- No live-page wiring changes beyond the existing `ListingCard.tsx` color value.

## Current and required behavior

Current: the price-reduced badge is `brand` (coral) on the live card and `red` (error-red) on the detail pattern — same concept, two colors, and `red` collides semantically with `Blocked`.

Required: a dedicated `sale` crimson (`#dd0939`) renders for the price-reduced badge on BOTH surfaces — `filled` on the card (opaque over photo), `light` on the detail (soft, off-photo) — same color family, no surface using `brand` or `red` for reduced.

## Implementation requirements

1. Add `const sale: MantineColorsTuple = [...]` to `theme.ts`: `#dd0939` at index 6; nine approximated stops (lighter 0–5, darker 7–9) following the `purple`/`brand` ramp spirit; a comment stating **owner-provided 2026-07-17, not TailAdmin-derived**. Register `sale` in the `colors` object.
2. In `Badge.stories.tsx`, add `<Badge color="sale">{t('storybook.mantine.badge_sale')}</Badge>` to the light `Default` group and `<Badge variant="filled" color="sale">…</Badge>` to the filled group. Add `storybook.mantine.badge_sale` to all four locale files (`uk` value in Cyrillic), read-back + `JSON.parse` each.
3. `MantineListingDetailPattern.tsx`: `BADGE_TONE_COLOR.reduced: 'red' → 'sale'`; rewrite the tone-color JSDoc to cite the owner-provided `sale` token and drop the "closest to brand" red rationale.
4. `ListingCard.tsx`: change the `price_reduced` push color `'brand' → 'sale'`; update the adjacent `getBadges` comment.
5. `ListingCardPattern.stories.tsx`: `DemoCard` reduced color `'brand' → 'sale'`.
6. Before finishing, `grep -rn "'brand'" src/modules/listings/components/ListingCard.tsx` and `grep -rn "reduced" src/**` to confirm no price-reduced consumer still resolves to `brand` or `red`; report the result.

## Positive and negative flows

Positive: `Mantine/Primitives/Badge/Default` shows a `sale` swatch (light + filled). `Patterns/Mantine/ListingCardPattern` premium/reduced cell shows the reduced badge as `sale` (filled). `Patterns/Mantine/ListingDetailPattern` shows the reduced badge as `sale` (light). All three read the same crimson family.

| Branch | Applicable? | Reason | Expected | Evidence |
|---|---:|---|---|---|
| `filled` legibility (card, over photo) | Yes | card hardcodes `filled` | `sale` filled bg legible over photo, white text | Rendered card reduced cell |
| `light` legibility (detail, off photo) | Yes | detail default `light` | `sale` soft bg + `#dd0939` text legible | Rendered detail reduced badge |
| `uk` Cyrillic swatch label | Yes | `check:stories` Check 8 | no Latin-only failure | `check:stories` |
| Validation / RLS / offline / concurrent | No | pure presentational token change, no data path | N/A | — |

## Acceptance criteria

- **AC1 [R1]** Given `theme.ts`, when inspected, then a `sale` `MantineColorsTuple` exists with `#dd0939` at index 6 and is registered in `colors`; `tsc` clean.
- **AC2 [R2]** Given `Badge/Default`, when rendered, then a `sale` swatch appears in both the light and filled rows, labeled from `badge_sale`; `check:stories` + `check:i18n` clean.
- **AC3 [R3]** Given `ListingDetailPattern/Default`, when rendered, then the reduced badge renders `sale` (not red).
- **AC4 [R4/R5]** Given `ListingCardPattern` and the `ListingCard` consumer, when rendered/inspected, then the reduced badge renders `sale` (not brand), and grep confirms no reduced consumer resolves to `brand`/`red`.
- **AC5 [R6]** Given all non-reduced badges, when rendered, then `new`/`premium`/`type` and every other color are unchanged (diff limited to the `sale` addition + the reduced remaps).
- **AC6 [R7]** `tsc`, `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:stories` clean; `build-storybook` + `screenshots:assert --mantine-only` remain **0 FAIL**.

## QA profile and verification plan

**Profile: Q2 Standard UI.** Rationale: a token addition + a two-surface badge-color remap on existing surfaces; no layout/primitive/overlay migration and the color does not vary by viewport, so targeted rendered evidence at the standard mantine gate suffices (not a full Q3 responsive matrix).

Commands / evidence:
- `npx tsc --noEmit -p tsconfig.json` → 0 errors.
- `npm run check:i18n` / `check:mojibake` / `check:file-integrity` / `check:stories` → clean (each `messages/*.json` write read back + `JSON.parse`).
- `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` → 0 FAIL (geometry unchanged; 27 AMBIGUOUS pre-existing set unchanged).
- Rendered proof: `Badge/Default` (sale swatch, light+filled), `ListingCardPattern` reduced cell (sale filled), `ListingDetailPattern` reduced badge (sale light) — capture computed color to confirm the `#dd0939` family on both surfaces.
- Anti-regression (clause 13): temporarily revert one surface's reduced color to `brand`, rebuild, and confirm the two surfaces visibly diverge (proves the gate/render actually exercises the change), then restore.

## Completion report contract

Sonnet must report: exact changed files + line-level diff, completed requirement IDs, every command run with actual output, rendered-evidence locations for all three stories, the computed `sale` color on both card (filled) and detail (light) badges, the grep result for residual `brand`/`red` reduced consumers, the index chosen for `#dd0939` (and any evidence-based deviation), and confirmation that non-reduced badges are unchanged. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (never self-approved). Update `docs/backlog.md` (concise) + write the session log.

## Task quality gate

- Executable by a fresh Sonnet session without chat context: yes (files, lines, tokens, index, commands named).
- Every primary requirement has a binary AC + verification method: yes.
- Scope names what must not change (variants, other colors, non-reduced chrome, `--badge-reduced` CSS token): yes.
- Current/legacy boundary explicit: both surfaces are current Mantine; primitive-story-first obligation named; QA profile + rendered cells explicit.
- Visual token traced precisely: `sale` index-6 `#dd0939`, light=index0 bg/index6 text, filled=solid family; card=filled, detail=light — no vague "color" hand-wave.
- Cross-surface consistency (the Task 616 finding) is the explicit R5 outcome, not a side effect.
- Negative flows selected by applicability, not a generic checklist: yes.
- No uninspected command/file/behavior claimed: all citations verified this session.

---

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_619_SaleBadgeColor.md`
**QA profile:** Q2 Standard UI
**Ambiguous/conflicting requirements:** none.
**Owner decisions:** all captured — name `sale`, value `#dd0939`, both surfaces. No open owner decision.
**Note for review:** Task 616's detail change here lands in its still-uncommitted working tree; Task 617's card change is a follow-up commit on top of `99099c664`. At review, reconcile both surfaces to the single `sale` color.
