# Task 714 — `check:design-tokens` scans CSS files but cannot read CSS declarations

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens) / MM Phase-2.
**Depends on:** nothing. 713 is `APPROVED WITH NOTES` and committed (`8199a5aae`). **Blocks:** 715.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — detector coverage** (`docs/rule-index.md` → Validation/QA tooling).
- **Secondary type:** none. **No `src/` change. No product code. No UI change.**

> **Read this first.** The detector is not blind to CSS — it already reads `.css` files and catches **colour**
> literals there (Task 713 proved it: a planted run found 3 raw hex values in a `.module.css` and exited 1). What it
> cannot do is read a **plain CSS declaration** for length, duration or z-index, because those patterns are keyed to
> Tailwind's arbitrary-value bracket syntax. Your job is to close that specific gap, measure what it exposes, and
> **not** turn CI red doing it.

---

## 2. Objective

1. Extend `scripts/check-design-tokens.mjs` so raw **length / duration / z-index** literals in plain CSS
   declarations are detected, in the same files it already scans.
2. Land the new category **report-only** — it must not change any exit code today (§3.5: 49 pre-existing literals
   across six closed tasks' files would turn CI red).
3. Prove the gap is closed with the exact values that fell through it: the three `font-size: 10px` declarations
   Task 713 moved out of coverage must be **detected again**, and suppressible by a same-line CSS marker.
4. Produce a classified inventory of all pre-existing CSS literals, so **715** can be scoped.

**Non-goals, stated as objectives so they are not silently attempted:** do **not** remediate any of the 49 literals
(that is **715**); do **not** flip the new category to strict or edit `governance-pr.yml` (**715**); do **not**
change the existing colour or Tailwind-bracket detectors, which work correctly; do **not** touch `src/`.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on
**2026-08-06**. Nothing is inferred from a filename or a prior report.

### 3.1 What the detector does today — read from its own header and source

`scripts/check-design-tokens.mjs`:

- `:5` — scans `src/**/*.{tsx,ts,css}`. **`.css` is already in scope.** `globals.css` is excluded entirely (`:28`).
- `:10-20` — detects colour literals (`#hex`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`); **Tailwind arbitrary**
  lengths (`*-[Npx]`, `*-[Nrem]`), function-wrapped arbitrary lengths, inline `style` prop px/rem strings,
  `z-[N]` and inline `zIndex:`, `shadow-[…]`, `duration-[…]`.
- `:26` — explicitly does **not** flag named token utilities (`p-4`, `text-sm`, `z-50`, `duration-200`).
- `:101` — `export const DETECTION_PATTERNS` — the extension point.
- `:337` — `export function scanContent(content, relPath, allowlist = {})` — the unit-testable entry point.

**The gap, stated precisely:** every non-colour length/duration/z-index pattern is shaped around Tailwind bracket
syntax. A CSS declaration such as `font-size: 10px;`, `gap: 1.5rem;`, `z-index: 30;` or `transition-duration: .15s;`
matches none of them. Colour literals *are* matched in CSS because a bare `#rrggbb` needs no Tailwind context.

### 3.2 The proof that the gap is real, from Task 713

Task 713's two-armed marker proof (`.screenshots/task713-evidence/i4-arm1-no-markers.log`) ran the gate on
`MobileBottomNavView.module.css` **before** markers were added:

```
❌  check:design-tokens STRICT — 3 raw style-value violation(s) + 0 stale-marker(s) found.
EXIT_CODE=1
```

All **3 were colour** (`#00000014` once, `#0000001a` twice on one line). In the **same file, same run**,
`font-size: 10px` at `:123` and `:164` was **not** reported — and both survive today, unmarked, with
`npm run check:design-tokens` reporting `0 violations / 0 stale-markers / 0 missing-reason`.

Before 713 those same values were `text-[10px]` in TSX: **detected, and suppressed by an explicit marker carrying
the reason "interactive/mobile-critical nav text (MobileBottomNav protection)".** The migration did not change the
values; it moved them into syntax the scanner does not read. **That is the coverage decrease this task closes.**

### 3.3 Markers already work in CSS — for colours

`parseInlineMarkers` (`:233`) does `line.indexOf('design-tokens-allow:')` on the **raw physical line** and takes
everything up to the `—` separator as the raw value. It is **comment-syntax agnostic**: `/* design-tokens-allow:
<value> — <reason> */` parses exactly like a `//` comment. Task 713 shipped the repo's first two CSS markers on
this basis (`MobileBottomNavView.module.css:60`, `:87`) and they suppress correctly.

**Unverified, and you must verify it:** that the same mechanism suppresses a **length** detection once your new
pattern produces one. The rawValue your pattern reports is unknown until you write it — see A1.

### 3.4 The test harness already exists

`scripts/__tests__/check-design-tokens.test.ts` — **26** tests, importing `scanContent`, `stripJsxComments` and
`parseInlineMarkers` directly from the detector. Organised as `§A` (JSX comment stripping), `§B` (inline zIndex),
`§C` (negative-offset shadow / function-wrapped / `var()` audit), plus a `parseInlineMarkers` section. **Add your
planted arms here, in the same style. Do not create a second harness.**

### 3.5 Blast radius — measured, and the reason this task is report-only

Measured 2026-08-06 across the **12** `.module.css` files in `src/`: **49 raw non-colour literals in 7 files.**

| File | Count | Owning task |
|---|---:|---|
| `src/components/layout/FooterView.module.css` | 19 | 673 |
| `src/components/layout/HeaderView.module.css` | 14 | 706 |
| `src/components/layout/MobileBottomNavView.module.css` | 7 | 713 |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 4 | (pre-691) |
| `src/modules/listings/components/LatestListingsView.module.css` | 2 | 707 |
| `src/modules/listings/components/FeaturedListingsView.module.css` | 2 | 707 |
| `src/modules/locations/components/PopularLocationsView.module.css` | 1 | 688 |

Sampled shapes: `gap: 1.5rem; /* gap-6 */` · `font-size: 0.875rem; /* text-sm */` ·
`line-height: 1.25rem;` · `letter-spacing: 0.1em; /* tracking-widest */` ·
`border-radius: 3.40282e38px; /* rounded-full */` · `transition-duration: .15s; /* duration-150 */`.

`npm run check:design-tokens` is `--strict` (`package.json:66`) and CI runs `check:design-tokens:strict`
(`governance-pr.yml:97`). **A blocking new category would turn CI red on 49 literals across six closed, approved
tasks.** Hence report-only here, remediation and the strict flip in **715**.

### 3.6 The N1 collision — name it, do not resolve it here

**N1** (`HeroSearchView.module.css:10-11`, Task 707 P3) requires a D28 module to reproduce the compiled **token
reference**, never its resolved value. Many of the 49 are annotated reproductions — `gap: 1.5rem; /* gap-6 */` —
which means a large share are **N1 violations that no gate has ever been able to see**. Others
(`3.40282e38px` for `rounded-full`, `.15s` for a default transition) are genuinely token-less compiled artifacts
that legitimately need a marker and a reason.

**Nobody knows the split.** R6 makes you measure it. **Do not remediate either class** — 715 owns that, and the
policy call between them is an owner decision 715 will surface with your inventory in hand.

### 3.7 Worktree state

Task 713's six paths are committed. **Take your own pre-write `git status --porcelain` snapshot before your first
edit.** If it is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry and
never touch a foreign path.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | The detector reports raw **length** literals (`px`/`rem`/`em`) in plain CSS declarations in the files it already scans. | P0 | AC1 | Confirmed |
| R2 | §3.1 | Same for **duration** (`s`/`ms`) and **unitless z-index** in CSS declarations. | P0 | AC2 | Confirmed |
| R3 | §3.5 | The new category is **report-only**: `npm run check:design-tokens` still exits **0** on the current tree, and the pre-existing 49 appear as a separate, clearly-labelled inventory — never as blocking violations. | P0 | AC3 | Confirmed |
| R4 | §3.2 | The three `font-size: 10px` declarations (`MobileBottomNavView.module.css:123`, `:164`, and the `fabLabel` site) are **detected**. Proven against the real file. | P0 | AC4 | Confirmed |
| R5 | §3.3 | A same-line CSS `/* design-tokens-allow: <value> — <reason> */` marker suppresses a new length detection, and an orphaned one is still a `stale-marker`. Both arms proven. | P0 | AC5 | Confirmed |
| R6 | §3.5, §3.6 | A persisted inventory of every pre-existing CSS literal the new patterns find, each classified `N1-VIOLATION` (a token exists and should be used) or `COMPILED-ARTIFACT` (no token exists; needs a marker in 715), with the count per file. | P0 | AC6 | Confirmed |
| R7 | §3.4 | Planted arms added to `scripts/__tests__/check-design-tokens.test.ts`: each new pattern **fails** on a planted literal and **passes** on the `var(--token)` form. | P0 | AC7 | Confirmed |
| R8 | §3.1 | **No false positives on token-anchored CSS.** `gap: var(--space-6)`, `width: calc(var(--x) * 2)`, `0`, `0px`, `100%`, and values inside CSS comments are not flagged. | P0 | AC8 | Confirmed |
| R9 | scope | Zero diff in `src/`, `governance-pr.yml`, `package.json`, and every existing detector pattern for colour/Tailwind-bracket syntax. | P0 | AC9 | Confirmed |
| R10 | §3.4 | All **26** pre-existing detector tests still pass, unchanged. | P0 | AC10 | Confirmed |
| R11 | procedures `6c3a2054e` | `docs/design-system.md` (§22–23, the doc the gate's own failure message cites) and `docs/storybook-governance.md` record the new coverage, the report-only staging, and that 715 owns the flip. | P1 | AC11 | Confirmed |
| R12 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code captured **inside** the file. | P0 | AC12 | Confirmed |
| R13 | cl. 14, N6 | Counting gates run **last**, and their actual numbers appear in the session log **and reconcile to the final tree**. | P1 | AC13 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the rawValue your pattern reports is a design decision, and markers depend on it.** `parseInlineMarkers`
  matches the marker's value against the detected token's **source text, byte-for-byte** (§3.3). If your pattern
  reports `10px`, the marker reads `/* design-tokens-allow: 10px — … */`; if it reports `font-size: 10px`, the
  marker must contain the whole thing. **Choose deliberately, document it, and make R5's two arms prove it.**
  Prefer the narrowest value that is unambiguous on its line.
- **A2 — CSS comments must be stripped before detection, and there is no existing helper for it.**
  `stripJsxComments` (`:199`) handles `{/* … */}` in TSX. A `.module.css` file is full of `/* gap-6 */`
  annotations — including ones containing literals (`/* measured 20px @14px font, I2 */`). **If you do not strip
  CSS comments, every annotation in the 49 becomes a phantom detection.** Note the ordering trap: the marker itself
  lives in a comment, so strip for **detection** while leaving the physical line intact for **marker parsing** —
  the same split `stripJsxComments` already uses.
- **A3 — `0`, `0px`, `100%`, `1px` and `-1px` need a decided policy.** A `1px` hairline border has no token in this
  project (`HeaderView.module.css:37` uses `1px solid var(--border)` and is approved). Decide and document whether
  `1px` is exempt-by-value or must be marked; whatever you choose, R8 must show it does not fire on `0`/`0px`/`100%`.
- **A4 — report-only must be visible, not silent.** R3 says do not block. It does **not** say hide. The inventory
  must print under its own heading with its own count, so the number is impossible to miss and 715 can act on it.
  A category that neither blocks nor prints is a third blind spot.
- **A5 — `@media` and `@supports` preludes are not declarations.** `@media (min-width: 40rem)` contains `40rem`.
  Breakpoint preludes are not style values and must not be flagged. Prove this — several of the 7 files use them.

### 5.1 Naming — decided, do not re-litigate

Extend `DETECTION_PATTERNS` in place; no new script, no new npm script, no new config file. Category labels:
`css-length`, `css-duration`, `css-zindex`. No task number in any identifier (Task 701 F2).

### 5.2 Rejected alternatives — do not re-open

- **Make the new category blocking now.** Rejected: §3.5 — 49 literals across six closed tasks turn CI red on
  arrival. The repo's own precedent (Task 402 report-mode → 407 strict, recorded at `check-design-tokens.mjs:6-8`)
  is exactly this staging.
- **Remediate the 49 in this task.** Rejected: it spans six closed tasks' files and needs the N1-vs-artifact policy
  call (§3.6). **715**, with this task's inventory as its input.
- **Write a second script for CSS.** Rejected: one gate, one detector. `scanContent` already receives the file's
  content and path; the file type is knowable there.
- **Parse CSS with a real parser dependency.** Rejected: every other pattern here is regex over source text, and
  adding a parser is its own blast radius. If you conclude regex genuinely cannot express A2's comment handling,
  stop and report rather than adding a dependency.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md` (**:83** D28/D32/N1 · the standing "recurring orchestrator failure mode" note).

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** (added `6c3a2054e`) · `docs/design-system.md` **§22–23** (the token policy the gate enforces and the
docs its failure message cites) · `docs/qa-rules.md`.

**Task-specific sources — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` **`:1-60`** (the contract), **`:85-200`** (`DETECTION_PATTERNS`,
  `stripJsxComments`), **`:217-260`** (marker parsing), **`:337-400`** (`scanContent` + stale detection). **Edit
  only the detection layer.**
- `scripts/__tests__/check-design-tokens.test.ts` **in full** — the harness and its §A/§B/§C style.
- `src/components/layout/MobileBottomNavView.module.css` **`:60`, `:87`, `:123`, `:164`** — the two working CSS
  colour markers and the two undetected `font-size: 10px`. **Read; do not edit.**
- `src/components/layout/HeaderView.module.css` **`:37`, `:55-70`** — the `1px` hairline and the `gap`/`padding`
  reproductions A3 and R6 must classify. **Read; do not edit.**
- `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md` **§4** — the marker two-armed proof you extend.

---

## 7. Scope

- `scripts/check-design-tokens.mjs` — detection layer only.
- `scripts/__tests__/check-design-tokens.test.ts` — new planted arms, existing 26 untouched.
- `docs/design-system.md` · `docs/storybook-governance.md` — R11.
- `docs/backlog.md` — concise state only; register **715**.
- `docs/sessions/2026-08-0X-task714-design-tokens-css-declaration-coverage.md` — session log, real finish date.

## 8. Out of scope

- **`src/` entirely** — including all 49 literals. **Zero diff.**
- **`.github/workflows/governance-pr.yml`** and **`package.json`** — **715** owns the strict flip. **Zero diff.**
- The existing colour and Tailwind-bracket detectors, `scripts/design-tokens-allowlist.json`, and every other gate.
- The N1-vs-compiled-artifact policy decision (§3.6) — surfaced by R6, decided in 715.
- `check-stories-rendered.mjs` and the 711 assertions — same sprint, different task.

---

## 9. Current and required behavior

**Current:** `check-design-tokens.mjs` scans `src/**/*.{tsx,ts,css}` and enforces the token policy through patterns
shaped around Tailwind's arbitrary-value syntax, plus bare colour literals. In a `.css` file it therefore catches
`#00000014` but not `font-size: 10px`. Task 713's D28 migration moved three previously-detected, explicitly-marked
`text-[10px]` values into exactly that blind spot; the gate reports `0 violations` and the site-level protection is
gone. 49 further raw literals sit undetected across 7 module files.

**Required after:** the detector reads plain CSS declarations for length, duration and z-index; the three
`font-size: 10px` values are visible again and suppressible by a CSS marker; the pre-existing 49 are inventoried and
classified but **not** blocking, so CI stays green; and 715 is registered to flip and remediate.

### Implementation sequence

- **I1 — Baseline before any edit.** `git status --porcelain`. Run `npm run check:design-tokens` and persist the
  current `0/0/0` output. Persist the current 26-test pass. **Enumerate the 49 yourself** from the 7 files and
  persist the list — if your count differs from §3.5, **stop and report**: the kickoff's measurement is then stale.
- **I2 — Write the failing arms first.** In the existing harness, add tests asserting that `scanContent` detects a
  planted `font-size: 10px`, `transition-duration: .15s` and `z-index: 30` in a `.css` path. **They must fail
  against the current detector.** Persist that failing run — it is the D32 proof this gate can fail.
- **I3 — Implement.** Extend `DETECTION_PATTERNS` for `css-length` / `css-duration` / `css-zindex`, gated on the
  file being `.css`. Handle A2's comment stripping and A5's at-rule preludes.
- **I4 — Green the arms**, then add the R8 negative arms (`var(--token)`, `calc(var(…))`, `0`, `0px`, `100%`,
  comment text, `@media` prelude) and confirm all **26 + new** pass.
- **I5 — Prove R4 and R5 against the real file.** Run the detector on `MobileBottomNavView.module.css`: the two
  `font-size: 10px` sites must now appear. Then add a marker to a **throwaway copy** (never the real file — 713 is
  approved and closed), confirm it suppresses, and confirm an orphaned marker is a `stale-marker`. **Both arms.**
- **I6 — The inventory (R6).** Produce the classified list. Persist it as a file and summarise per file in the log.
- **I7 — Confirm report-only (R3).** `npm run check:design-tokens` exits **0** on the current tree, with the
  inventory printed under its own heading and count. **Capture the exit code unpiped** (Task 710 R10).
- **I8 — Docs, session log, backlog** (R11); register 715.
- **I9 — Counting gates last** (`check:file-integrity`, `check:mojibake`) **after** the log and backlog row exist —
  and **after** deleting every scratch file, so the numbers reconcile to the final tree (Task 713 F3).

---

## 10. Implementation requirements

1. **The failing arm comes first** (I2). A detector that has not been shown to miss the value it was built to catch
   proves nothing (D32).
2. **Report-only, but loud** (A4/R3) — own heading, own count, exit code unchanged.
3. **Strip CSS comments for detection, keep the physical line for markers** (A2).
4. **No false positives on token-anchored or zero values** (R8) — negative arms are requirements, not politeness.
5. **Never edit a closed task's `.module.css`** — R4/R5 prove against the real file read-only, and mutate only a copy.
6. **Capture every transcript unpiped** — redirect, then append `$LASTEXITCODE` as its own statement (Task 710 R10).
7. **No task number** in any identifier (Task 701 F2).
8. **Run `check:file-integrity` and `check:mojibake` LAST, after scratch cleanup** — Task 713 recorded a mojibake
   count 8 files higher than the final tree (F3, held at P3). **A repeat is a `P1`.**

---

## 11. Positive and negative flows

**Positive flow:** the new patterns detect the three `font-size: 10px` sites and the planted length/duration/z-index
literals; the 26 existing tests plus the new arms all pass; `npm run check:design-tokens` exits 0 with the
inventory printed; the 49 are classified; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Value is a raw CSS length | **Yes** | R1 | detected, categorised `css-length` | AC1 |
| Value is `var(--token)` or `calc(var(…))` | **Yes** | R8 | **not** detected | AC8 |
| Value is `0` / `0px` / `100%` | **Yes** | R8 | **not** detected | AC8 |
| Literal appears inside a CSS comment | **Yes** | A2/R8 | **not** detected | AC8 |
| Literal appears in an `@media`/`@supports` prelude | **Yes** | A5/R8 | **not** detected | AC8 |
| A new detection carries a CSS marker | **Yes** | R5 | suppressed, no violation | AC5 |
| A CSS marker is orphaned | **Yes** | R5 | `stale-marker` violation | AC5 |
| The pre-existing 49 appear | **Yes** | R3/R6 | inventoried, **non-blocking**, exit 0 | AC3, AC6 |
| A `1px` hairline border | **Yes** | A3 | decided policy, documented, consistent | AC8 |
| Detection changes an existing test's result | **Yes** | R10 | must not — all 26 pass unchanged | AC10 |
| TSX detection changes at all | **Yes** | R9 | must not — `.tsx` behaviour byte-identical | AC9 |
| Locale expansion | **No** | build-time script, no strings | N/A | — |
| Small viewport / responsive | **No** | no rendering | N/A | — |
| RLS / authorization | **No** | build-time script, no data access | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given a `.css` path containing `font-size: 10px`, when `scanContent` runs, then it is reported as
  `css-length` with its rawValue. Quote the test and its output.
- **AC2 [R2]** Same for `transition-duration: .15s` (`css-duration`) and `z-index: 30` (`css-zindex`).
- **AC3 [R3]** Given the current tree, when `npm run check:design-tokens` runs, then it **exits 0**, and the
  pre-existing CSS literals appear under their own heading with a count, separate from blocking violations. Persist
  the transcript with the exit code inside it.
- **AC4 [R4]** Given the **real** `src/components/layout/MobileBottomNavView.module.css`, when the detector runs,
  then both `font-size: 10px` sites are reported. Quote the output. **The file itself has zero diff.**
- **AC5 [R5]** Given a throwaway copy with `/* design-tokens-allow: <value> — <reason> */` on the same line, then
  the detection is suppressed; given the marker with the declaration removed, then a `stale-marker` violation is
  reported. Show **both** transcripts and state the exact rawValue string used.
- **AC6 [R6]** Given the inventory artifact, when read, then every pre-existing CSS literal is listed with file,
  line, value, category and a `N1-VIOLATION` / `COMPILED-ARTIFACT` classification, with per-file counts reconciling
  to your I1 enumeration.
- **AC7 [R7]** Given `npx vitest run scripts/__tests__/check-design-tokens.test.ts` **before** I3, then the new arms
  **fail**; after I3, then they pass. Show both runs.
- **AC8 [R8]** Given the negative arms — `var(--token)`, `calc(var(…) * 2)`, `0`, `0px`, `100%`, a literal inside a
  CSS comment, and an `@media (min-width: 40rem)` prelude — then none is reported. Show the test output.
- **AC9 [R9]** Given `git diff` on `src/`, `governance-pr.yml` and `package.json`, then all are **empty**. Verify by
  hash. Given the `.tsx` detection path, then its behaviour is unchanged (AC10 is the witness).
- **AC10 [R10]** Given the full detector suite, then **all 26 pre-existing tests pass**, unmodified. State the
  before and after totals.
- **AC11 [R11]** Given `docs/design-system.md` and `docs/storybook-governance.md`, when read, then both record the
  new CSS coverage, the report-only staging, the 713/F2 origin, and that **715** owns the strict flip.
- **AC12 [R12]** Given the final state, when `npm run build` runs, then it exits **0**, transcript at a stated path
  with the exit code inside it.
- **AC13 [R13]** Given `check:file-integrity` and `check:mojibake` run **last and after scratch cleanup**, then both
  pass and their numbers **reconcile to `git status` on the final tree**. State the reconciliation explicitly.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `docs/qa-profiles.md` routes to Q4 for a change to a CI-blocking gate, and
Q4 is the profile that compels the **planted-violation failure proof** — which is the whole point here: a detector
that has not been shown to fail on the value it was built to catch is the exact defect this task exists to fix.
A green run is explicitly **not** sufficient evidence.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1, pre-edit) | `0/0/0`, exit 0 — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | **26 passed** — persisted |
| 4 | Enumerate the 49 yourself (I1) | matches §3.5 per file, or **stop and report** |
| 5 | **New arms, pre-implementation** (I2) | **FAIL** — persisted; this is the D32 proof |
| 6 | Implement (I3) + green the arms (I4) | new arms pass |
| 7 | Full detector suite (I4) | 26 + new, all pass |
| 8 | Detector on the real `MobileBottomNavView.module.css` (I5) | both `font-size: 10px` reported |
| 9 | Marker suppress + orphan arms on a **copy** (I5) | suppressed / `stale-marker` |
| 10 | Inventory produced + classified (I6) | persisted artifact, per-file counts |
| 11 | `npm run check:design-tokens` (I7) | **exit 0**, inventory printed under its own heading |
| 12 | `npx tsc --noEmit` | 0 errors |
| 13 | **`npm run build`** | **exit 0 — hard gate**, transcript with the exit code inside it |
| 14 | `check:file-integrity` · `check:mojibake` — **last, after scratch cleanup** | pass; numbers reconcile to the final tree |

A failed or unrun step 13 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task714-evidence/` (local-only per **D6**), referenced by path from the
session log. **Name every artifact you create.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task714-design-tokens-css-declaration-coverage.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled against your pre-write snapshot.
2. **Requirement IDs completed** — R1–R13, each with its AC verdict.
3. **The failing arms, before implementation** — the transcript proving the detector could not see the values.
4. **The A1 answer** — the exact rawValue string your patterns report, and why.
5. **The A2/A3/A5 answers** — how CSS comments are stripped, the `1px` policy you decided, and how at-rule preludes
   are excluded.
6. **The R4 proof** — the real-file run showing both `font-size: 10px` sites, with the file's zero diff.
7. **The R5 two arms** — suppression and stale-marker, with the exact marker strings.
8. **The R6 inventory** — per-file counts and the `N1-VIOLATION` / `COMPILED-ARTIFACT` split, stated as numbers.
9. **Test totals** — 26 before, N after, and the fact that no pre-existing test was modified.
10. **Commands run and actual results** — real exit codes, including the step-13 build transcript.
11. **Evidence locations** — every artifact, named.
12. **A real counting-gates section** with the actual numbers **and their reconciliation to `git status`**.
13. **Standing findings not acted on** — 715 (the flip + remediation), 711, 702/691 (Sprint 46).
14. **Assumptions, deviations, limitations, unresolved issues.**
15. Concise current state appended to `docs/backlog.md` — **state only**, and register **715**. The file is at
    **100** lines against a ~80 target and Opus owes it a consolidation; **do not add net lines**, and flag a
    `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every file, line range, exported function, test-harness section, category label, count and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R13 → AC1–AC13 → §13 steps 1–14 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified zero-diff AC9, AC10's "all 26 unchanged", and §5.2's four rejected alternatives |
| **Detector behaviour proven before publication** (`6c3a2054e`) | ✅ §3.1 read from source (`:101` `DETECTION_PATTERNS`, `:337` `scanContent`); §3.2 quotes Task 713's real arm-1 transcript showing 3 colour hits and **zero** length hits in the same file and run; §3.3 records that CSS markers demonstrably work for colours and flags length suppression as **unverified** and owned by A1/R5 |
| No requirement is unsatisfiable in the target syntax | ✅ the 713 failure mode is designed out — R5 makes marker suppression in CSS a **proven** arm rather than an assumption, and A1 forces the rawValue to be decided and documented rather than inherited |
| The gate proves the changed behavior, not merely procedure | ✅ I2/AC7 require the new arms to **fail first**; AC4 proves against the real file that fell through; AC5 proves both suppression arms; a green run is declared insufficient in §13 |
| Blast radius measured before it can bite | ✅ §3.5 counts **49 literals in 7 files** by direct enumeration and names the owning task for each; R3/§5.2 make the category report-only for exactly that reason, following the repo's own 402→407 staging |
| Zero/empty input covered | ✅ R8/AC8 cover `0`, `0px`, `100%`, comment text and at-rule preludes as explicit non-detections |
| The task does not silently inherit a prior measurement | ✅ I1 step 4 requires the executor to re-enumerate the 49 and **stop and report** on any divergence |
| Owner exceptions have traceable authorization | ✅ D6 for the evidence dir; D32/N1 cited with sources; the N1-vs-artifact policy call is **surfaced, not decided**, and explicitly deferred to 715 |
| Exactly one active executable route | ✅ §5.1 fixes naming, §5.2 closes four alternatives, A1/A3 require a decision to be made and recorded rather than left open |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I1's persisted baseline + I2's mandatory failing arm + I5's dual marker arms + I1 step 4's stop condition |
| Prior-review corrections folded in | ✅ Task 713 **F1/F2** (this task *is* the corrective task the new procedures rule requires), **F3** (§10.8 + I9 + AC13 make counting-gate reconciliation an explicit criterion after a P3 warning), Task 710 **R10** (unpiped capture), **701 F2** (no task numbers), **707 N6** (§10.8) |
| Sprint assigned before creation | ✅ Sprint 52, opened with its own plan file before this kickoff was written |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none for this task.** The N1-vs-compiled-artifact policy (§3.6) is deliberately
deferred to **715**, which cannot be scoped until this task's inventory exists.
