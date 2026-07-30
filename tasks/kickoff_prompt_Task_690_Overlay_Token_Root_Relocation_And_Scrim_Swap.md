# Task 690 — Relocate `--overlay`/`--overlay-foreground` into `:root`, then point the `PopularLocationsView` scrim at `var(--overlay)`

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** design-token plumbing — **token-emission hardening** on an already-Mantine surface
  (`docs/rule-index.md` → "UI / Layout / Component" → **Current Mantine path**).
- **Secondary types:** Storybook / visual proof (multiple manifest-enrolled consumers); design-token conformance
  (cl. 16, 16b).
- **Origin:** Task 688 review finding **F1** (`P2 MEDIUM`), 2026-07-30. Owner decision **D18** (2026-07-30) sets the
  mechanism.

> **Read this first.** This task must produce **zero rendered change**. It moves *where two variables are declared*;
> it changes **no value**. `oklch(0 0 0)` stays `oklch(0 0 0)`. If any measurement disagrees, the *implementation* is
> wrong, never the measurement. Do not "improve" a colour, do not tokenise anything else, do not touch the eight
> `CITY_GRADIENTS` rules.

---

## 2. Objective

1. Move the **declarations** of `--overlay` and `--overlay-foreground` out of `@theme inline { }` and into the plain
   `:root { }` block of `src/app/globals.css`, leaving `--color-overlay` / `--color-overlay-foreground` **inside
   `@theme`** so the `overlay` colour name stays registered with Tailwind (D18).
2. Repoint `PopularLocationsView.module.css`'s `.scrim` from `var(--color-black)` to `var(--overlay)`, closing Task
   688 finding **F1**.
3. Preserve the rendered output: **0 verdict changes** across all 1184 cells and **max channel delta ≤ 1/255** on any
   cell whose PNG md5 moves (comparator per **D17**, §3.5).
4. Keep `check:design-tokens` at **43 / 0 stale-marker** — `globals.css` is excluded from the scan and no literal
   enters any `.module.css`.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-30,
after Task 688 was reviewed `APPROVED WITH NOTES` and committed as `a9934c037`. Bundle facts (§3.3, §3.4) were read
from the `.next/static/css` output of the owner-native `npm run build` that closed the 688 review (exit 0, 40/40).
Nothing is inferred from a filename or a prior report.

### 3.1 Owner decisions

| ID | Question put to the owner | Ruling |
|---|---|---|
| **D6** (Task 684, standing) | `.screenshots/` evidence visibility. | **Local-only** per `.gitignore:55`. Reference by path; it will not appear in `git status`. |
| **D10** (Task 685 review, standing) | Comparator for the non-target cells. | **0 verdict changes**, plus per-story attribution of changed cells. |
| **D17** (Task 688 review, 2026-07-30) | The 56 `PopularLocationsView` cells changed md5 with max channel delta 1/255. | **Sub-perceptual deterministic rasterisation delta, ratified.** Binding comparator re-scoped to *0 verdict changes + byte-identical assertion payloads + max channel delta ≤ 1/255*. `2026-07-29T20-43/` is the new baseline for that story. |
| **D18** (this task, 2026-07-30) | How to close F1's `@theme`-emission fragility? | **Relocate the `--overlay` / `--overlay-foreground` declarations into `:root`; keep the `--color-*` namespace entries in `@theme`.** Rejected: a `var()` fallback literal in the module (costs a detector violation, leaves the misleading `--color-black` reference); rejected for this task: a governance gate (own blast radius — see §8). |

**No new visual value is introduced by this task**, so cl. 16a is satisfied by reproduction, not by provenance.

### 3.2 The two-block structure of `globals.css` — read at source

`src/app/globals.css` has two distinct variable homes, and the difference is the entire subject of this task:

| Block | Lines | Emission behaviour |
|---|---|---|
| `@theme inline { }` | **22–296** | **Usage-contingent.** Tailwind v4 emits a theme variable only while a generated utility still consumes it. |
| `:root { }` | **307–420** | Unconditional. |
| `.dark { }` | 421–… | Dark overrides. **Contains no `--overlay` rule** (grep-verified) — consistent with the block comment "always dark/light regardless of mode". |

The overlay block as it stands, `globals.css:51-55`:

```css
  /* Overlay tokens — always dark/light regardless of mode (photo overlays, lightbox) */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

All four lines are inside `@theme inline`. **All four are therefore usage-contingent today.**

By contrast every token the Task 688 module's *gradients* and *focus ring* use — `--primary` (`:355`), `--brand-800`
(`:321`), `--brand-950` (`:328`), `--badge-new` (`:380`), `--badge-premium` (`:381`), `--ring` (`:374`) — already
lives in the plain `:root` block. **The eight gradients and the focus ring are not at risk and are out of scope.**

### 3.3 Why this is safe — the compiled utilities already dereference `var(--overlay)` at runtime

Read verbatim from the built bundle (`.next/static/css/*.css`):

```
.bg-overlay{background-color:var(--overlay)}
.bg-overlay\/30{background-color:#0000004d}
.bg-overlay\/30{background-color:color-mix(in oklab,var(--overlay) 30%,transparent)}
.bg-overlay\/95{background-color:#000000f2}
.bg-overlay\/95{background-color:color-mix(in oklab,var(--overlay) 95%,transparent)}
.text-overlay-foreground{color:var(--overlay-foreground)}
```

and in the bundle's `:root`:

```
--color-overlay:var(--overlay)
--color-overlay-foreground:var(--overlay-foreground)
--overlay:oklch(0% 0 0)
```

This is the decisive fact: under `@theme inline`, the generated utilities **already resolve `var(--overlay)` at
runtime** rather than carrying an inlined literal. Moving the *declaration* to `:root` therefore keeps every existing
utility working, because `:root` supplies the same variable unconditionally. The `overlay` colour **name** is
registered by the `--color-overlay` entry, which stays in `@theme`.

> **This is the one assumption the build must confirm, not you.** I3/AC1 exist precisely to prove that Tailwind still
> emits `.bg-overlay*` and `.text-overlay-foreground*` after the move. If any of those selectors disappears from the
> built bundle, **stop and report** — do not re-add the declaration to `@theme` and do not hand-write the utilities.

### 3.4 Why F1 is real, and why it is wider than the scrim

`--color-black` is **not** defined anywhere in `globals.css`. It is a Tailwind theme variable, present in the bundle
only because two legacy shadcn files still use a `black` utility:

- `src/components/ui/dialog.tsx:35` — `bg-black/10`
- `src/components/ui/sheet.tsx:32` — `bg-black/10`

Usage-contingency verified directly against the bundle: `--color-black:#000` and `--color-blue-500` are emitted;
`--color-red-500` and `--color-transparent` are not.

The same latent fault already exists for `--overlay`, independently of Task 688, at these **non-Tailwind** consumers
(inline `style` / `c=` props are not utility candidates, so they do not keep the variable alive):

| Site | Reference |
|---|---|
| `src/modules/listings/components/LightboxView.tsx:45-48` | `color-mix(in oklab, var(--color-overlay-foreground) …)` ×2, `var(--color-overlay-foreground)` ×2 |
| `src/modules/listings/components/LightboxView.tsx:86` | `color-mix(in oklab, var(--color-overlay) 95%, transparent)` |
| `src/modules/listings/components/LightboxView.tsx:159` | `var(--color-overlay-foreground)` |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:91` | `c="var(--color-overlay-foreground)"` |

So D18's relocation is not scrim-only bookkeeping: **it also removes a pre-existing latent fragility from
`LightboxView` and `MantineListingGalleryPattern`.** That is the main reason it is worth doing before Task 691.

### 3.5 Rendered-gate baseline and comparator

Baseline: `.screenshots/rendered-assert/2026-07-29T20-43/` — Task 688's reviewed post-change run
(1184 cells, `passed: 1162`, `failed: 0`, `ambiguousOnly: 22`), ratified as the new baseline by **D17**.

Utility consumers of `--overlay` and their manifest coverage (`bg-overlay*` / `text-overlay-foreground*`,
grep-verified counts):

| File | Utilities | Enrolled story |
|---|---:|---|
| `MantineListingCardPattern.tsx` | 6 | `Patterns/Mantine/ListingCardPattern`, `Mantine/Primitives/ListingCard` |
| `LightboxView.tsx` | 4 + 6 direct `var()` refs | `Mantine/Primitives/LightboxView` |
| `ListingGallery.tsx` | 5 | — (not enrolled) |
| `MantineListingGalleryPattern.tsx` | 3 + 1 direct `var()` ref | `Patterns/Mantine/ListingGalleryPattern` |
| `ImageUpload.tsx` | 3 | — (not enrolled) |
| `PerfDevOverlay.tsx` | 10 | — (dev-only, not enrolled) |
| `AdminUserAvatar.tsx` | 1 | — (`Mantine/Primitives/Avatar` covers the Mantine primitive, not this consumer) |
| `PopularLocationsView.module.css` `.scrim` | — (the swap target) | `Mantine/Primitives/PopularLocationsView` |

**Binding comparator (D17, generalised to this task):** across all **1184** cells — **0 FAIL, 0 verdict changes**,
and for every cell whose PNG md5 moves, a pixel-level attribution showing **max channel delta ≤ 1/255**. md5 identity
is *expected* here (no gradient-syntax change) but is **not** the binding gate; a changed md5 with a delta above
1/255, or any verdict change, is a **stop and report**.

### 3.6 `check:design-tokens` baseline — 43

Post-688 baseline re-run on 2026-07-30: **43 raw / 0 stale-marker** (`length` 31, `color` 11, `z-index` 1).
`src/app/globals.css` is **excluded from the scan** (`scripts/check-design-tokens.mjs:85-100`), so moving
declarations within it changes nothing. `PopularLocationsView.module.css` currently contributes **0** and must
continue to: the detector flags `\b(rgb|rgba|hsl|hsla|oklch)\s*\(` **in `.css` files**
(`scripts/check-design-tokens.mjs:110`), so the module must express the scrim as `var(--overlay)` — **never** a
literal, and **never** a `var(--overlay, oklch(0 0 0))` fallback, which would flag.

**Binding comparator: `43 / 0 stale-marker`, with `PopularLocationsView.tsx` at 3 and the module at 0.**

### 3.7 The scrim rule as it stands

`src/modules/locations/components/PopularLocationsView.module.css:46-53`:

```css
.scrim {
  background-image: linear-gradient(
    to top in oklab,
    color-mix(in oklab, var(--color-black) 60%, transparent) 0%,
    color-mix(in oklab, var(--color-black) 20%, transparent) 50%,
    transparent 100%
  );
}
```

Its live computed value, measured in Task 688's I3/I5 captures
(`.screenshots/task688-delta/computed-before.json` / `computed-after.json`, both identical):

```
linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)
```

**That string is the comparator target for AC2.** `--color-black` is `#000` and `--overlay` is `oklch(0 0 0)`; both
are pure black, so `color-mix(in oklab, …)` should serialise identically. Prove it — do not assume it.

### 3.8 Consumers, tests and critical-flow status

- **No unit or smoke test** asserts `--overlay`, `--color-overlay`, or the scrim (grep-verified). Do **not** create
  one: the observable contract is the rendered pixel, which the Q3 gate covers far more strictly.
- `docs/critical-flow-registry.md` contains **no** row for popular locations, the lightbox, or the gallery overlay
  (grep-verified), so cl. 15 does not apply.
- The `PopularLocationsView` story needs **no edit** (cl. 16c): props and DOM shape are unchanged. Same for every
  other enrolled story listed in §3.5.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D18, §3.2 | In `globals.css`, the `--overlay` and `--overlay-foreground` **declarations** live in the `:root` block; `--color-overlay` and `--color-overlay-foreground` remain inside `@theme inline`. Values byte-unchanged: `oklch(0 0 0)` / `oklch(1 0 0)`. | P0 | AC1 |
| R2 | §3.3 | The built bundle still emits every `overlay` utility currently present — at minimum `.bg-overlay`, `.bg-overlay\/30`, `.bg-overlay\/50`, `.bg-overlay\/60`, `.bg-overlay\/70`, `.bg-overlay\/85`, `.bg-overlay\/95`, `.text-overlay-foreground` and its opacity variants, `.border-overlay-foreground\/20` — each still resolving `var(--overlay)` / `var(--overlay-foreground)`. | P0 | AC1 |
| R3 | F1, §3.7 | `PopularLocationsView.module.css`'s `.scrim` uses `var(--overlay)`; `grep -n 'color-black' src/` returns **0 hits**. | P0 | AC2 |
| R4 | §3.7 | The scrim's live computed `background-image` is byte-identical to §3.7's measured string. | P0 | AC3 |
| R5 | §3.4 | `LightboxView.tsx`'s and `MantineListingGalleryPattern.tsx`'s direct `var(--color-overlay*)` references resolve to the same computed values as before. **No edit to those files** — this is a verification, not a change. | P0 | AC4 |
| R6 | D17, §3.5 | All 1184 cells: **0 FAIL, 0 verdict changes**; every md5 delta attributed per story with a pixel-level **max channel delta ≤ 1/255**. | P0 | AC5 |
| R7 | §3.6 | `check:design-tokens` reports **43 / 0 stale**, module at **0**, no literal and no `var()` fallback added. | P0 | AC6 |
| R8 | §3.2 | The `/* Overlay tokens — … */` block comment moves with the two declarations and is updated to record **why** they sit in `:root` (unconditional emission for non-Tailwind consumers), citing Task 690/F1. | P2 | AC7 |
| R9 | cl. 9, 7, 14 | `npm run build` exits 0 on a fresh transcript; `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n` (2215×4, zero new keys), `check:file-integrity`, `check:mojibake` all exit 0; `npx vitest run` shows no new failure attributable to this diff. | P0 | AC8 |

---

## 5. Assumptions and open questions

- **A1 — zero rendered delta is the point.** Report the first value you observe at every checkpoint before any
  adjustment. Never reach the target by relaxing a comparator or adding an allowlist entry.
- **A2 — §3.3 is the mechanism, AC1 is the proof.** The claim "the utilities already dereference `var(--overlay)` at
  runtime" is read from the *current* bundle. It predicts the move is safe; it does not prove it. The post-change
  bundle grep in I3 is the authority. Utilities disappearing → **stop and report**.
- **A3 — do not touch any consumer file.** `LightboxView`, `ListingGallery`, `MantineListingCardPattern`,
  `MantineListingGalleryPattern`, `ImageUpload`, `AdminUserAvatar`, `PerfDevOverlay`, `dialog.tsx`, `sheet.tsx` are
  all **read-only** in this task. R5 verifies two of them; it does not edit them.
- **A4 — no new test** (§3.8).
- **A5 — start state.** Task 688 is committed **and pushed** as `a9934c037`
  (`feat(Task688): PopularLocationsView de-Tailwind onto Mantine props + colocated CSS module …`), verified
  2026-07-30; branch `task/q0-ci-rendered-locale-split` was level with `origin/` at that moment. Run
  `git log --oneline | grep a9934c037` and confirm it is an ancestor of `HEAD`; if it is not, **stop and report** —
  every baseline in §3.5/§3.6 assumes that tree. Snapshot `git status --porcelain` before your first write and record
  it verbatim; a non-empty start state → **stop and report**. Note that this task's own kickoff commit sits *after*
  `a9934c037`, so `HEAD` will not equal it.
- **A6 — `--color-black` is not being removed from the project.** `dialog.tsx` and `sheet.tsx` keep their
  `bg-black/10`; the variable stays emitted for them. This task only stops *the module* from depending on it.
- **A7 — the 8 `CITY_GRADIENTS` rules, the focus ring, and the heading `fz` triple are untouched** (§8).

**Open questions — none.** D18 is decided; both values already exist; the one genuinely uncertain mechanism (§3.3) is
resolved by measurement inside the single route, with an explicit stop condition.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14, 16, 16b, 16c.
2. `docs/rule-index.md` — "UI / Layout / Component" → **Current Mantine path**, and "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy section.
4. `docs/mantine-responsive-design-system.md` — token-resolution rules.
5. `docs/design-system.md` — **§22–23** (token authority and the allow-marker convention).
6. `docs/storybook-visual-snapshots.md` — the `--mantine-only` proof path and manifest semantics.
7. `docs/qa-rules.md` — validation and encoding rules.
8. `docs/backlog.md` — the numbering line; the file is at exactly **80 lines** and must not grow.

**Source pre-read**

9. `src/app/globals.css` — **:22-60** (the `@theme inline` head and the overlay block), **:296-330** (the block
   boundary and the `:root` head), **:415-430** (the `:root` tail and the `.dark` head).
10. `src/modules/locations/components/PopularLocationsView.module.css` — the whole file (112 lines).
11. `src/modules/listings/components/LightboxView.tsx` — **:44-49**, **:80-90**, **:155-162**.
12. `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` — **:88-94**.
13. `scripts/check-design-tokens.mjs` — **:85-100** (exclusions), **:100-120** (colour patterns).
14. `docs/sessions/2026-07-29-task688-popularlocations-detailwind-cssmodule.md` — **§6** (the measured computed
    values this task must preserve) and **§7** (the D17 md5 finding).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/app/globals.css` | modify | R1, R8 — move 2 declarations + their comment between blocks |
| `src/modules/locations/components/PopularLocationsView.module.css` | modify | R3 — 2 `var()` references in `.scrim` |
| `docs/backlog.md` | modify | Update 690's state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` | **create** | Session log per §14. |

`.screenshots/` output is local-only per **D6**. Persist evidence under `.screenshots/task690-delta/`.

---

## 8. Out of scope

- **A governance gate** that fails when a `.module.css` consumes an `@theme` variable whose last Tailwind-utility
  consumer disappears. Real and valuable (it would protect every future de-Tailwind slice rather than one
  declaration), but it is a Q4 gate with planted-violation proof and its own blast radius. **Reserved as Task 692.**
- **`MantineListingCardPattern.tsx` (28 utilities) + `ListingCard.tsx` (8)** — the next de-Tailwind slice, **Task
  691**, which this task unblocks.
- **The section-heading `fz` rem triple** — **Task 689**, project-wide.
- **Removing `bg-black/10` from `dialog.tsx` / `sheet.tsx`**, or de-Tailwinding any overlay consumer (A3).
- **The 8 `CITY_GRADIENTS` rules and the `:focus-visible` ring** — their tokens already live in `:root` (§3.2).
- **Creating any test** (A4).
- **Any mutating Git command.**

---

## 9. Current and required behavior

**Current.** `--overlay: oklch(0 0 0)` and `--overlay-foreground: oklch(1 0 0)` are declared inside
`@theme inline` (`globals.css:52-53`), alongside their `--color-*` namespace entries. Tailwind emits them only while
a `bg-overlay*` / `text-overlay-foreground*` utility survives the source scan. Six files carry those utilities, and
two files (`LightboxView`, `MantineListingGalleryPattern`) additionally reference `var(--color-overlay*)` from inline
`style`/`c=` — a context Tailwind cannot see. `PopularLocationsView.module.css`'s `.scrim` references
`var(--color-black)`, which survives only because `dialog.tsx` and `sheet.tsx` still use `bg-black/10`.

**Required after.** The two declarations sit in `:root`, emitted unconditionally; the two `--color-*` entries stay in
`@theme` so `bg-overlay` / `text-overlay-foreground` remain valid utility names resolving `var(--overlay)` exactly as
they do today. The scrim reads `var(--overlay)` — the semantically correct token — and no longer depends on any
Tailwind theme variable. Every rendered surface is unchanged: same computed values, same verdicts, and any md5 motion
bounded at 1/255. `check:design-tokens` stays at 43. No value, geometry, prop contract, or component is changed.

---

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim. `git log -1 --oneline`; quote
the subject and confirm Task 688 is committed. Non-empty start state or missing 688 → **stop and report** (A5).

**I1 — baseline gates on the untouched tree.** Record actual output for `npm run check:design-tokens` (expect
**43 / 0 stale**), `npm run check:stories` (15 checks, 127 files, 0), `npm run check:story-coverage` (15/15),
`npm run check:i18n` (2215×4). A "before" you never captured is not a baseline.

**I2 — capture the BEFORE bundle and computed styles.** `npm run build`, then:

1. Persist the full list of emitted `overlay` selectors and their bodies to
   `.screenshots/task690-delta/overlay-selectors-before.txt`:
   `grep -ho "\.\(bg\|text\|border\)-overlay[^{]*{[^}]*}" .next/static/css/*.css | sort -u`
2. `npm run build-storybook`, then capture `getComputedStyle` to
   `.screenshots/task690-delta/computed-before.json`, following Task 688's harness precedent at
   `.screenshots/task688-delta/capture-computed-styles.mjs` (static server + Playwright against
   `storybook-static/`). Capture at `en` / `desktop-1024`:
   - `Mantine/Primitives/PopularLocationsView/Default` — the scrim `Box`: `backgroundImage`.
   - `Mantine/Primitives/LightboxView/Default` — the backdrop: `backgroundColor`; a
     `text-overlay-foreground` node: `color`.
   - `Patterns/Mantine/ListingCardPattern/*` — a `bg-overlay/60` node: `backgroundColor`.
   - The resolved values of `--overlay` and `--overlay-foreground` read off `document.documentElement`.

**I3 — make the change, then re-capture the bundle (this is R2's proof).** Move the two declarations plus their
comment into `:root` (R1, R8); repoint `.scrim` to `var(--overlay)` (R3). Re-run `npm run build` and regenerate
`overlay-selectors-after.txt` by the same command. **Required: the before/after selector sets are identical.** Any
selector that disappears, or any body that stops resolving `var(--overlay)`/`var(--overlay-foreground)`, is a
**stop and report** (A2). Quote the diff result.

**I4 — capture the AFTER computed styles and diff.** Rebuild Storybook, repeat I2.2 exactly, persist
`computed-after.json`, produce `computed-diff.json`. **Required: zero differing properties**, and the scrim value must
equal §3.7's measured string. Quote the diff. Any non-empty diff → fix the source, never the comparator (A1).

**I5 — rendered proof (R6).** `npm run screenshots:assert -- --mantine-only`, compared against
`.screenshots/rendered-assert/2026-07-29T20-43/` using Task 688's `compare-manifests.mjs` precedent:

1. All 1184 cells: **0 FAIL, 0 verdict changes**.
2. For **every** cell whose md5 moved, run a pixel-level diff (Task 688's `pixel-diff.mjs` precedent) and report
   diff-pixel count, total pixels, and **max channel delta**. The bound is **≤ 1/255**; anything above is a
   **stop and report**. Scan the full changed set, not a sample.
3. Persist the comparison and the per-cell pixel table under `.screenshots/task690-delta/`.

**I6 — token and gate checks (R7, R9).** `npm run check:design-tokens` — expect **43 / 0 stale**, module at **0**;
quote the per-file section. Then `npm run typecheck`, `npm run check:stories`, `npm run check:story-coverage`,
`npm run check:i18n`, and `npx vitest run`. For vitest: the documented full-run-only timeout set is
`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`; **which two of the three time out varies by
run** (Task 688 review F8), so report the pair you actually observe plus an isolated re-run of exactly those files.

**I7 — `npm run build` runs last** and must exit 0. Quote the transcript tail **including the route table**.

**I8 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then run `check:file-integrity` and `check:mojibake` **after** the records
exist, and quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8.

---

## 11. Positive and negative flows

### Positive flow

A visitor loads the homepage: photo city cards render the black top-to-bottom scrim exactly as before. They open a
listing lightbox: the backdrop is the same 95% black, the caption text the same white. They browse the gallery and
listing cards: every `bg-overlay/*` chip and `text-overlay-foreground` label is unchanged. An admin sees the same
avatar overlay. **Every one of those observations is pixel-identical to before this task** — the variables carry the
same values, only from a different declaration block.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **A Tailwind `overlay` utility stops being emitted** | **Yes** | §3.3, A2 | Cannot happen — `--color-overlay` stays in `@theme`; proven by the before/after selector-set identity | AC1 |
| **A non-Tailwind `var(--color-overlay*)` consumer breaks** | **Yes** | §3.4 | `LightboxView`, `MantineListingGalleryPattern` resolve unchanged | AC4 |
| **Scrim serialisation differs (`#000` vs `oklch(0 0 0)`)** | **Yes** | §3.7 | Both are pure black; computed string must match §3.7 exactly | AC3 |
| **Sub-pixel rasterisation delta (the D17 class)** | **Yes** | §3.5 | Tolerated only at ≤1/255 with per-cell attribution; above that, stop | AC5 |
| **Dark mode** | **Yes** | §3.2 | `.dark` defines no `--overlay` rule; the tokens are mode-invariant by design and stay so after the move | AC1 |
| **A literal or `var()` fallback creeps into the module** | **Yes** | §3.6 | Detector flags `oklch(` in `.css`; count must stay 43 | AC6 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | Overlay surfaces unchanged; `noHorizontalOverflow` stays true at 320/375/390 | AC5 |
| **All four locales** | **Yes** | cl. 7 | No user-facing string added or changed; zero new keys | AC5, AC8 |
| Validation / authorization / RLS | No | No data path, no write, no permission boundary touched | N/A | — |
| Critical-flow regression | No | No registry row for popular locations, lightbox, or gallery overlay (§3.8) | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1, R2]** — *Given* the final `globals.css`, *then* `--overlay` and `--overlay-foreground` are declared
  inside `:root` (line number > the `@theme inline` closing brace) with byte-unchanged values, `--color-overlay` and
  `--color-overlay-foreground` remain inside `@theme inline`, and
  `diff overlay-selectors-before.txt overlay-selectors-after.txt` is **empty**. Quote both the moved lines and the
  diff result.
- **AC2 [R3]** — *Given* the final tree, *then* `.scrim` reads `var(--overlay)` and
  `grep -rn 'color-black' src/` returns **0 hits**.
- **AC3 [R4]** — *Given* `computed-after.json`, *then* the scrim's `backgroundImage` is byte-identical to
  `linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)`.
- **AC4 [R5]** — *Given* `computed-diff.json`, *then* it is **empty** across every captured element and property,
  including the LightboxView backdrop/caption and the ListingCardPattern overlay node. Both raw captures are
  persisted, not just the diff. Neither consumer file appears in `git status`.
- **AC5 [R6]** — *Given* a fresh `build-storybook` + `--mantine-only` run compared to `2026-07-29T20-43`, *then*
  across all 1184 cells there are **0 FAIL and 0 verdict changes**, and every md5-changed cell has a persisted
  pixel-diff row with **max channel delta ≤ 1/255**. Quote the changed-cell count and the worst-case row.
- **AC6 [R7]** — *Given* `npm run check:design-tokens`, *then* **43 raw + 0 stale-marker**, with
  `PopularLocationsView.module.css` **absent** from the violation list. Quote the per-file section.
- **AC7 [R8]** — *Given* the final `globals.css`, *then* the overlay block comment sits with the relocated
  declarations and states the unconditional-emission rationale, naming Task 690 and F1.
- **AC8 [R9]** — `npm run build` exits 0 on a fresh transcript (quote the tail **including the route table**);
  `typecheck` 0, `check:stories` 0 (15 checks/127 files), `check:story-coverage` 0 (15/15), `check:i18n` 0 at 2215×4
  with zero new keys, `check:file-integrity`/`check:mojibake` 0 **after** the records exist (quote counts), and
  `vitest` shows no new failure beyond the documented run-varying pair (§I6).

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`**, per `docs/qa-profiles.md`. The change alters the declaration site of two variables
consumed by **eight** files across the listing, gallery, lightbox, admin and homepage surfaces (§3.5) — a
project-wide colour-plumbing blast radius on manifest-enrolled primitives, which is exactly the Q3 trigger. It is not
`Q4` — no `docs/critical-flow-registry.md` row is touched and no gate is being authored (the gate is Task 692, §8).
It is not `Q2` — the blast radius is not local to one component.

**Declared proof path.** `--mantine-only` over the 67 enrolled stories / 1184 cells at 4 locales × 7 viewports
(320/375/390/1024/1200/1440/1536), which covers `PopularLocationsView`, `LightboxView`, `ListingCard`,
`ListingCardPattern`, `ListingGalleryPattern` and `Avatar`. The remaining canonical widths stay **Task 678's** scope.

**Coverage limitation to record, not to fix here:** `ListingGallery.tsx`, `ImageUpload.tsx`, `AdminUserAvatar.tsx`
and `PerfDevOverlay.tsx` carry `overlay` utilities but are **not** manifest-enrolled, so they are covered by AC1's
bundle-level selector-set identity rather than by rendered evidence. State this in the session log.

**TailAdmin side-by-side: not required.** No new visual value is introduced — both values are unchanged, so cl. 16/16a
are satisfied by the equality proofs in AC1/AC3/AC4.

### 13.2 Worktree

Snapshot `git status --porcelain` before the first write and record it verbatim. If it is not empty, **stop and
report** (A5). No dirty-worktree manifest is required for a clean start.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:design-tokens` (before / after) | **43 / 0 stale** both times; module at 0 (AC6) |
| bundle `overlay` selector-set diff | **empty** (AC1) |
| computed-style before/after diff | **empty**; scrim matches §3.7 (AC3, AC4) |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 15 checks, 127 files, 0 violations |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4, zero new keys |
| `npm run build-storybook` | 0 (run twice — before I2.2 and before I5) |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes; every md5 delta attributed at ≤1/255 (AC5) |
| `npx vitest run` | no new failure; report the observed run-varying pair + isolated re-run |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I8** |
| `npm run build` | **0 — hard gate**, transcript tail **including the route table** quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-30-task690-overlay-root-relocation.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7's paths only.
2. The start snapshot and the **true final** `git status --porcelain`, taken *after* the records are written.
3. R1–R9 mapped to AC1–AC8 with evidence.
4. The `globals.css` before/after line excerpt showing both blocks, with line numbers.
5. The bundle `overlay` selector-set before/after diff, quoted.
6. `computed-before.json`, `computed-after.json`, `computed-diff.json` paths, with the diff result and the scrim
   string quoted.
7. The 1184-cell comparison summary and the **full** per-cell pixel table for every md5-changed cell, with the
   worst-case max channel delta called out.
8. The `check:design-tokens` before/after per-file sections quoted (43 → 43).
9. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim including the
   route table.
10. Deviations, each with a reason.
11. Limitations — at minimum: the 7-width proof path (§13.1); the four non-enrolled overlay consumers (§13.1); that
    Task 691 (`MantineListingCardPattern`), Task 692 (the `@theme`-dependency gate) and Task 689 (the `fz` triple)
    are deferred per §8; and that `.screenshots/` evidence is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_690_Overlay_Token_Root_Relocation_And_Scrim_Swap.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, compiled selector, token value, count, command and owner ruling is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC8 |
| Scope names what must not change | **Yes** — §8, incl. all eight consumer files, the gradients, the focus ring, the `fz` triple, the gate, and test creation |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 with the not-Q4 and not-Q2 reasons and the non-enrolled-consumer limitation stated; §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; no new visual value, every enrolled story renders the real component and needs no edit (cl. 16c) |
| Owner-only exceptions traceable | **Yes** — D6/D10/D17 standing with dates, D18 new (§3.1) |
| Baselines account for task-created artifacts | **Yes** — `.screenshots/task690-delta/` is task-created with no prior baseline; the `--mantine-only` baseline is `2026-07-29T20-43` per D17 |
| Worktree handling | **Yes** — §13.2, with an explicit stop condition and a `HEAD`-carries-688 precondition |
| Gates prove the changed behavior | **Yes** — a bundle selector-set diff that must be *empty* (the only real risk), an empty computed diff, a 1184-cell verdict comparator with a per-cell 1/255 pixel bound, and a falsifiable token count held at 43 |
| Single active owner route | **Yes** — the only forks are A5's start-state stop, I3's missing-selector stop, I4's non-empty-diff stop, and I5's >1/255 stop |
| API claims verified, not assumed | **Yes** — §3.2 quotes the real block boundaries; §3.3 quotes the real compiled utility bodies from the built bundle; §3.4 is a grep-verified consumer census; §3.6 quotes the real detector pattern; §3.7 quotes Task 688's persisted computed capture |

**Known-risk note for the reviewer.** Four likely defects. First, **moving `--color-overlay` too** — that entry is
what registers the `overlay` colour name with Tailwind; moving it would delete every `bg-overlay*` utility, and AC1's
selector-set diff is what detects it. Second, **adding a `var(--overlay, oklch(0 0 0))` fallback** for belt-and-braces
— the detector flags `oklch(` in `.css` and the count would break; AC6 detects it. Third, **"fixing" a consumer file**
that looks fragile (`LightboxView`'s inline `var(--color-overlay)`) — A3 forbids it; the relocation already fixes
them without an edit. Fourth, **treating a changed md5 as automatically acceptable** because D17 exists — D17 bounds
the tolerance at 1/255 with per-cell attribution over the *full* changed set, and Task 688's own report
under-sampled it (review F4).

---

## 16. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Homepage photo scrim | `PopularLocationsView.module.css` `.scrim` | `.scrim` | `var(--color-black)` → **`var(--overlay)`** | **changed source, identical output** | AC2, AC3 |
| Lightbox backdrop | `LightboxView.tsx:86` | inline `style` | `color-mix(in oklab, var(--color-overlay) 95%, transparent)` | **untouched; emission hardened** | AC4 |
| Lightbox caption / thumb border | `LightboxView.tsx:45-48`, `:159` | inline `style` | `var(--color-overlay-foreground)` | **untouched; emission hardened** | AC4 |
| Gallery caption | `MantineListingGalleryPattern.tsx:91` | `c=` prop | `var(--color-overlay-foreground)` | **untouched; emission hardened** | AC4 |
| Listing-card overlay chips | `MantineListingCardPattern.tsx` | `bg-overlay/30`, `bg-overlay/60` ×2, `text-overlay-foreground` ×3 | Tailwind utility → `var(--overlay)` | **untouched** | AC1, AC5 |
| Gallery / upload / avatar overlays | `ListingGallery.tsx`, `ImageUpload.tsx`, `AdminUserAvatar.tsx` | `bg-overlay/*`, `text-overlay-foreground` | Tailwind utility → `var(--overlay)` | **untouched, not enrolled** | AC1 |
| Dev perf overlay | `PerfDevOverlay.tsx` | `bg-overlay/85`, `text-overlay-foreground/*` ×9, `border-overlay-foreground/20` | Tailwind utility → `var(--overlay)` | **untouched, dev-only** | AC1 |
| Fallback gradients ×8 / focus ring | `PopularLocationsView.module.css` | `.gradient0`–`.gradient7`, `.card:focus-visible` | `--primary`/`--brand-*`/`--badge-*`/`--ring`, all already in `:root` | **out of scope, untouched** | §3.2, §8 |
| Legacy shadcn scrims | `dialog.tsx:35`, `sheet.tsx:32` | `bg-black/10` | `var(--color-black)`, stays in `@theme` | **out of scope, untouched** | A6 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path |
|---|---|---|---|---|
| Overlay colour tokens | read `globals.css:22-60`, `:296-330`, `.dark` head; grepped `--overlay`/`--color-overlay` repo-wide (11 hits, all read); grepped `(bg\|text\|border)-overlay*` across `src/` (8 files, 33 utilities); read the compiled `.bg-overlay*` / `.text-overlay-foreground*` bodies from `.next/static/css` | `Mantine/Primitives/LightboxView`, `Patterns/Mantine/ListingCardPattern`, `Patterns/Mantine/ListingGalleryPattern`, `Mantine/Primitives/ListingCard`, `Mantine/Primitives/Avatar` — all render real production components | **reuse** — no new token, no new value; only the declaration block changes | `--overlay`/`--overlay-foreground` relocated to `:root`; `--color-overlay*` stay in `@theme` as the Tailwind namespace entries |
| Homepage photo scrim | read `PopularLocationsView.module.css` in full; read Task 688 §6's persisted computed capture | `Mantine/Primitives/PopularLocationsView` (`Default`, `LongCityName`), 56 enrolled cells | **reuse** — swap the token source, reproduce the measured serialization | `var(--overlay)`; no module rule added or removed |

**Clause 16c note.** Every affected artifact has a canonical Mantine story that renders the real production
component, and **none requires an edit**: no prop, DOM shape or rendered pixel changes by design. Their enrolled
cells are the primary acceptance evidence (AC5).

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 2 `src/` paths | Exactly 2 `src/` files changed; no consumer, story, or sibling touched | §7, §8, A3 | required |
| cl. 3/5 (capabilities and UX flows intact) | Overlay chrome across 8 files | Every overlay surface renders identically | §11, AC4, AC5 | required |
| cl. 7 (four locales) | Rendered surfaces | Zero new keys; parity 2215×4; all 4 locales in the 1184-cell comparison | AC5, AC8 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table | AC8 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | `noHorizontalOverflow` true at 320/375/390 in all locales | AC5 | required |
| cl. 12 (rendered evidence follows risk) | Q3, colour plumbing across enrolled primitives | 0 verdict changes; every md5 delta attributed at ≤1/255 | AC5 | required |
| cl. 13 (Storybook gates enforceable) | Story-rendered primitives | `check:stories` 0, `check:story-coverage` 15/15; canonical stories preserved | AC8, §17 | required |
| cl. 14 (file integrity) | 3 modified + 1 created text file | UTF-8 no BOM, no mojibake, scanned set includes the records | AC8 | required |
| cl. 15 (critical flows) | **No registry row** for popular locations, lightbox, or gallery overlay (grep-verified) | Not applicable — stated as an explicit negative, not silence | §3.8 | N/A, declared |
| cl. 16 (TailAdmin visual source) | Visual chrome in scope | No new value; equality proofs replace a side-by-side | AC1, AC3, AC4, §13.1 | required |
| cl. 16b (canonical provenance before code) | 9 visible artifacts mapped | Canonical search recorded; disposition `reuse` for every one | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Migrated Mantine artifacts change token source | Stories inspected, render the real components, need no edit; their cells are the acceptance evidence | §3.8, §17, AC5 | required |
| cl. 10 (git ownership) | — | Start snapshot recorded; diff limited to §7; no mutating Git by the executor | A5, §14 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 690 |
| Active route / owner decision | Single route: move the `--overlay`/`--overlay-foreground` **declarations** from `@theme inline` into `:root`, keep `--color-overlay*` in `@theme`, repoint `.scrim` to `var(--overlay)`, then prove zero delta by an identical bundle selector set, an empty computed diff, and a 1184-cell verdict comparison with a per-cell 1/255 pixel bound (owner **D18**, 2026-07-30; **D17** sets the pixel comparator; **D10** the verdict comparator; **D6** governs `.screenshots/` visibility) |
| Decision source, date, scope | Owner, 2026-07-30, following Task 688 review finding F1; scope = 1 stylesheet + 1 CSS module; **no** consumer edit, **no** gate authoring, **no** ListingCard slice, **no** heading tokenisation |
| Starting worktree mode | Recorded at I0 with an explicit non-empty stop condition and a `HEAD`-carries-688 precondition (A5) |
| Producer of each checkpoint | start snapshot → baseline gates (`design-tokens` 43/`stories`/`story-coverage`/`i18n`) → build #1 + **selector-set-before** → storybook #1 + **computed-before** → source change → build #2 + **selector-set-after + diff** → storybook #2 + **computed-after + diff** → `--mantine-only` 1184-cell comparison + per-cell pixel attribution → design-tokens 43 → typecheck/stories/coverage/i18n/vitest → build → records → post-records encoding gates |
| Persisted result | start/end porcelain snapshots; `overlay-selectors-before/after.txt`; `computed-before/after/diff.json`; the manifest comparison and full pixel table under `.screenshots/task690-delta/`; every gate transcript; build tail with route table; session log |
| Comparator | bundle overlay selector-set diff **empty**; computed-style diff **empty**; scrim `backgroundImage` byte-equal to §3.7; **1184** cells 0 FAIL / **0 verdict changes**; every md5-changed cell **max channel delta ≤ 1/255**; `design-tokens` **43 / 0 stale** with the module at 0; `check:stories` 15 checks/127 files/0; `story-coverage` 15/15; `i18n` 2215×4 |
| Failure path | Non-empty start state or 688 not in `HEAD` → stop (A5); any overlay selector missing or no longer resolving `var(--overlay)` → stop (A2); non-empty computed diff → fix the source, never the comparator (A1); any verdict change, or any md5-changed cell above 1/255 → stop and report; a value that cannot be reproduced → stop, do not substitute |
| Zero/empty input case | The **empty** selector-set diff and the **empty** computed diff are both success states, so each comparator must distinguish "ran and was empty" from "never ran": the raw before/after captures are persisted alongside each diff as the producer witness. Separately, the md5-changed set may legitimately be **empty** — that is a pass, and the pixel table must then record "0 changed cells", not be omitted |
| Task-created artifacts in baselines | `.screenshots/task690-delta/` is task-created with **no** pre-change baseline — evidence, not a regression surface. The `--mantine-only` baseline is `2026-07-29T20-43` (Task 688's D17-ratified run), **not** `17-50` |
