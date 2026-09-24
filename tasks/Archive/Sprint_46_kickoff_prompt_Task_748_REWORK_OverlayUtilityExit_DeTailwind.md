# Task 748 REWORK — the overlay migration changed two rendered colours, and the comparator could not see either

**Status of the parent submission: `REWORK`.** Not approved. 695 stays blocked.
Review of record: `docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json`
(decision `NEEDS REVISION`, gate `PASSED`/0, `handoff.commitPush: PROHIBITED`).
Reviewer evidence: `docs/reviews/artifacts/2026-08-13-task748/` — non-ignored and re-runnable; stage it with the package.

---

## 1. Mode and task type

Remediation of an existing, **uncommitted** change set. Base `d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f`,
branch `task/q0-ci-rendered-locale-split`. Do **not** revert the parent work — most of it is sound
and §2.1 lists exactly what carries forward untouched.

## 2. What actually happened

The migration is mechanically excellent and factually honest: the census really is 0, `globals.css`
really is untouched, the D35 two-rule reproductions really are byte-correct including the
`@media (hover: hover)` wrapper, and **both corrections you made to the kickoff were right** — §3.6's
story-backing table really was inverted, and R11 really did undercount. Those corrections were the
right instinct and they are kept.

The defect is a single wrong model, applied consistently. **§4 defined the D34 contest as "is there
ancestor or component CSS setting this property on this element?"** The real contest is broader,
because `cn()` is `twMerge(clsx(...))` (`src/lib/utils.ts:4`):

- a Tailwind utility in a `className` **participates in tailwind-merge conflict resolution**;
- a hashed CSS-Modules class **does not**;
- and the emitted module chunk is **unlayered**, so it outranks every `@layer utilities` rule
  regardless of specificity or source order.

Migrating a utility into a module therefore changes *which declarations reach the element*, not only
where they live. Three of the 24 sites moved. §4's headline is **not** 24 winners / 0 losers.

### 2.1 Carries forward untouched — do not redo, do not regress

R1 (census 0), R3 (D35 rule text), R5 (`:root` sourcing), R6 (`globals.css` diff empty) are all
`VERIFIED` in the ledger, re-measured by the reviewer. The module files' rule bodies, the
`@media (hover: hover)` reproduction, the `:root` variable choice, the §3.6 correction and the R11
expansion all stand. So does the decision to migrate `PerfDevOverlay` (OQ1, owner, 2026-08-13).

---

## 3. Requirements

| ID | Priority | Observable requirement | AC |
|---|---|---|---|
| RR1 | P0 | `PerfDevOverlay`'s two budget rows render their over-budget colour again | AC1 |
| RR2 | P0 | `ListingGallery.tsx:123` is recorded as a hover-state D34 **loser** and dispositioned by the owner, not silently | AC2 |
| RR3 | P0 | A real before/after comparator replaces the synthetic-probe one, fail-closed, with witnesses for both regressed sites | AC3 |
| RR4 | P0 | The D34 pass is re-run under the corrected contest definition and §4's verdict restated | AC4 |
| RR5 | P1 | The 695 handoff names all 7 live `var(--color-overlay*)` references | AC5 |
| RR6 | P1 | Harness, before/after JSON, diff and text transcripts are **tracked**, not only in `.screenshots/` | AC6 |
| RR7 | P0 | Nothing in §2.1 regresses | AC7 |

### RR1 — `PerfDevOverlay` over-budget rows (P0)

`PerfDevOverlay.tsx:76` and `:81`. Before the change,
`cn('text-overlay-foreground/70', priorityOver && 'text-destructive font-bold')` resolved to
`"text-destructive font-bold"` — tailwind-merge **deleted** the overlay utility, so the row rendered
`var(--destructive)`. After, `cn(styles.metricRow, priorityOver && 'text-destructive font-bold')`
keeps both classes and the unlayered module rule wins, so the row renders 70% white. The warning
signal is gone; `font-bold` still lands, which is why it reads as fine by eye.

Measured: `oklch(0.58 0.22 27)` → `oklab(1 0 0 / 0.7)`
(`docs/reviews/artifacts/2026-08-13-task748/cascade-repro.txt`).

**Preserve the previous conditional composition.** The minimal faithful form reproduces the old
tailwind-merge result rather than fighting it:

```tsx
cn(!priorityOver && styles.metricRow, priorityOver && 'text-destructive font-bold')
```

An equivalent alternative is a second module rule (`.metricRowOver { color: var(--destructive) }`)
selected between module classes. Either is acceptable; a rule that merely *raises* the destructive
colour back over the module class is not — it leaves both declarations on the element and makes the
outcome depend on layer order again.

Apply to **both** rows. Prove each with `priorityOver = true` and `predictiveOver = true`, not by
argument.

### RR2 — `ListingGallery.tsx:123` is a D34 loser, and the disposition is the owner's (P0)

The `ghost` variant emits `hover:text-foreground`. tailwind-merge kept it on both sides (it never
conflicted with anything in the local `className`), and in `@layer utilities` it beats
`.text-overlay-foreground` on specificity — `0-2-0` vs `0-1-0`. **So in the hover state the migrated
utility was losing.** The unlayered module rule promotes it.

Measured hovered `color`: `oklch(0.15 0 0)` → `oklch(1 0 0)`; `background-color` unchanged at
`oklab(0 0 0 / 0.7)`.

Do **not** classify this as a latent contrast fix and absorb it. §3.4 and §10.3 of the parent
kickoff are explicit: a loser is left as a literal Tailwind class and reported, never migrated.
**Stop and ask the owner.** Present exactly two dispositions and implement the one chosen:

- **(a) Leave the utility.** `text-overlay-foreground` stays a Tailwind class on that Button. The
  hovered colour is bit-identical to today. Consequence, stated plainly in the report: **AC1's
  census no longer reaches 0 and 695's exit condition does not close on this task.**
- **(b) Owner authorises an exact-equivalence implementation.** The module reproduces the *losing*
  outcome as well as the winning one — i.e. it must also carry the hovered `var(--foreground)`
  colour, or be layered so the existing `hover:text-foreground` keeps winning. Requires recorded
  before/after values for rest and hover, and an owner-decision artifact cited in the report.

Report the question with both consequences. Do not pick for the owner, and do not proceed on this
site until it is answered.

### RR3 — a real before/after comparator (P0)

The submitted harness (`capture-and-compare.mjs:147-164`) compares each migrated element against a
**synthetic probe carrying the intended declaration text**. That answers "does my new rule produce
the colour I meant?" It cannot answer "does this element render what it rendered before?", so the
whole F-A/F-B failure mode is invisible to it. `--plant` (line 155) corrupts that *expected* side,
never the subject, so the can-fail proof never exercises the thing under test. §10.5 asked for a
capture **before and after**; §6 substituted this and did not list the substitution among §11's
deviations, while asserting it is *stronger* than a live/live diff.

The replacement must:

1. **Capture two real phases.** A clean I0 worktree at `d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f`
   and the final tree. Real elements on both sides, same script, same matrix. Task 691R's 240-tuple
   envelope against a clean base worktree at `2ad067bc1` is the worked precedent — read
   `docs/sessions/2026-08-12-task691R-remediation.md` before writing a line of it.
2. **Fail closed.** Non-zero exit on any moved property, errored cell, missing cell, missing class,
   missing element, or short phase. A script that only writes JSON is a report, not an assertion.
3. **Plant against the after-side.** Corrupt the *subject* — a module declaration in the final tree
   — and show the comparator reddens. Planting the expectation does not count.
4. **Carry dedicated witnesses for the two regressed sites**, which the 168-cell matrix
   structurally does not contain:
   - `PerfDevOverlay` budget rows, with `priorityOver = true` **and** `predictiveOver = true`
     (the dev-only guard means you will need a story, a harness page, or a forced-props probe —
     say which, and note that §8 still forbids creating a permanent Storybook story);
   - the mobile `ListingGallery` photo-count Button, in **rest and hover**, below 768px on a
     `(hover: hover)` pointer.
5. **Keep the surviving coverage.** The three story-backed sites already at 168 cells stay; they
   were never the problem.

`docs/reviews/artifacts/2026-08-13-task748/cascade-repro.mjs` is the reviewer's fail-closed witness
for the same two sites. It is a reduced-stylesheet reproduction, not a substitute for a real
two-phase capture — but it is short, it exits non-zero, and its control site is in the same run.
Read it; do not copy it as the deliverable.

### RR4 — re-run D34 under the corrected contest definition (P0)

The contest is **everything that determines the final computed value on this element**, not only
ancestor or component CSS. At minimum:

- same-element conditional utilities resolved by `cn()` / tailwind-merge (the F-A class);
- `hover:` / `focus:` / `aria-*:` / `dark:` **variants** of the component's own `cva` classes, whose
  specificity can exceed the plain utility in the same layer (the F-B class);
- classes that only *appear* once the migrated utility stops merging them away.

Re-measure all 24. `docs/reviews/artifacts/2026-08-13-task748/twmerge-class-resolution.mjs` prints
the resolved class list per site and its six controls came back stable — reuse the method, extend it
to every site whose `className` is built by `cn()` with more than one argument, since that is exactly
the set where tailwind-merge could have been doing work. §4's headline becomes **21 winners, 3 moved
sites**, or whatever the re-measurement actually returns — but not 24/0.

### RR5 — the 695 handoff (P1)

The utility census really is 0 and the bundle really does retain only the two scanner-visible
strings (`.bg-overlay`, the two-tier `.bg-overlay\/95`) — the reviewer confirmed both. But the
namespace also has **7 live static `var()` references**:

```
LightboxView.tsx:46,:47,:48,:49   LIGHTBOX_ACTION_ICON_STYLE --ai-* custom properties
LightboxView.tsx:87               Modal.Content scrim, color-mix(… var(--color-overlay) 95% …)
LightboxView.tsx:160              active thumbnail borderColor
MantineListingGalleryPattern.tsx:93   Text c="var(--color-overlay-foreground)"
```

`--color-overlay*` is declared **only** in the `@theme inline` block 695 deletes; `:root:470-471`
carries `--overlay`/`--overlay-foreground` alone. These are the real remaining obstacle to 695's
namespace deletion.

**They are out of Task 748's scope. Do not migrate them** without an explicit scope extension —
§8's boundary stands and `globals.css:72-74` already records why the `:root` copy must emit
unconditionally. What must change is the **report**: §10 and §12 currently leave 695 believing the
two comment mentions are the only remainder. Name all seven, say they are out of scope, and let 695
decide.

### RR6 — tracked evidence (P1)

Every path §7 and §12 cite lives under `.screenshots/task748-overlay/`, excluded by
`.gitignore:55`, so none of it resolves in CI or a fresh clone. This is the defect Task 691's review
recorded as **F-U** and closed by moving 38 files into tracked
`docs/reviews/artifacts/2026-08-12-task691R/` (`docs/backlog-archive.md:11`).

At re-submission the harness, the before/after JSON, the diff and the text transcripts must be
**tracked** under `docs/reviews/artifacts/2026-08-13-task748-rework/`. Do not write into
`docs/reviews/artifacts/2026-08-13-task748/` — that folder is the reviewer's and is already cited by
the ledger. Large binary captures stay out; transcripts, harnesses and result JSON go in.

---

## 4. Acceptance criteria

- **AC1 [RR1]** — *Given* `PerfDevOverlay` with `priorityOver = true`, *then* the priority row's
  computed `color` equals its pre-migration value, and the same holds for the predictive row with
  `predictiveOver = true`; both are captured in the RR3 comparator's real before/after run, not
  argued.
- **AC2 [RR2]** — *Given* `ListingGallery.tsx:123`, *then* the report records it as a hover-state
  D34 loser with its contesting declaration named (`.hover\:text-foreground:hover`, `@layer
  utilities`, specificity 0-2-0), the owner question is posed with both consequences, and whichever
  disposition the owner chose is implemented with before/after values for rest **and** hover.
- **AC3 [RR3]** — *Given* the new comparator, *then* it captures a clean I0 worktree and the final
  tree, compares real elements in both phases, exits non-zero on any moved/missing/errored/short
  result, is shown to fail with a plant applied to the **after-side**, and includes the two
  witnesses named in RR3.4. Its clean run reports `diffCount: 0` with every tuple accounted for.
- **AC4 [RR4]** — *Given* the re-run D34 pass, *then* all 24 sites carry a measurement made under
  the corrected contest definition, every moved site is listed with the declaration that moved, and
  §4's summary line states the real winner/loser split.
- **AC5 [RR5]** — *Given* the report, *then* all 7 live `var(--color-overlay*)` references are named
  with file and line, marked out of scope, and handed to 695; and no `src/` file outside the parent
  scope was modified.
- **AC6 [RR6]** — *Given* the re-submission, *then* every evidence path the report or a ledger cites
  resolves from a fresh clone; `git status --porcelain` shows the artifact folder staged, not `??`.
- **AC7 [RR7]** — *Given* the final tree, *then* the census is still **0** (subject to RR2's
  disposition — if the owner chooses (a), the census is **1** and the report says so in the same
  breath as AC1's number), `git diff src/app/globals.css` is still empty, the six modules still read
  `var(--overlay)`/`var(--overlay-foreground)` only, and the D35 rule bodies are unchanged.

---

## 5. Standing gates

Unchanged from the parent: `npm run build` exit 0 with `/[locale]` First Load JS not increased,
`npm run typecheck` exit 0, the full `vitest` suite, the critical-flow
`ListingGallery.portal.smoke.test.tsx` (registry `:105`, unmodified), and
`check:design-tokens` · `check:css-vars` · `check:stories` · `check:mojibake` ·
`check:file-integrity`. `docs/backlog.md` stays ≤80 lines.

Add one: **`npm run check:review-ledger`** must pass. The reviewer's ledger already passes
`--file`; the repo-wide run could not execute on the reviewer's Linux bridge because 691R's
`EXACT_GENERATED` arm needs `lightningcss`'s native binding and `node_modules` holds Windows
builds. Run it natively and record the real result.

## 6. Out of scope

Everything §8 of the parent kickoff excludes, unchanged — plus:

- **The 7 live `var(--color-overlay*)` references.** Report them (RR5); do not migrate them.
- **`docs/reviews/artifacts/2026-08-13-task748/`** and
  `docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json` — the reviewer's record.
  Do not edit, move or supersede either.
- **Unblocking 695.** It stays blocked on this task's review, not its implementation.

## 7. Completion report contract

Same as the parent's §14, plus:

1. RR1–RR7 each with its actual result.
2. The re-run D34 table, all 24 sites, under the corrected contest definition, with the real
   winner/loser split as the summary line.
3. The RR2 owner question, the owner's answer, and what was implemented as a result.
4. The comparator's plant run (after-side) and its clean run, both with exit codes.
5. Every evidence path, all tracked.
6. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **Never self-approve, and do not mark 695
   unblocked** — that is the reviewer's call after this rework is reviewed.

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`.

**One thing to internalise before you start.** You were told last time that your comparator was the
one that had to see the regression, and that if a colour moved and your capture could not show it,
the capture was the defect. Your capture could not show it, and you reported a zero. The reason is
not carelessness — every individual measurement you made was correct. It is that you measured the
rule you wrote instead of the element the user sees, and a synthetic probe built from your own
intended declaration can only ever agree with you. Build the before-side out of the tree as it was.
