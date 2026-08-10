# Task 694 — Brand single-source ΔE sync gate (Sprint 46.1)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_694_Brand_Single_Source_Delta_E_Sync_Gate.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit (`tasks/Sprints/Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md`), order **46.1**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-10, replacing 694's original overlay-alias scope (see §3.1 — that scope was measured unsafe and is now closed by **D35**)

---

## 1. Mode and task type

Implementation task. Type: **Docs / Governance** (a new machine-enforced gate) with a one-line **Legacy Tailwind
Styling Governance** touch (a CSS *comment* correction in `src/app/globals.css`).

Not a UI task. No rendered colour, layout, spacing or typography changes. The single product-file edit is a comment
whose text is wrong; the declared `oklch()` value beside it is **not** touched, so the compiled CSS output is
byte-identical apart from the comment characters themselves.

---

## 2. Objective

Task 661 made `src/design-system/brand.ts` the one authored brand-colour source and left a written note that
"editing this tuple is the single knob". Nothing enforces it. The 661 review spawned a ΔE sync-check as a follow-up
on 2026-07-23; it went unfiled for sixteen days and was attached to 694 as a rider on 2026-08-08.

**Deliver that gate.** After this task, the brand single source is machine-enforced: `theme.ts` must consume
`brand.ts` by import rather than by a re-authored literal, every documented hex in the brand chain must be
colour-identical to its tuple stop measured in **CIEDE2000**, and the alias index mapping in `globals.css` must be
correct and complete. The gate reports drift as a perceptual magnitude, so a failure distinguishes a one-character
typo from the real 2026-07-23 `#D25656` regression.

Secondary, and small: correct the one measured drift the preflight found inside the brand namespace
(`--brand-950`, ΔE00 **3.645**), so the gate ships green with no exemption for a value that is simply mis-documented.

---

## 3. Verified context

Every fact below was re-derived from the repository on **2026-08-10** at `bbf94e2ee`
(`task/q0-ci-rendered-locale-split`, worktree clean). Commands are named so the executor can reproduce each one.

### 3.1 Why 694's original scope is gone — read this before anything else

694 was reserved as *"alias `--overlay`/`--overlay-foreground` → `var(--mantine-color-black/white)` per the 660/661
convention"*. **That change is unsafe and is not part of this task.** The measurement, taken on the repository's own
`tailwindcss@4.3.0`:

| Variant | Emitted for `bg-overlay/30` |
|---|---|
| Today — `--overlay: oklch(0 0 0)` in `@theme inline` | `.bg-overlay\/30{background-color:#0000004d}` + the `@supports` `color-mix()` rule |
| 694-as-written — `--overlay: var(--mantine-color-black)` | `.bg-overlay,.bg-overlay\/30{background-color:var(--overlay)}` + the `@supports` rule |

Variant B reproduces **Task 690's regression exactly**, including the compound-selector collapse recorded at
`docs/sessions/2026-07-30-task690-overlay-root-relocation.md:23`. Tailwind can only composite the alpha-blended
static-fallback tier by statically resolving the value, and `--mantine-color-black` is emitted by Mantine's
stylesheet, which Tailwind never reads. **12** opacity-modifier utilities are affected in the live build
(`bg-overlay/30,50,60,70,85,95` · `text-overlay-foreground/40,50,60,70,80` · `border-overlay-foreground/20`).

The 660/661 precedent does not transfer: `--brand-*: var(--mantine-color-brand-*)` lives at `globals.css:356-365`
inside **`:root`, never inside `@theme`**, and the built CSS contains **zero** `bg/text/border-brand-*/NN` utilities.
The convention has never once been applied to a token consumed with an opacity modifier. Recorded as **D35**
(`docs/backlog.md` → Standing notes). The overlay pair keeps its literal values; 695 remains their only exit.

### 3.2 The brand chain as it exists today

| Link | Evidence |
|---|---|
| `src/design-system/brand.ts:13-24` | the 10-stop `MantineColorsTuple`, the only authored brand hexes in the repo |
| `src/design-system/brand.ts:26-27` | `BRAND_PRIMARY = brand[7]`, `BRAND_HOVER = brand[8]` |
| `src/design-system/mantine/theme.ts:2` | `import { brand } from '@/design-system/brand'` |
| `src/design-system/mantine/theme.ts:158` | `colors: { brand, gray, green, yellow, red, blueLight, purple, sale, orange }` — object shorthand, no re-authored literal |
| `src/app/globals.css:356-365` | 10 alias rows, `--brand-{50,100,…,900}: var(--mantine-color-brand-{0..9})`, each with a trailing hex comment |
| `src/app/globals.css:407` | `--accent: var(--mantine-color-brand-0); /* #FDEEED — very subtle red tint */` |
| `src/modules/notifications/lib/emails/BaseEmail.tsx:25,27-28` | `import { BRAND_PRIMARY, BRAND_HOVER }`, re-exported as `BRAND_ACCENT`/`BRAND_AA` |
| `src/modules/notifications/lib/emails/BaseEmail.tsx:7-9` | header comment asserting `BRAND_ACCENT = BRAND_PRIMARY (#EC5447)`, `BRAND_AA = BRAND_HOVER (#BD4339)` |

`grep -rniE "#(FDEEED|FBDDDA|F9CCC8|F7BBB5|F6AAA3|F2877E|F0766C|EC5447|BD4339|8E322B)" src/ scripts/ .storybook/` returns
**no live re-authoring** — every hit outside `brand.ts` is a comment. The chain is intact today; the gate protects it,
it does not repair it.

### 3.3 Measured ΔE00 — the numbers this task's thresholds come from

Computed with oklch → sRGB → XYZ(D65) → CIE Lab → CIEDE2000. The implementation was validated against the Sharma et
al. reference set (6/6 exact to 4 dp) and against five sRGB anchors (`oklch(1 0 0)`→`#FFFFFF`, `oklch(0 0 0)`→
`#000000`, and the three primaries), all exact, plus a proven `#180807` round trip.

| Pair | ΔE00 |
|---|---:|
| all 10 of `globals.css:356-365` comment hexes vs their `brand[N]` stop | **0.0000** |
| `globals.css:407` `--accent` comment `#FDEEED` vs `brand[0]` | **0.0000** |
| `BaseEmail.tsx:8` `#EC5447` vs `brand[7]` · `#BD4339` vs `brand[8]` | **0.0000** |
| **`globals.css:371` `--brand-950: oklch(0.132 0.022 23)` vs its comment `#180807`** | **3.6446** ⚠ |
| `#EC5447` vs `#D25656` — the drift 661 actually removed | **6.8074** |
| `#EC5447` vs `#ED5447` — a one-step hex typo | **0.1838** |

`oklch(0.132 0.022 23)` computes to **`#0F0504`**. `#180807` is `oklch(0.1599 0.0292 25.25)`. The rendered colour is
and always was the `oklch()` value; **the comment is what is wrong**, in two places — the block comment at
`globals.css:369` and the trailing comment at `globals.css:371`.

Because every in-scope pair measures exactly `0.0000`, the gate's tolerance is **0**. ΔE is not the threshold here;
it is the *reporting unit*, and it is required rather than decorative because the comparison spans two colour spaces
(`oklch()` declarations vs hex comments vs the hex tuple) — a string compare cannot express that pair at all.

### 3.4 Out of scope, but now measured — do not fix these here

Scanning every `--x: oklch(…); /* …#HEX… */` row in `globals.css` (13 rows) found **11 with ΔE00 > 1.0**:

| line | token | declared | computes | comment | ΔE00 |
|---:|---|---|---|---|---:|
| 423 | `--badge-new` | `oklch(0.527 0.173 150)` | `#00842C` | `#16A34A` | 10.820 |
| 381 | `--neutral-600` | `oklch(0.437 0 0)` | `#525252` | `#6E6E6E` | 10.260 |
| 382 | `--neutral-700` | `oklch(0.320 0 0)` | `#333333` | `#515151` | 9.963 |
| 380 | `--neutral-500` | `oklch(0.556 0 0)` | `#737373` | `#8C8C8C` | 9.523 |
| 383 | `--neutral-900` | `oklch(0.145 0 0)` | `#0A0A0A` | `#232323` | 6.760 |
| 480 | `--neutral-0` | `oklch(0.145 0 0)` | `#0A0A0A` | `#232323` | 6.760 |
| 379 | `--neutral-400` | `oklch(0.708 0 0)` | `#A1A1A1` | `#B5B5B5` | 5.755 |
| 424 | `--badge-premium` | `oklch(0.700 0.162 65)` | `#E18500` | `#D97706` | 4.834 |
| 378 | `--neutral-300` | `oklch(0.872 0 0)` | `#D5D5D5` | `#DEDEDE` | 2.065 |
| 377 | `--neutral-200` | `oklch(0.922 0 0)` | `#E5E5E5` | `#EBEBEB` | 1.296 |
| 376 | `--neutral-100` | `oklch(0.961 0 0)` | `#F2F2F2` | `#F5F5F5` | 0.619 |

These are the **neutral and badge** namespaces, not the brand chain, and they are documentation drift with no
rendered consequence — the `oklch()` value is what ships.

**They already have an owner: Task 676 (Sprint 57), "stale hex comments in `src/app/globals.css`".** 676's plan
requires classifying all 36 six-digit hex occurrences in the file as live value / token-backed comment / stale
comment before deleting any, and removing only the third class. The table above is a **measured input to that
classification**, not a new number, and no number is reserved here.

**The boundary between 694 and 676 is one row.** `--brand-950` (line 371) belongs to **694**, because assertion D
cannot ship green while it is wrong and it sits inside the brand namespace the gate asserts on. **676 must not
re-touch `--brand-950`.** The other ten rows in the table are 676's alone and must not be touched by this task —
widening 694 to them turns a gate task into an 11-row remediation with its own blast radius.

### 3.5 Where the gate must live, and where it must not

- **`scripts/check-design-tokens.mjs` cannot host it.** Its own header states it excludes
  `src/app/globals.css (the token source of truth — excluded entirely)`.
- **`scripts/__tests__/` is the established host for this gate class.** Task 692's
  `scripts/__tests__/overlay-dual-declaration.test.ts` is the direct precedent: a vitest file, `// @vitest-environment
  node`, collected by the default globs, with **no** `package.json` script, no `vitest.config.ts` change and no
  `.github/` change. All 8 existing files in that directory carry the same pragma. Match it.
- **No colour library is available.** `package.json` has no `culori`/`colorjs.io`/`chroma-js`/`colord`/`d3-color`.
  `color-convert@2.0.1` exists only transitively and supports neither `oklch` nor CIEDE2000. **Do not add a
  dependency** — the maths is ~80 lines and is specified in §10.3.
- `vitest.config.ts` aliases `@` → `./src`, so the test can import `@/design-system/brand` and
  `@/design-system/mantine/theme` directly. Verified on this machine: `import('@mantine/core')` resolves in bare node
  and `createTheme` is a `function`, so `theme.ts` is importable under the `node` environment.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | 661 review rider | A gate fails when `theme.ts` stops consuming `brand.ts`'s exported tuple | P0 | Plant P4 | Confirmed |
| R2 | 661 review rider | A gate fails when any documented brand hex drifts from its `brand[N]` stop, measured in ΔE00 | P0 | Plants P1, P2 | Confirmed |
| R3 | §3.2 | A gate fails when the `globals.css` alias index mapping is wrong, incomplete, or reordered | P0 | Plant P3 | Confirmed |
| R4 | §3.3 | The `--brand-950` comment states the colour its `oklch()` actually renders | P1 | AC5 + recomputed ΔE00 = 0 | Confirmed |
| R5 | 724 F2 corollary | The `--brand-950` exemption is a *declared* exemption the gate reads, not silence | P1 | Plant P5 | Confirmed |
| R6 | M1/M2/M4/M5 failure mode | The gate's own colour conversion is self-validating and demonstrably fails when broken | P0 | Plant P7 | Confirmed |
| R7 | §3.3 | Value-only comparison: rewording a comment without changing its hex must **not** fail | P1 | Control P6 | Confirmed |
| R8 | §3.5 | Zero dependency additions; no `package.json`, `vitest.config.ts` or `.github/` change | P0 | `git status --porcelain` | Confirmed |
| R9 | D28 / §1 | Zero rendered delta — the only product edit is comment text | P0 | AC6 + build | Confirmed |
| R10 | Backlog rules | Concise `docs/backlog.md` state update + a full session log | P1 | AC8 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** The gate asserts on *documentation* hexes (comments). That is deliberate: 661's failure mode was a value
  silently drifting away from a written claim, and the written claim is exactly what nothing checks. A comment that
  lies is the early-warning surface — §3.4 proves comments in this file do drift, 11 times over.
- **A2.** Tolerance is `0`, not a perceptual threshold. Justification is measured, §3.3. **A future intentional
  non-zero pair must be added to a named allowlist with a written reason — never by raising the tolerance.** The
  allowlist lives in the test file, so widening it is visible in review and cannot be produced by product code
  (the 724 F2 lesson: an exemption an author applies in the gate is reviewable; one product code can synthesise
  is not).
- **OQ1 — none open.** The two decisions this task would otherwise have carried are closed: the overlay alias by
  **D35**, and the neutral/badge comment drift by its existing owner **Task 676** (Sprint 57), with the one-row
  `--brand-950` boundary written into §3.4 and mirrored in `docs/backlog.md`'s 676 row.

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — **no** entry is affected; state that in the report).

Task bundle (Docs / Governance): `docs/orchestrator-procedures.md` → *"A documented token is not an implemented
token — grep the definition, never the table"* · `docs/ai-behavior.md` Notes 18–23 · `docs/governance-enforcement.md`.

Task-specific, required:

- `scripts/__tests__/overlay-dual-declaration.test.ts` — the structural precedent to match.
- `src/design-system/brand.ts`, `src/design-system/mantine/theme.ts:1-3,154-159`, `src/app/globals.css:356-372,407`,
  `src/modules/notifications/lib/emails/BaseEmail.tsx:1-30`.
- `docs/backlog-archive.md` → the Task 661 row (rider provenance and the `#D25656` history).

Do **not** read the full `docs/design-system.md`, the Mantine responsive bundle, or the TailAdmin reference. No UI
surface is in scope.

---

## 7. Scope

| Path | Action |
|---|---|
| `scripts/__tests__/brand-single-source.test.ts` | **create** — the gate |
| `src/app/globals.css` | **modify** — comment text only, lines 369 and 371, `#180807` → `#0F0504` (2 occurrences) |
| `docs/backlog.md` | **modify** — concise state update per R10 |
| `docs/sessions/2026-08-10-task694-brand-single-source-delta-e-gate.md` | **create** — session log |

---

## 8. Out of scope

- **The overlay alias.** Closed by D35 (§3.1). Do not touch `--overlay`/`--overlay-foreground` or either of their
  declaration blocks.
- **The 10 remaining neutral/badge comment drifts** in §3.4 — owned by **Task 676**, Sprint 57. `--brand-950` is
  the one row of that census that belongs here, for the reason §3.4 states.
- Any change to the `oklch()` *values* in `globals.css`. Comment text only.
- Adding a colour dependency, a `package.json` script, a `vitest.config.ts` entry or a CI job. The gate runs inside
  the existing `npx vitest run` collection, exactly like 692's.
- `scripts/check-design-tokens.mjs` and its allowlist.
- The `--brand-850` removal note at `globals.css:366-367` — historical, no live token.

---

## 9. Current and required behavior

**Current.** `brand.ts` is the single authored source by convention and comment only. `theme.ts` could be edited to
inline a literal tuple, an alias row could be repointed to the wrong Mantine index, or any documented hex could drift,
and nothing in `lint`, `typecheck`, `build`, `check:design-tokens` or the vitest suite would notice. `--brand-950`
already carries a comment that is wrong by ΔE00 3.645 and has done so undetected since 661.

**Required.** All of the above fail a named test with a message that states the file, the token, both values and the
measured ΔE00. `--brand-950`'s comment matches what it renders. Nothing about the rendered application changes.

---

## 10. Implementation requirements

### 10.1 File and shape

Create `scripts/__tests__/brand-single-source.test.ts`, opening with `// @vitest-environment node` and a header
comment that names Task 694, Task 661 (provenance), the `#D25656` drift it exists to prevent, **D35** (why the
overlay pair is *not* on this gate), and the §3.4 / Task 676 boundary — including the one-row exception that
`--brand-950` is 694's and the other ten are 676's. Follow 692's header style.

### 10.2 Extraction rules

- Locate the `:root` block by `indexOf(':root {')` + brace-depth counting, never by line number — 692 A2. Line
  numbers in this file have moved twice already; the backlog's own 694 row carried stale ones for nine days.
- Parse alias rows with a regex anchored on the declaration, capturing the token name, the `--mantine-color-brand-N`
  index, and the trailing comment's first `#RRGGBB`.

### 10.3 The colour maths — self-contained, and self-validating

Implement, in the test file, with no dependency:

1. `oklch(L C H)` → OKLab → LMS → linear sRGB → gamma-encoded sRGB, clamped, rounded to 8-bit.
2. sRGB → XYZ (D65) → CIE Lab (D65 white point `0.95047, 1.0, 1.08883`).
3. CIEDE2000.

**R6 is the point of this section.** Add a first `it()` block that validates the maths *before* any project value is
compared, and that fails if a single coefficient is wrong:

- The Sharma et al. CIEDE2000 reference pairs, asserted to 4 dp. These six are verified correct against this
  implementation: `(50, 2.6772, −79.7751)`/`(50, 0, −82.7485)` → **2.0425** · `(50, 3.1571, −77.2803)`/same →
  **2.8615** · `(50, 2.8361, −74.0200)`/same → **3.4412** · `(50, −1.3802, −84.2814)`/same → **1.0000** ·
  `(60.2574, −34.0099, 36.2677)`/`(60.4626, −34.1751, 39.4387)` → **1.2644** ·
  `(22.7233, 20.0904, −46.6940)`/`(23.0331, 14.9730, −42.5619)` → **2.0373**.
- The oklch → sRGB anchors, asserted exact: `oklch(1 0 0)` → `#FFFFFF`, `oklch(0 0 0)` → `#000000`,
  `oklch(0.628 0.2577 29.23)` → `#FF0000`, `oklch(0.8664 0.2948 142.4953)` → `#00FF00`,
  `oklch(0.452 0.3132 264.052)` → `#0000FF`.

A gate whose comparator silently returns 0 for everything is the exact failure mode M1/M2/M4/M5 names. This block is
the control that detects it.

### 10.4 Assertions

| ID | Assertion |
|---|---|
| **A** | `theme.ts`'s `theme.colors.brand` is the **same array identity** as `brand.ts`'s exported `brand` (import both; `toBe`, not `toEqual`). A re-authored literal tuple with identical values must still fail — identity is the invariant, equality is not. |
| **B** | `globals.css`'s `:root` declares exactly **10** `--brand-{50,100,200,…,900}` rows, each `var(--mantine-color-brand-N)` with `N` ascending `0..9` and matching its position; each row's comment hex has ΔE00 **= 0** against `brand[N]`. |
| **C** | `--accent`'s declaration is `var(--mantine-color-brand-0)` and its comment hex has ΔE00 **= 0** against `brand[0]`. |
| **D** | `--brand-950`'s `oklch()` value, converted to sRGB, has ΔE00 **= 0** against its own trailing comment hex, **and** against the hex inside the block comment above it. Both sites, independently. |
| **E** | `BaseEmail.tsx` still imports `BRAND_PRIMARY`/`BRAND_HOVER` from `@/design-system/brand`, and the two hexes in its header comment have ΔE00 **= 0** against `brand[7]`/`brand[8]`. |
| **F** | The `--brand-950` block comment still contains its declared exemption — the literal substring `intentionally NOT tuple-derived` **and** a `Task 661` reference. Deleting the exemption must fail, so the row cannot silently become an undocumented hand-authored value. |

Every failure message must name the absolute file path, the token, both values, and the measured ΔE00 to 4 dp — the
magnitude is what tells a reviewer whether they are looking at a typo (0.18) or the `#D25656` class of regression
(6.81).

Define `const DELTA_E_TOLERANCE = 0` with an inline comment carrying §3.3's justification and A2's rule.

### 10.5 The product edit

In `src/app/globals.css`, replace `#180807` with `#0F0504` at **both** sites — the block comment (line 369 at
`bbf94e2ee`) and the trailing comment (line 371). Nothing else on those lines changes, and
`--brand-950: oklch(0.132 0.022 23);` is untouched. Re-locate both by string search, not by line number.

---

## 11. Positive and negative flows

**Positive flow.** On a clean tree, `npx vitest run scripts/__tests__/brand-single-source.test.ts` passes every
`it()` block, including the §10.3 self-validation, with the `--brand-950` comment corrected.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form, action or schema is touched | N/A | — |
| Authorization/RLS | **No** | No route, action or table is touched | N/A | — |
| Offline/network | **No** | The gate reads the filesystem only | N/A | — |
| Concurrent writer | **No** | No data model is touched | N/A | — |
| **Gate false-negative** | **Yes** | This task authors a gate | Every plant in §13.2 fails; the control does not | Verbatim transcripts |
| **Gate self-blindness** | **Yes** | M1/M2/M4/M5 | Breaking the conversion fails §10.3's block | Plant P7 |
| **Rendered regression** | **Yes** | `globals.css` is a product file | Comment-only edit ⇒ no compiled-CSS delta beyond comment characters | AC6 |

---

## 12. Acceptance criteria

- **AC1 [R1, R2, R3, R5, R7]** — *Given* the clean tree with §10.5 applied, *when*
  `npx vitest run scripts/__tests__/brand-single-source.test.ts` runs, *then* it exits 0 with every `it()` passing,
  and the transcript is quoted verbatim.
- **AC2 [R6]** — *Given* one coefficient in the oklch → sRGB matrix is altered, *when* the file runs, *then* the
  §10.3 self-validation block fails **before** any project assertion, and the verbatim failure is recorded.
- **AC3 [R1, R2, R3, R5]** — *Given* each of plants P1–P5 applied one at a time, *when* the file runs, *then* the
  named assertion fails, the message contains the expected ΔE00 to 4 dp (P1 ⇒ `6.8074`, P2 ⇒ `0.1838`), and the
  planted file is restored with a matching md5 before the next plant.
- **AC4 [R7]** — *Given* control P6 (a comment reworded, hex unchanged), *when* the file runs, *then* it still
  passes. A gate that fails here is a string check, not a colour check, and must be reworked before review.
- **AC5 [R4]** — *Given* the corrected comments, *when* the `--brand-950` assertion runs, *then* the measured ΔE00
  is `0.0000` at both sites, and the report states the pre-edit value `3.6446` alongside it.
- **AC6 [R9]** — *Given* the `globals.css` edit, *when* `git diff -- src/app/globals.css` is inspected, *then* the
  only changed characters are inside CSS comments, and `npm run build` exits 0.
- **AC7 [R8]** — *Given* the final `git status --porcelain`, *then* no `package.json`, `vitest.config.ts` or
  `.github/` path appears, and the new test file was collected by `npx vitest run` without being named on the
  command line.
- **AC8 [R10]** — *Given* the work is complete, *then* `docs/backlog.md` carries a concise state update and the
  session log at the §7 path contains every transcript this document requires.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, per `docs/qa-profiles.md`, selected for exactly one reason: *"planted-violation
failure proof when a gate is claimed."* This mirrors Task 692's selection and rationale.

It is **not** Q4 for blast radius, and the visual axis is deliberately downgraded to none: the only product-file
change is comment text, so there is no rendered surface to photograph. No entry in `docs/critical-flow-registry.md`
is affected — confirm that explicitly in the report rather than leaving it unstated.

### 13.2 Planted controls — all seven, each restored with an md5 witness

Take an md5 of every file before its first plant and after its restore. A plant that is not shown failing has not
been run.

| ID | Plant | Must fail | Expected in the message |
|---|---|---|---|
| **P1** | `brand.ts` `#EC5447` → `#D25656` | ~~B, C, E~~ → **B, E** | ΔE00 `6.8074` |

> **Correction, 2026-08-10 (review).** P1's row originally read "B, C, E". **Assertion C compares `--accent`'s
> comment against `brand[0]`; P1 edits `brand[7]`, so C structurally cannot fire.** The executor measured B + E,
> recorded the discrepancy, and correctly did **not** widen C to react to an unrelated index. Reviewer reproduced
> B + E independently. Recorded as the sixth entry in the kickoff-fact corollary chain (`docs/backlog.md` →
> Standing notes) and the first authored by the orchestrator in the same session that executed it. **A plant
> matrix must state which assertion consumes which input, not merely which assertions exist.**
| **P2** | one alias comment `#EC5447` → `#ED5447` | B | ΔE00 `0.1838` |
| **P3** | `--brand-700: var(--mantine-color-brand-8)` | B | index mapping, not a ΔE |
| **P4** | `theme.ts` `colors: { brand, … }` → an inline literal tuple with **identical values** | A | identity, not equality |
| **P5** | delete `intentionally NOT tuple-derived` from the `--brand-950` block comment | F | the missing exemption |
| **P6** | *control* — reword an alias comment, hex unchanged | **must still pass** | — |
| **P7** | alter one oklch → sRGB coefficient | §10.3 self-validation | a reference-pair mismatch |

### 13.3 Commands — record the actual result of each

1. `git status --porcelain` at I0, and `git show HEAD:docs/backlog.md | wc -l` for the backlog baseline **before**
   any edit (the 717/721/722 corollary — three consecutive executors measured this after their own edit).
2. `md5sum` witnesses for `src/app/globals.css`, `src/design-system/brand.ts`,
   `src/design-system/mantine/theme.ts`, `src/modules/notifications/lib/emails/BaseEmail.tsx` at I0 and at the end.
3. `npx vitest run` — full suite, before and after, with file and test counts. **Known, not a regression:** the
   full-run-only 5000 ms timeout trio `date-format-ssr-parity` / `RangeDatePicker` / `saveSavedSearch.dedup`
   documented in Task 692's log §4.1. If any of them appears, re-run that file in isolation and report both results.
   Do not report a run you did not observe (661 P2).
4. `npx vitest run scripts/__tests__/brand-single-source.test.ts` — clean, and once per plant.
5. `npm run typecheck` — exit 0.
6. `npm run check:design-tokens` — result identical to the pre-task run (the file is excluded; this proves it).
7. `npm run check:mojibake` and `npm run check:file-integrity` — `globals.css` carries non-ASCII em-dashes.
8. `npm run build` — **exit 0 is mandatory**; quote the transcript tail. A failed or unrun build permits only
   `PARTIALLY IMPLEMENTED` or `BLOCKED`.
9. `git diff -- src/app/globals.css` — quoted in full for AC6.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. **Never self-approve.**

Include, in this order:

1. Changed files with the reason each was touched, reconciled against the final `git status --porcelain`.
2. Requirement IDs completed, and any not completed with why.
3. I0 and final md5 table for the four §13.3 witnesses; `globals.css` is expected to differ, the other three are not.
4. Every §13.3 command with its **actual** result, including the backlog baseline read from `HEAD`.
5. **All seven planted controls with verbatim failure output**, and P6's verbatim pass. This is the core deliverable.
6. The measured ΔE00 for every in-scope pair, before and after the `--brand-950` correction.
7. The full `git diff` of `src/app/globals.css`.
8. Assumptions, deviations, limitations, unresolved issues — explicitly including anything in §3 you found to be
   wrong. **This kickoff's own measured facts are not exempt** (the 709 corollary, and its 710–714 / 721 repeats).
9. Confirmation that no `docs/critical-flow-registry.md` entry is affected.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every path, line, value and expected ΔE00 is in §3 and §10 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R10 map to AC1–AC8 and the P1–P7 matrix |
| Scope names what must not change | **Yes** — §8, plus the oklch values, plus the three unchanged md5 witnesses |
| Two-armed plant that can demonstrably fail | **Yes** — P1–P5 fail arms, P6 the pass control, P7 the self-blindness control |
| Pre-plant census proving no further lifeline | **Yes** — §3.2's repo-wide hex grep proves no second live source could keep a plant green |
| No claimed command, file, value or behavior went uninspected | **Yes** — every §3 fact was re-derived at `bbf94e2ee` on 2026-08-10 |
| Gates prove changed behavior, not procedure | **Yes** — A asserts identity, B–E assert measured colour distance, F asserts a declared exemption |
| Every owner-only exception has traceable authorization | **Yes** — D35 is owner-approved, 2026-08-10; the §3.4 boundary hands ten rows to the pre-existing 676 rather than opening a new number |
| No number is duplicated | **Yes** — 676 (Sprint 57) already owns `globals.css` hex-comment classification; §3.4 feeds it measurements and claims only `--brand-950` |
| Sprint assignment | **Yes** — Sprint 46, order 46.1, kickoff filed inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story is added, extended or probed |
| Dirty-worktree manifest | **N/A at filing** — worktree clean at `bbf94e2ee`; if it is dirty at execution, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Read §6's bundle first, take the §13.3
step-1 baselines **before** any edit, and treat §3.4's table as a boundary, not a to-do list.
