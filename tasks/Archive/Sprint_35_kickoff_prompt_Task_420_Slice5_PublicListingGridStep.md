# Task 420 — Slice 5: Public/Listing grid §8.3 step + container audit (bounded sweep)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff + owner-native gate).
> **Sprint:** 35 (Epic JJ tokens + global responsive rework). **Slice:** 5 of the
> `responsive-storybook-inventory.md` plan. **Owner scope decision (2026-06-12):** *Broader but
> bounded* §8.3 grid-sweep — fix every public/listing/system surface that actually uses the
> canonical listing-card grid pattern AND has a clear §8.3 divergence. **NO scope creep.**

---

## 0. Hard contract (P0 — verified against the diff on return)

This task carries the full `docs/agent-contract.md` clauses 1–14. The non-negotiables for THIS task:

1. **Do not change scope.** Only the files in the §6 "Files in scope" list. No card redesign, no
   data/handler/query/i18n changes, no spacing changes outside the grid/container contract, no admin
   surfaces, no "whole-frontend audit". (Owner directive 2026-06-12.)
2. **Do not invent architecture.** If a surface is ambiguous (e.g. RecentlyViewed carousel,
   PopularLocations tiles, a container that looks non-canonical) → **STOP & ASK**, do not guess.
3. **Do not remove existing functionality / controls / states.** Pure layout-class normalization only.
4. **Mobile <640 full-width gate (clause 11)** still applies to every touched surface — see §4.
5. **Rendered evidence at every breakpoint × every locale (clauses 12/13)** is mandatory; `tsc=0`/
   `build` is NOT proof. See §5.
6. **File-integrity gate (clause 14):** read-back every written file; 0 NUL/BOM; `node --check` mjs,
   `tsc --noEmit` ts/tsx; paste the green integrity transcript.
7. **`docs/backlog.md` + a `docs/sessions/` log with a "Files Changed" table.** Do **NOT** run any
   git (`add`/`commit`/…). The orchestrator emits commit commands at review.
8. **🛑 STOP & SPLIT trigger (owner directive):** if the sweep (§3 inventory step) turns up *more*
   divergent card-grid surfaces than the ones named in §3 and the diff stops being SMALL/MEDIUM, **STOP
   after producing the inventory table and ask the orchestrator to split** — do not balloon this task.

## 1. Pre-read (rule-index: Responsive/global-inventory + UI/layout + Storybook)

- **Always:** `docs/agent-contract.md`, `docs/backlog.md`.
- **Required:** `docs/design-system.md` — full, especially **§4** (container system), **§8** (public
  layout rules — §8.3 grid step + §8.4 1408px cap), **§13** (grid cols), **§24–§27** (responsive +
  Storybook-proof contracts); `docs/storybook-governance.md` (§14 enforced gates + §MQ manual-QA);
  `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits);
  `docs/responsive-screenshot-matrix.md`; `docs/responsive-storybook-inventory.md` (Slice 5 row);
  `docs/storybook-visual-snapshots.md`.
- **Required (UI):** `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

Nothing outside this list. The relevant rules still exist; they are just not in scope.

## 2. Canonical rule being enforced (§8.3)

The single canonical public listing-card grid is:

```
grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
```

Expected **column-track count** by viewport (this is the machine assertion in §5):

| 320 | 375 | 390 | 640 | 768 | 1024 | 1280 | 1440 | 1536 | 1920 | 2560 |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | 1 | 1 | 2 | 2 | 2 | 3 | 3 | 4 | 4 | 4 |

(`sm`=640→2, `xl`=1280→3, `2xl`=1536→4.) A grid that reaches 3 or 4 columns *earlier* than this
(e.g. `lg:grid-cols-3` → 3 cols at 1024, or `lg:grid-cols-4` → 4 cols at 1024) is the §8.3 divergence
to fix. **§4/§8.4 container cap:** public content wrappers use `.container-wide` (max 88rem/1408px) and
must NOT override with a wider `max-w-*`.

## 3. Audit table — exact current state, expected, action

**First step (inventory):** re-run the grep for `grid-cols` across `src/modules`, `src/components/layout`,
`src/app`/`app` (exclude `*.stories.*`, `*loading*` skeletons may be verified but are out of the fix set
unless their visible grid diverges) and reconcile against this table. If you find a divergent **listing-card**
grid not listed here, **STOP & SPLIT** (clause 0.8).

| Surface (file:line) | Current grid classes | Expected §8.3 | Action |
|---|---|---|---|
| `FeaturedListings.tsx:61` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | **FIX** `lg:`→`xl:` |
| `FeaturedListings.tsx:80` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` | same as above | **FIX** `lg:`→`xl:` |
| `SimilarListings.tsx:89` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | **FIX** add `xl:grid-cols-3`, move 4-col step `lg`→`2xl` |
| `CollectionsSection.tsx:137` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | (already canonical) | **VERIFY-ONLY**, 0 edits |
| `FavoritesShell.tsx:202` | canonical | (canonical) | **VERIFY-ONLY**, 0 edits |
| `ListingsShell.tsx:227` | canonical | (canonical) | **VERIFY-ONLY**, 0 edits |
| `RecentlyViewedGrid.tsx:59` / `RecentlyViewedSection.tsx:67` | mobile carousel → `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | N/A — deliberate carousel pattern, **not** the standard card grid | **STOP & ASK** before any change (carousel is intentional UX; do NOT force §8.3 onto it) |
| `PopularLocations.tsx:49` | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` | N/A — location tiles, not listing cards | **OUT OF SCOPE** |
| `PageShell.tsx:27` (container) | `container-wide py-8 sm:py-12 lg:py-16 2xl:py-20` | §4 cap 1408px + 2xl padding present | **VERIFY-ONLY** (container audit) |

The session log MUST reproduce this table with a final column **"Rendered evidence"** filled per row
(the §5 QA cell result or "verify-only — render unchanged").

## 4. Mobile <640 full-width gate (clause 11) — applies to every touched grid

At `<640` every card grid in scope renders **`grid-cols-1`** = a single column filling the full
`.container-wide` content width; cards span the full column; **no horizontal scroll at 320**; long
`sq/en/uk/it` labels inside cards wrap (no clip/overflow). **uk@320/375/390 are mandatory cells.**

- **Exemption (documented):** `RecentlyViewedGrid`/`RecentlyViewedSection` use an intentional
  horizontal-scroll carousel at `<640` (`flex … overflow-x-auto`). This is the one allowed non-single-column
  mobile pattern in scope and is **not** to be "fixed" — list it explicitly as the exemption. If the owner
  wants it changed, that is a separate task (STOP & ASK).

## 5. Rendered evidence (mandatory — clauses 12/13 + Sprint-33 gate)

`FeaturedListings` and `SimilarListings` currently have **no stories**, so they are NOT in the global
`screenshots:assert` matrix and cannot be machine-proven as-is. Therefore:

1. **Add minimal canonical stories** `FeaturedListings.stories.tsx` + `SimilarListings.stories.tsx`
   under `src/stories/` (or beside the component per the existing convention), following
   `storybook-governance.md` §13/§14 **exactly**: global `withCanvas` decorator + `layout:'fullscreen'`
   (NO `layout:'centered'|'padded'`), all strings via `storyT`/`t()` with `sq/en/uk/it` parity, **no raw
   string literals**, **no** `/Ukrainian/` export and **no** `globals:{locale}` pin — one toolbar-reactive
   `LocaleStress`. Reuse the existing `StoryListingCard` / `makeStoryListings` fixtures. A `Default`
   (multi-card) story per component is enough to exercise the grid at every breakpoint.
2. **Do NOT modify `scripts/check-stories-rendered.mjs` or its `ASSERT_STORIES` registry/logic** — that
   is **Slice 6** and is owner-gated. Prove the fix with a **standalone focused QA script**
   `scripts/task420-qa-grid-step.mjs` (model it on `scripts/task419-qa-shell-fullwidth.mjs`): it serves
   the built `storybook-static/`, opens each in-scope story by `iframe.html?id=…&globals=locale:…`,
   and for each (story × `sq/en/uk/it` × {320,375,390,640,768,1024,1280,1440,1536,1920,2560}) asserts:
   - **column-track count** = the §2 expected count (parse `getComputedStyle(grid).gridTemplateColumns`
     → number of non-`0px` tracks);
   - **no horizontal scroll** (`scrollWidth ≤ clientWidth + 2`);
   - **container cap**: the `.container-wide` ancestor's content box ≤ 1408px at 1920/2560.
   Capture PNGs for the **uk@320/375/390** mandatory cells + one wide cell (2560) per fixed surface.
   Target: **all cells PASS**.
3. **Regression check:** run the global `npm run screenshots:assert` and confirm it stays
   **2520/2520, 0 FAIL** (flaky-recovered 0–1 tolerated, per Task 418/419 precedent) — the two new
   stories will add cells to the matrix only if you register them; since you are NOT touching the
   registry, the global count is unchanged and must not regress.

> If you believe the grid fix genuinely cannot be proven without registering the new stories in
> `ASSERT_STORIES`, **STOP & ASK** the orchestrator — do not edit the harness on your own initiative.

## 6. Files in scope (allowed-edit list)

**Product (FIX):** `src/modules/listings/components/FeaturedListings.tsx`,
`src/modules/listings/components/SimilarListings.tsx`.
**Product (VERIFY-ONLY, 0 edits expected):** `CollectionsSection.tsx`, `FavoritesShell.tsx`,
`ListingsShell.tsx`, `RecentlyViewedGrid.tsx`, `RecentlyViewedSection.tsx`, `PageShell.tsx`.
**New stories:** `FeaturedListings.stories.tsx`, `SimilarListings.stories.tsx`.
**New QA script:** `scripts/task420-qa-grid-step.mjs`.
**Docs:** `docs/responsive-storybook-inventory.md` (Slice 5 → ✅ DONE + Result paragraph),
`docs/backlog.md` (Last Session), `docs/sessions/2026-06-12-task420-slice5-public-grid-step.md` (new).
**Forbidden:** any `scripts/check-stories-rendered.mjs` edit, any admin file, any
data/handler/query/i18n-runtime file, any card component internals, any spacing token.

## 7. Positive flow (happy path)

- **Actor/context:** a visitor on the public site at wide-desktop and at mobile.
- **Pre:** the home/detail pages render `FeaturedListings` and `SimilarListings` with ≥4 listings.
- **Steps & system response:**
  1. At **2560/1920** (≥1536) the fixed grids show **4 columns** (was 4 already via `2xl` — unchanged) and content does not stretch past 1408px (`.container-wide` cap).
  2. At **1280/1440** (`xl`) the grids show **3 columns** (FeaturedListings: now 3, previously also 3 — unchanged at `xl`; SimilarListings: **now 3**, previously 4 — the fix).
  3. At **1024** (`lg`) the grids show **2 columns** (FeaturedListings: **now 2**, previously 3 — the fix; SimilarListings: **now 2**, previously 4 — the fix).
  4. At **640–1023** (`sm`) → 2 columns. At **<640** → **1 column**, full-width cards, no h-scroll.
- **Success state:** the §2 column-count row matches at every breakpoint in all 4 locales; canonical
  surfaces unchanged; container caps hold.
- **Post:** focused QA `task420-qa-grid-step.mjs` = all cells PASS; global `screenshots:assert`
  = 2520/2520, 0 FAIL; `tsc`/`lint`/`check:stories`/`check:i18n`/`check:story-coverage`/
  `check:design-tokens` all green.

## 8. Negative flow (every off-happy-path branch)

- **Empty grid (0 listings):** the section renders its existing empty/placeholder state (unchanged);
  no broken grid, no console error, no h-scroll. (Do not alter empty-state logic — verify only.)
- **Single listing (1 card):** at wide-desktop the lone card occupies 1 track (does NOT stretch to
  full row); at `<640` it is full-width. No layout break.
- **Long-locale labels (uk/sq):** card titles/prices wrap within the column at 320; no clip/overflow,
  no h-scroll — verified in the uk@320/375/390 mandatory cells.
- **RecentlyViewed carousel @ <640:** intentional horizontal scroll is preserved (the documented
  exemption); do NOT report it as an overflow FAIL.
- **Loading skeleton:** if a `loading.tsx`/skeleton mirrors a fixed grid's columns, confirm it still
  matches visually; if it diverges, **STOP & ASK** (do not silently restyle skeletons — out of fix set).
- **Build/gate failure:** if `check:stories` flags the new stories (hardcode/centered/Ukrainian),
  fix the story to comply — never weaken the gate.

## 9. Acceptance criteria (each maps to a flow + verifiable artifact)

- **AC1** `FeaturedListings.tsx:61,80` → `lg:grid-cols-3` replaced by `xl:grid-cols-3` (Positive step 2–3; diff file:line). 
- **AC2** `SimilarListings.tsx:89` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` (Positive step 2–3; diff file:line). 
- **AC3** Canonical surfaces (`CollectionsSection`/`FavoritesShell`/`ListingsShell`) **0 edits** (verify-only; diff shows no change). 
- **AC4** `RecentlyViewed*` + `PopularLocations` untouched; RecentlyViewed mobile carousel documented as exemption (Negative flow). 
- **AC5** Container cap (§4/§8.4): no public surface in scope overrides `.container-wide` with a wider `max-w-*`; PageShell 2xl padding present (verify-only). 
- **AC6** Two new stories exist, are §13/§14-compliant (green `check:stories`), and render the grids. 
- **AC7** `scripts/task420-qa-grid-step.mjs` = all cells PASS; the §3 audit table's "Rendered evidence" column is filled from its manifest; uk@320/375/390 + 2560 PNGs attached. 
- **AC8** Global `screenshots:assert` = 2520/2520, 0 FAIL (regression check). 
- **AC9** Mobile <640 gate (Negative flow long-locale): 1 column, full-width, no h-scroll at 320 in all 4 locales. 
- **AC10** Self-validation block + file-integrity transcript + "Files Changed" table present in the session log. 

## 10. Self-validation (clause 9 + 14 — before writing "complete")

`npx tsc --noEmit` = 0 · `npm run lint` = 0 new · `npm run check:stories` / `check:i18n` /
`check:story-coverage` / `check:design-tokens` = green · `node scripts/task420-qa-grid-step.mjs` = all PASS ·
`npm run screenshots:assert` = 2520/2520, 0 FAIL · integrity (0 NUL/BOM, `node --check`, `tsc`) green on
every touched file · AC-by-AC table all ✅ with file:line/QA-cell · final line:
`Self-validation: tsc=0 · gates green · grid-step QA all PASS · assert 2520/2520 · scope=clean`.

## 11. Hand-off

Update `docs/backlog.md` Last Session + flip the inventory Slice 5 row to ✅ DONE with a Result
paragraph (audit verdicts + QA result + assert result, mirroring the Task 419 Result format). Add the
session log. Do NOT emit git commands — the orchestrator reviews the real diff (column-step in the
diff AND the column-count in the QA manifest, per the Sprint-33 "class + pixel" gate) and emits the
explicit-path commit. Owner runs the native `screenshots:assert` clause-14 gate before close.
