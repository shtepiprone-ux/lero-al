# Task 766 — Revision 1: the gate does not reject what its own contract says it rejects

**Filed:** 2026-08-25 by the orchestrator, after reviewing the `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
submission. **Review verdict on that submission: `NEEDS REVISION`.** An earlier `APPROVED WITH NOTES` verdict was
issued in chat and is **withdrawn**; no commit/push handoff accompanied it and none was valid.

This brief supersedes exactly the sections of
`tasks/Sprints/Sprint_65_kickoff_prompt_Task_766_Homepage_Literal_Utility_Exit.md` named in §6 and changes nothing
else. No review ledger accompanies this verdict: `docs/reviews/*.review-ledger.json` is the approval instrument
(`docs/agent-contract.md` §9a). A rejection is recorded here and in `docs/backlog.md`.

**Mode and task type:** `TASK DESIGN` — governance gate correction (D28). **Sprint:** 65. **QA profile:** `Q3`
(unchanged). **Baseline:** the working tree as submitted, on top of `846113faa`.

**The product change is accepted and is not reopened.** This revision touches the gate and its failure proof, plus
four documentation corrections. No `.tsx`, no `.module.css`, no `globals.css`, no `layout.tsx` edit is authorized.

---

## 1. Accepted as implemented — do not re-work, do not re-touch

Verified independently by the reviewer against the real diff and the real build output, not from the executor's
report. These stay exactly as they are on disk:

- **AC1 — the 6 → 0 census.** Re-run by the reviewer against the three target files: zero matches for
  `overflow-hidden`, `flex flex-col`, `grayscale`, `opacity-60`, `animate-spin`, `min-h-`. Confirmed.
- **AC2 / AC3 — the card.** `@layer utilities { .archived { filter: grayscale(1); opacity: .6 } }` confirmed
  present in the built CSS as `.MantineListingCardPattern_archived__CQB1x` in
  `.next/static/css/8cd786c7c3032b44.css`. Both `cn()` branches read the same single class.
- **The `@layer utilities` cascade decision (handoff Q1).** Upheld. Module-scoped `@layer utilities` is already an
  established pattern in this repo — three other module chunks in `.next/static/css/` ship one — and the Tailwind
  chunk (`b4293216986fc85d.css`) declares `properties`, `theme`, `base`, `components`, `utilities` in that order.
  Card contests neither `filter` nor `opacity`. The decision is correct and the header's reasoning is sound.
- **AC4 — the spinner.** Local `@keyframes` + `.pendingIcon` confirmed in the built CSS; `--motion-duration-spinner:
  1s` confirmed defined and resolvable. **The `var(--motion-duration-spinner, 1s)` fallback floated during review
  is explicitly NOT requested** — it would duplicate the value against the single-source contract, and
  `check:css-vars` already guards the definition. Do not add it.
- **AC5 — the route shell.** `route-shell.pre-edit.json` / `route-shell.post-edit.json` accepted as retained
  evidence; `minHeight` and `paddingBottom` identical at both viewports, `resolvedFrom` flips from the Tailwind rule
  to the inline style. The CSS-Nesting bug the executor found and fixed in the probe's walker (leaf check
  unconditional, recurse only when `cssRules.length > 0`) is correct and was verified in source.
- **AC7 / AC8 — scope hygiene.** Diff is exactly 7 tracked + 6 untracked files. `AppImage.tsx`,
  `appImageConfig.ts`, `AppImage.module.css` absent from `git diff --stat`; `globals.css` shows exactly one added
  line, zero removed.
- **The removal (not reproduction) of `overflow-hidden` and `flex flex-col`.** Accepted. The dependency on
  `@mantine/core` 8.3.18's own unlayered `Card.css` is real, measured pre- and post-edit, and pinned. Recorded in §7
  as a **future-risk note**, not a defect, and not something this revision fixes.
- **The `screenshots:assert` exit-1 disclosure (§10 of the session log).** The executor's handling was correct and
  is the standard: the real exit code was captured unpiped, the notification's masked `0` was rejected, and the
  unproven part was flagged rather than asserted away. That discipline is upheld. Only the log's **evidence set**
  is incomplete — see R14.

Re-running verification for any of the above is **not** required. Re-run only what §10 names.

---

## 2. Defects. One of them is mine.

### E-1 (executor, blocking) — the traversal rejects two shapes and lets every other one through

Kickoff §6 states the contract as: *"Rejects **any** static class literal at those sites."* AC6 binds the gate to
that contract. The delivered `findLiteral()` walks only `StringLiteral`,
`NoSubstitutionTemplateLiteral`, parentheses, `&&`, and `? :`. Everything else at the same two sites passes.

Reproduced by the reviewer on 2026-08-25 in an isolated sandbox — the **shipped script, unmodified**, copied to a
scratch root with `node_modules` symlinked to the repo's, and the three target paths populated with probe source.
All of the following produced **`✅ 0 static class literals across 3 guarded files.` / exit 0**:

| # | Shape | Reachable today? |
|---|---|---|
| 1 | `cn(styles.card, { 'grayscale opacity-60': isArchived })` | **Yes** — `cn` is `twMerge(clsx(inputs))` (`src/lib/utils.ts:4`); `ClassValue` includes objects |
| 2 | `` className={`flex flex-col ${cls}`} `` | **Yes** — `ts.isTemplateExpression` is never tested; only the no-substitution form is |
| 3 | `cn(['overflow-hidden'])` | **Yes** — `ClassValue` includes arrays |
| 4 | `isArchived \|\| 'opacity-60'` | **Yes** — only `&&` is walked |
| 5 | `const LOCAL_CLS = 'grayscale opacity-60'` → `className={LOCAL_CLS}` | **Yes** — plain JS, same file |
| 6 | `cx('animate-spin')` / `clsx('animate-spin')` | Not today — callee test is `text === 'cn'`; no `cx(` call sites exist in `src/` |
| 7 | `<Box classNames={{ root: 'min-h-screen' }} />` | Not today — the prop is not scanned at all |

Control, same sandbox, same script: the two shapes the executor actually planted **do** fire correctly —

```
src/design-system/mantine/patterns/MantineListingCardPattern.tsx:4 — "overflow-hidden" (JSX className attribute (static string literal))
src/design-system/mantine/patterns/MantineListingCardPattern.tsx:5 — "grayscale opacity-60" (cn() argument)
EXIT=1
```

**Why the plants did not catch this.** P1 and P2 were **shape-identical to the code that had just been removed**
(`className="animate-spin"`, `cn(… && '…')`). They proved the gate reproduces its own known-positive. They could
not, by construction, probe a boundary. A plant that re-plays the removed literal verbatim is a regression test for
the fix, not a proof of the control.

**Secondary, same defect class:** the script header claims coverage it does not have — *"a static string/template
literal"* and *"including ones nested behind `&&`, `? :`, or parentheses"* read as full template-literal support.
Interpolated templates are the single most likely re-entry shape and are uncovered. A header that overstates a
gate's reach is the exact failure mode Sprint 62's binding rule exists to prevent.

### O-1 (orchestrator, mine) — kickoff §6 enumerated the sites too narrowly

Rows 6 and 7 above are **not** the executor's defect. Kickoff §6 named the inspected sites as *"JSX `className`
string literals and string literals passed to `cn()`"*. Mantine's `classNames={{ root: … }}` prop is a different
site, and `cx`/`clsx` are different callees; neither was named, so neither was in the delivered contract. I am
widening the contract here and owning the widening. Rows 1–5 are within the sites §6 already named and are
squarely E-1.

### N-1 (note, not a defect, not in this revision) — the gate does not run in CI and has no self-test

Factually established: `.github/workflows/governance-pr.yml` runs `check:design-tokens:strict` (`:122`) and
`check:tailwind-runtime-tokens` (`:125`); `check:homepage-literal-utilities` appears nowhere in either workflow.
Sibling gates additionally ship a retained self-test step (`check:hydration:verify`, `check:listing-visibility:verify`).

**This is out of Task 766's scope and the executor is not asked to fix it.** Kickoff §7 authorizes an npm script
entry and nothing in `.github/`; Sprint 65 specifies executed reversible plants as the failure proof, not CI wiring
and not a `--verify-gate` mode. It is filed as a **single owner re-scope item** — CI wiring and `--verify-gate`
belong together, because they answer the same question: the plants are ephemeral by design, so once this revision's
plants are reverted, nothing in the tree can re-prove detection. Raise it at Sprint 65 owner review; do not act on
it here.

---

## 3. Verified context — measured 2026-08-25 by the reviewer

- `src/lib/utils.ts:4` — `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }`. Arrays and
  objects are supported input, not exotic usage.
- `grep -rn "\bcx(" src --include=*.tsx` → empty. No `cx`/`clsx` call site exists in `src/` today.
- None of the three target files currently uses a `classNames` prop.
- `.screenshots/rendered-assert/` contains `2026-08-21T17-28`, `2026-08-24T10-16`, `2026-08-24T21-08`.
- `2026-08-24T21-08/manifest.json`, 8108 cells, queried directly by the reviewer: `ListingCardPattern` → 16 cells,
  **all `pass`**; `LocaleSwitcher` → **96** cells, **all `pass`** (all its stories, not only `Default`).
- `scripts/responsive-screenshots.mjs` drives a **fixed story-id list**. It contains neither
  `patterns-mantine-listingcardpattern--default` nor `mantine-primitives-localeswitcher--default`.
- `scripts/task766-route-shell-probe.mjs:97` returns `matches[matches.length - 1]` — last matching rule in document
  order. That is a document-order heuristic, not cascade resolution (no specificity, no layer order, no
  `!important`).

---

## 4. Requirement ledger

| Req | Closes | Acceptance |
|---|---|---|
| R11 | E-1 rows 1–5 | AC9 |
| R12 | O-1 rows 6–7 | AC9 |
| R13 | E-1 secondary (header overstatement) + false-positive risk from R11/R12 | AC10, AC11 |
| R14 | Session-log evidence gaps | AC12 |
| R15 | Backlog state | AC13 |

---

## 5. Implementation requirements

### R11 — widen the traversal to every shape that statically reduces to a class literal at the named sites

In `scripts/check-homepage-literal-utilities.mjs`, `findLiteral()` (and its callers) must additionally resolve:

- **`TemplateExpression`** — flag when the template's `head` or any span's `literal` carries non-whitespace text.
  Report the whole raw template text as the literal, not just the matching fragment. `` `${cls}` `` with an empty
  head and empty spans is not a violation.
- **`ArrayLiteralExpression`** — recurse into every element.
- **`ObjectLiteralExpression`** — recurse into every property **name**: `StringLiteral` keys and computed keys whose
  expression is a string literal both count. clsx treats the key as the class name, so the key is the literal.
  Property *values* are conditions, not class names — do not flag them.
- **`||` and `??`** — walk both operands, exactly as `&&` walks its right operand.
- **Identifier indirection, bounded** — when a `className` site or a `cn()` argument is an `Identifier` that resolves
  **within the same file** to a `const` declaration whose initializer is one of the shapes above, flag it and report
  the **declaration's** file/line alongside the use site. Scope is deliberately narrow: same file, `const` only,
  literal-shaped initializer, no reassignment tracking, **no cross-file resolution, no type checker, no program
  construction** — `ts.createSourceFile` stays the only parse entry point. An identifier that does not resolve that
  way stays permitted, as today.

`ConditionalExpression` must report **both** branches, not the first match only — the current
`findLiteral(whenTrue) ?? findLiteral(whenFalse)` silently drops the second literal of `cond ? 'a' : 'b'`.

Return a **list** of violations per site, not a single node, so one `cn()` argument can yield more than one finding.

### R12 — widen the inspected sites

- Callee test accepts `cn`, `cx`, and `clsx` (identifier callees only; no member expressions, no aliasing analysis).
- Add the Mantine **`classNames`** JSX prop as an inspected site: an object literal whose property **values** are
  the class names (the inverse of clsx's object form — `classNames={{ root: 'min-h-screen' }}` puts the literal in
  the value). Flag string/template literals in those values. Also handle `classNames={cn(...)}`-style expressions by
  falling through to the same resolver.

State in the header that `classNames` and the `cx`/`clsx` callees are covered **defensively** — neither is used in
these three files today.

### R13 — correct the header, and prove the widened gate does not fire on permitted code

- Rewrite the `WHAT IT CHECKS` / `WHAT IS PERMITTED` block to describe the shapes actually covered after R11/R12.
  Remove the current wording that implies full template-literal support. Keep the boundary sentence about Task 667
  and the three fixed files verbatim — it is correct and required by kickoff §6.
- The widened traversal is the new false-positive risk. The permitted forms — `styles.x`, `className={className}`,
  `overlay.className`, `classNames={{ root: styles.x }}`, `` `${cls}` `` with no literal text, an identifier that
  does not resolve to a literal `const` — must still produce exit `0`.

### R14 — close the session log's evidence gaps

Edits to `docs/sessions/2026-08-25-task766-homepage-literal-utility-exit.md` only. Do not restructure the log; add
and correct in place, and add a dated `Revision 1` note at the top saying what changed and why.

1. **§10 — record the pixel evidence that actually closes the gap.** All **32** PNGs of the two target stories
   (`Patterns/Mantine/ListingCardPattern/Default` and `Mantine/Primitives/LocaleSwitcher/Default`, 16 cells each)
   are **MD5-identical** between the pre-change capture `.screenshots/rendered-assert/2026-08-24T10-16` and the
   post-run `2026-08-24T21-08`. Paste the command and its output. Add the manifest query result: ListingCardPattern
   16/16 `pass`, LocaleSwitcher **96/96** `pass` across all its stories. Then restate §10's conclusion: the missing
   full pre-edit `screenshots:assert` baseline is closed **by byte-identical target-story pixels**, not by the
   absence of the two names from the failure list. Keep the 847-failure disclosure as written.
2. **§9 — annotate the `screenshots:responsive:storybook` row.** Add: *"does not cover either touched story —
   `scripts/responsive-screenshots.mjs` drives a fixed story-id list containing neither
   `patterns-mantine-listingcardpattern--default` nor `mantine-primitives-localeswitcher--default`; this row is not
   evidence for AC2–AC4."* An exit-0 row sitting in an evidence table reads as coverage.
3. **§6 — downgrade the `resolvedFrom` wording.** *"positively proving the value's source changed"* overstates the
   tool. Replace with a statement that the probe reports the **last matching rule in document order**, plus an
   inline-style short-circuit; that this is a heuristic, not a cascade resolver; and that it is nonetheless correct
   for this diff, because pre-edit exactly one rule set `min-height` and post-edit the inline style takes
   precedence. Add the same caveat to the probe's own header in `scripts/task766-route-shell-probe.mjs`.
4. **§12 / §14 — record the `@mantine/core` 8.3.18 dependency as a future-risk note.** Removing `overflow-hidden`
   and `flex flex-col` outright leaves `display`/`flexDirection`/`overflow` sourced from Mantine's own unlayered
   `Card.css` at a pinned version, with no gate, story assertion or in-code comment guarding it after this diff —
   only the module header's prose. State it as a version-upgrade risk, not a defect of this task.
5. **§5 — replace the plant transcripts** with the R11/R12 set from AC9, and say plainly that the original P1/P2
   were shape-identical to the removed code and therefore proved reproduction, not boundary-holding.

### R15 — backlog

Update the Task 766 row and the `Last Session` line in `docs/backlog.md` to
`🔴 NEEDS REVISION (Revision 1) 2026-08-25`, citing this brief. Two to four lines. Respect the 80-line limit; if the
file is at the limit, condense within the 766 row, do not archive anything.

---

## 6. Sections of the original kickoff this brief supersedes

| Kickoff section | Superseded by | Effect |
|---|---|---|
| §6 "Contract", bullets 2–3 (inspected sites, permitted forms) | R11, R12 | Widened: shapes and sites both |
| §6 "Two executed, reversible plants" table | AC9 | Replaced by the per-shape plant set |
| §11 AC6 | AC9 | Replaced |

Everything else in the kickoff — §5 implementation, §7 scope, §8 out of scope, §11 AC1–AC5/AC7/AC8, §13, §14 stop
conditions, §15 — stands unchanged and is **already satisfied**.

---

## 7. Current and required behavior

| | Current | Required |
|---|---|---|
| `cn(s.card, { 'grayscale opacity-60': isArchived })` | exit 0 | exit 1, naming the **key** |
| `` className={`flex flex-col ${cls}`} `` | exit 0 | exit 1, naming the raw template |
| `cn(['overflow-hidden'])` | exit 0 | exit 1 |
| `isArchived \|\| 'opacity-60'` | exit 0 | exit 1 |
| `const C = 'grayscale opacity-60'; className={C}` | exit 0 | exit 1, naming the **declaration** line and the use site |
| `cx('animate-spin')` | exit 0 | exit 1 |
| `classNames={{ root: 'min-h-screen' }}` | exit 0 | exit 1, naming the **value** |
| `cond ? 'a' : 'b'` | 1 finding | 2 findings |
| `className={styles.x}`, `className={className}`, `overlay.className`, `` `${cls}` `` | exit 0 | exit 0 (unchanged) |
| Real post-766 tree | exit 0 | exit 0 (unchanged) |

---

## 8. Positive and negative flows

**Positive:** the widened gate exits `0` on the real tree, unchanged from today.

**Negative (the point of this revision):** each shape in §7 rows 1–8, planted one at a time into a real target file,
must produce exit `1` with the correct file, line and literal text.

**Negative-control (new, mandatory):** each permitted form in §7 row 9, planted the same way, must produce exit `0`.
Widening a traversal without proving it stays quiet on legal code trades one defect for another.

---

## 9. Acceptance criteria

- **AC9 [R11, R12]** — Given the widened gate, when **each** of the eight violation shapes in §7 is planted
  individually into one of the three target files and the gate is run, then each run exits `1` and names the correct
  file, line and literal; and the identifier-indirection plant additionally names the declaration line. Every plant
  is **actually executed** — a plant reasoned about but not run does not count — reverted before the next is
  planted, and its full transcript with the real unpiped exit code is retained in the session log. After the final
  revert, `git diff` contains only the real implementation: no test-only markup, no leftover import, no orphan
  `const`.
- **AC10 [R13]** — Given the same widened gate, when each permitted form in §7 row 9 is planted individually, then
  each run exits `0`. Transcripts retained.
- **AC11 [R13]** — Given the widened gate on the unmodified post-766 tree, when
  `npm run check:homepage-literal-utilities` is run, then it exits `0` and the header describes exactly the shapes
  and sites now covered, with no claim of coverage the traversal does not have, and with the Task 667 boundary
  sentence intact.
- **AC12 [R14]** — Given the session log after this revision, then §10 carries the 32/32 MD5 result with its command
  output and the manifest counts and a restated conclusion; §9's responsive row carries the non-coverage
  annotation; §6 and the probe header carry the document-order caveat; the Mantine 8.3.18 dependency is recorded as
  a future-risk note; and §5 carries the new plant set with the stated reason the original plants were insufficient.
- **AC13 [R15]** — Given `docs/backlog.md`, then the 766 row and `Last Session` read `NEEDS REVISION (Revision 1)`
  and cite this brief, within the 80-line limit.

---

## 10. QA profile and verification plan

**No product code changes in this revision.** Do **not** re-run the full §13 command list. Re-running `build`,
`build-storybook`, `screenshots:assert`, `check:hydration`, the route probe or the Storybook computed-style capture
is **not** required and should not be reported as evidence — nothing they measure can have changed.

Required, and sufficient:

| Command | Required exit | Why |
|---|---|---|
| `npm run check:homepage-literal-utilities` | 0 | AC11, on the real tree, after all plants are reverted |
| the AC9 plant set (8 runs) | 1 each | the control's failure proof |
| the AC10 negative-control set | 0 each | no new false positives |
| `npm run check:file-integrity` | 0 | the script and the log are changed/untracked files |
| `npm run check:mojibake` | 0 | the log gains pasted command output |
| `git diff --stat` vs `846113faa` | — | paste it; only the gate script, the session log, the probe header and `docs/backlog.md` may differ from the submitted state |

`npx tsc --noEmit` is not required — the gate is `.mjs` and outside the TS program. If you change anything under
`src/`, stop: that is out of scope for this revision.

---

## 11. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Do not self-approve, do not commit, do not push. State
explicitly:

1. The AC9 plant table, one row per shape, with the **real** exit code captured unpiped — the same discipline that
   caught the masked `screenshots:assert` code in the first pass, which was correct and is expected again.
2. The AC10 negative-control results.
3. Any shape in §7 you could **not** make fire, and why — a partial result stated is worth more than a full result
   asserted.
4. Anything in this brief you believe is wrong. The original kickoff's §6 was too narrow and that is recorded above
   as O-1; if this brief has the same problem, say so and prove it rather than implementing around it.

---

## 12. Pre-read

- `tasks/Sprints/Sprint_65_kickoff_prompt_Task_766_Homepage_Literal_Utility_Exit.md` §6, §7, §11
- `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` §4 (binding rules)
- `docs/agent-contract.md` §3a (unpiped exit-code capture), §9a, clause 10
- `scripts/check-homepage-literal-utilities.mjs`, `src/lib/utils.ts`
- `scripts/check-story-coverage.mjs` — the repo's existing `ts.createSourceFile` traversal convention
- `docs/sessions/2026-08-25-task766-homepage-literal-utility-exit.md`

---

## FACTS

- The shipped gate exits `0` on all seven bypass shapes; reproduced by the reviewer in an isolated sandbox with the
  unmodified script.
- The shipped gate exits `1` correctly on the two shapes that were planted.
- `cn` is `twMerge(clsx(inputs))`; `ClassValue` includes arrays and objects.
- `check:homepage-literal-utilities` is absent from both files in `.github/workflows/`.
- `responsive-screenshots.mjs` covers neither touched story.
- Manifest `2026-08-24T21-08`: ListingCardPattern 16/16 `pass`, LocaleSwitcher 96/96 `pass`.

## INFERENCES

- The plants passed because they replayed the removed code verbatim; shape-identical plants cannot probe a boundary.
- Interpolated templates and clsx object keys are the most probable real re-entry paths, being the idiomatic ways to
  write conditional classes in this codebase.

## UNKNOWNS

- Whether the owner accepts N-1 (CI wiring + `--verify-gate` as one re-scope item) or leaves the gate manual-only.
- Whether identifier indirection should later extend across files. This revision deliberately does not.

## CONFLICTS

- Kickoff §6 says *"rejects any static class literal at those sites"* while its own bullet enumerates only two
  shapes. The requirement sentence governs; the enumeration was incomplete. Resolved by R11/R12.
- The gate header claims template-literal coverage the traversal does not have. Resolved by R13.
