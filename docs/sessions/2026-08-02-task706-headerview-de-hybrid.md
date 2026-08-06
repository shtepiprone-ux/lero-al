# Task 706 — `HeaderView` de-hybrid: Mantine + colocated CSS module, zero rendered delta, 28 → 23 tokens

**Task path:** `tasks/Sprints/Sprint_47_kickoff_prompt_Task_706_HeaderView_DeHybrid.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Branch:** `task/q0-ci-rendered-locale-split`

---

## 1. Requirement ledger and current-vs-required behavior (restated before implementation)

**Current behavior to preserve:** `HeaderView` (`src/components/layout/HeaderView.tsx`, 190 lines pre-edit) was a
Mantine/Tailwind hybrid at the class level only (Task 629 already converted every raw HTML text/link node to a
Mantine `Anchor`/`Text`/`Group` primitive carrying `unstyled`) — 11 verbatim Tailwind utility `className=` sites
supplied 100% of the visual styling, five of them `min-[390px]` arbitrary-value utilities. Client component
(`'use client'`), `NavLinks` declared at module level (Task 599/601 hydration-safety requirement), enrolled in
`scripts/mantine-migration-scope.json` and the P0 critical flow *Authenticated header hydration — NotificationBell
SSR shell* (`docs/critical-flow-registry.md` row 33). Three live `.site-header` consumers
(`scripts/check-header-id-parity.mjs:147`, `src/design-system/mantine/MantineRootProvider.tsx:34`,
`scripts/task612-qa-listinggallery-lightbox-portal.mjs:57`) and the Task 684 D3 97/97/65/65 header-height invariant
at 320/375/390/1024.

**Required after behavior:** identical rendered output at every enrolled cell (16 = 4 `MANTINE_VIEWPORTS` × 4
locales); zero Tailwind utility classes; every `unstyled` prop preserved unchanged; every visual value in a new
colocated `HeaderView.module.css` (consuming `globals.css` variables, never hex) or a genuine Mantine style prop;
the five `min-[390px]` utilities reproduced as a module `@media (min-width: 390px)` rule; `site-header` and
`container-wide` survive byte-identically; `check:design-tokens` at **23** (28 − 5, no new entry for either touched
file); the 97/65 height invariant and `test:header-hydration-id-parity` both green; `npm run build` exits 0.

Selected QA profile: **Q4 Release/Critical Flow** (kickoff §13 — registry row 33 targets this exact component,
ruling out the Q3 that 673/FooterView used).

---

## 2. Requirement IDs completed

| ID | Requirement | AC | Verdict |
|---|---|---|---|
| R1 | Zero Tailwind utility classes | AC1 | ✅ Confirmed — §5 |
| R2 | Every `unstyled` prop preserved, no primitive added/lost, tag names unchanged | AC2 | ✅ Confirmed — §6 |
| R3 | New `HeaderView.module.css`, vars not hex, `:hover` + `@supports` block, header comment | AC3 | ✅ Confirmed — §3.1 |
| R4 | All 16 enrolled cells keep pre-task PNG md5 + verdict | AC4 | ✅ Confirmed — §4 |
| R5 | `site-header`/`container-wide` survive byte-identically + `aria-haspopup` count | AC5 | ✅ Confirmed — §6 |
| R6 | `check:design-tokens` = 23, no entry for either touched file | AC6 | ✅ Confirmed — §7 |
| R7 | Module introduces no `@media` breakpoint other than `min-width: 390px` | AC7 | ✅ Confirmed — §7 |
| R8 | 97/97/65/65 height invariant at 320/375/390/1024 | AC8 | ✅ Confirmed — §4, §6 |
| R9 | `test:header-hydration-id-parity` passes, `'use client'` + module-level `NavLinks` preserved | AC9 | ✅ Confirmed — §7 |
| R10 | `npm run build` exits 0 | AC10 | ✅ Confirmed — §8 |
| R11 | Two-armed plant proves the comparator can fail | AC11 | ✅ Confirmed — §5 |
| R12 | Touched files UTF-8, no BOM, no mojibake | AC12 | ✅ Confirmed — §7 |

---

## 3. Files Changed

`git status --porcelain` at session start (before any write): **empty** — HEAD was `8207b663b` (one docs-only commit
on top of Task 673's `135e864e7`), which already matches the kickoff's §3.8 "clean at `135e864e7`" expectation one
commit later.

| Path | Change | Reason |
|---|---|---|
| `src/components/layout/HeaderView.tsx` | Modified (27 insertions, 19 deletions, `git diff --stat`) | Removed all 11 raw Tailwind `className=` sites (9 now hold `className=` — 2 fewer than 11, since the Menu icon's `h-5 w-5` became a `size={20}` prop, not a class); `site-header`/`container-wide` preserved via `cn('site-header', styles.header)` / `cn('container-wide', styles.bar)`; updated two stale block comments that referenced the removed `min-[390px]:` Tailwind syntax |
| `src/components/layout/HeaderView.module.css` | **New**, 128 lines | Colocated module holding every reproduced visual value (colours via `var(--*)`/`color-mix(...)`, lengths as measured literals), the `@supports (backdrop-filter: blur(0px))` conditional background, the `:hover` rule, and two `@media (min-width: 390px)` blocks (`.bar`, `.rightCluster`) reproducing the five prior `min-[390px]` utilities |

**Zero changes** to `src/components/layout/Header.tsx`, `src/stories/mantine/primitives/HeaderView.stories.tsx`,
`scripts/mantine-migration-scope.json`, `src/design-system/mantine/theme.ts`,
`src/design-system/mantine/MantineRootProvider.tsx`, `src/app/globals.css`, `FooterView.tsx`/`.module.css` (Task
673's scope) — confirmed via `git status --short` on each named path (empty output).

Two temporary Storybook builds used only for local iteration (`storybook-static-706/`, plus several `_tmp_*.mjs`
probe scripts copied into the project root so Node's ESM resolver could find `playwright`/`chromium` in
`node_modules`) were deleted before this report; none appears in the final `git status`.

---

## 4. I1/I2/AC4/AC8 evidence — commands, actual results

**I1 — pre-edit baseline (mandatory: captured BEFORE any edit).** `git status --porcelain` was empty and
`check:design-tokens --strict` read **28** (5 attributed to `HeaderView.tsx`, all `min-[390px]`) before the first
write. `npm run test:header-hydration-id-parity` passed 3/3 pre-edit.

The **official** `npm run screenshots:assert -- --mantine-only` invocation was run pre-edit against the
already-built `storybook-static/` (built from the same committed HEAD, confirmed no source drift):
`.screenshots/rendered-assert/2026-08-02T07-05/` — **1184 total, 1162 pass, 0 fail, 22 ambiguous** (all four in
`Combobox/Default`, twelve in `PopularLocationsView/Long City Name`, two in `Tabs/Default` — none touch
`HeaderView`), `manifest.json` present. `HeaderView/Default`'s 16 rows: all `verdict: "pass"`.

**I2 — live `getComputedStyle` capture** (Playwright chromium against the pre-edit `storybook-static/`, `en`
locale, widths **320/375/389/390/1024** plus a `.site-header` height check). Confirmed values used verbatim in the
module: `position:sticky`, `z-index:30`, `border-bottom:1px solid var(--border)`, `background-color` = 95%
`color-mix` fallback overridden by 60% under `@supports(backdrop-filter)` (Chromium supports it, so the 60% value
is what renders — matched against the built Tailwind CSS's own compiled `.bg-background\/95`/`.supports-\[backdrop-filter\]\:bg-background\/60` rules, not computed by hand), `backdrop-filter:blur(8px)` (unconditional in the
compiled output — the `@supports` gate only governs the background colour, not the blur itself), `.bar`
`display:flex`/`gap:8px`/`padding:8px 0` below 390px flipping at exactly 390px to `flex-wrap:nowrap`/`height:64px`/
`padding-block:0`, `.logo` `gap:4px`/`font-weight:700`/`font-size:20px`, `.navLink` `font-size:14px`/
`font-weight:500`/`color` = 80%-opacity `--foreground` with the full `transition-colors` triple, hover colour =
solid `--foreground` (no opacity), `.desktopNav` `gap:24px`, `.rightCluster` `width:100%`/`justify-content:
space-between` below 390px flipping to `width:auto`/`justify-content:flex-start` at/above 390px, `.userMenuSlot`
`gap:8px` (measured on the story's authenticated fixture), and `.site-header` height **97px @320/375, 65px
@390/1024** — matching Task 684's D3 invariant exactly, confirming the boundary lands at 390 (389px still reads
97px). Full JSON persisted at the session's scratch evidence path (see §9).

**§5.2 lucide-icon measurement:** the hamburger `<Menu className="h-5 w-5">` had SVG `width`/`height` **attributes**
of `24` (lucide's own default) overridden by the `h-5 w-5` **CSS** class to a computed `20px` box. `size={20}`
(lucide's own prop) writes `width="20" height="20"` directly as SVG attributes, which — verified in the rebuilt,
migrated story — produces the **identical** `20px` computed box with no competing CSS class needed. Decision:
**use the `size` prop** (§3.7 "prop before module").

**Migration applied.** A lightweight direct-capture harness (same story id, same `MANTINE_VIEWPORTS`/`LOCALES`, a
purpose-built static file server + Playwright chromium against `npm run build-storybook` output, same mechanism as
`scripts/check-stories-rendered.mjs`) was used to iterate quickly without paying the ~30-minute cost of the full
71-story sweep per attempt — the pattern Task 673 also used. **First iteration surfaced a real 2px height
regression** at <390px widths (97px → 99px): the module's `.logo` and `.navLink` classes set `font-size` but not
`line-height`, and Tailwind's `text-xl`/`text-sm` utilities bundle a specific line-height
(`.text-xl{font-size:1.25rem;line-height:var(--tw-leading,1.75rem)}`, `.text-sm{font-size:.875rem;
line-height:var(--tw-leading,1.25rem)}` — confirmed against the built Tailwind CSS, not assumed). Added
`line-height: 1.75rem` to `.logo` and `line-height: 1.25rem` to `.navLink`; the direct-capture re-run then matched
the pre-edit baseline exactly on all 16 cells (see below). This is the same failure class `FooterView.module.css`
(§53–55, `.brandLink`) already documented for its own `text-xl` site — recorded here because `HeaderView`'s
kickoff §3.2/§9 did not carry the line-height value forward from that precedent, and I2 (which measured only
`fontSize`/`fontWeight` for `.logo`/`.navLink`, not `lineHeight`) did not catch it either; the row-height delta at
<390px width did.

**Direct-capture corroboration (16 cells, `en`/`sq`/`uk`/`it` × `mobile-320`/`375`/`390`/`desktop-1024`):**
pre-edit-vs-migrated md5s **identical on all 16 cells** after the line-height fix; `.site-header` height read
**97/97/65/65** at every locale.

**Official post-change sweep** (the standing harness, all 71 enrolled Mantine stories, run against the final
migrated code after `npm run build-storybook` rebuilt `storybook-static/`):
`.screenshots/rendered-assert/2026-08-02T07-37/` — **1184 total, 1162 pass, 0 fail, 22 ambiguous**, the exact same
22 cells (none touching `HeaderView`) as the pre-edit run. `HeaderView/Default`'s 16 rows: all `verdict: "pass"`.
**Direct md5 comparison of the 16 `HeaderView/Default` PNG files between the two official run directories: 0/16
differ** (script output reproduced in §9). AC4 rests on this single official invocation completing twice
(pre-edit and post-edit), not on the direct-capture proxy alone — the proxy served only to iterate the line-height
fix without paying the full-sweep cost each time.

**AC8 — height invariant, pre and post, both official-adjacent captures:**

| Width | Pre-edit (I1) | Post-edit (final) |
|---|---|---|
| 320 | 97px | 97px |
| 375 | 97px | 97px |
| 390 | 65px | 65px |
| 1024 | 65px | 65px |

Matches Task 684's D3 97/97/65/65 invariant exactly, at every locale checked (sq/en/uk/it).

---

## 5. AC1/AC11 evidence

**AC1.** `grep -c 'className=' src/components/layout/HeaderView.tsx` → **10 lines**
(`:36, :45, :91, :114, :116, :117, :118, :124, :132, :156`), every value either `styles.*` or
`cn('site-header'|'container-wide', styles.*)`. **Zero** raw Tailwind utility on any line.

*(Corrected at review 2026-08-02: this paragraph originally reported "9 lines" and then argued that the 10 numbered
matches collapse to 9 because two share `styles.navLink`. That reasoning is wrong — `grep -c` counts lines, and two
lines carrying the same class value are two matches. The live count is **10**: 11 pre-edit sites minus the Menu icon
(§3.2 site #11), which moved from a `className` to a `size={20}` prop. AC1's verdict is unaffected.)*

**AC11 — two-armed plant, target: `.bar`'s `gap` (site #4).**

- *Pre-plant census (mandatory first):* `grep -n "gap" src/components/layout/HeaderView.tsx` → two hits, both
  inside **prose comments** (`:106,:130`), zero literal `gap-*` Tailwind class. `grep -n "style=" 
  src/components/layout/HeaderView.tsx` → **zero** matches (no inline style that could freeze the cascade).
  `grep -n "gap" src/components/layout/HeaderView.module.css` → five declarations, each on a distinct class
  (`.bar`, `.logo`, `.desktopNav`, `.rightCluster`, `.userMenuSlot`) — `.bar`'s `gap` is declared **exactly once**.
  Mantine's own compiled CSS is fully stripped by `unstyled` on this `Group`, so no Mantine leak is possible.
  **No other lifeline exists that could mask the plant.**
- *Arm A (must FAIL — and did):* `.bar`'s `gap` changed from `0.5rem` to `2rem` (marked `TASK706-AC11-PLANT` in the
  module), `storybook-static-706/` rebuilt, 16 cells re-captured. **9 of 16 cells' md5 changed**
  (`sq`/`en`/`uk`×`mobile-320`/`mobile-375`/`mobile-390` = 9; `it`'s narrower nav-link text meant its already-larger
  `justify-content: space-between` free space already exceeded the planted 32px gap floor at those same three
  cells, so those three plus all four `desktop-1024` cells were unaffected — `justify-content: space-between`'s own
  distributed spacing already exceeds a `gap` this small once free horizontal space is large, which is why
  `desktop-1024` is invariant to this specific plant at any locale). A live `getComputedStyle` check on the planted
  build confirmed `.bar`'s computed `gap: 32px` (vs the 8px baseline). **The comparator demonstrably fails** — at
  least one cell changed (9 did) and the computed-style equality broke.
- *Arm B (must PASS — and did):* the plant reverted exactly (`gap: 0.5rem`, confirmed via `grep -n
  "TASK706-AC11-PLANT"` returning **zero** matches in either touched file), `storybook-static-706/` rebuilt again,
  16 cells re-captured. **0/16 cells differ** vs both the migrated-clean capture and the original I1 direct-capture
  baseline.

The comparator is proven capable of both failing (Arm A, 9/16 cells + a direct computed-style break) and passing
(Arm B, 0/16) on the exact mechanism used for the real evidence.

---

## 6. AC2/AC5/AC8 DOM witness (live, post-migration, against the final `storybook-static/`)

Captured at `en` locale, 1024px, against the rebuilt final build:

```json
{
  "headerCount": 2,
  "headerTag": "HEADER",
  "headerClassHasSiteHeader": true,
  "barTag": "DIV",
  "barClassHasContainerWide": true,
  "ariaHaspopupCountWholeDoc": 3,
  "ariaHaspopupCountUnderSiteHeader": 3,
  "hamburgerAriaLabel": "Open menu",
  "hamburgerMinHeight": "44px",
  "hamburgerMinWidth": "44px",
  "hamburgerHiddenAtMd": "none",
  "navAnchorTags": ["A", "A", "A"],
  "navAnchorCount": 3
}
```

Confirms: `<header>` tag preserved, `site-header` class present verbatim; the row `<div>` carries `container-wide`
verbatim; `document.querySelectorAll('.site-header [aria-haspopup="menu"]')` returns **3** (LocaleSwitcher's own
trigger in each of the guest + authenticated stacked fixtures, plus UserMenu's trigger in the authenticated
fixture only) — **this count is structurally owned by `LocaleSwitcher`/`UserMenu`, neither of which this task
touches**, so it cannot have changed by construction; no separate pre-edit re-measurement was taken for this
specific selector (documented here as a reasoned equivalence, not a fabricated re-measurement — flagged in §8).
Hamburger keeps `aria-label="Open menu"` (`tc('aria_open_menu')`), `mih`/`miw="2.75rem"` (44px), and
`hiddenFrom="md"` (display:none at 1024). All 3 anchors in the guest header stay `<a>` tags (logo + 2 `NavLinks`).

---

## 7. Other commands run and actual results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors** (run twice: immediately post-migration and again after the Arm A/B round-trip landed back on the final state) |
| `npm run check:design-tokens` (pre-edit) | **28** total, 5 attributed to `HeaderView.tsx` (all `min-[390px]`) |
| `npm run check:design-tokens` (post-edit, final) | **23** total, **no** entry for `HeaderView.tsx` or `HeaderView.module.css` (AC6). First post-edit run briefly read **25** because the module's own header-comment prose reproduced the literal `min-[390px]` bracket substring, which the scanner's regex matches even inside a CSS comment — rewritten to avoid the literal bracket syntax; re-run confirmed 23 |
| `grep -n "@media" src/components/layout/HeaderView.module.css` | Two rules, both `@media (min-width: 390px)` — the same single breakpoint, no other value present (AC7) |
| `npm run test:header-hydration-id-parity` (pre-edit) | **3/3 passed** |
| `npm run test:header-hydration-id-parity` (post-edit, final) | **3/3 passed** |
| `npm run check:file-integrity` | **PASSED** — 365 file(s) clean (NUL/BOM/JSON/truncation) |
| `npm run check:mojibake` | **0 artifacts** in 2040 scanned files |
| `git status --short -- src/stories/.../HeaderView.stories.tsx src/components/layout/Header.tsx scripts/mantine-migration-scope.json src/design-system/mantine/theme.ts src/design-system/mantine/MantineRootProvider.tsx src/app/globals.css` | empty — confirmed zero drift on every out-of-scope file |

---

## 8. Final production build (hard gate)

```
npm run build
✓ Compiled successfully in 86s
✓ Generating static pages (40/40)
BUILD EXIT CODE: 0
```

Full transcript captured; `/[locale]` route unchanged at 618 kB First Load JS (pre-existing, not introduced by this
task — same figure Task 673 recorded, flagged historically in `docs/backlog.md`'s 691 precondition note).

---

## 9. Evidence locations

- **Official manifests (local-only, D6, not in `git status`):**
  `.screenshots/rendered-assert/2026-08-02T07-05/` (official pre-edit sweep — 1184 cells, `manifest.json`, 16
  `HeaderView/Default` rows all `pass`), `.screenshots/rendered-assert/2026-08-02T07-37/` (official post-edit
  sweep — same totals, same 16 rows `pass`, PNG-md5-identical to the pre-edit run on direct comparison).
- **Direct-capture corroboration + I2/AC11 evidence:** ephemeral scratch scripts and their JSON/PNG output lived
  under the session's scratchpad directory
  (`8ff3741e-2d52-4af7-abda-370c88608cc0/scratchpad/task706-*`) and were not committed; the numeric findings
  (md5 tables, computed-style values, height invariant) are transcribed in full in §4–§6 above. Temporary
  `_tmp_*.mjs` probe copies and the `storybook-static-706/` scratch build (needed only so Node's ESM resolver
  could find `playwright` and so a Storybook rebuild wouldn't race the official sweep reading the real
  `storybook-static/`) were deleted before this report; `git status` confirms none remain.
- **No open owner decision.** D28/D29/D30 close all three per the kickoff.

---

## 10. Implementation validation notes — defects found and fixed

1. **Missing `line-height` on `.logo`/`.navLink`** (§4) — Tailwind's `text-xl`/`text-sm` utilities bundle a
   line-height the module didn't reproduce, causing a real 2px `.site-header` height regression at <390px widths.
   Caught by the direct-capture md5/height diff before the official sweep ran, not by I2 (which didn't measure
   `lineHeight`) — fixed by adding the two measured line-height values, confirmed by re-capture showing 0/16 cells
   differing afterward.
2. **False-positive `check:design-tokens` finding from a CSS comment** (§7) — the module's own header-comment
   prose literally contained the bracket substring `min-[390px]` while describing what was reproduced; the
   scanner's regex matches this inside comments too. Rewritten to describe the same fact without the literal
   bracket syntax; re-run confirmed the scanner returns to the expected 23.

No remaining defects.

---

## 11. Assumptions, deviations, limitations

- **AC5's `aria-haspopup` count comparison** (§6) used a reasoned-equivalence argument (the selector's owners,
  `LocaleSwitcher`/`UserMenu`, are untouched by this task, so the count cannot have changed) rather than a literal
  pre-edit vs. post-edit re-measurement of that exact query — flagged explicitly rather than silently assumed.
- **AC4's evidentiary basis** is the two full official `npm run screenshots:assert -- --mantine-only` invocations
  (pre-edit and post-edit) compared by direct PNG-md5 diff, both completing with `manifest.json` present and 0
  FAIL. The lightweight direct-capture harness (same story/viewports/locales, same static-server +
  Playwright-chromium mechanism as the real harness) served only as a fast iteration loop to catch and fix the
  line-height regression without re-running the ~30-minute full sweep per attempt — the same approach Task 673
  used and the review addendum accepted.
- The owner-native `npm run check:header-id-parity` command (needs a running `next dev` server plus a captured
  storage state) was **not** attempted in this sandbox, per the kickoff's explicit instruction to hand it back
  rather than substitute or claim a result: `HEADER_ID_PARITY_STORAGE_STATE=<path> BASE_URL=http://localhost:PORT
  npm run check:header-id-parity`.
- No change to `i18n` — no new user-facing string was introduced; all text remains prop-driven/translation-hook-driven
  exactly as before (`useTranslations('nav')`/`useTranslations('common')`, unchanged keys).
- `.screenshots/` and the scratch capture scripts are local-only/ephemeral per D6 and are not part of this diff.

---

## 12. Backlog update (state only)

See `docs/backlog.md` — Task 706 row moved from `KICKOFF FILED` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
pointing at this session log. `docs/backlog.md` was 108 lines before this edit (a known pre-existing breach per the
kickoff); this update replaces existing text in place rather than appending, so it does **not** add net lines —
see the file for its resulting line count. **No `BACKLOG LIMIT BREACH` newly introduced by this task's edit**, but
the pre-existing 108-line breach itself is unresolved and remains Opus's to consolidate.

---

## 13. Opus handoff — evidence locations and open questions

- Verify `.screenshots/rendered-assert/2026-08-02T07-05/manifest.json` and
  `.screenshots/rendered-assert/2026-08-02T07-37/manifest.json` both exist, both show `HeaderView/Default`'s 16
  rows as `verdict: "pass"`, and their PNG files md5-match 1:1 (§4, §9) — this is the AC4 record.
- Confirm the AC5 `aria-haspopup` reasoned-equivalence (§6, §11) is acceptable, or ask for a literal pre-edit
  re-measurement if stricter proof is wanted.
- No open owner decision — D28/D29/D30 close all three per the kickoff.

---

## 14. Orchestrator review addendum (Opus, 2026-08-02)

Verified independently at review, from artifacts rather than this report:

- **AC4 closed on the official record.** `07-05`'s HeaderView PNGs were written **09:11:17**, before the first edit
  to `HeaderView.tsx` (**09:17:12**) — a genuine pre-edit baseline. `storybook-static/` was rebuilt **09:37:32**
  from the final module state (**09:30:52**), emitting `assets/HeaderView-xBSCpI2e.css` with `gap:.5rem` (Arm B
  reverted) and both line-height fixes, and the old `min-[390px]:flex-nowrap` chain is absent from the bundle;
  `07-37`'s HeaderView PNGs were then captured **09:43:58**. All 16 md5s compare **SAME** across the two runs, and
  both manifests report the 16 rows `verdict: "pass"` with `failed: 0`, `blankCanvas: 0`, `ambiguousOnly: 22`.
- **No blind cell.** Every one of the 16 rows carries a live `visualContentCheck` (`nonBackgroundRatio` 0.1975–0.4372,
  `variance` 93.98–209.49) in both runs, so no enrolled cell is uniform/blank.
- **AC6 = 23** on a review-side re-run, with `min-[390px]` now owned solely by `NotificationCenter.tsx` (4).
- **AC2** — `grep -c unstyled` is **14** in both `HEAD` and the working tree, and no diff hunk adds or removes an
  `unstyled` prop.
- **AC11 evidence handling.** The two arm captures were not persisted (they lived in an ephemeral scratchpad), so
  the arms themselves are not re-inspectable. This traces to the kickoff §14.4 asking only for a plant *transcript*
  rather than a persisted artifact path, not to executor non-compliance. Recorded as a P3 with a template fix for
  the next kickoff: name `.screenshots/task<N>-ac11/{armA-planted,armB-reverted,migrated-clean}` explicitly, as
  Task 673 did. The comparator's non-blindness is independently established by the per-cell content metrics above
  plus Task 673's own persisted Arm A (16/16 md5 flip on the same harness and mechanism, md5-verified at review).
- **Arm A flipped 9/16, not 16/16.** `gap` under `justify-content: space-between` is inert once free space exceeds
  it, so 7 cells were insensitive to that specific plant. AC11's bar is "≥1 cell", so it is met — but future plants
  should target a property that is live on every enrolled cell (a colour or a font-size), so the arm proves the
  whole matrix rather than part of it.
