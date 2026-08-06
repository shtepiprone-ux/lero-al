# Task 692 — Gate the overlay dual-declaration sync

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** governance gate authoring (`docs/rule-index.md` → "Storybook / Visual Proof" +
  design-system rules). A new automated gate that asserts observable behaviour.
- **Secondary type:** none. No component, no style value, no rendered surface changes.
- **Origin:** backlog reservation **692** (filed by Task 690 §8, extended by **D19** in Task 693). Escalated to
  active by the **Task 693 review, 2026-07-31, finding F1 (`P2`)**: the dual declaration Task 693 introduced is
  currently protected by nothing but a code comment, and **Task 691** — the next migration slice — is the heaviest
  consumer of the utilities that comment protects.

> **Read this first.** Task 690 removed the `@theme inline` copy of `--overlay`/`--overlay-foreground` and silently
> destroyed Tailwind's alpha-composited static fallback tier for every `bg-overlay/*` utility. Task 693 restored it
> by declaring the pair in **both** `@theme inline` and `:root`. Nothing today prevents the next editor from
> repeating 690's mistake, or from changing one copy and not the other. This task builds that gate. It changes **no**
> rendered output; the whole deliverable is a test that fails when it should.

---

## 2. Objective

1. Add an automated gate that fails the moment the two `--overlay`/`--overlay-foreground` declarations in
   `src/app/globals.css` diverge in value, or either copy is removed.
2. Assert the companion invariant: `--color-overlay`/`--color-overlay-foreground` stay **`@theme`-only** and are
   never duplicated into `:root`.
3. Prove the gate with planted-violation failure proof — four negative controls, each demonstrated to fail, then
   restored.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-31.
Nothing is inferred from a filename or a prior report.

### 3.1 The current declaration geometry — read in source

`src/app/globals.css` block boundaries (from `grep -n "^@theme\|^:root\|^}"`):

| Block | Lines |
|---|---|
| `@theme inline {` … `}` | **22 – 307** |
| `:root {` … `}` | **318 – 440** |

The four declaration lines:

| Line | Block | Exact text |
|---|---|---|
| `:63` | `@theme inline` | `  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */` |
| `:64` | `@theme inline` | `  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */` |
| `:438` | `:root` | `  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */` |
| `:439` | `:root` | `  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */` |

Machine-verified byte-identity of the two pairs — `sed -n '63p;64p' | md5sum` and `sed -n '438p;439p' | md5sum`
both return **`c4b000f2c892a11c54e96c554dc7d7b5`**.

Lines `:65`–`:66` carry `--color-overlay: var(--overlay)` and `--color-overlay-foreground:
var(--overlay-foreground)`, **inside `@theme inline` only**. `grep -n -- "--color-overlay"` finds no other
declaration site. That asymmetry is deliberate (Task 693 R2) and is the second thing this gate must protect.

### 3.2 Why both copies exist — proven in the shipped CSS, not quoted

From the current production build (`.next/static/css/8116c739843b9305.css`, built 2026-07-31 15:19):

```
--overlay:oklch(0% 0 0);                       ← the :root copy — unconditional emission (closes Task 688 F1)
--color-overlay:var(--overlay);                ← the @theme copy survived the source scan
.bg-overlay\/60{background-color:#0009}                                                ← static fallback tier
.bg-overlay\/60{background-color:color-mix(in oklab,var(--overlay) 60%,transparent)}   ← modern tier
```

Every `bg-overlay/*` and `text-overlay-foreground/*` utility is emitted **twice** — a composited static hex first,
then the `color-mix` override. Tailwind can only composite that first tier if it can **statically resolve**
`--overlay`, which requires the `@theme` copy. Deleting it degrades every overlay utility to the un-composited tier
— exactly the Task 690 defect, and it is invisible to `typecheck`, `build`, and every existing gate.

### 3.3 The live consumers this protects — grepped, not assumed

`bg-overlay*` / `text-overlay-foreground*` utilities and `var(--overlay*)` / `var(--color-overlay*)` reads:

| File | Form |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` `:188`, `:312`, `:314`, `:323` | `bg-overlay/60`, `bg-overlay/30`, `text-overlay-foreground` |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` `:67`, `:90`, `:91` | `bg-overlay/60`, `c="var(--color-overlay-foreground)"` |
| `src/modules/listings/components/LightboxView.tsx` `:45` | `color-mix(… var(--color-overlay-foreground) 10% …)` inline style |
| `src/modules/listings/components/ImageUpload.tsx` `:117`, `:167` | `bg-overlay/50`, `bg-overlay/60` |
| `src/components/shared/PerfDevOverlay.tsx` `:32`, `:47`–`:87` | `bg-overlay/85`, `text-overlay-foreground/40…/70` |
| `src/components/admin/AdminUserAvatar.tsx` `:169` | `bg-overlay/30` |
| `src/modules/locations/components/PopularLocationsView.module.css` `:49`–`:50` | `var(--overlay)` in `color-mix` |

`MantineListingCardPattern.tsx` is **Task 691's** primary target. That is why this gate lands first.

### 3.4 The precedent to copy — read in full

`scripts/__tests__/preview-clock-anchor.test.ts` (Task 698 / **D25**) solves the identical shape: one literal
duplicated across two files that cannot import each other, gated by a vitest test that extracts both with a regex
and asserts equality with a diagnostic message naming both values. **Reuse its structure.** Do not invent a new
gate mechanism, and do not author a `.mjs` script — this belongs with the other sibling tests.

### 3.5 Wiring — verified, and it needs no new CI edit

- `vitest.config.ts` declares **no `test.include` override**, so vitest's default globs apply. Its four existing
  siblings — `check-design-tokens.test.ts`, `check-i18n-parity.test.ts`, `check-stories.test.ts`,
  `preview-clock-anchor.test.ts` — prove `scripts/__tests__/*.test.ts` is already collected.
- `package.json`: `test` → `vitest run`.
- `.github/workflows/governance-pr.yml` `:40` runs `npm test`.

So a new file at `scripts/__tests__/` is CI-enforced on merge with **zero** workflow or `package.json` changes.
Adding either is out of scope (§8).

### 3.6 Test baseline — measured, not quoted

`npx vitest run` on the current tree: **1190 tests, 1189 passed**, with one documented full-run-only timeout whose
identity varies by run (the documented set is `date-format-ssr-parity`, `RangeDatePicker`,
`saveSavedSearch.dedup`; Task 699 observed `saveSavedSearch.dedup`, isolated re-run 2/2 pass). After this task the
count must be **1190 + N**, where N is the number of `it()` blocks added — state N explicitly.

### 3.7 Start state

`git status --porcelain` on 2026-07-31 shows the **uncommitted Task 699 + D26 change set**:

```
 M docs/backlog.md
 M docs/qa-profiles.md
 M docs/storybook-governance.md
 M src/app/[locale]/page.tsx
 M src/components/shared/HowItWorksSteps.tsx
 M src/modules/listings/components/FeaturedListingsView.tsx
 M src/modules/locations/components/PopularLocationsView.tsx
?? docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md
?? src/design-system/mantine/typography.ts
```

**This task starts DIRTY.** If the owner has committed Task 699 before you start, the status will be empty instead
— both are acceptable. Any *other* entry is a **stop and report**. Complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every entry present at I0, and provide a content
witness (md5) for each of the 9 paths above at I0 and again at the end, proving this task touched none of them.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, §3.4 | A new test `scripts/__tests__/overlay-dual-declaration.test.ts` extracts the `@theme inline` block and the `:root` block from `src/app/globals.css` by brace matching from their opening lines, not by hard-coded line numbers. | P0 | AC1 | Confirmed |
| R2 | §3.1 | The test asserts each block declares `--overlay` and `--overlay-foreground` **exactly once**, and that the trimmed **value** of each is byte-identical between the two blocks. Comparison is on the value only (`oklch(0 0 0)`), not the trailing comment or column alignment — a reworded comment is not a regression, a changed value is. | P0 | AC1, AC2 | Confirmed |
| R3 | §3.1 | The test asserts `--color-overlay` and `--color-overlay-foreground` are declared **only** inside `@theme inline` and appear **zero** times inside `:root`. | P0 | AC1, AC2 | Confirmed |
| R4 | cl. 13, §13.1 | Planted-violation failure proof, four controls, each run and its actual output recorded: **(a)** change `oklch(0 0 0)` → `oklch(0.1 0 0)` in the `:root` copy only → FAIL naming both values; **(b)** delete the `:root` pair → FAIL; **(c)** delete the `@theme` pair → FAIL; **(d)** add `--color-overlay: var(--overlay)` to `:root` → FAIL. After each, restore and re-run → PASS. | P0 | AC3 | Confirmed |
| R5 | §3.2 | The test's failure messages name the file, both blocks, both observed values, and cite Task 693/D19 — a bare `expected true to be false` is a defect, not a gate. | P1 | AC4 | Confirmed |
| R6 | §3.5 | No change to `package.json`, `vitest.config.ts`, or any file under `.github/`. The test is collected by the existing default globs. | P0 | AC5 | Confirmed |
| R7 | §3.1, cl. 1 | `src/app/globals.css` is **byte-identical** at the end of the task — md5 witness at I0 and at I10. The gate observes; it does not edit. | P0 | AC5, AC6 | Confirmed |
| R8 | cl. 9, 14 | `npx vitest run` shows 1190 + N passing with no new failure; `typecheck` 0; `check:stories` 0 / 127 files; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:file-integrity` and `check:mojibake` clean after the records exist; `npm run build` exits 0. | P0 | AC5 | Confirmed |
| R9 | §3.7, cl. 10 | Dirty-worktree manifest completed; content witnesses prove none of the 9 pre-existing paths changed. | P0 | AC6 | Confirmed |
| R10 | cl. 10 | Session log + `docs/backlog.md` concise state, backlog staying at **80 lines**. | P1 | AC7 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — value comparison, not byte comparison.** R2 deliberately compares the parsed value, not the raw line. The
  code comment says "keep both copies byte-identical"; the *correctness* invariant is the value. Gating raw bytes
  would fail on a harmless comment rewrite and train people to weaken the gate. If you believe the raw-byte reading
  is required, **stop and report** rather than choosing.
- **A2 — brace matching, not line numbers.** §3.1's line numbers are true today and will drift the first time
  anyone edits `globals.css`. A gate keyed to them is a time bomb. Locate `@theme inline {` and `:root {` and match
  to their closing brace.
- **A3 — no CSS parser dependency.** Use `readFileSync` + string/regex work, as the D25 precedent does. Adding
  `postcss` or similar to gate two declarations is disproportionate; if you think it is unavoidable, **stop and
  report**.
- **A4 — the gate must not read the built CSS.** Asserting the composited fallback tier from `.next/` would make
  the test depend on a prior `npm run build`, which `npm test` does not run. §3.2 is the *motivation*; the
  *mechanism* is the source-level invariant. Building inside a test is a **stop and report**.
- **A5 — this task does not touch `dialog.tsx`/`sheet.tsx`'s `bg-black/10`**, nor de-Tailwind any consumer.

**Open questions — none.** The mechanism is proven (§3.2), the precedent exists (§3.4), the wiring is verified
(§3.5).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 10, 13, 14.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q4** row and its planted-violation requirement.
4. `docs/design-system.md` — the token-source section.
5. `docs/orchestrator-dirty-worktree-manifest-template.md` — required by §3.7.
6. `docs/backlog.md` — the numbering line; **exactly 80 lines**, must not grow.

**Source pre-read**

7. `src/app/globals.css` `:22-70` and `:410-440` — both declaration blocks and their comments.
8. `scripts/__tests__/preview-clock-anchor.test.ts` — the full file; this is the shape to copy.
9. `vitest.config.ts` — confirm no `include` override still holds.
10. `docs/sessions/2026-07-30-task693-overlay-dual-declaration.md` §3 — the D21 planted-control method to reuse
    for R4.

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `scripts/__tests__/overlay-dual-declaration.test.ts` | **create** | R1–R5 — the gate |
| `docs/backlog.md` | modify | R10. **Stay at 80 lines.** |
| `docs/sessions/2026-07-31-task692-overlay-dual-declaration-sync-gate.md` | **create** | R10, session log |

Nothing else. `src/app/globals.css` is **read-only** in this task (R7).

## 8. Out of scope

- **The general `@theme`-dependency gate** — the broader Q4 gate that fails when *any* `.module.css` consumes an
  `@theme` variable whose last Tailwind-utility consumer disappears (Task 690 §8's original 692 definition).
  That is a repository-wide scan with its own blast radius; **reserved as Task 700**. This task gates the one
  declaration pair that Task 691 is about to lean on.
- **`package.json`, `vitest.config.ts`, `.github/workflows/*`** — §3.5 proves no edit is needed. Touching them is
  scope creep and an AC5 failure.
- **Editing `src/app/globals.css`** in any way, including comment rewording (R7).
- **Task 691** (`MantineListingCardPattern` + `ListingCard` de-Tailwind) — unblocked by this task, not part of it.
- **Tasks 694/695** — the aliasing and the `@theme` copy's eventual deletion. Note that **695 will legitimately
  delete the `@theme` copy** once the last `bg-overlay*` utility is gone; this gate must therefore be *updated* by
  695, not treated as permanent. Record that in the test's header comment.
- **The 22 ambiguous rendered cells, `check:design-tokens`'s 28 findings** — untouched.
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** `--overlay` and `--overlay-foreground` are declared twice in `globals.css` — once in `@theme inline`
(so Tailwind can statically composite the alpha fallback tier) and once in `:root` (so the variables are emitted
unconditionally for non-Tailwind consumers). The two copies agree today. Nothing enforces that. Deleting either
copy, or changing one value and not the other, produces a silent visual regression across seven consumer files that
`typecheck`, `build`, `check:design-tokens`, and `check:stories` all pass through unnoticed — Task 690 shipped
exactly that defect and it took two blocked attempts to diagnose.

**Required after.** A vitest gate, collected by the existing globs and already wired into CI via `npm test`, fails
with a diagnostic naming both values the instant the copies diverge, either is removed, or `--color-overlay*` leaks
into `:root`. `globals.css` is unchanged. No rendered output changes.

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim. Expect §3.7's 9 entries, or
empty if the owner committed Task 699 first. Anything else → **stop and report**. Record md5 for each entry and for
`src/app/globals.css`. Do not touch `.git/index.lock`.

**I1 — baselines on the untouched tree.** Record actual output for `npx vitest run` (expect 1190 tests, 1189 pass +
1 documented timeout), `npm run typecheck` (0), `npm run check:stories` (0, 127 files), `npm run
check:story-coverage` (15/15), `npm run check:i18n` (2215×4).

**I2 — write the gate (R1–R3, R5).** Create `scripts/__tests__/overlay-dual-declaration.test.ts` following §3.4's
structure. Header comment must state: why the pair is duplicated (§3.2, both tiers), that Task 690 shipped the
regression this prevents, that **Task 695 will legitimately delete the `@theme` copy** and must update this gate,
and the Task 693/D19 provenance. Extract blocks by brace matching (A2). Assert R2's value identity and R3's
`@theme`-only asymmetry.

**I3 — the gate passes on the clean tree.** `npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts` →
all pass. Quote the output and state N (`it()` count).

**I4 — planted-violation proof (R4), four controls.** For each of R4's (a)–(d): apply the edit to `globals.css`,
run **only** this test file, quote the **actual failure output verbatim** (proving R5's diagnostic names both
values), then restore via `git checkout -- src/app/globals.css` **or**, if the file is dirty for an unrelated
reason at that moment, via a recorded md5-verified restore. After each restore, re-run and confirm PASS, and
confirm `globals.css`'s md5 matches I0.

> The Task 693 session log §3, I5.4 records a real trap here: restoring a file via `$(...)` shell substitution
> silently strips the trailing newline. Use direct redirection or `git checkout --`, and verify md5 after every
> restore, not just at the end.

**I5 — confirm no wiring change was needed (R6).** `git status --porcelain` must show **no** `package.json`,
`vitest.config.ts`, or `.github/` entry. Run the full `npx vitest run` and show the new file is collected without
being named explicitly.

**I6 — gate checks (R8).** `npm run typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens` (expect **28**/0/0, unchanged — this task changes no style value), `npx vitest run`.

**I7 — `npm run build` runs last** and must exit 0. Quote the transcript tail verbatim including the full 54-row
route table, no elision.

**I8 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then `check:file-integrity` and `check:mojibake` **after** the records
exist; quote the file counts.

**I9 — dirty-worktree closure (R9).** Re-record md5 for each §3.7 path and `globals.css`; every one must match I0.
Complete the manifest template.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9.

## 11. Positive and negative flows

### Positive flow

A developer opens `globals.css`, sees two `--overlay` declarations, assumes one is dead, and deletes the `@theme`
copy. `npm test` fails locally and in CI with a message naming the file, both blocks, and Task 693's reason. The
developer reads it, understands the fallback tier exists, and restores the copy. Nothing ships broken. Total cost:
one red test instead of a silent visual regression across seven files.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **One copy's value edited** | **Yes** | R4(a) | Test fails naming both values | AC3 |
| **`:root` copy deleted** | **Yes** | R4(b) | Test fails — this is the F1 regression | AC3 |
| **`@theme` copy deleted** | **Yes** | R4(c) | Test fails — this is the Task 690 regression | AC3 |
| **`--color-overlay*` duplicated into `:root`** | **Yes** | R4(d), R3 | Test fails | AC3 |
| **Comment reworded, value unchanged** | **Yes** | A1 | Test **passes** — the gate must not be brittle | AC2 |
| **Line numbers drift** | **Yes** | A2 | Test still passes — brace matching, not line numbers | AC2 |
| **Gate needs CI wiring** | **Yes** | §3.5, R6 | No wiring change; collected by default globs | AC5 |
| **Dirty start worktree** | **Yes** | §3.7, R9 | Manifest + md5 witnesses for all 9 paths | AC6 |
| **Task 695 legitimately deletes the `@theme` copy** | **Yes** | §8 | Not handled in code — recorded in the test header so 695 updates rather than deletes the gate | AC4 |
| Rendered/visual evidence | No | No rendered surface changes; `globals.css` byte-identical (R7) | N/A | — |
| Localization | No | No user-facing string | N/A | — |
| RLS / authorization / data path | No | No data path touched | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers CSS token declaration | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2, R3]** — *Given* the new test file, *then* it locates both blocks by brace matching, asserts one
  declaration of each variable per block, asserts the two values are equal, and asserts `--color-overlay*` appears
  in `@theme inline` only.
- **AC2 [R2, A1, A2]** — *Given* a comment-only reword or a line-number shift in `globals.css`, *then* the test
  still **passes**; *given* a value change in one copy, it **fails**.
- **AC3 [R4]** — *Given* each of the four planted violations, *then* the test **fails**, with the actual output
  quoted verbatim in the session log; *given* each restore, it **passes** and `globals.css`'s md5 matches I0.
- **AC4 [R5]** — *Given* a failure, *then* the message names the file, both observed values, and Task 693/D19; the
  test header records that Task 695 must update this gate rather than delete it.
- **AC5 [R6, R7, R8]** — `git status` shows no `package.json` / `vitest.config.ts` / `.github/` entry;
  `globals.css` md5 unchanged; `npx vitest run` 1190 + N with no new failure; `typecheck` 0; `check:stories`
  0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` 28/0/0; `check:file-integrity` /
  `check:mojibake` 0 after the records exist; `npm run build` exit 0 with the full 54-row route table.
- **AC6 [R7, R9]** — dirty-worktree manifest completed for every I0 entry, with md5 content witnesses at I0 and I9
  proving this task touched none of them.
- **AC7 [R10]** — session log per §14 exists and `docs/backlog.md` is updated in place at exactly 80 lines.

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, per `docs/qa-profiles.md`, selected for **one** reason: this task authors a new
validation gate, and agent-contract cl. 13 plus the review protocol require **planted-violation failure proof** for
any gate claim. It is not Q4 for blast radius — the runtime blast radius is zero, since no shipped file changes.

**Not Q3.** No rendered surface changes and `globals.css` is byte-identical (R7), so the full visual matrix would
prove nothing this task can affect. Do **not** run `build-storybook` / `screenshots:assert`; a rendered run here
would only re-measure harness noise. This is an explicit downgrade of the visual axis with a stated reason, not an
omission.

### 13.2 Worktree

Starts **dirty** with Task 699's uncommitted change set (§3.7), or clean if the owner committed first. Both
accepted; anything else is a stop. Manifest + md5 witnesses required either way (R9).

### 13.3 Gates

| Command | Expected |
|---|---|
| `npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts` | all pass, N tests |
| the four planted controls (R4 a–d) | **each FAILS**, output quoted verbatim; each restore PASSES |
| `npx vitest run` | 1190 + N, no new failure beyond the documented run-varying timeout |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 127 files |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4 |
| `npm run check:design-tokens` | **28** / 0 stale / 0 missing-reason, unchanged |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I8** |
| `npm run build` | **0 — hard gate**, full 54-row route table, run last |

## 14. Completion report contract

Session log at `docs/sessions/2026-07-31-task692-overlay-dual-declaration-sync-gate.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7. If a file is modified, say **modified** — do
   not mark a changed file "unchanged" relative to some earlier attempt (Task 693 review finding F3).
2. The I0 snapshot with per-path md5, and the **true final** `git status --porcelain` with the same md5 set.
3. R1–R10 mapped to AC1–AC7 with evidence.
4. The test file as written, in full.
5. **All four planted controls with their verbatim failure output** — this is the core deliverable of a Q4 gate
   task. A summary of a failure is not proof of a failure.
6. Every command with its **actual** exit code; the `npm run build` tail quoted verbatim including the full 54-row
   route table.
7. The completed dirty-worktree manifest.
8. Deviations, each with a reason.
9. Limitations — at minimum: that this gate asserts the source-level invariant and not the built CSS (A4), so it
   would not catch a Tailwind-version change that alters fallback compositing; that it covers the overlay pair
   only, not the general `@theme`-dependency class (Task 700); and that Task 695 will require updating it.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_692_Overlay_Dual_Declaration_Sync_Gate.md` — under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — both blocks with line numbers and exact text, the md5 witness, the precedent file to copy, the wiring proof, the four controls and the baseline counts are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC7 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 plus R7's byte-identical `globals.css` and R6's no-wiring-change, both gated by AC5 |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 with the planted-violation rationale and an explicit, reasoned visual-axis downgrade |
| Negative flows selected by applicability | **Yes** — §11, including the two brittleness branches (comment reword, line drift) that a naive gate would fail, and the Task 695 branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes lines read in source with a real md5; §3.2 quotes the shipped CSS from the current build; §3.3 is a real grep; §3.4/§3.5 are files read in full; §3.6/§3.7 are real runs |
| Gates prove the changed behavior | **Yes** — four planted violations, each required to fail with verbatim output, plus two must-pass brittleness controls |
| Single active owner route | **Yes** — forks are only stop conditions: unexpected I0 status, byte-vs-value ambiguity (A1), line-number temptation (A2), parser dependency (A3), build-in-test temptation (A4) |
| Baselines account for task-created artifacts | **Yes** — §3.6 states the pre-task test count and requires N to be declared, so the new tests cannot inflate a "no new failure" claim |
| Dirty-worktree handling | **Yes, declared** — §3.7 with the real 9-path status, manifest + md5 witnesses required at I0 and I9 |

**Known-risk note for the reviewer.** Three likely defects. First, **a line-number-keyed gate** — §3.1 hands the
executor line numbers, and hard-coding them produces a test that passes today and silently stops testing anything
after the next unrelated edit to `globals.css`; A2 and AC2 exist for that. Second, **raw-byte comparison** — the
code comment literally says "byte-identical", so an executor who reads only the comment will gate the whole line
and produce a test that fails on a comment typo fix; A1 names the correct reading. Third, **a control that is not
actually run** — R4 asks for four real edit/run/restore cycles with verbatim output; a session log that describes
what *would* happen is the exact failure mode the planted-violation rule exists to prevent, and Task 693 needed
three attempts before its own control passed both arms.
