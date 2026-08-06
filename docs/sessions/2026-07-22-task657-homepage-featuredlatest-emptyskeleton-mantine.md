# Session Archive: Task 657 — Homepage FeaturedListings/LatestListings empty-state + skeleton wrappers → Mantine — 2026-07-22

## Task path and status

`tasks/kickoff_prompt_Task_657_HomepageFeaturedLatest_EmptyAndSkeleton_Mantine.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced the last residual raw-HTML in the two homepage listing-grid components with Mantine
primitives, per §7 scope:

- **Empty states (A1/A3):** raw `<p className="text-center text-muted-foreground py-8">` →
  Mantine `<Text ta="center" c="var(--muted-foreground)" py="2rem">`, in both
  `FeaturedListings.tsx` and `LatestListings.tsx`.
- **Skeleton wrappers (A2/A4):** raw `<div>` outer/inner wrappers in `CardSkeleton`
  (`FeaturedListings.tsx`) and `RowSkeleton` (`LatestListings.tsx`) → Mantine `Box`, **keeping the
  exact same Tailwind className chain** (`rounded-xl border bg-card overflow-hidden` /
  `p-3 space-y-2`, plus `flex flex-col` on the Latest outer wrapper). `Box` carries no
  component-level default props/CSS (unlike `Card`/`Paper` — Task 650 finding), so the Tailwind
  utilities resolve identically to before; this makes the wrapper swap a pure element-type change
  with zero token-value risk, verified below via computed style.
- Both skeleton functions (`CardSkeleton`, `RowSkeleton`) are now **exported** so
  `FeaturedListings.stories.tsx` and a new `LatestListings.stories.tsx` can render the real
  production markup for `Loading`/`Empty` scenario stories (R7 — no divergent stand-in).

No color/spacing/radius/border value was changed; the empty-state `Text` reproduces the prior
Tailwind-driven values exactly (see Computed-style confirmation below), and the skeleton wrapper
reproduces them by construction (same className, same cascade).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Featured empty state via Mantine `Text`, not raw `<p>` | `git diff` — `FeaturedListings.tsx`; real-browser capture, all 4 locales × 5 Q2 widths (see Rendered evidence) |
| R2/AC2 | Latest empty state via Mantine `Text`, not raw `<p>` | `git diff` — `LatestListings.tsx`; same capture matrix |
| R3/AC3 | Featured `CardSkeleton` wrapper uses Mantine `Box`, not raw `<div>` | `git diff`; computed-style check confirms `borderRadius:18px`, `border:1px solid oklch(0.922 0 0)`, `background:oklch(1 0 0)`, `overflow:hidden`, inner `padding:12px` — unchanged from pre-migration values |
| R4/AC4 | Latest `RowSkeleton` wrapper uses Mantine `Box`, `flex-col` preserved | Same computed-style check — `display:flex; flex-direction:column` confirmed, plus identical radius/border/background/padding |
| R5/AC5 | Visual parity (color/spacing/radius/border/layout) at every Q2 viewport/locale | Computed-style parity table below (byte-identical to the pre-change Tailwind values) + 120-cell rendered screenshot matrix, 0 render failures |
| R6/AC1,2 | All 4 locales resolve; no new i18n keys | `npm run check:i18n` → 2210/2210 keys, 4 locales, **no delta** (same key count as pre-task); reused `listing.no_premium_listings`/`listing.no_listings` |
| R7/AC6 | Loading + empty states gain canonical Story coverage rendering the same Mantine primitives, toolbar-reactive; `check:story-coverage` passes | Added `Loading`/`Empty` exports to `FeaturedListings.stories.tsx` (imports the real exported `CardSkeleton`); created `LatestListings.stories.tsx` with `Default`/`LocaleStress`/`Loading`/`Empty` (imports the real exported `RowSkeleton`) — all render functions read `context.globals.locale`, no locale pins. `npm run check:story-coverage` → PASSED (neither component is in `mantine-migration-scope.json`, so this gate is a no-op pass, correctly — these are legacy-path `System/*` stories, not `Patterns/Mantine/*`) |
| R8/AC7 | `npm run build` exits 0 | See Validation evidence — exit 0, `✓ Compiled successfully in 111s` |

## Current versus required behavior

**Featured — empty (A1):** unchanged trigger condition (`!listings.length`, after `loading`
resolves false); header renders identically; the message below it is now a Mantine `Text` instead
of a raw `<p>`, same centered/dimmed/2rem-padded rendering.

**Latest — empty (A3):** unchanged trigger condition; same `Text` swap, no header (Latest has none,
unchanged).

**Featured — loading (A2):** unchanged trigger (`loading === true`), same 3-card grid, same
`Skeleton` children (heights/widths/aspect ratio all byte-identical — diff shows only the wrapper
tag changed `div`→`Box`, no prop changed on any `Skeleton`).

**Latest — loading (A4):** unchanged trigger, same 4-row grid, same `Skeleton` children, wrapper
`div`→`Box` with `flex flex-col` preserved.

No control, entry point, state (loading/empty/populated), or grid step was added, removed, or
reordered. Populated-grid branch, header, and `ListingCard` are untouched (`git diff` shows zero
lines changed in those branches).

## Positive and negative flows

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Empty data | Yes | Centered dimmed Mantine `Text`, all 4 locales, no overflow | 40 empty-state cells captured (2 components × 4 locales × 5 widths), 0 render failures, 0 cells with missing/short text |
| Loading data | Yes | Mantine-wrapped skeleton cards, visual parity | 40 loading-state cells captured, computed-style parity confirmed (see below) |
| Populated data | Yes (preserve, unchanged) | Real `ListingCard` grid renders exactly as before | `Default` story screenshot inspected (en@1440) — grid, cards, badges all render normally; `git diff` shows zero changes to this branch |
| Validation / Authorization-RLS / Offline / Concurrent writer | No | Public read-only render, no form/auth/network logic touched | N/A (per kickoff §11) |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/FeaturedListings.tsx` | A1 empty `<p>`→`Text`; A2 `CardSkeleton` wrapper `div`→`Box` (className unchanged); `CardSkeleton` now exported for story reuse |
| `src/modules/listings/components/LatestListings.tsx` | A3 empty `<p>`→`Text`; A4 `RowSkeleton` wrapper `div`→`Box` (className unchanged); `RowSkeleton` now exported for story reuse |
| `src/stories/FeaturedListings.stories.tsx` | Added `Loading`/`Empty` scenario stories importing the real production `CardSkeleton` + a same-props `Text` empty message (R7) |
| `src/stories/LatestListings.stories.tsx` | **New.** `Default`/`LocaleStress`/`Loading`/`Empty` for the previously-unstoried `LatestListings` grid, mirroring the Featured hand-mirror pattern (A-3); `Loading`/`Empty` import the real production `RowSkeleton`/render the same `Text` props |
| `docs/backlog.md` | Concise active-state entry for Task 657 |
| `docs/sessions/2026-07-22-task657-homepage-featuredlatest-emptyskeleton-mantine.md` | This session log |

**Confirmed NOT touched** (`git diff --stat` empty for these): `ListingCard.tsx`,
`MantineListingCardPattern.tsx`, `page.tsx` (homepage), `messages/*.json`, `theme.ts`, and the
populated-grid/header branches inside both touched files.

**Pre-existing modifications, not from this session** (present in `git status` before this session
started, unrelated in-progress work on this branch — not touched, read, or regenerated):
`.claude/hooks/sonnet-executor-bootstrap.ps1`, `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`.

## Token trace / resolved values (parity proof, per kickoff §3/§10)

- `--muted-foreground` = `var(--neutral-500)` = `oklch(0.556 0 0)` (`globals.css:322,337`). Mantine's
  own `c="dimmed"` is **not** overridden in `theme.ts` (grepped, no match) and would resolve to
  Mantine's stock gray-6, a **different** value — correctly NOT used. Instead bound directly to the
  project token: `c="var(--muted-foreground)"` (precedent: `MantineListingGalleryPattern.tsx:91`
  uses the identical `c="var(--color-overlay-foreground)"` pattern). Real-browser computed
  `color: oklch(0.556 0 0)` confirmed on both `Text` instances — exact match to the pre-change
  `text-muted-foreground` utility.
- `py-8` = `2rem` (Tailwind's generic 4px-multiple spacing scale, not a semantic token). Mantine's
  own `spacing.xl` = `1.5rem` (`theme.ts:190`, TailAdmin 24px) — **does not match** 2rem, confirmed
  per kickoff A-2. Used the literal `py="2rem"` (Mantine's spacing resolver passes through
  non-token string values as raw CSS) instead of a mismatched token. Real-browser computed
  `padding-top`/`padding-bottom: 32px` confirmed on both `Text` instances.
- `rounded-xl` (legacy scale) = `var(--radius-xl)` = `calc(var(--radius) * 1.5)` =
  `calc(0.75rem * 1.5)` = `1.125rem` = **18px** (`globals.css:93,399`). Mantine's own
  `radius.xl` = `0.75rem` (12px, `theme.ts:199`) and `radius['2xl']` = `1rem` (16px) — **neither
  matches**, confirming the kickoff's flagged mismatch. Resolved by keeping the exact Tailwind
  className (`rounded-xl border bg-card overflow-hidden`) on the Mantine `Box` rather than
  translating to a Mantine radius token — `Box` has no component-level CSS to conflict with the
  utility classes (Task 650 finding), so the cascade is unchanged. Real-browser computed
  `border-radius: 18px` confirmed on both skeleton wrappers.
- `border` (unqualified) = `1px solid var(--border)` via the global `* { @apply border-border }`
  base rule (`globals.css:483-484`) = `var(--neutral-200)` = `oklch(0.922 0 0)` (#EBEBEB). Computed
  `border: 1px solid oklch(0.922 0 0)` confirmed on both wrappers.
- `bg-card` = `var(--card)` = `var(--neutral-0)` = `oklch(1 0 0)` (pure white). Computed
  `background-color: oklch(1 0 0)` confirmed on both wrappers.
- `p-3` = `0.75rem` = 12px — happens to be an **exact** match to Mantine's own `spacing.sm`
  (`theme.ts:187`), but the className was left as-is (no behavior change either way). Computed
  `padding: 12px` confirmed on both inner wrappers.
- `space-y-2` = `0.5rem` (8px, Tailwind child-margin technique, unaffected by the wrapper's
  element-type change — still applies via the same `> * + *` selector on the same className).

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical source | Disposition | Consumed style/token path |
|---|---|---|---|---|
| Empty-state message | Inspected `src/design-system/mantine/patterns/index.ts`, `MantineEmptyLoadingErrorState.tsx` (heavier icon+title+description variant, `minHeight:200` — confirmed visual mismatch to the current single-line state, correctly excluded per kickoff A-1) | Mantine `Text` primitive (`@mantine/core`) | **Reuse** (primitive, not a shared pattern) | `ta="center" c="var(--muted-foreground)" py="2rem"` — all three values traced to existing project tokens, none invented |
| Skeleton card/row wrapper | Inspected `src/design-system/mantine/patterns/**` — no skeleton-card pattern exists; `MantineListingCardPattern.tsx` has no skeleton variant | Mantine `Box` primitive | **Reuse** (primitive composition, no new pattern) | Same Tailwind className chain the `<div>` already carried — no new token, no copied local style; `Skeleton` children (already Mantine) untouched |

No new shared component, pattern, or design token was created. Both dispositions match the
kickoff's own pre-authorized §13 "Canonical UI decision record" table exactly.

## Computed-style parity confirmation (real browser, Playwright/Chromium, static Storybook build)

Ran `npm run build-storybook` (clean build, 0 errors) → served `storybook-static/` locally →
captured via Playwright/Chromium against the actual production `Text`/`Box`/`Skeleton` markup
(not a mock — these stories statically import `CardSkeleton`/`RowSkeleton` from the real
component files).

**Empty-state `<p>`/`Text` (uk@320, representative — identical pattern across all locales/widths):**

| Property | Computed value | Traced pre-change Tailwind equivalent | Match |
|---|---|---|---|
| `text-align` | `center` | `text-center` | ✅ |
| `color` | `oklch(0.556 0 0)` | `text-muted-foreground` → `var(--muted-foreground)` | ✅ |
| `padding-top`/`padding-bottom` | `32px` | `py-8` → 2rem | ✅ |
| Text horizontal centering (Range geometry) | box left=32/right=288 (center 160), text left=58.8/right=261.2 (center 160.0) | — | ✅ centered exactly within content width |

**Skeleton wrapper (`CardSkeleton`/`RowSkeleton`, en@390, representative):**

| Property | Featured `CardSkeleton` | Latest `RowSkeleton` | Traced pre-change value | Match |
|---|---|---|---|---|
| `border-radius` | `18px` | `18px` | `rounded-xl` (legacy scale) = 18px | ✅ |
| `border` | `1px solid oklch(0.922 0 0)` | `1px solid oklch(0.922 0 0)` | `border` → `var(--border)` | ✅ |
| `background-color` | `oklch(1 0 0)` | `oklch(1 0 0)` | `bg-card` → `var(--card)` | ✅ |
| `overflow` | `hidden` | `hidden` | `overflow-hidden` | ✅ |
| `display`/`flex-direction` | `block` (no flex needed) | `flex`/`column` | `flex flex-col` (Latest only) | ✅ |
| inner wrapper `padding` | `12px` | `12px` | `p-3` | ✅ |

## Rendered evidence (Q2 Standard UI matrix)

120-cell matrix: 6 stories (`FeaturedListings`/`LatestListings` × `Default`/`Loading`/`Empty`) ×
4 locales (sq/en/uk/it) × 5 Q2 widths (320/390/768/1024/1440). **0 render failures, 0 cells with
missing/empty content** (manifest-verified via `#storybook-root` bounding box + innerText length).

- `uk@320` (mandatory cell) inspected directly for all 4 changed states — Ukrainian empty-state
  text wraps to 2 lines without overflow; skeleton cards render with correct radius/border/spacing.
- All 4 locales inspected at 320 for empty-state text length (sq/en/uk/it all non-trivial,
  no fallback-to-English observed).
- `Default` (populated grid) spot-checked at en@1440 — unaffected, confirms the out-of-scope
  populated branch renders unchanged.
- `Latest` grid at 1440 correctly shows 2 columns (not 3) — Tailwind's `2xl:` breakpoint is 1536px,
  so 1440 is below it; this is pre-existing grid behavior, unrelated to this task, confirms no
  regression was introduced by the wrapper swap.

Screenshots + manifest (`task657_shots/`, 120 PNGs + `manifest.json`) and the debug/capture scripts
are session-scratchpad artifacts (not committed) — reproducible via the same technique (build
Storybook, serve statically, Playwright against `iframe.html?id=<storyId>&globals=locale:<locale>`).

## Self-review findings

1. No defects found in the implemented behavior. The one design decision requiring judgment — how
   to handle the `rounded-xl` legacy-vs-Mantine radius mismatch — was resolved by **not** attempting
   a Mantine-token translation (which would have required a raw `style` value anyway, since neither
   `xl` nor `2xl` matches 18px) and instead preserving the exact Tailwind className chain on `Box`,
   which carries zero risk of divergence since nothing about the cascade changed.
2. Confirmed by direct computed-style inspection (not assumption) that `Box` does not introduce any
   conflicting component-level CSS — matches the Task 650 finding cited in the kickoff.
3. `check:story-coverage`'s manifest (`scripts/mantine-migration-scope.json`) does not include
   `FeaturedListings`/`LatestListings` — confirmed by grep before treating the gate as a no-op pass;
   this is expected and correct, since these are legacy-path (`System/*`) stories, not
   `Patterns/Mantine/*` canonical Mantine stories in the Task Q0R migration-scope sense.

## Assumptions, deviations, and limitations

- **A-1 (empty-state pattern choice):** implemented Option A (like-for-like `Text`) per the
  kickoff's own default; did not adopt `MantineEmptyLoadingErrorState`.
- **A-2 (spacing token):** `py-8` has no matching Mantine spacing token (`xl`=24px ≠ 32px); used the
  literal `py="2rem"` rather than a mismatched token, per the kickoff's own instruction.
- **A-3 (story approach):** extended the existing `FeaturedListings.stories.tsx` hand-mirror and
  created a new `LatestListings.stories.tsx` in the same pattern (not a real-component story
  refactor, out of scope per A-3). Both new `Loading` stories import the real exported skeleton
  subcomponent; both new `Empty` stories render an equivalent Mantine `Text` with identical props
  reading the real production i18n key (the empty-state markup is a single line with no internal
  state, so duplicating the three literal props inline carries no divergence risk — the same
  judgment the kickoff's own A-3 note anticipated: "the empty Text ... can be rendered directly").
- No new test file was added (not requested by the kickoff; this is a Q2 UI task with no new
  logic branch).

## Opus handoff

Evidence locations:
- Diff: `git diff -- src/modules/listings/components/FeaturedListings.tsx src/modules/listings/components/LatestListings.tsx src/stories/FeaturedListings.stories.tsx`; new file `src/stories/LatestListings.stories.tsx`.
- Rendered screenshots + manifest + capture/debug scripts: session-scratchpad only (not committed),
  reproducible via `npm run build-storybook` + static serve + the Playwright `iframe.html` URL
  pattern documented in `docs/storybook-governance.md` §14.5.

Questions/risks for the reviewer to inspect:
1. Confirm the `Box` + unchanged-Tailwind-className approach for the skeleton wrappers satisfies
   R3/R4/R5's intent — it is a more conservative choice than translating to Mantine style props
   (zero token-value risk since nothing about the cascade changed), but it means the wrapper's
   radius/border/background are still sourced from the legacy Tailwind/shadcn token layer rather
   than a Mantine-native token. This matches the kickoff's own canonical UI decision record ("Bind
   radius/border/bg to the same tokens used today").
2. Confirm the `check:story-coverage` no-op pass (neither component enrolled in
   `mantine-migration-scope.json`) is the expected reading of R7's "check:story-coverage passes"
   requirement.

## Backlog update

`docs/backlog.md` updated with a concise Task 657 entry under "Open — needs action" and the "Task
numbering — last used" line advanced to 657 (next free: 658).
