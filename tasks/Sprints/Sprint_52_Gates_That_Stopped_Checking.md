# Sprint 52 — Gates that stopped checking

**Opened:** 2026-08-06. **Epic:** MM Phase-2 / Epic JJ (design tokens). **Status:** 🟠 OPEN.

---

## 1. Why this sprint exists

Two gates in this repo report green while no longer observing what they were built to observe. They are the same
defect in two places, and both were found by review rather than by any gate:

1. **`check-stories-rendered.mjs`** — `fullWidthButtonsAtMobile` and `popupBottomSheetAtMobile` are `null` in all
   1184 cells of the CI-blocking `--mantine-only` matrix, because their candidate selectors are shadcn `data-slot`
   names Mantine never renders. Every consumer tests `=== false`, so a wholly dead assertion contributes `true` to
   `hardPass`. Task **710** built the meta-gate that detects this and registered both against **711**.
2. **`check-design-tokens.mjs`** — its length/duration/z-index detectors are keyed to **Tailwind arbitrary-value
   syntax** (`*-[Npx]`, `shadow-[…]`, `z-[N]`). It scans `.css` files, and catches **colour** literals there, but a
   plain CSS declaration like `font-size: 10px` matches nothing. Task **713**'s D28 migration moved three
   `text-[10px]` values — each previously **detected and suppressed with a written justification** — into
   `.module.css`, where the scanner does not look. The gate went green because it stopped checking.

Task 713's review recorded the second as `F2`, and the owner then codified the general rule into
`docs/orchestrator-procedures.md` (`6c3a2054e`, 2026-08-06): *"If the migration moves a value outside detector
coverage, the kickoff must either include detector support in the same task or name a separately sequenced
corrective task."* **714 is that corrective task.**

## 2. Goal

Restore observation to both gates, and prove restoration by showing each gate now fails on the exact values it had
stopped seeing.

## 3. Binding decisions and rules carried in

- **`docs/orchestrator-procedures.md` → "Detector-aware requirements and migrations"** (`6c3a2054e`) — read the
  detector and prove how it treats the target syntax **before** publishing a task; a stale-marker failure is
  evidence a requirement is unsatisfiable, not an executor deviation.
- **D32** — a migration may not be proven against a comparator not shown to fail.
- **N1** (707 P3) — a D28 module reproduces the compiled **token reference**, never its resolved value. §5 below is
  the collision this sprint has to navigate.
- **Task 402 → 407 precedent** — this detector was landed in **report mode** first and flipped to strict only once
  the inventory was known. `check-design-tokens.mjs:6-8` still records that staging.

## 4. Tasks

| # | State | Scope |
|---|---|---|
| **714** | `KICKOFF FILED` | Teach `check-design-tokens.mjs` to read CSS declarations for the non-colour categories; produce the classified inventory; prove F2 closure. Report-only for the new category. `Sprint_52_kickoff_prompt_Task_714_DesignTokens_CSS_Declaration_Coverage.md` |
| **711** | `KICKOFF FILED` | Re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto **measured** Mantine DOM. Both are **0/852** applicable (`width<640`) cells across the current 1184-cell manifest; the viewport set was excluded as the cause (852 cells really are <640), so the `data-slot` selectors are. Census-before-selector (D33), honest `checkedAny→null` contract, per-assertion planted proof, plus the free `STALE-ENTRY` comparator the liveness gate produces when the registry entries are deleted. `Sprint_52_kickoff_prompt_Task_711_ReAnchor_Dead_Mantine_Assertions.md` |
| **721** | reserved, after 711 | The four Task 710 review findings, split out of 711 by owner decision 2026-08-06: **F1** `[no-boolean-assertions]` exit-2 arm · **F2** `ORPHAN-ENTRY` exit-1 arm · **F3/F4** the `critical-flow-registry` row-50 fix and the two surviving `2026-08-0X` citations (`docs/design-system.md:1086` → `2026-08-06-task715-…`, `docs/storybook-governance.md:1586` → `2026-08-05-task710-…`) · **NOTE-1** a `LIVE-THIN` threshold. Runs after 711 because the threshold depends on what the re-anchored assertions score. **F3's "row 50" is not resolvable from the repo** — `critical-flow-registry.md` has no numbered rows and the 710 session log does not mention it; that kickoff must locate it or report `BLOCKED`. |
| **722** | reserved, independent | **`fullWidthControlsAtMobile` is vacuously true and no gate can see it.** Measured: `{"true": 852}` across all 852 applicable cells, never once `false` — including `Mantine/Primitives/Alert/Default`, which renders no form control, where the sibling assertion honestly reports `null`. Cause (`check-stories-rendered.mjs:1112-1145`): no `checkedAny` guard, so a zero-match cell returns `true`; and two of its three arms are the same shadcn `data-slot` selectors that killed 711's pair. `check-assertion-liveness.mjs` detects null-ness only, so it classifies this as **LIVE**. Found during 711's task design, 2026-08-06. |
| **715** | ✅ `APPROVED WITH NOTES` (`406470c47`) | Flipped the CSS categories to strict and remediated 716's 60-item inventory (30 tokenized / 30 marked). Review **F1** caught two substitutions consuming `--z-sticky`, a token tabled in §22.3 but defined nowhere — corrected to marked `z-index: 30`. `Sprint_52_kickoff_prompt_Task_715_DesignTokens_Strict_Flip_And_Remediation.md` |
| **716** | ✅ `APPROVED WITH NOTES` (`fe21978d5`) | Generalized the 3 CSS categories to shorthand and function-wrapped declarations (per-literal token-anchored exemption), fixed the reason-less-marker `stale-marker` misreport, re-ran the census to 60/6 files. `Sprint_52_kickoff_prompt_Task_716_DesignTokens_Shorthand_And_Function_Coverage.md` |
| **717** | reserved, kickoff not written | Narrow the `src/design-system/mantine` path allowlist (`design-tokens-allowlist.json:2`), which exempts the whole directory from token enforcement though its stated reason covers only `theme.ts`. Registered by 715 §3.6. |
| **718** | ✅ `APPROVED WITH NOTES` (`98bec3fa9`, reviewed as one unit with 718R) | Defined the seven `--z-*` tokens §22.3 promises but `globals.css` never defined (owner decision, 2026-08-06), corrected the "Use via" column Tailwind v4 cannot honour, and made an unresolvable `var(--x)` a **blocking** finding — the gate half of 715's F1. Folded in 716 review **F3**. Review reproduced both plant arms independently; **F1** found three undocumented false-negative shapes → **718R**. `Sprint_52_kickoff_prompt_Task_718_ZIndexTokens_And_UndefinedVarGate.md` |
| **718R** | ✅ `APPROVED WITH NOTES` (`98bec3fa9`) | Closed 718 review **F1**: `i` flag on `css-undefined-var`'s `var\(` regex so `VAR(--missing)` is found (0 false-positive sites measured), document the two gaps it cannot close (`*`-line → 719; multi-line `var(` → architectural, unowned) in §23.6.c, lock all three with arms. Folds in review **F3** (restore three narrowed arms to unfiltered `toHaveLength(0)` on `--space-6`). `Sprint_52_kickoff_prompt_Task_718R_CssUndefinedVar_Coverage_Gaps.md` |
| **719** | ✅ `APPROVED WITH NOTES` (`13e8c3ddf`) | `shouldSkipLine:584` treated a leading `*` as a comment, so **all four** CSS categories miss a violation on a universal-selector line (`* { margin: 10px; }` → `css-length` MISSED, control flagged; same for `css-duration`/`css-zindex`/`css-undefined-var`). Measured: 1 real `*` rule in `src/**/*.css` and it is unscanned, so exposure is currently zero — but 4,058 `.ts`/`.tsx` JSDoc lines depend on the same branch. `.css`-only fix via the already-stripped source, four planted proofs. `Sprint_52_kickoff_prompt_Task_719_SkipLine_UniversalSelector_Blind_Spot.md` |

| **720** | ✅ `APPROVED WITH NOTES` | `extractCssCustomPropertyDefinitions:574`'s `/^…/gm` registers at most **one** declaration per physical line, and only as the first token — so `.x { --local: 1px; width: var(--local); }` is a **false positive** and `'--Foo: 1px; --foo: 2px'` returns only `['--Foo']`. Exposure today **0** (no same-line declarations in `src/**/*.css`), and it fails **loud**, not silent. The naive repair (drop `^`) is **rejected**: it reads decl-shaped literals inside `content` strings and data URIs as definitions, turning a loud false positive into a silent false negative — declaration-aware, quote/paren-tracking scan required. `Sprint_52_kickoff_prompt_Task_720_CustomProperty_Definition_LineAnchor.md` |
| **723** | `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW` | **P0, unrelated to the design-token arc — filed into this sprint as the open one.** Task 684's `top` prop on `<Notifications>` leaked onto all six Mantine position containers (unqualified by `[data-position]`), stretching the three `bottom-*` containers to full viewport height with default `pointer-events`, click-shielding most of the homepage in production for ~a month. Fix: offset moved to `notification-chrome.css`, scoped to `[data-position^="top"]`, + a `pointer-events:none/auto` shield pair. New blocking gate `scripts/check-click-shield.mjs` (R4), planted-violation round trip proven on a real production build (R5). **AC3 not 100% green** — 9/221 residual interceptions, 0 attributable to this diff, all traced to a separate pre-existing `MobileBottomNavView`/homepage-content collision newly exposed (not fixed) by this task. `Sprint_52_kickoff_prompt_Task_723_NotificationsClickShield.md`, `docs/sessions/2026-08-06-task723-notifications-click-shield.md`. |

**Order: 714 → 716 → 715 → 718 → 718R → 719 → 720.** 711 and 717 are independent and may run in parallel.
**719 was blocked on 718R** — 718R published the §23.6.c limitation entry 719 retires, and both edit the same test
file and doc section. That block is **lifted**: 718 + 718R are `APPROVED WITH NOTES` and committed (`98bec3fa9`).
**720 is sequenced after 719** for file contention only — the two defects are independent (719 fixes a shared
four-category skip heuristic; 720 fixes one function feeding one category), but both edit `check-design-tokens.mjs`
and its suite. Owner decision, 2026-08-06: keep them separate rather than widening 719's scope.

> **Table corrected 2026-08-06:** 716, 717 and 718 were missing from this table — the same stale-record defect the
> sprint exists to fix, in the sprint's own plan file. 715's row was still `reserved, blocked on 714`.

## 5. The collision this sprint must navigate — measured, not assumed

Turning on CSS-declaration detection is not a free win. Measured 2026-08-06 across the 12 `.module.css` files in
`src/`: **49 raw non-colour literals in 7 files** — `FooterView` 19 · `HeaderView` 14 · `MobileBottomNavView` 7 ·
`MantineListingCardPattern` 4 · `LatestListingsView` 2 · `FeaturedListingsView` 2 · `PopularLocationsView` 1.

Those files belong to **closed, approved tasks** (673 · 706 · 707 · 688 · 709/709-R · 713), and most of the
literals are annotated reproductions of compiled Tailwind output — `gap: 1.5rem; /* gap-6 */`,
`font-size: 0.875rem; /* text-sm */`, `border-radius: 3.40282e38px; /* rounded-full */`.

**This is the point:** a large share of those are N1 violations hiding in plain sight — `gap: 1.5rem` *should* be
`var(--space-6)`. A smaller share are genuinely token-less compiled artifacts that need a marker and a reason.
**Nobody knows the split, because nothing has ever measured it.** 714 measures it; 715 acts on it.

## 6. Explicitly NOT in this sprint

- Remediating the 49 — that is **715**, and it cannot be scoped before 714's inventory exists.
- Flipping the new category to strict, or changing `governance-pr.yml:97` — **715**.
- Any change to the existing colour / Tailwind-bracket detectors, which work correctly.
- Any `src/` UI change, restyle, or token change.
- `ListingCard` (702) / `MantineListingCardPattern` (691) de-Tailwind — Sprint 46.

## 7. Preconditions

- Task 713 `APPROVED WITH NOTES` and committed (`8199a5aae`).
- `scripts/__tests__/check-design-tokens.test.ts` exists with **26** tests and imports `scanContent`,
  `stripJsxComments`, `parseInlineMarkers` from the detector — the planted-proof vehicle already exists.

## 8. Exit criteria

1. `check-design-tokens.mjs` detects raw length/duration/z-index literals in plain CSS declarations, proven by a
   planted failing arm in the existing unit-test harness.
2. The three `font-size: 10px` values Task 713 made invisible are **detected again**, and suppressible by a CSS
   marker — F2 closed and demonstrated, not asserted.
3. The full 49-literal inventory is produced and classified into "should be a token (N1)" versus "token-less
   compiled artifact, needs a marker".
4. CI stays green: the new category is report-only until 715.
5. 711's kickoff is written and its four 710-review fold-ins are in scope.

## 9. Notes

`npm run check:design-tokens` is `--strict` (`package.json:66`) and CI runs `check:design-tokens:strict`
(`governance-pr.yml:97`). Any new detection that defaults to blocking would turn CI red on 49 pre-existing
literals across six closed tasks' files. That is why 714 is report-only and 715 is separate.

---

## 10. Remaining scope and execution order (revised 2026-08-08, after the Task 726 review)

The design-token arc (714 · 715 · 716) and the 711/723/724R gate arc are **complete and archived**. What is left was
re-audited against the repository on 2026-08-08; every claim below was re-verified, not carried forward on trust.

**Numbers folded, to stop paying the same cost twice.** The dominant cost in this sprint is not the edit — it is
`build-storybook` + the 1184-cell `--mantine-only` sweep, roughly an hour per run. Four tasks were each going to pay
it separately for changes to one file. They are now two:

| Order | Task | Folds in | Why it sits here |
|---|---|---|---|
| **52.1** | **722** — ✅ `APPROVED` 2026-08-08, archived | **732** | Both are assertion-logic defects in adjacent functions of `check-stories-rendered.mjs`, provable in **one** sweep at a **fixed** 1184-cell denominator |
| **52.2** | **717** — `KICKOFF FILED` | — | Independent of the matrix; no sweep needed |
| **52.3** | **721** | **728** | Documentation, citations and two manifest-reading gate arms. `check-assertion-liveness.mjs` never launches a browser, so this costs no sweep at all |
| **52.4** | **678** | **687** | Both change the matrix **denominator**, so they must not share a session with 52.1 |
| **52.5** | **733** | — | Overlay-hosted controls are never measured — the hole 722's guard exposed. Runnable now; independent of 52.2–52.4 |
| parked | **727** | — | Blocked on owner decisions **OQ2** and **OQ3**; OQ3 gates it explicitly. Do not schedule it until both are answered |

**52.1 must precede 52.4, and this is the whole thesis of the sprint.** `fullWidthControlsAtMobile` is vacuously
`true`: `check-stories-rendered.mjs:1112-1145` has no `checkedAny` guard and two of its three arms are shadcn
`data-slot` selectors Mantine never renders, so a zero-match cell returns `true` (re-confirmed 2026-08-08). Enrolling
`AdminUsersTable`'s 16 cells (687) or widening `MANTINE_VIEWPORTS` from 4 widths to 14 (678, `:392`) **before** that
guard exists does not add coverage — it manufactures several thousand more cells of false green on a CI-blocking
gate. Expanding a denominator under a vacuous assertion is the exact failure this sprint was opened to end.

**52.1 also inherits 726's residue.** With the `[role="group"]` skip deleted, `isChipSetMember` is now the sole
escape keeping legitimate chip rows out of `fullWidthButtonsAtMobile`. Every group clears it today, so 726 moved zero
cells — but it does not hold for a 2-button Mantine group or a nowrap horizontally-scrolling chip row, which is the
exact shape of `FavoritesTypeFilter.tsx:31`, safe only because that component is still shadcn and the gate reads
`.mantine-Button-root`. 52.1 either records that bound in `storybook-governance.md` §14.9.28 beside the median
example, or widens the predicate — and says which.

**Stale reference corrected 2026-08-08:** 721's scope said two surviving `2026-08-0X` citations. There are **three** —
`design-system.md:1086`, `storybook-governance.md:1586`, `storybook-governance.md:1883`. Its F3 "row 50" remains
unresolvable from the repository (`critical-flow-registry.md` has no numbered rows); 721 reports `BLOCKED` on that
sub-item rather than inventing a target.
