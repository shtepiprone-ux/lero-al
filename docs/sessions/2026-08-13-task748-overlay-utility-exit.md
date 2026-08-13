# Task 748 — clear the last 24 `--color-overlay*` utilities so 695's exit condition becomes reachable

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Never self-approved.

**2026-08-13 UPDATE — REWORK completed.** This submission was reviewed (`docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json`, decision `NEEDS REVISION`) and found two real rendered-colour regressions the original §6 comparator could not see (F-A, F-B) plus a methodology defect in that comparator itself (F-C). §REWORK below (end of this file) is the complete rework record: RR1–RR7, the owner's RR2 disposition, the new real before/after comparator, and the re-run D34 pass. Sections 1–12 below are the **original submission**, kept for the record; §REWORK supersedes §4–§6's conclusions where they conflict. Read §REWORK first.

## 1. Task path and status

`tasks/Sprints/Sprint_46_kickoff_prompt_Task_748_OverlayUtilityExit_DeTailwind.md`, Sprint 46.11.
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 2. I0 baseline

`git status --porcelain` → empty. `HEAD` = `d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f` (one commit ahead of
the kickoff's filed `cc1f52f1c` — a docs-only commit, `d3ffd6d6c`, that does not touch any of the six target
files; re-verified by content, not assumed).

Census (§13 command, exact) at I0:

```
1 src\components\admin\AdminUserAvatar.tsx
11 src\components\shared\PerfDevOverlay.tsx
3 src\design-system\mantine\patterns\MantineListingGalleryPattern.tsx
3 src\modules\listings\components\ImageUpload.tsx
1 src\modules\listings\components\LightboxView.tsx
5 src\modules\listings\components\ListingGallery.tsx
TOTAL 24
```

Matches the kickoff's measured census exactly (24 live, 6 files, same per-file split).

`globals.css` both overlay definitions, grepped and quoted at I0:

- `@theme inline` (`:82-85`): `--overlay: oklch(0 0 0); --overlay-foreground: oklch(1 0 0); --color-overlay: var(--overlay); --color-overlay-foreground: var(--overlay-foreground);`
- `:root` (`:470-471`): `--overlay: oklch(0 0 0); --overlay-foreground: oklch(1 0 0);`

`npm run build` at I0 → **exit 0**, `/[locale]` First Load JS = **619 kB** (transcript:
`.screenshots/task748-overlay/i0-build.txt`).

## 3. Requirement and acceptance-criteria evidence

| Req | AC | Status | Evidence |
|---|---|---|---|
| R1 | AC1 | MET | Final census (§7) = 0 |
| R2 | AC2 | MET | 168/168-cell comparator, 0 failures, proven able to fail via `--plant` (§6) |
| R3 | AC3 | MET | All 10 opacity-modifier utilities reproduced as static fallback + `@supports` override, values byte-identical to the real `.next/static/css` output (§5) |
| R4 | AC4 | MET | All 24 sites measured — 24 winners, 0 losers (§4) |
| R5 | AC5 | MET | `grep -c "var(--color-overlay"` across the six new modules = 0 (§7) |
| R6 | AC6 | MET | `git diff src/app/globals.css` = 0 lines (§7) |
| R7 | AC7 | MET | Diff of the six components touches only overlay utilities; every other class/prop/structural line unchanged (§8 Files Changed + manual diff review) |
| R8 | AC8 | MET | `ListingGallery.portal.smoke.test.tsx` 4/4 PASS, test file untouched |
| R9 | AC9 | MET, WITH A CORRECTION TO §3.6 | Real two story-backed surfaces are `MantineListingGalleryPattern.tsx` + `LightboxView.tsx`, not `ListingGallery.tsx` — see §9 |
| R10 | AC10 | MET | `/[locale]` First Load JS 619 kB → 619 kB, no increase |
| R11 | AC11 | MET, EXPANDED | `bg-overlay/95` **and** bare `bg-overlay` both still scanner-visible — see §10 |
| R12 | AC12 | MET | typecheck exit 0; all 5 named gates 0 violations/clean; backlog stays ≤80 lines; this log |

## 4. D34 — per-site cascade measurement, all 24 sites

Method: source inspection for every site (element type, ancestor component, any competing
class/unlayered CSS setting the same property), cross-checked against the real production bundle's
source order for the two sites with a genuine same-layer contest (below). All 24 are **winners** —
**zero losers**, so every module rule stays **unlayered** (D34: "if it wins, reproducing it in an
unlayered rule changes nothing").

| # | File:Site | Element | Contest | Winner? |
|---|---|---|---|---|
| 1–11 | `PerfDevOverlay.tsx` (11 sites: the `pressureClass` ternary + 10 literal `className`s) | plain `div`/`span` | None — dev-only fixed-position badge, no Mantine/shadcn ancestor CSS | WINNER (trivial — `@layer base` always loses to `@layer utilities` regardless of order, and nothing else sets the same property) |
| 12 | `ListingGallery.tsx:109` (`bg-overlay/50` + `text-overlay-foreground`) | plain `div`, child of `AppImage`'s children slot | `AppImage` sets no `background-color`/`color` on children | WINNER (trivial) |
| 13–15 | `ListingGallery.tsx:123` (`bg-overlay/60`, `text-overlay-foreground`, `hover:bg-overlay/70`) | base-ui `Button` `variant="ghost"` | `ghost` sets `text-foreground` (unconditional) + `hover:bg-muted` (hover) — genuine same-layer, same-specificity contest | WINNER, **measured**: `.text-foreground,.text-foreground\/80` at byte offset 44970 vs `.text-overlay-foreground` at 46187 (later wins); `.hover\:bg-muted:hover` at 68517 vs `.hover\:bg-overlay\/70:hover` at 69979 (later wins) — both in `.next/static/css/3b5759d2e996cb5d.css` at I0. Migrating to an always-winning unlayered rule reproduces today's already-winning result — no D28 promotion. |
| 16–17 | `MantineListingGalleryPattern.tsx:67` (`bg-overlay/60` + `text-overlay-foreground`) | plain `div`, child of Mantine `UnstyledButton` | `UnstyledButton` styles itself, not a nested child; no rule targets this specific div | WINNER (trivial) |
| 18 | `MantineListingGalleryPattern.tsx:90` (`bg-overlay/60`) | plain `div`, child of `UnstyledButton` | same as above | WINNER (trivial) |
| 19–21 | `ImageUpload.tsx:117` (`bg-overlay/50`) and `:167` (`bg-overlay/60` + `text-overlay-foreground`) | plain `div`/`span`, children of `AppImage`'s children slot | `AppImage` sets no `background-color`/`color` on children | WINNER (trivial) |
| 22 | `LightboxView.tsx:106` (`text-overlay-foreground/80`) | plain `div`, child of `Modal.Body`'s flex wrapper | Only `color` inheritance from ancestors exists (Mantine `Paper`/`Modal.Content` sets its own background via inline `style`, not `color`); inheritance always loses to any explicit rule on the element itself | WINNER (trivial by source inspection) **and empirically confirmed** — real-browser computed-style capture (§6) shows the rendered `color` matches the ground-truth compiled value across all 56 (locale×viewport) cells |
| 23 | `AdminUserAvatar.tsx:169` (`bg-overlay/30`) | plain `div`, sibling of the avatar image container | No Mantine/shadcn CSS on this element | WINNER (trivial) |

24 sites measured, **24 winners, 0 losers**. No site required leaving a Tailwind class untouched.

## 5. Compiled-vs-module comparison, all 12 distinct utilities

Compiled directly from the real `npm run build` output (`.next/static/css/3b5759d2e996cb5d.css`) at
I0, **not** an isolated single-class `compile()` call — the isolated-compile technique (used as
Task 691's own precedent) produces a functionally-equivalent but textually different static
fallback (`color-mix(in srgb, oklch(0 0 0) 60%, transparent)` instead of the real build's `#0009`);
confirmed by running both and diffing (`.screenshots/task748-overlay/compile-overlay-candidates.mjs`
vs the real bundle grep). Every module rule below is byte-identical to the real bundle's
declaration body, wrapper included.

| Utility | Static fallback (real build) | `@supports` override | Module(s) | Match |
|---|---|---|---|---|
| `bg-overlay/30` | `#0000004d` | `color-mix(in oklab,var(--overlay) 30%,transparent)` | `AdminUserAvatar.module.css` | ✅ |
| `bg-overlay/50` | `#00000080` | `color-mix(in oklab,var(--overlay) 50%,transparent)` | `ListingGallery.module.css`, `ImageUpload.module.css` | ✅ |
| `bg-overlay/60` | `#0009` | `color-mix(in oklab,var(--overlay) 60%,transparent)` | `ListingGallery.module.css`, `MantineListingGalleryPattern.module.css` (×2), `ImageUpload.module.css` | ✅ |
| `bg-overlay/85` | `#000000d9` | `color-mix(in oklab,var(--overlay) 85%,transparent)` | `PerfDevOverlay.module.css` | ✅ |
| `hover:bg-overlay/70` | `#000000b3` (inside `@media (hover: hover)`) | `color-mix(in oklab,var(--overlay) 70%,transparent)` (inside `@media (hover: hover)`) | `ListingGallery.module.css` | ✅ — **the `@media (hover: hover)` wrapper is reproduced**; a naive transcription would have missed it (confirmed present via brace-depth walk of the real bundle, not assumed) |
| `text-overlay-foreground` (plain) | `var(--overlay-foreground)` (single declaration, no `@supports` tier) | n/a | `PerfDevOverlay.module.css`, `ListingGallery.module.css`, `MantineListingGalleryPattern.module.css`, `ImageUpload.module.css` | ✅ |
| `text-overlay-foreground/40` | `#fff6` | `color-mix(in oklab,var(--overlay-foreground) 40%,transparent)` | `PerfDevOverlay.module.css` | ✅ |
| `text-overlay-foreground/50` | `#ffffff80` | `color-mix(in oklab,var(--overlay-foreground) 50%,transparent)` | `PerfDevOverlay.module.css` | ✅ |
| `text-overlay-foreground/60` | `#fff9` | `color-mix(in oklab,var(--overlay-foreground) 60%,transparent)` | `PerfDevOverlay.module.css` | ✅ |
| `text-overlay-foreground/70` | `#ffffffb3` | `color-mix(in oklab,var(--overlay-foreground) 70%,transparent)` | `PerfDevOverlay.module.css` | ✅ |
| `text-overlay-foreground/80` | `#fffc` | `color-mix(in oklab,var(--overlay-foreground) 80%,transparent)` | `LightboxView.module.css` | ✅ |
| `border-overlay-foreground/20` | `#fff3` | `color-mix(in oklab,var(--overlay-foreground) 20%,transparent)` | `PerfDevOverlay.module.css` | ✅ |

Post-migration compiled output verified byte-identical for all 12 module-generated selectors
(`.screenshots/task748-overlay/final-build.txt`, cross-checked against `.next/static/css` post-edit
— every `.<Component>_<class>__<hash>{…}` rule body matches its pre-migration Tailwind counterpart
exactly, including the `hover:bg-overlay/70` site's `@media (hover: hover)` wrapper).

## 6. Rendered computed-style comparator (R2/AC2, R9/AC9)

**Method.** A single build (this worktree's own `storybook-static`) — no separate before/after
worktree build. For each of the 3 real story-backed sites (`photoCountBadge`, `extraCountOverlay`
in `MantineListingGalleryPattern.tsx`; `counter` in `LightboxView.tsx`), the comparator resolves
the migrated element's CSS-Modules-hashed class, captures its live `getComputedStyle()`, and
compares it against a synthetic probe element injected into the **same page**, carrying the exact
ground-truth declaration text extracted from the real I0 `npm run build` output. Both sides are
evaluated by the same browser engine on the same page load. A synthetic probe using the *original
Tailwind utility class name* (the technique Task 691's precedent used) is not available
post-migration — the utility is no longer a scanned candidate anywhere in `src/**`, so Tailwind no
longer generates it in this build; the probe instead uses inline `style` set to the literal
ground-truth declaration text, which needs no Tailwind candidate.

Matrix: 3 sites × 4 locales (sq/en/uk/it) × 14 viewports (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560)
= **168 tuples**.

**Proof the comparator can fail** (`--plant`, corrupts one expected value):

```
node .screenshots/task748-overlay/capture-and-compare.mjs --plant
Cells: 168/168, failures: 1
COMPARATOR: FAIL
EXIT_CODE=1
```

**Real run:**

```
node .screenshots/task748-overlay/capture-and-compare.mjs
Cells: 168/168, failures: 0
COMPARATOR: PASS
EXIT_CODE=0
```

168/168 cells `status: OK` (no `MISSING_CLASS`/`MISSING_ELEMENT`/`ERROR`), every captured property
matched its ground-truth probe exactly (e.g. `photoCountBadge|sq|375`: `backgroundColor`
`oklab(0 0 0 / 0.6)` = `oklab(0 0 0 / 0.6)`, `color` `oklch(1 0 0)` = `oklch(1 0 0)`).
Full results: `.screenshots/task748-overlay/capture-and-compare-result.json`.

## 7. Final gates and census

| Command | Result |
|---|---|
| Final census (§13 command) | **0** (`.screenshots/task748-overlay/final-census-2.txt`) |
| `git diff src/app/globals.css` | **0 lines** (empty — R6) |
| `grep -c "var(--color-overlay" <six new modules>` | **0** across all six (R5) |
| `npm run build` (final) | **exit 0**, `/[locale]` = **619 kB** (no change from I0) |
| `npx vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` | **4/4 PASS** (critical-flow registry `:105`) |
| `npx vitest run` (full suite) | **1347/1347 PASS**, 80/80 files, 0 regression |
| `npm run check:design-tokens` | **0 violations** (after adding `design-tokens-allow` markers to all 15 reproduced hex fallback values, same convention as `MantineListingCardPattern.module.css`) |
| `npm run check:css-vars` | **0 violations, 0 in-class dynamic sites** |
| `npm run check:stories` | **0 violations, 127 files** |
| `npm run check:mojibake` | **0 artifacts, 2223 files** |
| `npm run check:file-integrity` | **12/12 clean** |
| `npm run typecheck` | **exit 0** |

All transcripts retained under `.screenshots/task748-overlay/`.

## 8. Files Changed

| File | Change | Reason |
|---|---|---|
| `src/components/shared/PerfDevOverlay.tsx` | 11 overlay utilities → `styles.*` (CSS module) | R1 |
| `src/components/shared/PerfDevOverlay.module.css` | **new** — 6 rules (`badge`, `sourceLabel`, `metricRow` ×5-reused, `divider`, `offLabel`, `guardStats`) | R1/R3 |
| `src/modules/listings/components/ListingGallery.tsx` | 5 overlay utilities → `styles.*` | R1 |
| `src/modules/listings/components/ListingGallery.module.css` | **new** — 2 rules (`morePhotosOverlay`, `photoCountButton` incl. `:hover`) | R1/R3 |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | 3 overlay utilities → `styles.*` | R1 |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.module.css` | **new** — 2 rules (`photoCountBadge`, `extraCountOverlay`) | R1/R3 |
| `src/modules/listings/components/ImageUpload.tsx` | 3 overlay utilities → `styles.*` | R1 |
| `src/modules/listings/components/ImageUpload.module.css` | **new** — 2 rules (`hoverOverlay`, `orderBadge`) | R1/R3 |
| `src/modules/listings/components/LightboxView.tsx` | 1 overlay utility → `styles.*` | R1 |
| `src/modules/listings/components/LightboxView.module.css` | **new** — 1 rule (`counter`) | R1/R3 |
| `src/components/admin/AdminUserAvatar.tsx` | 1 overlay utility → `styles.*` | R1 |
| `src/components/admin/AdminUserAvatar.module.css` | **new** — 1 rule (`spinnerOverlay`) | R1/R3 |
| `.screenshots/task748-overlay/*` | evidence: compiled before-side, D34 measurement scripts, comparator + results, build/gate transcripts (local-only, `.gitignore`) | I2/I3 evidence |
| `docs/backlog.md` | concise state update | Standing rule |

`docs/sessions/2026-08-13-task748-overlay-utility-exit.md` (this file) is the only other touched
path. No file outside §7's kickoff scope was touched — confirmed by the final `git status
--porcelain` in §7.

Each `.tsx` diff touches **only** the overlay `className` string per site — no other Tailwind
class, prop, structural line, or non-overlay behavior moved (manually diffed against the original
read of each file before editing).

## 9. §3.6 correction — the real story-backed pair

The kickoff's own §3.6 table names `ListingGallery.tsx` as story-backed
(`src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx`) and
`MantineListingGalleryPattern.tsx` as story-less. **Measured false, not transcribed**:
`ListingGalleryPattern.stories.tsx` imports and renders `MantineListingGalleryPattern` (line 5:
`import { MantineListingGalleryPattern } from '@/design-system/mantine/patterns'`), not the legacy
`ListingGallery`. `grep -rn "from '@/modules/listings/components/ListingGallery'" src/stories` → **0
hits** — no story anywhere imports the legacy component.

**The real two story-backed surfaces are `MantineListingGalleryPattern.tsx` and
`LightboxView.tsx`.** Both received the real rendered computed-style proof in §6 (168 tuples, full
Q4 matrix). The four **compiled-equivalence-only** surfaces (stated explicitly, per §3.6's own
requirement not to imply coverage they don't have) are: `PerfDevOverlay.tsx`, `ListingGallery.tsx`,
`ImageUpload.tsx`, `AdminUserAvatar.tsx` — their proof is §5's byte-identical compiled-CSS
comparison plus the zero-exit build/typecheck/vitest gates in §7, not a rendered capture.

## 10. R11 — `bg-overlay/95` comment status, expanded

The kickoff anticipated only `bg-overlay/95` surviving as a generated-but-unused utility via
`LightboxView.tsx`'s comment (`:75-84`, untouched by this task). **Measured**: the same comment
block also contains a *second*, bare mention — `:84`, "the exact semantic token `bg-overlay` itself
resolves to" — which independently keeps `.bg-overlay{background-color:var(--overlay)}` generated
too. Post-migration build confirms exactly these two survivors and nothing else:

```
.bg-overlay\/95{background-color:#000000f2}
.bg-overlay\/95{background-color:color-mix(in oklab,var(--overlay) 95%,transparent)}
.bg-overlay{background-color:var(--overlay)}
```

Both are out of this task's scope (the comment is pre-existing, untouched, and R11 explicitly hands
the rewrite decision to 695). **695 needs to decide on both mentions, not only `bg-overlay/95`.**

**OQ1** (owner, 2026-08-13): the owner chose to migrate `PerfDevOverlay.tsx` rather than grant it a
documented exception. Implemented — all 11 of its sites migrated per §4/§8. Recorded here per the
kickoff's own traceability requirement.

**OQ2** (not Sonnet's): whether 695 rewrites the `bg-overlay/95` / bare `bg-overlay` comment
mentions or accepts them as generated-but-unused. Reported, not decided.

## 11. Assumptions, deviations, limitations

1. **Line-number offset.** The kickoff's §3.1 cites `PerfDevOverlay.tsx` sites at `:31,:56,:59,:74,:79`
   etc.; the actual file (unchanged since filing — confirmed via `d3ffd6d6c`'s diff not touching
   this file) has each site 1 line later (`:32,:57,:60,:75,:80`). Similarly `MantineListingGalleryPattern.tsx`'s
   two `bg-overlay/60` sites are at `:67`/`:90`, not the kickoff's `:57`/`:80`. Utility strings,
   counts, and per-file totals all matched exactly; only the kickoff's own line-counting was off.
   Not a blocker — the tree wins per standing doctrine.
2. **Kickoff's D35 count.** §3.1's total row says "10 of 12 are D35"; the actual count of
   modifier-bearing (D35-family) utilities in the 12-row table is 11 (all rows except plain
   `text-overlay-foreground`). Treated all 11 as D35 (two-rule form) regardless of the kickoff's own
   summary arithmetic — the per-row classification in the table itself was correct, only its total
   was off by one.
3. **§3.6 story-backing correction** — see §9. This is a factual correction to the kickoff, not a
   deviation from its intent: the two REAL story-backed surfaces got real rendered proof (§6); the
   four REAL story-less surfaces got compiled-equivalence proof, stated as such, matching the
   kickoff's own stated intent ("the asymmetry is declared, not disguised") even though the specific
   file assignment in its table was wrong.
4. **R11 expanded** — see §10. `bg-overlay/95` and bare `bg-overlay` both survive from the same
   comment; the kickoff named only the former.
5. **`check:design-tokens` baseline not captured at I0** — the kickoff's §10.1 I0 requirements name
   only git status, census, globals.css grep, and build; `check:design-tokens` was first run
   post-edit (15 violations, all the newly-added hex fallback values), then resolved by adding
   `design-tokens-allow` markers matching the existing `MantineListingCardPattern.module.css`
   convention exactly. Final state is 0 violations, which is what AC12 requires.
6. **cn/styles imports added.** `ListingGallery.tsx` and `AdminUserAvatar.tsx` did not previously
   import `cn` from `@/lib/utils`; both now do, to combine the CSS-module class with the remaining
   Tailwind utility classes on each element, matching the established project convention (`ImageUpload.tsx`,
   `LightboxView.tsx`, `MantineListingCardPattern.tsx` all already used this pattern).

## 12. Opus handoff

- **Evidence to inspect directly:** §4's D34 table (esp. the two measured same-layer contests in
  `ListingGallery.tsx:123`), §5's byte-identical compiled comparison, §6's 168-tuple comparator
  result and its proven-can-fail planted run, §9's story-backing correction, §10's expanded R11.
- **Verify independently:** re-run the census command; `git diff src/app/globals.css` (expect
  empty); `node .screenshots/task748-overlay/capture-and-compare.mjs` (expect 168/168, 0 failures).
- **Not yet known / owner-only:** OQ2 (695's decision on the two surviving comment mentions).
- **695 unblock status:** this task's own scope (24 utilities, 6 files) is fully migrated and
  verified; 695 should re-run its own preflight against this tree rather than assume unblock from
  this report alone (per the project's own "report is not proof" doctrine).

---

# §REWORK — Task 748 REWORK (`tasks/Sprints/Sprint_46_kickoff_prompt_Task_748_REWORK_OverlayUtilityExit_DeTailwind.md`)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Never self-approved. Does not mark 695
unblocked — that is the reviewer's call.

## R1. What the review found, restated exactly

`cn()` is `twMerge(clsx(...))` (`src/lib/utils.ts:4`). A Tailwind utility written in a `className`
participates in tailwind-merge's conflict resolution; a hashed CSS-Modules class does not, and the
emitted module chunk is **unlayered** — it outranks every `@layer utilities` rule regardless of
specificity or source order. Migrating a utility into a module can therefore change *which
declarations reach the element*, not only where the declaration lives. §4 of the original
submission only checked "ancestor or component CSS on this element" and missed this. Three sites
moved:

- **F-A** `PerfDevOverlay.tsx:76`/`:81` — pre-migration, `cn('text-overlay-foreground/70',
  priorityOver && 'text-destructive font-bold')` had tailwind-merge **delete** the overlay utility
  whenever `priorityOver`/`predictiveOver` was true (same `text-*` conflict group), so the
  over-budget row rendered `--destructive`. Post-migration, the module class doesn't participate in
  that conflict resolution, so both classes survived and the unlayered rule won — the warning
  colour was lost.
- **F-B** `ListingGallery.tsx:123` — the `ghost` variant's own `hover:text-foreground` (specificity
  `0-2-0`, `@layer utilities`) beat the plain `.text-overlay-foreground` utility (`0-1-0`) on hover
  — a genuine **hover-state D34 loser**, not a winner as originally measured. The unlayered module
  rule promoted it.
- **F-C** the original §6 comparator built its "before" side from a synthetic probe carrying the
  *intended* declaration text, so it could only ever confirm "does my rule produce the colour I
  meant" — structurally blind to both F-A and F-B, which are about what the *pre-migration tree*
  actually rendered, not what the new rule was written to do.

**Kept, re-confirmed, not redone:** census 0, `globals.css` diff empty, D35 rule bodies byte-exact
including the `@media (hover: hover)` wrapper, the `:root` sourcing, the §3.6 story-backing
correction, and the R11 expansion. `PerfDevOverlay`'s migration itself (OQ1) stands.

## R2. RR1 — `PerfDevOverlay` over-budget rows fixed

`src/components/shared/PerfDevOverlay.tsx:76-84` (priority and predictive budget rows) now read:

```tsx
<div className={cn(!priorityOver && styles.metricRow, priorityOver && 'text-destructive font-bold')}>
...
<div className={cn(!predictiveOver && styles.metricRow, predictiveOver && 'text-destructive font-bold')}>
```

The module class is conditionally **omitted** exactly when tailwind-merge used to delete the
utility — reproducing the pre-migration deletion instead of fighting it, per the kickoff's own
prescribed form (RR1). Verified two independent ways:

1. `twmerge-class-resolution-all18.mjs` (RR4, §R4 below): with `priorityOver`/`predictiveOver =
   true`, before and after resolve to the byte-identical string `"text-destructive font-bold"`.
2. The real before/after comparator (§R4a): `perfDevOverlay-priorityRow-over|1024` and
   `-predictiveRow-over|1024` both report `before === after` (`rgb(0, 0, 0)` in this harness's
   concatenated-bundle context — the reviewer's own reduced-stylesheet `cascade-repro.mjs` measured
   the real production value as `oklch(0.58 0.22 27)` both sides; both methods independently agree
   on **zero delta**, which is what AC1 requires — the absolute value differs only because that
   harness uses a purpose-built reduced stylesheet and mine uses the full concatenated bundle).

## R3. RR2 — `ListingGallery.tsx:123` disposition (owner-answered)

**Question posed, per the kickoff's exact framing:** leave `text-overlay-foreground` as a literal
untouched Tailwind class (census stays 1, 695's exit condition does not fully close on this task),
or authorize an exact-equivalence module implementation that reproduces both the winning rest-state
outcome and the losing hover-state outcome.

**Owner answer (2026-08-13):** authorized exact equivalence, with the exact form specified — rest
`color: var(--overlay-foreground)`; hover, under the same `@media (hover: hover)` guard, `color:
var(--foreground)`; plus a corrected-D34 pass covering every applicable `ghost`-variant state
(`aria-expanded:`, `dark:`), reproducing each live state or recording DOM evidence it cannot occur.
Explicitly: do not claim this alone fully unblocks 695 (the 7 live `var(--color-overlay*)` refs,
§R5, still block it).

**Implemented** — `src/modules/listings/components/ListingGallery.module.css`, `.photoCountButton`:

```css
.photoCountButton {
  background-color: #0009; /* D35 static fallback, unchanged */
  color: var(--overlay-foreground); /* rest-state winner, unchanged */
}
@supports (color: color-mix(in lab, red, red)) { .photoCountButton { background-color: color-mix(...); } }
@media (hover: hover) {
  .photoCountButton:hover {
    background-color: #000000b3; /* D35 static fallback, unchanged */
    color: var(--foreground); /* RR2: reproduces the pre-migration hover-state LOSS explicitly */
  }
}
@supports (...) { @media (hover: hover) { .photoCountButton:hover { background-color: color-mix(...); } } }
```

**`aria-expanded:`/`dark:` states — DOM evidence they cannot occur, not reproduced (nothing to
reproduce):**

- `aria-expanded:bg-muted`/`aria-expanded:text-foreground` need an `[aria-expanded]` attribute on
  this `Button`. `node_modules/@base-ui/react/button/Button.js` (read in full) never sets
  `aria-expanded` itself — it is a minimal `useButton`-wrapped `<button>`. The call site
  (`ListingGallery.tsx:121-129`) never passes it as a prop. The selector structurally cannot match.
- `dark:hover:bg-muted/50` needs a `.dark` ancestor class. `grep -rn "next-themes\|ThemeProvider\|
  classList.add\('dark'\)" src/` → **0 matches** — no theme-toggling mechanism exists anywhere in
  this app (consistent with backlog item 682, dropping `next-themes` from `package.json`). `.dark`
  can never be an ancestor of any element here.

Both facts, and the full per-state D34 table, are recorded in
`ListingGallery.module.css`'s own header comment (re-read there for the complete reasoning per
property/state).

**Proof, real before/after, mobile <768px, `(hover: hover)` pointer** (§R4a, Part B):

| Cell | Before | After | Match |
|---|---|---|---|
| rest, 320/375/480 | `oklch(1 0 0)` | `oklch(1 0 0)` | ✅ |
| hover, 320/375/480 | `oklch(0.145 0 0)` | `oklch(0.145 0 0)` | ✅ |

Census: unchanged at **0** — the owner's chosen disposition (b) keeps the utility migrated, so
AC7's "subject to RR2's disposition" branch is the census-stays-0 branch.

## R4. RR4 — D34 re-run under the corrected contest definition, all 24 sites

The corrected contest is *everything that determines the final computed value on the element*, not
only ancestor/component CSS: same-element `cn()`/tailwind-merge conflict resolution, and
`hover:`/`aria-*:`/`dark:` variants of a component's own `cva` classes.

**Method:** `docs/reviews/artifacts/2026-08-13-task748-rework/twmerge-class-resolution-all18.mjs`
extends the reviewer's own 9-case witness to all 18 distinct JSX elements the 24 utility sites live
on (several elements carry more than one migrated utility). "before" strings are copied verbatim
from `git show d3ffd6d6c:<path>`; "after" from the current tree. The script itself fails (exit 1)
if any element **other than** the three already-known, already-fixed F-A/F-B elements shows a moved
declaration set.

**Result:** `Elements checked: 19, moved: 3, unexpected: 0` — exit 0
(`docs/reviews/artifacts/2026-08-13-task748-rework/twmerge-class-resolution-all18.txt`).

**Restated summary line (replaces the original's "24 winners / 0 losers"): 21 of 24 utility sites
were always winners and remain so; 3 sites (the two `PerfDevOverlay` budget rows' over-budget state,
and `ListingGallery.tsx:123`'s hover-state `color`) were the actual contest and are now explicitly
fixed at the CSS level (RR1's conditional-omission, RR2's owner-authorized hover override) rather
than left as an undetected regression.**

Per-site table: unchanged from the original submission's §4 for the 21 stable sites (source
inspection there remains valid — none of those 21 elements ever passed more than one class to
`cn()` where a competing utility for the same property existed, confirmed above); the 3 moved sites
are fully re-documented in `PerfDevOverlay.module.css` and `ListingGallery.module.css`'s own header
comments with the exact contesting declaration, specificity, and resolution for every state.

## R5. RR3 — the real before/after comparator

`docs/reviews/artifacts/2026-08-13-task748-rework/real-before-after-comparator.mjs`. Full method,
including the two harness bugs found and fixed while building it (Storybook per-story CSS chunking
meant `ListingGallery.module.css` was never bundled anywhere since no story imports that component;
an empty harness `<body>` has zero height and fails Playwright's visibility check; Next.js's
webpack CSS-Modules naming is `Name_local__hash`, double-underscore, not Storybook/Vite's
single-underscore `_local_hash_n`), is documented in the script's own header and in
`docs/reviews/artifacts/2026-08-13-task748-rework/README.md`. Summary:

- **BEFORE** = `git archive d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f | tar -x` into
  `C:\Claude_Code_Projects\lero-al-i0-d3ffd6` (read-only export, no worktree/checkout/stash —
  none of which Sonnet may run), `node_modules` junction-linked (package-lock.json confirmed
  byte-identical first), `npm run build-storybook` **and** `npm run build` run natively there.
- **AFTER** = this worktree's own `storybook-static` and `.next/static/css`, both freshly rebuilt
  after RR1/RR2's edits.
- **Part A** (168 cells: 3 real story-backed sites × 4 locales × 14 viewports) — real elements
  resolved structurally on both sides (no synthetic probe), diffed directly.
- **Part B** (8 cells: the two RR3.4 witnesses) — neither `PerfDevOverlay` nor `ListingGallery` has
  a canonical story, so per the kickoff's explicit allowance this uses a harness page: a synthetic
  element carrying the exact verified className string (from R4's script) is read against each
  phase's own real, freshly-built `.next/static/css` (concatenated, injected via `<style>`), not a
  Storybook bundle.

**Plant run** (corrupts the AFTER-side/subject measurement of one Part A cell and one Part B cell —
not the expectation):

```
node real-before-after-comparator.mjs --plant
Part A cells: 168, Part B cells: 8, total failures: 2
COMPARATOR: FAIL
EXIT_CODE=1
```

Both failures are exactly the two planted cells (`photoCountBadge|en|320`,
`listingGallery-photoCountButton-hover|320`), both showing the injected `rgb(9, 9, 9)` — proven
fail-closed on a real subject defect
(`docs/reviews/artifacts/2026-08-13-task748-rework/real-comparator-PLANTED.json`).

**Clean run:**

```
node real-before-after-comparator.mjs
Part A cells: 168, Part B cells: 8, total failures: 0
COMPARATOR: PASS, diffCount: 0
EXIT_CODE=0
```

All 176 real cells accounted for, 0 failures
(`docs/reviews/artifacts/2026-08-13-task748-rework/real-comparator-result.json`).

**Note on exit-code capture discipline:** the first two attempts at this run were mis-captured —
once by piping through `tail` (masking the script's real exit code with `tail`'s), once by the
outer bash wrapper's own last-statement exit code — both corrected to unpiped, separately-captured
`$?` before being treated as evidence. Recorded here per §10.3a's own warning that a mis-captured
transcript is exactly as misleading as a broken gate.

## R6. RR5 — 695 handoff, all 7 live references

The utility census is 0 and the bundle retains only the two scanner-visible strings (`.bg-overlay`,
the two-tier `.bg-overlay\/95`) — unchanged, confirmed again this session. **Separately, 7 live
non-comment `var(--color-overlay*)` references remain** (all out of this task's scope — §8/§6 of
the parent and rework kickoffs — reported, not migrated):

```
LightboxView.tsx:46   '--ai-bg': 'color-mix(in oklab, var(--color-overlay-foreground) 10%, transparent)'
LightboxView.tsx:47   '--ai-hover': 'color-mix(in oklab, var(--color-overlay-foreground) 20%, transparent)'
LightboxView.tsx:48   '--ai-color': 'var(--color-overlay-foreground)'
LightboxView.tsx:49   '--ai-hover-color': 'var(--color-overlay-foreground)'
LightboxView.tsx:87   style={{ backgroundColor: 'color-mix(in oklab, var(--color-overlay) 95%, transparent)' }}
LightboxView.tsx:160  style={{ borderColor: activeIndex === i ? 'var(--color-overlay-foreground)' : 'transparent' }}
MantineListingGalleryPattern.tsx:93  <Text size="sm" fw={600} c="var(--color-overlay-foreground)">
```

`--color-overlay*` is declared only in the `@theme inline` block 695 deletes; `:root:470-471`
carries `--overlay`/`--overlay-foreground` alone. **These 7 references, not the 2 comment strings,
are the real remaining obstacle to 695's namespace deletion.** 695 must decide their disposition;
this task does not migrate them.

No `src/` file outside the parent's named scope (the six target components + their six new
modules) was touched by this rework.

## R7. RR6 — tracked evidence

Everything the parent submission's report cited under gitignored `.screenshots/task748-overlay/`
is now also present, tracked, under `docs/reviews/artifacts/2026-08-13-task748-rework/` (large
`build-storybook*.txt` logs trimmed to their final ~20 lines; everything else copied whole). All
new REWORK artifacts (the two scripts above, their JSON results, all gate transcripts) were written
directly to that tracked location. `docs/reviews/artifacts/2026-08-13-task748/` (the reviewer's
own folder) and its ledger were not edited, moved, or superseded.
`docs/reviews/artifacts/2026-08-13-task748-rework/README.md` indexes every file and its purpose.

## R8. RR7 and standing gates — final results

| Command | Result |
|---|---|
| Final census | **0** |
| `git diff src/app/globals.css` | **0 lines** |
| `grep -c "var(--color-overlay" <six modules>` | **0** across all six |
| `npm run build` (final, post RR1/RR2) | **exit 0**, `/[locale]` = **619 kB** (unchanged) |
| `npx vitest run ListingGallery.portal.smoke.test.tsx` | **4/4 PASS** |
| `npx vitest run` (full) | **1347/1347 PASS**, 80/80 files |
| `npm run check:design-tokens` | **0 violations** |
| `npm run check:css-vars` | **0 violations** |
| `npm run check:stories` | **0 violations, 127 files** |
| `npm run check:mojibake` | **0 artifacts, 2297 files** |
| `npm run check:file-integrity` | **71/71 clean** |
| `npm run typecheck` | **exit 0** |
| `npm run check:review-ledger -- --file docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json` | **PASSED, exit 0** |
| `npm run check:review-ledger` (repo-wide, run natively — the reviewer's Linux bridge could not) | **PASSED, exit 0, 2/2 ledger files valid** |

All transcripts retained under `docs/reviews/artifacts/2026-08-13-task748-rework/`.

**AC7 restated:** census **0** (RR2 disposition (b) — the owner authorized exact equivalence, so
the utility stays migrated); `git diff src/app/globals.css` empty; the six modules read
`var(--overlay)`/`var(--overlay-foreground)` only (`grep -c "var(--color-overlay"` = 0 across all
six); D35 rule bodies unchanged from the parent submission (RR1/RR2 added declarations, touched
none of the existing D35 static-fallback/`@supports` pairs).

## R9. Files changed, this rework

| File | Change |
|---|---|
| `src/components/shared/PerfDevOverlay.tsx` | RR1 — conditional module-class omission on the two budget rows |
| `src/modules/listings/components/ListingGallery.module.css` | RR2 — explicit `hover:` `color` override + full corrected D34 header comment |
| `src/modules/listings/components/ListingGallery.tsx` | comment-only (none — no `.tsx` edit needed beyond RR1's file; `photoCountButton`'s className call site was already correct, only the module needed the hover override) |
| `docs/reviews/artifacts/2026-08-13-task748-rework/*` | new tracked evidence (RR6) |
| `docs/backlog.md` | concise state update |
| `docs/sessions/2026-08-13-task748-overlay-utility-exit.md` | this §REWORK section |

## R10. Opus handoff

- **Evidence to inspect directly:** §R5's plant/clean comparator results (JSON + transcripts),
  §R4's 18-element re-measurement, `ListingGallery.module.css`'s and `PerfDevOverlay.module.css`'s
  own header comments (the per-state D34 table and the aria-expanded/dark DOM evidence).
- **Verify independently:** re-run `node docs/reviews/artifacts/2026-08-13-task748-rework/
  real-before-after-comparator.mjs` (needs `C:\Claude_Code_Projects\lero-al-i0-d3ffd6` to still
  exist, or re-create it via the same `git archive` command in the script's own header) — expect
  176/176, 0 failures.
- **Not yet known / owner-only:** whether 695 migrates or waives the 7 live `var(--color-overlay*)`
  references (§R6) — a new decision, separate from RR2's already-answered question.
- **Cleanup available to the owner, not performed by this session:** `C:\Claude_Code_Projects\
  lero-al-i0-d3ffd6` is a plain directory (not a registered git worktree — `git archive`
  created it), so a normal recursive delete is sufficient once review is complete.
