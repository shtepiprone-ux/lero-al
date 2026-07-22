# Task 657 — Homepage FeaturedListings & LatestListings: residual raw-HTML empty-state + skeleton wrappers → Mantine

## 1. Mode and task type

- **Mode:** Implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** UI — current Mantine path (migrated homepage surface). Low blast radius, homepage-bounded consistency cleanup. Not a new primitive, overlay, table strategy, page shell, or major responsive layout.
- **QA profile:** `Q2 Standard UI` (justified in §13).

## 2. Objective

Replace the last residual **raw-HTML wrapper elements** inside the two homepage listing-grid components (`FeaturedListings`, `LatestListings`) with Mantine primitives, so the homepage render tree is Mantine not only for interactive/styled chrome (already true through Task 654) but also for its empty-state text and loading-skeleton card wrappers. This closes the cosmetic-consistency gap identified in the Homepage Mantine-migration audit. **Rendered output must stay visually equivalent to today** — this is a primitive swap, not a redesign.

## 3. Verified context

All facts below were inspected in the working tree on 2026-07-22.

**Affected files (inspected):**

- `src/modules/listings/components/FeaturedListings.tsx`
- `src/modules/listings/components/LatestListings.tsx`
- `src/stories/FeaturedListings.stories.tsx` (existing story — hand-mirror, see note below)

**Current state — what is already Mantine (preserve, do not touch):**

- `FeaturedListings` header uses Mantine `Title` + `ViewAllLink` (Mantine `Button`); grid loading uses Mantine `Skeleton`.
- `LatestListings` loading uses Mantine `Skeleton`.
- `ListingCard` renders via the canonical `MantineListingCardPattern` (Task 605/656) — **out of scope here**.

**Current state — residual raw-HTML (the target of this task):**

| # | File | Element (verbatim) | Issue |
|---|---|---|---|
| A1 | `FeaturedListings.tsx` | `<p className="text-center text-muted-foreground py-8">{t('no_premium_listings')}</p>` | Empty state is a raw `<p>` + Tailwind, not Mantine `Text`. |
| A2 | `FeaturedListings.tsx` → `CardSkeleton` | outer `<div className="rounded-xl border bg-card overflow-hidden">`, inner `<div className="p-3 space-y-2">` | Skeleton card chrome is raw `<div>`s wrapping Mantine `Skeleton`s. |
| A3 | `LatestListings.tsx` | `<p className="text-center text-muted-foreground py-8">{t('no_listings')}</p>` | Empty state is a raw `<p>` + Tailwind, not Mantine `Text`. |
| A4 | `LatestListings.tsx` → `RowSkeleton` | outer `<div className="flex flex-col rounded-xl border bg-card overflow-hidden">`, inner `<div className="p-3 space-y-2">` | Skeleton card chrome is raw `<div>`s wrapping Mantine `Skeleton`s. |

**Token trace (verify before coding):**

- `text-muted-foreground` = legacy shadcn semantic `--muted-foreground`. Mantine's canonical dimmed text is `c="dimmed"` (`--mantine-color-dimmed`). These are **not guaranteed byte-identical**; the executor must confirm the resolved color and, if they differ, keep the exact current color via the semantic token rather than silently shifting shade. State the resolved values in the session log.
- `py-8` = 2rem vertical padding. Mantine `py="xl"` = `--mantine-spacing-xl` (2rem in this theme — **verify**, else use the matching spacing token).
- `bg-card` = `--card`; `border` = `--border` (1px); `rounded-xl` resolves through the **legacy** radius scale (`globals.css`), NOT Mantine's `xl`. Task 650/652 established that Tailwind `lg`/`xl` radius here ≠ Mantine radius scale. The skeleton wrapper must render the **same** radius/border/background it does today; trace each to its concrete value and reproduce it, using a Mantine style prop bound to the same token where a Mantine scale token does not match.

**Canonical empty/loading pattern that exists:** `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` (exported from `patterns/index.ts`). Its `empty` variant renders ThemeIcon + title + description + `minHeight:200` — i.e. a **heavier** empty state than today's single centered line. See canonical decision record (§ below) for why this task deliberately does **not** adopt it.

**Existing Story reality (important):** `src/stories/FeaturedListings.stories.tsx` is a **hand-mirror** — it does not import the real `FeaturedListings`; it re-creates the header with a raw `<h2>` and renders `StoryListingCard` fixtures. Its own meta states "the fixtures have no loading/empty state." So the loading-skeleton and empty states are **currently unstoried**. There is **no** `LatestListings` story.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Audit / owner | `FeaturedListings` empty state renders via a Mantine text primitive, not a raw `<p>` | P1 | Inspect diff + rendered 4-locale evidence | Confirmed |
| R2 | Audit / owner | `LatestListings` empty state renders via a Mantine text primitive, not a raw `<p>` | P1 | Inspect diff + rendered 4-locale evidence | Confirmed |
| R3 | Audit / owner | `CardSkeleton` (Featured) card chrome uses Mantine primitives, not raw `<div>` wrappers | P1 | Inspect diff + rendered loading-state evidence | Confirmed |
| R4 | Audit / owner | `RowSkeleton` (Latest) card chrome uses Mantine primitives, not raw `<div>` wrappers | P1 | Inspect diff + rendered loading-state evidence | Confirmed |
| R5 | P0 contract cl.5/6, cl.16 | Rendered output (color, spacing, radius, border, layout) stays visually equivalent to the pre-change state at every Q2 viewport/locale | P0 | Q2 side-by-side rendered evidence | Confirmed |
| R6 | P0 contract cl.7 | Empty-state strings still resolve in all four locales (`sq/en/uk/it`); no new keys added (reuse `listing.no_premium_listings`, `listing.no_listings`) | P0 | i18n key parity + rendered locale check | Confirmed |
| R7 | P0 contract cl.16c | The loading + empty states touched here gain canonical Story coverage that renders the **same Mantine primitives** used in production (no divergent stand-in) | P1 | Inspect story + `check:story-coverage` | Confirmed |
| R8 | P0 contract cl.9 | `npm run build` exits 0 | P0 | Build transcript | Confirmed |

Every acceptance criterion in §12 maps to one or more of R1–R8.

## 5. Assumptions and open questions

- **A-1 (AMBIGUOUS → resolved by default, owner may override):** The empty state is migrated **like-for-like** to a single centered dimmed Mantine `Text` (Option A), **not** the heavier canonical `MantineEmptyLoadingErrorState` `empty` variant (Option B, which adds an icon, a title/description split, and `minHeight:200`). Rationale: P0 behavior/visual preservation (cl.5, cl.16) is the safe default and matches the owner's stated intent ("cosmetic consistency, not a redesign"). **Option B is a deliberate visual change and is OUT OF SCOPE for this task.** If the owner instead wants the homepage empty states standardized onto `MantineEmptyLoadingErrorState`, that is a separate follow-up with its own Q2/Q3 visual sign-off.
- **A-2:** `py-8` → Mantine spacing token is assumed to resolve to the same 2rem. If the theme's `xl` ≠ 2rem, keep 2rem via the exact token. Executor confirms in the log.
- **A-3 (Story approach):** Because the existing `FeaturedListings` story is already a project-sanctioned hand-mirror (the real component is hook/data-bound and not directly renderable without mocks), R7's coverage may be satisfied by extending the hand-mirror to render the **actual** skeleton + empty Mantine markup (the skeleton subcomponents and empty `Text` are hook-free and can be rendered directly). Refactoring these stories to real-component stories is **out of scope**. If the orchestrator judges the hand-mirror insufficient under cl.16c for these specific states, raise it before implementing rather than silently expanding scope.

## 6. Pre-read rule bundle (executor reads exactly these)

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md`
- `docs/component-rules.md`
- `docs/ui-rules.md` (routing / legacy-boundary notes only)
- `docs/qa-rules.md`
- `docs/storybook-governance.md` (for R7 story coverage)
- This task file.

Do not read the full doc set. Do not read legacy Tailwind-governance or admin docs.

## 7. Scope

1. `src/modules/listings/components/FeaturedListings.tsx` — migrate A1 (empty `<p>`) and A2 (`CardSkeleton` wrappers) to Mantine primitives.
2. `src/modules/listings/components/LatestListings.tsx` — migrate A3 (empty `<p>`) and A4 (`RowSkeleton` wrappers) to Mantine primitives.
3. `src/stories/FeaturedListings.stories.tsx` (+ a `LatestListings` story if the executor adds one) — add loading + empty state coverage per R7, rendering the same Mantine primitives.

## 8. Out of scope (do not touch)

- **`ListingCard` footer** raw `<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">` and `<span className="whitespace-nowrap">` — these live inside the **shared canonical** `ListingCard`/`MantineListingCardPattern` consumer, used on `/listings`, `/favorites`, cabinet, etc. Migrating them is a separate, non-homepage task with its own canonical-pattern + Story analysis. **Leave untouched.**
- `AppImage` native `<img>` — deliberate Cloudinary CDN primitive (documented in-file); not a Mantine-migration target.
- `page.tsx` section-level Tailwind **layout** utilities (`container-wide`, section padding, `grid`, `gap`) — layout per the project UI rule split (Tailwind spacing / Mantine behavior); not chrome, not in scope.
- Adopting `MantineEmptyLoadingErrorState` (Option B, see A-1).
- Any color/spacing/radius **change** — visual parity is required, not "improvement."
- Any `messages/*` key changes (reuse existing keys).

## 9. Current and required behavior

**Featured — empty (A1):** *Current:* when `!listings.length`, renders the header then a raw centered `<p>` with `t('no_premium_listings')` in muted-foreground color, 2rem vertical padding. *Required:* identical visual output, produced by a Mantine `Text` (`ta="center"`, dimmed color matching current, `py` matching 2rem). Header rendering unchanged.

**Latest — empty (A3):** *Current:* when `!listings.length`, renders a raw centered `<p>` with `t('no_listings')`, same styling. *Required:* identical visual output via Mantine `Text`.

**Featured — loading (A2):** *Current:* 3 `CardSkeleton`s in the §8.3 grid; each is raw `<div>` (rounded-xl border bg-card overflow-hidden) wrapping a Mantine `Skeleton` image (aspect 4/3) + inner raw `<div>` (`p-3 space-y-2`) of Mantine `Skeleton` lines. *Required:* same rendered card (same radius, border, background, padding, spacing between lines, aspect ratio), with the two wrapper `<div>`s replaced by Mantine primitives (e.g. `Card`/`Box` outer, `Stack`/`Box` inner) bound to the same tokens; Mantine `Skeleton` children unchanged.

**Latest — loading (A4):** *Current:* 4 `RowSkeleton`s in the latest grid; raw `<div className="flex flex-col ...">` outer + `p-3 space-y-2` inner wrapping Mantine `Skeleton`s. *Required:* same rendered card with wrappers replaced by Mantine primitives (outer flex-column preserved via Mantine layout prop), children unchanged.

No control, entry point, state (loading/empty/populated), or grid step is added or removed (P0 cl.3/5).

## 10. Implementation requirements

1. Empty states: use Mantine `Text`. Match the current color exactly — trace `--muted-foreground`; if `c="dimmed"` resolves to a different value, bind the color to the existing semantic token instead of accepting a shade shift (R5). Preserve `text-center` (`ta="center"`) and the 2rem vertical padding.
2. Skeleton wrappers: use Mantine layout primitives (`Card`/`Box`/`Stack`). Reproduce radius, 1px border, `bg-card` background, `p-3` padding, `space-y-2` inter-line gap, `overflow:hidden`, and (Latest) the `flex-col` direction — each bound to the same concrete token it uses today (R5). Do not introduce Mantine's own default Card radius/shadow if it differs; `Card` carries component defaults (Task 650 finding) — verify or use `Box`.
3. Keep the Mantine `Skeleton` children (heights/widths/aspect) byte-identical.
4. No new i18n keys; reuse `listing.no_premium_listings` and `listing.no_listings` (R6).
5. Story coverage (R7): add a loading-state and an empty-state story cell (Featured, and Latest if a story is created) rendering the same Mantine primitives; keep them locale-toolbar reactive; keep visible strings locale-backed (no hardcoded copy). Follow the existing hand-mirror pattern (A-3) unless the orchestrator directs otherwise.
6. No changes outside §7 files. No drive-by refactor of the populated-grid branch, header, or `ListingCard`.

## 11. Positive and negative flows

**Positive flow:** Load homepage. While data loads, both grids show Mantine-wrapped skeleton cards visually identical to before. When Featured returns zero premium listings, its section shows the centered dimmed Mantine `Text`; when Latest returns zero, same. When data is present, cards render exactly as today.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| Validation | No | No form/input touched | N/A | — |
| Authorization/RLS | No | Public read-only homepage render | N/A | — |
| Offline/network | No (preserve) | Existing `useFeaturedListings`/`useLatestListings` hooks own fetch/empty resolution; unchanged | Existing behavior preserved | Populated + empty render checks |
| Concurrent writer | No | Read-only render | N/A | — |
| Empty data | Yes | `!listings.length` branch (this task) | Centered dimmed Mantine `Text`, all 4 locales | Rendered evidence R1/R2/R6 |
| Loading data | Yes | `loading` branch (this task) | Mantine-wrapped skeleton cards, visual parity | Rendered evidence R3/R4/R5 |

## 12. Acceptance criteria

- **AC1 [R1,R5,R6]** Given Featured resolves zero premium listings, when the section renders, then the empty message is produced by a Mantine `Text` (no raw `<p>`), centered, same dimmed color and 2rem padding as before, correct string in `sq/en/uk/it`.
- **AC2 [R2,R5,R6]** Given Latest resolves zero listings, when the section renders, then the empty message is produced by a Mantine `Text`, visually identical to before, correct in all four locales.
- **AC3 [R3,R5]** Given Featured is loading, when the grid renders, then each skeleton card's wrapper is a Mantine primitive (no raw `<div>`), and the rendered card matches the prior radius/border/background/padding/line-gap/aspect at 320/390/768/1024/desktop.
- **AC4 [R4,R5]** Given Latest is loading, when the grid renders, then each skeleton row's wrapper is a Mantine primitive with the flex-column layout preserved and visual parity as AC3.
- **AC5 [R5]** Given any Q2 viewport/locale, when compared side-by-side with the pre-change render, then there is no visible color/spacing/radius/border/layout regression in either component's empty, loading, or populated state.
- **AC6 [R7]** Given the Storybook build, when the Featured (and, if added, Latest) stories run, then a loading cell and an empty cell render the same Mantine primitives shipped in production, are locale-toolbar reactive, and `check:story-coverage` passes.
- **AC7 [R8]** Given the full production build, when `npm run build` runs, then it exits 0.

## 13. QA profile and verification plan

**Profile: `Q2 Standard UI`.** Justification: touches existing homepage surfaces with user-visible empty (localized) + loading states; no new primitive/overlay/page-shell/table-strategy is created (empty→`Text`, skeleton→`Box`/`Stack` reuse). Not logic-only (visible chrome changes), so above Q1; not a new/migrated primitive or high-risk responsive shell, so below Q3.

**Verification plan (executor runs and pastes actual transcripts):**

1. `npx tsc --noEmit` (or the project's typecheck script) → 0 errors.
2. i18n key parity check for `listing.no_premium_listings` / `listing.no_listings` present in `sq/en/uk/it` (no keys added).
3. File-integrity/mojibake check on the two touched component files + story (UTF-8, no BOM/NUL).
4. Storybook: build/run the Featured (+ Latest if added) stories; capture the loading and empty cells; `check:story-coverage` green.
5. Rendered Q2 evidence for both components' **empty, loading, and populated** states at `320, 390, 768, 1024, 1440`; `uk@320` mandatory; all four locales at `320` and `1440` (and, because empty-state text changes, all four locales at every required width). Provide side-by-side vs the pre-change render to prove parity (R5).
6. **Hard gate:** `npm run build` → exit 0; paste the transcript. A failed/unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

### Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Featured empty message | `<p>` → Mantine `Text` | `text-center text-muted-foreground py-8` | `text-muted-foreground`→`--muted-foreground`; `py-8`→2rem | Changed (primitive swap, visual preserved) | AC1, Q2 rendered |
| Latest empty message | `<p>` → Mantine `Text` | same | same | Changed (visual preserved) | AC2 |
| Featured skeleton card | `CardSkeleton` `<div>`×2 → Mantine `Box`/`Stack` | `rounded-xl border bg-card overflow-hidden` / `p-3 space-y-2` | `rounded-xl`→legacy radius scale; `border`→`--border`; `bg-card`→`--card`; `p-3`→0.75rem; `space-y-2`→0.5rem | Changed (visual preserved) | AC3 |
| Latest skeleton card | `RowSkeleton` `<div>`×2 → Mantine `Box`/`Stack` | `flex flex-col rounded-xl border bg-card overflow-hidden` / `p-3 space-y-2` | as above + `flex-col` | Changed (visual preserved) | AC4 |
| Mantine `Skeleton` children | `@mantine/core` `Skeleton` | — | — | Preserve (unchanged) | Diff shows children untouched |
| Grid/header/populated cards | existing Mantine + grid | §8.3 grid, `Title`, `ViewAllLink`, `ListingCard` | — | Out of scope / preserve | No diff |

### Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine Story / source | Disposition | Shared style/token path & required registration |
|---|---|---|---|---|
| Empty-state message | Inspected `patterns/index.ts`, `MantineEmptyLoadingErrorState.tsx`; searched patterns dir for empty/loading | `MantineEmptyLoadingErrorState` (heavier variant) exists but is a **visual mismatch** to today's single-line state | **reuse** Mantine `Text` primitive (like-for-like); do **not** adopt the heavier pattern (see A-1) | Bind dimmed color to existing token; no new shared source, no copied local style |
| Skeleton card wrapper | Inspected `patterns/` (no skeleton-card pattern exists); `MantineListingCardPattern` has no skeleton variant | No canonical skeleton-card pattern | **reuse** Mantine layout primitives (`Box`/`Stack`/`Card`) composing existing `Skeleton` | Bind radius/border/bg to the same tokens used today; no new pattern to register (pure primitive composition). If the orchestrator wants a shared `SkeletonCard` primitive, that is a separate `create canonical` task — not authorized here |

## 14. Completion report contract (Sonnet must provide)

- Final status: exactly one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never self-approve.**
- Changed-files table matching the real diff.
- Completed requirement IDs (R1–R8) with per-AC self-audit (AC1–AC7).
- Every command run with **actual** output (typecheck, i18n parity, story-coverage, `npm run build` exit code).
- Evidence locations for the Q2 rendered matrix (empty/loading/populated × viewports × locales) and the resolved token values for `--muted-foreground`→dimmed and `py-8`→spacing (parity proof).
- Assumptions, deviations, limitations, unresolved issues.
- `docs/backlog.md` updated with concise current state (≤80-line limit; flag `BACKLOG LIMIT BREACH` if impossible) + a session log under `docs/sessions/` with a Files Changed table.
- No mutating git. Do not emit, suggest, or run `git add/commit/push`.

## 15. Task quality gate (orchestrator self-check — all yes)

- ✅ A fresh Sonnet session can execute this without hidden chat context.
- ✅ Every requirement (R1–R8) has ≥1 binary AC and ≥1 verification method.
- ✅ Scope names what must not change (populated grid, header, `ListingCard`, layout utilities, i18n keys) and protects existing states.
- ✅ Current/legacy boundary explicit (current Mantine path; `ListingCard`/shared pattern and `AppImage` explicitly excluded).
- ✅ Each changed visual artifact + each preserved sibling traced to inspected markup/classes/tokens; ring-vs-border-vs-gradient not at issue (none present).
- ✅ Each changed artifact has a canonical UI decision record backed by inspected search evidence; both are `reuse` (no copied local styles, no unregistered new primitive).
- ✅ Trace classifications agree with owner intent (visual parity, no redesign); the heavier empty-state pattern is a plausible "improvement" but is correctly excluded as a visual change, not silently adopted.
- ✅ Negative flows selected by applicability, not a generic checklist.
- ✅ No claimed command/file/story/screenshot/behavior that was not inspected.
- ✅ Gates prove changed behavior (visual parity + build), not merely procedural.
- ✅ Assumptions (A-1 empty-state choice, A-2 spacing, A-3 story approach) surfaced for executor + reviewer.

---

**Task path:** `tasks/kickoff_prompt_Task_657_HomepageFeaturedLatest_EmptyAndSkeleton_Mantine.md`
**QA profile:** `Q2 Standard UI`
**Remaining ambiguous/owner decisions:** A-1 — confirm empty states migrate **like-for-like to Mantine `Text`** (default in this task) rather than being standardized onto `MantineEmptyLoadingErrorState` (a separate visual task if desired). A-3 — confirm the hand-mirror story approach is acceptable for cl.16c coverage of these states, or direct a real-component story refactor (out of scope if so).
