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
