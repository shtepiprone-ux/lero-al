# Task 660 — Brand-color `oklch` (globals.css) ↔ hex (theme.ts) drift audit

**Status:** Read-only governance report. No source, token, comment, or style change was made while producing this
document. **Task type:** `Q0` governance/investigation.
**Date:** 2026-07-22
**Scope:** `src/app/globals.css` `--brand-*` scale (light `:root` + dark `.dark`) vs `src/design-system/mantine/theme.ts`
`brand` hex tuple.

---

## 1. Summary

The project has two independently-authored definitions of the brand red, and they do not render the same color:

- **Mantine palette** (`theme.ts` `brand` tuple, `primaryShade: 7`, a bare number — same shade index used in both
  light and dark color schemes): brand-7 renders the literal hex **`#EC5447`** everywhere Mantine resolves
  `color="brand"` / `variant="filled"` / `var(--mantine-color-brand-7)`, in **both** light and dark mode.
- **CSS custom properties** (`globals.css` `--brand-*`, defined as `oklch(...)` and consumed via `var()`): computing
  every shade from spec (OKLab → linear sRGB → gamma, verified against the orchestrator's independently-computed
  brand-700 result — see §7 Appendix) shows **every single shade's actual rendered hex differs from its own
  `/* #... */` self-comment** — none is an exact hex match. The magnitude of the drift varies enormously: from
  barely-perceptible (`brand-50`, ΔE≈2.15) to severe (`brand-600`, ΔE≈22.27). **brand-700 light — the token behind
  `--primary`, prices, focus rings, sidebar-active, and chart-1 — renders `#D25656`, not the declared `#EC5447`**
  (ΔE≈17.05, confirmed against Task 659's independent finding).
- Because `primaryShade: 7` is a flat number, Mantine's dark-mode brand-7 is **still the unadjusted `#EC5447`** — it
  does not get a dark-specific brightening. The CSS-var path, by contrast, **intentionally** redefines `--brand-700`
  for `.dark` to a brighter/more saturated oklch triplet (`0.648 0.200 22`, comment "Brighter #EC5447 on dark"),
  which actually renders `#F04C54` — itself materially off from a flat `#EC5447` (ΔE≈9.10), but directionally
  consistent with the comment's brightening intent. **This is a real design-intent fork, not just a rounding error**:
  the CSS-var scale encodes a dark-mode contrast boost that the Mantine palette does not have. Any correction plan
  must decide whether that boost survives (see §6).
- A second, independently-verified finding: four dark-mode semantic tokens (`--accent`, `--accent-foreground`,
  `--destructive`, `--chart-4`) do **not** consume `var(--brand-*)` in `.dark` at all — they are separate hardcoded
  `oklch(...)` literals (two of which duplicate the *light* brand-700/-family LCH numbers, two of which are an
  unrelated red). Correcting the `--brand-*` scale would **not** move these four dark tokens; they would need a
  separate, explicit edit. This asymmetry is itself a latent inconsistency (§5).
- No shade's oklch value produced an out-of-gamut sRGB result; no clamping occurred anywhere in the scale (light or
  dark).

---

## 2. Conversion method (reproducibility)

Each `oklch(L C H)` was converted via the standard published pipeline: OKLCH → OKLab (`a = C·cos(H·π/180)`,
`b = C·sin(H·π/180)`) → LMS (Björn Ottosson's OKLab matrices) → linear sRGB → gamma-encoded sRGB → 8-bit hex, with
out-of-gamut detection before clamping. Perceptual drift is reported as CIE76 ΔE (sRGB → linear → CIE XYZ D65 → CIE
Lab → Euclidean distance in Lab space) between the computed actual hex and (a) the shade's own `/* #... */` comment
and (b) the corresponding `theme.ts` tuple entry.

**Validation of the method:** brand-700 light computed here as `#D25656` with a white-text contrast ratio of
**4.03:1**, both exactly matching the orchestrator's independently-computed and Task-659-verified result. The method
is confirmed correct before being extended to the other eleven shades.

Full script output is in the Appendix (§7). The script (`oklch-convert.js`) was run from the scratch directory and is
**not committed** to the repository, per task instructions.

**Classification bands used (per task R2):** exact-match = ΔE 0 (hex-identical); minor = 0 < ΔE < 2; material =
ΔE ≥ 2.

---

## 3. Per-shade table — LIGHT (`:root`, `globals.css` lines 302–313)

| Shade | oklch | Self-comment hex | **Actual computed hex** | `theme.ts` hex (index) | ΔE (actual vs comment) | ΔE (actual vs theme.ts) | Verdict |
|---|---|---|---|---|---|---|---|
| brand-50  | `oklch(0.969 0.010 18)` | `#FDEEED` | **`#FCF2F2`** | `#FDEEED` (0) | 2.15 | 2.15 | Material (borderline — near-imperceptible in practice) |
| brand-100 | `oklch(0.932 0.020 20)` | `#FBDDDA` | **`#F6E4E3`** | `#FBDDDA` (1) | 4.91 | 4.91 | Material |
| brand-200 | `oklch(0.895 0.031 20)` | `#F9CCC8` | **`#F0D5D4`** | `#F9CCC8` (2) | 7.48 | 7.48 | Material |
| brand-300 | `oklch(0.858 0.042 21)` | `#F7BBB5` | **`#EBC6C4`** | `#F7BBB5` (3) | 9.93 | 9.93 | Material |
| brand-400 | `oklch(0.820 0.054 21)` | `#F6AAA3` | **`#E5B7B5`** | `#F6AAA3` (4) | 13.29 | 13.29 | Material |
| brand-500 | `oklch(0.745 0.078 22)` | `#F2877E` | **`#DA9996`** | `#F2877E` (5) | 19.71 | 19.71 | Material |
| brand-600 | `oklch(0.707 0.093 22)` | `#F0766C` | **`#D58986`** | `#F0766C` (6) | 22.27 | 22.27 | Material (largest drift in the scale) |
| **brand-700** | `oklch(0.614 0.158 23)` | `#EC5447` — "primary" | **`#D25656`** | `#EC5447` (7, primaryShade) | 17.05 | 17.05 | **Material — confirms Task 659** |
| brand-800 | `oklch(0.541 0.168 23)` | `#BD4339` — "hover" | **`#BD393E`** | `#BD4339` (8) | 6.58 | 6.58 | Material |
| brand-850 | `oklch(0.497 0.155 23)` | `#A53B32` | **`#A93236`** | *no entry — theme.ts tuple has no 850* | 6.23 | n/a | Material (self-comment only; not represented in Mantine at all) |
| brand-900 | `oklch(0.452 0.142 23)` | `#8E322B` | **`#952A2E`** | `#8E322B` (9) | 6.28 | 6.28 | Material |
| brand-950 | `oklch(0.132 0.022 23)` | `#180807` | **`#0F0504`** | *no entry — theme.ts tuple has no 950* | 3.48 | n/a | Material (self-comment only) |

Out-of-gamut: **none.** Every light shade's raw linear-sRGB components (see Appendix) resolve inside `[0,1]` before
clamping — no shade required gamut clamping, so a "true" in-gamut sRGB hex exists for all twelve.

**Honesty check on R2/§11 ("a shade actually matches its comment... not everything is drifted"):** applying the
task's literal ΔE bands, **zero** light shades are an exact hex match and **zero** fall in the "minor" (<2) band —
every shade is technically "material" by the stated threshold. The two lowest-drift shades are `brand-50` (ΔE 2.15,
practically imperceptible — a one-off rounding step apart) and `brand-950` (ΔE 3.48, also very close — a near-black
where small RGB differences barely register). These two are cited here as the closest-to-matching pair, satisfying
the spirit of the "not everything is uniformly wrong" check even though none crosses into the report's own "minor"
band. The report does not claim a false exact-match to force that narrative.

## 4. Per-shade table — DARK (`.dark`, `globals.css` lines 429–432, overrides only)

Only three shades are redefined inside `.dark`; all other `--brand-*` variables (100, 200, 300, 400, 500, 600, 850,
900) are **not** overridden and therefore keep resolving to the `:root` (light) oklch values in dark mode too — the
cascade falls through. That is itself worth stating plainly: **dark mode does not have its own value for 9 of the 12
brand shades**; it silently reuses light-mode oklch for them.

| Shade | oklch | Comment | **Actual computed hex** | Reference (nearest declared target) | ΔE vs reference | Verdict |
|---|---|---|---|---|---|---|
| brand-50  | `oklch(0.220 0 0)` | "Accent hover bg on dark" | **`#1B1B1B`** | n/a — intentionally achromatic (C=0), not part of the red family | n/a | Not comparable — by design this is a neutral gray, not a brand-red drift case |
| **brand-700** | `oklch(0.648 0.200 22)` | "Brighter #EC5447 on dark" | **`#F04C54`** | `#EC5447` (flat Mantine target; comment names EC5447 as the base being brightened) | 9.10 | Material — but *directionally correct* (it genuinely is brighter/more saturated than #EC5447, matching the comment's intent even though the magnitude is uncalibrated) |
| brand-800 | `oklch(0.700 0.190 22)` | "Hover — lighter on dark" | **`#FF6367`** | `#BD4339` (light brand-800/theme.ts value, cited only as the nearest declared family reference — the dark comment gives no literal hex target) | 20.44 | Not a like-for-like drift claim — dark brand-800 was never given its own hex target; shown only for scale |
| brand-100/200/300/400/500/600/850/900/950 | *(not overridden in `.dark`)* | — | *same as §3 light table* | — | — | Dark mode silently inherits the light oklch value for these nine shades |

**Contrast:** white text on brand-700 dark (`#F04C54`) computes to **3.58:1** — below the 4.5:1 AA text threshold
(comparable to the light brand-700's 4.03:1, which is itself only AA for large text/UI, not body text). This is a
computed fact surfaced for completeness; it was not a requirement of R1/R2 but follows directly from the same
conversion and is relevant to any correction decision in §6.

**Mantine dark-mode comparison (verified from `theme.ts`):** `theme.ts` sets `primaryShade: 7` as a **bare number**
(line 152), not a `{ light, dark }` object. Per the theme's own header comment (theme.ts:34, Task 620) this makes
Mantine resolve brand-7 to the **same flat `#EC5447` hex in both light and dark color schemes** — Mantine has no
dark-specific brightening for the brand color at all. The CSS-var path's `.dark` override is a deliberate contrast
accommodation that the Mantine palette-path does not share. **This is a genuine design-intent fork between the two
systems, not merely a rounding artifact** — see §6.

Out-of-gamut: **none** of the three dark overrides required clamping.

---

## 5. Consumer / surface map (R3)

Re-grepped `var(--brand-` and `--color-brand-`/`--color-` bridge entries in `globals.css` directly (not just the
task's §3 list) to confirm completeness; found one addition not itemized in §3: the `@theme inline` bridge (lines
45–49) exposes **five** `--color-brand-*` Tailwind utility variables (`50`, `100`, `700`, `800`, `950`), not just
`700`.

### 5a. CSS-var path — currently off-brand (renders the computed "actual" hex from §3/§4, not the Mantine hex)

| Token | Brand shade | Light actual | Dark actual | Representative surface |
|---|---|---|---|---|
| `--primary` → `--color-primary` (Tailwind `bg-primary`) | brand-700 | `#D25656` | `#F04C54` | Legacy/Tailwind-path primary buttons and any `bg-primary`/`text-primary` utility consumer |
| `--primary-hover` → `--color-primary-hover` | brand-800 | `#BD393E` | `#FF6367` | Hover state for the token above |
| `--ring` → `--color-ring` | brand-700 | `#D25656` | `#F04C54` | Focus-visible ring (`outline-ring/50`, `@layer base` global `*` rule, `globals.css:484`) |
| `--price-color` → `--color-price` bridge is `--price` (neutral), but `--price-color` itself | brand-700 | `#D25656` | `#F04C54` | Listing price text (CSS-var-path consumers only — see 5b for the Mantine-path price text) |
| `--price-reduced` → `--color-price-reduced` | brand-700 | `#D25656` | `#F04C54` | Reduced-price text |
| `--badge-reduced` → `--color-badge-reduced` | brand-700 | `#D25656` | `#F04C54` | "Reduced" badge background (CSS-var-path consumers) |
| `--sidebar-primary` → `--color-sidebar-primary` | brand-700 | `#D25656` | `#F04C54` | Admin/app-shell sidebar active-item indicator |
| `--sidebar-ring` → `--color-sidebar-ring` | brand-700 | `#D25656` | `#F04C54` | Sidebar focus ring |
| `--chart-1` → `--color-chart-1` | brand-700 | `#D25656` | `#F04C54` | Chart series 1 |
| `--accent` → `--color-accent` | brand-50 (light only) | `#FCF2F2` | *not wired in dark — see below* | Subtle brand-tint hover background |
| `--accent-foreground` → `--color-accent-foreground` | brand-800 (light only) | `#BD393E` | *not wired in dark — see below* | Text on the accent tint |
| `--destructive` → `--color-destructive` | brand-900 (light only) | `#952A2E` | *not wired in dark — see below* | Destructive/error accents that alias the brand-red family |
| `--chart-4` → `--color-chart-4` | brand-900 (light only) | `#952A2E` | *not wired in dark — see below* | Chart series 4 |
| `--color-brand-50` / `-100` / `-700` / `-800` / `-950` (Tailwind utility classes, `bg-brand-700` etc.) | direct | per §3 | per §4 | Any component using the raw Tailwind brand-* utility class instead of a semantic token |

**Dark-mode asymmetry (verified fact, lines 441/442/444/475):** `--accent`, `--accent-foreground`, `--destructive`,
and `--chart-4` are **not** re-derived from `var(--brand-*)` in `.dark` — they are separate hardcoded `oklch(...)`
literals:
- `--accent: oklch(0.614 0.158 23 / 15%)` — this duplicates the exact L/C/H of the *light* `--brand-700` (at 15%
  alpha), independently of the token graph. Its base color (`#D25656` if fully opaque) carries the *same* drift as
  light brand-700, but a fix to `--brand-700` would **not** propagate here since it's not a `var()` reference.
- `--accent-foreground: oklch(0.648 0.200 22)` — duplicates dark `--brand-700`'s exact LCH (`#F04C54`), same
  non-propagation risk.
- `--destructive` / `--chart-4`: both `oklch(0.520 0.215 17)` → computed **`#C60039`** — an independent red, not a
  duplicate of any brand shade at all. Not part of the brand drift, listed here only because it consumes the same
  "family" role (destructive/chart) that brand-900 fills in light mode, and a correction plan should not assume it
  moves with the brand scale.

### 5b. Mantine-palette path — currently on-brand (`#EC5447`, both light and dark, per §4)

Representative production/story usages found by re-grepping `color="brand"`, `variant="filled"` + `color={...}`, and
`var(--mantine-color-brand-`. Per the task's own scope note, this is a **representative sample, not an exhaustive
component census**:

- `src/app/[locale]/page.tsx:81` — `<Building2 color="var(--mantine-color-brand-7)" />` (direct Mantine CSS-var
  usage, homepage).
- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx:385-386` — `color="brand" variant="filled"` on
  the card's price/badge chrome (also `variant="filled"` badges at lines 180/304 using shade-mapped `color={b.color}`
  props).
- `src/modules/listings/components/ListingCard.tsx` — inline comment (line 67) explicitly cross-references "the
  page's own `color=\"brand\"` price text," confirming a sibling Mantine-path price surface exists.
- Additional files matched by the same grep, not individually opened for this audit (representative list only):
  `src/components/shared/HowItWorksSteps.tsx`, `src/components/layout/UserMenu.tsx`,
  `src/components/layout/MobileNavDrawer.tsx`, `src/modules/notifications/components/NotificationCenter.tsx`,
  `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`,
  `src/design-system/mantine/patterns/MantineCountButton.tsx`,
  `src/design-system/mantine/patterns/RangeDatePicker.tsx`, and the primitive Storybook files
  `Badge.stories.tsx` / `Avatar.stories.tsx` / `Table.stories.tsx` / `Button.stories.tsx`.

All of the above render the flat Mantine tuple hex (`#EC5447` at shade 7) in **both** light and dark mode, per the
`primaryShade: 7` bare-number finding in §4 — they do not experience the CSS-var scale's light/dark split at all.

---

## 6. Blast radius of correcting the `globals.css` oklch scale to the `theme.ts` hexes (R4)

This section quantifies the effect of Option A from §7 (correct the CSS-var oklch triplets so they render exactly
the `theme.ts` tuple hexes), token by token, light and dark. It does not implement anything.

### Light — before → after

| Token(s) | Before (current actual) | After (theme.ts target) | Visible surfaces affected |
|---|---|---|---|
| `--primary`, `--ring`, `--price-color`, `--price-reduced`, `--badge-reduced`, `--sidebar-primary`, `--sidebar-ring`, `--chart-1` (brand-700) | `#D25656` | `#EC5447` | Primary CTAs (Tailwind path), focus rings project-wide, listing price/reduced-price text, "reduced" badges, admin sidebar active state + its focus ring, chart series 1 — all shift to a visibly more orange-leaning, more saturated red (ΔE 17.05 shift) |
| `--primary-hover`, `--accent-foreground` (brand-800) | `#BD393E` | `#BD4339` | Hover state of the above; accent-tint text — smaller, still-visible shift (ΔE 6.58) |
| `--accent` (brand-50) | `#FCF2F2` | `#FDEEED` | Subtle hover-tint backgrounds — smallest shift in the set (ΔE 2.15), likely imperceptible in product |
| `--destructive`, `--chart-4` (brand-900) | `#952A2E` | `#8E322B` | Destructive-styled accents, chart series 4 (ΔE 6.28) |
| Tailwind `bg-brand-700`/`bg-brand-800`/`bg-brand-50`/`bg-brand-950` utility consumers | per §3 | per theme.ts (no target for `950`, since it's absent from the tuple — see open question below) | Any component using the raw utility class |

### Dark — before → after (and the open design question)

Correcting dark brand-700/800 "to the theme.ts hex" is **not a single well-defined operation**, because `theme.ts`
only has one flat hex per shade (no separate dark entry) while the current CSS-var dark override is a deliberate
brightness/saturation boost for contrast. Two distinct corrections are possible and the owner must pick one:

- **Match Mantine exactly (flat, no dark boost):** `--brand-700` `.dark` → renders `#EC5447` (same as light), losing
  today's contrast accommodation; white-on-`#EC5447` contrast would need to be re-measured against dark surfaces
  (not computed in this report — out of the stated R1/R2 scope, but the exact question a follow-up task must answer
  before shipping this option).
- **Preserve the dark brightening, but calibrate it correctly to `#EC5447`'s hue/chroma instead of an approximated
  one:** `--brand-700` `.dark` would still be brighter than light, but recomputed from `#EC5447`'s true OKLab
  coordinates rather than the current independently-authored `0.648 0.200 22` triplet. This keeps the accessibility
  intent but removes the current ΔE≈9.10 drift from that intent.

Either dark path also has to decide whether `--accent`, `--accent-foreground`, `--destructive`, and `--chart-4` in
`.dark` (currently hardcoded, not `var()`-linked — §5a) get updated in the same pass, since correcting only the
`--brand-*` variables would silently leave those four dark tokens exactly as they are today (they don't reference
the scale at all).

**Tokens unaffected by either correction path:** `brand-850`/`brand-950` have no `theme.ts` entry, so "correcting to
theme.ts" has no defined target for them — the owner must decide whether to (a) leave them as authored oklch,
(b) hand-derive replacement oklch from a chosen hex, or (c) add `850`/`950` entries to the Mantine tuple for
consistency.

---

## 7. Recommendation and required owner decision (R5)

**Recommendation:** correct the `globals.css` `--brand-*` oklch triplets so they render the `theme.ts`-declared
`#EC5447` family, rather than converging `theme.ts` onto the currently-rendered (`#D25656`-family) values. Rationale:
(a) `docs/mantine-responsive-design-system.md:131/135` and `docs/mantine-tailadmin-migration-tracker.md:6` already
declare `#EC5447` as the decided brand color (2026-06-25); (b) transactional emails already hardcode `#EC5447`
(`docs/integrations.md:190/280`) and are explicitly out of scope to change (A2) — converging the other direction
would leave emails as the odd one out; (c) every Mantine-path production surface already renders `#EC5447` today, so
correcting the CSS-var scale *removes* the split rather than creating a new one; converging `theme.ts` downward would
require re-deriving ten hex values with no equivalent existing documentation basis.

**If the owner accepts this recommendation, the `#EC5447` self-comments become correct** (they already state the
intended value; only the oklch triplets that fail to reproduce it need to change). The `#BD4339`/`#8E322B`/etc.
sibling comments are likewise already correct targets — only the oklch numbers are wrong.

**Exact owner decision required (this report presents the data; it does not resolve this):**

1. **Correct the oklch scale to render the theme.ts hexes** (recommended) — an app-wide primary-color visual shift
   (every CSS-var-path surface in §5a moves per §6's before/after table). This is a real Q3/Q4-scope follow-up task
   (rendered visual regression + locale/viewport matrix), not a Q0 doc change.
   - Sub-decision (dark mode): flatten to match Mantine exactly, or preserve a recalibrated brightening boost (§6).
   - Sub-decision (850/950 and the four hardcoded dark tokens): explicit scope call, since `theme.ts` has no target
     for them.
2. **Converge `theme.ts` onto the currently-rendered CSS-var values instead** — would contradict the already-decided
   `#EC5447` brand documentation and the email hardcodes; not recommended, but included as the alternative the report
   must frame per R5.
3. **Leave the split as-is** — not recommended; the drift is undocumented today and materially visible on the
   highest-traffic tokens (`--primary`, price text, focus ring), and Task 659's hero already inherited the off-brand
   value once.

---

## 8. Appendix — conversion script output (reproducible; script not committed)

Script location while running: scratch directory `oklch-convert.js` (Node, no dependencies). Full stdout, unedited:

```
=== LIGHT (:root) ===
brand-50   oklch(0.969 0.01 18)  ->  #FCF2F2  rgb(252,242,242)  outOfGamut=false  raw=[0.9863, 0.9499, 0.9495]
brand-100  oklch(0.932 0.02 20)  ->  #F6E4E3  rgb(246,228,227)  outOfGamut=false  raw=[0.9639, 0.8925, 0.8899]
brand-200  oklch(0.895 0.031 20)  ->  #F0D5D4  rgb(240,213,212)  outOfGamut=false  raw=[0.9431, 0.8344, 0.8308]
brand-300  oklch(0.858 0.042 21)  ->  #EBC6C4  rgb(235,198,196)  outOfGamut=false  raw=[0.9213, 0.7769, 0.7705]
brand-400  oklch(0.82 0.054 21)  ->  #E5B7B5  rgb(229,183,181)  outOfGamut=false  raw=[0.8993, 0.7173, 0.7100]
brand-500  oklch(0.745 0.078 22)  ->  #DA9996  rgb(218,153,150)  outOfGamut=false  raw=[0.8531, 0.6004, 0.5890]
brand-600  oklch(0.707 0.093 22)  ->  #D58986  rgb(213,137,134)  outOfGamut=false  raw=[0.8334, 0.5378, 0.5268]
brand-700  oklch(0.614 0.158 23)  ->  #D25656  rgb(210,86,86)  outOfGamut=false  raw=[0.8250, 0.3370, 0.3364]
brand-800  oklch(0.541 0.168 23)  ->  #BD393E  rgb(189,57,62)  outOfGamut=false  raw=[0.7410, 0.2245, 0.2418]
brand-850  oklch(0.497 0.155 23)  ->  #A93236  rgb(169,50,54)  outOfGamut=false  raw=[0.6619, 0.1950, 0.2111]
brand-900  oklch(0.452 0.142 23)  ->  #952A2E  rgb(149,42,46)  outOfGamut=false  raw=[0.5832, 0.1648, 0.1800]
brand-950  oklch(0.132 0.022 23)  ->  #0F0504  rgb(15,5,4)  outOfGamut=false  raw=[0.0599, 0.0187, 0.0175]

=== DARK (.dark) overrides only ===
brand-50   oklch(0.22 0 0)  ->  #1B1B1B  rgb(27,27,27)  outOfGamut=false  raw=[0.1040, 0.1040, 0.1040]
brand-700  oklch(0.648 0.2 22)  ->  #F04C54  rgb(240,76,84)  outOfGamut=false  raw=[0.9402, 0.2968, 0.3294]
brand-800  oklch(0.7 0.19 22)  ->  #FF6367  rgb(255,99,103)  outOfGamut=false  raw=[0.9981, 0.3876, 0.4026]

=== Contrast checks ===
white on brand-700 light (#D25656): 4.03:1
white on brand-700 dark (#F04C54): 3.58:1

=== Cross-check: computed actual vs self-comment vs theme.ts (CIE76 Delta E) ===
brand-50   actual=#FCF2F2  comment=#FDEEED dE=2.15  theme.ts=#FDEEED dE=2.15
brand-100  actual=#F6E4E3  comment=#FBDDDA dE=4.91  theme.ts=#FBDDDA dE=4.91
brand-200  actual=#F0D5D4  comment=#F9CCC8 dE=7.48  theme.ts=#F9CCC8 dE=7.48
brand-300  actual=#EBC6C4  comment=#F7BBB5 dE=9.93  theme.ts=#F7BBB5 dE=9.93
brand-400  actual=#E5B7B5  comment=#F6AAA3 dE=13.29  theme.ts=#F6AAA3 dE=13.29
brand-500  actual=#DA9996  comment=#F2877E dE=19.71  theme.ts=#F2877E dE=19.71
brand-600  actual=#D58986  comment=#F0766C dE=22.27  theme.ts=#F0766C dE=22.27
brand-700  actual=#D25656  comment=#EC5447 dE=17.05  theme.ts=#EC5447 dE=17.05
brand-800  actual=#BD393E  comment=#BD4339 dE=6.58  theme.ts=#BD4339 dE=6.58
brand-850  actual=#A93236  comment=#A53B32 dE=6.23  theme.ts=n/a dE=n/a (no theme.ts entry)
brand-900  actual=#952A2E  comment=#8E322B dE=6.28  theme.ts=#8E322B dE=6.28
brand-950  actual=#0F0504  comment=#180807 dE=3.48  theme.ts=n/a dE=n/a (no theme.ts entry)

=== Dark brand-700/800 vs their light-mode comment reference ===
brand-700  (dark) actual=#F04C54  vs EC5447-family comment=#EC5447  dE=9.10
brand-800  (dark) actual=#FF6367  vs EC5447-family comment=#BD4339  dE=20.44

=== Supplementary: dark hardcoded literals not wired to --brand-* (§5a) ===
dark --destructive/--chart-4 oklch(0.520 0.215 17) => #C60039
dark --accent base (0.614 0.158 23, ignoring 15% alpha) => #D25656 (same as light brand-700 actual)
```

Conversion matrices used: standard OKLab↔linear-sRGB matrices (Björn Ottosson's published reference); CIE76 ΔE via
sRGB → linear → CIE XYZ (D65) → CIE Lab, Euclidean distance.

---

## 9. Limitations

- The Mantine-palette consumer list in §5b is representative, not an exhaustive component census — stated explicitly
  per the task's own scope allowance.
- The dark-mode contrast figure (3.58:1 for white-on-brand-700-dark) is a computed fact included for completeness; it
  was not a required AC but follows directly from the same conversion pipeline used for the required checks.
- §6's dark-mode "flatten vs recalibrate the brightening boost" sub-decision is presented as an open question for the
  owner, not resolved here — no dark-mode contrast target against actual dark surface colors was computed, since
  that would require assuming a chosen correction path, which is out of this task's scope.
