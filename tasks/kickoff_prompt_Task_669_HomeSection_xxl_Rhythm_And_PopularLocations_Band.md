# Task 669 — `MantineHomeSection` rhythm to Mantine `xxl`, and `PopularLocationsView` adopts the canonical band

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / Design-system responsive contract — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** Storybook / Visual Proof (gate-viewport enrolment); Mantine migration-manifest governance.
- **Origin:** owner decision 2026-07-28 (§3.1), which closes the standing **OQ3** recorded in `docs/backlog.md`
  line 33 by the Task 668 orchestrator audit.

> **Read this first.** This task has two halves that must land together: (a) `MantineHomeSection` stops stepping
> its vertical rhythm at the Tailwind-only `1536px` and steps at Mantine's own `xxl` (`1440px`) instead;
> (b) `PopularLocationsView` stops hand-rolling its own band and consumes `MantineHomeSection`. (b) alone would
> re-import the 1536 step into a fifth surface; (a) alone leaves the last homepage band un-canonical.

---

## 2. Objective

1. Move `MantineHomeSection`'s vertical rhythm from a CSS-module `@media (min-width: 1536px)` chain to Mantine
   responsive style props bound to the theme's own breakpoints. Padding values stay **48 / 64 / 80px**; only the
   third step's trigger moves **1536px → 1440px (`xxl`)**.
2. Replace `PopularLocationsView`'s own Tailwind band with `MantineHomeSection`, without breaking the section's
   "disappears entirely when there are no featured locations" behaviour.
3. Persist rendered proof at the boundary widths, which the standing 4-width gate cannot reach.
4. Close the pre-existing manifest-enrolment gap for `PopularLocationsView`.

---

## 3. Verified context

All facts below were inspected in the worktree at `bdf0f69be` (clean, `origin/task/q0-ci-rendered-locale-split`).
Line numbers are from that commit.

### 3.1 The owner decision (2026-07-28) — D1

Quoted from the owner, this session:

> «1536px — це був breakpoint для TailWind, бо у TailWind дуже погана поведінка адаптації. Для Mantine нам не
> потрібен breakpoint 1536px, бо у Mantine дуже гарна поведінка адаптації під мобільні пристрої. Саме тому ми і
> переходимо на Mantine.»

Scope of the decision, as confirmed in the same exchange:

| Question | Owner ruling |
|---|---|
| What replaces the 1536 step? | **Re-bind to `xxl` = 1440px.** Rhythm stays three-step 48 / 64 / 80px. |
| Where is it done? | **Inside Task 669**, together with the `PopularLocationsView` adoption. |

This decision is the source of truth for D1 and must not be re-litigated. It does **not** authorize touching any
other 1536px rule in the repository (§8).

### 3.2 Why the 1536 step exists at all — it is a preservation artifact, not a design choice

`src/design-system/mantine/patterns/MantineHomeSection.module.css:4-8` states its own reason verbatim:

> `Vertical rhythm MUST live here (a real CSS module with a @media (min-width:1536px) step), not in theme.ts
> inline styles or a Mantine responsive style prop: theme.ts's own breakpoints top out at xxl=90em (1440px) —
> there is no 1536px (2xl) Mantine breakpoint to bind a style prop to (kickoff §3.3, Task 659 precedent).
> --home-section-py-* (globals.css) reproduce the prior py-12 md:py-16 2xl:py-20 Tailwind chain byte-for-byte
> (48/64/80px).`

Task 662 was a zero-visual-change migration, so it carried Tailwind's `2xl` across deliberately. Once the third
step binds to `xxl` (which **is** in the scale), the module's stated justification no longer holds and the
mechanism moves to Mantine — per `CLAUDE.md`'s UI rule split ("Mantine provides behavior, component mechanism,
accessibility, and **responsive props**").

### 3.3 The theme scale — inspected

`src/design-system/mantine/theme.ts:143-151`:

```
  breakpoints: {
    xs: '20em',   // 320px
    sm: '40em',   // 640px
    md: '48em',   // 768px
    lg: '64em',   // 1024px
    xl: '80em',   // 1280px
    xxl: '90em',  // 1440px
  },
```

There is no 1536px entry. `xxl` = `90em` = 1440px at a 16px root font size.

**Deliberate semantic change, must be recorded:** the emitted media query changes from `@media (min-width: 1536px)`
(absolute px) to `@media (min-width: 90em)` (root-relative em). At the default root font size the two are
equivalent in kind; under browser font-size zoom the em query tracks the user's setting. This is the intended
consequence of the owner's decision, not an accident — state it in the session log, do not "fix" it back to px.

### 3.4 The current component — inspected in full

`src/design-system/mantine/patterns/MantineHomeSection.tsx` (48 lines). Relevant shape:

- `:42` — `className={cn(styles.band, VARIANT_CLASS[variant], className)}`
- `:43` — `style={containIntrinsicSize ? { containIntrinsicSize } : undefined}`
- `:45` — `withContainer ? <Box className="container-wide">{children}</Box> : children`

`MantineHomeSection.module.css` (50 lines):

| Rule | Contents | Disposition in this task |
|---|---|---|
| `.band` | `content-visibility: auto` + `padding-block: var(--home-section-py-base)` | **split** — `content-visibility` stays (no Mantine prop), `padding-block` leaves |
| `@media (min-width: 768px) .band` | `padding-block: var(--home-section-py-md)` | **removed** — becomes `md` in the style prop |
| `@media (min-width: 1536px) .band` | `padding-block: var(--home-section-py-lg)` | **removed** — becomes `xxl` in the style prop |
| `.muted` | `color-mix(in oklab, var(--muted) 30%, transparent)` | **preserved verbatim** — no Mantine equivalent |
| `.brandFade` | two-stop `linear-gradient(... in oklab ...)` | **preserved verbatim** — no Mantine equivalent |

`src/app/globals.css:280-287` defines the three tokens; `:287`'s comment reads `/* 80px — ≥1536px */` and
`:282-284`'s paragraph repeats the "no Mantine theme breakpoint reaches 1536" claim. Both become false.

### 3.5 Mantine `py` accepts a `var()` string — verified in the installed package, not assumed

`@mantine/core` **8.3.18**. `node_modules/@mantine/core/cjs/core/utils/units-converters/rem.cjs`,
`createConverter`: a string value that is not `calc(`/`clamp(`/`rgba(`-prefixed, contains no comma and no space,
and is not numeric after stripping `px`, **falls through to `return value`** unchanged.
`var(--home-section-py-base)` matches that path exactly, so it is emitted verbatim. Do not convert the tokens to
raw px "to be safe" — that would introduce a hardcoded value and a `check:design-tokens` risk.

**Responsive style props are already proven in this repo:** Task 671's `Flex direction={{ base, sm }}` /
`w={{ base, sm }}` emit a real `<style data-mantine-styles="inline">` rule with an `@media(min-width: 40em)`
override, asserted by `filtersPanelShell.smoke.test.tsx`'s `getMantineInlineStyleFor` helper.

### 3.6 `PopularLocationsView` — inspected in full

`src/modules/locations/components/PopularLocationsView.tsx` (86 lines).

- `:39` —
  `<Box component="section" className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]">`
- `:40` — `<Box className="container-wide">`
- `:41` — `Title` already uses `fz={{ base, sm, xxl }}` — **this file already steps at `xxl`**, which is direct
  in-repo precedent for D1.
- `:45-82` — grid and cards. **Not in scope.**

Every piece of `:39-40` has an exact `MantineHomeSection` counterpart:

| Current on `:39-40` | `MantineHomeSection` equivalent |
|---|---|
| `py-12 md:py-16 2xl:py-20` | the band's own rhythm (post-change: 48/64/80 at base/`md`/`xxl`) |
| `bg-muted/30` | `variant="muted"` — Task 662 verified this reproduces the compiled Tailwind output |
| `[content-visibility:auto]` | `.band { content-visibility: auto }` |
| `[contain-intrinsic-size:auto_380px]` | `containIntrinsicSize="auto 380px"` |
| `<Box className="container-wide">` | `withContainer` (defaults to `true`) |

### 3.7 The null-section behaviour — the highest-risk defect in this task

`src/app/[locale]/page.tsx:56-58`:

```
      {/* ── Popular locations — section wrapper + heading live inside PopularLocations (J.2);
          component returns null when no featured locations, hiding the entire section. */}
      <PopularLocations />
```

`PopularLocations.tsx:27` — `if (!locations?.length) return null`.

Unlike the other four bands, `<PopularLocations />` is deliberately **not** wrapped by `MantineHomeSection` in
`page.tsx`. The band must therefore be rendered **inside `PopularLocationsView`**. Hoisting it into `page.tsx`
would render an empty muted strip on any homepage with no featured locations — a visible regression, and a
clause-5 violation. `page.tsx` keeps a **zero diff** (AC8).

### 3.8 The four existing consumers

`src/app/[locale]/page.tsx:42, 47, 60, 72` — `variant="muted"`, default, default, `variant="brandFade"`. All four
inherit D1's rhythm change; none of them is edited.

### 3.9 The gate cannot see this change — and the fix is precedented

`MANTINE_VIEWPORTS` (`scripts/check-stories-rendered.mjs:392-397`) is `320 / 375 / 390 / 1024`. Nothing in the
standing matrix lands at or above 1200px, so **neither the old 1536 step nor the new 1440 step has ever been
captured**, and a future edit deleting the third step entirely would pass every gate.

`MANTINE_STORY_EXTRA_VIEWPORTS` (`:417-424`) is the project's own answer to exactly this, twice:

```
const MANTINE_STORY_EXTRA_VIEWPORTS = {
  HeroSearch: [{ name: 'band-700', width: 700, height: 812 }],
  ListingDetailPattern: [{ name: 'band-768', width: 768, height: 1024 }],
};
```

Keyed by the `componentName` that `discoverMantinePrimitiveStories()` derives from the story-title suffix
(`:437`) — never a hardcoded story id. Per-story extras do not touch the other ~37 stories. The file's own
warning at `:414-416` ("Do NOT add … to `MANTINE_VIEWPORTS` itself") applies and must be obeyed.

The two relevant `componentName`s:

| Story title | `componentName` key |
|---|---|
| `Patterns/Mantine/HomeSection` | `HomeSection` |
| `Mantine/Primitives/PopularLocationsView` | `PopularLocationsView` |

### 3.10 Why the measurement uses the `HomeSection` story, not `PopularLocationsView`

`HomeSection.stories.tsx:30-54` renders three stacked bands whose content is `Title order={3}` + `Text` +
`Button` — **no `xxl`-stepped typography**, so content height is constant across 1200 / 1440 / 1536 and a change
in band height isolates `padding-block` exactly. `PopularLocationsView`'s own `Title` steps at `xxl` (§3.6
`:41`), which would confound the same measurement. Measure on `HomeSection`; prove `PopularLocationsView`
structurally.

### 3.11 Manifest enrolment gap — pre-existing

`scripts/mantine-migration-scope.json` (13 entries) contains `MantineHomeSection.tsx` but **not**
`PopularLocationsView.tsx`, although `Mantine/Primitives/PopularLocationsView` has existed since Task 648.
`check-story-coverage.mjs:22-26`: a component **not** in the manifest is never checked; a component in the
manifest with no importing canonical story **FAILs**. So enrolment is safe here — the story exists and imports
the component directly (`PopularLocationsView.stories.tsx:3`). The gate moves 13/13 → **14/14**.

The manifest gates story coverage only. It is **not** consulted by `check-stories-rendered.mjs` for scope
(that script discovers by story-title prefix, `:434`), so enrolment adds no rendered cells.

`docs/component-catalog.md:246` already lists `PopularLocationsView` as `APPROVED`.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 D1 | `MantineHomeSection`'s `padding-block` comes from a Mantine responsive style prop bound to `base` / `md` / `xxl`, consuming `--home-section-py-base/md/lg`. No `padding-block` remains in the CSS module. | P0 | AC1 | Confirmed |
| R2 | §3.1 D1 | No `@media (min-width: 1536px)` rule remains in `MantineHomeSection.module.css`; the emitted third-step query is `min-width: 90em`. | P0 | AC2 | Confirmed |
| R3 | §3.4 | `.muted`, `.brandFade` and `content-visibility: auto` survive byte-identical; `withContainer` and `containIntrinsicSize` behave unchanged. | P0 | AC3 | Confirmed |
| R4 | §3.6 | `PopularLocationsView` renders `MantineHomeSection variant="muted" containIntrinsicSize="auto 380px"` in place of its own `<Box component="section">` + `.container-wide`; the grid/card subtree at `:45-82` is untouched. | P0 | AC4 | Confirmed |
| R5 | §3.7 | The band stays **inside** `PopularLocationsView`. `src/app/[locale]/page.tsx` has a zero diff and `<PopularLocations />` remains unwrapped. | P0 | AC8 | Confirmed |
| R6 | §3.9 | `MANTINE_STORY_EXTRA_VIEWPORTS` gains `HomeSection` and `PopularLocationsView` entries at **1200 / 1440 / 1536**; `MANTINE_VIEWPORTS` is unchanged. | P0 | AC5 | Confirmed |
| R7 | §3.10 | Measured from the fresh captures of `Patterns/Mantine/HomeSection`: the `muted` band's height at 1440 exceeds its height at 1200 by **exactly 32px**, and its height at 1536 **equals** its height at 1440. | P0 | AC6 | Confirmed |
| R8 | §3.11 | `PopularLocationsView.tsx` is appended to `scripts/mantine-migration-scope.json`; `check:story-coverage` reports **14/14**. | P1 | AC7 | Confirmed |
| R9 | §3.2, §3.4 | Every record that justifies the 1536 step is corrected: the module header, `globals.css:282-287`, and `HomeSection.stories.tsx`'s docs description. | P1 | AC9 | Confirmed |
| R10 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC10 | Confirmed |
| R11 | cl. 7 | Zero new i18n keys; `check:i18n` parity unchanged at 2215×4. `check:design-tokens` shows no new violation in any touched file. | P1 | AC11 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** `xxl` resolves to `90em` at `theme.ts:150`. Read the tuple before writing; if it is not `90em`,
  **stop and report** — do not substitute a nearby breakpoint.
- **A2.** Rendered pixels **will** change at ≥1440px for all five bands. That is the point of D1, not a
  regression. The 4-width standing cells (320/375/390/1024) must stay byte-identical apart from
  `PopularLocationsView`'s own structural change — if a standing cell for `HomeSection`, `FeaturedLatest`,
  `HowItWorksSteps` or the CTA band changes at ≤1024, **stop**: the base/`md` steps were altered.
- **A3.** The three new widths have never been captured for these two stories. New `AMBIGUOUS` verdicts at wide
  widths are plausible and are **not** automatically failures — classify each one and report it. A new **FAIL**
  is a stop condition.

**Open questions — none.** D1 is decided (§3.1); the measurement target is fixed (§3.10); the enrolment is
mechanical (§3.11).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 3, 5, 7, 9, 12, 14, 16, 16b, 16c.
2. `docs/rule-index.md` — "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy.
4. `docs/backlog.md` — line 33 (OQ3) and the numbering line.
5. `docs/mantine-responsive-design-system.md`
6. `docs/tailadmin-style-reference.md`
7. `docs/component-rules.md`
8. `docs/storybook-governance.md` — §15 (manifest) only.

**Source pre-read**

9. `src/design-system/mantine/patterns/MantineHomeSection.tsx` — all 48 lines.
10. `src/design-system/mantine/patterns/MantineHomeSection.module.css` — all 50 lines.
11. `src/design-system/mantine/theme.ts` — lines 143-151.
12. `src/app/globals.css` — lines 280-287.
13. `src/modules/locations/components/PopularLocationsView.tsx` — all 86 lines.
14. `src/modules/locations/components/PopularLocations.tsx` — lines 16-41.
15. `src/app/[locale]/page.tsx` — lines 40-88.
16. `scripts/check-stories-rendered.mjs` — lines 392-448.
17. `src/stories/patterns/mantine/HomeSection.stories.tsx` — all 55 lines.
18. `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` — the `getMantineInlineStyleFor` helper
    only, as the reference for asserting an emitted responsive rule.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineHomeSection.tsx` | modify | rhythm → responsive `py` prop; header comment corrected (R1, R9). |
| `src/design-system/mantine/patterns/MantineHomeSection.module.css` | modify | both `padding-block` `@media` blocks removed, `.band` keeps `content-visibility`; header rewritten (R1, R2, R3, R9). |
| `src/app/globals.css` | modify | **comments only** on lines 282-287. Token *values* unchanged. |
| `src/modules/locations/components/PopularLocationsView.tsx` | modify | `:39-40` → `MantineHomeSection`; doc block updated. Lines 45-82 untouched (R4). |
| `src/stories/patterns/mantine/HomeSection.stories.tsx` | modify | docs `description` sentence about the 1536 step (R9). No structural story change. |
| `scripts/check-stories-rendered.mjs` | modify | two `MANTINE_STORY_EXTRA_VIEWPORTS` entries + their justification comment (R6). Nothing else. |
| `scripts/mantine-migration-scope.json` | modify | append `PopularLocationsView.tsx` (R8). Append-only. |
| `docs/backlog.md` | modify | resolve **OQ3** on line 33, add a concise 669 entry, update the numbering line. Keep **≤80 lines** — the file is at 80, so consolidate rather than append. |
| `docs/sessions/2026-07-2X-task669-*.md` | **create** | session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **`.container-wide`'s own 1536px horizontal step** (`globals.css:605`) and `.container-admin` (`:621`). D1
  covers the **vertical rhythm** of the homepage band. After this task the 1440–1536 window has vertical rhythm
  on the new step and side padding still on the old one. That asymmetry is **accepted and must be declared as a
  limitation**, not silently fixed: `.container-wide` is a shared legacy class with its own blast radius across
  the admin shell. **Reserve Task 681.**
- **`PageShell.tsx:27`** (`py-8 sm:py-12 lg:py-16 2xl:py-20`) — a non-homepage legacy Tailwind surface.
- **Any other `2xl:` / 1536 usage** (`admin/page.tsx:168`, `favorites/loading.tsx:23`, `PageHeader.tsx:31`,
  `Section.tsx:19`, `skeleton.stories.tsx`, `globals.css:593`). D1 does not authorize a repo-wide sweep.
- **The four `page.tsx` band call sites** — they inherit the change; none is edited.
- **`PopularLocationsView`'s grid, cards, gradients, `AppImage`, hover/focus classes** (`:18-28`, `:45-82`).
  The doc block at `:30-36` already records these as deliberately retained `className`.
- **`PopularLocations.tsx`** — the container's query, null-return and prop mapping stay byte-identical.
- **Enrolling these stories in `ASSERT_STORIES` or widening `MANTINE_VIEWPORTS`** — that is Task 678, and
  `check-stories-rendered.mjs:414-416` explicitly warns against the latter.
- **Any new automated numeric assertion inside the harness.** R7 is a measured, reported result; the standing
  artifact is the persisted capture, not a self-failing assertion. Recorded as a limitation (§14.8).

---

## 9. Current and required behavior

**Current.** `MantineHomeSection` pads 48px, → 64px at 768px, → 80px at **1536px**, via a CSS-module `@media`
chain. Four homepage bands use it. `PopularLocationsView` renders its **own** `<section>` with the equivalent
Tailwind chain plus `bg-muted/30` and `.container-wide`, and is the only homepage band not on the canonical
pattern. `<PopularLocations />` returns `null` with no featured locations, removing its band with it.

**Required after.** Identical rendering at every width **below 1440px**. At ≥1440px the 80px step now applies
(previously 64px until 1536px). All five bands — the four existing plus `PopularLocations` — share one canonical
source. `<PopularLocations />` still returns `null` and still removes its own band. Every handler, query, prop
API, background variant and container behaviour is unchanged.

---

## 10. Implementation requirements

**I1 — the rhythm.** On `MantineHomeSection`'s root `Box`:

```tsx
py={{
  base: 'var(--home-section-py-base)',
  md:   'var(--home-section-py-md)',
  xxl:  'var(--home-section-py-lg)',
}}
```

Keep `className={cn(styles.band, VARIANT_CLASS[variant], className)}` — `styles.band` still carries
`content-visibility`. Do **not** inline raw px. Do **not** add a `theme.ts` breakpoint.

**I2 — the module.** Delete both `padding-block` `@media` blocks and the `padding-block` declaration in `.band`.
`.band` keeps `content-visibility: auto` alone. `.muted` and `.brandFade` are **not** touched — their comments
about reproducing Tailwind's compiled output remain true and stay verbatim.

**I3 — the records.** Rewrite the module header, `globals.css:282-287` and `HomeSection.stories.tsx`'s
`description` so none of them still claims a 1536px step or "no Mantine breakpoint reaches it". Each rewritten
passage must name D1, its date (2026-07-28) and its owner origin. Keep the same register — a few lines, not an
essay.

**I4 — `PopularLocationsView`.** Replace `:39-40`'s two `Box`es with:

```tsx
<MantineHomeSection variant="muted" containIntrinsicSize="auto 380px">
```

closing it where `:84`'s outer `</Box>` closes. Import from the `@/design-system/mantine/patterns` barrel
(`FiltersPanel.tsx` precedent). Everything from `:41` (`Title`) through `:82` (`</SimpleGrid>`) is moved, not
rewritten. Update the component's doc block to say the band is now canonical.

**I5 — the gate cells.** Add to `MANTINE_STORY_EXTRA_VIEWPORTS`:

```js
  HomeSection:          [{ name: 'wide-1200', width: 1200, height: 1024 },
                         { name: 'wide-1440', width: 1440, height: 1024 },
                         { name: 'wide-1536', width: 1536, height: 1024 }],
  PopularLocationsView: [{ name: 'wide-1200', width: 1200, height: 1024 },
                         { name: 'wide-1440', width: 1440, height: 1024 },
                         { name: 'wide-1536', width: 1536, height: 1024 }],
```

with a comment in the same register as the existing `HeroSearch`/`ListingDetailPattern` entries, naming Task 669,
D1, and why 1200/1440/1536 (below the step / at the step / above the retired step). Do not touch
`MANTINE_VIEWPORTS`.

**I6 — the measurement.** From the fresh capture directory, for
`patterns-mantine-homesection--default__en__wide-1200 / wide-1440 / wide-1536`, read the pixel rows of the
`muted` band (its background is `color-mix(in oklab, var(--muted) 30%, transparent)` over white — a single flat
colour distinct from the neighbouring `default` band) and report its height in px at each width. Use `sharp` or
`PIL`, the same technique as Task 675 §8. Expected: `h(1440) − h(1200) = 32`, `h(1536) = h(1440)`. Quote the
three raw numbers, not a verdict.

**I7 — order of operations.** `git status --porcelain` (expect **clean**, per §13.2) → read `theme.ts:143-151`
(A1 stop condition) → I1+I2+I3 → I4 → I5 → rebuild Storybook → gates → I6 → records.

---

## 11. Positive and negative flows

### Positive flow

Homepage `/{locale}` at 1440px: all five bands — Featured, Latest, Popular locations, How it works, Agent CTA —
render 80px of vertical padding, `Featured` and `Popular locations` on the muted background, the CTA on
`brandFade`, each content column inside `.container-wide`. At 1439px all five render 64px. At 767px, 48px.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | The band accepts no user input | N/A | — |
| Authorization / RLS | **No** | Public route; the Supabase read is unchanged | N/A | — |
| **Empty data set** (`locations` empty → `null`) | **Yes** | `PopularLocations.tsx:27` | The whole section, band included, is absent — no empty muted strip | AC8 (page.tsx zero diff + band inside the View) |
| Missing image (`imageUrl == null`) | **Yes** | `PopularLocationsView:69-71` | Gradient fallback renders, unchanged | AC4 (subtree untouched) + capture |
| Locale expansion (sq/uk/it) | **Yes** | cl. 7 | Headings wrap, never clip, at 320px and at 1536px | AC5 |
| Small viewport (<640) | **Yes** | cl. 11 | 48px rhythm and 2-column grid unchanged, byte-identical cells | A2 / AC5 |
| Offline / network | **No** | Server Component; no client fetch added | N/A | — |
| Concurrent writer | **No** | Read-only presentational surface | N/A | — |
| RTL | **No** | No RTL locale in the project | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* `MantineHomeSection.tsx`, *when* inspected, *then* its root `Box` carries a `py`
  responsive object with `base`/`md`/`xxl` keys resolving to the three `--home-section-py-*` tokens, and
  `grep -n 'padding-block' src/design-system/mantine/patterns/MantineHomeSection.module.css` returns **0 hits**.

- **AC2 [R2]** — *Given* the built Storybook bundle, *when* grepped, *then*
  `grep -rn '1536' src/design-system/mantine/patterns/` returns **0 hits**, and the emitted rule for the band's
  third step is `@media (min-width: 90em)`. Quote the emitted `<style data-mantine-styles="inline">` rule or the
  equivalent from the built CSS.

- **AC3 [R3]** — *Given* `MantineHomeSection.module.css`, *when* diffed, *then* `.muted` and `.brandFade` show a
  zero diff and `.band` retains `content-visibility: auto`. Quote `git diff` for that file.

- **AC4 [R4]** — *Given* `PopularLocationsView.tsx`, *when* diffed, *then* the diff touches only the band
  wrapper and the doc block; `grep -n 'py-12\|2xl:py-20\|bg-muted/30\|container-wide' src/modules/locations/components/PopularLocationsView.tsx`
  returns **0 hits**; and lines corresponding to the old `:41-82` are unchanged in content.

- **AC5 [R6]** — *Given* a fresh `build-storybook`, *when* `npm run screenshots:assert -- --mantine-only` runs,
  *then* it exits 0 with **0 FAIL**; `HomeSection` and `PopularLocationsView` each report **28 cells**
  (4 standing + 3 new, × 4 locales); every other Mantine story still reports exactly 16. Report the totals and
  classify every `AMBIGUOUS`.

- **AC6 [R7]** — *Given* the fresh captures, *when* measured per I6, *then* the reported band heights satisfy
  `h(1440) − h(1200) = 32` and `h(1536) = h(1440)`. Quote the three measured values.

- **AC7 [R8]** — *Given* the updated manifest, *when* `npm run check:story-coverage` runs, *then* it exits 0 at
  **14/14** and names `PopularLocationsView.tsx` as covered.

- **AC8 [R5]** — *Given* the final diff, *when* `git diff --stat` is read, *then* `src/app/[locale]/page.tsx`,
  `src/modules/locations/components/PopularLocations.tsx` and `src/design-system/mantine/theme.ts` are **absent**.

- **AC9 [R9]** — *Given* the touched records, *when* grepped, *then*
  `grep -rn '1536' src/design-system/mantine/patterns/ src/stories/patterns/mantine/HomeSection.stories.tsx`
  returns **0 hits**, and `globals.css:280-290` no longer contains `≥1536px` or the "no Mantine theme breakpoint
  reaches" claim.

- **AC10 [R10]** — `npm run build` exits 0, fresh post-change transcript. Report the page count actually printed.

- **AC11 [R11]** — `npm run check:i18n` exits 0 at 2215×4 with no new keys; `npm run check:design-tokens` shows
  no new violation in any file this task touched (quote the before/after counts);
  `npm run check:file-integrity` and `npm run check:mojibake` exit 0.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`.** It is a migrated Mantine pattern whose responsive contract changes across five
homepage surfaces, plus a Storybook-governance change. Not `Q4`: `docs/critical-flow-registry.md` has no row for
`MantineHomeSection`, `PopularLocations` or the homepage bands (grepped, 66 rows) — so no critical-flow
regression obligation attaches, and no planted-violation proof is required.

**Declared proof path.** `MANTINE_VIEWPORTS` (320/375/390/1024) **plus** this task's three new widths
(1200/1440/1536) for the two affected stories, × sq/en/uk/it. That covers every width at which D1 can change a
pixel, plus the unchanged base/`md` steps. The remaining canonical widths (480/560/680/810/960/1920/2560) are
**not** captured for these stories — that is Task 678's scope. Report this as the declared boundary of the
proof, never as satisfied full-matrix coverage.

### 13.2 Worktree

Start state is expected **clean** at `bdf0f69be`. Snapshot `git status --porcelain` before the first write and
record it. If it is not clean, **stop and report** — do not reconcile foreign paths.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run typecheck` | 0 |
| `npx vitest run` (full suite) | 0, no new failures — no test targets these files today (grepped) |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0, **14/14** |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL; the two stories at 28 cells each |
| *(I6 measurement)* | `h(1440)−h(1200)=32`, `h(1536)=h(1440)` |
| `npm run check:design-tokens` | no new violation in touched files |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 |
| `npm run build` | **0 — hard gate** |

`check:hydration` **is** required here, unlike Task 675: `MantineHomeSection` renders inside the homepage's SSR
output on every locale route, and the emitted class/style changes.

---

## 14. Completion report contract

Session log at `docs/sessions/<date>-task669-homesection-xxl-rhythm-popularlocations-band.md`:

1. `Files Changed` table matching the real `git diff`.
2. R1–R11 mapped to AC1–AC11 with evidence.
3. Every command with its **actual** exit code.
4. The emitted third-step media query, quoted (AC2).
5. The three measured band heights (AC6), raw.
6. The `--mantine-only` totals with every `AMBIGUOUS` classified (AC5).
7. Deviations, each with a reason.
8. Limitations — at minimum: the declared 7-width proof path (§13.1); the px→em media-query semantics change
   (§3.3); the `.container-wide` 1440/1536 axis asymmetry (§8, Task 681); and that R7 is a measured result, not
   a self-failing standing assertion.

Backlog: resolve **OQ3** on line 33, add a concise 669 entry, update the numbering line, keep ≤80 lines.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
Sonnet does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_669_HomeSection_xxl_Rhythm_And_PopularLocations_Band.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Band vertical rhythm, base | `MantineHomeSection` root `Box` | `.band` | `padding-block: var(--home-section-py-base)` → `3rem` (48px), `globals.css:285` | **changed mechanism, same value** → Mantine `py.base` | §3.4, §3.5 |
| Band vertical rhythm, ≥768 | same | `@media (min-width:768px) .band` | `var(--home-section-py-md)` → `4rem` (64px), `:286` | **changed mechanism, same value + trigger** → `py.md` (`48em`) | §3.3 |
| Band vertical rhythm, third step | same | `@media (min-width:1536px) .band` | `var(--home-section-py-lg)` → `5rem` (80px), `:287` | **changed trigger** 1536px → `xxl` `90em` (1440px) | §3.1 D1 |
| Muted band background | `MantineHomeSection variant="muted"` | `.muted` | `color-mix(in oklab, var(--muted) 30%, transparent)`; `--muted` → `--neutral-100` = `#F5F5F5` (`globals.css:350`) | **preserved verbatim** | §3.4 |
| BrandFade band background | `variant="brandFade"` | `.brandFade` | two-stop `linear-gradient(to bottom right in oklab, …)` | **preserved verbatim** | §3.4 |
| Content column | `Box` | `.container-wide` | `globals.css:598-605`, incl. its own 1536 side-padding step | **preserved, out of scope** (Task 681) | §8 |
| Popular-locations band | `PopularLocationsView` `Box component="section"` | `py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]` | Tailwind utility chain, `--muted` at 30% alpha | **replaced** by `MantineHomeSection variant="muted"` | §3.6 |
| Popular-locations grid, cards, gradients | `SimpleGrid` + `Box component={Link}` | `CITY_GRADIENTS`, `absolute inset-0`, hover/focus utilities | semantic brand/badge tokens | **preserved, out of scope** | §3.6, doc block `:30-36` |
| Popular-locations heading | `Title order={2}` | — | `fz={{ base, sm, xxl }}` — already `xxl`-stepped | **preserved** (and precedent for D1) | §3.6 `:41` |

## 16. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Homepage band rhythm | `grep -rn '1536\|96em\|2xl:' src/`; inspected `theme.ts:143-151`, `MantineHomeSection.{tsx,module.css}`, `globals.css:280-287`, `HomeSection.stories.tsx` | `Patterns/Mantine/HomeSection` (exists) → `MantineHomeSection.tsx` | **extend** — the canonical owner changes once for all five consumers | `--home-section-py-base/md/lg` retained; trigger moves to `theme.breakpoints.xxl`. Story already registered; manifest already enrolled (`mantine-migration-scope.json:9`). |
| Popular-locations band | inspected `PopularLocationsView.tsx` in full, `PopularLocations.tsx`, `page.tsx:55-58`, `component-catalog.md:246`, `src/design-system/mantine/patterns/` | `Mantine/Primitives/PopularLocationsView` (exists, imports the real component at `:3`) | **reuse** — consume `MantineHomeSection`, copy no styles locally | Manifest enrolment added (R8), moving `check:story-coverage` 13/13 → 14/14 per §3.11. |

No artifact needs a value without design-system provenance, so this task is **not**
`BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

## 17. Rule-compliance ledger

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` cl. 3 (capabilities stay reachable) | The section can vanish (`PopularLocations.tsx:27`) | No control/state/section removed | AC8 + §3.7 | `COMPLIANT` |
| cl. 5 (UX flows intact) | Five rendered bands change padding | Entry points, siblings, cross-page effects preserved | AC4, AC8, AC5 | `COMPLIANT` |
| cl. 7 (four locales) | Rendered text is unchanged, but widths change | No new keys; all four locales captured | AC11, AC5 | `COMPLIANT` |
| cl. 9 (validation evidence) | Non-Q0 task | `npm run build` exit 0, fresh transcript | AC10 | `COMPLIANT` |
| cl. 12 (rendered evidence follows risk) | Q3 visual work | Full declared proof path, machine-produced | AC5, AC6 | `COMPLIANT` |
| cl. 13 (Storybook/no-hardcode gates) | Harness config changes | Locale-backed strings, no forbidden raw controls, machine evidence | AC5, AC7 | `COMPLIANT` |
| cl. 14 (file integrity) | Text/source files touched | UTF-8 no BOM, no mojibake | AC11 | `COMPLIANT` |
| cl. 15 (critical flows) | `critical-flow-registry.md` grepped, 66 rows, no matching row | No automated regression obligation attaches | §13.1 | `NOT APPLICABLE` |
| cl. 16 (TailAdmin visual source) | Band chrome in scope | Values traced to tokens, not invented | §15 | `COMPLIANT` |
| cl. 16a (missing reference → provenance) | No new visual value is introduced — only a trigger moves | No invented value | §3.1 D1 | `NOT APPLICABLE` |
| cl. 16b (canonical provenance before code) | Both artifacts changed | Canonical source searched and named | §16 | `COMPLIANT` |
| cl. 16c (canonical Story cannot be bypassed) | Both changed artifacts have Stories | Stories preserved and re-captured with the real components | AC5, §3.9 | `COMPLIANT` |

## 18. Execution contract

| Field | Value |
|---|---|
| Task | 669 |
| Active route / owner decision | Single route: re-bind third step to `xxl`, done inside 669 (owner, §3.1) |
| Decision source, date, scope | Owner, 2026-07-28; scope = homepage band **vertical rhythm** only |
| Starting worktree mode | **clean isolated** at `bdf0f69be` — §13.2 sets the stop condition |
| Producer of each checkpoint | `build-storybook` → `screenshots:assert` → capture dir → I6 measurement script → `build` |
| Persisted result | `.screenshots/rendered-assert/<ts>/manifest.json` + PNGs; `.next/BUILD_ID`; session log |
| Comparator | AC6's two numeric equalities; AC5's per-story cell counts; AC1/AC2/AC4/AC9's zero-hit greps |
| Failure path | A1 breakpoint mismatch → stop; any new FAIL cell → stop; standing ≤1024 cell changed for an unrelated band → stop (A2) |
| Zero/empty input case | `locations` empty → whole section absent (§11 table, AC8) |
| Task-created artifacts in baselines | The three new viewport cells are task-created; AC5's per-story counts state the expected post-change totals (28), not a pre-change baseline |

## 19. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, token, command, expected number and the owner quote are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R11 → AC1–AC11 |
| Scope names what must not change | **Yes** — §8, incl. four reserved boundaries and Task 681 |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 (with the reason it is not Q4); §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; no new value proposed, only a trigger moved |
| Owner-only exceptions traceable | **Yes** — one decision, quoted verbatim with date (§3.1) |
| Baselines account for task-created artifacts | **Yes** — §18 row 9 |
| Dirty-worktree handling | **Yes** — clean start asserted with a stop condition (§13.2) |
| Gates prove the changed behavior | **Yes** — AC6 is a falsifiable numeric prediction; AC2/AC5 are machine-produced |
| Single active owner route | **Yes** — the only fork is A1's `theme.ts` stop condition |
| API claims verified, not assumed | **Yes** — §3.5 reads the installed `@mantine/core` 8.3.18 converter source |

**Known-risk note for the reviewer.** Two likely defects. First, hoisting the band into `page.tsx` instead of
keeping it inside `PopularLocationsView` — it looks tidier and silently breaks the empty-state (§3.7); check
AC8's `git diff --stat`, not the report. Second, "helpfully" adding a `2xl: '96em'` breakpoint to `theme.ts` to
preserve the old step — AC8 requires `theme.ts` to be absent from the diff.
