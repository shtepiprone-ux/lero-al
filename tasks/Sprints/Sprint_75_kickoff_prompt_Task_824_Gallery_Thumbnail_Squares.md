# Task 824 — The listing gallery's thumbnail row: canonical Mantine squares, not a stretching grid

Sprint 75 · **P1** · QA profile **Q3**

**Status: `READY FOR SONNET`.** Filed 2026-09-11 by the owner's rejection of Task 813's AC11 visual review. The
defect is **pre-existing** — `MantineListingGalleryPattern.tsx` is untouched by Tasks 813 and 820 (absent from both
diffs) — and was only surfaced because AC11 forced the story open.

## 1. Mode and task type

`IMPLEMENTATION` — UI. Replace the gallery's full-width stretching thumbnail grid with canonical Mantine square
thumbnails and move the overflow from the page into the row. No new data, no new props on the public API unless R4
proves one is unavoidable.

## 2. Objective

Owner instruction, 2026-09-11, verbatim:

> Необхідно зробити згідно Mantine канонічних квадратів! Ніякого хардкоду, він заборонений! Створи окрему задачу,
> референс Rozetka.com.ua.

And the owner's rejection that produced it:

> я не приймаю таку галерею … Вилазить за рамки екрану. Прев'ю картинок розтягнуті на всю ширину … в оригіналі
> прев'ю сука були майже квадратні, тобто такі як треба.

Reference: `https://rozetka.com.ua/ua/ideia-4823133300153/p545011785/` — a product gallery whose thumbnail row is a
strip of near-square previews that keep their shape regardless of how many there are, with the main photo in a fixed
container carrying prev/next controls and a `1/10` counter.

## 3. Verified context — measured 2026-09-11, re-measure at execution

### 3.1 The exact cause, read this session

`FACT` — `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:79`:

```tsx
<SimpleGrid cols={{ base: 4 }} spacing="xs" mt="xs">
```

A `SimpleGrid` always spans its container and divides that width into equal columns. With four columns the cell width
is `(container − 3 × spacing) / 4`, so each thumbnail is as wide as the container allows and its aspect ratio is
whatever is left over. **That is the stretching the owner rejected** — at 1440 the cells become very wide rectangles,
at 390 they compress. Nothing in the component pins a square.

`FACT` — `:51` sizes the main photo with Tailwind arbitrary values reading CSS custom properties:

```
className="… h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)]"
```

`FACT` — `MantineListingGalleryPattern.module.css` contains only `.photoCountBadge` and `.extraCountOverlay`
(overlay colours, Task 748/D34/D35). **No thumbnail sizing rule exists anywhere in the component.**

`FACT` — `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:4` imports
`Image, SimpleGrid, UnstyledButton, Paper, Text` from `@mantine/core`. `AspectRatio` is **not** imported here, and a
repo-wide search of `src/` this session returned **zero** `AspectRatio` usages anywhere. Adopting it is therefore a
**new canonical pattern for this project**, not a reuse — see §5.1.

### 3.2 What the gates did not see, and why

`FACT` — `check:design-tokens:strict`'s own header (`docs/sessions/evidence/task813/I10_design-tokens-strict.txt`)
reads: "scanning 454 production `src/**/*.{tsx,ts,css}` files **+ 91 canonical Mantine stories for Tailwind dimension
utilities**". For story files it inspects Tailwind dimension utilities only. A raw inline `style={{ width: 80 }}` in a
story is outside that scope. This is the Sprint 75 thesis again — the narrowing is the blind spot — and it is why a
human review, not a green gate, caught this.

`FACT` — the two blocking CI gates are currently red for inherited reasons, reserved as Tasks **822** and **823**.
This task must not make either worse; `check:design-tokens:strict`'s violation count is **56** today.

### 3.3 What is NOT established

`UNKNOWN` — **the canonical dimension source for the thumbnail size.** The owner forbids hardcode, so the square's
size must come from a registered token or theme value, not a literal. This kickoff deliberately does **not** name one:
per `docs/orchestrator-procedures.md`'s "A documented token is not an implemented token — grep the definition, never
the table", the executor must grep the definition and quote the matched line before consuming it. R2 covers this.

`UNKNOWN` — whether `--listing-gallery-h-*` are defined or merely documented. R2 greps them too; if a consumed custom
property has no definition, that is a finding to report, not a value to invent.

`UNKNOWN` — how many thumbnails the production data actually yields, and whether the current `+2` overflow badge
survives a scrolling row. R3 decides this against the reference, and it is the one place the reference and the current
component genuinely disagree.

`UNKNOWN` — every figure Task 809's census recorded about this component. Re-derive at execution.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.3 | Re-derive at execution: the component's current thumbnail markup, its `className` count, its `ui-imports` count, its manifest and own-Story status, and the live `check:surface-census --surface` result for it. Reconcile against §3.1 and explain every difference. §3's figures are a dated measurement, never to be copied. | **P0** | AC1 | Confirmed |
| **R2** | Owner instruction, §3.3 | **No hardcoded dimension may appear in the change** — not a raw px literal, not an inline `style={{ width: n }}`, not a Tailwind arbitrary value. The thumbnail square's size and the row's spacing come from Mantine theme values or registered project tokens, and for every custom property consumed the executor **greps its definition and quotes the matched line** before using it. If a needed value has no registered source, stop for `CANONICAL STYLE DECISION REQUIRED`; do not invent one. | **P0** | AC2, AC3 | Confirmed |
| **R3** | Owner instruction, reference | The thumbnail row is a **non-stretching horizontal strip of squares**: each thumbnail keeps a 1:1 ratio at every width, its size does not change with the number of thumbnails or the container width, and the image fills it with `cover` semantics rather than distorting. Overflow scrolls **inside the row**; the page and the pattern's own container never gain a horizontal scrollbar. | **P0** | AC4, AC5 | Confirmed |
| **R4** | §3.1, GR-3 | The square comes from the **canonical native Mantine pattern** — `AspectRatio` with `ratio={1}` is the primitive Mantine provides for exactly this, and §3.1 measured that the project has no existing contract for it. Because it is a first adoption, it gets its **own standalone canonical Story before the composition consumes it** (`docs/agent-contract.md` 16c, GR-3, and the UI-hierarchy gate in `create-task/SKILL.md`). Do not recreate a square with a feature-local CSS rule, a padding-top hack, or a fixed height. | **P0** | AC6, AC7 | Confirmed |
| **R5** | Reference | The main photo keeps a fixed container and gains the reference's two affordances **only if R1 proves they are absent**: prev/next controls and a position counter. Both are native Mantine (`ActionIcon` for the controls); the counter reuses the component's existing `photoCountBadge` treatment rather than inventing a second overlay style. If the owner's reference and the current lightbox-on-click behaviour conflict, that is §5's `CONFLICT`, not an executor choice. | P1 | AC8 | **Assumed — confirm in R1** |
| **R6** | §3.2 | `check:design-tokens:strict`'s violation count does not rise above the **56** measured on 2026-09-11, and `check:tailwind-runtime-tokens` gains no new debt row. This task neither fixes nor worsens Tasks 822/823. | **P0** | AC9 | Confirmed |
| **R7** | 812 R9 precedent | No gate script is modified. `scripts/check-rendered-scope.mjs`, `check-surface-census.mjs`, `check-surface-census-changed.mjs`, `map-changed-surfaces.mjs`, `audit-design-system-patterns.mjs`, `check-pattern-enrolment.mjs` and `check-media-enrolment.mjs` all have an empty `git diff --stat`. Both blocking baselines stay true; if either moves, it moves through its own `--update-baseline`. | **P0** | AC10, AC11 | Confirmed |
| **R8** | Q3 | The change is visible, so it carries an `OWNER VISUAL QA REQUIRED` matrix. No automated screenshot verdict substitutes for it — `screenshots:assert` and every alias are retired. | **P0** | AC12 | Confirmed |

## 5. Assumptions and open questions

### 5.1 The one thing that is a real decision

`AspectRatio` has **zero** current usages in `src/`. Adopting it makes this task the project's first canonical
consumer, which under the UI-hierarchy gate means its standalone Story lands **before** the gallery composes it. That
is R4 and it is not optional. What is **not** open: whether to use a feature-local square instead — the owner's
instruction closes that ("згідно Mantine канонічних квадратів", "ніякого хардкоду").

### 5.2 `CONFLICT` to surface, not to resolve alone

The reference's main photo has prev/next arrows that page through images **in place**. This component's main photo
currently **opens `LightboxView`** on click, and that behaviour is what `ListingGalleryPattern.stories.tsx`'s `play`
function asserts. If implementing R5's arrows would change or break the open-the-lightbox contract, stop and report
`BLOCKED — OWNER DECISION REQUIRED`, naming both behaviours. Do not silently replace one with the other.

### 5.3 Other

- **`ASSUMPTION` (reversible, stated)** — the thumbnail row stays inside `MantineListingGalleryPattern`; no new
  shared component is extracted. Reason: one consumer today. If R1 finds a second, say so before extracting.
- **Out of scope:** `LightboxView`'s own internals · `AppImage` · Tasks 822/823's inherited gate failures ·
  Task 813's `AppImage.stories.tsx` thumbnail row, which that task fixes under its own R17 · any data or API change.

## 6. Pre-read rule bundle

`docs/golden-rules.md` in full, GR-1 · GR-3 · the `Enforcement status` table · `docs/agent-contract.md` clauses
**9, 13, 16, 16a-16d** · `docs/qa-profiles.md` (Q3) · `docs/orchestrator-ui-task-design.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/design-system.md` §22-§23 — the token tiers and the raw-value rules ·
`src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` and its `.module.css` in full ·
`src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` — including its `play` function ·
`src/modules/listings/components/LightboxView.tsx` · `src/design-system/media/AppImage.tsx` and its `appImageConfig.ts`
— the `gallery-strip` variant and what it already does with `object-fit` · `scripts/check-design-tokens.mjs` — what it
scans in a story versus in production source · this kickoff.

## 7. Scope

- **Edited:** `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` and, only if R2 proves a rule
  cannot come from a Mantine prop or a registered token, its `.module.css` · `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx`.
- **New:** the standalone canonical Story for the square primitive R4 adopts, placed beside its siblings — say which
  directory and title you chose.
- **Written:** `docs/sessions/evidence/task824/*` · `docs/sessions/<date>-task824-*.md` · the concise `docs/backlog.md`
  state line.

## 8. Out of scope

Everything in §5.3. In particular: **no gate script is edited**, and **no raw dimension is introduced anywhere**,
including in a story fixture.

## 9. Current and required behavior

**Before.** `SimpleGrid cols={{ base: 4 }}` divides the full container width into four cells, so thumbnails stretch
into wide rectangles at desktop and compress at mobile; the pattern overflows its container at 1440.

**After.** The thumbnail row is a strip of 1:1 squares whose size is independent of container width and thumbnail
count, images fill them with `cover`, overflow scrolls within the row, and neither the page nor the pattern container
gains a horizontal scrollbar at 320, 390, 480, 768, 1024 or 1440.

## 10. Implementation requirements

1. **Order is load-bearing.** R1's census → R2's token greps → the standalone square Story → the composition change →
   the pattern's own Story update → gates → docs. The standalone proof comes first; that is the UI-hierarchy gate.
2. **Grep every custom property's definition before consuming it**, and quote the matched line in the session log.
3. **No raw dimension anywhere**, including story fixtures — the gate does not scan story inline styles (§3.2), so
   this is enforced by review, not by CI.
4. **Read and write through Node for any plant-and-restore probe**, never PowerShell `Get-Content -Raw` without
   `-Encoding utf8`.
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`.

## 11. Positive and negative flows

**Positive.** A listing with six photos renders a strip of equal squares; the seventh and eighth scroll into view
inside the strip; the page never scrolls sideways; clicking the main photo still opens the lightbox.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| One photo only | Yes | No thumbnail row at all — current behaviour, preserved |
| Zero photos | Yes | The existing placeholder state, unchanged and still not clickable |
| Many photos (≥ 8) | Yes | Squares keep their size; the row scrolls horizontally; the container does not grow |
| A non-square source image | Yes | `cover` crop inside the square; never a distorted aspect |
| Narrowest supported width (320) | Yes | No horizontal page scrollbar; squares keep their size |
| A consumed custom property has no definition | Yes | Report it; do not invent a value — §3.3 and R2 |
| Authorization / RLS / network / concurrent writer | **No** | one pattern component, one new Story, one Story update |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the census re-derived at execution, then the component's thumbnail markup, `className` count,
  `ui-imports` count, manifest and own-Story status and its `check:surface-census --surface` result are stated and
  reconciled against §3.1. Quote the totals and the commands.
- **AC2 [R2]** — Given the final diff, then a search for raw dimension literals across every changed file returns
  **zero** — no inline `style` width/height/maxWidth number, no `px` literal, no Tailwind arbitrary `[...]` dimension.
  Quote the search and its empty result.
- **AC3 [R2]** — Given every custom property or theme value the change consumes, then each one's **definition** is
  quoted from its source file with a line reference. A value documented but not defined is reported as a finding.
- **AC4 [R3]** — Given the rendered thumbnail row, then each thumbnail's measured width equals its measured height
  (1:1 within 1px) and that measurement is **the same number** at 320, 390, 480, 768, 1024 and 1440. Quote the six
  measurements per width; equal-within-1px across all six is the pass condition.
- **AC5 [R3]** — Given the pattern at each of those six widths, then `document.documentElement.scrollWidth` does not
  exceed `clientWidth`, and the pattern's own container has no horizontal overflow; any overflow is on the thumbnail
  row element itself. Quote the measurements.
- **AC6 [R4]** — Given the new standalone Story for the square primitive, then its `meta.title` satisfies
  `isCanonicalMantineTitle`, it statically imports the real primitive by direct file path, and it renders the square
  at its own states. Quote the title, the import line and the render.
- **AC7 [R4]** — Given `MantineListingGalleryPattern.tsx` after the change, then the square comes from the Mantine
  primitive named in R4 and **not** from a local CSS rule, a padding-top hack or a fixed height. Quote the hunk.
- **AC8 [R5]** — Given R1's finding on the main photo's controls, then either the prev/next controls and counter are
  implemented from native Mantine and quoted, or R5 is recorded `NOT APPLICABLE` with the measured reason. If §5.2's
  `CONFLICT` fires, `BLOCKED — OWNER DECISION REQUIRED` instead.
- **AC9 [R6]** — Given `npm run check:design-tokens:strict` and `npm run check:tailwind-runtime-tokens` on the final
  tree, then the first reports **no more than 56** violations and the second gains no new debt row. Quote both totals
  against the 2026-09-11 figures.
- **AC10 [R7]** — Given the final tree, then `git diff --stat` is **empty** for the seven scripts named in R7. Quote it.
- **AC11 [R7]** — Given `check:rendered-scope`, `check:surface-census:changed`, `check:story-coverage`,
  `check:stories`, `check:pattern-enrolment`, `check:media-enrolment` and every `*:verify` self-test, then all exit 0;
  any baseline movement went through its own `--update-baseline` and every added or removed entry is listed. Quote the
  scope blocks. `npm run build` exits **0** (mandatory, `agent-contract` clause 9).
- **AC12 [R8]** — `OWNER VISUAL QA REQUIRED`. Given the changed Stories, then the owner reviews and records accepted
  or returned for each tuple: `Patterns/Mantine/ListingGalleryPattern → Default` at **320, 390, 480, 1440** in `en`,
  each with the lightbox **closed** and **open**; plus the new standalone square Story's `Default` at **390** and
  **1440** in `en`. Ten tuples. Name them in the completion report.

**GR-4 AC AUDIT — 12 criteria; each states an observable property; absolutes: AC2's "zero" and AC10's "empty diff" are
this task's defined outcome, scoped to named files; AC4's 1px is a measurement tolerance, not a pixel-perfect claim.**

## 13. QA profile and verification plan

**`Q3 Full Visual Matrix`** — `docs/qa-profiles.md` selects Q3 for a migrated Mantine primitive and for high-risk
responsive work. This changes visible chrome on a listing-detail surface and adopts a primitive the project has never
used; it is not Q4 because no critical flow, auth path, RLS policy or data write is touched.

### 13.1 Baseline — capture before any edit

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task824"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build
```

Expected: `win32`; the Node version; the project root; the worktree state; the per-surface census with its current
nodes; **56** design-token violations and the single known Tailwind-token row, both recorded as the ceiling AC9
measures against; and a zero-exit build. **Return all of it before changing any tracked file.**

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment:verify
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: typecheck 0 · lint 0 · coverage 0 · `check:stories` 0 violations · rendered-scope 0 new / 0 stale · every
self-test passing every arm · design-tokens **≤ 56** · no new Tailwind-token row · `build` **exit 0** · both hygiene
gates clean. **Record every exit code inside its own transcript and the `git hash-object` of every changed file.**

### 13.3 The geometry measurement (AC4/AC5)

Measure in the built Storybook, not by eye. For each of 320/390/480/768/1024/1440: the bounding box of every
thumbnail element, and `document.documentElement.scrollWidth` versus `clientWidth`. Retain the raw numbers, then
derive the equal-within-1px and no-page-overflow conclusions from them — a screenshot is not a measurement.

### 13.4 Owner visual review

AC12's ten tuples, opened by the owner. `screenshots:assert` and every alias are retired (owner decision 2026-09-03)
and must not be run or cited.

### 13.5 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline with the 56-violation ceiling · AC1's reconciled census ·
AC2's empty raw-dimension search · AC3's quoted token definitions · AC4's six-width measurement table · AC5's overflow
measurements · AC6's title, import and render · AC7's quoted hunk · AC8's controls or its `NOT APPLICABLE` reason ·
AC9's two totals · AC10's empty diff · AC11's scope blocks and the zero-exit build · AC12's ten tuples · every command
with its real exit code and transcript path · the `git hash-object` of every changed file · assumptions · deviations ·
limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED — OWNER DECISION REQUIRED`
if §5.2's `CONFLICT` fires. Do not self-approve; Sonnet runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Is the cause measured or guessed? | **Measured** — `SimpleGrid cols={{ base: 4 }}` at `:79` divides the container width into four cells; nothing pins a ratio. §3.1 quotes the line. |
| Is this Task 813's defect? | **No.** `MantineListingGalleryPattern.tsx` appears in neither 813's nor 820's diff. AC11 of 813 surfaced it; it did not cause it. |
| Is any hardcode permitted? | **No** — the owner's instruction, R2 and AC2. Not a px literal, not an inline style number, not a Tailwind arbitrary value, not in a fixture. |
| Where does the square come from? | **Mantine's own `AspectRatio`**, ratio 1 — R4. Zero current usages in `src/`, so it is a first adoption and gets its standalone Story **before** the composition, per 16c and GR-3. |
| Could this hide behind a green gate? | **It already did** — `check:design-tokens:strict` scans stories for Tailwind utilities only, not inline styles (§3.2). AC2 and AC4 are review-enforced measurements, not gate results. |
| What could stop this task? | The reference's in-place prev/next versus the current open-the-lightbox contract — §5.2's `CONFLICT`, an owner decision, not an executor's call. |
