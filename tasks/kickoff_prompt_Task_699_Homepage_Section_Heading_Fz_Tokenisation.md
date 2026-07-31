# Task 699 — Single-source the homepage section-heading font-size triad

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** homepage Mantine-migration slice — **design-token single-sourcing** (`docs/rule-index.md` →
  "Storybook / Visual Proof" + design-system rules).
- **Secondary type:** none. No component is created, migrated, restyled or re-shaped.
- **Origin:** backlog reservation **689**, census corrected 2026-07-30; owner selected this slice 2026-07-31 as the
  next homepage migration step. Renumbered **699** because 689's reservation text predates the corrected census and
  `NEXT FREE` is 699.

> **Read this first.** The identical literal triad `fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}` is
> hand-copied into **five** places across four files. It is the single largest duplicated style value left on the
> homepage and 15 of the 43 `check:design-tokens` findings. This task moves it to one exported constant and changes
> **nothing** a user can see. The whole risk of the task is that something *does* change.

---

## 2. Objective

1. Create one canonical constant for the homepage section-heading responsive font-size triad and import it at all
   five sites.
2. Reduce `check:design-tokens` from **43 → 28** findings, with 0 stale markers and 0 missing-reason errors.
3. Prove, not assert, that the rendered result is unchanged: byte-identical PNGs on the story-covered sites and a
   before/after `getComputedStyle` capture on the live route for the two sites Storybook does not cover.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-31,
after `9f1f35e15`. Nothing is inferred from a filename or a prior report.

### 3.1 The five sites — read in source, byte-identical

| # | File | Line | Element | Exact current text |
|---|---|---|---|---|
| 1 | `src/app/[locale]/page.tsx` | `:49` | `<Title order={2} fw={700} …>{tl('latest')}` | `fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}` |
| 2 | `src/app/[locale]/page.tsx` | `:77` | `<Title order={2} fw={700} … mb="sm">{t('agent_cta_title')}` | same |
| 3 | `src/components/shared/HowItWorksSteps.tsx` | `:27` | `<Title order={2} ta="center" fw={700} … mb={40}>` | same |
| 4 | `src/modules/listings/components/FeaturedListingsView.tsx` | `:46` | `<Title order={2} fw={700} …>{t('featured')}` | same |
| 5 | `src/modules/locations/components/PopularLocationsView.tsx` | `:46` | `<Title order={2} fw={700} … mb="xl">` | same |

All five are the **same three literals in the same order**. The surrounding props differ (`ta`, `mb`, children) and
are **not** part of this task.

### 3.2 The gate census — re-run live, not quoted

`node scripts/check-design-tokens.mjs` on the clean tree reports **43 violations / 0 stale / 0 missing-reason**, of
which exactly **15** are these five lines:

```
── SHARED  (3 findings) ──
  src/components/shared/HowItWorksSteps.tsx  (3)     :27 ×3
── LISTING (14 findings) ──
  src/modules/listings/components/FeaturedListingsView.tsx  (3)   :46 ×3
── APP     (14 findings) ──
  src/app/[locale]/page.tsx  (14)                    :49 ×3, :77 ×3   (+8 unrelated, see §3.6)
── MODULES (7 findings) ──
  src/modules/locations/components/PopularLocationsView.tsx  (3)   :46 ×3
```

43 − 15 = **28** is the required post-change count. It is an exact number, not "fewer".

### 3.3 The landing zone — machine-proved, not assumed

`scripts/design-tokens-allowlist.json` already allowlists the path prefix **`src/design-system/mantine`** with the
recorded reason *"all raw values in this directory are inputs to the Mantine token system, not bypasses of project
CSS custom properties."* `isAllowlisted()` (`scripts/check-design-tokens.mjs:287-295`) matches by prefix.

Proved by executing the real `scanContent` export against the exact constant text this task will write:

| Hypothetical path | Violations reported |
|---|---|
| `src/design-system/mantine/typography.ts` | **0** |
| `src/components/shared/typography.ts` | **3** |

So the constant must live in `src/design-system/mantine/`. Anywhere else **relocates** the 15 findings instead of
removing them and the task fails its own AC.

### 3.4 Breakpoints — the project's, not Mantine's defaults

`src/design-system/mantine/theme.ts` `breakpoints`: `xs 20em/320` · **`sm 40em/640`** · `md 48em/768` ·
`lg 64em/1024` · `xl 80em/1280` · **`xxl 90em/1440`** (rebound by Task 669).

Therefore the triad renders as three tiers, and these are the numbers every capture must show:

| Width band | Key | Value | Computed `font-size` |
|---|---|---|---|
| `< 640px` | `base` | `1.25rem` | **20px** |
| `640 – 1439px` | `sm` | `1.5rem` | **24px** |
| `≥ 1440px` | `xxl` | `1.875rem` | **30px** |

### 3.5 Storybook coverage — counted in the current manifest

Baseline `.screenshots/rendered-assert/2026-07-31T10-33/` (1184 cells, 1162 pass / 0 fail / 22 ambiguous; the
cross-day run from the Task 698 review, taken on the tree this task starts from).

| Site | Story | Cells | Verdicts today |
|---|---|---:|---|
| #3 `HowItWorksSteps` | `Mantine/Primitives/HowItWorksSteps/Default` | 16 | 16 pass |
| #4 `FeaturedListingsView` | `Patterns/Mantine/HomepageListingGrids/Default` | 16 | 16 pass |
| #5 `PopularLocationsView` | `Mantine/Primitives/PopularLocationsView/Default` | 28 | 28 pass |
| #5 `PopularLocationsView` | `Mantine/Primitives/PopularLocationsView/Long City Name` | 28 | 16 ambiguous / 12 pass |
| #1, #2 `page.tsx` | **none — no story renders `page.tsx`** | 0 | — |

`HomepageListingGrids.stories.tsx:14-15` statically imports the real `FeaturedListingsView` and `LatestListingsView`,
so site #4 is genuinely rendered there (the Task 698 DOM read of that story shows the `Featured` heading).
`Patterns/Mantine/HomeSection/Default` (28 cells) renders the band wrapper only and carries **no** heading — it is
not a target.

The matrix viewports are `mobile-320/375/390`, `band-700`, `band-768`, `desktop-1024`, `wide-1200/1440/1536`, so all
three §3.4 tiers are already covered for the three story-backed sites. **Sites #1 and #2 are covered by nothing** —
that is why R6 exists.

### 3.6 What stays behind in `page.tsx` — and must not be touched

After this task `page.tsx` keeps **8** findings, all out of scope:

`:27` `'4rem'`/`'6rem'` (hero section padding) · `:28` `zIndex: 10` · `:30` the **hero** triad
`'1.875rem'`/`'2.25rem'`/`'3rem'` · `:33` the hero **subtitle** pair `'1.25rem'`/`'1.375rem'`.

**This is the task's main trap.** `:30` shares the literal `1.875rem` with the target triad and `:33` shares
`1.25rem`. A find-and-replace on either literal corrupts the homepage hero. Edit by **line and prop**, never by
value.

### 3.7 Provenance of the values — deliberately not re-derived

`docs/tailadmin-style-reference.md` has a named row for 20px (`theme-xl | 20 | 30 | sub-heading`) and for 30px
(`--text-title-sm: 30px / 38px`, `:1133`). Grep found **no** named TailAdmin row for the middle step, 24px /
`1.5rem`. This task therefore **preserves the three values exactly as they are today** and does not re-derive them
from TailAdmin; whether the middle step should exist at all is a separate conformance question (§8).

### 3.8 Start state

`git status --porcelain` on 2026-07-31 after `9f1f35e15` (`docs(Task697/698): archive the pair…`) is **empty**. This
task starts from a **clean worktree**; no dirty-worktree manifest applies. A stale zero-byte `.git/index.lock` may be
present — do not touch it, it is owner-only.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.3 | A new module `src/design-system/mantine/typography.ts` exports exactly one value, `SECTION_HEADING_FZ`, whose shape is `{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }`. The file has **no** `'use client'` directive and **no** imports — it is a pure constants module. | P0 | AC1 | Confirmed |
| R2 | §3.1 | All five sites pass `fz={SECTION_HEADING_FZ}` and import it **directly** from `@/design-system/mantine/typography` — never via a barrel, never via `patterns/index.ts`. | P0 | AC1, AC6 | Confirmed |
| R3 | §3.2 | `npm run check:design-tokens` reports **28** violations, **0** stale markers, **0** missing-reason errors. Exit code stays **1** (pre-existing report-mode behaviour, unchanged). | P0 | AC2 | Confirmed |
| R4 | §3.6 | `page.tsx:27`, `:28`, `:30`, `:33` are **byte-identical** after the change, and no `design-tokens-allow:` marker is added anywhere. | P0 | AC2, AC6 | Confirmed |
| R5 | §3.5 | Rendered proof vs `2026-07-31T10-33`: **0 FAIL, 0 verdict changes** on all 1184 cells; the 32 target cells outside the measured noise set (`HowItWorksSteps/Default` 16 + `HomepageListingGrids/Default` 16) are **byte-identical**; `PopularLocationsView`'s 56 cells change by at most the measured noise floor (3 cells) and every changed one is proven sub-perceptual or attributed. | P0 | AC3 | Confirmed |
| R6 | §3.5 | For sites #1 and #2, which no story covers: a live-route `getComputedStyle` capture, before and after, at the §3.4 boundary widths × 4 locales, shows `font-size` **identical** and equal to 20/20/24/24/30/30px. | P0 | AC4 | Confirmed |
| R7 | cl. 9, 14 | `npm run typecheck` 0; `check:stories` 0 / 127 files / `checksRan: 16`; `check:story-coverage` 15/15; `check:i18n` 2215×4 with zero new keys; `check:file-integrity` and `check:mojibake` clean **after** the records exist; `npx vitest run` shows no new failure attributable to this diff; `npm run build` exits 0. | P0 | AC5 | Confirmed |
| R8 | §14 | Session log + `docs/backlog.md` concise state, backlog staying at **80 lines**. | P1 | AC7 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the rendered output must not change at all.** This is a pure indirection: the same three strings reach the
  same prop. Any changed pixel outside `PopularLocationsView`'s ≤3 measured noise cells is a **stop and report**, not
  a thing to explain away.
- **A2 — no barrel, no client boundary.** `page.tsx` is a **server** component. Importing the constant from a barrel
  that re-exports client components would pull them into the server graph. Direct file import only; if the import
  appears to require `'use client'` anywhere, **stop and report**.
- **A3 — no value is re-derived.** The three literals move; they do not change (§3.7).
- **A4 — do not widen the sweep.** Only the five §3.1 sites. The hero triad (`:30`) and hero subtitle (`:33`) are
  different values with different owners and stay literal (§3.6).
- **A5 — no `as const`, no type annotation, no extra export.** Plain object literal; `npm run typecheck` is the proof
  it satisfies Mantine's responsive `StyleProp`. If typecheck rejects the plain form, **stop and report** rather than
  inventing a cast.
- **A6 — the Storybook clock is frozen (Task 698).** Byte-identity is therefore a legitimate comparator for the
  target cells, which it was not before 698.

**Open questions — none.** The landing zone is machine-proved (§3.3), the values are fixed (§3.7), the census is
exact (§3.2).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 3, 7, 9, 11, 12, 14, 16/16a.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row, the viewport policy, and the negative-flow applicability section.
4. `docs/design-system.md` — the token-source section (why a literal in a component is a bypass).
5. `docs/mantine-responsive-design-system.md` — responsive style-prop object form and the breakpoint table.
6. `docs/tailadmin-style-reference.md` — `:28` (`theme-xl`) and `:1133` (`--text-title-sm`) only, for §3.7's
   provenance note. Do not restyle from it.
7. `docs/qa-rules.md` — validation and encoding rules.
8. `docs/backlog.md` — the numbering line; **exactly 80 lines**, must not grow.

**Source pre-read**

9. `src/app/[locale]/page.tsx` `:24-90` (the whole component — both target lines and both traps).
10. `src/components/shared/HowItWorksSteps.tsx` `:25-32`;
    `src/modules/listings/components/FeaturedListingsView.tsx` `:43-52`;
    `src/modules/locations/components/PopularLocationsView.tsx` `:43-52`.
11. `src/design-system/mantine/theme.ts` — the `breakpoints` and `fontSizes` blocks.
12. `scripts/design-tokens-allowlist.json` — the `src/design-system/mantine` entry and its reason.
13. `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` `:1-25` — proof that site #4 is rendered there.
14. `docs/sessions/2026-07-23-task662-mantine-home-section-tokenized-band.md` §5 — the proven live-route capture
    method this task reuses (R6).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/typography.ts` | **create** | R1 — the canonical constant |
| `src/app/[locale]/page.tsx` | modify | R2 — sites #1, #2 (lines `:49`, `:77` only) |
| `src/components/shared/HowItWorksSteps.tsx` | modify | R2 — site #3 |
| `src/modules/listings/components/FeaturedListingsView.tsx` | modify | R2 — site #4 |
| `src/modules/locations/components/PopularLocationsView.tsx` | modify | R2 — site #5 |
| `docs/backlog.md` | modify | R8. **Stay at 80 lines.** |
| `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md` | **create** | R8, session log |

Evidence under `.screenshots/task699-delta/`; `.screenshots/rendered-assert/2026-07-31T10-33/` is a **read-only
baseline**.

## 8. Out of scope

- **The hero triad (`page.tsx:30`) and hero subtitle pair (`:33`)** — different values, different owner (§3.6).
- **`page.tsx:27` padding and `:28` zIndex** — separate token families.
- **Re-deriving the values from TailAdmin**, including the question of whether the unnamed 24px middle step should
  exist (§3.7). Record it as a NOTE for a future conformance slice; do not act on it.
- **The other 28 findings**, incl. `FavoriteButton.module.css` (9), `HeaderView.tsx` `min-[390px]` (5),
  `NotificationCenter.tsx` (4), `SaveToCollectionButton.module.css` (2).
- **Any `design-tokens-allow:` marker** — this task removes findings by relocating the source of truth, not by
  suppressing them.
- **`fw={700}`, `ta`, `mb` and every other prop at the five sites.**
- **The `check:design-tokens` strict gate** (reserved Task 407) — report mode and its exit 1 stay as they are.
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** The same three-literal responsive font-size object is hand-copied at five sites in four files. There is
no shared source, so the five can silently diverge, and the copies account for 15 of the 43 `check:design-tokens`
findings. Two of the five sites (`page.tsx`) are rendered by no story at all, so a divergence there is invisible to
CI.

**Required after.** One exported constant in the allowlist-covered design-system directory is imported directly by
all five sites. `check:design-tokens` reports 28. The rendered result is unchanged — proven byte-for-byte on the
story-covered sites and by a before/after computed-style capture on the live route for the two that are not. The
hero triad and hero subtitle, which share literals with the target, are untouched.

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim. It is expected to be
**empty** (§3.8). Anything else → **stop and report**. Do not clear `.git/index.lock`.

**I1 — baselines on the untouched tree.** Record actual output for `npm run check:design-tokens` (expect 43 / 0
stale / 0 missing-reason, exit 1), `npm run check:stories` (0, 127 files, `checksRan: 16`), `npm run typecheck` (0),
`npm run check:story-coverage` (15/15), `npm run check:i18n` (2215×4).

**I2 — the live "before" capture (R6), while the tree is still clean.** Reuse the Task 662 §5 method, simplified:
because this task starts clean, the "before" is just the current tree — **no temporary route is needed**.

1. `npm run build` then start the production server on a free port (662 used `localhost:3100`).
2. A throwaway Playwright script reads `getComputedStyle(el).fontSize` for the two headings — the `latest` heading
   (`page.tsx:49`) and the agent-CTA heading (`:77`) — at widths **375 / 639 / 640 / 1439 / 1440 / 1920** × locales
   **sq/en/uk/it** = 48 readings.
3. Expected, per §3.4: `20px / 20px / 24px / 24px / 30px / 30px` at those widths, identical in all four locales.
4. Persist the raw readings to `.screenshots/task699-delta/live-route-fontsize-before.json`. Keep the script under
   the session scratch directory, never in the repository, and delete it after use.
5. If either heading is absent from the rendered route (e.g. no listings), **stop and report** — a capture that
   silently measured nothing is worse than no capture.

**I3 — write the constant (R1).** `src/design-system/mantine/typography.ts`: no `'use client'`, no imports, one
export, plain object literal. Head comment must state: the three tiers and their px values (§3.4), the five
consumers by path, that the values are preserved-not-re-derived (§3.7), and that the file sits in the
allowlist-covered directory on purpose (§3.3).

**I4 — repoint the five sites (R2, R4).** Edit **by line and prop**, never by value (§3.6's trap). After the edits,
`git diff` must show exactly five changed `fz=` props plus five added import lines and nothing else in those four
files. Quote the diff of `page.tsx` in full and confirm `:27`, `:28`, `:30`, `:33` are unchanged.

**I5 — gate the census (R3).** `npm run check:design-tokens`; quote the actual total. It must read **28
violations / 0 stale-marker(s) / 0 missing-reason error(s)**. Confirm the four target files no longer appear for
those lines and that `page.tsx` still reports its remaining 8.

**I6 — the live "after" capture (R6).** Rebuild, restart, re-run the identical script, persist to
`live-route-fontsize-after.json`, and diff the two files programmatically. Required result: **0 differences across
all 48 readings**. Quote the diff summary.

**I7 — rendered proof (R5).** `npm run build-storybook`, then `npm run screenshots:assert -- --mantine-only`,
compared against `.screenshots/rendered-assert/2026-07-31T10-33/`:

1. All 1184 cells: **0 FAIL, 0 verdict changes**; ambiguous set still 4 / 16 / 2 = 22.
2. `Mantine/Primitives/HowItWorksSteps/Default` (16) and `Patterns/Mantine/HomepageListingGrids/Default` (16):
   **byte-identical md5, all 32 cells.** A single changed cell here is a **stop and report** — neither story is in
   the measured noise set.
3. `Mantine/Primitives/PopularLocationsView/Default` (28) and `.../Long City Name` (28): at most **3** changed
   cells (the measured floor: 2 + 1). For every changed cell, either prove it sub-perceptual (max channel delta
   ≤ 1/255, the D17 comparator) or attribute it with a same-tree control. More than 3, or an unexplained one →
   **stop and report**.
4. Partition every other md5-changed cell in the run against the noise set recorded in Task 698's session log §8.1
   (`HeroSearch/Fallback`, `EmptyLoadingErrorState`, `HomepageListingGrids/Loading`, `LocaleSwitcher`, `Button`,
   `Skeleton`, `MobileBottomNavView`, `PopularLocationsView`, `ListingDetailPattern`, `ListingGalleryPattern`,
   `FilterControls`, `UserMenu`). Record "0 changed cells" rows rather than omitting a noise story.
5. Persist under `.screenshots/task699-delta/`.

**I8 — gate checks (R7).** `npm run typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens`, `npx vitest run`. For vitest, the documented full-run-only timeout set is
`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`, and **which two of the three time out varies by
run** — report the pair observed plus an isolated re-run of exactly those files.

**I9 — `npm run build` runs last** and must exit 0. Quote the transcript tail **verbatim including the full route
table** — all 54 route rows, no elision (Task 698 review P3).

**I10 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then `check:file-integrity` and `check:mojibake` **after** the records exist;
quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

## 11. Positive and negative flows

### Positive flow

A developer changes the section-heading size once, in `typography.ts`, and all five homepage headings follow. A
reviewer runs `check:design-tokens` and sees 28 instead of 43. A reader of `page.tsx` sees `fz={SECTION_HEADING_FZ}`
next to a hero heading that still carries its own, different, literal triad — and the two are visibly not the same
thing. Nothing on the rendered page moves by one pixel.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **A shared literal is swept by value** | **Yes** | §3.6 | `page.tsx:30`/`:33` byte-identical; hero unchanged | AC6 |
| **Constant lands outside the allowlisted dir** | **Yes** | §3.3 | Census would read 43, not 28 → the AC fails loudly | AC2 |
| **Client boundary leaks into the server page** | **Yes** | A2 | No `'use client'` added anywhere; `build` exits 0 | AC1, AC5 |
| **Responsive object rejected by Mantine's StyleProp** | **Yes** | A5 | `typecheck` 0 with the plain literal; a cast is a stop | AC5 |
| **A target cell moves** | **Yes** | R5 | 32 non-noise cells byte-identical; a change is a stop | AC3 |
| **The two uncovered sites drift** | **Yes** | R6 | 48/48 identical computed `font-size` readings | AC4 |
| **A breakpoint is misread (Mantine default 768 vs project 640)** | **Yes** | §3.4 | The `sm` tier starts at **640**, and the capture widths straddle it | AC4 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | `noHorizontalOverflow` stays true at 320/375/390 | AC3 |
| **All four locales** | **Yes** | cl. 7 | Zero new keys; parity 2215×4; captures cover sq/en/uk/it | AC4, AC5 |
| Validation / authorization / RLS | No | No data path, write, or permission boundary is touched | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers homepage typography | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — *Given* the diff, *then* `src/design-system/mantine/typography.ts` exists with no `'use client'`
  and no imports and exports `SECTION_HEADING_FZ` = `{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }`, and each of
  the five sites imports it directly from `@/design-system/mantine/typography` and passes it as `fz`.
- **AC2 [R3, R4]** — *Given* `npm run check:design-tokens` on the final tree, *then* it reports exactly **28
  violations / 0 stale-marker(s) / 0 missing-reason error(s)**, `page.tsx` still lists its 8 out-of-scope findings,
  and no `design-tokens-allow:` marker was added.
- **AC3 [R5]** — *Given* a fresh `build-storybook` + `--mantine-only` run vs `2026-07-31T10-33`, *then* 1184 cells
  show **0 FAIL and 0 verdict changes**, the ambiguous set is 4/16/2 = 22, `HowItWorksSteps/Default` and
  `HomepageListingGrids/Default` are **byte-identical across all 32 cells**, `PopularLocationsView`'s 56 cells show
  ≤3 changed with each one proven sub-perceptual or attributed, and every other changed cell is partitioned into the
  Task 698 §8.1 noise set with per-story counts including zeros.
- **AC4 [R6]** — *Given* the before/after live-route captures, *then* all **48** readings (2 headings × 6 widths × 4
  locales) are identical between them and equal 20/20/24/24/30/30px by width band, and the diff script reports **0
  differences**.
- **AC5 [R7]** — `npm run build` exits 0 on a fresh transcript with the **full 54-row route table quoted verbatim**;
  `typecheck` 0; `check:stories` 0 at 127 files / `checksRan: 16`; `check:story-coverage` 15/15; `check:i18n` 0 at
  2215×4 with zero new keys; `check:file-integrity` / `check:mojibake` 0 **after** the records exist (quote counts);
  `vitest` with no new failure beyond the documented run-varying pair.
- **AC6 [R2, R4]** — *Given* `git diff`, *then* the four modified component files show only five `fz=` prop changes
  and five added imports; `page.tsx:27`, `:28`, `:30`, `:33` are byte-identical; no barrel file is touched.
- **AC7 [R8]** — Session log per §14 exists and `docs/backlog.md` is updated in place at exactly 80 lines.

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`**, per `docs/qa-profiles.md`: typography is in scope, and the profile's own routing rule
("TailAdmin visual conformance is required when … typography … is in scope") applies even though this task
deliberately preserves every value. Q3 is selected for the *evidence*, not because a value changes.

**Declared proof path.** `--mantine-only` over the enrolled 1184 cells at 4 locales × 9 viewports, which already
straddles all three §3.4 tiers, **plus** the live-route capture at the six boundary widths for the two sites
Storybook does not cover. The 14-width canon is not used: the three tiers are fully exercised by the existing
matrix widths, and the two uncovered sites are proven at the exact tier boundaries instead — which is stronger than
sampling more widths that all land inside the same tier.

**What this task can prove that a normal Q3 cannot.** Since Task 698 froze the Storybook clock, PNG byte-identity is
a legitimate comparator. For a change whose entire claim is "nothing renders differently", byte-identity is the
correct comparator and `0 verdict changes` alone would be too weak. That is why R5 splits the target cells into a
byte-identical set and a small, measured, noise-tolerant set instead of applying one loose bound to both.

**TailAdmin side-by-side: not required.** No visual value changes (§3.7).

### 13.2 Worktree

Starts **clean** (§3.8). Snapshot `git status --porcelain` at I0; a non-empty result is a **stop and report**.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:design-tokens` | **28** / 0 stale / 0 missing-reason (exit 1, pre-existing report mode) |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 127 files, `checksRan: 16` |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4, zero new keys |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes, ambiguous 22; 32 target cells byte-identical; ≤3 `PopularLocationsView` cells |
| live-route before/after capture | 48/48 readings identical, 0 diffs |
| `npx vitest run` | no new failure beyond the documented run-varying pair |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I10** |
| `npm run build` | **0 — hard gate**, full route table quoted, run last |

## 14. Completion report contract

Session log at `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7.
2. The I0 snapshot and the **true final** `git status --porcelain`, taken after the records are written.
3. R1–R8 mapped to AC1–AC7 with evidence.
4. The constant as written, plus the `git diff` of all five sites, with `page.tsx`'s `:27`/`:28`/`:30`/`:33`
   explicitly shown unchanged.
5. The `check:design-tokens` before (43) and after (28) transcripts, with the per-file breakdown.
6. The 1184-cell comparison: the byte-identity result for the 32 target cells, the `PopularLocationsView` result with
   any changed cell's proof, and the full changed-cell partition with per-story counts **including zeros**.
7. The live-route capture: the method, the 48 before readings, the 48 after readings, and the diff result.
8. Every command with its **actual** exit code; the `npm run build` tail quoted verbatim including the full 54-row
   route table.
9. Deviations, each with a reason.
10. Limitations — at minimum: that the live-route capture covers two headings and six widths, not the whole page;
    that the 24px middle step has no named TailAdmin row and was preserved rather than re-derived (§3.7); that the
    remaining 28 `check:design-tokens` findings are untouched; and that `.screenshots/` evidence is local-only
    per **D6**.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_699_Homepage_Section_Heading_Fz_Tokenisation.md` — under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — the five sites with line numbers and exact text, the landing zone with its machine proof, the breakpoint px values, the story/cell counts, the baseline directory and the capture method are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R8 → AC1–AC7 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 plus §3.6's shared-literal trap, named twice and gated by AC6 |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 with the byte-identity rationale; §17 |
| Negative flows selected by applicability | **Yes** — §11, incl. the sweep-by-value branch, the wrong-landing-zone branch, the client-boundary branch and the breakpoint-misread branch, each with a stop condition |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes five lines read in source; §3.2 is a live gate run; §3.3 executes the real `scanContent` against the exact constant text; §3.4 quotes `theme.ts`'s own breakpoint block; §3.5 counts cells from the persisted manifest; §3.8 is a real `git status` |
| Gates prove the changed behavior | **Yes** — an exact 43→28 count, byte-identity on the cells that must not move, and a computed-style capture for the two sites CI cannot see |
| Single active owner route | **Yes** — forks are only stop conditions: I0 non-empty status, missing heading at capture, typecheck rejecting the plain literal, a moved target cell, >3 `PopularLocationsView` cells |
| Baselines account for task-created artifacts | **Yes** — `.screenshots/task699-delta/` is task-created with no prior baseline; `2026-07-31T10-33` is **read-only** |
| Dirty-worktree handling | **N/A, declared** — §3.8 proves a clean start; a non-empty I0 is a stop |

**Known-risk note for the reviewer.** Three likely defects. First, **a value-based sweep** — `1.875rem` and
`1.25rem` both appear in the hero triad and hero subtitle two dozen lines above the first target, and a careless
replace produces a hero that is visibly wrong while every gate still passes, because no story renders `page.tsx`.
AC6 exists for nothing else. Second, **the constant landing outside `src/design-system/mantine/`** — the task then
relocates 15 findings instead of removing them; AC2's exact 28 catches it, a vaguer "fewer violations" would not.
Third, **treating `sm` as 768px** — that is Mantine's default, not this project's, which rebound `sm` to 640px;
a capture that straddles 768 instead of 640 would report "identical" while measuring the wrong tier boundary.

## 16. Visual source map

| Visible artifact/state | Component/markup | Source of the value | Disposition | Evidence |
|---|---|---|---|---|
| "Latest" section heading | `page.tsx:49` `<Title order={2}>` | inline triad → `SECTION_HEADING_FZ` | **mechanism changes, value preserved** | AC4, AC6 |
| Agent-CTA heading | `page.tsx:77` `<Title order={2}>` | inline triad → `SECTION_HEADING_FZ` | **mechanism changes, value preserved** | AC4, AC6 |
| "How it works" heading | `HowItWorksSteps.tsx:27` | inline triad → `SECTION_HEADING_FZ` | **mechanism changes, value preserved** | AC3 (16 cells byte-identical) |
| "Featured" heading | `FeaturedListingsView.tsx:46` | inline triad → `SECTION_HEADING_FZ` | **mechanism changes, value preserved** | AC3 (16 cells byte-identical) |
| Popular-locations heading | `PopularLocationsView.tsx:46` | inline triad → `SECTION_HEADING_FZ` | **mechanism changes, value preserved** | AC3 (56 cells, ≤3 noise) |
| Hero title | `page.tsx:30` | own triad `1.875/2.25/3rem` | **untouched** | AC6 |
| Hero subtitle | `page.tsx:33` | own pair `1.25/1.375rem` | **untouched** | AC6 |
| Section band padding / rhythm | `MantineHomeSection` | `--home-section-py-*` (Task 662/669) | **untouched** | — |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical source | Disposition | Shared path |
|---|---|---|---|---|
| The section-heading font-size triad | read all five sites in source; read `theme.ts` `fontSizes` (`xs…xl`, tops out at `1.25rem`) and `headings.sizes` (`h3 = 1.875rem`); grepped `src/design-system/` for an existing exported responsive constant — **none exists**; executed the real `scanContent` against three candidate paths | **none — no shared source exists today**; `theme.fontSizes` cannot express it (no 1.5rem key, and adding one changes Mantine's public scale for every consumer), and `theme.other` is hook-only, unusable from the **server** `page.tsx` | **create** — one plain constants module in the allowlist-covered design-system directory, following the Task 661 `src/design-system/brand.ts` single-source precedent | `src/design-system/mantine/typography.ts`, imported directly by all five sites |

**Clause 16c note.** No Mantine component, prop shape, DOM structure or style value changes. The canonical stories
for the three story-backed surfaces already render the real production components; only where the font-size value is
declared changes.

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 1 created module + 4 component files + 2 records | No unrelated file touched; five props and five imports only | §7, §8, AC6 | required |
| cl. 3/5 (capabilities and UX flows intact) | Homepage headings | Every rendered heading identical before/after | AC3, AC4 | required |
| cl. 7 (four locales) | Rendered surfaces | Zero new keys; parity 2215×4; captures cover sq/en/uk/it | AC4, AC5 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + full route table | AC5 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | `noHorizontalOverflow` true at 320/375/390 | AC3 | required |
| cl. 12 (rendered evidence follows risk) | Q3, intended-zero-change | Byte-identity on 32 cells; ≤3 measured noise cells; every changed cell partitioned | AC3 | required |
| cl. 14 (file integrity) | 4 modified + 3 created text files | UTF-8 no BOM, no mojibake, scanned set includes the records | AC5 | required |
| cl. 15 (critical flows) | **No registry row** covers homepage typography | Not applicable — explicit negative, not silence | §11 | N/A, declared |
| cl. 16/16a (TailAdmin visual source) | No visual value introduced | Values preserved, not re-derived; the unnamed 24px step recorded as a NOTE | §3.7, §8 | required |
| cl. 16b (canonical provenance before code) | 8 artifacts mapped | Canonical search recorded; no shared source existed, so one is created in the allowlisted directory | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Three sites are story-backed; two are not | The three are proven byte-identical; the two uncovered ones get a live-route capture instead of an assumption | §17, AC3, AC4 | required |
| cl. 10 (git ownership) | Clean start | §3.8 snapshot; no mutating Git by the executor | §13.2 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 699 |
| Active route / owner decision | Single route: create `src/design-system/mantine/typography.ts` exporting `SECTION_HEADING_FZ` = `{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }`, import it directly at the five §3.1 sites, drive `check:design-tokens` from 43 to exactly 28, and prove zero rendered change by byte-identity on the 32 story-backed target cells plus a before/after live-route computed-style capture for the two sites no story covers (owner selection 2026-07-31; backlog reservation **689** with its 2026-07-30 corrected census; **D6** governs `.screenshots/`; **D17** supplies the sub-perceptual comparator for the ≤3 tolerated noise cells) |
| Decision source, date, scope | Owner, 2026-07-31, choosing the heading-triad slice over `HeroSearchView` de-Tailwind and the Featured/Latest skeleton chrome; scope = 1 new design-system module + 4 component files + records; **no** value change, **no** component migration |
| Starting worktree mode | **Clean** (§3.8, `git status --porcelain` empty after `9f1f35e15`); a non-empty I0 is a stop |
| Producer of each checkpoint | I0 snapshot → baseline gates → live "before" capture on the clean tree → constant module → five repointed sites → census gate → live "after" capture + diff → storybook + 1184-cell partition with byte-identity on the target set → typecheck/coverage/i18n/vitest → build with the full route table → records → post-records encoding gates |
| Persisted result | I0/final porcelain snapshots; the constant as written; the five-site diff with `page.tsx`'s untouched lines shown; before/after `check:design-tokens` transcripts; `live-route-fontsize-before.json` + `-after.json` + their diff; the 1184-cell partition and per-story byte-identity table under `.screenshots/task699-delta/`; every gate transcript; the build tail; the session log |
| Comparator | `check:design-tokens` **exactly 28** / 0 stale / 0 missing-reason; 1184 cells **0 FAIL / 0 verdict changes**, ambiguous **4/16/2 = 22**; `HowItWorksSteps/Default` + `HomepageListingGrids/Default` **32/32 byte-identical**; `PopularLocationsView` **≤3** changed cells each proven sub-perceptual or attributed; live route **48/48 identical** at 20/20/24/24/30/30px; `stories` 0/127/16; `story-coverage` 15/15; `i18n` 2215×4; `typecheck` 0; `build` exit 0 |
| Failure path | Non-empty I0 status → stop; a heading missing from the live route at capture time → stop; `typecheck` rejecting the plain object literal → stop (no cast, A5); any changed cell in the 32-cell byte-identical set → stop; more than 3 changed `PopularLocationsView` cells, or one that is neither sub-perceptual nor attributed → stop; any change to `page.tsx:27`/`:28`/`:30`/`:33` → stop; a census that is not exactly 28 → stop; `'use client'` required anywhere → stop (A2) |
| Zero/empty input case | The comparison may legitimately show **zero** changed cells for a noise story on a given run — record "0 changed cells" for it rather than omitting the row. The 32-cell target set must be **exactly zero** changed; a non-zero there is the task's primary failure signal, not noise. `PopularLocations` renders `null` when there are no featured locations (observed live in Task 662) — if the live route shows no popular-locations section, that does **not** affect R6, which measures only the `page.tsx:49` and `:77` headings |
| Task-created artifacts in baselines | `.screenshots/task699-delta/` is task-created with no prior baseline. `.screenshots/rendered-assert/2026-07-31T10-33/` is a **read-only** input captured before this change; it must not be regenerated |
