# Task 806 — the canonical listing-card track: one width, two modes, no breakpoints

Sprint 74 · `tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md` · P1 · QA **Q3**

## 1. Mode and task type

`IMPLEMENTATION` · new canonical Mantine layout primitive + its canonical Storybook proof + one new design token.
Current-Mantine path (`docs/mantine-responsive-design-system.md` + `docs/tailadmin-style-reference.md`), not legacy.

**No consumer is migrated in this task.** Task 807 does that. Strongest permitted result is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

## 2. Objective

Create the one place that decides how wide a listing card is, and prove it standalone before anything consumes it:
a shared track primitive with a `grid` mode and a `rail` mode, both driven by a single custom property
`--listing-card-min`, with **zero media queries**.

## 3. Verified context — measured 2026-09-10, do not re-derive from a document

### 3.1 The five disagreeing surfaces

`FACT` — the table in the sprint file §"The measured defect" was read from these exact lines:
`FeaturedListingsView.tsx:91`, `LatestListingsView.tsx:63`, `ListingsShellView.tsx:127`,
`RecentlyViewedGridView.module.css` (`.card { width: calc(var(--mantine-spacing-xl) * 8) }` = 192px),
`SimilarListingsView.module.css` (`.card { flex: 0 0 calc(100% / 1.2) }` + three `flex-basis` media queries).
**None of these files is edited by 806.**

### 3.2 Breakpoints, for reference only — this task adds none

`FACT` — `src/design-system/mantine/theme.ts:315-327`: `xs 20em` · `xs2 30em` · `sm 40em` · `md 48em` · `lg 64em` ·
`xl 80em` · `xxl 90em`. 806's CSS module must contain **no** `@media` rule at all; that is the point of D74-1.

### 3.3 Where a custom property must be defined, and why the gate cares

`FACT` — `scripts/check-design-tokens.mjs` flags *"Undefined CSS custom-property references: `var(--x)` in a .css
file where `--x` is not defined"*. Defining the token is therefore not optional bookkeeping; an undefined
`var(--listing-card-min)` is a gate violation **and** silently resolves to the property's initial value at
computed-value time (the Task 714→716→715 `--z-sticky` failure class; `docs/design-system.md` §22.3's ⚠️ banner).

`FACT` — the project's precedent for a runtime custom property is the `:root` block in `src/app/globals.css`
starting at line 327, which carries `--homepage-runtime-space-0 … -3` at lines 370-374. That is where the new token
goes. **Quote the matched definition line in the completion report.**

`FACT` — the scanner exempts token-anchored function forms: `min(var(--token), <literal>)` and
`calc(var(--token) …)` are not raw-literal violations (its own doc block, lines 35-39 and 203-209). A bare `280px`
or a bare `82%` outside such a form is not exempt.

### 3.4 The mechanism the owner chose, and the arithmetic behind it

`FACT` — D74-1/D74-2/D74-3, recorded in the sprint file, taken 2026-09-10 after the measured table was shown.

`INFERENCE` — **verify this by measurement in §13, do not ship it on my arithmetic.** With
`--listing-card-min: 17.5rem` (280px at a 16px root):

| Container | `grid` mode `repeat(auto-fill, minmax(280px, 1fr))` | `rail` mode `flex: 0 0 min(280px, 82%)` |
|---|---|---|
| 288px (320 viewport) | 1 column, 288px | 236px card, **52px peek** |
| 358px (390 viewport) | 1 column, 358px | 280px card, **78px peek** |
| 720px (768 viewport) | 2 columns, ~352px | 280px cards |
| 976px (1024 viewport) | 3 columns, ~317px | 280px cards |
| 1200px+ | 4 columns, ~288px | 280px cards |

Both halves of D74-3 fall out of one expression with no breakpoint. If the measurement contradicts this table,
**report it as a deviation and stop** — do not add a media query to force the numbers.

### 3.5 The canonical-story gate applies, and this task is its first half

`FACT` — `scripts/mantine-migration-scope.json` is a flat array of 32 source paths;
`npm run check:story-coverage` currently reports `32 covered / 0 unproven`. Adding the new primitive's source path
makes it **33/33**. `check:story-coverage` counts canonical story files under the title prefixes
`Mantine/Primitives/` and `Patterns/Mantine/`.

`FACT` — pattern-level primitives live in `src/design-system/mantine/patterns/` with a `Mantine*` prefix and, when
they need CSS, a sibling `.module.css` (`MantineListingCardPattern.tsx` + `.module.css`,
`MantineHomeSection.tsx` + `.module.css`, `MantineListingGalleryPattern.tsx` + `.module.css`). Their stories live in
`src/stories/patterns/mantine/` with a `Patterns/Mantine/…` title.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | `--listing-card-min: 17.5rem` is **defined** in `src/app/globals.css`'s `:root` block, beside the `--homepage-runtime-*` tokens, with a comment naming D74-2 and Task 806. | P0 | AC1 |
| **R2** | A new shared primitive `MantineListingCardTrack` renders its children in exactly two modes — `grid` and `rail` — both sized only by `var(--listing-card-min)`. | P0 | AC2 |
| **R3** | Its CSS module contains **no `@media` rule** and no raw length literal outside a token-anchored `min()`/`calc()`. | P0 | AC3 |
| **R4** | A canonical story `Patterns/Mantine/ListingCardTrack` statically imports the real primitive and exports both modes plus the zero/one/many item states. | P0 | AC4 |
| **R5** | The primitive's source path is registered in `scripts/mantine-migration-scope.json`; `check:story-coverage` goes 32 → **33** covered, 0 unproven. | P0 | AC5 |
| **R6** | **No existing consumer changes.** All five card surfaces, `ListingCard`, and `LISTING_LAYOUT_SIZES` are byte-unchanged. | P0 | AC6 |
| **R7** | The measured grid/rail geometry matches §3.4's table at 320/390/768/1024/1440, or the deviation is reported rather than patched with a media query. | P1 | AC7 |
| **R8** | No new i18n string, no new theme value beyond R1's token, no `design-tokens-allow` marker, no allowlist entry; `check:design-tokens --strict --scope=mantine` stays **0**. | P1 | AC8 |

## 5. Assumptions and open questions

- **`OWNER DECISION — D74-1/D74-2/D74-3`, 2026-09-09..10.** Settled; do not re-open. The number is 280px, the
  mechanism is `auto-fill` + a shared rail width, and phones get rails with a peek plus a single-column search grid.
- **`ASSUMPTION (reversible, stated)` — the rail's `82%` clamp.** It exists only so a 320px viewport keeps a visible
  peek; §3.4 shows it stops binding above a ~342px container. It is a starting point for the owner's visual review,
  not a measured product rule. It must appear as `min(var(--listing-card-min), 82%)`, never as a media query.
- **`ASSUMPTION (reversible, stated)` — `gap`.** `var(--mantine-spacing-md)` in both modes, matching the value
  `SimilarListingsView.module.css` already uses, so 807's diff does not also change spacing.
- **`UNKNOWN`** — whether `SimpleGrid`'s `spacing` prop values currently in use (`md`, `sm`, `lg`) resolve to the
  same token. Not this task's question: 806 sets the track's own gap and 807 reconciles each consumer.
- **Out of this task:** every consumer, `LISTING_LAYOUT_SIZES`, `ListingCard`'s internals, and the homepage section
  shell — Task **807**.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15) · `docs/ai-behavior.md` Notes 18-23 · `docs/rule-index.md` →
**Current Mantine path**: `docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md`,
`docs/component-rules.md` · `docs/design-system.md` §22 (token tiers) and §23.6.b · `docs/qa-profiles.md` ·
`docs/storybook-governance.md` · `docs/backlog.md` · this sprint's plan file for **D74-1 … D74-3**.
Do not read all docs.

## 7. Scope

`src/app/globals.css` (**one** added token line plus its comment, inside the existing `:root` block) ·
`src/design-system/mantine/patterns/MantineListingCardTrack.tsx` (new) ·
`src/design-system/mantine/patterns/MantineListingCardTrack.module.css` (new) ·
`src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (new) ·
`scripts/mantine-migration-scope.json` (one added entry) · `docs/component-catalog.md` (one new row) ·
`docs/backlog.md` state and the session log.

## 8. Out of scope

`FeaturedListingsView` · `LatestListingsView` · `RecentlyViewedGridView` · `SimilarListingsView` ·
`ListingsShellView` · `FavoritesShell` · `CabinetShell`/`ListingsTab` — **read them as context, do not edit them**
(807) · `ListingCard.tsx` and `MantineListingCardPattern` · `src/lib/imageDelivery.ts` and every `layoutContext`
call site (807) · `theme.ts` breakpoints · everything Sprint 72 and 73 own.

## 9. Current and required behavior

**Before:** there is no shared listing-card track. Each surface hand-authors its own column ladder or card width,
and `--listing-card-min` does not exist (`Select-String -Path src\app\globals.css -Pattern '--listing-card-min'`
returns nothing — confirm this before writing, and quote the empty result).

**After:** one primitive and one token exist and are proven in Storybook. The rendered site is **unchanged** —
nothing imports the primitive yet. That is the deliberate shape of this task.

## 10. Implementation requirements

### 10.1 The token (R1)

In `src/app/globals.css`, inside the existing `:root` block that starts at line 327, beside the
`--homepage-runtime-*` group:

```css
  /* Task 806 (D74-2, owner decision 2026-09-10) — the one number that sizes every listing card on the
     site. Grids consume it as an auto-fill minimum track, rails as a fixed item width; the column count
     is the browser's arithmetic, never a hand-authored breakpoint ladder (D74-1). */
  --listing-card-min: 17.5rem; /* 280px at a 16px root */
```

Do not add it to `@theme inline`, do not add a Mantine `theme.other` key, and do not create a second alias.

### 10.2 The primitive (R2)

`MantineListingCardTrack.tsx` — a presentational component, no data access, no `use client` unless a hook forces it
(it should not). Props:

- `mode: 'grid' | 'rail'` — required, no default. A caller that does not state its mode is a bug, not a convenience.
- `children: React.ReactNode`
- `data-testid` passthrough and a `className` merge so 807 can attach a section wrapper without a second element.

It renders one element with `styles.grid` or `styles.rail`. It does **not** wrap each child: in `grid` mode the
children are the grid items, in `rail` mode the flex items. 807's consumers therefore pass `ListingCard` directly.

### 10.3 The CSS module (R2, R3)

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--listing-card-min), 1fr));
  gap: var(--mantine-spacing-md);
}

.rail {
  display: flex;
  gap: var(--mantine-spacing-md);
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
}
.rail::-webkit-scrollbar {
  display: none;
}
.rail > * {
  flex: 0 0 min(var(--listing-card-min), 82%);
  scroll-snap-align: start;
}
```

**No `@media` rule anywhere in this file.** The header comment must state why: D74-1 makes the column count the
browser's arithmetic, and the `82%` clamp exists only to keep a peek visible at a 320px viewport (§3.4).

### 10.4 The canonical story (R4)

`src/stories/patterns/mantine/ListingCardTrack.stories.tsx`, title `Patterns/Mantine/ListingCardTrack`, with a
**static** import of `MantineListingCardTrack` (a dynamic import does not satisfy `check:story-coverage`). Required
exports:

| Export | State it proves |
|---|---|
| `Grid` | 8 fixture cards in `grid` mode |
| `Rail` | 8 fixture cards in `rail` mode — the peek is the thing being proven |
| `GridSingleItem` | 1 card in `grid` mode — the auto-fill single-column case |
| `RailSingleItem` | 1 card in `rail` mode — a rail that cannot overflow is not a defect (the Task 803 §16.4d lesson) |
| `Empty` | 0 children — the track renders nothing visible and does not collapse the page |

Fixtures are deterministic and **identified as fixtures** in the story file's doc comment. Use the real
`ListingCard` with the fixture shape the existing `ListingCard.stories.tsx` already uses — read it first and reuse
its fixture, do not invent a second listing shape.

### 10.5 Registration (R5)

Add `"src/design-system/mantine/patterns/MantineListingCardTrack.tsx"` to `scripts/mantine-migration-scope.json`.
State the before/after counts from the real transcript: **32 → 33** covered, 0 unproven.

### 10.6 Preservation (R6)

`git status --porcelain` must show **no** entry for any file in §8. Sprint 72's uncommitted 803 artifacts
(`SimilarListingsView.*`, `SimilarListings.tsx`, `similarity.*`, `ListingDetailView.tsx`, `component-catalog.md`,
the 803 session log and evidence) are already modified when this task starts: this is a **dirty worktree**. Take a
`git --no-optional-locks status --porcelain` snapshot **before** the first write, retain it in the session log, and
compare against it at the end. An entry present in both snapshots is pre-existing 803 work; a new entry outside §7
is a scope violation. `docs/component-catalog.md` is the one file in both lists — it is already modified by 803 and
is also in 806's scope, so record its `git hash-object` before and after your edit and show that your diff adds only
the new row.

## 11. Positive and negative flows

**Positive:** open `Patterns/Mantine/ListingCardTrack` → `Grid` at 1440 shows 4 columns of ~288px; narrow to 1024 →
3; to 768 → 2; to 390 → 1 full-width. Switch to `Rail` → cards stay 280px at every width ≥ ~342px container and the
next card peeks; at 320 the card is ~236px and the peek is ~52px.

| Negative flow | Applicable | Why |
|---|---|---|
| Zero children | **Yes** | `Empty` story; the track must not reserve height or throw. |
| One child | **Yes** | `GridSingleItem`/`RailSingleItem`; a single card must fill the grid column and must not make the rail overflow. |
| Undefined token | **Yes** | If `--listing-card-min` is missing, `minmax()` and `min()` become invalid at computed-value time and the layout silently degrades. AC1's grep is the guard. |
| Very long locale text | **Yes** | `uk` fixture titles; the card must not push the track wider than its container. |
| Missing data / network failure | No | Presentational primitive with no data access. |
| Authorization / RLS | No | No query, no user state. |
| Duplicate action / repeated execution | No | No callback, no mutation. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `Select-String -Path src\app\globals.css -Pattern '^\s*--listing-card-min\s*:'`, then exactly
  **one** match is returned and its line is quoted in the session log. Given the same grep run **before** the edit,
  then it returned nothing (quote both).
- **AC2 [R2]** — Given `MantineListingCardTrack` with `mode="grid"`, then its root carries the grid class and its
  computed `grid-template-columns` resolves to more than one track at a 1200px container; given `mode="rail"`, then
  its root computes to `display:flex` with `overflow-x:auto` and its first child's computed `flex-basis` is `280px`
  at a 976px container. Measured, not read from source.
- **AC3 [R3]** — Given `Select-String -Path src\design-system\mantine\patterns\MantineListingCardTrack.module.css
  -Pattern '@media'`, then **0** matches; and the file contains no length literal outside a `min()`/`calc()` that
  references a `var(--…)`.
- **AC4 [R4]** — Given `npm run check:stories`, then it passes; and the story file statically imports
  `MantineListingCardTrack` and exports all five states of §10.4.
- **AC5 [R5]** — Given `npm run check:story-coverage`, then it reports **33 covered, 0 unproven** (state the 32
  before-count from the same command run before the edit).
- **AC6 [R6]** — Given the pre-write `git status --porcelain` snapshot and a fresh one after the final build, then
  the two differ only by §7's paths. No file named in §8 appears as newly modified.
- **AC7 [R7]** — Given the §13 measurement script against the built Storybook story, then the `grid` column count
  and the `rail` first-child width at 320/390/768/1024/1440 match §3.4's table, or every deviating cell is reported
  with its measured value. A media query added to make a cell match is a task failure, not a fix.
- **AC8 [R8]** — Given `node scripts/check-design-tokens.mjs --strict --scope=mantine`, then **0** violations and 0
  stale markers; and `git diff messages/` is empty.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** `docs/qa-profiles.md` assigns Q3 to a *"New or migrated Mantine primitive …
or high-risk responsive work"*. Both apply: this is a new canonical primitive **and** the responsive contract for
every card on the site. It is **not** Q4 — no file in `docs/critical-flow-registry.md` is touched, and no consumer
changes.

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 errors · lint 0 errors and the current warning count with no new file named ·
`check:stories` pass · `check:story-coverage` **33 covered, 0 unproven** · design-tokens 0 · `npm run test` at the
Task 790 baseline **plus** whatever Task 803 has added if it is still uncommitted — name each failing file and
prove it pre-existing rather than reporting a bare exit code · `build-storybook` success · `build` exit 0 ·
both hygiene gates 0. Return each exit code read from **inside** its retained transcript.

**Rendered measurement (AC2/AC7).** A source reading does not close a computed-style criterion
(`docs/orchestrator-procedures.md` → Evidence-first preflight keeps source rules, computed CSS and geometry
separate). Write `scripts/task806-card-track-computed.mjs` following the convention of
`scripts/task803-similar-row-computed.mjs` — read it before writing: `playwright` `chromium`, `BASE_URL` from env,
`probeHash`/`gitCommit` via `execFileSync('git', …)` with no shell, one immutable run directory per invocation via
`writeFile(..., { flag: 'wx' })`, `process.exit(1)` on a hard fail and `2` on usage error. It measures the **built
Storybook** iframe, not the app (no consumer exists yet). Per cell record: `mode`, `width`, the root's computed
`display`/`gridTemplateColumns`/`overflowX`, the resolved column **count**, the first child's computed `flexBasis`
and `getBoundingClientRect().width`, `trackScrollWidth`/`trackClientWidth`, and `docScrollWidth`/`docClientWidth`.
Hard-fail on: a missing root node, a zero-area rect, `grid` mode not computing to `display:grid`, `rail` mode not
computing to `display:flex` with `overflow-x` in `auto`/`scroll`, page-level horizontal overflow at 320 or 390, or
**any `@media` having been needed**. Widths: 320, 390, 768, 1024, 1440. Both modes.

**Two-armed proof (Q3 gate claim).** Temporarily change `--listing-card-min` to a value that must break the
expectation (`5rem`), rebuild Storybook, re-probe into a planted `runId`, and show the probe exits **1** naming the
changed column count. Then revert, prove the revert with `git hash-object src/app/globals.css` matching its
pre-plant value, re-probe into a **fresh** `runId`, and quote both outcomes. A probe whose failing arm was never
fired is not evidence that it measures anything — and the failing arm must be fired by the **final** version of the
probe script; if you edit the script after the planted run, re-fire both arms. (This is Task 803 finding F8,
verbatim, and it is the single most likely way this task fails review.)

**Transcript rule.** Do not pipe a native command through `Tee-Object` — Windows PowerShell 5.1 writes UTF-16LE,
which `check:file-integrity` rejects as NUL bytes. Capture with `& cmd.exe /c "<command> 2>&1"`, and set
`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` **before** the first capture or the eslint summary glyph
lands as `Ô£û` (Task 803 F9). Write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))` and append
`EXIT_CODE=$LASTEXITCODE` **inside** the file. Retain everything under `docs/sessions/evidence/task806/`.

**`OWNER VISUAL QA REQUIRED`** — in the built Storybook, on the real story (not the toolbar viewport switcher, which
Task 799 measured as never resizing the preview — resize the browser window):

| Story | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingCardTrack` → `Grid` | 8 cards | uk, sq | 320, 390, 768, 1024, 1440 |
| `Patterns/Mantine/ListingCardTrack` → `Rail` | 8 cards, **the peek must be visible** | uk, sq | 320, 390, 768, 1024, 1440 |
| `Rail` | 1 card, no overflow | uk | 390 |
| `Grid` | 1 card fills its column | uk | **320 (mandatory)** |
| `Empty` | nothing renders, no reserved height | uk | 390 |

## 14. Completion report contract

Files changed · requirement IDs completed · the pre-edit and post-edit `--listing-card-min` grep, both quoted ·
the primitive's full source and its CSS module · the story's five export names · story-coverage before/after
counts from the real transcripts · the probe's full JSON for both modes × five widths · the planted/reverted probe
pair with the `git hash-object` revert proof and the probe script's own hash on **both** runs · the pre-write and
post-build `git status --porcelain` snapshots and their diff · `docs/component-catalog.md`'s before/after
`git hash-object` · commands run with real exit codes and transcript paths · assumptions · deviations · known
limitations · anything left open. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Can a fresh Sonnet session execute this without chat context? | Yes — §3 carries every measured fact, §10 carries the exact CSS and the exact token line, §13 carries every command. |
| Does this task change anything the user can see? | No. Nothing imports the primitive until 807. That is what makes 806 safely reviewable on its own. |
| Is the 280px value invented? | No — **D74-2**, owner decision 2026-09-10, taken after the five-surface measurement was put in front of him. §3.4's derived geometry is labelled `INFERENCE` and must be measured. |
| Is a media query permitted anywhere? | No. AC3 greps for it. If the geometry does not work without one, that is a deviation to report, not to patch. |
| Does the token exist? | Not yet — AC1 requires the pre-edit grep to return **nothing** and the post-edit grep to return exactly one definition line. A tabled token is not an implemented token. |
| Is a new permanent story justified? | Yes — the primitive is an in-scope production source that 807 will consume; the canonical-story-before-composition rule requires its standalone proof to exist first. It is not a gate probe. |
| Does the probe risk Task 803's F8? | It is called out verbatim in §13: both arms from the same final script blob, or re-fire both. |
| Is the worktree clean at start? | No — Sprint 72's 803 diff is uncommitted. §10.6 requires a pre-write porcelain snapshot and a comparator, not an assumed clean status. |
