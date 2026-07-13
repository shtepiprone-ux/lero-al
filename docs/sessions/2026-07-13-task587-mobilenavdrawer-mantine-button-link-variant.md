# Task 587 — `MobileNavDrawer`: legacy Button → Mantine core + reusable `§6a-link` transparent variant + Logout left-indent fix

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_587_MobileNavDrawerMantineButtonLinkVariant.md`.
Owner-directed 2026-07-13, caught on the Task 587 review: `MobileNavDrawer.tsx` (extracted in Task 579)
still imported the legacy `@/components/ui/button` for all four of its buttons.

## Why

Last legacy-Button consumer in the Header stack. Owner required: (1) swap to Mantine core `Button`,
(2) a reusable, theme-level `transparent` (Link) variant for the borderless buttons (Register-as-agent,
Logout) styled to the newly live-captured TailAdmin `§6a-link` reference, (3) fix the Logout button's
left-indent vs the flush-left nav links above it.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | Added a `Button.vars` function (new — the block previously only had `styles`) implementing the `§6a-link` gray-700 default text for `variant="transparent"` when no explicit `color` prop is passed, gated so `color="red"` (Logout) still resolves via Mantine's own `variantColorResolver`. **Root-caused and avoided a real bug**: a first attempt placed this override in the existing `Button.styles` callback (the same technique the pre-existing `outline`/`default` branch uses) — an isolated render probe proved Mantine's `getStyle()` merge order applies `vars` (the component's own built-in `--button-color`, always non-empty) **after** `styles`, so a `styles`-level override of a var the built-in resolver also sets is silently discarded. Moved to `Button.vars` (same merge stage as the built-in resolver, applied after it — same technique already used by this file's `Progress`/`Slider` `vars` overrides), re-verified via the probe: final `--button-color` = `var(--mantine-color-gray-7)` (`rgb(52,64,84)` = `#344054`, exact `§6a-link` match). `outline`/`default`/`filled` untouched — confirmed via diff and via the probe (their resolved values are unchanged from before this task). |
| `src/components/layout/MobileNavDrawer.tsx` | Swapped `import { Button } from '@/components/ui/button'` → `import { Avatar, Button } from '@mantine/core'` (zero `@/components/ui/button` remaining, grep-confirmed). Login → `variant="default"` `fullWidth`. Register → `variant="filled"` `fullWidth`. Register-as-agent → `variant="transparent"` `fullWidth` `justify="flex-start"` `styles={{root:{paddingLeft:0}}}` (STOP-AND-ASK resolved per kickoff: left-aligned, no icon, flagged as a follow-up if the owner wants it centered/iconed instead). Logout → `variant="transparent"` `color="red"` `fullWidth` `justify="flex-start"` `leftSection={<LogOut size={16}/>}` `styles={{root:{paddingLeft:0}}}` — `paddingLeft:0` fixes the left-indent (previously the legacy `size="xl"` button's internal `px-5` pushed the icon+label ~20px right of the flush-left nav text). All four keep their exact original `onClick` wiring (`openAuth('login'|'register'|'register-agent')`, `logout()`). `MobileNavDrawerProps` byte-identical; `Header.tsx` untouched. |

**Not touched:** `Header.tsx`, `MantineDrawer`, `signOut`/`lib/auth/browser.ts`, locale JSON (reused existing
`nav.*` keys), routing, any other Button consumer. `docs/tailadmin-style-reference.md §6a-link` (row +
provenance note) was added by the orchestrator before this kickoff — not touched by this session.

**Excluded from this diff (auto-generated, harness artifact, precedent from the Task 583 review):**
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — a 3-line stat delta
regenerated as a side effect of running `screenshots:assert`, unrelated to Task 587's scope.

## Root-cause note: the `Button.styles` vs `Button.vars` CSS-var precedence bug

Documented in detail because it's a reusable lesson for any future Button theme override:

- Mantine's `getStyle()` (per-selector style resolution) merges in this order, later wins on key collision:
  `theme.components.Button.styles` → the component's own internal `styles` prop (from consumer) →
  per-call `options.styles` → `resolveVars(...)` (built-in `varsResolver` + `theme.components.Button.vars`
  + instance `vars` prop) → root-selector local `style` → instance `style` prop.
- Button's own built-in `varsResolver` (in `@mantine/core`) unconditionally sets `--button-color:
  colors.color` (from `theme.variantColorResolver`) for every render — so a `styles`-level attempt to set
  `--button-color` is always overwritten by the built-in vars step that runs after it.
- Verified empirically with an isolated `@testing-library/react` + `MantineProvider` render (throwaway,
  not committed) reading `button.getAttribute('style')`:
  - `styles`-level override attempt → final `--button-color: var(--mantine-color-brand-light-color)`
    (the override never took effect).
  - Same override moved to `theme.components.Button.vars` → final `--button-color:
    var(--mantine-color-gray-7)` (takes effect, confirmed).
- **Side finding, out of scope for this task:** the pre-existing `outline`/`default` branch's `styles`-level
  `'--button-color': 'var(--mantine-color-gray-7)'` (comment claims "Task 527 fix #6") is subject to the
  same bug — the probe showed `variant="default"`'s resolved `--button-color` is Mantine's own
  `var(--mantine-color-default-color)` (stock near-black), not the intended gray-7. Visually close enough
  (near-black vs `#344054`) that it wasn't caught by prior rendered-screenshot review. **Not fixed here**
  per the kickoff's explicit "Do NOT touch the existing outline/default/filled behavior" — flagging for the
  orchestrator to open a follow-up if this precision matters (TailAdmin secondary chrome exactness).

## STOP-AND-ASK resolution — Register-as-agent alignment

Implemented exactly as the kickoff's pre-resolved default: left-aligned (`justify="flex-start"`,
`paddingLeft:0`), no icon, consistent with the Logout link below it. Not re-litigated. If the owner wants
it centered (matching the two CTAs above) or wants an icon, that's a one-line follow-up, not a redesign.

## Positive / Negative flow

- **Positive:** (authed) open drawer → Logout renders flush-left with the nav links, red text (`§6a-link`
  destructive), `LogOut` icon-left with a visible gap (Mantine `leftSection`, no manual gap), ≥44px → tap →
  `onLogout()` then `onClose()` fire (unchanged `signOut` wiring, verified by diff + smoke baseline).
  (Guest) Login → `onOpenAuth('login')`, Register → `onOpenAuth('register')`, Register-agent (link) →
  `onOpenAuth('register-agent')`, each preceded by `onClose()` — unchanged call sequence, verified by diff.
- **Negative:** zero `@/components/ui/button` import remains (grep=0); zero raw `<button>`; all four
  handlers fire exactly once (unchanged function bodies — `navigate`/`openAuth`/`logout` untouched);
  `variant="transparent"` shows **no background on hover or press** (verified via a headless-Chromium
  hover probe against a freshly rebuilt `storybook-static`: `background-color` stays `rgba(0,0,0,0)` at
  rest AND on `:hover` for both the Logout `color="red"` case and the no-color `§6a-link` gray-7 case);
  Logout keeps the red destructive tint (`--button-color: var(--mantine-color-red-light-color)`, confirmed
  via the same probe); guest buttons render only when `!user`, Logout only when `user` (unchanged
  `{user ? … : …}` conditionals, verified by code inspection — same STOP-AND-ASK-resolved verification
  method Task 579/585 used, since the story only opens the logged-in fixture); long `uk`/`sq`/`it` labels
  wrap without horizontal scroll at 320 (screenshots reviewed, see Rendered evidence); the one other
  `variant="transparent"` consumer found (`Button.stories.tsx`'s own "Link" variant-demo swatch) renders
  its **intended** appearance unchanged in kind — it demonstrates the variant's live styling, so picking up
  the corrected gray-7 default text is the swatch doing its job, not a surprise regression.

## Regression coverage (clause 15) — critical flow: Logout

`docs/critical-flow-registry.md` line 27. `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`:

- **Before this diff:** 4/4 tests passed (baseline recorded).
- **After this diff:** 4/4 tests passed (re-run post-change, identical).

The Logout button's `onClick={logout}` → `logout()` → `onLogout()` (then `onClose()`) is unchanged
(diff-verified: the `logout()` function body was not touched, only the JSX Button wrapping it). No new
test required — presentational-only change per the kickoff.

## Rendered evidence (clauses 12/13 + §18.9)

**`screenshots:assert -- --mantine-only`** (fresh run, 2026-07-13T08-04, after a clean `build-storybook`):

- **634/660 PASS, 0 FAIL, 26 AMBIGUOUS** — byte-identical to the Task 579 baseline (660/634/0/26). All 26
  ambiguous cells are the same known set (`Combobox` mobile-overlap, `RangeDatePicker` mobile-overlap,
  `Tabs` swipe-offscreen at `sq`/`it` mobile-320) — zero new ambiguous/fail cells, `MobileNavDrawer`'s own
  16 cells are all in the PASS set. Story count unchanged (still 1 `Default` story for `MobileNavDrawer`).

**🔴 §18.9 human-visual proof** (geometry gate is blind to color/hover/alignment — inspected manually):

- **uk@320/375/390 (mandatory):** Logout ("Вийти") renders as a pure link — no border, no background fill,
  red text, `LogOut` icon-left with a visible gap to the label, full-width, ≥44px. Icon's left edge aligns
  flush-left with "Головна"/nav text above it at all three widths (indent fixed). No clipping, no
  horizontal scroll.
- **sq@320:** "Dil" — same chrome, label fits without wrap/clip.
- **it@320:** "Esci" — same chrome, label fits without wrap/clip.
- **en@1024 (desktop; nearest available canonical width to 1280 in the Mantine sweep, same substitution
  Task 579 used):** side drawer — "Logout" flush-left with "Home"/"Listings"/… nav labels above it, red
  text, icon-left gap, transparent chrome, full-width within the drawer panel.
- **Hover frame (one desktop width, `en`@1024):** captured via a headless-Chromium probe against a
  fresh `build-storybook` output (throwaway script, not committed) — `getComputedStyle(button)
  .backgroundColor` = `rgba(0, 0, 0, 0)` both at rest and after `.hover()`, for both the Logout
  (`color="red"`) button and the no-explicit-color `§6a-link` swatch (`Button.stories.tsx`'s "Link").
  Confirms the owner's "pure link, no hover/press background fill" requirement.
- Guest branch (Login/Register/Register-agent) verified by code inspection of the `{user ? … : …}`
  conditional — the story renders only the logged-in fixture by design (Task 579/585 precedent); the
  Register-agent `§6a-link` styling (gray-700 text, no hover fill) was independently confirmed via the
  same headless-Chromium probe against the standing `Button.stories.tsx` "Link" swatch, which exercises
  the identical `variant="transparent"` + no-`color` code path.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (screenshot reviewed) | PASS | PASS (mandatory, screenshot reviewed — flush-left, red, icon gap, full-width) | PASS (screenshot reviewed) |
| 375 | PASS | PASS | PASS (mandatory, screenshot reviewed) | PASS |
| 390 | PASS | PASS | PASS (mandatory, screenshot reviewed) | PASS |
| 1024 | PASS | PASS (screenshot reviewed — desktop side drawer, flush-left, no border/fill) | PASS | PASS |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `theme.ts` gains a `transparent` chrome branch (`§6a-link`), additive, `outline`/`default`/`filled` untouched, zero invented values | ✅ | `theme.ts` diff — implemented in `Button.vars` (not `styles`, see root-cause note); probe confirms `outline`/`default`'s resolved values are byte-identical before/after this task |
| 2 | `MobileNavDrawer.tsx` — zero legacy import, zero raw `<button>`, four buttons mapped per table, `MobileNavDrawerProps` byte-identical, `Header.tsx` untouched | ✅ | diff; `grep '@/components/ui/button' MobileNavDrawer.tsx` = 0; `grep '<button'` = 0 |
| 3 | Logout left-indent fixed, flush-left at `uk@320` | ✅ | rendered screenshot, `uk@320/375/390` |
| 4 | Full-width every breakpoint, ≥44px, labels wrap sq/en/uk/it, no h-scroll at 320; no hover-fill | ✅ | rendered matrix + hover probe (`bg: rgba(0,0,0,0)` at rest and hover) |
| 5 | `§6a-link` rendered side-by-side match (transparent/gray-700/red/no-hover-fill/radius-8) | ✅ | probe: `--button-color: var(--mantine-color-gray-7)` = `rgb(52,64,84)` = `#344054` exact; Logout `--button-color: var(--mantine-color-red-light-color)`; radius unchanged (theme default `lg`, untouched) |
| 6 | Logout critical-flow smoke green before+after; handler wiring unchanged | ✅ | `browser.smoke.test.ts` 4/4 before, 4/4 after; `logout()` function body untouched (diff) |
| 7 | i18n: reuse existing `nav.*` keys, no new key, `check:i18n` green | ✅ | `check:i18n` — 2142×4 keys, unchanged count |
| 8 | Gates: tsc/eslint/check:stories/check:i18n/check:file-integrity/check:mojibake/screenshots:assert all green; §18.9 set pasted; Files-Changed + AC table + rendered matrix in log; no git run | ✅ | see Self-validation below |

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/components/layout/MobileNavDrawer.tsx
src/design-system/mantine/theme.ts` = clean, no output. `npm run check:i18n` = PASSED, 2142×4 keys
(unchanged). `npm run check:stories` = PASSED, 115 files / 0 violations, `storybook.*` 563×4 keys
(unchanged — no new story fixtures needed). `npm run check:file-integrity` (both changed files) =
PASSED, 0 NUL / 0 BOM / parses clean. `npm run check:mojibake` = 0 artifacts / 1682 files. `npx vitest
run src/lib/auth/__tests__/browser.smoke.test.ts` = 4/4 before and after. **`npm run build-storybook`**
= rebuilt fresh (mandatory — the first `screenshots:assert` background run's residual `storybook-static/`
on disk was briefly checked and found stale from an earlier task; a fresh `build-storybook` was run before
the hover-probe verification to guarantee it reflected this diff). **`npm run screenshots:assert --
--mantine-only`** = 634/660 PASS, 0 FAIL, 26 AMBIGUOUS (byte-identical to the Task 579 baseline, zero
regression). Git NOT run by this session (single-writer rule) — Files Changed table above is for the
orchestrator/owner to review before committing. Scratch verification scripts (an isolated
`@testing-library/react` CSS-var probe and a headless-Chromium hover probe) were written to
temp/gitignored locations and deleted after use — confirmed via `git status --short` showing only the
two intended source files (+ the pre-existing, expected auto-generated governance-report delta).

**Verdict: Task 587 is functionally complete and verified by every automated gate available in this
environment, including a root-caused-and-fixed CSS-var precedence bug that would otherwise have shipped
the `§6a-link` transparent variant with the wrong (brand-colored) resting text color.**
