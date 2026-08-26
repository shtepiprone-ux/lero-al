# Task 768 — AppImage: close the D65-D spacing dependency

**Sprint:** 65 — Homepage finishes the Tailwind exit (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`)
**Priority:** P1 · **Status:** `FILED — ready for executor` (D65-D and D65-E decided and propagated to the Sprint 65 registers) · **Baseline:** the **merge commit of Task 767** on `main`
**Depends on:** 767 accepted **and merged**. 763, 764, 765, 766 already in `main`. **Does not depend on:** 667, 769, 770, 771, global Tailwind removal.

> **Filing record.** Task 767 was `APPROVED WITH NOTES` on 2026-08-26 (ledger
> `docs/reviews/2026-08-26-task767-homepage-runtime-token-exit.review-ledger.json`, 10/10 VERIFIED, 0 open P0/P1/P2)
> and merged to `main` as `39dafa795` (with `31544b316` as its Task 767 parent). Do **not** start this task on the
> old task branch or on a tree that predates that merge. §10.0 is what proves you are on the right tree.
>
> **Filed state.** This kickoff is filed only as part of the §16 atomic register update: `docs/backlog.md` records
> D65-D CLOSED, D65-E DECIDED and registry row 768, while the Sprint 65 plan records the same decision and filed
> scope. A kickoff that claims `FILED` while those registers say otherwise is projection drift; **do not dispatch if
> any of them regresses**.

---

## 0. Owner decision D65-D — CLOSED 2026-08-26

Sprint 65 §4 freezes `src/components/ui/AppImage.module.css`, while that file holds one live Level-3 dependency.
The two rules conflicted, and the backlog carried **D65-D PENDING, blocks filing 768** until the owner recorded the
carve-out. Recorded verbatim, 2026-08-26:

> Permit one narrow AppImage change: replace imageLayer `inset: var(--space-0)` with `inset: 0`. This preserves the
> computed 0px value while removing Level-3's only AppImage dependency. Motion, radius, variants, loading, markup,
> and every other AppImage declaration remain frozen.

D65-D is now **CLOSED**. This task is the whole of what it authorises. Nothing in this kickoff may be read as
re-opening the AppImage freeze for any other declaration, and no later task may cite D65-D to touch a second line.

## 1. Mode and task type

**Mode:** implementation (executor: Sonnet, via `.claude/skills/execute-task/SKILL.md`).
**Task type:** UI / Layout / Component — **current Mantine path**, mixed with **Legacy Tailwind Styling Governance**
for the one retired name. Not Docs/Governance: this task ships **no new gate and modifies no existing gate** (§6).

**QA profile:** `Q3 Full Visual Matrix`, scoped by §13. One declaration changes, on a rule that positions an overlay
inside every AppImage frame in the product, so the rendered proof is not optional even though the computed value is
provably unchanged.

## 2. Objective

Remove the single `@theme inline`-only custom-property read from `AppImage.module.css`, so that the file stops being
a Level-3 consumer and Task 770's Homepage Level-3 census can be stated over a fixed manifest that does not carve
AppImage out by hand.

After this task: `src/components/ui/AppImage.module.css` contains **zero** `var(--space-0)` reads; the `.imageLayer`
rule reads `inset: 0`; the computed `inset` is `0px` on every captured cell, before and after.

This is **not** a token addition. No `--homepage-runtime-space-*` token is created — Task 770 owns runtime-token
additions, and this task deliberately avoids them so the two diffs never have to be untangled. This is also **not**
an AppImage refactor: see §8.

## 3. Verified context

Every statement below was measured on the tree at `a7dbd4c12` + Task 767's commit `31544b316`. Re-measure in §10.0;
a changed reading is a design blocker, not permission to widen scope.

**3.1 — The subject, exactly one declaration.** `src/components/ui/AppImage.module.css:142`:

```css
  .imageLayer {
    position: absolute;
    inset: var(--space-0);
    width: 100%;
    height: 100%;
  }
```

`.imageLayer` sits inside `@layer utilities { … }` (`:78-178`), so the rule is indented two spaces — an `rg` anchor
written for a top-level rule will miss it. `AppImage.module.css` has exactly one `var(--space-0)` **read** (`:142`)
and **two** further occurrences of the string, both in comments: the Class-3 inventory row in the file header
(`:34`, which itself quotes `` `var(--space-0)` ``) and the rule comment directly above `.imageLayer` (`:138`).
Both must be updated, neither deleted (§5.2). Counting either as a live read is the first way to get §10.0's
census wrong.

**3.2 — Why it is Level 3.** `--space-0` is declared **once**, at `src/app/globals.css:128`, as `0px`, inside the
`@theme inline` block (`:35-316`). It has no plain-`:root` declaration anywhere. That is the definition of a
theme-inline-only runtime name: it resolves today only because `@import "tailwindcss"` compiles that block.

**3.3 — Why `inset: 0` is value-identical, not a restyle.** `--space-0` is `0px`; `inset: 0` sets all four physical
offsets to `0`, which computes to `0px`. Native CSS zero is not a copied Tailwind scale value and needs no token.

**3.4 — `check:design-tokens` will not demand an exemption.** Measured in the gate's own source: zero literals are
exempt by rule (`scripts/check-design-tokens.mjs:220` documents `0`, `0px`, `0rem`, `0em`; `:333`
`isZero: (literal) => parseInt(literal, 10) === 0`). **No `design-tokens-allow:` marker may be added by this task** —
Sprint 65's no-author-applied-exemption rule stands, and the measurement above says none is needed. If the gate
nevertheless reports this line, stop (§14).

**3.5 — `--space-0` survives in ten further reads, by design.** Measured across `src/`, the literal string
`--space-0` occurs **15** times: one declaration (`globals.css:128`), one false friend that must not be counted or
edited (`--space-0-5`, `globals.css:146`), two comment lines in `AppImage.module.css` (`:34`, which itself quotes `var(--space-0)`, and `:138`), and **11 live
`var(--space-0)` reads** — `AppImage.module.css:142` (this task's subject) plus ten that are **out of scope**:

| File | Lines | Reads |
|---|---|---|
| `src/app/globals.css` (alias `--spacing-0`) | 151 | 1 |
| `src/components/layout/MobileBottomNavView.module.css` | 58, 59, 60, 152 | 4 |
| `src/components/shared/HeroSearchView.module.css` | 95, 99 | 2 |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 302, 386, 392 | 3 |

Task 770 owns all ten. This task must not touch them and must not "for consistency" convert them.

**Read this together with §13.** `MantineListingCardPattern.module.css` is the AppImage-bearing card whose story
(`mantine-primitives-listingcard--default`) carries AC3's evidence. After this task that story still contains three
`--space-0` reads of its own. AC3 proves that **AppImage's** dependency is closed and its geometry is unchanged; it
does **not** prove the card is Level-3 clean, and the completion report must not claim that it does.

**3.6 — The resulting inconsistency is intended and must be recorded.** After this task, AppImage expresses zero
inset as native `0` while the six sites in §3.5 still express zero through `var(--space-0)`. That is a knowingly
accepted, temporary asymmetry, not an oversight. Task 770 decides the end state for those six; it may **not** revisit
`AppImage.module.css` to re-align it, because the AppImage freeze resumes the moment this task is accepted.

**3.7 — Census arithmetic.** The plan records Homepage Level 3 as 43 pairs / 80 uses before this task and 42 / 79
after (`Codex-tasks/README.md`, "Corrections that remove the previous traps", item 2). **This kickoff does not
re-derive that census** — Task 770 owns it and re-measures it as its own first action. What this task proves is the
`-1`: one pair, one use, in one file.

## 4. Requirements

| ID | Source | Requirement | Priority |
|---|---|---|---|
| R1 | D65-D | `AppImage.module.css:142` reads `inset: 0`; no other declaration in the file changes | P0 |
| R2 | Sprint 65 §4 | Exactly one file under `src/` is modified, and it is `AppImage.module.css` | P0 |
| R3 | §3.3 | Computed `inset` is `0px` and byte-equal to the pre-edit reading at every captured cell | P0 |
| R4 | Sprint 65 rule 2 | No `design-tokens-allow:` marker, no allowlist row, no baseline row, no new token | P0 |
| R5 | §3.1 | The file-header Class-3 inventory row is updated to record the closure, not deleted | P1 |
| R6 | §3.6 | The session log records the accepted asymmetry and that the AppImage freeze resumes | P1 |
| R7 | §6 / D65-E | No new detector, marker, baseline row or temporary script is added; both comparators are run and their non-zero-on-delta exit codes retained; the report states D65-E and its consequence | P0 |

## 5. Implementation requirements

**5.1 — The one code change.** In `src/components/ui/AppImage.module.css`, inside `@layer utilities`, rule
`.imageLayer`:

```
    inset: var(--space-0);   →   inset: 0;
```

Nothing else. Not the neighbouring `position`, `width`, `height`; not `.fade`, `.visible`, `.hidden`,
`.hoverBrightness`, `.frame*`, `.fit*`; not `AppImage.tsx`; not `appImageConfig.ts`; not `globals.css`; not any
Storybook source; not the Task 765 evidence harness.

**5.2 — The header comment.** `AppImage.module.css:34-35` currently reads the Class-3 inventory row for
`var(--space-0)`. Update it in place to record that the dependency was closed by Task 768 under D65-D, and that the
inventory is now empty. Do not delete the inventory heading — a later reader needs to see that the list exists and
is empty, not that it was removed. The rule comment at `:137-139` that cites `inset-0` as the Tailwind source stays;
append the D65-D reference to it.

**5.3 — What may not be introduced.** No new custom property. No `@apply`. No change to `@theme inline`. No new
Storybook story. No new script under `scripts/`. No CI wiring.

## 6. The control — D65-E, decided

Sprint 65 rule 1 (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md:50`) is binding: *the control
ships before or with the fix*. D65-D authorises one CSS carve-out and says nothing about the control rule, so the
exception had to come from the owner, not from this document's argument. It was recorded on 2026-08-26, verbatim:

> **D65-E — DECIDED 2026-08-26.** Owner grants a one-task exception to Sprint 65 rule 1 for Task 768 only: Task 768
> must not add a new permanent detector for `var(--space-0)` in `AppImage.module.css`. This is not an exception from
> fail-closed verification. Before merge, Task 768 must retain pre/post evidence and run comparators that exit
> non-zero on any geometry/state/hover, fixture/markup, `imgComputed.inset`, or keyed Storybook
> `verdict`/`failReason` delta.
>
> The durable anti-regression responsibility transfers exclusively to Task 770's fixed-manifest ownership gate. Task
> 770 must name `AppImage.module.css` explicitly as an expected-zero entry and prove a reintroduced
> `var(--space-0)` read fails the gate. No second detector, baseline row, marker, or temporary script is permitted
> in Task 768.
>
> This exception expires if Task 770 is re-scoped so that it no longer supplies that fixed-manifest gate; in that
> case, stop and obtain a new owner decision before dispatching any affected migration work. Until Task 770 lands,
> Sprint 65 §4's AppImage freeze remains binding.

**Three consequences the executor must act on.** (a) The comparators in §13 and AC3 are the fail-closed verification
this decision requires — they set a non-zero exit code, and `$LASTEXITCODE` is retained evidence, not decoration.
(b) No temporary script, marker or baseline row may be added to satisfy the control rule — the exception forbids the
very thing an executor might reach for. (c) Task 770 now carries a named obligation (`AppImage.module.css` as an
expected-zero manifest entry, with a negative plant); §16 requires that obligation be written into the registers in
the filing commit, so it cannot be lost between tasks.

**The reasoning the decision rests on, retained for the reviewer:**

- The debt class here — a custom property whose only declaration lives in `@theme inline` — is exactly what
  **Task 770's fixed-manifest ownership gate** is scoped to detect. Building a second, narrower detector now would
  create the duplicate-predicate problem the Task 767 review already recorded against `--verify-gate` (F6), and
  Task 770 would then have to retire it.
- `check:tailwind-runtime-tokens` does **not** cover this name and must not be widened here: `--space-0` is
  project-declared, so the gate correctly classifies it `project`, and Task 769 owns the next change to that
  detector. Widening it in this task would collide with 769 head-on.
- The regression that matters — someone re-introducing `var(--space-0)` into this file — is caught by Task 770's
  gate once it lands, and until then by the frozen-file rule in Sprint 65 §4.

Two alternatives were considered and rejected by the owner: a throwaway file-specific detector (rejected — it
duplicates a predicate that Task 770 would then have to retire, the F6 problem from Task 767's review), and folding
the declaration into Task 770 (rejected — it costs the isolation D65-D was written to buy and pushes 770's census
back to 43 / 80).

The executor does not re-open this. It states D65-E and its consequence in the completion report (R7), and treats
the comparators' exit codes as the verification the exception is conditional on.

## 7. Scope

- `src/components/ui/AppImage.module.css` — one declaration (§5.1) and its header/rule comments (§5.2).
- `docs/sessions/2026-08-<dd>-task768-appimage-d65d-spacing-closure.md` — session log.
- `docs/sessions/evidence/task768/` — retained pre/post captures (§13).
- `docs/backlog.md` — concise state update; D65-D moves from PENDING to CLOSED.

## 8. Out of scope

AppImage motion, radius, variants, image loading, `sizes`/`priority`, markup, `AppImage.tsx`, `appImageConfig.ts`;
the six `--space-0` reads in §3.5; `--spacing-0`; `globals.css` in any form; `@theme inline`; Task 769's detector
work; Task 770's census, manifest and ownership gate; Task 771; route certification (Task 667 / D65-C); the Task 766
F1 CI follow-up; legacy-story retirement.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| `AppImage.module.css` `var(--space-0)` reads | 1 (`:142`) | **0** |
| `.imageLayer` computed `inset` | `0px` | `0px` — **unchanged** |
| Class-3 inventory in file header | one row | recorded as closed, list empty |
| `--space-0` declaration at `globals.css:128` | present | **present, untouched** |
| Live `var(--space-0)` reads across `src/` | 11 | **10** — only AppImage's is closed (§3.5) |
| Homepage Level-3 pairs (Task 770's census) | 43 / 80 | 42 / 79 (proved by 770, not here) |

## 10. Mandatory first action

**§10.0 — prove the tree and re-measure, before any source edit.**

```powershell
node.exe -p process.platform
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline          # must be the atomic Task 768 filing commit, based on Task 767 in main
git --no-optional-locks merge-base --is-ancestor 31544b316 HEAD
if ($LASTEXITCODE -ne 0) { throw "Task 767 commit 31544b316 is not an ancestor of this tree; do not start Task 768" }
git --no-optional-locks diff --quiet 31544b316..HEAD -- src
if ($LASTEXITCODE -ne 0) { throw "src/ changed after Task 767; this kickoff's measured baseline no longer describes the tree" }
rg -n 'inset:\s*var\(--space-0\)' src/components/ui/AppImage.module.css
rg -n --fixed-strings -- '--space-0' src/       # expect exactly 15 hits, matching the §3.5 breakdown line for line
rg -n --fixed-strings -- 'var(--space-0)' src/ # expect exactly 12 hits = 11 live reads (AppImage:142 + the ten of
                                               # §3.5) + 1 comment (AppImage:34). AppImage contributes 2 of the 12.
rg -n -- '--space-0:\s' src/app/globals.css    # expect exactly one hit, :128, inside @theme inline (:35-316)
npm.cmd run check:design-tokens
npm.cmd run check:css-vars
```

Expected: exactly one live `inset: var(--space-0)` declaration in `AppImage.module.css`, one `--space-0` declaration
in `globals.css`, both gates green. **If any reading differs from §3, stop and report** — the carve-out no longer
describes the tree, and D65-D was written against the tree described in §3.

## 11. Acceptance criteria

- **AC1 [R1, R2]** — Given the final `git diff --stat`, then exactly one file under `src/` appears, it is
  `src/components/ui/AppImage.module.css`, and its diff is the one declaration of §5.1 plus the comment edits of
  §5.2. The full `git diff` for that file is pasted.
- **AC2 [R1]** — Given `rg -n -- '--space-0' src/components/ui/AppImage.module.css` after the edit, then the only
  hits are comment lines; zero declarations read the name. Both the §10.0 run and the final run are pasted.
- **AC3 [R3]** — Given a pre-edit and a post-edit run of the **unchanged** Task 765 harness
  (`docs/sessions/evidence/task765/capture-appimage-styles.mjs`), then for every captured entry
  **`imgComputed.inset === "0px"` in both phases**, and the pre/post pair is byte-equal across
  `containerComputed`, `imgComputed`, `imgState` and the `hover1024en` object. Both JSON files are retained under
  `docs/sessions/evidence/task768/` and the comparison output is pasted.

  **Read the right field.** `.imageLayer` is applied to the `<img>` element itself
  (`src/components/ui/AppImage.tsx:145`, `className={cn(styles.imageLayer, …)}`), **not** to the frame that wraps it.
  The harness records the wrapper under `containerComputed` and the `<img>` under `imgComputed`
  (`capture-appimage-styles.mjs:73-99`). The wrapper is not absolutely positioned, so its `inset` computes to `auto`
  in both phases — asserting on `containerComputed.inset` would pass identically before and after the edit and prove
  nothing. **The claim lives in `imgComputed.inset` and nowhere else.**

  **Comparator (run it; do not eyeball the JSON).** The capture file carries no timestamp, so the comparison is
  deterministic. Walk `story → widths[width][locale] → [index]` and compare only the four objects named above; report
  any difference in `src`, `imgClass` or `containerClass` **separately** as a fixture/markup red flag rather than
  folding it into the geometry verdict.

  **Normalise the class names, or this arm fires on every run.** CSS-Module classes render as
  `_<name>_<moduleHash>_<line>` — measured, e.g. `_imageLayer_1gyx9_30 _fade_1gyx9_30 _visible_1gyx9_30`. Editing
  `AppImage.module.css` changes the module's content hash, and §5.2's comment edits can shift the line segment, so
  **both suffixes are expected to change in this task** while the symbolic class list must not. The comparator below
  strips `_<hash>_<line>` and compares the sorted symbolic names; a diff surviving that normalisation means a class
  was actually added, removed or renamed, which §5.1 forbids. The same applies inside `hover1024en`, whose entries
  also carry `imgClass`/`containerClass`: it is compared on `restTransform`, `restFilter`, `hoverTransform`,
  `hoverFilter` and `note`, never as a whole object.

  ```powershell
  node.exe -e "const a=require('./docs/sessions/evidence/task768/capture-pre.json'),b=require('./docs/sessions/evidence/task768/capture-post.json');const K=['containerComputed','imgComputed','imgState'];const N=x=>(x||'').split(/\s+/).filter(Boolean).map(c=>c.replace(/^_(.+?)_[a-z0-9]+_\d+$/,'$1')).sort().join(' ');const d=[],f=[],miss=[];for(const s of Object.keys(a)){for(const w of Object.keys(a[s].widths)){for(const l of Object.keys(a[s].widths[w])){const A=a[s].widths[w][l],B=b[s].widths[w][l];if(A.length!==B.length){d.push(s+' '+w+' '+l+' entry-count '+A.length+'->'+B.length);continue}A.forEach((e,i)=>{const g=B[i];for(const k of K)if(JSON.stringify(e[k])!==JSON.stringify(g[k]))d.push(s+' '+w+' '+l+' #'+i+' '+k);if(e.src!==g.src)f.push(s+' '+w+' '+l+' #'+i+' src');for(const k of ['imgClass','containerClass'])if(N(e[k])!==N(g[k]))f.push(s+' '+w+' '+l+' #'+i+' '+k+' '+N(e[k])+' -> '+N(g[k]));if(g.imgComputed.inset!=='0px')miss.push(s+' '+w+' '+l+' #'+i+' post-inset='+g.imgComputed.inset);if(e.imgComputed.inset!=='0px')miss.push(s+' '+w+' '+l+' #'+i+' pre-inset='+e.imgComputed.inset)})}}const HK=['restTransform','restFilter','hoverTransform','hoverFilter','note'];const ha=a[s].hover1024en||[],hb=b[s].hover1024en||[];if(ha.length!==hb.length)d.push(s+' hover1024en entry-count '+ha.length+'->'+hb.length);else ha.forEach((e,i)=>{const g=hb[i];for(const k of HK)if(e[k]!==g[k])d.push(s+' hover1024en #'+i+' '+k+' '+e[k]+' -> '+g[k]);for(const k of ['imgClass','containerClass'])if(N(e[k])!==N(g[k]))f.push(s+' hover1024en #'+i+' '+k)})}console.log('geometry/state/hover diffs:',d.length,d);console.log('fixture/markup diffs:',f.length,f);console.log('inset != 0px:',miss.length,miss);process.exitCode=(d.length||f.length||miss.length)?1:0"
  ```

  **It exits non-zero on any delta** (`process.exitCode` on the last statement) — check `$LASTEXITCODE` and paste it.
  A comparator that only prints is not evidence: an executor scrolling past a printed diff is exactly how a broken
  migration gets reported as clean.

  Required output: `geometry/state/hover diffs: 0`, `fixture/markup diffs: 0`, `inset != 0px: 0`, `$LASTEXITCODE` 0.
  A non-empty
  `inset != 0px` list on **pre** means §3 no longer describes the tree (§14.1); on **post** it means the edit
  changed rendering and the task fails.
- **AC4 [R3]** — Given `npm.cmd run screenshots:assert -- --mantine-only` before and after, run through §13's
  copy-out procedure, then `docs/sessions/evidence/task768/{pre,post}/` each hold `manifest.json`, the report, the
  console transcript and `source-run-dir.txt`, and the two `source-run-dir.txt` values **differ**. §13's keyed
  comparator prints identical cell counts and `verdict/failReason deltas: 0`, and its output is pasted. The
  AppImage-bearing cells are listed by `storyId|locale|viewport`. The aggregate exit code is **not** the claim; any
  delta is named cell by cell, or the run is repeated until it is. A `-1` asserted away rather than identified is a
  stop condition (§14.3).
- **AC5 [R4]** — Given the final diff, then it introduces no `design-tokens-allow:` marker, no allowlist row, no
  baseline row, no new custom property, no `@apply`; and `check:design-tokens` and `check:css-vars` both exit 0.
- **AC6 [R5, R6, R7]** — Given the session log, then it carries a Files Changed table matching the real diff, quotes
  D65-D verbatim, records the §3.6 asymmetry and the resumption of the AppImage freeze, and states the §6
  no-control decision explicitly. `docs/backlog.md` carries a concise state line and moves D65-D to CLOSED.

## 12. Pre-read rule bundle

`docs/ai-behavior.md` → "Backlog & Session Log Rules"; `docs/design-system.md` §22.1 (spacing tokens), §23.6.c,
§23.7; Sprint 65 plan §4 (the AppImage freeze this task carves into) and its binding rules;
`Codex-tasks/Task_768_AppImage_D65D_Spacing_Closure.md` (candidate brief this kickoff supersedes);
`docs/sessions/2026-08-24-task765-runtime-motion-radius-tokens-blocked.md` (the harness and its known limits);
`docs/reviews/2026-08-26-task767-homepage-runtime-token-exit.review-ledger.json` (F6's duplicate-predicate note,
cited by §6).

## 13. QA profile and verification plan

**Rendered evidence, both phases, retained under `docs/sessions/evidence/task768/`:**

**The harness output is ignored and self-overwriting — copy it out immediately.** Measured:
`scripts/check-stories-rendered.mjs:1469` builds its output directory as
`new Date().toISOString().slice(0,16).replace(':','-')`, i.e. **minute precision**, under
`.screenshots/rendered-assert/<ts>/`, and `/.screenshots/` is gitignored (`.gitignore:55`). Two runs inside the same
minute therefore write into the **same** directory and the second silently overwrites the first, and nothing under
`.screenshots/` can ever be committed as evidence. Copy `manifest.json`, the report and the console transcript into
the phase folder **before** starting the next run.

**A failed build must not be allowed to produce evidence.** `Tee-Object` in a pipeline swallows the exit status, so
a broken `build-storybook` would leave the previous `storybook-static/` in place and the next two steps would
happily measure **the old build**. Capture `$LASTEXITCODE` immediately after each command and stop on it. Exit-code
semantics for `screenshots:assert`, measured from the harness's own contract
(`scripts/check-stories-rendered.mjs:58-59`): **0** = clean, **1** = controlled "defects found" (expected here, the
suite carries standing debt), **2** = harness crash (`uncaughtException` / `unhandledRejection`) — a 2 means the run
measured nothing and must hard-stop.

**The report is a separate, gitignored file.** Measured: the run regenerates
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` (205 KB, gitignored at
`.gitignore:74`) — it is **not** inside `.screenshots/`, so copying the run directory does not capture it, and the
next run overwrites it in place. Copy it into the phase folder before the next run or it is gone.

```powershell
function Save-Phase($phase, $prevRunDir) {
  $bs = $LASTEXITCODE
  "build-storybook exit=$bs" | Set-Content "docs/sessions/evidence/task768/$phase/exit-codes.txt"
  if ($bs -ne 0) { throw "$phase build-storybook failed (exit $bs) - storybook-static is stale; evidence would measure the previous build" }
}

New-Item -ItemType Directory -Force docs/sessions/evidence/task768/pre, docs/sessions/evidence/task768/post

# ── PRE ──
npm.cmd run build-storybook 2>&1 | Tee-Object docs/sessions/evidence/task768/pre/build-storybook.log; Save-Phase pre
npm.cmd run screenshots:assert -- --mantine-only 2>&1 | Tee-Object docs/sessions/evidence/task768/pre/screenshots-assert.log
$sa = $LASTEXITCODE; "screenshots:assert exit=$sa" | Add-Content docs/sessions/evidence/task768/pre/exit-codes.txt
if ($sa -eq 2) { throw "PRE screenshots:assert crashed (exit 2) - the run measured nothing" }
if ($sa -notin 0,1) { throw "PRE screenshots:assert returned unexpected exit $sa" }
$pre = Get-ChildItem .screenshots/rendered-assert | Sort-Object LastWriteTime | Select-Object -Last 1
Copy-Item "$($pre.FullName)/*" docs/sessions/evidence/task768/pre/ -Recurse -Force -Exclude *.png
Copy-Item docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md docs/sessions/evidence/task768/pre/inventory-report.md -Force
"$($pre.Name)" | Set-Content docs/sessions/evidence/task768/pre/source-run-dir.txt
node.exe docs/sessions/evidence/task765/capture-appimage-styles.mjs pre ..\task768
if ($LASTEXITCODE -ne 0) { throw "PRE capture harness failed (exit $LASTEXITCODE)" }

#   apply §5 — one declaration, two comments — then:

# ── POST ──
npm.cmd run build-storybook 2>&1 | Tee-Object docs/sessions/evidence/task768/post/build-storybook.log; Save-Phase post
npm.cmd run screenshots:assert -- --mantine-only 2>&1 | Tee-Object docs/sessions/evidence/task768/post/screenshots-assert.log
$sa = $LASTEXITCODE; "screenshots:assert exit=$sa" | Add-Content docs/sessions/evidence/task768/post/exit-codes.txt
if ($sa -eq 2) { throw "POST screenshots:assert crashed (exit 2) - the run measured nothing" }
if ($sa -notin 0,1) { throw "POST screenshots:assert returned unexpected exit $sa" }
$post = Get-ChildItem .screenshots/rendered-assert | Sort-Object LastWriteTime | Select-Object -Last 1
if ($post.Name -eq $pre.Name) { throw "POST run reused the PRE output directory ($($pre.Name)) - minute-precision collision; wait a minute and re-run POST" }
Copy-Item "$($post.FullName)/*" docs/sessions/evidence/task768/post/ -Recurse -Force -Exclude *.png
Copy-Item docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md docs/sessions/evidence/task768/post/inventory-report.md -Force
"$($post.Name)" | Set-Content docs/sessions/evidence/task768/post/source-run-dir.txt
node.exe docs/sessions/evidence/task765/capture-appimage-styles.mjs post ..\task768
if ($LASTEXITCODE -ne 0) { throw "POST capture harness failed (exit $LASTEXITCODE)" }
```

Neither `throw` is optional decoration. Without the build guard, a failed rebuild silently re-measures the previous
`storybook-static/`; without the directory guard, a fast POST run reads the PRE manifest back and produces a
perfect, meaningless zero-delta. Both `exit-codes.txt` files are part of the retained evidence.

**Cell comparison — keyed, not whole-file.** `manifest.json` carries a `timestamp` and a `matrix` of cells whose
identity is `storyId` + `locale` + `viewport` (`check-stories-rendered.mjs:847-...`, cells also carry `width`,
`verdict`, `retryCount` and `assertions.renderCheck.failReason`). Compare on identity + outcome only — never the
whole JSON, which differs by timestamp and retry noise on every run:

```powershell
node.exe -e "const k=c=>c.storyId+'|'+c.locale+'|'+c.viewport;const a=require('./docs/sessions/evidence/task768/pre/manifest.json'),b=require('./docs/sessions/evidence/task768/post/manifest.json');const A=new Map(a.matrix.map(c=>[k(c),c])),B=new Map(b.matrix.map(c=>[k(c),c]));const d=[];for(const [key,x] of A){const y=B.get(key);if(!y){d.push(key+' MISSING in post');continue}const rx=x.assertions?.renderCheck?.failReason??'',ry=y.assertions?.renderCheck?.failReason??'';if(x.verdict!==y.verdict||rx!==ry)d.push(key+' '+x.verdict+'/'+rx+' -> '+y.verdict+'/'+ry)}for(const key of B.keys())if(!A.has(key))d.push(key+' NEW in post');console.log('pre cells',A.size,'post cells',B.size);console.log('verdict/failReason deltas:',d.length);d.forEach(x=>console.log('  '+x));process.exitCode=(d.length||A.size!==B.size)?1:0"
```

This comparator also sets a non-zero `process.exitCode` on any delta or cell-count mismatch; record `$LASTEXITCODE`.

Required: identical cell counts, `verdict/failReason deltas: 0`, `$LASTEXITCODE` 0. **Any non-zero delta must be named cell by cell
in the completion report** — an aggregate `-1` explained by a category rather than a cell is a stop condition
(§14.3). Then list, by `storyId|locale|viewport`, the AppImage-bearing cells the run actually contained; that list —
not the aggregate pass count — is the exact rendered scope this task proved.

**What the harness covers, measured:** three stories — `mantine-primitives-listingcard--default`,
`mantine-primitives-popularlocationsview--default`, `admin-admincompaniesmanager--default` — at widths
320/375/390/768/1024/1440, with all four locales at 320 and 1440 and `en` elsewhere, plus one hover pass at
1024/`en`. `inset` is already in its `GEOMETRY_PROPS` list, so no harness edit is needed or permitted, and the
harness already splits wrapper from `<img>` — AC3 reads `imgComputed`, never `containerComputed`.

The harness writes to `join(ROOT, 'docs/sessions/evidence/task765', <outDir>)`, so the `..\task768` argument above
resolves to `docs/sessions/evidence/task768/capture-<label>.json`. It does **not** create the directory — the
`New-Item` line is required, not decorative.

**Two traps in the harness, pre-measured:**

1. `admin-admincompaniesmanager--default` covers the `avatar` variant, and `FIXTURE_COMPANIES` ships
   `logo_url: null` for every row, so **no `<img>` renders**. Task 765 worked around this with a reversible
   fixture probe, hash-proven reverted. **Do not repeat that probe.** Record the cell as null in both phases; the
   `avatar` variant does not exercise `.imageLayer` geometry differently from the other two, and a null-vs-null
   comparison is honest evidence of nothing rather than dishonest evidence of something.
2. `screenshots:assert` is now Mantine-only by default (`a7dbd4c12`). Keep the explicit `-- --mantine-only` flag in
   the transcript so the recorded scope stays unambiguous, and never substitute `screenshots:assert:full`.

**Gates:** `check:design-tokens`, `check:css-vars`, `check:tailwind-runtime-tokens` (expected unchanged at 0/0),
`typecheck`, `build`, `build-storybook`, `check:stories`.

## 14. Stop conditions

Stop and report, without editing source, if any of these holds:

1. §10.0's readings differ from §3 in any particular — count, line, block, or declaration site.
2. `check:design-tokens` reports the new `inset: 0` line despite §3.4. Do **not** add a marker to silence it.
3. The `-1` in any `screenshots:assert` pair cannot be named cell by cell.
4. Closing this dependency appears to require touching any second declaration, any second file under `src/`, or
   `globals.css`. D65-D authorises one line; a second line is a new owner decision.
5. Task 767 is not yet in `main`.
6. The §16 filing commit has not landed — `docs/backlog.md` still shows
   D65-D `PENDING`, or carries no registry row for 768, or `Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md:84`
   still lists 768 as blocked.
7. The POST `screenshots:assert` run resolves to the same `.screenshots/rendered-assert/<ts>` directory as the PRE
   run (§13's `throw`), or either phase folder is missing `manifest.json` or `source-run-dir.txt`.
8. `imgComputed.inset` is anything other than `"0px"` in the **pre**-edit capture.

## 15. Completion report contract

State: the one-line diff in full; the §10.0 and final `rg` censuses; the AC3 JSON comparison with the enumerated
differing keys; the AC4 cell lists for both runs; every gate exit code; the §6 no-control statement; the §3.6
asymmetry note; and `git status --porcelain` proving no stray artifact. Status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **Never self-approve. Committing and pushing is owner-only.**


## 16. Filing contract — the atomic commit that makes this real

This kickoff is `FILED — ready for executor` only because **one** commit, landed on `main` **after** Task 767 merged,
changes all four registers together. Splitting the same update across two commits would put the tree in a state where
one register contradicts another, which is precisely the projection drift Task 747's gate exists to detect.

The commit contains exactly:

1. `tasks/Sprints/Sprint_65_kickoff_prompt_Task_768_AppImage_D65D_Spacing_Closure.md` — this file, with its
   **Status** line set to `FILED — ready for executor` because D65-E (§6) is propagated to the registers in the
   same commit; otherwise the valid state would be `FILED — BLOCKED ON D65-E`.
2. `docs/backlog.md` — the Sprint 65 line's `⚠️ D65-D PENDING, blocks filing 768` replaced by `✅ D65-D CLOSED
   2026-08-26` with the decision's one-line substance; a new registry row for **768**; the pointer moved to
   `Last used **768**, NEXT FREE **769**`; and the Last Session / 767 state line updated for the merge.
3. `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — the D65-D row at `:84` moved from
   `⚠️ PENDING — must be resolved before Task 768 is filed` to `✅ CLOSED 2026-08-26`, quoting the decision, and the
   768 entry changed from candidate/blocked to filed.
4. `docs/backlog-archive.md` — Task 766's registry row moved here as one ledger row, newest first, per the backlog's
   own one-row rule (see **Line budget** below).

Nothing outside those **four** files. No `src/` file, no script, no gate, no evidence directory.

**Line budget.** `docs/backlog.md` is at its `~80` limit and Task 767's review recorded the overrun as F8. Task 766
is merged, so its registry row is archivable — that is what file 4 above is for. Archiving it in this same commit
pays for 768's new row, instead of trimming another entry's active state.

**D65-E must be propagated, not buried.** The decision recorded in §6 of this file is invisible to any agent that
reads only the registers. The same filing commit must therefore carry its **state** — not its full text — into both:
`docs/backlog.md`'s Sprint 65 line gains `✅ D65-E DECIDED 2026-08-26 — one-task exception to rule 1 for 768; durable
control transfers to 770`, and `Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` gains a D65-E row beside D65-D
carrying the same one-liner and pointing at §6 here for the full text. A control-rule exception that lives only
inside a task file is how the next sprint quietly inherits an exception nobody voted for.

Suggested message: `docs(Task768): file the AppImage D65-D spacing closure kickoff`.
