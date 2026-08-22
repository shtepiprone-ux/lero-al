# Task 763 — I1 extraction: compiled declarations of the 19 utilities + the 2 `group-hover` variants

Extracted from the **built CSS**, not documentation or memory, per §10.1.

**Sources:**
- Production: `npm run build` (exit 0) → `.next/static/css/bc88661d53d0076e.css` (139211 bytes; grep-confirmed as
  the file containing `.object-cover` and the other AppImage utilities — the other 8 `.next/static/css/*.css`
  files were checked and do not contain these selectors).
- Storybook: `npm run build-storybook` (exit 0) → `storybook-static/assets/iframe-D4qckTjS.css` (353618 bytes;
  same grep-confirmation).
- Extraction method: a brace-depth-matching Node script (retained at
  `docs/sessions/evidence/task763/i1-extract-script.mjs`), not a line-oriented grep — CSS is minified to one line
  per file, so brace matching is required for a correct rule boundary. Verified against a manual `grep -o` spot
  check for `object-cover`, `duration-300`, and the two `group-hover:` rules before being trusted for the full set.

Both sources produced **byte-identical selectors and declaration bodies** for all 21 rules below (the only textual
difference between the two builds is `@media (hover:hover)` (prod, with a space) vs `@media(hover:hover)` (Storybook,
no space) and `3.40282e+38px` vs `3.40282e38px` for the `rounded-full` exponent — both are non-semantic minifier
formatting differences, not different computed values).

## 1. The 19 utilities named in kickoff §3.1

| # | Utility | Layer / wrapper | Selector (as compiled) | Declaration | Resolvability | Disposition |
|---|---|---|---|---|---|---|
| 1 | `relative` | `@layer utilities` | `.relative` | `position:relative` | n/a (literal) | Literal |
| 2 | `absolute` | `@layer utilities` | `.absolute` (prod: `.absolute,.sr-only` — `.sr-only` co-selector is Tailwind's own composition, irrelevant to this task; body is identical) | `position:absolute` | n/a (literal) | Literal |
| 3 | `inset-0` | `@layer utilities` | `.inset-0` | `inset:var(--space-0)` | **RESOLVABLE** — `--space-0:0px` confirmed emitted in both built stylesheets (`grep -l -- '--space-0:'` hit both). Declared `globals.css:128`, inside `@theme inline` (Class 3). | `var(--space-0)` — Class-3 inventory row required (R8) |
| 4 | `w-full` | `@layer utilities` | `.w-full` | `width:100%` | n/a (literal) | Literal |
| 5 | `h-full` | `@layer utilities` | `.h-full` | `height:100%` | n/a (literal) | Literal |
| 6 | `aspect-[4/3]` | `@layer utilities` | `.aspect-\[4\/3\]` | `aspect-ratio:4/3` | n/a (literal) | Literal |
| 7 | `aspect-[16/9]` | `@layer utilities` | `.aspect-\[16\/9\]` | `aspect-ratio:16/9` | n/a (literal) | Literal |
| 8 | `aspect-square` | `@layer utilities` | `.aspect-square` | `aspect-ratio:1` | n/a (literal) | Literal |
| 9 | `overflow-hidden` | `@layer utilities` | `.overflow-hidden` | `overflow:hidden` | n/a (literal) | Literal |
| 10 | `bg-muted` | `@layer utilities` | `.bg-muted` (only the base rule; the `/NN` opacity-modifier siblings on the same prefix are not used by AppImage and are out of scope) | `background-color:var(--muted)` | **RESOLVABLE** — `--muted` declared `globals.css:371`, inside plain `:root` (safe, not `@theme inline`). Resolves A1: it is `--muted`, not `--color-muted`. | `var(--muted)` |
| 11 | `rounded-full` | `@layer utilities` | `.rounded-full` | `border-radius:3.40282e+38px` (prod) / `3.40282e38px` (storybook) | n/a (raw literal — Tailwind's `calc(infinity * 1px)` folded to the IEEE-754 float max by the build's CSS minifier) | **Raw literal, A2 resolved.** See "A2 disposition" below. |
| 12 | `object-cover` | `@layer utilities` | `.object-cover` | `object-fit:cover` | n/a (literal) | Literal |
| 13 | `object-contain` | `@layer utilities` | `.object-contain` | `object-fit:contain` | n/a (literal) | Literal |
| 14 | `transition` (bare) | `@layer utilities` | `.transition` | `transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))` | See "A3 disposition" below | **A3 resolved: contains 3 `--tw-*` names in the property list.** Flattened — see below. |
| 15 | `duration-300` | `@layer utilities` | `.duration-300` | `--tw-duration:.3s;transition-duration:.3s` | `--tw-duration` is Tailwind-owned by prefix; declaring it in the module would be Category-C debt (E-1 finding). Effective value is the literal `.3s` (300ms). | Literal `300ms` — see "duration/easing disposition" below |
| 16 | `opacity-100` | `@layer utilities` | `.opacity-100` | `opacity:1` | n/a (literal) | Literal |
| 17 | `opacity-0` | `@layer utilities` | `.opacity-0` | `opacity:0` | n/a (literal) | Literal |
| 18 | `group-hover:scale-105` | `@layer utilities` > `@media (hover:hover)` | `.group-hover\:scale-105:is(:where(.group):hover *)` | `--tw-scale-x:105%;--tw-scale-y:105%;--tw-scale-z:105%;scale:var(--tw-scale-x) var(--tw-scale-y)` | `--tw-scale-*` are Tailwind-owned bookkeeping vars, set and consumed only within this same rule. Effective value: `scale: 105% 105%`. | See "R7 hover mechanism" below |
| 19 | `group-hover:brightness-95` | `@layer utilities` > `@media (hover:hover)` | `.group-hover\:brightness-95:is(:where(.group):hover *)` | `--tw-brightness:brightness(95%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)` | Same pattern; only `--tw-brightness` is ever set, the rest of the `filter` value list resolves to empty (no-op) tokens. Effective value: `filter: brightness(95%)`. | See "R7 hover mechanism" below |

Utility count note: the kickoff's own text says "19 distinct utilities" and lists 19 bullet-separated names in §3.1
— cross-checked 1:1 against the table above, all 19 found in the built CSS. None is `UNKNOWN`.

## 2. `group-hover:` selector shape — critical finding for R7

The compiled selector is **`.group-hover\:scale-105:is(:where(.group):hover *)`**, wrapped in **`@media
(hover:hover)`**. This is materially different from the kickoff's own §10.3.5 example
(`.container:hover .hoverScale`):

- `:is(:where(.group):hover *)` matches **any descendant** of a hovered `.group` ancestor (the `*` universal
  selector), not only a direct child — `:where()` is used on `.group` (zero specificity contribution) and `:is()`
  wraps the whole compound so the rule's specificity is `(0,1,0)`, driven only by `.group-hover\:scale-105` itself.
- The whole rule is gated behind **`@media (hover:hover)`** — Tailwind's `group-hover:` variant does not apply on
  touch/coarse-pointer devices at all. AppImage's own container **is** the `.group` element in
  `MantineListingCardPattern.tsx` today (`Card` receives the `'group'` class), and `AppImage`'s `<img>` is a
  descendant of that `Card`, not of `AppImage`'s own wrapper `<div>`.
- Per agent-contract clause 9a, this `@media (hover:hover)` guard and the "any descendant" ancestor relationship
  are part of the behaviour being preserved, not incidental — dropping the guard would apply hover-scale on
  touch devices where it never did before; narrowing "any descendant" to "direct child only" would still work for
  AppImage's own markup (the `<img>` is a direct child of the container `<div>` in `AppImage.tsx:120-153`) but the
  media guard must be kept.

## 3. A1 disposition (resolved)

`bg-muted` compiles directly to `background-color:var(--muted)`. `--muted` is `:root`-declared (`globals.css:371`,
outside `@theme inline`), confirmed **safe** by §3.6's own table. There is no `--color-muted` involved at any point
in this utility's compiled form — A1's "third form" branch does not apply. The module writes `var(--muted)` with no
substitution needed.

## 4. A2 disposition (resolved) — `rounded-full`

The compiled value is the **raw literal** `3.40282e38px` (Tailwind's collapse of `calc(infinity * 1px)`), not a
token reference of any kind. Two prior tasks (`MantineListingCardPattern.module.css:186,204`, Task 691/691R; and
`MobileBottomNavView.module.css:88`, Task 715) already carry this exact value with a **`design-tokens-allow:`**
marker.

**Sprint 63 rule 2 forbids adding a `design-tokens-allow:` marker as a way of passing** ("Exemptions are conditions
a gate evaluates, never comments an author writes"), and A2 explicitly instructs: *"do not add a
`design-tokens-allow:` marker"* if `check:design-tokens` rejects the raw literal. The module therefore writes
`border-radius: 3.40282e38px;` **without** a marker. §10.3's implementation step and the completion report record
whatever `npm run check:design-tokens` actually returns for this line as measured fact, not silenced — a rejection
is reported as a `CONFLICT`, per A2, not fixed by reintroducing the marker the two precedent files use.

## 5. A3 disposition (resolved) — bare `transition`

**A3 reproduces the exact finding it names as possible**: the compiled `transition-property` list for bare
`.transition` contains three Tailwind bookkeeping names — `--tw-gradient-from`, `--tw-gradient-via`,
`--tw-gradient-to` — interleaved with real CSS properties. Per A3's own instruction, these three names are
**flattened out**, not carried into the module (the `check-tailwind-runtime-tokens.mjs` E-1 finding: a `--tw-*` name
inside a `transition-property` value is exactly what Revision 1 added scanning for). AppImage's `<img>` never
authors a gradient, so dropping these three names from the property list changes no observable behaviour — the
element has no `background-image`/`--tw-gradient-*` state to transition in the first place.

The module's `.fade` class therefore reproduces the **remaining 20 properties, in the same order**:

```
transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke,
  opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter,
  display, content-visibility, overlay, pointer-events;
```

This is a deliberate, and necessary, preservation of `transform`/`translate`/`scale`/`rotate`/`filter` in the list:
`AppImage`'s `<img>` can carry **both** `.fade` (non-priority) and the hover class (`hoverScale`/`hoverBrightness`)
at once (`cn()` composes `imageClass`, `hoverClass` on the same element). If the property list were narrowed to
`opacity` only, the hover `scale`/`filter` change on a non-priority image would snap instantly instead of
transitioning smoothly — a real, user-visible regression the bare-utility precedent (and A3's own instruction) rules
out.

## 6. Duration/easing disposition — measured, not asserted

§3.6 flagged `--duration-slow` (300ms) and `--ease-standard` as *"token reference required by rule 3 … see R8"* —
i.e. a conditional instruction, not a certainty. I1 measured both directly:

```
grep -l -- '--ease-standard'  .next/static/css/*.css storybook-static/assets/*.css   → no file matches
grep -l -- '--duration-slow'  .next/static/css/*.css storybook-static/assets/*.css   → no file matches
```

**Neither `--duration-slow` nor `--ease-standard` is emitted in any built stylesheet checked** (9 `.next/static/css`
files + 21 `storybook-static/assets/*.css` files, all of them, not a partial scan). This reproduces Task 762's own
C-1 finding that only 49/185 `@theme inline` names are ever emitted, and matches the exact precedent named in
kickoff §3.6/AC5 lineage — Task 757R: *"8 `var(--default-transition-*)` → literal `150ms` / `cubic-bezier(0.4, 0,
0.2, 1)` (`--ease-standard` is `@theme inline`, absent from every built stylesheet — must NOT be used)."*

Writing `transition-duration: var(--duration-slow)` or `transition-timing-function: var(--ease-standard)` would
produce an **unresolvable custom property** — `check:css-vars` gate territory, and the exact Task 748 durable lesson
(`docs/backlog.md` D-series note): a value neither side can resolve proves nothing.

Both tokens' resolved values were independently confirmed to equal the utility's own compiled value:
- `--duration-slow: 300ms` (`globals.css:269`) === `duration-300`'s compiled `.3s`.
- `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)` (`globals.css:273`) === Tailwind's own
  `--default-transition-timing-function` (`node_modules/tailwindcss/theme.css`), which is what `duration-300`'s
  sibling bare `.transition` rule falls back to via `var(--tw-ease,var(--default-transition-timing-function))`
  (`--tw-ease` is never set on this element — no `ease-[...]` utility is used anywhere in `AppImage`/`ListingCard`).

**Disposition: the module writes the literal values `300ms` and `cubic-bezier(0.4, 0, 0.2, 1)`**, following the
757R precedent, not a `var()` reference to either token. No Class-3 inventory row for duration/easing — the module
does not reference either name.

## 7. R7 hover mechanism — what the module's selector must reproduce

Per §10.3.5, the module owns the `.container:hover .hoverScale` relationship instead of depending on an external
`.group` marker. To preserve the **exact** compiled behaviour found in §2 above (not a narrower substitute), the
module's hover rule:

- Is wrapped in the same `@media (hover:hover)` feature query (preserves "no hover-scale on touch devices").
- Roots the ancestor relationship on `AppImage`'s own container class (`.container:hover .hoverScale` /
  `.container:hover .hoverBrightness`) rather than `:is(:where(.group):hover *)` — this is a **narrowing** from
  "any descendant of a hovered `.group`" to "the `.hoverScale`/`.hoverBrightness` `<img>` inside `AppImage`'s own
  container", which is exactly what §10.3.5 authorizes ("so the ancestor requirement is satisfied by `AppImage`'s
  own container rather than by a Tailwind marker class on an unrelated component"). `AppImage`'s `<img>` is always
  a direct child of its own container `<div>` (`AppImage.tsx:120-153`), so `.container:hover .hoverScale` matches
  identically to what `:is(:where(.group):hover *)` matched for this specific element in practice — the narrowing
  changes no observable AppImage behaviour, it only removes the now-dead cross-component `.group` dependency.
- Reproduces the declaration bodies with the `--tw-*` bookkeeping custom properties resolved to their literal
  effect (`scale: 105% 105%`; `filter: brightness(95%)`), not carried into the module as declared `--tw-*` names —
  same reasoning as §5: these are Tailwind compiler bookkeeping vars with no meaning once decoupled from Tailwind's
  own cascade, and the E-1 finding treats a **declared** `--tw-*` name as Category-C debt, not just a referenced one.
