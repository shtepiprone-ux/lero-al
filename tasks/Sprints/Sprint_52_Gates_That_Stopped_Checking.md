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
| **711** | reserved, blocked on nothing | Re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM. Must fold in Task 710 review **F1** (`[no-boolean-assertions]` exit-2 arm), **F2** (`ORPHAN-ENTRY` exit-1 arm), **F3/F4** (the `critical-flow-registry` row-50 and `2026-08-0X` citation fixes) and **NOTE-1** (a `LIVE-THIN` threshold). Kickoff not yet written. |
| **715** | reserved, blocked on 714 | Flip the new CSS category to strict and remediate the inventory 714 produces. Cannot be scoped until 714 has measured it. |

**Order: 714 → 715.** 711 is independent and may run in parallel.

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
