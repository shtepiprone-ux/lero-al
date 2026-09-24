# Task 810 — the rail becomes usable: controls, a visible scrollbar, equal card heights

Sprint 74 · `tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md` · P1 · QA **Q3**

## 1. Mode and task type

`IMPLEMENTATION` — extends the canonical `MantineListingCardTrack` (Task 806) and the card pattern it holds.
Current-Mantine path. Strongest permitted result is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval,
no mutating Git.

## 2. Objective

Task 807 made every card the same width. This task makes the rail **operable**: a user can see that it scrolls, can
scroll it with a mouse, and the cards in it are the same height.

## 3. Verified context — owner review of 2026-09-10, plus what was measured in response

### 3.1 What the owner reported, in his words

`FACT` — after reviewing the live routes at 320 / 390 / 480 / 936 he raised six items:

1. The rails have **no controls** and cannot be scrolled with a mouse — «неможливо проскролити ліворуч чи праворуч
   мишкою». Reference behaviour: Rozetka's «Схожі товари» — a thin scrollbar that thickens on hover, plus prev/next
   arrows; **an arrow disappears when there is nothing to scroll in that direction**, so it never lies.
2. Card heights are uneven when one title is longer than another; every card in a section must match the tallest.
3. Titles must clamp to two lines with an ellipsis.
4. At some widths no part of the next card is visible, so the rail does not read as scrollable.
5. A section holding exactly **one** card should stretch that card to the full width at **320-480px inclusive**,
   and follow the normal track rule above 480.
6. The React `key` warning is still live — that is Task **808**, already filed, and is **not** this task.

### 3.2 What is already true — do not "fix" these

`FACT` — the two-line clamp already exists: `MantineListingCardPattern.tsx:224` and `:360` both render
`<Text component="h3" fw={600} size="sm" lineClamp={2} className={styles.cardTitle}>`. Item 3 is therefore a
**verification** requirement, not an implementation one: prove the clamp renders (measure the rendered height of a
long-title card against a short-title one) and, if it is defeated by something else, fix that cause — do not add a
second clamp.

`FACT` — the track's rail is a plain `overflow-x: auto` flex container with `scrollbar-width: none` and a
`::-webkit-scrollbar { display: none }` rule (`MantineListingCardTrack.module.css`, Task 806). **The hidden
scrollbar is the direct cause of item 1**: with no scrollbar there is nothing to drag, and a vertical wheel does not
scroll a horizontal container.

`FACT` — `@mantine/carousel` is **not** a dependency (`package.json:103-107` lists core, form, hooks, modals,
notifications only). Do not add it: the controls are two buttons and a scroll listener over the container that
already exists, which is exactly the Rozetka mechanism. Adding a carousel dependency would replace the approved
track with a second layout engine — that is a finding to report, not a diff.

`FACT` — the theme already carries the 480px rung: `theme.ts:322` `xs2: '30em'  // 480px`. Item 5 needs no new
breakpoint value.

### 3.3 Item 4 — two different cases, and only one of them was ever unimplementable

`FACT` — Task 807 measured the rail card at exactly `min(280px, 82%)`: 236.16px at 320 and **280px at every width
from 390 up** (`docs/sessions/evidence/task807/runs/reverted-clean-1`). With a fixed card width, the peek is
whatever the container has left over after a whole number of cards — sometimes 240px, sometimes ~0.

`FACT` — with `--listing-card-min: 17.5rem` (280px) and `gap: var(--mantine-spacing-md)` (16px), a container of
**872px** fits exactly three cards (840 + 32) and leaves **0px** of the fourth visible, even when a fourth exists.
The row then reads as a finished grid. That is the defect the owner reported, and it is real.

Two cases, which the previous draft of this kickoff wrongly merged:

1. **More cards exist than fit.** A peek is required, always, at every width. It is achievable — the card width
   becomes a **fraction of the container** chosen so a tail of the next card always remains, which is exactly what
   the pre-806 `SimilarListingsView.module.css` did with `calc(100% / 1.2)` … `calc(100% / 4.2)`: the `.2` *was*
   the peek. Task 806 replaced that ladder with a fixed width and lost the affordance with it.
2. **The section holds only as many cards as fit.** There is nothing beyond the edge, so there is nothing to peek
   at; a peek here could only be manufactured by inventing a card that does not exist. Correct behaviour: no peek,
   no scrollbar thumb, **no controls** — which is item 1's own rule (a control that cannot scroll does not render).

Case 1 is R7 and is blocking. Case 2 is not a defect and must not be "fixed".

### 3.4 Owner decision recorded from this review

`OWNER DECISION — D74-5, 2026-09-10.` A rail holding exactly one card stretches that card to the full track width
from 320px up to **and including** 480px; above 480px the normal `min(var(--listing-card-min), 82%)` rule applies.
This is a **deliberate, owner-instructed exception to D74-1's "no media query in the track"** — the only one. It is
recorded here so a reviewer does not read it as a violation, and it must be implemented as a single `@media
(max-width: …)` bounded to this one case, with a source comment naming D74-5.


`OWNER DECISION — D74-6, 2026-09-10.` **On a rail, `--listing-card-min` is a MAXIMUM, not a fixed width.** The rail
card shrinks to a fraction of the track's own width whenever that is what it takes to keep a tail of the next card
visible; it never exceeds `var(--listing-card-min)`. The grid is unchanged — there 280px remains the `minmax()`
**minimum**. This supersedes the part of D74-2 that read as "the rail card is exactly 280px": one number still
governs the whole site, but on a rail it is a ceiling.

### 3.4a The reference implementation, measured — not guessed (2026-09-10)

`FACT` — the orchestrator opened the owner's cited page (`rozetka.com.ua`, a product page) in a browser and read its
computed styles and stylesheet rules directly. The mechanism is one custom property, one formula and a breakpoint
ladder:

```
--width: calc(100% / var(--countSlides) - var(--countSlidesOffset, 30%) / var(--countSlides) / var(--countSlides));
min-width: var(--width);
```

with `--countSlides` — the number of **fully visible** cards — set by a media-query ladder (measured values on that
page: `2` below 768, `4` at 768-1023, `6` at 1024-1279, `7` at 1280-1439, and other ladders per section type).

`FACT` — the arithmetic reproduces both measured cells exactly: `n=4` → `100/4 − 30/16 = 23.125%`, and the rail's
first child measured `23.125%` / `168.34px` in a `728px` track; `n=5` → `100/5 − 30/25 = 18.8%`, measured `18.8%` on
the second rail of the same page.

`INFERENCE` — the useful property of that formula: `n` cards occupy `100 − 30/n` percent of the track, so the
remaining **`30/n` percent is always the peek**. It cannot degenerate to zero at any width, because it is a
proportion of the track rather than the leftover after a whole number of fixed-width cards. That is precisely the
failure §3.3 measured at a 872px container.

`FACT` — the reference **does use media queries**: the ladder is how `n` changes. This settles §5's open mechanism
question in favour of the ladder and against the exotic breakpoint-free `round()` route, and it means D74-1's "no
media query in the track" is deliberately relaxed for the rail — see D74-6.

Take the *technique*, not their code: express it with this project's own token names, in the track's own CSS module,
with the count ladder gated on `theme.ts`'s existing breakpoints. Do not copy their class names, selectors or
stylesheet.

### 3.5 Canonical UI decision record (mandatory for a UI task)

| Visible artifact | Searched / inspected | Canonical source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Prev/next control | `grep -rn "ActionIcon" src/design-system/mantine` and the repo's icon imports (`lucide-react`) | Mantine `ActionIcon` through the shared `MantineProvider`; icons from `lucide-react`, the repo's only icon library | **reuse** | No new component, no local button. Size/variant/colour come from the theme's `ActionIcon` configuration — read it in `theme.ts` before choosing, and use the same rung a nearby consumer already uses. |
| Rail scrollbar | `MantineListingCardTrack.module.css` (Task 806) | The track's own CSS module — it is the canonical owner of rail chrome | **extend** | The thin/hover rules go in that module and nowhere else. No consumer may style a scrollbar. |
| One-card ≤480 rule | `theme.ts:322` `xs2: '30em'` | The theme breakpoint scale | **reuse** | The media query's condition matches the existing 480px rung; no new breakpoint value. |
| Equal card height | `MantineListingCardPattern.tsx` + `.module.css` | The card pattern is the canonical owner of card chrome | **extend**, only if §10.2's measurement proves the card is the cause | The rule goes in the pattern or the track — never in a consumer, never inline. |
| The whole track, all new states | `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (Task 806) | The existing canonical story | **extend** | New exports per §10.4; manifest unchanged; `check:story-coverage` stays 33/33. |

**No `create canonical` disposition is expected.** If a search shows a needed source genuinely does not exist, stop
and report `CANONICAL STYLE DECISION REQUIRED` rather than inventing a local one.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | The rail exposes a **visible horizontal scrollbar**: thin at rest, thicker on hover of the track. The native scrollbar is styled, not replaced. | P0 | AC1 |
| **R2** | The rail renders **prev/next controls**. Each is present only when the track can scroll in that direction, and disappears otherwise; when the content does not overflow, neither renders. | P0 | AC2 |
| **R3** | Controls scroll by a whole "page" of the track (its client width, less one card's peek) with smooth behaviour, and the state updates on scroll, on resize, and when the child count changes. | P0 | AC3 |
| **R4** | Every card in a section renders at the **same height** — the tallest card's height — in both `grid` and `rail` mode, without a fixed pixel height. | P0 | AC4 |
| **R5** | The title clamps to two lines with an ellipsis. Already implemented (§3.2) — **prove it**, and fix only the cause if the proof fails. | P1 | AC5 |
| **R6** | **D74-5**: a rail with exactly one card stretches it to the full track width at ≤480px; above 480px the standard rule holds. | P0 | AC6 |
| **R7** | **D74-6.** Whenever a rail holds more cards than fit, a tail of the next card is visible at **every** tested width — never 0px. The card width is a fraction of the track, capped at `var(--listing-card-min)`. When the content fits, no peek, no thumb, no controls. | **P0** | AC7 |
| **R8** | **Canonical and tokenised, no hardcode (owner instruction, 2026-09-10).** No new dependency; the only new i18n strings are the two control `aria-label`s, in all four locales; **every** new visual value resolves to a token whose definition was grepped (§10.5); no `design-tokens-allow` marker, no allowlist entry, no bare px/rem/hex anywhere including `style={{}}`; `check:design-tokens --strict --scope=mantine` stays **0**; every new state is proven in the canonical story and `check:story-coverage` stays **33/33**. | **P0** | AC8 |
| **R9** | The **grid** half of Task 807's contract is frozen: `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))` byte-unchanged, and `LISTING_LAYOUT_SIZES`/`imageDelivery.ts` untouched. The **rail** basis changes, and only under D74-6: the card never exceeds `var(--listing-card-min)` and never falls below the ≤480px D74-5 rule. | P0 | AC9 |

## 5. Assumptions and open questions

- **`OWNER DECISION — D74-1 … D74-5`.** D74-5 is new (§3.4) and is the single permitted media query in the track.
- **Mechanism — decided by measurement (§3.4a), not open.** The rail card width is
  `100% / n − <offset> / n²` of the track, where `n` is the number of fully visible cards, carried in a project-owned
  custom property and set by a ladder on `theme.ts`'s existing breakpoints. The peek is then `offset / n` of the
  track at every width, by construction. **The width is additionally capped at `var(--listing-card-min)` (D74-6),**
  so choose each rung's `n` such that the derived width lands **at or below 280px** — otherwise the cap binds, the
  card stops being a fraction, and the peek can degenerate again.
- **`UNKNOWN` — the ladder's actual numbers.** Derive them, publish them, and prove them. The container widths are
  already measured (Task 807, `runs/reverted-clean-1`): **288 / 358 / 720 / 976 / 1200 / 1408** px at viewports
  320 / 390 / 768 / 1024 / 1280 / 1440. For each rung state the chosen `n`, the derived percentage, the resulting
  card width in px and the resulting peek in px, and show that the width is ≤ `var(--listing-card-min)` and the peek
  > 0. If no `n` satisfies both at some rung, report it — do not silently let the cap bind.
- **`UNKNOWN` — the offset value.** The reference uses 30%. It is a visual value: route it through §10.5's
  provenance table like every other one. If no existing token expresses it, that is
  `CANONICAL STYLE DECISION REQUIRED` — bring the owner the measured options rather than picking one.
- **`ASSUMPTION (reversible, stated)` — all four rails get the controls**, not only the three the owner named:
  Featured, Latest, Recently viewed and Similar all use `mode="rail"`, and a control on three of four would be its
  own inconsistency. Say so in the report.
- **`UNKNOWN` — the cause of uneven card heights.** Flex and grid items stretch by default, so the container is
  probably not the problem; the card's own root or its inner `Stack` may not fill the stretched box. **Measure
  before changing anything** (R4/AC4) and name the exact rule that was missing.
- **Out of scope:** the `key` warning (**808**), `FavoritesShell` and `RecentlyViewedSkeleton` (**809**),
  `--listing-card-min`'s value, `LISTING_LAYOUT_SIZES`.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15) · `docs/ai-behavior.md` Notes 18-23 · `docs/rule-index.md` →
**Current Mantine path**: `docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md`,
`docs/component-rules.md` · `docs/design-system.md` §22-23 · `docs/qa-profiles.md` · `docs/storybook-governance.md` ·
`docs/backlog.md` · this sprint's plan file for **D74-1 … D74-5** · Task 806's session log for the track's contract.

## 7. Scope

`src/design-system/mantine/patterns/MantineListingCardTrack.tsx` and its `.module.css` (controls, scrollbar, D74-5)
· `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` and/or its `.module.css` **only if** R4's
measurement proves the card is the cause · `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (new states)
· `messages/*.json` for the two control `aria-label`s, all four locales · `docs/component-catalog.md` ·
`docs/backlog.md` state and the session log.

## 8. Out of scope

The five consumer surfaces — they consume the track and inherit everything; **if a consumer needs an edit, that is a
finding to report** · `ListingCard.tsx`'s own composition · `src/lib/imageDelivery.ts` · `globals.css` and the token
value · `theme.ts` · Tasks 808 and 809's files · `@mantine/carousel` or any new package.

## 9. Current and required behavior

**Before:** the rail scrolls only by touch or a shift-wheel; there is no scrollbar, no control, and no signal that
more cards exist. Cards in a section can differ in height. A lone card sits at 280px on a 320px screen with dead
space beside it.

**After:** the rail shows a thin scrollbar that thickens on hover, and prev/next controls that appear exactly when
they can do something. A section's cards are all the height of the tallest. A lone card fills the width up to 480px.

## 10. Implementation requirements

### 10.1 The controls and the scrollbar (R1, R2, R3)

They belong to `MantineListingCardTrack`, not to any consumer — that is what makes them appear on all four rails at
once. The scroller keeps its current DOM position; wrap it in a positioning container so the buttons can sit over
its edges without becoming flex items of the scroller itself.

- Controls: Mantine `ActionIcon` with the project's own icon library (`lucide-react`, as used across the repo — read
  a nearby consumer before choosing icon names). Absolutely positioned against the wrapper, vertically centred.
- Visibility: derive from `scrollLeft`, `scrollWidth` and `clientWidth` on the scroller. Left control renders only
  when `scrollLeft > 0`; right only when `scrollLeft + clientWidth < scrollWidth`, both with a small tolerance for
  sub-pixel rounding. Recompute on `scroll`, on `ResizeObserver` of the scroller, and when the children change.
- Paging: `scrollBy({ left: ±(clientWidth - onePeek), behavior: 'smooth' })`. Respect
  `prefers-reduced-motion: reduce` by falling back to `behavior: 'auto'`.
- Scrollbar: **replace** the current `scrollbar-width: none` / `::-webkit-scrollbar { display: none }` pair with a
  thin, styled scrollbar that grows on `:hover`/`:focus-within` of the track. Use `scrollbar-width: thin` plus the
  `::-webkit-scrollbar` rules, and take every colour from an existing custom property — no new token, no hex.
- The component becomes a client component (`'use client'`) because it now holds state and DOM listeners. Its
  consumers include Server Components; state that boundary change explicitly in the session log and confirm the
  build still marks `/[locale]/listings/[slug]` as `ƒ`.
- `grid` mode gains **nothing**: no controls, no scrollbar styling, no wrapper. Prove that with a story.

### 10.2 Equal heights (R4)

Measure first: render a section with one long-title card and one short-title card and record both cards'
`getBoundingClientRect().height`. Then fix the smallest thing that makes them equal — a `height: 100%` on the card
root, or `align-items: stretch` plus a filling inner column. **Do not set a fixed pixel height** and do not clamp
the card to an aspect ratio. State the measured before/after heights for both modes.

### 10.3 D74-5 (R6)

One `@media` block, bounded to ≤480px, applying only when the rail has exactly one item — `:only-child` is the
precise selector and needs no JS. The rule sets that item's `flex-basis` to `100%`. Comment it with **D74-5** and
the sentence "the only media query permitted in this file, by owner decision 2026-09-10" so the next reviewer does
not read it as a D74-1 violation.

### 10.4 Stories (R8)

Extend `Patterns/Mantine/ListingCardTrack` — it is the canonical proof for this primitive and already exists, so the
disposition is **`extend`**, not `create canonical`. Add: a rail that overflows (controls visible), a rail that does
not overflow (no controls, no peek), a rail with exactly one card, a section mixing a long and a short title (the
height proof), and keep the existing five exports. No manifest change; coverage stays 33/33.

### 10.5 Token provenance — blocking, fill this in before writing any CSS

**Owner instruction, 2026-09-10: «все має бути канонічним, з токенами, зі Story, ніякого хардкоду».** The controls
and the scrollbar introduce new visual values, and that is exactly where a raw literal gets in. Before writing a
single declaration, produce this table in the session log and carry it into the completion report:

| New visual value | Chosen token / theme key | Grepped definition (file:line, quoted) |
|---|---|---|
| Scrollbar thickness at rest | | |
| Scrollbar thickness on hover | | |
| Scrollbar thumb colour | | |
| Scrollbar track colour | | |
| Control size | | |
| Control inset from the track edge | | |
| Control background / border / icon colour | | |
| Control elevation (shadow) and stacking (`z-index`) | | |
| Smooth-scroll duration, if any is authored | | |

Rules, all blocking:

1. **Grep the definition, never the documentation table.** `docs/design-system.md` §22 listing a token proves
   nothing. `Select-String -Path src\app\globals.css -Pattern '^\s*--token-name\s*:'` returning a line proves it.
   Quote the matched line. This is the Task 714→716→715 `--z-sticky` failure — a token that was tabled everywhere
   and defined nowhere reached production through two approved reviews.
2. **No bare px, rem, em, hex, `rgb()` or unnamed number** in the new CSS or in any `style={{}}`. A value that must
   be arithmetic is a `calc()`/`min()` anchored to a `var(--…)`, which the scanner exempts; a bare literal is not.
3. **No `design-tokens-allow` marker and no allowlist entry.** If a value cannot be expressed through an existing
   token, that is `CANONICAL STYLE DECISION REQUIRED` — stop and report it with the exact value and what you
   searched. Do not suppress the gate to get green.
4. **`z-index` in particular**: read `docs/design-system.md` §22.3's ⚠️ banner and grep the definition of whatever
   `--z-*` you intend to consume before consuming it.
5. Every new value must be visible in the Storybook story (§10.4) at the states the matrix reviews — a value that
   only ever appears on a live route has no canonical proof.

## 11. Positive and negative flows

**Positive:** open a listing page at 1024 with more cards than fit — a thin scrollbar is visible, the right control
is present and the left is not; click right, the row pages across, the left control appears; reaching the end, the
right control disappears.

| Negative flow | Applicable | Why |
|---|---|---|
| Content does not overflow | **Yes** | No controls, no scrollbar thumb — §3.3. |
| Exactly one card, ≤480px | **Yes** | D74-5's whole case. |
| Exactly one card, >480px | **Yes** | Must fall back to the standard width — the boundary is the risk. |
| Zero cards | **Yes** | The track renders nothing and must not reserve height or crash the observer. |
| Long `uk` title vs short title in one section | **Yes** | R4's measurement case. |
| Resize across the overflow boundary | **Yes** | Controls must appear/disappear without a reload. |
| `prefers-reduced-motion: reduce` | **Yes** | Smooth paging must degrade. |
| Keyboard-only user | **Yes** | Controls must be reachable and labelled; the scroller must remain focusable. |
| RLS / data failure | No | Presentational primitive. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given an overflowing rail, then the scroller's computed `scrollbar-width` is `thin` (or the
  `::-webkit-scrollbar` height is non-zero), and it increases on hover. State both computed values.
- **AC2 [R2]** — Given an overflowing rail at `scrollLeft: 0`, then exactly one control is in the DOM (next); after
  scrolling to the end, exactly one (prev); given a non-overflowing rail, then **zero** controls are in the DOM.
  Assert presence in the DOM, not opacity.
- **AC3 [R3]** — Given a click on the next control, then `scrollLeft` increases by the track's client width minus
  one peek (±2px) and the control state updates without a reload; given a resize that removes the overflow, then
  both controls leave the DOM.
- **AC4 [R4]** — Given a section with a long-title and a short-title card, then both cards' rendered heights are
  equal in `rail` **and** in `grid` mode. Quote the before and after heights for all four cells.
- **AC5 [R5]** — Given a card whose title exceeds two lines, then the rendered title is two lines with an ellipsis
  and the card's height equals its short-title sibling's. If the existing `lineClamp={2}` already does this, say so
  and change nothing.
- **AC6 [R6]** — Given a rail with exactly one card at 320, 390, 480 then its width equals the track's client
  width; at 481 and 640 it equals `min(280px, 82%)`. State all five measured widths.
- **AC7 [R7, D74-6]** — Given a rail holding **more cards than fit**, then at 320 / 390 / 480 / 481 / 640 / 768 /
  1024 / 1440 the measured peek — the horizontal overlap between the track's box and the first card whose right edge
  lies beyond it — is **greater than 0px at every one of those widths**, and the card width never exceeds
  `var(--listing-card-min)`. State the peek and the card width per width. A peek of 0px on an overflowing rail is a
  failed criterion, not a rounding artefact. Given a rail whose cards all fit, then peek is 0, no thumb and no
  control render — assert that case separately so the two are never conflated again.

- **AC8 [R8]** — `check:design-tokens --strict --scope=mantine` **0 violations, 0 stale markers, 0 missing-reason
  errors**; `check:story-coverage` 33/33; `git diff package.json` empty; the two new i18n keys present in **all four**
  locales with no other key changed; §10.5's provenance table complete with a grepped definition line quoted for **every**
  row; and `grep -nE '[0-9]+(px|rem|em)|#[0-9a-fA-F]{3,8}|rgba?\(' ` over the two changed files returns only matches that sit
  inside a `calc()`/`min()` that also references a `var(--…)`. Quote that grep.
- **AC9 [R9]** — Given `git diff`, then `MantineListingCardTrack.module.css`'s `.grid` rule and the rail's
  `flex-basis` expression above 480px are unchanged from Task 807's approved state, and `imageDelivery.ts` is absent
  from `git status --porcelain`.

  **Corrected by Revision 1 (task-design defect, found by the review of 2026-09-10).** The phrase “the rail's
  `flex-basis` expression above 480px” contradicts R9's own body, which authorises the rail basis to change under
  D74-6. Read AC9 as: the `.grid` rule and the **base** `.rail > *` rule are byte-unchanged, `imageDelivery.ts` is
  absent from `git status --porcelain`, and the `:not(:only-child)` ladder is the authorised change. Revision 0
  satisfied this; the criterion, not the implementation, was wrong.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** New interactive behaviour on a canonical primitive consumed by every listing
surface, plus a responsive exception. Not Q4 — no critical-flow file is touched.

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 · lint 0 errors with no touched file named · `check:stories` pass ·
`check:story-coverage` **33 covered / 0 unproven** · design-tokens 0 · `npm run test` at the Task 790 baseline, each
failure named and proven pre-existing · `build-storybook` and `build` exit 0, with `ƒ /[locale]/listings/[slug]`
still present in the build output (the `'use client'` boundary change) · both hygiene gates 0. Every exit code read
from **inside** its retained transcript.

**Rendered measurement (AC1-AC7).** Extend Task 807's convention into
`scripts/task810-rail-controls-probe.mjs` — read `scripts/task807-card-width-parity.mjs` first and keep its
conventions (`playwright` chromium, `BASE_URL` env, `probeHash`/`gitCommit` via `execFileSync` with no shell, one
immutable run directory per invocation via `flag: 'wx'`, exit 1 on hard fail, 2 on usage error). Against
`npm run start`, locale `uk`, widths **320, 390, 480, 481, 640, 768, 872, 1024, 1440** — **872 is mandatory**: it is the exact container that fits three 280px cards plus their gaps with nothing left over, i.e. the degenerate-peek case §3.3 measured, for each rail section on `/` and
on a detail page it records: `scrollWidth`, `clientWidth`, `overflows`, the control count and which one, the
scroller's computed `scrollbar-width`, the first and second card's `getBoundingClientRect()` (width **and
height**), the peek in px, and — after a synthetic click on the next control — the new `scrollLeft` and control
count. Hard-fail on: a non-OK response · a missing track · unequal card heights within one section · a control
present on a non-overflowing rail · a control **absent** on an overflowing one · **a peek of 0px on any rail that holds more cards than fit — this is the check Task 807 did not have, and the reason the defect reached the owner** · a rail card measuring wider than `var(--listing-card-min)` ·
a one-card rail not filling the track at ≤480 or filling it at >480.

**Two-armed proof (Q3 gate claim).** Plant a change that the probe must catch — set the control's visibility
condition to a constant `true` so a control renders on a non-overflowing rail — rebuild, re-probe into a planted
`runId`, and show exit **1** naming that cell. Revert, prove it with `git hash-object`, re-probe into a fresh
`runId`, quote both. **Both arms must be fired by the same final probe blob**; if the script changes after the
planted run, re-fire both. (Task 803 F8; Tasks 806 and 807 both got this right — match them.)

**Transcript rule.** No `Tee-Object`. Set `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` before the
first capture, capture with `& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, append
`EXIT_CODE=$LASTEXITCODE` **inside** each file, retain everything under `docs/sessions/evidence/task810/`.
**All evidence must be produced in native Windows PowerShell.**

**`OWNER VISUAL QA REQUIRED`** — on the live routes:

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Any rail | overflowing — scrollbar thin, thickens on hover; controls appear/disappear at the ends | uk, sq | 390, 768, 1024, 1440 |
| Any rail | not overflowing — **no** controls, no thumb | uk | 1440 |
| Similar / Recently viewed | one card only | uk | **320, 480, 481 (the D74-5 boundary)** |
| Any rail | long title beside short title — equal heights, two-line ellipsis | uk | **320 (mandatory)**, 1024 |
| Any rail | mouse-drag the scrollbar and click both controls | uk | 1024 |

## 14. Completion report contract

Files changed · requirement IDs completed · the measured card heights before and after, both modes · the control
presence table per width per section · the D74-5 boundary measurements at 480 and 481 · the peek in px per width ·
the probe's full JSON · the planted/reverted pair with the `git hash-object` revert proof and the probe blob on
**both** arms · the `'use client'` boundary change and the build line proving the route is still `ƒ` · whether
`lineClamp={2}` needed any change · confirmation that no consumer, `imageDelivery.ts`, `package.json` or the token
value was touched · commands run with real exit codes and transcript paths · assumptions · deviations · limitations.
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this re-open the width standard? | No — R9 freezes Task 807's contract and AC9 greps for it. Only the ≤480 one-card case changes, by D74-5. |
| Are media queries in the track a D74-1 violation? | No, and there are now two named exceptions, both owner-recorded: **D74-5** (a lone card fills the rail ≤480px) and **D74-6**'s count ladder, which §3.4a measured as the reference implementation's own mechanism. Both must carry a source comment naming the decision. The **grid** half of the track keeps zero media queries — R9 freezes it. |
| Is a carousel dependency permitted? | No — §3.2 measured that `@mantine/carousel` is absent; the controls are two buttons over the existing scroller. Proposing the dependency is a finding, not a diff. |
| Is the peek requirement implementable? | **Yes, in the case that matters** — §3.3 separates "more cards than fit" (peek always required, D74-6, AC7 blocking) from "only as many cards as exist" (nothing to peek at, and the control rule already says so). The first draft of this kickoff merged the two and wrongly declared the whole thing unimplementable; the owner corrected it on 2026-09-10 and D74-6 records the correction. |
| Does D74-6 break "one number for the whole site"? | No — it makes that number a **ceiling** on rails and leaves it a **floor** in grids. One token still governs every card; R9 freezes the grid half byte-for-byte. |
| Is the two-line clamp new work? | No — it already exists at `MantineListingCardPattern.tsx:224`/`:360`. AC5 asks for proof, and for a fix only if the proof fails. |
| Where do the controls live? | In the track, so all four rails get them at once. A consumer-level control would be the duplication the canonical-first gate exists to prevent. |
| Does it fix the `key` warning? | No — that is Task **808**, filed 2026-09-10 and still open. Do not touch it here. |

---

# Task 810 — Revision 1

Filed by the orchestrator review of **2026-09-10**, verdict `NEEDS REVISION`. Revision 0 is `IMPLEMENTED`; this
section is the only thing to execute. Read §1-§15 above for the original contract — every requirement there still
binds unless a row below supersedes it.

## 16. Revision 1 — re-entry, decisions, and what must not be re-done

### 16.0 Re-entry mode — `remediation`, not `from-scratch`

`FACT` — Revision 0's diff is in the worktree, uncommitted, and is the starting point. Do not revert it, do not
re-implement from `HEAD`, and do not re-run the Revision 0 evidence.

**Preserved artifacts — overwriting any of these destroys the only copy:**

- `docs/sessions/evidence/task810/runs/baseline-1/` · `runs/planted-1/` · `runs/reverted-1/`
- every `docs/sessions/evidence/task810/transcripts/*.txt` from Revision 0

The probe writes with `flag: 'wx'` and refuses an existing run directory, so a collision fails loudly rather than
silently. Revision 1 evidence goes to **new** run ids (`rev1-*`) and **new** transcript names (`transcripts/rev1-*.txt`).
Revision 0's artifacts stay in place and are marked superseded in the session log, never deleted.

### 16.1 Verified in Revision 0 — do NOT redo, do NOT re-measure

`FACT`, each read from the retained artifact, not from the completion report:

| Closed | Evidence the reviewer inspected |
|---|---|
| **AC1** (R1) | `scrollbarWidthComputed: "thin"` at all 9 widths; `webkitScrollbarHeightRest: "4px"` → `webkitScrollbarHeightHover: "8px"` after a real `.hover()` |
| **AC2** (R2) | `controlCount: 0` on the non-overflowing rail at all 9 widths, `1` (next only) at `scrollLeft:0`, prev-only at the end at 1024/1440 — and the comparator is proven able to fail by `planted-1`'s 9 hard-fail lines |
| **AC6** (R6) | `firstChildWidth` 288/358/448 at 320/390/480 (= clientWidth), 280 at 481 and above. The D74-5 boundary is exact |
| **AC9** (R9) | `.grid` byte-unchanged in the diff; base `.rail > *` unchanged; `imageDelivery.ts` absent from `git status --porcelain` |
| **R8 gate half** | `check:design-tokens --strict --scope=mantine` 0/0/0 · `check:story-coverage` 33/33 · `check:stories` 0 · `git diff package.json` empty · 2 keys × 4 locales, real translations, no other key touched · every consumed `--*` definition grepped and present in `globals.css` |
| **Two-armed proof** | `planted-1` exit 1 (9 reasons), `reverted-1` exit 0, identical `probeHash` on both arms, revert blob `6942fbd18…` corroborated by the diff's own index line |
| **R4 mechanism** | The `height: auto` fix is correct. `ListingCard.module.css` is inside `@layer utilities`; the track module is unlayered, so the track rule wins on layer **and** on specificity. Keep the rule |

The scrollbar, the control presence logic, the D74-5 media query, the i18n keys and the `'use client'` boundary are
all accepted. **Do not touch them except where a row in §16.3 says so.**

### 16.2 Owner decisions taken on this review — 2026-09-10

`OWNER DECISION — D74-7.` **`offset = 36`.** The engineered value Revision 0 shipped is confirmed and is no longer
`CANONICAL STYLE DECISION REQUIRED`. Rejected alternative: the reference site's own `30`, which leaves a measured
0.64px peek at this site's real 1344px container. The CSS comment must cite **D74-7** in place of the phrase
"an ENGINEERED constant … Flagged for the owner in the completion report".

`OWNER DECISION — D74-8.` **A control click scrolls a whole snap-aligned page.**
`delta = floor(clientWidth / (cardWidth + gap)) × (cardWidth + gap)`, floored at one card. AC3 stands as originally
written and is **not** rewritten; the implementation moves to meet it. Rejected alternatives: card-granular paging,
and keeping Revision 0's behaviour with AC3 relaxed.

`OWNER DECISION — D74-9.` **The D74-6 count ladder keys on the CONTAINER, not the viewport.** `@media` becomes
`@container` against a `container-type: inline-size` wrapper, at the same `theme.ts` rung values (30/48/64/80em).
Rejected alternatives: re-derived non-token thresholds, and any per-surface rung override (that is the per-surface
ladder D74-1 exists to delete).

### 16.3 Requirements — Revision 1

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R10** | **D74-9.** The rail's count ladder is a container query, not a media query. The card's width is decided by the width of the track it sits in, so the same card renders at the same width on every surface at one viewport. | **P0** | AC10 |
| **R11** | The probe measures a **detail route** as well as `/`, at every width, with the same cell shape and the same hard-fail set. A missing rail on either path hard-fails. | **P0** | AC11 |
| **R12** | The probe measures **`grid` mode** on `/{locale}/listings`, and a second two-armed proof fires the equal-height comparator. | **P0** | AC12 |
| **R13** | **D74-8.** A control click scrolls a whole snap-aligned page, and the probe asserts AC3's arithmetic per cell. | **P0** | AC13 |
| **R14** | The probe proves the control is actually **hit-testable** — that the stacking fix works, not merely that the handler runs. | P1 | AC14 |
| **R15** | The measured width set gains **750, 1010, 1920, 2560**. | P1 | AC15 |
| **R16** | The probe asserts the **selected rung** against D74-9's own arithmetic, per rail, per surface — the check that would have caught R10's defect. | P1 | AC16 |
| **R17** | Documentation is corrected: the provenance table, the `'use client'` scope, the R4 justification, the story note, and the three new decision citations. | P1 | AC17 |

### 16.4 Implementation requirements

#### 16.4.1 R10 — the ladder becomes a container query (D74-9)

`FACT` — the defect, and how it was found. The owner opened `/uk/listings/11-mr7ucly4` at a ~1411px viewport and
reported that the rail shows **no controls**. It shows five fully-visible cards of ≈159px. The detail route's
content column is ≈856px while the viewport is ≈1411px, so `@media (min-width: 80em)` selects the `n=5` rung
(18.56%) — a rung derived for the homepage's **1344px** container — and applies it to a container barely more than
half that size. The rail then does not overflow, so by D74-6's own correct rule no control and no peek render. The
controls are not broken; the width that feeds them is.

`FACT` — the same viewport therefore renders a 249px card on the homepage and a 159px card on the detail route.
That is a direct contradiction of this sprint's goal sentence and of **D74-2**.

Required change, and nothing more:

- `.wrapper` gains `container-type: inline-size`. It already exists and already establishes the positioning context
  for the controls; it becomes the query container too. Give it a container name only if a nested track ever needs
  to skip a level — it does not today, so do not add one.
- Every `@media (min-width: …em)` rung in the **D74-6 ladder** becomes `@container (min-width: …em)`. The rung
  values are unchanged: 30em / 48em / 64em / 80em, each still cited to `theme.ts:322-326`.
- **`grid` mode renders no wrapper** (§10.1, and the TSX early-returns before it). The grid is untouched by this
  change — AC9 still holds byte-for-byte.
- **D74-5's `@media (max-width: 30em)` stays a media query.** It is a *viewport* rule by the owner's own wording
  ("from 320px up to and including 480px" — that is a screen size, not a container size). Do not convert it. Say so
  in the source comment so the next reader does not read the mixture as an oversight.

`INFERENCE` — derived widths under D74-9, to be confirmed by measurement, not copied into the code as constants:
at containers 288 / 358 / 448 / 592 / 720 / 824 / 856 / 960 / 1344 the card lands at ≈184 / 229 / 280 / 243 / 280 /
242 / 251 / 280 / 249px — every one at or below `--listing-card-min`, and the detail rail moves from 159px to
≈251px. Where the cap binds (280px) the peek is still positive because the container is not an exact multiple of
the 296px pitch. **Measure all of it; report the real numbers, and if any rung lands above 280px or at a peek of
0, report that rather than tuning a percentage to hide it.**

#### 16.4.2 R11 — the probe visits a detail route

`FACT` — Revision 0's probe has exactly one navigation target. `measureHomeSections` goes to `${BASE_URL}/${LOCALE}`
and every one of the 27 cells across the three runs records `path: "/"`. `GRID_SELECTOR` is declared at `:37` and
referenced nowhere in the file.

- Take the detail slug from `process.env.DETAIL_SLUG`, defaulting to `11-mr7ucly4` (the slug in the owner's own
  reproduction and in `docs/sessions/2026-09-10-task810-the-rail-becomes-usable.md` §6). Exit **2** with a usage
  error if the page 404s — a missing fixture is a usage failure, not a product verdict.
- Emit one cell per `(width, path)` pair. Keep `path` in the cell so the JSON stays self-describing.
- The existing `no rail track found` hard-fail must apply to the detail path exactly as it does to `/`. Do not add
  a "skip if absent" branch; that is the fail-open this revision exists to close.
- `if (!r) continue` in the hard-fail loop is a fail-open — a null section silently passes. Make a null section a
  hard-fail.

#### 16.4.3 R12 — grid mode is measured, and its comparator is fired

- Add a `/{locale}/listings` cell that measures the `GRID_SELECTOR` track with the same shape: `cardHeights`,
  `equalHeights`, `firstChildWidth`, `childCount`. Controls, peek and scrollbar fields are `null` for a grid — assert
  `controlCount === 0` there and hard-fail on anything else.
- Apply the `unequal card heights` hard-fail to grid cells.
- **Second two-armed proof.** Plant: delete `.rail > a,\n.grid > a { height: auto }` from
  `MantineListingCardTrack.module.css`. Rebuild, probe into `rev1-heights-planted`, show exit **1** naming a grid
  cell (and, if the seeded rail data varies, a rail cell too). Revert, prove the revert with
  `git hash-object` matching the pre-plant value, probe into `rev1-heights-reverted`, show exit **0**. Both arms
  must be fired by the same final probe blob — quote `probeHash` from both JSONs.
- `FACT` — this matters because Revision 0's rail proof is content-homogeneous: `rail1`'s seven cards share one
  height at every width, so `equalHeights: true` there is compatible with a rule that does nothing. The comparator
  has never fired. AC4 asks for the varying case.

#### 16.4.4 R13 — paging (D74-8)

In `scrollByPage`, replace

```
const onePeek = cardWidth + gapPx
const delta = Math.max(el.clientWidth - onePeek, cardWidth || el.clientWidth)
```

with a whole snap-aligned page: `pitch = cardWidth + gapPx`, `delta = Math.max(Math.floor(el.clientWidth / pitch) * pitch, pitch)`.

`FACT` — the current form under-scrolls because it subtracts a whole card and `scroll-snap-type: x proximity` then
re-snaps the landing point. Measured, per `baseline-1`: 480 → 200 where AC3 wants 399; 640 → 259 vs 517; 768 → 454
vs 682; 872 → 515 vs 773. The new form lands on a snap point by construction, so nothing re-snaps it, and at the
872 cell it yields exactly `3 × 257.70 = 773.11` = `clientWidth − peek`.

Probe assertion: hard-fail when `|delta − (clientWidth − peekPx)| > 2`, **unless** `after === scrollWidth − clientWidth`
(a legitimate end-clamp, which is what the 1024 and 1440 cells already are). State that exemption in the failure
message so a future reader is not left guessing.

#### 16.4.5 R14 — the control must be hit-testable, not merely clickable

`FACT` — Revision 0's probe clicks with `el.evaluate(el => el.click())`, a raw DOM dispatch that bypasses hit-testing.
Keep it: the documented sticky-header actionability race is real and the reasoning is sound. But it means the
`z-index: var(--z-dropdown)` stacking fix — added because a real click hit-tested a card title instead of the
control — is proven by **nothing** in the retained evidence. The session log itself asks the reviewer to verify it,
and the reviewer cannot.

Add a cheap, independent assertion beside the click: read the control's `getBoundingClientRect()` centre, call
`document.elementFromPoint(cx, cy)`, and hard-fail unless the control `.contains()` the returned node. Record the
returned node's tag and class in the cell so a failure is diagnosable. This measures the stacking outcome without
depending on Playwright scrolling anything into view.

#### 16.4.6 R15 / R16 — widths and the rung assertion

- `WIDTHS` becomes `320, 390, 480, 481, 640, 750, 768, 872, 1010, 1024, 1440, 1920, 2560`. 750 and 1010 sit inside
  the two cap-binding windows Revision 0 flagged as untested; 1920 and 2560 are `docs/qa-profiles.md`'s canonical Q3
  viewports and were never measured.
- **R16 — assert the rung, not just the outcome.** For each measured rail, read the container width, derive the
  intended `n` from D74-9's thresholds, compute `expected = min(280, (100/n − 36/n²)% × container)`, and hard-fail
  when `|firstChildWidth − expected| > 1`. Record `container`, `rungN`, `expected` and `firstChildWidth` in the cell.
  This is the check that would have caught R10's defect on the first run: under the viewport ladder the detail rail
  measures 159px where the container-derived expectation is ≈251px.

#### 16.4.7 R17 — documentation corrections

1. **Provenance table** (`docs/sessions/…task810….md` §9): add `--radius-pill` (`globals.css:333`, quoted) for the
   scrollbar thumb's `border-radius`, and `radius="xl"` for the `ActionIcon` (a Mantine radius key, not a literal).
   Both are canonical; both were simply missing from the table AC8 requires to be complete.
2. **`'use client'` scope** — three places say "`rail` mode is a client component": the TSX doc block,
   `docs/component-catalog.md`'s new sentence, and session log §13. `'use client'` is a module directive, so `grid`
   mode is a client component too and `/[locale]/listings` now ships this module's JS. Correct all three sentences.
   Splitting `RailControls` into its own `'use client'` module to keep the track server-capable is **permitted but
   not required** — if you do it, say so and re-run the build; if you do not, the corrected sentence is the fix.
3. **R4 justification** — the CSS comment credits specificity alone. Add the decisive reason: `ListingCard.module.css`
   wraps its rules in `@layer utilities` (`:37`, `:113`) and this module is unlayered, so an unlayered declaration
   wins the cascade regardless of specificity.
4. **`RailNoOverflow`** — two cards at the `n=1` rung overflow a 320px canvas, so the story renders a control there
   and its name reads as a contradiction during the owner's 320px pass. Pin its `globals.viewport`, or state the
   intended viewport in `docs.description`.
5. **Decision citations** — the CSS must cite **D74-7** for `offset=36`, **D74-8** for the paging rule (in the TSX
   comment), and **D74-9** for the container ladder, each in place of the Revision 0 prose that flags them as open.

### 16.5 Scope — Revision 1

`src/design-system/mantine/patterns/MantineListingCardTrack.module.css` (R10, R17) ·
`src/design-system/mantine/patterns/MantineListingCardTrack.tsx` (R13, R17; R17.2's optional module split) ·
`scripts/task810-rail-controls-probe.mjs` (R11, R12, R13, R14, R15, R16) ·
`src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (R17.4 only) ·
`docs/component-catalog.md` (R17.2) · `docs/sessions/2026-09-10-task810-the-rail-becomes-usable.md` (a
`## Revision 1` section — do not rewrite the Revision 0 sections, mark superseded artifacts) · `docs/backlog.md` state.

### 16.6 Out of scope — Revision 1

Everything in §8 still applies, and additionally: the scrollbar rules · the control presence logic and its
tolerance · the D74-5 media query (it stays a media query — R10) · the i18n keys · `--listing-card-min`'s value ·
the `offset` value (D74-7 closed it) · `theme.ts`'s breakpoint values · `.grid`'s own rule · Revision 0's retained
evidence.

## 17. Acceptance criteria — Revision 1

- **AC10 [R10]** — Given `/{locale}/listings/$slug` at a 1440px viewport, then the Recently-viewed rail's card width
  is within 1px of `min(280, f_n × container)` for the rung its **container** selects, and is within 5px of the
  homepage's rail card width at the same viewport. State both containers and both card widths. Given `git diff`,
  then the D74-6 ladder contains no `@media` rule and the D74-5 rule still does.
- **AC11 [R11]** — Given the probe run, then every width produces a cell for `/` **and** a cell for the detail route,
  each with at least one rail; given a deliberately wrong `DETAIL_SLUG`, then the probe exits **2** with a usage error.
- **AC12 [R12]** — Given the probe run, then a `/{locale}/listings` grid cell records `cardHeights`, `equalHeights`
  and `controlCount: 0`; given the planted removal of `height: auto`, then the probe exits **1** naming a grid cell;
  given the revert, then `git hash-object` matches the pre-plant value and the probe exits **0**, both arms carrying
  the same `probeHash`.
- **AC13 [R13]** — Given a click on the next control at each width, then `|delta − (clientWidth − peekPx)| ≤ 2`, or
  the scroll ended at `scrollWidth − clientWidth`. Quote the per-cell arithmetic for all widths.
- **AC14 [R14]** — Given each rendered control, then `document.elementFromPoint` at its centre returns a node the
  control contains. State the returned tag/class per cell.
- **AC15 [R15]** — Given the probe run, then cells exist at 320/390/480/481/640/750/768/872/1010/1024/1440/1920/2560.
- **AC16 [R16]** — Given every measured rail on both surfaces, then `firstChildWidth` is within 1px of the
  container-derived expectation, and `container`/`rungN`/`expected` are recorded per rail.
- **AC17 [R17]** — Given the session log and `docs/component-catalog.md`, then the provenance table carries
  `--radius-pill` and `radius="xl"` with grepped definitions, no document says `rail` mode alone is a client
  component, the R4 comment names the `@layer` reason, and the CSS/TSX cite D74-7, D74-8 and D74-9.

## 18. Verification plan — Revision 1

Every gate from §13 is re-run because source changed; transcripts go to **new** names.

```powershell
$env:BASE_URL = "http://localhost:3000"
$env:DETAIL_SLUG = "11-mr7ucly4"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 · lint 0 errors, no touched file named · `check:stories` pass · `check:story-coverage`
**33 covered / 0 unproven** · design-tokens **0 violations, 0 stale markers, 0 missing-reason** · `npm run test` at
the Task 790 baseline (5 failures / 4 files), each named and proven pre-existing · `build-storybook` and `build`
exit 0 with `ƒ /[locale]/listings/[slug]` still present · both hygiene gates 0. Read every exit code from **inside**
its retained transcript.

Then the rendered evidence and the second two-armed proof:

```powershell
$env:BASE_URL = "http://localhost:3000"
$env:DETAIL_SLUG = "11-mr7ucly4"
git.exe hash-object src\design-system\mantine\patterns\MantineListingCardTrack.module.css
npm.cmd run build
Start-Process -FilePath "npm.cmd" -ArgumentList "run","start" -NoNewWindow
Start-Sleep -Seconds 15
node.exe scripts\task810-rail-controls-probe.mjs rev1-baseline
node.exe scripts\task810-rail-controls-probe.mjs rev1-heights-planted
node.exe scripts\task810-rail-controls-probe.mjs rev1-heights-reverted
git.exe hash-object src\design-system\mantine\patterns\MantineListingCardTrack.module.css
git.exe hash-object scripts\task810-rail-controls-probe.mjs
```

Expected: `rev1-baseline` exit **0**; `rev1-heights-planted` exit **1** naming a grid cell (run it with
`height: auto` removed, and rebuild before probing); `rev1-heights-reverted` exit **0**; the first and last
`hash-object` of the CSS identical; one `probeHash` across all three runs. Return all three JSONs and every hash.

**Transcript rule — unchanged from §13.** No `Tee-Object`. `[Console]::OutputEncoding` set before the first capture,
capture with `& cmd.exe /c "<command> 2>&1"`, write with `[System.IO.File]::WriteAllLines(path, lines, (New-Object
System.Text.UTF8Encoding($false)))`, append `EXIT_CODE=$LASTEXITCODE` **inside** each file, everything retained under
`docs/sessions/evidence/task810/transcripts/rev1-*.txt`. **All evidence in native Windows PowerShell.**

**`OWNER VISUAL QA REQUIRED` — unchanged from §13, plus one new mandatory row** (it is the row that caught R10):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| **Detail route, Recently viewed / Similar** | **card width matches the homepage's rail card at the same moment; controls present when more cards exist than fit** | **uk** | **1440, 1024** |

## 19. Completion report contract — Revision 1

Everything §14 requires, plus: the container width and card width for **every** rail on **both** surfaces at every
width, with the rung and the derived expectation beside each · the homepage-vs-detail card-width comparison at 1440
and 1024 (AC10) · the grid cell's heights · the second two-armed pair with both `hash-object` values and the shared
`probeHash` · the per-cell AC13 arithmetic · the AC14 hit-test results · confirmation that Revision 0's run
directories and transcripts are untouched and marked superseded, not deleted · which of R17.2's two options was
taken. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval.

## 20. Revision 1 quality gate

| Question | Required answer |
|---|---|
| Does R10 re-open the width standard? | No. It makes D74-2 **true** for the first time — one card width across surfaces at one viewport, which the viewport ladder silently broke. `--listing-card-min` and `.grid` are untouched. |
| Is a container query a new dependency or a new token? | No. `container-type: inline-size` is a CSS property on a wrapper that already exists, and the rung values stay `theme.ts`'s own 30/48/64/80em. |
| Why does D74-5 stay a media query? | Because the owner stated it in screen terms ("from 320px through 480px inclusive"). Converting it would silently change a rule the owner decided. R10 says so in the source. |
| Is `offset` still an open decision? | No — **D74-7** closed it at 36. Revision 1 removes the `CANONICAL STYLE DECISION REQUIRED` flag from the code and the log. |
| Is AC3 being relaxed to fit the implementation? | No — **D74-8** moves the implementation to meet AC3. The opposite was offered to the owner and rejected. |
| Does this task fix the `key` warning? | No. That is Task **808**, and the owner's 2026-09-10 reproduction has been folded into **its** kickoff, not this one. |
| Can the new gates fail? | Yes, and each names how: R12 fires a real planted arm; R16 was derived **from** a live defect and reproduces it numerically; R14 replaces an assertion that could not fail with one that can. |
