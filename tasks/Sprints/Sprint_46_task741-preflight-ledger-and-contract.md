# Task 741 — preflight evidence artifact: rule-compliance ledger + executable-route contract

Companion to `tasks/Sprints/Sprint_46_kickoff_prompt_Task_741_ClosedOverlayStyleModuleExit.md`.
Retained per `.claude/skills/create-task/SKILL.md` ("retain both completed artifacts with the
kickoff"). Precedent for the combined form: `tasks/task674-preflight-ledger-and-contract.md`.

Measured 2026-08-14 against `HEAD = 6ecfcf21365f1c791ba8b877b177c00ab0ae001e`, clean worktree.
Every row below was produced by running the stated command against that tree, not by reading a
document.

---

## A. Evidence preflight — what was inspected, and what it returned

| # | Claim in the kickoff | How it was verified | Result |
|---|---|---|---|
| 1 | `CLOSED_OVERLAY_STYLE` is at `:58-61`, consumed at `:268` | read `ListingCard.tsx` | **Confirmed.** Backlog and Sprint plan say `:56-59` → `:266` — **stale by 2**, corrected in the kickoff header |
| 2 | Four sources of the four strings | `grep` over `src/**` **without** comment stripping, then a second pass **with** stripping to isolate the JSDoc | **Confirmed.** `ListingCard.tsx:59-60` · `MantineListingCardPattern.tsx:39` (JSDoc) · `ListingCardPattern.stories.tsx:120` · `MantineListingCardPattern.smoke.test.tsx:105`. The comment-stripped pass hides the JSDoc — which is why the kickoff's §13 census deliberately does **not** strip comments |
| 3 | Stories and `__tests__` are Tailwind-scanned | read `globals.css:1-25` `@source not` list | **Confirmed** — only `../../docs`, `../../tasks`, `../../scripts` excluded |
| 4 | The compiled `/80` fallback is the degraded D35 tier | extracted the raw slice around `.bg-status-info\/80` from `.next/static/css/9da9f59077fdb31e.css` | **Confirmed.** `background-color:var(--status-info)` + `@supports (color:color-mix(in lab,red,red))` override. Not a composited hex |
| 5 | The degradation's cause | `globals.css:80-81` declares `--color-status-info: var(--status-info)` | **Confirmed** — a runtime `var()` alias, D35's exact stated mechanism |
| 6 | The `#0000004d` idiom in the pattern module is **not** transferable | read `MantineListingCardPattern.module.css:339-346`; `globals.css:455` declares `--overlay: oklch(0 0 0)` | **Confirmed** — a literal, so Tailwind could composite it. The status tokens are not literals to Tailwind |
| 7 | `ListingCard.module.css` is layered, the pattern module is not | read both file headers (`ListingCard.module.css:9-22`) | **Confirmed**, with the D34 intent distinction stated in-file |
| 8 | `cn` is `twMerge(clsx(...))` | read `src/lib/utils.ts:4-6` | **Confirmed** |
| 9 | `.overlayLabel` sets neither `background-color` nor `border-color` | read `MantineListingCardPattern.module.css:348-359` | **Confirmed** — `color`, `font-weight`, `font-size`, `line-height`, padding, radius, `rotate`, `border-style`, `border-width` only. Kickoff still requires an I0 re-measure (freshness, not first verification) |
| 10 | 8 other consumer files of the `status-(info\|rented)` utility family | recursive scan of `src/**`, excluding the 4 sites in row 2 | **Measured 8.** Backlog says "9 other consumers" — **not reproduced**; corrected in the kickoff header |
| 11 | No `@theme` entry loses its last consumer | row 10, plus `grep var(--color-status-` across `src/` | **Confirmed** — 8 files remain; `var(--color-status-*)` has **zero** references anywhere in `src/` |
| 12 | `var(--status-info)`/`var(--status-rented)` currently appear only in `globals.css` | `grep -rl` across `src/` | **Confirmed** — hence the predicted Arm B +2 in `check:css-vars` |
| 13 | `ListingCard.tsx` is a critical-flow subject | read `docs/critical-flow-registry.md:57` in full | **Confirmed** — Tasks 602/605, suite `ListingCard.smoke.test.tsx`, coverage text names "sold-listing overlay+disabled-favorite" |
| 14 | `ListingCard.stories.tsx` renders no closed listing | read the file (126 lines, single `Default` export, one fixture, `status: 'active'` at `:80`/`:89`) | **Confirmed** |
| 15 | `ListingCardPattern.stories.tsx` renders a sold card with a fabricated className | read `:113-144` | **Confirmed** — `:120` constructs the literal |
| 16 | No story anywhere imports a `*.module.css` | `grep -rn "module.css" src/stories/` | **Confirmed — zero.** This is why the kickoff routes the colour proof through `ListingCard.stories.tsx` (the real component) rather than making the pattern story import an app module, which would be an unprecedented layer inversion |
| 17 | Both §13 census commands run and return their stated I0 values | executed both against `6ecfcf213` | **Source census `TOTAL 9` across 4 files; compiled census `TOTAL 6`.** Both are stated in the kickoff so a broken census is distinguishable from a clean result |

### Commands that failed inspection and were fixed before publication

Two of the kickoff's own §13 commands were defective in the first draft and were corrected only
because they were executed rather than reasoned about. Recorded here because the orchestrator
failure this repo tracks is precisely a kickoff command nobody ran:

- **Source census.** `border-status-info\b` also matches `border-status-info/20` and `/30` — the
  word boundary sits between `o` and `/`. The command reported **18 occurrences across 8 files**,
  sweeping in `badge.tsx`, `AdminListingsTable.tsx`, `ListingDetailView.tsx` and
  `ListingStatusBanner.tsx`, none of which this task touches. Fixed with a trailing
  `(?![\w\/-])`; the kickoff states both the correct value (9) and the broken one (18) so the
  executor can tell them apart.
- **Compiled-rule census.** The escaped `\/` of the compiled selector cannot be written inline in a
  `/…/` literal inside a shell-quoted `node -e`; the command died with
  `SyntaxError: Invalid regular expression flags`. Rebuilt as `new RegExp` from a string.

### Absence-claim traces (SKILL.md §"Gather evidence", API/data-flow requirement)

- **"`overlay.className` has exactly one production producer."** Traced the root prop, not a
  same-named nested field: `MantineListingCardOverlay` is declared at
  `MantineListingCardPattern.tsx:36-40`; `overlay?: MantineListingCardOverlay` at `:80`; destructured
  at `:139`; read only at `:314-317`. Every construction path: `ListingCard.tsx:267-269`
  (production), `ListingCardPattern.stories.tsx:119-120` (story), and
  `MantineListingCardPattern.smoke.test.tsx:46`/`:105` (test, one `undefined` and one literal). The
  type is re-exported at `patterns/index.ts:37`, so the prop is public API — which is precisely why
  its shape is out of scope here and deferred to the owner as OQ3.
- **"`layout='list'` renders no overlay."** Not inferred from the prop being optional: read
  `MantineListingCardPattern.tsx:152` (the comment stating `overlay` is intentionally not rendered
  in the list branch) and the standing assertion at
  `MantineListingCardPattern.smoke.test.tsx:104-105`. Recorded as a negative branch the task must
  keep true, not as a fact the task may rely on silently.

## B. Rule-compliance ledger

Rule bundle selected from `docs/rule-index.md`: Always Required, Current Mantine path, Storybook /
Visual Proof, Regression / Critical Flow Coverage. Legacy Tailwind Styling Governance is **not**
selected — `ListingCard.tsx` is on the current Mantine path and the surface being retired is a
D28 module migration, not a legacy-Tailwind surface.

| # | Rule / decision | Status | How the kickoff complies |
|---|---|---|---|
| 1 | **D28** — de-hybrid is mechanism-only, zero visual delta | `COMPLIANT` | §2 states it; R2/AC2 measures it including the `@supports`-off tier |
| 2 | **D34** — a D28 module reproduces the utility's cascade **layer** | `COMPLIANT` | §3.4 sends the rules to the layered `ListingCard.module.css` and forbids the pattern's unlayered module; AC4 asserts `@layer utilities` |
| 3 | **D35** — a `@theme inline` value aliased to a runtime `var()` degrades the opacity-modifier static fallback | `COMPLIANT` | §3.3 quotes the already-degraded compiled output and requires reproducing it; the hex idiom is explicitly forbidden |
| 4 | **D36** — record `/[locale]` First Load JS before and after; stop on any increase | `COMPLIANT` | §10.1, AC9, and a stop condition in §10.8 |
| 5 | **D32** — a migration may not be proven against a comparator not shown to fail | `COMPLIANT` | AC2 requires the plant on the after side; §10.2 additionally requires the BEFORE-identity assertion that 695's F2 found missing |
| 6 | `docs/agent-contract.md` **clause 15** — critical-flow suite runs, real result recorded, file unmodified | `COMPLIANT` | §3.9, R8/AC8, and `git status --porcelain` absence as the witness |
| 7 | `docs/storybook-governance.md` §8 — single `Default` export per story family | `COMPLIANT` | §3.8 extends the existing `Default` export's grid section; no second export |
| 8 | SKILL.md permanent-story creation gate | `COMPLIANT` | §3.8 records inspected candidates (`ListingCardPattern.stories.tsx`, `ListingCard.stories.tsx`), why neither suffices post-migration, the in-scope production consumer (`ListingCard.tsx:267-269`) and the quoted, dated owner authorisation |
| 9 | `docs/qa-profiles.md` Q3 matrix binds the rendered surface | `COMPLIANT` | §13 pins 4 canonical Mantine widths × 4 locales and names 695's F8 as the failure being avoided |
| 10 | Orchestrator corollary — a kickoff's own measured facts are not exempt | `COMPLIANT` | Two backlog figures failed re-derivation and are corrected in the kickoff header rather than repeated |
| 11 | Owner-exception traceability | `COMPLIANT` | Three owner decisions of 2026-08-14 quoted verbatim; OQ3 explicitly deferred and marked do-not-act |
| 12 | `docs/qa-rules.md` encoding hygiene | `COMPLIANT` | AC9 requires `check:mojibake` and `check:file-integrity` transcripts from this task's own run |

No rule was weakened, reinterpreted or replaced. No task-authored exception is claimed.

## C. Executable-route contract — one active route

**Route (active).** Move the two values into `ListingCard.module.css` as `@layer utilities` rules
reproducing the compiled two-tier output with `var(--status-*)`; remove the four strings from all
four sources; keep `className?: string` and re-prove it with a non-Tailwind hook class; add closed
listings to `ListingCard.stories.tsx` for the colour proof.

**Routes considered and closed by the owner on 2026-08-14, retained for traceability only:**

- *`tone` prop replacing `className`* — closed: *"Не замінювати його tone-пропом і не вирішувати це
  всередині 741."* Also technically disfavoured: the pattern's module is unlayered, so a D28
  migration placed there would change cascade standing (D34).
- *Producer-only migration, leaving the story and test on raw Tailwind* — closed: the census never
  reaches 0 and the proof path stops proving production. 702's kickoff §3.2 had already rejected it.

The kickoff's scope, ACs, verification plan, report contract and handoff all derive from the active
route only.

## D. Checkpoint matrix

| Checkpoint | Producer | Persisted output | Comparator | Failure behaviour |
|---|---|---|---|---|
| Source census (4 strings) | §13 command, comments **included** | transcript, 3 points | expected 4 → 0 → 0 | non-zero after step 4 blocks progress (§10.4) |
| Compiled-rule census | §13 command over `.next/static/css` | transcript, 3 points | expected non-zero at I0 → 0 → 0 | a census that never returned non-zero is not evidence (§13) |
| Rendered equivalence | two-phase comparator | result JSON + run log | per-cell string equality, sold **and** rented, 4 widths × 4 locales × 2 phases | exit non-zero on any moved/missing/errored/short cell |
| Comparator self-test | same, `--plant` | planted JSON + run log | expected non-zero exit | a plant that passes invalidates AC2 |
| BEFORE-phase identity | comparator precondition | run log | BEFORE bundle contains the four strings, AFTER contains none | fail closed — this is 695's F2, pre-empted |
| `@supports`-off tier | probe with the block disabled | transcript | before == after | any delta is a stop condition |
| Resolved class list | comparator, both phases | result JSON | equal sets | a `twMerge` difference is a stop condition (§10.8) |
| Pass-through contract | rewritten story + smoke test | test transcripts | hook class present on the overlay element | each assertion shown failing on a planted violation (AC6) |
| Critical flow | `ListingCard.smoke.test.tsx` | transcript | pass + file absent from `git status --porcelain` | any edit to the file fails AC8 |

Dynamic state checked in both directions: the census is required to return **non-zero at I0** and
zero at the end, so a silently-broken census cannot pass as a clean result.

## E. Publication gate

- A fresh Sonnet can execute it: every line number, compiled rule, command, viewport set and
  ordering constraint is in the kickoff. **Yes.**
- Every primary requirement has a binary AC: R1–R9 → AC1–AC9. **Yes.**
- The task does not claim an uninspected command, file, value or behaviour: §A above is the trace;
  the two claims that failed re-derivation are corrected, not repeated. **Yes.**
- No material fact is asserted `Confirmed` whose first verification is deferred to the executor:
  rows A9 and A10 are author-verified and the kickoff labels their I0 re-measure as freshness
  validation, not first proof. **Yes.**
- Assumptions and unresolved decisions are visible: A1–A3, OQ1–OQ3. **Yes.**

## F. Owner decisions still needed

None blocking. **OQ3** (whether `overlay.className` should eventually become a `tone` prop) is
recorded as owner-only and deferred; it does not gate execution of this task.
