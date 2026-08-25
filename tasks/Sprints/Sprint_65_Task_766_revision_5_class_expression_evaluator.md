# Task 766 — Revision 5: replace the shape list with a class-expression evaluator

**Filed:** 2026-08-25 by the orchestrator, after reviewing the Revision 4 submission.
**Review verdict on Revision 4: `NEEDS REVISION` — on the contract, not on the work.**

Revisions 1–4 are **accepted in full and independently verified** (§1). This revision exists because the model is
wrong, not because the implementation is. Four rounds have each closed exactly the AST node kinds the previous
brief named, and a fifth adversarial pass still found seven more in a single sweep. A list of permitted node kinds
cannot satisfy kickoff §6's universally quantified sentence — *"rejects **any** static class literal at those
sites"* — because the list is finite and the sentence is not. **This is the last revision of this gate.** It
replaces enumeration with an evaluator and a stated semantic boundary; if the evaluator is right, there is nothing
left to enumerate.

**Owner decision, 2026-08-25:** §6's universal wording stands and is binding. The alternative — narrowing §6 to
"`const`-only plus the R11/R12 forms" and approving as-is — was considered and **rejected**: Task 766's point is
not that six literals left the tree, it is that a control stands against their return.

**Mode and task type:** `TASK DESIGN` — governance gate correction (D28). **Sprint:** 65. **QA profile:** `Q3`.
**Baseline:** the working tree as submitted at Revision 4, on top of `846113faa`. **No product code changes.**
`.tsx`, `.module.css`, `globals.css` and `layout.tsx` are not authorized to change, and `git diff --stat HEAD` for
`src/`, `package.json` and `docs/backlog.md` must remain the 7 tracked files at `+40/-17` it is today.

---

## 1. Accepted — verified independently by the reviewer on 2026-08-25, do not re-work

Method: the shipped 519-line script, unmodified, copied to an isolated scratch root with `node_modules` symlinked
to the repo's; each form planted individually; exit codes taken directly.

- **All eight R11/R12 shapes fire** with correct file, line and literal. The ternary yields **two** findings, as
  required. The identifier-indirection finding carries `[declared at …:1]`, satisfying AC9's declaration-line
  requirement.
- **Revision 2** — computed key via identifier (`{ [C]: x }`) → exit 1 with declaration line.
- **Revision 3** — parameter shadow, `const { C } = props`, `catch (C)` → exit 0 each; `for (const C = '…';;)` →
  exit 1.
- **Revision 4** — the exact repro (nested `var C` shadowing an outer module-scope `const C`) → **exit 0**. The
  false positive is closed.
- **No false positives introduced.** `styles.card`, `className={className}`, `` `${c}` `` all exit 0; the real tree
  exits 0. The widening did not trade a false negative for a false positive, which was R13/AC10's risk.
- **Product code untouched across all four revisions**; nothing committed; `HEAD` still `846113faa`.
- **R14 evidence set complete** — §10 carries the `md5sum` loop and `32 MATCH, 0 DIFFER`; §9 carries the
  non-coverage annotation; the document-order caveat is in both §6 and the probe header; the Mantine note records
  `^8.3.18` as a **caret range** pinned only by the lockfile, which is more accurate than the brief asked for.
  **R15** backlog updated in all three places. 59 unpiped `EXIT_CODE=` captures.

**`resolveIdentifierLexically()` and everything it calls — `matchStatement`/`matchStatements`/`matchDeclarationList`
/`matchImportBinding`/`bindingNames`/`isFunctionLikeWithParams`/`isFunctionOrClassScope`/`collectHoistedVarNames` —
are accepted as correct and MUST NOT be rewritten.** They are four revisions of hard-won lexical-scope correctness
and this revision does not touch them. Only `collectLiterals()` (`:364`) is replaced.

---

## 2. The defect is the model, and it is mine (O-2)

Still passing at exit 0 on the Revision 4 script, reproduced 2026-08-25:

| Form | Why it passes |
|---|---|
| `cn('flex flex-col' as const)` | `AsExpression` not in the list |
| `cn('flex' satisfies string)` | `SatisfiesExpression` not in the list |
| `cn(...['overflow-hidden'])` | `SpreadElement` not in the list |
| `cn('flex ' + 'flex-col')` | `BinaryExpression` handles `&&`/`\|\|`/`??` and falls through on `+` |
| `cn((0, 'animate-spin'))` | comma operator falls through the same way |
| `let C = '…'` → `className={C}` | resolver folds `const` only |
| `var C = '…'` → `className={C}` | same |

The first five are the same class as `ParenthesizedExpression`, which **is** unwrapped — they are expression forms
that do not change the runtime value, or that compose one. They were omitted because R11/R12 enumerated shapes
instead of stating a rule. That is my defect, not the executor's: Revisions 1–4 implemented what each brief named,
completely and correctly.

The last two are different in kind, and §4 makes them a **stated boundary** rather than a gap.

---

## 3. Implementation requirements

### R16 — replace `collectLiterals()` with a class-expression evaluator

Delete the node-kind list. Implement `foldClassExpression(expr, sourceFile, seen)` returning a classification:

- `{ kind: 'static', findings: [{ node, text, declLine? }] }` — the expression can, on some execution path,
  contribute a statically-known class string
- `{ kind: 'dynamic' }` — it cannot be determined statically

The evaluator is defined by **rules over runtime semantics**, not by a list of node kinds. Every rule below must be
implemented as a rule, and the switch must end in a **single explicit default that returns `dynamic`** — that
default is the only permitted fall-through in the function.

**Rule 1 — value-preserving wrappers are transparent.** Any node that yields its operand's runtime value unchanged
folds to its operand: `ParenthesizedExpression`, `AsExpression`, `SatisfiesExpression`, `NonNullExpression`,
`TypeAssertionExpression` (`<T>x`). State the rule in the code as *"type-only and grouping syntax has no runtime
value of its own"* — so that a future TS syntax of the same nature is recognized as belonging here rather than
becoming Revision 6.

**Rule 2 — branching yields the union of reachable operands.** `? :` → both branches. `&&` → right operand.
`||`, `??` → both operands. Comma (`BinaryExpression` with `CommaToken`) → **right operand only**, since that is
the value of the expression. A form is a violation if **any** reachable branch is static.

**Rule 3 — composition preserves literal chunks.** `+`: fold both operands; if either side contributes a
non-whitespace literal chunk, that is a finding, whether or not the other side is dynamic — identical to how
`TemplateExpression` is already treated. Reuse the existing `templateHasNonWhitespaceText()` predicate as the
shared whitespace rule so templates and `+` cannot diverge.

**Rule 4 — aggregation sites recurse into their elements.** Array literal → every element. `SpreadElement` → fold
its expression; a spread of an array literal (directly, or through an identifier that resolves per Rule 5) yields
that array's elements, and a spread of anything else is `dynamic`. clsx object form → each property **key**
(`StringLiteral`, `NoSubstitutionTemplateLiteral`, or `ComputedPropertyName` folded through the evaluator); values
are conditions and are never folded. Mantine `classNames` object → each property **value**; keys are slot names and
are never folded. `ShorthandPropertyAssignment` and `SpreadAssignment` inside an object are `dynamic`.

**Rule 5 — bindings fold only when the language guarantees the value.** Unchanged from Revision 4 in mechanism:
`resolveIdentifierLexically()` finds the nearest binding; if it is a **simple, non-destructured `const` with an
initializer**, the initializer is folded through the evaluator; every other binding kind is opaque and stops the
search. §4 states why, and that statement is now part of the contract.

**Empty and whitespace-only results are never findings** — `''`, `` `${c}` ``, `' '` are `dynamic` in effect.

### R17 — state the boundary in the header, and make it auditable

- Rewrite the header's `WHAT IT CHECKS` block as the **five rules**, not as a list of node kinds. Keep the Task 667
  boundary sentence verbatim. Keep the Revision 1–4 change notes.
- State the fail-open direction explicitly: an expression form the evaluator does not recognize is classified
  `dynamic` and **permitted**, deliberately — a gate that threw on unfamiliar syntax would break on a TypeScript
  version bump. Say so in the header rather than leaving it implicit.
- Add an **`--explain <file>`** mode: for every inspected site in the given target file, print the site's line, its
  source text, and the evaluator's classification (`static` with the folded values, or `dynamic`). This is what
  makes the boundary auditable instead of asserted — a future reviewer runs it rather than re-reading a list. It
  reads nothing and writes nothing; `--explain` always exits 0.

### R18 — corpus-driven failure proof, replacing ad-hoc plants

The plant model has now failed twice for the same reason: plants that replay known shapes prove reproduction, not
boundary-holding. Replace it with a corpus.

Build a table of expression forms, each run through the **real script** in an isolated scratch root (the reviewer's
method in §1 is the reference), each row recording the form, the intended classification, and the **real unpiped
exit code**. The corpus must contain, at minimum:

1. **Every form from Revisions 1–4** — all 8 R11/R12 shapes, the R2 computed-key-via-identifier case, the R3
   `for`-shadow positive, and the R2/R3/R4 negative controls (parameter shadow, destructured shadow, `catch` shadow,
   nested-`var` shadow). All must keep their Revision 4 results. Any change here is a regression, not progress.
2. **The five newly-covered forms** from §2 — `as const`, `satisfies`, spread, `+`, comma → each exit 1.
3. **Rule-level cases the §2 list does not cover**, to prove the rules are rules: `<T>'flex'`, `'flex'!`,
   `cond ? ('a' as const) : 'b'` (two findings), `'flex ' + cls` (dynamic right side, literal chunk still found),
   `cls + ' flex'`, `cn(...ARR)` where `ARR` is a `const` array literal, `cn(...props.list)` (dynamic),
   `cn({ ['a' + 'b']: x })`, `classNames={{ root: x ?? 'min-h-screen' }}`.
4. **The declared-opaque forms** — `let C = '…'` and module-scope `var C = '…'` → exit 0, recorded as
   **intended**, with §4's reason cited inline, not as an unexplained pass.
5. **The permitted forms** — `styles.card`, `className={className}`, `overlay.className`, `` `${c}` ``,
   `classNames={{ root: styles.x }}` → exit 0.

Paste the `--explain` output for the post-revision target files alongside the corpus.

### R19 — session log and backlog

- New `Revision 5 note` at the top of `docs/sessions/2026-08-25-task766-homepage-literal-utility-exit.md`, stating
  the model change, that Revisions 1–4 were verified and accepted, and that no product code changed.
- §5: replace the plant tables with the R18 corpus. Keep the four prior revision notes and their history — the
  sequence is the evidence for why the model changed.
- §12: extend the `check-homepage-literal-utilities.mjs` row with Revision 5.
- **§4 boundary statement** (below) reproduced verbatim in both the script header and the session log.
- `docs/backlog.md`: Task 766 row and `Last Session` → `Revision 5`, citing this brief, within the 80-line limit.

---

## 4. The mutability boundary — binding, and stated once

Reproduce this in the script header and in the session log, verbatim:

> The gate folds a class expression to a static string only through bindings whose value the language itself
> fixes: a simple `const` with an initializer. `let`, `var`, parameters, destructured bindings, imports and
> catch bindings are **opaque by design** — each may hold a different value at the use site than at the
> declaration, and this gate does not guess at mutable state. This is a semantic boundary, not an unimplemented
> node kind: `let C = 'flex'; className={C}` is **not** reported, deliberately and permanently. Everything that
> is statically derivable through immutable bindings is reported; nothing that requires reasoning about
> reassignment is.

Two consequences to accept openly rather than discover later: a `let` holding a literal is a live hole, and a
determined author can always reach it. That is the price of a boundary that can be stated in one paragraph and
does not move. It is a better contract than a list that grows by five entries every review round.

---

## 5. Kickoff §6, and the wording that made this necessary (O-2, mine)

§6 says the gate *"rejects any static class literal at those sites"* without defining "static". That sentence is
unfalsifiable as written — every round could claim compliance and every round could be shown a new form. It stands,
and it now acquires a definition. Amend §6 by appending:

> *"Static"* means: the expression folds to a non-whitespace string under the class-expression evaluator
> (Revision 5), through value-preserving wrappers, branching, composition, aggregation, and simple `const`
> bindings only. Mutable bindings are opaque by design.

With that definition the sentence becomes testable, and the `--explain` mode is how it is tested.

---

## 6. Acceptance criteria

- **AC14 [R16]** — Given the evaluator, when the R18 corpus is run form by form through the real script, then every
  form classified `static` exits 1 with correct file, line and literal (and declaration line where indirection is
  involved), and every form classified `dynamic` exits 0. Every result is an actually-executed run with its real
  unpiped exit code; a form reasoned about but not run does not count.
- **AC15 [R16]** — Given the unmodified post-766 tree, when `npm run check:homepage-literal-utilities` is run, then
  it exits 0, and every Revision 1–4 result in R18.1 is unchanged.
- **AC16 [R17]** — Given the script, then `foldClassExpression` has exactly one fall-through, an explicit default
  returning `dynamic`; the header states the five rules, the fail-open direction, and §4's boundary verbatim; and
  `--explain` prints a classification for every inspected site in a named target file and exits 0.
- **AC17 [R19]** — Given the session log and backlog, then the Revision 5 note, the R18 corpus, the §12 row, the
  verbatim §4 boundary and the backlog state are all present.
- **AC18** — Given `git diff --stat HEAD` for `src/`, `package.json` and `docs/backlog.md`, then the product diff is
  unchanged from Revision 4: 7 tracked files, `+40/-17`, with `docs/backlog.md` the only one of the three whose
  content may differ.

---

## 7. Verification plan

No product code changes. Do **not** re-run `build`, `build-storybook`, `screenshots:assert`, `check:hydration`, the
route probe or the Storybook capture — nothing they measure can have changed, and reporting them is noise.

| Command | Required | Why |
|---|---|---|
| `npm run check:homepage-literal-utilities` | exit 0 | AC15, real tree |
| the R18 corpus | per-row | AC14 — the failure proof |
| `node scripts/check-homepage-literal-utilities.mjs --explain <each target file>` | exit 0 | AC16 |
| `npm run check:file-integrity` | exit 0 | changed/untracked files |
| `npm run check:mojibake` | exit 0 | the log gains pasted output |
| `git diff --stat HEAD -- src package.json docs/backlog.md` | — | AC18; paste it |

`npx tsc --noEmit` is not required — the gate is `.mjs`, outside the TS program.

---

## 8. Unchanged from earlier briefs

- **N-1 stays out of scope.** `check:homepage-literal-utilities` is still absent from `.github/workflows/`, and
  still has no `--verify-gate` self-test. Kickoff §7 authorizes an npm entry and nothing in `.github/`. It remains
  a **single owner re-scope item** for Sprint 65 review — CI wiring and a retained self-test answer the same
  question and should be decided together. Do not act on it here. `--explain` is not a self-test and does not
  close it.
- **`var(--motion-duration-spinner, 1s)` is still not requested.** Do not add it.
- The Mantine `^8.3.18` future-risk note is recorded and is not a defect to fix.

---

## 9. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Do not self-approve, do not commit, do not push. State:

1. The R18 corpus in full, with real exit codes.
2. Any form you believe the evaluator classifies **wrongly** — in either direction — including ones this brief did
   not list. You have found the last two rounds' defects faster than the brief did; that is expected here.
3. Whether §4's boundary held under your own adversarial probing, or whether you found a form that is statically
   derivable through immutable bindings and still passes. If you find one, it belongs to the evaluator, not to a
   Revision 6.
4. Anything in this brief that is wrong. Two of the last four rounds began with a defect in my brief, not in your
   implementation.

---

## FACTS

- The Revision 4 script exits 0 on all seven forms in §2; reproduced by the reviewer with the unmodified script.
- All Revision 1–4 claims were independently reproduced and hold, including every negative control.
- `collectLiterals()` (`:364`) handles: plain literals, `TemplateExpression`, parens, `&&`/`||`/`??`, `? :`, array
  literals, object `PropertyAssignment` keys, identifiers. Its `BinaryExpression` branch returns without a result
  for every operator other than the three named, and it has no default branch for other node kinds.
- `resolveIdentifierLexically()` and its helpers were verified correct against all Revision 2–4 cases.
- Product diff: 7 tracked files, `+40/-17`, unchanged across four revisions. `HEAD` = `846113faa`.

## INFERENCES

- A finite node-kind list cannot satisfy a universally quantified contract sentence; each round closes the named
  forms and leaves the unnamed ones, which is the observed pattern across Revisions 1–4.
- The five §2 forms fall out of Rules 1–4 without being enumerated, which is the test of whether the rules are
  really rules.

## UNKNOWNS

- Whether the owner accepts N-1 as a re-scope item or leaves the gate manual-only.
- Whether any statically-derivable-through-`const` form survives the evaluator. R18.3 and §9.3 exist to find out
  before approval rather than after.

## CONFLICTS

- Kickoff §6's universal sentence had no definition of "static". Resolved by §5's amendment; without it the
  sentence stays unfalsifiable and this cycle repeats.
