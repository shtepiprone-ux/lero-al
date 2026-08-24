# Task 765 — Materialize D63-F: runtime motion/radius tokens, and migrate `AppImage.module.css` onto them

**Sprint:** 64 — Runtime design tokens that survive Tailwind removal · **Phase:** 1 · **Priority:** P1
**Filed:** 2026-08-24 against `main` @ `5372e08a5`, worktree clean

**REVISION 1 — P3′ — `HISTORICAL / SUPERSEDED by Revision 1.2`.** The block below describes the handoff that was
issued and executed; **it is not a current instruction.** Its executor scope ended when P3′ was run and measured
false — see the Revision 1.2 block and §9.4R's banner. Retained verbatim because the record of what was instructed
is part of the evidence.

> *Amended in place 2026-08-24 by the orchestrator, after the executor's measured `BLOCKED`.*
> *Draft 1's §3.3 asserted a "prefix arm" that rescues a deleted or renamed `:root` token when a sibling name
> survives. That mechanism **does not exist**, so draft 1's P3 was unsatisfiable and AC9 could never close. The
> executor measured this, refused to substitute a mutation (A3's escape hatch), and reported `BLOCKED` — the
> correct disposition. The defect is the kickoff author's, not the executor's.*
>
> *This revision replaces §3.3, A3, §9.4's P3, AC9 and §14's two self-certified plant rows. **R1–R8 and R9's P1/P2
> arms are accepted as implemented and evidenced; their source diff and evidence tree are retained — not reverted,
> not re-implemented.** Executor scope under this revision is **only** P3′, its revert proof, and the final §9.3
> clean gate set.* — **superseded: P3′ was executed and went `exit 0`; §9.4S's P3″ is the control that closed R9.**

**Revision 1.1 — documentation only, 2026-08-24.** Makes the Revision 1 handoff executable without touching its
mechanism: the I0R expected worktree is stated exactly, §9.0R's precedence over §9.0 is explicit, the re-run
attestation is redirected to `phase6-platform-attestation.txt` so retained evidence is not overwritten, the
execution order is exhaustive, and the `.git/index.lock` preflight is stated. **No change to §3.3R, §9.4R, AC9,
scope, source, evidence or Git state.**

**REVISION 1.2 — P3″ addendum, 2026-08-24.** The executor ran Revision 1.1 and measured **P3′ false as well**.
The control is now closed by **P3″**, a temporary-copy plant driven through the gate's own documented input seam.
**No further executor run is authorized** (§9.0R, §13).

Three plant forms were attempted against `check:css-vars`, and the record keeps all three, failures included:

| Form | Mutation | Measured outcome |
|---|---|---|
| **P3** (draft 1) | delete / rename `--motion-duration-slow` in `:root` | **FAILED as a control.** The mutation un-owns its own reference; `classifyReferences:468` then skips it on both arms. `exit 0, 0 violations, owned=263`. |
| **P3′** (Revision 1) | move the same declaration from `:root` into `@theme inline` | **FAILED as a control.** Ownership was preserved (`owned=264`, as predicted) but the declaration **still shipped** from `@theme inline`, so nothing dangled. `exit 0, 0 violations`. |
| **P3″** (Revision 1.2) | temporary copied bundle loses that one declaration; real tree untouched | **PASSED.** Gate subprocess `exit 1`, `owned=264`, Arm A **and** Arm B both naming `var(--motion-duration-slow)`. |

Neither failure is deleted, softened or rewritten. P3 was the kickoff author's defect; **P3′ was the orchestrator's
own defect at Revision 1** — a generalization from two unused theme names, corrected in §3.3R and recorded here.

**Status: ✅ `APPROVED WITH NOTES` — orchestrator review, 2026-08-24.** Ledger:
`docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json` — 10/10 primary criteria
`VERIFIED`, 0 open P0/P1/P2. The documented temporary input-seam control (§3.3S) **satisfies Sprint 64 rule 1**:
it drives the production parser through the gate's own `--css-dir`/`--globals-path`/`--src-dir` interface — the same
seam the gate's `--verify-gate` self-test uses — over real ownership, the real consumer, a real clean bundle and the
real target token, and it reddens the gate on exactly the condition AC7 rests on. Three notes remain, none blocking:
**F4** the `:root`-deletion blind spot is unfixed and stays Task 743's; **F5** A2 rests on build success plus
rendered equality, not a compiled-utility diff; **F6** Task 764 still has no archive row. Two resolved P2 findings
(**F1**, **F2**) record the two measured-false author premises, and **F3** records a retained cell count that did not
survive re-derivation. **No further Sonnet execution required.**

---

## 1. Mode, task type, and the decision this implements

`IMPLEMENTATION` · **Design-system / global stylesheet contract change.** Touches `src/app/globals.css`, which every
surface reads, plus one CSS Module.

**Owner decision D63-F, 2026-08-24, quoted:** *"У `globals.css` створюємо project-owned runtime tokens у `:root`;
Tailwind `@theme inline` лишається лише alias-шаром для utility-класів. `AppImage.module.css` споживає тільки
runtime tokens. Phase 5 виконується окремою задачею, не в Task 764."*

**Owner decision D63-D, 2026-08-24, quoted:** *"Phase 5 — окремий спринт/окрема задача, бо змінюється глобальний
контракт `globals.css`. Task 764 не треба переоткривати."*

Both are **decided, not proposed**. This task implements exactly the shape below and invents nothing beyond it. The
executor does not add tokens, does not rename beyond the list, and does not migrate other consumers.

## 2. Objective

Declare the motion and radius values as `:root` custom properties, alias the existing `@theme inline` names to them,
and change `AppImage.module.css` to read the runtime names — with the rendered result proven identical and with
three separate proofs that the gates involved can actually fail.

On completion: `check:design-tokens` exits 0 with no marker and no allowlist entry, `check:css-vars` exits 0, and the
computed `border-radius`, `transition-duration` and `transition-timing-function` on the real `AppImage` are byte-equal
to their pre-edit values.

## 3. Verified context

Measured by the task author on `5372e08a5`, 2026-08-24. Facts marked **I0** are re-measured by the executor before
any write.

### 3.1 The two flagged declarations, and who owns them

| Where | Declaration | Gate category |
|---|---|---|
| `AppImage.module.css:125-127` — `.frameCircle` | `border-radius: 3.40282e38px` | `css-length` |
| `AppImage.module.css:154-161` — `.fade` | `transition-duration: 300ms` (`:160`) | `css-duration` |
| same rule, `:159` | `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` | **not currently flagged** |

`:159`'s easing literal is migrated too, because D63-F's scheme names it. It is not a gate finding today; do not
report its migration as closing one.

**Consumers.** `.frameCircle` is used by exactly one variant — `appImageConfig.ts:116-117`, `avatar`. `.fade` is
applied by `AppImage.tsx:149` to every non-`priority` image.

### 3.2 Why the current tokens are unreadable — the measured cause

`@theme inline` opens at `globals.css:35`. `--duration-{fast,base,slow}` (`:267-269`) and `--ease-{standard,in,out}`
(`:273-275`) sit at **brace-depth 1 inside it**; `:root` does not open until `:327`. A repository-wide search for
`var(--duration-` and `var(--ease-` in `src/` returns **zero** references.

So the scale exists as Tailwind theme values only. This is why every module reproducing a duration inlines a literal
behind a marker. D63-F fixes the cause; this task does not re-litigate it.

### 3.3 `check:css-vars` — how it decides, and the trap that follows

`scripts/check-css-var-resolvability.mjs` (Task 700) parses `globals.css` live for every `--x:` declaration to build
an **owned set**, then checks that every `var(--owned)` resolves to a declaration that actually ships. Two arms: Arm A
over `.next/static/css/*.css`, Arm B over `src/**/*.{css,tsx,ts}` excluding `globals.css`.

Two consequences that decide how P3′ must be built. **Both are `FACT`, read from the enclosing control flow, not
from the cited line alone** — draft 1's defect was reading `:530` without reading the branch that guards it.

1. **`:468` — `if (!ownedSet.has(ref.name)) continue;`** This is the first line of `classifyReferences`, which
   **both** arms call (`scanArmA:501`, `scanArmB:523`). An unowned reference is never reported, on either arm.
   Deleting **or renaming** a name in `globals.css` removes it from the live owned set, so every reference it
   orphans becomes unowned and is skipped. A "delete the token" plant goes **silently green**, and a surviving
   sibling changes nothing about that.
2. **`:528` — `if (!isCss)`, and only inside it, `:530`.** The prefix test (`inClass`) is computed **only** for
   dynamically-constructed sites returned by `findDynamicVarSites` (`:351-360`, regex `var\(\s*--([\w-]*)\$\{`),
   and that function is invoked **only** inside the `!isCss` branch of Arm B. It therefore covers exactly one
   shape: a template-literal `var(--prefix${…})` site in a `.tsx`/`.ts` file. It never sees a `.css` file, and it
   never sees a static `var(--x)` reference in any file. **No code path in this script reports a static CSS
   reference because a sibling shares its prefix.**

**Draft 1's claim to the contrary was false, and the executor measured it false — twice, natively.** Removing only
`--motion-duration-slow` from `:root`, leaving both siblings, and rebuilding leaves `check:css-vars` at **exit 0,
0 violations**; the header prints `owned custom properties … 263`, confirming the removal registered and the gate
still said nothing. Transcript: `docs/sessions/evidence/task765/phase4-p3-plant.txt`.

### 3.3R — the mutation class this gate *is* built to catch

`check-css-var-resolvability.mjs` states its own detectable shape, in-file, in the `--verify-gate` self-test:

- `runPlantP1` (`:697-707`): *"globals.css is left untouched so the target token STAYS owned — renaming it away in
  globals.css would un-own it, which would make the plant undetectable under R3's own live-ownership rule (a
  self-immunizing mutation …)"*. Draft 1 prescribed precisely that self-immunizing mutation.
- `runPlantP2` (`:730-735`): *"full declaration deletion from the shipped CSS, leaving a consumer intact; mirrors
  Task 690's move-out-of-@theme"*.

The detectable condition is therefore: **the name stays owned in `globals.css`, its declaration stops shipping, and
a consumer still references it.** Two measured facts make that condition reachable by moving one line.

`extractOwnedNames` (`:254-267`) parses `@theme`, `@theme inline` **and** every top-level `:root` block — a name
inside `@theme inline` is fully owned. And `@theme inline` emits no custom property into the bundle. Measured in
`.next/static/css/*.css` on the clean post-edit build, 2026-08-24:

| Name | declarations in built CSS | `var()` references in built CSS |
|---|---|---|
| `--duration-slow` (`@theme inline`) | 0 | 0 |
| `--ease-standard` (`@theme inline`) | 0 | 0 |
| `--motion-duration-slow` (`:root`) | 1 | 1 |

`globals.css` contains **zero** `@property` registrations (`grep -n "@property" src/app/globals.css` → no output),
so `propertySet` is empty for these names and cannot resolve them either.

> **Correction, Revision 1.2 — the generalization above was falsified, the measurements were not.** The three table
> rows are re-confirmed accurate. What was wrong is the sentence that generalized them into "`@theme inline` emits
> no custom property into the bundle". `--duration-slow` and `--ease-standard` ship nothing because **nothing
> references them** — Tailwind tree-shakes unused theme values; that is not a rule about `@theme inline` as such.
> When `--motion-duration-slow` was moved there under P3′ it **was** still referenced, so it **was** still emitted,
> and the plant produced `exit 0, 0 violations` at `owned=264`
> (`docs/sessions/evidence/task765/phase4/p3prime-check-css-vars.txt`). This is the orchestrator's own instance of
> the standing failure mode: a **derived** claim about a mechanism, published as a measurement. It is recorded, not
> removed. §3.3S carries the control that replaced it.

This is the same cause Task 757R recorded for `--ease-standard`, and it is the exact regression Task 765 exists to
prevent.

> **Revision 1.2 — what this section no longer claims.** Draft Revision 1 ended here with "P3′ plants it." **P3′
> did not plant it** — measurement showed the moved declaration still shipped, so nothing dangled
> (`phase4/p3prime-check-css-vars.txt`, `exit 0`). That sentence is withdrawn as a falsified historical premise and
> is retained only as such. The condition described above is real and **is** planted — by **P3″**, through the
> gate's documented input seam (§3.3S, §9.4S).

**Freshness trap.** Arm A reads the built CSS, and the gate compares the built file's mtime against the newest mtime
among all scanned inputs. A run after editing `globals.css` **without rebuilding** fails on staleness, not on the
planted defect — a non-zero exit that looks identical to success. Every `check:css-vars` run in this task is preceded
by a build, and every plant transcript must show the **specific violation class**, not merely a non-zero exit.

### 3.3S — P3″ — supported input-seam control

**The seam is the gate's own, and it is documented.** `check-css-var-resolvability.mjs` exposes
`--css-dir` / `--globals-path` / `--src-dir` as first-class inputs (`:60-68`, its own usage block), and its
`--verify-gate` self-test drives every one of its four plants and four controls through a `mkdtempSync` copy over
exactly those three flags (`setupTempTree:623-647`). Running a plant through that seam is the mechanism the script
was built to be planted through — not a workaround for it, and not a substitute parser.

**P3″ uses the real inputs on every axis that carries meaning:**

| Axis | What P3″ uses |
|---|---|
| Ownership | the **real** `src/app/globals.css`, passed as `--globals-path` — `owned=264`, unmodified |
| Consumer | the **real** `src/components/ui/AppImage.module.css`, reached through the real `--src-dir` |
| Shipped CSS | a copy of the **real** clean built bundle from `.next/static/css`, produced by a build that exited 0 |
| Target | the exact `--motion-duration-slow`, the token this task creates and migrates |

**Only the temporary copied bundle loses its one declaration.** The real tree is never written to: the helper's
sole `writeFileSync` targets a file inside its own `mkdtemp` directory, every real path is opened read-only, and the
temp tree is removed in a `finally` block (`TEMP_DIR_REMOVED=true` in the transcript). The real source diff is
re-proved byte-identical afterwards (§9.4S).

**What P3″ proves.** That `check:css-vars` turns red on its intended condition — **owned + referenced + no shipped
declaration** — naming the offending reference on both arms. That is Task 690's real regression shape, and it is the
condition R7/AC7 rests on.

**What P3″ does not claim.** It does **not** show that the gate detects a deletion from `:root`. It cannot: that
mutation un-owns its own reference before either arm sees it (§3.3). **That gap remains open and remains Task 743's
to close** — this task neither fixes it nor is blocked on it.

**Pass/fail convention, stated once because two exit codes are in play.** The **gate subprocess exit code 1 is the
required plant failure**. The helper wrapping it exits **0 only when it has observed and asserted that expected
failure** — a helper exit 0 therefore means "the gate correctly went red", and a helper exit 1 means the plant did
not reproduce. Both codes appear in the same transcript; read them by which process they belong to.

### 3.4 The retained capture approach to reuse

`docs/sessions/evidence/task763/capture-appimage-styles.mjs` already captures `borderRadius` among its container
properties and `transitionProperty` / `transitionDuration` / `transitionTimingFunction` among its state properties,
driving real Storybook stories. Its story list covers the `listing` / `listing-thumb` variants and does **not** cover
`avatar`. Extend the fixture only far enough to render the `avatar` variant; change nothing else about the approach.

### 3.5 Windows-native execution binds every command here

`docs/orchestrator-role.md:93-108`, `docs/orchestrator-procedures.md:363-374` and
`.claude/skills/review-task/SKILL.md:46-58` require every evidence-producing `node`/`npm`/`npx`/Playwright/Next/
Tailwind/Vite/Storybook command to run in native Windows PowerShell. Record `node.exe -p process.platform` as the
first retained artifact; only `win32` may proceed. Every retained transcript carries:

```
EXECUTION_PLATFORM=win32
NODE_VERSION=<node.exe -v>
CWD=<absolute repository path>
COMMAND=<exact command as typed>
```

and ends with `EXIT_CODE=<actual exit code>`. A transcript missing any of the five lines is not evidence.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D63-F | The seven `:root` names exist in `globals.css` with exactly the specified values | P0 | AC1 | Confirmed |
| R2 | D63-F | The existing `@theme inline` `--duration-*` / `--ease-*` entries alias the `--motion-*` names instead of owning literals | P0 | AC2 | Confirmed |
| R3 | D63-F | `AppImage.module.css` reads only the runtime names in the three migrated declarations | P0 | AC3 | Confirmed |
| R4 | D63-F, Sprint 64 rule 2 | No `design-tokens-allow` marker and no allowlist entry is added anywhere | P0 | AC4 | Confirmed |
| R5 | Sprint 64 rule 3, §3.1 | The rendered result is unchanged: computed `border-radius`, `transition-duration` and `transition-timing-function` equal their pre-edit values | P0 | AC5 | Confirmed |
| R6 | D63-F exit criteria | `check:design-tokens` exits 0 | P0 | AC6 | Confirmed |
| R7 | D63-F exit criteria | `check:css-vars` exits 0 | P0 | AC7 | Confirmed |
| R8 | Standing governance | `typecheck`, `build`, `build-storybook`, `check:stories` each exit 0 | P0 | AC8 | Confirmed |
| R9 | Sprint 64 rule 1 | Three planted violations, each observed failing with its specific violation class, then reverted | P0 | AC9.1-AC9.5 | Revision 1.2 |
| R10 | §3.5 | Every retained transcript carries the five-line native header and a real exit code | P0 | AC10 | Confirmed |

**Revision 1.2 status of the table above — every requirement is closed.**

- **R1-R8 and R10** — closed on retained, orchestrator-inspected evidence.
- **R9** — closed across **AC9.1-AC9.5**: P1 and P2 observed failing with their named category and reverted;
  **P3 and P3′ retained as measured-false author premises**, not as proofs; **P3″ is the passed control** (nested
  gate `exit 1` at `owned=264`, both arms naming `var(--motion-duration-slow)`); real-tree proof and the
  `phase7-final-*` clean gate set retained.
- **No executor action remains.** Nothing in this task is reopened; the only pending step is the orchestrator
  review scoped by §13.

## 5. Assumptions and open questions

- **A1 (`UNKNOWN`, resolved at Phase 1):** whether `3.40282e38px` survives the round trip through a custom property
  unchanged. It is a float at the edge of the representable range; a serialization difference would show up as a
  changed computed `border-radius`. If the post-edit computed value differs **at all**, report `BLOCKED` with both
  captures — do **not** substitute `9999px` or round the value (Sprint 64 rule 3).
- **A2 (`UNKNOWN`):** whether `@theme inline` accepts `var()` references to `:root` names in this Tailwind version
  and still emits the utilities that reference them. If the alias form breaks utility generation, stop and report
  `BLOCKED` with the compiled evidence; do not fall back to duplicating literals in both places.
- **A3 — `RESOLVED, FACT` (Revision 1).** Draft 1 carried A3 as an `INFERENCE` that P3 would fail through a "prefix
  arm". Measured false: **neither** arm reports draft 1's P3 (§3.3). A3 is closed as a finding, not as a passed
  assumption, and its evidence is retained in `docs/sessions/2026-08-24-task765-runtime-motion-radius-tokens-blocked.md`.
- **A3′ — `SUPERSEDED, MEASURED FALSE` (Revision 1.2). Historical; not an active instruction.** Revision 1 carried
  A3′ as the claim that P3′ reaches the ownership arm's condition — owned, referenced, **not shipped**. It was
  executed and the third clause failed: the moved declaration **still shipped**, `check:css-vars` exited 0 with 0
  violations at `owned=264` (`phase4/p3prime-check-css-vars.txt`). A3′ joins A3 as a closed finding, retained for
  the record. **No executor may act on it.**
- **A3″ — `RESOLVED, OBSERVED` (Revision 1.2).** The ownership arm's condition is reached and the gate reddens on
  it, proven by P3″ through the documented input seam: nested gate `exit 1`, `owned=264`, Arm A and Arm B both
  naming `var(--motion-duration-slow)` (§3.3S, §9.4S). Nothing here remains to be verified per run.

## 6. Scope

1. `src/app/globals.css` — the seven new `:root` declarations and the six `@theme inline` entries converted to
   aliases. **Nothing else in the file.**
2. `src/components/ui/AppImage.module.css` — exactly three declarations: `.frameCircle`'s `border-radius`, and
   `.fade`'s `transition-duration` and `transition-timing-function`, plus removal of the two now-unnecessary
   `design-tokens-allow` markers on the migrated lines.
3. `docs/sessions/evidence/task765/**` — the capture fixture extension, baseline and post captures, plant
   transcripts, gate transcripts.
4. `docs/sessions/2026-08-**-task765-*.md` and `docs/backlog.md`.

## 7. Out of scope

- Task 764, its ledger, evidence, source changes and acceptance criteria — **frozen** (Sprint 64 §6).
- Any other `design-tokens-allow` marker in `src/`, and any other `@theme inline` entry.
- Migrating other consumers onto `--motion-*`. This task creates the tokens and moves one file.
- Removing `--duration-*` / `--ease-*` from `@theme inline`. They stay, as aliases.

## 8. Current and required behaviour

| Behaviour | Today | Required after |
|---|---|---|
| `avatar` computed `border-radius` | `3.40282e38px` from a literal | **Identical**, from `var(--radius-pill)` |
| non-`priority` image computed `transition-duration` | `300ms` from a literal | **Identical**, from `var(--motion-duration-slow)` |
| the same rule's computed easing | `cubic-bezier(0.4, 0, 0.2, 1)` from a literal | **Identical**, from `var(--motion-ease-standard)` |
| `check:design-tokens --strict` | exit 1, two findings | **exit 0**, no marker, no allowlist |
| `check:css-vars` | exit 0 | **exit 0**, unchanged |
| Tailwind utilities generated from `--duration-*` / `--ease-*` | generated from literals | **Unchanged output**, generated through the aliases |

## 9. Implementation requirements

### 9.0R — REVISION 1: start state, and what is already closed

**Read this before §9.0.** Under Revision 1 the executor does **not** re-run §9.1–§9.3 and does **not** re-apply
§9.2's edit. Those are closed on retained evidence:

| Phase | State under Revision 1 |
|---|---|
| §9.0 platform gate | **Commands re-run, nothing else.** Retain as `docs/sessions/evidence/task765/phase6-platform-attestation.txt` — never overwrite the retained `platform-attestation.txt`. `win32` only. §9.0's status/drift instructions do **not** apply (see the precedence note below). |
| §9.1 baseline capture | **CLOSED.** `docs/sessions/evidence/task765/phase1/`, retained. Do not re-capture. |
| §9.2 the edit | **CLOSED and APPLIED in the worktree.** Do not re-apply, do not revert, do not restyle. |
| §9.3 post comparison + gate set | **CLOSED** as evidence (**108 image cells / 324 property comparisons, 0 mismatches** — re-derived by the reviewer from the raw captures; `comparison-result.json`'s own `cellsCompared: 111` is not reproducible and is superseded, review finding F3. All six gates exit 0). Its **command list is re-used** by §9.4R's final clean run. |
| §9.4 P1, P2 | **CLOSED.** Both observed failing with their named category and reverted, revert-diff-proven. |
| §9.4 P3 | **CLOSED AS A MEASURED FALSE PREMISE** (draft 1's). `exit 0, 0 violations, owned=263`; transcript `phase4-p3-plant.txt` retained. |
| §9.4R P3′ | **CLOSED AS A MEASURED FALSE PREMISE** (Revision 1's, the orchestrator's own). Ownership held at `owned=264`, but the declaration still shipped from `@theme inline`: `exit 0, 0 violations`. Transcripts `phase4/p3prime-build.txt`, `phase4/p3prime-check-css-vars.txt`, `phase4/p3prime-revert-proof.txt` retained. **Not a passing control, and not deleted.** |
| §9.4S P3″ | **CLOSED ON RETAINED EVIDENCE.** Gate subprocess `exit 1` at `owned=264` with both required arms; real tree unmutated and re-proved byte-identical; `phase7-final-*` gate set all `EXIT_CODE=0`. |

**No further executor run is authorized under this kickoff.** §9.0–§9.4S are all closed; Task 765 stands at
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. A fourth plant requires a new owner decision (§13), not an executor's
initiative.

**Start state the executor must confirm before touching anything (I0R):**

1. `git status --porcelain` — the expected state is **exactly** this, and nothing else:

   ```
    M docs/backlog.md
    M src/app/globals.css
    M src/components/ui/AppImage.module.css
    M tasks/Sprints/Sprint_64_kickoff_prompt_Task_765_Runtime_Motion_Radius_Tokens.md
   ?? docs/sessions/2026-08-24-task765-runtime-motion-radius-tokens-blocked.md
   ?? docs/sessions/evidence/task765/
   ```

   These six entries are the amended kickoff, the retained implementation and its evidence — **expected, correct,
   and not to be reverted, staged, committed or cleaned.** Any other change, or any of these six missing → stop and
   report before acting.
2. `git diff src/app/globals.css src/components/ui/AppImage.module.css` is **byte-identical** to
   `docs/sessions/evidence/task765/phase4/clean-post-edit.diff`. If it is not, the clean post-edit state has drifted
   — stop and report `BLOCKED`; do not reconstruct it by hand.
3. `src/app/globals.css` declares `--motion-duration-slow: 300ms;` inside the `:root` block, and
   `src/components/ui/AppImage.module.css` reads `transition-duration: var(--motion-duration-slow);`. Record both
   line numbers as measured — draft 1's line numbers are stale by design after the edit landed.

**No executor action remains; see §9.4S and §13.** (Revision 1.1 read "Then execute only §9.4R" — superseded:
§9.4R was executed and measured false, and §9.4S closed the control. The I0R checks above are retained as the
record of that session's start state, not as work to redo.)

**Operational preflight — `.git/index.lock`.** A pre-existing `.git/index.lock` is an owner-level operational
blocker. The executor must not delete it. If it exists, stop before task actions and report it; the owner clears it
only after verifying no Git process is active.

**Precedence over §9.0.** Revision 1 §9.0R supersedes §9.0's clean-worktree and revision-status instructions. Under
Revision 1, execute only §9.0's platform-attestation commands; do not apply its "expect empty" status rule or its
pre-edit drift checks.

**Attestation filename override.** §9.0 below names `platform-attestation.txt` — that file is retained historical
evidence from the draft-1 session and **must not be overwritten**. Under Revision 1 the re-run attestation is
written to `docs/sessions/evidence/task765/phase6-platform-attestation.txt` instead. The commands are unchanged.

### 9.0 — I0 freshness and the platform gate

`git status --porcelain` (expect empty; non-empty → `docs/orchestrator-dirty-worktree-manifest-template.md` first);
`git rev-parse HEAD` (expect `5372e08a5` or later on `main`).

Open the evidence terminal and retain `docs/sessions/evidence/task765/platform-attestation.txt`
— **under Revision 1.1 write `phase6-platform-attestation.txt` instead; the retained file is never overwritten**:

```powershell
node.exe -p process.platform     # must print win32
node.exe -v
$PWD.Path
```

Not `win32` → **stop, report `BLOCKED`**. Re-read §3.1's three declarations and §3.2's line numbers at their current
positions; report drift before acting.

### 9.1 — Phase 1: the pre-edit baseline, before any source change

Extend `docs/sessions/evidence/task763/capture-appimage-styles.mjs`'s approach into
`docs/sessions/evidence/task765/capture-appimage-styles.mjs` — copy it, add a story that renders the `avatar`
variant, change nothing else about how it captures.

Build Storybook, run the capture, and persist `baseline-computed-styles.json` containing, at minimum:

- `avatar` variant: computed `border-radius`;
- non-`priority` image: computed `transition-duration` and `transition-timing-function`.

The artifact records the **source revision** (`git rev-parse HEAD`) and the run's real exit code. A baseline that
does not name the revision it was taken at cannot support AC5.

### 9.2 — Phase 2: the edit

`globals.css`, inside the existing `:root` block:

```css
:root {
  --radius-pill: 3.40282e38px;
  --motion-duration-fast: 100ms;
  --motion-duration-base: 200ms;
  --motion-duration-slow: 300ms;
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

`globals.css`, inside the existing `@theme inline` block — the six entries become aliases, keeping their names:

```css
--duration-fast: var(--motion-duration-fast);
--duration-base: var(--motion-duration-base);
--duration-slow: var(--motion-duration-slow);
--ease-standard: var(--motion-ease-standard);
--ease-in: var(--motion-ease-in);
--ease-out: var(--motion-ease-out);
```

`AppImage.module.css` — exactly three declarations, and delete the `design-tokens-allow` markers that defended them:

```css
border-radius: var(--radius-pill);
transition-duration: var(--motion-duration-slow);
transition-timing-function: var(--motion-ease-standard);
```

No allowlist entry. No marker. No approximation of the radius value.

### 9.3 — Phase 3: the post-edit comparison and the gate set

Rebuild, re-run the capture, and persist `post-computed-styles.json`. AC5 passes only when all three values are
**equal to the baseline**, compared as strings, not as "visually the same".

Then, in this order — the build must precede `check:css-vars` (§3.3's freshness trap):

`npm.cmd run typecheck` · `npm.cmd run build` · `npm.cmd run build-storybook` · `npm.cmd run check:stories` ·
`npm.cmd run check:design-tokens` · `npm.cmd run check:css-vars`. Each transcript retained, each `EXIT_CODE=0`.

### 9.4 — Phase 4: three planted violations

**Revision 1:** P1 and P2 below are **closed on retained evidence** and are not re-run. P3 is **withdrawn**; §9.4R
replaces it and is the only arm this session executes.

Each plant starts from the **clean post-edit state**, records a real non-zero exit code **and the specific violation
class**, and is reverted before the next one begins.

| Arm | Mutation | Required observation |
|---|---|---|
| **P1** | Restore `transition-duration: 300ms` as a literal in `.fade` | `check:design-tokens` fails, and the transcript names the **`css-duration`** category on that line |
| **P2** | Restore `border-radius: 3.40282e38px` as a literal in `.frameCircle` | `check:design-tokens` fails, and the transcript names the **`css-length`** category on that line |
| ~~**P3**~~ | ~~Remove **or** rename **only** `--motion-duration-slow` in `:root`~~ | **WITHDRAWN — Revision 1.** Unsatisfiable: the mutation un-owns its own reference (§3.3). Replaced by P3′ below. |

After the last revert: `git diff` on `globals.css` and `AppImage.module.css` must equal their pre-plant diffs
exactly; persist that proof. Then re-run the full §9.3 gate set clean.

### 9.4R — Phase 4, Revision 1: P3′ — **HISTORICAL / SUPERSEDED, executed and measured false**

> **Revision 1.2.** This section is retained verbatim as the record of what Revision 1 instructed and what the
> executor ran. **It is not an active instruction and must not be executed again.** P3′ was performed: the build
> exited 0, ownership held at `owned=264`, and `check:css-vars` nevertheless exited **0 with 0 violations**, because
> the declaration still shipped from `@theme inline` (`phase4/p3prime-check-css-vars.txt`; revert proved
> byte-identical in `phase4/p3prime-revert-proof.txt`). The live control is **§9.4S's P3″**.

**P3′ — the mutation.** From the confirmed clean post-edit state (§9.0R), **move** the single declaration

```css
  --motion-duration-slow: 300ms;
```

out of the `:root` block and into the existing `@theme inline` block, adjacent to `--duration-slow`. It is a
**move**, not a copy and not a rewrite: exactly one line leaves `:root` and exactly one line enters `@theme inline`,
with its name and value unchanged. Change nothing else:

- `--motion-duration-fast` and `--motion-duration-base` stay in `:root`.
- `--duration-slow: var(--motion-duration-slow);` in `@theme inline` stays exactly as it is.
- **The consumer is not touched.** `AppImage.module.css`'s `transition-duration: var(--motion-duration-slow);`
  stays. The whole point of this plant is that a live consumer is orphaned.

**Why this one fails where draft 1's P3 could not (§3.3R):** the name stays owned, because `extractOwnedNames`
parses `@theme inline` as ownership; its declaration stops shipping, because `@theme inline` emits no custom
property; nothing resolves it, because there is no `@property` registration. That is exactly the ownership arm's
reporting condition at `:474-477`.

**Order — the build must precede the gate (§3.3's freshness trap):**

```powershell
npm.cmd run build          # must be EXIT_CODE=0
npm.cmd run check:css-vars # must be EXIT_CODE=1
```

**Required observation — all four, or the plant does not count:**

1. `npm.cmd run build` exits **0**. A build failure is not a passed plant; it is a `BLOCKED` report under A3′,
   because a failed build makes the gate's own result unreadable.
2. `check:css-vars` exits **non-zero**.
3. The transcript names the violation and its reference, not merely an exit code — at minimum one line of the form

   ```
   Arm B  src/components/ui/AppImage.module.css:<line>  var(--motion-duration-slow) — no shipped declaration, no @property registration
   ```

   Arm A is expected to report the same name against the shipped bundle as well; record whatever both arms print,
   verbatim. Retain the full stdout, not an excerpt.
4. **The discriminator — `owned custom properties … 264`, not 263.** The header line
   `🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): N` must read **264**, the
   same count as the clean post-edit run. `263` means the declaration left `globals.css` entirely instead of moving
   into `@theme inline` — that is draft 1's withdrawn P3 re-run by accident, and it exits 0. **A transcript showing
   263 is a failed plant setup, not a finding: fix the placement and re-run.**

**Revert and prove it.** Move the line back into `:root`, then:

```powershell
git diff src/app/globals.css src/components/ui/AppImage.module.css
```

must be **byte-identical** to `docs/sessions/evidence/task765/phase4/clean-post-edit.diff`; persist the comparison
and its exit code as `phase4/p3prime-revert-proof.txt`. Then re-run the **full §9.3 gate set** clean
(`typecheck` · `build` · `build-storybook` · `check:stories` · `check:design-tokens` · `check:css-vars`), each
`EXIT_CODE=0`, retained under a `phase6-final-*` prefix so it does not overwrite the retained `phase5-final-*` set.

Every transcript in this phase carries §3.5's five-line native header and a real exit code (R10/AC10).

### 9.4S — P3″ evidence accepted

**Retained artifacts** (all under `docs/sessions/evidence/task765/`, each carrying §3.5's five-line native header
and a real exit code):

- `phase4/verify-p3doubleprime.mjs` — the control helper
- `phase4/p3doubleprime-clean-build.txt`
- `phase4/p3doubleprime-plant.txt`
- `phase4/p3doubleprime-real-tree-proof.txt`
- `phase7-platform-attestation.txt`
- `phase7-final-typecheck.txt` · `phase7-final-build.txt` · `phase7-final-build-storybook.txt` ·
  `phase7-final-check-stories.txt` · `phase7-final-check-design-tokens.txt` · `phase7-final-check-css-vars.txt`

**Measured result, as recorded in those transcripts:**

1. **Clean build** — `npm.cmd run build`, `EXIT_CODE=0`. The copied bundle is a real, clean, freshly built one.
2. **Pre-mutation census** — `census.ownsTarget(real globals.css) = true`; exactly **one** declaration of
   `--motion-duration-slow` in the copied bundle (`3c13108dfae01b46.css`); the bundled static reference present
   (`bundleVarReferences = 1`); the real source consumer present
   (`census.appImageConsumerRefs(real AppImage.module.css) = 1`). The census gates the mutation: it fails closed if
   any of the four does not hold.
3. **Post-mutation census** — `declarationSites(copied bundle) = 0`, `bundleVarReferences = 1`. The declaration is
   gone from the temporary bundle; the reference is retained. Exactly the target condition.
4. **Nested `check:css-vars`** — invoked over `--css-dir <temp>` with the **real** `--globals-path` and
   `--src-dir`: header `owned custom properties … : 264`, `--- gate exit code: 1 ---`.
5. **Both arms named it:**

   ```
   Arm A  …/task765-p3doubleprime-…/css/687fc97a2b233821.css:1  var(--motion-duration-slow) — no shipped declaration, no @property registration
   Arm B  src/components/ui/AppImage.module.css:158             var(--motion-duration-slow) — no shipped declaration, no @property registration
   ```

   with the gate's own stderr `❌  check:css-vars — 2 blocking finding(s). Baseline is 0.`
6. **`TEMP_DIR_REMOVED=true`** — the `mkdtemp` tree is deleted in the helper's `finally` block.
7. **Real source diff** — `git diff src/app/globals.css src/components/ui/AppImage.module.css` byte-identical to
   `phase4/clean-post-edit.diff` (4987 bytes both sides, raw byte-array comparison `True`).
8. **`phase7` final gate set** — `typecheck`, `build`, `build-storybook`, `check:stories`, `check:design-tokens`,
   `check:css-vars` each `EXIT_CODE=0`; the final `check:css-vars` reads `owned=264`, `0 violations`.

The helper's own `EXIT_CODE=0` is its assertion result — it exits 0 **because** it observed the gate's required
exit 1 (§3.3S's pass/fail convention), after printing `PASS:` for each of the four assertions.

## 10. Positive and negative flows

**Positive.** A user loads a listing page. The avatar renders fully round, the non-priority images fade in over 300ms
on the standard curve — identical to before — and nothing in the CSS carries a literal or a marker for those values.

| # | Flow | Applicable | Required |
|---|---|---|---|
| N1 | Tailwind utilities built from `--duration-*` / `--ease-*` | **Yes** | Compiled output unchanged; the aliases must not change what Tailwind emits |
| N2 | A surface reading `--motion-*` from a TSX inline style | No | None exists yet; this task adds no consumer |
| N3 | `prefers-reduced-motion` | **Yes** | Unaffected — this task changes value provenance, not any media guard |
| N4 | `priority` image (no `.fade`) | **Yes** | Unchanged; no transition applies |
| N5 | Dark theme | **Yes** | Motion and radius are theme-independent; `.dark` introduces no new name (`check-css-var-resolvability.mjs:55`) |
| N6 | RLS / auth / i18n | No | No data, policy or copy in scope |

## 11. Acceptance criteria

- **AC1 [R1]** — The seven `:root` names exist in `globals.css` with exactly the §9.2 values, inside the `:root`
  block that opens at `:327`, not inside `@theme inline`.
- **AC2 [R2]** — The six `@theme inline` entries keep their names and their values are `var(--motion-*)` references.
- **AC3 [R3]** — `AppImage.module.css` contains exactly the three §9.2 declarations at the migrated lines; no other
  declaration in that file changed.
- **AC4 [R4]** — `git diff` contains no added `design-tokens-allow` marker, and
  `scripts/design-tokens-allowlist.json` is unchanged.
- **AC5 [R5]** — `post-computed-styles.json` equals `baseline-computed-styles.json` on all three values, string-for-
  string, and the baseline names the revision it was captured at.
- **AC6 [R6]** — `npm.cmd run check:design-tokens` exits 0.
- **AC7 [R7]** — `npm.cmd run check:css-vars` exits 0, run after a build.
- **AC8 [R8]** — `typecheck`, `build`, `build-storybook`, `check:stories` each exit 0, transcripts retained.
- **AC9 [R9] — AMENDED, Revision 1.2.** Five criteria, all closed on retained evidence:
  - **AC9.1 — P1, closed on retained evidence.** `phase4-p1-plant.txt`: `check:design-tokens` exit 1 naming
    `[css-duration]`, reverted. Not re-run.
  - **AC9.2 — P2, closed on retained evidence.** `phase4-p2-plant.txt`: `check:design-tokens` exit 1 naming
    `[css-length]`, reverted. Not re-run.
  - **AC9.3 — P3′ retained as a failed author premise, not a passing control.** Executed and measured: ownership
    held at `owned=264`, but the declaration still shipped from `@theme inline`, so `check:css-vars` exited **0**
    with **0 violations** (`phase4/p3prime-check-css-vars.txt`). AC9.3 is satisfied by the **record** of that
    measurement and its revert proof — it is **not** satisfied by, and must never be reported as, a passing plant.
  - **AC9.4 — P3″ passed.** The gate subprocess returned **1** with **both** required violations — Arm A against
    the copied bundle and Arm B against `src/components/ui/AppImage.module.css:158`, each naming
    `var(--motion-duration-slow) — no shipped declaration, no @property registration` — at header `owned=264`.
    Proven by `phase4/p3doubleprime-plant.txt`; the helper's own exit 0 is its assertion of that required exit 1.
  - **AC9.5 — real-tree proof plus the phase7 clean gate set.** `TEMP_DIR_REMOVED=true`; the real
    `git diff src/app/globals.css src/components/ui/AppImage.module.css` is byte-identical to
    `phase4/clean-post-edit.diff` (4987 bytes, raw byte comparison); and `phase7-final-{typecheck,build,
    build-storybook,check-stories,check-design-tokens,check-css-vars}.txt` each carry `EXIT_CODE=0`.

  Draft 1's AC9 required a P3 that no code path in the gate can produce, and Revision 1's AC9.3 required a P3′ the
  bundle contradicted. Both are superseded by AC9.3-AC9.5 above; neither is deleted.
- **AC10 [R10]** — Every retained transcript carries `EXECUTION_PLATFORM=win32`, the Node version, the cwd, the exact
  command and a real `EXIT_CODE`.

## 12. QA profile and verification plan

**Profile: `Q3`.** A global stylesheet contract change with rendered consequences, verified by computed-style capture
plus four gates and a three-armed plant. **Not Q4:** `docs/critical-flow-registry.md`'s registered card flow is not
edited by this task — `AppImage.module.css` changes value provenance only, and `ListingCard`/`MantineListingCardPattern`
are untouched. If the I0 scan of the registry shows otherwise, escalate and add automated regression evidence.

Every command runs in native Windows PowerShell with the §3.5 header. A result from any other platform is not
evidence and must not be reported as one.

## 13. Completion report contract

**REVISION 1.2 — the contract is discharged. No further Sonnet execution is required.**

**Closed 2026-08-24: ✅ `APPROVED WITH NOTES`.** The review below was performed and its verdict recorded in
`docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json`; the seam question is answered
yes. What follows is the contract as it stood at handoff.

Task 765's result at handoff was **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. R1-R8 and R10 are closed on retained
evidence; R9 is closed at AC9.1, AC9.2 (P1/P2), AC9.3 (P3′ retained as a failed premise), AC9.4 (P3″ passed) and
AC9.5 (real-tree proof + `phase7` clean gate set). Nothing in §9 remains for an executor to run.

**What the orchestrator review must decide — and only this.** Whether the documented temporary input-seam control
(§3.3S — the gate's own `--css-dir`/`--globals-path`/`--src-dir` seam, driven over a `mkdtemp` copy of the real
clean bundle, with real ownership, real consumer and the real target token) **satisfies Sprint 64 rule 1's control
requirement**. The review may accept it, or reject the seam as a control and say so with reasons.

**It must not ask for a fourth plant without a new owner decision.** Three forms have been measured; two failed for
reasons now documented as mechanism, not as executor error. A fourth mutation shape is a scope change and needs an
owner decision recorded like D63-F, not a reviewer's request.

**Superseded contracts, retained.** Revision 1's report contract below was satisfied by the executed session; draft
1's sits under it. Neither is re-executed.

**Revision 1 superseded items 4 and 5 below** — A1 and A2 are answered in the retained session log and are not
re-answered. The Revision 1 report contains, and is complete when it contains, exactly:

1. The I0R start-state check (§9.0R), including the byte-identity result against `phase4/clean-post-edit.diff`.
2. P3′'s two transcripts verbatim — the build and the gate run — with the header's owned-property count quoted, and
   an explicit statement of whether it read `264` or `263`.
3. Every violation line the gate printed, per arm, verbatim.
4. The revert proof and the `phase6-final-*` clean gate set.
5. `git status --porcelain` at session end, showing `src/` back to the clean post-edit diff and no stray artifact.
6. Deviations and limitations, if any. **No mutating git.**

Draft 1's contract, retained for reference and already satisfied by the retained evidence:

1. Changed files vs §6. 2. R1-R10 completed and not. 3. Every command with its five-line header and real exit code.
4. **The A1 answer:** the three baseline values and the three post values, verbatim, and whether `3.40282e38px`
survived the round trip unchanged. 5. **The A2 answer:** evidence that the aliased `@theme inline` entries still
produce the same compiled utilities. 6. **The A3 answer:** which arm of `check:css-vars` reported P3, quoted from the
transcript. 7. The revert proof and the final clean gate run. 8. I0 drift. 9. Deviations and limitations.
10. `docs/backlog.md` updated concisely, narrative in the session log.

## 14. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | ✅ every value, line, command and owner quote is in the file |
| Every requirement has a binary AC and a verification method | ✅ R1-R10 → AC1-AC10 |
| Scope names what must not change | ✅ §7; §8 gives a before/after per behaviour |
| Active route | ✅ **No active executor route remains.** D63-F's shape was implemented verbatim and every phase of §9 is closed; A1, A2, A3, A3′ and A3″ are all resolved findings, none of them a live per-run check. The only thing pending is the orchestrator review scoped by §13. |
| Every gate claim carries a planted-violation proof | ✅ P1/P2 for `check:design-tokens` (observed, retained); **P3″** for `check:css-vars` (observed — nested gate `exit 1`, `owned=264`, both arms; `phase4/p3doubleprime-plant.txt`). P3 and P3′ are retained as failed author premises, not as proofs. |
| Plant validity — final, Revision 1.2 | ✅ **P3″ is observed evidence, not a prediction.** The transcript `phase4/p3doubleprime-plant.txt` records the gate subprocess returning **exit 1** with two named violations at `owned=264`, after a census that fails closed. **Two exit codes, do not conflate them:** the **nested gate's exit 1 is the required plant failure**; the **helper's exit 0 is its assertion result**, reached only because it observed that exit 1 and every `PASS:` line. A helper exit 1 would mean the plant did not reproduce. |
| Author predictions vs measurements | ⚠️ **Two author premises were measured false and are retained, not deleted.** Draft 1's P3 (prefix arm rescues a deleted token) and Revision 1's P3′ (`@theme inline` ships nothing) both went `exit 0`. Both are recorded in §3.3, §3.3R's correction block and §9.0R's phase table. The lesson is unchanged and now twice-owned: a **derived** claim about a mechanism is not a measurement, whoever writes it. |
| ~~Each plant is shown able to fail for the right reason~~ | ~~⚠️~~ **Superseded by the two rows above.** Draft 1's ✅ here was self-certified and false. P3 was asserted able to fail from a line read without its enclosing branch; measurement showed it could not fail at all. P3′ replaces the assertion with a mechanism traced through `classifyReferences`, `extractOwnedNames` and the built bundle's own declaration counts (§3.3R), plus a transcript discriminator (`264`, not `263`) that distinguishes a live plant from a silently-green one. **It remains an executor observation, not an author guarantee** — A3′ routes any other outcome to `BLOCKED`. |
| Known traps surfaced before the executor hits them | ✅ §3.3's unowned-reference skip on **both** arms, the `!isCss` guard that confines the prefix rule to dynamic TS/TSX sites, the self-immunizing-mutation warning the script itself carries at `:697-707`, and the build-staleness false red; §3.1's easing literal that is not a current finding |
| Author's own claims re-derived after revision | ✅ Revision 1's every new fact re-measured 2026-08-24 against the clean post-edit build: the two `:468`/`:528` control-flow reads, the built-CSS declaration counts, the zero `@property` registrations, and the `264` baseline. Draft 1's failure was a **derived** claim about a mechanism presented as a measurement — the same shape recorded for 700 and 702. |
| Comparator measures the invariant | ✅ AC5 compares computed strings from a real render, not the source text |
| Prior work fenced off | ✅ §7 and Sprint 64 §6 freeze Task 764 entirely |

---

## Handoff

**REVISION 1.2 handoff — this is the live one, and it is not an execution handoff.**

**No executor session is authorized.** Every phase of §9 is closed (§9.0R's table). Task 765 stands at
✅ `APPROVED WITH NOTES` (orchestrator review 2026-08-24, ledger
`docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json`). The seam question §13 scoped is
answered: §3.3S's control satisfies Sprint 64 rule 1. The remaining action is the owner's commit and push; a fourth
plant is out of scope without a new owner decision.

Revision 1.1's execution order is retained below as the record of what the executor ran, and is **superseded**:

1. ~~Start at §9.0R~~ — done; `phase6-platform-attestation.txt`, `phase7-platform-attestation.txt` retained.
2. ~~Execute §9.4R only~~ — done, and **measured false** (P3′). Replaced by §9.4S's P3″, also done.
3. §9.3's command list was reused as the final clean gate set — twice, `phase6-final-*` and `phase7-final-*`.

The implementation stays exactly as it is: §9.2's edit applied, both plants reverted, real source diff byte-identical
to `phase4/clean-post-edit.diff`. Nothing further moves in `src/`.

**FACTS:** §3.1, §3.2, §3.3, §3.3R (with its Revision 1.2 correction), §3.3S, §3.4, §3.5 — each with its file and
line, and §9.4S's result read from the retained transcripts.
**INFERENCES:** none load-bearing. Two author premises were inferences presented as mechanism — draft 1's A3 and
Revision 1's `@theme inline` generalization. Both were measured false and both are closed as findings, retained.
**UNKNOWNS:** A1 and A2 — both answered in the retained session log (A1: Blink clamps the radius identically in both
states, byte-equal across all 108 captured image cells / 324 property comparisons, 0 mismatches; A2: the aliased
`@theme inline` entries build and render unchanged).
**CONFLICTS:** draft 1's §3.3 vs the script's actual control flow — resolved in favour of the measurement, and the
falsified claim is recorded rather than deleted.

**Carried to Task 743, not blocking this task:** the gate's sibling-preserved static-deletion blind spot measured
here — deleting one `:root` name while a sibling survives leaves a static `.css` consumer dangling and unreported —
is a second reproduction of 743's ownership-deletion gap, in a new shape. It is recorded in `docs/backlog.md`'s 743
row. **Task 765 does not fix it and must not be widened to fix it**; the naive fix reopens 743's 112 Mantine false
positives, and the scoping rule is 743's decision to make.

**QA profile:** `Q3`. **Ambiguous requirements:** none.
**Owner decisions still needed:** none. D63-F and D63-D are quoted verbatim in §1 and recorded in
`tasks/Sprints/Sprint_63_Homepage_Exits_Tailwind.md`.
