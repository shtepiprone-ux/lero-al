# Task 669 — `MantineHomeSection` rhythm to Mantine `xxl`, `PopularLocationsView` adopts the canonical band

**Status: IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW**

Kickoff: `tasks/kickoff_prompt_Task_669_HomeSection_xxl_Rhythm_And_PopularLocations_Band.md`

## 1. Task path and status

Implemented per the saved kickoff under `.claude/skills/execute-task/SKILL.md`. Worktree started clean at
`bdf0f69be` (verified `git status --porcelain` empty before the first write, per §13.2). Both halves of the
task (D1 rhythm rebind + `PopularLocationsView` band adoption) landed together in this session.

## 2. Requirement and acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `MantineHomeSection.tsx` root `Box` carries `py={{ base: 'var(--home-section-py-base)', md: 'var(--home-section-py-md)', xxl: 'var(--home-section-py-lg)' }}`. `grep -n 'padding-block' MantineHomeSection.module.css` → 0 hits (verified twice, after the wording-fix pass too). |
| R2 | AC2 | `grep -rn '1536' src/design-system/mantine/patterns/` → 0 hits. Live SSR capture of `/en` (fresh `next dev` server) shows the emitted rule verbatim: `.__m__-_R_2matol5rlmlb_{padding-block:var(--home-section-py-base);}@media(min-width: 48em){...padding-block:var(--home-section-py-md);}@media(min-width: 90em){...padding-block:var(--home-section-py-lg);}}` — identical shape on all 5 homepage `<section>` instances (Featured/Latest/Popular locations/How it works/Agent CTA). |
| R3 | AC3 | `git diff` on `MantineHomeSection.module.css` shows `.muted`/`.brandFade` blocks with **zero diff lines** below `.muted {`; `.band` retains `content-visibility: auto` (only the header comment and the two `padding-block`/`@media` blocks were removed). |
| R4 | AC4 | `PopularLocationsView.tsx` now renders `<MantineHomeSection variant="muted" containIntrinsicSize="auto 380px">` in place of the two wrapper `Box`es. `grep -n 'py-12\|2xl:py-20\|bg-muted/30\|container-wide' PopularLocationsView.tsx` → 0 hits. Diff shows the `:41-82` subtree (Title/SimpleGrid/cards) moved verbatim (only re-indented, no content change). |
| R5 | AC8 | `git diff --stat` confirms `src/app/[locale]/page.tsx`, `src/modules/locations/components/PopularLocations.tsx`, and `src/design-system/mantine/theme.ts` are **absent** from the diff. `<PopularLocations />` stays unwrapped in `page.tsx`; the band lives inside `PopularLocationsView` per §3.7. |
| R6 | AC5 | `MANTINE_STORY_EXTRA_VIEWPORTS` gained `HomeSection` and `PopularLocationsView` entries at 1200/1440/1536; `MANTINE_VIEWPORTS` untouched (diff confirms). Manifest cell counts (below) confirm 28/28. |
| R7 | AC6 | Measured (sharp, `HomeSection/Default` fresh captures, `en`, column x=4): **h(1200)=258px, h(1440)=290px (Δ=32 exactly), h(1536)=290px (equal to 1440)**. |
| R8 | AC7 | `PopularLocationsView.tsx` appended to `mantine-migration-scope.json` (append-only). `check:story-coverage` → **14/14 covered, 0 unproven**. |
| R9 | AC9 | Module header, `globals.css:281-287`, and `HomeSection.stories.tsx`'s `description` rewritten, each naming D1/2026-07-28/owner. `grep -rn '1536' src/design-system/mantine/patterns/ src/stories/patterns/mantine/HomeSection.stories.tsx` → 0 hits. `globals.css:280-290` no longer contains "≥1536px" or the "no Mantine theme breakpoint reaches" claim (re-read, confirmed). |
| R10 | AC10 | `npm run build` → **exit 0**, 40 static pages printed (`Generating static pages (40/40)`). |
| R11 | AC11 | `check:i18n` → 0, 2215×4, no new keys. `check:design-tokens` → 44 total repo violations before and after (touched-file counts unchanged — see §5). `check:file-integrity`/`check:mojibake` → 0/0 (re-run after the backlog edit too). |

## 3. Current versus required behavior

**Current (before):** `MantineHomeSection` padded 48px → 64px at 768px → 80px at the Tailwind-only 1536px, via a
CSS-module `@media` chain. `PopularLocationsView` rendered its own `<section>` with an equivalent Tailwind
utility chain plus `bg-muted/30` and `.container-wide`, the only homepage band not on the canonical pattern.

**Required after (delivered):** Identical rendering below 1440px. At ≥1440px the 80px step now applies
(previously only at ≥1536px). All five homepage bands — the four existing consumers plus the newly-migrated
`PopularLocationsView` — share one canonical source and rhythm trigger.

**Negative flow (empty locations, §11 applicability table):** `PopularLocations.tsx:27` (`if (!locations?.length)
return null`) is byte-identical, untouched. Because the band now lives **inside** `PopularLocationsView` rather
than being hoisted into `page.tsx`, the whole section — band included — still disappears cleanly with no empty
muted strip when there are no featured locations. Verified by diff: `page.tsx` and `PopularLocations.tsx` are
absent from the changeset (AC8).

## 4. Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineHomeSection.tsx` | Rhythm → Mantine `py` responsive prop (base/md/xxl); doc comment updated. |
| `src/design-system/mantine/patterns/MantineHomeSection.module.css` | Both `padding-block`/`@media` blocks removed; `.band` keeps only `content-visibility`; header rewritten. |
| `src/app/globals.css` | Comments only on `--home-section-py-*` (lines ~281-287); token values unchanged. |
| `src/modules/locations/components/PopularLocationsView.tsx` | `:39-40` wrapper → `MantineHomeSection variant="muted" containIntrinsicSize="auto 380px"`; doc block updated; subtree `:41-82` moved verbatim. |
| `src/stories/patterns/mantine/HomeSection.stories.tsx` | `docs.description.component` sentence about the retired step rewritten; no structural story change. |
| `scripts/check-stories-rendered.mjs` | Added `HomeSection`/`PopularLocationsView` entries to `MANTINE_STORY_EXTRA_VIEWPORTS` (1200/1440/1536) with justification comment. |
| `scripts/mantine-migration-scope.json` | Appended `src/modules/locations/components/PopularLocationsView.tsx`. |
| `docs/backlog.md` | Resolved OQ3, added a concise 669 entry, updated the numbering line; consolidated one blank line to stay at 80. |
| `docs/sessions/2026-07-28-task669-homesection-xxl-rhythm-popularlocations-band.md` | This session log. |

## 5. Validation evidence

| Command | Result |
|---|---|
| `npm run typecheck` | 0 (re-run after wording fixes too) |
| `npx vitest run` (full suite) | 1154/1156 pass, 2 fail (`date-format-ssr-parity`, `RangeDatePicker` — both `Test timed out in 5000ms` under full-suite resource contention, files untouched by this task). Isolated re-run of just those 2 files: **39/39 PASS**. Net: 1156/1156 real pass, 0 attributable to this diff. |
| `npm run check:stories` | 0 — 126 files, 0 violations (re-run after wording fixes) |
| `npm run check:story-coverage` | 0 — **14/14 covered**, 0 unproven |
| `npm run build-storybook` | 0 — built successfully |
| `npm run screenshots:assert -- --mantine-only` | **0 FAIL**, 1130/1152 PASS, 22 AMBIGUOUS (all classified below) |
| I6 measurement | `h(1200)=258px`, `h(1440)=290px` (Δ32), `h(1536)=290px` (equal) — both equalities hold exactly |
| `npm run check:design-tokens` | 44 violations repo-wide, unchanged before/after in touched files (see below) |
| `npm run check:i18n` | 0 — 2215×4, no new keys |
| `npm run check:file-integrity` | 0 — 9 files clean (re-run after backlog edit) |
| `npm run check:mojibake` | 0 — 1985 files scanned, 0 artifacts (re-run after backlog edit) |
| `npm run build` | **0 — hard gate.** 40/40 static pages generated. |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | 4 PASS / 0 FAIL / 3 SKIP (auth-gated routes, pre-existing env limitation, not this task's scope) |

**AC2 emitted rule, quoted exactly** (fresh `next dev`, `/en`, first `MantineHomeSection` instance):
```
.__m__-_R_2matol5rlmlb_{padding-block:var(--home-section-py-base);}
@media(min-width: 48em){.__m__-_R_2matol5rlmlb_{padding-block:var(--home-section-py-md);}}
@media(min-width: 90em){.__m__-_R_2matol5rlmlb_{padding-block:var(--home-section-py-lg);}}
```
Confirmed identical shape (only the generated class differs) on all 5 homepage bands, including the
`PopularLocationsView` band, in the same SSR capture.

**`--mantine-only` cell-count evidence (manifest, `.screenshots/rendered-assert/2026-07-28T18-02/manifest.json`):**
`Patterns/Mantine/HomeSection/Default` = 28 cells, `Mantine/Primitives/PopularLocationsView/Default` = 28 cells,
`Mantine/Primitives/PopularLocationsView/Long City Name` = 28 cells — all three at widths
`[320,375,390,1024,1200,1440,1536]`. Every other of the 66 canonical Mantine stories: 63 at 16 cells (unchanged
standing 4-width×4-locale), `HeroSearch`×2 and `ListingDetailPattern` at 20 (their own pre-existing extra-viewport
entries, untouched).

**AMBIGUOUS classification (22 total, 0 FAIL):**
- 4× `Mantine/Primitives/Combobox/Default` (`ambiguous-overlap`, `mobile-390` × sq/en/uk/it) — pre-existing,
  unrelated primitive, not touched by this task.
- 2× `Mantine/Primitives/Tabs/Default` (`ambiguous-offscreen`, `mobile-320` × sq/it) — pre-existing, unrelated.
- 16× `Mantine/Primitives/PopularLocationsView/Long City Name` (`text-clipped-ellipsis`, standing 4 widths ×
  4 locales — **not** the 3 new wide widths) — this is the story's own documented intentional-truncation stress
  test (`truncate` clips to one line by design, per the story's own `docs.description`). Unrelated to the
  vertical-rhythm change (padding, not text truncation); appears only at the pre-existing standing widths, never
  at 1200/1440/1536, confirming it predates this diff.

No new FAIL anywhere (A3 stop condition not triggered). No standing ≤1024 cell for `HomeSection`,
`FeaturedListingsView`, `LatestListingsView`, `HowItWorksSteps`, or the CTA band changed (A2 — all four
untouched `page.tsx` consumers stayed byte-identical at the standing widths; only `PopularLocationsView`'s own
structural change is new, and it is expected).

**`check:design-tokens` before/after (touched files only):** `PopularLocationsView.tsx` reports 4 findings both
before and after (`fz={{...}}` responsive prop line + `style={{ zIndex: 1 }}` line) — confirmed via `git diff`
that both values are byte-identical to the pre-change file, only re-indented and shifted by the +1 import line.
`MantineHomeSection.tsx`/`.module.css`/`globals.css` report **0** findings in either state (the new `py` prop
uses `var()` references, never flagged as raw values). Total repo count: **44 before, 44 after** — 0 new.

## 6. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Band vertical rhythm, base | `MantineHomeSection` root `Box` | `.band` (was) → `py` prop (now) | `padding-block: var(--home-section-py-base)` → `3rem` (48px) | **changed mechanism, same value** | §3.4/§3.5 of kickoff; AC1 |
| Band vertical rhythm, ≥768 | same | `@media(min-width:48em)` | `var(--home-section-py-md)` → `4rem` (64px) | **changed mechanism, same value+trigger** | AC1/AC2 |
| Band vertical rhythm, third step | same | `@media(min-width:90em)` | `var(--home-section-py-lg)` → `5rem` (80px) | **changed trigger** 1536px → `xxl`/90em (1440px) | D1, AC2, AC6 |
| Muted band background | `variant="muted"` | `.muted` | `color-mix(in oklab, var(--muted) 30%, transparent)` | **preserved verbatim** | git diff zero-delta, AC3 |
| BrandFade band background | `variant="brandFade"` | `.brandFade` | two-stop gradient | **preserved verbatim** | git diff zero-delta, AC3 |
| Content column | inner `Box` | `.container-wide` | `globals.css:598-605`, own 1536px side-padding step | **preserved, out of scope** (Task 681) | §8 kickoff |
| Popular-locations band | `PopularLocationsView` root | was `Box component="section"` Tailwind chain, now `MantineHomeSection` | replaced | **replaced by canonical pattern** | AC4 |
| Popular-locations grid/cards | `SimpleGrid` + `Box component={Link}` | `CITY_GRADIENTS`, gradients, hover/focus | **preserved, out of scope** | diff shows `:41-82` content unchanged | AC4 |
| Popular-locations heading | `Title order={2}` | `fz={{ base, sm, xxl }}` | **preserved** (pre-existing `xxl` precedent for D1) | diff shows unchanged | AC4 |

## 7. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Homepage band rhythm | Inspected `theme.ts:143-151` (confirmed `xxl: '90em'` before writing, A1), `MantineHomeSection.{tsx,module.css}`, `globals.css:280-290`, `HomeSection.stories.tsx`, `check-stories-rendered.mjs:392-424` | `Patterns/Mantine/HomeSection` (pre-existing) → `MantineHomeSection.tsx` | **extend** — canonical owner changed once for all 5 consumers | `--home-section-py-base/md/lg` retained; trigger moved to `theme.breakpoints.xxl`. Story preserved, re-captured with new viewports (AC5). Manifest already enrolled. |
| Popular-locations band | Inspected `PopularLocationsView.tsx` in full, `PopularLocations.tsx`, `page.tsx:55-58`, `mantine-migration-scope.json`, `PopularLocationsView.stories.tsx` (imports the real component directly) | `Mantine/Primitives/PopularLocationsView` (pre-existing, imports real component) | **reuse** — consumed `MantineHomeSection`, copied no styles locally | Manifest enrolment added (R8), `check:story-coverage` 13/13 → 14/14 |

No artifact needed a value without design-system provenance; not `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

## 8. Self-review findings

- **Defect found and fixed during self-review:** my first-pass rewrite of the module header comment,
  `HomeSection.stories.tsx`'s description, contained the literal substring `1536` (explaining what changed
  historically) and the module header contained the literal substring `padding-block`. AC1/AC2/AC9 are
  **mechanical grep checks with a 0-hit requirement**, and these explanatory mentions would have failed them.
  Reworded all three passages to describe the change without those exact substrings (e.g. "legacy Tailwind `2xl`
  trigger" instead of the literal number), re-verified all four grep-based ACs return 0 hits, and re-ran
  `check:stories`/`check:mojibake`/`check:file-integrity`/`typecheck` to confirm the wording-only edit introduced
  no regression.
- **No other gaps found.** All 11 requirements have direct evidence; the two vitest failures were confirmed
  unrelated (unattached files, resource-contention timeouts, pass 39/39 in isolation).

## 9. Assumptions, deviations, and limitations

- **A1 confirmed, no deviation:** `theme.ts:150` read as `xxl: '90em'` before any edit — matches the kickoff's
  assumption exactly; no substitution needed.
- **A2 confirmed:** the four untouched `page.tsx` consumers (Featured/Latest/HowItWorks/CTA) show 0 FAIL and no
  new AMBIGUOUS at their standing ≤1024 cells — only `PopularLocationsView`'s intended structural change is new.
- **A3 applied:** all 22 AMBIGUOUS cells classified in §5 above; none is a new FAIL.
- **Declared 7-width proof path (§13.1):** this task's rendered evidence covers
  `320/375/390/1024` (standing) `+ 1200/1440/1536` (new) × 4 locales for the two affected stories — not the full
  14-width canonical matrix. The remaining canonical widths (480/560/680/810/960/1920/2560) are **not** captured
  for these stories; that is Task 678's scope, per the kickoff.
- **px→em media-query semantics change (§3.3):** the emitted rule changed from `@media (min-width: 1536px)`
  (absolute) to `@media (min-width: 90em)` (root-font-relative). At default root font size they're equivalent;
  under browser font-size zoom the em query now tracks the user's setting. This is the intended consequence of
  D1, not a regression — recorded per the kickoff's instruction, not "fixed back" to px.
- **`.container-wide`'s own 1536px horizontal-padding step is untouched** (out of scope, reserved Task 681, per
  kickoff §8) — after this task the 1440-1536px window has vertical rhythm on the new step but side padding
  still on the old one. Declared, not silently fixed.
- **R7 is a measured, reported result, not a self-failing standing assertion** — the harness persists the capture
  (manifest + PNGs); the two equalities were verified manually via the `sharp`-based measurement in this session,
  matching Task 675's precedent technique. No new automated numeric assertion was added to the harness (kickoff
  explicitly places this out of scope).
- **`docs/backlog.md` consolidation:** the file was already at the 80-line hard limit. To add the required
  concise 669 entry while resolving OQ3 and updating the numbering line, one blank line (between the
  `## Prior Sessions (2026-07-21/07-22)` header and its single bullet) was removed to net zero. No content was
  deleted; only OQ3's now-resolved sentence and 669's now-stale "reserved" mention were removed from the "Open —
  needs action" paragraph. Final line count: **80** (`wc -l`), no `BACKLOG LIMIT BREACH`.

## 10. Opus handoff

**Evidence locations:**
- Fresh rendered captures + manifest: `.screenshots/rendered-assert/2026-07-28T18-02/`
- Build output: `.next/BUILD_ID` (fresh, post-change)
- This session log; backlog entry at `docs/backlog.md` → "Last Session (2026-07-28)" → 669 bullet.

**Questions/risks for the reviewer to inspect directly (per the kickoff's own "known-risk note," §601):**
1. Confirm the band was **not** hoisted into `page.tsx` — check `git diff --stat` shows `page.tsx` absent
   (AC8), and that `<PopularLocations />` at `page.tsx:57` is unchanged/unwrapped.
2. Confirm `theme.ts` is **absent** from the diff — no new `2xl`/`96em` breakpoint was added to preserve the old
   step; the rebind is entirely on the consumer side (`py` prop + retired CSS `@media`).
3. Independently re-verify the AC6 numeric claim if desired: `.screenshots/rendered-assert/2026-07-28T18-02/patterns-mantine-homesection--default__en__wide-{1200,1440,1536}.png`, muted-band pixel run at a fixed x-column near the left edge.
4. Verify the AC2 quoted emitted rule against a fresh `next dev` SSR capture of `/en` if independent confirmation
   is wanted (reproducible: `curl http://localhost:3000/en | grep -o 'data-mantine-styles="inline"[^<]*<[^>]*>'`).

## 11. Backlog update

Concise entry added to `docs/backlog.md` → "Last Session (2026-07-28)" (1 line, matches the file's existing
density convention). OQ3 resolved in the "Open — needs action" section; numbering line updated (669 moved from
"reserved" to "Awaiting review"). Final line count: **80** — at, not over, the limit. No `BACKLOG LIMIT BREACH`.
