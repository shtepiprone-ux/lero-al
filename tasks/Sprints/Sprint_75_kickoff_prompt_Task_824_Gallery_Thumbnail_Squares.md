# Task 824 — The listing gallery's thumbnail row: canonical Mantine squares, not a stretching grid

Sprint 75 · **P1** · QA profile **Q3**

**Status: `NEEDS REVISION`** (Opus implementation review 2, 2026-09-12; review 1 same day). Filed 2026-09-11 by the owner's rejection of Task 813's AC11 visual review. **§16 implemented and reviewed; the current route is §17 — read §17 first, then §16 for the decisions it records. The four owner decisions answered 2026-09-12 stand and are not reopened; §1-§15 are the original scope and are amended only where §16 says so.** The
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

*Resolved 2026-09-11 by owner decision (Task 813 review Revision 4, verbatim in the sprint file):* the thumbnail square
is **44 × 44 px** from `theme.other.boxSize.galleryThumb` (`'2.75rem'`), which Task 813 R17 adds to
`src/design-system/mantine/theme.ts`. Consume that role; grep and quote its definition per R2. If 813 has not landed
when this task executes, stop and report — do not add the role here. *Also corrected by the same review:* §3.1/§5.1's
"zero `AspectRatio` usages in `src/`" is false — `src/modules/listings/components/FeaturedListingsView.tsx:4,24`
already renders `AspectRatio ratio={theme.other.listingSkeleton.mediaRatio}`; R4's standalone-Story requirement is
unaffected.

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

---

## 16. Revision 1 — Opus implementation review, 2026-09-12: `NEEDS REVISION`

Reviewed tree: the working tree as of 2026-09-12, evidenced by
`docs/sessions/2026-09-12-task824-gallery-thumbnail-squares-and-nav-controls.md` session-log §1–§10.12 and
`docs/sessions/evidence/task824/00`–`117`. The implementation of §1–§15's own R1–R8 is largely present and the
44 × 44 token consumption is correct (`theme.ts:451 galleryThumb: '2.75rem'`, grepped by the reviewer). What follows
are the blocking defects only. §16 is the sole executable route for the next session; where it contradicts §1–§15,
§16 wins.

### 16.1 Re-entry mode

`remediation`, not `from-scratch`. Start at §16.3. Do **not** re-run §13.1's baseline capture: the 56-violation
`check:design-tokens:strict` ceiling and the single `check:tailwind-runtime-tokens` debt row are already established
and are unchanged by this revision. Preserve every existing artifact under `docs/sessions/evidence/task824/`;
number this revision's transcripts from `118` upward and never overwrite `00`–`117`. Append to the existing session
log (`docs/sessions/2026-09-12-task824-...md`) as its new session-log §11; do not rewrite its session-log §1–§10.12 — they are the record of
what was reviewed.

### 16.2 Owner decisions — ANSWERED 2026-09-12, recorded verbatim

All four are resolved and there is no remaining `STOP` in this kickoff: implement §16.3 in full. The owner's words,
verbatim, 2026-09-12 (also recorded in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`):

> D824-1: A — нижче 640px додати mouse/pointer drag і keyboard arrows; mobile chrome лишається без thumbnails та side arrows.
>
> D824-2: A — винести GalleryNavActionIcon, GalleryDesktopNavigation і GalleryThumbnailButton з LightboxView у src/design-system/mantine/patterns/, із окремими Stories та enrollment.
>
> D824-3: A — desktop thumbnail click лише обирає фото; lightbox відкривається тільки через main photo.
>
> D824-4: зареєструвати потрібні значення для 2px border і 16px × 2px pagination segment як theme.other roles, без raw literals.

**D824-1 → option (A).** The measured cause this closes: below 640px the only way to change photo is a `touch*`
gesture — `GalleryDesktopNavigation` returns `null` (`LightboxView.tsx:85`), both thumbnail strips are
`!isMobile`-gated (`MantineListingGalleryPattern.tsx:117`, `LightboxView.tsx:240`), the lightbox pagination rail is
non-interactive `<span>`s under `role="presentation"` (`LightboxView.tsx:258-264`), and `useSwipeTrackSync` binds only
`touchstart`/`touchmove`/`touchend`/`touchcancel` (`useSwipeTrackSync.ts:205-208`). Binding: extend
`useSwipeTrackSync` with a pointer-drag path (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) that reuses the
**identical** `±clientWidth` clamp, `AXIS_LOCK_PX` axis lock and `SWIPE_THRESHOLD_RATIO` release rule already
implemented for touch — one state machine, not a second copy — plus an `ArrowLeft`/`ArrowRight` `keydown` path, which
requires the track to be focusable and to carry an accessible role and name. `pointer*` events also fire for touch
input, so the same gesture must not be handled twice: either move to pointer events alone with `touch-action: pan-y`
on the track preserving the vertical-scroll behaviour the axis lock guarantees today, or keep the touch listeners and
ignore `pointerType === 'touch'`. State which you chose and why, and prove the vertical-gesture case still never
calls `preventDefault`. The mobile chrome is unchanged: below `sm` there is no thumbnail row and no side arrow.

**D824-2 → option (A).** `GalleryNavActionIcon`, `GalleryDesktopNavigation` and `GalleryThumbnailButton` move out of
`src/modules/listings/components/LightboxView.tsx` into `src/design-system/mantine/patterns/`, one file per
component, each with its own canonical Mantine Story whose `meta.title` satisfies `isCanonicalMantineTitle` and which
imports it by direct file path. `check:pattern-enrolment` (Task 820) enrols every `.tsx` in that directory against
the live directory listing, so each new file also needs its `scripts/mantine-migration-scope.json` entry **in this
task** — a manifest entry only; R7 still binds and no gate script is edited. `LightboxView.tsx` and
`MantineListingGalleryPattern.tsx` then import the three from their new paths. `LightboxView.tsx` itself is **not**
enrolled, so the owner's Task 820 kickoff §17.6 decision of 2026-09-11 stands untouched. Update
`GalleryThumbnailButton.stories.tsx` to the new import path; `ActionIcon.stories.tsx` keeps only the stock
`ActionIcon` variant spectrum and disabled state, and `GalleryDesktopNavigation`'s own new Story takes over its two
overlay-nav sections (a bright photo backdrop and a black scrim, both tones).

**D824-3 → option (A).** `MantineListingGalleryPattern.tsx:127`'s `onClick={() => openAt(index)}` becomes
select-only (`setActiveIndex(index)`); the lightbox opens from the main photo alone. `openAt` (`:40-43`) is then
either unused or reduced to the main-photo path — delete whatever no longer has a consumer rather than leaving it
dead. This is also what makes the active 2px brand border an observable steady state at 1440, which is what AC20
measures.

**D824-4 → register the roles; no raw literals anywhere.** `theme.other` has no `borderWidth` scale and no 16px or
2px role today (reviewer-verified against `src/design-system/mantine/theme.ts`), and the rule-3 convention stated in
that file's own `boxSize.galleryThumb` and `tooltip` comments forbids reusing a numerically equal value that belongs
to another documented owner. Register the following in `src/design-system/mantine/theme.ts`, in **both** the
`MantineThemeOther` augmentation and the `other:` implementation, following that file's existing conventions — rem
strings, role names rather than pixel names, one provenance comment per role citing this owner decision and its date,
and `boxSize` keys inserted in the existing ascending-value order:

| New role | Value | Documented owner |
|---|---|---|
| `borderWidth.galleryThumbActive` | `'0.125rem'` (2px) | `GalleryThumbnailButton`'s active-state brand border. A new one-role `borderWidth` scale, because no border-width contract exists in `theme.other` at all. |
| `boxSize.paginationSegment` | `'1rem'` (16px) | the mobile lightbox pagination indicator's long axis |
| `boxSize.paginationSegmentThickness` | `'0.125rem'` (2px) | the same indicator's thickness — a role distinct from `borderWidth.galleryThumbActive` despite the equal value, per rule 3 |

Consumption route, which is not a free choice: this repo has **no** `cssVariablesResolver` (verified — zero hits in
`src/`), so `theme.other` is reachable only from JavaScript, and every existing `boxSize` consumer is a Mantine style
prop (`LightboxView.tsx:125` `w={theme.other.boxSize.galleryThumb}`). Follow that precedent — the segment's
`width`/`height` and the thumbnail's border width move to style props reading `useMantineTheme()`, and
`LightboxView.module.css`'s `.paginationSegment` keeps only what is already tokenised (`border-radius: 0` and the
`color-mix` background), with **both** `design-tokens-allow` dimension markers at `:28-29` removed together with the
literals that justified them. The pre-existing `#fffc`/`#0009` colour markers in the two module files are a different
category and stay. Introducing a `cssVariablesResolver` is permitted only if you first demonstrate that the
style-prop route cannot express a required rule, and it is then reported as a deviation.

### 16.3 Amended requirement ledger — R9 to R18 (supplement R1–R8; R1–R8 stand as written)

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R9** | D824-1 (A) | Below 640px the photo at index `n > 0` is reachable in **both** the closed gallery and the open lightbox, at 320 and 390, by a **pointer/mouse drag** and by **`ArrowLeft`/`ArrowRight`** on the focused track — the same one clamp/axis-lock/threshold state machine as touch, never a second copy. Mobile chrome stays without thumbnails and without side arrows. | **P0** | AC13 | Confirmed |
| **R10** | GR-1, 16d tier 1, D824-2 (A) | `GalleryNavActionIcon`, `GalleryDesktopNavigation` and `GalleryThumbnailButton` live in `src/design-system/mantine/patterns/`, one file each, each with its own canonical Mantine Story importing it by direct file path and its own `scripts/mantine-migration-scope.json` entry. `LightboxView.tsx` is not enrolled and keeps consuming them by import, so Task 820 kickoff §17.6 stands. | **P0** | AC14, AC15 | Confirmed |
| **R11** | 16c | `src/stories/mantine/primitives/LightboxView.stories.tsx` renders the component's **changed** states: the `isMobile` swipe track, the pagination rail, the square thumbnail strip, and the `tone="dark"` vertically-centred nav. It was last modified before this task and appears in neither session-log §6's nor session-log §10.10's Files Changed table; a Story that cannot render a changed state is not proof for it. | **P0** | AC16 | Confirmed |
| **R12** | R2, D824-4 | No unrecorded raw dimension literal remains in any file this task changed — including a `bd`/`bdrs` string literal, a numeric Mantine style prop (`w`/`h`/`maw`/`mih`/`size`), and story fixtures. Known today: `LightboxView.tsx:127` `bd={`2px solid …`}`; `UnstyledButton.stories.tsx` `bd="1px solid …"` ×2; `ActionIcon.stories.tsx:65,80` `maw={480} h={270}` / `maw={480} h={220}` and `size={16}` ×7. Per D824-4 every one of these is **tokenised**, not marker-suppressed: the three new `theme.other` roles replace the `2px` border and the `16px`/`2px` segment geometry, and the two `design-tokens-allow` dimension markers in `LightboxView.module.css:28-29` are deleted with the literals. | **P0** | AC17 | Confirmed |
| **R13** | Adversarial review | `useSwipeTrackSync` cannot strand the track outside `[0, count + 1]`. `onTouchStart`'s `setTransitionEnabled(false)` (`:158`) cancels an in-flight `transform` transition, which fires `transitioncancel`, not `transitionend`, so the clone rebase (`:106-123`) never runs; the next `settle` (`:128`) then moves `internalIndex` to `-1` or `count + 2`, a slot with no slide, and `onTransitionEnd`'s guard (`:112`) can no longer match, so nothing recovers it. | **P0** | AC18 | Confirmed |
| **R14** | Adversarial review | A tap immediately after a horizontal swipe still opens the lightbox. `suppressNextClick` (`useSwipeTrackSync.ts:149`) is set on axis lock (`:170`) and cleared only when a click actually arrives (`:198-203`), but `onTouchMove` calls `e.preventDefault()` (`:173`), which suppresses the browser's synthetic click — so the flag survives the gesture and swallows the next genuine tap. | **P1** | AC19 | Confirmed |
| **R15** | D824-3 (A) | A desktop thumbnail click **selects only** — it sets `activeIndex` and updates the main photo, and does not open the lightbox; the lightbox opens from the main photo alone. Requirement 6's active border therefore has an observable steady state at 1440. | **P1** | AC20 | Confirmed |
| **R16** | AC12, GR-3 | `Patterns/Mantine/ListingGalleryPattern → Default`'s `play` resolves exactly one element at **every** viewport it is rendered at, 320 included. Today `:73`'s `findByRole('button', { name: title })` competes with `buildWrappedSlides(images).length` = 11 `UnstyledButton`s that all carry `aria-label={title}` (`MantineListingGalleryPattern.tsx:84-94`); `useMatches` returns its `base` value first, and below 640px the mobile branch is the final render. Fix the duplicate accessible name, not the query. | **P1** | AC21 | Confirmed |
| **R17** | Clause 9, AC10, AC11, Task 818 corollary | Every gate in §16.6 is re-run on the **final** tree and its transcript retained, with the `git hash-object` of every changed file captured in the same pass. The last retained transcript today is `117_r17_typecheck.txt`; every session-log §10 source file was written after it, and `115_r16_check-stories.txt` (147 files, 679 keys) and `116_r16_design-tokens-strict.txt` (54 violations, 92 stories) contradict session-log §10.11's claimed 149 / 691 / 50 / 95. `104_final_hash-object.txt` still lists the deleted `src/hooks/useHasFinePointer.ts`, omits the two new Story files and `MantineListingCardTrack.module.css`, and lists `docs/backlog.md` twice with two different hashes. | **P0** | AC22, AC23 | Confirmed |
| **R18** | GR-5 | Task 824's status reads identically in `docs/backlog.md`, the sprint Tasks table, the sprint execution-order note and this kickoff, and the backlog row describes the **shipped** mechanism. Today the backlog row still credits `useHasFinePointer` ("input capability not viewport width"), which session-log §10.2 deleted, and the sprint Tasks table still reads `READY FOR SONNET`. Opus owns this artifact; Sonnet records only its own concise state line. | P2 | AC24 | Confirmed |

### 16.4 Amended and superseded acceptance criteria

- **AC4 is superseded.** Its "same measured thumbnail width at 320, 390, 480, 768, 1024 and 1440" is now
  unsatisfiable by construction: session-log §10.2's breakpoint gate means no thumbnail row renders below 640px. **AC4a**
  replaces it — given the rendered thumbnail row, each thumbnail's measured width equals its measured height within
  1px and is the same number at **768, 1024 and 1440**; and at **320, 390 and 480** the thumbnail row is absent from
  the DOM. Quote all six.
- **AC5 stands unchanged** and is re-measured at all six widths on the final tree.
- **AC12 is superseded by AC12a**, which replaces the session log's §7 ten tuples, its §9a addendum and its absent §10 matrix with one
  list: `Patterns/Mantine/ListingGalleryPattern → Default` at **320, 390, 480, 1440** in `en`, each closed and open
  (8); `Mantine/Primitives/ActionIcon → Default` at **390, 1440** (2); `Mantine/Primitives/UnstyledButton → Default`
  at **1440** (1); `Mantine/Primitives/GalleryThumbnailButton → Default` at **1440** (1); each new or relocated
  Story from D824-2 at **1440** (1 per component); `Mantine/Primitives/LightboxView → Default` at **390** and
  **1440**, closed and open (4). Name every tuple and its owner-recorded `accepted`/`returned` result.
- **AC13 [R9]** — Given a viewport of 320 and of 390, then photo 2 is reached (a) by a dispatched pointer/mouse drag
  and (b) by an `ArrowRight` keypress on the focused track, in the closed gallery and in the open lightbox, and the
  counter reads `2 / 9` in all eight cases. Quote the eight measurements, and quote one vertical-gesture case per
  viewport proving `preventDefault` was not called and the page still scrolled.
- **AC14 [R10]** — Given the final tree, then `node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`
  reports `manifest:yes story:yes` for every tier-1 node it visits. Quote the whole census block, including its own
  scope statement.
- **AC15 [R10]** — Given each component named in R10, then the canonical Story file that imports it by name is
  quoted with its `meta.title`, and its `scripts/mantine-migration-scope.json` line is quoted. One
  `GR-3 STORY PROVEN` line per component.
- **AC16 [R11]** — Given `LightboxView.stories.tsx` after the change, then it renders the mobile swipe track, the
  pagination rail, the square thumbnail strip and the `tone="dark"` nav, and `check:story-coverage` exits 0. Quote
  the added sections.
- **AC17 [R12]** — Given the final diff, then this exact search over **every** changed `.tsx`/`.ts`/`.css` file
  returns **zero** matches, and `LightboxView.module.css` carries no `design-tokens-allow` dimension marker at all.
  Quote the command and its complete output, not a claim of emptiness:
  `rg -n -e '\b(w|h|miw|maw|mih|mah|size|gap|p|m|mt|mb|ml|mr|top|left|right|bottom)=\{-?[0-9]' -e 'bd(rs)?=("|\{`)[^"`]*[0-9]+(px|rem|em)' -e '-\[[0-9]' -e '[a-z-]+:\s*-?[0-9]+(px|rem|em)\b' <changed files>`
- **AC18 [R13]** — Given a forward wrap from the last photo, then a second `touchstart` dispatched 100ms into the
  settle followed by a completed second forward swipe leaves the counter at `2 / 9`, the visible slide equal to
  photo 2, and the track's computed `translateX` inside `[-(count + 1) × width, 0]`. Repeat for the backward wrap.
  Quote the four numbers per direction. A single-swipe wrap test does not close this.
- **AC19 [R14]** — Given a completed horizontal swipe, then a following tap on the photo opens the lightbox on the
  **first** tap. Quote the dispatched sequence and the observed `opened` state.
- **AC20 [R15]** — Given a desktop thumbnail click at 1440, then `activeIndex` and the main photo change, the
  lightbox stays closed, and the clicked thumbnail's computed border width equals
  `theme.other.borderWidth.galleryThumbActive` while every sibling's is the same width in `transparent`. Quote the
  computed values and the `opened` state.
- **AC21 [R16]** — Given `ListingGalleryPattern → Default` at 320, 390, 480 and 1440, then `play` completes at every
  one of them and the resolved main-photo trigger is unique. Quote the accessible-name set actually rendered at 320.
- **AC22 [R17]** — Given the final tree, then §16.6's block is run in one pass and every transcript is retained under
  `docs/sessions/evidence/task824/118+`, each recording platform, Node version, working directory, exact command and
  actual exit code. `npm run build` exits **0**; `check:design-tokens:strict` reports **≤ 56**;
  `check:tailwind-runtime-tokens` gains no new debt row; `check:stories`, `check:story-coverage`,
  `check:rendered-scope`, `check:surface-census:changed` and every `*:verify` self-test exit 0, and their scope
  blocks are quoted. `check:locale-leak:mantine-only` **completes** and its result is quoted — session-log §10.11 left it
  running, and it is the only check that positively proves session-log §10.5's 12 new keys render under `sq`/`uk`/`it`.
- **AC23 [R17]** — Given the same pass, then `git hash-object` of every changed file is captured **inside that
  block**, lists each path exactly once, contains no deleted path, and matches the files the transcripts describe.
- **AC24 [R18]** — Given the final tree, then Task 824's status string is quoted from `docs/backlog.md`, the sprint
  Tasks table and this kickoff and is identical in all three, and the backlog row names `useMatches`/the `sm`
  breakpoint rather than `useHasFinePointer`. Emit `GR-5 STATE SYNCED`.

**GR-4 AC AUDIT — 12 amended/new criteria (AC4a, AC12a, AC13–AC24); each states an observable property; absolutes:
AC17's "only marker-carrying lines" and AC23's "each path exactly once" are this revision's defined outcome, scoped
to the named changed files; AC18's range check and AC4a's 1px are measurement tolerances, not pixel-perfect claims.**

### 16.5 Amended scope

- **Also editable in this revision:** `src/design-system/mantine/theme.ts` (D824-4's three new roles) ·
  the three new `src/design-system/mantine/patterns/*.tsx` files and their Stories, plus
  `scripts/mantine-migration-scope.json` (D824-2 — manifest entries only) ·
  `src/hooks/useSwipeTrackSync.ts` (R13, R14, and R9's pointer/keyboard paths) ·
  `src/stories/mantine/primitives/LightboxView.stories.tsx` (R11) ·
  `src/stories/mantine/primitives/{ActionIcon,UnstyledButton,GalleryThumbnailButton}.stories.tsx` (R12, R15) ·
  the destination files D824-2 selects, plus `scripts/mantine-migration-scope.json` (R10 — a manifest entry only;
  no gate script is touched, R7 still binds) · `docs/sessions/2026-09-12-task824-...md` as a new session-log §11.
- **§5.3's "LightboxView's own internals" carve-out is withdrawn.** That file now hosts three components the
  enrolled surface renders, so 16d tier 1 binds it regardless of the original wording. `LightboxView`'s own
  `manifest:no` status is resolved by D824-2, not by enrolling it.
- **Still out of scope:** `AppImage` (tier 3, manifest and own Story both present — nothing owed) · Tasks 822/823's
  inherited red gates · `appImageConfig.ts`'s `fitContain` lightbox decision, which session-log §10.9 flagged and the owner has
  not overridden · any data or API change · `docs/`/`tasks/` historical `rozetka` citations, which session-log §10.6 correctly
  preserved.

### 16.6 The single re-validation route — run as one pass, from the project root

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task824"
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment
npm.cmd run check:media-enrolment:verify
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
git --no-optional-locks diff --stat -- scripts/check-rendered-scope.mjs scripts/check-surface-census.mjs scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/audit-design-system-patterns.mjs scripts/check-pattern-enrolment.mjs scripts/check-media-enrolment.mjs
git --no-optional-locks status --short
```

Expected: `win32`; typecheck 0 · lint 0 new errors · `check:stories` 0 violations with its own file count and
key-parity numbers quoted · coverage 0 unproven · rendered-scope 0 new / 0 stale · surface-census:changed 0 new ·
every `*:verify` passing every arm · design-tokens **≤ 56** · no new Tailwind-token row · `build` **exit 0** ·
`build-storybook` exit 0 · `check:locale-leak:mantine-only` **completed**, not still running · both hygiene gates
clean · the per-surface census clean for every tier-1 node · an empty diff for the seven gate scripts. Retain each
transcript as `docs\sessions\evidence\task824\118_*`, `119_*`, … in run order, record platform/Node/cwd/command/exit
code inside each file, and finish the pass with a single `git hash-object` block over every changed file (AC23).
Write transcripts BOM-free and read any file back through Node, never PowerShell `Get-Content -Raw` without
`-Encoding utf8` (§10's implementation rules 4 and 6 still bind).

The geometry measurements (AC4a, AC5, AC13, AC18, AC19, AC21) run in the built Storybook against real
`TouchEvent`/`PointerEvent` dispatch, with the raw numbers retained and the conclusions derived from them. A
screenshot is not a measurement, and `screenshots:assert` and every alias stay retired.

### 16.7 Completion contract for this revision

§14's contract, plus: D824-1 to D824-4's selected options quoted with their dates and the sprint-file location they
were recorded in · AC4a's six-width result · AC12a's tuple list · AC13–AC24 each with its quoted evidence · the
`118+` transcript paths · the single `git hash-object` block · the `GR-1 CENSUS COMPLETE`, `GR-2 SCOPE STATED`,
`GR-3 STORY PROVEN` (one per changed visible component) and `GR-5 STATE SYNCED` receipts · assumptions · deviations
· limitations · unresolved issues. session-log §10.12's four carried-forward items stay open and are restated: the
`check:locale-leak:mantine-only` result (now AC22), the `fitContain` lightbox call, the `docs`/`tasks` `rozetka`
scoping call, and the real-device swipe verification, which no synthetic `TouchEvent` pass replaces.

Status on completion: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `PARTIALLY IMPLEMENTED`. D824-1 to D824-4 are
answered (§16.2), so there is no owner block left to return; a genuinely new conflict is a fresh
`BLOCKED — OWNER DECISION REQUIRED` naming it. Sonnet does not self-approve and runs, emits and suggests no mutating
git command.

---

## 17. Revision 2 — Opus implementation review 2, 2026-09-12: `NEEDS REVISION`

Reviewed tree: the working tree as of 2026-09-12, evidenced by session-log §11–§11.12 and
`docs/sessions/evidence/task824/118`–`141`. §16's implementation is substantially correct and all four of
§16.2's owner decisions were honored: the three controls are in `src/design-system/mantine/patterns/` with three
manifest entries and their own canonical Stories (`137` census, `122`, `127`); the six `theme.other` roles are
defined in both the interface and the implementation and consumed through style props, with both
`design-tokens-allow` dimension markers gone (`131` no longer reports a `tailwind-dimension-utility` category); the
desktop thumbnail selects only; `141`'s hash block is 34 unique paths reconciling exactly with `140`, which fixes all
three defects §16's R17 found. What follows are the blocking defects only. §17 is the sole executable route for the
next session; where it contradicts §1–§16, §17 wins.

### 17.1 Re-entry mode

`remediation`. Start at §17.3. Do not re-run §13.1's baseline. Preserve every artifact under
`docs/sessions/evidence/task824/`; number this revision's transcripts from `142` upward and never overwrite
`00`–`141`. Append to the session log as a new session-log §12; do not rewrite §1–§11.12.

### 17.2 No owner decision is open

D824-1 to D824-4 stand as answered on 2026-09-12 and are not reopened. §17 adds no new design choice — every item
below is either a measurement that was skipped, a defect in code already written, or a disclosure gap.

### 17.3 Amended requirement ledger — R19 to R24

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R19** | AC13, AC18-AC21, AC4a, AC5 | Every measurement-based criterion is **measured**, in the Playwright-against-`storybook-static` harness session-log §11.11 already built and ran in this same session. Code-path inspection does not close any of them. Raw numbers retained; conclusions derived from the numbers. | **P0** | AC25 | Confirmed |
| **R20** | Adversarial review | A mouse/pen drag that leaves the track before release still settles. `useSwipeTrackSync.ts:248-261` binds `pointerdown`/`pointermove`/`pointerup`/`pointercancel` on the container only and `onPointerDown` never calls `setPointerCapture`, so once the cursor leaves the container `pointermove` stops firing and `pointerup` is delivered elsewhere: `dragEnd()` never runs, `drag.active` stays `true`, and `dragOffset` stays frozen at up to `±clientWidth` with `transitionEnabled` false — the strip sits visibly offset until a fresh `pointerdown`, whose click `suppressNextClick` then correctly swallows. The container is the photo box, so leaving it during a horizontal drag is ordinary. | **P0** | AC26 | Confirmed |
| **R21** | Clause 10, GR-2 | The session log's Files Changed table matches the real diff, and R7/§8's "no gate script is edited" is narrowed to what it was always meant to forbid. `scripts/check-locale-leak.mjs` is a changed path in this task's working tree — `140_r18_final_status.txt` lists it `M`, `141_r18_final_hash-object.txt` hashes it `9c037f1a…`, `125_r18_surface-census-changed.txt` names it under "Changed paths seen" — and session-log §11.9's table omits it, which makes session-log §11.9b's `GR-2 SCOPE STATED` receipt false. **The change itself is legitimate and is NOT to be reverted** (reviewer-verified 2026-09-12, see §17.8): it is a single `PER_STORY_TOKENS` entry, `'mantine-primitives-unstyledbutton': ['Link']`, exactly mirroring the file's own pre-existing `'primitives-button': ['Link']` and falling squarely in category 1 of that table's documented purpose. What is owed is the disclosure, the per-locale justification, and the narrowing in §17.8 — not a revert and not a re-run. | P2 | AC27 | Confirmed |
| **R22** | Clause 9, Task 818 corollary | The final gate block describes the shipped tree. `src/stories/mantine/primitives/DimensionTokens.stories.tsx` was written after every transcript from `118` through `138`, and it is a file `check:stories` scans, `check:story-coverage` counts, `build-storybook` compiles and `check:file-integrity`/`check:mojibake` enumerate. `122` also predates the final `LightboxView.stories.tsx` by 13 s. Session-log §11.11 says typecheck and `build-storybook` were re-run after that edit, but no transcript for either re-run exists. The drift is visible in the handoff's own figures: it reports 176 file-integrity files and 4730 mojibake files where `135`/`136` read 168 and 4725. | **P0** | AC28 | Confirmed |
| **R23** | AC14 (task-design defect) | The per-surface census is reconciled, not reported as clean and not omitted. `137` exits 1 with `FAIL src/modules/listings/components/LightboxView.tsx [tier1-unenrolled-or-unstoried]` and `GR-1 CENSUS BLOCKED`; `01_baseline_surface-census.txt`, captured before this task began, carries the identical verdict for the identical node. Session-log §11.2 measured, quoted and reconciled it correctly. **AC14 as written in §16.4 was unsatisfiable** — relocating the three controls could never clear a FAIL whose subject is `LightboxView.tsx` itself. That is a review defect, corrected by AC14a below, and `LightboxView.tsx`'s own enrolment is filed as **Task 825**. | P2 | AC14a | Confirmed |
| **R24** | Accuracy | Stale comments and refactor nits: `src/stories/mantine/primitives/LightboxView.stories.tsx:22` still says both sections use a "`play`-free manual open via `onClick`" after session-log §11.8 added a `play` to `Default`; `MantineListingGalleryPattern.module.css`'s cascade rationale still calls the badge "a plain child of an `UnstyledButton`" when it is a sibling of the photo button (`MantineListingGalleryPattern.tsx:124`); `useSwipeTrackSync.ts:240-243`'s `onTouchMove` dereferences `e.touches[0]` before `dragMove`'s own `drag.active` guard, where the pre-refactor version guarded first; `onPointerDown` does not filter `e.button`, so a right- or middle-press starts a drag. | P3 | AC29 | Confirmed |

### 17.4 Amended and superseded acceptance criteria

- **AC14 is superseded by AC14a** — given the final tree, `node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`
  reports `manifest:yes story:yes` for every tier-1 node **except** `src/modules/listings/components/LightboxView.tsx`,
  whose `manifest:no` is reconciled line-for-line against `01_baseline_surface-census.txt` and named as Task 825's.
  Quote both census blocks and the command's real exit code; the gate exits 1 and that is the reconciled expected
  result for this task, not a pass to be reported as green.
- **AC25 [R19]** — Given the Playwright harness serving `storybook-static`, then each of these is measured and its raw
  numbers quoted: **AC13** photo 2 reached at 320 and 390 by a dispatched pointer drag and by `ArrowRight` on the
  focused track, in the closed gallery and in the open lightbox, counter `2 / 9` in all eight cases, plus one
  vertical-gesture case per viewport showing `preventDefault` was not called and the page still scrolled; **AC18**
  forward wrap then a second `touchstart` 100 ms into the settle then a completed second forward swipe — counter
  `2 / 9`, visible slide photo 2, computed `translateX` inside `[-(count + 1) × width, 0]` — and the same for the
  backward wrap; **AC19** a completed horizontal drag followed by a tap opens the lightbox on the **first** tap;
  **AC20** a desktop thumbnail click at 1440 changes `activeIndex` and the main photo, leaves the lightbox closed,
  and the clicked thumbnail's computed border width equals `theme.other.borderWidth.galleryThumbActive` while every
  sibling's is the same width in `transparent`; **AC21** `play` completes at 320, 390, 480 and 1440 with a unique
  resolved main-photo trigger, and the accessible-name set actually rendered at 320 is quoted; **AC4a** each
  thumbnail's measured width equals its height within 1px and is the same number at 768, 1024 and 1440, and the
  thumbnail row is absent from the DOM at 320, 390 and 480; **AC5** `document.documentElement.scrollWidth` does not
  exceed `clientWidth` at all six widths and any overflow is on the row element itself.
- **AC26 [R20]** — Given a dispatched pointer drag that crosses the container's boundary before `pointerup`, then the
  strip settles to a whole-slide offset, `activeIndex` reflects the threshold decision, and no frozen `dragOffset`
  remains. Quote the computed `transform` before and after release. Resolution: `container.setPointerCapture(e.pointerId)`
  in `onPointerDown` — implicit capture retargets every subsequent pointer event to the container through `pointerup`
  — or bind `pointermove`/`pointerup`/`pointercancel` on `window` for the drag's duration. State which you chose.
- **AC27 [R21]** — Given the final tree, then session-log §11.9's Files Changed table carries `scripts/check-locale-leak.mjs` with §17.8's one-line justification, §11.9b's `GR-2 SCOPE STATED` receipt is re-emitted truthfully, and the session log states in one sentence that the entry suppresses at most the `it`-locale `Link` token for one story, so `139`'s 158-leak figure is comparable to the earlier baselines it is compared against. Do **not** revert the entry, do **not** re-run `check:locale-leak:mantine-only` for it, and do not add a second allowlist entry anywhere. Quote the amended table row and the re-emitted receipt.
- **AC28 [R22]** — Given §17.6's block run as one pass with **no tracked file edited afterwards**, then every
  transcript is retained under `142`+ with platform, Node version, working directory, command and real exit code, and
  the pass ends with the `git hash-object` block — same shape as `141`, which is correct and is the model. Quote
  `check:file-integrity`'s and `check:mojibake`'s file counts and reconcile them against the numbers reported in the
  completion report; a figure in prose that no transcript shows is the defect this criterion exists to stop.
- **AC29 [R24]** — Given the final tree, then the four items in R24 are corrected and each is quoted.

**GR-4 AC AUDIT — 7 amended/new criteria (AC14a, AC25–AC29); each states an observable property; absolutes: AC28's
"no tracked file edited afterwards" is a sequencing condition this revision defines, and AC4a's 1px and AC26's
whole-slide offset are measurement tolerances, not pixel-perfect claims.**

### 17.5 Amended scope

- **Editable in this revision:** `src/hooks/useSwipeTrackSync.ts` (R20, R24) ·
  `src/stories/mantine/primitives/LightboxView.stories.tsx` and
  `src/design-system/mantine/patterns/MantineListingGalleryPattern.module.css` (R24, comments only) ·
  `scripts/check-locale-leak.mjs` — **not edited again**, see §17.8 ·
  `docs/sessions/2026-09-12-task824-...md` as a new session-log §12 · `docs/backlog.md`'s own concise state line.
- **Out of scope, unchanged:** `LightboxView.tsx`'s manifest enrolment — that is **Task 825** · `appImageConfig.ts`'s
  `fitContain` lightbox call and the `docs`/`tasks` `rozetka`-scoping call, both still open owner items ·
  `LightboxView.tsx`'s pre-existing `max-h-[85vh]`/`max-w-[90vw]`, which session-log §11.7 correctly proved unchanged
  by any diff in this task and correctly declined to "fix" with a token that does not exist for a viewport-relative
  value · Tasks 822/823's inherited red gates.

### 17.6 The single re-validation route — one pass, project root, nothing edited afterwards

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment
npm.cmd run check:media-enrolment:verify
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
git --no-optional-locks diff --stat -- scripts/check-rendered-scope.mjs scripts/check-surface-census.mjs scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/audit-design-system-patterns.mjs scripts/check-pattern-enrolment.mjs scripts/check-media-enrolment.mjs
git --no-optional-locks status --short
```

Expected, unchanged from §16.6 except where noted: `win32`; typecheck 0 · lint 0 new errors · `check:stories` 0
violations with its file count and key parity quoted · coverage 0 unproven · rendered-scope 0 new / 0 stale ·
surface-census:changed 0 new · every `*:verify` passing every arm · design-tokens **≤ 56** · no new Tailwind-token
row · `build` **exit 0** · `build-storybook` exit 0 · `check:locale-leak:mantine-only` completed with its figure
quoted and AC27's disposition attached · both hygiene gates clean with their counts quoted · the per-surface census
exiting **1** on `LightboxView.tsx` alone, reconciled per AC14a · an empty diff for the seven gate scripts. Retain
each transcript as `142_*`, `143_*`, … and close the pass with one `git hash-object` block over every changed file.
§10's implementation rules 4 and 6 still bind: Node for any read-back, transcripts BOM-free.

AC25's and AC26's measurements run in the Playwright-against-`storybook-static` harness session-log §11.11 already
used — serve the built Storybook, load each story's `iframe.html?viewMode=story`, dispatch real
`TouchEvent`/`PointerEvent`/`KeyboardEvent` sequences, read computed styles and bounding boxes. Retain the raw
numbers in their own transcripts and derive every conclusion from them. A screenshot is not a measurement, and
`screenshots:assert` and every alias stay retired.

### 17.7 Completion contract for this revision

§14's and §16.7's contracts, plus: AC14a's two reconciled census blocks · AC25's seven measurement sets with raw
numbers · AC26's before/after `transform` · AC27's amended Files Changed row and re-emitted receipt · AC28's `142`+
transcripts with reconciled file counts · AC29's four corrections · the closing `git hash-object` block · the
corrected Files Changed table · the `GR-1 CENSUS COMPLETE`, `GR-2 SCOPE STATED`, `GR-3 STORY PROVEN` and
`GR-5 STATE SYNCED` receipts, each true as written. Carried forward and still open: real-device confirmation on a
physical phone (no synthetic dispatch replaces it), the `fit="contain"` call, the `docs`/`tasks` `rozetka`-scoping
call, and AC12a's owner visual-QA matrix.

Status on completion: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `PARTIALLY IMPLEMENTED`. No owner decision is
open, so `BLOCKED — OWNER DECISION REQUIRED` applies only to a genuinely new conflict, named. Sonnet does not
self-approve and runs, emits and suggests no mutating git command. **Report every command's real exit code; a gate
that exits non-zero is reported as exiting non-zero, with its reconciliation, never folded into "all passing".**
### 17.8 `scripts/check-locale-leak.mjs` — reviewer finding retracted, and R7/§8 narrowed

Review 2 first named this change a possible gate weakened to pass, and specifically asked whether allowlisting `Link`
for the whole story masked a real leak in `uk` and `sq` while justifying only Italian. **The owner supplied the diff
and the answer is no — the finding is retracted on evidence.** The reviewer read all four locale files directly:

| key | `en` | `uk` | `sq` | `it` |
|---|---|---|---|---|
| `storybook.mantine.unstyledbutton_link_label` | `Link` | `Посилання` | `Lidhje` | `Link` |

`uk` and `sq` are properly translated, so the comparison-based detector can never raise `Link` for them and the entry
cannot mask anything there; `it` is the one locale where the correct translation is the English loanword, which is
category 1 of `PER_STORY_TOKENS`' own documented purpose ("Genuine loanwords where the sq/it translation is identical
to English — the comparison-based detector cannot distinguish a correctly-translated loanword from a hardcode"). The
cited precedent is real and sits ten lines above it: `'primitives-button': ['Link'], // Button: Italian "Link" is a
loanword (same word in it).` The entry is scoped to one story-ID prefix and one token, adds no global allowance, and
changes no detector logic. `git log` shows the file's last three commits belong to Tasks 788, 626 and a CI fix, so
this is an uncommitted working-tree change belonging to Task 824 — the authorship question §17.3's R21 could not
settle.

**R7 and §8 are narrowed accordingly, and this narrowing is the binding reading from here on.** "No gate script is
modified" forbids changing a gate's *logic, thresholds, scope or exit semantics*, and AC10's seven-script empty-diff
check is its measurement. It does not forbid adding a correctly-justified per-story data allowance to
`PER_STORY_TOKENS`, which is this project's own sanctioned route for a genuine loanword (established by Task 626 when
it moved Studio/Penthouse/Max out of the global allowlist into exactly this table). Requiring the opposite would have
left the executor choosing between two of the review's own rules, which is a task-design defect, not an executor
deviation. Every such entry must still be: one story prefix, the minimum token set, a comment naming the locale whose
correct translation collides with English, and disclosure in the Files Changed table — that last one is the only
thing this task actually missed.
