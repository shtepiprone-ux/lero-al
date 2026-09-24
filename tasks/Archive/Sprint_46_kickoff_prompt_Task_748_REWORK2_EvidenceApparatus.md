# Task 748 REWORK 2 — the code is right; the apparatus that proves it is not

**Status: `REWORK` (round 3, narrow).** 695 stays blocked.
Review of record: `docs/reviews/2026-08-13-task748-rework-overlay-utility-exit.review-ledger.SUPERSEDED.json`
(`NEEDS REVISION`, gate `PASSED`/0, `commitPush: PROHIBITED`, **1 open P0**, 3 open P1, 4 open P2).
Round 1 ledger retired to `…-task748-overlay-utility-exit.review-ledger.SUPERSEDED.json`.
Reviewer evidence: `docs/reviews/artifacts/2026-08-13-task748-round2/` — re-runnable, but **not yet
committed**, so it does not resolve from a clone either. Same defect as G8, charged to the reviewer's
own set as much as to yours.

---

## 1. Where this stands

**Do not touch `src/`.** Both fixes are correct and were re-derived independently, not read from
your report:

- **RR1 — VERIFIED.** All four branches checked with the project's own `cn()` against the real
  expressions from both trees. Over-budget: byte-identical class lists. Under-budget: clean
  utility→module swap. `rr1-branch-equivalence.txt`, exit 0.
- **RR2 — VERIFIED.** The module rule reproduces the measured pre-migration cascade exactly,
  `@media (hover: hover)` guard included. Both N/A state claims re-measured and both hold:
  `aria-expanded` appears nowhere in base-ui's `Button` and is not passed at the call site;
  `@custom-variant dark (&:is(.dark *))` is class-based and nothing in `src/` ever applies `.dark`.
  The owner has confirmed the authorisation directly — see G6, which is now only a citation gap.
- **RR5 — VERIFIED.** All 7 references named and correctly scoped out.
- **RR6 — UNVERIFIED (G8).** The relocation out of `.screenshots/` is done and correct, and it is what
  finding F-F asked for. But AC6's binding clause is *"resolves from a fresh clone"*, and the artifact
  set is untracked, so the criterion is currently false rather than merely unproven. An earlier issue
  of the ledger graded this VERIFIED on the relocation alone — reviewer's error, corrected.
- **RR3 Part A — accepted, and it is the good part.** A genuine live/live diff: the BEFORE element
  resolved by its pre-migration Tailwind class in a clean I0 storybook build, the AFTER by its
  hashed module class, both real `getComputedStyle`, diffed directly. 168 cells, 0 moved. The plant
  corrupts the AFTER side in both parts and reddened both times. That is what RR3 asked for.

Also right, and worth saying: you surfaced and documented four of your own harness bugs
(Storybook per-story CSS chunking, the zero-height body, the webpack-vs-Vite module-name
convention, the piped exit code) instead of hiding them. That is why Part A can be trusted.

**What remains is entirely in the evidence apparatus.** Five findings, none of them a rendered
regression, all small. The theme is one you have now hit three times in a row: *a fixture asserted
as a measurement.*

---

## 2. Requirements

| ID | Priority | Requirement | AC |
|---|---|---|---|
| RW1 | P1 | The RR4 regression gate can fail on the three sites it exists to protect | AC1 |
| RW2 | P1 | The RR4 artifact and the report agree on how many sites moved | AC2 |
| RW3 | **P0** | The comparator refuses to score an unresolved custom property as a match | AC3 |
| RW4 | P2 | Part B's className fixtures match the real class lists, or the claim that they do is withdrawn | AC4 |
| RW5 | P2 | The comparator is re-runnable from a fresh clone | AC5 |
| RW6 | P2 | §R3 cites the RR2 authorisation | AC6 |
| RW7 | **P1** | The evidence set is committed, so AC6's fresh-clone clause is actually true | AC7 |

### RW1 — the gate cannot currently fail (G1)

`twmerge-class-resolution-all18.mjs:89`:

```js
const isKnown = [...KNOWN_FIXED].some(k =>
  c.id.startsWith(k.split(' ')[0]) || c.id.includes('priority row')
  || c.id.includes('predictive row') || c.id.includes('photoCountButton'));
```

The last three clauses do not depend on `k`, so **any** case at those three sites is forgiven
unconditionally. Proof, in your own harness with only the RR1 fix reverted:

```
$ node docs/reviews/artifacts/2026-08-13-task748-round2/g1-gate-blindness-probe.mjs
>> DELTA  E6b …  after : Component_metricRow__h4sh text-destructive font-bold
Elements checked: 19, moved: 3, unexpected (not already known/fixed): 0
EXIT_CODE=0
```

A complete regression of F-A passes, with a summary line identical to the green run. This is the
Sprint 52 defect class by name: a blocking gate that silently never fires.

Key the whitelist on the **expected delta signature** per site — for E6b/E7b the expected signature
is *no delta at all*; for E12 it is exactly `text-foreground hover:bg-muted` newly surviving and
nothing else. A different delta, or a delta where none is expected, must redden.

### RW2 — the artifact contradicts the headline (G2)

E6b and E7b print `>> DELTA … !! OVERLAY DECLARATION ADDED` on rows whose before and after strings
are byte-identical (`text-destructive font-bold`). The detector only asks whether an overlay
utility reached the element *before*; it never checks whether the after side carries a module
class. That assumption came from the reviewer's round-1 nine-case witness and stopped holding the
moment RR1 began omitting the module class conditionally — **the reviewer's bug, inherited.** Fix
the detector.

Then fix the prose. The summary currently says the DELTAs are expected because "RR1/RR2 fixed them
at the CSS-module level, not by restoring the deleted-utility className behavior." For E6b/E7b that
is simply wrong: `!priorityOver && styles.metricRow` **is** restoring it, which is exactly what RW1
of the previous round asked for and exactly what you built. `moved:` should read **1**, and the
submission's "class-list identity … zero delta" claim should then match its own artifact.

### RW3 — the comparator scores an unresolved variable as a match (G3) — **P0**

Both PerfDevOverlay Part B cells report `rgb(0, 0, 0)`. Cause:

```
.text-destructive{color:var(--destructive)}
globals.css:411   --destructive: var(--brand-900)          (inside :root)
globals.css:365   --brand-900:   var(--mantine-color-brand-9)
--mantine-color-brand-9 present in .next/static/css ?  NO   ← MantineProvider injects it at runtime
```

So the chain is unresolved, the declaration is invalid at computed-value time, and `color` falls
back to the UA default for a `<button>`. §R2 attributes this to "a purpose-built reduced stylesheet
vs the full concatenated bundle" — that is the symptom. It also cites `oklch(0.58 0.22 27)` as the
reviewer's measurement of "the real production value": that was a **placeholder** in the reviewer's
own harness, now labelled as such. The real value is `#8E322B`. (Reviewer's error, corrected in
`docs/reviews/artifacts/2026-08-13-task748/`.)

**This is the one P0 in the round.** RR3/AC3 required a comparator that measures real before/after
values or fails closed; for this witness it does neither — it scores the fallback as agreement. The
cell would still have caught an unfixed state, because the module rule resolves without Mantine's
runtime variables, which is why the defect is in the apparatus and not in what ships. But a
fail-closed comparator that accepts an initial-value fallback as agreement is the exact false-green
shape this task exists to remove.

Either inject Mantine's runtime custom properties into the harness page, or assert that a measured
value is not the property's initial/UA default and fail the cell if it is. Then correct §R2's
diagnosis.

### RW4 — a false provenance claim (G4)

`real-before-after-comparator.mjs:38-40` says the Part B className strings are "verified
byte-identical against `twmerge-class-resolution-all18.mjs`'s output, not invented." For the two
ListingGallery witnesses the BEFORE fixture carries `text-foreground` and `hover:bg-muted`, which
real tailwind-merge deletes — as E12 in that same folder shows. The measured colour is right anyway,
because `.text-overlay-foreground` (byte 46187) source-orders after `.text-foreground` (44970) at
equal specificity. Right by luck, on a fact the fixture does not encode.

Derive the strings by calling `cn()` at runtime, or withdraw the byte-identical claim and state
plainly that they are hand-authored fixtures. Either is acceptable; asserting a provenance the
artifact does not have is not.

### RW5 — not reproducible from a fresh clone (G5)

`BEFORE_STATIC` (:57) and `buildHarnessCss`'s argument (:292) hardcode
`C:/Claude_Code_Projects/lero-al-i0-d3ffd6/…`, an absolute machine-local path outside the
repository. Both paths **do currently exist** on the owner's machine — an earlier draft of this
finding claimed the export had been deleted and that was the reviewer's error, corrected. The
defect is narrower and still real: the harness runs only on the machine holding that export at that
exact location, so nobody can reproduce the result from a clone, and nothing in the repo records
what the path should contain.

Take the I0 revision as an argument and create the export itself via `git archive`, or resolve the
path relative to the repo root and fail with a clear actionable message when it is absent.

### RW7 — commit the evidence (G8) — **P1**

`git ls-files` returns **0** for `docs/reviews/artifacts/2026-08-13-task748-rework/`, for
`…-task748-round2/`, and for the round-2 ledger; all three are `??` in porcelain. A clone of this
repository contains none of them, so AC6 of the previous round — *"every evidence path the report or
a ledger cites resolves from a fresh clone"* — is not merely unproven, it is false.

**Staging is not the closing action.** A staged-uncommitted file is still absent from every clone.
The closing action is a **docs-only commit** of the artifact set, exactly as was done for the
round-1 folder in `ce22b1b5e`. That is available now: `commitPush: PROHIBITED` governs the `src/`
change set under review, not the evidence record about it. Commit the evidence; leave `src/` and
`docs/backlog.md`'s status rows for the owner.

Until that commit exists, no report may call these paths *tracked* or *fresh-clone resolvable*.
(AC6's own second clause said "staged, not `??`" — weaker than its first clause and, on reflection,
wrong. The fresh-clone clause governs. Reviewer's wording error.)

### RW6 — cite the authorisation (G6)

§R3 records the RR2 owner answer as prose with nothing to point at. The owner has confirmed it to
the reviewer, and
`docs/reviews/2026-08-13-task748-rework-overlay-utility-exit.review-ledger.SUPERSEDED.json` finding **G6** is
that citation. Reference it from §R3 so the record is self-contained. Nothing else about RR2 changes.

---

## 3. Acceptance criteria

- **AC1 [RW1]** — `g1-gate-blindness-probe.mjs`, or any equivalent revert of the RR1 fix, makes the
  RR4 gate exit **non-zero**. Show the reverted run failing and the real tree passing, both with
  exit codes.
- **AC2 [RW2]** — E6b/E7b report no delta; the summary reads `moved: 1`; the report's prose matches.
- **AC3 [RW3]** — the PerfDevOverlay witness either measures a resolved value or fails the cell;
  a run with `--mantine-color-brand-9` deliberately absent must redden. §R2's diagnosis is corrected.
- **AC4 [RW4]** — either the fixtures are computed and shown identical to `cn()`'s output, or the
  header no longer claims they are.
- **AC5 [RW5]** — `node …/real-before-after-comparator.mjs` runs on a clone with no pre-existing I0
  export — creating it itself — or exits with a clear actionable message naming the revision it
  needs. No absolute machine-local path remains in the script.
- **AC6 [RW6]** — §R3 cites the ledger finding.
- **AC7 [RW7]** — `git ls-files` returns non-zero counts for every artifact directory and ledger the
  report cites, and the report quotes those counts. A `git archive HEAD | tar -t` spot-check, or an
  equivalent, shows the paths present.
- **AC8** — the report states, per path, whether it is committed, staged, or merely non-ignored, with
  the `git ls-files` count beside it. Do not describe an uncommitted file as "tracked" — `git ls-files`
  is the test, not `.gitignore`, and not `git add`.
- **AC9** — `src/` is untouched. Census still 0, `globals.css` diff still empty, standing gates and
  `check:review-ledger` still green. Round-1 and round-2 reviewer artifact folders untouched.

## 4. Out of scope

Everything from the previous two kickoffs, plus: **any change under `src/`** — the evidence commit
required by RW7 is docs-only and must not carry a single `src/` path. RR1 and RR2 are
verified — do not "improve" them. Do not edit either reviewer artifact folder or either ledger.
Do not mark 695 unblocked.

## 5. Completion report contract

Append a `§REWORK2` section. RW1–RW6 with actual results and exit codes; the corrected `moved:`
count; the corrected §R2 diagnosis; status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`.

**One thing to internalise.** Round 1's comparator compared your rule against your own intention.
Round 2's gate forgives the sites it was built to watch, and its witness agrees with itself about a
colour neither side can resolve. Both times the number came out right and both times the mechanism
that produced it could not have come out wrong. A check that cannot fail is not evidence — it is a
restatement of the claim. Before you submit, take each artifact and ask: *what would have to be
broken for this to redden?* If the answer is "nothing", that artifact is the defect.
