# Task 688 — De-Tailwind `PopularLocationsView`: Mantine style props + a colocated CSS module, at zero rendered delta

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI migration — **legacy-utility removal on an already-Mantine surface**
  (`docs/rule-index.md` → "UI / Layout / Component" → **Current Mantine path**).
- **Secondary types:** Storybook / visual proof (the surface is manifest-enrolled); design-token conformance
  (cl. 16, 16b).
- **Origin:** the homepage-tree audit requested by the owner on 2026-07-29. The audit found the homepage render tree
  is structurally Mantine (0 shadcn primitives reachable from `src/app/[locale]/page.tsx`) but still carries ~55 raw
  Tailwind utility classes across 11 rendered files. `PopularLocationsView` is the smallest fully-isolated block of
  that debt and is picked first to establish the de-Tailwind pattern. Owner decision **D15** (2026-07-29) sets the
  surface; **D16** sets the mechanism.

> **Read this first.** This task must produce **zero rendered change**. It is a mechanism swap, not a redesign. Every
> replaced utility must reproduce its own compiled CSS output, proven by `getComputedStyle` equality **and** by
> PNG-md5 identity on all 56 enrolled cells. If you cannot reproduce a value exactly, **stop and report** — do not
> approximate it and do not "improve" it.

---

## 2. Objective

1. Remove every raw Tailwind utility class from `src/modules/locations/components/PopularLocationsView.tsx` — the 5
   `className` sites and the 8-entry `CITY_GRADIENTS` array — replacing them with Mantine style props where a prop
   exists and a **new colocated `PopularLocationsView.module.css`** where one does not (D16).
2. Preserve the rendered output **byte-for-byte**: all 56 manifest cells keep their current PNG md5 and their current
   verdict, including the 16 `text-clipped-ellipsis` ambiguous cells of `LongCityName`.
3. Reduce `check:design-tokens` from **44 → 43** by moving the file's one inline `zIndex` into the module, while the
   new `.module.css` contributes **0** new violations.
4. Establish the reusable de-Tailwind pattern (computed-style equality + md5 identity) that the larger
   `MantineListingCardPattern` slice will inherit.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-29,
after Task 686 was reviewed `APPROVED WITH NOTES`. Nothing is inferred from a filename, a prior report, or a
semantic-search hit.

### 3.1 Owner decisions

| ID | Question put to the owner | Ruling |
|---|---|---|
| **D6** (Task 684, standing) | `.screenshots/` evidence visibility. | **Local-only** per `.gitignore:55`. Reference by path; it will not appear in `git status`. |
| **D10** (Task 685 review, standing) | Binding visual comparator for this harness. | **0 verdict changes**, plus per-story attribution of changed cells. This task **tightens** it for the target story only — see §3.6. |
| **D15** (this task, 2026-07-29) | Which homepage surface takes the first de-Tailwind slice? | **`PopularLocationsView`** — smallest isolated block, single consumer, zero flake history. `MantineListingCardPattern` is deferred (§8). |
| **D16** (this task, 2026-07-29) | What replaces the raw utilities? | **Mantine style props where a prop exists; a colocated `.module.css` for everything a prop cannot express** (gradients, `:hover`, `:focus-visible`). Not inline `style` — see §3.4. |

D15 and D16 are the source of truth for scope. **No new visual value is introduced by this task**, so cl. 16a is
satisfied by reproduction, not by provenance for a new value.

### 3.2 The file as it stands — read at source

`src/modules/locations/components/PopularLocationsView.tsx`, **86 lines**, presentational, prop-driven, hook-free
(no `useTranslations`, no data fetching), so it renders identically in the story via `storyT()` and in its consumer.

| Line | Current | Kind |
|---:|---|---|
| `:20-29` | `CITY_GRADIENTS` — 8 strings, each `bg-gradient-to-br from-… to-…` | Tailwind, **remove** |
| `:41` | `<MantineHomeSection variant="muted" containIntrinsicSize="auto 380px">` | Mantine, **preserve** |
| `:42` | `<Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }} mb="xl">` | Mantine, **preserve** (§3.5) |
| `:46` | `<SimpleGrid cols={{base:2,sm:3,md:4}} spacing="sm" className="popular-locations">` | Mantine + **dead class** (§3.8) |
| `:48-59` | card `<Box component={Link} pos="relative" h={112} p="sm" c="white" bdrs="xl" className="flex flex-col justify-end overflow-hidden hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" data-track="popular_location_click">` | mixed, **migrate the `className`** |
| `:66` | `<AppImage variant="listing-thumb" … className="absolute inset-0" />` | Tailwind, **migrate** |
| `:68` | `<Box className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />` | Tailwind, **migrate** |
| `:71` | `` <Box className={`absolute inset-0 ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]}`} /> `` | Tailwind, **migrate** |
| `:73` | `<Box pos="relative" style={{ zIndex: 1 }}>` | **migrate the `zIndex`** into the module (§3.5) |
| `:75` | `<MapPin size={14} style={{ opacity: 0.7 }} aria-hidden />` | **preserve** — not a token violation, not a Tailwind class |
| `:77` | `<Text fw={600} size="sm" lh={1.25} truncate>` | Mantine, **preserve** — `truncate` is the Mantine prop, not the Tailwind class |

The docstring at `:31-38` currently claims the `className`s have "no Mantine equivalent" and are "approved semantic
tokens". **That claim is now superseded by D16** and the docstring must be rewritten to describe the module.

### 3.3 Compiled CSS for every utility being removed — read from the built bundle

Read verbatim from `.next/static/css/2904edf14f80b3d3.css` (153 154 bytes, the only bundle containing these rules):

```
.flex{display:flex}
.flex-col{flex-direction:column}
.justify-end{justify-content:flex-end}
.overflow-hidden{overflow:hidden}
.inset-0{inset:var(--space-0)}                      /* --space-0: 0px */
.hover\:opacity-90:hover{opacity:.9}
.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}
.focus-visible\:ring-2:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}
.focus-visible\:outline-none:focus-visible{--tw-outline-style:none;outline-style:none}
.bg-gradient-to-t{--tw-gradient-position:to top in oklab}
.bg-gradient-to-br{--tw-gradient-position:to bottom right in oklab}
.bg-gradient-to-t,.bg-gradient-to-br{background-image:linear-gradient(var(--tw-gradient-stops))}
```

Tailwind defaults in the same bundle: `--default-transition-duration:.15s`;
`--default-transition-timing-function:cubic-bezier(.4,0,.2,1)`; `--tw-ring-offset-width:0px`;
`--tw-ring-offset-shadow:0 0 #0000`; `--color-black:#000`; `--space-0:0px`.

Colour stops — each emits a **plain fallback and a `@supports (color:color-mix(in lab,red,red))` upgrade**:

| Utility | Fallback | `color-mix` form |
|---|---|---|
| `from-black/60` | `--tw-gradient-from:#0009` | `color-mix(in oklab,var(--color-black) 60%,transparent)` |
| `via-black/20` | `--tw-gradient-via:#0003` | `color-mix(in oklab,var(--color-black) 20%,transparent)` |
| `to-transparent` | `--tw-gradient-to:transparent` | — |
| `from-primary` | `--tw-gradient-from:var(--primary)` | — (no alpha modifier) |
| `from-primary/80` | `--tw-gradient-from:var(--primary)` | `color-mix(in oklab,var(--primary) 80%,transparent)` |
| `from-brand-800` / `from-brand-950` | `var(--brand-800)` / `var(--brand-950)` | — |
| `to-brand-800` / `to-brand-950` | `var(--brand-800)` / `var(--brand-950)` | — |
| `from-badge-new` / `from-badge-premium` | `var(--badge-new)` / `var(--badge-premium)` | — |
| `from-badge-new/90` / `from-badge-premium/90` | `var(--badge-new)` / `var(--badge-premium)` | `color-mix(in oklab,var(--badge-*) 90%,transparent)` |
| `to-badge-new/70` / `to-badge-premium/70` | `var(--badge-new)` / `var(--badge-premium)` | `color-mix(in oklab,var(--badge-*) 70%,transparent)` |

**Two rules are NOT extractable as standalone selectors from this bundle** — `.absolute` and
`.focus-visible\:ring-ring:focus-visible` appear only inside grouped selector lists and/or `@supports` blocks.
**Do not string-match the bundle for them.** This is precisely why §10 I3 requires a **live `getComputedStyle`
capture** as the authority rather than bundle text (A2).

### 3.4 CSS-module precedent — two established conventions, both binding

1. **`src/design-system/mantine/patterns/MantineHomeSection.module.css` (Task 662)** — the *reproduction* convention:
   its `.muted`/`.brandFade` rules reproduce the prior Tailwind utilities' **own compiled output** (verified against
   the built `.next/static/css`), including explicit `0%`/`100%` gradient stop positions so the serialized
   `getComputedStyle` `background-image` is byte-identical, not merely visually equivalent. **Follow this.**
2. **`src/modules/listings/components/FavoriteButton.module.css` (Task 653)** — the *colocation* precedent: a real
   CSS module living in `src/modules/…/components/`, outside the `src/design-system/mantine` token allowlist, keyed
   off `data-*` attributes. It documents empirically that an **inline `style` attribute unconditionally beats any
   external stylesheet rule for the same property and therefore permanently blocks the module's own `:hover` rules**.
   That is the reason D16 forbids inline `style` for the hover/focus states.

Only 5 `.module.css` files exist in `src/`; this task adds the 6th.

### 3.5 `check:design-tokens` baseline — 44, of which 4 are in this file

`npm run check:design-tokens` (`--strict`) currently reports **44 raw style-value violations + 0 stale-markers**
(`length` 31, `color` 11, `z-index` 2), distributed across 8 files. This file holds 4:

```
src/modules/locations/components/PopularLocationsView.tsx  (4)
  :42  [length:inline style px/rem value]  ": '1.25rem'"
  :42  [length:inline style px/rem value]  ": '1.5rem'"
  :42  [length:inline style px/rem value]  ": '1.875rem'"
  :73  [z-index:inline zIndex value]       "zIndex: 1"
```

- The **three `:42` rem strings stay.** They are the shared section-heading size triple, byte-identical to
  `src/app/[locale]/page.tsx` and `FeaturedListingsView.tsx`. Changing them here alone would desynchronise the
  homepage headings. Tokenising that triple project-wide is **Task 689** (§8).
- The **`:73` `zIndex: 1` moves** into the module. The detector's z-index pattern is
  `/(?:\bzIndex|['"]z-index['"])\s*:\s*\d+/g` — it matches the JS property and the *quoted* CSS property, so plain
  CSS `z-index: 1;` in a `.module.css` is **not** a violation (verified against the pattern source at
  `scripts/check-design-tokens.mjs:157-162`).

`collectFiles(srcDir, ['.tsx','.ts','.css'])` at `scripts/check-design-tokens.mjs:438` means **the new
`.module.css` IS scanned**, and `src/modules/locations` is **not** in `scripts/design-tokens-allowlist.json`.
Flagged in CSS: hex literals, `rgb|rgba|hsl|hsla|oklch(` calls, and quoted px/rem string values. **`color-mix(` and
`var(--token)` are not flagged.** Therefore the module must express every colour as `var(--token)` or a `color-mix()`
over one — exactly the compiled form in §3.3. `FavoriteButton.module.css`'s raw `#hex`/`rgba()` style is the **9
violations it contributes to the 44** and must **not** be copied.

**Binding comparator: `43 / 0 stale-marker`, with this file at 3 and the new `.module.css` at 0.**

### 3.6 Rendered-gate enrolment and the byte-stability baseline — measured, not assumed

`PopularLocationsView` is enrolled in `--mantine-only` by title prefix (`Mantine/Primitives/*`) and is listed in
`scripts/mantine-migration-scope.json`. It contributes **2 stories × 4 locales × 7 viewports = 56 of the 1184
cells**:

| Story ID | Cells | Verdicts today |
|---|---:|---|
| `mantine-primitives-popularlocationsview--default` | 28 | 28 `pass` |
| `mantine-primitives-popularlocationsview--long-city-name` | 28 | 12 `pass`, **16 `ambiguous`** |

Locales `sq/en/uk/it`; viewports `mobile-320`, `mobile-375`, `mobile-390`, `desktop-1024`, `wide-1200`, `wide-1440`,
`wide-1536`. The 16 ambiguous cells are `visualIntegrity.ambiguousOnly: true` with
`failReason: "text-clipped-ellipsis"` on the `Rrogozhinë-Peqin-Kavajë Bashkiake` link — the intended `truncate`
behaviour, and 16 of the manifest's 22 `ambiguousOnly` cells. `anchorsExpected` is **`[]`** for these cells.

**Byte-stability, measured across the 5 retained runs** (`06-49`, `13-45`, `14-20`, `16-29`, `17-50`; 10 pair
comparisons):

```
mantine-primitives-popularlocationsview--default        : 0 changed / 280 cell-comparisons
mantine-primitives-popularlocationsview--long-city-name : 0 changed / 280 cell-comparisons
```

**This story has zero flake history.** That is what licenses the tightened comparator in R7: for these 56 cells the
requirement is **PNG-md5 identity**, not merely "0 verdict changes". D10's noise-floor allowance applies to the
*other* 1128 cells, not to this story.

Baseline run for the comparison: **`.screenshots/rendered-assert/2026-07-29T17-50/`** (Task 686's reviewed
post-change run: 1184 cells, `passed: 1162`, `failed: 0`, `ambiguousOnly: 22`).

### 3.7 Tokens exist — no new token is needed

All colour sources referenced by `CITY_GRADIENTS` and the photo overlay are already defined in
`src/app/globals.css`: `--primary:var(--brand-700)` (`:355`), `--brand-800` (`:321`), `--brand-950`
(`:328`, deliberately *not* tuple-derived — Task 661 OQ2), `--badge-new` (`:380`), `--badge-premium` (`:381`),
`--ring:var(--brand-700)` (`:374`), plus Tailwind's own `--color-black:#000`.

`--overlay: oklch(0 0 0)` (`:52`, "Pure black — for photo/lightbox overlays") also exists and is *semantically* the
right token for the `:68` photo scrim. **Do not substitute it in this task.** The current compiled value is
`var(--color-black)`, and swapping the source risks a non-identical serialization, which would break R7. Recorded as
a follow-up in §8.

### 3.8 The `popular-locations` class is dead

`className="popular-locations"` at `:46` is referenced **nowhere** — not in any `.css`, `.ts`, `.tsx`, `.mjs` or
`.json` under `src/` or `scripts/`, and not as a rendered-gate anchor (`anchorsExpected: []`, §3.6). It is a leftover
semantic hook. **Delete it**; do not migrate it into the module.

### 3.9 Consumers and coverage

- Sole production consumer: `src/modules/locations/components/PopularLocations.tsx` (the data container). It is
  **not** in scope; the view's props do not change.
- Sole story: `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (`Default`, `LongCityName`), which
  imports the **real production component** and is already toolbar-reactive via `storyT(locale, …)`. Under cl. 16c
  this **is** the canonical Mantine story, it already renders the real node, and it needs **no edit** — the props and
  the DOM shape it exercises are unchanged.
- **No unit or smoke test exists** for `PopularLocationsView` or `PopularLocations` (searched `src/**` for
  `*opularLocation*test*` / `*spec*` — zero hits). Do **not** create one in this task: the change is a pure style
  mechanism swap whose observable contract is the rendered pixel, which R7 already gates far more strictly than a
  DOM-shape assertion could.
- **Not a critical flow.** `docs/critical-flow-registry.md` contains no "popular locations" row (grep verified), so
  cl. 15 does not apply.

### 3.10 The focus-ring hazard — read before writing the module

`focus-visible:ring-2` does **not** compile to a simple `box-shadow`. It sets `--tw-ring-shadow` and then composes
five `--tw-*` custom properties into one `box-shadow`, all of which are `@property`-registered with initial values.
A CSS module cannot rely on that machinery. The module must express the resting-state-equivalent **collapsed** form,
and `--tw-ring-offset-width` is `0px` and `--tw-ring-offset-shadow` is `0 0 #0000` in this project, so the ring
reduces to a `0 0 0 2px <colour>` shadow.

**The ring colour must be derived from the live capture, not assumed.** `focus-visible:ring-ring` sets
`--tw-ring-color`, but `.focus-visible\:ring-ring:focus-visible` is not extractable as a standalone selector from the
bundle (§3.3), and `--tw-ring-color`'s registered initial is `initial`, which makes `var(--tw-ring-color,currentcolor)`
fall back to `currentColor` — and this card sets `c="white"`. Whether the focus ring renders `var(--ring)` or white
today is therefore **not determinable from source alone**. I3 resolves it by measurement. If the measured
before-value and your after-value differ, **stop and report** — do not "fix" the ring in this task.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D16, §3.2 | `PopularLocationsView.tsx` contains **zero** Tailwind utility classes: the `CITY_GRADIENTS` Tailwind strings are gone, and `grep -n 'className' src/modules/locations/components/PopularLocationsView.tsx` returns only `styles.*` / `cn(styles.*)` references. | P0 | AC1 |
| R2 | D16, §3.4 | A new `src/modules/locations/components/PopularLocationsView.module.css` exists, imported as `styles`, carrying every rule a Mantine prop cannot express: the 8 fallback gradients, the photo scrim, `:hover` opacity, the `:focus-visible` ring + outline, and the content `z-index`. | P0 | AC2 |
| R3 | §3.2 | Everything a Mantine prop **can** express uses the prop, not a CSS rule: `display:flex`/`flex-direction:column`/`justify-content:flex-end` → `display`/`Flex` props; `overflow:hidden` → Mantine prop or module rule as measured; `inset:0` → `pos="absolute"` + `inset={0}` where Mantine supports it. Existing props at `:41`, `:42`, `:46`, `:48-56`, `:77` are unchanged. | P0 | AC3 |
| R4 | §3.8 | `className="popular-locations"` at `:46` is deleted, not migrated. | P1 | AC4 |
| R5 | §3.5 | The `:73` inline `zIndex: 1` moves into the module. The three `:42` `fz` rem strings are **unchanged**. | P1 | AC5 |
| R6 | §3.3, §3.10 | For every migrated site, the **live `getComputedStyle` value is identical before and after** for every affected property, including the `:hover` and `:focus-visible` states, captured on the real story. | P0 | AC6 |
| R7 | §3.6 | All **56** `PopularLocationsView` manifest cells keep their exact PNG md5 **and** their exact verdict (28 `pass`; 12 `pass` + 16 `ambiguous` with the same `text-clipped-ellipsis` reason) vs `2026-07-29T17-50`. Across the other 1128 cells: **0 FAIL, 0 verdict changes**; any md5 delta attributed per story per D10. | P0 | AC7 |
| R8 | §3.5 | `check:design-tokens` reports **43 / 0 stale-marker**, with `PopularLocationsView.tsx` at **3** and `PopularLocationsView.module.css` at **0**. | P0 | AC8 |
| R9 | §3.2 | The `:31-38` docstring is rewritten: the superseded "no Mantine equivalent / approved semantic tokens" claim is removed and replaced by the module's rationale and the reproduction convention it follows. | P2 | AC9 |
| R10 | cl. 9, 7, 14 | `npm run build` exits 0 on a fresh post-change transcript; `check:stories`, `check:story-coverage`, `check:i18n` (2215×4, zero new keys), `check:file-integrity`, `check:mojibake` all exit 0. | P0 | AC10 |

---

## 5. Assumptions and open questions

- **A1 — zero rendered delta is the whole point.** If any measurement disagrees, the *implementation* is wrong, never
  the measurement. Report the first value you observe at every checkpoint before any adjustment. Never reach the
  target by relaxing a comparator, and never add an allowlist entry to make a gate pass.
- **A2 — measure, do not string-match.** `.absolute` and `.focus-visible\:ring-ring:focus-visible` are not
  extractable as standalone selectors (§3.3). The **authority is the live `getComputedStyle` capture in I3**, taken
  on the real story before your first source edit. The §3.3 table is corroborating context, not the contract.
- **A3 — the story needs no edit.** It already renders the real production component and is toolbar-reactive
  (§3.9, cl. 16c). Do not retitle it, do not change `skipCanvas`, do not touch `scripts/mantine-migration-scope.json`.
- **A4 — no new test.** §3.9 explains why; R7 is a strictly stronger gate than any DOM assertion you could add.
- **A5 — the worktree start state depends on the owner.** Task 686's commit handoff was emitted at review. Snapshot
  `git status --porcelain` before your first write and record it verbatim. If it is **not** empty, stop and report;
  do not reconcile foreign paths and do not run mutating Git.
- **A6 — do not touch `--overlay`, the heading `fz` triple, or `MantineListingCardPattern`.** All three are named
  follow-ups in §8.
- **A7 — `truncate` at `:77` is the Mantine `Text` prop**, not the Tailwind class. It is not part of this migration
  and removing it would break the 16 ambiguous ellipsis cells.

**Open questions — none.** D15 and D16 are decided; every token exists (§3.7); the one genuinely undetermined value
(the focus-ring colour, §3.10) is resolved by measurement inside the single route, with an explicit stop condition.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14, 16, 16b, 16c.
2. `docs/rule-index.md` — "UI / Layout / Component" → **Current Mantine path**, and "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy section.
4. `docs/mantine-responsive-design-system.md` — style-prop and token-resolution rules.
5. `docs/tailadmin-style-reference.md` — **§4 only**, for confirming that no new visual value is introduced.
6. `docs/storybook-visual-snapshots.md` — the `--mantine-only` proof path and manifest semantics.
7. `docs/qa-rules.md` — validation and encoding rules.
8. `docs/backlog.md` — the numbering line; the file is at exactly **80 lines** and must not grow.

**Source pre-read**

9. `src/modules/locations/components/PopularLocationsView.tsx` — the whole file (86 lines).
10. `src/design-system/mantine/patterns/MantineHomeSection.module.css` — the **reproduction** convention (§3.4.1).
11. `src/modules/listings/components/FavoriteButton.module.css` + `FavoriteButton.tsx:12`, `:125`, `:155` — the
    **colocation** precedent and the inline-`style`-blocks-`:hover` finding (§3.4.2).
12. `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` — both stories.
13. `scripts/check-design-tokens.mjs` — **:85-100** (exclusions), **:100-175** (`DETECTION_PATTERNS`), **:438**
    (the `.css` scan).
14. `src/app/globals.css` — **:48-61**, **:321-328**, **:351-381** (the tokens in §3.7).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/modules/locations/components/PopularLocationsView.tsx` | modify | R1, R3, R4, R5, R9 |
| `src/modules/locations/components/PopularLocationsView.module.css` | **create** | R2 |
| `docs/backlog.md` | modify | Update 688's state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-29-task688-popularlocations-detailwind-cssmodule.md` | **create** | Session log per §14. |

`.screenshots/` output is local-only per **D6** (`.gitignore:55`). Persist evidence under
`.screenshots/task688-delta/` and reference it by path; it will not appear in `git status`.

---

## 8. Out of scope

- **`MantineListingCardPattern.tsx` (28 utilities) and `ListingCard.tsx` (8)** — the larger homepage slice, deferred
  to a follow-up task by **D15**.
- **The section-heading `fz` rem triple** (`'1.25rem'/'1.5rem'/'1.875rem'`) in this file, `page.tsx` and
  `FeaturedListingsView.tsx` — tokenising it is **Task 689**, project-wide, in one task. Changing it here alone would
  desynchronise the homepage headings (§3.5).
- **Swapping the `:68` scrim from `var(--color-black)` to the semantic `--overlay` token** — right in principle, but
  it risks a non-identical serialization and would break R7. Reserved (§3.7).
- **`PopularLocations.tsx`** (the data container) and the view's public props/interfaces.
- **The story file** — no retitle, no `skipCanvas` change, no `scripts/mantine-migration-scope.json` edit (A3).
- **`FeaturedListingsView`/`LatestListingsView` `CardSkeleton` chrome** — separate homepage-debt slices.
- **Creating any test** for this component (A4).
- **Any mutating Git command.**

---

## 9. Current and required behavior

**Current.** `PopularLocationsView` renders a Mantine `SimpleGrid` of `Box component={Link}` cards inside a
`MantineHomeSection`, but its visual chrome is raw Tailwind: the card's flex layout, overflow clipping, hover
opacity, transition, and focus ring come from a 9-utility `className` string; the photo scrim and the 8 fallback
city gradients come from `bg-gradient-to-*` utility chains; `AppImage` and both overlay `Box`es are positioned with
`absolute inset-0`; the content wrapper's stacking comes from an inline `style={{ zIndex: 1 }}`; and a dead
`popular-locations` class rides on the grid. The file contributes 4 of the project's 44 `check:design-tokens`
violations. Its 56 enrolled manifest cells are byte-stable across 5 runs.

**Required after.** Identical rendered output, produced by Mantine style props plus one colocated CSS module. The
card's layout, hover, focus-visible and overflow behaviour, the photo scrim, and all 8 fallback gradients are module
rules that reproduce their prior compiled CSS exactly — same `getComputedStyle` serialization, same 56 PNG md5s, same
verdicts including the 16 `text-clipped-ellipsis` ambiguous cells. `CITY_GRADIENTS` holds module class names, not
Tailwind strings. The dead `popular-locations` class is gone, `zIndex` lives in CSS, and `check:design-tokens` drops
to 43 with the new module contributing zero. No token, no colour, no geometry, and no prop contract changes.

---

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record the snapshot verbatim. Confirm `HEAD`
with `git log -1 --oneline` and quote the subject. A non-empty start state → **stop and report** (A5).

**I1 — baseline gates on the untouched tree.** Record actual output for: `npm run check:stories` (expect 15 checks,
127 files, 0 violations, exit 0), `npm run check:design-tokens` (expect **44 / 0 stale**, with this file at 4 —
quote the 4 lines), `npm run check:story-coverage` (15/15), `npm run check:i18n` (2215×4). A "before" you never
captured is not a baseline.

**I2 — build Storybook once, before any source edit.** `npm run build-storybook`. This is the tree you capture I3
from.

**I3 — capture the BEFORE computed styles (this is the contract, A2).** Against the Storybook build from I2, on
`Mantine/Primitives/PopularLocationsView/Default`, capture `getComputedStyle` for **every** element you intend to
touch, and persist the raw result to `.screenshots/task688-delta/computed-before.json`:

1. the card `<a>` — at rest, on `:hover`, and on `:focus-visible` (force the state; do not infer it). Capture at
   minimum: `display`, `flex-direction`, `justify-content`, `overflow`, `opacity`, `transition-property`,
   `transition-duration`, `transition-timing-function`, `box-shadow`, `outline-style`, `border-radius`, `position`,
   `height`, `padding`, `color`.
2. the `AppImage` wrapper and both overlay `Box`es — `position`, `inset`/`top`/`right`/`bottom`/`left`,
   `background-image`.
3. the content wrapper — `position`, `z-index`.
4. **All 8 gradient variants**, not just the ones the `Default` story happens to render: the story alternates
   photo/gradient by index, so enumerate `CITY_GRADIENTS[0..7]` explicitly.

Capture at **one** locale/viewport for the computed-style contract (`en` / `desktop-1024`); R7's 56-cell md5 check is
what covers the matrix. Record the focus-ring colour you actually measure (§3.10) — that measured value is what your
module must reproduce.

**I4 — write the module, then the component.** Create `PopularLocationsView.module.css` reproducing every captured
value, following `MantineHomeSection.module.css`'s convention (explicit gradient stop positions where the compiled
output carries them; `color-mix(in oklab, …)` colour forms; `var(--token)` sources only — no hex, no `rgb()`/`oklch()`
literal, §3.5). Then rewrite the component per R1/R3/R4/R5/R9. Prefer a Mantine prop wherever one exists; put a rule
in the module only where a prop cannot express it (`:hover`, `:focus-visible`, gradients).

**I5 — capture the AFTER computed styles and diff.** Rebuild Storybook, repeat I3 exactly, persist
`computed-after.json`, and produce `computed-diff.json`. **Required: zero differing properties.** Quote the diff
result. Any non-empty diff → fix the module, never the comparator (A1). If a property cannot be reproduced, **stop
and report** with the before/after pair.

**I6 — rendered proof (R7).** `npm run screenshots:assert -- --mantine-only`, compared against
`.screenshots/rendered-assert/2026-07-29T17-50/`:

1. For the **56** `PopularLocationsView` cells: PNG md5 **identical** and verdict **identical** (28 `pass`; 12 `pass`
   + 16 `ambiguous`/`text-clipped-ellipsis`). Any changed md5 in these 56 is a **stop and report** — this story has
   0 changes across 560 prior cell-comparisons (§3.6), so a delta here is signal, not noise.
2. For the other **1128** cells: 0 FAIL, **0 verdict changes**; attribute every md5 delta per story per D10 and
   compare against 686's documented capture-noise set.
3. Persist the comparison under `.screenshots/task688-delta/`.

**I7 — token and gate checks (R8, R10).** `npm run check:design-tokens` — expect **43 / 0 stale**, this file at 3,
the new module at **0**; quote the per-file lines. Then `npm run typecheck`, `npm run check:stories`,
`npm run check:story-coverage`, `npm run check:i18n`, and `npx vitest run` (report any pre-existing full-run-only
timeout with its isolated re-run; the documented set is `date-format-ssr-parity`, `RangeDatePicker`,
`saveSavedSearch.dedup`).

**I8 — `npm run build` runs last** and must exit 0. Quote the transcript tail **including the route table**.

**I9 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then run `check:file-integrity` and `check:mojibake` **after** the records
exist, so their changed-set includes them, and quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9.

---

## 11. Positive and negative flows

### Positive flow

A visitor loads the homepage. The "Popular locations" band renders 8 city cards: even-indexed cards show a photo with
a top-to-bottom black scrim, odd-indexed cards show their brand/badge fallback gradient. Each card is a link with
rounded corners, clipped overflow, white text bottom-aligned, a pin icon, and a truncated city name. Hovering fades
the card to 90% opacity over 0.15s; keyboard focus draws a 2px ring and suppresses the native outline. **Every one
of those observations is pixel-identical to before this task**, because the module reproduces the same computed
values — proven by I5's empty computed diff and I6's 56 identical md5s.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **No photo** (`imageUrl` null) | **Yes** | `:70-72` | fallback gradient `CITY_GRADIENTS[i % 8]` renders; all 8 variants reproduced | AC6, AC7 |
| **Photo present** | **Yes** | `:60-69` | `AppImage` + scrim render, same stacking order | AC6, AC7 |
| **Empty `locations` array** | **Yes** | `:47` | `SimpleGrid` renders no children; `PopularLocations` already returns null upstream when there are no featured locations — unchanged | AC3 |
| **Long city name** | **Yes** | §3.6 | `truncate` clips to one line with an ellipsis; the 16 `ambiguous` cells stay `ambiguous` with the same reason | AC7 |
| **`:hover`** | **Yes** | §3.4.2 | opacity 0.9 over the transition; must come from a module rule, never inline `style` | AC6 |
| **`:focus-visible`** | **Yes** | §3.10 | 2px ring + `outline-style:none`, reproducing the **measured** colour | AC6 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | 2-column grid, no horizontal overflow; `noHorizontalOverflow` stays true in all 320/375/390 cells | AC7 |
| **All four locales** | **Yes** | cl. 7 | headings differ in length only; zero new keys | AC7, AC10 |
| **New CSS module scanned by `check:design-tokens`** | **Yes** | §3.5 | 0 violations from the module; total 43 | AC8 |
| **Dead class removal breaks a selector or anchor** | **Yes** | §3.8 | nothing targets it; `anchorsExpected: []` — no effect | AC4, AC7 |
| Validation / authorization / RLS | No | Presentational component; no data path, no write, no permission boundary | N/A | — |
| Locale expansion / new strings | No | No user-facing string added or changed; `heading` stays a prop | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row for popular locations (§3.9) | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final `PopularLocationsView.tsx`, *then*
  `grep -n 'className' src/modules/locations/components/PopularLocationsView.tsx` shows only `styles.*`/`cn(styles.*)`
  references, `CITY_GRADIENTS` contains module class names not `bg-gradient-*` strings, and
  `grep -nE '(bg-gradient|absolute|inset-0|flex-col|justify-end|overflow-hidden|hover:|focus-visible:|transition-)'`
  on that file returns **0 hits**.
- **AC2 [R2]** — *Given* the final tree, *then* `PopularLocationsView.module.css` exists beside the component, is
  imported as `styles`, and contains rules covering: 8 fallback gradients, the photo scrim, `:hover` opacity +
  transition, `:focus-visible` ring + outline, absolute-fill positioning, and the content `z-index`.
- **AC3 [R3]** — *Given* the final diff, *then* every value Mantine can express is a prop, and the pre-existing props
  at `:41`, `:42`, `:46`, the card's `pos`/`h`/`p`/`c`/`bdrs`, `data-track`, and `:77`'s `fw`/`size`/`lh`/`truncate`
  are unchanged. The component's exported interfaces and props are byte-unchanged.
- **AC4 [R4]** — *Given* the final file, *then* `grep -n 'popular-locations' src/` returns no hit inside this
  component.
- **AC5 [R5]** — *Given* the final file, *then* no inline `zIndex` remains, and the three `:42` `fz` rem strings are
  byte-identical to before (quote the line).
- **AC6 [R6]** — *Given* `computed-before.json` and `computed-after.json` from I3/I5, *then* `computed-diff.json` is
  **empty** across every captured element, property, and state — including `:hover` and `:focus-visible`, and all 8
  gradient variants. Both raw captures are persisted, not just the diff.
- **AC7 [R7]** — *Given* a fresh `build-storybook` + `--mantine-only` run compared to `2026-07-29T17-50`, *then* all
  56 `PopularLocationsView` cells have identical PNG md5 **and** identical verdict (28 `pass`; 12 `pass` + 16
  `ambiguous` with `failReason: "text-clipped-ellipsis"`); across the other 1128 cells 0 FAIL and 0 verdict changes,
  with every md5 delta attributed by story.
- **AC8 [R8]** — *Given* `npm run check:design-tokens`, *then* it reports **43 raw + 0 stale-marker**, with
  `PopularLocationsView.tsx` at **3** (the three `fz` rem strings) and `PopularLocationsView.module.css` **absent
  from the violation list**. Quote the per-file section.
- **AC9 [R9]** — *Given* the final file, *then* the `:31-38` docstring no longer claims the classes have "no Mantine
  equivalent", and instead names the module, its reproduction convention, and the inline-`style`-blocks-`:hover`
  reason for choosing a module over inline styles.
- **AC10 [R10]** — `npm run build` exits 0 on a fresh transcript (quote the tail **including the route table**; do not
  cite `.next/BUILD_ID`). `check:stories` 0 (15 checks/127 files), `check:story-coverage` 0 (15/15),
  `check:i18n` 0 at 2215×4 with zero new keys, `typecheck` 0, and `check:file-integrity`/`check:mojibake` 0 **after**
  the records exist — quote their file counts.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`**, per `docs/qa-profiles.md`: this is a migrated Mantine surface whose **visual chrome,
radius, gradient, and interaction styling are the entire subject** of the change. It is not `Q4` — no
`docs/critical-flow-registry.md` row is touched (§3.9) and no gate is being authored, so no planted-violation proof
is required. It is not `Q2` — the change is styling-only on a manifest-enrolled primitive, which is exactly the Q3
trigger.

**Declared proof path.** `--mantine-only` over the 71 enrolled stories / 1184 cells at 4 locales × 7 viewports
(320/375/390/1024/1200/1440/1536). The 56 `PopularLocationsView` cells carry the **tightened md5-identity**
comparator justified by §3.6's 0/560 measurement; the rest carry D10's standard 0-verdict-changes comparator. The
remaining canonical widths beyond these 7 stay **Task 678's** scope.

**TailAdmin side-by-side: not required.** No new visual value is introduced — every value is a reproduction of an
existing compiled output (§3.3), so cl. 16/16a are satisfied by the computed-style equality proof in AC6 rather than
by a reference row. If any value turns out not to be reproducible, that is a **stop and report**, not a licence to
pick a TailAdmin value.

### 13.2 Worktree

Snapshot `git status --porcelain` before the first write and record it verbatim. If it is not empty, **stop and
report** (A5). No dirty-worktree manifest is required for a clean start.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:stories` | 0 — 15 checks, 127 files, 0 violations |
| `npm run check:design-tokens` (before) | **44 / 0 stale**, this file at 4 (AC8 baseline) |
| `npm run check:design-tokens` (after) | **43 / 0 stale**, this file at 3, module at 0 (AC8) |
| computed-style before/after diff | **empty** (AC6) |
| `npm run typecheck` | 0 |
| `npx vitest run` | 0 new failures attributable to this diff; report any pre-existing full-run-only timeout with its isolated re-run |
| `npm run check:story-coverage` | 0, total unchanged at 15/15 |
| `npm run build-storybook` | 0 (run twice — before I3 and before I6) |
| `npm run screenshots:assert -- --mantine-only` | 56 target cells md5- and verdict-identical; 0 FAIL and 0 verdict changes elsewhere (AC7) |
| `npm run check:i18n` | 0, 2215×4, zero new keys |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I9**, scanned set must include the session log and backlog |
| `npm run build` | **0 — hard gate**, transcript tail **including the route table** quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-29-task688-popularlocations-detailwind-cssmodule.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7's paths only.
2. The start snapshot and the **true final** `git status --porcelain`, taken *after* the records are written.
3. R1–R10 mapped to AC1–AC10 with evidence.
4. The full **before → after mapping table**: every removed utility, its compiled CSS (§3.3), and the Mantine prop or
   module rule that replaces it, with the measured computed value for each.
5. The **measured focus-ring colour** from I3 and confirmation that the module reproduces it (§3.10).
6. `computed-before.json`, `computed-after.json`, `computed-diff.json` paths, with the diff result quoted.
7. The 56-cell md5 + verdict comparison table, and the per-story attribution for the other 1128 cells.
8. The `check:design-tokens` before/after per-file sections quoted (44→43).
9. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim including the
   route table.
10. Deviations, each with a reason.
11. Limitations — at minimum: the declared 7-width proof path (§13.1); that the `--overlay` token swap, the heading
    `fz` triple (Task 689), and `MantineListingCardPattern` are deferred (§8); and that `.screenshots/` evidence is
    local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_688_PopularLocationsView_DeTailwind_CssModule.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, compiled rule, token, count, command and owner ruling is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC10 |
| Scope names what must not change | **Yes** — §8, incl. the heading `fz` triple, the `--overlay` swap, the story, the container, the ListingCard slice, and test creation |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 with the not-Q4 and not-Q2 reasons stated; §17 |
| Canonical-source search performed before proposing a style | **Yes** — §17; the search found the canonical story already renders the real node and needs no edit (cl. 16c), and two binding CSS-module precedents (§3.4) |
| Owner-only exceptions traceable | **Yes** — D6/D10 standing with dates, D15/D16 new (§3.1) |
| Baselines account for task-created artifacts | **Yes** — §3.6 names `17-50`; `.screenshots/task688-delta/` is marked task-created with no prior baseline |
| Worktree handling | **Yes** — §13.2 records the snapshot with an explicit stop condition |
| Gates prove the changed behavior | **Yes** — a computed-style before/after diff that must be *empty*, plus md5 identity on 56 cells backed by a measured 0/560 stability baseline, plus a falsifiable token-count move 44→43 |
| Single active owner route | **Yes** — the only forks are A5's non-empty-start stop, I5's non-empty-diff stop, I6's changed-target-cell stop, and §3.10's ring-mismatch stop |
| API claims verified, not assumed | **Yes** — §3.3 quotes the real built bundle; §3.5 quotes the real detector patterns and the real 44-violation breakdown; §3.6 is a measured 10-pair md5 comparison over 5 retained runs; §3.8/§3.9 are grep- and manifest-verified negatives |

**Known-risk note for the reviewer.** Five likely defects. First, **using inline `style` for `:hover`/`:focus-visible`**
— `FavoriteButton.module.css`'s Task 653 finding proves it silently blocks the module's own rules; AC6's forced-state
capture detects it. Second, **copying `FavoriteButton.module.css`'s raw `#hex`/`rgba()` style**, which would add to
the 44 baseline; AC8 detects it. Third, **string-matching the bundle for `.absolute` / `focus-visible:ring-ring`**,
which are not extractable as standalone selectors — A2 makes the live capture the authority. Fourth, **"fixing" the
focus ring** if the measured colour turns out to be `currentColor` rather than `var(--ring)`; §3.10 makes that a stop,
not a licence. Fifth, **tokenising the heading `fz` triple** as a drive-by, desynchronising the homepage headings;
§3.5 and §8 forbid it.

---

## 16. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Card layout | `:48-59` `<Box component={Link}>` | `.flex .flex-col .justify-end` | `display:flex` / `flex-direction:column` / `justify-content:flex-end` | **changed mechanism, identical output** | AC6 |
| Card clipping | same | `.overflow-hidden` | `overflow:hidden` | **changed mechanism, identical output** | AC6 |
| Card hover | same | `.hover\:opacity-90:hover` + `.transition-opacity` | `opacity:.9`; `transition-property:opacity`, duration `var(--tw-duration,.15s)`, timing `cubic-bezier(.4,0,.2,1)` | **changed mechanism, identical output** | AC6 |
| Card focus ring | same | `.focus-visible\:ring-2` + `.focus-visible\:ring-ring` + `.focus-visible\:outline-none` | `--tw-ring-shadow: … 0 0 0 calc(2px + 0px) var(--tw-ring-color,currentcolor)`; colour **measured, not assumed** (§3.10) | **changed mechanism, identical output** | AC6 |
| Card radius / size / padding / text colour | same | `bdrs="xl"`, `h={112}`, `p="sm"`, `c="white"` | Mantine props, theme-resolved | **preserved, untouched** | AC3 |
| Photo fill | `:62-67` `<AppImage>` | `.absolute .inset-0` | `position:absolute`; `inset:var(--space-0)` = `0px` | **changed mechanism, identical output** | AC6 |
| Photo scrim | `:68` `<Box>` | `.bg-gradient-to-t .from-black\/60 .via-black\/20 .to-transparent` | `linear-gradient(to top in oklab, color-mix(in oklab,var(--color-black) 60%,transparent), color-mix(… 20% …), transparent)` | **changed mechanism, identical output** | AC6 |
| Fallback gradients ×8 | `:71` `<Box>` via `CITY_GRADIENTS` | `.bg-gradient-to-br .from-* .to-*` | `to bottom right in oklab` over `--primary`, `--brand-800`, `--brand-950`, `--badge-new`, `--badge-premium` (globals.css §3.7), with 70/80/90% `color-mix` alphas | **changed mechanism, identical output** | AC6, AC7 |
| Content stacking | `:73` `<Box>` | inline `style={{zIndex:1}}` | raw inline z-index — 1 of the 44 token violations | **moved to module** | AC5, AC8 |
| Grid hook class | `:46` `<SimpleGrid>` | `.popular-locations` | referenced nowhere; not a gate anchor | **deleted** | AC4 |
| Section band | `:41` `<MantineHomeSection variant="muted">` | `.band .muted` | Task 662 module, already canonical | **out of scope, untouched** | §8 |
| Heading | `:42` `<Title fz={{…rem}}>` | inline responsive `fz` | 3 of the 44 violations; shared with `page.tsx` + `FeaturedListingsView` | **out of scope — Task 689** | §3.5, AC5 |
| City name truncation | `:77` `<Text truncate>` | Mantine prop | drives the 16 `text-clipped-ellipsis` ambiguous cells | **preserved, untouched** | A7, AC7 |
| Pin icon | `:75` `<MapPin style={{opacity:.7}}>` | inline opacity | not a token violation, not a Tailwind class | **preserved, untouched** | AC3 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| `PopularLocationsView` card chrome | read the full component; `find src -name '*.module.css'` (5 hits, all read); read `MantineHomeSection.module.css` + `FavoriteButton.module.css` + `FavoriteButton.tsx:12/125/155`; read `check-design-tokens.mjs:85-175,438` + `design-tokens-allowlist.json` | `Mantine/Primitives/PopularLocationsView` (`Default`, `LongCityName`) — imports the **real production component**, toolbar-reactive via `storyT()`, 56 enrolled cells | **reuse** — consume the existing `globals.css` tokens and the existing story; introduce **no** new visual value | new `PopularLocationsView.module.css` colocated per the `FavoriteButton` precedent, written per the `MantineHomeSection` reproduction convention; no catalog or coverage change (the component is already in `scripts/mantine-migration-scope.json`) |
| Section band (`variant="muted"`) | read `MantineHomeSection.tsx` + `.module.css` | `Patterns/Mantine/HomeSection` (Task 662/669) | **reuse, not in diff** | already canonical; untouched |
| Section heading size | `grep` for the `1.25rem/1.5rem/1.875rem` triple → `page.tsx`, `FeaturedListingsView.tsx`, `LatestListingsView.tsx`, this file | no story owns a raw `fz` triple | **deferred** — tokenising it in one file only would desynchronise the homepage | **Task 689**, project-wide (§8) |

**Clause 16c note.** The canonical story exists, renders the real production component (not a slot stand-in or demo
fixture), and requires **no edit**: the props, DOM shape, and rendered pixels are all unchanged by design. Its 56
enrolled cells are the primary acceptance evidence (AC7), which is the strongest possible form of "the Story was not
bypassed".

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 1 component + 1 new module | Exactly 2 `src/` paths changed; no story, container, or sibling view touched | §7, §8, AC3 | required |
| cl. 3/5 (capabilities and UX flows intact) | A link grid with hover/focus affordances | Every card stays a focusable link with the same hover, focus, truncation and empty behaviour | §11, AC6, AC7 | required |
| cl. 7 (four locales) | Rendered surface | Zero new keys; parity 2215×4; all 4 locales in the 56-cell comparison | AC7, AC10 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table | AC10 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | 2-col grid, `noHorizontalOverflow` true at 320/375/390 in all locales | AC7 | required |
| cl. 12 (rendered evidence follows risk) | Q3, styling-only on an enrolled primitive | 56 cells md5- and verdict-identical; 0 verdict changes elsewhere | AC7 | required |
| cl. 13 (Storybook gates enforceable) | Story-rendered primitive | `check:stories` 0, `check:story-coverage` 15/15; canonical story preserved | AC10, §17 | required |
| cl. 14 (file integrity) | 2 modified + 2 created text files | UTF-8 no BOM, no mojibake, scanned set includes the records | AC10 | required |
| cl. 15 (critical flows) | **No registry row** for popular locations (grep-verified) | Not applicable — stated as an explicit negative, not silence | §3.9 | N/A, declared |
| cl. 16 (TailAdmin visual source) | Visual chrome in scope | No new value introduced; equality proof replaces a side-by-side | AC6, §13.1 | required |
| cl. 16b (canonical provenance before code) | 13 visible artifacts mapped | Canonical search recorded; disposition `reuse` for every one | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Migrated Mantine artifact changes | Story inspected, renders the real component, needs no edit; its 56 cells are the acceptance evidence | §3.9, §17, AC7 | required |
| cl. 10 (git ownership) | — | Start snapshot recorded; diff limited to §7; no mutating Git by the executor | A5, §14 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 688 |
| Active route / owner decision | Single route: capture the live computed styles, write a colocated `PopularLocationsView.module.css` that reproduces them exactly, move every expressible value onto a Mantine prop, delete the dead class and the inline `zIndex`, then prove zero delta by an empty computed diff + 56 identical PNG md5s (owner **D15/D16**, 2026-07-29; **D10** sets the comparator for the other 1128 cells; **D6** governs `.screenshots/` visibility) |
| Decision source, date, scope | Owner, 2026-07-29, following the homepage-tree audit; scope = one component + one new CSS module; **no** story change, **no** container change, **no** ListingCard slice, **no** heading tokenisation, **no** `--overlay` swap |
| Starting worktree mode | Recorded at I0 with an explicit non-empty stop condition (A5) |
| Producer of each checkpoint | start snapshot → baseline gates (`stories`/`design-tokens` 44/`story-coverage`/`i18n`) → storybook build #1 → **computed-before capture** → module + component rewritten → storybook build #2 → **computed-after capture + diff** → `--mantine-only` 56-cell md5/verdict comparison → design-tokens 43 → typecheck/vitest/coverage/i18n → build → records → post-records encoding gates |
| Persisted result | start/end porcelain snapshots; `computed-before.json`, `computed-after.json`, `computed-diff.json` and the manifest comparison under `.screenshots/task688-delta/`; every gate transcript; build tail with route table; session log |
| Comparator | computed-style diff **empty**; **56/56** target cells md5-identical **and** verdict-identical (28 pass; 12 pass + 16 ambiguous/`text-clipped-ellipsis`); other 1128 cells 0 FAIL and **0 verdict changes**; `design-tokens` **43 / 0 stale** with this file at 3 and the module at 0; `check:stories` 15 checks/127 files/0; `story-coverage` 15/15; `i18n` 2215×4 |
| Failure path | Non-empty start state → stop (A5); non-empty computed diff → fix the module, never the comparator (A1); any md5 change among the 56 target cells → stop and report (§3.6 measured 0/560); measured focus-ring colour irreproducible → stop and report, do not "fix" it (§3.10); a value with no reproducible compiled source → stop, do not substitute a TailAdmin value (§13.1) |
| Zero/empty input case | Empty `locations` array renders an empty `SimpleGrid` (upstream `PopularLocations` already returns null when there are no featured locations) — unchanged and explicitly preserved. Separately, the **empty computed diff** is the success state of I5, so the comparator must distinguish "diff ran and was empty" from "diff never ran": the raw before/after captures are persisted alongside it as the producer witness |
| Task-created artifacts in baselines | `.screenshots/task688-delta/` is task-created with **no** pre-change baseline — evidence, not a regression surface. The `--mantine-only` baseline is `2026-07-29T17-50` (Task 686's reviewed post-change run), **not** `16-29` |
