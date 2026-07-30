# Task 693 — Task 690 revision: declare `--overlay`/`--overlay-foreground` in **both** `@theme inline` and `:root`

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** design-token plumbing — **token-emission hardening** (`docs/rule-index.md` → "UI / Layout /
  Component" → **Current Mantine path**).
- **Secondary types:** Storybook / visual proof; design-token conformance (cl. 16, 16b); **planted-negative gate
  proof** (the F1-actually-fixed control, §10 I5).
- **Origin:** Task 690 returned `BLOCKED` at its own I3/A2 stop condition on 2026-07-30. Owner decision **D19**
  (2026-07-30) replaces D18's mechanism. **This task starts from Task 690's dirty worktree and amends it** (§3.2).

> **Read this first.** Task 690 was not wrong to stop — it falsified the mechanism it was given. Its `:root`
> declarations and its scrim swap are **correct and are kept**. This task adds back what D18 wrongly removed. Zero
> rendered change; no value moves. `oklch(0 0 0)` stays `oklch(0 0 0)`.

---

## 2. Objective

1. Re-declare `--overlay: oklch(0 0 0)` and `--overlay-foreground: oklch(1 0 0)` **inside `@theme inline`**, so
   Tailwind can again statically resolve them and emit the correct alpha-composited static fallback for every
   opacity-modifier utility.
2. **Keep** the identical declarations Task 690 added to `:root` (`globals.css:426-427`), so the variables emit
   unconditionally even when no Tailwind utility consumes them. This is what actually closes Task 688 finding **F1**.
3. **Keep** Task 690's scrim swap to `var(--overlay)`.
4. Prove both halves: the bundle's `overlay` selector set returns **byte-identical to the pre-690 baseline** (AC1),
   **and** a planted-negative control shows the variables now survive the disappearance of every `overlay` utility
   (AC2) — the criterion Task 690's design was missing.
5. Hold `check:design-tokens` at **43 / 0 stale-marker** and the rendered matrix at 0 verdict changes.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-30.
`HEAD` is `9e8098b17` (`docs(Task690): … kickoff (D18), 688 review outcome + D17, 691/692 reserved`), which has Task
688's `a9934c037` as an ancestor.

### 3.1 Owner decisions

| ID | Question | Ruling |
|---|---|---|
| **D6** (Task 684, standing) | `.screenshots/` visibility. | **Local-only** per `.gitignore:55`. |
| **D10** (Task 685 review, standing) | Comparator for non-target cells. | **0 verdict changes** + per-story attribution. |
| **D17** (Task 688 review, standing) | md5 motion on rendered cells. | **0 verdict changes + byte-identical assertion payloads + max channel delta ≤ 1/255**, with per-cell attribution over the **full** changed set. Baseline `2026-07-29T20-43/`. |
| **D18** (Task 690, **SUPERSEDED**) | Close F1 by relocating the declarations `@theme` → `:root`. | **Falsified by measurement** (§3.3). Superseded by D19; do not re-apply. |
| **D19** (this task, 2026-07-30) | How to close F1 without losing Tailwind's static fallback tier? | **Declare the two variables in BOTH blocks.** `@theme inline` restores static resolution; the `:root` copy guarantees unconditional emission. The duplicated literal is accepted, guarded by a comment now and by **Task 692**'s gate later. |
| **D20** (this task, amended 2026-07-30 after the first `BLOCKED`) | I5's control failed its second half: on the pre-690 arrangement with every `overlay` utility stripped, the variables **stayed present**, so the control could not demonstrate F1. | **The control's subject was wrong, not its logic.** Re-point I5 at **`--color-black`** — F1's actual subject — and plant on `dialog.tsx`/`sheet.tsx`. The overlay pair was structurally incapable of failing the control (§3.8). D19's code is **unchanged and retained**: its own gates (I3, I4) passed. Execution **resumes at I5**; I0–I4 are not re-run (§10 I0). |

### 3.2 Start state — an intentional, manifested dirty worktree

**This task does not start clean.** Task 690's implementation is left in place for amendment per its BLOCKED
handoff. Reconcile exactly these four entries at I0; anything else is a **stop and report**.

| Path | Status | Disposition in this task | Content witness (md5, 2026-07-30) |
|---|---|---|---|
| `src/app/globals.css` | ` M` | **Amend** — add 2 declarations to `@theme inline`; keep the `:root` pair; update both comments | `c5afe03ab5ee96f11d253bd1912d7f54` |
| `src/modules/locations/components/PopularLocationsView.module.css` | ` M` | **Keep verbatim** — Task 690's scrim swap is correct. Re-verify the md5 is unchanged at I8; if it moved, you edited it, which is out of scope | `b721ecf9284f23a026d097b4012bdea4` |
| `docs/backlog.md` | ` M` | **Amend** — replace 690's BLOCKED entry with 693's state. Stay at **80 lines** | `c97915760e613a2411446fb373310ef1` |
| `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` | `??` | **Keep verbatim, do not delete** — it is the evidence record for the falsification and ships with this task | — |

`.screenshots/task690-delta/` is task-created and local-only (D6). **`overlay-selectors-before.txt` in that
directory is the pre-690 baseline and is this task's AC1 comparator — do not overwrite or regenerate it.**

### 3.3 Why D18 failed — measured, reproduced by the reviewer

Tailwind v4 emits two tiers for an opacity-modifier utility: a static fallback whose alpha is composited **at build
time**, and an `@supports (color:color-mix(in lab,red,red))` upgrade. Compositing the fallback requires Tailwind to
**statically resolve the variable's value**, which it can only do for a `@theme` entry.

Moving the declarations to `:root` removed that ability. Read from the built bundle before and after D18:

| Utility | Fallback before (declaration in `@theme`) | Fallback after (declaration in `:root`) |
|---|---|---|
| `.bg-overlay\/30` | `background-color:#0000004d` | `background-color:var(--overlay)` |
| `.bg-overlay\/50` | `#00000080` | `var(--overlay)` |
| `.bg-overlay\/60` | `#0009` | `var(--overlay)` |
| `.bg-overlay\/85` | `#000000d9` | `var(--overlay)` |
| `.bg-overlay\/95` | `#000000f2` | `var(--overlay)` |
| `.border-overlay-foreground\/20` | `#fff3` | `var(--overlay-foreground)` |
| `.text-overlay-foreground\/40` | `#fff6` | `var(--overlay-foreground)` |
| `.text-overlay-foreground\/70` | `#ffffffb3` | `var(--overlay-foreground)` |

The alpha is not merely re-expressed — it is **gone**. Tailwind collapsed the now-identical rules into a shared
selector list: `.bg-overlay,.bg-overlay\/30{background-color:var(--overlay)}`.

**Impact, stated precisely.** The `color-mix()` tier is emitted second and wins in every browser that supports it
(Chromium harness included), so the Q3 matrix would have shown nothing. In a browser **without** `color-mix()`,
`bg-overlay/30` on `AdminUserAvatar` and `bg-overlay/60` on the listing cards render **solid opaque black over the
photo** — content obscured, not a soft-focus cosmetic difference. `text-overlay-foreground/*` degrades harmlessly.

Reproduced by the executor on a clean `rm -rf .next && npm run build`, and independently re-derived by the reviewer
from `.screenshots/task690-delta/overlay-selectors-{before,after}.txt` and the current bundle.

### 3.4 Why the dual declaration works

- **`@theme inline` copy** → Tailwind resolves the value at build time → the alpha-composited fallback returns,
  byte-identical to the pre-690 baseline (AC1).
- **`:root` copy** → hand-written CSS outside `@theme`, emitted unconditionally, independent of the source scan →
  the variables survive even when the last `overlay` utility disappears (AC2). This is the F1 fix.
- **Both land in `:root` of the bundle with the same value**, so last-wins is a no-op and no computed value changes
  (AC4/AC5).
- `--color-overlay` / `--color-overlay-foreground` stay in `@theme inline`: they register the `overlay` colour
  *name* so `bg-overlay*` / `text-overlay-foreground*` remain valid utilities. **Do not move or duplicate these two.**

Base utilities already reference the variable rather than a literal — `.bg-overlay{background-color:var(--overlay)}`,
`.text-overlay-foreground{color:var(--overlay-foreground)}` (read from the pre-690 bundle) — so runtime resolution is
unaffected either way.

### 3.5 Current file state — read at source

`globals.css` block boundaries: `@theme inline {` opens at **:22**, closes at **:299**; `:root {` opens at **:310**,
closes at **:428**; `.dark {` follows. `.dark` defines **no** `--overlay` rule (grep-verified) — the tokens are
mode-invariant by design.

Current `@theme` overlay region, `:51-59` (Task 690 left the namespace entries and its own comment):

```css
  /* Overlay Tailwind namespace entries — keep the `overlay` colour name registered as a Tailwind
     utility (`bg-overlay*`, `text-overlay-foreground*`). The declarations themselves live in
     `:root` below (Task 690/F1): … */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

Current `:root` overlay region, `:418-427` (Task 690's addition, **kept**):

```css
  /* Overlay tokens — always dark/light regardless of mode (photo overlays, lightbox). Declared
     here, not inside `@theme inline`, so they emit unconditionally (Task 690/F1): … */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
```

Both comments assert a "declarations live only in `:root`" rationale that D19 supersedes. **Both must be rewritten**
(R4) to state the dual-declaration contract and why each copy exists.

### 3.6 Consumer census (unchanged from Task 690, grep-verified)

`bg-overlay*` / `text-overlay-foreground*` / `border-overlay-foreground*` utilities — 33 across 8 files:
`MantineListingCardPattern.tsx` (6), `PerfDevOverlay.tsx` (10), `LightboxView.tsx` (4), `ListingGallery.tsx` (5),
`MantineListingGalleryPattern.tsx` (3), `ImageUpload.tsx` (3), `AdminUserAvatar.tsx` (1), plus base variants.

Direct `var(--color-overlay*)` consumers: `LightboxView.tsx:45-48`, `:86`, `:159`;
`MantineListingGalleryPattern.tsx:91`. **Correction (D20):** Task 690 and this task's first revision both described
these as "invisible to Tailwind's scanner". That is wrong — they are ordinary `.tsx` files inside the scanned corpus,
and their literal text is one of the reasons the overlay pair survives any plant (§3.8). What is genuinely invisible
is a `.css` file, which is why the scrim's reference could not sustain `--color-black`.

Manifest-enrolled coverage: `Mantine/Primitives/LightboxView`, `Mantine/Primitives/ListingCard`,
`Patterns/Mantine/ListingCardPattern`, `Patterns/Mantine/ListingGalleryPattern`, `Mantine/Primitives/Avatar`,
`Mantine/Primitives/PopularLocationsView`. **Not enrolled:** `ListingGallery.tsx`, `ImageUpload.tsx`,
`AdminUserAvatar.tsx`, `PerfDevOverlay.tsx` (dev-only) — covered by AC1's bundle-level proof, not by pixels.

### 3.7 Baselines

| Comparator | Value | Source |
|---|---|---|
| bundle `overlay` selector set | `.screenshots/task690-delta/overlay-selectors-before.txt` | Task 690 I2, pre-change |
| computed styles | `.screenshots/task690-delta/computed-before.json` | Task 690 I2, pre-change |
| rendered matrix | `.screenshots/rendered-assert/2026-07-29T20-43/` (1184 cells, 1162 pass, 0 fail, 22 ambiguous) | Task 688, D17-ratified |
| `check:design-tokens` | **43 / 0 stale**; module at 0 | Task 688 review, re-run 2026-07-30 |
| scrim computed `background-image` | `linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)` | Task 688 §6 |

`globals.css` is **excluded** from `check:design-tokens` (`scripts/check-design-tokens.mjs:85-100`), so duplicating a
declaration there costs nothing. The detector **does** flag `\b(rgb|rgba|hsl|hsla|oklch)\s*\(` in `.css`
(`:110`) — so no literal and no `var(--overlay, oklch(0 0 0))` fallback may enter the module.

### 3.8 Why the first I5 could not fail — and what the control's real subject is (D20)

**Tailwind v4 does not scan `.css` files for candidates.** Proven statically against the current tree, no build
required: `bg-gradient-to-br` occurs as literal text in `MantineHomeSection.module.css` and
`PopularLocationsView.module.css` (both in comments) and **nowhere** in any `.tsx` — and `.bg-gradient-to-br` is
**absent from the built bundle**. The control case `bg-overlay`, which does live in `.tsx`, **is** emitted. Automatic
content detection is on (`globals.css:1` `@import "tailwindcss"`, with only `@source not "../../docs"` and
`@source not "../../tasks"` at `:11-12`); no `.css` file is part of the scanned corpus.

Consequences, and they point in opposite directions:

**F1 stands.** `--color-black` has exactly one class of lifeline. It appears in **zero** scanned source
(`grep -rn -- "--color-black" src/ scripts/ .storybook/ --include=*.tsx --include=*.ts --include=*.mjs
--include=*.js --include=*.json` → no hits; the only occurrence is in the unscanned `.module.css`). It is **not**
declared or referenced anywhere inside `@theme` — it is a Tailwind default-palette entry, absent from `globals.css`
entirely. Its emission therefore depends solely on `bg-black/10` at `dialog.tsx:35` and `sheet.tsx:32`. No
confounder exists, so Task 688 finding F1 is **not** invalidated by the first I5 result.

**The overlay pair was the wrong subject.** Unlike `--color-black`, it carries two additional lifelines that no
plant on the 8 consumer files can remove:

1. **Six literal `var(--color-overlay*)` occurrences in scanned `.tsx`** — `LightboxView.tsx:45,46,47,48,86,159`
   and `MantineListingGalleryPattern.tsx:91`. A4 forbids editing those files, correctly.
2. **An intra-`@theme` self-reference** — `--color-overlay: var(--overlay)` and
   `--color-overlay-foreground: var(--overlay-foreground)` (`globals.css:44-45`). While the namespace entry is
   emitted, its referent must be too, or the emitted value would dangle.

With either lifeline intact the variables survive any plant, so the original I5.3 **could never have returned
`ABSENT`**. It was not a failed experiment; it was a test whose subject is immune to the effect it was meant to
demonstrate. That is an orchestrator design defect (**M4**), of the same family as Task 690's **M2**: a criterion
incapable of detecting what it exists to detect. The executor's stop was correct, and its refusal to chase the cause
into A4-protected files was correct.

**D20's control therefore uses `--color-black` and plants on `dialog.tsx`/`sheet.tsx`.** Those two files are legacy
shadcn surfaces, are not among the six overlay consumers, and the plant is the same temporary-and-reverted mechanism
already authorised for the consumer files — it is not a scope expansion (A4, §8).

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D19, §3.4 | `--overlay: oklch(0 0 0)` and `--overlay-foreground: oklch(1 0 0)` are declared **inside `@theme inline`**, immediately above the `--color-overlay*` entries, with byte-identical values. | P0 | AC1 |
| R2 | D19, §3.4 | The identical `:root` declarations (`globals.css:426-427`) are **retained**. `--color-overlay`/`--color-overlay-foreground` remain in `@theme inline` and are **not** duplicated. | P0 | AC1, AC2 |
| R3 | §3.3 | The built bundle's `overlay` selector set is **byte-identical to `overlay-selectors-before.txt`** — every opacity-modifier fallback carries its composited hex again. | P0 | AC1 |
| R4 | §3.5 | Both comments are rewritten to state the dual-declaration contract: why the `@theme` copy exists (static fallback compositing), why the `:root` copy exists (unconditional emission / F1), that they must stay in sync, and that Task 692 will gate that. Cite Task 693 and D19. | P2 | AC3 |
| R5 | F1, §3.8, **D20** | **Planted-negative control on `--color-black`** (F1's actual subject, the only token in the tree with a single class of lifeline): removing `bg-black/10` from `dialog.tsx:35` and `sheet.tsx:32` must make `--color-black` **disappear** from the built bundle, proving usage-contingent emission is real and that the scrim's former dependency was a genuine risk. Paired with an unplanted control build in which it **is** present. | P0 | AC2 |
| R6 | §3.7 | Task 690's scrim swap is retained unchanged; `grep -rn 'color-black' src/` returns **0 hits**; the module's md5 is unchanged from §3.2. | P0 | AC4 |
| R7 | §3.7 | The scrim's live computed `background-image` equals §3.7's string; the computed before/after diff is empty across the scrim, the LightboxView backdrop/caption, and a ListingCardPattern overlay node. | P0 | AC5 |
| R8 | D17, §3.7 | All 1184 cells: **0 FAIL, 0 verdict changes**; every md5-changed cell attributed with **max channel delta ≤ 1/255**, over the full changed set. | P0 | AC6 |
| R9 | §3.7 | `check:design-tokens` reports **43 / 0 stale**, module at **0**. | P0 | AC7 |
| R10 | cl. 9, 7, 14 | `npm run build` exits 0 on a fresh transcript; `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n` (2215×4, zero new keys), `check:file-integrity`, `check:mojibake` all exit 0; `npx vitest run` shows no new failure attributable to this diff. | P0 | AC8 |

---

## 5. Assumptions and open questions

- **A1 — zero rendered delta is the point.** Report the first value you observe at every checkpoint before any
  adjustment. Never reach a target by relaxing a comparator or adding an allowlist entry.
- **A2 — AC1 is the mechanism proof, and it is falsifiable.** §3.4 predicts the fallback tier returns. If
  `overlay-selectors-after.txt` still differs from the pre-690 baseline, **stop and report** — do not hand-write
  utilities, do not add a `@supports` block, do not remove the `:root` copy.
- **A3 — AC2 is the objective proof, and D20 gave it a subject that can actually fail.** Task 690 shipped no
  criterion showing F1 was ever real; this task's first attempt shipped one whose subject was immune (§3.8). If I5.3
  now shows `--color-black` **surviving** the plant, F1 is disproven and the whole 690→693 line rests on a phantom —
  **stop and report**, do not rationalise it.
- **A4 — do not touch any consumer file, with one named exception.** `LightboxView`, `ListingGallery`,
  `MantineListingCardPattern`, `MantineListingGalleryPattern`, `ImageUpload`, `AdminUserAvatar`, `PerfDevOverlay`
  are **read-only, including diagnostically**. `dialog.tsx` and `sheet.tsx` are read-only as *deliverables* but carry
  I5's temporary, fully-reverted plant (§10 I5.2/I5.4) — that plant is authorised by **D20** and is the only edit
  permitted outside §7's scope. It must leave no trace in `git diff --stat` (AC2).
- **A5 — the start state is dirty by design** (§3.2). Verify all four entries and their md5 witnesses before the
  first write. An unexpected fifth path, or a witness mismatch, → **stop and report**.
- **A6 — do not delete Task 690's session log.** It is the falsification record and ships with this task.
- **A7 — no new test** — the observable contract is the emitted bundle (AC1/AC2) and the rendered pixel (AC6), both
  gated more strictly than a unit test could be.
- **A8 — `--color-black` stays in the project.** `dialog.tsx`/`sheet.tsx` keep `bg-black/10`; this task only ensures
  the module no longer depends on it.

**Open questions — none.** D19 is decided; both values already exist in the tree; the two uncertain mechanisms
(fallback restoration, unconditional emission) are each resolved by a falsifiable control inside the single route.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14, 16, 16b, 16c.
2. `docs/rule-index.md` — "UI / Layout / Component" → **Current Mantine path**; "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy section.
4. `docs/design-system.md` — **§22–23** (token authority, allow-marker convention).
5. `docs/storybook-visual-snapshots.md` — the `--mantine-only` proof path and manifest semantics.
6. `docs/qa-rules.md` — validation and encoding rules.
7. `docs/backlog.md` — the numbering line; **exactly 80 lines**, must not grow.

**Source pre-read**

8. `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` — **§1**, **§6** (the selector-set evidence),
   **§10–11**. Read this before writing any code; it is why this task exists.
9. `src/app/globals.css` — **:22-60** (`@theme` head and the overlay region), **:296-315** (the block boundary),
   **:412-428** (the `:root` tail with Task 690's addition).
10. `src/modules/locations/components/PopularLocationsView.module.css` — **:39-53** (the `.scrim` rule; do not edit).
11. `src/modules/listings/components/LightboxView.tsx` — **:44-49**, **:80-90**, **:155-162**.
12. `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` — **:88-94**.
13. `scripts/check-design-tokens.mjs` — **:85-100** (exclusions), **:100-120** (colour patterns).
14. `.screenshots/task690-delta/overlay-selectors-before.txt` — the AC1 comparator. Read it; do not regenerate it.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/app/globals.css` | modify | R1, R2, R4 |
| `src/modules/locations/components/PopularLocationsView.module.css` | **retain unchanged** (already modified vs `HEAD`) | R6 — in the diff, not in the edit set |
| `docs/backlog.md` | modify | Update 690→BLOCKED/superseded and 693's state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` | **retain unchanged** (already untracked) | A6 |
| `docs/sessions/2026-07-30-task693-overlay-dual-declaration.md` | **create** | Session log per §14 |

Evidence under `.screenshots/task693-delta/`; the Task 690 baselines under `.screenshots/task690-delta/` are
**read-only inputs**.

---

## 8. Out of scope

- **Task 692** — the Q4 gate that fails when a `.module.css` consumes an `@theme` variable whose last Tailwind
  consumer disappears, extended per D19 to also assert the dual declarations stay in sync. Own blast radius.
- **Task 691** — `MantineListingCardPattern` (28) + `ListingCard` (8) de-Tailwind, unblocked by this task.
- **Task 689** — the project-wide section-heading `fz` rem triple.
- **Removing `bg-black/10` from `dialog.tsx`/`sheet.tsx` as a deliverable**, or de-Tailwinding any overlay consumer
  (A4). I5's plant on those two lines is temporary, fully reverted, and must not appear in the final diff.
- **Re-applying D18** in any form, including "move it back later" comments (A2).
- **Editing the module, the eight `CITY_GRADIENTS` rules, or the `:focus-visible` ring.**
- **Creating any test** (A7). **Any mutating Git command.**

---

## 9. Current and required behavior

**Current (Task 690's blocked state).** `--overlay`/`--overlay-foreground` are declared only in `:root`, so they
emit unconditionally — F1's goal — but Tailwind can no longer composite the alpha for opacity-modifier utilities, and
every `bg-overlay/N` and `text-overlay-foreground/N` static fallback has degraded to a bare, fully opaque
`var(--overlay)`. The `color-mix()` tier still wins wherever it is supported, so the defect is invisible to the
Chromium QA harness and visible only in browsers lacking `color-mix()`, where card and avatar overlays render as
solid black over the photo. The scrim swap to `var(--overlay)` is in place and correct.

**Required after.** The two variables are declared in **both** blocks. Tailwind sees the `@theme` copy and restores
every composited fallback byte-for-byte; the `:root` copy guarantees the variables exist even with zero Tailwind
consumers, closing F1 for the scrim and for `LightboxView`/`MantineListingGalleryPattern`'s pre-existing latent
fault. Both comments explain the duplication and its sync obligation. Every rendered surface is unchanged: identical
computed values, identical verdicts, any md5 motion bounded at 1/255, `check:design-tokens` still 43.

---

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim and reconcile against §3.2's
four entries **plus** this task's own session log if the first attempt already wrote one. Verify the md5 witnesses.
`git log -1 --oneline`; confirm `a9934c037` is an ancestor. Any unexplained path or witness mismatch →
**stop and report** (A5).

**Resume protocol (D20).** If the tree already carries the I2 dual-declaration edit from this task's first attempt —
i.e. `globals.css` declares `--overlay`/`--overlay-foreground` in **both** `@theme inline` and `:root` — then
**I2 is done and I0–I4 are not re-run**. Confirm that state by inspection, quote the two blocks, and re-confirm I3
cheaply with one `rm -rf .next && npm run build` + selector diff, then **go straight to I5**. If the tree does not
carry it, execute I1–I4 as written. Record which branch you took.

**I1 — baseline gates on the current (dirty) tree.** Record actual output for `npm run check:design-tokens`
(expect **43 / 0 stale**), `npm run check:stories` (15 checks, 127 files, 0), `npm run check:story-coverage` (15/15),
`npm run check:i18n` (2215×4). Confirm `.screenshots/task690-delta/overlay-selectors-before.txt` and
`computed-before.json` exist and are readable; quote their line/entry counts. Do **not** regenerate them.

**I2 — make the change.** Add the two declarations to `@theme inline` immediately above `--color-overlay`
(R1); keep the `:root` pair (R2); rewrite both comments (R4). No other edit.

**I3 — restore-proof (R3, the AC1 gate).** `rm -rf .next && npm run build`, then regenerate the selector set with the
**same command Task 690 used**:

```
grep -ho "\.\(bg\|text\|border\)-overlay[^{]*{[^}]*}" .next/static/css/*.css | sort -u \
  > .screenshots/task693-delta/overlay-selectors-after.txt
diff .screenshots/task690-delta/overlay-selectors-before.txt \
     .screenshots/task693-delta/overlay-selectors-after.txt
```

**Required: the diff is empty.** Quote the result. Non-empty → **stop and report** (A2). Use a clean `.next` so the
result cannot be a caching artifact, exactly as Task 690 did.

**I4 — computed-style proof (R7).** `npm run build-storybook`, then re-run Task 690's harness
(`.screenshots/task690-delta/capture-computed-styles.mjs`) in `after` mode against `computed-before.json`, persisting
`computed-after.json` and `computed-diff.json` under `.screenshots/task693-delta/`. Capture at `en` / `desktop-1024`:
the `PopularLocationsView` scrim `backgroundImage`; the `LightboxView` backdrop `backgroundColor` and a
`text-overlay-foreground` node's `color`; a `ListingCardPattern` `bg-overlay/60` node's `backgroundColor`; and the
resolved `--overlay` / `--overlay-foreground` off `document.documentElement`. **Required: zero differing
properties**, and the scrim equal to §3.7's string.

**I5 — planted-negative control on `--color-black` (R5, the objective proof; rewritten by D20).**

Read §3.8 before starting. The previous version of this step used the **overlay pair** as its subject and was
therefore incapable of failing; it is superseded. The subject is now `--color-black`, which §3.8 establishes has
exactly one class of lifeline. Four steps, in order, each with its own clean build and recorded result:

1. **Unplanted reference.** `rm -rf .next && npm run build`; then
   `grep -ho -- "--color-black:[^;]*" .next/static/css/*.css | sort -u`.
   **Required: `--color-black:#000` is present.** Quote the output. This is the positive arm — without it the
   negative arm proves nothing.
2. **Plant.** Temporarily remove the `bg-black/10` token from `src/components/ui/dialog.tsx:35` and
   `src/components/ui/sheet.tsx:32` — those two occurrences only, file edits, **no git**. Quote both before/after
   lines. Change nothing else in either file.
3. **Prove the risk was real.** `rm -rf .next && npm run build`; re-run the same grep.
   **Required: `--color-black` is ABSENT.** Quote the output. If it is still present, then usage-contingent emission
   does not apply to this token, Task 688 finding F1 is disproven, and the entire 690→693 line rests on a phantom —
   **stop and report** rather than proceeding (A3).
4. **Restore and prove no drift.** Revert both files verbatim. Then: `git diff --stat` must list **only** the paths
   in §3.2 plus this task's records — `dialog.tsx` and `sheet.tsx` must be **absent** from it; re-verify the two
   surviving md5 witnesses from §3.2 (`PopularLocationsView.module.css` = `b721ecf9284f23a026d097b4012bdea4`; record
   `globals.css`'s post-I2 value at I2 and re-verify it here); `npm run typecheck` exit 0; and a final
   `rm -rf .next && npm run build` re-confirming **I3's selector diff is still empty**. Quote all four.

**No file in A4's list other than `dialog.tsx` and `sheet.tsx` may be touched, even diagnostically.** In particular
the six `var(--color-overlay*)` sites in `LightboxView.tsx` / `MantineListingGalleryPattern.tsx` stay untouched:
§3.8 already explains their effect analytically, so no experiment needs them.

**I6 — rendered proof (R8).** `npm run build-storybook` (fresh, post-restore), then
`npm run screenshots:assert -- --mantine-only` compared against `.screenshots/rendered-assert/2026-07-29T20-43/`
using Task 688's `compare-manifests.mjs`:

1. All 1184 cells: **0 FAIL, 0 verdict changes**.
2. For **every** md5-changed cell, a pixel-level diff (Task 688's `pixel-diff.mjs`) reporting diff-pixel count, total
   pixels and **max channel delta**. Bound: **≤ 1/255**. Above it → **stop and report**. Scan the full changed set,
   never a sample (Task 688 review F4).
3. Persist under `.screenshots/task693-delta/`. An **empty** changed set is a pass — record "0 changed cells"
   explicitly rather than omitting the table.

**I7 — token and gate checks (R9, R10).** `npm run check:design-tokens` — expect **43 / 0 stale**, module at **0**;
quote the per-file section. Then `npm run typecheck`, `npm run check:stories`, `npm run check:story-coverage`,
`npm run check:i18n`, `npx vitest run`. For vitest: the documented full-run-only timeout set is
`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`, and **which two of the three time out varies by
run** (Task 688 review F8) — report the pair you actually observe plus an isolated re-run of exactly those files.

**I8 — `npm run build` runs last** and must exit 0. Quote the transcript tail **including the route table**. Then
re-verify the module's md5 against §3.2 (R6).

**I9 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then `check:file-integrity` and `check:mojibake` **after** the records exist;
quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9.

---

## 11. Positive and negative flows

### Positive flow

A visitor on any browser loads the homepage: the photo scrim renders identically. On a `color-mix()` browser the
overlay chips, lightbox backdrop and gallery captions resolve through the `color-mix()` tier exactly as today. On a
browser **without** `color-mix()` they now resolve through a correctly composited hex fallback again — 30% black
stays 30% black, not solid. **Every observation is identical to the pre-690 baseline**, proven by AC1's empty
selector diff and AC5's empty computed diff.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Static fallback tier (no `color-mix()`)** | **Yes** | §3.3 | Composited hex restored byte-for-byte | AC1 |
| **`color-mix()` tier** | **Yes** | §3.3 | Unchanged; still emitted second and still wins | AC1, AC5 |
| **All `overlay` utilities disappear** | **Yes** | F1, §3.4 | Variables still emitted from the `:root` copy — the objective. Not separately testable by plant, since the pair has two other lifelines (§3.8); it holds by construction, `:root` being outside `@theme` | AC1 |
| **The control cannot fail** | **Yes** | A3, §3.8, **D20** | Subject re-pointed to `--color-black`, which has a single lifeline; the unplanted arm must show it present and the planted arm absent | AC2 |
| **F1 was never real** | **Yes** | A3 | If `--color-black` survives the plant, stop — the 690→693 line rests on a phantom and must not be shipped on inertia | AC2 |
| **Duplicate declarations disagree** | **Yes** | D19 | Identical values today; comment states the sync obligation; Task 692 will gate it | AC3 |
| **Non-Tailwind `var(--color-overlay*)` consumers** | **Yes** | §3.6 | `LightboxView`, `MantineListingGalleryPattern` resolve unchanged, and are now robust | AC5 |
| **Scrim serialisation** | **Yes** | §3.7 | Byte-equal to the Task 688 measured string | AC5 |
| **Sub-pixel rasterisation (the D17 class)** | **Yes** | D17 | Tolerated only ≤1/255 with full-set attribution | AC6 |
| **Dark mode** | **Yes** | §3.5 | `.dark` defines no `--overlay`; tokens stay mode-invariant | AC1 |
| **Literal creeps into the module** | **Yes** | §3.7 | Detector flags `oklch(` in `.css`; count stays 43 | AC7 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | Overlay surfaces unchanged; `noHorizontalOverflow` true at 320/375/390 | AC6 |
| **All four locales** | **Yes** | cl. 7 | No string added or changed; zero new keys | AC6, AC8 |
| **Dirty start state mishandled** | **Yes** | §3.2, A5 | Four manifested entries with content witnesses; anything else stops | AC9 |
| Validation / authorization / RLS | No | No data path, write, or permission boundary touched | N/A | — |
| Critical-flow regression | No | No registry row for popular locations, lightbox, or gallery overlay | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1, R2, R3]** — *Given* the final `globals.css` and a clean-`.next` build, *then* both declarations appear
  inside `@theme inline` **and** in `:root` with byte-identical values, `--color-overlay*` appear only in `@theme`,
  and `diff .screenshots/task690-delta/overlay-selectors-before.txt .screenshots/task693-delta/overlay-selectors-after.txt`
  is **empty**. Quote the moved lines and the diff result.
- **AC2 [R5]** — *Given* I5's two clean builds, *then* (a) unplanted, the bundle emits `--color-black:#000`, and
  (b) with `bg-black/10` removed from `dialog.tsx:35` and `sheet.tsx:32`, the bundle emits **no** `--color-black`
  declaration at all. Quote both greps verbatim. Both arms are required — (a) alone shows nothing, and (b) alone
  cannot be distinguished from a broken build. *And* — *given* I5.4 — `dialog.tsx` and `sheet.tsx` are absent from
  `git diff --stat`, the module md5 is unchanged, `typecheck` is 0, and I3's selector diff is still empty.
- **AC3 [R4]** — *Given* the final `globals.css`, *then* neither comment claims the declarations live in only one
  block; both state why each copy exists, the sync obligation, and Task 693/D19/Task 692.
- **AC4 [R6]** — *Given* the final tree, *then* `PopularLocationsView.module.css`'s md5 is
  `b721ecf9284f23a026d097b4012bdea4` (unchanged) and `grep -rn 'color-black' src/` returns **0 hits**.
- **AC5 [R7]** — *Given* `computed-before.json` (Task 690's) and `computed-after.json`, *then* `computed-diff.json`
  is **empty** across every captured element and property, and the scrim's `backgroundImage` equals
  `linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)`.
- **AC6 [R8]** — *Given* a fresh `build-storybook` + `--mantine-only` run vs `2026-07-29T20-43`, *then* 1184 cells
  show **0 FAIL and 0 verdict changes**, and every md5-changed cell has a persisted pixel row with **max channel
  delta ≤ 1/255**. Quote the changed-cell count and the worst-case row (or "0 changed cells").
- **AC7 [R9]** — *Given* `npm run check:design-tokens`, *then* **43 raw + 0 stale-marker**, module absent from the
  violation list. Quote the per-file section.
- **AC8 [R10]** — `npm run build` exits 0 on a fresh transcript (quote the tail **including the route table**);
  `typecheck` 0, `check:stories` 0 (15/127), `check:story-coverage` 0 (15/15), `check:i18n` 0 at 2215×4 with zero new
  keys, `check:file-integrity`/`check:mojibake` 0 **after** the records exist (quote counts), `vitest` with no new
  failure beyond the documented run-varying pair.
- **AC9 [§3.2]** — *Given* I0 and I5.4, *then* the start snapshot matches §3.2's four entries with their witnesses,
  the final `git status --porcelain` adds only the new session log, and no consumer file from A4 appears in either.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`**, per `docs/qa-profiles.md` — same rationale as Task 690: two variables consumed by
eight files across listing, gallery, lightbox, admin and homepage surfaces, on manifest-enrolled primitives. It is
not `Q4`: no `docs/critical-flow-registry.md` row is touched and **no gate is being authored** — I5's planted control
proves a *property of this change*, not a new CI gate (that is Task 692). It is not `Q2`: the blast radius is
project-wide.

**Declared proof path.** `--mantine-only` over 67 enrolled stories / 1184 cells at 4 locales × 7 viewports
(320/375/390/1024/1200/1440/1536). Remaining canonical widths stay **Task 678's** scope.

**Coverage limitation to record, not fix:** the Chromium harness supports `color-mix()`, so **the rendered matrix
cannot see the fallback tier at all** — that is precisely how Task 690's defect stayed invisible. AC1's bundle-level
selector-set identity is the *only* evidence covering it, and the four non-enrolled consumers (§3.6). State this
plainly in the session log.

**TailAdmin side-by-side: not required.** No new visual value; cl. 16/16a satisfied by the equality proofs.

### 13.2 Worktree

**Starts dirty by design.** Complete the §3.2 manifest at I0 with content witnesses for all three modified paths;
re-verify after I5.4's restore. A fifth path or a witness mismatch → **stop and report**.

### 13.3 Gates

| Command | Expected |
|---|---|
| bundle `overlay` selector-set diff vs pre-690 baseline | **empty** (AC1) |
| I5.1 unplanted reference build | `--color-black:#000` **present** (AC2a) |
| I5.3 planted build (`bg-black/10` removed from `dialog.tsx`+`sheet.tsx`) | `--color-black` **absent** (AC2b) |
| I5.4 restore | `dialog.tsx`/`sheet.tsx` absent from `git diff --stat`; module md5 unchanged; `typecheck` 0; I3 selector diff still empty |
| computed-style before/after diff | **empty**; scrim matches §3.7 (AC5) |
| `npm run check:design-tokens` (before / after) | **43 / 0 stale** both times; module at 0 (AC7) |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 15 checks, 127 files |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4, zero new keys |
| `npm run build-storybook` | 0 (I4 and I6) |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes; every md5 delta ≤1/255 (AC6) |
| `npx vitest run` | no new failure; report the observed run-varying pair + isolated re-run |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I9** |
| `npm run build` | **0 — hard gate**, route table quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-30-task693-overlay-dual-declaration.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7 only, with the §3.2 dirty-start manifest and
   every content witness reconciled.
2. The I0 snapshot and the **true final** `git status --porcelain`, taken after the records are written.
3. R1–R10 mapped to AC1–AC9 with evidence.
4. The `globals.css` before/after excerpt showing **both** blocks with line numbers.
5. The selector-set diff vs the pre-690 baseline, quoted in full if non-empty, or stated empty.
6. **The I5 control, all four steps** (D20 subject = `--color-black`): the exact two-line plant on
   `dialog.tsx:35`/`sheet.tsx:32` with before/after lines, both greps quoted verbatim, and the I5.4 restore
   verification (`git diff --stat`, md5 witnesses, `typecheck`, re-confirmed empty selector diff). State explicitly
   whether the resume branch or the full I1–I4 branch was taken at I0.
7. `computed-after.json` / `computed-diff.json` paths, diff result and scrim string quoted.
8. The 1184-cell summary and the **full** per-cell pixel table for every md5-changed cell (or "0 changed cells").
9. The `check:design-tokens` before/after per-file sections (43 → 43).
10. Every command with its **actual** exit code; the `npm run build` tail quoted verbatim including the route table.
11. Deviations, each with a reason.
12. Limitations — at minimum: the 7-width proof path; **that the Chromium harness cannot see the fallback tier**
    (§13.1); the four non-enrolled consumers; the duplicated literal pending Task 692; and that Tasks 689, 691, 692
    are deferred per §8. `.screenshots/` is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_693_Task690_Revision_Overlay_Dual_Declaration.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, md5 witness, compiled selector, command and owner ruling is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC9 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, incl. all nine consumer files, the module, the gradients, the ring, and Task 690's session log |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 with not-Q4/not-Q2 reasons **and** the explicit statement that the rendered matrix cannot see the tier this task repairs; §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; no new value, every enrolled story renders the real component and needs no edit (cl. 16c) |
| Owner-only exceptions traceable | **Yes** — D6/D10/D17 standing, D18 recorded as **superseded**, D19 new (§3.1) |
| Baselines account for task-created artifacts | **Yes** — Task 690's `.screenshots/task690-delta/` artifacts are read-only inputs; `.screenshots/task693-delta/` is task-created with no prior baseline |
| Dirty-worktree handling | **Yes** — §3.2 manifests all four entries with md5 content witnesses, re-verified after I5.4's restore (§13.2, AC9) |
| Gates prove the changed behavior | **Yes** — a selector-set diff that must be *empty* against a **pre-existing, independently captured** baseline, plus a **two-armed planted control on a subject with a single lifeline** (`--color-black`, §3.8) whose unplanted arm must show presence and planted arm absence, plus the D17 pixel comparator and a falsifiable token count. The first revision failed this row: its control's subject was structurally immune (**M4**), which is why D20 re-pointed it |
| Single active owner route | **Yes** — forks are only stop conditions: I0's manifest mismatch, I3's non-empty diff, I5.2's missing variable, I5.3's control that cannot fail, I6's >1/255 |
| API claims verified, not assumed | **Yes** — §3.3 is a measured before/after table reproduced twice by the executor and re-derived by the reviewer; §3.5 quotes the real current file; §3.6 is a grep census; §3.7 cites persisted artifacts |

**Known-risk note for the reviewer.** Six likely defects. First, **duplicating `--color-overlay*` too** — those are
the Tailwind namespace entries and belong only in `@theme`; AC1's selector diff detects the damage. Second,
**deleting the `:root` copy** once the fallback returns, because it looks redundant — that copy *is* the F1 fix, and
§3.8 explains why no plant on the overlay pair can demonstrate its necessity. Third, **running only one arm of I5** —
the planted arm alone cannot be told apart from a broken build, and the unplanted arm alone shows nothing. Fourth,
**touching an A4 file other than `dialog.tsx`/`sheet.tsx`**, or leaving the plant behind; AC2's `git diff --stat`
clause and AC9's witnesses catch it. Fifth, **treating a green Q3 matrix as proof the fallback works** — §13.1 states
that the Chromium harness cannot see that tier, which is exactly how Task 690's regression reached review undetected.
Sixth, and the reason this task was amended: **accepting a control that cannot fail.** The first I5 used the overlay
pair, which has two lifelines a plant cannot remove, so `ABSENT` was unreachable by construction (**M4**). Before
accepting any planted-negative evidence here, verify the subject could actually have failed — that is the whole
point of AC2's paired arms.

---

## 16. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Overlay chips, fallback tier | `MantineListingCardPattern.tsx`, `ListingGallery.tsx`, `ImageUpload.tsx`, `AdminUserAvatar.tsx` | `.bg-overlay\/30\|50\|60` static rule | composited hex, **restored** | **repaired to baseline** | AC1 |
| Overlay chips, `color-mix()` tier | same | `@supports` rule | `color-mix(in oklab, var(--overlay) N%, transparent)` | **unchanged** | AC1, AC6 |
| Lightbox backdrop | `LightboxView.tsx:86` | inline `style` | `color-mix(in oklab, var(--color-overlay) 95%, transparent)` | **untouched; emission hardened** | AC5 |
| Lightbox caption / thumb border | `LightboxView.tsx:45-48`, `:159` | inline `style` | `var(--color-overlay-foreground)` | **untouched; emission hardened** | AC5 |
| Gallery caption | `MantineListingGalleryPattern.tsx:91` | `c=` prop | `var(--color-overlay-foreground)` | **untouched; emission hardened** | AC5 |
| Dev perf overlay | `PerfDevOverlay.tsx` | `bg-overlay/85`, `text-overlay-foreground/*` ×9, `border-overlay-foreground/20` | Tailwind utility | **untouched, dev-only, not enrolled** | AC1 |
| Homepage photo scrim | `PopularLocationsView.module.css` `.scrim` | `.scrim` | `var(--overlay)` (Task 690) | **retained unchanged** | AC4, AC5 |
| Fallback gradients ×8 / focus ring | same module | `.gradient0`–`.gradient7`, `.card:focus-visible` | `--primary`/`--brand-*`/`--badge-*`/`--ring`, already in `:root` | **out of scope, untouched** | §8 |
| Legacy shadcn scrims | `dialog.tsx:35`, `sheet.tsx:32` | `bg-black/10` | `var(--color-black)`, stays in `@theme` | **out of scope, untouched** | A8 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path |
|---|---|---|---|---|
| Overlay colour tokens | read `globals.css:22-60`, `:296-315`, `:412-428`; read Task 690's session log §1/§6 and both persisted selector sets; re-derived the before/after fallback table from `.next/static/css`; grepped the 33-utility / 8-file consumer census and the 6 non-Tailwind `var(--color-overlay*)` refs | `Mantine/Primitives/LightboxView`, `Patterns/Mantine/ListingCardPattern`, `Patterns/Mantine/ListingGalleryPattern`, `Mantine/Primitives/ListingCard`, `Mantine/Primitives/Avatar`, `Mantine/Primitives/PopularLocationsView` — all render real production components | **reuse** — no new token, no new value; only the declaration *sites* change | `--overlay`/`--overlay-foreground` declared in both `@theme inline` and `:root`; `--color-overlay*` remain `@theme`-only |
| Homepage photo scrim | read the module in full; read Task 688 §6's persisted computed capture | `Mantine/Primitives/PopularLocationsView` (`Default`, `LongCityName`), 56 cells | **retain** — Task 690's swap is correct and unmodified | `var(--overlay)` |

**Clause 16c note.** Every affected artifact has a canonical Mantine story rendering the real production component,
and **none requires an edit**: no prop, DOM shape or rendered pixel changes by design. Their enrolled cells are the
acceptance evidence for AC6 — with the §13.1 caveat that they cannot cover the fallback tier.

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 1 edited `src/` file | Only `globals.css` is edited; the module is retained byte-identical | §7, AC4, A4 | required |
| cl. 3/5 (capabilities and UX flows intact) | Overlay chrome across 8 files | Every overlay surface renders identically, in **both** cascade tiers | §11, AC1, AC5, AC6 | required |
| cl. 7 (four locales) | Rendered surfaces | Zero new keys; parity 2215×4; all 4 locales in the 1184-cell comparison | AC6, AC8 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table | AC8 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | `noHorizontalOverflow` true at 320/375/390 in all locales | AC6 | required |
| cl. 12 (rendered evidence follows risk) | Q3, colour plumbing on enrolled primitives | 0 verdict changes; every md5 delta ≤1/255; **plus** AC1 for the tier pixels cannot see | AC1, AC6 | required |
| cl. 13 (Storybook gates enforceable) | Story-rendered primitives | `check:stories` 0, `check:story-coverage` 15/15; canonical stories preserved | AC8, §17 | required |
| cl. 14 (file integrity) | 2 modified + 1 created text file | UTF-8 no BOM, no mojibake, scanned set includes the records | AC8 | required |
| cl. 15 (critical flows) | **No registry row** for popular locations, lightbox, or gallery overlay (grep-verified) | Not applicable — explicit negative, not silence | §3.6 | N/A, declared |
| cl. 16 (TailAdmin visual source) | Visual chrome in scope | No new value; equality proofs replace a side-by-side | AC1, AC5, §13.1 | required |
| cl. 16b (canonical provenance before code) | 9 visible artifacts mapped | Canonical search recorded; disposition `reuse`/`retain` for every one | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Migrated Mantine artifacts change token plumbing | Stories inspected, render the real components, need no edit; their cells are AC6 | §3.6, §17, AC6 | required |
| cl. 10 (git ownership) | Dirty start | §3.2 manifest with content witnesses; diff limited to §7; no mutating Git by the executor | A5, AC9, §14 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 693 (Task 690 revision) |
| Active route / owner decision | Single route: add `--overlay`/`--overlay-foreground` back into `@theme inline` while **keeping** Task 690's `:root` copies and its scrim swap, then prove (a) the bundle's `overlay` selector set returns byte-identical to the pre-690 baseline, and (b) via a two-armed planted control on **`--color-black`** — F1's actual subject and the only token in the tree with a single lifeline — that usage-contingent emission is real (owner **D19**, 2026-07-30, superseding **D18**, as amended by **D20** after the first `BLOCKED`; **D17** sets the pixel comparator; **D10** the verdict comparator; **D6** governs `.screenshots/`) |
| Decision source, date, scope | Owner, 2026-07-30, after Task 690 returned BLOCKED at its own I3/A2 stop; scope = 1 edited stylesheet + retained module + records; **no** consumer edit, **no** gate authoring, **no** ListingCard slice |
| Starting worktree mode | **Dirty by design** — §3.2's four-entry manifest with md5 content witnesses, re-verified after I5.4 |
| Producer of each checkpoint | I0 manifest + witnesses → baseline gates on the dirty tree → `@theme` re-declaration → clean build + **selector-set diff vs the pre-690 baseline** → storybook + **computed diff** → **two-sided planted control** (fix passes, pre-690 fails) → restore + drift re-verification → `--mantine-only` 1184-cell comparison + full pixel attribution → design-tokens 43 → typecheck/stories/coverage/i18n/vitest → build → records → post-records encoding gates |
| Persisted result | I0/final porcelain snapshots + md5 witnesses; `.screenshots/task693-delta/overlay-selectors-after.txt`, `computed-after.json`, `computed-diff.json`, the manifest comparison and full pixel table; both I5 grep outputs and the plant edit set; every gate transcript; build tail with route table; session log |
| Comparator | selector-set diff vs `overlay-selectors-before.txt` **empty**; **I5.1 `--color-black` present / I5.3 absent** (D20 subject); I5.4 restore leaves `dialog.tsx`/`sheet.tsx` out of `git diff --stat`; computed diff **empty** with the scrim byte-equal to §3.7; **1184** cells 0 FAIL / **0 verdict changes**; every md5-changed cell **≤ 1/255**; `design-tokens` **43 / 0 stale**, module 0; module md5 `b721ecf9284f23a026d097b4012bdea4`; `stories` 15/127/0; `story-coverage` 15/15; `i18n` 2215×4 |
| Failure path | I0 manifest/witness mismatch → stop; non-empty selector diff → stop, do not hand-write utilities or drop the `:root` copy (A2); **I5.1 `--color-black` absent → stop, the build or grep is wrong, not the premise; I5.3 `--color-black` still present → stop, F1 is disproven and the 690→693 line must not ship on inertia (A3)**; any verdict change or md5 delta >1/255 → stop; restore drift at I5.4, or any A4 file other than `dialog.tsx`/`sheet.tsx` touched → stop |
| Zero/empty input case | Two comparators succeed by being **empty** (the selector diff, the computed diff), so each persists its raw before/after inputs as the producer witness. The md5-changed cell set may legitimately be **empty** — a pass that must be recorded as "0 changed cells", never omitted. I5's plant may legitimately leave **zero** `overlay` utilities in the tree; that is the intended state of the control, not a broken build |
| Task-created artifacts in baselines | `.screenshots/task693-delta/` is task-created with no prior baseline. `.screenshots/task690-delta/overlay-selectors-before.txt` and `computed-before.json` are **read-only inputs captured before Task 690's edit** — they must not be regenerated, since a post-edit regeneration would silently make AC1 self-satisfying |
