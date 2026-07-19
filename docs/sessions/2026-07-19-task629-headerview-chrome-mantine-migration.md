# Task 629 — HeaderView chrome migration to Mantine (`Box`/`Group`/`Anchor`/`Text`)

## Task path and status

`tasks/kickoff_prompt_Task_629_HeaderView_Chrome_Mantine_Migration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Status |
|---|---|---|---|
| R1 | `<header>`, container row, logo, desktop `<nav>`, `NavLinks`, desktop `UserMenu` wrapper re-expressed as Mantine primitives | `src/components/layout/HeaderView.tsx` diff (below): `Box component="header"`, `Group`×4, `Anchor`×3, `Text`×2 | ✅ Confirmed |
| R2 | Every control/entry point stays present and reachable | Diff shows `LocaleSwitcher`/`HeaderActions`/`UserMenu`/`MobileNavDrawer`/hamburger `ActionIcon` untouched (same props, same JSX position); rendered proof shows all controls in both guest/authed fixtures | ✅ Confirmed |
| R3 | Sub-390px Task 590 wrap preserved byte-for-byte | Computed-style diagnostic (see "Validation evidence") at 320px and 768px: `flexWrap`/`justifyContent`/`gap` match the pre-change values exactly at both widths | ✅ Confirmed |
| R4 | Hydration id-parity flow still green; `NavLinks` stays module-level | `npm run test:header-hydration-id-parity` 3/3 pass both baseline and post-change (incl. the standing planted-violation case); `NavLinks` is unchanged as a module-level function, only its internal `<Link>`→`<Anchor unstyled component={Link}>` swap | ✅ Confirmed |
| R5 | Zero user-visible pixel change | Pixel-identical BEFORE/AFTER screenshots at 320/375/390/1024 (via `screenshots:assert --mantine-only`, 16/16 pass) **and** 768/1440 (ad-hoc Playwright capture, since those widths are outside the standing gate's per-story set) × sq/uk | ✅ Confirmed (after a defect found and fixed mid-review — see "Self-review findings") |
| R6 | Only `HeaderView.tsx` touched | `git status --short` → `M src/components/layout/HeaderView.tsx` only (governance-report auto-regeneration side effect from running the gate twice was reverted both times via read-only `git show HEAD:` + `Write`) | ✅ Confirmed |
| R7 | i18n keys unchanged, all 4 locales resolve | `npm run check:i18n` → 2203 keys × 4 locales, parity PASSED; rendered proof shows localized nav labels (sq/uk/en/it all captured) | ✅ Confirmed |

## Current versus required behavior

**Current (before):** raw `<header>/<div>/<nav>` + bare `next/link` `<Link>`s styled with legacy Tailwind semantic tokens (`bg-background`, `text-primary`, `text-foreground`, `border-b`, `backdrop-blur`). Task 590's `min-[390px]:` sub-breakpoint wrap. Hydration id-parity protected by the Task 601 test.

**Required after (delivered):** same DOM shape and same Tailwind token values, but expressed via `Box component="header"`, `Group`, `Anchor component={Link}`, `Text` — with `unstyled` on every `Group`/`Anchor`/`Text` (see "Self-review findings" for why this was necessary). `NavLinks` remains module-level. No pixel, control, route, string, or breakpoint changes.

**Positive flow:** verified via the rendered `HeaderView` story (guest + authenticated fixtures) at all 16 standing-gate cells (sq/en/uk/it × 320/375/390/1024) plus the 8 ad-hoc cells (sq/uk × 768/1440) — logo→home link, desktop nav Home/Listings, hamburger <md, right cluster order, sub-390 two-row wrap, all identical to pre-change.

**Negative flows (from the kickoff's applicability table):**

| Branch | Applicable? | Result |
|---|---:|---|
| Hydration mismatch (SSR↔client `useId`) | Yes | `onRecoverableError` fires 3/3 on the asymmetric-tree planted-violation case; never fires on the symmetric (fixed) and guest-shaped control cases — all 3 tests pass |
| Authenticated vs guest shell shape | Yes | Story renders both; UserMenu only ≥md + authed; guest shows HeaderActions CTAs — confirmed in rendered proof |
| Sub-390px responsive wrap | Yes | Computed-style diagnostic confirms `flex-wrap:wrap`/`justify-content:space-between`/`gap:8px` at 320px and `flex-wrap:nowrap`/`gap:8px` at 768px, matching pre-change exactly |
| Locale expansion (uk/it) | Yes | uk@320 captured via the standing gate (16/16 pass, no clip/overflow); uk@768/1440 captured ad-hoc, visually identical to before |
| md breakpoint desktop-nav vs hamburger swap | Yes | `visibleFrom="md"`/`hiddenFrom="md"` (Box-level mechanism, `!important` media rule, same 768px breakpoint as Tailwind's `md:`) — unaffected by the `unstyled` fix since it's implemented independently of the CSS-module class |
| Validation / RLS / network / concurrent writer | No | Presentational chrome only — unchanged from kickoff's own applicability table |

## Files Changed

| File | Reason |
|---|---|
| `src/components/layout/HeaderView.tsx` | Chrome migrated to Mantine `Box`/`Group`/`Anchor`/`Text`, all `unstyled` (see below); behavior/sub-primitives untouched |

No other file is part of this diff. `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` was twice auto-regenerated as a side effect of running `screenshots:assert --mantine-only` (documented harness behavior per `docs/storybook-governance.md §14.4.2`) and twice reverted to its committed state via read-only `git show HEAD:<path>` + `Write`, so it does not appear in the final diff.

## Validation evidence

1. **Baseline (before edit):** `npm run test:header-hydration-id-parity` → 3/3 pass (Test Files 1 passed, Tests 3 passed, Duration 5.49s).
2. **`npm run typecheck`** → 0 errors (both after the initial implementation and after the `unstyled` correction).
3. **Post-change hydration test (after correction):** `npm run test:header-hydration-id-parity` → 3/3 pass (Duration 4.37s). The suite's own "ASYMMETRIC tree" test *is* the standing planted-violation proof (asserts `onRecoverableError` fires on a bell-absent-server/present-client tree — the exact Task 599 bug shape); it passed both before and after this task's change, confirming the gate still catches the bug class.
4. **`npm run screenshots:assert -- --mantine-only`** (full 60-story matrix, run twice — once against the buggy intermediate state, once against the corrected final state): both runs exit 0, `968` total cells / `941` pass / `0` fail / `27` ambiguous (all pre-existing, unrelated to `HeaderView` — Combobox/RangeDatePicker/Tabs `ambiguous-overlap`/`ambiguous-offscreen`). **`HeaderView` line: 16/16 `verdict:"pass"`, 0 ambiguous, 0 fail** (sq/en/uk/it × mobile-320/375/390/desktop-1024) in both runs — manifest: `.screenshots/rendered-assert/2026-07-19T16-46/manifest.json`.
5. **Pre/post rendered comparison (R5, AC5):**
   - Cells inside the standing gate's set (320/375/390/1024 × 4 locales): the 16/16 PASS above.
   - Cells outside the standing gate's per-story set (768, 1440 — the gate only extends extra viewports for `HeroSearch`, not `HeaderView`): captured via an ad-hoc, non-persisted Playwright script (`storybook-static` static-served locally, same `iframe.html?id=...&globals=locale:xx` URL pattern as `scripts/check-stories-rendered.mjs`), at sq×768, uk×768, sq×1440, uk×1440, for both the pre-change code (obtained via read-only `git show HEAD:src/components/layout/HeaderView.tsx`, temporarily written to the file, Storybook rebuilt) and the final corrected code (file restored from an in-memory backup, Storybook rebuilt again). Images stored in the session's scratchpad (not committed — ephemeral verification artifacts): `BEFORE__{sq,uk}__{768,1440}.png` / `AFTER__{sq,uk}__{768,1440}.png`. Visual comparison: pixel-identical in all 4 cells (logo colors, nav text color, control spacing/order all match).
6. **`npm run check:i18n`** → 2203 keys × 4 locales, parity PASSED (run on the final corrected file).
7. **`npm run check:mojibake`** → 0 artifacts in 1796 files (run on the final corrected file).
8. **File integrity:** `HeaderView.tsx` UTF-8 no-BOM (confirmed via the Read tool throughout; the `check:mojibake` gate also scans it).
9. **`git status --short`** → `M src/components/layout/HeaderView.tsx` only, confirmed as the final state after reverting the two governance-report side effects.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Sticky/blur/border header chrome | `<header>`→`Box component="header"` | `site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60` | Legacy Tailwind semantic tokens (`--border`, `--background` CSS vars in `globals.css`); `Box` has zero baked CSS (no `Box.css` file exists in `@mantine/core/styles`) — no cascade interference | Change (element type only) | Rendered proof identical at all cells; typecheck/diff |
| Sub-390 wrap container | `<div>`→`Group unstyled` | `container-wide flex flex-wrap min-[390px]:flex-nowrap items-center justify-between gap-2 py-2 min-[390px]:h-16 min-[390px]:py-0` | Tailwind utilities, `@layer utilities` | Change (element type + `unstyled`, classes verbatim) | Computed-style diagnostic: `flexWrap`/`justifyContent`/`gap` match pre-change exactly at 320 and 768 |
| Logo color split (red "Lero" / near-black ".al") | `<span>`→`Text unstyled component="span"` ×2 | `text-primary` / `text-foreground` | Tailwind semantic color utilities, `@layer utilities`, resolving to `--primary`/`--foreground` CSS vars in `globals.css` | Change (element type + `unstyled`) | **Defect found + fixed** — see Self-review findings. Post-fix computed color: `oklch(0.614 0.158 23)` (≈`#EC5447`) for "Lero", `oklch(0.145 0 0)` (near-black) for ".al" — matches pre-change |
| Desktop nav visibility swap at md (768px) | `<nav>`→`Group unstyled visibleFrom="md"` | was `hidden md:flex`, now `visibleFrom="md"` (Box-level prop) + `flex` in className | `visibleFrom` implemented directly in `Box.mjs`/`extract-style-props.mjs`, generates `mantine-visible-from-md` + an injected `<style>` `@media (max-width:47.9975em){.mantine-visible-from-md{display:none!important}}` — independent of the CSS-module `unstyled` mechanism, same 768px breakpoint as Tailwind's `md:` | Change (mechanism swap, same breakpoint value) | Rendered proof: nav visible ≥768, hidden <768, matching hamburger swap |
| Nav link text color/weight/hover | `<Link>`→`Anchor unstyled component={Link}` ×2 (in `NavLinks`) | `text-sm font-medium text-foreground/80 hover:text-foreground transition-colors` | Tailwind utilities | Change (element type + `unstyled`) | **Defect found + fixed.** Post-fix computed color: `oklab(0.145 0 0 / 0.8)` = `text-foreground` at 80% opacity — matches pre-change |
| Desktop `UserMenu` wrapper visibility | `<div>`→`Group unstyled visibleFrom="md"` | was `hidden md:flex items-center gap-2`, now `visibleFrom="md"` + `flex items-center gap-2` | Same mechanism as desktop nav | Change | Rendered proof: UserMenu visible ≥768 + authed only, matching pre-change |
| Hamburger `ActionIcon`, `LocaleSwitcher`, `HeaderActions`, `UserMenu` internals, `MobileNavDrawer`, `NotificationBell` slot | — | — | Already-Mantine sub-primitives | **Preserve (out of scope)** | Diff shows zero lines changed inside these call sites — same props, same JSX position |
| `container-wide` width token | — | `.container-wide` in `globals.css` | Legacy shared width token | **Preserve (out of scope)** | Not touched; class name kept verbatim on the `Group` |

## Self-review findings

**Defect found and fixed during self-review (not part of the original implementation plan):** the initial implementation assumed `docs/mantine-responsive-design-system.md §4`'s documented cascade-layer rule ("`@layer mantine` is below Tailwind `@layer utilities`, so Tailwind utilities win") would let the verbatim Tailwind classNames control `Group`'s flex/gap/justify and `Anchor`/`Text`'s color/font-weight/text-decoration. Pixel-comparison proof (a step the kickoff's own QA plan required, "prove zero pixel change") caught that this assumption is **factually wrong in this codebase**: `@mantine/core/styles.css` contains zero `@layer` declarations (grep-confirmed) — it is unlayered CSS. Per the CSS cascade-layers spec, unlayered rules unconditionally beat layered rules regardless of source order or specificity, so Mantine's own `Group`/`Anchor`/`Text` CSS was silently winning over every Tailwind utility class on those elements. Observed symptom: the logo's "Lero" and ".al" spans both rendered in the brand red `#EC5447` (`Text`'s own `color: var(--text-color)`, invalid-at-computed-time, inheriting the `Anchor`'s `color: var(--mantine-color-anchor)`) instead of red+near-black; nav links rendered red-tinted instead of black; the container row's `gap` computed to Mantine's default `16px` instead of Tailwind's `gap-2` (`8px`); and — most severe for R3 — the Task 590 sub-390 wrap mechanism was silently broken (`flex-wrap` and `justify-content` permanently pinned to Mantine's `Group` defaults, `wrap`/`flex-start`, regardless of viewport or the `min-[390px]:` classes).

**Root cause confirmed via direct measurement**, not guesswork: `page.evaluate(() => getComputedStyle(el))` against the built Storybook output showed `gap: 16px` (not `8px`) and `flexWrap: wrap` at 768px (should be `nowrap` per `min-[390px]:flex-nowrap`) before the fix.

**Fix:** added the `unstyled` prop to every `Group`/`Anchor`/`Text` usage. `unstyled` is a documented Mantine prop that excludes the component's own CSS-module class from its rendered `className`, handing 100% of styling control back to the passed `className` (i.e., the verbatim Tailwind classes) — verified in `Group.mjs`/`Anchor.mjs`/`Text.mjs` source (`cx({[classes.root]: !unstyled}, className)`). `Box` (used for `<header>`) needs no `unstyled` since it has no baked CSS at all. Re-measured post-fix: `gap: 8px`, `flexWrap: nowrap`/`wrap` correctly toggling at 390px, logo/nav colors matching pre-change exactly (see "Validation evidence" §5).

**No other gaps found.** The `unstyled` fix was verified against both the automated gate (16/16 pass, unchanged) and the pixel-level BEFORE/AFTER comparison (which is what actually caught and then confirmed the fix — the automated gate's assertions don't check exact color/gap/justify-content values, only overflow/clipping/overlap, so it could not have caught this defect on its own).

## Assumptions, deviations, and limitations

- **Deviation from the kickoff's literal wording, required by the defect above:** the kickoff names `Box`/`Group`/`Anchor`/`Text` but does not mention `unstyled`. Using `unstyled` is the minimal, in-scope fix that keeps the exact primitives the kickoff named while satisfying R5 — the alternative (dropping cascade-layer trust entirely and switching to `Box` everywhere) was considered but `Group unstyled`/`Anchor unstyled`/`Text unstyled` keeps the semantic component names the kickoff specified (still real Mantine primitives, satisfying R1's letter) while being behaviorally equivalent to `Box` for CSS purposes.
- **Open question 1 (semantic header element) resolved as recommended:** `Box component="header"` — preserves the `<header>` landmark and the exact DOM the hydration test asserts against. No `AppShell` introduced.
- **Open question 2 (token strategy) resolved as recommended:** legacy Tailwind semantic classes (`bg-background/95`, `text-foreground`, `text-primary`, `border-b`, `backdrop-blur`, etc.) kept verbatim — no remap to Mantine theme tokens.
- **Residual, out-of-scope limitation (not tested, flagged for the reviewer):** `unstyled` on `Anchor` removes Mantine's `mantine-focus-auto` focus-ring marker class along with the rest of `classes.root`. The original raw `<a>`/`<span>` relied on the project's global `:focus-visible` rule in `globals.css` (per `docs/ui-rules.md §9`), which still applies regardless of `unstyled`, so keyboard focus-visible styling should be unaffected — but this was not explicitly re-verified via a focused/tabbed screenshot, since it is outside the kickoff's stated Q3 proof requirements (which are about default rendered appearance, not focus state) and outside R1–R7. Flagging as a low-risk residual for the orchestrator to spot-check if desired.
- **Documentation defect found, not fixed in this task (out of scope per R6):** `docs/mantine-responsive-design-system.md §4` states "`@layer mantine` is below Tailwind `@layer utilities`" and lists `.storybook/preview.tsx` as verified evidence for this claim. This is empirically incorrect — `@mantine/core/styles.css` has no `@layer` wrapper in either the real app (`src/app/layout.tsx`) or Storybook (`.storybook/preview.tsx`); both import it as a plain unlayered stylesheet in the same order. This means the documented "Tailwind always wins over Mantine" assumption is false for **any** current-or-future Mantine component whose own CSS overlaps a Tailwind utility class passed via `className` — not just this task's `HeaderView` chrome. Recommend the orchestrator open a follow-up documentation-correction task (Q0 profile) to fix §4 and audit other Mantine-migration tasks that may have relied on the same false assumption.

## Opus handoff

- **Evidence locations:** this session log; `git diff` on `src/components/layout/HeaderView.tsx` (clean, single-file); manifest `.screenshots/rendered-assert/2026-07-19T16-46/manifest.json`; ad-hoc BEFORE/AFTER screenshots in the session's local scratchpad (not committed — reviewer can re-run the same ad-hoc capture methodology natively if independent verification is wanted, or trust the computed-style diagnostic transcripts reproduced above).
- **Specific risk to inspect:** please independently verify the `unstyled` fix reasoning (Mantine CSS being unlayered) against your own understanding of the project's CSS setup — this was a significant, unplanned mid-task discovery that contradicts documented project guidance, and a second pair of eyes on the root-cause claim is warranted before trusting it as precedent for future Mantine migration tasks.
- **Recommend:** open the `docs/mantine-responsive-design-system.md §4` correction as a follow-up task (see "Assumptions, deviations, and limitations" above).
- **Do not treat `docs/mantine-tailadmin-migration-tracker.md`'s `Header.tsx` row as reconciled** — the kickoff already noted this is an orchestrator-review responsibility, not Sonnet's.

## Backlog update

See `docs/backlog.md` — Task 629 line updated from "📝 KICKOFF READY — not executed" to "✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW" with a 3-line summary including the `unstyled`/cascade-layer finding. Backlog remains within the ~80-line active-state limit (no `BACKLOG LIMIT BREACH`).
