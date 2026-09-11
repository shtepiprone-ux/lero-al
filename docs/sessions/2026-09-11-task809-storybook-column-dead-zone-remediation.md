# Task 809 — Storybook column dead-zone remediation (2026-09-11)

`NEEDS REVISION`, owner rejection 2026-09-11, reproduced in the canonical Storybook story
`Mantine/Primitives/FavoritesShell → Populated` (GB English, 900px canvas height): the grid dropped
from 2 columns to 1 between 639px and 640px viewport width, then back to 2 by 663-664px — a
breakpoint dead zone, not a valid responsive transition. Owner explicitly rejected "green sweep"
as evidence (the sweep never asserted column-count monotonicity across this transition) and required
the root cause be found and fixed in the correct layer, not a local hack in `FavoritesShell.tsx`.

This is a **Sonnet executor** evidence report, not a review. No self-approval.

## 1. Root cause — measured, not assumed

Live Playwright capture against the canonical story (`iframe.html?id=mantine-primitives-favoritesshell--populated&viewMode=story`), 639/640/663/664px, `--listing-card-min: 17.5rem` (280px, `globals.css:393`), `MantineListingCardTrack`'s `.grid` gap `16px` (`--mantine-spacing-md`):

| viewport | grid content-box width | column count | first-card width |
|---|---|---|---|
| 639px | 607px | **2** | 295.5px |
| 640px | 558px | **1** | 558px |
| 663px | 581px | **2** | 282.5px |
| 664px | 582px | **2** | 283px |

`FavoritesShell.tsx` itself is not in the ancestor chain that produces this — the canonical story wraps it in `src/stories/mantine/_MantineStoryShell.tsx`, not `FavoritesShell`'s own real page wrapper (`.container-wide`, `page.tsx:83`). Traced the parent chain's computed `padding-left`/`padding-right`/`border` at each width. `_MantineStoryShell.tsx` nests two `Box` components, both keyed to Mantine's `sm` breakpoint (`640px`, `theme.ts:323`):

- outer `Box` (`px={{ base: 0, sm: 'md', md: 'xl' }}`) — the documented §6m page-gutter ladder.
- inner `Box` (`bg`/`bd`/`bdrs`/`px`/`py`, all `{ base: ..., sm: ... }`) — the "become a white bordered card" showcase chrome.

Both stepped **at the identical breakpoint**. Below 640: outer=0, inner=16px (`'md'`) each side, total 32px — matches the measured 639px content width (639-32=607). At 640: outer jumps to 16px (`'md'`), inner jumps to 24px (`'xl'`) **and** gains a 1px border — total 82px each measurement axis combined, content width 640-82=558. `MantineListingCardTrack`'s `.grid` (`repeat(auto-fill, minmax(280px,1fr))`, gap 16px) needs `content >= 576px` for 2 columns; 607px has 31px of slack, 558px is 18px short — hence the drop. By 664px the viewport regrew enough (582px content) to clear 576px again.

`MantineListingCardTrack.module.css`'s `.grid` rule is untouched — Task 810's own freeze (D74-1/AC9) held. The defect is entirely upstream, in the story harness.

## 2. Fix — `src/stories/mantine/_MantineStoryShell.tsx`

Deferred the inner Box's `bg`/`bd`/`bdrs`/`px`/`py` step from `sm` (640px) to `md` (768px), leaving the outer Box's own `sm` step untouched. This means only ONE padding step (32px combined) lands at 640px instead of two compounding ones (82px), and the larger combined step (all four properties together) now lands at 768px, where the track has ~94px of slack before its next column threshold (3 columns needs 872px; measured content at 768px is 670px).

All values stay Mantine breakpoint keys (`base`/`md`) and spacing/color tokens (`'md'`, `'xl'`, `'white'`, `'2xl'`) — zero raw px/hex added. Confirmed by `check:design-tokens --strict --scope=mantine`: 0 violations.

This changes the STORY-HARNESS-ONLY chrome for every `Mantine/Primitives/*` story using `width="full"` (the file's own header comment: "story-harness layer ONLY, does not change any product surface") — the white-card-border-radius moment shifts from 640px to 768px for all of them, not just `FavoritesShell`. Flagged here explicitly; not silently absorbed.

## 3. Evidence — live re-measurement, swept range

Post-fix, same probe, widened to `[600, 620, 639, 640, 650, 663, 664, 700, 750, 767, 768, 769, 800, 900]`:

```
width  contentBoxWidth  columnCount  firstCardWidth
600    568              1            568
620    588              2            286
639    607              2            295.5
640    576              2            280
650    586              2            285
663    599              2            291.5
664    600              2            292
700    636              2            310
750    686              2            335
767    703              2            343.5
768    670              2            327
769    671              2            327.5
800    702              2            343
900    802              2            393
```

`MONOTONIC: PASS` across the full swept range. 640px now lands at exactly 576px content (zero slack, but a real, spec-valid fit — `2*280+16=576`, confirmed rendered, `firstCardWidth: 280` = exactly `--listing-card-min`, not a rounding artifact).

## 4. Two-armed proof

Reverted `_MantineStoryShell.tsx`'s inner Box to its pre-fix `sm`-keyed values (file edit, not `git stash` — mutating git is owner-only per `CLAUDE.md`), re-ran the probe: **exit 1**, `storybook column monotonicity: width=640 columnCount=1 < previous 2 — viewport grew but column count dropped (the exact dead-zone regression this check exists to catch)`. Restored the fix, re-ran: exit 0, `hardFailReasons: []`.

## 5. Permanent regression coverage

Extended `scripts/task809-favorites-parity-probe.mjs` (already scoped to this task) with `measureStorybookColumnMonotonicity` — loads the canonical `FavoritesShell → Populated` story directly (not the live route, since the defect is a `MantineStoryShell` harness issue invisible to the existing `measureFavoritesVsListings`, which only measures the production route's `.container-wide` gutter — a smaller, 16px step that does not cross the 2-column threshold, confirmed non-breaking by the same math), sweeps 14 widths spanning 600-900px, and hard-fails if column count ever decreases as width increases. Wired into `main()`'s existing run sequence and output payload (`result.storybookColumnMonotonicity`).

## 6. Validation run

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0, no output |
| `npm run build` | exit 0, all 40 routes generated, `/[locale]/favorites` 7.28 kB / 557 kB |
| `npx eslint src/stories/mantine/_MantineStoryShell.tsx` | 0 errors |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations, 0 stale markers, 0 missing-reason errors |
| `npm run check:stories` | 144 files checked, 0 violations |

**Not run** (scoped out of this remediation — this is a targeted fix for one reported defect, not a re-run of Task 809's full Q3 profile): `check:story-coverage`, `npx vitest run`, `npm run test`, `npm run build-storybook`, `check:file-integrity`, `check:mojibake`, the live-route `measureFavoritesVsListings`/`measureRecentlyViewedSkeleton`/`measureFilteredEmptyAction` arms of `task809-favorites-parity-probe.mjs` (require a running `npm run build && npm run start` plus a seeded authenticated storage state, neither available in this session). None of these gates touches `_MantineStoryShell.tsx`'s padding props or the grid column math, so none was expected to be affected, but that is stated, not verified.

## 7. Files changed

| File | Reason |
|---|---|
| `src/stories/mantine/_MantineStoryShell.tsx` | Root-cause fix: defer inner Box's `sm`-keyed chrome to `md`, eliminating the compounding double breakpoint step. |
| `scripts/task809-favorites-parity-probe.mjs` | Added `measureStorybookColumnMonotonicity` — permanent regression coverage for this exact defect. |

`FavoritesShell.tsx` is untouched, per the owner's explicit instruction not to patch it locally.

## 8. Backlog

`docs/backlog.md` is at exactly 80 lines (`wc -l`) — the file's own stated budget. **BACKLOG LIMIT BREACH**: did not add a row/note for this remediation to avoid exceeding it. Flagging for Opus consolidation rather than silently growing the file.

## 9. Status

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` for the specific defect reported (Storybook column dead zone at 639-664px). The broader Q3 profile re-run, `check:story-coverage`, and the live-route probe arms are outstanding and named above — not hidden inside a green summary.

## 10. Opus handoff — questions for review

1. Is deferring `_MantineStoryShell.tsx`'s inner-Box "white card" chrome from `sm`(640px) to `md`(768px) acceptable, given it is a purely cosmetic timing shift for the story-harness chrome shared by every `Mantine/Primitives/*` story using `width="full"` (not a product surface)? The file's own header comment already frames this shell as freely adjustable staging chrome.
2. Is a zero-slack fit at exactly 640px (576px content vs. 576px required) acceptable as "monotonic," or does the owner want positive margin engineered in (which would require either shrinking `--listing-card-min` or the outer Box's own `sm` gutter step — both load-bearing, site-wide contracts, out of this remediation's scope)?
3. Should `measureStorybookColumnMonotonicity`'s width set (600-900px) be widened to cover the `xs2`(480px)/`lg`(1024px)/`xl`(1280px) rung boundaries too, given the same class of defect could recur at any Mantine breakpoint where two independent ancestors step together?

---

## 11. Revision 6 — narrowed to `px`+`bd`, executed 2026-09-11

Owner classification (kickoff §80, quoted verbatim): the deferral approach above is correct in layer and
method, not a defect — but the kickoff/review that requested it never named which properties are
load-bearing for the width constraint, so deferring the whole `bg`/`bd`/`bdrs`/`px`/`py` block as one
Mantine-native unit (§2 above) was wider than the constraint required. Revision 6 (R45-R48) is the named
narrowing plus the one gate the original remediation did not run.

### 11.1 R45 — narrowed `_MantineStoryShell.tsx`

Inner Box's `px` (16px→24px, both sides) and `bd` (`none`→`1px solid`, both sides) stay deferred to `md`
(768px) — these are the only two properties that consume horizontal width. `bg`, `bdrs` and `py` return to
`sm` (640px), their pre-remediation keying — none of the three affects the grid's column math. The file's
header comment states this split and the reason (kickoff §81's table, reproduced in-file).

Geometry is unchanged by construction (kickoff §81): at 640px, outer Box `'md'` gutter (32px combined) +
inner Box `px` still at its base `'md'` value (unchanged until 768, 32px combined) + `bd` still `none`
(0px) = 64px consumed, 640−64=576px content — identical to the pre-refinement measurement. At 768px:
outer `'xl'` (48px) + inner `px` jumps to `'xl'` (48px) + `bd` jumps to `1px solid` (2px) = 98px consumed,
768−98=670px content — also identical. Re-verified live below (§11.2), not just by hand-derivation.

### 11.2 R46/AC42 — build-storybook and the reproduced 14-width table

`npm run build-storybook` was not run on the original remediation (its own §6 named this gap). Run here,
native PowerShell, exit 0 (evidence: `docs/sessions/evidence/task809/rev6/build-storybook.txt`).

`measureStorybookColumnMonotonicity`'s logic was re-run against the rebuilt `storybook-static/` (served
locally on `http://localhost:6007`, a plain Node `http` server, no new dependency) via a transient,
non-committed evidence script (`scripts/task809-rev6-monotonicity-probe.mjs`, deleted after this run —
not part of Revision 6's scope, which names only `_MantineStoryShell.tsx` and the two comment edits).
Native PowerShell throughout; transcript at `docs/sessions/evidence/task809/rev6/monotonicity-probe.txt`.

```
width  contentBoxWidth  columnCount  firstCardWidth
600    568              1            568
620    588              2            286
639    607              2            295.5
640    576              2            280
650    586              2            285
663    599              2            291.5
664    600              2            292
700    636              2            310
750    686              2            335
767    703              2            343.5
768    670              2            327
769    671              2            327.5
800    702              2            343
900    802              2            393
MONOTONIC: PASS
```

Cell-for-cell identical to §3's pre-refinement table. `640px → 576px content` and `768px → 670px content`
both reproduce exactly, confirming the narrowed fix preserves the same geometry AC42 requires.

### 11.3 R47 — `.grid` rule comment

`src/design-system/mantine/patterns/MantineListingCardTrack.module.css`'s `.grid` rule now carries a
comment stating the zero-margin two-column fit at `sm` (576px required = 576px available) and naming the
three inputs that would reopen the dead zone if changed: `--listing-card-min`, the grid `gap`
(`--mantine-spacing-md`), or any ancestor's horizontal padding/border at or below `sm` (the story shell's
outer `Box`, or `/favorites`' own `.container-wide` page gutter).

### 11.4 R48 — probe-hash correction

`docs/sessions/2026-09-10-task809-favorites-and-the-last-two-tailwind-card-surfaces.md` §9's probe-hash
sentence now states `d1ff42c882…` is the Revision 0 value (current for that file's own runs only) and
that the script's blob hash changed to `760a07885fd9bf0059ff695118dd0c63c28a774d` after the 2026-09-11
extension — re-verified live via `git hash-object scripts/task809-favorites-parity-probe.mjs`.

### 11.5 Validation run — Revision 6, Q2 profile

| Command | Result | Transcript |
|---|---|---|
| `node -p process.platform` | `win32` | `rev6/platform.txt` |
| `node --version` | `v22.22.3` | `rev6/node-version.txt` |
| `npm run typecheck` | exit 0 | `rev6/typecheck.txt` |
| `npx eslint src/stories/mantine/_MantineStoryShell.tsx` | exit 0, 0 errors | `rev6/eslint.txt` |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations, 0 stale markers, 0 missing-reason errors | `rev6/design-tokens.txt` |
| `npm run check:stories` | 144 files checked, 0 violations | `rev6/check-stories.txt` |
| `npm run build-storybook` | exit 0 | `rev6/build-storybook.txt` |

**Not re-run** (§85 does not require them — R45 changes no product geometry, only which properties carry
the existing deferral, and the full Q3 profile was already closed on earlier revisions): `npm run test`,
`npm run build`, `check:story-coverage`, `check:file-integrity`, `check:mojibake`, the live-route
`measureFavoritesVsListings`/`measureRecentlyViewedSkeleton`/`measureFilteredEmptyAction` arms (still
require `npm run build && npm run start` plus a seeded authenticated storage state, neither available in
this session — the same limitation named in §6 above).

### 11.6 `OWNER VISUAL QA REQUIRED` — Revision 6

Per kickoff §85: any `Mantine/Primitives/*` story using `width="full"`, default state, en locale, 700px
viewport — confirm the white bordered card with `2xl` radius is present again at 700px (it was, correctly,
absent between 640-767px under the pre-refinement deferral of `bg`/`bdrs`; the narrowed fix returns it to
`sm`, so it should reappear from 640px on, not 768px). Not run in this session — requires the owner's own
browser per the standing `screenshots:assert` retirement rule; named here as the exact tuple, not silently
skipped.

### 11.7 Files changed — Revision 6

| File | Reason |
|---|---|
| `src/stories/mantine/_MantineStoryShell.tsx` | R45 — narrow the `md` deferral to `px`+`bd` only; `bg`/`bdrs`/`py` return to `sm`; header comment updated. |
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | R47 — comment on `.grid` naming the zero-margin fit and its three reopening inputs. |
| `docs/sessions/2026-09-10-task809-favorites-and-the-last-two-tailwind-card-surfaces.md` | R48 — probe-hash sentence corrected. |
| `docs/sessions/2026-09-11-task809-storybook-column-dead-zone-remediation.md` | This section. |

### 11.8 Status — Revision 6

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. R45-R48 all evidenced above. The owner-visual tuple (§11.6)
is outstanding and named, not hidden inside a green summary — same standing limitation as every prior
revision's owner-visual rows.
