# Task 763 — `AppImage` de-Tailwind: 21 variant strings, 4 inline strings, and the `group`/`group-hover` pair

**Sprint:** 63 — Homepage exits Tailwind · **Phase:** 1 · **Priority:** P1
**Filed:** 2026-08-21 against `main` @ `201683f9d`, worktree clean
**Status:** KICKOFF FILED — awaiting execution

---

## 1. Mode and task type

`IMPLEMENTATION` · **UI / design-system migration (D28 de-Tailwind), mixed boundary.**

`AppImage` is a **deliberate native `<img>` wrapper** and stays one. This is not a Mantine component migration: no
`@mantine/*` import is added, no `Box`/`Image` replaces the `<div>` or the `<img>`, and no Mantine style prop
replaces a class. The current side of the boundary is the CSS Module that replaces the utilities; the legacy side
is the Tailwind utilities being read out of the built CSS to define what "unchanged" means.

**Owner decision, 2026-08-21, quoted:** *"AppImage має лишитися native `<img>` wrapper. Mantine style props тут
додадуть зайву різницю в CSS-пріоритетах і ускладнять 14 споживачів без вигоди. Задача має: зберегти API, variant
names, className, LQIP, preload і performance-tier логіку; замінити Tailwind strings у `appImageConfig.ts` на
семантичні CSS Module класи; винести базові absolute/inset/object-fit/opacity/transition і variant-стилі в
`AppImage.module.css`; перевірити всі 9 variants, але візуально порівняти насамперед Homepage `listing` і
`listing-thumb`. Окремий preflight не потрібен: його варто зробити першою фазою цієї ж ізольованої задачі."*

This decision is the task's single active route. Do not implement an alternative.

## 2. Objective

Remove every Tailwind utility string from `src/components/ui/appImageConfig.ts` and `src/components/ui/AppImage.tsx`
by moving their **compiled declarations** into a new `src/components/ui/AppImage.module.css`, with **zero change to
rendered geometry, image delivery, LQIP, preload, or performance-tier behaviour** at any of the 9 variants, and
without introducing a single new Tailwind-owned or `@theme inline` custom-property reference.

Close the `group` / `group-hover:scale-105` pair in the same commit so Task 691R finding F-A cannot re-open.

## 3. Verified context

Every fact in this section was measured on `201683f9d` by the task author. Facts marked **I0** must be re-measured
by the executor as freshness validation before any write; the author's trace is retained in
`Sprint_63_Task_763_evidence_preflight.md`.

### 3.1 The Tailwind strings to remove — `appImageConfig.ts` (21 strings, 9 variants)

| Variant | Line | Field | Value |
|---|---|---|---|
| `listing` | 64 | `containerClass` | `relative aspect-[4/3] w-full overflow-hidden bg-muted` |
| `listing` | 65 | `imageClass` | `object-cover` |
| `listing` | 66 | `hoverClass` | `group-hover:scale-105` |
| `preview` | 78 | `containerClass` | `relative aspect-[16/9] w-full overflow-hidden bg-muted` |
| `preview` | 79 | `imageClass` | `object-cover` |
| `upload` | 90 | `containerClass` | `relative aspect-[4/3] w-full overflow-hidden bg-muted` |
| `upload` | 91 | `imageClass` | `object-cover` |
| `avatar` | 102 | `containerClass` | `relative aspect-square overflow-hidden rounded-full bg-muted` |
| `avatar` | 103 | `imageClass` | `object-cover` |
| `listing-thumb` | 114 | `containerClass` | `relative w-full h-full overflow-hidden` |
| `listing-thumb` | 115 | `imageClass` | `object-cover` |
| `gallery-main` | 127 | `containerClass` | `relative w-full h-full overflow-hidden` |
| `gallery-main` | 128 | `imageClass` | `object-cover` |
| `gallery-main` | 129 | `hoverClass` | `group-hover:brightness-95` |
| `gallery-side` | 146 | `containerClass` | `relative w-full h-full overflow-hidden` |
| `gallery-side` | 147 | `imageClass` | `object-cover` |
| `gallery-side` | 148 | `hoverClass` | `group-hover:brightness-95` |
| `gallery-strip` | 160 | `containerClass` | `relative w-full h-full overflow-hidden` |
| `gallery-strip` | 161 | `imageClass` | `object-cover` |
| `lightbox` | 172 | `containerClass` | `relative w-full h-full` |
| `lightbox` | 173 | `imageClass` | `object-contain` |

**19 distinct utilities:** `relative` · `absolute` · `inset-0` · `w-full` · `h-full` · `aspect-[4/3]` ·
`aspect-[16/9]` · `aspect-square` · `overflow-hidden` · `bg-muted` · `rounded-full` · `object-cover` ·
`object-contain` · `transition` · `duration-300` · `opacity-100` · `opacity-0` · `group-hover:scale-105` ·
`group-hover:brightness-95`.

### 3.2 The Tailwind strings to remove — `AppImage.tsx` (4 strings, lines 143-152)

```
className={cn(
  'absolute inset-0 w-full h-full',            // line 144
  !priority && 'transition duration-300',      // line 148
  loaded || priority ? 'opacity-100' : 'opacity-0',  // line 149
  imageClass,                                  // line 150
  hoverClass,                                  // line 151
)}
```

Line 122 is `className={cn(containerClass, className)}` — the container. The `className` prop is documented at
line 25 as *"Non-layout classes for the wrapper container (cursor, group, rounding, etc.)"* and **must keep taking
arbitrary caller classes**; 14 consumers pass one.

### 3.3 The coupled pair

`src/design-system/mantine/patterns/MantineListingCardPattern.tsx:304`:

```
'group', // 691R — restores the group-hover:scale-105 ancestor consumed via AppImage's `hoverClass` (F-A)
```

`group` is a Tailwind marker class with no declarations of its own; it exists solely so
`.group:hover .group-hover\:scale-105` matches. When `hoverClass` stops being a Tailwind utility, `group` becomes
dead **at this site**. Lines 305-306 (`'flex flex-col'`, `'grayscale opacity-60'`) are Sprint 63 Phase 2 and are
**out of scope here**.

### 3.4 Consumers — 14 production files, 3 on the homepage graph

`ListingCard.tsx` (`listing`, `listing-thumb`) · `PopularLocationsView.tsx` (`listing-thumb`) ·
`MantineListingCardPattern.tsx` (renders the `image` node) — **homepage**.
`ListingGallery.tsx` (`gallery-main`, `gallery-side`) · `LightboxView.tsx` (`gallery-strip`, `lightbox`) ·
`ImageUpload.tsx` (`upload`) · `steps/StepPreview.tsx` (`preview`) · `ListingsTab.tsx` (`listing-thumb`) ·
`AdminCompaniesManager.tsx` (`avatar`) · `AdminLocationsManager.tsx`, `AdminPopularLocationsManager.tsx`,
`AdminUserAvatar.tsx` (`listing-thumb`) — off-homepage.

### 3.5 Existing Storybook coverage — I0 re-measure required

Stories that render `AppImage` today: `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` and
`src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (grep for `AppImage` across `src/stories/`
returns exactly these two). Additional stories whose components render it indirectly:
`HomepageListingGrids.stories.tsx`, `ListingCard.stories.tsx`, `ListingGalleryPattern.stories.tsx`,
`LightboxView.stories.tsx`.

**`preview`, `upload` and `avatar` have no Storybook coverage.** Their production consumers are `StepPreview.tsx`,
`ImageUpload.tsx` and `AdminCompaniesManager.tsx`. This is not authorization to add a story — see §7 and §10.5.

### 3.6 Token declaring blocks — this is where the task can silently fail

| Token | Declared at | Block | Safe to write? |
|---|---|---|---|
| `--muted` | `globals.css:371` | `:root` | ✅ yes |
| `--color-muted` | `globals.css` `@theme inline` | `@theme inline` | ❌ **no** — Class 3, dies with Tailwind, and the 762 gate classifies it `project` and will not flag it |
| `--radius` | `globals.css:445` | `:root` | ✅ yes |
| `--duration-slow` (`300ms`) | `globals.css:269` | `@theme inline` | ⚠️ **token reference required by rule 3, and it adds a Phase 3 inventory row** — see R8 |
| `--ease-standard` | `globals.css:273` | `@theme inline` | ⚠️ same as above, only if the compiled `transition` shorthand names a timing function |

`bg-muted` compiles through `@theme inline`, whose whole purpose is to inline the referenced value at the utility
site. Whether the built declaration is `background-color: var(--muted)` or `background-color: var(--color-muted)` is
**not assumed here** — I1 measures it. If it is the latter, R8 applies and the module writes `var(--muted)`, with
the substitution recorded and proven value-identical.

### 3.7 Gate baseline — I0 re-measure required

`node scripts/check-tailwind-runtime-tokens.mjs` on `201683f9d`: *"scanned 23 `src/**/*.module.css` file(s) …
Tailwind-owned references found: 14 | baseline entries: 14"*, exit 0. This task **adds a 24th module file**, which
the gate will scan on the next run. A single Class-2 name in the new module turns the gate red — by design.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner decision 2026-08-21 | `appImageConfig.ts` contains zero Tailwind utility strings; `containerClass`/`imageClass`/`hoverClass` carry CSS Module class names | P0 | AC1 · grep + `npm run governance:tailwind` | Confirmed |
| R2 | Owner decision 2026-08-21 | `AppImage.tsx` lines 144/148/149 carry no Tailwind utility string | P0 | AC2 · inspection | Confirmed |
| R3 | Owner decision 2026-08-21 | `AppImage`'s public API is byte-identical: `AppImageProps` fields, their types, their JSDoc, `ImageVariant` union members, `VARIANTS` keys, and the `className` prop's arbitrary-class contract | P0 | AC3 · `npm run typecheck` + interface diff | Confirmed |
| R4 | Owner decision 2026-08-21 | LQIP (`blurUrl`, `useLqip`, the `style` background branch), `preload`/`shouldPreload`/`notifyPriorityPreload`, `usePredictivePreload`, `fetchPriority`, `loading`, `srcset`/`sizes` and the performance-tier branches are unchanged in behaviour and in hook call order | P0 | AC4 · diff + existing smoke tests | Confirmed |
| R5 | D28 / Task 709 precedent | Every replacement declaration reproduces the **prior utility's own compiled declarations**, extracted from the built CSS (I1), not re-authored from intent | P0 | AC5 · retained I1 extraction table | Confirmed |
| R6 | D34, Sprint 63 rule 5 | The module's cascade standing reproduces the utilities' losing standing: rules wrapped in `@layer utilities`, with the disposition and its reason stated in the file header | P0 | AC6 · computed-style parity at I4 | Confirmed |
| R7 | Task 691R finding F-A | `group-hover:scale-105` and `group-hover:brightness-95` are replaced by a mechanism that does not require a Tailwind marker class, and `'group'` at `MantineListingCardPattern.tsx:304` is removed in the same commit — with hover measurably still applying | P0 | AC7 · hover computed-style capture | Confirmed |
| R8 | Sprint 63 rules 3+4 | No new Tailwind-owned (`Class 2`) reference. Every `@theme inline` (`Class 3`) reference the module writes is listed in the completion report with its declaring block and its `globals.css` line, and is value-identical to the compiled original | P0 | AC8 · gate exit 0 + the report's inventory | Confirmed |
| R9 | Sprint 63 rule 1 | A two-armed plant proves the verification apparatus can fail: one arm changes a geometry declaration, one arm deletes a `hoverClass` rule; both are observed red, then reverted | P0 | AC9 · plant transcripts | Confirmed |
| R10 | `docs/qa-profiles.md` | All 9 variants verified; `listing` and `listing-thumb` carry full rendered before/after evidence at the Q3 matrix | P0 | AC10 · rendered manifests | Confirmed |
| R11 | `create-task` permanent-story gate | No permanent Storybook markup is added. Any probe is reversible with `git hash-object` restoration evidence | P0 | AC11 · pre-probe hash + `git status --porcelain` | Confirmed |
| R12 | Standing governance | `npm run build` exits 0 | P0 | AC12 · transcript | Confirmed |

## 5. Assumptions and open questions

- **A1 (`INFERENCE`, must be measured at I1):** `bg-muted` compiles to a declaration naming either `--muted` or
  `--color-muted`. The task does not depend on which; R8 fixes the target either way. If I1 returns a third form
  (a literal colour, or an `oklch()` call), record it and write the `:root` token reference that is value-identical.
- **A2 (`INFERENCE`, must be measured at I1):** `rounded-full` compiles to a single `border-radius` declaration.
  Tailwind v4 has shipped both `9999px` and `calc(infinity * 1px)` for this utility across minor versions. Reproduce
  what the built CSS actually contains at `tailwindcss@4.3.0`; do not write `9999px` from memory. If the result is a
  raw literal that `check:design-tokens` rejects, report it as a `CONFLICT` — do **not** add a
  `design-tokens-allow:` marker (Sprint 63 rule 2).
- **A3 (`UNKNOWN`):** whether `transition` (bare) compiles to a `transition-property` list that names a `--tw-*`
  bookkeeping property. Task 762 Revision 1's E-1 finding is that such a name inside a `transition-property` value
  is invisible to a `var(`-only scan and **is** flagged by the current gate. If the extraction produces one,
  flatten it to the literal property list; do not carry a `--tw-*` name into the new module.
- **A4 (`UNKNOWN`):** whether any of the 14 consumers passes a `className` that depends on the container being
  `position: relative` from the utility rather than from the module. The I2 baseline covers this for the 6 variants
  with story coverage; the other 3 are covered by the I1 declaration diff only. State this limit in the report.
- **Q1 (open, does not block):** `avatar`, `upload` and `preview` have no rendered proof path. §10.5 specifies the
  non-rendered comparator. If the executor finds that insufficient, report `PARTIALLY IMPLEMENTED` naming the
  variant — do not create a story.

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan for image-delivery / listing-detail entries only).

**Current Mantine path (`docs/rule-index.md` → UI / Layout / Component):**
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` · `docs/component-rules.md` ·
`docs/ui-rules.md` (routing and legacy-boundary notes only) · `docs/qa-rules.md`.

**Legacy boundary (the utilities being read, not written):** `docs/design-system.md` §23.7 (Tailwind runtime-token
rule) · `docs/tailwind-governance.md`.

**Task-specific:** `docs/performance.md` (R4 — `AppImage` is the LCP render site) ·
`tasks/Sprints/Sprint_63_Homepage_Exits_Tailwind.md` (this sprint's five binding rules) ·
`src/components/shared/HeroSearchView.module.css` header comment (the D34 disposition this task copies) ·
`scripts/check-tailwind-runtime-tokens.mjs` header (ownership buckets and the `@theme inline` finding).

**Session protocol:** the automatically injected `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

Exactly these paths may be written:

1. `src/components/ui/appImageConfig.ts` — `VARIANTS` class fields only.
2. `src/components/ui/AppImage.tsx` — the two `cn()` calls (lines 122, 143-152) and the module import only.
3. `src/components/ui/AppImage.module.css` — **new file.**
4. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — removal of the `'group'` argument at line
   304 and its comment only.
5. `docs/backlog.md` — concise current state per the executor protocol.
6. `docs/sessions/<date>-task763-*.md` — the session log.
7. `docs/sessions/evidence/task763/**` — I1 extraction table, I2/I4 computed-style captures, plant transcripts.

Any other path is out of scope and its modification is a review rejection.

## 8. Out of scope

- **Replacing the native `<img>` or the `<div>` container with any Mantine component.** Explicit owner decision.
- **`MantineListingCardPattern.tsx:305-306`** — `'flex flex-col'` and `'grayscale opacity-60'`. Sprint 63 Phase 2.
- **`src/app/globals.css`** — including `@theme inline`, `@apply`, and the `@import` lines. Sprint 63 Phase 5.
- **`src/app/[locale]/layout.tsx:50`** — Sprint 63 Phase 4.
- **Extending `check:tailwind-runtime-tokens` to `.tsx`** — Sprint 62, Phase 3. This task must not touch the gate
  script or its baseline **except** to add rows the new module legitimately produces, and it should produce none.
- **`next/image`.** Project-wide banned; `eslint.config.mjs` `IMAGE_RENDER_EXCEPTIONS` and the file header both say
  so. The existing `eslint-disable-next-line @next/next/no-img-element` at line 132 stays.
- **Any new permanent Storybook story or permanent extension of one.**
- **`PerfDevOverlay`, `LocaleSwitcher`** — other Sprint 63 rows.

## 9. Current and required behavior

### Must be preserved, exactly

| Behaviour | Current mechanism | Preservation proof |
|---|---|---|
| Container geometry per variant | `containerClass` utilities | I1 declaration diff + I4 computed-style parity |
| Image fit per variant | `imageClass` (`object-cover` / `object-contain`) | same |
| Hover scale/brightness on `listing`, `gallery-main`, `gallery-side` | `hoverClass` + `group` ancestor | AC7 hover capture |
| Hover **suppressed on LOW perf tier** | `useAdaptiveImageConfig` returns `hoverClass` only above LOW | I0 read of the hook + AC4 |
| LQIP blur background before load | `style={{ backgroundImage: url(blurUrl) … }}` when `blurUrl && !loaded` | untouched diff |
| Priority images render opaque immediately | `loaded \|\| priority ? 'opacity-100' : 'opacity-0'` **and** `!priority && 'transition duration-300'` | AC4 + I4: a priority image must have **no** transition and `opacity: 1` at first paint |
| React 19 render-phase `preload()` + post-commit `notifyPriorityPreload` | lines 87-113, and the hook-order comment at 101-104 | untouched diff; hook call order unchanged |
| `usePredictivePreload` at hook position 4 | line 117 | untouched diff |
| `srcset` / `sizes` / `fetchPriority` / `loading` | lines 135-140 | untouched diff |
| Caller-supplied `className` on the container | `cn(containerClass, className)` | AC3 |
| Falsy `src` renders container + children only | `hasImage` guard, line 129 | AC4 negative flow N1 |

### Required after

`containerClass`, `imageClass` and `hoverClass` are CSS Module class names from `AppImage.module.css`. The base
`<img>` positioning, the fade transition and the two opacity states are module classes. `MantineListingCardPattern`
no longer passes `'group'`. Rendered output at every variant is identical to the I2 baseline within the tolerance
declared at I4.

## 10. Implementation requirements

### 10.0 — I0 freshness re-measure (before any write)

Re-measure and record, verbatim: `git status --porcelain` (expected: empty — if not, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` before proceeding); `git rev-parse HEAD`;
`node scripts/check-tailwind-runtime-tokens.mjs`; the §3.1/§3.2 line numbers and string values; the §3.5 story
grep; `useAdaptiveImageConfig.ts`'s `hoverClass` tier branch. **Any drift from §3 is reported before it is acted
on**, not silently absorbed.

### 10.1 — I1: extract the utilities' own compiled declarations (this is the preflight the owner folded in)

Build, then read each of the 19 utilities' rules **out of the built CSS**, not out of documentation or memory:

- Production: `npm run build`, then read `.next/static/css/*.css`.
- Storybook (the source the 709/762 precedent used, and the one whose class names survive minification):
  `npm run build-storybook`, then read `storybook-static/assets/*.css`.

Record, per utility: the exact selector, every declaration in source order, whether the rule is `:where()`-wrapped,
which `@layer` it sits in, and any `@media` wrapper. Persist as
`docs/sessions/evidence/task763/i1-utility-extraction.md`. **A utility you could not find in the built CSS is
`UNKNOWN`, not "emits nothing"** — the Task 709 header records that exact mistake being made and reproducing false.

### 10.2 — I2: rendered baseline, before any source edit

Capture computed styles for the container and the `<img>` at every story in §3.5, at the Q3 widths for `listing`
and `listing-thumb` and at one desktop width for the rest, in both hover and rest state where a `hoverClass`
exists, plus one `priority` and one non-`priority` instance. Persist raw captures under
`docs/sessions/evidence/task763/i2/`. Capture the **resolved** value alongside the declaration for every custom
property read, so I4 can distinguish "the same token" from "the same pixel".

### 10.3 — I3: implement

1. Create `src/components/ui/AppImage.module.css`. Its header states, in this order: the task number; that every
   declaration reproduces an I1-extracted declaration and names which utility it came from; **N1** (token reference,
   never resolved value); and the **D34 disposition** — this is a D28 migration reproducing a utility's own losing
   cascade standing, therefore the rules are wrapped in `@layer utilities`, with the same reasoning
   `HeroSearchView.module.css` states. Copy that file's header shape.
2. Class names are semantic, not utility-shaped: `.container`, `.image`, `.containerListing`, `.containerAvatar`,
   `.fitCover`, `.fitContain`, `.hoverScale`, `.hoverBrightness`, `.fade`, `.visible`, `.hidden` or equivalent. A
   class named `.relative` or `.objectCover` re-creates the problem in a new file and is a rejection.
3. `VARIANTS` fields carry the imported class names. Where a variant needs two classes, compose them in the config
   with the existing `cn` import or a template — do not change the field's `string` type.
4. `AppImage.tsx`: replace the three literal strings in the `<img>` `cn()` with module classes. Keep `cn()`, keep
   `imageClass` and `hoverClass` as the last two arguments so caller/variant precedence is unchanged.
5. **Hover without `group`:** the module owns the relationship. Reproduce the I1-extracted transform/filter
   declarations under a selector rooted in the module — for example `.container:hover .hoverScale` — so the
   ancestor requirement is satisfied by `AppImage`'s own container rather than by a Tailwind marker class on an
   unrelated component. Then delete `'group'` and its comment from `MantineListingCardPattern.tsx:304`.
   **If I2 shows any consumer relies on a hover originating outside `AppImage`'s container, stop and report
   `BLOCKED` naming the consumer** — do not widen the selector to `:hover` on an arbitrary ancestor.
6. Preserve the LOW-tier suppression: `hoverClass` stays `undefined` on LOW, so the module class is simply not
   applied. Do not move the tier decision into CSS.

### 10.4 — I4: comparator

Re-capture I2's matrix and diff. **The comparator is a persisted, machine-readable cell-by-cell diff with an
explicit pass rule**, not a visual impression:

- Geometry properties (`position`, `inset`, `width`, `height`, `aspect-ratio`, `overflow`, `object-fit`,
  `border-radius`, `background-color`) must be **byte-identical** strings.
- `transition-*` and `opacity` must be identical per state (`priority` / not, `loaded` / not).
- `transform` / `filter` under hover must be identical.
- **A cell whose custom property could not be resolved on either side is a FAIL, not a match.** Task 748's durable
  lesson, recorded in `docs/backlog.md`: a witness that agrees with itself about a colour neither side can resolve
  has proven nothing.
- Any non-zero delta is enumerated with its cause and either fixed or escalated. "Explained inert delta" is a
  variance the reviewer accepts or rejects — the executor does not self-accept it.

### 10.5 — Variants without story coverage (`preview`, `upload`, `avatar`)

Proof is the I1 declaration diff plus a unit-level assertion that the config now yields the expected module class
names — **no story is created.** If a rendered capture is judged necessary, use a **reversible probe** inside an
existing story: record the story's `git hash-object` value before the probe, run the capture, restore the file, and
prove restoration with the matching `git hash-object` value **and** the path's absence from `git status
--porcelain` after the final gate run. A kickoff that asked only to "revert the probe" would have specified a step
no reviewer can check; this one does not.

### 10.6 — I5: the two-armed plant (Sprint 63 rule 1)

Before declaring the comparator trustworthy, prove it can fail:

| Arm | Mutation | Required observation |
|---|---|---|
| P1 | Change one geometry declaration in `AppImage.module.css` (e.g. `aspect-ratio: 4/3` → `3/2`) | I4 comparator reports a non-zero delta naming that exact cell and exits non-zero |
| P2 | Delete the `.hoverScale` rule body | AC7's hover capture reports rest-state `transform` under hover, and the run fails |

Record both transcripts, then revert and re-run clean. **A plant that does not fail is a defect in the apparatus,
not a pass.** Also record the pre-plant census: which *other* gate, if any, would have caught each arm. Expected
answer: none — `check:design-tokens` exempts `var(--token)` shapes without resolving them, `tsc` and `next build`
never read CSS values, and `check:tailwind-runtime-tokens` reads names, not geometry.

## 11. Positive and negative flows

**Positive flow.** A visitor loads `/<locale>` on a HIGH-tier device. The Featured grid renders `ListingCard`s whose
`AppImage` uses `variant="listing"`. The first card is `priority`: its container shows the LQIP background, the
`<img>` is opaque at first paint with no transition, `fetchPriority="high"` is set and a `<link rel="preload">` was
registered during render. Later cards fade in over 300ms as they load. Hovering a card scales its image to 1.05.
Every one of these is produced by `AppImage.module.css` and none by a Tailwind class.

**Negative flows.**

| # | Flow | Applicable | Required behaviour |
|---|---|---|---|
| N1 | `src` is falsy | **Yes** | Container renders with its module class and `children`; no `<img>`; no `style` background. Unchanged. |
| N2 | Non-Cloudinary `src` | **Yes** | `srcset` empty → `sizes` omitted, `STATIC_BLUR` used. Unchanged by this task; assert it did not change. |
| N3 | LOW performance tier | **Yes** | `hoverClass` is `undefined`; the hover module class is absent from the DOM; no hover transform applies. |
| N4 | `priority={true}` | **Yes** | No transition class; `opacity: 1` at first paint. This is an LCP-critical branch — `docs/performance.md`. |
| N5 | Consumer passes its own `className` to the container | **Yes** | It still lands on the container and still composes with the module class through `cn`. |
| N6 | Image `onLoad` never fires (broken URL) | **Yes** | Non-priority image stays at the `opacity-0` equivalent over the LQIP background — the current behaviour. Assert it is unchanged; do not "fix" it. |
| N7 | Cloudinary outage / 404 | No | Network behaviour, not styling. Owner: existing image-delivery layer. |
| N8 | RLS / permission failure | No | No data access in scope. |
| N9 | i18n / locale | No | No user-facing text changes; `alt` comes from the caller. |
| N10 | SSR/client state divergence | **Yes, narrow** | `loaded` starts `false` on the server. Class names must be deterministic between SSR and first client render — assert no hydration warning in `npm run check:hydration`. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `201683f9d`'s `appImageConfig.ts`, when the task is complete, then a grep for the 19 utilities
  of §3.1 across `src/components/ui/appImageConfig.ts` returns zero matches outside comments, and
  `npm run governance:tailwind` does not regress against its I0 reading.
- **AC2 [R2]** — Given `AppImage.tsx` lines 143-152, when the task is complete, then no Tailwind utility string
  remains in either `cn()` call, and both calls still receive `imageClass` and `hoverClass` in their current
  argument positions.
- **AC3 [R3]** — Given the current `AppImageProps` interface and `ImageVariant` union, when the task is complete,
  then `git diff` shows **zero** changes to the interface, its JSDoc, the union members, or the `VARIANTS` keys, and
  `npm run typecheck` exits 0.
- **AC4 [R4]** — Given the LQIP/preload/predictive/tier code paths at lines 63-141, when the task is complete, then
  `git diff` shows changes only inside the two `cn()` calls and the added import, the hook call order is unchanged,
  and `npm run test:listings` exits 0.
- **AC5 [R5]** — Given `docs/sessions/evidence/task763/i1-utility-extraction.md`, when a reviewer compares each rule
  in `AppImage.module.css` to its I1 row, then every declaration maps to an extracted declaration, and any
  declaration with no I1 source is listed in the completion report with its justification.
- **AC6 [R6]** — Given the module wraps its rules in `@layer utilities`, when I4 runs, then the container's and
  image's computed styles match the I2 baseline in every geometry cell, **including** any cell where a Mantine
  unlayered rule previously won.
- **AC7 [R7]** — Given a `listing` card in a story with `hoverClass` active, when hover is applied after the change
  and `'group'` has been removed from `MantineListingCardPattern.tsx:304`, then the image's computed `transform`
  equals the I2 hover baseline; and when the P2 plant deletes the hover rule, the same capture fails.
- **AC8 [R8]** — Given the new module, when `node scripts/check-tailwind-runtime-tokens.mjs` runs, then it reports
  **24** files scanned, **14** Tailwind-owned references, **0 new debt, 0 stale baseline**, exit 0; and the
  completion report lists every `@theme inline` name the module writes with its `globals.css` line number.
- **AC9 [R9]** — Given plants P1 and P2, when each is applied, then the named check exits non-zero and the
  transcript is retained; and after revert, all checks return to their clean result.
- **AC10 [R10]** — Given all 9 variants, when the task is complete, then `listing` and `listing-thumb` have I2/I4
  captures at 320 / 375 / 390 / 768 / 1024 / 1440 in all four locales at 320 and 1440, and the remaining 7 have at
  minimum an I1 declaration diff plus a class-name assertion.
- **AC11 [R11]** — Given `git status --porcelain` after the final gate run, then no `*.stories.tsx` path appears;
  and for any story used as a probe, its post-restore `git hash-object` equals the recorded pre-probe value.
- **AC12 [R12]** — `npm run build` exits 0, transcript retained.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** `docs/qa-profiles.md`: *"New or migrated Mantine primitive … TailAdmin
conformance slice, high-risk responsive work."* `AppImage` is a migrated shared primitive on the LCP path with 14
consumers across five surfaces; a wrong `aspect-ratio` or a lost `overflow: hidden` is a layout regression on every
one of them. Q2 would not require the before/after rendered matrix that R10 depends on.

**Not Q4:** `docs/critical-flow-registry.md` must be scanned at I0. If it names an image-delivery or listing-detail
flow, escalate to Q4 and add its automated regression evidence.

### Commands — run all, record actual output and exit codes

| Command | Purpose | Failure meaning |
|---|---|---|
| `git status --porcelain` (pre-write and post-gate) | dirty-worktree comparator | non-empty pre-write → manifest required |
| `node scripts/check-tailwind-runtime-tokens.mjs` | AC8 | any new debt row → a Class-2 name entered the module |
| `npm run typecheck` | AC3 | API drift |
| `npm run lint` | standing | — |
| `npm run test:listings` | AC4 | `ListingCard`/`AppImage` smoke regression |
| `npm run check:design-tokens` | raw-literal policy | a rejection here is a `CONFLICT` to report, not a marker to add |
| `npm run governance:tailwind` | AC1 | census regression |
| `npm run check:hydration` | N10 | SSR/client class divergence |
| `npm run check:homepage-grid` | homepage geometry | grid regression from a container change |
| `npm run check:css-vars` | var resolvability | an unresolvable name in the new module |
| `npm run check:mojibake` · `npm run check:file-integrity` | touched text files | encoding |
| `npm run build-storybook` + `npm run screenshots:responsive -- --mantine-only` | I2 / I4 rendered matrix | see §10.4 pass rule |
| `npm run build` | **AC12 hard gate** | a failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED` |

**Viewports (R10, `listing` / `listing-thumb`):** 320 · 375 · 390 · 768 · 1024 · 1440. **Locales:** all four at 320
and 1440; `uk@320` mandatory. Read each story's enrolled viewport set out of the manifest before claiming a
breakpoint tier is covered — `docs/qa-profiles.md` warns that per-story sets are not uniform.

## 14. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never self-approve.**

Include, in this order:

1. Changed files, with the exact write set compared to §7.
2. Requirement IDs completed, and any not completed with the reason.
3. Every command run, with its **actual** output and exit code. Not a summary; not "passed".
4. Evidence locations: I1 extraction table, I2 and I4 capture directories, the I4 diff artifact, both plant
   transcripts, the pre-plant census.
5. **The Class-3 inventory (R8):** every `@theme inline` custom property the new module references, with its
   `globals.css` line number and the utility it replaced. Write `None` if there are none.
6. I0 drift: every §3 fact that did not reproduce.
7. Assumptions resolved (A1-A4) with their measured answers.
8. Deviations, limitations, unresolved issues — including the §10.5 coverage limit for `preview`/`upload`/`avatar`.
9. `docs/backlog.md` updated with concise current state; detailed narrative in the session log, not the backlog.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | ✅ every fact, path, line number, command and owner decision is in the file |
| Every primary requirement has ≥1 binary AC and ≥1 verification method | ✅ R1-R12 → AC1-AC12, each with a named command or artifact |
| Scope names what must not change | ✅ §8 out-of-scope; §9 preservation table with a proof column per row |
| UI publication checks: current/legacy boundary, QA profile, source map, canonical decision record, preservation classification | ✅ §1 boundary, §13 profile with the Q2 rejection reason, §10.1 source map (built CSS as the visual source), §1 owner decision as the canonical UI decision record, §9 preservation table |
| Permanent-story gate | ✅ §10.5 — reuse first, probe second, restoration evidence named as `git hash-object` + `git status --porcelain`, `create canonical` not authorized |
| Negative flows selected by applicability, not copied | ✅ §11 — N7/N8/N9 marked `No` with their owning layer |
| No uninspected claim | ✅ every §3 fact carries its measurement; A1-A4 are labelled `INFERENCE`/`UNKNOWN` and routed to I1, not asserted |
| Gates prove the changed behaviour, not procedure | ✅ AC8 names the exact expected gate numbers (24/14/0/0); AC9 requires observed failure before observed success |
| Owner-only exceptions traceably authorized | ✅ §1 quotes the 2026-08-21 owner decision verbatim; the task is not its own authorization |
| Exactly one active route | ✅ native `<img>` + CSS Module. Mantine style props and a separate preflight task were both considered and both rejected by the owner in the same decision |
| Every checkpoint names producer, artifact, comparator, failure behaviour | ✅ I0-I5 in §10; §10.4 states the pass rule and the unresolved-property FAIL rule |
| Dirty-worktree handling | ✅ §10.0 — pre-write `git status --porcelain` snapshot with an explicit comparator and a manifest requirement |
| Baselines account for task-created artifacts | ✅ AC8 expects **24** scanned files, not 23 — the new module is counted in the formula, not discovered by it |
| No `Confirmed` fact whose first verification is deferred to the executor | ✅ §3 facts are author-measured with a retained trace; §10.0 is freshness re-measure, and A1-A4 are explicitly not `Confirmed` |
| Assumptions visible to executor and reviewer | ✅ §5 |

---

## Handoff

Execute from this file: `tasks/Sprints/Sprint_63_kickoff_prompt_Task_763_AppImage_De_Tailwind.md`, following
`.claude/skills/execute-task/SKILL.md`. Read the §6 bundle and nothing else. Start at §10.0.

**FACTS:** §3 in full, each with its measurement in the retained preflight.
**INFERENCES:** A1, A2 — both routed to I1 for measurement before use.
**UNKNOWNS:** A3, A4, Q1.
**CONFLICTS:** None at filing. A2 may produce one (`check:design-tokens` vs. a raw `border-radius` literal); the
task requires it be reported, not silenced.

**QA profile:** `Q3 Full Visual Matrix`.
**Ambiguous or conflicting requirements:** none.
**Owner decision still needed for this task:** none. Sprint-level decisions D63-A through D63-D are recorded in
`Sprint_63_Homepage_Exits_Tailwind.md` and none of them blocks Task 763.
